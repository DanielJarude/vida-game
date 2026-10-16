// Capturas do REWORK 6 (identidade visual): as mesmas cenas antes e depois, em 1440, 820, 390 e 360 px.
// Confere em cada cena: rolagem horizontal, elementos estourando a borda, erros de console, o botão de avançar visível
// na janela (sem rolar) e não coberto pela barra de baixo, alvos de toque pequenos.
//   npm run build && npx vite preview --port 4173 &
//   SP=<pasta com os saves de gerarRework6.ts> TAG=depois node scripts/playtest/rework6.mjs
//   (LARGURAS=390,1440 restringe as larguras; CENAS=linha-longa,modal restringe as cenas)
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const SP = process.env.SP ?? '/tmp/vida-r6';
const URL = process.env.URL ?? 'http://localhost:4173/';
const TAG = process.env.TAG ?? 'depois';
const OUT = `${SP}/${TAG}`;
mkdirSync(OUT, { recursive: true });
const LARGURAS = (process.env.LARGURAS ?? '1440,820,390,360').split(',').map(Number);
// [nome, save, área, aba]
const TODAS = [
  ['nascimento', null, 'criacao'],
  ['bebe', 'bebe', 'Linha da Vida'],
  ['linha-curta', 'crianca', 'Linha da Vida'],
  ['linha-longa', 'idosa', 'Linha da Vida'],
  ['viver-ano', 'vivida', 'Linha da Vida', 'viver'],
  ['voce', 'vivida', 'Você'],
  ['voce-idosa', 'idosa', 'Você'],
  ['pessoas', 'vivida', 'Pessoas'],
  ['ficha', 'vivida', 'Pessoas', 'ficha'],
  ['formacao', 'jovem', 'Formação'],
  ['formacao-crianca', 'crianca', 'Formação'],
  ['trabalho', 'vivida', 'Trabalho'],
  ['atleta', 'atleta', 'Trabalho'],
  ['tempo', 'jovem', 'Tempo livre'],
  ['redes', 'rica', 'Tempo livre', 'Redes sociais'],
  ['compras', 'rica', 'Vida', 'Compras'],
  ['dinheiro', 'rica', 'Vida', 'Dinheiro'],
  ['casa', 'vivida', 'Vida', 'Casa'],
  ['prisao', 'presa', 'Trabalho'],
  ['modal', 'decisao', 'Linha da Vida'],
  ['inicio', 'vivida', 'inicio'],
  ['fim', 'morta', 'fim']
];
const so = process.env.CENAS?.split(',');
const cenas = so ? TODAS.filter(c => so.includes(c[0])) : TODAS;
const b = await chromium.launch();
const problemas = [];
const notas = [];
for (const [nome, save, area, aba] of cenas) {
  for (const w of LARGURAS) {
    const movel = w < 800;
    const ctx = await b.newContext({ viewport: { width: w, height: movel ? 800 : 900 }, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    const rot = `${nome} ${w}`;
    p.on('pageerror', e => problemas.push(`${rot}: ${e.message}`));
    p.on('console', m => { if (m.type() === 'error') problemas.push(`${rot}: console: ${m.text()}`); });
    await p.goto(URL);
    await p.evaluate(s => { localStorage.clear(); if (s) localStorage.setItem('VIDA_GAME_SAVE_V1', s); }, save ? readFileSync(`${SP}/saves/vida-r6-${save}.json`, 'utf8') : null);
    await p.goto(URL);
    await p.waitForTimeout(300);
    if (area === 'inicio') {
      // a tela inicial, com uma vida salva
    } else if (area === 'fim') {
      await p.getByRole('button', { name: /legado|Continuar/ }).first().click();
      await p.waitForTimeout(500);
    } else if (area === 'criacao') {
      await p.getByRole('button', { name: /Nascer de novo/ }).click();
      await p.waitForTimeout(400);
    } else {
      await p.getByRole('button', { name: /Continuar a vida/ }).click();
      await p.waitForTimeout(500);
      if (aba === 'viver') {
        const t0 = Date.now();
        await p.locator('.avancar__botao').click(); await p.waitForTimeout(500);
        for (let k = 0; k < 6; k++) { const o = p.locator('.momento .opcao:not([disabled])'); if (await o.count()) { await o.first().click(); await p.waitForTimeout(250); const c = p.getByRole('button', { name: /^(Continuar|Fechar)$/ }); if (await c.count()) { await c.first().click(); await p.waitForTimeout(150); } } else break; }
        notas.push(`${rot}: viver um ano + responder em ${Date.now() - t0} ms`);
      } else if (area !== 'Linha da Vida') {
        let bt = p.getByRole('button', { name: area, exact: true }).locator('visible=true').first();
        if (!(await bt.count())) bt = p.locator('.barra__item', { hasText: area === 'Tempo livre' ? 'Tempo' : area }).first();
        await bt.click();
        await p.waitForTimeout(350);
        if (aba === 'ficha') { const r = p.locator('.pessoas button, .rosto, .pessoa-cartao').first(); if (await r.count()) { await r.click(); await p.waitForTimeout(350); } }
        else if (aba) { const t = p.getByRole('tab', { name: aba, exact: true }).first(); if (await t.count()) { await t.click(); await p.waitForTimeout(300); } else notas.push(`${rot}: sem aba ${aba}`); }
      }
    }
    if (await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)) problemas.push(`${rot}: rolagem horizontal`);
    const estouram = await p.evaluate(() => [...document.querySelectorAll('main *, .folha *')].filter(x => { const r = x.getBoundingClientRect(); return r.width > 0 && r.right > document.documentElement.clientWidth + 1 && getComputedStyle(x).position !== 'fixed' && !x.closest('[data-rola-x], .palmares__historico-rolagem'); }).slice(0, 4).map(x => `${x.tagName.toLowerCase()}.${[...x.classList].join('.')}`));
    if (estouram.length) problemas.push(`${rot}: estouram a borda: ${estouram.join(', ')}`);
    // O botão de avançar: visível na janela sem rolar, e não coberto pela barra de baixo.
    if (save && !['inicio', 'fim'].includes(area) && !(await p.locator('.folha').count())) {
      const av = await p.evaluate(() => {
        const bt = document.querySelector('.avancar__botao'); if (!bt) return 'ausente';
        const r = bt.getBoundingClientRect(); const h = window.innerHeight;
        if (r.bottom <= 0 || r.top >= h) return 'fora da janela';
        const x = r.left + r.width / 2, y = r.top + r.height / 2;
        const topo = document.elementFromPoint(x, y);
        return topo && (topo === bt || bt.contains(topo)) ? 'ok' : `coberto por ${topo?.className}`;
      });
      notas.push(`${rot}: avançar ${av}`);
    }
    const pequenos = await p.evaluate(() => [...document.querySelectorAll('button, a, [role=tab], input, select')].filter(x => { const r = x.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.height < 32 || r.width < 32) && getComputedStyle(x).visibility !== 'hidden'; }).length);
    if (pequenos) notas.push(`${rot}: ${pequenos} alvos < 32px`);
    await p.screenshot({ path: `${OUT}/${nome}-${w}.png` });
    if (nome === 'linha-longa' || w === 390) await p.screenshot({ path: `${OUT}/${nome}-${w}-inteira.png`, fullPage: true });
    await ctx.close();
  }
}
await b.close();
writeFileSync(`${OUT}/relatorio.json`, JSON.stringify({ problemas, notas }, null, 2));
console.log(JSON.stringify({ problemas, notas: notas.filter(n => !/ok$/.test(n)) }, null, 2));
