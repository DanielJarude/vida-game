/** VIDA 12.9.1 — o Colégio na prática: com que frequência o voto popular e o Colégio divergem, e quantas vão à Câmara. */
import { apurarColegio } from '../../src/motor/sistemas/colegioEleitoral129';
import { criarRng } from '../../src/motor/rng';
const N = 4000;
let div = 0, divEsq = 0, camara = 0, mapas: number[] = [];
for (let s = 0; s < N; s++) {
  const r0 = criarRng(s);
  const margemNacional = r0.normal() * 4; // D − R nacional
  const r = apurarColegio([{ nacional: 48 + margemNacional / 2, lado: 1 }, { nacional: 48 - margemNacional / 2, lado: -1 }, { nacional: 4, lado: 0 }], r0);
  const pop = r.popular.indexOf(Math.max(...r.popular));
  if (r.contingencia) camara++;
  if (pop !== r.eleito) { div++; if (pop === 0) divEsq++; }
  mapas.push(r.delegados[0]);
}
mapas.sort((a, b) => a - b);
console.log(`N=${N} · divergência voto popular × Colégio: ${(100 * div / N).toFixed(1)}% (esquerda ganha no país e perde: ${(100 * divEsq / N).toFixed(1)}%) · vai à Câmara: ${(100 * camara / N).toFixed(2)}% · delegados da esquerda p10/p50/p90: ${mapas[N / 10]}/${mapas[N / 2]}/${mapas[9 * N / 10]}`);
