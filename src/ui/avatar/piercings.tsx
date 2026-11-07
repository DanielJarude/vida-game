/**
 * VIDA 12.9 — OS PIERCINGS NO DESENHO: cada joia no seu furo, na geometria do retrato (o nariz, o septo, a sobrancelha,
 * o lábio, o helix e o tragus da orelha) e da figura (o umbigo). Pequenos como são de verdade: um ponto de luz é um
 * ponto; a argola, um aro fino que abraça a borda; a barra curva, duas bolinhas. O metal tem a cor dele (e um brilho);
 * a pedra, a sua.
 *
 * VIDA 13 — mais furos (o 2º do lóbulo, a concha, o daith, o industrial, a outra narina, a ponte, o medusa, o outro
 * canto do lábio) e mais joias, cada uma com o seu desenho: o clicker (argola grossa com a fileira de pedras na
 * frente), a flor de pedras, a barra reta, o espeto, os pingentes (lua, estrela, coração), o titânio anodizado (o
 * arco-íris), o acabamento fosco e o martelado. E os brincos novos do lóbulo (pérola, argola grande, gota, cruz,
 * alargador). Tudo continua desenhado na geometria do retrato: a lupa da seção de piercings só aproxima.
 */
import type { ReactElement } from 'react';
import { COR_DO_METAL, piercingDoItem, type Piercing } from '../../motor/dados/piercings129';

export interface GeometriaDoRosto {
  cx: number; olhoY: number; esp: number; w: number; orelhaFora: number; orelhaRx: number;
  /** A boca: a meia-largura e a altura dos cantos. */
  boca: number; cantos: number;
  /** VIDA 13: há bigode por cima do lábio (o medusa fica escondido debaixo dele). */
  bigode?: boolean;
}

const ARCO_IRIS = '#d9b44a';
const cores = (p: Piercing): [string, string] => COR_DO_METAL[p.metal] ?? COR_DO_METAL.aco;

function Ponto({ x, y, r, p }: { x: number; y: number; r: number; p: Piercing }) {
  const [c, s] = cores(p);
  const fosco = p.acabamento === 'fosco';
  return (
    <g>
      {p.pedra ? <circle cx={x} cy={y} r={r * 1.15} fill={p.pedra} stroke={s} strokeWidth={0.25} /> : <circle cx={x} cy={y} r={r} fill={c} stroke={s} strokeWidth={0.25} />}
      {p.metal === 'titanio_arco' && !p.pedra && <path d={`M ${x - r * 0.8} ${y + r * 0.3} A ${r} ${r} 0 0 0 ${x + r * 0.8} ${y + r * 0.3}`} fill="none" stroke={ARCO_IRIS} strokeWidth={r * 0.45} />}
      {!fosco && <circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.35} fill="#ffffff" opacity={0.8} />}
    </g>
  );
}
const Aro = ({ x, y, r, p, abre = 'cima', grosso }: { x: number; y: number; r: number; p: Piercing; abre?: 'cima' | 'esq' | 'dir'; grosso?: boolean }) => {
  const [c, s] = cores(p);
  // O aro passa por dentro do furo: o pedaço de dentro some (fica uma abertura do lado do furo).
  const d = abre === 'cima' ? `M ${x - r * 0.75} ${y - r * 0.65} A ${r} ${r} 0 1 0 ${x + r * 0.75} ${y - r * 0.65}`
    : abre === 'esq' ? `M ${x - r * 0.65} ${y - r * 0.75} A ${r} ${r} 0 1 1 ${x - r * 0.65} ${y + r * 0.75}`
      : `M ${x + r * 0.65} ${y - r * 0.75} A ${r} ${r} 0 1 0 ${x + r * 0.65} ${y + r * 0.75}`;
  const k = grosso ? 1.6 : 1;
  // A frente do aro (do lado oposto à abertura): a fileira de pedras do clicker, a pedra da argola.
  const frente: [number, number][] = abre === 'cima' ? [-0.55, -0.2, 0.2, 0.55].map(a => [x + Math.sin(a) * r, y + Math.cos(a) * r])
    : abre === 'esq' ? [-0.55, -0.2, 0.2, 0.55].map(a => [x + Math.cos(a) * r, y + Math.sin(a) * r])
      : [-0.55, -0.2, 0.2, 0.55].map(a => [x - Math.cos(a) * r, y + Math.sin(a) * r]);
  return (
    <g>
      <path d={d} fill="none" stroke={s} strokeWidth={0.75 * k} strokeLinecap="round" />
      <path d={d} fill="none" stroke={c} strokeWidth={0.45 * k} strokeLinecap="round" />
      {p.metal === 'titanio_arco' && <path d={d} fill="none" stroke={ARCO_IRIS} strokeWidth={0.3 * k} strokeDasharray={`${(r * 0.7).toFixed(2)} ${(r * 0.9).toFixed(2)}`} strokeLinecap="round" />}
      {p.acabamento === 'martelado' && <path d={d} fill="none" stroke="#ffffff" strokeWidth={0.18} strokeDasharray="0.15 0.45" opacity={0.85} />}
      {p.forma === 'clicker' ? frente.map(([a, b], i) => <circle key={i} cx={a} cy={b} r={0.3} fill={p.pedra ?? '#f4fbff'} stroke={s} strokeWidth={0.1} />)
        : p.pedra && <circle cx={(frente[1][0] + frente[2][0]) / 2} cy={(frente[1][1] + frente[2][1]) / 2} r={0.55} fill={p.pedra} />}
    </g>
  );
};
/** A flor de pedras: cinco pétalas em volta de uma no meio. */
function Flor({ x, y, r, p }: { x: number; y: number; r: number; p: Piercing }) {
  const [c, s] = cores(p);
  const pedra = p.pedra ?? c;
  return (
    <g data-forma="cluster">
      {[0, 1, 2, 3, 4].map(k => { const a = (k / 5) * Math.PI * 2 - Math.PI / 2; return <circle key={k} cx={x + Math.cos(a) * r * 0.62} cy={y + Math.sin(a) * r * 0.62} r={r * 0.42} fill={pedra} stroke={s} strokeWidth={0.12} />; })}
      <circle cx={x} cy={y} r={r * 0.36} fill={c} stroke={s} strokeWidth={0.12} />
    </g>
  );
}
/** O espeto: um cone com a base de metal, a ponta apontando para `ang` (graus; 0 = para cima). */
function Espeto({ x, y, r, p, ang = 0 }: { x: number; y: number; r: number; p: Piercing; ang?: number }) {
  const [c, s] = cores(p);
  return (
    <g transform={`rotate(${ang.toFixed(1)} ${x} ${y})`} data-forma="spike">
      <path d={`M ${x - r} ${y} L ${x} ${y - r * 2.4} L ${x + r} ${y} Z`} fill={c} stroke={s} strokeWidth={0.18} strokeLinejoin="round" />
      {p.acabamento !== 'fosco' && <path d={`M ${x - r * 0.35} ${y - r * 0.3} L ${x - r * 0.05} ${y - r * 1.8}`} stroke="#ffffff" strokeWidth={0.15} opacity={0.7} />}
    </g>
  );
}
/** Os pingentes pequenos (e os pontos em forma de símbolo): a lua, a estrela, o coração. */
function Simbolo({ x, y, r, p }: { x: number; y: number; r: number; p: Piercing }) {
  const [c, s] = cores(p);
  const st = { fill: p.pedra ?? c, stroke: s, strokeWidth: 0.15, strokeLinejoin: 'round' as const };
  if (p.simbolo === 'lua') return <path data-forma="lua" d={`M ${x + r * 0.3} ${y - r} A ${r} ${r} 0 1 0 ${x + r * 0.3} ${y + r} A ${r * 0.75} ${r * 0.75} 0 1 1 ${x + r * 0.3} ${y - r} Z`} {...st} />;
  if (p.simbolo === 'estrela') {
    const pts = Array.from({ length: 10 }, (_, k) => { const a = (k / 10) * Math.PI * 2 - Math.PI / 2; const q = k % 2 ? r * 0.45 : r; return `${(x + Math.cos(a) * q).toFixed(2)} ${(y + Math.sin(a) * q).toFixed(2)}`; });
    return <path data-forma="estrela" d={`M ${pts.join(' L ')} Z`} {...st} />;
  }
  if (p.simbolo === 'coracao') return <path data-forma="coracao" d={`M ${x} ${y + r} C ${x - r * 1.4} ${y - r * 0.1} ${x - r * 0.7} ${y - r * 1.3} ${x} ${y - r * 0.45} C ${x + r * 0.7} ${y - r * 1.3} ${x + r * 1.4} ${y - r * 0.1} ${x} ${y + r} Z`} {...st} />;
  return <Ponto x={x} y={y} r={r} p={p} />;
}
/** A barra reta (industrial, ponte): o metal entre os dois furos e as pontas (bolinhas ou espetos). `so`: só as pontas. */
function BarraReta({ a, b, p, so }: { a: [number, number]; b: [number, number]; p: Piercing; so?: boolean }) {
  const [c, s] = cores(p);
  const ang = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
  const ponta = (q: [number, number], k: number) => p.simbolo === 'espetos'
    ? <Espeto key={k} x={q[0]} y={q[1]} r={0.36} p={p} ang={ang + (k ? 90 : -90)} />
    : <Ponto key={k} x={q[0]} y={q[1]} r={0.42} p={{ ...p, pedra: undefined }} />;
  const d = `M ${a[0].toFixed(2)} ${a[1].toFixed(2)} L ${b[0].toFixed(2)} ${b[1].toFixed(2)}`;
  return (
    <g data-forma="barra_reta">
      {!so && <><path d={d} stroke={s} strokeWidth={0.6} strokeLinecap="round" /><path d={d} stroke={c} strokeWidth={0.36} strokeLinecap="round" /></>}
      {p.metal === 'titanio_arco' && !so && <path d={d} stroke={ARCO_IRIS} strokeWidth={0.22} strokeDasharray="0.6 0.8" />}
      {ponta(a, 0)}{ponta(b, 1)}
    </g>
  );
}

/** Uma joia num furo (o ponto, a argola, a flor, o espeto, o símbolo), com a abertura da argola para o lado certo. */
function Joia({ x, y, r, p, abre = 'esq', ang = 0 }: { x: number; y: number; r: number; p: Piercing; abre?: 'cima' | 'esq' | 'dir'; ang?: number }) {
  switch (p.forma) {
    case 'argola': case 'clicker': return <Aro x={x + (abre === 'esq' ? 0.3 : abre === 'dir' ? -0.3 : 0)} y={y + (abre === 'cima' ? 0.6 : 0.4)} r={r * 2} p={p} abre={abre} grosso={p.forma === 'clicker'} />;
    case 'cluster': return <Flor x={x} y={y} r={r * 1.5} p={p} />;
    case 'spike': return <Espeto x={x} y={y} r={r * 0.85} p={p} ang={ang} />;
    case 'charme': return <Simbolo x={x} y={y} r={r * 1.3} p={p} />;
    default: return <Ponto x={x} y={y} r={r} p={p} />;
  }
}

/** No rosto: o que está em uso, em cada furo. `fase` adulto/adolescente/idoso (criança e bebê não têm). */
export function PiercingsDoRosto({ ids, g }: { ids?: string[]; g: GeometriaDoRosto }) {
  if (!ids?.length) return null;
  const out: ReactElement[] = [];
  const { cx, olhoY, esp, w, orelhaFora, orelhaRx } = g;
  // O lado esquerdo da pessoa fica à direita de quem olha: o nostril, a sobrancelha e a orelha furada, do lado de lá.
  const orelhaX = cx + (w / 2 - 0.6 + orelhaFora);
  const ey = olhoY + 3;
  for (const id of ids) {
    const p = piercingDoItem(id);
    if (!p) continue;
    const el = (() => {
      switch (p.regiao) {
        case 'nariz': case 'nariz2': {
          const lado = p.regiao === 'nariz' ? 1 : -1;
          const x = cx + lado * 2.1, y = olhoY + 7.6;
          if (p.forma === 'argola' || p.forma === 'clicker') return <Aro x={x + lado * 0.3} y={y + 0.6} r={1.1} p={p} abre={lado === 1 ? 'esq' : 'dir'} grosso={p.forma === 'clicker'} />;
          if (p.forma === 'cluster') return <Flor x={x} y={y} r={0.75} p={p} />;
          return <Ponto x={x} y={y} r={0.55} p={p} />;
        }
        case 'septo': {
          const [c, s] = cores(p);
          const y = olhoY + 9.1;
          const d = p.forma === 'ferradura' ? `M ${cx - 1.3} ${y - 0.2} Q ${cx} ${y + 2.1} ${cx + 1.3} ${y - 0.2}` : `M ${cx - 1.15} ${y - 0.4} A 1.3 1.3 0 1 0 ${cx + 1.15} ${y - 0.4}`;
          const k = p.forma === 'clicker' ? 1.5 : 1;
          return (
            <>
              <path d={d} fill="none" stroke={s} strokeWidth={0.8 * k} strokeLinecap="round" /><path d={d} fill="none" stroke={c} strokeWidth={0.48 * k} strokeLinecap="round" />
              {p.metal === 'titanio_arco' && <path d={d} fill="none" stroke={ARCO_IRIS} strokeWidth={0.3} strokeDasharray="0.9 1" />}
              {p.forma === 'clicker' && [-0.75, -0.25, 0.25, 0.75].map((dx, i) => <circle key={i} cx={cx + dx} cy={y + 0.85 + (Math.abs(dx) < 0.5 ? 0.12 : -0.05)} r={0.3} fill={p.pedra ?? '#f4fbff'} stroke={s} strokeWidth={0.1} />)}
              {p.forma === 'ferradura' && (p.simbolo === 'espetos'
                ? <><Espeto x={cx - 1.35} y={y - 0.2} r={0.38} p={p} ang={-120} /><Espeto x={cx + 1.35} y={y - 0.2} r={0.38} p={p} ang={120} /></>
                : <><circle cx={cx - 1.35} cy={y - 0.3} r={0.42} fill={c} /><circle cx={cx + 1.35} cy={y - 0.3} r={0.42} fill={c} /></>)}
            </>
          );
        }
        case 'ponte': return <BarraReta a={[cx - 1.5, olhoY + 0.6]} b={[cx + 1.5, olhoY + 0.6]} p={p} so />;
        case 'sobrancelha': {
          const x = cx + esp + 3.1, y = olhoY - 5.1;
          if (p.forma === 'argola' || p.forma === 'clicker') return <Aro x={x + 0.4} y={y} r={1.0} p={p} abre="esq" />;
          if (p.simbolo === 'espetos') return <><Espeto x={x} y={y - 1.0} r={0.4} p={p} ang={-20} /><Espeto x={x + 0.5} y={y + 1.0} r={0.4} p={p} ang={160} /></>;
          return <><Ponto x={x} y={y - 1.0} r={0.45} p={p} /><Ponto x={x + 0.5} y={y + 1.0} r={0.45} p={{ ...p, pedra: undefined }} /></>;
        }
        case 'labio': case 'labio2': {
          const lado = p.regiao === 'labio' ? 1 : -1;
          if (p.forma === 'argola' || p.forma === 'clicker') return <Aro x={cx + lado * g.boca * 0.55} y={g.cantos + 1.2} r={1.0} p={p} />;
          if (p.regiao === 'labio2') return <Ponto x={cx - g.boca * 0.7} y={g.cantos + 1.9} r={0.45} p={p} />;
          if (p.forma === 'spike') return <Espeto x={cx} y={g.cantos + 2.7} r={0.45} p={p} ang={180} />;
          return <Ponto x={cx} y={g.cantos + 2.6} r={0.5} p={p} />;
        }
        case 'medusa': return g.bigode ? null : <Ponto x={cx} y={g.cantos - 1.35} r={0.45} p={p} />;
        // A orelha (do lado de lá): o furo de cima (helix), o industrial atravessando o alto, o tragus na frente, o daith na
        // dobra de dentro, a concha no meio, o 2º furo do lóbulo acima do brinco.
        case 'helix': {
          const x = orelhaX + orelhaRx * 0.55, y = olhoY - 0.2;
          if (p.forma === 'trio') return <>{[0, 1, 2].map(k => <Ponto key={k} x={x - k * 0.25} y={y + k * 1.15} r={0.38} p={p} />)}</>;
          return <Joia x={x} y={y + 0.4} r={0.48} p={p} abre="esq" ang={30} />;
        }
        case 'industrial': return <BarraReta a={[orelhaX + 0.5, ey - 2.7]} b={[orelhaX + orelhaRx + 0.15, ey - 0.9]} p={p} />;
        case 'tragus': return <Joia x={cx + w / 2 + 0.1} y={olhoY + 2.9} r={0.42} p={p} abre="dir" ang={-60} />;
        case 'daith': {
          const x = orelhaX + 0.9, y = ey - 1.3;
          if (p.forma === 'charme') return <Simbolo x={x + 0.1} y={y + 1.1} r={1.0} p={{ ...p, pedra: undefined }} />;
          return <Aro x={x} y={y + 0.9} r={0.9} p={p} abre="cima" grosso={p.forma === 'clicker'} />;
        }
        case 'concha': {
          if (p.forma === 'argola') return <Aro x={orelhaX + orelhaRx * 0.75} y={ey + 0.7} r={1.6} p={p} abre="esq" />;
          return <Joia x={orelhaX + orelhaRx * 0.6} y={ey + 0.8} r={0.45} p={p} />;
        }
        case 'lobulo2': return <Joia x={orelhaX + 1.1} y={ey + 3.0} r={0.4} p={p} abre="cima" ang={20} />;
        default: return null;
      }
    })();
    if (el) out.push(<g key={id} data-piercing={p.regiao} data-forma={p.forma}>{el}</g>);
  }
  return <g className="retrato__piercings">{out}</g>;
}

/**
 * VIDA 13 — os brincos novos do lóbulo (a pérola, a argola grande, a gota, a cruz, o alargador). `null`: o modelo não
 * é um destes (o retrato desenha os de antes).
 */
export function BrincoNovo({ modelo, x, y, s }: { modelo?: string; x: number; y: number; s: number }): ReactElement | null {
  switch (modelo) {
    case 'brincos_perola': return <g className="retrato__joia" data-brinco="perola"><circle cx={x} cy={y + 0.4} r={1.2} fill="#f3eee4" stroke="#b9b1a2" strokeWidth={0.3} /><circle cx={x - 0.4} cy={y} r={0.4} fill="#ffffff" opacity={0.9} /></g>;
    case 'brincos_argola_grande': return <circle className="retrato__joia" data-brinco="argola_grande" cx={x + s * 0.3} cy={y + 2.6} r={2.9} fill="none" stroke="#d8b45a" strokeWidth={0.75} />;
    case 'brincos_gota': return <g className="retrato__joia" data-brinco="gota"><path d={`M ${x} ${y - 0.4} V ${y + 2}`} stroke="#d8b45a" strokeWidth={0.35} /><path d={`M ${x} ${y + 1.8} Q ${x + 1.3} ${y + 3.6} ${x} ${y + 4.6} Q ${x - 1.3} ${y + 3.6} ${x} ${y + 1.8} Z`} fill="#7fc4d8" stroke="#3d7e93" strokeWidth={0.3} /></g>;
    case 'brincos_cruz': return <g className="retrato__joia" data-brinco="cruz" stroke="#c9ccd1" strokeLinecap="round"><path d={`M ${x} ${y - 0.3} V ${y + 1.2}`} strokeWidth={0.3} /><path d={`M ${x} ${y + 1.2} V ${y + 4.4} M ${x - 0.9} ${y + 2.2} H ${x + 0.9}`} strokeWidth={0.6} /></g>;
    case 'brincos_alargador': return <g className="retrato__joia" data-brinco="alargador"><ellipse cx={x} cy={y + 0.3} rx={1.25} ry={1.5} fill="#1b1b1e" /><ellipse cx={x} cy={y + 0.3} rx={0.6} ry={0.8} fill="#000000" opacity={0.35} /></g>;
    default: return null;
  }
}

/** O umbigo (com o tronco à mostra): o umbigo desenhado e a joia nele. */
export function PiercingDoUmbigo({ ids, x, y }: { ids?: string[]; x: number; y: number }) {
  const id = ids?.find(i => piercingDoItem(i)?.regiao === 'umbigo');
  const p = id ? piercingDoItem(id) : undefined;
  if (!p) return null;
  const [c] = cores(p);
  return (
    <g data-piercing="umbigo" data-forma={p.forma}>
      <path d={`M ${x - 0.9} ${y - 1.4} Q ${x} ${y - 0.3} ${x + 0.9} ${y - 1.4}`} fill="none" stroke="#000000" strokeOpacity={0.28} strokeWidth={0.5} strokeLinecap="round" />
      <Ponto x={x} y={y - 1.6} r={0.5} p={{ ...p, pedra: undefined }} />
      <path d={`M ${x} ${y - 1.1} V ${y + 0.6}`} stroke={c} strokeWidth={0.4} />
      {p.forma === 'pingente'
        ? p.simbolo === 'cascata'
          ? <><path d={`M ${x} ${y + 0.6} V ${y + 3.6}`} stroke={c} strokeWidth={0.3} />{[1.2, 2.3, 3.5].map((dy, k) => <circle key={k} cx={x} cy={y + dy} r={0.55 - k * 0.08} fill={p.pedra ?? c} stroke="#8aa2b3" strokeWidth={0.1} />)}</>
          : p.simbolo === 'lua'
            ? <><path d={`M ${x} ${y + 0.6} V ${y + 1.6}`} stroke={c} strokeWidth={0.35} /><Simbolo x={x} y={y + 2.5} r={0.9} p={p} /></>
            : <><path d={`M ${x} ${y + 0.6} V ${y + 2.2}`} stroke={c} strokeWidth={0.35} /><circle cx={x} cy={y + 2.8} r={0.8} fill={p.pedra ?? c} /></>
        : <circle cx={x} cy={y + 1.1} r={0.75} fill={p.pedra ?? c} />}
    </g>
  );
}

/**
 * VIDA 13 — A ORELHA DE PERTO. No retrato a orelha é uma forma pequena (cinco por oito unidades, metade atrás do rosto):
 * sete furos não cabem nela de um jeito legível. A lupa da orelha desenha a orelha esquerda da pessoa em detalhe — a
 * borda (helix), a dobra de dentro (anti-hélice), a concha, o tragus, o lóbulo — com a pele dela, e cada joia em uso no
 * seu furo, com o mesmo desenho do retrato (só maior). O cabelo que cobre a orelha aparece por cima (dá para prender na
 * prévia); o lóbulo mostra o brinco em uso.
 */
export function OrelhaDePerto({ ids, brinco, pele, sombra, cabelo, largura = 220, rotulo }: { ids?: string[]; brinco?: string | false; pele: string; sombra: string; cabelo?: string; largura?: number; rotulo?: string }) {
  const contorno = '#00000033';
  const joias: ReactElement[] = [];
  const k = 2.0; // a escala da joia (o retrato desenha a orelha ~2,5 × menor; a joia cresce um pouco menos, para caberem todas)
  const em = (x: number, y: number, el: ReactElement, key: string) => joias.push(<g key={key} transform={`translate(${x} ${y}) scale(${k}) translate(${-x} ${-y})`}>{el}</g>);
  for (const id of ids ?? []) {
    const p = piercingDoItem(id);
    if (!p) continue;
    const marca = { 'data-piercing': p.regiao, 'data-forma': p.forma };
    switch (p.regiao) {
      case 'helix': em(21.6, 6.8, <g {...marca}>{p.forma === 'trio' ? [0, 1, 2].map(j => <Ponto key={j} x={21.6 + j * 0.5} y={6.8 + j * 1.1} r={0.38} p={p} />) : <Joia x={21.6} y={6.8} r={0.48} p={p} abre="esq" ang={30} />}</g>, id); break;
      case 'industrial': joias.push(<g key={id} {...marca} transform={`translate(18 9.5) scale(${k * 0.9}) translate(-18 -9.5)`}><BarraReta a={[15.2, 8.4]} b={[20.9, 10.6]} p={p} /></g>); break;
      case 'tragus': em(9.4, 20.6, <g {...marca}><Joia x={9.4} y={20.6} r={0.42} p={p} abre="dir" ang={-60} /></g>, id); break;
      case 'daith': em(11.8, 15.2, <g {...marca}>{p.forma === 'charme' ? <Simbolo x={11.8} y={16.2} r={1} p={{ ...p, pedra: undefined }} /> : <Aro x={11.8} y={16} r={0.9} p={p} abre="cima" grosso={p.forma === 'clicker'} />}</g>, id); break;
      case 'concha': em(15.5, 20.5, <g {...marca}>{p.forma === 'argola' ? <Aro x={17.2} y={20.3} r={1.5} p={p} abre="esq" /> : <Joia x={15.5} y={20.5} r={0.45} p={p} />}</g>, id); break;
      case 'lobulo2': em(17, 30.6, <g {...marca}><Joia x={17} y={30.6} r={0.4} p={p} abre="cima" ang={20} /></g>, id); break;
      default: break;
    }
  }
  const lobulo = brinco ? (BrincoNovo({ modelo: brinco, x: 13.4, y: 33.2, s: 1 }) ?? (
    brinco === 'brincos_diamante' ? <path data-brinco="diamante" d="M 13.4 31.3 L 14.8 33.2 L 13.4 35.1 L 12 33.2 Z" fill="#f4fbff" stroke="#5f8aa8" strokeWidth={0.45} />
      : <circle data-brinco={brinco === 'brincos_ouro' ? 'ouro' : 'simples'} cx={13.4} cy={34.2} r={brinco === 'brincos_ouro' ? 1.8 : 1.4} fill="none" stroke={brinco === 'brincos_ouro' ? '#d8b45a' : '#8d939b'} strokeWidth={0.8} />)) : null;
  return (
    <svg className="orelha-de-perto" viewBox="0 0 30 40" width={largura} height={Math.round((largura * 40) / 30)} role="img" aria-label={rotulo ?? 'A orelha de perto'}>
      <rect x={0} y={0} width={30} height={40} fill={misturarCor(sombra, '#ffffff', 0.35)} />
      {/* O rosto (a bochecha e a têmpora) à esquerda; a orelha sai dele. */}
      <path d="M 0 0 H 9.5 Q 7.6 20 9.5 40 H 0 Z" fill={pele} />
      <path d="M 9 5.5 C 14 0.8, 25.5 1.2, 26.4 11.5 C 27.2 19.5, 22.6 23.5, 21.6 28.5 C 20.6 35, 15.6 38.4, 12.4 36.6 C 9.6 35, 9.4 31, 8.8 28 C 8.2 20, 8.2 12, 9 5.5 Z" fill={sombra} stroke={contorno} strokeWidth={0.4} />
      {/* A borda (helix), a dobra de dentro (anti-hélice), a concha e o tragus. */}
      <path d="M 10.4 8.2 C 15 3.6, 23.6 4.6, 23.8 12 C 24 18.6, 19.6 22.4, 18.8 28" fill="none" stroke={misturarCor(sombra, '#000000', 0.22)} strokeWidth={0.9} strokeLinecap="round" />
      <path d="M 12.2 11.4 C 16.6 8.6, 21 12, 19.2 18.6 C 18.4 21.8, 16.6 23.4, 15.6 26" fill="none" stroke={misturarCor(sombra, '#000000', 0.16)} strokeWidth={0.8} strokeLinecap="round" />
      <ellipse cx={14.2} cy={20.4} rx={3.6} ry={4.4} fill={misturarCor(sombra, '#000000', 0.2)} />
      <path d="M 8.6 18 Q 11.2 18.4 11 21 Q 10.8 23.4 8.6 23.6 Z" fill={pele} stroke={contorno} strokeWidth={0.3} />
      {lobulo && <g transform="translate(13.4 33.2) scale(1.5) translate(-13.4 -33.2)">{lobulo}</g>}
      {joias}
      {cabelo && <path data-cabelo-cobre="sim" d="M 0 0 H 26 Q 24 6 21 14 Q 18 24 17.4 40 H 0 Z" fill={cabelo} opacity={0.94} />}
    </svg>
  );
}

function misturarCor(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16));
  return '#' + pa.map((x, i) => Math.round(x + (pb[i] - x) * t).toString(16).padStart(2, '0')).join('');
}
