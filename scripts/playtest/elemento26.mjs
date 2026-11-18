// Fotografa um elemento (SEL) da criação de personagem em modo "Escolher": W, TEMA, OUT.
import { chromium } from 'playwright';
const b = await chromium.launch(); const W = Number(process.env.W ?? 390);
const p = await (await b.newContext({ viewport: { width: W, height: 844 }, deviceScaleFactor: 2 })).newPage();
await p.goto('http://localhost:4173/'); await p.evaluate(t => { localStorage.clear(); localStorage.setItem('VIDA_NOVIDADES_VISTAS', '26'); localStorage.setItem('VIDA_APARENCIA', t); }, process.env.TEMA ?? 'escuro');
await p.goto('http://localhost:4173/'); await p.getByRole('button', { name: /Nascer de novo/ }).click(); await p.waitForTimeout(800);
await p.getByRole('radio', { name: /^Escolher$/ }).first().click(); await p.waitForTimeout(800);
const el = p.locator(process.env.SEL ?? '.corpo-nascenca').first(); await el.scrollIntoViewIfNeeded();
await el.screenshot({ path: process.env.OUT }); await b.close();
