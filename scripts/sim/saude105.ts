/**
 * REWORK 10.5 · SAU-02 — a criança com sintomas persistentes: o que muda procurar atendimento (pedir aos responsáveis)
 * todo ano em que há sinal, contra não procurar (a família leva quando percebe). Crianças de 8 anos com um sinal sem
 * nome (câncer, diabetes, coluna), vividas até os 18. Mede: diagnosticadas, diagnosticadas TARDE, em tratamento aos 18,
 * mortas antes dos 18. Rode também no commit-base (lá a criança não tinha a porta do médico).
 *
 *   npx esbuild scripts/sim/saude105.ts --bundle --platform=node --outfile=<scratch>/s.cjs && N=150 node <scratch>/s.cjs
 */
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar } from '../../src/motor/acoes';
import { podeTentar } from '../../src/motor/plausibilidade';
import { criarVida } from '../../src/motor/criacao';
import { transacao } from '../../src/motor/nucleo';
import type { Vida } from '../../src/motor/tipos';

const N = Number(process.env.N ?? 150);
const CONDICOES = ['cancer', 'diabetes', 'coluna'] as const;

function vida(k: number, procura: boolean): { diag: boolean; tarde: boolean; tratando: boolean; morreu: boolean } {
  let v: Vida = criarVida({ nome: 'S', sobrenome: 'A', genero: k % 2 ? 'feminino' : 'masculino', municipioId: ['recife-pe', 'sao-paulo-sp', 'belem-pa'][k % 3], semente: 8800 + k });
  for (let a = 0; a < 8; a++) { v = avancarAno(v).vida; for (let j = 0; j < 12 && v.momento; j++) v = executar(v, { tipo: 'decidir', opcaoId: (v.momento.opcoes.find(o => !o.bloqueio) ?? v.momento.opcoes[0]).id }).vida; v = transacao(v, x => { x.momento = null; }).vida; }
  const id = CONDICOES[k % 3];
  v = transacao(v, x => { x.corpo.condicoes.push({ id, nome: id === 'cancer' ? 'câncer' : id === 'diabetes' ? 'diabetes' : 'hérnia de disco', tInicio: x.t, cronica: true, gravidade: id === 'cancer' ? 3 : 2, tratando: false, diagnosticada: false }); }).vida;
  for (let a = 0; a < 10 && !v.morte; a++) {
    const c = v.corpo.condicoes.find(x => x.id === id);
    if (procura && c && (c.diagnosticada === false || !c.tratando) && podeTentar(disponibilidade(v, { tipo: 'cuidar', cuidado: 'consulta' }))) v = executar(v, { tipo: 'cuidar', cuidado: 'consulta' }).vida;
    v = avancarAno(v).vida;
    for (let j = 0; j < 12 && v.momento; j++) v = executar(v, { tipo: 'decidir', opcaoId: (v.momento.opcoes.find(o => !o.bloqueio) ?? v.momento.opcoes[0]).id }).vida;
    v = transacao(v, x => { x.momento = null; }).vida;
  }
  const c = v.corpo.condicoes.find(x => x.id === id);
  const curou = !c && !v.morte;
  return { diag: curou || (!!c && c.diagnosticada !== false), tarde: !!c?.tarde, tratando: curou || !!c?.tratando, morreu: !!v.morte };
}

for (const procura of [false, true]) {
  const r = Array.from({ length: N }, (_, k) => vida(k, procura));
  const pct = (f: (x: typeof r[number]) => boolean) => `${Math.round(r.filter(f).length / N * 100)}%`;
  console.log(`${procura ? 'procurando atendimento' : 'sem procurar'}: diagnosticadas ${pct(x => x.diag)} · tarde ${pct(x => x.tarde)} · tratadas (ou curadas) aos 18 ${pct(x => x.tratando)} · mortas antes dos 18 ${pct(x => x.morreu)}`);
}
