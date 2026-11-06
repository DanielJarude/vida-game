import { carregarMundo } from '../../r129/src/motor/mundo/carregar';
import { adulto } from '../../r129/src/motor/__tests__/cenarios';
import { transacao } from '../../r129/src/motor/nucleo';
import { processarEmpresas, empresasAtivas } from '../../r129/src/motor/sistemas/empresas';
import { fundarEmpresa } from '../../r129/src/motor/sistemas/empresas129';
import type { Vida, Imovel } from '../../r129/src/motor/tipos';
export { carregarMundo, adulto, transacao, processarEmpresas, empresasAtivas, fundarEmpresa };
export type { Vida, Imovel };
export function pessoa(base: Vida, conta: number): Vida {
  const v = structuredClone(base);
  v.financas.conta = conta; v.financas.dividas = []; v.financas.negativado = false; v.financas.bens = []; v.financas.colecao = []; v.financas.empresas = []; v.financas.investimentos = [];
  v.anoAtual = { acoes: [] };
  return v;
}
export const anos = (v: Vida, n: number) => { for (let k = 0; k < n; k++) { v.t += 12; v.anoAtual = { acoes: [] }; v = transacao(v, (x, r) => processarEmpresas(x, r)).vida; } return v; };
