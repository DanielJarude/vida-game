/**
 * ERAS v2 — o desenho das peças da época (`motor/eras/base/moda`), pela CONSTRUÇÃO, na linguagem de sempre
 * (`ui/avatar/pecas`): a boca de sino abre do joelho para baixo; a cenoura tem o cós alto e afunila; o baggy é largo do
 * quadril à barra; o fuseau tem o pezinho; o blazer tem a ombreira; o moletom e a camiseta dos anos 1980–1990, a estampa
 * geométrica; o golão, as pontas compridas. As cores são as das cartelas de cada década (o marrom e o mostarda dos 1970;
 * o neon e o pastel dos 1980; os primários dos 1990; o jeans claro dos 2000).
 */
import type { Peca } from '../avatar/pecas';

const JEANS_CLARO = ['#8fa9c6', '#a3b8d0', '#7f9cbd'];
const JEANS_MEDIO = ['#4a6d96', '#5b7aa3', '#3d5a80'];

export const PECAS_ERAS: Record<string, Peca> = {
  ep_calca_boca_sino: { parte: 'baixo', forma: 'calca', corte: 'flare', cor: ['#6b4a2b', '#3d5a80', '#8a6d3b', '#7a3b2e'], bolsos: true, costura: '#c99a4a' },
  ep_camisa_golao: { parte: 'cima', forma: 'camisa', cor: ['#e8d3a9', '#c97b3a', '#8a5a2b', '#d9c27a'], cor2: '#5a3d2b', estampa: 'floral', manga: 'longa', gola: 'colarinho', botoes: true, modelo: 'ajustada', barra: 'reta', punho: true, golao: true },
  ep_blazer_ombreira: { parte: 'casaco', forma: 'blazer', comprimento: 'quadril', cor: ['#c8102e', '#1f3a5f', '#e8dcc8', '#2b2b2b', '#6b2d5c'], lapela: true, ombreira: true, modelo: 'reto' },
  ep_jeans_cenoura: { parte: 'baixo', forma: 'calca', corte: 'cenoura', cor: JEANS_CLARO, bolsos: true, costura: '#d8c08a', cos: 'alto', passadores: true },
  ep_fuseau: { parte: 'baixo', forma: 'legging', corte: 'justa', cor: ['#1b1b1d', '#d63a7a', '#2d6fb5', '#6b2d5c'], estribo: true },
  ep_moletom_geometrico: { parte: 'cima', forma: 'moletom', cor: ['#f2efe8', '#1b1b1d', '#2d3e5c'], cor2: '#e8358a', estampa: 'geometrica', manga: 'longa', gola: 'redonda', folga: 1.1, modelo: 'ampla', barra: 'canelada', punho: true, ombroCaido: true },
  ep_camiseta_fluor: { parte: 'cima', forma: 'camiseta', cor: ['#c8e62b', '#ff5fa2', '#ff9f1a', '#2bd4e6'], manga: 'curta', gola: 'redonda', modelo: 'caixa', barra: 'reta', folga: 1.06 },
  ep_bermuda_surf: { parte: 'baixo', forma: 'bermuda', corte: 'larga', cor: ['#1d6fa3', '#e0642b', '#2a8a6a'], cor2: '#f2d23a', estampa: 'floral', cordao: true },
  ep_jaqueta_nailon: { parte: 'casaco', forma: 'corta_vento', comprimento: 'cintura', modelo: 'reto', cor: ['#6b2d8a', '#1d4fa3', '#0f7a6b', '#c8102e'], cor2: '#f2d23a', ziper: true, punhoElastico: true, gola: 'alta' },
  ep_jeans_baggy: { parte: 'baixo', forma: 'calca', corte: 'baggy', cor: JEANS_MEDIO, bolsos: true, costura: '#c99a4a' },
  ep_camiseta_estampada90: { parte: 'cima', forma: 'camiseta', cor: ['#1d4fa3', '#f2efe8', '#2a8a6a'], cor2: '#f2c200', estampa: 'geometrica', manga: 'curta', gola: 'redonda', modelo: 'ampla', barra: 'reta', folga: 1.15, ombroCaido: true },
  ep_jeans_flare_baixa: { parte: 'baixo', forma: 'calca', corte: 'flare', cor: JEANS_MEDIO, bolsos: true, costura: '#c99a4a', cos: 'baixo' },
  ep_baby_look: { parte: 'cima', forma: 'camiseta', cor: ['#f2efe8', '#ff8fb1', '#9ad0f5', '#1b1b1d'], manga: 'curta', gola: 'redonda', modelo: 'ajustada', barra: 'reta', folga: 0.92, comprimentoCima: 'curto', tecido: 'leve' }
};
