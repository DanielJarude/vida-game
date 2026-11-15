// VIDA 23 — fotografa cada seção de uma galeria HTML (h2 + o bloco seguinte). HTML=<arquivo> OUT=<pasta> [ESC=2]
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
const out = process.env.OUT; mkdirSync(out, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1520, height: 900 }, deviceScaleFactor: Number(process.env.ESC ?? 1.5) });
await p.goto('file://' + process.env.HTML);
const n = await p.locator('h2').count();
for (let k = 0; k < n; k++) {
  const h = p.locator('h2').nth(k);
  const bloco = h.locator('xpath=following-sibling::div[1]');
  const caixa = await h.boundingBox(), cb = await bloco.boundingBox();
  await p.screenshot({ path: `${out}/s${String(k).padStart(2, '0')}.png`, clip: { x: 0, y: caixa.y, width: 1520, height: Math.min(4000, cb.y + cb.height - caixa.y) }, fullPage: true });
}
await b.close();
console.log('ok', n);
