// VIDA 13 · Fama — a parte Fama de Você (claro/escuro, 1440/390). URL=http://localhost:4187/ SAVE=13-jogador OUT=… node scripts/playtest/fotos13Fama.mjs
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const URL = process.env.URL ?? 'http://localhost:4187/';
const SP = process.env.SP ?? `${process.env.HOME}/vida-trabalho/a13/qafama`;
const OUT = process.env.OUT ?? `${process.env.HOME}/vida-trabalho/a13/fotos/fama`;
const SAVE = process.env.SAVE ?? '13-jogador';
const b = await chromium.launch();
for (const [W, H] of [[1440, 900], [390, 844]]) for (const tema of ['claro', 'escuro']) {
  const p = await (await b.newContext({ viewport: { width: W, height: H } })).newPage();
  const erros = []; p.on('pageerror', e => erros.push(e.message));
  await p.goto(URL);
  await p.evaluate(([s, t]) => { localStorage.clear(); localStorage.setItem('VIDA_APARENCIA', t); localStorage.setItem('VIDA_NOVIDADES_VISTAS', '12.9.1'); localStorage.setItem('VIDA_GAME_SAVE_V1', s); }, [readFileSync(`${SP}/saves/vida-${SAVE}.json`, 'utf8'), tema]);
  await p.goto(URL); await p.waitForTimeout(400);
  await p.getByRole('button', { name: /Continuar a vida/ }).click(); await p.waitForTimeout(600);
  let bt = p.locator('.barra__item', { hasText: 'Você' }).locator('visible=true').first();
  if (!(await bt.count())) bt = p.getByRole('button', { name: 'Você', exact: true }).locator('visible=true').first();
  await bt.click(); await p.waitForTimeout(500);
  await p.screenshot({ path: `${OUT}/${SAVE}-voce-${W}-${tema}.png` });
  const aba = p.getByRole('tab', { name: /^Fama/ }).locator('visible=true').first();
  if (await aba.count()) { await aba.click(); await p.waitForTimeout(500); }
  await p.screenshot({ path: `${OUT}/${SAVE}-fama-${W}-${tema}.png`, fullPage: true });
  const largura = await p.evaluate(() => document.documentElement.scrollWidth);
  console.log(W, tema, 'aba Fama:', await aba.count(), 'scrollWidth', largura, 'erros', erros);
  await p.close();
}
await b.close();
