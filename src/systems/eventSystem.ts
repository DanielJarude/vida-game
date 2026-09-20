import {
  Character,
  CareerState,
  CondicaoComportamental,
  EducationState,
  EconomyState,
  FamilyMember,
  GameEvent,
  EventOption,
  LifeLogEntry,
  PersonalityState
} from '../types';
import { MASTER_EVENTS_LIST } from '../data/events/allEvents';
import { EventHistory, idsDisparados } from './events/eventHistory';
import { podeRepetirAgora } from './events/eventEligibility';
import { sortearPonderado } from './events/eventSelection';
import { formatarDinheiro, getLifeStage, getRotuloAtributo } from '../utils/formatters';
import { clamp, generateId, rollChance } from '../utils/random';
import { normalizarHiddenStats, normalizarStats } from './attributeSystem';
// Dependência em direção única: personalitySystem não importa eventSystem
import {
  atendeCondicaoComportamental,
  atendeCondicoesComportamentais,
  getNomeTraco,
  registrarEscolha
} from './personalitySystem';

export function avaliarCondicoesEvento(
  evento: GameEvent,
  personagem: Character,
  carreira: CareerState,
  educacao: EducationState,
  economia: EconomyState,
  familia: FamilyMember[],
  historicoDisparados: string[],
  personalidade?: PersonalityState
): boolean {
  // Idade
  if (personagem.idade < evento.idadeMinima || personagem.idade > evento.idadeMaxima) {
    return false;
  }

  // Evento único já disparado
  if (evento.unico && historicoDisparados.includes(evento.id)) {
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

/**
 * Pool elegível de um ano — consulta pura, sem sorteio.
 *
 * Exposta porque é o que o playtest determinístico e os testes precisam
 * medir: "quantos eventos esta vida realmente poderia ter visto aos 5
 * anos?". A resposta é o que explica a repetição, não a sorte.
 */
export function listarEventosElegiveis(
  personagem: Character,
  carreira: CareerState,
  educacao: EducationState,
  economia: EconomyState,
  familia: FamilyMember[],
  historico: EventHistory,
  personalidade?: PersonalityState
): GameEvent[] {
  const disparados = idsDisparados(historico);

  return MASTER_EVENTS_LIST.filter(
    evento =>
      avaliarCondicoesEvento(
        evento,
        personagem,
        carreira,
        educacao,
        economia,
        familia,
        disparados,
        personalidade
      ) && podeRepetirAgora(evento, historico, personagem.idade)
  );
}

export function sortearEventoDoAno(
  personagem: Character,
  carreira: CareerState,
  educacao: EducationState,
  economia: EconomyState,
  familia: FamilyMember[],
  historico: EventHistory,
  personalidade?: PersonalityState
): GameEvent | null {
  // Chance de 75% de ter um evento interativo no ano (alguns anos são mais calmos)
  if (!rollChance(75)) {
    return null;
  }

  const eventosElegiveis = listarEventosElegiveis(
    personagem,
    carreira,
    educacao,
    economia,
    familia,
    historico,
    personalidade
  );

  if (eventosElegiveis.length === 0) return null;

  // Sorteio ponderado pelo peso **efetivo**: quem já apareceu nesta vida
  // concorre com peso reduzido. Antes do B4-FIX.1 o peso era fixo, então
  // um evento de peso alto num pool pequeno voltava ano após ano.
  return sortearPonderado(eventosElegiveis, historico);
}

/** Motivo em pt-BR quando uma exigência comportamental não é cumprida (qualitativo, sem números). */
function motivoCondicaoComportamental(cond: CondicaoComportamental): string {
  if (cond.traco && (cond.intensidadeMinima !== undefined || cond.intensidadeMaxima !== undefined)) {
    return `Você ainda não tem histórico suficiente de ${getNomeTraco(cond.traco)}.`;
  }
  return 'Esta escolha depende de uma vivência que você ainda não teve.';
}

/**
 * Avalia o requisito de uma opção de evento (atributo, dinheiro, flag ou padrão
 * comportamental acumulado). Usado pela interface (mostrar indisponibilidade e
 * motivo) e pelo motor (recusar antes de aplicar consequências).
 */
export function avaliarRequisitoOpcao(
  opcao: EventOption,
  personagem: Character,
  economia: EconomyState,
  personalidade?: PersonalityState
): { aprovado: boolean; motivo?: string } {
  const requisito = opcao.requisito;
  if (!requisito) return { aprovado: true };

  if (requisito.dinheiroMinimo !== undefined && economia.dinheiro < requisito.dinheiroMinimo) {
    return { aprovado: false, motivo: `Você precisa de ${formatarDinheiro(requisito.dinheiroMinimo)} disponíveis.` };
  }

  if (requisito.atributo && requisito.valorMinimo !== undefined) {
    const valorAtual =
      (personagem.stats as unknown as Record<string, number | undefined>)[requisito.atributo] ??
      (personagem.hiddenStats as unknown as Record<string, number | undefined>)[requisito.atributo];
    if (valorAtual === undefined || valorAtual < requisito.valorMinimo) {
      return {
        aprovado: false,
        motivo: `Você precisa de ${getRotuloAtributo(requisito.atributo)} ${requisito.valorMinimo} ou mais.`
      };
    }
  }

  if (requisito.flagNecessaria && !personagem.flags[requisito.flagNecessaria]) {
    return { aprovado: false, motivo: 'Você não cumpre os requisitos para esta escolha.' };
  }

  // B2 — padrão de comportamento acumulado (recusa segura sem estado de personalidade)
  if (requisito.condicaoComportamental) {
    if (!atendeCondicaoComportamental(personalidade, requisito.condicaoComportamental)) {
      return { aprovado: false, motivo: motivoCondicaoComportamental(requisito.condicaoComportamental) };
    }
  }

  return { aprovado: true };
}

export interface ContextoPersonalidadeEscolha {
  eventoId: string;
  personalidade: PersonalityState;
}

export function aplicarConsequenciasEscolha(
  opcao: EventOption,
  personagem: Character,
  carreira: CareerState,
  educacao: EducationState,
  economia: EconomyState,
  familia: FamilyMember[],
  anoAtual: number,
  contextoPersonalidade?: ContextoPersonalidadeEscolha
): {
  personagemAtualizado: Character;
  carreiraAtualizada: CareerState;
  educacaoAtualizada: EducationState;
  economiaAtualizada: EconomyState;
  familiaAtualizada: FamilyMember[];
  personalidadeAtualizada?: PersonalityState;
  novosLogs: LifeLogEntry[];
  morreu: boolean;
  causaMorte?: string;
  recusado?: boolean;
  mensagemRecusa?: string;
} {
  // Revalidação do requisito antes de qualquer efeito (sem efeitos parciais)
  const requisito = avaliarRequisitoOpcao(
    opcao,
    personagem,
    economia,
    contextoPersonalidade?.personalidade
  );
  if (!requisito.aprovado) {
    return {
      personagemAtualizado: personagem,
      carreiraAtualizada: carreira,
      educacaoAtualizada: educacao,
      economiaAtualizada: economia,
      familiaAtualizada: familia,
      novosLogs: [],
      morreu: false,
      recusado: true,
      mensagemRecusa: requisito.motivo || 'Você não cumpre os requisitos para esta escolha.'
    };
  }

  const cons = opcao.consequencias;
  const char = { ...personagem };
  let car = { ...carreira };
  const edu = { ...educacao };
  let eco = { ...economia };
  let fam = [...familia];
  const logs: LifeLogEntry[] = [];
  let morreu = false;
  let causaMorte = cons.causaMorte;

  // Stats
  if (cons.stats) {
    char.stats = normalizarStats({
      ...char.stats,
      ...Object.fromEntries(
        Object.entries(cons.stats).map(([k, v]) => [
          k,
          char.stats[k as keyof typeof char.stats] + (v ?? 0)
        ])
      )
    });
  }

  // Hidden stats
  if (cons.hiddenStats) {
    char.hiddenStats = normalizarHiddenStats({
      ...char.hiddenStats,
      ...Object.fromEntries(
        Object.entries(cons.hiddenStats).map(([k, v]) => [
          k,
          char.hiddenStats[k as keyof typeof char.hiddenStats] + (v ?? 0)
        ])
      )
    });
  }

  // Dinheiro
  if (cons.dinheiro) {
    eco.dinheiro += cons.dinheiro;
  }

  // Flags
  if (cons.adicionarFlag) {
    char.flags = {
      ...char.flags,
      [cons.adicionarFlag]: true
    };
  }
  if (cons.removerFlag) {
    const novasFlags = { ...char.flags };
    delete novasFlags[cons.removerFlag];
    char.flags = novasFlags;
  }

  // Relacionamentos
  if (cons.relacionamentoDelta) {
    const { relationId, relationType, delta } = cons.relacionamentoDelta;
    fam = fam.map(membro => {
      let match = false;
      if (relationId && membro.id === relationId) match = true;
      else if (relationType && membro.tipo === relationType) match = true;
      else if (!relationId && !relationType) match = true; // Aplica a todos

      if (match) {
        return {
          ...membro,
          relacionamento: clamp(membro.relacionamento + delta, 0, 100)
        };
      }
      return membro;
    });
  }

  // Novo familiar (ex: animal de estimação ou novo parente)
  if (cons.adicionarFamiliar) {
    const novoFamiliar: FamilyMember = {
      id: generateId('fam'),
      nome: cons.adicionarFamiliar.nome || 'Novo Familiar',
      sobrenome: cons.adicionarFamiliar.sobrenome || char.sobrenome,
      genero: cons.adicionarFamiliar.genero || 'masculino',
      tipo: cons.adicionarFamiliar.tipo || 'pet',
      idade: cons.adicionarFamiliar.idade || 1,
      relacionamento: cons.adicionarFamiliar.relacionamento || 80,
      vivo: true,
      situacaoAtual: cons.adicionarFamiliar.situacaoAtual || 'Em casa com a família'
    };
    fam.push(novoFamiliar);
  }

  // Doenças
  if (cons.adicionarDoenca && !char.doencas.includes(cons.adicionarDoenca)) {
    char.doencas = [...char.doencas, cons.adicionarDoenca];
  }
  if (cons.curarDoenca) {
    char.doencas = char.doencas.filter(d => d !== cons.curarDoenca);
  }

  // Demissão
  if (cons.demissao && car.empregado) {
    const cargoAnterior = car.cargoAtual?.titulo || 'emprego';
    car = {
      ...car,
      empregado: false,
      cargoAtual: undefined,
      desempenhoTrabalho: 50,
      historicoEmpregos: [
        ...car.historicoEmpregos,
        {
          cargo: cargoAnterior,
          salario: car.cargoAtual?.salarioMensal || 0,
          anoInicio: anoAtual - car.anosNoCargo,
          anoFim: anoAtual,
          motivoSaida: 'Demissão por ocorrência de evento'
        }
      ]
    };
    logs.push({
      id: generateId('log'),
      idade: char.idade,
      ano: anoAtual,
      categoria: 'carreira',
      texto: `Você foi demitido(a) do cargo de ${cargoAnterior}.`,
      tipo: 'negativo'
    });
  }

  // Morte
  if (cons.morte || char.stats.saude <= 0) {
    morreu = true;
    causaMorte = causaMorte || (char.stats.saude <= 0 ? 'Problemas graves de saúde' : 'Incidente fatal');
  }

  // Log do resultado
  if (opcao.descricaoResultado) {
    logs.push({
      id: generateId('log'),
      idade: char.idade,
      ano: anoAtual,
      categoria: 'evento',
      texto: opcao.descricaoResultado,
      tipo: 'positivo'
    });
  }

  // B2 — registra a escolha na memória interna e move os traços. A memória
  // alimentará condições futuras; a Linha da Vida continua recebendo apenas o
  // texto narrativo acima (nunca dados técnicos da memória).
  let personalidadeAtualizada: PersonalityState | undefined;
  if (contextoPersonalidade) {
    personalidadeAtualizada = registrarEscolha(contextoPersonalidade.personalidade, {
      eventoId: contextoPersonalidade.eventoId,
      opcaoId: opcao.id,
      idade: personagem.idade,
      ano: anoAtual,
      tagsComportamentais: cons.impactosComportamentais
    }).personalidade;
  }

  return {
    personagemAtualizado: char,
    carreiraAtualizada: car,
    educacaoAtualizada: edu,
    economiaAtualizada: eco,
    familiaAtualizada: fam,
    personalidadeAtualizada,
    novosLogs: logs,
    morreu,
    causaMorte
  };
}
