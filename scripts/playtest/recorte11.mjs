// recorta uma captura (sem PIL): node recorte11.mjs entrada.png saida.png y altura [x largura]
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const [ent, sai, y, h, x = '0', w] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
await p.setContent(`<body style="margin:0"><img id=i src="data:image/png;base64,${readFileSync(ent).toString('base64')}">`);
const W = await p.evaluate(() => document.getElementById('i').naturalWidth); const H = await p.evaluate(() => document.getElementById('i').naturalHeight);
await p.setViewportSize({ width: W, height: H });
await p.screenshot({ path: sai, clip: { x: +x, y: +y, width: w ? +w : W - +x, height: Math.min(+h, H - +y) } });
await b.close();
