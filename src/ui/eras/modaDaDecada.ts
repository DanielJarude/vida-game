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

/**
 * ERAS v3 · DE 1900 A 1969: a roupa de todo dia era muito mais marcada pelo gênero e pela formalidade — o terno e o
 * chapéu na rua, o vestido comprido e depois na altura da canela, a saia e a blusa; a calça feminina e o jeans só se
 * espalham nos anos 1960. Cores sóbrias (o tecido tingido em casa ou comprado a metro). APROXIMAÇÃO lida de acervos de
 * moda (Museu da Moda, Victoria and Albert Museum, Metropolitan Museum — Costume Institute) e da fotografia de rua.
 */
const SOBRIAS = ['#3b3a36', '#4a4038', '#2b2f36', '#5d5246', '#6b5e4e'];
const CLARAS = ['#efe7d6', '#e6dcc8', '#d9d4c7', '#f2ece0'];
const VESTIDO_ANTIGO: Record<number, Peca[]> = {
  1900: [{ parte: 'inteira', forma: 'vestido', comprimento: 'longo', cor: ['#3b3a36', '#5d4a5a', '#2f3b4a', '#e6dcc8'], manga: 'longa', gola: 'alta', modelo: 'coluna' }],
  1910: [{ parte: 'inteira', forma: 'vestido', comprimento: 'longo', cor: ['#3b3a36', '#5b6470', '#6b4e3a', '#e6dcc8'], manga: 'longa', gola: 'alta', modelo: 'imperio' }],
  1920: [{ parte: 'inteira', forma: 'vestido', comprimento: 'midi', cor: ['#2d3e5c', '#7b5a3a', '#efe7d6', '#5d5246'], manga: 'curta', gola: 'v', modelo: 'coluna' }],
  1930: [{ parte: 'inteira', forma: 'vestido', comprimento: 'midi', cor: ['#2f5a52', '#7b2d3a', '#2d3e5c', '#c9b28a'], cor2: '#f2ece0', estampa: 'floral', manga: 'curta', gola: 'v', modelo: 'evase' }],
  1940: [{ parte: 'inteira', forma: 'vestido', comprimento: 'joelho', cor: ['#3f5a48', '#7b2d3a', '#2d3e5c', '#8a7a5a'], manga: 'curta', gola: 'colarinho', modelo: 'evase', cinto: '#3a2a20' }],
  1950: [{ parte: 'inteira', forma: 'vestido', comprimento: 'midi', cor: ['#c2566b', '#2f6a8a', '#f2c200', '#efe7d6'], manga: 'curta', gola: 'redonda', modelo: 'rodado', cinto: '#1b1b1d' }],
  1960: [{ parte: 'inteira', forma: 'vestido', comprimento: 'curto', cor: ['#f2c200', '#1d4fa3', '#c8102e', '#f2efe8', '#2a8a6a'], manga: 'sem', gola: 'redonda', modelo: 'coluna' }]
};
function roupaAntiga(h: number, idade: number, genero: string | undefined, d: number): Conjunto {
  const fem = genero === 'feminino' || (genero !== 'masculino' && h % 2 === 0);
  const sapato: Peca = { parte: 'pes', forma: fem ? 'sapatilha' : 'sapato', cor: ['#3a2a20', '#1b1b1d'], sola: '#1b1515' } as Peca;
  const calca: Peca = { parte: 'baixo', forma: 'calca', corte: 'reta', cor: SOBRIAS, vinco: true, passadores: true };
  const camisa: Peca = { parte: 'cima', forma: 'camisa', cor: CLARAS, manga: d >= 1950 && h % 3 === 0 ? 'curta' : 'longa', gola: 'colarinho', botoes: true, modelo: 'caixa', barra: 'reta' };
  if (idade < 12) {
    // A criança: o menino de bermuda (ou calça curta) e camisa; a menina de vestido na altura do joelho.
    if (fem) return { inteira: cor({ parte: 'inteira', forma: 'vestido', comprimento: 'joelho', cor: ['#c2566b', '#2f6a8a', '#efe7d6', '#7b5a3a'], manga: 'curta', gola: 'redonda', modelo: 'evase' }, h >>> 1), pes: cor(sapato, h >>> 3) };
    return { cima: cor(camisa, h >>> 1), baixo: cor({ parte: 'baixo', forma: 'bermuda', corte: 'reta', cor: SOBRIAS }, h >>> 2), pes: cor(sapato, h >>> 3) };
  }
  if (fem) {
    // Saia e blusa ou o vestido da década; a calça feminina só nos anos 1960, para as jovens.
    if (d >= 1960 && idade < 30 && h % 3 === 0) return { cima: cor({ parte: 'cima', forma: 'blusa', cor: CLARAS, manga: 'curta', gola: 'redonda' } as Peca, h >>> 1), baixo: cor({ parte: 'baixo', forma: 'calca', corte: 'justa', cor: SOBRIAS }, h >>> 2), pes: cor(sapato, h >>> 3) };
    if (h % 3 === 1) return { cima: cor({ parte: 'cima', forma: 'blusa', cor: CLARAS, manga: d < 1920 ? 'longa' : 'curta', gola: d < 1920 ? 'alta' : 'colarinho' } as Peca, h >>> 1), baixo: cor({ parte: 'baixo', forma: 'saia', corte: d < 1920 ? 'midi' : 'midi', cor: SOBRIAS }, h >>> 2), pes: cor(sapato, h >>> 3) };
    const v = VESTIDO_ANTIGO[d] ?? VESTIDO_ANTIGO[1950];
    return { inteira: cor(v[h % v.length], h >>> 1), pes: cor(sapato, h >>> 3) };
  }
  // O homem: o terno na rua até os anos 1950 (um em cada dois); camisa e calça de tecido; o jovem dos anos 1960, de jeans.
  if (d >= 1960 && idade < 30 && h % 2 === 0) return { cima: cor(POLO, h >>> 1), baixo: cor(JEANS_RETO, h >>> 2), pes: cor(LONA, h >>> 3) };
  if (d < 1960 && h % 2 === 0) return { inteira: cor({ parte: 'inteira', forma: 'terno', comprimento: 'calca', cor: SOBRIAS, manga: 'longa', gola: 'colarinho', colete: d < 1940 } as Peca, h >>> 1), pes: cor(sapato, h >>> 3) };
  return { cima: cor(camisa, h >>> 1), baixo: cor(calca, h >>> 2), pes: cor(sapato, h >>> 3) };
}

/** A roupa de todo dia da década para esta pessoa (undefined: a do jogo de hoje). */
export function roupaDaDecada(h: number, idade: number, genero?: string): Conjunto | undefined {
  if (decada === null || decada >= 2020) return undefined;
  if (decada < 1970) return roupaAntiga(h, idade, genero, Math.max(1900, Math.floor(decada / 10) * 10));
  const ops = DECADAS[Math.max(1970, Math.min(2010, decada))];
  if (!ops) return undefined;
  // Os mais velhos vestem o que se usava na juventude: a camisa e a calça de tecido.
  if (idade >= 60) return { cima: cor(CAMISA_MANGA_CURTA, h), baixo: cor(CALCA_TECIDO, h >>> 2), pes: cor(SAPATO, h >>> 3) };
  const o = ops[h % ops.length];
  // A criança: a parte de cima da década, bermuda e tênis.
  if (idade < 12) return { cima: cor(o.cima, h >>> 1), baixo: cor({ parte: 'baixo', forma: 'bermuda', corte: decada === 1980 || decada === 1990 ? 'larga' : 'reta', cor: ['#3d5a80', '#c8102e', '#2a8a6a'] }, h >>> 2), pes: cor(o.pes, h >>> 3) };
  return { cima: cor(o.cima, h >>> 1), baixo: cor(o.baixo, h >>> 2), pes: cor(o.pes, h >>> 3) };
}
