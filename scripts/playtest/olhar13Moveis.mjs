// VIDA 13 — móveis com volume no jogo (a casa por dentro). Igual a olhar1281.mjs, sem o aviso de novidades. SAVE= AREA=Vida PASSOS='botao:Casa|clique:.pz-comodo|foto:.pz-casa@x'
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const URL = process.env.URL ?? 'http://localhost:4173/';
const SP = process.env.SP ?? `${process.env.HOME}/vida-trabalho/qa128`;
const OUT = process.env.OUT ?? `${process.env.HOME}/vida-trabalho/a1281`;
const W = Number(process.env.W ?? 1440), H = Number(process.env.H ?? 900);
const TEMA = process.env.TEMA ?? 'claro';
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: Number(process.env.DPR ?? 1) })).newPage();
const erros = []; p.on('pageerror', e => erros.push(e.message));
await p.goto(URL);
await p.evaluate(([s, t]) => { localStorage.clear(); localStorage.setItem('VIDA_APARENCIA', t); localStorage.setItem('VIDA_NOVIDADES_VISTAS', '12.9.1'); localStorage.setItem('VIDA_GAME_SAVE_V1', s); }, [readFileSync(`${SP}/saves/vida-${process.env.SAVE ?? 'r128-mansao'}.json`, 'utf8'), TEMA]);
await p.goto(URL); await p.waitForTimeout(300);
await p.getByRole('button', { name: /Continuar a vida/ }).click(); await p.waitForTimeout(500);
const area = process.env.AREA ?? 'Compras';
let bt = p.locator('.barra__item', { hasText: area }).locator('visible=true').first();
if (!(await bt.count())) bt = p.getByRole('button', { name: area, exact: true }).locator('visible=true').first();
await bt.click(); await p.waitForTimeout(400);
for (const passo of (process.env.PASSOS ?? '').split('|').filter(Boolean)) {
  const [k, v] = [passo.slice(0, passo.indexOf(':')), passo.slice(passo.indexOf(':') + 1)];
  if (k === 'botao') await p.getByRole('button', { name: v, exact: true }).locator('visible=true').first().click();
  else if (k === 'radio') await p.getByRole('radio', { name: v, exact: true }).locator('visible=true').first().click();
  else if (k === 'tab') await p.getByRole('tab', { name: new RegExp(v) }).locator('visible=true').first().click();
  else if (k === 'loja') await p.locator('.vitrine', { hasText: v }).locator('.vitrine__abrir, button').first().click();
  else if (k === 'clique') await p.locator(v).locator('visible=true').first().click();
  else if (k === 'rolar') await p.locator(v).first().scrollIntoViewIfNeeded();
  else if (k === 'digitar') await p.locator('.loja-vida__busca input').fill(v);
  else if (k === 'foto') { const [sel, nome] = v.split('@'); await p.locator(sel).locator('visible=true').first().screenshot({ path: `${OUT}/${nome}.png` }); }
  else if (k === 'texto') console.log(await p.locator(v).allInnerTexts());
  await p.waitForTimeout(400);
}
await p.screenshot({ path: `${OUT}/${process.env.NOME ?? 'x'}.png`, fullPage: process.env.INTEIRA === '1' });
console.log('erros', erros);
await b.close();
