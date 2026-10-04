// Capturas do FIX pós-REWORK 4 em 1440, 820 e 390 px, a partir das vidas do playtest adversarial
// (`scripts/sim/agir.ts`, com OUT=$SP): Tempo livre (as abas, o estresse, as redes, as viagens), Pertences, as lojas
// (carros com cor, instrumentos, imóveis), a casa, a ficha da parceria, Formação e Trabalho. Confere rolagem horizontal,
// erros de página/console e alvos de toque pequenos demais.
//   npm run build && npx vite preview --port 4173 &
//   SP=/tmp/vida-agir node scripts/playtest/agir.mjs
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
const SP = process.env.SP ?? '/tmp/vida-agir';
const URL = process.env.URL ?? 'http://localhost:4173/';
const b = await chromium.launch();
const problemas = [];
const notas = [];
// [vida, área, aba/seção?, depois?]
const cenas = [
  ['familia', 'Tempo livre', 'A semana'], ['familia', 'Tempo livre', 'Corpo e mente'], ['familia', 'Tempo livre', 'Sair e ver gente'],
  ['redes', 'Tempo livre', 'Redes sociais'], ['redes', 'Tempo livre', 'Redes sociais', 'youtube'], ['familia', 'Tempo livre', 'Viagens', 'viagem'],
  ['familia', 'Vida', 'Pertences'], ['familia', 'Vida', 'Compras', 'concessionaria'], ['familia', 'Vida', 'Compras', 'instrumentos'],
  ['familia', 'Vida', 'Compras', 'imobiliaria'], ['familia', 'Vida', 'Casa'], ['familia', 'Pessoas', null, 'ficha'],
  ['estudante', 'Formação'], ['atleta', 'Trabalho'], ['familia', 'Trabalho']
];
for (const [cen, area, aba, depois] of cenas) {
  for (const w of [1440, 820, 390]) {
    const ctx = await b.newContext({ viewport: { width: w, height: w < 800 ? 844 : 900 } });
    const p = await ctx.newPage();
    const rot = `${cen} ${area}${aba ? '/' + aba : ''}${depois ? '/' + depois : ''} ${w}`;
    p.on('pageerror', e => problemas.push(`${rot}: ${e.message}`));
    p.on('console', m => { if (m.type() === 'error') problemas.push(`${rot}: console: ${m.text()}`); });
    await p.goto(URL);
    await p.evaluate(s => { localStorage.clear(); localStorage.setItem('VIDA_GAME_SAVE_V1', s); }, readFileSync(`${SP}/vida-agir-${cen}.json`, 'utf8'));
    await p.goto(URL);
    await p.getByRole('button', { name: /Continuar a vida/ }).click();
    await p.waitForTimeout(400);
    let bt = p.getByRole('button', { name: area, exact: true }).locator('visible=true').first();
    if (!(await bt.count())) bt = p.locator('.barra__item', { hasText: area === 'Tempo livre' ? 'Tempo' : area }).first();
    await bt.click();
    await p.waitForTimeout(300);
    if (aba) { await p.getByRole('tab', { name: aba, exact: true }).first().click(); await p.waitForTimeout(250); }
    if (depois === 'youtube') { await p.getByRole('tab', { name: /YouTube/ }).click(); await p.waitForTimeout(200); }
    if (depois === 'viagem') { const v = p.getByRole('button', { name: 'Ver destinos' }).first(); if (await v.count()) { await v.click(); await p.waitForTimeout(200); await p.locator('.viagem__opcao').first().click(); await p.locator('.viagem__opcao').first().click(); await p.locator('.viagem__opcao').nth(1).click(); await p.waitForTimeout(200); } }
    if (depois === 'concessionaria' || depois === 'instrumentos' || depois === 'imobiliaria') {
      const nome = { concessionaria: 'Concessionária', instrumentos: 'instrumentos musicais', imobiliaria: 'Imobiliária' }[depois];
      await p.getByRole('button', { name: new RegExp(nome) }).first().click(); await p.waitForTimeout(350);
      if (depois === 'concessionaria') { const cat = p.getByRole('radio', { name: /Catálogo completo/ }); if (await cat.count()) { await cat.click(); await p.waitForTimeout(250); } }
    }
    if (depois === 'ficha') { await p.locator('main .cartao-pessoa').first().click(); await p.waitForTimeout(300); }
    const rolagem = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    if (rolagem) problemas.push(`${rot}: rolagem horizontal`);
    // Alvos de toque: no celular, botões visíveis com menos de 32 px de altura.
    if (w === 390) {
      const pequenos = await p.evaluate(() => [...document.querySelectorAll('main button, [role=dialog] button')].filter(x => { const r = x.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.height < 32 && !x.classList.contains('link'); }).map(x => (x.textContent ?? '').trim().slice(0, 30)));
      if (pequenos.length) notas.push(`${rot}: ${pequenos.length} botões com menos de 32 px (${pequenos.slice(0, 3).join(' | ')})`);
    }
    const nome = `${cen}-${area.replace(/ /g, '_')}${aba ? '-' + aba.replace(/ /g, '_') : ''}${depois ? '-' + depois : ''}-${w}`;
    await p.screenshot({ path: `${SP}/${nome}.png`, fullPage: true });
    await ctx.close();
  }
}
await b.close();
const saida = [problemas.length ? problemas.join('\n') : 'sem problemas estruturais (rolagem horizontal, erros de página/console)', ...notas].join('\n');
writeFileSync(`${SP}/capturas.txt`, saida);
console.log(saida);
