/**
 * A economia do país: fases, inflação, juro, imóveis e bolsa.
 *
 * DECISÃO DE UNIDADE — REAIS DE HOJE. Uma vida atravessa 70–100 anos. Em
 * moeda corrente, um salário de 2090 viraria R$ 60.000 e um apartamento,
 * R$ 9 milhões: números que não dizem nada a quem joga. O motor trabalha em
 * valores CORRIGIDOS pela inflação (poder de compra de 2026) e a inflação
 * entra onde ela muda a vida de verdade:
 *   - dinheiro parado na conta perde o que a inflação do ano levou;
 *   - a reserva e a renda fixa rendem juro REAL (juro menos inflação), que
 *     muda com a fase — há anos em que a poupança perde para a inflação;
 *   - títulos atrelados à inflação travam uma taxa real e oscilam de preço
 *     quando o juro muda;
 *   - salários ganham ou perdem poder de compra conforme a fase (reajuste
 *     abaixo da inflação na crise, acima na expansão).
 * O nível de preços acumulado (`precos`) existe para contar essa história
 * ("os preços dobraram desde que você começou a trabalhar"), não para inflar
 * a tela.
 *
 * DETERMINISMO. O caminho da economia sai de uma semente própria e do ano —
 * não do gerador da vida. Jogar de novo a mesma vida dá a mesma economia,
 * qualquer que seja a escolha; o que muda é como cada escolha a atravessa.
 *
 * SEM JURO COMPOSTO QUEBRADO. Bolsa e imóveis voltam devagar para uma
 * tendência modesta (a bolsa não sobe para sempre; o imóvel não valoriza
 * para sempre); o juro real fica entre 1% e 9% ao ano.
 */

import { criarRng, type Rng } from '../rng';
import type { Economia, FaseEconomica, Vida } from '../tipos';
import { anoDe } from '../tempo';

export const ANO_BASE = 2026;

/** Como a economia se comporta em cada fase (valores anuais, reais). */
const FASE: Record<FaseEconomica, { inflacao: number; juro: number; bolsa: number; imoveis: number; proximas: [FaseEconomica, number][] }> = {
  expansao: { inflacao: 0.055, juro: 0.04, bolsa: 0.11, imoveis: 0.035, proximas: [['expansao', 0.5], ['desaceleracao', 0.38], ['normal', 0.12]] },
  normal: { inflacao: 0.042, juro: 0.045, bolsa: 0.035, imoveis: 0.008, proximas: [['normal', 0.55], ['expansao', 0.2], ['desaceleracao', 0.25]] },
  desaceleracao: { inflacao: 0.05, juro: 0.055, bolsa: -0.05, imoveis: -0.01, proximas: [['crise', 0.38], ['normal', 0.42], ['desaceleracao', 0.2]] },
  crise: { inflacao: 0.075, juro: 0.06, bolsa: -0.17, imoveis: -0.045, proximas: [['crise', 0.3], ['recuperacao', 0.7]] },
  recuperacao: { inflacao: 0.045, juro: 0.035, bolsa: 0.16, imoveis: 0.012, proximas: [['normal', 0.5], ['expansao', 0.35], ['recuperacao', 0.15]] }
};

/** Tendências de longo prazo (reais, ao ano): para onde os índices voltam. */
const TENDENCIA_BOLSA = 0.018;
const TENDENCIA_IMOVEIS = 0.003;

export const ROTULO_FASE: Record<FaseEconomica, string> = {
  expansao: 'economia aquecida', normal: 'economia estável', desaceleracao: 'economia esfriando', crise: 'crise', recuperacao: 'economia se recuperando'
};

/** Gerador do ano: mistura a semente da economia com o ano (independe da vida). */
function rngDoAno(semente: number, ano: number): Rng {
  let h = (semente ^ Math.imul(ano, 0x9e3779b1)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  return criarRng((h ^ (h >>> 16)) >>> 0);
}

export function economiaInicial(semente: number, t: number): Economia {
  const ano = anoDe(t);
  return { semente, fase: 'normal', tFase: t, inflacao: 0.045, juroReal: 0.045, imoveis: 1, bolsa: 1, precos: 1, historico: [{ ano, fase: 'normal', inflacao: 0.045, bolsa: 1, imoveis: 1, juroReal: 0.045 }] };
}

/** O que a economia fez num ano: variações reais de bolsa e imóveis, para os investimentos lerem. */
export interface AnoEconomico {
  fase: FaseEconomica;
  inflacao: number;
  juroReal: number;
  /** Variação real do preço da bolsa no ano. */
  bolsa: number;
  /** Variação real do preço dos imóveis no ano. */
  imoveis: number;
  /** Variação do juro real (para o preço dos títulos longos). */
  deltaJuro: number;
  /** A fase mudou neste ano. */
  virou: boolean;
}

/**
 * Avança a economia um ano. Pura em relação à vida: só a semente e o ano
 * decidem o que acontece.
 */
export function avancarEconomia(e: Economia, t: number): AnoEconomico {
  const ano = anoDe(t);
  const r = rngDoAno(e.semente, ano);
  const anos = Math.max(0, ano - ANO_BASE);
  // Fase: cadeia de Markov anual; crise longa demais tende a acabar.
  let proxima = e.fase;
  const tabela = FASE[e.fase].proximas;
  const duracao = Math.round((t - e.tFase) / 12);
  const alvo = r.next();
  let acc = 0;
  for (const [f, p] of tabela) {
    acc += p;
    if (alvo < acc) { proxima = f; break; }
  }
  if (e.fase === 'crise' && duracao >= 2) proxima = 'recuperacao';
  if (e.fase === 'expansao' && duracao >= 5) proxima = 'desaceleracao';
  const virou = proxima !== e.fase;
  if (virou) { e.fase = proxima; e.tFase = t; }
  const f = FASE[e.fase];

  const inflacao = Math.max(0.01, f.inflacao + r.normal() * 0.012);
  const juroAntes = e.juroReal;
  e.juroReal = Math.min(0.09, Math.max(0.01, e.juroReal * 0.55 + f.juro * 0.45 + r.normal() * 0.004));
  const tendB = Math.pow(1 + TENDENCIA_BOLSA, anos);
  const tendI = Math.pow(1 + TENDENCIA_IMOVEIS, anos);
  const bolsa = Math.max(-0.5, f.bolsa + r.normal() * 0.12 - 0.12 * Math.log(e.bolsa / tendB));
  const imoveis = Math.max(-0.15, f.imoveis + r.normal() * 0.025 - 0.12 * Math.log(e.imoveis / tendI));
  e.inflacao = inflacao;
  e.precos *= 1 + inflacao;
  e.bolsa = Math.max(0.1, e.bolsa * (1 + bolsa));
  e.imoveis = Math.max(0.4, e.imoveis * (1 + imoveis));
  e.historico.push({ ano, fase: e.fase, inflacao: arred(inflacao), bolsa: arred(e.bolsa), imoveis: arred(e.imoveis), juroReal: arred(e.juroReal) });
  if (e.historico.length > 110) e.historico.shift();
  return { fase: e.fase, inflacao, juroReal: e.juroReal, bolsa, imoveis, deltaJuro: e.juroReal - juroAntes, virou };
}

const arred = (x: number) => Math.round(x * 10000) / 10000;

/* ------------------------------------------------------------ Efeitos na vida */

const fase = (v: Vida): FaseEconomica => v.economia?.fase ?? 'normal';

/** Multiplicador do risco de perder o emprego. */
export function fatorDemissao(v: Vida): number {
  return { expansao: 0.8, normal: 1, desaceleracao: 1.35, crise: 2.1, recuperacao: 1.1 }[fase(v)];
}

/** Ajuste na chance de conseguir uma vaga (somado). */
export function ajusteContratacao(v: Vida): number {
  return { expansao: 0.06, normal: 0, desaceleracao: -0.05, crise: -0.15, recuperacao: 0 }[fase(v)];
}

/** Clientela de quem trabalha por conta: o movimento sente a fase. */
export function ajusteClientela(v: Vida): number {
  return { expansao: 3, normal: 0, desaceleracao: -3, crise: -8, recuperacao: 1 }[fase(v)];
}

/** Ganho (ou perda) real do salário no reajuste anual. */
export function reajusteReal(v: Vida): number {
  return { expansao: 0.01, normal: 0.003, desaceleracao: -0.004, crise: -0.015, recuperacao: 0 }[fase(v)];
}

/** Preço relativo dos imóveis hoje (1 = 2026). */
export const indiceImoveis = (v: Vida) => v.economia?.imoveis ?? 1;

/** Juro real ao ano hoje. */
export const juroReal = (v: Vida) => v.economia?.juroReal ?? 0.045;

/** Juro mensal de um financiamento contratado hoje (real), por tipo. */
export function juroDeFinanciamento(v: Vida, tipo: 'imovel' | 'imovel_social' | 'veiculo' | 'emprestimo' | 'consignado' | 'cartao'): number {
  const j = juroReal(v);
  const anual = { imovel: j + 0.03, imovel_social: Math.max(0.02, j - 0.005), veiculo: j + 0.13, emprestimo: j + 0.35, consignado: j + 0.12, cartao: 0.7 }[tipo];
  return Math.pow(1 + anual, 1 / 12) - 1;
}

/** Quanto os preços subiram desde um instante (para contar a inflação em palavras). */
export function inflacaoDesde(v: Vida, t: number): number {
  const ano = anoDe(t);
  const h = v.economia?.historico ?? [];
  let fator = 1;
  for (const x of h) if (x.ano > ano) fator *= 1 + x.inflacao;
  return fator - 1;
}

/** Algo aconteceu na economia neste ano que a pessoa sente? (para a biografia) */
export const entrouEmCrise = (v: Vida) => fase(v) === 'crise' && v.economia.tFase === v.t;
export const saiuDaCrise = (v: Vida) => fase(v) === 'recuperacao' && v.economia.tFase === v.t;
