// Capturas de auditoria: CENAS=json [[nome, save|'nova', passos[]]]
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';
const URL = process.env.URL ?? 'http://localhost:4173/';
const SP = process.env.SP ?? `${process.env.HOME}/vida-trabalho/v25/saves`;
const OUT = process.env.OUT; mkdirSync(OUT, { recursive: true });
const W = Number(process.env.W ?? 1440);
const CENAS = JSON.parse(readFileSync(process.env.CENAS, 'utf8'));
const b = await chromium.launch();
for (const [nome, save, passos] of CENAS) {
  const ctx = await b.newContext({ viewport: { width: W, height: W > 800 ? 950 : 844 } });
  const p = await ctx.newPage(); const erros = [];
  p.on('pageerror', e => erros.push(e.message));
  await p.goto(URL);
  await p.evaluate(([s, n]) => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem('VIDA_NOVIDADES_VISTAS', n); if (s) localStorage.setItem('VIDA_GAME_SAVE_V1', s); }, [save === 'nova' ? '' : readFileSync(`${SP}/vida-${save}.json`, 'utf8'), process.env.NOVID ?? '25']);
  await p.goto(URL); await p.waitForTimeout(1500);
  if (save !== 'nova') { const c = p.getByRole('button', { name: /Continuar a vida/ }); await c.waitFor({ timeout: 20000 }).catch(() => {}); await c.click().catch(() => {}); await p.waitForTimeout(1200); }
  for (const ps of passos) {
    const [k, ...r] = ps.split(':'); const x = r.join(':');
    try {
      if (k === 'area') { let bt = p.locator('.barra__item', { hasText: x }).locator('visible=true').first(); if (!(await bt.count())) bt = p.getByRole('button', { name: new RegExp(`^(Minha )?${x}$`) }).locator('visible=true').first(); await bt.click(); }
      else if (k === 'div') await p.locator('.divisoes-caminhos__item', { hasText: x }).first().click();
      else if (k === 'tab') await p.getByRole('tab', { name: new RegExp(x) }).locator('visible=true').first().click();
      else if (k === 'botao') await p.getByRole('button', { name: new RegExp(x) }).locator('visible=true').first().click();
      else if (k === 'clique') await p.locator(x).locator('visible=true').first().click();
      else if (k === 'rolar') await p.locator(x).first().scrollIntoViewIfNeeded();
    } catch (e) { erros.push(`passo ${ps}: ${e.message.slice(0, 80)}`); }
    await p.waitForTimeout(700);
  }
  await p.screenshot({ path: `${OUT}/${nome}.png`, fullPage: true });
  console.log(nome, erros.join(' | '));
  await ctx.close();
}
await b.close();
