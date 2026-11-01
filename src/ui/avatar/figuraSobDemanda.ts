/**
 * 12.4.1 — a figura de corpo inteiro, sob demanda: ela (com o catálogo de peças) só é baixada quando a Aparência ou uma
 * loja de roupas abre — o pacote do jogo não cresce por causa dela.
 */
import { sobDemanda } from '../util/sobDemanda';

export const FiguraSobDemanda = sobDemanda(() => import('./Figura').then(m => m.Figura));
