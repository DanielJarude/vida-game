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
 *   ranking (os pontos dos torneios do ano) decide o circuito em que se
 *   joga (nacional → entrada internacional → intermediário → principal).
 *
 * Tudo aqui é derivado do estado (sem estado novo persistido): a estatura sai
 * da semente da pessoa. O ranking do tênis sai dos pontos dos torneios do
 * ano (`rankingPorPontos`).
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

/**
 * O ranking mundial nasce dos RESULTADOS (FIX final da generalização): cada
 * torneio dá pontos pela rodada alcançada e pelo peso do torneio, e o ranking
 * é a posição que esses pontos do ano ocupam no mundo. Antes, o ranking era
 * uma conta da reputação dentro do circuito — e quase todo profissional
 * acabava entre os trinta melhores do mundo.
 *
 * O campeão de cada nível (no universo do jogo, na escala do ranking
 * mundial): torneio nacional 10, internacional de entrada 40, challenger 125;
 * no principal, pelo porte do torneio (250, 500, masters, os quatro grandes).
 */
export const PONTOS_CAMPEAO = [0, 10, 40, 125, 250];
export const PONTOS_PRINCIPAL = [250, 500, 1000, 2000];
/** A fração dos pontos do campeão por rodadas vencidas (chave de 4 rodadas no nacional; de 5 nos outros). */
const FRACAO: Record<number, number[]> = { 4: [0, 0.15, 0.35, 0.6, 1], 5: [0, 0.08, 0.18, 0.36, 0.6, 1] };
export const pontosDaRodada = (vencidas: number, rodadas: number, campeao: number) => Math.round((FRACAO[rodadas]?.[vencidas] ?? 0) * campeao);

/** Quantos pontos tem quem ocupa cada posição do ranking mundial (a curva do mundo: poucos no topo, a multidão embaixo). */
const CURVA: [number, number][] = [[12000, 1], [5000, 5], [3000, 10], [1900, 20], [1300, 35], [1000, 50], [650, 100], [380, 150], [260, 200], [150, 300], [90, 400], [55, 500], [25, 700], [12, 1000], [5, 1500], [1, 2000]];

/** A posição no ranking mundial que os pontos do ano ocupam. */
export function rankingPorPontos(pontos: number): number {
  if (pontos >= CURVA[0][0]) return 1;
  if (pontos < 1) return 2200;
  for (let k = 1; k < CURVA.length; k++) {
    const [p1, r1] = CURVA[k - 1], [p0, r0] = CURVA[k];
    if (pontos >= p0) {
      // Interpolação em escala logarítmica (dobrar os pontos sobe muito mais posições lá embaixo do que no topo).
      const f = (Math.log(pontos) - Math.log(p0)) / (Math.log(p1) - Math.log(p0));
      return Math.max(1, Math.round(Math.exp(Math.log(r0) + (Math.log(r1) - Math.log(r0)) * f)));
    }
  }
  return 2200;
}

/**
 * O circuito que o ranking abre no ano seguinte. Subir pede ranking para a
 * porta de cima (a entrada nos torneios é por ranking); descer, cair abaixo
 * da linha de baixo — há uma faixa entre as duas em que se fica onde está.
 */
const SOBE = [0, 0, 900, 350, 120];
const DESCE = [0, 0, 1300, 550, 180];
export function circuitoPeloRanking(nivel: number, ranking: number): 1 | 2 | 3 | 4 {
  if (nivel < 4 && ranking <= SOBE[nivel + 1]) return (nivel + 1) as 1 | 2 | 3 | 4;
  if (nivel > 1 && ranking > DESCE[nivel]) return (nivel - 1) as 1 | 2 | 3 | 4;
  return nivel as 1 | 2 | 3 | 4;
}

/** O circuito em que o tenista recém-profissional começa: sem ranking, ninguém entra direto nos torneios grandes. */
export const circuitoDeEstreia = (tecnica: number): 1 | 2 => (tecnica >= 88 ? 2 : 1);

/**
 * A premiação do ano (bruta): o circuito, as vitórias da temporada, o nome.
 * O extraordinário (o circuito principal com ranking alto) é raro por
 * construção — o nível 4 pede reputação que poucos juntam.
 */
export function premiacaoTenis(e: CarreiraEsportiva, t: Pick<Temporada, 'nota' | 'partidas'> & { ranking?: number }, r?: Rng): number {
  const base = [0, 18000, 70000, 230000, 900000][e.nivel];
  const forma = clamp(0.35 + (t.nota - 5) * 0.22, 0.1, 1.8);
  const torneios = Math.max(0.2, t.partidas / [1, 14, 20, 22, 22][e.nivel]);
  const topo = e.nivel === 4 && (t.ranking ?? 9999) <= 30 ? 2.6 : 1;
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
