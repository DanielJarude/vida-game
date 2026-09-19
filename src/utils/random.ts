// Fonte de aleatoriedade controlável (permite testes determinísticos)
type FonteAleatoria = () => number;

let fonteAleatoria: FonteAleatoria = Math.random;

/** Define uma fonte determinística (testes). Passe null para voltar ao Math.random. */
export function definirFonteAleatoria(fonte: FonteAleatoria | null): void {
  fonteAleatoria = fonte ?? Math.random;
}

export function resetarFonteAleatoria(): void {
  fonteAleatoria = Math.random;
}

/** Número uniforme entre 0 e 1 usando a fonte configurada. */
export function valorAleatorio(): number {
  return fonteAleatoria();
}

export function randomInt(min: number, max: number): number {
  return Math.floor(fonteAleatoria() * (max - min + 1)) + min;
}

export function randomChoice<T>(items: T[]): T {
  return items[Math.floor(fonteAleatoria() * items.length)];
}

export function rollChance(percentage: number): boolean {
  return fonteAleatoria() * 100 < percentage;
}

export function clamp(value: number, min: number = 0, max: number = 100): number {
  return Math.max(min, Math.min(max, value));
}

export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
