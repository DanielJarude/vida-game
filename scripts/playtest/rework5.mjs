// Capturas do REWORK 5 em 1440, 820, 390 e 360 px: a pena (Trabalho), o atleta (temporadas, totais), o "Enquanto isso"
// (Linha da Vida depois de viver um ano), os estados com a trajetória (Você), o dinheiro grande (Vida · Dinheiro) e as
// redes. Confere rolagem horizontal, elementos estourando a borda, erros de console.
//   npm run build && npx vite preview --port 4173 &
//   SP=<pasta com os saves de gerarRework5.ts> node scripts/playtest/rework5.mjs
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
const SP = process.env.SP ?? '/tmp/vida-r5';
const URL = process.env.URL ?? 'http://localhost:4173/';
const b = await chromium.launch();
const problemas = [];
const notas = [];
const cenas = [['presa', 'Trabalho'], ['atleta', 'Trabalho'], ['vivida', 'Linha da Vida', 'viver'], ['vivida', 'Você'], ['rica', 'Vida', 'Dinheiro'], ['rica', 'Tempo livre', 'Redes sociais'], ['presa', 'Pessoas']];
for (const [cen, area, aba] of cenas) {
  for (const w of [1440, 820, 390, 360]) {
    const ctx = await b.newContext({ viewport: { width: w, height: w < 800 ? 844 : 900 } });
    const p = await ctx.newPage();
    const rot = `${cen} ${area}${aba ? '/' + aba : ''} ${w}`;
    p.on('pageerror', e => problemas.push(`${rot}: ${e.message}`));
    p.on('console', m => { if (m.type() === 'error') problemas.push(`${rot}: console: ${m.text()}`); });
    await p.goto(URL);
    await p.evaluate(s => { localStorage.clear(); localStorage.setItem('VIDA_GAME_SAVE_V1', s); }, readFileSync(`${SP}/vida-r5-${cen}.json`, 'utf8'));
    await p.goto(URL);
    await p.getByRole('button', { name: /Continuar a vida/ }).click();
    await p.waitForTimeout(400);
    if (aba === 'viver') {
      await p.locator('.avancar__botao').click(); await p.waitForTimeout(500);
      for (let k = 0; k < 6; k++) { const o = p.locator('.momento .opcao:not([disabled])'); if (await o.count()) { await o.first().click(); await p.waitForTimeout(250); const c = p.getByRole('button', { name: /^(Continuar|Fechar)$/ }); if (await c.count()) { await c.first().click(); await p.waitForTimeout(150); } } else break; }
      const n = await p.locator('.enquanto__item').count();
      notas.push(`${rot}: "Enquanto isso" com ${n} notícias`);
    } else {
      let bt = p.getByRole('button', { name: area, exact: true }).locator('visible=true').first();
      if (!(await bt.count())) bt = p.locator('.barra__item', { hasText: area === 'Tempo livre' ? 'Tempo' : area === 'Linha da Vida' ? 'História' : area }).first();
      await bt.click();
      await p.waitForTimeout(300);
      if (aba) { const t = p.getByRole('tab', { name: aba, exact: true }).first(); if (await t.count()) { await t.click(); await p.waitForTimeout(250); } else notas.push(`${rot}: sem aba ${aba}`); }
    }
    if (await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)) problemas.push(`${rot}: rolagem horizontal`);
    const estouram = await p.evaluate(() => [...document.querySelectorAll('main *')].filter(x => { const r = x.getBoundingClientRect(); return r.width > 0 && r.right > document.documentElement.clientWidth + 1 && getComputedStyle(x).position !== 'fixed'; }).slice(0, 4).map(x => `${x.tagName.toLowerCase()}.${[...x.classList].join('.')}`));
    if (estouram.length) problemas.push(`${rot}: estouram a borda: ${estouram.join(', ')}`);
    if (cen === 'presa' && area === 'Trabalho') notas.push(`${rot}: painel da pena ${await p.locator('.pena').count() ? 'presente' : 'AUSENTE'}`);
    if (cen === 'rica' && aba === 'Dinheiro') notas.push(`${rot}: valores: ${(await p.locator('main strong').allTextContents()).filter(t => /R\$/.test(t)).slice(0, 6).join(' | ')}`);
    await p.screenshot({ path: `${SP}/r5-${cen}-${area.replace(/ /g, '_')}${aba ? '-' + aba.replace(/ /g, '_') : ''}-${w}.png`, fullPage: true });
    await ctx.close();
  }
}
await b.close();
writeFileSync(`${SP}/rework5-relatorio.json`, JSON.stringify({ problemas, notas }, null, 2));
console.log(JSON.stringify({ problemas, notas }, null, 2));
