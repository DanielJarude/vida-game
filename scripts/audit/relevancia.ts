/** Verificação: todo log emitido declara relevancia e ela bate com o texto. */
import { readFileSync } from 'node:fs';
const ARQS = ['careerSystem','educationSystem','economySystem','familySystem','relationshipSystem','agingSystem','eventSystem'];
let semRel = 0, total = 0;
for (const a of ARQS) {
  const src = readFileSync(`src/systems/${a}.ts`, 'utf8').split('\n');
  for (let i = 0; i < src.length; i++) {
    if (!/^\s*categoria: '/.test(src[i])) continue;
    total++;
    const bloco = src.slice(Math.max(0,i-4), i+7).join('\n');
    const rel = bloco.match(/relevancia: ('?\w+'?|contextoNarrativo[^\n,]*)/);
    const txt = (src[i+1]||'').replace(/^\s*texto: /, '').slice(0, 58);
    if (!rel) { semRel++; console.log(`SEM RELEVANCIA  ${a}:${i+1}  ${txt}`); }
    else console.log(`${String(rel[1]).padEnd(12)} ${a.padEnd(20)} ${txt}`);
  }
}
console.log(`\ntotal de logs: ${total} · sem relevancia: ${semRel}`);
