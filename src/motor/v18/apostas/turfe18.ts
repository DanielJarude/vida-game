/**
 * VIDA 18 · O TURFE — páreos com cavalos que têm velocidade, fundo (resistência), forma, peso e preferência de distância;
 * o resultado da corrida sai do desempenho de cada um mais o acaso do dia (`rngDe(v.id, 'pareo18', hipódromo, número)`,
 * o mesmo para quem apostou e quem não apostou). As chances de cada cavalo vêm de simular a MESMA corrida milhares de
 * vezes com outro gerador; a "odd" é a da bolsa (o pari-mutuel do Jockey: o que volta é o total apostado menos o
 * desconto, dividido pelos que acertaram — aqui, pela chance, com o desconto de 30%).
 *
 * O cavalo da casa: quem tem haras com cavalos de corrida inscreve um no páreo (paga a inscrição) e ele corre com os
 * números dele; chega onde a corrida o põe, e o prêmio dos proprietários (1º a 5º) entra na conta.
 */
import type { Vida } from '../../tipos';
import { clamp, rngDe, type Rng } from '../../rng';
import { anoDe } from '../../tempo';
import { paisDaVida } from '../../mundo/vida';
import { CAVALOS18, DESCONTO_TURFE, DISTANCIAS18, HIPODROMOS18, JOQUEIS18, type Hipodromo18 } from '../../dados18/apostas/loterias18';
import type { CavaloDeCorrida18 } from '../rural/fazenda18';

export interface Corredor { nome: string; joquei: string; idade: number; peso: number; velocidade: number; fundo: number; forma: number; daCasa?: string }
export interface Pareo { hipodromo: Hipodromo18; numero: number; distancia: number; pista: 'grama' | 'areia'; grandePremio: boolean; corredores: Corredor[] }

export function hipodromosDaVida(v: Vida): Hipodromo18[] {
  const pais = paisDaVida(v);
  const daqui = HIPODROMOS18.filter(h => h.pais === pais);
  return daqui.length ? daqui : HIPODROMOS18.filter(h => h.pais === '*');
}

/** O páreo `numero` do hipódromo (os cavalos, a distância, a pista): estável. O da casa entra se estiver inscrito. */
export function pareo(v: Vida, hipId: string, numero: number, daCasa?: CavaloDeCorrida18): Pareo {
  const h = HIPODROMOS18.find(x => x.id === hipId) ?? HIPODROMOS18[HIPODROMOS18.length - 1];
  const r = rngDe(v.id, 'pareo18-campo', h.id, numero);
  const n = r.int(7, 10);
  const nomes = [...CAVALOS18];
  for (let i = nomes.length - 1; i > 0; i--) { const j = Math.floor(r.next() * (i + 1)); [nomes[i], nomes[j]] = [nomes[j], nomes[i]]; }
  const gp = numero % 25 === 0;
  const base = gp ? 64 : 52;
  const corredores: Corredor[] = nomes.slice(0, n).map((nome, k) => ({
    nome, joquei: JOQUEIS18[(numero + k * 5) % JOQUEIS18.length], idade: r.int(3, 7), peso: r.int(52, 60),
    velocidade: clamp(Math.round(base + r.normal() * 9)), fundo: clamp(Math.round(base + r.normal() * 9)), forma: clamp(Math.round(55 + r.normal() * 14))
  }));
  if (daCasa) {
    const idadeC = anoDe(v.t) - daCasa.nasc;
    corredores[corredores.length - 1] = { nome: daCasa.nome, joquei: JOQUEIS18[numero % JOQUEIS18.length], idade: idadeC, peso: 56, velocidade: daCasa.velocidade, fundo: daCasa.fundo, forma: daCasa.forma, daCasa: daCasa.id };
  }
  return { hipodromo: h, numero, distancia: DISTANCIAS18[r.int(0, DISTANCIAS18.length - 1)], pista: h.pista, grandePremio: gp, corredores };
}

/** O desempenho de um cavalo no páreo (sem o acaso): velocidade em tiro curto, fundo em distância longa, forma e peso. */
export function desempenho(c: Corredor, p: Pareo): number {
  const longo = clamp((p.distancia - 1000) / 1400, 0, 1);
  const idade = c.idade >= 4 && c.idade <= 5 ? 2 : c.idade >= 7 ? -3 : 0;
  return c.velocidade * (1 - longo * 0.6) + c.fundo * (0.4 + longo * 0.6) + (c.forma - 55) * 0.3 - (c.peso - 56) * 0.8 + idade;
}
const SIGMA = 9;

/** A chegada de uma corrida (do 1º ao último). */
function correr(p: Pareo, r: Rng): string[] {
  return p.corredores.map(c => ({ c: c.nome, x: desempenho(c, p) + r.normal() * SIGMA })).sort((a, b) => b.x - a.x).map(x => x.c);
}

/** A chegada do páreo (do mundo: a mesma sempre). */
export const chegada = (v: Vida, p: Pareo) => correr(p, rngDe(v.id, 'pareo18', p.hipodromo.id, p.numero));

/** As chances de cada cavalo (vencer, chegar entre os dois, e a dupla exata) por simulação da mesma corrida. */
export function chancesDoPareo(p: Pareo): { vencer: Record<string, number>; place: Record<string, number>; exata: Record<string, number> } {
  const r = rngDe('chances18', p.hipodromo.id, p.numero, p.corredores.map(c => c.nome).join('|'));
  const N = 4000;
  const vencer: Record<string, number> = {}, place: Record<string, number> = {}, exata: Record<string, number> = {};
  for (let s = 0; s < N; s++) {
    const o = correr(p, r);
    vencer[o[0]] = (vencer[o[0]] ?? 0) + 1 / N;
    place[o[0]] = (place[o[0]] ?? 0) + 1 / N;
    place[o[1]] = (place[o[1]] ?? 0) + 1 / N;
    exata[`${o[0]}>${o[1]}`] = (exata[`${o[0]}>${o[1]}`] ?? 0) + 1 / N;
  }
  return { vencer, place, exata };
}
/** A odd da bolsa: o que volta por real (com o desconto do hipódromo), nunca menos que 1,10. */
export const oddTurfe = (p: number) => Math.max(1.1, Math.round((1 - DESCONTO_TURFE) / Math.max(0.002, p) * 10) / 10);
