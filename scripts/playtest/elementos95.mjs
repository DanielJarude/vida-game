// REWORK 9.5 — fotos de partes da tela (um elemento por vez), para revisão e para o relatório.
//   SP=<pasta com saves/> OUT=<pasta> LARGURA=390 TEMA=claro node scripts/playtest/elementos95.mjs
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const SP = process.env.SP, OUT = process.env.OUT, URL = process.env.URL ?? 'http://localhost:4173/';
const W = Number(process.env.LARGURA ?? 390), TEMA = process.env.TEMA ?? 'claro';
const save = n => { for (const p of ['r95', 'r9', 'r8', 'r75', 'r7', 'r6']) { try { return readFileSync(`${SP}/saves/vida-${p}-${n}.json`, 'utf8'); } catch {} } throw new Error(n); };
const CENAS = [
  ['rotina', 'playtest', 'Semana', [], '.rotina-leitura'],
  ['dedicacao', 'playtest', 'Caminhos', [], '.dedicacao-estudo'],
  ['boletim', 'dedicada', 'Caminhos', ['Desenvolvimento'], '.boletim'],
  ['retrato', 'empregado', 'História', [], '.hoje--retrato'],
  ['fichas', 'jovem', 'Você', [], '.voce-bom'],
  ['tecnico-agora', 'tecnico', 'Caminhos', [], '.camada--agora'],
  ['tecnico-pastas', 'tecnico', 'Caminhos', ['Oportunidades'], '.explorar-trabalho'],
  ['patrimonio', 'posses', 'Vida', ['Patrimônio'], '.patrimonio'],
  ['extrato', 'posses', 'Vida', ['Dinheiro'], '.dinheiro'],
  ['album', 'familia', 'Pessoas', [], '.rostos'],
  ['diario', 'empregado', 'História', [], '.linha-da-vida']
];
const so = process.env.CENAS?.split(',');
const b = await chromium.launch();
for (const [nome, sv, area, abas, sel] of CENAS.filter(c => !so || so.includes(c[0]))) {
  const ctx = await b.newContext({ viewport: { width: W, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(URL);
  await p.evaluate(([s, t]) => { localStorage.clear(); localStorage.setItem('VIDA_APARENCIA', t); localStorage.setItem('VIDA_GAME_SAVE_V1', s); }, [save(sv), TEMA]);
  await p.goto(URL); await p.waitForTimeout(300);
  await p.getByRole('button', { name: /Continuar a vida/ }).click(); await p.waitForTimeout(500);
  if (area !== 'História') { let bt = p.locator('.barra__item', { hasText: area }).locator('visible=true').first(); if (!(await bt.count())) bt = p.getByRole('button', { name: area === 'Semana' ? 'Minha Semana' : area, exact: true }).locator('visible=true').first(); await bt.click(); await p.waitForTimeout(350); }
  for (const a of abas) { await p.getByRole('tab', { name: a, exact: true }).first().click(); await p.waitForTimeout(300); }
  const el = p.locator(sel).first();
  if (await el.count()) await el.screenshot({ path: `${OUT}/${nome}-${TEMA}-${W}.png` }); else console.log('sem', nome, sel);
  await ctx.close();
}
await b.close();
