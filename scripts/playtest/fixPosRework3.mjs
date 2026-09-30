// Capturas do FIX pós-REWORK 3, em 1440, 820 e 390 (desktop, tablet, celular), com checagem de rolagem horizontal.
//   npm run build && npx vite preview --port 4173 &
//   SP=/tmp/vida-f3 node scripts/playtest/fixPosRework3.mjs
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const SP = process.env.SP ?? '/tmp/vida-f3';
const URL = process.env.URL ?? 'http://localhost:4173/';
const b = await chromium.launch();
const problemas = [];
// CENAS=cenario:Aba,cenario:Aba (FIX 3.1 reaproveita o script com os próprios cenários).
const cenas = process.env.CENAS ? process.env.CENAS.split(',').map(x => x.split(':')) : [['professora', 'Trabalho'], ['professora', 'Você'], ['rica', 'Tempo livre'], ['rica', 'Vida'], ['adolescente', 'Tempo livre'], ['adolescente', 'Trabalho']];
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
    if (aba === 'Vida') { await p.getByRole('tab', { name: 'Casa' }).click(); await p.waitForTimeout(200); }
    const rolagem = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    if (rolagem) problemas.push(`${cen} ${aba} ${w}: rolagem horizontal`);
    await p.screenshot({ path: `${SP}/${cen}-${aba.replace(/ /g, '_')}-${w}.png`, fullPage: true });
    if (cen === 'rica' && aba === 'Vida') {
      await p.getByRole('tab', { name: 'Compras' }).click(); await p.waitForTimeout(200);
      await p.getByRole('button', { name: /Motos e bicicletas/ }).first().click(); await p.waitForTimeout(200);
      await p.getByRole('radio', { name: /Catálogo completo/ }).click(); await p.waitForTimeout(200);
      if (await p.getByRole('radio', { name: 'Carros' }).count()) problemas.push(`motos ${w}: filtro Carros na loja de motos`);
      const r2 = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      if (r2) problemas.push(`loja motos ${w}: rolagem horizontal`);
      await p.screenshot({ path: `${SP}/rica-loja_motos-${w}.png`, fullPage: false });
    }
    await ctx.close();
  }
}
await b.close();
console.log(problemas.length ? problemas.join('\n') : 'sem problemas estruturais');
