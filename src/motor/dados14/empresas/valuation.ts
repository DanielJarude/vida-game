/**
 * VIDA 14 — QUANTO VALE UMA EMPRESA (contas puras: sem estado, sem sorteio; quem chama é `sistemas/empresas` e
 * `sistemas/empresas129`).
 *
 * O bug que o jogador achou (quatro empresas revendidas com lucro enorme) tinha três causas:
 *   1. a empresa grande somava DOIS valores de operação — o lucro × o múltiplo E a receita × o múltiplo de receita
 *      (mais um prêmio de "crescimento" que, numa empresa recém-fundada, saía sempre no teto de 80%);
 *   2. a oferta de compra era precificada por UM ano inventado (ou por um histórico inventado, na fatia de empresa
 *      pequena) que não batia com o que a mesma empresa rendia na simulação: comprava-se barato e, um ano depois, a
 *      empresa "real" valia três, quatro vezes mais;
 *   3. a empresa pequena somava as instalações por cima do múltiplo do lucro (o lucro já é o que elas rendem).
 *
 * O valor agora é um só: o que um comprador paga pelo LUCRO NORMAL (a média dos últimos anos), com o múltiplo do ramo,
 * descontado pela falta de histórico (empresa jovem), pela instabilidade dos resultados e pela tendência; a receita só
 * pesa (pouco) quando há prejuízo ou como âncora; o piso é o que sobraria vendendo tudo. Depois soma o caixa e tira a
 * dívida (valor do capital, não da operação). Grandes lucros continuam possíveis: quem faz o lucro crescer de verdade
 * por anos vê o valor crescer junto.
 */

/** Múltiplos do lucro das empresas pequenas (o que um comprador paga por um ano do lucro normal). */
export const MULTIPLO_PEQUENA_14: Record<string, number> = {
  restaurante: 3, loja: 3.5, academia: 4.5, estudio: 3.5, clinica: 5.5, hotel: 6, museu: 3, zoologico: 3
};

/** Quanto do valor de operação um comprador aceita pagar por empresa com N anos de resultados conhecidos. */
export function fatorDeHistorico14(anos: number): number {
  return anos >= 3 ? 1 : anos === 2 ? 0.85 : anos === 1 ? 0.7 : 0.55;
}

/** A instabilidade dos resultados (coeficiente de variação) vira desconto: até 25%. */
export function fatorDeRisco14(lucros: readonly number[]): number {
  if (lucros.length < 2) return 1;
  const m = lucros.reduce((s, x) => s + x, 0) / lucros.length;
  if (m <= 0) return 0.75;
  const dp = Math.sqrt(lucros.reduce((s, x) => s + (x - m) ** 2, 0) / lucros.length);
  return Math.max(0.75, Math.min(1, 1 - (dp / m) * 0.25));
}

/**
 * A tendência da receita (crescimento anual composto entre o primeiro e o último ano com receita), como prêmio ou
 * desconto modesto: só com três anos de receita de verdade; sem isso, neutra.
 */
export function fatorDeCrescimento14(receitas: readonly number[]): number {
  const rs = receitas.filter(x => x > 0);
  if (rs.length < 3) return 1;
  const cagr = Math.pow(rs[rs.length - 1] / rs[0], 1 / (rs.length - 1)) - 1;
  return Math.max(0.85, Math.min(1.3, 1 + cagr * 1.5));
}

export interface EntradaDoValor14 {
  /** Os lucros anuais mais recentes (do mais antigo ao mais novo). */
  lucros: readonly number[];
  /** As receitas anuais correspondentes (vazio se não houver). */
  receitas: readonly number[];
  /** Múltiplo do lucro do ramo. */
  multiplo: number;
  /** Múltiplo da receita do ramo (0 se não se aplica). */
  multReceita: number;
  /** Quanto sobraria vendendo tudo (instalações, linhas, obras) — sem caixa nem dívida. */
  liquidacao: number;
  /** Valor das obras e projetos em andamento (já descontado o risco). */
  emAndamento?: number;
  caixa: number;
  divida: number;
}

export interface ValorDetalhado14 {
  /** O valor da empresa inteira (capital): operação ou liquidação, mais caixa, menos dívida. Nunca negativo. */
  valor: number;
  operacao: number;
  liquidacao: number;
  lucroNormal: number;
  fatores: { historico: number; risco: number; crescimento: number };
}

/** O valor justo de uma empresa (uma conta só, para comprar e para vender). */
export function valorJusto14(x: EntradaDoValor14): ValorDetalhado14 {
  const ls = x.lucros.slice(-3);
  const rs = x.receitas.slice(-3);
  const lucroNormal = ls.length ? ls.reduce((s, y) => s + y, 0) / ls.length : 0;
  const receita = rs.length ? rs[rs.length - 1] : 0;
  const historico = fatorDeHistorico14(x.lucros.length);
  const risco = fatorDeRisco14(ls);
  const crescimento = fatorDeCrescimento14(x.receitas.slice(-4));
  let operacao: number;
  if (lucroNormal > 0) {
    // O lucro manda; a receita entra como âncora (um quarto do peso), nunca somada por inteiro.
    const pelaReceita = x.multReceita > 0 ? receita * x.multReceita : lucroNormal * x.multiplo;
    operacao = (lucroNormal * x.multiplo * 0.75 + Math.min(pelaReceita, lucroNormal * x.multiplo * 2) * 0.25) * historico * risco * crescimento;
  } else {
    // Sem lucro, quem compra paga pela receita com desconto pesado (e só se ela existe).
    operacao = receita * x.multReceita * 0.3 * historico;
  }
  operacao += x.emAndamento ?? 0;
  const valor = Math.max(0, Math.max(operacao, x.liquidacao) + x.caixa - x.divida);
  return { valor, operacao, liquidacao: x.liquidacao, lucroNormal, fatores: { historico, risco, crescimento } };
}

/** Desconto de quem compra uma fatia minoritária (sem controle): vale para comprar e para vender. */
export const descontoMinoritario14 = (parte: number) => (parte < 0.5 ? 0.85 : 1);

/** O que um comprador paga pela sua parte: o valor × a parte × o desconto minoritário × a negociação e a corretagem. */
export const precoDeVenda14 = (valor: number, parte: number) => Math.round(Math.max(0, valor) * parte * descontoMinoritario14(parte) * 0.85 / 1000) * 1000;
