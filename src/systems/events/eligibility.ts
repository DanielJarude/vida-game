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
import {
  temAmigo,
  temConjuge,
  temDivida,
  temFilho,
  temImovel,
  temIrmao,
  temParceiro,
  temPet,
  temVeiculo,
  type FatiasDoMundo
} from '../contexto/contextoDaVida';
import { getLifeStage } from '../../utils/formatters';
import { eventoDisponivelPorRepeticao } from './repetitionPolicy';
import { ehConteudoDeMarco } from '../../data/calendario/marcosDeVida';

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

  // F3 — conteúdo conduzido pelo Calendário da Vida sai do sorteio.
  //
  // Sem esta linha, *A Primeira Palavra* teria dois caminhos até o jogador:
  // a janela do calendário (garantida) e o sorteio da faixa etária (sorte).
  // Duas fontes para o mesmo fato é como um marco "único" acaba narrado duas
  // vezes. O calendário é a única porta desse conteúdo; o sorteio cuida de
  // todo o resto — que continua sendo a maior parte do catálogo.
  if (ehConteudoDeMarco(evento.id)) return false;

  // B4-FIX2 — política de repetição (unica/marco/cooldown/recorrente),
  // não apenas o antigo `unico`.
  if (!eventoDisponivelPorRepeticao(evento, personagem.idade, historicoDisparados, historicoOcorrencias)) {
    return false;
  }

  return avaliarCondicoesEstruturais(
    evento.condicoes,
    personagem,
    carreira,
    educacao,
    economia,
    familia,
    personalidade
  );
}

/**
 * Avalia só o bloco `condicoes`, sem idade nem política de repetição.
 *
 * Extraído de `avaliarCondicoesEvento` na F3 porque o Calendário da Vida
 * precisa fazer exatamente esta pergunta — "a trajetória desta pessoa criou
 * a condição para este marco existir?" — sobre um `MarcoDeVida`, que não é
 * um `GameEvent` e não tem janela de sorteio nem histórico de repetição.
 *
 * A alternativa seria o calendário reimplementar a avaliação de condições, e
 * aí passariam a existir duas verdades sobre o que significa `emEscola` —
 * exatamente o tipo de duplicação que as Fases 1 e 2 evitaram centralizando
 * regra. Aqui há uma implementação só, usada pelos dois.
 */
export function avaliarCondicoesEstruturais(
  cond: GameEvent['condicoes'],
  personagem: Character,
  carreira: CareerState,
  educacao: EducationState,
  economia: EconomyState,
  familia: FamilyMember[],
  personalidade?: PersonalityState
): boolean {
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

  // F4 — as perguntas sobre o mundo passam a ter UMA interpretação canônica,
  // em `systems/contexto/contextoDaVida`. Antes, "tem parceiro?" era uma lista
  // de tipos escrita à mão aqui, outra em `availabilitySystem`, outra em
  // `relationshipSystem` e outra em `pequenaMemoria` — quatro cópias que
  // divergiriam no dia em que um tipo novo de vínculo existisse.
  const mundo: FatiasDoMundo = { personagem, familia, carreira, educacao, economia };

  if (cond.temParceiro !== undefined && cond.temParceiro !== temParceiro(mundo)) return false;
  if (cond.temFilhos !== undefined && cond.temFilhos !== temFilho(mundo)) return false;

  // Predicados de contexto introduzidos pela F4. Todos seguem a mesma forma:
  // ausente = o evento não se importa; presente = o estado tem de bater.
  if (cond.temPet !== undefined && cond.temPet !== temPet(mundo)) return false;
  if (cond.temConjuge !== undefined && cond.temConjuge !== temConjuge(mundo)) return false;
  if (cond.temIrmaos !== undefined && cond.temIrmaos !== temIrmao(mundo)) return false;
  if (cond.temAmigos !== undefined && cond.temAmigos !== temAmigo(mundo)) return false;
  if (cond.temImovel !== undefined && cond.temImovel !== temImovel(mundo)) return false;
  if (cond.temVeiculo !== undefined && cond.temVeiculo !== temVeiculo(mundo)) return false;
  if (cond.temDivida !== undefined && cond.temDivida !== temDivida(mundo)) return false;

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
