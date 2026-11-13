// VIDA 19 (de celular15.mjs) — fotos do celular: + autor:<n> (abre o perfil), rolar:<css>, comentar:. OUT= pasta. SAVE= W= TEMA= PASSOS='app:Mensagens|clique:css|...' NOME=
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const URL = process.env.URL ?? 'http://localhost:4173/';
const OUT = process.env.OUT ?? `${process.env.HOME}/vida-trabalho/a19/fotos`;
const W = Number(process.env.W ?? 1440), H = Number(process.env.H ?? 900);
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: W, height: H } })).newPage();
const erros = []; p.on('pageerror', e => erros.push(e.message)); p.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
await p.goto(URL);
await p.evaluate(([s, t, n]) => { localStorage.clear(); localStorage.setItem('VIDA_APARENCIA', t); localStorage.setItem('VIDA_NOVIDADES_VISTAS', n); localStorage.setItem('VIDA_GAME_SAVE_V1', s); }, [readFileSync((process.env.SAVE ?? '').includes('/') ? process.env.SAVE : `${process.env.HOME}/vida-trabalho/a19/saves/vida-v19-${process.env.SAVE ?? 'famoso'}.json`, 'utf8'), process.env.TEMA ?? 'claro', process.env.NOTAS ?? '19']);
await p.goto(URL); await p.waitForTimeout(400);
await p.getByRole('button', { name: /Continuar a vida/ }).click(); await p.waitForTimeout(700);
for (const passo of (process.env.PASSOS ?? '').split('|').filter(Boolean)) {
  const [k, v] = [passo.slice(0, passo.indexOf(':')), passo.slice(passo.indexOf(':') + 1)];
  if (k === 'cel') await p.locator('.cabecalho__celular').first().click();
  else if (k === 'app') await p.locator('.cel__apps button', { hasText: v }).first().click();
  else if (k === 'botao') await p.getByRole('button', { name: new RegExp(v) }).locator('visible=true').first().click();
  else if (k === 'tab') await p.getByRole('tab', { name: new RegExp(v) }).locator('visible=true').first().click();
  else if (k === 'clique') await p.locator(v).locator('visible=true').first().click();
  else if (k === 'autor') await p.locator('.post19__quem').locator('visible=true').nth(Number(v) || 0).click();
  else if (k === 'rolar') await p.locator(v).locator('visible=true').first().scrollIntoViewIfNeeded();
  else if (k === 'comentar') { await p.locator('.post19__acoes button', { hasText: 'Comentar' }).locator('visible=true').first().click(); }
  else if (k === 'foto') await p.screenshot({ path: `${OUT}/${v}.png` });
  else if (k === 'area') { let bt = p.locator('.barra__item', { hasText: v }).locator('visible=true').first(); if (!(await bt.count())) bt = p.getByRole('button', { name: v, exact: true }).locator('visible=true').first(); await bt.click(); }
  await p.waitForTimeout(500);
}
// geometria: algo vazando para fora do aparelho, horizontalmente?
const vaza = await p.evaluate(() => { const a = document.querySelector('.cel__aparelho'); if (!a) return []; const r = a.getBoundingClientRect(); return [...a.querySelectorAll('*')].filter(e => { const q = e.getBoundingClientRect(); return q.width > 0 && (q.right > r.right + 1 || q.left < r.left - 1) && e.checkVisibility?.() && !e.closest('.cel__app-corpo, .cel__inicio, .namoro__abas, .jornal15__editorias'); }).slice(0, 5).map(e => e.className.toString().slice(0, 40)); });
const lateral = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
console.log(process.env.NOME, 'erros', erros.length ? erros : '-', 'vaza', vaza.length ? vaza : '-', 'rolagem-lateral', lateral);
await b.close();
