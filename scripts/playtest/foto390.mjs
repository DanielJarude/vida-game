// VIDA 12.9 — foto de uma página em 390 px (celular), com a largura de rolagem no console.
// node scripts/playtest/foto390.mjs <a.html> <a.png> [seletor] [índice] — com seletor, fotografa só aquele elemento.
import { chromium } from 'playwright';
const [html, png, seletor, indice] = process.argv.slice(2);
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 800 } })).newPage();
await p.goto('file://' + html); console.log('scrollWidth', await p.evaluate(() => document.documentElement.scrollWidth));
if (seletor) await (await p.$$(seletor))[Number(indice ?? 0)].screenshot({ path: png });
else await p.screenshot({ path: png, fullPage: true });
await b.close();
