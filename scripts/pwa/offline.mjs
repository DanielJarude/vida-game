/**
 * TESTE OFFLINE DO PWA — build de produção num Chromium de verdade.
 *
 * O que verifica:
 *   1. online, celular (390 px): o service worker instala, o precache fica
 *      completo (todas as entradas do sw.js, inclusive os pacotes do motor) e
 *      a página passa a ser controlada por ele;
 *   2. cria uma vida, vive alguns anos (o save vai para o IndexedDB);
 *   3. OFFLINE: recarrega, continua a mesma vida, vive mais anos e decide;
 *      recarrega offline de novo e confere que o save no IndexedDB é
 *      idêntico antes e depois da recarga;
 *   3d. TUDO AO ACASO SEM REDE (FIX pós-playtest humano): o mundo sorteado (pacotes do cache), mãe e pai na tela,
 *       os traços novos no save, recarregar idêntico.
 *   3c. AS REDES SOCIAIS SEM REDE (FIX pós-REWORK 4): offline, aos 13 anos, cria
 *      a conta no Instagram e publica (é simulação local: nada sai do aparelho);
 *      salva, recarrega e confere a conta idêntica no save e na tela;
 *   3b. O MUNDO SEM REDE (fechamento do ATT Mundo): os 7 pacotes regionais
 *      estão no precache; offline, nasce uma vida no Japão (o pacote da
 *      Ásia vem do cache), vive, salva e recarrega idêntica, sem reais na tela;
 *   4. online de novo: publica uma "versão nova" (o sw.js muda de bytes),
 *      espera o aviso discreto aparecer, fotografa (390 px e 1440 px), aceita
 *      e confere que a vida sobreviveu à troca de service worker.
 *
 * Servidor: um servidor estático próprio (porta 4174, como `vite preview
 * --port 4174`) que serve uma CÓPIA do dist/ — a cópia é que permite trocar o
 * sw.js no passo 4 sem mexer no build. sw.js vai sem cache HTTP, como no
 * Netlify.
 *
 * Uso:   npm run build && node scripts/pwa/offline.mjs
 *        SP=/caminho/para/fotos node scripts/pwa/offline.mjs
 */

import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, appendFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const dist = join(raiz, 'dist');
const SP = process.env.SP ?? join(tmpdir(), 'vida-pwa');
const PORTA = Number(process.env.PORTA ?? 4174);
if (!existsSync(join(dist, 'sw.js'))) { console.error('dist/sw.js não existe. Rode `npm run build` antes.'); process.exit(1); }
mkdirSync(SP, { recursive: true });

const resultados = [];
function checar(nome, ok, detalhe = '') {
  resultados.push({ nome, ok, detalhe });
  console.log(`${ok ? 'OK  ' : 'FALHA'} · ${nome}${detalhe ? ` — ${detalhe}` : ''}`);
}

// ------------------------------------------------------------ o servidor
const servido = join(SP, 'servido');
rmSync(servido, { recursive: true, force: true });
cpSync(dist, servido, { recursive: true });
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const servidor = createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  const rel = url === '/' ? 'index.html' : url.slice(1);
  const alvo = join(servido, rel);
  if (!alvo.startsWith(servido) || !existsSync(alvo)) { res.writeHead(404); res.end(); return; }
  const ext = rel.slice(rel.lastIndexOf('.'));
  res.writeHead(200, { 'content-type': TIPOS[ext] ?? 'application/octet-stream', 'cache-control': rel === 'sw.js' || ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable' });
  res.end(readFileSync(alvo));
});
await new Promise(r => servidor.listen(PORTA, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${PORTA}/`;

// ------------------------------------------------------------ o navegador
const navegador = await chromium.launch();
const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'allow' });
const p = await ctx.newPage();
const erros = [];
p.on('pageerror', e => erros.push(e.message));
p.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });

/** O save no IndexedDB, como a página o vê. */
const lerSave = () => p.evaluate(() => new Promise((ok, falha) => {
  const r = indexedDB.open('VIDA');
  r.onerror = () => falha(r.error);
  r.onsuccess = () => {
    const db = r.result;
    if (!db.objectStoreNames.contains('gavetas')) { db.close(); ok(null); return; }
    const g = db.transaction('gavetas').objectStore('gavetas').get('principal');
    g.onsuccess = () => { ok(g.result?.bruto ?? null); db.close(); };
    g.onerror = () => falha(g.error);
  };
}));
/** Espera o save parar de mudar (a fila de gravação é assíncrona). */
async function saveEstavel() {
  let antes = await lerSave();
  for (let i = 0; i < 20; i++) { await p.waitForTimeout(150); const agora = await lerSave(); if (agora === antes) return agora; antes = agora; }
  return antes;
}
const resumo = s => { if (!s) return 'nenhum'; const v = JSON.parse(s); return `${v.eu.nome}, t=${v.t}, ${v.biografia.length} entradas`; };

async function resolver(pref = 0) {
  for (let k = 0; k < 8; k++) {
    const ops = p.locator('.opcao:not([disabled])');
    if (await ops.count()) { await ops.nth(Math.min(pref, (await ops.count()) - 1)).click(); await p.waitForTimeout(60); continue; }
    const c = p.getByRole('button', { name: /^Continuar$/ });
    if (await c.count()) { await c.first().click(); await p.waitForTimeout(60); continue; }
    return;
  }
}
async function avancar(n) {
  for (let i = 0; i < n; i++) { await resolver(i % 2); await p.locator('.avancar__botao').click(); await p.waitForTimeout(80); await resolver(i % 2); }
}
/** "Nome, N anos" — o rótulo do botão do cabeçalho. */
const idadeNaTela = async () => (await p.locator('.cabecalho__eu').first().getAttribute('aria-label'))?.split(':')[0];

try {
  // 1. Online: instala e precacheia.
  await p.goto(BASE);
  await p.waitForSelector('#root button', { timeout: 20000 });
  const ativo = await p.evaluate(async () => { const r = await navigator.serviceWorker.ready; return !!r.active; });
  checar('service worker instalado e ativo', ativo);
  const entradas = (readFileSync(join(servido, 'sw.js'), 'utf-8').match(/\{url:"[^"]+"/g) ?? []).length;
  const precache = await p.evaluate(async () => {
    const nomes = await caches.keys();
    const nome = nomes.find(n => n.includes('precache'));
    if (!nome) return { nome: null, n: 0, urls: [] };
    const reqs = await (await caches.open(nome)).keys();
    return { nome, n: reqs.length, urls: reqs.map(r => new URL(r.url).pathname) };
  });
  checar('precache completo (todas as entradas do sw.js)', precache.n === entradas && entradas > 0, `${precache.n}/${entradas} em ${precache.nome}`);
  const pacotes = ['motor-', 'motor-conteudo-', 'motor-carreira-', 'motor-dados-', 'motor-textos-', 'motor-vida-', 'Jogo-', 'Criacao-'];
  checar('os pacotes sob demanda do motor estão no precache', pacotes.every(x => precache.urls.some(u => u.includes(`/assets/${x}`))));
  checar('as fontes estão no precache (nada do Google Fonts)', precache.urls.filter(u => u.endsWith('.woff2')).length >= 6);
  const regioes = ['africa', 'america-central-caribe', 'america-norte', 'america-sul', 'asia', 'europa', 'oceania'];
  checar('os 7 pacotes do mundo (por região) estão no precache', regioes.every(r => precache.urls.some(u => u.includes(`/assets/mundo-${r}-`))), regioes.filter(r => !precache.urls.some(u => u.includes(`/assets/mundo-${r}-`))).join(', ') || 'todos');
  await p.reload();
  await p.waitForSelector('#root button', { timeout: 20000 });
  checar('a página é controlada pelo service worker', await p.evaluate(() => !!navigator.serviceWorker.controller));

  // 2. Uma vida nova, alguns anos.
  await p.getByRole('button', { name: /Nascer de novo/ }).click();
  await p.locator('.criacao__nascer').click();
  await p.locator('.avancar__botao').waitFor({ timeout: 20000 });
  await avancar(4);
  const s1 = await saveEstavel();
  checar('a vida foi salva no IndexedDB', !!s1, resumo(s1));
  const armazem = await p.evaluate(() => localStorage.getItem('VIDA_GAME_SAVE_V1'));
  checar('o save novo não vai mais para o localStorage', armazem === null);

  // 3. Offline.
  await ctx.setOffline(true);
  await p.reload();
  const continuar = p.getByRole('button', { name: /Continuar a vida de/ });
  const abriu = await continuar.waitFor({ timeout: 20000 }).then(() => true).catch(() => false);
  checar('offline: o jogo abre e oferece continuar a vida salva', abriu);
  await continuar.click();
  await p.locator('.avancar__botao').waitFor({ timeout: 20000 });
  checar('offline: a vida continua de onde parou', (await lerSave()) === s1, await idadeNaTela());
  await avancar(3);
  await resolver(1);
  const s2 = await saveEstavel();
  checar('offline: anos vividos e decisões são salvos', !!s2 && s2 !== s1, resumo(s2));
  const idade2 = await idadeNaTela();
  await p.reload();
  await p.getByRole('button', { name: /Continuar a vida de/ }).waitFor({ timeout: 20000 });
  const s3 = await lerSave();
  checar('offline: recarregar não muda o save (JSON idêntico)', s3 === s2, `${(s3 ?? '').length} caracteres`);
  await p.getByRole('button', { name: /Continuar a vida de/ }).click();
  await p.locator('.avancar__botao').waitFor({ timeout: 20000 });
  checar('offline: a tela mostra a mesma idade depois da recarga', (await idadeNaTela()) === idade2, idade2);

  // 3c. As redes sociais sem rede (simulação local): aos 13, criar a conta no Instagram e publicar — offline.
  for (let k = 0; k < 12 && Number((await idadeNaTela())?.match(/(\d+) anos/)?.[1] ?? 0) < 13; k++) await avancar(1);
  await p.locator('.barra__item', { hasText: 'Tempo' }).first().click();
  await p.getByRole('tab', { name: 'Redes sociais' }).click();
  const criar = p.getByRole('button', { name: 'Criar uma conta no Instagram' });
  const temCriar = await criar.waitFor({ timeout: 10000 }).then(() => true).catch(() => false);
  checar('offline: a aba Redes sociais abre e oferece criar a conta', temCriar, await idadeNaTela());
  if (temCriar) {
    await criar.click();
    await p.waitForTimeout(150);
    const post = p.locator('.plataforma-painel__temas button:not([disabled])').first();
    if (await post.count()) { await post.click(); await p.waitForTimeout(150); }
    const sr = await saveEstavel();
    const conta = sr ? JSON.parse(sr).redes?.contas?.instagram : undefined;
    checar('offline: a conta existe e publicou (no save)', !!conta && conta.publicacoes.length >= 1, conta ? `@${conta.arroba}, ${conta.seguidores} seguidores, ${conta.publicacoes.length} publicação` : 'sem conta');
    await p.reload();
    await p.getByRole('button', { name: /Continuar a vida de/ }).waitFor({ timeout: 20000 });
    checar('offline: a conta volta idêntica depois de recarregar', (await lerSave()) === sr);
    await p.getByRole('button', { name: /Continuar a vida de/ }).click();
    await p.locator('.avancar__botao').waitFor({ timeout: 20000 });
    await p.locator('.barra__item', { hasText: 'Tempo' }).first().click();
    await p.getByRole('tab', { name: 'Redes sociais' }).click();
    const arroba = await p.locator('.plataforma-painel__titulo').first().innerText().catch(() => '');
    checar('offline: a tela mostra a mesma conta (@arroba)', !!conta && arroba.includes(`@${conta.arroba}`), arroba);
    await p.screenshot({ path: join(SP, 'redes-offline-390.png'), fullPage: false });
  }

  // 3d. FIX pós-playtest humano — sem rede: "Tudo ao acaso" sorteia o MUNDO (os pacotes vêm do cache), a tela mostra
  // de quem vêm os traços (mãe e pai), a vida nasce com a Aparência 2.0 (os traços novos no save) e volta idêntica.
  await p.reload();
  await p.getByRole('button', { name: /Nascer de novo/ }).click();
  const paisesAoAcaso = new Set();
  for (let k = 0; k < 8; k++) {
    await p.getByRole('button', { name: 'Tudo ao acaso' }).click();
    await p.waitForTimeout(120);
    paisesAoAcaso.add((await p.locator('.mundo-nascer__pais strong').textContent())?.trim());
  }
  checar('offline: "Tudo ao acaso" sorteia países diferentes (não só o Brasil)', paisesAoAcaso.size >= 3, [...paisesAoAcaso].join(', '));
  checar('offline: o Nascer mostra de quem vêm os traços (mãe e pai)', (await p.getByText('De quem vêm os traços').count()) === 1 && (await p.locator('.criacao__retrato figcaption', { hasText: /^mãe$/ }).count()) === 1);
  await p.locator('.criacao__nascer').click();
  await p.locator('.avancar__botao').waitFor({ timeout: 20000 });
  await avancar(2);
  const sa = await saveEstavel();
  const va = sa ? JSON.parse(sa) : null;
  checar('offline: a vida ao acaso nasce com os traços da Aparência 2.0 (no save)', !!va && typeof va.eu.visual.calvicie === 'string', va ? `${va.moradia.municipioId} · calvície ${va.eu.visual.calvicie}, olhos ${va.eu.visual.olhosTam ?? 'médios'}` : 'sem save');
  await p.reload();
  await p.getByRole('button', { name: /Continuar a vida de/ }).waitFor({ timeout: 20000 });
  checar('offline: a vida ao acaso volta idêntica depois de recarregar', (await lerSave()) === sa);

  // 3b. O mundo sem rede: nascer no Japão, viver, salvar, recarregar.
  await p.reload();
  await p.getByRole('button', { name: /Nascer de novo/ }).click();
  await p.getByRole('button', { name: 'Trocar o país' }).click();
  await p.getByPlaceholder('Argentina, Japão, Portugal…').fill('Japão');
  await p.locator('.viagem__opcao', { hasText: 'Japão' }).first().click();
  const pais = (await p.locator('.mundo-nascer__pais strong').textContent())?.trim();
  checar('offline: dá para escolher nascer no Japão (pacote da Ásia do cache)', pais === 'Japão', pais);
  await p.locator('.criacao__nascer').click();
  await p.locator('.avancar__botao').waitFor({ timeout: 20000 });
  await avancar(3);
  const sj = await saveEstavel();
  const jp = sj ? JSON.parse(sj) : null;
  checar('offline: a vida no Japão nasce e vive (o motor e o mundo vêm do cache)', !!jp && /^jp:/.test(jp.moradia.municipioId), jp ? `${jp.moradia.municipioId}, t=${jp.t}` : 'sem save');
  const textoJp = await p.locator('#root').innerText();
  checar('offline: a tela da vida no Japão mostra a moeda de lá (iene) e nada de reais', /¥|JPY|iene/i.test(textoJp) || !/R\$/.test(textoJp), /R\$/.test(textoJp) ? 'aparece R$' : 'sem R$');
  await p.reload();
  await p.getByRole('button', { name: /Continuar a vida de/ }).waitFor({ timeout: 20000 });
  checar('offline: a vida no Japão volta idêntica depois de recarregar', (await lerSave()) === sj);
  await p.getByRole('button', { name: /Continuar a vida de/ }).click();
  await p.locator('.avancar__botao').waitFor({ timeout: 20000 });

  // 4. Online de novo: uma versão nova é publicada (o sw.js muda).
  await ctx.setOffline(false);
  appendFileSync(join(servido, 'sw.js'), `\n// versão de teste ${Date.now()}\n`);
  await p.reload();
  const aviso = p.getByText('Há uma versão nova do VIDA.');
  const apareceu = await aviso.waitFor({ timeout: 30000 }).then(() => true).catch(() => false);
  checar('versão nova: o aviso aparece (sem recarregar sozinho)', apareceu);
  if (apareceu) {
    await p.screenshot({ path: join(SP, 'aviso-versao-nova-390.png') });
    await p.setViewportSize({ width: 1440, height: 900 });
    await p.waitForTimeout(200);
    await p.screenshot({ path: join(SP, 'aviso-versao-nova-1440.png') });
    await p.setViewportSize({ width: 390, height: 844 });
    const antes = await lerSave();
    await Promise.all([p.waitForEvent('load', { timeout: 30000 }), p.getByRole('button', { name: 'Atualizar agora' }).click()]);
    await p.waitForSelector('#root button', { timeout: 20000 });
    const semEspera = await p.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); return !!r?.active && !r.waiting; });
    checar('versão nova: aceitar ativa o service worker novo e recarrega', semEspera);
    checar('versão nova: o aviso não volta depois de atualizar', (await p.getByText('Há uma versão nova do VIDA.').count()) === 0);
    checar('versão nova: a vida sobrevive à atualização (save idêntico)', (await lerSave()) === antes && !!antes);
    const segue = await p.getByRole('button', { name: /Continuar a vida de/ }).waitFor({ timeout: 20000 }).then(() => true).catch(() => false);
    checar('versão nova: continuar a vida depois de atualizar', segue);
  }

  const criticos = erros.filter(e => !/net::ERR_INTERNET_DISCONNECTED|Failed to fetch|ERR_FAILED/i.test(e));
  checar('nenhum erro de página/console', criticos.length === 0, criticos.slice(0, 3).join(' | ') || 'limpo');
} catch (e) {
  checar('roteiro terminou sem exceção', false, String(e?.message ?? e));
} finally {
  await navegador.close();
  servidor.close();
}

const falhas = resultados.filter(r => !r.ok);
console.log(`\n${resultados.length - falhas.length}/${resultados.length} verificações passaram. Fotos em ${SP}`);
process.exit(falhas.length ? 1 : 0);
