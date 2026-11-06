/**
 * VIDA 12.9 — A ARTE DOS DESENHOS NOVOS (`motor/dados/tatuagens129`). Mesma linguagem e mesma caixa nativa dos de sempre
 * (`ui/avatar/tatuagens`): o lado maior mede 20, o contorno vem em `tinta` e cada cor passa por `cor` (que a leva para a
 * tinta escolhida: colorida, cinza ou só preto). Todo desenho tem contorno — fica legível também em preto.
 *
 * Cultura pop: desenhos ORIGINAIS que lembram a obra (o objeto, o bicho, o emblema reinterpretado), nunca a arte oficial
 * nem o logotipo copiado. Chamado por `desenho()` quando o id não é um dos de sempre.
 */
import type { ReactNode } from 'react';

type Cor = (hex: string) => string;
export interface PincelDaTatuagem { tinta: string; cor: Cor; traco: number; W: number; H: number; texto?: string; espelhado?: boolean }

const VERMELHO = '#b8332e', VERDE = '#3f7a45', AMARELO = '#d9a520', AZUL = '#2f5e8a', LARANJA = '#d8742a', ROSA = '#d36a8a', MARROM = '#6b4a2a', CREME = '#efe2c4', ROXO = '#6b4f8f', TURQUESA = '#2f8f8a';
const CINZA1 = '#4a4f55', CINZA2 = '#7d838a', CINZA3 = '#b3b8bd', BRANCO = '#f2ede0';
const OURO = '#e0b43c', CELESTE = '#7cc4e4', PALHA = '#e6c46a', VINHO = '#7e2846', VERDE_CLARO = '#7fbf5a', PELE_ROSA = '#c97a6a';

const f = (n: number) => Math.round(n * 100) / 100;
/** Estrela de n pontas. */
const estrela = (cx: number, cy: number, r: number, n = 5, ri = r * 0.45, giro = -Math.PI / 2) =>
  'M' + Array.from({ length: n * 2 }, (_, k) => { const a = giro + (k * Math.PI) / n, q = k % 2 ? ri : r; return `${f(cx + Math.cos(a) * q)} ${f(cy + Math.sin(a) * q)}`; }).join(' L') + ' Z';
/** Espiral de dentro para fora. */
const espiral = (cx: number, cy: number, r: number, voltas = 2.2, giro = 0) =>
  'M' + Array.from({ length: Math.round(voltas * 16) + 1 }, (_, k) => { const t = k / 16 * Math.PI * 2, q = (r * k) / (voltas * 16); return `${f(cx + Math.cos(t + giro) * q)} ${f(cy + Math.sin(t + giro) * q)}`; }).join(' L');
/** Bolinha felpuda (n espinhos). */
const felpa = (cx: number, cy: number, r: number, n = 18) =>
  'M' + Array.from({ length: n * 2 }, (_, k) => { const a = (k * Math.PI) / n, q = k % 2 ? r : r * 1.22; return `${f(cx + Math.cos(a) * q)} ${f(cy + Math.sin(a) * q)}`; }).join(' L') + ' Z';
/** Ondinhas numa linha. */
const ondas = (x0: number, x1: number, y: number, a = 0.8, n = 4) => {
  const w = (x1 - x0) / n;
  return `M${x0} ${y}` + Array.from({ length: n }, () => ` q${f(w / 4)} ${-a} ${f(w / 2)} 0 t${f(w / 2)} 0`).join('');
};
/** Pseudo-aleatório estável (pontilhismo, respingos). */
const sorte = (k: number) => { const x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

export function desenho129(id: string, p: PincelDaTatuagem): ReactNode | undefined {
  const { tinta, cor, traco, W, H, texto, espelhado } = p;
  const s = (w: number) => w * traco;
  const L = (w: number) => ({ fill: 'none', stroke: tinta, strokeWidth: s(w), strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const });
  const C = (w: number) => ({ stroke: tinta, strokeWidth: s(w), strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const });
  const letra = (t: string, x: number, y: number, tam: number, o: { peso?: number; fonte?: string; larg?: number; fill?: string; estilo?: string } = {}) => (
    <g transform={espelhado ? `translate(${W} 0) scale(-1 1)` : undefined}>
      <text x={espelhado ? W - x : x} y={y} textAnchor="middle" fontSize={tam} fontFamily={o.fonte ?? "Georgia, 'Times New Roman', serif"} fontWeight={o.peso ?? 700} fontStyle={o.estilo} fill={o.fill ?? tinta}
        {...(o.larg ? { textLength: o.larg, lengthAdjust: 'spacingAndGlyphs' } : {})}>{t}</text>
    </g>
  );
  switch (id) {
    /* ================================================================ CULTURA POP */
    /* ---------------- Pokémon */
    case 'esfera_de_captura': return <g>
      <path d="M1.4 10 A8.6 8.6 0 0 1 18.6 10 Z" fill={cor(VERMELHO)} /><path d="M1.4 10 A8.6 8.6 0 0 0 18.6 10 Z" fill={cor(BRANCO)} />
      <path d="M4 6.4 Q5.6 3.6 9 3" fill="none" stroke={cor(BRANCO)} strokeWidth={s(0.9)} strokeLinecap="round" opacity={0.7} />
      <circle cx={10} cy={10} r={8.6} {...L(1.1)} /><path d="M1.4 10 H7.2 M12.8 10 H18.6" {...L(1.3)} />
      <circle cx={10} cy={10} r={2.8} fill={cor(BRANCO)} {...C(1.1)} /><circle cx={10} cy={10} r={1.2} {...L(0.6)} />
      <path d="M14.2 13.4 l1.6 1.6 M15.4 13 l0.6 0.8" {...L(0.35)} />
    </g>;
    case 'tres_parceiros': { const y = H / 2; const r = 3.4; return <g>
      {[3.7, 10, 16.3].map((x, k) => <circle key={k} cx={x} cy={y} r={r} fill={cor(BRANCO)} {...C(0.8)} />)}
      <path d={`M3.7 ${y + 2.2} Q1.6 ${y} 3.7 ${y - 2.3} Q5.8 ${y} 3.7 ${y + 2.2} Z`} fill={cor(VERDE)} {...C(0.5)} /><path d={`M3.7 ${y + 2.2} V${y - 1}`} {...L(0.35)} />
      <path d={`M10 ${y + 2.3} Q8 ${y + 1.6} 8.6 ${y - 0.4} Q9 ${y + 0.4} 9.6 ${y - 0.2} Q9.4 ${y - 1.4} 10.4 ${y - 2.4} Q10.8 ${y - 0.8} 11.6 ${y - 0.4} Q12.2 ${y + 1.8} 10 ${y + 2.3} Z`} fill={cor(LARANJA)} {...C(0.5)} />
      <path d={`M10 ${y + 2} Q9.2 ${y + 1.2} 10 ${y + 0.2} Q10.8 ${y + 1.2} 10 ${y + 2} Z`} fill={cor(AMARELO)} />
      <path d={`M16.3 ${y - 2.4} Q18.2 ${y + 0.2} 17.8 ${y + 1} A1.6 1.6 0 0 1 14.8 ${y + 1} Q14.4 ${y + 0.2} 16.3 ${y - 2.4} Z`} fill={cor(AZUL)} {...C(0.5)} />
      <path d={`M15.6 ${y + 0.6} Q15.6 ${y + 1.5} 16.4 ${y + 1.7}`} fill="none" stroke={cor(BRANCO)} strokeWidth={s(0.35)} />
    </g>; }
    /* ---------------- Naruto */
    case 'kunai': { const c = W / 2; return <g>
      <path d={`M${c} 0.6 L${c + 2.7} 7.4 L${c} 9.6 L${c - 2.7} 7.4 Z`} fill={cor(CINZA3)} {...C(0.7)} /><path d={`M${c} 1.4 V9`} {...L(0.35)} />
      <rect x={c - 0.9} y={9.6} width={1.8} height={6.6} fill={tinta} />
      {[10.6, 11.9, 13.2, 14.5].map(y => <path key={y} d={`M${c - 0.9} ${y + 0.7} L${c + 0.9} ${y}`} stroke={cor(BRANCO)} strokeWidth={s(0.3)} />)}
      <circle cx={c} cy={17.7} r={1.5} {...L(0.7)} />
      <path d={`M${c + 0.9} 15 Q${W - 0.4} 15.6 ${W - 0.6} 18 Q${W - 1} 19.6 ${W - 0.2} 19.6`} {...L(0.35)} />
    </g>; }
    case 'olho_tres_virgulas': { const cy = H / 2; const tom = (a: number) => { const x = 10 + Math.cos(a) * 2.5, y = cy + Math.sin(a) * 2.5; const x2 = 10 + Math.cos(a - 0.9) * 2.5, y2 = cy + Math.sin(a - 0.9) * 2.5; return <g key={a}><circle cx={f(x)} cy={f(y)} r={0.75} fill={tinta} /><path d={`M${f(x)} ${f(y)} A2.5 2.5 0 0 0 ${f(x2)} ${f(y2)}`} {...L(0.45)} /></g>; }; return <g>
      <path d={`M0.8 ${cy} Q10 ${cy - 7.6} 19.2 ${cy} Q10 ${cy + 7.6} 0.8 ${cy} Z`} fill={cor(BRANCO)} {...C(0.9)} />
      <circle cx={10} cy={cy} r={4.3} fill={cor(VERMELHO)} {...C(0.6)} /><circle cx={10} cy={cy} r={2.5} {...L(0.3)} /><circle cx={10} cy={cy} r={1} fill={tinta} />
      {[-Math.PI / 2, Math.PI / 6, (5 * Math.PI) / 6].map(tom)}
      <path d={`M2.4 ${cy - 2.6} Q10 ${cy - 8.4} 17.6 ${cy - 2.6}`} {...L(0.6)} />
    </g>; }
    case 'folha_espiral': return <g>
      <path d="M2.6 17.6 Q1.4 6.4 14.6 2.4 Q18.4 1.6 17.6 5 Q15.8 16.6 2.6 17.6 Z" fill={cor(BRANCO)} {...C(1)} />
      <path d="M2.6 17.6 L1 19.4" {...L(1)} />
      <path d={espiral(10, 10, 4.6, 2.4, Math.PI)} {...L(0.85)} />
      <path d="M14.4 5.6 L15.8 4.2" {...L(0.6)} />
    </g>;
    /* ---------------- Dragon Ball */
    case 'esfera_quatro_estrelas': return <g>
      <circle cx={10} cy={10} r={8.6} fill={cor(LARANJA)} {...C(1)} />
      <circle cx={10} cy={10} r={6.8} fill={cor(AMARELO)} opacity={0.45} />
      {[[10, 6.4], [6.4, 10.2], [13.6, 10.2], [10, 14]].map(([x, y], k) => <path key={k} d={estrela(x, y, 1.9)} fill={cor(VERMELHO)} {...C(0.35)} />)}
      <path d="M4.6 6.2 Q6 3.6 9 3.2" fill="none" stroke={cor(BRANCO)} strokeWidth={s(1)} strokeLinecap="round" />
    </g>;
    case 'nuvem_voadora': return <g>
      <path d="M3 8.4 Q0.4 7.8 1.4 5.4 Q2 3.6 4.4 4.2 Q5 1.4 8.2 2 Q10.4 0.4 12.8 2 Q16 1.2 16.8 4 Q19.6 4.4 19 7 Q18.4 9 15.6 8.8 Q13.4 10.6 10.2 9.6 Q7.2 10.8 5 9.4 Q4 9.4 3 8.4 Z" fill={cor(AMARELO)} {...C(0.8)} />
      <path d={espiral(6.6, 6, 1.6, 1.6)} {...L(0.4)} /><path d={espiral(11.4, 5.4, 1.8, 1.6, 2)} {...L(0.4)} /><path d={espiral(15.4, 6.4, 1.4, 1.5, 1)} {...L(0.4)} />
      <path d="M3 8.4 Q1 9.6 0.6 10.6 M5 9.4 Q3.6 10.4 3.4 11" {...L(0.5)} />
    </g>;
    /* ---------------- One Piece */
    case 'chapeu_de_palha': return <g>
      <ellipse cx={10} cy={9.4} rx={9.4} ry={3.4} fill={cor(PALHA)} {...C(0.9)} />
      <path d="M4.4 8.8 Q4.2 1.8 10 1.6 Q15.8 1.8 15.6 8.8 Q10 10.2 4.4 8.8 Z" fill={cor(PALHA)} {...C(0.9)} />
      <path d="M4.5 6.4 Q10 7.8 15.5 6.4 L15.6 8.8 Q10 10.2 4.4 8.8 Z" fill={cor(VERMELHO)} {...C(0.6)} />
      {[2.4, 5, 15, 17.6].map(x => <path key={x} d={`M${x} ${x < 10 ? 10.2 : 10.2} l${x < 10 ? -0.6 : 0.6} 0.9`} {...L(0.3)} />)}
      <path d="M6.6 3.4 l0.8 1.4 M9.4 2.6 l0.4 1.6 M12.6 3 l-0.4 1.5" {...L(0.3)} />
    </g>;
    case 'fruta_espiral': { const cx = W / 2; return <g>
      <path d={`M${cx} 4.6 Q${W - 0.4} 4.6 ${W - 0.6} 12 Q${W - 1} 19.4 ${cx} 19.4 Q1 19.4 0.6 12 Q0.4 4.6 ${cx} 4.6 Z`} fill={cor(ROXO)} {...C(0.9)} />
      {[[cx - 3.4, 8.8], [cx + 3.4, 9.4], [cx, 13.2], [cx - 4.2, 15], [cx + 4, 15.6]].map(([x, y], k) => <path key={k} d={espiral(x, y, 1.8, 1.7, k)} {...L(0.45)} />)}
      <path d={`M${cx} 4.8 Q${cx - 0.4} 2.4 ${cx + 1.6} 1.6 Q${cx + 3.4} 1.4 ${cx + 2.6} 3 Q${cx + 1.8} 3.6 ${cx + 1.4} 2.6`} {...L(0.6)} />
      <path d={`M${cx + 0.4} 3.6 Q${cx - 2.6} 1 ${cx - 4} 2.6 Q${cx - 2} 4.2 ${cx + 0.4} 3.6 Z`} fill={cor(VERDE)} {...C(0.4)} />
    </g>; }
    case 'cartaz_procurado': return <g>
      <path d={`M0.6 0.8 H${W - 0.6} V${H - 2} L${W - 2} ${H - 0.6} H0.6 Z`} fill={cor(CREME)} {...C(0.7)} />
      {letra('PROCURADO', W / 2, 3.6, 2.6, { larg: W - 2.4 })}
      <rect x={2.2} y={5} width={W - 4.4} height={8.6} fill={cor(BRANCO)} {...C(0.45)} />
      <ellipse cx={W / 2} cy={10.6} rx={4.4} ry={1.5} fill={cor(PALHA)} {...C(0.45)} />
      <path d={`M${W / 2 - 2.6} 10.4 Q${W / 2 - 2.6} 6.6 ${W / 2} 6.6 Q${W / 2 + 2.6} 6.6 ${W / 2 + 2.6} 10.4 Z`} fill={cor(PALHA)} {...C(0.45)} />
      <path d={`M${W / 2 - 2.6} 9.2 Q${W / 2} 10 ${W / 2 + 2.6} 9.2 V10.4 Q${W / 2} 11.2 ${W / 2 - 2.6} 10.4 Z`} fill={cor(VERMELHO)} />
      {letra('VIVO OU MORTO', W / 2, 15.6, 1.3, { larg: W - 4, peso: 600 })}
      {letra('฿ 3.000.000.000', W / 2, 18, 1.6, { larg: W - 3.4 })}
      <path d={`M${W - 0.6} ${H - 2} L${W - 2} ${H - 2} L${W - 2} ${H - 0.6}`} {...L(0.4)} />
    </g>;
    /* ---------------- Studio Ghibli */
    case 'espirito_da_floresta': { const c = W / 2; return <g>
      <path d={`M${c - 6} 19.4 Q${c - 8} 12 ${c - 4.6} 7.4 L${c - 4.4} 3.4 L${c - 2.8} 6.4 Q${c} 5.8 ${c + 2.8} 6.4 L${c + 4.4} 3.4 L${c + 4.6} 7.4 Q${c + 8} 12 ${c + 6} 19.4 Z`} fill={cor(CINZA2)} {...C(0.8)} />
      <ellipse cx={c} cy={14.6} rx={4.2} ry={4.2} fill={cor(CREME)} {...C(0.4)} />
      {[[c - 1.8, 12.4], [c, 12], [c + 1.8, 12.4], [c - 0.9, 14], [c + 0.9, 14]].map(([x, y], k) => <path key={k} d={`M${x - 0.5} ${y} l0.5 0.5 l0.5 -0.5`} {...L(0.35)} />)}
      <circle cx={c - 2} cy={9.2} r={1} fill={cor(BRANCO)} {...C(0.35)} /><circle cx={c + 2} cy={9.2} r={1} fill={cor(BRANCO)} {...C(0.35)} />
      <circle cx={c - 2} cy={9.2} r={0.4} fill={tinta} /><circle cx={c + 2} cy={9.2} r={0.4} fill={tinta} />
      <path d={`M${c - 0.5} 9.8 L${c + 0.5} 9.8 L${c} 10.3 Z`} fill={tinta} /><path d={`M${c - 2.8} 10.6 Q${c} 11.6 ${c + 2.8} 10.6`} {...L(0.35)} />
      <path d={`M${c - 6.6} 10.4 l-1 -0.4 M${c - 6.8} 11.2 l-1.2 0 M${c + 6.6} 10.4 l1 -0.4 M${c + 6.8} 11.2 l1.2 0`} {...L(0.3)} />
      <path d={`M${c} 6 Q${c - 3} 4 ${c - 1} 1 Q${c + 2.6} 2.2 ${c} 6 Z`} fill={cor(VERDE)} {...C(0.45)} /><path d={`M${c} 6 Q${c - 0.6} 3.6 ${c - 1} 1.4`} {...L(0.3)} />
      {[[1, 2], [2.4, 6], [W - 1.2, 1.4], [W - 0.6, 6.8]].map(([x, y], k) => <path key={k} d={`M${x} ${y} l-0.3 1.2`} {...L(0.3)} />)}
    </g>; }
    case 'espirito_sem_rosto': { const c = W / 2 - 0.6; return <g>
      <path d={`M${c} 0.8 Q${c + 4.4} 0.8 ${c + 4.4} 6 L${c + 5} 19.4 L${c - 5} 19.4 L${c - 4.4} 6 Q${c - 4.4} 0.8 ${c} 0.8 Z`} fill={tinta} />
      <ellipse cx={c} cy={6} rx={2.8} ry={3.6} fill={cor(BRANCO)} />
      <path d={`M${c - 1.9} 5 Q${c - 1.2} 4.4 ${c - 0.5} 5 M${c + 0.5} 5 Q${c + 1.2} 4.4 ${c + 1.9} 5`} {...L(0.35)} />
      <path d={`M${c - 1.4} 3.6 l0.3 0.8 l0.3 -0.8 Z M${c + 0.8} 3.6 l0.3 0.8 l0.3 -0.8 Z M${c - 1.4} 6.4 l0.3 -0.8 l0.3 0.8 Z M${c + 0.8} 6.4 l0.3 -0.8 l0.3 0.8 Z`} fill={cor(CINZA1)} />
      <path d={`M${c - 0.6} 8 H${c + 0.6}`} {...L(0.35)} />
      <path d={`M${c + 3.6} 12 Q${c + 5.2} 12.6 ${W - 0.8} 11.6`} stroke={tinta} strokeWidth={s(1.3)} strokeLinecap="round" fill="none" />
      <path d={`M${W - 1.6} 10 L${W - 0.4} 10.4 L${W - 0.6} 11.4 L${W - 1.8} 11.2 Z`} fill={cor(AMARELO)} {...C(0.35)} />
    </g>; }
    case 'fuligens': { const bs: [number, number, number, string][] = [[4, 8.2, 2.8, ROSA], [10.2, 8.8, 3.1, AMARELO], [16.2, 7.8, 2.6, AZUL]]; return <g>
      {bs.map(([x, y, r, c], k) => <g key={k}>
        <path d={felpa(x, y, r)} fill={tinta} />
        <circle cx={x - r * 0.35} cy={y - r * 0.1} r={r * 0.32} fill={cor(BRANCO)} /><circle cx={x + r * 0.35} cy={y - r * 0.1} r={r * 0.32} fill={cor(BRANCO)} />
        <circle cx={x - r * 0.32} cy={y - r * 0.05} r={r * 0.13} fill={tinta} /><circle cx={x + r * 0.38} cy={y - r * 0.05} r={r * 0.13} fill={tinta} />
        <path d={`M${x - r * 0.6} ${y - r * 0.9} L${x - r * 0.2} ${y - r * 1.5} M${x + r * 0.6} ${y - r * 0.9} L${x + r * 0.2} ${y - r * 1.5}`} {...L(0.4)} />
        <path d={estrela(x, y - r * 1.9, 0.9, 6, 0.5)} fill={cor(c)} {...C(0.25)} />
      </g>)}
    </g>; }
    case 'vassoura_gato': return <g>
      <path d="M0.8 9.6 L13.4 4.6" stroke={tinta} strokeWidth={s(1.3)} strokeLinecap="round" /><path d="M0.8 9.6 L13.4 4.6" stroke={cor(MARROM)} strokeWidth={s(0.6)} strokeLinecap="round" />
      <path d="M13 4 L19.6 0.8 Q19 4.4 19.8 7.8 L13.8 5.6 Z" fill={cor(PALHA)} {...C(0.6)} />
      <path d="M14.6 4.2 L19 2.2 M15 4.9 L19.4 4.6 M14.8 5.4 L19.2 6.6" {...L(0.3)} />
      <path d="M12.8 3.4 Q11.4 2 11.6 4.4 Q11.6 6.8 13 5.6 M13.6 5.6 Q14.4 7.4 12.6 7.6" fill={cor(VERMELHO)} {...C(0.4)} />
      <path d="M4.6 7.8 Q4 5.4 5.2 4.6 L5 3 L6 3.8 L6.8 3.8 L7.6 3 L7.6 4.6 Q8.8 5.8 8 7.6 Q6.4 7.2 4.6 7.8 Z" fill={tinta} />
      <path d="M4.8 7.6 Q2.6 7.2 2.8 5.2 Q3.2 4.2 4 4.8" {...L(0.6)} />
      <circle cx={5.8} cy={5.2} r={0.3} fill={cor(AMARELO)} /><circle cx={7.2} cy={5.2} r={0.3} fill={cor(AMARELO)} />
      <path d="M6 6.6 Q6.6 7.4 7.4 6.6" fill={cor(VERMELHO)} {...C(0.25)} />
    </g>;
    /* ---------------- Breaking Bad */
    case 'chapeu_e_oculos': return <g>
      <path d="M4.8 7.4 L5.4 2.4 Q10 1 14.6 2.4 L15.2 7.4 Z" fill={tinta} />
      <path d="M5.1 5.6 Q10 6.6 14.9 5.6 L15.1 7.2 Q10 8.2 4.9 7.2 Z" fill={cor(CINZA2)} />
      <path d="M0.8 8.4 Q10 5.4 19.2 8.4 Q10 10.6 0.8 8.4 Z" fill={tinta} />
      <rect x={3.2} y={10.8} width={5.8} height={3.4} rx={0.9} {...L(0.9)} /><rect x={11} y={10.8} width={5.8} height={3.4} rx={0.9} {...L(0.9)} />
      <path d="M9 11.8 Q10 11 11 11.8 M3.2 11.4 L1.2 10.6 M16.8 11.4 L18.8 10.6" {...L(0.7)} />
    </g>;
    case 'cristais_azuis': { const cs: [string, string][] = [
      ['M3 17 L5 8 L8.4 6.6 L9.2 17 Z', CELESTE], ['M7.4 17.6 L9 4 L12.4 1.6 L13.2 17.6 Z', AZUL], ['M11.6 17.4 L13 9 L16.8 7 L17.6 17.4 Z', CELESTE],
      ['M1.2 18.6 L2.6 13.6 L5.4 13.4 L6.2 18.6 Z', AZUL], ['M14.6 18.8 L15.4 14.6 L18.6 13.8 L18.8 18.8 Z', AZUL]];
      return <g>{cs.map(([d, c], k) => <path key={k} d={d} fill={cor(c)} {...C(0.6)} />)}
        <path d="M9 4 L10.6 17.6 M5 8 L6.6 17 M13 9 L14.6 17.4" stroke={cor(BRANCO)} strokeWidth={s(0.35)} opacity={0.8} />
        <path d="M0.6 19.2 H19.4" {...L(0.6)} />
      </g>; }
    case 'trailer_deserto': return <g>
      <circle cx={16.4} cy={3} r={2.2} fill={cor(AMARELO)} {...C(0.5)} />
      <path d="M0.4 11 Q6 10 10 10.8 Q15 11.6 19.6 10.6 V12.4 H0.4 Z" fill={cor(PALHA)} {...C(0.5)} />
      <rect x={1.4} y={4.4} width={10.4} height={5.6} rx={1.2} fill={cor(CREME)} {...C(0.7)} />
      <path d="M1.5 7.4 H11.7" stroke={cor(MARROM)} strokeWidth={s(0.9)} />
      <rect x={2.6} y={5.2} width={2} height={1.4} {...L(0.4)} /><rect x={8.4} y={5.2} width={2.4} height={1.4} {...L(0.4)} /><rect x={5.6} y={5.4} width={1.8} height={4.4} {...L(0.4)} />
      <circle cx={4} cy={10.2} r={1.1} fill={tinta} /><path d="M11.8 9.2 H13.2" {...L(0.5)} />
      <path d="M15.6 10.6 V5.4 Q15.6 4.6 16.2 4.6 Q16.8 4.6 16.8 5.4 V10.8 M15.6 8.4 H14.6 V6.6 M16.8 7.4 H17.8 V5.8" fill="none" stroke={tinta} strokeWidth={s(1.2)} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15.6 10.6 V5.4 Q15.6 4.6 16.2 4.6 Q16.8 4.6 16.8 5.4 V10.8 M15.6 8.4 H14.6 V6.6 M16.8 7.4 H17.8 V5.8" fill="none" stroke={cor(VERDE)} strokeWidth={s(0.5)} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 11 V8.4 M19 9.6 H18.4 V8.8" {...L(0.7)} />
    </g>;
    /* ---------------- Game of Thrones */
    case 'brasao_lobo': return <g>
      <path d={`M0.8 0.8 H${W - 0.8} V9 Q${W - 0.8} 16 ${W / 2} 19.4 Q0.8 16 0.8 9 Z`} {...L(1)} />
      <path d={`M1.8 1.8 H${W - 1.8} V9 Q${W - 1.8} 15.2 ${W / 2} 18.2 Q1.8 15.2 1.8 9 Z`} {...L(0.3)} />
      <path d="M4.8 17 L5.2 15.8 L4.2 15.2 L5.2 14.4 L4.4 13.6 L5.4 12.8 Q5.2 11.6 4.6 10.6 L2.2 7.8 L5 8.4 L2 5.6 L2.6 4.8 Q4.6 4.2 6.2 4.4 L7.4 1.6 L8.4 2 L9 4.4 Q10.6 5.2 11.2 6.4 L12.8 7.2 L12 8 L13.4 9.4 L12.6 10.2 L13.6 11.8 L12.6 12.6 L13.2 14.4 L12 15 L12.2 17 Q8.4 18.2 4.8 17 Z" fill={tinta} />
      <path d="M6.4 5.6 l1.2 0.1" stroke={cor(BRANCO)} strokeWidth={s(0.5)} strokeLinecap="round" /><path d="M7.8 2.6 L8.2 4" stroke={cor(CINZA2)} strokeWidth={s(0.35)} strokeLinecap="round" />
      <path d="M7 12 l0.8 1.2 M8.4 12.6 l0.6 1.2 M9.8 12.4 l0.4 1.2" stroke={cor(BRANCO)} strokeWidth={s(0.3)} strokeLinecap="round" />
    </g>;
    case 'dragao_tres_cabecas': { const asa = (k: 1 | -1) => `M${10 + k * 1.4} 11 Q${10 + k * 5} 4 ${10 + k * 9.4} 4.4 Q${10 + k * 8.4} 6.4 ${10 + k * 9} 8 Q${10 + k * 7.4} 8 ${10 + k * 7.6} 10 Q${10 + k * 6} 9.6 ${10 + k * 5.6} 11.6 Q${10 + k * 4} 11 ${10 + k * 2.4} 13 Z`; return <g>
      <path d={asa(-1)} fill={cor(VERMELHO)} {...C(0.6)} /><path d={asa(1)} fill={cor(VERMELHO)} {...C(0.6)} />
      <path d="M8.4 9.4 L1.4 4.4 M11.6 9.4 L18.6 4.4 M9.2 9.6 L5 8.6 M10.8 9.6 L15 8.6" {...L(0.3)} />
      <path d="M7.4 9.8 Q4.6 6 5.6 3.4 M10 9 Q9.6 5 10 2 M12.6 9.8 Q15.4 6 14.4 3.4" fill="none" stroke={tinta} strokeWidth={s(1.5)} strokeLinecap="round" />
      {[[5.6, 3.4, -1], [10, 2, 0], [14.4, 3.4, 1]].map(([x, y, k], j) => <path key={j} d={`M${x - 1} ${y + 0.4} L${x + k * 0.4} ${y - 1.6} L${x + 1} ${y + 0.4} Q${x} ${y + 1} ${x - 1} ${y + 0.4} Z M${x - 0.6} ${y - 0.6} L${x - 1.4} ${y - 1.8} M${x + 0.6} ${y - 0.6} L${x + 1.4} ${y - 1.8}`} fill={tinta} {...C(0.4)} />)}
      <path d="M10 8.6 Q12.4 10.6 11.6 14 Q10.6 16.6 8.4 17 Q6.4 17.6 7.2 19.2 Q9 19.8 10.4 18.6" fill="none" stroke={tinta} strokeWidth={s(1.6)} strokeLinecap="round" />
      <ellipse cx={10} cy={12} rx={2.4} ry={3} fill={tinta} />
    </g>; }
    case 'trono_de_espadas': { const c = W / 2; return <g>
      {Array.from({ length: 11 }, (_, k) => { const a = -Math.PI / 2 + (k - 5) * 0.16, l = 9 - Math.abs(k - 5) * 0.55; const x = c + Math.cos(a) * l, y = 10 + Math.sin(a) * l;
        return <g key={k}><path d={`M${c + (k - 5) * 0.5} 10 L${f(x)} ${f(y)}`} {...L(0.55)} /><path d={`M${f(x - 0.6)} ${f(y + 1.2)} L${f(x + 0.6)} ${f(y + 1.2)}`} {...L(0.35)} /></g>; })}
      <path d={`M${c - 6} 9.6 H${c + 6} V12 H${c - 6} Z`} fill={cor(CINZA2)} {...C(0.6)} />
      <path d={`M${c - 7.6} 9 L${c - 4} 9.4 M${c + 7.6} 9 L${c + 4} 9.4`} {...L(0.7)} />
      <path d={`M${c - 6} 12 L${c - 7.2} 19.4 H${c + 7.2} L${c + 6} 12 Z`} fill={tinta} />
      {[-4, -1.4, 1.4, 4].map(x => <path key={x} d={`M${c + x} 13 V18.4`} stroke={cor(CINZA3)} strokeWidth={s(0.3)} />)}
      <path d={`M${c - 7.8} 19.4 H${c + 7.8}`} {...L(0.8)} />
    </g>; }
    /* ---------------- Stranger Things */
    case 'luzes_do_alfabeto': { const cs = [VERMELHO, AZUL, AMARELO, VERDE, ROSA, LARANJA, AZUL]; return <g>
      <path d={`M0.4 1 Q5 3.2 10 1.4 Q15 3.2 19.6 1`} {...L(0.4)} />
      {cs.map((c, k) => { const x = 1.6 + k * 2.8, y = 1.6 + Math.sin(k * 1.3) * 0.6 + (k % 3 === 1 ? 0.6 : 0); return <g key={k}><rect x={x - 0.4} y={y - 0.2} width={0.8} height={0.7} fill={tinta} /><ellipse cx={x} cy={y + 1.5} rx={0.85} ry={1.15} fill={cor(c)} {...C(0.3)} /></g>; })}
      {['C', 'O', 'R', 'R', 'A'].map((l, k) => <g key={k}>{letra(l, 2.4 + k * 3.8, H - 0.5, 3.2, { fonte: "'Comic Sans MS', 'Segoe Print', cursive", peso: 400 })}</g>)}
    </g>; }
    case 'criatura_de_petalas': { const c = W / 2, cy = 7.6; return <g>
      <path d={`M${c - 2.2} 11.6 Q${c - 2.6} 15 ${c - 6.6} 17 Q${c - 7.6} 18.6 ${c - 7.6} 19.6 H${c + 7.6} Q${c + 7.6} 18.6 ${c + 6.6} 17 Q${c + 2.6} 15 ${c + 2.2} 11.6 Z`} fill={tinta} />
      {[-90, -18, 54, 126, 198].map(g => { const a = (g * Math.PI) / 180; const x = c + Math.cos(a) * 6.8, y = cy + Math.sin(a) * 6.8; const n = (q: number) => ({ x: f(c + Math.cos(a + q) * 4.6), y: f(cy + Math.sin(a + q) * 4.6) }); const e = n(-0.5), d = n(0.5);
        return <g key={g}><path d={`M${c} ${cy} Q${e.x} ${e.y} ${f(x)} ${f(y)} Q${d.x} ${d.y} ${c} ${cy} Z`} fill={cor(CINZA3)} {...C(0.55)} />
          {[0.35, 0.55, 0.75].map(t => <path key={t} d={`M${f(c + Math.cos(a - 0.22) * 6.8 * t)} ${f(cy + Math.sin(a - 0.22) * 6.8 * t)} L${f(c + Math.cos(a - 0.1) * 6.8 * t)} ${f(cy + Math.sin(a - 0.1) * 6.8 * t)} M${f(c + Math.cos(a + 0.22) * 6.8 * t)} ${f(cy + Math.sin(a + 0.22) * 6.8 * t)} L${f(c + Math.cos(a + 0.1) * 6.8 * t)} ${f(cy + Math.sin(a + 0.1) * 6.8 * t)}`} {...L(0.3)} />)}</g>; })}
      <circle cx={c} cy={cy} r={1.9} fill={tinta} />
    </g>; }
    case 'casa_invertida': { const c = W / 2; const casa = (inv: boolean) => { const k = inv ? -1 : 1, y0 = 10; return `M${c - 3.6} ${y0} V${y0 - k * 4} L${c} ${y0 - k * 7.2} L${c + 3.6} ${y0 - k * 4} V${y0} Z`; }; return <g>
      <path d={casa(false)} fill={cor(BRANCO)} {...C(0.7)} /><rect x={c - 0.8} y={7.4} width={1.6} height={2.6} {...L(0.45)} /><rect x={c + 1.4} y={6.4} width={1.2} height={1.2} {...L(0.4)} /><rect x={c - 2.6} y={6.4} width={1.2} height={1.2} {...L(0.4)} />
      <path d={`M1.6 10 V6.6 M0.6 8 L1.6 5.4 L2.6 8 Z M${W - 1.6} 10 V7.4 M${W - 2.4} 8.6 L${W - 1.6} 6.4 L${W - 0.8} 8.6 Z`} {...L(0.5)} />
      <path d={`M0.2 10 H${W - 0.2}`} {...L(0.9)} />
      <path d={casa(true)} fill={tinta} /><path d={`M1.6 10 V13.4 M0.6 12 L1.6 14.6 L2.6 12 Z M${W - 1.6} 10 V12.6 M${W - 2.4} 11.4 L${W - 1.6} 13.6 L${W - 0.8} 11.4 Z`} fill={tinta} {...C(0.5)} />
      <rect x={c - 0.8} y={10} width={1.6} height={2.6} fill={cor(CINZA1)} />
      {Array.from({ length: 9 }, (_, k) => <circle key={k} cx={f(1 + sorte(k) * (W - 2))} cy={f(12.4 + sorte(k + 20) * 7)} r={0.22 + sorte(k + 40) * 0.2} fill={tinta} />)}
    </g>; }
    /* ---------------- The Walking Dead */
    case 'taco_com_arame': { const c = W / 2; return <g>
      <path d={`M${c - 2.6} 2 Q${c - 2.6} 0.6 ${c} 0.6 Q${c + 2.6} 0.6 ${c + 2.6} 2 L${c + 0.9} 16 L${c - 0.9} 16 Z`} fill={cor(CINZA3)} {...C(0.7)} />
      <rect x={c - 0.9} y={16} width={1.8} height={2.4} fill={tinta} /><ellipse cx={c} cy={18.8} rx={1.6} ry={0.7} fill={tinta} />
      {[2.4, 4.6, 6.8, 9].map((y, k) => <g key={k}><path d={`M${c - 2.5 + y * 0.06} ${y} Q${c} ${y + 1.6} ${c + 2.5 - y * 0.06} ${y + 0.3}`} {...L(0.4)} />
        <path d={`M${c - 0.6} ${y + 0.6} l0.9 0.9 M${c + 0.3} ${y + 0.6} l-0.9 0.9`} {...L(0.3)} /></g>)}
    </g>; }
    case 'chapeu_de_xerife': return <g>
      <path d="M0.6 6.6 Q2 10.8 10 10.6 Q18 10.8 19.4 6.6 Q17.4 8.4 14.8 8 L14.2 2.8 Q12.6 1.4 10 2.6 Q7.4 1.4 5.8 2.8 L5.2 8 Q2.6 8.4 0.6 6.6 Z" fill={cor(MARROM)} {...C(0.8)} />
      <path d="M5.4 6.6 Q10 7.6 14.6 6.6 L14.8 8 Q10 9 5.2 8 Z" fill={tinta} />
      <path d={estrela(10, 4.6, 1.7, 6, 0.95)} fill={cor(AMARELO)} {...C(0.35)} /><circle cx={10} cy={4.6} r={0.45} fill={tinta} />
      <path d="M10 2.6 V3" {...L(0.4)} />
    </g>;
    case 'mao_da_terra': return <g>
      <path d="M5 15 L4.6 11.4 Q4.4 9.4 5.4 8.6 L4.6 3.6 Q4.6 2.8 5.4 3 L6.6 7.6 L6.8 1.8 Q7.2 1 7.8 1.8 L8.2 7.2 L9 1.6 Q9.6 1 10 1.8 L9.6 7.6 L11 3 Q11.6 2.6 11.8 3.4 L10.8 8.8 L12.6 7 Q13.6 6.8 13.2 7.8 L11 12 L11 15 Z" fill={cor(CINZA3)} {...C(0.6)} />
      <path d="M5.4 5.6 h0.6 M7 4.4 h0.8 M8.8 4.2 h0.8 M10.4 5.4 h0.7 M6.2 10.8 Q8 11.6 10 10.6" {...L(0.3)} />
      <path d="M0.4 19.6 Q0.6 15.6 3.4 15.4 Q5 14.2 8 14.8 Q11 14 12.6 15.4 Q15.4 15.6 15.6 19.6 Z" fill={tinta} />
      <path d="M3.4 17 l1.2 0.8 l0.8 -0.4 M10.8 16.6 l1.2 0.6 M7 18 l1.4 -0.6" stroke={cor(CINZA2)} strokeWidth={s(0.3)} fill="none" />
      <path d="M1.4 15.6 l0.4 -1.4 l0.4 1.4 M14 15.4 l0.4 -1.6 l0.4 1.6" {...L(0.35)} />
    </g>;
    /* ---------------- Peaky Blinders */
    case 'boina_navalhas': return <g>
      <path d="M1.4 7.6 Q1.8 2.4 9.4 1.8 Q16.6 1.8 17.6 6.4 Q12 8.8 1.4 7.6 Z" fill={cor(CINZA1)} {...C(0.8)} />
      {Array.from({ length: 14 }, (_, k) => <circle key={k} cx={f(3 + sorte(k) * 13)} cy={f(3 + sorte(k + 9) * 4)} r={0.18} fill={cor(CINZA3)} />)}
      <path d="M9.6 7.8 Q15.6 6.8 19.6 8.6 Q15 11 7.6 9.8 Z" fill={tinta} />
      {[[11.4, 9.6], [14, 9.7], [16.6, 9.3]].map(([x, y], k) => <g key={k}><rect x={x - 0.9} y={y} width={1.8} height={1.3} fill={cor(CINZA3)} {...C(0.3)} /><path d={`M${x - 0.4} ${y + 0.6} H${x + 0.4}`} {...L(0.25)} /></g>)}
      <circle cx={9.4} cy={2} r={0.6} fill={tinta} />
      <path d="M12 12.2 l0.4 -0.6 M15 12.4 l0.2 -0.7" stroke={cor(CINZA3)} strokeWidth={s(0.25)} />
    </g>;
    case 'navalha_aberta': return <g>
      <path d="M9 3.8 L18.4 2.4 Q19.8 3.6 18.8 5.6 L9.2 5.8 Z" fill={cor(CINZA3)} {...C(0.6)} />
      <path d="M9 3.8 L18.4 2.4" {...L(0.9)} /><path d="M10.6 4.6 L17.6 4" stroke={cor(BRANCO)} strokeWidth={s(0.35)} />
      <path d="M9.4 5.2 L1.2 6.8 Q0.4 7.6 1.4 8.2 L9.6 6.6 Z" fill={cor(CREME)} {...C(0.6)} />
      <path d="M3 7.2 l0.2 0.5 M5 6.8 l0.2 0.5 M7 6.4 l0.2 0.5" {...L(0.25)} />
      <circle cx={9.4} cy={5.6} r={0.6} fill={tinta} />
      <path d="M2.4 6 Q1.4 4.4 2.8 3.4 Q4.2 2.4 3.2 0.8" {...L(0.35)} opacity={0.75} />
    </g>;
    /* ---------------- Star Wars */
    case 'espada_de_luz': { const c = W / 2; return <g>
      <rect x={c - 1.4} y={0.4} width={2.8} height={12.6} rx={1.4} fill={cor(AZUL)} opacity={0.35} />
      <rect x={c - 0.9} y={0.8} width={1.8} height={12.2} rx={0.9} fill={cor(CELESTE)} {...C(0.4)} />
      <path d={`M${c} 1.6 V12.4`} stroke={cor(BRANCO)} strokeWidth={s(0.5)} strokeLinecap="round" />
      <path d={`M${c - 1.3} 13 H${c + 1.3} V14.4 H${c - 1.3} Z`} fill={tinta} />
      <rect x={c - 1.1} y={14.4} width={2.2} height={5.2} fill={cor(CINZA3)} {...C(0.5)} />
      {[15.6, 16.6, 17.6, 18.6].map(y => <path key={y} d={`M${c - 1.1} ${y} H${c + 1.1}`} {...L(0.3)} />)}
      <rect x={c + 0.2} y={14.8} width={0.6} height={0.6} fill={cor(VERMELHO)} />
    </g>; }
    case 'capacete_sombrio': { const c = W / 2; return <g>
      <path d={`M${c} 0.8 Q${c + 6.8} 0.8 ${c + 7} 8.6 L${c + 8} 17.4 L${c + 4.4} 16 L${c + 3} 19.4 H${c - 3} L${c - 4.4} 16 L${c - 8} 17.4 L${c - 7} 8.6 Q${c - 6.8} 0.8 ${c} 0.8 Z`} fill={tinta} />
      <path d={`M${c - 5.4} 4.4 Q${c - 4} 1.8 ${c} 1.6`} fill="none" stroke={cor(CINZA3)} strokeWidth={s(0.6)} strokeLinecap="round" />
      <path d={`M${c - 5.6} 8.8 L${c - 1} 8.2 L${c - 1.4} 11 L${c - 5} 10.8 Z M${c + 5.6} 8.8 L${c + 1} 8.2 L${c + 1.4} 11 L${c + 5} 10.8 Z`} fill={cor(CINZA2)} />
      <path d={`M${c} 8.2 L${c - 1} 13 L${c + 1} 13 Z`} fill={cor(CINZA1)} {...C(0.3)} />
      <path d={`M${c - 2.8} 17.6 L${c} 13.4 L${c + 2.8} 17.6 Z`} fill={cor(CINZA1)} />
      {[-1.6, -0.6, 0.4, 1.4].map(x => <path key={x} d={`M${c + x + 0.1} 15.4 V17.4`} stroke={cor(CINZA3)} strokeWidth={s(0.3)} />)}
    </g>; }
    case 'caca_em_x': { const cx = 10, cy = H / 2; const asa = (dx: number, dy: number) => { const tx = cx + dx * 8.8, ty = cy + dy * 6.8; const nx = -dy * 0.7, ny = dx * 0.7; return <g key={`${dx}${dy}`}>
      <path d={`M${cx + dx * 1.6 + nx} ${cy + dy * 1.2 + ny} L${f(tx + nx)} ${f(ty + ny)} L${f(tx - nx)} ${f(ty - ny)} L${cx + dx * 1.6 - nx} ${cy + dy * 1.2 - ny} Z`} fill={cor(BRANCO)} {...C(0.5)} />
      <path d={`M${f(cx + dx * 5)} ${f(cy + dy * 3.8)} L${f(cx + dx * 6.6)} ${f(cy + dy * 5.1)}`} stroke={cor(VERMELHO)} strokeWidth={s(0.9)} />
      <path d={`M${f(tx)} ${f(ty)} l${dx * 0.9} 0`} {...L(0.5)} />
      <circle cx={cx + dx * 2.8} cy={cy + dy * 2.4} r={1.15} fill={cor(CINZA2)} {...C(0.4)} /><circle cx={cx + dx * 2.8} cy={cy + dy * 2.4} r={0.5} fill={cor(LARANJA)} /></g>; };
      return <g>{[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => asa(a, b))}<circle cx={cx} cy={cy} r={1.7} fill={cor(CINZA3)} {...C(0.6)} /><circle cx={cx} cy={cy} r={0.6} fill={tinta} /></g>; }
    case 'droide_cupula': { const c = W / 2; return <g>
      <path d={`M1.2 7 L1 17.6 L0.4 19.4 H3.2 L2.8 17.6 L3 7 Z M${W - 1.2} 7 L${W - 1} 17.6 L${W - 0.4} 19.4 H${W - 3.2} L${W - 2.8} 17.6 L${W - 3} 7 Z`} fill={cor(BRANCO)} {...C(0.5)} />
      <path d={`M${c - 5} 7 A5 5 0 0 1 ${c + 5} 7 Z`} fill={cor(CINZA3)} {...C(0.6)} />
      <rect x={c - 1} y={3} width={2} height={1.6} fill={cor(AZUL)} /><circle cx={c - 2.6} cy={5.4} r={0.9} fill={tinta} /><circle cx={c - 2.4} cy={5.2} r={0.3} fill={cor(VERMELHO)} /><rect x={c + 1.6} y={4.8} width={1.6} height={1} fill={cor(AZUL)} />
      <path d={`M${c - 4.6} 7 H${c + 4.6} V15.4 Q${c} 17 ${c - 4.6} 15.4 Z`} fill={cor(BRANCO)} {...C(0.6)} />
      <rect x={c - 3.4} y={8.2} width={2.2} height={3.6} fill={cor(AZUL)} {...C(0.3)} /><rect x={c - 0.4} y={8.2} width={3.6} height={1.4} fill={cor(AZUL)} {...C(0.3)} />
      <path d={`M${c - 0.4} 11 H${c + 3.2} M${c - 0.4} 12.4 H${c + 3.2} M${c - 3.4} 13.4 H${c + 3.2}`} {...L(0.3)} />
      <path d={`M${c - 1.4} 16.4 L${c - 1.8} 18.6 H${c + 1.8} L${c + 1.4} 16.4`} fill={cor(CINZA3)} {...C(0.4)} />
    </g>; }
    /* ---------------- Harry Potter */
    case 'raio_e_oculos': return <g>
      <path d="M11.4 0.6 L8.2 3.8 L10.4 4 L8.4 6.6 L9 6.6 L12.2 3.2 L10 3 L12.2 0.6 Z" fill={tinta} />
      <circle cx={5.8} cy={8.6} r={3.3} {...L(0.9)} /><circle cx={14.2} cy={8.6} r={3.3} {...L(0.9)} />
      <path d="M9.1 8.2 Q10 7 10.9 8.2" {...L(0.8)} /><path d="M2.5 8 L0.6 6.6 M17.5 8 L19.4 6.6" {...L(0.7)} />
      <path d="M9.4 7.2 l1.2 1.4 M10.6 7.2 l-1.2 1.4" {...L(0.3)} />
      <path d="M4 7 Q4.6 6 5.8 5.8 M12.4 7 Q13 6 14.2 5.8" {...L(0.3)} opacity={0.6} />
    </g>;
    case 'tres_reliquias': return <g>
      <path d="M10 1.4 L18.8 17.8 H1.2 Z" {...L(0.9)} /><circle cx={10} cy={12.2} r={5.5} {...L(0.9)} /><path d="M10 1.4 V17.8" {...L(0.9)} />
    </g>;
    case 'pomo_alado': { const cy = H / 2 + 0.6; const asa = (k: 1 | -1) => `M${10 - k * 2.2} ${cy - 0.6} Q${10 - k * 5} ${cy - 5.6} ${10 - k * 9.6} ${cy - 4.8} Q${10 - k * 7.6} ${cy - 3.6} ${10 - k * 8.8} ${cy - 2.6} Q${10 - k * 6.6} ${cy - 2.2} ${10 - k * 7.6} ${cy - 1} Q${10 - k * 5} ${cy - 0.8} ${10 - k * 2.4} ${cy + 0.4} Z`; return <g>
      <path d={asa(1)} fill={cor(BRANCO)} {...C(0.45)} /><path d={asa(-1)} fill={cor(BRANCO)} {...C(0.45)} />
      <path d={`M7.6 ${cy - 1.2} Q5.4 ${cy - 3} 2.6 ${cy - 3.6} M12.4 ${cy - 1.2} Q14.6 ${cy - 3} 17.4 ${cy - 3.6}`} {...L(0.25)} />
      <circle cx={10} cy={cy} r={2.6} fill={cor(OURO)} {...C(0.6)} />
      <path d={`M7.6 ${cy} Q10 ${cy + 1.4} 12.4 ${cy} M10 ${cy - 2.6} Q11 ${cy} 10 ${cy + 2.6}`} {...L(0.3)} />
      <path d={`M8.6 ${cy - 1.4} Q9 ${cy - 2} 9.8 ${cy - 2}`} stroke={cor(BRANCO)} strokeWidth={s(0.4)} fill="none" />
    </g>; }
    case 'coruja_com_carta': { const c = W / 2; const asa = (k: 1 | -1) => `M${c + k * 2.6} 8.4 Q${c + k * 4.6} 2.4 ${c + k * 8.2} 2.2 Q${c + k * 8.4} 3.4 ${c + k * 7.6} 3.8 Q${c + k * 8.4} 4.8 ${c + k * 7.4} 5.4 Q${c + k * 8} 6.6 ${c + k * 6.8} 7 Q${c + k * 7.2} 8.4 ${c + k * 5.8} 8.6 Q${c + k * 5.8} 10 ${c + k * 4.4} 9.8 Q${c + k * 3.8} 11.2 ${c + k * 2.8} 12 Z`; return <g>
      <path d={asa(-1)} fill={cor(BRANCO)} {...C(0.55)} /><path d={asa(1)} fill={cor(BRANCO)} {...C(0.55)} />
      <path d={`M${c - 4.2} 6.8 L${c - 6.2} 4.2 M${c + 4.2} 6.8 L${c + 6.2} 4.2 M${c - 4.4} 9 L${c - 6.8} 7.6 M${c + 4.4} 9 L${c + 6.8} 7.6`} {...L(0.3)} />
      <ellipse cx={c} cy={9.4} rx={3.3} ry={4.6} fill={cor(BRANCO)} {...C(0.6)} />
      <circle cx={c - 1.3} cy={7.6} r={1.1} fill={cor(AMARELO)} {...C(0.35)} /><circle cx={c + 1.3} cy={7.6} r={1.1} fill={cor(AMARELO)} {...C(0.35)} />
      <circle cx={c - 1.3} cy={7.6} r={0.45} fill={tinta} /><circle cx={c + 1.3} cy={7.6} r={0.45} fill={tinta} /><path d={`M${c - 0.4} 8.6 L${c} 9.6 L${c + 0.4} 8.6 Z`} fill={tinta} />
      {[[c - 1, 11], [c + 1, 11], [c, 12.2]].map(([x, y], k) => <path key={k} d={`M${x - 0.5} ${y} q0.5 0.5 1 0`} {...L(0.3)} />)}
      <path d={`M${c - 1} 13.8 V15 M${c + 1} 13.8 V15`} {...L(0.5)} />
      <rect x={c - 3} y={14.8} width={6} height={4.2} fill={cor(CREME)} {...C(0.5)} /><path d={`M${c - 3} 14.8 L${c} 17 L${c + 3} 14.8`} {...L(0.4)} /><circle cx={c} cy={17} r={0.6} fill={cor(VERMELHO)} {...C(0.25)} />
    </g>; }
    case 'malfeito_feito': return <g>
      <path d={`M2 1.2 H18 Q19.4 1.2 19.4 2.4 V5.6 Q19.4 4.6 18 4.6 H2 Q0.6 4.6 0.6 5.6 V2.4 Q0.6 1.2 2 1.2 Z`} fill={cor(CREME)} {...C(0.5)} />
      <path d="M0.6 5.6 Q0.6 6.6 1.6 6.6 Q2.4 6.2 2 4.6 M19.4 5.6 Q19.4 6.6 18.4 6.6 Q17.6 6.2 18 4.6" {...L(0.45)} />
      {letra(texto ?? 'Malfeito feito.', 10, 3.9, 2.4, { estilo: 'italic', peso: 600, larg: 14.6 })}
    </g>;
    /* ---------------- O Senhor dos Anéis */
    case 'anel_com_inscricao': { const cy = H / 2; return <g>
      <path d={`M1.2 ${cy} A8.8 6.4 0 1 0 18.8 ${cy} A8.8 6.4 0 1 0 1.2 ${cy} Z M4 ${cy} A6 3.8 0 1 1 16 ${cy} A6 3.8 0 1 1 4 ${cy} Z`} fill={cor(OURO)} fillRule="evenodd" {...C(0.7)} />
      <path d={`M2.6 ${cy + 0.6} A7.4 5 0 0 0 17.4 ${cy + 0.6}`} fill="none" stroke={cor(LARANJA)} strokeWidth={s(1.1)} strokeDasharray="0.4 0.3 0.9 0.3 0.2 0.45" />
      <path d={`M2.6 ${cy + 0.6} A7.4 5 0 0 0 17.4 ${cy + 0.6}`} fill="none" stroke={cor(VERMELHO)} strokeWidth={s(0.45)} strokeDasharray="0.6 0.5 0.3 0.8" />
      <path d={`M3.4 ${cy - 3} Q6 ${cy - 5.4} 10 ${cy - 5.6}`} stroke={cor(BRANCO)} strokeWidth={s(0.5)} fill="none" strokeLinecap="round" />
    </g>; }
    case 'olho_em_chamas': { const c = W / 2; return <g>
      <path d={`M${c} 0.4 Q${c + 1.4} 2 ${c + 3.4} 1.4 Q${c + 3} 3 ${c + 5.4} 3 Q${c + 4.4} 4.4 ${c + 7.4} 5.6 Q${c + 6} 6.8 ${c + 7.8} 8.2 Q${c + 5.6} 9.2 ${c + 6.4} 11.4 Q${c + 3} 11.2 ${c} 12.6 Q${c - 3} 11.2 ${c - 6.4} 11.4 Q${c - 5.6} 9.2 ${c - 7.8} 8.2 Q${c - 6} 6.8 ${c - 7.4} 5.6 Q${c - 4.4} 4.4 ${c - 5.4} 3 Q${c - 3} 3 ${c - 3.4} 1.4 Q${c - 1.4} 2 ${c} 0.4 Z`} fill={cor(VERMELHO)} {...C(0.5)} />
      <path d={`M${c - 6} 7 Q${c} 1.8 ${c + 6} 7 Q${c} 12.2 ${c - 6} 7 Z`} fill={cor(LARANJA)} {...C(0.5)} />
      <path d={`M${c - 3.8} 7 Q${c} 3.6 ${c + 3.8} 7 Q${c} 10.4 ${c - 3.8} 7 Z`} fill={cor(AMARELO)} />
      <ellipse cx={c} cy={7} rx={0.7} ry={3.2} fill={tinta} />
      <path d={`M${c - 3.4} 19.6 L${c - 2.8} 12.6 L${c - 3.8} 11 L${c - 1.4} 12.4 L${c - 1} 19.6 Z M${c + 3.4} 19.6 L${c + 2.8} 12.6 L${c + 3.8} 11 L${c + 1.4} 12.4 L${c + 1} 19.6 Z`} fill={tinta} />
    </g>; }
    case 'arvore_branca': { const c = W / 2; return <g>
      {Array.from({ length: 7 }, (_, k) => { const a = Math.PI + (k / 6) * Math.PI; return <path key={k} d={estrela(f(c + Math.cos(a) * 7), f(7.6 + Math.sin(a) * 6.4), 0.8, 5, 0.32)} fill={tinta} />; })}
      <path d={`M${c - 1} 19.4 Q${c - 0.6} 15 ${c - 0.6} 12 L${c - 4.8} 8.6 M${c - 0.6} 13 L${c - 3.6} 11.6 M${c + 1} 19.4 Q${c + 0.6} 15 ${c + 0.6} 12 L${c + 4.8} 8.6 M${c + 0.6} 13 L${c + 3.6} 11.6 M${c - 0.6} 12 L${c - 1.6} 7.4 M${c + 0.6} 12 L${c + 1.6} 7.4 M${c} 12.4 V6`} {...L(0.7)} />
      <path d={`M${c - 4.8} 8.6 l-1.2 -0.6 M${c - 4.8} 8.6 l-0.4 -1.2 M${c + 4.8} 8.6 l1.2 -0.6 M${c + 4.8} 8.6 l0.4 -1.2 M${c - 1.6} 7.4 l-0.8 -0.8 M${c + 1.6} 7.4 l0.8 -0.8 M${c} 6 l-0.6 -0.8 M${c} 6 l0.6 -0.8`} {...L(0.4)} />
      <path d={`M${c - 3.2} 19.4 Q${c - 1.6} 18.4 ${c - 1} 19.4 M${c + 3.2} 19.4 Q${c + 1.6} 18.4 ${c + 1} 19.4`} {...L(0.5)} />
    </g>; }
    case 'broche_folha': { const c = W / 2; return <g>
      <path d={`M${c} 1.4 Q${W - 0.6} 7 ${c} 17 Q0.6 7 ${c} 1.4 Z`} fill={cor(VERDE)} {...C(0.7)} />
      <path d={`M${c} 2 V17.6 M${c} 6 L${c + 2.4} 4.4 M${c} 9 L${c + 3} 7 M${c} 12 L${c + 2.6} 10.2 M${c} 6 L${c - 2.4} 4.4 M${c} 9 L${c - 3} 7 M${c} 12 L${c - 2.6} 10.2`} fill="none" stroke={cor(CINZA3)} strokeWidth={s(0.45)} strokeLinecap="round" />
      <path d={`M${c} 17 Q${c} 19.4 ${c + 2} 19.4 Q${c + 3.6} 19 ${c + 3} 17.6`} {...L(0.6)} />
      <path d={`M${c} 2 V17.6`} {...L(0.25)} />
    </g>; }
    /* ---------------- Matrix */
    case 'chuva_de_codigo': { const gl = 'ｱﾊ01ﾐﾓﾃ7ｻﾇ9ﾜ'; return <g>
      {[1.8, 4.6, 7.4, 10.2].map((x, k) => { const ini = 2.4 + sorte(k) * 5, n = 4 + Math.floor(sorte(k + 7) * 3); return <g key={k}>
        {Array.from({ length: n }, (_, j) => <text key={j} x={x} y={f(ini + j * 2.9)} textAnchor="middle" fontSize={2.8} fontWeight={700} fontFamily="monospace" fill={j === n - 1 ? cor(BRANCO) : cor(VERDE)} stroke={tinta} strokeWidth={s(j === n - 1 ? 0.25 : 0.12)} opacity={0.55 + (j / n) * 0.45}>{gl[(k * 3 + j) % gl.length]}</text>)}
      </g>; })}
    </g>; }
    case 'duas_pilulas': { const cap = (cx: number, cy: number, a: number, c: string) => <g transform={`rotate(${a} ${cx} ${cy})`}>
      <path d={`M${cx - 4.6} ${cy} A2 2 0 0 1 ${cx - 2.6} ${cy - 2} H${cx} V${cy + 2} H${cx - 2.6} A2 2 0 0 1 ${cx - 4.6} ${cy} Z`} fill={cor(c)} {...C(0.6)} />
      <path d={`M${cx} ${cy - 2} H${cx + 2.6} A2 2 0 0 1 ${cx + 2.6} ${cy + 2} H${cx} Z`} fill={cor(BRANCO)} {...C(0.6)} />
      <path d={`M${cx - 3.4} ${cy - 1} H${cx - 1}`} stroke={cor(BRANCO)} strokeWidth={s(0.45)} strokeLinecap="round" /></g>;
      return <g>{cap(5.6, 5.4, -30, VERMELHO)}{cap(14.4, 9.8, -30, AZUL)}</g>; }
    case 'coelho_branco': return <g>
      <path d="M2.4 9.6 Q3 6.4 7 6 Q10 5.8 12 7.2 L13.4 5.6 Q15.6 4.6 16.6 6 L18.6 6.8 Q19.2 7.6 18.2 8 L16.4 8.4 Q15.4 10.6 13 11 Q11.4 11.4 10 11.6 L12 14.4 L10.6 14.6 L8.4 12 Q6 12.4 4.4 11.6 L1.2 13.6 L0.6 13 L3 10.8 Q2.4 10.4 2.4 9.6 Z" fill={cor(BRANCO)} {...C(0.6)} />
      <path d="M14.4 5.2 Q12.4 1.6 9.6 0.8 Q11.6 3.4 13.4 5.6 M15.6 5 Q15.4 1.8 13.6 0.6 Q14.2 3 14.6 5.4" fill={cor(BRANCO)} {...C(0.5)} />
      <circle cx={16.4} cy={6.6} r={0.35} fill={tinta} /><circle cx={2.2} cy={9} r={1} fill={cor(BRANCO)} {...C(0.4)} />
      <path d="M13.4 10.6 Q14 12.4 13 13.6" {...L(0.35)} /><circle cx={13} cy={14.6} r={1.3} fill={cor(CINZA3)} {...C(0.45)} />
      <path d="M13 14.6 V13.9 M13 14.6 L13.5 14.9" {...L(0.25)} />
    </g>;
    /* ---------------- Jurassic Park */
    case 'cranio_de_rex': return <g>
      <path d="M0.8 4.8 Q2 1.2 7 1 Q12.4 0.8 15.6 2.4 Q19 3.8 19.4 6.4 L19 7.6 Q14 7.2 10.4 8 L7.4 9.6 Q3 9.6 0.8 4.8 Z" fill={cor(CINZA3)} {...C(0.7)} />
      <ellipse cx={6.4} cy={4} rx={1.6} ry={1.3} fill={tinta} /><path d="M2.6 4.6 Q3.4 3 4.2 4.8 Q3.6 6.6 2.6 4.6 Z" fill={tinta} />
      <path d="M9.4 3.6 Q12.4 2.8 14.6 4.4 Q12 5.6 9.4 3.6 Z" fill={tinta} /><circle cx={17.4} cy={4.8} r={0.6} fill={tinta} />
      <path d="M7.4 10 Q12 9.6 18.4 9.2 L17.8 10.8 Q12 13.4 8 13 Q4.6 12.4 7.4 10 Z" fill={cor(CINZA3)} {...C(0.7)} />
      {[9, 10.6, 12.2, 13.8, 15.4, 17].map(x => <path key={x} d={`M${x} ${7.4 + (x - 9) * -0.06} l0.4 1.4 l0.4 -1.4`} fill={cor(BRANCO)} {...C(0.3)} />)}
      {[9.4, 11, 12.6, 14.2, 15.8].map(x => <path key={x} d={`M${x} ${10.2 - (x - 9) * 0.06} l0.4 -1.2 l0.4 1.2`} fill={cor(BRANCO)} {...C(0.3)} />)}
      <ellipse cx={10} cy={11.2} rx={1.4} ry={0.6} fill={tinta} />
    </g>;
    case 'mosquito_no_ambar': { const c = W / 2; return <g>
      <path d={`M${c} 0.6 Q${W - 0.4} 9 ${W - 0.8} 13.4 Q${W - 1.2} 19.4 ${c} 19.4 Q1.2 19.4 0.8 13.4 Q0.4 9 ${c} 0.6 Z`} fill={cor(LARANJA)} {...C(0.8)} />
      <path d={`M${c} 4.4 Q${W - 2.6} 10 ${W - 2.8} 13.6 Q${W - 3.2} 17.6 ${c} 17.6 Q3.2 17.6 2.8 13.6 Q2.6 10 ${c} 4.4 Z`} fill={cor(AMARELO)} opacity={0.6} />
      <path d={`M${c - 0.2} 9.4 L${c + 0.4} 15.4`} {...L(0.8)} /><circle cx={c - 0.3} cy={9} r={0.7} fill={tinta} /><path d={`M${c - 0.6} 8.6 L${c - 2} 6.6`} {...L(0.3)} />
      <path d={`M${c} 10.6 Q${c - 4} 9 ${c - 4} 11.4 Q${c - 2} 12 ${c} 10.8 M${c + 0.2} 10.6 Q${c + 4} 8.6 ${c + 4.2} 11 Q${c + 2.2} 12 ${c + 0.2} 10.8`} fill={cor(BRANCO)} opacity={0.85} {...C(0.3)} />
      <path d={`M${c} 11.6 L${c - 3.2} 14.6 L${c - 3.8} 17 M${c + 0.2} 11.8 L${c + 3.4} 14 L${c + 4} 16.6 M${c - 0.2} 11 L${c - 3.6} 12.4 M${c + 0.2} 11 L${c + 3.6} 12`} {...L(0.25)} />
      <path d={`M3 8.6 Q4.4 5.6 ${c - 1} 3.6`} stroke={cor(BRANCO)} strokeWidth={s(0.6)} fill="none" strokeLinecap="round" opacity={0.8} />
    </g>; }
    /* ---------------- Marvel */
    case 'escudo_de_estrela': return <g>
      <circle cx={10} cy={10} r={9} fill={cor(VERMELHO)} {...C(0.8)} /><circle cx={10} cy={10} r={7.2} fill={cor(BRANCO)} {...C(0.4)} />
      <circle cx={10} cy={10} r={5.4} fill={cor(VERMELHO)} {...C(0.4)} /><circle cx={10} cy={10} r={3.7} fill={cor(AZUL)} {...C(0.4)} />
      <path d={estrela(10, 10.3, 3.5, 5, 1.4)} fill={cor(BRANCO)} {...C(0.3)} />
      <path d="M14.6 3.6 l-1.8 2.6 l0.6 0.2 l-1 1.6" {...L(0.35)} />
    </g>;
    case 'martelo_do_trovao': { const c = W / 2; return <g>
      <path d={`M0.6 4.8 L2 3.2 L3.4 4 L4.6 2.6 L5.6 3.8 M${W - 0.6} 4.8 L${W - 2} 3.2 L${W - 3.4} 4 L${W - 4.6} 2.6 L${W - 5.6} 3.8`} {...L(0.45)} />
      <rect x={1.6} y={4.4} width={W - 3.2} height={5.8} rx={0.6} fill={cor(CINZA2)} {...C(0.8)} />
      <rect x={3.4} y={5.6} width={W - 6.8} height={3.4} rx={0.3} {...L(0.4)} />
      <path d={`M${c - 1.2} 7.3 Q${c} 5.8 ${c + 1.2} 7.3 Q${c} 8.8 ${c - 1.2} 7.3 Z`} {...L(0.35)} />
      <rect x={c - 1} y={10.2} width={2} height={7.6} fill={cor(MARROM)} {...C(0.6)} />
      {[11.4, 12.8, 14.2, 15.6].map(y => <path key={y} d={`M${c - 1} ${y + 0.6} L${c + 1} ${y}`} {...L(0.35)} />)}
      <path d={`M${c - 1} 17.8 H${c + 1} V18.6 H${c - 1} Z`} fill={tinta} /><path d={`M${c} 18.6 Q${c - 2.6} 19.8 ${c - 2} 18.4 Q${c - 1.6} 17.6 ${c - 0.6} 18.6`} {...L(0.4)} />
    </g>; }
    case 'manopla_de_joias': { const gs: [number, number, string][] = [[3.6, 7.2, ROXO], [6.2, 5.8, AZUL], [8.8, 5.8, VERMELHO], [11.4, 7.2, ROSA], [1.8, 11.8, VERDE], [7.4, 11.6, AMARELO]]; return <g>
      <path d="M2.4 9.6 L2.4 4 Q2.4 2.6 3.6 2.6 Q4.8 2.6 4.8 4 V7 L5 2 Q5 0.6 6.2 0.6 Q7.4 0.6 7.4 2 V6.6 L7.6 1.8 Q7.8 0.6 8.8 0.6 Q10 0.6 10 2 V7 L10.4 3.2 Q10.6 2 11.6 2.2 Q12.6 2.4 12.6 3.6 L12.4 10.6 Q14.4 9.6 14.4 11.2 Q14.4 12.4 12.6 14 L11.6 15.6 H3 L1.2 12.8 Q0.6 11 2.4 9.6 Z" fill={cor(OURO)} {...C(0.7)} />
      <path d="M3 15.6 L2.6 19.4 H12.4 L11.6 15.6 Z" fill={cor(OURO)} {...C(0.7)} /><path d="M2.8 17.4 H12" {...L(0.4)} />
      <path d="M4.8 7 V9 M7.4 6.6 V9 M10 7 V9" {...L(0.3)} />
      {gs.map(([x, y, c], k) => <ellipse key={k} cx={x} cy={y} rx={k === 5 ? 1.2 : 0.8} ry={k === 5 ? 1.5 : 1} fill={cor(c)} {...C(0.35)} />)}
    </g>; }
    case 'aranha_no_fio': return <g>
      {[0, 0.4, 0.8, 1.2, 1.57].map(a => <path key={a} d={`M0 0 L${f(Math.cos(a) * 8)} ${f(Math.sin(a) * 8)}`} {...L(0.3)} />)}
      {[2.6, 4.6, 6.6].map(r => <path key={r} d={`M${r} 0 Q${f(r * 0.85)} ${f(r * 0.35)} ${f(Math.cos(0.4) * r)} ${f(Math.sin(0.4) * r)} Q${f(r * 0.7)} ${f(r * 0.6)} ${f(Math.cos(0.8) * r)} ${f(Math.sin(0.8) * r)} Q${f(r * 0.48)} ${f(r * 0.8)} ${f(Math.cos(1.2) * r)} ${f(Math.sin(1.2) * r)} Q${f(r * 0.2)} ${f(r * 0.92)} 0 ${r}`} {...L(0.3)} />)}
      <path d="M9.4 0 V11" {...L(0.3)} />
      <ellipse cx={9.4} cy={15} rx={2.2} ry={2.8} fill={tinta} /><circle cx={9.4} cy={11.8} r={1.2} fill={tinta} />
      {[-1, 1].map(k => <g key={k}>{[[12.6, 10.6], [13.2, 13.6], [13, 16.4], [12, 19.4]].map(([x, y], j) => <path key={j} d={`M9.4 ${12.6 + j * 0.8} L${f(9.4 + k * (x - 9.4) * 0.7)} ${f(y - 1.2)} L${f(9.4 + k * (x - 9.4))} ${y}`} {...L(0.45)} />)}</g>)}
      <path d="M8.8 15 l0.6 -0.8 l0.6 0.8 l-0.6 0.8 Z" fill={cor(BRANCO)} />
    </g>;
    /* ---------------- DC */
    case 'morcego_na_lua': return <g>
      <circle cx={12.6} cy={6.4} r={5.6} fill={cor(AMARELO)} {...C(0.6)} />
      <g transform="rotate(-14 8 6)"><path d="M8 5.4 L8.4 4.4 L8.8 5.2 Q10 4.4 11.2 2.8 Q11.8 4.6 13.4 4.8 Q12.4 5.8 12.8 7.2 Q11.4 6.6 10.6 7.6 Q9.8 6.8 8.8 7.4 L8.4 8.8 L8 7.4 Q7 6.8 6.2 7.6 Q5.4 6.6 4 7.2 Q4.4 5.8 3.4 4.8 Q5 4.6 5.6 2.8 Q6.8 4.4 8 5.2 Z" fill={tinta} /></g>
      <path d="M15.6 3.6 l0.6 0.4 l0.6 -0.4 l-0.6 0.9 Z" fill={tinta} />
      <path d={`M0.4 ${H} V12.4 H2.4 V10.8 H4.2 V13 H5.6 V11.4 H7.6 V12.6 H9 V10 H11 V12.8 H12.6 V11.2 H14.8 V12.6 H16 V10.6 H18 V12 H19.6 V${H} Z`} fill={tinta} />
      {[[1.2, 13.4], [3, 12], [8, 13.6], [9.8, 11.2], [13.4, 12.2], [16.8, 11.8], [17.4, 13.8]].map(([x, y], k) => <rect key={k} x={x} y={y} width={0.5} height={0.6} fill={cor(AMARELO)} />)}
    </g>;
    case 'laco_dourado': return <g>
      {[[10, 8.6, 7.4, 4.2], [9.6, 9.6, 6.6, 4], [10.4, 10.6, 7, 3.8]].map(([x, y, rx, ry], k) => <g key={k}><ellipse cx={x} cy={y} rx={rx} ry={ry} fill="none" stroke={tinta} strokeWidth={s(1.6)} /><ellipse cx={x} cy={y} rx={rx} ry={ry} fill="none" stroke={cor(OURO)} strokeWidth={s(0.9)} strokeDasharray="0.8 0.35" /></g>)}
      <path d="M15.6 13.6 Q17.6 16 15.4 18 Q13.4 19.6 11 18.6" fill="none" stroke={tinta} strokeWidth={s(1.6)} strokeLinecap="round" /><path d="M15.6 13.6 Q17.6 16 15.4 18 Q13.4 19.6 11 18.6" fill="none" stroke={cor(OURO)} strokeWidth={s(0.9)} strokeDasharray="0.8 0.35" />
      {[[2, 2.4], [18.2, 3], [3, 16.4]].map(([x, y], k) => <path key={k} d={`M${x} ${y - 1.2} V${y + 1.2} M${x - 1.2} ${y} H${x + 1.2}`} {...L(0.35)} />)}
    </g>;
    case 'carta_do_coringa': { const c = W / 2; return <g>
      <rect x={0.6} y={0.6} width={W - 1.2} height={18.8} rx={1.2} fill={cor(BRANCO)} {...C(0.7)} />
      <path d={`M${c - 4.6} 9.4 Q${c} 14.6 ${c + 4.6} 9 Q${c + 4} 12 ${c} 13 Q${c - 4} 12.6 ${c - 4.6} 9.4 Z`} fill={cor(VERMELHO)} {...C(0.5)} />
      <path d={`M${c - 3.6} 10.4 Q${c} 12.6 ${c + 3.8} 10 L${c + 3.4} 11 Q${c} 12.8 ${c - 3.4} 11.2 Z`} fill={cor(BRANCO)} {...C(0.25)} />
      {[-2.4, -1.2, 0, 1.2, 2.4].map(x => <path key={x} d={`M${c + x} ${11 + Math.abs(x) * -0.1} V${12 - Math.abs(x) * 0.16}`} {...L(0.2)} />)}
      <path d={`M${c - 3} 6.6 l1 -0.8 l1 0.8 l-1 0.8 Z M${c + 1} 6.4 l1 -0.8 l1 0.8 l-1 0.8 Z`} fill={cor(VERDE)} {...C(0.3)} />
      <g transform={`rotate(-20 ${c} 16.6)`}>{letra('HA HA', c, 17.4, 1.8, { peso: 800, fill: cor(ROXO) })}</g>
      <path d="M1.6 2 l1 1.6 l0.8 -1.6 l0.8 1.6 l1 -1.6" fill={cor(ROXO)} {...C(0.3)} />
      <path d={`M${W - 1.6} 18 l-1 -1.6 l-0.8 1.6 l-0.8 -1.6 l-1 1.6`} fill={cor(ROXO)} {...C(0.3)} />
    </g>; }
    /* ---------------- Jogos Vorazes */
    case 'tordo_e_flecha': return <g>
      <circle cx={10} cy={10} r={9.2} {...L(0.9)} /><circle cx={10} cy={10} r={8.2} {...L(0.3)} />
      <path d="M2.4 11 H17.6" {...L(0.6)} /><path d="M2.2 11 L3.6 10 V12 Z" fill={tinta} /><path d="M17.6 11 l1 -0.9 M17.6 11 l1 0.9 M16.6 11 l1 -0.9 M16.6 11 l1 0.9" {...L(0.4)} />
      <path d="M4.6 10.4 Q7.6 8.6 10.6 9.4 L16 12.6 L14.2 12.8 L16 15 Q12 13.6 10 12.4 Q7 12.4 5.4 11.4 L4 11 Z" fill={tinta} />
      <path d="M8.4 9.6 Q9 4.6 14.6 2.6 Q12.6 4.8 14.6 5 Q12.4 6.4 13.8 7.2 Q11.6 8.2 11 9.6 Z" fill={tinta} />
      <path d="M10.6 5.8 l1.6 -1.2 M10.8 7.4 l1.4 -0.6" stroke={cor(BRANCO)} strokeWidth={s(0.3)} />
      <circle cx={5.6} cy={10.2} r={0.3} fill={cor(BRANCO)} />
    </g>;
    case 'arco_e_aljava': return <g>
      <path d="M4.6 0.8 Q-1.4 10 4.6 19.2" fill="none" stroke={tinta} strokeWidth={s(1.1)} strokeLinecap="round" /><path d="M4.6 0.8 L4.6 19.2" {...L(0.3)} />
      <path d="M1.6 9.2 H2.8 V10.8 H1.6 Z" fill={tinta} />
      <g transform="rotate(14 10 11)"><rect x={8} y={6} width={4.4} height={12.6} rx={1} fill={cor(CINZA3)} {...C(0.6)} />
        {[8.9, 10.2, 11.5].map((x, k) => <g key={k}><path d={`M${x} 6 V${1.4 + k * 0.6}`} {...L(0.4)} /><path d={`M${x} ${1.6 + k * 0.6} l-0.7 -1 M${x} ${1.6 + k * 0.6} l0.7 -1 M${x} ${2.6 + k * 0.6} l-0.7 -1 M${x} ${2.6 + k * 0.6} l0.7 -1`} {...L(0.3)} /></g>)}
        <path d="M8 9 H12.4 M8 15.6 H12.4" {...L(0.4)} /></g>
      <path d="M7 4 Q12 2 13.4 18" {...L(0.4)} />
    </g>;
    /* ---------------- Piratas do Caribe */
    case 'pardal_no_sol': return <g>
      <path d="M3.6 9.4 A6.4 6.4 0 0 1 16.4 9.4 Z" fill={cor(LARANJA)} {...C(0.6)} />
      {[-60, -30, 0, 30, 60].map(g => { const a = ((g - 90) * Math.PI) / 180; return <path key={g} d={`M${f(10 + Math.cos(a) * 7.4)} ${f(9.4 + Math.sin(a) * 7.4)} L${f(10 + Math.cos(a) * 9)} ${f(9.4 + Math.sin(a) * 9)}`} stroke={cor(AMARELO)} strokeWidth={s(0.6)} strokeLinecap="round" />; })}
      <path d="M0.4 9.4 H19.6" {...L(0.7)} />
      <path d={ondas(1, 19, 11.4, 0.6, 5)} fill="none" stroke={cor(AZUL)} strokeWidth={s(0.6)} /><path d={ondas(3, 17, 13.2, 0.5, 4)} fill="none" stroke={cor(AZUL)} strokeWidth={s(0.5)} />
      <path d="M7 5 Q8.6 4.4 9.8 5.4 Q11 3.4 14.4 2.6 Q12.4 4.6 11.4 6.2 L13 7 L10.8 7 Q9.2 7.4 8.4 6.4 L6 6.2 Q5.8 5.4 7 5 Z" fill={tinta} />
    </g>;
    case 'moeda_asteca': return <g>
      <circle cx={10} cy={10} r={9} fill={cor(OURO)} {...C(0.8)} />
      <path d="M17.8 5.6 Q19.4 7 19 8.6" stroke={tinta} strokeWidth={s(0.5)} fill="none" />
      <circle cx={10} cy={10} r={7.2} {...L(0.4)} />
      {Array.from({ length: 16 }, (_, k) => { const a = (k / 16) * Math.PI * 2; return <path key={k} d={`M${f(10 + Math.cos(a) * 7.2)} ${f(10 + Math.sin(a) * 7.2)} L${f(10 + Math.cos(a + 0.2) * 8.4)} ${f(10 + Math.sin(a + 0.2) * 8.4)}`} {...L(0.35)} />; })}
      <path d="M6.2 9 Q6.2 4.8 10 4.8 Q13.8 4.8 13.8 9 Q13.8 11 12.4 11.6 V13.6 H7.6 V11.6 Q6.2 11 6.2 9 Z" fill={cor(AMARELO)} {...C(0.5)} />
      <circle cx={8.4} cy={8.8} r={1.1} fill={tinta} /><circle cx={11.6} cy={8.8} r={1.1} fill={tinta} /><path d="M10 10.2 L9.4 11.2 H10.6 Z" fill={tinta} />
      <path d="M8.6 13.6 V12.2 M10 13.6 V12.2 M11.4 13.6 V12.2" {...L(0.3)} />
    </g>;
    case 'bau_do_coracao': return <g>
      <path d="M2.4 7.2 L3.8 1 H16.2 L17.6 7.2 Z" fill={cor(MARROM)} {...C(0.6)} />
      <path d="M10 9.4 Q6.4 6.8 7.2 4.8 Q8.2 3.2 10 5 Q11.8 3.2 12.8 4.8 Q13.6 6.8 10 9.4 Z" fill={cor(VERMELHO)} {...C(0.55)} />
      <path d="M5.4 4.4 l-1 -0.6 M14.6 4.4 l1 -0.6 M10 2.4 v-1" {...L(0.35)} />
      <rect x={1.4} y={7.2} width={17.2} height={8.6} rx={0.6} fill={cor(MARROM)} {...C(0.7)} />
      <path d="M4.6 7.2 V15.8 M15.4 7.2 V15.8 M1.4 11.4 H18.6" stroke={cor(CINZA1)} strokeWidth={s(0.8)} />
      <rect x={8.6} y={9.8} width={2.8} height={3.2} fill={cor(CINZA3)} {...C(0.4)} /><path d="M10 11 V12.2" {...L(0.4)} />
      {[[2.6, 8.4], [17.4, 8.4], [2.6, 14.6], [17.4, 14.6]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r={0.3} fill={tinta} />)}
    </g>;
    /* ---------------- The Office */
    case 'caneca_de_chefe': return <g>
      <path d="M2.4 4.6 H14.2 V16.6 Q14.2 18.6 12.2 18.6 H4.4 Q2.4 18.6 2.4 16.6 Z" fill={cor(BRANCO)} {...C(0.8)} />
      <path d="M14.2 7 Q18.6 7 18.4 10.8 Q18.2 14.2 14.2 14" fill="none" stroke={tinta} strokeWidth={s(1.3)} />
      {letra('MELHOR', 8.3, 9.2, 2.2, { larg: 9 })}{letra('CHEFE', 8.3, 12.2, 2.6, { larg: 9.4, peso: 900 })}{letra('DO MUNDO', 8.3, 14.8, 1.7, { larg: 8.4 })}
      <path d="M5.4 3.4 Q4.6 2.2 5.6 1.2 M8.4 3.4 Q7.6 2 8.6 0.8 M11.4 3.4 Q10.6 2.2 11.6 1.2" {...L(0.4)} />
    </g>;
    case 'grampeador_gelatina': return <g>
      <path d="M1.2 7.2 L4.6 3.4 H18.8 L15.4 7.2 Z" fill={cor(AMARELO)} opacity={0.75} {...C(0.6)} />
      <path d="M15.4 7.2 L18.8 3.4 V14.4 L15.4 18.4 Z" fill={cor(AMARELO)} opacity={0.9} {...C(0.6)} />
      <rect x={1.2} y={7.2} width={14.2} height={11.2} fill={cor(AMARELO)} opacity={0.55} {...C(0.6)} />
      <path d="M3.6 15.4 H12.6 L13.2 14.4 H4 Z" fill={tinta} />
      <path d="M3.8 14.2 Q3.6 11.6 5.6 11.2 L12.6 11 Q13.4 11.4 13 13 L12.6 13.8 Z" fill={cor(CINZA1)} {...C(0.4)} />
      <path d="M5 12 L12 11.8" stroke={cor(CINZA3)} strokeWidth={s(0.3)} />
      <path d="M2.4 8.6 Q3 8 3.8 8.4 M16.2 9 l1.4 -1.6" stroke={cor(BRANCO)} strokeWidth={s(0.4)} fill="none" />
      <path d="M0.4 19.4 Q1 18.6 1.6 19.4 M16.8 19 Q17.4 18.2 18 19" {...L(0.3)} />
    </g>;
    case 'beterrabas': return <g>
      <path d="M5.4 7.6 Q2.6 4 3 0.8 Q5.4 2.4 6.4 6 M8 6.6 Q8 2.6 10.4 0.6 Q11.4 3.6 9.2 7 M10.4 7.6 Q13 3.6 15.4 2.8 Q15 6.2 11.6 8.4" fill={cor(VERDE)} {...C(0.5)} />
      <path d="M4.2 3 L6 6.6 M10 2 L9 6.6 M14 4.4 L11.2 8" stroke={cor(VINHO)} strokeWidth={s(0.3)} />
      <path d="M5.4 7.4 Q1 8 1.2 12.4 Q1.6 16 4.6 16.8 L5 19.6 L6 16.8 Q9.4 15.6 9.4 11.6 Q9 7.6 5.4 7.4 Z" fill={cor(VINHO)} {...C(0.6)} />
      <path d="M11 8.2 Q7.2 8.8 7.6 13 Q8 16.4 10.8 17.2 L11.6 19.4 L12.4 17 Q15.4 15.8 15.2 12.2 Q14.8 8.2 11 8.2 Z" fill={cor(VINHO)} {...C(0.6)} />
      <path d="M5.6 7.4 Q7.6 8.4 10.6 8" {...L(0.5)} />
      <path d="M3 11 Q3.6 9.6 4.6 9.4 M9.4 11.6 Q10 10.4 11 10.2" stroke={cor(BRANCO)} strokeWidth={s(0.35)} fill="none" opacity={0.7} />
    </g>;
    /* ---------------- Zelda */
    case 'escudo_do_heroi': { const c = W / 2; return <g>
      <path d={`M${c} 4 V0.6`} {...L(1)} /><path d={`M${c - 3} 3.4 Q${c - 1.6} 4.4 ${c} 3.6 Q${c + 1.6} 4.4 ${c + 3} 3.4 L${c + 2.4} 2.6 Q${c + 1} 3.2 ${c} 2.8 Q${c - 1} 3.2 ${c - 2.4} 2.6 Z`} fill={cor(ROXO)} {...C(0.4)} />
      <path d={`M1 4.6 H${W - 1} V11.4 Q${W - 1} 16.8 ${c} 19.4 Q1 16.8 1 11.4 Z`} fill={cor(CINZA3)} {...C(0.7)} />
      <path d={`M2.2 5.8 H${W - 2.2} V11.4 Q${W - 2.2} 15.8 ${c} 18 Q2.2 15.8 2.2 11.4 Z`} fill={cor(AZUL)} {...C(0.4)} />
      <path d={`M${c} 7 L${c + 1.3} 9.2 H${c - 1.3} Z M${c - 1.3} 9.2 L${c} 11.4 H${c - 2.6} Z M${c + 1.3} 9.2 L${c + 2.6} 11.4 H${c} Z`} fill={cor(OURO)} {...C(0.25)} />
      <path d={`M${c} 12 L${c - 1} 13.2 Q${c - 3} 12.4 ${c - 4.6} 13.2 Q${c - 3.4} 14 ${c - 4} 14.8 Q${c - 2.2} 14.6 ${c - 1.4} 15 L${c} 17 L${c + 1.4} 15 Q${c + 2.2} 14.6 ${c + 4} 14.8 Q${c + 3.4} 14 ${c + 4.6} 13.2 Q${c + 3} 12.4 ${c + 1} 13.2 Z`} fill={cor(VERMELHO)} {...C(0.3)} />
    </g>; }
    case 'triangulos_dourados': { const c = 10, y0 = 1.2, h = 9.4, b = 5.4; return <g>
      {[-1, 1].map(k => <g key={k}>{[0, 1, 2].map(j => <path key={j} d={`M${c + k * (b + 0.6)} ${y0 + h * 0.75 - j * 0.6} Q${c + k * (b + 3 + j * 0.6)} ${y0 + 1 + j * 2.2} ${c + k * (9.6 - j * 0.4)} ${y0 + 1.2 + j * 2.6} Q${c + k * (b + 3)} ${y0 + 4.6 + j * 2} ${c + k * (b + 0.8)} ${y0 + h * 0.85 - j * 0.2}`} fill={cor(CINZA3)} {...C(0.35)} />)}</g>)}
      <path d={`M${c} ${y0} L${c + b / 2} ${y0 + h / 2} H${c - b / 2} Z M${c - b / 2} ${y0 + h / 2} L${c} ${y0 + h} H${c - b} Z M${c + b / 2} ${y0 + h / 2} L${c + b} ${y0 + h} H${c} Z`} fill={cor(OURO)} {...C(0.55)} />
    </g>; }
    /* ---------------- Super Mario */
    case 'cogumelo_de_pintas': return <g>
      <path d="M1.4 11 Q1 2 10 1.6 Q19 2 18.6 11 Q10 12.6 1.4 11 Z" fill={cor(VERMELHO)} {...C(0.8)} />
      <circle cx={10} cy={5.4} r={2.4} fill={cor(BRANCO)} {...C(0.4)} /><path d="M2.2 8.4 Q3.6 6 5.4 7.6 Q5 10 2.6 10.2 Z M17.8 8.4 Q16.4 6 14.6 7.6 Q15 10 17.4 10.2 Z" fill={cor(BRANCO)} {...C(0.4)} />
      <path d="M5.6 11.6 Q5 18.4 7 18.8 H13 Q15 18.4 14.4 11.6 Q10 12.4 5.6 11.6 Z" fill={cor(CREME)} {...C(0.8)} />
      <ellipse cx={8.6} cy={14.8} rx={0.6} ry={1.3} fill={tinta} /><ellipse cx={11.4} cy={14.8} rx={0.6} ry={1.3} fill={tinta} />
    </g>;
    case 'estrela_de_olhos': return <g>
      <path d={estrela(10, 10.8, 9.4, 5, 4.4)} fill={cor(AMARELO)} {...C(0.9)} />
      <ellipse cx={8.4} cy={10.4} rx={0.7} ry={1.6} fill={tinta} /><ellipse cx={11.6} cy={10.4} rx={0.7} ry={1.6} fill={tinta} />
      <path d={estrela(10, 10.8, 6.6, 5, 3.1)} fill="none" stroke={cor(BRANCO)} strokeWidth={s(0.4)} opacity={0.6} />
    </g>;
    case 'cano_verde': { const c = W / 2; return <g>
      <path d={`M${c} 9 V5.6`} stroke={cor(VERDE)} strokeWidth={s(1)} /><path d={`M${c} 8.6 Q${c - 3} 6.8 ${c - 3.4} 8.4 Q${c - 2} 9.4 ${c} 8.6 Z M${c} 8.6 Q${c + 3} 6.8 ${c + 3.4} 8.4 Q${c + 2} 9.4 ${c} 8.6 Z`} fill={cor(VERDE_CLARO)} {...C(0.35)} />
      <circle cx={c} cy={3.6} r={3} fill={cor(VERMELHO)} {...C(0.6)} />
      <path d={`M${c - 2.8} 4.4 L${c + 2.8} 3 L${c + 2.4} 4.8 Q${c} 6.2 ${c - 2.4} 5.4 Z`} fill={cor(BRANCO)} {...C(0.35)} />
      <circle cx={c - 1.4} cy={1.8} r={0.5} fill={cor(BRANCO)} /><circle cx={c + 1.4} cy={2.2} r={0.4} fill={cor(BRANCO)} />
      <rect x={0.6} y={9} width={W - 1.2} height={3.2} rx={0.4} fill={cor(VERDE)} {...C(0.7)} />
      <rect x={1.8} y={12.2} width={W - 3.6} height={7.2} fill={cor(VERDE)} {...C(0.7)} />
      <path d={`M3.4 13 V18.8 M2 9.8 V11.6`} stroke={cor(VERDE_CLARO)} strokeWidth={s(0.7)} />
    </g>; }
    /* ---------------- Sailor Moon */
    case 'broche_da_lua': return <g>
      <circle cx={10} cy={10} r={8.8} fill={cor(OURO)} {...C(0.8)} /><circle cx={10} cy={10} r={6.4} fill={cor(ROSA)} {...C(0.4)} />
      <path d="M12.6 6 A4.6 4.6 0 1 0 12.6 14 A3.6 3.6 0 1 1 12.6 6 Z" fill={cor(AMARELO)} {...C(0.4)} />
      {[[10, 2.2, VERMELHO], [17.8, 10, AZUL], [10, 17.8, VERDE], [2.2, 10, LARANJA]].map(([x, y, c], k) => <circle key={k} cx={x as number} cy={y as number} r={1.1} fill={cor(c as string)} {...C(0.3)} />)}
      <path d={estrela(14.2, 13.4, 0.9, 4, 0.3)} fill={cor(BRANCO)} />
    </g>;
    case 'gata_da_lua': { const c = W / 2; return <g>
      <path d={`M${c - 4.6} 19.4 Q${c - 6} 13 ${c - 3} 10.6 Q${c - 4.4} 9 ${c - 4.2} 6.6 L${c - 4.6} 1.6 L${c - 2} 3.8 Q${c} 3.2 ${c + 2} 3.8 L${c + 4.6} 1.6 L${c + 4.2} 6.6 Q${c + 4.4} 9 ${c + 3} 10.6 Q${c + 6} 13 ${c + 4.6} 19.4 Z`} fill={tinta} />
      <path d={`M${c + 4.4} 18.8 Q${W - 0.2} 18.6 ${W - 0.6} 15 Q${W - 1} 13 ${W - 2} 14`} fill="none" stroke={tinta} strokeWidth={s(1.3)} strokeLinecap="round" />
      <path d={`M${c + 1.2} 4.4 A1.6 1.6 0 1 0 ${c + 1.2} 6.8 A1.2 1.2 0 1 1 ${c + 1.2} 4.4 Z`} fill={cor(BRANCO)} />
      <path d={`M${c - 2.6} 7.6 Q${c - 1.8} 7 ${c - 1} 7.6 Q${c - 1.8} 8.4 ${c - 2.6} 7.6 Z M${c + 2.6} 7.6 Q${c + 1.8} 7 ${c + 1} 7.6 Q${c + 1.8} 8.4 ${c + 2.6} 7.6 Z`} fill={cor(BRANCO)} />
      <path d={`M${c - 0.4} 9 H${c + 0.4} L${c} 9.4 Z`} fill={cor(BRANCO)} />
    </g>; }
    /* ---------------- Attack on Titan */
    case 'asas_cruzadas': { const c = W / 2; const pena = (k: 1 | -1) => `M${c - k * 0.6} 16 Q${c + k * 1.4} 9 ${c + k * 6.4} 3.2 Q${c + k * 5.6} 6 ${c + k * 6.2} 6.8 Q${c + k * 4.8} 8.2 ${c + k * 5.2} 9.2 Q${c + k * 3.8} 10.6 ${c + k * 4.2} 11.6 Q${c + k * 2.6} 13 ${c - k * 0.6} 16 Z`; return <g>
      <path d={`M0.8 1 H${W - 0.8} V11 Q${W - 0.8} 16.4 ${c} 19.4 Q0.8 16.4 0.8 11 Z`} fill={cor(CREME)} {...C(0.7)} />
      <path d={pena(-1)} fill={cor(BRANCO)} {...C(0.5)} /><path d={pena(1)} fill={cor(AZUL)} {...C(0.5)} />
      <path d={`M${c + 1} 13 L${c + 4.6} 7 M${c - 1} 13 L${c - 4.6} 7`} {...L(0.3)} />
    </g>; }
    case 'gigante_no_muro': return <g>
      <path d="M3.6 9.6 Q2.6 0.4 10 0.4 Q17.4 0.4 16.4 9.6 Z" fill={cor(PELE_ROSA)} {...C(0.7)} />
      {[5, 6.6, 13.4, 15].map(x => <path key={x} d={`M${x} 2.4 Q${x + (x < 10 ? -0.6 : 0.6)} 5 ${x} 8.4`} {...L(0.3)} />)}
      <path d="M6 3.6 L9 4.4 M14 3.6 L11 4.4" {...L(0.6)} />
      <ellipse cx={7.6} cy={5} rx={1.3} ry={0.9} fill={tinta} /><ellipse cx={12.4} cy={5} rx={1.3} ry={0.9} fill={tinta} /><circle cx={7.8} cy={4.9} r={0.35} fill={cor(BRANCO)} /><circle cx={12.2} cy={4.9} r={0.35} fill={cor(BRANCO)} />
      <path d="M9.4 5.6 L10 6.4 L10.6 5.6" {...L(0.35)} />
      <path d="M4.8 7 Q10 8.2 15.2 7 L15 9.6 H5 Z" fill={cor(BRANCO)} {...C(0.45)} />
      {[6, 7.2, 8.4, 9.6, 10.8, 12, 13.2, 14.4].map(x => <path key={x} d={`M${x} 7.4 V9.6`} {...L(0.25)} />)}
      <rect x={0.4} y={9.4} width={19.2} height={H - 9.8} fill={cor(CINZA3)} {...C(0.7)} />
      {[11.4, 13.4].map(y => <path key={y} d={`M0.4 ${y} H19.6`} {...L(0.3)} />)}
      {[[3, 9.4, 11.4], [8, 9.4, 11.4], [13, 9.4, 11.4], [18, 9.4, 11.4], [5.4, 11.4, 13.4], [10.6, 11.4, 13.4], [15.6, 11.4, 13.4], [3, 13.4, H - 0.4], [8, 13.4, H - 0.4], [13, 13.4, H - 0.4], [18, 13.4, H - 0.4]].map(([x, a, b], k) => <path key={k} d={`M${x} ${a} V${b}`} {...L(0.3)} />)}
      {[0.8, 2, 3.2, 15.6, 16.8, 18].map(x => <path key={x} d={`M${x} 10.8 V9 Q${x + 0.5} 8.2 ${x + 1} 9 V10.8`} fill={cor(PELE_ROSA)} {...C(0.4)} />)}
    </g>;
    /* ---------------- obras de uma peça só */
    case 'rosquinha_rosa': { const cs = [AZUL, AMARELO, VERDE, BRANCO, LARANJA, ROXO]; return <g>
      <path d="M1.2 10 A8.8 8.8 0 1 0 18.8 10 A8.8 8.8 0 1 0 1.2 10 Z M7.4 10 A2.6 2.6 0 1 1 12.6 10 A2.6 2.6 0 1 1 7.4 10 Z" fill={cor(LARANJA)} fillRule="evenodd" {...C(0.8)} />
      <path d="M2.8 9.4 Q2.6 3 10 2.6 Q17.4 3 17.4 9.6 Q16.6 11 17 13 Q15.6 16.6 12 17 Q10.4 16.4 9 17.2 Q4.6 16.8 3.2 13.4 Q3.6 11.6 2.8 9.4 Z M6.8 10 A3.2 3.2 0 1 0 13.2 10 A3.2 3.2 0 1 0 6.8 10 Z" fill={cor(ROSA)} fillRule="evenodd" {...C(0.5)} />
      {Array.from({ length: 14 }, (_, k) => { const a = (k / 14) * Math.PI * 2 + 0.3, r = 4.6 + (k % 3) * 1.3; const x = 10 + Math.cos(a) * r, y = 10 + Math.sin(a) * r; return <path key={k} d={`M${f(x)} ${f(y)} l${f(Math.cos(a * 3) * 0.9)} ${f(Math.sin(a * 3) * 0.9)}`} stroke={cor(cs[k % cs.length])} strokeWidth={s(0.55)} strokeLinecap="round" />; })}
    </g>; }
    case 'cabine_azul': { const c = W / 2; return <g>
      <rect x={c - 0.6} y={0.4} width={1.2} height={1.4} fill={cor(BRANCO)} {...C(0.35)} />
      <path d={`M1 3 L${c} 1.6 L${W - 1} 3 Z`} fill={cor(AZUL)} {...C(0.5)} />
      <rect x={0.6} y={3} width={W - 1.2} height={1.8} fill={tinta} />{letra('CABINE', c, 4.4, 1.3, { larg: W - 2.6, fill: cor(BRANCO) })}
      <rect x={1.2} y={4.8} width={W - 2.4} height={13.6} fill={cor(AZUL)} {...C(0.6)} />
      <path d={`M${c} 4.8 V18.4`} {...L(0.4)} />
      {[0, 1, 2].map(j => [0, 1].map(i => <rect key={`${i}${j}`} x={i ? c + 0.8 : 2} y={5.8 + j * 4.2} width={c - 2.8} height={3.4} fill={j === 0 ? cor(BRANCO) : 'none'} {...C(0.3)} />))}
      <rect x={0.4} y={18.4} width={W - 0.8} height={1.2} fill={cor(AZUL)} {...C(0.5)} />
    </g>; }
    case 'rastro_de_fogo': return <g>
      {[4, 8.4].map((y, k) => <g key={k}><path d={`M0.4 ${y} Q1.4 ${y - 0.8} 1.6 ${y - 1.6} Q2.4 ${y - 0.6} 3 ${y - 0.4} Q3.4 ${y - 2.4} 4.6 ${y - 3} Q4.6 ${y - 1.4} 5.6 ${y - 0.6} Q6.4 ${y - 2} 7.6 ${y - 2.4} Q7.4 ${y - 1} 8.4 ${y - 0.4} Q9.4 ${y - 1.6} 10.6 ${y - 1.4} Q10 ${y - 0.6} 11.6 ${y} Z`} fill={cor(LARANJA)} {...C(0.4)} />
        <path d={`M2.6 ${y} Q3.6 ${y - 0.4} 4.4 ${y - 1.6} Q4.8 ${y - 0.4} 6 ${y} M7 ${y} Q7.8 ${y - 0.4} 8 ${y - 1.2} Q8.6 ${y - 0.4} 9.6 ${y}`} fill={cor(AMARELO)} />
        <path d={`M0.4 ${y + 0.3} H12`} {...L(0.5)} /></g>)}
      {letra('88', 16, 8.4, 6.4, { peso: 900, fonte: "'Arial Black', Impact, sans-serif", larg: 7 })}
    </g>;
    case 'quatro_elementos': return <g>
      <circle cx={10} cy={10} r={9} {...L(0.8)} /><path d="M3.6 3.6 L16.4 16.4 M16.4 3.6 L3.6 16.4" {...L(0.3)} />
      <path d={`M7.4 5.4 q0.7 -0.8 1.3 0 t1.3 0 t1.3 0 t1.3 0 M7.4 3.8 q0.7 -0.8 1.3 0 t1.3 0 t1.3 0 t1.3 0`} {...L(0.45)} />
      <path d="M13.6 11.6 L15.4 8.2 L17.2 11.6 Z M14.4 10 H16.4" {...L(0.45)} />
      <path d="M10 17.4 Q8.2 16.4 8.8 14.6 Q9.4 15.4 9.8 15 Q9.4 13.6 10.6 12.8 Q10.8 14.4 11.4 14.6 Q12 16.6 10 17.4 Z" fill={tinta} />
      <path d={espiral(4.6, 10, 2.2, 1.8)} {...L(0.45)} />
      <circle cx={10} cy={10} r={1.2} fill={tinta} />
    </g>;
    case 'rosa_na_redoma': { const c = W / 2; return <g>
      <path d={`M${c} 13 V7.4`} stroke={cor(VERDE)} strokeWidth={s(0.6)} /><path d={`M${c} 11 Q${c + 2.4} 9.6 ${c + 2.6} 11 Q${c + 1.4} 12 ${c} 11 Z`} fill={cor(VERDE)} {...C(0.3)} />
      <path d={`M${c - 2} 6.6 Q${c - 2.4} 3.4 ${c} 3.6 Q${c + 2.4} 3.4 ${c + 2} 6.6 Q${c} 8.4 ${c - 2} 6.6 Z`} fill={cor(VERMELHO)} {...C(0.45)} /><path d={`M${c - 0.8} 5 Q${c} 4.2 ${c + 0.8} 5.2 Q${c} 6.6 ${c - 0.4} 5.6`} {...L(0.3)} />
      <path d={`M${c + 2.4} 15.4 Q${c + 3.4} 14.4 ${c + 4} 15.2 Q${c + 3.2} 16 ${c + 2.4} 15.4 Z`} fill={cor(VERMELHO)} {...C(0.25)} />
      <path d={`M1.6 15.8 V7 Q1.6 1 ${c} 1 Q${W - 1.6} 1 ${W - 1.6} 7 V15.8`} {...L(0.6)} /><circle cx={c} cy={0.8} r={0.6} fill={tinta} />
      <path d={`M3 6 Q3.4 3.4 5 2.6`} stroke={cor(BRANCO)} strokeWidth={s(0.5)} fill="none" strokeLinecap="round" />
      <path d={`M0.6 15.8 H${W - 0.6} L${W - 1.4} 19.4 H1.4 Z`} fill={cor(MARROM)} {...C(0.6)} />
      <path d={`M${c - 1.6} 13 H${c + 1.6} L${c + 1.2} 15.8 H${c - 1.2} Z`} fill={cor(MARROM)} {...C(0.4)} />
    </g>; }
    case 'sapatinhos_vermelhos': { const sap = (x: number, y: number) => <g key={x}>
      <path d={`M${x} ${y} Q${x + 2} ${y - 4.4} ${x + 5} ${y - 4.2} L${x + 7.4} ${y - 6.6} Q${x + 8.6} ${y - 7} ${x + 8.8} ${y - 5.6} L${x + 8} ${y - 3.6} L${x + 7.6} ${y + 0.4} L${x + 6.8} ${y + 0.4} L${x + 6.6} ${y - 2.2} Q${x + 3} ${y + 0.6} ${x} ${y} Z`} fill={cor(VERMELHO)} {...C(0.6)} />
      <path d={`M${x + 3} ${y - 3.4} Q${x + 2.4} ${y - 4.6} ${x + 3.4} ${y - 4.4} Q${x + 3.8} ${y - 3.8} ${x + 3} ${y - 3.4} Q${x + 3.2} ${y - 2.4} ${x + 4.2} ${y - 2.8}`} fill={cor(VERMELHO)} {...C(0.35)} />
      {[0, 1, 2, 3, 4].map(k => <circle key={k} cx={f(x + 1.6 + sorte(k + x) * 5.4)} cy={f(y - 1 - sorte(k + x + 9) * 3)} r={0.2} fill={cor(BRANCO)} />)}</g>;
      return <g>{sap(0.6, 12.6)}{sap(9.6, 9.6)}<path d={estrela(17, 2, 1.1, 4, 0.3)} fill={tinta} /><path d={estrela(2.4, 3.4, 0.8, 4, 0.25)} fill={tinta} /></g>; }
    case 'leao_na_pedra': return <g>
      <circle cx={10} cy={8.4} r={7.4} fill={cor(LARANJA)} {...C(0.6)} />
      <path d="M0.4 19.6 V12 Q3 11 6 10.8 L13.6 10.2 L14 10.8 L9.4 12 Q8.4 15 9.6 19.6 Z" fill={tinta} />
      <path d="M10.6 10.4 L10.8 9 Q11.2 8.2 12 8.4 L12.4 7.6 Q13.2 7.4 13.4 8.2 L13.4 9.6 L13.2 10.4 Z" fill={tinta} />
      <path d="M12.8 7.6 Q13.8 7 13.6 8.4" fill={tinta} {...C(0.3)} />
      <path d="M0.4 17.6 Q6 16.6 19.6 17 M15.4 17 V13 M13.6 13.2 Q15.4 11.8 17.4 13.2 Z" {...L(0.5)} /><path d="M13.6 13.2 Q15.4 11.8 17.4 13.2 Z" fill={tinta} />
      <path d="M3 4 l0.8 0.5 l0.8 -0.5 M5.2 2.6 l0.6 0.4 l0.6 -0.4" {...L(0.35)} />
    </g>;
    case 'barbatana': return <g>
      <path d="M6.6 8.4 Q8.4 6 9.4 1.6 Q12.4 4 13.6 8.4 Z" fill={tinta} />
      <path d={ondas(0.4, 19.6, 8.6, 0.7, 6)} {...L(0.7)} /><path d={ondas(3, 17, 10.6, 0.6, 4)} {...L(0.45)} />
      <path d="M14.4 7.8 Q16 7.6 17.4 8.4 M5.8 7.8 Q4.4 7.6 3 8.4" {...L(0.4)} />
      <path d="M15.4 4.6 V1.2 L17.2 0.6 V4" {...L(0.4)} /><ellipse cx={14.8} cy={4.6} rx={0.7} ry={0.5} fill={tinta} /><ellipse cx={16.6} cy={4} rx={0.7} ry={0.5} fill={tinta} />
      <path d="M15.4 1.8 L17.2 1.2" {...L(0.4)} />
    </g>;
    case 'toalha_42': return <g>
      <path d="M1.4 9.4 H18.6 V14.8 H1.4 Z" fill={cor(AZUL)} {...C(0.6)} />
      <path d="M2.4 1 H17.6 Q18.6 1 18.6 2 V9.4 H1.4 V2 Q1.4 1 2.4 1 Z" fill={cor(AMARELO)} {...C(0.6)} />
      <path d="M1.4 2.6 H18.6 M1.4 11.4 H18.6" stroke={cor(BRANCO)} strokeWidth={s(0.5)} />
      {[3, 5, 7, 9, 11, 13, 15, 17].map(x => <path key={x} d={`M${x} 14.8 V16.2`} {...L(0.3)} />)}
      {letra('42', 10, 8.4, 5.4, { peso: 900, fonte: "'Arial Black', Impact, sans-serif", larg: 7 })}
    </g>;
  }
  return desenho129b(id, p);
}

/** Os bichos e a natureza. */
function desenho129b(id: string, p: PincelDaTatuagem): ReactNode | undefined {
  const { tinta, cor, traco, W } = p;
  const s = (w: number) => w * traco;
  const L = (w: number) => ({ fill: 'none', stroke: tinta, strokeWidth: s(w), strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const });
  const C = (w: number) => ({ stroke: tinta, strokeWidth: s(w), strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const });
  /** Rascunho: o traço repetido de leve, deslocado (o sketch). */
  const rascunho = (d: string, w = 0.45) => <g><path d={d} {...L(w)} /><path d={d} {...L(w * 0.6)} transform="translate(0.28 0.18)" opacity={0.45} /></g>;
  /** A mancha da aquarela. */
  const mancha = (cx: number, cy: number, rx: number, ry: number, c: string, k = 0, op = 0.4) => <path d={`M${cx - rx} ${cy} Q${cx - rx} ${cy - ry * 1.1} ${cx - rx * 0.2} ${cy - ry} Q${cx + rx * 0.4} ${cy - ry * 1.2} ${cx + rx} ${cy - ry * 0.3} Q${cx + rx * 1.1} ${cy + ry * 0.6} ${cx + rx * 0.3} ${cy + ry} Q${cx - rx * 0.3} ${cy + ry * (1 + sorte(k) * 0.3)} ${cx - rx * 0.8} ${cy + ry * 0.6} Q${cx - rx * 1.2} ${cy + ry * 0.3} ${cx - rx} ${cy} Z`} fill={cor(c)} opacity={op} />;
  const pinheiro = (x: number, y: number, h: number, c?: string) => <path d={`M${x} ${y - h} L${x + h * 0.22} ${y - h * 0.62} H${x + h * 0.12} L${x + h * 0.34} ${y - h * 0.3} H${x + h * 0.2} L${x + h * 0.42} ${y} H${x - h * 0.42} L${x - h * 0.2} ${y - h * 0.3} H${x - h * 0.34} L${x - h * 0.12} ${y - h * 0.62} H${x - h * 0.22} Z`} fill={c ? cor(c) : tinta} {...C(0.35)} />;
  switch (id) {
    /* ================================================================ BICHOS */
    case 'cachorro_fine': return <g {...L(0.5)}>
      <path d="M7.2 4.6 Q10.4 2.6 13.6 4.4 Q15.4 5.6 15.6 8.4 Q16 9.6 17.8 10.8 Q19 11.8 18.6 13 Q18 14.2 16.4 14 Q15 15.6 12.6 15.4 Q10.6 15.2 9.6 13.8" />
      <path d="M7.4 4.6 Q4 4 3.2 8 Q2.6 12 4 13.2 Q5.4 13.6 6.4 11.4 Q7.4 9 7.6 6.6" />
      <path d="M9.4 13.4 Q8 15.4 8.6 18.6 M14.6 15.4 Q15.4 17.4 15 19" /><path d="M8.6 17.2 Q12 18.6 15.2 17.4" />
      <circle cx={12} cy={19} r={0.8} /><path d="M11 7.4 Q12.2 6.6 13.4 7.4" /><circle cx={12.4} cy={8.4} r={0.55} fill={tinta} />
      <ellipse cx={18.1} cy={11.4} rx={0.9} ry={0.65} fill={tinta} /><path d="M18 12.6 Q17.4 13.4 16.2 13.2" />
    </g>;
    case 'gato_dormindo': return <g>
      <path d="M4 10.6 Q2.6 4.6 9.4 3.8 Q16 3.4 18 8 Q19.4 12 15 13 H7" {...L(0.6)} />
      <path d="M17.6 9.6 Q17.6 13.2 12 13.2 Q8 13.2 5.4 12.6" {...L(0.6)} />
      <path d="M3 11 Q2.2 8.4 3.6 7.2 L3.6 4.8 L5.4 6.4 Q6.6 6 7.6 6.4 L9 4.8 L9.2 7.4 Q10.2 9.4 8.8 11 Q6.4 12.6 3 11 Z" fill={cor(BRANCO)} {...C(0.6)} />
      <path d="M4.6 8.8 Q5.2 9.4 5.8 8.8 M7 8.8 Q7.6 9.4 8.2 8.8" {...L(0.4)} /><path d="M6.2 10 L6.4 10.4 L6.6 10" {...L(0.3)} />
    </g>;
    case 'cavalo_galope': return <g>
      <path d="M19.6 5.4 L18.4 6.4 Q16.8 6.2 15.8 5.6 Q15.2 7.2 14.4 8.6 L16.6 9.6 L18.8 11.4 L18.2 12.2 L16.2 10.8 L13.6 10.4 Q11 11 8 10.6 L6.2 11.2 L3.6 13.6 L1.2 14.8 L0.8 14.2 L3 12.6 L4.6 10 Q3.6 8.4 3.4 7.2 Q2 7.6 0.6 9 Q1 6.6 3.2 5.6 Q6 4.8 10 5.4 Q12.4 5 13.4 3.6 L14.6 1.8 L14.8 0.4 L15.6 1.4 Q17.6 2.2 19.6 5.4 Z" fill={tinta} />
      <path d="M14 9.8 L15.2 12.4 L14.2 13.8 M6.8 10.8 L5.8 13.2 L6.8 14.8" fill="none" stroke={tinta} strokeWidth={s(1)} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={16.4} cy={3.2} r={0.3} fill={cor(BRANCO)} />
      <path d="M13.8 3.6 Q12.6 5 11.6 5.2 M14.4 4.6 Q13.4 5.8 12.4 6 M8 6.6 Q10 7.4 11.6 6.8" stroke={cor(BRANCO)} strokeWidth={s(0.3)} fill="none" strokeLinecap="round" />
    </g>;
    case 'coelho_sketch': return <g>
      {rascunho('M3 18.6 Q1.6 12 6 10 Q9.4 8.8 11.6 11.4 Q14 15 12.6 18.6 Z')}
      {rascunho('M9.6 9.6 Q8.4 6.4 10.6 5.6 Q13.4 5 14 7.6 Q14.4 10 12 10.6')}
      {rascunho('M10.4 5.8 Q8.6 2 9.6 0.8 Q11 1.6 11.6 5.4 M12 5.4 Q12.6 1.4 14 1 Q14.6 2.6 13 6.2')}
      {rascunho('M3.6 15 Q1.4 14.4 1.6 16.4 Q2 18 3.6 17.4', 0.4)}
      <circle cx={12.6} cy={7.4} r={0.45} fill={tinta} /><path d="M14 8.6 l-0.5 0.3 M14 8.6 l1.6 -0.4 M14 8.6 l1.6 0.4" {...L(0.25)} />
      <path d="M8 18.6 Q10.4 18 12.6 18.6" {...L(0.4)} />
      {[0, 1, 2, 3, 4].map(k => <path key={k} d={`M${3.4 + k * 0.9} ${17.8 - k * 0.2} l1.4 -2.4`} {...L(0.2)} opacity={0.6} />)}
    </g>;
    case 'urso_geometrico': { const fac = (m: 1 | -1, c: string) => { const X = (x: number) => (m === 1 ? x : 20 - x); return <path d={`M${X(6.4)} 3.4 L${X(7)} 8.4 M${X(3)} 6 L${X(7)} 8.4 M${X(2)} 11 L${X(7)} 8.4 M${X(7)} 8.4 L${X(7.6)} 11 M${X(2)} 11 L${X(6.6)} 14 M${X(5.4)} 16.2 L${X(6.6)} 14 M10 3.4 L${X(7)} 8.4 M${X(7.6)} 11 L10 10 M${X(7.6)} 11 L${X(6.6)} 14 L10 16.6`} fill="none" stroke={c} strokeWidth={s(0.4)} strokeLinejoin="round" />; }; return <g>
      <circle cx={4.6} cy={3.6} r={2.2} fill={tinta} /><circle cx={15.4} cy={3.6} r={2.2} {...L(0.6)} /><circle cx={15.4} cy={3.6} r={1} {...L(0.35)} />
      <path d="M3 6 L6.4 3.4 H10 V18.6 L5.4 16.2 L2 11 Z" fill={tinta} />
      <path d="M3 6 L6.4 3.4 H13.6 L17 6 L18 11 L14.6 16.2 L10 18.6 L5.4 16.2 L2 11 Z" {...L(0.7)} />
      {fac(1, cor(BRANCO))}{fac(-1, tinta)}
      <path d="M7 8 L8 8.8 L6.6 9 Z" fill={cor(BRANCO)} /><path d="M13 8 L12 8.8 L13.4 9 Z" fill={tinta} />
      <path d="M8.8 11.6 H11.2 L10 13 Z" fill={tinta} {...C(0.3)} />
    </g>; }
    case 'elefante_ornamental': return <g>
      <path d="M8 3.6 Q11 2.6 14 3.2 Q18.4 4 18.8 8.4 Q19 11 17.8 12.2 L17.8 17.4 H15.4 L15.2 13.4 Q12.4 14 10 13.4 L9.8 17.4 H7.4 L7.2 12.6 Q6 12.2 5.2 11.2 Q4.4 13.2 4.2 15 Q4.2 16.4 3.4 16.6 Q2.2 16.6 2.4 15 Q2.6 12.6 3.2 10.6 Q2.4 8.4 3 6.4 Q4 3.2 8 3.6 Z" fill={cor(CINZA3)} {...C(0.7)} />
      <path d="M11.2 3.2 Q15 3 17 4.6 L16.8 9.4 Q14 10.4 11.6 9.4 Z" fill={cor(BRANCO)} {...C(0.5)} />
      <path d={`M11.6 9.4 ${[0, 1, 2, 3].map(() => `q0.65 0.9 1.3 0`).join(' ')}`} {...L(0.45)} />
      {[12.2, 13.5, 14.8, 16.1].map(x => <g key={x}><path d={`M${x} 9.9 V11.2`} {...L(0.3)} /><circle cx={x} cy={11.6} r={0.35} fill={tinta} /></g>)}
      <circle cx={14} cy={6.4} r={1.3} {...L(0.4)} /><circle cx={14} cy={6.4} r={0.45} fill={tinta} />
      {[[12.4, 4.6], [15.6, 4.6], [12.4, 8.2], [15.6, 8.2]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r={0.3} fill={tinta} />)}
      <path d="M8.4 4.4 Q11.4 4.6 11 8.6 Q10.4 11 7.8 10.6 Q6.4 8.4 8.4 4.4 Z" fill={cor(CINZA2)} {...C(0.5)} />
      <circle cx={5} cy={7} r={0.45} fill={tinta} /><path d="M4.4 10.8 Q5.4 12.4 6.8 12" stroke={cor(BRANCO)} strokeWidth={s(0.6)} fill="none" strokeLinecap="round" />
      <path d="M4.4 3.8 Q5.4 4.8 6.8 3.8 M5.6 4.4 V5.4" {...L(0.35)} /><circle cx={5.6} cy={5.8} r={0.4} fill={tinta} />
    </g>;
    case 'cervo_galhada': { const c = W / 2; const g = (k: 1 | -1) => `M${c - k * 1.4} 7.6 Q${c - k * 3} 5.6 ${c - k * 3.8} 3 Q${c - k * 4.2} 1.6 ${c - k * 5} 0.8 M${c - k * 3.2} 5.2 Q${c - k * 5.2} 5 ${c - k * 6.6} 3.6 M${c - k * 3.8} 3.6 Q${c - k * 3} 2.2 ${c - k * 3} 0.8 M${c - k * 2.4} 6.6 Q${c - k * 4} 7 ${c - k * 5.2} 6.2 M${c - k * 6.6} 3.6 L${c - k * 7.6} 3.4 M${c - k * 6.6} 3.6 L${c - k * 7} 2.4`; return <g>
      {rascunho(`M${c} 18.6 Q${c - 1.6} 18.6 ${c - 1.8} 16.4 L${c - 2.8} 10.6 Q${c - 3.2} 8.6 ${c - 2} 7.8 Q${c} 7 ${c + 2} 7.8 Q${c + 3.2} 8.6 ${c + 2.8} 10.6 L${c + 1.8} 16.4 Q${c + 1.6} 18.6 ${c} 18.6 Z`, 0.5)}
      {rascunho(`M${c - 2.2} 8.4 Q${c - 5} 8 ${c - 6.2} 9.6 Q${c - 4} 10.6 ${c - 2.4} 10 M${c + 2.2} 8.4 Q${c + 5} 8 ${c + 6.2} 9.6 Q${c + 4} 10.6 ${c + 2.4} 10`)}
      {rascunho(g(1), 0.55)}{rascunho(g(-1), 0.55)}
      <path d={`M${c - 1.9} 11.2 Q${c - 1.3} 10.6 ${c - 0.7} 11.2 Q${c - 1.3} 11.8 ${c - 1.9} 11.2 Z M${c + 1.9} 11.2 Q${c + 1.3} 10.6 ${c + 0.7} 11.2 Q${c + 1.3} 11.8 ${c + 1.9} 11.2 Z`} fill={tinta} />
      <ellipse cx={c} cy={17.2} rx={1} ry={0.7} fill={tinta} />
      {[0, 1, 2].map(k => <path key={k} d={`M${c - 1.4 + k * 0.5} ${13 + k * 0.6} l0.6 0.8`} {...L(0.2)} opacity={0.6} />)}
    </g>; }
    case 'onca_pintada': return <g>
      <path d="M10 2.2 Q15.2 2.2 16.8 6 L18.6 4.4 Q19.6 6.8 18 9 Q18.6 13 16 15.6 Q13.6 18.6 10 18.6 Q6.4 18.6 4 15.6 Q1.4 13 2 9 Q0.4 6.8 1.4 4.4 L3.2 6 Q4.8 2.2 10 2.2 Z" fill={cor(AMARELO)} {...C(1.1)} />
      <path d="M2.4 5.8 L1.8 5 Q1.4 6.6 2.4 7.6 Z M17.6 5.8 L18.2 5 Q18.6 6.6 17.6 7.6 Z" fill={tinta} />
      <path d="M7 11 Q10 10 13 11 Q14.6 13.6 13 16 Q10 17.8 7 16 Q5.4 13.6 7 11 Z" fill={cor(CREME)} {...C(0.6)} />
      <path d="M5.2 8.2 L8.4 9.2 L7.6 10.2 Q6 10 5.2 8.2 Z M14.8 8.2 L11.6 9.2 L12.4 10.2 Q14 10 14.8 8.2 Z" fill={cor(VERDE)} {...C(0.5)} />
      <path d="M7 9.4 V9.9 M13 9.4 V9.9" {...L(0.5)} />
      <path d="M8.6 11 H11.4 L10 12.6 Z" fill={tinta} />
      <path d="M7.6 13.8 Q10 12.8 12.4 13.8 Q12 16.6 10 16.8 Q8 16.6 7.6 13.8 Z" fill={cor(VERMELHO)} {...C(0.6)} />
      <path d="M8.2 13.6 L8.6 14.8 L9 13.5 M11.8 13.6 L11.4 14.8 L11 13.5 M8.6 16.2 L8.9 15.4 L9.2 16.3 M11.4 16.2 L11.1 15.4 L10.8 16.3" fill={cor(BRANCO)} {...C(0.3)} />
      {[[10, 4.6], [7.4, 5.6], [12.6, 5.6], [4.6, 11.4], [15.4, 11.4], [5.6, 14.4], [14.4, 14.4], [9, 7.2], [11, 7.2]].map(([x, y], k) => <g key={k}><circle cx={x} cy={y} r={0.75} fill="none" stroke={tinta} strokeWidth={s(0.45)} strokeDasharray="1 0.4" /><circle cx={x} cy={y} r={0.22} fill={tinta} /></g>)}
    </g>;
    case 'bicho_preguica': { const c = W / 2; return <g>
      <path d={`M0.4 3.6 Q${c} 2 ${W - 0.4} 3.8`} fill="none" stroke={tinta} strokeWidth={s(1.8)} strokeLinecap="round" /><path d={`M0.4 3.6 Q${c} 2 ${W - 0.4} 3.8`} fill="none" stroke={cor(MARROM)} strokeWidth={s(0.9)} strokeLinecap="round" />
      <path d="M1.6 3 Q1 0.8 3.4 0.4 Q3.6 2.2 1.6 3 Z M14.4 3.2 Q15.6 1.2 16.6 1.8 Q16 3.4 14.4 3.2 Z" fill={cor(VERDE)} {...C(0.35)} />
      <path d={`M${c - 4.4} 3.6 Q${c - 5} 7 ${c - 3.2} 10 L${c - 1.4} 9.4 Q${c - 2.4} 7 ${c - 2.4} 3.4 Z M${c + 4.4} 3.6 Q${c + 5} 7 ${c + 3.2} 10 L${c + 1.4} 9.4 Q${c + 2.4} 7 ${c + 2.4} 3.4 Z`} fill={cor('#9a7a58')} {...C(0.5)} />
      <path d={`M${c - 4.4} 3 q0.2 -1 0.8 0 M${c - 3.6} 2.8 q0.2 -1 0.8 0 M${c + 2.8} 2.8 q0.2 -1 0.8 0 M${c + 3.6} 3 q0.2 -1 0.8 0`} {...L(0.4)} />
      <ellipse cx={c} cy={12.8} rx={5.2} ry={5.6} fill={cor('#9a7a58')} {...C(0.7)} />
      <ellipse cx={c} cy={11.6} rx={3.4} ry={2.7} fill={cor(CREME)} {...C(0.4)} />
      <ellipse cx={c - 1.5} cy={11.2} rx={1.2} ry={0.7} transform={`rotate(-20 ${c - 1.5} 11.2)`} fill={tinta} /><ellipse cx={c + 1.5} cy={11.2} rx={1.2} ry={0.7} transform={`rotate(20 ${c + 1.5} 11.2)`} fill={tinta} />
      <circle cx={c - 1.3} cy={11.1} r={0.25} fill={cor(BRANCO)} /><circle cx={c + 1.3} cy={11.1} r={0.25} fill={cor(BRANCO)} />
      <ellipse cx={c} cy={12.4} rx={0.6} ry={0.4} fill={tinta} /><path d={`M${c - 1} 13.2 Q${c} 14 ${c + 1} 13.2`} {...L(0.35)} />
      <path d={`M${c - 3} 17.6 Q${c - 3.6} 19.4 ${c - 1.8} 19.4 M${c + 3} 17.6 Q${c + 3.6} 19.4 ${c + 1.8} 19.4`} {...L(0.6)} />
    </g>; }
    case 'girafa': return <g {...L(0.5)}>
      <path d="M6.6 4 Q7.4 2.4 9.4 3 Q10.6 3.6 10.2 4.6 Q9.2 5 7.8 5.4" /><path d="M7.4 2.6 L7 1 M8.4 2.4 L8.4 0.8 M6.8 3.4 L5.6 3.2" />
      <circle cx={7} cy={0.8} r={0.35} fill={tinta} /><circle cx={8.4} cy={0.6} r={0.35} fill={tinta} /><circle cx={8.4} cy={3.6} r={0.25} fill={tinta} />
      <path d="M6.6 4.2 L3.2 12.6 M7.8 5.4 L5.4 12.4" />
      <path d="M3.2 12.6 Q1.8 13 1.8 14.6 M5.4 12.4 Q8.4 12.2 9.2 13.8 L9.2 15 M1.8 15 Q5.6 16.4 9.2 15" />
      <path d="M2 14.6 V19.4 M3.4 15.6 V19.4 M7.8 15.6 V19.4 M9.2 15 V19.4 M9.2 13.8 Q10.4 14.4 10.2 16.6" />
      {[[5.8, 7.4], [4.8, 9.6], [4.4, 11.8], [6.4, 13.6], [3.4, 14], [8.2, 14]].map(([x, y], k) => <path key={k} d={`M${x - 0.5} ${y - 0.4} h0.9 l0.2 0.7 l-0.6 0.4 h-0.6 Z`} strokeWidth={s(0.35)} />)}
    </g>;
    case 'raposa_geometrica': { const c = W / 2; return <g>
      <path d={`M2 1 L6.4 5.4 H${W - 6.4} L${W - 2} 1 L${W - 1.4} 9 L${W - 5} 12.6 L${c} 19 L5 12.6 L1.4 9 Z`} fill={cor(LARANJA)} {...C(0.7)} />
      <path d="M2.8 3 L5.4 5.4 L3 6.4 Z" fill={tinta} /><path d={`M${W - 2.8} 3 L${W - 5.4} 5.4 L${W - 3} 6.4 Z`} fill={tinta} />
      <path d={`M1.4 9 L5 12.6 L${c} 19 L6.4 11 Z M${W - 1.4} 9 L${W - 5} 12.6 L${c} 19 L${W - 6.4} 11 Z`} fill={cor(BRANCO)} {...C(0.5)} />
      <path d={`M6.4 5.4 L${c} 9.6 L${W - 6.4} 5.4 M${c} 9.6 V15 M6.4 11 L${c} 9.6 L${W - 6.4} 11 M1.4 9 L6 8.6 L6.4 5.4 M${W - 1.4} 9 L${W - 6} 8.6 L${W - 6.4} 5.4`} {...L(0.4)} />
      <path d="M5.4 8.6 L7.8 9.4 L6.2 10 Z" fill={tinta} /><path d={`M${W - 5.4} 8.6 L${W - 7.8} 9.4 L${W - 6.2} 10 Z`} fill={tinta} />
      <path d={`M${c - 1.2} 17.2 H${c + 1.2} L${c} 19 Z`} fill={tinta} />
    </g>; }
    case 'raposa_enrolada': return <g>
      {mancha(10, 8.4, 9, 6, LARANJA, 1, 0.3)}{mancha(13, 9, 5, 4, AMARELO, 2, 0.35)}
      {[[1.2, 2.4, 0.5], [18.6, 13.4, 0.6], [17.4, 2, 0.35]].map(([x, y, r], k) => <circle key={k} cx={x} cy={y} r={r} fill={cor(LARANJA)} opacity={0.6} />)}
      <path d="M5 9 Q4.4 3.4 10.4 2.8 Q16.2 2.8 17.2 8.4 Q17.6 12.4 13.4 13.4 H7" fill={cor(LARANJA)} {...C(0.6)} />
      <path d="M17.2 8.4 Q18.8 12.6 14.4 14.2 Q8 15.4 4 13.2 Q2.4 12.2 3 10.4 Q5 12.2 9 12 Q14 11.6 17.2 8.4 Z" fill={cor(LARANJA)} {...C(0.6)} />
      <path d="M3 10.4 Q2.4 12.2 4 13.2 Q5.6 13.8 5.8 12.4 Q4 12 3 10.4 Z" fill={cor(BRANCO)} {...C(0.4)} />
      <path d="M4.4 9.6 Q3.4 7.2 5 6 L4.8 3.8 L6.6 5.2 Q8 4.8 9 5.4 L10.4 4.2 L10.4 6.6 Q11.2 8.4 9.6 10 Q7.6 11.4 4.4 9.6 Z" fill={cor(LARANJA)} {...C(0.6)} />
      <path d="M4.4 9.6 Q6.8 10.8 9.6 10 Q8 9 6.8 9.4 Q5.6 8.8 4.4 9.6 Z" fill={cor(BRANCO)} />
      <path d="M6.4 7.6 Q7 8.2 7.8 7.6" {...L(0.4)} /><circle cx={4.5} cy={9.4} r={0.4} fill={tinta} />
    </g>;
    case 'lobo_uivando': { const c = W / 2; return <g>
      <circle cx={c} cy={8} r={7.6} fill={tinta} />
      {[[c - 3, 5, 1], [c + 2.4, 3.6, 0.7], [c + 3.6, 9.4, 1.2]].map(([x, y, r], k) => <circle key={k} cx={x} cy={y} r={r} fill={cor(CINZA1)} />)}
      <path d="M5.6 16.2 L6 12.6 Q5.8 11.4 5.2 10.6 L3.2 7.8 L5.6 8.4 L3 5.6 L3.6 4.8 Q5.4 4.4 6.8 4.6 L7.8 2 L8.6 2.4 L9 4.8 Q10.6 5.8 11 7.6 Q11.2 9.4 11.8 11 Q13.8 12.8 13.8 16.2 Z" fill={cor(BRANCO)} {...C(0.55)} />
      <path d="M13.6 15.4 Q15.8 15.6 15.6 13.4" {...L(0.9)} /><path d="M6.6 5.6 l0.9 0.1" {...L(0.4)} />
      <path d="M0.4 20 V16.6 L3 16 L5 16.4 L9 15.8 L12.4 16.4 L16.6 16 V20 Z" fill={tinta} />
    </g>; }
    case 'coruja_neo': { const c = W / 2; return <g>
      <path d="M5.4 1 A4 4 0 1 0 9.4 5.6 A3.2 3.2 0 1 1 5.4 1 Z" fill={cor(AMARELO)} {...C(0.4)} />
      <path d={`M${c} 4.2 Q${c + 6} 4.2 ${c + 6.2} 10.6 Q${c + 6.4} 16.4 ${c} 17.6 Q${c - 6.4} 16.4 ${c - 6.2} 10.6 Q${c - 6} 4.2 ${c} 4.2 Z`} fill={cor(MARROM)} {...C(0.8)} />
      <path d={`M${c - 4.6} 5.8 L${c - 5.6} 2.4 L${c - 2.4} 4.6 Z M${c + 4.6} 5.8 L${c + 5.6} 2.4 L${c + 2.4} 4.6 Z`} fill={cor(MARROM)} {...C(0.6)} />
      <path d={`M${c - 6} 10 Q${c - 5} 15 ${c - 2.6} 16.6 Q${c - 4.6} 12.6 ${c - 6} 10 Z M${c + 6} 10 Q${c + 5} 15 ${c + 2.6} 16.6 Q${c + 4.6} 12.6 ${c + 6} 10 Z`} fill={cor(CINZA1)} {...C(0.4)} />
      {[12.4, 14, 15.6].map((y, j) => <path key={y} d={`M${c - 2.6 + j * 0.4} ${y} ${Array.from({ length: 4 - j }, () => 'q0.6 0.8 1.2 0').join(' ')}`} fill="none" stroke={cor(CREME)} strokeWidth={s(0.4)} />)}
      {[-1, 1].map(k => <g key={k}><circle cx={c + k * 2.4} cy={8.6} r={2.5} fill={cor(CREME)} {...C(0.5)} /><circle cx={c + k * 2.4} cy={8.6} r={1.6} fill={cor(LARANJA)} {...C(0.35)} /><circle cx={c + k * 2.4} cy={8.6} r={0.8} fill={tinta} /><circle cx={c + k * 2.4 + 0.4} cy={8.2} r={0.3} fill={cor(BRANCO)} /></g>)}
      <path d={`M${c - 0.6} 10 H${c + 0.6} L${c} 11.6 Z`} fill={cor(AMARELO)} {...C(0.3)} />
      <path d={`M0.4 18.2 Q${c} 17 ${W - 0.4} 18.6`} fill="none" stroke={tinta} strokeWidth={s(1.3)} strokeLinecap="round" />
      <path d={`M${c - 1.6} 17.4 v1 M${c - 0.6} 17.4 v1 M${c + 0.6} 17.4 v1 M${c + 1.6} 17.4 v1`} {...L(0.4)} />
      <path d={`M${W - 2.6} 18.4 Q${W - 1} 16.6 ${W - 0.4} 17.6 Q${W - 1.2} 19 ${W - 2.6} 18.4 Z`} fill={cor(VERDE)} {...C(0.3)} />
    </g>; }
    case 'tucano': return <g>
      <path d="M0.8 17 Q10 15.6 19.2 17.4" fill="none" stroke={tinta} strokeWidth={s(1.6)} strokeLinecap="round" /><path d="M0.8 17 Q10 15.6 19.2 17.4" fill="none" stroke={cor(MARROM)} strokeWidth={s(0.8)} strokeLinecap="round" />
      <path d="M7.2 15.4 L6.2 19.6 H8.4 L8.8 15.4 Z" fill={tinta} />
      <path d="M6 15.8 Q4.2 12 5.6 8.6 Q6.8 6 9.4 6.2 Q11.2 6.6 11 9 Q11.2 12.2 9.6 15.8 Z" fill={tinta} />
      <path d="M9.2 8 Q11 8.2 11 10 Q10.4 11.6 8.8 11.4 Q8.4 9.6 9.2 8 Z" fill={cor(BRANCO)} {...C(0.35)} />
      <path d="M10.6 6.6 Q15 5.2 19.4 8.2 Q17 10.2 11 9.4 Z" fill={cor(LARANJA)} {...C(0.6)} />
      <path d="M11 6.8 Q15 5.8 18.4 7.6" fill="none" stroke={cor(AMARELO)} strokeWidth={s(0.6)} />
      <path d="M17.6 7.4 Q19 7.6 19.4 8.2 Q18.6 8.8 17.6 9 Z" fill={tinta} /><path d="M11 8.2 Q15 8 18.6 8.4" {...L(0.3)} />
      <circle cx={9.6} cy={7.4} r={0.9} fill={cor(AZUL)} /><circle cx={9.6} cy={7.4} r={0.4} fill={tinta} />
      <path d="M7 15.6 v1.4 M8.6 15.6 v1.4" stroke={cor(AZUL)} strokeWidth={s(0.5)} />
    </g>;
    case 'arara': return <g>
      {mancha(6, 9, 5.6, 6.6, TURQUESA, 3, 0.3)}{mancha(5, 15, 4, 3.4, AMARELO, 4, 0.3)}
      <path d="M1 12.6 H11.4" fill="none" stroke={tinta} strokeWidth={s(1.3)} strokeLinecap="round" /><path d="M1 12.6 H11.4" fill="none" stroke={cor(MARROM)} strokeWidth={s(0.6)} strokeLinecap="round" />
      <path d="M5.4 12.4 L4.4 19.6 L6 19.4 L7.4 12.8 Z" fill={cor(VERMELHO)} {...C(0.45)} /><path d="M4.6 17.8 L4.4 19.6 L6 19.4 L6.4 17.6 Z" fill={cor(AZUL)} />
      <path d="M5 4.6 Q3.4 7 4 10.6 Q4.6 12.8 6.6 13 Q8.6 12 8.6 9 Q8.6 6 7.6 4.6 Z" fill={cor(VERMELHO)} {...C(0.55)} />
      <path d="M4.4 7 Q3 10.4 4.4 13 Q6.4 13.6 7.2 11 Q7.4 8.6 4.4 7 Z" fill={cor(AZUL)} {...C(0.45)} /><path d="M4.4 7 Q6.6 8.2 7.2 9.4 Q5.4 9.6 4 9.2 Z" fill={cor(AMARELO)} />
      <circle cx={6.6} cy={3.2} r={2.3} fill={cor(VERMELHO)} {...C(0.55)} /><ellipse cx={7.6} cy={3.3} rx={1} ry={0.9} fill={cor(BRANCO)} />
      <circle cx={7.5} cy={3.1} r={0.3} fill={tinta} />
      <path d="M8.4 2.4 Q10.8 2.2 10.6 4.6 Q9.8 5.6 8.6 4.4 Z" fill={cor(CREME)} {...C(0.4)} /><path d="M8.6 4.4 Q9.4 5.6 9.8 4.8" {...L(0.4)} />
      <path d="M6 12.6 v1 M7.2 12.6 v1" {...L(0.4)} />
    </g>;
    case 'flamingo': return <g>
      <path d="M3 8.4 Q2.4 5.6 5.4 5.4 Q9.4 5.6 10.6 8 Q8.8 10.6 5.2 10.2 Q3.4 10 3 8.4 Z" fill={cor(ROSA)} {...C(0.45)} />
      <path d="M5.6 7 Q7.6 7.2 9 8.4" {...L(0.3)} />
      <path d="M3.4 7.2 Q0.8 4.8 2.4 2.6 Q4 1 5.4 2.2" fill="none" stroke={tinta} strokeWidth={s(0.9)} strokeLinecap="round" /><path d="M3.4 7.2 Q0.8 4.8 2.4 2.6 Q4 1 5.4 2.2" fill="none" stroke={cor(ROSA)} strokeWidth={s(0.45)} strokeLinecap="round" />
      <circle cx={5.8} cy={2.4} r={1} fill={cor(ROSA)} {...C(0.4)} /><circle cx={6} cy={2.1} r={0.2} fill={tinta} />
      <path d="M6.6 2.2 Q8.2 2.6 7.8 4.2 Q7.4 3.4 6.6 3.2 Z" fill={cor(CREME)} {...C(0.35)} /><path d="M7.8 3.2 L7.8 4.2 L7.4 3.6 Z" fill={tinta} />
      <path d="M6 10.2 L6.4 14.4 L6 19.2 M6.2 10.2 L7.8 13.2 L6.4 14.2 M5 19.4 H7.2" {...L(0.4)} />
      <path d="M0.6 19.6 H11.4" {...L(0.3)} opacity={0.6} />
    </g>;
    case 'garca_em_voo': return <g>
      <circle cx={11.4} cy={6.4} r={5} fill={cor(VERMELHO)} {...C(0.4)} />
      <path d="M7.6 8.2 Q8.6 3 13.4 0.8 Q12.8 2.6 13.8 2.8 Q12.6 4 13.6 4.6 Q12 5.6 12.6 6.6 Q10.8 7 10.4 8.2 Z" fill={cor(BRANCO)} {...C(0.5)} />
      <path d="M13.4 0.8 Q12.8 2.6 13.8 2.8 Q12.6 4 13.6 4.6 Q12 5.6 12.6 6.6 L11.6 6.4 Q11 3.6 13.4 0.8 Z" fill={tinta} />
      <path d="M8.6 9.6 Q10.6 12.6 15.8 13.6 Q14.4 12.4 15.4 12 Q13.6 11.4 14.2 10.6 Q12.2 10.4 11.4 9.4 Z" fill={cor(BRANCO)} {...C(0.5)} />
      <path d="M15.8 13.6 Q14.4 12.4 15.4 12 Q13.6 11.4 14.2 10.6 L13.4 10.6 Q13.4 12.6 15.8 13.6 Z" fill={tinta} />
      <path d="M5 8.6 Q9 7.2 13.6 8.4 Q12.2 10.2 8.2 10.2 Q5.8 10 5 8.6 Z" fill={cor(BRANCO)} {...C(0.5)} />
      <path d="M13 8.4 L15.4 9.2 L13.2 9.8 Z" fill={tinta} />
      <path d="M5.2 8.8 Q3.6 8.6 2.4 7.4" fill="none" stroke={tinta} strokeWidth={s(0.9)} strokeLinecap="round" />
      <circle cx={2.2} cy={7.1} r={0.75} fill={cor(BRANCO)} {...C(0.35)} /><circle cx={2.2} cy={6.7} r={0.4} fill={cor(VERMELHO)} />
      <path d="M1.6 7.3 L0.2 8.1" {...L(0.45)} /><path d="M14.6 9.2 L19.6 9.4 M14.4 9.6 L19.4 10.4" {...L(0.35)} />
      <path d="M0.8 14.4 Q2.2 12.6 3.8 13.8 Q5.2 12.4 6.6 13.8 Q7.4 15 6.2 15.2 M3.4 15 Q3.8 14 4.8 14.4" {...L(0.45)} />
    </g>;
    case 'pena_de_pavao': { const c = W / 2; return <g>
      {Array.from({ length: 22 }, (_, k) => { const y = 6.4 + k * 0.6, l = 3.4 * (1 - k / 26); return <path key={k} d={`M${c} ${f(y)} Q${f(c - l * 0.6)} ${f(y - 0.6)} ${f(c - l)} ${f(y - 1.4)} M${c} ${f(y)} Q${f(c + l * 0.6)} ${f(y - 0.6)} ${f(c + l)} ${f(y - 1.4)}`} fill="none" stroke={cor(k % 2 ? VERDE : TURQUESA)} strokeWidth={s(0.3)} />; })}
      <ellipse cx={c} cy={5} rx={3.6} ry={4.6} fill={cor(VERDE)} {...C(0.4)} />
      <ellipse cx={c} cy={5.2} rx={2.6} ry={3.4} fill={cor(OURO)} />
      <ellipse cx={c} cy={5.4} rx={1.9} ry={2.5} fill={cor(TURQUESA)} />
      <path d={`M${c} 3.6 Q${c + 1.3} 4.6 ${c + 1} 6 Q${c} 7.4 ${c - 1} 6 Q${c - 1.3} 4.6 ${c} 3.6 Z`} fill={cor(AZUL)} {...C(0.3)} />
      <path d={`M${c} 9.4 Q${c + 0.2} 14 ${c} 19.6`} {...L(0.5)} />
    </g>; }
    case 'camaleao': return <g>
      <path d="M0.4 12.6 Q10 10.6 19.6 12.4" fill="none" stroke={tinta} strokeWidth={s(1.6)} strokeLinecap="round" /><path d="M0.4 12.6 Q10 10.6 19.6 12.4" fill="none" stroke={cor(MARROM)} strokeWidth={s(0.8)} strokeLinecap="round" />
      <path d="M5 9 Q2.4 9.4 2 7 Q2 5.2 3.6 5.2 Q5 5.4 4.6 6.8 Q4 7.6 3.4 6.8" fill="none" stroke={tinta} strokeWidth={s(1.5)} strokeLinecap="round" /><path d="M5 9 Q2.4 9.4 2 7 Q2 5.2 3.6 5.2 Q5 5.4 4.6 6.8 Q4 7.6 3.4 6.8" fill="none" stroke={cor(VERDE)} strokeWidth={s(0.7)} strokeLinecap="round" />
      <path d="M4.6 9.4 Q5 5 10 4.4 Q13.4 4 14.6 4.6 L16.4 3 Q17.8 4.8 18.6 7.6 Q19 9 17.4 9.6 Q15 10.6 13.2 10.6 Q8.6 11.4 4.6 9.4 Z" fill={cor(VERDE)} {...C(0.6)} />
      <path d="M8 5 Q8.6 8 7.6 10.6 M10.6 4.6 Q11.4 7.6 10.6 10.8" fill="none" stroke={cor(LARANJA)} strokeWidth={s(0.9)} /><path d="M12.8 4.6 Q13.4 7.6 12.8 10.6" fill="none" stroke={cor(AMARELO)} strokeWidth={s(0.7)} />
      <path d="M6 6 l0.6 -0.8 l0.6 0.6 l0.6 -0.8 l0.6 0.6 l0.6 -0.8 l0.6 0.6 l0.6 -0.8 l0.6 0.6" {...L(0.35)} />
      <circle cx={15.8} cy={6.6} r={1.3} fill={cor(AMARELO)} {...C(0.4)} /><circle cx={15.9} cy={6.6} r={0.45} fill={tinta} />
      <path d="M17.4 8.6 L18.8 8.2" {...L(0.35)} />
      <path d="M7.4 10.8 L6.6 12.4 M12.6 10.8 L13.2 12" fill="none" stroke={tinta} strokeWidth={s(0.9)} strokeLinecap="round" />
    </g>;
    case 'tartaruga_tribal': return <g>
      <circle cx={10} cy={2.8} r={1.9} fill={tinta} /><circle cx={9.2} cy={2.4} r={0.3} fill={cor(BRANCO)} /><circle cx={10.8} cy={2.4} r={0.3} fill={cor(BRANCO)} />
      <path d="M5.6 7 Q1.4 4.6 0.6 7.4 Q3 9 5.4 9.4 Z M14.4 7 Q18.6 4.6 19.4 7.4 Q17 9 14.6 9.4 Z M6 14.6 Q2.6 15 2.6 17.6 Q5 17.6 6.8 15.8 Z M14 14.6 Q17.4 15 17.4 17.6 Q15 17.6 13.2 15.8 Z" fill={tinta} />
      <path d="M9.4 17 L10 19.6 L10.6 17 Z" fill={tinta} />
      <ellipse cx={10} cy={10.8} rx={5.6} ry={6.6} fill={tinta} />
      <path d="M10 7.6 L12.6 9.2 V12.4 L10 14 L7.4 12.4 V9.2 Z" fill="none" stroke={cor(BRANCO)} strokeWidth={s(0.5)} />
      <path d="M10 7.6 V4.8 M12.6 9.2 L15 7.8 M12.6 12.4 L15 13.8 M10 14 V16.8 M7.4 12.4 L5 13.8 M7.4 9.2 L5 7.8" stroke={cor(BRANCO)} strokeWidth={s(0.5)} />
      <path d="M5.2 10.8 l0.6 -0.6 l0.6 0.6 M13.6 10.8 l0.6 -0.6 l0.6 0.6 M9.4 5.6 l0.6 -0.6 l0.6 0.6 M9.4 16 l0.6 -0.6 l0.6 0.6" fill="none" stroke={cor(BRANCO)} strokeWidth={s(0.35)} />
      <circle cx={10} cy={10.8} r={0.8} fill={cor(BRANCO)} />
    </g>;
    case 'lagartixa': { const c = W / 2; return <g>
      <ellipse cx={c} cy={2.6} rx={1.5} ry={2} fill={tinta} />
      <path d={`M${c} 4 Q${c + 0.8} 7 ${c} 10 Q${c - 0.8} 13 ${c + 0.4} 15.4 Q${c + 1.6} 17.6 ${c - 0.6} 19.4`} fill="none" stroke={tinta} strokeWidth={s(1.6)} strokeLinecap="round" />
      <path d={`M${c} 5.8 L${c - 2.6} 4.6 L${c - 3.6} 3 M${c + 0.2} 5.8 L${c + 2.8} 4.8 L${c + 3.8} 3.2 M${c - 0.2} 10.6 L${c - 2.4} 12 L${c - 3} 13.8 M${c} 10.6 L${c + 2.4} 11.4 L${c + 3.2} 13.2`} {...L(0.6)} />
      {[[c - 3.6, 3], [c + 3.8, 3.2], [c - 3, 13.8], [c + 3.2, 13.2]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r={0.45} fill={tinta} />)}
    </g>; }
    case 'polvo': { const ts = ['M6 11 Q1.6 11.6 1.4 15 Q1.4 17.4 3.4 17 Q4.6 16.4 3.8 15.4', 'M7.4 11.4 Q5 14.6 6.4 17.4 Q7.6 19.6 9 18.4', 'M9.2 11.6 Q9.6 15.4 11.6 17 Q13 17.8 13.2 16.4', 'M11.4 11.6 Q14 14.6 16.2 15.6 Q18 16 17.6 14.4', 'M12.8 11.2 Q15.6 12.6 17.8 11.6 Q19.4 10.6 18.4 9.4', 'M14 10.6 Q18 9 17.6 6.2 Q17.2 4.8 16.2 5.6', 'M5.6 10.6 Q2 9.4 2.2 6.4 Q2.4 4.8 3.6 5.4', 'M10.2 11.8 Q10.6 16.6 13.6 19 Q15.2 19.8 15.6 18.4'];
      return <g>
        {ts.map((d, k) => <g key={k}><path d={d} fill="none" stroke={tinta} strokeWidth={s(1.7)} strokeLinecap="round" /><path d={d} fill="none" stroke={cor(VERMELHO)} strokeWidth={s(0.9)} strokeLinecap="round" /><path d={d} fill="none" stroke={cor(CREME)} strokeWidth={s(0.35)} strokeLinecap="round" strokeDasharray="0.01 1" /></g>)}
        <path d="M10 1 Q15.4 1 15.4 7 Q15.4 10.2 13 11.6 H7 Q4.6 10.2 4.6 7 Q4.6 1 10 1 Z" fill={cor(VERMELHO)} {...C(0.7)} />
        {[[7.6, 3.6, 0.6], [12, 3, 0.45], [12.8, 5.4, 0.35], [8.6, 2.4, 0.3]].map(([x, y, r], k) => <circle key={k} cx={x} cy={y} r={r} fill={cor(ROSA)} />)}
        {[-1, 1].map(k => <g key={k}><ellipse cx={10 + k * 2} cy={8.2} rx={1.3} ry={1.1} fill={cor(CREME)} {...C(0.4)} /><rect x={10 + k * 2 - 0.8} y={7.9} width={1.6} height={0.6} rx={0.3} fill={tinta} /></g>)}
      </g>; }
    case 'baleia_fine': return <g {...L(0.45)}>
      <path d="M2 5.6 Q3 2.4 8 2.6 Q13 2.8 15.6 4.6 L18.4 2.6 Q19.4 2.4 19.4 3.4 L17.4 5.6 L19.2 7.6 Q19 8.4 18 8 L15.4 6.6 Q12 8.6 7 8.4 Q2.6 8.2 2 5.6 Z" />
      <path d="M2.4 6.4 Q5 7.2 8.6 7 M3 7.2 Q5 7.8 7.6 7.8 M2.2 5.8 L4.6 6" /><circle cx={5.4} cy={5} r={0.35} fill={tinta} />
      <path d="M8.4 7.8 Q9.2 9.6 10.8 8.6" /><path d="M5.6 2.4 Q5.2 1 4.2 0.6 M5.6 2.4 Q6 1 7 0.4 M5.6 2.4 V0.8" />
      <path d={ondas(0.4, 19.6, 9.6, 0.4, 7)} strokeWidth={s(0.3)} />
    </g>;
    case 'tubarao': return <g>
      <path d="M0.6 6.4 Q3 3.2 9 3 L11 0.6 L12.6 3.2 Q16 3.6 17.6 4.6 L19.6 1.6 L19.2 6.4 L19.6 10.6 L17.4 7.8 Q14 9.4 9.6 9.4 L8.4 11.6 L7.4 9.2 Q3.4 8.6 0.6 6.4 Z" fill={cor(CINZA2)} {...C(0.9)} />
      <path d="M1.4 6.8 Q5 8.6 10 8.6 Q14 8.6 17 7.4 Q12 7 6 7.4 Q3.4 7.4 1.4 6.8 Z" fill={cor(BRANCO)} />
      <path d="M0.6 6.4 L4.8 6.4 L1.8 8.2 Z" fill={cor(VERMELHO)} {...C(0.5)} /><path d="M1.6 6.4 l0.4 0.6 l0.4 -0.6 l0.4 0.6 l0.4 -0.6 l0.4 0.6 l0.4 -0.6" fill={cor(BRANCO)} {...C(0.25)} />
      <circle cx={4} cy={4.8} r={0.55} fill={tinta} /><path d="M6.4 4.6 Q6 5.8 6.4 7 M7.2 4.6 Q6.8 5.8 7.2 7 M8 4.6 Q7.6 5.8 8 7" {...L(0.35)} />
      <path d="M10.2 7.6 L12 10.4 L12.6 8.6" fill={cor(CINZA2)} {...C(0.5)} />
    </g>;
    case 'agua_viva': { const c = W / 2; return <g>
      {mancha(c, 8, 5.6, 6, TURQUESA, 5, 0.3)}
      {[1.6, 3.4, 8.6, 10.4].map((x, k) => <path key={k} d={`M${x} 6.8 Q${x + 1} 10 ${x - 0.4} 13 Q${x - 1.4} 16 ${x + 0.4} 19.6`} {...L(0.3)} />)}
      <path d={`M${c - 1.4} 7 Q${c - 2.6} 10 ${c - 1} 12.6 Q${c + 0.4} 15 ${c - 0.8} 17.4 M${c + 1.4} 7 Q${c + 2.4} 10 ${c + 0.8} 12.6 Q${c - 0.4} 15.4 ${c + 0.8} 18`} fill="none" stroke={tinta} strokeWidth={s(0.9)} strokeLinecap="round" />
      <path d={`M${c - 1.4} 7 Q${c - 2.6} 10 ${c - 1} 12.6 Q${c + 0.4} 15 ${c - 0.8} 17.4 M${c + 1.4} 7 Q${c + 2.4} 10 ${c + 0.8} 12.6 Q${c - 0.4} 15.4 ${c + 0.8} 18`} fill="none" stroke={cor(ROSA)} strokeWidth={s(0.4)} strokeLinecap="round" />
      <path d={`M1 7 Q1 1 ${c} 1 Q${W - 1} 1 ${W - 1} 7 Q${W - 2.6} 6.2 ${W - 4} 7 Q${c} 6 4 7 Q2.4 6.2 1 7 Z`} fill={cor(ROSA)} opacity={0.85} {...C(0.5)} />
      <path d={`M3 5.6 Q3.4 2.6 ${c} 2.4 M${c - 1} 6.4 Q${c} 3.6 ${c + 2.4} 6.4`} fill="none" stroke={cor(BRANCO)} strokeWidth={s(0.35)} />
    </g>; }
    case 'cavalo_marinho': { const pol: [number, number][] = [[0.8, 4.2], [0.8, 5.2], [3.6, 5.4], [4.4, 6.4], [5.2, 8], [5.8, 10], [6, 12.4], [5.4, 14], [4.8, 15.6], [5.4, 16.6], [6.6, 16.4], [7.8, 15.2], [9, 13.6], [9.9, 11.6], [10, 9.6], [9.4, 7.8], [8.8, 6.8], [9.4, 5.2], [9.2, 3], [8.2, 1.6], [7.2, 0.6], [6.4, 1.6], [4.8, 2.4], [3.6, 3.8]];
      const dentro = (x: number, y: number) => { let d = false; for (let i = 0, j = pol.length - 1; i < pol.length; j = i++) { const [xi, yi] = pol[i], [xj, yj] = pol[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) d = !d; } return d; };
      const pts: [number, number, number][] = [];
      for (let y = 0.9; y < 17; y += 0.62) for (let x = 0.9; x < 10.4; x += 0.62) { const k = Math.round(x * 31 + y * 97); const px = x + (sorte(k) - 0.5) * 0.3, py = y + (sorte(k + 3) - 0.5) * 0.3; if (dentro(px, py) && sorte(k + 7) < 0.35 + (px / 10) * 0.6) pts.push([px, py, k]); }
      return <g>
        <path d={'M' + pol.map(([x, y]) => `${x} ${y}`).join(' L') + ' Z'} fill="none" stroke={tinta} strokeWidth={s(0.6)} strokeDasharray="0.01 0.55" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map(([x, y, k]) => <circle key={k} cx={f(x)} cy={f(y)} r={0.24} fill={tinta} />)}
        <path d="M5.4 16.6 Q4.6 18.2 5.6 19.2 Q7 19.8 7.6 18.6 Q7.8 17.6 6.8 17.6 Q6.2 17.8 6.4 18.4" fill="none" stroke={tinta} strokeWidth={s(0.7)} strokeDasharray="0.01 0.55" strokeLinecap="round" />
        <circle cx={7} cy={3.4} r={0.75} fill={cor(BRANCO)} {...C(0.3)} /><circle cx={7} cy={3.4} r={0.3} fill={tinta} />
        {[0, 1, 2, 3].map(k => <path key={k} d={`M${9.8 - k * 0.1} ${9.4 + k * 0.9} l1 ${-0.6 + k * 0.4}`} stroke={tinta} strokeWidth={s(0.35)} strokeDasharray="0.01 0.45" strokeLinecap="round" />)}
      </g>; }
    case 'arraia': return <g>
      <path d="M10 2 Q13 2.4 15 4.4 Q17.6 6.4 19.6 6.6 Q17.6 8.4 14.6 9 Q12.6 10.6 10 10.6 Q7.4 10.6 5.4 9 Q2.4 8.4 0.4 6.6 Q2.4 6.4 5 4.4 Q7 2.4 10 2 Z" fill={tinta} />
      <path d="M8.8 2.4 L8 0.6 Q8.8 0.8 9.4 2.2 Z M11.2 2.4 L12 0.6 Q11.2 0.8 10.6 2.2 Z" fill={tinta} />
      <path d="M10 10.6 Q10.4 13 12 14.2" {...L(0.5)} />
      <path d="M10 3.6 V9.6 M7 5.6 L5 6.6 M7.4 6.8 L4.8 7.6 M13 5.6 L15 6.6 M12.6 6.8 L15.2 7.6" stroke={cor(BRANCO)} strokeWidth={s(0.35)} fill="none" strokeLinecap="round" />
      {[[8.4, 8.4], [11.6, 8.4], [3, 6.8], [17, 6.8], [9, 4.6], [11, 4.6]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r={0.3} fill={cor(BRANCO)} />)}
      <path d="M8.6 9 Q10 9.8 11.4 9" stroke={cor(BRANCO)} strokeWidth={s(0.3)} fill="none" />
    </g>;
    case 'abelha': return <g>
      <path d="M13.6 5.6 Q16.6 1.6 19.2 3.4 Q19.6 5.6 17 5.2" fill="none" stroke={tinta} strokeWidth={s(0.35)} strokeDasharray="0.6 0.6" strokeLinecap="round" />
      <ellipse cx={8} cy={7.6} rx={3.4} ry={1.8} transform="rotate(-40 8 7.6)" fill={cor(BRANCO)} opacity={0.8} {...C(0.4)} />
      <ellipse cx={11} cy={8} rx={2.8} ry={1.5} transform="rotate(-70 11 8)" fill={cor(BRANCO)} opacity={0.8} {...C(0.4)} />
      <g transform="rotate(-30 12 11.6)">
        <ellipse cx={13} cy={11.6} rx={3.8} ry={2.6} fill={cor(AMARELO)} {...C(0.5)} />
        <path d="M11.6 9.2 Q12.4 11.6 11.6 14 M13.6 9 Q14.4 11.6 13.6 14.2 M15.4 9.6 Q16 11.6 15.4 13.6" fill="none" stroke={tinta} strokeWidth={s(0.7)} />
        <path d="M16.8 11.6 L18 11.6" {...L(0.5)} /></g>
      <circle cx={8.4} cy={13} r={1.8} fill={tinta} /><circle cx={6} cy={14.6} r={1.4} fill={tinta} />
      <path d="M5.4 13.4 Q4.6 11.8 3.2 11.8 M5 14 Q3.4 13.6 2.6 14.8" {...L(0.35)} />
      <path d="M7.4 14.6 L7 16.6 M8.8 14.6 L9 16.8 M9.8 14 L11 15.6" {...L(0.3)} />
    </g>;
    case 'mariposa_caveira': return <g>
      <path d="M10 4 Q6 0.6 0.6 1.2 Q1.6 4.4 3 6.6 Q5.6 7.6 9.4 7 Z M10 4 Q14 0.6 19.4 1.2 Q18.4 4.4 17 6.6 Q14.4 7.6 10.6 7 Z M9.6 7.4 Q5.6 8 3.6 11 Q5.4 13.6 9 11 Z M10.4 7.4 Q14.4 8 16.4 11 Q14.6 13.6 11 11 Z" fill={tinta} />
      <path d="M8.6 4.6 Q5 2.6 2 2.2 M8.8 6 Q6 4.8 3.4 5.2 M11.4 4.6 Q15 2.6 18 2.2 M11.2 6 Q14 4.8 16.6 5.2 M8.8 8.4 Q6.6 9.4 5 10.8 M11.2 8.4 Q13.4 9.4 15 10.8" stroke={cor(BRANCO)} strokeWidth={s(0.3)} fill="none" />
      {[[3.6, 3.4], [16.4, 3.4], [6, 10], [14, 10]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r={0.5} fill={cor(BRANCO)} />)}
      <ellipse cx={10} cy={8.2} rx={1.4} ry={5} fill={tinta} />
      <circle cx={10} cy={5.9} r={1.1} fill={cor(BRANCO)} /><circle cx={9.6} cy={5.8} r={0.3} fill={tinta} /><circle cx={10.4} cy={5.8} r={0.3} fill={tinta} /><path d="M9.6 6.9 h0.8" stroke={tinta} strokeWidth={s(0.25)} />
      {[9.4, 10.4, 11.4].map(y => <path key={y} d={`M9 ${y} H11`} stroke={cor(CINZA1)} strokeWidth={s(0.3)} />)}
      <path d="M9.6 3.4 Q8.6 1.4 7.6 1 M10.4 3.4 Q11.4 1.4 12.4 1" {...L(0.35)} />
    </g>;
    case 'escorpiao': { const c = W / 2; return <g>
      {[[c, 8.4, 1.25], [c + 0.4, 6.2, 1.1], [c + 1.4, 4.2, 1], [c + 2.8, 2.6, 0.95], [c + 4.6, 1.9, 0.9]].map(([x, y, r], k) => <circle key={k} cx={x} cy={y} r={r} fill={tinta} />)}
      <path d={`M${c + 5.4} 1.6 Q${c + 7} 2 ${c + 6.6} 3.6 Q${c + 6.2} 4.8 ${c + 5.4} 5`} fill="none" stroke={tinta} strokeWidth={s(1.1)} strokeLinecap="round" />
      <ellipse cx={c} cy={12.6} rx={2.4} ry={3.4} fill={tinta} />
      {[11, 12.4, 13.8].map(y => <path key={y} d={`M${c - 2} ${y} H${c + 2}`} stroke={cor(BRANCO)} strokeWidth={s(0.3)} />)}
      {[-1, 1].map(k => <g key={k}>
        <path d={`M${c + k * 1.2} 15.4 L${c + k * 3.4} 16.6 L${c + k * 4.6} 18`} fill="none" stroke={tinta} strokeWidth={s(0.9)} strokeLinecap="round" />
        <path d={`M${c + k * 4.6} 18 Q${c + k * 6.6} 17.6 ${c + k * 6.4} 19.4 M${c + k * 4.6} 18 Q${c + k * 4.4} 19.6 ${c + k * 5.6} 19.6`} fill="none" stroke={tinta} strokeWidth={s(0.9)} strokeLinecap="round" />
        {[0, 1, 2, 3].map(j => <path key={j} d={`M${c + k * 2} ${10.6 + j * 1.1} L${c + k * (4.4 + j * 0.2)} ${9.8 + j * 1.4} L${c + k * (5.6 + j * 0.3)} ${11 + j * 1.4}`} {...L(0.4)} />)}</g>)}
    </g>; }
    case 'escaravelho': return <g>
      <circle cx={10} cy={2.6} r={2.2} fill={cor(LARANJA)} {...C(0.5)} />
      <path d="M8.8 6.6 L8 4.4 M11.2 6.6 L12 4.4" {...L(0.5)} />
      <path d="M7.2 8.6 Q3.6 6.6 0.4 7.4 Q1.4 8.8 0.8 9.8 Q2.6 10.2 1.6 11.6 Q4.2 11.6 7.4 11.4 Z M12.8 8.6 Q16.4 6.6 19.6 7.4 Q18.6 8.8 19.2 9.8 Q17.4 10.2 18.4 11.6 Q15.8 11.6 12.6 11.4 Z" fill={cor(TURQUESA)} {...C(0.5)} />
      <path d="M6.6 9.2 Q4 8.4 1.8 8.6 M6.8 10.4 Q4.4 10.2 2.4 10.8 M13.4 9.2 Q16 8.4 18.2 8.6 M13.2 10.4 Q15.6 10.2 17.6 10.8" fill="none" stroke={cor(OURO)} strokeWidth={s(0.4)} />
      <path d="M8.2 6.8 Q10 5.2 11.8 6.8 Z" fill={cor(AZUL)} {...C(0.45)} />
      <ellipse cx={10} cy={10.4} rx={3} ry={3.8} fill={cor(AZUL)} {...C(0.6)} /><path d="M10 7 V14.2 M7.4 9 Q10 10 12.6 9" fill="none" stroke={cor(OURO)} strokeWidth={s(0.4)} />
      <path d="M7.6 12.6 L6 14.6 M12.4 12.6 L14 14.6" {...L(0.5)} />
      <path d="M10 14.6 L9.2 15.8 L10 16.6 L10.8 15.8 Z" fill={cor(OURO)} {...C(0.3)} />
    </g>;
    case 'libelula': return <g {...L(0.4)}>
      {[[5.2, 6, -8, 4.6, 1.3], [14.8, 6, 8, 4.6, 1.3], [5.4, 8.6, 14, 4.2, 1.15], [14.6, 8.6, -14, 4.2, 1.15]].map(([x, y, g, rx, ry], k) => <g key={k} transform={`rotate(${g} ${x} ${y})`}><ellipse cx={x} cy={y} rx={rx} ry={ry} /><path d={`M${x - rx + 0.6} ${y} H${x + rx - 0.6} M${x - 1.6} ${y - ry * 0.7} l0.6 ${ry * 0.7} M${x + 1} ${y - ry * 0.7} l0.6 ${ry * 0.7} M${x - 0.4} ${y + ry * 0.7} l0.6 ${-ry * 0.7}`} strokeWidth={s(0.2)} /></g>)}
      <circle cx={10} cy={4.2} r={1.1} fill={tinta} /><ellipse cx={10} cy={6.8} rx={0.9} ry={1.6} fill={tinta} />
      <path d="M10 8.4 V19.6" strokeWidth={s(0.75)} />{[10.4, 12, 13.6, 15.2, 16.8, 18.4].map(y => <path key={y} d={`M9.4 ${y} H10.6`} strokeWidth={s(0.25)} />)}
    </g>;
    case 'joaninha': return <g>
      <path d="M1.6 18.6 Q1 6.6 16.4 1.6 Q19 14.6 1.6 18.6 Z" fill={cor(VERDE)} {...C(0.5)} /><path d="M1.6 18.6 Q8 11 16.4 1.6" fill="none" stroke={cor(VERDE_CLARO)} strokeWidth={s(0.4)} />
      <path d="M10 6.6 A4.6 4.6 0 0 1 10 6.6" /><circle cx={10} cy={11} r={4.4} fill={cor(VERMELHO)} {...C(0.6)} />
      <path d="M7 7.8 Q10 5.4 13 7.8 Q10 9 7 7.8 Z" fill={tinta} /><path d="M10 7.6 V15.4" {...L(0.45)} />
      {[[8, 10.6], [12, 10.6], [7.6, 13], [12.4, 13], [9, 14.6], [11, 14.6]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r={0.7} fill={tinta} />)}
      <path d="M9 6.8 Q8.2 5.2 7.2 5 M11 6.8 Q11.8 5.2 12.8 5" {...L(0.35)} />
    </g>;
    case 'louva_a_deus': return <g>
      {rascunho('M4 2.6 L6.4 1.6 L5.8 4 Z', 0.5)}<circle cx={4.8} cy={2.6} r={0.5} fill={tinta} />
      {rascunho('M5.6 3.8 L7.6 10', 0.7)}
      {rascunho('M6.4 5.4 L4.2 8.2 L3 5.6 M4.2 8.2 L5.6 9.8', 0.55)}
      <path d="M3.6 6.4 l0.5 -0.2 M3.9 7.2 l0.5 -0.2" {...L(0.25)} />
      {rascunho('M7.6 10 Q11.4 13 11.6 17.4 Q11.2 19.4 10 18.6 Q8.4 15.4 7.6 10 Z', 0.5)}
      {rascunho('M8 10.6 Q12.6 12 13.2 17.6', 0.35)}
      {rascunho('M8 11.4 L5.6 14.6 L4.8 19.4 M8.6 12.4 L7.4 16 L8.2 19.4 M8.2 11 L11.6 9.6 L13.4 12', 0.4)}
    </g>;
    case 'baleia_nas_nuvens': { const nuvem = (x: number, y: number, w: number) => <path key={x} d={`M${x} ${y} Q${x - 0.6} ${y - 1.6} ${x + w * 0.2} ${y - 1.6} Q${x + w * 0.3} ${y - 3} ${x + w * 0.55} ${y - 2.2} Q${x + w * 0.8} ${y - 3} ${x + w * 0.9} ${y - 1.4} Q${x + w + 0.6} ${y - 1} ${x + w} ${y} Z`} fill={cor(BRANCO)} {...C(0.45)} />; return <g>
      {nuvem(0.6, 4, 6)}{nuvem(13, 3.4, 6.2)}
      <path d="M2.4 8.4 Q3.4 5.2 8 5.4 Q12.4 5.6 14.4 7.2 L17 5.6 Q17.8 5.4 17.8 6.2 L16.2 8.2 L17.6 10 Q17.4 10.8 16.6 10.4 L14.2 9.2 Q11 11 7.4 10.8 Q3 10.6 2.4 8.4 Z" fill={cor(AZUL)} {...C(0.6)} />
      <path d="M2.8 9 Q5.4 10.4 9 10.2 Q6 11.2 3.6 10" fill={cor(CELESTE)} /><circle cx={5.4} cy={7.8} r={0.35} fill={tinta} /><path d="M8.6 10.2 Q9.4 11.8 10.8 11" {...L(0.4)} />
      {nuvem(1.4, 13.6, 7.4)}
      <path d="M11.6 12.4 H17.6 L16.4 13.8 H12.8 Z M14.6 12.4 L14.6 9.8 L16.6 12.2" fill={cor(BRANCO)} {...C(0.4)} />
      <path d={ondas(10.4, 19.4, 14, 0.4, 3)} {...L(0.35)} />
    </g>; }

    /* ================================================================ NATUREZA */
    case 'cogumelos': return <g>
      {mancha(10, 10, 9, 8, TURQUESA, 6, 0.28)}{mancha(13, 14, 5, 4, VERDE, 7, 0.3)}
      <path d="M7.4 9.6 Q6.8 16 7.4 18 H10.6 Q11.2 16 10.6 9.6 Z" fill={cor(CREME)} {...C(0.6)} />
      <path d="M2.6 9.4 Q2.6 2.8 9 2.6 Q15.4 2.8 15.4 9.4 Q9 10.8 2.6 9.4 Z" fill={cor(LARANJA)} {...C(0.7)} />
      {[[6, 5.4, 0.9], [10, 4.4, 0.7], [12.6, 6.6, 0.8], [8.4, 7.6, 0.55]].map(([x, y, r], k) => <circle key={k} cx={x} cy={y} r={r} fill={cor(BRANCO)} {...C(0.3)} />)}
      <path d="M14.2 13 Q14 16.4 14.4 18 H16.4 Q16.8 16.4 16.4 13 Z" fill={cor(CREME)} {...C(0.5)} />
      <path d="M12 13.2 Q12.4 10 15.4 10 Q18.4 10 18.6 13.2 Q15.4 14 12 13.2 Z" fill={cor(ROSA)} {...C(0.6)} />
      <path d="M3 15.2 Q2.8 17 3.2 18 H4.4 Q4.8 17 4.6 15.2 Z" fill={cor(CREME)} {...C(0.45)} /><path d="M1.6 15.4 Q2 13.2 3.8 13.2 Q5.6 13.2 6 15.4 Q3.8 16 1.6 15.4 Z" fill={cor(AMARELO)} {...C(0.5)} />
      <path d="M0.6 18.4 Q10 17 19.4 18.4" {...L(0.6)} />{[1.6, 5.6, 12, 18].map(x => <path key={x} d={`M${x} 18.2 l-0.4 -1 M${x} 18.2 l0.4 -1.1`} stroke={cor(VERDE)} strokeWidth={s(0.35)} />)}
    </g>;
    case 'paisagem_no_circulo': return <g {...L(0.45)}>
      <circle cx={10} cy={10} r={9.2} strokeWidth={s(0.6)} />
      <circle cx={14.4} cy={5.6} r={1.3} />
      <path d="M1.4 12.4 L5.8 6.2 L8.2 9 L11.2 4.4 L16.4 11.4 L18.6 12.6" /><path d="M10.4 5.6 L11.2 6.4 L12 5.6 M5.2 7.2 L5.8 7.8 L6.4 7.2" strokeWidth={s(0.3)} />
      <path d="M0.8 12.6 H19.2" />{[[3, 14.2, 6], [8, 14.2, 13], [11.4, 15.6, 15.4], [5, 15.6, 8.6], [7.6, 17, 12.6]].map(([a, y, b], k) => <path key={k} d={`M${a} ${y} H${b}`} strokeWidth={s(0.3)} />)}
      {pinheiro(2.6, 12.6, 3.4)}{pinheiro(4, 12.6, 2.4)}{pinheiro(17, 12.6, 3)}
      <path d="M6.6 3.4 l0.6 0.4 l0.6 -0.4 M8.4 2.6 l0.4 0.3 l0.4 -0.3" strokeWidth={s(0.3)} />
    </g>;
    case 'cacto': return <g>
      <circle cx={11.4} cy={4.8} r={3.4} fill={cor(AMARELO)} {...C(0.5)} />
      <path d={`M0.6 18 Q8 16.6 ${W - 0.6} 18 V19.6 H0.6 Z`} fill={cor(PALHA)} {...C(0.6)} />
      <path d="M6 18 V6.4 Q6 4.4 8 4.4 Q10 4.4 10 6.4 V18 Z M6 12.2 H4 Q2.6 12.2 2.6 10.8 V8.2 Q2.6 7 3.6 7 Q4.6 7 4.6 8.2 V10.2 H6 Z M10 10.2 H12 Q13.4 10.2 13.4 8.8 V7 Q13.4 5.8 12.4 5.8 Q11.4 5.8 11.4 7 V8.4 H10 Z" fill={cor(VERDE)} {...C(0.9)} />
      <path d="M8 5.4 V17.4 M7 6 V17.4 M9 6 V17.4" stroke={cor(VERDE_CLARO)} strokeWidth={s(0.3)} />
      {[[5.6, 8], [10.4, 9], [5.6, 14], [10.4, 15], [2.2, 9], [13.8, 7.6]].map(([x, y], k) => <path key={k} d={`M${x} ${y} l${x < 8 ? -0.6 : 0.6} -0.3`} {...L(0.3)} />)}
      <path d="M8 4.4 Q6.8 2.6 8 2.2 Q9.2 2.6 8 4.4 Z M8 4.4 Q6.4 3.8 6.6 3 M8 4.4 Q9.6 3.8 9.4 3" fill={cor(ROSA)} {...C(0.35)} />
    </g>;
    case 'ilha': return <g>
      <circle cx={16} cy={3} r={1.8} fill={cor(AMARELO)} {...C(0.4)} />
      <path d="M3.6 11 Q9 7.4 14.6 11 Z" fill={cor(PALHA)} {...C(0.6)} />
      <path d="M8.6 9.4 Q9.6 6 11 3.6" fill="none" stroke={tinta} strokeWidth={s(0.8)} strokeLinecap="round" />
      {['M11 3.6 Q8.6 2 6.4 3.6', 'M11 3.6 Q9.6 0.6 7.6 1', 'M11 3.6 Q13 1.2 15 2.4', 'M11 3.6 Q13.8 3.6 14.6 5.8', 'M11 3.6 Q9.4 4.6 8.4 6.6'].map((d, k) => <g key={k}><path d={d} fill="none" stroke={tinta} strokeWidth={s(1.2)} strokeLinecap="round" /><path d={d} fill="none" stroke={cor(VERDE)} strokeWidth={s(0.6)} strokeLinecap="round" /></g>)}
      <circle cx={10.6} cy={4.4} r={0.45} fill={tinta} /><circle cx={11.4} cy={4.6} r={0.45} fill={tinta} />
      <path d={ondas(0.6, 19.4, 11.6, 0.5, 6)} fill="none" stroke={cor(AZUL)} strokeWidth={s(0.6)} /><path d={ondas(3, 17, 13.2, 0.4, 4)} fill="none" stroke={cor(AZUL)} strokeWidth={s(0.45)} />
    </g>;
    case 'costela_de_adao': return <g>
      <path d={`M10 18.4 Q1 16 1.2 8.6 Q1.6 2 9 1.6 Q10 1.6 10.4 3.2 Q11 1.6 12.4 1.8 Q18.8 2.6 18.8 9.6 Q18.6 16.4 10 18.4 Z`} fill={cor(VERDE)} {...C(0.7)} />
      <path d="M10.4 3 Q10.6 10 10 18.4 L11 19.8" {...L(0.6)} />
      <path d="M1.4 6.4 L6 8 M1.2 10.8 L6.4 11.6 M2.4 14.8 L6.8 14 M18.6 6.6 L14.2 7.8 M18.8 11 L14 11.6 M17.6 15 L13.6 14.2" {...L(0.75)} />
      <path d="M10.4 6 L5 3.6 M10.4 9.4 L2 8.4 M10.2 13 L3 13 M10.4 6 L15.4 3.8 M10.4 9.4 L18 8.6 M10.2 13 L17 13.2" fill="none" stroke={cor(VERDE_CLARO)} strokeWidth={s(0.3)} />
    </g>;
    case 'samambaia': { const c = W / 2; return <g {...L(0.4)}>
      <path d={`M${c - 0.4} 19.6 Q${c + 0.6} 11 ${c} 4.4`} strokeWidth={s(0.55)} />
      <path d={espiral(c + 0.6, 2.8, 1.8, 1.4, Math.PI)} />
      {Array.from({ length: 11 }, (_, k) => { const y = 5.2 + k * 1.3, l = 1.2 + k * 0.32, x = c + Math.sin(y * 0.2) * 0.3; return <g key={k}>
        <path d={`M${f(x)} ${f(y)} Q${f(x - l * 0.5)} ${f(y - 1)} ${f(x - l)} ${f(y - 0.5)} Q${f(x - l * 0.5)} ${f(y + 0.3)} ${f(x)} ${f(y)} Z`} />
        <path d={`M${f(x)} ${f(y + 0.6)} Q${f(x + l * 0.5)} ${f(y - 0.4)} ${f(x + l)} ${f(y + 0.1)} Q${f(x + l * 0.5)} ${f(y + 0.9)} ${f(x)} ${f(y + 0.6)} Z`} /></g>; })}
    </g>; }
    case 'terrario': { const c = W / 2; return <g>
      <path d={`M2.6 19.2 L1.6 15.6 H${W - 1.6} L${W - 2.6} 19.2 Z`} fill={cor(MARROM)} />
      {[[4, 17.4], [6, 18.2], [11.6, 17.6], [13.4, 18.4]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r={0.6} fill={cor(CINZA3)} {...C(0.25)} />)}
      {[[0, -4.2, 2.4], [-2.8, -2.6, 2.2], [2.8, -2.6, 2.2], [-1.6, -1, 2], [1.6, -1, 2]].map(([dx, dy], k) => <path key={k} d={`M${c + dx * 0.4} 15.4 Q${c + dx - 1} ${15.4 + dy * 0.5} ${c + dx} ${15.4 + dy} Q${c + dx + 1} ${15.4 + dy * 0.5} ${c + dx * 0.4} 15.4 Z`} fill={cor(k % 2 ? VERDE : VERDE_CLARO)} {...C(0.4)} />)}
      <path d={`M${c} 0.8 L${W - 1} 6 L${W - 2.6} 19.2 H2.6 L1 6 Z`} {...L(0.7)} />
      <path d={`M${c} 0.8 L${c - 2.9} 6 L1 6 M${c} 0.8 L${c + 2.9} 6 L${W - 1} 6 M${c - 2.9} 6 H${c + 2.9} M${c - 2.9} 6 L${c - 3.9} 19.2 M${c + 2.9} 6 L${c + 3.9} 19.2`} {...L(0.35)} />
      <path d="M3 8 L2.6 12" stroke={cor(BRANCO)} strokeWidth={s(0.5)} strokeLinecap="round" />
    </g>; }
    case 'lua_sobre_o_mar': return <g>
      {Array.from({ length: 150 }, (_, k) => { const a = sorte(k) * Math.PI * 2, r = Math.pow(sorte(k + 900), 0.45) * 5.6; const sombra = 0.5 + (Math.cos(a) * r) / 11; return sorte(k + 1700) < 0.35 + sombra * 0.65 ? <circle key={k} cx={f(10 + Math.cos(a) * r)} cy={f(7.4 + Math.sin(a) * r)} r={0.24} fill={tinta} /> : null; })}
      <circle cx={10} cy={7.4} r={5.8} fill="none" stroke={tinta} strokeWidth={s(0.3)} strokeDasharray="0.01 0.6" strokeLinecap="round" />
      {[14.2, 15.6, 17, 18.4].map((y, k) => <path key={y} d={ondas(0.8 + k * 0.6, 19.2 - k * 0.6, y, 0.5, 5 - (k % 2))} fill="none" stroke={tinta} strokeWidth={s(0.45)} strokeDasharray="0.01 0.65" strokeLinecap="round" />)}
      {[14.8, 16.2, 17.6].map((y, k) => <path key={y} d={`M${8.6 + k * 0.4} ${y} H${11.4 - k * 0.4}`} {...L(0.5)} />)}
    </g>;
    case 'cachoeira': return <g>
      <path d="M0.4 2 L4.6 2.6 L5.4 8 L4.4 14 L5 19.6 H0.4 Z" fill={cor(CINZA3)} {...C(0.5)} /><path d="M14.6 1.4 L10.4 2.6 L9.8 8.4 L10.8 13.6 L10 19.6 H14.6 Z" fill={cor(CINZA3)} {...C(0.5)} />
      {[0, 1, 2, 3, 4].map(k => <path key={k} d={`M${1 + k * 0.6} ${5 + k * 2.6} l2 -1 M${11.4 + k * 0.5} ${4.6 + k * 2.8} l2 -1`} {...L(0.25)} opacity={0.7} />)}
      {[5.8, 6.8, 7.8, 8.8, 9.6].map((x, k) => <g key={k}>{rascunho(`M${x} 2.8 Q${x + 0.4} 8 ${x - 0.2} 15.2`, 0.35 + (k % 2) * 0.1)}</g>)}
      <path d="M4.6 16.4 Q5.6 15 6.8 16 Q7.6 14.8 8.8 15.8 Q9.8 15 10.6 16.4" {...L(0.45)} /><path d="M4.8 18 Q7.6 17.2 10.4 18" {...L(0.35)} />
      {pinheiro(1.8, 2.2, 2.4)}{pinheiro(3.6, 2.4, 1.8)}{pinheiro(12.6, 1.8, 2.2)}
    </g>;
    case 'ginkgo': return <g {...L(0.45)}>
      <path d="M10 19.4 Q8.6 14 7.4 10.4 M10 19.4 Q10.6 15 11.8 12.2" />
      <path d="M7.4 10.4 Q3.4 7.6 2.4 4.6 Q4.8 1.6 7.2 2.6 L7.6 3.4 L8.2 2.4 Q10.8 2.4 12 4 Q10.4 7.4 7.4 10.4 Z" />
      {[3.4, 4.6, 6, 7.4, 9, 10.4].map((x, k) => <path key={k} d={`M7.4 10.4 L${x} ${3.6 - Math.abs(k - 2.5) * -0.3}`} strokeWidth={s(0.2)} />)}
      <path d="M11.8 12.2 Q12.6 8.4 14.4 6.6 Q17.4 5.6 18.8 7.6 L17.8 8.4 L18.8 9 Q18.2 11.6 11.8 12.2 Z" />
      {[[14.6, 7.2], [16.2, 7], [17.6, 8.2], [18, 9.6], [16, 10.8]].map(([x, y], k) => <path key={k} d={`M11.8 12.2 L${x} ${y}`} strokeWidth={s(0.2)} />)}
    </g>;
    case 'pinheiros_aquarela': return <g>
      {mancha(10, 7, 9, 6, AZUL, 8, 0.32)}{mancha(7, 5, 5, 3.4, TURQUESA, 9, 0.3)}
      {[[18.4, 3.4, 0.5], [1.2, 12.4, 0.6], [17, 13, 0.35]].map(([x, y, r], k) => <circle key={k} cx={x} cy={y} r={r} fill={cor(AZUL)} opacity={0.5} />)}
      {pinheiro(6.4, 13.6, 10.4, VERDE)}{pinheiro(11.4, 13.6, 8, VERDE)}{pinheiro(15, 13.6, 5.6, VERDE)}
      <path d="M6.4 13.6 V14.8 M11.4 13.6 V14.8 M15 13.6 V14.6" {...L(0.6)} />
      <path d="M1.6 14.8 Q10 13.8 18.4 14.8" {...L(0.4)} />
      <path d="M13.4 3.4 l0.6 0.4 l0.6 -0.4 M15.6 4.6 l0.5 0.3 l0.5 -0.3" {...L(0.3)} />
    </g>;
    case 'vulcao': return <g>
      {[[7.4, 4.6, 2.6], [11, 3, 2.4], [14, 4.8, 2], [9.4, 1.8, 1.6]].map(([x, y, r], k) => <circle key={k} cx={x} cy={y} r={r} fill={cor(CINZA3)} {...C(0.45)} />)}
      <path d="M1 19.4 L7.4 7.6 H12.6 L19 19.4 Z" fill={cor(CINZA1)} {...C(0.7)} />
      <ellipse cx={10} cy={7.6} rx={2.6} ry={0.8} fill={cor(AMARELO)} {...C(0.45)} />
      <path d="M8 8 Q7.6 11 5.4 13 Q4.4 14.6 5.6 16.4 Q6.4 14 7.6 13.6 Q8.6 11 9.4 8.2 Z M11 8.2 Q12 11.6 13.4 12.8 Q14.6 14 14 17.4 Q15.6 15.6 15.4 13.4 Q14 11 12.4 8 Z" fill={cor(LARANJA)} {...C(0.45)} />
      <path d="M8.6 8.4 Q8 11 6.4 13.4 M11.8 8.4 Q12.6 11 14.4 13.4" fill="none" stroke={cor(AMARELO)} strokeWidth={s(0.4)} />
      {[[4.6, 7.6], [15.6, 7], [3.4, 10.4]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r={0.45} fill={cor(VERMELHO)} {...C(0.25)} />)}
    </g>;
  }
  return desenho129c(id, p);
}

/** Os autorais. */
function desenho129c(id: string, p: PincelDaTatuagem): ReactNode | undefined {
  const { tinta, cor, traco, W, H } = p;
  const s = (w: number) => w * traco;
  const L = (w: number) => ({ fill: 'none', stroke: tinta, strokeWidth: s(w), strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const });
  const C = (w: number) => ({ stroke: tinta, strokeWidth: s(w), strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const });
  const rascunho = (d: string, w = 0.45) => <g><path d={d} {...L(w)} /><path d={d} {...L(w * 0.6)} transform="translate(0.28 0.18)" opacity={0.45} /></g>;
  /** Mancha irregular (respingo, aquarela). */
  const borrao = (cx: number, cy: number, r: number, k: number, n = 14) => {
    const ps = Array.from({ length: n }, (_, j) => { const a = (j / n) * Math.PI * 2, q = r * (0.7 + sorte(k * 13 + j) * 0.55); return [cx + Math.cos(a) * q, cy + Math.sin(a) * q]; });
    const m = (i: number) => { const a = ps[i % n], b = ps[(i + 1) % n]; return `${f((a[0] + b[0]) / 2)} ${f((a[1] + b[1]) / 2)}`; };
    return `M${m(0)} ` + ps.map((_, i) => `Q${f(ps[(i + 1) % n][0])} ${f(ps[(i + 1) % n][1])} ${m(i + 1)}`).join(' ') + ' Z';
  };
  switch (id) {
    /* ---------------- geométrica */
    case 'cubos_isometricos': { const cubo = (cx: number, cy: number, r: number, k: number) => { const P = (g: number) => [f(cx + Math.cos((g * Math.PI) / 180) * r), f(cy - Math.sin((g * Math.PI) / 180) * r)].join(' ');
      return <g key={k}>
        <path d={`M${cx} ${cy} L${P(150)} L${P(90)} L${P(30)} Z`} fill={tinta} />
        <path d={`M${cx} ${cy} L${P(30)} L${P(-30)} L${P(-90)} Z`} fill={cor(BRANCO)} {...C(0.5)} />
        <path d={`M${cx} ${cy} L${P(-90)} L${P(-150)} L${P(150)} Z`} {...L(0.5)} />
        {[0.25, 0.5, 0.75].map(t => <path key={t} d={`M${f(cx + Math.cos(Math.PI / 6) * r * t)} ${f(cy - 0.5 * r * t)} v${r}`} {...L(0.3)} />)}
        <path d={`M${cx} ${cy} L${P(150)} L${P(90)} L${P(30)} L${P(-30)} L${P(-90)} L${P(-150)} L${P(150)} M${cx} ${cy} L${P(-90)} M${cx} ${cy} L${P(30)}`} {...L(0.55)} />
      </g>; };
      return <g>{cubo(10, 6.8, 4.6, 0)}{cubo(6, 13.7, 4.6, 1)}{cubo(14, 13.7, 4.6, 2)}</g>; }
    case 'esfera_aramada': return <g transform="rotate(-18 10 10)" {...L(0.4)}>
      <circle cx={10} cy={10} r={8.8} strokeWidth={s(0.7)} />
      {[0.86, 0.5, 0.17].map(k => <ellipse key={k} cx={10} cy={10} rx={8.8 * k} ry={8.8} />)}<path d="M10 1.2 V18.8" />
      {[-60, -30, 0, 30, 60].map(g => { const a = (g * Math.PI) / 180, rx = 8.8 * Math.cos(a); return <ellipse key={g} cx={10} cy={f(10 + 8.8 * Math.sin(a))} rx={f(rx)} ry={f(rx * 0.22)} />; })}
    </g>;
    case 'sol_e_lua': return <g>
      {Array.from({ length: 9 }, (_, k) => { const a = Math.PI / 2 + (k / 8) * Math.PI; return <path key={k} d={`M${f(10 + Math.cos(a) * 6.2)} ${f(10 + Math.sin(a) * 6.2)} L${f(10 + Math.cos(a) * (k % 2 ? 8 : 9.4))} ${f(10 + Math.sin(a) * (k % 2 ? 8 : 9.4))}`} {...L(0.6)} />; })}
      <circle cx={10} cy={10} r={5.4} {...L(0.7)} /><path d="M10 3.6 V16.4" {...L(0.5)} />
      <path d="M10 4.6 A5.4 5.4 0 0 1 10 15.4 A4 5.4 0 0 0 10 4.6 Z" fill={tinta} />
      {[[16.4, 4.6], [17.6, 12.6], [14.6, 17.4], [18.4, 8.4]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r={0.45} fill={tinta} />)}
      <path d={estrela(15.4, 2.6, 0.9, 4, 0.3)} fill={tinta} />
      {[[7.4, 8.6], [8.4, 11.6], [6.8, 12.4]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r={0.35} fill={tinta} />)}
    </g>;
    case 'cubo_de_metatron': { const pts: [number, number][] = [[10, 10]]; for (const d of [3.1, 6.2]) for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 3; pts.push([f(10 + Math.cos(a) * d), f(10 + Math.sin(a) * d)]); }
      return <g>
        {pts.flatMap(([x1, y1], i) => pts.slice(i + 1).map(([x2, y2], j) => <path key={`${i}-${j}`} d={`M${x1} ${y1} L${x2} ${y2}`} {...L(0.18)} />))}
        {pts.map(([x, y], k) => <circle key={k} cx={x} cy={y} r={1.55} {...L(0.45)} />)}
        <circle cx={10} cy={10} r={9.2} {...L(0.35)} />
      </g>; }
    /* ---------------- abstrata */
    case 'respingos': return <g>
      <path d={borrao(8, 7.4, 4.4, 1, 18)} fill={cor(ROSA)} opacity={0.85} {...C(0.35)} />
      <path d={borrao(12.6, 8, 3.4, 2, 16)} fill={cor(TURQUESA)} opacity={0.8} {...C(0.35)} />
      <path d={borrao(9.6, 10.4, 2.4, 3, 12)} fill={cor(AMARELO)} opacity={0.85} {...C(0.3)} />
      {Array.from({ length: 12 }, (_, k) => { const a = sorte(k + 50) * Math.PI * 2, r = 5.6 + sorte(k + 60) * 3; return <circle key={k} cx={f(10 + Math.cos(a) * r * 1.2)} cy={f(7.6 + Math.sin(a) * r * 0.7)} r={0.25 + sorte(k + 70) * 0.5} fill={cor([ROSA, TURQUESA, AMARELO][k % 3])} {...C(0.2)} />; })}
      <path d="M8 11.4 Q8.2 12.8 7.8 13.8" fill="none" stroke={cor(ROSA)} strokeWidth={s(0.7)} strokeLinecap="round" />
    </g>;
    case 'enso': { const a0 = -1.1, a1 = 4.4, n = 40; const ext: string[] = [], int: string[] = []; for (let k = 0; k <= n; k++) { const t = k / n, a = a0 + (a1 - a0) * t; const ro = 8.6 + Math.sin(t * 9) * 0.15, ri = 8.6 - (2.2 - 1.9 * t) - sorte(k) * 0.2; ext.push(`${f(10 + Math.cos(a) * ro)} ${f(10 + Math.sin(a) * ro)}`); int.unshift(`${f(10 + Math.cos(a) * ri)} ${f(10 + Math.sin(a) * ri)}`); }
      return <g><path d={`M${ext.join(' L')} L${int.join(' L')} Z`} fill={tinta} />
        {[7.4, 7.8].map(r => <path key={r} d={`M${f(10 + Math.cos(0) * r)} ${f(10 + Math.sin(0) * r)} A${r} ${r} 0 0 1 ${f(10 + Math.cos(1.6) * r)} ${f(10 + Math.sin(1.6) * r)}`} fill="none" stroke={cor(BRANCO)} strokeWidth={s(0.2)} />)}
        <circle cx={f(10 + Math.cos(a1) * 8.4)} cy={f(10 + Math.sin(a1) * 8.4) - 0.6} r={0.3} fill={tinta} /></g>; }
    /* ---------------- minimalista */
    case 'xicara_de_cafe': return <g {...L(0.65)}>
      <path d="M4 8.6 H14 V12.4 Q14 17 9 17 Q4 17 4 12.4 Z" /><path d="M14 10 Q17.4 10 17 12.4 Q16.6 14.6 13.4 14.4" />
      <path d="M2 18.4 H16" /><path d="M6.6 6.6 Q5.6 5.4 6.6 4.2 Q7.6 3 6.6 1.6 M9 6.6 Q8 5.4 9 4.2 Q10 3 9 1.6 M11.4 6.6 Q10.4 5.4 11.4 4.2 Q12.4 3 11.4 1.6" strokeWidth={s(0.45)} />
    </g>;
    case 'clave_de_sol': return <g>
      <path d="M4.6 13.2 Q3.6 11.8 5 11 Q6.8 10.4 7.6 12 Q8.4 14.2 6.4 15.2 Q3.8 16.2 2.2 14.4 Q1 12.6 3 10.6 Q5.6 8.4 4.4 4.6 Q3.6 1.6 5.4 0.8 Q6.6 0.6 6.4 3 L5.6 17.6 Q5.6 19.4 3.8 19.2 Q2.8 19 3 18" {...L(0.75)} />
      <circle cx={3.8} cy={18} r={0.8} fill={tinta} />
    </g>;
    case 'bicicleta': return <g {...L(0.55)}>
      <circle cx={4.4} cy={8.2} r={3.8} /><circle cx={15.6} cy={8.2} r={3.8} />
      <path d="M4.4 8.2 L9.4 8.2 L8.2 3.4 Z M8.2 3.4 H14 L9.4 8.2 M14 3.4 L15.6 8.2 M13.6 2 L14 3.4 M12.8 2 H14.6 M7.2 2.8 H9.4" />
      <circle cx={9.4} cy={8.2} r={0.8} />
    </g>;
    case 'saturno': return <g transform={`rotate(-16 10 ${H / 2})`}>
      <path d={`M0.8 ${H / 2} A9.2 2.6 0 0 1 19.2 ${H / 2}`} {...L(0.6)} />
      <circle cx={10} cy={H / 2} r={4.2} fill={cor(BRANCO)} {...C(0.6)} /><path d={`M6.2 ${H / 2 - 1.2} Q10 ${H / 2 - 0.4} 13.8 ${H / 2 - 1.2}`} {...L(0.3)} />
      <path d={`M0.8 ${H / 2} A9.2 2.6 0 0 0 19.2 ${H / 2}`} {...L(0.6)} />
    </g>;
    /* ---------------- ornamental */
    case 'chave_antiga': { const c = W / 2; return <g>
      <circle cx={c} cy={3.4} r={2.8} {...L(0.7)} />
      {[0, 90, 180, 270].map(g => <ellipse key={g} cx={c} cy={2.2} rx={0.6} ry={1.1} transform={`rotate(${g} ${c} 3.4)`} {...L(0.35)} />)}
      <circle cx={c} cy={3.4} r={0.4} fill={tinta} />
      <path d={`M${c} 6.2 V18.6`} {...L(1)} /><path d={`M${c - 1.3} 7.4 H${c + 1.3} M${c - 1} 8.4 H${c + 1}`} {...L(0.55)} />
      <path d={`M${c - 1.6} 6.6 Q${c - 3.4} 7.6 ${c - 2.6} 9 M${c + 1.6} 6.6 Q${c + 3.4} 7.6 ${c + 2.6} 9`} {...L(0.4)} />
      <path d={`M${c} 14.6 H${c + 2.8} V15.8 H${c + 1.8} V17 H${c + 2.8} V18.6 H${c}`} fill={tinta} {...C(0.4)} />
    </g>; }
    case 'moldura_barroca': { const c = W / 2; return <g>
      <ellipse cx={c} cy={10.4} rx={6.2} ry={7.8} {...L(0.9)} /><ellipse cx={c} cy={10.4} rx={4.8} ry={6.4} {...L(0.4)} />
      <ellipse cx={c} cy={10.4} rx={5.5} ry={7.1} fill="none" stroke={tinta} strokeWidth={s(0.45)} strokeDasharray="0.01 0.9" strokeLinecap="round" />
      <path d={`M${c} 2.6 Q${c - 1.4} 0.6 ${c - 3} 1.4 Q${c - 4} 2.4 ${c - 3} 3.2 Q${c - 2.2} 3.4 ${c - 2.2} 2.6 M${c} 2.6 Q${c + 1.4} 0.6 ${c + 3} 1.4 Q${c + 4} 2.4 ${c + 3} 3.2 Q${c + 2.2} 3.4 ${c + 2.2} 2.6`} {...L(0.5)} />
      <path d={`M${c} 0.6 L${c - 0.6} 1.6 L${c} 2.6 L${c + 0.6} 1.6 Z`} fill={tinta} />
      <path d={`M${c} 18.2 Q${c - 2} 19.8 ${c - 3.6} 18.8 Q${c - 4.2} 17.8 ${c - 3.2} 17.4 M${c} 18.2 Q${c + 2} 19.8 ${c + 3.6} 18.8 Q${c + 4.2} 17.8 ${c + 3.2} 17.4`} {...L(0.5)} />
      {[-1, 1].map(k => <path key={k} d={`M${c + k * 6.2} 8 Q${c + k * 7.8} 9 ${c + k * 7.4} 10.4 Q${c + k * 7} 11.4 ${c + k * 6.4} 10.8 M${c + k * 6.2} 12.8 Q${c + k * 7.6} 13.6 ${c + k * 7.2} 14.8`} {...L(0.45)} />)}
    </g>; }
    /* ---------------- surrealista */
    case 'relogio_derretendo': return <g>
      <path d="M0.4 5.8 Q6 4.8 12 5.6 L15 4.2 M10 5.6 L12.4 7" fill="none" stroke={tinta} strokeWidth={s(1)} strokeLinecap="round" />
      <path d="M4.4 6 Q4.8 2.8 9.2 2.8 Q14.2 3 15 6.4 Q15.8 10 14.8 13.4 Q14.2 15.8 13 15.4 Q12.2 15 12.6 12.4 Q12.8 9.6 11 8.6 Q8.4 7.2 4.4 6 Z" fill={cor(OURO)} {...C(0.6)} />
      <path d="M5.8 5.8 Q6.4 3.8 9.4 3.8 Q13.2 4 13.8 6.6 Q14.4 9.6 13.8 12.6 Q13.4 13.6 13.4 12 Q13.4 9 11.6 7.8 Q9 6.6 5.8 5.8 Z" fill={cor(BRANCO)} {...C(0.35)} />
      {[[9.4, 4.4], [12.6, 5.4], [13.6, 8.6], [13.6, 11.4], [7, 5.2]].map(([x, y], k) => <path key={k} d={`M${x} ${y} l0.2 0.5`} {...L(0.35)} />)}
      <path d="M10 5.6 L11.6 4.6 M10 5.6 L12.4 7.6" {...L(0.4)} /><circle cx={10} cy={5.6} r={0.3} fill={tinta} />
      <circle cx={9.4} cy={1.6} r={0.7} fill={cor(OURO)} {...C(0.35)} />
      <path d="M13 15.4 Q13 16.2 13.2 16.4" {...L(0.4)} />
    </g>;
    case 'mao_com_olho': return <g>
      <path d="M4 19.4 L3.6 13 Q2.6 11.4 1.2 9.6 Q0.6 8.6 1.6 8.4 Q2.6 8.4 4 10.4 L4 4 Q4 3 4.9 3 Q5.8 3 5.8 4 V9 L6.2 2 Q6.2 1 7.1 1 Q8 1 8 2 V9 L8.6 2.4 Q8.6 1.4 9.5 1.4 Q10.4 1.4 10.4 2.4 L10.2 9.2 L11.2 4.4 Q11.4 3.6 12.2 3.6 Q13 3.8 12.8 4.8 L12 13 Q11.6 15 11.6 19.4 Z" fill={cor(BRANCO)} {...C(0.6)} />
      <path d="M4.4 13.2 Q7.8 9.6 11.4 13.2 Q7.8 16.6 4.4 13.2 Z" fill={cor(BRANCO)} {...C(0.5)} />
      <circle cx={7.9} cy={13.2} r={1.5} fill={cor(CINZA2)} {...C(0.35)} /><circle cx={7.9} cy={13.2} r={0.65} fill={tinta} />
      <path d="M13.4 8 L15.2 7 M13.6 10.6 L15.6 10.6 M13.4 13.2 L15.2 14" {...L(0.4)} />
      <path d="M5 17.6 Q8 18.4 11 17.6" {...L(0.35)} />
    </g>;
    case 'cabeca_de_passaros': return <g>
      <path d="M4.6 19.6 L4.8 16.6 Q2 15 1.8 11.4 Q1.6 9.2 2.6 8 M12.2 8.6 Q12.8 9.6 12.4 10.4 L13.8 12.6 Q13.8 13.2 13 13.2 L12.8 14 Q13.2 14.6 12.6 15 Q13 15.8 12.2 16.2 Q10.6 16.6 9.8 16.4 L9.6 19.6" {...L(0.65)} />
      <path d="M2.6 8 L3.8 8.8 L4.8 7.8 L6.2 8.8 L7.4 7.6 L8.8 8.6 L10.2 7.8 L11.2 8.8 L12.2 8.6" {...L(0.45)} />
      <path d="M10.2 10.4 Q11 10 11.6 10.6" {...L(0.4)} /><path d="M11.4 13.8 H12.8" {...L(0.35)} />
      {[[7.4, 5.6, 1.2], [10.4, 3.6, 1], [5, 3, 0.9], [8.6, 1.4, 0.7], [13, 1.2, 0.6], [12.8, 5.2, 0.8]].map(([x, y, r], k) => <path key={k} d={`M${x - r * 1.6} ${y - r * 0.4} Q${x - r * 0.6} ${y - r} ${x} ${y} Q${x + r * 0.6} ${y - r} ${x + r * 1.6} ${y - r * 0.4} Q${x + r * 0.6} ${y - r * 0.2} ${x} ${y + r * 0.5} Q${x - r * 0.6} ${y - r * 0.2} ${x - r * 1.6} ${y - r * 0.4} Z`} fill={tinta} />)}
    </g>;
    case 'ampulheta_do_mar': { const c = W / 2; return <g>
      <path d={`M2 2.2 Q2 7.6 ${c} 10 Q${W - 2} 7.6 ${W - 2} 2.2 Z`} fill={cor(CELESTE)} />
      <path d={`M3.2 4.6 Q4 3.4 5 4 Q5.8 3.2 6.8 4 Q7.8 3.6 8 4.6 Z`} fill={cor(BRANCO)} {...C(0.3)} /><path d="M7.4 6.2 l0.5 0.3 l0.5 -0.3" {...L(0.3)} />
      <path d={`M2.6 14.4 Q4.4 13.8 ${c} 14.4 Q${W - 4.4} 15 ${W - 2.6} 14.4 Q${W - 2} 16 ${W - 2} 17.8 H2 Q2 16 2.6 14.4 Z`} fill={cor(AZUL)} />
      <path d={`M3.8 14.2 L5.6 14.2 L5.2 14.8 H4.2 Z M4.8 14.2 V12.8 L5.6 14`} fill={cor(BRANCO)} {...C(0.25)} />
      <path d={`M${c} 10 V14.4`} stroke={cor(AZUL)} strokeWidth={s(0.4)} />
      <path d={`M2 2.2 Q2 7.6 ${c} 10 Q${W - 2} 7.6 ${W - 2} 2.2 M2 17.8 Q2 12.4 ${c} 10 Q${W - 2} 12.4 ${W - 2} 17.8`} {...L(0.55)} />
      <rect x={0.6} y={0.6} width={W - 1.2} height={1.6} rx={0.4} fill={cor(MARROM)} {...C(0.5)} /><rect x={0.6} y={17.8} width={W - 1.2} height={1.6} rx={0.4} fill={cor(MARROM)} {...C(0.5)} />
    </g>; }
    /* ---------------- conceitual */
    case 'lampada_planta': { const c = W / 2; return <g>
      <path d={`M${c} 13 Q${c - 0.2} 10 ${c} 6.4`} stroke={cor(VERDE)} strokeWidth={s(0.6)} fill="none" />
      <path d={`M${c} 9.2 Q${c - 3.2} 7.6 ${c - 3.4} 9.6 Q${c - 1.6} 10.6 ${c} 9.2 Z M${c} 7.2 Q${c + 3} 5 ${c + 3.4} 7 Q${c + 2} 8.6 ${c} 7.2 Z`} fill={cor(VERDE_CLARO)} {...C(0.4)} />
      <path d={`M${c - 2.4} 13.6 Q${c} 12.4 ${c + 2.4} 13.6 Z`} fill={cor(MARROM)} />
      <path d={`M${c} 1 Q${W - 1.4} 1 ${W - 1.4} 7 Q${W - 1.4} 10 ${c + 3} 12.4 V14 H${c - 3} V12.4 Q1.4 10 1.4 7 Q1.4 1 ${c} 1 Z`} {...L(0.7)} />
      <rect x={c - 3} y={14} width={6} height={3.4} fill={cor(CINZA3)} {...C(0.55)} /><path d={`M${c - 3} 15.2 H${c + 3} M${c - 3} 16.3 H${c + 3}`} {...L(0.35)} />
      <path d={`M${c - 1.6} 17.4 L${c - 0.8} 19 H${c + 0.8} L${c + 1.6} 17.4`} fill={tinta} />
      <path d={`M3 3 Q3.6 2 4.6 1.8`} stroke={cor(BRANCO)} strokeWidth={s(0.5)} fill="none" strokeLinecap="round" />
    </g>; }
    case 'quebra_cabeca': { const enc = 'M1 5 H4 Q4 3.4 5.4 3.4 Q6.8 3.4 6.8 5 H8.4'; return <g>
      <path d={`${enc} V8 Q10 8 10 9.4 Q10 10.8 8.4 10.8 V12.6 H6.8 Q6.8 14.2 5.4 14.2 Q4 14.2 4 12.6 H1 Z`} fill={tinta} {...C(0.5)} />
      <path d="M8.4 12.6 V10.8 Q10 10.8 10 9.4 Q10 8 8.4 8 V5 H11 Q11 3.4 12.4 3.4 Q13.8 3.4 13.8 5 H15.8 V8 Q14.2 8 14.2 9.4 Q14.2 10.8 15.8 10.8 V12.6" fill="none" stroke={tinta} strokeWidth={s(0.45)} strokeDasharray="0.7 0.5" />
      <path d="M1 12.6 H4 Q4 14.2 5.4 14.2 Q6.8 14.2 6.8 12.6 H8.4 V15.4 Q10 15.4 10 16.8 Q10 18.2 8.4 18.2 V19.6 H1 Z" fill={cor(BRANCO)} {...C(0.5)} />
      <path d="M8.4 12.6 H15.8 V19.6 H8.4 V18.2 Q10 18.2 10 16.8 Q10 15.4 8.4 15.4 Z" fill={cor(CINZA3)} {...C(0.5)} />
      <g transform="rotate(18 16 4.6)"><path d="M13.6 2 H15 Q15 0.8 16 0.8 Q17 0.8 17 2 H18.6 V3.8 Q19.6 3.8 19.6 4.8 Q19.6 5.8 18.6 5.8 V7.4 H13.6 Z" fill={cor(BRANCO)} {...C(0.5)} /></g>
    </g>; }
    case 'gaiola_aberta': return <g>
      <path d="M1 8 Q1 2 6 2 Q11 2 11 8 V17.6 H1 Z" {...L(0.6)} />
      {[3, 4.8, 6, 7.2, 9].map(x => <path key={x} d={`M${x} ${x === 6 ? 2 : 2.6 + Math.abs(6 - x) * 0.6} V17.6`} {...L(0.35)} />)}
      <path d="M1 8 H11 M1 15 H11" {...L(0.35)} /><circle cx={6} cy={1.2} r={0.8} {...L(0.45)} />
      <rect x={0.4} y={17.6} width={11.2} height={1.8} rx={0.4} fill={tinta} />
      <path d="M11 10 L14.4 9 V14.6 L11 15" fill={cor(BRANCO)} {...C(0.5)} /><path d="M12.2 9.7 V14.8 M13.3 9.3 V14.7" {...L(0.3)} />
      <path d="M11.2 3.4 Q12.6 2.4 13.6 3.2 Q14.4 1 16 0.6 Q15 2.4 15.2 3.6 L16 4 L14.8 4.2 Q13.6 5.2 12.6 4.4 Z" fill={tinta} />
      <path d="M3.6 12.4 H8.4" {...L(0.4)} />
    </g>;
    case 'codigo_passaros': { const barras = [[0.6, 0.6], [1.6, 0.3], [2.3, 0.8], [3.5, 0.3], [4.2, 0.5], [5.2, 0.9], [6.5, 0.3], [7.2, 0.6], [8.2, 0.3]]; return <g>
      {barras.map(([x, w], k) => <rect key={k} x={x} y={3} width={w} height={7.4} fill={tinta} />)}
      <rect x={9} y={4.2} width={0.5} height={6.2} fill={tinta} /><rect x={9.9} y={5.6} width={0.3} height={4.8} fill={tinta} transform="rotate(-12 10 8)" />
      {[[11.8, 5.4, 0.8], [13.4, 3.6, 0.9], [15.4, 2.4, 1], [17.6, 1.4, 1.1]].map(([x, y, r], k) => <path key={k} d={`M${x - r * 1.6} ${y - r * 0.2} Q${x - r * 0.6} ${y - r} ${x} ${y} Q${x + r * 0.6} ${y - r} ${x + r * 1.6} ${y - r * 0.2} Q${x + r * 0.6} ${y - r * 0.1} ${x} ${y + r * 0.5} Q${x - r * 0.6} ${y - r * 0.1} ${x - r * 1.6} ${y - r * 0.2} Z`} fill={tinta} />)}
    </g>; }
    /* ---------------- blackwork */
    case 'mao_de_esqueleto': { const ossos: [number, number, number, number][] = [[4.3, 10.6, 4.3, 3.8], [6.5, 10.4, 6.5, 1.8], [8.9, 10.6, 8.9, 2.2], [11.2, 11, 11.6, 4.6]]; return <g>
      <path d="M2.6 19.6 L2.8 13.6 Q1.6 12 0.6 9.8 Q0.2 8.8 1.2 8.6 Q2.2 8.6 3.4 10.6 L3.4 4.4 Q3.4 3.4 4.3 3.4 Q5.2 3.4 5.2 4.4 V9 L5.6 2.2 Q5.6 1.2 6.5 1.2 Q7.4 1.2 7.4 2.2 V9 L8 2.6 Q8 1.6 8.9 1.6 Q9.8 1.6 9.8 2.6 L9.6 9.4 L10.6 4.8 Q10.8 4 11.6 4 Q12.4 4.2 12.2 5.2 L11.4 13.4 Q11 15 11 19.6 Z" fill={tinta} />
      {ossos.map(([x1, y1, x2, y2], k) => { const seg = [0, 0.45, 0.72, 1]; return <g key={k}>{seg.slice(0, -1).map((t, j) => { const t2 = seg[j + 1]; return <path key={j} d={`M${f(x1 + (x2 - x1) * t + 0)} ${f(y1 + (y2 - y1) * t - 0.25)} L${f(x1 + (x2 - x1) * t2)} ${f(y1 + (y2 - y1) * t2 + 0.25)}`} stroke={cor(BRANCO)} strokeWidth={s(0.55)} strokeLinecap="round" />; })}</g>; })}
      <path d="M2.8 11.6 L1.6 9.6 M3.4 13 L2.6 11.8" stroke={cor(BRANCO)} strokeWidth={s(0.55)} strokeLinecap="round" />
      {[[4.6, 12.4], [6.4, 12], [8.4, 12.2], [10.2, 12.6], [5.6, 13.6], [7.6, 13.6], [9.6, 13.8]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r={0.45} fill={cor(BRANCO)} />)}
      <path d="M5.4 15 L5.6 19.4 M8.8 15 L8.6 19.4" stroke={cor(BRANCO)} strokeWidth={s(0.7)} strokeLinecap="round" />
    </g>; }
    case 'olho_na_piramide': return <g>
      {Array.from({ length: 13 }, (_, k) => { const a = -Math.PI / 2 + ((k - 6) * Math.PI) / 9; const x1 = 10 + Math.cos(a) * 7, y1 = 11 + Math.sin(a) * 7, x2 = 10 + Math.cos(a) * 9.4, y2 = 11 + Math.sin(a) * 9.4; return y2 < 16 ? <path key={k} d={`M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)}`} {...L(0.4)} /> : null; })}
      <path d="M10 2.6 L18 17 H2 Z" fill={tinta} />
      <path d="M5.6 11.4 Q10 7.4 14.4 11.4 Q10 15.4 5.6 11.4 Z" fill={cor(BRANCO)} />
      <circle cx={10} cy={11.4} r={1.7} fill={tinta} /><circle cx={10.5} cy={10.9} r={0.4} fill={cor(BRANCO)} />
      <path d="M1.4 18.4 H18.6" {...L(0.5)} />
    </g>;
    /* ---------------- old school */
    case 'dados': return <g>
      <path d="M1.4 7 L4 4.6 H11.2 L8.6 7 Z" fill={cor(BRANCO)} {...C(0.7)} /><path d="M8.6 7 L11.2 4.6 V11.8 L8.6 14.2 Z" fill={cor(CINZA3)} {...C(0.7)} />
      <rect x={1.4} y={7} width={7.2} height={7.2} fill={cor(BRANCO)} {...C(0.8)} />
      {[[3, 8.6], [3, 10.6], [3, 12.6], [7, 8.6], [7, 10.6], [7, 12.6]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r={0.65} fill={tinta} />)}
      <circle cx={7.6} cy={5.8} r={0.5} fill={tinta} /><circle cx={9.9} cy={7.6} r={0.45} fill={tinta} /><circle cx={9.9} cy={10.6} r={0.45} fill={tinta} />
      <g transform="rotate(20 15 10)"><rect x={11.6} y={6.4} width={6.8} height={6.8} rx={0.6} fill={cor(BRANCO)} {...C(0.8)} /><circle cx={15} cy={9.8} r={1.1} fill={cor(VERMELHO)} {...C(0.35)} /></g>
      <path d="M12.4 2.6 l1.4 1 M14.6 1.4 l0.6 1.4 M17 1.6 l-0.2 1.4" {...L(0.4)} />
    </g>;
    case 'ferradura': return <g>
      <path d="M3.4 2.4 Q2 11 4.4 15 Q7 18.6 10 18.6 Q13 18.6 15.6 15 Q18 11 16.6 2.4 L13.6 2.4 Q14.6 10 12.8 13 Q11.6 15 10 15 Q8.4 15 7.2 13 Q5.4 10 6.4 2.4 Z" fill={cor(CINZA3)} {...C(0.8)} />
      {[[4.8, 5], [4.6, 9], [5.6, 13.2], [15.2, 5], [15.4, 9], [14.4, 13.2]].map(([x, y], k) => <rect key={k} x={x - 0.35} y={y - 0.6} width={0.7} height={1.2} fill={tinta} />)}
      {[0, 90, 180, 270].map(g => <path key={g} d="M10 8.2 Q8.4 6.6 9 5.6 Q9.6 5 10 5.8 Q10.4 5 11 5.6 Q11.6 6.6 10 8.2 Z" transform={`rotate(${g} 10 8.2)`} fill={cor(VERDE)} {...C(0.4)} />)}
      <path d="M10 8.2 Q10.6 10.4 11.6 11.6" stroke={cor(VERDE)} strokeWidth={s(0.5)} fill="none" />
    </g>;
    case 'coracao_sagrado': { const c = W / 2; return <g>
      {[-60, -30, 30, 60].map(g => { const a = ((g - 90) * Math.PI) / 180; return <path key={g} d={`M${f(c + Math.cos(a) * 7.6)} ${f(11 + Math.sin(a) * 7.6)} L${f(c + Math.cos(a) * 8.8)} ${f(11 + Math.sin(a) * 8.8)}`} stroke={cor(AMARELO)} strokeWidth={s(0.6)} strokeLinecap="round" />; })}
      <path d={`M${c} 0.4 V3 M${c - 1} 1.2 H${c + 1}`} {...L(0.5)} />
      <path d={`M${c} 9.4 Q${c - 2.6} 7.6 ${c - 1.6} 4.8 Q${c - 1} 6.2 ${c - 0.4} 6.2 Q${c - 1} 4.2 ${c + 0.6} 3 Q${c + 0.4} 4.8 ${c + 1.4} 5.4 Q${c + 2} 4.6 ${c + 1.6} 4 Q${c + 3.4} 6.4 ${c + 1} 9.4 Z`} fill={cor(LARANJA)} {...C(0.5)} />
      <path d={`M${c} 9 Q${c - 1} 8 ${c - 0.4} 6.8 Q${c} 7.6 ${c + 0.6} 6.4 Q${c + 1} 8 ${c} 9 Z`} fill={cor(AMARELO)} />
      <path d={`M${c} 19.4 Q0.6 14 1.4 10 Q2.2 6.8 5.2 7.2 Q7 7.4 ${c} 9.2 Q9 7.4 10.8 7.2 Q13.8 6.8 14.6 10 Q15.4 14 ${c} 19.4 Z`} fill={cor(VERMELHO)} {...C(0.9)} />
      <path d={`M1.8 12.4 Q${c} 15 14.2 12.4`} fill="none" stroke={cor(VERDE)} strokeWidth={s(0.9)} />
      <path d={`M2.6 12.2 l0.4 0.9 M4.4 13 l0.2 0.9 M6.4 13.4 l0.1 1 M9.6 13.4 l-0.1 1 M11.6 13 l-0.2 0.9 M13.4 12.2 l-0.4 0.9`} {...L(0.35)} />
      <path d={`M3.4 9.6 Q4 8.4 5.4 8.4`} stroke={cor(BRANCO)} strokeWidth={s(0.5)} fill="none" strokeLinecap="round" />
    </g>; }
    case 'as_de_espadas': { const c = W / 2; return <g>
      <rect x={0.6} y={0.6} width={W - 1.2} height={18.8} rx={1.2} fill={cor(BRANCO)} {...C(0.7)} />
      <path d={`M${c} 5 Q${c + 5} 9.6 ${c + 4.4} 12.4 Q${c + 3.6} 14.4 ${c + 1.2} 13 L${c + 2} 16 H${c - 2} L${c - 1.2} 13 Q${c - 3.6} 14.4 ${c - 4.4} 12.4 Q${c - 5} 9.6 ${c} 5 Z`} fill={tinta} />
      <path d={`M${c} 7.6 Q${c + 2} 9.6 ${c + 2} 11 M${c - 1.6} 9.4 Q${c - 2.6} 10.6 ${c - 2.4} 11.6`} stroke={cor(BRANCO)} strokeWidth={s(0.3)} fill="none" />
      <path d={`M1.6 3.6 L2.4 1.4 L3.2 3.6 M1.9 2.8 H2.9 M${W - 1.6} 16.4 L${W - 2.4} 18.6 L${W - 3.2} 16.4 M${W - 1.9} 17.2 H${W - 2.9}`} {...L(0.35)} />
      <path d={`M2.6 17.4 Q4 15.6 3 14.4 M${W - 2.6} 2.6 Q${W - 4} 4.4 ${W - 3} 5.6`} fill="none" stroke={cor(VERMELHO)} strokeWidth={s(0.4)} />
    </g>; }
    case 'farol': { const c = W / 2; const xa = (y: number) => 4.4 + ((17 - y) / 11) * 1.2, xb = (y: number) => 9.6 - ((17 - y) / 11) * 1.2; return <g>
      <path d={`M${c} 4.6 L0.4 2.6 V6.8 Z M${c} 4.6 L${W - 0.4} 2.6 V6.8 Z`} fill={cor(AMARELO)} opacity={0.55} />
      <path d={`M4.4 17 L5.6 6 H8.4 L9.6 17 Z`} fill={cor(BRANCO)} {...C(0.7)} />
      {[[8, 10], [12, 14]].map(([a, b], k) => <path key={k} d={`M${f(xa(a))} ${a} H${f(xb(a))} L${f(xb(b))} ${b} H${f(xa(b))} Z`} fill={cor(VERMELHO)} />)}
      <path d={`M4.4 17 L5.6 6 H8.4 L9.6 17 Z`} {...L(0.7)} />
      <rect x={5.2} y={3.4} width={3.6} height={2.6} fill={cor(AMARELO)} {...C(0.6)} /><path d={`M${c} 3.4 V6`} {...L(0.35)} />
      <path d={`M4.6 3.4 L${c} 1.2 L9.4 3.4 Z`} fill={cor(VERMELHO)} {...C(0.6)} /><path d={`M4.8 6 H9.2`} {...L(0.7)} />
      <path d={`M0.4 19.6 V17.6 Q3 16.4 5 17 Q7.4 16.4 9 17 Q11.4 16.4 13.6 17.6 V19.6 Z`} fill={tinta} />
      <path d={ondas(0.6, 13.4, 18.8, 0.4, 3)} fill="none" stroke={cor(AZUL)} strokeWidth={s(0.5)} />
    </g>; }
    /* ---------------- oriental */
    case 'daruma': return <g>
      <path d="M10 1 Q18.4 1 18.6 10.4 Q18.6 19 10 19 Q1.4 19 1.4 10.4 Q1.6 1 10 1 Z" fill={cor(VERMELHO)} {...C(0.9)} />
      <ellipse cx={10} cy={8.4} rx={5.4} ry={4.6} fill={cor(BRANCO)} {...C(0.6)} />
      <circle cx={7.8} cy={8.2} r={1.4} fill={tinta} /><circle cx={12.2} cy={8.2} r={1.4} {...L(0.5)} />
      <path d="M5.6 5.8 Q7.6 4.4 9.2 5.8 M10.8 5.8 Q12.4 4.4 14.4 5.8" fill="none" stroke={tinta} strokeWidth={s(0.9)} strokeLinecap="round" />
      <path d="M10 10.6 Q8.2 10.4 7 11.6 Q8 11 9 11.6 Q9.6 11.2 10 10.6 Q10.4 11.2 11 11.6 Q12 11 13 11.6 Q11.8 10.4 10 10.6 Z" fill={tinta} />
      <path d={espiral(6.4, 15.2, 1.6, 1.6)} fill="none" stroke={cor(OURO)} strokeWidth={s(0.5)} /><path d={espiral(13.6, 15.2, 1.6, 1.6, Math.PI)} fill="none" stroke={cor(OURO)} strokeWidth={s(0.5)} />
      <path d="M8.6 14.6 H11.4 M10 13.6 V17 M8.8 16 Q10 17 11.2 16" fill="none" stroke={cor(OURO)} strokeWidth={s(0.55)} />
    </g>;
    case 'lanterna_japonesa': { const c = W / 2; return <g>
      <path d={`M${c} 0.2 V1`} {...L(0.5)} />
      <path d={`M${c} 2.4 Q${W - 0.4} 2.6 ${W - 0.4} 10 Q${W - 0.4} 17.6 ${c} 17.4 Q0.4 17.6 0.4 10 Q0.4 2.6 ${c} 2.4 Z`} fill={cor(VERMELHO)} {...C(0.6)} />
      {[4.6, 7, 9.6, 12.2, 14.8].map(y => <path key={y} d={`M${0.4 + Math.abs(10 - y) * 0.28} ${y} Q${c} ${y + 0.7} ${W - 0.4 - Math.abs(10 - y) * 0.28} ${y}`} {...L(0.3)} />)}
      <circle cx={c} cy={10} r={2.4} fill={cor(BRANCO)} {...C(0.4)} /><path d={`M${c - 1} 9 H${c + 1} M${c} 9 V11.2 M${c - 1.2} 11 Q${c} 10.2 ${c + 1.2} 11`} {...L(0.45)} />
      <rect x={2.4} y={1} width={W - 4.8} height={1.6} rx={0.3} fill={tinta} /><rect x={2.4} y={17.2} width={W - 4.8} height={1.4} rx={0.3} fill={tinta} />
      <path d={`M${c} 18.6 V19.8 M${c - 0.8} 18.6 L${c - 1} 19.8 M${c + 0.8} 18.6 L${c + 1} 19.8`} {...L(0.35)} />
    </g>; }
    case 'crisantemo': { const anel = (n: number, r0: number, r1: number, w: number, c: string, g0: number) => Array.from({ length: n }, (_, k) => { const a = g0 + (k / n) * Math.PI * 2; const nx = -Math.sin(a) * w, ny = Math.cos(a) * w; const xa = 10 + Math.cos(a) * r0, ya = 10 + Math.sin(a) * r0, xb = 10 + Math.cos(a) * r1, yb = 10 + Math.sin(a) * r1; const xm = (xa + xb) / 2, ym = (ya + yb) / 2;
        return <path key={`${r0}-${k}`} d={`M${f(xa)} ${f(ya)} Q${f(xm + nx)} ${f(ym + ny)} ${f(xb)} ${f(yb)} Q${f(xm - nx)} ${f(ym - ny)} ${f(xa)} ${f(ya)} Z`} fill={cor(c)} {...C(0.3)} />; });
      return <g>{anel(24, 3, 9.4, 0.75, AMARELO, 0)}{anel(18, 2, 6.6, 0.75, LARANJA, 0.17)}{anel(12, 0.8, 4, 0.7, AMARELO, 0.3)}<circle cx={10} cy={10} r={1.3} fill={cor(LARANJA)} {...C(0.4)} /></g>; }
    case 'gato_da_sorte': { const c = W / 2; return <g>
      <rect x={2.4} y={10.6} width={11.2} height={8.8} rx={3} fill={cor(BRANCO)} {...C(0.7)} />
      <path d={`M2.4 10 Q0.6 7 1.4 4.4 Q2 3.2 3 4 Q3.4 6.4 4.4 8.6`} fill={cor(BRANCO)} {...C(0.6)} /><path d="M1.4 4.4 Q2.2 3 3 4" {...L(0.5)} />
      <circle cx={c} cy={7} r={5} fill={cor(BRANCO)} {...C(0.7)} />
      <path d={`M${c - 4.4} 4.6 L${c - 4} 0.8 L${c - 1.6} 2.4 Z M${c + 4.4} 4.6 L${c + 4} 0.8 L${c + 1.6} 2.4 Z`} fill={cor(BRANCO)} {...C(0.6)} /><path d={`M${c - 3.8} 3.4 L${c - 3.6} 1.8 L${c - 2.6} 2.6 Z M${c + 3.8} 3.4 L${c + 3.6} 1.8 L${c + 2.6} 2.6 Z`} fill={cor(ROSA)} />
      <path d={`M${c - 3} 6.6 Q${c - 2} 5.6 ${c - 1} 6.6 M${c + 1} 6.6 Q${c + 2} 5.6 ${c + 3} 6.6`} {...L(0.5)} />
      <path d={`M${c - 0.4} 8 H${c + 0.4} L${c} 8.5 Z`} fill={cor(ROSA)} {...C(0.25)} /><path d={`M${c} 8.5 Q${c - 0.8} 9.4 ${c - 1.4} 8.8 M${c} 8.5 Q${c + 0.8} 9.4 ${c + 1.4} 8.8`} {...L(0.35)} />
      <path d={`M${c - 2} 8.4 L${c - 4.6} 7.8 M${c - 2} 9 L${c - 4.6} 9.4 M${c + 2} 8.4 L${c + 4.6} 7.8 M${c + 2} 9 L${c + 4.6} 9.4`} {...L(0.25)} />
      <path d={`M${c - 4.4} 11.4 Q${c} 13 ${c + 4.4} 11.4`} fill="none" stroke={cor(VERMELHO)} strokeWidth={s(1)} /><circle cx={c} cy={13} r={0.9} fill={cor(OURO)} {...C(0.35)} />
      <ellipse cx={c + 2.6} cy={16.2} rx={2.2} ry={1.5} fill={cor(OURO)} {...C(0.5)} /><path d={`M${c + 1.4} 15.6 H${c + 3.8} M${c + 1.4} 16.8 H${c + 3.8}`} {...L(0.3)} />
      <path d={`M${c - 3} 18.4 Q${c - 1.8} 17.4 ${c - 0.6} 18.4`} {...L(0.4)} />
    </g>; }
    /* ---------------- fine line */
    case 'pena_fina': { const c = W / 2; return <g {...L(0.4)}>
      <path d={`M${c} 0.6 Q${W - 0.4} 4 ${W - 1} 10 Q${W - 1.6} 14.6 ${c + 0.2} 16.6 M${c} 0.6 Q0.4 4 0.8 9 L2.4 9.6 L1.2 10.4 Q1.6 14.2 ${c - 0.2} 16.6`} />
      <path d={`M${c} 1.2 Q${c + 0.2} 10 ${c} 19.6`} strokeWidth={s(0.5)} />
      {Array.from({ length: 8 }, (_, k) => { const y = 3.4 + k * 1.6; return <path key={k} d={`M${c} ${y + 1.2} L${c + 2.6 - Math.abs(k - 3.5) * 0.3} ${y} M${c} ${y + 1.2} L${c - 2.6 + Math.abs(k - 3.5) * 0.3} ${y}`} strokeWidth={s(0.22)} />; })}
      <path d={`M${c + 0.2} 16.8 l1.2 -0.6 M${c - 0.2} 17.2 l-1.2 -0.4`} strokeWidth={s(0.25)} />
    </g>; }
    case 'cometa': return <g>
      {[[0.6, 7.2, 0.5], [0.4, 9.2, 0.35], [1.6, 10.6, 0.3], [2.6, 5.2, 0.25]].map(([x, y, w], k) => <path key={k} d={`M15.6 3.6 L${x} ${y}`} {...L(w)} strokeDasharray={k % 2 ? '1.6 0.6' : undefined} />)}
      <path d={estrela(16.4, 3.4, 2.8, 4, 0.8)} fill={tinta} />
      {[[4, 1.8], [9.4, 1.2], [11.6, 9.6], [18.6, 8.6]].map(([x, y], k) => <path key={k} d={estrela(x, y, 0.7, 4, 0.2)} fill={tinta} />)}
    </g>;
    /* ---------------- tribal */
    case 'mascara_tiki': { const c = W / 2; return <g>
      <path d={`M1.6 4.6 L2.6 1 L4.6 3.6 L${c} 0.6 L${W - 4.6} 3.6 L${W - 2.6} 1 L${W - 1.6} 4.6 Q${W - 0.6} 12 ${W - 1.8} 16.6 Q${c} 20.4 1.8 16.6 Q0.6 12 1.6 4.6 Z`} fill={tinta} />
      <ellipse cx={c - 3} cy={7.6} rx={2.2} ry={1.8} fill={cor(BRANCO)} /><ellipse cx={c + 3} cy={7.6} rx={2.2} ry={1.8} fill={cor(BRANCO)} />
      <circle cx={c - 3} cy={7.6} r={0.9} fill={tinta} /><circle cx={c + 3} cy={7.6} r={0.9} fill={tinta} />
      <path d={`M${c - 5.4} 5 Q${c - 3} 3.6 ${c - 0.8} 5 M${c + 5.4} 5 Q${c + 3} 3.6 ${c + 0.8} 5`} fill="none" stroke={cor(BRANCO)} strokeWidth={s(0.6)} strokeLinecap="round" />
      <path d={`M${c} 6 V10.4 M${c - 1.6} 11 Q${c} 9.6 ${c + 1.6} 11`} fill="none" stroke={cor(BRANCO)} strokeWidth={s(0.6)} strokeLinecap="round" />
      <rect x={c - 3.6} y={12.4} width={7.2} height={3.6} rx={1.2} fill={cor(BRANCO)} />
      {[-2.4, -0.8, 0.8, 2.4].map(x => <path key={x} d={`M${c + x} 12.4 V16`} stroke={tinta} strokeWidth={s(0.45)} />)}<path d={`M${c - 3.6} 14.2 H${c + 3.6}`} stroke={tinta} strokeWidth={s(0.4)} />
    </g>; }
    case 'lua_tribal': return <g>
      <path d="M13.4 1.2 Q3.4 2 2.6 10 Q3 17.8 13.4 18.8 Q6.6 15.6 6.8 10 Q7.2 4.4 13.4 1.2 Z" fill={tinta} />
      <path d="M4 6 Q1 5.4 0.6 3 Q2.6 4.4 4.6 4.2 Z M3 12.6 Q0.4 13.8 0.6 16.4 Q2 14.4 3.8 14.2 Z M2.6 9.4 L0.4 9.8 L2.6 10.6 Z" fill={tinta} />
      <path d="M12 3.4 Q8.6 5.4 8.4 9.6 M12 16.6 Q8.8 15 8.4 11.4" fill="none" stroke={tinta} strokeWidth={s(0.5)} strokeLinecap="round" />
      <path d="M10.6 6.4 Q12.4 7 13 9 Q11.6 8 10.4 8.2 Z M10.6 13.6 Q12.4 13 13 11 Q11.6 12 10.4 11.8 Z" fill={tinta} />
      <path d={estrela(16, 10, 1.4, 4, 0.4)} fill={tinta} />
    </g>;
    /* ---------------- realista */
    case 'vela_acesa': { const c = W / 2; return <g>
      <circle cx={c} cy={4.6} r={4.2} fill={cor(CINZA3)} opacity={0.35} />
      <path d={`M${c} 7.6 Q${c - 2} 5 ${c} 1.2 Q${c + 2} 5 ${c} 7.6 Z`} fill={cor(CINZA3)} {...C(0.4)} /><path d={`M${c} 7 Q${c - 0.9} 5.6 ${c} 3.8 Q${c + 0.9} 5.6 ${c} 7 Z`} fill={cor(BRANCO)} />
      <path d={`M${c} 7.4 V8.6`} {...L(0.4)} />
      <path d={`M2.4 8.6 H7.6 V19.4 H2.4 Z`} fill={cor(CINZA3)} {...C(0.6)} />
      <path d={`M6.2 8.8 V19.2`} stroke={cor(CINZA2)} strokeWidth={s(1.4)} /><path d={`M3.4 8.8 V19.2`} stroke={cor(BRANCO)} strokeWidth={s(0.5)} opacity={0.7} />
      <path d={`M2.4 8.6 Q2.6 10.4 3 10.2 Q3.4 12 3.8 11.2 Q4 9.4 4.4 9 M6.4 8.6 Q6.8 10.6 7.2 10.4 Q7.6 9.6 7.6 8.6`} fill={cor(CINZA3)} {...C(0.4)} />
    </g>; }
    case 'ampulheta': { const c = W / 2; return <g>
      <path d={`M2.6 2.2 Q2.6 7.6 ${c} 10 Q${W - 2.6} 7.6 ${W - 2.6} 2.2`} fill={cor(BRANCO)} opacity={0.6} />
      <path d={`M3.6 5.6 Q${c} 6.4 ${W - 3.6} 5.6 Q${W - 4.4} 8 ${c} 10 Q4.4 8 3.6 5.6 Z`} fill={cor(CINZA2)} />
      <path d={`M${c} 10 V17`} stroke={cor(CINZA2)} strokeWidth={s(0.3)} /><path d={`M3 17.8 Q${c} 13.6 ${W - 3} 17.8 Z`} fill={cor(CINZA2)} />
      <path d={`M2.6 2.2 Q2.6 7.6 ${c} 10 Q${W - 2.6} 7.6 ${W - 2.6} 2.2 M2.6 17.8 Q2.6 12.4 ${c} 10 Q${W - 2.6} 12.4 ${W - 2.6} 17.8`} {...L(0.5)} />
      <path d={`M3.4 3.4 Q3.6 6 5 7.6`} stroke={cor(BRANCO)} strokeWidth={s(0.45)} fill="none" strokeLinecap="round" />
      <rect x={0.4} y={0.6} width={W - 0.8} height={1.6} rx={0.4} fill={cor(CINZA1)} {...C(0.5)} /><rect x={0.4} y={17.8} width={W - 0.8} height={1.6} rx={0.4} fill={cor(CINZA1)} {...C(0.5)} />
      <path d={`M1.2 2.2 V17.8 M${W - 1.2} 2.2 V17.8`} {...L(0.7)} />
    </g>; }
    /* ---------------- neotradicional */
    case 'lua_com_rosto': return <g>
      <path d="M12.4 1.4 Q2 2.4 2 10 Q2 17.6 12.4 18.6 Q8.4 16.8 7.6 14.4 Q8.6 13.6 7.6 13 Q8.2 12.4 7.4 11.8 L8.6 10.2 L7.2 9.6 Q6.8 4.8 12.4 1.4 Z" fill={cor(AMARELO)} {...C(0.8)} />
      <path d="M4.4 8.6 Q5.4 9.6 6.4 8.6" {...L(0.5)} /><path d="M4.6 9 l-0.4 0.6 M5.4 9.3 v0.7 M6.2 9 l0.4 0.6" {...L(0.3)} />
      <circle cx={5.4} cy={12} r={1} fill={cor(ROSA)} opacity={0.7} />
      {[[11.4, 17.2, VERMELHO], [14, 15.6, ROSA]].map(([x, y, c], k) => <g key={k}><circle cx={x as number} cy={y as number} r={1.5} fill={cor(c as string)} {...C(0.45)} /><path d={espiral(x as number, y as number, 1, 1.2)} {...L(0.3)} /></g>)}
      <path d="M12.6 18.8 Q14 19.8 15.6 18.6 Q14 18 12.6 18.8 Z M15.4 16.6 Q17.6 16.6 18 15 Q16.2 14.6 15.4 16.6 Z" fill={cor(VERDE)} {...C(0.35)} />
      <path d={estrela(16, 5, 1.6, 4, 0.5)} fill={cor(AMARELO)} {...C(0.35)} /><circle cx={18.2} cy={9} r={0.4} fill={tinta} />
    </g>;
    /* ---------------- pontilhismo */
    case 'sol_pontilhado': return <g>
      {Array.from({ length: 90 }, (_, k) => { const a = sorte(k) * Math.PI * 2, r = Math.sqrt(sorte(k + 300)) * 4.2; return <circle key={k} cx={f(10 + Math.cos(a) * r)} cy={f(10 + Math.sin(a) * r)} r={0.18 + (1 - r / 4.2) * 0.14} fill={tinta} />; })}
      {Array.from({ length: 16 }, (_, k) => { const a = (k / 16) * Math.PI * 2, n = k % 2 ? 5 : 7; return <g key={`r${k}`}>{Array.from({ length: n }, (_, j) => <circle key={j} cx={f(10 + Math.cos(a) * (5.4 + j * 0.65))} cy={f(10 + Math.sin(a) * (5.4 + j * 0.65))} r={0.32 - j * 0.03} fill={tinta} />)}</g>; })}
      <circle cx={10} cy={10} r={4.7} fill="none" stroke={tinta} strokeWidth={s(0.45)} strokeDasharray="0.01 0.6" strokeLinecap="round" />
    </g>;
    /* ---------------- sketch */
    case 'lapis_desenhando': return <g>
      {rascunho('M1 13.4 Q3 11.4 5 12.4 Q6.6 13.2 8 11.8', 0.4)}
      {rascunho('M8 11.8 Q9.6 10 11.6 10.6 L13.6 9 L12.8 10.8 Q13.2 12.6 11.4 13.2 Q9.6 13.6 8.4 12.6 Z', 0.4)}
      {rascunho('M10.8 10.8 Q10.4 8.4 8 7.6 Q9.2 9.6 9.8 11', 0.35)}<circle cx={12.2} cy={10.6} r={0.25} fill={tinta} />
      {[0, 1, 2].map(k => <path key={k} d={`M${9 + k * 0.8} ${13.2 - k * 0.1} l0.6 -1.2`} {...L(0.2)} opacity={0.6} />)}
      <path d="M13.6 9 L18.6 1.4 L19.8 2.2 L14.8 9.8 Z" fill={cor(AMARELO)} {...C(0.5)} />
      <path d="M13.6 9 L14.8 9.8 L13.4 10.6 Z" fill={cor(CREME)} {...C(0.4)} /><path d="M13.4 10.6 L13.7 10 L14 10.4 Z" fill={tinta} />
      <path d="M18.6 1.4 L19.2 0.4 L20 1 L19.8 2.2" fill={cor(ROSA)} {...C(0.4)} />
      <path d={ondas(0.6, 7.4, 16.4, 0.4, 3)} {...L(0.3)} opacity={0.6} />
    </g>;
    /* ---------------- aquarela */
    case 'coracao_aquarela': return <g>
      <path d={borrao(8, 8.4, 5.4, 11, 16)} fill={cor(ROSA)} opacity={0.55} />
      <path d={borrao(12.4, 10.6, 4.6, 12, 14)} fill={cor(ROXO)} opacity={0.45} />
      <path d={borrao(10, 12.6, 3.4, 13, 12)} fill={cor(VERMELHO)} opacity={0.45} />
      {[[3, 15.4, 0.6], [17.4, 4.6, 0.5], [16.4, 16.6, 0.4], [2.4, 3.4, 0.35]].map(([x, y, r], k) => <circle key={k} cx={x} cy={y} r={r} fill={cor(k % 2 ? ROXO : ROSA)} opacity={0.7} />)}
      <path d="M10 17.4 Q2.6 12 3.4 7.4 Q4.4 3.6 7.6 4.2 Q9.2 4.6 10 6.6 Q10.8 4.6 12.4 4.2 Q15.6 3.6 16.6 7.4 Q17.4 12 10 17.4 Z" {...L(0.45)} />
    </g>;
  }
  return undefined;
}
