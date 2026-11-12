/**
 * VIDA 17 · A COTA DE MENSAGENS — no máximo 4 mensagens RECEBIDAS por ano do jogo, somando todos os contatos e todas as
 * fontes (a virada do ano, as ondas durante o ano, os encontros por acaso, as continuações de conversa, a imprensa, os
 * chamados das pessoas — iniciativas, convívio, namoro). O que você escreve não conta.
 *
 * Todas as fontes passam por `receber17` (checa e consome numa vez só). A prioridade decide quem fica com a última vaga:
 *   'alta'    o que é da vida da pessoa e pede você (um pedido de ajuda, a cobrança de uma combinação, a continuação de
 *             uma conversa que você começou, a parceria) — basta haver uma vaga;
 *   'normal'  o resto do que as pessoas mandam — basta haver uma vaga, mas só depois de a virada ter levado a sua parte;
 *   'baixa'   o acaso e o ruído (o fã, o encontro na fila do cinema) — só se sobrarem duas vagas.
 *
 * A contagem mora em `v.fatos['cota17_<ano>']` (sem campo novo no save; a chave do ano anterior sai quando o ano vira).
 * Cada mensagem recebe também o mês em que "chegou" (`mes17`), espalhado pelo ano conforme a ordem de chegada.
 */
import type { Vida } from '../tipos';
import { anoDe } from '../tempo';

export const MAX_RECEBIDAS17 = 4;
export type Prioridade17 = 'alta' | 'normal' | 'baixa';

const chave = (ano: number) => `cota17_${ano}`;

/** Quantas mensagens já chegaram neste ano do jogo. */
export function recebidas17(v: Vida): number {
  return v.fatos[chave(anoDe(v.t))] ?? 0;
}

/** Quantas ainda podem chegar neste ano. */
export function restantes17(v: Vida): number {
  return Math.max(0, MAX_RECEBIDAS17 - recebidas17(v));
}

/** Cabe mais uma, com esta prioridade? (Não consome.) */
export function podeReceber17(v: Vida, prioridade: Prioridade17 = 'normal'): boolean {
  const resta = restantes17(v);
  return prioridade === 'baixa' ? resta >= 2 : resta >= 1;
}

/**
 * Checa e consome uma vaga. Devolve o mês (0–11, do ano do jogo) em que a mensagem "chega" — espalhado: a 1ª no
 * começo do ano, a 2ª no 1º semestre, a 3ª no 2º, a 4ª no fim — ou `undefined` quando não cabe (a mensagem não chega).
 */
export function receber17(v: Vida, prioridade: Prioridade17 = 'normal'): number | undefined {
  if (!podeReceber17(v, prioridade)) return undefined;
  const ano = anoDe(v.t);
  const n = recebidas17(v);
  v.fatos[chave(ano)] = n + 1;
  delete v.fatos[chave(ano - 1)];
  delete v.fatos[chave(ano - 2)];
  const base = [0, 3, 6, 9][Math.min(3, n)];
  return base + (Math.abs(hash(`${v.id}_${ano}_${n}`)) % 3);
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h | 0;
}
