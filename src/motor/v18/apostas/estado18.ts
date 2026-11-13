/**
 * VIDA 18 · O ESTADO DAS APOSTAS NOVAS (loterias da Caixa, esportivas, turfe, bingo) e a ponte com a contabilidade de
 * sempre (`sistemas/apostas.registrar`): o limite do ano, a autoexclusão, os "anos pesados" (e, por eles, a dependência
 * de `v14/crencas/dependencias14`) valem para tudo — nenhuma aposta nova tem caixa própria.
 */
import type { Vida } from '../../tipos';
import type { LoteriaId } from '../../dados18/apostas/loterias18';
import { anoDe } from '../../tempo';

export interface ResultadoDoBilhete { sorteio: number[]; sorteio2?: number[]; resultados?: ('1' | 'X' | '2')[]; premio: number; faixas: { nome: string; combinacoes: number; valor: number }[] }

export interface Bilhete18 {
  id: string;
  loteria: LoteriaId;
  concurso: number;
  t: number;
  /** Os jogos (cada um, as dezenas marcadas); na Loteca, um só "jogo" com os palpites em `palpites`. */
  jogos: number[][];
  palpites?: ('1' | 'X' | '2')[][];
  custo: number;
  /** Bolão: as cotas que são suas, o total de cotas e — no bolão entre conhecidos — quem mais entrou. */
  bolao?: { minhas: number; cotas: number; pessoas?: string[]; organizador?: 'loterica' | 'voce' };
  surpresinha?: boolean;
  resultado?: ResultadoDoBilhete;
}

export type MercadoEsportivo = '1x2' | 'placar' | 'gols' | 'campeao' | 'g4' | 'queda' | 'copa';

export interface ApostaEsportiva18 {
  id: string;
  t: number;
  mercado: MercadoEsportivo;
  /** O jogo da rodada (`rodada:jogo`) ou a temporada (`pais:ano`). */
  evento: string;
  descricao: string;
  /** O palpite: '1' | 'X' | '2', '2-1', 'mais' | 'menos', o nome do clube. */
  palpite: string;
  odd: number;
  valor: number;
  liquidada?: { t: number; ganhou: boolean; recebido: number; resultado: string };
}

export interface CorridaVista18 {
  id: string;
  hipodromo: string;
  numero: number;
  t: number;
  ordem: string[];
  apostas: { tipo: 'vencedor' | 'place' | 'exata'; cavalos: string[]; valor: number; odd: number; recebido: number }[];
  /** O cavalo da casa que correu (e onde chegou). */
  daCasa?: { nome: string; lugar: number; premio: number };
}

export interface LinhaDoHistorico18 { t: number; jogo: 'loteria' | 'esportiva' | 'turfe' | 'bingo'; texto: string; apostado: number; recebido: number }

export interface Apostas18 {
  bilhetes: Bilhete18[];
  /** O próximo concurso de cada loteria que a vida acompanha (a numeração anda com o calendário). */
  proximo: Partial<Record<LoteriaId, number>>;
  /** Os concursos em que a vida acertou a faixa principal (o acúmulo do concurso seguinte zera também por ela). */
  topo: Partial<Record<LoteriaId, number[]>>;
  esportivas: ApostaEsportiva18[];
  /** A próxima rodada do futebol (jogos) e o próximo páreo de cada hipódromo. */
  rodada?: number;
  pareo?: Record<string, number>;
  /** O cavalo da casa inscrito em cada páreo (`hipódromo:número` → id do cavalo). */
  inscritos?: Record<string, string>;
  corridas: CorridaVista18[];
  bingo?: { numero: number };
  historico: LinhaDoHistorico18[];
  /** O grande prêmio que mudou a vida (o que os acontecimentos leem) e o que foi feito dele. */
  premio?: { t: number; valor: number; jogo: string; bolao?: boolean; destino?: string; pessoas?: string[] };
}

export const estadoApostas18 = (v: Vida): Apostas18 => {
  const e = (v.apostas18 ??= { bilhetes: [], proximo: {}, topo: {}, esportivas: [], corridas: [], historico: [] });
  e.bilhetes ??= []; e.proximo ??= {}; e.topo ??= {}; e.esportivas ??= []; e.corridas ??= []; e.historico ??= [];
  return e;
};

export function anotar18(v: Vida, l: Omit<LinhaDoHistorico18, 't'>): void {
  const e = estadoApostas18(v);
  e.historico.unshift({ t: v.t, ...l });
  if (e.historico.length > 200) e.historico.length = 200;
}

/** Normaliza (saves antigos não têm nada; os novos completam campos). Idempotente. */
export function normalizarApostas18(v: Vida): void {
  if (!v.apostas18) return;
  estadoApostas18(v);
  if (v.apostas18.bilhetes.length > 120) v.apostas18.bilhetes = v.apostas18.bilhetes.slice(-120);
  if (v.apostas18.esportivas.length > 120) v.apostas18.esportivas = v.apostas18.esportivas.slice(-120);
  if (v.apostas18.corridas.length > 40) v.apostas18.corridas = v.apostas18.corridas.slice(-40);
}

export const anoDaVida = (v: Vida) => anoDe(v.t);
