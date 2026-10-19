/**
 * Predisposições de nascença (cognitiva, física, artística; REWORK 9.6: constituição e temperamento): da semente,
 * estáveis, guardadas em `v.predisposicoes` na criação (e na migração v16). As duas novas, ausentes num save antigo,
 * valem 0 (neutras): a vida que já existia não ganha, ao ser aberta, um traço que nunca teve.
 * Módulo sem dependências, para que qualquer sistema possa ler.
 */

import type { Predisposicoes, Vida } from '../tipos';

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967295;
}

export type Eixo = keyof Predisposicoes;

/** Derivadas da semente da vida (o id): mesma vida, mesmas predisposições — sem gastar o gerador. */
export function derivarPredisposicoes(id: string): Predisposicoes {
  // `|| 0`: nunca −0 (o JSON do save grava 0, e a vida recarregada tem de ser a mesma).
  const eixo = (k: Eixo) => Math.round((hash(`${id}:pred:${k}`) + hash(`${id}:pred2:${k}`) - 1) * 100) / 100 || 0;
  return { cognitiva: eixo('cognitiva'), fisica: eixo('fisica'), artistica: eixo('artistica'), saude: eixo('saude'), animo: eixo('animo') };
}

export function predisposicao(v: Vida, e: Eixo): number {
  return (v.predisposicoes ?? derivarPredisposicoes(v.id))[e] ?? 0;
}

/**
 * REWORK 9.6 · ATR-01 — os cinco atributos que a tela Você mostra, cada um com UMA fonte de verdade no estado (nenhuma
 * cópia que possa divergir):
 *
 *   Saúde         corpo.saude       predisposição: constituição (`saude`)
 *   Físico        corpo.forma       predisposição: física
 *   Felicidade    mente.felicidade  predisposição: temperamento (`animo`)
 *   Beleza        corpo.aparencia   predisposição: a aparência de nascença (`corpo.aparenciaBase`)
 *   Inteligência  mente.cognicao    predisposição: cognitiva
 */
export type Atributo = 'saude' | 'fisico' | 'felicidade' | 'beleza' | 'inteligencia';
export const ATRIBUTOS: Atributo[] = ['saude', 'fisico', 'felicidade', 'beleza', 'inteligencia'];
export function valorDoAtributo(v: Vida, a: Atributo): number {
  return a === 'saude' ? v.corpo.saude : a === 'fisico' ? v.corpo.forma : a === 'felicidade' ? v.mente.felicidade : a === 'beleza' ? v.corpo.aparencia : v.mente.cognicao;
}

/**
 * REWORK 9.6 · ATR-01 — o quanto a aparência pesa PARA UMA PESSOA (0,2..1,6, da semente dela): gosto não é padrão
 * único. A beleza entra no primeiro interesse e na química multiplicada por isto — para uns quase nada, para outros um
 * pouco mais; nunca decide sozinha.
 */
export function pesoDaAparenciaPara(id: string): number {
  return Math.round((0.2 + 1.4 * hash(`${id}:gosto`)) * 100) / 100;
}

const lim = (x: number) => Math.round(Math.max(-1, Math.min(1, x)) * 100) / 100 || 0;
/**
 * Os atributos ESCOLHIDOS no nascimento → o que a vida guarda: o valor exato (a tela Nascer mostra o que será gravado)
 * e a predisposição que ele implica (o ponto para onde o atributo tende sem esforço). As escalas: o valor típico de um
 * bebê (saúde 86, físico 50, felicidade 72, inteligência 55) é predisposição 0.
 */
export function predisposicoesDosAtributos(a: Record<Atributo, number>): Pick<Predisposicoes, 'cognitiva' | 'fisica' | 'saude' | 'animo'> {
  return { saude: lim((a.saude - 86) / 10), fisica: lim((a.fisico - 50) / 30), animo: lim((a.felicidade - 72) / 14), cognitiva: lim((a.inteligencia - 55) / 25) };
}
