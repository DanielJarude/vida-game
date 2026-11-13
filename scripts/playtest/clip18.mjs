import { chromium } from 'playwright';
const [html, png, x, y, w, h, z] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: Number(z ?? 2) });
await p.goto('file://' + html); await p.screenshot({ path: png, clip: { x: +x, y: +y, width: +w, height: +h }, fullPage: true }); await b.close();
