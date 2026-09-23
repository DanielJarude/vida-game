/**
 * Gera um save REAL (v6) com o motor do jogo e o imprime como JSON.
 * O smoke test do pacote itch.io usa isto para provar que "recarregar a
 * página e continuar" funciona com um save que o jogo de fato produz.
 *
 * Uso: npx esbuild scripts/itch/gerarSaveReal.ts --bundle --platform=node | node
 */

import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { executar } from '../../src/motor/acoes';

let v = criarVida({ nome: 'Joana', sobrenome: 'Ribeiro', genero: 'feminino', municipioId: 'salvador-ba', semente: 2026 });
for (let i = 0; i < 12; i++) {
  v = avancarAno(v).vida;
  if (v.momento) v = executar(v, { tipo: 'decidir', opcaoId: v.momento.opcoes.find(o => !o.bloqueio)!.id }).vida;
}
process.stdout.write(JSON.stringify(v));
