// Playtest visual do FIX pós-playtest 2.
//   npm run build && npx vite preview --port 4173 &
//   SP=/tmp/vida-fix2 node scripts/playtest/fix2.mjs      (depois de gerarFix2)
// Fotografa Você, Pessoas (e fichas), Estudo, Trabalho e Tempo livre em
// 320/390/820/1440 px; abre a entrevista e a peneira e responde as etapas;
// monta uma folha lado a lado das cinco áreas (teste de diferenciação) e
// reporta rolagem horizontal, botões fora da tela, CTA cobrindo conteúdo,
// botões sem nome acessível, alvos pequenos e quantos botões cada tela expõe.
import { chromium } from 'playwright';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';

const SP = process.env.SP ?? '/tmp/vida-fix2';
const URL = process.env.URL ?? 'http://localhost:4173/';
const SO = process.env.SO ? process.env.SO.split(',') : null;
const LARGURAS = (process.env.LARGURAS ?? '320,390,820,1440').split(',').map(Number);
const b = await chromium.launch();
const problemas = [];
const medidas = [];

async function abrir(save, w, h, fecharMomento = true) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  p.on('pageerror', e => problemas.push(`[${w}] erro de página: ${e.message}`));
  p.on('console', m => { if (m.type() === 'error') problemas.push(`[${w}] console: ${m.text()}`); });
  await p.goto(URL);
  await p.evaluate(s => { localStorage.clear(); localStorage.setItem('VIDA_GAME_SAVE_V1', s); }, save);
  await p.goto(URL);
  await p.getByRole('button', { name: /Continuar a vida/ }).click();
  await p.waitForTimeout(150);
  if (fecharMomento) {
    for (let k = 0; k < 4; k++) {
      const op = p.locator('.veu .opcao:not([disabled])');
      if (await op.count()) { await op.first().click(); await p.waitForTimeout(60); }
      const cont = p.getByRole('button', { name: /^Continuar$/ });
      if (await cont.count()) { await cont.first().click(); await p.waitForTimeout(60); }
    }
  }
  return p;
}

async function verificar(p, rotulo) {
  const r = await p.evaluate(() => {
    const larg = document.documentElement.clientWidth;
    const alto = window.innerHeight;
    const rolagem = document.documentElement.scrollWidth > larg + 1;
    const raiz = document.querySelector('.veu .folha') ?? document.querySelector('main');
    const visiveis = [...raiz.querySelectorAll('button, a, input, select')].filter(el => el.getBoundingClientRect().width > 0);
    const fora = visiveis.filter(el => { const b = el.getBoundingClientRect(); return b.right > larg + 1 || b.left < -1; }).map(el => (el.textContent || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 40));
    const semNome = visiveis.filter(el => !(el.textContent || '').trim() && !el.getAttribute('aria-label')).length;
    const pequenos = visiveis.filter(el => { const b = el.getBoundingClientRect(); return b.height < 32; }).map(el => (el.textContent || '').trim().slice(0, 30));
    const cta = document.querySelector('.avancar__botao')?.getBoundingClientRect();
    window.scrollTo(0, document.body.scrollHeight);
    const ultimo = [...document.querySelectorAll('main .secao, main li, main p, main article')].filter(e => e.getBoundingClientRect().height > 0).pop()?.getBoundingClientRect();
    const cobre = !!(cta && ultimo && !document.querySelector('.veu') && ultimo.bottom > cta.top + 2 && ultimo.top < alto);
    const botoes = visiveis.filter(el => el.tagName === 'BUTTON').length;
    const acoes = [...raiz.querySelectorAll('.acao button, .vaga button, .rotina button')].filter(el => el.getBoundingClientRect().width > 0).length;
    const altura = (document.querySelector('.veu .folha') ?? document.querySelector('main'))?.getBoundingClientRect().height ?? 0;
    return { rolagem, fora, cobre, semNome, pequenos, botoes, acoes, altura };
  });
  if (r.rolagem) problemas.push(`${rotulo}: rolagem horizontal`);
  if (r.fora.length) problemas.push(`${rotulo}: fora da tela → ${r.fora.join(' | ')}`);
  if (r.cobre) problemas.push(`${rotulo}: "Viver mais um ano" cobre o fim do conteúdo`);
  if (r.semNome) problemas.push(`${rotulo}: ${r.semNome} botão(ões) sem nome acessível`);
  if (r.pequenos.length) problemas.push(`${rotulo}: alvos de toque baixos (<32px): ${r.pequenos.slice(0, 4).join(' | ')}`);
  medidas.push(`${rotulo}: ${r.botoes} botões (${r.acoes} de ação), ${Math.round(r.altura)}px`);
}

async function aba(p, nome) {
  await p.getByRole('button', { name: nome }).locator('visible=true').first().click();
  await p.waitForTimeout(140);
  await p.evaluate(() => window.scrollTo(0, 0));
}

async function lado(p, nome) {
  const t = p.getByRole('tab', { name: nome });
  if (await t.count()) { await t.first().click(); await p.waitForTimeout(100); await p.evaluate(() => window.scrollTo(0, 0)); return true; }
  return false;
}

const CENAS = ['crianca', 'adolescente', 'jovem', 'romance', 'familia', 'sobrecarga', 'desemprego', 'saude', 'bem', 'luto', 'idosa'];
const ABAS = [['voce', /^Você$/], ['pessoas', /^Pessoas$/], ['rumo', /^Estudo e trabalho$|^Rumo$/], ['tempo', /^Tempo livre$|^Tempo$/]];

for (const nome of CENAS) {
  if (SO && !SO.includes(nome)) continue;
  const arq = `${SP}/save-${nome}.json`;
  if (!existsSync(arq)) { problemas.push(`sem save ${nome}`); continue; }
  const save = readFileSync(arq, 'utf8');
  for (const w of LARGURAS) {
    const h = w <= 390 ? (w === 320 ? 640 : 844) : w === 820 ? 1180 : 900;
    const p = await abrir(save, w, h);
    const tag = `${nome}-${w}`;
    for (const [id, rot] of ABAS) {
      await aba(p, rot);
      if (id === 'rumo') {
        for (const l of ['Estudo', 'Trabalho']) {
          if (await lado(p, l) || l === 'Estudo') {
            await p.screenshot({ path: `${SP}/${tag}-${l.toLowerCase()}.png`, fullPage: true });
            await verificar(p, `${tag} ${l.toLowerCase()}`);
          }
        }
        continue;
      }
      await p.screenshot({ path: `${SP}/${tag}-${id}.png`, fullPage: true });
      await verificar(p, `${tag} ${id}`);
      if (id === 'pessoas' && (w === 390 || w === 1440)) {
        const primeiro = p.locator('main .cartao-pessoa, main .rosto').first();
        if (await primeiro.count()) {
          await primeiro.click(); await p.waitForTimeout(120);
          await p.screenshot({ path: `${SP}/${tag}-ficha.png`, fullPage: false });
          await verificar(p, `${tag} ficha`);
          await p.keyboard.press('Escape'); await p.waitForTimeout(80);
        }
      }
    }
    await p.context().close();
  }
}

// Processos: a entrevista e a peneira, etapa por etapa.
for (const [nome, prefixo] of [['entrevista', 'entrevista'], ['peneira', 'peneira']]) {
  if (SO && !SO.includes(nome)) continue;
  const arq = `${SP}/save-${nome}.json`;
  if (!existsSync(arq)) continue;
  for (const w of [390, 1440]) {
    const p = await abrir(readFileSync(arq, 'utf8'), w, w === 390 ? 844 : 900, false);
    for (let k = 0; k < 4; k++) {
      const op = p.locator('.veu .opcao:not([disabled])');
      if (!(await op.count())) break;
      await p.screenshot({ path: `${SP}/${prefixo}-${w}-etapa${k + 1}.png` });
      await verificar(p, `${prefixo}-${w} etapa ${k + 1}`);
      await op.nth(Math.min(k, (await op.count()) - 1)).click();
      await p.waitForTimeout(120);
    }
    await p.screenshot({ path: `${SP}/${prefixo}-${w}-resultado.png` });
    await verificar(p, `${prefixo}-${w} resultado`);
    await p.context().close();
  }
}

// Diferenciação: as cinco áreas lado a lado, sem títulos (1440 px, cena "familia").
if (!SO || SO.includes('familia')) {
  const cena = existsSync(`${SP}/familia-1440-voce.png`) ? 'familia' : null;
  if (cena) {
    const imgs = ['voce', 'pessoas', 'estudo', 'trabalho', 'tempo'].map(x => `${SP}/${cena}-1440-${x}.png`).filter(existsSync);
    const html = `<html><body style="margin:0;background:#000;display:flex;gap:8px">${imgs.map(i => `<div style="width:380px;height:760px;overflow:hidden;position:relative"><img src="file://${i}" style="width:1440px;transform:scale(0.62);transform-origin:-420px -130px"></div>`).join('')}</body></html>`;
    writeFileSync(`${SP}/lado-a-lado.html`, html);
    const p = await (await b.newContext({ viewport: { width: 1940, height: 760 } })).newPage();
    await p.goto(`file://${SP}/lado-a-lado.html`); await p.waitForTimeout(300);
    await p.screenshot({ path: `${SP}/lado-a-lado.png` });
    await p.context().close();
  }
}

await b.close();
console.log(medidas.join('\n'));
console.log(problemas.length ? '\nPROBLEMAS\n' + [...new Set(problemas)].join('\n') : '\nnenhum problema estrutural');
