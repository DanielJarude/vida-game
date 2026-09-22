/**
 * F5 — despeja os acontecimentos AUTOMÁTICOS com situação e resultado lado a
 * lado, para leitura semântica. Não classifica nada: a classificação A–F é
 * humana e vive no relatório.
 */
import { MASTER_EVENTS_LIST } from '../../src/data/events/allEvents';
import type { GameEvent } from '../../src/types';
import { classificacaoDoEvento } from '../../src/systems/events/taxonomia';

const eventos = MASTER_EVENTS_LIST as GameEvent[];
const automaticos = eventos.filter(e => {
  const t = classificacaoDoEvento(e);
  return t.startsWith('acontecimento') || t === 'marco_testemunhado' || t === 'pequena_memoria';
});

console.log(`AUTOMÁTICOS: ${automaticos.length}\n`);
for (const e of automaticos) {
  console.log('='.repeat(78));
  console.log(`${e.id}  «${e.titulo}»  [${classificacaoDoEvento(e)}] ${e.idadeMinima}-${e.idadeMaxima}`);
  console.log(`SIT: ${e.descricao}`);
  for (const o of e.opcoes) {
    console.log(`RES: ${o.descricaoResultado ?? '(sem descricaoResultado)'}`);
  }
}
