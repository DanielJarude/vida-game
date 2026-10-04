/** Mistura duas cores hex (#rrggbb) — t = 0 é a primeira, 1 a segunda. */
export function misturar(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map(k => parseInt(a.slice(k, k + 2), 16));
  const pb = [1, 3, 5].map(k => parseInt(b.slice(k, k + 2), 16));
  return '#' + pa.map((x, k) => Math.round(x + (pb[k] - x) * t).toString(16).padStart(2, '0')).join('');
}
