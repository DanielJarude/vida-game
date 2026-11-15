// Screenshot an HTML file: node foto.mjs <html> <png> [width] [selector-crop]
import { chromium } from 'playwright';
const [html, png, w = '1200'] = process.argv.slice(2);
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: Number(w), height: 900 }, deviceScaleFactor: Number(process.env.DPR ?? 1) })).newPage();
await p.goto('file://' + html); await p.waitForTimeout(300);
if (process.env.SEL) { const els = p.locator(process.env.SEL); const n = await els.count(); for (let i = 0; i < n; i++) await els.nth(i).screenshot({ path: png.replace('.png', `-${i}.png`) }); }
else await p.screenshot({ path: png, fullPage: true });
await b.close();
