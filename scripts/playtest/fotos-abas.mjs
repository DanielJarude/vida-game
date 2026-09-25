import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const SP = process.env.SP; const OUT = process.env.OUT ?? SP;
const URL = 'http://localhost:4173/';
const CEN = (process.env.CEN ?? 'empreendedor').split(',');
const W = (process.env.W ?? '390,1440').split(',').map(Number);
const ABAS = (process.env.ABAS ?? 'Linha da Vida,Você,Pessoas,Estudo e trabalho,Casa e dinheiro,Tempo livre').split(',');
const CURTO = { 'Linha da Vida': 'Vida', 'Estudo e trabalho': 'Rumo', 'Casa e dinheiro': 'Casa', 'Tempo livre': 'Tempo' };
const b = await chromium.launch();
for (const c of CEN) for (const w of W) {
  const ctx = await b.newContext({ viewport: { width: w, height: w < 800 ? 844 : 900 } });
  const p = await ctx.newPage();
  p.on('pageerror', e => console.log('ERRO', e.message));
  await p.goto(URL);
  await p.evaluate(s => { localStorage.clear(); localStorage.setItem('VIDA_GAME_SAVE_V1', s); }, readFileSync(`${SP}/save-${c}.json`, 'utf8'));
  await p.goto(URL);
  await p.getByRole('button', { name: /Continuar a vida/ }).click();
  await p.waitForTimeout(200);
  for (const a of ABAS) {
    let bt = p.getByRole('button', { name: a, exact: true }).locator('visible=true').first();
    if (!(await bt.count())) bt = p.locator('.barra__item', { hasText: CURTO[a] ?? a }).first();
    if (!(await bt.count())) { console.log('sem aba', a); continue; }
    await bt.click(); await p.waitForTimeout(200);
    await p.screenshot({ path: `${OUT}/${c}-${w}-${a.replace(/ /g,'_')}.png`, fullPage: process.env.FULL === '1' });
  }
  await ctx.close();
}
await b.close();
