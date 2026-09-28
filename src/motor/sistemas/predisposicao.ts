/**
 * Predisposições de nascença (cognitiva, física, artística): da semente,
 * estáveis, guardadas em `v.predisposicoes` na criação (e na migração v16).
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
  return { cognitiva: eixo('cognitiva'), fisica: eixo('fisica'), artistica: eixo('artistica') };
}

export function predisposicao(v: Vida, e: Eixo): number {
  return (v.predisposicoes ?? derivarPredisposicoes(v.id))[e] ?? 0;
}
