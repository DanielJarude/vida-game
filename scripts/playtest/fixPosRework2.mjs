// Capturas do FIX pós-REWORK 2 (atleta: Trabalho e Você; semana carregada: Tempo livre), em 390 e 1440.
//   npm run build && npx vite preview --port 4173 &
//   SP=/tmp/vida-fix node scripts/playtest/fixPosRework2.mjs
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const SP = process.env.SP ?? '/tmp/vida-fix';
const URL = process.env.URL ?? 'http://localhost:4173/';
const b = await chromium.launch();
const problemas = [];
for (const [cen, aba] of [['atleta', 'Trabalho'], ['atleta', 'Você'], ['carregada', 'Tempo livre']]) {
  for (const w of [390, 1440]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
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
    const rolagem = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    if (rolagem) problemas.push(`${cen} ${aba} ${w}: rolagem horizontal`);
    await p.screenshot({ path: `${SP}/${cen}-${aba.replace(/ /g, '_')}-${w}.png`, fullPage: true });
    await ctx.close();
  }
}
await b.close();
console.log(problemas.length ? problemas.join('\n') : 'sem problemas estruturais');
