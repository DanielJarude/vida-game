import { MASTER_EVENTS_LIST } from '../../src/data/events/allEvents';
const alvo = process.env.NAT ?? 'acontecimento';
for (const e of MASTER_EVENTS_LIST) {
  if ((e.natureza ?? 'decisao') !== alvo) continue;
  console.log(`\n### ${e.id} [${e.idadeMinima}-${e.idadeMaxima}] ${e.categoria} — ${e.titulo}`);
  console.log(`    desc: ${e.descricao}`);
  for (const o of e.opcoes) {
    console.log(`    OPT ${o.id}`);
    console.log(`      texto: ${o.texto}`);
    console.log(`      resul: ${o.descricaoResultado ?? '—'}`);
  }
}
