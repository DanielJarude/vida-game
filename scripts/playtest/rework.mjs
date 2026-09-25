// Playtest visual do rework (sistema visual + Trabalho + política).
//   npx esbuild scripts/playtest/gerarRework.ts --bundle --platform=node --outfile=/tmp/gr.cjs && SP=/tmp/vida-rework node /tmp/gr.cjs
//   npm run build && npx vite preview --port 4173 &
//   SP=/tmp/vida-rework node scripts/playtest/rework.mjs
// Para cada cenário e largura (320/390/820/1440), abre cada área e reporta:
// rolagem horizontal, botão fora da tela, alvo de toque < 40px de altura,
// botão sem nome, "Viver mais um ano" cobrindo o fim do conteúdo, quantos
// botões a tela expõe. Grava capturas; e, para alguns cenários, capturas em
// escala de cinza e com daltonismo simulado (CDP), para inspeção.
import { chromium } from 'playwright';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';

const SP = process.env.SP ?? '/tmp/vida-rework';
const OUT = process.env.OUT ?? SP;
const URL = process.env.URL ?? 'http://localhost:4173/';
const CENARIOS = (process.env.CEN ?? 'empregada,professora,negocio,autonomo,informal,rural,atleta,militar,candidata,vereadora,procurando,crianca,adolescente,preso,aposentada').split(',');
const LARGURAS = (process.env.LARGURAS ?? '320,390,820,1440').split(',').map(Number);
const ABAS = ['Linha da Vida', 'Você', 'Pessoas', 'Trabalho', 'Rumo', 'Casa', 'Tempo livre'];
const CURTO = { 'Linha da Vida': 'Vida', 'Tempo livre': 'Tempo' };
const b = await chromium.launch();
const problemas = [];
const medidas = [];

async function abrir(save, w) {
  const ctx = await b.newContext({ viewport: { width: w, height: w < 800 ? 844 : 900 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  p.on('pageerror', e => problemas.push(`[${w}] erro de página: ${e.message}`));
  p.on('console', m => { if (m.type() === 'error') problemas.push(`[${w}] console: ${m.text()}`); });
  await p.goto(URL);
  await p.evaluate(s => { localStorage.clear(); localStorage.setItem('VIDA_GAME_SAVE_V1', s); }, save);
  await p.goto(URL);
  await p.getByRole('button', { name: /Continuar a vida/ }).click();
  await p.waitForTimeout(150);
  return { p, ctx };
}

async function irPara(p, aba) {
  let bt = p.getByRole('button', { name: aba, exact: true }).locator('visible=true').first();
  if (!(await bt.count())) bt = p.locator('.barra__item', { hasText: CURTO[aba] ?? aba }).first();
  if (!(await bt.count())) return false;
  await bt.click();
  await p.waitForTimeout(150);
  await p.evaluate(() => window.scrollTo(0, 0));
  return true;
}

async function verificar(p, rotulo) {
  const r = await p.evaluate(() => {
    const larg = document.documentElement.clientWidth;
    const alto = window.innerHeight;
    const rolagem = document.documentElement.scrollWidth > larg + 1;
    const raiz = document.querySelector('.veu .folha') ?? document.querySelector('main');
    const visiveis = [...raiz.querySelectorAll('button, a, input, select')].filter(el => el.getBoundingClientRect().width > 0);
    const fora = visiveis.filter(el => { const q = el.getBoundingClientRect(); return q.right > larg + 1 || q.left < -1; }).map(el => (el.textContent || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 40));
    const semNome = visiveis.filter(el => !(el.textContent || '').trim() && !el.getAttribute('aria-label') && el.tagName !== 'INPUT' && el.tagName !== 'SELECT').length;
    const pequenos = visiveis.filter(el => { const q = el.getBoundingClientRect(); return q.height < 40 && el.tagName === 'BUTTON' && !el.classList.contains('amostra'); }).map(el => (el.textContent || '').trim().slice(0, 30));
    const cortados = [...raiz.querySelectorAll('dd, .balanca__valor, .legenda__valor, .valor-grande, .folio__titulo, .medidor-vivo__palavra')].filter(el => el.getBoundingClientRect().width > 0 && el.scrollWidth > el.clientWidth + 1).map(el => el.textContent.trim().slice(0, 24));
    const cta = document.querySelector('.avancar__botao')?.getBoundingClientRect();
    window.scrollTo(0, document.body.scrollHeight);
    const ultimo = [...document.querySelectorAll('main section, main li, main p, main article, main .secao')].filter(e => e.getBoundingClientRect().height > 0).pop()?.getBoundingClientRect();
    const cobre = !!(cta && ultimo && !document.querySelector('.veu') && ultimo.bottom > cta.top + 2 && ultimo.top < alto);
    const botoes = visiveis.filter(el => el.tagName === 'BUTTON').length;
    const desabilitados = visiveis.filter(el => el.tagName === 'BUTTON' && el.disabled).length;
    window.scrollTo(0, 0);
    return { rolagem, fora, cobre, semNome, pequenos, botoes, desabilitados, cortados, altura: raiz.getBoundingClientRect().height };
  });
  if (r.rolagem) problemas.push(`${rotulo}: rolagem horizontal`);
  if (r.fora.length) problemas.push(`${rotulo}: fora da tela → ${r.fora.join(' | ')}`);
  if (r.cobre) problemas.push(`${rotulo}: "Viver mais um ano" cobre o fim do conteúdo`);
  if (r.semNome) problemas.push(`${rotulo}: ${r.semNome} botão(ões) sem nome acessível`);
  if (r.pequenos.length) problemas.push(`${rotulo}: botões baixos (<40px): ${r.pequenos.slice(0, 4).join(' | ')}`);
  if (r.cortados.length) problemas.push(`${rotulo}: textos cortados: ${r.cortados.slice(0, 4).join(' | ')}`);
  medidas.push(`${rotulo}: ${r.botoes} botões (${r.desabilitados} desabilitados), ${Math.round(r.altura)}px`);
}

for (const c of CENARIOS) {
  const arq = `${SP}/save-${c}.json`;
  if (!existsSync(arq)) { problemas.push(`sem save: ${c}`); continue; }
  const save = readFileSync(arq, 'utf8');
  for (const w of LARGURAS) {
    const { p, ctx } = await abrir(save, w);
    for (const a of ABAS) {
      if (!(await irPara(p, a))) continue;
      await verificar(p, `${c} ${w} ${a}`);
      if (w === 390 || w === 1440) await p.screenshot({ path: `${OUT}/${c}-${w}-${a.replace(/ /g, '_')}.png`, fullPage: false });
    }
    // Trabalho aberto por inteiro no celular (a tela que mais mudou).
    if (w === 390 && await irPara(p, 'Trabalho')) {
      const outras = p.getByRole('button', { name: /Outras possibilidades/ });
      if (await outras.count()) { await outras.first().click(); await p.waitForTimeout(80); await verificar(p, `${c} ${w} Trabalho (outras abertas)`); }
      await p.screenshot({ path: `${OUT}/${c}-${w}-Trabalho-inteiro.png`, fullPage: true });
    }
    await ctx.close();
  }
}

// Cor não pode ser o único sinal: escala de cinza e daltonismo simulado.
for (const c of (process.env.CORES ?? 'negocio,vereadora,empregada').split(',')) {
  const arq = `${SP}/save-${c}.json`;
  if (!existsSync(arq)) continue;
  for (const tipo of ['achromatopsia', 'deuteranopia', 'protanopia', 'tritanopia']) {
    const { p, ctx } = await abrir(readFileSync(arq, 'utf8'), 1440);
    const cdp = await ctx.newCDPSession(p);
    await cdp.send('Emulation.setEmulatedVisionDeficiency', { type: tipo });
    for (const a of ['Trabalho', 'Tempo livre', 'Você']) { await irPara(p, a); await p.screenshot({ path: `${OUT}/${c}-${tipo}-${a.replace(/ /g, '_')}.png` }); }
    await ctx.close();
  }
}

await b.close();
writeFileSync(`${OUT}/medidas.txt`, medidas.join('\n'));
console.log(problemas.length ? `${problemas.length} problema(s):\n- ${problemas.join('\n- ')}` : 'Nenhum problema estrutural.');
console.log(`(${medidas.length} telas medidas; medidas em ${OUT}/medidas.txt)`);
