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
import { nomeDaMarca, ofertaValida, precoNaLoja } from './lojas';
import { BARBAS, CORES_NATURAIS, CORES_TINTA, CORTES, ITENS_ESTILO, itemEstilo, lugaresDoItem, ROUPAS, sinalDoEstilo, TIPOS_DE_CABELO } from '../dados/estilo';
import { IDADE_MINIMA_PIERCING } from '../dados/piercings129';
import { geneticaDe, guardarGenes } from './identidade';
import { economiaLocal } from '../dados/lugares';
import { vereditoDePagar, pagar } from './dinheiro';
import { dinheiro as fmt } from '../texto';
import { moraComFamiliaDeOrigem } from './domicilio';

export type MudancaVisual = Partial<Pick<Visual, 'cabelo' | 'corCabelo' | 'textura' | 'barba' | 'bigode' | 'oculos' | 'chapeu' | 'roupa'>>;

/** O tipo de cabelo com que a pessoa nasceu (os genes; sem genes guardados, o visual é a genética). */
export const texturaNatural = (v: Vida): string | undefined => geneticaDe(v.eu)?.textura;

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
      if (i < AUTONOMIA.aparencia.idade && (x === 'raspado' || x === 'black' || x === 'trancas' || x === 'locs')) return bloqueio('impossivel', AUTONOMIA.aparencia.antes);
    }
    if (k === 'corCabelo') {
      if (x === vis.corCabelo) return bloqueio('incompativel', 'Já é essa a cor.');
      const natural = v.eu.estilo?.corNatural ?? vis.corCabelo;
      const tinta = CORES_TINTA.includes(x as string) || (CORES_NATURAIS.includes(x as string) && x !== natural);
      if (!tinta && x !== natural) return bloqueio('impossivel', 'Essa cor não existe.');
      if (tinta && i < AUTONOMIA.aparencia.idade) return bloqueio('impossivel', 'Pintar o cabelo ainda passa pela família.');
    }
    if (k === 'textura') {
      if (!TIPOS_DE_CABELO.some(t => t.id === x)) return bloqueio('impossivel', 'Esse tipo de cabelo não existe.');
      if (x === vis.textura) return bloqueio('incompativel', 'O cabelo já é assim.');
      // Voltar ao natural é sempre possível; alisar ou fazer cachos é química — passa pela idade de decidir o visual.
      if (x !== texturaNatural(v) && i < AUTONOMIA.aparencia.idade) return bloqueio('impossivel', 'Alisar ou fazer cachos ainda passa pela família.');
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
  return (m.cabelo === 'raspado' && antes.cabelo !== 'raspado') || (!!m.corCabelo && CORES_TINTA.includes(m.corCabelo)) || (!!m.barba && ['cheia', 'longa', 'bigodao'].includes(m.barba) && antes.barba !== m.barba) || (!!m.chapeu && m.chapeu !== antes.chapeu) || (m.cabelo === 'black' && antes.cabelo !== 'black');
}

/** Muda o visual. Não entra na Linha da Vida (cortar o cabelo não é biografia) — a não ser que o público repare. */
export function mudarAparencia(v: Vida, m: MudancaVisual, alvo?: ItemDeEstilo): string {
  const vis = v.eu.visual;
  const antes = { ...vis };
  v.eu.estilo ??= { itens: [] };
  if (m.corCabelo && !v.eu.estilo.corNatural) v.eu.estilo.corNatural = vis.corCabelo;
  // O tipo de cabelo é genético: antes da primeira química, os genes ficam guardados (os filhos herdam o natural).
  if (m.textura) guardarGenes(v.eu);
  for (const k of Object.keys(m) as (keyof MudancaVisual)[]) {
    const x = m[k];
    if (k === 'barba') vis.barba = x === 'nenhuma' ? undefined : x as string;
    else if (x === undefined || (k === 'roupa' && x === 'basica')) delete (vis as unknown as Record<string, unknown>)[k];
    else (vis as unknown as Record<string, unknown>)[k] = x;
  }
  // Tirar ou pôr um item muda o "em uso" dele — e só dele (12.7: antes, todos os itens do mesmo desenho viravam "em uso").
  alinharItens(v, m, alvo);
  v.eu.estilo.tMudanca = v.t;
  const conhecida = (v.notoriedade?.valor ?? 0) >= 30;
  if (conhecida && marcante(antes, m) && rngDe(v.id, 'visual', v.t, v.seq).chance(0.6)) {
    v.fatos['visual_repercutiu'] = v.t;
    escrever(v, { texto: 'A mudança de visual virou assunto: fotos, comentários, gente copiando.', relevancia: 'cotidiano', tema: 'trabalho' });
    return 'O visual novo apareceu nas fotos — e virou assunto.';
  }
  return 'Visual novo. No espelho, a mesma pessoa — de outro jeito.';
}

/**
 * 12.7 — o visual mudou num campo que vem de um item (óculos, chapéu, a roupa do retrato): só os itens desse campo mudam de
 * "em uso", e no máximo um por lugar. O item escolhido (`alvo`) é o que entra; sem alvo, fica o que já estava em uso com
 * esse desenho, senão o primeiro seu com ele. Cortar o cabelo não mexe em roupa nenhuma.
 */
function alinharItens(v: Vida, m: MudancaVisual, alvo?: ItemDeEstilo): void {
  const itens = itensDaPessoa(v);
  const vis = v.eu.visual;
  for (const k of ['oculos', 'chapeu'] as const) {
    if (!(k in m)) continue;
    const valor = vis[k];
    const doCampo = itens.filter(x => !!itemEstilo(x.itemId)?.visual?.[k]);
    const comValor = (x: ItemDeEstilo) => itemEstilo(x.itemId)?.visual?.[k] === valor;
    const escolhido = valor === undefined ? undefined : (alvo && comValor(alvo) ? alvo : doCampo.find(x => x.usando && comValor(x)) ?? doCampo.find(comValor));
    for (const x of doCampo) x.usando = x === escolhido;
  }
  // A roupa do retrato: quando veio de uma peça (`alvo`), a peça já resolveu os lugares do corpo.
  if ('roupa' in m && !alvo) {
    const valor = vis.roupa;
    const doCampo = itens.filter(x => !!itemEstilo(x.itemId)?.visual?.roupa);
    if (valor === undefined) { for (const x of doCampo) if (x.usando && itemEstilo(x.itemId)?.visual?.roupa !== 'basica') x.usando = false; }
    else if (!doCampo.some(x => x.usando && itemEstilo(x.itemId)?.visual?.roupa === valor)) {
      const e = doCampo.find(x => itemEstilo(x.itemId)?.visual?.roupa === valor);
      if (e) { for (const y of itens) if (y !== e && y.usando && mesmoLugar(itemEstilo(e.itemId), itemEstilo(y.itemId))) y.usando = false; e.usando = true; }
    }
  }
}

/** 12.7 — a roupa que o retrato mostra com o que ficou em uso (a de cima ou a peça inteira; senão a de sempre). */
function roupaQueFica(v: Vida): string {
  const usando = itensDaPessoa(v).filter(x => x.usando);
  const de = (x: ItemDeEstilo) => itemEstilo(x.itemId)?.visual?.roupa;
  const cima = usando.find(x => !!de(x) && lugaresDoItem(itemEstilo(x.itemId)!).includes('tronco')) ?? usando.find(x => !!de(x));
  return (cima && de(cima)) ?? 'basica';
}

/**
 * 12.7 — qual dos seus itens é o escolhido: a peça pelo id dela (o que a tela mostrou); sem id (ações antigas), a peça
 * desse produto que está no estado contrário (a que se quer pôr ou tirar), senão a primeira.
 */
export function instanciaDoItem(v: Vida, itemId: string, usar: boolean, id?: string): ItemDeEstilo | undefined {
  const itens = itensDaPessoa(v);
  if (id) return itens.find(y => y.id === id && y.itemId === itemId);
  return itens.find(y => y.itemId === itemId && y.usando !== usar) ?? itens.find(y => y.itemId === itemId);
}

/**
 * 12.7 — nunca duas peças no mesmo lugar do corpo (saves de antes da correção podiam ter várias "em uso"): fica a que o
 * retrato já mostrava (a de cima, o modelo dos óculos e do chapéu); senão a mais recente.
 */
export function umPorLugar(v: Vida): void {
  const vis = v.eu.visual;
  const preferida = (x: ItemDeEstilo) => vis.superior === `${x.itemId}#${sementeDaPeca(x)}` || vis.superior === `${x.itemId}#${x.id}` || vis.modeloOculos === x.itemId || vis.modeloChapeu === x.itemId;
  const usando = itensDaPessoa(v).map((x, i) => ({ x, i })).filter(({ x }) => x.usando)
    .sort((a, b) => Number(preferida(b.x)) - Number(preferida(a.x)) || b.x.t - a.x.t || b.i - a.i);
  const ocupado = new Set<string>();
  for (const { x } of usando) {
    const it = itemEstilo(x.itemId);
    if (!it) continue;
    const ls = lugaresDoItem(it);
    if (ls.some(l => ocupado.has(l))) { x.usando = false; continue; }
    for (const l of ls) ocupado.add(l);
  }
}

/* ------------------------------------------------------------- Comprar */

export function disponibilidadeComprarItem(v: Vida, itemId: string, marca?: string, loja?: string): Veredito {
  const it = itemEstilo(itemId);
  if (!it) return bloqueio('impossivel', 'Esse item não existe.');
  const a = autonomia(v, 'compra_pessoal');
  if (a.grau !== 'permitido') return a;
  if (temItem(v, itemId)) return bloqueio('incompativel', 'Você já tem.');
  if (it.receita && !precisaDeOculos(v)) return bloqueio('requisito', 'Óculos de grau pedem receita: a sua vista não pediu (ainda).');
  // 12.9: o piercing — o estúdio não fura menor de 16 (e, até os 18, só com a autorização dos responsáveis).
  if (it.piercing && idade(v) < IDADE_MINIMA_PIERCING) return bloqueio('impossivel', 'O estúdio não fura quem tem menos de 16 anos.');
  if (v.justica?.prisao) return bloqueio('incompativel', 'Na prisão, não.');
  if ((marca || loja) && !ofertaValida(v, { tipo: 'item', id: itemId }, marca, loja)) return bloqueio('impossivel', 'Essa loja não vende isso.');
  return vereditoDePagar(v, loja ? precoNaLoja(v, { tipo: 'item', id: itemId }, marca, loja) : precoDoItem(v, itemId));
}

/** 12.9: a semente das cores de uma peça — a variante escolhida na loja ou, nos saves antigos, o id da peça. */
export const sementeDaPeca = (x: { id: string; variante?: string }) => x.variante ?? x.id;

export function comprarItem(v: Vida, itemId: string, pagoPelaFamilia = false, marca?: string, loja?: string, variante?: string): string {
  const it = itemEstilo(itemId)!;
  const preco = loja ? precoNaLoja(v, { tipo: 'item', id: itemId }, marca, loja) : precoDoItem(v, itemId);
  if (!pagoPelaFamilia) pagar(v, preco);
  v.eu.estilo ??= { itens: [] };
  // 12.9: leva a variante que se viu na vitrine e no provador (a mesma cor) — antes cada tela sorteava a sua.
  const vari = typeof variante === 'string' && variante.length > 0 && variante.length <= 60 ? variante : undefined;
  const item: ItemDeEstilo = { id: novoId(v, 'est'), itemId, t: v.t, preco, usando: true, ...(marca ? { marca } : {}), ...(loja ? { loja } : {}), ...(vari ? { variante: vari } : {}) };
  v.eu.estilo.itens.push(item);
  // Passa a usar (o que ocupa o mesmo lugar sai: a mesma categoria que aparece no retrato, o mesmo pulso, o mesmo pescoço).
  let saiuRoupa = false;
  for (const x of v.eu.estilo.itens) if (x !== item && x.usando && mesmoLugar(it, itemEstilo(x.itemId))) { x.usando = false; saiuRoupa ||= !!itemEstilo(x.itemId)?.visual?.roupa; }
  if (saiuRoupa && !it.visual?.roupa) { const r = roupaQueFica(v); if (r === 'basica') delete v.eu.visual.roupa; else v.eu.visual.roupa = r as Visual['roupa']; }
  if (it.visual) Object.assign(v.eu.visual, it.visual);
  sincronizarVisual(v);
  v.eu.estilo.tMudanca = v.t;
  const deMarca = marca ? ` (${nomeDaMarca(marca)})` : '';
  return it.luxo ? `Comprou ${it.nome.toLowerCase()}${deMarca} por ${fmt(preco)}. ${efeitoDoLuxo(v)}` : `Comprou ${it.nome.toLowerCase()}${deMarca}${pagoPelaFamilia ? '' : ` por ${fmt(preco)}`}.`;
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
  // REWORK 12.4: a peça ocupa partes do corpo (a camiseta, a de cima; o vestido, a de cima e a de baixo).
  const la = lugaresDoItem(a);
  return lugaresDoItem(b).some(x => la.includes(x));
}

export function usarItem(v: Vida, itemId: string, usar: boolean, id?: string): string {
  const it = itemEstilo(itemId)!;
  const x = instanciaDoItem(v, itemId, usar, id)!;
  let saiuRoupa = false;
  if (usar) for (const y of itensDaPessoa(v)) if (y !== x && y.usando && mesmoLugar(it, itemEstilo(y.itemId))) { y.usando = false; saiuRoupa ||= !!itemEstilo(y.itemId)?.visual?.roupa; }
  x.usando = usar;
  // REWORK 12.4: a calça nova tira o vestido — e o retrato volta à roupa de todo dia na parte de cima.
  const m: MudancaVisual = {};
  if (it.visual?.oculos) m.oculos = usar ? it.visual.oculos : undefined;
  if (it.visual?.chapeu) m.chapeu = usar ? it.visual.chapeu : undefined;
  if (it.visual?.roupa) m.roupa = usar ? it.visual.roupa : roupaQueFica(v) as MudancaVisual['roupa'];
  else if (saiuRoupa) m.roupa = roupaQueFica(v) as MudancaVisual['roupa'];
  if (Object.keys(m).length) mudarAparencia(v, m, x);
  if (it.visual?.joia) v.eu.visual.joia = usar ? it.visual.joia : undefined;
  x.usando = usar;
  sincronizarVisual(v);
  return usar ? `Passou a usar: ${it.nome.toLowerCase()}.` : `Guardou: ${it.nome.toLowerCase()}.`;
}

/**
 * 12.4.1 — o que o retrato mostra sai do que está em uso: a peça de cima visível (o casaco por cima; senão o vestido ou o
 * conjunto; senão a blusa), a joia do pescoço e os brincos (lugares diferentes: dá para usar os dois). A figura de corpo
 * inteiro lê as peças direto; o retrato (só o busto) lê estes campos.
 */
export function sincronizarVisual(v: Vida): void {
  const vis = v.eu.visual;
  umPorLugar(v);
  const usando = itensDaPessoa(v).filter(x => x.usando);
  const em = (l: string) => usando.find(x => { const it = itemEstilo(x.itemId); return !!it && lugaresDoItem(it).includes(l) && (l !== 'tronco' || it.lugar !== 'casaco'); });
  const casaco = usando.find(x => itemEstilo(x.itemId)?.lugar === 'casaco');
  const cima = casaco ?? em('tronco');
  if (cima) vis.superior = `${cima.itemId}#${sementeDaPeca(cima)}`; else delete vis.superior;
  const pescoco = usando.find(x => itemEstilo(x.itemId)?.lugar === 'joia');
  const joia = pescoco ? itemEstilo(pescoco.itemId)?.visual?.joia : undefined;
  if (joia) vis.joia = joia; else delete vis.joia;
  // 12.9: os piercings em uso (o retrato e a figura desenham cada um no seu furo).
  const furos = usando.filter(x => !!itemEstilo(x.itemId)?.piercing).map(x => x.itemId).sort();
  if (furos.length) vis.piercings = furos; else delete vis.piercings;
  const orelha = usando.find(x => itemEstilo(x.itemId)?.lugar === 'orelha');
  if (orelha) { vis.brincos = true; vis.modeloBrincos = orelha.itemId; } else { delete vis.brincos; delete vis.modeloBrincos; }
  // HOTFIX 11.5.1: o modelo dos óculos e do chapéu em uso (o Juliet não é o aviador; o chapéu de couro não é o de palha).
  const oculos = usando.find(x => itemEstilo(x.itemId)?.categoria === 'oculos' && itemEstilo(x.itemId)?.visual?.oculos === vis.oculos) ?? usando.find(x => itemEstilo(x.itemId)?.categoria === 'oculos');
  if (oculos && vis.oculos) vis.modeloOculos = oculos.itemId; else delete vis.modeloOculos;
  const chapeu = usando.find(x => itemEstilo(x.itemId)?.categoria === 'chapeu' && itemEstilo(x.itemId)?.visual?.chapeu === vis.chapeu) ?? usando.find(x => itemEstilo(x.itemId)?.categoria === 'chapeu');
  if (chapeu && vis.chapeu) vis.modeloChapeu = chapeu.itemId; else delete vis.modeloChapeu;
}

export function disponibilidadeUsarItem(v: Vida, itemId: string, usar: boolean, id?: string): Veredito {
  const x = instanciaDoItem(v, itemId, usar, id);
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
