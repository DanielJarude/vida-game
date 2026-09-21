/**
 * PROCESSO SELETIVO — o passo entre "pode tentar" e "conseguiu".
 *
 * ────────────────────────────────────────────────────────────────────────────
 * POR QUE ESTE MÓDULO EXISTE AGORA, SE OS DESAFIOS DE VIDA SÃO FUTUROS
 *
 * Porque a alternativa é pior. Se a elegibilidade continuasse embutida dentro
 * de `candidatarEmprego`, acrescentar uma entrevista depois exigiria abrir e
 * reescrever a função que decide contratação — exatamente o tipo de cirurgia
 * que se quer evitar.
 *
 * Este módulo estabelece o CONTRATO do passo "como você se saiu", hoje
 * resolvido por uma rolagem, amanhã por uma entrevista jogável, sem que
 * nenhum chamador precise mudar:
 *
 *     REQUISITOS → ELEGIBILIDADE → CANDIDATURA → [PROCESSO SELETIVO] →
 *     RESULTADO → CONSEQUÊNCIA
 *
 * O que ele NÃO faz nesta fase: perguntas, banco de questões, interface,
 * minigame. Nada disso é escopo aqui. O que ele faz é garantir que, quando
 * isso chegar, o ponto de encaixe já exista e já esteja protegido.
 * ────────────────────────────────────────────────────────────────────────────
 *
 * GARANTIA DE COERÊNCIA: este módulo nunca é chamado para um candidato não
 * elegível. `candidatarEmprego` avalia a elegibilidade primeiro e só então
 * chega aqui. Nenhum desempenho, atributo ou sorte pode driblar um requisito
 * legal, educacional ou lógico — a ordem das camadas é a garantia.
 */

import type { Character, Job } from '../../types';
import { rollChance } from '../../utils/random';
import type { Veredito } from '../plausibility/types';

/** Chance-base de uma candidatura elegível dar certo. */
const CHANCE_BASE = 45;

/**
 * Como o processo seletivo foi resolvido.
 *
 * Hoje só existe `'rolagem'`. Quando os Desafios de Vida chegarem, entram
 * aqui `'entrevista'`, `'prova_concurso'`, `'exame_oab'` — e o tipo passa a
 * dizer ao resto do jogo (Linha da Vida, resumo anual) como narrar o
 * resultado.
 */
export type FormaDeSelecao = 'rolagem';

export interface ResultadoProcessoSeletivo {
  aprovado: boolean;
  forma: FormaDeSelecao;
  /** Chance efetiva aplicada (0-100). Exposta para teste e depuração. */
  chanceAplicada: number;
}

export interface ContextoProcessoSeletivo {
  job: Job;
  personagem: Character;
  /**
   * Veredito de elegibilidade já calculado. Entra aqui porque o grau
   * `improvavel` precisa PESAR no resultado — é assim que "possível, porém
   * improvável" se distingue de "possível e esperado" sem virar um bloqueio.
   */
  veredito: Veredito;
  /** Anos de experiência já acumulados (calculado uma vez pelo chamador). */
  anosDeExperiencia: number;
}

/**
 * Chance final de aprovação, em pontos percentuais (0-100).
 *
 * Função PURA e exportada de propósito: dá para testar a curva de
 * balanceamento sem sortear nada.
 */
export function calcularChanceDeAprovacao(ctx: ContextoProcessoSeletivo): number {
  const { job, personagem, veredito, anosDeExperiencia } = ctx;

  let chance = CHANCE_BASE;

  if (personagem.stats.inteligencia >= job.inteligenciaMinima) chance += 20;
  if (personagem.hiddenStats.reputacao >= 60) chance += 10;
  if (personagem.stats.aparencia >= 60) chance += 5;

  // Experiência acima do exigido é um diferencial real no mercado — e agora
  // que a experiência é conferida, ela também precisa recompensar.
  const exigida = job.experienciaNecessaria ?? 0;
  const excedente = anosDeExperiencia - exigida;
  if (excedente > 0) chance += Math.min(20, excedente * 4);

  // O improvável continua possível, mas paga por isso.
  chance *= veredito.modificadorDeChance;

  return Math.max(2, Math.min(95, Math.round(chance)));
}

/**
 * Resolve a tentativa.
 *
 * Hoje: uma rolagem ponderada. Amanhã: despacha para o Desafio de Vida
 * correspondente ao cargo. A assinatura não muda.
 */
export function resolverProcessoSeletivo(
  ctx: ContextoProcessoSeletivo
): ResultadoProcessoSeletivo {
  const chanceAplicada = calcularChanceDeAprovacao(ctx);
  return {
    aprovado: rollChance(chanceAplicada),
    forma: 'rolagem',
    chanceAplicada
  };
}
