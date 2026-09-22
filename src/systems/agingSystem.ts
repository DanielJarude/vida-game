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
  PostMortemSummary,
  taxonomiaPermiteComposicao
} from '../types';
import {
  aplicarEnvelhecimentoAtributos,
  normalizarHiddenStats,
  normalizarStats
} from './attributeSystem';
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
  SATURACAO_ESTRUTURAL,
  type DiagnosticoRitmo
} from './pacing/lifeRhythm';
import { avaliarCondicoesEstruturais } from './events/eligibility';
import { marcarMarcoCumprido, marcosDevidos } from './calendario/calendario';
import {
  criarCalendarioInicial,
  type EstadoCalendario,
  type MarcoDeVida
} from './calendario/tipos';
import { MARCOS_DE_VIDA } from '../data/calendario/marcosDeVida';
import { MASTER_EVENTS_LIST } from '../data/events/allEvents';
import { instanteDe } from './tempo/instante';
import { classificacaoDoEvento } from './events/taxonomia';
import { gerarPequenaMemoria } from './memorias/pequenaMemoria';
import { processarAnoSocial } from './social/redeSocial';
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
  /**
   * F3-FIX — TODAS as ocorrências do ano, na ordem em que entraram na vida.
   *
   * Um ano podia conter no máximo um conteúdo, então `ocorrencia` (singular)
   * bastava. Desde que marco e acontecimento leve podem coexistir, ele não
   * basta mais: registrar só o primeiro faria o segundo escapar do controle
   * de repetição e cooldown, e ele voltaria a sair no ano seguinte.
   *
   * `ocorrencia` continua existindo e apontando para a PRIMEIRA — é o
   * conteúdo principal do ano, e nenhum chamador antigo quebra. Quem grava
   * histórico deve usar esta lista.
   */
  ocorrenciasDoAno: EventOccurrence[];
  /** Diagnóstico do ritmo do ano — depuração, testes e simulação. Nunca exibido. */
  ritmo: DiagnosticoRitmo;
  /**
   * F3 — estado do Calendário da Vida depois do ano. Vem sempre preenchido:
   * a camada de comandos grava isto em vez de remontar por conta própria,
   * que é o que faria um marco cumprido reocorrer depois de um reload.
   */
  calendario: EstadoCalendario;
  /**
   * F3 — marco que o calendário disparou neste ano, se houve. Serve a
   * teste, simulação e histórico; as consequências já estão aplicadas
   * (marco testemunhado) ou o evento subiu em `eventoDisparado` (marco com
   * escolha).
   */
  marcoDoAno: MarcoDeVida | null;
  morreu: boolean;
  resumoMorte?: PostMortemSummary;
}

/**
 * Categorias que NÃO contam como acontecimento estrutural do ano.
 * 'geral' é enquadramento e 'cotidiano' é textura de fundo: nenhuma das
 * duas ocupa o ano a ponto de dispensar um evento interativo.
 *
 * F3 — este conjunto continua valendo apenas como FALLBACK, para entradas
 * que não declaram `relevancia` (saves antigos). Ver `ocupaOAno` abaixo.
 */
const CATEGORIAS_NAO_ESTRUTURAIS = new Set(['geral', 'cotidiano']);

/**
 * Esta entrada da Linha da Vida ocupa o ano?
 *
 * F3 — a correção central desta fase, e a que a medição apontou como causa
 * do silêncio adulto.
 *
 * Até aqui, "ocupa o ano" era decidido pela CATEGORIA do log: qualquer coisa
 * que não fosse 'geral'/'cotidiano' contava como acontecimento estrutural, e
 * dois deles silenciavam o ano inteiro por regra dura (`SATURACAO_ESTRUTURAL`
 * em `pacing/lifeRhythm`). A intenção era certa — um ano que já entregou
 * "você se formou" e "você foi contratado" não precisa de um modal em cima.
 *
 * O efeito colateral não era: os dois textos mais frequentes do jogo inteiro
 * são o rendimento anual do bico (2.384 ocorrências em 105 vidas) e as horas
 * extras (1.975), ambos de categoria 'financas'/'carreira'. Juntos, eles
 * saturavam o ano de qualquer adulto empregado — todo ano, pela vida inteira.
 * Medido: 41% dos anos adultos morriam por saturação, e 89,2% dessas mortes
 * vinham só de rotina financeira e profissional. Quanto mais o personagem
 * trabalhava, menos vida ele tinha.
 *
 * A distinção correta não é de assunto, é de RELEVÂNCIA: 'marco' e 'normal'
 * são biografia e ocupam o ano; 'textura' é rotina de fundo e não ocupa.
 * Receber salário não é um acontecimento da vida de alguém — é o pano de
 * fundo contra o qual os acontecimentos aparecem.
 *
 * Compatibilidade: entrada sem `relevancia` (persistida antes da F3) cai na
 * heurística antiga por categoria, então nenhuma vida salva muda de ritmo.
 */
function ocupaOAno(log: LifeLogEntry): boolean {
  if (log.relevancia) return log.relevancia !== 'textura';
  return !CATEGORIAS_NAO_ESTRUTURAIS.has(log.categoria);
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
  historicoOcorrenciasEventos: EventOccurrence[] = [],
  // F3 — estado do Calendário da Vida. Opcional para não quebrar chamadas
  // existentes (testes, simulações): ausência = calendário vazio, e nenhum
  // marco é considerado cumprido, o que é o correto para uma vida nova.
  calendarioAtual: EstadoCalendario = criarCalendarioInicial(),
  // F5-FIX — a Linha da Vida acumulada até aqui. A política de continuidade e
  // o cooldown temático das pequenas memórias são DERIVADOS dela, em vez de
  // um contador persistido: o save continua na versão 5. Opcional para não
  // quebrar chamadas existentes (testes, simulações) — sem ela o
  // comportamento é o da F5.
  timelineAteAqui: readonly LifeLogEntry[] = [],
  // F6 — atividades praticadas no ano (ids de `activitiesData`). Uma
  // atividade social cria EXPOSIÇÃO social, nunca amizade garantida.
  // Opcional: sem ela, o ano social ainda acontece por escola/trabalho/
  // vizinhança, apenas sem a origem 'atividade'.
  atividadesDoAno: readonly string[] = []
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
  // F6 — reatribuída pelo ano social mais abaixo (novas relações, evolução
  // e afastamentos). Até a F5 esta lista não mudava depois daqui.
  let fam = resFam.familiaAtualizada;
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

  // Privação: quando o dinheiro acabou e o crédito também, o aperto deixa
  // de ser um número e passa a ser sentido no corpo. Aplicado aqui porque
  // `economySystem` é puro sobre o estado financeiro e não mexe no
  // personagem — quem costura os dois é a passagem de ano.
  if (resEco.efeitosPrivacao) {
    const priv = resEco.efeitosPrivacao;
    char = {
      ...char,
      stats: normalizarStats({
        ...char.stats,
        saude: char.stats.saude + priv.saude,
        felicidade: char.stats.felicidade + priv.felicidade
      }),
      hiddenStats: normalizarHiddenStats({
        ...char.hiddenStats,
        estresse: char.hiddenStats.estresse + priv.estresse
      })
    };
  }

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
      tipo: 'negativo',
      relevancia: 'marco'
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
      ocorrenciasDoAno: [],
      ritmo: ritmoSilencioso(novaIdade, 'morte no ano'),
      calendario: calendarioAtual,
      marcoDoAno: null,
      morreu: true,
      resumoMorte
    };
  }

  // -------------------------------------------------------------- CALENDÁRIO
  //
  // F3 — este bloco vem ANTES do ritmo e NÃO consulta aleatoriedade. É a
  // diferença estrutural entre "este marco tem peso alto no sorteio" e "este
  // marco vai acontecer".
  //
  // O que ele conserta, medido: `repeticao: 'marco'` só controlava repetição,
  // então *A Primeira Palavra* disputava o sorteio ponderado com todo o resto
  // da faixa e saía em 17% das vidas. Aqui não há disputa: há janela,
  // condição e modo.
  /**
   * F3-FIX — o ano já tem um marco; ele comporta um acontecimento leve junto?
   *
   * Esta é a regra geral que substitui a equivalência "houve marco → ano
   * saturado". Ela não conhece idade, não conhece id e não tem exceção: quem
   * responde é a taxonomia do conteúdo que já ocupou o ano, via
   * `taxonomiaPermiteComposicao`.
   *
   * Três guardas, todas estruturais:
   *
   *   1. só compõe se a taxonomia permitir (marco, com ou sem escolha);
   *   2. o companheiro é sempre um ACONTECIMENTO — nunca uma decisão. Isso
   *      preserva a regra de uma interrupção por ano e mantém intactos o
   *      teto e a fadiga de decisão contextual;
   *   3. a saturação normal continua valendo: se o ano já produziu conteúdo
   *      estrutural por conta própria (formou-se, foi contratado), não há
   *      companhia. É o mesmo `SATURACAO_ESTRUTURAL` de sempre, medido sobre
   *      os logs que o ano gerou.
   *
   * Devolve `null` quando o ano fecha sozinho — que continua sendo o caso
   * mais comum, porque o sorteio de acontecimento pode não achar nada
   * elegível e o silêncio segue permitido.
   */
  const acontecimentoDeCompanhia = (
    conteudoDoMarco: GameEvent,
    estadoApos?: {
      personagem: Character;
      familia: FamilyMember[];
      educacao: EducationState;
      carreira: CareerState;
      economia: EconomyState;
    }
  ): {
    evento: GameEvent;
    ocorrencia: EventOccurrence;
    logs: LifeLogEntry[];
    personagem: Character;
    familia: FamilyMember[];
    educacao: EducationState;
    carreira: CareerState;
    economia: EconomyState;
  } | null => {
    if (!taxonomiaPermiteComposicao(classificacaoDoEvento(conteudoDoMarco))) return null;

    const p = estadoApos?.personagem ?? char;
    const f = estadoApos?.familia ?? fam;
    const ed = estadoApos?.educacao ?? edu;
    const ca = estadoApos?.carreira ?? car;
    const ec = estadoApos?.economia ?? eco;

    // O ano já se contou sozinho? Então nem o marco nem nada mais cabe.
    if (novosLogs.filter(ocupaOAno).length >= SATURACAO_ESTRUTURAL) return null;

    // O marco entra no histórico ANTES do sorteio: sem isso o companheiro
    // poderia ser o próprio conteúdo do marco outra vez.
    const historicoComMarco = [...historicoEventosDisparados, conteudoDoMarco.id];

    const candidato = sortearEventoDoAno(
      p, ca, ed, ec, f,
      historicoComMarco, personalidade, historicoOcorrenciasEventos,
      'acontecimento'
    );
    if (!candidato) return null;

    const bruto = sortearDesfecho(candidato, p, ec, personalidade);
    if (!bruto) return null;

    const res = aplicarConsequenciasEscolha(
      desfechoSemMarcaDeEscolha(bruto),
      p, ca, ed, ec, f, novoAno,
      undefined,
      { categoriaLog: categoriaDeLogDoEvento(candidato), relevancia: 'normal' }
    );
    // Um acontecimento de companhia nunca mata: a morte do ano já foi
    // decidida acima, e deixá-la ser reaberta aqui criaria uma saída de
    // óbito que os chamadores não esperam neste ponto.
    if (res.morreu) return null;

    return {
      evento: candidato,
      ocorrencia: {
        eventId: candidato.id,
        idade: novaIdade,
        ano: novoAno,
        categoria: candidato.categoria,
        natureza: 'acontecimento',
        taxonomia: classificacaoDoEvento(candidato)
      },
      logs: res.novosLogs,
      personagem: res.personagemAtualizado,
      familia: res.familiaAtualizada,
      educacao: res.educacaoAtualizada,
      carreira: res.carreiraAtualizada,
      economia: res.economiaAtualizada
    };
  };

  const instanteAgora = instanteDe(novaIdade);
  const devidos = marcosDevidos(
    calendarioAtual,
    MARCOS_DE_VIDA,
    novaIdade,
    marco =>
      avaliarCondicoesEstruturais(marco.condicao, char, car, edu, eco, fam, personalidade)
  ).filter(
    // Defesa em profundidade. O calendário é a memória primária de que um
    // marco já aconteceu, mas ele não pode ser a ÚNICA: um save da v4 não
    // tem calendário nenhum, e um chamador que esqueça de propagar o estado
    // faria a pessoa dar os primeiros passos outra vez. O histórico de
    // eventos disparados é a segunda testemunha, e já existia desde o
    // B4-FIX2. Se qualquer uma das duas lembra, o marco não se repete.
    marco => !historicoEventosDisparados.includes(marco.conteudoId)
  );

  // Um marco por ano, no máximo. Dois marcos garantidos no mesmo ano seriam
  // dois modais seguidos — o que `idadeTipica` já distribui no catálogo, mas
  // que precisa de uma trava também aqui: condições podem passar a valer
  // tarde e empurrar dois marcos para a mesma virada. Os demais continuam
  // pendentes e saem nos anos seguintes, enquanto a janela permitir.
  const marcoDoAno = devidos[0] ?? null;

  if (marcoDoAno) {
    const conteudo = MASTER_EVENTS_LIST.find(e => e.id === marcoDoAno.conteudoId);

    if (conteudo) {
      const calendarioDepois = marcarMarcoCumprido(
        calendarioAtual,
        marcoDoAno.id,
        instanteAgora
      );
      const ocorrenciaMarco: EventOccurrence = {
        eventId: conteudo.id,
        idade: novaIdade,
        ano: novoAno,
        categoria: conteudo.categoria,
        natureza: marcoDoAno.temEscolha ? 'decisao' : 'acontecimento',
        // A taxonomia é o que impede um marco biográfico de gastar o
        // orçamento de decisão contextual da faixa seguinte.
        taxonomia: classificacaoDoEvento(conteudo)
      };

      // MARCO COM ESCOLHA — sobe para a interface. O jogador participa da
      // própria biografia. Não move personalidade: quem garante isso é
      // `aplicarConsequenciasEscolha`, que consulta a taxonomia do evento
      // (ver a Revisão 1 e `taxonomiaMovePersonalidade`).
      if (marcoDoAno.temEscolha) {
        // O marco já gastou a ÚNICA interrupção do ano (o modal está subindo
        // agora). O que ele não gastou foi o mundo ao redor: se a taxonomia
        // permite composição, o ano ainda pode narrar um acontecimento leve
        // — sem segundo modal, porque acontecimento se resolve sozinho.
        const companhia = acontecimentoDeCompanhia(conteudo);

        return {
          personagemAtualizado: companhia?.personagem ?? char,
          familiaAtualizada: companhia?.familia ?? fam,
          educacaoAtualizada: companhia?.educacao ?? edu,
          carreiraAtualizada: companhia?.carreira ?? car,
          economiaAtualizada: companhia?.economia ?? eco,
          novosLogs: [...novosLogs, ...(companhia?.logs ?? [])],
          eventoDisparado: conteudo,
          acontecimentoResolvido: companhia?.evento ?? null,
          ocorrencia: ocorrenciaMarco,
          ocorrenciasDoAno: [ocorrenciaMarco, ...(companhia ? [companhia.ocorrencia] : [])],
          ritmo: ritmoSilencioso(novaIdade, `marco com escolha: ${marcoDoAno.id}`),
          calendario: calendarioDepois,
          marcoDoAno,
          morreu: false
        };
      }

      // MARCO TESTEMUNHADO — acontece, é narrado, não pergunta nada.
      // Primeiros passos são disso: um bebê de 1 ano não delibera sobre
      // quando vai andar.
      const desfechoMarco = sortearDesfecho(conteudo, char, eco, personalidade);
      if (desfechoMarco) {
        const resMarco = aplicarConsequenciasEscolha(
          desfechoSemMarcaDeEscolha(desfechoMarco),
          char, car, edu, eco, fam, novoAno,
          undefined,
          { categoriaLog: categoriaDeLogDoEvento(conteudo), relevancia: 'marco' }
        );

        // Marco testemunhado não interrompe NADA: ele é narrado e pronto.
        // Este é o caso mais claro de densidade alta com atenção zero, e o
        // que mais sofria com a regra antiga — *Primeiros Passos* calava o
        // ano inteiro sem nunca ter pedido um clique.
        const companhia = acontecimentoDeCompanhia(
          conteudo,
          {
            personagem: resMarco.personagemAtualizado,
            familia: resMarco.familiaAtualizada,
            educacao: resMarco.educacaoAtualizada,
            carreira: resMarco.carreiraAtualizada,
            economia: resMarco.economiaAtualizada
          }
        );

        return {
          personagemAtualizado: companhia?.personagem ?? resMarco.personagemAtualizado,
          familiaAtualizada: companhia?.familia ?? resMarco.familiaAtualizada,
          educacaoAtualizada: companhia?.educacao ?? resMarco.educacaoAtualizada,
          carreiraAtualizada: companhia?.carreira ?? resMarco.carreiraAtualizada,
          economiaAtualizada: companhia?.economia ?? resMarco.economiaAtualizada,
          novosLogs: [...novosLogs, ...resMarco.novosLogs, ...(companhia?.logs ?? [])],
          eventoDisparado: null,
          // Continua sendo o MARCO: ele é o conteúdo principal do ano e é o
          // que testes e auditorias esperam encontrar aqui. O acompanhante
          // aparece em `ocorrenciasDoAno` e já está narrado em `novosLogs`.
          acontecimentoResolvido: conteudo,
          ocorrencia: ocorrenciaMarco,
          ocorrenciasDoAno: [ocorrenciaMarco, ...(companhia ? [companhia.ocorrencia] : [])],
          ritmo: ritmoSilencioso(novaIdade, `marco testemunhado: ${marcoDoAno.id}`),
          calendario: calendarioDepois,
          marcoDoAno,
          morreu: false
        };
      }
    }
  }

  // ------------------------------------------------------------------ RITMO
  //
  // Quantos acontecimentos ESTRUTURAIS este ano já produziu sozinho? Um ano
  // que entregou "você se formou" e "você foi contratado" já contou a
  // própria história — interromper com um evento sorteado em cima disso é
  // ruído, não conteúdo.
  const densidadeEstrutural = novosLogs.filter(ocupaOAno).length;

  const ritmo = definirPulsoDoAno({
    idade: novaIdade,
    historico: historicoDeRitmo(historicoOcorrenciasEventos),
    densidadeEstrutural
  });

  /**
   * F3 passo 7 — a última coisa que o ano tenta, e só quando ele terminaria
   * em branco.
   *
   * Depois do passo 3, 14% dos anos adultos ficaram completamente sem linha:
   * a rotina parou (com razão) de ocupar o ano, mas nada tomou o lugar dela
   * como registro. Esta função preenche esse vazio com uma frase derivada do
   * estado real — e só isso. Se não houver nada verdadeiro a dizer, devolve
   * os logs como estavam e o ano segue em silêncio, que continua permitido.
   */
  /**
   * F6 — O ANO SOCIAL.
   *
   * Roda ANTES da pequena memória de propósito: se uma amizade nasceu ou
   * acabou neste ano, a memória do ano já deve enxergar a rede atualizada
   * (e a memória de amizade da F5-FIX só pode existir havendo amigo real).
   *
   * Não abre modal, não move atributos, não toca em dinheiro nem em
   * personalidade: devolve a família atualizada e, no máximo, uma linha
   * quando a relação passou a importar de verdade.
   */
  const socialDoAno = processarAnoSocial(
    {
      personagem: char,
      educacao: edu,
      carreira: car,
      familia: fam,
      personalidade,
      atividadesDoAno: atividadesDoAno
    },
    novoAno
  );
  fam = socialDoAno.familiaAtualizada;
  novosLogs.push(...socialDoAno.logs);

  const comPequenaMemoria = (logs: LifeLogEntry[]): LifeLogEntry[] => {
    const memoria = gerarPequenaMemoria(
      { personagem: char, carreira: car, educacao: edu, economia: eco, familia: fam },
      logs,
      novaIdade,
      novoAno,
      timelineAteAqui
    );
    return memoria ? [...logs, memoria] : logs;
  };

  const estadoBase = {
    personagemAtualizado: char,
    familiaAtualizada: fam,
    educacaoAtualizada: edu,
    carreiraAtualizada: car,
    economiaAtualizada: eco,
    ritmo,
    // Nenhum marco coube neste ponto do ano: o calendário atravessa
    // inalterado. Ele faz parte do estado base para que TODA saída o
    // devolva — esquecer de propagá-lo numa saída seria perder a memória
    // de marcos cumpridos naquela virada.
    calendario: calendarioAtual,
    marcoDoAno: null as MarcoDeVida | null,
    morreu: false as boolean
  };

  // ---------------------------------------------------------- Ano tranquilo
  //
  // Silêncio continua sendo silêncio: nenhum modal, nenhum acontecimento
  // sorteado, nenhuma decisão. O texto genérico "Um ano sem grandes
  // acontecimentos" que existia aqui até o B4-FIX3 interrompia o jogador
  // exatamente para dizer que nada merecia interrompê-lo, e não voltou.
  //
  // F3 — o que pode acontecer aqui é uma PEQUENA MEMÓRIA: uma linha discreta
  // derivada do estado real (cidade, trabalho, filhos, dívida), e somente se
  // o ano fosse terminar sem nenhuma linha. Ela não é sorteada de uma lista
  // de frases, não abre modal, não move nada, e não existe quando o estado
  // não tem nada verdadeiro a dizer.
  if (ritmo.pulso === 'silencio') {
    return {
      ...estadoBase,
      novosLogs: comPequenaMemoria(novosLogs),
      eventoDisparado: null,
      acontecimentoResolvido: null,
      ocorrencia: null,
      ocorrenciasDoAno: []
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
      const ocorrenciaDecisao: EventOccurrence = {
        eventId: decisao.id,
        idade: novaIdade,
        ano: novoAno,
        categoria: decisao.categoria,
        natureza: 'decisao',
        taxonomia: classificacaoDoEvento(decisao)
      };
      return {
        ...estadoBase,
        novosLogs,
        eventoDisparado: decisao,
        acontecimentoResolvido: null,
        ocorrencia: ocorrenciaDecisao,
        ocorrenciasDoAno: [ocorrenciaDecisao]
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
      novosLogs: comPequenaMemoria(novosLogs),
      eventoDisparado: null,
      acontecimentoResolvido: null,
      ocorrencia: null,
      ocorrenciasDoAno: []
    };
  }

  const desfechoBruto = sortearDesfecho(acontecimento, char, eco, personalidade);
  if (!desfechoBruto) {
    // Nenhum desfecho viável para este personagem agora — o acontecimento
    // simplesmente não se aplica. Nada é narrado e nada é registrado.
    return {
      ...estadoBase,
      novosLogs: comPequenaMemoria(novosLogs),
      eventoDisparado: null,
      acontecimentoResolvido: null,
      ocorrencia: null,
      ocorrenciasDoAno: []
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
    natureza: 'acontecimento',
    taxonomia: classificacaoDoEvento(acontecimento)
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
      ocorrenciasDoAno: [ocorrencia],
      ritmo,
      calendario: calendarioAtual,
      marcoDoAno: null,
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
    ocorrenciasDoAno: [ocorrencia],
    ritmo,
    calendario: calendarioAtual,
    marcoDoAno: null,
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
