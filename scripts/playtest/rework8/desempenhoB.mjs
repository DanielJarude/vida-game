// REWORK 8 (Fase B) — desempenho das telas com mais ilustração, antes × depois: o tempo do clique numa seção de Vida
// (Casa, Compras, Pertences, Cidade) até a tela nova renderizada e com o layout calculado, com a mesma vida salva, nos
// dois builds (a Fase A e a Fase B, cada um no seu `vite preview`). A mesma medição de `desempenho7.mjs`.
//   ANTES=http://localhost:4174/ DEPOIS=http://localhost:4173/ SP=<pasta com saves/> node scripts/playtest/rework8/desempenhoB.mjs
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const SP = process.env.SP ?? '/tmp/vida-r8';
const URLS = { antes: process.env.ANTES ?? 'http://localhost:4174/', depois: process.env.DEPOIS ?? 'http://localhost:4173/' };
const SAVES = (process.env.SAVES ?? 'posses,rica,familia').split(',');
const SECOES = ['Compras', 'Pertences', 'Cidade', 'Casa'];
const VEZES = Number(process.env.VEZES ?? 7);
const save = n => { for (const p of ['r8', 'r75', 'r7', 'r6']) { try { return readFileSync(`${SP}/saves/vida-${p}-${n}.json`, 'utf8'); } catch { /* próximo */ } } throw new Error(n); };
const mediana = xs => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };

const b = await chromium.launch();
const saida = {};
for (const [nome, url] of Object.entries(URLS)) {
  saida[nome] = {};
  for (const sv of SAVES) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
    await p.goto(url);
    await p.evaluate(s => { localStorage.clear(); localStorage.setItem('VIDA_GAME_SAVE_V1', s); }, save(sv));
    await p.goto(url);
    await p.waitForTimeout(400);
    await p.getByRole('button', { name: /Continuar a vida/ }).click();
    await p.waitForTimeout(600);
    await p.evaluate(() => [...document.querySelectorAll('.abas .aba')].find(x => x.getAttribute('aria-label') === 'Vida').click());
    await p.waitForTimeout(500);
    const tempos = {};
    for (let k = 0; k < VEZES; k++) {
      for (const s of SECOES) {
        const t = await p.evaluate(rotulo => new Promise(res => {
          const bt = [...document.querySelectorAll('[role=tab]')].find(x => x.textContent.trim() === rotulo);
          const t0 = performance.now();
          bt.click();
          const ch = new MessageChannel();
          ch.port1.onmessage = () => { void document.body.offsetHeight; res(performance.now() - t0); };
          ch.port2.postMessage(0);
        }), s);
        (tempos[s] ??= []).push(t);
      }
    }
    saida[nome][sv] = Object.fromEntries(Object.entries(tempos).map(([a, xs]) => [a, Math.round(mediana(xs) * 10) / 10]));
    await ctx.close();
  }
}
await b.close();
console.log(JSON.stringify(saida, null, 2));
