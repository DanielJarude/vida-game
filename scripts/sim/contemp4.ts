// ERAS v4 — a vida contemporânea não muda: N vidas (mesmas sementes) jogadas pelas estratégias; a biografia inteira vai
// para um arquivo, para comparar byte a byte com a base. Só APIs que já existiam antes da v4.
// Uso: npx esbuild scripts/sim/contemp4.ts --bundle --platform=node --format=esm --outfile=X.mjs && SAIDA=a.txt node X.mjs
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar } from '../../src/motor/acoes';
import { criarRng } from '../../src/motor/rng';
import type { Vida } from '../../src/motor/tipos';
import { idade } from '../../src/motor/nucleo';
import { podeTentar } from '../../src/motor/plausibilidade';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { cidadesDoPais } from '../../src/motor/dados/lugares';
import { estrategia } from './estrategias';
import { writeFileSync } from 'node:fs';

await carregarMundo();
const PERFIS = ['familiar', 'ambicioso', 'estudioso', 'impulsivo', 'social', 'economico', 'gastador', 'ascensao'];
const linhas: string[] = [];
for (let s = 1; s <= Number(process.env.VIDAS ?? 8); s++) {
  const r = criarRng(s * 97);
  const e = estrategia(PERFIS[s % PERFIS.length]);
  const cid = cidadesDoPais(['BR', 'US', 'DE', 'JP', 'GB', 'AR'][s % 6])[s % 4];
  let v: Vida = criarVida({ nome: 'Lia', sobrenome: 'Teste', genero: s % 2 ? 'feminino' : 'masculino', municipioId: cid.id, semente: 33000 + s * 11 } as never);
  const responder = () => { for (let k = 0; k < 12 && v.momento && !v.morte; k++) v = executar(v, { tipo: 'decidir', opcaoId: e.decidir(v, v.momento!, r) }).vida; };
  while (!v.morte && idade(v) < Number(process.env.ATE ?? 50)) {
    for (const a of e.agir(v, r)) { if (!podeTentar(disponibilidade(v, a))) continue; v = executar(v, a).vida; responder(); }
    v = avancarAno(v).vida; responder();
  }
  for (const b of v.biografia) linhas.push(`${s}|${b.t}|${b.texto}`);
  linhas.push(`${s}|fim|conta=${Math.round(v.financas.conta)}|emp=${v.trabalho.atual?.ocupacaoId ?? '-'}|sal=${v.trabalho.atual?.salario ?? 0}|pol=${v.caminhos.politica?.partido ?? '-'}`);
}
writeFileSync(process.env.SAIDA ?? 'contemp4.txt', linhas.join('\n'));
console.log(`linhas: ${linhas.length}`);
