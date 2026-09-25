/**
 * Renda: do bruto ao que cai na conta.
 *
 * Valores em reais constantes (sem inflação): um salário de R$ 3.000 hoje
 * vale o mesmo daqui a quarenta anos de jogo. Isso mantém os números legíveis
 * e faz a mobilidade vir de trajetória, não de correção monetária.
 */

import type { Contrato } from '../tipos';
import { economiaLocal } from '../dados/lugares';
import type { Ocupacao } from '../dados/ocupacoes';

export const SALARIO_MINIMO = 1620;
export const TETO_INSS = 8160;
/** Contribuinte facultativo (plano simplificado): 11% do salário mínimo. */
export const CUSTO_FACULTATIVO = Math.round(SALARIO_MINIMO * 0.11);

/** Contribuição ao INSS (aproximação da tabela progressiva). */
export function inss(bruto: number): number {
  const base = Math.min(bruto, TETO_INSS);
  // Alíquota efetiva cresce de ~7,5% a ~11,7% no teto.
  const efetiva = 0.075 + 0.042 * Math.min(1, base / TETO_INSS);
  return Math.round(base * efetiva);
}

/** Imposto de renda mensal (isenção até R$ 5.000, regra de 2026, simplificada). */
export function irpf(baseCalculo: number): number {
  if (baseCalculo <= 5000) return 0;
  const faixa = Math.max(0, baseCalculo - 5000);
  return Math.round(faixa * 0.24);
}

/** Renda líquida mensal de um salário bruto conforme o tipo de vínculo. */
export function liquido(bruto: number, contrato: Contrato): number {
  if (contrato === 'informal') return bruto;
  if (contrato === 'autonomo') return Math.round(bruto * 0.93); // MEI/carnê simplificado
  if (contrato === 'estagio') return bruto; // bolsa de estágio não tem desconto
  const i = inss(bruto);
  return bruto - i - irpf(bruto - i);
}

/** Contrato gera tempo de contribuição ao INSS? */
export const contribui = (c: Contrato) => c === 'clt' || c === 'servidor' || c === 'aprendiz' || c === 'autonomo' || c === 'eletivo';

/** Salário bruto de uma ocupação num município (com uma pequena variação individual). */
export function salarioLocal(oc: Ocupacao, municipioId: string, variacao = 1): number {
  const local = economiaLocal(municipioId).salario;
  // Salário mínimo é piso para contrato formal de jornada integral.
  const bruto = oc.salario * local * variacao;
  const piso = oc.contrato === 'clt' && oc.carga === 'integral' ? SALARIO_MINIMO : 0;
  return Math.round(Math.max(piso, bruto) / 10) * 10;
}

/** 13º e férias: CLT e servidor recebem ~13,33 salários por ano. */
export const mesesPagos = (c: Contrato) => (c === 'clt' || c === 'servidor' || c === 'eletivo' ? 13.33 : 12);
