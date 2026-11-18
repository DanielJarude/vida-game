/**
 * VIDA 23 — AS JOIAS COM IDENTIDADE PRÓPRIA. Duas coisas que faltavam:
 *
 * 1. O ACABAMENTO DO METAL, além da cor: o ouro amarelo e o rosé polidos (borda quente e um brilho curto e forte), o
 *    folheado acetinado (o mesmo amarelo, brilho mais fraco), o ouro branco e a platina espelhados (dois brilhos, borda
 *    fria), a prata espelhada de alto contraste, o aço escovado (o brilho em risquinhos, não em ponto), o titânio fosco
 *    (sem brilho, borda escura), o preto (PVD) acetinado. Um traço de metal tem sempre a borda, o corpo e o brilho do
 *    acabamento: duas argolas do mesmo tamanho, uma de aço e uma de ouro branco, não são mais a mesma argola cinza.
 * 2. AS FORMAS NOVAS dos brincos, colares, pulseiras e anéis (`dados20/joias20`, VIDA 23), cada uma com construção
 *    própria — o fio fino da argola grande, o tubo da argola grossa, a fileira de pedras da huggie, o triângulo vazado,
 *    a corrente passante que cai dos dois lados, a haste com três pedras em escada, o leque do candelabro, a esfera
 *    polida, a flor, a pérola pendurada, o par assimétrico, a lâmina, a lua, o climber que sobe a orelha; a cubana, as
 *    pérolas, as camadas, o colar longo com barra, o cordão de couro; o bracelete largo, as pérolas no pulso, a corrente
 *    dupla; o bandão, o anel duplo, a pérola no aro.
 *
 * Usado pelo retrato (o lóbulo, o colo) e pela figura (o pescoço, o pulso, a mão): o que a vitrine mostra de perto é o
 * mesmo desenho que aparece no corpo.
 */
import type { ReactElement } from 'react';
import { METAIS20, PEDRAS20, type Metal20, type Pedra20 } from '../../motor/dados20/joias20';

export type TipoDeAcabamento = 'polido' | 'espelhado' | 'escovado' | 'fosco' | 'acetinado';
export interface Acabamento { base: string; borda: string; brilho: string; tipo: TipoDeAcabamento }

/** O acabamento de cada metal (os da joalheria e os dos piercings). */
const ACABAMENTOS: Record<string, Acabamento> = {
  ouro_amarelo: { base: '#d8b45a', borda: '#8a6420', brilho: '#fff1b8', tipo: 'polido' },
  ouro: { base: '#d8b45a', borda: '#8a6420', brilho: '#fff1b8', tipo: 'polido' },
  folheado: { base: '#e0c26a', borda: '#a48638', brilho: '#f6e7b0', tipo: 'acetinado' },
  ouro_rose: { base: '#d39a83', borda: '#8a4f3e', brilho: '#ffe1d3', tipo: 'polido' },
  ouro_branco: { base: '#e3e1d8', borda: '#8c897e', brilho: '#ffffff', tipo: 'espelhado' },
  platina: { base: '#e4e5e8', borda: '#737882', brilho: '#ffffff', tipo: 'espelhado' },
  prata: { base: '#cdd2d8', borda: '#626a74', brilho: '#ffffff', tipo: 'espelhado' },
  aco: { base: '#9da3a9', borda: '#555b62', brilho: '#dfe3e7', tipo: 'escovado' },
  titanio: { base: '#7c838b', borda: '#454a51', brilho: '#a9b0b8', tipo: 'fosco' },
  preto: { base: '#35373c', borda: '#0f1012', brilho: '#7a7f87', tipo: 'acetinado' },
  titanio_azul: { base: '#4f7fd6', borda: '#24427e', brilho: '#bcd2ff', tipo: 'polido' },
  titanio_arco: { base: '#9b6fd0', borda: '#3e4f8e', brilho: '#e6c96a', tipo: 'polido' }
};
export const acabamento = (metal: string): Acabamento => ACABAMENTOS[metal] ?? ACABAMENTOS.aco;
export const NOME_DO_ACABAMENTO: Record<TipoDeAcabamento, string> = { polido: 'polido', espelhado: 'espelhado', escovado: 'escovado', fosco: 'fosco', acetinado: 'acetinado' };
const corDaPedra = (p?: string) => (p && p in PEDRAS20 ? PEDRAS20[p as Pedra20].cor : p);
const n2 = (x: number) => x.toFixed(2);

/**
 * Um traço de metal (o aro, a corrente, a haste): a borda, o corpo e o brilho do acabamento. `w`: a espessura.
 * `elos`: a corrente (o corpo em elos, não liso).
 */
export function TracoDeMetal({ d, w, metal, elos, comp = 10 }: { d: string; w: number; metal: string; elos?: number; comp?: number }): ReactElement {
  const a = acabamento(metal);
  const brilho = a.tipo === 'fosco' ? null
    : a.tipo === 'escovado' ? <path d={d} fill="none" stroke={a.brilho} strokeWidth={n2(w * 0.28)} strokeDasharray={`${n2(w * 0.3)} ${n2(w * 0.45)}`} opacity={0.75} />
      : a.tipo === 'espelhado' ? <path d={d} fill="none" stroke={a.brilho} strokeWidth={n2(w * 0.4)} strokeDasharray={`${n2(comp * 0.08)} ${n2(comp * 0.22)} ${n2(comp * 0.05)} ${n2(comp)}`} strokeLinecap="round" />
        : <path d={d} fill="none" stroke={a.brilho} strokeWidth={n2(w * 0.38)} strokeDasharray={`${n2(comp * 0.12)} ${n2(comp)}`} strokeLinecap="round" opacity={a.tipo === 'acetinado' ? 0.5 : 0.95} />;
  return (
    <g data-acabamento={a.tipo}>
      <path d={d} fill="none" stroke={a.borda} strokeWidth={n2(w + 0.32)} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={a.base} strokeWidth={n2(w)} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={elos ? `${n2(elos)} ${n2(elos * 0.35)}` : undefined} />
      {brilho}
    </g>
  );
}
/** Uma pedra (o círculo com a garra de metal em volta e o brilho da lapidação). Pérola: lisa, com o brilho leitoso. */
export function Pedra({ x, y, r, pedra, metal }: { x: number; y: number; r: number; pedra?: string; metal: string }): ReactElement {
  const a = acabamento(metal);
  const perola = pedra === 'perola';
  const cor = corDaPedra(pedra) ?? a.base;
  return (
    <g data-pedra={pedra}>
      <circle cx={n2(x)} cy={n2(y)} r={n2(r)} fill={cor} stroke={perola ? '#b7ad9c' : a.borda} strokeWidth={n2(Math.max(0.12, r * 0.22))} />
      {perola ? <circle cx={n2(x - r * 0.35)} cy={n2(y - r * 0.35)} r={n2(r * 0.4)} fill="#ffffff" opacity={0.75} />
        : <path d={`M ${n2(x - r * 0.45)} ${n2(y - r * 0.1)} L ${n2(x - r * 0.1)} ${n2(y - r * 0.5)} L ${n2(x + r * 0.15)} ${n2(y - r * 0.2)}`} fill="none" stroke="#ffffff" strokeWidth={n2(r * 0.22)} opacity={0.85} />}
    </g>
  );
}
/** Uma esfera de metal polida (a bolinha, a ponta da barra). */
function Esfera({ x, y, r, metal }: { x: number; y: number; r: number; metal: string }): ReactElement {
  const a = acabamento(metal);
  return <g><circle cx={n2(x)} cy={n2(y)} r={n2(r)} fill={a.base} stroke={a.borda} strokeWidth={n2(r * 0.2)} />{a.tipo !== 'fosco' && <circle cx={n2(x - r * 0.35)} cy={n2(y - r * 0.38)} r={n2(r * (a.tipo === 'escovado' ? 0.22 : 0.32))} fill={a.brilho} opacity={a.tipo === 'acetinado' ? 0.6 : 0.95} />}</g>;
}

/* ------------------------------------------------------------------ brincos (no lóbulo, em x, y; s = o lado na tela) */

/** Os brincos das formas novas (ou nada, para as de antes). */
export function Brinco23({ forma, metal, pedra, x, y, s }: { forma: string; metal: Metal20 | string; pedra?: string; x: number; y: number; s: number }): ReactElement | null {
  const m = { className: 'retrato__joia', 'data-brinco': forma, 'data-metal': metal } as Record<string, string>;
  switch (forma) {
    case 'argola_fina': { const r = 3.9, cx = x + s * 0.5, cy = y + r - 0.6; return <g {...m}><TracoDeMetal d={`M ${n2(cx)} ${n2(cy - r)} A ${r} ${r} 0 1 1 ${n2(cx - 0.01)} ${n2(cy - r)}`} w={0.32} metal={metal} comp={r * 3} /></g>; }
    case 'argola_grossa': { const r = 1.75, cx = x + s * 0.4, cy = y + r - 0.3; return <g {...m}><TracoDeMetal d={`M ${n2(cx)} ${n2(cy - r)} A ${r} ${r} 0 1 1 ${n2(cx - 0.01)} ${n2(cy - r)}`} w={1.25} metal={metal} comp={r * 3} /></g>; }
    case 'huggie': { const r = 1.25, cx = x + s * 0.15, cy = y + 0.9; return <g {...m}><TracoDeMetal d={`M ${n2(cx - r * 0.7)} ${n2(cy - r * 0.7)} A ${r} ${r} 0 1 0 ${n2(cx + r * 0.7)} ${n2(cy - r * 0.7)}`} w={0.75} metal={metal} comp={4} />{[-0.75, -0.25, 0.25, 0.75].map(t => <Pedra key={t} x={cx + Math.sin(t) * r} y={cy + Math.cos(t) * r} r={0.3} pedra={pedra} metal={metal} />)}</g>; }
    case 'geometrico': { const t = y + 1.6, L = 3.4; return <g {...m}><TracoDeMetal d={`M ${n2(x)} ${n2(y)} V ${n2(t)}`} w={0.3} metal={metal} /><TracoDeMetal d={`M ${n2(x)} ${n2(t)} L ${n2(x + L * 0.55)} ${n2(t + L * 0.95)} L ${n2(x - L * 0.55)} ${n2(t + L * 0.95)} Z`} w={0.42} metal={metal} comp={8} /></g>; }
    case 'corrente_fio': return <g {...m}><TracoDeMetal d={`M ${n2(x)} ${n2(y)} q ${n2(s * 0.3)} 3 ${n2(-s * 0.2)} 6.4`} w={0.32} metal={metal} elos={0.5} /><TracoDeMetal d={`M ${n2(x + s * 0.4)} ${n2(y - 0.2)} q ${n2(s * 0.9)} 1.6 ${n2(s * 0.7)} 3.6`} w={0.3} metal={metal} elos={0.5} /><Esfera x={x - s * 0.2} y={y + 6.6} r={0.42} metal={metal} /></g>;
    case 'pendente_longo': return <g {...m}><TracoDeMetal d={`M ${n2(x)} ${n2(y)} V ${n2(y + 6.4)}`} w={0.32} metal={metal} comp={6} />{[[1.6, 0.48], [3.9, 0.66], [6.6, 0.9]].map(([dy, r]) => <Pedra key={dy} x={x} y={y + dy} r={r} pedra={pedra} metal={metal} />)}</g>;
    case 'candelabro': {
      const top = y + 1.2;
      return <g {...m}><Pedra x={x} y={y + 0.2} r={0.62} pedra={pedra} metal={metal} /><TracoDeMetal d={`M ${n2(x - 2.4)} ${n2(top + 1.2)} Q ${n2(x)} ${n2(top - 0.6)} ${n2(x + 2.4)} ${n2(top + 1.2)}`} w={0.38} metal={metal} comp={6} />
        {[-2.2, -1.1, 0, 1.1, 2.2].map((dx, k) => { const l = 2.4 + (2 - Math.abs(k - 2)) * 1.2; return <g key={dx}><TracoDeMetal d={`M ${n2(x + dx)} ${n2(top + 0.8)} V ${n2(top + 0.8 + l)}`} w={0.22} metal={metal} comp={4} /><Pedra x={x + dx} y={top + 1.1 + l} r={0.48} pedra={pedra} metal={metal} /></g>; })}</g>;
    }
    case 'bolinha': return <g {...m}><Esfera x={x} y={y + 0.4} r={1.15} metal={metal} /></g>;
    case 'flor': return <g {...m}>{[0, 1, 2, 3, 4, 5].map(k => { const a = (k / 6) * Math.PI * 2; return <Pedra key={k} x={x + Math.cos(a) * 1.05} y={y + 0.5 + Math.sin(a) * 1.05} r={0.52} pedra={pedra} metal={metal} />; })}<Esfera x={x} y={y + 0.5} r={0.5} metal={metal} /></g>;
    case 'argola_perola': { const r = 1.5, cx = x + s * 0.2, cy = y + r - 0.2; return <g {...m}><TracoDeMetal d={`M ${n2(cx)} ${n2(cy - r)} A ${r} ${r} 0 1 1 ${n2(cx - 0.01)} ${n2(cy - r)}`} w={0.42} metal={metal} comp={4} /><Pedra x={cx} y={cy + r + 0.9} r={0.95} pedra="perola" metal={metal} /></g>; }
    case 'assimetrico': return s > 0
      ? <g {...m} data-lado="longo"><TracoDeMetal d={`M ${n2(x)} ${n2(y)} V ${n2(y + 7.6)}`} w={0.28} metal={metal} comp={7} /><Pedra x={x} y={y + 8.3} r={0.75} pedra={pedra} metal={metal} /></g>
      : <g {...m} data-lado="ponto"><Pedra x={x} y={y + 0.4} r={0.7} pedra={pedra} metal={metal} /></g>;
    case 'barra': { const a = acabamento(metal); return <g {...m}><Esfera x={x} y={y + 0.2} r={0.45} metal={metal} /><rect x={n2(x - 0.45)} y={n2(y + 0.7)} width={0.9} height={4.4} rx={0.2} fill={a.base} stroke={a.borda} strokeWidth={0.2} />{a.tipo !== 'fosco' && <path d={`M ${n2(x - 0.15)} ${n2(y + 1)} V ${n2(y + 2.6)}`} stroke={a.brilho} strokeWidth={0.22} opacity={a.tipo === 'acetinado' ? 0.5 : 0.9} />}</g>; }
    case 'meia_lua': { const a = acabamento(metal), r = 1.75, cy = y + 1.5; return <g {...m}><path d={`M ${n2(x)} ${n2(y - 0.2)} V ${n2(cy - 0.4)}`} stroke={a.borda} strokeWidth={0.25} /><path d={`M ${n2(x - r)} ${n2(cy - 0.4)} A ${r} ${r} 0 0 0 ${n2(x + r)} ${n2(cy - 0.4)} A ${n2(r * 0.85)} ${n2(r * 0.4)} 0 0 1 ${n2(x - r)} ${n2(cy - 0.4)} Z`} fill={a.base} stroke={a.borda} strokeWidth={0.22} /><path d={`M ${n2(x - r * 0.5)} ${n2(cy + 0.5)} q ${n2(r * 0.5)} 0.35 ${n2(r)} 0`} fill="none" stroke={a.brilho} strokeWidth={0.2} strokeDasharray="0.3 0.25" /></g>; }
    case 'climber': return <g {...m}>{[0, 1, 2, 3, 4].map(k => <Pedra key={k} x={x + s * (0.5 + k * 0.42)} y={y - k * 1.3} r={0.55 - k * 0.06} pedra={pedra} metal={metal} />)}</g>;
    default: return null;
  }
}

/* ------------------------------------------------------------------ colares (a curva de `x0` a `x1`, descendo até `fundo`) */

const naCurva = (cx: number, meia: number, y0: number, yf: number, t: number) => {
  const p0 = cx - meia, p2 = cx + meia, q = yf + (yf - y0);
  return { x: (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * cx + t * t * p2, y: (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * q + t * t * y0 };
};
/** Os colares das formas novas no retrato (ou nada, para os de antes). */
export function Colar23({ forma, metal, pedra, cx, y0, meia, fundo }: { forma: string; metal: string; pedra?: string; cx: number; y0: number; meia: number; fundo: number }): ReactElement | null {
  const m = { className: 'retrato__joia', 'data-joia': forma, 'data-metal': metal } as Record<string, string>;
  const curva = (yf: number, mm = meia) => `M ${n2(cx - mm)} ${n2(y0)} Q ${n2(cx)} ${n2(yf + (yf - y0))} ${n2(cx + mm)} ${n2(y0)}`;
  switch (forma) {
    case 'cubana': return <g {...m}><TracoDeMetal d={curva(fundo + 0.5)} w={2.1} metal={metal} elos={1.1} comp={14} /></g>;
    case 'perolas': return <g {...m}><Esfera x={cx - meia - 0.1} y={y0 + 0.2} r={0.55} metal={metal} /><Esfera x={cx + meia + 0.1} y={y0 + 0.2} r={0.55} metal={metal} /><path d={curva(fundo)} fill="none" stroke="#b9b1a2" strokeWidth={0.3} />{Array.from({ length: 15 }, (_, k) => { const p = naCurva(cx, meia, y0, fundo, 0.06 + (k / 14) * 0.88); return <Pedra key={k} x={p.x} y={p.y} r={0.78} pedra={pedra ?? 'perola'} metal={metal} />; })}</g>;
    case 'camadas': return <g {...m}><TracoDeMetal d={curva(y0 + (fundo - y0) * 0.55, meia * 0.92)} w={0.42} metal={metal} elos={0.6} /><TracoDeMetal d={curva(fundo + 3)} w={0.42} metal={metal} elos={0.6} /><Esfera x={cx} y={fundo + 4.2} r={1.05} metal={metal} /></g>;
    case 'colar_longo': { const yf = fundo + 5; const a = acabamento(metal); return <g {...m}><TracoDeMetal d={curva(yf)} w={0.42} metal={metal} elos={0.55} /><rect x={n2(cx - 0.55)} y={n2(yf + 0.5)} width={1.1} height={5.2} rx={0.25} fill={a.base} stroke={a.borda} strokeWidth={0.22} />{a.tipo !== 'fosco' && <path d={`M ${n2(cx - 0.18)} ${n2(yf + 1)} V ${n2(yf + 2.8)}`} stroke={a.brilho} strokeWidth={0.25} />}</g>; }
    case 'cordao': { const a = acabamento(metal); return <g {...m}><path d={curva(fundo + 1)} fill="none" stroke="#2c1f17" strokeWidth={0.75} strokeLinecap="round" /><path d={`M ${n2(cx - 1.4)} ${n2(fundo + 1.6)} h 2.8 v 3.2 l -1.4 1.2 l -1.4 -1.2 Z`} fill={a.base} stroke={a.borda} strokeWidth={0.25} />{a.tipo !== 'fosco' && <path d={`M ${n2(cx - 0.8)} ${n2(fundo + 2.2)} v 2`} stroke={a.brilho} strokeWidth={0.25} opacity={0.8} />}</g>; }
    default: return null;
  }
}

/* ------------------------------------------------------------------ na figura de corpo inteiro */

/** O colar no corpo (do pescoço: `cx`, `y0` = a base do pescoço, `meia` = a meia-largura do pescoço). */
export function ColarNoCorpo23({ forma, metal, pedra, cx, y0, meia }: { forma: string; metal: string; pedra?: string; cx: number; y0: number; meia: number }): ReactElement | null {
  const a = { cx, meia: meia + 0.6, y0: y0 - 1 };
  const curva = (fundo: number, mm = a.meia) => `M ${n2(cx - mm)} ${n2(a.y0)} Q ${n2(cx)} ${n2(a.y0 + fundo * 2)} ${n2(cx + mm)} ${n2(a.y0)}`;
  const g = { className: 'figura__colar', 'data-acessorio': 'pescoco', 'data-forma': forma, 'data-metal': metal } as Record<string, string>;
  switch (forma) {
    case 'cubana': return <g {...g}><TracoDeMetal d={curva(10)} w={1.9} metal={metal} elos={1} comp={14} /></g>;
    case 'perolas': return <g {...g}><Esfera x={cx - a.meia} y={a.y0} r={0.6} metal={metal} /><Esfera x={cx + a.meia} y={a.y0} r={0.6} metal={metal} />{Array.from({ length: 13 }, (_, k) => { const t = 0.07 + (k / 12) * 0.86; const x = cx - a.meia + 2 * a.meia * t; const y = a.y0 + Math.sin(Math.PI * t) * 12.5; return <Pedra key={k} x={x} y={y} r={0.85} pedra={pedra ?? 'perola'} metal={metal} />; })}</g>;
    case 'camadas': return <g {...g}><TracoDeMetal d={curva(6, a.meia - 0.4)} w={0.6} metal={metal} elos={0.6} /><TracoDeMetal d={curva(13)} w={0.6} metal={metal} elos={0.6} /><Esfera x={cx} y={a.y0 + 14.2} r={1.2} metal={metal} /></g>;
    case 'colar_longo': { const ac = acabamento(metal); return <g {...g}><TracoDeMetal d={`M ${n2(cx - a.meia)} ${n2(a.y0)} L ${n2(cx)} ${n2(a.y0 + 22)} L ${n2(cx + a.meia)} ${n2(a.y0)}`} w={0.55} metal={metal} elos={0.6} /><rect x={n2(cx - 0.7)} y={n2(a.y0 + 22.4)} width={1.4} height={6} rx={0.3} fill={ac.base} stroke={ac.borda} strokeWidth={0.25} /></g>; }
    case 'cordao': { const ac = acabamento(metal); return <g {...g}><path d={curva(11)} fill="none" stroke="#2c1f17" strokeWidth={0.9} /><path d={`M ${n2(cx - 1.6)} ${n2(a.y0 + 11.6)} h 3.2 v 3.6 l -1.6 1.4 l -1.6 -1.4 Z`} fill={ac.base} stroke={ac.borda} strokeWidth={0.25} /></g>; }
    default: return null;
  }
}
/** A pulseira no pulso (`x`, `y`; `hw` = a meia-largura do pulso). */
export function PulseiraNoCorpo23({ forma, metal, x, y, hw }: { forma: string; metal: string; x: number; y: number; hw: number }): ReactElement | null {
  const g = { className: 'figura__pulseira', 'data-acessorio': 'pulseira', 'data-forma': forma, 'data-metal': metal } as Record<string, string>;
  const arco = (dy: number) => `M ${n2(x - hw - 0.4)} ${n2(y + dy)} Q ${n2(x)} ${n2(y + dy + 1.6)} ${n2(x + hw + 0.4)} ${n2(y + dy)}`;
  switch (forma) {
    case 'bracelete_largo': { const ac = acabamento(metal); return <g {...g}><path d={`M ${n2(x - hw - 0.6)} ${n2(y - 2.2)} Q ${n2(x)} ${n2(y - 0.8)} ${n2(x + hw + 0.6)} ${n2(y - 2.2)} V ${n2(y + 1.6)} Q ${n2(x)} ${n2(y + 3)} ${n2(x - hw - 0.6)} ${n2(y + 1.6)} Z`} fill={ac.base} stroke={ac.borda} strokeWidth={0.3} />{ac.tipo !== 'fosco' && <path d={arco(-0.9)} fill="none" stroke={ac.brilho} strokeWidth={0.35} strokeDasharray={ac.tipo === 'escovado' ? '0.3 0.4' : '1.4 6'} />}</g>; }
    // VIDA 27 · §8: a pulseira de elos, a fina e a rígida eram o MESMO arco (só a espessura mudava) — cada uma com a construção dela.
    case 'elos': return <g {...g}><TracoDeMetal d={arco(0)} w={1.1} metal={metal} elos={0.75} comp={8} /></g>;
    case 'fina': return <g {...g}><TracoDeMetal d={arco(0.2)} w={0.32} metal={metal} elos={0.28} comp={8} /><Esfera x={x} y={y + 1.75} r={0.38} metal={metal} /></g>;
    case 'rigida': { const ac = acabamento(metal); return <g {...g}><path d={arco(0)} fill="none" stroke={ac.borda} strokeWidth={1.5} strokeLinecap="butt" /><path d={arco(0)} fill="none" stroke={ac.base} strokeWidth={1.05} strokeLinecap="butt" />{ac.tipo !== 'fosco' && <path d={arco(-0.25)} fill="none" stroke={ac.brilho} strokeWidth={0.3} strokeDasharray="1.4 5" />}</g>; }
    case 'pulseira_perolas': return <g {...g}><Esfera x={x + hw + 0.5} y={y + 0.2} r={0.42} metal={metal} />{[-1, -0.5, 0, 0.5, 1].map(t => <Pedra key={t} x={x + t * (hw + 0.2)} y={y + 0.8 - Math.abs(t) * 0.5} r={0.72} pedra="perola" metal={metal} />)}</g>;
    case 'corrente_dupla': return <g {...g}><TracoDeMetal d={arco(-0.7)} w={0.5} metal={metal} elos={0.5} /><TracoDeMetal d={arco(0.9)} w={0.5} metal={metal} elos={0.5} /></g>;
    default: return null;
  }
}
/** O anel na mão (`x`, `y` = o dedo). */
export function AnelNoCorpo23({ forma, metal, pedra, x, y }: { forma: string; metal: string; pedra?: string; x: number; y: number }): ReactElement | null {
  const g = { className: 'figura__anel', 'data-acessorio': 'anel', 'data-forma': forma, 'data-metal': metal } as Record<string, string>;
  const ac = acabamento(metal);
  switch (forma) {
    case 'anel_largo': return <g {...g}><rect x={n2(x - 1.5)} y={n2(y - 1.3)} width={3} height={2.6} rx={0.6} fill={ac.base} stroke={ac.borda} strokeWidth={0.25} />{ac.tipo !== 'fosco' && <path d={`M ${n2(x - 1)} ${n2(y - 0.7)} h 1.2`} stroke={ac.brilho} strokeWidth={0.3} />}</g>;
    case 'anel_duplo': return <g {...g}><TracoDeMetal d={`M ${n2(x - 1.3)} ${n2(y - 0.6)} h 2.6`} w={0.55} metal={metal} /><TracoDeMetal d={`M ${n2(x - 1.3)} ${n2(y + 0.7)} h 2.6`} w={0.55} metal={metal} /></g>;
    case 'anel_perola': return <g {...g}><TracoDeMetal d={`M ${n2(x - 1.2)} ${n2(y + 0.4)} h 2.4`} w={0.45} metal={metal} /><Pedra x={x} y={y - 0.6} r={1.05} pedra={pedra ?? 'perola'} metal={metal} /></g>;
    default: return null;
  }
}

/** O nome do metal e do acabamento (para a vitrine dizer o que o desenho mostra). */
export function leituraDoMetal(metal: string): string {
  const m = (METAIS20 as Record<string, { nome: string }>)[metal]?.nome ?? metal.replace(/_/g, ' ');
  return `${m}, ${NOME_DO_ACABAMENTO[acabamento(metal).tipo]}`;
}
