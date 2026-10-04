/**
 * FIX pós-playtest humano — a repetição das MICROCENAS: amizades (com gente diferente) fazendo programas por anos.
 * Mede: os tipos de cena (a distribuição), o mesmo tipo em sequência com a mesma pessoa (deve ser 0), o texto
 * idêntico entre pares diferentes (sem os nomes) e o molde mais frequente.
 *
 *   npx esbuild scripts/sim/repeticaoCenas.ts --bundle --platform=node --outfile=<scratch>/rc2.cjs && node <scratch>/rc2.cjs
 */
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { adulto, comParente } from '../../src/motor/__tests__/cenarios';
import { disponibilidade, executar } from '../../src/motor/acoes';
import { podeTentar } from '../../src/motor/plausibilidade';

const PARES = Number(process.env.PARES ?? 30);
const PROGRAMAS = ['cinema', 'jantar_fora', 'caminhar_junto', 'show'];

async function principal() {
  await carregarMundo();
  const tipos = new Map<string, number>();
  const moldes = new Map<string, number>();
  let seguidos = 0, total = 0;
  for (let k = 0; k < PARES; k++) {
    let v = adulto(24 + (k % 10), { semente: 100 + k });
    v.financas.conta = 80000;
    const { p, vin } = comParente(v, 'irmao', 25 + (k % 8), k % 2 ? 'feminino' : 'masculino', 45 + (k % 5) * 8);
    vin.parentesco = undefined; vin.estagio = k % 3 ? 'amigo' : 'colega'; vin.convivio = []; p.municipioId = v.moradia.municipioId;
    let ultimo = '';
    for (let ano = 0; ano < 8; ano++) {
      const prog = PROGRAMAS.map((_x, j) => PROGRAMAS[(ano + k + j) % PROGRAMAS.length]).find(x => podeTentar(disponibilidade(v, { tipo: 'pessoa', pessoaId: p.id, interacao: x })));
      if (!prog) { v.t += 12; v.anoAtual = { acoes: [] }; continue; }
      const r = executar(v, { tipo: 'pessoa', pessoaId: p.id, interacao: prog });
      v = r.vida;
      const tipo = (v.vinculos[p.id].cenas ?? []).slice(-1)[0]?.split('.')[0] ?? '?';
      tipos.set(tipo, (tipos.get(tipo) ?? 0) + 1);
      if (tipo === ultimo) seguidos++;
      ultimo = tipo; total++;
      const molde = (r.resultado ?? '').split(p.nome).join('<N>').replace(/\d+/g, '<n>');
      moldes.set(molde, (moldes.get(molde) ?? 0) + 1);
      v.t += 12; v.anoAtual = { acoes: [] };
    }
  }
  const repetidos = [...moldes.values()].filter(n => n > 1).reduce((s, n) => s + n, 0);
  console.log(`${PARES} amizades × 8 anos = ${total} cenas · ${tipos.size} tipos · mesmo tipo seguido com a mesma pessoa: ${seguidos}`);
  console.log(`textos (sem nomes) que se repetem em outra cena: ${((repetidos / total) * 100).toFixed(1)}% · moldes distintos: ${moldes.size}`);
  console.log('tipos: ' + [...tipos].sort((a, b) => b[1] - a[1]).map(([t, n]) => `${t} ${((n / total) * 100).toFixed(0)}%`).join(' · '));
  console.log('moldes mais frequentes:');
  for (const [m, n] of [...moldes].sort((a, b) => b[1] - a[1]).slice(0, 5)) console.log(`  (${n}) ${m.slice(0, 120)}`);
}
void principal();
