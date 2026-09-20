import {
  Character,
  CareerState,
  CondicaoComportamental,
  EducationState,
  EconomyState,
  EventOccurrence,
  FamilyMember,
  GameEvent,
  EventOption,
  LifeLogEntry,
  PersonalityState
} from '../types';
import { MASTER_EVENTS_LIST } from '../data/events/allEvents';
import { formatarDinheiro, getRotuloAtributo } from '../utils/formatters';
import { clamp, generateId } from '../utils/random';
import { normalizarHiddenStats, normalizarStats } from './attributeSystem';
// Dependência em direção única: personalitySystem não importa eventSystem
import {
  atendeCondicaoComportamental,
  registrarEscolha,
  getNomeTraco
} from './personalitySystem';
import { avaliarCondicoesEvento as avaliarCondicoesEventoImpl } from './events/eligibility';
import { haEventoNesteAno, sortearPonderadoComContexto } from './events/selection';
import { ponderarPorContexto } from './events/contextWeighting';

// Reexportado por compatibilidade: quem já importava `avaliarCondicoesEvento`
// e `sortearEventoDoAno` de `eventSystem` continua funcionando. A regra em
// si vive em `systems/events/eligibility` e `systems/events/selection`
// (B4-FIX2) — não duplicada aqui.
export const avaliarCondicoesEvento = avaliarCondicoesEventoImpl;

export function sortearEventoDoAno(
  personagem: Character,
  carreira: CareerState,
  educacao: EducationState,
  economia: EconomyState,
  familia: FamilyMember[],
  historicoDisparados: string[],
  personalidade?: PersonalityState,
  historicoOcorrencias: EventOccurrence[] = []
): GameEvent | null {
  // Chance de ter um evento interativo no ano (alguns anos são mais calmos)
  if (!haEventoNesteAno()) {
    return null;
  }

  const eventosElegiveis = MASTER_EVENTS_LIST.filter(evento =>
    avaliarCondicoesEventoImpl(
      evento,
      personagem,
      carreira,
      educacao,
      economia,
      familia,
      historicoDisparados,
      personalidade,
      historicoOcorrencias
    )
  );

  // B4-FIX3 — o pool elegível é ajustado por contexto recente e por
  // anti-dominação antes do sorteio (ver `events/contextWeighting`).
  const ponderados = ponderarPorContexto(eventosElegiveis, historicoOcorrencias);
  return sortearPonderadoComContexto(ponderados);
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

  // B4-FIX3 item 7 — o evento pode ser elegível numa idade (janela ampla,
  // ex.: 8-90 para um problema de saúde), mas uma opção específica dentro
  // dele pode continuar incompatível (ex.: "tentar trabalhar mesmo doente"
  // não faz sentido para uma criança de 8 anos). O motor recusa aqui —
  // nunca confia que a UI já filtrou a opção antes de chamar.
  if (requisito.idadeMinima !== undefined && personagem.idade < requisito.idadeMinima) {
    return { aprovado: false, motivo: 'Você ainda não tem idade para essa escolha.' };
  }
  if (requisito.idadeMaxima !== undefined && personagem.idade > requisito.idadeMaxima) {
    return { aprovado: false, motivo: 'Essa escolha não é mais compatível com sua idade.' };
  }

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

  // B4-FIX3 item 13/14 — transformar/encerrar uma relação existente, por
  // ID estável OU por tipo (nunca por nome/texto). Uma amizade pode virar
  // romance; uma relação pode ser encerrada sem apagar a pessoa nem seu
  // histórico. Quando referenciado por tipo, resolve para a pessoa ATIVA
  // mais recente daquele tipo (mesma convenção de `relacionamentoDelta`).
  function resolverAlvoRelacao(ref: { relationId?: string; relationType?: string }): string | undefined {
    if (ref.relationId) return ref.relationId;
    if (ref.relationType) {
      const candidatos = fam.filter(m => m.tipo === ref.relationType && m.ativo !== false);
      return candidatos[candidatos.length - 1]?.id;
    }
    return undefined;
  }

  if (cons.transformarRelacao) {
    const alvoId = resolverAlvoRelacao(cons.transformarRelacao);
    if (alvoId) {
      fam = fam.map(membro =>
        membro.id === alvoId ? { ...membro, tipo: cons.transformarRelacao!.novoTipo } : membro
      );
    }
  }
  if (cons.encerrarRelacao) {
    const alvoId = resolverAlvoRelacao(cons.encerrarRelacao);
    if (alvoId) {
      fam = fam.map(membro => (membro.id === alvoId ? { ...membro, ativo: false } : membro));
    }
  }

  // Novo familiar (ex: animal de estimação ou novo parente)
  if (cons.adicionarFamiliar) {
    const novoFamiliar: FamilyMember = {
      id: cons.adicionarFamiliar.id || generateId('fam'),
      nome: cons.adicionarFamiliar.nome || 'Novo Familiar',
      sobrenome: cons.adicionarFamiliar.sobrenome || char.sobrenome,
      genero: cons.adicionarFamiliar.genero || 'masculino',
      tipo: cons.adicionarFamiliar.tipo || 'pet',
      idade: cons.adicionarFamiliar.idade || 1,
      relacionamento: cons.adicionarFamiliar.relacionamento || 80,
      vivo: true,
      situacaoAtual: cons.adicionarFamiliar.situacaoAtual || 'Em casa com a família',
      // B4-FIX3 item 13 — NPC nascido de um evento fica marcado com o
      // evento de origem (rastreabilidade; nenhuma regra depende disto)
      // e `ativo: true` por padrão (a relação está em andamento).
      origemEventoId: cons.adicionarFamiliar.origemEventoId ?? contextoPersonalidade?.eventoId,
      ativo: cons.adicionarFamiliar.ativo ?? true
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
