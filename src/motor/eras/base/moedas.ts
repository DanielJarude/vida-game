/**
 * ERAS HISTÓRICAS · A MOEDA DA ÉPOCA — só a apresentação; o dinheiro do motor nunca muda.
 *
 * O motor conta em UMA unidade: o real de poder de compra de hoje (o nível de preços de dez/2025 ≈ 2026; ver
 * `sistemas/economia`). Numa vida histórica, a tela e o texto mostram esse valor na moeda que circulava no mês corrente:
 *
 *     nominal = valor × IPCA[mês] × unidades da moeda da época por real-equivalente
 *
 * O IPCA (número-índice do IBGE) é o nível de preços do mês; a cadeia de conversões é a oficial. Como o saldo interno é o
 * mesmo antes e depois de cada troca de moeda, a troca não cria nem destrói dinheiro: só corta os zeros da tela — como
 * aconteceu de verdade com as contas, que foram convertidas pela paridade legal.
 *
 * FONTES (padrões monetários): Banco Central do Brasil (Resoluções e quadro dos padrões monetários); Decreto-Lei
 * 2.283/1986 (cruzado, 28/02/1986: Cz$ 1 = Cr$ 1.000); MP 32/1989 → Lei 7.730/1989 (cruzado novo, 16/01/1989:
 * NCz$ 1 = Cz$ 1.000); MP 168/1990 → Lei 8.024/1990 e Res. BACEN 1.689/1990 (cruzeiro, 16/03/1990: Cr$ 1 = NCz$ 1);
 * Lei 8.697/1993 (cruzeiro real, 01/08/1993: CR$ 1 = Cr$ 1.000); Lei 8.880/1994 e MP 542/1994 (real, 01/07/1994:
 * R$ 1 = CR$ 2.750 = 1 URV).
 *
 * APROXIMAÇÃO DOCUMENTADA: o jogo anda em meses; a troca vale a partir do mês em que a maior parte dele já era da moeda
 * nova (cruzado: março de 1986; cruzado novo: fevereiro de 1989; cruzeiro: abril de 1990; cruzeiro real: agosto de 1993;
 * real: julho de 1994). Depois de dez/2025 (fim da série), a vida histórica fala em reais de hoje, como a contemporânea.
 */

import { IPCA, IPCA_T0, SALARIO_MINIMO_BR } from './series';

export interface PadraoMonetario {
  id: 'cruzeiro70' | 'cruzado' | 'cruzado_novo' | 'cruzeiro90' | 'cruzeiro_real' | 'real';
  nome: string;
  /** Plural ("cruzados novos"). */
  plural: string;
  simbolo: string;
  /** Código ISO 4217 histórico. */
  codigo: string;
  /** Primeiro mês em que o jogo usa esta moeda (t = ano*12 + mês 0..11). */
  desde: number;
  /** A data oficial da troca, por extenso. */
  dataOficial: string;
  /** Unidades desta moeda por real-equivalente (a cadeia oficial). */
  porReal: number;
  /** Quanto da moeda anterior vale uma desta (a troca). */
  troca?: string;
}

const t = (ano: number, mes: number) => ano * 12 + mes;

export const PADROES_MONETARIOS_BR: readonly PadraoMonetario[] = [
  { id: 'cruzeiro70', nome: 'cruzeiro', plural: 'cruzeiros', simbolo: 'Cr$', codigo: 'BRB', desde: -Infinity, dataOficial: '15 de maio de 1970', porReal: 2750 * 1000 * 1 * 1000 * 1000 },
  { id: 'cruzado', nome: 'cruzado', plural: 'cruzados', simbolo: 'Cz$', codigo: 'BRC', desde: t(1986, 2), dataOficial: '28 de fevereiro de 1986', porReal: 2750 * 1000 * 1 * 1000, troca: 'Cz$ 1 = Cr$ 1.000' },
  { id: 'cruzado_novo', nome: 'cruzado novo', plural: 'cruzados novos', simbolo: 'NCz$', codigo: 'BRN', desde: t(1989, 1), dataOficial: '16 de janeiro de 1989', porReal: 2750 * 1000 * 1, troca: 'NCz$ 1 = Cz$ 1.000' },
  { id: 'cruzeiro90', nome: 'cruzeiro', plural: 'cruzeiros', simbolo: 'Cr$', codigo: 'BRE', desde: t(1990, 3), dataOficial: '16 de março de 1990', porReal: 2750 * 1000, troca: 'Cr$ 1 = NCz$ 1' },
  { id: 'cruzeiro_real', nome: 'cruzeiro real', plural: 'cruzeiros reais', simbolo: 'CR$', codigo: 'BRR', desde: t(1993, 7), dataOficial: '1º de agosto de 1993', porReal: 2750, troca: 'CR$ 1 = Cr$ 1.000' },
  { id: 'real', nome: 'real', plural: 'reais', simbolo: 'R$', codigo: 'BRL', desde: t(1994, 6), dataOficial: '1º de julho de 1994', porReal: 1, troca: 'R$ 1 = CR$ 2.750' }
];

/** O último mês da série do IPCA (dez/2025). */
export const FIM_DA_SERIE = IPCA_T0 + IPCA.length - 1;

export function padraoEm(tMes: number): PadraoMonetario {
  let p = PADROES_MONETARIOS_BR[0];
  for (const x of PADROES_MONETARIOS_BR) if (tMes >= x.desde) p = x;
  return p;
}

/** O nível de preços do mês, relativo a dez/2025 (1 depois do fim da série). */
export function nivelDePrecos(tMes: number): number {
  if (tMes >= FIM_DA_SERIE) return 1;
  return IPCA[Math.max(0, tMes - IPCA_T0)];
}

/** Unidades da moeda da época por unidade do motor (real de hoje), no mês. */
export function fatorNominal(tMes: number): number {
  return nivelDePrecos(tMes) * padraoEm(tMes).porReal;
}

/** A inflação (IPCA) de dezembro a dezembro do ano, ou undefined fora da série. */
export function ipcaDoAno(ano: number): number | undefined {
  const a = t(ano, 11), b = t(ano - 1, 11);
  if (b < IPCA_T0 || a > FIM_DA_SERIE) return undefined;
  return IPCA[a - IPCA_T0] / IPCA[b - IPCA_T0] - 1;
}

/** O salário mínimo vigente no mês, em reais-equivalentes nominais (undefined antes da série). */
export function salarioMinimoNominal(tMes: number): number | undefined {
  let v: number | undefined;
  for (const [desde, valor] of SALARIO_MINIMO_BR) if (desde <= tMes) v = valor;
  return v;
}

/** O salário mínimo vigente no mês, em unidades do motor (poder de compra de hoje). Undefined depois de 2025. */
export function salarioMinimoReal(tMes: number): number | undefined {
  if (tMes > FIM_DA_SERIE) return undefined;
  const v = salarioMinimoNominal(tMes);
  return v === undefined ? undefined : v / nivelDePrecos(tMes);
}

/* ------------------------------------------------------------ O mês corrente da vida em processamento */

let mesHistorico: number | null = null;

/** Quem entra numa vida histórica diz o mês corrente (`mundo/vida.entrarNaVida`); null = vida contemporânea. */
export const definirMesHistorico = (tMes: number | null) => { mesHistorico = tMes; };
export const mesHistoricoCorrente = () => mesHistorico;
