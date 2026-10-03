/**
 * Renda: do bruto ao que cai na conta.
 *
 * Valores em reais constantes (sem inflação): um salário de R$ 3.000 hoje
 * vale o mesmo daqui a quarenta anos de jogo. Isso mantém os números legíveis
 * e faz a mobilidade vir de trajetória, não de correção monetária.
 */

import type { Contrato, Emprego } from '../tipos';
import { economiaLocal, paisDaCidade } from '../dados/lugares';
import type { Ocupacao } from '../dados/ocupacoes';
import { PAIS_PADRAO, perfilDoPais, temPerfil } from '../mundo/registro';
import { parametrosFiscais, salarioMinimoDoPais } from '../mundo/economia';

/*
 * MUNDO: os números legais (o mínimo, a previdência, o imposto, o 13º) são
 * do país onde se trabalha — o perfil dele (`mundo/paises`). As constantes
 * abaixo são as do Brasil, que o jogo usa onde a regra é brasileira (o
 * ProUni, o FIES, o BPC) ou quando não há país em jogo.
 */
export const SALARIO_MINIMO = 1620;
export const TETO_INSS = 8160;
/** Contribuinte facultativo (plano simplificado): 11% do salário mínimo. */
export const CUSTO_FACULTATIVO = Math.round(SALARIO_MINIMO * 0.11);

/**
 * Contribuição à previdência (no Brasil, o INSS: aproximação da tabela
 * progressiva). A alíquota efetiva cresce da mínima à máxima até o teto; sem
 * teto, a escala é o teto brasileiro levado à renda do país.
 */
export function inss(bruto: number, pais = PAIS_PADRAO): number {
  const f = parametrosFiscais(pais);
  const teto = Number.isFinite(f.teto) ? f.teto : TETO_INSS * 4;
  const base = Math.min(bruto, teto);
  const [min, max] = f.aliquota;
  const efetiva = min + (max - min) * Math.min(1, base / teto);
  return Math.round(base * efetiva);
}

/** Imposto de renda mensal, simplificado: a faixa isenta do país e uma alíquota sobre o que passa (no Brasil, isenção até R$ 5.000, regra de 2026). */
export function irpf(baseCalculo: number, pais = PAIS_PADRAO): number {
  const f = parametrosFiscais(pais);
  if (baseCalculo <= f.isencao) return 0;
  const faixa = Math.max(0, baseCalculo - f.isencao);
  return Math.round(faixa * f.marginal);
}

/** Renda líquida mensal de um salário bruto conforme o tipo de vínculo (e o país onde se trabalha). */
export function liquido(bruto: number, contrato: Contrato, pais = PAIS_PADRAO): number {
  if (contrato === 'informal') return bruto;
  if (contrato === 'autonomo') return Math.round(bruto * 0.93); // MEI/carnê simplificado; lá fora, o regime simples de quem trabalha por conta
  if (contrato === 'estagio') return bruto; // bolsa de estágio não tem desconto
  const i = inss(bruto, pais);
  return bruto - i - irpf(bruto - i, pais);
}

/** Contrato gera tempo de contribuição ao INSS? */
export const contribui = (c: Contrato) => c === 'clt' || c === 'servidor' || c === 'aprendiz' || c === 'autonomo' || c === 'eletivo';

/** Salário bruto de uma ocupação num município (com uma pequena variação individual). */
export function salarioLocal(oc: Ocupacao, municipioId: string, variacao = 1): number {
  const local = economiaLocal(municipioId).salario;
  // Salário mínimo (do país) é piso para contrato formal de jornada integral.
  const bruto = oc.salario * local * variacao;
  const piso = oc.contrato === 'clt' && oc.carga === 'integral' ? salarioMinimoDoPais(paisDaCidade(municipioId)) : 0;
  return Math.round(Math.max(piso, bruto) / 10) * 10;
}

/** 13º e férias (no Brasil, ~13,33 salários por ano para CLT e servidor; 14 em Portugal; 12 onde não há). */
export const mesesPagos = (c: Contrato, pais = PAIS_PADRAO) =>
  (c === 'clt' || c === 'servidor' || c === 'eletivo' ? perfilDoPais(temPerfil(pais) ? pais : PAIS_PADRAO).trabalho.mesesPagos : 12);

/**
 * A remuneração de um emprego: FONTE ÚNICA dos três números que as telas
 * mostram — o bruto do contrato, o líquido que cai no mês e a média mensal
 * do ano (com 13º e férias, para quem tem). Cada tela diz qual está usando.
 */
export interface Remuneracao { bruto: number; liquido: number; mediaMensal: number; tem13: boolean }
export function remuneracaoDe(e: Emprego): Remuneracao {
  const pais = paisDaCidade(e.municipioId);
  const liq = liquido(e.salario, e.contrato, pais);
  const meses = mesesPagos(e.contrato, pais);
  return { bruto: e.salario, liquido: liq, mediaMensal: Math.round(liq * meses / 12), tem13: meses > 12 };
}
