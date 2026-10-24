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
  const pecas = PECAS_DE_COLECAO.filter(p => p.loja === loja && (grande || p.raridade === 'comum'));
  if (loja === 'leilao') {
    // Os lotes do ano: a peça principal e duas ou três de catálogo. O martelo varia; a comissão (20%) não.
    const lotes = [...pecas, ...PECAS_DE_COLECAO.filter(p => p.loja !== 'leilao' && (p.raridade === 'rara'))];
    const n = Math.min(lotes.length, r.int(3, 4));
    const escolhidos = new Set<string>();
    for (let q = 0; q < n * 3 && escolhidos.size < n; q++) escolhidos.add(r.pick(lotes).id);
    let i = 0;
    for (const id of escolhidos) {
      const p = pecaDeColecao(id)!;
      const martelo = Math.round(p.preco * k * (0.8 + r.next() * 0.5) / 100) * 100;
      const n2 = nomeDaPeca(p, r, onde, ano);
      out.push({ id: `col-leilao-${ano}-${i++}`, pecaId: p.id, nome: n2.nome, detalhe: n2.detalhe, loja, categoria: p.categoria, raridade: p.raridade === 'comum' ? 'incomum' : p.raridade, preco: Math.round(martelo * 1.2 / 100) * 100, valorEstimado: Math.round(martelo * 0.95 / 100) * 100, certificado: true });
    }
    return out;
  }
  let i = 0;
  for (const p of pecas) {
    const preco = Math.round(p.preco * k * (0.95 + r.next() * 0.1) / 100) * 100;
    const n2 = nomeDaPeca(p, r, onde, ano);
    out.push({ id: `col-${loja}-${ano}-${i++}`, pecaId: p.id, nome: n2.nome, detalhe: n2.detalhe, loja, categoria: p.categoria, raridade: p.raridade, preco, valorEstimado: Math.round(preco * p.retencao / 100) * 100, certificado: !p.semCertificado });
  }
  return out;
}

export function ofertaDeColecao(v: Vida, id: string): OfertaDeColecao | undefined {
  const loja = id.split('-')[1] as LojaDeColecao;
  return ofertasDeColecao(v, loja).find(o => o.id === id);
}

/* ------------------------------------------------------------------ Compra */

export function disponibilidadeComprarColecao(v: Vida, id: string): { ok: boolean; motivo?: string; resgate?: { valor: number; naBaixa: string[] } } {
  if (idade(v) < 18) return { ok: false, motivo: 'A partir dos 18.' };
  const o = ofertaDeColecao(v, id);
  if (!o) return { ok: false, motivo: 'Essa peça já foi vendida.' };
  if (v.anoAtual.acoes.includes(`colecao:${id}`)) return { ok: false, motivo: 'Já é sua.' };
  const p = pecaDeColecao(o.pecaId);
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
    id: `cl${v.seq++}`, pecaId: p.id, nome: o.nome, categoria: p.categoria, raridade: o.raridade, procedencia: o.loja === 'leilao' ? 'leilao' : o.loja === 'galeria' ? 'galeria' : o.loja === 'antiquario' ? 'antiquario' : p.semCertificado ? 'sem_procedencia' : 'loja',
    certificado: o.certificado, estado: o.loja === 'antiquario' || o.loja === 'leilao' ? 82 : 100, valor: o.valorEstimado, precoPago: o.preco, tCompra: v.t, detalhe: o.detalhe,
    historia: [{ t: v.t, texto: `${o.loja === 'leilao' ? 'Arrematado em leilão' : `Comprad${p.artigo.startsWith('a') ? 'a' : 'o'} ${o.loja === 'galeria' ? 'na galeria' : o.loja === 'antiquario' ? 'no antiquário' : 'na loja'}`} por ${fmt(o.preco)}${o.certificado ? ', com certificado' : ', sem papel nenhum'}.` }]
  };
  (v.financas.colecao ??= []).push(peca);
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
  const base = c.valor * (c.certificado ? 1 : 0.85);
  return Math.round(base * (modo === 'rapido' ? 0.7 : 0.85) / 100) * 100;
}

export function disponibilidadeVenderColecao(v: Vida, id: string, modo: ModoDeVenda): { ok: boolean; motivo?: string } {
  const c = colecao(v).find(x => x.id === id);
  if (!c) return { ok: false, motivo: 'Peça não encontrada.' };
  if (c.emprestadaA) return { ok: false, motivo: 'Está em exposição no museu: primeiro, recolher.' };
  if (modo === 'leilao' && c.valor < 3000) return { ok: false, motivo: 'Nenhuma casa de leilão pega peça desse valor.' };
  return { ok: true };
}

export function venderColecao(v: Vida, r: Rng, id: string, modo: ModoDeVenda): string {
  const c = colecao(v).find(x => x.id === id)!;
  const recebido = modo === 'rapido' ? estimativaDeVenda(c, 'rapido') : Math.round(Math.max(0.4, 1 + r.normal() * 0.18) * estimativaDeVenda(c, 'leilao') / 100) * 100;
  v.financas.conta += recebido;
  v.financas.colecao = colecao(v).filter(x => x.id !== id);
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
  for (const c of lista) {
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
  herdada: 'herdada', propria: 'da sua própria história', presente: 'um presente', sem_procedencia: 'sem procedência'
};
