// VIDA 20 — inspeção visual das telas novas no build de produção. SAVE=<nome em a20/saves> W= H= TEMA=claro|escuro
// PASSOS='area:Caminhos|texto:Outros caminhos|rolar:.auto20|foto:nome' OUT=<pasta>. Mede rolagem lateral, o que sai da
// tela dentro da seção (SEL=), erros de console. Grava a foto do elemento SEL (ou da página).
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const URL = process.env.URL ?? 'http://localhost:4173/';
const OUT = process.env.OUT ?? `${process.env.HOME}/vida-trabalho/a20/qa`;
const W = Number(process.env.W ?? 1440), H = Number(process.env.H ?? 900);
const SEL = process.env.SEL;
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: W, height: H } })).newPage();
const erros = []; p.on('pageerror', e => erros.push(e.message)); p.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
await p.goto(URL);
const save = readFileSync(`${process.env.HOME}/vida-trabalho/a20/saves/vida-v20-${process.env.SAVE}.json`, 'utf8');
await p.evaluate(([s, t]) => { localStorage.clear(); localStorage.setItem('VIDA_APARENCIA', t); localStorage.setItem('VIDA_NOVIDADES_VISTAS', '20'); localStorage.setItem('VIDA_GAME_SAVE_V1', s); }, [save, process.env.TEMA ?? 'claro']);
await p.goto(URL); await p.waitForTimeout(500);
await p.getByRole('button', { name: /Continuar a vida/ }).click(); await p.waitForTimeout(900);
for (const passo of (process.env.PASSOS ?? '').split('|').filter(Boolean)) {
  const [k, v] = [passo.slice(0, passo.indexOf(':')), passo.slice(passo.indexOf(':') + 1)];
  try {
    if (k === 'area') { let bt = p.locator('.barra__item', { hasText: v }).locator('visible=true').first(); if (!(await bt.count())) bt = p.getByRole('button', { name: v, exact: true }).locator('visible=true').first(); await bt.click(); }
    else if (k === 'texto') await p.getByText(v, { exact: false }).locator('visible=true').first().click();
    else if (k === 'botao') await p.getByRole('button', { name: new RegExp(v) }).locator('visible=true').first().click();
    else if (k === 'tab') await p.getByRole('tab', { name: new RegExp(v) }).locator('visible=true').first().click();
    else if (k === 'clique') await p.locator(v).locator('visible=true').first().click();
    else if (k === 'esperar') await p.locator(v).first().waitFor({ state: 'visible', timeout: 15000 });
    else if (k === 'rolar') await p.locator(v).locator('visible=true').first().scrollIntoViewIfNeeded();
    else if (k === 'foto') { const el = SEL ? p.locator(SEL).locator('visible=true').first() : null; if (el && await el.count()) await el.screenshot({ path: `${OUT}/${v}.png` }); else await p.screenshot({ path: `${OUT}/${v}.png` }); }
  } catch (e) { erros.push(`passo ${passo}: ${e.message.split('\n')[0]}`); }
  await p.waitForTimeout(600);
}
const lateral = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const fora = SEL ? await p.evaluate(sel => { const a = document.querySelector(sel); if (!a) return ['(seção não encontrada)']; return [...a.querySelectorAll('*')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > window.innerWidth + 1 || r.left < -1); }).slice(0, 5).map(e => `${e.tagName}.${e.className}`); }, SEL) : [];
console.log(`${process.env.NOME ?? process.env.SAVE} ${W} ${process.env.TEMA ?? 'claro'} · erros ${erros.length ? JSON.stringify(erros) : '-'} · lateral ${lateral} · fora ${fora.length ? fora.join(',') : '-'}`);
await b.close();
