/**
 * ESCOPO GEOGRÁFICO — onde uma coisa vale.
 *
 * A regra: todo conteúdo que não é universal declara onde vale. Conteúdo
 * brasileiro NÃO é global por não ter dito nada; a ausência de escopo quer
 * dizer "em qualquer lugar", e por isso só o que é de fato universal fica
 * sem ele. Quatro níveis, do mais largo ao mais estreito:
 *
 *   universal → país ('BR') → divisão ('US-CA', 'BR-SP') → cidade (id)
 *
 * Duas ferramentas:
 *   - `Escopo` + `noEscopo`: um conteúdo (acontecimento, atividade,
 *     oportunidade) só aparece onde vale.
 *   - `PorLugar` + `resolver`: uma coisa que MUDA com o lugar (um texto, uma
 *     regra) tem a forma universal e as variantes; a mais específica vence.
 *
 * O lugar é sempre o da MORADIA atual (onde a pessoa vive o dia a dia), não
 * o de nascimento nem a nacionalidade — essas respondem outras perguntas
 * (`mundo/vida`).
 */

import { existeMunicipio, municipio, paisDaCidade } from '../dados/lugares';

export interface Lugar {
  /** País (ISO 3166-1), divisão ('US-CA') e cidade (id do município). */
  pais: string;
  divisao: string;
  cidade: string;
}

/** O lugar de um município: o país, a divisão (país-código) e a cidade. */
export function lugarDe(municipioId: string): Lugar {
  const pais = paisDaCidade(municipioId);
  const uf = existeMunicipio(municipioId) ? municipio(municipioId).uf : '';
  return { pais, divisao: `${pais}-${uf}`, cidade: municipioId };
}

/** Onde um conteúdo vale. Sem campo nenhum: em todo lugar (só o que é universal de verdade). */
export interface Escopo {
  paises?: readonly string[];
  divisoes?: readonly string[];
  cidades?: readonly string[];
  /** Vale em todo lugar, MENOS nestes países (o "Inglês" como atividade não é curso para quem mora num país de língua inglesa). */
  excetoPaises?: readonly string[];
}

/** O conteúdo vale neste lugar? Basta casar um dos níveis declarados. */
export function noEscopo(e: Escopo | undefined, l: Lugar): boolean {
  if (!e) return true;
  if (e.excetoPaises?.includes(l.pais)) return false;
  const declarou = !!(e.paises || e.divisoes || e.cidades);
  if (!declarou) return true;
  return !!(e.paises?.includes(l.pais) || e.divisoes?.includes(l.divisao) || e.cidades?.includes(l.cidade));
}

/** Uma coisa que muda com o lugar: a forma universal e variantes por país, divisão ou cidade. */
export type PorLugar<T> = { universal: T } & { [lugar: string]: T | undefined };

/** A variante mais específica para o lugar: cidade → divisão → país → universal. */
export function resolver<T>(x: PorLugar<T>, l: Lugar): T {
  return x[l.cidade] ?? x[l.divisao] ?? x[l.pais] ?? x.universal;
}

/**
 * Junta camadas de um objeto (regras): a universal, a do país, a da divisão.
 * Cada camada só sobrescreve o que declara (raso, campo a campo).
 */
export function sobrepor<T extends object>(base: T, ...camadas: (Partial<T> | undefined)[]): T {
  const out = { ...base };
  for (const c of camadas) if (c) for (const [k, val] of Object.entries(c)) if (val !== undefined) (out as Record<string, unknown>)[k] = val;
  return out;
}
