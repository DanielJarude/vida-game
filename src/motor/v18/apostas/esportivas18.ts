/**
 * VIDA 18 · APOSTAS ESPORTIVAS — só sobre o que o VIDA simula.
 *
 *   A RODADA       os jogos do fim de semana do futebol do país (clubes do catálogo), com a mesma régua de força que a
 *                  temporada usa (`ligas.forcaNaLiga` + a forma do clube, quando a liga do país já existe nesta vida) e o
 *                  mesmo modelo de gols da tabela (`tabelaDaLiga.jogarTabela`: Poisson pela diferença de força, com o
 *                  mando). O placar de cada jogo é do mundo (`rngDe(v.id, 'rodada18', país, rodada, jogo)`): o mesmo
 *                  para quem apostou e para quem não apostou, e o mesmo que a Loteca confere. As odds saem das
 *                  probabilidades EXATAS desse modelo (somando a grade de placares), com a margem da casa.
 *   A TEMPORADA    campeão da elite, G4, rebaixamento e campeão da copa nacional, liquidados pela temporada que o motor
 *                  das ligas joga (`ligas.ligaDe` → histórico e tabela; `competicoes.campeaoDaCopaNoAno`). As odds saem
 *                  de simulações da mesma fórmula de `sortearPosicoes` (força + forma − divisão + o acaso do ano).
 *   A LEI          maior de 18, em operadora autorizada (no Brasil, Lei 14.790/2023); quem é atleta, técnico ou árbitro do
 *                  futebol não aposta no futebol (art. 26).
 */
import type { Vida } from '../../tipos';
import { clamp, rngDe } from '../../rng';
import { clubesDoPais } from '../../dados/clubes';
import { paisDaVida } from '../../mundo/vida';
import { FORCA_SEM_NOME, RUIDO_DA_TEMPORADA, VAGAS_POR_DIVISAO, forcaNaLiga, ligaDe, temporadaCorrente } from '../../sistemas/ligas';
import { campeaoDaCopaNoAno } from '../../sistemas/competicoes';
import { anoDe } from '../../tempo';
import type { MercadoEsportivo } from './estado18';

export const MARGEM_ESPORTIVA = 0.07;

/* ================================================================== A rodada */

export interface JogoDaRodada { casa: string; fora: string; fCasa: number; fFora: number }

const formaDe = (v: Vida, pais: string, c: string) => v.caminhos.ligas?.[pais]?.forma?.[c] ?? 0;
const forcaDoJogo = (v: Vida, pais: string, c: string) => forcaNaLiga(c, pais) + formaDe(v, pais, c);

/** O país do futebol em que se aposta: o da vida (se ele tem clubes no catálogo); senão, o Brasil. */
export function paisDoFutebol(v: Vida): string { const p = paisDaVida(v); return clubesDoPais(p).length >= 8 ? p : 'BR'; }

/** Os jogos da rodada `n` (14, como na Loteca): os clubes mais fortes do catálogo, emparelhados pelo sorteio da rodada. */
export function rodada(v: Vida, n: number, pais = paisDoFutebol(v)): { n: number; pais: string; jogos: JogoDaRodada[] } {
  const clubes = [...clubesDoPais(pais)].sort((a, b) => forcaNaLiga(b.nome, pais) - forcaNaLiga(a.nome, pais) || a.nome.localeCompare(b.nome)).slice(0, 40);
  const r = rngDe(v.id, 'rodada18-jogos', pais, n);
  const b = clubes.map(c => c.nome);
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r.next() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  const jogos: JogoDaRodada[] = [];
  for (let k = 0; k + 1 < b.length && jogos.length < 14; k += 2) jogos.push({ casa: b[k], fora: b[k + 1], fCasa: forcaDoJogo(v, pais, b[k]), fFora: forcaDoJogo(v, pais, b[k + 1]) });
  return { n, pais, jogos };
}
/** A rodada que a Loteca do concurso `n` usa (a mesma numeração: um concurso por rodada). */
export const rodadaDoConcurso = (v: Vida, n: number) => rodada(v, n, 'BR');

/** As médias de gols do jogo (o mesmo modelo da tabela: mando e diferença de força). */
export function mediasDoJogo(j: JogoDaRodada): [number, number] {
  const dif = (j.fCasa - j.fFora) * 0.5;
  return [1.32 * Math.exp(0.45 * dif) + 0.12, 1.08 * Math.exp(-0.45 * dif)];
}
const pmf = (l: number, k: number) => { let p = Math.exp(-l); for (let i = 1; i <= k; i++) p *= l / i; return p; };
/** A grade de placares até 9×9 (a probabilidade de cada um). */
export function gradeDePlacares(j: JogoDaRodada): number[][] {
  const [a, b] = mediasDoJogo(j);
  return Array.from({ length: 10 }, (_, x) => Array.from({ length: 10 }, (_, y) => pmf(a, x) * pmf(b, y)));
}
export function probabilidades(j: JogoDaRodada): { '1': number; X: number; '2': number; mais: number; menos: number } {
  const g = gradeDePlacares(j);
  let c = 0, e = 0, f = 0, mais = 0;
  g.forEach((l, x) => l.forEach((p, y) => { if (x > y) c += p; else if (x === y) e += p; else f += p; if (x + y >= 3) mais += p; }));
  const t = c + e + f;
  return { '1': c / t, X: e / t, '2': f / t, mais: mais / t, menos: 1 - mais / t };
}
/** A odd decimal (o que volta por real apostado) de uma probabilidade, com a margem da casa. */
export const odd = (p: number) => Math.max(1.01, Math.round(1 / (Math.max(0.0005, p) * (1 + MARGEM_ESPORTIVA)) * 100) / 100);

/** O placar do jogo (do mundo: o mesmo para todos), sorteado pela mesma distribuição das odds. */
export function resultadoDoJogo(v: Vida, n: number, k: number, pais = 'BR'): { gols: [number, number]; res: '1' | 'X' | '2' } {
  const j = rodada(v, n, pais).jogos[k];
  const [a, b] = mediasDoJogo(j);
  const r = rngDe(v.id, 'rodada18', pais, n, k);
  const g = (l: number) => { let x = 0, p = Math.exp(-l), s = p; const u = r.next(); while (u > s && x < 12) { x++; p *= l / x; s += p; } return x; };
  const gols: [number, number] = [g(a), g(b)];
  return { gols, res: gols[0] > gols[1] ? '1' : gols[0] === gols[1] ? 'X' : '2' };
}

/* ================================================================== A temporada */

export interface MercadoDaTemporada { ano: number; pais: string; opcoes: { clube: string; campeao: number; g4: number; queda: number; copa: number }[] }

/** A liga do país já está em dia nesta vida (a tela só lê; quem abre o mercado é a ação `abrir_mercado`). */
export function mercadoPronto(v: Vida): boolean {
  const l = v.caminhos.ligas?.[paisDoFutebol(v)];
  return !!l && l.ano >= temporadaCorrente(v) - 1;
}

/** As probabilidades da temporada em curso (simulações da fórmula das ligas). Estável no ano. Só leia com `mercadoPronto`. */
export function mercadoDaTemporada(v: Vida): MercadoDaTemporada | undefined {
  const pais = paisDoFutebol(v);
  const liga = v.caminhos.ligas?.[pais] ?? ligaDe(v, pais);
  const ano = temporadaCorrente(v);
  const elite = Object.keys(liga.div).filter(c => liga.div[c] === 4).sort();
  if (elite.length < 6) return undefined;
  const r = rngDe(v.id, 'mercado18', pais, ano);
  const N = 1500;
  const cont = new Map<string, { campeao: number; g4: number; queda: number }>(elite.map(c => [c, { campeao: 0, g4: 0, queda: 0 }]));
  const forma = (c: string) => liga.forma?.[c] ?? 0;
  for (let s = 0; s < N; s++) {
    const xs = elite.map(c => ({ c, x: 11 - (forcaNaLiga(c, pais) + forma(c) - 4) * 4 + r.normal() * RUIDO_DA_TEMPORADA }));
    for (let k = xs.length; k < VAGAS_POR_DIVISAO; k++) xs.push({ c: '', x: 11 + FORCA_SEM_NOME * 4 + r.normal() * RUIDO_DA_TEMPORADA });
    xs.sort((a, b) => a.x - b.x);
    xs.forEach((y, p) => { if (!y.c) return; const o = cont.get(y.c)!; if (p === 0) o.campeao++; if (p < 4) o.g4++; if (p >= VAGAS_POR_DIVISAO - 4) o.queda++; });
  }
  // A copa: o mata-mata favorece o mais forte, mas menos (a força ao quadrado, normalizada) — a régua de `pelaForca`.
  const somaCopa = clubesDoPais(pais).reduce((s, c) => s + forcaNaLiga(c.nome, pais) ** 2, 0);
  return { ano, pais, opcoes: elite.map(c => { const o = cont.get(c)!; return { clube: c, campeao: o.campeao / N, g4: o.g4 / N, queda: o.queda / N, copa: forcaNaLiga(c, pais) ** 2 / somaCopa * 0.94 }; }).sort((a, b) => b.campeao - a.campeao) };
}

/** O resultado de uma aposta de temporada, se a temporada já fechou; senão, nada. */
export function liquidarTemporada(v: Vida, mercado: MercadoEsportivo, evento: string, palpite: string): { ganhou: boolean; resultado: string } | undefined {
  const [pais, anoS] = evento.split(':');
  const ano = Number(anoS);
  const liga = ligaDe(v, pais);
  if (liga.ano < ano) return undefined;
  if (mercado === 'copa') {
    const c = campeaoDaCopaNoAno(v, pais, ano);
    if (!c) return { ganhou: false, resultado: 'Sem campeão registrado.' };
    return { ganhou: c === palpite, resultado: `Campeão da copa: ${c.replace(/^~/, '')}.` };
  }
  const h = liga.historico?.find(x => x.ano === ano);
  if (mercado === 'campeao') { const c = h?.liga?.replace(/^~/, ''); return { ganhou: c === palpite, resultado: `Campeão: ${c ?? '—'}.` }; }
  const tab = liga.ultima?.ano === ano ? liga.ultima.tabelas?.[4] : undefined;
  if (!tab) return { ganhou: false, resultado: 'A tabela da temporada não ficou registrada: aposta devolvida.' };
  const pos = tab.findIndex(l => l[0] === palpite) + 1;
  if (pos <= 0) return { ganhou: false, resultado: `${palpite} não terminou na elite.` };
  return mercado === 'g4' ? { ganhou: pos <= 4, resultado: `${palpite} terminou em ${pos}º.` } : { ganhou: pos > tab.length - 4, resultado: `${palpite} terminou em ${pos}º.` };
}

/** Atleta, técnico ou árbitro do futebol não aposta em futebol (Lei 14.790/2023, art. 26). */
export function impedidoNoFutebol(v: Vida): boolean {
  const e = v.caminhos.esporte;
  if (e && e.modalidade === 'futebol' && e.fase === 'profissional') return true;
  if ((v.caminhos.carreirasEsportivas ?? []).some(x => x.modalidade === 'futebol' && x.fase === 'profissional')) return true;
  const ps = v.caminhos.tecnico?.passagens ?? [];
  if (ps.length && ps[ps.length - 1].ate === undefined) return true;
  return /arbitr/.test(v.trabalho.atual?.ocupacaoId ?? '');
}

export const anoAgora = (v: Vida) => anoDe(v.t);
export { clamp };
