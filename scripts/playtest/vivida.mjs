// Capturas do REWORK 4 (VIDA VIVIDA) em 1440, 820 e 390 px, a partir das vidas do playtest automatizado
// (`scripts/sim/vivida.ts`, com OUT=$SP), com checagem de rolagem horizontal e de erros de página.
//   npm run build && npx vite preview --port 4173 &
//   SP=/tmp/vida-vivida node scripts/playtest/vivida.mjs
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const SP = process.env.SP ?? '/tmp/vida-vivida';
const URL = process.env.URL ?? 'http://localhost:4173/';
const b = await chromium.launch();
const problemas = [];
// [vida, aba, seção da Vida?, depois (abrir a ficha da primeira pessoa / expandir a primeira vaga)?]
const cenas = [
  ['C', 'Pessoas'], ['C', 'Pessoas', null, 'ficha'], ['B', 'Pessoas', null, 'ficha'],
  ['A', 'Formação'], ['D', 'Trabalho', null, 'vaga'],
  ['E', 'Vida', 'Pertences'], ['E', 'Vida', 'Compras'], ['F', 'Tempo livre'], ['A', 'Tempo livre']
];
for (const [cen, aba, secao, depois] of cenas) {
  for (const w of [1440, 820, 390]) {
    const ctx = await b.newContext({ viewport: { width: w, height: w < 800 ? 844 : 900 } });
    const p = await ctx.newPage();
    p.on('pageerror', e => problemas.push(`${cen} ${aba} ${w}: ${e.message}`));
    p.on('console', m => { if (m.type() === 'error') problemas.push(`${cen} ${aba} ${w}: console: ${m.text()}`); });
    await p.goto(URL);
    await p.evaluate(s => { localStorage.clear(); localStorage.setItem('VIDA_GAME_SAVE_V1', s); }, readFileSync(`${SP}/vida-${cen}.json`, 'utf8'));
    await p.goto(URL);
    await p.getByRole('button', { name: /Continuar a vida/ }).click();
    await p.waitForTimeout(300);
    let bt = p.getByRole('button', { name: aba, exact: true }).locator('visible=true').first();
    if (!(await bt.count())) bt = p.locator('.barra__item', { hasText: aba === 'Tempo livre' ? 'Tempo' : aba }).first();
    await bt.click();
    await p.waitForTimeout(300);
    if (secao) { await p.getByRole('tab', { name: secao }).click(); await p.waitForTimeout(200); }
    if (depois === 'ficha') { await p.locator('main .pessoa, main .cartao-pessoa').first().click(); await p.waitForTimeout(250); }
    if (depois === 'vaga') { const v = p.locator('main .vaga-resumo').first(); if (await v.count()) { await v.click(); await p.waitForTimeout(200); } }
    const rolagem = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    if (rolagem) problemas.push(`${cen} ${aba}${secao ? '/' + secao : ''} ${w}: rolagem horizontal`);
    const nome = `${cen}-${aba.replace(/ /g, '_')}${secao ? '-' + secao : ''}${depois ? '-' + depois : ''}-${w}`;
    await p.screenshot({ path: `${SP}/${nome}.png`, fullPage: true });
    await ctx.close();
  }
}
await b.close();
console.log(problemas.length ? problemas.join('\n') : 'sem problemas estruturais');
