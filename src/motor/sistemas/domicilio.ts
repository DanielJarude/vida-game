/**
 * O domicílio: quem mora junto e quanto entra na casa.
 *
 * Enquanto o jogador mora com a família, a casa é sustentada pela renda dos
 * adultos dela (pais, avós). Quando sai de casa, o domicílio passa a ser o
 * dele — e o parceiro que mora junto soma renda e despesa.
 */

import type { Pessoa, Vida } from '../tipos';
import { idadePessoa, vinculosVivos } from '../nucleo';
import { liquido } from './renda';

export function moradores(v: Vida): Pessoa[] {
  return vinculosVivos(v).filter(x => x.vin.convivio.includes('casa') && !x.p.especie).map(x => x.p);
}

/** Renda mensal líquida do próprio jogador (trabalho + aposentadoria + bolsa). */
export function rendaPropria(v: Vida): number {
  let total = 0;
  const e = v.trabalho.atual;
  if (e) total += liquido(e.salario, e.contrato);
  if (v.trabalho.aposentadoria) total += v.trabalho.aposentadoria.beneficio;
  return total;
}

/** Renda mensal dos outros adultos da casa. */
export function rendaDosOutros(v: Vida): number {
  return moradores(v).filter(p => idadePessoa(v, p) >= 16).reduce((s, p) => s + (p.renda || 0), 0);
}

export function rendaDomiciliar(v: Vida): number {
  return rendaPropria(v) + rendaDosOutros(v);
}

export function rendaPerCapita(v: Vida): number {
  return rendaDomiciliar(v) / (moradores(v).length + 1);
}

export const moraComFamiliaDeOrigem = (v: Vida) => v.moradia.tipo === 'pais' || v.moradia.tipo === 'parente';
