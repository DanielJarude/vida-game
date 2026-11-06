/** Efeitos curtos para o conteúdo. */

import { clamp, rngDe } from '../rng';
import type { Ctx } from './base';
import { capacidade, pagar } from '../sistemas/dinheiro';
import { liquidez } from '../sistemas/investimentos';
import { aplicarPerda, type ResultadoDaPerda } from '../sistemas/fortuna129';
import { dinheiro as fmt } from '../texto';
import { economiaLocal } from '../dados/lugares';

/**
 * REWORK 10 · ECO-02: um valor do conteúdo (escrito em reais de uma cidade média brasileira) no custo de vida de onde se
 * mora — não é câmbio: é o que a mesma coisa (a viagem, a diarista, o curso) custa ali, na moeda dali.
 */
export const local = (c: Ctx, x: number) => Math.max(10, Math.round(x * economiaLocal(c.v.moradia.municipioId).custo / 10) * 10);

export const feliz = (c: Ctx, n: number) => { c.v.mente.felicidade = clamp(c.v.mente.felicidade + n); };
export const estresse = (c: Ctx, n: number) => { c.v.mente.estresse = clamp(c.v.mente.estresse + n); };
export const saude = (c: Ctx, n: number) => { c.v.corpo.saude = clamp(c.v.corpo.saude + n); };
export const forma = (c: Ctx, n: number) => { c.v.corpo.forma = clamp(c.v.corpo.forma + n); };
export const cognicao = (c: Ctx, n: number) => { c.v.mente.cognicao = clamp(c.v.mente.cognicao + n); };
// REWORK 9.7 · ECO-01: um acontecimento não tira o que não existe (antes, um assalto de −1.500 com a conta zerada virava
// "conta que ficou sem pagar" e nome sujo no ano seguinte, sem dívida nenhuma por trás).
// VIDA 12.9 (a auditoria): a perda tirava só do que estava NA CONTA — quem deixava tudo aplicado nunca perdia nada num
// acontecimento. Agora sai da conta e, faltando, das aplicações (pelo preço do dia). O que não existe continua não se perdendo.
export const dinheiro = (c: Ctx, n: number) => {
  if (n >= 0) { c.v.financas.conta += n; return; }
  const tirar = Math.min(-n, liquidez(c.v).mobilizavel);
  if (tirar > 0) pagar(c.v, tirar);
};
/**
 * VIDA 12.9: uma perda que acontece de verdade, na escala de quem perde: conta, aplicações e — conforme o caso — bens vendidos
 * às pressas (`vender`) ou dívida nova (`endividar`: a aposta no crédito, o aval, o processo perdido). `sistemas/fortuna129`.
 */
export const perda = (c: Ctx, valor: number, motivo: string, opcoes: { vender?: boolean; endividar?: boolean; humor?: boolean } = {}): ResultadoDaPerda => aplicarPerda(c.v, valor, motivo, opcoes);
export const fato = (c: Ctx, chave: string) => { if (c.v.fatos[chave] === undefined) c.v.fatos[chave] = c.v.t; };

/** Muda a proximidade com a pessoa de um papel. */
export const prox = (c: Ctx, papel: string, n: number) => {
  const p = c.p[papel];
  if (!p) return;
  const vin = c.v.vinculos[p.id];
  if (!vin) return;
  vin.proximidade = clamp(vin.proximidade + n);
  vin.tUltimoContato = c.v.t;
};

export const tensao = (c: Ctx, papel: string, n: number) => {
  const p = c.p[papel];
  const vin = p && c.v.vinculos[p.id];
  if (vin) vin.tensao = clamp(vin.tensao + n);
};

export const envolvimento = (c: Ctx, papel: string, n: number) => {
  const p = c.p[papel];
  const rom = p && c.v.vinculos[p.id]?.romance;
  if (rom) rom.envolvimento = clamp(rom.envolvimento + n);
};

/** "o/a" + nome, concordado com a pessoa do papel. */
export const art = (c: Ctx, papel: string) => {
  const p = c.p[papel];
  return p.genero === 'feminino' ? 'a' : p.genero === 'masculino' ? 'o' : 'e';
};

/** Flexão pela pessoa do papel. */
export const gp = (c: Ctx, papel: string, masc: string, fem: string, neutro?: string) => {
  const g = c.p[papel]?.genero;
  return g === 'feminino' ? fem : g === 'masculino' ? masc : neutro ?? masc;
};

/**
 * Uma opção que custa `valor`: `true` se a conta cobre; se só as aplicações
 * cobrem, o bloqueio com o resgate possível (o jogador escolhe tirar); se
 * nem assim, o motivo — dizendo o que há, sem confundir patrimônio com conta.
 */
export function custa(c: Ctx, valor: number, semDinheiro = 'Não há esse dinheiro.'): true | string | { motivo: string; resgate: number } {
  const k = capacidade(c.v, valor);
  if (k.situacao === 'tem') return true;
  if (k.situacao === 'resgatando') return { motivo: `Custa ${fmt(valor)}; na conta há ${fmt(k.conta)}. O resto está nas aplicações${k.naBaixa.length ? ` (${k.naBaixa.join(' e ')} abaixo do que você pôs)` : ''}.`, resgate: k.falta };
  return k.aplicado > 0 ? `${semDinheiro} Somando conta e aplicações, você tem ${fmt(k.conta + k.aplicado)}.` : semDinheiro;
}

/**
 * VIDA 12.9: o que as apostas on-line já levaram — o MESMO número no texto e no efeito (sorteio derivado, fixo enquanto o
 * vício é o mesmo): 8 a 40 mil no custo do lugar, e mais para quem tem mais (até 25 vezes: o aplicativo tem limite, e
 * ninguém aposta a fortuna inteira pelo celular).
 */
export const perdaDasBets = (c: Ctx) => {
  const r = rngDe(c.v.id, 'bets_129', c.v.fatos['aposta_online'] ?? 0);
  const escala = clamp(liquidez(c.v).mobilizavel / 300_000, 1, 25);
  return Math.round(r.int(8, 40) * 1000 * economiaLocal(c.v.moradia.municipioId).custo * escala / 1000) * 1000;
};
