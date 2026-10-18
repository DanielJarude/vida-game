/**
 * REWORK 9 · FUT-01 — a liga ao longo de 50 temporadas (Brasil e Espanha): as vagas por divisão, o campeão que sobe,
 * quantos tradicionais chegam à elite, quantos grandes caem, quem pula divisão (ninguém deveria).
 *
 *   npx esbuild scripts/sim/ligas9.ts --bundle --platform=node --outfile=<scratch>/l9.cjs && node <scratch>/l9.cjs
 */
import { adulto } from '../../src/motor/__tests__/cenarios';
import { clubesDoPais } from '../../src/motor/dados/clubes';
import { fecharTemporadaDaLiga, ligaDe, VAGAS_POR_DIVISAO } from '../../src/motor/sistemas/ligas';
import { carregarRegiao } from '../../src/motor/mundo/carregar';

await carregarRegiao('europa');
for (const pais of ['BR', 'ES']) {
  const v = adulto(20, { semente: 5 });
  const liga = ligaDe(v, pais);
  const portes = new Map(clubesDoPais(pais).map(c => [c.nome, c.porte]));
  const nomes = Object.keys(liga.div);
  const fixo = nomes[0];
  let campeoesSobem = 0, campeoes = 0, saltos = 0, estouros = 0;
  const elite = new Set<string>(), grandesQueCairam = new Set<string>();
  let antes = { ...liga.div };
  for (let k = 0; k < 50; k++) {
    fecharTemporadaDaLiga(v, pais, liga.ano + 1, fixo, liga.div[fixo], 1 + ((k * 7) % 20));
    const u = liga.ultima!;
    for (const n of [2, 3] as const) if (u.campeoes[n]) { campeoes++; if (u.subiram.includes(u.campeoes[n]!)) campeoesSobem++; }
    for (const n of [2, 3, 4]) if (Object.values(liga.div).filter(d => d === n).length > VAGAS_POR_DIVISAO) estouros++;
    for (const c of Object.keys(liga.div)) {
      if (Math.abs(liga.div[c] - (antes[c] ?? liga.div[c])) > 1) saltos++;
      if (portes.get(c) === 'tradicional' && liga.div[c] === 4) elite.add(c);
      if (portes.get(c) === 'grande' && liga.div[c] <= 3) grandesQueCairam.add(c);
    }
    antes = { ...liga.div };
  }
  const porNivel = [1, 2, 3, 4].map(n => Object.values(liga.div).filter(d => d === n).length);
  console.log(`${pais}: ${nomes.length} clubes no catálogo · por divisão (1..4) no fim: ${porNivel.join('/')} · campeões que subiram ${campeoesSobem}/${campeoes} · tradicionais que jogaram a elite: ${elite.size} · grandes que caíram: ${grandesQueCairam.size} · saltos de duas divisões: ${saltos} · vagas estouradas: ${estouros}`);
}
