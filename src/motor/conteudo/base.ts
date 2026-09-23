/**
 * Conteúdo: acontecimentos e decisões.
 *
 * A REGRA DE AGÊNCIA É ESTRUTURAL:
 *
 *   ACONTECIMENTO — o mundo age. É uma função que narra o que aconteceu COM
 *   a pessoa e aplica apenas efeitos do mundo. Não tem opções, então não há
 *   "desfecho sorteado" que decida como o personagem se comportou. Se a
 *   reação do personagem importa, não é acontecimento: é decisão.
 *
 *   DECISÃO — o jogador escolhe. Opções com `comportamento` são evidência
 *   de personalidade; decisões `biografica` definem a história sem dizer
 *   nada sobre o caráter (qual foi a primeira palavra).
 *
 * Papéis ligam o conteúdo a PESSOAS REAIS da vida do jogador: um evento que
 * fala de "seu irmão" só existe se há um irmão, e usa o nome dele.
 */

import type { Rng } from '../rng';
import type { Genero, Pessoa, Relevancia, Tema, Traco, Vida } from '../tipos';
import { flex } from '../texto';
import { idade } from '../nucleo';

export interface Ctx {
  v: Vida;
  r: Rng;
  idade: number;
  /** Pessoas ligadas aos papéis do conteúdo. */
  p: Record<string, Pessoa>;
  /** Concordância com o gênero do jogador: `c.g('cansado', 'cansada')`. */
  g: (masc: string, fem: string, neutro?: string) => string;
  /** Quantas vezes este conteúdo já aconteceu nesta vida (0 = primeira). */
  vezes: number;
}

export type Papel = (v: Vida) => Pessoa[];

interface Base {
  id: string;
  idade: [number, number];
  tema: Tema;
  peso?: number | ((c: Ctx) => number);
  /** Intervalo mínimo em anos para repetir. Ausente = acontece uma vez na vida. */
  repetir?: number;
  papeis?: Record<string, Papel>;
  quando?: (c: Ctx) => boolean;
  /**
   * Conteúdo prioritário: disparado por estado (um pedido de namoro, um
   * bebê que nasceu). Passa na frente do sorteio.
   */
  prioritario?: boolean;
  /** Entre prioritários, o maior vence (padrão 1). O nome do bebê não pode esperar. */
  prioridade?: number;
  /** Marco garantido: acontece na janela de idade se as condições valerem. */
  garantido?: boolean;
  /** Só abre por comando do jogador (ex.: entrevista de emprego). Nunca sorteado. */
  manual?: boolean;
}

export interface Narrativa {
  texto: string;
  relevancia?: Relevancia;
  tom?: 'bom' | 'ruim' | 'neutro';
  efeito?: (c: Ctx) => void;
  /** Guarda o fato na história compartilhada com uma das pessoas do papel. */
  lembrar?: [papel: string, texto: string];
}

export interface Acontecimento extends Base {
  tipo: 'acontecimento';
  narrar: (c: Ctx) => Narrativa | null;
}

export interface Resultado {
  /** Mostrado ao jogador na hora (pode falar em "você"). */
  texto: string;
  /** Linha da biografia. Ausente = usa `texto`. `null` = não registra. */
  memoria?: string | null;
  relevancia?: Relevancia;
  tom?: 'bom' | 'ruim' | 'neutro';
  efeito?: (c: Ctx) => void;
  lembrar?: [papel: string, texto: string];
}

export interface Opcao {
  id: string;
  texto: string | ((c: Ctx) => string);
  /** `true` ou o motivo do bloqueio (mostrado desabilitado). `false` esconde. */
  disponivel?: (c: Ctx) => true | string | false;
  comportamento?: Partial<Record<Traco, number>>;
  resolver: (c: Ctx) => Resultado;
}

export interface Decisao extends Base {
  tipo: 'decisao';
  titulo: string | ((c: Ctx) => string);
  texto: (c: Ctx) => string;
  opcoes: Opcao[];
  /** Escolha biográfica: nunca move personalidade. */
  biografica?: boolean;
}

export type Conteudo = Acontecimento | Decisao;

export function contexto(v: Vida, r: Rng, p: Record<string, Pessoa> = {}): Ctx {
  const genero: Genero = v.eu.tratamento ?? v.eu.genero;
  return { v, r, idade: idade(v), p, g: (m, f, n) => flex(genero, m, f, n), vezes: 0 };
}

export const txt = (x: string | ((c: Ctx) => string), c: Ctx) => (typeof x === 'string' ? x : x(c));
