/**
 * REWORK 12 — A COLEÇÃO: comprar, guardar, ver o valor andar, vender.
 *
 * O valor de uma peça é uma ESTIMATIVA: anda com o mercado da categoria (todas as telas sobem juntas num ano bom
 * de arte) e com a sorte dela; só a venda diz o número de verdade. Quem compra na loja paga a margem da loja (a
 * peça vale menos ao sair dela); quem vende rápido para um comerciante recebe pouco; quem vende em leilão paga a
 * comissão e depende de quem aparecer. Comprar e revender não dá lucro garantido — às vezes dá, às vezes não.
 *
 * O que a peça dá à vida: o gosto de ter (menos a cada peça igual; nada para quem compra por comprar), a história
 * que ela carrega e, para quem junta muitas de um tipo, a identidade de colecionador. Nunca competência.
 */

import type { Colecionavel, CategoriaColecao, Vida } from '../tipos';
import type { Rng } from '../rng';
import { clamp, rngDe } from '../rng';
import { escrever, idade, marcarFato, temFato } from '../nucleo';
import { anoDe } from '../tempo';
import { dinheiro as fmt } from '../texto';
import { municipio, paisDaCidade } from '../dados/lugares';
import { clubesDoPais, doClube } from '../dados/clubes';
import { LOJAS_DE_COLECAO, NOME_CATEGORIA_COLECAO, PECAS_DE_COLECAO, pecaDeColecao, type LojaDeColecao, type PecaDeColecao } from '../dados/colecionaveis';
import { fatorDeImportado } from './precos';
import { okDePagar, patrimonio, PATRIMONIO_NO_MES, rendaPropriaMensal } from './dinheiro';
import { palmaresDe } from './palmares';

export const colecao = (v: Vida): Colecionavel[] => v.financas.colecao ?? [];
export const valorDaColecao = (v: Vida) => colecao(v).reduce((s, c) => s + c.valor, 0);

/* ----------------------------------------------------------------- Ofertas */

export interface OfertaDeColecao {
  id: string;
  pecaId: string;
  nome: string;
  loja: LojaDeColecao;
  categoria: CategoriaColecao;
  raridade: PecaDeColecao['raridade'];
  preco: number;
  /** O que ela valeria no mercado de revenda logo depois da compra (a tela mostra; não é promessa). */
  valorEstimado: number;
  certificado: boolean;
  detalhe?: string;
  /** REWORK 12.2: o que se pode verificar antes de comprar. */
  fabricante?: string;
  periodo?: string;
  material?: string;
  estado: number;
  autenticidade: 'verificada' | 'presumida' | 'duvidosa';
  liquidez: 'alta' | 'media' | 'baixa';
  faixa: number;
  /** Venda privada (sob consulta) ou leilão especial da temporada. */
  canal?: 'privada' | 'especial';
  /** Quem já teve a peça (as únicas; e as privadas, que vêm com o histórico de donos). */
  donos?: string[];
  unica?: string;
}

/** A loja existe nesta cidade? As de cidade grande (galeria, leilão, memorabilia), nas metrópoles e capitais. */
export function lojaDeColecaoNaCidade(municipioId: string, loja: LojaDeColecao): boolean {
  if (!LOJAS_DE_COLECAO[loja].cidadeGrande) return true;
  const p = municipio(municipioId).perfil;
  return p === 'metropole' || p === 'capital';
}

/** O preço de uma peça neste país (o mercado de luxo é mundial: o imposto pesa metade do que pesa num carro). */
const fatorDoLugar = (municipioId: string) => fatorDeImportado(paisDaCidade(municipioId), 0.5);

function nomeDaPeca(p: PecaDeColecao, r: Rng, municipioId: string, ano: number): { nome: string; detalhe?: string } {
  if (!p.modelo) return { nome: p.nome };
  const clubes = clubesDoPais(paisDaCidade(municipioId));
  if (!clubes.length) return { nome: p.nome };
  const c = r.weighted(clubes, x => (x.porte === 'grande' ? 3 : x.porte === 'tradicional' ? 1.5 : 0.5))!;
  const quando = r.int(1962, Math.max(1963, ano - 2));
  const nome = p.modelo.replace('{doClube}', doClube(c.nome)).replace('{ano}', String(quando));
  return { nome, detalhe: `${c.nome}, ${quando}` };
}

/**
 * O que está à venda neste ano, nesta cidade, numa loja: as peças da loja (na cidade pequena, só as de série) e,
 * na casa de leilões, uns poucos lotes do ano (cada um com o seu martelo e a comissão da casa).
 */
export function ofertasDeColecao(v: Vida, loja: LojaDeColecao): OfertaDeColecao[] {
  const onde = v.moradia.municipioId;
  if (!lojaDeColecaoNaCidade(onde, loja)) return [];
  const ano = anoDe(v.t);
  const r = rngDe(v.economia?.semente ?? 1, 'colecao', loja, ano, onde);
  const grande = ['metropole', 'capital'].includes(municipio(onde).perfil);
  const k = fatorDoLugar(onde);
  const out: OfertaDeColecao[] = [];
  const pecas = PECAS_DE_COLECAO.filter(p => p.loja === loja && !p.canal && (grande || p.raridade === 'comum'));
  if (loja === 'leilao') {
    // Os lotes do ano: a peça principal e duas ou três de catálogo. O martelo varia; a comissão (20%) não.
    const lotes = [...pecas, ...PECAS_DE_COLECAO.filter(p => p.loja !== 'leilao' && !p.canal && (p.raridade === 'rara'))];
    const n = Math.min(lotes.length, r.int(3, 4));
    const escolhidos = new Set<string>();
    for (let q = 0; q < n * 3 && escolhidos.size < n; q++) escolhidos.add(r.pick(lotes).id);
    let i = 0;
    for (const id of escolhidos) {
      const p = pecaDeColecao(id)!;
      const martelo = Math.round(p.preco * k * (0.8 + r.next() * 0.5) / 100) * 100;
      const n2 = nomeDaPeca(p, r, onde, ano);
      out.push({ ...atributos(p, r), id: `col-leilao-${ano}-${i++}`, pecaId: p.id, nome: n2.nome, detalhe: n2.detalhe, loja, categoria: p.categoria, raridade: p.raridade === 'comum' ? 'incomum' : p.raridade, preco: Math.round(martelo * 1.2 / 100) * 100, valorEstimado: Math.round(martelo * 0.95 / 100) * 100, certificado: true, autenticidade: 'verificada' });
    }
    return [...out, ...ofertasEspeciais(v)];
  }
  let i = 0;
  for (const p of pecas) {
    // REWORK 12.2: a peça rara não fica na vitrine todo ano (uma por vez, quando aparece).
    const preco = Math.round(p.preco * k * (0.95 + r.next() * 0.1) / 100) * 100;
    const aparece = p.raridade !== 'rara' || r.chance(0.55);
    const n2 = nomeDaPeca(p, r, onde, ano);
    if (!aparece) { i++; continue; }
    out.push({ ...atributos(p, r), id: `col-${loja}-${ano}-${i++}`, pecaId: p.id, nome: n2.nome, detalhe: n2.detalhe, loja, categoria: p.categoria, raridade: p.raridade, preco, valorEstimado: Math.round(preco * p.retencao / 100) * 100, certificado: !p.semCertificado, autenticidade: p.semCertificado ? 'duvidosa' : loja === 'antiquario' ? 'presumida' : 'verificada' });
  }
  return [...out, ...ofertasPrivadas(v, loja)];
}

/** Os atributos verificáveis de uma peça do catálogo (o estado varia de exemplar para exemplar). */
function atributos(p: PecaDeColecao, r: Rng): Pick<OfertaDeColecao, 'fabricante' | 'periodo' | 'material' | 'estado' | 'liquidez' | 'faixa'> {
  const usado = p.loja === 'antiquario' || p.loja === 'leilao' || p.categoria === 'antiguidade' || (p.periodo && /século|anos 19|19[0-9]{2}|18[0-9]{2}|c\. /.test(p.periodo));
  return { fabricante: p.fabricante, periodo: p.periodo, material: p.material, estado: usado ? r.int(68, 94) : 100, liquidez: p.liquidez ?? (p.raridade === 'comum' ? 'media' : 'baixa'), faixa: p.faixa ?? (p.preco < 10000 ? 1 : p.preco < 100000 ? 2 : p.preco < 1_000_000 ? 3 : 4) };
}

const ANTIGOS_DONOS = ['uma família de banqueiros de Genebra', 'um colecionador de Hong Kong', 'o espólio de um industrial', 'uma fundação que fechou', 'um piloto de corrida aposentado', 'uma atriz de cinema dos anos 1960', 'um armador grego', 'uma família de cafeicultores'];

/**
 * Venda privada (sob consulta): a peça que não fica na vitrine — a loja liga para quem pode comprar. Só aparece para
 * quem tem o patrimônio que a casa pede; vem com o histórico de donos. Sem margem de vitrine, com o prêmio de quem vende.
 */
export function ofertasPrivadas(v: Vida, loja: LojaDeColecao): OfertaDeColecao[] {
  const onde = v.moradia.municipioId;
  if (!lojaDeColecaoNaCidade(onde, loja) || !['metropole', 'capital'].includes(municipio(onde).perfil)) return [];
  const pat = patrimonio(v);
  const ano = anoDe(v.t);
  const k = fatorDoLugar(onde);
  const r = rngDe(v.economia?.semente ?? 1, 'colecao-privada', loja, ano, onde);
  const out: OfertaDeColecao[] = [];
  let i = 0;
  for (const p of PECAS_DE_COLECAO.filter(x => x.loja === loja && x.canal === 'privada')) {
    const aparece = r.chance(0.6);
    const preco = Math.round(p.preco * k * (1 + r.next() * 0.12) / 1000) * 1000;
    const donos = [r.pick(ANTIGOS_DONOS)];
    if (!aparece || pat < (p.patrimonioMin ?? 0)) { i++; continue; }
    out.push({ ...atributos(p, r), id: `col-${loja}-${ano}-p${i++}`, pecaId: p.id, nome: p.nome, loja, categoria: p.categoria, raridade: p.raridade, preco, valorEstimado: Math.round(p.preco * k * Math.min(0.95, p.retencao + 0.08) / 1000) * 1000, certificado: true, autenticidade: 'verificada', canal: 'privada', donos });
  }
  return out;
}

/** A chave da peça única no registro da continuidade. */
const chaveUnica = (p: PecaDeColecao) => `unica:${p.id}`;

/** A peça única está livre para aparecer? (Ninguém a tem — e, se foi vendida, já se passaram anos.) */
export function unicaLivre(v: Vida, p: PecaDeColecao): boolean {
  const reg = v.pecasUnicas?.[chaveUnica(p)];
  if (!reg) return true;
  return reg.com === 'mercado' && v.t - reg.t >= 96;
}

/**
 * O leilão especial da temporada (a noite das peças que não voltam tão cedo): as históricas e únicas, uma ou duas por
 * ano, para quem tem patrimônio que as casas reconhecem. A peça que já foi sua e foi vendida pode voltar — anos
 * depois, com o seu nome na lista de donos.
 */
export function ofertasEspeciais(v: Vida): OfertaDeColecao[] {
  const onde = v.moradia.municipioId;
  if (!lojaDeColecaoNaCidade(onde, 'leilao')) return [];
  const pat = patrimonio(v);
  const ano = anoDe(v.t);
  const k = fatorDoLugar(onde);
  const r = rngDe(v.economia?.semente ?? 1, 'leilao-especial', ano);
  const pool = PECAS_DE_COLECAO.filter(p => p.canal === 'especial' && unicaLivre(v, p));
  const out: OfertaDeColecao[] = [];
  const n = Math.min(pool.length, r.chance(0.5) ? 2 : 1);
  const escolhidas = [...pool].sort(() => r.next() - 0.5).slice(0, n);
  escolhidas.forEach((p, i) => {
    if (pat < (p.patrimonioMin ?? 0)) return;
    const martelo = Math.round(p.preco * k * (0.85 + r.next() * 0.4) / 10000) * 10000;
    const reg = v.pecasUnicas?.[chaveUnica(p)];
    const donos = reg?.donos?.length ? reg.donos : [r.pick(ANTIGOS_DONOS)];
    out.push({ ...atributos(p, r), id: `col-leilao-${ano}-e${i}`, pecaId: p.id, nome: p.nome, loja: 'leilao', categoria: p.categoria, raridade: 'unica', preco: Math.round(martelo * 1.12 / 10000) * 10000, valorEstimado: Math.round(martelo * 0.92 / 10000) * 10000, certificado: true, autenticidade: 'verificada', canal: 'especial', donos, unica: chaveUnica(p) });
  });
  return out;
}

export function ofertaDeColecao(v: Vida, id: string): OfertaDeColecao | undefined {
  const loja = id.split('-')[1] as LojaDeColecao;
  if (!(loja in LOJAS_DE_COLECAO)) return undefined;
  return ofertasDeColecao(v, loja).find(o => o.id === id);
}

/* ------------------------------------------------------------------ Compra */

export function disponibilidadeComprarColecao(v: Vida, id: string): { ok: boolean; motivo?: string; resgate?: { valor: number; naBaixa: string[] } } {
  if (idade(v) < 18) return { ok: false, motivo: 'A partir dos 18.' };
  const o = ofertaDeColecao(v, id);
  if (!o) return { ok: false, motivo: 'Essa peça já foi vendida.' };
  if (v.anoAtual.acoes.includes(`colecao:${id}`)) return { ok: false, motivo: 'Já é sua.' };
  const p = pecaDeColecao(o.pecaId);
  if (o.unica && !unicaLivre(v, p!)) return { ok: false, motivo: 'Essa peça já tem dono.' };
  if (p?.patrimonioMin && patrimonio(v) < p.patrimonioMin) return { ok: false, motivo: `Lista de espera: a boutique só oferece a quem já é cliente (patrimônio acima de ${fmt(p.patrimonioMin)}).` };
  return okDePagar(v, o.preco, o.loja === 'leilao' ? 'O lance, com a comissão da casa, fica em' : 'Custa');
}

/**
 * O gosto de ter: proporcional ao que a compra representa para a renda (o relógio de um mês de salário mexe;
 * o de um dia, não) e menor a cada peça da mesma categoria.
 */
function gostoDaCompra(v: Vida, preco: number, cat: CategoriaColecao): number {
  const renda = Math.max(1500, rendaPropriaMensal(v));
  const iguais = colecao(v).filter(c => c.categoria === cat).length;
  return Math.round(clamp(3 * Math.log10(1 + preco / renda), 0, 5) / (1 + iguais * 0.35));
}

export function comprarColecao(v: Vida, id: string): string {
  const o = ofertaDeColecao(v, id)!;
  const p = pecaDeColecao(o.pecaId)!;
  v.financas.conta -= o.preco;
  v.anoAtual.acoes.push(`colecao:${id}`);
  const peca: Colecionavel = {
    id: `cl${v.seq++}`, pecaId: p.id, nome: o.nome, categoria: p.categoria, raridade: o.raridade, procedencia: o.canal === 'privada' ? 'privada' : o.loja === 'leilao' ? 'leilao' : o.loja === 'galeria' ? 'galeria' : o.loja === 'antiquario' ? 'antiquario' : p.semCertificado ? 'sem_procedencia' : 'loja',
    certificado: o.certificado, estado: o.estado, valor: o.valorEstimado, precoPago: o.preco, tCompra: v.t, detalhe: o.detalhe, autenticidade: o.autenticidade,
    ...(o.unica ? { unica: o.unica } : {}),
    historia: [
      ...(o.donos?.length ? [{ t: v.t, texto: `Antes: ${o.donos.join(', depois ')}.` }] : []),
      { t: v.t, texto: `${o.loja === 'leilao' ? (o.canal === 'especial' ? 'Arrematado no leilão especial da temporada' : 'Arrematado em leilão') : o.canal === 'privada' ? 'Comprado em venda privada' : `Comprad${p.artigo.startsWith('a') ? 'a' : 'o'} ${o.loja === 'galeria' ? 'na galeria' : o.loja === 'antiquario' ? 'no antiquário' : 'na loja'}`} por ${fmt(o.preco)}${o.certificado ? ', com certificado' : ', sem papel nenhum'}.` }
    ]
  };
  (v.financas.colecao ??= []).push(peca);
  if (o.unica) (v.pecasUnicas ??= {})[o.unica] = { com: 'voce', t: v.t, donos: [...(o.donos ?? []), nomeDoDono(v)] };
  const gosto = gostoDaCompra(v, o.preco, p.categoria);
  v.mente.felicidade = clamp(v.mente.felicidade + gosto);
  const mesmas = colecao(v).filter(c => c.categoria === p.categoria).length;
  if (mesmas >= 5 && !temFato(v, `colecionador_${p.categoria}`)) {
    marcarFato(v, `colecionador_${p.categoria}`);
    escrever(v, { texto: `Já são ${mesmas} peças: ${NOME_CATEGORIA_COLECAO[p.categoria].varios.toLowerCase()} viraram coleção — e colecionador${v.eu.genero === 'feminino' ? 'a' : ''} é quem você é nesse assunto.`, relevancia: 'biografia', tema: 'dinheiro', escolha: true });
  } else if (o.preco >= Math.max(50000, rendaPropriaMensal(v) * 6)) {
    escrever(v, { texto: `${o.loja === 'leilao' ? 'Arrematou' : 'Comprou'} ${p.artigo === 'a' || p.artigo === 'as' ? 'uma' : 'um'} ${o.nome} por ${fmt(o.preco)}.`, relevancia: 'biografia', tema: 'dinheiro', escolha: true });
  }
  const perda = o.preco - o.valorEstimado;
  return `${o.nome.charAt(0).toUpperCase() + o.nome.slice(1)} é seu.${perda > o.preco * 0.2 ? ` No mercado de revenda, hoje, valeria uns ${fmt(o.valorEstimado)}: a margem da ${o.loja === 'leilao' ? 'casa' : 'loja'} fica com ela.` : ''}`;
}

/* ------------------------------------------------------------------- Venda */

export type ModoDeVenda = 'rapido' | 'leilao';

/** O que se recebe vendendo (a estimativa; no leilão, o martelo decide). */
export function estimativaDeVenda(c: Colecionavel, modo: ModoDeVenda): number {
  // REWORK 12.2: o estado pesa (a peça gasta vale menos), a liquidez decide o desconto de quem tem pressa, e o laudo
  // de avaliação recente dá ao comprador a confiança que tira um pouco do desconto.
  const p = pecaDeColecao(c.pecaId);
  const liquidez = p?.liquidez ?? (c.raridade === 'comum' ? 'media' : 'baixa');
  const estado = 0.6 + Math.min(100, c.estado) * 0.004;
  const base = c.valor * (c.certificado ? 1 : 0.85) * estado;
  // Sem papel e de origem incerta, o comerciante paga o que pagaria por uma incógnita.
  const pressa = c.autenticidade === 'duvidosa' && !c.certificado ? 0.35 : { alta: 0.8, media: 0.7, baixa: 0.55 }[liquidez];
  const laudo = c.avaliada !== undefined ? 1.04 : 1;
  return Math.round(base * (modo === 'rapido' ? pressa : 0.85 * laudo) / 100) * 100;
}

/** O nome de quem tem a peça (para a lista de donos). */
const nomeDoDono = (v: Vida) => `${v.eu.nome} ${v.eu.sobrenome.split(' ').slice(-1)[0] ?? ''}`.trim();

/** A peça única saiu das suas mãos (venda, apreensão, inventário): o registro anota — ela pode voltar ao mercado. */
export function soltarUnica(v: Vida, c: Colecionavel, com: 'mercado' | 'museu' = 'mercado'): void {
  if (!c.unica) return;
  const reg = (v.pecasUnicas ??= {})[c.unica] ?? { com, t: v.t, donos: [] };
  reg.com = com;
  reg.t = v.t;
  if (!reg.donos.includes(nomeDoDono(v))) reg.donos.push(nomeDoDono(v));
  v.pecasUnicas[c.unica] = reg;
}

export function disponibilidadeVenderColecao(v: Vida, id: string, modo: ModoDeVenda): { ok: boolean; motivo?: string } {
  const c = colecao(v).find(x => x.id === id);
  if (!c) return { ok: false, motivo: 'Peça não encontrada.' };
  if (c.emprestadaA) return { ok: false, motivo: 'Está em exposição no museu: primeiro, recolher.' };
  if (c.emprestadaFora) return { ok: false, motivo: `Está emprestada a ${c.emprestadaFora.instituicao} até ${anoDe(c.emprestadaFora.ate)}.` };
  if (modo === 'leilao' && c.valor < 3000) return { ok: false, motivo: 'Nenhuma casa de leilão pega peça desse valor.' };
  if (modo === 'leilao' && c.autenticidade === 'duvidosa' && !c.certificado) return { ok: false, motivo: 'Leilão sério não aceita peça sem papel e de origem incerta: autentique antes.' };
  return { ok: true };
}

export function venderColecao(v: Vida, r: Rng, id: string, modo: ModoDeVenda): string {
  const c = colecao(v).find(x => x.id === id)!;
  // REWORK 12.2: o comerciante que conhece o ofício percebe a cópia (às vezes) — e paga como cópia.
  if (modo === 'rapido' && c.falsa && rngDe(v.id, 'percebe', c.id, v.t).chance(0.5)) {
    const replica = Math.max(100, Math.round(c.precoPago * 0.03 / 100) * 100);
    v.financas.conta += replica;
    v.financas.colecao = colecao(v).filter(x => x.id !== id);
    return `O comerciante olhou com a lupa e sorriu: é cópia. Pagou ${fmt(replica)} — o preço de uma.`;
  }
  const recebido = modo === 'rapido' ? estimativaDeVenda(c, 'rapido') : Math.round(Math.max(0.4, 1 + r.normal() * 0.18) * estimativaDeVenda(c, 'leilao') / 100) * 100;
  v.financas.conta += recebido;
  v.financas.colecao = colecao(v).filter(x => x.id !== id);
  soltarUnica(v, c);
  const ganho = recebido - c.precoPago;
  if (c.afeto) {
    v.mente.felicidade = clamp(v.mente.felicidade - 4);
    escrever(v, { texto: `Vendeu ${c.nome} — ${c.afeto}. ${fmt(recebido)}, e um vazio que o dinheiro não preenche.`, relevancia: 'biografia', tema: 'dinheiro', tom: 'ruim', escolha: true });
  } else if (Math.abs(ganho) > Math.max(20000, c.precoPago * 0.3)) {
    escrever(v, { texto: `Vendeu ${c.nome} ${modo === 'leilao' ? 'em leilão' : ''} por ${fmt(recebido)} — ${ganho > 0 ? `${fmt(ganho)} acima` : `${fmt(-ganho)} abaixo`} do que tinha pagado.`.replace('  ', ' '), relevancia: 'biografia', tema: 'dinheiro', tom: ganho > 0 ? 'bom' : 'ruim', escolha: true });
  }
  return modo === 'leilao' ? `Martelo batido: ${fmt(recebido)} já descontada a comissão.` : `Vendido para um comerciante: ${fmt(recebido)}, na hora.`;
}

/* ------------------------------------------------------------------- O ano */

const OSCILA_DA_CATEGORIA: Record<CategoriaColecao, number> = { arte: 0.07, relogio: 0.06, joia: 0.05, antiguidade: 0.04, memorabilia: 0.08 };

/** O ano do mercado de uma categoria (o mesmo para todas as peças dela, nesta vida): a média é zero. */
const choqueDaCategoria = (v: Vida, cat: CategoriaColecao) => rngDe(v.economia?.semente ?? 1, 'mercado-colecao', cat, anoDe(v.t)).normal() * OSCILA_DA_CATEGORIA[cat];

export function processarColecao(v: Vida, r: Rng): void {
  const lista = colecao(v);
  // REWORK 12.2: o registro das únicas acompanha a coleção (a peça que saiu por inventário ou apreensão volta ao mercado).
  for (const [chave, reg] of Object.entries(v.pecasUnicas ?? {})) if (reg.com === 'voce' && !lista.some(c => c.unica === chave)) { reg.com = 'mercado'; reg.t = v.t; }
  for (const c of lista) {
    if (c.emprestadaFora && v.t >= c.emprestadaFora.ate) { (c.historia ??= []).push({ t: v.t, texto: `Voltou do empréstimo a ${c.emprestadaFora.instituicao}.` }); delete c.emprestadaFora; }
    const p = pecaDeColecao(c.pecaId);
    const tendencia = p?.tendencia ?? 0;
    const oscila = p?.oscila ?? 0.06;
    let muda = tendencia + choqueDaCategoria(v, c.categoria) * 0.8 + r.normal() * oscila * 0.6;
    // A tela do artista novo: um dia ele acontece, ou some (uma vez só, depois de uns anos).
    if (c.pecaId === 'arte_tela_jovem' && v.t - c.tCompra >= 48 && !(c.historia ?? []).some(h => /aconteceu|sumiu/.test(h.texto))) {
      const x = r.next();
      if (x < 0.06) { muda += 4; (c.historia ??= []).push({ t: v.t, texto: 'O artista aconteceu: retrospectiva, museu, fila de colecionadores.' }); escrever(v, { texto: `O artista da tela que você comprou ${anoDe(c.tCompra)} virou nome de museu. A tela agora vale ${fmt(Math.round(c.valor * (1 + muda)))}.`, relevancia: 'biografia', tema: 'dinheiro', tom: 'bom' }); }
      else if (x < 0.2) { muda -= 0.6; (c.historia ??= []).push({ t: v.t, texto: 'O artista sumiu do mercado.' }); }
    }
    c.valor = Math.max(Math.round(c.precoPago * 0.02), Math.round(c.valor * Math.max(0.3, 1 + muda) / 10) * 10);
    // O tempo pesa na peça: arte e antiguidade pedem conservação; a camisa e o papel amarelam.
    c.estado = clamp(c.estado - (c.categoria === 'memorabilia' ? 0.6 : c.categoria === 'arte' || c.categoria === 'antiguidade' ? 0.4 : 0.2));
  }
  guardarCamisasDaCarreira(v);
}

/**
 * A memorabilia da própria carreira: o atleta que foi peça central de um título guarda a camisa daquela final —
 * com a procedência que nenhuma loja tem (é dele). Uma por título, só os de protagonista.
 */
function guardarCamisasDaCarreira(v: Vida): void {
  for (const x of palmaresDe(v)) {
    if (x.tipo !== 'titulo' || x.papel !== 'protagonista' || v.t - x.t > 24) continue;
    const pid = `propria:${x.trofeuId ?? `${x.competicao}-${x.ano}`}`;
    if (colecao(v).some(c => c.pecaId === pid)) continue;
    // Vale pelo nome de quem vestiu (0..100): a camisa de um titular desconhecido, uns milhares; a de um ídolo, muito mais.
    const nome = v.notoriedade?.valor ?? 0;
    const valor = Math.round((2500 + nome * nome * 12) / 100) * 100;
    (v.financas.colecao ??= []).push({
      id: `cl${v.seq++}`, pecaId: pid, nome: `a camisa do título (${x.competicao}, ${x.ano})`, categoria: 'memorabilia', raridade: 'unica', procedencia: 'propria', certificado: true, estado: 90,
      valor, precoPago: 0, tCompra: v.t, detalhe: x.clube, afeto: 'a camisa da sua própria conquista', historia: [{ t: v.t, texto: `Guardada depois do título${x.clube ? ` pel${doClube(x.clube).startsWith('da') ? 'a' : 'o'} ${x.clube}` : ''}.` }]
    });
  }
}

/** O seguro e a guarda de uma coleção que já vale alguma coisa (0,4% ao ano do valor; abaixo de R$ 80 mil, nada). */
export function custoDaColecao(v: Vida): number {
  const total = valorDaColecao(v);
  return total >= 80000 ? total * 0.004 / 12 : 0;
}
PATRIMONIO_NO_MES.push(v => { const x = custoDaColecao(v); return x > 0 ? [{ rotulo: 'Seguro e guarda da coleção', valor: x }] : []; });

/** Palavras para a tela: de onde a peça veio. */
export const PROCEDENCIA_EM_PALAVRAS: Record<Colecionavel['procedencia'], string> = {
  loja: 'comprada na loja, com nota', galeria: 'da galeria, com certificado', leilao: 'arrematada em leilão, com lote documentado', antiquario: 'do antiquário, com laudo',
  herdada: 'herdada', propria: 'da sua própria história', presente: 'um presente', sem_procedencia: 'sem procedência',
  privada: 'venda privada entre colecionadores, com histórico de donos', paralelo: 'comprada por fora, de origem incerta'
};

/* ------------------------------------------- REWORK 12.2 · o mercado de colecionadores */

export type ServicoDeColecao = 'avaliar' | 'autenticar' | 'restaurar' | 'emprestar';

/** O que cada serviço custa (o perito cobra pelo valor; o restauro, pelo trabalho e pelo risco). */
export function custoDoServico(c: Colecionavel, s: ServicoDeColecao): number {
  const x = s === 'avaliar' ? Math.max(800, c.valor * 0.005) : s === 'autenticar' ? Math.max(2000, c.valor * 0.015) : s === 'restaurar' ? Math.max(1500, c.valor * 0.05) : Math.max(0, c.valor * 0.002);
  return Math.round(x / 100) * 100;
}

export const ROTULO_SERVICO: Record<ServicoDeColecao, string> = { avaliar: 'Pedir uma avaliação', autenticar: 'Autenticar com um especialista', restaurar: 'Restaurar', emprestar: 'Emprestar a um museu por um ano' };

export function disponibilidadeServicoColecao(v: Vida, id: string, s: ServicoDeColecao): { ok: boolean; motivo?: string; resgate?: { valor: number; naBaixa: string[] } } {
  if (idade(v) < 18) return { ok: false, motivo: 'A partir dos 18.' };
  const c = colecao(v).find(x => x.id === id);
  if (!c) return { ok: false, motivo: 'Peça não encontrada.' };
  if (c.emprestadaA || c.emprestadaFora) return { ok: false, motivo: 'Está emprestada: primeiro, recolher.' };
  if (v.anoAtual.acoes.includes(`colecao_servico:${id}:${s}`)) return { ok: false, motivo: 'Já feito este ano.' };
  if (s === 'avaliar' && c.avaliada !== undefined && v.t - c.avaliada < 36) return { ok: false, motivo: 'Avaliada há pouco: o laudo vale por três anos.' };
  if (s === 'autenticar' && c.autenticidade === 'verificada' && c.certificado) return { ok: false, motivo: 'Já tem a autenticidade verificada.' };
  if (s === 'restaurar' && c.estado >= 92) return { ok: false, motivo: 'Está em ótimo estado: restaurar só tiraria o original.' };
  if (s === 'restaurar' && c.categoria === 'memorabilia') return { ok: false, motivo: 'Camisa de jogo não se restaura: a marca do jogo é a peça.' };
  if (s === 'emprestar') {
    if (c.valor < 150000) return { ok: false, motivo: 'Museu pede empréstimo de peça que o público venha ver.' };
    if (c.autenticidade !== 'verificada' || !c.certificado) return { ok: false, motivo: 'Nenhum museu sério pega peça sem autenticidade verificada.' };
  }
  return okDePagar(v, custoDoServico(c, s), 'Custa');
}

/**
 * Os serviços do colecionador. Avaliar dá um laudo (a venda em leilão rende um pouco mais por três anos; e o perito
 * às vezes desconfia). Autenticar diz a verdade — a peça boa ganha certificado; a falsa vira réplica; a roubada é
 * comunicada e apreendida. Restaurar devolve o estado, mas o relógio polido e o móvel "renovado" demais perdem o
 * original. Emprestar a um museu dá prestígio e põe a peça longe por um ano.
 */
export function servicoColecao(v: Vida, id: string, s: ServicoDeColecao): string {
  const c = colecao(v).find(x => x.id === id)!;
  const custo = custoDoServico(c, s);
  v.financas.conta -= custo;
  v.anoAtual.acoes.push(`colecao_servico:${id}:${s}`);
  const r = rngDe(v.id, c.id, s, v.t);
  const hist = (texto: string) => (c.historia ??= []).push({ t: v.t, texto });
  const nome = c.nome.charAt(0).toUpperCase() + c.nome.slice(1);
  switch (s) {
    case 'avaliar': {
      c.avaliada = v.t;
      if ((c.falsa || c.roubada) && r.chance(0.5)) { c.autenticidade = 'duvidosa'; hist('O avaliador desconfiou da peça.'); return `O avaliador olhou demais e falou de menos: "convém autenticar antes de vender". O laudo saiu com ressalva.`; }
      hist(`Avaliada em ${fmt(c.valor)}.`);
      return `Laudo de avaliação: ${fmt(c.valor)} no mercado de hoje. Com ele, quem compra confia mais (por três anos).`;
    }
    case 'autenticar': {
      if (c.roubada) {
        v.financas.colecao = colecao(v).filter(x => x.id !== c.id);
        soltarUnica(v, c);
        escrever(v, { texto: `O especialista reconheceu ${c.nome} numa lista de peças roubadas e comunicou às autoridades. A peça foi apreendida e devolvida a quem era — o que se pagou por ela, ficou perdido.`, relevancia: 'biografia', tema: 'dinheiro', tom: 'ruim' });
        return `${nome} constava como roubada: foi apreendida. O dinheiro pago não volta.`;
      }
      if (c.falsa) {
        c.autenticidade = 'duvidosa';
        c.certificado = false;
        c.valor = Math.max(100, Math.round(c.precoPago * 0.03 / 100) * 100);
        c.nome = `${c.nome} (falsificação)`;
        hist('O especialista provou que é falsa.');
        escrever(v, { texto: `O laudo veio: ${c.nome.replace(' (falsificação)', '')} é falsificação. O que custou ${fmt(c.precoPago)} vale o que vale uma cópia bem feita.`, relevancia: 'biografia', tema: 'dinheiro', tom: 'ruim' });
        return `${nome} é falsa. Vale o que vale uma cópia.`;
      }
      const ganha = !c.certificado;
      c.autenticidade = 'verificada';
      c.certificado = true;
      if (ganha) c.valor = Math.round(c.valor * 1.15 / 100) * 100;
      hist('Autenticidade verificada por especialista.');
      return ganha ? `${nome} é autêntica — e agora tem papel que prova. Vale mais por isso.` : `${nome} é autêntica: o laudo confirma.`;
    }
    case 'restaurar': {
      const antes = c.estado;
      c.estado = Math.min(96, c.estado + 30);
      // O excesso de restauro: o relógio de caixa polida, a antiguidade "renovada" demais — o colecionador sabe.
      const original = (c.categoria === 'relogio' || c.categoria === 'antiguidade') && r.chance(0.2);
      if (original) { c.valor = Math.round(c.valor * 0.85 / 100) * 100; hist('Restaurada — e o restaurador tirou um pouco do original.'); return `Restauro feito (${antes} → ${c.estado}), mas o restaurador exagerou: perdeu-se parte do original, e o mercado repara.`; }
      if (antes < 70 && c.categoria === 'arte') c.valor = Math.round(c.valor * 1.08 / 100) * 100;
      hist('Restaurada.');
      return `Restauro feito: o estado foi de ${antes} para ${c.estado}.`;
    }
    case 'emprestar': {
      const quem = r.pick(['um museu nacional', 'uma bienal internacional', 'um museu de Lisboa', 'uma fundação de arte de Nova York', 'um museu de história']);
      c.emprestadaFora = { instituicao: quem, ate: v.t + 12 };
      hist(`Emprestada a ${quem}.`);
      v.mente.felicidade = clamp(v.mente.felicidade + 2);
      return `${nome} vai para ${quem} por um ano, com seguro de parede a parede e o seu nome na legenda.`;
    }
  }
}

export interface PropostaDeColecionador { id: string; pecaId: string; nome: string; quem: string; valor: number }

/**
 * As propostas que chegam (de colecionadores, de museus, de marchands): pelas peças que já valem alguma coisa. O preço
 * gira em torno do valor de mercado (às vezes acima, às vezes abaixo) — e só vale neste ano.
 */
export function propostasDeColecionadores(v: Vida): PropostaDeColecionador[] {
  if (idade(v) < 18) return [];
  const ano = anoDe(v.t);
  const out: PropostaDeColecionador[] = [];
  for (const c of colecao(v)) {
    if (c.valor < 50000 || c.emprestadaA || c.emprestadaFora || c.afeto || c.roubada) continue;
    const r = rngDe(v.id, 'proposta', c.id, ano);
    if (!r.chance(c.raridade === 'unica' ? 0.45 : c.raridade === 'rara' ? 0.3 : 0.15)) continue;
    const valor = Math.round(c.valor * (0.82 + r.next() * 0.36) * (c.certificado ? 1 : 0.8) * (0.6 + c.estado * 0.004) / 100) * 100;
    out.push({ id: `prop-${ano}-${c.id}`, pecaId: c.id, nome: c.nome, quem: r.pick(['um colecionador de São Paulo', 'um marchand europeu', 'um museu do exterior', 'um investidor do Oriente Médio', 'uma galeria de Nova York', 'um colecionador anônimo, por um advogado']), valor });
    if (out.length >= 2) break;
  }
  return out;
}

export function disponibilidadeProposta(v: Vida, id: string): { ok: boolean; motivo?: string } {
  const p = propostasDeColecionadores(v).find(x => x.id === id);
  if (!p) return { ok: false, motivo: 'A proposta não está mais de pé.' };
  if (v.anoAtual.acoes.includes(`colecao_proposta:${id}`)) return { ok: false, motivo: 'Já respondida.' };
  return { ok: true };
}

export function responderProposta(v: Vida, id: string, aceitar: boolean): string {
  const p = propostasDeColecionadores(v).find(x => x.id === id)!;
  v.anoAtual.acoes.push(`colecao_proposta:${id}`);
  if (!aceitar) return `Recusada. ${p.quem.charAt(0).toUpperCase() + p.quem.slice(1)} agradeceu — e deixou o contato.`;
  const c = colecao(v).find(x => x.id === p.pecaId)!;
  v.financas.conta += p.valor;
  v.financas.colecao = colecao(v).filter(x => x.id !== c.id);
  soltarUnica(v, c);
  const ganho = p.valor - c.precoPago;
  escrever(v, { texto: `Vendeu ${c.nome} a ${p.quem} por ${fmt(p.valor)} — ${ganho >= 0 ? `${fmt(ganho)} acima` : `${fmt(-ganho)} abaixo`} do que tinha pagado.`, relevancia: 'biografia', tema: 'dinheiro', tom: ganho >= 0 ? 'bom' : 'ruim', escolha: true });
  return `Vendida a ${p.quem}: ${fmt(p.valor)}, sem comissão de casa.`;
}
