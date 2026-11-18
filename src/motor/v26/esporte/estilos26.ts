/**
 * VIDA 26.2 — OS ESTILOS DE LUTA. A modalidade "lutas" continua uma só no motor (a frente, a base, a carreira, as
 * categorias de peso), mas quem luta escolhe um ESTILO — e o estilo muda de verdade:
 *
 *   - o conjunto de atributos e o peso de cada um na nota da temporada (o boxeador vive de golpes, defesa e distância; o
 *     jiu-jiteiro, do chão, do equilíbrio e da força; o lutador de MMA precisa de tudo, um pouco menos de cada);
 *   - a graduação, nos estilos que têm faixa (jiu-jitsu, judô, karatê, taekwondo): derivada da técnica, dos anos de
 *     prática e da idade (abstração de gameplay inspirada nos tempos mínimos e idades das federações — não é o regulamento
 *     de nenhuma delas);
 *   - os nomes das competições e o que se diz na biografia e no histórico;
 *   - a troca de estilo: a técnica de cada estilo fica guardada; o estilo novo aproveita parte da de agora (mais dentro
 *     da mesma família — em pé, agarrada, mista) ou volta à que já tinha.
 *
 * Folha (só tipos importados).
 */
import type { AtributoId } from './atributos26';

export type EstiloLuta26 = 'muay_thai' | 'boxe' | 'jiu_jitsu' | 'judo' | 'karate' | 'taekwondo' | 'mma';
export type FamiliaDeLuta = 'em_pe' | 'agarrada' | 'mista';

export interface Faixa26 { nome: string; tecnica: number; anos: number; idade: number }
export interface EstiloDeLuta {
  id: EstiloLuta26;
  nome: string;
  familia: FamiliaDeLuta;
  sobre: string;
  /** Os atributos do estilo e o peso de cada um na nota (somam 1). */
  atributos: [AtributoId, number][];
  /** As faixas, da primeira à preta (só nos estilos que graduam). */
  faixas?: Faixa26[];
  /** Como se chama a competição amadora e a profissional. */
  amador: string;
  profissional: string;
  /** Palavras para a busca. */
  chaves: string;
}

export const ESTILOS26: Record<EstiloLuta26, EstiloDeLuta> = {
  muay_thai: {
    id: 'muay_thai', nome: 'Muay Thai', familia: 'em_pe', sobre: 'A "arte das oito armas": socos, chutes, joelhadas, cotoveladas e o clinche.',
    atributos: [['golpes', 0.24], ['defesa', 0.14], ['distancia', 0.12], ['resistencia', 0.12], ['forca', 0.08], ['explosao', 0.08], ['agilidade', 0.06], ['decisao', 0.06], ['compostura', 0.06], ['solo', 0.04]],
    amador: 'as lutas amadoras e os torneios estaduais de Muay Thai', profissional: 'os eventos profissionais de Muay Thai e kickboxing', chaves: 'muay thai muaythai kickboxing chute joelhada'
  },
  boxe: {
    id: 'boxe', nome: 'Boxe', familia: 'em_pe', sobre: 'Só os punhos: a guarda, o jogo de pernas, a distância, o golpe certo na hora certa.',
    atributos: [['golpes', 0.26], ['defesa', 0.18], ['distancia', 0.14], ['agilidade', 0.1], ['resistencia', 0.1], ['explosao', 0.08], ['decisao', 0.07], ['compostura', 0.07]],
    amador: 'o boxe olímpico (amador) e os torneios de luvas de ouro', profissional: 'o boxe profissional', chaves: 'boxe boxing boxeador pugilismo luva'
  },
  jiu_jitsu: {
    id: 'jiu_jitsu', nome: 'Jiu-jitsu', familia: 'agarrada', sobre: 'A luta no chão: a guarda, a passagem, a raspagem, a finalização.',
    atributos: [['solo', 0.32], ['defesa', 0.14], ['resistencia', 0.12], ['forca', 0.1], ['equilibrio', 0.1], ['decisao', 0.1], ['agilidade', 0.06], ['compostura', 0.06]],
    faixas: [{ nome: 'branca', tecnica: 0, anos: 0, idade: 0 }, { nome: 'azul', tecnica: 38, anos: 1.5, idade: 16 }, { nome: 'roxa', tecnica: 52, anos: 3.5, idade: 16 }, { nome: 'marrom', tecnica: 64, anos: 5, idade: 18 }, { nome: 'preta', tecnica: 74, anos: 6, idade: 19 }],
    amador: 'os campeonatos de faixa (estaduais, brasileiro, mundial de faixa)', profissional: 'os eventos profissionais de jiu-jitsu e de grappling', chaves: 'jiu jitsu jiujitsu bjj grappling faixa kimono'
  },
  judo: {
    id: 'judo', nome: 'Judô', familia: 'agarrada', sobre: 'As quedas e o controle: o desequilíbrio, a projeção, o ippon.',
    atributos: [['solo', 0.24], ['equilibrio', 0.16], ['forca', 0.14], ['explosao', 0.1], ['defesa', 0.1], ['decisao', 0.1], ['resistencia', 0.08], ['compostura', 0.08]],
    faixas: [{ nome: 'branca', tecnica: 0, anos: 0, idade: 0 }, { nome: 'azul', tecnica: 25, anos: 1, idade: 0 }, { nome: 'amarela', tecnica: 33, anos: 2, idade: 0 }, { nome: 'laranja', tecnica: 41, anos: 3, idade: 0 }, { nome: 'verde', tecnica: 49, anos: 4, idade: 12 }, { nome: 'roxa', tecnica: 56, anos: 5, idade: 14 }, { nome: 'marrom', tecnica: 63, anos: 6, idade: 16 }, { nome: 'preta', tecnica: 72, anos: 7, idade: 17 }],
    amador: 'os campeonatos de federação (estadual, brasileiro, circuito internacional)', profissional: 'o circuito mundial de judô (seleção, patrocínio, clube)', chaves: 'judo judoca ippon quimono faixa'
  },
  karate: {
    id: 'karate', nome: 'Karatê', familia: 'em_pe', sobre: 'Golpes precisos à distância: o ponto, o tempo, o controle (kumite) — e a forma (kata).',
    atributos: [['golpes', 0.24], ['distancia', 0.16], ['agilidade', 0.14], ['defesa', 0.14], ['explosao', 0.1], ['decisao', 0.08], ['compostura', 0.08], ['concentracao', 0.06]],
    faixas: [{ nome: 'branca', tecnica: 0, anos: 0, idade: 0 }, { nome: 'amarela', tecnica: 25, anos: 1, idade: 0 }, { nome: 'laranja', tecnica: 34, anos: 2, idade: 0 }, { nome: 'verde', tecnica: 43, anos: 3, idade: 0 }, { nome: 'roxa', tecnica: 52, anos: 4, idade: 12 }, { nome: 'marrom', tecnica: 61, anos: 5, idade: 14 }, { nome: 'preta', tecnica: 70, anos: 6, idade: 16 }],
    amador: 'os campeonatos de federação (kumite e kata)', profissional: 'o circuito internacional de karatê', chaves: 'karate karateca kata kumite faixa'
  },
  taekwondo: {
    id: 'taekwondo', nome: 'Taekwondo', familia: 'em_pe', sobre: 'Os chutes: altos, rápidos, rodados — a distância longa e a explosão.',
    atributos: [['golpes', 0.24], ['agilidade', 0.16], ['distancia', 0.14], ['explosao', 0.12], ['defesa', 0.12], ['decisao', 0.08], ['compostura', 0.08], ['impulsao', 0.06]],
    faixas: [{ nome: 'branca', tecnica: 0, anos: 0, idade: 0 }, { nome: 'amarela', tecnica: 25, anos: 1, idade: 0 }, { nome: 'verde', tecnica: 36, anos: 2, idade: 0 }, { nome: 'azul', tecnica: 47, anos: 3, idade: 0 }, { nome: 'vermelha', tecnica: 58, anos: 4, idade: 12 }, { nome: 'preta', tecnica: 68, anos: 5, idade: 15 }],
    amador: 'os campeonatos de federação (estadual, brasileiro, internacional)', profissional: 'o circuito mundial de taekwondo', chaves: 'taekwondo tkd chute faixa'
  },
  mma: {
    id: 'mma', nome: 'MMA', familia: 'mista', sobre: 'Artes marciais mistas: em pé, no clinche e no chão — e a transição entre eles.',
    atributos: [['golpes', 0.18], ['solo', 0.18], ['defesa', 0.14], ['resistencia', 0.1], ['distancia', 0.08], ['forca', 0.08], ['explosao', 0.08], ['agilidade', 0.06], ['decisao', 0.05], ['compostura', 0.05]],
    amador: 'as lutas amadoras de MMA', profissional: 'os eventos profissionais de MMA', chaves: 'mma vale tudo artes marciais mistas ufc octogono'
  }
};
export const LISTA_ESTILOS26 = Object.keys(ESTILOS26) as EstiloLuta26[];
export const NOME_FAMILIA26: Record<FamiliaDeLuta, string> = { em_pe: 'luta em pé', agarrada: 'luta agarrada', mista: 'luta mista' };

/** Quanto da técnica de agora vale no estilo novo (a mesma família aproveita mais; o MMA fica no meio de tudo). */
export function aproveitamento26(de: EstiloLuta26, para: EstiloLuta26): number {
  if (de === para) return 1;
  const a = ESTILOS26[de].familia, b = ESTILOS26[para].familia;
  if (a === b) return 0.85;
  if (a === 'mista' || b === 'mista') return 0.75;
  return 0.55;
}

/** A faixa (nos estilos que graduam) pela técnica, os anos de prática e a idade — a última cujos três requisitos cabem. */
export function faixa26(estilo: EstiloLuta26, tecnica: number, anos: number, idade: number): { atual: string; proxima?: Faixa26 } | undefined {
  const fs = ESTILOS26[estilo].faixas;
  if (!fs) return undefined;
  let k = 0;
  for (let j = 1; j < fs.length; j++) if (tecnica >= fs[j].tecnica && anos >= fs[j].anos && idade >= fs[j].idade) k = j; else break;
  return { atual: fs[k].nome, proxima: fs[k + 1] };
}
