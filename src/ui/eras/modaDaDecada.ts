/**
 * ERAS v2 — a roupa de todo dia de cada década (o que a Figura veste em quem não comprou peça: os pais, os colegas, as
 * pessoas do mundo, a própria pessoa na infância). Não é fantasia: é o básico que se via na rua — várias combinações por
 * década, escolhidas pela semente de cada pessoa, sem gênero (como no resto do catálogo). Quem tem 60 anos ou mais veste
 * o que se usava na juventude dela (a calça de tecido e a camisa), não a moda dos jovens.
 *
 * A década vem da vida que está na tela (`definirDecadaDaFigura`, chamada pelo Jogo); null = o jogo de hoje.
 */
import type { Conjunto, Peca } from '../avatar/pecas';
import { PECAS_ERAS } from './pecasEras';

let decada: number | null = null;
export const definirDecadaDaFigura = (d: number | null) => { decada = d; };
export const decadaDaFigura = () => decada;

const cor = (p: Peca, h: number): Peca => {
  const c = (p as { cor: string | string[] }).cor;
  return { ...p, cor: Array.isArray(c) ? c[h % c.length] : c } as Peca;
};
const E = PECAS_ERAS;
type Opcao = { cima: Peca; baixo: Peca; pes: Peca };

const LONA: Peca = { parte: 'pes', forma: 'tenis_lona', cor: ['#f4f4f2', '#1b1b1d', '#c8102e'], sola: '#f4f4f2' };
const CANO: Peca = { parte: 'pes', forma: 'tenis_cano', cor: ['#f4f4f2', '#1b1b1d'], sola: '#f4f4f2' };
const SAPATO: Peca = { parte: 'pes', forma: 'sapato', cor: ['#3a2a20', '#1b1b1d'], sola: '#1b1515' };
const TENIS: Peca = { parte: 'pes', forma: 'tenis', cor: ['#f4f4f2', '#2b2f36', '#7d8590'], sola: '#f4f4f2' };
const CALCA_TECIDO: Peca = { parte: 'baixo', forma: 'calca', corte: 'reta', cor: ['#4a4038', '#2b2f36', '#6b5e4e'], vinco: true, passadores: true };
const CAMISA_MANGA_CURTA: Peca = { parte: 'cima', forma: 'camisa', cor: ['#f3ece3', '#cfe0f2', '#e8dcc8'], manga: 'curta', gola: 'colarinho', botoes: true, modelo: 'caixa', barra: 'reta' };
const POLO: Peca = { parte: 'cima', forma: 'polo', cor: ['#1f3a5f', '#f2efe8', '#2f5a3c', '#8a1e2b', '#e3c26b'], manga: 'curta', gola: 'polo', modelo: 'caixa', barra: 'reta' };
const XADREZ: Peca = { parte: 'cima', forma: 'camisa', cor: ['#a3302c', '#2f6a44', '#2b4a7b'], cor2: '#151515', estampa: 'xadrez', manga: 'longa', gola: 'colarinho', botoes: true, modelo: 'caixa', barra: 'curva' };
const LISTRADA: Peca = { parte: 'cima', forma: 'camiseta', cor: '#f4f1ea', cor2: '#c8102e', estampa: 'listras', manga: 'curta', gola: 'redonda', modelo: 'caixa', barra: 'reta' };
const LISA_PRIMARIA: Peca = { parte: 'cima', forma: 'camiseta', cor: ['#1d4fa3', '#c8102e', '#f2c200', '#2a8a6a', '#f2efe8'], manga: 'curta', gola: 'redonda', modelo: 'caixa', barra: 'reta', folga: 1.08 };
const LISA: Peca = { parte: 'cima', forma: 'camiseta', cor: ['#f2efe8', '#22262b', '#7d8590', '#2d3e5c', '#b9a58a'], manga: 'curta', gola: 'redonda', modelo: 'caixa', barra: 'reta' };
const JEANS_RETO: Peca = { parte: 'baixo', forma: 'calca', corte: 'reta', cor: ['#3d5a80', '#2f4562'], bolsos: true, costura: '#c99a4a' };
const SKINNY: Peca = { parte: 'baixo', forma: 'calca', corte: 'justa', cor: ['#22324a', '#1b1b1d', '#3d5a80'], bolsos: true };
const CARGO: Peca = { parte: 'baixo', forma: 'calca', corte: 'larga', cor: ['#6b6a4e', '#2b2d2f', '#a49a7c'], bolsos: true };

const DECADAS: Record<number, Opcao[]> = {
  1970: [
    { cima: E.ep_camisa_golao, baixo: E.ep_calca_boca_sino, pes: SAPATO },
    { cima: LISTRADA, baixo: E.ep_calca_boca_sino, pes: LONA },
    { cima: CAMISA_MANGA_CURTA, baixo: E.ep_calca_boca_sino, pes: SAPATO }
  ],
  1980: [
    { cima: E.ep_camiseta_fluor, baixo: E.ep_jeans_cenoura, pes: LONA },
    { cima: POLO, baixo: E.ep_jeans_cenoura, pes: LONA },
    { cima: E.ep_moletom_geometrico, baixo: E.ep_jeans_cenoura, pes: CANO },
    { cima: LISTRADA, baixo: CALCA_TECIDO, pes: SAPATO },
    { cima: CAMISA_MANGA_CURTA, baixo: E.ep_jeans_cenoura, pes: LONA }
  ],
  1990: [
    { cima: E.ep_camiseta_estampada90, baixo: E.ep_jeans_baggy, pes: CANO },
    { cima: XADREZ, baixo: E.ep_jeans_baggy, pes: CANO },
    { cima: LISA_PRIMARIA, baixo: JEANS_RETO, pes: TENIS },
    { cima: POLO, baixo: E.ep_jeans_cenoura, pes: TENIS }
  ],
  2000: [
    { cima: E.ep_baby_look, baixo: E.ep_jeans_flare_baixa, pes: TENIS },
    { cima: POLO, baixo: CARGO, pes: TENIS },
    { cima: LISA, baixo: E.ep_jeans_flare_baixa, pes: LONA },
    { cima: LISA_PRIMARIA, baixo: E.ep_jeans_baggy, pes: CANO }
  ],
  2010: [
    { cima: LISA, baixo: SKINNY, pes: TENIS },
    { cima: XADREZ, baixo: SKINNY, pes: LONA },
    { cima: POLO, baixo: JEANS_RETO, pes: TENIS }
  ]
};

/** A roupa de todo dia da década para esta pessoa (undefined: a do jogo de hoje). */
export function roupaDaDecada(h: number, idade: number): Conjunto | undefined {
  if (decada === null || decada >= 2020) return undefined;
  const ops = DECADAS[Math.max(1970, Math.min(2010, decada))];
  if (!ops) return undefined;
  // Os mais velhos vestem o que se usava na juventude: a camisa e a calça de tecido.
  if (idade >= 60) return { cima: cor(CAMISA_MANGA_CURTA, h), baixo: cor(CALCA_TECIDO, h >>> 2), pes: cor(SAPATO, h >>> 3) };
  const o = ops[h % ops.length];
  // A criança: a parte de cima da década, bermuda e tênis.
  if (idade < 12) return { cima: cor(o.cima, h >>> 1), baixo: cor({ parte: 'baixo', forma: 'bermuda', corte: decada === 1980 || decada === 1990 ? 'larga' : 'reta', cor: ['#3d5a80', '#c8102e', '#2a8a6a'] }, h >>> 2), pes: cor(o.pes, h >>> 3) };
  return { cima: cor(o.cima, h >>> 1), baixo: cor(o.baixo, h >>> 2), pes: cor(o.pes, h >>> 3) };
}
