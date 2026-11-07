/**
 * VIDA 13 — A ARTE DA CULTURA POP NOVA (`motor/dados/tatuagens13`). Desenhos ORIGINAIS do estúdio que lembram a obra:
 * o objeto, a arma, o cenário, a criatura, o emblema reinterpretado, uma palavra curta — nunca a arte oficial, o logotipo
 * ou o rosto de um personagem copiado. Caixa nativa (o lado maior mede 20), contorno em `tinta`, cor por `cor`.
 */
import type { ReactNode } from 'react';
import {
  AMARELO, AREIA, atalhos, AZUL, BRANCO, CELESTE, CINZA1, CINZA2, CINZA3, CREME, estrela, espiral, f, LARANJA, LIMAO, MARROM, NEON, noCirculo, ondas, OURO,
  poligono, PRATA, ROSA, ROXO, sorte, TERRA, TURQUESA, VERDE, VERDE_CLARO, VERMELHO, type PincelDaTatuagem13
} from './tatuagens13Base';

export function desenho13Pop(id: string, p: PincelDaTatuagem13): ReactNode | undefined {
  const { tinta, cor, W, H } = p;
  const { s, L, C, pixels, letra } = atalhos(p);
  switch (id) {
    /* ================================================================ videogames */
    case 'estrelas_de_procurado': return <g>
      {[0, 1, 2, 3, 4].map(k => <path key={k} d={estrela(2.2 + k * 3.9, H / 2, 1.85, 5, 0.8)} fill={k < 3 ? cor(BRANCO) : 'none'} {...C(k < 3 ? 0.55 : 0.4)} opacity={k < 3 ? 1 : 0.65} />)}
      {[0, 1, 2].map(k => <path key={`b${k}`} d={estrela(2.2 + k * 3.9, H / 2, 1.85, 5, 0.8)} fill="none" stroke={cor(OURO)} strokeWidth={s(0.25)} transform={`translate(0.25 0.25)`} opacity={0.8} />)}
    </g>;
    case 'palmeiras_ao_por_do_sol': { const y0 = H * 0.62; return <g>
      <circle cx={10} cy={y0} r={7.4} fill={cor(LARANJA)} {...C(0.6)} />
      <path d={`M2.6 ${y0} A7.4 7.4 0 0 1 17.4 ${y0} Z`} fill={cor(ROSA)} opacity={0.75} />
      {[0, 1, 2, 3].map(k => <rect key={k} x={2.6} y={y0 - 4.4 + k * 1.5} width={14.8} height={0.5} fill={cor(ROXO)} opacity={0.45 + k * 0.1} />)}
      <rect x={0.5} y={y0} width={19} height={H - y0 - 0.4} fill={cor(ROXO)} {...C(0.5)} />
      <path d={`M2 ${y0 + 2} H8 M11 ${y0 + 3.2} H18`} stroke={cor(ROSA)} strokeWidth={s(0.5)} strokeLinecap="round" />
      {[[5.4, 1], [14.4, -1]].map(([x, d], k) => <g key={k}>
        <path d={`M${x} ${y0 + 0.2} Q${x + d * 1.6} ${y0 - 5} ${x + d * 0.6} ${y0 - 9.2}`} {...L(0.9)} />
        {[-2.2, -1, 0.3, 1.5, 2.6].map((a, j) => <path key={j} d={`M${x + d * 0.6} ${y0 - 9.2} q${f(Math.cos(a) * 2.2)} ${f(-1.6 + Math.abs(a) * 0.4)} ${f(Math.cos(a) * 4)} ${f(0.6 + Math.abs(a) * 0.6)}`} {...L(0.55)} />)}
      </g>)}
    </g>; }
    case 'missao_cumprida': return <g>
      {letra('MISSÃO', W / 2, H * 0.45, 3.4, { fonte: "Impact, 'Arial Black', sans-serif", peso: 900, larg: 15, fill: cor(AMARELO), contorno: tinta, borda: 0.7 })}
      {letra('CUMPRIDA', W / 2, H * 0.92, 3.4, { fonte: "Impact, 'Arial Black', sans-serif", peso: 900, larg: 18.4, fill: cor(AMARELO), contorno: tinta, borda: 0.7 })}
    </g>;
    case 'vaga_lume': return <g>
      <circle cx={10} cy={12.4} r={6.4} fill={cor(AMARELO)} opacity={0.22} /><circle cx={10} cy={13} r={3.6} fill={cor(AMARELO)} opacity={0.4} />
      <path d="M10 6.4 Q3 1.4 1.8 6.4 Q2.6 10 9.4 8.6 Z M10 6.4 Q17 1.4 18.2 6.4 Q17.4 10 10.6 8.6 Z" fill={cor(BRANCO)} {...C(0.5)} opacity={0.9} />
      <path d="M9.6 8.6 Q4 9.4 4 12.6 Q6.4 13.2 9.6 10.2 Z M10.4 8.6 Q16 9.4 16 12.6 Q13.6 13.2 10.4 10.2 Z" fill={cor(BRANCO)} {...C(0.4)} opacity={0.8} />
      <ellipse cx={10} cy={6} rx={1.2} ry={1.3} fill={tinta} /><path d="M9.4 5 Q8 2.6 6.6 2.4 M10.6 5 Q12 2.6 13.4 2.4" {...L(0.35)} />
      <path d="M8.9 7.2 Q8.6 10 9 11.4 L11 11.4 Q11.4 10 11.1 7.2 Z" fill={cor(MARROM)} {...C(0.45)} />
      <path d="M9 11.4 Q8.6 14.6 10 16.2 Q11.4 14.6 11 11.4 Z" fill={cor(AMARELO)} {...C(0.45)} />
      {[[3.4, 15.6], [16.4, 16.4], [15.4, 10.4], [4, 18.4]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r={0.35} fill={cor(AMARELO)} />)}
    </g>;
    case 'mascara_com_fungo': return <g>
      <path d="M8.5 3 Q2 3 1.8 10 Q1.6 15 5 17 L12 17 Q15.4 15 15.2 10 Q15 3 8.5 3 Z" fill={cor(CINZA2)} {...C(0.7)} />
      <circle cx={5.4} cy={9} r={2.4} fill={cor(CINZA3)} {...C(0.55)} /><circle cx={11.6} cy={9} r={2.4} fill={cor(CINZA3)} {...C(0.55)} />
      <path d="M4.2 7.6 L6.6 10.4 M10.6 7.8 l1 1.4 l-0.6 0.8 l1.4 0.6" {...L(0.3)} />
      <rect x={6} y={13} width={5} height={5.2} rx={1} fill={cor(CINZA1)} {...C(0.5)} /><path d="M6.6 14.6 H10.4 M6.6 16.2 H10.4" {...L(0.3)} />
      <path d="M8.5 13 V11.6" {...L(0.5)} />
      {[[12.4, 4.6, 2.2, TERRA], [14.4, 7.2, 1.5, LARANJA], [3.4, 3.8, 1.4, TERRA], [11.6, 17.4, 1.6, LARANJA]].map(([x, y, r, c], k) => <g key={k}>
        <path d={`M${x as number} ${(y as number) + (r as number) * 1.2} V${y}`} {...L(0.4)} />
        <path d={`M${(x as number) - (r as number)} ${y} Q${x} ${(y as number) - (r as number) * 1.3} ${(x as number) + (r as number)} ${y} Z`} fill={cor(c as string)} {...C(0.4)} />
      </g>)}
      {[0, 1, 2, 3, 4].map(k => <circle key={`e${k}`} cx={f(13 + sorte(k) * 3.6)} cy={f(1.2 + sorte(k + 9) * 3)} r={0.25} fill={tinta} />)}
    </g>;
    case 'machado_runico': return <g>
      <path d={`M${W * 0.55} 3 L${W * 0.55} 19.4`} stroke={cor(MARROM)} strokeWidth={s(1.5)} strokeLinecap="round" />
      <path d={`M${W * 0.55} 3 L${W * 0.55} 19.4`} {...L(0.4)} opacity={0.6} />
      {[12, 13.4, 14.8, 16.2].map((y, k) => <path key={k} d={`M${W * 0.55 - 0.9} ${y} l1.8 0.7`} {...L(0.35)} />)}
      <path d={`M${W * 0.55} 2.4 Q${W * 0.2} 2.4 0.6 1 Q0 6 1.4 11 Q${W * 0.3} 8.4 ${W * 0.55} 8.8 Z`} fill={cor(CINZA3)} {...C(0.65)} />
      <path d={`M${W * 0.55} 3.4 L${W - 0.6} 4.2 L${W - 0.6} 7 L${W * 0.55} 7.6`} fill={cor(CINZA2)} {...C(0.5)} />
      <path d="M1.4 3.4 l1.4 1.6 l-1 1.4 M3.6 3.6 v3 l1.2 -1.2 M2.2 8.2 l1.6 -0.8 l0.4 1.2" fill="none" stroke={cor(CELESTE)} strokeWidth={s(0.45)} strokeLinecap="round" />
      <path d="M0.8 1.4 Q0.2 6 1.4 10.6" fill="none" stroke={cor(CELESTE)} strokeWidth={s(0.35)} opacity={0.8} />
    </g>;
    case 'laminas_acorrentadas': return <g>
      {[1, -1].map(d => { const g = d === 1 ? '' : 'translate(20 0) scale(-1 1)'; return <g key={d} transform={g}>
        <path d="M2 2 Q8 3.4 9.4 9.4 Q7 6.6 3.4 6.4 Q4.6 4.6 2 2 Z" fill={cor(LARANJA)} {...C(0.55)} />
        <path d="M3.2 3.4 Q7.4 4.6 8.4 8" fill="none" stroke={cor(AMARELO)} strokeWidth={s(0.4)} />
        <path d="M9.4 9.4 L10.6 11.4" stroke={cor(CINZA1)} strokeWidth={s(1.4)} strokeLinecap="round" />
      </g>; })}
      {Array.from({ length: 8 }, (_, k) => { const t = k / 7; const x = 10.6 + (4 - 10.6) * t + Math.sin(t * 3) * 1.5, y = 11.4 + (18.6 - 11.4) * t; return <ellipse key={`a${k}`} cx={f(x)} cy={f(y)} rx={0.75} ry={0.45} transform={`rotate(${k % 2 ? 60 : -30} ${f(x)} ${f(y)})`} {...L(0.4)} />; })}
      {Array.from({ length: 8 }, (_, k) => { const t = k / 7; const x = 9.4 + (16 - 9.4) * t - Math.sin(t * 3) * 1.5, y = 11.4 + (18.6 - 11.4) * t; return <ellipse key={`b${k}`} cx={f(x)} cy={f(y)} rx={0.75} ry={0.45} transform={`rotate(${k % 2 ? -60 : 30} ${f(x)} ${f(y)})`} {...L(0.4)} />; })}
    </g>;
    case 'revolver_e_chapeu': return <g>
      <path d="M2.2 7.6 Q3.6 7 4.6 7.4 Q5 2 10 1.8 Q15 2 15.4 7.4 Q16.4 7 17.8 7.6 Q18.6 9.4 10 9.6 Q1.4 9.4 2.2 7.6 Z" fill={cor(MARROM)} {...C(0.6)} />
      <path d="M5.2 6 Q10 7.4 14.8 6" fill="none" stroke={cor(CREME)} strokeWidth={s(0.7)} /><path d="M8.4 2.4 Q10 3.6 11.6 2.4" {...L(0.35)} />
      <path d="M1 11.6 H12.4 L13 12.8 H1.4 Z" fill={cor(CINZA2)} {...C(0.45)} />
      <path d="M11.6 11 H15.4 Q16.4 11.2 16.4 12.6 L15.6 13.6 H12.4 Z" fill={cor(CINZA1)} {...C(0.45)} /><circle cx={14} cy={12.3} r={0.9} fill={cor(CINZA3)} {...C(0.3)} />
      <path d="M15.4 13.4 Q16 15 17.6 15 L18.8 13.2 Q18.4 12 16.4 12" fill={cor(TERRA)} {...C(0.45)} />
      <path d="M13.4 13.6 Q13.2 14.8 14.4 14.8" {...L(0.35)} /><path d="M15.2 11 l0.6 -0.8" {...L(0.4)} />
    </g>;
    case 'cranio_de_boi': { const y = H * 0.36; return <g>
      <circle cx={10} cy={H * 0.62} r={5} {...L(0.35)} opacity={0.5} />
      <path d={`M10 ${H - 1} L8.2 ${y + 5} Q7 ${y + 1} 7.6 ${y - 1} Q10 ${y - 2.2} 12.4 ${y - 1} Q13 ${y + 1} 11.8 ${y + 5} Z`} fill={cor(BRANCO)} {...C(0.6)} />
      <path d={`M7.6 ${y - 0.6} Q3 ${y - 0.6} 1.2 ${y - 4.6} Q2.4 ${y + 1.4} 7.4 ${y + 1.6} M12.4 ${y - 0.6} Q17 ${y - 0.6} 18.8 ${y - 4.6} Q17.6 ${y + 1.4} 12.6 ${y + 1.6}`} fill={cor(BRANCO)} {...C(0.55)} />
      <ellipse cx={8.6} cy={y + 1.2} rx={0.9} ry={1.1} fill={tinta} /><ellipse cx={11.4} cy={y + 1.2} rx={0.9} ry={1.1} fill={tinta} />
      <path d={`M9.3 ${H - 2.6} l0.3 0.8 M10.7 ${H - 2.6} l-0.3 0.8 M10 ${y - 1.4} l0.6 2 l-0.8 1 l0.5 1.6`} {...L(0.3)} />
    </g>; }
    case 'fogueira_com_espada': return <g>
      <path d="M2 18.6 Q7.5 15.4 13 18.6 Z" fill={cor(CINZA1)} {...C(0.5)} />
      {[3.4, 5.4, 9.4, 11.2].map((x, k) => <path key={k} d={`M${x} 18.4 l1.2 -1.6 l1 1.4`} {...L(0.3)} />)}
      <path d="M2.6 17.6 Q1.2 13 3.6 10.4 Q3.4 13 5 13.8 Q4.6 9.6 7.2 6.6 Q7 10.4 9 11.6 Q9.6 8.4 11.4 7.6 Q10.6 11 12.6 13 Q13.6 11.4 13.4 10 Q15 13.8 12.6 17.6 Z" fill={cor(LARANJA)} {...C(0.5)} />
      <path d="M4.6 17.4 Q4 14.4 5.6 13.6 Q6 15.6 7 15.6 Q7.2 12.4 8.6 11.6 Q8.6 14.4 10 15 Q10.6 13.8 11.4 13.6 Q11.8 16 10.8 17.4 Z" fill={cor(AMARELO)} />
      <path d="M8.2 18.2 L6.6 4.4 L7.4 1 L8.4 4.2 L9.4 18" fill={cor(CINZA3)} {...C(0.45)} transform="rotate(12 8 10)" />
      <path d="M5 4.6 L10.6 3.4" stroke={tinta} strokeWidth={s(1)} strokeLinecap="round" transform="rotate(12 8 10)" />
    </g>;
    case 'elmo_de_cavaleiro': return <g>
      <path d="M2.4 19 L2.4 10 Q2.4 3.6 8.5 3.4 Q14.6 3.6 14.6 10 L14.6 19 Q8.5 20 2.4 19 Z" fill={cor(CINZA2)} {...C(0.7)} />
      <path d="M8.5 3.6 V19.4" {...L(0.4)} opacity={0.7} />
      <path d="M2.8 10.2 H14.2" stroke={tinta} strokeWidth={s(1.2)} /><path d="M3.4 10.2 H13.6" stroke={cor(CINZA1)} strokeWidth={s(0.5)} />
      {[13, 14.6, 16.2].map((y, k) => [4.8, 6.4, 10.6, 12.2].map((x, j) => <circle key={`${k}${j}`} cx={x} cy={y} r={0.35} fill={tinta} />))}
      <path d="M6 5 Q5 6.6 6.4 7.4 Q5.6 8.4 6.8 9" {...L(0.3)} />
      <path d="M8.5 3.4 Q9.6 1.6 11.6 1 Q11 2.2 12.6 2.2 Q10.4 3.4 9.4 3.6" fill={cor(VERMELHO)} {...C(0.35)} />
      <path d="M12.2 1.6 l1.8 -1" {...L(0.35)} />
    </g>;
    case 'arvore_dourada': return <g>
      <circle cx={8} cy={8} r={7.6} fill={cor(OURO)} opacity={0.18} />
      <path d="M7.4 19.2 Q7.6 14 6.4 11 Q5 8.6 2.2 7 M7.4 15 Q9.4 11 13.4 9.6 M6.8 12.2 Q6 6 8.2 1.4 M8 7.6 Q10.4 5.2 14 4.6 M6.6 9.4 Q3.8 4.6 1.6 3.6" stroke={cor(OURO)} strokeWidth={s(0.9)} fill="none" strokeLinecap="round" />
      <path d="M7.4 19.2 Q7.6 14 6.4 11 Q5 8.6 2.2 7 M7.4 15 Q9.4 11 13.4 9.6 M6.8 12.2 Q6 6 8.2 1.4 M8 7.6 Q10.4 5.2 14 4.6 M6.6 9.4 Q3.8 4.6 1.6 3.6" {...L(0.3)} />
      {Array.from({ length: 26 }, (_, k) => { const a = sorte(k) * Math.PI * 2, r = 2 + sorte(k + 40) * 5.4; return <circle key={k} cx={f(8 + Math.cos(a) * r)} cy={f(6 + Math.sin(a) * r * 0.75)} r={0.3 + sorte(k + 80) * 0.3} fill={cor(AMARELO)} />; })}
      <path d="M4 19.6 V17.4 L5 16.4 L6 17.4 V19.6 M9.4 19.6 V16.6 L10.4 15.4 L11.4 16.6 V19.6 M3 19.6 H13" fill={cor(CINZA2)} {...C(0.4)} />
    </g>;
    case 'anel_de_runas': return <g>
      <circle cx={10} cy={10} r={7.4} fill="none" stroke={cor(OURO)} strokeWidth={s(2.6)} />
      <circle cx={10} cy={10} r={8.7} {...L(0.5)} /><circle cx={10} cy={10} r={6.1} {...L(0.5)} />
      {noCirculo(10, 10, 7.4, 10).map(([x, y, a], k) => <path key={k} d={`M${f(x - Math.cos(a + 1.57) * 0.6)} ${f(y - Math.sin(a + 1.57) * 0.6)} l${f(Math.cos(a) * 0.5)} ${f(Math.sin(a) * 0.5)} l${f(Math.cos(a + 1.57) * 1.2)} ${f(Math.sin(a + 1.57) * 1.2)}`} {...L(0.35)} />)}
      <path d="M14.6 3.6 L13.2 6 L14.4 6.6 L13.4 8.4" {...L(0.5)} />
      <path d="M14.6 3.6 l2.6 -2.4 M15.2 4.4 l3.4 -1 M14 3.2 l0.6 -3" stroke={cor(AMARELO)} strokeWidth={s(0.45)} strokeLinecap="round" />
    </g>;
    case 'lua_de_sangue_gotica': return <g>
      <circle cx={8} cy={8} r={7} fill={cor(VERMELHO)} {...C(0.5)} opacity={0.9} />
      <circle cx={5.4} cy={6.4} r={1.2} fill={tinta} opacity={0.15} /><circle cx={10.4} cy={10.4} r={1.6} fill={tinta} opacity={0.15} />
      <path d="M0.4 19.6 V13 L1.2 11 L2 13 V14.4 H3 V9.6 L4 6 L5 9.6 V15 H6.2 V12.4 L7 11.2 L7.8 12.4 V14.6 H9 V8 L10.2 3.6 L11.4 8 V13.4 H12.4 V11 L13.4 9 L14.4 11 V16 H15.6 V19.6 Z" fill={tinta} />
      <path d="M4 10.8 v1 M10.2 9.4 v1.2" stroke={cor(AMARELO)} strokeWidth={s(0.5)} />
    </g>;
    case 'cutelo_serrilhado': return <g>
      <path d={`M2.6 1 L6.6 1 L6.6 12.4 L2.6 12.4 Z`} fill={cor(CINZA3)} {...C(0.55)} />
      <path d={'M2.6 1.4 ' + Array.from({ length: 9 }, (_, k) => `L1.2 ${f(2 + k * 1.2)} L2.6 ${f(2.6 + k * 1.2)}`).join(' ')} fill={cor(CINZA2)} {...C(0.4)} />
      <path d="M5.4 1.6 V11.6" {...L(0.3)} opacity={0.5} />
      <circle cx={4.6} cy={12.6} r={0.9} fill={cor(CINZA1)} {...C(0.4)} />
      <path d="M3.6 13.4 L5.6 13.4 L6 19.4 L3.2 19.4 Z" fill={cor(MARROM)} {...C(0.5)} />
      {[14.6, 16, 17.4, 18.6].map((y, k) => <path key={k} d={`M3.4 ${y} l2.4 0.6`} {...L(0.3)} />)}
    </g>;
    case 'bloco_de_grama': return <g>
      <path d="M10 1.6 L18.4 5.8 L10 10 L1.6 5.8 Z" fill={cor(VERDE_CLARO)} />
      <path d="M1.6 5.8 L10 10 V18.4 L1.6 14.2 Z" fill={cor(TERRA)} /><path d="M18.4 5.8 L10 10 V18.4 L18.4 14.2 Z" fill={cor(MARROM)} />
      <path d="M1.6 5.8 L10 10 V12 L8.4 11.4 V12.6 L6.6 11.4 V12.2 L4.8 10.6 V11.6 L3.2 10.2 V9.8 L1.6 8.8 Z" fill={cor(VERDE)} />
      <path d="M18.4 5.8 L10 10 V12 L11.6 11.4 V12.4 L13.4 11.6 V11 L15.2 10.4 V11.4 L16.8 9.6 V9.2 L18.4 8.6 Z" fill={cor(VERDE)} />
      {[[4, 13], [6.6, 15], [3.2, 11.8], [8, 13.6], [12.4, 15.2], [15.4, 12.6], [13.4, 13], [16.6, 14.4]].map(([x, y], k) => <rect key={k} x={x} y={y} width={0.9} height={0.9} fill={tinta} opacity={0.35} />)}
      {[[6, 4.4], [12, 4], [9, 6.6], [14, 6.4]].map(([x, y], k) => <rect key={`g${k}`} x={x} y={y} width={0.9} height={0.9} fill={cor(VERDE)} />)}
      <path d="M10 1.6 L18.4 5.8 V14.2 L10 18.4 L1.6 14.2 V5.8 Z M1.6 5.8 L10 10 L18.4 5.8 M10 10 V18.4" {...L(0.55)} />
    </g>;
    case 'picareta_de_pixels': return <g>{pixels(1, 1, 1.125, [
      '....DDDDD.......',
      '...DCCCCCD......',
      '....DDDCCCD.....',
      '.......DMCCD....',
      '......DMD.DCD...',
      '.....DMD...DCD..',
      '....DMD.....DCD.',
      '...DMD......DCD.',
      '..DMD........DD.',
      '.DMD............',
      'DMD.............',
      'DD..............'
    ].map(l => l.padEnd(16, '.')), { D: tinta, C: cor(CELESTE), M: cor(MARROM) })}</g>;
    case 'erva_no_vaso': { const w = W; return <g>
      <path d={`M${w * 0.18} 13 H${w * 0.82} L${w * 0.72} 19.4 H${w * 0.28} Z`} fill={cor(TERRA)} {...C(0.6)} />
      <rect x={w * 0.14} y={12} width={w * 0.72} height={1.8} rx={0.4} fill={cor(TERRA)} {...C(0.5)} />
      {[[-0.9, 4], [-0.4, 1.6], [0, 0.6], [0.45, 2], [0.9, 4.6], [-0.2, 6]].map(([a, top], k) => {
        const x0 = w / 2, x1 = x0 + a * w * 0.42, y1 = top;
        return <path key={k} d={`M${f(x0)} 12 Q${f(x0 + a * 2)} ${f((12 + y1) / 2)} ${f(x1)} ${f(y1)} Q${f(x0 + a * 4.4 + 1)} ${f((12 + y1) / 2 + 1)} ${f(x0 + 0.4)} 12 Z`} fill={cor(k % 2 ? VERDE : VERDE_CLARO)} {...C(0.4)} />;
      })}
    </g>; }
    case 'maquina_de_escrever': return <g>
      <path d="M5.6 4.4 L6.2 0.6 H13.8 L14.4 4.4" fill={cor(BRANCO)} {...C(0.45)} /><path d="M7.4 1.8 H12.6 M7.4 2.8 H11" {...L(0.25)} opacity={0.6} />
      <rect x={2.4} y={4} width={15.2} height={2} rx={1} fill={cor(CINZA1)} {...C(0.5)} /><circle cx={2.4} cy={5} r={1.2} fill={cor(CINZA2)} {...C(0.4)} /><circle cx={17.6} cy={5} r={1.2} fill={cor(CINZA2)} {...C(0.4)} />
      <path d="M3 6.4 H17 L18.8 13 Q19 14.6 17.4 14.6 H2.6 Q1 14.6 1.2 13 Z" fill={cor(VERDE)} {...C(0.6)} />
      <path d="M6 6.8 Q10 9 14 6.8" fill={cor(CINZA1)} {...C(0.35)} />
      {[0, 1, 2].map(r => Array.from({ length: 8 - r }, (_, k) => <circle key={`${r}${k}`} cx={f(4 + r * 0.7 + k * 1.7)} cy={f(9.4 + r * 1.5)} r={0.55} fill={cor(BRANCO)} {...C(0.25)} />))}
      <rect x={6} y={13.2} width={8} height={0.8} rx={0.4} fill={cor(BRANCO)} {...C(0.25)} />
    </g>;
    case 'lamina_oculta': return <g>
      <path d="M9.6 5.6 H18 L19.8 6.5 L18 7.4 H9.6 Z" fill={cor(CINZA3)} {...C(0.45)} /><path d="M10.4 6.5 H18.6" {...L(0.2)} />
      <path d="M9 1.6 Q11 0.6 13.4 1 Q14.6 1.4 14.4 2.6 Q15.2 3.2 14.6 4 Q15 4.8 14 5.4 L9 5.6 Z" fill={cor(CREME)} {...C(0.45)} />
      <path d="M11.2 1.2 Q12.4 2 11.6 3 M12.8 1 Q14 2.2 13 3.4 M10 4.4 Q12 4.2 13.6 5" {...L(0.25)} />
      <path d="M0.6 1.4 Q5 0.6 9.4 1.2 L9.4 7.2 Q5 7.8 0.6 7 Z" fill={cor(MARROM)} {...C(0.6)} />
      {[3, 6].map((x, k) => <g key={k}><path d={`M${x} 1 V7.4`} {...L(0.45)} /><rect x={x - 0.6} y={3.4} width={1.2} height={1.6} rx={0.2} fill={cor(CINZA2)} {...C(0.3)} /></g>)}
      <rect x={8.6} y={5.2} width={1.4} height={2.6} rx={0.3} fill={cor(CINZA1)} {...C(0.3)} />
    </g>;
    case 'aguia_em_mergulho': return <g>
      <path d="M7.5 19.6 L6 16 Q4.4 12.4 5 8 Q2 6 0.8 1 Q4 4 6.2 5.4 Q6.6 2.6 7.5 0.4 Q8.4 2.6 8.8 5.4 Q11 4 14.2 1 Q13 6 10 8 Q10.6 12.4 9 16 Z" fill={tinta} />
      <path d="M6.4 6.6 Q7.5 7.6 8.6 6.6 M6.6 9 Q7.5 10 8.4 9 M6.8 11.4 Q7.5 12.2 8.2 11.4" fill="none" stroke={cor(BRANCO)} strokeWidth={s(0.3)} opacity={0.9} />
      <path d="M2.2 3 L5.6 6.6 M12.8 3 L9.4 6.6 M3.4 3 l1 -0.4 M11.6 3 l-1 -0.4" fill="none" stroke={cor(BRANCO)} strokeWidth={s(0.25)} opacity={0.8} />
      <path d="M7.5 19.6 L7 18 Q7.5 17.2 8 18 Z" fill={cor(AMARELO)} />
      <circle cx={6.9} cy={16.6} r={0.3} fill={cor(BRANCO)} /><circle cx={8.1} cy={16.6} r={0.3} fill={cor(BRANCO)} />
    </g>;
    case 'medalhao_de_lobo': return <g>
      <path d="M8 0.6 Q3.6 2.4 4 5.4 M8 0.6 Q12.4 2.4 12 5.4" {...L(0.35)} strokeDasharray="0.6 0.4" />
      <circle cx={8} cy={12.2} r={7} fill={cor(PRATA)} {...C(0.7)} /><circle cx={8} cy={12.2} r={6} {...L(0.3)} />
      <path d="M3.4 8 L5.6 9.8 Q8 8.8 10.4 9.8 L12.6 8 L12.2 12 Q13 14 11.4 15.8 L9.6 15.6 L8 18 L6.4 15.6 L4.6 15.8 Q3 14 3.8 12 Z" fill={cor(CINZA2)} {...C(0.5)} />
      <path d="M5 11.6 L7 12.6 M11 11.6 L9 12.6" {...L(0.55)} /><circle cx={6.2} cy={12.1} r={0.35} fill={cor(VERMELHO)} /><circle cx={9.8} cy={12.1} r={0.35} fill={cor(VERMELHO)} />
      <path d="M6.4 15.6 L6.8 16.6 M9.6 15.6 L9.2 16.6 M7 14.4 Q8 15 9 14.4" {...L(0.3)} />
    </g>;
    case 'duas_espadas': return <g>
      {[[1, CINZA3], [-1, PRATA]].map(([d, c], k) => <g key={k} transform={d === -1 ? 'translate(16 0) scale(-1 1)' : undefined}>
        <path d="M1.4 1 L3 1 L12 15 L10.8 15.8 Z" fill={cor(c as string)} {...C(0.45)} />
        <path d="M9.4 16.2 L13.6 13.6" stroke={tinta} strokeWidth={s(1)} strokeLinecap="round" />
        <path d="M12 15.6 L14.4 19.2" stroke={cor(MARROM)} strokeWidth={s(1)} strokeLinecap="round" /><circle cx={14.6} cy={19.4} r={0.6} fill={tinta} />
      </g>)}
      <path d="M2.2 1 L11.4 15.4" stroke={cor(CELESTE)} strokeWidth={s(0.25)} opacity={0.9} transform="translate(16 0) scale(-1 1)" />
    </g>;
    case 'braco_cibernetico': return <g>
      <path d="M2.4 9 H9 L9.4 19.6 H2 Z" fill={cor(CINZA2)} {...C(0.6)} />
      <path d="M2.2 12.6 H9.2 M2.1 16.2 H9.3 M5.7 9 V19.6" {...L(0.3)} />
      {[[3.8, 10.8], [7.6, 14.4], [3.8, 17.8]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r={0.5} fill={cor(NEON)} />)}
      <path d="M3 12.6 V16.2 M8.2 16.2 V18.6" fill="none" stroke={cor(CELESTE)} strokeWidth={s(0.5)} strokeLinecap="round" />
      <path d="M2 9 Q1 6.4 2.2 4.4 L3 4.4 Q2.6 6.6 3.4 7.6 M3.4 7.6 L3.6 1.6 Q4.4 1 5 1.6 L5 6.4 M5 6.4 L5.4 0.8 Q6.2 0.2 6.8 0.8 L6.6 6.4 M6.6 6.4 L7.4 1.4 Q8.2 1 8.6 1.6 L8.2 6.8 M8.2 6.8 L9.6 3.6 Q10.4 3.4 10.6 4.2 L9 9" fill={cor(CINZA3)} {...C(0.45)} />
      {[[4.3, 3.6], [6, 3], [7.8, 3.6], [4.3, 5.4], [6, 5], [7.8, 5.4]].map(([x, y], k) => <circle key={`j${k}`} cx={x} cy={y} r={0.35} fill={cor(NEON)} />)}
    </g>;
    case 'chip_neon': return <g>
      <rect x={5} y={5} width={10} height={10} rx={1} fill={cor(CINZA1)} {...C(0.6)} />
      <rect x={7.4} y={7.4} width={5.2} height={5.2} fill="none" stroke={cor(NEON)} strokeWidth={s(0.5)} />
      {[6.4, 8.8, 11.2, 13.6].map((v, k) => <g key={k}><path d={`M${v} 5 V1 M${v} 15 V19 M5 ${v} H1 M15 ${v} H19`} {...L(0.4)} /><circle cx={v} cy={1} r={0.45} fill={cor(CELESTE)} /><circle cx={19} cy={v} r={0.45} fill={cor(NEON)} /><circle cx={v} cy={19} r={0.45} fill={cor(NEON)} /><circle cx={1} cy={v} r={0.45} fill={cor(CELESTE)} /></g>)}
      <path d="M8.4 10 H11.6 M10 8.4 V11.6" stroke={cor(CELESTE)} strokeWidth={s(0.5)} strokeLinecap="round" />
    </g>;
    case 'aneis_dourados': { const y = H / 2; return <g>
      <ellipse cx={4} cy={y} rx={3.2} ry={3.4} fill="none" stroke={cor(OURO)} strokeWidth={s(1.3)} /><ellipse cx={4} cy={y} rx={3.2} ry={3.4} {...L(0.3)} />
      <ellipse cx={10} cy={y} rx={1.4} ry={3.4} fill="none" stroke={cor(OURO)} strokeWidth={s(1.1)} /><ellipse cx={10} cy={y} rx={1.4} ry={3.4} {...L(0.3)} />
      <ellipse cx={16} cy={y} rx={3.2} ry={3.4} fill="none" stroke={cor(OURO)} strokeWidth={s(1.3)} /><ellipse cx={16} cy={y} rx={3.2} ry={3.4} {...L(0.3)} />
      <path d={estrela(17.6, y - 2.6, 1, 4, 0.25)} fill={cor(BRANCO)} /><path d={estrela(2.6, y + 2.2, 0.7, 4, 0.2)} fill={cor(BRANCO)} />
    </g>; }
    case 'tenis_veloz': return <g>
      {[3, 5.4, 7.8].map((y, k) => <path key={k} d={`M0.4 ${y} H${4 - k * 0.6}`} {...L(0.45)} />)}
      <path d="M5 4 Q6 1.4 9.4 2 L12 5 Q16 5.2 18.6 7.4 Q19.6 9 18.6 9.6 H5.4 Q4.4 7 5 4 Z" fill={cor(VERMELHO)} {...C(0.6)} />
      <path d="M8.6 3.4 L11.4 6.4 Q13 7.6 14.4 6.6" fill="none" stroke={cor(BRANCO)} strokeWidth={s(1.1)} />
      <rect x={7.4} y={4.6} width={2.4} height={1.4} rx={0.3} fill={cor(OURO)} {...C(0.3)} transform="rotate(30 8.6 5.3)" />
      <path d="M4.6 9.6 H19 Q19.4 11.4 17.4 11.4 H5.4 Q4.4 11.2 4.6 9.6 Z" fill={cor(BRANCO)} {...C(0.5)} />
    </g>;
    case 'pecas_caindo': { const q = 2.3; const b = (x: number, y: number, c: string, k: string) => <rect key={k} x={f(x * q + 0.4)} y={f(y * q + 0.6)} width={q} height={q} fill={cor(c)} {...C(0.4)} />; return <g>
      {[[1, 0], [2, 0], [1, 1], [2, 1]].map(([x, y], k) => b(x + 1, y, AMARELO, `o${k}`))}
      {[[0, 4], [0, 5], [0, 6], [1, 6]].map(([x, y], k) => b(x, y, LARANJA, `l${k}`))}
      {[[1, 7], [2, 7], [3, 7], [4, 7]].map(([x, y], k) => b(x, y, CELESTE, `i${k}`))}
      {[[2, 5], [3, 5], [3, 6], [4, 6]].map(([x, y], k) => b(x, y, VERMELHO, `z${k}`))}
      {[[1, 4], [1, 5], [2, 6], [5, 7]].map(([x, y], k) => b(x, y, k === 3 ? VERDE : ROXO, `t${k}`))}
      <path d={`M${f(2.5 * q + 0.4)} ${f(2 * q + 0.9)} v1.8 M${f(3.5 * q + 0.4)} ${f(2 * q + 0.9)} v1.2`} {...L(0.35)} strokeDasharray="0.4 0.5" />
    </g>; }
    case 'espada_no_pedestal': { const c = W / 2; return <g>
      <path d={`M${c - 1} 1 L${c + 1} 1 L${c + 1.1} 12.6 L${c} 14 L${c - 1.1} 12.6 Z`} fill={cor(CINZA3)} {...C(0.45)} transform="translate(0 0)" />
      <path d={`M${c} 1.6 V12.4`} {...L(0.25)} />
      <path d={`M${c - 1} 1 Q${c - 4.6} 0.4 ${c - 5} 2.8 Q${c - 2.6} 2.4 ${c - 1} 3.2 Z M${c + 1} 1 Q${c + 4.6} 0.4 ${c + 5} 2.8 Q${c + 2.6} 2.4 ${c + 1} 3.2 Z`} fill={cor(AZUL)} {...C(0.4)} transform="translate(0 0)" />
      <circle cx={c} cy={1.8} r={0.6} fill={cor(AMARELO)} {...C(0.25)} />
      <path d={`M${c - 0.7} 1 V-1`} stroke={tinta} strokeWidth={s(0)} />
      <path d={`M0.6 19.6 L1.4 14.6 L${W - 1.4} 14.6 L${W - 0.6} 19.6 Z`} fill={cor(CINZA2)} {...C(0.55)} />
      <path d={`M1 17 H${W - 1} M${c - 2} 14.6 L${c - 2.4} 17 M${c + 2.6} 17 L${c + 2.2} 19.6`} {...L(0.3)} />
      <path d={`M${c - 1.6} 14.6 L${c} 13.2 L${c + 1.6} 14.6`} fill={tinta} />
    </g>; }
    case 'flor_de_fogo': { const c = W / 2; return <g>
      <path d={`M${c} 10 V19.6`} stroke={cor(VERDE)} strokeWidth={s(1.2)} /><path d={`M${c} 10 V19.6`} {...L(0.3)} />
      <path d={`M${c} 16 Q${c - 4.4} 12.6 ${c - 6.6} 14.8 Q${c - 3.6} 17.6 ${c} 16 Z M${c} 14.4 Q${c + 4.4} 11 ${c + 6.6} 13.2 Q${c + 3.6} 16 ${c} 14.4 Z`} fill={cor(VERDE)} {...C(0.45)} />
      {[0, 1, 2, 3, 4, 5].map(k => <path key={k} transform={`rotate(${k * 60} ${c} 6)`} d={`M${c} 6 Q${c - 2.6} 3.6 ${c - 0.8} 0.6 Q${c - 0.2} 2 ${c + 0.4} 1.6 Q${c + 2.2} 3.4 ${c} 6 Z`} fill={cor(k % 2 ? VERMELHO : LARANJA)} {...C(0.4)} />)}
      <circle cx={c} cy={6} r={2.2} fill={cor(AMARELO)} {...C(0.45)} />
      {[[c - 0.8, 5.4], [c + 0.8, 5.6], [c, 6.8]].map(([x, y], k) => <circle key={`s${k}`} cx={x} cy={y} r={0.3} fill={tinta} />)}
    </g>; }
    case 'bloco_e_moeda': return <g>
      <ellipse cx={10} cy={4.4} rx={2.6} ry={3.6} fill={cor(OURO)} {...C(0.55)} /><rect x={9.4} y={2.4} width={1.2} height={4} rx={0.3} fill={cor(AMARELO)} {...C(0.3)} />
      <path d="M6.4 2.4 l-1.2 -1 M13.6 2.4 l1.2 -1 M6 5 h-1.4 M14 5 h1.4" {...L(0.35)} />
      <rect x={1.6} y={9.4} width={16.8} height={10} fill={cor(TERRA)} {...C(0.7)} />
      {[0, 1, 2].map(r => <path key={r} d={`M1.6 ${f(9.4 + (r + 1) * 3.33)} H18.4`} {...L(0.4)} />)}
      {[0, 1, 2].map(r => [0, 1, 2, 3].map(k => <path key={`${r}${k}`} d={`M${f(1.6 + (k + (r % 2 ? 0.5 : 1)) * 4.2)} ${f(9.4 + r * 3.33)} v3.33`} {...L(0.4)} />))}
      <path d="M2.4 10.2 H17.6" stroke={cor(CREME)} strokeWidth={s(0.4)} opacity={0.6} />
    </g>;
    case 'insignias_de_ginasio': { const y = H / 2; return <g>
      <path d={poligono(2.6, y, 2.2, 8, -Math.PI / 8)} fill={cor(CINZA2)} {...C(0.5)} /><path d={poligono(2.6, y, 1.1, 8, -Math.PI / 8)} fill={cor(CINZA3)} {...C(0.3)} />
      <path d={`M7.6 ${y + 2.4} Q5.4 ${y + 1.4} 7.6 ${y - 2.6} Q9.8 ${y + 1.4} 7.6 ${y + 2.4} Z`} fill={cor(CELESTE)} {...C(0.5)} />
      <path d={`M12.6 ${y - 2.6} L14.4 ${y - 0.4} L13 ${y - 0.4} L14.6 ${y + 2.6} L11 ${y - 0.2} L12.4 ${y - 0.2} L11.4 ${y - 2.6} Z`} fill={cor(AMARELO)} {...C(0.45)} />
      <path d={`M17.6 ${y + 2.6} Q15 ${y} 17.6 ${y - 2.6} Q20.2 ${y} 17.6 ${y + 2.6} Z`} fill={cor(VERDE_CLARO)} {...C(0.5)} /><path d={`M17.6 ${y + 2.4} V${y - 1.6}`} {...L(0.3)} />
    </g>; }

    /* ================================================================ livros */
    case 'caneta_espada': { const c = W / 2; return <g>
      <path d={`M${c - 1.2} 0.6 L${c + 1.2} 0.6 L${c + 1.4} 10 L${c} 11.4 L${c - 1.4} 10 Z`} fill={cor(OURO)} {...C(0.45)} />
      <path d={`M${c} 1 V10.6`} {...L(0.25)} />
      {[[c - 3.4, 4], [c + 3.2, 6.2], [c - 2.8, 8.6]].map(([x, y], k) => <path key={k} d={estrela(x, y, 1, 4, 0.25)} fill={cor(CELESTE)} />)}
      <rect x={c - 3} y={11.4} width={6} height={1.2} rx={0.5} fill={tinta} />
      <path d={`M${c - 1.1} 12.6 L${c + 1.1} 12.6 L${c + 1} 18.4 Q${c} 19.8 ${c - 1} 18.4 Z`} fill={cor(AZUL)} {...C(0.45)} />
      <path d={`M${c + 1.1} 13.2 Q${c + 2.4} 13.4 ${c + 2.2} 16 L${c + 1.6} 16`} {...L(0.4)} />
    </g>; }
    case 'tridente_nas_ondas': { const c = W / 2; return <g>
      <path d={`M${c} 4 V17`} stroke={cor(OURO)} strokeWidth={s(1)} /><path d={`M${c} 4 V17`} {...L(0.3)} />
      <path d={`M${c - 4.4} 1.6 L${c - 4} 6 Q${c} 8.4 ${c + 4} 6 L${c + 4.4} 1.6`} fill="none" stroke={cor(OURO)} strokeWidth={s(1)} />
      <path d={`M${c - 4.4} 1.6 L${c - 4} 6 Q${c} 8.4 ${c + 4} 6 L${c + 4.4} 1.6`} {...L(0.3)} />
      <path d={`M${c - 5.2} 2.6 L${c - 4.4} 0.4 L${c - 3.6} 2.6 Z M${c + 3.6} 2.6 L${c + 4.4} 0.4 L${c + 5.2} 2.6 Z M${c - 0.8} 3.6 L${c} 0.6 L${c + 0.8} 3.6 Z`} fill={tinta} />
      <path d={`M0.4 15.4 Q2 13.4 3.6 15 Q5 12.6 7 14.6 Q8.6 12.8 10.2 15 Q11 14 11.6 14.6 V19.6 H0.4 Z`} fill={cor(TURQUESA)} {...C(0.5)} />
      <path d={ondas(0.8, 11.2, 17.4, 0.6, 3)} fill="none" stroke={cor(BRANCO)} strokeWidth={s(0.4)} />
    </g>; }
    case 'verme_da_areia': return <g>
      <path d="M0.4 19.6 Q4 15.6 8.5 16 Q13 15.6 16.6 19.6 Z" fill={cor(AREIA)} {...C(0.5)} />
      <path d="M2.6 17.4 Q2 9 4 4.6 Q8.5 0.4 13 4.6 Q15 9 14.4 17.4 Z" fill={cor(TERRA)} {...C(0.6)} />
      {[7, 9.8, 12.6, 15.2].map((y, k) => <path key={k} d={`M${3 - k * 0.1} ${y} Q8.5 ${y + 1.2} ${14 + k * 0.1} ${y}`} {...L(0.35)} />)}
      <ellipse cx={8.5} cy={5.2} rx={4.4} ry={3} fill={tinta} />
      {noCirculo(8.5, 5.2, 3.6, 14).map(([x, y, a], k) => <path key={k} d={`M${x} ${f(5.2 + (y - 5.2) * 0.72)} L${f(8.5 + Math.cos(a) * 2.6)} ${f(5.2 + Math.sin(a) * 2.6 * 0.72)}`} stroke={cor(BRANCO)} strokeWidth={s(0.35)} strokeLinecap="round" />)}
      {[[1, 13], [15.6, 12], [16, 15]].map(([x, y], k) => <circle key={`a${k}`} cx={x} cy={y} r={0.3} fill={cor(AREIA)} />)}
    </g>;
    case 'duas_luas_no_deserto': return <g>
      <circle cx={13.4} cy={4.6} r={3.4} fill={cor(CREME)} {...C(0.5)} /><circle cx={5.2} cy={3} r={1.4} fill={cor(CREME)} {...C(0.45)} />
      <circle cx={12.4} cy={3.8} r={0.6} fill={tinta} opacity={0.2} /><circle cx={14.4} cy={5.8} r={0.8} fill={tinta} opacity={0.2} />
      <path d={`M0.4 10 Q5 6.6 9.4 9.4 Q14 7 19.6 9.6 V${H - 0.4} H0.4 Z`} fill={cor(AREIA)} {...C(0.5)} />
      <path d={`M0.4 ${H - 1.2} Q6 9.6 12.6 ${H - 1.6} Q16 11 19.6 11.6`} {...L(0.4)} />
      <path d={`M9.4 9.4 Q8.6 10.4 9 ${H - 0.6}`} {...L(0.3)} opacity={0.6} />
    </g>;
    case 'cachimbo_e_lupa': return <g>
      <path d="M1.4 11.4 Q6 13 9.6 11.2 L10.4 9.4 L12.4 9.4 L12.6 13 Q12.4 15.4 9.8 15 Q8 14.6 7.8 13.6 Q4 13.6 1 12.4 Z" fill={cor(MARROM)} {...C(0.55)} />
      <ellipse cx={11.4} cy={9.4} rx={1.1} ry={0.4} fill={tinta} />
      <path d="M11.4 8.4 Q10 6.6 11.6 5 Q13 3.4 11.6 1.6" fill="none" stroke={cor(CINZA3)} strokeWidth={s(0.7)} strokeLinecap="round" />
      <circle cx={15.4} cy={6.6} r={3.4} fill={cor(CELESTE)} opacity={0.35} /><circle cx={15.4} cy={6.6} r={3.4} {...L(0.8)} />
      <path d="M13.6 4.8 Q14.6 3.8 16 4" fill="none" stroke={cor(BRANCO)} strokeWidth={s(0.5)} strokeLinecap="round" />
      <path d="M13 9.2 L9.6 14.6" stroke={cor(MARROM)} strokeWidth={s(1.2)} strokeLinecap="round" transform="translate(5.6 0.4)" />
    </g>;
    case 'chapeu_de_detetive': return <g>
      <path d="M3 9.6 Q3 2 10 2 Q17 2 17 9.6 Z" fill={cor(TERRA)} {...C(0.6)} />
      {[5.4, 8, 10.6, 13.2, 15.4].map((x, k) => <path key={k} d={`M${x} ${k === 0 || k === 4 ? 4.8 : 2.4} V9.4`} stroke={cor(MARROM)} strokeWidth={s(0.35)} />)}
      {[4.4, 6.8].map((y, k) => <path key={`h${k}`} d={`M${3.4 + (1 - k) * 1} ${y} H${16.6 - (1 - k) * 1}`} stroke={cor(MARROM)} strokeWidth={s(0.35)} />)}
      <path d="M0.6 10.4 Q3 9 10 9.6 Q17 9 19.4 10.4 Q17 12.4 10 12 Q3 12.4 0.6 10.4 Z" fill={cor(TERRA)} {...C(0.55)} />
      <path d="M4.4 4 Q6 1.4 8.4 1.8 M15.6 4 Q14 1.4 11.6 1.8" {...L(0.4)} /><path d="M9.4 1.6 Q10 0.4 10.6 1.6 Q10 2.4 9.4 1.6 Z" fill={tinta} />
    </g>;
    case 'elementar': { const y = H * 0.72; return <g>
      {letra('Elementar', 8.6, y, 4.2, { fonte: "'Courier New', Courier, monospace", peso: 700, larg: 16 })}
      <circle cx={18.2} cy={y - 1} r={1} {...L(0.4)} /><path d={`M18.9 ${y - 0.3} l0.9 0.9`} {...L(0.5)} />
    </g>; }
    case 'planeta_com_rosa': return <g>
      <circle cx={10} cy={13} r={6.4} fill={cor(AREIA)} {...C(0.6)} />
      <path d="M5 10.6 L6 8.6 L7 10.4 M13.4 9.6 L14.4 7.8 L15.4 9.8" fill={cor(TERRA)} {...C(0.4)} />
      <path d="M6 8.6 q0.4 -1 0 -2 M14.4 7.8 q-0.4 -1 0 -1.8" {...L(0.3)} opacity={0.6} />
      <path d="M8 7.6 Q8 3 10.4 3 Q12.8 3 12.8 7.6 Z" fill={cor(CELESTE)} opacity={0.3} /><path d="M8 7.6 Q8 3 10.4 3 Q12.8 3 12.8 7.6 Z" {...L(0.35)} />
      <path d="M10.4 7.4 V5.6" stroke={cor(VERDE)} strokeWidth={s(0.4)} /><circle cx={10.4} cy={5.1} r={0.8} fill={cor(VERMELHO)} {...C(0.3)} />
      <path d="M7.6 7.6 H13.2" {...L(0.45)} />
      {[[2, 3], [17, 2.4], [3.4, 15.6], [18, 12.4], [15.4, 18.6]].map(([x, y], k) => <path key={k} d={estrela(x, y, 0.8, 5, 0.32)} fill={cor(AMARELO)} {...C(0.2)} />)}
    </g>;
    case 'chapeu_ou_jiboia': { const y = H * 0.82; return <g>
      <path d={`M0.6 ${y} Q3 ${y - 0.6} 5 ${y - 3} Q7.4 ${y - 7.6} 11 ${y - 7.6} Q14.4 ${y - 7.4} 15.6 ${y - 3.4} Q17.4 ${y - 0.6} 19.4 ${y}`} {...L(0.7)} fill={cor(BRANCO)} />
      <path d={`M0.6 ${y} H19.4`} {...L(0.7)} />
      <path d={`M7 ${y - 3} Q8.4 ${y - 5.4} 10.6 ${y - 5.2}`} {...L(0.3)} strokeDasharray="0.5 0.5" opacity={0.6} />
    </g>; }
    case 'moinho_e_lanca': return <g>
      <path d="M6 19.4 L7.6 9 H11.4 L13 19.4 Z" fill={cor(CREME)} {...C(0.6)} /><path d="M7.4 9 L9.5 6.6 L11.6 9" fill={cor(TERRA)} {...C(0.5)} />
      <rect x={8.6} y={15.4} width={1.8} height={4} fill={tinta} />
      {[45, 135, 225, 315].map(a => <g key={a} transform={`rotate(${a} 9.5 8.4)`}><path d="M9.5 8.4 V1" {...L(0.4)} /><rect x={9.7} y={1.6} width={2} height={6} fill={cor(BRANCO)} {...C(0.35)} /><path d="M10.7 1.6 V7.6 M9.7 3.6 H11.7 M9.7 5.6 H11.7" {...L(0.2)} /></g>)}
      <circle cx={9.5} cy={8.4} r={0.7} fill={tinta} />
      <path d="M0.2 19.8 L5 12.4" stroke={cor(MARROM)} strokeWidth={s(0.7)} strokeLinecap="round" /><path d="M4.6 13 L6.2 10.6 L5.4 13.4 Z" fill={cor(CINZA2)} {...C(0.3)} />
      <path d={`M13 19.4 H16.8`} {...L(0.4)} />
    </g>;
    case 'baleia_branca_e_arpao': return <g>
      <path d={ondas(0.4, 19.6, H - 1.6, 0.8, 5)} fill="none" stroke={cor(AZUL)} strokeWidth={s(0.6)} />
      <path d="M1.6 9.6 Q2.4 3.6 9 3 Q14.6 2.6 16.4 5.6 L18.6 3 L19.2 6.4 L17 8 Q14 10.4 8 10.6 Q3 10.6 1.6 9.6 Z" fill={cor(BRANCO)} {...C(0.65)} />
      <path d="M2.4 8.4 Q5 9.4 8 8.4" {...L(0.35)} /><circle cx={4.4} cy={6.6} r={0.35} fill={tinta} />
      <path d="M8 4.6 l1 1.6 M10.6 4 l0.4 1.8 M12.6 4.4 l1 1" {...L(0.25)} opacity={0.6} />
      <path d="M7 10.6 Q8.4 12.4 10 11" {...L(0.4)} />
      <path d="M15.4 0.6 L11.4 6" {...L(0.5)} /><path d="M11.4 6 L12 4.4 L12.8 5.6 Z" fill={tinta} />
      <path d="M15.4 0.6 Q18 1.4 17.2 3.4 Q16 5 18.4 6" {...L(0.25)} strokeDasharray="0.4 0.3" />
    </g>;
    case 'relogio_do_coelho': { const c = W / 2; return <g>
      <path d={`M${c - 1.2} 4 Q${c - 3.6} -0.4 ${c - 2.6} 0.4 Q${c - 1} 1.6 ${c - 0.4} 4 M${c + 1.2} 4 Q${c + 3.6} -0.4 ${c + 2.6} 0.4 Q${c + 1} 1.6 ${c + 0.4} 4`} fill={cor(BRANCO)} {...C(0.45)} />
      <circle cx={c} cy={4.6} r={1.1} fill={cor(OURO)} {...C(0.4)} />
      <circle cx={c} cy={12.2} r={6.8} fill={cor(OURO)} {...C(0.65)} /><circle cx={c} cy={12.2} r={5.6} fill={cor(CREME)} {...C(0.4)} />
      {noCirculo(c, 12.2, 4.8, 12).map(([x, y], k) => <circle key={k} cx={x} cy={y} r={k % 3 ? 0.18 : 0.35} fill={tinta} />)}
      <path d={`M${c} 12.2 L${c} 8.4 M${c} 12.2 L${c + 3} 10.6`} {...L(0.5)} />
      <path d={`M${c - 3} 14.4 l0.8 0.8 l-0.4 1`} {...L(0.25)} />
    </g>; }
    case 'xicara_e_cartas': return <g>
      <path d="M3 10 H14 Q14 17.6 8.5 17.6 Q3 17.6 3 10 Z" fill={cor(BRANCO)} {...C(0.6)} />
      <path d="M14 11.4 Q17 11.2 16.6 13.4 Q16.2 15.2 13.4 15" {...L(0.6)} />
      <path d="M1 18 Q8.5 20 16 18" {...L(0.6)} /><path d="M6 11.6 l1.2 2 l-0.6 1.4 l1 1.6" {...L(0.3)} />
      <path d="M3.4 10 Q8.5 11 13.6 10" fill={cor(TERRA)} opacity={0.6} />
      {[[5.6, 2.6, -24, VERMELHO, '♥'], [10.4, 1.4, 8, CINZA1, '♠'], [15, 4.2, 30, VERMELHO, '♦']].map(([x, y, r, c, n], k) => <g key={k} transform={`rotate(${r} ${(x as number) + 1.6} ${(y as number) + 2.2})`}>
        <rect x={x as number} y={y as number} width={3.2} height={4.4} rx={0.4} fill={cor(BRANCO)} {...C(0.4)} />
        <text x={(x as number) + 1.6} y={(y as number) + 3} textAnchor="middle" fontSize={2.2} fill={cor(c as string)}>{n}</text>
      </g>)}
    </g>;
    case 'castelo_e_morcegos': return <g>
      <circle cx={11} cy={5.4} r={4.2} fill={cor(CREME)} {...C(0.45)} />
      <path d="M0.4 19.6 L4 13 L6.6 14.6 L10 9 L13 13.4 L16.6 11 V19.6 Z" fill={cor(CINZA1)} />
      <path d="M5.6 13.4 V8.4 L6.6 6.4 L7.6 8.4 V10 H9 V6 L10.2 3.6 L11.4 6 V10.4 H12.4 V8 L13.2 6.8 L14 8 V13.4 Z" fill={tinta} />
      <rect x={10} y={7} width={0.6} height={1} fill={cor(AMARELO)} />
      {[[2.6, 3.4, 1], [5, 1.6, 0.8], [15, 2.4, 0.7]].map(([x, y, k], j) => <path key={j} d={`M${x} ${y} q${k} -0.8 ${2 * (k as number)} 0 q${0.4 * (k as number)} -0.6 ${k} 0 q-${0.4 * (k as number)} 0.2 -${k} 0.8 q-${0.4 * (k as number)} -0.6 -${2 * (k as number)} -0.8 Z`} fill={tinta} transform={`translate(-${k} 0)`} />)}
    </g>;
    case 'plataforma_secreta': return <g>
      {[0, 1, 2, 3, 4, 5].map(r => Array.from({ length: 5 }, (_, k) => <rect key={`${r}${k}`} x={f(0.4 + k * 4 - (r % 2 ? 2 : 0))} y={f(0.4 + r * 2.4)} width={4} height={2.4} fill={cor(TERRA)} stroke={tinta} strokeWidth={s(0.25)} />))}
      <rect x={4} y={3} width={12} height={5.4} rx={0.6} fill={cor(VERMELHO)} {...C(0.5)} />
      {letra('9¾', 10, 7.4, 4.4, { fill: cor(BRANCO), fonte: "Georgia, serif" })}
      <path d="M3.6 15.4 H11 L12 11 H13.4" {...L(0.5)} /><rect x={4.2} y={11.4} width={6} height={3.4} rx={0.4} fill={cor(MARROM)} {...C(0.4)} />
      <circle cx={5} cy={15.4} r={0} /><circle cx={4.6} cy={15} r={0} />
    </g>;
    case 'espada_partida': { const c = W / 2; return <g>
      <path d={`M${c - 1.2} 13 L${c + 1.2} 13 L${c + 1.2} 9 L${c + 0.2} 8.2 L${c - 0.4} 9.4 L${c - 1.2} 8.6 Z`} fill={cor(CINZA3)} {...C(0.45)} />
      <path d={`M${c - 1.3} 7 L${c + 0.8} 7.6 L${c + 1.4} 3.4 L${c - 0.2} 2.8 Z`} fill={cor(CINZA3)} {...C(0.45)} transform={`rotate(-8 ${c} 5)`} />
      <path d={`M${c - 1} 1.8 L${c + 0.6} 2 L${c} 0.2 Z`} fill={cor(CINZA3)} {...C(0.4)} transform={`rotate(14 ${c} 1)`} />
      <path d={`M0.6 13.2 Q${c} 15 ${W - 0.6} 13.2 L${W - 0.8} 14.4 Q${c} 16.2 0.8 14.4 Z`} fill={cor(CINZA2)} {...C(0.45)} />
      <rect x={c - 0.8} y={14.8} width={1.6} height={4} fill={cor(MARROM)} {...C(0.4)} /><circle cx={c} cy={19.2} r={0.7} fill={tinta} />
    </g>; }

    /* ================================================================ séries */
    case 'drakkar': return <g>
      <path d="M1 8.6 Q0.4 5 2.4 3.6 Q3.4 4.4 2.6 5.6 Q3.4 8 4 8.6 M19 8.6 Q19.6 6.4 18.6 5" {...L(0.6)} />
      <path d="M2.4 3.6 L1.2 3 M2.6 3.4 L2.2 2.4" {...L(0.4)} />
      <path d="M1 8.6 H19 Q17 12.4 10 12.4 Q3 12.4 1 8.6 Z" fill={cor(MARROM)} {...C(0.6)} />
      {[4.4, 7.4, 10.4, 13.4, 16.2].map((x, k) => <circle key={k} cx={x} cy={9.6} r={1.2} fill={cor(k % 2 ? VERMELHO : AMARELO)} {...C(0.35)} />)}
      <path d="M10 8.6 V0.6" {...L(0.5)} /><rect x={6} y={1.2} width={8} height={6} fill={cor(BRANCO)} {...C(0.45)} />
      {[2.4, 4.4].map((y, k) => <rect key={k} x={6} y={y + 0.6} width={8} height={1} fill={cor(VERMELHO)} />)}
      <path d={ondas(0, 20, 12.6, 0.4, 5)} {...L(0.35)} />
    </g>;
    case 'vegvisir': return <g>
      <circle cx={10} cy={10} r={1.4} {...L(0.5)} />
      {Array.from({ length: 8 }, (_, k) => { const a = (k / 8) * Math.PI * 2 - Math.PI / 2, c = Math.cos(a), sn = Math.sin(a), px = -sn, py = c;
        const P = (r: number, o = 0) => `${f(10 + c * r + px * o)} ${f(10 + sn * r + py * o)}`;
        const ponta = [
          `M${P(7.4, -1.2)} L${P(8.8)} L${P(7.4, 1.2)}`,
          `M${P(6, -1.2)} L${P(6, 1.2)} M${P(7.6, -1.2)} L${P(7.6, 1.2)}`,
          `M${P(8.2)} m-0.6 0 a0.6 0.6 0 1 0 1.2 0 a0.6 0.6 0 1 0 -1.2 0`,
          `M${P(6.8, -1.4)} L${P(8.4, 0)} L${P(6.8, 1.4)} M${P(8.4)} L${P(9.2)}`
        ][k % 4];
        return <g key={k}><path d={`M${P(1.4)} L${P(8.6)}`} {...L(0.5)} /><path d={ponta} {...L(0.45)} /></g>; })}
    </g>;
    case 'machado_barbudo': { const w = W; return <g>
      <path d={`M${w * 0.6} 0.8 V19.4`} stroke={cor(MARROM)} strokeWidth={s(1.3)} strokeLinecap="round" /><path d={`M${w * 0.6} 0.8 V19.4`} {...L(0.3)} />
      {[6, 8.6, 11.2, 13.8, 16.4].map((y, k) => <path key={k} d={`M${w * 0.6 - 0.65} ${y} l1.3 0.8`} {...L(0.3)} />)}
      <path d={`M${w * 0.6} 1.6 L${w * 0.6 - 2} 1.8 Q${w * 0.15} 2.6 0.6 1.4 Q0.2 6 1.4 10 Q1.8 6.6 ${w * 0.6 - 2} 5 L${w * 0.6} 4.6 Z`} fill={cor(CINZA3)} {...C(0.55)} />
      <path d="M1.2 3 Q1 6 1.4 9" {...L(0.25)} />
      <path d="M2.4 3 q0.6 0.6 0 1.2 q0.6 0.6 0 1.2" {...L(0.25)} />
    </g>; }
    case 'moldura_do_olho_magico': { const c = W / 2; return <g>
      <rect x={0.4} y={0.4} width={W - 0.8} height={19.2} fill={cor(ROXO)} {...C(0.5)} />
      <ellipse cx={c} cy={9} rx={6} ry={7.4} fill={cor(OURO)} {...C(0.6)} />
      <ellipse cx={c} cy={9} rx={4.2} ry={5.6} fill={cor(ROXO)} {...C(0.5)} />
      {noCirculo(c, 9, 5.1, 12).map(([x, y], k) => <circle key={k} cx={x} cy={f(9 + (y - 9) * 1.2)} r={0.35} fill={tinta} opacity={0.5} />)}
      <circle cx={c} cy={7.4} r={0.9} fill={cor(CINZA3)} {...C(0.35)} />
      <path d={`M${W - 2.6} 13 V14.6`} stroke={cor(OURO)} strokeWidth={s(0.9)} strokeLinecap="round" />
    </g>; }
    case 'sofa_e_guarda_chuvas': return <g>
      <path d="M8 3.4 V7.4 M6.6 7.4 H9.4" {...L(0.4)} /><path d="M6.4 3.4 Q8 1.4 9.6 3.4 M8 1.6 V0.8" {...L(0.4)} />
      <path d="M7.2 2.4 Q8 1.6 8.8 2.4" fill={cor(CELESTE)} />
      {[[2, 5.4, VERMELHO], [4.4, 4, AMARELO], [11.6, 4, AZUL], [14, 5.4, VERDE], [16.6, 4.2, ROSA], [10, 1.2, ROXO]].map(([x, y, c], k) => <g key={k}>
        <path d={`M${x as number - 2} ${y} Q${x} ${y as number - 2.6} ${x as number + 2} ${y} Q${x as number + 1} ${y as number - 0.4} ${x} ${y} Q${x as number - 1} ${y as number - 0.4} ${x as number - 2} ${y} Z`} fill={cor(c as string)} {...C(0.35)} />
        <path d={`M${x} ${y} V${y as number + 1.8}`} {...L(0.3)} />
      </g>)}
      <path d="M2 9.4 Q2 8.2 3.4 8.2 H16.6 Q18 8.2 18 9.4 V11 H2 Z" fill={cor(LARANJA)} {...C(0.5)} />
      <path d="M0.6 10.6 Q0.6 9.6 1.8 9.6 Q3 9.6 3 10.6 V13.4 H17 V10.6 Q17 9.6 18.2 9.6 Q19.4 9.6 19.4 10.6 V13.6 H0.6 Z" fill={cor(LARANJA)} {...C(0.5)} />
      <path d="M3 11.4 H17 M10 11.4 V13.4" {...L(0.3)} /><path d="M2 13.6 V14 M18 13.6 V14" {...L(0.5)} />
    </g>;
    case 'triquetra_na_caverna': { const r = 5.2, cy = 11; const centros = [0, 1, 2].map(k => { const a = -Math.PI / 2 + k * (2 * Math.PI / 3); return [10 + Math.cos(a) * 3, cy + Math.sin(a) * 3]; }); return <g>
      <circle cx={10} cy={cy} r={6.6} {...L(0.6)} />
      {[0, 1, 2].map(k => { const a = centros[k], b = centros[(k + 1) % 3]; const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy), h = Math.sqrt(r * r - (d / 2) ** 2);
        const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, ox = -dy / d * h, oy = dx / d * h;
        const p1 = [mx + ox, my + oy], p2 = [mx - ox, my - oy];
        const ext = Math.hypot(p1[0] - 10, p1[1] - cy) > Math.hypot(p2[0] - 10, p2[1] - cy) ? [p1, p2] : [p2, p1];
        return <path key={k} d={`M${f(ext[1][0])} ${f(ext[1][1])} A${r} ${r} 0 0 1 ${f(ext[0][0])} ${f(ext[0][1])} A${r} ${r} 0 0 1 ${f(ext[1][0])} ${f(ext[1][1])} Z`} {...L(1)} />; })}
    </g>; }
    case 'circulo_triangulo_quadrado': { const y = H / 2; return <g>
      <circle cx={3.4} cy={y} r={2.8} fill="none" stroke={cor(NEON)} strokeWidth={s(1.1)} /><circle cx={3.4} cy={y} r={2.8} {...L(0.25)} />
      <path d={`M10 ${y - 3} L13 ${y + 2.6} H7 Z`} fill="none" stroke={cor(NEON)} strokeWidth={s(1.1)} strokeLinejoin="round" /><path d={`M10 ${y - 3} L13 ${y + 2.6} H7 Z`} {...L(0.25)} />
      <rect x={14.2} y={y - 2.7} width={5.4} height={5.4} fill="none" stroke={cor(NEON)} strokeWidth={s(1.1)} /><rect x={14.2} y={y - 2.7} width={5.4} height={5.4} {...L(0.25)} />
    </g>; }
    case 'biscoito_de_favo': return <g>
      <circle cx={10} cy={10} r={8.6} fill={cor(AMARELO)} {...C(0.6)} /><circle cx={10} cy={10} r={7.6} fill="none" stroke={cor(TERRA)} strokeWidth={s(0.3)} />
      {[[4, 6], [15.6, 14], [14.6, 5], [5.4, 15]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r={0.4} fill={cor(TERRA)} />)}
      <path d="M4.6 10 Q10 2.4 15.4 10 Q14 9 12.7 10 Q11.4 9 10 10 Q8.6 9 7.3 10 Q6 9 4.6 10 Z M10 10 V14.6 Q10 15.8 11.2 15.8 Q12.2 15.8 12.2 14.8" {...L(0.5)} />
      <path d="M10 4 V3" {...L(0.5)} />
    </g>;
    case 'numeros_da_ilha': return <g>
      {letra('4 8 15 16 23 42', W / 2, H * 0.74, 4, { fonte: "'Courier New', Courier, monospace", peso: 700, larg: 19 })}
    </g>;
    case 'aviao_partido': return <g>
      <path d={`M0.4 ${H - 0.4} V9.4 Q6 8.4 10 9.6 Q15 8.6 19.6 9.4 V${H - 0.4} Z`} fill={cor(AREIA)} {...C(0.4)} />
      <path d={`M0.4 9.4 Q6 8.4 10 9.6 Q15 8.6 19.6 9.4`} fill="none" stroke={cor(TURQUESA)} strokeWidth={s(1.2)} />
      <path d="M2.6 11.6 L12.6 8 L14.6 8.4 L6 12.4 Z" fill={cor(CINZA3)} {...C(0.5)} /><path d="M8 10 L9 7.4 L10 7.2 L9.6 9.6" fill={cor(CINZA2)} {...C(0.4)} />
      <path d="M5 11.4 l1 -0.4 M7 10.6 l1 -0.4" {...L(0.25)} />
      <path d="M16.4 10 Q16.6 5.6 15.2 2.4" {...L(0.6)} />
      {[-2, -0.8, 0.6, 2].map((a, k) => <path key={k} d={`M15.2 2.4 q${f(Math.cos(a) * 2)} ${f(-0.8 + Math.abs(a) * 0.4)} ${f(Math.cos(a) * 3.6)} ${f(0.6 + Math.abs(a) * 0.5)}`} fill="none" stroke={cor(VERDE)} strokeWidth={s(0.6)} strokeLinecap="round" />)}
      <path d={ondas(0.6, 19, 8.2, 0.3, 5)} {...L(0.3)} opacity={0.6} />
    </g>;
    case 'macacao_e_notas': { const c = W / 2; return <g>
      <path d={`M${c} 0.6 V2.4 M${c - 3} 3.4 Q${c} 1.4 ${c + 3} 3.4`} {...L(0.4)} />
      <path d={`M${c - 4} 3.6 L${c - 6.6} 9.6 L${c - 5} 10.2 L${c - 3.4} 7.6 L${c - 3.6} 18.8 H${c - 0.4} L${c} 12.4 L${c + 0.4} 18.8 H${c + 3.6} L${c + 3.4} 7.6 L${c + 5} 10.2 L${c + 6.6} 9.6 L${c + 4} 3.6 Z`} fill={cor(VERMELHO)} {...C(0.55)} />
      <path d={`M${c} 3.8 V11 M${c - 1.6} 3.6 L${c} 5 L${c + 1.6} 3.6`} {...L(0.3)} />
      {[[1, 12.6, -20], [W - 3.4, 13.6, 18], [1.6, 2.6, 10]].map(([x, y, r], k) => <g key={k} transform={`rotate(${r} ${x as number + 1.4} ${y as number + 0.7})`}><rect x={x as number} y={y as number} width={2.8} height={1.4} fill={cor(VERDE_CLARO)} {...C(0.3)} /><circle cx={(x as number) + 1.4} cy={(y as number) + 0.7} r={0.4} {...L(0.2)} /></g>)}
    </g>; }
    case 'coroa_de_gelo': { const y = H - 2; return <g>
      <path d={`M2 ${y} L1.6 ${y - 6} L4.6 ${y - 3.4} L6.4 ${y - 11} L8.4 ${y - 4} L10 ${y - 13} L11.6 ${y - 4} L13.6 ${y - 11} L15.4 ${y - 3.4} L18.4 ${y - 6} L18 ${y} Z`} fill={cor(CELESTE)} {...C(0.6)} />
      <path d={`M6.4 ${y - 9} L6.6 ${y - 2.4} M10 ${y - 11} V${y - 2.4} M13.6 ${y - 9} L13.4 ${y - 2.4}`} fill="none" stroke={cor(BRANCO)} strokeWidth={s(0.4)} />
      <rect x={1.6} y={y - 1.4} width={16.8} height={1.8} rx={0.4} fill={cor(AZUL)} {...C(0.5)} />
    </g>; }
    case 'walkie_talkie_e_bicicleta': return <g>
      <circle cx={4} cy={9.4} r={3.4} {...L(0.6)} /><circle cx={16} cy={9.4} r={3.4} {...L(0.6)} />
      <circle cx={4} cy={9.4} r={0.4} fill={tinta} /><circle cx={16} cy={9.4} r={0.4} fill={tinta} />
      <path d="M4 9.4 L7.6 4.6 H13.4 L16 9.4 M7.6 4.6 L10 9.4 L13.4 4.6 M10 9.4 L9.4 3.6 M8 3.6 H10.8 M13.4 4.6 L13 1.6 Q14.8 0.8 15.6 2" fill="none" stroke={cor(VERMELHO)} strokeWidth={s(0.8)} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 1.6 L12 2.4" {...L(0.4)} />
      <rect x={14.6} y={2.4} width={3} height={3.4} rx={0.4} fill={cor(CINZA3)} {...C(0.4)} transform="rotate(8 16 4)" />
      <rect x={15.2} y={-0.4} width={1.8} height={3} rx={0.4} fill={cor(CINZA1)} {...C(0.35)} transform="translate(0 0.6)" /><path d="M16.6 0.2 V-2" {...L(0.3)} transform="translate(0 2.4)" />
    </g>;
    case 'relogio_de_corrente': { const c = W / 2; return <g>
      <path d={`M${c} 6 Q${c - 3} 3 ${c - 1} 0.8 Q${c + 2} 0 ${c + 4} 1.6`} {...L(0.4)} strokeDasharray="0.6 0.35" />
      <circle cx={c} cy={6.6} r={0.9} fill={cor(OURO)} {...C(0.35)} />
      <circle cx={c} cy={13} r={5.8} fill={cor(OURO)} {...C(0.6)} /><circle cx={c} cy={13} r={4.8} fill={cor(CREME)} {...C(0.35)} />
      {noCirculo(c, 13, 4, 12).map(([x, y], k) => <path key={k} d={`M${x} ${y} l0.01 0`} {...L(k % 3 ? 0.3 : 0.6)} />)}
      <path d={`M${c} 13 V9.8 M${c} 13 L${c + 2.2} 14`} {...L(0.45)} />
    </g>; }

    /* ================================================================ filmes */
    case 'dois_sois': return <g>
      <circle cx={7.4} cy={6.4} r={3.2} fill={cor(AMARELO)} {...C(0.45)} /><circle cx={13.6} cy={8} r={2.2} fill={cor(LARANJA)} {...C(0.45)} />
      <path d="M0.4 10.6 Q6 9 11 10.4 Q15 9.4 19.6 10.2 V13.8 H0.4 Z" fill={cor(AREIA)} {...C(0.45)} />
      <path d="M4 11 Q4 8.6 6.6 8.6 Q9.2 8.6 9.2 11 Z" fill={cor(CREME)} {...C(0.45)} /><path d="M5.6 11 V9.8 H7.4 V11" {...L(0.3)} />
      <path d="M11.4 10.6 V8.6 M10.8 8.6 H12" {...L(0.35)} />
    </g>;
    case 'colher_torta': { const c = W / 2; return <g>
      <ellipse cx={c - 0.6} cy={4.6} rx={2.6} ry={4} fill={cor(PRATA)} {...C(0.6)} transform={`rotate(-28 ${c - 0.6} 4.6)`} />
      <ellipse cx={c - 0.8} cy={4.6} rx={1.4} ry={2.6} fill={cor(CINZA3)} transform={`rotate(-28 ${c - 0.8} 4.6)`} opacity={0.7} />
      <path d={`M${c + 1.4} 8 Q${c + 2.4} 10.6 ${c + 0.2} 12 L${c - 0.6} 12.6 Q${c - 1.8} 13.6 ${c - 1.2} 15.4 L${c - 0.2} 19.4`} fill="none" stroke={tinta} strokeWidth={s(1.8)} strokeLinecap="round" />
      <path d={`M${c + 1.4} 8 Q${c + 2.4} 10.6 ${c + 0.2} 12 L${c - 0.6} 12.6 Q${c - 1.8} 13.6 ${c - 1.2} 15.4 L${c - 0.2} 19.4`} fill="none" stroke={cor(PRATA)} strokeWidth={s(0.8)} strokeLinecap="round" />
      <path d={`M${c + 2.4} 10.4 l1.2 -0.4 M${c + 2.2} 12 l1.2 0.4`} {...L(0.3)} />
    </g>; }
    case 'copo_tremendo': { const c = W / 2; return <g>
      <path d={`M${c - 6} 3 L${c - 4.8} 18.6 H${c + 4.8} L${c + 6} 3 Z`} fill={cor(CELESTE)} opacity={0.25} />
      <path d={`M${c - 6} 3 L${c - 4.8} 18.6 H${c + 4.8} L${c + 6} 3`} {...L(0.6)} />
      <ellipse cx={c} cy={6.6} rx={5.6} ry={1.6} fill={cor(CELESTE)} {...C(0.4)} />
      <ellipse cx={c} cy={6.6} rx={3.6} ry={1} {...L(0.3)} /><ellipse cx={c} cy={6.6} rx={1.6} ry={0.45} {...L(0.3)} />
      <path d={`M${c - 7.6} 1.6 l0.8 -0.8 M${c + 7.4} 1.4 l-0.8 -0.8 M${c - 7.8} 10 l1 0.2 M${c + 7.8} 10 l-1 0.2`} {...L(0.35)} />
      <path d={`M0.4 19.6 H${W - 0.4}`} {...L(0.6)} />
    </g>; }
    case 'reator_no_peito': return <g>
      <circle cx={10} cy={10} r={9} fill={cor(CELESTE)} opacity={0.25} />
      <circle cx={10} cy={10} r={7.6} fill={cor(CINZA2)} {...C(0.7)} />
      {noCirculo(10, 10, 6, 10).map(([x, y, a], k) => <rect key={k} x={x - 0.7} y={y - 1} width={1.4} height={2} fill={cor(CINZA3)} {...C(0.3)} transform={`rotate(${f(a * 180 / Math.PI + 90)} ${x} ${y})`} />)}
      <circle cx={10} cy={10} r={4.2} fill={cor(CELESTE)} {...C(0.5)} />
      {noCirculo(10, 10, 3, 6).map(([x, y], k) => <path key={`r${k}`} d={`M10 10 L${x} ${y}`} stroke={cor(AZUL)} strokeWidth={s(0.35)} />)}
      <circle cx={10} cy={10} r={1.6} fill={cor(BRANCO)} {...C(0.4)} />
    </g>;
    case 'cristal_verde': { const c = W / 2; return <g>
      <circle cx={c} cy={11} r={6.6} fill={cor(LIMAO)} opacity={0.2} />
      <path d={`M${c} 1 L${c + 2.4} 6 L${c + 1.6} 18.6 H${c - 1.6} L${c - 2.4} 6 Z`} fill={cor(VERDE_CLARO)} {...C(0.5)} />
      <path d={`M${c - 2.4} 6 L${c} 7.6 L${c + 2.4} 6 M${c} 7.6 V18.6`} {...L(0.3)} />
      <path d={`M${c - 2.6} 18.6 L${c - 5.4} 9 L${c - 4} 7.4 L${c - 2.8} 12`} fill={cor(VERDE)} {...C(0.45)} />
      <path d={`M${c + 2.6} 18.6 L${c + 5.6} 11 L${c + 4.4} 9.6 L${c + 2.8} 13.4`} fill={cor(VERDE)} {...C(0.45)} />
      <path d={`M0.6 19.4 H${W - 0.6}`} {...L(0.5)} />
    </g>; }
    case 'relogio_da_torre': { const c = W / 2; return <g>
      <path d={`M2 19.6 V8 L${c} 4 L${W - 2} 8 V19.6 Z`} fill={cor(CREME)} {...C(0.6)} />
      <path d={`M${c} 4 V0.6 L${c + 0.6} 1.6`} {...L(0.4)} />
      <circle cx={c} cy={12} r={4.6} fill={cor(BRANCO)} {...C(0.55)} />
      {noCirculo(c, 12, 3.8, 12).map(([x, y], k) => <circle key={k} cx={x} cy={y} r={0.22} fill={tinta} />)}
      <path d={`M${c} 12 L${c} 8.6 M${c} 12 L${c + 0.6} 9.6`} {...L(0.45)} transform={`rotate(0 ${c} 12)`} />
      <path d={`M${c + 1} 0.4 L${c + 4} 3 L${c + 2.6} 3.4 L${c + 5.6} 6.8`} fill="none" stroke={cor(AMARELO)} strokeWidth={s(0.7)} strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M2 17.6 H${W - 2}`} {...L(0.3)} />
    </g>; }
    case 'chicote_e_chapeu': return <g>
      <path d="M2 7 Q3.6 6.2 5 6.6 Q5.4 1.4 10 1.4 Q14.6 1.4 15 6.6 Q16.4 6.2 18 7 Q18.6 8.8 10 9 Q1.4 8.8 2 7 Z" fill={cor(TERRA)} {...C(0.6)} />
      <path d="M5.2 5.6 Q10 6.8 14.8 5.6" fill="none" stroke={cor(MARROM)} strokeWidth={s(0.9)} /><path d="M8.6 1.6 Q10 3 11.4 1.6" {...L(0.35)} />
      <path d="M3.4 11 L6 10.4" stroke={cor(MARROM)} strokeWidth={s(1.2)} strokeLinecap="round" />
      <path d="M6 10.4 Q12 9.4 13 12 Q13.6 14.6 9.4 14.4 Q5 14 6 12 Q7.4 10.6 11 12 Q14 13.4 18.6 12.4" {...L(0.5)} />
    </g>;
    case 'idolo_dourado': { const c = W / 2; return <g>
      <circle cx={c} cy={3.4} r={2.4} fill={cor(OURO)} {...C(0.5)} />
      <path d={`M${c - 1} 3.2 h0.6 M${c + 0.4} 3.2 h0.6 M${c - 0.6} 4.4 h1.2`} {...L(0.35)} />
      <path d={`M${c - 2.6} 5.6 Q${c} 5 ${c + 2.6} 5.6 L${c + 3.6} 10 Q${c + 2} 11.2 ${c + 1.6} 9.6 L${c + 2} 12.4 H${c - 2} L${c - 1.6} 9.6 Q${c - 2} 11.2 ${c - 3.6} 10 Z`} fill={cor(OURO)} {...C(0.5)} />
      <path d={`M${c - 2.6} 12.4 H${c + 2.6} V13 Q${c} 13.6 ${c - 2.6} 13 Z`} fill={cor(OURO)} {...C(0.4)} />
      <path d={`M${c - 3.4} 13.6 H${c + 3.4} L${c + 4.4} 19.4 H${c - 4.4} Z`} fill={cor(CINZA2)} {...C(0.5)} />
      <path d={`M${c - 3.8} 16.4 H${c + 3.8} M${c} 13.6 V16.4`} {...L(0.3)} />
    </g>; }
    case 'tapete_do_hotel': return <g>
      <rect x={0.4} y={0.4} width={19.2} height={19.2} fill={cor(LARANJA)} {...C(0.5)} />
      {[0, 1, 2, 3].map(r => [0, 1, 2, 3].map(k => { const cx = 2.6 + k * 5 - (r % 2 ? 2.5 : 0), cy = 2.6 + r * 4.6; return <g key={`${r}${k}`}><path d={poligono(cx, cy, 2.2, 6, 0)} fill={cor(MARROM)} {...C(0.3)} /><path d={poligono(cx, cy, 1.1, 6, 0)} fill={cor(VERMELHO)} /></g>; }))}
      <rect x={5} y={6.6} width={10} height={5.4} rx={0.6} fill={cor(CREME)} {...C(0.5)} />
      {letra('237', 10, 11, 4.2, { fonte: "Georgia, serif" })}
    </g>;
    case 'buraco_negro': return <g>
      <ellipse cx={10} cy={7.2} rx={9.4} ry={2.4} fill="none" stroke={cor(LARANJA)} strokeWidth={s(1.6)} />
      <ellipse cx={10} cy={7.2} rx={9.4} ry={2.4} fill="none" stroke={cor(AMARELO)} strokeWidth={s(0.5)} />
      <path d="M4.4 7 A5.6 5.6 0 0 1 15.6 7" fill="none" stroke={cor(AMARELO)} strokeWidth={s(1.4)} />
      <path d="M5.2 7.6 A4.8 4.8 0 0 0 14.8 7.6" fill="none" stroke={cor(LARANJA)} strokeWidth={s(0.9)} />
      <circle cx={10} cy={7.2} r={4} fill={tinta} />
      <path d="M0.6 7.2 Q10 9.8 19.4 7.2" fill="none" stroke={cor(AMARELO)} strokeWidth={s(1)} />
      <path d="M0.6 7.2 Q10 9.8 19.4 7.2" {...L(0.2)} />
    </g>;
    case 'katana_e_sangue': { const c = W / 2; return <g>
      <g transform={`rotate(14 ${c} 10)`}>
        <path d={`M${c - 0.6} 0.6 Q${c + 1.4} 4 ${c + 0.8} 11 L${c - 0.6} 11 Q${c} 4 ${c - 0.6} 0.6 Z`} fill={cor(CINZA3)} {...C(0.45)} />
        <ellipse cx={c} cy={11.4} rx={2} ry={0.6} fill={cor(OURO)} {...C(0.35)} />
        <rect x={c - 0.7} y={11.8} width={1.4} height={7} rx={0.3} fill={cor(AMARELO)} {...C(0.4)} />
        {[13, 14.6, 16.2, 17.8].map((y, k) => <path key={k} d={`M${c - 0.7} ${y} l1.4 0.6 M${c + 0.7} ${y} l-1.4 0.6`} {...L(0.25)} />)}
      </g>
      {[[c - 3, 4, 0.7], [c + 3.2, 7, 0.5], [c - 2.6, 8.4, 0.4], [c + 2.6, 2.6, 0.35], [c - 3.6, 12, 0.3], [c + 3.4, 13.4, 0.45]].map(([x, y, r], k) => <g key={k}><circle cx={x} cy={y} r={r} fill={cor(VERMELHO)} /><path d={`M${x} ${y} l${k % 2 ? 0.8 : -0.8} ${0.6 + r}`} stroke={cor(VERMELHO)} strokeWidth={s(0.3)} strokeLinecap="round" /></g>)}
    </g>; }
    case 'maos_de_marionete': return <g>
      <path d="M5 4.6 Q4.4 1.6 6 1.4 L6.4 3 L6.8 0.6 Q8 0.4 8 1.6 L8 3 L8.6 0.6 Q9.8 0.6 9.8 1.8 L9.6 3.2 L10.4 1.2 Q11.6 1.4 11.2 2.6 L10.6 4.6 Q12.4 3.6 13 4.4 Q12.2 6 10.4 7 Q8.4 8 6.4 7.4 Q5 6.6 5 4.6 Z" fill={cor(BRANCO)} {...C(0.5)} />
      <path d="M6.4 3 V5 M8 3 V5.2 M9.6 3.2 L9.4 5.2" {...L(0.25)} />
      <path d="M2.4 9.4 H13.6 M8 6.4 V12.6" stroke={cor(MARROM)} strokeWidth={s(1)} strokeLinecap="round" />
      <path d="M6.4 7.4 L5.6 9.4 M10.4 7 L11 9.4" {...L(0.3)} />
      {[2.4, 5, 11, 13.6].map((x, k) => <path key={k} d={`M${x} 9.4 V${k % 3 ? 17.6 : 19.4}`} {...L(0.2)} />)}
      <path d="M8 12.6 V19.4" {...L(0.2)} />
      <path d="M12.6 16.4 Q12 14.8 13.4 14.4 Q14.8 14.8 14.2 16.4 Q13.4 17.2 12.6 16.4 Z" fill={cor(VERMELHO)} {...C(0.3)} /><path d="M13.4 17 V18.6" stroke={cor(VERDE)} strokeWidth={s(0.35)} />
    </g>;
    /* ================================================================ animações */
    case 'caderno_preto': { return <g>
      <rect x={1.6} y={1} width={11.6} height={18} rx={0.6} fill={tinta} />
      <rect x={1.6} y={1} width={1.6} height={18} fill={cor(CINZA1)} />
      <path d="M5 5.6 H11 M5 7.2 H10" stroke={cor(BRANCO)} strokeWidth={s(0.45)} strokeLinecap="round" />
      <path d="M3.2 18.4 L13.2 18.4" stroke={cor(CINZA2)} strokeWidth={s(0.25)} />
      <path d="M9 18.6 L14.6 6.4 L15.2 6.8 L9.6 19 Z" fill={cor(OURO)} {...C(0.35)} /><path d="M9 18.6 L9.2 19.8 L9.6 19 Z" fill={tinta} />
    </g>; }
    case 'maca_vermelha': { const c = W / 2; return <g>
      <path d={`M${c} 6 Q${c - 3} 3.8 ${c - 6} 5.4 Q${c - 8.2} 8.4 ${c - 6.6} 13 Q${c - 4.4} 17.4 ${c - 1.4} 16.2 Q${c} 15.6 ${c + 1.4} 16.2 Q${c + 4.4} 17.4 ${c + 6.6} 13 Q${c + 8.2} 8.4 ${c + 6} 5.4 Q${c + 3} 3.8 ${c} 6 Z`} fill={cor(VERMELHO)} {...C(0.6)} />
      <path d={`M${c - 4.6} 7.4 Q${c - 5.4} 9.4 ${c - 4.6} 11`} fill="none" stroke={cor(BRANCO)} strokeWidth={s(0.6)} strokeLinecap="round" opacity={0.8} />
      <path d={`M${c} 6 Q${c + 0.4} 3 ${c + 1.4} 1.6`} {...L(0.55)} /><path d={`M${c + 0.6} 3.4 Q${c + 3.6} 1 ${c + 5} 3 Q${c + 3} 4.6 ${c + 0.6} 3.4 Z`} fill={cor(VERDE)} {...C(0.4)} />
      <path d={`M${c - 7.4} 19.6 Q${c - 6} 16 ${c - 4.4} 14.6 L${c - 3} 13.6 M${c - 6} 19.6 Q${c - 4} 17.4 ${c - 2.2} 15.4 L${c - 1} 14.8 M${c + 7.4} 19.6 Q${c + 6} 16 ${c + 4.4} 14.6 L${c + 3} 13.4`} {...L(0.8)} />
    </g>; }
    case 'portal_verde': return <g>
      <path d={'M' + Array.from({ length: 24 }, (_, k) => { const a = (k / 24) * Math.PI * 2, r = 8.6 + (k % 2 ? -0.6 : 0.6) + sorte(k) * 0.6; return `${f(10 + Math.cos(a) * r)} ${f(10 + Math.sin(a) * r)}`; }).join(' L') + ' Z'} fill={cor(LIMAO)} {...C(0.6)} />
      <circle cx={10} cy={10} r={6.4} fill={cor(VERDE_CLARO)} />
      <path d={espiral(10, 10, 6.4, 2.6)} fill="none" stroke={cor(VERDE)} strokeWidth={s(0.7)} />
      <path d={espiral(10, 10, 6.4, 2.6)} {...L(0.2)} />
      {[[3, 18.4], [15.6, 18.6], [18.4, 15.4]].map(([x, y], k) => <path key={k} d={`M${x} ${y - 1.4} q0.6 0.8 0 1.4 q-0.6 -0.6 0 -1.4 Z`} fill={cor(LIMAO)} {...C(0.25)} />)}
    </g>;
    case 'disco_de_garagem': return <g>
      <path d="M6.6 4.4 Q7 1 10 1 Q13 1 13.4 4.4 Z" fill={cor(CELESTE)} {...C(0.5)} opacity={0.9} />
      <path d="M1 6.6 Q1 4.2 10 4.2 Q19 4.2 19 6.6 Q19 8.6 10 8.6 Q1 8.6 1 6.6 Z" fill={cor(CINZA2)} {...C(0.6)} />
      <path d="M3 6.4 H5 M7.6 6.8 H9.4 M12 6.6 H14.6 M2.6 5.6 l1.4 1.6" {...L(0.3)} />
      <rect x={14} y={5.4} width={2.4} height={1.6} fill={cor(CINZA1)} {...C(0.3)} />
      <path d="M8 8.4 L7.4 10.4 M12 8.4 L12.8 10.4 M4.6 8 L3.6 9.6 M11.4 1.4 L12.4 0" {...L(0.4)} />
      <circle cx={10} cy={8.6} r={0.6} fill={cor(AMARELO)} {...C(0.25)} />
      <path d="M15.6 8 l0.8 1.6 l-0.6 0.2 l0.8 1" {...L(0.3)} />
    </g>;
    case 'padrao_xadrez_e_espada': return <g>
      {Array.from({ length: 5 }, (_, r) => Array.from({ length: 4 }, (_, k) => <rect key={`${r}${k}`} x={k * 3.5} y={r * 4} width={3.5} height={4} fill={(r + k) % 2 ? tinta : cor(VERDE)} />))}
      <rect x={0} y={0} width={14} height={20} {...L(0.5)} />
      <path d="M2 18.4 L12 2" stroke={cor(BRANCO)} strokeWidth={s(2)} strokeLinecap="round" />
      <path d="M3.4 16.2 L12 2" stroke={tinta} strokeWidth={s(1)} strokeLinecap="round" />
      <path d="M4.6 14.6 L1.8 13 M3.4 17 L5.2 18.4" stroke={cor(OURO)} strokeWidth={s(0.8)} strokeLinecap="round" />
      <path d="M1.8 19.4 L4 15.8" stroke={cor(CELESTE)} strokeWidth={s(0.8)} strokeLinecap="round" />
    </g>;
    case 'brinco_de_sol': return <g>
      {[4.6, 15.4].map((x, k) => <g key={k}>
        <path d={`M${x} 0.6 V3`} {...L(0.45)} />
        <rect x={x - 3.2} y={3} width={6.4} height={10} rx={0.6} fill={cor(BRANCO)} {...C(0.5)} />
        <circle cx={x} cy={9.4} r={1.8} fill={cor(VERMELHO)} />
        {[-60, -30, 0, 30, 60].map(a => <path key={a} d={`M${x} 9.4 L${f(x + Math.sin(a * Math.PI / 180) * 2.9)} ${f(9.4 - Math.cos(a * Math.PI / 180) * 2.9)}`} stroke={cor(VERMELHO)} strokeWidth={s(0.55)} />)}
        <path d={`M${x - 3.2} 9.4 H${x + 3.2}`} {...L(0.4)} />
      </g>)}
    </g>;
    case 'cruz_de_luz': { const c = W / 2; return <g>
      <path d={`M0.6 16.4 Q${c} 13.4 ${W - 0.6} 16.4 V19.4 H0.6 Z`} fill={cor(LARANJA)} {...C(0.5)} />
      <path d={`M${c - 1.4} 16 V7.4 H${c - 5.6} V5 H${c - 1.4} V0.6 H${c + 1.4} V5 H${c + 5.6} V7.4 H${c + 1.4} V16 Z`} fill={cor(CREME)} {...C(0.55)} />
      <path d={`M${c} 1.4 V15.4 M${c - 5} 6.2 H${c + 5}`} fill="none" stroke={cor(AMARELO)} strokeWidth={s(0.6)} />
      <path d={`M0.6 14.4 L${c - 3} 15.4 M${W - 0.6} 14.4 L${c + 3} 15.4`} {...L(0.3)} />
    </g>; }
    case 'armadura_em_caixa': { const c = W / 2; return <g>
      <path d={`M${c - 2} 2 Q${c - 4} 0.2 ${c - 5} 2.6 M${c + 2} 2 Q${c + 4} 0.2 ${c + 5} 2.6`} {...L(0.4)} strokeDasharray="0.6 0.4" />
      <rect x={1.4} y={3} width={13.2} height={16.4} rx={0.8} fill={cor(TERRA)} {...C(0.6)} />
      <rect x={3} y={4.6} width={10} height={12.6} rx={0.4} {...L(0.35)} />
      {[[5, 7], [7.4, 9.4], [10.6, 8], [9.6, 12.4], [6, 14.4]].map(([x, y], k, a) => <g key={k}>{k > 0 && <path d={`M${a[k - 1][0]} ${a[k - 1][1]} L${x} ${y}`} stroke={cor(OURO)} strokeWidth={s(0.3)} />}<path d={estrela(x, y, 0.8, 4, 0.25)} fill={cor(OURO)} /></g>)}
      <rect x={6.6} y={18.4} width={2.8} height={1.4} fill={tinta} />
    </g>; }
    case 'pergaminho_selado': return <g>
      <rect x={3} y={2.6} width={14} height={7.4} fill={cor(CREME)} {...C(0.5)} />
      <ellipse cx={3} cy={6.3} rx={1.6} ry={3.9} fill={cor(CREME)} {...C(0.5)} /><ellipse cx={17} cy={6.3} rx={1.6} ry={3.9} fill={cor(CREME)} {...C(0.5)} />
      <ellipse cx={3} cy={6.3} rx={0.6} ry={1.8} fill={cor(MARROM)} />
      <rect x={8.2} y={2.6} width={3.6} height={7.4} fill={cor(BRANCO)} {...C(0.35)} />
      <path d="M9 4 Q10 3.4 11 4.2 M9.2 5.4 H10.8 M10 5.4 V8.4 M9 7 L11 7.6" {...L(0.3)} stroke={cor(VERMELHO)} />
      <path d="M6.6 2.6 V10 M13.4 2.6 V10" stroke={cor(VERMELHO)} strokeWidth={s(0.6)} />
      <path d="M13.4 10 q-0.6 1 0.2 1.2 M6.6 10 q0.6 1 -0.2 1.2" {...L(0.3)} stroke={cor(VERMELHO)} />
    </g>;
    case 'capsula': { const c = W / 2; return <g>
      <rect x={c - 3.6} y={1.4} width={7.2} height={17.2} rx={3.6} fill={cor(BRANCO)} {...C(0.6)} />
      <path d={`M${c - 3.6} 10 H${c + 3.6}`} {...L(0.5)} /><path d={`M${c - 3.6} 10 V5 A3.6 3.6 0 0 1 ${c + 3.6} 5 V10 Z`} fill={cor(CELESTE)} opacity={0.6} />
      <rect x={c - 1.6} y={8.8} width={3.2} height={2.4} rx={0.4} fill={cor(CINZA2)} {...C(0.35)} />
      {letra('7', c, 15.6, 3, { fonte: "Arial, sans-serif" })}
    </g>; }
    case 'mapa_do_tesouro': return <g>
      <path d="M1 1.4 L19 0.8 L18.4 14.8 L1.4 15 Z" fill={cor(CREME)} {...C(0.55)} />
      <path d="M1.2 4 l0.8 0.4 M18.6 10 l-0.8 0.6 M6 0.9 l0.4 0.8" {...L(0.3)} />
      <path d="M5 9.6 Q4 5.6 8 5 Q11 4 12.6 6.6 Q15.4 8 13.6 11 Q11 13.2 7.4 12.4 Q5.4 11.8 5 9.6 Z" fill={cor(VERDE_CLARO)} {...C(0.45)} />
      <path d="M2.4 13 Q4 11.4 6.4 11" {...L(0.35)} strokeDasharray="0.5 0.45" /><path d="M6.4 11 Q8 9 10.6 8.4" {...L(0.35)} strokeDasharray="0.5 0.45" />
      <path d="M10.2 7.4 L12 9.4 M12 7.4 L10.2 9.4" stroke={cor(VERMELHO)} strokeWidth={s(0.7)} strokeLinecap="round" />
      <path d={estrela(16, 3.6, 1.4, 4, 0.3)} {...L(0.3)} /><path d="M16 1.8 V0.9" {...L(0.25)} />
    </g>;
    case 'chave_no_cordao': { const c = W / 2; return <g>
      <path d={`M${c - 4} 0.6 Q${c} 9 ${c + 4} 0.6`} {...L(0.45)} />
      <circle cx={c} cy={7.4} r={2.2} {...L(0.8)} />
      <path d={`M${c} 9.6 V19`} {...L(1.1)} />
      <path d={`M${c} 15.4 H${c + 2.6} V16.6 H${c + 1.6} V17.4 H${c + 2.6} V18.6 H${c}`} fill={tinta} />
      <path d={`M${c - 1.4} 11 H${c + 1.4}`} {...L(0.6)} />
    </g>; }
    case 'barra_radioativa': { const c = W / 2; return <g>
      <rect x={c - 2} y={1} width={4} height={12} rx={1} fill={cor(LIMAO)} {...C(0.55)} />
      <path d={`M${c - 3.6} 3 l-1.2 -0.6 M${c + 3.6} 3 l1.2 -0.6 M${c - 3.6} 7 h-1.4 M${c + 3.6} 7 h1.4 M${c - 3.6} 11 l-1.2 0.6 M${c + 3.6} 11 l1.2 0.6`} stroke={cor(LIMAO)} strokeWidth={s(0.5)} strokeLinecap="round" />
      <path d={`M${c - 1} 2.4 V11.6`} stroke={cor(BRANCO)} strokeWidth={s(0.4)} opacity={0.7} />
      <path d={`M${c - 2.6} 12.6 L${c - 1} 19.6 M${c + 2.6} 12.6 L${c + 1} 19.6`} stroke={cor(CINZA2)} strokeWidth={s(1)} strokeLinecap="round" />
      <path d={`M${c - 2.6} 12.6 L${c - 1} 19.6 M${c + 2.6} 12.6 L${c + 1} 19.6`} {...L(0.25)} />
    </g>; }
    case 'castelo_ambulante': return <g>
      <path d="M4 12 Q2 8 4 5 Q6 3 8 4 L9 2 L11 3.4 L13 2.4 Q16.4 4 16.6 7.4 Q17 11 14.6 13 Z" fill={cor(CINZA2)} {...C(0.6)} />
      <path d="M8 4 V1 H9.4 V3 M13 2.4 V0.4 H14.2 V3" fill={cor(CINZA1)} {...C(0.4)} />
      <path d="M8.6 0.6 q-1 -0.6 -0.4 -1.4 M13.6 0.2 q1 -0.8 0 -1.6" {...L(0.3)} opacity={0.6} />
      <rect x={6} y={6} width={2.2} height={2} fill={cor(AMARELO)} {...C(0.3)} /><rect x={11.4} y={5.4} width={2.4} height={2.6} fill={cor(TERRA)} {...C(0.3)} />
      <path d="M4.4 9 H8 M10 10 H15 M6 11.2 L7 12" {...L(0.3)} />
      <circle cx={10.4} cy={8.6} r={0.9} fill={cor(VERMELHO)} {...C(0.3)} />
      <path d="M6.4 12.6 L5 16.6 L6.6 19.4 M5 16.6 L3.6 19.4 M12.6 12.8 L14.4 16.6 L13 19.4 M14.4 16.6 L16 19.4" {...L(0.7)} />
      <path d="M2.6 19.4 H7.4 M12 19.4 H17" {...L(0.5)} />
    </g>;
  }
  return undefined;
}
