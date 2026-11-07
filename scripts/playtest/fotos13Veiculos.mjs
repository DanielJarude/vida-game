// VIDA 13 — a garagem no app: a cena na escala, os cartões, o veículo de perto (claro e escuro, 1440 e 390 px), e a loja
// de veículos (a vitrine). SAVE=<save.json> URL=http://localhost:4184/ OUT=<pasta> node scripts/playtest/fotos13Veiculos.mjs
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';
const URL = process.env.URL ?? 'http://localhost:4184/';
const OUT = process.env.OUT; mkdirSync(OUT, { recursive: true });
const save = readFileSync(process.env.SAVE, 'utf8');
const b = await chromium.launch();
const problemas = [];
for (const tema of ['claro', 'escuro']) for (const w of [1440, 390]) {
  const ctx = await b.newContext({ viewport: { width: w, height: w < 800 ? 820 : 900 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  const rot = `${tema}-${w}`;
  p.on('pageerror', e => problemas.push(`${rot}: ${e.message}`));
  await p.goto(URL);
  await p.evaluate(([s, t]) => { localStorage.clear(); localStorage.setItem('VIDA_APARENCIA', t); localStorage.setItem('VIDA_NOVIDADES_VISTAS', '12.9.1'); localStorage.setItem('VIDA_GAME_SAVE_V1', s); }, [save, tema]);
  await p.goto(URL);
  await p.waitForTimeout(400);
  if (await p.getByRole('dialog').count()) { await p.keyboard.press('Escape'); await p.waitForTimeout(300); }
  await p.getByRole('button', { name: /Continuar a vida/ }).click();
  await p.waitForTimeout(600);
  let bt = p.locator('.barra__item', { hasText: 'Vida' }).locator('visible=true').first();
  if (!(await bt.count())) bt = p.getByRole('button', { name: 'Vida', exact: true }).locator('visible=true').first();
  await bt.click(); await p.waitForTimeout(400);
  await p.getByRole('tab', { name: /^Patrimônio/ }).first().click(); await p.waitForTimeout(400);
  const g = p.getByRole('tab', { name: /^Garagem/ }).first();
  if (await g.count()) { await g.click(); await p.waitForTimeout(400); }
  await p.locator('.gar129').first().waitFor({ state: 'visible', timeout: 8000 }).catch(() => problemas.push(`${rot}: sem .gar129`));
  await p.locator('.gar129').first().evaluate(x => { x.scrollIntoView({ block: 'start' }); window.scrollBy(0, -90); });
  await p.waitForTimeout(400);
  if (await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)) problemas.push(`${rot}: rolagem horizontal`);
  await p.screenshot({ path: `${OUT}/garagem-${rot}.png` });
  // Os cartões (mais abaixo).
  await p.locator('.gar129__cartao[data-veiculo="vq1"]').first().evaluate(x => { x.scrollIntoView({ block: 'start' }); window.scrollBy(0, -90); });
  await p.waitForTimeout(250);
  await p.screenshot({ path: `${OUT}/cartoes-${rot}.png` });
  // O veículo de perto (o 911 com rodas douradas e rebaixado).
  await p.locator('.gar129__vaga:has(svg[data-modelo="porsche_911"])').first().click(); await p.waitForTimeout(500);
  if (!(await p.getByRole('dialog').count())) problemas.push(`${rot}: o de perto não abriu`);
  await p.screenshot({ path: `${OUT}/deperto-${rot}.png` });
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  if (await p.getByRole('dialog').count()) problemas.push(`${rot}: Esc não fechou o de perto`);
  await ctx.close();
}
await b.close();
console.log(problemas.length ? problemas.join('\n') : 'sem problemas');
