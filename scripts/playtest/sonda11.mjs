// sonda: abre um save numa área e lista elementos clicáveis com um texto (para achar seletores)
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const [sv, area, texto, w = '1440'] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +w, height: 900 } });
await p.goto('http://localhost:4173/');
await p.evaluate(s => { localStorage.clear(); localStorage.setItem('VIDA_NOVIDADES_VISTAS', '11'); localStorage.setItem('VIDA_GAME_SAVE_V1', s); }, readFileSync(`${process.env.HOME}/vida-trabalho/qa11/saves/vida-r11-${sv}.json`, 'utf8'));
await p.goto('http://localhost:4173/'); await p.getByRole('button', { name: /Continuar a vida/ }).click(); await p.waitForTimeout(400);
let bt = p.locator('.barra__item', { hasText: area }).locator('visible=true').first(); if (!(await bt.count())) bt = p.getByRole('button', { name: area, exact: true }).locator('visible=true').first(); await bt.click(); await p.waitForTimeout(400);
for (const passo of process.argv.slice(6)) { await p.locator(passo).locator('visible=true').first().click(); await p.waitForTimeout(400); }
console.log(await p.evaluate(t => [...document.querySelectorAll('button, a, [role=tab], summary, li')].filter(x => x.textContent.includes(t)).slice(0, 15).map(x => `${x.tagName}.${[...x.classList].join('.')} | ${x.textContent.trim().slice(0, 80)}`).join('\n'), texto));
await b.close();
