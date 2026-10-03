// Uma vida num país: nasce, vive, despeja as abas em pontos de idade.
//   PAIS=Japão REGIAO= DIV= CID= W=390 MARCOS=6,18,30 SP=... node scripts/playtest/mundo/vida.mjs
import { chromium, abrir, logger, nascer, avancar, dumpAbas, idade, foto, checar, aba } from './lib.mjs';
const PAIS = process.env.PAIS ?? 'Japão'; const W = Number(process.env.W ?? 390);
const rot = (process.env.ROT ?? PAIS).normalize('NFD').replace(/[^\w]/g, '');
const log = logger(`${rot}-${W}`);
const b = await chromium.launch();
const p = await abrir(b, W, rot, log);
const r = await nascer(p, { pais: PAIS, regiao: process.env.REGIAO, divisao: process.env.DIV, cidade: process.env.CID, genero: process.env.GEN, classe: process.env.CLASSE }, log);
const marcos = (process.env.MARCOS ?? '6,18,30').split(',').map(Number);
const brasil = PAIS === 'Brasil';
for (const m of marcos) {
  const ok = await avancar(p, m - Math.max(0, await idade(p)), log);
  if (!ok) { log('FIM ou preso antes de ' + m); await foto(p, 'fim'); await checar(p, 'fim', log, { brasil }); break; }
  log(`=== MARCO ${m} (idade ${await idade(p)})`);
  await dumpAbas(p, 'a' + m, log, brasil);
}
log('ERROS: ' + p._erros.join(' || '));
await b.close();
console.log('feito', rot, W);
