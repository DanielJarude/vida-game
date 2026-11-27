/**
 * VIDA 38 · ponto de extensão para os sistemas do dia a dia. Os módulos novos (ajuda, cotidiano, dependências) se
 * registram aqui e são carregados junto com o motor pela interface (ui/motor), num pacote próprio. Assim o pacote-base
 * do motor não cresce com eles. Uma ação de um sistema não registrado não pode acontecer: aparece como "ainda não".
 */
import type { Vida } from '../tipos';
import { bloqueio, type Veredito } from '../plausibilidade';

type Disp = (v: Vida, op: any) => Veredito;
type Fazer = (v: Vida, op: any) => string;
const REG = new Map<string, { disp: Disp; fazer: Fazer }>();

export function registrarExtra38(ops: string[], disp: Disp, fazer: Fazer): void {
  for (const o of ops) REG.set(o, { disp, fazer });
}
export function dispExtra38(v: Vida, op: { o: string }): Veredito {
  const r = REG.get(op.o);
  return r ? r.disp(v, op) : bloqueio('impossivel', 'Isso ainda não está disponível.');
}
export function fazerExtra38(v: Vida, op: { o: string }): string {
  const r = REG.get(op.o);
  return r ? r.fazer(v, op) : 'Isso ainda não está disponível.';
}
