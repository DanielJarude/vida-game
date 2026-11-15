// VIDA 23 — QA visual no app: o provador (roupa e brinco), a Aparência e o painel "Corpo e pele".
// URL=… SAVE=r129-empresaria W=1440 TEMA=claro|escuro OUT=<pasta> TAG=antes|depois [SP=~/vida-trabalho/qa129]
import { chromium } from 'playwright';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
const URL = process.env.URL ?? 'http://localhost:4173/';
const SP = process.env.SP ?? `${process.env.HOME}/vida-trabalho/qa129`;
const OUT = process.env.OUT ?? `${process.env.HOME}/vida-trabalho/a23/qa`; mkdirSync(OUT, { recursive: true });
const W = Number(process.env.W ?? 1440), H = Number(process.env.H ?? 900), TEMA = process.env.TEMA ?? 'claro', TAG = `${process.env.TAG ?? 'x'}-${W}-${TEMA}`;
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: Number(process.env.DPR ?? 1.5) })).newPage();
const erros = []; p.on('pageerror', e => erros.push(e.message));
const rel = { tag: TAG, passos: [] };
await p.goto(URL);
await p.evaluate(([s, t, n]) => { localStorage.clear(); localStorage.setItem('VIDA_APARENCIA', t); localStorage.setItem('VIDA_NOVIDADES_VISTAS', n); localStorage.setItem('VIDA_GAME_SAVE_V1', s); }, [readFileSync(`${SP}/saves/vida-${process.env.SAVE ?? 'r129-empresaria'}.json`, 'utf8'), TEMA, process.env.NOVID ?? '23']);
await p.goto(URL); await p.waitForTimeout(500);
await p.getByRole('button', { name: /Continuar a vida/ }).click(); await p.waitForTimeout(900);
for (const n of ['Fechar', 'Entendi', 'Ver depois']) { const x = p.getByRole('button', { name: n }).locator('visible=true'); if (await x.count()) { await x.first().click(); await p.waitForTimeout(300); } }
const area = async nome => { let bt = p.locator('.barra__item', { hasText: nome }).locator('visible=true').first(); if (!(await bt.count())) bt = p.getByRole('button', { name: nome, exact: true }).locator('visible=true').first(); await bt.click(); await p.waitForTimeout(700); };
const medir = async sel => p.locator(sel).evaluateAll(els => els.map(e => { const r = e.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), vb: e.getAttribute('viewBox'), rot: e.getAttribute('aria-label') }; }));
const semRolagem = async () => p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
// 1. O provador: Vida → Compras → Moda e acessórios → a loja; "Experimentar" no primeiro produto (ou no que a busca achar).
async function entrar() { await p.goto(URL); await p.waitForTimeout(600); await p.getByRole('button', { name: /Continuar a vida/ }).click(); await p.waitForTimeout(900); }
async function abrirCompras() {
  await entrar();
  await area('Vida');
  const t = p.getByRole('tab', { name: 'Compras' }).locator('visible=true');
  if (await t.count()) await t.first().click(); else await p.getByRole('button', { name: 'Compras', exact: true }).locator('visible=true').first().click();
  await p.waitForTimeout(900);
  await p.getByRole('button', { name: /^Moda e acessórios/ }).locator('visible=true').first().click(); await p.waitForTimeout(900);
}
async function provar(loja, busca, nome) {
  await abrirCompras();
  await p.locator('main button', { hasText: loja }).locator('visible=true').first().click(); await p.waitForTimeout(1200);
  if (busca) {
    // A loja especializada abre a lista das marcas: entra na primeira e busca o produto.
    let i = p.locator('.loja-vida__busca input, input[type=search]').locator('visible=true');
    if (!(await i.count())) { const m = p.locator('main .vitrine, main [class*=loja] button').locator('visible=true'); if (await m.count()) { await m.first().click(); await p.waitForTimeout(900); } i = p.locator('.loja-vida__busca input, input[type=search]').locator('visible=true'); }
    rel.passos.push({ nome: `${nome}-busca`, campos: await i.count() });
    if (await i.count()) { await i.last().fill(busca); await p.waitForTimeout(900); }
  }
  const exp = p.getByRole('button', { name: 'Experimentar' }).locator('visible=true');
  if (!(await exp.count())) { rel.passos.push({ nome, erro: 'nenhum Experimentar' }); return; }
  await exp.first().click(); await p.waitForTimeout(1000);
  const prov = p.locator('.provador').first();
  await prov.scrollIntoViewIfNeeded();
  await prov.screenshot({ path: `${OUT}/${TAG}-${nome}.png` });
  rel.passos.push({ nome, figuras: await medir('.provador svg.figura'), semRolagem: await semRolagem() });
}
await provar(/Loja de roupas/, '', 'provador-roupa');
await provar(/Joalheria/, 'Argola grande fina', 'provador-brinco');
// 2. A Aparência e o painel novo.
await entrar();
await area('Você');
const ap = p.getByRole('tab', { name: /Aparência/ }).locator('visible=true');
if (await ap.count()) { await ap.first().click(); await p.waitForTimeout(900); }
const prev = p.locator('.aparencia__previa').first();
if (await prev.count()) { await prev.scrollIntoViewIfNeeded(); await prev.screenshot({ path: `${OUT}/${TAG}-aparencia.png` }); rel.passos.push({ nome: 'aparencia', figuras: await medir('.aparencia__previa svg.figura') }); }
const c23 = p.locator('.c23').first();
if (await c23.count()) {
  await c23.scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  const ombros = c23.locator('[data-eixo="ombros"] input');
  await ombros.fill('2'); await p.locator('[data-eixo="quadril"] input').first().fill('2'); await p.locator('[data-eixo="cintura"] input').first().fill('-2');
  await p.waitForTimeout(400);
  await c23.screenshot({ path: `${OUT}/${TAG}-corpo.png` });
  rel.passos.push({ nome: 'corpo', figuras: await medir('.c23 svg.figura'), semRolagem: await semRolagem() });
  await c23.getByRole('radio', { name: /Marcas da pele/ }).click();
  await c23.locator('select').first().selectOption('sardas'); await p.waitForTimeout(300);
  await c23.getByRole('radio', { name: 'Só a pele' }).click(); await p.waitForTimeout(300);
  await c23.screenshot({ path: `${OUT}/${TAG}-marcas.png` });
  await c23.getByRole('button', { name: 'Confirmar' }).click(); await p.waitForTimeout(700);
  const naTela = async () => { await area('Você'); const t = p.getByRole('tab', { name: /Aparência/ }).locator('visible=true'); if (await t.count()) { await t.first().click(); await p.waitForTimeout(900); } return p.locator('.aparencia__previa svg.figura').first().evaluate(e => ({ constituicao: e.getAttribute('data-constituicao'), marcas: e.getAttribute('data-marcas'), vb: e.getAttribute('viewBox') })); };
  rel.passos.push({ nome: 'confirmou', naTela: await naTela() });
  // Recarregar a página (o save vem do IndexedDB): a escolha continua.
  await entrar();
  rel.passos.push({ nome: 'depois-de-recarregar', naTela: await naTela() });
}
rel.erros = erros;
writeFileSync(`${OUT}/${TAG}.json`, JSON.stringify(rel, null, 1));
console.log(JSON.stringify(rel));
await b.close();
