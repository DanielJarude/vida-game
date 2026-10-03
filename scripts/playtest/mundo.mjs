// Capturas do ATT Mundo (nascer em outro país, no mundo, cidade e custo, mudar de país, viagens, jogador no exterior,
// formação no Japão, legado com herdeira no exterior), em 1440, 820 e 390, com checagem de rolagem horizontal, erro de
// página e texto técnico vazando.
//   npm run build && npx vite preview --port 4173 &
//   (saves: scripts/playtest/gerarMundo.ts)  SP=/tmp/vida-mundo node scripts/playtest/mundo.mjs
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const SP = process.env.SP ?? '/tmp/vida-mundo';
const URL = process.env.URL ?? 'http://localhost:4173/';
const b = await chromium.launch();
const problemas = [];

async function aba(p, nome) {
  let bt = p.getByRole('button', { name: nome, exact: true }).locator('visible=true').first();
  if (!(await bt.count())) bt = p.locator('.barra__item', { hasText: nome === 'Tempo livre' ? 'Tempo' : nome === 'Linha da Vida' ? 'História' : nome }).first();
  await bt.click();
  await p.waitForTimeout(300);
}
async function abrirSecao(p, titulo) {
  const s = p.getByRole('button', { name: new RegExp(`^${titulo}`) }).first();
  if (await s.count()) { await s.scrollIntoViewIfNeeded(); if ((await s.getAttribute('aria-expanded')) !== 'true') await s.click(); await p.waitForTimeout(250); }
}

const cenas = [
  ['nascer', null, async p => {
    await p.getByRole('button', { name: 'Trocar o país' }).click();
    await p.getByLabel('Buscar pelo nome').fill('Jap');
    await p.waitForTimeout(200);
  }],
  ['nascer-japao', null, async p => {
    await p.getByRole('button', { name: 'Trocar o país' }).click();
    await p.getByLabel('Buscar pelo nome').fill('Jap');
    await p.getByRole('button', { name: /^Japão/ }).click();
    await p.waitForTimeout(200);
  }],
  ['argentina', 'Você', async p => { await abrirSecao(p, 'No mundo'); }],
  ['argentina', 'Vida', async p => { await p.getByRole('tab', { name: 'Cidade' }).click(); await p.waitForTimeout(250); }],
  ['argentina', 'Tempo livre', async p => { const ver = p.getByRole('button', { name: 'Ver destinos' }); if (await ver.count()) { await ver.last().click(); await p.waitForTimeout(300); } }],
  ['migrante', 'Linha da Vida', null],
  ['migrante', 'Você', async p => { await abrirSecao(p, 'No mundo'); }],
  ['migrante', 'Vida', async p => { await p.getByRole('tab', { name: 'Cidade' }).click(); await p.waitForTimeout(250); await abrirSecao(p, 'Mudar de país'); await p.getByRole('button', { name: /^Trabalhar/ }).click(); await p.waitForTimeout(200); await p.getByRole('button', { name: /^América do Sul/ }).click(); await p.waitForTimeout(200); }],
  ['jogador', 'Trabalho', null],
  ['jogador', 'Linha da Vida', null],
  ['japao', 'Formação', null],
  ['japao', 'Pessoas', null],
  ['legado', null, null]
];
for (const [cen, nome, depois] of cenas.filter(c => !process.env.SO || process.env.SO.split(',').includes(c[0]))) {
  for (const w of [1440, 820, 390]) {
    const ctx = await b.newContext({ viewport: { width: w, height: w < 800 ? 844 : 900 } });
    const p = await ctx.newPage();
    p.on('pageerror', e => problemas.push(`${cen} ${w}: ${e.message}`));
    p.on('console', m => { if (m.type() === 'error') problemas.push(`${cen} ${w}: console ${m.text().slice(0, 160)}`); });
    await p.goto(URL);
    if (cen.startsWith('nascer')) {
      await p.evaluate(() => localStorage.clear());
      await p.goto(URL);
      await p.getByRole('button', { name: /Nascer/ }).first().click();
      await p.waitForTimeout(400);
    } else {
      await p.evaluate(s => { localStorage.clear(); localStorage.setItem('VIDA_GAME_SAVE_V1', s); }, readFileSync(`${SP}/${cen}.json`, 'utf8'));
      await p.goto(URL);
      await p.getByRole('button', { name: /Continuar a vida|Voltar ao legado/ }).click();
      await p.waitForTimeout(500);
    }
    try {
      if (nome) await aba(p, nome);
      if (depois) await depois(p);
    } catch (e) { problemas.push(`${cen} ${nome} ${w}: ${e.message.split('\n')[0]}`); }
    const rolagem = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    if (rolagem) problemas.push(`${cen} ${nome} ${w}: rolagem horizontal`);
    const texto = await p.evaluate(() => document.body.innerText);
    for (const ruim of [/\b[a-z]{2}:[a-z-]+\b/, /undefined|NaN|\[object Object\]/]) { const m = texto.match(ruim); if (m) problemas.push(`${cen} ${nome} ${w}: texto técnico "${m[0]}"`); }
    if (!['legado'].includes(cen) && cen !== 'nascer' && !texto.includes('R$') === false && cen !== 'migrante') { /* só o Brasil fala em R$ */ }
    if (['argentina', 'jogador', 'japao'].includes(cen) && /R\$/.test(texto)) problemas.push(`${cen} ${nome} ${w}: R$ numa vida fora do Brasil`);
    await p.screenshot({ path: `${SP}/${cen}-${(nome ?? 'tela').replace(/ /g, '_')}-${w}.png`, fullPage: true });
    await ctx.close();
  }
}
await b.close();
console.log(problemas.length ? [...new Set(problemas)].join('\n') : 'sem problemas estruturais');
