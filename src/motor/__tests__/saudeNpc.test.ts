/**
 * A saúde de quem não é o protagonista — e o que acontece com ela na sucessão.
 *
 * Testes causais: a condição de uma pessoa do mundo vem do MESMO catálogo do
 * protagonista, pesa na saúde e no risco de morte dela pela mesma conta,
 * sobrevive ao save e, quando ela passa a ser jogada, vira a condição dela
 * 1:1 (o nome, o diagnóstico conhecido ou não, o tratamento, o custo, a
 * saúde que já tinha perdido). Quem não tinha nada continua sem nada, e
 * nenhuma condição aparece antes da idade em que o catálogo permite.
 */

import { describe, expect, it } from 'vitest';
import { adulto, comFilho, pessoaNova } from './cenarios';
import { viver } from './ajuda';
import { idadePessoa } from '../nucleo';
import { interpretar } from '../save';
import { avancarAno } from '../ano';
import { criarRng, rngDe } from '../rng';
import { idadeEm } from '../tempo';
import { anoDeSaudeDaPessoa, condicaoDaPessoa, fatoresDaPessoa, garantirCondicoes, modeloCondicao, processarCorpoDePessoa, saudeConhecida } from '../sistemas/corpo';
import { fatoresSaude } from '../sistemas/estado';
import { orcamento } from '../sistemas/dinheiro';
import { sinaisDoCorpo } from '../sistemas/saude';
import { continuarComo, sucessores } from '../sistemas/sucessao';
import { calcularHeranca } from '../sistemas/partilha';
import type { CondicaoNpc, Vida } from '../tipos';

const ANO = 12;

/** Pai de 61 com uma filha de 36: ela tem pressão alta desde os 28 (com nome, tratada) e um diabetes que ninguém nomeou ainda. */
function familiaComFilhaDoente(semente = 11): { v: Vida; filha: string } {
  const v = adulto(61, { semente, genero: 'masculino' });
  const { p } = comFilho(v, 36, { casa: false, genero: 'feminino' });
  p.ocupacaoId = 'enfermeiro'; p.ocupacao = 'enfermeira'; p.renda = 5200; p.municipioId = v.moradia.municipioId;
  p.condicoes = [
    { id: 'hipertensao', tInicio: p.tNasc + 28 * ANO, gravidade: 1, diagnosticada: true, tDiagnostico: p.tNasc + 30 * ANO, tratando: true },
    { id: 'diabetes', tInicio: v.t - 6, gravidade: 2, diagnosticada: false, tratando: false }
  ];
  return { v, filha: p.id };
}

function morrer(v: Vida): Vida {
  if (v.morte) return v;
  const n = structuredClone(v);
  n.momento = null;
  n.morte = { t: n.t, causa: 'infarto', heranca: calcularHeranca(n) };
  return n;
}

describe('a condição de uma pessoa do mundo pesa nela', () => {
  it('com a condição, a pessoa perde no ano a saúde que o catálogo diz (a mesma perda do protagonista); sem, não perde', () => {
    const { v, filha } = familiaComFilhaDoente();
    const p = v.pessoas[filha];
    // A perda do ano é a do catálogo (sem tratamento: cheia; tratada: a menor), × 0,5 abaixo dos 45 (`estado.fatoresSaude`).
    p.condicoes = [{ ...p.condicoes![0], tratando: false }];
    const perda = anoDeSaudeDaPessoa(v, p, v.t, rngDe('ano'), true);
    expect(p.condicoes.some(c => c.id === 'hipertensao')).toBe(true);
    const esperada = p.condicoes.reduce((s, c) => s + (c.tratando ? modeloCondicao(c.id)!.perda[1] : modeloCondicao(c.id)!.perda[0]), 0) * 0.5;
    expect(perda).toBeCloseTo(esperada, 6);
    expect(perda).toBeGreaterThan(0);
    const sa = pessoaNova(v, 36, 'feminino');
    sa.condicoes = [];
    const perdaSa = anoDeSaudeDaPessoa(v, sa, v.t, rngDe('sa'), true);
    if (!sa.condicoes.length) expect(perdaSa).toBe(0);
  });

  it('e a saúde dela cai por isso, ano a ano (o mesmo sorteio do ano, com e sem as condições)', () => {
    const v = adulto(40, { semente: 7 });
    let soma = 0;
    for (let k = 0; k < 200; k++) {
      const com = pessoaNova(v, 50, 'feminino', { saude: 70 });
      com.condicoes = [
        { id: 'hipertensao', tInicio: v.t - 60, gravidade: 1, diagnosticada: true, tDiagnostico: v.t - 48, tratando: false },
        { id: 'diabetes', tInicio: v.t - 36, gravidade: 2, diagnosticada: true, tDiagnostico: v.t - 24, tratando: false }
      ];
      const sem = { ...structuredClone(com), condicoes: [] };
      processarCorpoDePessoa(v, criarRng(k), com, true);
      processarCorpoDePessoa(v, criarRng(k), sem, true);
      soma += sem.saude - com.saude;
    }
    // Sem tratamento, 1 + 1,5 pontos por ano (algumas começam a tratar no ano, e perdem menos).
    expect(soma / 200).toBeGreaterThan(1.2);
  });

  it('câncer sem tratamento aumenta o risco de morrer no ano (a mesma conta do protagonista)', () => {
    const v = adulto(40, { semente: 7 });
    let mortesCom = 0, mortesSem = 0;
    for (let k = 0; k < 400; k++) {
      const a = pessoaNova(v, 62, 'masculino', { saude: 70 });
      a.condicoes = [{ id: 'cancer', tInicio: v.t - 12, gravidade: 3, diagnosticada: true, tDiagnostico: v.t - 6, tratando: false }];
      const b = pessoaNova(v, 62, 'masculino', { saude: 70 });
      b.condicoes = [];
      if (processarCorpoDePessoa(v, criarRng(k), a)) mortesCom++;
      if (processarCorpoDePessoa(v, criarRng(k), b)) mortesSem++;
    }
    expect(mortesCom).toBeGreaterThan(mortesSem + 15);
  });

  it('o histórico da família conta: o filho de quem tem pressão alta com nome tem mais risco', () => {
    const v = adulto(40, { semente: 9 });
    const { p } = comFilho(v, 30, { casa: false });
    const m = modeloCondicao('hipertensao')!;
    const antes = m.risco(fatoresDaPessoa(v, p), 40);
    v.corpo.condicoes.push({ id: 'hipertensao', nome: 'pressão alta', tInicio: v.t - 24, cronica: true, gravidade: 1, tratando: true, diagnosticada: true, tDiagnostico: v.t - 24 });
    const depois = m.risco(fatoresDaPessoa(v, p), 40);
    expect(depois).toBeCloseTo(antes * 1.4, 6);
  });

  it('a família só sabe do que tem nome', () => {
    const { v, filha } = familiaComFilhaDoente();
    const texto = saudeConhecida(v.pessoas[filha])!;
    expect(texto).toBe('pressão alta (em tratamento)');
    expect(texto).not.toMatch(/diabetes/);
  });
});

describe('nenhuma condição antes da idade que o catálogo permite', () => {
  it('a reconstrução do passado (saves antigos) respeita a idade de cada condição', () => {
    const v = adulto(40, { semente: 5 });
    let total = 0;
    for (let k = 0; k < 300; k++) {
      const p = pessoaNova(v, k % 95, k % 2 ? 'masculino' : 'feminino');
      p.id = `teste${k}`;
      v.pessoas[p.id] = p;
      for (const c of garantirCondicoes(v, p)) {
        total++;
        const m = modeloCondicao(c.id)!;
        const i = idadeEm(p.tNasc, c.tInicio);
        expect(m.cronica).toBe(true);
        expect(c.tInicio).toBeGreaterThanOrEqual(p.tNasc);
        expect(c.tInicio).toBeLessThanOrEqual(v.t);
        expect(m.risco(fatoresDaPessoa(v, p, c.tInicio), i)).toBeGreaterThan(0);
        if (c.id === 'hipertensao') expect(i).toBeGreaterThanOrEqual(28);
        if (c.id === 'diabetes') expect(i).toBeGreaterThanOrEqual(35);
        if (c.id === 'coluna') expect(i).toBeGreaterThanOrEqual(25);
        if (c.id === 'depressao' || c.id === 'ansiedade') expect(i).toBeGreaterThanOrEqual(13);
      }
      if (k % 95 < 13) expect(p.condicoes).toEqual([]);
    }
    // A reconstrução não é vazia: gente mais velha tem o que a idade traz.
    expect(total).toBeGreaterThan(30);
  });

  it('ao longo dos anos de verdade, também (os filhos de uma vida jogada)', () => {
    let v = adulto(30, { semente: 21 });
    comFilho(v, 2);
    comFilho(v, 16, { genero: 'feminino' });
    v = viver(v, 20);
    for (const p of Object.values(v.pessoas)) for (const c of p.condicoes ?? []) {
      const i = idadeEm(p.tNasc, c.tInicio);
      expect(modeloCondicao(c.id)!.risco(fatoresDaPessoa(v, p, c.tInicio), i)).toBeGreaterThan(0);
    }
  });
});

describe('a sucessão leva a saúde junto (1:1)', () => {
  it('a filha que viveu 37 anos com pressão alta continua com ela — e com as consequências — ao virar a protagonista', () => {
    const { v: v0, filha } = familiaComFilhaDoente();
    // Um ano de verdade com a família: o motor acompanha a saúde dela (ela segue com a pressão alta, tratada).
    let v = viver(v0, 1);
    const h = v.pessoas[filha];
    expect(idadePessoa(v, h)).toBe(37);
    const hip = h.condicoes!.find(c => c.id === 'hipertensao')!;
    expect(hip).toBeTruthy();
    const dia = h.condicoes!.find(c => c.id === 'diabetes');
    const saudeDela = h.saude;
    v = morrer(v);
    expect(sucessores(v).find(s => s.pessoa.id === filha)!.saude).toMatch(/pressão alta \(em tratamento\)/);

    const r = continuarComo(v, filha);
    expect(r.erro).toBeUndefined();
    const n = r.vida;
    // A condição é a mesma: o catálogo, o começo, o diagnóstico, o tratamento.
    const c = n.corpo.condicoes.find(x => x.id === 'hipertensao')!;
    expect(c).toMatchObject({ nome: 'pressão alta', cronica: true, gravidade: 1, tInicio: hip.tInicio, tDiagnostico: hip.tDiagnostico, tratando: true, diagnosticada: true });
    expect(n.corpo.saude).toBe(saudeDela);
    // O que ainda não tinha nome continua sem nome — e o corpo dela dá os sinais.
    if (dia && !dia.diagnosticada) {
      expect(n.corpo.condicoes.find(x => x.id === 'diabetes')!.diagnosticada).toBe(false);
      expect(sinaisDoCorpo(n).some(s => s.id === 'diabetes')).toBe(true);
    }
    // As consequências: pesa na saúde (a tela "Você" diz por quê), custa no mês, e o diagnóstico não se anuncia de novo.
    expect(fatoresSaude(n).some(f => f.id === 'condicao:hipertensao' && f.efeito < 0)).toBe(true);
    expect(orcamento(n).saidas.some(l => l.rotulo === 'Remédios e consultas')).toBe(true);
    expect(n.fatos['diagnostico_hipertensao']).toBe(hip.tDiagnostico);
    // E a vida dela anda com a condição.
    const depois = avancarAno(n).vida;
    expect(depois.corpo.condicoes.some(x => x.id === 'hipertensao')).toBe(true);
    // Quem morreu deixa o próprio histórico na ficha: é a família de quem continua.
    const pai = Object.values(n.pessoas).find(p => !p.vivo && p.nome === v.eu.nome)!;
    expect(pai.condicoes).toEqual(v.corpo.condicoes.filter(x => x.cronica && !x.lesao).map(x => expect.objectContaining({ id: x.id })));
  });

  it('save e recarga preservam as condições (antes e depois da sucessão); forma inválida é recusada', () => {
    const { v: v0, filha } = familiaComFilhaDoente();
    const v = viver(v0, 1);
    const relida = interpretar(JSON.stringify(v));
    expect(relida.tipo).toBe('ok');
    if (relida.tipo === 'ok') expect(relida.vida.pessoas[filha].condicoes).toEqual(v.pessoas[filha].condicoes);
    const n = continuarComo(morrer(v), filha).vida;
    const relidaN = interpretar(JSON.stringify(n));
    expect(relidaN.tipo).toBe('ok');
    if (relidaN.tipo === 'ok') expect(JSON.stringify(relidaN.vida)).toBe(JSON.stringify(n));
    const ruim = JSON.parse(JSON.stringify(v));
    ruim.pessoas[filha].condicoes = [{ id: 'hipertensao', tInicio: 'ontem', gravidade: 1, diagnosticada: true, tratando: true }];
    const r = interpretar(JSON.stringify(ruim));
    expect(r.tipo).toBe('invalido');
  });

  it('save antigo, sem condições nas pessoas, continua válido', () => {
    const { v, filha } = familiaComFilhaDoente();
    for (const p of Object.values(v.pessoas)) delete p.condicoes;
    const relida = interpretar(JSON.stringify(v));
    expect(relida.tipo).toBe('ok');
    expect(v.pessoas[filha].condicoes).toBeUndefined();
  });

  it('quem não tinha condição continua saudável', () => {
    const { v: v0, filha } = familiaComFilhaDoente();
    const v = structuredClone(v0);
    v.pessoas[filha].condicoes = [];
    const n = continuarComo(morrer(v), filha).vida;
    expect(n.corpo.condicoes).toEqual([]);
    expect(sinaisDoCorpo(n)).toEqual([]);
    expect(orcamento(n).saidas.some(l => l.rotulo === 'Remédios e consultas')).toBe(false);
  });

  it('a condição da pessoa do mundo é lida pelo catálogo do protagonista, campo a campo', () => {
    const c: CondicaoNpc = { id: 'cancer', tInicio: 100, gravidade: 3, diagnosticada: true, tDiagnostico: 112, tarde: true, tratando: true };
    expect(condicaoDaPessoa(c)).toEqual({ id: 'cancer', nome: 'câncer', tInicio: 100, cronica: true, gravidade: 3, tratando: true, diagnosticada: true, tDiagnostico: 112, tarde: true });
    expect(condicaoDaPessoa({ ...c, id: 'inexistente' })).toBeUndefined();
  });
});
