// Capturas do fechamento do ATT Mundo (playtest humano): Formação nos EUA (o SAT), Tempo livre (sem SESC), Pessoas
// (tipo + estado, não "muito próximo"), a ficha de uma ex-amiga (o porquê, fazer as pazes), a de uma colega (como uma
// amizade nasce), Compras · Transporte (a carteira de Illinois), os bichos, a escolha do país ao nascer e a mudança de
// país — em 1440, 820 e 390, com checagem de rolagem horizontal, erro de página, texto técnico e INSTITUIÇÃO
// BRASILEIRA numa vida que mora nos EUA.
//   npm run build && npx vite preview --port 4173 &
//   (saves: scripts/playtest/gerarFechamento.ts)  SP=/tmp/vida-fechamento node scripts/playtest/fechamento.mjs
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const SP = process.env.SP ?? '/tmp/vida-fechamento';
const URL = process.env.URL ?? 'http://localhost:4173/';
const b = await chromium.launch();
const problemas = [];
const BRASIL = /\bSESC\b|\bSUS\b|\bUBS\b|\bUPA\b|\bENEM\b|\bSISU\b|ProUni|\bFIES\b|\bCNH\b|Detran|\bINSS\b|\bFGTS\b|\bIPVA\b|\bIPTU\b|jovem aprendiz|instituto federal|supletivo|\bEJA\b|R\$|muito próxim/;

async function aba(p, nome) {
  let bt = p.getByRole('button', { name: nome, exact: true }).locator('visible=true').first();
  if (!(await bt.count())) bt = p.locator('.barra__item', { hasText: nome === 'Tempo livre' ? 'Tempo' : nome }).first();
  await bt.click();
  await p.waitForTimeout(300);
}
const abrirPessoa = nome => async p => {
  await aba(p, 'Pessoas');
  // As seções recolhidas (do dia a dia, gente que passou) abrem antes de procurar a pessoa.
  for (const nomeSecao of [/^Da escola e do bairro/, /^Do dia a dia/, /^Gente que passou/]) {
    const s = p.getByRole('button', { name: nomeSecao }).first();
    if (await s.count() && (await s.getAttribute('aria-expanded')) === 'false') { await s.click(); await p.waitForTimeout(150); }
  }
  await p.getByRole('button', { name: new RegExp(nome) }).first().click();
  await p.waitForTimeout(400);
};

const cenas = [
  ['chicago', 'Formação', null],
  ['chicago', 'Tempo livre', null],
  ['chicago', 'Pessoas', null],
  ['chicago', 'ficha-ex-amiga', abrirPessoa('Madison')],
  ['chicago', 'ficha-brigada', abrirPessoa('Grace')],
  ['chicago', 'ficha-colega', abrirPessoa('Sofia')],
  ['chicago', 'ficha-interesse', abrirPessoa('Noah')],
  ['chicago', 'transporte', async p => { await aba(p, 'Vida'); const t = p.getByRole('tab', { name: 'Compras' }); if (await t.count()) await t.click(); await p.waitForTimeout(300); }],
  ['adulta', 'Pessoas', null],
  ['adulta', 'ficha-cachorro', abrirPessoa('Bolt')],
  ['adulta', 'mudar-de-pais', async p => { await aba(p, 'Vida'); await p.getByRole('tab', { name: 'Cidade' }).click(); await p.waitForTimeout(250); const s = p.getByRole('button', { name: /^Mudar de país/ }).first(); if (await s.count()) { await s.click(); await p.waitForTimeout(250); } }],
  ['nascer', 'pais', async p => { await p.getByRole('button', { name: 'Trocar o país' }).click(); await p.getByLabel('Buscar pelo nome').fill('Est'); await p.waitForTimeout(200); }]
];
for (const [cen, nome, depois] of cenas.filter(c => !process.env.SO || process.env.SO.split(',').includes(c[1]))) {
  for (const w of [1440, 820, 390]) {
    const ctx = await b.newContext({ viewport: { width: w, height: w < 800 ? 844 : 900 } });
    const p = await ctx.newPage();
    p.on('pageerror', e => problemas.push(`${cen} ${w}: ${e.message}`));
    p.on('console', m => { if (m.type() === 'error') problemas.push(`${cen} ${w}: console ${m.text().slice(0, 160)}`); });
    await p.goto(URL);
    if (cen === 'nascer') {
      await p.evaluate(() => localStorage.clear());
      await p.goto(URL);
      await p.getByRole('button', { name: /Nascer/ }).first().click();
      await p.waitForTimeout(400);
    } else {
      await p.evaluate(s => { localStorage.clear(); localStorage.setItem('VIDA_GAME_SAVE_V1', s); }, readFileSync(`${SP}/${cen}.json`, 'utf8'));
      await p.goto(URL);
      await p.getByRole('button', { name: /Continuar a vida/ }).click();
      await p.waitForTimeout(500);
    }
    try {
      if (!depois && nome) await aba(p, nome);
      if (depois) await depois(p);
    } catch (e) { problemas.push(`${cen} ${nome} ${w}: ${e.message.split('\n')[0]}`); }
    const rolagem = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    if (rolagem) problemas.push(`${cen} ${nome} ${w}: rolagem horizontal`);
    const texto = await p.evaluate(() => document.body.innerText);
    for (const ruim of [/\b[a-z]{2}:[a-z-]+\b/, /undefined|NaN|\[object Object\]/]) { const m = texto.match(ruim); if (m) problemas.push(`${cen} ${nome} ${w}: texto técnico "${m[0]}"`); }
    if (cen !== 'nascer') { const m = texto.match(BRASIL); if (m) problemas.push(`${cen} ${nome} ${w}: o Brasil numa vida que mora nos EUA: "${m[0]}" — …${texto.slice(Math.max(0, m.index - 60), m.index + 60).replace(/\n/g, ' ')}…`); }
    // Botões cortados e modal fora da tela: nenhum botão visível pode sair da largura da janela.
    const fora = await p.evaluate(() => [...document.querySelectorAll('button')].filter(x => { const r = x.getBoundingClientRect(); return r.width > 0 && (r.right > window.innerWidth + 1 || r.left < -1); }).map(x => x.textContent?.slice(0, 40)));
    if (fora.length) problemas.push(`${cen} ${nome} ${w}: botões fora da tela: ${fora.slice(0, 3).join(' | ')}`);
    await p.screenshot({ path: `${SP}/${cen}-${(nome ?? 'tela').replace(/ /g, '_')}-${w}.png`, fullPage: true });
    await ctx.close();
  }
}
await b.close();
console.log(problemas.length ? `PROBLEMAS (${problemas.length}):\n${problemas.join('\n')}` : 'Sem problemas: sem rolagem horizontal, erro de página, texto técnico, instituição brasileira nos EUA ou botão fora da tela.');
