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
import { fatorNominal, mesHistoricoCorrente, padraoEm, PADROES_MONETARIOS_BR, paisHistoricoCorrente, ladoHistoricoCorrente } from '../eras/base/moedas';
import { aoRegistrarEra, moedaNoMes, nivelMensal, pacoteDaEra, type MoedaDaEpoca } from '../eras/base/pacote';

/**
 * ERAS HISTÓRICAS: numa vida histórica no Brasil (`eras/base/moedas`), o valor do motor aparece na moeda que circulava no
 * mês corrente, pelo nível de preços do IPCA daquele mês. Fora disso (vida contemporânea, outro país), nada muda.
 */
const historico = (pais: string): number | null => {
  const m = mesHistoricoCorrente();
  // ERAS v3: também os países com pacote de época (o mês é o mesmo no mundo inteiro); os demais, a moeda de hoje.
  return m !== null && (pais === 'BR' || !!pacoteDaEra(pais)) ? m : null;
};

/** O lado (do país dividido) para a moeda: o da vida em processamento, quando é o país dela. */
const ladoPara = (pais: string) => (pais === paisHistoricoCorrente() ? ladoHistoricoCorrente() : 'oeste');

/** ERAS v3: a moeda de um país com pacote no mês (undefined para o Brasil, que tem os padrões próprios). */
function moedaHistorica(pais: string, t: number): MoedaDaEpoca | undefined {
  const p = pacoteDaEra(pais);
  return p ? moedaNoMes(p, t, ladoPara(pais)) : undefined;
}

/** Unidades da moeda da época por unidade do motor, no mês, no país (o Brasil pela cadeia da v1). */
export function fatorNominalNoPais(pais: string, t: number): number {
  if (pais === 'BR') return fatorNominal(t);
  const p = pacoteDaEra(pais);
  if (!p) return fatorDoPais(pais);
  return fatorDoPais(pais) * nivelMensal(p.serie, t) * moedaNoMes(p, t, ladoPara(pais)).porAtual;
}

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
  // REWORK 11 · ESP-11.5: na MESMA moeda (o euro da Espanha e o da Itália), o dinheiro não muda de valor: o mesmo
  // número de euros lá e cá (antes, um resíduo de arredondamento dos índices de preços).
  if (moedaDoPais(de) === moedaDoPais(para)) return valor * fatorDoPais(de) / fatorDoPais(para);
  return valor * precosDoPais(de) / precosDoPais(para);
}
/** Os dois países usam a mesma moeda (o euro, o dólar americano...). */
export const mesmaMoeda = (a: string, b: string) => a === b || moedaDoPais(a) === moedaDoPais(b);

/** Valor do motor → moeda local. */
export const emMoedaLocal = (valor: number, pais = corrente) => { const h = historico(pais); return h !== null ? valor * fatorNominalNoPais(pais, h) : valor * fatorDoPais(pais); };
/** Moeda local → valor do motor (o que o jogador digita). */
export const daMoedaLocal = (valor: number, pais = corrente) => { const h = historico(pais); return h !== null ? valor / fatorNominalNoPais(pais, h) : valor / fatorDoPais(pais); };
/** ERAS v3: um valor na moeda de HOJE do país (os números legais dos perfis) → motor, mesmo numa vida histórica. */
export const daMoedaLocalDeHoje = (valor: number, pais = corrente) => valor / fatorDoPais(pais);

const SIMBOLOS = new Map<string, string>(PADROES_MONETARIOS_BR.map(p => [p.codigo, p.simbolo]));
const NOMES_HISTORICOS = new Map<string, string>(PADROES_MONETARIOS_BR.filter(p => p.codigo !== 'BRL').map(p => [p.codigo, p.nome]));
// ERAS v3: as moedas dos pacotes de época (chave = id da moeda; as de hoje usam o código ISO e ficam com o nome de sempre).
aoRegistrarEra(p => { for (const m of p.moedas) { if (/^[A-Z]{3}$/.test(m.id)) continue; SIMBOLOS.set(m.id, m.simbolo); NOMES_HISTORICOS.set(m.id, m.nome); } });
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
  const h = NOMES_HISTORICOS.get(codigo);
  if (h) return h;
  try {
    const n = new Intl.DisplayNames(['pt-BR'], { type: 'currency' }).of(codigo);
    return n ? n.charAt(0).toLowerCase() + n.slice(1) : codigo;
  } catch { return codigo; }
}

export const moedaDoPais = (pais = corrente) => { const h = historico(pais); return h !== null ? (pais === 'BR' ? padraoEm(h).codigo : moedaHistorica(pais, h)?.id ?? paisDoCatalogo(pais).moeda) : paisDoCatalogo(pais).moeda; };

/**
 * ERAS v3: as escritas antigas — o réis com o cifrão no meio ("1:250$000", um conto e 250 mil-réis; "3$500") e a libra
 * antes da decimalização de 15/02/1971 (£1 = 20 xelins = 240 pence: "£3 4s 6d"). undefined = a escrita de sempre.
 */
export function escritaAntiga(local: number, pais = corrente): string | undefined {
  const h = historico(pais);
  if (h === null) return undefined;
  const f = pais === 'BR' ? padraoEm(h).formato : moedaHistorica(pais, h)?.formato;
  if (f === 'reis') {
    const reis = Math.round(Math.abs(local));
    const mil = Math.floor(reis / 1000), r = reis % 1000, contos = Math.floor(mil / 1000), mr = mil % 1000;
    const p3 = (n: number) => String(n).padStart(3, '0');
    return 'Rs ' + (contos > 0 ? contos.toLocaleString('pt-BR') + ':' + p3(mr) + '$' + p3(r) : mr + '$' + p3(r));
  }
  if (f === 'lsd') {
    const pence = Math.round(Math.abs(local) * 240);
    const libras = Math.floor(pence / 240), xel = Math.floor((pence % 240) / 12), d = pence % 12;
    if (libras >= 100) return '£' + libras.toLocaleString('pt-BR') + (xel ? ' ' + xel + 's' : '');
    const partes = [libras ? '£' + libras : '', xel ? xel + 's' : '', d || (!libras && !xel) ? d + 'd' : ''].filter(Boolean);
    return partes.join(' ');
  }
  return undefined;
}

/** Com o sinal de menos tipográfico ("−R$ 1.234"), para as telas. */
export function formatarDinheiroCheio(valor: number, pais = corrente): string {
  const bruto = emMoedaLocal(valor, pais);
  const antiga = escritaAntiga(bruto, pais);
  if (antiga) return (valor < 0 ? '−' : '') + antiga;
  const local = Math.round(Math.abs(bruto));
  return `${valor < 0 ? '−' : ''}${simboloDaMoeda(moedaDoPais(pais))} ${local.toLocaleString('pt-BR')}`;
}

/** "R$ 1.234", "US$ 512", "€ 980" — um valor do motor na moeda do país. */
export function formatarDinheiro(valor: number, pais = corrente): string {
  const bruto = emMoedaLocal(valor, pais);
  const antiga = escritaAntiga(bruto, pais);
  if (antiga) return (bruto < 0 ? '-' : '') + antiga;
  const local = Math.round(bruto);
  return `${simboloDaMoeda(moedaDoPais(pais))} ${local.toLocaleString('pt-BR')}`;
}

/** Abreviado para leituras rápidas: "R$ 1,2 mi", "US$ 45 mil", "€ 980". Negativos com o sinal de menos tipográfico. */
export function formatarDinheiroCurto(valor: number, pais = corrente, casasMilhao: number | 'auto' = 1): string {
  const local = emMoedaLocal(valor, pais);
  const a = Math.abs(local);
  const s = local < 0 ? '−' : '';
  const sim = simboloDaMoeda(moedaDoPais(pais));
  // ERAS v3: o réis abrevia em contos (mil mil-réis); a libra antiga mostra xelins e pence abaixo de £100.
  const antiga = escritaAntiga(local, pais);
  if (antiga && sim === 'Rs' && a >= 1_000_000_000) return s + (a / 1_000_000_000).toFixed(1).replace('.', ',').replace(/,0$/, '') + ' mil contos';
  if (antiga && sim === 'Rs' && a >= 1_000_000) return s + (a / 1_000_000).toFixed(a >= 10_000_000 ? 0 : 1).replace('.', ',').replace(/,0$/, '') + (a >= 2_000_000 ? ' contos' : ' conto');
  if (antiga && (sim === 'Rs' || a < 100)) return s + antiga;
  // REWORK 5: acima do bilhão, 'tri' (sem '1.000,0 bi' estourando a tela do celular).
  if (a >= 1_000_000_000_000) return `${s}${sim} ${(a / 1_000_000_000_000).toFixed(1).replace('.', ',')} tri`;
  if (a >= 1_000_000_000) return `${s}${sim} ${(a / 1_000_000_000).toFixed(1).replace('.', ',')} bi`;
  if (a >= 1_000_000) return `${s}${sim} ${(a / 1_000_000).toFixed(casasMilhao === 'auto' ? (a >= 10_000_000 ? 0 : 1) : casasMilhao).replace('.', ',')} mi`;
  if (a >= 10_000) return `${s}${sim} ${Math.round(a / 1000)} mil`;
  return `${s}${sim} ${Math.round(a).toLocaleString('pt-BR')}`;
}
