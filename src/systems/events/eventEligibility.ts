/**
 * Elegibilidade por repetição.
 *
 * Separado de `avaliarCondicoesEvento` (que trata idade, flags, contexto
 * de vida) porque são perguntas diferentes: aquela é "esta situação faz
 * sentido agora?"; esta é "já vimos isto recentemente demais?".
 */

import { GameEvent } from '../../types';
import {
  EventHistory,
  anosDesdeUltimaOcorrencia,
  jaAconteceu
} from './eventHistory';
import { classificarRepeticao, cooldownDoEvento } from './eventRepetition';

/** Marca de "idade desconhecida" deixada pela migração de saves antigos. */
const IDADE_DESCONHECIDA = -1;

/**
 * O evento pode voltar a acontecer nesta idade?
 *
 * UNICO respeita o histórico de sempre. COOLDOWN exige o intervalo.
 *
 * Registros migrados de save antigo não sabem *quando* o evento aconteceu
 * (`ultimaIdade: -1`). Nesse caso o cooldown é tratado como vencido em vez
 * de calculado por subtração: uma partida em andamento não pode perder
 * acesso a conteúdo só porque o save era de uma versão anterior. O
 * bloqueio de eventos únicos continua valendo normalmente.
 */
export function podeRepetirAgora(
  evento: GameEvent,
  historico: EventHistory,
  idadeAtual: number
): boolean {
  const classe = classificarRepeticao(evento);

  if (classe === 'recorrente') return true;

  if (classe === 'unico') return !jaAconteceu(historico, evento.id);

  const registro = historico.find(e => e.eventoId === evento.id);
  if (!registro) return true;
  if (registro.ultimaIdade === IDADE_DESCONHECIDA) return true;

  const anos = anosDesdeUltimaOcorrencia(historico, evento.id, idadeAtual);
  if (anos === null) return true;

  return anos >= cooldownDoEvento(evento);
}

/**
 * Peso efetivo de um evento no sorteio.
 *
 * Mesmo respeitando o cooldown, um evento que já apareceu várias vezes
 * deve ficar menos provável que um inédito — é o que faz duas vidas
 * seguidas não parecerem iguais. A redução é geométrica e tem piso, para
 * nunca zerar um evento nem esvaziar um pool pequeno.
 */
export function pesoEfetivo(
  evento: GameEvent,
  historico: EventHistory
): number {
  const registro = historico.find(e => e.eventoId === evento.id);
  if (!registro) return evento.peso;

  const fator = Math.pow(0.45, registro.ocorrencias);
  return Math.max(evento.peso * fator, evento.peso * 0.1);
}
