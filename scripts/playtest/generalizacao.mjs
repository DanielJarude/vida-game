// Capturas da generalização de carreiras e legado, em 1440, 820 e 390, com checagem de rolagem horizontal e de erro de página.
//   npm run build && npx vite preview --port 4173 &
//   SP=/tmp/vida-gen node scripts/playtest/generalizacao.mjs
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const SP = process.env.SP ?? '/tmp/vida-gen';
const URL = process.env.URL ?? 'http://localhost:4173/';
const b = await chromium.launch();
const problemas = [];
const cenas = [['veterana', 'Você'], ['pivo', 'Trabalho'], ['atriz', 'Você'], ['pesquisador', 'Você']];
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
    if (!(await bt.count())) bt = p.locator('.barra__item', { hasText: aba }).first();
    await bt.click();
    await p.waitForTimeout(300);
    // Abre o histórico da primeira trajetória (a revelação progressiva) e rola até a seção.
    if (aba === 'Você') {
      const sec = p.getByRole('region', { name: 'O que você construiu' });
      if (await sec.count()) {
        const abrir = sec.getByRole('button', { name: 'Ver o histórico' });
        if (await abrir.count()) { await abrir.first().click(); await p.waitForTimeout(200); }
        const sel = cen === 'veterana' ? 1 : 0;
        if (cen === 'veterana' && (await abrir.count()) > 1) { await abrir.nth(sel).click(); await p.waitForTimeout(200); }
        await sec.scrollIntoViewIfNeeded();
      } else problemas.push(`${cen} ${w}: sem "O que você construiu"`);
    }
    if (aba === 'Trabalho') { const s = p.getByRole('button', { name: /^A carreira no esporte/ }).first(); if (await s.count() && (await s.getAttribute('aria-expanded')) !== 'true') { await s.click(); await p.waitForTimeout(200); } }
    const rolagem = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    if (rolagem) problemas.push(`${cen} ${aba} ${w}: rolagem horizontal`);
    await p.screenshot({ path: `${SP}/${cen}-${aba.replace(/ /g, '_')}-${w}.png`, fullPage: true });
    await ctx.close();
  }
}
await b.close();
console.log(problemas.length ? problemas.join('\n') : 'sem problemas estruturais');
