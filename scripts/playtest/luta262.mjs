// VIDA 26.2 — confere na produção: escolher um estilo (sem estilo → Muay Thai), a troca (jiu-jitsu → boxe) e o caminho na busca.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const URL = process.env.URL ?? 'http://localhost:4173/';
const b = await chromium.launch(); const ok = []; const erros = [];
async function abrir(save) {
  const p = await b.newPage(); p.on('pageerror', e => erros.push(e.message));
  await p.goto(URL); await p.evaluate(s => { localStorage.clear(); localStorage.setItem('VIDA_NOVIDADES_VISTAS', '26.2'); localStorage.setItem('VIDA_GAME_SAVE_V1', s); }, readFileSync(`${process.env.SP}/vida-${save}.json`, 'utf8'));
  await p.goto(URL); await p.getByRole('button', { name: /Continuar a vida/ }).click(); await p.waitForTimeout(1200);
  await p.locator('.barra__item, button', { hasText: /Semana/ }).locator('visible=true').first().click(); await p.getByRole('tab', { name: /Corpo e mente/ }).click(); await p.waitForTimeout(600);
  return p;
}
let p = await abrir('v26-lutadora');
await p.locator('[data-opcao="muay_thai"] input').check({ force: true });
await p.getByRole('button', { name: 'Escolher Muay Thai' }).click(); await p.waitForTimeout(800);
ok.push(['escolher Muay Thai', await p.locator('[data-estilo-luta="muay_thai"]').count() === 1]);
await p.close();
p = await abrir('v26-jiujitsu');
ok.push(['faixa azul no jiu-jitsu', await p.locator('[data-faixa="azul"]').count() === 1]);
await p.getByRole('button', { name: 'Trocar de estilo' }).click();
await p.locator('[data-opcao="boxe"] input').check({ force: true });
await p.getByRole('button', { name: 'Trocar para Boxe' }).click(); await p.waitForTimeout(800);
ok.push(['trocar para Boxe', await p.locator('[data-estilo-luta="boxe"]').count() === 1]);
await p.getByRole('button', { name: 'Menu' }).click();
await p.getByRole('dialog', { name: 'Menu' }).getByRole('searchbox').fill('jiu-jitsu');
ok.push(['busca acha o caminho do jiu-jitsu', await p.locator('[data-trajeto-busca="lutas_jiu_jitsu"]').count() === 1]);
ok.push(['sem erro de página', erros.length === 0]);
for (const [n, x] of ok) console.log(x ? 'OK  ' : 'FALHA', n);
await b.close();
