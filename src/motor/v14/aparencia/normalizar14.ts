/** VIDA 14 — APARÊNCIA: o normalizador dos saves (o rosto e os furos), chamado por `save.interpretar`. */
import type { Vida } from '../../tipos';
import { normalizarVida14AparenciaRosto } from './rosto14';
import { normalizarVida14AparenciaPiercings } from './piercings14';

export function normalizarVida14Aparencia(v: Vida): void {
  normalizarVida14AparenciaRosto(v);
  normalizarVida14AparenciaPiercings(v);
}
