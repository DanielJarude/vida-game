// VIDA 16.1 — fotos das áreas no jogo real. SAVE=<nome em qa15/saves sem prefixo, ou caminho .json> W= TEMA= NOTAS= PASSOS='area:Vida|tab:Compras|botao:x|clique:css|rolar:css|foto:nome' URL=
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const URL = process.env.URL ?? 'http://localhost:4173/';
const OUT = process.env.OUT ?? `${process.env.HOME}/vida-trabalho/a16/fotos`;
const W = Number(process.env.W ?? 1440), H = Number(process.env.H ?? 1000);
const S = process.env.SAVE ?? 'adulto';
const save = readFileSync(S.endsWith('.json') ? S : `${process.env.HOME}/vida-trabalho/qa15/saves/vida-v15-${S}.json`, 'utf8');
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: W, height: H } })).newPage();
const erros = []; p.on('pageerror', e => erros.push(e.message)); p.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
await p.goto(URL);
await p.evaluate(([s, t, n]) => { localStorage.clear(); localStorage.setItem('VIDA_APARENCIA', t); localStorage.setItem('VIDA_NOVIDADES_VISTAS', n); localStorage.setItem('VIDA_GAME_SAVE_V1', s); }, [save, process.env.TEMA ?? 'claro', process.env.NOTAS ?? '16.1']);
await p.goto(URL); await p.waitForTimeout(500);
await p.getByRole('button', { name: /Continuar a vida/ }).click(); await p.waitForTimeout(800);
const problemas = [];
for (const passo of (process.env.PASSOS ?? '').split('|').filter(Boolean)) {
  const [k, v] = [passo.slice(0, passo.indexOf(':')), passo.slice(passo.indexOf(':') + 1)];
  try {
    if (k === 'area') { let bt = p.locator('.barra__item', { hasText: v }).locator('visible=true').first(); if (!(await bt.count())) bt = p.getByRole('button', { name: v, exact: true }).locator('visible=true').first(); await bt.click(); }
    else if (k === 'tab') await p.getByRole('tab', { name: new RegExp(v) }).locator('visible=true').first().click();
    else if (k === 'botao') await p.getByRole('button', { name: new RegExp(v) }).locator('visible=true').first().click();
    else if (k === 'clique') await p.locator(v).locator('visible=true').first().click();
    else if (k === 'rolar') await p.locator(v).first().scrollIntoViewIfNeeded();
    else if (k === 'topo') await p.evaluate(() => window.scrollTo(0, 0));
    else if (k === 'foto') {
      const lateral = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (lateral > 1) problemas.push(`${v}: rolagem lateral ${lateral}px`);
      await p.screenshot({ path: `${OUT}/${v}.png`, fullPage: process.env.CHEIA === '1' });
    }
  } catch (e) { problemas.push(`${passo}: ${String(e.message).split('\n')[0]}`); }
  await p.waitForTimeout(600);
}
console.log(process.env.NOME ?? S, 'erros', erros.length ? erros.slice(0, 3) : '-', 'problemas', problemas.length ? problemas : '-');
await b.close();
