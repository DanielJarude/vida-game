/**
 * REWORK 7.5 — auditoria de repetição narrativa das interações sociais. Vidas de verdade (o motor), em idades, países
 * e relações diferentes; com cada pessoa próxima, dez anos seguidos de conversar, passar um tempo, demonstrar carinho e
 * agradecer (quando a ação existe). Mede, por ação:
 *   - textos distintos / total (variedade);
 *   - repetições SEGUIDAS com a mesma pessoa (a mesma frase duas vezes em seguida);
 *   - a frase mais repetida (quanto do total ela é);
 *   - agradecimentos sem ajuda registrada que afirmem ajuda (devem ser zero).
 * Roda igual na base (antes) e no novo, para comparar:
 *   npx esbuild scripts/sim/repeticao75.ts --bundle --platform=node --outfile=<scratch>/rep.cjs && node <scratch>/rep.cjs
 */
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { executar } from '../../src/motor/acoes';
import { avancarAno } from '../../src/motor/ano';
import { viverAte, nova, responderTudo } from '../../src/motor/__tests__/ajuda';
import { interacoesPara, rotuloInteracao } from '../../src/motor/sistemas/interacoes';
import { capitalDoPais } from '../../src/motor/dados/lugares';
import type { Vida } from '../../src/motor/tipos';

const ACOES = ['conversar', 'tempo', 'carinho', 'agradecer', 'elogiar'];

async function principal() {
  await carregarMundo();
  const lugares = ['recife-pe', capitalDoPais('JP')!.id, capitalDoPais('PT')!.id, capitalDoPais('US')!.id];
  const por: Record<string, { textos: string[]; seguidas: number; pares: number }> = {};
  for (const a of ACOES) por[a] = { textos: [], seguidas: 0, pares: 0 };
  let falsos = 0;
  let vidas = 0;
  for (const [k, municipioId] of lugares.entries()) for (const inicio of [10, 17, 30, 55]) {
    let v: Vida = viverAte(nova({ semente: 900 + k * 10 + inicio, municipioId }), inicio);
    vidas++;
    const ultimos = new Map<string, string>();
    for (let ano = 0; ano < 10; ano++) {
      const ids = Object.values(v.vinculos).filter(x => v.pessoas[x.pessoaId]?.vivo && !v.pessoas[x.pessoaId].especie && x.proximidade >= 40).sort((a, b) => b.proximidade - a.proximidade).slice(0, 4).map(x => x.pessoaId);
      for (const id of ids) for (const a of ACOES) {
        const def = interacoesPara(v, id).find(x => x.id === a);
        if (!def) continue;
        const r = executar(v, { tipo: 'pessoa', pessoaId: id, interacao: a });
        const t = r.resultado ?? r.aviso?.texto;
        if (!t || r.vida === v) continue;
        // A mesma frase com nome trocado conta como a mesma: tira o nome da pessoa.
        const forma = t.replaceAll(v.pessoas[id].nome, '·');
        por[a].textos.push(forma);
        const chave = `${a}:${id}`;
        if (ultimos.has(chave)) { por[a].pares++; if (ultimos.get(chave) === forma) por[a].seguidas++; }
        ultimos.set(chave, forma);
        // Agradecer "por algo que nunca agradeceu" (o rótulo antigo) — a ajuda inventada.
        if (/nunca agradeceu/.test(rotuloInteracao(v, id, a) ?? '')) falsos++;
        v = r.vida;
      }
      v = responderTudo(avancarAno(v).vida);
    }
  }
  const linhas = ACOES.map(a => {
    const x = por[a];
    const conta = new Map<string, number>();
    for (const t of x.textos) conta.set(t, (conta.get(t) ?? 0) + 1);
    const maior = Math.max(0, ...conta.values());
    return { acao: a, total: x.textos.length, distintos: conta.size, variedade: x.textos.length ? +(conta.size / x.textos.length).toFixed(2) : 0, seguidasIguais: x.seguidas, pares: x.pares, maisRepetida: x.textos.length ? +(maior / x.textos.length).toFixed(2) : 0 };
  });
  console.log(JSON.stringify({ vidas, linhas, agradecimentosSemEvidencia: falsos }, null, 1));
}

principal();
