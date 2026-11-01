/** VIDA 12.5 · auditoria de sistemas — sonda de elegibilidade dos conteúdos nunca sorteados (lista em NUNCA=arquivo). */
import { readFileSync } from 'node:fs';
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { executar } from '../../src/motor/acoes';
import { idade } from '../../src/motor/nucleo';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { criarRng } from '../../src/motor/rng';
import { preparar } from '../../src/motor/conteudo/motor';
import { CATALOGO } from '../../src/motor/conteudo/catalogo';
import type { Vida, Classe } from '../../src/motor/tipos';
await carregarMundo();
const ids = new Set(readFileSync(process.env.NUNCA!, 'utf8').split('\n').filter(Boolean));
const alvo = CATALOGO.filter(c => ids.has(c.id));
const CLS: Classe[] = ['vulneravel', 'trabalhadora', 'media_baixa', 'media', 'alta'];
const CID = ['recife-pe', 'sao-paulo-sp', 'salvador-ba', 'porto-alegre-rs', 'belem-pa', 'uberaba-mg'];
const anosEleg: Record<string, number> = {}, vidasEleg: Record<string, number> = {}, viu: Record<string, number> = {}, exemplo: Record<string, string> = {};
const N = Number(process.env.N ?? 18), ATE = Number(process.env.ATE ?? 80);
for (let k = 0; k < N; k++) {
  const s = 125500 + k * 11;
  let v: Vida = criarVida({ nome: 'Sim', sobrenome: 'Sonda', genero: k % 2 ? 'masculino' : 'feminino', municipioId: CID[k % CID.length], semente: s, classe: CLS[k % 5] });
  const aqui = new Set<string>();
  while (!v.morte && idade(v) < ATE) {
    v = avancarAno(v).vida;
    for (let j = 0; j < 12 && v.momento; j++) { const ops = v.momento!.opcoes.filter(o => !o.bloqueio); v = executar(v, { tipo: 'decidir', opcaoId: ops[(j + k + idade(v)) % ops.length].id }).vida; }
    const w = structuredClone(v); const r = criarRng(s + idade(v));
    for (const c of alvo) { if (preparar(c, w, r)) { anosEleg[c.id] = (anosEleg[c.id] ?? 0) + 1; aqui.add(c.id); exemplo[c.id] ??= `s=${s} ${idade(v)}a`; } }
  }
  for (const id of aqui) vidasEleg[id] = (vidasEleg[id] ?? 0) + 1;
  for (const o of v.ocorrencias) if (ids.has(o.id)) viu[o.id] = (viu[o.id] ?? 0) + 1;
  process.stderr.write(`vida ${k} ${idade(v)}a\n`);
}
const nunca = alvo.filter(c => !anosEleg[c.id]).map(c => `${c.id}${c.manual ? '(manual)' : ''}`);
console.log(`# Sonda: ${alvo.length} conteúdos, ${N} vidas`);
console.log(`## NUNCA elegíveis (preparar() nulo em todos os anos de todas as vidas): ${nunca.length}`); console.log(nunca.join(' '));
console.log('## Elegíveis (anos elegíveis / vidas) e quantas vezes de fato aconteceram nestas vidas');
for (const c of alvo.filter(c => anosEleg[c.id]).sort((a, b) => anosEleg[b.id] - anosEleg[a.id])) console.log(`- ${c.id}${c.manual ? '(manual)' : ''} [${c.tipo}${c.prioritario ? ',prior' : ''}]: ${anosEleg[c.id]} anos / ${vidasEleg[c.id]} vidas; aconteceu ${viu[c.id] ?? 0}; ex ${exemplo[c.id]}`);
