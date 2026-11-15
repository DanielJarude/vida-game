// Captura uma página HTML local em PNG. Uso: node fotoHtml.mjs <html> <png> [largura] [x,y,w,h] [escala]
import { chromium } from 'playwright';
const [, , html, png, larg, clip, esc] = process.argv;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: Number(larg ?? 1600), height: 900 }, deviceScaleFactor: Number(esc ?? 1) });
await p.goto('file://' + html);
const [x, y, w, h] = (clip ?? '').split(',').map(Number);
await p.screenshot({ path: png, ...(clip ? { clip: { x, y, width: w, height: h } } : { fullPage: true }) });
await b.close();
