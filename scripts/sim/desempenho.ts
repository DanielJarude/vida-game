/**
 * DESEMPENHO do motor e TAMANHO do save (FIX pós-REWORK 4). Vidas inteiras com as estratégias dos sims; mede o tempo
 * por ano simulado (só `avancarAno` + as ações), o tamanho do save no fim e de que partes ele é feito.
 *
 *   npx esbuild scripts/sim/desempenho.ts --bundle --platform=node --outfile=<scratch>/des.cjs && node <scratch>/des.cjs
 *   VIDAS=40 IDADE=60 node <scratch>/des.cjs          (node --cpu-prof para o perfil)
 */
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar } from '../../src/motor/acoes';
import { criarRng } from '../../src/motor/rng';
import { podeTentar } from '../../src/motor/plausibilidade';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { sortearMunicipio } from '../../src/motor/dados/lugares';
import { sortearNome, sortearSobrenome } from '../../src/motor/dados/nomes';
import { estrategia } from './estrategias';
import type { Vida } from '../../src/motor/tipos';

const NOMES = ['passivo', 'familiar', 'ambicioso', 'estudioso', 'impulsivo', 'social', 'antissocial', 'economico', 'gastador'];
const N = Number(process.env.VIDAS ?? 24);
const IDADE = Number(process.env.IDADE ?? 50);
const PAISES = (process.env.PAISES ?? 'BR,US,JP,NG,ES,AU').split(',');

async function principal() {
  await carregarMundo();
  let anos = 0;
  let ms = 0;
  const tamanhos: number[] = [];
  const partes: Record<string, number> = {};
  for (let s = 1; s <= N; s++) {
    const pais = PAISES[s % PAISES.length];
    const rr = criarRng(91000 + s * 7919);
    const m = sortearMunicipio(() => rr.next(), pais);
    const genero = s % 2 ? 'feminino' : 'masculino';
    let v: Vida = criarVida({ nome: sortearNome(rr, genero, 2026, pais, m.uf), sobrenome: sortearSobrenome(rr, pais, m.uf), genero, municipioId: m.id, semente: 700000 + s * 104729 });
    const e = estrategia(NOMES[s % NOMES.length]);
    const r = criarRng(s * 37 + 11);
    for (let k = 0; k < IDADE && !v.morte; k++) {
      const t0 = performance.now();
      for (const a of e.agir(v, r)) if (podeTentar(disponibilidade(v, a))) v = executar(v, a).vida;
      v = avancarAno(v).vida;
      for (let j = 0; j < 12 && v.momento; j++) v = executar(v, { tipo: 'decidir', opcaoId: e.decidir(v, v.momento, r) }).vida;
      ms += performance.now() - t0;
      anos++;
    }
    const json = JSON.stringify(v);
    tamanhos.push(json.length);
    for (const [k, x] of Object.entries(v)) partes[k] = (partes[k] ?? 0) + JSON.stringify(x ?? null).length;
  }
  const media = tamanhos.reduce((a, b) => a + b, 0) / tamanhos.length;
  console.log(`${N} vidas, até ${IDADE} anos: ${anos} anos simulados`);
  console.log(`tempo por ano simulado: ${(ms / anos).toFixed(2)} ms`);
  console.log(`save no fim: média ${(media / 1024).toFixed(1)} kB, máximo ${(Math.max(...tamanhos) / 1024).toFixed(1)} kB`);
  console.log('partes do save (média, kB):');
  for (const [k, x] of Object.entries(partes).sort((a, b) => b[1] - a[1]).slice(0, 14)) console.log(`  ${k.padEnd(14)} ${(x / N / 1024).toFixed(1)}`);
}
void principal();
