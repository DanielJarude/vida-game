/**
 * ERAS HISTÓRICAS · leituras de tela (sem estado): a década visual, o nome do aparelho, a moeda do mês.
 * Vida contemporânea: nada (as telas ficam como sempre).
 */
import type { Vida } from '../../motor/tipos';
import { anoDe } from '../../motor/tempo';
import { meioDeComunicacao } from '../../motor/eras/base/contexto';
import { padraoEm } from '../../motor/eras/base/moedas';
import type { MeioDeComunicacao } from '../../motor/eras/base/tecnologias';

/** A década que dá o tom da tela (depois de 2025, a vida histórica fica no tom dos anos 2020). */
export function decadaVisual(v: Vida): number | undefined {
  if (!v.era) return undefined;
  return Math.min(2020, Math.floor(anoDe(v.t) / 10) * 10);
}

export const NOME_DO_APARELHO: Record<MeioDeComunicacao, string> = { fixo: 'Telefone', celular: 'Celular', smartphone: 'Celular' };
export const GUARDAR_O_APARELHO: Record<MeioDeComunicacao, string> = { fixo: 'Pôr o fone no gancho', celular: 'Guardar o celular', smartphone: 'Guardar o celular' };
export const ICONE_DO_APARELHO: Record<MeioDeComunicacao, string> = {
  fixo: 'M5 9c0-3 3-5 7-5s7 2 7 5l-2 2c-1-1-3-2-5-2s-4 1-5 2zM6 13h12l1 7H5z',
  celular: 'M9 1v4M8 5h8a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM9 8h6v4H9zM9 15h1M12 15h1M15 15h0M9 18h1M12 18h1',
  smartphone: 'M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM11 18h2'
};

export const meioDaVida = (v: Vida): MeioDeComunicacao => meioDeComunicacao(v);

/** O símbolo da moeda do mês (vida histórica até 2025); senão, nada. */
export function simboloDaEpoca(v: Vida): string | undefined {
  if (!v.era || anoDe(v.t) > 2025) return undefined;
  return padraoEm(v.t).simbolo;
}
