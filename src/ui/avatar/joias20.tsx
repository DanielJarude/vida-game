/**
 * VIDA 20 — AS JOIAS NO DESENHO: o colar e os brincos no retrato (o busto) e a descrição de cada peça para a figura de
 * corpo inteiro (`Figura`: o anel na mão direita, a aliança no anelar da esquerda, a pulseira, a tornozeleira). A cor é a
 * do metal anunciado (ouro amarelo, branco, rosé, prata, aço...) e a pedra tem a cor dela — o que se compra é o que se vê.
 */
import type { ReactElement } from 'react';
import { joia20, METAIS20, PEDRAS20, type Joia20 } from '../../motor/dados20/joias20';

const cores = (j: Joia20) => ({ metal: METAIS20[j.metal].cor, brilho: METAIS20[j.metal].brilho, pedra: j.pedra ? PEDRAS20[j.pedra].cor : undefined });

/** O colar no retrato: a curva da corrente (de `x0` a `x1`, descendo até `yFundo`) e o que pende dela. */
export function ColarDoRetrato({ modelo, cx, y0, meia, fundo }: { modelo: string; cx: number; y0: number; meia: number; fundo: number }): ReactElement | null {
  const j = joia20(modelo);
  if (!j) return null;
  const { metal, brilho, pedra } = cores(j);
  const choker = j.forma === 'choker';
  const yf = choker ? y0 + (fundo - y0) * 0.45 : j.forma === 'grumet' ? fundo + 1.5 : fundo;
  const d = `M ${cx - meia} ${y0} Q ${cx} ${yf + (yf - y0)} ${cx + meia} ${y0}`;
  const base = (largura: number, extra: Record<string, string | number> = {}) => <path d={d} fill="none" stroke={metal} strokeWidth={largura} strokeLinecap="round" {...extra} />;
  const ponta = { x: cx, y: yf };
  let corpo: ReactElement;
  switch (j.forma) {
    case 'grumet': corpo = <>{base(1.7)}<path d={d} fill="none" stroke={brilho} strokeWidth={0.6} strokeDasharray="0.9 1.1" opacity={0.85} /></>; break;
    case 'cartier': corpo = <>{base(1.0, { strokeDasharray: '2.2 0.6 0.8 0.6' })}</>; break;
    case 'choker': corpo = <>{base(1.5)}<path d={d} fill="none" stroke={brilho} strokeWidth={0.4} opacity={0.6} /></>; break;
    case 'riviera': corpo = <>{base(0.5)}{Array.from({ length: 11 }, (_, k) => { const t = 0.12 + (k / 10) * 0.76; const x = (1 - t) * (1 - t) * (cx - meia) + 2 * (1 - t) * t * cx + t * t * (cx + meia); const y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * (yf + (yf - y0)) + t * t * y0; return <circle key={k} cx={x} cy={y} r={0.75} fill={pedra} stroke={metal} strokeWidth={0.25} />; })}</>; break;
    case 'ponto_de_luz': corpo = <>{base(0.5)}<circle cx={ponta.x} cy={ponta.y + 1} r={1.15} fill={pedra} stroke={metal} strokeWidth={0.4} /><circle cx={ponta.x - 0.35} cy={ponta.y + 0.65} r={0.3} fill="#ffffff" /></>; break;
    case 'medalha': corpo = <>{base(0.6)}<circle cx={ponta.x} cy={ponta.y + 2.2} r={2.1} fill={metal} stroke={brilho} strokeWidth={0.35} /><circle cx={ponta.x} cy={ponta.y + 2.2} r={1.2} fill="none" stroke={brilho} strokeWidth={0.3} /></>; break;
    case 'coracao': corpo = <>{base(0.55)}<path d={`M ${ponta.x} ${ponta.y + 3.6} L ${ponta.x - 1.9} ${ponta.y + 1.6} Q ${ponta.x - 2.1} ${ponta.y + 0.2} ${ponta.x - 0.9} ${ponta.y + 0.3} Q ${ponta.x} ${ponta.y + 0.5} ${ponta.x} ${ponta.y + 1.2} Q ${ponta.x} ${ponta.y + 0.5} ${ponta.x + 0.9} ${ponta.y + 0.3} Q ${ponta.x + 2.1} ${ponta.y + 0.2} ${ponta.x + 1.9} ${ponta.y + 1.6} Z`} fill="none" stroke={metal} strokeWidth={0.6} strokeLinejoin="round" /></>; break;
    case 'letra': corpo = <>{base(0.5)}<path d={`M ${ponta.x - 1.2} ${ponta.y + 3.4} L ${ponta.x} ${ponta.y + 0.6} L ${ponta.x + 1.2} ${ponta.y + 3.4} M ${ponta.x - 0.6} ${ponta.y + 2.2} H ${ponta.x + 0.6}`} fill="none" stroke={metal} strokeWidth={0.6} strokeLinecap="round" /></>; break;
    case 'gota': corpo = <>{base(0.5)}<path d={`M ${ponta.x} ${ponta.y + 0.6} Q ${ponta.x + 1.8} ${ponta.y + 3.2} ${ponta.x} ${ponta.y + 4.4} Q ${ponta.x - 1.8} ${ponta.y + 3.2} ${ponta.x} ${ponta.y + 0.6} Z`} fill={pedra} stroke={metal} strokeWidth={0.4} /></>; break;
    default: corpo = base(0.6);
  }
  return <g className="retrato__joia" data-joia={j.forma} data-metal={j.metal} data-pedra={j.pedra}>{corpo}</g>;
}

/** Um brinco no retrato (no lóbulo em `x, y`; `s`: o lado). */
export function BrincoDoRetrato({ modelo, x, y, s }: { modelo?: string; x: number; y: number; s: number }): ReactElement | null {
  const j = modelo ? joia20(modelo) : undefined;
  if (!j || j.lugar !== 'orelha') return null;
  const { metal, brilho, pedra } = cores(j);
  const marca = { className: 'retrato__joia', 'data-brinco': j.forma, 'data-metal': j.metal };
  switch (j.forma) {
    case 'brinco_ponto': return <g {...marca}><circle cx={x} cy={y + 0.4} r={1.1} fill={pedra} stroke={metal} strokeWidth={0.4} /><circle cx={x - 0.3} cy={y + 0.1} r={0.28} fill="#ffffff" /></g>;
    case 'argola_p': return <circle {...marca} cx={x + s * 0.2} cy={y + 1.3} r={1.4} fill="none" stroke={metal} strokeWidth={0.7} />;
    case 'argola_m': return <circle {...marca} cx={x + s * 0.4} cy={y + 2.1} r={2.2} fill="none" stroke={metal} strokeWidth={0.75} />;
    case 'argola_g': return <g {...marca}><circle cx={x + s * 0.6} cy={y + 3.4} r={3.5} fill="none" stroke={metal} strokeWidth={0.8} /><path d={`M ${x + s * 0.6 - 2.4} ${y + 1.2} A 3.5 3.5 0 0 1 ${x + s * 0.6} ${y - 0.1}`} fill="none" stroke={brilho} strokeWidth={0.35} /></g>;
    case 'brinco_gota': return <g {...marca}><path d={`M ${x} ${y - 0.2} V ${y + 1.4}`} stroke={metal} strokeWidth={0.5} /><path d={`M ${x} ${y + 1.2} Q ${x + 1.5} ${y + 3.4} ${x} ${y + 4.4} Q ${x - 1.5} ${y + 3.4} ${x} ${y + 1.2} Z`} fill={pedra} stroke={metal} strokeWidth={0.35} /></g>;
    case 'brinco_perola': return <g {...marca}><circle cx={x} cy={y + 0.5} r={1.3} fill={pedra} stroke="#b9b1a2" strokeWidth={0.3} /><circle cx={x - 0.4} cy={y + 0.1} r={0.35} fill="#ffffff" /></g>;
    case 'ear_cuff': return <path {...marca} d={`M ${x + s * 0.2} ${y - 6.4} q ${s * 1.6} 1.2 0 2.6`} fill="none" stroke={metal} strokeWidth={0.7} strokeLinecap="round" />;
    default: return <circle {...marca} cx={x} cy={y + 0.8} r={1.2} fill="none" stroke={metal} strokeWidth={0.7} />;
  }
}

/** A peça na figura de corpo inteiro (a mesma forma do catálogo de `pecas.ts`, com a forma e a pedra). */
export type PecaJoia20 =
  | { parte: 'pescoco'; cor: string; grossa?: boolean; pingente?: string; forma: string; pedra?: string; brilho: string }
  | { parte: 'pulseira'; cor: string; grossa?: boolean; forma: string; pedra?: string; brilho: string }
  | { parte: 'anel'; cor: string; pedra?: string; forma: string; brilho: string }
  | { parte: 'alianca'; cor: string; pedra?: string; brilho: string }
  | { parte: 'tornozelo'; cor: string; forma: string; brilho: string };

export function pecaDaJoia20(itemId: string): PecaJoia20 | undefined {
  const j = joia20(itemId);
  if (!j) return undefined;
  const { metal: cor, brilho, pedra } = cores(j);
  switch (j.lugar) {
    case 'joia': return { parte: 'pescoco', cor, brilho, forma: j.forma, pedra, grossa: j.forma === 'grumet' || j.forma === 'choker', ...(pedra || ['medalha', 'coracao', 'letra'].includes(j.forma) ? { pingente: pedra ?? cor } : {}) };
    case 'pulseira': return { parte: 'pulseira', cor, brilho, forma: j.forma, pedra, grossa: j.forma === 'elos' || j.forma === 'rigida' };
    case 'anel': return { parte: 'anel', cor, brilho, forma: j.forma, pedra };
    case 'alianca': return { parte: 'alianca', cor, brilho, pedra };
    case 'tornozelo': return { parte: 'tornozelo', cor, brilho, forma: j.forma };
    default: return undefined;
  }
}
