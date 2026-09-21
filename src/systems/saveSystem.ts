import { EventOccurrence, GameState, GlobalStats, PastLifeRecord, PostMortemSummary, GameEvent } from '../types';
import { MASTER_EVENTS_LIST } from '../data/events/allEvents';
import { naturezaDoEvento } from './events/nature';
import { criarPersonalidadeInicial, normalizarPersonalidade } from './personalitySystem';
import { clamp } from '../utils/random';
import { normalizarAparencia } from '../data/avatar/avatarData';

const SAVE_KEY = 'VIDA_GAME_SAVE_V1'; // chave mantida: a versão vive dentro do payload
const STATS_KEY = 'VIDA_GLOBAL_STATS_V1';

// v3: personalidade emergente + memória de escolhas (B2).
// v4 (B4-FIX4): ocorrências de evento passam a carregar `natureza`
//     (acontecimento × decisão), que é o que a camada de ritmo usa para
//     medir fadiga de decisão separadamente de densidade de acontecimento.
// Saves de qualquer versão anterior carregam normalmente: campos ausentes são
// preenchidos de forma segura, sem destruir dados válidos.
export const VERSAO_SAVE = 4;

// Formato persistido: o evento ativo é referenciado por id (não serializado por inteiro)
type EstadoSalvo = Omit<GameState, 'eventoAtivo'> & { eventoAtivoId?: string | null };

export function salvarJogo(estado: GameState): boolean {
  try {
    const { eventoAtivo, ...resto } = estado;
    const dados: EstadoSalvo = {
      ...resto,
      versao: VERSAO_SAVE,
      eventoAtivoId: eventoAtivo ? eventoAtivo.id : null
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(dados));
    return true;
  } catch (error) {
    console.warn('Erro ao salvar jogo no LocalStorage:', error);
    return false;
  }
}

export function carregarJogo(): GameState | null {
  try {
    const dados = localStorage.getItem(SAVE_KEY);
    if (!dados) return null;
    const bruto: unknown = JSON.parse(dados);
    return migrarEstadoSalvo(bruto);
  } catch (error) {
    console.warn('Erro ao carregar jogo do LocalStorage:', error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Migração e normalização defensiva
// Saves antigos (sem versão, com Energia, com eventoAtivo serializado) seguem
// carregáveis: o campo obsoleto é descartado e os dados válidos preservados.
// Se a partida não puder ser lida, retorna null SEM sobrescrever o dado original.
// ---------------------------------------------------------------------------

function comoObjeto(valor: unknown): Record<string, unknown> | null {
  return typeof valor === 'object' && valor !== null ? (valor as Record<string, unknown>) : null;
}

function numero(valor: unknown, padrao: number): number {
  return typeof valor === 'number' && Number.isFinite(valor) ? valor : padrao;
}

function lista(valor: unknown): unknown[] {
  return Array.isArray(valor) ? valor : [];
}

function migrarEstadoSalvo(bruto: unknown): GameState | null {
  const raiz = comoObjeto(bruto);
  if (!raiz) return null;

  const personagemBruto = comoObjeto(raiz.personagem);
  if (!personagemBruto || typeof personagemBruto.nome !== 'string' || personagemBruto.nome === '') {
    return null; // partida ilegível: preserva o dado original, não inventa estado vazio
  }

  const versaoAntiga = typeof raiz.versao === 'number' ? raiz.versao : 1;

  // --- Personagem ---
  const statsBruto = comoObjeto(personagemBruto.stats) ?? {};
  const hiddenBruto = comoObjeto(personagemBruto.hiddenStats) ?? {};
  const flagsBruto = comoObjeto(personagemBruto.flags) ?? {};
  // flag legada "escolaridade" congelada: descartada (a fonte de verdade é EducationState)
  const { escolaridade: _flagLegado, ...flagsValidas } = flagsBruto as Record<string, unknown>;

  const personagem = {
    ...personagemBruto,
    idade: numero(personagemBruto.idade, 0),
    anoAtual: numero(personagemBruto.anoAtual, new Date().getFullYear()),
    anoNascimento: numero(personagemBruto.anoNascimento, new Date().getFullYear()),
    stats: {
      // Energia (campo obsoleto da versão 1) é simplesmente ignorado aqui
      felicidade: clamp(numero(statsBruto.felicidade, 70)),
      saude: clamp(numero(statsBruto.saude, 75)),
      inteligencia: clamp(numero(statsBruto.inteligencia, 50)),
      aparencia: clamp(numero(statsBruto.aparencia, 50))
    },
    hiddenStats: {
      disciplina: clamp(numero(hiddenBruto.disciplina, 50)),
      sociabilidade: clamp(numero(hiddenBruto.sociabilidade, 50)),
      empatia: clamp(numero(hiddenBruto.empatia, 50)),
      ambicao: clamp(numero(hiddenBruto.ambicao, 50)),
      estresse: clamp(numero(hiddenBruto.estresse, 10)),
      reputacao: clamp(numero(hiddenBruto.reputacao, 50)),
      condicionamentoFisico: clamp(numero(hiddenBruto.condicionamentoFisico, 50))
    },
    doencas: lista(personagemBruto.doencas).filter(d => typeof d === 'string') as string[],
    flags: flagsValidas as Record<string, boolean | number | string>,
    marcos: lista(personagemBruto.marcos).filter(comoObjeto) as NonNullable<GameState['personagem']>['marcos'],
    // B4-FIX2 — saves de antes deste PR não têm `aparencia`: normalizada
    // para um valor sempre válido (fallback do B4-FIX1 continua cobrindo
    // a ausência na apresentação, mas o dado em si nunca fica indefinido
    // aqui — evita checagens espalhadas pelo resto do código).
    aparencia: normalizarAparencia(personagemBruto.aparencia)
  } as GameState['personagem'];

  // --- Família ---
  const familia = lista(raiz.familia).map(m => {
    const mBruto = comoObjeto(m);
    if (!mBruto) return null;
    return {
      ...mBruto,
      idade: numero(mBruto.idade, 0),
      relacionamento: clamp(numero(mBruto.relacionamento, 50)),
      vivo: mBruto.vivo !== false
    };
  }).filter(Boolean) as GameState['familia'];

  // --- Educação ---
  const eduBruto = comoObjeto(raiz.educacao) ?? {};
  const niveisValidos = [
    'nenhuma', 'fundamental_incompleto', 'fundamental_completo', 'medio_incompleto',
    'medio_completo', 'tecnico', 'superior_incompleto', 'superior_completo', 'pos_graduacao'
  ];
  const educacao = {
    ...eduBruto,
    nivelAtual: (niveisValidos.includes(eduBruto.nivelAtual as string)
      ? eduBruto.nivelAtual
      : 'nenhuma') as GameState['educacao']['nivelAtual'],
    emCurso: eduBruto.emCurso === true,
    desempenho: clamp(numero(eduBruto.desempenho, 70)),
    posturaAno: null,
    cursosConcluidos: lista(eduBruto.cursosConcluidos).filter(comoObjeto)
  } as GameState['educacao'];

  // --- Carreira ---
  const carBruto = comoObjeto(raiz.carreira) ?? {};
  const carreira = {
    ...carBruto,
    empregado: carBruto.empregado === true,
    anosNoCargo: numero(carBruto.anosNoCargo, 0),
    desempenhoTrabalho: clamp(numero(carBruto.desempenhoTrabalho, 60)),
    horasExtras: carBruto.horasExtras === true,
    bicoAtivoId: null,
    aposentado: carBruto.aposentado === true,
    historicoEmpregos: lista(carBruto.historicoEmpregos).filter(comoObjeto)
  } as GameState['carreira'];

  // --- Economia ---
  const ecoBruto = comoObjeto(raiz.economia) ?? {};
  const padroesValidos = ['modesto', 'confortavel', 'luxuoso'];
  const economia = {
    ...ecoBruto,
    dinheiro: numero(ecoBruto.dinheiro, 0),
    dividas: numero(ecoBruto.dividas, 0),
    padraoDeVida: (padroesValidos.includes(ecoBruto.padraoDeVida as string)
      ? ecoBruto.padraoDeVida
      : 'confortavel') as GameState['economia']['padraoDeVida'],
    propriedades: lista(ecoBruto.propriedades).filter(comoObjeto),
    investimentos: lista(ecoBruto.investimentos).filter(comoObjeto)
  } as GameState['economia'];

  // --- Linha da Vida ---
  let timeline = lista(raiz.timeline).filter(e => {
    const eBruto = comoObjeto(e);
    return eBruto && typeof eBruto.texto === 'string';
  }) as GameState['timeline'];
  // Remove cabeçalhos de ano antigos (agora derivados na exibição)
  timeline = timeline.filter(e => !e.id.startsWith('ano_head'));
  // Saves da versão 1 armazenavam o mais novo no topo; inverte para ordem cronológica
  if (versaoAntiga < 2) {
    timeline = [...timeline].reverse();
  }

  // --- Evento ativo (por id) ---
  const idEvento =
    typeof raiz.eventoAtivoId === 'string'
      ? raiz.eventoAtivoId
      : (comoObjeto(raiz.eventoAtivo)?.id as string | undefined) ?? null;
  const eventoAtivo: GameEvent | null =
    (idEvento && MASTER_EVENTS_LIST.find(e => e.id === idEvento)) || null;

  const historicoEventosDisparados = lista(raiz.historicoEventosDisparados).filter(
    h => typeof h === 'string'
  ) as string[];

  // B4-FIX2 — histórico rico (id + idade + ano). Saves anteriores a esta
  // mudança não têm o campo: começa vazio, sem inventar idade/ano para
  // ocorrências passadas (cooldown se comporta como "sem histórico
  // conhecido" para esses eventos — nunca bloqueia por engano).
  const historicoOcorrenciasEventos = (lista(raiz.historicoOcorrenciasEventos).filter(
    (o): o is EventOccurrence => {
      const obj = comoObjeto(o);
      return !!obj && typeof obj.eventId === 'string' && typeof obj.idade === 'number' && typeof obj.ano === 'number';
    }
  ) as EventOccurrence[]).map(ocorrencia => {
    // --- Migração v3 → v4 -------------------------------------------------
    // Ocorrências gravadas antes do B4-FIX4 não têm `natureza` (e as mais
    // antigas nem `categoria`). Em vez de assumir cegamente 'decisao',
    // consultamos o catálogo atual: ele é a fonte de verdade sobre o que
    // aquele evento É. Assim a camada de ritmo passa a enxergar o passado da
    // vida com a mesma taxonomia do presente, e as penalidades por contexto
    // (`events/contextWeighting`) recuperam a categoria perdida.
    //
    // Evento que não existe mais no catálogo (conteúdo removido entre
    // versões) mantém o registro como está: a ocorrência aconteceu e não
    // deve sumir do histórico só porque o evento saiu de cena.
    if (ocorrencia.natureza && ocorrencia.categoria) return ocorrencia;
    const evento = MASTER_EVENTS_LIST.find(e => e.id === ocorrencia.eventId);
    if (!evento) return { ...ocorrencia, natureza: ocorrencia.natureza ?? 'decisao' };
    return {
      ...ocorrencia,
      categoria: ocorrencia.categoria ?? evento.categoria,
      natureza: ocorrencia.natureza ?? naturezaDoEvento(evento)
    };
  });

  // --- Personalidade (B2): saves das versões 1/2 não possuem o campo;
  // inicializa em branco. Saves da v3 são normalizados defensivamente. ---
  const personalidade = raiz.personalidade
    ? normalizarPersonalidade(raiz.personalidade)
    : criarPersonalidadeInicial();

  const resumoMorte = comoObjeto(raiz.resumoMorte) as unknown as GameState['resumoMorte'];

  return {
    versao: VERSAO_SAVE,
    personagem,
    familia,
    educacao,
    carreira,
    economia,
    personalidade,
    timeline,
    eventoAtivo,
    historicoEventosDisparados,
    historicoOcorrenciasEventos,
    acoesRealizadasAno: lista(raiz.acoesRealizadasAno).filter(a => typeof a === 'string') as string[],
    emJogo: raiz.emJogo !== false,
    morto: raiz.morto === true,
    resumoMorte
  };
}

export function limparSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (error) {
    console.warn('Erro ao remover save:', error);
  }
}

export function carregarEstatisticasGlobais(): GlobalStats {
  const vazio: GlobalStats = {
    vidasJogadas: 0,
    totalAnosVividos: 0,
    maiorIdade: 0,
    maiorPatrimonio: 0,
    totalFilhos: 0,
    historicoVidas: []
  };
  try {
    const dados = localStorage.getItem(STATS_KEY);
    if (!dados) return vazio;
    const bruto = comoObjeto(JSON.parse(dados));
    if (!bruto) return vazio;
    return {
      vidasJogadas: numero(bruto.vidasJogadas, 0),
      totalAnosVividos: numero(bruto.totalAnosVividos, 0),
      maiorIdade: numero(bruto.maiorIdade, 0),
      maiorPatrimonio: numero(bruto.maiorPatrimonio, 0),
      totalFilhos: numero(bruto.totalFilhos, 0),
      historicoVidas: lista(bruto.historicoVidas).filter(comoObjeto) as PastLifeRecord[]
    };
  } catch {
    return vazio;
  }
}

export function registrarMorteNasEstatisticas(resumo: PostMortemSummary): void {
  try {
    const stats = carregarEstatisticasGlobais();

    const novoRegistro: PastLifeRecord = {
      id: `record_${Date.now()}`,
      nome: resumo.nomeCompleto,
      idadeMorte: resumo.idadeMorte,
      cidade: resumo.cidade,
      estado: resumo.estado,
      profissao: resumo.profissaoFinal,
      patrimonio: resumo.patrimonioFinal,
      pontuacao: resumo.pontuacaoVida,
      anoJogo: new Date().toLocaleDateString('pt-BR'),
      causaMorte: resumo.causaMorte
    };

    stats.vidasJogadas += 1;
    stats.totalAnosVividos += resumo.idadeMorte;
    stats.maiorIdade = Math.max(stats.maiorIdade, resumo.idadeMorte);
    stats.maiorPatrimonio = Math.max(stats.maiorPatrimonio, resumo.patrimonioFinal);
    stats.totalFilhos += resumo.quantidadeFilhos;
    stats.historicoVidas = [novoRegistro, ...stats.historicoVidas].slice(0, 30); // Mantém até 30 registros

    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.warn('Erro ao registrar estatísticas globais:', error);
  }
}
