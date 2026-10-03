/**
 * Quanto o estudo custa a QUEM ESTUDA — a fonte única (REWORK 4).
 *
 * O playtest achou "A mensalidade de Ciência da Computação vence todo dia 10"
 * numa universidade pública sem cobrança imediata. A frase não era o erro: o
 * erro era o evento ler `mensalidade > 0` e o saldo do mês, sem saber o regime
 * da matrícula. Agora a cadeia é uma só:
 *
 *   matrícula → instituição (rede) → regime de custo → parte do estudante
 *   → o que pode acontecer (a cobrança, o aperto, o extrato, a tela).
 *
 * Regimes:
 *   - gratuita: a pública que não cobra (Brasil, Argentina, Alemanha...). Ainda
 *     custa transporte, comida e material — mas nunca uma mensalidade;
 *   - credito: o crédito público paga agora e vira dívida depois (FIES; e a
 *     pública dos países onde a contribuição é diferida por lei: o HECS-HELP
 *     australiano, o Student Finance inglês, o Student Loan neozelandês);
 *   - bolsa_integral: a bolsa cobre tudo (ProUni);
 *   - paga: a mensalidade de verdade, menos o que a família põe.
 */

import type { Matricula, Vida } from '../tipos';
import { familiaPagaEstudo } from './origem';

export type RegimeDoEstudo = 'gratuita' | 'paga' | 'credito' | 'bolsa_integral';

export interface CustoDoEstudo {
  regime: RegimeDoEstudo;
  /** A mensalidade nominal da instituição (o que a tabela diz). */
  mensalidade: number;
  /** O que a família põe por mês. */
  daFamilia: number;
  /** O que sai do bolso de quem estuda, por mês. */
  doEstudante: number;
}

export function regimeDaMatricula(m: Matricula): RegimeDoEstudo {
  if (m.financiamento === 'prouni') return 'bolsa_integral';
  if (m.financiamento === 'fies') return 'credito';
  return m.mensalidade > 0 ? 'paga' : 'gratuita';
}

/** O custo do estudo de agora (nada, se não há matrícula ativa). */
export function custoDoEstudo(v: Vida, m: Matricula | undefined = v.educacao.matricula): CustoDoEstudo | null {
  if (!m || m.trancado) return null;
  const regime = regimeDaMatricula(m);
  if (regime !== 'paga') return { regime, mensalidade: m.mensalidade, daFamilia: 0, doEstudante: 0 };
  const daFamilia = Math.min(m.mensalidade, familiaPagaEstudo(v));
  return { regime, mensalidade: m.mensalidade, daFamilia, doEstudante: m.mensalidade - daFamilia };
}
