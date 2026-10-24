// Auditoria visual do REWORK 11.5 (QA; o roteiro é o do REWORK 11, com as cenas novas):\n// as carreiras especiais (campo, galeria, prancheta, set, palco, plenário), o dossiê do Submundo, o convite do casamento,\n// o ano com duas decisões — e saves do REWORK 11 abertos pelo jogo novo. Antes (REWORK 11): o atleta sem clube, a ficha esportiva com temporadas em países diferentes e os
// "Momentos da carreira", a comissão técnica, as portas (mudança de carreira / por conta própria), o ator, o político
// em mandato, o noivado com o planejamento do casamento, o ex, as redes em passos (histórico, conta suspensa), a agenda
// do músico com calopsita e do auxiliar técnico, as lojas da criança (instrumentos, bicicletas, esportes) e os milhões
// em euro — nas QUATRO paletas, em 1440 e 390 px (e 360 e 390×560 nas cenas marcadas com *), com a geometria e o
// contraste do 10.6 e, agora, os alvos de toque < 44 px a 390.
//   npm run build && npx vite preview --port 4173 &
//   SP=<pasta com saves/ de gerarRework11.ts> TAG=depois node scripts/playtest/rework11.mjs
//   (TEMAS=claro,horizonte,escuro,atlantico · CENAS=trabalho-sem-clube · URL=)
// Passos novos: 'ver:<css>' rola até o primeiro elemento visível (a captura da janela mostra aquele trecho);
// cada captura sai também em página inteira (-inteira.png). Medidas por captura em medidas.jsonl (gravado a cada uma).
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, appendFileSync, mkdirSync } from 'node:fs';
const SP = process.env.SP ?? `${process.env.HOME}/vida-trabalho/qa115`;
const URL = process.env.URL ?? 'http://localhost:4173/';
const TAG = process.env.TAG ?? 'depois';
const OUT = `${SP}/${TAG}`;
mkdirSync(OUT, { recursive: true });
const TEMAS = (process.env.TEMAS ?? 'claro,horizonte,escuro,atlantico').split(',');
const save = n => readFileSync(`${SP}/saves/vida-${n}.json`, 'utf8');
// [nome, save, área, ...passos]; nome terminado em '*' = também 360 e 390×560.
const TODAS = [
  ['campo-goleiro*', 'r115-goleiro', 'Caminhos', 'div:Trabalho'],
  ['galeria-goleiro*', 'r115-goleiro', 'Caminhos', 'div:Trabalho', 'aba:Minha carreira', 'ver:.galeria'],
  ['prancheta-tecnico*', 'r115-tecnico', 'Caminhos', 'div:Trabalho', 'ver:.carreira-especial--prancheta'],
  ['set-ator', 'r11-ator', 'Caminhos', 'div:Trabalho', 'ver:.carreira-especial--set'],
  ['palco-musico*', 'r11-musico-pet', 'Caminhos', 'div:Trabalho', 'ver:.carreira-especial--palco'],
  ['plenario-politico*', 'r115-politico', 'Caminhos', 'div:Vida pública', 'ver:.carreira-especial--plenario'],
  ['dossie-submundo*', 'r115-submundo', 'Caminhos', 'div:Submundo', 'ver:.dossie'],
  ['dossie-acoes*', 'r115-submundo', 'Caminhos', 'div:Submundo', 'ver:.sub-ramo'],
  ['convite-noiva*', 'r11-noiva', 'Pessoas', 'clique:.cartao-pessoa:has-text("Otávio")', 'ver:.convite'],
  ['momento-fila*', 'r115-fila', 'História'],
  ['trabalho-ator-antigo', 'r11-ator', 'Caminhos', 'div:Trabalho'],
  ['agenda-auxiliar*', 'r11-auxiliar', 'Minha Semana']
].map(([n, ...r]) => [n.replace('*', ''), n.endsWith('*'), ...r]);
const so = process.env.CENAS?.split(',');
const cenas = so ? TODAS.filter(c => so.includes(c[0])) : TODAS;
const MEDIDAS = `${OUT}/medidas-${TEMAS.join('_')}.jsonl`;

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


/** Roda NA PÁGINA: textos visíveis com contraste abaixo de 3:1 contra o fundo efetivo (o primeiro ancestral com cor de
 *  fundo opaca; color-mix já vem resolvido em rgb pelo navegador). Aproximação: ignora imagens e gradientes de fundo. */
function contrasteBaixo() {
  // rgb(), rgba() e oklab() (o que color-mix devolve), sempre para rgb 0..255.
  const rgb = c => {
    const ok = c.match(/oklab\(([^)]+)\)/);
    if (ok) {
      const v = ok[1].split(/[ ,\/]+/).filter(Boolean).map(Number); const [L, A, B] = v; const a = v[3] ?? 1;
      const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3, m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3, s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
      const lin = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
      const enc = x => 255 * Math.min(1, Math.max(0, x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055));
      return { r: enc(lin[0]), g: enc(lin[1]), b: enc(lin[2]), a };
    }
    const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { r: v[0], g: v[1], b: v[2], a: v[3] ?? 1 };
  };
  const lin = x => { x /= 255; return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; };
  const lum = c => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
  const misturar = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
  const fundo = el => { const camadas = []; for (let a = el; a; a = a.parentElement) { const c = rgb(getComputedStyle(a).backgroundColor); if (c && c.a > 0) { camadas.push(c); if (c.a >= 0.99) break; } } let bg = { r: 255, g: 255, b: 255, a: 1 }; for (const c of camadas.reverse()) bg = misturar(c, bg); return bg; };
  const out = [];
  const raiz = document.querySelector('main') ?? document.body;
  const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
  const vistos = new Set();
  while (w.nextNode()) {
    const n = w.currentNode; const el = n.parentElement;
    if (!el || vistos.has(el) || !n.textContent.trim() || el.closest('svg, .sr-only, [aria-hidden=true]')) continue;
    vistos.add(el);
    if (el.checkVisibility && !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
    const cs = getComputedStyle(el);
    let fg = rgb(cs.color); if (!fg) continue;
    let op = 1; for (let a = el; a; a = a.parentElement) op *= Number(getComputedStyle(a).opacity);
    if (op < 0.95 || el.closest('[disabled], :disabled')) continue; // o esmaecido de propósito (o bloqueado, o fora de alcance)
    const bg = fundo(el); fg = misturar(fg, bg);
    const [x, y] = [lum(fg), lum(bg)].sort((p, q) => q - p);
    const r = (x + 0.05) / (y + 0.05);
    if (r < 3) out.push(`${r.toFixed(2)} "${n.textContent.trim().slice(0, 24)}" (${el.className || el.tagName})`);
  }
  return out.slice(0, 6);
}

const b = await chromium.launch();
const problemas = [];
const notas = [];
for (const [nome, extra, sv, area, ...passos] of cenas) {
  const rodadas = [];
  for (const tema of TEMAS) for (const w of extra ? [1440, 390, 360] : [1440, 390]) rodadas.push([tema, w, w < 800 ? 800 : 900]);
  if (extra) for (const tema of TEMAS) rodadas.push([tema, 390, 560]);
  for (const [tema, w, h] of rodadas) {
    const m = { cena: nome, tema, w, h, sobrepostos: [], rolagemX: false, estouram: [], contraste: [], alvos44: [], erros: [], faltou: [] };
    const n0 = problemas.length, k0 = notas.length;
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, colorScheme: 'light' });
    const p = await ctx.newPage();
    const rot = `${nome} ${tema} ${w}x${h}`;
    p.on('pageerror', e => problemas.push(`${rot}: ${e.message}`));
    p.on('console', m => { if (m.type() === 'error') problemas.push(`${rot}: console: ${m.text()}`); });
    await p.goto(URL);
    await p.evaluate(([s, t, nv]) => { localStorage.clear(); localStorage.setItem('VIDA_APARENCIA', t); localStorage.setItem('VIDA_NOVIDADES_VISTAS', nv); if (s) localStorage.setItem('VIDA_GAME_SAVE_V1', s); }, [sv ? save(sv) : null, tema, '11.5']);
    await p.goto(URL);
    await p.waitForTimeout(300);
    if (area === 'novidades') {
      // As notas abrem sozinhas, já na tela inicial, para quem jogava a versão anterior.
      await p.getByRole('dialog', { name: 'Novidades da atualização' }).waitFor({ timeout: 10000 });
      await p.waitForTimeout(300);
    } else if (area === 'fim') {
      await p.getByRole('button', { name: /legado|Continuar/ }).first().click();
      await p.waitForTimeout(500);
    } else if (area === 'criacao') {
      await p.getByRole('button', { name: /Nascer de novo/ }).click();
      await p.waitForTimeout(400);
      for (const passo of passos) if (passo.startsWith('radio:')) { const t = p.getByRole('radio', { name: passo.slice(6), exact: true }).first(); if (await t.count()) { await t.click(); await p.waitForTimeout(300); } }
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
        } else if (passo.startsWith('pessoa:')) {
          const r = p.locator('.figurinha', { hasText: passo.slice(7) }).first(); if (await r.count()) { await r.click(); await p.waitForTimeout(400); } else notas.push(`${rot}: sem pessoa ${passo}`);
        } else if (passo.startsWith('cat:')) {
          const r = p.locator('.ficha__categoria summary', { hasText: passo.slice(4) }).first(); if (await r.count()) { await r.click(); await p.waitForTimeout(250); } else notas.push(`${rot}: sem categoria ${passo}`);
        } else if (passo.startsWith('busca:')) {
          const r = p.locator('.onde-fica__busca input').first(); if (await r.count()) { await r.fill(passo.slice(6)); await p.waitForTimeout(250); } else notas.push(`${rot}: sem busca`);
        } else if (passo.startsWith('ver:')) {
          const r = p.locator(passo.slice(4)).locator('visible=true').first(); if (await r.count()) { await r.evaluate(x => x.scrollIntoView({ block: 'start' })); await p.waitForTimeout(250); } else notas.push(`${rot}: sem ${passo}`);
        } else if (passo.startsWith('clique:')) {
          const r = p.locator(passo.slice(7)).locator('visible=true').first(); if (await r.count()) { await r.click(); await p.waitForTimeout(400); } else notas.push(`${rot}: sem ${passo}`);
        } else if (passo.startsWith('div:')) {
          const t = p.locator('.divisoes-caminhos__item', { hasText: passo.slice(4) }).first(); if (await t.count()) { await t.click(); await p.waitForTimeout(300); } else notas.push(`${rot}: sem divisão ${passo}`);
        } else if (passo === 'vaga' || passo === 'vagas') {
          const vs = p.locator('.vaga-resumo'); const n = Math.min(passo === 'vaga' ? 1 : 4, await vs.count());
          for (let k = 0; k < n; k++) { await vs.nth(k).click(); await p.waitForTimeout(150); }
          if (!n) notas.push(`${rot}: sem vaga`);
        } else if (passo.startsWith('atributo:')) {
          const s = p.locator(`[data-atributo="${passo.slice(9)}"] summary`).first(); if (await s.count()) { const aberto = await s.evaluate(x => x.parentElement.open); if (!aberto) await s.click(); await p.waitForTimeout(200); } else notas.push(`${rot}: sem ${passo}`);
        } else if (passo.startsWith('radio:')) {
          const t = p.getByRole('radio', { name: passo.slice(6), exact: true }).first(); if (await t.count()) { await t.click(); await p.waitForTimeout(300); } else notas.push(`${rot}: sem pasta ${passo}`);
        } else if (passo.startsWith('aba:') || passo.startsWith('secao:')) {
          const nomeAba = passo.slice(passo.indexOf(':') + 1);
          // (no build da base, "Patrimônio" ainda se chamava "Pertences")
          // REWORK 10.6 · A2: a aba pode trazer um contador ("Saúde 1"): o nome é o começo, e o número é opcional.
          const comContador = new RegExp(`^${nomeAba.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s+\\d+)?$`);
          let t = p.getByRole('tab', { name: comContador }).first();
          if (!(await t.count()) && nomeAba === 'Patrimônio') t = p.getByRole('tab', { name: 'Pertences', exact: true }).first();
          if (await t.count()) { await t.click(); await p.waitForTimeout(300); } else notas.push(`${rot}: sem aba ${nomeAba}`);
        }
      }
    }
    if (await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)) problemas.push(`${rot}: rolagem horizontal`);
    const estouram = await p.evaluate(() => {
      // um ancestral que recorta (overflow ≠ visible) e cabe na tela esconde o excesso: não estoura
      const recortado = x => { for (let a = x.parentElement; a; a = a.parentElement) { const cs = getComputedStyle(a); if (cs.overflowX !== 'visible' && a.getBoundingClientRect().right <= document.documentElement.clientWidth + 1) return true; } return false; };
      return [...document.querySelectorAll('main *, .folha *')].filter(x => { const r = x.getBoundingClientRect(); return r.width > 0 && r.right > document.documentElement.clientWidth + 1 && getComputedStyle(x).position !== 'fixed' && !x.closest('[data-rola-x], .palmares__historico-rolagem, .subnav, .abas-tempo, .abas-locais__lista') && !recortado(x); }).slice(0, 4).map(x => `${x.tagName.toLowerCase()}.${[...x.classList].join('.')}`); });
    m.rolagemX = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    m.estouram = estouram;
    if (estouram.length) problemas.push(`${rot}: estouram a borda: ${estouram.join(', ')}`);
    if (w >= 1440 || w === 390) { const cb = await p.evaluate(contrasteBaixo); m.contraste = cb; if (cb.length) problemas.push(`${rot}: contraste < 3: ${cb.join(' | ')}`); }
    const sob = await p.evaluate(sobreposicoes);
    m.sobrepostos = sob;
    if (sob.length) problemas.push(`${rot}: texto sobre texto: ${sob.join(' | ')}`);
    if (sv && area !== 'fim' && area !== 'criacao' && area !== 'novidades' && !passos.includes('menu') && !(await p.locator('.folha').count())) {
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
    if (w <= 390) m.alvos44 = await p.evaluate(() => {
      // alvos de toque menores que 44 px (altura ou largura) visíveis na janela; o texto do alvo ajuda a achar
      const out = [];
      for (const x of document.querySelectorAll('button, a[href], [role=tab], [role=radio], input:not([type=hidden]), select, summary')) {
        const r = x.getBoundingClientRect();
        if (!r.width || !r.height || x.closest('.sr-only') || (x.checkVisibility && !x.checkVisibility({ visibilityProperty: true, opacityProperty: true }))) continue;
        if (x.tagName === 'INPUT' && (x.type === 'radio' || x.type === 'checkbox') && x.closest('label')) { const l = x.closest('label').getBoundingClientRect(); if (l.height >= 44) continue; }
        if (r.height < 44 || r.width < 44) out.push(`${x.tagName.toLowerCase()}.${[...x.classList].join('.')} ${Math.round(r.width)}×${Math.round(r.height)} "${(x.textContent || x.getAttribute('aria-label') || '').trim().slice(0, 22)}"`);
      }
      return out;
    });
    m.erros = problemas.slice(n0).filter(x => /pageerror|console|avançar/.test(x) || !/contraste|texto sobre|estouram|rolagem/.test(x));
    m.faltou = notas.slice(k0).filter(x => !/alvos < 32/.test(x));
    appendFileSync(MEDIDAS, JSON.stringify(m) + '\n');
    const arq = `${OUT}/${nome}-${tema}-${w}${h < 700 ? 'b' : ''}`;
    await p.screenshot({ path: `${arq}.png` });
    if (h >= 700) await p.screenshot({ path: `${arq}-inteira.png`, fullPage: true });
    await ctx.close();
  }
}
await b.close();
writeFileSync(`${OUT}/relatorio-${TEMAS.join('_')}.json`, JSON.stringify({ problemas, notas }, null, 2));
console.log(JSON.stringify({ total: problemas.length, problemas: problemas.slice(0, 120), notas: notas.slice(0, 60) }, null, 2));
