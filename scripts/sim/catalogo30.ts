// VIDA 30 · §4.1 — o catálogo de acontecimentos por fase da vida (quantos cabem em cada idade, por tipo e tema).
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { CATALOGO } from '../../src/motor/conteudo/catalogo';
await carregarMundo();
const FAIXAS: [string, number, number][] = [['0-5', 0, 5], ['6-11', 6, 11], ['12-17', 12, 17], ['18-29', 18, 29], ['30-59', 30, 59], ['60+', 60, 120]];
for (const [nome, a, b] of FAIXAS) {
  const cabe = CATALOGO.filter(c => c.idade[0] <= b && c.idade[1] >= a);
  const temas: Record<string, number> = {};
  for (const c of cabe) temas[c.tema ?? '-'] = (temas[c.tema ?? '-'] ?? 0) + 1;
  const especificos = cabe.filter(c => c.idade[1] - c.idade[0] <= 25);
  console.log(`${nome.padEnd(6)} total ${String(cabe.length).padStart(4)} · decisões ${String(cabe.filter(c => c.tipo === 'decisao').length).padStart(4)} · da fase (faixa ≤25 anos) ${String(especificos.length).padStart(4)} · temas ${Object.entries(temas).sort((x, y) => y[1] - x[1]).slice(0, 8).map(([t, n]) => `${t}:${n}`).join(' ')}`);
}
console.log('total', CATALOGO.length);
