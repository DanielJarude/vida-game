// Ciclos de import ESTÁTICO entre os chunks de um build (dist/assets): componentes fortemente conexos com mais de um chunk.
import { readdirSync, readFileSync } from 'node:fs';
const dir = process.argv[2];
const arqs = readdirSync(dir).filter(f => f.endsWith('.js'));
const nome = f => f.replace(/-[A-Za-z0-9_]{8}\.js$/, '');
const g = new Map();
for (const f of arqs) {
  const s = readFileSync(`${dir}/${f}`, 'utf8');
  const deps = new Set();
  for (const m of s.matchAll(/(?:^|[;\n}])\s*import\s*(?:[^'"()]*?from\s*)?["']\.\/([^"']+\.js)["']/g)) deps.add(m[1]);
  g.set(f, [...deps]);
}
let idx = 0; const ind = new Map(), low = new Map(), pilha = [], na = new Set(), comps = [];
function tarjan(v) { ind.set(v, idx); low.set(v, idx); idx++; pilha.push(v); na.add(v);
  for (const w of g.get(v) ?? []) { if (!g.has(w)) continue; if (!ind.has(w)) { tarjan(w); low.set(v, Math.min(low.get(v), low.get(w))); } else if (na.has(w)) low.set(v, Math.min(low.get(v), ind.get(w))); }
  if (low.get(v) === ind.get(v)) { const c = []; let w; do { w = pilha.pop(); na.delete(w); c.push(w); } while (w !== v); if (c.length > 1) comps.push(c.map(nome).sort()); } }
for (const v of g.keys()) if (!ind.has(v)) tarjan(v);
for (const c of comps) console.log(c.length, c.join(' '));
