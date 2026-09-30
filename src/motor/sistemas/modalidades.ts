/**
 * O que muda de uma modalidade para outra, além do nome. A estrutura da
 * carreira esportiva é uma só (`esporte`: prática → seletiva → base →
 * profissional → fim), mas o basquete e o tênis NÃO são o futebol com outro
 * rótulo:
 *
 *   BASQUETE — coletivo, de clube e temporada (estadual → Liga Ouro → NBB). O
 *   corpo pesa de um jeito que a técnica não compensa inteiro: a ESTATURA
 *   decide a função em quadra (armador, ala, pivô) e entra na seletiva. A
 *   temporada mede pontos, rebotes e assistências por jogo.
 *
 *   TÊNIS — individual, sem clube e sem salário. Caro desde cedo (aulas,
 *   treinador, viagens do circuito juvenil). O profissional vive de
 *   PREMIAÇÃO (o que o ranking alcança) e paga do bolso treinador e viagens:
 *   bruto → custos → líquido, e o líquido pode ser negativo por anos. O
 *   ranking decide o circuito em que se joga (nacional → entrada
 *   internacional → intermediário → principal).
 *
 * Tudo aqui é derivado do estado (sem estado novo persistido): a estatura sai
 * da semente da pessoa; o ranking, da reputação e do nível.
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { CarreiraEsportiva, Dominio, Temporada, Vida } from '../tipos';
import { idade } from '../nucleo';
import { ge } from '../texto';

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967295;
}

/* ------------------------------------------------------------ Estatura */

/**
 * A estatura adulta (cm), da semente da pessoa e da predisposição física —
 * determinística, sem estado. Antes dos 16, cresce até ela.
 */
export function estaturaAdulta(v: Vida): number {
  const f = ge(v) === 'feminino';
  const media = f ? 163 : 176;
  // Soma de uniformes ≈ normal: a maioria perto da média, poucos muito altos.
  const z = (hash(`${v.id}:alt:a`) + hash(`${v.id}:alt:b`) + hash(`${v.id}:alt:c`) - 1.5) * 2;
  return Math.round(media + z * (f ? 7 : 8) + (v.predisposicoes?.fisica ?? 0) * 2);
}

export function estatura(v: Vida): number {
  const i = idade(v);
  const cresce = i >= 17 ? 1 : i <= 6 ? 0.68 : 0.68 + (i - 6) / 11 * 0.32;
  return Math.round(estaturaAdulta(v) * cresce);
}

export const estaturaEmPalavras = (cm: number) => `${Math.floor(cm / 100)},${String(cm % 100).padStart(2, '0')} m`;

export type FuncaoBasquete = 'armador' | 'ala' | 'pivo';
export const NOME_FUNCAO: Record<FuncaoBasquete, string> = { armador: 'armador', ala: 'ala', pivo: 'pivô' };

/** A função em quadra que o corpo pede (a estatura adulta). */
export function funcaoBasquete(v: Vida): FuncaoBasquete {
  const f = ge(v) === 'feminino';
  const a = estaturaAdulta(v);
  return a >= (f ? 184 : 200) ? 'pivo' : a >= (f ? 174 : 189) ? 'ala' : 'armador';
}

/**
 * O quanto a estatura ajuda (ou atrapalha) no basquete, −0,3..+0,35: entra
 * no físico da seletiva e na nota da temporada. O armador baixo compensa
 * com técnica — mas precisa de mais dela.
 */
export function vantagemDeEstatura(v: Vida): number {
  const f = ge(v) === 'feminino';
  return clamp((estatura(v) - (f ? 170 : 184)) / 40, -0.3, 0.35);
}

/* ------------------------------------------------------------ Divisões */

export const DIVISAO_BASQUETE = ['', 'campeonato estadual', 'Liga Ouro (acesso)', 'NBB', 'NBB — entre os times de ponta'];
export const CIRCUITO_TENIS = ['', 'torneios nacionais', 'circuito de entrada internacional', 'circuito intermediário (challengers)', 'circuito principal'];

/* ------------------------------------------------------------ Tênis: dinheiro */

/** O ranking mundial (abstrato) que o nome e o circuito sustentam. */
export function rankingTenis(e: CarreiraEsportiva): number {
  const rep = e.reputacao ?? 20;
  const faixa: [number, number][] = [[0, 0], [1500, 900], [900, 350], [350, 120], [120, 1]];
  const [pior, melhor] = faixa[e.nivel];
  return Math.max(1, Math.round(pior - (pior - melhor) * clamp(rep / 100, 0, 1)));
}

/**
 * A premiação do ano (bruta): o circuito, as vitórias da temporada, o nome.
 * O extraordinário (o circuito principal com ranking alto) é raro por
 * construção — o nível 4 pede reputação que poucos juntam.
 */
export function premiacaoTenis(e: CarreiraEsportiva, t: Pick<Temporada, 'nota' | 'partidas'>, r?: Rng): number {
  const base = [0, 18000, 70000, 230000, 900000][e.nivel];
  const forma = clamp(0.35 + (t.nota - 5) * 0.22, 0.1, 1.8);
  const torneios = Math.max(0.2, t.partidas / [1, 14, 20, 22, 22][e.nivel]);
  const topo = e.nivel === 4 && rankingTenis(e) <= 30 ? 2.6 : 1;
  const sorte = r ? 0.8 + r.next() * 0.4 : 1;
  return Math.round(base * forma * torneios * topo * sorte / 100) * 100;
}

/** O que custa um ano de circuito (treinador, viagens, hotel, inscrição, encordoamento). */
export function custoDoCircuito(nivel: number, torneios: number): number {
  const fixo = [0, 22000, 60000, 110000, 220000][nivel];
  const porTorneio = [0, 1500, 4200, 7000, 12000][nivel];
  return Math.round((fixo + porTorneio * torneios) / 100) * 100;
}

/** O custo de um ano de circuito JUVENIL (quem paga é a casa; sem dinheiro, joga menos torneios). */
export const custoJuvenilTenis = (nivelDaAcademia: number) => [0, 9000, 16000, 24000, 30000][nivelDaAcademia] ?? 9000;

/** A modalidade vive de premiação (e não de salário de clube)? */
export const vivePremiacao = (d: Dominio) => d === 'tenis';
