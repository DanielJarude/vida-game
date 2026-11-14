/** VIDA 20 — os tipos dos estados novos (só tipos: o pacote `dados20` não importa nada em tempo de execução). */

export type Categoria20 = 'kart' | 'entrada' | 'f4' | 'regional' | 'f3' | 'f2' | 'f1';

export interface Temporada20 {
  ano: number; categoria: Categoria20; equipe: string;
  corridas: number; vitorias: number; podios: number; poles: number; pontos: number; posicao: number;
  abandonos: number; acidentes: number; melhor?: number; titulo?: boolean;
  /** Pontos de Superlicença ganhos neste campeonato. */
  sl?: number;
  companheiroPos?: number; rivalPos?: number;
  /** Quem foi campeão (quando não foi você). */
  campeao?: string;
}

export interface Proposta20 { categoria: Categoria20; equipe: string; forca: number; validaAte: number; salario?: number }

export interface Auto20 {
  fase: Categoria20 | 'encerrada';
  inicio: number; desde: number; fim?: number;
  equipe: string;
  /** O talento de nascença (estável): o teto da pilotagem. */
  talento: number;
  atributos: { pilotagem: number; consistencia: number; adaptacao: number; fisico: number; experiencia: number; pressao: number };
  temporadas: Temporada20[];
  vitorias: number; podios: number; titulos: number; largadas: number;
  companheiro?: string; rival?: string;
  /** A academia de pilotos (o programa de jovens de uma equipe de F1) que paga boa parte das temporadas. */
  academia?: string;
  patrocinio?: { nome: string; valor: number; ate: number };
  proposta?: Proposta20;
  /** F1: o contrato (até o fim da temporada `contratoAte`) e o salário anual. */
  contratoAte?: number; salario?: number;
  lesaoAte?: number; acidentesGraves?: number;
  semOrcamento?: number; familiaInvestiu?: number;
  motivoFim?: 'escolha' | 'orcamento' | 'sem_vaga' | 'resultados' | 'idade';
}

/* ------------------------------------------------------------------ clubes */
export type Setor20 = 'GOL' | 'DEF' | 'MEI' | 'ATA';
export interface Jogador20 {
  id: string; nome: string; tNasc: number; pos: Setor20;
  /** A força hoje (0..100) e até onde pode chegar. */
  forca: number; potencial: number;
  /** Salário anual e o fim do contrato (ano). */
  salario: number; contratoAte: number;
  /** Veio da base do próprio clube. */
  daBase?: boolean;
}
export interface TemporadaDoClube20 {
  ano: number; divisao: number; posicao?: number; receita: number; despesa: number; caixa: number; forca: number;
  titulo?: boolean; acesso?: boolean; queda?: boolean;
}
export interface Clube20 {
  nome: string; pais: string; cidade: string; desde: number;
  /** O que foi pago (o valor da compra, sem as dívidas que vieram junto). */
  preco: number;
  caixa: number; divida: number;
  torcida: number; reputacao: number;
  /** Estádio, centro de treinamento e categorias de base (1 modesto … 5 de ponta). */
  estadio: number; ct: number; base: number;
  /** Quanto se investe por ano na base (fração da receita: 0 pouco, 1 normal, 2 forte). */
  investimentoBase: 0 | 1 | 2;
  objetivo?: 'titulo' | 'acesso' | 'meio' | 'permanencia';
  elenco: Jogador20[]; juniores: Jogador20[];
  historico: TemporadaDoClube20[];
  /** A força do elenco no começo de cada temporada (a liga lê daqui: a temporada já jogada não muda). */
  forcaPorAno: Record<number, number>;
  seq: number;
  /** Do mercado de um ano, quem já foi comprado (não volta a aparecer). */
  comprados: string[];
  vendas: { nome: string; para: string; valor: number; ano: number }[];
  /** A avaliação do clube (o patrimônio lê daqui). */
  valor: number;
  /** A obra em andamento (estádio, CT ou base), que fica pronta no fim do ano. */
  obra?: { qual: 'estadio' | 'ct' | 'base'; ate: number };
  conflito?: string;
}
