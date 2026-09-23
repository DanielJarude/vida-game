/** Instantes em meses absolutos: `ano * 12 + mês` (mês 0..11). */

export const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

export const tDe = (ano: number, mes = 0) => ano * 12 + mes;
export const anoDe = (t: number) => Math.floor(t / 12);
export const mesDe = (t: number) => ((t % 12) + 12) % 12;
export const idadeEm = (tNasc: number, t: number) => Math.floor((t - tNasc) / 12);
export const anos = (n: number) => n * 12;
