/**
 * ERAS HISTÓRICAS · A MODA NO TEMPO — o que se vendia e se vestia em cada época (Brasil).
 *
 * Duas coisas, ambas no MESMO catálogo de sempre (`dados/estilo.ITENS_ESTILO`, `ui/avatar/pecas`):
 *
 *   1. As PEÇAS DA ÉPOCA (`ITENS_ESTILO_ERAS`): cada uma com a silhueta própria (não é recolorir): o blazer de ombreira,
 *      a calça cenoura de cintura alta e lavagem clara, o fuseau, o moletom de estampa geométrica, a bermuda de surfista,
 *      a jaqueta de náilon bicolor (anos 1980); o jeans baggy e a camiseta larga estampada (anos 1990); o jeans boca de
 *      sino de cintura baixa e a baby look (anos 2000); a calça boca de sino e a camisa de golão (anos 1970). `epoca` =
 *      os anos em que a loja vende. Uma vida contemporânea não as vê na loja (o jogo de hoje não muda).
 *   2. As peças de HOJE que têm data (`ITENS_DESDE`): o relógio inteligente, o tecido dry-fit, o chinelo slide, o
 *      "oversized" como modelagem de vitrine, o boné "dad hat", o tênis de colaboração numerada, o jeans skinny.
 *      Numa vida histórica, só entram na loja a partir do ano.
 *
 * O básico atravessa as décadas (a camiseta lisa, a calça jeans, a camisa social, o tênis, o vestido): a época não vira
 * fantasia, e a pessoa continua vestindo o que quiser. Os períodos são APROXIMAÇÕES de quando a peça esteve à venda e em
 * uso corrente no Brasil (fontes gerais: acervos de moda do Museu da Moda/MIMo, revistas e catálogos de varejo da época
 * na Hemeroteca Digital da Biblioteca Nacional; ver docs/eras/FONTES.md). Nenhuma marca real é associada a uma peça.
 *
 * Preços: reais de 2026 (a referência de sempre); na vida histórica, o preço relativo do vestuário da época
 * (`eras/base/economia`, IPCA) entra na loja.
 */

import type { ItemEstilo } from '../../dados/estilo';
import type { Vida } from '../../tipos';

const anoDe = (t: number) => Math.floor(t / 12);

export type ItemDaEpoca = ItemEstilo & { epoca: [number, number] };

export const ITENS_ESTILO_ERAS: readonly ItemDaEpoca[] = [
  // ------------------------------------------------------------ anos 1970
  { id: 'ep_calca_boca_sino', nome: 'Calça boca de sino', categoria: 'roupa', lugar: 'pernas', preco: 189, nivel: 2, estilos: ['vintage', 'casual'], ocasioes: ['dia', 'festa'], epoca: [1968, 1981], descricao: 'Justa até o joelho e abrindo até cobrir o sapato. Cintura no lugar, tecido de brim ou de veludo cotelê.' },
  { id: 'ep_camisa_golao', nome: 'Camisa de golão', categoria: 'roupa', lugar: 'tronco', preco: 159, nivel: 2, estilos: ['vintage', 'festa'], ocasioes: ['dia', 'festa'], epoca: [1969, 1982], descricao: 'Colarinho de pontas compridas por cima da gola do paletó, estampa miúda, ajustada no corpo.' },
  // ------------------------------------------------------------ anos 1980
  { id: 'ep_blazer_ombreira', nome: 'Blazer com ombreiras', categoria: 'roupa', lugar: 'casaco', preco: 389, nivel: 2, estilos: ['elegante', 'tradicional'], ocasioes: ['trabalho', 'festa'], epoca: [1981, 1994], descricao: 'Ombro largo e quadrado de enchimento, manga arregaçada se for o caso, comprido até o quadril.' },
  { id: 'ep_jeans_cenoura', nome: 'Jeans cenoura de cintura alta', categoria: 'roupa', lugar: 'pernas', preco: 199, nivel: 2, estilos: ['casual', 'vintage'], ocasioes: ['dia', 'estudo', 'festa'], epoca: [1983, 1996], descricao: 'Cintura lá em cima, largo no quadril e afunilando até o tornozelo. Lavagem clara, desbotada na pedra.' },
  { id: 'ep_fuseau', nome: 'Fuseau', categoria: 'roupa', lugar: 'pernas', preco: 89, nivel: 1, estilos: ['esportivo', 'casual'], ocasioes: ['dia', 'esporte'], epoca: [1984, 1994], descricao: 'Calça de malha justa com o pezinho que prende embaixo do pé — da ginástica para a rua.' },
  { id: 'ep_moletom_geometrico', nome: 'Moletom de estampa geométrica', categoria: 'roupa', lugar: 'tronco', preco: 149, nivel: 2, estilos: ['casual', 'urbano'], ocasioes: ['dia', 'estudo'], epoca: [1984, 1995], descricao: 'Felpa por dentro, gola careca, triângulos e ziguezagues em cores fortes, ombro largo.' },
  { id: 'ep_camiseta_fluor', nome: 'Camiseta de cor fluorescente', categoria: 'roupa', lugar: 'tronco', preco: 59, nivel: 1, estilos: ['casual', 'esportivo'], ocasioes: ['dia', 'festa', 'esporte'], epoca: [1985, 1993], descricao: 'Verde-limão, rosa-choque, laranja: a cor que brilha na luz negra da danceteria.' },
  { id: 'ep_bermuda_surf', nome: 'Bermuda de surfista estampada', categoria: 'roupa', lugar: 'pernas', preco: 119, nivel: 1, estilos: ['casual', 'esportivo'], ocasioes: ['dia', 'esporte'], epoca: [1982, 1999], descricao: 'Larga, comprida até o joelho, estampa de flor grande, cordão na cintura e velcro no bolso.' },
  { id: 'ep_jaqueta_nailon', nome: 'Jaqueta de náilon bicolor', categoria: 'roupa', lugar: 'casaco', preco: 229, nivel: 2, estilos: ['esportivo', 'urbano'], ocasioes: ['dia', 'esporte'], epoca: [1985, 1999], descricao: 'Corta-vento de duas cores, capuz guardado na gola, punho e barra de elástico. Faz barulho ao andar.' },
  // ------------------------------------------------------------ anos 1990
  { id: 'ep_jeans_baggy', nome: 'Jeans largo (baggy)', categoria: 'roupa', lugar: 'pernas', preco: 199, nivel: 2, estilos: ['streetwear', 'urbano', 'casual'], ocasioes: ['dia', 'estudo', 'festa'], epoca: [1991, 2006], descricao: 'Bem largo do quadril à barra, comprido a ponto de embolar em cima do tênis.' },
  { id: 'ep_camiseta_estampada90', nome: 'Camiseta larga de estampa colorida', categoria: 'roupa', lugar: 'tronco', preco: 69, nivel: 1, estilos: ['casual', 'streetwear'], ocasioes: ['dia', 'estudo'], epoca: [1990, 2001], descricao: 'Grande, de manga até o cotovelo, estampa de formas e cores que não combinam — de propósito.' },
  // ------------------------------------------------------------ anos 2000
  { id: 'ep_jeans_flare_baixa', nome: 'Jeans boca de sino de cintura baixa', categoria: 'roupa', lugar: 'pernas', preco: 219, nivel: 2, estilos: ['casual', 'festa'], ocasioes: ['dia', 'festa', 'encontro'], epoca: [1999, 2010], descricao: 'Cós baixo no quadril, justo na coxa, abrindo do joelho para baixo.' },
  { id: 'ep_baby_look', nome: 'Camiseta baby look', categoria: 'roupa', lugar: 'tronco', preco: 49, nivel: 1, estilos: ['casual'], ocasioes: ['dia', 'festa'], epoca: [1998, 2010], descricao: 'Curtinha e justa, manga mínima, malha com elastano.' }
];

/** Peças de hoje com ano de chegada às lojas brasileiras (APROXIMAÇÃO; vida contemporânea: sem efeito). */
export const ITENS_DESDE: Readonly<Record<string, number>> = {
  smartwatch: 2015, camiseta_dry_fit: 2000, chinelo_slide: 2015, moletom_oversized: 2014, camiseta_oversized: 2016, bone_dad: 2016,
  tenis_colab_raro: 2005, tenis_colecionavel: 2005, jeans_skinny: 2005, jeans_reto_premium: 2008, oculos_juliet: 1996,
  relogio_digital_retro: 2010, camiseta_grife: 2010, moletom_grife: 2012, camiseta_pima: 2012, camiseta_henley: 2010, regata_alcinha: 1995
};

const POR_ID = new Map(ITENS_ESTILO_ERAS.map(i => [i.id, i]));
export const ehItemDaEpoca = (id: string) => POR_ID.has(id);

/**
 * A peça está à venda no ano desta vida? Vida contemporânea: tudo o que sempre esteve (as peças da época não). Vida
 * histórica: as da época dentro do período; as de hoje a partir da chegada; as demais (o básico), sempre.
 */
export function itemDeEstiloAVenda(v: Vida, id: string, ano = anoDe(v.t)): boolean {
  const e = POR_ID.get(id);
  if (!v.era || ano > 2025) return !e;
  if (e) return ano >= e.epoca[0] && ano <= e.epoca[1];
  const d = ITENS_DESDE[id];
  return d === undefined || ano >= d;
}

/** A década visual de um ano (o que a Figura veste por padrão). */
export const decadaDaModa = (ano: number) => Math.floor(ano / 10) * 10;

/**
 * ERAS v2 · O CABELO DA DÉCADA — os cortes que marcaram cada época, por textura (APROXIMAÇÃO lida dos mesmos acervos da
 * moda). Uma parte das pessoas sorteadas numa vida histórica usa um deles; o resto, o corte de sempre. Nenhum corte é
 * proibido em época nenhuma: a pessoa escolhe o que quiser.
 */
const CABELO_DA_DECADA: Record<number, Record<string, string[]>> = {
  1970: { liso: ['longo_liso', 'shag', 'longo_franja'], ondulado: ['shag', 'longo_ondulado'], cacheado: ['black', 'cacheado_longo'], crespo: ['black'] },
  1980: { liso: ['mullet', 'topete', 'longo_franja'], ondulado: ['mullet', 'cacheado'], cacheado: ['cacheado_longo', 'cacheado'], crespo: ['black', 'crespo_curto'] },
  1990: { liso: ['curto_lado', 'chanel', 'longo_liso'], ondulado: ['curto_lado', 'chanel'], cacheado: ['cacheado', 'trancas'], crespo: ['trancas', 'raspado'] },
  2000: { liso: ['longo_franja', 'moicano', 'longo_liso'], ondulado: ['longo_franja', 'moicano'], cacheado: ['cacheado', 'cacheado_longo'], crespo: ['trancas', 'crespo_curto'] },
  2010: { liso: ['undercut', 'degrade', 'coque', 'meio_preso'], ondulado: ['undercut', 'meio_preso'], cacheado: ['cacheado_longo', 'degrade'], crespo: ['black', 'degrade', 'locs'] }
};
export function cabeloDaDecada(ano: number, textura: string): string[] {
  const d = Math.max(1970, Math.min(2010, decadaDaModa(ano)));
  return CABELO_DA_DECADA[d]?.[textura === 'encaracolado' ? 'cacheado' : textura] ?? [];
}
