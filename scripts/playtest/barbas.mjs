// HOTFIX das barbas — auditoria GEOMÉTRICA dos retratos de `galeriaBarbas.tsx` (complementa a inspeção visual). Em cada
// retrato com barba, num Chromium:
//   · NÃO COBRE A BOCA: o meio da boca não está debaixo de nada da barba nem do bigode; os cantos, não debaixo da
//     massa da barba (o bigode pode encostar no canto);
//   · NÃO COBRE O ROSTO: os olhos e a ponta do nariz ficam livres;
//   · CABE NO QUADRO: a barba fica dentro do `viewBox` (10 8 80 80).
//   npx esbuild scripts/playtest/galeriaBarbas.tsx --bundle --platform=node --outfile=<scratch>/gb.cjs --jsx=automatic --loader:.tsx=tsx
//   OUT=<pasta> node <scratch>/gb.cjs && node scripts/playtest/barbas.mjs <pasta>
import { chromium } from 'playwright';
import { readdirSync, writeFileSync } from 'node:fs';
const DIR = process.argv[2] ?? '/tmp';
const b = await chromium.launch();
const problemas = [];
let retratos = 0;
for (const f of readdirSync(DIR).filter(x => /^barbas-.*\.html$/.test(x))) {
  const p = await b.newPage();
  await p.goto(`file://${DIR}/${f}`);
  const r = await p.evaluate(() => {
    const out = { n: 0, falhas: [] };
    for (const svg of document.querySelectorAll('svg.retrato')) {
      const g = svg.querySelector('.retrato__barba');
      if (!g) continue;
      out.n++;
      const nome = svg.getAttribute('aria-label');
      const formas = [...g.querySelectorAll('path')].filter(e => e.getAttribute('fill') !== 'none' && !e.closest('[stroke][fill="none"]'));
      const massa = formas.filter(e => !e.classList.contains('retrato__bigode'));
      const dentro = (lista, x, y) => lista.some(e => e.isPointInFill(new DOMPoint(x, y)));
      const [x1, y1, xm, ym, x2, y2] = g.getAttribute('data-boca').split(',').map(Number);
      if (dentro(formas, xm, ym)) out.falhas.push(`${nome}: a barba cobre o meio da boca`);
      if (dentro(massa, x1, y1) || dentro(massa, x2, y2)) out.falhas.push(`${nome}: a barba cobre o canto da boca`);
      for (const o of svg.querySelectorAll('.retrato__olho')) if (dentro(formas, Number(o.getAttribute('cx')), Number(o.getAttribute('cy')))) { out.falhas.push(`${nome}: a barba cobre o olho`); break; }
      const olho = svg.querySelector('.retrato__olho');
      if (olho && dentro(formas, xm, Number(olho.getAttribute('cy')) + 6.5)) out.falhas.push(`${nome}: a barba cobre o nariz`);
      const q = g.getBBox();
      if (q.x < 10 - 0.05 || q.x + q.width > 90.05 || q.y + q.height > 88.05) out.falhas.push(`${nome}: a barba sai do quadro`);
    }
    return out;
  });
  retratos += r.n;
  problemas.push(...r.falhas.map(x => `${f}: ${x}`));
  await p.close();
}
await b.close();
const unicos = [...new Set(problemas)];
writeFileSync(`${DIR}/auditoria-barbas.json`, JSON.stringify({ retratos, problemas: unicos }, null, 2));
console.log(`${retratos} retratos com barba, ${unicos.length} problema(s)`);
for (const x of unicos.slice(0, 40)) console.log('  ✗', x);
process.exitCode = unicos.length ? 1 : 0;
