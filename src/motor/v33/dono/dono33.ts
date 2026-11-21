/**
 * VIDA 33 · O QUE TODO DONO DE TIME FAZ — a identidade (escudo, cores, apelido, casa), o departamento comercial
 * (patrocínios) e a loja (a camisa e os produtos), com as mesmas ações para o clube de futebol, os times de quadra e a
 * organização de e-sports. Cada módulo de time guarda os três campos e chama daqui (nada de sistema paralelo).
 */
import type { Rng } from '../../rng';
import { normalizarIdentidade33, type Identidade33 } from './identidade33';
import { contratoDaCota33, executarComercial33, fecharAnoComercial33, novoComercial33, problemaComercial33, type Comercial33, type Contexto33, type OpComercial33, type Resultado33 } from './patrocinio33';
import { executarLoja33, fecharAnoLoja33, novaLoja33, problemaLoja33, type Loja33, type OpLoja33 } from './loja33';

export interface Dono33 { identidade33?: Identidade33; comercial33?: Comercial33; loja33?: Loja33; /** `v.t` da fundação/compra (a identidade é livre no primeiro ano). */ desde?: number }
export type OpDono33 = { op: 'comercial'; sub: OpComercial33 } | { op: 'loja'; sub: OpLoja33 } | { op: 'identidade'; identidade: Identidade33 };

/** Mudar o escudo e as cores depois do primeiro ano: agência, registro, uniformes novos — e a torcida estranha. */
export const custoDoRebranding33 = (ctx: Contexto33) => Math.round(Math.max(30000, ctx.receitaBase * 0.02) / 1e4) * 1e4;
const livre = (ctx: Contexto33, d: Dono33, d0: number | undefined) => d0 === undefined || !d.identidade33 || ctx.ano <= d0;

export function problemaDono33(ctx: Contexto33, d: Dono33, o: OpDono33, caixa: number, anoDeInicio?: number): string | undefined {
  if (o.op === 'comercial') return problemaComercial33(ctx, d.comercial33, o.sub, caixa);
  if (o.op === 'loja') return problemaLoja33(ctx, d.loja33, o.sub, caixa);
  if (!normalizarIdentidade33(o.identidade)) return 'Identidade inválida.';
  if (livre(ctx, d, anoDeInicio)) return undefined;
  const c = custoDoRebranding33(ctx);
  return caixa >= c ? undefined : `Mudar a identidade custa ${c.toLocaleString('pt-BR')}; o caixa não tem.`;
}

/** Executa: devolve o texto, o que sai do caixa do time e o efeito na torcida (o rebranding custa um pouco dela). */
export function executarDono33(ctx: Contexto33, d: Dono33, o: OpDono33, r: Rng, anoDeInicio?: number): { texto: string; custo: number; tom: 'bom' | 'ruim' | 'neutro'; fama?: number } {
  if (o.op === 'comercial') return executarComercial33(ctx, d.comercial33 ??= novoComercial33(), o.sub, r);
  if (o.op === 'loja') { const x = executarLoja33(ctx, d.loja33 ??= novaLoja33(), o.sub); return { ...x, tom: 'neutro' }; }
  const gratis = livre(ctx, d, anoDeInicio);
  d.identidade33 = normalizarIdentidade33(o.identidade);
  return gratis ? { texto: 'Escudo, cores e nome da casa atualizados.', custo: 0, tom: 'bom' }
    : { texto: 'Rebranding feito: escudo e cores novos. Parte da torcida estranhou.', custo: custoDoRebranding33(ctx), tom: 'neutro', fama: -3 };
}

/** A temporada que fechou: patrocínios e loja. `ctxAno` é o do ano que fechou; `ctxNovo`, o do ano que começa. */
export function fecharAnoDono33(ctxAno: Contexto33, ctxNovo: Contexto33, d: Dono33, res: Resultado33, r: Rng): { receita: number; despesa: number; rep: number; textos: string[] } {
  const c = d.comercial33 ??= novoComercial33();
  const fornecedor = !!contratoDaCota33(c, 'material', ctxAno.ano);
  const com = fecharAnoComercial33(ctxNovo, c, ctxAno.ano, res, r);
  const loja = fecharAnoLoja33(ctxAno, d.loja33 ??= novaLoja33(), res, fornecedor, r);
  return { receita: com.receita + com.bonus + loja.receita, despesa: com.despesa + loja.despesa, rep: com.rep, textos: [...com.textos, ...(loja.texto ? [loja.texto] : [])] };
}
