// Auditoria visual do REWORK 9 (a vida organizada): as seis áreas novas em telas REAIS do jogo, nas QUATRO paletas e
// em 1440, 820, 390 e 360 px (e 390×560), com a mesma medição de geometria do REWORK 6.5/7/7.5 (texto sobre texto,
// rolagem horizontal, bordas estouradas, o avançar à mão, alvos de toque).
//   npm run build && npx vite preview --port 4173 &
//   SP=<pasta com saves/ de gerarRework6/7/75/9.ts> TAG=depois node scripts/playtest/rework9.mjs
//   (TEMAS=claro,horizonte,escuro,atlantico · LARGURAS=390,1440 · CENAS=caminhos-empregado · ALTURA_BAIXA=0 · URL=)
// Passos: 'aba:Rótulo' clica numa aba de dentro (as partes de Caminhos, as abas de Minha Semana); 'secao:Viagens' troca
// a seção de Vida; 'rede:YouTube'; 'inicio' (celular); 'ficha'; 'pratica'; 'agenda'; 'viver'; 'menu'; 'tudo'; 'dia:Ter'.
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const SP = process.env.SP ?? '/tmp/vida-r9';
const URL = process.env.URL ?? 'http://localhost:4173/';
const TAG = process.env.TAG ?? 'depois';
const OUT = `${SP}/${TAG}`;
mkdirSync(OUT, { recursive: true });
const LARGURAS = (process.env.LARGURAS ?? '1440,820,390,360').split(',').map(Number);
const TEMAS = (process.env.TEMAS ?? 'claro,horizonte,escuro,atlantico').split(',');
const save = n => { for (const p of ['r9', 'r75', 'r7', 'r6']) { try { return readFileSync(`${SP}/saves/vida-${p}-${n}.json`, 'utf8'); } catch { /* o próximo */ } } throw new Error(`sem save ${n}`); };
const TODAS = [
  ['historia-infancia', 'infancia', 'História'],
  ['historia-viver', 'empregado', 'História', 'viver'],
  ['caminhos-crianca', 'crianca', 'Caminhos'],
  ['caminhos-adolescente', 'adolescente', 'Caminhos'],
  ['caminhos-empregado', 'empregado', 'Caminhos'],
  ['caminhos-empregado-dev', 'empregado', 'Caminhos', 'aba:Desenvolvimento'],
  ['caminhos-empregado-opo', 'empregado', 'Caminhos', 'aba:Oportunidades'],
  ['caminhos-empregado-hist', 'empregado', 'Caminhos', 'aba:Histórico'],
  ['caminhos-atleta', 'atleta', 'Caminhos'],
  ['caminhos-atleta-hist', 'atleta', 'Caminhos', 'aba:Histórico'],
  ['caminhos-presa', 'presa', 'Caminhos'],
  ['caminhos-japao', 'japao', 'Caminhos'],
  ['caminhos-desempregado', 'desempregado', 'Caminhos', 'aba:Oportunidades'],
  ['semana-varias', 'varias', 'Minha Semana'],
  ['semana-crianca', 'crianca', 'Minha Semana'],
  ['semana-jovem', 'jovem', 'Minha Semana'],
  ['celular-influencer', 'influencer', 'Minha Semana', 'aba:Celular'],
  ['celular-inicio', 'influencer', 'Minha Semana', 'aba:Celular', 'inicio'],
  ['viagens-empregado', 'empregado', 'Vida', 'secao:Viagens'],
  ['compras-adulto', 'empregado', 'Vida', 'secao:Compras'],
  ['casa-familia', 'familia', 'Vida', 'secao:Casa'],
  ['voce-jovem', 'jovem', 'Você'],
  ['pessoas-familia', 'familia', 'Pessoas'],
  ['ficha-amiga', 'amiga', 'Pessoas', 'ficha'],
  ['menu', 'empregado', 'História', 'menu'],
  ['pessoas-vida-deles', 'familia', 'Pessoas', 'aba:A vida deles'],
  ['pessoas-nossa', 'amiga', 'Pessoas', 'aba:Nossa história'],
  ['semana-agenda-bloco', 'varias', 'Minha Semana', 'bloco'],
  ['semana-adolescente', 'adolescente', 'Minha Semana'],
  ['caminhos-jovem-dev', 'jovem', 'Caminhos', 'aba:Desenvolvimento'],
  ['celular-perfil', 'influencer', 'Minha Semana', 'aba:Celular', 'aba:Perfil'],
  ['semana-conflito', 'conflito', 'Minha Semana'],
  ['semana-conflito-bloco', 'conflito', 'Minha Semana', 'bloco'],
  ['caminhos-faculdade', 'faculdade', 'Caminhos'],
  ['semana-faculdade', 'faculdade', 'Minha Semana'],
  ['celular-rede', 'rede', 'Minha Semana', 'aba:Celular'],
  ['caminhos-promovido-hist', 'promovido', 'Caminhos', 'aba:Histórico'],
  ['historia-conquistas', 'promovido', 'História', 'botao:Conquistas'],
  ['historia-trabalho', 'faculdade', 'História', 'botao:Trabalho'],
  ['voce-faculdade', 'faculdade', 'Você'],
  ['loja-imobiliaria', 'empregado', 'Vida', 'secao:Compras', 'loja']
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
      if (area !== 'História') {
        // a barra de baixo primeiro: no celular, "Pessoas" também é um filtro da História
        let bt = p.locator('.barra__item', { hasText: area === 'Minha Semana' ? 'Semana' : area }).locator('visible=true').first();
        if (!(await bt.count())) bt = p.getByRole('button', { name: area, exact: true }).locator('visible=true').first();
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
        } else if (passo.startsWith('botao:')) {
          const r = p.getByRole('button', { name: passo.slice(6), exact: true }).locator('visible=true').first(); if (await r.count()) { await r.click(); await p.waitForTimeout(300); } else notas.push(`${rot}: sem botão ${passo}`);
        } else if (passo === 'bloco') {
          const r = p.locator('.bloco-agenda--movel').locator('visible=true').first(); if (await r.count()) { await r.click(); await p.waitForTimeout(300); } else notas.push(`${rot}: sem bloco móvel`);
        } else if (passo.startsWith('dia:')) {
          const t = p.getByRole('tab', { name: new RegExp(`^${passo.slice(4)}`) }).locator('visible=true').first(); if (await t.count()) { await t.click(); await p.waitForTimeout(250); } else notas.push(`${rot}: sem dia ${passo}`);
        } else if (passo.startsWith('aba:') || passo.startsWith('secao:')) {
          const nomeAba = passo.slice(passo.indexOf(':') + 1);
          const t = p.getByRole('tab', { name: nomeAba, exact: true }).first(); if (await t.count()) { await t.click(); await p.waitForTimeout(300); } else notas.push(`${rot}: sem aba ${nomeAba}`);
        }
      }
    }
    if (await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)) problemas.push(`${rot}: rolagem horizontal`);
    const estouram = await p.evaluate(() => {
      // um ancestral que recorta (overflow ≠ visible) e cabe na tela esconde o excesso: não estoura
      const recortado = x => { for (let a = x.parentElement; a; a = a.parentElement) { const cs = getComputedStyle(a); if (cs.overflowX !== 'visible' && a.getBoundingClientRect().right <= document.documentElement.clientWidth + 1) return true; } return false; };
      return [...document.querySelectorAll('main *, .folha *')].filter(x => { const r = x.getBoundingClientRect(); return r.width > 0 && r.right > document.documentElement.clientWidth + 1 && getComputedStyle(x).position !== 'fixed' && !x.closest('[data-rola-x], .palmares__historico-rolagem, .subnav, .abas-tempo, .abas-locais__lista') && !recortado(x); }).slice(0, 4).map(x => `${x.tagName.toLowerCase()}.${[...x.classList].join('.')}`); });
    if (estouram.length) problemas.push(`${rot}: estouram a borda: ${estouram.join(', ')}`);
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
    if (process.env.INTEIRA && w === 390 && h >= 700) await p.screenshot({ path: `${arq}-inteira.png`, fullPage: true });
    await ctx.close();
  }
}
await b.close();
writeFileSync(`${OUT}/relatorio.json`, JSON.stringify({ problemas, notas }, null, 2));
console.log(JSON.stringify({ total: problemas.length, problemas: problemas.slice(0, 120), notas: notas.slice(0, 60) }, null, 2));
