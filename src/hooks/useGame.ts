import { useState, useEffect, useCallback } from 'react';
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
  FamilyInteractionType,
  gerarFamiliaInicial,
  interagirComFamiliar
} from '../systems/familySystem';
import {
  acaoEscola,
  criarEducacaoInicial,
  ingressarCurso
} from '../systems/educationSystem';
import {
  candidatarEmprego,
  criarCarreiraInicial,
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
import {
  carregarJogo,
  limparSave,
  registrarMorteNasEstatisticas,
  salvarJogo
} from '../systems/saveSystem';
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
  const [isDead, setIsDead] = useState<boolean>(false);
  const [resumoMorte, setResumoMorte] = useState<PostMortemSummary | null>(null);
  const [feedbackMensagem, setFeedbackMensagem] = useState<{ tipo: 'sucesso' | 'info' | 'erro'; texto: string } | null>(null);

  // Notificação com auto-dismiss
  const mostrarFeedback = useCallback((texto: string, tipo: 'sucesso' | 'info' | 'erro' = 'info') => {
    setFeedbackMensagem({ texto, tipo });
    setTimeout(() => {
      setFeedbackMensagem(null);
    }, 4000);
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
        personagem,
        familia,
        educacao,
        carreira,
        economia,
        timeline,
        eventoAtivo,
        historicoEventosDisparados: historicoEventos,
        emJogo: true,
        morto: false
      };
      salvarJogo(estadoParaSalvar);
      setHasSavedGame(true);
    }
  }, [personagem, familia, educacao, carreira, economia, timeline, eventoAtivo, historicoEventos, isDead, screen]);

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
        aparencia: randomInt(40, 90),
        energia: 100
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
      flags: {
        escolaridade: 'nenhuma'
      },
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
    setEventoAtivo(null);
    setHistoricoEventos([]);
    setIsDead(false);
    setResumoMorte(null);
    setActiveTab('timeline');
    setScreen('game');

    sound.playSuccess();
    mostrarFeedback(`Bem-vindo ao mundo, ${novoPersonagem.nome}!`, 'sucesso');
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

  // Carregar Jogo Salvo
  const continuarJogoSalvo = useCallback(() => {
    const save = carregarJogo();
    if (save && save.personagem) {
      setPersonagem(save.personagem);
      setFamilia(save.familia);
      setEducacao(save.educacao);
      setCarreira(save.carreira);
      setEconomia(save.economia);
      setTimeline(save.timeline);
      setEventoAtivo(save.eventoAtivo);
      setHistoricoEventos(save.historicoEventosDisparados || []);
      setIsDead(save.morto);
      setResumoMorte(save.resumoMorte || null);
      setScreen('game');
      sound.playClick();
      mostrarFeedback('Jogo carregado com sucesso!', 'sucesso');
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
      historicoEventos
    );

    setPersonagem(resultado.personagemAtualizado);
    setFamilia(resultado.familiaAtualizada);
    setEducacao(resultado.educacaoAtualizada);
    setCarreira(resultado.carreiraAtualizada);
    setEconomia(resultado.economiaAtualizada);
    setTimeline(prev => [...resultado.novosLogs, ...prev]);

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
  }, [personagem, isDead, eventoAtivo, familia, educacao, carreira, economia, historicoEventos]);

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
      personagem.anoAtual
    );

    setPersonagem(res.personagemAtualizado);
    setCarreira(res.carreiraAtualizada);
    setEducacao(res.educacaoAtualizada);
    setEconomia(res.economiaAtualizada);
    setFamilia(res.familiaAtualizada);
    setTimeline(prev => [...res.novosLogs, ...prev]);
    setEventoAtivo(null);

    if (res.morreu) {
      setIsDead(true);
      const patFinal = calcularPatrimonioLiquido(res.economiaAtualizada);
      const resumo: PostMortemSummary = {
        nomeCompleto: `${res.personagemAtualizado.nome} ${res.personagemAtualizado.sobrenome}`,
        idadeMorte: res.personagemAtualizado.idade,
        anoNascimento: res.personagemAtualizado.anoNascimento,
        anoMorte: res.personagemAtualizado.anoAtual,
        cidade: res.personagemAtualizado.cidade,
        estado: res.personagemAtualizado.estado,
        causaMorte: res.causaMorte || 'Incidente inesperado',
        patrimonioFinal: patFinal,
        dinheiroTotalAcumulado: patFinal,
        profissaoFinal: res.carreiraAtualizada.cargoAtual?.titulo || 'Sem profissão fixa',
        nivelEducacao: res.educacaoAtualizada.nivelAtual,
        quantidadeFilhos: res.familiaAtualizada.filter(f => f.tipo === 'filho' || f.tipo === 'filha').length,
        quantidadeParceiros: res.familiaAtualizada.filter(f => ['namorado', 'namorada', 'noivo', 'noiva', 'esposo', 'esposa'].includes(f.tipo)).length,
        principaisConquistas: ['Viveu intensamente até o seu último dia'],
        epitafio: '"Partiu de forma marcante e inesperada."',
        biografiaResumo: `${res.personagemAtualizado.nome} ${res.personagemAtualizado.sobrenome} faleceu aos ${res.personagemAtualizado.idade} anos decorrente de ${res.causaMorte || 'acontecimento fatídico'}.`,
        statsFinais: res.personagemAtualizado.stats,
        pontuacaoVida: Math.round(res.personagemAtualizado.idade * 35 + patFinal / 2000)
      };
      setResumoMorte(resumo);
      limparSave();
      registrarMorteNasEstatisticas(resumo);
      sound.playDeath();
    }
  }, [eventoAtivo, personagem, carreira, educacao, economia, familia]);

  // Interagir com Familiar
  const acaoFamilia = useCallback((
    membroId: string,
    tipoAcao: FamilyInteractionType,
    presenteTipo?: 'barato' | 'medio' | 'luxo'
  ) => {
    if (!personagem) return;
    const membro = familia.find(f => f.id === membroId);
    if (!membro) return;

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

    const novoLog: LifeLogEntry = {
      id: generateId('log'),
      idade: personagem.idade,
      ano: personagem.anoAtual,
      categoria: 'familia',
      texto: res.mensagem,
      tipo: res.sucesso ? 'positivo' : 'negativo'
    };
    setTimeline(prev => [novoLog, ...prev]);
    mostrarFeedback(res.mensagem, res.sucesso ? 'sucesso' : 'info');
  }, [personagem, familia, economia.dinheiro, mostrarFeedback]);

  // Ações de Educação
  const acaoEscolaExec = useCallback((acao: 'estudar' | 'matar_aula' | 'socializar') => {
    if (!personagem) return;
    sound.playClick();
    const res = acaoEscola(acao, personagem, educacao);
    setPersonagem(res.personagemAtualizado);
    setEducacao(res.educacaoAtualizada);
    mostrarFeedback(res.mensagem, 'info');
  }, [personagem, educacao, mostrarFeedback]);

  const matricularCursoExec = useCallback((cursoId: string, tipoInst: 'publica' | 'privada') => {
    if (!personagem) return;
    const curso = CURSOS_DISPONIVEIS.find(c => c.id === cursoId);
    if (!curso) return;

    sound.playClick();
    const res = ingressarCurso(curso, tipoInst, personagem, personagem.anoAtual);

    if (res.sucesso && res.educacaoAtualizada) {
      sound.playSuccess();
      setEducacao(prev => ({ ...prev, ...res.educacaoAtualizada }));
      if (res.novoLog) {
        setTimeline(prev => [res.novoLog!, ...prev]);
      }
      mostrarFeedback(res.mensagem, 'sucesso');
    } else {
      mostrarFeedback(res.mensagem, 'erro');
    }
  }, [personagem, mostrarFeedback]);

  // Ações de Carreira
  const candidatarVagaExec = useCallback((jobId: string) => {
    if (!personagem) return;
    const job = TODAS_PROFISSOES.find(j => j.id === jobId);
    if (!job) return;

    sound.playClick();
    const res = candidatarEmprego(job, personagem, personagem.anoAtual);

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
        setTimeline(prev => [res.novoLog!, ...prev]);
      }
      mostrarFeedback(res.mensagem, 'sucesso');
    } else {
      mostrarFeedback(res.mensagem, 'erro');
    }
  }, [personagem, mostrarFeedback]);

  const trabalharMaisExec = useCallback(() => {
    if (!personagem) return;
    sound.playClick();
    const res = trabalharMais(carreira, personagem);
    setCarreira(res.carreiraAtualizada);
    setPersonagem(res.personagemAtualizado);
    mostrarFeedback(res.mensagem, 'sucesso');
  }, [personagem, carreira, mostrarFeedback]);

  const pedirAumentoExec = useCallback(() => {
    if (!personagem) return;
    sound.playClick();
    const res = pedirAumento(carreira, personagem, personagem.anoAtual);
    setCarreira(res.carreiraAtualizada);
    setPersonagem(res.personagemAtualizado);
    if (res.novoLog) {
      setTimeline(prev => [res.novoLog!, ...prev]);
    }
    mostrarFeedback(res.mensagem, res.sucesso ? 'sucesso' : 'erro');
  }, [personagem, carreira, mostrarFeedback]);

  const pedirDemissaoExec = useCallback(() => {
    if (!personagem) return;
    sound.playClick();
    const res = pedirDemissao(carreira, personagem.anoAtual, personagem.idade);
    setCarreira(res.carreiraAtualizada);
    setTimeline(prev => [res.novoLog, ...prev]);
    mostrarFeedback('Você pediu demissão e agora está disponível para novos desafios.', 'info');
  }, [personagem, carreira, mostrarFeedback]);

  const fazerBicoExec = useCallback((bicoId: string) => {
    if (!personagem) return;
    const bico = BICOS_DISPONIVEIS.find(b => b.id === bicoId);
    if (!bico) return;

    if (personagem.stats.energia < bico.energiaGasto) {
      mostrarFeedback('Você está muito cansado(a) para fazer bicos no momento.', 'erro');
      return;
    }

    sound.playMoney();
    const ganho = bico.ganhoEstimadoAnual / 4;
    setEconomia(prev => ({ ...prev, dinheiro: prev.dinheiro + ganho }));
    setPersonagem(prev => prev ? ({
      ...prev,
      stats: {
        ...prev.stats,
        energia: clamp(prev.stats.energia - bico.energiaGasto, 0, 100)
      },
      hiddenStats: {
        ...prev.hiddenStats,
        estresse: clamp(prev.hiddenStats.estresse + bico.estresseGasto, 0, 100)
      }
    }) : null);

    const log: LifeLogEntry = {
      id: generateId('log'),
      idade: personagem.idade,
      ano: personagem.anoAtual,
      categoria: 'financas',
      texto: `Você realizou trabalhos autônomos (${bico.nome}) e faturou R$ ${ganho.toLocaleString('pt-BR')}!`,
      tipo: 'positivo'
    };
    setTimeline(prev => [log, ...prev]);
    mostrarFeedback(`Bico concluído! + R$ ${ganho.toLocaleString('pt-BR')}`, 'sucesso');
  }, [personagem, mostrarFeedback]);

  // Ações de Economia & Bens
  const comprarBemExec = useCallback((itemId: string) => {
    if (!personagem) return;
    const item = [...IMOVEIS_LOJA, ...VEICULOS_LOJA].find(i => i.id === itemId);
    if (!item) return;

    sound.playClick();
    const res = comprarBem(item, economia, personagem, personagem.anoAtual);

    if (res.sucesso && res.economiaAtualizada && res.personagemAtualizado) {
      sound.playSuccess();
      setEconomia(res.economiaAtualizada);
      setPersonagem(res.personagemAtualizado);
      if (res.novoLog) {
        setTimeline(prev => [res.novoLog!, ...prev]);
      }
      mostrarFeedback(res.mensagem, 'sucesso');
    } else {
      mostrarFeedback(res.mensagem, 'erro');
    }
  }, [personagem, economia, mostrarFeedback]);

  const venderBemExec = useCallback((propId: string) => {
    if (!personagem) return;
    sound.playClick();
    const res = venderBem(propId, economia, personagem, personagem.anoAtual);
    if (res.sucesso && res.economiaAtualizada) {
      sound.playMoney();
      setEconomia(res.economiaAtualizada);
      if (res.novoLog) {
        setTimeline(prev => [res.novoLog!, ...prev]);
      }
      mostrarFeedback(res.mensagem, 'sucesso');
    } else {
      mostrarFeedback(res.mensagem, 'erro');
    }
  }, [personagem, economia, mostrarFeedback]);

  const investirExec = useCallback((tipoId: 'poupanca' | 'tesouro_selic' | 'fundo_imobiliario' | 'acoes_b3' | 'cripto', valor: number) => {
    sound.playClick();
    const res = aplicarInvestimento(tipoId, valor, economia);
    if (res.sucesso && res.economiaAtualizada) {
      setEconomia(res.economiaAtualizada);
      mostrarFeedback(res.mensagem, 'sucesso');
    } else {
      mostrarFeedback(res.mensagem, 'erro');
    }
  }, [economia, mostrarFeedback]);

  const resgatarInvestimentoExec = useCallback((tipoId: string, valor: number) => {
    sound.playClick();
    const res = resgatarInvestimento(tipoId, valor, economia);
    if (res.sucesso && res.economiaAtualizada) {
      setEconomia(res.economiaAtualizada);
      mostrarFeedback(res.mensagem, 'sucesso');
    } else {
      mostrarFeedback(res.mensagem, 'erro');
    }
  }, [economia, mostrarFeedback]);

  const jogarLoteriaExec = useCallback(() => {
    if (!personagem) return;
    sound.playClick();
    const res = jogarMegaSena(economia, personagem, personagem.anoAtual);

    if (res.sucesso && res.economiaAtualizada && res.personagemAtualizado) {
      setEconomia(res.economiaAtualizada);
      setPersonagem(res.personagemAtualizado);
      if (res.ganhou) {
        sound.playSuccess();
        if (res.novoLog) setTimeline(prev => [res.novoLog!, ...prev]);
      }
      mostrarFeedback(res.mensagem, res.ganhou ? 'sucesso' : 'info');
    } else {
      mostrarFeedback(res.mensagem, 'erro');
    }
  }, [personagem, economia, mostrarFeedback]);

  // Ações de Atividades & Saúde
  const executarAtividade = useCallback((atividade: ActivityOption) => {
    if (!personagem) return;

    if (personagem.idade < atividade.idadeMinima) {
      mostrarFeedback(`Você precisa ter pelo menos ${atividade.idadeMinima} anos para esta atividade.`, 'erro');
      return;
    }

    if (atividade.custo > 0 && economia.dinheiro < atividade.custo) {
      mostrarFeedback(`Saldo insuficiente para esta atividade (Custo: R$ ${atividade.custo.toLocaleString('pt-BR')}).`, 'erro');
      return;
    }

    if (personagem.stats.energia < atividade.energiaGasto) {
      mostrarFeedback('Você está sem energia para realizar esta atividade.', 'erro');
      return;
    }

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
        inteligencia: clamp(prev.stats.inteligencia + deltaInteligencia, 0, 100),
        energia: clamp(prev.stats.energia - atividade.energiaGasto, 0, 100)
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

    const log: LifeLogEntry = {
      id: generateId('log'),
      idade: personagem.idade,
      ano: personagem.anoAtual,
      categoria: 'saude',
      texto: `Você realizou a atividade: ${atividade.nome}.`,
      tipo: 'positivo'
    };
    setTimeline(prev => [log, ...prev]);
    mostrarFeedback(`${atividade.nome} concluída com sucesso!`, 'sucesso');
  }, [personagem, economia.dinheiro, mostrarFeedback]);

  // Ações de Relacionamentos Românticos
  const iniciarNamoroExec = useCallback((candidato: DatingCandidate) => {
    if (!personagem) return;
    sound.playSuccess();
    const res = iniciarNamoro(candidato, personagem, personagem.anoAtual);
    setFamilia(prev => [...prev, res.novoMembro]);
    setPersonagem(res.personagemAtualizado);
    setTimeline(prev => [res.novoLog, ...prev]);
    mostrarFeedback(`Você e ${candidato.nome} agora estão namorando!`, 'sucesso');
  }, [personagem, mostrarFeedback]);

  const pedirCasamentoExec = useCallback((parceiroId: string) => {
    if (!personagem) return;
    const parceiro = familia.find(f => f.id === parceiroId);
    if (!parceiro) return;

    sound.playClick();
    const res = pedirEmCasamento(parceiro, personagem, personagem.anoAtual);

    if (res.sucesso && res.parceiroAtualizado && res.personagemAtualizado) {
      sound.playSuccess();
      setFamilia(prev => prev.map(f => f.id === parceiroId ? res.parceiroAtualizado! : f));
      setPersonagem(res.personagemAtualizado);
      if (res.novoLog) setTimeline(prev => [res.novoLog!, ...prev]);
      mostrarFeedback(res.mensagem, 'sucesso');
    } else {
      mostrarFeedback(res.mensagem, 'erro');
    }
  }, [personagem, familia, mostrarFeedback]);

  const terFilhoExec = useCallback((parceiroId?: string, nome?: string, genero?: Gender) => {
    if (!personagem) return;
    const parceiro = parceiroId ? (familia.find(f => f.id === parceiroId) || null) : null;

    sound.playSuccess();
    const res = terFilho(parceiro, personagem, nome, genero, personagem.anoAtual);
    setFamilia(prev => [...prev, res.novoFilho]);
    setPersonagem(res.personagemAtualizado);
    setTimeline(prev => [res.novoLog, ...prev]);
    mostrarFeedback(`Parabéns! ${res.novoFilho.nome} nasceu com muita saúde!`, 'sucesso');
  }, [personagem, familia, mostrarFeedback]);

  const terminarRelacionamentoExec = useCallback((parceiroId: string) => {
    if (!personagem) return;
    const parceiro = familia.find(f => f.id === parceiroId);
    if (!parceiro) return;

    sound.playClick();
    const res = terminarRelacionamento(parceiro, personagem, personagem.anoAtual);
    setFamilia(prev => prev.filter(f => f.id !== parceiroId));
    setPersonagem(res.personagemAtualizado);
    setTimeline(prev => [res.novoLog, ...prev]);
    mostrarFeedback(`Relacionamento com ${parceiro.nome} encerrado.`, 'info');
  }, [personagem, familia, mostrarFeedback]);

  // Reiniciar Jogo
  const reiniciarJogo = useCallback(() => {
    limparSave();
    setPersonagem(null);
    setFamilia([]);
    setEducacao(criarEducacaoInicial());
    setCarreira(criarCarreiraInicial());
    setEconomia(criarEconomiaInicial('classe_media'));
    setTimeline([]);
    setEventoAtivo(null);
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
    timeline,
    eventoAtivo,
    isDead,
    resumoMorte,
    feedbackMensagem,
    mostrarFeedback,

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
