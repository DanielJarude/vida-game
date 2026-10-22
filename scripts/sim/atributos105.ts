/**
 * REWORK 10.5 · BAL-03 — os atributos do começo da vida: ao nascer e nos primeiros anos (0, 1, 3, 6, 10, 15), numa
 * população ao acaso (o nascimento sorteado no mundo). Mede a mediana, o p10 e o p90 de cada atributo e quantos bebês
 * têm a felicidade "caindo" no primeiro ano — o jogador percebia os atributos começando baixos e caindo.
 *
 *   npx esbuild scripts/sim/atributos105.ts --bundle --platform=node --outfile=<scratch>/a.cjs && N=200 node <scratch>/a.cjs
 */
import { criarVida, sortearNascimento } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { executar } from '../../src/motor/acoes';
import { idade } from '../../src/motor/nucleo';
import { ATRIBUTOS, valorDoAtributo } from '../../src/motor/sistemas/predisposicao';
import { criarRng } from '../../src/motor/rng';
import type { Vida } from '../../src/motor/tipos';

const N = Number(process.env.N ?? 200);
const IDADES = [0, 1, 3, 6, 10, 15];
const medidas: Record<number, Record<string, number[]>> = {};
let caiu = 0;
for (let k = 0; k < N; k++) {
  let v: Vida = criarVida({ ...sortearNascimento(criarRng(105000 + k)), semente: 105000 + k } as Parameters<typeof criarVida>[0]);
  const f0 = v.mente.felicidade;
  for (let a = 0; a <= 15 && !v.morte; a++) {
    if (IDADES.includes(idade(v))) for (const at of ATRIBUTOS) ((medidas[idade(v)] ??= {})[at] ??= []).push(valorDoAtributo(v, at));
    if (idade(v) === 1 && v.mente.felicidade < f0 - 4) caiu++;
    v = avancarAno(v).vida;
    for (let j = 0; j < 12 && v.momento; j++) v = executar(v, { tipo: 'decidir', opcaoId: (v.momento.opcoes.find(o => !o.bloqueio) ?? v.momento.opcoes[0]).id }).vida;
    v.momento = null;
  }
}
const q = (xs: number[], p: number) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
for (const i of IDADES) console.log(`${String(i).padStart(2)} anos: ${ATRIBUTOS.map(a => `${a} ${q(medidas[i][a], 0.1)}/${q(medidas[i][a], 0.5)}/${q(medidas[i][a], 0.9)}`).join(' · ')}`);
console.log(`bebês com a felicidade caindo mais de 4 pontos no primeiro ano: ${caiu}/${N}`);
