// REWORK 11 · QA — capturas de um elemento inteiro (seção, painel): node elementos11.mjs save área largura tema seletorFinal saida [passos css...]
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const [sv, area, w, tema, alvo, saida, ...passos] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +w, height: 900 } });
await p.goto('http://localhost:4173/');
await p.evaluate(([s, t]) => { localStorage.clear(); localStorage.setItem('VIDA_APARENCIA', t); localStorage.setItem('VIDA_NOVIDADES_VISTAS', '11'); localStorage.setItem('VIDA_GAME_SAVE_V1', s); }, [readFileSync(`${process.env.HOME}/vida-trabalho/qa11/saves/vida-r11-${sv}.json`, 'utf8'), tema]);
await p.goto('http://localhost:4173/'); await p.getByRole('button', { name: /Continuar a vida/ }).click(); await p.waitForTimeout(400);
let bt = p.locator('.barra__item', { hasText: area }).locator('visible=true').first(); if (!(await bt.count())) bt = p.getByRole('button', { name: area, exact: true }).locator('visible=true').first(); await bt.click(); await p.waitForTimeout(400);
for (const passo of passos) { await p.locator(passo).locator('visible=true').first().click(); await p.waitForTimeout(400); }
await p.addStyleTag({ content: '.avancar, header, .barra { visibility: hidden !important; }' });
await p.locator(alvo).locator('visible=true').first().screenshot({ path: saida });
await b.close();
