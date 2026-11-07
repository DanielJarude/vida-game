/**
 * VIDA 13 (correção final) — A ARTE DOS PERSONAGENS, lote D (`motor/dados/tatuagens13cD`). Caixa nativa (o lado maior
 * mede 20), contorno em `tinta`, cor por `cor`, como `tatuagens13Pop`. Os personagens desenhados de verdade, pelas
 * ilustrações originais em domínio público (McCay, Herriman, Segar 1929, Outcault, Doré, Flaxman, Crane).
 */
import type { ReactNode } from 'react';
import {
  AMARELO, AREIA, atalhos, AZUL, BRANCO, CELESTE, CINZA1, CINZA2, CINZA3, CREME, estrela, f, LARANJA, MARROM, ondas, OURO,
  PRATA, ROSA, ROXO, TERRA, TURQUESA, VERDE, VERDE_CLARO, VERMELHO, type PincelDaTatuagem13
} from './tatuagens13Base';

const PELE = '#f3cfae';

export function desenho13cD(id: string, p: PincelDaTatuagem13): ReactNode | undefined {
  const { tinta, cor, W, H } = p;
  const { s, L, C } = atalhos(p);
  /** Âncora pequena (tatuagem do Popeye). */
  const ancora = (x: number, y: number, k: number) => <g>
    <circle cx={x} cy={y - 1.3 * k} r={0.35 * k} {...L(0.3)} />
    <path d={`M${x} ${y - 0.95 * k} V${y + 1.2 * k} M${x - 0.7 * k} ${y - 0.5 * k} H${x + 0.7 * k} M${x - 1 * k} ${y + 0.4 * k} Q${x - 0.8 * k} ${y + 1.4 * k} ${x} ${y + 1.25 * k} Q${x + 0.8 * k} ${y + 1.4 * k} ${x + 1 * k} ${y + 0.4 * k}`} {...L(0.32)} />
  </g>;
  /** Olho simples: ponto com brilho. */
  const olho = (x: number, y: number, r = 0.32) => <g><circle cx={x} cy={y} r={r} fill={tinta} /><circle cx={x + r * 0.35} cy={y - r * 0.35} r={r * 0.3} fill={cor(BRANCO)} /></g>;
  /** Serpente: dois arcos quadráticos [x0 y0 c1 p1 c2 p2] e a cabeça no fim, de língua bifurcada. */
  const serpente = (k: number, q: number[], verde = VERDE, larg = 1.25) => {
    const [x0, y0, a1, b1, x1, y1, a2, b2, x2, y2] = q;
    const d = `M${x0} ${y0} Q${a1} ${b1} ${x1} ${y1} Q${a2} ${b2} ${x2} ${y2}`;
    const ang = Math.atan2(y2 - b2, x2 - a2) * 180 / Math.PI;
    return <g key={k}>
      <path d={d} {...L(larg)} /><path d={d} fill="none" stroke={cor(verde)} strokeWidth={s(larg * 0.55)} strokeLinecap="round" />
      <g transform={`translate(${f(x2)} ${f(y2)}) rotate(${f(ang)}) scale(${f(Math.max(1, larg / 1.25))})`}>
        <path d="M0.9 0 l0.7 -0.3 M0.9 0 l0.7 0.3" {...L(0.2)} stroke={cor(VERMELHO)} />
        <ellipse cx={0.1} cy={0} rx={0.95} ry={0.62} fill={cor(verde)} {...C(0.35)} />
        <circle cx={0.25} cy={-0.28} r={0.14} fill={tinta} />
      </g>
    </g>;
  };
  /** Sereia da Odisseia como nos vasos gregos: corpo de ave, cabeça de mulher, cantando. `d` = para onde olha. */
  const sereiaAve = (x: number, y: number, d: number, k: number) => <g transform={`translate(${x} ${y}) scale(${k})`}>
    <path d={`M${-1.4 * d} 1.8 L${-3 * d} 2.8 M${-1.4 * d} 2 L${-2.8 * d} 3.3 M${-1.2 * d} 2.2 L${-2.3 * d} 3.6`} {...L(0.35 / k)} />
    <path d={`M${-0.1 * d} 2.5 L${-0.3 * d} 3.4 M${0.4 * d} 2.5 L${0.5 * d} 3.4 M${-0.6 * d} 3.4 h${0.7 * d} M${0.2 * d} 3.4 h${0.6 * d}`} {...L(0.28 / k)} />
    <path d={`M${0.5 * d} 0.5 Q${1.4 * d} 2.4 ${0 * d} 2.7 Q${-1.2 * d} 2.6 ${-1.8 * d} 1.8 Q${-0.8 * d} 0.5 ${0.5 * d} 0.5 Z`} fill={cor(OURO)} {...C(0.4 / k)} />
    <path d={`M${-0.2 * d} 1.2 Q${-1.2 * d} -1.2 ${-2.8 * d} -0.8 Q${-2.2 * d} 0.4 ${-1.6 * d} 1.8 Z`} fill={cor(AMARELO)} {...C(0.4 / k)} />
    <path d={`M${-1.2 * d} 0.2 L${-1.8 * d} 1.4 M${-1.9 * d} -0.4 L${-2.1 * d} 0.8`} {...L(0.25 / k)} />
    <path d={`M${-0.4 * d} -0.6 Q${-1.2 * d} 0 ${-0.9 * d} 1.2 L${-0.2 * d} 0.6 Z`} fill={cor(MARROM)} {...C(0.3 / k)} />
    <circle cx={0} cy={0} r={0.75} fill={cor(PELE)} {...C(0.4 / k)} />
    <path d={`M${-0.75 * d} 0.1 Q${-0.7 * d} -0.9 ${0.2 * d} -0.8 Q${0.7 * d} -0.6 ${0.6 * d} -0.3 Q${-0.1 * d} -0.5 ${-0.4 * d} 0.3 Z`} fill={cor(MARROM)} {...C(0.25 / k)} />
    <circle cx={0.3 * d} cy={-0.05} r={0.11} fill={tinta} /><circle cx={0.55 * d} cy={0.4} r={0.13} fill={tinta} />
    <path d={`M${1.2 * d} -0.4 v-1 l${0.5 * d} 0.2`} {...L(0.22 / k)} /><ellipse cx={1.05 * d} cy={-0.35} rx={0.22} ry={0.16} fill={tinta} />
  </g>;
  switch (id) {
    /* ================================================================ quadrinhos e animação antigos */
    case 'nemo_cama_que_anda': return <g>
      <path d="M17.6 1.2 A2 2 0 1 0 18.4 4.8 A2.4 2.4 0 0 1 17.6 1.2 Z" fill={cor(CREME)} {...C(0.4)} />
      {[[2.4, 2.4], [12.6, 1.6], [14.6, 4.8]].map(([x, y], k) => <path key={k} d={estrela(x, y, 0.55, 5, 0.24)} fill={cor(AMARELO)} {...C(0.25)} />)}
      {[[0, 15.2, 3.8], [3.8, 13.6, 4.6], [12, 14.6, 4], [16, 16.2, 4]].map(([x, y, w], k) => <g key={k}>
        <rect x={x + 0.2} y={y} width={w - 0.4} height={19.8 - y} fill={cor(k % 2 ? CINZA2 : CINZA3)} {...C(0.45)} />
        <rect x={x + 0.9} y={y + 1.1} width={0.8} height={0.9} fill={cor(AMARELO)} /><rect x={x + w - 1.8} y={y + 2.6} width={0.8} height={0.9} fill={cor(AMARELO)} />
      </g>)}
      <rect x={5} y={12.2} width={0.9} height={1.5} fill={cor(TERRA)} {...C(0.35)} />
      {[[5.2, 3, 11.8, 2.2, 15.1], [6.3, 7.6, 11.6, 6.6, 13.5], [14, 15.2, 12, 13.8, 14.5], [15.2, 17.8, 11.4, 17.6, 16.1]].map(([x0, xk, yk, x1, y1], k) => <g key={k}>
        <path d={`M${x0} 9.3 L${xk} ${yk} L${x1} ${y1}`} {...L(1.05)} />
        <path d={`M${x0} 9.3 L${xk} ${yk} L${x1} ${y1}`} fill="none" stroke={cor(OURO)} strokeWidth={s(0.45)} strokeLinejoin="round" />
        <circle cx={x1} cy={y1 - 0.25} r={0.4} fill={cor(OURO)} {...C(0.3)} />
      </g>)}
      <rect x={3.9} y={7.2} width={12.4} height={2.2} rx={0.4} fill={cor(BRANCO)} {...C(0.55)} />
      <path d="M7.6 6.9 Q12 6.2 16.4 6.8 L16.4 9.4 L7.2 9.4 Z" fill={cor(VERMELHO)} {...C(0.5)} />
      <path d="M10.4 6.6 V9.4 M13.4 6.5 V9.4 M7.4 8.1 H16.4" fill="none" stroke={cor(CREME)} strokeWidth={s(0.3)} opacity={0.8} />
      <rect x={3.2} y={2.6} width={1.3} height={6.9} rx={0.3} fill={cor(OURO)} {...C(0.45)} /><circle cx={3.85} cy={2.2} r={0.65} fill={cor(OURO)} {...C(0.4)} />
      <rect x={15.9} y={5.2} width={1.1} height={4.3} rx={0.3} fill={cor(OURO)} {...C(0.45)} /><circle cx={16.45} cy={4.8} r={0.55} fill={cor(OURO)} {...C(0.4)} />
      <path d="M4.5 3.8 Q6 3.4 6 6.8" {...L(0.35)} />
      <ellipse cx={5.3} cy={6.9} rx={1.3} ry={0.6} fill={cor(BRANCO)} {...C(0.4)} />
      <path d="M6.2 7.4 Q6.4 5.4 7.6 5.3 Q8.8 5.4 9 7.2 Z" fill={cor(BRANCO)} {...C(0.5)} />
      <path d="M8.6 6 Q10 6.2 10.6 7.2" {...L(0.75)} /><path d="M8.6 6 Q10 6.2 10.6 7.2" fill="none" stroke={cor(BRANCO)} strokeWidth={s(0.35)} strokeLinecap="round" />
      <circle cx={10.7} cy={7.2} r={0.42} fill={cor(PELE)} {...C(0.3)} />
      <circle cx={7.6} cy={4} r={1.55} fill={cor(PELE)} {...C(0.5)} />
      <path d="M6 4.1 Q5.9 2.1 7.7 2.2 Q9.4 2.3 9.2 3.8 Q8.4 3 7.2 3.4 Q6.6 3.7 6 4.1 Z" fill={cor(MARROM)} {...C(0.35)} />
      {olho(7.4, 4.2, 0.22)}{olho(8.5, 4.2, 0.22)}
      <circle cx={8} cy={5} r={0.25} {...L(0.25)} />
    </g>;
    case 'krazy_kat_e_ignatz': return <g>
      <path d={`M10.6 ${H - 2.4} L11.6 6.4 H15.8 L16.2 7.6 H18.8 L19.6 ${H - 2.4} Z`} fill={cor(TERRA)} opacity={0.55} {...C(0.35)} />
      <rect x={0.4} y={H - 2.4} width={19.2} height={2} rx={0.4} fill={cor(AREIA)} {...C(0.4)} />
      <path d={`M2 ${H - 1.4} h1.4 M7 ${H - 1} h1 M12.6 ${H - 1.3} h1.6`} {...L(0.3)} />
      <path d={`M1.8 ${H - 4.2} Q0.2 ${H - 4.8} 1 ${H - 6.6} Q1.6 ${H - 7.6} 0.8 ${H - 8.4}`} {...L(0.35)} />
      <path d={`M2.6 ${H - 2.4} L3 ${H - 4.2} M4.4 ${H - 2.4} L4 ${H - 4.2}`} {...L(0.5)} />
      <path d={`M2.2 ${H - 4} Q2 ${H - 7} 3.6 ${H - 7.2} Q5 ${H - 7} 4.8 ${H - 4} Z`} fill={cor(BRANCO)} {...C(0.45)} />
      <path d={`M4.6 ${H - 6.4} L6.6 ${H - 8.4}`} {...L(0.5)} />
      <circle cx={3.2} cy={H - 9.6} r={0.85} fill={tinta} /><circle cx={4.9} cy={H - 9.9} r={0.85} fill={tinta} />
      <path d={`M2.8 ${H - 8.2} Q3 ${H - 9.8} 4.4 ${H - 9.4} Q5.8 ${H - 9} 6.2 ${H - 8.2} Q4.6 ${H - 7.2} 2.8 ${H - 8.2} Z`} fill={cor(BRANCO)} {...C(0.4)} />
      <circle cx={6.25} cy={H - 8.25} r={0.25} fill={tinta} /><circle cx={4.4} cy={H - 8.7} r={0.18} fill={tinta} />
      <path d="M6.6 4.8 h1.4 M6.2 6 h1.6 M7 7.2 h1" {...L(0.3)} opacity={0.8} />
      <g transform="rotate(-18 10.2 5)">
        <rect x={8.8} y={4.2} width={2.8} height={1.6} rx={0.15} fill={cor(VERMELHO)} {...C(0.45)} />
        <path d="M8.8 5 H11.6 M10.2 4.2 V5 M9.5 5 V5.8 M10.9 5 V5.8" fill="none" stroke={cor(CREME)} strokeWidth={s(0.2)} />
      </g>
      <path d="M14.2 2.7 c-0.5 -0.9 -1.8 -0.4 -1.3 0.6 l1.3 1.3 l1.3 -1.3 c0.5 -1 -0.8 -1.5 -1.3 -0.6 Z" fill={cor(VERMELHO)} {...C(0.3)} />
      <path d={`M14.2 ${H - 2.4} L14 ${H - 4.4} M16 ${H - 2.4} L16.2 ${H - 4.4}`} {...L(0.55)} />
      <path d={`M13.2 ${H - 4.2} Q12.8 ${H - 7.6} 15 ${H - 7.8} Q17.2 ${H - 7.6} 16.8 ${H - 4.2} Z`} fill={tinta} />
      <path d={`M16.8 ${H - 4.6} Q19 ${H - 5} 18.6 ${H - 7.4} Q18.4 ${H - 8.4} 19.2 ${H - 8.8}`} {...L(0.45)} />
      <path d={`M13.6 ${H - 6.8} L12.2 ${H - 8.6} M16.4 ${H - 6.8} L17.4 ${H - 8.2}`} {...L(0.45)} />
      <path d="M13 7.6 L12.6 4.4 L14 6 Z M17 7.6 L17.4 4.4 L16 6 Z" fill={tinta} {...C(0.3)} />
      <circle cx={15} cy={7.8} r={2.2} fill={tinta} />
      <path d="M13.6 8 Q13.6 6.8 15 6.8 Q16.4 6.8 16.4 8 Q16.4 9.6 15 9.7 Q13.6 9.6 13.6 8 Z" fill={cor(BRANCO)} />
      <ellipse cx={14.4} cy={7.6} rx={0.2} ry={0.36} fill={tinta} /><ellipse cx={15.6} cy={7.6} rx={0.2} ry={0.36} fill={tinta} />
      <circle cx={15} cy={8.5} r={0.25} fill={tinta} /><path d="M14.5 9 Q15 9.4 15.5 9" {...L(0.2)} />
      <path d="M14 10 L15 10.5 L16 10 L15.6 11 L15 10.6 L14.4 11 Z" fill={cor(VERMELHO)} {...C(0.25)} />
      <path d="M12.4 3.6 L11.9 3 M17.6 3.6 L18.2 3.1 M15 2 V1.2" {...L(0.3)} />
    </g>;
    case 'popeye_marinheiro_1929': return <g>
      <path d="M4.6 20 L5.2 12 Q8.5 10.6 12 12 L12.6 20 Z" fill={cor(AZUL)} {...C(0.55)} />
      <path d="M5.4 12 L8.6 16 L11.8 12 Q10 11.2 8.6 11.3 Q7 11.2 5.4 12 Z" fill={cor(BRANCO)} {...C(0.45)} />
      <path d="M6.4 12 L8.6 14.8 L10.8 12" fill="none" stroke={cor(AZUL)} strokeWidth={s(0.35)} />
      <path d="M8 15.2 L8.6 16.6 L9.2 15.2 Z" fill={cor(VERMELHO)} {...C(0.3)} />
      {[[1, 5.4, 3.4, 2.6], [-1, 11.6, 13.6, 14.4]].map(([d, sx, ex, fx], k) => <g key={k}>
        <path d={`M${sx} 12.4 Q${ex} 13.6 ${ex} 16.6`} {...L(1.5)} /><path d={`M${sx} 12.4 Q${ex} 13.6 ${ex} 16.6`} fill="none" stroke={cor(PELE)} strokeWidth={s(0.8)} strokeLinecap="round" />
        <path d={`M${ex} 17 Q${fx - d * 2.6} 15.6 ${fx - d * 2.3} 12.6 Q${fx - d * 1.8} 10.6 ${fx} 10.6 Q${fx + d * 1.9} 10.8 ${fx + d * 2} 13 Q${fx + d * 1.8} 15.8 ${ex} 17 Z`} fill={cor(PELE)} {...C(0.55)} />
        <rect x={fx - 1.25} y={8.5} width={2.5} height={2.3} rx={0.8} fill={cor(PELE)} {...C(0.5)} />
        <path d={`M${fx - 0.42} 8.7 v0.9 M${fx + 0.42} 8.7 v0.9 M${fx - d * 1.2} 9.9 q${d * 0.9} 0.1 ${d * 1.1} -0.5`} {...L(0.28)} />
        {ancora(fx - d * 0.1, 13.6, 0.95)}
      </g>)}
      <path d="M5.6 5 Q5.8 3.1 8.2 3.1 Q10.5 3.2 10.8 5.2 L11.1 5.7 Q12.3 6.1 11.5 6.9 Q10.9 7.3 11 7.6 Q12.9 7.8 12.9 9.3 Q12.7 11 10.6 10.9 Q8.4 10.8 7.3 10.1 Q5.3 8.8 5.6 5 Z" fill={cor(PELE)} {...C(0.55)} />
      <path d="M7.2 6.1 Q6.3 6 6.3 6.9 Q6.4 7.7 7.2 7.6" fill={cor(PELE)} {...C(0.4)} />
      <path d="M8.8 5.3 Q9.4 5.7 10 5.3" {...L(0.4)} />
      {olho(10.6, 5.25, 0.28)}
      <path d="M8.6 4.6 L9.9 4.8 M10.3 4.5 L11 4.6" {...L(0.3)} />
      <path d="M11 7.6 Q10 8.1 9.4 7.8" {...L(0.4)} />
      <path d="M9.8 9.6 Q11 10.1 12 9.4" {...L(0.25)} opacity={0.6} />
      <path d="M11.2 7.8 L13.2 8.1" {...L(0.5)} />
      <rect x={12.9} y={6.4} width={1.3} height={1.9} rx={0.25} fill={cor(AMARELO)} {...C(0.4)} />
      <path d="M13.1 7 h0.9 M13.1 7.6 h0.9" stroke={cor(TERRA)} strokeWidth={s(0.2)} />
      <path d="M13.6 6 Q13 5 13.8 4.4 Q14.6 3.8 14 2.8" {...L(0.3)} opacity={0.7} />
      <path d="M5.4 3.9 Q5.4 1.5 8 1.4 Q10.6 1.4 10.9 3.6 Z" fill={cor(BRANCO)} {...C(0.5)} />
      <path d="M5.2 3.6 Q8 2.9 11.1 3.4 L11.2 4.3 Q8 3.8 5.2 4.5 Z" fill={tinta} />
    </g>;
    case 'menino_amarelo': return <g>
      <circle cx={3.8} cy={5.6} r={1.25} fill={cor(PELE)} {...C(0.5)} /><circle cx={11.2} cy={5.6} r={1.25} fill={cor(PELE)} {...C(0.5)} />
      <path d="M3.9 5.6 q0.5 -0.5 0.4 0.4 M11.1 5.6 q-0.5 -0.5 -0.4 0.4" {...L(0.25)} />
      {[[1, 5.6, 0.9], [-1, 9.4, 14.1]].map(([d, sx, hx], k) => <g key={k}>
        <path d={`M${sx} 9.2 L${hx} 12 L${hx + d * 1.1} 13.6 L${sx - d * 0.2} 11.8 Z`} fill={cor(AMARELO)} {...C(0.5)} />
        <circle cx={hx + d * 0.1} cy={13.4} r={0.85} fill={cor(PELE)} {...C(0.45)} />
      </g>)}
      <path d="M5.6 8.8 Q7.5 8.2 9.4 8.8 L11.6 18.4 Q7.5 19 3.4 18.4 Z" fill={cor(AMARELO)} {...C(0.6)} />
      <path d="M6.6 11 L6 17.6 M8.8 11.6 L9.6 17.8" {...L(0.3)} opacity={0.55} />
      <path d="M6.4 9 Q7.5 9.8 8.6 9" {...L(0.35)} />
      <ellipse cx={5.8} cy={19.1} rx={1.05} ry={0.55} fill={cor(PELE)} {...C(0.45)} /><ellipse cx={9.2} cy={19.1} rx={1.05} ry={0.55} fill={cor(PELE)} {...C(0.45)} />
      <ellipse cx={7.5} cy={5} rx={3.4} ry={3.5} fill={cor(PELE)} {...C(0.6)} />
      <path d="M6.8 1.6 q0.2 -0.7 0.6 -0.5 M8 1.6 q0.3 -0.6 0.7 -0.3" {...L(0.25)} />
      <path d="M5.6 3.6 q0.6 -0.4 1.1 0 M8.3 3.6 q0.6 -0.4 1.1 0" {...L(0.3)} />
      {olho(6.2, 4.5, 0.3)}{olho(8.8, 4.5, 0.3)}
      <path d="M5.3 6.1 Q7.5 7.9 9.7 6.1 Q7.5 6.7 5.3 6.1 Z" fill={tinta} {...C(0.35)} />
      <rect x={6.85} y={6.35} width={0.6} height={0.55} fill={cor(BRANCO)} /><rect x={7.55} y={6.35} width={0.6} height={0.55} fill={cor(BRANCO)} />
      <path d="M7.3 5.2 q0.2 0.4 0.5 0" {...L(0.25)} />
    </g>;
    case 'gertie_dinossauro': return <g>
      <path d={`M0.4 ${H - 1} H19.6`} {...L(0.5)} />
      {[1.4, 8.4, 16.4].map((x, k) => <path key={k} d={`M${x} ${H - 1} l0.3 -0.8 l0.3 0.8 l0.3 -0.6`} {...L(0.3)} />)}
      <path d={`M15 ${H - 5.4} Q18.6 ${H - 5} 19.6 ${H - 2.2} Q17 ${H - 3.4} 14.6 ${H - 3.4} Z`} fill={cor(VERDE_CLARO)} {...C(0.5)} />
      <rect x={12.6} y={H - 4.6} width={1.9} height={3.6} rx={0.6} fill={cor(VERDE)} {...C(0.45)} />
      <rect x={7} y={H - 4.6} width={1.9} height={3.6} rx={0.6} fill={cor(VERDE)} {...C(0.45)} />
      <path d={`M6 ${H - 6} Q6.6 ${H - 10.6} 11 ${H - 10.4} Q16.2 ${H - 10} 16 ${H - 5.6} Q15.6 ${H - 3.4} 11 ${H - 3.4} Q6.4 ${H - 3.6} 6 ${H - 6} Z`} fill={cor(VERDE_CLARO)} {...C(0.6)} />
      <path d={`M7.4 ${H - 4.6} Q11 ${H - 3.4} 14.6 ${H - 4.6}`} fill="none" stroke={cor(CREME)} strokeWidth={s(0.7)} strokeLinecap="round" />
      <rect x={9.2} y={H - 4.8} width={2} height={3.8} rx={0.6} fill={cor(VERDE_CLARO)} {...C(0.5)} />
      <rect x={14} y={H - 4.8} width={2} height={3.8} rx={0.6} fill={cor(VERDE_CLARO)} {...C(0.5)} />
      {[9.6, 10.3, 11, 14.4, 15.1, 15.8].map((x, k) => <path key={k} d={`M${x} ${H - 1} v-0.5`} {...L(0.25)} />)}
      <path d={`M6.4 ${H - 7} Q4.6 ${H - 9} 5 ${H - 11.4} L7.2 ${H - 11.2} Q7 ${H - 9.4} 8.6 ${H - 8.4} Z`} fill={cor(VERDE_CLARO)} {...C(0.55)} />
      <ellipse cx={6.4} cy={H - 11.8} rx={2} ry={1.3} fill={cor(VERDE_CLARO)} {...C(0.55)} />
      <path d={`M4.6 ${H - 11.4} Q5.6 ${H - 10.8} 6.8 ${H - 11.2}`} {...L(0.3)} />
      <path d={`M6.4 ${H - 12.6} q0.5 -0.3 0.9 0.1`} {...L(0.3)} />{olho(6.8, H - 12.1, 0.25)}
      <circle cx={7.4} cy={H - 11.4} r={0.4} fill={cor(ROSA)} opacity={0.7} />
      <path d={`M2.4 ${H - 12.2} L5.8 ${H - 8.6}`} stroke={tinta} strokeWidth={s(1.1)} strokeLinecap="round" /><path d={`M2.4 ${H - 12.2} L5.8 ${H - 8.6}`} stroke={cor(TERRA)} strokeWidth={s(0.55)} strokeLinecap="round" />
      <ellipse cx={5.9} cy={H - 8.4} rx={0.8} ry={0.5} fill={cor(MARROM)} {...C(0.35)} />
      <path d={`M5.6 ${H - 8} l-0.4 1 M6 ${H - 8} l0.2 1.1 M6.4 ${H - 8.2} l0.7 0.8 M5.3 ${H - 8.3} l-0.8 0.5`} {...L(0.3)} />
      <circle cx={2.6} cy={H - 13.2} r={1.25} fill={cor(VERDE)} {...C(0.45)} /><circle cx={1.4} cy={H - 12} r={1.05} fill={cor(VERDE)} {...C(0.45)} /><circle cx={3.4} cy={H - 12.2} r={0.9} fill={cor(VERDE)} {...C(0.4)} />
      <path d={`M2 ${H - 12.6} q0.4 -0.4 0.8 0`} {...L(0.25)} />
      <path d={`M4.5 ${H - 11.6} Q4.9 ${H - 10.6} 5.3 ${H - 11.4}`} fill={cor(VERDE_CLARO)} {...C(0.35)} />
    </g>;
    /* ================================================================ livros, epopeias e mitos */
    case 'quixote_e_sancho': return <g>
      <path d={`M0.4 ${H - 0.6} H19.6`} {...L(0.5)} />
      <path d={`M1 ${H - 0.2} l1.2 -0.2 M9 ${H - 0.1} l1.6 -0.2 M15 ${H - 0.2} l1 -0.1`} {...L(0.25)} />
      <path d="M8.2 7.6 L14.6 0.4" {...L(0.55)} /><path d="M14.6 0.4 l-0.9 0.5 l0.5 -1 Z" fill={tinta} {...C(0.3)} />
      {[[3.6, 3.2], [4.6, 4.6], [8.4, 9], [9.4, 10.2]].map(([x, xp], k) => <path key={k} d={`M${x} 10.6 L${(x + xp) / 2} 13.4 L${xp} ${H - 0.8}`} {...L(0.55)} />)}
      <path d="M2.8 9.4 Q1.4 10.2 1.8 13" {...L(0.6)} />
      <path d="M2.8 9.2 Q3 8.4 4.6 8.6 L9 8.6 Q10.2 6.2 11.2 5.8 L12.8 7.6 Q12.6 8.2 11.6 7.8 L10.4 9.6 Q10 11.2 8 11.2 L4.4 11.2 Q2.6 11 2.8 9.2 Z" fill={cor(BRANCO)} {...C(0.55)} />
      <path d="M5 9.2 q0.4 1 0 1.8 M5.9 9.1 q0.4 1 0 1.9 M6.8 9.1 q0.4 1 0 1.9" {...L(0.25)} />
      <circle cx={11.2} cy={6.6} r={0.18} fill={tinta} /><path d="M10.8 5.8 l0.1 -0.8 l0.5 0.7" {...L(0.3)} />
      <path d="M6.4 8.6 L6 11.6 L6.8 12.6" {...L(0.65)} /><path d="M6.2 12.6 h1.2" {...L(0.4)} />
      <path d="M5.4 8.8 L5.8 4 Q6.4 3.4 7.2 4 L7.4 8.8 Z" fill={cor(CINZA3)} {...C(0.5)} />
      <path d="M5.8 5.4 h1.5 M5.7 6.8 h1.7" {...L(0.25)} />
      <path d="M7 4.6 L8.2 7.6" {...L(0.5)} />
      <circle cx={5.2} cy={6.8} r={1.15} fill={cor(CINZA2)} {...C(0.45)} /><circle cx={5.2} cy={6.8} r={0.3} fill={tinta} />
      <path d="M6.1 1.8 Q6.9 1.6 7.1 2.6 L7 3.6 Q6.6 4.2 6.2 3.8 Q5.7 3.2 5.8 2.4 Z" fill={cor(PELE)} {...C(0.45)} />
      <path d="M6.6 3.3 L6.7 4.4 L6.9 3.4 Z" fill={tinta} {...C(0.25)} /><path d="M6.4 3.1 q0.4 0.2 0.8 -0.1" {...L(0.25)} />
      <circle cx={6.75} cy={2.4} r={0.12} fill={tinta} />
      <path d="M5.5 2 Q5.6 0.4 6.6 0.4 Q7.7 0.4 7.8 2 Z" fill={cor(OURO)} {...C(0.4)} />
      <path d="M6 1.4 Q6.1 0.8 6.5 0.7" fill="none" stroke={cor(BRANCO)} strokeWidth={s(0.25)} strokeLinecap="round" />
      <path d="M4.5 2.2 Q4.6 1.7 5.4 1.8 L6.7 1.8 Q6.8 2.5 7.4 2.5 Q8 2.5 8 1.8 L8.6 1.8 Q9 2 8.6 2.4 L4.9 2.6 Q4.4 2.6 4.5 2.2 Z" fill={cor(OURO)} {...C(0.35)} />
      <path d="M6.6 2.9 Q6.2 3.1 6 2.9 M6.9 2.9 Q7.3 3.1 7.5 2.9" {...L(0.2)} />
      {[[13.6, 13.8], [14.4, 14.4], [17, 17.2], [17.8, 18]].map(([x, xp], k) => <path key={k} d={`M${x} 13.4 L${xp} ${H - 0.8}`} {...L(0.55)} />)}
      <path d="M13 11.8 Q12.2 12.4 12.6 13.8" {...L(0.5)} />
      <path d="M13 12.4 Q13 11.2 14.4 11.2 L17.6 11.2 Q18.4 10.2 18.9 9.6 L19.8 10.8 Q19.6 11.4 19 11.2 L18.6 12.4 Q18.4 13.8 17 13.8 L14.4 13.8 Q13 13.8 13 12.4 Z" fill={cor(CINZA2)} {...C(0.5)} />
      <path d="M18.6 9.8 L18.4 7.6 L19 9.4 M19 9.6 L19.4 7.6 L19.4 9.6" {...L(0.4)} />
      <circle cx={19.2} cy={10.2} r={0.13} fill={tinta} />
      <path d="M15.8 12 L15.6 13.6 L16.2 14.2" {...L(0.6)} />
      <ellipse cx={15.8} cy={10.4} rx={1.9} ry={1.7} fill={cor(AREIA)} {...C(0.5)} />
      <path d="M14.6 9.8 Q15.8 10.6 17 9.8" {...L(0.25)} />
      <path d="M17.2 10.2 L18 11.2" {...L(0.5)} />
      <circle cx={16} cy={7.8} r={1.05} fill={cor(PELE)} {...C(0.45)} />
      <path d="M15.2 8.4 Q16 9.4 16.9 8.3" fill={cor(CINZA2)} {...C(0.3)} />
      <circle cx={16.4} cy={7.6} r={0.12} fill={tinta} /><circle cx={16.95} cy={7.9} r={0.2} fill={cor(PELE)} {...C(0.25)} />
      <path d="M13.8 7 Q16 6.4 18.2 7 Q16 7.4 13.8 7 Z" fill={cor(MARROM)} {...C(0.4)} />
      <path d="M15.1 6.9 Q15.2 5.6 16 5.6 Q16.9 5.6 17 6.9" fill={cor(MARROM)} {...C(0.4)} />
    </g>;
    case 'gulliver_amarrado': return <g>
      <rect x={0.4} y={10.4} width={19.2} height={H - 10.8} rx={0.5} fill={cor(AREIA)} {...C(0.45)} />
      {[[1.2, 12.2], [9, 12.6], [16, 12]].map(([x, y], k) => <path key={k} d={`M${x} ${y} l0.3 -0.6 l0.3 0.6 l0.3 -0.5`} {...L(0.25)} />)}
      <path d="M2.2 9.4 L0.7 10.8 M2.1 10 L1.4 11 M2.6 7.6 L0.9 7.2 L0.9 10.6" {...L(0.22)} />
      <path d="M0.7 10.4 v0.8 M1.3 10.6 v0.7 M0.9 6.9 v0.6" {...L(0.3)} />
      <ellipse cx={3.4} cy={8.8} rx={1.75} ry={1.6} fill={cor(PELE)} {...C(0.5)} />
      <path d="M2.6 7.4 Q1.4 7.6 1.6 9 Q1.6 10.2 2.6 10.4 Q2.2 9.4 2.6 8.6 Q3 7.8 3.8 7.4 Q3.2 7.2 2.6 7.4 Z" fill={cor(MARROM)} {...C(0.35)} />
      <path d="M3.9 7.3 Q4.2 6.2 4.8 6.6 Q4.9 7.4 4.6 7.7" fill={cor(PELE)} {...C(0.35)} />
      <path d="M3.3 7.8 q0.3 -0.3 0.6 0" {...L(0.25)} />
      <circle cx={3.7} cy={8.2} r={0.17} fill={tinta} />
      <path d="M4.9 8.6 q-0.1 0.5 -0.6 0.6" {...L(0.28)} />
      <path d="M4.8 10.4 L5 8.6 Q5.4 7.4 8.6 7.2 Q11.2 7.2 12 8.4 L12.2 10.4 Z" fill={cor(VERMELHO)} {...C(0.5)} />
      <path d="M5.4 9.6 Q8.6 8.8 11.8 9.6" {...L(0.3)} opacity={0.7} />
      {[6.6, 8.2, 9.8].map((x, k) => <circle key={k} cx={x} cy={7.5} r={0.2} fill={cor(OURO)} {...C(0.15)} />)}
      <path d="M12 10.4 L12.1 8.4 Q13.4 8 14.4 8.6 L14.4 10.4 Z" fill={cor(MARROM)} {...C(0.45)} />
      <path d="M14.2 10.4 L14.2 8.8 L17.4 8.4 L17.6 10.4 Z" fill={cor(BRANCO)} {...C(0.45)} />
      <path d="M17.2 10.4 L17.2 6.8 Q17.4 6 18.2 6.2 L18.8 10.4 Z" fill={tinta} {...C(0.4)} />
      <rect x={17.3} y={7.8} width={1} height={0.7} fill={cor(OURO)} {...C(0.2)} />
      {[5.6, 7.2, 8.8, 10.4, 12.8, 15.6].map((x, k) => <g key={k}>
        <path d={`M${x - 0.7} 10.6 L${x} ${k < 4 ? 7.1 : 8.2} L${x + 0.7} 10.6`} fill="none" stroke={cor(TERRA)} strokeWidth={s(0.22)} />
        <path d={`M${x - 0.7} 10.4 v0.7 M${x + 0.7} 10.4 v0.7`} {...L(0.3)} />
      </g>)}
      {[[7.6, 7.1, VERDE], [10.6, 7.3, AZUL], [13.4, 8.1, ROXO]].map(([x, y, c], k) => <g key={k}>
        <path d={`M${x} ${+y} l-0.3 -0.8 M${x} ${+y} l0.3 -0.8`} {...L(0.22)} />
        <path d={`M${+x - 0.35} ${+y - 0.7} L${+x + 0.35} ${+y - 0.7} L${+x + 0.25} ${+y - 1.8} L${+x - 0.25} ${+y - 1.8} Z`} fill={cor(c as string)} {...C(0.22)} />
        <circle cx={x} cy={+y - 2.2} r={0.36} fill={cor(PELE)} {...C(0.22)} />
        <path d={`M${+x + 0.5} ${+y - 0.4} L${+x + 0.6} ${+y - 3.2}`} {...L(0.18)} />
      </g>)}
      <path d="M15.6 10.4 L16.8 8.6 M16 10.4 L17.2 8.6 M15.8 9.9 L16.3 10.1 M16.2 9.3 L16.7 9.5" {...L(0.2)} />
    </g>;
    case 'ulisses_no_mastro': return <g>
      <path d={`M0.4 ${H - 0.8} ${ondas(0.4, W - 0.4, H - 0.8, 0.5, 6).slice(ondas(0.4, W - 0.4, H - 0.8, 0.5, 6).indexOf(' q'))}`} {...L(0.4)} stroke={cor(AZUL)} />
      <path d="M0.4 20 L0.4 15.6 Q1.4 13.6 2.8 14.4 L3.6 20 Z" fill={cor(CINZA2)} {...C(0.45)} />
      {sereiaAve(2.8, 10.6, 1, 1)}
      {sereiaAve(14, 5.4, -1, 0.9)}
      <path d="M8.5 1 V16" {...L(0.9)} /><path d="M8.5 1 V16" stroke={cor(TERRA)} strokeWidth={s(0.4)} />
      <path d="M3.6 2.6 H13.4" {...L(0.6)} />
      <path d="M3.8 2.8 Q8.5 4.6 13.2 2.8 L13.2 3.4 Q8.5 5.4 3.8 3.4 Z" fill={cor(BRANCO)} {...C(0.4)} />
      {[5.4, 7.2, 9.8, 11.6].map((x, k) => <path key={k} d={`M${x} 3 v1.2`} stroke={cor(VERMELHO)} strokeWidth={s(0.5)} />)}
      <path d="M3.4 15 L13.6 15 Q15 15 15.6 13.2 Q16.4 11.4 15.6 10.8 Q16.6 12.6 15.4 13.6 L15.6 15 Q15 18.2 12.4 18.2 L5.6 18.2 Q4 18 3.4 15 Z" fill={cor(TERRA)} {...C(0.55)} />
      <path d="M3.8 16.2 H15" {...L(0.3)} />
      <path d="M13.6 16.4 Q14.2 16 14.8 16.4 Q14.2 16.9 13.6 16.4 Z" fill={cor(BRANCO)} {...C(0.25)} /><circle cx={14.2} cy={16.4} r={0.15} fill={tinta} />
      {[5, 7, 9, 11].map((x, k) => <path key={k} d={`M${x} 17 L${x - 1.6} 19.6`} {...L(0.35)} />)}
      <path d="M7.6 14.8 L7.8 12.6 M9.4 14.8 L9.2 12.6" {...L(0.6)} />
      <path d="M7 12.8 L7.4 8.4 Q8.5 7.8 9.6 8.4 L10 12.8 Z" fill={cor(BRANCO)} {...C(0.5)} />
      <path d="M7.4 9 L6.8 11 M9.6 9 L10.2 11" {...L(0.5)} />
      {[9.2, 10.8, 12.2].map((y, k) => <path key={k} d={`M6.7 ${y} Q8.5 ${y + 0.6} 10.3 ${y}`} {...L(0.8)} stroke={tinta} />)}
      {[9.2, 10.8, 12.2].map((y, k) => <path key={k} d={`M6.7 ${y} Q8.5 ${y + 0.6} 10.3 ${y}`} fill="none" stroke={cor(AREIA)} strokeWidth={s(0.35)} />)}
      <circle cx={8.5} cy={6.8} r={1.25} fill={cor(PELE)} {...C(0.45)} />
      <path d="M7.4 7.2 Q8.5 9.4 9.6 7.2 Q8.5 7.8 7.4 7.2 Z" fill={cor(MARROM)} {...C(0.35)} />
      <ellipse cx={8.5} cy={7.4} rx={0.32} ry={0.25} fill={tinta} />
      <circle cx={8} cy={6.5} r={0.14} fill={tinta} /><circle cx={9} cy={6.5} r={0.14} fill={tinta} />
      <path d="M7.1 6 Q7.2 4 8.5 3.9 Q9.8 4 9.9 6 Z" fill={cor(OURO)} {...C(0.45)} />
    </g>;
    case 'ciclope_polifemo': return <g>
      <path d="M0.6 20 L0.8 8 Q1.4 1.2 9 0.8 Q16.6 1.2 17.2 8 L17.4 20" fill={cor(CINZA3)} opacity={0.6} {...C(0.45)} />
      <path d="M2.2 20 L2.4 9 Q3 3 9 2.6 Q15 3 15.6 9 L15.8 20 Z" fill={tinta} opacity={0.18} />
      <path d="M15.4 20 L16.6 3.2" {...L(2)} /><path d="M15.4 20 L16.6 3.2" stroke={cor(TERRA)} strokeWidth={s(1.2)} />
      <path d="M16.2 9 l0.8 -0.6 M15.9 13 l-0.8 -0.4" {...L(0.4)} />
      <path d="M2.4 20 Q2.6 15 6 14.6 L12 14.6 Q15.4 15 15.6 20 Z" fill={cor(PELE)} {...C(0.55)} />
      <path d="M2.4 20 Q3 16 6.6 15.6 L4.2 20 Z M15.6 20 Q15 16 11.4 15.6 L13.8 20 Z" fill={cor(CREME)} {...C(0.4)} />
      {[3.4, 4.6, 13.4, 14.6].map((x, k) => <circle key={k} cx={x} cy={18.4 - (k % 2) * 1.2} r={0.45} {...L(0.25)} />)}
      <path d="M3.4 7.4 L2.2 5 L4.2 5.2 L3.8 2.8 L6 4 L6.6 1.6 L8.4 3.4 L9.6 1.2 L10.6 3.4 L12.6 1.8 L12.8 4.2 L15 3 L14.4 5.4 L16 5.6 L14.6 7.6 Z" fill={cor(MARROM)} {...C(0.45)} />
      <ellipse cx={9} cy={8.4} rx={5} ry={5} fill={cor(PELE)} {...C(0.6)} />
      <path d="M4 7.6 Q3 7.6 3.2 9 Q3.4 10 4.2 9.8 M14 7.6 Q15 7.6 14.8 9 Q14.6 10 13.8 9.8" fill={cor(PELE)} {...C(0.45)} />
      <path d="M5.2 5.4 Q9 3.6 12.8 5.4 Q9 4.6 5.2 5.4 Z" fill={cor(MARROM)} {...C(0.35)} />
      <path d="M5.6 6.6 Q9 3.8 12.4 6.6" {...L(0.9)} />
      <ellipse cx={9} cy={7.6} rx={2.2} ry={1.45} fill={cor(BRANCO)} {...C(0.5)} />
      <circle cx={9.2} cy={7.7} r={0.95} fill={cor(VERMELHO)} {...C(0.3)} /><circle cx={9.2} cy={7.7} r={0.48} fill={tinta} /><circle cx={9.5} cy={7.4} r={0.2} fill={cor(BRANCO)} />
      <path d="M6.8 8.9 Q9 9.8 11.2 8.9" {...L(0.3)} opacity={0.6} />
      <path d="M8.1 9.4 Q7.6 10.8 8.2 11 Q9 11.4 9.8 11 Q10.4 10.8 9.9 9.4" fill={cor(PELE)} {...C(0.4)} />
      <path d="M4.4 10.4 Q4 14.4 6 16.2 L7 15 L7.6 17 L9 15.6 L10.4 17 L11 15 L12 16.2 Q14 14.4 13.6 10.4 Q12.6 12.4 11.4 12 Q9 11.4 6.6 12 Q5.4 12.4 4.4 10.4 Z" fill={cor(MARROM)} {...C(0.5)} />
      <path d="M7 12.6 Q9 13.8 11 12.6 L10.6 13.6 Q9 14.4 7.4 13.6 Z" fill={tinta} />
      <path d="M7.8 12.9 l0.3 0.6 l0.3 -0.5 M9.6 12.9 l0.3 0.6 l0.3 -0.6" fill={cor(BRANCO)} {...C(0.15)} />
    </g>;
    case 'cabeca_de_medusa': return <g>
      {[
        [6.2, 7.4, 3, 7.4, 3.4, 4.6, 3.8, 2, 1.8, 1.4], [7.6, 6.2, 6.4, 4, 7.2, 2.8, 8, 1.6, 6.8, 0.9],
        [10.4, 6.2, 11.6, 4, 10.8, 2.8, 10, 1.6, 11.2, 0.9], [11.8, 7.4, 15, 7.4, 14.6, 4.6, 14.2, 2, 16.2, 1.4],
        [5.8, 9, 2.4, 8.4, 1.8, 10.6, 1.2, 12.6, 2.4, 13.8], [12.2, 9, 15.6, 8.4, 16.2, 10.6, 16.8, 12.6, 15.6, 13.8],
        [6, 12.4, 3.6, 14, 4.2, 16.2, 4.8, 18.4, 2.8, 18.8], [12, 12.4, 14.4, 14, 13.8, 16.2, 13.2, 18.4, 15.2, 18.8]
      ].map((q, k) => serpente(k, q, k % 2 ? VERDE : VERDE_CLARO))}
      <ellipse cx={9} cy={8.6} rx={4.1} ry={4.2} fill={cor(VERDE)} {...C(0.5)} />
      <path d="M5.6 7.4 q1 -1.6 2.4 -1 M10 6.4 q1.6 -0.4 2.4 1 M6.6 5.6 q1.2 -0.8 2.4 -0.4" {...L(0.35)} />
      {serpente(20, [7.4, 15.4, 7.6, 17.8, 9, 17.4, 10.6, 17, 11.2, 18.6], VERDE_CLARO, 1)}
      {serpente(21, [10.6, 15.4, 10.4, 17.8, 9, 17.4, 7.4, 17, 6.8, 18.6], VERDE, 1)}
      <path d="M7.6 13.6 L7.6 16 Q9 16.6 10.4 16 L10.4 13.6 Z" fill={cor(PELE)} {...C(0.45)} />
      <path d="M5.8 9.6 Q5.6 5.8 9 5.8 Q12.4 5.8 12.2 9.6 Q12 13.4 9 14.6 Q6 13.4 5.8 9.6 Z" fill={cor(PELE)} {...C(0.55)} />
      <path d="M5.9 8.4 Q7 6.4 9 7.4 Q11 6.4 12.1 8.4 Q11.4 6.2 9 6.2 Q6.6 6.2 5.9 8.4 Z" fill={cor(VERDE)} {...C(0.35)} />
      <path d="M6.6 9.2 L8.2 9.6 M11.4 9.2 L9.8 9.6" {...L(0.4)} />
      {[7.5, 10.5].map((x, k) => <g key={k}>
        <path d={`M${x - 0.95} 10.4 Q${x} 9.6 ${x + 0.95} 10.4 Q${x} 11 ${x - 0.95} 10.4 Z`} fill={cor(AMARELO)} {...C(0.35)} />
        <ellipse cx={x} cy={10.35} rx={0.14} ry={0.36} fill={tinta} />
      </g>)}
      <path d="M9 10.4 L8.7 12 Q9 12.3 9.4 12" {...L(0.3)} />
      <path d="M8.1 13 Q9 12.6 9.9 13 Q9 13.6 8.1 13 Z" fill={cor(VERMELHO)} {...C(0.3)} />
    </g>;
    case 'hercules_e_a_hidra': return <g>
      <path d={`M0.4 ${H - 0.6} H19.6`} {...L(0.5)} />
      <path d={`M17.8 ${H - 1.6} Q20 ${H - 2.4} 19.4 ${H - 4.4} Q19 ${H - 5.4} 18 ${H - 5}`} {...L(1.3)} /><path d={`M17.8 ${H - 1.6} Q20 ${H - 2.4} 19.4 ${H - 4.4} Q19 ${H - 5.4} 18 ${H - 5}`} fill="none" stroke={cor(VERDE)} strokeWidth={s(0.7)} strokeLinecap="round" />
      {[
        [13.6, 12, 12.8, 10, 12, 9.6, 11.4, 8.6, 10.4, 8.2], [14.4, 11.8, 14.6, 8.6, 13.4, 7.2, 12.4, 5.8, 11.6, 4.4],
        [15.4, 11.8, 16.6, 8, 15.6, 5.6, 14.8, 3.6, 14, 2.2], [16.4, 12, 18.6, 9, 17.4, 6.6, 16.6, 5.2, 17.6, 3.4],
        [17, 12.6, 19.6, 11.6, 18.8, 9.6, 18, 8.6, 16.8, 8]
      ].map((q, k) => serpente(k, q, k % 2 ? VERDE_CLARO : VERDE, 1.7))}
      <ellipse cx={15.6} cy={H - 3} rx={3.6} ry={2.3} fill={cor(VERDE)} {...C(0.55)} />
      <path d={`M12.8 ${H - 2.2} Q15.6 ${H - 0.8} 18.4 ${H - 2.2}`} fill="none" stroke={cor(VERDE_CLARO)} strokeWidth={s(0.8)} strokeLinecap="round" />
      <path d={`M13.6 ${H - 4.6} l0.5 -0.6 l0.4 0.6 M15.4 ${H - 5.2} l0.5 -0.6 l0.4 0.6 M17.2 ${H - 4.8} l0.5 -0.6 l0.4 0.6`} {...L(0.3)} />
      <path d={`M14 ${H - 1.2} v0.6 M15 ${H - 1} v0.5 M17.6 ${H - 1.2} v0.6`} {...L(0.4)} />
      <path d="M8.2 3.6 L11.4 0.4" stroke={tinta} strokeWidth={s(2)} strokeLinecap="round" /><path d="M8.2 3.6 L11.4 0.4" stroke={cor(TERRA)} strokeWidth={s(1.2)} strokeLinecap="round" />
      <path d="M9.8 1.4 l0.6 0.3 M10.6 0.9 l-0.2 -0.5" {...L(0.3)} />
      <path d={`M4.6 11.2 L3.4 ${H - 3.4} L2.6 ${H - 0.8}`} {...L(1.6)} /><path d={`M4.6 11.2 L3.4 ${H - 3.4} L2.6 ${H - 0.8}`} fill="none" stroke={cor(PELE)} strokeWidth={s(0.9)} strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M6.6 11.2 L8.6 13.2 L8.8 ${H - 0.8}`} {...L(1.6)} /><path d={`M6.6 11.2 L8.6 13.2 L8.8 ${H - 0.8}`} fill="none" stroke={cor(PELE)} strokeWidth={s(0.9)} strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M2 ${H - 0.8} h1.2 M8.4 ${H - 0.8} h1.3`} {...L(0.6)} />
      <path d="M7 6.6 L8.4 4.4" {...L(1.6)} /><path d="M7 6.6 L8.4 4.4" stroke={cor(PELE)} strokeWidth={s(0.9)} strokeLinecap="round" />
      <path d="M6.8 7 L9.8 8" {...L(1.6)} /><path d="M6.8 7 L9.8 8" stroke={cor(PELE)} strokeWidth={s(0.9)} strokeLinecap="round" />
      <path d="M4 6.6 Q5.6 5.8 7.4 6.6 L6.8 10.4 L4.6 10.4 Z" fill={cor(PELE)} {...C(0.55)} />
      <path d="M4.8 7.6 Q5.4 8 5.8 7.6 M6 7.6 Q6.5 8 6.9 7.6 M5.6 8.6 V9.8" {...L(0.25)} />
      <path d="M4.2 10 L7.2 10 L7.6 11.8 L6.2 11.4 L5.2 12 L4 11.4 Z" fill={cor(AREIA)} {...C(0.45)} />
      <path d="M4.2 3.6 Q2.6 6 3.2 9.4 Q2 9.6 2.2 10.6 Q3.4 10.4 4.2 9.4 L4.4 6.6 Z" fill={cor(AREIA)} {...C(0.45)} />
      <path d="M4.4 6.6 Q5.6 7.4 6.6 6.6 L6.2 7.4 Q5.4 7.8 4.6 7.4 Z" fill={cor(AREIA)} {...C(0.35)} />
      <circle cx={5.6} cy={4.8} r={1.25} fill={cor(PELE)} {...C(0.5)} />
      <path d="M4.6 5.2 Q5.4 6.8 6.6 5.4 L6.5 6.1 Q5.6 7 4.6 6 Z" fill={cor(MARROM)} {...C(0.3)} />
      <circle cx={6.1} cy={4.7} r={0.15} fill={tinta} /><path d="M5.7 4.3 l0.7 -0.1" {...L(0.25)} />
      <path d="M3.8 5 Q3.6 2.2 5.6 2 Q7.6 2 7.4 4 L6.8 4.2 Q6.4 3.4 5.4 3.6 Q4.6 3.8 4.6 5 Z" fill={cor(OURO)} {...C(0.45)} />
      <path d="M4.2 2.6 L4.2 1.6 L5 2.2 M6.4 2.1 L6.8 1.4 L7.1 2.3" fill={cor(OURO)} {...C(0.3)} />
      <path d="M5.6 3 l0.25 0.3 M6.6 3.2 l0.25 0.25" {...L(0.25)} />
      <path d="M7.2 3.6 L7.6 3.2" {...L(0.3)} />
    </g>;
    case 'hamlet_e_yorick': return <g>
      <path d="M1.4 20 Q1.6 13.4 4.4 12 L9.6 11.4 Q12 12 12.6 14.4 L13.4 20 Z" fill={tinta} {...C(0.5)} />
      <path d="M1.4 20 Q1.2 14 3.6 12.2 Q2.8 15 3.6 20 Z" fill={cor(CINZA1)} {...C(0.35)} />
      {[14, 15.6, 17.2, 18.8].map((y, k) => <circle key={k} cx={7.6} cy={y} r={0.25} fill={cor(BRANCO)} />)}
      <path d="M9.6 12.4 Q12 12.4 13.2 10.8 L13.8 11.6 Q12.4 13.8 10 14.2 Z" fill={tinta} {...C(0.4)} />
      <path d="M12.6 10.8 Q13.2 9.8 14.6 10 Q15.6 10.4 15.4 10.9 Q14.4 11.4 13.4 11.6 Z" fill={cor(PELE)} {...C(0.4)} />
      <path d="M14.2 10.1 q0.6 -0.5 1.1 0 M14.6 10.3 q0.5 -0.4 0.9 0.1" {...L(0.22)} />
      <g transform="translate(0 1.15)">
      <path d="M12.4 6.8 Q12.2 3.6 14.4 3.4 Q16.6 3.6 16.4 6.4 Q16.4 7.4 15.8 7.8 L15.6 9 L13.4 9 L13.2 7.8 Q12.5 7.4 12.4 6.8 Z" fill={cor(BRANCO)} {...C(0.5)} />
      <path d="M13.3 6 Q13.8 5.6 14.2 6 Q14.2 6.8 13.6 6.9 Q13.1 6.8 13.3 6 Z M14.9 6 Q15.4 5.6 15.9 6 Q16 6.8 15.4 6.9 Q14.8 6.8 14.9 6 Z" fill={tinta} />
      <path d="M14.4 7 L14.1 7.7 H14.8 Z" fill={tinta} />
      <path d="M13.6 8.2 H15.4 M13.9 7.9 V8.6 M14.3 7.9 V8.6 M14.7 7.9 V8.6 M15.1 7.9 V8.6" {...L(0.2)} />
      <path d="M13.6 4.4 q0.4 0.3 0.4 0.8" {...L(0.2)} opacity={0.6} />
      </g>
      <path d="M4.2 12.6 Q5.6 10.6 7.4 10.8 Q9.6 10.6 10.6 12.4 Q9 13.6 7.4 12.8 Q5.8 13.6 4.2 12.6 Z" fill={cor(BRANCO)} {...C(0.45)} />
      <path d="M6.2 10.8 L6.4 9.4 L8.4 9.4 L8.6 10.8 Z" fill={cor(PELE)} {...C(0.4)} />
      <path d="M5.2 6 Q5 2.4 7.8 2.4 Q9.6 2.6 9.8 4.6 L10 5.4 Q10.8 6.6 10.2 6.8 L10 7 Q10.3 7.6 9.9 7.9 Q10 8.8 9 9 Q8 9.4 7 9 Q5.4 8.4 5.2 6 Z" fill={cor(PELE)} {...C(0.5)} />
      <path d="M4.6 9 Q4 5.4 5 3.6 Q6 1.6 8 1.8 Q9.8 1.9 10.2 3.6 Q9.4 3.2 8.6 3.6 Q8.4 4.8 7.2 5.2 Q6.6 6.4 6.8 8.2 Q6.2 9.4 4.6 9 Z" fill={tinta} {...C(0.4)} />
      <path d="M8.6 5.4 q0.5 -0.4 1 -0.1" {...L(0.3)} />
      <path d="M8.9 5.9 Q9.3 5.7 9.6 6" {...L(0.3)} /><circle cx={9.3} cy={6} r={0.14} fill={tinta} />
      <path d="M9.4 7.5 Q9.8 7.6 10 7.4" {...L(0.25)} />
    </g>;
    case 'dama_do_lago_excalibur': return <g>
      <path d="M0.4 11 L3 7.6 L5 9 L8.6 5.8 L12 9.4 L14.6 7 L19.6 11 Z" fill={cor(CINZA3)} opacity={0.55} {...C(0.35)} />
      <rect x={0.4} y={11} width={19.2} height={H - 11.4} rx={0.4} fill={cor(CELESTE)} {...C(0.45)} />
      {[[1.4, 13.6, 4], [8.6, 14.6, 4.4], [13.4, 15.4, 5]].map(([x, y, w], k) => <path key={k} d={ondas(x, x + w, y, 0.35, 3)} {...L(0.3)} stroke={cor(AZUL)} />)}
      <ellipse cx={5.6} cy={11.4} rx={2.4} ry={0.6} {...L(0.3)} /><ellipse cx={5.6} cy={11.5} rx={3.6} ry={0.95} {...L(0.25)} opacity={0.6} />
      {[-60, -30, 0, 30, 60].map((a, k) => { const r = a * Math.PI / 180; return <path key={k} d={`M${f(5.6 + Math.sin(r) * 1.6)} ${f(2.6 - Math.cos(r) * 1.6)} L${f(5.6 + Math.sin(r) * 2.6)} ${f(2.6 - Math.cos(r) * 2.6)}`} stroke={cor(AMARELO)} strokeWidth={s(0.35)} strokeLinecap="round" />; })}
      <path d="M5.2 5.4 L5.2 1 L5.6 0.3 L6 1 L6 5.4 Z" fill={cor(PRATA)} {...C(0.4)} />
      <path d="M5.6 1 V5" stroke={cor(BRANCO)} strokeWidth={s(0.15)} />
      <path d="M3.8 5.4 H7.4 Q7.6 5.8 7.4 6.1 H3.8 Q3.6 5.8 3.8 5.4 Z" fill={cor(OURO)} {...C(0.4)} />
      <circle cx={5.6} cy={8.4} r={0.45} fill={cor(OURO)} {...C(0.35)} />
      <path d="M4.2 11.5 Q4.4 10 4.8 8.6 L6.4 8.6 Q6.8 10 7.2 11.5 Q5.7 11.9 4.2 11.5 Z" fill={cor(BRANCO)} {...C(0.45)} />
      <path d="M5.2 9.4 Q5 10.6 5.1 11.6 M6.1 9.4 Q6.3 10.6 6.3 11.6" {...L(0.2)} opacity={0.6} />
      <path d="M4.7 8.8 Q4.4 7.6 4.9 6.6 L6.4 6.5 Q6.9 7.6 6.4 8.8 Z" fill={cor(PELE)} {...C(0.4)} />
      <path d="M4.8 7 h1.2 M4.7 7.6 h1.3 M4.8 8.2 h1.1" {...L(0.22)} /><path d="M6.4 6.6 q0.4 0.5 0 1.2" {...L(0.25)} />
      <path d="M10.6 11 L19.2 11 Q18.8 13 16.6 13 L12.6 13 Q11 12.8 10.6 11 Z" fill={cor(TERRA)} {...C(0.5)} />
      <path d="M11.2 11.9 H18.6" {...L(0.25)} />
      <path d="M13.4 11 L13.6 7.6 Q15 6.8 16.6 7.6 L17 11 Z" fill={cor(VERMELHO)} {...C(0.5)} />
      <path d="M14.6 7.6 L14.4 11 M15.6 8.2 L15.6 9.6" {...L(0.25)} stroke={cor(OURO)} />
      <path d="M13.8 7.8 L12 8.4 L10.6 7.6" {...L(1.3)} /><path d="M13.8 7.8 L12 8.4 L10.6 7.6" fill="none" stroke={cor(CINZA3)} strokeWidth={s(0.7)} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={10.3} cy={7.4} r={0.45} fill={cor(PELE)} {...C(0.3)} />
      <circle cx={15} cy={5.8} r={1.2} fill={cor(PELE)} {...C(0.45)} />
      <path d="M13.9 6.2 Q14.3 7.9 15.4 7.6 Q16.2 7.2 16.1 6.2 Q15 6.8 13.9 6.2 Z" fill={cor(MARROM)} {...C(0.3)} />
      <circle cx={14.5} cy={5.6} r={0.13} fill={tinta} /><path d="M13.8 5.9 L13.5 6.2" {...L(0.25)} />
      <path d="M13.9 4.9 L13.8 3.6 L14.4 4.2 L15 3.3 L15.6 4.2 L16.2 3.6 L16.1 4.9 Z" fill={cor(OURO)} {...C(0.35)} />
      <path d="M16.1 5.2 Q16.6 6.4 16.2 7" {...L(0.3)} />
    </g>;
    case 'mago_merlin': return <g>
      <circle cx={13.4} cy={3} r={2.2} fill={cor(CELESTE)} opacity={0.3} />
      {[0, 60, 120, 180, 240, 300].map((a, k) => { const r = a * Math.PI / 180; return <path key={k} d={`M${f(13.4 + Math.cos(r) * 1.2)} ${f(3 + Math.sin(r) * 1.2)} L${f(13.4 + Math.cos(r) * 2.2)} ${f(3 + Math.sin(r) * 2.2)}`} stroke={cor(CELESTE)} strokeWidth={s(0.3)} strokeLinecap="round" />; })}
      <path d="M13.2 19.6 L13.4 4" {...L(1.1)} /><path d="M13.2 19.6 L13.4 4" stroke={cor(TERRA)} strokeWidth={s(0.55)} />
      <path d="M12.6 4.4 Q12.2 3 13.4 2.6 M14.2 4.4 Q14.6 3 13.4 2.6" {...L(0.4)} />
      <circle cx={13.4} cy={3} r={0.75} fill={cor(CELESTE)} {...C(0.35)} />
      <path d="M2 19.6 L4 9 Q6.8 7.6 9.6 9 L12 19.6 Z" fill={cor(ROXO)} {...C(0.55)} />
      <path d="M4.2 9.4 L1.6 14 L3.4 15 L4.8 12 Z" fill={cor(ROXO)} {...C(0.45)} />
      <path d="M9.4 9.4 L12.6 9.6 L12.8 11 L10 11.6 Z" fill={cor(ROXO)} {...C(0.45)} />
      <ellipse cx={13.2} cy={10.4} rx={0.75} ry={0.95} fill={cor(PELE)} {...C(0.35)} />
      <circle cx={2.4} cy={14.8} r={0.6} fill={cor(PELE)} {...C(0.35)} />
      {[[3.6, 17.6], [6.4, 18.4], [10, 17.2], [8.6, 15.2], [4.6, 15.6]].map(([x, y], k) => <path key={k} d={estrela(x, y, 0.55, 5, 0.24)} fill={cor(OURO)} {...C(0.2)} />)}
      <path d="M10.6 14.6 A0.7 0.7 0 1 0 11.2 15.8 A0.6 0.6 0 0 1 10.6 14.6 Z" fill={cor(OURO)} {...C(0.2)} />
      <path d="M5 8.4 Q5 11 6 13.4 L7 15.6 L8 13.4 Q9 11 9 8.4 Q7 9 5 8.4 Z" fill={cor(BRANCO)} {...C(0.5)} />
      <path d="M6.4 10 L6.8 13.2 M7.6 10 L7.3 13.4" {...L(0.2)} opacity={0.5} />
      <path d="M5.4 6.2 L5.4 7.6 Q5.6 8.6 7 8.8 Q8.4 8.6 8.6 7.6 L8.6 6.2 Z" fill={cor(PELE)} {...C(0.45)} />
      <path d="M5.4 7.6 Q6 8.6 7 8 Q8 8.6 8.6 7.6 L8.6 9 Q7 9.4 5.4 9 Z" fill={cor(BRANCO)} {...C(0.4)} />
      <path d="M5.8 6.8 Q6.4 6.4 6.8 6.9 M7.2 6.9 Q7.6 6.4 8.2 6.8" fill="none" stroke={tinta} strokeWidth={s(0.4)} strokeLinecap="round" />
      <path d="M5.8 6.5 Q6.4 6 6.9 6.5 M7.1 6.5 Q7.6 6 8.2 6.5" fill="none" stroke={cor(BRANCO)} strokeWidth={s(0.3)} strokeLinecap="round" />
      <circle cx={6.35} cy={7.15} r={0.17} fill={tinta} /><circle cx={7.65} cy={7.15} r={0.17} fill={tinta} />
      <path d="M6.9 7.2 L7 7.7 L7.1 7.2" {...L(0.22)} />
      <path d="M2.6 6.4 Q7 4.8 11.4 6.4 Q7 7.2 2.6 6.4 Z" fill={cor(ROXO)} {...C(0.5)} />
      <path d="M4.2 6 L6.6 0.4 Q7.4 2.4 9.8 6 Q7 5.2 4.2 6 Z" fill={cor(ROXO)} {...C(0.5)} />
      <path d="M6.6 0.4 Q5 0.6 4.6 1.6" {...L(0.4)} />
      {[[6.4, 3.4], [7.8, 4.6], [5.6, 5]].map(([x, y], k) => <path key={k} d={estrela(x, y, 0.45, 5, 0.2)} fill={cor(OURO)} {...C(0.2)} />)}
    </g>;
    case 'dante_alighieri': return <g>
      {[[1.6, 20, 2.2], [4.2, 20, 1.6], [13.4, 20, 2], [15.6, 20, 1.6]].map(([x, y, w], k) => <g key={k}>
        <path d={`M${x - w} ${y} Q${x - w} ${y - 3} ${x} ${y - 5.2} Q${x + w * 0.2} ${y - 3} ${x + w} ${y - 2.6} Q${x + w * 1.1} ${y - 1} ${x + w} ${y} Z`} fill={cor(LARANJA)} {...C(0.4)} />
        <path d={`M${x - w * 0.5} ${y} Q${x - w * 0.5} ${y - 1.6} ${x} ${y - 2.8} Q${x + w * 0.4} ${y - 1.4} ${x + w * 0.5} ${y} Z`} fill={cor(AMARELO)} />
      </g>)}
      <path d="M3.4 20 Q3.6 15 7 14 L11.6 14 Q14.6 15 14.8 20 Z" fill={cor(VERMELHO)} {...C(0.55)} />
      <path d="M7 14 Q9 15.6 11.2 14" {...L(0.35)} />
      <path d="M7.6 11 Q7.8 13.2 7.2 14.4 L10.8 14.4 Q10.4 12.6 10.6 11.2 Z" fill={cor(PELE)} {...C(0.45)} />
      <path d="M8.4 3.6 Q12.8 2.4 13.6 6.4 Q14 10 13.2 12.4 Q12.6 14 11 14.2 Q11.4 12 10.8 10.2 Z" fill={cor(VERMELHO)} {...C(0.5)} />
      <path d="M10.4 6 Q12.6 6.4 12.2 10.2 Q11.8 12.2 10.6 12.6 Q10.8 10 10 8 Z" fill={cor(BRANCO)} {...C(0.4)} />
      <path d="M6.6 5.4 Q8.4 4.4 10.4 5.4 Q10.6 8 10.4 10.4 Q10 11.6 8.6 11.6 Q7.4 11.6 6.8 10.8 L6.6 10.2 Q6.2 10.2 6.3 9.8 L6.6 9.6 Q6 9.4 6.4 9 Q5.2 8.8 4.9 8.4 Q5.4 7.6 6 7.2 Q6.2 6.2 6.6 5.4 Z" fill={cor(PELE)} {...C(0.5)} />
      <path d="M6.2 7.4 L5.1 8.4" {...L(0.3)} />
      <path d="M7 6.8 q0.5 -0.4 1.1 -0.1" {...L(0.35)} />
      <path d="M7.2 7.4 Q7.6 7.2 7.9 7.5" {...L(0.3)} /><circle cx={7.5} cy={7.5} r={0.14} fill={tinta} />
      <path d="M6.6 9.9 h0.6" {...L(0.25)} />
      <path d="M8.6 9.8 Q9.2 10.6 9.4 9.6" {...L(0.2)} opacity={0.5} />
      <path d="M6.6 5.6 Q6.8 2.4 9.6 2.2 Q12.6 2.2 13.2 4.6 Q11 3.6 8.4 4.4 Q7.4 4.8 6.6 5.6 Z" fill={cor(VERMELHO)} {...C(0.5)} />
      {Array.from({ length: 7 }, (_, k) => { const t = k / 6, x = 6.8 + t * 6, y = 4.8 - Math.sin(t * Math.PI) * 1.6 + t * 0.4; return <g key={k}>
        <ellipse cx={f(x)} cy={f(y - 0.35)} rx={0.32} ry={0.7} transform={`rotate(${f(-50 + t * 70)} ${f(x)} ${f(y - 0.35)})`} fill={cor(VERDE)} {...C(0.25)} />
        <ellipse cx={f(x + 0.2)} cy={f(y + 0.35)} rx={0.32} ry={0.7} transform={`rotate(${f(40 + t * 60)} ${f(x + 0.2)} ${f(y + 0.35)})`} fill={cor(VERDE_CLARO)} {...C(0.25)} />
      </g>; })}
    </g>;
    /* ================================================================ contos de fadas */
    case 'chapeuzinho_e_o_lobo': return <g>
      <path d={`M0.4 ${H - 0.6} H19.6`} {...L(0.5)} />
      <path d={`M2 ${H - 0.6} Q6 ${H - 2} 10 ${H - 1.4} Q13 ${H - 1} 14 ${H - 0.6}`} fill={cor(AREIA)} {...C(0.35)} />
      <path d="M1.6 9 L2.6 3.2 L3.6 9 Z" fill={cor(VERDE)} opacity={0.55} {...C(0.3)} /><path d="M2.6 9 v2" {...L(0.4)} />
      <path d={`M17 ${H - 3.6} Q19.8 ${H - 3.4} 19.4 ${H - 6.4} Q18.8 ${H - 5} 17 ${H - 5.4} Z`} fill={cor(CINZA2)} {...C(0.45)} />
      <rect x={14.4} y={4} width={3} height={H - 4.6} fill={cor(TERRA)} {...C(0.5)} />
      <path d={`M15.4 6 v3 M16.4 10 v3 M15.2 ${H - 3} v1.4`} {...L(0.25)} />
      <circle cx={13.8} cy={3} r={2.2} fill={cor(VERDE)} {...C(0.5)} /><circle cx={17.6} cy={2.8} r={2.2} fill={cor(VERDE)} {...C(0.5)} /><circle cx={15.8} cy={1.9} r={1.9} fill={cor(VERDE_CLARO)} {...C(0.5)} />
      <path d="M14.6 6.4 L14.2 4.6 L15.4 6 Z M14.8 7 L15.6 5 L16 6.8 Z" fill={cor(CINZA2)} {...C(0.35)} />
      <path d="M15 7 Q15.2 9.8 14.4 10 L11.2 9.6 Q10.4 9.4 10.6 8.8 L12.2 8 Q13.2 6.4 15 7 Z" fill={cor(CINZA2)} {...C(0.5)} />
      <path d="M11.2 9.6 L14.2 9.6 Q13.4 10.4 12 10.2 Z" fill={cor(BRANCO)} {...C(0.3)} />
      <path d="M11.8 9.6 l0.2 0.4 l0.2 -0.4 M12.8 9.7 l0.2 0.4 l0.2 -0.4" {...L(0.15)} />
      <ellipse cx={10.7} cy={8.8} rx={0.38} ry={0.3} fill={tinta} />
      <path d="M12.6 7.6 Q13.1 7.3 13.6 7.7 Q13.1 8.1 12.6 7.6 Z" fill={cor(AMARELO)} {...C(0.25)} /><circle cx={13.1} cy={7.7} r={0.12} fill={tinta} />
      <path d="M12.4 7.2 L13.6 7.4" {...L(0.3)} />
      <path d="M14.4 11.4 Q13.4 11.2 13.4 12 Q13.6 12.6 14.4 12.4" fill={cor(CINZA2)} {...C(0.4)} />
      <path d="M13.5 11.7 l-0.4 -0.1 M13.5 12.1 l-0.4 0.1" {...L(0.25)} />
      <path d={`M5 ${H - 3.4} L4 ${H - 1} M7.6 ${H - 3.4} L8.6 ${H - 1}`} {...L(0.7)} />
      <path d={`M3.4 ${H - 1} h1 M8.4 ${H - 1} h1`} {...L(0.6)} />
      <path d="M4.4 9.6 L3.8 13.6 L8.8 13.6 L8.2 9.6 Z" fill={cor(BRANCO)} {...C(0.45)} />
      <path d="M4.2 12.4 Q6.3 13 8.4 12.4" fill="none" stroke={cor(VERMELHO)} strokeWidth={s(0.3)} />
      <path d="M8.4 9.6 L10 10.8" {...L(0.9)} /><path d="M8.4 9.6 L10 10.8" stroke={cor(PELE)} strokeWidth={s(0.45)} strokeLinecap="round" />
      <path d="M9.2 10.6 Q10.2 9 11.2 10.6" {...L(0.35)} />
      <path d="M8.9 10.6 H11.5 L11 12.4 H9.4 Z" fill={cor(AREIA)} {...C(0.4)} />
      <path d="M9.2 11.2 H11.2 M9.4 11.8 H11" {...L(0.2)} />
      <path d="M9.4 10.6 Q10.2 10 11 10.6" fill={cor(BRANCO)} {...C(0.25)} />
      <path d="M6.2 3.2 Q3.4 3.6 3.4 7.6 L2 12.8 Q4.4 13.6 5.4 12.4 L5.6 9.2 Q7.4 8.8 8.4 6.4 Q8.4 3.2 6.2 3.2 Z" fill={cor(VERMELHO)} {...C(0.5)} />
      <circle cx={6.6} cy={6.2} r={1.3} fill={cor(PELE)} {...C(0.45)} />
      <path d="M5.4 5.8 Q5.8 4.6 7 4.8 Q7.6 5 7.9 5.8 Q7 5.4 6.2 5.8 Q5.8 6.2 5.4 5.8 Z" fill={cor(AMARELO)} {...C(0.3)} />
      <circle cx={7.1} cy={6.3} r={0.14} fill={tinta} /><path d="M7.3 7 Q7.6 7 7.8 6.8" {...L(0.22)} />
      <circle cx={6.6} cy={6.8} r={0.25} fill={cor(ROSA)} opacity={0.6} />
      <path d="M5.4 4.8 Q6.4 3.8 7.8 4.6" {...L(0.25)} opacity={0.6} />
    </g>;
    case 'gato_de_botas': return <g>
      <path d="M3.6 13.4 Q0.6 13 1 9.6 Q1.2 8 2.2 8.2" {...L(1.1)} /><path d="M3.6 13.4 Q0.6 13 1 9.6 Q1.2 8 2.2 8.2" fill="none" stroke={cor(LARANJA)} strokeWidth={s(0.55)} strokeLinecap="round" />
      <path d="M10.4 8 Q13.8 8.2 14 11.4 Q14 13.6 11.8 13.4 Q10.2 13.2 10 11 Z" fill={cor(AREIA)} {...C(0.5)} />
      <path d="M10.6 8 L9.8 7.2" {...L(0.4)} /><path d="M11 10.6 Q12 11 12.8 10.4" {...L(0.25)} opacity={0.6} />
      <path d="M4.6 14 Q4 9.6 7.4 9 Q10.6 9.6 10 14 Z" fill={cor(LARANJA)} {...C(0.55)} />
      <path d="M6 10.4 Q7.4 9.8 8.6 10.4 Q9 12.6 7.4 13.6 Q5.6 12.6 6 10.4 Z" fill={cor(CREME)} {...C(0.3)} />
      <path d="M4.6 12.6 L10.1 12.6 L10 13.5 L4.6 13.5 Z" fill={cor(MARROM)} {...C(0.35)} />
      <rect x={6.9} y={12.5} width={1} height={1.1} fill="none" stroke={cor(OURO)} strokeWidth={s(0.3)} />
      <path d="M9.6 10 L10.6 8" {...L(1)} /><path d="M9.6 10 L10.6 8" stroke={cor(LARANJA)} strokeWidth={s(0.5)} strokeLinecap="round" /><circle cx={10.6} cy={7.9} r={0.45} fill={cor(LARANJA)} {...C(0.35)} />
      <path d="M5.2 10.4 L4 12.8" {...L(1)} /><path d="M5.2 10.4 L4 12.8" stroke={cor(LARANJA)} strokeWidth={s(0.5)} strokeLinecap="round" /><circle cx={4.1} cy={13} r={0.45} fill={cor(LARANJA)} {...C(0.35)} />
      {[[5.4, -1], [8.8, 1]].map(([x, d], k) => <g key={k}>
        <rect x={x - 0.7} y={13.6} width={1.4} height={1.6} fill={cor(LARANJA)} {...C(0.45)} />
        <ellipse cx={x + d * 0.7} cy={19.1} rx={1.6} ry={0.6} fill={cor(MARROM)} {...C(0.5)} />
        <rect x={x - 0.8} y={16} width={1.6} height={3.2} fill={cor(MARROM)} {...C(0.5)} />
        <path d={`M${x - 0.75} 19.1 H${x + 0.75}`} stroke={cor(MARROM)} strokeWidth={s(0.6)} />
        <path d={`M${x - 1.6} 14.8 Q${x} 14.4 ${x + 1.6} 14.8 L${x + 1.1} 16.6 Q${x} 16.3 ${x - 1.1} 16.6 Z`} fill={cor(TERRA)} {...C(0.5)} />
        <path d={`M${x - 0.6} 15 L${x - 0.5} 16.3 M${x + 0.6} 15 L${x + 0.5} 16.3`} {...L(0.2)} opacity={0.6} />
      </g>)}
      <path d="M4 5.8 L3.6 3.8 L5.2 5 Z M10.8 5.8 L11.2 3.8 L9.6 5 Z" fill={cor(LARANJA)} {...C(0.4)} />
      <ellipse cx={7.4} cy={6.8} rx={3.4} ry={2.6} fill={cor(LARANJA)} {...C(0.55)} />
      <path d="M5.4 4.6 l0.4 0.9 M7.4 4.3 v1 M9.4 4.6 l-0.4 0.9" {...L(0.3)} />
      <path d="M6 7.6 Q7.4 7 8.8 7.6 Q8.8 9.2 7.4 9.2 Q6 9.2 6 7.6 Z" fill={cor(CREME)} {...C(0.3)} />
      {[6, 8.8].map((x, k) => <g key={k}><ellipse cx={x} cy={6.4} rx={0.62} ry={0.7} fill={cor(VERDE_CLARO)} {...C(0.3)} /><ellipse cx={x} cy={6.4} rx={0.16} ry={0.55} fill={tinta} /></g>)}
      <path d="M7 7.6 L7.8 7.6 L7.4 8.1 Z" fill={cor(ROSA)} {...C(0.25)} />
      <path d="M6.7 8.6 Q7.4 9 8.1 8.6 M7.4 8.1 V8.6" {...L(0.25)} />
      <path d="M5.6 7.9 L3.6 7.6 M5.6 8.3 L3.6 8.6 M9.2 7.9 L11.2 7.6 M9.2 8.3 L11.2 8.6" {...L(0.18)} />
      <path d="M2.4 4.6 Q7.4 2.8 12.6 4.4 Q12.4 5 12 5 Q7.4 3.8 2.8 5.2 Q2.2 5.2 2.4 4.6 Z" fill={cor(MARROM)} {...C(0.5)} />
      <path d="M4.6 4.2 Q4.8 1.6 7.4 1.6 Q10 1.6 10.2 4" fill={cor(MARROM)} {...C(0.5)} />
      <path d="M4.8 3.6 Q7.4 2.8 10 3.4" fill="none" stroke={cor(OURO)} strokeWidth={s(0.4)} />
      <path d="M9.6 3.2 Q11.6 0 14.6 0.8 Q12.6 1.2 12.4 2.4 Q11.4 2.6 10.4 3.6 Z" fill={cor(VERMELHO)} {...C(0.4)} />
      <path d="M10.2 3.2 Q12 1.6 14.2 0.9" {...L(0.22)} />
    </g>;
    case 'pequena_sereia_andersen': return <g>
      <path d="M10.4 9 L10.6 7.4 L11.6 7 L11.6 5 L12.2 4 L12.8 5 L12.8 6.6 L14 6.6 L14 4.2 L14.6 3 L15.2 4.2 L15.2 7 L16.2 7.4 L16.4 9 Z" fill={cor(CINZA3)} {...C(0.4)} />
      <path d="M12.2 4 V2.8 l0.8 0.3 l-0.8 0.3 M14.6 3 V1.8 l0.8 0.3 l-0.8 0.3" {...L(0.25)} stroke={tinta} />
      <rect x={13} y={7.6} width={0.8} height={1.4} rx={0.4} fill={tinta} />
      <path d="M8.6 9.2 H16.6" {...L(0.35)} />
      <path d="M0.4 15 Q4 14.4 8 15 Q12 15.6 16.6 15" {...L(0.4)} stroke={cor(AZUL)} />
      <path d={ondas(9, 15, 17.6, 0.35, 3)} {...L(0.3)} stroke={cor(AZUL)} /><path d={ondas(1, 5, 18.8, 0.35, 2)} {...L(0.3)} stroke={cor(AZUL)} />
      <path d="M1.4 16.4 Q1 12.4 3.6 11.8 Q7.6 11 10.4 12.6 Q11.4 14.4 10.6 16.4 Z" fill={cor(CINZA2)} {...C(0.5)} />
      <path d="M3 13.6 q1 -0.6 2 0 M7.4 13 q1 -0.4 1.8 0.4" {...L(0.25)} />
      <path d="M4.6 10.4 Q4 12.4 6.2 12.8 Q9.6 13 11.4 14.4 Q12.6 15.6 13.2 16.6 L14.2 16 Q13.6 13.6 11.6 12.4 Q9.6 11.2 7.4 10.6 Z" fill={cor(TURQUESA)} {...C(0.5)} />
      {[[6.4, 11.6], [8.2, 12], [9.8, 12.6], [11.4, 13.6]].map(([x, y], k) => <path key={k} d={`M${x - 0.5} ${y} q0.5 0.6 1 0`} {...L(0.2)} />)}
      <path d="M13.6 16.2 Q12.6 18.6 11.6 18.4 Q13 17.4 13 16.4 M13.8 16.2 Q15.4 18 16.6 17.4 Q15 17 14.2 16" fill={cor(TURQUESA)} {...C(0.45)} />
      <path d="M5 10.6 L5.4 7.4 Q6.4 6.6 7.6 7.4 L7.6 10.6 Z" fill={cor(PELE)} {...C(0.5)} />
      <path d="M7.4 7.8 L9.2 10.6 L9.6 11.6" {...L(0.9)} /><path d="M7.4 7.8 L9.2 10.6 L9.6 11.6" fill="none" stroke={cor(PELE)} strokeWidth={s(0.45)} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.2 7.8 L4.2 10.8 L4.4 11.8" {...L(0.9)} /><path d="M5.2 7.8 L4.2 10.8 L4.4 11.8" fill="none" stroke={cor(PELE)} strokeWidth={s(0.45)} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.6 3.4 Q4 4 4.2 6.4 Q3.6 9 2.4 11.4 Q3.6 11.6 4.6 10.4 Q4.8 8.8 5.2 7.8 Q5.4 6 6 5.2 Z" fill={cor(AMARELO)} {...C(0.45)} />
      <ellipse cx={6.6} cy={5.2} rx={1.3} ry={1.5} fill={cor(PELE)} {...C(0.45)} />
      <path d="M5.2 5.4 Q5 3.4 6.6 3.4 Q8 3.4 8 4.8 Q7.2 4.2 6.2 4.6 Q6 6.2 6.4 8.6 Q6.8 9.6 6.2 10.2 Q5.6 8.6 5.4 7.4 Z" fill={cor(AMARELO)} {...C(0.4)} />
      <circle cx={7.3} cy={5.2} r={0.14} fill={tinta} /><path d="M7.1 4.7 l0.5 0" {...L(0.2)} />
      <path d="M7.5 6.1 Q7.7 6.2 7.8 6" {...L(0.2)} />
      <path d="M3.6 6 q0 1.4 -0.6 2.6 M4 8.4 q-0.2 1 -0.8 1.8" {...L(0.2)} opacity={0.6} />
    </g>;
    case 'joao_e_maria_casa_de_doces': return <g>
      <path d={`M0.4 ${H - 0.6} H19.6`} {...L(0.5)} />
      <rect x={9.6} y={7.4} width={9.2} height={H - 8} fill={cor(TERRA)} {...C(0.55)} />
      {[[10.4, 9], [16.6, 9.6], [11, 13.6], [17.6, 14]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r={0.3} fill={cor(CREME)} />)}
      <path d="M8.4 7.8 L14.2 1.4 L20 7.8 Z" fill={cor(MARROM)} {...C(0.55)} />
      <path d="M8.4 7.8 L14.2 1.4 L20 7.8 Q19.2 9 18.6 7.8 Q17.8 9.2 17 7.8 Q16.2 9 15.4 7.8 Q14.6 9.2 13.8 7.8 Q13 9 12.2 7.8 Q11.4 9.2 10.6 7.8 Q9.8 9 9.2 7.8 Z" fill={cor(BRANCO)} {...C(0.4)} opacity={0.95} />
      <path d="M10.6 6.4 L14.2 2.6 L17.8 6.4 Z" fill={cor(MARROM)} />
      {[[12.4, 5.4, VERMELHO], [14.2, 4.4, VERDE_CLARO], [16, 5.6, ROSA], [13.4, 6.4, AMARELO], [15.2, 6.6, CELESTE]].map(([x, y, c], k) => <circle key={k} cx={x} cy={y} r={0.45} fill={cor(c as string)} {...C(0.25)} />)}
      <rect x={10.6} y={9.6} width={2.8} height={2.6} fill={cor(CELESTE)} {...C(0.45)} />
      <path d="M12 9.6 V12.2 M10.6 10.9 H13.4" {...L(0.3)} />
      <path d="M10.4 9.4 h3.2" stroke={cor(ROSA)} strokeWidth={s(0.6)} strokeLinecap="round" /><path d="M10.4 12.4 h3.2" stroke={cor(ROSA)} strokeWidth={s(0.6)} strokeLinecap="round" />
      <path d={`M15 ${H - 0.6} V11.4 Q16.2 10 17.4 11.4 V${H - 0.6} Z`} fill={cor(MARROM)} {...C(0.5)} />
      <circle cx={16.8} cy={13.6} r={0.2} fill={cor(OURO)} />
      {[14.2, 18.2].map((x, k) => <g key={k}>
        <path d={`M${x} ${H - 0.6} V11.2 Q${x} 10.2 ${x + (k ? -0.8 : 0.8)} 10.4`} {...L(0.85)} />
        <path d={`M${x} ${H - 0.6} V11.2 Q${x} 10.2 ${x + (k ? -0.8 : 0.8)} 10.4`} fill="none" stroke={cor(BRANCO)} strokeWidth={s(0.45)} strokeLinecap="round" />
        <path d={`M${x} 12 v0.5 M${x} 13.8 v0.5 M${x} 15.4 v0.4`} stroke={cor(VERMELHO)} strokeWidth={s(0.45)} />
      </g>)}
      <path d="M8.6 9.6 V16.6" {...L(0.5)} />
      <circle cx={8.6} cy={9.2} r={1.1} fill={cor(ROSA)} {...C(0.4)} /><path d={`M8.6 9.2 m-0.6 0 a0.6 0.6 0 1 1 0.6 0.6`} fill="none" stroke={cor(BRANCO)} strokeWidth={s(0.3)} />
      {[[1.4, VERMELHO], [5.2, AZUL]].map(([x0, c], k) => { const x = x0 as number; return <g key={k}>
        <path d={`M${x + 0.6} ${H - 4} L${x + 0.4} ${H - 0.9} M${x + 1.6} ${H - 4} L${x + 1.8} ${H - 0.9}`} {...L(0.6)} />
        <path d={`M${x} ${H - 0.9} h0.9 M${x + 1.6} ${H - 0.9} h0.9`} {...L(0.55)} />
        {k === 0
          ? <path d={`M${x + 0.4} 9.6 L${x - 0.4} ${H - 3.6} L${x + 2.6} ${H - 3.6} L${x + 1.8} 9.6 Z`} fill={cor(c as string)} {...C(0.45)} />
          : <g><rect x={x + 0.2} y={9.6} width={1.8} height={2.6} fill={cor(BRANCO)} {...C(0.4)} /><path d={`M${x + 0.1} 12 H${x + 2.1} L${x + 2.2} ${H - 3.6} H${x} Z`} fill={cor(MARROM)} {...C(0.45)} /><path d={`M${x + 0.6} 9.6 V12 M${x + 1.6} 9.6 V12`} {...L(0.25)} /></g>}
        <circle cx={x + 1.1} cy={8.2} r={1.25} fill={cor(PELE)} {...C(0.45)} />
        <circle cx={x + 1.5} cy={8.2} r={0.13} fill={tinta} /><path d={`M${x + 1.5} 8.9 q0.3 0.1 0.5 -0.1`} {...L(0.2)} />
      </g>; })}
      <path d="M1.4 8.2 Q1.4 6.4 2.6 6.6 Q3.8 6.6 3.8 7.8 Q3 7.2 2 7.6 Z" fill={cor(AMARELO)} {...C(0.35)} />
      <path d="M1.4 8 Q0.8 9.4 1 10.6" {...L(0.75)} /><path d="M1.4 8 Q0.8 9.4 1 10.6" fill="none" stroke={cor(AMARELO)} strokeWidth={s(0.35)} strokeLinecap="round" />
      <path d="M5.2 8 Q5.2 6.6 6.4 6.6 Q7.6 6.6 7.6 7.8 Q6.4 7.2 5.4 8.4 Z" fill={cor(MARROM)} {...C(0.35)} />
      <path d="M4 10.2 Q4.8 11.2 5.6 10.2" {...L(0.75)} /><path d="M4 10.2 Q4.8 11.2 5.6 10.2" fill="none" stroke={cor(PELE)} strokeWidth={s(0.35)} strokeLinecap="round" />
      <path d="M7.2 10 L8.3 10.4" {...L(0.75)} />
    </g>;
    default: return undefined;
  }
}
