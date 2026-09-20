/**
 * events/history — ocorrência, cooldown e unicidade (B4-FIX2).
 *
 * Responsabilidade única: registrar/consultar o histórico de eventos já
 * disparados nesta vida. Mantém DOIS registros por razões diferentes:
 *
 * - `historicoEventosDisparados: string[]` — só os ids, na ordem de
 *   disparo. É o formato já persistido em saves antigos (B2/B4); continua
 *   existindo para não quebrar compatibilidade e porque "já aconteceu
 *   alguma vez" (checagem de 'unica'/'marco') não precisa de mais que isso.
 * - `historicoOcorrenciasEventos: EventOccurrence[]` — id + idade + ano de
 *   cada disparo. É o que faltava: sem idade registrada, não é possível
 *   calcular "quantos anos se passaram desde a última vez", e por isso
 *   cooldown/recorrência nunca funcionaram de verdade.
 *
 * Nenhuma outra parte do código deve montar essas listas manualmente —
 * sempre pelas funções daqui, para as duas ficarem sempre coerentes entre si.
 */

import type { EventOccurrence, GameEvent } from '../../types';

export interface HistoricoEventos {
  disparados: string[];
  ocorrencias: EventOccurrence[];
}

export function criarHistoricoVazio(): HistoricoEventos {
  return { disparados: [], ocorrencias: [] };
}

/** Registra uma ocorrência real (evento sorteado neste ano) — imutável. */
export function registrarOcorrencia(
  historico: HistoricoEventos,
  evento: GameEvent,
  idade: number,
  ano: number
): HistoricoEventos {
  return {
    disparados: [...historico.disparados, evento.id],
    ocorrencias: [...historico.ocorrencias, { eventId: evento.id, idade, ano, categoria: evento.categoria }]
  };
}

/** Quantas vezes um evento já ocorreu nesta vida. */
export function contarOcorrencias(historico: HistoricoEventos, eventoId: string): number {
  return historico.ocorrencias.filter(o => o.eventId === eventoId).length;
}

/**
 * Normaliza um par de listas possivelmente desalinhado (ex.: save legado só
 * com `disparados`, sem `ocorrencias`) num `HistoricoEventos` coerente.
 * Nunca inventa idade/ano para ocorrências desconhecidas: elas ficam de
 * fora de `ocorrencias`, mas continuam em `disparados` (preserva o efeito
 * de 'unica'/'marco', que não depende de idade).
 */
export function normalizarHistorico(
  disparados: string[] | undefined,
  ocorrencias: EventOccurrence[] | undefined
): HistoricoEventos {
  return {
    disparados: Array.isArray(disparados) ? disparados.filter(d => typeof d === 'string') : [],
    ocorrencias: Array.isArray(ocorrencias)
      ? ocorrencias.filter(
          (o): o is EventOccurrence =>
            !!o &&
            typeof o === 'object' &&
            typeof (o as EventOccurrence).eventId === 'string' &&
            typeof (o as EventOccurrence).idade === 'number' &&
            typeof (o as EventOccurrence).ano === 'number'
        )
      : []
  };
}
