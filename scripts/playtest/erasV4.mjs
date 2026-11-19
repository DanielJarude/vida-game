// ERAS v4 — QA da interface: os saves de gerarErasV4.ts. Abre Você → No mundo, confere o painel da sociedade (as barreiras
// com a natureza, os movimentos com as ações, os partidos, o mundo mudado), clica uma ação de movimento, abre Trabalho
// (as reformas do mandato), vive um ano. Conta erros de console, rolagem lateral, texto quebrado; fotografa o painel.
// URL=… SP=<saves> W=1440,390 TEMAS=claro,escuro OUT=<fotos> NOVID='Eras 4'
import { chromium } from 'playwright';
import { readFileSync, readdirSync, mkdirSync } from 'node:fs';
const URL = process.env.URL ?? 'http://localhost:4173/';
const SP = process.env.SP ?? `${process.env.HOME}/vida-trabalho/v4/saves`;
const OUT = process.env.OUT ?? `${process.env.HOME}/vida-trabalho/v4/fotos`;
const NOVID = process.env.NOVID ?? 'Eras 4';
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
const problemas = [];
const LARGURAS = (process.env.W ?? '1440,390').split(',').map(Number);
const TEMAS = (process.env.TEMAS ?? 'claro,escuro').split(',');
const saves = readdirSync(SP).filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
for (const w of LARGURAS) for (const save of saves) {
  const tema = TEMAS[(saves.indexOf(save) + LARGURAS.indexOf(w)) % TEMAS.length];
  const ctx = await b.newContext({ viewport: { width: w, height: w > 800 ? 1000 : 844 } });
  const p = await ctx.newPage();
  const erros = []; p.on('pageerror', e => erros.push(e.message)); p.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  await p.goto(URL);
  await p.evaluate(([n, t]) => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem('VIDA_NOVIDADES_VISTAS', n); localStorage.setItem('VIDA_APARENCIA', t); }, [NOVID, tema]);
  const tag = `${save}@${w}-${tema}`;
  const lateral = async (onde) => { const x = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (x > 1) problemas.push(`${tag} ${onde}: rolagem lateral ${x}px`); };
  const ir = async (nome) => {
    let bt = p.locator('.barra__item', { hasText: nome }).locator('visible=true').first();
    if (!(await bt.count())) bt = p.getByRole('button', { name: new RegExp(`^(Minha )?${nome}$`) }).locator('visible=true').first();
    if (!(await bt.count())) { problemas.push(`${tag}: sem botão da área ${nome}`); return; }
    await bt.click(); await p.waitForTimeout(700);
  };
  const decidir = async () => { for (let k = 0; k < 10; k++) { const op = p.locator('.momento button, .decisao button, .resultado button').first(); if (await op.count()) { await op.click().catch(() => {}); await p.waitForTimeout(400); } else break; } };
  await p.evaluate(s => localStorage.setItem('VIDA_GAME_SAVE_V1', s), readFileSync(`${SP}/${save}.json`, 'utf8'));
  await p.goto(URL); await p.waitForTimeout(800);
  const cont = p.getByRole('button', { name: /Continuar a vida/ });
  await cont.waitFor({ timeout: 20000 }).catch(() => {});
  if (!(await cont.count())) { problemas.push(`${tag}: sem "Continuar a vida"`); await ctx.close(); continue; }
  await cont.click(); await p.waitForTimeout(1500); await decidir();
  await ir('Você');
  const mundo = p.getByRole('tab', { name: /No mundo|Mundo/ }).or(p.getByRole('button', { name: /No mundo/ })).first();
  if (await mundo.count()) { await mundo.click().catch(() => {}); await p.waitForTimeout(1200); }
  const soc = p.locator('.soc4');
  await soc.waitFor({ timeout: 8000 }).catch(() => {});
  if (!(await soc.count())) problemas.push(`${tag}: sem o painel da sociedade`);
  else {
    const txt = await soc.innerText();
    if (/NaN|undefined|Infinity|\[object/.test(txt)) problemas.push(`${tag}: painel com texto quebrado`);
    await soc.scrollIntoViewIfNeeded();
    await soc.screenshot({ path: `${OUT}/${tag}-sociedade.png` });
    const n = { barreiras: await p.locator('.soc4__barreira').count(), movimentos: await p.locator('.soc4__movimento').count(), mudancas: await p.locator('.soc4__mudancas li').count() };
    // Uma ação de movimento (a primeira que estiver liberada): o aviso aparece e nada quebra.
    const acao = p.locator('.soc4__acoes button:not([disabled])').first();
    let fez = '-';
    if (await acao.count()) { fez = await acao.innerText(); await acao.click(); await p.waitForTimeout(1200); await decidir(); }
    console.log(`${tag}: barreiras ${n.barreiras} · movimentos ${n.movimentos} · mudanças ${n.mudancas} · ação "${fez}"`);
  }
  await lateral('No mundo');
  await ir('Caminhos'); await lateral('Caminhos');
  // Caminhos abre nos cartões: o do trabalho leva às ações do mandato.
  const cartao = p.getByText(/^Vida pública$/).locator('visible=true').first();
  if (await cartao.count()) { await cartao.click().catch(() => {}); await p.waitForTimeout(1200); }
  const prop = await p.getByText(/^Propor:/).count();
  if (prop) await p.getByText(/^Propor:/).first().scrollIntoViewIfNeeded().then(() => p.screenshot({ path: `${OUT}/${tag}-reformas.png` })).catch(() => {});
  if (save.includes('BR-1915') && !prop) {
    // O mandato mora em Trabalho → as ações do cargo; procura pelo texto em qualquer parte visível.
    const t = await p.locator('main').innerText().catch(() => '');
    if (!/Propor:/.test(t)) problemas.push(`${tag}: as reformas do mandato não aparecem em Caminhos`);
  }
  const avancar = p.locator('.avancar__botao');
  if (await avancar.isEnabled().catch(() => false)) { await avancar.click(); await p.waitForTimeout(2500); }
  await decidir();
  await lateral('depois do ano');
  if (erros.length) problemas.push(`${tag}: erros ${[...new Set(erros)].slice(0, 3).join(' | ')}`);
  await ctx.close();
}
await b.close();
console.log(problemas.length ? `PROBLEMAS (${problemas.length}):\n- ${problemas.join('\n- ')}` : 'sem problemas');
