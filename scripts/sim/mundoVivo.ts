/**
 * REWORK 5 — O MUNDO VIVO medido. Vidas inteiras com as estratégias dos sims (como `desempenho`): quantas notícias do
 * mundo por ano (o que aconteceu SEM o jogador escolher), de que tipo, quantos anos ficam em silêncio, e as invariantes
 * de tempo (`coerenciaTemporal`) a cada ano.
 *
 *   npx esbuild scripts/sim/mundoVivo.ts --bundle --platform=node --outfile=<scratch>/mv.cjs && node <scratch>/mv.cjs
 */
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar } from '../../src/motor/acoes';
import { criarRng } from '../../src/motor/rng';
import { podeTentar } from '../../src/motor/plausibilidade';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { sortearMunicipio } from '../../src/motor/dados/lugares';
import { sortearNome, sortearSobrenome } from '../../src/motor/dados/nomes';
import { noticiasDoAno } from '../../src/motor/sistemas/mundoVivo';
import { verificarCoerencia } from '../../src/motor/sistemas/coerencia';
import { estrategia } from './estrategias';
import type { Vida } from '../../src/motor/tipos';

const NOMES = ['passivo', 'familiar', 'ambicioso', 'estudioso', 'impulsivo', 'social', 'antissocial', 'economico', 'gastador'];
const N = Number(process.env.VIDAS ?? 24);
const IDADE = Number(process.env.IDADE ?? 60);
const PAISES = (process.env.PAISES ?? 'BR,US,JP,NG,ES,AU').split(',');

async function principal() {
  await carregarMundo();
  let anos = 0, silencio = 0, total = 0;
  const porCategoria: Record<string, number> = {};
  const porIdade: Record<string, [number, number]> = {};
  const violacoes = new Map<string, number>();
  const exemplos: string[] = [];
  for (let s = 1; s <= N; s++) {
    const pais = PAISES[s % PAISES.length];
    const rr = criarRng(91000 + s * 7919);
    const m = sortearMunicipio(() => rr.next(), pais);
    const genero = s % 2 ? 'feminino' : 'masculino';
    let v: Vida = criarVida({ nome: sortearNome(rr, genero, 2026, pais, m.uf), sobrenome: sortearSobrenome(rr, pais, m.uf), genero, municipioId: m.id, semente: 700000 + s * 104729 });
    const e = estrategia(NOMES[s % NOMES.length]);
    const r = criarRng(s * 37 + 11);
    for (let k = 0; k < IDADE && !v.morte; k++) {
      for (const a of e.agir(v, r)) if (podeTentar(disponibilidade(v, a))) v = executar(v, a).vida;
      const antes = v.biografia.length;
      v = avancarAno(v).vida;
      const ns = noticiasDoAno(v, antes);
      anos++; total += ns.length; if (!ns.length) silencio++;
      const faixa = k < 12 ? '0-11' : k < 18 ? '12-17' : k < 30 ? '18-29' : k < 50 ? '30-49' : '50+';
      porIdade[faixa] ??= [0, 0]; porIdade[faixa][0] += ns.length; porIdade[faixa][1]++;
      for (const n of ns) { porCategoria[n.categoria] = (porCategoria[n.categoria] ?? 0) + 1; if (exemplos.length < 30 && s % 3 === 0 && k % 7 === 0) exemplos.push(`[${n.categoria}] ${n.texto}`); }
      for (const x of verificarCoerencia(v, antes)) { const chave = x.replace(/\d+/g, 'N'); violacoes.set(chave, (violacoes.get(chave) ?? 0) + 1); }
      for (let j = 0; j < 12 && v.momento; j++) v = executar(v, { tipo: 'decidir', opcaoId: e.decidir(v, v.momento, r) }).vida;
    }
  }
  console.log(`${N} vidas, ${anos} anos: ${(total / anos).toFixed(2)} notícias do mundo por ano; ${(silencio / anos * 100).toFixed(0)}% dos anos sem nenhuma`);
  for (const [f, [n, a]] of Object.entries(porIdade)) console.log(`  ${f.padEnd(6)} ${(n / a).toFixed(2)} por ano`);
  console.log('por categoria:', porCategoria);
  console.log('invariantes violadas:', violacoes.size ? Object.fromEntries(violacoes) : 'nenhuma');
  console.log('\nexemplos:'); for (const x of exemplos) console.log('  ' + x);
}
void principal();
