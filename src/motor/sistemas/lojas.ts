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
import { ESTABELECIMENTOS, FATOR_FAIXA, FATOR_FAIXA_LUXO, MARCAS, estabelecimento, marca as marcaPorId, type CategoriaDeProduto, type Estabelecimento, type Marca, type Mercado } from '../dados/lojas';

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
const ACESSORIO_SIMPLES = new Set(['pulseira_couro', 'pulseira_contas']);

export function categoriaDoItem(it: ItemEstilo): CategoriaDeProduto {
  if (it.categoria === 'oculos') return 'otica';
  if (it.categoria === 'chapeu') return 'acessorios';
  if (it.categoria === 'acessorio') return it.lugar === 'pulso' ? 'relogios' : ACESSORIO_SIMPLES.has(it.id) ? 'acessorios' : 'joias';
  return it.lugar === 'pes' ? 'calcados' : 'vestuario';
}
export function categoriaDaCoisa(c: Coisa): CategoriaDeProduto {
  if (c.loja === 'eletronicos') return 'eletronicos';
  if (c.loja === 'casa') return ELETRO.has(c.id) ? 'eletrodomesticos' : 'moveis';
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

const luxoDo = (p: Produto) => p.tipo === 'item' && !!itemEstilo(p.id)?.luxo;
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
  let x = base * (m ? (luxoDo(p) ? FATOR_FAIXA_LUXO : FATOR_FAIXA)[m.faixa] : 1);
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
