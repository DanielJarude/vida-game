/**
 * VIDA 12.9.1 — O COLÉGIO ELEITORAL DOS EUA (as regras). Antes, a eleição presidencial americana do jogo se decidia pelo
 * voto popular nacional (pluralidade). Agora:
 *
 *   1. O VOTO POPULAR de cada candidato no país (o que a campanha, as pesquisas e a urna produzem) é a base.
 *   2. CADA ESTADO vota diferente do país: a inclinação dele (`lean`, a margem de 2024 contra a nacional) puxa o candidato
 *      de esquerda para cima onde o estado é mais à esquerda e o de direita onde é mais à direita (o centro não ganha nem
 *      perde com a geografia); e cada estado tem a sua incerteza própria.
 *   3. QUEM VENCE NO ESTADO LEVA TODOS OS DELEGADOS — menos Maine e Nebraska: 2 pelo estado e 1 por distrito.
 *   4. VENCE quem somar 270 dos 538. O voto popular é contado e mostrado, mas não decide: dá para vencer no país e perder
 *      no Colégio (e o contrário).
 *   5. SEM MAIORIA (o empate em 269, um terceiro que leva estados): a Câmara escolhe entre os três primeiros do Colégio,
 *      uma delegação, um voto (12ª Emenda) — 26 de 50 estados. A delegação vota com o eleitorado do estado (aproximação:
 *      a composição real das bancadas não é simulada). Se nenhuma chega a 26, as votações se repetem: o jogo fica com quem
 *      tem mais delegações (e, empatado, o mais votado no país).
 *
 * Puro (recebe o gerador): `presidencia129.apurar` chama para os EUA; os outros países seguem as regras deles.
 */
import type { Rng } from '../rng';
import { ESTADOS_NO_COLEGIO, LADO_DO_PARTIDO, MAIORIA_NA_CAMARA, MAIORIA_NO_COLEGIO, TOTAL_DE_DELEGADOS } from '../dados/colegioEleitoral129';

export { MAIORIA_NO_COLEGIO, TOTAL_DE_DELEGADOS, MAIORIA_NA_CAMARA };

/** O lado no espectro de quem disputa (+ esquerda, − direita, 0 centro/independente). */
export const ladoDoCandidato = (partido?: string) => (partido ? LADO_DO_PARTIDO[partido] ?? 0 : 0);

export interface CandidatoNoColegio { nacional: number; lado: number }
export interface ResultadoDoColegio {
  /** O voto popular nacional (%), na ordem dos candidatos. */
  popular: number[];
  /** Os delegados de cada candidato. */
  delegados: number[];
  /** Quem venceu cada unidade (estado ou distrito de ME/NE): índice do candidato. */
  unidades: Record<string, number>;
  /** Os estados (e o DC) ganhos por candidato. */
  estadosGanhos: number[];
  /** Quem fez 270 (ausente: ninguém). */
  maioria?: number;
  /** A eleição pela Câmara, quando ninguém fez 270. */
  contingencia?: { finalistas: number[]; delegacoes: number[]; repetida: boolean };
  /** O presidente eleito (pelo Colégio ou pela Câmara). */
  eleito: number;
}

/**
 * Os delegados a partir de quem venceu cada unidade: no estado, todos os dele; em Maine e Nebraska, os 2 do estado vão
 * para quem venceu no estado e cada distrito tem o seu.
 */
export function contarDelegados(unidades: Record<string, number>, n: number): number[] {
  const d = Array.from({ length: n }, () => 0);
  for (const e of ESTADOS_NO_COLEGIO) {
    const quem = unidades[e.uf];
    if (e.distritos) {
      if (quem !== undefined) d[quem] += e.delegados - e.distritos.length;
      for (const x of e.distritos) { const q = unidades[x.id]; if (q !== undefined) d[q] += 1; }
    } else if (quem !== undefined) d[quem] += e.delegados;
  }
  return d;
}

/** Quem fez a maioria (270), se alguém fez. */
export const quemFezMaioria = (delegados: number[]): number | undefined => {
  const i = delegados.findIndex(x => x >= MAIORIA_NO_COLEGIO);
  return i >= 0 ? i : undefined;
};

/** A eleição pela Câmara (12ª Emenda): os três primeiros do Colégio; cada estado vota no finalista que o seu eleitorado preferiu. */
export function eleicaoNaCamara(delegados: number[], popular: number[], preferidoNoEstado: (uf: string, finalistas: number[]) => number): NonNullable<ResultadoDoColegio['contingencia']> & { eleito: number } {
  const finalistas = delegados.map((_x, i) => i).filter(i => delegados[i] > 0).sort((a, b) => delegados[b] - delegados[a] || popular[b] - popular[a]).slice(0, 3);
  const delegacoes = delegados.map(() => 0);
  for (const e of ESTADOS_NO_COLEGIO) if (e.uf !== 'DC') delegacoes[preferidoNoEstado(e.uf, finalistas)]++;
  const comMaioria = finalistas.find(i => delegacoes[i] >= MAIORIA_NA_CAMARA);
  if (comMaioria !== undefined) return { finalistas, delegacoes, repetida: false, eleito: comMaioria };
  const eleito = [...finalistas].sort((a, b) => delegacoes[b] - delegacoes[a] || popular[b] - popular[a])[0];
  return { finalistas, delegacoes, repetida: true, eleito };
}

/** A votação em cada estado (e distrito): o voto nacional puxado pela inclinação do lugar, com a incerteza de cada um. */
export function apurarColegio(cands: CandidatoNoColegio[], rng: Rng, ruidoEstadual = 2.5): ResultadoDoColegio {
  const soma = cands.reduce((s, c) => s + c.nacional, 0) || 1;
  const popular = cands.map(c => (c.nacional / soma) * 100);
  const noLugar = (lean: number) => {
    const xs = popular.map((p, i) => Math.max(0.5, p + cands[i].lado * lean * 0.5 + rng.normal() * ruidoEstadual));
    const s = xs.reduce((a, b) => a + b, 0);
    return xs.map(x => (x / s) * 100);
  };
  const venc = (xs: number[]) => xs.indexOf(Math.max(...xs));
  const unidades: Record<string, number> = {};
  const porEstado: Record<string, number[]> = {};
  for (const e of ESTADOS_NO_COLEGIO) {
    const xs = noLugar(e.lean);
    porEstado[e.uf] = xs;
    unidades[e.uf] = venc(xs);
    for (const d of e.distritos ?? []) unidades[d.id] = venc(noLugar(d.lean));
  }
  const delegados = contarDelegados(unidades, cands.length);
  const estadosGanhos = cands.map((_c, i) => ESTADOS_NO_COLEGIO.filter(e => unidades[e.uf] === i).length);
  const maioria = quemFezMaioria(delegados);
  if (maioria !== undefined) return { popular, delegados, unidades, estadosGanhos, maioria, eleito: maioria };
  const c = eleicaoNaCamara(delegados, popular, (uf, finalistas) => [...finalistas].sort((a, b) => porEstado[uf][b] - porEstado[uf][a])[0]);
  return { popular, delegados, unidades, estadosGanhos, contingencia: { finalistas: c.finalistas, delegacoes: c.delegacoes, repetida: c.repetida }, eleito: c.eleito };
}
