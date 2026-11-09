/**
 * VIDA 14 · Política: as medidas com efeito que dura (contas, indicadores, aprovação, legado), a filiação (permanência
 * mínima e justa causa) e a Presidência de Portugal (eleição em data própria, candidatura de cidadãos, Belém não governa).
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { criarRng } from '../rng';
import { definirPaisCorrente } from '../mundo/moeda';
import { cidadesDoPais } from '../dados/lugares';
import { PRESIDENCIA, acoesPoliticas, entrarNaPolitica, podeConcorrer, processarPolitica, trocarDePartido } from '../sistemas/politica';
import { presidencia } from '../sistemas/presidencia129';
import { disponibilidade } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { eleicaoBelemNaJanela, gestao14, leituraPolitica14, PERMANENCIA_MINIMA_14 } from '../v14/politica/politica14';
import { interpretar } from '../save';
import type { Vida } from '../tipos';

function prefeito(cargo: 'prefeito' | 'vereador' = 'prefeito'): Vida {
  definirPaisCorrente('BR');
  const v = structuredClone(adulto(40, { semente: 1401 }));
  v.caminhos.politica = undefined; v.anoAtual = { acoes: [] };
  const p = entrarNaPolitica(v, 'comunidade');
  p.partido = p.partido ?? 'PSD'; p.tFiliacao = v.t - 60; p.partidos = [{ sigla: p.partido, tInicio: p.tFiliacao }];
  p.fase = 'mandato'; p.apoio = 50;
  p.mandato = { cargo, tInicio: v.t, tFim: v.t + 48, aprovacao: 50, feito: 0 };
  return v;
}

describe('VIDA 14 · gestão: medidas com consequência', () => {
  it('a medida em vigor custa às contas, faz efeito depois da carência e mexe na aprovação; vira legado no fim', () => {
    const v = prefeito();
    const controle = structuredClone(v);
    const r = criarRng(7);
    expect(podeTentar(PRESIDENCIA.disp!(v, 'm14:inv_saude'))).toBe(true);
    PRESIDENCIA.exec!(v, r, 'm14:inv_saude');
    const g = gestao14(v)!;
    expect(g.medidas[0]).toMatchObject({ id: 'inv_saude', estado: 'em_vigor', anos: 4, carencia: 1 });
    // O vereador não executa obra: é ato do Executivo.
    const ver = prefeito('vereador');
    expect(PRESIDENCIA.disp!(ver, 'm14:inv_saude').grau).toBe('impossivel');
    gestao14(controle);
    for (let k = 0; k < 3; k++) for (const x of [v, controle]) { x.t += 12; x.anoAtual = { acoes: [] }; processarPolitica(x, criarRng(100 + k)); }
    const g2 = gestao14(v)!;
    expect(g2.anos.length).toBe(3);
    expect(g2.saldo).toBeLessThan(2); // o custo pesa no caixa
    expect(g2.populacao).toBeGreaterThan(gestao14(controle)!.populacao + 3); // o efeito apareceu depois da carência
    expect(g2.divida).toBeGreaterThan(gestao14(controle)!.divida); // e o custo virou dívida
    expect(leituraPolitica14(v)!.gestao!.emVigor[0].efeito).toMatch(/melhora a vida da população/);
    // Fim do mandato: a gestão vira legado.
    v.caminhos.politica!.mandato = undefined; v.caminhos.politica!.fase = 'entre_mandatos';
    v.t += 12; processarPolitica(v, criarRng(9));
    expect(v.caminhos.politica!.v14!.legados!.length).toBe(1);
    expect(v.caminhos.politica!.v14!.gestao).toBeUndefined();
  });

  it('o limite de duas medidas por ano e a votação com quórum', () => {
    const v = prefeito();
    const r = criarRng(3);
    PRESIDENCIA.exec!(v, r, 'm14:inv_saude');
    PRESIDENCIA.exec!(v, r, 'm14:pol_seguranca');
    expect(PRESIDENCIA.disp!(v, 'm14:inv_escolas').grau).toBe('incompativel');
    const v2 = prefeito();
    const d = PRESIDENCIA.disp!(v2, 'm14:trib_imovel');
    expect(d.grau).toBe('improvavel');
    PRESIDENCIA.exec!(v2, criarRng(5), 'm14:trib_imovel');
    expect(gestao14(v2)!.medidas[0].votos).toBeDefined();
  });

  it('save: a gestão sobrevive à ida e volta', () => {
    const v = prefeito();
    PRESIDENCIA.exec!(v, criarRng(1), 'm14:adm_auditoria');
    const l = interpretar(JSON.stringify(v));
    expect(l.tipo).toBe('ok');
    if (l.tipo === 'ok') expect(l.vida.caminhos.politica!.v14!.gestao!.medidas[0].id).toBe('adm_auditoria');
  });
});

describe('VIDA 14 · filiação: permanência mínima e justa causa', () => {
  it('troca recente é vetada; a justa causa abre a porta e protege o mandato', () => {
    const v = prefeito('vereador');
    const p = v.caminhos.politica!;
    trocarDePartido(v, criarRng(1), 'PSB', 1);
    v.anoAtual = { acoes: [] };
    v.t += 13;
    const veto = disponibilidade(v, { tipo: 'politica', oque: 'trocar_partido' } as never);
    expect(veto.grau).toBe('incompativel');
    expect(veto.motivo).toMatch(/dois anos/);
    p.v14!.partido!.excecao = { tipo: 'perseguicao', t: v.t };
    expect(podeTentar(disponibilidade(v, { tipo: 'politica', oque: 'trocar_partido' } as never)) || disponibilidade(v, { tipo: 'politica', oque: 'trocar_partido' } as never).grau === 'irregular').toBe(true);
    trocarDePartido(v, criarRng(2), 'PT', 1);
    expect(p.mandato).toBeDefined(); // justa causa: o mandato fica
    expect(p.partidos!.find(x => x.sigla === 'PSB')!.como).toBe('justa_causa');
    v.t += PERMANENCIA_MINIMA_14;
    expect(leituraPolitica14(v)!.filiacao!.regra).toMatch(/Pode trocar/);
  });
});

describe('VIDA 14 · Portugal: a Presidência da República', () => {
  function portugues(): Vida {
    definirPaisCorrente('PT');
    const v = structuredClone(adulto(30, { semente: 1402 }));
    const muni = (cidadesDoPais('PT').find(m => m.perfil === 'metropole') ?? cidadesDoPais('PT')[0]).id;
    v.moradia.municipioId = muni; v.eu.municipioNatal = muni; v.eu.nacionalidades = ['PT'];
    v.t = 2030 * 12 + 3; v.eu.tNasc = v.t - 60 * 12; v.anoAtual = { acoes: [] };
    v.caminhos.politica = undefined;
    const p = entrarNaPolitica(v, 'notoriedade');
    p.reputacao = 92; p.apoio = 80; p.fase = 'entre_mandatos';
    return v;
  }

  it('a candidatura aparece (janeiro de 2031, sem partido) e Belém não governa', () => {
    let eleito = 0;
    for (let s = 0; s < 12 && !eleito; s++) {
      const v = portugues();
      v.id = `pt14-${s}`;
      expect(eleicaoBelemNaJanela(v)).toEqual({ ano: 2031, t: 2031 * 12 });
      expect(podeTentar(podeConcorrer(v, 'presidente', 2031 * 12))).toBe(true);
      const acoes = acoesPoliticas(v, disponibilidade);
      expect(acoes.some(a => a.id === 'pol14_pt_candidatura')).toBe(true);
      PRESIDENCIA.exec!(v, criarRng(s), 'pt_candidatura');
      expect(v.caminhos.politica!.campanha).toMatchObject({ cargo: 'presidente', tEleicao: 2031 * 12 });
      expect(presidencia(v).campanha!.via).toBe('independente');
      v.t = 2031 * 12; v.anoAtual = { acoes: [] }; processarPolitica(v, criarRng(s));
      if (!presidencia(v).candidaturas.length) { v.t += 1; processarPolitica(v, criarRng(s + 1)); } // o segundo turno
      const c = presidencia(v).candidaturas.slice(-1)[0];
      expect(c).toBeDefined();
      if (c.resultado !== 'eleito') continue;
      eleito++;
      v.t = 2031 * 12 + 2; processarPolitica(v, criarRng(s + 50));
      const p = v.caminhos.politica!;
      expect(p.mandato?.cargo).toBe('presidente');
      expect(presidencia(v).governo).toBeUndefined();
      expect(p.v14!.belem!.governo).toBeDefined();
      v.t += 12; v.anoAtual = { acoes: [] }; processarPolitica(v, criarRng(s + 60));
      const ids = acoesPoliticas(v, disponibilidade).map(a => a.id);
      expect(ids).toContain('pol14_pt_promulgar');
      expect(ids).not.toContain('pres_economia');
      expect(PRESIDENCIA.disp!(v, 'pt_dissolver').grau).toBe('requisito'); // ouvir o Conselho de Estado antes
    }
    expect(eleito).toBeGreaterThan(0);
    definirPaisCorrente('BR');
  });
});
