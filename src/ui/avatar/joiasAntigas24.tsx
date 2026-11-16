/**
 * VIDA 24 — AS JOIAS E OS RELÓGIOS DE ANTES COM CONSTRUÇÃO PRÓPRIA. A auditoria do catálogo achou peças diferentes com o
 * mesmo desenho: nove relógios analógicos eram um círculo numa tira (só a cor mudava), a corrente grossa era a
 * gargantilha de couro, as guias eram o colar de pérolas, o anel de ouro com pedra era o solitário de diamante, a
 * pulseira de prata era a "fina" do catálogo novo. Aqui cada uma ganha a sua construção: a caixa (redonda, quadrada,
 * tonel; o tamanho), a pulseira do relógio (couro com pesponto, elos de metal, borracha, malha), a luneta, os
 * submostradores, os botões do cronógrafo; os elos da corrente, a altura da gargantilha, as voltas das guias, as pérolas,
 * a riviera; o couro trançado, os elos finos e a grumet; o aro largo polido ou escovado, o cabochão e o solitário em garras.
 * O mesmo desenho no corpo (a figura) e no busto (o retrato e a vitrine).
 */
import type { ReactElement } from 'react';
import type { Peca } from './pecas';
import { misturar } from './cores';

type P<K extends Peca['parte']> = Extract<Peca, { parte: K }>;
const n2 = (x: number) => Math.round(x * 100) / 100;
const claro = (c: string, t = 0.45) => misturar(c, '#ffffff', t);
const escuro = (c: string, t = 0.35) => misturar(c, '#000000', t);
/** A claridade de uma cor (0 a 1), para os ponteiros contrastarem com o mostrador. */
const luz = (c: string) => { const h = c.replace('#', ''); const [r, g, b] = [0, 2, 4].map(k => parseInt(h.slice(k, k + 2), 16) / 255); return 0.299 * r + 0.587 * g + 0.114 * b; };

/* ------------------------------------------------------------------ o pescoço */

/** A corrente/colar de antes, da ponta `cx ± meia` em `y0` até o fundo `yf` (no meio). `k` é a escala (1 no corpo). */
export function ColarAntigo24({ p, cx, y0, meia, yf, k = 1, detalhe = true }: { p: P<'pescoco'>; cx: number; y0: number; meia: number; yf: number; k?: number; detalhe?: boolean }): ReactElement | null {
  const tipo = p.tipo ?? (p.cruz ? undefined : p.contas ? 'guias' : p.grossa ? 'grossa' : 'fina');
  const fundo = tipo === 'gargantilha' ? y0 + (yf - y0) * 0.38 : tipo === 'guias' ? yf + 2.2 * k : tipo === 'perolas' ? yf - 0.8 * k : yf;
  const cy = 2 * fundo - y0;
  const d = (dy = 0) => `M ${n2(cx - meia)} ${n2(y0)} Q ${n2(cx)} ${n2(cy + dy * 2)} ${n2(cx + meia)} ${n2(y0)}`;
  const em = (t: number, dy = 0): [number, number] => [(1 - t) * (1 - t) * (cx - meia) + 2 * (1 - t) * t * cx + t * t * (cx + meia), (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * (cy + dy * 2) + t * t * y0];
  const marca = { className: 'retrato__joia figura__colar', 'data-acessorio': 'pescoco', 'data-forma': tipo ?? 'cruz' };
  const c = p.cor;
  switch (tipo) {
    case 'fina': return <g {...marca}><path d={d()} fill="none" stroke={escuro(c, 0.2)} strokeWidth={0.6 * k} strokeLinecap="round" />{detalhe && <path d={d()} fill="none" stroke={claro(c)} strokeWidth={0.35 * k} strokeDasharray={`${0.45 * k} ${0.45 * k}`} />}</g>;
    case 'grossa': return <g {...marca}><path d={d()} fill="none" stroke={escuro(c, 0.25)} strokeWidth={2.1 * k} strokeLinecap="round" /><path d={d()} fill="none" stroke={c} strokeWidth={1.6 * k} strokeLinecap="round" /><path d={d()} fill="none" stroke={claro(c, 0.55)} strokeWidth={1.1 * k} strokeDasharray={`${0.55 * k} ${0.6 * k}`} /></g>;
    case 'gargantilha': return <g {...marca}><path d={d()} fill="none" stroke={c} strokeWidth={1.9 * k} strokeLinecap="round" /><path d={d()} fill="none" stroke={claro(c, 0.25)} strokeWidth={0.25 * k} strokeDasharray={`${0.6 * k} ${0.5 * k}`} /><circle cx={cx} cy={fundo + 1.2 * k} r={0.75 * k} fill="none" stroke="#c9ccd1" strokeWidth={0.4 * k} /></g>;
    case 'guias': {
      const cores = p.contas ?? [c];
      return <g {...marca}>{[0, 2.6 * k].map((dy, v) => <g key={v}><path d={d(dy)} fill="none" stroke={escuro(c, 0.5)} strokeWidth={0.2 * k} />{Array.from({ length: 15 }, (_, j) => { const [x, y] = em(0.08 + j * 0.06, dy); return <circle key={j} cx={n2(x)} cy={n2(y)} r={0.55 * k} fill={cores[(j + v) % cores.length]} stroke={escuro(cores[(j + v) % cores.length], 0.3)} strokeWidth={0.1 * k} />; })}</g>)}</g>;
    }
    case 'perolas': return <g {...marca}><path d={d()} fill="none" stroke="#d8d1c2" strokeWidth={0.2 * k} />{Array.from({ length: 11 }, (_, j) => { const [x, y] = em(0.12 + j * 0.076); return <g key={j}><circle cx={n2(x)} cy={n2(y)} r={0.85 * k} fill="#f4efe4" stroke="#b9b1a2" strokeWidth={0.18 * k} />{detalhe && <circle cx={n2(x - 0.3 * k)} cy={n2(y - 0.3 * k)} r={0.25 * k} fill="#ffffff" />}</g>; })}</g>;
    case 'diamantes': return <g {...marca}><path d={d()} fill="none" stroke={c} strokeWidth={0.5 * k} />{Array.from({ length: 13 }, (_, j) => { const [x, y] = em(0.14 + j * 0.06); return <circle key={j} cx={n2(x)} cy={n2(y)} r={0.62 * k} fill={p.pingente ?? '#dff3ff'} stroke={c} strokeWidth={0.18 * k} />; })}<path d={`M ${n2(cx)} ${n2(fundo + 0.6 * k)} l ${1.2 * k} ${1.6 * k} l ${-1.2 * k} ${1.6 * k} l ${-1.2 * k} ${-1.6 * k} Z`} fill={p.pingente ?? '#dff3ff'} stroke={c} strokeWidth={0.25 * k} /></g>;
    case 'medalha': return <g {...marca}><path d={d()} fill="none" stroke={c} strokeWidth={0.6 * k} strokeLinecap="round" /><circle cx={cx} cy={fundo + 2 * k} r={1.8 * k} fill={c} stroke={escuro(c)} strokeWidth={0.3 * k} /><circle cx={cx} cy={fundo + 2 * k} r={1.05 * k} fill="none" stroke={claro(c)} strokeWidth={0.3 * k} /></g>;
    default:
      // A cruz: corrente de elo cadeado e a cruz.
      return <g {...marca}><path d={d()} fill="none" stroke={c} strokeWidth={1.1 * k} strokeLinecap="round" strokeDasharray={p.grossa ? `${0.9 * k} ${0.3 * k}` : undefined} /><path d={`M ${cx} ${fundo - 0.4 * k} v ${5.4 * k} M ${cx - 1.7 * k} ${fundo + 1.2 * k} h ${3.4 * k}`} stroke={p.pingente ?? c} strokeWidth={1.1 * k} strokeLinecap="round" /></g>;
  }
}

/* ------------------------------------------------------------------ o pulso */

/** O relógio no pulso (`x, y`), com a largura do antebraço (`hw`). */
export function RelogioNoCorpo24({ r, x, y, hw, detalhe }: { r: P<'pulso'>; x: number; y: number; hw: number; detalhe: boolean }): ReactElement {
  const correia = r.correia ?? (r.forma === 'smart' ? 'borracha' : 'couro');
  const altura = correia === 'borracha' ? 3.6 : correia === 'metal' ? 3.3 : correia === 'malha' ? 2.6 : 3.0;
  const L = hw + 0.6;
  const faixa = <rect x={x - L} y={y - altura / 2} width={L * 2} height={altura} rx={correia === 'borracha' ? 1.4 : 0.7} fill={r.pulseira} stroke={escuro(r.pulseira, 0.3)} strokeWidth={0.2} />;
  const textura = !detalhe ? null : correia === 'metal'
    ? Array.from({ length: Math.max(3, Math.round(L * 2 / 1.1)) }, (_, k) => <path key={k} d={`M ${n2(x - L + (k + 0.5) * 1.1)} ${n2(y - altura / 2)} v ${altura}`} stroke={escuro(r.pulseira, 0.25)} strokeWidth={0.18} />)
    : correia === 'couro' ? <path d={`M ${n2(x - L + 0.3)} ${n2(y - altura / 2 + 0.45)} H ${n2(x + L - 0.3)} M ${n2(x - L + 0.3)} ${n2(y + altura / 2 - 0.45)} H ${n2(x + L - 0.3)}`} stroke={claro(r.pulseira, 0.5)} strokeWidth={0.14} strokeDasharray="0.35 0.3" />
      : correia === 'borracha' ? <path d={`M ${n2(x - L + 0.3)} ${n2(y - 0.6)} H ${n2(x + L - 0.3)} M ${n2(x - L + 0.3)} ${n2(y + 0.6)} H ${n2(x + L - 0.3)}`} stroke={claro(r.pulseira, 0.18)} strokeWidth={0.3} />
        : <path d={`M ${n2(x - L)} ${n2(y - altura / 2)} h ${n2(L * 2)} v ${altura} h ${n2(-L * 2)} Z`} fill="none" stroke={claro(r.pulseira, 0.4)} strokeWidth={0.12} strokeDasharray="0.15 0.25" />;
  let caixa: ReactElement;
  if (r.forma !== 'analogico') {
    const w = r.forma === 'digital' && r.botoes ? 6 : 4.8, h = r.forma === 'digital' && r.botoes ? 4.4 : 5.2;
    caixa = <>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={r.forma === 'smart' ? 1.4 : 0.6} fill={r.caixa} stroke={escuro(r.caixa)} strokeWidth={0.2} />
      <rect x={x - w / 2 + 0.7} y={y - h / 2 + 0.7} width={w - 1.4} height={h - 1.4} rx={r.forma === 'smart' ? 0.9 : 0.3} fill={r.mostrador} />
      {detalhe && r.forma === 'digital' && <path d={`M ${n2(x - 1.2)} ${n2(y - 0.6)} v 1.2 M ${n2(x - 0.4)} ${n2(y - 0.6)} v 1.2 M ${n2(x + 0.5)} ${n2(y - 0.6)} v 1.2 M ${n2(x + 1.3)} ${n2(y - 0.6)} v 1.2`} stroke={escuro(r.mostrador, 0.6)} strokeWidth={0.3} />}
      {r.botoes && [-1, 1].map(s => <rect key={s} x={x + s * (w / 2) - (s > 0 ? 0 : 0.5)} y={y - 0.9} width={0.5} height={0.6} fill={escuro(r.caixa, 0.2)} />)}
    </>;
  } else {
    const R = r.raio ?? 2.6, forma = r.caixaForma ?? 'redonda';
    const corpo = forma === 'quadrada' ? <rect x={x - R} y={y - R} width={R * 2} height={R * 2} rx={0.5} fill={r.caixa} stroke={escuro(r.caixa)} strokeWidth={0.22} />
      : forma === 'tonel' ? <rect x={x - R * 0.85} y={y - R * 1.1} width={R * 1.7} height={R * 2.2} rx={R * 0.75} fill={r.caixa} stroke={escuro(r.caixa)} strokeWidth={0.22} />
        : <circle cx={x} cy={y} r={R} fill={r.caixa} stroke={escuro(r.caixa)} strokeWidth={0.22} />;
    const m = r.luneta ? R * 0.62 : R * 0.74;
    const mostrador = forma === 'quadrada' ? <rect x={x - m} y={y - m} width={m * 2} height={m * 2} rx={0.3} fill={r.mostrador} /> : forma === 'tonel' ? <rect x={x - m * 0.8} y={y - m} width={m * 1.6} height={m * 2} rx={m * 0.6} fill={r.mostrador} /> : <circle cx={x} cy={y} r={m} fill={r.mostrador} />;
    const tinta = luz(r.mostrador) > 0.55 ? '#1b1b1d' : '#f4f1ea';
    caixa = <>
      {corpo}
      {r.luneta && <><circle cx={x} cy={y} r={R * 0.88} fill={r.luneta} />{detalhe && Array.from({ length: 12 }, (_, k) => { const a = (k / 12) * Math.PI * 2; return <path key={k} d={`M ${n2(x + Math.sin(a) * R * 0.7)} ${n2(y - Math.cos(a) * R * 0.7)} L ${n2(x + Math.sin(a) * R * 0.86)} ${n2(y - Math.cos(a) * R * 0.86)}`} stroke="#f4f1ea" strokeWidth={k === 0 ? 0.35 : 0.15} />; })}</>}
      {mostrador}
      {detalhe && r.indices && [0, 1, 2, 3].map(k => { const a = (k / 4) * Math.PI * 2; return <circle key={k} cx={n2(x + Math.sin(a) * m * 0.78)} cy={n2(y - Math.cos(a) * m * 0.78)} r={0.16} fill={tinta} />; })}
      {detalhe && (r.sub ?? 0) >= 2 && Array.from({ length: r.sub! }, (_, k) => { const a = (k / r.sub!) * Math.PI * 2 + Math.PI / 2; return <circle key={k} cx={n2(x + Math.cos(a) * m * 0.45)} cy={n2(y + Math.sin(a) * m * 0.45)} r={m * 0.24} fill="none" stroke={tinta} strokeWidth={0.12} />; })}
      {detalhe && r.sub === 1 && <><circle cx={x} cy={y + m * 0.42} r={m * 0.36} fill={escuro(r.mostrador, 0.4)} stroke="#d8b45a" strokeWidth={0.15} /><path d={`M ${n2(x - m * 0.3)} ${n2(y + m * 0.42)} h ${n2(m * 0.6)} M ${n2(x)} ${n2(y + m * 0.12)} v ${n2(m * 0.6)}`} stroke="#d8b45a" strokeWidth={0.1} /></>}
      {detalhe && <path d={`M ${x} ${y} l 0 ${n2(-m * 0.68)} M ${x} ${y} l ${n2(m * 0.5)} ${n2(m * 0.2)}`} stroke={tinta} strokeWidth={0.28} strokeLinecap="round" />}
      {r.botoes && [-0.55, 0.55].map(a => <rect key={a} x={n2(x + Math.cos(a) * R - 0.1)} y={n2(y + Math.sin(a) * R - 0.25)} width={0.6} height={0.5} rx={0.1} fill={escuro(r.caixa, 0.15)} />)}
      <rect x={x + (forma === 'tonel' ? R * 0.85 : R) - 0.05} y={y - 0.3} width={0.45} height={0.6} fill={escuro(r.caixa, 0.2)} />
    </>;
  }
  return <g className="figura__relogio" data-acessorio="pulso" data-forma={r.forma} data-caixa={r.caixaForma ?? (r.forma === 'analogico' ? 'redonda' : r.forma)} data-correia={correia}>{faixa}{textura}{caixa}</g>;
}

/** A pulseira de antes com construção: o couro trançado com fecho, os elos finos, a grumet. */
export function PulseiraAntiga24({ p, x, y, hw }: { p: P<'pulseira'>; x: number; y: number; hw: number }): ReactElement | null {
  const L = hw + 0.4;
  const d = `M ${n2(x - L)} ${n2(y)} Q ${n2(x)} ${n2(y + 1.6)} ${n2(x + L)} ${n2(y)}`;
  const em = (t: number): [number, number] => [(1 - t) * (1 - t) * (x - L) + 2 * (1 - t) * t * x + t * t * (x + L), (1 - t) * (1 - t) * y + 2 * (1 - t) * t * (y + 1.6) + t * t * y];
  const marca = { className: 'figura__pulseira', 'data-acessorio': 'pulseira', 'data-forma': p.tipo };
  if (p.tipo === 'couro_trancado') return <g {...marca}><path d={d} fill="none" stroke={p.cor} strokeWidth={1.7} strokeLinecap="round" /><path d={d} fill="none" stroke={claro(p.cor, 0.35)} strokeWidth={1.2} strokeDasharray="0.5 0.45" /><rect x={x - 0.7} y={y + 0.2} width={1.4} height={1.1} rx={0.2} fill="#c9ccd1" stroke="#7d848c" strokeWidth={0.12} /></g>;
  if (p.tipo === 'elos_finos') return <g {...marca}>{Array.from({ length: 9 }, (_, k) => { const [ex, ey] = em(0.06 + k * 0.11); return <ellipse key={k} cx={n2(ex)} cy={n2(ey)} rx={0.5} ry={0.3} fill="none" stroke={p.cor} strokeWidth={0.22} transform={`rotate(${k % 2 ? 60 : 0} ${n2(ex)} ${n2(ey)})`} />; })}</g>;
  if (p.tipo === 'grumet') return <g {...marca}><path d={d} fill="none" stroke={escuro(p.cor, 0.25)} strokeWidth={2.3} strokeLinecap="round" /><path d={d} fill="none" stroke={p.cor} strokeWidth={1.9} strokeLinecap="round" /><path d={d} fill="none" stroke={claro(p.cor, 0.55)} strokeWidth={1.4} strokeDasharray="0.3 0.55" /></g>;
  return null;
}

/** O anel de antes com construção: o aro largo polido ou escovado, o cabochão no engaste, o solitário em garras. */
export function AnelAntigo24({ p, x, y }: { p: P<'anel'>; x: number; y: number }): ReactElement | null {
  const marca = { className: 'figura__anel', 'data-acessorio': 'anel', 'data-forma': p.tipo };
  switch (p.tipo) {
    case 'largo_polido': return <g {...marca}><circle cx={x} cy={y} r={1.25} fill="none" stroke={p.cor} strokeWidth={1.5} /><path d={`M ${x - 0.9} ${y - 0.95} A 1.25 1.25 0 0 1 ${x + 0.5} ${y - 1.3}`} fill="none" stroke="#ffffff" strokeWidth={0.4} opacity={0.85} /></g>;
    case 'largo_escovado': return <g {...marca}><circle cx={x} cy={y} r={1.25} fill="none" stroke={p.cor} strokeWidth={1.6} /><circle cx={x} cy={y} r={1.0} fill="none" stroke={escuro(p.cor, 0.3)} strokeWidth={0.12} /><circle cx={x} cy={y} r={1.5} fill="none" stroke={escuro(p.cor, 0.3)} strokeWidth={0.12} /></g>;
    case 'cabochao': return <g {...marca}><circle cx={x} cy={y} r={1.2} fill="none" stroke={p.cor} strokeWidth={0.8} /><rect x={x - 1.1} y={y - 2.6} width={2.2} height={1.8} rx={0.4} fill={p.cor} stroke={escuro(p.cor)} strokeWidth={0.15} /><ellipse cx={x} cy={y - 1.7} rx={0.75} ry={0.6} fill={p.pedra ?? '#b8323c'} /><circle cx={x - 0.25} cy={y - 1.9} r={0.2} fill="#ffffff" opacity={0.7} /></g>;
    case 'solitario': return <g {...marca}><circle cx={x} cy={y} r={1.2} fill="none" stroke={p.cor} strokeWidth={0.55} />{[-0.7, -0.25, 0.25, 0.7].map(dx => <path key={dx} d={`M ${x + dx * 0.6} ${y - 1.1} L ${x + dx} ${y - 2.1}`} stroke={p.cor} strokeWidth={0.22} />)}<path d={`M ${x} ${y - 1.3} l 1.05 -1.05 l -1.05 -1.05 l -1.05 1.05 Z`} fill={p.pedra ?? '#dff3ff'} stroke={escuro(p.cor, 0.2)} strokeWidth={0.15} /><circle cx={x - 0.3} cy={y - 2.6} r={0.18} fill="#ffffff" /></g>;
    default: return null;
  }
}
