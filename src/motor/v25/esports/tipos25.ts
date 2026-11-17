/** VIDA 25 · E-SPORTS — os tipos do estado salvo (puros: o `tipos.ts` do motor os importa). */
import type { AtributoEsports, JogoId } from './jogos25';

export type FaseEsports = 'amador' | 'competitivo' | 'profissional' | 'encerrada';

/** Uma competição disputada no ano: a liga/circuito do degrau, uma qualificatória, o torneio internacional. */
export interface Competicao25 {
  nome: string;
  tipo: 'liga' | 'torneio' | 'mundial';
  colocacao: number;
  participantes: number;
  /** Séries/partidas vencidas e perdidas (no Fortnite: as quedas jogadas em `vitorias + derrotas`, vitórias = quedas vencidas). */
  vitorias: number;
  derrotas: number;
  /** O prêmio que coube a você (a sua parte), em dinheiro do lugar. */
  premio: number;
  titulo?: boolean;
}

export interface Temporada25 {
  ano: number;
  jogo: JogoId;
  /** O degrau (1 ranqueado … 5 elite mundial). */
  nivel: number;
  equipe?: string;
  /** Titular, reserva (banco) ou sem equipe (jogando por conta). */
  papel: 'titular' | 'reserva' | 'sem_equipe';
  funcao?: string;
  competicoes: Competicao25[];
  /** Mapas/partidas/séries/quedas disputados e vencidos. */
  disputas: number;
  vencidas: number;
  /** A métrica individual do jogo (rating, ACS, KDA...). */
  metrica: number;
  /** O nível de jogo no ano (a média ponderada dos atributos). */
  nivelDeJogo: number;
  /** Destaque individual do ano (o melhor do degrau, a seleção do campeonato), quando houve. */
  destaque?: string;
  premios: number;
}

export interface Proposta25 {
  equipe: string;
  nivel: number;
  forca: number;
  /** Salário mensal (0: sem salário — a vaga é a oportunidade). */
  salario: number;
  meses: number;
  validaAte: number;
  origem: 'peneira' | 'mercado' | 'subida' | 'descida' | 'organizacao';
  funcao?: string;
  titular: boolean;
  /** A cidade da gaming house/escritório (mudar é parte do sim). */
  municipioId?: string;
}

export interface Equipe25 { nome: string; nivel: number; forca: number; desde: number; contratoAte?: number; salario: number; titular: boolean; municipioId?: string }

export interface Esports25 {
  jogo: JogoId;
  fase: FaseEsports;
  inicio: number;
  /** O teto do jogador (estável pela semente; o treino aproxima do teto). */
  talento: number;
  funcao?: string;
  atributos: Partial<Record<AtributoEsports, number>>;
  /** O degrau em que compete (1–5). */
  nivel: number;
  equipe?: Equipe25;
  passagens: { equipe: string; nivel: number; de: number; ate?: number; saida?: string }[];
  temporadas: Temporada25[];
  /** A fotografia dos atributos no fim de cada ano (a ficha compara e desenha). */
  serie: { ano: number; nivel: number; a: Partial<Record<AtributoEsports, number>> }[];
  totais: { disputas: number; vencidas: number; titulos: number; premios: number; temporadas: number };
  reputacao: number;
  proposta?: Proposta25;
  /** O foco de treino escolhido no ano (vale para o ano que fecha). */
  foco?: { ano: number; qual: 'mecanica' | 'estrategia' | 'equipe' | 'mental' | 'descanso' };
  /** Peneiras (tryouts) tentadas: o ano da última. */
  peneira?: number;
  anosSemEquipe?: number;
  fim?: number;
  motivoFim?: 'escolha' | 'idade' | 'sem_equipe' | 'trabalho';
}
