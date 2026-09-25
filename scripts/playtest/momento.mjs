// Fotografa uma decisão aberta a partir da aba Trabalho:
//   node scripts/playtest/momento.mjs <save.json> <saida.png> <largura> "<rótulo da ação>"
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const [,, save, out, w, acao] = process.argv;
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: Number(w), height: Number(w) < 800 ? 844 : 900 } });
const p = await ctx.newPage();
await p.goto('http://localhost:4173/');
await p.evaluate(s => { localStorage.clear(); localStorage.setItem('VIDA_GAME_SAVE_V1', s); }, readFileSync(save, 'utf8'));
await p.goto('http://localhost:4173/');
await p.getByRole('button', { name: /Continuar a vida/ }).click();
const aba = p.getByRole('button', { name: 'Trabalho', exact: true }).locator('visible=true').first();
if (await aba.count()) await aba.click(); else await p.locator('.barra__item', { hasText: 'Trabalho' }).click();
await p.getByRole('button', { name: new RegExp(acao) }).first().click();
await p.waitForTimeout(250);
await p.screenshot({ path: out });
await b.close();
