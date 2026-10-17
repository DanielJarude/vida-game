// REWORK 7 — desempenho da interface, antes × depois: o tempo do clique numa área (ou numa ficha) até a tela nova
// renderizada e com o layout calculado, com a mesma vida salva, nos dois builds (a base e o novo, cada um no seu `vite preview`).
//   ANTES=http://localhost:4174/ DEPOIS=http://localhost:4173/ SP=<pasta com saves/> node scripts/playtest/desempenho7.mjs
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const SP = process.env.SP ?? '/tmp/vida-r7';
const URLS = { antes: process.env.ANTES ?? 'http://localhost:4174/', depois: process.env.DEPOIS ?? 'http://localhost:4173/' };
const SAVES = (process.env.SAVES ?? 'empregado,rica,idosa').split(',');
const AREAS = ['Você', 'Pessoas', 'Formação', 'Trabalho', 'Tempo livre', 'Vida', 'Linha da Vida'];
const VEZES = Number(process.env.VEZES ?? 5);
const save = n => { for (const p of ['r7', 'r6']) { try { return readFileSync(`${SP}/saves/vida-${p}-${n}.json`, 'utf8'); } catch { /* próximo */ } } throw new Error(n); };
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
    const tempos = {};
    for (let k = 0; k < VEZES; k++) {
      for (const a of AREAS) {
        const t = await p.evaluate(rotulo => new Promise(res => {
          const bt = [...document.querySelectorAll('.abas .aba')].find(x => x.getAttribute('aria-label') === rotulo);
          const t0 = performance.now();
          bt.click();
          // O React agenda a renderização do clique (microtarefa/tarefa do agendador); uma tarefa postada DEPOIS do
          // clique roda depois dela — e ler a altura ali força o layout da tela nova.
          const ch = new MessageChannel();
          ch.port1.onmessage = () => { void document.body.offsetHeight; res(performance.now() - t0); };
          ch.port2.postMessage(0);
        }), a);
        (tempos[a] ??= []).push(t);
      }
    }
    // Abrir a primeira ficha de pessoa (o modal mais pesado).
    const fichas = [];
    for (let k = 0; k < VEZES; k++) {
      await p.evaluate(() => [...document.querySelectorAll('.abas .aba')].find(x => x.getAttribute('aria-label') === 'Pessoas').click());
      await p.waitForTimeout(150);
      const t = await p.evaluate(() => new Promise(res => { const el = document.querySelector('.cartao-pessoa, .rosto, .pessoa'); const t0 = performance.now(); el?.click(); const ch = new MessageChannel(); ch.port1.onmessage = () => { void document.body.offsetHeight; res(performance.now() - t0); }; ch.port2.postMessage(0); }));
      fichas.push(t);
      await p.keyboard.press('Escape');
      await p.waitForTimeout(100);
    }
    saida[nome][sv] = { ...Object.fromEntries(Object.entries(tempos).map(([a, xs]) => [a, Math.round(mediana(xs) * 10) / 10])), ficha: Math.round(mediana(fichas) * 10) / 10 };
    await ctx.close();
  }
}
await b.close();
console.log(JSON.stringify(saida, null, 2));
