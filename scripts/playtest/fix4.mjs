// Playtest visual do FIX #4: os cenários de `gerarFix4.ts` (luto na rede, dono de
// negócio, investidor, eleição explicada, troca de partido, curso integral,
// moto e bicicleta, as moradias, meia-idade, a tela de morte), com as mesmas
// verificações do rework, mais lojas e catálogo completo de veículos.
//   npx esbuild scripts/playtest/gerarFix4.ts --bundle --platform=node --outfile=/tmp/g4.cjs && SP=/tmp/vida-fix4 node /tmp/g4.cjs
//   npm run build && npx vite preview --port 4173 &
//   SP=/tmp/vida-fix4 node scripts/playtest/fix4.mjs
// Para cada cenário e largura (320/390/820/1440), abre cada área e reporta:
// rolagem horizontal, botão fora da tela, alvo de toque < 40px de altura,
// botão sem nome, "Viver mais um ano" cobrindo o fim do conteúdo, quantos
// botões a tela expõe. Grava capturas; e, para alguns cenários, capturas em
// escala de cinza e com daltonismo simulado (CDP), para inspeção.
import { chromium } from 'playwright';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';

const SP = process.env.SP ?? '/tmp/vida-fix4';
const OUT = process.env.OUT ?? SP;
const URL = process.env.URL ?? 'http://localhost:4173/';
const CENARIOS = (process.env.CEN ?? 'luto,luto-casal,salao,dono-horas,investidor,derrota,troca-partido,curso-integral,moto,bicicleta,casa-kitnet,casa-apto3,casa-alto,casa-simples,casa-sitio,casa-republica,meia-idade,morto').split(',');
const LARGURAS = (process.env.LARGURAS ?? '320,390,820,1440').split(',').map(Number);
const ABAS = ['Linha da Vida', 'Você', 'Pessoas', 'Trabalho', 'Estudos', 'Casa', 'Tempo livre', 'Cidade'];
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

/** A tela de morte: mede e fotografa inteira. */
async function fim(p, rotulo) {
  const r = await p.evaluate(() => ({ rolagem: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1, marcas: document.querySelectorAll('.fim__marcas li').length }));
  if (r.rolagem) problemas.push(`${rotulo}: rolagem horizontal`);
  if (!r.marcas) problemas.push(`${rotulo}: sem "O que marcou esta vida"`);
}

/** Lojas de veículos: concessionária, usados, motos e bicicletas; catálogo completo em ordem de preço. */
async function lojas(p, w, c) {
  if (!(await irPara(p, 'Cidade'))) return;
  const valor = t => { const n = parseFloat(t.replace(/[^\d,]/g, '').replace(',', '.')); return /mi/.test(t) ? n * 1e6 : /mil/.test(t) ? n * 1e3 : n; };
  for (const [nome, arq] of [['Concessionária', 'conc'], ['Usados', 'usados'], ['Motos', 'motos']]) {
    const botao = p.locator('.lugar-botao', { hasText: nome });
    if (!(await botao.count())) { problemas.push(`${c} ${w}: sem a loja ${nome}`); continue; }
    await botao.first().click();
    await p.waitForTimeout(150);
    await verificar(p, `${c} ${w} Cidade: ${nome}`);
    await p.screenshot({ path: `${OUT}/${c}-${w}-loja-${arq}.png` });
    const cat = p.locator('.veu').getByRole('radio', { name: /Catálogo completo/ });
    if (await cat.count()) {
      await cat.click(); await p.waitForTimeout(120);
      await verificar(p, `${c} ${w} Cidade: ${nome} (catálogo completo)`);
      const precos = await p.$$eval('.veu .catalogo-veiculos .oferta__preco', els => els.map(e => e.textContent.trim()));
      const vs = precos.map(valor);
      for (let k = 1; k < vs.length; k++) if (vs[k] < vs[k - 1]) { problemas.push(`${c} ${w} ${nome}: catálogo fora de ordem (${precos[k - 1]} → ${precos[k]})`); break; }
      if (!precos.length) problemas.push(`${c} ${w} ${nome}: catálogo completo vazio`);
      await p.screenshot({ path: `${OUT}/${c}-${w}-catalogo-${arq}.png`, fullPage: true });
      if (arq === 'motos') {
        for (const filtro of ['Motos', 'Bicicletas']) {
          const f = p.locator('.veu').getByRole('radio', { name: filtro });
          if (await f.count()) { await f.click(); await p.waitForTimeout(100); await verificar(p, `${c} ${w} catálogo: ${filtro}`); await p.screenshot({ path: `${OUT}/${c}-${w}-catalogo-${filtro}.png` }); }
        }
      }
      // Uma oferta aberta: com um milhão aplicado e pouco na conta, a compra oferece tirar das aplicações.
      const oferta = p.locator('.veu .catalogo-veiculos .oferta').first();
      if (await oferta.count()) { await oferta.click(); await p.waitForTimeout(100); await verificar(p, `${c} ${w} ${nome}: oferta aberta`); await p.screenshot({ path: `${OUT}/${c}-${w}-oferta-${arq}.png` }); }
    }
    await p.keyboard.press('Escape');
    await p.waitForTimeout(100);
    if (await p.locator('.veu').count()) { await p.keyboard.press('Escape'); await p.waitForTimeout(100); }
  }
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
  let save = readFileSync(arq, 'utf8');
  for (const w of LARGURAS) {
    let { p, ctx } = await abrir(save, w);
    if (JSON.parse(save).morte) { await fim(p, `${c} ${w} fim`); await p.screenshot({ path: `${OUT}/${c}-${w}-fim.png`, fullPage: true }); await ctx.close(); continue; }
    // Uma decisão aberta (a pergunta do conflito): mede e fotografa a carta; depois segue sem ela.
    if (await p.locator('.veu .folha').count()) {
      await verificar(p, `${c} ${w} decisão aberta`);
      await p.screenshot({ path: `${OUT}/${c}-${w}-decisao.png`, fullPage: false });
      await ctx.close();
      const semMomento = JSON.parse(save); semMomento.momento = null; semMomento.caminhos.pendente = undefined;
      ({ p, ctx } = await abrir(JSON.stringify(semMomento), w));
    }
    for (const a of ABAS) {
      if (!(await irPara(p, a))) continue;
      await verificar(p, `${c} ${w} ${a}`);
      if (w === 390 || w === 1440) await p.screenshot({ path: `${OUT}/${c}-${w}-${a.replace(/ /g, '_')}.png`, fullPage: false });
    }
    if (c === 'investidor') await lojas(p, w, c);
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
for (const c of (process.env.CORES ?? 'salao,derrota,luto').split(',')) {
  const arq = `${SP}/save-${c}.json`;
  if (!existsSync(arq)) continue;
  for (const tipo of ['achromatopsia', 'deuteranopia', 'protanopia', 'tritanopia']) {
    const { p, ctx } = await abrir(readFileSync(arq, 'utf8'), 1440);
    const cdp = await ctx.newCDPSession(p);
    await cdp.send('Emulation.setEmulatedVisionDeficiency', { type: tipo });
    for (const a of ['Trabalho', 'Tempo livre', 'Pessoas', 'Casa']) { await irPara(p, a); await p.screenshot({ path: `${OUT}/${c}-${tipo}-${a.replace(/ /g, '_')}.png` }); }
    await ctx.close();
  }
}

await b.close();
writeFileSync(`${OUT}/medidas.txt`, medidas.join('\n'));
console.log(problemas.length ? `${problemas.length} problema(s):\n- ${problemas.join('\n- ')}` : 'Nenhum problema estrutural.');
console.log(`(${medidas.length} telas medidas; medidas em ${OUT}/medidas.txt)`);
