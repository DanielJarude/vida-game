import { chromium } from 'playwright';
const [html, png] = process.argv.slice(2);
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1620, height: 900 }, deviceScaleFactor: Number(process.env.DPR ?? 1) })).newPage();
await p.goto('file://' + html); await p.screenshot({ path: png, fullPage: true }); await b.close();
