/**
 * VIDA 13 — A ARTE DOS DESENHOS NOVOS DE TATUAGEM (`motor/dados/tatuagens13`): os estilos independentes (geométricas,
 * abstratas, minimalistas, ornamentais, surrealistas, conceituais, blackwork, old school, oriental, fine line, tribal,
 * realistas) e os temas (bichos, natureza, criaturas e mitos, céu e espaço). A cultura pop nova está em
 * `tatuagens13Pop`. Mesma caixa nativa e mesma linguagem da 12.9: contorno em `tinta`, cada cor por `cor`.
 */
import type { ReactNode } from 'react';
import {
  AMARELO, AREIA, atalhos, AZUL, BRANCO, CELESTE, CINZA1, CINZA2, CINZA3, CREME, estrela, espiral, f, LARANJA, MARROM, noCirculo, ondas, OURO, poligono, ROSA,
  ROXO, sorte, TERRA, TURQUESA, VERDE, VERDE_CLARO, VERMELHO, type PincelDaTatuagem13
} from './tatuagens13Base';
import { desenho13Pop } from './tatuagens13Pop';

export type { PincelDaTatuagem13 } from './tatuagens13Base';

export function desenho13(id: string, p: PincelDaTatuagem13): ReactNode | undefined {
  const pop = desenho13Pop(id, p);
  if (pop !== undefined) return pop;
  const { tinta, cor, W, H } = p;
  const { s, L, C } = atalhos(p);
  switch (id) {
    /* ================================================================ geométricas */
    case 'espiral_aurea': { const k = 19 / 21; const q = (n: number) => f(n * k + 0.5); return <g>
      <rect x={q(0)} y={q(0)} width={f(21 * k)} height={f(13 * k)} {...L(0.45)} />
      <path d={`M${q(13)} ${q(0)} V${q(13)} M${q(13)} ${q(8)} H${q(21)} M${q(16)} ${q(8)} V${q(13)} M${q(13)} ${q(11)} H${q(16)} M${q(14)} ${q(8)} V${q(11)}`} {...L(0.3)} />
      <path d={`M${q(13)} ${q(13)} A${f(13 * k)} ${f(13 * k)} 0 0 1 ${q(0)} ${q(0)} M${q(13)} ${q(0)} A${f(8 * k)} ${f(8 * k)} 0 0 1 ${q(21)} ${q(8)} A${f(5 * k)} ${f(5 * k)} 0 0 1 ${q(16)} ${q(13)} A${f(3 * k)} ${f(3 * k)} 0 0 1 ${q(13)} ${q(10)} A${f(2 * k)} ${f(2 * k)} 0 0 1 ${q(15)} ${q(8)} A${f(1 * k)} ${f(1 * k)} 0 0 1 ${q(16)} ${q(9)}`} fill="none" stroke={tinta} strokeWidth={s(0.75)} strokeLinecap="round" />
      <path d={`M${q(0)} ${q(0)} H${q(13)}`} stroke={tinta} strokeWidth={s(0.75)} />
    </g>; }
    case 'triangulo_impossivel': { const R = (x: number, y: number, a: number) => { const c = Math.cos(a), sn = Math.sin(a); return `${f(10 + (x - 10) * c - (y - 11.4) * sn)} ${f(11.4 + (x - 10) * sn + (y - 11.4) * c)}`; };
      // Três barras de tons diferentes, cada uma girada de 120°, encaixadas em volta do vão do meio.
      const barra = [[10, 1], [19, 16.6], [15.6, 16.6], [10, 6.9], [7.5, 11.2], [5.8, 8.2]] as const;
      const tons = [CINZA1, CINZA2, CINZA3];
      return <g>{[0, 1, 2].map(k => <path key={k} d={'M' + barra.map(([x, y]) => R(x, y, (k * 2 * Math.PI) / 3)).join(' L') + ' Z'} fill={cor(tons[k])} {...C(0.55)} />)}</g>; }
    case 'dodecaedro': { const ext = noCirculo(10, 10, 9, 10), mid = noCirculo(10, 10, 6.2, 5, -Math.PI / 2), inn = noCirculo(10, 10, 4, 5, Math.PI / 2); return <g>
      <path d={'M' + ext.map(([x, y]) => `${x} ${y}`).join(' L') + ' Z'} {...L(0.6)} />
      <path d={'M' + inn.map(([x, y]) => `${x} ${y}`).join(' L') + ' Z'} fill={tinta} opacity={0.12} />
      <path d={'M' + inn.map(([x, y]) => `${x} ${y}`).join(' L') + ' Z'} {...L(0.6)} />
      {mid.map(([x, y], k) => { const e = ext[k * 2], i1 = inn[(k + 2) % 5], i2 = inn[(k + 3) % 5]; return <g key={k}><path d={`M${e[0]} ${e[1]} L${x} ${y}`} {...L(0.5)} /><path d={`M${x} ${y} L${i1[0]} ${i1[1]} M${x} ${y} L${i2[0]} ${i2[1]}`} {...L(0.4)} /></g>; })}
      {ext.filter((_, k) => k % 2).map(([x, y], k) => <path key={`d${k}`} d={`M${x} ${y} L${f(10 + (x - 10) * 0.55)} ${f(10 + (y - 10) * 0.55)}`} {...L(0.3)} strokeDasharray="0.5 0.5" opacity={0.6} />)}
    </g>; }
    case 'circulos_concentricos': return <g>
      {[9, 7.4, 5.8, 4.2, 2.6, 1].map((r, k) => <circle key={k} cx={10} cy={10} r={r} {...L(0.45)} />)}
      <g>{[9, 5.8, 2.6].map((r, k) => <path key={k} d={`M10 ${10 - r} A${r} ${r} 0 0 0 10 ${10 + r} L10 ${10 + r - 1.6} A${r - 1.6} ${r - 1.6} 0 0 1 10 ${10 - r + 1.6} Z`} fill={tinta} />)}</g>
      <path d="M10 0.4 V19.6" {...L(0.5)} />
    </g>;
    case 'ondas_op_art': return <g>
      {Array.from({ length: 13 }, (_, k) => { const y = 1 + k * 1.5; const b = Math.sin((k / 12) * Math.PI) * 3.4;
        return <path key={k} d={`M0.6 ${y} C${f(W * 0.3)} ${f(y - b)} ${f(W * 0.7)} ${f(y + b)} ${f(W - 0.6)} ${y}`} {...L(k % 2 ? 0.7 : 0.35)} />; })}
    </g>;
    case 'losango_pontilhado': { const c = W / 2; return <g>
      <path d={`M${c} 0.6 L${W - 0.6} 10 L${c} 19.4 L0.6 10 Z`} {...L(0.6)} />
      <path d={`M${c} 4 L${W - 3} 10 L${c} 16 L3 10 Z`} fill="none" stroke={tinta} strokeWidth={s(0.6)} strokeDasharray="0.01 0.9" strokeLinecap="round" />
      <path d={`M${c} 7.2 L${c + 2.2} 10 L${c} 12.8 L${c - 2.2} 10 Z`} fill={tinta} />
      <path d={`M${c} 0.6 V-0 M${c} 19.4 V20`} {...L(0.4)} />
    </g>; }

    /* ================================================================ abstratas */
    case 'curvas_de_nivel': return <g>
      {[1, 2, 3, 4, 5, 6].map(k => { const r = k * 1.45; return <path key={k} d={'M' + Array.from({ length: 21 }, (_, j) => { const a = (j / 20) * Math.PI * 2; const q = r * (1 + 0.18 * Math.sin(a * 3 + k * 0.5) + 0.08 * Math.cos(a * 5)); return `${f(10.6 + Math.cos(a) * q - k * 0.2)} ${f(10 + Math.sin(a) * q * 0.85)}`; }).join(' L') + ' Z'} {...L(k === 6 ? 0.55 : 0.35)} />; })}
      <path d={estrela(10.6, 10, 0.7, 3, 0.3)} fill={tinta} />
    </g>;
    case 'mancha_de_rorschach': { const lado = 'M10 0.8 Q7 1.6 6.4 3.4 Q3 2 2 4.8 Q3.6 6 2.4 7.6 Q0.4 8.6 1.4 10.8 Q3.6 10.4 4.4 12 Q4 14 6.4 14.6 Q7.4 12.6 8.6 13.4 Q9.2 14.8 10 14.8 Z M4.4 5.4 Q5.6 6.6 6.8 5.6 Q6 7.8 4.6 7 Z M8.4 8.4 Q9.4 9.6 10 9 L10 10.6 Q8.8 10.6 8.4 8.4 Z'; return <g>
      <path d={lado} fill={tinta} fillRule="evenodd" /><path d={lado} fill={tinta} fillRule="evenodd" transform="translate(20 0) scale(-1 1)" />
      {[[0.8, 13.4, 0.4], [3, 0.8, 0.3], [6, 15, 0.35]].map(([x, y, r], k) => <g key={k}><circle cx={x} cy={y} r={r} fill={tinta} /><circle cx={20 - x} cy={y} r={r} fill={tinta} /></g>)}
    </g>; }
    case 'cacos_coloridos': { const pts: [number, number][] = [[1, 1], [8, 1], [19, 1], [19, 9], [19, 19], [11, 19], [1, 19], [1, 11], [9, 9], [13, 6], [6, 13], [14, 14]];
      const tri: [number, number, number, string][] = [[0, 1, 8, VERMELHO], [1, 9, 8, AMARELO], [1, 2, 9, CELESTE], [2, 3, 9, VERDE], [9, 3, 11, ROXO], [3, 4, 11, LARANJA], [4, 5, 11, ROSA], [5, 10, 11, AZUL], [5, 6, 10, VERDE_CLARO], [6, 7, 10, AMARELO], [7, 8, 10, TURQUESA], [7, 0, 8, ROSA], [8, 9, 11, CREME], [8, 11, 10, VERMELHO]];
      return <g>{tri.map(([a, b, c, k], j) => <path key={j} d={`M${pts[a][0]} ${pts[a][1]} L${pts[b][0]} ${pts[b][1]} L${pts[c][0]} ${pts[c][1]} Z`} fill={cor(k)} opacity={0.85} stroke={tinta} strokeWidth={s(0.6)} strokeLinejoin="round" />)}</g>; }
    case 'linha_que_vira_onda': { const y = H / 2; return <g>
      <path d={`M0.6 ${y} H6 ` + Array.from({ length: 14 }, (_, k) => { const a = 0.3 + k * 0.22; return `q0.5 ${f((k % 2 ? 1 : -1) * a * 2)} 1 0`; }).join(' ')} {...L(0.5)} />
    </g>; }

    /* ================================================================ minimalistas */
    case 'seta_simples': { const y = H / 2; return <g>
      <path d={`M1.4 ${y} H18.6 M15.6 ${y - 2.2} L18.6 ${y} L15.6 ${y + 2.2}`} {...L(0.55)} />
      {[1.4, 2.8, 4.2].map((x, k) => <path key={k} d={`M${x} ${y} l-1 -1.8 M${x} ${y} l-1 1.8`} {...L(0.4)} />)}
    </g>; }
    case 'passaros_em_bando': return <g>
      {[[3.4, 8.6, 2.6], [8, 6.2, 2], [11.6, 7.8, 1.6], [14.6, 4.6, 1.2], [17.4, 3.4, 0.9]].map(([x, y, r], k) => <path key={k} d={`M${x - r} ${y - r * 0.5} Q${x - r * 0.4} ${y - r * 0.6} ${x} ${y + r * 0.1} Q${x + r * 0.4} ${y - r * 0.6} ${x + r} ${y - r * 0.5}`} {...L(0.5)} />)}
    </g>;
    case 'sol_nascendo': return <g>
      <path d={`M5.6 ${H - 2} A4.4 4.4 0 0 1 14.4 ${H - 2}`} {...L(0.55)} />
      <path d={`M1 ${H - 2} H19`} {...L(0.55)} />
      {[-70, -35, 0, 35, 70].map(a => { const r = a * Math.PI / 180; return <path key={a} d={`M${f(10 + Math.sin(r) * 5.8)} ${f(H - 2 - Math.cos(r) * 5.8)} L${f(10 + Math.sin(r) * 7.8)} ${f(H - 2 - Math.cos(r) * 7.8)}`} {...L(0.5)} />; })}
    </g>;
    case 'casinha_de_linha': return <g>
      <path d="M3 18 V9 L10 3 L17 9 V18 Z M8 18 V12.6 H12 V18 M13.4 5.6 V2.6 H15.4 V7.4" {...L(0.6)} />
      <path d="M14.4 1.6 q0.6 -0.8 0 -1.4" {...L(0.4)} />
    </g>;
    case 'folha_unica': { const c = W / 2; return <g>
      <path d={`M${c} 1 Q${W - 0.6} 7 ${c} 17 Q0.6 7 ${c} 1 Z`} {...L(0.55)} />
      <path d={`M${c} 2.6 V19.4`} {...L(0.45)} />
      {[6, 9, 12].map((y, k) => <path key={k} d={`M${c} ${y} l2.4 -2 M${c} ${y + 1} l-2.4 -2`} {...L(0.3)} />)}
    </g>; }

    /* ================================================================ ornamentais */
    case 'rosacea': return <g>
      <circle cx={10} cy={10} r={9.2} fill={cor(CINZA3)} {...C(0.7)} />
      {noCirculo(10, 10, 6.4, 12).map(([x, y], k) => <circle key={k} cx={x} cy={y} r={2.2} fill={cor([VERMELHO, AZUL, AMARELO][k % 3])} {...C(0.4)} />)}
      {noCirculo(10, 10, 3.2, 6, 0).map(([x, y], k) => <path key={`p${k}`} d={`M10 10 Q${f(x + (y - 10) * 0.5)} ${f(y - (x - 10) * 0.5)} ${x} ${y} Q${f(x - (y - 10) * 0.5)} ${f(y + (x - 10) * 0.5)} 10 10 Z`} fill={cor(ROXO)} {...C(0.35)} />)}
      <circle cx={10} cy={10} r={1.2} fill={cor(AMARELO)} {...C(0.4)} />
      <circle cx={10} cy={10} r={9.2} {...L(0.7)} /><circle cx={10} cy={10} r={4.4} {...L(0.35)} />
    </g>;
    case 'cruz_ornamental': { const c = W / 2; const lis = (rot: number, cx: number, cy: number) => <path transform={`rotate(${rot} ${cx} ${cy})`} d={`M${cx} ${cy - 2.6} Q${cx + 0.9} ${cy - 1} ${cx} ${cy} Q${cx - 0.9} ${cy - 1} ${cx} ${cy - 2.6} Z M${cx} ${cy} Q${cx + 2.4} ${cy - 1.6} ${cx + 1.8} ${cy - 2.6} Q${cx + 2.8} ${cy - 0.4} ${cx} ${cy + 0.4} M${cx} ${cy} Q${cx - 2.4} ${cy - 1.6} ${cx - 1.8} ${cy - 2.6} Q${cx - 2.8} ${cy - 0.4} ${cx} ${cy + 0.4}`} fill={tinta} {...C(0.3)} />; return <g>
      <path d={`M${c - 0.9} 3 H${c + 0.9} V6.6 H${c + 4.2} V8.4 H${c + 0.9} V17.4 H${c - 0.9} V8.4 H${c - 4.2} V6.6 H${c - 0.9} Z`} {...L(0.55)} />
      {lis(0, c, 3)}{lis(90, c + 4.2, 7.5)}{lis(-90, c - 4.2, 7.5)}{lis(180, c, 17.4)}
      <circle cx={c} cy={7.5} r={1.4} fill={tinta} /><circle cx={c} cy={7.5} r={0.5} fill="none" stroke={cor(BRANCO)} strokeWidth={s(0.3)} />
      {[10, 12, 14].map(y => <circle key={y} cx={c} cy={y} r={0.35} fill={tinta} />)}
    </g>; }
    case 'arabesco_espelhado': { const metade = <g>
      <path d={`M10 ${H / 2} Q13 ${H / 2 - 3.6} 15.6 ${H / 2 - 2} Q17.6 ${H / 2 - 0.4} 16.4 ${H / 2 + 1.4} Q15 ${H / 2 + 2.4} 14.4 ${H / 2 + 0.6}`} {...L(0.5)} />
      <path d={`M10 ${H / 2} Q13.6 ${H / 2 + 3.8} 17.4 ${H / 2 + 2.6} Q19.6 ${H / 2 + 1.4} 19 ${H / 2 - 1} Q18.4 ${H / 2 - 2.4} 17.4 ${H / 2 - 1.6}`} {...L(0.5)} />
      <path d={`M12.4 ${H / 2 - 1.8} q0.8 -1.8 2.4 -2.2 M12.6 ${H / 2 + 2} q1 1.6 2.6 1.8`} {...L(0.35)} />
      <circle cx={14.4} cy={H / 2 + 0.6} r={0.4} fill={tinta} /><circle cx={17.4} cy={H / 2 - 1.6} r={0.4} fill={tinta} />
    </g>; return <g>{metade}<g transform="translate(20 0) scale(-1 1)">{metade}</g>
      <path d={`M10 ${H / 2 - 1.6} L11 ${H / 2} L10 ${H / 2 + 1.6} L9 ${H / 2} Z`} fill={tinta} /></g>; }
    case 'pingente_de_lua': { const c = W / 2; return <g>
      <path d={`M0.6 0.8 Q${c} 4.6 ${W - 0.6} 0.8`} {...L(0.35)} />
      {[0.2, 0.4, 0.6, 0.8].map(t => <circle key={t} cx={f(0.6 + (W - 1.2) * t)} cy={f(0.8 + 3.8 * 4 * t * (1 - t) * 0.5)} r={0.4} fill={tinta} />)}
      <path d={`M${c} 2.8 V5.2`} {...L(0.35)} />
      <path d={`M${c + 1.4} 5.4 Q${c - 5.4} 6.4 ${c - 4} 11.4 Q${c - 2.4} 15.4 ${c + 2.2} 14.4 Q${c - 2} 13.4 ${c - 2.2} 10.2 Q${c - 2.2} 6.8 ${c + 1.4} 5.4 Z`} fill={tinta} />
      <circle cx={c + 1.2} cy={9.8} r={0.5} fill={tinta} />
      {[[c - 2.4, 0.9], [c, 1.2], [c + 2.4, 0.9]].map(([x, r], k) => <g key={k}><path d={`M${x} ${k === 1 ? 14.6 : 13.8} V${16 + k % 2}`} {...L(0.25)} /><path d={`M${x} ${16.4 + (k % 2)} q${r} ${r * 1.4} 0 ${r * 2} q-${r} -${r * 0.6} 0 -${r * 2} Z`} fill={tinta} /></g>)}
    </g>; }
    /* ================================================================ surrealistas */
    case 'escada_para_a_lua': { const c = W / 2; return <g>
      <path d={`M${c + 2} 0.4 V2`} {...L(0.3)} />
      <path d={`M${c + 3.4} 2.4 A3.2 3.2 0 1 0 ${c + 3.4} 7.8 A2.4 2.4 0 1 1 ${c + 3.4} 2.4 Z`} fill={tinta} />
      <path d={`M${c - 3.8} 19.6 L${c} 6 M${c - 0.8} 19.6 L${c + 2.8} 6.6`} {...L(0.5)} />
      {Array.from({ length: 8 }, (_, k) => { const t = (k + 0.5) / 8; return <path key={k} d={`M${f(c - 3.8 + 3.8 * t)} ${f(19.6 - 13.6 * t)} L${f(c - 0.8 + 3.6 * t)} ${f(19.6 - 13 * t)}`} {...L(0.35)} />; })}
      {[[1, 3], [W - 1.2, 11], [1.6, 9]].map(([x, y], k) => <path key={k} d={estrela(x, y, 0.7, 4, 0.2)} fill={tinta} />)}
    </g>; }
    case 'casa_no_balao': { const c = W / 2; return <g>
      <ellipse cx={c} cy={4.6} rx={4} ry={4.2} fill={cor(VERMELHO)} {...C(0.55)} /><path d={`M${c - 1.8} 2.6 Q${c - 1.6} 1.6 ${c - 0.6} 1.4`} fill="none" stroke={cor(BRANCO)} strokeWidth={s(0.45)} strokeLinecap="round" />
      <path d={`M${c} 8.8 l-0.4 0.6 h0.8 Z`} fill={tinta} /><path d={`M${c} 9.4 Q${c - 1} 11 ${c} 12.6`} {...L(0.3)} />
      <path d={`M${c - 3} 15.4 L${c} 12.6 L${c + 3} 15.4 V18.4 H${c - 3} Z`} fill={cor(CREME)} {...C(0.5)} /><rect x={c - 0.6} y={16.2} width={1.2} height={2.2} fill={tinta} />
      <path d={`M${c - 3.4} 15.6 L${c} 12.4 L${c + 3.4} 15.6`} {...L(0.6)} />
      <path d={`M0.6 19.4 Q2.4 17.6 4 18.6 Q5.4 17.2 7 18.4 Q8.4 17.4 ${W - 0.6} 19 `} fill={cor(BRANCO)} {...C(0.4)} />
    </g>; }
    case 'lampada_com_oceano': { const c = W / 2; return <g>
      <path d={`M${c - 2.6} 14 Q${c - 6.6} 10 ${c - 6.4} 6.6 Q${c - 6} 0.8 ${c} 0.8 Q${c + 6} 0.8 ${c + 6.4} 6.6 Q${c + 6.6} 10 ${c + 2.6} 14 Z`} fill={cor(BRANCO)} opacity={0.4} />
      <path d={`M${c - 5.6} 8 Q${c - 4} 6.6 ${c - 2.4} 8 Q${c - 0.8} 6.6 ${c + 0.8} 8 Q${c + 2.4} 6.6 ${c + 4} 8 Q${c + 5} 7.2 ${c + 5.8} 8 Q${c + 5.6} 10.6 ${c + 2.6} 14 H${c - 2.6} Q${c - 5.4} 10.8 ${c - 5.6} 8 Z`} fill={cor(TURQUESA)} />
      <path d={`M${c - 1} 7.4 L${c - 0.4} 4 L${c + 1.6} 7 Z`} fill={cor(BRANCO)} {...C(0.3)} /><path d={`M${c - 2} 7.6 H${c + 2} L${c + 1.4} 8.4 H${c - 1.4} Z`} fill={cor(TERRA)} {...C(0.3)} />
      <path d={`M${c - 2.6} 14 Q${c - 6.6} 10 ${c - 6.4} 6.6 Q${c - 6} 0.8 ${c} 0.8 Q${c + 6} 0.8 ${c + 6.4} 6.6 Q${c + 6.6} 10 ${c + 2.6} 14 Z`} {...L(0.6)} />
      <rect x={c - 2.6} y={14} width={5.2} height={4} rx={0.4} fill={cor(CINZA3)} {...C(0.45)} />
      <path d={`M${c - 2.6} 15.4 H${c + 2.6} M${c - 2.6} 16.8 H${c + 2.6}`} {...L(0.3)} /><path d={`M${c - 1} 18 L${c} 19.4 L${c + 1} 18`} {...L(0.4)} />
    </g>; }
    case 'olho_galaxia': { const y = H / 2; return <g>
      <path d={`M0.6 ${y} Q10 ${y - 8} 19.4 ${y} Q10 ${y + 8} 0.6 ${y} Z`} fill={cor(BRANCO)} {...C(0.6)} />
      <circle cx={10} cy={y} r={3.8} fill={cor(ROXO)} />
      <path d={espiral(10, y, 3.6, 1.6)} fill="none" stroke={cor(CELESTE)} strokeWidth={s(0.45)} /><path d={espiral(10, y, 3.6, 1.6, Math.PI)} fill="none" stroke={cor(ROSA)} strokeWidth={s(0.45)} />
      <circle cx={10} cy={y} r={0.9} fill={cor(BRANCO)} />
      {[3, 6, 10, 14, 17].map((x, k) => <path key={k} d={`M${x} ${f(y - 3.6 + Math.abs(10 - x) * 0.32)} l${(x - 10) * 0.06} -1.2`} {...L(0.4)} />)}
      <path d={estrela(13, y + 4.6, 0.9, 4, 0.25)} fill={cor(AMARELO)} {...C(0.2)} />
    </g>; }
    case 'peixe_no_ceu': return <g>
      <path d="M2 9.4 Q2 6.4 5 6.6 Q5.6 4 8.6 4.6 Q10 2.6 12.6 3.8 Q15.6 3.6 15.8 6.4 Q18.6 6.6 18.4 9.4 Z" fill={cor(BRANCO)} {...C(0.5)} />
      <path d={ondas(2.2, 18.2, 9.4, 0.7, 5)} fill="none" stroke={cor(AZUL)} strokeWidth={s(0.5)} />
      <path d="M5.4 12.4 Q9 9.4 13 11.6 L15.6 9.6 L15.2 12.4 L16 14.8 L13 13.2 Q9 15.6 5.4 12.4 Z" fill={cor(LARANJA)} {...C(0.5)} />
      <circle cx={7.4} cy={12} r={0.4} fill={tinta} /><path d="M9.6 11.2 Q10.4 12.4 9.6 13.6 M11.2 11.4 Q11.8 12.4 11.2 13.4" {...L(0.3)} />
      {[[4, 13.6], [3.2, 12], [3.6, 10.6]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r={0.35 - k * 0.06} {...L(0.2)} />)}
    </g>;
    case 'rosto_de_janela': return <g>
      <path d="M12 19.6 L12 16 Q14.6 15.4 13.8 13 L15 12.8 L14 11.4 Q15 10.8 14.6 10 L15.6 8.2 Q15 7 14 6.6 Q14 1.4 7.6 1 Q1.6 1 1.2 7.6 Q1 12.6 4.6 14.6 L4.6 19.6" {...L(0.6)} />
      <rect x={4.4} y={4} width={6} height={6.4} fill={cor(CELESTE)} opacity={0.6} />
      <circle cx={8.4} cy={6} r={1} fill={cor(AMARELO)} opacity={0.9} /><path d="M5 8.6 q1 -0.6 2 0" {...L(0.25)} />
      <rect x={4.4} y={4} width={6} height={6.4} {...L(0.5)} /><path d="M7.4 4 V10.4 M4.4 7.2 H10.4" {...L(0.35)} />
      <path d="M4.4 4 L2.6 3 V11 L4.4 10.4" fill={cor(CREME)} {...C(0.35)} />
    </g>;

    /* ================================================================ conceituais */
    case 'barra_carregando': { const y = H / 2; return <g>
      <rect x={0.6} y={y - 2} width={18.8} height={4} rx={1} {...L(0.55)} />
      {Array.from({ length: 7 }, (_, k) => <rect key={k} x={1.6 + k * 2.2} y={y - 1.1} width={1.6} height={2.2} rx={0.2} fill={tinta} />)}
    </g>; }
    case 'pegada_raiz': { const c = W / 2; return <g>
      <path d={`M${c - 2} 3.4 Q${c - 3.8} 6 ${c - 2.8} 9.2 Q${c - 2.2} 11.4 ${c - 2.6} 13 Q${c - 2.6} 14.4 ${c - 0.8} 14.4 Q${c + 1} 14.4 ${c + 1} 12.6 Q${c + 0.8} 10.6 ${c + 2} 8.6 Q${c + 3} 6.4 ${c + 2} 4.4 Q${c} 2.4 ${c - 2} 3.4 Z`} fill={tinta} />
      {[[c - 2.4, 1.6, 1], [c - 0.4, 0.9, 0.85], [c + 1.3, 1.1, 0.7], [c + 2.6, 1.9, 0.6], [c + 3.5, 3.1, 0.5]].map(([x, y, r], k) => <ellipse key={k} cx={x} cy={y} rx={r * 0.8} ry={r} fill={tinta} />)}
      <path d={`M${c - 1.4} 14.2 Q${c - 2} 17 ${c - 4} 19.6 M${c - 0.6} 14.4 Q${c - 0.2} 17 ${c + 1} 19.6 M${c + 0.4} 14 Q${c + 2.6} 15.6 ${c + 4} 18 M${c - 2.4} 13.8 Q${c - 4} 15.4 ${c - 5} 15.6 M${c - 1.6} 17 l-1.4 0.4 M${c} 17.6 l1.2 -0.2`} {...L(0.4)} />
    </g>; }
    case 'coracao_em_fio': return <g>
      <circle cx={3.6} cy={8.4} r={3} {...L(0.5)} />
      <path d="M1.2 7 Q3.6 9.6 6 7 M1 8.8 Q3.6 6.2 6.2 9 M1.6 10.2 Q3.6 8.6 5.6 10.6" {...L(0.3)} />
      <path d="M6.4 9.4 Q9 11.6 10.8 9.6 Q12.6 7.6 11.6 5 Q10.4 2.8 13.4 3 Q14.8 3.4 15 5 Q15.2 3.4 16.8 3 Q19.6 3 19 6.4 Q18.4 9 15 11.4 Q13.4 9 11 10.8" {...L(0.45)} />
    </g>;
    case 'balanca_mente_coracao': return <g>
      <path d="M10 2 V15.6 M6.6 15.6 H13.4 M3 4.4 H17" {...L(0.6)} /><circle cx={10} cy={2} r={0.7} fill={tinta} />
      <path d="M3 4.4 L1 9.6 M3 4.4 L5 9.6 M17 4.4 L15 9.6 M17 4.4 L19 9.6" {...L(0.3)} />
      <path d="M0.6 9.6 H5.4 Q5 11.2 3 11.2 Q1 11.2 0.6 9.6 Z M14.6 9.6 H19.4 Q19 11.2 17 11.2 Q15 11.2 14.6 9.6 Z" {...L(0.45)} />
      <path d="M1.4 9.4 Q0.8 7 2.4 6.8 Q3 6 3.8 6.8 Q5.4 7 4.6 9.4 Z M3 7 V9.2 M2 8 Q2.6 8.4 3 8" {...L(0.35)} />
      <path d="M17 9.4 Q14.6 7.8 15.4 6.6 Q16.4 6 17 7 Q17.6 6 18.6 6.6 Q19.4 7.8 17 9.4 Z" fill={tinta} />
    </g>;
    case 'metade_rosto_caveira': { const c = 8; return <g>
      <path d={`M${c} 1 Q1.6 1 1.6 8.4 Q1.6 13 3.4 15.6 Q5.4 18.8 ${c} 19 Z`} {...L(0.6)} />
      <path d="M4 8 Q5.4 7 6.6 8 Q5.4 8.8 4 8 Z" fill={tinta} /><path d="M3.6 6.6 Q5.2 5.8 6.8 6.4" {...L(0.4)} />
      <path d={`M6.8 12.4 Q7.4 12.8 ${c} 12.6 M5 15.2 Q6.6 16 ${c} 15.6`} {...L(0.4)} />
      <path d={`M${c} 1 Q14.4 1 14.4 8 Q14.4 11.4 12.6 12.6 V15.4 Q11 17.4 ${c} 17.4 Z`} fill={tinta} />
      <circle cx={10.8} cy={8} r={1.8} fill={cor(BRANCO)} /><path d={`M${c + 0.4} 12.4 L${c + 1} 10.6 L${c + 1.6} 12.4 Z`} fill={cor(BRANCO)} />
      {[9, 10.4, 11.8].map(x => <path key={x} d={`M${x} 14.4 V16.4`} stroke={cor(BRANCO)} strokeWidth={s(0.4)} />)}
      <path d={`M${c} 1 V19`} {...L(0.3)} strokeDasharray="0.6 0.4" />
    </g>; }

    /* ================================================================ blackwork */
    case 'cervo_caveira': { const c = W / 2; return <g>
      <path d={`M${c} 8 Q${c - 3.6} 8 ${c - 3.4} 11.6 Q${c - 2} 14 ${c - 1.4} 19 H${c + 1.4} Q${c + 2} 14 ${c + 3.4} 11.6 Q${c + 3.6} 8 ${c} 8 Z`} fill={tinta} />
      <ellipse cx={c - 1.6} cy={11.2} rx={0.9} ry={1.1} fill={cor(BRANCO)} /><ellipse cx={c + 1.6} cy={11.2} rx={0.9} ry={1.1} fill={cor(BRANCO)} />
      <path d={`M${c - 0.6} 16.4 L${c} 15 L${c + 0.6} 16.4`} fill="none" stroke={cor(BRANCO)} strokeWidth={s(0.4)} />
      {[1, -1].map(d => <path key={d} d={`M${c + d * 2} 8.6 Q${c + d * 4} 5 ${c + d * 3.4} 1 M${c + d * 3.6} 5.4 Q${c + d * 6} 4.6 ${c + d * 7} 1.6 M${c + d * 3} 3 Q${c + d * 1.8} 2.4 ${c + d * 1.6} 0.8 M${c + d * 5.6} 3.6 Q${c + d * 7.6} 4 ${c + d * 8} 5.6 M${c + d * 3.4} 7.2 Q${c + d * 6} 7.8 ${c + d * 7.4} 7`} {...L(0.9)} />)}
    </g>; }
    case 'sol_negro': return <g>
      <circle cx={10} cy={10} r={9.4} fill={tinta} />
      {noCirculo(10, 10, 0, 12).map(([, , a], k) => <path key={k} d={`M${f(10 + Math.cos(a) * 2.4)} ${f(10 + Math.sin(a) * 2.4)} L${f(10 + Math.cos(a + 0.12) * 8.4)} ${f(10 + Math.sin(a + 0.12) * 8.4)} L${f(10 + Math.cos(a - 0.08) * 8.6)} ${f(10 + Math.sin(a - 0.08) * 8.6)} Z`} fill={cor(BRANCO)} />)}
      <circle cx={10} cy={10} r={1.4} fill={cor(BRANCO)} />
    </g>;
    case 'adaga_e_rosa_negra': { const c = W / 2; return <g>
      <path d={`M${c - 0.9} 0.6 L${c + 0.9} 0.6 L${c + 0.9} 3 L${c - 0.9} 3 Z M${c - 3} 3 H${c + 3} V4 H${c - 3} Z`} fill={tinta} />
      <path d={`M${c - 1.2} 4 H${c + 1.2} L${c} 19.6 Z`} fill={tinta} /><path d={`M${c} 4.4 V16`} stroke={cor(BRANCO)} strokeWidth={s(0.25)} />
      <path d={`M${c} 6 Q${c + 4.4} 6 ${c + 4.2} 10 Q${c + 3.8} 13.6 ${c} 13.8 Q${c - 3.8} 13.6 ${c - 4.2} 10 Q${c - 4.4} 6 ${c} 6 Z`} fill={tinta} />
      <path d={`M${c - 2.6} 9 Q${c} 7.4 ${c + 2.6} 9 M${c - 3} 10.8 Q${c - 1} 12.4 ${c} 10.6 Q${c + 1} 12.4 ${c + 3} 10.8 M${c - 1.4} 8.6 Q${c} 10.4 ${c + 1.4} 8.6 M${c - 2} 12.6 Q${c} 13.4 ${c + 2} 12.6`} fill="none" stroke={cor(BRANCO)} strokeWidth={s(0.35)} strokeLinecap="round" />
      <path d={`M${c - 4} 12.6 Q${c - 6.4} 14 ${c - 4.4} 15.8 Q${c - 3} 14.6 ${c - 2.8} 13.2 Z M${c + 4} 12.6 Q${c + 6.4} 14 ${c + 4.4} 15.8 Q${c + 3} 14.6 ${c + 2.8} 13.2 Z`} fill={tinta} />
      <path d={`M${c - 4.4} 15.4 L${c - 3.2} 13.8 M${c + 4.4} 15.4 L${c + 3.2} 13.8`} stroke={cor(BRANCO)} strokeWidth={s(0.25)} />
    </g>; }
    case 'faixa_de_triangulos': return <g>
      <rect x={0} y={0} width={W} height={0.9} fill={tinta} /><rect x={0} y={H - 0.9} width={W} height={0.9} fill={tinta} />
      {Array.from({ length: 8 }, (_, k) => <path key={k} d={`M${f(k * 2.5)} 0.9 L${f(k * 2.5 + 1.25)} ${f(H - 0.9)} L${f(k * 2.5 + 2.5)} 0.9 Z`} fill={tinta} />)}
    </g>;
    case 'olho_na_lua': return <g>
      <circle cx={10} cy={10} r={9.2} fill={tinta} />
      <path d="M3.4 10 Q10 3.6 16.6 10 Q10 16.4 3.4 10 Z" fill={cor(BRANCO)} />
      <circle cx={10} cy={10} r={2.6} fill={tinta} /><circle cx={10.8} cy={9.2} r={0.6} fill={cor(BRANCO)} />
      {[5, 7.4, 10, 12.6, 15].map((x, k) => <path key={k} d={`M${x} ${f(7.4 - (k === 2 ? 0.6 : 0))} l${(x - 10) * 0.05} -1.4`} stroke={cor(BRANCO)} strokeWidth={s(0.35)} strokeLinecap="round" transform={`translate(0 ${f(Math.abs(10 - x) * 0.3)})`} />)}
    </g>;

    /* ================================================================ old school */
    case 'navio_na_garrafa': return <g>
      <path d="M1.6 4 Q1.6 2 4 2 H13 Q15 2 15.4 4 L17 4.8 H19 V7.6 H17 L15.4 8.4 Q15 10.4 13 10.4 H4 Q1.6 10.4 1.6 8.4 Z" fill={cor(CELESTE)} opacity={0.35} />
      <path d={ondas(2, 15, 8.4, 0.4, 4)} fill="none" stroke={cor(AZUL)} strokeWidth={s(0.6)} />
      <path d="M5 8 H12 L11 9.4 H6 Z" fill={cor(MARROM)} {...C(0.35)} /><path d="M8.4 8 V3.2" {...L(0.3)} />
      <path d="M8.6 3.4 L11.4 7.4 H8.6 Z M8.2 4 L5.8 7.4 H8.2 Z" fill={cor(BRANCO)} {...C(0.3)} />
      <path d="M1.6 4 Q1.6 2 4 2 H13 Q15 2 15.4 4 L17 4.8 H19 V7.6 H17 L15.4 8.4 Q15 10.4 13 10.4 H4 Q1.6 10.4 1.6 8.4 Z" {...L(0.7)} />
      <rect x={18.6} y={4.6} width={1.2} height={3.2} rx={0.3} fill={cor(TERRA)} {...C(0.35)} />
      <path d="M3 3 Q6 2.6 8 3" fill="none" stroke={cor(BRANCO)} strokeWidth={s(0.45)} strokeLinecap="round" />
    </g>;
    case 'chave_e_cadeado': return <g>
      <path d="M5 8 V5.6 Q5 2 8.4 2 Q11.8 2 11.8 5.6 V8" {...L(1)} />
      <path d="M8.4 19 Q1.4 14.4 2 10.4 Q2.6 7.4 5.4 7.6 Q7.4 7.8 8.4 9.4 Q9.4 7.8 11.4 7.6 Q14.2 7.4 14.8 10.4 Q15.4 14.4 8.4 19 Z" fill={cor(VERMELHO)} {...C(0.8)} />
      <circle cx={8.4} cy={12} r={1} fill={tinta} /><path d="M8.4 12 L7.8 14.6 H9 Z" fill={tinta} />
      <path d="M4 10.4 Q4.4 9.4 5.6 9.4" fill="none" stroke={cor(BRANCO)} strokeWidth={s(0.5)} strokeLinecap="round" />
      <circle cx={17} cy={4} r={2} fill={cor(AMARELO)} {...C(0.6)} /><circle cx={17} cy={4} r={0.7} fill={cor(BRANCO)} {...C(0.3)} />
      <path d="M17 6 V16 M17 13 H18.8 M17 15 H18.4" fill="none" stroke={tinta} strokeWidth={s(0.9)} strokeLinecap="round" />
    </g>;
    case 'lobo_tradicional': { const c = W / 2; return <g>
      <circle cx={c} cy={7} r={6.6} fill={cor(AMARELO)} {...C(0.5)} />
      <path d={`M${c} 18.6 L${c - 3.2} 16 L${c - 6} 11 L${c - 7} 4.4 L${c - 3.6} 7 Q${c} 5.6 ${c + 3.6} 7 L${c + 7} 4.4 L${c + 6} 11 L${c + 3.2} 16 Z`} fill={cor(CINZA2)} {...C(0.8)} />
      <path d={`M${c - 6.2} 5.8 L${c - 4.6} 7.6 M${c + 6.2} 5.8 L${c + 4.6} 7.6`} {...L(0.4)} />
      <path d={`M${c - 2} 10 Q${c} 9 ${c + 2} 10 L${c + 1.6} 14.6 L${c} 16 L${c - 1.6} 14.6 Z`} fill={cor(CREME)} {...C(0.5)} />
      <path d={`M${c - 4.4} 9.6 L${c - 2} 10.6 M${c + 4.4} 9.6 L${c + 2} 10.6`} {...L(0.7)} /><circle cx={c - 3} cy={10.4} r={0.45} fill={cor(AMARELO)} /><circle cx={c + 3} cy={10.4} r={0.45} fill={cor(AMARELO)} />
      <path d={`M${c - 0.9} 14 h1.8 l-0.9 0.8 Z`} fill={tinta} />
      <path d={`M${c - 2} 16 L${c - 1.4} 17.4 L${c - 0.6} 16.2 M${c + 2} 16 L${c + 1.4} 17.4 L${c + 0.6} 16.2`} fill={cor(BRANCO)} {...C(0.3)} />
    </g>; }
    case 'caveira_de_cartola': { const c = W / 2; return <g>
      <rect x={c - 4} y={0.6} width={8} height={6} fill={tinta} /><rect x={c - 4} y={4.4} width={8} height={1.4} fill={cor(VERMELHO)} />
      <path d={`M${c - 6.6} 6.6 Q${c} 5.4 ${c + 6.6} 6.6 L${c + 6.4} 7.6 Q${c} 6.6 ${c - 6.4} 7.6 Z`} fill={tinta} />
      <circle cx={c + 3.2} cy={5} r={1.3} fill={cor(VERMELHO)} {...C(0.3)} /><path d={espiral(c + 3.2, 5, 0.9, 1.2)} {...L(0.2)} />
      <path d={`M${c} 7.4 Q${c - 5.6} 7.4 ${c - 5.4} 12.4 Q${c - 5} 15 ${c - 3} 15.6 V18.4 H${c + 3} V15.6 Q${c + 5} 15 ${c + 5.4} 12.4 Q${c + 5.6} 7.4 ${c} 7.4 Z`} fill={cor(BRANCO)} {...C(0.7)} />
      <ellipse cx={c - 2.2} cy={11.4} rx={1.4} ry={1.5} fill={tinta} /><ellipse cx={c + 2.2} cy={11.4} rx={1.4} ry={1.5} fill={tinta} />
      <path d={`M${c - 0.6} 14.4 L${c} 13 L${c + 0.6} 14.4 Z`} fill={tinta} />
      <path d={`M${c - 2} 16 V18.4 M${c - 0.7} 16 V18.4 M${c + 0.7} 16 V18.4 M${c + 2} 16 V18.4`} {...L(0.3)} />
    </g>; }
    case 'garrafa_de_veneno': { const c = W / 2; return <g>
      <rect x={c - 1.6} y={0.6} width={3.2} height={2.4} rx={0.4} fill={cor(TERRA)} {...C(0.45)} />
      <path d={`M${c - 1.4} 3 V6 Q${c - 6} 7.6 ${c - 6} 12.6 V18 Q${c - 6} 19.4 ${c - 4.6} 19.4 H${c + 4.6} Q${c + 6} 19.4 ${c + 6} 18 V12.6 Q${c + 6} 7.6 ${c + 1.4} 6 V3 Z`} fill={cor(VERDE)} {...C(0.7)} />
      <rect x={c - 4} y={10.6} width={8} height={6} rx={0.4} fill={cor(CREME)} {...C(0.45)} />
      <circle cx={c} cy={12.8} r={1.4} fill={tinta} /><circle cx={c - 0.5} cy={12.7} r={0.35} fill={cor(CREME)} /><circle cx={c + 0.5} cy={12.7} r={0.35} fill={cor(CREME)} />
      <path d={`M${c - 2.2} 14.4 L${c + 2.2} 16 M${c + 2.2} 14.4 L${c - 2.2} 16`} {...L(0.5)} />
      <path d={`M${c - 4.4} 8.6 Q${c - 4.8} 10 ${c - 4.8} 11`} fill="none" stroke={cor(BRANCO)} strokeWidth={s(0.5)} strokeLinecap="round" />
    </g>; }

    /* ================================================================ oriental */
    case 'portal_torii': return <g>
      <circle cx={10} cy={8} r={4.4} fill={cor(LARANJA)} opacity={0.6} />
      <path d="M0.6 2.6 Q10 4.4 19.4 2.6 L19 4.4 Q10 5.6 1 4.4 Z" fill={cor(VERMELHO)} {...C(0.5)} />
      <rect x={2.6} y={6.4} width={14.8} height={1.2} fill={cor(VERMELHO)} {...C(0.4)} />
      <path d="M4.4 4.8 L4 14 H5.6 L5.8 4.8 M15.6 4.8 L16 14 H14.4 L14.2 4.8" fill={cor(VERMELHO)} {...C(0.45)} />
      <path d="M9.4 4.8 V6.4 H10.6 V4.8" fill={tinta} />
      <path d={ondas(0.6, 19.4, 15, 0.5, 5)} fill="none" stroke={cor(AZUL)} strokeWidth={s(0.5)} /><path d={ondas(2, 18, 16.2, 0.4, 4)} fill="none" stroke={cor(AZUL)} strokeWidth={s(0.4)} />
    </g>;
    case 'leque': { const cx = 10, cy = 11.6; return <g>
      <path d={`M${cx} ${cy} L${f(cx - 9.4)} ${f(cy - 4)} A10.2 10.2 0 0 1 ${f(cx + 9.4)} ${f(cy - 4)} Z`} fill={cor(CREME)} {...C(0.55)} />
      {Array.from({ length: 9 }, (_, k) => { const a = Math.PI + 0.4 + (k / 8) * (Math.PI - 0.8); return <path key={k} d={`M${cx} ${cy} L${f(cx + Math.cos(a) * 10.2)} ${f(cy + Math.sin(a) * 10.2)}`} {...L(0.25)} />; })}
      <path d={`M${cx - 7} ${cy - 5} Q${cx - 2} ${cy - 8.6} ${cx + 4.6} ${cy - 7.8}`} {...L(0.5)} stroke={cor(MARROM)} />
      {[[cx - 4.4, cy - 7.6], [cx + 0.4, cy - 8.6], [cx + 4, cy - 6.4]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r={0.8} fill={cor(ROSA)} {...C(0.25)} />)}
      <path d={`M${cx} ${cy} V${cy + 1}`} {...L(0.4)} /><path d={`M${cx - 0.5} ${cy + 0.8} L${cx} ${H - 0.2} L${cx + 0.5} ${cy + 0.8}`} fill={cor(VERMELHO)} {...C(0.3)} />
      <circle cx={cx} cy={cy} r={0.5} fill={tinta} />
    </g>; }
    case 'mascara_kitsune': { const c = W / 2; return <g>
      <path d={`M${c} 19 Q${c - 3.4} 15 ${c - 6.6} 9.6 L${c - 7} 1 L${c - 3} 5.4 Q${c} 4.6 ${c + 3} 5.4 L${c + 7} 1 L${c + 6.6} 9.6 Q${c + 3.4} 15 ${c} 19 Z`} fill={cor(BRANCO)} {...C(0.7)} />
      <path d={`M${c - 6.2} 2.6 L${c - 4.4} 5.6 M${c + 6.2} 2.6 L${c + 4.4} 5.6`} stroke={cor(VERMELHO)} strokeWidth={s(0.6)} strokeLinecap="round" />
      <path d={`M${c - 5} 9 Q${c - 3.4} 7.4 ${c - 1.6} 9.4 M${c + 5} 9 Q${c + 3.4} 7.4 ${c + 1.6} 9.4`} {...L(0.7)} />
      <path d={`M${c - 5} 9 L${c - 6} 8 M${c + 5} 9 L${c + 6} 8`} stroke={cor(VERMELHO)} strokeWidth={s(0.5)} strokeLinecap="round" />
      <path d={`M${c} 5.8 L${c} 8 M${c - 0.8} 6.6 L${c} 5.4 L${c + 0.8} 6.6`} stroke={cor(VERMELHO)} strokeWidth={s(0.5)} fill="none" strokeLinecap="round" />
      <ellipse cx={c} cy={16.4} rx={1} ry={0.6} fill={tinta} />
      <path d={`M${c - 3.4} 12.4 l-2 -0.4 M${c - 3.4} 13.4 l-2 0.2 M${c + 3.4} 12.4 l2 -0.4 M${c + 3.4} 13.4 l2 0.2`} {...L(0.3)} />
    </g>; }
    case 'bambu': { const w = W; return <g>
      {[[w * 0.35, 0.6, 0], [w * 0.72, 3.4, 1]].map(([x, y0, k]) => <g key={k}>
        <path d={`M${x} ${y0} V19.6`} stroke={cor(VERDE)} strokeWidth={s(1.6)} />
        <path d={`M${x - 0.8} ${y0} V19.6 M${x + 0.8} ${y0} V19.6`} {...L(0.3)} />
        {[0, 1, 2, 3].map(j => <path key={j} d={`M${x - 1} ${(y0 as number) + 3.6 + j * 4.2} H${x + 1}`} {...L(0.6)} />)}
      </g>)}
      {[[w * 0.35, 4.2, -1], [w * 0.35, 12.6, -1], [w * 0.72, 7.8, 1], [w * 0.72, 16, 1]].map(([x, y, d], k) => <g key={`f${k}`}>
        <path d={`M${x} ${y} Q${x + (d as number) * 2} ${(y as number) - 2} ${x + (d as number) * 4} ${(y as number) - 1.6} Q${x + (d as number) * 2} ${(y as number) - 0.4} ${x} ${y} Z`} fill={cor(VERDE_CLARO)} {...C(0.3)} />
        <path d={`M${x} ${y} Q${x + (d as number) * 1.6} ${(y as number) + 0.4} ${x + (d as number) * 3.2} ${(y as number) + 1.4} Q${x + (d as number) * 1.4} ${(y as number) + 1.6} ${x} ${y} Z`} fill={cor(VERDE)} {...C(0.3)} />
      </g>)}
    </g>; }

    /* ================================================================ fine line */
    case 'fio_do_destino': { const y = H / 2; return <g>
      <ellipse cx={2.6} cy={y} rx={2} ry={2.6} fill="none" stroke={cor(OURO)} strokeWidth={s(0.9)} /><ellipse cx={2.6} cy={y} rx={2} ry={2.6} {...L(0.25)} />
      <ellipse cx={17.4} cy={y} rx={2} ry={2.6} fill="none" stroke={cor(OURO)} strokeWidth={s(0.9)} /><ellipse cx={17.4} cy={y} rx={2} ry={2.6} {...L(0.25)} />
      <path d={`M4.6 ${y} Q7 ${y + 1} 8.6 ${y} Q7.6 ${y - 3.4} 10 ${y - 2} Q12.4 ${y - 3.4} 11.4 ${y} L10 ${y + 2} L8.6 ${y} M11.4 ${y} Q13 ${y + 1} 15.4 ${y}`} fill="none" stroke={cor(VERMELHO)} strokeWidth={s(0.45)} strokeLinecap="round" strokeLinejoin="round" />
    </g>; }
    case 'maos_se_tocando': { const y = H / 2; const mao = <g>
      <path d={`M0.4 ${y - 0.6} H3 Q4 ${y - 1.6} 5.4 ${y - 1.4} L8.8 ${y - 1.2} Q9.4 ${y - 0.8} 8.8 ${y - 0.4} L5.8 ${y - 0.2} Q6.6 ${y + 0.4} 6.2 ${y + 1} Q6.8 ${y + 1.6} 6 ${y + 2} Q6.4 ${y + 2.8} 5.4 ${y + 3} H3 Q2.2 ${y + 3} 1.6 ${y + 2.4} H0.4`} {...L(0.3)} />
      <path d={`M4.4 ${y + 0.2} H6 M4.4 ${y + 1.2} H6 M4.2 ${y + 2.2} H5.4`} {...L(0.22)} />
    </g>; return <g>{mao}<g transform={`translate(20 ${f(H - 1)}) scale(-1 -1) translate(0 ${-1})`}>{mao}</g>
      <circle cx={10} cy={y - 0.8} r={0.25} fill={tinta} opacity={0.6} /></g>; }
    case 'golfinho_fino': return <g>
      <path d="M2 11 Q5.6 1.6 12.6 2.6 Q15.6 3 17.4 5.6 L19.4 5.6 L17.6 6.6 Q15 6 12.4 5.4 Q7.6 5 4.6 11.4" {...L(0.4)} />
      <path d="M10 3 L9.4 1 L11.4 2.6 M8.6 6.2 L9.6 8 L7.4 7" {...L(0.35)} /><circle cx={15.6} cy={4.6} r={0.3} fill={tinta} />
      <path d="M2 11 L0.6 10.6 M2 11 L1.6 12.4" {...L(0.4)} />
      <path d={ondas(0.6, 19.4, 12.6, 0.6, 4)} {...L(0.35)} />
    </g>;
    case 'orbita_fina': return <g>
      <circle cx={10} cy={10} r={1.4} fill={tinta} />
      <ellipse cx={10} cy={10} rx={9} ry={3.6} transform="rotate(-20 10 10)" {...L(0.3)} />
      <ellipse cx={10} cy={10} rx={5.4} ry={8.4} transform="rotate(30 10 10)" {...L(0.3)} />
      <circle cx={18.2} cy={7.4} r={0.8} {...L(0.35)} /><circle cx={6.8} cy={2.8} r={0.55} fill={tinta} />
    </g>;

    /* ================================================================ tribal */
    case 'cruz_marquesa': return <g>
      <path d="M7.6 1 H12.4 V4.4 H15.6 V7.6 H19 V12.4 H15.6 V15.6 H12.4 V19 H7.6 V15.6 H4.4 V12.4 H1 V7.6 H4.4 V4.4 H7.6 Z" fill={tinta} />
      <path d="M8.6 7.6 H11.4 V8.6 H12.4 V11.4 H11.4 V12.4 H8.6 V11.4 H7.6 V8.6 H8.6 Z" fill={cor(BRANCO)} />
      {[[10, 2.6], [10, 17.4], [2.6, 10], [17.4, 10]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r={0.7} fill={cor(BRANCO)} />)}
    </g>;
    case 'lagarto_tribal': { const c = W / 2; return <g>
      <path d={`M${c} 0.6 Q${c + 1.8} 1.8 ${c + 1.4} 4.4 Q${c + 2} 9 ${c + 1} 12.4 Q${c + 0.4} 15 ${c - 1.2} 17 Q${c - 2.6} 19 ${c - 4.6} 19.4 Q${c - 2} 17.4 ${c - 1} 14 Q${c - 2} 9 ${c - 1.4} 4.4 Q${c - 1.8} 1.8 ${c} 0.6 Z`} fill={tinta} />
      {[[5.4, 1, -1], [5.4, -1, -1], [11, 1, 1], [11, -1, 1]].map(([y, d, v], k) => <path key={k} d={`M${c + (d as number) * 1.2} ${y} Q${c + (d as number) * 3.4} ${(y as number) + (v as number) * -0.6} ${c + (d as number) * 4.4} ${(y as number) + (v as number) * 1.6} L${c + (d as number) * 5.4} ${(y as number) + (v as number) * 1.2} M${c + (d as number) * 4.4} ${(y as number) + (v as number) * 1.6} L${c + (d as number) * 4.6} ${(y as number) + (v as number) * 2.8}`} {...L(0.8)} />)}
      <path d={`M${c - 0.6} 6.6 Q${c} 7.6 ${c + 0.6} 6.6 M${c - 0.6} 8.8 Q${c} 9.8 ${c + 0.6} 8.8`} fill="none" stroke={cor(BRANCO)} strokeWidth={s(0.3)} />
    </g>; }
    case 'chamas_tribais': { const c = W / 2; return <g>
      <path d={`M${c} 19.6 Q${c - 7} 16 ${c - 5} 9.6 Q${c - 4.4} 13 ${c - 2.4} 13.6 Q${c - 5} 7 ${c - 1} 0.6 Q${c - 1.8} 7 ${c + 1} 10 Q${c + 1} 5.6 ${c + 4} 3.4 Q${c + 2.6} 8 ${c + 5} 11.6 Q${c + 6.6} 16.6 ${c} 19.6 Z`} fill={tinta} />
      <path d={`M${c} 17.6 Q${c - 3} 16 ${c - 2} 13.6 Q${c - 0.6} 15 ${c + 0.4} 14.6 Q${c - 0.4} 12 ${c + 1.6} 10.4 Q${c + 1.4} 13 ${c + 3} 14.4 Q${c + 3} 17 ${c} 17.6 Z`} fill={cor(BRANCO)} />
    </g>; }
    case 'arraia_tribal': return <g>
      <path d="M10 2 Q12.4 2.4 13.4 5 Q16.6 5.6 19.4 9 Q15 9.6 13 12.6 Q11.6 14 10 14.4 Q8.4 14 7 12.6 Q5 9.6 0.6 9 Q3.4 5.6 6.6 5 Q7.6 2.4 10 2 Z" fill={tinta} />
      <path d="M10 14.4 Q10.4 16.6 9.6 16.6" {...L(0.5)} />
      {[1, -1].map(d => <g key={d}>
        <path d={`M${10 + d * 3.4} 6.4 L${10 + d * 4.6} 8 L${10 + d * 5.8} 7.2 L${10 + d * 7} 8.8 L${10 + d * 8.2} 8.4`} fill="none" stroke={cor(BRANCO)} strokeWidth={s(0.35)} />
        <path d={`M${10 + d * 2.2} 10.6 Q${10 + d * 4} 9.6 ${10 + d * 5.4} 10`} fill="none" stroke={cor(BRANCO)} strokeWidth={s(0.35)} />
        <circle cx={10 + d * 1.2} cy={4} r={0.4} fill={cor(BRANCO)} />
      </g>)}
      <path d={espiral(10, 9, 1.6, 1.6)} fill="none" stroke={cor(BRANCO)} strokeWidth={s(0.35)} />
    </g>;

    /* ================================================================ realistas */
    case 'estatua_grega': return <g>
      <path d="M9 1 Q14.6 1 15 6 L15.4 8 Q16.6 9.4 15.6 9.8 L15.8 11.6 Q15.4 12.6 14.4 12.6 L14.6 14 Q14 15.2 11.6 15 L11 19.6 H4.6 L4.8 14.4 Q2 12 2.2 7.4 Q2.4 1.2 9 1 Z" fill={cor(CINZA3)} {...C(0.55)} />
      {[[4, 3.4], [6.6, 2.4], [9.6, 2.2], [3, 6.4], [5, 5.4], [12.4, 3], [3.6, 9]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r={1.1} fill={cor(CINZA2)} {...C(0.3)} />)}
      <path d="M11.4 6.6 Q12.6 6 13.6 6.8" {...L(0.4)} /><path d="M11.8 7.6 Q12.6 7.2 13.2 7.6" {...L(0.35)} />
      <path d="M5.4 12 Q7 14 9.6 14.6" fill="none" stroke={cor(CINZA2)} strokeWidth={s(1)} opacity={0.7} />
      <path d="M10.6 4 L11.4 7.4 L10.6 9 L11.6 11 L11 13" {...L(0.3)} />
    </g>;
    case 'coruja_realista': { const c = W / 2; return <g>
      <path d={`M${c} 2.6 Q${c - 2} 1.2 ${c - 6.4} 0.8 Q${c - 7.6} 6 ${c - 7.2} 11 Q${c - 6.6} 18.4 ${c} 19.6 Q${c + 6.6} 18.4 ${c + 7.2} 11 Q${c + 7.6} 6 ${c + 6.4} 0.8 Q${c + 2} 1.2 ${c} 2.6 Z`} fill={cor(CINZA2)} {...C(0.55)} />
      <circle cx={c - 3.2} cy={7.4} r={3.2} fill={cor(CINZA3)} /><circle cx={c + 3.2} cy={7.4} r={3.2} fill={cor(CINZA3)} />
      <circle cx={c - 3.2} cy={7.4} r={1.9} fill={cor(AMARELO)} {...C(0.35)} /><circle cx={c + 3.2} cy={7.4} r={1.9} fill={cor(AMARELO)} {...C(0.35)} />
      <circle cx={c - 3.2} cy={7.4} r={1.1} fill={tinta} /><circle cx={c + 3.2} cy={7.4} r={1.1} fill={tinta} />
      <circle cx={c - 2.8} cy={7} r={0.35} fill={cor(BRANCO)} /><circle cx={c + 3.6} cy={7} r={0.35} fill={cor(BRANCO)} />
      <path d={`M${c - 0.7} 9 L${c} 11.4 L${c + 0.7} 9 Z`} fill={cor(CINZA1)} {...C(0.3)} />
      {[13, 14.6, 16.2].map((y, r) => [-3, -1, 1, 3].map(x => <path key={`${r}${x}`} d={`M${c + x - 0.7} ${y} q0.7 0.8 1.4 0`} {...L(0.3)} />))}
    </g>; }
    case 'rei_de_xadrez': { const c = W / 2; return <g>
      <path d={`M${c - 0.6} 0.4 H${c + 0.6} V1.4 H${c + 1.6} V2.6 H${c + 0.6} V3.6 H${c - 0.6} V2.6 H${c - 1.6} V1.4 H${c - 0.6} Z`} fill={cor(CINZA2)} {...C(0.4)} />
      <path d={`M${c - 3} 4 Q${c} 3 ${c + 3} 4 L${c + 2.4} 7.4 H${c - 2.4} Z`} fill={cor(CINZA2)} {...C(0.5)} />
      <path d={`M${c - 2.6} 7.4 H${c + 2.6} V8.6 H${c - 2.6} Z`} fill={cor(CINZA1)} {...C(0.4)} />
      <path d={`M${c - 1.8} 8.6 Q${c - 1.6} 13 ${c - 3} 15.6 H${c + 3} Q${c + 1.6} 13 ${c + 1.8} 8.6 Z`} fill={cor(CINZA2)} {...C(0.5)} />
      <path d={`M${c + 0.6} 9 Q${c + 0.8} 12.6 ${c + 2} 15.4`} fill="none" stroke={cor(CINZA3)} strokeWidth={s(0.7)} />
      <path d={`M${c - 4.4} 15.6 H${c + 4.4} L${c + 4.8} 17.4 H${c - 4.8} Z M${c - 5.6} 17.4 H${c + 5.6} V19.4 H${c - 5.6} Z`} fill={cor(CINZA1)} {...C(0.5)} />
      <path d={`M${c - 2.2} 4.6 Q${c - 1.8} 6 ${c - 1.4} 7`} fill="none" stroke={cor(CINZA3)} strokeWidth={s(0.5)} />
    </g>; }
    case 'lamparina': { const c = W / 2; return <g>
      <path d={`M${c - 3} 2.4 Q${c} 0 ${c + 3} 2.4`} {...L(0.55)} /><circle cx={c} cy={0.9} r={0.6} {...L(0.35)} />
      <rect x={c - 3.6} y={2.4} width={7.2} height={1.2} rx={0.4} fill={cor(CINZA1)} {...C(0.4)} />
      <path d={`M${c - 3} 3.6 Q${c - 5.4} 9 ${c - 3} 14.4 H${c + 3} Q${c + 5.4} 9 ${c + 3} 3.6 Z`} fill={cor(CINZA3)} opacity={0.5} />
      <path d={`M${c - 3} 3.6 Q${c - 5.4} 9 ${c - 3} 14.4 M${c + 3} 3.6 Q${c + 5.4} 9 ${c + 3} 14.4`} {...L(0.5)} />
      <path d={`M${c} 12.4 Q${c - 1.6} 10.4 ${c} 6.6 Q${c + 1.6} 10.4 ${c} 12.4 Z`} fill={cor(AMARELO)} {...C(0.35)} />
      <path d={`M${c} 12 Q${c - 0.6} 10.6 ${c} 9 Q${c + 0.6} 10.6 ${c} 12 Z`} fill={cor(BRANCO)} />
      <path d={`M${c - 4} 14.4 H${c + 4} L${c + 3} 19.4 H${c - 3} Z`} fill={cor(CINZA2)} {...C(0.5)} /><path d={`M${c - 3.6} 16.4 H${c + 3.6}`} {...L(0.3)} />
      <path d={`M${c - 3.6} 5 Q${c - 4.2} 8 ${c - 3.4} 11`} fill="none" stroke={cor(BRANCO)} strokeWidth={s(0.4)} />
    </g>; }

    /* ================================================================ bichos */
    case 'capivara': return <g>
      <path d="M3 12 Q1.6 7.6 4.6 6 Q5.4 4 8 4.4 Q12 3.8 16 5 Q19 6.4 18.6 10 Q18.6 12.6 16.6 13.2 V14 H14.6 V13.2 H6.4 V14 H4.4 V12.8 Q3.4 12.6 3 12 Z" fill={cor(TERRA)} {...C(0.6)} />
      <path d="M3 12 Q1.4 10.8 1 9 Q0.8 6.8 3 6.4 Q4.6 6.2 5 7.6" fill={cor(TERRA)} {...C(0.55)} />
      <ellipse cx={1.8} cy={8.8} rx={0.9} ry={1.1} fill={cor(MARROM)} {...C(0.3)} />
      <circle cx={3.6} cy={7.6} r={0.35} fill={tinta} /><path d="M4.2 5.6 Q4.6 4.6 5.4 5.2" fill={cor(MARROM)} {...C(0.3)} />
      <path d="M8 8 q2 1 4 0 M10 10 q2 0.6 3.6 -0.4" {...L(0.25)} opacity={0.6} />
      <path d="M11.6 4.4 Q11.6 2 13 2 Q14.4 2 14 3.6 L15 3.4 L14 4.4 Z" fill={cor(AMARELO)} {...C(0.35)} /><circle cx={13.2} cy={2.8} r={0.2} fill={tinta} />
    </g>;
    case 'lobo_guara': return <g>
      <path d="M4.4 9.6 Q4 7.6 2.6 7 L1 7.4 L1.6 6.4 L3 5.6 L3.4 3 L4.6 5.4 L5.6 2.6 L6 5.6 Q7.4 7 7.4 9.6 Q11 9 15 9.6 Q17.4 10 17.6 12 Q18.8 13 19.4 15.6 Q18 14.4 17.4 13.4 L16.6 13.6 L16.8 19.4 H15.8 L15.4 14.4 L14.4 14.6 L14.6 19.4 H13.6 L13 14.6 Q10 15 8 14.4 L7.6 19.4 H6.6 L6.6 14 L5.8 19.4 H4.8 L5 13 Q4.4 11.6 4.4 9.6 Z" fill={cor(LARANJA)} {...C(0.55)} />
      <path d="M5.6 7.6 Q7 9.6 10 9.4 Q8 10.6 6 10.4 Z" fill={tinta} />
      {[[7.2, 17.4], [6.2, 17.4], [16.4, 17.4], [14.2, 17.4]].map(([x, y], k) => <rect key={k} x={x - 0.45} y={y} width={0.9} height={2} fill={tinta} />)}
      <circle cx={3.6} cy={6.4} r={0.3} fill={tinta} /><path d="M1 7.4 l0.4 0.2" {...L(0.4)} />
      <path d="M17.4 13.4 Q18 15 19.4 15.6" fill="none" stroke={cor(BRANCO)} strokeWidth={s(0.5)} />
    </g>;
    case 'tatu_bola': return <g>
      <path d="M2.6 12.4 Q2 4.6 9.4 3.6 Q16.4 3.4 17.4 10.4 Q17.6 12.4 16.6 13 H3.4 Z" fill={cor(TERRA)} {...C(0.6)} />
      {[5.4, 7.6, 9.8, 12, 14.2].map((x, k) => <path key={k} d={`M${x} ${4.4 - (k === 2 ? 0.6 : 0)} Q${x + 0.6} 8.6 ${x - 0.2} 13`} {...L(0.4)} />)}
      {[[6.4, 6], [8.6, 5.6], [11, 5.6], [13.2, 6.4], [6.6, 9.6], [8.8, 9.4], [11, 9.4], [13.2, 9.8]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r={0.3} fill={tinta} />)}
      <path d="M2.6 12.4 Q0.4 12 0.6 10 Q1.2 8.6 2.6 9 Z" fill={cor(AREIA)} {...C(0.45)} /><circle cx={1.6} cy={10.2} r={0.25} fill={tinta} />
      <path d="M1.8 9.2 L1.4 7.8 L2.4 8.6" fill={cor(AREIA)} {...C(0.3)} />
      <path d="M17 11.6 Q19 12 19.4 13.4" {...L(0.6)} /><path d="M5 13 V14.4 M14.6 13 V14.4" {...L(0.7)} />
    </g>;
    case 'mico_leao': { const c = W / 2; return <g>
      <path d={`M0.4 3.4 Q${c} 2 ${W - 0.4} 4.4`} stroke={cor(MARROM)} strokeWidth={s(1)} strokeLinecap="round" /><path d={`M0.4 3.4 Q${c} 2 ${W - 0.4} 4.4`} {...L(0.25)} />
      <path d={`M${c - 2} 3.4 L${c - 3} 5.4 M${c + 2.4} 3.6 L${c + 3} 5.6`} {...L(0.7)} />
      <path d={`M${c} 4 Q${c - 5} 4 ${c - 5} 8.4 Q${c - 4.6} 12 ${c} 12.4 Q${c + 4.6} 12 ${c + 5} 8.4 Q${c + 5} 4 ${c} 4 Z`} fill={cor(LARANJA)} {...C(0.5)} />
      <ellipse cx={c} cy={8.6} rx={2} ry={2.4} fill={cor(TERRA)} {...C(0.4)} />
      <circle cx={c - 0.8} cy={8} r={0.35} fill={tinta} /><circle cx={c + 0.8} cy={8} r={0.35} fill={tinta} /><path d={`M${c - 0.4} 9.8 h0.8`} {...L(0.3)} />
      <path d={`M${c - 2.4} 12 Q${c - 3} 15.6 ${c} 16 Q${c + 3} 15.6 ${c + 2.4} 12`} fill={cor(LARANJA)} {...C(0.45)} />
      <path d={`M${c + 1.6} 15.6 Q${c + 5} 16.6 ${c + 4.4} 19.6`} stroke={cor(LARANJA)} strokeWidth={s(1)} strokeLinecap="round" fill="none" /><path d={`M${c + 1.6} 15.6 Q${c + 5} 16.6 ${c + 4.4} 19.6`} {...L(0.25)} />
    </g>; }
    case 'morcego': return <g>
      <path d="M10 3.4 L9.2 2 L9 4 Q8 4.6 8 6.4 Q6 3.6 3.6 4 Q1.6 2.6 0.4 3 Q1.6 4.6 1.4 6.6 Q2.6 6 3.6 7 Q4.6 6.4 5.6 7.6 Q6.8 7 8.2 8.4 Q9 9.6 10 9.8 Q11 9.6 11.8 8.4 Q13.2 7 14.4 7.6 Q15.4 6.4 16.4 7 Q17.4 6 18.6 6.6 Q18.4 4.6 19.6 3 Q18.4 2.6 16.4 4 Q14 3.6 12 6.4 Q12 4.6 11 4 L10.8 2 Z" fill={tinta} />
      <path d="M3.6 4 L3.6 7 M8 6.4 L5.6 7.6 M16.4 4 L16.4 7 M12 6.4 L14.4 7.6" stroke={cor(BRANCO)} strokeWidth={s(0.2)} opacity={0.7} />
      <circle cx={9.4} cy={5} r={0.25} fill={cor(BRANCO)} /><circle cx={10.6} cy={5} r={0.25} fill={cor(BRANCO)} />
    </g>;
    case 'pinguim': { const c = W / 2; return <g>
      <path d={`M${c} 1 Q${c - 4} 1 ${c - 4.6} 7 Q${c - 6} 15 ${c - 3.6} 18.4 H${c + 3.6} Q${c + 6} 15 ${c + 4.6} 7 Q${c + 4} 1 ${c} 1 Z`} {...L(0.55)} fill={tinta} />
      <path d={`M${c} 5 Q${c - 3} 6 ${c - 3} 11 Q${c - 3} 17 ${c} 17.6 Q${c + 3} 17 ${c + 3} 11 Q${c + 3} 6 ${c} 5 Z`} fill={cor(BRANCO)} />
      <path d={`M${c - 0.8} 4.2 L${c} 5.6 L${c + 0.8} 4.2 Z`} fill={cor(LARANJA)} /><circle cx={c - 1.4} cy={3.2} r={0.35} fill={cor(BRANCO)} /><circle cx={c + 1.4} cy={3.2} r={0.35} fill={cor(BRANCO)} />
      <path d={`M${c - 3} 18.4 l-1 1 h2.6 Z M${c + 3} 18.4 l1 1 h-2.6 Z`} fill={cor(LARANJA)} />
    </g>; }
    case 'peixe_betta': return <g>
      <path d="M2 7.6 Q4 4.6 8 5.4 Q10.4 6 11 7.6 Q10.4 9.6 8 10 Q4 10.6 2 7.6 Z" fill={cor(AZUL)} {...C(0.5)} />
      <path d="M10.6 6.6 Q15 0.6 19.4 2.6 Q16 5.6 19.4 9.6 Q17 13.4 19 15 Q14 14.6 10.6 9 Z" fill={cor(VERMELHO)} opacity={0.75} {...C(0.4)} />
      <path d="M12 7 Q15 5 17.6 4 M12 7.6 Q15.6 7.6 18 8.6 M11.6 8.4 Q14 11 16.6 13" {...L(0.25)} />
      <path d="M5.6 5.4 Q7 1.6 10.6 2 Q9.4 4.4 9 6 Z M5.4 10 Q6 13.4 9.4 14.6 Q8.6 11.6 8.4 9.8 Z" fill={cor(ROXO)} opacity={0.75} {...C(0.35)} />
      <circle cx={3.8} cy={7.2} r={0.45} fill={tinta} /><path d="M5.6 6.6 Q6.4 7.6 5.6 8.6" {...L(0.3)} />
    </g>;
    case 'tartaruga_marinha': { const c = W / 2; return <g>
      <ellipse cx={c} cy={11} rx={5.2} ry={6.6} fill={tinta} opacity={0.12} />
      {Array.from({ length: 130 }, (_, k) => { const a = sorte(k) * Math.PI * 2, r = Math.sqrt(sorte(k + 500)); return <circle key={k} cx={f(c + Math.cos(a) * r * 5)} cy={f(11 + Math.sin(a) * r * 6.2)} r={0.18 + r * 0.08} fill={tinta} />; })}
      <ellipse cx={c} cy={11} rx={5.2} ry={6.6} {...L(0.5)} />
      <path d={`M${c} 5 L${c - 1.8} 8 L${c} 11 L${c + 1.8} 8 Z M${c} 11 L${c - 1.8} 14 L${c} 17 L${c + 1.8} 14 Z M${c - 1.8} 8 L${c - 4.6} 9 M${c + 1.8} 8 L${c + 4.6} 9 M${c - 1.8} 14 L${c - 4.6} 13 M${c + 1.8} 14 L${c + 4.6} 13`} {...L(0.35)} />
      <ellipse cx={c} cy={2.8} rx={1.6} ry={2} {...L(0.45)} /><circle cx={c - 0.7} cy={2.4} r={0.25} fill={tinta} /><circle cx={c + 0.7} cy={2.4} r={0.25} fill={tinta} />
      <path d={`M${c - 4.4} 7 Q${c - 8} 4.6 ${c - 8.6} 7.6 Q${c - 7} 8.4 ${c - 4.8} 8.6 M${c + 4.4} 7 Q${c + 8} 4.6 ${c + 8.6} 7.6 Q${c + 7} 8.4 ${c + 4.8} 8.6 M${c - 3.6} 16 Q${c - 6} 18 ${c - 4.4} 19 M${c + 3.6} 16 Q${c + 6} 18 ${c + 4.4} 19`} {...L(0.45)} />
    </g>; }
    case 'gato_arrepiado': return <g>
      <path d="M2 15.4 L2.6 10.4 Q2 8 3 7 L2.6 4.6 L4.4 6 L5.8 5 L5.8 7.4 Q8 3 12 3.6 Q15.4 4.4 15.6 9 L15.6 15.4 H14.2 L14 11 Q10 12 6.6 11 L5.6 15.4 H4.4 L4.4 11.6 L3.4 15.4 Z" fill={tinta} />
      {[7, 9, 11, 13].map((x, k) => <path key={k} d={`M${x} ${4.4 - (k === 1 || k === 2 ? 0.6 : 0)} l0.6 -1.2 l0.6 1.2`} fill={tinta} />)}
      <path d="M15.4 8 Q17 6 16.4 3 Q16.2 1.4 17.4 0.6 Q18.6 1.4 18 3 Q19.4 6.6 15.6 9.4" fill={tinta} />
      <circle cx={3.6} cy={8} r={0.4} fill={cor(AMARELO)} /><path d="M1.6 9 h1.4 M1.6 9.6 l1.4 -0.2" stroke={cor(BRANCO)} strokeWidth={s(0.15)} />
    </g>;
    case 'ourico': return <g>
      {Array.from({ length: 16 }, (_, k) => { const a = Math.PI + 0.1 + (k / 15) * (Math.PI - 0.3); return <path key={k} d={`M${f(11 + Math.cos(a) * 4.6)} ${f(11 + Math.sin(a) * 4.2)} L${f(11 + Math.cos(a) * 7.6)} ${f(11 + Math.sin(a) * 6.8)}`} {...L(0.3)} />; })}
      <path d="M17 11 Q17.4 6.6 13 5.4 Q8 4.4 5 8 Q2.6 9.6 1 11.4 Q2.6 12.8 5 12.6 Q11 13.6 17 11 Z" {...L(0.4)} />
      <circle cx={1.2} cy={11.4} r={0.45} fill={tinta} /><circle cx={4} cy={10.2} r={0.3} fill={tinta} />
      <path d="M6 12.8 v1.2 M13 12.4 v1.4" {...L(0.35)} />
    </g>;

    /* ================================================================ natureza */
    case 'ipe_amarelo': return <g>
      <path d="M10 19.6 Q10.4 15 9.4 12.4 M9.6 13.4 Q6 11.6 4.4 9 M9.8 12.6 Q12.6 10.6 15.4 8.4 M9.4 12.4 Q9 9 10.2 6.6 M12.4 10.6 Q12.6 8 14.6 6" stroke={cor(MARROM)} strokeWidth={s(0.9)} strokeLinecap="round" fill="none" />
      {Array.from({ length: 42 }, (_, k) => { const a = sorte(k) * Math.PI * 2, r = Math.sqrt(sorte(k + 70)) * 7; return <circle key={k} cx={f(10 + Math.cos(a) * r)} cy={f(7 + Math.sin(a) * r * 0.62)} r={0.65 + sorte(k + 140) * 0.4} fill={cor(AMARELO)} {...C(0.15)} />; })}
      <path d="M6 19.6 H14" {...L(0.4)} />
      {[[5.4, 17.4], [14, 18], [12, 16.6]].map(([x, y], k) => <circle key={`c${k}`} cx={x} cy={y} r={0.45} fill={cor(AMARELO)} {...C(0.15)} />)}
    </g>;
    case 'aurora_boreal': return <g>
      <rect x={0.4} y={0.4} width={19.2} height={H - 0.8} rx={0.6} fill={cor(AZUL)} opacity={0.35} />
      {[[VERDE_CLARO, 0], [TURQUESA, 1.6], [ROXO, 3.2]].map(([c, d], k) => <path key={k} d={`M0.6 ${5.4 + (d as number)} Q5 ${0.6 + (d as number)} 10 ${4.6 + (d as number)} Q15 ${8.6 + (d as number)} 19.4 ${2.6 + (d as number)} V${5.4 + (d as number)} Q15 ${10.6 + (d as number)} 10 ${7 + (d as number)} Q5 ${3.4 + (d as number)} 0.6 ${8 + (d as number)} Z`} fill={cor(c as string)} opacity={0.7} />)}
      {[[2, 12.4], [5, 13], [8, 11.4], [12, 12.6], [15, 11.6], [18, 12.8]].map(([x, y], k) => <path key={`p${k}`} d={`M${x} ${y} L${x - 1.4} ${H - 0.6} H${x + 1.4} Z`} fill={tinta} transform={`translate(0 ${-0.1})`} />)}
      <rect x={0.4} y={0.4} width={19.2} height={H - 0.8} rx={0.6} {...L(0.4)} />
      {[[3, 2], [14, 1.6], [17, 5]].map(([x, y], k) => <circle key={`e${k}`} cx={x} cy={y} r={0.25} fill={cor(BRANCO)} />)}
    </g>;
    case 'floco_de_neve': return <g>
      {[0, 60, 120, 180, 240, 300].map((a, k) => <g key={a} transform={`rotate(${a} 10 10)`}>
        <path d="M10 10 V1" {...L(0.5)} />
        <path d={k % 2 ? 'M10 6 l-2 -2 M10 6 l2 -2 M10 3.4 l-1.2 -1.2 M10 3.4 l1.2 -1.2' : 'M10 7 l-2.4 -1.4 M10 7 l2.4 -1.4 M10 4.4 l-1.4 -1.6 M10 4.4 l1.4 -1.6'} {...L(0.4)} />
        <circle cx={10} cy={1} r={0.4} fill={tinta} />
      </g>)}
      <path d={poligono(10, 10, 1.8, 6, 0)} {...L(0.4)} />
    </g>;
    case 'raio_na_nuvem': { const c = W / 2; return <g>
      <path d={`M2 8.4 Q0.4 8.4 0.6 6.4 Q1 4.6 3 5 Q3 2 6 2 Q7.6 0.6 9.6 1.6 Q12 0.8 13.4 3 Q15.6 3.4 15.4 5.6 Q15.6 8.4 13.4 8.4 Z`} fill={cor(CINZA3)} {...C(0.6)} />
      <path d={`M${c + 1} 8.4 L${c - 2} 13 H${c + 0.6} L${c - 2.2} 19.6 L${c + 4} 11.6 H${c + 1.2} L${c + 3.4} 8.4 Z`} fill={cor(AMARELO)} {...C(0.55)} />
      {[[3, 11], [13.2, 12.4], [4, 15]].map(([x, y], k) => <path key={k} d={`M${x} ${y} l-0.4 1.2`} stroke={cor(CELESTE)} strokeWidth={s(0.4)} strokeLinecap="round" />)}
    </g>; }
    case 'pinha': { const c = W / 2; return <g>
      <path d={`M${c} 4 Q${c + 1.6} 1.4 ${c + 4} 0.8 M${c + 2} 2.4 l1 -2 M${c + 3} 1.6 l1.6 0`} {...L(0.4)} />
      <path d={`M${c} 4 Q${c - 6.4} 6 ${c - 5.6} 12 Q${c - 4.6} 18 ${c} 19.6 Q${c + 4.6} 18 ${c + 5.6} 12 Q${c + 6.4} 6 ${c} 4 Z`} {...L(0.5)} />
      {Array.from({ length: 6 }, (_, r) => Array.from({ length: r % 2 ? 3 : 4 }, (_, k) => { const n = r % 2 ? 3 : 4, x = c + (k - (n - 1) / 2) * 2.8 * (1 - Math.abs(r - 2.5) * 0.12), y = 6 + r * 2.4;
        return <path key={`${r}${k}`} d={`M${f(x - 1.2)} ${f(y)} Q${f(x)} ${f(y + 2.2)} ${f(x + 1.2)} ${f(y)}`} {...L(0.35)} />; }))}
      {Array.from({ length: 6 }, (_, r) => <path key={`h${r}`} d={`M${f(c - 2)} ${f(7.6 + r * 2.4)} l0.6 0.4 M${f(c + 1.4)} ${f(7.6 + r * 2.4)} l0.6 0.4`} {...L(0.2)} opacity={0.6} />)}
    </g>; }
    case 'vitoria_regia': return <g>
      <path d={ondas(0.4, 19.6, H - 1, 0.4, 5)} fill="none" stroke={cor(AZUL)} strokeWidth={s(0.4)} />
      <ellipse cx={8} cy={9.4} rx={7.6} ry={3.4} fill={cor(VERDE)} {...C(0.55)} />
      <ellipse cx={8} cy={9} rx={6.6} ry={2.6} fill={cor(VERDE_CLARO)} {...C(0.3)} />
      {[0, 1, 2, 3, 4, 5, 6, 7].map(k => { const a = (k / 8) * Math.PI * 2; return <path key={k} d={`M8 9 L${f(8 + Math.cos(a) * 6.4)} ${f(9 + Math.sin(a) * 2.5)}`} {...L(0.2)} opacity={0.7} />; })}
      <path d="M15.6 9.4 L13 8.4 L14 10.4 Z" fill={cor(AZUL)} opacity={0.6} />
      <path d="M14 7.2 Q14 4 16 2 Q16.6 4.6 17.4 2.4 Q18.6 4.6 18 7.2 Z" fill={cor(BRANCO)} {...C(0.4)} />
      <path d="M14.6 7.2 Q15.2 5.6 16.6 5 Q17.6 5.8 17.6 7.2 Z" fill={cor(ROSA)} {...C(0.3)} />
      <ellipse cx={16} cy={7.6} rx={2.6} ry={0.6} fill={cor(VERDE)} {...C(0.3)} />
    </g>;
    case 'lago_espelhado': { const c = W / 2; return <g>
      <path d={`M0.6 10 L${c - 3} 2.6 L${c - 1} 5.4 L${c + 1.6} 1 L${W - 0.6} 10 Z`} fill={tinta} />
      <path d={`M${c - 3} 2.6 L${c - 2} 4 L${c - 3.6} 4 Z M${c + 1.6} 1 L${c + 2.8} 3 L${c + 0.6} 3.4 Z`} fill={cor(BRANCO)} />
      <path d={`M0 10.4 H${W}`} {...L(0.4)} />
      {Array.from({ length: 9 }, (_, k) => { const y = 11.4 + k; const t = (y - 10) / 9; const half = (1 - t) * (c - 0.6) * (1 - k * 0.02); return <path key={k} d={`M${f(c + 0.6 - half - (k % 2) * 0.4)} ${f(y)} H${f(c + 0.6 + half + (k % 2) * 0.3)}`} {...L(0.4)} opacity={1 - k * 0.07} />; })}
    </g>; }
    case 'folha_de_bananeira': { const c = W / 2; return <g>
      <path d={`M${c} 0.6 Q${W - 0.4} 5 ${c + 4} 12 L${c + 2.8} 12.6 L${c + 4} 13.6 Q${c + 2} 17.4 ${c} 18 Q${c - 3.8} 15 ${c - 4.6} 9 L${c - 3.4} 8.6 L${c - 4.6} 7.4 Q${c - 4} 2.6 ${c} 0.6 Z`} fill={cor(VERDE)} {...C(0.5)} />
      <path d={`M${c} 1 Q${c + 0.6} 10 ${c} 19.6`} {...L(0.6)} />
      {Array.from({ length: 8 }, (_, k) => <path key={k} d={`M${c} ${3 + k * 1.9} l3.4 -1 M${c} ${3.4 + k * 1.9} l-3.4 -1`} stroke={cor(VERDE_CLARO)} strokeWidth={s(0.25)} />)}
    </g>; }

    /* ================================================================ criaturas e mitos */
    case 'unicornio': { return <g>
      <path d="M13 6 L16.4 0.6 L14.6 6.6" fill={cor(OURO)} {...C(0.4)} /><path d="M13.6 5 l1.6 -0.6 M14 3.8 l1.6 -0.6 M14.6 2.6 l1.2 -0.4" {...L(0.25)} />
      <path d="M3.4 19.6 Q2.4 13 5.6 9.4 Q7.6 6.4 10 5.4 L10.4 3 L12 5 Q14.6 5.4 15.6 8 L16.6 11.6 Q16.6 13 15 12.8 L13 12.2 Q11.6 13.4 11 16 L10.8 19.6 Z" fill={cor(BRANCO)} {...C(0.6)} />
      <path d="M10 5.4 Q6 3.6 3.6 6.4 Q5.4 6.6 4 8.6 Q2 10.6 3 13.4 Q4 11.4 5 12 Q3.6 15.4 4.4 17.6 Q5.4 12 8.4 8.4 Q9.4 6.6 10 5.4 Z" fill={cor(ROXO)} {...C(0.45)} />
      <path d="M8.4 7.4 Q6 9 5 11.4" fill="none" stroke={cor(ROSA)} strokeWidth={s(0.6)} />
      <ellipse cx={12.4} cy={8} rx={0.7} ry={0.5} fill={tinta} /><path d="M15.6 11 l0.4 0.4" {...L(0.4)} />
    </g>; }
    case 'cauda_de_sereia': { const c = W / 2; return <g>
      <path d={`M${c - 2.6} 16 Q${c - 3} 10 ${c - 0.6} 6 Q${c + 1} 3.6 ${c - 1} 2 Q${c + 2.6} 2.8 ${c + 1.6} 6.4 L${c + 3.6} 1 Q${c + 6} 2 ${c + 5.6} 3.6 Q${c + 3.6} 3 ${c + 2.8} 6 Q${c + 2.4} 11 ${c + 2.6} 16`} fill={cor(TURQUESA)} {...C(0.45)} />
      {Array.from({ length: 8 }, (_, k) => <path key={k} d={`M${f(c - 1.6 + (k % 2) * 1.2)} ${f(8 + k)} q0.6 0.6 1.2 0`} {...L(0.2)} />)}
      <path d={ondas(0.4, W - 0.4, 16.4, 0.6, 3)} {...L(0.4)} /><path d={ondas(1.4, W - 1.4, 18.4, 0.4, 3)} {...L(0.3)} />
      <circle cx={c - 4} cy={12} r={0.4} {...L(0.2)} /><circle cx={c - 3.6} cy={10} r={0.3} {...L(0.2)} />
    </g>; }
    case 'minotauro': { const c = W / 2; return <g>
      {[3, 6].map(k => <rect key={k} x={c - 9 + k} y={k - 2.4} width={18 - k * 2} height={20 - k * 2} {...L(0.3)} opacity={0.5} />)}
      <path d={`M${c - 3.6} 6 Q${c - 7.4} 6 ${c - 8.4} 1.4 Q${c - 6} 4 ${c - 3.4} 3.6 M${c + 3.6} 6 Q${c + 7.4} 6 ${c + 8.4} 1.4 Q${c + 6} 4 ${c + 3.4} 3.6`} fill={cor(BRANCO)} {...C(0.5)} />
      <path d={`M${c} 3.4 Q${c - 4.4} 3.4 ${c - 4.4} 8 L${c - 3.4} 14 Q${c} 17.4 ${c + 3.4} 14 L${c + 4.4} 8 Q${c + 4.4} 3.4 ${c} 3.4 Z`} fill={tinta} />
      <path d={`M${c - 4.4} 6.6 L${c - 6.4} 7.4 L${c - 4.2} 8.4 M${c + 4.4} 6.6 L${c + 6.4} 7.4 L${c + 4.2} 8.4`} fill={tinta} />
      <path d={`M${c - 2.8} 8 L${c - 1.2} 8.8 M${c + 2.8} 8 L${c + 1.2} 8.8`} stroke={cor(BRANCO)} strokeWidth={s(0.55)} strokeLinecap="round" />
      <ellipse cx={c} cy={13.4} rx={2.4} ry={1.6} fill={cor(CINZA2)} /><circle cx={c - 0.9} cy={13.4} r={0.4} fill={tinta} /><circle cx={c + 0.9} cy={13.4} r={0.4} fill={tinta} />
      <circle cx={c} cy={15.4} r={1.1} fill="none" stroke={cor(BRANCO)} strokeWidth={s(0.4)} />
    </g>; }
    case 'serpente_marinha': return <g>
      <path d={ondas(0.4, 19.6, H - 1, 0.7, 5)} fill="none" stroke={cor(AZUL)} strokeWidth={s(0.6)} />
      {[[2.6, 3.4], [8, 4.2], [13.4, 4]].map(([x, h], k) => <path key={k} d={`M${x} ${H - 1.6} Q${x} ${H - 1.6 - h * 2} ${x + h / 2 + 0.6} ${H - 1.6 - h * 2} Q${x + h + 1.2} ${H - 1.6 - h * 2} ${x + h + 1.2} ${H - 1.6}`} fill="none" stroke={cor(VERDE)} strokeWidth={s(1.8)} />)}
      {[[2.6, 3.4], [8, 4.2], [13.4, 4]].map(([x, h], k) => <path key={`c${k}`} d={`M${x} ${H - 1.6} Q${x} ${H - 1.6 - h * 2} ${x + h / 2 + 0.6} ${H - 1.6 - h * 2} Q${x + h + 1.2} ${H - 1.6 - h * 2} ${x + h + 1.2} ${H - 1.6}`} {...L(0.3)} />)}
      <path d="M18.6 9.6 Q18.4 5 16 3.4 Q17.8 1.6 19.6 3 L19 4.4 Q19.8 6 18.6 9.6 Z" fill={cor(VERDE)} {...C(0.4)} />
      <path d="M16 3.4 L14 3.6 L16.2 4.6 Z" fill={cor(VERMELHO)} /><circle cx={17.8} cy={2.8} r={0.3} fill={cor(AMARELO)} />
      <path d="M17.4 1.6 L17 0.4 L18.2 1.4 M18.6 2 L19.2 0.8 L19.4 2.4" {...L(0.3)} />
    </g>;
    case 'fenix_pequena': return <g>
      <path d="M10 4 Q8.6 6 9 9 L10 11 L11 9 Q11.4 6 10 4 Z" fill={cor(LARANJA)} {...C(0.45)} />
      <circle cx={10} cy={3.4} r={1.2} fill={cor(LARANJA)} {...C(0.4)} /><path d="M9.4 2.4 L8.8 0.6 L10 2 L10.6 0.4 L10.8 2.4" fill={cor(AMARELO)} {...C(0.3)} />
      <path d="M10 3.6 L8.6 4 L10 4.2 Z" fill={cor(AMARELO)} />
      {[1, -1].map(d => <path key={d} d={`M${10 + d * 0.6} 7 Q${10 + d * 4} 2 ${10 + d * 9.4} 2.4 Q${10 + d * 7.4} 4 ${10 + d * 8.6} 5.4 Q${10 + d * 6.6} 5.6 ${10 + d * 7.6} 7.4 Q${10 + d * 5} 7.4 ${10 + d * 5.4} 9 Q${10 + d * 3} 8.4 ${10 + d * 1} 9.4 Z`} fill={cor(VERMELHO)} {...C(0.45)} />)}
      <path d="M10 11 Q6 13.6 7 19.6 Q8.4 16 10 15.4 Q11.6 16 13 19.6 Q14 13.6 10 11 Z" fill={cor(LARANJA)} {...C(0.45)} />
      <path d="M10 11.6 Q8.6 14 9 17.6 M10 11.6 Q11.4 14 11 17.6" fill="none" stroke={cor(AMARELO)} strokeWidth={s(0.45)} />
    </g>;
    case 'kraken': { const tent = (x: number, d: number, k: number) => { const pts = `M${x} 19.6 Q${x - d * 2.6} 14.6 ${x + d * 0.4} 10.6`, meio = `M${x + d * 0.4} 10.6 Q${x + d * 2.6} 7.6 ${x + d * 1.2} 5.4`;
      return <g key={k}><path d={pts} stroke={tinta} strokeWidth={s(1.5)} strokeLinecap="round" fill="none" /><path d={meio} stroke={tinta} strokeWidth={s(0.9)} strokeLinecap="round" fill="none" />
        <path d={`M${x + d * 1.2} 5.4 Q${x + d * 0.2} 3.6 ${x - d * 0.8} 4.6 Q${x - d * 1.2} 5.8 ${x - d * 0.2} 6`} {...L(0.45)} />
        {[0, 1, 2, 3].map(j => <circle key={j} cx={f(x - d * (0.9 + j * 0.15) + d * (j * 0.25))} cy={f(18.2 - j * 2.2)} r={0.3} fill={cor(BRANCO)} />)}</g>; };
      return <g>
      <path d="M6 9 L14 9 L13 10.8 H7 Z" fill={cor(MARROM)} {...C(0.35)} /><path d="M10 9 V2 M10 2.6 L13.2 7.6 H10 M10 3.4 L7.2 7.6 H10" {...L(0.4)} />
      <path d={ondas(0.4, 19.6, 11.4, 0.6, 5)} {...L(0.45)} />
      {tent(2.4, 1, 0)}{tent(5.6, -1, 1)}{tent(14.4, 1, 2)}{tent(17.6, -1, 3)}
    </g>; }
    case 'olho_de_dragao': { const y = H / 2; return <g>
      {Array.from({ length: 16 }, (_, k) => { const a = (k / 16) * Math.PI * 2; return <path key={k} d={`M${f(10 + Math.cos(a) * 8)} ${f(y + Math.sin(a) * 5.2)} q${f(Math.cos(a + 1.6) * 1.2)} ${f(Math.sin(a + 1.6) * 1.2)} ${f(Math.cos(a) * 1.4)} ${f(Math.sin(a) * 1)}`} {...L(0.4)} />; })}
      <path d={`M2 ${y} Q10 ${y - 7.4} 18 ${y} Q10 ${y + 7.4} 2 ${y} Z`} fill={cor(AMARELO)} {...C(0.6)} />
      <path d={`M2 ${y} Q10 ${y - 7.4} 18 ${y}`} fill="none" stroke={cor(LARANJA)} strokeWidth={s(1)} opacity={0.6} />
      <path d={`M10 ${y - 3.4} Q11.2 ${y} 10 ${y + 3.4} Q8.8 ${y} 10 ${y - 3.4} Z`} fill={tinta} />
      <circle cx={12} cy={y - 1.6} r={0.6} fill={cor(BRANCO)} />
    </g>; }

    /* ================================================================ céu e espaço */
    case 'astronauta_flutuando': { const c = W / 2; return <g>
      <path d={espiral(c - 4, 16, 3.4, 1.6)} {...L(0.3)} />
      <circle cx={c + 0.6} cy={5.2} r={3.8} {...L(0.55)} /><path d={`M${c - 1.4} 4.4 Q${c + 0.6} 2.6 ${c + 3} 4.4 Q${c + 2.4} 7 ${c + 0.6} 7 Q${c - 1.4} 6.6 ${c - 1.4} 4.4 Z`} fill={tinta} opacity={0.75} />
      <path d={`M${c - 2.6} 8.4 Q${c - 3.8} 12 ${c - 2.4} 14.4 H${c + 3.6} Q${c + 4.6} 12 ${c + 3.6} 8.4`} {...L(0.55)} />
      <rect x={c - 1.4} y={10} width={3} height={2} rx={0.3} {...L(0.35)} />
      <path d={`M${c - 2.8} 9.4 L${c - 5.6} 7.6 L${c - 6.2} 5.4 M${c + 3.8} 9.4 L${c + 6} 11.6 L${c + 7.6} 11`} {...L(0.55)} />
      <path d={`M${c - 1.6} 14.4 L${c - 2.6} 18.4 L${c - 1} 19.4 M${c + 2.6} 14.4 L${c + 4.6} 17.6 L${c + 6.6} 17.4`} {...L(0.55)} />
      <path d={`M${c - 2.4} 14.4 Q${c - 4} 15 ${c - 4} 16`} {...L(0.3)} />
      {[[1, 1.6], [W - 1.4, 2.6], [W - 2, 15]].map(([x, y], k) => <path key={k} d={estrela(x, y, 0.7, 4, 0.2)} fill={tinta} />)}
    </g>; }
    case 'foguete': { const c = W / 2; return <g>
      <path d={`M${c} 0.6 Q${c + 4} 4 ${c + 3.4} 13 H${c - 3.4} Q${c - 4} 4 ${c} 0.6 Z`} fill={cor(BRANCO)} {...C(0.6)} />
      <path d={`M${c} 0.6 Q${c + 2.4} 2.4 ${c + 3} 4.4 H${c - 3} Q${c - 2.4} 2.4 ${c} 0.6 Z`} fill={cor(VERMELHO)} {...C(0.45)} />
      <circle cx={c} cy={7.4} r={1.6} fill={cor(CELESTE)} {...C(0.5)} />
      <path d={`M${c - 3.4} 9.6 L${c - 5.6} 14.6 L${c - 3.4} 13 Z M${c + 3.4} 9.6 L${c + 5.6} 14.6 L${c + 3.4} 13 Z`} fill={cor(VERMELHO)} {...C(0.45)} />
      <path d={`M${c - 2.4} 13 Q${c - 3} 17 ${c} 19.6 Q${c + 3} 17 ${c + 2.4} 13 Z`} fill={cor(LARANJA)} {...C(0.45)} />
      <path d={`M${c - 1.2} 13 Q${c - 1.4} 15.6 ${c} 17.4 Q${c + 1.4} 15.6 ${c + 1.2} 13 Z`} fill={cor(AMARELO)} />
    </g>; }
    case 'sistema_solar': { const y = H / 2; return <g>
      <path d={`M0 ${y - 3.2} A3.2 3.2 0 0 1 0 ${y + 3.2}`} fill={cor(AMARELO)} {...C(0.5)} />
      {[[3.8, 0.4], [5.4, 0.6], [7.2, 0.7], [8.8, 0.5], [11.4, 1.6], [15, 1.3], [17.6, 0.9], [19.2, 0.8]].map(([x, r], k) => <g key={k}><circle cx={x} cy={y} r={r} {...L(0.35)} fill={k === 4 || k === 5 ? 'none' : tinta} />{k === 5 && <ellipse cx={x} cy={y} rx={2.2} ry={0.5} {...L(0.3)} transform={`rotate(-14 ${x} ${y})`} />}</g>)}
    </g>; }
    case 'galaxia_espiral': { const cy = H / 2; return <g>
      {Array.from({ length: 220 }, (_, k) => { const braco = k % 2, t = sorte(k) ** 0.8, a = t * 3.6 + braco * Math.PI + (sorte(k + 900) - 0.5) * 0.5, r = 0.6 + t * 8.6;
        return <circle key={k} cx={f(10 + Math.cos(a) * r)} cy={f(cy + Math.sin(a) * r * 0.6)} r={f(0.2 + (1 - t) * 0.3)} fill={tinta} />; })}
      <ellipse cx={10} cy={cy} rx={1.8} ry={1.2} fill={tinta} />
      {[[2, 2], [18, 13.6], [16.6, 2.4]].map(([x, y], k) => <path key={`e${k}`} d={estrela(x, y, 0.7, 4, 0.2)} fill={tinta} />)}
    </g>; }
    case 'eclipse': return <g>
      {noCirculo(10, 10, 0, 24).map(([, , a], k) => <path key={k} d={`M${f(10 + Math.cos(a) * 6.6)} ${f(10 + Math.sin(a) * 6.6)} L${f(10 + Math.cos(a) * (k % 2 ? 8.4 : 9.6))} ${f(10 + Math.sin(a) * (k % 2 ? 8.4 : 9.6))}`} {...L(k % 2 ? 0.35 : 0.5)} />)}
      <circle cx={10} cy={10} r={6} {...L(0.4)} />
      <circle cx={10.6} cy={9.6} r={5.6} fill={tinta} />
    </g>;
  }
  return undefined;
}
