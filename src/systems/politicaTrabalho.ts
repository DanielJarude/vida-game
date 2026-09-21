/**
 * POLÍTICA DE TRABALHO E ESCOLARIDADE — fatos-base, sem dependências.
 *
 * Extraído de `availabilitySystem` para quebrar um ciclo de importação: a
 * elegibilidade profissional precisa da janela etária e da hierarquia de
 * escolaridade, e `availabilitySystem` precisa da elegibilidade. Como as duas
 * coisas são camadas diferentes (fato-base × decisão), o fato desceu para cá.
 *
 * Este módulo NÃO importa nada de `systems/` — é a base da pilha. Se algum dia
 * precisar importar, o ciclo voltou.
 *
 * `availabilitySystem` reexporta tudo daqui, então nenhum chamador existente
 * precisou mudar de import.
 */

import type { EducationLevel } from '../types';

export const IDADE_MINIMA_EMPREGO_ADULTO = 18;
export const IDADE_MINIMA_TRABALHO_JUVENIL = 16;
export const IDADE_MAXIMA_JOVEM_APRENDIZ = 24;

/**
 * Modalidades de trabalho juvenil explicitamente modeladas.
 * Fora desta lista, todo emprego é adulto (18+) por padrão.
 */
const MODALIDADES_JUVENIS: Record<string, { idadeMinima: number; idadeMaxima: number }> = {
  jovem_aprendiz: {
    idadeMinima: IDADE_MINIMA_TRABALHO_JUVENIL,
    idadeMaxima: IDADE_MAXIMA_JOVEM_APRENDIZ
  }
};

export function obterJanelaIdadeEmprego(jobId: string): { minima: number; maxima: number | null } {
  const juvenil = MODALIDADES_JUVENIS[jobId];
  if (juvenil) return { minima: juvenil.idadeMinima, maxima: juvenil.idadeMaxima };
  return { minima: IDADE_MINIMA_EMPREGO_ADULTO, maxima: null };
}

/** Hierarquia de escolaridade — ordem única para interface e motor. */
export const HIERARQUIA_EDUCACAO: Record<EducationLevel, number> = {
  nenhuma: 0,
  fundamental_incompleto: 1,
  fundamental_completo: 2,
  medio_incompleto: 3,
  medio_completo: 4,
  tecnico: 5,
  superior_incompleto: 6,
  superior_completo: 7,
  pos_graduacao: 8
};

export function nivelEscolaridade(nivel: EducationLevel): number {
  return HIERARQUIA_EDUCACAO[nivel] ?? 0;
}
