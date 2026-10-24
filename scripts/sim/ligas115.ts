/**
 * REWORK 11.5 · Fase D — o equilíbrio das ligas (só o mundo, sem o clube da vida): 60 temporadas × 8 vidas por país.
 *
 *   grande: colocação média na elite, títulos, % de temporadas na Z4 (rebaixado), % de temporadas fora da elite
 *   o clube que mais ganhou: a fatia dos títulos (ninguém deveria dominar por nome)
 *   tradicional: % de temporadas na elite
 *   campeões distintos por década
 *
 *   npx esbuild scripts/sim/ligas115.ts --bundle --platform=node --outfile=<scratch>/l115.cjs && node <scratch>/l115.cjs
 */
import { adulto } from '../../src/motor/__tests__/cenarios';
import { clubesDoPais } from '../../src/motor/dados/clubes';
import { ligaDe } from '../../src/motor/sistemas/ligas';
import { carregarRegiao } from '../../src/motor/mundo/carregar';
import { transacao } from '../../src/motor/nucleo';

await carregarRegiao('europa');
const ANOS = Number(process.env.ANOS ?? 60);
for (const pais of (process.env.PAISES ?? 'BR,ES,IT,GB').split(',')) {
  const portes = new Map(clubesDoPais(pais).map(c => [c.nome, c.porte]));
  const g = { temporadas: 0, z4: 0, fora: 0, somaPos: 0, naElite: 0 };
  const t = { temporadas: 0, elite: 0 };
  const titulos = new Map<string, number>();
  let decadas = 0, distintos = 0, titulosTotal = 0;
  for (let s = 0; s < 8; s++) {
    let v = adulto(20, { semente: 300 + s });
    ligaDe(v, pais);
    let daDecada = new Set<string>();
    for (let k = 0; k < ANOS; k++) {
      v = transacao(v, x => { x.t += 12; }).vida;
      const liga = ligaDe(v, pais);
      const u = liga.ultima!;
      const antes = new Map<string, number>();
      for (const [c, d] of Object.entries(liga.div)) antes.set(c, d);
      const campeao = u.campeoes[4];
      if (campeao) { titulos.set(campeao, (titulos.get(campeao) ?? 0) + 1); titulosTotal++; daDecada.add(campeao); }
      if (k % 10 === 9) { decadas++; distintos += daDecada.size; daDecada = new Set(); }
      for (const [c, porte] of portes) {
        const d = liga.div[c];
        if (porte === 'grande') {
          g.temporadas++;
          const caiu = u.cairam.includes(c) && !u.subiram.includes(c);
          if (caiu && (d ?? 0) === 3) g.z4++;
          if ((d ?? 0) < 4) g.fora++;
        }
        if (porte === 'tradicional') { t.temporadas++; if (d === 4) t.elite++; }
      }
    }
  }
  const top = [...titulos].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([c, n]) => `${c} ${Math.round((n / Math.max(1, titulosTotal)) * 100)}%`);
  console.log(`${pais}: grande — rebaixado ${(g.z4 / Math.max(1, g.temporadas) * 100).toFixed(1)}% das temporadas, fora da elite ${(g.fora / Math.max(1, g.temporadas) * 100).toFixed(1)}%; tradicional na elite ${(t.elite / Math.max(1, t.temporadas) * 100).toFixed(1)}%; campeões distintos por década ${(distintos / Math.max(1, decadas)).toFixed(1)}; mais títulos: ${top.join(', ')}`);
}
