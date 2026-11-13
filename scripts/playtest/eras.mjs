// ERAS HISTÓRICAS — capturas no jogo real (build + `vite preview`). Uso: node scripts/playtest/eras.mjs
// Saves em ~/vida-trabalho/eras/saves (gerados por scripts/sim/eras.ts com SNAP=...). Fotos em OUT.
// Confere: erros de console, rolagem lateral, e o que cada tela deve mostrar.
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';
const URL = process.env.URL ?? 'http://localhost:4173/';
const OUT = process.env.OUT ?? `${process.env.HOME}/vida-trabalho/eras/fotos`;
const SAVES = `${process.env.HOME}/vida-trabalho/eras/saves`;
mkdirSync(OUT, { recursive: true });
const TAMANHOS = (process.env.W ?? '1440,390,360').split(',').map(Number);
const TEMAS = (process.env.TEMAS ?? 'claro,escuro').split(',');
const b = await chromium.launch();
const relatorio = [];

async function pagina(w, tema) {
  const ctx = await b.newContext({ viewport: { width: w, height: w > 800 ? 1000 : 844 } });
  const p = await ctx.newPage();
  const erros = [];
  p.on('pageerror', e => erros.push(e.message));
  p.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  return { p, ctx, erros, tema };
}
async function abrirSave(p, nome, tema) {
  await p.goto(URL);
  await p.evaluate(([s, t]) => { localStorage.clear(); localStorage.setItem('VIDA_APARENCIA', t); localStorage.setItem('VIDA_NOVIDADES_VISTAS', '99'); localStorage.setItem('VIDA_GAME_SAVE_V1', s); }, [readFileSync(`${SAVES}/${nome}.json`, 'utf8'), tema]);
  await p.goto(URL); await p.waitForTimeout(500);
  await p.getByRole('button', { name: /Continuar a vida/ }).click(); await p.waitForTimeout(900);
}
async function foto(p, nome, problemas, cheia = false) {
  const lateral = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (lateral > 1) problemas.push(`${nome}: rolagem lateral ${lateral}px`);
  await p.screenshot({ path: `${OUT}/${nome}.png`, fullPage: cheia });
}
async function irArea(p, nome) {
  let bt = p.locator('.barra__item', { hasText: nome }).locator('visible=true').first();
  if (!(await bt.count())) bt = p.getByRole('button', { name: nome, exact: true }).locator('visible=true').first();
  await bt.click(); await p.waitForTimeout(600);
}

for (const tema of TEMAS) for (const w of TAMANHOS) {
  const tag = `${w}-${tema}`;
  const problemas = [];
  // 1. Nascer: a escolha da época (anos 80, 1984)
  {
    const { p, ctx, erros } = await pagina(w, tema);
    await p.goto(URL);
    await p.evaluate(t => { localStorage.clear(); localStorage.setItem('VIDA_APARENCIA', t); localStorage.setItem('VIDA_NOVIDADES_VISTAS', '99'); }, tema);
    await p.goto(URL); await p.waitForTimeout(400);
    const novo = p.getByRole('button', { name: /Nascer de novo|Nova vida|Começar/ }).first();
    if (await novo.count()) { await novo.click(); await p.waitForTimeout(700); }
    await p.locator('.epoca__porta[data-era="1980"]').click(); await p.waitForTimeout(300);
    await p.getByRole('radio', { name: '1984' }).click(); await p.waitForTimeout(500);
    await p.locator('.epoca').scrollIntoViewIfNeeded();
    if (!(await p.locator('.epoca__previa').count())) problemas.push('nascer: sem prévia da época');
    await foto(p, `nascer-1980-${tag}`, problemas);
    await p.locator('.criacao__nascer').click(); await p.waitForTimeout(1500);
    const sub = await p.locator('.cabecalho__eu-texto').innerText().catch(() => '');
    if (!/1984/.test(sub) || !/Cr\$/.test(sub)) problemas.push(`nascer: cabeçalho sem 1984/Cr$ (${sub.replace(/\n/g, ' ')})`);
    await foto(p, `nasceu-1984-${tag}`, problemas);
    relatorio.push(`${tag} nascer: erros ${erros.length ? erros.slice(0, 2).join(' | ') : '-'}`);
    await ctx.close();
  }
  // 2. O aparelho de cada época
  for (const [save, esperado] of [['A-1996', 'fixo'], ['A-2006', 'celular'], ['A-2021', 'smartphone'], ['D-2040', 'smartphone']]) {
    const { p, ctx, erros } = await pagina(w, tema);
    await abrirSave(p, save, tema);
    const bt = p.locator('.cabecalho__celular');
    if (!(await bt.count())) { problemas.push(`${save}: sem botão do aparelho`); await ctx.close(); continue; }
    await bt.click(); await p.waitForTimeout(700);
    const meio = await p.locator('.cel__aparelho').getAttribute('data-meio');
    if (meio !== esperado) problemas.push(`${save}: aparelho ${meio}, esperado ${esperado}`);
    const apps = await p.locator('.cel__app-nome').allInnerTexts();
    relatorio.push(`${tag} ${save}: ${meio} · apps ${apps.join(', ')} · erros ${erros.length ? erros.slice(0, 2).join(' | ') : '-'}`);
    await foto(p, `aparelho-${save}-${tag}`, problemas);
    await ctx.close();
  }
  // 3. O painel "A época" e a Linha da Vida (só 1440 e 390, para não repetir)
  if (w !== 360) for (const save of ['A-1987', 'A-2003', 'B-2013']) {
    const { p, ctx, erros } = await pagina(w, tema);
    await abrirSave(p, save, tema);
    await irArea(p, 'Você');
    const mundo = p.getByRole('tab', { name: /No mundo/ }).locator('visible=true').first();
    if (await mundo.count()) { await mundo.click(); await p.waitForTimeout(800); }
    else { const bm = p.getByRole('button', { name: /No mundo/ }).locator('visible=true').first(); if (await bm.count()) { await bm.click(); await p.waitForTimeout(800); } }
    if (!(await p.locator('.painel-epoca').count())) problemas.push(`${save}: painel A época não apareceu`);
    else await p.locator('.painel-epoca').scrollIntoViewIfNeeded();
    await foto(p, `epoca-${save}-${tag}`, problemas);
    await irArea(p, 'Vida');
    const linha = p.getByRole('tab', { name: /Biografia/ }).locator('visible=true').first();
    if (await linha.count()) { await linha.click(); await p.waitForTimeout(700); }
    const chip = p.getByRole('button', { name: 'A época' }).locator('visible=true').first();
    if (await chip.count()) { await chip.click(); await p.waitForTimeout(600); } else problemas.push(`${save}: sem o fio A época na Linha da Vida`);
    await foto(p, `linha-${save}-${tag}`, problemas);
    relatorio.push(`${tag} ${save} painel/linha: erros ${erros.length ? erros.slice(0, 2).join(' | ') : '-'}`);
    await ctx.close();
  }
  relatorio.push(`${tag} PROBLEMAS: ${problemas.length ? problemas.join(' ; ') : 'nenhum'}`);
}
console.log(relatorio.join('\n'));
await b.close();
