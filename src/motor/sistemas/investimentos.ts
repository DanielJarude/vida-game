/**
 * Investimentos: pôr, tirar, render, perder.
 *
 * Cada produto tem UMA aplicação por vida (aportes somam), com o total posto
 * (`aportado`) e o valor de hoje. Ganho ou perda é a diferença — sem
 * promessas. Renda só existe onde existe: dividendos das ações, aluguel dos
 * fundos de imóveis. Reserva e renda fixa não pagam nada na conta: o
 * rendimento fica lá dentro.
 *
 * O ruído de cada produto em cada ano vem da semente da economia, não do
 * gerador da vida: aplicar ou não aplicar não muda o que a bolsa fez.
 */

import { criarRng } from '../rng';
import type { Aplicacao, LinhaRazao, Produto, Vida } from '../tipos';
import { anoDe } from '../tempo';
import { produto, PRODUTOS } from '../dados/investimentos';
import type { AnoEconomico } from './economia';

const ORDEM: Produto[] = PRODUTOS.map(p => p.id);

export const aplicacao = (v: Vida, p: Produto) => v.financas.investimentos.find(a => a.produto === p);

/** Valor somado de todas as aplicações. */
export const totalAplicado = (v: Vida) => v.financas.investimentos.reduce((s, a) => s + a.valor, 0);

/** O que dá para usar numa emergência em poucos dias, sem risco de perder. */
export const liquidezImediata = (v: Vida) => Math.max(0, v.financas.conta) + (aplicacao(v, 'reserva')?.valor ?? 0) + (aplicacao(v, 'pos_fixado')?.valor ?? 0);

/** Guardado em reserva + renda fixa (para frases como "a reserva segura X meses"). */
export const reservaSegura = (v: Vida) => (aplicacao(v, 'reserva')?.valor ?? 0) + (aplicacao(v, 'pos_fixado')?.valor ?? 0);

export function aplicar(v: Vida, p: Produto, valor: number): Aplicacao {
  valor = Math.round(valor);
  v.financas.conta -= valor;
  return depositar(v, p, valor);
}

/** Põe dinheiro numa aplicação (sem tirar da conta — para migração e transferências). */
export function depositar(v: Vida, p: Produto, valor: number): Aplicacao {
  let a = aplicacao(v, p);
  if (!a) {
    a = { id: `apl_${p}`, produto: p, aportado: 0, valor: 0, tInicio: v.t, historico: [], pico: 0 };
    v.financas.investimentos.push(a);
    v.financas.investimentos.sort((x, y) => ORDEM.indexOf(x.produto) - ORDEM.indexOf(y.produto));
  }
  if (p === 'inflacao') {
    // Cada compra trava a taxa do dia; a aplicação guarda a média ponderada.
    const taxaHoje = (v.economia?.juroReal ?? 0.045) + 0.002;
    a.taxa = a.valor + valor > 0 ? ((a.taxa ?? taxaHoje) * a.valor + taxaHoje * valor) / (a.valor + valor) : taxaHoje;
  }
  a.aportado += valor;
  a.valor += valor;
  a.pico = Math.max(a.pico ?? 0, a.valor);
  return a;
}

/**
 * Tira dinheiro de uma aplicação e põe na conta. A base de custo cai na
 * mesma proporção: vender com perda REALIZA a perda.
 */
export function resgatar(v: Vida, id: string, valor: number): number {
  const a = v.financas.investimentos.find(x => x.id === id);
  if (!a || a.valor <= 0) return 0;
  const tirado = Math.round(Math.min(valor, a.valor));
  const fracao = tirado / a.valor;
  a.aportado = Math.round(a.aportado * (1 - fracao));
  a.valor -= tirado;
  v.financas.conta += tirado;
  if (a.valor < 1) v.financas.investimentos = v.financas.investimentos.filter(x => x.id !== a.id);
  return tirado;
}

/**
 * Cobre uma falta com as aplicações, do mais fácil de tirar para o mais
 * arriscado. Devolve quanto ainda faltou e se precisou vender algo na baixa.
 */
export function cobrirComAplicacoes(v: Vida, falta: number): { resta: number; vendeuNaBaixa: string[] } {
  const vendeuNaBaixa: string[] = [];
  const ordenadas = [...v.financas.investimentos].sort((a, b) => produto(a.produto).ordemResgate - produto(b.produto).ordemResgate);
  for (const a of ordenadas) {
    if (falta <= 0) break;
    const perdendo = a.valor < a.aportado * 0.9 && produto(a.produto).risco >= 3;
    const tirado = resgatar(v, a.id, falta);
    v.financas.conta -= tirado; // quem chamou decide para onde vai
    falta -= tirado;
    if (perdendo && tirado > 0) vendeuNaBaixa.push(produto(a.produto).nome.toLowerCase());
  }
  return { resta: Math.max(0, falta), vendeuNaBaixa };
}

/** Rendimento real de cada produto num ano (sem a parte paga em dinheiro). */
export function retornos(ec: AnoEconomico, semente: number, ano: number, taxaInflacao = 0.05): { preco: Record<Produto, number>; renda: Partial<Record<Produto, number>> } {
  const selic = (1 + ec.juroReal) * (1 + ec.inflacao) - 1;
  const real = (nominal: number) => (1 + nominal) / (1 + ec.inflacao) - 1;
  const ruido = (k: number) => {
    const r = criarRng(((semente ^ Math.imul(ano + 7919 * k, 0x2c1b3c6d)) >>> 0));
    return r.normal();
  };
  const reserva = real(0.72 * selic);
  const posFixado = real(0.87 * selic);
  const crise = ec.fase === 'crise';
  const colapso = criarRng(((semente * 31 + ano * 101) >>> 0)).next() < 0.02;
  return {
    preco: {
      reserva,
      pos_fixado: posFixado,
      inflacao: taxaInflacao * 0.85 - 7 * ec.deltaJuro + ruido(1) * 0.004,
      multimercado: 0.62 * posFixado + 0.38 * (ec.bolsa + 0.03) - 0.006 + ruido(2) * 0.02,
      acoes: ec.bolsa - 0.003 + ruido(3) * 0.03,
      imobiliario: 1.4 * ec.imoveis - 0.008 + ruido(4) * 0.06,
      acao_unica: colapso ? -0.65 : Math.max(-0.8, 1.2 * ec.bolsa + ruido(5) * 0.26 - 0.005)
    },
    renda: { acoes: crise ? 0.025 : 0.035, imobiliario: crise ? 0.038 : 0.045, acao_unica: 0.02 }
  };
}

/**
 * O ano das aplicações: valoriza ou desvaloriza cada uma, paga a renda (na
 * conta) e guarda o histórico. Devolve as linhas da razão.
 */
export function processarInvestimentos(v: Vida, ec: AnoEconomico): LinhaRazao[] {
  const linhas: LinhaRazao[] = [];
  const ano = anoDe(v.t);
  const semente = v.economia.semente;
  let renda = 0;
  let variacao = 0;
  for (const a of v.financas.investimentos) {
    const r = retornos(ec, semente, ano, a.taxa ?? 0.05);
    const antes = a.valor;
    a.valor = Math.max(0, Math.round(a.valor * (1 + r.preco[a.produto])));
    a.retornoAno = r.preco[a.produto];
    const pago = Math.round(antes * (r.renda[a.produto] ?? 0));
    a.rendaAno = pago || undefined;
    renda += pago;
    variacao += a.valor - antes;
    a.historico.push(a.valor);
    if (a.historico.length > 30) a.historico.shift();
    a.pico = Math.max(a.pico ?? 0, a.valor);
  }
  v.financas.conta += renda;
  if (variacao !== 0) linhas.push({ rotulo: 'Valorização das aplicações', valor: variacao, grupo: 'renda', de: 'patrimonio' });
  if (renda > 0) linhas.push({ rotulo: 'Dividendos e aluguéis de fundos', valor: renda, grupo: 'renda', de: 'patrimonio' });
  return linhas;
}

/** Renda mensal média que as aplicações pagaram no último ano (para o orçamento). */
export const rendaDasAplicacoes = (v: Vida) => Math.round(v.financas.investimentos.reduce((s, a) => s + (a.rendaAno ?? 0), 0) / 12);

/** Ganho (positivo) ou perda (negativo) de uma aplicação desde o primeiro aporte. */
export const resultado = (a: Aplicacao) => a.valor - a.aportado;

/** Variação no último ano (%), se houver histórico. */
export const variacaoNoAno = (a: Aplicacao): number | undefined => a.retornoAno;
