// VIDA 24 — QA visual no app: o corpo de nascença (Nascer), a Aparência por categorias (Corpo, Pele e marcas, Pelos,
// Cabelo e rosto, Piercings e joias, Roupas e estilo), o objetivo e os cuidados confirmados, e a persistência ao recarregar.
// URL=… SAVE=r129-empresaria W=1440 TEMA=claro|escuro OUT=<pasta> TAG=… [SP=~/vida-trabalho/qa129] [NOVID=24]
import { chromium } from 'playwright';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
const URL = process.env.URL ?? 'http://localhost:4173/';
const SP = process.env.SP ?? `${process.env.HOME}/vida-trabalho/qa129`;
const OUT = process.env.OUT ?? `${process.env.HOME}/vida-trabalho/a24/qa`; mkdirSync(OUT, { recursive: true });
const W = Number(process.env.W ?? 1440), H = Number(process.env.H ?? 900), TEMA = process.env.TEMA ?? 'claro', TAG = `${process.env.TAG ?? 'x'}-${W}-${TEMA}`;
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: Number(process.env.DPR ?? 1.5) })).newPage();
const erros = []; p.on('pageerror', e => erros.push(e.message)); p.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
const rel = { tag: TAG, passos: [] };
const semRolagem = async () => p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
const medir = async sel => p.locator(sel).evaluateAll(els => els.map(e => { const r = e.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), rot: e.getAttribute('aria-label') }; }));
const fechar = async () => { for (const n of ['Fechar', 'Entendi', 'Ver depois']) { const x = p.getByRole('button', { name: n }).locator('visible=true'); if (await x.count()) { await x.first().click(); await p.waitForTimeout(300); } } };
await p.goto(URL);
await p.evaluate(([s, t, n]) => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem('VIDA_APARENCIA', t); localStorage.setItem('VIDA_NOVIDADES_VISTAS', n); localStorage.setItem('VIDA_GAME_SAVE_V1', s); }, [readFileSync(`${SP}/saves/vida-${process.env.SAVE ?? 'r129-empresaria'}.json`, 'utf8'), TEMA, process.env.NOVID ?? '24']);

// 1. Nascer: o corpo de nascença (escolher, mexer em três tendências), a prévia nas idades.
await p.goto(URL); await p.waitForTimeout(700);
await p.getByRole('button', { name: /Nascer de novo/ }).click(); await p.waitForTimeout(1500);
const cn = p.locator('.corpo-nascenca').first();
await cn.scrollIntoViewIfNeeded();
await cn.screenshot({ path: `${OUT}/${TAG}-nascer-heranca.png` });
rel.passos.push({ nome: 'nascer-heranca', figuras: await medir('.corpo-nascenca__fig > svg'), texto: (await cn.locator('.corpo-nascenca__pais').allTextContents()).join(' '), semRolagem: await semRolagem() });
await cn.getByRole('radio', { name: 'Escolher' }).click(); await p.waitForTimeout(500);
await cn.locator('[data-eixo="ombros"] input').fill('2'); await cn.locator('[data-eixo="barriga"] input').fill('2'); await cn.locator('[data-eixo="musculo"] input').fill('2'); await cn.locator('[data-eixo="estatura"] input').fill('2');
await p.waitForTimeout(700);
await cn.screenshot({ path: `${OUT}/${TAG}-nascer-escolher.png` });
rel.passos.push({ nome: 'nascer-escolher', eixos: await cn.locator('[data-eixo]').count(), figuras: await medir('.corpo-nascenca__fig > svg'), nota: await cn.locator('p.nota').last().textContent(), semRolagem: await semRolagem() });
const fisico = await p.locator('[data-atributo="fisico"] output').first().textContent();
rel.passos.push({ nome: 'atributo-fisico-continua', fisico });

// 2. A Aparência do save (adulto): cada categoria.
const entrar = async () => { await p.goto(URL); await p.waitForTimeout(700); await p.getByRole('button', { name: /Continuar a vida/ }).click(); await p.waitForTimeout(1000); await fechar(); };
const area = async nome => { let bt = p.locator('.barra__item', { hasText: nome }).locator('visible=true').first(); if (!(await bt.count())) bt = p.getByRole('button', { name: nome, exact: true }).locator('visible=true').first(); await bt.click(); await p.waitForTimeout(700); };
const aparencia = async () => { await area('Você'); const t = p.getByRole('tab', { name: /Aparência/ }).locator('visible=true'); if (await t.count()) { await t.first().click(); await p.waitForTimeout(900); } };
await entrar(); await aparencia();
const cat = async (nome, arquivo) => {
  await p.getByRole('tab', { name: nome, exact: true }).locator('visible=true').first().click(); await p.waitForTimeout(1200);
  const painel = p.locator('#ap24-painel');
  await painel.scrollIntoViewIfNeeded();
  await p.locator('.ap24__nav').scrollIntoViewIfNeeded();
  await p.screenshot({ path: `${OUT}/${TAG}-${arquivo}.png`, fullPage: false });
  rel.passos.push({ nome: arquivo, figuras: await medir('#ap24-painel svg.figura'), semRolagem: await semRolagem() });
};
await cat('Corpo', 'corpo');
// O objetivo: ganhar massa + comer mais; a projeção muda; confirmar não muda o "hoje".
const hoje = async () => p.locator('[data-c24-fig="hoje"] svg.figura').first().evaluate(e => e.outerHTML.length);
const antes = await hoje();
await p.getByRole('radio', { name: /^Objetivo/ }).click(); await p.waitForTimeout(400);
await p.getByRole('radio', { name: 'Ganhar massa muscular' }).click(); await p.getByRole('radio', { name: 'Comer mais' }).click(); await p.waitForTimeout(600);
await p.locator('.c24').first().screenshot({ path: `${OUT}/${TAG}-corpo-objetivo.png` });
await p.getByRole('button', { name: 'Seguir esse plano' }).click(); await p.waitForTimeout(800);
rel.passos.push({ nome: 'objetivo-confirmado', hojeIgual: antes === (await hoje()), aviso: await p.locator('[role=status], .aviso, .toast').allTextContents().catch(() => []) });
await p.getByRole('radio', { name: 'Constituição' }).click(); await p.waitForTimeout(400);
await p.locator('.c24').first().screenshot({ path: `${OUT}/${TAG}-corpo-nascenca.png` });
await cat('Pele e marcas', 'pele');
await cat('Pelos', 'pelos');
const aparar = p.getByRole('radio', { name: 'Aparar' }).locator('visible=true');
if (await aparar.count() && await aparar.first().isEnabled()) {
  await aparar.first().click(); await p.getByLabel('Braços').check(); await p.waitForTimeout(500);
  await p.locator('[data-c24="pelos"]').screenshot({ path: `${OUT}/${TAG}-pelos-aparar.png` });
  await p.getByRole('button', { name: 'Fazer assim' }).click(); await p.waitForTimeout(700);
}
await cat('Cabelo e rosto', 'cabelo');
await cat('Piercings e joias', 'joias');
await cat('Roupas e estilo', 'roupas');
// 3. Recarregar: a categoria e o plano continuam.
await entrar(); await aparencia();
const sel = await p.locator('#ap24-painel').getAttribute('data-categoria');
await p.getByRole('tab', { name: 'Corpo', exact: true }).first().click(); await p.waitForTimeout(1000);
const planoMarcado = await p.getByRole('radio', { name: /Objetivo ✓/ }).count();
await p.getByRole('tab', { name: 'Pelos', exact: true }).first().click(); await p.waitForTimeout(1000);
const aparado = await p.getByRole('radio', { name: 'Aparar' }).getAttribute('aria-checked').catch(() => null);
rel.passos.push({ nome: 'depois-de-recarregar', categoriaLembrada: sel, planoMarcado, aparado });
rel.erros = erros;
writeFileSync(`${OUT}/${TAG}.json`, JSON.stringify(rel, null, 1));
console.log(JSON.stringify(rel));
await b.close();
