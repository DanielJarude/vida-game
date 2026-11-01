/** VIDA 12.5 · auditoria de sistemas — linhas de extrato com o mesmo valor e rótulos diferentes (pagamento dobrado?). */
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { executar } from '../../src/motor/acoes';
import { idade } from '../../src/motor/nucleo';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import type { Vida, Classe } from '../../src/motor/tipos';
await carregarMundo();
const CLS: Classe[] = ['vulneravel', 'trabalhadora', 'media_baixa', 'media', 'alta'];
const pares: Record<string, number> = {}; const ex: Record<string, string> = {};
for (let k = 0; k < Number(process.env.N ?? 6); k++) {
  let v: Vida = criarVida({ nome: 'Sim', sobrenome: 'Ext', genero: k % 2 ? 'masculino' : 'feminino', municipioId: 'sao-paulo-sp', semente: 125700 + k, classe: CLS[k % 5] });
  while (!v.morte && idade(v) < 75) {
    v = avancarAno(v).vida;
    for (let j = 0; j < 12 && v.momento; j++) { const ops = v.momento!.opcoes.filter(o => !o.bloqueio); v = executar(v, { tipo: 'decidir', opcaoId: ops[0].id }).vida; }
    const ls = v.financas.extrato?.linhas ?? [];
    for (let a = 0; a < ls.length; a++) for (let b = a + 1; b < ls.length; b++) {
      if (Math.abs(ls[a].conta) < 50 || Math.round(ls[a].conta) !== Math.round(ls[b].conta) || ls[a].rotulo === ls[b].rotulo) continue;
      const kk = [ls[a].rotulo, ls[b].rotulo].sort().join(' || ');
      pares[kk] = (pares[kk] ?? 0) + 1; ex[kk] ??= `s=${125700 + k} ${idade(v)}a ${Math.round(ls[a].conta)} (${ls[a].tipo}/${ls[b].tipo})`;
    }
  }
}
for (const [k, n] of Object.entries(pares).sort((a, b) => b[1] - a[1])) console.log(`${n}× ${k} — ${ex[k]}`);
