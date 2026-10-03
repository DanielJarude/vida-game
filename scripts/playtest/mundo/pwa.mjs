// PWA: manifesto, service worker, requisições externas (fontes locais?).
import { chromium } from 'playwright';
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage();
const ext = []; const all = [];
p.on('request', r => { all.push(r.url()); if (!r.url().startsWith('http://localhost')) ext.push(r.url()); });
p.on('requestfailed', r => console.log('FALHOU', r.url(), r.failure()?.errorText));
p.on('response', r => { if (r.status() >= 400) console.log('HTTP', r.status(), r.url()); });
await p.goto(process.env.URL ?? 'http://localhost:4180/'); await p.waitForTimeout(3000);
await p.getByRole('button', { name: /Nascer de novo/ }).click(); await p.waitForTimeout(1500);
console.log('manifest', await p.evaluate(() => document.querySelector('link[rel=manifest]')?.getAttribute('href')));
const man = await (await p.request.get('http://localhost:4180/manifest.webmanifest')).json().catch(e => 'ERRO ' + e);
console.log('manifest json', JSON.stringify(man));
console.log('sw', await p.evaluate(async () => { const r = await navigator.serviceWorker?.getRegistration(); return r ? (r.active?.state ?? r.installing?.state ?? 'reg') : 'nenhum'; }));
console.log('externas', ext);
console.log('fontes', all.filter(u => /woff|ttf|font/i.test(u)));
console.log('fontes carregadas', await p.evaluate(() => [...document.fonts].map(f => f.family + ':' + f.status).join(', ')));
await b.close();
