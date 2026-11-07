/**
 * VIDA 13 — o pincel comum dos desenhos novos de tatuagem (`tatuagens13`, `tatuagens13Pop`): as cores, as formas que se
 * repetem (estrela, espiral, onda, pixel) e os atalhos de traço. Mesma caixa nativa e mesma linguagem da 12.9.
 */
import type { ReactNode } from 'react';

export type Cor = (hex: string) => string;
export interface PincelDaTatuagem13 { tinta: string; cor: Cor; traco: number; W: number; H: number; texto?: string; espelhado?: boolean }

export const VERMELHO = '#b8332e', VERDE = '#3f7a45', AMARELO = '#d9a520', AZUL = '#2f5e8a', LARANJA = '#d8742a', ROSA = '#d36a8a', MARROM = '#6b4a2a',
  CREME = '#efe2c4', ROXO = '#6b4f8f', TURQUESA = '#2f8f8a', CINZA1 = '#4a4f55', CINZA2 = '#7d838a', CINZA3 = '#b3b8bd', BRANCO = '#f2ede0',
  OURO = '#e0b43c', CELESTE = '#7cc4e4', VERDE_CLARO = '#7fbf5a', NEON = '#e23ca0', LIMAO = '#9be03c', TERRA = '#a0622d', AREIA = '#d9b77a', PRATA = '#c4c9cf';

export const f = (n: number) => Math.round(n * 100) / 100;
/** Estrela de n pontas. */
export const estrela = (cx: number, cy: number, r: number, n = 5, ri = r * 0.45, giro = -Math.PI / 2) =>
  'M' + Array.from({ length: n * 2 }, (_, k) => { const a = giro + (k * Math.PI) / n, q = k % 2 ? ri : r; return `${f(cx + Math.cos(a) * q)} ${f(cy + Math.sin(a) * q)}`; }).join(' L') + ' Z';
/** Espiral de dentro para fora. */
export const espiral = (cx: number, cy: number, r: number, voltas = 2.2, giro = 0) =>
  'M' + Array.from({ length: Math.round(voltas * 16) + 1 }, (_, k) => { const t = k / 16 * Math.PI * 2, q = (r * k) / (voltas * 16); return `${f(cx + Math.cos(t + giro) * q)} ${f(cy + Math.sin(t + giro) * q)}`; }).join(' L');
/** Ondinhas numa linha. */
export const ondas = (x0: number, x1: number, y: number, a = 0.8, n = 4) => {
  const w = (x1 - x0) / n;
  return `M${f(x0)} ${f(y)}` + Array.from({ length: n }, () => ` q${f(w / 4)} ${-a} ${f(w / 2)} 0 t${f(w / 2)} 0`).join('');
};
/** Pseudo-aleatório estável. */
export const sorte = (k: number) => { const x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
/** Polígono regular. */
export const poligono = (cx: number, cy: number, r: number, n: number, giro = -Math.PI / 2) =>
  'M' + Array.from({ length: n }, (_, k) => { const a = giro + (k * 2 * Math.PI) / n; return `${f(cx + Math.cos(a) * r)} ${f(cy + Math.sin(a) * r)}`; }).join(' L') + ' Z';
/** Pontos num círculo. */
export const noCirculo = (cx: number, cy: number, r: number, n: number, giro = -Math.PI / 2) =>
  Array.from({ length: n }, (_, k) => { const a = giro + (k * 2 * Math.PI) / n; return [f(cx + Math.cos(a) * r), f(cy + Math.sin(a) * r), a] as [number, number, number]; });

/** Os atalhos de traço de um pincel. */
export function atalhos(p: PincelDaTatuagem13) {
  const { tinta, traco } = p;
  const s = (w: number) => w * traco;
  return {
    s,
    /** Só linha. */
    L: (w: number) => ({ fill: 'none', stroke: tinta, strokeWidth: s(w), strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }),
    /** Contorno de uma forma cheia. */
    C: (w: number) => ({ stroke: tinta, strokeWidth: s(w), strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const }),
    /** Pixels: [x, y, cor] numa grade de lado `q`. */
    pixels: (x0: number, y0: number, q: number, mapa: string[], cores: Record<string, string>): ReactNode =>
      mapa.flatMap((linha, j) => [...linha].map((ch, i) => (cores[ch] ? <rect key={`${i}-${j}`} x={f(x0 + i * q)} y={f(y0 + j * q)} width={f(q + 0.04)} height={f(q + 0.04)} fill={cores[ch]} /> : null))),
    /** A letra (nunca espelhada). */
    letra: (t: string, x: number, y: number, tam: number, o: { peso?: number; fonte?: string; larg?: number; fill?: string; estilo?: string; contorno?: string; borda?: number } = {}) => (
      <g transform={p.espelhado ? `translate(${p.W} 0) scale(-1 1)` : undefined}>
        <text x={x} y={y} textAnchor="middle" fontSize={tam} fontFamily={o.fonte ?? "Georgia, 'Times New Roman', serif"} fontWeight={o.peso ?? 700} fontStyle={o.estilo} fill={o.fill ?? tinta}
          {...(o.contorno ? { stroke: o.contorno, strokeWidth: s(o.borda ?? 0.4), paintOrder: 'stroke' } : {})}
          {...(o.larg ? { textLength: o.larg, lengthAdjust: 'spacingAndGlyphs' } : {})}>{t}</text>
      </g>
    )
  };
}
