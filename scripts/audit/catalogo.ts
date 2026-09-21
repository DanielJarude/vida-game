import { MASTER_EVENTS_LIST } from '../../src/data/events/allEvents';
for (const e of MASTER_EVENTS_LIST) {
  const comp = e.opcoes.some(o=>o.consequencias.impactosComportamentais);
  console.log([e.id.padEnd(30), (e.natureza??'DECISAO*').padEnd(14), `${e.idadeMinima}-${e.idadeMaxima}`.padEnd(7), e.categoria.padEnd(12), comp?'COMP':'    ', `${e.opcoes.length}op`, e.titulo].join(' '));
}
