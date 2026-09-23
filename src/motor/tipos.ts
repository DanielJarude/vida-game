/**
 * O modelo de uma vida.
 *
 * Um único objeto `Vida` guarda tudo o que existe na partida. O motor recebe
 * uma vida e devolve outra; a interface só lê. Não há estado paralelo.
 *
 * TEMPO: `t` é um instante em meses absolutos (`ano * 12 + mês`, mês 0..11).
 * O jogador avança de aniversário em aniversário (12 meses), mas processos
 * — gestação, curso, candidatura, mudança — têm início e fim em meses e se
 * resolvem em ordem dentro do ano.
 */

export type Genero = 'masculino' | 'feminino' | 'nao_binario';
export type Classe = 'vulneravel' | 'trabalhadora' | 'media_baixa' | 'media' | 'alta';
export type Regiao = 'Norte' | 'Nordeste' | 'Centro-Oeste' | 'Sudeste' | 'Sul';

/* ------------------------------------------------------------------ Pessoas */

/**
 * Temperamento de um NPC, em eixos -1..1. Serve para compatibilidade e para
 * o texto descrever a pessoa de forma consistente ao longo dos anos.
 */
export interface Temperamento {
  extroversao: number;
  afabilidade: number;
  responsabilidade: number;
  abertura: number;
  estabilidade: number;
}

export interface Pessoa {
  id: string;
  nome: string;
  sobrenome: string;
  genero: Genero;
  tNasc: number;
  vivo: boolean;
  tMorte?: number;
  causaMorte?: string;
  temperamento: Temperamento;
  /** Rótulo do que a pessoa faz hoje ("professora", "estudante", "aposentado"). */
  ocupacao?: string;
  /** Ocupação de referência (catálogo), quando a pessoa tem uma — dá continuidade à carreira dela. */
  ocupacaoId?: string;
  /** Renda mensal líquida (0 quando não tem). Entra no domicílio se morar junto. */
  renda: number;
  /** Onde a pessoa mora. Distância pesa em toda relação. */
  municipioId: string;
  /** Gosto da pessoa por ter filhos — só importa para parceiros. */
  querFilhos?: 'sim' | 'nao' | 'talvez';
  /** Por quem a pessoa se interessa romanticamente. */
  atracao?: Atracao;
  /** Parceria atual da pessoa com alguém que NÃO é o jogador (ex.: os pais entre si). */
  parceiroId?: string;
  saude: number;
  visual?: Visual;
  /** Pet: animal, não gente. Nunca conversa, nunca namora. */
  especie?: 'cachorro' | 'gato';
}

export type Atracao = 'homens' | 'mulheres' | 'ambos';

/**
 * Aparência (puramente visual). Filhos herdam traços dos pais, então o
 * visual existe também para NPCs.
 */
export interface Visual {
  pele: string;
  cabelo: string;
  corCabelo: string;
  olhos: string;
  barba?: string;
}

export type Parentesco =
  | 'mae' | 'pai' | 'madrasta' | 'padrasto'
  | 'irmao' | 'meio_irmao'
  | 'avo' | 'tio' | 'primo'
  | 'filho' | 'enteado' | 'neto'
  | 'sogro'
  | 'pet';

/** Onde duas pessoas convivem. É o que faz relações nascerem e se manterem. */
export type Convivio = 'casa' | 'escola' | 'faculdade' | 'trabalho' | 'vizinhanca' | 'rotina' | 'online';

export type EstagioSocial = 'conhecido' | 'colega' | 'amigo' | 'amigo_proximo' | 'afastado';

export type EstagioRomance =
  | 'interesse'   // alguém chamou atenção; ainda não aconteceu nada
  | 'saindo'      // encontros, conhecendo-se
  | 'namoro'
  | 'morando_junto'
  | 'casamento'
  | 'ex';

export interface Vinculo {
  pessoaId: string;
  parentesco?: Parentesco;
  /** De onde a pessoa veio para a vida do jogador. */
  origem: Convivio | 'familia' | 'apresentado' | 'romance';
  tInicio: number;
  /** Carinho/proximidade afetiva, 0..100. */
  proximidade: number;
  /** Atrito acumulado, 0..100. Decai com o tempo; cresce com conflitos. */
  tensao: number;
  /** Só para vínculos não familiares. */
  estagio?: EstagioSocial;
  romance?: {
    estagio: EstagioRomance;
    tEstagio: number;
    /** O quanto a outra pessoa está envolvida (0..100). Não é visível como número. */
    envolvimento: number;
    /** Planejamento de filhos do casal. */
    planoFilhos?: 'evitando' | 'tentando' | 'sem_planejar';
  };
  /**
   * O lugar específico onde se conheceram ("escola:municipal-2", "trabalho:...").
   * Enquanto o jogador frequenta esse lugar, os dois convivem.
   */
  ambiente?: string;
  /** Contextos em que convivem AGORA (recalculado a cada ano). */
  convivio: Convivio[];
  tUltimoContato: number;
  /** Pequena história compartilhada — só fatos que aconteceram. */
  historia: { t: number; texto: string }[];
}

/* ------------------------------------------------------------------- Corpo */

export interface Condicao {
  id: string;
  nome: string;
  tInicio: number;
  cronica: boolean;
  /** Gravidade 1..3. */
  gravidade: number;
  tratando: boolean;
}

export interface Corpo {
  saude: number;       // 0..100
  forma: number;       // condicionamento físico 0..100
  aparencia: number;   // presença/cuidado 0..100
  condicoes: Condicao[];
  habitos: { fuma: boolean; bebe: 'nao' | 'social' | 'muito'; sedentario: boolean };
  /** Pode gestar (definido pelo corpo, não pelo gênero). */
  podeGestar: boolean;
}

export interface Mente {
  felicidade: number;  // 0..100
  estresse: number;    // 0..100
  cognicao: number;    // 0..100 — facilidade de aprender, raciocínio
}

/* -------------------------------------------------------------- Personalidade */

export type Traco =
  | 'empatia' | 'generosidade' | 'disciplina' | 'impulsividade'
  | 'coragem' | 'sociabilidade' | 'independencia' | 'familia';

export interface Personalidade {
  /** Eixos assinados −100..100, construídos só por escolhas comportamentais. */
  tracos: Record<Traco, number>;
  /** Evidências: qual escolha moveu o quê (limitado). */
  evidencias: { t: number; origem: string; impactos: Partial<Record<Traco, number>> }[];
}

/* ---------------------------------------------------------------- Educação */

export type Escolaridade =
  | 'nenhuma' | 'fundamental_incompleto' | 'fundamental' | 'medio_incompleto' | 'medio'
  | 'tecnico' | 'superior_incompleto' | 'superior' | 'pos' | 'mestrado' | 'doutorado';

export type EtapaBasica = 'creche' | 'pre' | 'fundamental1' | 'fundamental2' | 'medio';

export interface EscolaBasica {
  etapa: EtapaBasica;
  /** Ano dentro do ensino fundamental (1..9) ou médio (1..3); 0 na educação infantil. */
  serie: number;
  rede: 'publica' | 'privada';
  desempenho: number;  // 0..100
  reprovacoes: number;
}

export interface Matricula {
  cursoId: string;
  instituicao: string;
  rede: 'publica' | 'privada';
  modalidade: 'presencial' | 'ead';
  tInicio: number;
  /** Meses de curso que faltam (pausa quando trancado). */
  mesesRestantes: number;
  mensalidade: number;
  financiamento?: 'fies' | 'prouni';
  desempenho: number;
  trancado: boolean;
  municipioId: string;
}

export interface Educacao {
  escolaridade: Escolaridade;
  basica?: EscolaBasica;
  /** Largou a escola básica sem concluir. */
  evadiu: boolean;
  matricula?: Matricula;
  concluidos: { cursoId: string; nome: string; nivel: NivelCurso; area: string; tFim: number; instituicao: string }[];
  enem: { t: number; nota: number }[];
  /** Postura do ano na escola/curso (escolha comportamental do jogador). */
  postura: 'dedicada' | 'normal' | 'relaxada';
  cursinho: boolean;
}

export type NivelCurso = 'tecnico' | 'superior' | 'pos' | 'mestrado' | 'doutorado' | 'residencia';

/* ---------------------------------------------------------------- Trabalho */

export type Contrato = 'aprendiz' | 'estagio' | 'clt' | 'servidor' | 'informal' | 'autonomo';

export interface Emprego {
  ocupacaoId: string;
  empregador: string;
  contrato: Contrato;
  /** Salário bruto mensal. */
  salario: number;
  tInicio: number;
  /** 0..100 — como o trabalho está indo. */
  desempenho: number;
  municipioId: string;
  /** Carga: integral ou parcial (afeta tempo livre). */
  carga: 'integral' | 'parcial';
}

export interface Candidatura {
  id: string;
  ocupacaoId: string;
  tInicio: number;
  /** Quando sai o resultado. */
  tResultado: number;
  /** Chance final já calculada no momento da candidatura (desempenho na seleção). */
  chance: number;
  /** Concursos têm prova; o resultado também depende do estudo até lá. */
  concurso: boolean;
}

export interface Trabalho {
  atual?: Emprego;
  historico: (Emprego & { tFim: number; motivo: string })[];
  /** Meses de experiência por trilha profissional. */
  experiencia: Record<string, number>;
  candidaturas: Candidatura[];
  /** Meses de contribuição ao INSS. */
  contribuicao: number;
  aposentadoria?: { t: number; beneficio: number };
  licencas: string[];
  /** Horas extras neste ano (escolha). */
  horasExtras: boolean;
  desempregadoDesde?: number;
}

/* ---------------------------------------------------------------- Dinheiro */

export type TipoDivida = 'cartao' | 'emprestimo' | 'financiamento_imovel' | 'financiamento_veiculo' | 'fies';

export interface Divida {
  id: string;
  tipo: TipoDivida;
  saldo: number;
  /** Juros ao mês (0.02 = 2% a.m.). */
  jurosMes: number;
  /** Parcela mensal (0 = rotativo, paga o que der). */
  parcela: number;
  bemId?: string;
  descricao: string;
}

export interface Veiculo {
  id: string;
  tipo: 'veiculo';
  modeloId: string;
  nome: string;
  valor: number;
  tCompra: number;
  /** 0..100 — estado de conservação. */
  estado: number;
}

export interface Imovel {
  id: string;
  tipo: 'imovel';
  modeloId: string;
  nome: string;
  valor: number;
  tCompra: number;
  municipioId: string;
  /** Alugado para terceiros (renda) ou usado como moradia. */
  alugadoPor?: number;
  estado: number;
}

export type Bem = Veiculo | Imovel;

export type EstiloDeVida = 'apertado' | 'modesto' | 'confortavel' | 'folgado';

export interface LinhaRazao {
  rotulo: string;
  valor: number; // positivo = entrada, negativo = saída (anual)
  grupo: 'renda' | 'moradia' | 'casa' | 'filhos' | 'transporte' | 'saude' | 'educacao' | 'dividas' | 'lazer' | 'outros';
}

export interface Financas {
  conta: number;
  reserva: number;       // poupança/tesouro
  acoes: number;         // renda variável
  dividas: Divida[];
  bens: Bem[];
  estilo: EstiloDeVida;
  planoDeSaude: boolean;
  /** Nome sujo: crédito negado. */
  negativado: boolean;
  /** Razão do último ano (para a interface). */
  razao: LinhaRazao[];
}

/* ----------------------------------------------------------------- Moradia */

export interface Moradia {
  /** Com quem/onde mora. */
  tipo: 'pais' | 'aluguel' | 'propria' | 'republica' | 'parente' | 'cedida';
  municipioId: string;
  imovelId?: string;
  /** Tipo de moradia (`dados/bens`). Ausente enquanto mora com a família. */
  modeloId?: string;
  /** Aluguel mensal (quando aplicável). */
  aluguel: number;
  /** 1 (precária) .. 5 (muito boa). */
  padrao: number;
  tInicio: number;
}

/** A casa de origem enquanto o jogador mora com a família. */
export interface Origem {
  classe: Classe;
  /** Estrutura do lar em que nasceu. */
  arranjo: 'pais_juntos' | 'mae_solo' | 'pai_solo' | 'avos';
}

/* ---------------------------------------------------------------- Processos */

export type Processo =
  | { tipo: 'gestacao'; id: string; tConcepcao: number; tParto: number; gestanteId: string; outroId?: string; descoberta: boolean; planejada: boolean }
  | { tipo: 'adocao'; id: string; tInicio: number; tFim: number; parceiroId?: string }
  | { tipo: 'mudanca'; id: string; tEfetiva: number; destinoId: string; motivo: string }
  | { tipo: 'tratamento'; id: string; condicaoId: string; tFim: number; rede: 'sus' | 'particular' }
  | { tipo: 'cnh'; id: string; tInicio: number; tFim: number; tentativas: number };

/* --------------------------------------------------------------- Biografia */

/**
 * Relevância de uma linha da Linha da Vida.
 *  - marco: muda a trajetória (nascimento, formatura, casamento, morte).
 *  - biografia: merece ser lembrado.
 *  - cotidiano: textura; aparece discreto.
 *  - tecnico: registro (dinheiro, rotina) — fica fora da biografia.
 */
export type Relevancia = 'marco' | 'biografia' | 'cotidiano' | 'tecnico';

export type Tema =
  | 'nascimento' | 'infancia' | 'familia' | 'amizade' | 'amor' | 'escola' | 'estudo'
  | 'trabalho' | 'dinheiro' | 'casa' | 'saude' | 'lugar' | 'lazer' | 'perda' | 'filhos' | 'morte' | 'escolha';

export interface Entrada {
  id: string;
  t: number;
  idade: number;
  texto: string;
  relevancia: Relevancia;
  tema: Tema;
  tom?: 'bom' | 'ruim' | 'neutro';
  pessoas?: string[];
  /** Foi uma escolha do jogador (e não algo que aconteceu). */
  escolha?: boolean;
}

/* ---------------------------------------------------------------- Momentos */

/**
 * Uma decisão aguardando o jogador. Os textos ficam gravados (não são
 * regenerados) para que recarregar o save mostre exatamente o mesmo momento.
 */
export interface Momento {
  id: string;
  situacaoId: string;
  t: number;
  titulo: string;
  texto: string;
  tema: Tema;
  /** Pessoas envolvidas, por papel. */
  papeis: Record<string, string>;
  opcoes: { id: string; texto: string; bloqueio?: string }[];
}

/* ------------------------------------------------------------------- Rotina */

/** Algo que a pessoa faz regularmente, até decidir parar. */
export interface Rotina {
  id: string;
  tInicio: number;
}

/* ---------------------------------------------------------------------- Vida */

export interface Personagem {
  nome: string;
  sobrenome: string;
  genero: Genero;
  tNasc: number;
  municipioNatal: string;
  atracao?: Atracao;
  visual: Visual;
  /**
   * Como o texto se refere ao personagem (concordância). Escolha do jogador:
   * uma pessoa não binária pode preferir formas masculinas, femininas ou
   * neutras. Ausente = segue o gênero.
   */
  tratamento?: Genero;
}

export interface Ocorrencia {
  id: string;
  t: number;
  idade: number;
}

export interface Vida {
  versao: 6;
  id: string;
  rng: number;
  seq: number;
  t: number;
  eu: Personagem;
  corpo: Corpo;
  mente: Mente;
  personalidade: Personalidade;
  pessoas: Record<string, Pessoa>;
  vinculos: Record<string, Vinculo>;
  origem: Origem;
  moradia: Moradia;
  educacao: Educacao;
  trabalho: Trabalho;
  financas: Financas;
  processos: Processo[];
  rotinas: Rotina[];
  /** Fatos biográficos consultáveis por conteúdo ("fato" → instante). */
  fatos: Record<string, number>;
  biografia: Entrada[];
  momento: Momento | null;
  ocorrencias: Ocorrencia[];
  /** O que já foi feito neste ano de vida (ações pontuais). */
  anoAtual: { acoes: string[] };
  morte?: { t: number; causa: string };
}

/** Resultado de um comando do jogador. */
export interface Retorno {
  vida: Vida;
  /** Texto curto para mostrar ao jogador agora. */
  aviso?: { texto: string; tom: 'bom' | 'ruim' | 'neutro' };
  /** Resultado de uma decisão (mostrado no mesmo contexto do momento). */
  resultado?: string;
}
