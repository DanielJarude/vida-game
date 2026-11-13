/**
 * VIDA 19 — OS JOGOS DA TEMPORADA: uma partida, um placar, para todo mundo.
 *
 * Antes (HOTFIX 11.5.1 / VIDA 18), a ordem da temporada saía de um sorteio de colocações, a tabela era jogada depois
 * com linhas anônimas (os nomes postos pela ordem de chegada) e a rodada das apostas e da Loteca sorteava 14 jogos à
 * parte, de clubes de qualquer divisão: o "Flamengo 2 × 1 Palmeiras" da aposta não existia na tabela.
 *
 * Agora cada divisão nacional (2 a 4) joga turno e returno de VERDADE: o calendário (38 rodadas de 10 jogos), e cada
 * partida tem um placar só — função dos dois clubes, da força de cada um na temporada e de um sorteio da PARTIDA
 * (`rngDe` do país, do ano, da divisão e dos dois nomes). A mesma conta serve:
 *   - à tabela e à classificação (a soma das 380 partidas), e portanto ao campeão, ao acesso e ao rebaixamento;
 *   - à rodada das apostas, ao placar exato e à Loteca (o mesmo jogo, lido antes ou depois de a temporada fechar).
 *
 * A força de um clube na temporada = a força do elenco (`ligas.forcaNaLiga`) + a forma das temporadas anteriores − o
 * degrau da divisão + o momento do ano (um sorteio do clube no ano). O clube da vida (atleta, técnico) entra com a força
 * que a carreira dele deu.
 */
import type { Rng } from '../rng';
import { rngDe } from '../rng';
import { compararLinhas, type LinhaDaTabela } from './tabelaDaLiga';

/** As médias de gols de uma partida (a casa tem o mando; a diferença de força pesa). O mesmo modelo das odds. */
export function mediasDaPartida(fCasa: number, fFora: number): [number, number] {
  const dif = (fCasa - fFora) * 0.5;
  return [1.32 * Math.exp(0.45 * dif) + 0.12, 1.08 * Math.exp(-0.45 * dif)];
}

function poisson(l: number, u: number): number {
  let x = 0, p = Math.exp(-l), s = p;
  while (u > s && x < 12) { x++; p *= l / x; s += p; }
  return x;
}

/** O sorteio de uma partida (dois números: um para cada lado). Só depende de quem joga, onde e quando. */
export function sorteioDaPartida(vid: string, pais: string, ano: number, div: number, casa: string, fora: string): [number, number] {
  const r = rngDe(vid, 'partida19', pais, ano, div, casa, fora);
  return [r.next(), r.next()];
}

export function placarDaPartida(u: [number, number], fCasa: number, fFora: number): [number, number] {
  const [a, b] = mediasDaPartida(fCasa, fFora);
  return [poisson(a, u[0]), poisson(b, u[1])];
}

/** O calendário de turno e returno (método do círculo): as rodadas, cada uma com os pares [mandante, visitante]. */
export function calendario(nomes: string[], r: Rng): [string, string][][] {
  const xs = [...nomes];
  for (let i = xs.length - 1; i > 0; i--) { const j = Math.floor(r.next() * (i + 1)); [xs[i], xs[j]] = [xs[j], xs[i]]; }
  if (xs.length % 2) xs.push('');
  const n = xs.length;
  const turno: [string, string][][] = [];
  const roda = [...xs];
  for (let k = 0; k < n - 1; k++) {
    const rodada: [string, string][] = [];
    for (let i = 0; i < n / 2; i++) {
      const a = roda[i], b = roda[n - 1 - i];
      if (!a || !b) continue;
      rodada.push(k % 2 === 0 ? (i === 0 ? [a, b] : [a, b]) : [b, a]);
    }
    turno.push(rodada);
    roda.splice(1, 0, roda.pop()!);
  }
  return [...turno, ...turno.map(rd => rd.map(([a, b]) => [b, a] as [string, string]))];
}

export interface Temporada19 {
  /** As rodadas: [mandante, visitante, gols do mandante, gols do visitante]. */
  rodadas: [string, string, number, number][][];
  /** A tabela, já na ordem dos critérios. */
  linhas: LinhaDaTabela[];
}

/**
 * A temporada de uma divisão: todas as partidas e a tabela que elas fazem. `forca(c)`: a força de cada clube no ano.
 * `marca`: o mínimo de gols do clube da vida (os gols que o atleta fez, os que o goleiro sofreu) — somados em partidas
 * em que o resultado não muda (gol a mais numa vitória; sofrido a mais numa derrota).
 */
export function jogarTemporada19(vid: string, pais: string, ano: number, div: number, nomes: string[], forca: (c: string) => number, marca?: { clube: string; gp?: number; gc?: number }): Temporada19 {
  const cal = calendario([...nomes].sort(), rngDe(vid, 'calendario19', pais, ano, div));
  const f = new Map(nomes.map(c => [c, forca(c)]));
  const rodadas = cal.map(rd => rd.map(([a, b]) => { const [ga, gb] = placarDaPartida(sorteioDaPartida(vid, pais, ano, div, a, b), f.get(a)!, f.get(b)!); return [a, b, ga, gb] as [string, string, number, number]; }));
  if (marca) ajustarMarca(rodadas, marca);
  return { rodadas, linhas: tabelaDasPartidas(nomes, rodadas, f) };
}

function ajustarMarca(rodadas: [string, string, number, number][][], m: { clube: string; gp?: number; gc?: number }): void {
  const jogos = rodadas.flat().filter(j => j[0] === m.clube || j[1] === m.clube);
  const meus = (j: [string, string, number, number]) => (j[0] === m.clube ? j[2] : j[3]);
  const deles = (j: [string, string, number, number]) => (j[0] === m.clube ? j[3] : j[2]);
  let falta = Math.max(0, (m.gp ?? 0) - jogos.reduce((s, j) => s + meus(j), 0));
  const vitorias = jogos.filter(j => meus(j) > deles(j));
  for (let k = 0; falta > 0 && vitorias.length && k < 400; k++, falta--) { const j = vitorias[k % vitorias.length]; if (j[0] === m.clube) j[2]++; else j[3]++; }
  let sofrer = Math.max(0, (m.gc ?? 0) - jogos.reduce((s, j) => s + deles(j), 0));
  const derrotas = jogos.filter(j => meus(j) < deles(j));
  for (let k = 0; sofrer > 0 && derrotas.length && k < 400; k++, sofrer--) { const j = derrotas[k % derrotas.length]; if (j[0] === m.clube) j[3]++; else j[2]++; }
}

/** A tabela que as partidas fazem: J, V, E, D, GP, GC — ordenada por pontos, vitórias, saldo, gols; empate total: o mais forte. */
export function tabelaDasPartidas(nomes: string[], rodadas: [string, string, number, number][][], f: Map<string, number>): LinhaDaTabela[] {
  const l = new Map<string, LinhaDaTabela>(nomes.map(c => [c, [c, 0, 0, 0, 0, 0, 0]]));
  for (const [a, b, ga, gb] of rodadas.flat()) {
    const x = l.get(a)!, y = l.get(b)!;
    x[1]++; y[1]++; x[5] += ga; x[6] += gb; y[5] += gb; y[6] += ga;
    if (ga > gb) { x[2]++; y[4]++; } else if (ga < gb) { y[2]++; x[4]++; } else { x[3]++; y[3]++; }
  }
  return [...l.values()].sort((a, b) => compararLinhas(a, b) || (f.get(b[0])! - f.get(a[0])!) || (a[0] < b[0] ? -1 : 1));
}
