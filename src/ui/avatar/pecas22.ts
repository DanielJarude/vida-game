/**
 * VIDA 22 — o desenho das peças básicas novas (`dados22/estilo/estilo22`): cada uma pela CONSTRUÇÃO, na linguagem de
 * sempre (`pecas.ts`): o tecido (leve, médio, encorpado, canelado), o comprimento, a ribana da gola, a raglan, a carcela,
 * o bolso no peito, a barra dupla, as alças. Na mesma cor, uma não se confunde com a outra.
 */
import type { Peca } from './pecas';

const BASICAS = ['#f2efe8', '#22262b', '#7d8590', '#2d3e5c', '#5d6b4f'];

export const PECAS_22: Record<string, Peca> = {
  camiseta_oversized: { parte: 'cima', forma: 'camiseta', cor: [...BASICAS, '#b9a58a'], manga: 'curta', gola: 'redonda', modelo: 'ampla', barra: 'reta', folga: 1.13, ombroCaido: true, tecido: 'encorpado', comprimentoCima: 'longo', golaRib: 1.8 },
  camiseta_pima: { parte: 'cima', forma: 'camiseta', cor: ['#f6f4ef', '#14213d', '#22262b', '#c9c3b6'], manga: 'curta', gola: 'redonda', modelo: 'ajustada', barra: 'reta', tecido: 'encorpado', golaRib: 1.4, barraDupla: true },
  camiseta_henley: { parte: 'cima', forma: 'camiseta', cor: ['#e9e2d4', '#5a3d2b', '#2d3e5c', '#3f4a33'], manga: 'longa', gola: 'redonda', modelo: 'ajustada', barra: 'curva', punho: true, carcela: 3, tecido: 'medio', golaRib: 0.9 },
  camiseta_bolso: { parte: 'cima', forma: 'camiseta', cor: ['#f2efe8', '#7d8590', '#b65d3a', '#2f5a52'], manga: 'curta', gola: 'redonda', modelo: 'caixa', barra: 'reta', folga: 1.05, bolsoPeito: true, dobrada: true, tecido: 'medio', golaRib: 1 },
  camiseta_manga_longa: { parte: 'cima', forma: 'camiseta', cor: ['#f2efe8', '#22262b', '#7b2d3a', '#2d3e5c'], manga: 'longa', gola: 'redonda', modelo: 'ajustada', barra: 'reta', folga: 0.97, tecido: 'leve', golaRib: 0.6 },
  camiseta_raglan: { parte: 'cima', forma: 'camiseta', cor: '#f4f2ec', cor2: '#1f3a5f', manga: 'longa', manga34: true, gola: 'redonda', modelo: 'caixa', barra: 'reta', raglan: true, tecido: 'medio', golaRib: 1 },
  regata_alcinha: { parte: 'cima', forma: 'regata', modelo: 'ajustada', cor: ['#f2efe8', '#1b1b1d', '#c9a46a', '#7b2d3a'], manga: 'sem', gola: 'redonda', alcas: 'finas', tecido: 'canelado', folga: 0.95 }
};
