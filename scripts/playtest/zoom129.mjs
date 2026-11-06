import { chromium } from 'playwright';
const [html, png, ...idx] = process.argv.slice(2);
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1620, height: 900 }, deviceScaleFactor: 1 })).newPage();
await p.goto('file://' + html);
await p.evaluate((idx) => { const s=[...document.querySelectorAll('.s')]; s.forEach((e,i)=>{ if(!idx.includes(String(i))) e.remove(); }); }, idx);
await p.screenshot({ path: png, fullPage: true }); await b.close();
