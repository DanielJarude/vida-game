/**
 * REWORK 9.6 · NASC-01/02/03 — o "Tudo ao acaso" numa população: N nascimentos sorteados (o MESMO sorteio que a tela
 * Nascer faz ao abrir e no botão), com sementes variadas, e a vida criada de cada um. Mede:
 *   - gênero (a política: meio a meio entre mulher e homem; "não binária" só por escolha), países (peso = população^0,3),
 *     divisões, cidades, classes;
 *   - os cinco atributos ao nascer (média, desvio, p1/p99, extremos);
 *   - a consistência das dependências (a cidade é do país; nome e sobrenome existem; pais coerentes com o arranjo;
 *     atributos no intervalo; a prévia é a vida criada);
 *   - a repetição: a combinação (gênero, cidade) mais frequente.
 *
 *   npx esbuild scripts/sim/nascimentos96.ts --bundle --platform=node --outfile=<scratch>/n96.cjs && N=10000 node <scratch>/n96.cjs
 */
import { criarVida, previaDoNascimento, sortearNascimento, pesoDoPaisAoAcaso } from '../../src/motor/criacao';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { paisesVivenciaveis } from '../../src/motor/mundo/registro';
import { municipio } from '../../src/motor/dados/lugares';
import { criarRng } from '../../src/motor/rng';
import { visualAleatorio } from '../../src/motor/pessoas';
import { ATRIBUTOS, valorDoAtributo } from '../../src/motor/sistemas/predisposicao';

const N = Number(process.env.N ?? 10000);

async function principal() {
  await carregarMundo();
  const paises = paisesVivenciaveis();
  const pesoTotal = paises.reduce((s, p) => s + pesoDoPaisAoAcaso(p.populacao), 0);
  const conta = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1);
  const genero = new Map<string, number>(), pais = new Map<string, number>(), divisao = new Map<string, number>(), cidade = new Map<string, number>(), classe = new Map<string, number>(), combo = new Map<string, number>(), arranjo = new Map<string, number>();
  const valores: Record<string, number[]> = Object.fromEntries(ATRIBUTOS.map(a => [a, []]));
  const problemas: string[] = [];
  let fragil = 0;
  const t0 = Date.now();
  for (let k = 0; k < N; k++) {
    // Sementes variadas, como Math.random daria (cada nascimento com o seu gerador).
    const r = criarRng(((k + 1) * 2654435761) % 2147483646 + 1);
    const n = sortearNascimento(r);
    const vis = visualAleatorio(r, n.genero);
    const o = { nome: n.nome, sobrenome: n.sobrenome, genero: n.genero, municipioId: n.municipioId, visual: vis, herdarCores: true, semente: n.semente };
    const v = criarVida(o);
    const m = municipio(n.municipioId);
    conta(genero, n.genero); conta(pais, m.pais); conta(divisao, `${m.pais}/${m.uf ?? '-'}`); conta(cidade, m.id); conta(classe, v.origem.classe); conta(combo, `${n.genero} · ${m.id}`); conta(arranjo, v.origem.arranjo);
    for (const a of ATRIBUTOS) valores[a].push(valorDoAtributo(v, a));
    if (v.corpo.saude < 65) fragil++;
    // Consistência.
    if (!n.nome.trim() || !n.sobrenome.trim()) problemas.push(`${k}: nome vazio`);
    if (v.moradia.municipioId !== n.municipioId || v.eu.municipioNatal !== n.municipioId) problemas.push(`${k}: cidade divergente`);
    if (v.eu.nacionalidades[0] !== m.pais) problemas.push(`${k}: nacionalidade ≠ país natal`);
    const mae = Object.values(v.vinculos).some(x => x.parentesco === 'mae');
    if (!mae) problemas.push(`${k}: sem mãe registrada`);
    for (const a of ATRIBUTOS) { const x = valorDoAtributo(v, a); if (!(x >= 0 && x <= 100)) problemas.push(`${k}: ${a} fora do intervalo (${x})`); }
    if (k < 300) {
      const p = previaDoNascimento(o);
      for (const a of ATRIBUTOS) if (p.atributos[a] !== valorDoAtributo(v, a)) problemas.push(`${k}: prévia de ${a} ≠ vida criada`);
      if (JSON.stringify(p.eu) !== JSON.stringify(v.eu.visual)) problemas.push(`${k}: prévia do rosto ≠ vida criada`);
    }
  }
  const ms = Date.now() - t0;
  const pct = (x: number) => `${(100 * x / N).toFixed(2)}%`;
  const top = (m: Map<string, number>, q = 12) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, q).map(([k, x]) => `${k} ${x} (${pct(x)})`);
  console.log(`# ${N} nascimentos ao acaso (${ms} ms; ${(ms / N).toFixed(2)} ms cada) — ${paises.length} países vivíveis`);
  console.log('\n## Gênero (política: 50% mulher, 50% homem; não binária só por escolha)');
  for (const [k, x] of genero) console.log(`- ${k}: ${x} (${pct(x)})`);
  const f = genero.get('feminino') ?? 0;
  const z = (f - N / 2) / Math.sqrt(N / 4);
  console.log(`- desvio da metade: z = ${z.toFixed(2)} (|z| < 2,6 ⇒ compatível com 50/50 a 99%)`);
  console.log('\n## Países: observado × esperado pelo peso (população^0,3)');
  const linhas = paises.map(p => ({ id: p.id, obs: pais.get(p.id) ?? 0, esp: N * pesoDoPaisAoAcaso(p.populacao) / pesoTotal })).sort((a, b) => b.esp - a.esp);
  let chi = 0;
  for (const l of linhas) chi += (l.obs - l.esp) ** 2 / l.esp;
  for (const l of linhas.slice(0, 10)) console.log(`- ${l.id}: ${l.obs} (esperado ${l.esp.toFixed(0)})`);
  console.log(`- … ${linhas.length} países; o menos provável: ${linhas[linhas.length - 1].id} ${linhas[linhas.length - 1].obs} (esperado ${linhas[linhas.length - 1].esp.toFixed(1)})`);
  console.log(`- qui-quadrado = ${chi.toFixed(1)} com ${linhas.length - 1} graus de liberdade; países nunca sorteados: ${linhas.filter(l => !l.obs).map(l => l.id).join(', ') || 'nenhum'}`);
  console.log(`\n## Brasil: ${pais.get('BR') ?? 0} (${pct(pais.get('BR') ?? 0)}); Bahia: ${divisao.get('BR/BA') ?? 0}; Salvador: ${cidade.get('salvador-ba') ?? 0} (${pct(cidade.get('salvador-ba') ?? 0)})`);
  console.log(`\n## Cidades mais sorteadas (de ${cidade.size} distintas)`); for (const x of top(cidade, 10)) console.log(`- ${x}`);
  console.log(`\n## Combinação gênero · cidade mais repetida`); for (const x of top(combo, 5)) console.log(`- ${x}`);
  console.log('\n## Classes'); for (const x of top(classe, 5)) console.log(`- ${x}`);
  console.log('\n## Arranjo familiar'); for (const x of top(arranjo, 5)) console.log(`- ${x}`);
  console.log('\n## Atributos ao nascer');
  console.log('| atributo | média | desvio | p1 | p10 | p50 | p90 | p99 | mín | máx |\n|---|---|---|---|---|---|---|---|---|---|');
  for (const a of ATRIBUTOS) {
    const xs = [...valores[a]].sort((p, q) => p - q);
    const med = xs.reduce((s, x) => s + x, 0) / N;
    const dp = Math.sqrt(xs.reduce((s, x) => s + (x - med) ** 2, 0) / N);
    const q = (p: number) => xs[Math.min(N - 1, Math.floor(p * N))];
    console.log(`| ${a} | ${med.toFixed(1)} | ${dp.toFixed(1)} | ${q(0.01)} | ${q(0.1)} | ${q(0.5)} | ${q(0.9)} | ${q(0.99)} | ${xs[0]} | ${xs[N - 1]} |`);
  }
  console.log(`- nascimentos frágeis (saúde < 65): ${fragil} (${pct(fragil)})`);
  console.log(`\n## Consistência: ${problemas.length} problemas`); for (const p of problemas.slice(0, 20)) console.log(`- ${p}`);
}
void principal();
