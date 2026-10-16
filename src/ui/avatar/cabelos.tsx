/**
 * OS CABELOS do retrato — REWORK 6 (reconstrução).
 *
 * Antes, cada corte era um conjunto de peças encaixadas na cabeça (uma calota, painéis retos, círculos soltos,
 * tiras): o cacheado tinha a base quadrada, a trança parecia uma tira rígida, o curto tinha uma coroa em zigue-zague
 * e a calvície era um remendo de pele por cima do cabelo. Agora todo corte é montado do mesmo jeito:
 *
 *   1. a SILHUETA: um contorno só, que sai do crânio (`cabeca`), contorna o volume e volta pela linha do cabelo —
 *      o cabelo da frente é uma peça contínua (topo, franja, mechas que caem ao lado do rosto), não uma tampa;
 *   2. a TEXTURA da borda vem da textura herdada (`Visual.textura`), não do nome do corte: liso = curva lisa,
 *      ondulado = onda larga, cacheado = cachos (arcos), crespo = cachos miúdos e densos. O mesmo rabo de cavalo é liso
 *      numa pessoa e cacheado noutra;
 *   3. a LINHA DO CABELO é uma só (`linhaDaTesta`): herdada (reta, em bico, alta), recua com a calvície (as entradas
 *      são o próprio desenho da testa, não pele pintada por cima) e sobe um pouco na velhice;
 *   4. a IDADE muda o volume e a densidade (o bebê tem penugem com a textura da família; a criança usa a versão
 *      curta dos cortes longos; o idoso perde volume e a linha recua), não só a cor.
 *
 * Camadas: `CabeloAtras` (atrás do corpo e do rosto: o comprimento, o volume de trás, a franja da calvície) e
 * `CabeloFrente` (depois do rosto: topo, franja, mechas da frente). Tudo determinístico (sem sorteio na tela).
 */
import type { ReactElement } from 'react';
import { misturar } from './cores';
export { estagioDaCalvicie } from '../../motor/sistemas/identidade';

export type Fase = 'bebe' | 'crianca' | 'pre' | 'adol' | 'adulto' | 'meia' | 'idoso';
export type Textura = 'liso' | 'ondulado' | 'cacheado' | 'crespo';
export interface CabeloProps {
  estilo: string; cor: string; cx: number; cy: number; w: number; hh: number; fase: Fase; linha?: string;
  /** A textura herdada; ausente (saves antigos), a do próprio corte. */
  textura?: string;
  /** Calvície herdada: 1 = entradas (a linha recua), 2 = calvo (só a franja de lado e de trás). */
  estagio?: number;
  /** Pele (o brilho do couro cabeludo do calvo). */
  pele?: string;
}

/* ------------------------------------------------------------------ Geometria */

interface Pt { x: number; y: number; t?: number }
const r1 = (n: number) => Math.round(n * 10) / 10;

/** Catmull-Rom → Bézier: uma curva lisa que passa por todos os pontos. */
function curva(pts: Pt[], fechado = true): string {
  const n = pts.length;
  const g = (i: number) => (fechado ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${r1(pts[0].x)} ${r1(pts[0].y)}`;
  for (let i = 0; i < (fechado ? n : n - 1); i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    d += `C${r1(p1.x + (p2.x - p0.x) / 6)} ${r1(p1.y + (p2.y - p0.y) / 6)} ${r1(p2.x - (p3.x - p1.x) / 6)} ${r1(p2.y - (p3.y - p1.y) / 6)} ${r1(p2.x)} ${r1(p2.y)}`;
  }
  return fechado ? d + 'Z' : d;
}

/** A curva amostrada densamente (passo ~0,5), com o peso da textura interpolado. */
function denso(pts: Pt[], fechado: boolean): Pt[] {
  const n = pts.length;
  const g = (i: number) => (fechado ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  const out: Pt[] = [];
  for (let i = 0; i < (fechado ? n : n - 1); i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 }, c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    const k = Math.max(2, Math.ceil(Math.hypot(p2.x - p1.x, p2.y - p1.y) / 0.5));
    for (let j = 0; j < k; j++) {
      const s = j / k, u = 1 - s;
      out.push({
        x: u * u * u * p1.x + 3 * u * u * s * c1.x + 3 * u * s * s * c2.x + s * s * s * p2.x,
        y: u * u * u * p1.y + 3 * u * u * s * c1.y + 3 * u * s * s * c2.y + s * s * s * p2.y,
        t: (p1.t ?? 1) * u + (p2.t ?? 1) * s
      });
    }
  }
  if (!fechado) out.push(pts[n - 1]);
  return out;
}

const ruido = (i: number, s: number) => { const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return x - Math.floor(x); };

/**
 * O contorno com a textura na borda. `t` de cada ponto (0–1) diz quanto daquele trecho é textura: a borda de fora
 * é toda textura; a linha da testa e o lado do rosto, quase nada.
 */
function contorno(pts: Pt[], tex: Textura, o: { esc?: number; sem?: number; fechado?: boolean } = {}): string {
  const fechado = o.fechado ?? true;
  if (tex === 'liso') return curva(pts, fechado);
  const ds = denso(pts, fechado);
  let area = 0;
  for (let i = 0; i < ds.length; i++) { const a = ds[i], b = ds[(i + 1) % ds.length]; area += a.x * b.y - b.x * a.y; }
  const horario = area > 0;
  const esc = o.esc ?? 1, sem = o.sem ?? 0;
  if (tex === 'ondulado') {
    // A onda: o ponto anda para fora e para dentro da borda (amplitude ~1, comprimento ~7).
    let acc = 0;
    const pts2: string[] = [];
    for (let i = 0; i < ds.length; i += 2) {
      const a = ds[Math.max(0, i - 2)], b = ds[Math.min(ds.length - 1, i + 2)], p = ds[i];
      const tx = b.x - a.x, ty = b.y - a.y, l = Math.hypot(tx, ty) || 1;
      const nx = (horario ? ty : -ty) / l, ny = (horario ? -tx : tx) / l;
      const off = Math.sin((acc / (12 * esc)) * Math.PI * 2 + sem) * 0.85 * esc * (p.t ?? 1);
      if (i > 0) acc += Math.hypot(p.x - ds[i - 2].x, p.y - ds[i - 2].y);
      pts2.push(`${r1(p.x + nx * off)} ${r1(p.y + ny * off)}`);
    }
    return `M${pts2.join('L')}${fechado ? 'Z' : ''}`;
  }
  // Cachos: arcos para fora, de tamanho levemente irregular; o trecho sem textura segue a curva.
  const passo = (tex === 'crespo' ? 2.3 : 3.5) * esc;
  const cum: number[] = [0];
  for (let i = 1; i < ds.length; i++) cum.push(cum[i - 1] + Math.hypot(ds[i].x - ds[i - 1].x, ds[i].y - ds[i - 1].y));
  const total = cum[cum.length - 1] + (fechado ? Math.hypot(ds[0].x - ds[ds.length - 1].x, ds[0].y - ds[ds.length - 1].y) : 0);
  let d = `M${r1(ds[0].x)} ${r1(ds[0].y)}`;
  let i = 0, k = 0;
  while (i < ds.length - 1) {
    const t = ds[i].t ?? 1;
    if (t >= 0.5) {
      const alvo = cum[i] + passo * (0.8 + ruido(k, sem) * 0.45);
      let j = i + 1;
      while (j < ds.length - 1 && cum[j] < alvo) j++;
      if (fechado && total - cum[j] < passo * 0.6) j = ds.length - 1;
      const p = ds[j];
      const corda = Math.hypot(p.x - ds[i].x, p.y - ds[i].y);
      const raio = corda * (0.54 + ruido(k + 7, sem) * 0.2) * (t < 0.8 ? 1.5 : 1);
      d += `A${r1(raio)} ${r1(raio)} 0 0 ${horario ? 1 : 0} ${r1(p.x)} ${r1(p.y)}`;
      i = j; k++;
    } else {
      i++;
      d += `L${r1(ds[i].x)} ${r1(ds[i].y)}`;
    }
  }
  return fechado ? d + 'Z' : d;
}

/** O crânio: um ponto na borda da cabeça (0° = lado direito na altura dos olhos, 90° = o alto), afastado `fora`. */
function cabeca(cx: number, cy: number, w: number, hh: number) {
  const rx = w / 2, ry = hh * 0.4725, n = 2.15;
  return (graus: number, fora = 0, t = 1): Pt => {
    const a = (graus * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
    return { x: cx + (rx + fora) * Math.sign(c) * Math.abs(c) ** (2 / n), y: cy - (ry + fora) * Math.sign(s) * Math.abs(s) ** (2 / n), t };
  };
}
/** Um arco do crânio, de `a0` a `a1` graus, com o volume variando pelo ângulo. */
function arco(H: ReturnType<typeof cabeca>, a0: number, a1: number, n: number, fora: (g: number) => number, t = 1): Pt[] {
  return Array.from({ length: n }, (_, k) => { const g = a0 + ((a1 - a0) * k) / (n - 1); return H(g, fora(g), t); });
}
/** Volume que cresce do lado para o alto (o cabelo tem mais corpo em cima). */
const perfil = (lados: number, topo: number, p = 1.4) => (g: number) => lados + (topo - lados) * Math.max(0, Math.sin((g * Math.PI) / 180)) ** p;

/**
 * A linha do cabelo (da têmpora esquerda à direita): herdada (reta, em bico, alta), com as entradas da calvície
 * (os cantos recuam, o meio fica) e a testa que sobe um pouco na velhice. `t`: textura da linha (o crespo e o
 * cacheado mostram um pouco de cacho na testa).
 */
function linhaDaTesta(cx: number, cy: number, w: number, hh: number, o: { linha?: string; entradas?: boolean; idoso?: boolean; t?: number; costeleta?: number; baixa?: number }): Pt[] {
  const ty = cy - hh * (0.215 + (o.linha === 'alta' ? 0.045 : 0) + (o.idoso ? 0.018 : 0)) + (o.baixa ?? 0);
  const L = cx - w / 2, t = o.t ?? 0.2;
  const e = o.entradas ? 1 : 0;
  const cost = o.costeleta ?? 1;
  const meio: Pt[] = o.linha === 'bico'
    ? [{ x: cx - 3.2, y: ty - 0.2 - e, t }, { x: cx, y: ty + 2.4, t: 0 }, { x: cx + 3.2, y: ty - 0.2 - e, t }]
    : [{ x: cx, y: ty + (e ? -0.6 : 0.2), t }];
  const esq: Pt[] = [
    { x: L + 0.9, y: cy + cost, t: 0 },
    { x: L + 1.5 + e * 0.8, y: ty + 5.5 - e * 3, t },
    { x: cx - w * (0.31 - e * 0.1), y: ty + 1.4 - e * 5.2, t },
    ...(e ? [{ x: cx - w * 0.12, y: ty - 3.2, t }] : [])
  ];
  const dir = esq.map(p => ({ ...p, x: 2 * cx - p.x })).reverse();
  return [...esq, ...meio, ...dir];
}

const TEXTURA_DO_CORTE: Record<string, Textura> = {
  black: 'crespo', crespo_curto: 'crespo', locs: 'crespo', trancas: 'crespo', cacheado: 'cacheado', cacheado_longo: 'cacheado', ondulado: 'ondulado', longo_ondulado: 'ondulado'
};
const texturaDe = (estilo: string, t?: string): Textura => (t === 'liso' || t === 'ondulado' || t === 'cacheado' || t === 'crespo' ? t : TEXTURA_DO_CORTE[estilo] ?? 'liso');
const crespa = (t: Textura) => t === 'cacheado' || t === 'crespo';

/* ------------------------------------------------------------------ O desenho */

interface Desenho { atras?: ReactElement | null; frente?: ReactElement | null }

/** Fios (traços de brilho ou de sombra) que seguem o caimento do cabelo. */
function Fios({ d, cor, w = 0.6, op = 0.5 }: { d: string[]; cor: string; w?: number; op?: number }) {
  return <g fill="none" stroke={cor} strokeWidth={w} strokeLinecap="round" opacity={op}>{d.map((x, k) => <path key={k} d={x} />)}</g>;
}
/** Cachinhos dentro da massa (pequenos arcos de sombra): a textura que a borda sozinha não mostra. */
function Cachinhos({ pts, r, cor, op = 0.4, sem = 0 }: { pts: [number, number][]; r: number; cor: string; op?: number; sem?: number }) {
  return (
    <g fill="none" stroke={cor} strokeWidth={0.65} strokeLinecap="round" opacity={op}>
      {pts.map(([x, y], k) => { const a = Math.PI * (0.15 + ruido(k, sem) * 0.7); const rr = r * (0.8 + ruido(k + 3, sem) * 0.4); return <path key={k} d={`M${r1(x + Math.cos(a) * rr)} ${r1(y + Math.sin(a) * rr)}A${r1(rr)} ${r1(rr)} 0 0 1 ${r1(x + Math.cos(a + 2.6) * rr)} ${r1(y + Math.sin(a + 2.6) * rr)}`} />; })}
    </g>
  );
}
/** Pontos espalhados numa elipse (onde vão os cachinhos). */
function espalhar(cx: number, cy: number, rx: number, ry: number, n: number, sem: number, acima?: number): [number, number][] {
  const out: [number, number][] = [];
  for (let k = 0; out.length < n && k < n * 6; k++) {
    const a = ruido(k, sem + 1) * Math.PI * 2, d = Math.sqrt(ruido(k + 11, sem + 2));
    const x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d;
    if (acima === undefined || y < acima) out.push([x, y]);
  }
  return out;
}

/** Um cordão (loc ou trança) com caimento natural: levemente curvo, mais fino na ponta, com as marcas da textura. */
function Cordao({ x0, y0, x1, y1, curva: cv, larg, cor, marca, tipo, k }: { x0: number; y0: number; x1: number; y1: number; curva: number; larg: number; cor: string; marca: string; tipo: 'loc' | 'tranca'; k: number }) {
  const mx = (x0 + x1) / 2 + cv, my = (y0 + y1) / 2;
  const d = `M${r1(x0)} ${r1(y0)}Q${r1(mx)} ${r1(my)} ${r1(x1)} ${r1(y1)}`;
  const n = Math.max(2, Math.floor((y1 - y0) / (tipo === 'tranca' ? 2.2 : 3.4)));
  const ponto = (s: number) => { const u = 1 - s; return [u * u * x0 + 2 * u * s * mx + s * s * x1, u * u * y0 + 2 * u * s * my + s * s * y1]; };
  return (
    <g>
      <path d={d} stroke={cor} strokeWidth={larg} strokeLinecap="round" fill="none" />
      <g stroke={marca} strokeWidth={0.5} strokeLinecap="round" fill="none" opacity={tipo === 'tranca' ? 0.7 : 0.32}>
        {Array.from({ length: n }, (_, j) => {
          const s = (j + 0.6) / (n + 0.4); const [x, y] = ponto(s); const l = larg * 0.42;
          return tipo === 'tranca'
            ? <path key={j} d={`M${r1(x - l)} ${r1(y - 0.7)}L${r1(x)} ${r1(y + 0.5)}L${r1(x + l)} ${r1(y - 0.7)}`} />
            : <path key={j} d={`M${r1(x - l)} ${r1(y + (j + k) % 2 * 0.4)}l${r1(l * 2)} 0.7`} />;
        })}
      </g>
      {/* Na trança, o alto de cada gomo pega luz: é o que faz a trama aparecer também no cabelo escuro (onde a marca
          escura some). */}
      {tipo === 'tranca' && (
        <g stroke={misturar(cor, '#ffffff', 0.38)} strokeWidth={0.45} strokeLinecap="round" fill="none" opacity={0.75}>
          {Array.from({ length: n }, (_, j) => {
            const s = (j + 0.6) / (n + 0.4); const [x, y] = ponto(s); const l = larg * 0.3;
            return <path key={j} d={`M${r1(x - l)} ${r1(y - 1.3)}L${r1(x)} ${r1(y - 0.3)}L${r1(x + l)} ${r1(y - 1.3)}`} />;
          })}
        </g>
      )}
    </g>
  );
}

/**
 * O cabelo inteiro de um corte: o que vai atrás e o que vai na frente. Uma função só para os dois lados — o que
 * aparece atrás e na frente é a mesma forma, não duas peças desenhadas separadamente.
 */
export function desenharCabelo(p: CabeloProps): Desenho {
  const { estilo, cor, cx, cy, w, hh, fase, linha } = p;
  const tex = texturaDe(estilo, p.textura);
  const H = cabeca(cx, cy, w, hh);
  const L = cx - w / 2, R = cx + w / 2;
  const infancia = fase === 'crianca' || fase === 'pre';
  const idoso = fase === 'idoso';
  // Densidade: a velhice tira volume; a infância tem menos corpo.
  const dens = idoso ? 0.72 : fase === 'meia' ? 0.9 : infancia ? 0.85 : 1;
  const escuro = misturar(cor, '#000000', 0.2);
  const sombra = misturar(cor, '#000000', 0.38);
  const brilho = misturar(cor, '#ffffff', 0.2);
  const entradas = p.estagio === 1 && fase !== 'bebe';
  const tTesta = tex === 'crespo' ? 0.55 : tex === 'cacheado' ? 0.5 : 0.2;
  const testa = (o: { costeleta?: number; baixa?: number; t?: number } = {}) => linhaDaTesta(cx, cy, w, hh, { linha, entradas, idoso, t: o.t ?? tTesta, ...o });
  const ty = cy - hh * (0.215 + (linha === 'alta' ? 0.045 : 0) + (idoso ? 0.018 : 0));
  const sem = Math.round(cx * 7 + w * 13 + hh) % 97;
  const ct = (pts: Pt[], esc = 1) => contorno(pts, tex, { esc, sem });
  // Calota: o cabelo que cobre o crânio, contornando o alto e voltando pela testa.
  const calota = (lados: number, topo: number, o: { costeleta?: number; baixa?: number; t?: number; ate?: number } = {}) => {
    const ate = o.ate ?? -6;
    const fora = perfil(lados * dens, topo * dens);
    const borda = arco(H, 180 - ate, ate, 15, fora);
    return [...borda, ...testa(o).reverse()];
  };

  switch (estilo) {
    case 'calvo': {
      // Calvo: a franja que sobra dos lados e de trás (atrás do rosto, aparece dos lados), e o brilho do couro.
      const banda = [
        H(198, 1.2 * dens, 1), H(188, 1.6 * dens), H(178, 1.4 * dens), { x: L + 3, y: cy - hh * 0.2, t: 1 }, { x: cx, y: cy - hh * 0.16, t: 0.2 },
        { x: R - 3, y: cy - hh * 0.2, t: 1 }, H(2, 1.4 * dens), H(-8, 1.6 * dens), H(-18, 1.2 * dens), { x: cx, y: cy + 8, t: 0 }
      ];
      return {
        atras: <path d={ct(banda, 0.8)} fill={cor} />,
        frente: p.pele ? <ellipse cx={cx - w * 0.12} cy={cy - hh * 0.38} rx={w * 0.17} ry={hh * 0.06} fill="#ffffff" opacity={0.16} transform={`rotate(-14 ${cx} ${cy})`} /> : null
      };
    }
    case 'bebe': {
      // Penugem com a textura da família: o crespo e o cacheado já nascem com cachinhos; o liso, fios finos.
      const cap = calota(0.2, 0.9, { baixa: -2.5, costeleta: -2, t: crespa(tex) ? 0.7 : 0.1 });
      return {
        frente: (
          <g>
            <path d={contorno(cap, tex, { esc: 0.55, sem })} fill={cor} opacity={crespa(tex) ? 0.55 : 0.32} />
            {!crespa(tex) && <Fios d={[`M${cx - 3} ${r1(cy - hh * 0.46)}q3 -4.5 6.5 -0.8`, `M${cx + 1} ${r1(cy - hh * 0.465)}q3 -3.5 5 0.4`]} cor={cor} w={1.3} op={0.8} />}
          </g>
        )
      };
    }
    case 'raspado': {
      // Rente: a forma do crânio com a linha do cabelo marcada; a pele aparece por baixo.
      const cap = calota(0.35, 0.6, { costeleta: 0.5, t: 0 });
      return { frente: <path d={curva(cap)} fill={cor} opacity={0.62} stroke={escuro} strokeWidth={0.45} strokeOpacity={0.5} /> };
    }
    case 'curto': {
      // Curto: mais corpo em cima, laterais curtas, costeleta; a borda do alto mostra a textura (no liso, as pontas
      // viram fios de brilho em vez de dentes).
      const cap = calota(1.1, crespa(tex) ? 3.2 : 2.6, { costeleta: 2, t: crespa(tex) ? 0.6 : 0.2 });
      return {
        frente: (
          <g>
            <path d={ct(cap, 0.75)} fill={cor} />
            {!crespa(tex) && <Fios d={[`M${cx - 8} ${r1(ty + 1)}q2 -5 7 -8`, `M${cx - 1} ${r1(ty + 0.5)}q3 -5 8 -7`, `M${cx + 6} ${r1(ty + 1.5)}q2 -3 5 -5`]} cor={brilho} op={0.55} />}
            {crespa(tex) && <Cachinhos pts={espalhar(cx, ty - 4, w * 0.3, 3.5, 6, sem)} r={1.1} cor={sombra} sem={sem} />}
          </g>
        )
      };
    }
    case 'curto_lado': {
      // A risca de um lado e a franja varrida para o outro, caindo um pouco na testa.
      const fora = perfil(1.2 * dens, 3 * dens);
      const borda = arco(H, 186, -6, 15, fora);
      const risca = cx - w * 0.2;
      const frente: Pt[] = [
        ...borda,
        { x: R - 0.9, y: cy + 1.5, t: 0 }, { x: R - 1.6, y: ty + 6.5, t: 0.3 }, { x: cx + w * 0.22, y: ty + 4.2, t: 0.3 },
        { x: cx - w * 0.02, y: ty + 2.2, t: 0.2 }, { x: risca, y: ty - 0.6, t: 0 },
        ...testa({ costeleta: 1.5 }).slice(0, 3).reverse()
      ];
      return {
        frente: (
          <g>
            <path d={ct(frente, 0.8)} fill={cor} />
            <Fios d={[`M${r1(risca + 0.5)} ${r1(ty - 2)}Q${cx + 2} ${r1(ty - 6)} ${r1(R - 2)} ${r1(ty + 3)}`, `M${r1(risca + 2)} ${r1(ty - 5.5)}Q${cx + 5} ${r1(ty - 8)} ${r1(R - 1)} ${r1(ty - 1)}`]} cor={brilho} op={0.6} />
            <path d={`M${r1(risca)} ${r1(ty - 0.8)}Q${r1(risca - 0.5)} ${r1(ty - 6)} ${r1(risca + 1)} ${r1(cy - hh * 0.47)}`} stroke={sombra} strokeWidth={0.7} fill="none" opacity={0.6} />
          </g>
        )
      };
    }
    case 'topete': {
      // Laterais baixas; o volume levantado na frente, penteado para trás (uma peça só com a cabeça).
      const fora = (g: number) => (g > 40 && g < 150 ? 0.9 + 5 * Math.max(0, Math.sin(((g - 40) / 110) * Math.PI)) ** 1.3 : 0.9) * dens;
      const cap = [...arco(H, 186, -6, 17, fora), ...testa({ costeleta: 1.5 }).reverse()];
      return {
        frente: (
          <g>
            <path d={ct(cap, 0.85)} fill={cor} />
            <Fios d={[`M${cx - w * 0.28} ${r1(ty + 0.5)}C${cx - w * 0.3} ${r1(ty - 9)} ${cx + w * 0.05} ${r1(ty - 13)} ${cx + w * 0.3} ${r1(ty - 8)}`, `M${cx - w * 0.12} ${r1(ty)}C${cx - w * 0.1} ${r1(ty - 7)} ${cx + w * 0.12} ${r1(ty - 10)} ${cx + w * 0.34} ${r1(ty - 5)}`]} cor={brilho} op={0.6} />
          </g>
        )
      };
    }
    case 'ondulado': {
      // Até a altura da orelha: o volume de trás, a franja que cai de lado.
      const baixo = cy + 9 * dens;
      const atras = [H(178, 3 * dens), H(150, 4 * dens), H(90, 4 * dens), H(30, 4 * dens), H(2, 3 * dens), { x: R + 3.2 * dens, y: baixo }, { x: cx, y: baixo + 2, t: 0 }, { x: L - 3.2 * dens, y: baixo }];
      const fora = perfil(2.6 * dens, 4 * dens);
      const frente: Pt[] = [
        { x: L - 2.6 * dens, y: cy + 7 }, ...arco(H, 182, -2, 15, fora), { x: R + 2.6 * dens, y: cy + 7 }, { x: R - 1.2, y: cy + 4, t: 0.2 },
        { x: R - 1.4, y: ty + 5, t: 0.3 }, { x: cx + w * 0.18, y: ty + 3.5, t: 0.5 }, { x: cx - w * 0.05, y: ty + 5.2, t: 0.5 }, { x: cx - w * 0.3, y: ty + 2.6, t: 0.4 },
        { x: L + 1.3, y: ty + 5, t: 0.3 }, { x: L + 1.2, y: cy + 4, t: 0.2 }
      ];
      return {
        atras: <path d={ct(atras)} fill={escuro} />,
        frente: (
          <g>
            <path d={ct(frente)} fill={cor} />
            <Fios d={[`M${cx - 4} ${r1(ty - 5)}q4 2 7 -1q3 -3 7 0`, `M${L + 1} ${r1(ty + 2)}q-1 4 0.5 8`]} cor={brilho} op={0.45} />
          </g>
        )
      };
    }
    case 'crespo_curto': {
      // Alto e redondo em cima; as laterais rentes (o degradê), mais claras porque a pele aparece.
      const lados = calota(0.5, 0.8, { costeleta: 1, t: 0 });
      const fora = (g: number) => (g > 25 && g < 155 ? 0.5 + 4.6 * Math.sin(((g - 25) / 130) * Math.PI) ** 0.7 : 0.5) * dens;
      const alto = [...arco(H, 160, 20, 13, fora), { x: R - 3, y: ty - 0.5, t: 0.6 }, ...testa({ t: 0.6 }).slice(2, -2).reverse(), { x: L + 3, y: ty - 0.5, t: 0.6 }];
      return {
        frente: (
          <g>
            <path d={curva(lados)} fill={cor} opacity={0.55} />
            <path d={contorno(alto, 'crespo', { esc: 0.85, sem })} fill={cor} />
            <Cachinhos pts={espalhar(cx, ty - 5, w * 0.32, 3.6, 9, sem)} r={0.9} cor={sombra} sem={sem} />
          </g>
        )
      };
    }
    case 'cacheado': {
      // Cachos em volta da cabeça, caindo um pouco na testa e cobrindo o alto da orelha.
      const baixo = cy + (infancia ? 3 : 5) * dens;
      const atras = [H(182, 5 * dens), H(130, 6.5 * dens), H(90, 6.5 * dens), H(50, 6.5 * dens), H(-2, 5 * dens), { x: R + 4.5 * dens, y: baixo }, { x: cx, y: baixo + 1, t: 0 }, { x: L - 4.5 * dens, y: baixo }];
      const fora = perfil(3.6 * dens, 5.6 * dens);
      const frente = [{ x: L - 3.2 * dens, y: cy + 3 }, ...arco(H, 184, -4, 15, fora), { x: R + 3.2 * dens, y: cy + 3 }, ...testa({ costeleta: 2, baixa: 2.2, t: 0.75 }).reverse()];
      return {
        atras: <path d={contorno(atras, 'cacheado', { esc: 1.05, sem })} fill={escuro} />,
        frente: (
          <g>
            <path d={contorno(frente, tex === 'crespo' ? 'crespo' : 'cacheado', { esc: 0.95, sem })} fill={cor} />
            <Cachinhos pts={espalhar(cx, ty - 4, w * 0.36, 5, 10, sem)} r={1.4} cor={sombra} sem={sem} />
          </g>
        )
      };
    }
    case 'black': {
      // O black: a coroa grande e redonda (crespo miúdo na borda), a linha da testa com cachinhos.
      const rx = (w / 2 + (infancia ? 7 : 10.5)) * dens ** 0.5, ry = (hh / 2 + (infancia ? 5 : 8)) * dens ** 0.5;
      const ccy = cy - (infancia ? 4 : 5.5);
      const massa = Array.from({ length: 18 }, (_, k) => { const a = (k / 18) * Math.PI * 2; return { x: cx + Math.cos(a) * rx, y: ccy + Math.sin(a) * ry * (Math.sin(a) > 0 ? 0.92 : 1), t: 1 }; });
      const cap = calota(1.2, 2.5, { costeleta: 1, t: 0.7 });
      return {
        atras: (
          <g>
            <path d={contorno(massa, 'crespo', { esc: 1.1, sem })} fill={cor} />
            <Cachinhos pts={espalhar(cx, ccy, rx * 0.88, ry * 0.85, 22, sem)} r={1.3} cor={sombra} sem={sem} op={0.45} />
          </g>
        ),
        frente: <path d={contorno(cap, 'crespo', { esc: 0.8, sem })} fill={cor} />
      };
    }
    case 'locs':
    case 'trancas': {
      // Locs (cordões grossos) e tranças soltas (box braids, mais finas e trançadas): muitos cordões com caimento,
      // de comprimentos diferentes, atrás e na frente dos ombros — não duas tiras rígidas.
      const tipo = estilo === 'locs' ? 'loc' : 'tranca';
      const fim = cy + (infancia ? 15 : tipo === 'tranca' ? 34 : 30) * (idoso ? 0.85 : 1);
      const larg = tipo === 'loc' ? 3.4 : 2.4;
      const marca = misturar(cor, '#000000', 0.45);
      const atrasX = [-1.25, -1.0, -0.72, 0.72, 1.0, 1.25];
      const cap = calota(1.3, 1.8, { costeleta: 0, t: 0.3 });
      return {
        atras: (
          <g>
            <path d={curva([H(178, 2), H(120, 2.6), H(60, 2.6), H(2, 2), { x: R + 5, y: cy + 8 }, { x: cx, y: cy + 10 }, { x: L - 5, y: cy + 8 }])} fill={escuro} />
            {atrasX.map((f, k) => <Cordao key={k} k={k} tipo={tipo} x0={cx + f * (w / 2)} y0={cy - 6} x1={cx + f * (w / 2 + 4)} y1={fim - (k % 3) * 2.2} curva={f * 1.5} larg={larg} cor={k % 2 ? escuro : cor} marca={marca} />)}
          </g>
        ),
        frente: (
          <g>
            <path d={curva(cap)} fill={cor} />
            {[-1, 1].map(l => (
              <g key={l}>
                <Cordao k={l + 2} tipo={tipo} x0={cx + l * (w / 2 - 0.2)} y0={ty + 1} x1={cx + l * (w / 2 + 2.6)} y1={fim - 2} curva={l * 1.2} larg={larg} cor={cor} marca={marca} />
              </g>
            ))}
          </g>
        )
      };
    }
    case 'longo_liso':
    case 'longo_ondulado':
    case 'cacheado_longo': {
      // Longos: o volume de trás até o peito e, na frente, UMA peça — o topo, a testa (risca no meio ou de lado) e as
      // mechas que descem ao lado do rosto, cobrindo a orelha e caindo na frente dos ombros.
      const cach = estilo === 'cacheado_longo';
      const fim = cy + (infancia ? 17 : cach ? 26 : 34) * (idoso ? 0.85 : 1);
      const abre = (cach ? 9 : 4.5) * dens; // quanto o cabelo abre embaixo
      const lado = estilo === 'longo_ondulado' ? 3.5 : 0; // a risca de lado
      const t = tex === 'liso' ? 0 : 1;
      const atras: Pt[] = [
        H(176, 2.6 * dens), H(130, 3.2 * dens), H(90, 3.2 * dens), H(50, 3.2 * dens), H(4, 2.6 * dens),
        { x: R + abre * 0.7, y: cy + 12 }, { x: R + abre, y: fim - 4 }, { x: R + abre * 0.8, y: fim + 1, t }, { x: cx + 6, y: fim + 2.5, t }, { x: cx - 6, y: fim + 2.5, t },
        { x: L - abre * 0.8, y: fim + 1, t }, { x: L - abre, y: fim - 4 }, { x: L - abre * 0.7, y: cy + 12 }
      ];
      const fora = perfil((cach ? 4 : 2.2) * dens, (cach ? 5.2 : 3) * dens);
      const mecha = (l: 1 | -1): Pt[] => {
        const x0 = l > 0 ? R : L;
        return [
          { x: x0 - l * 1.4, y: ty + 4, t: 0.15 }, { x: x0 - l * 1.9, y: cy - 1, t: 0.15 }, { x: x0 - l * 1.6, y: cy + 9, t: 0.2 },
          { x: x0 - l * 0.6, y: cy + 18, t: 0.3 }, { x: x0 + l * 0.6, y: fim - 2, t: 0.6 }, { x: x0 + l * abre * 0.45, y: fim + 0.5, t: 1 },
          { x: x0 + l * abre * 0.75, y: fim - 5, t: 1 }, { x: x0 + l * (abre * 0.5 + 1.4), y: cy + 8 }, { x: x0 + l * (cach ? 4 : 2.6) * dens, y: cy - 2 }
        ];
      };
      const meio: Pt[] = cach
        ? testa({ baixa: 2, t: 0.75 }).slice(2, -2)
        : [{ x: cx - w * 0.3 + lado, y: ty + 3.2, t: 0.1 }, { x: cx - 1.2 + lado, y: ty - 0.8, t: 0 }, { x: cx + lado, y: ty - 1.6, t: 0 }, { x: cx + 1.2 + lado, y: ty - 0.8, t: 0 }, { x: cx + w * 0.3 + lado, y: ty + 3.2 + lado * 0.8, t: 0.1 }];
      // Ordem: mecha esquerda (de baixo para cima pelo lado do rosto), a testa, a mecha direita (descendo), por fora, o alto.
      const esq = mecha(-1), dir = mecha(1);
      const frente: Pt[] = [...esq.slice(0, 6).reverse().slice(0, 6), ...meio, ...dir.slice(0, 6), ...dir.slice(6), ...arco(H, 2, 178, 11, fora), ...esq.slice(6).reverse()];
      // Começo e fim da sequência: esq[5]→…→esq[0] (subindo), meio, dir[0]→dir[5] (descendo), dir[6..8] (subindo por fora), o alto, esq[8..6] (descendo por fora).
      const fioX = cx + lado;
      return {
        atras: <path d={contorno(atras, tex, { esc: cach ? 1.3 : 1, sem })} fill={escuro} />,
        frente: (
          <g>
            <path d={contorno(frente, tex, { esc: cach ? 1.15 : 1, sem })} fill={cor} />
            {!cach && <Fios d={[`M${r1(fioX - 1)} ${r1(ty - 2)}Q${r1(L + 3)} ${r1(ty - 2)} ${r1(L - 1)} ${r1(cy + 6)}`, `M${r1(fioX + 1)} ${r1(ty - 3)}Q${r1(R - 2)} ${r1(ty - 3)} ${r1(R + 1)} ${r1(cy + 4)}`, `M${r1(L - 1.5)} ${r1(cy + 10)}L${r1(L - 1)} ${r1(fim - 4)}`]} cor={brilho} op={0.42} />}
            {!cach && <path d={`M${r1(fioX)} ${r1(ty - 1.4)}L${r1(fioX - lado * 0.3)} ${r1(cy - hh * 0.46)}`} stroke={sombra} strokeWidth={0.6} opacity={0.55} />}
            {cach && <Cachinhos pts={espalhar(cx, ty - 4, w * 0.33, 4.5, 6, sem)} r={1.4} cor={sombra} sem={sem} op={0.3} />}
          </g>
        )
      };
    }
    case 'chanel': {
      // O chanel: corte na altura do queixo, a franja reta (a borda com textura fina), as pontas curvando para dentro.
      const corte = cy + hh * 0.4;
      const franja = ty + 6.2;
      const vol = 2.8 * dens;
      const frente: Pt[] = [
        { x: L + 2, y: corte - 1.2, t: 0.6 }, { x: L + 1.6, y: cy + 6, t: 0 }, { x: L + 1.7, y: franja + 1.5, t: 0 }, { x: L + 3, y: franja, t: 0.35 },
        { x: cx - w * 0.15, y: franja + 0.9, t: 0.35 }, { x: cx + w * 0.15, y: franja + 0.9, t: 0.35 }, { x: R - 3, y: franja, t: 0.35 },
        { x: R - 1.7, y: franja + 1.5, t: 0 }, { x: R - 1.6, y: cy + 6, t: 0 }, { x: R - 2, y: corte - 1.2, t: 0.6 }, { x: R + vol * 0.6, y: corte + 0.4, t: 0.6 },
        { x: R + vol + 0.6, y: corte - 4 }, ...arco(H, 0, 180, 11, () => vol), { x: L - vol - 0.6, y: corte - 4 }, { x: L - vol * 0.6, y: corte + 0.4, t: 0.6 }
      ];
      return {
        atras: <path d={curva([H(176, vol), H(90, vol + 0.5), H(4, vol), { x: R + vol + 0.8, y: corte - 3 }, { x: R + 1, y: corte + 1 }, { x: cx, y: corte + 1.5 }, { x: L - 1, y: corte + 1 }, { x: L - vol - 0.8, y: corte - 3 }])} fill={escuro} />,
        frente: (
          <g>
            <path d={contorno(frente, tex === 'liso' ? 'liso' : tex, { esc: 0.7, sem })} fill={cor} />
            <Fios d={[`M${r1(cx - w * 0.36)} ${r1(ty - 4)}Q${cx} ${r1(ty - 9)} ${r1(cx + w * 0.36)} ${r1(ty - 4)}`, `M${r1(L - 0.5)} ${r1(cy)}L${r1(L)} ${r1(corte - 3)}`]} cor={brilho} op={0.45} />
          </g>
        )
      };
    }
    case 'pixie': {
      // Curtinho: nuca e laterais rentes; a franja longa varrida de lado até a sobrancelha.
      const fora = perfil(1 * dens, 2.6 * dens);
      const frente: Pt[] = [
        ...arco(H, 186, -6, 15, fora), { x: R - 0.9, y: cy + 1, t: 0 }, { x: R - 1.6, y: ty + 3.5, t: 0.2 },
        { x: cx + w * 0.15, y: ty + 2, t: 0.4 }, { x: cx - w * 0.12, y: ty + 5.5, t: 0.5 }, { x: L + 3.2, y: ty + 8.4, t: 0.5 }, { x: L + 1.2, y: ty + 6.5, t: 0.2 }, { x: L + 0.9, y: cy + 1, t: 0 }
      ];
      return {
        frente: (
          <g>
            <path d={ct(frente, 0.7)} fill={cor} />
            <Fios d={[`M${r1(R - 3)} ${r1(ty - 3)}Q${cx} ${r1(ty - 2)} ${r1(L + 4)} ${r1(ty + 6.5)}`, `M${r1(R - 6)} ${r1(ty - 7)}Q${cx - 3} ${r1(ty - 4)} ${r1(L + 2)} ${r1(ty + 2)}`]} cor={brilho} op={0.5} />
          </g>
        )
      };
    }
    case 'rabo':
    case 'coque': {
      // Puxado para trás: a calota rente com os fios penteados para o rabo (ou o coque). O rabo e o coque têm a
      // textura da pessoa (o rabo cacheado é um volume de cachos; o coque crespo, um puff).
      const cap = calota(1, 1.6, { costeleta: 0.5, t: crespa(tex) ? 0.4 : 0 });
      const T = cy - hh * 0.4725;
      const elastico = misturar(cor, '#000000', 0.5);
      let atras: ReactElement;
      if (estilo === 'coque') {
        const r = (crespa(tex) ? 8.5 : 7) * dens;
        const bola = Array.from({ length: 12 }, (_, k) => { const a = (k / 12) * Math.PI * 2; return { x: cx + Math.cos(a) * r, y: T - r * 0.55 + Math.sin(a) * r * 0.9, t: 1 }; });
        atras = (
          <g>
            <path d={contorno(bola, tex, { esc: 0.8, sem })} fill={cor} />
            {tex === 'liso' || tex === 'ondulado'
              ? <Fios d={[`M${r1(cx - r * 0.7)} ${r1(T - r * 0.6)}Q${cx} ${r1(T - r * 1.5)} ${r1(cx + r * 0.7)} ${r1(T - r * 0.5)}`, `M${r1(cx - r * 0.5)} ${r1(T - r * 0.1)}Q${cx} ${r1(T - r * 0.9)} ${r1(cx + r * 0.6)} ${r1(T)}`]} cor={escuro} op={0.6} />
              : <Cachinhos pts={espalhar(cx, T - r * 0.55, r * 0.7, r * 0.6, 6, sem)} r={1.2} cor={sombra} sem={sem} />}
          </g>
        );
      } else {
        const comp = (infancia ? 16 : 26) * (idoso ? 0.8 : 1);
        const larg = crespa(tex) ? 6 : 4.4;
        // O rabo sai da nuca, aparece por trás de um lado da cabeça e cai até o ombro.
        const rabo: Pt[] = [
          { x: R - 4, y: cy - 8, t: 0 }, { x: R + 2.5, y: cy - 6.5 }, { x: R + 4 + larg * 0.5, y: cy + 1 }, { x: R + 4 + larg * 0.6, y: cy + comp * 0.55 }, { x: R + 2.5, y: cy + comp },
          { x: R + 1 - larg * 0.2, y: cy + comp * 0.6 }, { x: R, y: cy + 4 }, { x: R - 4, y: cy - 2, t: 0 }
        ];
        atras = (
          <g>
            <path d={contorno(rabo, tex, { esc: 0.9, sem })} fill={escuro} />
            <rect x={R + 0.6} y={cy - 7.6} width={3.4} height={2.6} rx={1} fill={elastico} transform={`rotate(20 ${R + 2.3} ${cy - 6.3})`} />
          </g>
        );
      }
      return {
        atras,
        frente: (
          <g>
            <path d={tex === 'liso' || tex === 'ondulado' ? curva(cap) : contorno(cap, tex, { esc: 0.6, sem })} fill={cor} />
            {(estilo === 'coque' ? [-0.3, 0, 0.3] : [-0.25, 0.1, 0.38]).map((f, k) => (
              <path key={k} d={`M${r1(cx + f * w * 1.15)} ${r1(ty + 0.5)}Q${r1(cx + f * w * 0.7)} ${r1(T + 2)} ${r1(estilo === 'coque' ? cx + f * 4 : R - 1)} ${r1(estilo === 'coque' ? T - 0.4 : cy - hh * 0.2)}`} stroke={brilho} strokeWidth={0.6} fill="none" opacity={0.55} />
            ))}
          </g>
        )
      };
    }
    default: {
      const cap = calota(1.2, 2.4, { costeleta: 1 });
      return { frente: <path d={ct(cap)} fill={cor} /> };
    }
  }
}

/** O que fica ATRÁS da cabeça e do corpo (o comprimento, o volume de trás). */
export function CabeloAtras(p: CabeloProps) {
  return desenharCabelo(p).atras ?? null;
}

/** O que fica NA FRENTE (o topo, a franja, as mechas que caem ao lado do rosto). */
export function CabeloFrente(p: CabeloProps) {
  return desenharCabelo(p).frente ?? null;
}
