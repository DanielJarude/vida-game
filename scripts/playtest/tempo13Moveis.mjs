// VIDA 13 — tempo de pintura de uma galeria de cômodos (carregar + pintar, 3 vezes): node tempo13Moveis.mjs a.html b.html
import { chromium } from 'playwright';
const b = await chromium.launch();
for (const f of process.argv.slice(2)) {
  const t = [];
  for (let k = 0; k < 3; k++) {
    const p = await b.newPage({ viewport: { width: 1620, height: 1000 } });
    const t0 = Date.now(); await p.goto('file://' + f); await p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))); await p.screenshot({ fullPage: true }); t.push(Date.now() - t0);
    await p.close();
  }
  console.log(f.split('/').pop(), t.join(' ms, '), 'ms (29 cenas, página inteira)');
}
await b.close();
