// Capturas de auditoria: CENAS=json [[nome, save|'nova', passos[]]]
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';
const URL = process.env.URL ?? 'http://localhost:4173/';
const SP = process.env.SP ?? `${process.env.HOME}/vida-trabalho/v25/saves`;
const OUT = process.env.OUT; mkdirSync(OUT, { recursive: true });
const CENAS = JSON.parse(readFileSync(process.env.CENAS, 'utf8'));
const b = await chromium.launch();
const problemas = [];
for (const tema of (process.env.TEMAS ?? 'claro').split(',')) for (const W of (process.env.WS ?? process.env.W ?? '1440').split(',').map(Number)) for (const [nome, save, passos] of CENAS) {
  const ctx = await b.newContext({ viewport: { width: W, height: W > 800 ? 950 : 844 } });
  const p = await ctx.newPage(); const erros = [];
  p.on('pageerror', e => erros.push(e.message));
  await p.goto(URL);
  await p.evaluate(([s, n, t]) => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem('VIDA_NOVIDADES_VISTAS', n); localStorage.setItem('VIDA_APARENCIA', t); if (s) localStorage.setItem('VIDA_GAME_SAVE_V1', s); }, [save === 'nova' ? '' : readFileSync(`${SP}/vida-${save}.json`, 'utf8'), process.env.NOVID ?? '25', tema]);
  await p.goto(URL); await p.waitForTimeout(1500);
  if (save !== 'nova') { const c = p.getByRole('button', { name: /Continuar a vida/ }); await c.waitFor({ timeout: 20000 }).catch(() => {}); await c.click().catch(() => {}); await p.waitForTimeout(1200); }
  for (const ps of passos) {
    const [k, ...r] = ps.split(':'); const x = r.join(':');
    try {
      if (k === 'area') { let bt = p.locator('.barra__item', { hasText: x }).locator('visible=true').first(); if (!(await bt.count())) bt = p.getByRole('button', { name: new RegExp(`^(Minha )?${x}$`) }).locator('visible=true').first(); await bt.click(); }
      else if (k === 'div') await p.locator('.divisoes-caminhos__item', { hasText: x }).first().click();
      else if (k === 'tab') await p.getByRole('tab', { name: new RegExp(x) }).locator('visible=true').first().click();
      else if (k === 'digitar') { await p.getByRole('searchbox').locator('visible=true').first().fill(x); }
      else if (k === 'radio') await p.getByRole('radio', { name: new RegExp(x) }).locator('visible=true').first().click();
      else if (k === 'botao') await p.getByRole('button', { name: new RegExp(x) }).locator('visible=true').first().click();
      else if (k === 'clique') await p.locator(x).locator('visible=true').first().click();
      else if (k === 'rolar') await p.locator(x).first().scrollIntoViewIfNeeded();
    } catch (e) { erros.push(`passo ${ps}: ${e.message.slice(0, 80)}`); }
    await p.waitForTimeout(700);
  }
  const tag = `${nome}@${W}-${tema}`;
  const lateral = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  if (lateral > 1) problemas.push(`${tag}: rolagem lateral ${lateral}px`);
  const texto = await p.evaluate(() => document.body.innerText);
  if (/\bNaN\b|undefined|\[object/.test(texto)) problemas.push(`${tag}: texto quebrado`);
  if (erros.length) problemas.push(`${tag}: ${erros.join(' | ').slice(0, 200)}`);
  await p.screenshot({ path: `${OUT}/${tag}.png`, fullPage: true });
  console.log(tag, erros.length ? 'ERROS' : 'ok');
  await ctx.close();
}
await b.close();
console.log(problemas.length ? problemas.join('\n') : 'sem problemas');
