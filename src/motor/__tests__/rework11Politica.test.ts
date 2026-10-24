/**
 * REWORK 11 · Fase E — política e Submundo: o mandato sem "pedir aumento", as ações de cada cargo (com efeito), as
 * eleições de cima mais difíceis, a corrupção ao alcance de quem tem mandato, o crime que não é salário e os contatos
 * que contam.
 */

import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { disponibilidade, executar, type Acao } from '../acoes';
import { transacao } from '../nucleo';
import { criarRng } from '../rng';
import { podeTentar } from '../plausibilidade';
import type { CargoEletivo, Vida } from '../tipos';
import { entrarNaPolitica, fatoresDaEleicao, processarPolitica, proximaEleicao } from '../sistemas/politica';
import { ACOES_DO_CARGO } from '../sistemas/mandato';
import { acoesDoTrabalho } from '../sistemas/profissao';
import { categoriaPara, chanceDeAnoSeco, processarIlicito } from '../sistemas/ilicito';
import { processarMargem } from '../sistemas/margem';
import { criarPessoa, vincular } from '../pessoas';

const BASE = adulto(40, { semente: 5100 });
const em = (v: Vida, f: (x: Vida, r: ReturnType<typeof criarRng>) => void): Vida => transacao(v, (x, r) => { f(x, r); }).vida;
const A = (oque: string, valor?: string) => ({ tipo: 'politica', oque, valor } as unknown as Acao);

/** Alguém em exercício do cargo (a posse pelo motor: o emprego eletivo, o subsídio, o mandato). */
function emMandato(cargo: CargoEletivo, o: { apoio?: number; reputacao?: number } = {}): Vida {
  return em(BASE, (x, r) => {
    x.id = `${x.id}-pol-${cargo}`;
    x.trabalho.atual = undefined; x.caminhos.envolvimento = undefined; x.justica = undefined; x.momento = null;
    const p = entrarNaPolitica(x, 'comunidade');
    p.partido = 'Partido Ipê'; p.tFiliacao = x.t - 48; p.fase = 'eleito'; p.apoio = o.apoio ?? 50; p.reputacao = o.reputacao ?? 45; p.prioridade = 'saude';
    p.posse = { cargo, t: x.t };
    x.anoAtual = { acoes: [] };
    processarPolitica(x, r);
  });
}
const idsDoCargo = (v: Vida) => [...acoesDoTrabalho(v, disponibilidade).agora, ...acoesDoTrabalho(v, disponibilidade).mais].map(x => x.id).filter(id => id.startsWith('pol_cargo_')).sort();

describe('POL-03 · o subsídio não se negocia', () => {
  for (const c of ['vereador', 'prefeito', 'deputado_federal', 'governador'] as CargoEletivo[]) {
    it(`${c}: "pedir aumento" é impossível no motor (e não aparece no painel)`, () => {
      const v = emMandato(c);
      expect(v.trabalho.atual?.contrato).toBe('eletivo');
      const d = disponibilidade(v, { tipo: 'pedir_aumento' });
      expect(podeTentar(d)).toBe(false);
      expect(d.motivo).toMatch(/fixado em lei/);
      expect([...acoesDoTrabalho(v, disponibilidade).agora, ...acoesDoTrabalho(v, disponibilidade).mais].some(x => x.id === 'aumento')).toBe(false);
    });
  }
});

describe('POL-02 · o cargo determina as ações', () => {
  it('vereador e prefeito têm conjuntos diferentes; deputado e governador também', () => {
    const ver = idsDoCargo(emMandato('vereador'));
    const pre = idsDoCargo(emMandato('prefeito'));
    const dep = idsDoCargo(emMandato('deputado_federal'));
    const gov = idsDoCargo(emMandato('governador'));
    expect(ver).toContain('pol_cargo_projeto_lei');
    expect(ver).toContain('pol_cargo_fiscalizar');
    expect(pre).toContain('pol_cargo_orcamento');
    expect(pre).toContain('pol_cargo_obra');
    expect(ver.some(id => pre.includes(id))).toBe(false);
    expect(dep.some(id => gov.includes(id))).toBe(false);
    expect(ACOES_DO_CARGO.senador).toContain('sabatina');
  });
  it('cada ação tem efeito real (entrega, aprovação, base ou desgaste) — e só duas por ano', () => {
    for (const [cargo, ids] of [['vereador', ['projeto_lei', 'emenda', 'fiscalizar']], ['prefeito', ['orcamento', 'obra', 'vetar']]] as [CargoEletivo, string[]][]) {
      let v = emMandato(cargo);
      const antes = JSON.stringify({ m: v.caminhos.politica!.mandato, a: v.caminhos.politica!.apoio, d: v.caminhos.politica!.desgaste, r: v.caminhos.politica!.reputacao });
      v = executar(v, A('cargo', ids[0])).vida;
      const depois = JSON.stringify({ m: v.caminhos.politica!.mandato, a: v.caminhos.politica!.apoio, d: v.caminhos.politica!.desgaste, r: v.caminhos.politica!.reputacao });
      expect(depois).not.toBe(antes);
      expect(podeTentar(disponibilidade(v, A('cargo', ids[0])))).toBe(false);
      v = executar(v, A('cargo', ids[1])).vida;
      expect(podeTentar(disponibilidade(v, A('cargo', ids[2])))).toBe(false);
    }
  });
  it('o prefeito não apresenta projeto de lei como vereador; o vereador não lança obra', () => {
    expect(podeTentar(disponibilidade(emMandato('prefeito'), A('cargo', 'projeto_lei')))).toBe(false);
    expect(podeTentar(disponibilidade(emMandato('vereador'), A('cargo', 'obra')))).toBe(false);
  });
});

describe('POL-04 · eleições de cima são disputadas', () => {
  it('a trajetória mais forte possível (base e nome no teto, partido grande, campanha média) tem chance aberta para governador e senador — não de favorito', () => {
    const v = em(emMandato('deputado_estadual', { apoio: 95, reputacao: 95 }), x => { x.fatos['pol_partido_porte'] = 0; x.caminhos.politica!.desgaste = 10; });
    const t = proximaEleicao(v.t + 12).t;
    for (const c of ['governador', 'senador'] as CargoEletivo[]) {
      const x = fatoresDaEleicao(v, c, t, 12).chance;
      expect(x).toBeGreaterThan(0.2);
      expect(x).toBeLessThan(0.65);
    }
    expect(fatoresDaEleicao(v, 'deputado_federal', t, 12).chance).toBeGreaterThan(fatoresDaEleicao(v, 'governador', t, 12).chance);
  });
  it('uma trajetória média (base 45, nome 40) quase nunca leva o governo do estado', () => {
    const v = emMandato('vereador', { apoio: 45, reputacao: 40 });
    expect(fatoresDaEleicao(v, 'governador', proximaEleicao(v.t + 12).t, 12).chance).toBeLessThan(0.1);
  });
});

describe('POL-06 · a corrupção chega a quem tem mandato', () => {
  it('o vereador em exercício é chamado para a corrupção (não para a fraude de escritório)', () => {
    const v = emMandato('vereador');
    const cats = new Set<string>();
    for (let s = 0; s < 30; s++) cats.add(categoriaPara(v, criarRng(s)));
    expect(cats.has('corrupcao')).toBe(true);
    expect(cats.has('fraude')).toBe(false);
  });
});

/** Alguém ativo no caminho, sem exposição (para medir o ano, não a investigação). */
function noCaminho(o: { contatos?: number; reputacao?: number } = {}): Vida {
  return em(BASE, (x, r) => {
    x.id = `${x.id}-crime`;
    x.justica = undefined; x.momento = null;
    const ids: string[] = [];
    for (let k = 0; k < (o.contatos ?? 0); k++) { const p = criarPessoa(x, r, { idade: 35, municipioId: x.moradia.municipioId }); vincular(x, p, { origem: 'vizinhanca', estagio: 'conhecido', proximidade: 25, convivio: [] }); ids.push(p.id); }
    x.caminhos.envolvimento = { categoria: 'mercado', nivel: 2, tInicio: x.t - 24, exposicao: 0, ganhos: 0, reputacao: o.reputacao ?? 30, contatos: ids, contatoId: ids[0] };
  });
}

describe('SUB-02 · o crime não é salário', () => {
  it('em 200 anos ativos, entre 12% e 30% não rendem nada — e quem está fundo ainda perde', () => {
    let secos = 0, perdeu = 0;
    const base = noCaminho({ contatos: 1 });
    for (let k = 0; k < 200; k++) {
      const v0 = em(base, x => { x.t += k * 12; x.caminhos.envolvimento!.exposicao = 0; });
      const conta = v0.financas.conta;
      const v = em(v0, (x, r) => { processarIlicito(x, r); });
      const env = v.caminhos.envolvimento!;
      if (env.ganhos === 0) { secos++; if (v.financas.conta < conta) perdeu++; }
    }
    expect(secos).toBeGreaterThanOrEqual(24);
    expect(secos).toBeLessThanOrEqual(60);
    expect(perdeu).toBeGreaterThan(0);
  });
  it('a chance do ano seco depende do meio e dos contatos (fica entre 14% e 26%)', () => {
    const fraco = noCaminho({ contatos: 0, reputacao: 0 });
    const forte = noCaminho({ contatos: 4, reputacao: 90 });
    expect(chanceDeAnoSeco(fraco, fraco.caminhos.envolvimento!)).toBeGreaterThan(chanceDeAnoSeco(forte, forte.caminhos.envolvimento!));
    expect(chanceDeAnoSeco(forte, forte.caminhos.envolvimento!)).toBeGreaterThanOrEqual(0.14);
  });
});

describe('SUB-03 · os contatos contam', () => {
  it('sem ninguém vivo do caminho, o trabalho maior não chega; com contatos, chega — e um contato pode trair', () => {
    let sem = 0, com = 0, traiu = 0;
    for (let k = 0; k < 60; k++) {
      const a = em(noCaminho({ contatos: 0, reputacao: 70 }), x => { x.t += k * 12; x.caminhos.envolvimento!.contatoId = undefined; x.caminhos.envolvimento!.contatos = []; processarMargem(x); });
      if (a.fatos['ilic_trabalho'] === a.t) sem++;
      const b = em(noCaminho({ contatos: 3, reputacao: 70 }), x => { x.t += k * 12; processarMargem(x); });
      if (b.fatos['ilic_trabalho'] === b.t) com++;
      if ((b.caminhos.envolvimento!.traicoes ?? 0) > 0) traiu++;
    }
    expect(sem).toBe(0);
    expect(com).toBeGreaterThan(10);
    expect(traiu).toBeGreaterThan(0);
  });
});
