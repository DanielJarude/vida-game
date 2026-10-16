// HOTFIX dos cabelos — auditoria GEOMÉTRICA dos retratos (complementa a inspeção visual, não a substitui). Abre as
// galerias de `galeriaCabelos.tsx` num Chromium e mede, em cada retrato:
//   · NÃO FLUTUA: a raiz de cada cordão (tranças, locs — `data-raiz`) está dentro de uma área já pintada de cabelo
//     (`isPointInFill` nos caminhos preenchidos das camadas `.retrato__cabelo`) — nenhum cordão nasce no ar;
//   · NÃO É CORTADO: o cabelo cabe no quadro (o `viewBox` é 10 8 80 80: alto ≥ 8, lados entre 10 e 90; o de baixo pode
//     descer atrás do corpo);
//   · NÃO COBRE O ROSTO: o centro de cada olho não está debaixo do cabelo da frente.
//   npx esbuild scripts/playtest/galeriaCabelos.tsx --bundle --platform=node --outfile=<scratch>/gc.cjs --jsx=automatic --loader:.tsx=tsx
//   OUT=<pasta> node <scratch>/gc.cjs && node scripts/playtest/cabelos.mjs <pasta>
import { chromium } from 'playwright';
import { readdirSync, writeFileSync } from 'node:fs';
const DIR = process.argv[2] ?? '/tmp';
const b = await chromium.launch();
const problemas = [];
let retratos = 0, raizes = 0;
for (const f of readdirSync(DIR).filter(x => /^cabelos-.*\.html$/.test(x))) {
  const p = await b.newPage();
  await p.goto(`file://${DIR}/${f}`);
  const r = await p.evaluate(() => {
    const out = { n: 0, raizes: 0, falhas: [] };
    for (const svg of document.querySelectorAll('svg.retrato')) {
      out.n++;
      const nome = svg.getAttribute('aria-label');
      const camadas = [...svg.querySelectorAll('.retrato__cabelo')];
      if (!camadas.length) continue;
      const preenchidos = camadas.flatMap(g => [...g.querySelectorAll('path, ellipse, circle, rect')]).filter(e => !e.closest('[data-raiz]') && e.getAttribute('fill') && e.getAttribute('fill') !== 'none' && Number(e.getAttribute('opacity') ?? 1) > 0.3);
      // Não flutua.
      for (const g of svg.querySelectorAll('[data-raiz]')) {
        out.raizes++;
        const [x, y] = g.getAttribute('data-raiz').split(',').map(Number);
        const pt = new DOMPoint(x, y);
        if (!preenchidos.some(e => e.isPointInFill(pt))) out.falhas.push(`${nome}: cordão nasce fora do cabelo em (${x}, ${y})`);
      }
      // Não é cortado (a caixa do cabelo, sem o que desce atrás do corpo).
      let t = Infinity, l = Infinity, d = -Infinity;
      for (const g of camadas) { const q = g.getBBox(); if (!q.width) continue; t = Math.min(t, q.y); l = Math.min(l, q.x); d = Math.max(d, q.x + q.width); }
      if (t < 8 - 0.05) out.falhas.push(`${nome}: o cabelo passa do alto do quadro (y = ${t.toFixed(1)})`);
      if (l < 10 - 0.05 || d > 90 + 0.05) out.falhas.push(`${nome}: o cabelo passa da lateral do quadro (${l.toFixed(1)} … ${d.toFixed(1)})`);
      // Não cobre os olhos.
      const frente = preenchidos.filter(e => e.closest('.retrato__cabelo--frente'));
      for (const o of svg.querySelectorAll('.retrato__olho')) {
        const pt = new DOMPoint(Number(o.getAttribute('cx')), Number(o.getAttribute('cy')));
        if (frente.some(e => e.isPointInFill(pt))) { out.falhas.push(`${nome}: o cabelo da frente cobre o olho`); break; }
      }
    }
    return out;
  });
  retratos += r.n; raizes += r.raizes;
  problemas.push(...r.falhas.map(x => `${f}: ${x}`));
  await p.close();
}
await b.close();
const unicos = [...new Set(problemas)];
writeFileSync(`${DIR}/auditoria-cabelos.json`, JSON.stringify({ retratos, raizes, problemas: unicos }, null, 2));
console.log(`${retratos} retratos, ${raizes} raízes de cordão conferidas, ${unicos.length} problema(s)`);
for (const x of unicos.slice(0, 40)) console.log('  ✗', x);
process.exitCode = unicos.length ? 1 : 0;
