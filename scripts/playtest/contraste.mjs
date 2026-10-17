// Contraste dos tokens (WCAG), REWORK 6 — a paleta "Memória" (camada `--p-*` de tokens.css): a tinta sobre o papel
// (página, cartão, carta), os tons das áreas como texto, o branco sobre os tons (botões, selos) e sobre o coral, a
// moldura (abas e barra) e os tons dessaturados do clima difícil (mistura em oklab com o cinza).
//   node scripts/playtest/contraste.mjs
import { readFileSync } from 'node:fs';
// REWORK 6.5: os mesmos pares nos DOIS temas — o claro (`:root`) e o escuro (`:root[data-tema='escuro']`, que só
// redefine a paleta: o que ele não redefine vale o do claro).
// REWORK 7.5: as QUATRO paletas — Memória Clara (a base), Memória Escura, Horizonte Claro e Atlântico Noturno. Cada
// bloco é lido pelo seletor; o que um bloco não redefine vale o da base (a mesma cascata do navegador).
const todo = readFileSync(new URL('../../src/ui/tokens.css', import.meta.url), 'utf8');
const bloco = sel => { const i = todo.indexOf(sel); if (i < 0) throw new Error(`bloco ${sel} não achado`); return todo.slice(i, todo.indexOf('}', i)); };
const base = todo.slice(0, todo.indexOf(":root[data-tema='escuro']"));
const BLOCOS = {
  'memória clara': [base],
  'memória escura': [bloco(":root[data-tema='escuro']"), base],
  'horizonte claro': [bloco(":root[data-paleta='horizonte']"), base],
  'atlântico noturno': [bloco(":root[data-paleta='atlantico']"), bloco(":root[data-tema='escuro']"), base]
};
let css = BLOCOS['memória clara'];
const hex = n => { for (const b of css) { const m = b.match(new RegExp(`--${n}:\\s*(#[0-9a-fA-F]{6})`)); if (m) return m[1]; } throw new Error(n); };
const rgb = h => [1, 3, 5].map(k => parseInt(h.slice(k, k + 2), 16) / 255);
const lin = c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = h => { const [r, g, b] = rgb(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
// oklab mix (aproximação suficiente para verificar contraste)
const toOklab = h => { const [r, g, b] = rgb(h).map(lin); const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b); return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s]; };
const fromOklab = ([L, a, b]) => { const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3; const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, bb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s; const g2 = c => { const x = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055; return Math.round(Math.max(0, Math.min(1, x)) * 255).toString(16).padStart(2, '0'); }; return '#' + [r, g, bb].map(g2).join(''); };
const mix = (a, b, t) => { const A = toOklab(a), B = toOklab(b); return fromOklab(A.map((x, k) => x * t + B[k] * (1 - t))); };
const P = n => hex(`p-${n}`);
const papeis = ['papel', 'papel-alto', 'papel-topo'];
const areas = ['linha', 'voce', 'pessoas', 'formacao', 'trabalho', 'tempo', 'vida', 'cidade', 'saude'];
let falhas = 0;
const checa = (rot, a, b, min) => { const r = ratio(a, b); const ok = r >= min; if (!ok) falhas++; console.log(`${ok ? '✓' : '✗'} ${rot.padEnd(46)} ${r.toFixed(2)}:1 (mín. ${min})`); };
for (const tema of Object.keys(BLOCOS)) {
css = BLOCOS[tema];
console.log(`\n— tema ${tema} —`);
for (const f of papeis) { checa(`tinta sobre ${f}`, P('tinta'), P(f), 7); for (const t of ['tinta-2', 'tinta-3']) checa(`${t} sobre ${f}`, P(t), P(f), 4.5); }
for (const f of ['papel', 'papel-alto']) for (const a of [...areas, 'bom', 'ruim', 'alerta', 'info', 'acao-forte']) checa(`${a} sobre ${f}`, P(a), P(f), 4.5);
for (const a of areas) checa(`texto sobre ${a} preenchido (botão, selo)`, P('sobre-tom'), P(a), 4.5);
checa('texto sobre a tinta preenchida (chip ativo)', P('sobre-tom'), P('tinta'), 4.5);
checa('texto do botão sobre o coral (avançar)', P('acao-sobre'), P('acao'), 4.5);
for (const f of ['moldura', 'moldura-2']) for (const t of ['moldura-tinta', 'moldura-tinta-2']) checa(`${t} sobre ${f}`, P(t), P(f), 4.5);
checa('aba ativa: tinta sobre a pílula de papel', P('tinta'), P('papel'), 7);
// REWORK 7.5: os estados do mundo continuam distinguíveis entre si em cada paleta (bom ≠ ruim ≠ atenção ≠ agir), e
// nenhum tom de área se confunde com outro — distância em oklab (ΔE ≥ 0,06 entre estados; ≥ 0,035 entre áreas).
const dE = (a, b) => { const A = toOklab(a), B = toOklab(b); return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]); };
const separa = (rot, a, b, min) => { const d = dE(a, b); const ok = d >= min; if (!ok) falhas++; console.log(`${ok ? '✓' : '✗'} ${rot.padEnd(46)} ΔE ${d.toFixed(3)} (mín. ${min})`); };
const estados = ['bom', 'ruim', 'alerta', 'acao', 'info'];
for (let i = 0; i < estados.length; i++) for (let j = i + 1; j < estados.length; j++) separa(`${estados[i]} × ${estados[j]}`, P(estados[i]), P(estados[j]), 0.06);
const tonsDistintos = ['voce', 'pessoas', 'formacao', 'trabalho', 'tempo', 'saude'];
for (let i = 0; i < tonsDistintos.length; i++) for (let j = i + 1; j < tonsDistintos.length; j++) separa(`área ${tonsDistintos[i]} × ${tonsDistintos[j]}`, P(tonsDistintos[i]), P(tonsDistintos[j]), 0.035);
for (const a of areas) checa(`${a} (clima difícil) sobre papel`, mix(P(a), P('neutro'), 0.55), P('papel'), 4.5);
}
console.log(falhas ? `\n${falhas} par(es) abaixo do mínimo` : '\nTodos os pares acima do mínimo.');
process.exitCode = falhas ? 1 : 0;
