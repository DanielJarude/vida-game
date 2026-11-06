/**
 * VIDA 12.9 — receber gente e sair junto; presentes por ocasião. Consequências reais: proximidade de cada convidado,
 * custo pago, vez no ano (dividida com o uso do cômodo), casa decide onde e quantos, pobreza limita, pazes/clima,
 * ciúme do par com o ex, multa do condomínio.
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { transacao } from '../nucleo';
import { disponibilidade, executar } from '../acoes';
import { convidaveis, capacidade, custoDoEncontro } from '../sistemas/encontros129';
import { encontro } from '../dados/encontros129';
import { ocasioesDoPresente } from '../sistemas/presentes';
import type { Vida } from '../tipos';

function comAmigos(conta = 50_000): Vida {
  return transacao(adulto(32, { semente: 1294, municipioId: 'sao-paulo-sp' }), x => {
    x.financas.conta = conta;
    let k = 0;
    for (const vin of Object.values(x.vinculos)) {
      const p = x.pessoas[vin.pessoaId];
      if (!p || !p.vivo || p.especie) continue;
      p.municipioId = x.moradia.municipioId;
      if (!vin.parentesco && vin.proximidade < 35) vin.proximidade = 40 + (k++ % 20);
    }
  }).vida;
}

describe('12.9 · encontros', () => {
  it('jantar em casa: paga, cada convidado chega mais perto, uma vez por ano', () => {
    let v = comAmigos();
    const m = encontro('jantar')!;
    const gente = convidaveis(v, m).slice(0, 3).map(p => p.id);
    expect(gente.length).toBe(3);
    const antes = gente.map(id => v.vinculos[id].proximidade);
    const conta = v.financas.conta;
    const r = executar(v, { tipo: 'encontro', oque: 'jantar', convidados: gente });
    v = r.vida;
    expect(v.financas.conta).toBeLessThan(conta);
    expect(conta - v.financas.conta).toBeGreaterThanOrEqual(custoDoEncontro(r.vida, m, 3) - 1);
    gente.forEach((id, k) => expect(v.vinculos[id].proximidade).toBeGreaterThan(antes[k]));
    expect(disponibilidade(v, { tipo: 'encontro', oque: 'jantar', convidados: gente }).grau).toBe('incompativel');
  });

  it('a casa decide: sem piscina não há festa na piscina; o apartamento pequeno limita a festa', () => {
    const v = comAmigos();
    expect(disponibilidade(v, { tipo: 'encontro', oque: 'piscina', convidados: [] }).grau).toBe('impossivel');
    const cap = capacidade(v, encontro('festa')!);
    expect(cap).toBeGreaterThan(0);
    expect(cap).toBeLessThan(encontro('festa')!.convidados[1]);
  });

  it('pobreza: sem dinheiro para o caprichado, dá o simples ou rachar a conta', () => {
    const v = comAmigos(300);
    const gente = convidaveis(v, encontro('saida')!).slice(0, 3).map(p => p.id);
    expect(disponibilidade(v, { tipo: 'encontro', oque: 'saida', convidados: gente, jeito: 'caprichado' }).grau).not.toBe('permitido');
    const rachar = disponibilidade(v, { tipo: 'encontro', oque: 'saida', convidados: gente, rachar: true });
    expect(['permitido', 'improvavel', 'irregular']).toContain(rachar.grau);
  });

  it('o par e o ex na mesma festa: ciúme (tensão do par sobe)', () => {
    let v = comAmigos(200_000);
    const ids = convidaveis(v, encontro('festa')!).filter(p => !v.vinculos[p.id].parentesco).slice(0, 6).map(p => p.id);
    v = transacao(v, x => {
      x.vinculos[ids[0]].romance = { estagio: 'namoro', tEstagio: x.t - 12, envolvimento: 60 };
      x.vinculos[ids[1]].romance = { estagio: 'ex', tEstagio: x.t - 36, envolvimento: 10, fim: 'termino' };
      x.vinculos[ids[1]].proximidade = 50;
    }).vida;
    const t0 = v.vinculos[ids[0]].tensao;
    const r = executar(v, { tipo: 'encontro', oque: 'festa', convidados: ids });
    expect(r.vida.vinculos[ids[0]].tensao).toBeGreaterThan(t0);
  });

  it('a festa na piscina divide a vez no ano com o uso do cômodo', () => {
    const v = transacao(comAmigos(), x => { x.fatos['ucomodo:lazer:churrasco'] = x.t; }).vida;
    const d = disponibilidade(v, { tipo: 'encontro', oque: 'churrasco', convidados: [] });
    expect(d.grau).not.toBe('permitido');
  });
});

describe('12.9 · presentes por ocasião', () => {
  it('aniversário e Natal são ocasiões de todo mundo; bodas só do cônjuge; cada ocasião um por ano', () => {
    let v = comAmigos(80_000);
    const id = Object.values(v.vinculos).find(vin => vin.parentesco && v.pessoas[vin.pessoaId]?.vivo)!.pessoaId;
    const oc = ocasioesDoPresente(v, id).map(o => o.id);
    expect(oc).toContain('aniversario');
    expect(oc).toContain('fim_de_ano');
    expect(oc).not.toContain('bodas');
    const a = { tipo: 'presentear', pessoaId: id, coisaId: 'livros', ocasiao: 'aniversario' } as const;
    v = executar(v, a).vida;
    expect(disponibilidade(v, a).grau).toBe('incompativel');
    // o de Natal ainda pode, no mesmo ano
    expect(disponibilidade(v, { ...a, coisaId: 'jogos_tabuleiro', ocasiao: 'fim_de_ano' }).grau).not.toBe('incompativel');
    expect(disponibilidade(v, { ...a, ocasiao: 'bodas' }).grau).toBe('impossivel');
  });
});
