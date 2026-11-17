// ERAS MODERNAS — QA da interface com saves de 1992–2031 (gerarErasModernas.ts): abre cada save, passa por todas as áreas,
// "No mundo" (painel A época), o aparelho, Compras; vive um ano respondendo às cenas. Conta erros de console, rolagem lateral
// e o que cada tela deve mostrar. URL=… SP=<pasta dos saves> W=1440,390 NOVID=… OUT=<fotos>
import { chromium } from 'playwright';
import { readFileSync, readdirSync, mkdirSync } from 'node:fs';
const URL = process.env.URL ?? 'http://localhost:4173/';
const SP = process.env.SP ?? `${process.env.HOME}/vida-trabalho/modernas/saves`;
const OUT = process.env.OUT ?? `${process.env.HOME}/vida-trabalho/modernas/fotos`;
const NOVID = process.env.NOVID ?? 'Eras modernas';
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
const problemas = [];
const saves = readdirSync(SP).filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
const AREAS = ['História', 'Você', 'Pessoas', 'Caminhos', 'Semana', 'Vida'];
for (const w of (process.env.W ?? '1440,390').split(',').map(Number)) for (const save of saves) {
  const ctx = await b.newContext({ viewport: { width: w, height: w > 800 ? 1000 : 844 } });
  const p = await ctx.newPage();
  const erros = []; p.on('pageerror', e => erros.push(e.message)); p.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  const tag = `${save}@${w}`;
  const lateral = async (onde) => { const x = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (x > 1) problemas.push(`${tag} ${onde}: rolagem lateral ${x}px`); };
  const ir = async (nome) => {
    let bt = p.locator('.barra__item', { hasText: nome }).locator('visible=true').first();
    if (!(await bt.count())) bt = p.getByRole('button', { name: new RegExp(`^(Minha )?${nome}$`) }).locator('visible=true').first();
    if (!(await bt.count())) { problemas.push(`${tag}: sem botão da área ${nome}`); return; }
    await bt.click(); await p.waitForTimeout(700);
  };
  await p.goto(URL);
  await p.evaluate(([s, n]) => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem('VIDA_NOVIDADES_VISTAS', n); localStorage.setItem('VIDA_GAME_SAVE_V1', s); }, [readFileSync(`${SP}/${save}.json`, 'utf8'), NOVID]);
  await p.goto(URL); await p.waitForTimeout(800);
  const cont = p.getByRole('button', { name: /Continuar a vida/ });
  await cont.waitFor({ timeout: 20000 }).catch(() => {});
  if (!(await cont.count())) { problemas.push(`${tag}: sem "Continuar a vida"`); await ctx.close(); continue; }
  await cont.click(); await p.waitForTimeout(1500);
  for (let k = 0; k < 8; k++) { const op = p.locator('.momento button, .decisao button, .resultado button').first(); if (await op.count()) { await op.click().catch(() => {}); await p.waitForTimeout(400); } else break; }
  const cab = (await p.locator('.cabecalho__eu-texto').innerText().catch(() => '')).replace(/\n/g, ' ');
  for (const a of AREAS) { await ir(a); await lateral(a); }
  await p.screenshot({ path: `${OUT}/${tag}-vida.png` });
  // Você → No mundo: o painel "A época"
  await ir('Você');
  const mundo = p.getByRole('tab', { name: /No mundo|Mundo/ }).or(p.getByRole('button', { name: /No mundo/ })).first();
  if (await mundo.count()) { await mundo.click().catch(() => {}); await p.waitForTimeout(900); }
  const painel = await p.locator('.painel-epoca').count();
  if (!painel) problemas.push(`${tag}: sem painel A época`);
  else { await p.locator('.painel-epoca').scrollIntoViewIfNeeded(); await p.screenshot({ path: `${OUT}/${tag}-epoca.png` }); }
  const textoPainel = painel ? await p.locator('.painel-epoca').innerText() : '';
  if (/NaN|undefined|Infinity/.test(textoPainel)) problemas.push(`${tag}: painel com NaN/undefined`);
  await lateral('No mundo');
  // O aparelho
  const cel = p.locator('.cabecalho__celular').first();
  let meio = '-';
  if (await cel.count()) {
    await cel.click(); await p.waitForTimeout(900);
    meio = await p.locator('.cel__aparelho').getAttribute('data-meio').catch(() => '?');
    const apps = await p.locator('.cel__app-nome').allInnerTexts().catch(() => []);
    meio += ` [${apps.join(', ')}]`;
    await p.screenshot({ path: `${OUT}/${tag}-aparelho.png` });
    await p.keyboard.press('Escape'); await p.waitForTimeout(400);
    const fechar = p.getByRole('button', { name: /Guardar o celular|Pôr o fone no gancho|Fechar/ }).first();
    if (await p.locator('.cel__aparelho').count() && await fechar.count()) { await fechar.click().catch(() => {}); await p.waitForTimeout(400); }
  }
  // Viver um ano
  const avancar = p.locator('.avancar__botao');
  if (await avancar.isEnabled().catch(() => false)) { await avancar.click(); await p.waitForTimeout(2500); }
  for (let k = 0; k < 10; k++) { const op = p.locator('.momento button, .decisao button, .resultado button').first(); if (await op.count()) { await op.click().catch(() => {}); await p.waitForTimeout(400); } else break; }
  const cab2 = (await p.locator('.cabecalho__eu-texto').innerText().catch(() => '')).replace(/\n/g, ' ');
  await lateral('depois do ano');
  if (/NaN|undefined/.test(cab + cab2)) problemas.push(`${tag}: cabeçalho com NaN/undefined`);
  if (erros.length) problemas.push(`${tag}: erros ${[...new Set(erros)].slice(0, 3).join(' | ')}`);
  console.log(`${tag}: [${cab}] → [${cab2}] · aparelho ${meio} · erros ${erros.length}`);
  await ctx.close();
}
await b.close();
console.log(problemas.length ? `PROBLEMAS (${problemas.length}):\n- ${problemas.join('\n- ')}` : 'sem problemas');
