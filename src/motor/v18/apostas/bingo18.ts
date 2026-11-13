/**
 * VIDA 18 · O BINGO de 75 bolas. Cada rodada tem as cartelas de todo mundo no salão (as da vida e as dos outros), as bolas
 * saem uma a uma (`rngDe(v.id, 'bingo18', número)`), e ganha QUEM completa primeiro: a primeira linha (a "quina" do
 * bingo brasileiro) e a cartela cheia. Empate divide. Nada é decidido antes: o resultado é o que as bolas fizeram.
 *
 * A lei: no Brasil, bingo comercial é proibido (Lei 9.981/2000 revogou a autorização da Lei Pelé); o que existe é o
 * bingo beneficente de quermesse e de festa junina, autorizado como sorteio filantrópico, com prendas — não dinheiro.
 * Fora do Brasil (onde a lei permite), o salão comercial, com prêmio em dinheiro.
 */
import type { Vida } from '../../tipos';
import { rngDe, type Rng } from '../../rng';
import { paisDaVida } from '../../mundo/vida';
import { BINGO_BOLAS, BINGO_PREMIO } from '../../dados18/apostas/loterias18';

export type Cartela = number[][]; // 5×5, 0 = casa livre

export function novaCartela(r: Rng): Cartela {
  const cols = [0, 1, 2, 3, 4].map(c => {
    const nums = Array.from({ length: 15 }, (_, k) => c * 15 + k + 1);
    for (let i = nums.length - 1; i > 0; i--) { const j = Math.floor(r.next() * (i + 1)); [nums[i], nums[j]] = [nums[j], nums[i]]; }
    return nums.slice(0, 5);
  });
  cols[2][2] = 0;
  return [0, 1, 2, 3, 4].map(l => [0, 1, 2, 3, 4].map(c => cols[c][l]));
}

const marcada = (x: number, saiu: Set<number>) => x === 0 || saiu.has(x);
export function temLinha(c: Cartela, saiu: Set<number>): boolean {
  for (let i = 0; i < 5; i++) { if (c[i].every(x => marcada(x, saiu))) return true; if (c.every(l => marcada(l[i], saiu))) return true; }
  return [0, 1, 2, 3, 4].every(i => marcada(c[i][i], saiu)) || [0, 1, 2, 3, 4].every(i => marcada(c[i][4 - i], saiu));
}
export const cheia = (c: Cartela, saiu: Set<number>) => c.every(l => l.every(x => marcada(x, saiu)));

export const bingoBeneficente = (v: Vida) => paisDaVida(v) === 'BR';

export interface RodadaDeBingo { numero: number; bolas: number[]; minhas: Cartela[]; outras: number; preco: number; linha: { bola: number; minhas: number; total: number }; cheia: { bola: number; minhas: number; total: number }; premioLinha: number; premioCheia: number; recebido: number }

/** Joga uma rodada inteira: as cartelas da vida (`n`), as dos outros, as bolas até a cartela cheia. */
export function jogarBingo(v: Vida, numero: number, n: number, preco: number): RodadaDeBingo {
  const r = rngDe(v.id, 'bingo18', numero);
  const outras = r.int(60, 160);
  const minhas = Array.from({ length: n }, () => novaCartela(r));
  const deles = Array.from({ length: outras }, () => novaCartela(r));
  const bolas = Array.from({ length: BINGO_BOLAS }, (_, k) => k + 1);
  for (let i = bolas.length - 1; i > 0; i--) { const j = Math.floor(r.next() * (i + 1)); [bolas[i], bolas[j]] = [bolas[j], bolas[i]]; }
  const saiu = new Set<number>();
  let linha: RodadaDeBingo['linha'] | undefined, fim: RodadaDeBingo['cheia'] | undefined;
  let k = 0;
  for (; k < bolas.length && !fim; k++) {
    saiu.add(bolas[k]);
    if (!linha) { const m = minhas.filter(c => temLinha(c, saiu)).length, o = deles.filter(c => temLinha(c, saiu)).length; if (m + o) linha = { bola: k + 1, minhas: m, total: m + o }; }
    const m = minhas.filter(c => cheia(c, saiu)).length, o = deles.filter(c => cheia(c, saiu)).length;
    if (m + o) fim = { bola: k + 1, minhas: m, total: m + o };
  }
  const venda = (outras + n) * preco;
  const premioLinha = Math.round(venda * BINGO_PREMIO.linha * 100) / 100;
  const premioCheia = Math.round(venda * BINGO_PREMIO.cheia * 100) / 100;
  const recebido = Math.round((linha!.minhas / linha!.total * premioLinha + fim!.minhas / fim!.total * premioCheia) * 100) / 100;
  return { numero, bolas: bolas.slice(0, k), minhas, outras, preco, linha: linha!, cheia: fim!, premioLinha, premioCheia, recebido };
}
