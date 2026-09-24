/**
 * Abalos: acontecimentos que mexem com a pessoa AGORA — uma demissão, um
 * nascimento, uma perda. Cada um aplica um empurrão no humor e na cabeça e
 * guarda um nome curto, para a tela poder dizer o que pesou (ou animou)
 * este ano. O equilíbrio anual (`estado.ts`) vai absorvendo o empurrão.
 *
 * Módulo sem dependências de sistemas: qualquer sistema pode registrar um
 * abalo sem criar ciclo de importação.
 */

import type { Vida } from '../tipos';
import { clamp } from '../rng';

export interface Abalo {
  t: number;
  /** Nome curto do que aconteceu ("a demissão", "o nascimento de Ana"). */
  texto: string;
  humor: number;
  cabeca: number;
}

const LIMITE_ABALOS = 12;

export function abalar(v: Vida, texto: string, humor: number, cabeca: number): void {
  v.mente.felicidade = clamp(Math.round(v.mente.felicidade + humor));
  v.mente.estresse = clamp(Math.round(v.mente.estresse + cabeca));
  const lista = v.mente.abalos ?? (v.mente.abalos = []);
  lista.push({ t: v.t, texto, humor, cabeca });
  if (lista.length > LIMITE_ABALOS) lista.splice(0, lista.length - LIMITE_ABALOS);
}
