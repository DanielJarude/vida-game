/**
 * REWORK 9.7 · EDU-04 — as notas da escola numa população.
 *
 * N vidas ao acaso da creche ao fim do médio, com três posturas (dedicada, no ritmo, empurrando). Por idade: o
 * desempenho do ano (0..100), as notas por matéria do boletim (na escala do país) e o domínio das matérias (o que se
 * sabe, outra escala). Por vida: quantas vezes a nota subiu e caiu de um ano para o outro, a inclinação do desempenho
 * (sobe sozinho com a idade?) e a amplitude entre vidas.
 *
 *   npx esbuild scripts/sim/notas97.ts --bundle --platform=node --outfile=<scratch>/n97.cjs && N=300 node <scratch>/n97.cjs
 */
import { criarVida, type OpcoesCriacao } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { executar } from '../../src/motor/acoes';
import { idade, transacao } from '../../src/motor/nucleo';
import { mediaEscolar } from '../../src/motor/sistemas/frentes';
import { esperadoNaSerie } from '../../src/motor/dados/frentes';
import type { Vida } from '../../src/motor/tipos';

const N = Number(process.env.N ?? 200);
const CIDADES = ['recife-pe', 'sao-paulo-sp', 'porto-alegre-rs', 'belem-pa', 'uberaba-mg', 'salvador-ba', 'manaus-am', 'curitiba-pr'];
const POSTURAS = ['dedicada', 'normal', 'relaxada'] as const;
const op = (k: number): OpcoesCriacao => ({ nome: 'Sim', sobrenome: 'Ulação', genero: k % 2 ? 'masculino' : 'feminino', municipioId: CIDADES[k % CIDADES.length], semente: 97000 + k * 17 });
function viverUmAno(v: Vida): Vida {
  let n = avancarAno(v).vida;
  for (let k = 0; k < 12 && n.momento && !n.morte; k++) { const o = n.momento.opcoes.find(x => !x.bloqueio) ?? n.momento.opcoes[0]; n = executar(n, { tipo: 'decidir', opcaoId: o.id }).vida; }
  n.momento = null;
  return n;
}
const media = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : NaN);
const pct = (xs: number[], p: number) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : NaN; };
const f1 = (x: number) => (Number.isFinite(x) ? x.toFixed(1) : '—');

const porIdade: Record<string, Record<number, { des: number[]; nota: number[]; dom: number[] }>> = {};
const subidas: number[] = [], quedas: number[] = [], inclinacao: number[] = [];
let foraDaEscala = 0, notas = 0, anos = 0;
const t0 = Date.now();
for (let k = 0; k < N; k++) {
  const postura = POSTURAS[k % 3];
  let v = criarVida(op(k));
  const serie: number[] = [];
  while (!v.morte && idade(v) < 19) {
    v = viverUmAno(v); anos++;
    if (idade(v) >= 6) v = transacao(v, x => { x.educacao.postura = postura; }).vida;
    const b = v.educacao.basica;
    if (!b || v.educacao.evadiu || b.etapa === 'creche' || b.etapa === 'pre') continue;
    const i = idade(v);
    const reg = ((porIdade[postura] ??= {})[i] ??= { des: [], nota: [], dom: [] });
    reg.des.push(b.desempenho);
    reg.dom.push(mediaEscolar(v));
    const ns = Object.values(b.notas ?? {}) as number[];
    for (const n of ns) { notas++; if (n < 0 || n > 10) foraDaEscala++; }
    if (ns.length) reg.nota.push(media(ns));
    serie.push(b.desempenho);
  }
  if (serie.length >= 4) {
    let s = 0, q = 0;
    for (let j = 1; j < serie.length; j++) { if (serie[j] > serie[j - 1] + 2) s++; else if (serie[j] < serie[j - 1] - 2) q++; }
    subidas.push(s); quedas.push(q);
    // Inclinação (mínimos quadrados) do desempenho por ano de escola.
    const xs = serie.map((_, j) => j), mx = media(xs), my = media(serie);
    inclinacao.push(xs.reduce((a, x, j) => a + (x - mx) * (serie[j] - my), 0) / xs.reduce((a, x) => a + (x - mx) ** 2, 0));
  }
}
console.log(`# Notas escolares — ${N} vidas (${anos} anos, ${((Date.now() - t0) / anos).toFixed(1)} ms/ano)\n`);
for (const p of POSTURAS) {
  console.log(`\n## Postura: ${p}\n\n| idade | n | desempenho (p10 · média · p90) | nota do boletim, média das matérias (p10 · média · p90) | domínio médio | esperado na série |\n|---|---|---|---|---|---|`);
  for (const [i, r] of Object.entries(porIdade[p] ?? {})) console.log(`| ${i} | ${r.des.length} | ${pct(r.des, 0.1)} · ${f1(media(r.des))} · ${pct(r.des, 0.9)} | ${f1(pct(r.nota, 0.1))} · ${f1(media(r.nota))} · ${f1(pct(r.nota, 0.9))} | ${f1(media(r.dom))} | ${f1(esperadoNaSerie(Number(i)))} |`);
}
console.log(`\n- Notas por matéria registradas: ${notas}; fora de 0..10: ${foraDaEscala}.`);
console.log(`- Por vida: anos em que o desempenho subiu > 2 pontos (média ${f1(media(subidas))}), caiu > 2 (média ${f1(media(quedas))}); vidas que nunca caíram: ${quedas.filter(x => x === 0).length} de ${quedas.length}.`);
console.log(`- Inclinação do desempenho por ano (pontos/ano): p10 ${f1(pct(inclinacao, 0.1))} · mediana ${f1(pct(inclinacao, 0.5))} · p90 ${f1(pct(inclinacao, 0.9))}.`);
