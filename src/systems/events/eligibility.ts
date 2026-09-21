/**
 * events/eligibility — quem pode receber um evento (B4-FIX2).
 *
 * Extraído de `eventSystem.ts` para isolar a responsabilidade "este evento
 * pode acontecer agora?" da responsabilidade de sorteio e da de aplicar
 * consequências. A checagem de repetição usa `repetitionPolicy` (histórico
 * rico com idade/ano) em vez de só `unico` — essa é a correção do bug
 * relatado no playtest.
 */

import {
  Character,
  CareerState,
  EducationState,
  EconomyState,
  EventOccurrence,
  FamilyMember,
  GameEvent,
  PersonalityState
} from '../../types';
import { atendeCondicoesComportamentais } from '../personalitySystem';
import { getLifeStage } from '../../utils/formatters';
import { eventoDisponivelPorRepeticao } from './repetitionPolicy';

export function avaliarCondicoesEvento(
  evento: GameEvent,
  personagem: Character,
  carreira: CareerState,
  educacao: EducationState,
  economia: EconomyState,
  familia: FamilyMember[],
  historicoDisparados: string[],
  personalidade?: PersonalityState,
  historicoOcorrencias: EventOccurrence[] = []
): boolean {
  // Idade
  if (personagem.idade < evento.idadeMinima || personagem.idade > evento.idadeMaxima) {
    return false;
  }

  // B4-FIX2 — política de repetição (unica/marco/cooldown/recorrente),
  // não apenas o antigo `unico`.
  if (!eventoDisponivelPorRepeticao(evento, personagem.idade, historicoDisparados, historicoOcorrencias)) {
    return false;
  }

  const cond = evento.condicoes;
  if (!cond) return true;

  if (cond.genero && cond.genero !== personagem.genero) return false;

  if (cond.faseVida) {
    const faseAtual = getLifeStage(personagem.idade);
    if (faseAtual !== cond.faseVida) return false;
  }

  if (cond.empregado !== undefined && cond.empregado !== carreira.empregado) return false;
  if (cond.emEscola !== undefined && cond.emEscola !== educacao.emCurso) return false;
  if (cond.emFaculdade !== undefined) {
    const isFaculdade = educacao.emCurso && (educacao.tipoCurso === 'superior' || educacao.tipoCurso === 'pos');
    if (cond.emFaculdade !== isFaculdade) return false;
  }

  if (cond.temParceiro !== undefined) {
    const temParc = familia.some(
      f => f.vivo && ['namorado', 'namorada', 'noivo', 'noiva', 'esposo', 'esposa'].includes(f.tipo)
    );
    if (cond.temParceiro !== temParc) return false;
  }

  if (cond.temFilhos !== undefined) {
    const temFil = familia.some(f => f.vivo && (f.tipo === 'filho' || f.tipo === 'filha'));
    if (cond.temFilhos !== temFil) return false;
  }

  if (cond.dinheiroMinimo !== undefined && economia.dinheiro < cond.dinheiroMinimo) return false;
  if (cond.dinheiroMaximo !== undefined && economia.dinheiro > cond.dinheiroMaximo) return false;

  if (cond.saudeMinima !== undefined && personagem.stats.saude < cond.saudeMinima) return false;
  if (cond.saudeMaxima !== undefined && personagem.stats.saude > cond.saudeMaxima) return false;

  if (cond.flagsNecessarias) {
    for (const flag of cond.flagsNecessarias) {
      if (!personagem.flags[flag]) return false;
    }
  }

  if (cond.flagsProibidas) {
    for (const flag of cond.flagsProibidas) {
      if (personagem.flags[flag]) return false;
    }
  }

  // B2 — condições sobre personalidade/memória (recusa segura sem estado informado)
  if (cond.personalidade && cond.personalidade.length > 0) {
    if (!personalidade) return false;
    if (!atendeCondicoesComportamentais(personalidade, cond.personalidade)) return false;
  }

  return true;
}
