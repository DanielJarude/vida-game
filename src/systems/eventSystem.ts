import {
  Character,
  CareerState,
  EducationState,
  EconomyState,
  EventOccurrence,
  FamilyMember,
  GameEvent,
  EventOption,
  LifeLogCategory,
  LifeLogEntry,
  NaturezaEvento,
  PersonalityState,
  RelationType,
  RelevanciaLog
} from '../types';
import { taxonomiaMovePersonalidade } from '../types';
import { MASTER_EVENTS_LIST } from '../data/events/allEvents';
import { clamp, generateId } from '../utils/random';
import { normalizarHiddenStats, normalizarStats } from './attributeSystem';
// Dependência em direção única: personalitySystem não importa eventSystem
import { registrarEscolha } from './personalitySystem';
import { avaliarCondicoesEvento as avaliarCondicoesEventoImpl } from './events/eligibility';
import { sortearPonderadoComContexto } from './events/selection';
import { ponderarPorContexto } from './events/contextWeighting';
import { naturezaDoEvento } from './events/nature';
import { memoriaDoDesfecho } from './narrativa/memoriaDoEvento';
import { sortearNome, sortearSobrenome } from '../data/brazilianData';
import { PROXIMIDADE_INICIAL_MAX } from './social/redeSocial';

/**
 * F6 — parentes de sangue compartilham o sobrenome do jogador; amigos,
 * colegas e rivais, não. Lista pequena e local porque é usada só aqui.
 */
const TIPOS_FAMILIA_CONSANGUINEA: RelationType[] = [
  'pai', 'mae', 'irmao', 'irma', 'filho', 'filha'
];
import { classificacaoDoEvento } from './events/taxonomia';
import { tomDoDesfecho } from './events/happenings';
import { avaliarRequisitoOpcao as avaliarRequisitoOpcaoImpl } from './events/optionRequirements';

// Reexportado por compatibilidade: quem já importava `avaliarCondicoesEvento`,
// `avaliarRequisitoOpcao` ou `sortearEventoDoAno` de `eventSystem` continua
// funcionando. As regras vivem em `systems/events/eligibility`,
// `systems/events/optionRequirements` e `systems/events/selection` — nunca
// duplicadas aqui.
export const avaliarCondicoesEvento = avaliarCondicoesEventoImpl;
export const avaliarRequisitoOpcao = avaliarRequisitoOpcaoImpl;

/**
 * Sorteia um evento da natureza pedida entre os que o personagem pode
 * receber agora.
 *
 * B4-FIX4 — mudança importante de responsabilidade: esta função NÃO decide
 * mais SE o ano terá evento. Essa é a pergunta do ritmo
 * (`systems/pacing/lifeRhythm`), que lê idade, fase, densidade do ano e
 * fadiga de decisão. Aqui só sobrou "qual evento", que é o que o nome
 * sempre prometeu. A antiga `haEventoNesteAno()` (porcentagem global de
 * 75%, igual aos 0 e aos 80 anos) deixou de ser consultada.
 *
 * `natureza` ausente = qualquer natureza (usado por testes e simulações que
 * só querem saber se existe conteúdo elegível).
 */
export function sortearEventoDoAno(
  personagem: Character,
  carreira: CareerState,
  educacao: EducationState,
  economia: EconomyState,
  familia: FamilyMember[],
  historicoDisparados: string[],
  personalidade?: PersonalityState,
  historicoOcorrencias: EventOccurrence[] = [],
  natureza?: NaturezaEvento
): GameEvent | null {
  const eventosElegiveis = MASTER_EVENTS_LIST.filter(evento => {
    if (natureza && naturezaDoEvento(evento) !== natureza) return false;
    return avaliarCondicoesEventoImpl(
      evento,
      personagem,
      carreira,
      educacao,
      economia,
      familia,
      historicoDisparados,
      personalidade,
      historicoOcorrencias
    );
  });

  // B4-FIX3 — o pool elegível é ajustado por contexto recente e por
  // anti-dominação antes do sorteio (ver `events/contextWeighting`).
  const ponderados = ponderarPorContexto(eventosElegiveis, historicoOcorrencias);
  return sortearPonderadoComContexto(ponderados);
}

export interface ContextoPersonalidadeEscolha {
  eventoId: string;
  personalidade: PersonalityState;
}

/**
 * B4-FIX4 — onde o desfecho deste evento entra na Linha da Vida.
 *
 * Sem este contexto, todo resultado de evento virava `categoria: 'evento'`
 * (rotulada "Escolha" na apresentação) — errado para um acontecimento, que
 * não foi escolha nenhuma, e pobre para uma decisão, cujo assunto real
 * (escola, saúde, dinheiro) ficava escondido atrás de um rótulo genérico.
 * Ausente = comportamento anterior, para não alterar chamadas existentes.
 */
export interface ContextoNarrativoDesfecho {
  categoriaLog: LifeLogCategory;
  relevancia?: RelevanciaLog;
}

export function aplicarConsequenciasEscolha(
  opcao: EventOption,
  personagem: Character,
  carreira: CareerState,
  educacao: EducationState,
  economia: EconomyState,
  familia: FamilyMember[],
  anoAtual: number,
  contextoPersonalidade?: ContextoPersonalidadeEscolha,
  contextoNarrativo?: ContextoNarrativoDesfecho
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
      // F6 — desempate por PROXIMIDADE, não por ordem de chegada.
      //
      // Enquanto existia no máximo um amigo por vida, "o mais recente" era
      // inofensivo. Com a rede social da F6 uma pessoa pode ter vários
      // amigos, e um evento de afastamento passou a encerrar justamente a
      // amizade mais recente — que costuma ser a mais próxima. A leitura de
      // timelines mostrou amizades de proximidade 86 sendo encerradas.
      //
      // Um evento de perder contato deve atingir o vínculo MENOS próximo:
      // é o que a vida faz, e é o que não destrói a relação que o jogador
      // acompanhou construir.
      const maisDistante = [...candidatos].sort(
        (a, b) => a.relacionamento - b.relacionamento
      )[0];
      return maisDistante?.id;
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
    const tipoNovo = cons.adicionarFamiliar.tipo || 'pet';
    const ehPessoa = tipoNovo !== 'pet';
    const generoNovo = cons.adicionarFamiliar.genero || 'masculino';

    // F6 §14 — TODA pessoa persistente tem identidade mínima coerente.
    // O default anterior era o literal 'Novo Familiar', que vazava para a
    // aba Pessoas como se fosse nome (38 ocorrências nas 105 vidas). Agora
    // um evento que não nomeia alguém recebe um nome brasileiro de verdade,
    // coerente com o gênero. Pet mantém o comportamento antigo: o evento
    // sempre nomeia o bicho, e 'Novo Familiar' nunca foi usado para eles.
    const nomeNovo =
      cons.adicionarFamiliar.nome || (ehPessoa ? sortearNome(generoNovo) : 'Novo Familiar');

    const novoFamiliar: FamilyMember = {
      id: cons.adicionarFamiliar.id || generateId('fam'),
      nome: nomeNovo,
      // Pessoa de fora da família não herda o sobrenome do jogador.
      sobrenome:
        cons.adicionarFamiliar.sobrenome ||
        (ehPessoa && !TIPOS_FAMILIA_CONSANGUINEA.includes(tipoNovo)
          ? sortearSobrenome()
          : char.sobrenome),
      genero: generoNovo,
      tipo: tipoNovo,
      idade: cons.adicionarFamiliar.idade || 1,
      // F6 §5 — relação não nasce "Muito próxima". O default anterior era 80,
      // que a camada de apresentação lê exatamente como "Muito próxima" para
      // alguém que se acabou de conhecer. Eventos que declaram o valor
      // continuam mandando; só o DEFAULT mudou, e apenas para pessoas.
      relacionamento:
        cons.adicionarFamiliar.relacionamento ?? (ehPessoa ? PROXIMIDADE_INICIAL_MAX : 80),
      vivo: true,
      situacaoAtual: cons.adicionarFamiliar.situacaoAtual || 'Em casa com a família',
      // B4-FIX3 item 13 — NPC nascido de um evento fica marcado com o
      // evento de origem (rastreabilidade; nenhuma regra depende disto)
      // e `ativo: true` por padrão (a relação está em andamento).
      origemEventoId: cons.adicionarFamiliar.origemEventoId ?? contextoPersonalidade?.eventoId,
      ativo: cons.adicionarFamiliar.ativo ?? true,
      // F6 — a HISTÓRIA da relação declarada pelo evento precisa atravessar.
      // Este objeto é montado campo a campo, então todo campo novo de
      // `FamilyMember` é silenciosamente DESCARTADO até ser listado aqui: o
      // catálogo declarava `origemSocial` e a pessoa chegava sem origem
      // nenhuma na aba Pessoas.
      origemSocial: cons.adicionarFamiliar.origemSocial,
      estudante: cons.adicionarFamiliar.estudante,
      idadeEntrada: cons.adicionarFamiliar.idadeEntrada ?? char.idade,
      ultimoContatoIdade: cons.adicionarFamiliar.ultimoContatoIdade ?? char.idade
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
      tipo: 'negativo',
      relevancia: 'marco'
    });
  }

  // Morte
  if (cons.morte || char.stats.saude <= 0) {
    morreu = true;
    causaMorte = causaMorte || (char.stats.saude <= 0 ? 'Problemas graves de saúde' : 'Incidente fatal');
  }

  // Log do resultado.
  //
  // Bug corrigido no B4-FIX4: o tipo era `'positivo'` fixo. Um desfecho em
  // que a pessoa se machucou, perdeu dinheiro ou foi demitida entrava na
  // Linha da Vida com a ênfase visual de boa notícia. O tom agora vem das
  // consequências reais (`events/happenings.tomDoDesfecho`).
  //
  // F5 — o texto que vai para a BIOGRAFIA não é necessariamente o que foi
  // exibido ao vivo. Um desfecho de acontecimento automático costuma ser
  // compreensível na hora (porque a situação estava na tela logo acima) e
  // opaco meses depois na Linha da Vida ("devolveu o tablet" — que tablet?).
  // `memoriaDoDesfecho` é a fonte única dessa decisão; ver
  // systems/narrativa/memoriaDoEvento.
  const textoBiografico = memoriaDoDesfecho(opcao);
  if (textoBiografico) {
    logs.push({
      id: generateId('log'),
      idade: char.idade,
      ano: anoAtual,
      categoria: contextoNarrativo?.categoriaLog ?? 'evento',
      texto: textoBiografico,
      tipo: tomDoDesfecho(cons),
      relevancia: contextoNarrativo?.relevancia ?? 'normal'
    });
  }

  // B2 — registra a escolha na memória interna e move os traços. A memória
  // alimentará condições futuras; a Linha da Vida continua recebendo apenas o
  // texto narrativo acima (nunca dados técnicos da memória).
  let personalidadeAtualizada: PersonalityState | undefined;
  if (contextoPersonalidade) {
    // F3 / Revisão 1 — a classificação do conteúdo decide se esta escolha
    // caracteriza a pessoa. Escolher a primeira palavra é biográfico: é do
    // jogador, é memorável, e não diz nada sobre quem a pessoa é. Tentar ler
    // caráter numa escolha dessas é como deduzir a personalidade de alguém
    // pelo nome que os pais lhe deram.
    //
    // A trava fica AQUI, no único ponto por onde toda escolha passa, e não
    // na boa vontade de cada entrada do catálogo. Um autor que esqueça de
    // limpar `impactosComportamentais` de um marco biográfico não consegue
    // mover traço nenhum: o motor recusa antes de olhar as tags.
    const evento = MASTER_EVENTS_LIST.find(e => e.id === contextoPersonalidade.eventoId);
    const podeMover = evento ? taxonomiaMovePersonalidade(classificacaoDoEvento(evento)) : true;

    personalidadeAtualizada = registrarEscolha(contextoPersonalidade.personalidade, {
      eventoId: contextoPersonalidade.eventoId,
      opcaoId: opcao.id,
      idade: personagem.idade,
      ano: anoAtual,
      // A escolha continua sendo REGISTRADA na memória mesmo quando não move
      // traço: `escolheuAnteriormente` precisa dela para dar continuidade
      // narrativa (é assim que `inf_bullying_defesa` se lembra). O que a
      // taxonomia governa é só o movimento dos traços.
      tagsComportamentais: podeMover ? cons.impactosComportamentais : undefined
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
