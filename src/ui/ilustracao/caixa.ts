/**
 * VIDA 12.8 — A CAIXA DE UM DESENHO: o retângulo que o desenho ocupa de fato dentro do quadro (a geladeira não enche o
 * quadro de 120 × 120 do mesmo jeito que o par de chuteiras). A cena do cômodo põe cada objeto no tamanho dele em metros,
 * e para isso mede a caixa do desenho, não o quadro.
 *
 * Lê os caminhos (`d`) das peças — M, L, H, V, C, S, Q, T, A e Z, absolutos e relativos — e as transformações dos grupos
 * (translate, scale, rotate). As curvas entram pelos pontos de controle (a caixa sai um pouco maior do que a curva, nunca
 * menor); o arco, pelo ponto final mais o raio. Puro: o mesmo desenho dá sempre a mesma caixa.
 */
import type { Amostra, Peca } from './nucleo';

export interface Caixa { x0: number; y0: number; x1: number; y1: number }
type M2 = [number, number, number, number, number, number];
const ID: M2 = [1, 0, 0, 1, 0, 0];
const mult = (a: M2, b: M2): M2 => [a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1], a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3], a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]];
const aplicar = (m: M2, x: number, y: number): [number, number] => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

function transformacao(t: string): M2 {
  let m = ID;
  const re = /(translate|scale|rotate|matrix)\(([^)]*)\)/g;
  let x: RegExpExecArray | null;
  while ((x = re.exec(t))) {
    const n = x[2].split(/[\s,]+/).filter(Boolean).map(Number);
    if (x[1] === 'translate') m = mult(m, [1, 0, 0, 1, n[0] ?? 0, n[1] ?? 0]);
    else if (x[1] === 'scale') m = mult(m, [n[0] ?? 1, 0, 0, n[1] ?? n[0] ?? 1, 0, 0]);
    else if (x[1] === 'matrix' && n.length === 6) m = mult(m, n as M2);
    else if (x[1] === 'rotate') {
      const a = (n[0] ?? 0) * Math.PI / 180, cx = n[1] ?? 0, cy = n[2] ?? 0;
      m = mult(mult(mult(m, [1, 0, 0, 1, cx, cy]), [Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0]), [1, 0, 0, 1, -cx, -cy]);
    }
  }
  return m;
}

/** Os pontos de um caminho SVG (os de passagem e os de controle). */
export function pontosDoCaminho(d: string): [number, number][] {
  const out: [number, number][] = [];
  const toks = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g) ?? [];
  let i = 0, cmd = '', x = 0, y = 0, x0 = 0, y0 = 0;
  const num = () => Number(toks[i++]);
  const temNum = () => i < toks.length && !/^[a-zA-Z]$/.test(toks[i]);
  while (i < toks.length) {
    if (/^[a-zA-Z]$/.test(toks[i])) cmd = toks[i++];
    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();
    if (C === 'Z') { x = x0; y = y0; continue; }
    if (!temNum()) { if (C !== 'Z') i++; continue; }
    const px = (v: number) => (rel ? x + v : v), py = (v: number) => (rel ? y + v : v);
    if (C === 'M' || C === 'L' || C === 'T') { const nx = px(num()), ny = py(num()); x = nx; y = ny; out.push([x, y]); if (C === 'M') { x0 = x; y0 = y; cmd = rel ? 'l' : 'L'; } }
    else if (C === 'H') { x = px(num()); out.push([x, y]); }
    else if (C === 'V') { y = py(num()); out.push([x, y]); }
    else if (C === 'C') { const a = [px(num()), py(num())], b = [px(num()), py(num())], c = [px(num()), py(num())]; out.push(a as [number, number], b as [number, number], c as [number, number]); x = c[0]; y = c[1]; }
    else if (C === 'S' || C === 'Q') { const a = [px(num()), py(num())], c = [px(num()), py(num())]; out.push(a as [number, number], c as [number, number]); x = c[0]; y = c[1]; }
    else if (C === 'A') {
      const rx = Math.abs(num()), ry = Math.abs(num()); num(); num(); num();
      const nx = px(num()), ny = py(num());
      // O arco cabe na caixa dos dois extremos acrescida do raio (largo o bastante para o círculo e a elipse).
      const mx = (x + nx) / 2, my = (y + ny) / 2;
      out.push([x, y], [nx, ny], [mx - rx, my - ry], [mx + rx, my + ry]);
      x = nx; y = ny;
    } else i++;
  }
  return out;
}

function juntar(pecas: Peca[], m: M2, acc: Caixa): void {
  for (const p of pecas) {
    if (p.tipo === 'grupo') { juntar(p.pecas, p.t ? mult(m, transformacao(p.t)) : m, acc); continue; }
    let pts: [number, number][] = [];
    if (p.tipo === 'pneu') pts = [[p.cx - p.r, p.cy - p.r], [p.cx + p.r, p.cy + p.r]];
    else if (p.tipo === 'texto') pts = [[p.x - p.tam, p.y - p.tam], [p.x + p.tam, p.y]];
    // VIDA 16: o halo é luz espalhada — não conta para a caixa do desenho.
    else if (p.tipo === 'halo') continue;
    else pts = pontosDoCaminho(p.d);
    for (const [px, py] of pts) {
      const [X, Y] = aplicar(m, px, py);
      if (!Number.isFinite(X) || !Number.isFinite(Y)) continue;
      if (X < acc.x0) acc.x0 = X; if (X > acc.x1) acc.x1 = X;
      if (Y < acc.y0) acc.y0 = Y; if (Y > acc.y1) acc.y1 = Y;
    }
  }
}

const CACHE = new WeakMap<Amostra, Caixa>();
/** A caixa do desenho (no sistema do quadro dele). Desenho vazio: o quadro inteiro. */
export function caixaDaAmostra(a: Amostra): Caixa {
  const ja = CACHE.get(a);
  if (ja) return ja;
  const acc: Caixa = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  juntar(a.pecas, ID, acc);
  const c = Number.isFinite(acc.x0) && acc.x1 > acc.x0 && acc.y1 > acc.y0
    ? { x0: Math.max(-a.vb[0], acc.x0), y0: Math.max(-a.vb[1], acc.y0), x1: Math.min(a.vb[0] * 2, acc.x1), y1: Math.min(a.vb[1] * 2, acc.y1) }
    : { x0: 0, y0: 0, x1: a.vb[0], y1: a.vb[1] };
  // O que está no chão encosta no chão (a linha do chão do desenho é a base, não o pé mais baixo de uma curva).
  if (a.chao !== undefined) c.y1 = a.chao;
  CACHE.set(a, c);
  return c;
}
