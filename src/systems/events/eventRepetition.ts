/**
 * Política de repetição de eventos.
 *
 * O problema que este módulo resolve (playtest do B4-FIX): "Tarde na Casa
 * dos Avós" apareceu três vezes em poucos anos. Não foi azar. O seletor só
 * conhecia `unico`; qualquer evento não-único podia voltar no ano seguinte,
 * e o pool elegível na infância era minúsculo — aos 5 anos havia 4 eventos
 * possíveis, e esse tinha peso 80 de um total de 310, ou seja 25,8% ao ano.
 *
 * Três classes, e nada mais:
 *
 * - UNICO      — uma vez na vida (primeira palavra, formatura).
 * - COOLDOWN   — pode voltar, mas só depois de N anos.
 * - RECORRENTE — faz parte da rotina e pode repetir livremente.
 *
 * A classificação é derivada do próprio evento, então os 66 eventos que já
 * existiam continuam válidos sem edição: `unico: true` vira UNICO, e o
 * resto recebe um cooldown padrão em vez do "pode sempre" de antes.
 */

import { GameEvent } from '../../types';

export type ClasseRepeticao = 'unico' | 'cooldown' | 'recorrente';

/**
 * Cooldown padrão para eventos que não declaram nada.
 *
 * Escolhido alto de propósito: com pool pequeno na infância, um cooldown
 * curto não resolveria a sensação de repetição. Eventos que realmente
 * fazem parte da rotina anual devem se declarar `recorrente`
 * explicitamente.
 */
export const COOLDOWN_PADRAO_ANOS = 6;

export function classificarRepeticao(evento: GameEvent): ClasseRepeticao {
  if (evento.unico) return 'unico';
  if (evento.repeticao) return evento.repeticao.modo;
  return 'cooldown';
}

export function cooldownDoEvento(evento: GameEvent): number {
  if (classificarRepeticao(evento) !== 'cooldown') return 0;
  return evento.repeticao?.anosCooldown ?? COOLDOWN_PADRAO_ANOS;
}
