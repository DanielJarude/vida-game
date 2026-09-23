// Playtest visual da interface nova.
//   npm run build && npx vite preview --port 4173 &
//   SP=/tmp/vida-shots node scripts/playtest/jogar.mjs
// Cria uma vida, avança anos respondendo às decisões e fotografa cada aba
// em várias larguras. Reporta rolagem horizontal e botões fora da tela.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const SP = process.env.SP ?? '/tmp/vida-shots';
const URL = process.env.URL ?? 'http://localhost:4173/';
mkdirSync(SP, { recursive: true });
const b = await chromium.launch();
const problemas = [];

async function pagina(w, h) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  p.on('pageerror', e => problemas.push(`[${w}] erro de página: ${e.message}`));
  p.on('console', m => { if (m.type() === 'error') problemas.push(`[${w}] console: ${m.text()}`); });
  await p.goto(URL);
  await p.evaluate(() => localStorage.clear());
  await p.goto(URL);
  return p;
}

async function resolverMomentos(p) {
  for (let k = 0; k < 6; k++) {
    const opcao = p.locator('.opcao:not([disabled])');
    if (await opcao.count() > 0) { await opcao.first().click(); await p.waitForTimeout(60); continue; }
    const cont = p.getByRole('button', { name: /^Continuar$/ });
    if (await cont.count() > 0) { await cont.first().click(); await p.waitForTimeout(60); continue; }
    break;
  }
}

async function avancar(p, anos) {
  for (let i = 0; i < anos; i++) {
    await resolverMomentos(p);
    const btn = p.locator('.avancar__botao');
    if (await btn.count() === 0) return;
    await btn.click();
    await p.waitForTimeout(40);
  }
  await resolverMomentos(p);
}

async function verificar(p, rotulo) {
  const r = await p.evaluate(() => {
    const larg = document.documentElement.clientWidth;
    const rolagem = document.documentElement.scrollWidth > larg + 1;
    const fora = [...document.querySelectorAll('button, a, input, select')]
      .filter(el => { const b = el.getBoundingClientRect(); return b.width > 0 && (b.right > larg + 1 || b.left < -1); })
      .map(el => (el.textContent || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 40));
    const pequenos = [...document.querySelectorAll('button')]
      .filter(el => { const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0 && (b.height < 36 || b.width < 36); })
      .map(el => (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30));
    return { rolagem, fora, pequenos };
  });
  if (r.rolagem) problemas.push(`${rotulo}: rolagem horizontal`);
  if (r.fora.length) problemas.push(`${rotulo}: fora da tela → ${r.fora.join(' | ')}`);
  if (r.pequenos.length) problemas.push(`${rotulo}: alvos pequenos → ${[...new Set(r.pequenos)].slice(0, 6).join(' | ')}`);
}

async function fotografarAbas(p, prefixo, larg) {
  const abas = larg <= 760 ? '.barra__item' : '.aba';
  const n = await p.locator(abas).count();
  for (let k = 0; k < n; k++) {
    await p.locator(abas).nth(k).click();
    await p.waitForTimeout(120);
    await verificar(p, `${prefixo}-aba${k}`);
    await p.screenshot({ path: `${SP}/${prefixo}-aba${k}.png`, fullPage: k === 0 });
  }
  await p.locator(abas).first().click();
}

for (const [larg, alt, nome] of [[1440, 900, 'desk'], [390, 844, 'cel'], [320, 640, 'mini']]) {
  const p = await pagina(larg, alt);
  await p.screenshot({ path: `${SP}/${nome}-00-inicio.png` });
  await p.getByRole('button', { name: /Nascer de novo/ }).click();
  await p.waitForTimeout(200);
  await verificar(p, `${nome}-criacao`);
  await p.screenshot({ path: `${SP}/${nome}-01-criacao.png`, fullPage: true });
  await p.locator('.criacao__nascer').click();
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${SP}/${nome}-02-bebe.png` });
  const etapas = larg === 1440 ? [[3, 'crianca'], [10, 'escola'], [5, 'adolescente'], [10, 'jovem'], [20, 'adulto']] : [[14, 'adolescente'], [16, 'adulto']];
  for (const [anos, rot] of etapas) {
    await avancar(p, anos);
    // tira uma foto do momento se houver um aberto na hora
    await p.screenshot({ path: `${SP}/${nome}-${rot}.png` });
    if (rot === 'adulto' || (larg !== 1440 && rot === 'adolescente')) await fotografarAbas(p, `${nome}-${rot}`, larg);
  }
  // Força abrir um momento para fotografar
  for (let i = 0; i < 12; i++) {
    const btn = p.locator('.avancar__botao');
    if (await btn.count() === 0) break;
    await btn.click(); await p.waitForTimeout(40);
    if (await p.locator('.momento').count() > 0) { await verificar(p, `${nome}-momento`); await p.screenshot({ path: `${SP}/${nome}-momento.png` }); break; }
  }
  await p.context().close();
}

await b.close();
console.log(problemas.length ? problemas.join('\n') : 'sem problemas estruturais');
