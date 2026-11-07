/**
 * 12.4.1 — AS LOJAS DA VIDA: que lojas a cidade tem, o que cada uma vende, de que marca, por quanto. Os produtos são os
 * de sempre (`dados/coisas`, `dados/estilo`); a compra é a de sempre (`comprarCoisa`, `comprarItem`) — a loja e a marca
 * só mudam o preço e ficam registradas no objeto. Nenhuma logística: o mercado do país decide o que há nas lojas; a
 * cidade, se a loja cabe nela; o resto vem pela internet, com frete (e a importação, quando a marca não é vendida aqui).
 */
import type { Vida } from '../tipos';
import { economiaLocal, municipio, nivelDeOferta } from '../dados/lugares';
import { paisDoCatalogo, existePais } from '../mundo/registro';
import { COISAS, coisa, type Coisa } from '../dados/coisas';
import { ITENS_ESTILO, itemEstilo, type ItemEstilo } from '../dados/estilo';
import { segmentoDaMarca } from './perfilDaMarca';
import { ESTABELECIMENTOS, FATOR_FAIXA, FATOR_FAIXA_LUXO, FATOR_ULTRALUXO, MARCAS, estabelecimento, marca as marcaPorId, type CategoriaDeProduto, type Estabelecimento, type Marca, type Mercado } from '../dados/lojas';

export type Produto = { tipo: 'item' | 'coisa'; id: string };

/** O mercado (a região de consumo) de um país. */
export function mercadoDoPais(pais: string): Mercado {
  if (pais === 'BR') return 'BR';
  if (pais === 'GB') return 'UK';
  if (pais === 'US' || pais === 'CA') return 'NA';
  if (pais === 'MX') return 'LATAM';
  const r = existePais(pais) ? paisDoCatalogo(pais).regiao : undefined;
  return r === 'europa' ? 'EU' : r === 'america_sul' || r === 'america_central_caribe' ? 'LATAM' : r === 'america_norte' ? 'NA' : r === 'africa' ? 'AFR' : r === 'oceania' ? 'OCE' : 'ASIA';
}
export const mercadoDe = (v: Vida): Mercado => mercadoDoPais(municipio(v.moradia.municipioId).pais);

const ELETRO = new Set(['maquina_lavar', 'lava_loucas', 'aspirador_robo', 'ar_condicionado', 'cozinha_equipada']);
const ACESSORIO_SIMPLES = new Set(['pulseira_couro', 'pulseira_contas', 'brincos_argola_grande', 'brincos_cruz', 'brincos_alargador']);

export function categoriaDoItem(it: ItemEstilo): CategoriaDeProduto {
  if (it.categoria === 'oculos') return 'otica';
  if (it.categoria === 'chapeu') return 'acessorios';
  // 12.9: o piercing de ouro e de pedra é joalheria; o de aço, titânio, prata e preto, a loja de acessórios.
  if (it.piercing) return it.piercing.metal === 'ouro' || it.piercing.metal === 'ouro_rose' || it.piercing.metal === 'ouro_branco' ? 'joias' : 'acessorios';
  if (it.categoria === 'acessorio') return it.lugar === 'pulso' ? 'relogios' : ACESSORIO_SIMPLES.has(it.id) ? 'acessorios' : 'joias';
  return it.lugar === 'pes' ? 'calcados' : 'vestuario';
}
export function categoriaDaCoisa(c: Coisa): CategoriaDeProduto {
  if (c.loja === 'eletronicos') return 'eletronicos';
  if (c.loja === 'casa') return ELETRO.has(c.id) || c.eletro ? 'eletrodomesticos' : 'moveis';
  if (c.loja === 'instrumentos') return 'instrumentos';
  if (c.loja === 'esportes') return 'esportes';
  return 'livros';
}
export function categoriaDoProduto(p: Produto): CategoriaDeProduto | undefined {
  if (p.tipo === 'item') { const it = itemEstilo(p.id); return it ? categoriaDoItem(it) : undefined; }
  const c = coisa(p.id); return c ? categoriaDaCoisa(c) : undefined;
}

/** Os produtos de uma categoria (o catálogo inteiro dela). */
export function produtosDaCategoria(cat: CategoriaDeProduto): Produto[] {
  return [
    ...ITENS_ESTILO.filter(it => categoriaDoItem(it) === cat).map(it => ({ tipo: 'item' as const, id: it.id })),
    ...COISAS.filter(c => categoriaDaCoisa(c) === cat).map(c => ({ tipo: 'coisa' as const, id: c.id }))
  ];
}

/** 12.7: o móvel de luxo (segmento 4 em diante) também: só marca premium ou de luxo, e a grife soma menos sobre ele. */
const luxoDo = (p: Produto) => (p.tipo === 'item' ? !!itemEstilo(p.id)?.luxo : (coisa(p.id)?.nivel ?? 0) >= 4);
const precoBase = (p: Produto) => (p.tipo === 'item' ? itemEstilo(p.id)?.preco : coisa(p.id)?.preco) ?? 0;

/** A marca faz este produto, nesta faixa de loja? (o luxo só sai das marcas premium e de luxo; a grife não faz o básico barato) */
function marcaFaz(m: Marca, p: Produto, cat: CategoriaDeProduto): boolean {
  if (!m.categorias.includes(cat) || (m.so && !m.so.includes(p.id))) return false;
  if (luxoDo(p) && m.faixa < 3 && !m.so) return false;
  if (m.faixa === 4 && !m.so && !luxoDo(p) && precoBase(p) < 150) return false;
  return true;
}

/** As lojas que a vida tem: as da cidade (pelo mercado do país e pelo tamanho da cidade) e as da internet. */
export function lojasDaVida(v: Vida): Estabelecimento[] {
  const mer = mercadoDe(v);
  const nivel = nivelDeOferta(v.moradia.municipioId);
  return ESTABELECIMENTOS.filter(e => (!e.mercados || e.mercados.includes(mer)) && (e.tipo === 'online' || nivel >= (e.cidade ?? 0)));
}

export interface Oferta { produto: Produto; marca?: string; preco: number; importado?: boolean }

/** O preço de um produto numa loja, de uma marca (sem loja nem marca: o preço de referência da cidade). */
export function precoNaLoja(v: Vida, p: Produto, marcaId?: string, lojaId?: string): number {
  const base = precoBase(p) * economiaLocal(v.moradia.municipioId).custo;
  const m = marcaId ? marcaPorId(marcaId) : undefined;
  const e = lojaId ? estabelecimento(lojaId) : undefined;
  // VIDA 12.8: o ultraluxo (Hermès, Patek Philippe, Fendi Casa, Gaggenau, Fazioli) cobra acima do luxo.
  const ultra = m && segmentoDaMarca(m.id) === 5;
  let x = base * (m ? (ultra ? (luxoDo(p) ? FATOR_ULTRALUXO.luxo : FATOR_ULTRALUXO.comum) : (luxoDo(p) ? FATOR_FAIXA_LUXO : FATOR_FAIXA)[m.faixa]) : 1);
  if (e?.tipo === 'online') {
    x *= e.frete ?? 1.08;
    // A marca que não tem loja neste mercado vem de fora: a importação pesa.
    if (m && (m.online || (m.mercados && !m.mercados.includes(mercadoDe(v))))) x *= 1.18;
  }
  return Math.max(10, Math.round(x / 10) * 10);
}

/** O que uma loja oferece: cada produto das categorias dela, nas marcas que ela trabalha (e que existem aqui). */
export function ofertasDaLoja(v: Vida, lojaId: string): Oferta[] {
  const e = estabelecimento(lojaId);
  if (!e) return [];
  const mer = mercadoDe(v);
  const out: Oferta[] = [];
  for (const cat of e.categorias) {
    for (const p of produtosDaCategoria(cat)) {
      if (cat === 'livros') { if (e.faixas.includes(1) || e.faixas.includes(2)) out.push({ produto: p, preco: precoNaLoja(v, p, undefined, lojaId) }); continue; }
      const marcas = MARCAS.filter(m => e.faixas.includes(m.faixa) && marcaFaz(m, p, cat) && (e.tipo === 'online' ? (m.online ? lojaId === 'aliexpress' || lojaId === 'amazon' : true) : !m.online && (!m.mercados || m.mercados.includes(mer))));
      for (const m of marcas) out.push({ produto: p, marca: m.id, preco: precoNaLoja(v, p, m.id, lojaId), importado: e.tipo === 'online' && (m.online || (!!m.mercados && !m.mercados.includes(mer))) });
    }
  }
  return out;
}

/** A oferta existe (a loja é da vida, vende o produto daquela marca)? Para a ação conferir o que a tela mandou. */
export function ofertaValida(v: Vida, p: Produto, marcaId?: string, lojaId?: string): boolean {
  if (!lojaId) return !marcaId;
  if (!lojasDaVida(v).some(e => e.id === lojaId)) return false;
  return ofertasDaLoja(v, lojaId).some(o => o.produto.tipo === p.tipo && o.produto.id === p.id && o.marca === marcaId);
}

/** As lojas da vida onde um produto existe (para "onde comprar"). */
export function ondeComprar(v: Vida, p: Produto): Estabelecimento[] {
  const cat = categoriaDoProduto(p);
  return cat ? lojasDaVida(v).filter(e => e.categorias.includes(cat)) : [];
}

export const nomeDaMarca = (id?: string) => (id ? marcaPorId(id)?.nome : undefined);

/* ------------------------------------------------------------ HOTFIX 11.5.1: os segmentos, a busca e os filtros */

/**
 * Os SEGMENTOS da aba Compras: a primeira escolha de quem entra (moda, tecnologia, casa…), antes da loja. Uma loja de
 * departamento aparece em todo segmento que ela atende (a Magazine Luiza em tecnologia e em casa): quem procura uma
 * TV acha ali também.
 */
export type SegmentoDeCompras = 'moda' | 'tecnologia' | 'casa' | 'lazer' | 'veiculos' | 'luxo' | 'moradia' | 'servicos';
export const SEGMENTOS: { id: SegmentoDeCompras; nome: string; frase: string; categorias: CategoriaDeProduto[] }[] = [
  { id: 'moda', nome: 'Moda e acessórios', frase: 'Roupas, calçados, óculos, relógios, joias, bonés e chapéus', categorias: ['vestuario', 'calcados', 'acessorios', 'otica', 'relogios', 'joias'] },
  { id: 'tecnologia', nome: 'Tecnologia', frase: 'Celulares, computadores, consoles, TV, áudio, câmeras', categorias: ['eletronicos'] },
  { id: 'casa', nome: 'Casa', frase: 'Móveis, decoração e eletrodomésticos', categorias: ['moveis', 'eletrodomesticos'] },
  { id: 'lazer', nome: 'Cultura, esporte e lazer', frase: 'Instrumentos, artigos esportivos, livros, arte e jogos', categorias: ['instrumentos', 'esportes', 'livros'] },
  { id: 'veiculos', nome: 'Veículos', frase: 'Carros novos e usados, motos, bicicletas — e a oficina', categorias: [] },
  { id: 'luxo', nome: 'Luxo e coleção', frase: 'Grifes, relógios e joias de coleção, arte, antiguidades, leilões', categorias: [] },
  { id: 'moradia', nome: 'Onde morar', frase: 'Alugar ou comprar a casa', categorias: [] },
  { id: 'servicos', nome: 'Serviços e bichos', frase: 'Banco, estética, adoção e lojas de animais', categorias: [] }
];
export const segmentoDaCategoria = (c: CategoriaDeProduto): SegmentoDeCompras => SEGMENTOS.find(s => s.categorias.includes(c))!.id;
/** Os segmentos de uma loja da vida (a rua das grifes é luxo; as outras, pelo que vendem). */
export const segmentosDaLoja = (e: Estabelecimento): SegmentoDeCompras[] => (e.id === 'grifes' ? ['luxo', 'moda'] : [...new Set(e.categorias.map(segmentoDaCategoria))]);

/** O nome de um produto (o catálogo de roupas ou o de objetos). */
export const nomeDoProduto = (p: Produto) => (p.tipo === 'item' ? itemEstilo(p.id)?.nome : coisa(p.id)?.nome) ?? p.id;

export interface ProdutoNasLojas {
  produto: Produto;
  nome: string;
  categoria: CategoriaDeProduto;
  /** Todas as ofertas da vida (cada loja × marca), da mais barata à mais cara. */
  ofertas: (Oferta & { loja: string })[];
  min: number;
  max: number;
  marcas: string[];
  lojas: string[];
  luxo: boolean;
}

/** O índice de tudo o que a vida pode comprar nas lojas dela: cada produto com as ofertas de todas as lojas. */
export function indiceDeCompras(v: Vida): ProdutoNasLojas[] {
  const por = new Map<string, ProdutoNasLojas>();
  for (const e of lojasDaVida(v)) {
    for (const o of ofertasDaLoja(v, e.id)) {
      const k = `${o.produto.tipo}:${o.produto.id}`;
      let x = por.get(k);
      if (!x) { x = { produto: o.produto, nome: nomeDoProduto(o.produto), categoria: categoriaDoProduto(o.produto)!, ofertas: [], min: Infinity, max: 0, marcas: [], lojas: [], luxo: luxoDo(o.produto) }; por.set(k, x); }
      x.ofertas.push({ ...o, loja: e.id });
      x.min = Math.min(x.min, o.preco); x.max = Math.max(x.max, o.preco);
      if (o.marca && !x.marcas.includes(o.marca)) x.marcas.push(o.marca);
      if (!x.lojas.includes(e.id)) x.lojas.push(e.id);
    }
  }
  for (const x of por.values()) x.ofertas.sort((a, b) => a.preco - b.preco);
  return [...por.values()];
}

/** Sem acento, sem maiúscula: "Óculos" acha "oculos". */
export const normalizarBusca = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export type OrdemDeCompras = 'relevancia' | 'menor' | 'maior';
export interface FiltroDeCompras { texto?: string; categoria?: CategoriaDeProduto | ''; marca?: string; precoMin?: number; precoMax?: number; ordem?: OrdemDeCompras; segmento?: SegmentoDeCompras | '' }
/** As faixas de preço do filtro (no dinheiro da cidade: o limite é sobre o preço daqui). */
export const FAIXAS_DE_PRECO: { id: string; rotulo: string; min?: number; max?: number }[] = [
  { id: '', rotulo: 'Qualquer preço' }, { id: 'ate200', rotulo: 'Até 200', max: 200 }, { id: '200a1000', rotulo: '200 a 1.000', min: 200, max: 1000 },
  { id: '1000a5000', rotulo: '1.000 a 5.000', min: 1000, max: 5000 }, { id: '5000a20000', rotulo: '5.000 a 20.000', min: 5000, max: 20000 }, { id: 'mais20000', rotulo: 'Mais de 20.000', min: 20000 }
];

/**
 * A busca e os filtros: o texto procura no nome do produto, na descrição curta, nas marcas que o fazem e nas lojas
 * que o vendem; a marca e a faixa de preço filtram as OFERTAS (o produto fica se alguma oferta passa, e o preço
 * mostrado é o da melhor oferta que passou). Relevância: o nome que começa com o texto, depois o nome que contém,
 * depois a marca, depois a loja; no empate, o mais barato.
 */
export function buscarNasLojas(indice: ProdutoNasLojas[], f: FiltroDeCompras): (ProdutoNasLojas & { relevancia: number; melhor: ProdutoNasLojas['ofertas'][number] })[] {
  const q = normalizarBusca(f.texto ?? '');
  const termos = q.split(/\s+/).filter(Boolean);
  const out: (ProdutoNasLojas & { relevancia: number; melhor: ProdutoNasLojas['ofertas'][number] })[] = [];
  for (const x of indice) {
    if (f.categoria && x.categoria !== f.categoria) continue;
    if (f.segmento && segmentoDaCategoria(x.categoria) !== f.segmento) continue;
    const ofertas = x.ofertas.filter(o => (!f.marca || o.marca === f.marca) && (f.precoMin === undefined || o.preco >= f.precoMin) && (f.precoMax === undefined || o.preco <= f.precoMax));
    if (!ofertas.length) continue;
    let relevancia = 1;
    if (termos.length) {
      const nome = normalizarBusca(x.nome);
      const desc = normalizarBusca((x.produto.tipo === 'item' ? itemEstilo(x.produto.id)?.descricao : coisa(x.produto.id)?.descricao) ?? '');
      const marcas = ofertas.map(o => normalizarBusca(o.marca ? marcaPorId(o.marca)?.nome ?? '' : ''));
      const lojas = [...new Set(ofertas.map(o => normalizarBusca(estabelecimento(o.loja)?.nome ?? '')))];
      const categoria = normalizarBusca(NOME_CATEGORIA_BUSCA[x.categoria]);
      let total = 0;
      for (const t of termos) {
        const p = nome.startsWith(t) ? 6 : nome.split(/\s+/).some(w => w.startsWith(t)) ? 5 : nome.includes(t) ? 4 : marcas.some(m => m.startsWith(t) || m.split(/\s+/).some(w => w.startsWith(t))) ? 3 : categoria.includes(t) ? 2.5 : lojas.some(l => l.includes(t)) ? 2 : desc.includes(t) ? 1 : 0;
        if (!p) { total = 0; break; }
        total += p;
      }
      if (!total) continue;
      relevancia = total;
      // A marca que o texto pediu: a melhor oferta é a dela.
      const daMarca = ofertas.filter(o => o.marca && termos.some(t => normalizarBusca(marcaPorId(o.marca!)?.nome ?? '').split(/\s+/).some(w => w.startsWith(t))));
      if (daMarca.length) { out.push({ ...x, relevancia, melhor: daMarca[0] }); continue; }
    }
    out.push({ ...x, relevancia, melhor: ofertas[0] });
  }
  const ordem = f.ordem ?? 'relevancia';
  return out.sort((a, b) => ordem === 'menor' ? a.melhor.preco - b.melhor.preco : ordem === 'maior' ? b.melhor.preco - a.melhor.preco : b.relevancia - a.relevancia || a.melhor.preco - b.melhor.preco);
}

/** As lojas da vida cujo nome (ou o que vendem, na frase) bate com o texto. */
export function buscarLojas(v: Vida, texto: string): Estabelecimento[] {
  const q = normalizarBusca(texto);
  if (q.length < 2) return [];
  return lojasDaVida(v).filter(e => normalizarBusca(e.nome).includes(q) || normalizarBusca(e.frase).split(/[\s,]+/).some(w => w.startsWith(q)));
}

const NOME_CATEGORIA_BUSCA: Record<CategoriaDeProduto, string> = {
  vestuario: 'roupas roupa vestuario moda', calcados: 'calcados calcado sapato tenis', acessorios: 'acessorios bone chapeu', otica: 'oculos otica', relogios: 'relogios relogio',
  joias: 'joias joia', eletronicos: 'eletronicos tecnologia', eletrodomesticos: 'eletrodomesticos', moveis: 'moveis casa decoracao', instrumentos: 'instrumentos musica',
  esportes: 'esporte esportes', livros: 'livros arte jogos'
};
