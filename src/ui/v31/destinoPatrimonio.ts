// VIDA 31: um pedido de abrir Vida · Patrimônio numa parte (o aviso da mesa do clube, no Hoje, abre direto em Empresas).
import type { PartePatrimonio } from '../jogo/Patrimonio';
let pedido: PartePatrimonio | undefined;
export const pedirPartePatrimonio = (p: PartePatrimonio) => { pedido = p; };
export const consumirPartePatrimonio = (): PartePatrimonio | undefined => { const p = pedido; pedido = undefined; return p; };
// VIDA 32: e a aba de Empresas (a mesa do clube abre direto em Esporte).
let aba: 'minhas' | 'esporte' | 'abrir' | undefined;
export const pedirAbaEmpresas = (a: 'minhas' | 'esporte' | 'abrir') => { aba = a; };
export const consumirAbaEmpresas = () => { const a = aba; aba = undefined; return a; };
