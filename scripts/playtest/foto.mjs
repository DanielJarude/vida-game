// Fotografa um HTML local: HTML=arquivo.html PNG=saida.png [LARGURA=1000] node scripts/playtest/foto.mjs
import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: Number(process.env.LARGURA ?? 1000), height: 800 }, deviceScaleFactor: 1 });
await p.goto('file://' + process.env.HTML);
await p.screenshot({ path: process.env.PNG, fullPage: true });
await b.close();
