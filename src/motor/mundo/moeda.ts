/**
 * MOEDA E CONVERSÃO.
 *
 * O motor conta em UMA unidade: o real de poder de compra brasileiro de 2026
 * (a unidade em que o jogo sempre contou). Um salário, um preço, um saldo
 * são números nessa unidade — e o país dá o resto:
 *
 *   - na TELA e no TEXTO, o valor aparece na moeda do país, pelo fator de
 *     paridade de poder de compra (Banco Mundial): o mesmo pão, o mesmo
 *     aluguel de bairro, a mesma passagem de ônibus custam "o mesmo esforço"
 *     em pesos, em euros ou em reais. Por isso os preços de catálogo do
 *     motor servem em todo lugar;
 *   - o que é DIFERENTE entre países vem dos perfis: a renda (um país mais
 *     rico paga mais, na mesma unidade), a moradia, a saúde, a universidade,
 *     os impostos;
 *   - numa MUDANÇA DE PAÍS, o dinheiro atravessa a fronteira pelo câmbio de
 *     mercado, não pela paridade: o real que vale um café em Belo Horizonte
 *     compra menos café em Zurique. A conversão (`converterEntrePaises`) é
 *     pelo nível de preços relativo — não cria nem some dinheiro: conserva o
 *     valor de mercado, como uma remessa conserva.
 *
 * O CONTEXTO: o motor processa uma vida de cada vez. Quem entra no motor
 * (o ano, uma ação, o nascimento, a sucessão) e a tela que mostra uma vida
 * dizem o país corrente (`definirPaisCorrente`); `dinheiro()` lê dele.
 */

import { PAIS_PADRAO, paisDoCatalogo } from './registro';

let corrente = PAIS_PADRAO;

/** O país cuja moeda o texto usa agora (o da residência da vida em processamento). */
export const definirPaisCorrente = (pais: string) => { corrente = pais; };
export const paisCorrente = () => corrente;

/** Moeda local por unidade do motor. */
export function fatorDoPais(pais: string): number {
  return paisDoCatalogo(pais).economia?.fator ?? 1;
}

/** Nível de preços do país relativo ao Brasil (o que converte riqueza numa mudança). */
export function precosDoPais(pais: string): number {
  return paisDoCatalogo(pais).economia?.precos ?? 1;
}

/** Quanto um valor do motor vale em outro país, atravessando pelo câmbio de mercado. */
export function converterEntrePaises(valor: number, de: string, para: string): number {
  if (de === para) return valor;
  return valor * precosDoPais(de) / precosDoPais(para);
}

/** Valor do motor → moeda local. */
export const emMoedaLocal = (valor: number, pais = corrente) => valor * fatorDoPais(pais);
/** Moeda local → valor do motor (o que o jogador digita). */
export const daMoedaLocal = (valor: number, pais = corrente) => valor / fatorDoPais(pais);

const SIMBOLOS = new Map<string, string>();
/** O símbolo da moeda como se escreve em português do Brasil (R$, US$, €, £, ARS, JP¥). */
export function simboloDaMoeda(codigo: string): string {
  let s = SIMBOLOS.get(codigo);
  if (!s) {
    try {
      s = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: codigo }).formatToParts(1).find(x => x.type === 'currency')?.value ?? codigo;
    } catch { s = codigo; }
    SIMBOLOS.set(codigo, s);
  }
  return s;
}

/** O nome da moeda ("peso argentino", "euro"). */
export function nomeDaMoeda(codigo: string): string {
  try {
    const n = new Intl.DisplayNames(['pt-BR'], { type: 'currency' }).of(codigo);
    return n ? n.charAt(0).toLowerCase() + n.slice(1) : codigo;
  } catch { return codigo; }
}

export const moedaDoPais = (pais = corrente) => paisDoCatalogo(pais).moeda;

/** Com o sinal de menos tipográfico ("−R$ 1.234"), para as telas. */
export function formatarDinheiroCheio(valor: number, pais = corrente): string {
  const local = Math.round(Math.abs(emMoedaLocal(valor, pais)));
  return `${valor < 0 ? '−' : ''}${simboloDaMoeda(moedaDoPais(pais))} ${local.toLocaleString('pt-BR')}`;
}

/** "R$ 1.234", "US$ 512", "€ 980" — um valor do motor na moeda do país. */
export function formatarDinheiro(valor: number, pais = corrente): string {
  const local = Math.round(emMoedaLocal(valor, pais));
  return `${simboloDaMoeda(moedaDoPais(pais))} ${local.toLocaleString('pt-BR')}`;
}

/** Abreviado para leituras rápidas: "R$ 1,2 mi", "US$ 45 mil", "€ 980". Negativos com o sinal de menos tipográfico. */
export function formatarDinheiroCurto(valor: number, pais = corrente, casasMilhao: number | 'auto' = 1): string {
  const local = emMoedaLocal(valor, pais);
  const a = Math.abs(local);
  const s = local < 0 ? '−' : '';
  const sim = simboloDaMoeda(moedaDoPais(pais));
  if (a >= 1_000_000_000) return `${s}${sim} ${(a / 1_000_000_000).toFixed(1).replace('.', ',')} bi`;
  if (a >= 1_000_000) return `${s}${sim} ${(a / 1_000_000).toFixed(casasMilhao === 'auto' ? (a >= 10_000_000 ? 0 : 1) : casasMilhao).replace('.', ',')} mi`;
  if (a >= 10_000) return `${s}${sim} ${Math.round(a / 1000)} mil`;
  return `${s}${sim} ${Math.round(a).toLocaleString('pt-BR')}`;
}
