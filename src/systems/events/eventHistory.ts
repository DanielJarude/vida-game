/**
 * Histórico de eventos.
 *
 * Guarda **IDs estáveis**, nunca títulos ou texto: renomear um evento não
 * pode reabrir algo que já aconteceu, e traduzir um título não pode
 * duplicar registro.
 *
 * Para cada evento registramos quantas vezes aconteceu e quando foi a
 * última — é o mínimo para responder "isto já cansou?" sem guardar a vida
 * inteira em memória.
 */

import { EventHistoryEntry } from '../../types';

export type EventHistory = EventHistoryEntry[];

export function historicoVazio(): EventHistory {
  return [];
}

export function buscarRegistro(
  historico: EventHistory,
  eventoId: string
): EventHistoryEntry | undefined {
  return historico.find(e => e.eventoId === eventoId);
}

export function jaAconteceu(historico: EventHistory, eventoId: string): boolean {
  return buscarRegistro(historico, eventoId) !== undefined;
}

export function contarOcorrencias(
  historico: EventHistory,
  eventoId: string
): number {
  return buscarRegistro(historico, eventoId)?.ocorrencias ?? 0;
}

/**
 * Anos decorridos desde a última ocorrência.
 *
 * `null` quando nunca aconteceu — quem chama decide o que isso significa.
 */
export function anosDesdeUltimaOcorrencia(
  historico: EventHistory,
  eventoId: string,
  idadeAtual: number
): number | null {
  const registro = buscarRegistro(historico, eventoId);
  if (!registro) return null;
  return idadeAtual - registro.ultimaIdade;
}

/** Registra uma ocorrência, devolvendo um histórico novo (nunca muta). */
export function registrarOcorrencia(
  historico: EventHistory,
  eventoId: string,
  idade: number,
  ano: number
): EventHistory {
  const existente = buscarRegistro(historico, eventoId);

  if (!existente) {
    return [
      ...historico,
      {
        eventoId,
        ocorrencias: 1,
        primeiraIdade: idade,
        ultimaIdade: idade,
        ultimoAno: ano
      }
    ];
  }

  return historico.map(e =>
    e.eventoId === eventoId
      ? {
          ...e,
          ocorrencias: e.ocorrencias + 1,
          ultimaIdade: idade,
          ultimoAno: ano
        }
      : e
  );
}

/**
 * Lista de IDs já disparados.
 *
 * Mantida para o formato antigo de save (`historicoEventosDisparados`) e
 * para quem só precisa saber "aconteceu ou não".
 */
export function idsDisparados(historico: EventHistory): string[] {
  return historico.map(e => e.eventoId);
}

/**
 * Converte o formato antigo (lista de IDs) no estruturado.
 *
 * Saves anteriores ao B4-FIX.1 só sabiam *se* um evento aconteceu, não
 * quando. Assumimos uma ocorrência em idade desconhecida (-1), o que faz
 * qualquer cooldown já estar vencido: conservador e nunca bloqueia
 * conteúdo indevidamente numa partida em andamento.
 */
export function migrarDeListaDeIds(ids: unknown): EventHistory {
  if (!Array.isArray(ids)) return [];

  const vistos = new Set<string>();
  const historico: EventHistory = [];

  for (const id of ids) {
    if (typeof id !== 'string' || vistos.has(id)) continue;
    vistos.add(id);
    historico.push({
      eventoId: id,
      ocorrencias: 1,
      primeiraIdade: -1,
      ultimaIdade: -1,
      ultimoAno: -1
    });
  }

  return historico;
}

/** Normaliza o histórico estruturado vindo de um save. */
export function normalizarHistorico(bruto: unknown): EventHistory {
  if (!Array.isArray(bruto)) return [];

  const vistos = new Set<string>();
  const historico: EventHistory = [];

  for (const item of bruto) {
    if (!item || typeof item !== 'object') continue;
    const e = item as Record<string, unknown>;
    if (typeof e.eventoId !== 'string' || vistos.has(e.eventoId)) continue;

    const numero = (v: unknown, padrao: number) =>
      typeof v === 'number' && Number.isFinite(v) ? v : padrao;

    vistos.add(e.eventoId);
    historico.push({
      eventoId: e.eventoId,
      ocorrencias: Math.max(1, numero(e.ocorrencias, 1)),
      primeiraIdade: numero(e.primeiraIdade, -1),
      ultimaIdade: numero(e.ultimaIdade, -1),
      ultimoAno: numero(e.ultimoAno, -1)
    });
  }

  return historico;
}
