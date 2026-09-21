import { chromium } from 'playwright';
const SP = process.env.SP;
const URL = 'http://localhost:4173/';

const b = await chromium.launch();

async function novaPagina(w, h) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1.5 });
  const p = await ctx.newPage();
  await p.goto(URL);
  await p.waitForTimeout(500);
  return p;
}

async function criarVida(p) {
  // Home -> Nova vida
  await p.getByRole('button', { name: /nova vida/i }).first().click();
  await p.waitForTimeout(300);
  await p.getByRole('button', { name: /começar a viver/i }).click();
  await p.waitForTimeout(600);
}

async function avancar(p, anos) {
  for (let i = 0; i < anos; i++) {
    // fecha modais abertos
    for (let k = 0; k < 4; k++) {
      const cont = p.getByRole('button', { name: /^Continuar$/ });
      if (await cont.count() > 0 && await cont.first().isVisible()) { await cont.first().click(); await p.waitForTimeout(90); continue; }
      const opcs = p.locator('.event-choice:not([disabled])');
      if (await opcs.count() > 0) { await opcs.first().click({ timeout: 3000 }); await p.waitForTimeout(120); continue; }
      break;
    }
    const btn = p.locator('.year-advance__button');
    if (await btn.count() === 0) break;
    if (await btn.isDisabled()) { await p.waitForTimeout(120); continue; }
    await btn.click();
    await p.waitForTimeout(160);
  }
  // fecha o que sobrou
  for (let k = 0; k < 4; k++) {
    const cont = p.getByRole('button', { name: /^Continuar$/ });
    if (await cont.count() > 0 && await cont.first().isVisible()) { await cont.first().click(); await p.waitForTimeout(90); }
    else break;
  }
}

// 1. Home
let p = await novaPagina(1440, 900);
await p.screenshot({ path: `${SP}/ui-01-home.png` });
// 2. Criação
await p.getByRole('button', { name: /nova vida/i }).first().click();
await p.waitForTimeout(400);
await p.screenshot({ path: `${SP}/ui-02-criacao.png`, fullPage: true });
// 3. Jogo recém-nascido
await p.getByRole('button', { name: /começar a viver/i }).click();
await p.waitForTimeout(700);
await p.screenshot({ path: `${SP}/ui-03-bebe.png` });
// 4. Adolescente
await avancar(p, 14);
await p.screenshot({ path: `${SP}/ui-04-adolescente.png` });
// 5. Adulto com timeline longa
await avancar(p, 26);
await p.screenshot({ path: `${SP}/ui-05-adulto.png` });
await p.screenshot({ path: `${SP}/ui-06-timeline-longa.png`, fullPage: true });
await p.context().close();

// 6. Mobile
let m = await novaPagina(390, 844);
await criarVida(m);
await avancar(m, 12);
await m.screenshot({ path: `${SP}/ui-07-mobile.png` });
await m.screenshot({ path: `${SP}/ui-08-mobile-full.png`, fullPage: true });
await m.context().close();

await b.close();
console.log('capturas ok');
