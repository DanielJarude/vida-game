// VIDA 13 — fotografa cada cena da galeria de móveis (um PNG por cena): node fotos13Moveis.mjs <html> <pasta> <prefixo>
import { chromium } from 'playwright';
const [html, pasta, pre] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1620, height: 1000 } });
await p.goto('file://' + html);
for (const el of await p.$$('.s')) { const id = await el.getAttribute('id'); await el.screenshot({ path: `${pasta}/${pre}-${id}.png` }); }
await b.close();
