/**
 * REWORK 9 · NPC-01 — as profissões de quem está na vida. N vidas vividas até os 45 (com decisões respondidas pela
 * primeira opção livre): as ocupações de pais, irmãos, parceiros (e ex), amigos, genros e noras — quantas diferentes,
 * quanto as cinco mais comuns concentram, e a divisão por gênero das mais comuns. Roda igual antes e depois.
 *
 *   npx esbuild scripts/sim/ocupacoes9.ts --bundle --platform=node --outfile=<scratch>/o9.cjs && N=40 node <scratch>/o9.cjs
 */
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { executar } from '../../src/motor/acoes';
import type { Vida } from '../../src/motor/tipos';
import { idadePessoa } from '../../src/motor/nucleo';

const N = Number(process.env.N ?? 30);
const CIDADES = ['recife-pe', 'sao-paulo-sp', 'porto-alegre-rs', 'belem-pa', 'uberaba-mg', 'salvador-ba'];
type Grupo = 'pais' | 'irmaos' | 'parceiros' | 'amigos' | 'genros';
const cont: Record<Grupo, Map<string, { n: number; f: number; m: number }>> = { pais: new Map(), irmaos: new Map(), parceiros: new Map(), amigos: new Map(), genros: new Map() };
const NAO = /^(estudante|aposentad|desempregad|do lar)/;

function responder(v: Vida): Vida {
  for (let k = 0; k < 12 && v.momento && !v.morte; k++) { const op = v.momento.opcoes.find(o => !o.bloqueio) ?? v.momento.opcoes[0]; v = executar(v, { tipo: 'decidir', opcaoId: op.id }).vida; }
  return v;
}
for (let k = 0; k < N; k++) {
  let v = criarVida({ nome: 'Pessoa', sobrenome: 'Teste', genero: k % 2 ? 'feminino' : 'masculino', municipioId: CIDADES[k % CIDADES.length], semente: 7000 + k });
  for (let a = 0; a < 45 && !v.morte; a++) { v = responder(avancarAno(v).vida); v.momento = null; }
  for (const vin of Object.values(v.vinculos)) {
    const p = v.pessoas[vin.pessoaId];
    if (!p || p.especie || idadePessoa(v, p) < 20 || !p.ocupacao || NAO.test(p.ocupacao)) continue;
    const g: Grupo | undefined = vin.parentesco === 'mae' || vin.parentesco === 'pai' ? 'pais' : vin.parentesco === 'irmao' ? 'irmaos' : vin.parentesco === 'genro' || vin.parentesco === 'nora' ? 'genros' : vin.romance ? 'parceiros' : !vin.parentesco ? 'amigos' : undefined;
    if (!g) continue;
    const ocKey = p.ocupacaoId ?? p.ocupacao;
    const x = cont[g].get(ocKey) ?? { n: 0, f: 0, m: 0 };
    x.n++; if (p.genero === 'feminino') x.f++; else x.m++;
    cont[g].set(ocKey, x);
  }
}
for (const g of Object.keys(cont) as Grupo[]) {
  const lista = [...cont[g].entries()].sort((a, b) => b[1].n - a[1].n);
  const tot = lista.reduce((s, [, x]) => s + x.n, 0);
  const top5 = lista.slice(0, 5).reduce((s, [, x]) => s + x.n, 0);
  console.log(`\n== ${g}: ${tot} pessoas, ${lista.length} ocupações diferentes, as 5 mais comuns = ${tot ? Math.round(top5 / tot * 100) : 0}%`);
  for (const [oc, x] of lista.slice(0, 8)) console.log(`   ${String(x.n).padStart(4)}  ${oc.padEnd(28)} (${x.f} mulheres, ${x.m} homens)`);
}
