// VIDA 28 — reproduz incoerências da História em vidas de atleta: dispensa seguida de promoção/contrato, formaturas duplicadas.
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { criarRng } from '../../src/motor/rng';
import type { Vida } from '../../src/motor/tipos';
import { idade } from '../../src/motor/nucleo';
import { podeTentar } from '../../src/motor/plausibilidade';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { entrarNaVida } from '../../src/motor/mundo/vida';
import { estrategia } from './estrategias';
import { writeFileSync } from 'node:fs';

await carregarMundo();
const N = Number(process.env.VIDAS ?? 60);
const ATE = Number(process.env.ATE ?? 24);
const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const out: string[] = [];
let ruins = 0, dup = 0, comDispensa = 0;
for (let s = 1; s <= N; s++) {
  const r = criarRng(s * 7919);
  let v = criarVida({ nome: 'Teo', sobrenome: 'Teste', genero: s % 3 ? 'masculino' : 'feminino', semente: 28000 + s * 13, municipioId: 'marilia-sp', ano: 2026 } as never);
  entrarNaVida(v);
  const e = estrategia('esportista');
  const responder = () => { for (let k = 0; k < 12 && v.momento && !v.morte; k++) v = executar(v, { tipo: 'decidir', opcaoId: e.decidir(v, v.momento!, r) }).vida; };
  while (!v.morte && idade(v) < ATE) {
    for (const a of e.agir(v, r)) { if (!tenta(v, a)) continue; v = executar(v, a).vida; responder(); }
    v = avancarAno(v).vida; responder(); entrarNaVida(v);
  }
  const bio = v.biografia.filter(b => b.relevancia !== 'tecnico');
  const iDisp = bio.findIndex(b => /Dispensad[oa] d[ae] (base|equipe)|O sonho de viver/.test(b.texto));
  if (iDisp >= 0) {
    comDispensa++;
    const depois = bio.slice(iDisp + 1).filter(b => /sub-1|sub-2|base|clube|elenco|titular|contrato|Promovid|equipe principal|profissional/i.test(b.texto) && b.tema !== 'escola');
    if (depois.length) { ruins++; out.push(`#${s} DISPENSA aos ${bio[iDisp].idade}: ${bio[iDisp].texto}`); for (const d of depois.slice(0, 6)) out.push(`   ${d.idade} [${d.relevancia}/${d.tema}] ${d.texto}`); }
  }
  const forms = bio.filter(b => /(conclu|termin|formou|diploma)/i.test(b.texto) && /ensino médio|técnic/i.test(b.texto));
  const anos = new Map<number, string[]>();
  for (const f of forms) anos.set(f.idade, [...(anos.get(f.idade) ?? []), f.texto]);
  for (const [i, ts] of anos) if (ts.length > 1) { dup++; out.push(`#${s} DUPLA aos ${i}: ${ts.join(' || ')}`); }
}
out.unshift(`vidas ${N}; com dispensa ${comDispensa}; dispensa seguida de vínculo ${ruins}; formaturas duplas ${dup}`);
writeFileSync(process.env.OUT ?? 'hist.txt', out.join('\n'));
console.log(out.slice(0, 80).join('\n'));
