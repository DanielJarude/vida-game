/**
 * VIDA 39 · ganchos do ano. Um sistema que mora no pacote `motor-extras` (carregado pela interface) se registra aqui;
 * o `avancarAno` chama todos depois de processar o ano do motor. Sem registro, nada acontece — e o motor base não cresce.
 */
import type { Vida } from '../tipos';
import type { Rng } from '../rng';

export type GanchoDoAno39 = (v: Vida, r: Rng) => void;

const GANCHOS: GanchoDoAno39[] = [];

export function registrarGanchoDoAno39(f: GanchoDoAno39): void {
  if (!GANCHOS.includes(f)) GANCHOS.push(f);
}

export function rodarGanchosDoAno39(v: Vida, r: Rng): void {
  for (const f of GANCHOS) f(v, r);
}
