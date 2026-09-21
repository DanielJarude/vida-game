/**
 * Apresentação de categoria de evento (`GameEvent['categoria']`) — B4-FIX3.
 *
 * Extraído de `EventExperience.tsx` porque rótulo/ícone de categoria é
 * dado de apresentação, não parte do componente. Isso também evita que a
 * lista de categorias precise ser mantida em dois lugares quando um novo
 * contexto (hobby, esporte, comunidade, tecnologia — item 2/3 do B4-FIX3)
 * é adicionado ao catálogo.
 *
 * Ícones ficam como nomes de `lucide-react` (string), não elementos JSX,
 * para este módulo continuar puro (sem React) — o componente resolve o
 * ícone real. Mantém a regra: apresentação traduz dado, não decide layout.
 */

import type { GameEvent } from '../types';

export type NomeIconeCategoria =
  | 'sparkles'
  | 'book-open'
  | 'users'
  | 'heart'
  | 'briefcase'
  | 'wallet'
  | 'heart-pulse'
  | 'circle'
  | 'palette'
  | 'trophy'
  | 'landmark'
  | 'smartphone';

const ICONES: Record<GameEvent['categoria'], NomeIconeCategoria> = {
  infancia: 'sparkles',
  escola: 'book-open',
  adolescencia: 'sparkles',
  familia: 'users',
  amizade: 'users',
  romance: 'heart',
  trabalho: 'briefcase',
  dinheiro: 'wallet',
  saude: 'heart-pulse',
  cotidiano: 'circle',
  hobby: 'palette',
  esporte: 'trophy',
  comunidade: 'landmark',
  tecnologia: 'smartphone'
};

const ROTULOS: Record<GameEvent['categoria'], string> = {
  infancia: 'Infância',
  escola: 'Escola',
  adolescencia: 'Adolescência',
  familia: 'Família',
  amizade: 'Amizade',
  romance: 'Relacionamento',
  trabalho: 'Trabalho',
  dinheiro: 'Dinheiro',
  saude: 'Saúde',
  cotidiano: 'Cotidiano',
  hobby: 'Interesse pessoal',
  esporte: 'Esporte',
  comunidade: 'Comunidade',
  tecnologia: 'Internet e tecnologia'
};

export function iconeCategoriaEvento(categoria: GameEvent['categoria']): NomeIconeCategoria {
  return ICONES[categoria];
}

export function rotuloCategoriaEvento(categoria: GameEvent['categoria']): string {
  return ROTULOS[categoria];
}
