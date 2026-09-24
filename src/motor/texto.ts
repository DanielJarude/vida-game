/**
 * Texto com concordância.
 *
 * O jogo nunca escreve "promovido(a)" nem assume masculino. Todo adjetivo ou
 * particípio que se refere a uma pessoa passa por `flex`, que escolhe a forma
 * pelo gênero. Para pessoas não binárias usa-se a forma neutra quando dada;
 * sem ela, a forma em "e" derivada da masculina (promovido → promovide).
 */

import type { Genero, Pessoa } from './tipos';

/** Gênero gramatical usado para falar do personagem (escolha do jogador). */
export const ge = (v: { eu: { genero: Genero; tratamento?: Genero } }): Genero => v.eu.tratamento ?? v.eu.genero;

export function flex(genero: Genero, masc: string, fem: string, neutro?: string): string {
  if (genero === 'masculino') return masc;
  if (genero === 'feminino') return fem;
  return neutro ?? neutroDe(masc);
}

function neutroDe(masc: string): string {
  if (masc.endsWith('o')) return masc.slice(0, -1) + 'e';
  if (masc.endsWith('os')) return masc.slice(0, -2) + 'es';
  return masc;
}

/** Artigo definido ("o", "a", "e") para uma pessoa. */
export const artigo = (g: Genero) => flex(g, 'o', 'a', 'e');
/** Contração "do/da/de". */
export const doDa = (g: Genero) => flex(g, 'do', 'da', 'de');
/** "seu/sua" concordando com a pessoa. */
export const seuSua = (g: Genero) => flex(g, 'seu', 'sua', 'sue');
/** "ele/ela/elu". */
export const pronome = (g: Genero) => flex(g, 'ele', 'ela', 'elu');
export const dele = (g: Genero) => flex(g, 'dele', 'dela', 'delu');

/** Rótulo de parentesco concordado ("seu irmão", "sua irmã"). */
export function rotuloParentesco(p: Pessoa, parentesco: string): string {
  const g = p.genero;
  const mapa: Record<string, [string, string, string]> = {
    mae: ['mãe', 'mãe', 'mãe'],
    pai: ['pai', 'pai', 'pai'],
    madrasta: ['madrasta', 'madrasta', 'madrasta'],
    padrasto: ['padrasto', 'padrasto', 'padrasto'],
    irmao: ['irmão', 'irmã', 'irmane'],
    meio_irmao: ['meio-irmão', 'meia-irmã', 'meie-irmane'],
    avo: ['avô', 'avó', 'avó'],
    tio: ['tio', 'tia', 'tie'],
    primo: ['primo', 'prima', 'prime'],
    filho: ['filho', 'filha', 'filhe'],
    enteado: ['enteado', 'enteada', 'enteade'],
    neto: ['neto', 'neta', 'nete'],
    bisneto: ['bisneto', 'bisneta', 'bisnete'],
    genro: ['genro', 'nora', 'genre'],
    sogro: ['sogro', 'sogra', 'sogre'],
    pet: [p.especie === 'gato' ? 'gato' : 'cachorro', p.especie === 'gato' ? 'gata' : 'cachorra', 'bichinho']
  };
  const f = mapa[parentesco];
  if (!f) return parentesco;
  return flex(g, f[0], f[1], f[2]);
}

export function listaNatural(itens: string[]): string {
  if (itens.length <= 1) return itens[0] ?? '';
  return `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`;
}

export function dinheiro(v: number): string {
  return 'R$ ' + Math.round(v).toLocaleString('pt-BR');
}

export function capitalizar(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
