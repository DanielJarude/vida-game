/**
 * VIDA 17 · sim: a cota global de mensagens recebidas (≤ 4 por ano, todas as fontes) e a variedade das mensagens.
 *   npx esbuild scripts/sim/mensagens17.ts --bundle --platform=node --outfile=<scratch>/m17.cjs && N=30 node <scratch>/m17.cjs
 * Conta, por ano do calendário, as mensagens recebidas (celular15: msgs + arquivo16, sem as escritas e os chamados
 * guardados) e os chamados novos das pessoas; responde às mensagens com escolhas aleatórias (inclusive escrever).
 */
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { criarRng } from '../../src/motor/rng';
import { podeTentar } from '../../src/motor/plausibilidade';
import { estrategia } from './estrategias';
import { opcoesDaMsg15 } from '../../src/motor/v15/celular/celular15';
import { anoDe } from '../../src/motor/tempo';
import type { Vida } from '../../src/motor/tipos';

const N = Number(process.env.N ?? 20);
const ANOS = Number(process.env.ANOS ?? 70);
const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const porAno = new Map<string, number>();
const sits = new Map<string, number>();
const textos = new Set<string>();
const respostas = new Map<string, number>();
let total = 0, erros = 0, maxAno = 0, anosAcima = 0, anosContados = 0;
const perfis = ['equilibrado', 'sair_noite', 'gastador', 'aleatorio', 'dedicada'];
for (let s = 1; s <= N; s++) {
  let v: Vida = criarVida({ nome: 'Ana', sobrenome: 'Silva', genero: s % 2 ? 'feminino' : 'masculino', municipioId: s % 3 ? 'recife-pe' : 'sao-paulo-sp', semente: s * 11 + 1 });
  const e = estrategia(perfis[s % perfis.length]);
  const r = criarRng(s * 17 + 3);
  const vistos = new Set<string>();
  const chamados = new Set<string>();
  const cont = new Map<number, number>();
  const conta = (t: number) => cont.set(anoDe(t), (cont.get(anoDe(t)) ?? 0) + 1);
  const olhar = () => {
    for (const m of [...(v.celular15?.msgs ?? []), ...(v.celular15?.arquivo16 ?? [])]) {
      if (vistos.has(m.id) || m.tipo === 'escrita' || m.tipo === 'chamado') continue;
      vistos.add(m.id); conta(m.t); total++;
      sits.set(m.sit17 ?? m.tipo, (sits.get(m.sit17 ?? m.tipo) ?? 0) + 1);
      textos.add(m.texto.replace(/[A-ZÁÉ][a-záéíóúãõç]+/g, 'X'));
    }
    for (const vin of Object.values(v.vinculos)) if (vin.chamado) { const k = `${vin.pessoaId}_${vin.chamado.t}`; if (!chamados.has(k)) { chamados.add(k); conta(vin.chamado.t); } }
  };
  try {
    for (let k = 0; k < ANOS && !v.morte; k++) {
      for (const a of e.agir(v, r)) if (tenta(v, a)) { v = executar(v, a).vida; olhar(); }
      // Responde às mensagens pendentes ao acaso.
      for (const m of [...(v.celular15?.msgs ?? [])]) {
        const ops = opcoesDaMsg15(v, m).filter(o => podeTentar(o.veredito));
        if (!ops.length || r.chance(0.2)) continue;
        const o = r.pick(ops);
        const a: Acao = { tipo: 'celular15', oque: { op: 'responder', id: m.id, escolha: o.op } } as Acao;
        if (tenta(v, a)) { v = executar(v, a).vida; respostas.set(`${m.sit17 ?? m.tipo}:${o.op}`, (respostas.get(`${m.sit17 ?? m.tipo}:${o.op}`) ?? 0) + 1); olhar(); }
      }
      olhar();
      v = avancarAno(v).vida; olhar();
      for (let j = 0; j < 12 && v.momento; j++) v = executar(v, { tipo: 'decidir', opcaoId: e.decidir(v, v.momento, r) }).vida;
      olhar();
    }
  } catch (err) { erros++; console.log('ERRO', s, (err as Error).stack?.split('\n').slice(0, 4).join(' | ')); }
  for (const [ano, n] of cont) { anosContados++; maxAno = Math.max(maxAno, n); if (n > 4) { anosAcima++; if (anosAcima <= 8) console.log('ACIMA', s, ano, n); } porAno.set(String(n), (porAno.get(String(n)) ?? 0) + 1); }
}
console.log('vidas', N, 'mensagens', total, 'erros', erros, 'max/ano', maxAno, 'anos>4', anosAcima, 'de', anosContados);
console.log('distribuição (n/ano → anos):', [...porAno].sort().map(([a, b]) => `${a}:${b}`).join(' '));
console.log('situações:', [...sits].sort((a, b) => b[1] - a[1]).map(([a, b]) => `${a}=${b}`).join(' '));
console.log('textos distintos (sem nomes):', textos.size);
console.log('respostas distintas usadas:', respostas.size);
