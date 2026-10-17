/**
 * REWORK 7.5 — o tamanho do save e o tempo do motor, em vidas inteiras: N sementes vividas até os 75 anos (o motor de
 * sempre, respondendo às decisões), e a média do JSON, da biografia, das pessoas e dos milissegundos por ano. Roda igual
 * na base e no novo (as vidas divergem — a árvore da família mudou —, então a comparação é de distribuição, não de save
 * a save). Também separa o que os campos NOVOS ocupam (segue, de, inicial, os fatos de homenagem e agradecimento).
 *   npx esbuild scripts/sim/tamanho75.ts --bundle --platform=node --outfile=<scratch>/tam.cjs && N=20 node <scratch>/tam.cjs
 */
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { avancarAno } from '../../src/motor/ano';
import { nova, responderTudo } from '../../src/motor/__tests__/ajuda';
import type { Vida } from '../../src/motor/tipos';

async function principal() {
  await carregarMundo();
  const N = Number(process.env.N ?? 20);
  const IDADE = Number(process.env.IDADE ?? 75);
  let bytes = 0, bio = 0, pessoas = 0, ms = 0, anos = 0, novos = 0;
  for (let s = 1; s <= N; s++) {
    let v: Vida = nova({ semente: 4000 + s });
    const t0 = performance.now();
    for (let k = 0; k < IDADE && !v.morte; k++) { v = responderTudo(avancarAno(v).vida); anos++; }
    ms += performance.now() - t0;
    const j = JSON.stringify(v);
    bytes += j.length; bio += v.biografia.length; pessoas += Object.keys(v.pessoas).length;
    for (const e of v.biografia) if ((e as { segue?: string }).segue) novos += 30;
    for (const vin of Object.values(v.vinculos)) for (const h of vin.historia) if ((h as { de?: string }).de) novos += 10;
    for (const k of Object.keys(v.fatos)) if (/^(hom:|agr:|agradeceu:)/.test(k)) novos += k.length + 8;
  }
  console.log(JSON.stringify({ vidas: N, ate: IDADE, kBMedio: +(bytes / N / 1024).toFixed(1), entradasMedias: +(bio / N).toFixed(0), pessoasMedias: +(pessoas / N).toFixed(0), msPorAno: +(ms / anos).toFixed(1), bytesDosCamposNovos: Math.round(novos / N) }));
}

principal();
