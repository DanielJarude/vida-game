import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Character,
  EducationState,
  CareerState,
  EconomyState,
  FamilyMember,
  GameEvent,
  GameState,
  Gender,
  LifeLogEntry,
  PersonalityState,
  PostMortemSummary,
  SocialClass
} from '../types';
import {
  sortearCidade,
  sortearNome,
  sortearSobrenome
} from '../data/brazilianData';
import { CURSOS_DISPONIVEIS } from '../data/coursesData';
import { BICOS_DISPONIVEIS, TODAS_PROFISSOES } from '../data/careersData';
import { IMOVEIS_LOJA, VEICULOS_LOJA } from '../data/assetsData';
import { ActivityOption } from '../data/activitiesData';
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
  // B2 — personalidade emergente: acumula padrões de escolhas; nunca exibida como números
  const [personalidade, setPersonalidade] = useState<PersonalityState>(criarPersonalidadeInicial());
  // Ações únicas por ano (atividades, apostas, interações, aumentos); zeradas a cada passagem de ano
  const [acoesRealizadasAno, setAcoesRealizadasAno] = useState<string[]>([]);
  const [isDead, setIsDead] = useState<boolean>(false);
  const [resumoMorte, setResumoMorte] = useState<PostMortemSummary | null>(null);
  const [feedbackMensagem, setFeedbackMensagem] = useState<{ tipo: 'sucesso' | 'info' | 'erro'; texto: string } | null>(null);

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
        acoesRealizadasAno,
        emJogo: true,
        morto: false
      };
      salvarJogo(estadoParaSalvar);
      setHasSavedGame(true);
    }
  }, [personagem, familia, educacao, carreira, economia, personalidade, timeline, eventoAtivo, historicoEventos, acoesRealizadasAno, isDead, screen]);

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
      personalidade
    );

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

    if (resultado.eventoDisparado) {
      setEventoAtivo(resultado.eventoDisparado);
      setHistoricoEventos(prev => [...prev, resultado.eventoDisparado!.id]);
      sound.playEvent();
    }
  }, [personagem, isDead, eventoAtivo, familia, educacao, carreira, economia, historicoEventos, personalidade]);

  // Responder a Escolha de um Evento
  const responderEvento = useCallback((opcaoId: string) => {
    if (!eventoAtivo || !personagem) return;

    const opcao = eventoAtivo.opcoes.find(o => o.id === opcaoId);
    if (!opcao) return;

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
      return;
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
    setEventoAtivo(null);

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
    }
  }, [eventoAtivo, personagem, carreira, educacao, economia, familia, personalidade, mostrarFeedback]);

  // Interagir com Familiar
  const acaoFamilia = useCallback((
    membroId: string,
    tipoAcao: 'conversar' | 'passar_tempo' | 'dar_presente' | 'discutir' | 'pedir_dinheiro' | 'pedir_conselho',
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

    let deltaFel = 0;
    let deltaSaude = 0;
    let deltaAparencia = 0;
    let deltaInteligencia = 0;
    let deltaEstresse = 0;
    let deltaSociabilidade = 0;
    let deltaEmpatia = 0;
    let deltaCond = 0;
    let deltaRep = 0;

    switch (atividade.id) {
      case 'act_consulta_sus':
        deltaSaude = randomInt(8, 15);
        deltaFel = 5;
        break;
      case 'act_consulta_particular':
        deltaSaude = randomInt(18, 30);
        deltaFel = 10;
        deltaEstresse = -15;
        break;
      case 'act_terapia':
        deltaFel = 18;
        deltaEstresse = -25;
        deltaEmpatia = 8;
        break;
      case 'act_academia':
        deltaSaude = 10;
        deltaAparencia = 6;
        deltaCond = 14;
        deltaEstresse = -12;
        deltaFel = 8;
        break;
      case 'act_estetica':
        deltaAparencia = 14;
        deltaFel = 12;
        break;
      case 'act_ferias_praia':
        deltaFel = 30;
        deltaEstresse = -35;
        break;
      case 'act_viagem_exterior':
        deltaFel = 45;
        deltaInteligencia = 8;
        deltaEstresse = -40;
        deltaRep = 10;
        break;
      case 'act_balada_barzinho':
        deltaFel = 18;
        deltaSociabilidade = 15;
        deltaEstresse = -10;
        break;
      case 'act_churrasco':
        deltaFel = 20;
        deltaSociabilidade = 15;
        deltaEmpatia = 10;
        setFamilia(prev => prev.map(f => ({ ...f, relacionamento: clamp(f.relacionamento + 10, 0, 100) })));
        break;
      case 'act_voluntariado':
        deltaEmpatia = 20;
        deltaRep = 15;
        deltaFel = 15;
        break;
      case 'act_leitura':
        deltaInteligencia = 6;
        deltaFel = 5;
        break;
      case 'act_meditacao':
        deltaEstresse = -20;
        deltaFel = 8;
        break;
    }

    setEconomia(prev => ({ ...prev, dinheiro: prev.dinheiro - atividade.custo }));
    setPersonagem(prev => prev ? ({
      ...prev,
      stats: {
        felicidade: clamp(prev.stats.felicidade + deltaFel, 0, 100),
        saude: clamp(prev.stats.saude + deltaSaude, 0, 100),
        aparencia: clamp(prev.stats.aparencia + deltaAparencia, 0, 100),
        inteligencia: clamp(prev.stats.inteligencia + deltaInteligencia, 0, 100)
      },
      hiddenStats: {
        ...prev.hiddenStats,
        estresse: clamp(prev.hiddenStats.estresse + deltaEstresse, 0, 100),
        sociabilidade: clamp(prev.hiddenStats.sociabilidade + deltaSociabilidade, 0, 100),
        empatia: clamp(prev.hiddenStats.empatia + deltaEmpatia, 0, 100),
        condicionamentoFisico: clamp(prev.hiddenStats.condicionamentoFisico + deltaCond, 0, 100),
        reputacao: clamp(prev.hiddenStats.reputacao + deltaRep, 0, 100)
      }
    }) : null);

    registrarAcaoAnual(`atividade:${atividade.id}`);

    // Registro natural na Linha da Vida (uma vez por ano = decisão relevante)
    const textosAtividade: Record<string, string> = {
      act_consulta_sus: 'Você fez um check-up no posto de saúde do bairro.',
      act_consulta_particular: 'Você consultou um médico particular.',
      act_terapia: 'Você foi a uma sessão de terapia.',
      act_academia: 'Você treinou na academia e cuidou do corpo.',
      act_estetica: 'Você passou um dia cuidando da aparência no salão e na barbearia.',
      act_ferias_praia: 'Você passou as férias relaxando no litoral.',
      act_viagem_exterior: 'Você fez uma viagem internacional.',
      act_balada_barzinho: 'Você saiu com os amigos para um barzinho.',
      act_churrasco: 'Você organizou um churrasco em família.',
      act_voluntariado: 'Você dedicou tempo ao trabalho voluntário.',
      act_leitura: 'Você dedicou tempo à leitura.',
      act_meditacao: 'Você manteve a prática de meditação.'
    };
    const textoAtividade =
      personagem.idade < 6 && atividade.categoria === 'saude'
        ? `Seus responsáveis te levaram para: ${atividade.nome.toLowerCase()}.`
        : textosAtividade[atividade.id] || `Você dedicou tempo a: ${atividade.nome.toLowerCase()}.`;

    const log: LifeLogEntry = {
      id: generateId('log'),
      idade: personagem.idade,
      ano: personagem.anoAtual,
      categoria: 'saude',
      texto: textoAtividade,
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
    setAcoesRealizadasAno([]);
    setIsDead(false);
    setResumoMorte(null);
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
