// VIDA 12.5 — verificação funcional na URL publicada: saves antigos (12.4.x) abrem; a Retrospectiva mostra memórias em
// ordem e filtra; a lupa do estúdio aproxima; Compras mostra as fachadas novas; as notas da 12.5 aparecem; sem erro de
// console. Saída: uma linha por verificação e o total.
//   SP=~/vida-trabalho/qa1151 URL=https://vida-game.pages.dev/ node scripts/playtest/producao125.mjs
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const SP = process.env.SP ?? `${process.env.HOME}/vida-trabalho/qa1151`;
const URL = process.env.URL ?? 'https://vida-game.pages.dev/';
const save = n => readFileSync(`${SP}/saves/vida-${n}.json`, 'utf8');
const res = [];
const ok = (nome, cond, extra = '') => res.push(`${cond ? 'OK  ' : 'FALHOU'} · ${nome}${extra ? ` — ${extra}` : ''}`);
const b = await chromium.launch();
async function abrir(sv, vistas = '12.5', w = 1440) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
  const p = await ctx.newPage();
  const erros = [];
  p.on('pageerror', e => erros.push(e.message));
  p.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  await p.goto(URL);
  await p.evaluate(([s, nv]) => { localStorage.clear(); localStorage.setItem('VIDA_NOVIDADES_VISTAS', nv); localStorage.setItem('VIDA_GAME_SAVE_V1', s); }, [save(sv), vistas]);
  await p.goto(URL);
  await p.waitForTimeout(600);
  return { p, ctx, erros };
}
/** A área: a barra de baixo no celular, a de cima no desktop. */
async function irPara(p, area) {
  let bt = p.locator('.barra__item', { hasText: area }).locator('visible=true').first();
  if (!(await bt.count())) bt = p.getByRole('button', { name: area, exact: true }).locator('visible=true').first();
  await bt.click(); await p.waitForTimeout(500);
}
const continuar = async p => { await p.getByRole('button', { name: /Continuar a vida/ }).click(); await p.waitForTimeout(700); };

// 1. Notas da 12.5 para quem vinha da 12.4.2.
{ const { p, ctx, erros } = await abrir('r124-rica', '12.4.2');
  const janela = p.getByRole('dialog', { name: 'Novidades da atualização' });
  await janela.waitFor({ timeout: 15000 }).catch(() => {});
  const nota = await janela.getByText(/Retrospectiva da Vida/).first().isVisible().catch(() => false) && await janela.getByText(/12\.5/).first().isVisible().catch(() => false);
  ok('as notas da 12.5 aparecem para quem estava na 12.4.2', nota);
  ok('sem erro de console na abertura', !erros.length, erros.slice(0, 2).join(' | '));
  await ctx.close(); }

// 2. Retrospectiva com saves antigos (gravados na 12.4.x): abre, em ordem, filtra.
for (const sv of ['r1151-jogador', 'r124-rica', 'r1151-escura']) {
  const { p, ctx, erros } = await abrir(sv);
  await continuar(p);
  ok(`[${sv}] o save antigo abre`, await p.locator('.avancar__botao').count() > 0);
  await p.getByRole('tab', { name: /^Retrospectiva/ }).first().click();
  await p.waitForSelector('.retro-memoria', { timeout: 15000 }).catch(() => {});
  const n = await p.locator('.retro-memoria').count();
  const quando = await p.locator('.retro-memoria__quando').allTextContents();
  const anos = quando.map(t => Number(/em (\d{4})/.exec(t)?.[1]));
  const emOrdem = anos.every((a, k) => !k || a >= anos[k - 1]);
  ok(`[${sv}] a Retrospectiva lista memórias em ordem`, n > 0 && emOrdem, `${n} memórias`);
  const titulos = await p.locator('.retro-memoria').evaluateAll(xs => xs.map(x => `${x.querySelector('.retro-memoria__quando')?.textContent}|${x.querySelector('.retro-memoria__titulo')?.textContent}|${x.querySelector('.retro-memoria__texto')?.textContent}`));
  ok(`[${sv}] nenhuma memória repetida`, new Set(titulos).size === titulos.length);
  const educ = p.getByRole('button', { name: /^Educação/ });
  if (await educ.isEnabled()) { await educ.click(); const m = await p.locator('.retro-memoria').count(); ok(`[${sv}] o filtro de categoria funciona`, m > 0 && m <= n, `${m} de ${n}`); }
  ok(`[${sv}] sem erro de console`, !erros.length, erros.slice(0, 2).join(' | '));
  await ctx.close();
}

// 3. A lupa do estúdio de tatuagem (celular).
{ const { p, ctx, erros } = await abrir('r1151-moda', '12.5', 390);
  await continuar(p);
  await irPara(p, 'Você');
  await p.getByRole('tab', { name: /^Aparência/ }).first().click();
  await p.waitForSelector('.estudio-tatuagem__lupa', { timeout: 15000 }).catch(() => {});
  const nivel = () => p.locator('.estudio-tatuagem__lupa').getAttribute('data-nivel');
  const n0 = await nivel();
  await p.getByRole('button', { name: 'Aproximar' }).click();
  const n1 = await nivel();
  await p.getByRole('button', { name: 'Corpo inteiro' }).click();
  ok('a lupa do estúdio abre na região e aproxima', n0 === '1' && n1 === '2');
  ok('a lupa volta ao corpo inteiro', (await nivel()) === '0');
  ok('estúdio sem erro de console e sem rolagem lateral', !erros.length && !(await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)));
  await ctx.close(); }

// 4. As fachadas novas em Compras.
{ const { p, ctx, erros } = await abrir('r1151-moda');
  await continuar(p);
  await irPara(p, 'Vida');
  await p.getByRole('tab', { name: /^Compras/ }).first().click(); await p.waitForTimeout(500);
  await p.getByRole('button', { name: 'Moda e acessórios' }).first().click(); await p.waitForTimeout(700);
  const lugares = await p.locator('.vitrine__fachada').evaluateAll(xs => xs.map(x => x.getAttribute('data-lugar')));
  ok('fachadas por segmento (moda, sapataria, ótica)', ['moda', 'sapataria', 'otica'].every(l => lugares.includes(l)));
  ok('grandes lojas com prédio próprio', lugares.some(l => l?.startsWith('dep_')), lugares.filter(l => l?.startsWith('dep_')).join(', '));
  ok('lojas pela internet com o galpão (não a vitrine "ótica & moda")', lugares.some(l => l?.startsWith('onl_')) && !lugares.includes('estilo'));
  ok('Compras sem erro de console', !erros.length, erros.slice(0, 2).join(' | '));
  await ctx.close(); }

await b.close();
console.log(res.join('\n'));
const falhas = res.filter(x => x.startsWith('FALHOU')).length;
console.log(`\n${res.length - falhas}/${res.length} verificações passaram.`);
process.exit(falhas ? 1 : 0);
