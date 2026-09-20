/**
 * Apresentação do avatar (B4-FIX1).
 *
 * O playtest apontou que a identidade usava só iniciais — sem nenhuma
 * presença visual de avatar. A decisão de design do B4 continua válida
 * ("não usar foto real, nem gerar rosto"), mas isso não obriga a interface
 * a se limitar a duas letras: um símbolo consistente com a fase da vida
 * comunica presença sem inventar um rosto.
 *
 * Este módulo é PURO (sem React, sem CSS): decide qual categoria de avatar
 * corresponde a uma idade ou a um pet. A escolha do ícone concreto vive no
 * componente `PersonAvatar`, que é o único lugar que conhece a biblioteca
 * de ícones.
 */

import type { RelationType } from '../types';

export type CategoriaAvatar =
  | 'bebe'
  | 'crianca'
  | 'adolescente'
  | 'adulto'
  | 'idoso'
  | 'pet';

/**
 * Categoria de avatar para uma pessoa, a partir da idade.
 * Alinhada às fases já usadas em `lifeStagePresentation`, mas não depende
 * dela: o avatar é decoração de identidade, não uma regra de jogo.
 */
export function obterCategoriaAvatarPessoa(idade: number): CategoriaAvatar {
  if (idade < 2) return 'bebe';
  if (idade < 12) return 'crianca';
  if (idade < 18) return 'adolescente';
  if (idade < 60) return 'adulto';
  return 'idoso';
}

/**
 * Categoria de avatar para qualquer membro da família, incluindo pets.
 * Pets sempre usam a categoria própria — a idade deles não corresponde à
 * mesma escala de desenvolvimento humano.
 */
export function obterCategoriaAvatar(
  idade: number,
  tipo?: RelationType
): CategoriaAvatar {
  if (tipo === 'pet') return 'pet';
  return obterCategoriaAvatarPessoa(idade);
}

/** Rótulo acessível (aria-label) para o avatar — nunca só decorativo. */
export function obterRotuloAvatar(
  nome: string,
  categoria: CategoriaAvatar
): string {
  switch (categoria) {
    case 'bebe':
      return `${nome}, bebê`;
    case 'crianca':
      return `${nome}, criança`;
    case 'adolescente':
      return `${nome}, adolescente`;
    case 'idoso':
      return `${nome}, pessoa idosa`;
    case 'pet':
      return `${nome}, animal de estimação`;
    default:
      return nome;
  }
}
