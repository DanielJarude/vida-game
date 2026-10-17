// Fatias de uma página HTML local (para inspecionar sem redução): node fatiar.mjs a.html [altura] → a-1.png, a-2.png…
import { chromium } from 'playwright';
const [f, alt = '1100'] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: Number(process.env.LARGURA ?? 1432), height: 900 } });
await p.goto('file://' + f); await p.waitForTimeout(300);
const h = await p.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0, k = 1; y < h; y += Number(alt), k++) await p.screenshot({ path: f.replace(/\.html$/, `-${k}.png`), fullPage: true, clip: { x: 0, y, width: Number(process.env.LARGURA ?? 1432), height: Math.min(Number(alt), h - y) } });
await b.close();
console.log(h);
