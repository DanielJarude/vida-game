import { MASTER_EVENTS_LIST } from '../../src/data/events/allEvents';
const ac = MASTER_EVENTS_LIST.filter(e => e.natureza === 'acontecimento');
const comTexto = ac.filter(e => e.opcoes.some(o => o.texto.trim() !== ''));
const semTexto = ac.filter(e => e.opcoes.every(o => o.texto.trim() === ''));
console.log(`acontecimentos: ${ac.length}`);
console.log(`  formato DESFECHO (texto vazio, correto): ${semTexto.length}`);
console.log(`  formato BOTÃO (texto de opção preenchido): ${comTexto.length}`);
console.log('\nIds em formato BOTÃO (precisam de reescrita ou reclassificação):');
for (const e of comTexto) console.log(`  ${e.id.padEnd(32)} [${e.idadeMinima}-${e.idadeMaxima}] ${e.titulo}`);
// verbos de deliberação nos DESFECHOS (descricaoResultado)
const delib = /\b(você (decidiu|preferiu|resolveu|escolheu|optou)|preferiu|resolveu não|decidiu não)\b/i;
console.log('\nDESFECHOS de acontecimento com verbo de deliberação:');
for (const e of ac) for (const o of e.opcoes) {
  if (o.descricaoResultado && delib.test(o.descricaoResultado)) console.log(`  ${e.id} / ${o.id}\n     "${o.descricaoResultado}"`);
}
