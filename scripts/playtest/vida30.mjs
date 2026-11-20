// VIDA 30 · revisão visual: o clube (painel, elenco, mercado), o campo (o que pede atenção), a Fama (o meio), as redes
// (os seus posts, a prévia da live), o namoro (os filtros), a formação da base, o ofício. Em W=1440 e W=390.
// URL= (preview ou produção), SP= pasta dos saves (gerarVida30.ts), OUT= pasta das fotos.
import { chromium } from '/home/iego_ossi/vida-trabalho/r129/node_modules/playwright/index.mjs';
import { readFileSync, mkdirSync } from 'node:fs';
const URL = process.env.URL ?? 'http://localhost:4180/';
const SP = process.env.SP ?? `${process.env.HOME}/vida-trabalho/v30/saves`;
const OUT = process.env.OUT ?? `${process.env.HOME}/vida-trabalho/v30/fotos`; mkdirSync(OUT, { recursive: true });
const W = Number(process.env.W ?? 1440);
const b = await chromium.launch();
const resumo = [];
async function abrir(save) {
  const ctx = await b.newContext({ viewport: { width: W, height: 1000 } });
  const p = await ctx.newPage();
  const erros = []; p.on('pageerror', e => erros.push(e.message));
  await p.goto(URL);
  await p.evaluate(s => { localStorage.clear(); localStorage.setItem('VIDA_NOVIDADES_VISTAS', '30'); localStorage.setItem('VIDA_GAME_SAVE_V1', s); }, readFileSync(`${SP}/vida-v30-${save}.json`, 'utf8'));
  await p.goto(URL); await p.waitForTimeout(1500);
  await p.getByRole('button', { name: /Continuar a vida/ }).click(); await p.waitForTimeout(1800);
  return { p, ctx, erros };
}
async function area(p, nome) {
  let bt = p.locator('.barra__item', { hasText: nome }).locator('visible=true').first();
  if (!(await bt.count())) bt = p.getByRole('button', { name: new RegExp(`^${nome}$`) }).first();
  await bt.click(); await p.waitForTimeout(900);
}
const largura = p => p.evaluate(() => document.documentElement.scrollWidth);
async function fechar(nome, { p, ctx, erros }) {
  const lw = await largura(p);
  resumo.push(`${nome}: erros=${erros.length ? erros.join(' | ').slice(0, 200) : 'nenhum'} · largura=${lw}${lw > W + 2 ? ' (ROLAGEM LATERAL)' : ''}`);
  await ctx.close();
}
const foto = async (p, sel, n) => { const l = p.locator(sel).first(); if (await l.count()) await l.screenshot({ path: `${OUT}/${n}-${W}.png` }).catch(() => {}); else resumo.push(`  (sem ${sel} em ${n})`); };

// Clube
{ const x = await abrir('clube'); const { p } = x;
  await area(p, 'Vida');
  for (const n of [/^Patrimônio$/, /^Empresas/]) { const bt = p.getByRole('button', { name: n }).first(); const tb = p.getByRole('tab', { name: n }).first(); if (await bt.count()) await bt.click(); else if (await tb.count()) await tb.click(); await p.waitForTimeout(2000); }
  if (!(await p.locator('.clube30').count())) { const t = p.getByText(/Clube de futebol|Náutico/).first(); await t.scrollIntoViewIfNeeded().catch(() => {}); }
  await p.locator('.clube30').first().waitFor({ timeout: 8000 }).catch(() => {});
  await foto(p, '.clube30', 'clube-painel');
  resumo.push(`  clube: escudo=${await p.locator('.clube30__capa .escudo30').count()} jogadores no campo=${await p.locator('.clube30__jog').count()}`);
  for (const t of ['Elenco', 'Mercado']) { await p.getByRole('tab', { name: t }).first().click().catch(() => {}); await p.waitForTimeout(700); await foto(p, '.clube30', `clube-${t.toLowerCase()}`); }
  await fechar('clube', x); }
// Campo
{ const x = await abrir('campo'); const { p } = x;
  await area(p, 'Vida'); await p.locator('#subnav-campo').click().catch(() => {}); await p.waitForTimeout(2000);
  await foto(p, '.campo30', 'campo-atencao');
  resumo.push(`  campo: problemas=${(await p.locator('[data-problema]').evaluateAll(xs => xs.map(y => y.getAttribute('data-problema')))).join(',')}`);
  await fechar('campo', x); }
// Fama + redes + namoro
{ const x = await abrir('famosa'); const { p } = x;
  await area(p, 'Você'); const f = p.getByRole('tab', { name: /Fama/ }).first(); if (await f.count()) { await f.click(); await p.waitForTimeout(1500); }
  await p.locator('.meio30').first().waitFor({ timeout: 8000 }).catch(() => {});
  await foto(p, '.meio30', 'fama-meio');
  await fechar('fama', x); }
{ const x = await abrir('famosa'); const { p } = x;
  await area(p, 'Você'); const cel = p.getByRole('button', { name: /^Celular$/ }).first(); await cel.click().catch(() => {}); await p.waitForTimeout(1500);
  for (const app of ['Twitch', 'Instagram', 'Namoro']) {
    const a = p.getByRole('button', { name: new RegExp('^' + app) }).first();
    if (!(await a.count())) { resumo.push(`  (sem app ${app})`); continue; }
    await a.click(); await p.waitForTimeout(1200);
    if (app !== 'Namoro') { const perf = p.getByRole('button', { name: /Perfil|Canal/ }).last(); await perf.click().catch(() => {}); await p.waitForTimeout(900); await foto(p, '.meus30', `redes-${app.toLowerCase()}`); resumo.push(`  ${app}: posts=${await p.locator('.meus30__post').count()} previas=${await p.locator('.previa30').count()}`); }
    else { const fb = p.getByRole('button', { name: /^Filtros/ }).first(); await fb.click().catch(() => {}); await p.waitForTimeout(800); await foto(p, '.namoro', 'namoro-filtros'); resumo.push(`  namoro: form=${await p.locator('.namoro30__form').count()}`); }
    const voltar = p.getByRole('button', { name: /Voltar à tela inicial/ }).first(); await voltar.click().catch(() => {}); await p.waitForTimeout(600);
  }
  await fechar('redes', x); }
// Base
{ const x = await abrir('base'); const { p } = x;
  await area(p, 'Caminhos').catch(() => {}); await p.waitForTimeout(800);
  for (const n of ['Outros caminhos']) { if (await p.locator('.form25').count()) break; await p.getByRole('button', { name: n }).first().click().catch(() => {}); await p.waitForTimeout(1500); }
  await p.locator('.form30').first().waitFor({ timeout: 6000 }).catch(() => {});
  await foto(p, '.form25', 'base-formacao');
  resumo.push(`  base: porta de outro clube=${await p.getByText(/quer você na base|Avaliação d/).count()} registro=${await p.locator('.form30').count()}`);
  await fechar('base', x); }
// Ofício
{ const x = await abrir('oficio'); const { p } = x;
  await area(p, 'Caminhos').catch(() => {}); await p.waitForTimeout(1200);
  await p.getByRole('button', { name: 'Trabalho' }).first().click().catch(() => {}); await p.waitForTimeout(1500);
  await p.locator('.oficio30').first().waitFor({ timeout: 6000 }).catch(() => {});
  await foto(p, '.oficio30', 'oficio');
  await fechar('oficio', x); }
console.log(resumo.join('\n'));
await b.close();
