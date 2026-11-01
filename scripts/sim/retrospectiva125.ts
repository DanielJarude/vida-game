/**
 * VIDA 12.5 — a Retrospectiva nas vidas longas salvas pela auditoria (familiar, esportista, carreira comum, poucas
 * conquistas, vida longa): conta as memórias por categoria, lista os marcantes e confere as invariantes (toda memória
 * da biografia aponta para uma entrada com o mesmo texto; ordem cronológica; nenhuma memória repetida).
 *
 *   npx esbuild scripts/sim/retrospectiva125.ts --bundle --platform=node --format=esm --outfile=$HOME/vida-trabalho/a125/retro.mjs && DIR=$HOME/vida-trabalho/a125/mem4 node $HOME/vida-trabalho/a125/retro.mjs
 */
import { readFileSync, readdirSync } from 'fs';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { memoriasDaVida, momentosMarcantes, quandoFoi, CATEGORIAS_DA_MEMORIA } from '../../src/motor/sistemas/albumDaVida';
import type { Vida } from '../../src/motor/tipos';

await carregarMundo();
const dir = process.env.DIR!;
let erros = 0;
for (const f of readdirSync(dir).filter(x => x.endsWith('.json')).sort()) {
  const bruto = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'));
  const v: Vida = bruto.vida ?? bruto;
  const t0 = performance.now();
  const ms = memoriasDaVida(v);
  const dt = performance.now() - t0;
  const porCat = CATEGORIAS_DA_MEMORIA.map(c => `${c.rotulo} ${ms.filter(m => m.categoria === c.id).length}`).join(' · ');
  console.log(`\n## ${f} (${bruto.plano ?? '?'}) — ${Math.floor((v.t - v.eu.tNasc) / 12)} anos, bio ${v.biografia.length}, memórias ${ms.length} (${dt.toFixed(1)} ms)`);
  console.log(porCat);
  for (let k = 1; k < ms.length; k++) if (ms[k].t < ms[k - 1].t) { erros++; console.log('  ERRO ordem', ms[k].titulo); }
  for (const m of ms) if (m.entradaId && v.biografia.find(e => e.id === m.entradaId)?.texto !== m.texto) { erros++; console.log('  ERRO fonte', m.titulo); }
  const chaves = ms.map(m => `${m.tipo}|${m.pessoaId ?? ''}|${m.ano}|${m.texto}`);
  if (new Set(chaves).size !== chaves.length) { erros++; console.log('  ERRO repetida'); }
  for (const m of momentosMarcantes(ms)) console.log(`  ★ ${quandoFoi(m)} · ${m.titulo} — ${m.texto.slice(0, 110)}`);
  const outros = ms.filter(m => m.destaque < 2);
  for (const m of outros.filter((_, k) => k % Math.max(1, Math.floor(outros.length / 8)) === 0).slice(0, 8)) console.log(`  · ${quandoFoi(m)} · [${m.categoria}] ${m.titulo} — ${m.texto.slice(0, 100)}`);
}
console.log(`\nERROS: ${erros}`);
