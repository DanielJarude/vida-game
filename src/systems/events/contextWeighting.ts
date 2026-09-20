/**
 * events/contextWeighting — variedade contextual e anti-dominação de pool
 * (B4-FIX3 item 4/16/17).
 *
 * Responsabilidade única: dado o pool já elegível (eligibility já decidiu
 * "quem pode") e o histórico recente de ocorrências, ajustar o PESO de
 * cada evento antes do sorteio (`selection.sortearPonderado` continua
 * cuidando só da rolagem em si).
 *
 * Problema real do playtest: mesmo com cooldown técnico funcionando, vidas
 * diferentes começavam quase sempre com a mesma sequência ("Primeiros
 * Passos" → "Tarde na Casa dos Avós" → "Macarronada de Domingo"), porque o
 * peso fixo desses eventos era alto e o pool de eventos infantis fora da
 * família ainda era pequeno. A correção "estrutural" (mais conteúdo, ver
 * `childhoodEvents`/`toddlerEvents`) já ajuda; este módulo reduz a
 * repetição PERCEBIDA em cima disso, sem quota rígida:
 *
 * 1. Penaliza (não elimina) eventos cuja CATEGORIA dominou o histórico
 *    recente — se as últimas ocorrências foram todas de "família", um
 *    evento elegível de outra categoria ganha peso extra.
 * 2. Penaliza um evento recorrente que já apareceu muitas vezes na vida
 *    (mesmo respeitando cooldown) — evita que um pequeno conjunto de
 *    eventos recorrentes consuma grande parte da infância.
 *
 * Nada aqui é determinístico: é ponderação, não corte. Um evento nunca
 * fica com peso zero por causa deste módulo (isso já é decidido antes,
 * pela elegibilidade/repetição).
 */

import type { EventOccurrence, GameEvent } from '../../types';

/** Quantas ocorrências recentes entram na leitura de "contexto recente". */
const JANELA_HISTORICO_RECENTE = 4;

/** Penalidade multiplicativa por ocorrência prévia do MESMO evento na vida. */
const FATOR_PENALIDADE_POR_OCORRENCIA_PREVIA = 0.6;

/** Piso de peso relativo — nunca deixa o evento praticamente impossível. */
const PISO_FATOR_PENALIDADE = 0.25;

/** Bônus por categoria quando ela NÃO apareceu nas ocorrências recentes. */
const BONUS_CATEGORIA_AUSENTE = 1.6;

/** Penalidade quando a categoria dominou (>= metade) o histórico recente. */
const PENALIDADE_CATEGORIA_DOMINANTE = 0.55;

export interface EventoPonderado {
  evento: GameEvent;
  pesoEfetivo: number;
}

/**
 * Recalcula o peso efetivo de cada evento elegível considerando:
 * - quantas vezes ELE MESMO já ocorreu nesta vida (anti-dominação de pool);
 * - se a CATEGORIA dele dominou ou está ausente do histórico recente.
 */
export function ponderarPorContexto(
  eventosElegiveis: GameEvent[],
  historicoOcorrencias: EventOccurrence[]
): EventoPonderado[] {
  const recentes = historicoOcorrencias.slice(-JANELA_HISTORICO_RECENTE);

  const contagemPorCategoria = new Map<string, number>();
  for (const oc of recentes) {
    if (!oc.categoria) continue;
    contagemPorCategoria.set(oc.categoria, (contagemPorCategoria.get(oc.categoria) ?? 0) + 1);
  }

  const contagemPorEvento = new Map<string, number>();
  for (const oc of historicoOcorrencias) {
    contagemPorEvento.set(oc.eventId, (contagemPorEvento.get(oc.eventId) ?? 0) + 1);
  }

  return eventosElegiveis.map(evento => {
    let fator = 1;

    // Anti-dominação de pool: cada ocorrência prévia do MESMO evento nesta
    // vida reduz seu peso relativo (geométrico, com piso).
    const vezesQueJaOcorreu = contagemPorEvento.get(evento.id) ?? 0;
    if (vezesQueJaOcorreu > 0) {
      fator *= Math.max(
        PISO_FATOR_PENALIDADE,
        Math.pow(FATOR_PENALIDADE_POR_OCORRENCIA_PREVIA, vezesQueJaOcorreu)
      );
    }

    // Variedade contextual: se a categoria deste evento não apareceu nas
    // últimas ocorrências, ele ganha um empurrão; se ela dominou (mais da
    // metade da janela recente), ele é penalizado.
    if (recentes.length > 0) {
      const vezesNaCategoria = contagemPorCategoria.get(evento.categoria) ?? 0;
      if (vezesNaCategoria === 0) {
        fator *= BONUS_CATEGORIA_AUSENTE;
      } else if (vezesNaCategoria >= Math.ceil(recentes.length / 2)) {
        fator *= PENALIDADE_CATEGORIA_DOMINANTE;
      }
    }

    return { evento, pesoEfetivo: Math.max(0.01, evento.peso * fator) };
  });
}
