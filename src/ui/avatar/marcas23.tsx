/**
 * VIDA 23 — AS MARCAS NATURAIS NO DESENHO: a pinta (plana ou em relevo), as pintas espalhadas, as sardas, a marca de
 * nascença (café com leite, vinho, rosada, azulada), a mancha de pigmento (mais clara ou mais escura), a cicatriz (reta,
 * curva, de cirurgia com os pontos, de queimadura, de acne), as estrias e as covinhas.
 *
 * Cada marca tem o seu desenho de verdade — o padrão das sardas e das pintas e o contorno das manchas saem da semente
 * da marca (`k`), então duas pessoas nunca têm a mesma mancha no mesmo lugar. As cores saem da PELE (misturadas com o
 * tom da marca): a pinta na pele clara e na escura, as duas legíveis; a cicatriz clareia a pele escura? não — na pele
 * escura ela costuma escurecer, e é assim que se desenha (`corDaCicatriz`).
 *
 * Este módulo é leve (o retrato de todo mundo o usa no rosto); o do corpo é `corpo23.tsx`, na figura.
 */
import type { ReactElement } from 'react';
import { acaso23, REGIOES_DO_ROSTO23, type MarcaNatural } from '../../motor/v23/corpo/corpo23';
import { misturar } from './cores';
import { caixaNoRosto, type GeoDoRosto } from './rosto17';

/** O quanto a cor é clara (0 a 1, luminância simples). */
export function claridade(hex: string): number {
  const [r, g, b] = [1, 3, 5].map(k => parseInt(hex.slice(k, k + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const n2 = (x: number) => x.toFixed(2);

/** O tom de cada marca na pele (`pele` = a cor da pele). */
export function corDaMarca(m: MarcaNatural, pele: string): string {
  const i = m.i ?? 2, escura = claridade(pele) < 0.38;
  switch (m.t) {
    case 'pinta': case 'pintas': return misturar(pele, escura ? '#0d0604' : '#2e180d', 0.55 + i * 0.1);
    case 'sardas': return misturar(pele, escura ? '#1a0c06' : '#7a3a1a', 0.34 + i * 0.12);
    case 'marca_nascenca': return misturar(pele, m.f === 'vinho' ? '#7a1830' : m.f === 'rosada' ? '#d2606e' : m.f === 'azulada' ? '#3f5272' : escura ? '#2a160c' : '#9a6a44', escura ? 0.32 : 0.4);
    case 'mancha': return m.f === 'escura' ? misturar(pele, '#1e0f08', 0.14 + i * 0.07) : misturar(pele, '#f8f0e8', escura ? 0.32 + i * 0.12 : 0.2 + i * 0.1);
    case 'estrias': return m.f === 'rosadas' ? misturar(pele, '#d47f88', 0.4) : m.f === 'escuras' ? misturar(pele, '#2a150c', 0.25) : misturar(pele, '#f6efe9', escura ? 0.3 : 0.38);
    default: return corDaCicatriz(pele, i);
  }
}
/** A cicatriz: na pele clara, mais clara e rosada; na escura, mais escura (a hiperpigmentação), com a borda à vista. */
export function corDaCicatriz(pele: string, i = 2): string {
  return claridade(pele) < 0.38 ? misturar(pele, '#1a0c06', 0.2 + i * 0.07) : misturar(pele, '#f3d4cc', 0.3 + i * 0.1);
}

/** Um contorno irregular (a mancha, a marca de nascença, a queimadura), da semente. */
function bolha(r: () => number, R: number, alonga = 1): string {
  const n = 9, pts: [number, number][] = [];
  for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2; const q = R * (0.68 + r() * 0.5); pts.push([Math.cos(a) * q * alonga, Math.sin(a) * q]); }
  const mid = (a: [number, number], b: [number, number]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let d = `M ${n2(mid(pts[n - 1], pts[0])[0])} ${n2(mid(pts[n - 1], pts[0])[1])}`;
  for (let k = 0; k < n; k++) { const p = pts[k], q = mid(p, pts[(k + 1) % n]); d += ` Q ${n2(p[0])} ${n2(p[1])} ${n2(q[0])} ${n2(q[1])}`; }
  return d + ' Z';
}

/**
 * O desenho de UMA marca, centrado em (x, y), com `u` = a unidade do lugar (1 = a escala da figura de corpo inteiro;
 * no rosto, menor). `w`, `h`: o tamanho da região (onde as pintas e as sardas se espalham).
 */
export function DesenhoDaMarca({ m, x, y, u, w, h, pele, detalhe }: { m: MarcaNatural; x: number; y: number; u: number; w: number; h: number; pele: string; detalhe: boolean }): ReactElement | null {
  const r = acaso23(`m${m.k ?? 0}${m.t}${m.r}`);
  const cor = corDaMarca(m, pele);
  const rot = `rotate(${m.a ?? 0} ${n2(x)} ${n2(y)})`;
  const marca = { 'data-marca': m.t, 'data-regiao': m.r, 'data-forma': m.f } as Record<string, string | undefined>;
  switch (m.t) {
    case 'pinta': {
      const raio = (0.42 + m.s * 0.24) * u;
      return <g {...marca}><circle cx={n2(x)} cy={n2(y)} r={n2(raio)} fill={cor} />{m.f === 'relevo' && <circle cx={n2(x - raio * 0.32)} cy={n2(y - raio * 0.32)} r={n2(raio * 0.32)} fill="#ffffff" opacity={0.35} />}</g>;
    }
    case 'pintas': case 'sardas': {
      const sard = m.t === 'sardas';
      const total = Math.max(1, Math.round((m.n ?? (sard ? 12 : 3)) * (detalhe || !sard ? 1 : 0.55)));
      // Espalhadas pela região, mais juntas perto do centro (como são as de verdade), cada uma de um tamanho.
      return (
        <g {...marca} fill={cor} opacity={sard ? 0.82 : 1}>
          {Array.from({ length: total }, (_, k) => {
            const a = r() * Math.PI * 2, d = Math.sqrt(r());
            const px = x + Math.cos(a) * d * w * 0.42, py = y + Math.sin(a) * d * h * 0.42;
            const raio = (sard ? 0.2 + r() * 0.18 : 0.3 + r() * 0.3) * u;
            return <circle key={k} cx={n2(px)} cy={n2(py)} r={n2(raio)} />;
          })}
        </g>
      );
    }
    case 'marca_nascenca': case 'mancha': {
      const R = (m.t === 'mancha' ? [1.7, 3, 4.6] : [1.2, 2.2, 3.4])[m.s - 1] * u;
      return <path {...marca} d={bolha(r, R, 1.25)} transform={`translate(${n2(x)} ${n2(y)}) rotate(${m.a ?? 0})`} fill={cor} opacity={m.t === 'mancha' ? 0.85 : 0.8} />;
    }
    case 'cicatriz': {
      const L = [2.4, 4.4, 7][m.s - 1] * u, wl = (0.4 + (m.i ?? 2) * 0.14) * u;
      const borda = claridade(pele) < 0.38 ? misturar(pele, '#000000', 0.32) : misturar(pele, '#7a3f34', 0.35);
      if (m.f === 'queimadura') return <g {...marca} transform={`translate(${n2(x)} ${n2(y)}) rotate(${m.a ?? 0})`}><path d={bolha(r, L * 0.38, 1.4)} fill={cor} stroke={borda} strokeWidth={n2(0.22 * u)} opacity={0.9} />{detalhe && <path d={bolha(r, L * 0.2, 1.2)} fill="none" stroke={borda} strokeWidth={n2(0.15 * u)} opacity={0.5} />}</g>;
      if (m.f === 'acne') return <g {...marca} fill={cor} stroke={borda} strokeWidth={n2(0.08 * u)}>{Array.from({ length: 5 + m.s * 3 }, (_, k) => { const a = r() * Math.PI * 2, d = Math.sqrt(r()); return <circle key={k} cx={n2(x + Math.cos(a) * d * L * 0.4)} cy={n2(y + Math.sin(a) * d * L * 0.3)} r={n2((0.2 + r() * 0.18) * u)} />; })}</g>;
      const curva = m.f === 'curva';
      const d = curva ? `M ${n2(x - L / 2)} ${n2(y)} Q ${n2(x)} ${n2(y - L * 0.35)} ${n2(x + L / 2)} ${n2(y)}` : `M ${n2(x - L / 2)} ${n2(y)} L ${n2(x + L / 2)} ${n2(y)}`;
      return (
        <g {...marca} transform={rot}>
          <path d={d} fill="none" stroke={borda} strokeWidth={n2(wl + 0.25 * u)} strokeLinecap="round" opacity={0.55} />
          <path d={d} fill="none" stroke={cor} strokeWidth={n2(wl)} strokeLinecap="round" />
          {m.f === 'cirurgica' && Array.from({ length: Math.max(3, Math.round(L / (1.1 * u))) }, (_, k) => { const q = Math.max(3, Math.round(L / (1.1 * u))); const px = x - L / 2 + (L * (k + 0.5)) / q; return <path key={k} d={`M ${n2(px)} ${n2(y - 0.75 * u)} V ${n2(y + 0.75 * u)}`} stroke={borda} strokeWidth={n2(0.18 * u)} opacity={0.75} />; })}
        </g>
      );
    }
    case 'estrias': {
      const L = [2.6, 4, 5.6][m.s - 1] * u, q = 3 + (m.k ?? 0) % 3;
      return (
        <g {...marca} transform={rot} fill="none" stroke={cor} strokeWidth={n2((0.26 + (m.i ?? 2) * 0.06) * u)} strokeLinecap="round" opacity={0.92}>
          {Array.from({ length: q }, (_, k) => { const dy = (k - (q - 1) / 2) * 0.75 * u, l = L * (0.7 + r() * 0.3), dx = (r() - 0.5) * u; return <path key={k} d={`M ${n2(x - l / 2 + dx)} ${n2(y + dy)} q ${n2(l * 0.25)} ${n2(-0.3 * u)} ${n2(l * 0.5)} 0 t ${n2(l * 0.5)} 0`} />; })}
        </g>
      );
    }
    default: return null;
  }
}

/**
 * As marcas do ROSTO, dentro do retrato (recortadas pelo próprio rosto: nunca flutuam fora dele). As covinhas são
 * sombras curtas perto do canto da boca (ou o furinho do queixo).
 */
export function MarcasDoRosto({ lista, g, pele, rosto, uid, idade }: { lista: MarcaNatural[]; g: GeoDoRosto; pele: string; rosto: string; uid: string; idade: number }): ReactElement | null {
  const doRosto = lista.filter(m => REGIOES_DO_ROSTO23.has(m.r) && (m.d ?? 0) <= idade);
  if (!doRosto.length) return null;
  const clip = `${uid}-marcas23`;
  const u = 0.95;
  return (
    <g className="retrato__marcas">
      <defs><clipPath id={clip}><path d={rosto} /></clipPath></defs>
      <g clipPath={`url(#${clip})`}>
        {doRosto.map((m, k) => {
          if (m.t === 'covinhas') {
            const cor = misturar(pele, '#2a1208', claridade(pele) < 0.38 ? 0.5 : 0.42);
            if (m.r === 'queixo') return <path key={k} data-marca="covinhas" data-regiao="queixo" d={`M ${n2(g.cx)} ${n2(g.queixo - 3.4)} q 0.35 1.1 0 2.1`} fill="none" stroke={cor} strokeWidth={0.62} strokeLinecap="round" />;
            const lados: (1 | -1)[] = m.l ? [m.l === 'e' ? 1 : -1] : [-1, 1];
            return <g key={k} data-marca="covinhas" data-regiao="bochecha">{lados.map(s => <path key={s} d={`M ${n2(g.cx + s * g.w * 0.25)} ${n2(g.olhoY + 11.2)} q ${n2(s * 0.7)} 0.9 ${n2(s * 0.1)} 1.9`} fill="none" stroke={cor} strokeWidth={0.62} strokeLinecap="round" />)}</g>;
          }
          const s: 1 | -1 = m.l === 'd' ? -1 : 1;
          const c = caixaNoRosto(g, m.r, s);
          return <DesenhoDaMarca key={k} m={m} x={c.x + m.x * c.w * 0.4} y={c.y + m.y * c.h * 0.4} u={u} w={c.w} h={c.h} pele={pele} detalhe />;
        })}
      </g>
    </g>
  );
}
