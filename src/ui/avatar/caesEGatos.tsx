/**
 * Cães e gatos por MORFOLOGIA, não por cor.
 *
 * Dois cachorros da mesma cor têm que parecer dois bichos diferentes: o
 * desenho sai de um corpo inteiro, de perfil, montado por traços — porte,
 * proporção do corpo, altura da perna, focinho, orelha, cauda e pelagem (no
 * gato: constituição, cabeça, orelha, cauda, pelo e postura). A cor e o
 * padrão (mancha, sela, máscara, listra) variam DENTRO da forma, nunca no
 * lugar dela. Tudo sai da identidade do bicho (o id, o porte e — se um dia
 * existir — a raça), por hash: o mesmo bicho é o mesmo desenho em qualquer
 * tela e depois de recarregar. Vira-lata é o padrão (traços misturados);
 * uma raça, quando houver, só fixa alguns traços.
 */
import type { ReactElement } from 'react';

export type Porte = 'pequeno' | 'medio' | 'grande';

export interface MorfoCao {
  porte: Porte;
  corpo: 'compacto' | 'atletico' | 'comprido' | 'robusto';
  pernas: 'curtas' | 'medias' | 'longas';
  focinho: 'curto' | 'medio' | 'longo';
  orelhas: 'empe' | 'dobradas' | 'caidas' | 'longas';
  cauda: 'enrolada' | 'reta' | 'peluda' | 'foice' | 'curta';
  pelo: 'curto' | 'longo' | 'duro';
  cor: string;
  padrao: 'liso' | 'peito' | 'sela' | 'manchas' | 'mascara';
  coleira: string;
  /** Três números em [-1, 1]: a pequena diferença de proporção entre dois bichos do mesmo tipo. */
  ajuste: [number, number, number];
}

export interface MorfoGato {
  corpo: 'esguio' | 'medio' | 'robusto';
  cabeca: 'redonda' | 'cunha' | 'achatada';
  orelhas: 'grandes' | 'medias' | 'pequenas' | 'dobradas' | 'tufos';
  cauda: 'longa' | 'peluda' | 'curta';
  postura: 'em_volta' | 'erguida';
  pelo: 'curto' | 'longo';
  cor: string;
  padrao: 'liso' | 'tigrado' | 'bicolor' | 'pontas' | 'manchas';
  olho: string;
  /** Três números em [-1, 1]: a pequena diferença de proporção entre dois bichos do mesmo tipo. */
  ajuste: [number, number, number];
}

const ESCURO = '#141110';
const ROSA = '#d99a94';

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
/** Um sorteio estável por traço: cada traço tem o seu sal (não andam juntos). */
const traco = <T,>(semente: string, sal: string, xs: readonly T[], pesos?: readonly number[]): T => {
  const h = hash(`${semente}#${sal}`);
  if (!pesos) return xs[h % xs.length];
  const tot = pesos.reduce((a, b) => a + b, 0);
  let x = (h % 10000) / 10000 * tot;
  for (let k = 0; k < xs.length; k++) { x -= pesos[k]; if (x < 0) return xs[k]; }
  return xs[xs.length - 1];
};
function misturar(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map(k => parseInt(a.slice(k, k + 2), 16));
  const pb = [1, 3, 5].map(k => parseInt(b.slice(k, k + 2), 16));
  return '#' + pa.map((x, k) => Math.round(x + (pb[k] - x) * t).toString(16).padStart(2, '0')).join('');
}
function luminancia(h: string): number {
  const c = [1, 3, 5].map(k => parseInt(h.slice(k, k + 2), 16) / 255).map(x => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
/** A pequena variação contínua de cada indivíduo (estável pela semente). */
const ajusteDe = (semente: string): [number, number, number] => { const h = hash(`${semente}#ajuste`); return [0, 8, 16].map(k => (((h >>> k) & 255) / 127.5) - 1) as [number, number, number]; };
const n = (x: number) => Math.round(x * 10) / 10;
const P = (...xs: (string | number)[]) => xs.map(x => (typeof x === 'number' ? n(x) : x)).join(' ');

function Olho({ x, y, r, aro }: { x: number; y: number; r: number; aro?: string }) {
  return <g>{aro && <circle cx={n(x)} cy={n(y)} r={n(r + 0.8)} fill={aro} />}<circle cx={n(x)} cy={n(y)} r={n(r)} fill={ESCURO} /><circle cx={n(x + r * 0.3)} cy={n(y - r * 0.35)} r={n(r * 0.32)} fill="#ffffff" /></g>;
}
const aroSe = (pelo: string) => (luminancia(pelo) < 0.06 ? misturar(pelo, '#ffffff', 0.45) : undefined);

/**
 * Franja de pelo comprido: uma faixa em dentes arredondados pendurada de
 * (x0,y) a (x1,y), com `alt` de comprimento (o pelo da barriga, do peito, da cauda).
 */
function franja(x0: number, x1: number, y: number, alt: number, dentes: number, inclina = 0): string {
  const passo = (x1 - x0) / dentes;
  let d = `M${P(x0, y - 2)}`;
  for (let k = 0; k < dentes; k++) {
    const a = x0 + passo * k, b = a + passo, m = (a + b) / 2;
    const yy = y + alt * (0.75 + 0.25 * ((k * 7) % 3) / 2) + inclina * k;
    d += `Q${P(m - passo * 0.1, yy + 1, b, y + alt * 0.35 + inclina * k)}`;
  }
  return d + `L${P(x1, y - 2)}Z`;
}

/* ------------------------------------------------------------------- Cão */

const CORES_CAO = ['#8a5a32', '#2b2622', '#d9c3a0', '#a8752f', '#6b6560', '#efe6d8', '#c98a4a', '#4a3a2e'];
const CORES_COLEIRA = ['#b8442e', '#3f6a8a', '#4f7a4a', '#c9a23a', '#6b4f7a'];

/**
 * Os traços do cão, da identidade. Sem raça, é vira-lata: os traços se
 * misturam, mas o porte puxa as probabilidades (cão pequeno tende a perna
 * curta e cauda enrolada; o grande, a perna longa e corpo atlético).
 */
export function morfologiaCao(semente: string, porte?: Porte, raca?: Partial<MorfoCao>): MorfoCao {
  const pt: Porte = porte ?? traco(semente, 'porte', ['pequeno', 'medio', 'grande'] as const, [3, 4, 3]);
  const pq = pt === 'pequeno', gr = pt === 'grande';
  const m: MorfoCao = {
    porte: pt,
    corpo: traco(semente, 'corpo', ['compacto', 'atletico', 'comprido', 'robusto'] as const, pq ? [4, 1, 3, 2] : gr ? [1, 4, 1, 3] : [2, 3, 2, 2]),
    pernas: traco(semente, 'pernas', ['curtas', 'medias', 'longas'] as const, pq ? [5, 3, 1] : gr ? [1, 3, 5] : [2, 5, 2]),
    focinho: traco(semente, 'focinho', ['curto', 'medio', 'longo'] as const, pq ? [3, 4, 2] : [2, 5, 3]),
    orelhas: traco(semente, 'orelhas', ['empe', 'dobradas', 'caidas', 'longas'] as const, [3, 3, 3, 2]),
    cauda: traco(semente, 'cauda', ['enrolada', 'reta', 'peluda', 'foice', 'curta'] as const, pq ? [4, 2, 2, 2, 1] : [2, 3, 2, 3, 1]),
    pelo: traco(semente, 'pelo', ['curto', 'longo', 'duro'] as const, [5, 3, 2]),
    cor: traco(semente, 'cor', CORES_CAO),
    padrao: traco(semente, 'padrao', ['liso', 'peito', 'sela', 'manchas', 'mascara'] as const, [3, 3, 2, 2, 2]),
    coleira: traco(semente, 'coleira', CORES_COLEIRA),
    ajuste: ajusteDe(semente)
  };
  return { ...m, ...raca };
}

const PERNA = { curtas: 10, medias: 17, longas: 24 };
const CORPO = { compacto: [30, 16, 1.5], atletico: [36, 14.5, 5], comprido: [46, 14, 1], robusto: [38, 19, 1] } as const;
const ESCALA_CAO = { pequeno: 0.8, medio: 0.9, grande: 1 };

/** O cão inteiro, de perfil (cabeça à direita), no chão em y = 90. */
export function FiguraCao({ m }: { m: MorfoCao }): ReactElement {
  const c = m.cor;
  const escuro = misturar(c, '#000000', 0.32), longe = misturar(c, '#000000', 0.18);
  const claro = luminancia(c) > 0.55 ? '#fbf7f0' : misturar(c, '#ffffff', 0.62);
  const G = 90;
  const [aj1, aj2, aj3] = m.ajuste ?? [0, 0, 0];
  const L = PERNA[m.pernas] + (m.corpo === 'atletico' ? 2 : 0) + 1.5 * aj2;
  const [B0, D0, tuck] = CORPO[m.corpo];
  const B = B0 + 2.5 * aj1, D = D0 + 1 * aj3;
  const pq = m.porte === 'pequeno';
  const R = 8.6 * (pq ? 1.28 : m.porte === 'medio' ? 1.1 : 1) * (m.corpo === 'robusto' ? 1.08 : 1) * (1 + 0.04 * aj3);
  const M = { curto: 3, medio: 7.5, longo: 12 }[m.focinho] * (pq ? 0.85 : 1);
  const espessura = { curto: R * 1.15, medio: R * 0.92, longo: R * 0.7 }[m.focinho];
  const W = (m.corpo === 'robusto' ? 6.4 : m.corpo === 'atletico' ? 4.4 : 5.4) * (m.pernas === 'curtas' ? 1.15 : 1);

  // Corpo: costas, peito, barriga (com a cintura do atlético) e a garupa.
  const cx = 44, yb = G - L, yt = yb - D, x0 = cx - B / 2, x1 = cx + B / 2;
  const corpo = `M${P(x0 + 5, yt)}C${P(x0 + B * 0.4, yt - 1, x1 - 10, yt - 0.5, x1 - 4, yt)}C${P(x1 + 2, yt, x1 + 3.5, yt + D * 0.6, x1 - 1, yb)}C${P(x1 - 10, yb + 1.5, x0 + 14, yb - tuck + 1, x0 + 8, yb - tuck)}C${P(x0 + 2, yb - tuck, x0 - 2, yt + D * 0.55, x0 - 1, yt + D * 0.3)}C${P(x0, yt + 2, x0 + 2, yt, x0 + 5, yt)}Z`;

  // Pescoço e cabeça.
  const alturaPescoco = (m.pernas === 'longas' ? 12 : m.pernas === 'curtas' ? 8 : 10) + (m.corpo === 'atletico' ? 2 : 0);
  const hx = x1 + 2 + (m.focinho === 'longo' ? 0 : 1), hy = yt - alturaPescoco;
  const nucaX = x1 - 6, nucaY = yt + 3;
  const pescoco = `M${P(nucaX - 4, nucaY + 2)}C${P(nucaX - 3, hy + 6, hx - R * 0.8, hy, hx - R * 0.6, hy - R * 0.3)}L${P(hx + R * 0.4, hy + R * 0.6)}C${P(x1, hy + R * 1.5, x1 + 2, yt + 2, x1 + 1, yt + D * 0.45)}Z`;

  // Focinho: do "stop" na frente do crânio até a trufa; o curto é largo e rombudo.
  const fx = hx + R * 0.55, ty = hy - R * 0.2 + (m.focinho === 'curto' ? 1.5 : 0.5), ponta = fx + M;
  const baixoY = hy + Math.max(R * 0.55, espessura * 0.75);
  const focinho = `M${P(fx - 2, ty - 0.6)}L${P(ponta - 1.5, ty + 0.4)}Q${P(ponta + 1.2, ty + 0.6, ponta + 0.6, ty + espessura * 0.5)}Q${P(ponta, baixoY, ponta - 3, baixoY)}L${P(hx, hy + R * 0.85)}Z`;

  // Orelhas, na nuca do crânio.
  const ex = hx - R * 0.35, ey = hy - R * 0.55;
  const orelhaEsc = m.padrao === 'mascara' || m.orelhas !== 'empe' ? escuro : c;
  const comp = m.pelo === 'longo' ? 1.25 : 1;
  const orelha = {
    empe: `M${P(ex - R * 0.35, ey + 1.5)}L${P(ex - R * 0.05, ey - R * 1.15)}L${P(ex + R * 0.55, ey + 0.5)}Z`,
    dobradas: `M${P(ex - R * 0.35, ey + 1.5)}L${P(ex - R * 0.1, ey - R * 0.75)}L${P(ex + R * 0.65, ey - R * 0.3)}L${P(ex + R * 0.5, ey + 0.6)}Z`,
    caidas: `M${P(ex - R * 0.45, ey + 1)}C${P(ex - R * 0.2, ey - R * 0.45, ex + R * 0.45, ey - R * 0.35, ex + R * 0.4, ey + 1)}L${P(ex + R * 0.15, ey + R * 0.95)}Q${P(ex - R * 0.25, ey + R * 1.1, ex - R * 0.45, ey + R * 0.5)}Z`,
    longas: `M${P(ex - R * 0.5, ey + 1)}C${P(ex - R * 0.2, ey - R * 0.4, ex + R * 0.5, ey - R * 0.3, ex + R * 0.45, ey + 1)}C${P(ex + R * 0.7, ey + R * 1.2 * comp, ex + R * 0.3, ey + R * 2 * comp, ex - R * 0.1, ey + R * 1.9 * comp)}C${P(ex - R * 0.6, ey + R * 1.7 * comp, ex - R * 0.7, ey + R * 0.6, ex - R * 0.5, ey + 1)}Z`
  }[m.orelhas];

  // Cauda, na garupa.
  const bx = x0 + 0.5, by = yt + 3;
  const cauda = {
    enrolada: { d: `M${P(bx + 1, by)}C${P(bx - 7, by - 4, bx - 3, yt - 13, bx + 5, yt - 10)}C${P(bx + 9, yt - 8, bx + 7, yt - 3, bx + 4, yt - 3.5)}`, w: 4.2 },
    reta: { d: `M${P(bx, by)}C${P(bx - 5, by + 2, bx - 9, by + 7, bx - 11, by + D * 0.75)}`, w: 3.2 },
    peluda: { d: `M${P(bx, by)}C${P(bx - 8, by - 1, bx - 12, by - 9, bx - 9, by - 15)}`, w: 7.5 },
    foice: { d: `M${P(bx, by)}C${P(bx - 4, by - 3, bx - 7, by - 11, bx - 4, by - 16)}`, w: 3.2 },
    curta: { d: `M${P(bx, by)}L${P(bx - 4, by - 3)}`, w: 4.4 }
  }[m.cauda];

  // Pernas: duas de cá (cor cheia), duas de lá (mais escuras, atrás do corpo).
  const fxL = x1 - 6, rxL = x0 + 7;
  const frente = (x: number) => `M${P(x, yb - 5)}L${P(x + 0.6, G - 2)}`;
  const tras = (x: number) => `M${P(x, yb - 6)}L${P(x + 3, yb + L * 0.35)}L${P(x - 1.5, G - L * 0.32)}L${P(x - 0.6, G - 2)}`;
  const pata = (x: number, cor: string) => <ellipse cx={n(x + 1.4)} cy={G - 1.4} rx={n(W * 0.62)} ry={1.6} fill={cor} />;

  // O todo cabe no quadro e o porte encolhe a partir do chão.
  const minX = Math.min(x0 - (m.cauda === 'reta' ? 12 : m.cauda === 'peluda' ? 13 : 8), ex - R * 0.7), maxX = ponta + 1;
  const k = ESCALA_CAO[m.porte];
  const dx = 50 - (minX + maxX) / 2;
  const pernaCor = m.padrao === 'peito' && m.pelo !== 'longo' ? claro : c;

  return (
    <g data-morfo={`cao:${m.porte}/${m.corpo}/${m.pernas}/${m.focinho}/${m.orelhas}/${m.cauda}/${m.pelo}`}>
      <ellipse cx="50" cy={G + 0.5} rx={n(34 * k)} ry="3" fill="#000000" opacity="0.08" />
      <g transform={`translate(50 ${G}) scale(${k}) translate(${n(dx - 50)} ${-G})`}>
        {/* do lado de lá */}
        <path d={frente(fxL - 4)} stroke={longe} strokeWidth={n(W)} strokeLinecap="round" fill="none" />
        <path d={tras(rxL + 3)} stroke={longe} strokeWidth={n(W)} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {pata(fxL - 4, longe)}{pata(rxL + 2.4, longe)}
        <path d={cauda.d} stroke={m.cauda === 'peluda' && m.padrao !== 'liso' ? claro : c} strokeWidth={n(cauda.w)} strokeLinecap="round" fill="none" />
        {m.pelo === 'longo' && m.cauda !== 'curta' && <path d={cauda.d} stroke={c} strokeWidth={n(cauda.w + 3.5)} strokeLinecap="round" fill="none" opacity="0.55" />}
        {/* corpo */}
        <path d={pescoco} fill={c} />
        <path d={corpo} fill={c} />
        {m.padrao === 'sela' && <path d={`M${P(x0 + 3, yt + 0.5)}C${P(x0 + B * 0.4, yt - 1, x1 - 12, yt - 0.5, x1 - 7, yt + 0.5)}C${P(x1 - 9, yt + D * 0.6, x0 + 10, yt + D * 0.65, x0 + 1, yt + D * 0.4)}Z`} fill={escuro} />}
        {m.padrao === 'manchas' && <><ellipse cx={n(cx - B * 0.15)} cy={n(yt + D * 0.4)} rx={n(B * 0.12)} ry={n(D * 0.25)} fill={escuro} /><ellipse cx={n(cx + B * 0.2)} cy={n(yt + D * 0.3)} rx={n(B * 0.07)} ry={n(D * 0.18)} fill={escuro} /></>}
        {m.padrao === 'peito' && <path d={`M${P(x1 - 3, yt + D * 0.2)}C${P(x1 + 3, yt + D * 0.4, x1 + 1, yb, x1 - 4, yb + 0.5)}C${P(x1 - 8, yb, x1 - 6, yt + D * 0.4, x1 - 3, yt + D * 0.2)}Z`} fill={claro} />}
        {m.pelo === 'longo' && <>
          <path d={franja(x0 + 4, x1 - 1, yb - tuck * 0.4, 6 + D * 0.15, 7, -tuck * 0.05)} fill={c} />
          <path d={franja(x1 - 5, x1 + 2.5, yt + D * 0.75, 6, 2)} fill={m.padrao === 'peito' ? claro : c} />
        </>}
        {m.pelo === 'duro' && <path d={`M${P(x0 + 4, yt + 0.6)}${Array.from({ length: 11 }, (_, i) => { const x = x0 + 4 + i * (B - 9) / 10; return `M${P(x, yt + 0.6)}l${i % 2 ? '-0.6 -1.6' : '-1 -1.1'}`; }).join('')}`} stroke={c} strokeWidth="1.6" strokeLinecap="round" />}
        {/* pernas de cá */}
        <path d={frente(fxL)} stroke={pernaCor} strokeWidth={n(W)} strokeLinecap="round" fill="none" />
        <path d={tras(rxL)} stroke={c} strokeWidth={n(W)} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <ellipse cx={n(rxL + 1.5)} cy={n(yb - 2)} rx={n(W * 1.05)} ry={n(D * 0.42)} fill={c} />
        {pata(fxL, pernaCor)}{pata(rxL - 0.6, c)}
        {m.pelo === 'longo' && m.pernas !== 'curtas' && <path d={franja(fxL - 3.5, fxL - 0.5, yb + 1, L * 0.45, 2)} fill={c} opacity="0.9" />}
        {/* cabeça */}
        <ellipse cx={n(hx)} cy={n(hy)} rx={n(R * 1.02)} ry={n(R * 0.92)} fill={c} />
        <path d={focinho} fill={m.padrao === 'mascara' ? escuro : m.padrao === 'peito' || m.padrao === 'sela' ? claro : c} />
        {m.padrao === 'mascara' && <ellipse cx={n(hx + R * 0.35)} cy={n(hy - R * 0.1)} rx={n(R * 0.5)} ry={n(R * 0.45)} fill={escuro} />}
        <ellipse cx={n(ponta - 0.3)} cy={n(ty + 1.4)} rx={n(m.focinho === 'curto' ? 2.6 : 2.2)} ry={1.8} fill={ESCURO} />
        <path d={`M${P(ponta - 1, baixoY - 1.2)}Q${P((ponta + hx) / 2, baixoY - 0.2, hx + R * 0.3, baixoY - 1.8)}`} stroke={ESCURO} strokeWidth="1" fill="none" opacity="0.7" />
        {m.pelo === 'duro' && <><path d={`M${P(ponta - M * 0.6 - 2, baixoY - 1)}Q${P(ponta - 1, baixoY + 5, ponta + 0.5, baixoY - 0.5)}Z`} fill={c} /><path d={`M${P(hx + R * 0.15, hy - R * 0.55)}l3.6 -0.4`} stroke={escuro} strokeWidth="1.6" strokeLinecap="round" /></>}
        <Olho x={hx + R * 0.38} y={hy - R * 0.22} r={R * 0.21} aro={aroSe(c)} />
        <path d={orelha} fill={orelhaEsc} />
        {m.orelhas === 'empe' && <path d={`M${P(ex - R * 0.12, ey + 0.5)}L${P(ex + 0.05, ey - R * 0.8)}L${P(ex + R * 0.32, ey + 0.2)}Z`} fill={ROSA} opacity="0.5" />}
        {m.pelo === 'longo' && (m.orelhas === 'longas' || m.orelhas === 'caidas') && <path d={franja(ex - R * 0.5, ex + R * 0.4, ey + R * (m.orelhas === 'longas' ? 1.8 : 0.9), 3, 3)} fill={orelhaEsc} />}
        {/* coleira */}
        <path d={`M${P(nucaX - 1.5, hy + R * 0.95)}Q${P(nucaX + 3, hy + R * 1.5, x1 + 1, hy + R * 1.05)}`} stroke={m.coleira} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      </g>
    </g>
  );
}

/* ------------------------------------------------------------------ Gato */

const CORES_GATO = ['#2b2622', '#7d7670', '#c98a43', '#efe6d8', '#8a7a66', '#b8aa98', '#5a4a3e'];

/** Os traços do gato, da identidade (SRD é o padrão: pelo curto, cabeça redonda, mais provável). */
export function morfologiaGato(semente: string, raca?: Partial<MorfoGato>): MorfoGato {
  const m: MorfoGato = {
    corpo: traco(semente, 'corpo', ['esguio', 'medio', 'robusto'] as const, [3, 4, 3]),
    cabeca: traco(semente, 'cabeca', ['redonda', 'cunha', 'achatada'] as const, [5, 3, 1.5]),
    orelhas: traco(semente, 'orelhas', ['grandes', 'medias', 'pequenas', 'dobradas', 'tufos'] as const, [3, 4, 2, 1, 1.5]),
    cauda: traco(semente, 'cauda', ['longa', 'peluda', 'curta'] as const, [6, 3, 1]),
    postura: traco(semente, 'postura', ['em_volta', 'erguida'] as const),
    pelo: traco(semente, 'pelo', ['curto', 'longo'] as const, [6, 3]),
    cor: traco(semente, 'cor', CORES_GATO),
    padrao: traco(semente, 'padrao', ['liso', 'tigrado', 'bicolor', 'pontas', 'manchas'] as const, [3, 4, 3, 1, 1.5]),
    olho: traco(semente, 'olho', ['#c9b23a', '#7fa04a', '#d08a2a', '#6a9ac9']),
    ajuste: ajusteDe(semente)
  };
  // O pelo longo engrossa a cauda (o gato peludo não tem rabo de rato).
  const out = { ...m, ...raca };
  if (out.pelo === 'longo' && out.cauda === 'longa' && !raca?.cauda) out.cauda = 'peluda';
  return out;
}

/** O gato inteiro, sentado de perfil (cabeça à direita), no chão em y = 90. */
export function FiguraGato({ m }: { m: MorfoGato }): ReactElement {
  const c = m.cor;
  const escuro = misturar(c, '#000000', 0.38), longe = misturar(c, '#000000', 0.18);
  const claro = luminancia(c) > 0.55 ? '#fbf7f0' : misturar(c, '#ffffff', 0.62);
  const ponta = m.padrao === 'pontas' ? misturar(c, '#2a1d14', 0.75) : c;
  const G = 91;
  const [aj1, aj2, aj3] = m.ajuste ?? [0, 0, 0];
  const w = { esguio: 0.84, medio: 1, robusto: 1.18 }[m.corpo] * (1 + 0.04 * aj1);
  const longo = m.pelo === 'longo';
  // Anca (sentada, atrás e embaixo), costas subindo até o ombro, peito em pé, as patas da frente retas.
  const ax = 40, ay = G - 12 * w;
  const alto = { esguio: 44, medio: 38, robusto: 33 }[m.corpo] + 2 * aj2;
  const sx = 58 + (m.corpo === 'robusto' ? 1 : 0), sy = G - alto;
  const R = { esguio: 8.8, medio: 10, robusto: 11.2 }[m.corpo] * (m.cabeca === 'achatada' ? 1.1 : 1) * (1 + 0.05 * aj3);
  const hx = sx + 3 + (m.corpo === 'esguio' ? 2 : 0), hy = sy - R * (m.cabeca === 'achatada' ? 0.55 : 0.75) - (m.corpo === 'esguio' ? 3 : 0);
  const corpo = `M${P(ax - 11 * w, ay - 6 * w)}C${P(ax - 8 * w, ay - 18 * w, sx - 14, sy + 2, sx - 5, sy - 1)}C${P(sx + 1, sy - 3, sx + 4.5 * w, sy + 2, sx + 5 * w, sy + 10)}C${P(sx + 5.5 * w, sy + 16, sx + 5 * w, G - 22, sx + 2 * w, G - 17)}C${P(sx - 4, G - 13, ax + 10 * w, G - 8, ax + 6 * w, G - 4)}Z`;
  const cabeca = {
    redonda: <ellipse cx={n(hx)} cy={n(hy)} rx={n(R * 1.05)} ry={n(R)} fill={c} />,
    cunha: <path d={`M${P(hx - R * 0.95, hy + R * 0.2)}C${P(hx - R, hy - R * 1.1, hx + R * 0.2, hy - R * 1.05, hx + R * 0.7, hy - R * 0.45)}L${P(hx + R * 1.55, hy + R * 0.35)}Q${P(hx + R * 1.6, hy + R * 0.75, hx + R * 1.1, hy + R * 0.8)}C${P(hx + R * 0.2, hy + R * 1.1, hx - R * 0.8, hy + R, hx - R * 0.95, hy + R * 0.2)}Z`} fill={c} />,
    achatada: <path d={`M${P(hx - R * 1.05, hy)}C${P(hx - R * 1.05, hy - R * 1.1, hx + R * 0.7, hy - R * 1.15, hx + R * 0.95, hy - R * 0.35)}C${P(hx + R * 1.05, hy, hx + R * 1.05, hy + R * 0.4, hx + R * 0.85, hy + R * 0.75)}C${P(hx + R * 0.2, hy + R * 1.2, hx - R * 1.05, hy + R * 1.05, hx - R * 1.05, hy)}Z`} fill={c} />
  }[m.cabeca];
  // O focinho: pequeno bico na frente (nada na cara achatada, um pouco mais na cunha).
  const nx = hx + R * (m.cabeca === 'cunha' ? 1.5 : m.cabeca === 'achatada' ? 1.02 : 1.08), ny = hy + R * (m.cabeca === 'achatada' ? 0.12 : 0.3);
  const ex = hx - R * 0.2, ey = hy - R * 0.62;
  const tamOrelha = { grandes: 1.35, medias: 1, pequenas: 0.65, dobradas: 0.5, tufos: 1.25 }[m.orelhas] * (m.cabeca === 'cunha' ? 1.12 : 1);
  const orelha = m.orelhas === 'dobradas'
    ? `M${P(ex - R * 0.35, ey + 1.5)}Q${P(ex, ey - R * 0.55, ex + R * 0.55, ey - R * 0.15)}L${P(ex + R * 0.3, ey + 1.6)}Z`
    : `M${P(ex - R * 0.45, ey + 2)}L${P(ex - R * 0.1 * tamOrelha, ey - R * 0.95 * tamOrelha)}L${P(ex + R * 0.5, ey + 1.2)}Z`;
  // Cauda: enrolada no chão até as patas, ou erguida atrás em gancho.
  const tb = { x: ax - 11 * w, y: G - 4 };
  const cauda = m.cauda === 'curta'
    ? `M${P(tb.x + 1, tb.y - 5)}l-3 -1.5`
    : m.postura === 'em_volta'
      ? `M${P(tb.x + 2, tb.y)}C${P(tb.x - 8, tb.y + 2, tb.x - 2, G + 1, ax + 4, G - 1)}C${P(sx - 6, G - 1.5, sx - 2, G - 3, sx + 1, G - 5)}`
      : `M${P(tb.x + 2, tb.y - 2)}C${P(tb.x - 9, tb.y - 6, tb.x - 10, tb.y - 22, tb.x - 6, tb.y - 34)}C${P(tb.x - 4, tb.y - 39, tb.x + 1, tb.y - 38, tb.x + 1, tb.y - 34)}`;
  const largCauda = m.cauda === 'curta' ? 6 : m.cauda === 'peluda' ? (longo ? 9.5 : 8) : 4 * (m.corpo === 'esguio' ? 0.8 : 1);
  const pataX = sx + 1.6 * w;
  const listra = (x: number, y: number, a: number, inc = 0) => `M${P(x, y)}l${P(inc, a)}`;
  const listras = m.padrao === 'tigrado'
    ? [listra(ax - 10 * w, ay - 8, 7, -1), listra(ax - 4 * w, ay - 11, 7, -1.5), listra(ax + 2, ay - 12, 6, -1.6), listra(sx - 7, sy + 4, 6, -1), listra(hx - R * 0.3, hy - R * 0.85, 4, 0.4), listra(hx + R * 0.05, hy - R * 0.9, 3.6, 0.5)].join('')
    : '';
  const dx = m.postura === 'erguida' ? 4 : 0;

  return (
    <g data-morfo={`gato:${m.corpo}/${m.cabeca}/${m.orelhas}/${m.cauda}/${m.postura}/${m.pelo}`}>
      <ellipse cx="50" cy={G + 0.5} rx="30" ry="3" fill="#000000" opacity="0.08" />
      <g transform={`translate(${dx} 0)`}>
        {m.postura === 'erguida' && <path d={cauda} stroke={m.padrao === 'pontas' ? ponta : c} strokeWidth={n(largCauda)} strokeLinecap="round" fill="none" />}
        {/* a pata de lá */}
        <path d={`M${P(pataX - 3.4, sy + 14)}L${P(pataX - 3.2, G - 1.5)}`} stroke={m.padrao === 'pontas' ? ponta : longe} strokeWidth={n(4.4 * w)} strokeLinecap="round" />
        <path d={corpo} fill={c} />
        
        {m.padrao === 'bicolor' && <path d={`M${P(sx - 2, sy + 4)}C${P(sx + 7 * w, sy + 4, sx + 7, G - 8, sx + 4, G)}L${P(sx - 6, G)}C${P(sx - 5, G - 10, sx - 8, sy + 12, sx - 2, sy + 4)}Z`} fill={claro} />}
        {m.padrao === 'manchas' && <><ellipse cx={n(ax - 6)} cy={n(ay - 4)} rx={n(6 * w)} ry={n(5 * w)} fill={escuro} /><ellipse cx={n(sx - 6)} cy={n(sy + 8)} rx={3} ry={2.6} fill={escuro} /></>}
        {listras && <path d={listras} stroke={escuro} strokeWidth="2" strokeLinecap="round" fill="none" />}
        {/* anca e pata traseira */}
        <ellipse cx={n(ax - 1)} cy={n(ay)} rx={n(13 * w + (longo ? 2 : 0))} ry={n(12 * w + (longo ? 1.5 : 0))} fill={c} />
        {m.padrao === 'tigrado' && <path d={`${listra(ax - 9, ay - 6, 6, 2)}${listra(ax - 3, ay - 8, 6, 2)}`} stroke={escuro} strokeWidth="2" strokeLinecap="round" />}
        <ellipse cx={n(ax + 6 * w)} cy={G - 1.8} rx={n(7 * w)} ry="2.4" fill={m.padrao === 'bicolor' ? claro : m.padrao === 'pontas' ? ponta : c} />
        {/* a pata de cá */}
        <path d={`M${P(pataX, sy + 14)}L${P(pataX + 0.4, G - 1.5)}`} stroke={m.padrao === 'bicolor' ? claro : m.padrao === 'pontas' ? ponta : c} strokeWidth={n(4.8 * w)} strokeLinecap="round" />
        {m.postura === 'em_volta' && <path d={cauda} stroke={m.padrao === 'pontas' ? ponta : c} strokeWidth={n(largCauda)} strokeLinecap="round" fill="none" />}
                {m.padrao === 'tigrado' && m.cauda !== 'curta' && m.postura === 'em_volta' && <path d={cauda} stroke={escuro} strokeWidth={n(largCauda)} strokeDasharray="1.6 4" fill="none" />}
        {/* juba do pelo longo */}
        {longo && <g fill={m.padrao === 'bicolor' ? claro : c}>
          <path d={`M${P(hx - R * 1.1, hy + R * 0.2)}L${P(hx - R * 0.95, hy + R * 1.35)}L${P(hx - R * 0.6, hy + R * 1.2)}L${P(hx - R * 0.35, hy + R * 1.75)}L${P(hx - R * 0.05, hy + R * 1.35)}L${P(hx + R * 0.25, hy + R * 1.7)}L${P(hx + R * 0.45, hy + R * 1.2)}L${P(hx + R * 0.8, hy + R * 1.3)}L${P(hx + R * 0.75, hy + R * 0.6)}Z`} strokeLinejoin="round" stroke={m.padrao === 'bicolor' ? claro : c} strokeWidth="1.6" />
        </g>}
        {/* cabeça */}
        <path d={orelha} fill={m.padrao === 'pontas' ? ponta : m.orelhas === 'dobradas' ? escuro : c} />
        {m.orelhas !== 'dobradas' && <path d={`M${P(ex - R * 0.2, ey + 1)}L${P(ex - R * 0.08 * tamOrelha, ey - R * 0.6 * tamOrelha)}L${P(ex + R * 0.25, ey + 0.8)}Z`} fill={ROSA} opacity="0.6" />}
        {m.orelhas === 'tufos' && <path d={`M${P(ex - R * 0.1 * tamOrelha, ey - R * 0.9 * tamOrelha)}l-0.6 -3.6`} stroke={escuro} strokeWidth="1.2" strokeLinecap="round" />}
        {cabeca}
        {m.orelhas === 'dobradas' && <path d={orelha} fill={m.padrao === 'pontas' ? ponta : escuro} />}
        {longo && <path d={`M${P(hx - R * 0.9, hy + R * 0.2)}Q${P(hx - R * 1.3, hy + R * 0.9, hx - R * 0.5, hy + R * 1.05)}L${P(hx + R * 0.2, hy + R * 0.9)}Z`} fill={c} />}
        {m.padrao === 'pontas' && <ellipse cx={n(nx - R * 0.35)} cy={n(ny)} rx={n(R * 0.55)} ry={n(R * 0.5)} fill={ponta} />}
        {m.padrao === 'bicolor' && <ellipse cx={n(nx - R * 0.3)} cy={n(ny + R * 0.3)} rx={n(R * 0.5)} ry={n(R * 0.35)} fill={claro} />}
        {m.padrao === 'tigrado' && <path d={`M${P(hx - R * 0.1, hy + R * 0.05)}l4 1`} stroke={escuro} strokeWidth="1.4" strokeLinecap="round" />}
        <path d={`M${P(nx, ny - 1.2)}l0.8 1.4l-1.6 0.4Z`} fill="#d07a7a" />
        <path d={`M${P(nx - R * 0.55, hy - R * 0.08)}q${P(R * 0.22, -R * 0.24, R * 0.48, 0)}q${P(-R * 0.24, R * 0.2, -R * 0.48, 0)}Z`} fill={m.olho} />
        <ellipse cx={n(nx - R * 0.27)} cy={n(hy - R * 0.08)} rx="0.7" ry={n(R * 0.13)} fill={ESCURO} />
        <path d={`M${P(nx - 1.5, ny + 1)}l${P(9, -2)}M${P(nx - 1.5, ny + 1.8)}l${P(9, 1.4)}`} stroke={luminancia(c) < 0.1 ? '#e8e0d4' : ESCURO} strokeWidth="0.5" opacity="0.6" />
      </g>
    </g>
  );
}
