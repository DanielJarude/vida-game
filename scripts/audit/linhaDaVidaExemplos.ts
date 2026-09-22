/**
 * F5 — TESTE QUALITATIVO. Imprime Linhas da Vida inteiras para LEITURA.
 * Métrica não detecta tom de relatório, repetição nem frase sem contexto.
 */
import { simularVida, PERFIS } from './simulador';

const RECORTES: { titulo: string; seed: number; de: number; ate: number }[] = [
  // F5-FIX seção 20 — 10 timelines 0-10 e 10 timelines 0-18, para LEITURA.
  ...[3, 6, 11, 17, 27, 38, 39, 42, 58, 73].map(seed => ({
    titulo: `0-10 (seed ${seed})`, seed, de: 0, ate: 10
  })),
  ...[5, 9, 14, 21, 33, 44, 51, 66, 80, 97].map(seed => ({
    titulo: `0-18 (seed ${seed})`, seed, de: 0, ate: 18
  }))
];

for (const r of RECORTES) {
  const vida = simularVida(r.seed, PERFIS[r.seed % PERFIS.length]);
  console.log('\n' + '='.repeat(78));
  console.log(`${r.titulo}  (seed ${r.seed}, perfil ${PERFIS[r.seed % PERFIS.length]})`);
  console.log('='.repeat(78));
  for (const ano of vida.anos) {
    if (ano.idade < r.de || ano.idade > r.ate) continue;
    if (ano.logs.length === 0) { console.log(`${String(ano.idade).padStart(3)} ·  (silêncio)`); continue; }
    ano.logs.forEach((l, i) => {
      const marca = (l.relevancia ?? 'normal') === 'marco' ? '★' : (l.relevancia === 'textura' ? '·' : '–');
      console.log(`${i === 0 ? String(ano.idade).padStart(3) : '   '} ${marca} ${l.texto}`);
    });
  }
}
