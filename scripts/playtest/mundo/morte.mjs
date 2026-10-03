// Vive uma vida estrangeira até o fim e fotografa o fim, o legado e (se houver) a sucessão.
import { chromium, abrir, logger, nascer, avancar, dumpAbas, idade, foto, checar, aba, texto, resolver } from './lib.mjs';
import { writeFileSync } from 'node:fs';
const PAIS = process.env.PAIS ?? 'Portugal'; const W = Number(process.env.W ?? 390);
const rot = ('morte-' + PAIS).normalize('NFD').replace(/[^\w-]/g, '');
const log = logger(`${rot}-${W}`);
const b = await chromium.launch();
const p = await abrir(b, W, rot, log);
await nascer(p, { pais: PAIS, regiao: process.env.REGIAO, classe: process.env.CLASSE ?? 'Média' }, log);
await avancar(p, 20, log);
await aba(p, 'Trabalho');
const c = p.getByRole('button', { name: /Candidatar-se/ });
if (await c.count()) { await c.first().click(); await p.waitForTimeout(300); await resolver(p, log, 0); }
await aba(p, 'Linha da Vida');
for (const m of [40, 60]) { await avancar(p, m - await idade(p), log); await dumpAbas(p, 'a' + m, log, false); }
let n = 0;
while (await p.locator('.avancar__botao').count() && n++ < 90) await avancar(p, 1, log);
await p.waitForTimeout(800);
const t = await checar(p, 'fim', log, { brasil: false });
writeFileSync(`${process.env.SP}/${rot}-${W}-fim.txt`, t);
await foto(p, 'fim');
const dec = p.getByText('Decidir o destino do patrimônio');
if (await dec.count()) { await dec.click(); await p.waitForTimeout(300); await foto(p, 'fim-decidir'); writeFileSync(`${process.env.SP}/${rot}-${W}-fim-decidir.txt`, await texto(p)); }
// continuar como herdeiro, se houver
const cont = p.locator('.fim__decisao button').first();
if (await cont.count()) {
  log('DECISAO botoes: ' + (await p.locator('.fim__decisao button').allTextContents()).join(' | '));
  await cont.click(); await p.waitForTimeout(800);
  await resolver(p, log);
  const t2 = await checar(p, 'herdeiro', log, { brasil: false });
  writeFileSync(`${process.env.SP}/${rot}-${W}-herdeiro.txt`, t2);
  await foto(p, 'herdeiro');
  if (await p.locator('.avancar__botao').count()) await dumpAbas(p, 'herdeiro', log, false);
}
log('ERROS: ' + p._erros.join(' || '));
await b.close(); console.log('feito', rot);
