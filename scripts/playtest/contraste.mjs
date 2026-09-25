// Contraste dos tokens (WCAG): texto sobre tinta, tons das áreas sobre tinta,
// texto escuro sobre os tons (botões, faixas), tinta sobre papel — também
// com os tons dessaturados do clima difícil (mistura em oklab com o cinza).
//   node scripts/playtest/contraste.mjs
import { readFileSync } from 'node:fs';
const css = readFileSync(new URL('../../src/ui/tokens.css', import.meta.url), 'utf8');
const hex = n => { const m = css.match(new RegExp(`--${n}:\\s*(#[0-9a-fA-F]{6})`)); if (!m) throw new Error(n); return m[1]; };
const rgb = h => [1, 3, 5].map(k => parseInt(h.slice(k, k + 2), 16) / 255);
const lin = c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = h => { const [r, g, b] = rgb(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
// oklab mix (aproximação suficiente para verificar contraste)
const toOklab = h => { const [r, g, b] = rgb(h).map(lin); const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b); return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s]; };
const fromOklab = ([L, a, b]) => { const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3; const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, bb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s; const g2 = c => { const x = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055; return Math.round(Math.max(0, Math.min(1, x)) * 255).toString(16).padStart(2, '0'); }; return '#' + [r, g, bb].map(g2).join(''); };
const mix = (a, b, t) => { const A = toOklab(a), B = toOklab(b); return fromOklab(A.map((x, k) => x * t + B[k] * (1 - t))); };
const fundos = ['bg-app', 'bg-raised', 'bg-elevated'];
const textos = ['text-primary', 'text-secondary', 'text-muted', 'text-faint'];
const pig = ['pig-ambar', 'pig-pessego', 'pig-goiaba', 'pig-ipe', 'pig-azulejo', 'pig-fachada', 'pig-ipe-roxo', 'pig-folha', 'success', 'danger', 'warning'];
let falhas = 0;
const checa = (rot, a, b, min) => { const r = ratio(a, b); const ok = r >= min; if (!ok) falhas++; console.log(`${ok ? '✓' : '✗'} ${rot.padEnd(46)} ${r.toFixed(2)}:1 (mín. ${min})`); };
for (const f of fundos) for (const t of textos) checa(`${t} sobre ${f}`, hex(t), hex(f), 4.5);
for (const f of ['bg-app', 'bg-raised']) for (const p of pig) checa(`${p} sobre ${f}`, hex(p), hex(f), 4.5);
for (const p of pig) checa(`tinta escura sobre ${p}`, '#1a140e', hex(p), 4.5);
for (const p of pig.slice(0, 8)) { const d = mix(hex(p), hex('cinza-quente'), 0.52); checa(`${p} (clima difícil) sobre bg-app`, d, hex('bg-app'), 4.5); checa(`tinta sobre ${p} (clima difícil)`, '#1a140e', d, 4.5); }
checa('papel-tinta sobre papel', hex('papel-tinta'), hex('papel'), 7);
checa('papel-tinta-2 sobre papel', hex('papel-tinta-2'), hex('papel'), 4.5);
checa('papel-tinta-2 sobre papel-2', hex('papel-tinta-2'), hex('papel-2'), 4.5);
console.log(falhas ? `\n${falhas} par(es) abaixo do mínimo` : '\nTodos os pares acima do mínimo.');
process.exitCode = falhas ? 1 : 0;
