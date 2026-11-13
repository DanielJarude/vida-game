/**
 * VIDA 18 · o que se vê DE COSTAS: o chapéu de cada modelo e a bolsa.
 *
 * Antes, de costas, todo chapéu era a mesma meia-lua cinza (`#3d4650`) e a bolsa sumia. Agora cada modelo comprado tem a
 * silhueta dele vista por trás, na MESMA cor da frente (as paletas abaixo são as de `Retrato.Chapeu`, na mesma ordem e
 * com a mesma semente — o teste `vida18Visual` confere): o boné mostra a abertura e o fecho de trás (o snapback de
 * plástico do aba reta, a tela do trucker, a fivela do dad hat, o couro com fivela dourada do de grife), a viseira é só a
 * faixa, o bucket e os de aba mostram a aba inteira em volta, o fedora tem o laço do lado esquerdo, a boina cai de lado,
 * o gorro tem o punho canelado e o pompom, a touca de cetim desce em duas caudas, o lenço amarra na nuca, o turbante
 * mostra as voltas e o nó. O cabelo armado (black, cacheado) levanta o chapéu.
 *
 * A bolsa: a mochila cobre as costas (com o bolso e os zíperes); a transversal cruza as costas com a alça e a bolsa
 * aparece no quadril do outro lado; a tote e a clutch ficam na mão (do lado oposto ao da frente: a mão direita vira a
 * esquerda de quem olha); a pochete mostra a fita e a fivela atrás.
 */
import type { ReactElement } from 'react';
import { misturar } from './cores';

type Tipo = 'bone' | 'chapeu' | 'gorro' | 'lenco';

/** As paletas da frente (`Retrato.Chapeu`), por modelo, na mesma ordem. */
export const PALETAS_DO_CHAPEU: Record<string, readonly string[]> = {
  bone_aba_reta: ['#1b1b1d', '#c8102e', '#1d4fa3', '#f2f0ea'],
  bone_trucker: ['#c8102e', '#1d4fa3', '#1b1b1d', '#2f6a4a'],
  bone_dad: ['#c7b59a', '#5d6b4f', '#7b2d3a', '#2d3e5c'],
  bone_grife: ['#1b1b1d'],
  viseira: ['#f2efe8', '#1d4fa3', '#c8102e'],
  bucket: ['#1b1b1d', '#c9b48a', '#2f6a4a', '#e8e2d4'],
  fedora: ['#3b3a40', '#5a4636', '#2e3b4e'],
  boina: ['#7b2d3a', '#1b1b1d', '#5d6b4f', '#2d3e5c'],
  gorro_pompom: ['#c84b31', '#2f4f7a', '#e8e2d4', '#5d6b3a'],
  touca_cetim: ['#1b1b1d', '#5a2a6b', '#7b1e2b', '#c9a14a'],
  chapeu_floppy: ['#e6d3a8'],
  chapeu_palha: ['#d9bd7a'],
  chapeu_panama: ['#efe3c2'],
  chapeu_couro: ['#7a4a26'],
  turbante: ['#c84b31', '#1f5c7a', '#d9a520'],
  bone: ['#2f4f7a', '#8a2f2f', '#2f6a4a', '#1f1f24'],
  chapeu: ['#b89a64', '#5a4636', '#2e2a28'],
  gorro: ['#7a3b3b', '#3b4f7a', '#5d6b3a'],
  lenco: ['#b0543c', '#3c6e8f', '#8f3c6e']
};
/** A cor principal do chapéu (a mesma da frente). */
export function corDoChapeu(tipo: Tipo, modelo: string | undefined, semente: number): string {
  const p = (modelo && PALETAS_DO_CHAPEU[modelo]) || PALETAS_DO_CHAPEU[tipo];
  return p[semente % p.length];
}

/** Quanto a copa sobe acima do cabelo (o aba reta é alto e estruturado; o dad hat, baixo e mole). */
const alt0 = (m: string) => (m === 'bone_aba_reta' ? 3 : m === 'bone_trucker' ? 2.2 : m === 'gorro_pompom' || m === 'gorro' ? 2.4 : m === 'bone_dad' ? 0.4 : 1.2);

const ARMADO = new Set(['black', 'cacheado', 'cacheado_longo', 'shag', 'crespo', 'afro']);

/**
 * O chapéu visto por trás, sobre a cabeça de costas da `Figura` (centro 60, topo do cabelo em ~19,5; largura ~33).
 * `cabelo`: o corte (o volume levanta e alarga o chapéu).
 */
export function ChapeuDeCostas({ tipo, modelo, semente, cabelo }: { tipo: Tipo; modelo?: string; semente: number; cabelo?: string }): ReactElement {
  const armado = !!cabelo && ARMADO.has(cabelo);
  const cx = 60;
  const w = armado ? 40 : 34;
  // O alto do cabelo (de `CabeloDeCostas`: 19,5; o black, 14) e onde a copa assenta, atrás (na altura do alto da orelha).
  const cabeca = armado ? 14 : 19.5;
  const base = armado ? 32 : 33.5;
  const topo = cabeca + 4;
  const hh = 40;
  const c = corDoChapeu(tipo, modelo, semente);
  const e = misturar(c, '#000000', 0.3);
  // A copa: dos lados da cabeça até um pouco acima do alto do cabelo (`alt`: a copa estruturada é mais alta).
  const pico = cabeca - 1 - alt0(modelo ?? tipo);
  const copa = (_alt?: number) => `M ${cx - w / 2 - 1} ${base} C ${cx - w / 2 - 0.6} ${pico - 2} ${cx + w / 2 + 0.6} ${pico - 2} ${cx + w / 2 + 1} ${base} Q ${cx} ${base + 1.6} ${cx - w / 2 - 1} ${base} Z`;
  const idClip = `cc18-${(modelo ?? tipo)}-${semente % 997}`;
  const m = modelo ?? tipo;
  const dados = { 'data-chapeu-costas': m } as Record<string, string>;
  // Bonés: a copa, a abertura de trás (um arco que mostra o cabelo/nuca) e o fecho.
  if (m === 'bone_aba_reta' || m === 'bone_trucker' || m === 'bone_dad' || m === 'bone_grife' || m === 'bone') {
    const alt = 0;
    const corCopa = m === 'bone_trucker' ? c : c;
    return (
      <g {...dados}>
        <path d={copa(alt)} fill={corCopa} stroke={e} strokeWidth={0.6} />
        {m === 'bone_trucker' && <g opacity={0.85}>{/* A tela de trás (o trucker é de tela atrás): a trama em losango, dentro da copa. */}
          <clipPath id={idClip}><path d={copa(alt)} /></clipPath>
          <g clipPath={`url(#${idClip})`}>
            <path d={copa(alt)} fill="#f2efe8" opacity={0.35} />
            {Array.from({ length: 12 }, (_, k) => <path key={k} d={`M ${cx - w / 2 - 6 + k * (w / 8)} ${pico - 3} l ${w / 5} ${base - pico + 4}`} stroke={e} strokeWidth={0.35} opacity={0.7} />)}
            {Array.from({ length: 12 }, (_, k) => <path key={`b${k}`} d={`M ${cx - w / 2 - 6 + k * (w / 8)} ${pico - 3} l ${-w / 5} ${base - pico + 4}`} stroke={e} strokeWidth={0.35} opacity={0.7} />)}
          </g>
        </g>}
        {/* As costuras dos gomos convergindo no botão. */}
        {[-1, 1].map(s => <path key={s} d={`M ${cx} ${pico} Q ${cx + s * w * 0.22} ${pico + 6} ${cx + s * w * 0.3} ${base - 0.5}`} fill="none" stroke={e} strokeWidth={0.4} opacity={0.7} />)}
        <circle cx={cx} cy={pico + 0.4} r={1.2} fill={e} />
        {/* A abertura de trás e o fecho. */}
        <path d={`M ${cx - 5.5} ${base + 0.6} Q ${cx} ${base - 6.5} ${cx + 5.5} ${base + 0.6} Z`} fill="#2a1d14" opacity={0.55} />
        {m === 'bone_aba_reta' && <g><rect x={cx - 6} y={base - 1.4} width={12} height={2.4} rx={1} fill="#1b1b1d" />{[-4, -2, 0, 2, 4].map(dx => <circle key={dx} cx={cx + dx} cy={base - 0.2} r={0.55} fill="#5b5b60" />)}</g>}
        {m === 'bone_dad' && <g><path d={`M ${cx - 6} ${base - 0.2} h 12`} stroke={misturar(c, '#000000', 0.12)} strokeWidth={1.8} strokeLinecap="round" /><rect x={cx + 1.4} y={base - 1.4} width={3} height={2.4} rx={0.4} fill="none" stroke="#c9ccd1" strokeWidth={0.6} /></g>}
        {m === 'bone_grife' && <g><path d={`M ${cx - 6} ${base - 0.2} h 12`} stroke="#3a2418" strokeWidth={1.8} strokeLinecap="round" /><rect x={cx - 1.6} y={base - 1.5} width={3.2} height={2.6} rx={0.5} fill="#d8b45a" /></g>}
        {m === 'bone_trucker' && <g><rect x={cx - 6} y={base - 1.4} width={12} height={2.4} rx={1} fill={e} />{[-4, -2, 0, 2, 4].map(dx => <circle key={dx} cx={cx + dx} cy={base - 0.2} r={0.5} fill="#f2efe8" />)}</g>}
        {m === 'bone' && <path d={`M ${cx - 5} ${base - 0.2} h 10`} stroke={e} strokeWidth={1.6} strokeLinecap="round" />}
        {/* A ponta da aba aparece dos lados (a aba é para a frente). */}
        {m === 'bone_aba_reta' && [-1, 1].map(s => <path key={s} d={`M ${cx + s * (w / 2 + 1)} ${base - 1.2} l ${s * 2.2} 0`} stroke={e} strokeWidth={1.4} />)}
      </g>
    );
  }
  if (m === 'viseira') return (
    <g {...dados}>
      <path d={`M ${cx - w / 2 - 1} ${topo + hh * 0.2} Q ${cx} ${topo + hh * 0.13} ${cx + w / 2 + 1} ${topo + hh * 0.2} L ${cx + w / 2 + 1} ${topo + hh * 0.28} Q ${cx} ${topo + hh * 0.22} ${cx - w / 2 - 1} ${topo + hh * 0.28} Z`} fill={c} stroke={e} strokeWidth={0.5} />
      <rect x={cx - 3.6} y={topo + hh * 0.2} width={7.2} height={2.6} rx={0.6} fill={e} />
    </g>
  );
  if (m === 'bucket') return (
    <g {...dados}>
      <path d={copa(7).replace(/Q [^Z]*Z$/, `L ${cx - w / 2 - 1} ${base} Z`)} fill={c} stroke={e} strokeWidth={0.5} />
      <path d={`M ${cx - w / 2 - 6} ${base + 2.6} Q ${cx} ${base + 6} ${cx + w / 2 + 6} ${base + 2.6} L ${cx + w / 2 + 1} ${base - 1} Q ${cx} ${base + 1} ${cx - w / 2 - 1} ${base - 1} Z`} fill={misturar(c, '#000000', 0.1)} stroke={e} strokeWidth={0.5} />
      <path d={`M ${cx - w / 2 - 3} ${base + 2} Q ${cx} ${base + 4.6} ${cx + w / 2 + 3} ${base + 2}`} fill="none" stroke={misturar(c, '#ffffff', 0.4)} strokeWidth={0.4} strokeDasharray="1 0.8" />
    </g>
  );
  if (m === 'fedora' || m === 'chapeu_panama' || m === 'chapeu' || m === 'chapeu_palha' || m === 'chapeu_floppy') {
    const aba = m === 'chapeu_floppy' ? 18 : m === 'chapeu_palha' ? 15 : m === 'fedora' ? 8 : 10;
    const caida = m === 'chapeu_floppy' ? 5 : m === 'fedora' ? 2.6 : 1.4;
    const fita = m === 'chapeu_palha' ? '#7b2d3a' : m === 'chapeu' ? misturar(c, '#000000', 0.25) : '#1b1b1d';
    const ab = base - 2;
    return (
      <g {...dados}>
        {/* A aba atrás: inteira, com a borda caindo um pouco (no floppy, bem mais). */}
        <path d={`M ${cx - w / 2 - aba} ${ab} Q ${cx - w / 2 - aba / 2} ${ab + caida + 2} ${cx} ${ab + caida + 3} Q ${cx + w / 2 + aba / 2} ${ab + caida + 2} ${cx + w / 2 + aba} ${ab} Q ${cx} ${ab - 3} ${cx - w / 2 - aba} ${ab} Z`} fill={m === 'chapeu' ? misturar(c, '#000000', 0.25) : misturar(c, '#000000', 0.08)} stroke={e} strokeWidth={0.6} />
        <path d={`M ${cx - w / 2 + 3} ${ab} C ${cx - w / 2 + 2} ${topo - (m === 'chapeu_palha' ? 10 : 8)} ${cx + w / 2 - 2} ${topo - (m === 'chapeu_palha' ? 10 : 8)} ${cx + w / 2 - 3} ${ab} Z`} fill={c} stroke={e} strokeWidth={0.6} />
        {m === 'fedora' && <path d={`M ${cx - 6} ${topo - 5.5} Q ${cx} ${topo - 3.4} ${cx + 6} ${topo - 5.5}`} fill="none" stroke={e} strokeWidth={0.6} />}
        <path d={`M ${cx - w / 2 + 3.2} ${ab - 2} L ${cx + w / 2 - 3.2} ${ab - 2}`} stroke={fita} strokeWidth={m === 'chapeu_palha' ? 2.2 : 1.8} />
        {/* O laço da fita, do lado esquerdo (à direita de quem olha por trás). */}
        {(m === 'fedora' || m === 'chapeu_panama' || m === 'chapeu_floppy') && <path d={`M ${cx + w / 2 - 6} ${ab - 2} l 2.4 -1.8 l 0 3.6 Z M ${cx + w / 2 - 6} ${ab - 2} l 2.6 2.6`} fill={fita} stroke={fita} strokeWidth={0.5} />}
        {m === 'chapeu_palha' && <g stroke={misturar(c, '#000000', 0.25)} strokeWidth={0.45} opacity={0.7}>{[-6, -2, 2, 6].map(k => <path key={k} d={`M ${cx + k * 2.4} ${topo - 5} L ${cx + k * 2.6} ${ab - 3}`} />)}{[-1, 1].map(s => <path key={s} d={`M ${cx + s * (w / 2 + 4)} ${ab + 1} L ${cx + s * (w / 2 + 13)} ${ab + 0.4}`} />)}</g>}
      </g>
    );
  }
  if (m === 'chapeu_couro') {
    const ab = base - 2;
    return (
      <g {...dados}>
        {/* A aba do vaqueiro: virada para cima dos dois lados. */}
        <path d={`M ${cx - w / 2 - 12} ${ab - 5} Q ${cx - w / 2 - 6} ${ab + 3} ${cx} ${ab + 3} Q ${cx + w / 2 + 6} ${ab + 3} ${cx + w / 2 + 12} ${ab - 5} Q ${cx + w / 2} ${ab - 1} ${cx} ${ab - 2} Q ${cx - w / 2} ${ab - 1} ${cx - w / 2 - 12} ${ab - 5} Z`} fill={c} stroke={misturar(c, '#000000', 0.45)} strokeWidth={0.7} />
        <path d={`M ${cx - w / 2 + 3} ${ab} C ${cx - w / 2 + 2} ${topo - 11} ${cx + w / 2 - 2} ${topo - 11} ${cx + w / 2 - 3} ${ab} Z`} fill={misturar(c, '#ffffff', 0.08)} stroke={misturar(c, '#000000', 0.45)} strokeWidth={0.7} />
        <path d={`M ${cx - 4} ${topo - 7} Q ${cx} ${topo - 3.6} ${cx + 4} ${topo - 7}`} fill="none" stroke={misturar(c, '#000000', 0.45)} strokeWidth={0.6} />
        <path d={`M ${cx - w / 2 - 9} ${ab - 3} Q ${cx} ${ab + 1.6} ${cx + w / 2 + 9} ${ab - 3}`} fill="none" stroke="#e6d3b0" strokeWidth={0.5} strokeDasharray="1 1" />
      </g>
    );
  }
  if (m === 'boina') return (
    <g {...dados}>
      <path d={`M ${cx - w / 2 - 2} ${base - 3} C ${cx - w / 2 - 6} ${topo - 5} ${cx + w / 2 + 8} ${topo - 8} ${cx + w / 2 + 7} ${base - 6} Q ${cx + w / 2 + 2} ${base - 1} ${cx} ${base - 1} Q ${cx - w / 2} ${base - 1} ${cx - w / 2 - 2} ${base - 3} Z`} fill={c} stroke={e} strokeWidth={0.5} />
      <path d={`M ${cx - w / 2 - 1.5} ${base - 2.6} Q ${cx} ${base + 0.4} ${cx + w / 2 + 4} ${base - 5}`} fill="none" stroke={e} strokeWidth={1.1} />
    </g>
  );
  if (m === 'gorro_pompom' || m === 'gorro') {
    const cuff = misturar(c, '#000000', 0.25);
    return (
      <g {...dados}>
        <path d={copa(9)} fill={c} stroke={e} strokeWidth={0.4} />
        {m === 'gorro_pompom' && [-3, -2, -1, 0, 1, 2, 3].map(k => <path key={k} d={`M ${cx + k * 3.2} ${pico + 2} L ${cx + k * 4.8} ${base - 4}`} stroke={cuff} strokeWidth={0.4} opacity={0.5} />)}
        <rect x={cx - w / 2 - 2} y={base - 5} width={w + 4} height={5.6} rx={2.2} fill={cuff} />
        {[-2, -1, 0, 1, 2].map(k => <path key={`r${k}`} d={`M ${cx + k * 6} ${base - 4.4} l 0 4.2`} stroke={misturar(c, '#000000', 0.42)} strokeWidth={0.5} />)}
        {m === 'gorro_pompom' && <circle cx={cx} cy={pico - 1.6} r={3.6} fill={misturar(c, '#ffffff', 0.35)} stroke={e} strokeWidth={0.4} />}
      </g>
    );
  }
  if (m === 'touca_cetim') return (
    <g {...dados}>
      <path d={copa(5)} fill={c} />
      <path d={`M ${cx - w / 2 + 2} ${topo + 2} Q ${cx} ${topo - 4} ${cx + w / 2 - 2} ${topo + 2}`} fill="none" stroke={misturar(c, '#ffffff', 0.25)} strokeWidth={0.7} opacity={0.6} />
      {/* A cauda larga que desce pela nuca e as duas tiras amarradas. */}
      <path d={`M ${cx - 6} ${base - 1} Q ${cx - 7} ${base + 12} ${cx - 4} ${base + 20} L ${cx + 4} ${base + 20} Q ${cx + 7} ${base + 12} ${cx + 6} ${base - 1} Z`} fill={c} stroke={misturar(c, '#000000', 0.3)} strokeWidth={0.4} />
      {[-1, 1].map(s => <path key={s} d={`M ${cx + s * 3} ${base} q ${s * 5} 8 ${s * 3} 16`} fill="none" stroke={misturar(c, '#ffffff', 0.12)} strokeWidth={1.8} strokeLinecap="round" />)}
    </g>
  );
  if (m === 'turbante') {
    const c2 = ['#f2c200', '#e8862b', '#2f6b4f'][semente % 3];
    return (
      <g {...dados}>
        <path d={`M ${cx - w / 2 - 2} ${base} Q ${cx - w / 2 - 4} ${topo - 14} ${cx} ${topo - 16} Q ${cx + w / 2 + 4} ${topo - 14} ${cx + w / 2 + 2} ${base} Q ${cx} ${base - 4} ${cx - w / 2 - 2} ${base} Z`} fill={c} stroke={e} strokeWidth={0.6} />
        {[0, 1, 2].map(k => <path key={k} d={`M ${cx - w / 2 + k} ${base - 3 - k * 6} Q ${cx} ${base - 12 - k * 6} ${cx + w / 2 - k} ${base - 3 - k * 6}`} fill="none" stroke={e} strokeWidth={0.8} />)}
        {[0, 1, 2, 3].map(k => <circle key={`p${k}`} cx={cx - w / 3 + k * (w / 4.5)} cy={topo - 2 + (k % 2) * 6} r={1.4} fill={c2} />)}
        <path d={`M ${cx - 3} ${base - 2} q 3 -4 6 0 q -3 4 -6 0 Z`} fill={misturar(c, '#000000', 0.15)} stroke={e} strokeWidth={0.5} />
      </g>
    );
  }
  // O lenço: amarrado na nuca, com as duas pontas soltas.
  return (
    <g {...dados}>
      <path d={copa(6)} fill={c} />
      <path d={`M ${cx - 3} ${base - 1} q 3 -3 6 0 q -3 3 -6 0 Z`} fill={e} />
      <path d={`M ${cx - 1.5} ${base} q -4 6 -3 12 l 3 -2 Z M ${cx + 1.5} ${base} q 4 6 3 12 l -3 -2 Z`} fill={c} stroke={e} strokeWidth={0.4} />
    </g>
  );
}

/** Algumas formas cobrem o alto da cabeça e prendem o cabelo de cima (o coque vira rabo baixo, como na frente). */
export const COBRE_O_ALTO_COSTAS: Record<string, string> = { coque: 'rabo', dois_coques: 'meio_preso', moicano: 'curto_lado' };

/* ------------------------------------------------------------------ A bolsa de costas */

interface Geo { cx: number; topo: number; ombro: number; peito: number; cintura: number; quadril: number; yCint: number; yQuad: number; pesc: number }
type Bolsa = { forma: 'transversal' | 'tote' | 'mochila' | 'pochete' | 'clutch'; cor: string; alca?: string; ferragem?: string };

/** A bolsa vista por trás (`lado(g, s, d)` dá o x do lado `s` a `d` do centro, como na frente). */
export function BolsaDeCostas({ g, bolsa, lado }: { g: Geo; bolsa: Bolsa; lado: (s: 1 | -1, d: number) => number }): ReactElement {
  const fer = bolsa.ferragem ?? '#c9ccd1', alca = bolsa.alca ?? misturar(bolsa.cor, '#000000', 0.3), esc = misturar(bolsa.cor, '#000000', 0.3);
  if (bolsa.forma === 'mochila') {
    const x0 = g.cx - g.peito * 0.78, x1 = g.cx + g.peito * 0.78, y0 = g.topo + 4, y1 = g.yCint + 2;
    return (
      <g className="figura__bolsa figura__bolsa--costas" data-acessorio="bolsa" data-forma="mochila" data-vista="costas">
        {([-1, 1] as const).map(s => <path key={s} d={`M ${lado(s, g.pesc + 3)} ${g.topo - 1} Q ${lado(s, g.peito * 0.7)} ${g.topo + 2} ${lado(s, g.peito * 0.72)} ${y0 + 3}`} fill="none" stroke={alca} strokeWidth={2.4} strokeLinecap="round" />)}
        <path d={`M ${x0 + 2} ${y0} Q ${g.cx} ${y0 - 4} ${x1 - 2} ${y0} Q ${x1 + 1} ${(y0 + y1) / 2} ${x1 - 1} ${y1} Q ${g.cx} ${y1 + 3} ${x0 + 1} ${y1} Q ${x0 - 1} ${(y0 + y1) / 2} ${x0 + 2} ${y0} Z`} fill={bolsa.cor} stroke={esc} strokeWidth={0.6} />
        <path d={`M ${x0 + 4} ${y0 + 3} Q ${g.cx} ${y0} ${x1 - 4} ${y0 + 3}`} fill="none" stroke={fer} strokeWidth={0.6} />
        <path d={`M ${x0 + 4} ${(y0 + y1) / 2 + 2} h ${x1 - x0 - 8} v ${(y1 - y0) / 2 - 4} q 0 2 -2 2 h ${-(x1 - x0 - 12)} q -2 0 -2 -2 Z`} fill={misturar(bolsa.cor, '#000000', 0.1)} stroke={esc} strokeWidth={0.5} />
        <path d={`M ${x0 + 5} ${(y0 + y1) / 2 + 4} h ${x1 - x0 - 10}`} stroke={fer} strokeWidth={0.6} />
        <rect x={g.cx - 2.5} y={y0 - 4.6} width={5} height={2.2} rx={1} fill={alca} />
      </g>
    );
  }
  if (bolsa.forma === 'transversal') {
    // Atrás, a alça cruza do ombro esquerdo (à esquerda de quem olha) para o quadril direito.
    const bx = lado(1, g.quadril - 1), by = g.yQuad - 2;
    return (
      <g className="figura__bolsa figura__bolsa--costas" data-acessorio="bolsa" data-forma="transversal" data-vista="costas">
        <path d={`M ${lado(-1, g.ombro - 3)} ${g.topo + 1} L ${bx - 3} ${by - 4}`} stroke={alca} strokeWidth={1.3} strokeLinecap="round" />
        <rect x={bx - 6} y={by - 4.5} width={12} height={9} rx={1.8} fill={bolsa.cor} stroke={esc} strokeWidth={0.5} />
        <path d={`M ${bx - 5} ${by + 2} h 10`} stroke={esc} strokeWidth={0.5} opacity={0.6} />
      </g>
    );
  }
  if (bolsa.forma === 'pochete') return (
    <g className="figura__bolsa figura__bolsa--costas" data-acessorio="bolsa" data-forma="pochete" data-vista="costas">
      <path d={`M ${lado(-1, g.cintura + 1)} ${g.yCint + 3} Q ${g.cx} ${g.yCint + 4.6} ${lado(1, g.cintura + 1)} ${g.yCint + 3}`} fill="none" stroke={alca} strokeWidth={1.4} />
      <rect x={g.cx - 2.2} y={g.yCint + 2.4} width={4.4} height={2.6} rx={0.6} fill={fer} />
    </g>
  );
  // Tote e clutch: na mão — de costas, a mão que segurava à direita de quem olha passa para a esquerda.
  const m = { x: lado(-1, g.ombro + 2.7), y: bolsa.forma === 'tote' ? 146 : 144 };
  if (bolsa.forma === 'tote') return (
    <g className="figura__bolsa figura__bolsa--costas" data-acessorio="bolsa" data-forma="tote" data-vista="costas">
      <path d={`M ${m.x - 3.6} ${m.y + 2} Q ${m.x} ${m.y - 5} ${m.x + 3.6} ${m.y + 2}`} fill="none" stroke={alca} strokeWidth={1} />
      <path d={`M ${m.x - 8} ${m.y + 2} L ${m.x + 8} ${m.y + 2} L ${m.x + 7} ${m.y + 18} L ${m.x - 7} ${m.y + 18} Z`} fill={bolsa.cor} stroke={esc} strokeWidth={0.5} />
    </g>
  );
  return (
    <g className="figura__bolsa figura__bolsa--costas" data-acessorio="bolsa" data-forma="clutch" data-vista="costas">
      <rect x={m.x - 6.5} y={m.y - 1.5} width={13} height={7} rx={1.4} fill={bolsa.cor} stroke={esc} strokeWidth={0.5} />
    </g>
  );
}
