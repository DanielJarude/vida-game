// REWORK 8 (Fase A) — a auditoria do bug dos presentes em toda interface com a mesma estrutura (uma coluna de texto ao
// lado de uma coluna `auto` com um botão que pode trazer um motivo): os presentes, cada loja, os pertences e a ficha da
// prática, numa vida sem dinheiro e numa rica, em 360, 390 e 1440 px. Acha texto ESPREMIDO: um texto de 12+ letras
// numa caixa com menos de 70 px de largura que quebra de linha, ou quebrado em mais de 4 linhas sendo curto (o nome
// letra por letra; em tabela, a altura da linha é a da maior célula — lá só vale a largura).
//   npm run build && npx vite preview --port 4173 &   SP=<pasta com saves/> node scripts/playtest/colunas8.mjs
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';
const SP = process.env.SP ?? '/tmp/vida-r75';
const URL = process.env.URL ?? 'http://localhost:4173/';
const OUT = `${SP}/colunas8`;
mkdirSync(OUT, { recursive: true });
const save = n => { for (const p of ['r75', 'r7', 'r6']) { try { return readFileSync(`${SP}/saves/vida-${p}-${n}.json`, 'utf8'); } catch { /* o próximo */ } } throw new Error(n); };

function espremidos() {
  const achados = [];
  for (const el of document.querySelectorAll('.folha *, main *')) {
    if (el.children.length || !el.textContent || el.closest('svg')) continue;
    const t = el.textContent.trim();
    if (t.length < 12) continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const linha = parseFloat(getComputedStyle(el).lineHeight) || 18;
    const linhas = Math.round(r.height / linha);
    if ((r.width < 70 && linhas > 1) || (linhas > 4 && t.length < 40 && !el.closest('td, th'))) achados.push(`"${t.slice(0, 30)}" ${Math.round(r.width)}px × ${linhas} linhas`);
  }
  return [...new Set(achados)].slice(0, 8);
}

const CENAS = [
  // [nome, save, área, passos]
  ['presentes', 'desempregado', 'Pessoas', ['ficha', 'presentes']],
  ['presentes', 'rica', 'Pessoas', ['ficha', 'presentes']],
  ['loja', 'desempregado', 'Vida', ['secao:Compras', 'lojas']],
  ['loja', 'rica', 'Vida', ['secao:Compras', 'lojas']],
  ['pertences', 'jovem', 'Vida', ['secao:Pertences']],
  ['pratica', 'jovem', 'Tempo livre', ['pratica']]
];
const b = await chromium.launch();
const problemas = [];
let telas = 0;
for (const [nome, sv, area, passos] of CENAS) for (const w of [360, 390, 1440]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  await p.goto(URL);
  await p.evaluate(s => { localStorage.clear(); localStorage.setItem('VIDA_GAME_SAVE_V1', s); }, save(sv));
  await p.goto(URL);
  await p.getByRole('button', { name: /Continuar a vida/ }).click();
  await p.waitForTimeout(400);
  let bt = p.getByRole('button', { name: area, exact: true }).locator('visible=true').first();
  if (!(await bt.count())) bt = p.locator('.barra__item', { hasText: area === 'Tempo livre' ? 'Tempo' : area }).first();
  await bt.click();
  await p.waitForTimeout(300);
  const medir = async rot => { telas++; const x = await p.evaluate(espremidos); if (x.length) problemas.push(`${rot}: ${x.join(' | ')}`); await p.screenshot({ path: `${OUT}/${rot.replace(/[^a-z0-9-]+/gi, '_')}.png` }); };
  for (const passo of passos) {
    if (passo === 'ficha') { await p.locator('.cartao-pessoa, .rosto, .pessoa').first().click(); await p.waitForTimeout(300); }
    else if (passo === 'presentes') { const g = p.getByRole('button', { name: /^Dar um presente/ }).first(); if (await g.count()) { await g.click(); await p.waitForTimeout(250); await p.locator('.presentes').first().scrollIntoViewIfNeeded(); } }
    else if (passo === 'pratica') { const r = p.locator('.pratica__abrir').first(); if (await r.count()) { await r.click(); await p.waitForTimeout(300); } }
    else if (passo.startsWith('secao:')) { await p.getByRole('tab', { name: passo.slice(6), exact: true }).first().click(); await p.waitForTimeout(300); }
    else if (passo === 'lojas') {
      // Cada loja aberta, uma de cada vez (a folha fecha com Esc).
      const n = await p.locator('.vitrine__abrir').count();
      for (let k = 0; k < n; k++) {
        await p.locator('.vitrine__abrir').nth(k).click(); await p.waitForTimeout(300);
        await medir(`${nome}-${sv}-${w}-loja${k}`);
        await p.keyboard.press('Escape'); await p.waitForTimeout(150);
      }
      continue;
    }
  }
  if (!passos.includes('lojas')) await medir(`${nome}-${sv}-${w}`);
  await p.close();
}
await b.close();
console.log(JSON.stringify({ telas, problemas }, null, 1));
