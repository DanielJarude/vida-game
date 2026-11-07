/** VIDA 12.9 — população: dívida e patrimônio aos 66 (comparar com a base). */
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { nova } from '../../src/motor/__tests__/ajuda';
import { avancarAno } from '../../src/motor/ano';
import { executar } from '../../src/motor/acoes';
import { idade } from '../../src/motor/nucleo';
import type { Vida } from '../../src/motor/tipos';
// Escolhas ao acaso (estável por vida): o primeiro botão não é o jeito de todo mundo.
function responder(v: Vida, k: number): Vida { for (let i = 0; i < 12 && v.momento && !v.morte; i++) { const ops = v.momento.opcoes.filter(o => !o.bloqueio); const op = ops[(k * 7 + i * 13 + v.t) % Math.max(1, ops.length)] ?? v.momento.opcoes[0]; v = executar(v, { tipo: 'decidir', opcaoId: op.id }).vida; } return v; }
function viverAte(v: Vida, alvo: number, k: number): Vida { while (!v.morte && idade(v) < alvo) v = responder(avancarAno(responder(v, k)).vida, k); return v; }
import { patrimonio } from '../../src/motor/sistemas/dinheiro';
await carregarMundo();
const N = Number(process.env.N ?? 60);
const res: { div: number; pat: number; insolv: boolean; neg: boolean }[] = [];
for (let s = 1; s <= N; s++) {
  const v = viverAte(nova({ semente: 1000 + s, genero: s % 2 ? 'feminino' : 'masculino', municipioId: ['sao-paulo-sp', 'recife-pe', 'belo-horizonte-mg'][s % 3] } as never), 66, s);
  if (v.morte) continue;
  const div = v.financas.dividas.reduce((a, d) => a + d.saldo, 0);
  res.push({ div, pat: patrimonio(v), insolv: v.financas.dividas.some(d => /insolv/i.test(d.descricao ?? '')), neg: !!v.financas.negativado });
}
const q = (xs: number[], p: number) => { const s = [...xs].sort((a, b) => a - b); return Math.round(s[Math.floor(p * (s.length - 1))]); };
console.log(`vivas ${res.length} | dívida>20k ${res.filter(r => r.div > 20000).length} | insolvência ${res.filter(r => r.insolv).length} | negativado ${res.filter(r => r.neg).length} | patrimônio<0 ${res.filter(r => r.pat < 0).length} | patrimônio p25/p50/p75 ${q(res.map(r => r.pat), 0.25)}/${q(res.map(r => r.pat), 0.5)}/${q(res.map(r => r.pat), 0.75)}`);
