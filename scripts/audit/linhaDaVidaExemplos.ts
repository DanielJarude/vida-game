/**
 * F5 — TESTE QUALITATIVO. Imprime Linhas da Vida inteiras para LEITURA.
 * Métrica não detecta tom de relatório, repetição nem frase sem contexto.
 */
import { simularVida, PERFIS } from './simulador';

const RECORTES: { titulo: string; seed: number; de: number; ate: number }[] = [
  { titulo: 'INFÂNCIA 0-5', seed: 3, de: 0, ate: 5 },
  { titulo: 'INFÂNCIA 0-10', seed: 11, de: 0, ate: 10 },
  { titulo: 'ATÉ A MAIORIDADE 0-18', seed: 27, de: 0, ate: 18 },
  { titulo: 'JOVEM ADULTO 18-30', seed: 42, de: 18, ate: 30 },
  { titulo: 'ADULTO 30-45', seed: 58, de: 30, ate: 45 }
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
