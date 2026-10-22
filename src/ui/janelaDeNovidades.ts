/** REWORK 10.6 · UX-24: a janela das notas vem sob demanda (a primeira tela continua leve); App e Menu usam esta. */
import { sobDemanda } from './util/sobDemanda';

export const Novidades = sobDemanda(() => import('./Novidades').then(m => m.JanelaDeNovidades));
