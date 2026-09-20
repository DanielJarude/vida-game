/**
 * Localização — barrel e consultas.
 *
 * Reexporta os dados e expõe as consultas que a interface usa. Nenhuma
 * regra de gameplay mora aqui: é só leitura estruturada.
 */

import { UNIDADES_FEDERATIVAS, UnidadeFederativa } from './states';
import { CIDADES_BRASILEIRAS, BrazilianCity } from './cities';
import { valorAleatorio } from '../../utils/random';

export { UNIDADES_FEDERATIVAS, CIDADES_BRASILEIRAS };
export type { UnidadeFederativa, Regiao } from './states';
export type { BrazilianCity } from './cities';

/**
 * As 27 UFs, sempre — independentemente de quantas cidades cada uma tenha.
 * Já vêm ordenadas por nome, que é como o jogador lê.
 */
export function listarEstados(): readonly UnidadeFederativa[] {
  return UNIDADES_FEDERATIVAS;
}

/** Uma UF pela sigla. */
export function encontrarEstado(sigla: string): UnidadeFederativa | undefined {
  return UNIDADES_FEDERATIVAS.find(uf => uf.sigla === sigla);
}

/** Nome por extenso da UF; cai na própria sigla se algo estiver fora do catálogo. */
export function nomeDoEstado(sigla: string): string {
  return encontrarEstado(sigla)?.nome ?? sigla;
}

/** Cidades suportadas de um estado, em ordem alfabética. */
export function listarCidadesPorEstado(sigla: string): BrazilianCity[] {
  return CIDADES_BRASILEIRAS.filter(c => c.estado === sigla).sort((a, b) =>
    a.cidade.localeCompare(b.cidade, 'pt-BR')
  );
}

/** Busca exata de uma cidade suportada. */
export function encontrarCidade(
  nomeCidade: string,
  sigla: string
): BrazilianCity | undefined {
  return CIDADES_BRASILEIRAS.find(
    c => c.cidade === nomeCidade && c.estado === sigla
  );
}

/** Sorteia uma cidade qualquer entre as suportadas. */
export function sortearCidade(): BrazilianCity {
  return CIDADES_BRASILEIRAS[
    Math.floor(valorAleatorio() * CIDADES_BRASILEIRAS.length)
  ];
}

/** Sorteia uma UF que tenha ao menos uma cidade de nascimento. */
export function sortearEstado(): UnidadeFederativa {
  const comCidade = UNIDADES_FEDERATIVAS.filter(
    uf => listarCidadesPorEstado(uf.sigla).length > 0
  );
  return comCidade[Math.floor(valorAleatorio() * comCidade.length)];
}
