/**
 * As economias de quem não é o protagonista (sucessão). Módulo leve, sem
 * dependências de cima: os descendentes guardam um pouco todo ano
 * (`filhos.guardar`), e a sucessão lê o mesmo número (`sucessao`).
 */

import type { Pessoa, Vida } from '../tipos';
import { idadeEm } from '../tempo';

/** Quanto alguém guarda do que ganha por mês (líquido), pela faixa de renda. */
export function taxaDePoupanca(renda: number): number {
  return renda < 2500 ? 0.02 : renda < 6000 ? 0.05 : renda < 15000 ? 0.09 : renda < 40000 ? 0.13 : 0.16;
}

/**
 * Para saves anteriores ao acompanhamento das posses: as economias que a
 * trajetória registrada permite estimar (meses de trabalho × renda × o quanto
 * se guarda nessa faixa). Determinística; nada além do que a ficha sabe.
 */
export function economiasEstimadas(v: Vida, p: Pessoa): number {
  if (p.posses) return p.posses.dinheiro;
  const i = idadeEm(p.tNasc, v.t);
  if (i < 18 || p.renda <= 0) return 0;
  const meses = Math.min(p.vida?.experiencia ?? 0, (i - 18) * 12);
  return Math.round(p.renda * taxaDePoupanca(p.renda) * meses / 100) * 100;
}
