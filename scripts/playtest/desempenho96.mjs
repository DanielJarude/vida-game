// REWORK 9.6 — a mesma medida do REWORK 9.5 (base 4fceb06 × novo), e as divisões de Caminhos: depois de abrir
// Caminhos, ANTES troca as partes (Desenvolvimento, Oportunidades, Histórico, Agora); DEPOIS entra em cada divisão
// (Estudos, Trabalho, Vida pública, Outros caminhos, Início).
// (Base: desempenho95.mjs.) REWORK 9.5 — desempenho da interface, antes × depois (a base é o REWORK 9, 07e53dc): o tempo do clique numa área até a
// tela nova renderizada e com o layout calculado, com a mesma vida salva, nos dois builds — e o tempo de trocar de parte
// dentro de Caminhos (Agora → Desenvolvimento → Oportunidades → Histórico), que antes desenhava as quatro.
// LARGURA=390 mede no celular (a barra de baixo).
//   ANTES=http://localhost:4174/ DEPOIS=http://localhost:4173/ SP=<pasta com saves/> node scripts/playtest/desempenho95.mjs
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const SP = process.env.SP ?? '/tmp/vida-r7';
const URLS = { antes: process.env.ANTES ?? 'http://localhost:4174/', depois: process.env.DEPOIS ?? 'http://localhost:4173/' };
const SAVES = (process.env.SAVES ?? 'empregado,rica,idosa').split(',');
const SEIS = ['Você', 'Pessoas', 'Caminhos', 'Minha Semana', 'Vida', 'História'];
const AREAS = { antes: SEIS, depois: SEIS };
const PARTES = ['Desenvolvimento', 'Oportunidades', 'Histórico', 'Agora'];
const LARGURA = Number(process.env.LARGURA ?? 1440);
const VEZES = Number(process.env.VEZES ?? 5);
const save = n => { for (const p of ['r96', 'r95', 'r9', 'r8', 'r75', 'r7', 'r6']) { try { return readFileSync(`${SP}/saves/vida-${p}-${n}.json`, 'utf8'); } catch { /* próximo */ } } throw new Error(n); };
const mediana = xs => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };

const b = await chromium.launch();
const saida = {};
for (const [nome, url] of Object.entries(URLS)) {
  saida[nome] = {};
  for (const sv of SAVES) {
    const ctx = await b.newContext({ viewport: { width: LARGURA, height: LARGURA < 800 ? 800 : 900 } });
    const p = await ctx.newPage();
    await p.goto(url);
    await p.evaluate(s => { localStorage.clear(); localStorage.setItem('VIDA_GAME_SAVE_V1', s); }, save(sv));
    await p.goto(url);
    await p.waitForTimeout(400);
    await p.getByRole('button', { name: /Continuar a vida/ }).click();
    await p.waitForTimeout(600);
    const tempos = {};
    for (let k = 0; k < VEZES; k++) {
      for (const a of AREAS[nome]) {
        const t = await p.evaluate(rotulo => new Promise(res => {
          const bt = [...document.querySelectorAll('.abas .aba')].find(x => x.getAttribute('aria-label') === rotulo) ?? [...document.querySelectorAll('.barra__item')].find(x => x.textContent.trim() === rotulo || (rotulo === 'Minha Semana' && x.textContent.trim() === 'Semana') || (rotulo === 'Tempo livre' && x.textContent.trim() === 'Tempo') || (rotulo === 'Linha da Vida' && x.textContent.trim() === 'História'));
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
      await p.evaluate(() => ([...document.querySelectorAll('.abas .aba')].find(x => x.getAttribute('aria-label') === 'Pessoas') ?? [...document.querySelectorAll('.barra__item')].find(x => x.textContent.trim() === 'Pessoas')).click());
      await p.waitForTimeout(150);
      const t = await p.evaluate(() => new Promise(res => { const el = document.querySelector('.cartao-pessoa, .rosto, .pessoa'); const t0 = performance.now(); el?.click(); const ch = new MessageChannel(); ch.port1.onmessage = () => { void document.body.offsetHeight; res(performance.now() - t0); }; ch.port2.postMessage(0); }));
      fichas.push(t);
      await p.keyboard.press('Escape');
      await p.waitForTimeout(100);
    }
    // As partes de Caminhos.
    const partes = {};
    await p.evaluate(() => ([...document.querySelectorAll('.abas .aba')].find(x => x.getAttribute('aria-label') === 'Caminhos') ?? [...document.querySelectorAll('.barra__item')].find(x => x.textContent.trim() === 'Caminhos')).click());
    await p.waitForTimeout(200);
    const DIVISOES = ['Estudos', 'Trabalho', 'Vida pública', 'Outros caminhos', 'Início'];
    for (let k = 0; k < VEZES; k++) for (const parte of (nome === 'antes' ? PARTES : DIVISOES)) {
      const t = await p.evaluate(([rotulo, div]) => new Promise(res => { const bt = div ? [...document.querySelectorAll('.divisoes-caminhos__item')].find(x => x.textContent.trim() === rotulo) : [...document.querySelectorAll('[role=tab]')].find(x => x.textContent.trim() === rotulo); const t0 = performance.now(); bt?.click(); const ch = new MessageChannel(); ch.port1.onmessage = () => { void document.body.offsetHeight; res(performance.now() - t0); }; ch.port2.postMessage(0); }), [parte, nome !== 'antes']);
      (partes[`Caminhos·${parte}`] ??= []).push(t);
    }
    // Trabalho · Vagas (a procura: o custo da aba que mais pesa), nos dois: ANTES = Oportunidades; DEPOIS = Trabalho → Vagas.
    for (let k = 0; k < VEZES; k++) {
      // (a divisão lembra a parte aberta: volta a Agora antes de medir a ida às Vagas)
      if (nome !== 'antes') { await p.evaluate(() => [...document.querySelectorAll('.divisoes-caminhos__item')].find(x => x.textContent.trim() === 'Trabalho')?.click()); await p.waitForTimeout(120); await p.evaluate(() => [...document.querySelectorAll('[role=tab]')].find(x => x.textContent.trim() === 'Agora')?.click()); await p.waitForTimeout(120); }
      else { await p.evaluate(() => [...document.querySelectorAll('[role=tab]')].find(x => x.textContent.trim() === 'Agora')?.click()); await p.waitForTimeout(120); }
      const t = await p.evaluate(rotulo => new Promise(res => { const bt = [...document.querySelectorAll('[role=tab]')].find(x => x.textContent.trim() === rotulo); const t0 = performance.now(); bt?.click(); const ch = new MessageChannel(); ch.port1.onmessage = () => { void document.body.offsetHeight; res(performance.now() - t0); }; ch.port2.postMessage(0); }), nome === 'antes' ? 'Oportunidades' : 'Vagas');
      (partes['Caminhos·procura'] ??= []).push(t);
      if (nome !== 'antes') { await p.evaluate(() => [...document.querySelectorAll('.divisoes-caminhos__item')].find(x => x.textContent.trim() === 'Início')?.click()); await p.waitForTimeout(120); }
    }
    Object.assign(tempos, partes);
    saida[nome][sv] = { ...Object.fromEntries(Object.entries(tempos).map(([a, xs]) => [a, Math.round(mediana(xs) * 10) / 10])), ficha: Math.round(mediana(fichas) * 10) / 10 };
    await ctx.close();
  }
}
await b.close();
console.log(JSON.stringify(saida, null, 2));
