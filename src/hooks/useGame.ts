import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Character,
  EducationState,
  CareerState,
  EconomyState,
  EventOccurrence,
  FamilyInteractionType,
  FamilyMember,
  GameEvent,
  GameState,
  Gender,
  LifeLogEntry,
  PersonalityState,
  PostMortemSummary,
  SocialClass,
  VisibleStats
} from '../types';
import {
  construirResumoAnual,
  type ResumoAnual
} from '../presentation/outcomePresentation';
import {
  sortearCidade,
  sortearNome,
  sortearSobrenome
} from '../data/brazilianData';
import { CURSOS_DISPONIVEIS } from '../data/coursesData';
import { BICOS_DISPONIVEIS, TODAS_PROFISSOES } from '../data/careersData';
import { IMOVEIS_LOJA, VEICULOS_LOJA } from '../data/assetsData';
import { ActivityOption } from '../data/activitiesData';
import { calcularEfeitoAtividade, narrarAtividade } from '../systems/activitySystem';
import { executarPassagemDeAno } from '../systems/agingSystem';
import {
  aplicarConsequenciasEscolha
} from '../systems/eventSystem';
import {
  gerarFamiliaInicial,
  interagirComFamiliar
} from '../systems/familySystem';
import {
  criarEducacaoInicial,
  definirPosturaEscolar,
  ingressarCurso
} from '../systems/educationSystem';
import {
  candidatarEmprego,
  criarCarreiraInicial,
  escolherBico,
  pedirAumento,
  pedirDemissao,
  trabalharMais
} from '../systems/careerSystem';
import {
  aplicarInvestimento,
  calcularPatrimonioLiquido,
  comprarBem,
  criarEconomiaInicial,
  jogarMegaSena,
  resgatarInvestimento,
  venderBem
} from '../systems/economySystem';
import {
  DatingCandidate,
  iniciarNamoro,
  pedirEmCasamento,
  terminarRelacionamento,
  terFilho
} from '../systems/relationshipSystem';
import { construirResumoMorte } from '../systems/deathSystem';
import {
  ActionId,
  ContextoAcao,
  Disponibilidade,
  ParametrosAcao,
  getActionAvailability
} from '../systems/availabilitySystem';
import {
  carregarJogo,
  limparSave,
  registrarMorteNasEstatisticas,
  salvarJogo,
  VERSAO_SAVE
} from '../systems/saveSystem';
import { criarPersonalidadeInicial } from '../systems/personalitySystem';
import { gerarHistoriaNascimento } from '../utils/narrativeGenerator';
import { clamp, generateId, randomChoice, randomInt } from '../utils/random';
import { sound } from '../utils/sound';

export type ScreenType = 'home' | 'create' | 'game' | 'stats';

export function useGame() {
  const [screen, setScreen] = useState<ScreenType>('home');
  const [activeTab, setActiveTab] = useState<'timeline' | 'familia' | 'carreira' | 'financas' | 'atividades'>('timeline');
  const [hasSavedGame, setHasSavedGame] = useState<boolean>(false);
  const [somLigado, setSomLigado] = useState<boolean>(true);

  // Estados centrais do jogo
  const [personagem, setPersonagem] = useState<Character | null>(null);
  const [familia, setFamilia] = useState<FamilyMember[]>([]);
  const [educacao, setEducacao] = useState<EducationState>(criarEducacaoInicial());
  const [carreira, setCarreira] = useState<CareerState>(criarCarreiraInicial());
  const [economia, setEconomia] = useState<EconomyState>(criarEconomiaInicial('classe_media'));
  const [timeline, setTimeline] = useState<LifeLogEntry[]>([]);
  const [eventoAtivo, setEventoAtivo] = useState<GameEvent | null>(null);
  const [historicoEventos, setHistoricoEventos] = useState<string[]>([]);
  // B4-FIX2 — histórico rico (id + idade + ano); é o que permite checar
  // cooldown/recorrência de verdade, não só "já aconteceu alguma vez".
  const [historicoOcorrencias, setHistoricoOcorrencias] = useState<EventOccurrence[]>([]);
  // B2 — personalidade emergente: acumula padrões de escolhas; nunca exibida como números
  const [personalidade, setPersonalidade] = useState<PersonalityState>(criarPersonalidadeInicial());
  // Ações únicas por ano (atividades, apostas, interações, aumentos); zeradas a cada passagem de ano
  const [acoesRealizadasAno, setAcoesRealizadasAno] = useState<string[]>([]);
  const [isDead, setIsDead] = useState<boolean>(false);
  const [resumoMorte, setResumoMorte] = useState<PostMortemSummary | null>(null);
  const [feedbackMensagem, setFeedbackMensagem] = useState<{ tipo: 'sucesso' | 'info' | 'erro'; texto: string } | null>(null);
  // B4 — apresentação: resumo do último ano vivido e variação dos atributos
  // visíveis desde o ano anterior. Nenhum dos dois influencia o motor.
  const [resumoAnual, setResumoAnual] = useState<ResumoAnual | null>(null);
  const [variacaoAtributos, setVariacaoAtributos] = useState<Partial<VisibleStats>>({});

  // Notificação com auto-dismiss (com cancelamento para não apagar feedback novo)
  const timeoutFeedback = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mostrarFeedback = useCallback((texto: string, tipo: 'sucesso' | 'info' | 'erro' = 'info') => {
    setFeedbackMensagem({ texto, tipo });
    if (timeoutFeedback.current) {
      clearTimeout(timeoutFeedback.current);
    }
    timeoutFeedback.current = setTimeout(() => {
      setFeedbackMensagem(null);
    }, 4000);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutFeedback.current) clearTimeout(timeoutFeedback.current);
    };
  }, []);

  // Contexto completo para a política central de disponibilidade
  const construirContexto = useCallback((): ContextoAcao | null => {
    if (!personagem) return null;
    return { personagem, educacao, carreira, economia, familia, acoesRealizadasAno };
  }, [personagem, educacao, carreira, economia, familia, acoesRealizadasAno]);

  // Porta única de validação: toda ação passa pela política central antes de tocar o motor
  const verificarDisponibilidade = useCallback(
    (actionId: ActionId, params: ParametrosAcao = {}): Disponibilidade | null => {
      const ctx = construirContexto();
      if (!ctx) return null;
      const disp = getActionAvailability(ctx, actionId, params);
      if (disp.kind === 'oculto') {
        mostrarFeedback('Esta ação não está disponível para a sua fase da vida.', 'erro');
        return null;
      }
      if (disp.kind === 'bloqueado') {
        mostrarFeedback(disp.motivo, 'erro');
        return null;
      }
      return disp;
    },
    [construirContexto, mostrarFeedback]
  );

  const registrarAcaoAnual = useCallback((idAcao: string) => {
    setAcoesRealizadasAno(prev => [...prev, idAcao]);
  }, []);

  // Registra acontecimento na Linha da Vida (ordem cronológica; a exibição agrupa por ano)
  const registrarLogs = useCallback((novos: LifeLogEntry[]) => {
    setTimeline(prev => [...prev, ...novos]);
  }, []);

  // Verifica existência de save ao montar
  useEffect(() => {
    const save = carregarJogo();
    if (save && save.personagem && !save.morto) {
      setHasSavedGame(true);
    }
  }, []);

  // Auto-save sempre que houver mudanças relevantes no jogo ativo
  useEffect(() => {
    if (personagem && !isDead && screen === 'game') {
      const estadoParaSalvar: GameState = {
        versao: VERSAO_SAVE,
        personagem,
        familia,
        educacao,
        carreira,
        economia,
        personalidade,
        timeline,
        eventoAtivo,
        historicoEventosDisparados: historicoEventos,
        historicoOcorrenciasEventos: historicoOcorrencias,
        acoesRealizadasAno,
        emJogo: true,
        morto: false
      };
      salvarJogo(estadoParaSalvar);
      setHasSavedGame(true);
    }
  }, [personagem, familia, educacao, carreira, economia, personalidade, timeline, eventoAtivo, historicoEventos, historicoOcorrencias, acoesRealizadasAno, isDead, screen]);

  // Alternar som
  const toggleSom = useCallback(() => {
    setSomLigado(prev => {
      sound.enabled = !prev;
      return !prev;
    });
  }, []);

  // Iniciar Nova Vida
  const criarVida = useCallback((
    nome: string,
    sobrenome: string,
    genero: Gender,
    cidade: string,
    estado: string,
    classeSocialDefinida?: SocialClass
  ) => {
    const classes: SocialClass[] = [
      'vulneravel',
      'trabalhadora',
      'classe_media_baixa',
      'classe_media',
      'classe_alta'
    ];
    const classeSocial = classeSocialDefinida || randomChoice(classes);

    // Atributos Iniciais (Primeira Infância)
    const novoPersonagem: Character = {
      id: generateId('char'),
      nome: nome.trim(),
      sobrenome: sobrenome.trim(),
      genero,
      idade: 0,
      anoAtual: new Date().getFullYear(),
      anoNascimento: new Date().getFullYear(),
      cidade,
      estado,
      classeSocial,
      stats: {
        felicidade: randomInt(70, 95),
        saude: randomInt(75, 95),
        inteligencia: randomInt(40, 85),
        aparencia: randomInt(40, 90)
      },
      hiddenStats: {
        disciplina: randomInt(35, 75),
        sociabilidade: randomInt(40, 80),
        empatia: randomInt(45, 85),
        ambicao: randomInt(35, 80),
        estresse: randomInt(5, 20),
        reputacao: 50,
        condicionamentoFisico: randomInt(40, 75)
      },
      doencas: [],
      flags: {},
      marcos: []
    };

    const novaFamilia = gerarFamiliaInicial(novoPersonagem.sobrenome, classeSocial);
    const novaEducacao = criarEducacaoInicial();
    const novaCarreira = criarCarreiraInicial();
    const novaEconomia = criarEconomiaInicial(classeSocial);

    const pai = novaFamilia.find(f => f.tipo === 'pai');
    const mae = novaFamilia.find(f => f.tipo === 'mae');
    const logsNascimentoTextos = gerarHistoriaNascimento(novoPersonagem, pai, mae);

    const logsIniciais: LifeLogEntry[] = logsNascimentoTextos.map((texto, idx) => ({
      id: generateId(`log_init_${idx}`),
      idade: 0,
      ano: novoPersonagem.anoAtual,
      categoria: 'geral',
      texto,
      tipo: idx === 0 ? 'importante' : 'info'
    }));

    setPersonagem(novoPersonagem);
    setFamilia(novaFamilia);
    setEducacao(novaEducacao);
    setCarreira(novaCarreira);
    setEconomia(novaEconomia);
    setTimeline(logsIniciais);
    setPersonalidade(criarPersonalidadeInicial());
    setEventoAtivo(null);
    setHistoricoEventos([]);
    setHistoricoOcorrencias([]);
    setAcoesRealizadasAno([]);
    setIsDead(false);
    setResumoMorte(null);
    setActiveTab('timeline');
    setScreen('game');

    sound.playSuccess();
    const boasVindas =
      genero === 'masculino'
        ? `Bem-vindo ao mundo, ${novoPersonagem.nome}!`
        : genero === 'feminino'
        ? `Bem-vinda ao mundo, ${novoPersonagem.nome}!`
        : `Boas-vindas ao mundo, ${novoPersonagem.nome}!`;
    mostrarFeedback(boasVindas, 'sucesso');
  }, [mostrarFeedback]);

  // Gerar Vida Aleatória
  const gerarVidaAleatoria = useCallback(() => {
    const generos: Gender[] = ['masculino', 'feminino'];
    const genero = randomChoice(generos);
    const nome = sortearNome(genero);
    const sobrenome = sortearSobrenome();
    const cidadeObj = sortearCidade();

    criarVida(nome, sobrenome, genero, cidadeObj.cidade, cidadeObj.estado);
  }, [criarVida]);

  // Carregar Jogo Salvo (normalizado/migrado pelo saveSystem)
  const continuarJogoSalvo = useCallback(() => {
    const save = carregarJogo();
    if (save && save.personagem) {
      setPersonagem(save.personagem);
      setFamilia(save.familia);
      setEducacao(save.educacao);
      setCarreira(save.carreira);
      setEconomia(save.economia);
      setPersonalidade(save.personalidade);
      setTimeline(save.timeline);
      setEventoAtivo(save.eventoAtivo);
      setHistoricoEventos(save.historicoEventosDisparados || []);
      setHistoricoOcorrencias(save.historicoOcorrenciasEventos || []);
      setAcoesRealizadasAno(save.acoesRealizadasAno || []);
      setIsDead(save.morto);
      setResumoMorte(save.resumoMorte || null);
      setScreen('game');
      sound.playClick();
      mostrarFeedback('Jogo carregado com sucesso!', 'sucesso');
    } else {
      mostrarFeedback('Não foi possível carregar a partida salva.', 'erro');
    }
  }, [mostrarFeedback]);

  // Passagem de Ano (+ 1 ANO)
  const envelhecerAno = useCallback(() => {
    if (!personagem || isDead || eventoAtivo) return;

    sound.playAgeUp();

    const resultado = executarPassagemDeAno(
      personagem,
      familia,
      educacao,
      carreira,
      economia,
      historicoEventos,
      personalidade,
      historicoOcorrencias
    );

    // Variação dos atributos visíveis no ano — mantém perceptível a mudança
    // produzida pela passagem de tempo, sem expor nada interno.
    const statsAntes = personagem.stats;
    const statsDepois = resultado.personagemAtualizado.stats;
    setVariacaoAtributos({
      felicidade: statsDepois.felicidade - statsAntes.felicidade,
      saude: statsDepois.saude - statsAntes.saude,
      inteligencia: statsDepois.inteligencia - statsAntes.inteligencia,
      aparencia: statsDepois.aparencia - statsAntes.aparencia
    });

    setPersonagem(resultado.personagemAtualizado);
    setFamilia(resultado.familiaAtualizada);
    setEducacao(resultado.educacaoAtualizada);
    setCarreira(resultado.carreiraAtualizada);
    setEconomia(resultado.economiaAtualizada);
    setTimeline(prev => [...prev, ...resultado.novosLogs]);
    // Ano novo: compromissos e ações únicas do ano anterior são liberados
    setAcoesRealizadasAno([]);

    if (resultado.morreu && resultado.resumoMorte) {
      setIsDead(true);
      setResumoMorte(resultado.resumoMorte);
      limparSave();
      registrarMorteNasEstatisticas(resultado.resumoMorte);
      sound.playDeath();
      return;
    }

    // B4 — resumo do ano montado a partir dos logs que o motor acabou de
    // gerar. É apresentação derivada: não cria acontecimento nem altera estado.
    setResumoAnual(
      construirResumoAnual(
        resultado.personagemAtualizado.idade,
        resultado.personagemAtualizado.anoAtual,
        resultado.novosLogs
      )
    );

    if (resultado.eventoDisparado) {
      const idadeOcorrencia = resultado.personagemAtualizado.idade;
      const anoOcorrencia = resultado.personagemAtualizado.anoAtual;
      setEventoAtivo(resultado.eventoDisparado);
      setHistoricoEventos(prev => [...prev, resultado.eventoDisparado!.id]);
      setHistoricoOcorrencias(prev => [
        ...prev,
        { eventId: resultado.eventoDisparado!.id, idade: idadeOcorrencia, ano: anoOcorrencia }
      ]);
      sound.playEvent();
    }
  }, [personagem, isDead, eventoAtivo, familia, educacao, carreira, economia, historicoEventos, historicoOcorrencias, personalidade]);

  // Fecha o resumo anual (apenas apresentação).
  const fecharResumoAnual = useCallback(() => {
    setResumoAnual(null);
  }, []);

  // Responder a Escolha de um Evento
  //
  // Retorna `true` quando o motor aceitou a escolha e `false` quando recusou.
  // B4: o evento NÃO é fechado aqui. A interface mostra o resultado no mesmo
  // contexto e só então chama `fecharEvento`. Isso não altera nenhuma regra:
  // os efeitos continuam sendo aplicados exatamente uma vez, no mesmo ponto.
  const responderEvento = useCallback((opcaoId: string): boolean => {
    if (!eventoAtivo || !personagem) return false;

    const opcao = eventoAtivo.opcoes.find(o => o.id === opcaoId);
    if (!opcao) return false;

    sound.playClick();

    const res = aplicarConsequenciasEscolha(
      opcao,
      personagem,
      carreira,
      educacao,
      economia,
      familia,
      personagem.anoAtual,
      // B2 — memória de escolhas + traços de personalidade (idempotente por evento/opção/idade)
      { eventoId: eventoAtivo.id, personalidade }
    );

    // Requisito da opção não cumprido: o motor recusa sem efeitos e o evento continua aberto
    if (res.recusado) {
      mostrarFeedback(res.mensagemRecusa || 'Você não cumpre os requisitos para esta escolha.', 'erro');
      return false;
    }

    setPersonagem(res.personagemAtualizado);
    setCarreira(res.carreiraAtualizada);
    setEducacao(res.educacaoAtualizada);
    setEconomia(res.economiaAtualizada);
    setFamilia(res.familiaAtualizada);
    if (res.personalidadeAtualizada) {
      setPersonalidade(res.personalidadeAtualizada);
    }
    setTimeline(prev => [...prev, ...res.novosLogs]);
    // O evento permanece aberto para exibir o resultado; `fecharEvento`
    // encerra o momento depois que o jogador lê a consequência.

    if (res.morreu) {
      setIsDead(true);
      const patFinal = calcularPatrimonioLiquido(res.economiaAtualizada);
      const resumo = construirResumoMorte(
        res.personagemAtualizado,
        res.familiaAtualizada,
        res.carreiraAtualizada,
        res.educacaoAtualizada,
        patFinal,
        res.causaMorte || 'Incidente inesperado'
      );
      setResumoMorte(resumo);
      limparSave();
      registrarMorteNasEstatisticas(resumo);
      sound.playDeath();
      // A morte encerra o momento imediatamente: a tela de obituário assume.
      setEventoAtivo(null);
    }

    return true;
  }, [eventoAtivo, personagem, carreira, educacao, economia, familia, personalidade, mostrarFeedback]);

  // Encerra o evento depois que o jogador leu o resultado (B4).
  // Apenas apresentação: nenhum efeito de jogo é aplicado aqui.
  const fecharEvento = useCallback(() => {
    setEventoAtivo(null);
  }, []);

  // Interagir com Familiar
  const acaoFamilia = useCallback((
    membroId: string,
    tipoAcao: FamilyInteractionType,
    presenteTipo?: 'barato' | 'medio' | 'luxo'
  ) => {
    if (!personagem) return;
    const membro = familia.find(f => f.id === membroId);
    if (!membro) return;

    if (!verificarDisponibilidade('interagir_familia', { membroId, tipoInteracao: tipoAcao })) {
      return;
    }

    const res = interagirComFamiliar(membro, personagem, tipoAcao, presenteTipo);

    if (res.custoDinheiro > 0 && economia.dinheiro < res.custoDinheiro) {
      mostrarFeedback('Você não possui dinheiro suficiente para este presente.', 'erro');
      return;
    }

    sound.playClick();

    setPersonagem(res.personagemAtualizado);
    setFamilia(prev => prev.map(f => f.id === membroId ? res.membroAtualizado : f));
    setEconomia(prev => ({
      ...prev,
      dinheiro: prev.dinheiro - res.custoDinheiro + res.dinheiroGanho
    }));
    registrarAcaoAnual(`familia:${membroId}:${tipoAcao}`);

    const novoLog: LifeLogEntry = {
      id: generateId('log'),
      idade: personagem.idade,
      ano: personagem.anoAtual,
      categoria: 'familia',
      texto: res.mensagem,
      tipo: res.sucesso ? 'positivo' : 'negativo'
    };
    registrarLogs([novoLog]);
    mostrarFeedback(res.mensagem, res.sucesso ? 'sucesso' : 'info');
  }, [personagem, familia, economia.dinheiro, mostrarFeedback, verificarDisponibilidade, registrarAcaoAnual, registrarLogs]);

  // Definir a postura escolar do ano (compromisso; efeitos na virada do ano)
  const acaoEscolaExec = useCallback((acao: 'estudar' | 'matar_aula' | 'socializar') => {
    if (!personagem) return;
    if (!verificarDisponibilidade('definir_postura_escolar', { postura: acao })) return;

    sound.playClick();
    const res = definirPosturaEscolar(acao, educacao);
    if (res.sucesso && res.educacaoAtualizada) {
      setEducacao(res.educacaoAtualizada);
      mostrarFeedback(res.mensagem, 'info');
    } else {
      mostrarFeedback(res.mensagem, 'erro');
    }
  }, [personagem, educacao, mostrarFeedback, verificarDisponibilidade]);

  const matricularCursoExec = useCallback((cursoId: string, tipoInst: 'publica' | 'privada') => {
    if (!personagem) return;
    const curso = CURSOS_DISPONIVEIS.find(c => c.id === cursoId);
    if (!curso) return;

    if (!verificarDisponibilidade('ingressar_curso', { cursoId })) return;

    sound.playClick();
    const res = ingressarCurso(curso, tipoInst, personagem, educacao, personagem.anoAtual);

    if (res.sucesso && res.educacaoAtualizada) {
      sound.playSuccess();
      setEducacao(prev => ({ ...prev, ...res.educacaoAtualizada }));
      if (res.novoLog) {
        registrarLogs([res.novoLog]);
      }
      mostrarFeedback(res.mensagem, 'sucesso');
    } else {
      mostrarFeedback(res.mensagem, 'erro');
    }
  }, [personagem, educacao, mostrarFeedback, verificarDisponibilidade, registrarLogs]);

  // Ações de Carreira
  const candidatarVagaExec = useCallback((jobId: string) => {
    if (!personagem) return;
    const job = TODAS_PROFISSOES.find(j => j.id === jobId);
    if (!job) return;

    if (!verificarDisponibilidade('candidatar_emprego', { jobId })) return;

    sound.playClick();
    // O motor revalida idade e escolaridade (fonte de verdade: EducationState)
    const res = candidatarEmprego(job, personagem, educacao, personagem.anoAtual);

    if (res.sucesso && res.novoCargo) {
      sound.playSuccess();
      setCarreira(prev => ({
        ...prev,
        empregado: true,
        cargoAtual: res.novoCargo,
        anosNoCargo: 0,
        desempenhoTrabalho: 60
      }));
      if (res.novoLog) {
        registrarLogs([res.novoLog]);
      }
      mostrarFeedback(res.mensagem, 'sucesso');
    } else {
      mostrarFeedback(res.mensagem, 'erro');
    }
  }, [personagem, educacao, mostrarFeedback, verificarDisponibilidade, registrarLogs]);

  const trabalharMaisExec = useCallback(() => {
    if (!personagem) return;
    if (!verificarDisponibilidade('trabalhar_mais')) return;

    sound.playClick();
    const res = trabalharMais(carreira, personagem);
    if (res.sucesso && res.carreiraAtualizada) {
      setCarreira(res.carreiraAtualizada);
      mostrarFeedback(res.mensagem, 'sucesso');
    } else {
      mostrarFeedback(res.mensagem, 'erro');
    }
  }, [personagem, carreira, mostrarFeedback, verificarDisponibilidade]);

  const pedirAumentoExec = useCallback(() => {
    if (!personagem) return;
    if (!verificarDisponibilidade('pedir_aumento')) return;

    sound.playClick();
    const res = pedirAumento(carreira, personagem, personagem.anoAtual);
    setCarreira(res.carreiraAtualizada);
    setPersonagem(res.personagemAtualizado);
    if (res.novoLog) {
      registrarLogs([res.novoLog]);
    }
    registrarAcaoAnual('pedir_aumento');
    mostrarFeedback(res.mensagem, res.sucesso ? 'sucesso' : 'erro');
  }, [personagem, carreira, mostrarFeedback, verificarDisponibilidade, registrarAcaoAnual, registrarLogs]);

  const pedirDemissaoExec = useCallback(() => {
    if (!personagem) return;
    if (!verificarDisponibilidade('pedir_demissao')) return;

    sound.playClick();
    const res = pedirDemissao(carreira, personagem.anoAtual, personagem.idade);
    setCarreira(res.carreiraAtualizada);
    registrarLogs([res.novoLog]);
    mostrarFeedback('Você pediu demissão e agora está disponível para novos desafios.', 'info');
  }, [personagem, carreira, mostrarFeedback, verificarDisponibilidade, registrarLogs]);

  const fazerBicoExec = useCallback((bicoId: string) => {
    if (!personagem) return;
    const bico = BICOS_DISPONIVEIS.find(b => b.id === bicoId);
    if (!bico) return;

    if (!verificarDisponibilidade('fazer_bico', { bicoId })) return;

    sound.playClick();
    // Compromisso anual: o pagamento acontece na passagem do ano (uma única vez)
    const res = escolherBico(bicoId, carreira, personagem, educacao, economia);
    if (res.sucesso && res.carreiraAtualizada) {
      setCarreira(res.carreiraAtualizada);
      mostrarFeedback(res.mensagem, 'sucesso');
    } else {
      mostrarFeedback(res.mensagem, 'erro');
    }
  }, [personagem, carreira, educacao, economia, mostrarFeedback, verificarDisponibilidade]);

  // Ações de Economia & Bens
  const comprarBemExec = useCallback((itemId: string) => {
    if (!personagem) return;
    const item = [...IMOVEIS_LOJA, ...VEICULOS_LOJA].find(i => i.id === itemId);
    if (!item) return;

    if (!verificarDisponibilidade('comprar_bem', { itemId })) return;

    sound.playClick();
    // O motor revalida idade e saldo antes de qualquer efeito
    const res = comprarBem(item, economia, personagem, personagem.anoAtual);

    if (res.sucesso && res.economiaAtualizada && res.personagemAtualizado) {
      sound.playMoney();
      setEconomia(res.economiaAtualizada);
      setPersonagem(res.personagemAtualizado);
      if (res.novoLog) {
        registrarLogs([res.novoLog]);
      }
      mostrarFeedback(res.mensagem, 'sucesso');
    } else {
      mostrarFeedback(res.mensagem, 'erro');
    }
  }, [personagem, economia, mostrarFeedback, verificarDisponibilidade, registrarLogs]);

  const venderBemExec = useCallback((propId: string) => {
    if (!personagem) return;
    if (!verificarDisponibilidade('vender_bem', { propId })) return;

    sound.playClick();
    const res = venderBem(propId, economia, personagem, personagem.anoAtual);
    if (res.sucesso && res.economiaAtualizada) {
      sound.playMoney();
      setEconomia(res.economiaAtualizada);
      if (res.novoLog) {
        registrarLogs([res.novoLog]);
      }
      mostrarFeedback(res.mensagem, 'sucesso');
    } else {
      mostrarFeedback(res.mensagem, 'erro');
    }
  }, [personagem, economia, mostrarFeedback, verificarDisponibilidade, registrarLogs]);

  const investirExec = useCallback((tipoId: 'poupanca' | 'tesouro_selic' | 'fundo_imobiliario' | 'acoes_b3' | 'cripto', valor: number) => {
    if (!personagem) return;
    if (!verificarDisponibilidade('investir', { itemId: tipoId })) return;

    sound.playClick();
    const res = aplicarInvestimento(tipoId, valor, economia, personagem);
    if (res.sucesso && res.economiaAtualizada) {
      setEconomia(res.economiaAtualizada);
      mostrarFeedback(res.mensagem, 'sucesso');
    } else {
      mostrarFeedback(res.mensagem, 'erro');
    }
  }, [personagem, economia, mostrarFeedback, verificarDisponibilidade]);

  const resgatarInvestimentoExec = useCallback((tipoId: string, valor: number) => {
    if (!personagem) return;
    if (!verificarDisponibilidade('resgatar_investimento', { itemId: tipoId })) return;

    sound.playClick();
    const res = resgatarInvestimento(tipoId, valor, economia, personagem);
    if (res.sucesso && res.economiaAtualizada) {
      setEconomia(res.economiaAtualizada);
      mostrarFeedback(res.mensagem, 'sucesso');
    } else {
      mostrarFeedback(res.mensagem, 'erro');
    }
  }, [personagem, economia, mostrarFeedback, verificarDisponibilidade]);

  const jogarLoteriaExec = useCallback(() => {
    if (!personagem) return;
    if (!verificarDisponibilidade('jogar_loteria')) return;

    sound.playClick();
    // O motor revalida idade e saldo; a aposta é uma decisão única por ano
    const res = jogarMegaSena(economia, personagem, personagem.anoAtual);

    if (res.sucesso && res.economiaAtualizada && res.personagemAtualizado) {
      setEconomia(res.economiaAtualizada);
      setPersonagem(res.personagemAtualizado);
      registrarAcaoAnual('loteria_mega_sena');
      if (res.ganhou) {
        sound.playSuccess();
        if (res.novoLog) registrarLogs([res.novoLog]);
      }
      mostrarFeedback(res.mensagem, res.ganhou ? 'sucesso' : 'info');
    } else {
      mostrarFeedback(res.mensagem, 'erro');
    }
  }, [personagem, economia, mostrarFeedback, verificarDisponibilidade, registrarAcaoAnual, registrarLogs]);

  // Ações de Atividades & Saúde (uma vez por ano por atividade)
  const executarAtividade = useCallback((atividade: ActivityOption) => {
    if (!personagem) return;

    if (!verificarDisponibilidade('executar_atividade', { atividadeId: atividade.id })) return;

    sound.playClick();

    // O balanceamento vive em `activitySystem`; aqui só orquestramos o estado.
    const efeito = calcularEfeitoAtividade(atividade.id);

    setEconomia(prev => ({ ...prev, dinheiro: prev.dinheiro - atividade.custo }));

    if (efeito.relacionamentoFamiliar !== 0) {
      setFamilia(prev => prev.map(f => ({
        ...f,
        relacionamento: clamp(f.relacionamento + efeito.relacionamentoFamiliar, 0, 100)
      })));
    }

    setPersonagem(prev => prev ? ({
      ...prev,
      stats: {
        felicidade: clamp(prev.stats.felicidade + (efeito.stats.felicidade ?? 0), 0, 100),
        saude: clamp(prev.stats.saude + (efeito.stats.saude ?? 0), 0, 100),
        aparencia: clamp(prev.stats.aparencia + (efeito.stats.aparencia ?? 0), 0, 100),
        inteligencia: clamp(prev.stats.inteligencia + (efeito.stats.inteligencia ?? 0), 0, 100)
      },
      hiddenStats: {
        ...prev.hiddenStats,
        estresse: clamp(prev.hiddenStats.estresse + (efeito.hiddenStats.estresse ?? 0), 0, 100),
        sociabilidade: clamp(prev.hiddenStats.sociabilidade + (efeito.hiddenStats.sociabilidade ?? 0), 0, 100),
        empatia: clamp(prev.hiddenStats.empatia + (efeito.hiddenStats.empatia ?? 0), 0, 100),
        condicionamentoFisico: clamp(prev.hiddenStats.condicionamentoFisico + (efeito.hiddenStats.condicionamentoFisico ?? 0), 0, 100),
        reputacao: clamp(prev.hiddenStats.reputacao + (efeito.hiddenStats.reputacao ?? 0), 0, 100)
      }
    }) : null);

    registrarAcaoAnual(`atividade:${atividade.id}`);

    const log: LifeLogEntry = {
      id: generateId('log'),
      idade: personagem.idade,
      ano: personagem.anoAtual,
      categoria: 'saude',
      texto: narrarAtividade(atividade, personagem),
      tipo: 'positivo'
    };
    registrarLogs([log]);
    mostrarFeedback(`${atividade.nome} concluída com sucesso!`, 'sucesso');
  }, [personagem, mostrarFeedback, verificarDisponibilidade, registrarAcaoAnual, registrarLogs]);

  // Ações de Relacionamentos Românticos (sistema adulto: 18+)
  const iniciarNamoroExec = useCallback((candidato: DatingCandidate) => {
    if (!personagem) return;
    if (!verificarDisponibilidade('iniciar_namoro')) return;

    const res = iniciarNamoro(candidato, personagem, personagem.anoAtual);
    if (!res.sucesso || !res.novoMembro || !res.personagemAtualizado || !res.novoLog) {
      mostrarFeedback(res.mensagem, 'erro');
      return;
    }

    sound.playSuccess();
    setFamilia(prev => [...prev, res.novoMembro!]);
    setPersonagem(res.personagemAtualizado);
    registrarLogs([res.novoLog]);
    mostrarFeedback(`Você e ${candidato.nome} agora estão namorando!`, 'sucesso');
  }, [personagem, mostrarFeedback, verificarDisponibilidade, registrarLogs]);

  const pedirCasamentoExec = useCallback((parceiroId: string) => {
    if (!personagem) return;
    const parceiro = familia.find(f => f.id === parceiroId);
    if (!parceiro) return;

    if (!verificarDisponibilidade('pedir_casamento', { membroId: parceiroId })) return;

    sound.playClick();
    const res = pedirEmCasamento(parceiro, personagem, personagem.anoAtual);

    if (res.sucesso && res.parceiroAtualizado && res.personagemAtualizado) {
      sound.playSuccess();
      setFamilia(prev => prev.map(f => f.id === parceiroId ? res.parceiroAtualizado! : f));
      setPersonagem(res.personagemAtualizado);
      if (res.novoLog) registrarLogs([res.novoLog]);
      mostrarFeedback(res.mensagem, 'sucesso');
    } else {
      mostrarFeedback(res.mensagem, 'erro');
    }
  }, [personagem, familia, mostrarFeedback, verificarDisponibilidade, registrarLogs]);

  const terFilhoExec = useCallback((parceiroId?: string, nome?: string, genero?: Gender) => {
    if (!personagem) return;
    if (!verificarDisponibilidade('ter_filho', { membroId: parceiroId })) return;

    const parceiro = parceiroId ? (familia.find(f => f.id === parceiroId) || null) : null;

    const res = terFilho(parceiro, personagem, nome, genero, personagem.anoAtual);
    if (!res.sucesso || !res.novoFilho || !res.personagemAtualizado || !res.novoLog) {
      mostrarFeedback(res.mensagem, 'erro');
      return;
    }

    sound.playSuccess();
    setFamilia(prev => [...prev, res.novoFilho!]);
    setPersonagem(res.personagemAtualizado);
    registrarLogs([res.novoLog]);
    mostrarFeedback(`${res.novoFilho.nome} nasceu com saúde!`, 'sucesso');
  }, [personagem, familia, mostrarFeedback, verificarDisponibilidade, registrarLogs]);

  const terminarRelacionamentoExec = useCallback((parceiroId: string) => {
    if (!personagem) return;
    const parceiro = familia.find(f => f.id === parceiroId);
    if (!parceiro) return;

    if (!verificarDisponibilidade('terminar_relacionamento', { membroId: parceiroId })) return;

    sound.playClick();
    const res = terminarRelacionamento(parceiro, personagem, personagem.anoAtual);
    setFamilia(prev => prev.filter(f => f.id !== parceiroId));
    setPersonagem(res.personagemAtualizado);
    registrarLogs([res.novoLog]);
    mostrarFeedback(`Relacionamento com ${parceiro.nome} encerrado.`, 'info');
  }, [personagem, familia, mostrarFeedback, verificarDisponibilidade, registrarLogs]);

  // Reiniciar Jogo
  const reiniciarJogo = useCallback(() => {
    limparSave();
    setPersonagem(null);
    setFamilia([]);
    setEducacao(criarEducacaoInicial());
    setCarreira(criarCarreiraInicial());
    setEconomia(criarEconomiaInicial('classe_media'));
    setTimeline([]);
    setPersonalidade(criarPersonalidadeInicial());
    setEventoAtivo(null);
    setHistoricoEventos([]);
    setHistoricoOcorrencias([]);
    setAcoesRealizadasAno([]);
    setIsDead(false);
    setResumoMorte(null);
    setResumoAnual(null);
    setVariacaoAtributos({});
    setHasSavedGame(false);
    setScreen('home');
    sound.playClick();
  }, []);

  return {
    screen,
    setScreen,
    activeTab,
    setActiveTab,
    hasSavedGame,
    somLigado,
    toggleSom,
    personagem,
    familia,
    educacao,
    carreira,
    economia,
    personalidade,
    timeline,
    eventoAtivo,
    acoesRealizadasAno,
    isDead,
    resumoMorte,
    feedbackMensagem,
    mostrarFeedback,
    construirContexto,
    // B4 — estado de apresentação
    resumoAnual,
    fecharResumoAnual,
    variacaoAtributos,
    fecharEvento,

    // Ações
    criarVida,
    gerarVidaAleatoria,
    continuarJogoSalvo,
    envelhecerAno,
    responderEvento,
    acaoFamilia,
    acaoEscolaExec,
    matricularCursoExec,
    candidatarVagaExec,
    trabalharMaisExec,
    pedirAumentoExec,
    pedirDemissaoExec,
    fazerBicoExec,
    comprarBemExec,
    venderBemExec,
    investirExec,
    resgatarInvestimentoExec,
    jogarLoteriaExec,
    executarAtividade,
    iniciarNamoroExec,
    pedirCasamentoExec,
    terFilhoExec,
    terminarRelacionamentoExec,
    reiniciarJogo
  };
}
