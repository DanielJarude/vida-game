/**
 * VIDA 27 · §2 — distribuição das condições de saúde em vidas inteiras.
 *
 * Duas medidas:
 *  1. MODELO: Monte Carlo só do risco anual do catálogo (`corpo.modeloCondicao`), para perfis fixos de fatores
 *     (saudável, médio, sedentário, sedentário + obesidade + família…). Mostra a prevalência acumulada por idade.
 *  2. VIDAS: vidas inteiras com agentes variados (o motor de verdade: check-ups, eventos, consultas), contando quem
 *     tem cada condição (com ou sem diagnóstico) aos 30/45/60/75, separado por hábitos.
 *
 *   npx esbuild scripts/sim/saude27.ts --bundle --platform=node --outfile=<scratch>/s27.cjs && N=40 node <scratch>/s27.cjs
 */
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { idade } from '../../src/motor/nucleo';
import { podeTentar } from '../../src/motor/plausibilidade';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { criarRng } from '../../src/motor/rng';
import { modeloCondicao, type FatoresDeRisco } from '../../src/motor/sistemas/corpo';
import type { Classe, Vida } from '../../src/motor/tipos';
import { agente } from './agentes';

const N = Number(process.env.N ?? 30);
const ATE = Number(process.env.ATE ?? 80);
const SO_MODELO = process.env.SO_MODELO === '1';
const CONDS = ['hipertensao', 'diabetes', 'depressao', 'ansiedade', 'coluna', 'cancer'];
const IDADES = [30, 45, 60, 75];

function modelo() {
  const base: FatoresDeRisco = { sedentario: false, fuma: false, estresse: 35, felicidade: 60, trabalhoPesado: false, municipioId: 'sao-paulo-sp', naFamilia: () => false };
  const perfis: [string, Partial<FatoresDeRisco>][] = [
    ['saudável (ativo, peso ok)', { forma: 75, gordura: -0.3, alimentacao: 'equilibrada' } as Partial<FatoresDeRisco>],
    ['comum (sem fator)', {}],
    ['sedentário', { sedentario: true, forma: 30 } as Partial<FatoresDeRisco>],
    ['família com pressão alta', { naFamilia: (id: string) => id === 'hipertensao' }],
    ['sedentário + sobrepeso', { sedentario: true, gordura: 1.5, forma: 25 } as Partial<FatoresDeRisco>],
    ['sedent.+obeso+família+bebe+estresse', { sedentario: true, gordura: 2.8, forma: 15, bebeMuito: true, estresse: 70, naFamilia: () => true } as Partial<FatoresDeRisco>]
  ];
  const r = criarRng(2027);
  console.log('## 1. Modelo (prevalência acumulada da condição, 4000 vidas por perfil)\n');
  console.log(`| perfil | condição | ${IDADES.map(i => `aos ${i}`).join(' | ')} |\n|---|---|${IDADES.map(() => '---').join('|')}|`);
  for (const [nome, f] of perfis) {
    const fat = { ...base, ...f } as FatoresDeRisco;
    for (const id of ['hipertensao', 'diabetes', 'cancer']) {
      const m = modeloCondicao(id)!;
      const cont = IDADES.map(() => 0);
      for (let k = 0; k < 4000; k++) {
        let teve = false;
        for (let i = 0; i <= 75; i++) {
          if (!teve && r.chance(m.risco(fat, i))) teve = true;
          const ix = IDADES.indexOf(i);
          if (ix >= 0 && teve) cont[ix]++;
        }
      }
      console.log(`| ${nome} | ${id} | ${cont.map(c => `${Math.round(c / 40)}%`).join(' | ')} |`);
    }
  }
}

const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
async function vidas() {
  await carregarMundo();
  const PERFIS = ['social', 'estudioso', 'ambicioso', 'esportista', 'familiar', 'passivo', 'aleatorio', 'impulsivo'];
  const CLASSES: Classe[] = ['vulneravel', 'trabalhadora', 'media_baixa', 'media', 'alta'];
  const CIDS = ['recife-pe', 'sao-paulo-sp', 'salvador-ba', 'porto-alegre-rs', 'belem-pa', 'uberaba-mg'];
  // grupo → idade → condição → contagem; e quantos vivos naquela idade
  const tem: Record<string, Record<number, Record<string, number>>> = {};
  const vivos: Record<string, Record<number, number>> = {};
  const origem: Record<string, number> = {};
  let n = 0;
  const t0 = Date.now();
  for (let k = 0; k < N; k++) {
    const perfil = PERFIS[k % PERFIS.length];
    const semente = 27000 + k * 13;
    let v = criarVida({ nome: 'Sim', sobrenome: 'Saúde', genero: k % 2 ? 'masculino' : 'feminino', municipioId: CIDS[k % CIDS.length], semente, classe: CLASSES[(k * 3) % 5] });
    const ag = agente(perfil);
    const r = criarRng(semente);
    let sedAnos = 0, anos = 0;
    try {
      while (!v.morte && idade(v) < ATE) {
        for (const a of ag.agir(v, r)) { if (!tenta(v, a)) continue; v = executar(v, a).vida; for (let j = 0; j < 12 && v.momento && !v.morte; j++) v = executar(v, { tipo: 'decidir', opcaoId: ag.decidir(v, v.momento!, r) }).vida; }
        v = avancarAno(v).vida;
        for (let j = 0; j < 12 && v.momento && !v.morte; j++) v = executar(v, { tipo: 'decidir', opcaoId: ag.decidir(v, v.momento!, r) }).vida;
        const i = idade(v);
        if (i >= 25) { anos++; if (v.corpo.habitos.sedentario) sedAnos++; }
        if (IDADES.includes(i)) {
          const grupos = ['todos', anos && sedAnos / anos > 0.5 ? 'mais sedentário' : 'mais ativo'];
          for (const g of grupos) {
            ((vivos[g] ??= {})[i] = (vivos[g][i] ?? 0) + 1);
            for (const c of v.corpo.condicoes) { const x = ((tem[g] ??= {})[i] ??= {}); x[c.id] = (x[c.id] ?? 0) + 1; }
          }
        }
      }
    } catch (e) { console.log(`travou #${k}: ${(e as Error).message}`); continue; }
    n++;
    for (const c of v.corpo.condicoes) if (c.id === 'hipertensao') origem[c.diagnosticada === false ? 'sem diagnóstico' : 'diagnosticada'] = (origem[c.diagnosticada === false ? 'sem diagnóstico' : 'diagnosticada'] ?? 0) + 1;
  }
  console.log(`\n## 2. Vidas inteiras (${n} vidas, ${((Date.now() - t0) / 1000).toFixed(0)} s) — % dos vivos naquela idade com a condição\n`);
  for (const g of Object.keys(vivos)) {
    console.log(`\n### ${g}\n\n| condição | ${IDADES.map(i => `aos ${i} (n=${vivos[g][i] ?? 0})`).join(' | ')} |\n|---|${IDADES.map(() => '---').join('|')}|`);
    for (const c of CONDS) console.log(`| ${c} | ${IDADES.map(i => (vivos[g][i] ? `${Math.round(((tem[g]?.[i]?.[c] ?? 0) / vivos[g][i]) * 100)}%` : '—')).join(' | ')} |`);
  }
  console.log(`\nHipertensão no fim da vida: ${JSON.stringify(origem)}`);
}

async function main() { modelo(); if (!SO_MODELO) await vidas(); }
void main();
