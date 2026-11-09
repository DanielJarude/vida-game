/**
 * VIDA 14 — EMPRESAS: a leitura dos números (o painel organizado por grupos) e o normalizador dos saves.
 *
 * A conta do valor mora em `dados14/empresas/valuation` (pura) e é chamada pelos sistemas antigos (`empresas`,
 * `empresas129`). Aqui só se LÊ: faturamento, despesas, lucro, margem, crescimento; caixa, instalações, dívida,
 * patrimônio; participação, quanto a sua parte vale, quanto você pôs, a valorização; e o porquê do valor, em palavras.
 * Sem gráfico de faturamento ao longo dos anos (pedido rejeitado pelo usuário): os números do ano e a comparação com o
 * anterior.
 */

import type { Empresa, Vida } from '../../tipos';
import { avaliar, detalheDoValorPequena14, valorDaParte, valorDeVendaDaParte } from '../../sistemas/empresas';
import { avaliarGrande, detalheDoValorGrande14, ehGrande, setorDe } from '../../sistemas/empresas129';
import { MULTIPLO_PEQUENA_14 } from '../../dados14/empresas/valuation';
import { anoDe } from '../../tempo';
import { tipoDeEmpresa } from '../../dados/empresas';

export interface Numero14 { rotulo: string; valor: number; tipo: 'dinheiro' | 'pct' | 'nota' | 'texto'; tom?: 'bom' | 'ruim'; dica?: string; texto?: string }

export interface IndicadoresDaEmpresa14 {
  /** O que a pessoa tem ali: a parte, quanto vale, quanto pôs, a valorização, quanto um comprador paga hoje. */
  sociedade: { parte: number; valorDaParte: number; investido: number; valorizacao?: number; valorDaEmpresa: number; seVenderHoje: number; socio?: string };
  resultado: Numero14[];
  balanco: Numero14[];
  operacao: Numero14[];
  /** Como o valor foi calculado, em palavras. */
  porqueDoValor: string;
  /** O ano dos números (undefined antes do primeiro ano fechado). */
  ano?: number;
}

const variacao = (agora: number, antes: number | undefined) => (antes === undefined || Math.abs(antes) < 1 ? undefined : (agora - antes) / Math.abs(antes));
const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);
const pctTxt = (x: number) => `${Math.round(x * 100)}%`;

export function indicadoresDaEmpresa14(v: Vida, e: Empresa): IndicadoresDaEmpresa14 {
  const grande = ehGrande(e) && !!e.corp;
  const u = e.ultimo;
  const anos = e.anos ?? [];
  const ant = anos.length >= 2 ? anos[anos.length - 2] : undefined;
  const resultado: Numero14[] = [];
  if (u) {
    const despesas = u.custos + (u.imposto ?? 0);
    resultado.push({ rotulo: 'Faturamento', valor: u.receita, tipo: 'dinheiro' });
    if (u.apoio) resultado.push({ rotulo: 'Patrocínio e apoio', valor: u.apoio, tipo: 'dinheiro' });
    resultado.push({ rotulo: 'Despesas (com impostos)', valor: despesas, tipo: 'dinheiro' });
    resultado.push({ rotulo: u.resultado >= 0 ? 'Lucro' : 'Prejuízo', valor: u.resultado, tipo: 'dinheiro', tom: u.resultado >= 0 ? 'bom' : 'ruim' });
    if (u.receita > 0) resultado.push({ rotulo: 'Margem', valor: u.resultado / u.receita, tipo: 'pct', tom: u.resultado >= 0 ? undefined : 'ruim', dica: 'quanto de cada real faturado sobra' });
    const cr = variacao(u.receita, ant?.receita);
    if (cr !== undefined) resultado.push({ rotulo: 'Crescimento do faturamento', valor: cr, tipo: 'pct', tom: cr >= 0 ? 'bom' : 'ruim', dica: 'contra o ano anterior' });
    const cl = variacao(u.resultado, ant?.lucro);
    if (cl !== undefined && ant && ant.lucro > 0 && u.resultado > 0) resultado.push({ rotulo: 'Crescimento do lucro', valor: cl, tipo: 'pct', tom: cl >= 0 ? 'bom' : 'ruim', dica: 'contra o ano anterior' });
    if (u.distribuido > 0) resultado.push({ rotulo: 'Distribuído para você', valor: Math.round(u.distribuido * e.parte), tipo: 'dinheiro', tom: 'bom' });
  }
  const divida = e.corp?.divida ?? 0;
  const caixa = e.caixa;
  const balanco: Numero14[] = [
    { rotulo: 'Caixa da empresa', valor: caixa, tipo: 'dinheiro', tom: caixa < 0 ? 'ruim' : undefined },
    { rotulo: grande ? 'Fábricas, unidades e linhas' : 'Instalações e equipamento', valor: e.ativos, tipo: 'dinheiro', dica: 'pelo valor de livro' }
  ];
  if (divida > 0 || grande) balanco.push({ rotulo: 'Dívida da empresa', valor: divida, tipo: 'dinheiro', tom: divida > 0 ? 'ruim' : undefined });
  const pl = caixa + e.ativos - divida;
  balanco.push({ rotulo: 'Patrimônio líquido', valor: pl, tipo: 'dinheiro', tom: pl < 0 ? 'ruim' : undefined, dica: 'caixa + instalações − dívida' });

  const operacao: Numero14[] = [];
  const a = anos[anos.length - 1];
  if (a && grande) operacao.push({ rotulo: 'Produtividade', valor: a.produtividade, tipo: 'nota' });
  operacao.push({ rotulo: 'Reputação', valor: e.reputacao, tipo: 'nota' });
  if (!grande && u) operacao.push({ rotulo: `${cap(tipoDeEmpresa(e.tipo).publicoNome[1])} no ano`, valor: u.publico, tipo: 'texto', texto: u.publico.toLocaleString('pt-BR') });
  if (!grande) operacao.push({ rotulo: 'Qualidade', valor: e.qualidade, tipo: 'nota' });
  if (e.corp?.participacao) operacao.push({ rotulo: 'Fatia do mercado', valor: e.corp.participacao, tipo: 'pct' });
  if (e.unidades > 1 && !grande) operacao.push({ rotulo: 'Unidades', valor: e.unidades, tipo: 'texto', texto: String(e.unidades) });

  const vp = valorDaParte(e);
  const sociedade = {
    parte: e.parte, valorDaParte: Math.round(vp), investido: e.investido, valorizacao: e.investido > 0 ? (vp - e.investido) / e.investido : undefined,
    valorDaEmpresa: e.avaliacao ?? 0, seVenderHoje: valorDeVendaDaParte(e), socio: e.parte < 1 ? e.socio : undefined
  };
  return { sociedade, resultado, balanco, operacao, porqueDoValor: porqueDoValor14(v, e), ano: u ? anoDe(u.t) : undefined };
}

/** O porquê do valor, em palavras (o múltiplo, o lucro normal, os descontos; ou a liquidação). */
export function porqueDoValor14(v: Vida, e: Empresa): string {
  if (e.estado === 'encerrada') return 'A empresa não existe mais.';
  const grande = ehGrande(e) && !!e.corp;
  const d = grande ? detalheDoValorGrande14(v, e) : detalheDoValorPequena14(v, e);
  const mult = grande ? setorDe(e)!.multiplo : (MULTIPLO_PEQUENA_14[e.tipo] ?? 3.5);
  const descontos: string[] = [];
  if (d.fatores.historico < 1) descontos.push(`${pctTxt(1 - d.fatores.historico)} por ter pouco histórico`);
  if (d.fatores.risco < 0.99) descontos.push(`${pctTxt(1 - d.fatores.risco)} pela instabilidade dos resultados`);
  if (d.fatores.crescimento > 1.01) descontos.push(`um prêmio de ${pctTxt(d.fatores.crescimento - 1)} pelo crescimento`);
  else if (d.fatores.crescimento < 0.99) descontos.push(`${pctTxt(1 - d.fatores.crescimento)} pela receita encolhendo`);
  const dividaTxt = (e.corp?.divida ?? 0) > 0 ? ', menos a dívida' : '';
  if (d.lucroNormal <= 0 || d.liquidacao >= d.operacao) {
    return `Hoje a empresa vale pelo que sobraria vendendo tudo (instalações e o que está em obra, com desconto), mais o caixa${dividaTxt}: ${d.lucroNormal <= 0 ? 'sem lucro, ninguém paga pela operação' : 'o lucro ainda não paga mais que isso'}.`;
  }
  return `Um comprador paga uns ${String(mult).replace('.', ',')} anos do lucro normal (a média dos últimos anos${grande ? ', antes dos juros' : ''})${descontos.length ? `, com ${descontos.join(', ')}` : ''}; soma o caixa${dividaTxt}. Vender custa: o comprador negocia e a corretagem leva parte${e.parte < 0.5 ? ' — e uma fatia sem controle vale menos' : ''}.`;
}

/**
 * Saves antigos: a avaliação ATUAL das empresas ativas (o que entra no patrimônio e o preço de venda) passa a seguir a conta
 * nova. O histórico (o valor de cada ano já registrado, o que se pagou, o que se recebeu) não muda.
 */
export function normalizarVida14Empresas(v: Vida): void {
  for (const e of v.financas?.empresas ?? []) {
    if (e.estado === 'encerrada' || !(e.historico ?? []).length) continue;
    try { if (ehGrande(e) && e.corp) avaliarGrande(v, e); else avaliar(v, e); } catch { /* sem o mundo carregado: fica o valor gravado até o próximo ano */ }
  }
}
