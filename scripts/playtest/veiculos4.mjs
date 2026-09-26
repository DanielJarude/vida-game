// Playtest visual das lojas de veículos (marca e modelo, catálogo completo).
//   npm run build && npx vite preview --port 4187 &
//   SP=/tmp/vida-mat node scripts/playtest/veiculos4.mjs      (depois de gerarMaterial)
// Abre concessionária, usados e motos em 320 e 1440 px, alterna para o
// catálogo completo, filtra, abre uma oferta; reporta rolagem horizontal,
// botões fora da tela, alvos de toque abaixo de 40 px e a ordem dos preços.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const SP = process.env.SP ?? '/tmp/vida-mat';
const URL = process.env.URL ?? 'http://localhost:4187/';
const CENA = process.env.CENA ?? 'veiculo';
const b = await chromium.launch();
const problemas = [];

async function verificar(p, rotulo) {
  const r = await p.evaluate(() => {
    const larg = document.documentElement.clientWidth;
    const raiz = document.querySelector('.veu .folha') ?? document.querySelector('main');
    const rolagem = document.documentElement.scrollWidth > larg + 1 || (raiz && raiz.scrollWidth > raiz.clientWidth + 1);
    const visiveis = [...raiz.querySelectorAll('button, input')].filter(el => el.getBoundingClientRect().width > 0);
    const fora = visiveis.filter(el => { const q = el.getBoundingClientRect(); return q.right > larg + 1 || q.left < -1; }).map(el => (el.textContent || el.tagName).trim().slice(0, 40));
    const pequenos = visiveis.filter(el => el.getBoundingClientRect().height < 40).map(el => (el.textContent || el.tagName).trim().slice(0, 30));
    const precos = [...raiz.querySelectorAll('.catalogo-veiculos .oferta__preco')].map(el => el.textContent.trim());
    return { rolagem, fora, pequenos, precos };
  });
  if (r.rolagem) problemas.push(`${rotulo}: rolagem horizontal`);
  if (r.fora.length) problemas.push(`${rotulo}: fora da tela → ${r.fora.join(' | ')}`);
  if (r.pequenos.length) problemas.push(`${rotulo}: alvos < 40px → ${r.pequenos.slice(0, 5).join(' | ')}`);
  return r;
}

const valor = t => { const n = parseFloat(t.replace(/[^\d,]/g, '').replace(',', '.')); return /mi/.test(t) ? n * 1e6 : /mil/.test(t) ? n * 1e3 : n; };

const save = readFileSync(`${SP}/save-${CENA}.json`, 'utf8');
for (const w of [320, 1440]) {
  const ctx = await b.newContext({ viewport: { width: w, height: w === 320 ? 640 : 900 } });
  const p = await ctx.newPage();
  p.on('pageerror', e => problemas.push(`[${w}] erro: ${e.message}`));
  await p.goto(URL);
  await p.evaluate(s => { localStorage.clear(); localStorage.setItem('VIDA_GAME_SAVE_V1', s); }, save);
  await p.goto(URL);
  await p.getByRole('button', { name: /Continuar a vida/ }).click();
  await p.waitForTimeout(150);
  for (let k = 0; k < 3; k++) {
    const op = p.locator('.veu .opcao:not([disabled])');
    if (await op.count()) { await op.first().click(); await p.waitForTimeout(60); }
    const cont = p.getByRole('button', { name: /^Continuar$/ });
    if (await cont.count()) { await cont.first().click(); await p.waitForTimeout(60); }
  }
  await p.getByRole('button', { name: /^Cidade$/ }).locator('visible=true').first().click();
  await p.waitForTimeout(150);
  for (const [nome, arq] of [['Concessionária', 'conc'], ['Usados', 'usados'], ['Motos', 'motos']]) {
    const botao = p.locator('.lugar-botao', { hasText: nome });
    if (!(await botao.count())) { problemas.push(`[${w}] sem botão ${nome}`); continue; }
    await botao.first().click();
    await p.waitForTimeout(150);
    await p.screenshot({ path: `${SP}/v4-${w}-${arq}-loja.png` });
    await verificar(p, `[${w}] ${arq} loja`);
    await p.locator('.veu').getByRole('radio', { name: /Catálogo completo/ }).click();
    await p.waitForTimeout(120);
    await p.screenshot({ path: `${SP}/v4-${w}-${arq}-catalogo.png`, fullPage: true });
    const r = await verificar(p, `[${w}] ${arq} catálogo`);
    const vs = r.precos.map(valor);
    for (let k = 1; k < vs.length; k++) if (vs[k] < vs[k - 1]) { problemas.push(`[${w}] ${arq}: fora de ordem ${r.precos[k - 1]} → ${r.precos[k]}`); break; }
    if (arq === 'motos') {
      await p.locator('.veu').getByRole('radio', { name: 'Motos' }).click();
      await p.locator('.veu').getByRole('button', { name: /Mais barato primeiro/ }).click();
      await p.waitForTimeout(100);
      await p.screenshot({ path: `${SP}/v4-${w}-${arq}-filtro.png` });
      await verificar(p, `[${w}] ${arq} filtro`);
      await p.locator('.veu .catalogo-veiculos .oferta').first().click();
      await p.waitForTimeout(100);
      await p.screenshot({ path: `${SP}/v4-${w}-${arq}-detalhe.png` });
      await verificar(p, `[${w}] ${arq} detalhe`);
    }
    await p.keyboard.press('Escape');
    await p.waitForTimeout(100);
  }
  await ctx.close();
}
await b.close();
console.log(problemas.length ? problemas.join('\n') : 'sem problemas');
