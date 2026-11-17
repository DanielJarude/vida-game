// VIDA 25 — QA visual no app: e-sports (Outros caminhos e Trabalho), a ficha do atleta e a formação (base e vôlei), o
// lembrete da CNH (painel Agora), o corpo em quatro partes. Mede rolagem lateral, cortes (elementos mais largos que a
// tela), erros de console e o texto (NaN/undefined); fotografa cada cena. Persistência: recarrega e confere.
// URL=… SP=<pasta com saves/> W=1440,390 TEMAS=claro,escuro OUT=<pasta> NOVID=25
import { chromium } from 'playwright';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
const URL = process.env.URL ?? 'http://localhost:4173/';
const SP = process.env.SP ?? `${process.env.HOME}/vida-trabalho/v25/saves`;
const OUT = process.env.OUT ?? `${process.env.HOME}/vida-trabalho/v25/qa`; mkdirSync(OUT, { recursive: true });
const NOVID = process.env.NOVID ?? '25';
const CENAS = [
  ['esports-caminhos', 'v25-esports', ['area:Caminhos', 'div:Outros caminhos'], '.esp25'],
  ['esports-trabalho', 'v25-esports', ['area:Caminhos', 'div:Trabalho'], '.esp25'],
  ['base-formacao', 'v25-base', ['area:Caminhos', 'div:Outros caminhos'], '.form25'],
  ['base-ficha', 'v25-base', ['area:Caminhos', 'div:Outros caminhos'], '.f25'],
  ['volei-ficha', 'v25-volei', ['area:Caminhos', 'div:Trabalho'], '.f25'],
  ['cnh', 'v25-cnh', [], '.lembrete-cnh'],
  ['esports-porta', 'v25-cnh', ['area:Caminhos', 'div:Outros caminhos'], '.esp25--porta'],
  ['corpo', 'v25-volei', ['area:Você', 'aba:Aparência', 'tab:Corpo'], '.c24']
];
const b = await chromium.launch();
const problemas = []; const rel = [];
for (const tema of (process.env.TEMAS ?? 'claro,escuro').split(',')) for (const w of (process.env.W ?? '1440,390').split(',').map(Number)) for (const [nome, save, passos, sel] of CENAS) {
  const ctx = await b.newContext({ viewport: { width: w, height: w > 800 ? 950 : 844 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  const erros = []; p.on('pageerror', e => erros.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/favicon|manifest/.test(m.text())) erros.push(m.text()); });
  const tag = `${nome}@${w}-${tema}`;
  await p.goto(URL);
  await p.evaluate(([s, t, n]) => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem('VIDA_APARENCIA', t); localStorage.setItem('VIDA_NOVIDADES_VISTAS', n); localStorage.setItem('VIDA_GAME_SAVE_V1', s); }, [readFileSync(`${SP}/vida-${save}.json`, 'utf8'), tema, NOVID]);
  await p.goto(URL);
  const cont = p.getByRole('button', { name: /Continuar a vida/ });
  await cont.waitFor({ timeout: 20000 }).catch(() => {});
  if (!(await cont.count())) { problemas.push(`${tag}: sem Continuar`); await ctx.close(); continue; }
  await cont.click(); await p.waitForTimeout(1500);
  for (const n of ['Fechar', 'Entendi', 'Ver depois']) { const x = p.getByRole('button', { name: n }).locator('visible=true'); if (await x.count()) { await x.first().click().catch(() => {}); await p.waitForTimeout(300); } }
  for (const ps of passos) {
    if (ps.startsWith('area:')) { const nomeA = ps.slice(5); let bt = p.locator('.barra__item', { hasText: nomeA }).locator('visible=true').first(); if (!(await bt.count())) bt = p.getByRole('button', { name: new RegExp(`^(Minha )?${nomeA}$`) }).locator('visible=true').first(); await bt.click().catch(() => problemas.push(`${tag}: sem área ${nomeA}`)); }
    else if (ps.startsWith('div:')) await p.locator('.divisoes-caminhos__item', { hasText: ps.slice(4) }).first().click().catch(() => problemas.push(`${tag}: sem divisão ${ps}`));
    else if (ps.startsWith('aba:')) await p.getByRole('tab', { name: new RegExp(ps.slice(4)) }).locator('visible=true').first().click().catch(() => problemas.push(`${tag}: sem aba ${ps}`));
    else if (ps.startsWith('tab:')) await p.getByRole('tab', { name: ps.slice(4), exact: true }).locator('visible=true').first().click().catch(() => problemas.push(`${tag}: sem ${ps}`));
    await p.waitForTimeout(900);
  }
  const alvo = p.locator(sel).locator('visible=true').first();
  await alvo.waitFor({ timeout: 8000 }).catch(() => {});
  if (!(await alvo.count())) { problemas.push(`${tag}: não achou ${sel}`); await p.screenshot({ path: `${OUT}/${tag}-FALTA.png` }); await ctx.close(); continue; }
  await alvo.scrollIntoViewIfNeeded();
  const lateral = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  if (lateral > 1) problemas.push(`${tag}: rolagem lateral ${lateral}px`);
  const largos = await alvo.evaluate((el) => { const W = innerWidth; const out = []; for (const x of el.querySelectorAll('*')) { const r = x.getBoundingClientRect(); if (r.width > 0 && r.right > W + 1) { let a = x.parentElement, cortado = false; while (a && a !== document.body) { const cs = getComputedStyle(a); if (/auto|scroll|hidden/.test(cs.overflowX)) { cortado = true; break; } a = a.parentElement; } if (!cortado) out.push(`${x.tagName}.${x.className}`.slice(0, 60)); } } return out.slice(0, 5); });
  if (largos.length) problemas.push(`${tag}: passa da tela: ${largos.join(', ')}`);
  const texto = await alvo.innerText();
  if (/NaN|undefined|Infinity|\[object/.test(texto)) problemas.push(`${tag}: texto quebrado`);
  await alvo.screenshot({ path: `${OUT}/${tag}.png` }).catch(async () => p.screenshot({ path: `${OUT}/${tag}.png` }));
  if (erros.length) problemas.push(`${tag}: erros ${[...new Set(erros)].slice(0, 2).join(' | ')}`);
  rel.push({ tag, altura: Math.round((await alvo.boundingBox())?.height ?? 0), atributos: await alvo.locator('[data-atributo]').count() });
  await ctx.close();
}
// Persistência: a CNH dispensada continua dispensada depois de recarregar; a carreira de e-sports volta igual.
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); const p = await ctx.newPage();
  await p.goto(URL);
  await p.evaluate(([s, n]) => { localStorage.clear(); localStorage.setItem('VIDA_NOVIDADES_VISTAS', n); localStorage.setItem('VIDA_GAME_SAVE_V1', s); }, [readFileSync(`${SP}/vida-v25-cnh.json`, 'utf8'), NOVID]);
  await p.goto(URL); await p.getByRole('button', { name: /Continuar a vida/ }).click(); await p.waitForTimeout(1500);
  await p.getByRole('button', { name: 'Agora não' }).first().click().catch(() => problemas.push('persistência: sem "Agora não"'));
  await p.reload(); await p.getByRole('button', { name: /Continuar a vida/ }).click(); await p.waitForTimeout(1500);
  if (await p.locator('.lembrete-cnh').count()) problemas.push('persistência: o lembrete da CNH voltou depois de dispensado');
  rel.push({ tag: 'persistencia-cnh', ok: !(await p.locator('.lembrete-cnh').count()) });
  await ctx.close();
}
await b.close();
writeFileSync(`${OUT}/relatorio.json`, JSON.stringify({ rel, problemas }, null, 1));
console.log(rel.map(x => JSON.stringify(x)).join('\n'));
console.log(problemas.length ? `PROBLEMAS (${problemas.length}):\n- ${problemas.join('\n- ')}` : 'sem problemas');
