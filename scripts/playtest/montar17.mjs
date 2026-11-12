// Junta várias capturas lado a lado (sem PIL): uma página com <img> base64, screenshot.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const [saida, larg, ...arqs] = process.argv.slice(2);
const imgs = arqs.map(a => `<figure style="margin:0"><img src="data:image/png;base64,${readFileSync(a).toString('base64')}" style="width:${larg}px;display:block"/><figcaption style="font:12px sans-serif">${a.split('/').pop()}</figcaption></figure>`).join('');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: arqs.length * (Number(larg) + 8), height: 800 } });
await p.setContent(`<body style="margin:0;display:flex;gap:8px;background:#fff">${imgs}</body>`);
await p.screenshot({ path: saida, fullPage: true }); await b.close();
