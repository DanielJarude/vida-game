/**
 * O motor, carregado sob demanda (um pacote à parte). Depois da primeira
 * carga, `motorCarregado()` devolve o módulo de forma síncrona.
 */
export type Motor = typeof import('../motor/fachada');

let cache: Motor | null = null;
let promessa: Promise<Motor> | null = null;

export const motorCarregado = (): Motor | null => cache;
export function carregarMotor(): Promise<Motor> {
  return (promessa ??= import('../motor/fachada').then(m => (cache = m)));
}
