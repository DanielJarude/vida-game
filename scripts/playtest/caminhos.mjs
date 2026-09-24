// Playtest visual dos caminhos (ATT 2).
//   npm run build && npx vite preview --port 4173 &
//   SP=/tmp/vida-caminhos node scripts/playtest/caminhos.mjs   (depois de gerarCaminhos)
// Fotografa Tempo livre e Estudo e trabalho em 320/390/820/1440 px, abre as
// portas e as seções recolhidas, e reporta rolagem horizontal, botões fora
// da tela, CTA cobrindo conteúdo, botões sem nome acessível e listas enormes.
import { chromium } from 'playwright';
import { readFileSync, existsSync } from 'node:fs';

const SP = process.env.SP ?? '/tmp/vida-caminhos';
const URL = process.env.URL ?? 'http://localhost:4173/';
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
  // Fecha qualquer decisão aberta na chegada.
  for (let k = 0; k < 3; k++) {
    const op = p.locator('.veu .opcao:not([disabled])');
    if (await op.count()) { await op.first().click(); await p.waitForTimeout(60); }
    const cont = p.getByRole('button', { name: /^Continuar$/ });
    if (await cont.count()) { await cont.first().click(); await p.waitForTimeout(60); }
  }
  return p;
}

async function verificar(p, rotulo) {
  const r = await p.evaluate(() => {
    const larg = document.documentElement.clientWidth;
    const alto = window.innerHeight;
    const rolagem = document.documentElement.scrollWidth > larg + 1;
    const visiveis = [...document.querySelectorAll('main button, main a, main input, main select')].filter(el => el.getBoundingClientRect().width > 0);
    const fora = visiveis.filter(el => { const b = el.getBoundingClientRect(); return b.right > larg + 1 || b.left < -1; }).map(el => (el.textContent || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 40));
    const semNome = visiveis.filter(el => !(el.textContent || '').trim() && !el.getAttribute('aria-label')).length;
    const pequenos = visiveis.filter(el => { const b = el.getBoundingClientRect(); return b.height < 32; }).map(el => (el.textContent || '').trim().slice(0, 30));
    const cta = document.querySelector('.avancar__botao')?.getBoundingClientRect();
    window.scrollTo(0, document.body.scrollHeight);
    const ultimo = [...document.querySelectorAll('main .secao, main li, main p')].filter(e => e.getBoundingClientRect().height > 0).pop()?.getBoundingClientRect();
    const cobre = !!(cta && ultimo && !document.querySelector('.veu') && ultimo.bottom > cta.top + 2 && ultimo.top < alto);
    const botoes = visiveis.filter(el => el.tagName === 'BUTTON').length;
    const altura = document.querySelector('main')?.getBoundingClientRect().height ?? 0;
    return { rolagem, fora, cobre, semNome, pequenos, botoes, altura };
  });
  if (r.rolagem) problemas.push(`${rotulo}: rolagem horizontal`);
  if (r.fora.length) problemas.push(`${rotulo}: fora da tela → ${r.fora.join(' | ')}`);
  if (r.cobre) problemas.push(`${rotulo}: botão "Viver mais um ano" cobre o fim do conteúdo`);
  if (r.semNome) problemas.push(`${rotulo}: ${r.semNome} botão(ões) sem nome acessível`);
  if (r.pequenos.length) problemas.push(`${rotulo}: alvos de toque baixos (<32px): ${r.pequenos.slice(0, 4).join(' | ')}`);
  medidas.push(`${rotulo}: ${r.botoes} botões visíveis, ${Math.round(r.altura)}px de altura`);
}

async function aba(p, nome) {
  await p.getByRole('button', { name: nome }).locator('visible=true').first().click();
  await p.waitForTimeout(120);
  await p.evaluate(() => window.scrollTo(0, 0));
}

for (const nome of ['crianca', 'adolescente', 'semana-cheia', 'meia-carreira', 'aposentada']) {
  const arq = `${SP}/save-${nome}.json`;
  if (!existsSync(arq)) { problemas.push(`sem save ${nome}`); continue; }
  const save = readFileSync(arq, 'utf8');
  for (const [w, h] of [[320, 640], [390, 844], [820, 1180], [1440, 900]]) {
    const p = await abrir(save, w, h);
    const tag = `${nome}-${w}`;
    await aba(p, /^Tempo livre$|^Tempo$/);
    await p.screenshot({ path: `${SP}/${tag}-tempo.png`, fullPage: true });
    await verificar(p, `${tag} tempo`);
    await aba(p, /^Estudo e trabalho$|^Rumo$/);
    // Abre as seções recolhidas para ver o conteúdo inteiro.
    for (const s of await p.locator('main .secao__titulo--botao[aria-expanded="false"]').all()) { await s.click().catch(() => {}); }
    await p.waitForTimeout(80);
    await p.screenshot({ path: `${SP}/${tag}-rumo.png`, fullPage: true });
    await verificar(p, `${tag} rumo`);
    if (nome === 'adolescente' && w === 390) {
      const porta = p.getByRole('button', { name: 'Ir à peneira' });
      if (await porta.count()) { await porta.first().click(); await p.waitForTimeout(100); await p.screenshot({ path: `${SP}/${tag}-peneira.png` }); }
    }
    if (w >= 1440) await p.screenshot({ path: `${SP}/${tag}-agora.png`, clip: { x: 1440 - 360, y: 60, width: 360, height: 700 } });
    await p.context().close();
  }
}
await b.close();
console.log(medidas.join('\n'));
console.log(problemas.length ? '\nPROBLEMAS\n' + problemas.join('\n') : '\nnenhum problema estrutural');
