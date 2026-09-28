/**
 * SMOKE TEST DE DISTRIBUIÇÃO — build de produção (dist/), não o código-fonte.
 *
 * Carrega o `dist/index.html` gerado, com os pacotes minificados reais, num
 * Chromium de verdade (Playwright). Serve o pacote a partir de um
 * SUBDIRETÓRIO (/html/12345/), reproduzindo a forma como o itch.io publica um
 * projeto HTML5 — é isso que pega o erro de caminho absoluto, que passa
 * despercebido em `npm run dev` e em `vite preview`.
 *
 * (REWORK 2: o pacote deixou de ser um arquivo único — o motor e as telas do
 * jogo carregam sob demanda. O jsdom não executa módulos, então o smoke passou
 * para um navegador real e verifica também que cada pacote sob demanda chega
 * do subdiretório, sem 404, e que o jogo abre.)
 *
 * Não substitui o olho humano num navegador de verdade: valida boot, montagem
 * da interface, persistência e recarga. Rode com:
 *     node scripts/itch/smoke.mjs
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { chromium } from 'playwright';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const dist = join(raiz, 'dist');

const resultados = [];
function checar(nome, ok, detalhe = '') {
  resultados.push({ nome, ok, detalhe });
  console.log(`${ok ? 'OK  ' : 'FALHA'} · ${nome}${detalhe ? ` — ${detalhe}` : ''}`);
}

if (!existsSync(join(dist, 'index.html'))) {
  console.error('dist/index.html não existe. Rode `npm run build` antes.');
  process.exit(1);
}

const html = readFileSync(join(dist, 'index.html'), 'utf-8');

// ---------------------------------------------------------------- caminhos
const absolutos = [...html.matchAll(/(?:src|href)="(\/[^/][^"]*)"/g)].map((m) => m[1]);
checar(
  'nenhum asset com caminho absoluto no index.html',
  absolutos.length === 0,
  absolutos.length ? absolutos.join(', ') : 'todos relativos'
);

const relativos = [...html.matchAll(/(?:src|href)="(\.\/[^"]+)"/g)].map((m) => m[1]);
checar('assets referenciados relativamente', relativos.length > 0, relativos.join(', '));

for (const rel of relativos) {
  const alvo = join(dist, rel.replace(/^\.\//, ''));
  checar(`asset existe no pacote: ${rel}`, existsSync(alvo));
}

checar('index.html declara viewport', /name="viewport"/.test(html));
checar('index.html na raiz do pacote', existsSync(join(dist, 'index.html')));

// ------------------------------------------------------- boot do pacote real
// O jogo é servido de um subdiretório com hash, como no itch.io.
const PREFIXO = '/html/12345/';
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const pedidos = [];
const servidor = createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  pedidos.push(url);
  if (!url.startsWith(PREFIXO)) { res.writeHead(404); res.end(); return; }
  const rel = url.slice(PREFIXO.length) || 'index.html';
  const alvo = join(dist, rel);
  if (!alvo.startsWith(dist) || !existsSync(alvo)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': TIPOS[rel.slice(rel.lastIndexOf('.'))] ?? 'application/octet-stream' });
  res.end(readFileSync(alvo));
});
await new Promise(r => servidor.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${servidor.address().port}${PREFIXO}`;

const navegador = await chromium.launch();
const errosConsole = [];
const falhasRede = [];
async function abrir(save) {
  const ctx = await navegador.newContext();
  const p = await ctx.newPage();
  p.on('pageerror', e => errosConsole.push(String(e.message)));
  p.on('console', m => { if (m.type() === 'error') errosConsole.push(m.text()); });
  p.on('response', r => { if (r.status() >= 400 && r.url().startsWith(BASE.replace(PREFIXO, ''))) falhasRede.push(`${r.status()} ${r.url()}`); });
  // Fontes remotas ficam de fora de propósito: o jogo precisa funcionar sem elas.
  await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await p.goto(BASE);
  if (save) { await p.evaluate(([k, s]) => localStorage.setItem(k, s), [CHAVE, save]); await p.goto(BASE); }
  await p.waitForSelector('#root button', { timeout: 15000 }).catch(() => {});
  return { p, ctx };
}

const CHAVE = 'VIDA_GAME_SAVE_V1';
const { p, ctx } = await abrir();
const root = await p.$('#root');
checar('elemento #root existe', !!root);
const htmlRoot = await p.evaluate(() => document.getElementById('root')?.innerHTML.length ?? 0);
checar('aplicação montou (React renderizou dentro de #root)', htmlRoot > 0, `${htmlRoot} chars de HTML`);
const texto = await p.evaluate(() => document.getElementById('root')?.textContent ?? '');
checar('tela inicial exibe a marca VIDA', /VIDA/i.test(texto));
const botoes = await p.$$eval('button', b => b.length);
checar('há controles interativos na tela inicial', botoes > 0, `${botoes} botões`);
const storageOk = await p.evaluate(() => { try { localStorage.setItem('vida_smoke', 'x'); const ok = localStorage.getItem('vida_smoke') === 'x'; localStorage.removeItem('vida_smoke'); return ok; } catch { return false; } });
checar('localStorage disponível no contexto da build', storageOk);
// Nascer: carrega os pacotes sob demanda (motor, criação, jogo) do subdiretório.
await p.getByRole('button', { name: /Nascer de novo/ }).click();
await p.getByRole('button', { name: /^Nascer$/ }).click({ timeout: 15000 }).catch(() => {});
const jogou = await p.getByRole('button', { name: /Viver mais um ano/ }).first().waitFor({ timeout: 15000 }).then(() => true).catch(() => false);
checar('os pacotes sob demanda carregam e o jogo abre (nascer → viver mais um ano)', jogou);
const chunks = pedidos.filter(u => u.endsWith('.js'));
checar('todos os pacotes vêm do subdiretório do jogo', chunks.length > 2 && chunks.every(u => u.startsWith(PREFIXO)), `${chunks.length} pacotes JS`);
await ctx.close();

// Save REAL, produzido pelos construtores do jogo (scripts/itch/gerarSaveReal.ts): sobrevive à recarga e o jogo oferece continuar.
const bundleSave = execFileSync('npx', ['esbuild', 'scripts/itch/gerarSaveReal.ts', '--bundle', '--platform=node', '--log-level=error'], { cwd: raiz, encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024 });
const saveReal = execFileSync('node', ['-'], { cwd: raiz, input: bundleSave, encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024 }).trim();
const segunda = await abrir(saveReal);
checar('save persiste após recarregar a página', (await segunda.p.evaluate(k => localStorage.getItem(k), CHAVE)) === saveReal);
const texto2 = (await segunda.p.evaluate(() => document.getElementById('root')?.textContent ?? '')).toLowerCase();
checar('com save presente, a interface oferece continuar', /continuar/.test(texto2));
await segunda.ctx.close();

// -------------------------------------------------------------- console e rede
checar('nenhum pacote do jogo deu erro de rede', falhasRede.length === 0, falhasRede.slice(0, 3).join(' | ') || 'limpo');
const criticos = errosConsole.filter(e => !/fonts\.googleapis|fonts\.gstatic|ERR_FAILED|net::/i.test(e));
checar('nenhum erro crítico de console durante o boot', criticos.length === 0, criticos.length ? criticos.slice(0, 3).join(' | ') : 'limpo');

await navegador.close();
servidor.close();

const falhas = resultados.filter((r) => !r.ok);
console.log(`\n${resultados.length - falhas.length}/${resultados.length} verificações passaram.`);
process.exit(falhas.length === 0 ? 0 : 1);
