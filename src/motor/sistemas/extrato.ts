/**
 * O extrato: a conta de cada ano, real por real.
 *
 * O jogo mexe na conta em muitos lugares (o fechamento do ano, as escolhas,
 * os acontecimentos, o cachê, a viagem). Antes, só o fechamento deixava
 * rastro (`razao`) — e nem ele inteiro: um custo que saía da conta em outro
 * sistema (o circuito do tenista, por exemplo) sumia sem linha, e a tela
 * dizia "sobram R$ 14 mil por mês" com a conta parada em zero (A1, playtest).
 *
 * Aqui, a regra é contábil: saldo inicial + linhas = saldo final, na conta E
 * nas aplicações (um aporte é −conta e +aplicado; uma valorização é só
 * +aplicado). Quem move dinheiro com conta conhecida lança a linha
 * (`lancar`); o que mexeu sem lançar é PENDENTE e vira linha com o rótulo de
 * quem conferiu (`conferir`) — nunca diferença silenciosa. O fechamento do
 * ano confere o próprio trabalho: o que ele lançou tem que bater com o que
 * a conta andou; se não bater, a diferença fica escrita como 'ajuste' (e os
 * testes de contabilidade exigem que não exista).
 *
 * O período vai de um fechamento (`fotografar`, no aniversário) ao seguinte:
 * as escolhas do jogador e os acontecimentos do fim do ano entram no período
 * que está aberto.
 */

import type { ExtratoDoAno, LinhaExtrato, TipoMovimento, Vida } from '../tipos';

/** Total nas aplicações (a mesma conta de `investimentos.totalAplicado`, sem importar o módulo). */
const aplicadoDe = (v: Vida) => v.financas.investimentos.reduce((s, a) => s + a.valor, 0);
const r2 = (x: number) => Math.round(x * 100) / 100;

const valido = (e: ExtratoDoAno | undefined): e is ExtratoDoAno =>
  !!e && Array.isArray(e.linhas) && Number.isFinite(e.contaInicial) && Number.isFinite(e.aplicadoInicial);

/** O extrato aberto (criado agora, com o saldo de agora, se ainda não havia — saves antigos). */
export function extratoAberto(v: Vida): ExtratoDoAno {
  const f = v.financas;
  if (!valido(f.extratoAberto)) f.extratoAberto = { tInicio: v.t, contaInicial: r2(f.conta), aplicadoInicial: r2(aplicadoDe(v)), linhas: [] };
  return f.extratoAberto;
}

/** O que o extrato aberto já explica: saldo inicial + linhas. */
export function explicado(e: ExtratoDoAno): { conta: number; aplicado: number } {
  return {
    conta: e.contaInicial + e.linhas.reduce((s, l) => s + l.conta, 0),
    aplicado: e.aplicadoInicial + e.linhas.reduce((s, l) => s + l.aplicado, 0)
  };
}

/** O que mexeu na conta e nas aplicações desde a última linha, sem linha própria. */
export function pendente(v: Vida): { conta: number; aplicado: number } {
  const x = explicado(extratoAberto(v));
  return { conta: r2(v.financas.conta - x.conta), aplicado: r2(aplicadoDe(v) - x.aplicado) };
}

/**
 * Lança uma linha (o movimento JÁ aconteceu, ou acontece junto, pela mão de
 * quem lança). Linhas de mesmo rótulo e tipo se somam: o extrato fica curto.
 */
export function lancar(v: Vida, rotulo: string, tipo: TipoMovimento, conta: number, aplicado = 0): void {
  if (Math.abs(conta) < 0.005 && Math.abs(aplicado) < 0.005) return;
  const e = extratoAberto(v);
  const l = e.linhas.find(x => x.rotulo === rotulo && x.tipo === tipo);
  if (l) { l.conta = r2(l.conta + conta); l.aplicado = r2(l.aplicado + aplicado); return; }
  e.linhas.push({ rotulo, tipo, conta: r2(conta), aplicado: r2(aplicado) });
}

/** Dá nome ao que mexeu sem linha desde a última conferência. Devolve o que havia de pendente. */
export function conferir(v: Vida, rotulo: string, tipo: TipoMovimento): { conta: number; aplicado: number } {
  const p = pendente(v);
  lancar(v, rotulo, tipo, p.conta, p.aplicado);
  return p;
}

/**
 * Mede o que `fn` moveu e lança como uma linha. Para os movimentos que
 * acontecem dentro de outro sistema (o resgate, a ajuda da família): o rótulo
 * é de quem chama; o valor é o que de fato andou.
 */
export function medir<T>(v: Vida, rotulo: string, tipo: TipoMovimento, fn: () => T): T {
  const c0 = v.financas.conta;
  const a0 = aplicadoDe(v);
  const out = fn();
  lancar(v, rotulo, tipo, v.financas.conta - c0, aplicadoDe(v) - a0);
  return out;
}

/**
 * Fecha o período (no aniversário): o pendente vira linha de acontecimentos,
 * o saldo final é o de agora, e um período novo começa com ele.
 */
export function fecharExtrato(v: Vida, rotuloDoPendente = 'Outros movimentos do ano'): ExtratoDoAno {
  const e = extratoAberto(v);
  conferir(v, rotuloDoPendente, 'acontecimento');
  e.tFim = v.t;
  e.contaFinal = r2(v.financas.conta);
  e.aplicadoFinal = r2(aplicadoDe(v));
  v.financas.extrato = e;
  v.financas.extratoAberto = { tInicio: v.t, contaInicial: e.contaFinal, aplicadoInicial: e.aplicadoFinal, linhas: [] };
  return e;
}

/* ============================================================ Conciliação */

export interface Conciliacao {
  ok: boolean;
  /** Saldo inicial + linhas − saldo final (zero quando bate). */
  diferencaConta: number;
  diferencaAplicado: number;
  /** Linhas de ajuste (diferença que o fechamento não soube explicar). */
  ajustes: LinhaExtrato[];
}

/**
 * Confere um extrato fechado: saldo inicial + linhas = saldo final, na conta
 * e nas aplicações (tolerância de centavos), e nenhuma linha de 'ajuste'.
 * Pura: serve aos testes, ao simulador e a quem quiser auditar um save.
 */
export function conciliar(e: ExtratoDoAno, tolerancia = 1): Conciliacao {
  const x = explicado(e);
  const diferencaConta = r2(x.conta - (e.contaFinal ?? x.conta));
  const diferencaAplicado = r2(x.aplicado - (e.aplicadoFinal ?? x.aplicado));
  const ajustes = e.linhas.filter(l => l.tipo === 'ajuste');
  return { ok: Math.abs(diferencaConta) <= tolerancia && Math.abs(diferencaAplicado) <= tolerancia && ajustes.length === 0, diferencaConta, diferencaAplicado, ajustes };
}

/** Somas do extrato por tipo (para a tela e o simulador). */
export function somasDoExtrato(e: ExtratoDoAno): Record<TipoMovimento, { conta: number; aplicado: number }> {
  const out = {} as Record<TipoMovimento, { conta: number; aplicado: number }>;
  for (const l of e.linhas) {
    const s = (out[l.tipo] ??= { conta: 0, aplicado: 0 });
    s.conta = r2(s.conta + l.conta);
    s.aplicado = r2(s.aplicado + l.aplicado);
  }
  return out;
}
