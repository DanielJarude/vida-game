// ERAS v2 — conferência em produção: nascer em 1975, cabeçalho com Cr$, viver um ano, sem erro de console. W=largura.
import { chromium } from 'playwright';
const URL = process.env.URL ?? 'https://vida-game.pages.dev/';
const b = await chromium.launch();
for (const w of (process.env.W ?? '1440,390').split(',').map(Number)) {
  const p = await b.newPage({ viewport: { width: w, height: w > 800 ? 1000 : 844 } });
  const erros = []; p.on('pageerror', e => erros.push(e.message)); p.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  await p.goto(URL); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('VIDA_NOVIDADES_VISTAS', 'Eras 2'); }); await p.goto(URL);
  const novo = p.getByRole('button', { name: /Nascer de novo/ }).first();
  for (let k = 0; k < 4 && !(await p.locator('.epoca').count()); k++) { await novo.click().catch(() => {}); await p.locator('.epoca').waitFor({ timeout: 8000 }).catch(() => {}); }
  await p.locator('.epoca__porta[data-era="1970"]').click(); await p.getByRole('radio', { name: '1975' }).click();
  await p.locator('.criacao__nascer').click(); await p.waitForTimeout(2000);
  const sub1 = (await p.locator('.cabecalho__eu-texto').innerText()).replace(/\n/g, ' ');
  await p.getByRole('button', { name: /Viver mais um ano/ }).first().click(); await p.waitForTimeout(2500);
  for (let k = 0; k < 6; k++) { const op = p.locator('.momento button, .decisao button').first(); if (await op.count()) { await op.click().catch(() => {}); await p.waitForTimeout(500); } else break; }
  const sub2 = (await p.locator('.cabecalho__eu-texto').innerText()).replace(/\n/g, ' ');
  const lateral = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  console.log(`${w}: antes [${sub1}] depois [${sub2}] lateral ${lateral} erros ${erros.length ? erros.join(' | ') : '-'}`);
  await p.close();
}
await b.close();
