/**
 * REWORK 9 · EDU-01 — a distribuição do desempenho escolar. N vidas até os 18 (decisões pela primeira opção livre):
 * o desempenho da escola aos 10, 14 e 17 (média, desvio, extremos, percentis), a distância entre a matéria mais forte e
 * a mais fraca de cada pessoa, a nota esperada do ENEM aos 17, a mobilidade (quem mudou de faixa entre os 10 e os 17)
 * e a sensibilidade às escolhas (postura dedicada × relaxada, a partir dos 11). Roda igual antes e depois.
 *
 *   npx esbuild scripts/sim/escola9.ts --bundle --platform=node --outfile=<scratch>/e9.cjs && N=80 node <scratch>/e9.cjs
 */
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { executar } from '../../src/motor/acoes';
import type { Vida } from '../../src/motor/tipos';
import { idade } from '../../src/motor/nucleo';
import { MATERIAS } from '../../src/motor/dados/frentes';
import { habilidade } from '../../src/motor/sistemas/frentes';
import { AREAS_ENEM, notaEsperadaArea } from '../../src/motor/sistemas/escola';

const N = Number(process.env.N ?? 60);
const CIDADES = ['recife-pe', 'sao-paulo-sp', 'porto-alegre-rs', 'belem-pa', 'uberaba-mg', 'salvador-ba', 'manaus-am', 'curitiba-pr'];
function responder(v: Vida): Vida {
  for (let k = 0; k < 12 && v.momento && !v.morte; k++) { const op = v.momento.opcoes.find(o => !o.bloqueio) ?? v.momento.opcoes[0]; v = executar(v, { tipo: 'decidir', opcaoId: op.id }).vida; }
  return v;
}
const est = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.reduce((a, b) => a + b, 0) / (s.length || 1);
  const sd = Math.sqrt(s.reduce((a, b) => a + (b - m) ** 2, 0) / (s.length || 1));
  const p = (q: number) => s[Math.min(s.length - 1, Math.floor(q * s.length))];
  return `n=${s.length} média ${m.toFixed(1)} dp ${sd.toFixed(1)} | min ${s[0]?.toFixed(0)} p10 ${p(0.1)?.toFixed(0)} p50 ${p(0.5)?.toFixed(0)} p90 ${p(0.9)?.toFixed(0)} max ${s[s.length - 1]?.toFixed(0)}`;
};
const faixa = (x: number) => (x >= 75 ? 'excelente' : x >= 60 ? 'bom' : x >= 45 ? 'mediano' : 'dificuldade');

function rodar(postura?: 'dedicada' | 'relaxada') {
  const d: Record<number, number[]> = { 10: [], 14: [], 17: [] };
  const spread: number[] = [], enem: number[] = [];
  const faixas: Record<string, number> = {};
  let mudou = 0, total = 0;
  for (let k = 0; k < N; k++) {
    let v = criarVida({ nome: 'Aluno', sobrenome: 'Teste', genero: k % 2 ? 'feminino' : 'masculino', municipioId: CIDADES[k % CIDADES.length], semente: 9100 + k });
    let aos10: number | undefined;
    for (let a = 0; a < 17 && !v.morte; a++) {
      if (postura && idade(v) >= 11 && v.educacao.postura !== postura) v = executar(v, { tipo: 'postura', valor: postura }).vida;
      v = responder(avancarAno(v).vida); v.momento = null;
      const i = idade(v), b = v.educacao.basica;
      if (b && !v.educacao.evadiu && (i === 10 || i === 14 || i === 17)) d[i].push(b.desempenho);
      if (i === 10 && b) aos10 = b.desempenho;
      if (i === 17 && b && !v.educacao.evadiu) {
        const hs = MATERIAS.map(m => habilidade(v, m));
        spread.push(Math.max(...hs) - Math.min(...hs));
        enem.push(AREAS_ENEM.reduce((s, x) => s + notaEsperadaArea(v, x), 0) / AREAS_ENEM.length);
        faixas[faixa(b.desempenho)] = (faixas[faixa(b.desempenho)] ?? 0) + 1;
        if (aos10 !== undefined) { total++; if (faixa(aos10) !== faixa(b.desempenho)) mudou++; }
      }
    }
  }
  return { d, spread, enem, faixas, mobilidade: total ? Math.round(mudou / total * 100) : 0 };
}

for (const p of [undefined, 'dedicada', 'relaxada'] as const) {
  const x = rodar(p);
  console.log(`\n== ${p ?? 'sem intervenção'}`);
  for (const i of [10, 14, 17]) console.log(`  desempenho aos ${i}: ${est(x.d[i])}`);
  console.log(`  forte − fraca (aos 17): ${est(x.spread)}`);
  console.log(`  ENEM esperado (aos 17): ${est(x.enem)}`);
  console.log(`  faixas aos 17: ${JSON.stringify(x.faixas)} · mudou de faixa entre 10 e 17: ${x.mobilidade}%`);
}
