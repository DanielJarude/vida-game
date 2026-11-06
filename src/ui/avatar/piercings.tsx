/**
 * VIDA 12.9 — OS PIERCINGS NO DESENHO: cada joia no seu furo, na geometria do retrato (o nariz, o septo, a sobrancelha,
 * o lábio, o helix e o tragus da orelha) e da figura (o umbigo). Pequenos como são de verdade: um ponto de luz é um
 * ponto; a argola, um aro fino que abraça a borda; a barra curva, duas bolinhas. O metal tem a cor dele (e um brilho);
 * a pedra, a sua.
 */
import type { ReactElement } from 'react';
import { COR_DO_METAL, piercingDoItem, type Piercing } from '../../motor/dados/piercings129';

export interface GeometriaDoRosto {
  cx: number; olhoY: number; esp: number; w: number; orelhaFora: number; orelhaRx: number;
  /** A boca: a meia-largura e a altura dos cantos. */
  boca: number; cantos: number;
}

function Ponto({ x, y, r, p }: { x: number; y: number; r: number; p: Piercing }) {
  const [c, s] = COR_DO_METAL[p.metal];
  return (
    <g>
      {p.pedra ? <circle cx={x} cy={y} r={r * 1.15} fill={p.pedra} stroke={s} strokeWidth={0.25} /> : <circle cx={x} cy={y} r={r} fill={c} stroke={s} strokeWidth={0.25} />}
      <circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.35} fill="#ffffff" opacity={0.8} />
    </g>
  );
}
const Aro = ({ x, y, r, p, abre = 'cima' }: { x: number; y: number; r: number; p: Piercing; abre?: 'cima' | 'esq' | 'dir' }) => {
  const [c, s] = COR_DO_METAL[p.metal];
  // O aro passa por dentro do furo: o pedaço de dentro some (fica uma abertura do lado do furo).
  const d = abre === 'cima' ? `M ${x - r * 0.75} ${y - r * 0.65} A ${r} ${r} 0 1 0 ${x + r * 0.75} ${y - r * 0.65}`
    : abre === 'esq' ? `M ${x - r * 0.65} ${y - r * 0.75} A ${r} ${r} 0 1 1 ${x - r * 0.65} ${y + r * 0.75}`
      : `M ${x + r * 0.65} ${y - r * 0.75} A ${r} ${r} 0 1 0 ${x + r * 0.65} ${y + r * 0.75}`;
  return <g><path d={d} fill="none" stroke={s} strokeWidth={0.75} strokeLinecap="round" /><path d={d} fill="none" stroke={c} strokeWidth={0.45} strokeLinecap="round" />{p.pedra && <circle cx={x} cy={y + r} r={0.55} fill={p.pedra} />}</g>;
};

/** No rosto: o que está em uso, em cada furo. `fase` adulto/adolescente/idoso (criança e bebê não têm). */
export function PiercingsDoRosto({ ids, g }: { ids?: string[]; g: GeometriaDoRosto }) {
  if (!ids?.length) return null;
  const out: ReactElement[] = [];
  for (const id of ids) {
    const p = piercingDoItem(id);
    if (!p) continue;
    const { cx, olhoY, esp, w, orelhaFora, orelhaRx } = g;
    // O lado esquerdo da pessoa fica à direita de quem olha: o nostril e a sobrancelha, do lado de lá.
    const orelhaX = cx + (w / 2 - 0.6 + orelhaFora);
    switch (p.regiao) {
      case 'nariz': {
        const x = cx + 2.1, y = olhoY + 7.6;
        out.push(<g key={id} data-piercing="nariz">{p.forma === 'argola' ? <Aro x={x + 0.3} y={y + 0.6} r={1.1} p={p} abre="esq" /> : <Ponto x={x} y={y} r={0.55} p={p} />}</g>);
        break;
      }
      case 'septo': {
        const [c, s] = COR_DO_METAL[p.metal];
        const y = olhoY + 9.1;
        const d = p.forma === 'ferradura' ? `M ${cx - 1.3} ${y - 0.2} Q ${cx} ${y + 2.1} ${cx + 1.3} ${y - 0.2}` : `M ${cx - 1.15} ${y - 0.4} A 1.3 1.3 0 1 0 ${cx + 1.15} ${y - 0.4}`;
        out.push(<g key={id} data-piercing="septo"><path d={d} fill="none" stroke={s} strokeWidth={0.8} strokeLinecap="round" /><path d={d} fill="none" stroke={c} strokeWidth={0.48} strokeLinecap="round" />{p.forma === 'ferradura' && <><circle cx={cx - 1.35} cy={y - 0.3} r={0.42} fill={c} /><circle cx={cx + 1.35} cy={y - 0.3} r={0.42} fill={c} /></>}</g>);
        break;
      }
      case 'sobrancelha': {
        const x = cx + esp + 3.1, y = olhoY - 5.1;
        out.push(<g key={id} data-piercing="sobrancelha">{p.forma === 'argola' ? <Aro x={x + 0.4} y={y} r={1.0} p={p} abre="esq" /> : <><Ponto x={x} y={y - 1.0} r={0.45} p={p} /><Ponto x={x + 0.5} y={y + 1.0} r={0.45} p={p} /></>}</g>);
        break;
      }
      case 'labio': {
        if (p.forma === 'argola') out.push(<g key={id} data-piercing="labio"><Aro x={cx + g.boca * 0.55} y={g.cantos + 1.2} r={1.0} p={p} /></g>);
        else out.push(<g key={id} data-piercing="labio"><Ponto x={cx} y={g.cantos + 2.6} r={0.5} p={p} /></g>);
        break;
      }
      case 'helix': {
        const x = orelhaX + orelhaRx * 0.55, y = olhoY - 0.2;
        if (p.forma === 'trio') out.push(<g key={id} data-piercing="helix">{[0, 1, 2].map(k => <Ponto key={k} x={x - k * 0.25} y={y + k * 1.15} r={0.38} p={p} />)}</g>);
        else if (p.forma === 'argola') out.push(<g key={id} data-piercing="helix"><Aro x={x + 0.5} y={y + 0.2} r={1.0} p={p} abre="esq" /></g>);
        else out.push(<g key={id} data-piercing="helix"><Ponto x={x} y={y + 0.4} r={0.48} p={p} /></g>);
        break;
      }
      case 'tragus': {
        out.push(<g key={id} data-piercing="tragus"><Ponto x={cx + w / 2 + 0.1} y={olhoY + 2.9} r={0.42} p={p} /></g>);
        break;
      }
      default: break;
    }
  }
  return <g className="retrato__piercings">{out}</g>;
}

/** O umbigo (com o tronco à mostra): o umbigo desenhado e a joia nele. */
export function PiercingDoUmbigo({ ids, x, y }: { ids?: string[]; x: number; y: number }) {
  const id = ids?.find(i => piercingDoItem(i)?.regiao === 'umbigo');
  const p = id ? piercingDoItem(id) : undefined;
  if (!p) return null;
  const [c] = COR_DO_METAL[p.metal];
  return (
    <g data-piercing="umbigo">
      <path d={`M ${x - 0.9} ${y - 1.4} Q ${x} ${y - 0.3} ${x + 0.9} ${y - 1.4}`} fill="none" stroke="#000000" strokeOpacity={0.28} strokeWidth={0.5} strokeLinecap="round" />
      <Ponto x={x} y={y - 1.6} r={0.5} p={{ ...p, pedra: undefined }} />
      <path d={`M ${x} ${y - 1.1} V ${y + 0.6}`} stroke={c} strokeWidth={0.4} />
      {p.forma === 'pingente' ? <><path d={`M ${x} ${y + 0.6} V ${y + 2.2}`} stroke={c} strokeWidth={0.35} /><circle cx={x} cy={y + 2.8} r={0.8} fill={p.pedra ?? c} /></> : <circle cx={x} cy={y + 1.1} r={0.75} fill={p.pedra ?? c} />}
    </g>
  );
}
