/**
 * VIDA 14 — APARÊNCIA no retrato: as sobrancelhas (a herdada, com o desenho escolhido por cima) e os RISCOS — um corte
 * de verdade no traço (uma máscara: o que aparece no vão é a pele de baixo, com a sombra e a maquiagem que houver),
 * acompanhando a curva da sobrancelha no ponto do corte. A largura do vão se ajusta ao tamanho do retrato, para o risco
 * aparecer no miniretrato e não virar um buraco na lupa. E a pinta e os cílios (`dados14/aparencia/rosto14`).
 *
 * Os lados são os da pessoa: o lado esquerdo dela aparece à direita de quem olha (`lado` +1).
 */
import type { ReactElement } from 'react';
import type { Visual } from '../../../motor/tipos';
import { misturar } from '../../avatar/cores';

type Ponto = [number, number];
interface Geo { cx: number; esp: number; olhoY: number; olho: number; rx: number; ry: number }
interface Props {
  v: Visual; cx: number; esp: number; olhoY: number;
  /** A expressão do retrato (o canto de dentro sobe na tristeza, desce na tensão). */
  x: string;
  /** A espessura do traço antes do desenho (o gênero, a idade, a espessura herdada). */
  base: number; cor: string; pele: string;
  /** O arco herdado (reta −0,9; arqueada +1,2) e a quina (angulosa). */
  arco: number; angulo: boolean;
  uid: string; tamanho: number;
}

/** O que o desenho escolhido faz com a sobrancelha herdada. */
export function ajusteDoDesenho(d: string | undefined, arco: number, angulo: boolean) {
  switch (d) {
    case 'afinada': return { grossura: 0.68, arco: arco + 0.5, angulo, encurta: 0 };
    case 'fio': return { grossura: 0.42, arco: Math.max(arco, 0) + 1.3, angulo: false, encurta: 0.3 };
    case 'cheia': return { grossura: 1.38, arco, angulo, encurta: 0 };
    case 'reta': return { grossura: 1.05, arco: -1.1, angulo: false, encurta: 0 };
    case 'arqueada_alta': return { grossura: 0.95, arco: Math.max(arco, 0) + 1.9, angulo: false, encurta: 0 };
    case 'angulosa': return { grossura: 1, arco, angulo: true, encurta: 0 };
    case 'curta': return { grossura: 1, arco, angulo, encurta: 1.5 };
    default: return { grossura: 1, arco, angulo, encurta: 0 };
  }
}

/** Os três pontos da sobrancelha de um lado da tela (−1 esquerda, +1 direita): a ponta de fora, o meio (o controle da
 *  curva ou a quina) e a ponta de dentro. As mesmas contas do retrato de sempre. */
function pontos(lado: 1 | -1, cx: number, esp: number, olhoY: number, x: string, arco: number, angulo: boolean, encurta: number): [Ponto, Ponto, Ponto] {
  const bem = x === 'bem' ? 0.5 : 0;
  const dentro = x === 'tenso' ? 1.1 : x === 'abatido' || x === 'doente' ? -1.3 : 0;
  const c = cx + lado * esp;
  if (angulo) return [[c + lado * (3.4 - encurta), olhoY - 4.4 - (encurta ? 0.4 : 0)], [c + lado * 0.6, olhoY - 6.6 - bem], [c - lado * 3.2, olhoY - 5 + dentro]];
  return [[c + lado * (3.4 - encurta), olhoY - 4.6 - bem - (encurta ? 0.5 : 0)], [c, olhoY - 6.2 - arco - (x === 'bem' ? 0.6 : 0)], [c - lado * 3.2, olhoY - 4.8 + dentro]];
}

/** O ponto e a direção (unitária) da sobrancelha em t (0 = a ponta de dentro, 1 = a de fora). */
function naCurva([o, m, i]: [Ponto, Ponto, Ponto], angulo: boolean, t: number): { p: Ponto; d: Ponto } {
  let p: Ponto, d: Ponto;
  if (angulo) {
    // A quina divide em dois segmentos retos (de dentro até a quina, da quina até a ponta).
    const a = t < 0.55 ? i : m, b = t < 0.55 ? m : o, u = t < 0.55 ? t / 0.55 : (t - 0.55) / 0.45;
    p = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
    d = [b[0] - a[0], b[1] - a[1]];
  } else {
    // Bézier quadrática de dentro (i) para fora (o), com o controle m.
    const s = 1 - t;
    p = [s * s * i[0] + 2 * s * t * m[0] + t * t * o[0], s * s * i[1] + 2 * s * t * m[1] + t * t * o[1]];
    d = [2 * s * (m[0] - i[0]) + 2 * t * (o[0] - m[0]), 2 * s * (m[1] - i[1]) + 2 * t * (o[1] - m[1])];
  }
  const n = Math.hypot(d[0], d[1]) || 1;
  return { p, d: [d[0] / n, d[1] / n] };
}

const T0: Record<string, number> = { interno: 0.24, central: 0.5, externo: 0.76 };

/** Os cortes (linhas pretas na máscara) de um lado. */
function cortes(lado: 1 | -1, pts: [Ponto, Ponto, Ponto], angulo: boolean, r: NonNullable<Visual['sobrancelhaRiscos']>, traco: number, w: number): ReactElement[] {
  const n = Math.max(1, Math.min(3, Math.round(r.quantidade)));
  const passo = r.estilo === 'largo' ? 0.17 : 0.14;
  const t0 = T0[r.posicao] ?? 0.5;
  const out: ReactElement[] = [];
  for (let k = 0; k < n; k++) {
    const t = Math.min(0.9, Math.max(0.1, t0 + (k - (n - 1) / 2) * passo));
    const { p, d } = naCurva(pts, angulo, t);
    // A normal (perpendicular ao traço, para cima); na diagonal, inclinada uns 28° para fora.
    let nx = -d[1], ny = d[0];
    if (ny > 0) { nx = -nx; ny = -ny; }
    if (r.estilo === 'diagonal') { const a = 0.49 * lado; const c = Math.cos(a), s = Math.sin(a); [nx, ny] = [nx * c - ny * s, nx * s + ny * c]; }
    const meio = traco * 0.75 + 0.5;
    // Escalonado: cada risco corta um pouco menos (a partir de cima), em degrau.
    const frac = r.estilo === 'escalonado' ? 1 - k * 0.28 : 1;
    const ini: Ponto = [p[0] - nx * meio * (2 * frac - 1), p[1] - ny * meio * (2 * frac - 1)];
    const fim: Ponto = [p[0] + nx * meio, p[1] + ny * meio];
    const linha = (dx: number, dy: number, larg: number, key: string) => <line key={key} x1={ini[0] + dx} y1={ini[1] + dy} x2={fim[0] + dx} y2={fim[1] + dy} stroke="#000" strokeWidth={larg} strokeLinecap="butt" />;
    if (r.estilo === 'duplo_fino') { const f = w * 0.62; out.push(linha(-d[0] * f, -d[1] * f, w * 0.5, `${lado}${k}a`), linha(d[0] * f, d[1] * f, w * 0.5, `${lado}${k}b`)); }
    else out.push(linha(0, 0, r.estilo === 'largo' ? w * 1.7 : w, `${lado}${k}`));
  }
  return out;
}

/** As sobrancelhas do retrato (adolescente em diante; o bebê não tem). */
export function Sobrancelhas14({ v, cx, esp, olhoY, x, base, cor, pele, arco, angulo, uid, tamanho }: Props) {
  const a = ajusteDoDesenho(v.sobrancelhaDesenho, arco, angulo);
  const traco = base * a.grossura;
  const corTraco = v.sobrancelhaDesenho === 'descolorida' ? misturar(cor, pele, 0.62) : cor;
  const lados = [-1, 1] as const;
  const pts = lados.map(l => pontos(l, cx, esp, olhoY, x, a.arco, a.angulo, a.encurta));
  const d = (p: [Ponto, Ponto, Ponto]) => (a.angulo ? `M ${p[0][0]} ${p[0][1]} L ${p[1][0]} ${p[1][1]} L ${p[2][0]} ${p[2][1]}` : `M ${p[0][0]} ${p[0][1]} Q ${p[1][0]} ${p[1][1]} ${p[2][0]} ${p[2][1]}`);
  const r = v.sobrancelhaRiscos;
  // O vão: ~0,6 px no retrato grande, ~1 px no pequeno (a unidade do retrato é tamanho/80 px).
  const w = Math.min(1.1, Math.max(0.45, (0.75 * 80) / Math.max(20, tamanho)));
  const ladosDoRisco = r ? lados.filter(l => r.lado === 'ambos' || (r.lado === 'esquerdo' ? l === 1 : l === -1)) : [];
  const mid = `${uid}-sb14`;
  return (
    <g data-sobrancelha={v.sobrancelhaDesenho ?? 'natural'} {...(r ? { 'data-riscos': `${r.quantidade}-${r.lado}-${r.posicao}-${r.estilo}` } : {})}>
      {r && (
        <mask id={mid} maskUnits="userSpaceOnUse" x={0} y={0} width={100} height={100}>
          <rect x={0} y={0} width={100} height={100} fill="#fff" />
          {ladosDoRisco.map(l => <g key={l} data-risco-lado={l}>{cortes(l, pts[l === -1 ? 0 : 1], a.angulo, r, traco, w)}</g>)}
        </mask>
      )}
      <g stroke={corTraco} strokeLinecap="round" fill="none" strokeWidth={traco} mask={r ? `url(#${mid})` : undefined}>
        {pts.map((p, k) => <path key={k} d={d(p)} />)}
        {/* Cheia e escovada: os fios penteados para cima, por cima do traço. */}
        {v.sobrancelhaDesenho === 'cheia' && pts.map((p, k) => (
          <g key={`f${k}`} strokeWidth={traco * 0.3} opacity={0.8}>
            {[0.15, 0.32, 0.5, 0.68, 0.84].map(t => { const { p: q, d: dd } = naCurva(p, a.angulo, t); const l = lados[k]; return <line key={t} x1={q[0]} y1={q[1] + traco * 0.3} x2={q[0] + dd[0] * 0.5 * l * -1 + l * 0.25} y2={q[1] - traco * 0.85} />; })}
          </g>
        ))}
      </g>
    </g>
  );
}

/** A pinta (os lados da pessoa: a esquerda dela à direita da tela). */
const PINTA: Record<string, (g: Geo) => Ponto> = {
  labio_esquerdo: g => [g.cx + 3.4, g.olhoY + 10.1], labio_direito: g => [g.cx - 3.4, g.olhoY + 10.1],
  bochecha_esquerda: g => [g.cx + g.esp + 1.6, g.olhoY + 6.2], bochecha_direita: g => [g.cx - g.esp - 1.6, g.olhoY + 6.2],
  olho_esquerdo: g => [g.cx + g.esp + g.rx * 0.9, g.olhoY + g.ry + 1.6], olho_direito: g => [g.cx - g.esp - g.rx * 0.9, g.olhoY + g.ry + 1.6],
  queixo: g => [g.cx + 1.1, g.olhoY + 17.2]
};
export function Pinta14({ pinta, g, sombra }: { pinta?: string; g: Geo; sombra: string }) {
  const f = pinta ? PINTA[pinta] : undefined;
  if (!f) return null;
  const [px, py] = f(g);
  return <circle data-pinta={pinta} cx={px} cy={py} r={0.62} fill={misturar(sombra, '#2a160c', 0.72)} />;
}

/** Os cílios: curvados (três fios curtos no canto de fora) ou alongados (cinco, mais longos), por cima do olho. */
export function Cilios14({ cilios, g }: { cilios?: string; g: Geo }) {
  if (cilios !== 'curvados' && cilios !== 'alongados') return null;
  const n = cilios === 'alongados' ? 5 : 3;
  const comp = cilios === 'alongados' ? 1.7 : 1.1;
  return (
    <g data-cilios={cilios} stroke="#1c1917" strokeLinecap="round" fill="none" strokeWidth={cilios === 'alongados' ? 0.5 : 0.45}>
      {[-1, 1].map(lado => Array.from({ length: n }, (_, k) => {
        // Do meio do olho para o canto de fora, ao longo da pálpebra de cima.
        const a = Math.PI / 2 - (0.25 + (k / Math.max(1, n - 1)) * 1.05) * lado;
        const x0 = g.cx + lado * g.esp + Math.cos(a) * g.rx, y0 = g.olhoY - Math.sin(a) * g.ry;
        const dx = Math.cos(a) * comp + lado * 0.35, dy = -Math.sin(a) * comp - 0.2;
        return <path key={`${lado}${k}`} d={`M ${x0} ${y0} q ${dx * 0.3} ${dy * 0.7} ${dx} ${dy}`} />;
      }))}
    </g>
  );
}
