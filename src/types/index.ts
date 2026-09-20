// Tipos centrais do jogo VIDA

export type Gender = 'masculino' | 'feminino' | 'nao-binario';

export type LifeStage =
  | 'primeira_infancia' // 0-5
  | 'infancia'          // 6-11
  | 'adolescencia'       // 12-17
  | 'jovem_adulto'      // 18-29
  | 'adulto'            // 30-59
  | 'terceira_idade';   // 60+

export type SocialClass =
  | 'vulneravel'
  | 'trabalhadora'
  | 'classe_media_baixa'
  | 'classe_media'
  | 'classe_alta';

// Atributos Visíveis (0 a 100)
export interface VisibleStats {
  felicidade: number;   // Happiness
  saude: number;        // Health
  inteligencia: number; // Smarts
  aparencia: number;    // Looks
}

// Atributos Ocultos / Internos (0 a 100)
export interface HiddenStats {
  disciplina: number;        // Discipline
  sociabilidade: number;     // Sociability
  empatia: number;           // Empathy
  ambicao: number;           // Ambition
  estresse: number;          // Stress (quanto maior, pior)
  reputacao: number;         // Reputation
  condicionamentoFisico: number; // Fitness
}

// ---------------------------------------------------------------------------
// B2 — Personalidade emergente e memória de escolhas
// Traços são eixos assinados: valores positivos reforçam a tendência; valores
// negativos indicam o polo oposto (ex.: generosidade negativa = egoísmo).
// Uma escolha isolada move poucos pontos; padrões ao longo da vida constroem
// traços fortes. Números crus nunca são exibidos ao jogador.
// ---------------------------------------------------------------------------

export type TracoComportamental =
  | 'empatia'
  | 'generosidade'
  | 'disciplina'
  | 'impulsividade'
  | 'coragem'
  | 'sociabilidade'
  | 'independencia'
  | 'familia';

/** Registro estruturado de uma escolha relevante (memória interna, não a Linha da Vida). */
export interface EscolhaRegistrada {
  eventoId: string;
  opcaoId: string;
  idade: number;
  ano: number;
  /** Tags declaradas na opção escolhida (identificadores estáveis, nunca texto visível). */
  tagsComportamentais: Partial<Record<TracoComportamental, number>>;
  /** Deltas efetivamente aplicados aos traços (pode divergir das tags no futuro). */
  impactos: Partial<Record<TracoComportamental, number>>;
}

/** Estado de personalidade do personagem: intensidades acumuladas + memória de escolhas. */
export interface PersonalityState {
  tracos: Record<TracoComportamental, number>;
  memorias: EscolhaRegistrada[];
}

/**
 * Condição comportamental consultável por eventos e opções (presente e futuro):
 * traço mínimo/máximo, escolha anterior e quantidade de ocorrências de uma tag.
 */
export interface CondicaoComportamental {
  traco?: TracoComportamental;
  intensidadeMinima?: number;
  intensidadeMaxima?: number;
  escolheuAnteriormente?: { eventoId: string; opcaoId?: string };
  minimoOcorrencias?: { tag: TracoComportamental; quantidade: number };
}

export type RelationType =
  | 'pai'
  | 'mae'
  | 'irmao'
  | 'irma'
  | 'namorado'
  | 'namorada'
  | 'noivo'
  | 'noiva'
  | 'esposo'
  | 'esposa'
  | 'filho'
  | 'filha'
  | 'amigo'
  | 'amiga'
  | 'pet';

export interface FamilyMember {
  id: string;
  nome: string;
  sobrenome: string;
  genero: Gender;
  tipo: RelationType;
  idade: number;
  relacionamento: number; // 0 a 100
  vivo: boolean;
  profissao?: string;
  renda?: number;
  personalidade?: string;
  situacaoAtual?: string;
  anoMorte?: number;
  causaMorte?: string;
}

export type EducationLevel =
  | 'nenhuma'
  | 'fundamental_incompleto'
  | 'fundamental_completo'
  | 'medio_incompleto'
  | 'medio_completo'
  | 'tecnico'
  | 'superior_incompleto'
  | 'superior_completo'
  | 'pos_graduacao';

export type FamilyInteractionType =
  | 'conversar'
  | 'passar_tempo'
  | 'dar_presente'
  | 'discutir'
  | 'pedir_dinheiro'
  | 'pedir_conselho'
  // Exclusivas de pets (B4-FIX1) — um animal não conversa nem discute;
  // o vínculo com ele acontece por cuidado e presença física.
  | 'fazer_carinho'
  | 'alimentar'
  | 'passear';

export type PosturaEscolar = 'estudar' | 'matar_aula' | 'socializar';

export interface EducationState {
  nivelAtual: EducationLevel;
  emCurso: boolean;
  tipoCurso?: 'fundamental' | 'medio' | 'tecnico' | 'superior' | 'pos';
  nomeCurso?: string;
  instituicao?: string;
  isPublica?: boolean;
  semestreAtual?: number;
  totalSemestres?: number;
  desempenho: number; // 0 a 100 (notas)
  mensalidade?: number;
  anoIngresso?: number;
  // Compromisso do ano corrente; efeitos processados na passagem de ano
  posturaAno?: PosturaEscolar | null;
  cursosConcluidos: {
    nome: string;
    tipo: string;
    anoConclusao: number;
  }[];
}

export interface Job {
  id: string;
  titulo: string;
  setor: string;
  salarioMensal: number;
  escolaridadeMinima: EducationLevel;
  inteligenciaMinima: number;
  experienciaNecessaria: number; // em anos
  horasSemanais: number;
  estresseNivel: number; // 1 a 5
  progressaoPara?: string; // id do proximo cargo
}

export interface CareerState {
  empregado: boolean;
  cargoAtual?: Job;
  anosNoCargo: number;
  desempenhoTrabalho: number; // 0 a 100
  horasExtras: boolean;
  // Bico escolhido como compromisso do ano corrente; pago na passagem de ano
  bicoAtivoId?: string | null;
  aposentado: boolean;
  rendaAposentadoria?: number;
  historicoEmpregos: {
    cargo: string;
    empresa?: string;
    salario: number;
    anoInicio: number;
    anoFim?: number;
    motivoSaida?: string;
  }[];
}

export interface Property {
  id: string;
  tipo: 'imovel' | 'veiculo';
  nome: string;
  valorCompra: number;
  valorAtual: number;
  custoAnualManutencao: number;
  anoCompra: number;
  quitado: boolean;
  parcelasRestantes?: number;
  valorParcela?: number;
}

export interface Investment {
  id: string;
  tipo: 'poupanca' | 'tesouro_selic' | 'fundo_imobiliario' | 'acoes_b3' | 'cripto';
  nome: string;
  saldo: number;
  rendimentoMedioAnual: number; // ex: 0.10 (10%)
  risco: 'muito_baixo' | 'baixo' | 'medio' | 'alto' | 'muito_alto';
}

export interface EconomyState {
  dinheiro: number; // Saldo em conta corrente
  despesasAnuaisPadrao: number;
  padraoDeVida: 'modesto' | 'confortavel' | 'luxuoso';
  propriedades: Property[];
  investimentos: Investment[];
  dividas: number;
}

export type LifeLogCategory =
  | 'geral'
  | 'familia'
  | 'escola'
  | 'carreira'
  | 'amor'
  | 'saude'
  | 'financas'
  | 'evento'
  | 'morte'
  | 'cotidiano';

export interface LifeLogEntry {
  id: string;
  idade: number;
  ano: number;
  categoria: LifeLogCategory;
  texto: string;
  tipo?: 'info' | 'positivo' | 'negativo' | 'importante' | 'alerta';
}

export interface EventConsequence {
  stats?: Partial<VisibleStats>;
  hiddenStats?: Partial<HiddenStats>;
  // B2 — sinal comportamental de longo prazo (personalidade emergente); impacto pequeno por escolha
  impactosComportamentais?: Partial<Record<TracoComportamental, number>>;
  dinheiro?: number;
  relacionamentoDelta?: { relationId?: string; relationType?: RelationType; delta: number };
  adicionarFlag?: string;
  removerFlag?: string;
  adicionarLog?: string;
  saudeDelta?: number;
  demissao?: boolean;
  morte?: boolean;
  causaMorte?: string;
  adicionarFamiliar?: Partial<FamilyMember>;
  adicionarDoenca?: string;
  curarDoenca?: string;
}

export interface EventOption {
  id: string;
  texto: string;
  descricaoResultado?: string;
  consequencias: EventConsequence;
  requisito?: {
    atributo?: keyof VisibleStats | keyof HiddenStats;
    valorMinimo?: number;
    dinheiroMinimo?: number;
    flagNecessaria?: string;
    // B2 — exigência de padrão de comportamento acumulado (ex.: histórico de disciplina)
    condicaoComportamental?: CondicaoComportamental;
  };
}

export interface GameEvent {
  id: string;
  titulo: string;
  descricao: string;
  idadeMinima: number;
  idadeMaxima: number;
  categoria: 'infancia' | 'escola' | 'adolescencia' | 'familia' | 'amizade' | 'romance' | 'trabalho' | 'dinheiro' | 'saude' | 'cotidiano';
  peso: number; // chance relativa
  unico?: boolean; // apenas uma vez na vida
  condicoes?: {
    genero?: Gender;
    faseVida?: LifeStage;
    empregado?: boolean;
    emEscola?: boolean;
    emFaculdade?: boolean;
    temParceiro?: boolean;
    temFilhos?: boolean;
    dinheiroMinimo?: number;
    dinheiroMaximo?: number;
    flagsNecessarias?: string[];
    flagsProibidas?: string[];
    saudeMinima?: number;
    saudeMaxima?: number;
    // B2 — condições sobre personalidade/memória (todas devem ser atendidas)
    personalidade?: CondicaoComportamental[];
  };
  opcoes: EventOption[];
}

export interface Character {
  id: string;
  nome: string;
  sobrenome: string;
  genero: Gender;
  idade: number;
  anoAtual: number;
  anoNascimento: number;
  cidade: string;
  estado: string;
  classeSocial: SocialClass;
  stats: VisibleStats;
  hiddenStats: HiddenStats;
  doencas: string[];
  flags: Record<string, boolean | number | string>;
  marcos: {
    idade: number;
    titulo: string;
    descricao: string;
  }[];
}

export interface GameState {
  // Versão do schema de save; migrações em systems/saveSystem.ts
  versao: number;
  personagem: Character | null;
  familia: FamilyMember[];
  educacao: EducationState;
  carreira: CareerState;
  economia: EconomyState;
  // B2 — personalidade emergente e memória de escolhas
  personalidade: PersonalityState;
  timeline: LifeLogEntry[];
  eventoAtivo: GameEvent | null;
  historicoEventosDisparados: string[];
  // Ações únicas por ano (atividades, apostas, interações); zerada a cada passagem de ano
  acoesRealizadasAno: string[];
  emJogo: boolean;
  morto: boolean;
  resumoMorte?: PostMortemSummary;
}

export interface PostMortemSummary {
  nomeCompleto: string;
  idadeMorte: number;
  anoNascimento: number;
  anoMorte: number;
  cidade: string;
  estado: string;
  causaMorte: string;
  patrimonioFinal: number;
  dinheiroTotalAcumulado: number;
  profissaoFinal: string;
  nivelEducacao: string;
  quantidadeFilhos: number;
  quantidadeParceiros: number;
  principaisConquistas: string[];
  epitafio: string;
  biografiaResumo: string;
  statsFinais: VisibleStats;
  pontuacaoVida: number;
}

export interface PastLifeRecord {
  id: string;
  nome: string;
  idadeMorte: number;
  cidade: string;
  estado: string;
  profissao: string;
  patrimonio: number;
  pontuacao: number;
  anoJogo: string;
  causaMorte: string;
}

export interface GlobalStats {
  vidasJogadas: number;
  totalAnosVividos: number;
  maiorIdade: number;
  maiorPatrimonio: number;
  totalFilhos: number;
  historicoVidas: PastLifeRecord[];
}
