// Fotografa páginas HTML locais (as galerias de retratos) com o Chromium do Playwright, em fatias de 1000 px de altura
// (para inspeção sem redução): node fotografarHtml.mjs a.html b.html …  → a-1.png, a-2.png, …
import { chromium } from 'playwright';
const b = await chromium.launch();
for (const f of process.argv.slice(2)) {
  const p = await b.newPage({ viewport: { width: 900, height: 1000 } });
  await p.goto('file://' + f);
  const alt = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0, k = 1; y < alt; y += 1000, k++) await p.screenshot({ path: f.replace(/\.html$/, `-${k}.png`), fullPage: true, clip: { x: 0, y, width: 900, height: Math.min(1000, alt - y) } });
  await p.close();
}
await b.close();
