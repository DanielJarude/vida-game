// Playtest visual da vida social (ATT 1).
//   npm run build && npx vite preview --port 4173 &
//   SP=/tmp/vida-social node scripts/playtest/social.mjs   (depois de gerarSociais)
// Carrega saves de momentos sociais e fotografa Pessoas, a ficha do parceiro
// e de um filho, o painel "Agora" e a despedida, em 320/390/820/1440 px.
// Reporta rolagem horizontal, botões fora da tela, CTA cobrindo conteúdo.
import { chromium } from 'playwright';
import { readFileSync, existsSync } from 'node:fs';

const SP = process.env.SP ?? '/tmp/vida-social';
const URL = process.env.URL ?? 'http://localhost:4173/';
const b = await chromium.launch();
const problemas = [];

async function abrir(save, w, h) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  p.on('pageerror', e => problemas.push(`[${w}] erro de página: ${e.message}`));
  p.on('console', m => { if (m.type() === 'error') problemas.push(`[${w}] console: ${m.text()}`); });
  await p.goto(URL);
  await p.evaluate(s => { localStorage.clear(); localStorage.setItem('VIDA_GAME_SAVE_V1', s); }, save);
  await p.goto(URL);
  await p.getByRole('button', { name: /Continuar a vida/ }).click();
  await p.waitForTimeout(150);
  return p;
}

async function verificar(p, rotulo) {
  const r = await p.evaluate(() => {
    const larg = document.documentElement.clientWidth;
    const alto = window.innerHeight;
    const rolagem = document.documentElement.scrollWidth > larg + 1;
    const fora = [...document.querySelectorAll('button, a, input, select')]
      .filter(el => { const b = el.getBoundingClientRect(); return b.width > 0 && (b.right > larg + 1 || b.left < -1); })
      .map(el => (el.textContent || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 40));
    // O CTA fixo cobre o último conteúdo quando a página está rolada até o fim?
    const cta = document.querySelector('.avancar__botao')?.getBoundingClientRect();
    window.scrollTo(0, document.body.scrollHeight);
    const ultimo = [...document.querySelectorAll('main .secao, main li, main p')].filter(e => e.getBoundingClientRect().height > 0).pop()?.getBoundingClientRect();
    const cobre = !!(cta && ultimo && !document.querySelector('.veu') && ultimo.bottom > cta.top + 2 && ultimo.top < alto);
    const folha = document.querySelector('.folha')?.getBoundingClientRect();
    const folhaAlta = !!(folha && (folha.top < 0 || folha.bottom > alto + 1));
    return { rolagem, fora, cobre, folhaAlta };
  });
  if (r.rolagem) problemas.push(`${rotulo}: rolagem horizontal`);
  if (r.fora.length) problemas.push(`${rotulo}: fora da tela → ${r.fora.join(' | ')}`);
  if (r.cobre) problemas.push(`${rotulo}: botão "Viver mais um ano" cobre o fim do conteúdo`);
  if (r.folhaAlta) problemas.push(`${rotulo}: folha maior que a tela`);
}

for (const nome of ['crianca', 'adulto', 'despedida', 'avo']) {
  const arq = `${SP}/save-${nome}.json`;
  if (!existsSync(arq)) { problemas.push(`sem save ${nome}`); continue; }
  const save = readFileSync(arq, 'utf8');
  for (const [w, h] of [[320, 640], [390, 844], [820, 1180], [1440, 900]]) {
    const p = await abrir(save, w, h);
    const tag = `${nome}-${w}`;
    if (nome === 'despedida') {
      await p.screenshot({ path: `${SP}/${tag}-momento.png` });
      await verificar(p, `${tag} momento`);
      const op = p.locator('.opcao:not([disabled])');
      if (await op.count()) { await op.first().click(); await p.waitForTimeout(80); await p.screenshot({ path: `${SP}/${tag}-resultado.png` }); }
      const cont = p.getByRole('button', { name: /^Continuar$/ });
      if (await cont.count()) await cont.first().click();
      await p.getByRole('button', { name: /^Linha da Vida$|^Vida$/ }).locator('visible=true').first().click().catch(() => {});
      await p.evaluate(() => window.scrollTo(0, 0));
      await p.waitForTimeout(80);
      await p.screenshot({ path: `${SP}/${tag}-linha.png` });
    }
    await p.getByRole('button', { name: /^Pessoas$/ }).locator('visible=true').first().click();
    await p.waitForTimeout(120);
    await p.screenshot({ path: `${SP}/${tag}-pessoas.png`, fullPage: true });
    await verificar(p, `${tag} pessoas`);
    // Ficha: primeira pessoa do núcleo (parceria ou filho) e um filho, se houver.
    const cartoes = p.locator('.cartao-pessoa');
    const n = await cartoes.count();
    for (const k of [0, n - 1].filter((x, i, a) => x >= 0 && a.indexOf(x) === i).slice(0, 2)) {
      await cartoes.nth(k).click();
      await p.waitForTimeout(100);
      await p.screenshot({ path: `${SP}/${tag}-ficha${k}.png` });
      await verificar(p, `${tag} ficha${k}`);
      const acao = p.locator('.folha .grupo-acoes .botao:not([disabled])');
      if (await acao.count()) { await acao.first().click(); await p.waitForTimeout(80); }
      await p.keyboard.press('Escape');
      await p.waitForTimeout(60);
    }
    if (n === 0) {
      const lista = p.locator('.pessoa');
      if (await lista.count()) { await lista.first().click(); await p.waitForTimeout(80); await p.screenshot({ path: `${SP}/${tag}-ficha.png` }); await verificar(p, `${tag} ficha`); await p.keyboard.press('Escape'); }
    }
    if (w >= 1440) await p.screenshot({ path: `${SP}/${tag}-agora.png`, clip: { x: 1440 - 360, y: 60, width: 360, height: 700 } });
    await p.context().close();
  }
}
await b.close();
console.log(problemas.length ? problemas.join('\n') : 'nenhum problema estrutural');
