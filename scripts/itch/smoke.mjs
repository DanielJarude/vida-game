/**
 * SMOKE TEST DE DISTRIBUIÇÃO — build de produção (dist/), não o código-fonte.
 *
 * Carrega o `dist/index.html` gerado, com o bundle minificado real, dentro de
 * um DOM com execução de script e localStorage. Serve o pacote a partir de um
 * SUBDIRETÓRIO (/html/12345/), reproduzindo a forma como o itch.io publica um
 * projeto HTML5 — é isso que pega o erro de caminho absoluto, que passa
 * despercebido em `npm run dev` e em `vite preview`.
 *
 * Não substitui o olho humano num navegador de verdade: valida boot, montagem
 * da interface, persistência e recarga. Rode com:
 *     node scripts/itch/smoke.mjs
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { JSDOM, VirtualConsole } from 'jsdom';

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

// ------------------------------------------------------- boot do bundle real
// O jogo é servido de um subdiretório com hash, como no itch.io.
const BASE = 'http://localhost:8080/html/12345/';

const virtualConsole = new VirtualConsole();
const errosConsole = [];
virtualConsole.on('jsdomError', (e) => errosConsole.push(String(e.message)));
virtualConsole.on('error', (...a) => errosConsole.push(a.join(' ')));

// O jsdom não executa <script type="module"> (limitação conhecida da
// biblioteca, não do produto). O bundle do Vite é um chunk único, sem
// import/export estáticos e sem import.meta — verificado adiante — então
// executá-lo como script clássico roda EXATAMENTE o mesmo código que o
// navegador roda. A conversão é só do atributo do <script>.
const bundleRel = relativos.find((r) => r.endsWith('.js'));
const bundleSrc = readFileSync(join(dist, bundleRel.replace(/^\.\//, '')), 'utf-8');

checar(
  'bundle é autocontido (sem import/export estáticos nem import.meta)',
  !/^\s*(import|export)[\s{("']/m.test(bundleSrc) && !bundleSrc.includes('import.meta')
);

const htmlExecutavel = html.replace(
  /<script type="module"[^>]*><\/script>/,
  '<script id="vida-bundle"></script>'
);

function montar() {
  const d = new JSDOM(htmlExecutavel, {
    url: BASE,
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole,
    resources: {
      // Resolve os assets do próprio pacote a partir do disco; recursos
      // remotos (as fontes do Google) são ignorados de propósito — o jogo
      // precisa funcionar sem eles, e no sandbox esse domínio está bloqueado.
      fetch(url) {
        if (!url.startsWith(BASE)) return null;
        const rel = url.slice(BASE.length).split('?')[0];
        const alvo = join(dist, rel);
        if (!existsSync(alvo)) return null;
        return Promise.resolve(readFileSync(alvo));
      }
    }
  });
  d.window.matchMedia =
    d.window.matchMedia ||
    ((q) => ({
      matches: false,
      media: q,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      onchange: null,
      dispatchEvent: () => false
    }));
  d.window.scrollTo = () => {};
  return d;
}

function executarBundle(d) {
  const s = d.window.document.getElementById('vida-bundle');
  s.textContent = bundleSrc;
  // Reinsere para disparar a execução no jsdom.
  s.parentNode.replaceChild(s.cloneNode(true), s);
}

const dom = montar();

const { window } = dom;
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
executarBundle(dom);
await esperar(2500);

const doc = window.document;
const root = doc.getElementById('root');
checar('elemento #root existe', !!root);
checar(
  'aplicação montou (React renderizou dentro de #root)',
  !!root && root.children.length > 0,
  root ? `${root.innerHTML.length} chars de HTML` : ''
);

const texto = root ? root.textContent || '' : '';
checar('tela inicial exibe a marca VIDA', /VIDA/i.test(texto));

const botoes = [...doc.querySelectorAll('button')];
checar('há controles interativos na tela inicial', botoes.length > 0, `${botoes.length} botões`);

// ------------------------------------------------------------ localStorage
let storageOk = false;
try {
  window.localStorage.setItem('vida_smoke', 'x');
  storageOk = window.localStorage.getItem('vida_smoke') === 'x';
  window.localStorage.removeItem('vida_smoke');
} catch {
  storageOk = false;
}
checar('localStorage disponível no contexto da build', storageOk);

// Simula um save do jogo e confirma que ele sobrevive a uma recarga da página
// — é exatamente o ciclo "jogar, recarregar, continuar" do itch.io.
const CHAVE = 'VIDA_GAME_SAVE_V1'; // igual a SAVE_KEY em saveSystem.ts
// Save REAL, produzido pelos construtores do jogo (scripts/itch/gerarSaveReal.ts).
// Um objeto inventado à mão seria descartado por `migrarEstadoSalvo` e o teste
// estaria medindo a rejeição do save, não a retomada da partida.
const bundleSave = execFileSync('npx', ['esbuild', 'scripts/itch/gerarSaveReal.ts', '--bundle', '--platform=node', '--log-level=error'], {
  cwd: raiz,
  encoding: 'utf-8'
});
const saveReal = execFileSync('node', ['-'], { cwd: raiz, input: bundleSave, encoding: 'utf-8' }).trim();
window.localStorage.setItem(CHAVE, saveReal);

const dom2 = montar();
dom2.window.localStorage.setItem(CHAVE, saveReal);
executarBundle(dom2);
await esperar(2500);
checar(
  'save persiste após recarregar a página',
  dom2.window.localStorage.getItem(CHAVE) === saveReal
);
const texto2 = (dom2.window.document.getElementById('root')?.textContent || '').toLowerCase();
checar(
  'com save presente, a interface oferece continuar',
  /continuar/.test(texto2)
);

// -------------------------------------------------------------- console
const criticos = errosConsole.filter(
  (e) => !/fonts\.googleapis|fonts\.gstatic|Could not load|not implemented/i.test(e)
);
checar(
  'nenhum erro crítico de console durante o boot',
  criticos.length === 0,
  criticos.length ? criticos.slice(0, 3).join(' | ') : 'limpo'
);

dom.window.close();
dom2.window.close();

const falhas = resultados.filter((r) => !r.ok);
console.log(`\n${resultados.length - falhas.length}/${resultados.length} verificações passaram.`);
process.exit(falhas.length === 0 ? 0 : 1);
