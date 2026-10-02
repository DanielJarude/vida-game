// Capturas do pacote pré-América do Sul (legado e sucessão, linhagem, rico sem trabalhar, base lesionado, viagens, técnico),
// em 1440, 820 e 390, com checagem de rolagem horizontal e de erro de página.
//   npm run build && npx vite preview --port 4173 &
//   (saves: scripts/playtest/gerarPreAmerica.ts)  SP=/tmp/vida-pa node scripts/playtest/preAmerica.mjs
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const SP = process.env.SP ?? '/tmp/vida-pa';
const URL = process.env.URL ?? 'http://localhost:4173/';
const b = await chromium.launch();
const problemas = [];

async function aba(p, nome) {
  let bt = p.getByRole('button', { name: nome, exact: true }).locator('visible=true').first();
  if (!(await bt.count())) bt = p.locator('.barra__item', { hasText: nome === 'Tempo livre' ? 'Tempo' : nome === 'Linha da Vida' ? 'História' : nome }).first();
  await bt.click();
  await p.waitForTimeout(300);
}

const cenas = [
  ['legado', null, async p => { await p.getByText('Decidir o destino do patrimônio').click(); await p.waitForTimeout(200); await p.getByRole('button', { name: /, 44 · filha/ }).click(); await p.waitForTimeout(200); }],
  ['herdeira', 'Você', async p => { const s = p.getByRole('heading', { name: 'Quem veio antes' }); await s.scrollIntoViewIfNeeded(); const g = p.locator('.linhagem__geracao summary').first(); await g.click(); await p.waitForTimeout(200); }],
  ['herdeira', 'Pessoas', null],
  ['rico', 'Trabalho', null],
  ['rico', 'Vida', async p => { const d = p.getByRole('button', { name: /^Dinheiro/ }).first(); if (await d.count()) { await d.click(); await p.waitForTimeout(300); } }],
  ['base', 'Você', null],
  ['viajante', 'Tempo livre', async p => { const ver = p.getByRole('button', { name: 'Ver destinos' }); if (await ver.count()) { await ver.last().click(); await p.waitForTimeout(300); } }],
  ['tecnico', 'Trabalho', async p => { const s = p.getByRole('button', { name: /^Carreira como técnico/ }).first(); if (await s.count() && (await s.getAttribute('aria-expanded')) !== 'true') { await s.click(); await p.waitForTimeout(200); } }]
];
for (const [cen, nome, depois] of cenas.filter(c => !process.env.SO || process.env.SO.split(',').includes(c[0]))) {
  for (const w of [1440, 820, 390]) {
    const ctx = await b.newContext({ viewport: { width: w, height: w < 800 ? 844 : 900 } });
    const p = await ctx.newPage();
    p.on('pageerror', e => problemas.push(`${cen} ${w}: ${e.message}`));
    await p.goto(URL);
    await p.evaluate(s => { localStorage.clear(); localStorage.setItem('VIDA_GAME_SAVE_V1', s); }, readFileSync(`${SP}/${cen}.json`, 'utf8'));
    await p.goto(URL);
    await p.getByRole('button', { name: /Continuar a vida|Voltar ao legado/ }).click();
    await p.waitForTimeout(400);
    try {
      if (nome) await aba(p, nome);
      if (depois) await depois(p);
    } catch (e) { problemas.push(`${cen} ${nome} ${w}: ${e.message.split('\n')[0]}`); }
    const rolagem = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    if (rolagem) problemas.push(`${cen} ${nome} ${w}: rolagem horizontal`);
    await p.screenshot({ path: `${SP}/${cen}-${(nome ?? 'fim').replace(/ /g, '_')}-${w}.png`, fullPage: true });
    await ctx.close();
  }
}
await b.close();
console.log(problemas.length ? problemas.join('\n') : 'sem problemas estruturais');
