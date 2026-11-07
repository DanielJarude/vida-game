/** VIDA 12.9 — tempo por vida (do nascimento aos 70), para comparar com a base. */
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { nova, viverAte } from '../../src/motor/__tests__/ajuda';
await carregarMundo();
const t0 = performance.now();
let anos = 0;
for (let s = 1; s <= Number(process.env.N ?? 6); s++) { const v = viverAte(nova({ semente: s, genero: s % 2 ? 'feminino' : 'masculino', municipioId: 'sao-paulo-sp' } as never), 70); anos += Math.floor((v.t - v.eu.tNasc) / 12); }
const ms = performance.now() - t0;
console.log(`${anos} anos em ${Math.round(ms)} ms: ${(ms / anos).toFixed(1)} ms/ano`);
