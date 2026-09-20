/**
 * events/selection — sorteio ponderado (B4-FIX2).
 *
 * Responsabilidade única: dado um pool de eventos já elegíveis (decidido
 * por `events/eligibility`), sortear um pelo peso relativo. Não conhece
 * idade, personagem nem histórico — isso já foi resolvido antes de chegar
 * aqui.
 */

import type { GameEvent } from '../../types';
import { rollChance, valorAleatorio } from '../../utils/random';

/** Chance de o ano ter algum evento interativo (alguns anos são mais calmos). */
export const CHANCE_EVENTO_NO_ANO = 75;

/** Sorteia um evento do pool por peso relativo. Pool vazio => null. */
export function sortearPonderado(eventosElegiveis: GameEvent[]): GameEvent | null {
  if (eventosElegiveis.length === 0) return null;

  const pesoTotal = eventosElegiveis.reduce((sum, ev) => sum + ev.peso, 0);
  let rolagem = valorAleatorio() * pesoTotal;

  for (const evento of eventosElegiveis) {
    if (rolagem < evento.peso) return evento;
    rolagem -= evento.peso;
  }

  return eventosElegiveis[0];
}

/** Decide se have um evento interativo neste ano (independente de qual). */
export function haEventoNesteAno(): boolean {
  return rollChance(CHANCE_EVENTO_NO_ANO);
}
