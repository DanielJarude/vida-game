/**
 * VIDA 13 (correção final) — A ARTE DOS PERSONAGENS, lote A (`motor/dados/tatuagens13cA`): terror, mistério e aventura
 * em domínio público. Caixa nativa (o lado maior mede 20), contorno em `tinta`, cor por `cor`, como `tatuagens13Pop`.
 * O personagem em si: silhueta forte e dois ou três traços-assinatura (o boné de Holmes, as orelhas de Orlok, a perna
 * de marfim de Ahab), pelo texto e pelas ilustrações de época.
 */
import type { ReactNode } from 'react';
import {
  AMARELO, AREIA, atalhos, AZUL, BRANCO, CELESTE, CINZA1, CINZA2, CINZA3, CREME, f, LARANJA, MARROM, noCirculo, ondas, OURO, PRATA,
  ROSA, TERRA, TURQUESA, VERDE, VERDE_CLARO, VERMELHO, type PincelDaTatuagem13
} from './tatuagens13Base';

const MARCIANO = '#8a7d6a', TERRA_PELE = '#c99a72', PELE = '#e8bf98', PALIDO = '#e6dfcc', AMARELADA = '#cdbd72', VERDOSO = '#b9b98a', LIVIDO = '#d8d4c4';

export function desenho13cA(id: string, p: PincelDaTatuagem13): ReactNode | undefined {
  const { tinta, cor, W, H } = p;
  const { s, L, C } = atalhos(p);
  /** Olho simples: branco, pupila e um brilho. */
  const olho = (x: number, y: number, r = 0.55, dx = 0) => <g>
    <ellipse cx={x} cy={y} rx={r * 1.3} ry={r} fill={cor(BRANCO)} {...C(0.3)} />
    <circle cx={f(x + dx)} cy={y} r={f(r * 0.62)} fill={tinta} />
  </g>;
  switch (id) {
    /* ================================================================ Sherlock Holmes (Doyle; Sidney Paget) */
    case 'holmes_de_perfil': return <g>
      <path d="M1.6 20 Q2 15.2 6 13.4 L9.6 12.4 L13.6 13.2 Q15.8 15 15.9 20 Z" fill={cor(CINZA2)} {...C(0.6)} />
      <path d="M2.6 18.2 Q8.4 15.8 15.6 17.6" {...L(0.4)} />
      {[4.6, 7, 9.4, 11.8, 14].map((x, k) => <path key={k} d={`M${x} ${14.4 + Math.abs(x - 9) * 0.2} V20`} stroke={cor(CINZA1)} strokeWidth={s(0.3)} opacity={0.7} />)}
      <path d="M3 19 H15.6" stroke={cor(CINZA1)} strokeWidth={s(0.3)} opacity={0.7} />
      <path d="M9.4 11.8 L10.2 14.2 L13.4 13.4 Q12.4 11.4 12.6 9.4 Z" fill={cor(PELE)} {...C(0.5)} />
      <path d="M5.6 6.4 L5.2 7.6 Q5 8.4 4.4 9.1 L3.4 10.1 Q3.3 10.5 4.4 10.4 L4.5 10.7 Q4.2 11 4.6 11.2 Q4.4 11.6 4.8 11.9 Q4.9 12.7 6.2 12.8 Q8.4 12.8 9.6 11.8 Q11.6 11.2 12.4 9.4 L12.6 6.4 Z" fill={cor(PELE)} {...C(0.6)} />
      <path d="M11.6 6.6 Q12.8 7.6 12.5 9.6 Q11.8 8.6 11.3 8.2 Z" fill={tinta} />
      <ellipse cx={10.2} cy={9.2} rx={0.65} ry={1.05} fill={cor(PELE)} {...C(0.4)} />
      <path d="M5.4 7.4 L7 7.2" {...L(0.5)} /><ellipse cx={6.3} cy={8.25} rx={0.45} ry={0.35} fill={cor(BRANCO)} {...C(0.25)} /><circle cx={6.1} cy={8.25} r={0.22} fill={tinta} />
      <path d="M5.2 8.4 Q5.6 9.8 4.8 10.3" {...L(0.3)} opacity={0.6} />
      <path d="M7.6 9.6 Q8 11 7.2 11.8" {...L(0.25)} opacity={0.5} />
      <path d="M4.6 11.1 L2.6 12.3" stroke={tinta} strokeWidth={s(0.75)} strokeLinecap="round" />
      <path d="M1.2 11.3 H3.1 L2.9 13.4 Q2.1 14 1.4 13.4 Z" fill={cor(MARROM)} {...C(0.45)} />
      <path d="M2.1 11 Q1.2 9.6 2.2 8.4 Q3.2 7.2 2.2 5.6" fill="none" stroke={cor(CINZA3)} strokeWidth={s(0.45)} strokeLinecap="round" />
      <path d="M4.4 6.8 Q4.6 2.6 8.6 2.4 Q12.6 2.6 13 6.6 Z" fill={cor(AREIA)} {...C(0.6)} />
      {[6.2, 8.6, 11].map((x, k) => <path key={k} d={`M${x} ${2.9 + Math.abs(x - 8.6) * 0.2} V6.6`} stroke={cor(MARROM)} strokeWidth={s(0.3)} />)}
      {[3.8, 5.2].map((y, k) => <path key={k} d={`M${4.8 - k * 0.2} ${y} H${12.5 + k * 0.2}`} stroke={cor(MARROM)} strokeWidth={s(0.3)} />)}
      <path d="M5 6.4 Q3 6.4 2 7.6 Q4 7.8 5.8 7.0 Z" fill={cor(AREIA)} {...C(0.5)} />
      <path d="M12.4 6.2 Q14.4 6.3 15.4 7.6 Q13.6 7.8 12 7.2 Z" fill={cor(AREIA)} {...C(0.5)} />
      <path d="M4.4 6.8 Q8.6 7.4 13 6.6" {...L(0.5)} />
      <path d="M8.6 2.4 l-1.2 -0.9 v1.4 Z M8.6 2.4 l1.2 -0.9 v1.4 Z" fill={cor(AREIA)} {...C(0.35)} />
    </g>;
    case 'holmes_e_watson': return <g>
      {/* Watson atrás, à direita */}
      <path d="M8.6 20 Q9 14.2 14.4 13.2 Q19.6 14.2 19.8 20 Z" fill={cor(MARROM)} {...C(0.6)} />
      <path d="M13 13.4 L14.4 16.4 L15.8 13.4 Z" fill={cor(BRANCO)} {...C(0.4)} />
      <path d="M14.4 14.2 L13.9 15.2 L14.4 17 L14.9 15.2 Z" fill={cor(VERMELHO)} {...C(0.3)} />
      <path d="M12.4 13.6 L14.4 16.4 L13.6 20 M16.4 13.6 L14.4 16.4 L15.2 20" {...L(0.4)} />
      <path d="M13.6 12.4 V13.8 H15.2 V12.4" fill={cor(PELE)} {...C(0.4)} />
      <circle cx={14.4} cy={9.8} r={2.7} fill={cor(PELE)} {...C(0.55)} />
      <ellipse cx={11.7} cy={9.9} rx={0.45} ry={0.75} fill={cor(PELE)} {...C(0.35)} /><ellipse cx={17.1} cy={9.9} rx={0.45} ry={0.75} fill={cor(PELE)} {...C(0.35)} />
      <circle cx={13.5} cy={9.4} r={0.3} fill={tinta} /><circle cx={15.3} cy={9.4} r={0.3} fill={tinta} />
      <path d="M12.9 8.6 l1 -0.2 M14.9 8.4 l1 0.2" {...L(0.35)} />
      <path d="M14.4 9.6 L14.1 10.6 H14.7" {...L(0.3)} />
      <path d="M12.6 11.6 Q14.4 10.4 16.2 11.6 Q15.4 12 14.4 11.5 Q13.4 12 12.6 11.6 Z" fill={cor(TERRA)} {...C(0.4)} />
      <path d="M12 8 Q12 4.6 14.4 4.6 Q16.8 4.6 16.8 8 Z" fill={cor(CINZA1)} {...C(0.5)} />
      <ellipse cx={14.4} cy={8} rx={3.4} ry={0.6} fill={cor(CINZA1)} {...C(0.45)} />
      <path d="M12.1 7.2 Q14.4 7.7 16.7 7.2" fill="none" stroke={cor(MARROM)} strokeWidth={s(0.5)} />
      {/* Holmes na frente, à esquerda */}
      <path d="M0.2 20 Q0.6 13.6 6 12.8 Q11 13.6 11.4 20 Z" fill={cor(CINZA2)} {...C(0.6)} />
      <path d="M0.8 17.2 Q6 15.8 11.1 17.2" {...L(0.4)} />
      {[2.6, 4.6, 7.4, 9.4].map((x, k) => <path key={k} d={`M${x} 14 V20`} stroke={cor(CINZA1)} strokeWidth={s(0.3)} opacity={0.7} />)}
      <path d="M1 18.6 H11.2" stroke={cor(CINZA1)} strokeWidth={s(0.3)} opacity={0.7} />
      <path d="M5.2 11.6 V13.4 H6.8 V11.6" fill={cor(PELE)} {...C(0.4)} />
      <path d="M6 5.6 Q8.4 5.6 8.4 8.8 Q8.4 11.6 6 12.4 Q3.6 11.6 3.6 8.8 Q3.6 5.6 6 5.6 Z" fill={cor(PELE)} {...C(0.55)} />
      <path d="M4.6 8.2 l1 -0.3 M6.4 7.9 l1 0.3" {...L(0.4)} />
      <circle cx={5.1} cy={8.8} r={0.28} fill={tinta} /><circle cx={6.9} cy={8.8} r={0.28} fill={tinta} />
      <path d="M6 8.6 L5.5 10.4 L6.3 10.5" {...L(0.35)} />
      <path d="M5.3 11.2 H6.5" {...L(0.35)} />
      <path d="M6.4 11.2 L8.6 12.4" stroke={tinta} strokeWidth={s(0.6)} strokeLinecap="round" />
      <path d="M8.2 11.6 H9.8 L9.6 13.4 Q9 13.9 8.4 13.4 Z" fill={cor(MARROM)} {...C(0.4)} />
      <path d="M9 11.4 Q8.2 10 9.2 8.8 Q10 7.6 9.2 6.4" fill="none" stroke={cor(CINZA3)} strokeWidth={s(0.4)} strokeLinecap="round" />
      <path d="M3.3 7.2 Q3.4 3 6 2.9 Q8.6 3 8.7 7.2 Z" fill={cor(AREIA)} {...C(0.55)} />
      <path d="M6 3 V7.2 M4.5 3.8 Q4.2 5.4 4.3 7.2 M7.5 3.8 Q7.8 5.4 7.7 7.2 M3.4 5.4 H8.6" stroke={cor(MARROM)} strokeWidth={s(0.28)} fill="none" />
      <path d="M3 7.1 Q6 8.4 9 7.1 Q6 7.6 3 7.1 Z" fill={cor(AREIA)} {...C(0.45)} />
      <path d="M3.4 7.2 L2.9 9.6 L3.8 9.4 Z M8.6 7.2 L9.1 9.6 L8.2 9.4 Z" fill={cor(AREIA)} {...C(0.35)} />
      <path d="M6 2.9 l-1 -0.8 v1.2 Z M6 2.9 l1 -0.8 v1.2 Z" fill={cor(AREIA)} {...C(0.3)} />
    </g>;

    /* ================================================================ Drácula (Stoker, 1897) */
    case 'conde_dracula_do_livro': return <g>
      <path d="M0.6 20 Q1 14.6 4.4 13.4 L8 14.4 L11.6 13.4 Q15 14.6 15.4 20 Z" fill={cor(CINZA1)} {...C(0.6)} />
      <path d="M3.4 13.8 L1.6 7.6 L5 11.4 Z M12.6 13.8 L14.4 7.6 L11 11.4 Z" fill={cor(CINZA1)} {...C(0.5)} />
      <path d="M6.4 12.8 L8 14.6 L9.6 12.8" fill={cor(PALIDO)} {...C(0.4)} />
      <path d="M8 2.6 Q11.6 2.6 11.8 7 Q11.8 10.6 10.6 12.2 Q9.4 13.4 8 13.4 Q6.6 13.4 5.4 12.2 Q4.2 10.6 4.2 7 Q4.4 2.6 8 2.6 Z" fill={cor(PALIDO)} {...C(0.6)} />
      <path d="M4.4 7.8 Q2.6 5.2 2.4 4.2 Q3.8 5 4.4 6.2 M11.6 7.8 Q13.4 5.2 13.6 4.2 Q12.2 5 11.6 6.2" fill={cor(PALIDO)} {...C(0.5)} />
      <path d="M4.3 6.4 Q2.6 4.6 2.4 4.2 L4.2 9.8 Q4.4 8 4.3 6.4 Z M11.7 6.4 Q13.4 4.6 13.6 4.2 L11.8 9.8 Q11.6 8 11.7 6.4 Z" fill={cor(PALIDO)} {...C(0.5)} />
      <path d="M4.3 7.4 Q4 3.6 5.6 3.4 Q5 5 5.2 7.2 Z M11.7 7.4 Q12 3.6 10.4 3.4 Q11 5 10.8 7.2 Z" fill={cor(CINZA3)} {...C(0.35)} />
      <path d="M5.2 6.4 Q6.4 5.4 7.8 6.3 Q6.4 6 5.2 6.9 Z M10.8 6.4 Q9.6 5.4 8.2 6.3 Q9.6 6 10.8 6.9 Z" fill={tinta} {...C(0.35)} />
      {olho(6.5, 7.4, 0.5)}{olho(9.5, 7.4, 0.5)}
      <circle cx={6.5} cy={7.4} r={0.18} fill={cor(VERMELHO)} /><circle cx={9.5} cy={7.4} r={0.18} fill={cor(VERMELHO)} />
      <path d="M8 6.8 Q8.4 8 8.8 9.4 Q8.4 9.9 7.6 9.7" {...L(0.4)} />
      <path d="M6.6 11.4 Q8 11.2 9.4 11.4 Q8 12.2 6.6 11.4 Z" fill={cor(VERMELHO)} {...C(0.35)} />
      <path d="M7.1 11.4 l0.25 0.8 l0.25 -0.8 M8.4 11.4 l0.25 0.8 l0.25 -0.8" fill={cor(BRANCO)} {...C(0.25)} />
      <path d="M8 10 Q6.2 9.8 5.2 12.4 Q6.4 11 8 11 Q9.6 11 10.8 12.4 Q9.8 9.8 8 10 Z" fill={cor(BRANCO)} {...C(0.4)} />
      {[1, -1].map(d => { const X = (x: number) => f(8 - d * (8 - x)); const dedos: [number, number, number, number][] = [[5.4, 16.4, 6.6, 14.8], [5.6, 17, 7.2, 15.9], [5.6, 17.6, 7.4, 17.2], [5.4, 18.2, 7.1, 18.5]]; return <g key={d}>
        <path d={`M${X(2.4)} 20 L${X(3.4)} 17.4 Q${X(4.6)} 16.2 ${X(5.8)} 16.8 Q${X(6)} 18.4 ${X(4.8)} 19 L${X(4.4)} 20 Z`} fill={cor(PALIDO)} {...C(0.45)} />
        <path d={`M${X(4.6)} 17 Q${X(4.6)} 15.4 ${X(5.4)} 14.6`} stroke={tinta} strokeWidth={s(0.85)} fill="none" strokeLinecap="round" />
        <path d={`M${X(4.6)} 17 Q${X(4.6)} 15.4 ${X(5.4)} 14.6`} stroke={cor(PALIDO)} strokeWidth={s(0.42)} fill="none" strokeLinecap="round" />
        {dedos.map(([x0, y0, x1, y1], j) => <g key={j}>
          <path d={`M${X(x0)} ${y0} L${X(x1)} ${y1}`} stroke={tinta} strokeWidth={s(0.85)} strokeLinecap="round" />
          <path d={`M${X(x0)} ${y0} L${X(x1)} ${y1}`} stroke={cor(PALIDO)} strokeWidth={s(0.42)} strokeLinecap="round" />
          <path d={`M${X(x1)} ${y1} l${f(d * (x1 - x0) * 0.4)} ${f((y1 - y0) * 0.4)}`} stroke={tinta} strokeWidth={s(0.35)} strokeLinecap="round" />
        </g>)}
      </g>; })}
    </g>;
    case 'conde_na_muralha': return <g>
      <rect x={0.4} y={0.4} width={W - 0.8} height={H - 0.8} fill={cor(CINZA3)} {...C(0.6)} />
      {Array.from({ length: 10 }, (_, j) => <path key={`r${j}`} d={`M0.4 ${f(0.4 + (j + 1) * 1.92)} H${W - 0.4}`} stroke={cor(CINZA2)} strokeWidth={s(0.3)} />)}
      {Array.from({ length: 10 }, (_, j) => [0, 1, 2, 3].map(i => <path key={`v${j}${i}`} d={`M${f(1.6 + i * 3.6 + (j % 2) * 1.8)} ${f(0.4 + j * 1.92)} v1.92`} stroke={cor(CINZA2)} strokeWidth={s(0.3)} />))}
      <path d="M5.6 0.9 h2.8 v2.8 h-2.8 Z" fill={cor(AMARELO)} {...C(0.45)} /><path d="M7 0.9 v2.8 M5.6 2.3 h2.8" {...L(0.3)} />
      {/* pernas abertas como um lagarto, os pés para cima */}
      <path d="M6.2 6.6 L3.4 4.6 L4 1.8 M7.8 6.6 L10.6 4.6 L10 1.8" stroke={tinta} strokeWidth={s(1.3)} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 1.8 l-1.2 -0.4 M10 1.8 l1.2 -0.4" stroke={tinta} strokeWidth={s(1.1)} strokeLinecap="round" />
      {/* a capa aberta como asas */}
      <path d="M7 5.4 Q2.6 6.2 1 12.2 Q2.4 11.4 3 13 Q4.4 11.8 5.4 13.8 L8.6 13.8 Q9.6 11.8 11 13 Q11.6 11.4 13 12.2 Q11.4 6.2 7 5.4 Z" fill={tinta} {...C(0.5)} />
      <path d="M7 6.4 Q4 8 3 12.6 M7 6.4 Q10 8 11 12.6" fill="none" stroke={cor(CINZA1)} strokeWidth={s(0.35)} />
      {/* braços em ângulo, as mãos agarradas às pedras */}
      <path d="M5.6 13 L2.8 12.8 L2.2 15.6 M8.4 13 L11.2 12.8 L11.8 15.6" stroke={tinta} strokeWidth={s(1.1)} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {[[2.2, 15.6, 1], [11.8, 15.6, -1]].map(([x, y, d], k) => <g key={k}>
        <circle cx={x} cy={y} r={0.6} fill={cor(PALIDO)} {...C(0.35)} />
        {[-0.8, -0.25, 0.3, 0.85].map((a, j) => <g key={j}>
          <path d={`M${x} ${y} l${f(Math.sin(a) * 1.6 * d)} ${f(Math.cos(a) * 1.6)}`} stroke={tinta} strokeWidth={s(0.6)} strokeLinecap="round" />
          <path d={`M${x} ${y} l${f(Math.sin(a) * 1.5 * d)} ${f(Math.cos(a) * 1.5)}`} stroke={cor(PALIDO)} strokeWidth={s(0.28)} strokeLinecap="round" />
        </g>)}
      </g>)}
      {/* a cabeça para baixo: o queixo em cima, o cabelo branco embaixo */}
      <ellipse cx={7} cy={15.6} rx={1.7} ry={2} fill={cor(PALIDO)} {...C(0.5)} />
      <path d="M5.3 16.2 Q5.2 18.4 7 18.2 Q8.8 18.4 8.7 16.2 Q8 17.2 7 17.1 Q6 17.2 5.3 16.2 Z" fill={cor(BRANCO)} {...C(0.4)} />
      <path d="M5.4 14.9 Q6.2 15.4 7 14.6 Q7.8 15.4 8.6 14.9 Q8.2 14.2 7 14.4 Q5.8 14.2 5.4 14.9 Z" fill={cor(BRANCO)} {...C(0.35)} />
      <path d="M6.1 16.3 l0.6 -0.1 M7.3 16.2 l0.6 0.1" {...L(0.45)} />
      <circle cx={6.4} cy={15.9} r={0.2} fill={cor(VERMELHO)} /><circle cx={7.6} cy={15.9} r={0.2} fill={cor(VERMELHO)} />
      <path d="M7 15.9 L7 14.9" {...L(0.3)} />
      <path d="M6.4 13.9 Q7 13.6 7.6 13.9" {...L(0.3)} />
    </g>;

    /* ================================================================ Nosferatu (Murnau, 1922) */
    case 'conde_orlok': return <g>
      <path d="M3 20 Q3.4 15.6 6 14.6 L8 15.2 L10 14.6 Q12.6 15.6 13 20 Z" fill={cor(CINZA1)} {...C(0.6)} />
      {[16.4, 18].map((y, k) => <circle key={k} cx={8} cy={y} r={0.3} fill={cor(CINZA3)} />)}
      <path d="M6.6 13.8 V15 L8 15.6 L9.4 15 V13.8" fill={cor(PALIDO)} {...C(0.4)} />
      <path d="M8 1.4 Q11.2 1.6 11.4 6.6 Q11.4 10.6 10.2 12.8 Q9.2 14.4 8 14.4 Q6.8 14.4 5.8 12.8 Q4.6 10.6 4.6 6.6 Q4.8 1.6 8 1.4 Z" fill={cor(PALIDO)} {...C(0.6)} />
      <path d="M4.8 7.4 Q2.6 5.2 1.6 2.8 Q2.4 6.4 4.8 10.2 Z M11.2 7.4 Q13.4 5.2 14.4 2.8 Q13.6 6.4 11.2 10.2 Z" fill={cor(PALIDO)} {...C(0.5)} />
      <path d="M4.4 7.4 Q2.8 5.8 2.2 4.2 M11.6 7.4 Q13.2 5.8 13.8 4.2" {...L(0.3)} opacity={0.6} />
      <path d="M5.4 6.4 Q6.4 5.4 7.6 6.6 M10.6 6.4 Q9.6 5.4 8.4 6.6" {...L(0.55)} />
      <ellipse cx={6.6} cy={7.6} rx={1.1} ry={0.85} fill={cor(CINZA2)} opacity={0.7} /><ellipse cx={9.4} cy={7.6} rx={1.1} ry={0.85} fill={cor(CINZA2)} opacity={0.7} />
      {olho(6.6, 7.6, 0.45)}{olho(9.4, 7.6, 0.45)}
      <path d="M8 6.8 Q8.6 8.6 8.9 10 Q8.4 10.6 7.6 10.3" {...L(0.4)} />
      <path d="M6.8 11.6 Q8 11.2 9.2 11.6" {...L(0.4)} />
      <path d="M7.35 11.45 h0.6 v1.3 h-0.6 Z M8.05 11.45 h0.6 v1.3 h-0.6 Z" fill={cor(BRANCO)} {...C(0.25)} />
      <path d="M6 4.4 Q8 3.6 10 4.4" {...L(0.25)} opacity={0.5} />
      {[[2.2, 1], [13.8, -1]].map(([x, d], k) => <g key={k}>
        <path d={`M${x - d * 0.6} 20 L${x - d * 0.4} 16.4 Q${x} 15.4 ${x + d * 1.4} 15.6 L${x + d * 1.2} 20`} fill={cor(PALIDO)} {...C(0.45)} />
        {[-0.6, 0, 0.6, 1.2].map((o, j) => <path key={j} d={`M${f(x + d * (o * 0.7 - 0.1))} 16 Q${f(x + d * (o * 1.2 - 0.3))} ${12 - j * 0.3} ${f(x + d * (o * 1.6 - 0.2))} ${f(9.6 + Math.abs(o - 0.3) * 1.4)}`} stroke={cor(PALIDO)} strokeWidth={s(0.5)} fill="none" strokeLinecap="round" />)}
        {[-0.6, 0, 0.6, 1.2].map((o, j) => <path key={`c${j}`} d={`M${f(x + d * (o * 0.7 - 0.1))} 16 Q${f(x + d * (o * 1.2 - 0.3))} ${12 - j * 0.3} ${f(x + d * (o * 1.6 - 0.2))} ${f(9.6 + Math.abs(o - 0.3) * 1.4)}`} {...L(0.15)} />)}
      </g>)}
    </g>;
    case 'sombra_na_escada': return <g>
      <rect x={0.4} y={0.4} width={19.2} height={19.2} rx={0.6} fill={cor(CREME)} {...C(0.5)} opacity={0.9} />
      <path d={'M0.4 19.6 ' + Array.from({ length: 8 }, (_, k) => `V${f(19.6 - (k + 1) * 2.3)} H${f(0.4 + (k + 1) * 2.4)}`).join(' ') + ' V19.6 Z'} fill={cor(CINZA3)} {...C(0.4)} opacity={0.8} />
      <path d="M0.4 15 L19.6 0.8" {...L(0.5)} />
      {[3, 6.4, 9.8, 13.2, 16.6].map((x, k) => <path key={k} d={`M${x} ${f(15 - (x - 0.4) * 0.74)} v4.6`} {...L(0.35)} opacity={0.8} />)}
      <path d="M7.6 5.8 Q7.4 3.6 9.4 3.2 L8.4 0.8 L10 3.1 Q11.4 3.2 11.6 4.6 L13.4 6.4 L11.8 6.6 L11.8 7.6 L11 8.2 L13.6 7.6 L15.4 6.6 Q16.4 6.6 16.2 7.4 L13.4 9.4 L11.2 10.4 Q10.4 11.4 10.6 13.4 L11.4 17 L9.4 17.4 L9 15 L7.8 17.6 L5.6 17.6 Q4.2 13.6 4.6 10.8 Q5 7.6 7.6 5.8 Z" fill={tinta} stroke={tinta} strokeWidth={s(0.4)} strokeLinejoin="round" />
      {[[15.4, 6.8, 18.8, 2.6], [15.8, 7, 19.4, 4.2], [16, 7.3, 19.4, 6], [15.8, 7.6, 18.8, 7.8]].map(([x0, y0, x1, y1], k) => <path key={k} d={`M${x0} ${y0} Q${f((x0 + x1) / 2 + 0.2)} ${f((y0 + y1) / 2 - 0.6)} ${x1} ${y1}`} {...L(0.55)} />)}
      <path d="M15.6 6.8 Q15.4 5.4 16.6 4.6" {...L(0.55)} />
    </g>;

    /* ================================================================ Frankenstein (Mary Shelley, 1818) */
    case 'criatura_do_livro': return <g>
      <path d="M1.4 20 Q1.8 15.2 5.4 14.2 L8 15 L10.6 14.2 Q14.2 15.2 14.6 20 Z" fill={cor(MARROM)} {...C(0.6)} />
      <path d="M3.2 16 L4.2 20 M12.8 16 L11.8 20 M6 15.6 L7 17.4 M10 15.6 L9 17.4" {...L(0.35)} opacity={0.7} />
      <path d="M6.6 13.4 V15 L8 15.6 L9.4 15 V13.4" fill={cor(AMARELADA)} {...C(0.4)} />
      <path d="M6.6 14.4 H9.4" {...L(0.3)} /><path d="M7 14 v0.8 M7.9 14 v0.8 M8.8 14 v0.8" {...L(0.2)} />
      <path d="M8 2.6 Q11.6 2.6 11.6 7.6 Q11.6 11.4 10.2 13 Q9.2 14 8 14 Q6.8 14 5.8 13 Q4.4 11.4 4.4 7.6 Q4.4 2.6 8 2.6 Z" fill={cor(AMARELADA)} {...C(0.6)} />
      <path d="M8 1.6 Q12.8 1.6 12.6 7.4 L13.4 15.6 L11.6 14.6 L11.4 8.4 Q10.2 5.2 8 5 Q6.4 5.4 5.6 4.6 Q5.2 6 4.6 8.4 L4.4 14.6 L2.6 15.6 L3.4 7.4 Q3.2 1.6 8 1.6 Z" fill={tinta} {...C(0.4)} />
      <path d="M12.2 9 L12.6 14 M3.8 9 L3.4 14" stroke={cor(CINZA1)} strokeWidth={s(0.25)} />
      <path d="M5 6.6 Q6.6 6 7.6 6.8 M11 6.6 Q9.4 6 8.4 6.8" {...L(0.55)} />
      <ellipse cx={6.5} cy={7.9} rx={0.95} ry={0.7} fill={cor(LIVIDO)} {...C(0.35)} /><ellipse cx={9.5} cy={7.9} rx={0.95} ry={0.7} fill={cor(LIVIDO)} {...C(0.35)} />
      <circle cx={6.6} cy={7.95} r={0.3} fill={tinta} /><circle cx={9.4} cy={7.95} r={0.3} fill={tinta} />
      <path d="M5.8 8.9 Q6.5 9.2 7.2 8.9 M8.8 8.9 Q9.5 9.2 10.2 8.9" {...L(0.25)} />
      <path d="M6.2 9.2 q0.2 0.6 0 1" fill="none" stroke={cor(CELESTE)} strokeWidth={s(0.35)} strokeLinecap="round" />
      <path d="M8 7.4 L7.7 10 H8.4" {...L(0.35)} />
      <path d="M6.4 11.6 H9.6" stroke={tinta} strokeWidth={s(0.7)} strokeLinecap="round" />
      <path d="M7 11.62 H9" stroke={cor(BRANCO)} strokeWidth={s(0.22)} />
      <path d="M5.5 5.6 Q8 6.2 10.6 5.4" {...L(0.35)} />
      {[6.2, 7.2, 8.2, 9.2, 10.2].map((x, k) => <path key={k} d={`M${x} ${f(5.4 + Math.abs(x - 8) * 0.05)} v0.7`} {...L(0.25)} />)}
      <path d="M10.4 9.4 L11 12" {...L(0.3)} />
      {[9.8, 10.6, 11.4].map((y, k) => <path key={`b${k}`} d={`M${f(10.2 + k * 0.2)} ${y} h0.8`} {...L(0.22)} />)}
    </g>;

    /* ================================================================ O Médico e o Monstro (Stevenson, 1886) */
    case 'jekyll_e_hyde': return <g>
      {/* Jekyll — à esquerda */}
      <path d="M8 20 H0.8 Q1.2 15.2 5 14.2 L8 14.8 Z" fill={cor(CINZA1)} {...C(0.6)} />
      <path d="M8 14.6 L5.6 14.2 L6.8 17 Z" fill={cor(BRANCO)} {...C(0.35)} />
      <path d="M8 15.4 L7 16 L8 17.8 Z" fill={cor(AZUL)} {...C(0.3)} />
      <path d="M8 2.8 Q4.4 2.8 4.4 8 Q4.4 11.6 6 13.2 Q7 14.2 8 14.2 Z" fill={cor(PELE)} {...C(0.6)} />
      <path d="M8 2.2 Q3.8 2.2 3.8 7.6 Q4.4 5 6 4.8 Q5.6 4 8 4 Z" fill={cor(MARROM)} {...C(0.45)} />
      <path d="M6.2 2.6 Q5.2 3.4 5 4.8" {...L(0.3)} />
      <ellipse cx={4.2} cy={8.6} rx={0.55} ry={1} fill={cor(PELE)} {...C(0.4)} />
      <path d="M5.2 6.8 Q6.2 6.4 7.2 6.8" {...L(0.4)} />
      {olho(6.2, 7.9, 0.45)}
      <path d="M8 7.6 L7.4 10.2 L8 10.3" {...L(0.35)} />
      <path d="M8 11.6 Q7.2 11.9 6.4 11.4" {...L(0.4)} />
      {/* Hyde — à direita */}
      <path d="M8 20 H15.2 Q14.8 15 11 14 L8 14.8 Z" fill={cor(TERRA)} {...C(0.6)} />
      <path d="M9 15.2 L10.4 17.4 M12.4 15 L11.6 18" {...L(0.35)} />
      <path d="M8 2.8 Q11.8 2.8 12 8 Q12.2 11.8 10.8 13 Q9.6 14.2 8 14.2 Z" fill={cor(VERDOSO)} {...C(0.6)} />
      <path d="M8 2.2 L9.4 0.8 L10 2.4 L11.6 1 L11.6 2.8 L13.2 2.4 L12.4 4.2 L13.4 5.4 L12.2 6 L12.4 7.8 Q11.4 5.2 9.6 4.8 L8 4.4 Z" fill={tinta} {...C(0.4)} />
      <ellipse cx={12.1} cy={8.6} rx={0.6} ry={1} fill={cor(VERDOSO)} {...C(0.4)} />
      <path d="M8.4 6.4 L10.8 7 L11.2 6.4" stroke={tinta} strokeWidth={s(0.75)} fill="none" strokeLinecap="round" />
      <ellipse cx={9.9} cy={7.9} rx={0.62} ry={0.42} fill={cor(AMARELO)} {...C(0.3)} /><circle cx={9.9} cy={7.9} r={0.22} fill={tinta} />
      <path d="M8 10.6 L10.6 10.2 Q10.8 11.4 10.4 12 Q9.2 12.6 8 12.4 Z" fill={tinta} />
      <path d="M8.1 10.6 L8.5 11.2 L8.9 10.5 L9.3 11.2 L9.7 10.4 L10.1 11 L10.5 10.3 Z M8.1 12.3 L8.6 11.8 L9.1 12.3 L9.6 11.7 L10.2 12.1 Z" fill={cor(BRANCO)} />
      <path d="M9 9.8 L8.4 9.4" {...L(0.3)} />
      {[[9.6, 13], [10.6, 12.6], [11, 11.4], [11.4, 10.4], [9, 13.6]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r={0.16} fill={tinta} />)}
      {/* o rasgo do meio */}
      <path d="M8 0.6 L8.4 2.4 L7.7 4 L8.3 6 L7.8 8 L8.3 10 L7.8 12.4 L8.3 14.6 L7.8 17 L8.2 20" {...L(0.5)} />
    </g>;

    /* ================================================================ O Homem Invisível (Wells, 1897) */
    case 'homem_invisivel': return <g>
      <path d="M1 20 Q1.4 15 4.6 13.4 L6 12.4 L8 14.4 L10 12.4 L11.4 13.4 Q14.6 15 15 20 Z" fill={cor(MARROM)} {...C(0.6)} />
      <path d="M4.6 13.4 L3.8 10.4 L6.4 12 Z M11.4 13.4 L12.2 10.4 L9.6 12 Z" fill={cor(MARROM)} {...C(0.5)} />
      <path d="M6 12.4 L8 14.4 L10 12.4" {...L(0.4)} />
      <path d="M6.2 12.6 Q8 13.6 9.8 12.6" fill="none" stroke={tinta} strokeWidth={s(0.3)} strokeDasharray={`${s(0.5)} ${s(0.5)}`} />
      <path d="M8 4 Q11.2 4 11.2 8 Q11.2 10.4 10.4 11.2 L5.6 11.2 Q4.8 10.4 4.8 8 Q4.8 4 8 4 Z" fill={cor(BRANCO)} {...C(0.6)} />
      {[5.6, 6.6, 9.4, 10.4].map((y, k) => <path key={k} d={`M${f(4.9 + (k === 0 ? 0.4 : 0))} ${y} Q8 ${y + 0.7} ${f(11.1 - (k === 0 ? 0.4 : 0))} ${y - 0.3}`} {...L(0.3)} />)}
      <path d="M5.4 4.8 L10.6 6 M5 7.4 L7 8.2 M9.4 8 L11.2 7.6" {...L(0.25)} opacity={0.7} />
      <path d="M5.6 11.2 Q8 12 10.4 11.2" fill="none" stroke={tinta} strokeWidth={s(0.35)} strokeDasharray={`${s(0.5)} ${s(0.5)}`} />
      <path d="M10.4 10.4 Q12.4 11.4 13 13 Q13.6 14.6 14.8 14.8 Q13.2 15.6 12.4 14 Q11.8 12.4 10.2 11.4 Z" fill={cor(BRANCO)} {...C(0.4)} />
      <circle cx={6.4} cy={8} r={1.3} fill={cor(AZUL)} {...C(0.55)} /><circle cx={9.6} cy={8} r={1.3} fill={cor(AZUL)} {...C(0.55)} />
      <path d="M7.7 8 H8.3 M5.1 7.8 L4.6 7.6 M10.9 7.8 L11.4 7.6" {...L(0.4)} />
      <path d="M5.9 7.5 l0.6 -0.4 M9.1 7.5 l0.6 -0.4" stroke={cor(BRANCO)} strokeWidth={s(0.35)} strokeLinecap="round" />
      <path d="M7.5 9 Q8 8.6 8.5 9 L8.6 10 Q8 10.4 7.4 10 Z" fill={cor(ROSA)} {...C(0.35)} />
      <path d="M2.4 5 Q8 6.2 13.6 5 Q14 4 12.8 3.8 Q8 4.8 3.2 3.8 Q2 4 2.4 5 Z" fill={cor(CINZA1)} {...C(0.5)} />
      <path d="M4.6 4.2 Q4.4 1 8 1 Q11.6 1 11.4 4.2 Q8 5 4.6 4.2 Z" fill={cor(CINZA1)} {...C(0.55)} />
      <path d="M4.8 3.4 Q8 4.2 11.2 3.4" fill="none" stroke={cor(CINZA3)} strokeWidth={s(0.45)} />
      <path d="M7 1.4 Q8 2 9 1.4" {...L(0.3)} />
    </g>;

    /* ================================================================ A Guerra dos Mundos (Wells, 1898) */
    case 'tripode_marciano': return <g>
      <path d="M0.4 19.6 L1 16.4 L2.4 16.4 L2.4 15 L3.6 14 L4.8 15 L4.8 16.4 L6.4 16.4 L6.4 19.6 Z" fill={cor(CINZA2)} {...C(0.45)} />
      <path d="M0.4 16.6 Q-0.4 13.4 1.4 12.6 Q1.4 14.2 2.4 14.4 Q2.4 11.6 4 10.6 Q3.8 13 5.2 13.6 Q6.2 12.6 6 11.4 Q7.6 13.6 6.6 16.6 Z" fill={cor(LARANJA)} {...C(0.4)} />
      <path d="M1.6 16.4 Q1.4 14.8 2.4 14.6 Q2.8 15.4 3.4 15.2 Q3.4 13.6 4.2 13 Q4.6 14.6 5.4 15 Q5.8 15.8 5.4 16.4 Z" fill={cor(AMARELO)} />
      <path d="M0.4 19.6 H15.6" {...L(0.5)} />
      <path d="M9.6 6.6 L7.4 13 L5.6 19.4 M10.8 7 L11 13.4 L10 19.4 M12 6.6 L14.4 12.6 L15.2 19.4" stroke={cor(CINZA1)} strokeWidth={s(0.9)} fill="none" strokeLinejoin="round" />
      <path d="M9.6 6.6 L7.4 13 L5.6 19.4 M10.8 7 L11 13.4 L10 19.4 M12 6.6 L14.4 12.6 L15.2 19.4" {...L(0.25)} />
      {[[7.4, 13], [11, 13.4], [14.4, 12.6]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r={0.6} fill={cor(CINZA2)} {...C(0.35)} />)}
      <path d="M4.6 19.4 h2 M9 19.4 h2 M14.2 19.4 h2" {...L(0.6)} />
      <path d="M10 7 Q9.2 9.4 9.8 10.8 Q10.4 9.6 10.4 7.4 M11.8 7 Q12.6 9 12.2 10.6 Q11.6 9.4 11.4 7.4" fill="none" stroke={cor(CINZA1)} strokeWidth={s(0.4)} strokeLinecap="round" />
      <path d="M6.6 4.6 Q8 0.8 11.6 0.8 Q15.4 0.8 15.4 4.4 L14.6 6.2 Q11 7.8 7.6 6.6 Z" fill={cor(PRATA)} {...C(0.6)} />
      <path d="M7.4 5 Q11 6.4 14.8 4.8" {...L(0.35)} />
      <path d="M10.6 1.4 Q9 2 8.4 3.6" fill="none" stroke={cor(BRANCO)} strokeWidth={s(0.45)} strokeLinecap="round" />
      <path d="M7.2 5.4 L5.2 6.4 L5.6 7.8 L7.6 6.6" fill={cor(CINZA2)} {...C(0.4)} />
      <path d="M5.2 7 L3.6 13.4" stroke={cor(AMARELO)} strokeWidth={s(2.2)} strokeLinecap="round" opacity={0.35} />
      <path d="M5.2 7 L3.6 13.4" stroke={cor(LARANJA)} strokeWidth={s(0.9)} strokeLinecap="round" />
      <path d="M5.2 7 L3.6 13.4" stroke={cor(BRANCO)} strokeWidth={s(0.3)} strokeLinecap="round" />
      <circle cx={5.2} cy={7} r={0.5} fill={cor(AMARELO)} {...C(0.3)} />
    </g>;
    case 'marciano_de_tentaculos': return <g>
      <ellipse cx={10} cy={17.4} rx={9.2} ry={2.2} fill={cor(CINZA2)} {...C(0.6)} />
      <ellipse cx={10} cy={17} rx={7.6} ry={1.4} fill={tinta} />
      <path d="M3.6 13.6 Q2.4 3.4 10 2.6 Q17.6 3.4 16.4 13.6 Q10 15.6 3.6 13.6 Z" fill={cor(MARCIANO)} {...C(0.7)} />
      <path d="M6.4 4.6 Q4.8 6 4.8 8.4" fill="none" stroke={cor(BRANCO)} strokeWidth={s(0.6)} strokeLinecap="round" opacity={0.8} />
      <ellipse cx={7.2} cy={8.6} rx={1.8} ry={1.7} fill={tinta} /><ellipse cx={12.8} cy={8.6} rx={1.8} ry={1.7} fill={tinta} />
      <path d="M5.2 8.2 Q7.2 6.2 9.2 8.2 Q7.2 7.4 5.2 8.2 Z M10.8 8.2 Q12.8 6.2 14.8 8.2 Q12.8 7.4 10.8 8.2 Z" fill={cor(MARCIANO)} {...C(0.4)} />
      <circle cx={7.8} cy={9.2} r={0.3} fill={cor(BRANCO)} /><circle cx={13.4} cy={9.2} r={0.3} fill={cor(BRANCO)} />
      <path d="M4.8 7 Q7 5.4 9 6.6 M15.2 7 Q13 5.4 11 6.6" {...L(0.3)} opacity={0.6} />
      <path d="M7 11 Q8.6 11.8 10 12.3 Q11.4 11.8 13 11 L10 14 Z" fill={tinta} {...C(0.45)} />
      <path d="M8.6 12 L9 12.8 M11.4 12 L11 12.8" stroke={cor(MARCIANO)} strokeWidth={s(0.3)} />
      <path d="M10 13.4 q-0.2 0.6 0 1" fill="none" stroke={cor(CELESTE)} strokeWidth={s(0.4)} strokeLinecap="round" />
      {[-1, 1].map(d => ([[1.3, 13.8, 1.8, 19.4], [2.3, 13.7, 4.4, 19.2], [3.3, 13.5, 6.9, 18.4], [4.2, 13.2, 9.2, 16.4]] as const).map(([a0, y0, a2, y2], k) => {
        const x0 = 10 + d * a0, x2 = 10 + d * a2, mx = (x0 + x2) / 2, my = (y0 + y2) / 2, dx = x2 - x0, dy = y2 - y0, n = Math.hypot(dx, dy), w = (k % 2 ? 1 : -1) * 1;
        const cx = x0 + dx * 0.25 - (dy / n) * w, cy = y0 + dy * 0.25 + (dx / n) * w;
        const t = `M${f(x0)} ${y0} Q${f(cx)} ${f(cy)} ${f(mx)} ${f(my)} T${f(x2)} ${y2} q${f(d * 0.7)} ${0.1} ${f(d * 0.6)} ${-0.8}`;
        return <g key={`${d}${k}`}>
          <path d={t} stroke={tinta} strokeWidth={s(1.15)} fill="none" strokeLinecap="round" />
          <path d={t} stroke={cor(TERRA)} strokeWidth={s(0.55)} fill="none" strokeLinecap="round" />
        </g>;
      }))}
    </g>;

    /* ================================================================ Vinte Mil Léguas Submarinas (Verne, 1870; Neuville e Riou) */
    case 'capitao_nemo': return <g>
      <circle cx={8} cy={10} r={7.6} fill={cor(TURQUESA)} {...C(0.8)} />
      <path d={ondas(1.2, 14.8, 15.4, 0.4, 5)} fill="none" stroke={cor(CELESTE)} strokeWidth={s(0.35)} />
      <path d="M1.8 6 l1 -0.6 l-0.2 1.2 Z M13 4.6 l1.2 0.6 l-1.2 0.5 Z" fill={cor(CELESTE)} />
      <path d="M2.8 16 Q3.4 12.6 6.2 12 L8 13 L9.8 12 Q12.6 12.6 13.2 16 Q8 19.6 2.8 16 Z" fill={cor(AZUL)} {...C(0.55)} />
      <path d="M6.6 12.2 L8 15.4 L9.4 12.2" {...L(0.4)} />
      {[14, 15.4].map((y, k) => <g key={k}><circle cx={6.6} cy={y} r={0.3} fill={cor(OURO)} /><circle cx={9.4} cy={y} r={0.3} fill={cor(OURO)} /></g>)}
      <path d="M8 3.6 Q10.6 3.6 10.6 7.2 Q10.6 9 9.6 10 L6.4 10 Q5.4 9 5.4 7.2 Q5.4 3.6 8 3.6 Z" fill={cor(PELE)} {...C(0.55)} />
      <path d="M5.3 6.6 Q5 3.2 8 3.1 Q11 3.2 10.7 6.6 Q10.2 4.8 8 4.8 Q5.8 4.8 5.3 6.6 Z" fill={tinta} {...C(0.35)} />
      <path d="M5.4 7.4 Q5.2 11 6.8 12.4 Q8 13 9.2 12.4 Q10.8 11 10.6 7.4 Q10.2 9 9.6 8.8 Q8 8.6 6.4 8.8 Q5.8 9 5.4 7.4 Z" fill={tinta} {...C(0.35)} />
      <path d="M7.2 10.2 Q8 10.6 8.8 10.2" stroke={cor(PELE)} strokeWidth={s(0.35)} strokeLinecap="round" fill="none" />
      <path d="M6.2 6.2 l1.2 0.2 M8.6 6.4 l1.2 -0.2" {...L(0.4)} />
      <circle cx={6.9} cy={7.1} r={0.28} fill={tinta} /><circle cx={9.1} cy={7.1} r={0.28} fill={tinta} />
      <path d="M8 6.8 L7.7 8.4 H8.3" {...L(0.3)} />
      <circle cx={8} cy={10} r={7.6} {...L(0.8)} />
      <circle cx={8} cy={10} r={7.9} fill="none" stroke={cor(OURO)} strokeWidth={s(0.9)} opacity={0.9} />
      <circle cx={8} cy={10} r={8.4} {...L(0.4)} />
      {noCirculo(8, 10, 7.95, 12).map(([x, y], k) => <circle key={k} cx={x} cy={y} r={0.32} fill={tinta} />)}
    </g>;
    case 'nautilus_e_lula': { const y = 9; return <g>
      <path d={ondas(0.4, 19.6, 2, 0.5, 6)} fill="none" stroke={cor(CELESTE)} strokeWidth={s(0.4)} />
      <path d={`M0.6 ${y} L3 ${y - 0.4} Q4 ${y - 2.4} 9 ${y - 2.4} Q13.6 ${y - 2.2} 15.4 ${y} Q13.6 ${y + 2.2} 9 ${y + 2.4} Q4 ${y + 2.4} 3 ${y + 0.4} Z`} fill={cor(CINZA2)} {...C(0.6)} />
      <path d={`M3.4 ${y} H14.6`} {...L(0.3)} opacity={0.6} />
      <path d={`M7.4 ${y - 2.3} L7.8 ${y - 3.4} H10.4 L10.8 ${y - 2.3}`} fill={cor(CINZA1)} {...C(0.45)} />
      {[5.4, 8, 10.6].map((x, k) => <circle key={k} cx={x} cy={y + 0.9} r={0.55} fill={cor(AMARELO)} {...C(0.3)} />)}
      <path d={`M15.4 ${y} l1.6 -1 v2 Z`} fill={cor(CINZA1)} {...C(0.35)} />
      {[[3.6, 4.4], [5.4, 13.6], [9.6, 13.8], [12.6, 4]].map(([x, yy], k) => <g key={k}>
        <path d={`M14 ${y + 0.6} Q${x} ${f(y + (yy - y) * 1.6)} ${x} ${yy} q${k % 2 ? -1.4 : 1.2} ${k < 2 ? -0.4 : 0.6} ${k % 2 ? -1 : 0.8} ${k < 2 ? -1.6 : 1}`} stroke={tinta} strokeWidth={s(1.4)} fill="none" strokeLinecap="round" />
        <path d={`M14 ${y + 0.6} Q${x} ${f(y + (yy - y) * 1.6)} ${x} ${yy} q${k % 2 ? -1.4 : 1.2} ${k < 2 ? -0.4 : 0.6} ${k % 2 ? -1 : 0.8} ${k < 2 ? -1.6 : 1}`} stroke={cor(VERMELHO)} strokeWidth={s(0.75)} fill="none" strokeLinecap="round" />
      </g>)}
      <path d={`M13.4 ${y + 2} Q12 ${y + 5} 13.6 ${y + 6} M15 ${y + 2.4} Q15.4 ${y + 5.4} 17.4 ${y + 5.6}`} stroke={tinta} strokeWidth={s(1.2)} fill="none" strokeLinecap="round" />
      <path d={`M13.4 ${y + 2} Q12 ${y + 5} 13.6 ${y + 6} M15 ${y + 2.4} Q15.4 ${y + 5.4} 17.4 ${y + 5.6}`} stroke={cor(VERMELHO)} strokeWidth={s(0.6)} fill="none" strokeLinecap="round" />
      <path d="M17.4 2.6 L15.4 1.6 L18.6 0.6 Z M19.6 4.8 L19.8 1.4 L18.6 0.6 Z" fill={cor(VERMELHO)} {...C(0.4)} />
      <path d="M13.4 10.6 Q13 7.8 15 6.8 Q15.8 3.2 18.6 0.6 Q20 2.4 19.6 5 Q19.2 8.4 17.8 9.8 Q16 11.4 13.4 10.6 Z" fill={cor(VERMELHO)} {...C(0.6)} />
      <path d="M15.4 6.6 Q17 7.2 18.4 6.4" {...L(0.3)} opacity={0.6} />
      <ellipse cx={15.6} cy={y - 0.2} rx={1.3} ry={1.1} fill={cor(AMARELO)} {...C(0.4)} /><ellipse cx={15.4} cy={y - 0.2} rx={0.5} ry={0.8} fill={tinta} />
      <path d="M18.6 2.4 Q19 4 18.6 5.6" fill="none" stroke={cor(ROSA)} strokeWidth={s(0.45)} strokeLinecap="round" />
      {[[17.6, 7.6], [18.4, 6.8], [17.4, 4.4]].map(([x, yy], k) => <circle key={k} cx={x} cy={yy} r={0.3} fill={cor(ROSA)} />)}
    </g>; }

    /* ================================================================ A Ilha do Tesouro (Stevenson, 1883; Wyeth) */
    case 'long_john_silver': return <g>
      <path d="M3 9 L1.6 19.6" stroke={cor(MARROM)} strokeWidth={s(0.9)} strokeLinecap="round" />
      <path d="M3 9 L1.6 19.6" {...L(0.25)} />
      <path d="M1.8 8.8 Q3 8.2 4.4 8.8" stroke={tinta} strokeWidth={s(0.8)} strokeLinecap="round" fill="none" />
      <path d="M5.2 14 L5.4 18.6 L4.6 19.6 H7 L6.8 14 Z" fill={cor(CINZA1)} {...C(0.45)} />
      <path d="M8.8 14 L9 16.4 L9.2 19.6" stroke={cor(MARROM)} strokeWidth={s(1.1)} strokeLinecap="round" />
      <path d="M8.8 14 L9 16.4 L9.2 19.6" {...L(0.25)} />
      <path d="M8.4 14 H10 V15.4 H8.6 Z" fill={cor(CINZA1)} {...C(0.4)} />
      <path d="M4.6 7 Q7.4 6 10.2 7 L11.2 15 Q7.6 15.8 3.6 15 Z" fill={cor(AZUL)} {...C(0.6)} />
      <path d="M6.6 6.8 L7.4 9.6 L8.2 6.8" fill={cor(BRANCO)} {...C(0.35)} />
      <path d="M7.4 9.6 V15.2" {...L(0.35)} />
      <rect x={3.9} y={11.4} width={7} height={0.9} fill={cor(MARROM)} {...C(0.35)} />
      <rect x={6.9} y={11.3} width={1} height={1.1} fill={cor(OURO)} {...C(0.25)} />
      {[8.6, 10, 13.4].map((yy, k) => <circle key={k} cx={k === 2 ? 6.6 : 6.6} cy={yy} r={0.25} fill={cor(OURO)} />)}
      <path d="M4.6 7.2 Q3.2 8 3.4 9.6 L4.6 9.4" fill={cor(AZUL)} {...C(0.45)} />
      <path d="M10.2 7.2 Q11.6 8.6 11.4 11 L10.4 11.4" fill={cor(AZUL)} {...C(0.45)} />
      <circle cx={10.9} cy={11.4} r={0.6} fill={cor(PELE)} {...C(0.35)} />
      <circle cx={7.4} cy={4.6} r={2.1} fill={cor(PELE)} {...C(0.55)} />
      <circle cx={6.7} cy={4.5} r={0.25} fill={tinta} /><circle cx={8.1} cy={4.5} r={0.25} fill={tinta} />
      <path d="M6.6 5.6 Q7.4 6.2 8.2 5.6" {...L(0.35)} />
      <path d="M4.6 5 Q4.4 6.4 5.6 6.8 M10.2 5 Q10.4 6.4 9.2 6.8" fill="none" stroke={cor(MARROM)} strokeWidth={s(0.6)} strokeLinecap="round" />
      <path d="M3.8 3.4 Q7.4 0.2 11 3.4 Q9.6 3.8 7.4 3.4 Q5.2 3.8 3.8 3.4 Z" fill={tinta} {...C(0.4)} />
      <path d="M3.8 3.4 L3.2 2.4 L5 2.8 M11 3.4 L11.6 2.4 L9.8 2.8" fill={tinta} {...C(0.4)} />
      <path d="M5 3 Q7.4 2.4 9.8 3" fill="none" stroke={cor(OURO)} strokeWidth={s(0.3)} />
      {/* o papagaio Capitão Flint */}
      <path d="M10 7.2 Q9.6 5.4 11 4.6 Q12.6 4.4 12.8 6 Q12.8 7.6 11.6 8.4 L12.6 11.4 L11.4 10.6 L10.8 11.8 L10.6 8.6 Z" fill={cor(VERDE_CLARO)} {...C(0.5)} />
      <path d="M11 7 Q11.8 7.6 12.4 6.8 L11.6 9" fill={cor(VERDE)} {...C(0.3)} />
      <path d="M12.6 5.2 Q13.6 5.4 13.4 6.4 Q13 6 12.6 6.2 Z" fill={cor(AMARELO)} {...C(0.35)} />
      <circle cx={11.8} cy={5.4} r={0.25} fill={tinta} />
      <path d="M10.4 5 Q10.6 4 11.4 4" fill="none" stroke={cor(VERMELHO)} strokeWidth={s(0.5)} strokeLinecap="round" />
    </g>;

    /* ================================================================ O Corvo (Poe, 1845) */
    case 'corvo_no_busto': return <g>
      <rect x={0.4} y={17.8} width={14.2} height={1.8} fill={cor(MARROM)} {...C(0.5)} />
      <path d="M1 17.8 H14 M2.2 19.6 V18.6 M12.8 19.6 V18.6" {...L(0.3)} />
      <path d="M4 17.8 L4.4 16.4 H10.6 L11 17.8 Z" fill={cor(BRANCO)} {...C(0.45)} />
      <g transform="matrix(1 0 0 0.9 0 1.64)">
        <path d="M4.6 16.4 Q4.4 14.4 6 13.6 L6.8 12 Q5.2 11.4 5 9.6 L4.2 9.4 L5 8.6 Q4.8 6.4 7 5.8 Q9.6 5.6 10.4 7.6 Q10.8 9.6 9.8 11.4 L9.4 13.2 Q11 14 10.6 16.4 Z" fill={cor(BRANCO)} {...C(0.55)} />
        <path d="M5.5 8.4 L4.2 9.4 L5 9.6 M6 10.6 Q6.4 10.8 6.8 10.6" {...L(0.3)} />
        <path d="M5.6 8.4 Q6.1 8.1 6.6 8.4" {...L(0.3)} />
        <path d="M8 14 Q7.2 15 8.6 15.6 M7.6 12.8 Q8.4 13.2 9 12.6" {...L(0.3)} opacity={0.6} />
        <path d="M9.4 9 Q10 10 9.6 11.2 M10.2 8.4 Q11 9.4 10.6 10.6" {...L(0.25)} opacity={0.6} />
        <path d="M4.8 8 Q4.6 4.8 7.8 4.6 Q10.8 4.8 11 8 Q9.6 7 8 7.1 Q6.2 7.2 4.8 8 Z" fill={cor(CINZA3)} {...C(0.5)} />
        <path d="M4.8 8 L3.8 7.6 L4.9 7.1" fill={cor(CINZA3)} {...C(0.4)} />
        <path d="M5.4 5.8 Q8.4 3.4 11.6 5.8 Q12.4 7 11.8 8.8" fill="none" stroke={tinta} strokeWidth={s(1.6)} strokeLinecap="round" />
        <path d="M5.4 5.8 Q8.4 3.4 11.6 5.8 Q12.4 7 11.8 8.8" fill="none" stroke={cor(VERMELHO)} strokeWidth={s(0.9)} strokeLinecap="round" />
      </g>
      {/* o corvo */}
      <path d="M6.4 4.4 Q6.6 2 8.6 1.6 L9.2 0.8 Q10.6 0.6 11 1.6 L12.6 2 L11.2 2.4 Q11.8 4.4 10.4 5.4 L13.6 7.4 Q11.4 7.6 9.6 6.4 Q7.4 6 6.4 4.4 Z" fill={tinta} {...C(0.4)} />
      <path d="M8.2 3 Q9.6 2.8 10.6 4.2" fill="none" stroke={cor(CINZA2)} strokeWidth={s(0.3)} />
      <circle cx={10.2} cy={1.6} r={0.25} fill={cor(BRANCO)} />
      <path d="M8.2 5.4 L7.8 6.2 M9.2 5.6 L9.2 6.4" {...L(0.4)} />
    </g>;

    /* ================================================================ O Chamado de Cthulhu (Lovecraft, 1928; esboço de 1934) */
    case 'cthulhu_do_esboco': return <g>
      <path d="M1.6 19.6 V16.6 H14.4 V19.6 Z" fill={cor(CINZA2)} {...C(0.55)} />
      <path d="M2.6 18 h2 M6.4 17.6 l1 1 l1 -1 M10.6 18.2 h2.4" {...L(0.3)} />
      <path d="M6.4 8.4 Q3.6 5 1.2 3.4 Q1.6 6 2.4 7.4 Q1.4 7.6 0.6 9.4 Q2.4 9 3.4 9.6 Q3 10.6 3.4 12 Q4.6 10.4 6.4 10.4 Z M9.6 8.4 Q12.4 5 14.8 3.4 Q14.4 6 13.6 7.4 Q14.6 7.6 15.4 9.4 Q13.6 9 12.6 9.6 Q13 10.6 12.6 12 Q11.4 10.4 9.6 10.4 Z" fill={cor(VERDE)} {...C(0.5)} />
      <path d="M6 9 L2.6 5.4 M6 9.4 L2.2 8.8 M10 9 L13.4 5.4 M10 9.4 L13.8 8.8" {...L(0.25)} />
      <path d="M4.6 16.6 Q3.6 14 5 12.2 Q5.4 9.6 8 9.4 Q10.6 9.6 11 12.2 Q12.4 14 11.4 16.6 Z" fill={cor(VERDE)} {...C(0.55)} />
      <path d="M4.6 16.6 Q3.6 13.6 5.4 12.8 L6.6 14.4 Q6.4 15.6 6.8 16.6 Z M11.4 16.6 Q12.4 13.6 10.6 12.8 L9.4 14.4 Q9.6 15.6 9.2 16.6 Z" fill={cor(VERDE_CLARO)} {...C(0.45)} />
      {[[4.6, 1], [11.4, -1]].map(([x, d], k) => <path key={k} d={`M${x} 16.6 l${-d * 0.6} 0.6 M${x + d * 0.6} 16.6 l${-d * 0.2} 0.7 M${x + d * 1.2} 16.6 l${d * 0.2} 0.7`} {...L(0.35)} />)}
      <path d="M5.6 11.6 Q4.4 13 5.2 14.6 M10.4 11.6 Q11.6 13 10.8 14.6" stroke={cor(VERDE)} strokeWidth={s(0.9)} fill="none" strokeLinecap="round" />
      <path d="M5.6 11.6 Q4.4 13 5.2 14.6 M10.4 11.6 Q11.6 13 10.8 14.6" {...L(0.25)} />
      {[[5.2, 14.6, 1], [10.8, 14.6, -1]].map(([x, y, d], k) => <path key={`m${k}`} d={`M${x} ${y} l${d * 0.6} 0.8 M${x} ${y} l${d * 0.05} 1 M${x} ${y} l${-d * 0.5} 0.8`} {...L(0.3)} />)}
      {[[6.6, 12.4], [8, 13.4], [9.4, 12.6], [7.2, 15], [8.8, 15.2]].map(([x, y], k) => <path key={`e${k}`} d={`M${x - 0.4} ${y} q0.4 0.4 0.8 0`} {...L(0.22)} opacity={0.7} />)}
      <path d="M8 1.4 Q11.4 1.6 11.2 5.2 Q11 7.8 9.6 8.6 L6.4 8.6 Q5 7.8 4.8 5.2 Q4.6 1.6 8 1.4 Z" fill={cor(VERDE)} {...C(0.6)} />
      <path d="M6.2 2.6 Q5.4 3.6 5.6 5" fill="none" stroke={cor(VERDE_CLARO)} strokeWidth={s(0.5)} strokeLinecap="round" />
      <ellipse cx={6.7} cy={5.4} rx={0.7} ry={0.5} fill={cor(AMARELO)} {...C(0.3)} /><ellipse cx={9.3} cy={5.4} rx={0.7} ry={0.5} fill={cor(AMARELO)} {...C(0.3)} />
      <path d="M6.7 5 v0.8 M9.3 5 v0.8" {...L(0.3)} />
      {[5.6, 6.6, 7.6, 8.4, 9.4, 10.4].map((x, k) => { const d = (k % 2 ? 1 : -1) * 0.5; return <g key={`t${k}`}>
        <path d={`M${x} 7.6 Q${x + d} 9.4 ${x - d * 0.6} 10.6 Q${x + d} 11.4 ${f(x + d * 0.4)} ${f(12 + (k === 2 || k === 3 ? 0.8 : 0))}`} stroke={tinta} strokeWidth={s(0.9)} fill="none" strokeLinecap="round" />
        <path d={`M${x} 7.6 Q${x + d} 9.4 ${x - d * 0.6} 10.6 Q${x + d} 11.4 ${f(x + d * 0.4)} ${f(12 + (k === 2 || k === 3 ? 0.8 : 0))}`} stroke={cor(VERDE_CLARO)} strokeWidth={s(0.45)} fill="none" strokeLinecap="round" />
      </g>; })}
    </g>;

    /* ================================================================ O Fantasma da Ópera (Leroux, 1910; filme de 1925) */
    case 'erik_sob_o_lustre': return <g>
      <path d="M8 0 V1.4" {...L(0.4)} />
      <path d="M3 3.4 Q8 6 13 3.4 Q12 1.6 8 1.4 Q4 1.6 3 3.4 Z" fill={cor(OURO)} {...C(0.5)} />
      {[3.4, 5.6, 8, 10.4, 12.6].map((x, k) => <g key={k}>
        <path d={`M${x} ${f(3.6 + (k === 2 ? 0.6 : k % 2 ? 0.4 : 0))} v0.5`} {...L(0.3)} />
        <circle cx={x} cy={f(4.4 + (k === 2 ? 0.6 : k % 2 ? 0.4 : 0))} r={0.35} fill={cor(CELESTE)} {...C(0.2)} />
        <path d={`M${x} ${f(2.2 - (k === 2 ? 0.6 : 0))} v-0.8`} stroke={cor(AMARELO)} strokeWidth={s(0.45)} strokeLinecap="round" />
      </g>)}
      <g transform="matrix(0.86 0 0 0.86 1.12 2.8)">
      <path d="M0.4 20 Q0.6 13.4 3.6 11.2 L8 12 L12.4 11.2 Q15.4 13.4 15.6 20 Z" fill={tinta} {...C(0.5)} />
      <path d="M3.6 11.2 L1.4 9.4 Q2 12 2.2 13.4 Z M12.4 11.2 L14.6 9.4 Q14 12 13.8 13.4 Z" fill={tinta} {...C(0.4)} />
      <path d="M5.4 20 Q5.6 15 6.4 12.4 L8 13 L9.6 12.4 Q10.4 15 10.6 20 Z" fill={cor(CINZA1)} {...C(0.4)} />
      <path d="M6.8 12.4 L8 16.4 L9.2 12.4 Z" fill={cor(BRANCO)} {...C(0.35)} />
      <path d="M7.2 12.6 L8 13.2 L8.8 12.6 L8.8 13.6 L8 13.2 L7.2 13.6 Z" fill={tinta} />
      <path d="M8 6.2 Q10.4 6.2 10.4 9 Q10.4 11.4 8 11.8 Q5.6 11.4 5.6 9 Q5.6 6.2 8 6.2 Z" fill={cor(PALIDO)} {...C(0.5)} />
      <path d="M5.6 9.4 Q5.4 6.2 8 6.1 Q10.6 6.2 10.4 9.4 L9.8 10.6 Q8 10.2 6.2 10.6 Z" fill={tinta} {...C(0.35)} />
      <ellipse cx={7} cy={8.4} rx={0.55} ry={0.38} fill={cor(AMARELO)} /><ellipse cx={9} cy={8.4} rx={0.55} ry={0.38} fill={cor(AMARELO)} />
      <circle cx={7} cy={8.4} r={0.16} fill={cor(LARANJA)} /><circle cx={9} cy={8.4} r={0.16} fill={cor(LARANJA)} />
      <path d="M7.2 11.1 Q8 10.9 8.8 11.1" {...L(0.3)} />
      <path d="M4 7.2 Q8 8 12 7.2 Q12.2 6.4 11.2 6.2 Q8 6.8 4.8 6.2 Q3.8 6.4 4 7.2 Z" fill={tinta} {...C(0.4)} />
      <path d="M5.6 6.4 Q5.6 3.6 8 3.6 Q10.4 3.6 10.4 6.4 Q8 7 5.6 6.4 Z" fill={tinta} {...C(0.4)} />
      <path d="M5.7 5.8 Q8 6.4 10.3 5.8" fill="none" stroke={cor(CINZA2)} strokeWidth={s(0.35)} />
      </g>
    </g>;

    /* ================================================================ O Corcunda de Notre-Dame (Hugo, 1831) */
    case 'quasimodo_nos_sinos': return <g>
      <path d="M13 0.2 V1" {...L(0.5)} />
      <path d="M10 6 Q10.8 5 10.8 3 Q11 1 13 1 Q15 1 15.2 3 Q15.2 5 16 6 Q13 6.8 10 6 Z" fill={cor(OURO)} {...C(0.55)} />
      <path d="M10.8 4.6 Q13 5.2 15.2 4.6" {...L(0.3)} />
      <path d="M11.8 2 Q11.5 3.2 11.7 4.2" fill="none" stroke={cor(AMARELO)} strokeWidth={s(0.45)} strokeLinecap="round" />
      <circle cx={13} cy={6.6} r={0.55} fill={cor(CINZA1)} {...C(0.35)} />
      <path d="M13 7 V19.8" stroke={cor(AREIA)} strokeWidth={s(0.8)} strokeLinecap="round" />
      <path d="M13 7 V19.8" stroke={tinta} strokeWidth={s(0.22)} strokeDasharray={`${s(0.6)} ${s(0.5)}`} />
      {/* a corcunda subindo atrás do ombro */}
      <path d="M0.4 20 L0.4 14.4 Q-0.2 8.8 2.8 8.2 Q5.4 8 5.8 11.4 L8 13.6 L10.4 12.8 Q12.6 13.6 13 16.4 L13.4 20 Z" fill={cor(TERRA)} {...C(0.6)} />
      <path d="M1.2 13.2 Q1.2 9.6 3.2 9.2" {...L(0.35)} opacity={0.7} />
      <path d="M5.6 13.2 Q8 15.2 10.6 13" {...L(0.4)} />
      <path d="M3.4 16.6 Q4.6 18.2 4.4 20 M8 15 V20" {...L(0.3)} opacity={0.6} />
      <ellipse cx={8} cy={10.6} rx={2.9} ry={3} fill={cor(PELE)} {...C(0.6)} />
      <path d="M5 10.2 Q4.6 7.2 8 7.2 Q11.4 7.2 11 10.2 L10.4 8.8 L9.9 9.8 L9.3 8.4 L8.7 9.4 L8 8.2 L7.4 9.4 L6.8 8.4 L6.2 9.6 L5.6 8.8 Z" fill={cor(LARANJA)} {...C(0.4)} />
      <path d="M5.8 10 Q6.8 9 7.8 9.9" stroke={tinta} strokeWidth={s(1.05)} fill="none" strokeLinecap="round" />
      <path d="M5.8 10 Q6.8 9 7.8 9.9" stroke={cor(LARANJA)} strokeWidth={s(0.55)} fill="none" strokeLinecap="round" />
      <circle cx={6.8} cy={10.6} r={0.28} fill={tinta} />
      <circle cx={9.5} cy={10.1} r={1.1} fill={cor(TERRA_PELE)} {...C(0.45)} />
      <path d="M9.1 9.8 l0.15 0.1 M9.8 10.4 l0.15 0.1 M9.7 9.6 l0.1 0.1" {...L(0.25)} />
      <path d="M8.2 10.6 L7.5 12.1 L8.8 12.1 Z" fill={cor(PELE)} {...C(0.4)} />
      <path d="M6.5 13.6 Q8 11.9 9.5 13.6 Z" fill={tinta} {...C(0.4)} />
      <path d="M6.9 13.5 L7.2 12.9 L7.5 13.4 L7.8 12.7 L8.2 13.4 L8.5 12.8 L8.8 13.3 L9.1 13 L9.2 13.5 Z" fill={cor(BRANCO)} />
      <path d="M8 13.6 v0.5" {...L(0.3)} />
      <path d="M11 14.4 Q12 12.4 12.4 11.4" stroke={tinta} strokeWidth={s(1.9)} fill="none" strokeLinecap="round" />
      <path d="M11 14.4 Q12 12.4 12.4 11.4" stroke={cor(TERRA)} strokeWidth={s(1.3)} fill="none" strokeLinecap="round" />
      <ellipse cx={13} cy={11} rx={1.05} ry={0.95} fill={cor(PELE)} {...C(0.4)} />
      <path d="M12.3 10.8 Q13 11.5 13.7 10.8" {...L(0.22)} />
    </g>;

    /* ================================================================ Moby Dick (Melville, 1851) */
    case 'capitao_ahab': return <g>
      <path d="M0.4 19.6 H13.6" {...L(0.5)} />
      <path d="M1 19.6 L2 18.4 M4.4 19.6 L5 18.6 M10.6 19.6 L11.4 18.4" {...L(0.3)} opacity={0.6} />
      <path d="M11.4 0.6 V19.4" stroke={cor(MARROM)} strokeWidth={s(0.75)} strokeLinecap="round" />
      <path d="M11.4 0.6 V19.4" {...L(0.2)} />
      <path d="M11.4 0.2 L10.4 2.8 L11.4 2.2 L12.4 2.8 Z" fill={cor(PRATA)} {...C(0.4)} />
      <path d="M10.6 3.8 L12.2 3.6" {...L(0.4)} />
      <path d="M5 14 L4.8 18.6 L3.6 19.6 H6.2 L6.4 14 Z" fill={cor(CINZA1)} {...C(0.45)} />
      <path d="M7.8 14 L8.4 19.4" stroke={cor(BRANCO)} strokeWidth={s(1.1)} strokeLinecap="round" />
      <path d="M7.4 14 L8 19.6 M8.6 14 L8.8 19.6" {...L(0.25)} />
      <path d="M3.8 7 Q6.6 6 9.4 7 L10.4 15 Q6.6 15.8 3 15 Z" fill={cor(CINZA1)} {...C(0.6)} />
      <path d="M5.8 6.8 L6.6 9.4 L7.4 6.8" fill={cor(CREME)} {...C(0.35)} />
      <path d="M6.6 9.4 V15.4" {...L(0.3)} opacity={0.7} />
      <path d="M3.8 7.2 Q2.6 9.6 3.4 12 L4.4 11.8" fill={cor(CINZA1)} {...C(0.45)} />
      <path d="M9.4 7.2 Q10.6 7.6 11 6.8 L11.4 7.4" stroke={cor(CINZA1)} strokeWidth={s(1)} fill="none" strokeLinecap="round" />
      <path d="M9.4 7.2 Q10.6 7.6 11 6.8" {...L(0.25)} />
      <ellipse cx={11.4} cy={7} rx={0.6} ry={0.75} fill={cor(PELE)} {...C(0.35)} />
      <circle cx={4} cy={12} r={0.55} fill={cor(PELE)} {...C(0.35)} />
      <path d="M6.6 1.6 Q8.6 1.6 8.6 4 Q8.6 5.6 7.6 6.2 L5.6 6.2 Q4.6 5.6 4.6 4 Q4.6 1.6 6.6 1.6 Z" fill={cor(PELE)} {...C(0.55)} />
      <path d="M4.4 4 Q4.2 1.2 6.6 1 Q9 1.2 8.8 4 Q8.2 2.4 6.6 2.4 Q5 2.4 4.4 4 Z" fill={cor(CINZA3)} {...C(0.4)} />
      <path d="M4.6 4.4 Q4.4 7.6 6.6 7.8 Q8.8 7.6 8.6 4.4 Q8.2 5.6 7.6 5.4 Q6.6 5.2 5.6 5.4 Q5 5.6 4.6 4.4 Z" fill={cor(CINZA3)} {...C(0.4)} />
      <path d="M5.4 3.4 l0.9 0.2 M6.9 3.6 l0.9 -0.2" {...L(0.4)} />
      <circle cx={5.9} cy={4} r={0.22} fill={tinta} /><circle cx={7.3} cy={4} r={0.22} fill={tinta} />
      <path d="M6.6 6.4 Q6.2 5.9 7 5.9" {...L(0.25)} />
      <path d="M7.8 1.2 L7.5 3.2 L7.8 4.4 L7.5 5.4" fill="none" stroke={tinta} strokeWidth={s(0.55)} strokeLinecap="round" />
      <path d="M7.8 1.2 L7.5 3.2 L7.8 4.4 L7.5 5.4" fill="none" stroke={cor(BRANCO)} strokeWidth={s(0.28)} strokeLinecap="round" />
      <path d="M7.4 7.8 L7.2 9.2" fill="none" stroke={cor(BRANCO)} strokeWidth={s(0.3)} strokeLinecap="round" />
    </g>;

    /* ================================================================ Viagem à Lua (Méliès, 1902) */
    case 'foguete_no_olho_da_lua': return <g>
      <path d="M1 17 Q0.4 15.4 2 15 Q2.4 13.6 4 14.2 Q5 13 6.4 14 Q6 15.4 4.6 15.6 Q4 17.2 1 17 Z M13 18.6 Q12.4 17 14 16.6 Q14.6 15.2 16.4 15.8 Q17.6 14.8 19 15.8 Q19.4 17.4 18 17.6 Q17.4 19 13 18.6 Z" fill={cor(BRANCO)} {...C(0.45)} />
      <circle cx={10.4} cy={9.4} r={7.6} fill={cor(CREME)} {...C(0.7)} />
      {[[15, 5.4, 0.8], [16.2, 11.4, 0.6], [13, 15.4, 0.7], [5.4, 14, 0.5]].map(([x, y, r], k) => <circle key={k} cx={x} cy={y} r={r} fill={cor(CINZA3)} {...C(0.3)} />)}
      <path d="M11.6 6.6 Q13 5.8 14.4 6.6" {...L(0.5)} />
      <ellipse cx={13} cy={8} rx={0.9} ry={0.7} fill={cor(BRANCO)} {...C(0.35)} /><circle cx={12.8} cy={8.1} r={0.4} fill={tinta} />
      <path d="M10.4 8.4 Q9.8 10.6 10.4 11.4 Q11.2 11.6 11.6 11" {...L(0.45)} />
      <path d="M7.6 13 Q10.4 14.4 13.2 12.6 Q12.6 14.8 10.2 14.6 Q8.4 14.4 7.6 13 Z" fill={cor(VERMELHO)} {...C(0.45)} />
      <path d="M8.6 13.5 Q10.4 14.2 12.4 13.2" stroke={cor(BRANCO)} strokeWidth={s(0.35)} fill="none" />
      <path d="M5.4 6.8 Q6.4 7.6 8 7.2" {...L(0.45)} />
      <g transform="translate(6.6 10.4) rotate(-138)">
        <path d="M0 0 Q1.4 -1.35 2.8 -1.35 H6.6 V1.35 H2.8 Q1.4 1.35 0 0 Z" fill={cor(PRATA)} {...C(0.5)} />
        <path d="M3.8 -1.35 V1.35 M5.6 -1.35 V1.35" {...L(0.35)} />
        <path d="M6.6 -1.35 L7.8 -2.2 L7.6 -0.6 Z M6.6 1.35 L7.8 2.2 L7.6 0.6 Z" fill={cor(CINZA2)} {...C(0.35)} />
        <circle cx={4.7} cy={0} r={0.5} fill={cor(CELESTE)} {...C(0.25)} />
        <path d="M1.6 -0.8 Q2.6 -1 3.4 -1" stroke={cor(BRANCO)} strokeWidth={s(0.3)} fill="none" strokeLinecap="round" />
      </g>
      <path d="M5 9.6 Q4 9.8 4.6 10.8 Q4 11.8 5.4 11.8 Q6 12.8 6.8 11.6 Q8 11.6 7.4 10.4 Q7.8 9.2 6.6 9.4 Q6.2 10.4 5 9.6 Z" fill={cor(BRANCO)} {...C(0.4)} />
    </g>;

    /* ================================================================ Tarzan dos Macacos (Burroughs, 1912) */
    case 'tarzan_na_liana': return <g>
      <path d="M1 0.2 Q3 5 8.6 7.6" fill="none" stroke={cor(VERDE)} strokeWidth={s(0.7)} strokeLinecap="round" />
      <path d="M1 0.2 Q3 5 8.6 7.6" {...L(0.2)} />
      {[[0.4, 1.2, 30], [17.8, 1.6, 140], [19, 6.6, 190], [0.8, 17.8, -20], [18.6, 18, 200], [15.4, 0.4, 110]].map(([x, y, a], k) => <path key={k} d="M0 0 Q2 -1.6 4.4 0 Q2 1.6 0 0 Z M0 0 L4 0" fill={cor(VERDE_CLARO)} {...C(0.35)} transform={`translate(${x} ${y}) rotate(${a})`} />)}
      <path d="M9.4 9 L11.4 7.4 Q13.4 7.6 13.4 9.8 L12.4 13.6 Q11.4 14.6 9.8 14 Z" fill={cor(AREIA)} {...C(0.55)} />
      <path d="M10.4 9.8 Q11.6 10.4 12.6 9.8 M10.6 11.6 Q11.4 12 12.2 11.6" {...L(0.25)} opacity={0.6} />
      <path d="M11 7.6 Q9.6 5.4 8.6 7.6 L9.6 9.4" stroke={cor(AREIA)} strokeWidth={s(1.35)} fill="none" strokeLinecap="round" />
      <path d="M11 7.6 Q9.6 5.4 8.6 7.6" {...L(0.25)} />
      <circle cx={8.6} cy={7.4} r={0.65} fill={cor(AREIA)} {...C(0.35)} />
      <path d="M13 8.6 Q15.6 9.6 17.6 8.6" stroke={cor(AREIA)} strokeWidth={s(1.35)} fill="none" strokeLinecap="round" />
      <path d="M13 8.6 Q15.6 9.6 17.6 8.6" {...L(0.25)} />
      <circle cx={17.8} cy={8.5} r={0.6} fill={cor(AREIA)} {...C(0.35)} />
      <path d="M9.6 13.4 L12.6 13.2 L12.8 15.4 L11 15 L9.8 15.6 Z" fill={cor(TERRA)} {...C(0.45)} />
      {[[10.4, 14], [11.6, 14.4], [12.2, 13.8]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r={0.22} fill={tinta} />)}
      <path d="M12.6 13.4 L13.6 15" stroke={cor(CINZA3)} strokeWidth={s(0.45)} strokeLinecap="round" />
      <path d="M10.4 15.2 Q8.4 16 7.8 18.6 L6.4 19.2 M12.4 15.2 Q13.4 17.4 12 19 L10.6 19.4" stroke={cor(AREIA)} strokeWidth={s(1.45)} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.4 15.2 Q8.4 16 7.8 18.6 L6.4 19.2 M12.4 15.2 Q13.4 17.4 12 19 L10.6 19.4" {...L(0.25)} />
      <path d="M11.6 7.6 V6.6" stroke={cor(AREIA)} strokeWidth={s(0.8)} />
      <path d="M12 2.6 Q14 2.6 14 4.6 Q14 6.6 12.2 7 Q10.6 6.6 10.6 4.6 Q10.6 2.6 12 2.6 Z" fill={cor(AREIA)} {...C(0.5)} />
      <path d="M10.4 4.6 Q10 1.6 12.4 1.8 Q14.4 1.8 14.4 4 Q13.4 3 12 3.4 Q11.2 4 10.4 4.6 Z M10.6 3.6 Q8.4 4 7 6.4 Q8.6 5.4 9.4 5.6 Q8.4 6.6 8.2 7.4 Q9.8 6 10.6 5.6 Z" fill={tinta} {...C(0.35)} />
      <circle cx={12.5} cy={4.6} r={0.22} fill={tinta} /><circle cx={13.5} cy={4.6} r={0.22} fill={tinta} />
      <path d="M12.6 4 l0.6 -0.1 M13.3 4 l0.5 0" {...L(0.3)} />
      <path d="M12.6 5.9 Q13.1 6.2 13.5 5.8" {...L(0.25)} />
    </g>;

    /* ================================================================ Robin Hood (baladas medievais) */
    case 'robin_de_capuz': return <g>
      <path d="M2.4 0.6 Q-0.6 10 2.4 19.4" fill="none" stroke={cor(MARROM)} strokeWidth={s(0.9)} strokeLinecap="round" />
      <path d="M2.4 0.6 Q-0.6 10 2.4 19.4" {...L(0.25)} />
      <path d="M2.4 0.6 L11.4 9.6 L2.4 19.4" fill="none" stroke={tinta} strokeWidth={s(0.2)} />
      <path d="M0.6 9.6 H13.2" stroke={cor(MARROM)} strokeWidth={s(0.45)} />
      <path d="M0.6 9.6 l1.2 -0.6 v1.2 Z" fill={cor(PRATA)} {...C(0.3)} />
      <path d="M11.8 9.6 l1.6 -0.8 l-0.4 0.8 l0.4 0.8 Z" fill={cor(VERMELHO)} {...C(0.25)} />
      <path d="M12.2 12.4 L15 3.4 L15.8 3.8 L13.2 12.8 Z" fill={cor(MARROM)} {...C(0.4)} />
      {[13.6, 14.4, 15.2].map((x, k) => <path key={k} d={`M${x} ${4 + k * 0.2} l0.4 -1.6 l0.4 1 Z`} fill={cor(BRANCO)} {...C(0.25)} />)}
      <path d="M6 20 Q5.8 14 8.4 11.8 L12 11.6 Q15.2 13 15.6 20 Z" fill={cor(VERDE)} {...C(0.6)} />
      <path d="M8.6 14.6 L15.2 13" stroke={cor(MARROM)} strokeWidth={s(0.6)} />
      <path d="M8 12 Q5 11 2.8 9.9" stroke={cor(VERDE)} strokeWidth={s(1.2)} fill="none" strokeLinecap="round" />
      <path d="M8 12 Q5 11 2.8 9.9" {...L(0.25)} />
      <circle cx={2.6} cy={9.6} r={0.7} fill={cor(PELE)} {...C(0.35)} />
      <path d="M11.4 11.6 Q11 10.4 10.8 9.6" stroke={cor(VERDE)} strokeWidth={s(1.1)} fill="none" strokeLinecap="round" />
      <path d="M11.6 12 Q12.4 10.6 11.2 9.6" {...L(0.25)} />
      <circle cx={11.1} cy={9.6} r={0.6} fill={cor(PELE)} {...C(0.35)} />
      <path d="M7.2 6.2 L6 7.6 L7 7.8 L6.8 8.6 Q7.4 9.4 8.4 9.2 L9.4 9.6 L10.4 9 Q10.4 6.6 9.6 5.6 Q8.2 5 7.2 6.2 Z" fill={cor(PELE)} {...C(0.45)} />
      <circle cx={7.6} cy={6.8} r={0.22} fill={tinta} /><path d="M7.2 6.1 l0.8 0" {...L(0.3)} />
      <path d="M7.3 8.6 h0.6" {...L(0.25)} />
      <path d="M7 9 Q7.6 9.8 8.6 9.4 L9 9.6 Q8 10.4 7.2 9.8 Z" fill={cor(MARROM)} {...C(0.3)} />
      <path d="M6.6 6 Q7.4 2.4 10.6 2.8 Q13.2 3.6 12.8 7.2 L12.4 11.4 L10.2 11 Q10.6 8.4 9.8 6.6 Q8.4 5.2 6.6 6 Z" fill={cor(VERDE)} {...C(0.55)} />
      <path d="M10.6 2.8 Q13.4 2 14.2 0.8 Q13.4 3 12.8 4" fill={cor(VERDE)} {...C(0.4)} />
      <path d="M7.4 5 Q9.2 4.4 10.6 5.6 Q11 7 10.8 8.6" {...L(0.3)} opacity={0.7} />
    </g>;
    default: return undefined;
  }
}
