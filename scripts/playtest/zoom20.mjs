import { chromium } from 'playwright';
const [,, html, out, n] = process.argv;
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1520, height: 900 }, deviceScaleFactor: 3 })).newPage();
await p.goto('file://' + html); const ids = n.split(',').map(Number);
for (const i of ids) await p.locator('.s').nth(i).screenshot({ path: out.replace('.png', `-${i}.png`) });
await b.close();
