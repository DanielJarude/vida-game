// REWORK 9.6 — as mesmas telas no build da base (ANTES=1, 4fceb06) e no novo, com os mesmos saves: a vaga aberta com
// conteúdo longo, Caminhos aos 17, o boletim, Você, a tela Nascer. Captura da janela (o que o jogador vê).
//   SP=<pasta> URL=http://localhost:4175/ ANTES=1 node scripts/playtest/antesDepois96.mjs → <SP>/antesdepois/
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';
const SP = process.env.SP, URL = process.env.URL, ANTES = !!process.env.ANTES;
const OUT = `${SP}/antesdepois`; mkdirSync(OUT, { recursive: true });
const save = n => { for (const p of ['r96', 'r95', 'r9', 'r7', 'r6']) { try { return readFileSync(`${SP}/saves/vida-${p}-${n}.json`, 'utf8'); } catch { /* */ } } throw new Error(n); };
const CENAS = [
  ['vaga', 'vaga-longa', ANTES ? ['area:Caminhos', 'aba:Oportunidades', 'vaga', 'rolar:.vaga-camada--aberta'] : ['area:Caminhos', 'div:Trabalho', 'aba:Vagas', 'vaga', 'rolar:.vaga-camada--aberta']],
  ['caminhos', 'tecnico', ['area:Caminhos']],
  ['boletim', 'dedicada', ANTES ? ['area:Caminhos', 'aba:Desenvolvimento', 'rolar:.boletim'] : ['area:Caminhos', 'div:Estudos', 'aba:Boletim', 'rolar:.boletim']],
  ['voce', 'jovem', ['area:Você', ANTES ? 'rolar:#voce-agora' : 'rolar:#voce-atributos']],
  ['nascer', 'empregado', ['nascer']]
];
const b = await chromium.launch();
for (const w of [1440, 390]) for (const [nome, sv, passos] of CENAS) {
  const ctx = await b.newContext({ viewport: { width: w, height: w < 800 ? 800 : 900 } });
  const p = await ctx.newPage();
  await p.goto(URL);
  await p.evaluate(s => { localStorage.clear(); localStorage.setItem('VIDA_APARENCIA', 'claro'); localStorage.setItem('VIDA_GAME_SAVE_V1', s); }, save(sv));
  await p.goto(URL); await p.waitForTimeout(300);
  if (passos[0] === 'nascer') { await p.getByRole('button', { name: /Nascer de novo/ }).click(); await p.waitForTimeout(500); }
  else { await p.getByRole('button', { name: /Continuar a vida/ }).click(); await p.waitForTimeout(400); }
  for (const ps of passos) {
    if (ps.startsWith('area:')) { const a = ps.slice(5); let bt = p.locator('.barra__item', { hasText: a }).locator('visible=true').first(); if (!(await bt.count())) bt = p.getByRole('button', { name: a, exact: true }).locator('visible=true').first(); await bt.click(); }
    else if (ps.startsWith('div:')) await p.locator('.divisoes-caminhos__item', { hasText: ps.slice(4) }).first().click();
    else if (ps.startsWith('aba:')) await p.getByRole('tab', { name: ps.slice(4), exact: true }).first().click();
    else if (ps === 'vaga') { await p.locator('.vaga-resumo').first().click(); if (process.env.LONGO !== '0') await p.evaluate(() => { const d = document.querySelector('.vaga-camada__detalhe'); if (!d || d.querySelector('.anuncio')) return; const s = document.createElement('span'); s.className = 'vaga-camada__aviso'; s.textContent = '! Entrar aqui é deixar o trabalho de auxiliar administrativa. Conflito de horário com o curso de administração à noite: se passar, a vida pergunta o que fazer.'; d.insertBefore(s, d.lastElementChild); }); }
    else if (ps.startsWith('rolar:')) await p.evaluate(sel => { const e = document.querySelector(sel); if (e) { e.scrollIntoView({ block: 'start' }); window.scrollBy(0, -70); } }, ps.slice(6));
    await p.waitForTimeout(300);
  }
  await p.screenshot({ path: `${OUT}/${nome}-${ANTES ? 'antes' : 'depois'}-${w}.png` });
  await ctx.close();
}
await b.close();
