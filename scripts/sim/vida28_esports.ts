// VIDA 28 — auditoria da progressão de e-sports: começa aos 14, treina a sério, faz peneira todo ano e aceita propostas.
// FOCO=1 escolhe o foco de treino todo ano (mecânica); FOCO=0 não escolhe. Mede o degrau e o nível de jogo aos 18/21/24.
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar } from '../../src/motor/acoes';
import type { Vida } from '../../src/motor/tipos';
import { idade } from '../../src/motor/nucleo';
import { podeTentar } from '../../src/motor/plausibilidade';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { entrarNaVida } from '../../src/motor/mundo/vida';
import { nivelDeJogo25 } from '../../src/motor/v25/esports/esports25';
import { estrategia } from './estrategias';
import { criarRng } from '../../src/motor/rng';

await carregarMundo();
const N = Number(process.env.VIDAS ?? 40);
const FOCO = process.env.FOCO ?? 'mecanica';
const JOGO = process.env.JOGO ?? 'cs';
const marcas: Record<number, { nivel: number[]; nj: number[]; pro: number }> = { 18: { nivel: [], nj: [], pro: 0 }, 21: { nivel: [], nj: [], pro: 0 }, 24: { nivel: [], nj: [], pro: 0 } };
const tal: number[] = [];
let freela = 0; const estranhos = new Map<string, number>();
for (let s = Number(process.env.DE ?? 1); s <= N; s++) { const t0 = Date.now();
  let v: Vida = criarVida({ nome: 'Lia', sobrenome: 'Teste', genero: s % 2 ? 'feminino' : 'masculino', semente: 77000 + s * 31, municipioId: 'campinas-sp', ano: 2010 } as never);
  entrarNaVida(v);
  const fazer = (a: never) => { if (podeTentar(disponibilidade(v, a))) v = executar(v, a).vida; };
  const est = estrategia('estudioso'); const rr = criarRng(s * 97);
  const responder = () => { for (let k = 0; k < 12 && v.momento && !v.morte; k++) v = executar(v, { tipo: 'decidir', opcaoId: est.decidir(v, v.momento!, rr) } as never).vida; };
  while (!v.morte && idade(v) < 25) {
    if (idade(v) === 14 && !v.esports25) { fazer({ tipo: 'esports25', oque: { op: 'comecar', jogo: JOGO } } as never); const r = v.rotinas.find(x => x.id === 'esports'); if (r) r.nivel = Number(process.env.INT ?? 3); if (v.esports25) tal.push(v.esports25.talento); }
    if (v.esports25 && v.esports25.fase !== 'encerrada') {
      const r = v.rotinas.find(x => x.id === 'esports'); if (r) r.nivel = Number(process.env.INT ?? 3);
      if (FOCO !== '0') fazer({ tipo: 'esports25', oque: { op: 'treinar', foco: FOCO } } as never);
      fazer({ tipo: 'esports25', oque: { op: 'aceitar' } } as never);
      fazer({ tipo: 'esports25', oque: { op: 'peneira' } } as never);
      fazer({ tipo: 'esports25', oque: { op: 'aceitar' } } as never);
    }
    if (process.env.DBG) console.error(`  ${s} idade ${idade(v)} t ${Date.now() - t0}ms`);
    if (Date.now() - t0 > 20000) { console.error('PRESO', JSON.stringify({ momento: v.momento && { id: (v.momento as any).id, titulo: (v.momento as any).titulo, opcoes: v.momento.opcoes.map((o: any) => ({ id: o.id, d: o.disponivel })) }, pendente: v.caminhos.pendente, t: v.t })); break; }
    v = avancarAno(v).vida; responder(); entrarNaVida(v);
    const i = idade(v);
    if (marcas[i] && v.esports25) { marcas[i].nivel.push(v.esports25.nivel); marcas[i].nj.push(nivelDeJogo25(v.esports25)); if (v.esports25.fase === 'profissional') marcas[i].pro++; }
  }
  console.error(`vida ${s} ${Date.now() - t0}ms idade ${idade(v)} fase ${v.esports25?.fase} nivel ${v.esports25?.nivel}`);
  for (const b of v.biografia) if (/cliente|freela|orçamento|ferramenta/i.test(b.texto) && b.tema === 'trabalho') { freela++; estranhos.set(b.texto.slice(0, 80), (estranhos.get(b.texto.slice(0, 80)) ?? 0) + 1); }
}
const med = (a: number[]) => a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length * 10) / 10 : 0;
const dist = (a: number[]) => [1, 2, 3, 4, 5].map(n => `${n}:${a.filter(x => x === n).length}`).join(' ');
console.log(`jogo ${JOGO} foco ${FOCO} vidas ${N} talento médio ${med(tal)}`);
for (const [i, m] of Object.entries(marcas)) console.log(`aos ${i}: nível de jogo médio ${med(m.nj)} · degraus ${dist(m.nivel)} · profissionais ${m.pro}`);
console.log(`eventos de cliente/freela/orçamento: ${freela}`); for (const [k, n] of estranhos) console.log(`  ${n}× ${k}`);
