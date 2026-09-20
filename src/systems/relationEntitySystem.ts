/**
 * Fronteira de entidade das relações.
 *
 * Um pet aparece em Pessoas porque é presença afetiva real na vida de
 * alguém — mas não é uma pessoa pequena. Antes do B4-FIX.1 `pet` era só
 * mais um valor de `RelationType`, então herdava todo o fluxo humano:
 * dava para pedir conselho, discutir e pedir dinheiro a um cachorro.
 *
 * Este módulo é o **único lugar** do código que decide a que espécie um
 * tipo de relação pertence. Todo o resto (capacidade, motor, apresentação,
 * interface) pergunta aqui em vez de comparar com `'pet'` por conta
 * própria — é o que evita a dispersão de `if (tipo === 'pet')`.
 */

import { EspecieRelacao, RelationType } from '../types';

/**
 * Tipos de relação que não são humanos.
 *
 * Conjunto explícito: acrescentar outra espécie no futuro é adicionar uma
 * entrada aqui, e toda a fronteira passa a valer para ela.
 */
const TIPOS_NAO_HUMANOS: ReadonlySet<RelationType> = new Set<RelationType>([
  'pet'
]);

export function obterEspecieRelacao(tipo: RelationType): EspecieRelacao {
  return TIPOS_NAO_HUMANOS.has(tipo) ? 'pet' : 'humano';
}

export function ehPet(tipo: RelationType): boolean {
  return obterEspecieRelacao(tipo) === 'pet';
}

export function ehHumano(tipo: RelationType): boolean {
  return obterEspecieRelacao(tipo) === 'humano';
}
