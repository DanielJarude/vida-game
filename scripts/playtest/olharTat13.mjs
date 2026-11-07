// VIDA 13 — o estúdio de tatuagem no jogo de verdade (preview numa porta própria): a obra agrupada por tipo, a busca,
// a contagem e um desenho novo aplicado na pele; claro e escuro, 1440 e 390 px.
//   URL=http://localhost:4182/ OUT=<pasta> node scripts/playtest/olharTat13.mjs
import { chromium } from 'playwright';
import { readFileSync } from 'fs';
const URL = process.env.URL ?? 'http://localhost:4182/';
const OUT = process.env.OUT ?? '.';
const save = readFileSync(process.env.HOME + '/vida-trabalho/qa129/saves/vida-r129-jovem.json', 'utf8');
const b = await chromium.launch();
const erros = [];
for (const tema of ['claro', 'escuro']) for (const w of [1440, 390]) {
  const ctx = await b.newContext({ viewport: { width: w, height: w < 800 ? 800 : 900 } });
  const p = await ctx.newPage();
  p.on('pageerror', e => erros.push(`${tema} ${w}: ${e.message}`));
  p.on('console', m => { if (m.type() === 'error') erros.push(`${tema} ${w}: console: ${m.text()}`); });
  await p.goto(URL);
  await p.evaluate(([s, t]) => { localStorage.clear(); localStorage.setItem('VIDA_APARENCIA', t); localStorage.setItem('VIDA_NOVIDADES_VISTAS', '12.9.1'); localStorage.setItem('VIDA_GAME_SAVE_V1', s); }, [save, tema]);
  await p.goto(URL); await p.waitForTimeout(600);
  // As notas da versão abrem para quem já jogava: fecha.
  const dlg = p.getByRole('dialog'); if (await dlg.count()) { await p.keyboard.press('Escape'); await p.waitForTimeout(300); const f = p.getByRole('button', { name: /Fechar|Entendi|Começar|Continuar$/ }).first(); if (await dlg.count() && await f.count()) await f.click(); await p.waitForTimeout(300); }
  await p.getByRole('button', { name: /Continuar a vida/ }).click(); await p.waitForTimeout(600);
  let bt = p.locator('.barra__item', { hasText: 'Você' }).locator('visible=true').first();
  if (!(await bt.count())) bt = p.getByRole('button', { name: 'Você', exact: true }).locator('visible=true').first();
  await bt.click(); await p.waitForTimeout(500);
  await p.getByRole('tab', { name: /Aparência/ }).first().click(); await p.waitForTimeout(1500);
  const est = p.locator('.estudio-tatuagem');
  await est.waitFor({ timeout: 15000 });
  // 1. Todos os desenhos: a contagem e o seletor de obra agrupado.
  const grupos = await p.locator('.estudio-tatuagem label.campo', { hasText: 'Obra' }).locator('optgroup').evaluateAll(gs => gs.map(g => `${g.label}:${g.children.length}`));
  const nota = await p.locator('.estudio-tatuagem .nota[aria-live]').first().innerText().catch(() => '');
  const total = await p.locator('.estudio-tatuagem__miniatura').count();
  console.log(tema, w, 'miniaturas', total, '|', nota, '|', grupos.join(' '));
  await p.locator('.estudio-tatuagem__escolhas').first().screenshot({ path: `${OUT}/estudio-${tema}-${w}.png` });
  // 2. A obra (Duna) e um desenho novo na pele.
  const obra = p.locator('.estudio-tatuagem label.campo', { hasText: 'Obra' }).locator('select');
  await obra.selectOption('Duna'); await p.waitForTimeout(400);
  await p.locator('[data-desenho="verme_da_areia"]').click(); await p.waitForTimeout(500);
  await est.screenshot({ path: `${OUT}/estudio-duna-${tema}-${w}.png` });
  // 3. A busca por várias palavras.
  await obra.selectOption(''); await p.locator('.estudio-tatuagem input[type=search]').fill('criaturas dragao'); await p.waitForTimeout(400);
  const achados = await p.locator('.estudio-tatuagem__miniatura').evaluateAll(xs => xs.map(x => x.getAttribute('data-desenho')));
  console.log('  busca "criaturas dragao":', achados.join(', '));
  const rolagem = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  if (rolagem) erros.push(`${tema} ${w}: rolagem horizontal`);
  await ctx.close();
}
console.log('erros:', erros.length ? erros.join('\n') : 'nenhum');
await b.close();
