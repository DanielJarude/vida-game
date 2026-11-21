// VIDA 31: um pedido de abrir Vida · Patrimônio numa parte (o aviso da mesa do clube, no Hoje, abre direto em Empresas).
import type { PartePatrimonio } from '../jogo/Patrimonio';
let pedido: PartePatrimonio | undefined;
export const pedirPartePatrimonio = (p: PartePatrimonio) => { pedido = p; };
export const consumirPartePatrimonio = (): PartePatrimonio | undefined => { const p = pedido; pedido = undefined; return p; };
