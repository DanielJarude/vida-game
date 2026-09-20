import {
  CareerState,
  Character,
  EconomyState,
  EducationState,
  FamilyMember,
  GameEvent,
  LifeLogEntry,
  PersonalityState,
  PostMortemSummary
} from '../types';
import { aplicarEnvelhecimentoAtributos } from './attributeSystem';
import { processarAnoCarreira } from './careerSystem';
import { verificarMortalidade, construirResumoMorte } from './deathSystem';
import { calcularPatrimonioLiquido, processarAnoEconomia } from './economySystem';
import { processarAnoEducacao } from './educationSystem';
import { sortearEventoDoAno } from './eventSystem';
import { EventHistory } from './events/eventHistory';
import { processarEnvelhecimentoFamilia } from './familySystem';
import { gerarTextoAnoTranquilo } from '../utils/narrativeGenerator';
import { generateId } from '../utils/random';

export interface AgingResult {
  personagemAtualizado: Character;
  familiaAtualizada: FamilyMember[];
  educacaoAtualizada: EducationState;
  carreiraAtualizada: CareerState;
  economiaAtualizada: EconomyState;
  novosLogs: LifeLogEntry[];
  eventoDisparado: GameEvent | null;
  morreu: boolean;
  resumoMorte?: PostMortemSummary;
}

/**
 * Ordem explícita do avanço anual:
 * 1. Idade/ano incrementados uma única vez (charBase).
 * 2. Envelhecimento de atributos.
 * 3. Educação (inclui resolução da postura escolar do ano).
 * 4. Carreira (horas extras e bico do ano são resolvidos aqui, uma única vez).
 * 5. Família.
 * 6. Economia (salários, despesas, rendimentos sobre o estado já atualizado).
 * 7. Mortalidade.
 * 8. Sorteio de evento interativo.
 * O rastreador de ações únicas do ano (acoesRealizadasAno) é zerado pela
 * camada de comandos ao consumir este resultado.
 */
export function executarPassagemDeAno(
  personagem: Character,
  familia: FamilyMember[],
  educacao: EducationState,
  carreira: CareerState,
  economia: EconomyState,
  historicoEventos: EventHistory,
  personalidade?: PersonalityState
): AgingResult {
  const novaIdade = personagem.idade + 1;
  const novoAno = personagem.anoAtual + 1;
  const novosLogs: LifeLogEntry[] = [];

  // 1–2. Atualização de idade e envelhecimento de atributos
  const charBase: Character = {
    ...personagem,
    idade: novaIdade,
    anoAtual: novoAno
  };
  const { stats, hiddenStats } = aplicarEnvelhecimentoAtributos(charBase);
  let char: Character = {
    ...charBase,
    stats,
    hiddenStats
  };

  // 3. Processamento da Educação
  const resEdu = processarAnoEducacao(educacao, char, novoAno);
  let edu = resEdu.educacaoAtualizada;
  char = resEdu.personagemAtualizado;
  novosLogs.push(...resEdu.logsEducacao);

  // 4. Processamento da Carreira (inclui pagamento do bico e horas extras)
  const resCar = processarAnoCarreira(carreira, char, novoAno, edu, economia);
  let car = resCar.carreiraAtualizada;
  char = resCar.personagemAtualizado;
  let eco = resCar.economiaAtualizada;
  novosLogs.push(...resCar.logsCarreira);

  // 5. Processamento da Família
  const resFam = processarEnvelhecimentoFamilia(familia, char, novoAno);
  const fam = resFam.familiaAtualizada;
  novosLogs.push(...resFam.logsFamilia);

  // 6. Processamento da Economia
  const resEco = processarAnoEconomia(
    eco,
    char,
    fam,
    resCar.salarioTotalAnual,
    resEdu.mensalidadeAnual,
    novoAno
  );
  eco = resEco.economiaAtualizada;
  novosLogs.push(...resEco.logsEconomia);

  // Se recebeu herança familiar
  if (resFam.herancaDinheiro > 0) {
    eco.dinheiro += resFam.herancaDinheiro;
  }

  // 6. Verificação de Mortalidade
  const checkMorte = verificarMortalidade(char);
  if (checkMorte.morreu) {
    const patFinal = calcularPatrimonioLiquido(eco);
    const resumoMorte = construirResumoMorte(char, fam, car, edu, patFinal, checkMorte.causaMorte);

    novosLogs.push({
      id: generateId('log'),
      idade: novaIdade,
      ano: novoAno,
      categoria: 'morte',
      texto: `Você faleceu aos ${novaIdade} anos devido a ${checkMorte.causaMorte.toLowerCase()}.`,
      tipo: 'negativo'
    });

    return {
      personagemAtualizado: char,
      familiaAtualizada: fam,
      educacaoAtualizada: edu,
      carreiraAtualizada: car,
      economiaAtualizada: eco,
      novosLogs,
      eventoDisparado: null,
      morreu: true,
      resumoMorte
    };
  }

  // 7. Sorteio de Evento Interativo (pode consultar personalidade/memória)
  const evento = sortearEventoDoAno(
    char,
    car,
    edu,
    eco,
    fam,
    historicoEventos,
    personalidade
  );

  // Se nenhum evento interativo foi disparado e nenhum log narrativo específico ocorreu, adiciona flavor text de ano tranquilo
  const logsRelevantes = novosLogs.filter(l => l.categoria !== 'geral');
  if (!evento && logsRelevantes.length === 0) {
    novosLogs.push({
      id: generateId('log'),
      idade: novaIdade,
      ano: novoAno,
      categoria: 'cotidiano',
      texto: gerarTextoAnoTranquilo(novaIdade),
      tipo: 'info'
    });
  }

  return {
    personagemAtualizado: char,
    familiaAtualizada: fam,
    educacaoAtualizada: edu,
    carreiraAtualizada: car,
    economiaAtualizada: eco,
    novosLogs,
    eventoDisparado: evento,
    morreu: false
  };
}
