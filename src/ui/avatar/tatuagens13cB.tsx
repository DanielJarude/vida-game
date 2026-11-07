/**
 * VIDA 13 (correção final) — A ARTE DOS PERSONAGENS, lote B (`motor/dados/tatuagens13cB`). Caixa nativa (o lado maior
 * mede 20), contorno em `tinta`, cor por `cor`, como `tatuagens13Pop`.
 *
 * Os personagens dos clássicos infantis e de fantasia em domínio público, a partir do texto e das gravuras originais:
 * Alice (Carroll/Tenniel), Oz (Baum/Denslow — sapatos de PRATA), Peter Pan (Barrie, 1911), Pinóquio (Collodi/Mazzanti)
 * e O Livro da Selva (Kipling). Nada do visual das adaptações protegidas.
 */
import type { ReactNode } from 'react';
import {
  AMARELO, AREIA, atalhos, AZUL, BRANCO, CELESTE, CINZA2, CINZA3, CREME, estrela, f, LARANJA, LIMAO, MARROM, OURO, PRATA, ROSA,
  TERRA, VERDE, VERDE_CLARO, VERMELHO, type PincelDaTatuagem13
} from './tatuagens13Base';

const PELE = '#f0c8a0', PELE_PALIDA = '#ecd3b8', PELE_MORENA = '#b98052';

/** Coração (o naipe). */
const coracao = (cx: number, cy: number, r: number) =>
  `M${f(cx)} ${f(cy + r * 0.9)} C${f(cx - r * 1.6)} ${f(cy - r * 0.2)} ${f(cx - r * 0.6)} ${f(cy - r * 1.3)} ${f(cx)} ${f(cy - r * 0.4)} C${f(cx + r * 0.6)} ${f(cy - r * 1.3)} ${f(cx + r * 1.6)} ${f(cy - r * 0.2)} ${f(cx)} ${f(cy + r * 0.9)} Z`;
/** Ponto de uma curva quadrática. */
const q = (a: [number, number], c: [number, number], b: [number, number], t: number): [number, number] =>
  [(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]];

export function desenho13cB(id: string, p: PincelDaTatuagem13): ReactNode | undefined {
  const { tinta, cor } = p;
  const { s, L, C, letra } = atalhos(p);
  /** Um membro/tubo: contorno em tinta e o recheio na cor já resolvida. */
  const tubo = (d: string, w: number, recheio: string, k: string | number = 't') => <g key={k}>
    <path d={d} fill="none" stroke={tinta} strokeWidth={s(w + 0.75)} strokeLinecap="round" strokeLinejoin="round" />
    <path d={d} fill="none" stroke={recheio} strokeWidth={s(w)} strokeLinecap="round" strokeLinejoin="round" />
  </g>;
  const olho = (x: number, y: number, r = 0.24) => <circle cx={x} cy={y} r={r} fill={tinta} />;
  switch (id) {
    /* ================================================================ Alice (Tenniel) */
    case 'alice_de_tenniel': return <g>
      <path d="M4.7 3.6 Q3.3 6.2 3.5 9.6 Q4.4 10.4 5.4 9.8 L8.6 9.8 Q9.6 10.4 10.5 9.6 Q10.7 6.2 9.3 3.6 Z" fill={cor(OURO)} {...C(0.5)} />
      <path d="M4.2 5.4 Q3.8 7.6 4.1 9.2 M9.8 5.4 Q10.2 7.6 9.9 9.2" {...L(0.25)} />
      {tubo('M5.9 15.4 V18.5', 0.8, cor(BRANCO), 'p1')}{tubo('M8.1 15.4 V18.5', 0.8, cor(BRANCO), 'p2')}
      <path d="M5.5 16.4 h0.8 M5.5 17.3 h0.8 M7.7 16.4 h0.8 M7.7 17.3 h0.8" {...L(0.3)} />
      <ellipse cx={5.6} cy={19.1} rx={1} ry={0.55} fill={tinta} /><ellipse cx={8.4} cy={19.1} rx={1} ry={0.55} fill={tinta} />
      <path d="M5.2 9.2 L8.8 9.2 Q11.4 12 12.4 15.4 Q7 16.7 1.6 15.4 Q2.6 12 5.2 9.2 Z" fill={cor(AMARELO)} {...C(0.55)} />
      <path d="M5.4 9.4 L8.6 9.4 Q9.9 12 10.3 14.9 Q7 15.7 3.7 14.9 Q4.1 12 5.4 9.4 Z" fill={cor(BRANCO)} {...C(0.45)} />
      <path d="M3.9 14.2 Q7 14.9 10.1 14.2" {...L(0.25)} /><path d="M5.9 11.4 h2.2 v1.4 h-2.2 Z" {...L(0.25)} />
{tubo('M4.4 7.8 Q3 9.4 2.5 11', 0.65, cor(PELE), 'b1')}{tubo('M9.6 7.8 Q11 9.4 11.5 11', 0.65, cor(PELE), 'b2')}
      <circle cx={2.45} cy={11.2} r={0.5} fill={cor(PELE)} {...C(0.35)} /><circle cx={11.55} cy={11.2} r={0.5} fill={cor(PELE)} {...C(0.35)} />
      <path d="M5.3 6.6 L8.7 6.6 L8.9 9.6 L5.1 9.6 Z" fill={cor(AMARELO)} {...C(0.5)} />
      <path d="M5.9 6.7 L8.1 6.7 L8.2 9.5 L5.8 9.5 Z" fill={cor(BRANCO)} {...C(0.35)} />
      <path d="M5.1 9.5 H8.9" {...L(0.45)} />
      <ellipse cx={4.7} cy={7.2} rx={1.15} ry={0.9} fill={cor(AMARELO)} {...C(0.45)} /><ellipse cx={9.3} cy={7.2} rx={1.15} ry={0.9} fill={cor(AMARELO)} {...C(0.45)} />
      <rect x={6.5} y={5.6} width={1} height={1.2} fill={cor(PELE)} {...C(0.3)} />
      <ellipse cx={7} cy={4.1} rx={1.9} ry={2.2} fill={cor(PELE)} {...C(0.5)} />
      <path d="M5 4.1 Q4.8 1.4 7 1.3 Q9.2 1.4 9 4.1 Q8.6 2.7 7 2.6 Q5.4 2.7 5 4.1 Z" fill={cor(OURO)} {...C(0.4)} />
      <path d="M5.1 3.1 Q7 1.6 8.9 3.1" fill="none" stroke={tinta} strokeWidth={s(0.6)} strokeLinecap="round" />
      {olho(6.3, 4.2)}{olho(7.7, 4.2)}
      <path d="M5.9 3.6 q0.4 -0.25 0.8 0 M7.3 3.6 q0.4 -0.25 0.8 0 M7 4.5 l-0.15 0.5 h0.3 M6.6 5.3 Q7 5.5 7.4 5.3" {...L(0.2)} />
      <circle cx={5.9} cy={4.9} r={0.35} fill={cor(ROSA)} opacity={0.5} /><circle cx={8.1} cy={4.9} r={0.35} fill={cor(ROSA)} opacity={0.5} />
    </g>;
    case 'chapeleiro_maluco': return <g>
      <path d="M0.8 20 Q1 15.4 5 14.4 L11 14.4 Q15 15.4 15.2 20 Z" fill={cor(VERDE)} {...C(0.6)} />
      <path d="M5 14.4 L6.4 18 L7.4 15.6 M11 14.4 L9.6 18 L8.6 15.6" {...L(0.35)} />
      <path d="M6.2 14 L8 16.2 L9.8 14 Z" fill={cor(BRANCO)} {...C(0.35)} />
      <path d="M4.6 8.4 Q2.8 9 3 11.6 Q3.8 10.8 4.7 11.2 Z M11.4 8.4 Q13.2 9 13 11.6 Q12.2 10.8 11.3 11.2 Z" fill={cor(MARROM)} {...C(0.4)} />
      <path d="M4.6 8.2 Q4.2 13.4 8 14.4 Q11.8 13.4 11.4 8.2 Z" fill={cor(PELE)} {...C(0.55)} />
      <circle cx={6.3} cy={10.3} r={0.9} fill={cor(BRANCO)} {...C(0.35)} /><circle cx={9.7} cy={10.3} r={0.9} fill={cor(BRANCO)} {...C(0.35)} />
      {olho(6.5, 10.4, 0.38)}{olho(9.5, 10.4, 0.38)}
      <path d="M5.3 9.1 Q6.3 8.6 7.2 9.1 M8.8 9.1 Q9.7 8.6 10.7 9.1" {...L(0.35)} />
      <path d="M8 10.6 Q9.6 12.2 8.2 12.5" {...L(0.4)} />
      <path d="M6.3 12.9 Q8 13.9 9.7 12.9" {...L(0.4)} />
      <path d="M2.8 8.6 Q8 7 13.2 8.6" fill="none" stroke={tinta} strokeWidth={s(0.3)} opacity={0.4} />
      <path d="M3.2 0.6 L12.8 0.6 Q12.1 4.6 11.2 8 L4.8 8 Q3.9 4.6 3.2 0.6 Z" fill={cor(CINZA2)} {...C(0.6)} />
      <ellipse cx={8} cy={0.75} rx={4.75} ry={0.55} fill={cor(CINZA3)} {...C(0.4)} />
      <path d="M4.45 6 L11.55 6 L11.25 7.8 L4.75 7.8 Z" fill={cor(VERMELHO)} {...C(0.4)} />
      <path d="M4.6 1.6 Q5 4.6 5.8 5.6" fill="none" stroke={cor(BRANCO)} strokeWidth={s(0.35)} opacity={0.6} />
      <g transform="rotate(-10 10.4 5)">
        <rect x={8.8} y={3.6} width={3.6} height={2.5} fill={cor(BRANCO)} {...C(0.35)} />
        {letra('10/6', 10.6, 5.35, 1.55, { fill: tinta, peso: 700 })}
      </g>
      <path d="M2.2 8.4 Q8 6.8 13.8 8.4 Q14.6 9 13.2 9.3 Q8 8.2 2.8 9.3 Q1.4 9 2.2 8.4 Z" fill={cor(CINZA2)} {...C(0.5)} />
      <path d="M8 15.4 L3.7 13.7 Q3 15.4 3.7 17.1 Z M8 15.4 L12.3 13.7 Q13 15.4 12.3 17.1 Z" fill={cor(VERMELHO)} {...C(0.5)} />
      {[[4.6, 14.7], [5.2, 16], [4.3, 16], [6.4, 15.1], [11.4, 14.7], [10.8, 16], [11.7, 16], [9.6, 15.1]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r={0.28} fill={cor(BRANCO)} />)}
      <ellipse cx={8} cy={15.4} rx={0.8} ry={0.95} fill={cor(VERMELHO)} {...C(0.4)} />
    </g>;
    case 'coelho_de_colete': return <g>
      <path d="M5.5 5.4 Q3.6 2.6 4.3 0.4 Q6 0.9 6.7 4.8 Z" fill={cor(BRANCO)} {...C(0.5)} />
      <path d="M5.4 4.2 Q4.6 2.6 4.8 1.2 Q5.6 1.8 5.9 3.8 Z" fill={cor(ROSA)} opacity={0.7} />
      <path d="M6.7 5 Q6.5 1.6 7.9 0.5 Q8.9 2.4 7.7 5.2 Z" fill={cor(BRANCO)} {...C(0.5)} />
      <path d="M3.2 9.2 Q2.4 12.6 2.8 16.6 L4.9 15.6 L5.6 10.6 Z" fill={cor(VERMELHO)} {...C(0.5)} />
      <path d="M3.4 11 L4.8 11.6 M3 13.2 L4.6 13.6 M2.9 15.2 L4.4 14.9" {...L(0.25)} />
      <circle cx={3.2} cy={15.6} r={0.95} fill={cor(BRANCO)} {...C(0.4)} />
      <path d="M5.4 18 Q5.2 19.6 6.8 19.6 L10.2 19.6 Q10.8 18.8 9.4 18.4 L7 18 Z" fill={cor(BRANCO)} {...C(0.5)} />
      <path d="M4.6 14.6 Q4 17.4 5.6 18.5 L7.1 18.4 Q8 16 8.8 14.8 Z" fill={cor(BRANCO)} {...C(0.5)} />
      <path d="M5 9 Q3.9 12 4.5 15 L9.6 15 Q10.4 12 9 9 Z" fill={cor(AMARELO)} {...C(0.5)} />
      <path d="M7.1 9.6 V14.8" {...L(0.25)} />
      {[10.8, 12.2, 13.6].map(y => <circle key={y} cx={7.6} cy={y} r={0.22} fill={tinta} />)}
      {tubo('M7 10.2 Q8.4 12.2 10.1 11.8', 1.1, cor(VERMELHO), 'm')}
      <path d="M10.2 11.8 Q8.6 13.6 7.7 12.6" fill="none" stroke={cor(OURO)} strokeWidth={s(0.3)} />
      <circle cx={10.4} cy={11.7} r={0.6} fill={cor(BRANCO)} {...C(0.35)} />
      <rect x={11.3} y={9.2} width={0.6} height={0.6} fill={cor(OURO)} {...C(0.3)} />
      <circle cx={11.6} cy={11.3} r={1.55} fill={cor(OURO)} {...C(0.5)} /><circle cx={11.6} cy={11.3} r={1.1} fill={cor(BRANCO)} {...C(0.25)} />
      <path d="M11.6 11.3 V10.4 M11.6 11.3 H12.3" {...L(0.25)} />
      <path d="M5.8 8.6 L7.4 9.8 L8.9 8.6" fill={cor(BRANCO)} {...C(0.35)} />
      <path d="M6.9 9.5 L7.9 9.5 L7.4 10.2 Z" fill={cor(VERMELHO)} {...C(0.25)} />
      <path d="M4.6 6.6 Q4.8 4.4 7.4 4.4 Q9.6 4.6 10.4 6.6 Q10.8 7.6 9.8 8.2 Q7.6 9.2 5.6 8.6 Q4.4 8 4.6 6.6 Z" fill={cor(BRANCO)} {...C(0.55)} />
      <circle cx={8.2} cy={6.1} r={0.48} fill={cor(ROSA)} {...C(0.3)} />{olho(8.3, 6.1, 0.18)}
      <circle cx={10.3} cy={6.9} r={0.32} fill={cor(ROSA)} {...C(0.25)} />
      <path d="M9.8 7.6 q-0.3 0.5 -0.8 0.4 M10.2 7.2 l2.2 -0.7 M10.2 7.4 l2.3 0.2 M10.1 7.6 l2 0.9" {...L(0.18)} />
    </g>;
    case 'gato_de_cheshire': {
      const dentes = Array.from({ length: 9 }, (_, k) => 3.9 + k * 0.92);
      return <g>
        {tubo('M0.4 15.2 Q6 13.6 12 14.2 Q16 14.6 19.6 13.4', 1.3, cor(MARROM), 'g')}
        <path d="M15 14.2 Q16.4 12.4 18 11.8" {...L(0.5)} />
        <ellipse cx={18.2} cy={11.4} rx={1.1} ry={0.55} transform="rotate(-25 18.2 11.4)" fill={cor(VERDE)} {...C(0.35)} />
        <ellipse cx={2.4} cy={13.6} rx={1.1} ry={0.55} transform="rotate(20 2.4 13.6)" fill={cor(VERDE)} {...C(0.35)} />
        <ellipse cx={13.8} cy={11.4} rx={4.6} ry={2.4} fill={cor(TERRA)} opacity={0.22} />
        <ellipse cx={13.8} cy={11.4} rx={4.6} ry={2.4} fill="none" stroke={tinta} strokeWidth={s(0.45)} strokeDasharray="0.5 0.9" strokeLinecap="round" />
        <path d="M18.2 11 Q19.8 8.6 18.4 6.4 Q17.4 5 18.2 4" fill="none" stroke={tinta} strokeWidth={s(0.55)} strokeDasharray="0.4 1" strokeLinecap="round" opacity={0.7} />
        <path d="M12.6 9.6 l0.4 1.4 M14.4 9.4 l0.2 1.5 M16.2 9.8 l-0.1 1.4" fill="none" stroke={tinta} strokeWidth={s(0.4)} strokeDasharray="0.3 0.6" opacity={0.6} />
        <path d="M11.4 13.4 V15.6 M16.4 13.2 V15.4" fill="none" stroke={tinta} strokeWidth={s(0.45)} strokeDasharray="0.4 0.8" opacity={0.6} />
        <path d="M3.6 5 L3.1 1.1 L6.5 3.2 Z M11.6 5 L12.1 1.1 L8.7 3.2 Z" fill={cor(TERRA)} {...C(0.5)} />
        <path d="M2.6 7.6 Q2.4 3 7.6 2.8 Q12.8 3 12.6 7.6 L13.8 8.4 L12.7 8.9 L13.6 9.8 L12.3 10 Q11 12.6 7.6 12.7 Q4.2 12.6 2.9 10 L1.6 9.8 L2.5 8.9 L1.4 8.4 Z" fill={cor(TERRA)} {...C(0.6)} />
        <path d="M6.5 3.1 l0.3 1.4 M7.6 2.9 v1.6 M8.7 3.1 l-0.3 1.4 M2.8 6.2 l1.2 0.3 M12.4 6.2 l-1.2 0.3" {...L(0.4)} />
        <path d="M4.3 6.4 Q5.6 5.1 6.9 6.4 Q5.6 7.3 4.3 6.4 Z M8.3 6.4 Q9.6 5.1 10.9 6.4 Q9.6 7.3 8.3 6.4 Z" fill={cor(LIMAO)} {...C(0.4)} />
        <ellipse cx={5.6} cy={6.3} rx={0.18} ry={0.55} fill={tinta} /><ellipse cx={9.6} cy={6.3} rx={0.18} ry={0.55} fill={tinta} />
        <path d="M7.1 7.6 H8.1 L7.6 8.2 Z" fill={cor(ROSA)} {...C(0.3)} />
        <path d="M2.9 8.6 Q7.6 13.8 12.3 8.6 Q7.6 10.4 2.9 8.6 Z" fill={cor(BRANCO)} {...C(0.55)} />
        {dentes.map((x, k) => { const t = (x - 2.9) / 9.4; const yt = 8.6 + Math.sin(t * Math.PI) * 1.8, yb = 8.6 + Math.sin(t * Math.PI) * 3.2; return <path key={k} d={`M${f(x)} ${f(yt)} V${f(yb)}`} {...L(0.22)} />; })}
        <path d="M3.3 9.3 Q7.6 11.9 11.9 9.3" {...L(0.22)} />
        <path d="M1.8 8 l-1.4 -0.4 M1.8 8.6 l-1.5 0.3 M13.4 8 l1.4 -0.4 M13.4 8.6 l1.5 0.3" {...L(0.2)} />
      </g>;
    }
    case 'rainha_de_copas': {
      const rufo = 'M' + Array.from({ length: 28 }, (_, k) => { const a = (k * Math.PI) / 14, r = k % 2 ? 3.5 : 4.7; return `${f(8.5 + Math.cos(a) * r)} ${f(13 + Math.sin(a) * r * 0.34)}`; }).join(' L') + ' Z';
      return <g>
        <path d="M0.8 20 Q1 14.6 8.5 13.4 Q16 14.6 16.2 20 Z" fill={cor(VERMELHO)} {...C(0.6)} />
        <path d="M6.7 13.8 L10.3 13.8 L10.9 20 L6.1 20 Z" fill={cor(BRANCO)} {...C(0.4)} />
        <path d={coracao(8.5, 16, 0.9)} fill={cor(VERMELHO)} {...C(0.3)} /><path d={coracao(8.5, 18.6, 0.75)} fill={cor(VERMELHO)} {...C(0.3)} />
        <path d={coracao(3.6, 17.4, 0.75)} fill={cor(OURO)} {...C(0.3)} /><path d={coracao(13.6, 17.8, 0.75)} fill={cor(OURO)} {...C(0.3)} />
        <path d="M4.7 5.6 Q2.8 9 3.2 13.2 L5.6 12.6 Q5 9.4 5.9 6.4 Z M12.3 5.6 Q14.2 9 13.8 13.2 L11.4 12.6 Q12 9.4 11.1 6.4 Z" fill={cor(BRANCO)} {...C(0.45)} />
        <path d={rufo} fill={cor(BRANCO)} {...C(0.45)} />
        <ellipse cx={8.5} cy={8.8} rx={3.2} ry={3.5} fill={cor(PELE)} {...C(0.55)} />
        <path d="M5.8 7.2 L7.9 7.9 M11.2 7.2 L9.1 7.9" {...L(0.55)} />
        {olho(7.1, 8.6, 0.32)}{olho(9.9, 8.6, 0.32)}
        <path d="M8.5 8.7 q0.6 1 -0.2 1.3" {...L(0.35)} />
        <ellipse cx={8.5} cy={11} rx={0.95} ry={0.75} fill={tinta} />
        <circle cx={6.3} cy={10} r={0.55} fill={cor(ROSA)} opacity={0.55} /><circle cx={10.7} cy={10} r={0.55} fill={cor(ROSA)} opacity={0.55} />
        <path d="M4.9 5.9 L4.4 2.1 L6.5 3.7 L8.5 1.1 L10.5 3.7 L12.6 2.1 L12.1 5.9 Z" fill={cor(OURO)} {...C(0.5)} />
        <path d="M4.8 5 H12.2" {...L(0.35)} />
        <path d={coracao(8.5, 3.9, 0.6)} fill={cor(VERMELHO)} {...C(0.25)} />
        {[[4.4, 1.9], [8.5, 0.9], [12.6, 1.9]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r={0.45} fill={cor(VERMELHO)} {...C(0.25)} />)}
        {tubo('M13.6 15.2 Q15.2 13.4 15.6 11', 1.1, cor(VERMELHO), 'b')}
        <circle cx={15.6} cy={10.6} r={0.75} fill={cor(PELE)} {...C(0.4)} />
        {tubo('M15.7 10 V8.2', 0.35, cor(PELE), 'd')}
      </g>;
    }
    case 'lagarta_do_narguile': {
      const gomos: [number, number, number][] = [[13.3, 8.9, 0.85], [12.1, 8.4, 0.95], [10.8, 8, 1.05], [9.6, 7.3, 1.1], [8.9, 6, 1.1], [8.6, 4.7, 1.05]];
      return <g>
        <path d="M6.4 13 Q6 17 5.8 19.5 L11.2 19.5 Q11 17 10.6 13 Z" fill={cor(CREME)} {...C(0.55)} />
        <path d="M1 19.6 H16" {...L(0.5)} /><path d="M3 19.6 l0.4 -1 M4 19.6 l-0.2 -0.9 M13 19.6 l0.3 -1 M14 19.6 l-0.3 -0.8" {...L(0.3)} />
        <path d="M0.8 13.4 Q2 8.4 8.5 8.2 Q15 8.4 16.2 13.4 Q8.5 14.8 0.8 13.4 Z" fill={cor(VERMELHO)} {...C(0.6)} />
        {[[3.2, 11.8, 0.9], [13.8, 11.8, 0.8], [6.4, 12.9, 0.6], [11.2, 12.8, 0.7]].map(([x, y, r], k) => <ellipse key={k} cx={x} cy={y} rx={r} ry={r * 0.65} fill={cor(BRANCO)} {...C(0.25)} />)}
        <ellipse cx={3.8} cy={8.9} rx={1.3} ry={1.1} fill={cor(OURO)} {...C(0.45)} />
        <rect x={3.5} y={6.2} width={0.6} height={1.8} fill={cor(OURO)} {...C(0.35)} />
        <path d="M3 6.2 H4.6 L4.3 5.4 H3.3 Z" fill={cor(CINZA2)} {...C(0.3)} />
        <path d="M4.8 8.6 Q6.6 10.2 6.6 7 Q6.6 3.8 7.4 3.4" {...L(0.55)} />
        <path d="M3.8 5 q-0.8 -0.9 0 -1.8 q0.8 -0.9 0 -1.8" fill="none" stroke={tinta} strokeWidth={s(0.3)} opacity={0.6} />
        {gomos.map(([x, y, r], k) => <g key={k}><circle cx={x} cy={y} r={r} fill={cor(CELESTE)} {...C(0.4)} /><path d={`M${f(x - r * 0.3)} ${f(y + r * 0.95)} v0.4`} {...L(0.3)} /></g>)}
        <path d="M8 5.4 Q9 6.2 10 5.6" {...L(0.35)} />
        <circle cx={8.6} cy={2.6} r={1.5} fill={cor(AZUL)} {...C(0.45)} />
        <path d="M7.2 2.4 Q6.6 2.9 7.1 3.3" fill={cor(AZUL)} {...C(0.3)} />
        <circle cx={8.1} cy={2.2} r={0.28} fill={cor(BRANCO)} />{olho(8.05, 2.2, 0.15)}
        <path d="M8.9 1.2 Q9.4 0.2 10.2 0.4 M9.4 1.4 Q10.2 0.8 10.8 1.2" {...L(0.25)} />
        <circle cx={11.6} cy={2.6} r={0.6} fill="none" stroke={tinta} strokeWidth={s(0.3)} opacity={0.65} />
        <circle cx={13.4} cy={1.8} r={0.8} fill="none" stroke={tinta} strokeWidth={s(0.3)} opacity={0.55} />
        <circle cx={15.4} cy={1.2} r={1} fill="none" stroke={tinta} strokeWidth={s(0.3)} opacity={0.45} />
      </g>;
    }
    /* ================================================================ O Mágico de Oz (Denslow) */
    case 'dorothy_e_toto': {
      const xadrez: ReactNode[] = [];
      for (let j = 0; j < 7; j++) {
        const y = 9.5 + j * 0.8, t = (y - 9.4) / 5.4, xl = 5.1 + (2.6 - 5.1) * t, xr = 8.9 + (11.4 - 8.9) * t;
        for (let x = xl + 0.1; x < xr - 0.3; x += 0.8) {
          const i = Math.round((x - 2) / 0.8);
          if ((i + j) % 2 === 0) xadrez.push(<rect key={`${i}-${j}`} x={f(x)} y={f(y)} width={0.4} height={0.4} fill={cor(AZUL)} opacity={j % 2 ? 0.55 : 0.9} />);
        }
      }
      return <g>
        {tubo('M4.6 4.8 Q3.6 7 3.8 9.4', 0.8, cor(MARROM), 't1')}{tubo('M9.4 4.8 Q10.4 7 10.2 9.4', 0.8, cor(MARROM), 't2')}
        <path d="M3.7 6.4 l0.7 0.3 M3.6 7.4 l0.7 0.3 M3.7 8.4 l0.7 0.3 M10.3 6.4 l-0.7 0.3 M10.4 7.4 l-0.7 0.3 M10.3 8.4 l-0.7 0.3" {...L(0.2)} />
        <path d="M3 9.6 l0.8 0.5 l0.8 -0.5 l-0.8 0.6 Z M9.4 9.6 l0.8 0.5 l0.8 -0.5 l-0.8 0.6 Z" fill={cor(AZUL)} {...C(0.35)} />
        {tubo('M5 7.8 Q3.8 9.6 3.6 11', 0.65, cor(PELE), 'b1')}{tubo('M9 7.8 Q10 9.4 10.2 11', 0.65, cor(PELE), 'b2')}
        <path d="M1.8 11 L4.8 11 L4.4 13 L2.2 13 Z" fill={cor(AREIA)} {...C(0.4)} /><path d="M2.2 11 Q3.3 9.4 4.4 11" {...L(0.35)} />
        <path d="M2.1 12 H4.6" {...L(0.2)} />
        {tubo('M6 15.2 V18.4', 0.8, cor(BRANCO), 'p1')}{tubo('M8 15.2 V18.4', 0.8, cor(BRANCO), 'p2')}
        <ellipse cx={5.8} cy={19} rx={1.1} ry={0.6} fill={cor(PRATA)} {...C(0.4)} /><ellipse cx={8.2} cy={19} rx={1.1} ry={0.6} fill={cor(PRATA)} {...C(0.4)} />
        <path d={estrela(4.2, 18.4, 0.7, 4, 0.2)} fill={cor(BRANCO)} {...C(0.2)} /><path d={estrela(9.9, 18.3, 0.55, 4, 0.18)} fill={cor(BRANCO)} {...C(0.2)} />
        <path d="M5.1 9.4 L8.9 9.4 Q10.9 12 11.6 14.8 Q7 15.8 2.4 14.8 Q3.1 12 5.1 9.4 Z" fill={cor(CELESTE)} {...C(0.55)} />
        {xadrez}
        <path d="M5.4 7.4 L8.6 7.4 L8.9 9.6 L5.1 9.6 Z" fill={cor(CELESTE)} {...C(0.5)} />
        <ellipse cx={5.1} cy={7.9} rx={0.95} ry={0.75} fill={cor(CELESTE)} {...C(0.4)} /><ellipse cx={8.9} cy={7.9} rx={0.95} ry={0.75} fill={cor(CELESTE)} {...C(0.4)} />
        <path d="M5.6 7.2 Q7 8.6 8.4 7.2 Q7 7.8 5.6 7.2 Z" fill={cor(BRANCO)} {...C(0.35)} />
        <circle cx={7} cy={4.6} r={2.5} fill={cor(PELE)} {...C(0.5)} />
        <path d="M4.5 4.8 Q4.4 1.8 7 1.8 Q9.6 1.8 9.5 4.8 Q9 3 7 3.2 Q5 3 4.5 4.8 Z" fill={cor(MARROM)} {...C(0.4)} />
        <path d="M7 1.9 V3.1" {...L(0.25)} />
        {olho(6.1, 4.8)}{olho(7.9, 4.8)}
        <path d="M6.6 5.3 h0.4 M6.3 5.9 Q7 6.4 7.7 5.9" {...L(0.22)} />
        <circle cx={5.6} cy={5.6} r={0.4} fill={cor(ROSA)} opacity={0.5} /><circle cx={8.4} cy={5.6} r={0.4} fill={cor(ROSA)} opacity={0.5} />
        <path d="M12.9 17.8 L12.7 19.5 M13.7 18 L13.8 19.5 M15.3 18 L15.2 19.5 M16.1 17.8 L16.4 19.4" fill="none" stroke={tinta} strokeWidth={s(0.6)} strokeLinecap="round" />
        <path d="M12.4 17 Q12.6 15.8 14.4 15.9 Q16.4 15.8 16.7 17 Q16.6 18 16 18.1 L15.6 18.5 L15.2 18 L14.4 18.5 L13.8 18 L13.2 18.4 Q12.3 18 12.4 17 Z" fill={tinta} />
        <path d="M16.5 16.6 Q17.6 15.6 17.2 14.6 L16.9 15.3 Q16.6 15.9 16.1 16.1 Z" fill={tinta} />
        <path d="M13.8 15 Q13.6 13.8 12.6 13.8 Q11.6 13.8 11.4 14.6 L10.6 15 Q10.6 15.7 11.4 15.8 Q12 16.6 13 16.6 Q14 16.4 13.8 15 Z" fill={tinta} />
        <path d="M13.1 14 Q14.3 14.1 14.1 15.9 Q13.4 15.7 13.2 15 Z" fill={tinta} stroke={cor(CINZA2)} strokeWidth={s(0.2)} />
        <circle cx={12.2} cy={14.6} r={0.32} fill={cor(BRANCO)} />{olho(12.1, 14.6, 0.15)}
        <circle cx={10.75} cy={15.05} r={0.22} fill={cor(CINZA2)} />
      </g>;
    }
    case 'espantalho_de_oz': return <g>
      <rect x={7.05} y={13} width={0.9} height={6.8} fill={cor(MARROM)} {...C(0.4)} />
      {tubo('M1.4 10.3 H13.6', 1.3, cor(AZUL), 'b')}
      <path d="M1 10.3 l-0.9 -0.7 M1 10.3 l-1 0 M1 10.3 l-0.8 0.8 M14 10.3 l0.9 -0.7 M14 10.3 l1 0 M14 10.3 l0.8 0.8" {...L(0.3)} />
      <path d="M1 10.3 l-0.7 -0.4 M14 10.3 l0.7 0.4" stroke={cor(AMARELO)} strokeWidth={s(0.3)} />
      <rect x={2.4} y={9.6} width={1.2} height={1.4} fill={cor(AREIA)} {...C(0.25)} />
      {tubo('M5.9 14.4 Q5.7 16.4 5.3 18.2', 1.3, cor(CELESTE), 'p1')}{tubo('M9.1 14.4 Q9.3 16.4 9.7 18.2', 1.3, cor(CELESTE), 'p2')}
      <path d="M4.8 18.4 l-0.6 0.4 M5.3 18.4 v0.6 M10.2 18.4 l0.6 0.4 M9.7 18.4 v0.6" {...L(0.3)} />
      <path d="M3.6 18.4 H6.4 V19.7 H3 Q3 19 3.6 18.4 Z M8.6 18.4 H11.4 Q12 19 12 19.7 H8.6 Z" fill={cor(MARROM)} {...C(0.4)} />
      <path d="M3.6 18.4 H6.4 V18.9 H3.4 Z M8.6 18.4 H11.4 L11.6 18.9 H8.6 Z" fill={cor(AZUL)} />
      <path d="M4.8 9.4 L10.2 9.4 L10.6 14.6 L4.4 14.6 Z" fill={cor(AZUL)} {...C(0.55)} />
      <path d="M8.6 11.2 h1.3 v1.3 h-1.3 Z" fill={cor(AREIA)} {...C(0.25)} />
      <path d="M7.5 9.6 V14.4" {...L(0.25)} />{[11, 12.4, 13.8].map(y => <circle key={y} cx={7.1} cy={y} r={0.2} fill={tinta} />)}
      <path d="M6.6 14.6 l-0.3 0.6 M7.5 14.6 v0.7 M8.4 14.6 l0.3 0.6" {...L(0.3)} />
      <path d="M4.6 6.8 Q4.4 4.2 7.5 4 Q10.6 4.2 10.4 6.8 Q10.6 9.1 7.5 9.3 Q4.4 9.1 4.6 6.8 Z" fill={cor(AREIA)} {...C(0.55)} />
      <path d="M5.8 9.4 Q7.5 9.9 9.2 9.4" {...L(0.5)} /><path d="M6.6 9.2 l-0.3 0.6 M8.4 9.2 l0.3 0.6" {...L(0.25)} />
      <circle cx={6.2} cy={6.6} r={0.72} fill={cor(BRANCO)} {...C(0.3)} /><circle cx={6.2} cy={6.6} r={0.38} fill={cor(AZUL)} />
      <circle cx={8.8} cy={6.5} r={0.9} fill={cor(BRANCO)} {...C(0.3)} /><circle cx={8.8} cy={6.5} r={0.45} fill={cor(AZUL)} />
      {olho(6.2, 6.6, 0.18)}{olho(8.8, 6.5, 0.2)}
      <path d="M7.5 7 L7 7.9 H8 Z" fill={cor(LARANJA)} {...C(0.25)} />
      <path d="M5.5 8.1 Q7.5 9.1 9.5 8.1" {...L(0.35)} />
      <path d="M6 8.3 l-0.1 0.4 M7 8.6 v0.4 M8 8.6 v0.4 M9 8.3 l0.1 0.4" {...L(0.2)} />
      <path d="M4.5 5.4 l-0.8 0.4 M4.4 6 l-0.9 0 M10.5 5.4 l0.8 0.4 M10.6 6 l0.9 0" {...L(0.3)} />
      <ellipse cx={7.5} cy={4.4} rx={4} ry={0.75} fill={cor(AZUL)} {...C(0.45)} />
      <path d="M5 4.3 Q6.8 3.6 7.6 0.3 Q8.6 3.6 10 4.3 Q7.5 4.8 5 4.3 Z" fill={cor(AZUL)} {...C(0.45)} />
      {[[3.8, 4.8], [5.6, 5.1], [9.4, 5.1], [11.2, 4.8]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r={0.33} fill={cor(OURO)} {...C(0.2)} />)}
    </g>;
    case 'homem_de_lata': return <g>
      {tubo('M12.3 16.6 V3.6', 0.55, cor(MARROM), 'cabo')}
      <path d="M12.3 2.4 L14.8 1.2 Q15.2 3.6 14.8 6 L12.3 4.8 Z" fill={cor(PRATA)} {...C(0.5)} />
      <path d="M14.3 1.8 Q14.6 3.6 14.3 5.4" fill="none" stroke={cor(BRANCO)} strokeWidth={s(0.3)} />
      {tubo('M6 14.6 V18.6', 1.3, cor(CINZA3), 'p1')}{tubo('M9 14.6 V18.6', 1.3, cor(CINZA3), 'p2')}
      <path d="M5.2 16.6 h1.6 M8.2 16.6 h1.6" {...L(0.35)} />
      <path d="M4.4 18.6 H7 V19.6 H4.2 Z M8 18.6 H10.6 L10.8 19.6 H8 Z" fill={cor(CINZA2)} {...C(0.4)} />
      {tubo('M4.5 9.6 Q3.4 11.6 3.4 13.4', 1.1, cor(CINZA3), 'b1')}{tubo('M10.5 9.6 Q11.8 11 12 12.6', 1.1, cor(CINZA3), 'b2')}
      <path d="M3 11.6 h0.9 M11.3 11 l0.8 -0.4" {...L(0.3)} />
      <circle cx={12.2} cy={13} r={0.7} fill={cor(CINZA3)} {...C(0.4)} />
      <path d="M2.2 14 H4.6 L4.4 16.2 H2.4 Z" fill={cor(CINZA2)} {...C(0.4)} /><path d="M2.3 14.5 L0.5 13.1" {...L(0.4)} />
      <circle cx={3.4} cy={13.8} r={0.65} fill={cor(CINZA3)} {...C(0.4)} />
      <path d="M4.4 9 Q7.5 8.2 10.6 9 L10.4 14.6 Q7.5 15.4 4.6 14.6 Z" fill={cor(CINZA3)} {...C(0.6)} />
      <path d="M4.5 13.2 Q7.5 13.9 10.5 13.2" {...L(0.3)} />
      {[5.4, 6.8, 8.2, 9.6].map(x => <circle key={x} cx={x} cy={9.3} r={0.16} fill={tinta} />)}
      <path d={coracao(7.5, 11.1, 0.9)} fill={cor(VERMELHO)} {...C(0.35)} />
      <path d="M5.1 9.6 Q4.9 12 5.2 14" fill="none" stroke={cor(BRANCO)} strokeWidth={s(0.35)} opacity={0.8} />
      <rect x={6.6} y={7.6} width={1.8} height={1.4} fill={cor(CINZA2)} {...C(0.35)} /><path d="M6.6 8.3 h1.8" {...L(0.2)} />
      <path d="M5.4 3.6 L9.6 3.6 L9.6 7.1 Q7.5 8.3 5.4 7.1 Z" fill={cor(CINZA3)} {...C(0.55)} />
      <path d="M5.9 3.9 V6.8" fill="none" stroke={cor(BRANCO)} strokeWidth={s(0.35)} opacity={0.8} />
      {olho(6.6, 5.1, 0.32)}{olho(8.4, 5.1, 0.32)}
      <path d="M6.1 4.4 h0.9 M7.9 4.4 h0.9" {...L(0.25)} />
      <path d="M7.4 5.5 L8.6 6.3 L7.4 6.5 Z" fill={cor(PRATA)} {...C(0.3)} />
      <path d="M6.4 7 H8.6" {...L(0.3)} /><circle cx={6.3} cy={7} r={0.16} fill={tinta} /><circle cx={8.7} cy={7} r={0.16} fill={tinta} />
      <path d="M5 3.8 L10 3.8 L8.1 1.6 L6.9 1.6 Z" fill={cor(PRATA)} {...C(0.5)} />
      <rect x={7.15} y={0.3} width={0.7} height={1.4} fill={cor(PRATA)} {...C(0.4)} />
    </g>;
    case 'leao_covarde': {
      const juba = (r0: number, r1: number, n: number, cy: number) => {
        const pts = Array.from({ length: n }, (_, k) => { const a = -Math.PI / 2 + (k * 2 * Math.PI) / n; return a; });
        return `M${f(10 + Math.cos(pts[0]) * r0)} ${f(cy + Math.sin(pts[0]) * r0)}` + pts.map((a, k) => {
          const b = pts[(k + 1) % n] + (k + 1 === n ? 2 * Math.PI : 0), m = (a + b) / 2;
          return ` Q${f(10 + Math.cos(m) * r1)} ${f(cy + Math.sin(m) * r1)} ${f(10 + Math.cos(b) * r0)} ${f(cy + Math.sin(b) * r0)}`;
        }).join('') + ' Z';
      };
      return <g>
        <path d={juba(7.9, 10, 15, 9.6)} fill={cor(LARANJA)} {...C(0.6)} />
        <path d={juba(6.4, 7.8, 13, 9.6)} fill={cor(AMARELO)} {...C(0.4)} />
        <circle cx={5.6} cy={4.6} r={1.3} fill={cor(AREIA)} {...C(0.45)} /><circle cx={14.4} cy={4.6} r={1.3} fill={cor(AREIA)} {...C(0.45)} />
        <path d="M5.4 8.8 Q5.4 4.6 10 4.6 Q14.6 4.6 14.6 8.8 Q14.8 13.6 10 14.4 Q5.2 13.6 5.4 8.8 Z" fill={cor(AREIA)} {...C(0.55)} />
        <ellipse cx={8.8} cy={11.6} rx={1.6} ry={1.15} fill={cor(CREME)} {...C(0.35)} /><ellipse cx={11.2} cy={11.6} rx={1.6} ry={1.15} fill={cor(CREME)} {...C(0.35)} />
        {[[8.2, 11.4], [8.9, 12], [11.1, 12], [11.8, 11.4]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r={0.15} fill={tinta} />)}
        <path d="M8.6 9.8 H11.4 L10 11.2 Z" fill={cor(TERRA)} {...C(0.4)} />
        <circle cx={7.8} cy={8.2} r={0.75} fill={cor(BRANCO)} {...C(0.35)} /><circle cx={12.2} cy={8.2} r={0.75} fill={cor(BRANCO)} {...C(0.35)} />
        {olho(7.85, 7.9, 0.34)}{olho(12.15, 7.9, 0.34)}
        <path d="M6.6 7 L8.9 6 M13.4 7 L11.1 6" {...L(0.5)} />
        <path d="M8.9 13.2 Q9.4 12.8 10 13.2 Q10.6 13.6 11.1 13.2" {...L(0.35)} />
        <path d="M12.8 9.1 Q13.7 10.4 13.2 11 Q12.4 10.8 12.8 9.1 Z" fill={cor(CELESTE)} {...C(0.35)} />
        <path d="M13.5 11.8 Q14 12.6 13.7 13 Q13.2 12.9 13.5 11.8 Z" fill={cor(CELESTE)} {...C(0.3)} />
        <ellipse cx={8.4} cy={17.8} rx={2} ry={1.3} fill={cor(AREIA)} {...C(0.5)} /><ellipse cx={11.6} cy={17.8} rx={2} ry={1.3} fill={cor(AREIA)} {...C(0.5)} />
        <path d="M7.6 18.4 v0.7 M8.6 18.5 v0.7 M11.4 18.5 v0.7 M12.4 18.4 v0.7" {...L(0.3)} />
      </g>;
    }
    /* ================================================================ Peter Pan (Barrie, 1911) */
    case 'peter_pan_e_a_flauta': return <g>
      <path d={estrela(11.2, 1.8, 0.8, 5, 0.35)} fill={cor(OURO)} {...C(0.3)} />
      <path d={estrela(14.8, 2.6, 1.7, 5, 0.75)} fill={cor(OURO)} {...C(0.45)} />
      <path d="M14.8 0.2 V0.6 M17 2.4 h0.5 M12.6 2.4 h-0.4" {...L(0.25)} />
      <path d="M1 17.6 Q1 16.2 2.4 16.4 Q2.8 15.2 4.2 15.6 Q5.4 15.4 5.6 16.6 Q6.8 16.8 6.4 17.8 Z" fill={cor(BRANCO)} {...C(0.4)} />
      <path d="M2.4 10 h-1.6 M2.8 11.6 h-2 M2.4 13.2 h-1.4" {...L(0.3)} />
      {tubo('M8.6 13.6 L10.8 15.4 L12.6 14.2', 1, cor(PELE), 'p1')}{tubo('M6.9 13.8 L6.6 16.4 L8.4 17.6', 1, cor(PELE), 'p2')}
      <path d="M12.6 14.2 l0.9 -0.6 M8.4 17.6 l0.9 0.2" fill="none" stroke={tinta} strokeWidth={s(1.2)} strokeLinecap="round" /><path d="M12.6 14.2 l0.9 -0.6 M8.4 17.6 l0.9 0.2" fill="none" stroke={cor(PELE)} strokeWidth={s(0.5)} strokeLinecap="round" />
      <path d="M5.8 8 L9.2 8 L10 12.4 L10.4 14.2 L9.4 13.4 L8.8 14.6 L8 13.6 L7.2 14.6 L6.6 13.4 L5.6 14.2 L5.8 12.4 Z" fill={cor(VERDE)} {...C(0.55)} />
      <path d="M7.5 8.2 V13.6 M7.5 9.6 l-1.3 -0.8 M7.5 9.6 l1.3 -0.8 M7.5 11.4 l-1.4 -0.8 M7.5 11.4 l1.4 -0.8 M7.5 13 l-1.2 -0.7 M7.5 13 l1.2 -0.7" fill="none" stroke={cor(VERDE_CLARO)} strokeWidth={s(0.3)} />
      <path d="M7.5 8.2 V13.6" {...L(0.25)} />
      {tubo('M6 8.6 Q6.2 10.4 8.7 9.2', 0.75, cor(PELE), 'b1')}{tubo('M9.1 8.4 Q11 9 11.4 8.4', 0.75, cor(PELE), 'b2')}
      {[0, 1, 2, 3, 4].map(k => <rect key={k} x={f(8.4 + k * 0.72)} y={5.6} width={0.66} height={f(3.4 - k * 0.5)} rx={0.2} fill={cor(AREIA)} {...C(0.3)} />)}
      <path d="M8.3 6.8 H12" {...L(0.3)} />
      <circle cx={7.4} cy={4.4} r={2.2} fill={cor(PELE)} {...C(0.5)} />
      <path d="M5.3 4.6 L4.6 3 L5.8 3.1 L5.6 1.7 L6.9 2.5 L7.4 1 L8.3 2.4 L9.6 1.8 L9.4 3.2 L10 4 Q8.6 3 7.4 3.1 Q6 3.1 5.3 4.6 Z" fill={cor(MARROM)} {...C(0.4)} />
      <path d="M5.3 4.6 L4.5 4.2 L5.2 5.4 Z" fill={cor(PELE)} {...C(0.3)} />
      <path d="M6.2 4.6 q0.4 -0.4 0.8 0 M7.7 4.6 q0.4 -0.4 0.8 0" {...L(0.25)} />
      <circle cx={6.4} cy={5.5} r={0.4} fill={cor(ROSA)} opacity={0.5} />
      <path d="M7.6 5.8 Q8.1 5.9 8.4 5.7" {...L(0.25)} />
    </g>;
    case 'capitao_gancho': {
      const cachos: [number, number, number][] = [[3, 4.8, 12.6], [4.3, 4.6, 11.8], [11.4, 4.6, 11.8], [12.7, 4.8, 12.6]];
      return <g>
        {cachos.map(([x, y0, y1], k) => <g key={k}>
          <rect x={x} y={y0} width={1.3} height={y1 - y0} rx={0.65} fill={tinta} />
          {Array.from({ length: Math.floor((y1 - y0) / 1.2) }, (_, j) => <path key={j} d={`M${f(x + 0.25)} ${f(y0 + 0.9 + j * 1.2)} l0.8 -0.4`} stroke={cor(CINZA2)} strokeWidth={s(0.25)} strokeLinecap="round" />)}
        </g>)}
        <path d="M0.8 20 Q1 14.6 5.6 13.6 L11.4 13.6 Q16 14.6 16.2 20 Z" fill={cor(AZUL)} {...C(0.6)} />
        <path d="M5.6 13.6 L6.8 20 M11.4 13.6 L10.2 20" fill="none" stroke={cor(OURO)} strokeWidth={s(0.45)} />
        {[15.6, 17.4, 19.2].map(y => <g key={y}><circle cx={5.9} cy={y} r={0.3} fill={cor(OURO)} {...C(0.2)} /><circle cx={11.1} cy={y} r={0.3} fill={cor(OURO)} {...C(0.2)} /></g>)}
        <path d="M7.2 13.2 Q6.4 15 7 16.6 Q8.5 17.4 10 16.6 Q10.6 15 9.8 13.2 Z" fill={cor(BRANCO)} {...C(0.4)} />
        <path d="M7.2 14.6 Q8.5 15.2 9.8 14.6 M7 15.8 Q8.5 16.4 10 15.8" {...L(0.25)} />
        <ellipse cx={8.5} cy={8.1} rx={2.8} ry={3.6} fill={cor(PELE_PALIDA)} {...C(0.55)} />
        <path d="M6.1 6.5 L8 7 M10.9 6.5 L9 7" {...L(0.5)} />
        <circle cx={7.3} cy={7.6} r={0.48} fill={cor(CELESTE)} {...C(0.25)} /><circle cx={9.7} cy={7.6} r={0.48} fill={cor(CELESTE)} {...C(0.25)} />
        {olho(7.3, 7.6, 0.2)}{olho(9.7, 7.6, 0.2)}
        <path d="M8.5 7.6 Q9.7 9.1 8.4 9.5" {...L(0.4)} />
        <path d="M8.5 10.1 Q7.4 9.8 6.7 10.6 Q6.3 10.1 6.8 9.8 M8.5 10.1 Q9.6 9.8 10.3 10.6 Q10.7 10.1 10.2 9.8" {...L(0.4)} />
        <path d="M7.9 10.9 Q8.5 11.1 9.1 10.9" {...L(0.3)} />
        <path d="M9.2 10.9 L12.4 11.7" {...L(0.4)} />
        <path d="M12.4 11.7 L14.4 11 M12.4 11.7 L14.4 12.4" fill="none" stroke={tinta} strokeWidth={s(0.9)} strokeLinecap="round" />
        <path d="M12.4 11.7 L14.4 11 M12.4 11.7 L14.4 12.4" fill="none" stroke={cor(MARROM)} strokeWidth={s(0.45)} strokeLinecap="round" />
        <circle cx={14.6} cy={10.9} r={0.25} fill={cor(LARANJA)} /><circle cx={14.6} cy={12.5} r={0.25} fill={cor(LARANJA)} />
        <path d="M14.8 10.5 q-0.6 -0.9 0.1 -1.8 q0.6 -0.8 0 -1.6 M15 12.1 q0.7 -0.9 0.6 -2" fill="none" stroke={tinta} strokeWidth={s(0.25)} opacity={0.55} />
        <path d="M1.4 5.4 Q4 0.4 8.5 1 Q13 0.4 15.6 5.4 Q12 3.8 8.5 4.4 Q5 3.8 1.4 5.4 Z" fill={tinta} />
        <path d="M1.7 5.1 Q5 3.6 8.5 4.2 Q12 3.6 15.3 5.1" fill="none" stroke={cor(OURO)} strokeWidth={s(0.45)} />
        <circle cx={8.5} cy={2.5} r={0.65} fill={cor(BRANCO)} /><path d="M7.4 3.4 L9.6 3.9 M9.6 3.4 L7.4 3.9" stroke={cor(BRANCO)} strokeWidth={s(0.3)} strokeLinecap="round" />
        <circle cx={8.25} cy={2.45} r={0.15} fill={tinta} /><circle cx={8.75} cy={2.45} r={0.15} fill={tinta} />
        {tubo('M2.6 14.6 V12.6 Q2.6 10.2 1.3 10.5 Q0.5 10.8 0.9 11.8', 0.55, cor(PRATA), 'g')}
        <path d="M1.2 14.6 H4 L4.2 16.4 H1 Z" fill={cor(BRANCO)} {...C(0.4)} />
      </g>;
    }
    case 'crocodilo_tique_taque': {
      const costas: [number, number][] = [];
      for (let k = 1; k < 7; k++) costas.push(q([0.4, 7], [3.6, 5.2], [7, 5.4], k / 7));
      for (let k = 0; k < 6; k++) costas.push(q([7, 5.4], [10, 3.8], [13.6, 4.4], k / 6));
      return <g>
        <path d="M11 8.6 Q11.6 10.6 12.2 11 L14 11.2 Q13.6 10.4 12.8 10.4 L12.4 8.6 Z M4.8 8.6 Q4.6 10.6 5.2 11 L7 11.2 Q6.6 10.4 6 10.3 L6.2 8.8 Z" fill={cor(VERDE)} {...C(0.45)} />
        <path d="M0.4 7 Q3.6 5.2 7 5.4 Q10 3.8 13.6 4.4 Q15.4 3.4 16.6 4.2 L19.6 4.6 Q19.8 5.4 19.2 5.6 L14.6 6.6 L19 7.2 Q19.4 8 18.6 8.2 L13.4 8.6 Q11 10 8 9.4 Q4 9.2 0.4 7 Z" fill={cor(VERDE)} {...C(0.6)} />
        <path d="M14.6 6.6 L19.2 5.6 L19 7.2 Z" fill={cor(ROSA)} {...C(0.3)} />
        {[15.6, 16.6, 17.6, 18.5].map((x, k) => <path key={k} d={`M${x} ${f(6.4 - (x - 14.6) * 0.22)} l0.35 0.6 l0.35 -0.68`} fill={cor(BRANCO)} {...C(0.2)} />)}
        {[15.8, 16.8, 17.8].map((x, k) => <path key={`i${k}`} d={`M${x} ${f(6.7 + (x - 14.6) * 0.11)} l0.35 -0.55 l0.35 0.6`} fill={cor(BRANCO)} {...C(0.2)} />)}
        {costas.map(([x, y], k) => <path key={`c${k}`} d={`M${f(x - 0.45)} ${f(y + 0.15)} L${f(x)} ${f(y - 0.6)} L${f(x + 0.45)} ${f(y + 0.15)}`} fill={cor(VERDE)} {...C(0.3)} />)}
        <path d="M2.4 7.9 Q7 8.9 13 8.2" fill="none" stroke={cor(VERDE_CLARO)} strokeWidth={s(0.5)} />
        <circle cx={15.3} cy={3.8} r={0.9} fill={cor(VERDE)} {...C(0.45)} />
        <ellipse cx={15.4} cy={3.7} rx={0.55} ry={0.45} fill={cor(LIMAO)} /><ellipse cx={15.45} cy={3.7} rx={0.12} ry={0.38} fill={tinta} />
        <circle cx={19.1} cy={4.4} r={0.18} fill={tinta} />
        <circle cx={8} cy={4.7} r={0.45} fill={cor(OURO)} {...C(0.3)} /><circle cx={10} cy={4.7} r={0.45} fill={cor(OURO)} {...C(0.3)} />
        <circle cx={9} cy={7.1} r={2} fill={cor(BRANCO)} {...C(0.5)} />
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(k => { const a = (k * Math.PI) / 6, r0 = k % 3 ? 1.55 : 1.3; return <path key={`h${k}`} d={`M${f(9 + Math.cos(a) * r0)} ${f(7.1 + Math.sin(a) * r0)} L${f(9 + Math.cos(a) * 1.75)} ${f(7.1 + Math.sin(a) * 1.75)}`} {...L(0.2)} />; })}
        <path d="M9 7.1 V5.9 M9 7.1 L9.9 7.6" {...L(0.3)} />
        <path d="M11.6 5.6 q0.6 0.8 0 1.6 M12.3 5.2 q0.9 1.2 0 2.4 M6.4 5.6 q-0.6 0.8 0 1.6" {...L(0.25)} />
        {letra('tique-taque', 6.2, 2.2, 1.9, { fill: tinta, estilo: 'italic', peso: 700 })}
      </g>;
    }
    case 'sininho_de_luz': return <g>
      <circle cx={10} cy={10} r={9.2} fill={cor(AMARELO)} opacity={0.14} />
      <circle cx={10} cy={10} r={6.6} fill={cor(AMARELO)} opacity={0.22} />
      <circle cx={10} cy={10.4} r={4.4} fill={cor(OURO)} opacity={0.3} />
      <circle cx={10} cy={10} r={9.2} fill="none" stroke={tinta} strokeWidth={s(0.4)} strokeDasharray="0.3 1.2" strokeLinecap="round" opacity={0.75} />
      {[[3.4, 4], [16.8, 4.6], [17.6, 14], [2.6, 12.6], [14.6, 17.6]].map(([x, y], k) => <path key={k} d={estrela(x, y, k % 2 ? 0.9 : 1.2, 4, 0.25)} fill={cor(OURO)} {...C(0.25)} />)}
      {[[5.6, 15.4], [4.4, 16.6], [3.4, 17.6]].map(([x, y], k) => <circle key={`r${k}`} cx={x} cy={y} r={0.4 - k * 0.08} fill={tinta} opacity={0.7} />)}
      <ellipse cx={7.3} cy={7.4} rx={2.1} ry={1.05} transform="rotate(-35 7.3 7.4)" fill={cor(CELESTE)} opacity={0.75} {...C(0.5)} />
      <ellipse cx={12.7} cy={7.4} rx={2.1} ry={1.05} transform="rotate(35 12.7 7.4)" fill={cor(CELESTE)} opacity={0.75} {...C(0.5)} />
      <ellipse cx={7.7} cy={9.9} rx={1.5} ry={0.75} transform="rotate(25 7.7 9.9)" fill={cor(CELESTE)} opacity={0.75} {...C(0.45)} />
      <ellipse cx={12.3} cy={9.9} rx={1.5} ry={0.75} transform="rotate(-25 12.3 9.9)" fill={cor(CELESTE)} opacity={0.75} {...C(0.45)} />
      {tubo('M9.6 13.2 L9.2 15.8', 0.45, cor(PELE), 'p1')}{tubo('M10.4 13.2 L11 15.6', 0.45, cor(PELE), 'p2')}
      {tubo('M9.3 9.2 L7.6 10.6', 0.45, cor(PELE), 'b1')}{tubo('M10.7 9.2 L12.4 7.8', 0.45, cor(PELE), 'b2')}
      <path d="M9.2 8.8 L10.8 8.8 Q12.4 11.6 12 13.2 L11.2 12.6 L10.6 13.6 L10 12.8 L9.4 13.6 L8.8 12.6 L8 13.2 Q7.6 11.6 9.2 8.8 Z" fill={cor(VERDE_CLARO)} {...C(0.6)} />
      <path d="M10 9 V13 M10 10.4 l-0.9 0.7 M10 10.4 l0.9 0.7 M10 11.8 l-1 0.7 M10 11.8 l1 0.7" {...L(0.2)} />
      <circle cx={10} cy={7.3} r={1.3} fill={cor(PELE)} {...C(0.55)} />
      <path d="M8.7 7.3 Q8.6 5.7 10 5.7 Q11.4 5.7 11.3 7.3 Q10.9 6.4 10 6.5 Q9.1 6.4 8.7 7.3 Z" fill={cor(MARROM)} {...C(0.3)} />
      {olho(9.55, 7.4, 0.15)}{olho(10.45, 7.4, 0.15)}
      <path d="M9.6 8 Q10 8.25 10.4 8" {...L(0.18)} />
    </g>;
    /* ================================================================ Pinóquio (Collodi/Mazzanti) */
    case 'pinoquio_de_mazzanti': return <g>
      {tubo('M5.4 14.4 V18.4', 0.6, cor(AREIA), 'p1')}{tubo('M8.3 14.4 L9 18.3', 0.6, cor(AREIA), 'p2')}
      <circle cx={5.4} cy={16.4} r={0.4} fill={cor(TERRA)} {...C(0.25)} /><circle cx={8.65} cy={16.4} r={0.4} fill={cor(TERRA)} {...C(0.25)} />
      <path d="M4.4 18.2 H6 Q7.6 18.4 7.4 19.6 H4.2 Z M8.4 18.2 H10 Q11.8 18.4 11.6 19.6 H8.2 Z" fill={cor(MARROM)} {...C(0.4)} />
      {tubo('M4.9 8.8 L3.6 11 L3.8 12.8', 0.6, cor(AREIA), 'b1')}{tubo('M8.7 8.8 L10.6 10.6 L12 9', 0.6, cor(AREIA), 'b2')}
      <circle cx={3.6} cy={11} r={0.4} fill={cor(TERRA)} {...C(0.25)} /><circle cx={10.6} cy={10.6} r={0.4} fill={cor(TERRA)} {...C(0.25)} />
      <circle cx={3.8} cy={13.1} r={0.6} fill={cor(AREIA)} {...C(0.35)} /><circle cx={12.2} cy={8.7} r={0.6} fill={cor(AREIA)} {...C(0.35)} />
      <path d="M4.4 12.4 H9.2 L9.4 14.5 H7.2 L6.8 13.7 L6.4 14.5 H4.2 Z" fill={cor(VERDE)} {...C(0.45)} />
      <path d="M4.8 8.2 L8.8 8.2 L9.2 12.6 L4.4 12.6 Z" fill={cor(CREME)} {...C(0.5)} />
      {[[5.5, 9.4], [7.8, 9.8], [6.4, 11.4], [8.4, 11.8], [5.2, 11.9]].map(([x, y], k) => <g key={k}>
        {[0, 1, 2, 3, 4].map(j => <circle key={j} cx={f(x + Math.cos(j * 1.26) * 0.32)} cy={f(y + Math.sin(j * 1.26) * 0.32)} r={0.2} fill={cor(k % 2 ? ROSA : VERMELHO)} />)}
        <circle cx={x} cy={y} r={0.14} fill={cor(OURO)} />
      </g>)}
      <path d="M5 8.2 L6.8 9.2 L8.6 8.2" fill={cor(BRANCO)} {...C(0.3)} />
      <rect x={6.4} y={7.4} width={0.8} height={1} fill={cor(AREIA)} {...C(0.3)} />
      <circle cx={6.8} cy={5.6} r={2.2} fill={cor(AREIA)} {...C(0.55)} />
      <path d="M8.4 5.3 L13.7 5.95 L8.5 6.5 Z" fill={cor(AREIA)} {...C(0.4)} />
      <circle cx={6.3} cy={5} r={0.55} fill={cor(BRANCO)} {...C(0.3)} /><circle cx={7.7} cy={4.9} r={0.5} fill={cor(BRANCO)} {...C(0.3)} />
      {olho(6.45, 5, 0.25)}{olho(7.85, 4.9, 0.23)}
      <path d="M5.8 4.2 q0.5 -0.3 1 0 M7.3 4.1 q0.4 -0.25 0.8 0" {...L(0.2)} />
      <path d="M5.9 6.9 Q6.8 7.6 7.8 6.9" {...L(0.3)} />
      <circle cx={5.6} cy={6.1} r={0.3} fill={cor(ROSA)} opacity={0.45} />
      <path d="M4.4 4.6 Q5 0.6 7.4 0.2 Q8.4 2 9.3 4.3 Q6.8 3.6 4.4 4.6 Z" fill={cor(BRANCO)} {...C(0.5)} />
      {[[6, 3], [7.2, 2], [7.6, 3.4], [6.6, 1.4]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r={0.14} fill={cor(AREIA)} />)}
    </g>;
    case 'gepeto_talhando': return <g>
      <path d="M7 15.6 H19.6 V17 H7 Z" fill={cor(MARROM)} {...C(0.5)} />
      <path d="M8.4 17 V19.6 M18.2 17 V19.6" fill="none" stroke={tinta} strokeWidth={s(1)} strokeLinecap="round" />
      <path d="M10 11 L18.4 11 Q19.6 13.2 18.4 15.6 L10 15.6 Q9 13.3 10 11 Z" fill={cor(TERRA)} {...C(0.55)} />
      <ellipse cx={18.4} cy={13.3} rx={1.1} ry={2.3} fill={cor(AREIA)} {...C(0.4)} />
      <ellipse cx={18.4} cy={13.3} rx={0.55} ry={1.2} fill="none" stroke={tinta} strokeWidth={s(0.2)} />
      <path d="M11 12.6 H16.6 M11.6 14.2 H17" fill="none" stroke={tinta} strokeWidth={s(0.2)} opacity={0.6} />
      <circle cx={13.8} cy={9.2} r={2} fill={cor(AREIA)} {...C(0.5)} />
      <path d="M12.4 10.6 Q13.4 11.4 15.6 10.8" fill={cor(AREIA)} />
      <path d="M12.1 9.1 L7.8 8.7 L12.1 9.8 Z" fill={cor(AREIA)} {...C(0.35)} />
      <circle cx={13.6} cy={8.5} r={0.4} fill={cor(BRANCO)} {...C(0.2)} /><circle cx={14.7} cy={8.5} r={0.36} fill={cor(BRANCO)} {...C(0.2)} />
      {olho(13.5, 8.55, 0.18)}{olho(14.6, 8.55, 0.17)}
      <path d="M13.2 10.2 Q14 10.7 14.8 10.2" {...L(0.25)} />
      <path d={`M15.6 16.2 q0.4 -0.8 1 -0.4 q0.4 0.6 -0.3 0.8 M12 16.3 q-0.5 -0.7 0.2 -1 q0.6 0.1 0.3 0.7`} fill="none" stroke={tinta} strokeWidth={s(0.25)} />
      <path d="M0.4 20 Q0.4 13.6 3.6 12.6 L6.6 12.6 Q8.6 14 8.8 20 Z" fill={cor(MARROM)} {...C(0.55)} />
      <path d="M1.4 15.4 h1.6 v1.6 h-1.6 Z" fill={cor(AREIA)} {...C(0.25)} />
      <path d="M3.6 12.6 L4.8 14 L6.2 12.6" fill={cor(BRANCO)} {...C(0.3)} />
      {tubo('M6.6 14.4 Q8.4 14.6 9.6 13.2', 1.2, cor(MARROM), 'b')}
      <path d="M10.2 12.8 L12 11.6" stroke={cor(CINZA2)} strokeWidth={s(0.45)} strokeLinecap="round" /><path d="M10.2 12.8 L12 11.6" {...L(0.15)} />
      <path d="M9.4 13.4 L10.6 12.6" fill="none" stroke={tinta} strokeWidth={s(0.9)} strokeLinecap="round" />
      <circle cx={9.8} cy={13.2} r={0.75} fill={cor(PELE)} {...C(0.4)} />
      <circle cx={4.4} cy={7.8} r={2.8} fill={cor(PELE)} {...C(0.55)} />
      <path d="M1.6 7.8 Q1.2 3.6 4.6 3.6 Q7.8 3.6 7.4 6.4 Q5.8 5.5 4 5.9 Q2.9 6.4 2.8 9.2 Q1.8 9.2 1.6 7.8 Z" fill={cor(AMARELO)} {...C(0.5)} />
      <circle cx={2} cy={9.6} r={0.8} fill={cor(AMARELO)} {...C(0.4)} />
      <path d="M2.6 5 q0.6 0.8 0.2 1.6 M4 4.2 q0.6 0.8 0.2 1.6 M5.6 4 q0.6 0.7 0.3 1.4 M2 6.8 q0.5 0.7 0.2 1.4 M1.8 9.6 q0.3 -0.4 0.5 0" {...L(0.25)} />
      <path d="M3.4 8 q-0.6 0.4 0 1" {...L(0.25)} />
      {olho(5.5, 7.4, 0.24)}
      <path d="M5 6.7 q0.6 -0.4 1.2 0" {...L(0.25)} />
      <circle cx={6.9} cy={8.4} r={0.8} fill={cor(PELE)} {...C(0.35)} />
      <path d="M5.4 9.6 Q6.4 9.1 7.3 9.8 Q6.4 9.6 5.4 9.9 Z" fill={cor(CINZA3)} {...C(0.25)} />
      <path d="M5.8 10.4 Q6.4 10.7 6.9 10.4" {...L(0.25)} />
      <circle cx={4.9} cy={9} r={0.45} fill={cor(ROSA)} opacity={0.5} />
    </g>;
    /* ================================================================ O Livro da Selva (Kipling) */
    case 'mowgli_e_baloo': return <g>
      <path d="M0.4 16.2 H19.6" {...L(0.5)} /><path d="M1.4 16.2 l0.3 -0.9 M2.2 16.2 l-0.2 -0.8 M17.4 16.2 l0.3 -0.9 M18.2 16.2 l-0.2 -0.7 M9.6 16.2 l0.2 -0.7" {...L(0.3)} />
      <path d="M3.4 12.6 L3.2 15.8 H5 L5.4 12.8 Z M11.4 12.4 L11.6 15.8 H13.4 L13.4 12 Z" fill={cor(TERRA)} {...C(0.45)} />
      <path d="M2.2 10.6 Q2 6.6 6.4 6 Q10.4 5.2 14 6.6 Q16 7.6 15.6 10.8 Q15 13.6 10 13.8 Q4 13.8 2.2 10.6 Z" fill={cor(MARROM)} {...C(0.6)} />
      <path d="M2.4 9 l-0.6 -0.3 M2.2 10.4 l-0.7 0 M3 12 l-0.6 0.4 M10 6 l0.2 -0.6 M12 6.3 l0.3 -0.6" {...L(0.3)} />
      <path d="M4.6 12.6 L4.4 16 H6.6 L6.8 12.8 Z M12.6 12.6 L12.8 16 H15 L14.8 12 Z" fill={cor(MARROM)} {...C(0.45)} />
      <path d="M4.6 16 v-0.5 M5.4 16 v-0.5 M6.2 16 v-0.5 M13 16 v-0.5 M13.8 16 v-0.5 M14.6 16 v-0.5" {...L(0.2)} />
      <path d="M14 7.6 Q14.6 5.4 16.8 5.6 Q18.6 5.8 19.2 7.6 L19.6 8.6 Q19.4 9.6 18.2 9.6 Q15.6 10.6 14.6 9.6 Z" fill={cor(MARROM)} {...C(0.55)} />
      <circle cx={15.4} cy={5.7} r={0.85} fill={cor(MARROM)} {...C(0.4)} />
      <ellipse cx={18.3} cy={8.5} rx={1.3} ry={0.9} fill={cor(AREIA)} {...C(0.35)} />
      <circle cx={19.35} cy={8.1} r={0.35} fill={tinta} />
      {olho(16.7, 7.2, 0.26)}
      <path d="M17.6 9 Q18.2 9.4 18.8 9" {...L(0.25)} />
      <path d="M8.6 7.4 Q10 8.6 9.6 10.6" fill="none" stroke={tinta} strokeWidth={s(1.6)} strokeLinecap="round" />
      <path d="M8.6 7.4 Q10 8.6 9.6 10.6" fill="none" stroke={cor(PELE_MORENA)} strokeWidth={s(0.9)} strokeLinecap="round" />
      {tubo('M7.8 4.4 Q6.8 5.6 7.2 6.4', 0.6, cor(PELE_MORENA), 'b1')}
      <path d="M7.4 3.2 L9.2 3.2 L9.4 6.2 L7.3 6.2 Z" fill={cor(PELE_MORENA)} {...C(0.45)} />
      {tubo('M9 3.8 Q10.6 3.4 12 2.4', 0.6, cor(PELE_MORENA), 'b2')}
      <path d="M7.2 5.8 L9.5 5.8 L9.7 7.2 L7 7.2 Z" fill={cor(VERMELHO)} {...C(0.4)} />
      <circle cx={8.3} cy={1.9} r={1.3} fill={cor(PELE_MORENA)} {...C(0.45)} />
      <path d="M7 2.2 Q6.6 0.4 8.4 0.4 Q10 0.4 9.6 1.8 L9 1.2 L8.4 1.6 L7.8 1.1 Z" fill={tinta} />
      {olho(8.8, 2.1, 0.17)}
      <path d="M8.6 2.7 Q9 2.9 9.3 2.6" {...L(0.2)} />
    </g>;
    case 'bagheera_no_galho': return <g>
      {tubo('M0.4 9.8 Q8 8.4 19.6 9.6', 1.4, cor(MARROM), 'g')}
      <path d="M2 9.6 l1 0.2 M9 9 l1.2 0.1 M15 9.2 l1.2 0.1" {...L(0.25)} />
      <ellipse cx={1.4} cy={8.2} rx={1.2} ry={0.55} transform="rotate(-30 1.4 8.2)" fill={cor(VERDE)} {...C(0.35)} />
      <ellipse cx={18.8} cy={11.2} rx={1.1} ry={0.5} transform="rotate(30 18.8 11.2)" fill={cor(VERDE)} {...C(0.35)} />
      <path d="M19.4 9.6 L18.6 10.8" {...L(0.35)} />
      <path d="M2.6 8.8 Q0.8 10.2 1.2 11.8 Q1.6 12.6 2.6 12.2" fill="none" stroke={tinta} strokeWidth={s(0.85)} strokeLinecap="round" />
      {tubo('M4.4 8.9 Q4.8 10.6 4.2 11.8', 0.75, tinta, 'p1')}
      <path d="M2.4 8.9 Q2.6 6.8 5 6.3 Q8.6 5.4 12 5.8 Q14.2 6 15 7.2 Q15.2 8.6 13.8 9 L3.6 9.3 Z" fill={tinta} />
      {tubo('M13.6 8.6 Q14.4 10.2 14 11.6', 0.75, tinta, 'p2')}{tubo('M12.4 8.8 Q12.6 10.2 12.2 11.2', 0.7, tinta, 'p3')}
      <path d="M3.6 7.4 Q8 5.6 12.6 6.2" fill="none" stroke={cor(CINZA3)} strokeWidth={s(0.3)} opacity={0.8} />
      {[[5.6, 7.6], [7.6, 7], [9.6, 7], [6.6, 8.4], [8.6, 8.3], [10.8, 8], [11.6, 7]].map(([x, y], k) => <path key={k} d={`M${x - 0.4} ${y} q0.4 -0.5 0.8 0`} fill="none" stroke={cor(CINZA2)} strokeWidth={s(0.22)} />)}
      <path d="M13.6 6.8 Q13.4 4.6 15.4 4 Q17 3.6 17.8 4.6 L19.4 5.4 Q19.8 6.4 19 6.8 L17.6 7.2 Q15.6 8.4 13.6 6.8 Z" fill={tinta} />
      <path d="M15 4.2 Q15.2 2.8 16.2 3.2 Q16.4 3.8 16 4.2 Z" fill={tinta} />
      <path d="M16.5 4.9 Q17.2 4.3 17.9 4.9 Q17.2 5.4 16.5 4.9 Z" fill={cor(LIMAO)} />
      <ellipse cx={17.2} cy={4.88} rx={0.11} ry={0.3} fill={tinta} />
      <path d="M19 5.4 L19.5 5.6" fill="none" stroke={cor(CINZA2)} strokeWidth={s(0.35)} strokeLinecap="round" />
      <path d="M18.8 6.5 Q18.2 6.9 17.6 6.7" fill="none" stroke={cor(CINZA3)} strokeWidth={s(0.2)} strokeLinecap="round" />
      <path d="M18.2 6.1 l1.6 -0.3 M18.2 6.3 l1.6 0.4" fill="none" stroke={cor(CINZA3)} strokeWidth={s(0.15)} />
      <path d="M14.4 5.8 Q15 7 16.4 7.2" fill="none" stroke={cor(CINZA2)} strokeWidth={s(0.2)} />
    </g>;
    case 'kaa_enrodilhada': {
      const anel = (cx: number, cy: number, rx: number, ry: number, k: number) => <g key={k}>
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={tinta} strokeWidth={s(2.5)} />
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={cor(AMARELO)} strokeWidth={s(1.75)} />
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={cor(MARROM)} strokeWidth={s(1)} strokeDasharray="0.9 1.4" />
      </g>;
      return <g>
        {tubo('M3.2 17.2 Q0.8 18.6 2.4 19.5', 0.5, cor(AMARELO), 'r')}
        {anel(10, 16.3, 7.4, 2.5, 1)}{anel(10, 13.4, 6, 2.1, 2)}{anel(10, 10.9, 4.5, 1.7, 3)}
        <path d="M14.5 10.9 Q16.8 7.2 13.4 5.2 Q11.8 4.3 10.4 4.4" fill="none" stroke={tinta} strokeWidth={s(2.2)} strokeLinecap="round" />
        <path d="M14.5 10.9 Q16.8 7.2 13.4 5.2 Q11.8 4.3 10.4 4.4" fill="none" stroke={cor(AMARELO)} strokeWidth={s(1.45)} strokeLinecap="round" />
        <path d="M14.5 10.9 Q16.8 7.2 13.4 5.2 Q11.8 4.3 10.4 4.4" fill="none" stroke={cor(MARROM)} strokeWidth={s(0.8)} strokeDasharray="0.8 1.3" />
        <path d="M10.8 3.4 Q8.8 2.2 6 2.8 Q4.4 3.3 4.5 4.3 Q4.9 5.4 7 5.4 Q9.4 5.6 11 5 Z" fill={cor(AMARELO)} {...C(0.5)} />
        <path d="M8.4 3 l0.8 0.3 l-0.4 0.6 Z M9.8 4.4 l0.6 0.1 l-0.2 0.5 Z" fill={cor(MARROM)} />
        <path d="M6.6 3.2 Q7.6 2.9 8.3 3.5" {...L(0.3)} />
        {olho(7.5, 3.8, 0.3)}
        <circle cx={5.1} cy={3.6} r={0.14} fill={tinta} />
        <path d="M4.8 4.8 Q6.4 5 8.2 4.8" {...L(0.2)} />
        <path d="M4.6 4.4 L3.2 4.6 M3.2 4.6 l-0.7 -0.5 M3.2 4.6 l-0.7 0.4" fill="none" stroke={cor(VERMELHO)} strokeWidth={s(0.35)} strokeLinecap="round" />
      </g>;
    }
    case 'shere_khan': return <g>
      <path d="M2.8 4.2 Q3 1.4 5.8 2 L4.8 2.8 L6.2 3.4 Q5 5.4 2.8 4.2 Z" fill={cor(LARANJA)} {...C(0.5)} />
      <circle cx={15.4} cy={3.4} r={1.9} fill={cor(LARANJA)} {...C(0.5)} /><circle cx={15.4} cy={3.6} r={0.9} fill={tinta} />
      <path d="M3 9 Q2.6 4 6 2.8 Q10 1.6 14 2.8 Q17.4 4 17 9 Q18.6 11 17.4 13.4 Q15 17.8 10 18 Q5 17.8 2.6 13.4 Q1.4 11 3 9 Z" fill={cor(LARANJA)} {...C(0.65)} />
      <path d="M2.7 11 Q4.4 12 6 13.6 Q5.4 16 7.4 17.6 Q4 16.8 2.7 13.4 Z M17.3 11 Q15.6 12 14 13.6 Q14.6 16 12.6 17.6 Q16 16.8 17.3 13.4 Z" fill={cor(BRANCO)} {...C(0.35)} />
      <path d="M7 12.4 Q10 10.8 13 12.4 Q13.6 15.6 10 16.6 Q6.4 15.6 7 12.4 Z" fill={cor(BRANCO)} {...C(0.4)} />
      <ellipse cx={7} cy={7.6} rx={1.8} ry={1.1} fill={cor(BRANCO)} /><ellipse cx={13} cy={7.6} rx={1.8} ry={1.1} fill={cor(BRANCO)} />
      <path d="M9 3.2 L10 5.6 L11 3.2 Z M7.4 3.4 L8.2 5.6 L8.4 3.2 Z M12.6 3.4 L11.8 5.6 L11.6 3.2 Z" fill={tinta} />
      <path d="M3 7.2 Q5 7.4 5.8 8.6 Q4.4 8.4 3 8.4 Z M17 7.2 Q15 7.4 14.2 8.6 Q15.6 8.4 17 8.4 Z M2.6 10.4 Q4.4 10.2 5.4 11.2 Q4 11.2 2.4 11.4 Z M17.4 10.4 Q15.6 10.2 14.6 11.2 Q16 11.2 17.6 11.4 Z M3.6 5.2 Q5 5.6 5.4 6.6 Q4.4 6.2 3.2 6.2 Z M16.4 5.2 Q15 5.6 14.6 6.6 Q15.6 6.2 16.8 6.2 Z" fill={tinta} />
      <path d="M5.3 8.2 Q6.6 6.9 8.7 7.7 Q7.8 9.2 5.3 8.2 Z M14.7 8.2 Q13.4 6.9 11.3 7.7 Q12.2 9.2 14.7 8.2 Z" fill={cor(AMARELO)} {...C(0.45)} />
      <circle cx={7.2} cy={8} r={0.45} fill={tinta} /><circle cx={12.8} cy={8} r={0.45} fill={tinta} />
      <path d="M5 6.4 L8.9 7.3 M15 6.4 L11.1 7.3" {...L(0.65)} />
      <path d="M8.6 10.6 H11.4 Q11 12 10 12.2 Q9 12 8.6 10.6 Z" fill={cor(ROSA)} {...C(0.45)} />
      <path d="M10 12.2 V13" {...L(0.35)} />
      <path d="M7.6 13.4 Q10 12.7 12.4 13.4 Q12.1 16.2 10 16.3 Q7.9 16.2 7.6 13.4 Z" fill={cor(VERMELHO)} {...C(0.45)} />
      <path d="M8.2 13.2 L8.6 15 L9.1 13.1 Z M11.8 13.2 L11.4 15 L10.9 13.1 Z M8.6 16.1 L8.9 15.1 L9.3 16.2 Z M11.4 16.1 L11.1 15.1 L10.7 16.2 Z" fill={cor(BRANCO)} {...C(0.25)} />
      {[[7.6, 12.2], [8.2, 12.8], [12.4, 12.2], [11.8, 12.8]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r={0.15} fill={tinta} />)}
    </g>;
    default: return undefined;
  }
}
