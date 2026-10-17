// REWORK 8 (Fase B) — auditoria visual das ILUSTRAÇÕES nas telas reais do jogo (o build, os tokens, as quatro paletas,
// 1440, 820, 390 e 360 px — e 390×560): Compras com as fachadas e os objetos de verdade, as folhas das lojas (a
// concessionária, os usados, os instrumentos, o abrigo), Pertences, a Casa (a cena e o carro na porta), as lojas da
// Cidade, a ficha de uma pessoa com os presentes. A mesma medição de geometria do REWORK 6.5/7/7.5 (texto sobre texto,
// rolagem horizontal, bordas estouradas, o avançar à mão, alvos de toque) — mais a das ilustrações: todo desenho
// visível tem tamanho, não estoura a janela, e as fachadas cobrem a vitrine inteira.
//   npm run build && npx vite preview --port 4173 &
//   SP=<pasta com saves/ de gerarRework6/7/75.ts> TAG=fase-b node scripts/playtest/rework8/telasB.mjs
//   (TEMAS=claro,horizonte,escuro,atlantico · LARGURAS=390,1440 · CENAS=compras-rica · ALTURA_BAIXA=0 · INTEIRA=1 · URL=)
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const SP = process.env.SP ?? '/tmp/vida-r75';
const URL = process.env.URL ?? 'http://localhost:4173/';
const TAG = process.env.TAG ?? 'depois';
const OUT = `${SP}/${TAG}`;
mkdirSync(OUT, { recursive: true });
const LARGURAS = (process.env.LARGURAS ?? '1440,820,390,360').split(',').map(Number);
const TEMAS = (process.env.TEMAS ?? 'claro,horizonte,escuro,atlantico').split(',');
const save = n => { for (const p of ['r8', 'r75', 'r7', 'r6']) { try { return readFileSync(`${SP}/saves/vida-${p}-${n}.json`, 'utf8'); } catch { /* o próximo */ } } throw new Error(`sem save ${n}`); };
// [nome, save, área, passos...]  (um passo: 'aba:Rótulo' clica numa aba de dentro; 'pratica' abre a primeira prática;
// 'ficha' abre a primeira pessoa; 'secao:Compras' troca a seção de Vida; 'loja' abre a primeira loja; 'viver'; 'menu'; 'tudo')
const TODAS = [
  ['compras-adulto', 'empregado', 'Vida', 'secao:Compras'],
  ['compras-rica', 'rica', 'Vida', 'secao:Compras'],
  ['compras-jovem', 'jovem', 'Vida', 'secao:Compras'],
  ['loja-concessionaria', 'rica', 'Vida', 'secao:Compras', 'vitrine:Concessionária'],
  ['loja-usados', 'empregado', 'Vida', 'secao:Compras', 'vitrine:Carros usados'],
  ['loja-motos', 'jovem', 'Vida', 'secao:Compras', 'vitrine:Motos e bicicletas'],
  ['loja-instrumentos', 'empregado', 'Vida', 'secao:Compras', 'vitrine:Instrumentos'],
  ['loja-casa', 'familia', 'Vida', 'secao:Compras', 'vitrine:Casa'],
  ['loja-abrigo', 'familia', 'Vida', 'secao:Compras', 'vitrine:Abrigo'],
  ['pertences-posses', 'posses', 'Vida', 'secao:Pertences'],
  ['casa-posses', 'posses', 'Vida', 'secao:Casa'],
  ['loja-oficina', 'posses', 'Vida', 'secao:Compras', 'vitrine:Oficina'],
  ['pertences-jovem', 'jovem', 'Vida', 'secao:Pertences'],
  ['casa-familia', 'familia', 'Vida', 'secao:Casa'],
  ['casa-rica', 'rica', 'Vida', 'secao:Casa'],
  ['cidade-lojas', 'empregado', 'Vida', 'secao:Cidade', 'botao:Lojas da cidade'],
  ['presentes-amiga', 'amiga', 'Pessoas', 'ficha', 'botao:^Dar um presente'],
  ['pessoas-familia', 'familia', 'Pessoas']
];
const so = process.env.CENAS?.split(',');
const cenas = so ? TODAS.filter(c => so.includes(c[0])) : TODAS;

/** Roda NA PÁGINA: as linhas de texto visíveis que se cruzam (de elementos diferentes, nenhum dentro do outro). */
function sobreposicoes() {
  const raiz = document.querySelector('.folha') ?? document.body;
  const clipCache = new Map();
  const recorte = el => {
    if (clipCache.has(el)) return clipCache.get(el);
    let r = { l: -1e9, t: -1e9, r: 1e9, b: 1e9 };
    for (let a = el; a && a !== document.documentElement; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') {
        const q = a.getBoundingClientRect();
        r = { l: Math.max(r.l, q.left), t: Math.max(r.t, q.top), r: Math.min(r.r, q.right), b: Math.min(r.b, q.bottom) };
      }
    }
    clipCache.set(el, r);
    return r;
  };
  const visivel = el => {
    if (el.checkVisibility && !el.checkVisibility({ opacityProperty: true, visibilityProperty: true, contentVisibilityAuto: true })) return false;
    for (let a = el; a && a !== document.documentElement; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) return false;
      if (a.classList.contains('sr-only')) return false;
    }
    return true;
  };
  const fixoDe = el => { for (let a = el; a; a = a.parentElement) { const p = getComputedStyle(a).position; if (p === 'fixed' || p === 'sticky') return a; } return null; };
  const caixas = [];
  const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) {
    const n = w.currentNode;
    if (!n.textContent.trim()) continue;
    const el = n.parentElement;
    if (!el || el.closest('svg, option, select, textarea, input') || !visivel(el)) continue;
    const c = recorte(el);
    const rg = document.createRange(); rg.selectNodeContents(n);
    for (const q of rg.getClientRects()) {
      const l = Math.max(q.left, c.l), r = Math.min(q.right, c.r), t = Math.max(q.top, c.t), b = Math.min(q.bottom, c.b);
      if (r - l < 2 || b - t < 2) continue;
      caixas.push({ el, l, r, t, b, fixo: fixoDe(el), txt: n.textContent.trim().slice(0, 28) });
    }
  }
  caixas.sort((a, b) => a.t - b.t);
  const achados = [];
  for (let i = 0; i < caixas.length; i++) {
    const A = caixas[i];
    for (let j = i + 1; j < caixas.length && caixas[j].t < A.b; j++) {
      const B = caixas[j];
      if (A.el === B.el || A.el.contains(B.el) || B.el.contains(A.el)) continue;
      if (A.fixo !== B.fixo) continue; // o que é fixo/sticky passa por cima do que rola de propósito
      const ix = Math.min(A.r, B.r) - Math.max(A.l, B.l);
      const iy = Math.min(A.b, B.b) - Math.max(A.t, B.t);
      if (ix > 3 && iy > Math.min(A.b - A.t, B.b - B.t) * 0.3) achados.push(`"${A.txt}" × "${B.txt}"`);
    }
  }
  return [...new Set(achados)].slice(0, 6);
}

const b = await chromium.launch();
const contagem = {};
const problemas = [];
const notas = [];
const rodadas = [];
for (const tema of TEMAS) for (const w of LARGURAS) rodadas.push([tema, w, w < 800 ? 800 : 900]);
if (process.env.ALTURA_BAIXA !== '0') for (const tema of TEMAS) rodadas.push([tema, 390, 560]);
for (const [nome, sv, area, ...passos] of cenas) {
  for (const [tema, w, h] of rodadas) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, colorScheme: 'light' });
    const p = await ctx.newPage();
    const rot = `${nome} ${tema} ${w}x${h}`;
    p.on('pageerror', e => problemas.push(`${rot}: ${e.message}`));
    p.on('console', m => { if (m.type() === 'error') problemas.push(`${rot}: console: ${m.text()}`); });
    await p.goto(URL);
    await p.evaluate(([s, t]) => { localStorage.clear(); localStorage.setItem('VIDA_APARENCIA', t); if (s) localStorage.setItem('VIDA_GAME_SAVE_V1', s); }, [sv ? save(sv) : null, tema]);
    await p.goto(URL);
    await p.waitForTimeout(300);
    if (area === 'fim') {
      await p.getByRole('button', { name: /legado|Continuar/ }).first().click();
      await p.waitForTimeout(500);
    } else if (area === 'criacao') {
      await p.getByRole('button', { name: /Nascer de novo/ }).click();
      await p.waitForTimeout(400);
    } else {
      await p.getByRole('button', { name: /Continuar a vida/ }).click();
      await p.waitForTimeout(500);
      if (area !== 'Linha da Vida') {
        let bt = p.getByRole('button', { name: area, exact: true }).locator('visible=true').first();
        if (!(await bt.count())) bt = p.locator('.barra__item', { hasText: area === 'Tempo livre' ? 'Tempo' : area }).first();
        await bt.click();
        await p.waitForTimeout(350);
      }
      for (const passo of passos) {
        if (passo === 'viver') {
          await p.locator('.avancar__botao').click(); await p.waitForTimeout(500);
          for (let k = 0; k < 6; k++) { const o = p.locator('.momento .opcao:not([disabled])'); if (await o.count()) { await o.first().click(); await p.waitForTimeout(250); const c = p.getByRole('button', { name: /^(Continuar|Fechar)$/ }); if (await c.count()) { await c.first().click(); await p.waitForTimeout(150); } } else break; }
          await p.waitForTimeout(600);
        } else if (passo === 'tudo') {
          await p.getByRole('button', { name: /Só o que marcou|Mostrar tudo/ }).click(); await p.waitForTimeout(300);
        } else if (passo === 'menu') {
          await p.locator('.marca').click(); await p.waitForTimeout(300);
        } else if (passo === 'ficha') {
          const r = p.locator('.cartao-pessoa, .rosto, .pessoa').first(); if (await r.count()) { await r.click(); await p.waitForTimeout(350); } else notas.push(`${rot}: sem pessoa para abrir`);
        } else if (passo === 'pratica') {
          const r = p.locator('.pratica__abrir').first(); if (await r.count()) { await r.click(); await p.waitForTimeout(350); } else notas.push(`${rot}: sem prática para abrir`);
        } else if (passo === 'loja') {
          const r = p.locator('.vitrine__abrir, .lugar-botao:not([disabled])').first(); if (await r.count()) { await r.click(); await p.waitForTimeout(400); } else notas.push(`${rot}: sem loja para abrir`);
        } else if (passo === 'agenda') {
          const r = p.locator('.agenda__abrir').first(); if (await r.count()) { await r.click(); await p.waitForTimeout(350); } else notas.push(`${rot}: sem prática na agenda`);
        } else if (passo === 'inicio') {
          const r = p.locator('.celular__voltar').first(); if (await r.count()) { await r.click(); await p.waitForTimeout(300); } else notas.push(`${rot}: sem "Início" no celular`);
        } else if (passo === 'memoria' || passo === 'quemsefoi') {
          if (passo === 'quemsefoi') { const s = p.getByRole('button', { name: /Quem se foi/ }).first(); if (await s.count()) { await s.click(); await p.waitForTimeout(250); } }
          const r = p.locator('.pessoa--falecida').first(); if (await r.count()) { await r.click(); await p.waitForTimeout(350); } else notas.push(`${rot}: sem quem se foi para abrir`);
        } else if (passo.startsWith('rede:')) {
          const r = p.locator('.plataforma', { hasText: passo.slice(5) }).first(); if (await r.count()) { await r.click(); await p.waitForTimeout(300); } else notas.push(`${rot}: sem rede ${passo}`);
        } else if (passo.startsWith('vitrine:')) {
          const r = p.locator('.vitrine', { hasText: passo.slice(8) }).locator('.vitrine__abrir:not([disabled])').first(); if (await r.count()) { await r.click(); await p.waitForTimeout(450); } else notas.push(`${rot}: sem vitrine ${passo.slice(8)}`);
        } else if (passo.startsWith('botao:')) {
          const r = p.getByRole('button', { name: new RegExp(passo.slice(6)) }).first(); if (await r.count()) { await r.click(); await p.waitForTimeout(400); } else notas.push(`${rot}: sem botão ${passo.slice(6)}`);
        } else if (passo.startsWith('aba:') || passo.startsWith('secao:')) {
          const nomeAba = passo.slice(passo.indexOf(':') + 1);
          const t = p.getByRole('tab', { name: nomeAba, exact: true }).first(); if (await t.count()) { await t.click(); await p.waitForTimeout(300); } else notas.push(`${rot}: sem aba ${nomeAba}`);
        }
      }
    }
    if (await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)) problemas.push(`${rot}: rolagem horizontal`);
    const estouram = await p.evaluate(() => [...document.querySelectorAll('main *, .folha *')].filter(x => { const r = x.getBoundingClientRect(); return r.width > 0 && r.right > document.documentElement.clientWidth + 1 && getComputedStyle(x).position !== 'fixed' && !x.closest('[data-rola-x], .palmares__historico-rolagem, .subnav, .abas-tempo, .abas-locais__lista') && !(x.closest('svg') && x.tagName.toLowerCase() !== 'svg'); }).slice(0, 4).map(x => `${x.tagName.toLowerCase()}.${[...x.classList].join('.')}`));
    if (estouram.length) problemas.push(`${rot}: estouram a borda: ${estouram.join(', ')}`);
    // As ilustrações: todo desenho visível tem tamanho e cabe na janela; a fachada cobre a vitrine inteira.
    const ilus = await p.evaluate(() => {
      const out = []; let n = 0;
      for (const s of document.querySelectorAll('svg[data-nivel]')) {
        const r = s.getBoundingClientRect(); const cs = getComputedStyle(s);
        if (cs.display === 'none' || cs.visibility === 'hidden' || r.width === 0 && r.height === 0 && !s.closest('details:not([open])')) continue;
        n++;
        if (r.width < 8 || r.height < 6) out.push(`desenho minúsculo ${s.getAttribute('class')} ${Math.round(r.width)}x${Math.round(r.height)}`);
        if (r.right > document.documentElement.clientWidth + 1 && !s.closest('.vitrine__objetos, [data-rola-x]')) out.push(`desenho estoura ${s.getAttribute('class')}`);
      }
      for (const f of document.querySelectorAll('.vitrine__fachada')) {
        const v = f.parentElement.getBoundingClientRect(), r = f.getBoundingClientRect();
        if (Math.abs(r.width - v.width) > 1 || Math.abs(r.height - v.height) > 1) out.push(`fachada não cobre a vitrine (${f.getAttribute('data-lugar')})`);
      }
      return { n, out: [...new Set(out)].slice(0, 6) };
    });
    if (ilus.out.length) problemas.push(`${rot}: ilustrações: ${ilus.out.join(' | ')}`);
    contagem[nome] = Math.max(contagem[nome] ?? 0, ilus.n);
    const sob = await p.evaluate(sobreposicoes);
    if (sob.length) problemas.push(`${rot}: texto sobre texto: ${sob.join(' | ')}`);
    if (sv && area !== 'fim' && !passos.includes('menu') && !(await p.locator('.folha').count())) {
      const av = await p.evaluate(() => {
        const bt = document.querySelector('.avancar__botao'); if (!bt) return 'ausente';
        const r = bt.getBoundingClientRect(); const h = window.innerHeight;
        if (r.bottom <= 0 || r.top >= h) return 'fora da janela';
        const x = r.left + r.width / 2, y = r.top + r.height / 2;
        const topo = document.elementFromPoint(x, y);
        return topo && (topo === bt || bt.contains(topo)) ? 'ok' : `coberto por ${topo?.className}`;
      });
      if (av !== 'ok') problemas.push(`${rot}: avançar ${av}`);
    }
    const pequenos = await p.evaluate(() => [...document.querySelectorAll('button, a, [role=tab], input, select')].filter(x => { const r = x.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.height < 32 || r.width < 32) && getComputedStyle(x).visibility !== 'hidden' && !x.closest('.sr-only, label') && !x.classList.contains('sr-only'); }).map(x => `${x.tagName.toLowerCase()}.${[...x.classList].join('.')}`));
    if (pequenos.length) notas.push(`${rot}: alvos < 32px: ${[...new Set(pequenos)].slice(0, 4).join(', ')}`);
    const arq = `${OUT}/${nome}-${tema}-${w}${h < 700 ? 'b' : ''}`;
    await p.screenshot({ path: `${arq}.png` });
    if (process.env.INTEIRA && (w === 390 || w === 1440) && h >= 700) await p.screenshot({ path: `${arq}-inteira.png`, fullPage: true });
    await ctx.close();
  }
}
await b.close();
writeFileSync(`${OUT}/relatorio.json`, JSON.stringify({ problemas, notas, ilustracoesPorTela: contagem }, null, 2));
console.log(JSON.stringify({ ilustracoesPorTela: contagem, total: problemas.length, problemas: problemas.slice(0, 120), notas: notas.slice(0, 60) }, null, 2));
