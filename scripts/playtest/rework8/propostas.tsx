/**
 * REWORK 8 (Fase A) — as TRÊS direções de ilustração, comparáveis: as mesmas amostras, a mesma geometria, três
 * linguagens. Protótipo FORA do jogo (nada disto entra no bundle): serve para escolher a direção.
 *
 * A arquitetura que a Fase B usaria já está aqui, em miniatura:
 *   1. FAMÍLIAS DE FORMA com PARÂMETROS (um carro é um perfil: comprimento, altura, entre-eixos, teto, capô, traseira,
 *      vão livre, rodas, colunas) — os oito tipos de carro do jogo saem de oito conjuntos de números, não de oito
 *      desenhos copiados; cada modelo pode ter o seu (um 911 ≠ um Mustang) só mudando números;
 *   2. PEÇAS SEMÂNTICAS (massa pintada, vidro, pneu, metal, madeira, linha de detalhe) — a amostra diz O QUE é cada
 *      parte, não como pintar;
 *   3. um RENDERIZADOR por direção, que decide o traço, a luz e a textura de cada tipo de peça. Trocar de direção é
 *      trocar o renderizador; a cor do objeto (a do carro, a da pelagem, a da madeira) é dado e não muda com a paleta.
 *
 * Direção A — Catálogo editorial: cor material chapada, contorno fino e controlado, detalhes que distinguem.
 * Direção B — Miniaturas de mundo: volume discreto (luz de cima, sombra no chão), sem contorno, formas macias.
 * Direção C — Ilustração narrativa: traço a nanquim levemente irregular, aguada que escapa do traço, hachura.
 */
import type { ReactElement } from 'react';

export type Direcao = 'A' | 'B' | 'C';
type Pt = [number, number];

/* ============================================================== Cor e material */

const hex = (h: string) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const paraHex = (c: number[]) => `#${c.map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('')}`;
export const escurecer = (h: string, k = 0.3) => paraHex(hex(h).map(x => x * (1 - k)));
export const clarear = (h: string, k = 0.35) => paraHex(hex(h).map(x => x + (255 - x) * k));
const lum = (h: string) => { const [r, g, b] = hex(h).map(x => { const c = x / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };

/** A tinta do traço de cada direção (do objeto, não da interface: não muda com a paleta). */
const TINTA: Record<Direcao, string> = { A: '#2b2724', B: '#2b2724', C: '#3a2b22' };
/** O contorno de uma massa: escura sobre escuro precisa de um fio claro para não sumir num fundo escuro (o gato preto). */
const contornoDe = (d: Direcao, cor: string) => (lum(cor) < 0.035 ? (d === 'C' ? '#7a6a5c' : '#6d665d') : TINTA[d]);
/** A aguada da direção C: a cor do objeto, um pouco lavada pelo papel (o pigmento, não um filtro na tela). */
const lavar = (cor: string) => paraHex(hex(cor).map((x, k) => x * 0.82 + [243, 234, 216][k] * 0.18));

/* ============================================================== Geometria */

const f = (n: number) => Math.round(n * 10) / 10;
/** Polilinha com cantos arredondados; cada vértice pode trazer o seu raio ([x, y, r]). */
export function cantos(pts: (Pt | [number, number, number])[], fechar = true, rPadrao = 2): string {
  const P = pts.map(p => [p[0], p[1], (p as number[])[2] ?? rPadrao]);
  const n = P.length;
  let d = '';
  for (let k = 0; k < n; k++) {
    const b = P[k];
    const a = P[(k - 1 + n) % n], c = P[(k + 1) % n];
    const aberto = !fechar && (k === 0 || k === n - 1);
    if (aberto || b[2] <= 0) { d += `${k ? 'L' : 'M'}${f(b[0])} ${f(b[1])}`; continue; }
    const corta = (p: number[]) => { const dx = p[0] - b[0], dy = p[1] - b[1], L = Math.hypot(dx, dy) || 1, t = Math.min(b[2], L / 2) / L; return [b[0] + dx * t, b[1] + dy * t]; };
    const [p, q] = [corta(a), corta(c)];
    d += `${k ? 'L' : 'M'}${f(p[0])} ${f(p[1])}Q${f(b[0])} ${f(b[1])} ${f(q[0])} ${f(q[1])}`;
  }
  return d + (fechar ? 'Z' : '');
}
/** Curva suave por pontos (Catmull-Rom → Bézier). */
export function suave(pts: Pt[], fechar = true, tensao = 0.5): string {
  const n = pts.length;
  const p = (k: number) => pts[fechar ? (k + n) % n : Math.max(0, Math.min(n - 1, k))];
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let k = 0; k < (fechar ? n : n - 1); k++) {
    const [p0, p1, p2, p3] = [p(k - 1), p(k), p(k + 1), p(k + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) * tensao / 3, p1[1] + (p2[1] - p0[1]) * tensao / 3];
    const c2 = [p2[0] - (p3[0] - p1[0]) * tensao / 3, p2[1] - (p3[1] - p1[1]) * tensao / 3];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + (fechar ? 'Z' : '');
}
/** Recorta um polígono convexo entre duas verticais. */
function entreX(poly: Pt[], x0: number, x1: number): Pt[] {
  const corta = (pts: Pt[], x: number, manter: (p: Pt) => boolean): Pt[] => pts.flatMap((pp, k) => {
    const q = pts[(k + 1) % pts.length]; const out: Pt[] = manter(pp) ? [pp] : [];
    if (manter(pp) !== manter(q)) { const t = (x - pp[0]) / (q[0] - pp[0]); out.push([x, pp[1] + (q[1] - pp[1]) * t]); }
    return out;
  });
  return corta(corta(poly, x0, pp => pp[0] >= x0), x1, pp => pp[0] <= x1);
}
/**
 * Um membro (a perna, a cauda, o braço do violão): a linha do meio com a largura em cada ponto vira um contorno liso
 * e afunilado — a perna tem coxa, jarrete e pata; a cauda sai grossa do quadril e termina fina. Anatomia contínua.
 */
export function membro(eixo: Pt[], larg: number[]): string {
  const n = eixo.length;
  const normal = (k: number): Pt => { const a = eixo[Math.max(0, k - 1)], b = eixo[Math.min(n - 1, k + 1)]; const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; return [-dy / L, dx / L]; };
  const esq: Pt[] = [], dir: Pt[] = [];
  eixo.forEach((p, k) => { const [nx, ny] = normal(k); const w = larg[k] / 2; esq.push([p[0] + nx * w, p[1] + ny * w]); dir.push([p[0] - nx * w, p[1] - ny * w]); });
  return suave([...esq, ...dir.reverse()], true, 0.45);
}
const poligono = (pts: Pt[]) => (pts.length ? `M${pts.map(p => `${f(p[0])} ${f(p[1])}`).join('L')}Z` : '');

/* ============================================================== Peças semânticas */

export type Peca =
  | { tipo: 'massa'; d: string; cor: string; fino?: boolean }
  | { tipo: 'vidro'; d: string; claro?: boolean }
  | { tipo: 'metal'; d: string }
  | { tipo: 'linha'; d: string; larg?: number }
  | { tipo: 'pneu'; cx: number; cy: number; r: number; aro?: 'raios' | 'liga' | 'bicicleta' | 'cravos' }
  | { tipo: 'circulo'; cx: number; cy: number; r: number; cor: string }
  | { tipo: 'luz'; d: string; cor: string }
  /** Letras (o letreiro de um lugar): uma palavra genérica, nunca a marca de alguém. */
  | { tipo: 'texto'; x: number; y: number; texto: string; tam: number; cor: string }
  /** Uma amostra dentro da outra (o carro atrás do vidro da concessionária), com a sua transformação. */
  | { tipo: 'grupo'; t: string; pecas: Peca[] };

export interface Amostra { vb: [number, number]; chao: number; pecas: Peca[]; sombra?: [number, number] }

/* ============================================================== CARROS: um perfil, oito famílias */

export interface PerfilCarro {
  traseira: 'hatch' | 'tres' | 'fastback' | 'cacamba' | 'caixa';
  x0: number; x1: number; r: number; eT: number; eD: number;
  /** a soleira (o vão livre), a linha de cintura, o teto, a altura da traseira e a do capô na ponta */
  solo: number; cint: number; teto: number; tras: number; capo: number;
  /** onde o teto começa e termina; a base do para-brisa; o fim do porta-malas (sedã) ou da cabine (picape) */
  tT: number; tD: number; pb: number; vol?: number;
  colunas: number[];
  /** detalhes de família: o farol redondo no para-lama (o 911), o ombro traseiro, o rack, o estribo, o pneu de trilha */
  farolRedondo?: boolean; ombro?: number; rack?: boolean; estribo?: boolean; cravos?: boolean; liga?: boolean;
}

/** As famílias de carro do jogo, em números (viewBox 240×132, chão em 122). */
export const PERFIS: Record<string, PerfilCarro> = {
  // O compacto de entrada (Mobi, Kwid): curto, alto, rodas pequenas, quase sem capô, traseira reta.
  compacto: { traseira: 'hatch', x0: 42, x1: 196, r: 15, eT: 70, eD: 170, solo: 106, cint: 82, teto: 50, tras: 78, capo: 82, tT: 50, tD: 132, pb: 158, colunas: [0.5] },
  hatch: { traseira: 'hatch', x0: 32, x1: 206, r: 16, eT: 66, eD: 176, solo: 107, cint: 82, teto: 54, tras: 80, capo: 84, tT: 42, tD: 128, pb: 160, colunas: [0.52] },
  seda: { traseira: 'tres', x0: 18, x1: 222, r: 16, eT: 60, eD: 186, solo: 107, cint: 84, teto: 56, tras: 82, capo: 86, tT: 74, tD: 140, pb: 170, vol: 52, colunas: [0.5] },
  suv: { traseira: 'caixa', x0: 28, x1: 210, r: 18, eT: 64, eD: 180, solo: 100, cint: 76, teto: 44, tras: 72, capo: 78, tT: 32, tD: 138, pb: 166, colunas: [0.5], rack: true },
  suv_medio: { traseira: 'caixa', x0: 22, x1: 216, r: 19, eT: 60, eD: 186, solo: 99, cint: 74, teto: 42, tras: 70, capo: 76, tT: 26, tD: 142, pb: 172, colunas: [0.42, 0.76], rack: true },
  suv_grande: { traseira: 'caixa', x0: 14, x1: 224, r: 20, eT: 56, eD: 192, solo: 97, cint: 72, teto: 38, tras: 66, capo: 74, tT: 18, tD: 146, pb: 178, colunas: [0.33, 0.66], rack: true, estribo: true },
  // A picape (Hilux, S10): alta, cabine dupla curta, CAÇAMBA aberta atrás, pneus de trilha, estribo.
  picape: { traseira: 'cacamba', x0: 8, x1: 230, r: 19, eT: 50, eD: 194, solo: 94, cint: 70, teto: 38, tras: 70, capo: 70, tT: 102, tD: 150, pb: 176, vol: 98, colunas: [0.5], estribo: true, cravos: true },
  // O esportivo (o perfil de um 911): baixo, teto em bolha que desce até o para-choque, ombro largo sobre a roda de
  // trás, capô curto e caído, o farol redondo em cima do para-lama, rodas de liga.
  esportivo: { traseira: 'fastback', x0: 22, x1: 220, r: 16, eT: 58, eD: 182, solo: 108, cint: 90, teto: 62, tras: 96, capo: 98, tT: 70, tD: 128, pb: 158, colunas: [0.62], farolRedondo: true, ombro: 6, liga: true },
  // O muscle (o perfil de um Mustang): capô LONGO, traseira curta e alta, fastback reto — para mostrar que o mesmo
  // "esportivo" vira outro carro só mudando os números.
  muscle: { traseira: 'fastback', x0: 18, x1: 224, r: 17, eT: 56, eD: 186, solo: 106, cint: 86, teto: 60, tras: 84, capo: 88, tT: 52, tD: 108, pb: 132, colunas: [0.6], liga: true }
};

export function carro(p: PerfilCarro, cor: string): Amostra {
  const { x0, x1, r, eT, eD, solo, cint, teto, tras, capo, tT, tD, pb } = p;
  const chao = 122;
  const v = p.vol ?? 0;
  const ombro = p.ombro ?? 0;
  const cima: [number, number, number][] =
    p.traseira === 'hatch' ? [[x0, solo, 3], [x0, tras, 5], [x0 + 4, teto + 10, 14], [tT + 6, teto, 10], [tD, teto, 10], [pb, cint, 5], [x1 - 8, capo, 9], [x1, capo + 7, 5], [x1, solo, 3]]
    : p.traseira === 'caixa' ? [[x0, solo, 3], [x0, teto + 8, 6], [x0 + 3, teto, 6], [tD, teto, 9], [pb, cint, 5], [x1 - 6, capo, 6], [x1, capo + 6, 4], [x1, solo, 3]]
    : p.traseira === 'tres' ? [[x0, solo, 3], [x0, tras, 4], [v, tras - 2, 6], [tT, teto, 16], [tD, teto, 12], [pb, cint, 5], [x1 - 8, capo, 8], [x1, capo + 6, 5], [x1, solo, 3]]
    : p.traseira === 'cacamba' ? [[x0, solo, 3], [x0, cint, 3], [v, cint, 0], [v, teto + 4, 3], [v + 6, teto, 6], [tD, teto, 9], [pb, cint, 5], [x1 - 6, capo, 6], [x1, capo + 6, 4], [x1, solo, 3]]
    : [[x0, solo, 4], [x0, tras, 8], [x0 + 22, tras - 6 - ombro, 14], [tT, teto, 22], [tD, teto, 16], [pb, cint - 2, 8], [x1 - 12, capo - 2, 12], [x1, capo + 6, 6], [x1, solo, 4]];
  const R = r + 3;
  const arco = (x: number) => `L${f(x + R)} ${solo}A${R} ${R} 0 0 0 ${f(x - R)} ${solo}`;
  const topo = cantos(cima, false);
  const corpo = `${topo}${arco(eD)}${arco(eT)}L${x0} ${solo}Z`;
  // A estufa (o vão envidraçado) recortada pelas colunas.
  const gx = p.traseira === 'cacamba' ? v + 5 : p.traseira === 'caixa' ? x0 + 5 : p.traseira === 'tres' ? tT - 4 : p.traseira === 'fastback' ? tT - 6 : x0 + 7;
  const gxTopo = p.traseira === 'hatch' ? tT + 6 : p.traseira === 'caixa' ? x0 + 6 : p.traseira === 'cacamba' ? v + 7 : tT + 6;
  const vao: Pt[] = [[gx, cint - 3], [gxTopo, teto + 5], [tD - 3, teto + 5], [pb - 6, cint - 3]];
  const xa = Math.min(vao[0][0], vao[1][0]), xb = pb - 6;
  const cortes = [xa, ...p.colunas.map(c => xa + (xb - xa) * c), xb];
  const vidros = cortes.slice(0, -1).map((x, k) => entreX(vao, x + (k ? 2 : 0), cortes[k + 1] - (k < cortes.length - 2 ? 2 : 0)));
  const portas = p.colunas.map(c => xa + (xb - xa) * c);
  const pecas: Peca[] = [
    { tipo: 'massa', d: corpo, cor },
    ...vidros.map(j => ({ tipo: 'vidro' as const, d: poligono(j) })),
    // As portas (a costura da lataria) e a maçaneta; o para-choque.
    ...portas.map(x => ({ tipo: 'linha' as const, d: `M${f(x)} ${cint - 1}V${solo - 4}` })),
    { tipo: 'linha', d: `M${f(portas[0] - 2)} ${cint + 6}h-7${portas[1] ? `M${f(portas[1] - 2)} ${cint + 6}h-7` : ''}`, larg: 1.6 },
    { tipo: 'linha', d: `M${x0 + 2} ${solo - 6}h10M${x1 - 12} ${solo - 6}h10` },
    // As luzes: o farol na ponta (redondo em cima do para-lama, no 911) e a lanterna atrás.
    p.farolRedondo
      ? { tipo: 'luz', d: `M${x1 - 26} ${capo - 1}a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0-9 0`, cor: '#f2ead2' }
      : { tipo: 'luz', d: cantos([[x1 - 9, capo + 6, 1.5], [x1 - 1, capo + 7, 1.5], [x1 - 1, capo + 12, 1.5], [x1 - 9, capo + 11, 1.5]]), cor: '#f2ead2' },
    { tipo: 'luz', d: cantos([[x0 + 1, (p.traseira === 'cacamba' ? cint : tras) + 3, 1], [x0 + 5, (p.traseira === 'cacamba' ? cint : tras) + 3, 1], [x0 + 5, (p.traseira === 'cacamba' ? cint : tras) + 10, 1], [x0 + 1, (p.traseira === 'cacamba' ? cint : tras) + 10, 1]]), cor: '#c8372d' },
    { tipo: 'pneu', cx: eT, cy: chao - r, r, aro: p.cravos ? 'cravos' : p.liga ? 'liga' : undefined },
    { tipo: 'pneu', cx: eD, cy: chao - r, r, aro: p.cravos ? 'cravos' : p.liga ? 'liga' : undefined }
  ];
  if (p.rack) pecas.splice(1, 0, { tipo: 'metal', d: cantos([[x0 + 10, teto - 4, 1], [tD - 10, teto - 4, 1], [tD - 10, teto - 1, 1], [x0 + 10, teto - 1, 1]]) });
  if (p.estribo) pecas.push({ tipo: 'metal', d: cantos([[eT + R + 4, solo + 2, 1], [eD - R - 4, solo + 2, 1], [eD - R - 4, solo + 5, 1], [eT + R + 4, solo + 5, 1]]) });
  if (p.traseira === 'cacamba') pecas.push({ tipo: 'linha', d: `M${x0 + 4} ${cint + 4}H${v - 4}`, larg: 1.4 });
  return { vb: [240, 132], chao, pecas, sombra: [(x0 + x1) / 2, (x1 - x0) / 2 + 6] };
}

/* ============================================================== Duas rodas */

export function bicicletaUrbana(cor: string): Amostra {
  const chao = 122, r = 27, eT = 66, eD = 176, cy = chao - r;
  const mov: Pt = [112, 98]; // o movimento central (o pedal)
  const canote: Pt = [96, 50], caixa: Pt = [158, 46];
  return {
    vb: [240, 132], chao, sombra: [121, 72],
    pecas: [
      { tipo: 'pneu', cx: eT, cy, r, aro: 'bicicleta' }, { tipo: 'pneu', cx: eD, cy, r, aro: 'bicicleta' },
      // Os para-lamas (arcos sobre as rodas) e o protetor de corrente.
      { tipo: 'massa', d: `M${eT - r - 2} ${cy}A${r + 4} ${r + 4} 0 0 1 ${eT + r * 0.75} ${cy - r * 0.8}l1.6 2.6A${r + 1.5} ${r + 1.5} 0 0 0 ${eT - r + 0.6} ${cy}Z`, cor, fino: true },
      { tipo: 'massa', d: `M${eD - r * 0.6} ${cy - r * 0.88}A${r + 4} ${r + 4} 0 0 1 ${eD + r + 2} ${cy + 2}h-2.6A${r + 1.5} ${r + 1.5} 0 0 0 ${eD - r * 0.55} ${cy - r * 0.78}Z`, cor, fino: true },
      // O quadro baixo, de passar a perna (urbana): o tubo inferior curvo do guidão até o pedal; a balança traseira.
      { tipo: 'massa', d: `${suave([[caixa[0] - 1, caixa[1] + 2], [134, 82], [mov[0] + 6, mov[1] + 2], [mov[0] - 2, mov[1] + 4], [124, 82], [caixa[0] - 6, caixa[1] - 1]], true, 0.35)}`, cor },
      { tipo: 'massa', d: cantos([[mov[0], mov[1] - 2, 2], [canote[0] + 1, canote[1] + 6, 1.5], [canote[0] + 5, canote[1] + 6, 1.5], [mov[0] + 4, mov[1], 2]]), cor },
      { tipo: 'massa', d: cantos([[eT, cy - 2, 2], [mov[0], mov[1] - 3, 2], [mov[0], mov[1] + 2, 2], [eT, cy + 2, 2]]), cor },
      { tipo: 'massa', d: cantos([[eT, cy - 2, 2], [canote[0] + 2, canote[1] + 10, 2], [canote[0] + 5, canote[1] + 12, 2], [eT + 3, cy + 1, 2]]), cor },
      { tipo: 'massa', d: cantos([[mov[0] - 16, mov[1] - 6, 3], [mov[0] + 8, mov[1] - 6, 3], [mov[0] + 8, mov[1] + 2, 3], [mov[0] - 16, mov[1] + 2, 3]]), cor: escurecer(cor, 0.2), fino: true },
      // O garfo, o guidão alto que volta para o ciclista, o selim largo com mola, a cesta na frente.
      { tipo: 'metal', d: cantos([[caixa[0] - 2, caixa[1], 1], [eD + 1, cy, 1], [eD - 2, cy + 1, 1], [caixa[0] - 5, caixa[1] + 2, 1]]) },
      { tipo: 'linha', d: `M${caixa[0]} ${caixa[1]}l-2-12c-1-6 -12-6 -20-4`, larg: 2.6 },
      { tipo: 'massa', d: cantos([[canote[0] - 12, canote[1] - 2, 4], [canote[0] + 10, canote[1] - 3, 4], [canote[0] + 8, canote[1] + 3, 3], [canote[0] - 10, canote[1] + 4, 3]]), cor: '#3b2a20' },
      { tipo: 'massa', d: cantos([[caixa[0] + 4, caixa[1] - 12, 2], [caixa[0] + 30, caixa[1] - 12, 2], [caixa[0] + 26, caixa[1] + 6, 2], [caixa[0] + 7, caixa[1] + 6, 2]]), cor: '#b98a4e', fino: true },
      { tipo: 'linha', d: `M${caixa[0] + 9} ${caixa[1] - 12}l1 18M${caixa[0] + 17} ${caixa[1] - 12}v18M${caixa[0] + 24} ${caixa[1] - 12}l-1 18M${caixa[0] + 5} ${caixa[1] - 4}h24`, larg: 0.8 },
      { tipo: 'circulo', cx: mov[0], cy: mov[1], r: 6, cor: '#8d8f92' },
      { tipo: 'linha', d: `M${mov[0]} ${mov[1]}l8 9h6`, larg: 2 },
      { tipo: 'luz', d: 'M174 44a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0-7 0', cor: '#f2ead2' }
    ]
  };
}

export function motocicleta(cor: string): Amostra {
  const chao = 122, r = 23, eT = 62, eD = 182, cy = chao - r;
  return {
    vb: [240, 132], chao, sombra: [122, 74],
    pecas: [
      { tipo: 'pneu', cx: eT, cy, r, aro: 'liga' }, { tipo: 'pneu', cx: eD, cy, r, aro: 'liga' },
      // A balança traseira e o garfo dianteiro inclinado (o ângulo de direção).
      { tipo: 'metal', d: cantos([[eT, cy - 2, 2], [118, 82, 2], [120, 88, 2], [eT, cy + 3, 2]]) },
      { tipo: 'metal', d: cantos([[156, 40, 1.5], [eD + 1, cy, 1.5], [eD - 4, cy + 1, 1.5], [151, 42, 1.5]]) },
      // O motor (o bloco com as aletas do cilindro) e o escapamento saindo por baixo até atrás.
      // O motor: o cilindro inclinado com as aletas, o cárter redondo embaixo (não uma caixa).
      { tipo: 'massa', d: cantos([[112, 64, 3], [138, 60, 3], [142, 82, 3], [116, 86, 3]]), cor: '#7b7873' },
      { tipo: 'linha', d: 'M114 68l25-4M115 72l25-4M116 76l25-4M117 80l25-4', larg: 1.1 },
      { tipo: 'massa', d: suave([[104, 84], [122, 80], [144, 84], [146, 98], [126, 104], [104, 100]], true, 0.45), cor: '#5d5a56' },
      { tipo: 'circulo', cx: 120, cy: 93, r: 6, cor: '#8f8b85' },
      { tipo: 'massa', d: `${suave([[104, 98], [80, 104], [52, 98], [36, 92], [36, 98], [52, 104], [82, 110], [108, 104]], true, 0.4)}`, cor: '#9a9a96', fino: true },
      // O tanque (a gota sobre o motor), o banco que desce até a rabeta, a carenagem lateral.
      { tipo: 'massa', d: suave([[104, 52], [124, 40], [152, 42], [150, 58], [130, 66], [104, 64]], true, 0.45), cor },
      { tipo: 'massa', d: suave([[56, 56], [72, 52], [106, 54], [110, 62], [88, 66], [60, 66]], true, 0.35), cor: '#2a2725' },
      { tipo: 'massa', d: cantos([[46, 52, 3], [64, 52, 3], [70, 66, 3], [54, 68, 3]]), cor },
      { tipo: 'luz', d: cantos([[44, 54, 1], [49, 54, 1], [49, 59, 1], [44, 59, 1]]), cor: '#c8372d' },
      // O farol redondo, o guidão e o retrovisor.
      { tipo: 'circulo', cx: 166, cy: 46, r: 8, cor: '#4a4743' },
      { tipo: 'luz', d: 'M166 41a5 5 0 1 0 .01 0z', cor: '#f2ead2' },
      { tipo: 'linha', d: 'M154 36l8-6h10M158 32l-2-10h6', larg: 2.2 },
      { tipo: 'massa', d: 'M117 52l14 2 1 5-14-1z', cor: escurecer(cor, 0.25), fino: true }
    ]
  };
}

/* ============================================================== Bichos */

export function cachorro(cor: string, mancha = '#f3ede2'): Amostra {
  const chao = 122, sombra = escurecer(cor, 0.2);
  const pata = (x: number, c: string): Peca => ({ tipo: 'massa', d: `M${x - 6} ${chao - 1}c0-5 12-5 13 0z`, cor: c, fino: true });
  return {
    vb: [240, 132], chao, sombra: [120, 62],
    pecas: [
      // A cauda: sai grossa do quadril e sobe em curva até a ponta fina (um só traço com o corpo).
      { tipo: 'massa', d: membro([[72, 62], [60, 52], [52, 38], [54, 26]], [11, 9, 7, 3]), cor },
      // As pernas do lado de lá (mais escuras): a de trás com o jarrete, a da frente reta.
      { tipo: 'massa', d: membro([[84, 76], [78, 92], [86, 106], [84, 119]], [18, 12, 8, 7]), cor: sombra },
      { tipo: 'massa', d: membro([[152, 80], [150, 100], [150, 119]], [14, 9, 8]), cor: sombra },
      pata(85, sombra), pata(151, sombra),
      // O corpo: peito fundo, lombo reto, barriga recolhida, quadril; o pescoço que sobe para a cabeça.
      { tipo: 'massa', d: suave([[70, 62], [100, 56], [140, 56], [160, 52], [174, 60], [172, 80], [156, 88], [130, 82], [104, 84], [80, 82], [66, 72]], true, 0.42), cor },
      { tipo: 'massa', d: membro([[160, 62], [172, 50], [180, 40]], [26, 22, 18]), cor },
      // As pernas do lado de cá.
      { tipo: 'massa', d: membro([[96, 74], [90, 92], [100, 106], [98, 119]], [20, 13, 8, 7]), cor },
      { tipo: 'massa', d: membro([[164, 78], [164, 100], [164, 119]], [15, 9, 8]), cor },
      pata(99, cor), pata(165, cor),
      // A mancha clara do peito (a pelagem do bicho).
      { tipo: 'massa', d: suave([[166, 58], [176, 62], [174, 78], [164, 82], [160, 70]], true, 0.4), cor: mancha, fino: true },
      // A cabeça: o crânio, o stop, o focinho, a orelha caída por cima, o olho, a trufa e a boca.
      { tipo: 'massa', d: suave([[170, 40], [176, 26], [192, 22], [204, 30], [218, 36], [220, 44], [210, 50], [192, 50], [178, 52]], true, 0.42), cor },
      { tipo: 'massa', d: suave([[184, 24], [176, 28], [172, 44], [178, 50], [186, 40], [190, 27]], true, 0.4), cor: escurecer(cor, 0.32) },
      { tipo: 'circulo', cx: 198, cy: 32, r: 2.4, cor: '#1d1a17' },
      { tipo: 'circulo', cx: 219, cy: 39, r: 3, cor: '#1d1a17' },
      { tipo: 'linha', d: 'M212 47q-6 3-12 1', larg: 1.1 }
    ]
  };
}

export function gato(cor: string): Amostra {
  const chao = 122, sombra = escurecer(cor, 0.18);
  const pata = (x: number, c: string): Peca => ({ tipo: 'massa', d: `M${x - 4.5} ${chao - 1}c0-4 9-4 9.5 0z`, cor: c, fino: true });
  return {
    vb: [240, 132], chao, sombra: [124, 56],
    pecas: [
      // A cauda longa e viva, em "S": desce do quadril e sobe até a ponta — o que separa o gato do cachorro de longe.
      { tipo: 'massa', d: membro([[80, 68], [62, 72], [48, 62], [44, 44], [50, 30], [56, 28]], [9, 8, 7, 6, 5, 3]), cor },
      // As pernas finas do lado de lá; a de trás dobrada (está andando).
      { tipo: 'massa', d: membro([[90, 76], [82, 92], [92, 106], [90, 119]], [14, 9, 6, 5.5]), cor: sombra },
      { tipo: 'massa', d: membro([[150, 78], [153, 100], [150, 119]], [10, 6.5, 5.5]), cor: sombra },
      pata(91, sombra), pata(151, sombra),
      // O corpo comprido e baixo, as costas retas, a barriga solta.
      { tipo: 'massa', d: suave([[80, 64], [110, 58], [150, 60], [168, 64], [168, 80], [142, 86], [112, 88], [86, 82]], true, 0.42), cor },
      { tipo: 'massa', d: membro([[104, 78], [102, 96], [110, 106], [108, 119]], [15, 10, 6, 5.5]), cor },
      { tipo: 'massa', d: membro([[164, 76], [170, 98], [170, 119]], [11, 7, 5.5]), cor },
      pata(109, cor), pata(171, cor),
      // A cabeça redonda e pequena, as orelhas em triângulo, o focinho curto, o olho amarelo, os bigodes.
      { tipo: 'massa', d: suave([[162, 60], [164, 48], [176, 42], [190, 44], [198, 54], [196, 64], [184, 70], [168, 68]], true, 0.45), cor },
      { tipo: 'massa', d: cantos([[166, 50, 1.5], [170, 30, 1.5], [180, 44, 1.5]]), cor },
      { tipo: 'massa', d: cantos([[184, 43, 1.5], [194, 28, 1.5], [195, 49, 1.5]]), cor },
      { tipo: 'circulo', cx: 187, cy: 54, r: 2.4, cor: '#c7d24a' },
      { tipo: 'circulo', cx: 187, cy: 54, r: 1, cor: '#1d1a17' },
      { tipo: 'circulo', cx: 197.5, cy: 60, r: 1.6, cor: '#c47d7d' },
      { tipo: 'linha', d: 'M197 63l14 1M197 65l13 4M197 61l13-3', larg: 0.6 }
    ]
  };
}

/* ============================================================== Objetos, casa, lugar */

export function violao(): Amostra {
  const tampo = '#d9a75e', lateral = '#7a4220', braco = '#4a2a18';
  return {
    vb: [120, 220], chao: 212, sombra: [60, 28],
    pecas: [
      // O corpo em oito (as duas curvas e a cintura), o tampo claro de abeto sobre as laterais de jacarandá.
      { tipo: 'massa', d: suave([[60, 102], [78, 104], [87, 118], [82, 136], [80, 146], [94, 164], [92, 192], [76, 206], [60, 209], [44, 206], [28, 192], [26, 164], [40, 146], [38, 136], [33, 118], [42, 104]], true, 0.5), cor: lateral },
      { tipo: 'massa', d: suave([[60, 106], [76, 108], [84, 120], [79, 136], [77, 147], [90, 165], [88, 190], [74, 202], [60, 205], [46, 202], [32, 190], [30, 165], [43, 147], [41, 136], [36, 120], [44, 108]], true, 0.5), cor: tampo, fino: true },
      // A boca com a roseta, o cavalete, as cordas.
      { tipo: 'circulo', cx: 60, cy: 144, r: 13, cor: '#3a2416' },
      { tipo: 'linha', d: 'M44 144a16 16 0 1 0 32 0a16 16 0 1 0-32 0', larg: 1.4 },
      { tipo: 'massa', d: cantos([[46, 176, 1.5], [74, 176, 1.5], [74, 181, 1.5], [46, 181, 1.5]]), cor: braco },
      // O braço com o escala e os trastes, a mão vazada com as tarraxas.
      { tipo: 'massa', d: cantos([[54, 20, 1], [66, 20, 1], [65, 108, 1], [55, 108, 1]]), cor: braco },
      { tipo: 'linha', d: 'M54.5 34h11M54.5 46h11M54.6 57h10.8M54.7 67h10.6M54.8 76h10.4M54.9 84h10.2', larg: 0.8 },
      { tipo: 'massa', d: cantos([[50, 4, 3], [70, 4, 3], [68, 24, 2], [52, 24, 2]]), cor: braco },
      { tipo: 'massa', d: cantos([[56, 8, 1], [59, 8, 1], [59, 20, 1], [56, 20, 1]]), cor: '#1e130c', fino: true },
      { tipo: 'massa', d: cantos([[61, 8, 1], [64, 8, 1], [64, 20, 1], [61, 20, 1]]), cor: '#1e130c', fino: true },
      { tipo: 'linha', d: 'M50 9h-5M50 15h-5M50 21h-5M70 9h5M70 15h5M70 21h5', larg: 2.2 },
      { tipo: 'linha', d: 'M57 22V178M59 22V178M61 22V178M63 22V178', larg: 0.4 }
    ]
  };
}

export function casa(): Amostra {
  const parede = '#e7c79a', telhado = '#b5583a', esquadria = '#f4efe6', porta = '#5b6f4e';
  const chao = 148;
  return {
    vb: [240, 160], chao, sombra: [120, 92],
    pecas: [
      // O muro baixo e a planta: a casa tem um lugar.
      { tipo: 'massa', d: suave([[22, 148], [26, 120], [40, 112], [52, 122], [54, 148]], true, 0.4), cor: '#5f8a4c' },
      // A chaminé, a parede, o telhado de duas águas com o beiral, as telhas.
      { tipo: 'massa', d: cantos([[150, 34, 1], [164, 34, 1], [164, 60, 0], [150, 60, 0]]), cor: '#a24d33' },
      { tipo: 'massa', d: cantos([[60, 72, 1], [180, 72, 1], [180, 146, 0], [60, 146, 0]]), cor: parede },
      { tipo: 'massa', d: cantos([[48, 76, 2], [120, 26, 3], [192, 76, 2], [186, 80, 1], [120, 36, 2], [54, 80, 1]]), cor: telhado },
      { tipo: 'massa', d: cantos([[56, 76, 0], [120, 34, 2], [184, 76, 0]]), cor: escurecer(telhado, 0.12), fino: true },
      { tipo: 'linha', d: 'M78 64h84M92 54h56M106 44h28', larg: 0.8 },
      // A porta com a maçaneta e o degrau; as janelas com a esquadria em cruz.
      { tipo: 'massa', d: cantos([[106, 100, 1.5], [134, 100, 1.5], [134, 146, 0], [106, 146, 0]]), cor: porta },
      { tipo: 'circulo', cx: 129, cy: 124, r: 1.8, cor: '#d9c27a' },
      { tipo: 'massa', d: cantos([[100, 146, 0], [140, 146, 0], [142, 150, 0], [98, 150, 0]]), cor: '#bdb3a4', fino: true },
      { tipo: 'massa', d: cantos([[70, 94, 1], [96, 94, 1], [96, 120, 1], [70, 120, 1]]), cor: esquadria },
      { tipo: 'vidro', d: 'M73 97h9.5v9.5H73zM84.5 97H93v9.5h-8.5zM73 108.5h9.5V117H73zM84.5 108.5H93V117h-8.5z' },
      { tipo: 'massa', d: cantos([[144, 94, 1], [170, 94, 1], [170, 120, 1], [144, 120, 1]]), cor: esquadria },
      { tipo: 'vidro', d: 'M147 97h9.5v9.5H147zM158.5 97H167v9.5h-8.5zM147 108.5h9.5V117H147zM158.5 108.5H167V117h-8.5z' },
      { tipo: 'linha', d: 'M60 146H180', larg: 1.2 }
    ]
  };
}

/** A fachada de uma concessionária: o letreiro, a vitrine de vidro com um carro dentro, o totem com a marca, as bandeiras. */
export function concessionaria(corCarro = '#b8352b'): Amostra {
  const chao = 148;
  const naVitrine = (t: string, perfil: PerfilCarro, cor: string): Peca => ({ tipo: 'grupo', t, pecas: carro(perfil, cor).pecas.filter(p => p.tipo !== 'linha') });
  return {
    vb: [260, 160], chao, sombra: [130, 120],
    pecas: [
      // O prédio: a caixa clara de aço, a faixa do letreiro com as letras, a marquise que avança.
      { tipo: 'massa', d: cantos([[34, 40, 1], [236, 40, 1], [236, 146, 0], [34, 146, 0]]), cor: '#e3e0d9' },
      { tipo: 'massa', d: cantos([[28, 28, 1.5], [242, 28, 1.5], [242, 50, 0], [28, 50, 0]]), cor: '#2f3a44' },
      { tipo: 'texto', x: 135, y: 43.5, texto: 'VEÍCULOS', tam: 10, cor: '#f2ede2' },
      { tipo: 'massa', d: cantos([[30, 50, 0], [240, 50, 0], [232, 56, 0], [38, 56, 0]]), cor: '#c9c5bd', fino: true },
      // A vitrine de vidro claro (o reflexo do céu), as colunas, os carros do salão, o piso polido.
      { tipo: 'vidro', d: cantos([[44, 60, 1], [226, 60, 1], [226, 140, 0], [44, 140, 0]]), claro: true },
      naVitrine('translate(54 98) scale(0.36)', PERFIS.suv, '#2c4f8a'),
      naVitrine('translate(132 101) scale(0.36)', PERFIS.hatch, corCarro),
      { tipo: 'linha', d: 'M89 60v80M135 60v80M181 60v80', larg: 1.8 },
      { tipo: 'metal', d: cantos([[40, 140, 0], [230, 140, 0], [232, 146, 0], [38, 146, 0]]) },
      // O totem com a marca (um disco com um carro estilizado) e as bandeiras.
      { tipo: 'massa', d: cantos([[6, 24, 2], [24, 24, 2], [24, 146, 0], [6, 146, 0]]), cor: '#2f3a44' },
      { tipo: 'circulo', cx: 15, cy: 38, r: 7, cor: '#c8372d' },
      { tipo: 'massa', d: 'M10 40.5l2-3.4h6l2 3.4z', cor: '#f2ede2', fino: true },
      { tipo: 'linha', d: 'M247 146V16M253 146V26', larg: 1.2 },
      { tipo: 'massa', d: 'M247 16l12 4-12 4z', cor: '#c8372d', fino: true },
      { tipo: 'massa', d: 'M253 26l8 3-8 3z', cor: '#e6b23a', fino: true }
    ]
  };
}

/* ============================================================== Os renderizadores */

let uid = 0;
/** Ruído estável (sem Math.random: a mesma amostra sai igual toda vez). */
function ruido(k: number) { const x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
/** Para a direção C: o mesmo caminho com os números levemente deslocados (a mão do desenhista). */
function tremido(d: string, amp: number, semente: number) {
  // Só as coordenadas tremem; num arco (A/a: rx ry rotação grande varredura x y) os raios e as bandeiras ficam.
  let k = semente, cmd = '', nArco = 0;
  return d.replace(/[a-zA-Z]|-?\d*\.?\d+/g, t => {
    if (/[a-zA-Z]/.test(t)) { cmd = t; nArco = 0; return t; }
    if (cmd === 'A' || cmd === 'a') { const pos = nArco++ % 7; if (pos < 5) return t; }
    k++;
    return f(Number(t) + (ruido(k) - 0.5) * amp).toString();
  });
}

export function Desenho({ a, dir, largura, rotulo, chao = true }: { a: Amostra; dir: Direcao; largura: number; rotulo: string; chao?: boolean }): ReactElement {
  const id = `d${++uid}`;
  const [w, h] = a.vb;
  const altura = Math.round((largura * h) / w);
  const k = w / largura; // traço proporcional ao tamanho em tela (um fio de 1 px a 72 px é um fio de 1 px a 220 px)
  const fio = Math.max(0.9, Math.min(2.2, k * 1.05));
  const defs: ReactElement[] = [];
  const gradiente = (cor: string) => {
    const g = `${id}g${defs.length}`;
    defs.push(<linearGradient key={g} id={g} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={clarear(cor, 0.32)} /><stop offset="0.45" stopColor={cor} /><stop offset="1" stopColor={escurecer(cor, 0.22)} /></linearGradient>);
    return `url(#${g})`;
  };
  const vidroB = `${id}vidro`;
  const hachura = `${id}hach`;
  if (dir === 'B') defs.push(<linearGradient key="v" id={vidroB} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#c7d6df" /><stop offset="0.5" stopColor="#61778a" /><stop offset="1" stopColor="#2c3a47" /></linearGradient>);
  const brilho = `${id}brilho`, reflexo = `${id}reflexo`, sombraC = `${id}sombra`;
  defs.push(<linearGradient key="r" id={reflexo} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffffff" stopOpacity={0.55} /><stop offset="0.35" stopColor="#ffffff" stopOpacity={0.05} /><stop offset="0.55" stopColor="#ffffff" stopOpacity={0.3} /><stop offset="1" stopColor="#ffffff" stopOpacity={0} /></linearGradient>);
  if (dir === 'B') defs.push(<linearGradient key="b" id={brilho} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" stopOpacity={0.42} /><stop offset="0.28" stopColor="#ffffff" stopOpacity={0} /></linearGradient>);
  if (dir === 'C') {
    defs.push(<pattern key="h" id={hachura} width="3.2" height="3.2" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><path d="M0 0V3.2" stroke={TINTA.C} strokeWidth="0.75" opacity="0.55" /></pattern>);
    defs.push(<linearGradient key="mg" id={`${sombraC}g`} x1="0" y1="0" x2="0" y2="1"><stop offset="0.45" stopColor="#fff" stopOpacity={0} /><stop offset="1" stopColor="#fff" stopOpacity={0.9} /></linearGradient>);
    defs.push(<mask key="m" id={sombraC} maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill={`url(#${sombraC}g)`} /></mask>);
  }
  let s = 0;
  const desenhar = (lista: Peca[]): ReactElement[] => lista.map((p, i): ReactElement => {
    s += 17;
    const tinta = 'cor' in p ? contornoDe(dir, p.cor) : TINTA[dir];
    switch (p.tipo) {
      case 'massa': {
        const larg = p.fino ? fio * 0.7 : fio;
        if (dir === 'A') return <path key={i} d={p.d} fill={p.cor} stroke={tinta} strokeWidth={larg} strokeLinejoin="round" />;
        // B: volume — a luz de cima (o gradiente forte), a borda de baixo mais escura, o brilho de cima recortado na forma.
        // (Um objeto quase preto ganha um fio claro em volta, para não sumir no papel escuro — a regra que o jogo já usa.)
        if (dir === 'B') return <g key={i}><path d={p.d} fill={gradiente(p.cor)} /><path d={p.d} fill="none" stroke={lum(p.cor) < 0.035 ? '#8a847b' : escurecer(p.cor, 0.45)} strokeWidth={0.8} strokeOpacity={lum(p.cor) < 0.035 ? 0.9 : 0.55} strokeLinejoin="round" /><path d={p.d} fill={`url(#${brilho})`} /></g>;
        // C: a aguada (a cor um pouco lavada, que escapa do traço), o nanquim irregular em duas passadas e a hachura do
        // lado da sombra (a metade de baixo).
        return <g key={i}><path d={p.d} fill={lavar(p.cor)} transform="translate(2.2 1.6)" /><path d={p.d} fill={`url(#${hachura})`} mask={`url(#${sombraC})`} /><path d={tremido(p.d, 1.8, s)} fill="none" stroke={tinta} strokeWidth={larg * 1.25} strokeLinejoin="round" strokeLinecap="round" /><path d={tremido(p.d, 2.6, s + 7)} fill="none" stroke={tinta} strokeWidth={larg * 0.5} opacity={0.55} /></g>;
      }
      case 'vidro':
        if (p.claro && dir === 'A') return <g key={i}><path d={p.d} fill="#a9bcc7" stroke={TINTA.A} strokeWidth={fio * 0.6} /><path d={p.d} fill={`url(#${reflexo})`} /></g>;
        if (dir === 'A') return <path key={i} d={p.d} fill="#2e3c47" stroke={TINTA.A} strokeWidth={fio * 0.6} />;
        if (dir === 'B') return <g key={i}><path d={p.d} fill={`url(#${p.claro ? reflexo : vidroB})`} />{p.claro && <path d={p.d} fill="#8fa6b4" opacity={0.55} />}<path d={p.d} fill="none" stroke="#ffffff" strokeOpacity={0.35} strokeWidth={0.6} /></g>;
        return <g key={i}><path d={p.d} fill="#b9cbd6" opacity={0.85} transform="translate(1 0.8)" /><path d={p.d} fill={`url(#${hachura})`} /><path d={tremido(p.d, 1, s)} fill="none" stroke={TINTA.C} strokeWidth={fio * 0.8} /></g>;
      case 'metal':
        if (dir === 'A') return <path key={i} d={p.d} fill="#a9a59e" stroke={TINTA.A} strokeWidth={fio * 0.7} />;
        if (dir === 'B') return <path key={i} d={p.d} fill={gradiente('#a9a59e')} />;
        return <g key={i}><path d={p.d} fill="#b7b1a6" transform="translate(1 1)" /><path d={tremido(p.d, 1, s)} fill="none" stroke={TINTA.C} strokeWidth={fio * 0.8} /></g>;
      case 'linha':
        if (dir === 'B') return <path key={i} d={p.d} fill="none" stroke="#000" strokeOpacity={0.2} strokeWidth={(p.larg ?? 1) * fio * 0.8} strokeLinecap="round" />;
        return <path key={i} d={dir === 'C' ? tremido(p.d, 1, s) : p.d} fill="none" stroke={TINTA[dir]} strokeWidth={(p.larg ?? 1) * fio * (dir === 'C' ? 0.9 : 0.75)} strokeLinecap="round" strokeLinejoin="round" />;
      case 'luz':
        if (dir === 'B') return <path key={i} d={p.d} fill={p.cor} filter={undefined} opacity={0.95} />;
        return <path key={i} d={dir === 'C' ? tremido(p.d, 0.6, s) : p.d} fill={p.cor} stroke={TINTA[dir]} strokeWidth={fio * 0.5} />;
      case 'circulo':
        if (dir === 'B') return <circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill={gradiente(p.cor)} />;
        return <circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill={p.cor} stroke={contornoDe(dir, p.cor)} strokeWidth={fio * 0.5} />;
      case 'grupo': return <g key={i} transform={p.t}>{desenhar(p.pecas)}</g>;
      case 'texto': return <text key={i} x={p.x} y={p.y} fontSize={p.tam} fill={p.cor} textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontWeight={700} letterSpacing={p.tam * 0.18} transform={dir === 'C' ? `rotate(-0.6 ${p.x} ${p.y})` : undefined}>{p.texto}</text>;
      case 'pneu': {
        const { cx, cy, r, aro } = p;
        if (aro === 'bicicleta') {
          const raios = Array.from({ length: 12 }, (_, j) => { const g = (j / 12) * Math.PI * 2; return `M${cx} ${cy}L${f(cx + Math.cos(g) * (r - 3))} ${f(cy + Math.sin(g) * (r - 3))}`; }).join('');
          return <g key={i}><circle cx={cx} cy={cy} r={r - 1.4} fill="none" stroke="#24211e" strokeWidth={3} /><circle cx={cx} cy={cy} r={r - 3.4} fill="none" stroke="#a9a59e" strokeWidth={1} /><path d={raios} stroke="#8d8a85" strokeWidth={0.5} /><circle cx={cx} cy={cy} r={2.2} fill="#8d8a85" /></g>;
        }
        const pneu = '#25221f';
        const aroCor = dir === 'C' ? '#d6d0c4' : '#c9c4bb';
        const cravos = aro === 'cravos' ? <circle cx={cx} cy={cy} r={r - 0.8} fill="none" stroke="#3c3833" strokeWidth={2} strokeDasharray="2.4 2" /> : null;
        const liga = aro === 'liga' ? <path d={Array.from({ length: 5 }, (_, j) => { const g = (j / 5) * Math.PI * 2 - Math.PI / 2; return `M${cx} ${cy}L${f(cx + Math.cos(g) * r * 0.55)} ${f(cy + Math.sin(g) * r * 0.55)}`; }).join('')} stroke={escurecer(aroCor, 0.35)} strokeWidth={r * 0.12} strokeLinecap="round" /> : null;
        if (dir === 'B') return <g key={i}><circle cx={cx} cy={cy} r={r} fill={pneu} /><circle cx={cx} cy={cy} r={r * 0.6} fill={gradiente(aroCor)} />{liga}{cravos}<circle cx={cx} cy={cy} r={r * 0.16} fill="#7d7973" /></g>;
        return <g key={i}><circle cx={cx} cy={cy} r={r} fill={pneu} stroke={TINTA[dir]} strokeWidth={fio * 0.6} />{cravos}<circle cx={cx} cy={cy} r={r * 0.6} fill={aroCor} stroke={TINTA[dir]} strokeWidth={fio * 0.5} />{liga}<circle cx={cx} cy={cy} r={r * 0.16} fill="#5d5954" />{dir === 'C' && <path d={tremido(`M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`, 1.2, s)} fill="none" stroke={TINTA.C} strokeWidth={fio} />}</g>;
      }
    }
  });
  const partes = desenhar(a.pecas);
  const sombra = a.sombra && chao
    ? dir === 'B' ? <ellipse cx={a.sombra[0]} cy={a.chao + 1} rx={a.sombra[1]} ry={4} fill="#000" opacity={0.16} />
      : dir === 'C' ? <path d={tremido(`M${a.sombra[0] - a.sombra[1] - 6} ${a.chao + 1}h${2 * a.sombra[1] + 12}`, 1.5, 3)} stroke={TINTA.C} strokeWidth={fio * 0.7} opacity={0.7} fill="none" />
        : <path d={`M${a.sombra[0] - a.sombra[1]} ${a.chao + 0.5}h${2 * a.sombra[1]}`} stroke={TINTA.A} strokeWidth={fio * 0.5} opacity={0.35} />
    : null;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={largura} height={altura} role="img" aria-label={rotulo} className={`proposta proposta--${dir}`}>
      {defs.length > 0 && <defs>{defs}</defs>}
      {sombra}
      {partes}
    </svg>
  );
}

/** As dez amostras pedidas, na mesma ordem para as três direções. */
export const AMOSTRAS: { id: string; nome: string; a: () => Amostra }[] = [
  { id: 'compacto', nome: 'Carro popular compacto', a: () => carro(PERFIS.compacto, '#b8352b') },
  { id: 'esportivo', nome: 'Carro esportivo', a: () => carro(PERFIS.esportivo, '#e2b23a') },
  { id: 'picape', nome: 'Picape', a: () => carro(PERFIS.picape, '#e8e5de') },
  { id: 'bicicleta', nome: 'Bicicleta urbana', a: () => bicicletaUrbana('#3d6b8f') },
  { id: 'moto', nome: 'Motocicleta', a: () => motocicleta('#1f4e7a') },
  { id: 'cachorro', nome: 'Cachorro', a: () => cachorro('#b07a45') },
  { id: 'gato', nome: 'Gato', a: () => gato('#3a3633') },
  { id: 'violao', nome: 'Violão', a: () => violao() },
  { id: 'casa', nome: 'Casa', a: () => casa() },
  { id: 'concessionaria', nome: 'Fachada de concessionária', a: () => concessionaria() }
];
