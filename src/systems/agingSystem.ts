import {
  CareerState,
  Character,
  EconomyState,
  EducationState,
  FamilyMember,
  GameEvent,
  LifeLogEntry,
  PostMortemSummary
} from '../types';
import { aplicarEnvelhecimentoAtributos } from './attributeSystem';
import { processarAnoCarreira } from './careerSystem';
import { verificarMortalidade, construirResumoMorte } from './deathSystem';
import { calcularPatrimonioLiquido, processarAnoEconomia } from './economySystem';
import { processarAnoEducacao } from './educationSystem';
import { sortearEventoDoAno } from './eventSystem';
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

export function executarPassagemDeAno(
  personagem: Character,
  familia: FamilyMember[],
  educacao: EducationState,
  carreira: CareerState,
  economia: EconomyState,
  historicoEventosDisparados: string[]
): AgingResult {
  const novaIdade = personagem.idade + 1;
  const novoAno = personagem.anoAtual + 1;
  const novosLogs: LifeLogEntry[] = [];

  // Log de cabeçalho do novo ano
  novosLogs.push({
    id: generateId('ano_head'),
    idade: novaIdade,
    ano: novoAno,
    categoria: 'geral',
    texto: `Ano ${novoAno} — Você completou ${novaIdade} ${novaIdade === 1 ? 'ano' : 'anos'}.`,
    tipo: 'info'
  });

  // 1. Atualização e envelhecimento de atributos
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

  // 2. Processamento da Educação
  const resEdu = processarAnoEducacao(educacao, char, novoAno);
  let edu = resEdu.educacaoAtualizada;
  char = resEdu.personagemAtualizado;
  novosLogs.push(...resEdu.logsEducacao);

  // 3. Processamento da Carreira
  const resCar = processarAnoCarreira(carreira, char, novoAno);
  let car = resCar.carreiraAtualizada;
  char = resCar.personagemAtualizado;
  novosLogs.push(...resCar.logsCarreira);

  // 4. Processamento da Família
  const resFam = processarEnvelhecimentoFamilia(familia, char, novoAno);
  const fam = resFam.familiaAtualizada;
  novosLogs.push(...resFam.logsFamilia);

  // 5. Processamento da Economia
  const resEco = processarAnoEconomia(
    economia,
    char,
    fam,
    resCar.salarioTotalAnual,
    resEdu.mensalidadeAnual,
    novoAno
  );
  let eco = resEco.economiaAtualizada;
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

  // 7. Sorteio de Evento Interativo
  const evento = sortearEventoDoAno(
    char,
    car,
    edu,
    eco,
    fam,
    historicoEventosDisparados
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
