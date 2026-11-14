import { chromium } from 'playwright';
const [,, html, pref, sel] = process.argv;
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1620, height: 900 } })).newPage();
await p.goto('file://' + html);
const n = await p.locator('.s').count();
for (let i = 0; i < n; i++) { if (sel && !sel.split(',').includes(String(i))) continue; await p.locator('.s').nth(i).screenshot({ path: `${pref}${String(i).padStart(2, '0')}.png` }); }
await b.close(); console.log(n);
