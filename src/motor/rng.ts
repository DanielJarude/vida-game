/**
 * Aleatoriedade reproduzível.
 *
 * Toda vida carrega o estado do próprio gerador (`vida.rng`). A mesma semente
 * com os mesmos comandos produz exatamente a mesma vida — é o que torna
 * simulação, teste e depuração confiáveis. Nenhum módulo do motor usa
 * `Math.random`.
 */

export interface Rng {
  /** Uniforme em [0, 1). */
  next(): number;
  /** Inteiro uniforme em [min, max], inclusivo. */
  int(min: number, max: number): number;
  /** Verdadeiro com probabilidade `p` (0..1). */
  chance(p: number): boolean;
  pick<T>(itens: readonly T[]): T;
  /** Sorteio ponderado; devolve `undefined` se nenhum peso for positivo. */
  weighted<T>(itens: readonly T[], peso: (item: T) => number): T | undefined;
  /** Normal aproximada (soma de uniformes), média 0 e desvio 1. */
  normal(): number;
  /** Estado atual, para persistir. */
  estado(): number;
}

/** mulberry32: pequeno, rápido e bom o bastante para um jogo. */
export function criarRng(semente: number): Rng {
  let s = semente >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rng: Rng = {
    next,
    int: (min, max) => Math.floor(next() * (max - min + 1)) + min,
    chance: p => next() < p,
    pick: itens => itens[Math.floor(next() * itens.length)],
    weighted: (itens, peso) => {
      let total = 0;
      const pesos = itens.map(i => {
        const w = Math.max(0, peso(i));
        total += w;
        return w;
      });
      if (total <= 0) return undefined;
      let alvo = next() * total;
      for (let i = 0; i < itens.length; i++) {
        alvo -= pesos[i];
        if (alvo < 0) return itens[i];
      }
      return itens[itens.length - 1];
    },
    normal: () => {
      let soma = 0;
      for (let i = 0; i < 6; i++) soma += next();
      return (soma - 3) / Math.sqrt(0.5);
    },
    estado: () => s
  };
  return rng;
}

/** Semente nova para uma vida (a única entrada não determinística do jogo). */
export function sementeAleatoria(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

export const clamp = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, v));
