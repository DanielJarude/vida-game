/**
 * REWORK 10 · EVT-01/02/03 — a variedade dos acontecimentos. Vidas inteiras (estratégias e países variados, como em
 * `repeticao.ts`); conta, por acontecimento novo (`acontecimentos10`), em quantas vidas apareceu e quantas vezes; a
 * variedade por vida (acontecimentos distintos, a fatia do mais repetido) e os ecos: quantos nasceram e quantos voltaram.
 *
 *   npx esbuild scripts/sim/acontecimentos10.ts --bundle --platform=node --outfile=<scratch>/ev10.cjs && VIDAS=200 node <scratch>/ev10.cjs
 */
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar } from '../../src/motor/acoes';
import { criarRng } from '../../src/motor/rng';
import { podeTentar } from '../../src/motor/plausibilidade';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { sortearMunicipio } from '../../src/motor/dados/lugares';
import { sortearNome, sortearSobrenome } from '../../src/motor/dados/nomes';
import { ACONTECIMENTOS_10 } from '../../src/motor/conteudo/acontecimentos10';
import { candidatos } from '../../src/motor/conteudo/motor';
import { estrategia } from './estrategias';

const NOMES = ['passivo', 'familiar', 'ambicioso', 'estudioso', 'impulsivo', 'social', 'antissocial', 'economico', 'gastador'];
const N = Number(process.env.VIDAS ?? 60);
const IDADE = Number(process.env.IDADE ?? 80);
const PAISES = (process.env.PAISES ?? 'BR,US,JP,NG,ES,AU').split(',');
const NOVOS = new Set(ACONTECIMENTOS_10.map(c => c.id));

async function principal() {
  await carregarMundo();
  const elegivel: Record<string, number> = {}, vidasCom: Record<string, number> = {}, vezes: Record<string, number> = {}, opcoes: Record<string, Record<string, number>> = {};
  let qualFatia = '';
  let distintos = 0, total = 0, novos = 0, maiorFatia = 0, ecosNasceram = 0, ecosVoltaram = 0, erros = 0;
  for (let s = 1; s <= N; s++) {
    const pais = PAISES[s % PAISES.length];
    const rr = criarRng(91000 + s * 7919);
    const m = sortearMunicipio(() => rr.next(), pais);
    const genero = s % 2 ? 'feminino' : 'masculino';
    let v = criarVida({ nome: sortearNome(rr, genero, 2026, pais, m.uf), sobrenome: sortearSobrenome(rr, pais, m.uf), genero, municipioId: m.id, semente: 610000 + s * 104729 });
    const e = estrategia(NOMES[s % NOMES.length]);
    const r = criarRng(s * 37 + 11);
    const nasceram = new Set<string>();
    try {
      for (let k = 0; k < IDADE && !v.morte; k++) {
        for (const a of e.agir(v, r)) if (podeTentar(disponibilidade(v, a))) v = executar(v, a).vida;
        for (const x of candidatos(v, criarRng(v.t), c => NOVOS.has(c.id))) elegivel[x.c.id] = (elegivel[x.c.id] ?? 0) + 1;
        v = avancarAno(v).vida;
        for (let j = 0; j < 12 && v.momento; j++) {
          const id = v.momento.situacaoId;
          const op = e.decidir(v, v.momento, r);
          const base = id.split(':')[0];
          if (NOVOS.has(base)) ((opcoes[base] ??= {})[op] = (opcoes[base][op] ?? 0) + 1);
          v = executar(v, { tipo: 'decidir', opcaoId: op }).vida;
        }
        for (const ec of v.ecos ?? []) nasceram.add(`${ec.tipo}:${ec.t}`);
      }
    } catch (err) { erros++; console.error(`vida ${s}:`, err); continue; }
    ecosNasceram += nasceram.size; ecosVoltaram += (v.ecos ?? []).filter(x => x.voltou !== undefined).length;
    const porId: Record<string, number> = {};
    for (const o of v.ocorrencias) porId[o.id] = (porId[o.id] ?? 0) + 1;
    const ids = Object.keys(porId);
    distintos += ids.length; total += v.ocorrencias.length;
    const [topo, n] = Object.entries(porId).sort((a, b) => b[1] - a[1])[0] ?? ['', 0];
    if (n / Math.max(1, v.ocorrencias.length) > maiorFatia) { maiorFatia = n / Math.max(1, v.ocorrencias.length); qualFatia = `${topo} (${n} de ${v.ocorrencias.length})`; }
    for (const id of ids) if (NOVOS.has(id)) { vidasCom[id] = (vidasCom[id] ?? 0) + 1; vezes[id] = (vezes[id] ?? 0) + porId[id]; novos += porId[id]; }
  }
  const linhas = [...NOVOS].map(id => `| ${id} | ${elegivel[id] ?? 0} | ${vidasCom[id] ?? 0} | ${vezes[id] ?? 0} | ${Object.entries(opcoes[id] ?? {}).map(([o, n]) => `${o} ${n}`).join(', ')} |`);
  console.log(`# Acontecimentos do REWORK 10 — ${N} vidas até ${IDADE} (${PAISES.join(', ')})\n`);
  console.log(`- erros: ${erros}`);
  console.log(`- acontecimentos por vida: ${(total / N).toFixed(1)} · distintos por vida: ${(distintos / N).toFixed(1)} · novos por vida: ${(novos / N).toFixed(1)}`);
  console.log(`- maior fatia de um só acontecimento numa vida: ${(maiorFatia * 100).toFixed(1)}% — ${qualFatia}`);
  console.log(`- ecos que nasceram: ${ecosNasceram} · que voltaram (ainda guardados no fim): ${ecosVoltaram}`);
  console.log(`- novos que nunca apareceram: ${[...NOVOS].filter(id => !vidasCom[id]).join(', ') || 'nenhum'}\n`);
  console.log('| acontecimento | anos elegível | vidas | vezes | escolhas |\n|---|---|---|---|---|\n' + linhas.join('\n'));
}
if (require.main === module) void principal();
