/**
 * Sorteio ponderado do evento do ano.
 *
 * Isolado do arquivo de condições para que a regra de "quem pode" e a de
 * "quem sai" evoluam separadamente. Recebe o pool já filtrado: não sabe
 * nada sobre idade, flags ou contexto de vida.
 */

import { GameEvent } from '../../types';
import { valorAleatorio } from '../../utils/random';
import { EventHistory } from './eventHistory';
import { pesoEfetivo } from './eventEligibility';

/**
 * Sorteia um evento proporcionalmente ao peso efetivo.
 *
 * Recebe o gerador por parâmetro para permitir playtest determinístico com
 * seed sem tocar no aleatório global.
 */
export function sortearPonderado(
  pool: readonly GameEvent[],
  historico: EventHistory,
  rng: () => number = valorAleatorio
): GameEvent | null {
  if (pool.length === 0) return null;

  const pesos = pool.map(ev => pesoEfetivo(ev, historico));
  const total = pesos.reduce((soma, p) => soma + p, 0);

  if (total <= 0) return pool[0];

  let rolagem = rng() * total;

  for (let i = 0; i < pool.length; i++) {
    if (rolagem < pesos[i]) return pool[i];
    rolagem -= pesos[i];
  }

  return pool[pool.length - 1];
}
