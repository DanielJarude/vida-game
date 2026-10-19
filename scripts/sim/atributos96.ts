/**
 * REWORK 9.6 · ATR-01 — os cinco atributos numa população e em pares de vidas iguais que só diferem num atributo.
 *
 *   1. N vidas ao acaso até os 75 (decisões pela primeira opção livre): os atributos aos 0, 10, 18, 30, 50 e 70.
 *   2. Pares (mesma semente, um atributo escolhido diferente), vividos de verdade:
 *      - inteligência 30 × 80, com a dedicação dedicada × empurrando: o desempenho escolar dos 8 aos 16;
 *      - físico 20 × 85, com e sem futebol: a forma e a técnica aos 16;
 *      - constituição (saúde ao nascer) 62 × 98: a saúde aos 50 e aos 65, condições crônicas, idade da morte;
 *      - temperamento (felicidade ao nascer) 40 × 90: a felicidade média dos 18 aos 60.
 *   3. Brigas: 1000 brigas de cada intensidade — quantas machucam e quão grave.
 *
 *   npx esbuild scripts/sim/atributos96.ts --bundle --platform=node --outfile=<scratch>/a96.cjs && N=40 node <scratch>/a96.cjs
 */
import { criarVida, type OpcoesCriacao } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { executar } from '../../src/motor/acoes';
import { idade, transacao } from '../../src/motor/nucleo';
import { criarRng } from '../../src/motor/rng';
import { ATRIBUTOS, valorDoAtributo, type Atributo } from '../../src/motor/sistemas/predisposicao';
import { habilidade } from '../../src/motor/sistemas/frentes';
import { machucarNaBriga } from '../../src/motor/sistemas/lesoes';
import type { Vida } from '../../src/motor/tipos';

const N = Number(process.env.N ?? 40);
const CIDADES = ['recife-pe', 'sao-paulo-sp', 'porto-alegre-rs', 'belem-pa', 'uberaba-mg', 'salvador-ba'];
const base = (k: number, at?: Partial<Record<Atributo, number>>): OpcoesCriacao => ({ nome: 'Sim', sobrenome: 'Ulação', genero: k % 2 ? 'masculino' : 'feminino', municipioId: CIDADES[k % CIDADES.length], semente: 96000 + k * 13, atributos: at ? { saude: 86, fisico: 50, felicidade: 72, beleza: 55, inteligencia: 55, ...at } : undefined });
function viverUmAno(v: Vida): Vida {
  let n = avancarAno(v).vida;
  for (let k = 0; k < 12 && n.momento && !n.morte; k++) { const op = n.momento.opcoes.find(o => !o.bloqueio) ?? n.momento.opcoes[0]; n = executar(n, { tipo: 'decidir', opcaoId: op.id }).vida; }
  n.momento = null;
  return n;
}
const media = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : NaN);
const dp = (xs: number[]) => { const m = media(xs); return Math.sqrt(media(xs.map(x => (x - m) ** 2))); };
const f1 = (x: number) => (Number.isFinite(x) ? x.toFixed(1) : '—');

function populacao() {
  const IDADES = [0, 10, 18, 30, 50, 70];
  const por: Record<number, Record<Atributo, number[]>> = Object.fromEntries(IDADES.map(i => [i, Object.fromEntries(ATRIBUTOS.map(a => [a, []]))]));
  let anos = 0; const t0 = Date.now();
  for (let k = 0; k < N; k++) {
    let v = criarVida(base(k));
    while (!v.morte && idade(v) <= 70) {
      if (IDADES.includes(idade(v))) for (const a of ATRIBUTOS) por[idade(v)][a].push(valorDoAtributo(v, a));
      v = viverUmAno(v); anos++;
    }
  }
  console.log(`## 1. População: ${N} vidas ao acaso (${anos} anos vividos, ${((Date.now() - t0) / anos).toFixed(1)} ms por ano)\n`);
  console.log('| idade | n | saúde | físico | felicidade | beleza | inteligência |\n|---|---|---|---|---|---|---|');
  for (const i of IDADES) console.log(`| ${i} | ${por[i].saude.length} | ${ATRIBUTOS.map(a => `${f1(media(por[i][a]))} ± ${f1(dp(por[i][a]))}`).join(' | ')} |`);
}

function pares() {
  console.log('\n## 2. Pares de vidas iguais (mesma semente), um atributo diferente\n');
  // Inteligência × dedicação: o desempenho escolar dos 8 aos 16, de verdade (o ano todo, a escola do motor).
  const escola: Record<string, number[]> = {};
  for (let k = 0; k < N; k++) for (const cog of [30, 80]) for (const postura of ['dedicada', 'relaxada'] as const) {
    let v = criarVida(base(k, { inteligencia: cog }));
    const notas: number[] = [];
    while (!v.morte && idade(v) < 16) { v = viverUmAno(v); if (idade(v) >= 7 && v.educacao.basica) { v = transacao(v, x => { x.educacao.postura = postura; }).vida; } if (idade(v) >= 8 && v.educacao.basica) notas.push(v.educacao.basica.desempenho); }
    (escola[`${cog}-${postura}`] ??= []).push(media(notas));
  }
  console.log('| inteligência ao nascer | dedicação | desempenho médio (8–16) | desvio entre vidas |\n|---|---|---|---|');
  for (const [k, xs] of Object.entries(escola)) { const [c, p] = k.split('-'); console.log(`| ${c} | ${p} | ${f1(media(xs.filter(Number.isFinite)))} | ${f1(dp(xs.filter(Number.isFinite)))} |`); }
  const bd = escola['30-dedicada'], ar = escola['80-relaxada'];
  const vence = bd.filter((x, k) => x > ar[k]).length;
  console.log(`- inteligência 30 + dedicação × inteligência 80 empurrando: a primeira tem desempenho maior em ${vence} de ${bd.length} pares.`);

  // Físico × treino.
  const corpo: Record<string, { forma: number[]; tecnica: number[] }> = {};
  for (let k = 0; k < N; k++) for (const fis of [20, 85]) for (const treina of [true, false]) {
    let v = criarVida(base(k, { fisico: fis }));
    while (!v.morte && idade(v) < 16) { v = viverUmAno(v); v = transacao(v, x => { const tem = x.rotinas.some(r => r.id === 'futebol'); if (treina && !tem && idade(x) >= 6) x.rotinas.push({ id: 'futebol', tInicio: x.t, nivel: 2 }); if (!treina) x.rotinas = x.rotinas.filter(r => r.id !== 'futebol'); }).vida; }
    const c = (corpo[`${fis}-${treina ? 'treina' : 'parado'}`] ??= { forma: [], tecnica: [] });
    c.forma.push(v.corpo.forma); c.tecnica.push(habilidade(v, 'futebol'));
  }
  console.log('\n| físico ao nascer | futebol 6–16 | físico aos 16 | técnica de futebol aos 16 |\n|---|---|---|---|');
  for (const [k, c] of Object.entries(corpo)) { const [f, t] = k.split('-'); console.log(`| ${f} | ${t === 'treina' ? 'treina 2×/semana' : 'não joga'} | ${f1(media(c.forma))} | ${f1(media(c.tecnica))} |`); }

  // Constituição.
  const cons: Record<string, { s50: number[]; s65: number[]; cronicas: number[]; morte: number[] }> = {};
  for (let k = 0; k < N; k++) for (const s of [62, 98]) {
    let v = criarVida(base(k, { saude: s }));
    const c = (cons[s] ??= { s50: [], s65: [], cronicas: [], morte: [] });
    while (!v.morte && idade(v) < 90) { v = viverUmAno(v); if (idade(v) === 50) c.s50.push(v.corpo.saude); if (idade(v) === 65) { c.s65.push(v.corpo.saude); c.cronicas.push(v.corpo.condicoes.filter(x => x.cronica).length); } }
    c.morte.push(idade(v));
  }
  console.log('\n| saúde ao nascer (constituição) | saúde aos 50 | saúde aos 65 | crônicas aos 65 | idade ao morrer (ou 90) |\n|---|---|---|---|---|');
  for (const [s, c] of Object.entries(cons)) console.log(`| ${s} | ${f1(media(c.s50))} | ${f1(media(c.s65))} | ${f1(media(c.cronicas))} | ${f1(media(c.morte))} |`);

  // Temperamento.
  const hum: Record<string, number[]> = {};
  for (let k = 0; k < N; k++) for (const h of [40, 90]) {
    let v = criarVida(base(k, { felicidade: h }));
    const xs: number[] = [];
    while (!v.morte && idade(v) < 60) { v = viverUmAno(v); if (idade(v) >= 18) xs.push(v.mente.felicidade); }
    (hum[h] ??= []).push(media(xs));
  }
  console.log('\n| felicidade ao nascer (temperamento) | felicidade média 18–60 | desvio entre vidas | menor | maior |\n|---|---|---|---|---|');
  for (const [h, xs] of Object.entries(hum)) console.log(`| ${h} | ${f1(media(xs))} | ${f1(dp(xs))} | ${f1(Math.min(...xs))} | ${f1(Math.max(...xs))} |`);
}

function brigas() {
  console.log('\n## 3. Brigas (1000 de cada intensidade, adulto de físico mediano)\n');
  const v0 = criarVida(base(1));
  console.log('| intensidade | machucou | leve | séria | grave | saúde perdida (média) |\n|---|---|---|---|---|---|');
  for (const i of [1, 2, 3] as const) {
    const g = [0, 0, 0, 0]; const perdas: number[] = [];
    for (let k = 0; k < 1000; k++) { const v = structuredClone(v0); v.corpo.forma = 50; v.corpo.saude = 85; v.corpo.condicoes = []; const c = machucarNaBriga(v, criarRng(k + 1), i); g[c?.lesao?.gravidade ?? 0]++; perdas.push(85 - v.corpo.saude); }
    console.log(`| ${i} | ${((1000 - g[0]) / 10).toFixed(1)}% | ${g[1]} | ${g[2]} | ${g[3]} | ${f1(media(perdas))} |`);
  }
}

console.log(`# REWORK 9.6 — atributos (${N} vidas por grupo)\n`);
populacao();
pares();
brigas();
