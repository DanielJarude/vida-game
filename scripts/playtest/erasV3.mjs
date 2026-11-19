// ERAS v3 — QA da interface: (1) a tela Nascer com a escolha de país, década, ano, mês e dia (cada país, claro e escuro);
// (2) os saves de gerarErasV3.ts: cabeçalho (moeda e país), todas as áreas, o painel "A época", o aparelho (cartas,
// telefone), viver um ano. Conta erros de console, rolagem lateral, texto quebrado (NaN/undefined) e fotografa.
// URL=… SP=<pasta dos saves> W=1440,390 TEMAS=claro,escuro OUT=<fotos>
import { chromium } from 'playwright';
import { readFileSync, readdirSync, mkdirSync } from 'node:fs';
const URL = process.env.URL ?? 'http://localhost:4173/';
const SP = process.env.SP ?? `${process.env.HOME}/vida-trabalho/e3/saves`;
const OUT = process.env.OUT ?? `${process.env.HOME}/vida-trabalho/e3/fotos`;
const NOVID = process.env.NOVID ?? 'Eras 3';
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
const problemas = [];
const AREAS = ['História', 'Você', 'Pessoas', 'Caminhos', 'Semana', 'Vida'];
const LARGURAS = (process.env.W ?? '1440,390').split(',').map(Number);
const TEMAS = (process.env.TEMAS ?? 'claro,escuro').split(',');

async function contexto(w, tema) {
  const ctx = await b.newContext({ viewport: { width: w, height: w > 800 ? 1000 : 844 } });
  const p = await ctx.newPage();
  const erros = []; p.on('pageerror', e => erros.push(e.message)); p.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  await p.goto(URL);
  await p.evaluate(([n, t]) => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem('VIDA_NOVIDADES_VISTAS', n); localStorage.setItem('VIDA_APARENCIA', t); }, [NOVID, tema]);
  return { ctx, p, erros };
}

// ------------------------------------------------------------ (1) A escolha (SO_VIDAS=1 pula)
for (const w of process.env.SO_VIDAS ? [] : LARGURAS) for (const tema of TEMAS) {
  const { ctx, p, erros } = await contexto(w, tema);
  const tag = `nascer@${w}-${tema}`;
  await p.goto(URL); await p.waitForTimeout(1200);
  await p.getByRole('button', { name: /Nascer de novo/ }).click(); await p.waitForTimeout(1500);
  for (const [pais, decada, ano] of [['Brasil', '1920', '1924'], ['Estados Unidos', '1940', '1946'], ['Reino Unido', '1910', '1914'], ['Alemanha', '1950', '1953'], ['Japão', '1930', '1931'], ['Argentina', '1970', '1976']]) {
    await p.locator('.epoca__porta', { hasText: pais }).first().click(); await p.waitForTimeout(500);
    await p.locator('.epoca__decada', { hasText: decada }).first().click(); await p.waitForTimeout(300);
    await p.locator('.epoca__ano', { hasText: ano }).first().click(); await p.waitForTimeout(300);
    const mes = p.locator('.epoca__campo select').first();
    if (await mes.count()) { await mes.selectOption('3'); await p.locator('.epoca__campo select').nth(1).selectOption('12'); }
    await p.waitForTimeout(500);
    const txt = await p.locator('.epoca').innerText();
    if (/NaN|undefined|null/.test(txt)) problemas.push(`${tag} ${pais}: texto quebrado`);
    if (!txt.includes(pais)) problemas.push(`${tag} ${pais}: a prévia não diz o país`);
    if (pais === 'Japão' && !/era Shōwa/.test(txt)) problemas.push(`${tag}: sem a era Shōwa na data`);
    const x = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (x > 1) problemas.push(`${tag} ${pais}: rolagem lateral ${x}px`);
    await p.locator('.epoca').screenshot({ path: `${OUT}/${tag}-${pais.replace(/ /g, '_')}.png` });
  }
  // Nascer no último escolhido: a Argentina de 1976 (a moeda é o peso lei).
  await p.locator('.criacao__nascer').click(); await p.waitForTimeout(2500);
  const cab = (await p.locator('.cabecalho__eu-texto').innerText().catch(() => '')).replace(/\n/g, ' ');
  if (!/1976/.test(cab) || !/Argentina/.test(cab)) problemas.push(`${tag}: nascimento não começou na Argentina de 1976 [${cab}]`);
  if (erros.length) problemas.push(`${tag}: erros ${[...new Set(erros)].slice(0, 3).join(' | ')}`);
  console.log(`${tag}: nasceu [${cab}] · erros ${erros.length}`);
  await ctx.close();
}

// ------------------------------------------------------------ (2) As vidas
const saves = readdirSync(SP).filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
for (const w of LARGURAS) for (const save of saves) {
  const tema = TEMAS[saves.indexOf(save) % TEMAS.length];
  const { ctx, p, erros } = await contexto(w, tema);
  const tag = `${save}@${w}-${tema}`;
  const lateral = async (onde) => { const x = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (x > 1) problemas.push(`${tag} ${onde}: rolagem lateral ${x}px`); };
  const ir = async (nome) => {
    let bt = p.locator('.barra__item', { hasText: nome }).locator('visible=true').first();
    if (!(await bt.count())) bt = p.getByRole('button', { name: new RegExp(`^(Minha )?${nome}$`) }).locator('visible=true').first();
    if (!(await bt.count())) { problemas.push(`${tag}: sem botão da área ${nome}`); return; }
    await bt.click(); await p.waitForTimeout(700);
  };
  await p.evaluate(s => localStorage.setItem('VIDA_GAME_SAVE_V1', s), readFileSync(`${SP}/${save}.json`, 'utf8'));
  await p.goto(URL); await p.waitForTimeout(800);
  const cont = p.getByRole('button', { name: /Continuar a vida/ });
  await cont.waitFor({ timeout: 20000 }).catch(() => {});
  if (!(await cont.count())) { problemas.push(`${tag}: sem "Continuar a vida"`); await ctx.close(); continue; }
  await cont.click(); await p.waitForTimeout(1500);
  for (let k = 0; k < 8; k++) { const op = p.locator('.momento button, .decisao button, .resultado button').first(); if (await op.count()) { await op.click().catch(() => {}); await p.waitForTimeout(400); } else break; }
  const cab = (await p.locator('.cabecalho__eu-texto').innerText().catch(() => '')).replace(/\n/g, ' ');
  for (const a of AREAS) { await ir(a); await lateral(a); }
  await ir('História'); await p.screenshot({ path: `${OUT}/${tag}-historia.png` });
  await ir('Você');
  const mundo = p.getByRole('tab', { name: /No mundo|Mundo/ }).or(p.getByRole('button', { name: /No mundo/ })).first();
  if (await mundo.count()) { await mundo.click().catch(() => {}); await p.waitForTimeout(900); }
  const painel = await p.locator('.painel-epoca').count();
  if (!painel) problemas.push(`${tag}: sem painel A época`);
  else { await p.locator('.painel-epoca').scrollIntoViewIfNeeded(); await p.locator('.painel-epoca').screenshot({ path: `${OUT}/${tag}-epoca.png` }); }
  const textoPainel = painel ? await p.locator('.painel-epoca').innerText() : '';
  if (/NaN|undefined|Infinity/.test(textoPainel)) problemas.push(`${tag}: painel com NaN/undefined`);
  await lateral('No mundo');
  const cel = p.locator('.cabecalho__celular').first();
  let meio = '-';
  if (await cel.count()) {
    await cel.click(); await p.waitForTimeout(900);
    meio = await p.locator('.cel__aparelho').getAttribute('data-meio').catch(() => '?');
    await p.locator('.cel__aparelho').screenshot({ path: `${OUT}/${tag}-aparelho.png` }).catch(() => {});
    await p.keyboard.press('Escape'); await p.waitForTimeout(400);
    const fechar = p.getByRole('button', { name: /Guardar|Pôr o fone no gancho|Fechar/ }).first();
    if (await p.locator('.cel__aparelho').count() && await fechar.count()) { await fechar.click().catch(() => {}); await p.waitForTimeout(400); }
  }
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
