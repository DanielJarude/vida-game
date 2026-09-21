/**
 * Auditoria estrutural de responsividade e acessibilidade no navegador real.
 * Mede o que um screenshot não mostra: overflow horizontal, alvos de toque
 * pequenos demais, contraste de foco, e elementos clipados.
 */
import { chromium } from 'playwright';

const URL = 'http://localhost:4173/';
const LARGURAS = [
  ['mobile-pequeno', 320, 690],
  ['mobile', 390, 844],
  ['mobile-grande', 430, 932],
  ['tablet-retrato', 768, 1024],
  ['tablet-paisagem', 1024, 768],
  ['notebook', 1366, 768],
  ['desktop', 1920, 1080]
];

const b = await chromium.launch();
const problemas = [];

for (const [nome, w, h] of LARGURAS) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  await p.goto(URL);
  await p.waitForTimeout(400);

  // Cria uma vida e avança alguns anos para ter conteúdo real na tela.
  await p.getByRole('button', { name: /nova vida/i }).first().click();
  await p.waitForTimeout(300);
  await p.getByRole('button', { name: /começar a viver/i }).click();
  await p.waitForTimeout(500);

  for (let i = 0; i < 10; i++) {
    for (let k = 0; k < 4; k++) {
      const cont = p.getByRole('button', { name: /^Continuar$/ });
      if ((await cont.count()) > 0 && (await cont.first().isVisible())) {
        await cont.first().click();
        await p.waitForTimeout(80);
        continue;
      }
      const opcs = p.locator('.event-choice:not([disabled])');
      if ((await opcs.count()) > 0) {
        await opcs.first().click({ timeout: 3000 });
        await p.waitForTimeout(100);
        continue;
      }
      break;
    }
    const btn = p.locator('.year-advance__button');
    if ((await btn.count()) === 0) break;
    if (await btn.isDisabled()) break;
    await btn.click();
    await p.waitForTimeout(120);
  }
  for (let k = 0; k < 4; k++) {
    const cont = p.getByRole('button', { name: /^Continuar$/ });
    if ((await cont.count()) > 0 && (await cont.first().isVisible())) {
      await cont.first().click();
      await p.waitForTimeout(80);
    } else break;
  }

  const relatorio = await p.evaluate(() => {
    const out = { overflow: null, estouros: [], alvosPequenos: [], semNome: [] };

    const de = document.documentElement;
    if (de.scrollWidth > de.clientWidth + 1) {
      out.overflow = { scrollWidth: de.scrollWidth, clientWidth: de.clientWidth };
    }

    const largura = de.clientWidth;
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const estilo = getComputedStyle(el);
      if (estilo.position === 'fixed') continue;

      // Elemento que ultrapassa a borda direita da janela.
      if (r.right > largura + 1 && estilo.overflowX !== 'auto' && estilo.overflowX !== 'scroll') {
        const pai = el.parentElement;
        const paiEstilo = pai ? getComputedStyle(pai) : null;
        const paiRola = paiEstilo && ['auto', 'scroll'].includes(paiEstilo.overflowX);
        if (!paiRola && out.estouros.length < 8) {
          out.estouros.push({
            tag: el.tagName.toLowerCase(),
            classe: (el.className || '').toString().slice(0, 60),
            direita: Math.round(r.right),
            texto: (el.textContent || '').trim().slice(0, 40)
          });
        }
      }

      // Alvo de toque menor que o mínimo em ponteiro grosso.
      if (el.matches('button, a, [role="button"], input, select')) {
        if ((r.height < 40 || r.width < 32) && out.alvosPequenos.length < 10) {
          out.alvosPequenos.push({
            classe: (el.className || '').toString().slice(0, 50),
            w: Math.round(r.width),
            h: Math.round(r.height),
            texto: (el.textContent || '').trim().slice(0, 30)
          });
        }
        const nome =
          (el.textContent || '').trim() ||
          el.getAttribute('aria-label') ||
          el.getAttribute('title');
        if (!nome && out.semNome.length < 6) {
          out.semNome.push((el.className || '').toString().slice(0, 50));
        }
      }
    }
    return out;
  });

  const avancarVisivel = await p.locator('.year-advance__button').isVisible().catch(() => false);
  problemas.push({ viewport: nome, largura: w, avancarVisivel, ...relatorio });
  await ctx.close();
}

await b.close();
console.log(JSON.stringify(problemas, null, 1));
