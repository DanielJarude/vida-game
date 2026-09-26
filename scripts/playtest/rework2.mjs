// Playtest visual do REWORK Caminhos, Agência e UX: os cenários de `gerarRework2.ts`
// (cabo da PM na política, doutora em Nutrição, doutora de diarista, vôlei, a peneira
// aberta, concurseira, músico, confeiteira, dona de lanchonete, vestibulanda,
// mestrando, a entrevista aberta, sargento do Exército).
//   npx esbuild scripts/playtest/gerarRework2.ts --bundle --platform=node --outfile=/tmp/gr2.cjs && SP=/tmp/vida-rework2 node /tmp/gr2.cjs
//   npm run build && npx vite preview --port 4173 &
//   SP=/tmp/vida-rework2 node scripts/playtest/rework2.mjs
// Para cada cenário e largura (320/390/820/1440): todas as áreas, e em Trabalho
// cada aba da procura aberta; reporta rolagem horizontal, botão fora da tela,
// alvo < 40px, botão sem nome, CTA cobrindo conteúdo, texto cortado; teclado
// (Tab percorre Trabalho com foco visível e dentro da tela); e a arquitetura
// pedida (próximo passo com requisitos, "O que você está construindo", camadas
// da procura, "Outros caminhos"). Cinza e daltonismo simulado em três cenários.
import { chromium } from 'playwright';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';

const SP = process.env.SP ?? '/tmp/vida-rework2';
const OUT = process.env.OUT ?? SP;
const URL = process.env.URL ?? 'http://localhost:4173/';
const CENARIOS = (process.env.CEN ?? 'cabo-pm,doutora,doutora-diarista,volei,peneira,concurseira,musico,confeiteira,dona,vestibulanda,mestrando,entrevista,sargento').split(',');
const LARGURAS = (process.env.LARGURAS ?? '320,390,820,1440').split(',').map(Number);
const ABAS = ['Linha da Vida', 'Você', 'Pessoas', 'Trabalho', 'Estudos', 'Casa', 'Tempo livre', 'Cidade'];
const CURTO = { 'Linha da Vida': 'Vida', 'Tempo livre': 'Tempo' };
const PROCURA = ['Vagas e trabalho', 'Concursos', 'Negócio próprio', 'Outros caminhos'];
const b = await chromium.launch();
const problemas = [];
const medidas = [];
const achados = [];

async function abrir(save, w) {
  const ctx = await b.newContext({ viewport: { width: w, height: w < 800 ? 844 : 900 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  p.on('pageerror', e => problemas.push(`[${w}] erro de página: ${e.message}`));
  p.on('console', m => { if (m.type() === 'error') problemas.push(`[${w}] console: ${m.text()}`); });
  await p.goto(URL);
  await p.evaluate(s => { localStorage.clear(); localStorage.setItem('VIDA_GAME_SAVE_V1', s); }, save);
  await p.goto(URL);
  await p.getByRole('button', { name: /Continuar a vida/ }).click();
  await p.waitForTimeout(150);
  return { p, ctx };
}

async function irPara(p, aba) {
  let bt = p.getByRole('button', { name: aba, exact: true }).locator('visible=true').first();
  if (!(await bt.count())) bt = p.locator('.barra__item', { hasText: CURTO[aba] ?? aba }).first();
  if (!(await bt.count())) return false;
  await bt.click();
  await p.waitForTimeout(150);
  await p.evaluate(() => window.scrollTo(0, 0));
  return true;
}

async function verificar(p, rotulo) {
  const r = await p.evaluate(() => {
    const larg = document.documentElement.clientWidth;
    const alto = window.innerHeight;
    const rolagem = document.documentElement.scrollWidth > larg + 1;
    const raiz = document.querySelector('.veu .folha') ?? document.querySelector('main');
    const visiveis = [...raiz.querySelectorAll('button, a, input, select')].filter(el => el.getBoundingClientRect().width > 0);
    const fora = visiveis.filter(el => { const q = el.getBoundingClientRect(); return q.right > larg + 1 || q.left < -1; }).map(el => (el.textContent || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 40));
    const semNome = visiveis.filter(el => !(el.textContent || '').trim() && !el.getAttribute('aria-label') && el.tagName !== 'INPUT' && el.tagName !== 'SELECT').length;
    const pequenos = visiveis.filter(el => { const q = el.getBoundingClientRect(); return q.height < 40 && el.tagName === 'BUTTON' && !el.classList.contains('amostra'); }).map(el => (el.textContent || '').trim().slice(0, 30));
    const cortados = [...raiz.querySelectorAll('dd, .folio__titulo, .requisito__texto, .vaga-camada__nome, .construindo__titulo, .caminho__titulo, .proximo-passo__destino')].filter(el => el.getBoundingClientRect().width > 0 && el.scrollWidth > el.clientWidth + 1).map(el => el.textContent.trim().slice(0, 24));
    const cta = document.querySelector('.avancar__botao')?.getBoundingClientRect();
    window.scrollTo(0, document.body.scrollHeight);
    const ultimo = [...document.querySelectorAll('main section, main li, main p, main article, main .secao')].filter(e => e.getBoundingClientRect().height > 0).pop()?.getBoundingClientRect();
    const cobre = !!(cta && ultimo && !document.querySelector('.veu') && ultimo.bottom > cta.top + 2 && ultimo.top < alto);
    const botoes = visiveis.filter(el => el.tagName === 'BUTTON').length;
    window.scrollTo(0, 0);
    return { rolagem, fora, cobre, semNome, pequenos, botoes, cortados, altura: raiz.getBoundingClientRect().height };
  });
  if (r.rolagem) problemas.push(`${rotulo}: rolagem horizontal`);
  if (r.fora.length) problemas.push(`${rotulo}: fora da tela → ${r.fora.join(' | ')}`);
  if (r.cobre) problemas.push(`${rotulo}: "Viver mais um ano" cobre o fim do conteúdo`);
  if (r.semNome) problemas.push(`${rotulo}: ${r.semNome} botão(ões) sem nome acessível`);
  if (r.pequenos.length) problemas.push(`${rotulo}: botões baixos (<40px): ${r.pequenos.slice(0, 4).join(' | ')}`);
  if (r.cortados.length) problemas.push(`${rotulo}: textos cortados: ${r.cortados.slice(0, 4).join(' | ')}`);
  medidas.push(`${rotulo}: ${r.botoes} botões, ${Math.round(r.altura)}px`);
}

/** Teclado: Tab percorre Trabalho; cada foco precisa ser visível (contorno) e ficar na tela. */
async function teclado(p, rotulo) {
  await p.evaluate(() => { window.scrollTo(0, 0); document.activeElement?.blur?.(); });
  let semContorno = 0, foraDaTela = 0, n = 0;
  for (let k = 0; k < 40; k++) {
    await p.keyboard.press('Tab');
    const r = await p.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      const q = el.getBoundingClientRect();
      const contorno = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || /inset|rgb/.test(cs.boxShadow) && cs.boxShadow !== 'none';
      return { contorno, dentro: q.bottom > 0 && q.top < window.innerHeight && q.right <= document.documentElement.clientWidth + 1, dentroMain: !!el.closest('main') };
    });
    if (!r) continue;
    n++;
    if (!r.contorno) semContorno++;
    if (!r.dentro) foraDaTela++;
  }
  if (semContorno) problemas.push(`${rotulo}: ${semContorno}/${n} focos sem contorno visível`);
  if (foraDaTela) problemas.push(`${rotulo}: ${foraDaTela}/${n} focos fora da tela`);
  medidas.push(`${rotulo}: teclado ${n} paradas, ${semContorno} sem contorno, ${foraDaTela} fora`);
}

/** A arquitetura pedida, conferida onde deve estar. */
async function arquitetura(p, c) {
  const t = await p.evaluate(() => document.querySelector('main')?.innerText ?? '');
  const deve = {
    'cabo-pm': [/Próximo passo/, /Tempo de corporação/, /Tempo no posto/, /Pela antiguidade/, /Militar da ativa não se filia/, /Conversar com partidos sobre uma indicação/, /O que você está construindo/],
    doutora: [/Combina com a sua trajetória/, /Carreira acadêmica/, /Doutorado em Nutrição/],
    'doutora-diarista': [/Carreira acadêmica/],
    volei: [/Chegar a uma equipe de vôlei/, /A técnica está/, /Pedir um teste num clube/],
    concurseira: [/Passar num concurso/, /prefeitura e tribunais/],
    musico: [/Viver de música/, /Montar uma banda/],
    confeiteira: [/vaga de emprego|por conta própria/],
    sargento: [/Próximo passo/, /Curso/, /Teste físico/]
  }[c] ?? [];
  const nao = { 'cabo-pm': [/pede formação: 31/], doutora: [], 'doutora-diarista': [] }[c] ?? [];
  for (const x of deve) if (!x.test(t)) problemas.push(`${c}: Trabalho não mostra ${x}`);
  for (const x of nao) if (x.test(t)) problemas.push(`${c}: Trabalho ainda mostra ${x}`);
  if (deve.length) achados.push(`${c}: ${deve.filter(x => x.test(t)).length}/${deve.length} elementos da arquitetura presentes`);
}

for (const c of CENARIOS) {
  const arq = `${SP}/save-${c}.json`;
  if (!existsSync(arq)) { problemas.push(`sem save: ${c}`); continue; }
  const save = readFileSync(arq, 'utf8');
  for (const w of LARGURAS) {
    let { p, ctx } = await abrir(save, w);
    if (await p.locator('.veu .folha').count()) {
      await verificar(p, `${c} ${w} decisão aberta`);
      await p.screenshot({ path: `${OUT}/${c}-${w}-decisao.png`, fullPage: false });
      await ctx.close();
      const semMomento = JSON.parse(save); semMomento.momento = null; semMomento.caminhos.pendente = undefined; semMomento.caminhos.processo = undefined;
      ({ p, ctx } = await abrir(JSON.stringify(semMomento), w));
    }
    for (const a of ABAS) {
      if (!(await irPara(p, a))) continue;
      await verificar(p, `${c} ${w} ${a}`);
      if (w === 390 || w === 1440) await p.screenshot({ path: `${OUT}/${c}-${w}-${a.replace(/ /g, '_')}.png`, fullPage: a === 'Trabalho' || a === 'Estudos' });
    }
    if (await irPara(p, 'Trabalho')) {
      if (w === 1440) await arquitetura(p, c);
      if (w === 390 || w === 1440) await teclado(p, `${c} ${w} Trabalho (teclado)`);
      await p.evaluate(() => window.scrollTo(0, 0));
      const procurar = p.getByRole('button', { name: /Procurar outro caminho/ });
      if (await procurar.count()) {
        if ((await procurar.getAttribute('aria-expanded')) !== 'true') { await procurar.click(); await p.waitForTimeout(100); }
        for (const aba of PROCURA) {
          const r = p.getByRole('radio', { name: aba });
          if (!(await r.count())) continue;
          await r.click(); await p.waitForTimeout(120);
          await verificar(p, `${c} ${w} Trabalho › ${aba}`);
          if (w === 390 || w === 1440) await p.screenshot({ path: `${OUT}/${c}-${w}-procura-${aba.replace(/ /g, '_')}.png`, fullPage: true });
        }
        // A terceira camada (catálogo inteiro) também abre e se mede.
        const vagas = p.getByRole('radio', { name: 'Vagas e trabalho' });
        if (await vagas.count()) {
          await vagas.click(); await p.waitForTimeout(80);
          const todas = p.getByRole('button', { name: /Explorar todas as ocupações/ });
          if (await todas.count()) { await todas.click(); await p.waitForTimeout(120); await verificar(p, `${c} ${w} Trabalho › catálogo inteiro`); }
        }
      }
    }
    await ctx.close();
  }
}

// Cor não pode ser o único sinal: escala de cinza e daltonismo simulado.
for (const c of (process.env.CORES ?? 'cabo-pm,volei,doutora').split(',')) {
  const arq = `${SP}/save-${c}.json`;
  if (!existsSync(arq)) continue;
  for (const tipo of ['achromatopsia', 'deuteranopia', 'protanopia', 'tritanopia']) {
    const { p, ctx } = await abrir(readFileSync(arq, 'utf8'), 1440);
    const cdp = await ctx.newCDPSession(p);
    await cdp.send('Emulation.setEmulatedVisionDeficiency', { type: tipo });
    for (const a of ['Trabalho', 'Estudos']) { await irPara(p, a); await p.screenshot({ path: `${OUT}/${c}-${tipo}-${a.replace(/ /g, '_')}.png`, fullPage: true }); }
    await ctx.close();
  }
}

await b.close();
writeFileSync(`${OUT}/medidas.txt`, medidas.join('\n'));
writeFileSync(`${OUT}/achados.txt`, achados.join('\n'));
console.log(achados.join('\n'));
console.log(problemas.length ? `${problemas.length} problema(s):\n- ${problemas.join('\n- ')}` : 'Nenhum problema estrutural.');
console.log(`(${medidas.length} medidas; em ${OUT}/medidas.txt)`);
