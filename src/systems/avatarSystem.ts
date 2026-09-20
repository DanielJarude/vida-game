/**
 * Sistema de avatar.
 *
 * Responsabilidades: criar um avatar válido, sortear um, e **normalizar**
 * qualquer coisa que venha de um save antigo ou corrompido.
 *
 * Regra dura: aparência **não influencia gameplay**. Nada aqui lê ou
 * escreve atributos, personalidade, classe social ou economia.
 */

import { AvatarAppearance } from '../types';
import {
  TONS_DE_PELE,
  CORES_DE_CABELO,
  CORES_DE_OLHOS,
  ESTILOS_DE_CABELO
} from '../data/avatar/avatarOptions';
import { valorAleatorio } from '../utils/random';

/**
 * Avatar padrão.
 *
 * Usado por saves anteriores ao B4-FIX.1, que não têm o campo. É um avatar
 * válido e neutro — nunca `null`, para que nenhum componente precise
 * tratar ausência.
 */
export function criarAvatarPadrao(): AvatarAppearance {
  return {
    tomDePele: TONS_DE_PELE[1].id,
    estiloCabelo: ESTILOS_DE_CABELO[1].id,
    corCabelo: CORES_DE_CABELO[0].id,
    corOlhos: CORES_DE_OLHOS[0].id
  };
}

function sortearDe<T extends { id: string }>(lista: readonly T[]): string {
  return lista[Math.floor(valorAleatorio() * lista.length)].id;
}

/** Avatar aleatório — usado pela vida aleatória e pelo botão "Sortear". */
export function sortearAvatar(): AvatarAppearance {
  return {
    tomDePele: sortearDe(TONS_DE_PELE),
    estiloCabelo: sortearDe(ESTILOS_DE_CABELO),
    corCabelo: sortearDe(CORES_DE_CABELO),
    corOlhos: sortearDe(CORES_DE_OLHOS)
  };
}

function idValido(lista: readonly { id: string }[], valor: unknown): boolean {
  return typeof valor === 'string' && lista.some(o => o.id === valor);
}

/**
 * Normaliza um avatar vindo de save.
 *
 * Cada campo é validado isoladamente: um save com cabelo inválido mas
 * pele válida preserva a pele. Campo ausente ou desconhecido cai no
 * padrão, nunca quebra.
 */
export function normalizarAvatar(bruto: unknown): AvatarAppearance {
  const padrao = criarAvatarPadrao();
  if (!bruto || typeof bruto !== 'object') return padrao;

  const v = bruto as Record<string, unknown>;

  return {
    tomDePele: idValido(TONS_DE_PELE, v.tomDePele)
      ? (v.tomDePele as string)
      : padrao.tomDePele,
    estiloCabelo: idValido(ESTILOS_DE_CABELO, v.estiloCabelo)
      ? (v.estiloCabelo as string)
      : padrao.estiloCabelo,
    corCabelo: idValido(CORES_DE_CABELO, v.corCabelo)
      ? (v.corCabelo as string)
      : padrao.corCabelo,
    corOlhos: idValido(CORES_DE_OLHOS, v.corOlhos)
      ? (v.corOlhos as string)
      : padrao.corOlhos
  };
}

/**
 * Fase corporal do avatar.
 *
 * O desenho muda de proporção conforme a idade — um bebê não usa a mesma
 * silhueta de um adulto. São três estágios apenas; a estrutura permite
 * acrescentar mais sem mexer em quem consome.
 */
export type FaseAvatar = 'bebe' | 'crianca' | 'adulto';

export function obterFaseAvatar(idade: number): FaseAvatar {
  if (idade <= 2) return 'bebe';
  if (idade <= 11) return 'crianca';
  return 'adulto';
}
