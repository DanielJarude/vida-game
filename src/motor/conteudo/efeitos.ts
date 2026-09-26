/** Efeitos curtos para o conteúdo. */

import { clamp } from '../rng';
import type { Ctx } from './base';
import { capacidade } from '../sistemas/dinheiro';
import { dinheiro as fmt } from '../texto';

export const feliz = (c: Ctx, n: number) => { c.v.mente.felicidade = clamp(c.v.mente.felicidade + n); };
export const estresse = (c: Ctx, n: number) => { c.v.mente.estresse = clamp(c.v.mente.estresse + n); };
export const saude = (c: Ctx, n: number) => { c.v.corpo.saude = clamp(c.v.corpo.saude + n); };
export const forma = (c: Ctx, n: number) => { c.v.corpo.forma = clamp(c.v.corpo.forma + n); };
export const cognicao = (c: Ctx, n: number) => { c.v.mente.cognicao = clamp(c.v.mente.cognicao + n); };
export const dinheiro = (c: Ctx, n: number) => { c.v.financas.conta += n; };
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
