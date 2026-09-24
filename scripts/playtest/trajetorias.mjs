// Playtest visual dos Caminhos de Vida.
//   npm run build && npx vite preview --port 4173 &
//   SP=/tmp/vida-traj node scripts/playtest/trajetorias.mjs      (depois de gerarTrajetorias)
// Fotografa "Estudo e trabalho" (lado Trabalho), "Tempo livre", "Você" e a
// Linha da Vida em 320/390/820/1440 px para cada cenário (técnico, militar,
// artista, atleta, servidor, autônomo, informal, empreendedor, rural,
// cuidadora, envolvido, preso, egresso, mudança aos 40+); abre "Mudar o
// ritmo" e as portas; e reporta rolagem horizontal, botões fora da tela, CTA
// cobrindo conteúdo, botões sem nome, alvos de toque baixos e quantos botões
// cada tela expõe (para medir se a expansão poluiu a tela).
import { chromium } from 'playwright';
import { readFileSync, existsSync } from 'node:fs';

const SP = process.env.SP ?? '/tmp/vida-traj';
const URL = process.env.URL ?? 'http://localhost:4173/';
const SO = process.env.SO ? process.env.SO.split(',') : null;
const LARGURAS = (process.env.LARGURAS ?? '320,390,820,1440').split(',').map(Number);
const b = await chromium.launch();
const problemas = [];
const medidas = [];

async function abrir(save, w, h) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  p.on('pageerror', e => problemas.push(`[${w}] erro de página: ${e.message}`));
  p.on('console', m => { if (m.type() === 'error') problemas.push(`[${w}] console: ${m.text()}`); });
  await p.goto(URL);
  await p.evaluate(s => { localStorage.clear(); localStorage.setItem('VIDA_GAME_SAVE_V1', s); }, save);
  await p.goto(URL);
  await p.getByRole('button', { name: /Continuar a vida/ }).click();
  await p.waitForTimeout(150);
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
    const semNome = visiveis.filter(el => !(el.textContent || '').trim() && !el.getAttribute('aria-label') && el.tagName !== 'INPUT').length;
    const pequenos = visiveis.filter(el => { const b = el.getBoundingClientRect(); return b.height < 32 && el.tagName !== 'INPUT'; }).map(el => (el.textContent || '').trim().slice(0, 30));
    // Números cortados: valores com overflow visível (conteúdo mais largo que a caixa).
    const cortados = [...raiz.querySelectorAll('dd, .balanca__valor, .oferta__preco, .legenda__valor, .balanco__bloco strong, .valor-grande')]
      .filter(el => el.getBoundingClientRect().width > 0 && el.scrollWidth > el.clientWidth + 1).map(el => el.textContent.trim().slice(0, 24));
    const cta = document.querySelector('.avancar__botao')?.getBoundingClientRect();
    window.scrollTo(0, document.body.scrollHeight);
    const ultimo = [...document.querySelectorAll('main .secao, main li, main p, main article')].filter(e => e.getBoundingClientRect().height > 0).pop()?.getBoundingClientRect();
    const cobre = !!(cta && ultimo && !document.querySelector('.veu') && ultimo.bottom > cta.top + 2 && ultimo.top < alto);
    const botoes = visiveis.filter(el => el.tagName === 'BUTTON').length;
    const altura = raiz.getBoundingClientRect().height;
    return { rolagem, fora, cobre, semNome, pequenos, botoes, altura, cortados };
  });
  if (r.rolagem) problemas.push(`${rotulo}: rolagem horizontal`);
  if (r.fora.length) problemas.push(`${rotulo}: fora da tela → ${r.fora.join(' | ')}`);
  if (r.cobre) problemas.push(`${rotulo}: "Viver mais um ano" cobre o fim do conteúdo`);
  if (r.semNome) problemas.push(`${rotulo}: ${r.semNome} botão(ões) sem nome acessível`);
  if (r.pequenos.length) problemas.push(`${rotulo}: alvos de toque baixos (<32px): ${r.pequenos.slice(0, 4).join(' | ')}`);
  if (r.cortados.length) problemas.push(`${rotulo}: números cortados: ${r.cortados.slice(0, 4).join(' | ')}`);
  medidas.push(`${rotulo}: ${r.botoes} botões, ${Math.round(r.altura)}px`);
}

async function aba(p, nome) {
  await p.getByRole('button', { name: nome }).locator('visible=true').first().click();
  await p.waitForTimeout(160);
  await p.evaluate(() => window.scrollTo(0, 0));
}

async function lugar(p, nome, tag, arquivo) {
  const botao = p.locator('.lugar-botao', { hasText: nome });
  if (!(await botao.count())) return false;
  await botao.first().click();
  await p.waitForTimeout(160);
  await p.screenshot({ path: `${SP}/${tag}-${arquivo}.png`, fullPage: false });
  await verificar(p, `${tag} ${arquivo}`);
  return true;
}


const CENAS = ['tecnico', 'militar', 'artista', 'atleta', 'servidor', 'autonomo', 'informal', 'empreendedor', 'rural', 'cuidador', 'envolvido', 'preso', 'egresso', 'mudanca40'];

for (const nome of CENAS) {
  if (SO && !SO.includes(nome)) continue;
  const arq = `${SP}/save-${nome}.json`;
  if (!existsSync(arq)) { problemas.push(`sem save ${nome}`); continue; }
  const save = readFileSync(arq, 'utf8');
  for (const w of LARGURAS) {
    const h = w <= 390 ? (w === 320 ? 640 : 844) : w === 820 ? 1180 : 900;
    const p = await abrir(save, w, h);
    const tag = `${nome}-${w}`;
    await aba(p, /^Estudo e trabalho$|^Rumo$/);
    const trab = p.getByRole('tab', { name: 'Trabalho' });
    if (await trab.count()) { await trab.click(); await p.waitForTimeout(120); }
    await p.screenshot({ path: `${SP}/${tag}-trabalho.png`, fullPage: true });
    await verificar(p, `${tag} trabalho`);
    const ritmo = p.getByRole('button', { name: /Mudar o ritmo/ });
    if ((w === 390 || w === 1440) && await ritmo.count()) { await ritmo.click(); await p.waitForTimeout(100); await p.screenshot({ path: `${SP}/${tag}-ritmo.png`, fullPage: true }); await verificar(p, `${tag} ritmo`); }
    await aba(p, /^Tempo livre$|^Tempo$/);
    await p.screenshot({ path: `${SP}/${tag}-tempo.png`, fullPage: w >= 820 });
    await verificar(p, `${tag} tempo`);
    if (w === 390 || w === 1440) {
      await aba(p, /^Você$/);
      await p.screenshot({ path: `${SP}/${tag}-voce.png`, fullPage: true });
      await verificar(p, `${tag} voce`);
      await aba(p, /^Linha da Vida$|^Vida$/);
      await p.screenshot({ path: `${SP}/${tag}-vida.png`, fullPage: false });
      await verificar(p, `${tag} vida`);
    }
    await p.context().close();
  }
}

console.log('\n== PROBLEMAS ==');
console.log(problemas.length ? [...new Set(problemas)].join('\n') : 'nenhum');
console.log('\n== MEDIDAS ==');
console.log(medidas.join('\n'));
await b.close();
