/**
 * VIDA 32 — fundar um clube do zero: o nome (sem repetir um que existe), o custo, o começo no estadual (a última divisão
 * do país) e a subida quando o elenco fica bom.
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { executar, disponibilidade, type Acao } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { custoDeFundar32, processarClube20 } from '../v20/clubes/clubes20';
import { ligaDe } from '../sistemas/ligas';
import { interpretar } from '../save';
import type { Vida } from '../tipos';

const tenta = (v: Vida, a: Acao) => (podeTentar(disponibilidade(v, a)) ? executar(v, a).vida : v);
const C = (oque: unknown) => ({ tipo: 'clube20', oque } as Acao);

describe('fundar um clube de futebol', () => {
  it('não repete nome de clube que existe; cobra o custo; começa no estadual', () => {
    const v = adulto(35, { semente: 8, municipioId: 'campinas-sp' });
    v.financas.conta = 1e8;
    expect(podeTentar(disponibilidade(v, C({ op: 'fundar', nome: 'Flamengo', municipioId: 'campinas-sp' })))).toBe(false);
    expect(podeTentar(disponibilidade(v, C({ op: 'fundar', nome: 'X', municipioId: 'campinas-sp' })))).toBe(false);
    const x = tenta(v, C({ op: 'fundar', nome: 'Atlético Barão Geraldo', municipioId: 'campinas-sp' }));
    expect(x.clube20?.nome).toBe('Atlético Barão Geraldo');
    expect(x.clube20?.fundado32?.municipioId).toBe('campinas-sp');
    expect(v.financas.conta - x.financas.conta).toBe(custoDeFundar32('BR'));
    expect(ligaDe(x, 'BR').div['Atlético Barão Geraldo']).toBe(1);
    expect(interpretar(JSON.stringify(x)).tipo).toBe('ok');
  });

  it('as temporadas correm: o clube joga o Campeonato Paulista e, reforçado, sobe', () => {
    let v = adulto(35, { semente: 9, municipioId: 'campinas-sp' });
    v.financas.conta = 1e9;
    v = tenta(v, C({ op: 'fundar', nome: 'Real Campinas', municipioId: 'campinas-sp' }));
    const c = v.clube20!;
    // Um elenco muito acima do estadual (como quem investe pesado).
    for (const j of c.elenco) { j.forca = 74; j.potencial = 78; }
    c.caixa = 5e8;
    let subiu = false, estaduais = 0;
    for (let k = 0; k < 6; k++) {
      v.t += 12; processarClube20(v);
      for (const j of v.clube20!.elenco) j.forca = Math.max(j.forca, 74);
      const h = v.clube20!.historico[v.clube20!.historico.length - 1];
      if (h?.acesso) subiu = true;
      if (h?.estadual) estaduais++;
    }
    expect(estaduais).toBeGreaterThan(0);
    expect(subiu).toBe(true);
    expect(ligaDe(v, 'BR').div['Real Campinas']).toBeGreaterThan(1);
  });
});

import { custoDeFundarEquipe32, custoDoReforco32, nomeDaDivisao32, processarEquipes32 } from '../v32/equipes/equipe32';
const E = (oque: unknown) => ({ tipo: 'equipe32', oque } as Acao);
describe('fundar um time de quadra', () => {
  it('basquete: nasce na liga regional; com reforços sobe até o NBB; um por modalidade; entra no save', () => {
    let v = adulto(35, { semente: 12, municipioId: 'franca-sp' });
    v.financas.conta = 5e8;
    v = tenta(v, E({ op: 'fundar', modalidade: 'basquete', nome: 'Franca Leões', municipioId: 'franca-sp' }));
    const e = v.equipes32![0];
    expect(e.nivel).toBe(1);
    expect(v.financas.conta).toBe(5e8 - custoDeFundarEquipe32('BR'));
    expect(nomeDaDivisao32(e, 3)).toBe('NBB');
    expect(podeTentar(disponibilidade(v, E({ op: 'fundar', modalidade: 'basquete', nome: 'Outro', municipioId: 'franca-sp' })))).toBe(false);
    let titulos = 0;
    for (let k = 0; k < 12; k++) {
      const eq = v.equipes32![0];
      eq.caixa += custoDoReforco32(eq, true) * 2;
      v = tenta(v, E({ op: 'reforco', id: eq.id, pesado: true }));
      v.t += 12; processarEquipes32(v);
      titulos += v.equipes32![0].historico.filter(h => h.titulo && h.nivel === 3).length > 0 ? 1 : 0;
    }
    const h = v.equipes32![0].historico;
    expect(h.length).toBe(12);
    expect(Math.max(...h.map(x => x.nivel))).toBe(3);
    expect(h.every(x => x.posicao >= 1 && x.posicao <= 12)).toBe(true);
    expect(interpretar(JSON.stringify(v)).tipo).toBe('ok');
  });
});
