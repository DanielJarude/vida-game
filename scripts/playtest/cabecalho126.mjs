// VIDA 12.6 — a altura da cabeça das áreas no celular (390 × 800): do alto da página até o fim da cabeça da área e das
// abas da área, em cada área — numa build (URL) e noutra (ANTES). SAVE=<arquivo.json>.
import { chromium } from 'playwright';
import { readFileSync } from 'fs';
const save = readFileSync(process.env.SAVE, 'utf8');
const urls = { depois: process.env.URL ?? 'http://localhost:4173/', antes: process.env.ANTES ?? 'https://vida-game.pages.dev/' };
const b = await chromium.launch();
for (const [nome, url] of Object.entries(urls)) {
  const p = await b.newPage({ viewport: { width: 390, height: 800 } });
  await p.goto(url);
  await p.evaluate(s => { localStorage.clear(); localStorage.setItem('VIDA_NOVIDADES_VISTAS', '12.6'); localStorage.setItem('VIDA_GAME_SAVE_V1', s); }, save);
  await p.goto(url);
  await p.waitForTimeout(800);
  await p.getByRole('button', { name: /Novidades|Fechar/ }).first().click({ timeout: 3000 }).catch(() => {});
  await p.keyboard.press('Escape').catch(() => {});
  await p.getByRole('button', { name: /Continuar a vida/ }).click();
  await p.waitForTimeout(800);
  const out = [];
  for (const area of ['Pessoas', 'Semana', 'Vida', 'Caminhos']) {
    await p.locator('.barra__item', { hasText: area }).locator('visible=true').first().click();
    await p.waitForTimeout(900);
    const m = await p.evaluate(() => {
      const c = document.querySelector('.cabeca-area'); if (!c) return null;
      const sub = document.querySelector('.cabeca-area ~ .subnav, .subnav');
      const fim = Math.max(c.getBoundingClientRect().bottom, sub ? sub.getBoundingClientRect().bottom : 0) + window.scrollY;
      return { cabeca: Math.round(c.getBoundingClientRect().height), ateConteudo: Math.round(fim) };
    });
    out.push(`${area}: ${m ? `cabeça ${m.cabeca}px, conteúdo começa em ${m.ateConteudo}px` : 'sem cabeça'}`);
  }
  console.log(nome, '·', out.join(' · '));
  await p.close();
}
await b.close();
