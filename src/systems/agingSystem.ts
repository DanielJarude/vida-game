import {
  CareerState,
  Character,
  EconomyState,
  EducationState,
  EventOccurrence,
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
import { aplicarConsequenciasEscolha, sortearEventoDoAno } from './eventSystem';
import { processarEnvelhecimentoFamilia } from './familySystem';
import {
  categoriaDeLogDoEvento,
  desfechoSemMarcaDeEscolha,
  sortearDesfecho
} from './events/happenings';
import {
  definirPulsoDoAno,
  historicoDeRitmo,
  obterFaixaDeRitmo,
  type DiagnosticoRitmo
} from './pacing/lifeRhythm';
import { generateId } from '../utils/random';

export interface AgingResult {
  personagemAtualizado: Character;
  familiaAtualizada: FamilyMember[];
  educacaoAtualizada: EducationState;
  carreiraAtualizada: CareerState;
  economiaAtualizada: EconomyState;
  novosLogs: LifeLogEntry[];
  /**
   * Evento de DECISÃO aguardando o jogador. Só isto abre modal. Quando o
   * ano produziu um acontecimento (ou silêncio), vem `null`.
   */
  eventoDisparado: GameEvent | null;
  /**
   * B4-FIX4 — acontecimento que o motor já resolveu e narrou sozinho. Vem
   * preenchido apenas para rastreabilidade (histórico, testes, simulação):
   * as consequências dele JÁ estão aplicadas no estado devolvido e o texto
   * JÁ está em `novosLogs`. A interface não precisa fazer nada com ele.
   */
  acontecimentoResolvido: GameEvent | null;
  /**
   * Ocorrência a registrar no histórico da vida — serve tanto para decisão
   * quanto para acontecimento. A camada de comandos grava isto em vez de
   * remontar o registro por conta própria (era a origem de acontecimentos
   * ficarem fora do controle de repetição).
   */
  ocorrencia: EventOccurrence | null;
  /** Diagnóstico do ritmo do ano — depuração, testes e simulação. Nunca exibido. */
  ritmo: DiagnosticoRitmo;
  morreu: boolean;
  resumoMorte?: PostMortemSummary;
}

/**
 * Categorias que NÃO contam como acontecimento estrutural do ano.
 * 'geral' é enquadramento e 'cotidiano' é textura de fundo: nenhuma das
 * duas ocupa o ano a ponto de dispensar um evento interativo.
 */
const CATEGORIAS_NAO_ESTRUTURAIS = new Set(['geral', 'cotidiano']);

/**
 * Ordem explícita do avanço anual:
 * 1. Idade/ano incrementados uma única vez (charBase).
 * 2. Envelhecimento de atributos.
 * 3. Educação (inclui resolução da postura escolar do ano).
 * 4. Carreira (horas extras e bico do ano são resolvidos aqui, uma única vez).
 * 5. Família.
 * 6. Economia (salários, despesas, rendimentos sobre o estado já atualizado).
 * 7. Mortalidade.
 * 8. RITMO: o ano merece silêncio, um acontecimento ou uma decisão?
 *    (B4-FIX4 — antes disto o passo 8 era um sorteio com 75% fixos, e o
 *    ano "tranquilo" ainda escrevia texto de preenchimento na Linha da
 *    Vida. Agora quem decide é `systems/pacing/lifeRhythm`, lendo idade,
 *    fase, densidade estrutural do próprio ano e fadiga de decisão.)
 * 9. Se for acontecimento, o motor resolve e narra aqui mesmo; se for
 *    decisão, o evento sobe para a interface.
 * O rastreador de ações únicas do ano (acoesRealizadasAno) é zerado pela
 * camada de comandos ao consumir este resultado.
 */
export function executarPassagemDeAno(
  personagem: Character,
  familia: FamilyMember[],
  educacao: EducationState,
  carreira: CareerState,
  economia: EconomyState,
  historicoEventosDisparados: string[],
  personalidade?: PersonalityState,
  // B4-FIX2 — histórico rico (id + idade + ano) para checagem de
  // cooldown/recorrência; opcional para não quebrar chamadas existentes
  // (nesse caso, o sorteio se comporta como se não houvesse ocorrência
  // anterior registrada com idade — ainda seguro, apenas menos preciso).
  historicoOcorrenciasEventos: EventOccurrence[] = []
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
      acontecimentoResolvido: null,
      ocorrencia: null,
      ritmo: ritmoSilencioso(novaIdade, 'morte no ano'),
      morreu: true,
      resumoMorte
    };
  }

  // ------------------------------------------------------------------ RITMO
  //
  // Quantos acontecimentos ESTRUTURAIS este ano já produziu sozinho? Um ano
  // que entregou "você se formou" e "você foi contratado" já contou a
  // própria história — interromper com um evento sorteado em cima disso é
  // ruído, não conteúdo.
  const densidadeEstrutural = novosLogs.filter(
    log => !CATEGORIAS_NAO_ESTRUTURAIS.has(log.categoria)
  ).length;

  const ritmo = definirPulsoDoAno({
    idade: novaIdade,
    historico: historicoDeRitmo(historicoOcorrenciasEventos),
    densidadeEstrutural
  });

  const estadoBase = {
    personagemAtualizado: char,
    familiaAtualizada: fam,
    educacaoAtualizada: edu,
    carreiraAtualizada: car,
    economiaAtualizada: eco,
    ritmo,
    morreu: false as boolean
  };

  // ---------------------------------------------------------- Ano tranquilo
  //
  // Silêncio é silêncio: nenhum log, nenhum modal, nenhuma linha de
  // preenchimento. O texto "Um ano sem grandes acontecimentos" que existia
  // aqui até o B4-FIX3 interrompia o jogador exatamente para dizer que nada
  // merecia interrompê-lo.
  if (ritmo.pulso === 'silencio') {
    return {
      ...estadoBase,
      novosLogs,
      eventoDisparado: null,
      acontecimentoResolvido: null,
      ocorrencia: null
    };
  }

  // -------------------------------------------------------------- Decisão
  if (ritmo.pulso === 'decisao') {
    const decisao = sortearEventoDoAno(
      char, car, edu, eco, fam,
      historicoEventosDisparados, personalidade, historicoOcorrenciasEventos,
      'decisao'
    );

    if (decisao) {
      return {
        ...estadoBase,
        novosLogs,
        eventoDisparado: decisao,
        acontecimentoResolvido: null,
        ocorrencia: {
          eventId: decisao.id,
          idade: novaIdade,
          ano: novoAno,
          categoria: decisao.categoria,
          natureza: 'decisao'
        }
      };
    }
    // Sem decisão elegível, o ano rebaixa para acontecimento. O caminho
    // inverso NUNCA existe: um ano que o ritmo destinou a acontecimento
    // jamais vira pergunta por falta de conteúdo — isso furaria o teto de
    // decisões e a regra de autonomia por idade.
  }

  // -------------------------------------------------------- Acontecimento
  const acontecimento = sortearEventoDoAno(
    char, car, edu, eco, fam,
    historicoEventosDisparados, personalidade, historicoOcorrenciasEventos,
    'acontecimento'
  );

  if (!acontecimento) {
    return {
      ...estadoBase,
      novosLogs,
      eventoDisparado: null,
      acontecimentoResolvido: null,
      ocorrencia: null
    };
  }

  const desfechoBruto = sortearDesfecho(acontecimento, char, eco, personalidade);
  if (!desfechoBruto) {
    // Nenhum desfecho viável para este personagem agora — o acontecimento
    // simplesmente não se aplica. Nada é narrado e nada é registrado.
    return {
      ...estadoBase,
      novosLogs,
      eventoDisparado: null,
      acontecimentoResolvido: null,
      ocorrencia: null
    };
  }

  // Regra dura: o desfecho perde a marca de escolha ANTES de ser aplicado.
  // A pessoa não decidiu nada aqui, então nada aqui molda a personalidade
  // dela (ver `events/happenings.desfechoSemMarcaDeEscolha`). Por isso
  // também não passamos contexto de personalidade — não há escolha para
  // registrar na memória.
  const desfecho = desfechoSemMarcaDeEscolha(desfechoBruto);
  const res = aplicarConsequenciasEscolha(
    desfecho, char, car, edu, eco, fam, novoAno,
    undefined,
    { categoriaLog: categoriaDeLogDoEvento(acontecimento), relevancia: 'normal' }
  );

  const ocorrencia: EventOccurrence = {
    eventId: acontecimento.id,
    idade: novaIdade,
    ano: novoAno,
    categoria: acontecimento.categoria,
    natureza: 'acontecimento'
  };

  if (res.morreu) {
    const patFinal = calcularPatrimonioLiquido(res.economiaAtualizada);
    const causa = res.causaMorte || 'Incidente inesperado';
    const logsMorte = [
      ...novosLogs,
      ...res.novosLogs,
      {
        id: generateId('log'),
        idade: novaIdade,
        ano: novoAno,
        categoria: 'morte' as const,
        texto: `Você faleceu aos ${novaIdade} anos devido a ${causa.toLowerCase()}.`,
        tipo: 'negativo' as const,
        relevancia: 'marco' as const
      }
    ];

    return {
      personagemAtualizado: res.personagemAtualizado,
      familiaAtualizada: res.familiaAtualizada,
      educacaoAtualizada: res.educacaoAtualizada,
      carreiraAtualizada: res.carreiraAtualizada,
      economiaAtualizada: res.economiaAtualizada,
      novosLogs: logsMorte,
      eventoDisparado: null,
      acontecimentoResolvido: acontecimento,
      ocorrencia,
      ritmo,
      morreu: true,
      resumoMorte: construirResumoMorte(
        res.personagemAtualizado,
        res.familiaAtualizada,
        res.carreiraAtualizada,
        res.educacaoAtualizada,
        patFinal,
        causa
      )
    };
  }

  return {
    personagemAtualizado: res.personagemAtualizado,
    familiaAtualizada: res.familiaAtualizada,
    educacaoAtualizada: res.educacaoAtualizada,
    carreiraAtualizada: res.carreiraAtualizada,
    economiaAtualizada: res.economiaAtualizada,
    novosLogs: [...novosLogs, ...res.novosLogs],
    eventoDisparado: null,
    acontecimentoResolvido: acontecimento,
    ocorrencia,
    ritmo,
    morreu: false
  };
}

/**
 * Diagnóstico de ritmo para os caminhos em que o ano nem chega a ser
 * avaliado (morte). Mantém `AgingResult.ritmo` sempre preenchido, para que
 * simulações não precisem tratar `undefined` em todo lugar.
 */
function ritmoSilencioso(idade: number, motivo: string): DiagnosticoRitmo {
  return {
    pulso: 'silencio',
    faixa: obterFaixaDeRitmo(idade),
    chanceDeAlgoAcontecer: 0,
    chanceDeSerDecisao: 0,
    decisoesNaJanela: 0,
    anosDeSecura: 0,
    motivo
  };
}
