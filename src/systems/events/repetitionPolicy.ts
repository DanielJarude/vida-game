/**
 * B4-FIX2 — política de repetição de eventos (domínio `events/eligibility`
 * na nomenclatura das skills; aqui isolado por ser uma regra própria e
 * testável isoladamente).
 *
 * O playtest humano confirmou eventos reaparecendo sem controle (mesmo
 * evento, mesma consequência, em anos próximos — "Tarde na Casa dos Avós"
 * foi só o exemplo mais visível). A causa raiz, confirmada por simulação:
 * a única proteção existente era `unico?: boolean`; qualquer evento sem
 * essa marca podia ser sorteado de novo no ano seguinte, sem intervalo
 * mínimo algum.
 *
 * Este módulo é puro (sem React, sem import de dados de evento) e decide,
 * a partir da política + histórico de ocorrências, se um evento pode ser
 * sorteado numa idade dada. `eventSystem`/`events/selection` consultam-no;
 * nenhum outro lugar deve reimplementar essa conta.
 */

import type { EventOccurrence, GameEvent, PoliticaRepeticao, RepeticaoEvento } from '../../types';

/**
 * Intervalo mínimo padrão (em anos de idade do jogador) para um evento
 * RECORRENTE sem cooldown explícito. Não elimina a repetição — ela é o
 * comportamento esperado de um evento recorrente — mas impede a sensação
 * de bug de "mesma coisa de novo ano que vem".
 */
export const COOLDOWN_PADRAO_RECORRENTE = 2;

/** Intervalo mínimo padrão para um evento explicitamente marcado como cooldown. */
export const COOLDOWN_PADRAO_EXPLICITO = 3;

/**
 * Normaliza a política de repetição de um evento. Compatibilidade: eventos
 * antigos só têm `unico?: boolean`; sem `repeticao` explícita e sem
 * `unico`, o padrão é RECORRENTE com o cooldown sistêmico — nunca "sem
 * controle nenhum".
 */
export function resolverPoliticaRepeticao(evento: GameEvent): RepeticaoEvento {
  if (evento.repeticao) return evento.repeticao;
  if (evento.unico) return { tipo: 'unica' };
  return { tipo: 'recorrente', cooldownAnos: COOLDOWN_PADRAO_RECORRENTE };
}

function cooldownEfetivo(politica: RepeticaoEvento): number {
  if (politica.cooldownAnos !== undefined) return politica.cooldownAnos;
  return politica.tipo === 'cooldown' ? COOLDOWN_PADRAO_EXPLICITO : COOLDOWN_PADRAO_RECORRENTE;
}

/** Última ocorrência conhecida de um evento (a mais recente por idade). */
export function obterUltimaOcorrencia(
  historicoOcorrencias: EventOccurrence[],
  eventoId: string
): EventOccurrence | undefined {
  let ultima: EventOccurrence | undefined;
  for (const oc of historicoOcorrencias) {
    if (oc.eventId !== eventoId) continue;
    if (!ultima || oc.idade > ultima.idade) ultima = oc;
  }
  return ultima;
}

/**
 * Um evento pode ser sorteado nesta idade, segundo sua política de
 * repetição e o histórico real de ocorrências?
 *
 * - unica / marco: nunca mais, uma vez disparado (verificado por id no
 *   histórico simples — suficiente e já persistido em saves antigos).
 * - cooldown / recorrente: precisa ter passado o intervalo mínimo de
 *   idade desde a última ocorrência. Sem ocorrência anterior, está livre.
 */
export function eventoDisponivelPorRepeticao(
  evento: GameEvent,
  idadeAtual: number,
  historicoDisparados: string[],
  historicoOcorrencias: EventOccurrence[] = []
): boolean {
  const politica = resolverPoliticaRepeticao(evento);

  if (politica.tipo === 'unica' || politica.tipo === 'marco') {
    return !historicoDisparados.includes(evento.id);
  }

  // cooldown / recorrente
  const ultima = obterUltimaOcorrencia(historicoOcorrencias, evento.id);
  if (!ultima) return true;

  const intervalo = idadeAtual - ultima.idade;
  return intervalo >= cooldownEfetivo(politica);
}

/** Rótulo qualitativo da política (uso interno/depuração — nunca exibido ao jogador). */
export function rotularPolitica(tipo: PoliticaRepeticao): string {
  switch (tipo) {
    case 'unica': return 'Única (uma vez na vida)';
    case 'marco': return 'Marco (ligado a uma transição)';
    case 'cooldown': return 'Cooldown (intervalo mínimo)';
    case 'recorrente': return 'Recorrente (com intervalo sistêmico)';
  }
}
