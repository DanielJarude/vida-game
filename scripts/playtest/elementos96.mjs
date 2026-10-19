// REWORK 9.6 — capturas de ELEMENTO dos documentos (o boletim inteiro, o anúncio aberto, a ficha de atributos, o
// prontuário, o diário, os certificados, o currículo, a ficha do atleta, os atributos iniciais), em claro e escuro.
//   SP=<pasta com saves/> URL=http://localhost:4174/ node scripts/playtest/elementos96.mjs  → <SP>/elementos/
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';
const SP = process.env.SP, URL = process.env.URL ?? 'http://localhost:4174/';
const OUT = `${SP}/elementos`; mkdirSync(OUT, { recursive: true });
const save = n => { for (const p of ['r96', 'r95', 'r9', 'r8', 'r75', 'r7', 'r6']) { try { return readFileSync(`${SP}/saves/vida-${p}-${n}.json`, 'utf8'); } catch { /* */ } } throw new Error(n); };
const ALVOS = [
  ['boletim', 'dedicada', ['area:Caminhos', 'div:Estudos', 'aba:Boletim'], '.boletim'],
  ['anuncio', 'vaga-longa', ['area:Caminhos', 'div:Trabalho', 'aba:Vagas', 'vaga'], '.vaga-camada--aberta'],
  ['atributos', 'escolhida', ['area:Você', 'atributo:fisico'], '.ficha-atributos'],
  ['atributos-bebe', 'escolhida-0', ['area:Você'], '.ficha-atributos'],
  ['prontuario', 'doente', ['area:Você'], '.prontuario'],
  ['diario', 'empregado', [], '.retrato-vida'],
  ['certificados', 'tecnico', ['area:Caminhos', 'div:Estudos', 'aba:Histórico'], '.certificados'],
  ['curriculo', 'promovido', ['area:Caminhos', 'div:Trabalho', 'aba:Currículo'], '.curriculo'],
  ['atleta', 'atleta', ['area:Caminhos', 'div:Outros caminhos'], '.ficha-atleta'],
  ['inicio', 'tecnico', ['area:Caminhos'], '.pagina-caminhos'],
  ['agenda', 'playtest', ['area:Minha Semana'], '.agenda-semana'],
  ['extrato', 'posses', ['area:Vida', 'secao:Dinheiro'], '.dinheiro'],
  ['album', 'familia', ['area:Pessoas'], '.rostos'],
  ['nascer', 'empregado', ['nascer', 'radio:Escolher'], '.atributos-iniciais']
];
const b = await chromium.launch();
for (const tema of (process.env.TEMAS ?? 'claro,escuro').split(',')) for (const w of (process.env.LARGURAS ?? '1440,390').split(',').map(Number)) for (const [nome, sv, passos, sel] of ALVOS) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(URL);
  await p.evaluate(([s, t]) => { localStorage.clear(); localStorage.setItem('VIDA_APARENCIA', t); localStorage.setItem('VIDA_GAME_SAVE_V1', s); }, [save(sv), tema]);
  await p.goto(URL); await p.waitForTimeout(300);
  if (passos[0] === 'nascer') { await p.getByRole('button', { name: /Nascer de novo/ }).click(); await p.waitForTimeout(400); }
  else { await p.getByRole('button', { name: /Continuar a vida/ }).click(); await p.waitForTimeout(400); }
  for (const ps of passos) {
    if (ps.startsWith('area:')) { const a = ps.slice(5); let bt = p.locator('.barra__item', { hasText: a === 'Minha Semana' ? 'Semana' : a }).locator('visible=true').first(); if (!(await bt.count())) bt = p.getByRole('button', { name: a, exact: true }).locator('visible=true').first(); await bt.click(); }
    else if (ps.startsWith('div:')) await p.locator('.divisoes-caminhos__item', { hasText: ps.slice(4) }).first().click();
    else if (ps.startsWith('aba:') || ps.startsWith('secao:')) await p.getByRole('tab', { name: ps.slice(ps.indexOf(':') + 1), exact: true }).first().click();
    else if (ps === 'vaga') await p.locator('.vaga-resumo').first().click();
    else if (ps.startsWith('atributo:')) { const s = p.locator(`[data-atributo="${ps.slice(9)}"] summary`).first(); if (!(await s.evaluate(x => x.parentElement.open))) await s.click(); }
    else if (ps.startsWith('radio:')) await p.getByRole('radio', { name: ps.slice(6), exact: true }).first().click();
    await p.waitForTimeout(250);
  }
  // o botão "Viver mais um ano" fica preso no fim da tela: some só para a captura do elemento
  await p.addStyleTag({ content: '.avancar, .barra { visibility: hidden !important; }' });
  const el = p.locator(sel).first();
  if (await el.count()) await el.screenshot({ path: `${OUT}/${nome}-${tema}-${w}.png` }); else console.log('sem', nome, tema, w);
  await ctx.close();
}
await b.close();
