// Playtest visual da ATT 3 (vida material).
//   npm run build && npx vite preview --port 4173 &
//   SP=/tmp/vida-mat node scripts/playtest/material.mjs      (depois de gerarMaterial)
// Fotografa "Casa e dinheiro" em 320/390/820/1440 px para cada cenário; abre
// os lugares (imobiliária para alugar e comprar, usados, banco, abrigo,
// oficina), uma oferta com as condições, a ficha do bicho; e reporta rolagem
// horizontal, botões fora da tela, CTA cobrindo conteúdo, botões sem nome,
// alvos de toque baixos, números cortados e quantos botões cada tela expõe.
import { chromium } from 'playwright';
import { readFileSync, existsSync } from 'node:fs';

const SP = process.env.SP ?? '/tmp/vida-mat';
const URL = process.env.URL ?? 'http://localhost:4173/';
const SO = process.env.SO ? process.env.SO.split(',') : null;
const LARGURAS = (process.env.LARGURAS ?? '320,390,820,1440').split(',').map(Number);
const b = await chromium.launch();
const problemas = [];
const medidas = [];

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
    const raiz = document.querySelector('.veu .folha') ?? document.querySelector('main');
    const visiveis = [...raiz.querySelectorAll('button, a, input, select')].filter(el => el.getBoundingClientRect().width > 0);
    const fora = visiveis.filter(el => { const b = el.getBoundingClientRect(); return b.right > larg + 1 || b.left < -1; }).map(el => (el.textContent || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 40));
    const semNome = visiveis.filter(el => !(el.textContent || '').trim() && !el.getAttribute('aria-label') && el.tagName !== 'INPUT').length;
    const pequenos = visiveis.filter(el => { const b = el.getBoundingClientRect(); return b.height < 32 && el.tagName !== 'INPUT'; }).map(el => (el.textContent || '').trim().slice(0, 30));
    // Números cortados: valores com overflow visível (conteúdo mais largo que a caixa).
    const cortados = [...raiz.querySelectorAll('dd, .balanca__valor, .oferta__preco, .legenda__valor, .balanco__bloco strong, .valor-grande')]
      .filter(el => el.getBoundingClientRect().width > 0 && el.scrollWidth > el.clientWidth + 1).map(el => el.textContent.trim().slice(0, 24));
    const cta = document.querySelector('.avancar__botao')?.getBoundingClientRect();
    window.scrollTo(0, document.body.scrollHeight);
    const ultimo = [...document.querySelectorAll('main .secao, main li, main p, main article')].filter(e => e.getBoundingClientRect().height > 0).pop()?.getBoundingClientRect();
    const cobre = !!(cta && ultimo && !document.querySelector('.veu') && ultimo.bottom > cta.top + 2 && ultimo.top < alto);
    const botoes = visiveis.filter(el => el.tagName === 'BUTTON').length;
    const altura = raiz.getBoundingClientRect().height;
    return { rolagem, fora, cobre, semNome, pequenos, botoes, altura, cortados };
  });
  if (r.rolagem) problemas.push(`${rotulo}: rolagem horizontal`);
  if (r.fora.length) problemas.push(`${rotulo}: fora da tela → ${r.fora.join(' | ')}`);
  if (r.cobre) problemas.push(`${rotulo}: "Viver mais um ano" cobre o fim do conteúdo`);
  if (r.semNome) problemas.push(`${rotulo}: ${r.semNome} botão(ões) sem nome acessível`);
  if (r.pequenos.length) problemas.push(`${rotulo}: alvos de toque baixos (<32px): ${r.pequenos.slice(0, 4).join(' | ')}`);
  if (r.cortados.length) problemas.push(`${rotulo}: números cortados: ${r.cortados.slice(0, 4).join(' | ')}`);
  medidas.push(`${rotulo}: ${r.botoes} botões, ${Math.round(r.altura)}px`);
}

async function aba(p, nome) {
  await p.getByRole('button', { name: nome }).locator('visible=true').first().click();
  await p.waitForTimeout(160);
  await p.evaluate(() => window.scrollTo(0, 0));
}

async function lugar(p, nome, tag, arquivo) {
  const botao = p.locator('.lugar-botao', { hasText: nome });
  if (!(await botao.count())) return false;
  await botao.first().click();
  await p.waitForTimeout(160);
  await p.screenshot({ path: `${SP}/${tag}-${arquivo}.png`, fullPage: false });
  await verificar(p, `${tag} ${arquivo}`);
  return true;
}

const CENAS = ['crianca', 'jovem-sem-renda', 'jovem-trabalhando', 'aluguel', 'casal', 'familia', 'financiamento', 'proprietaria', 'veiculo', 'oficina', 'investimentos', 'divida', 'pet', 'aposentada'];

for (const nome of CENAS) {
  if (SO && !SO.includes(nome)) continue;
  const arq = `${SP}/save-${nome}.json`;
  if (!existsSync(arq)) { problemas.push(`sem save ${nome}`); continue; }
  const save = readFileSync(arq, 'utf8');
  for (const w of LARGURAS) {
    const h = w <= 390 ? (w === 320 ? 640 : 844) : w === 820 ? 1180 : 900;
    const p = await abrir(save, w, h);
    const tag = `${nome}-${w}`;
    // Um momento aberto no save é fechado pela primeira opção livre.
    for (let k = 0; k < 3; k++) {
      const op = p.locator('.veu .opcao:not([disabled])');
      if (await op.count()) { await op.first().click(); await p.waitForTimeout(60); }
      const cont = p.getByRole('button', { name: /^Continuar$/ });
      if (await cont.count()) { await cont.first().click(); await p.waitForTimeout(60); }
    }
    await aba(p, /^Casa e dinheiro$|^Casa$/);
    await p.screenshot({ path: `${SP}/${tag}-casa.png`, fullPage: true });
    await verificar(p, `${tag} casa`);
    await p.screenshot({ path: `${SP}/${tag}-casa-topo.png`, fullPage: false });
    if (w === 390 || w === 1440 || (w === 320 && ['familia', 'investimentos', 'financiamento'].includes(nome))) {
      if (await lugar(p, 'Imobiliária', tag, 'imobiliaria')) {
        const oferta = p.locator('.veu .oferta').first();
        if (await oferta.count()) { await oferta.click(); await p.waitForTimeout(120); await p.screenshot({ path: `${SP}/${tag}-aluguel-detalhe.png` }); await verificar(p, `${tag} aluguel detalhe`); await p.getByRole('button', { name: /Voltar às ofertas/ }).click(); }
        const comprar = p.getByRole('radio', { name: 'Comprar' });
        if (await comprar.count()) {
          await comprar.click(); await p.waitForTimeout(120);
          await p.screenshot({ path: `${SP}/${tag}-compra.png` }); await verificar(p, `${tag} compra`);
          const o2 = p.locator('.veu .oferta').first();
          if (await o2.count()) { await o2.click(); await p.waitForTimeout(120); await p.screenshot({ path: `${SP}/${tag}-compra-detalhe.png`, fullPage: false }); await verificar(p, `${tag} compra detalhe`); }
        }
        await p.keyboard.press('Escape'); await p.waitForTimeout(80);
      }
      for (const [n, a] of [['Usados', 'usados'], ['Banco', 'banco'], ['Abrigo', 'abrigo'], ['Oficina', 'oficina']]) {
        if (await lugar(p, n, tag, a)) {
          if (a === 'banco') { const prod = p.locator('.veu .produto').first(); if (await prod.count()) { await prod.click(); await p.waitForTimeout(100); await p.screenshot({ path: `${SP}/${tag}-banco-produto.png` }); await verificar(p, `${tag} banco produto`); } }
          await p.keyboard.press('Escape'); await p.waitForTimeout(80);
        }
      }
      if (nome === 'pet') {
        await aba(p, /^Pessoas$/);
        const bicho = p.locator('main button', { hasText: /cachorr|gat/i }).first();
        const rosto = (await bicho.count()) ? bicho : p.locator('main .cartao-pessoa').last();
        if (await rosto.count()) { await rosto.click(); await p.waitForTimeout(140); await p.screenshot({ path: `${SP}/${tag}-ficha-pet.png` }); await verificar(p, `${tag} ficha pet`); await p.keyboard.press('Escape'); }
      }
    }
    await p.context().close();
  }
}

console.log('\n== PROBLEMAS ==');
console.log(problemas.length ? [...new Set(problemas)].join('\n') : 'nenhum');
console.log('\n== MEDIDAS ==');
console.log(medidas.join('\n'));
await b.close();
