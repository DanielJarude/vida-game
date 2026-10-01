// Capturas do pacote pós-playtest, em 1440, 820 e 390, com checagem de rolagem horizontal e de erro de página.
//   npm run build && npx vite preview --port 4173 &
//   SP=/tmp/vida-pp node scripts/playtest/pacotePlaytest.mjs
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const SP = process.env.SP ?? '/tmp/vida-pp';
const URL = process.env.URL ?? 'http://localhost:4173/';
const b = await chromium.launch();
const problemas = [];
const cenas = [['campeao', 'Trabalho'], ['politico', 'Você'], ['politico', 'Trabalho'], ['viajante', 'Tempo livre'], ['estudante', 'Formação'], ['app', 'Pessoas']];
for (const [cen, aba] of cenas) {
  for (const w of [1440, 820, 390]) {
    const ctx = await b.newContext({ viewport: { width: w, height: w < 800 ? 844 : 900 } });
    const p = await ctx.newPage();
    p.on('pageerror', e => problemas.push(`${cen} ${w}: ${e.message}`));
    await p.goto(URL);
    await p.evaluate(s => { localStorage.clear(); localStorage.setItem('VIDA_GAME_SAVE_V1', s); }, readFileSync(`${SP}/${cen}.json`, 'utf8'));
    await p.goto(URL);
    await p.getByRole('button', { name: /Continuar a vida/ }).click();
    await p.waitForTimeout(300);
    let bt = p.getByRole('button', { name: aba, exact: true }).locator('visible=true').first();
    if (!(await bt.count())) bt = p.locator('.barra__item', { hasText: aba === 'Tempo livre' ? 'Tempo' : aba }).first();
    await bt.click();
    await p.waitForTimeout(300);
    if (cen === 'viajante') { const d = p.getByRole('button', { name: 'Ver destinos' }).first(); if (await d.count()) { await d.click(); await p.waitForTimeout(200); } }
    if (cen === 'app') { const a = p.getByRole('button', { name: /Aurora/ }).first(); if (await a.count()) { await a.click(); await p.waitForTimeout(300); } }
    if (cen === 'campeao') { const m = p.getByRole('button', { name: /^Momentos da carreira/ }).first(); if (await m.count()) { await m.click(); await p.waitForTimeout(200); } }
    const rolagem = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    if (rolagem) problemas.push(`${cen} ${aba} ${w}: rolagem horizontal`);
    await p.screenshot({ path: `${SP}/${cen}-${aba.replace(/ /g, '_')}-${w}.png`, fullPage: true });
    await ctx.close();
  }
}
await b.close();
console.log(problemas.length ? problemas.join('\n') : 'sem problemas estruturais');
