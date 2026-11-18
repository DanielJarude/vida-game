/**
 * VIDA 20 — AS JOIAS NO DESENHO: o colar e os brincos no retrato (o busto) e a descrição de cada peça para a figura de
 * corpo inteiro (`Figura`: o anel na mão direita, a aliança no anelar da esquerda, a pulseira, a tornozeleira). A cor é a
 * do metal anunciado (ouro amarelo, branco, rosé, prata, aço...) e a pedra tem a cor dela — o que se compra é o que se vê.
 */
import { ColarAntigo24 } from './joiasAntigas24';
import { acessorioDoItem } from './pecas';
import type { ReactElement } from 'react';
import { joia20, METAIS20, PEDRAS20, type Joia20 } from '../../motor/dados20/joias20';
import { Brinco23, Colar23, Pedra, TracoDeMetal } from './joias23';

const cores = (j: Joia20) => ({ metal: METAIS20[j.metal].cor, brilho: METAIS20[j.metal].brilho, pedra: j.pedra ? PEDRAS20[j.pedra].cor : undefined });

/** O colar no retrato: a curva da corrente (de `x0` a `x1`, descendo até `yFundo`) e o que pende dela. */
export function ColarDoRetrato({ modelo, cx, y0, meia, fundo }: { modelo: string; cx: number; y0: number; meia: number; fundo: number }): ReactElement | null {
  const j = joia20(modelo);
  if (!j) {
    // VIDA 24: as correntes de antes (a mesma construção do corpo, no busto da vitrine e do retrato).
    const antiga = acessorioDoItem(modelo);
    return antiga && antiga.parte === 'pescoco' && !('metal' in antiga) ? <ColarAntigo24 p={antiga} cx={cx} y0={y0} meia={meia} yf={fundo} k={0.8} /> : null;
  }
  // VIDA 23: as formas novas (a cubana, as pérolas, as camadas, o colar longo, o cordão) — e o acabamento do metal.
  const novo = Colar23({ forma: j.forma, metal: j.metal, pedra: j.pedra, cx, y0, meia, fundo });
  if (novo) return novo;
  const { metal, brilho, pedra } = cores(j);
  const choker = j.forma === 'choker';
  const yf = choker ? y0 + (fundo - y0) * 0.45 : j.forma === 'grumet' ? fundo + 1.5 : fundo;
  const d = `M ${cx - meia} ${y0} Q ${cx} ${yf + (yf - y0)} ${cx + meia} ${y0}`;
  // VIDA 23: a corrente com a borda e o brilho do acabamento (o ouro polido, a prata espelhada, o aço escovado).
  const base = (largura: number, extra: Record<string, string | number> = {}) => extra.strokeDasharray ? <path d={d} fill="none" stroke={metal} strokeWidth={largura} strokeLinecap="round" {...extra} /> : <TracoDeMetal d={d} w={largura} metal={j.metal} comp={meia * 2} />;
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
  // VIDA 23: as formas novas e o acabamento do metal (as argolas de antes também: a borda e o brilho do metal).
  const novo = Brinco23({ forma: j.forma, metal: j.metal, pedra: j.pedra, x, y, s });
  if (novo) return novo;
  const { metal, pedra } = cores(j);
  const marca = { className: 'retrato__joia', 'data-brinco': j.forma, 'data-metal': j.metal };
  const aro = (cx: number, cy: number, r: number, w: number) => <TracoDeMetal d={`M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r}`} w={w} metal={j.metal} comp={r * 3} />;
  switch (j.forma) {
    case 'brinco_ponto': return <g {...marca}><Pedra x={x} y={y + 0.4} r={1.05} pedra={j.pedra} metal={j.metal} /></g>;
    case 'argola_p': return <g {...marca}>{aro(x + s * 0.2, y + 1.3, 1.4, 0.6)}</g>;
    case 'argola_m': return <g {...marca}>{aro(x + s * 0.4, y + 2.1, 2.2, 0.65)}</g>;
    case 'argola_g': return <g {...marca}>{aro(x + s * 0.6, y + 3.4, 3.5, 0.7)}</g>;
    case 'brinco_gota': return <g {...marca}><TracoDeMetal d={`M ${x} ${y - 0.2} V ${y + 1.4}`} w={0.4} metal={j.metal} /><path d={`M ${x} ${y + 1.2} Q ${x + 1.5} ${y + 3.4} ${x} ${y + 4.4} Q ${x - 1.5} ${y + 3.4} ${x} ${y + 1.2} Z`} fill={pedra} stroke={metal} strokeWidth={0.35} /><path d={`M ${x - 0.35} ${y + 2.4} q 0.1 -0.6 0.45 -0.9`} stroke="#ffffff" strokeWidth={0.25} fill="none" opacity={0.8} /></g>;
    // VIDA 27 · §8: o pino e a tarraxa no metal (antes, a pérola de ouro e a de prata eram o mesmo desenho).
    case 'brinco_perola': return <g {...marca}><TracoDeMetal d={`M ${x} ${y - 0.9} V ${y - 0.2}`} w={0.55} metal={j.metal} comp={2} /><Pedra x={x} y={y + 0.5} r={1.3} pedra="perola" metal={j.metal} /></g>;
    case 'ear_cuff': return <g {...marca}><TracoDeMetal d={`M ${x + s * 0.2} ${y - 6.4} q ${s * 1.6} 1.2 0 2.6`} w={0.6} metal={j.metal} comp={3} /></g>;
    default: return <g {...marca}>{aro(x, y + 0.8, 1.2, 0.6)}</g>;
  }
}

/** A peça na figura de corpo inteiro (a mesma forma do catálogo de `pecas.ts`, com a forma e a pedra). */
export type PecaJoia20 =
  | { parte: 'pescoco'; cor: string; grossa?: boolean; pingente?: string; forma: string; pedra?: string; brilho: string; metal?: string; pedraId?: string }
  | { parte: 'pulseira'; cor: string; grossa?: boolean; forma: string; pedra?: string; brilho: string; metal?: string }
  | { parte: 'anel'; cor: string; pedra?: string; forma: string; brilho: string; metal?: string; pedraId?: string }
  | { parte: 'alianca'; cor: string; pedra?: string; brilho: string }
  | { parte: 'tornozelo'; cor: string; forma: string; brilho: string };

export function pecaDaJoia20(itemId: string): PecaJoia20 | undefined {
  const j = joia20(itemId);
  if (!j) return undefined;
  const { metal: cor, brilho, pedra } = cores(j);
  switch (j.lugar) {
    case 'joia': return { parte: 'pescoco', cor, brilho, forma: j.forma, pedra, metal: j.metal, pedraId: j.pedra, grossa: j.forma === 'grumet' || j.forma === 'choker', ...(pedra || ['medalha', 'coracao', 'letra'].includes(j.forma) ? { pingente: pedra ?? cor } : {}) };
    case 'pulseira': return { parte: 'pulseira', cor, brilho, forma: j.forma, pedra, metal: j.metal, grossa: j.forma === 'elos' || j.forma === 'rigida' };
    case 'anel': return { parte: 'anel', cor, brilho, forma: j.forma, pedra, metal: j.metal, pedraId: j.pedra };
    case 'alianca': return { parte: 'alianca', cor, brilho, pedra };
    case 'tornozelo': return { parte: 'tornozelo', cor, brilho, forma: j.forma };
    default: return undefined;
  }
}
