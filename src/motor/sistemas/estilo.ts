/**
 * Aparência ≠ estilo ≠ notoriedade ≠ imagem pública.
 *
 *   APARÊNCIA (`corpo.aparencia`): atributo pessoal — cuidado, saúde, traços.
 *   ESTILO (aqui): como a pessoa ESCOLHE se apresentar — o corte, a cor, a
 *     barba, os óculos, o chapéu, a roupa. Persistente, mutável ao longo da
 *     vida, com autonomia por idade. Não tem moral: não há visual "certo".
 *   NOTORIEDADE (`notoriedade`): quanto o público conhece a pessoa. Comprar
 *     um chapéu não muda isso — nem um relógio de luxo.
 *   IMAGEM PÚBLICA (`notoriedade.imagemPublica`): como uma pessoa JÁ
 *     conhecida é percebida. Só existe com notoriedade; o estilo pode
 *     colorir essa imagem (marcante), nunca criá-la.
 */

import type { ItemDeEstilo, Vida, Visual } from '../tipos';
import { rngDe } from '../rng';
import { escrever, idade, marcarFato, novoId, temFato } from '../nucleo';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';
import { AUTONOMIA, autonomia } from './autonomia';
import { BARBAS, CORES_NATURAIS, CORES_TINTA, CORTES, ITENS_ESTILO, itemEstilo, ROUPAS, sinalDoEstilo } from '../dados/estilo';
import { economiaLocal } from '../dados/lugares';
import { vereditoDePagar, pagar } from './dinheiro';
import { dinheiro as fmt } from '../texto';
import { moraComFamiliaDeOrigem } from './domicilio';

export type MudancaVisual = Partial<Pick<Visual, 'cabelo' | 'corCabelo' | 'barba' | 'bigode' | 'oculos' | 'chapeu' | 'roupa'>>;

/** O rosto já permite barba? (O corpo, não o gênero, decide; aqui a aproximação é pelo retrato.) */
export const podeTerBarba = (v: Vida) => v.eu.genero !== 'feminino' && idade(v) >= AUTONOMIA.barba.idade;

/** O corpo pediu óculos de grau? (Miopia na infância, em parte das pessoas; vista cansada depois dos 42.) */
export function precisaDeOculos(v: Vida): boolean {
  const i = idade(v);
  if (i >= 42) return true;
  const h = rngDe(v.id, 'miopia').next();
  return i >= 8 && h < 0.28 && i >= 8 + Math.floor(h * 30);
}

/** O preço de um item nesta cidade. */
export const precoDoItem = (v: Vida, id: string) => Math.round((itemEstilo(id)?.preco ?? 0) * economiaLocal(v.moradia.municipioId).custo / 10) * 10;

export const itensDaPessoa = (v: Vida): ItemDeEstilo[] => v.eu.estilo?.itens ?? [];
export const temItem = (v: Vida, id: string) => itensDaPessoa(v).some(x => x.itemId === id);

/* -------------------------------------------------------- Mudar o visual */

export function disponibilidadeAparencia(v: Vida, m: MudancaVisual): Veredito {
  const i = idade(v);
  const vis = v.eu.visual;
  const campos = Object.keys(m) as (keyof MudancaVisual)[];
  if (!campos.length) return bloqueio('impossivel', 'Nada a mudar.');
  const base = autonomia(v, 'aparencia_basica');
  if (base.grau !== 'permitido') return base;
  if (v.justica?.prisao) return bloqueio('incompativel', 'Na prisão, o visual é o que a unidade permite.');
  for (const k of campos) {
    const x = m[k];
    if (k === 'cabelo') {
      const c = CORTES.find(y => y.id === x);
      if (!c) return bloqueio('impossivel', 'Esse corte não existe.');
      if (x === vis.cabelo) return bloqueio('incompativel', 'Já é esse o corte.');
      if (i < AUTONOMIA.aparencia.idade && (x === 'raspado' || x === 'black' || x === 'trancas')) return bloqueio('impossivel', AUTONOMIA.aparencia.antes);
    }
    if (k === 'corCabelo') {
      if (x === vis.corCabelo) return bloqueio('incompativel', 'Já é essa a cor.');
      const natural = v.eu.estilo?.corNatural ?? vis.corCabelo;
      const tinta = CORES_TINTA.includes(x as string) || (CORES_NATURAIS.includes(x as string) && x !== natural);
      if (!tinta && x !== natural) return bloqueio('impossivel', 'Essa cor não existe.');
      if (tinta && i < AUTONOMIA.aparencia.idade) return bloqueio('impossivel', 'Pintar o cabelo ainda passa pela família.');
    }
    if (k === 'barba' || k === 'bigode') {
      if (!podeTerBarba(v)) return bloqueio('impossivel', i < AUTONOMIA.barba.idade ? AUTONOMIA.barba.antes : 'O rosto não tem barba.');
      if (k === 'barba' && !BARBAS.some(b => b.id === x)) return bloqueio('impossivel', 'Essa barba não existe.');
    }
    if (k === 'oculos' && x !== undefined) {
      const tem = itensDaPessoa(v).some(y => itemEstilo(y.itemId)?.visual?.oculos === x);
      if (!tem) return bloqueio('requisito', 'Precisa ter esses óculos (na loja de acessórios, em Vida).');
    }
    if (k === 'chapeu' && x !== undefined) {
      const tem = itensDaPessoa(v).some(y => itemEstilo(y.itemId)?.visual?.chapeu === x);
      if (!tem) return bloqueio('requisito', 'Precisa ter um desses (na loja de acessórios, em Vida).');
    }
    if (k === 'roupa' && x !== undefined && x !== 'basica') {
      if (!ROUPAS.some(r => r.id === x)) return bloqueio('impossivel', 'Esse estilo não existe.');
      const tem = itensDaPessoa(v).some(y => itemEstilo(y.itemId)?.visual?.roupa === x);
      if (!tem) return bloqueio('requisito', 'Precisa ter essas roupas (na loja, em Vida).');
    }
  }
  return PERMITIDO;
}

/** Uma mudança que se nota de longe (e, em quem é conhecido, pode virar assunto). */
function marcante(antes: Visual, m: MudancaVisual): boolean {
  return (m.cabelo === 'raspado' && antes.cabelo !== 'raspado') || (!!m.corCabelo && CORES_TINTA.includes(m.corCabelo)) || (m.barba === 'cheia' && antes.barba !== 'cheia') || (!!m.chapeu && m.chapeu !== antes.chapeu) || (m.cabelo === 'black' && antes.cabelo !== 'black');
}

/** Muda o visual. Não entra na Linha da Vida (cortar o cabelo não é biografia) — a não ser que o público repare. */
export function mudarAparencia(v: Vida, m: MudancaVisual): string {
  const vis = v.eu.visual;
  const antes = { ...vis };
  v.eu.estilo ??= { itens: [] };
  if (m.corCabelo && !v.eu.estilo.corNatural) v.eu.estilo.corNatural = vis.corCabelo;
  for (const k of Object.keys(m) as (keyof MudancaVisual)[]) {
    const x = m[k];
    if (k === 'barba') vis.barba = x === 'nenhuma' ? undefined : x as string;
    else if (x === undefined || (k === 'roupa' && x === 'basica')) delete (vis as unknown as Record<string, unknown>)[k];
    else (vis as unknown as Record<string, unknown>)[k] = x;
  }
  // Tirar ou pôr um item muda o "em uso" dele.
  for (const it of v.eu.estilo.itens) {
    const d = itemEstilo(it.itemId)?.visual;
    if (!d) continue;
    if (d.oculos) it.usando = vis.oculos === d.oculos;
    if (d.chapeu) it.usando = vis.chapeu === d.chapeu;
    if (d.roupa) it.usando = vis.roupa === d.roupa;
  }
  v.eu.estilo.tMudanca = v.t;
  const conhecida = (v.notoriedade?.valor ?? 0) >= 30;
  if (conhecida && marcante(antes, m) && rngDe(v.id, 'visual', v.t, v.seq).chance(0.6)) {
    v.fatos['visual_repercutiu'] = v.t;
    escrever(v, { texto: 'A mudança de visual virou assunto: fotos, comentários, gente copiando.', relevancia: 'cotidiano', tema: 'trabalho' });
    return 'O visual novo apareceu nas fotos — e virou assunto.';
  }
  return 'Visual novo. No espelho, a mesma pessoa — de outro jeito.';
}

/* ------------------------------------------------------------- Comprar */

export function disponibilidadeComprarItem(v: Vida, itemId: string): Veredito {
  const it = itemEstilo(itemId);
  if (!it) return bloqueio('impossivel', 'Esse item não existe.');
  const a = autonomia(v, 'compra_pessoal');
  if (a.grau !== 'permitido') return a;
  if (temItem(v, itemId)) return bloqueio('incompativel', 'Você já tem.');
  if (it.receita && !precisaDeOculos(v)) return bloqueio('requisito', 'Óculos de grau pedem receita: a sua vista não pediu (ainda).');
  if (v.justica?.prisao) return bloqueio('incompativel', 'Na prisão, não.');
  return vereditoDePagar(v, precoDoItem(v, itemId));
}

export function comprarItem(v: Vida, itemId: string, pagoPelaFamilia = false): string {
  const it = itemEstilo(itemId)!;
  const preco = precoDoItem(v, itemId);
  if (!pagoPelaFamilia) pagar(v, preco);
  v.eu.estilo ??= { itens: [] };
  const item: ItemDeEstilo = { id: novoId(v, 'est'), itemId, t: v.t, preco, usando: true };
  v.eu.estilo.itens.push(item);
  // Passa a usar (o que ocupa o mesmo lugar sai: a mesma categoria que aparece no retrato, o mesmo pulso, o mesmo pescoço).
  for (const x of v.eu.estilo.itens) if (x !== item && mesmoLugar(it, itemEstilo(x.itemId))) x.usando = false;
  if (it.visual) Object.assign(v.eu.visual, it.visual);
  v.eu.estilo.tMudanca = v.t;
  return it.luxo ? `Comprou ${it.nome.toLowerCase()} por ${fmt(preco)}. ${efeitoDoLuxo(v)}` : `Comprou ${it.nome.toLowerCase()}${pagoPelaFamilia ? '' : ` por ${fmt(preco)}`}.`;
}

/**
 * O que o luxo faz (e não faz) — pela notoriedade que JÁ existe. Luxo mexe no
 * estilo e na imagem material; não cria fama. Para quem o público já
 * reconhece, aparece nas fotos e entra na imagem pública (`imagemPublica`);
 * para quem é anônimo, é só um objeto bonito.
 */
export function efeitoDoLuxo(v: Vida): string {
  const x = v.notoriedade?.valor ?? 0;
  if (x >= 55) return 'Nas fotos, todo mundo repara — vira parte de como o público vê você, não do quanto ele conhece você.';
  if (x >= 30) return 'Quem reconhece você na rua repara. Não é isso que faz alguém saber o seu nome.';
  if (x >= 10) return 'É bonito. Quem já conhece o seu trabalho pode até reparar; o nome não cresce por causa disso.';
  return 'É bonito. Ninguém na rua passa a saber quem você é por causa disso.';
}

/** Dois itens disputam o mesmo lugar (só um de cada vez)? */
function mesmoLugar(a: ReturnType<typeof itemEstilo>, b: ReturnType<typeof itemEstilo>): boolean {
  if (!a || !b) return false;
  if (a.lugar || b.lugar) return a.lugar === b.lugar;
  return !!a.visual && !!b.visual && a.categoria === b.categoria;
}

export function usarItem(v: Vida, itemId: string, usar: boolean): string {
  const it = itemEstilo(itemId)!;
  const x = itensDaPessoa(v).find(y => y.itemId === itemId)!;
  if (usar) for (const y of itensDaPessoa(v)) if (y !== x && mesmoLugar(it, itemEstilo(y.itemId))) y.usando = false;
  if (it.visual) {
    const m: MudancaVisual = {};
    if (it.visual.oculos) m.oculos = usar ? it.visual.oculos : undefined;
    if (it.visual.chapeu) m.chapeu = usar ? it.visual.chapeu : undefined;
    if (it.visual.roupa) m.roupa = usar ? it.visual.roupa : 'basica';
    mudarAparencia(v, m);
    if (it.visual.joia) v.eu.visual.joia = usar ? it.visual.joia : undefined;
  }
  x.usando = usar;
  return usar ? `Passou a usar: ${it.nome.toLowerCase()}.` : `Guardou: ${it.nome.toLowerCase()}.`;
}

export function disponibilidadeUsarItem(v: Vida, itemId: string, usar: boolean): Veredito {
  const x = itensDaPessoa(v).find(y => y.itemId === itemId);
  if (!x) return bloqueio('impossivel', 'Você não tem isso.');
  if (x.usando === usar) return bloqueio('incompativel', usar ? 'Já está usando.' : 'Já está guardado.');
  return PERMITIDO;
}

/* ------------------------------------------------------------- Status */

export { sinalDoEstilo };

/**
 * O ano do estilo: a criança que passa a apertar os olhos na lousa ganha
 * óculos de grau — a família compra (o custo sai da casa de origem). O
 * adulto a quem a vista cansou fica sabendo, e decide.
 */
export function processarEstilo(v: Vida): void {
  const i = idade(v);
  if (i < 8 || temItem(v, 'oculos_grau') || !precisaDeOculos(v)) return;
  if (i < 18 && moraComFamiliaDeOrigem(v) && !temFato(v, 'oculos_da_familia')) {
    marcarFato(v, 'oculos_da_familia');
    comprarItem(v, 'oculos_grau', true);
    v.origem.reserva = Math.max(0, Math.round((v.origem.reserva ?? 0) - precoDoItem(v, 'oculos_grau')));
    escrever(v, { texto: 'Na escola, perceberam que você apertava os olhos para ler a lousa. Veio a consulta — e os primeiros óculos.', relevancia: 'cotidiano', tema: 'saude' });
  } else if (i >= 42 && !temFato(v, 'vista_cansada')) {
    marcarFato(v, 'vista_cansada');
    escrever(v, { texto: 'O cardápio começou a ficar longe demais do braço. A vista cansou.', relevancia: 'cotidiano', tema: 'saude' });
  }
}

export { ITENS_ESTILO };
