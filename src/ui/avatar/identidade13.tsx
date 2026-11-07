/**
 * VIDA 13 — IDENTIDADE VISUAL NO DESENHO: a maquiagem (a sombra, o delineado, o blush, o batom), as mechas (luzes,
 * ombré, uma na frente), a nuca de costas de cada corte e as contas que a seção de piercings usa (o cabelo cobre a
 * orelha? há bigode por cima do lábio? onde fica cada zona do rosto na figura). Tudo na geometria do retrato (`Retrato`)
 * — este módulo só desenha o que o retrato mede.
 */
import type { ReactElement, ReactNode } from 'react';
import type { Genero, Visual } from '../../motor/tipos';
import { BLUSHES_13, CORES_DE_BATOM_13, CORES_DE_SOMBRA_13 } from '../../motor/dados/aparencia13';
import { misturar } from './cores';

/* -------------------------------------------------------------- Maquiagem */

export interface GeoOlhos { cx: number; olhoY: number; esp: number; olho: number; rx: number; ry: number }

/** A sombra: a pálpebra de cima pintada (vai ANTES dos olhos: o branco do olho fica por cima da parte de baixo). */
export function SombraDosOlhos({ cor, g }: { cor?: string; g: GeoOlhos }) {
  const c = cor ? CORES_DE_SOMBRA_13[cor]?.[1] : undefined;
  if (!c) return null;
  return (
    <g className="retrato__maquiagem" data-maquiagem="sombra" fill={c} opacity={cor === 'esfumado' ? 0.62 : 0.52}>
      {[-1, 1].map(l => <ellipse key={l} cx={g.cx + l * (g.esp + g.olho * 0.15)} cy={g.olhoY - g.ry * 0.55} rx={g.rx * 1.3} ry={g.ry * 1.25} />)}
    </g>
  );
}
/** O delineado: a linha da pálpebra de cima; o gatinho puxa a ponta para fora e para cima; o carregado contorna o olho. */
export function Delineado({ tipo, g }: { tipo?: string; g: GeoOlhos }) {
  if (!tipo) return null;
  const traco = tipo === 'carregado' ? 0.85 : 0.6;
  return (
    <g className="retrato__maquiagem" data-maquiagem={`delineado-${tipo}`} fill="none" stroke="#151214" strokeLinecap="round" strokeLinejoin="round">
      {[-1, 1].map(l => {
        const x = g.cx + l * g.esp;
        const fora = x + l * g.rx, dentro = x - l * g.rx;
        const cima = `M ${dentro} ${g.olhoY} Q ${x} ${g.olhoY - g.ry * 1.55} ${fora} ${g.olhoY - 0.1}`;
        return (
          <g key={l}>
            <path d={cima} strokeWidth={traco} />
            {tipo === 'gatinho' && <path d={`M ${fora - l * 0.4} ${g.olhoY - 0.35} L ${fora + l * 1.7} ${g.olhoY - 1.5}`} strokeWidth={0.7} />}
            {tipo === 'carregado' && <><path d={`M ${dentro} ${g.olhoY} Q ${x} ${g.olhoY + g.ry * 1.35} ${fora} ${g.olhoY - 0.1}`} strokeWidth={0.55} /><path d={`M ${fora} ${g.olhoY - 0.1} L ${fora + l * 1.1} ${g.olhoY - 0.8}`} strokeWidth={0.6} /></>}
          </g>
        );
      })}
    </g>
  );
}
/** O blush: as maçãs do rosto. */
export function Blush({ cor, g }: { cor?: string; g: GeoOlhos }) {
  const c = cor ? BLUSHES_13[cor]?.[1] : undefined;
  if (!c) return null;
  return <g className="retrato__maquiagem" data-maquiagem="blush" fill={c} opacity={0.38}>{[-1, 1].map(l => <ellipse key={l} cx={g.cx + l * (g.esp + 1.2)} cy={g.olhoY + 6.6} rx={3.3} ry={1.9} />)}</g>;
}
/** O batom: os dois lábios pintados, com a linha da boca por cima (a expressão continua lá: a curva é a mesma). */
export function Batom({ cor, cx, cantos, larg, curva, cheia }: { cor?: string; cx: number; cantos: number; larg: number; curva: number; cheia?: boolean }) {
  const c = cor ? CORES_DE_BATOM_13[cor]?.[1] : undefined;
  if (!c) return null;
  const L = larg;
  const meio = cantos + curva / 2;
  // O lábio de baixo acompanha o meio da boca (o sorriso desce o meio; o lábio não engorda com ele).
  const baixo = Math.max(meio, cantos) + (cheia ? 1.9 : 1.45);
  const d = `M ${cx - L} ${cantos} Q ${cx - L * 0.55} ${meio - 1.5} ${cx - L * 0.12} ${meio - 1.1} Q ${cx} ${meio - 0.75} ${cx + L * 0.12} ${meio - 1.1} Q ${cx + L * 0.55} ${meio - 1.5} ${cx + L} ${cantos} Q ${cx + L * 0.5} ${baixo} ${cx} ${baixo} Q ${cx - L * 0.5} ${baixo} ${cx - L} ${cantos} Z`;
  return (
    <g className="retrato__maquiagem" data-maquiagem="batom">
      <path d={d} fill={c} />
      <path d={`M ${cx - L} ${cantos} Q ${cx} ${cantos + curva} ${cx + L} ${cantos}`} fill="none" stroke={misturar(c, '#000000', 0.4)} strokeWidth={0.55} strokeLinecap="round" />
      <ellipse cx={cx - L * 0.25} cy={(meio + baixo) / 2 + 0.3} rx={L * 0.22} ry={0.3} fill="#ffffff" opacity={0.3} />
    </g>
  );
}

/* ----------------------------------------------------------------- Mechas */

/**
 * As mechas por cima do cabelo: uma máscara com a forma do cabelo (o mesmo desenho, em branco) recorta as luzes, o
 * ombré ou a mecha da frente — servem a qualquer corte, de qualquer comprimento, sem desenho por corte.
 */
export function Mechas({ id, forma, cor, estilo, cx, cy, w, hh }: { id: string; forma: ReactNode; cor: string; estilo?: string; cx: number; cy: number; w: number; hh: number }) {
  const topo = cy - hh * 0.62;
  let tinta: ReactElement;
  if (estilo === 'ombre') {
    tinta = (
      <>
        <defs><linearGradient id={`${id}-g`} x1="0" y1={cy - hh * 0.36} x2="0" y2={cy + 16} gradientUnits="userSpaceOnUse"><stop offset="0" stopColor={cor} stopOpacity={0} /><stop offset="1" stopColor={cor} stopOpacity={0.95} /></linearGradient></defs>
        <rect x={cx - 50} y={topo - 10} width={100} height={110} fill={`url(#${id}-g)`} />
      </>
    );
  } else if (estilo === 'frente') {
    tinta = <path d={`M ${cx - w * 0.22} ${topo} Q ${cx - w * 0.36} ${cy - hh * 0.25} ${cx - w * 0.56} ${cy + 4} L ${cx - w * 0.7} ${cy + 40}`} fill="none" stroke={cor} strokeWidth={3.4} strokeLinecap="round" opacity={0.95} />;
  } else {
    tinta = (
      <g fill="none" stroke={cor} strokeWidth={0.95} strokeLinecap="round" opacity={0.85}>
        {Array.from({ length: 9 }, (_, k) => { const x = cx - w * 0.85 + (k * w * 1.7) / 8; const d = (x - cx) * 0.18; return <path key={k} d={`M ${(cx + (x - cx) * 0.3).toFixed(2)} ${topo} Q ${(x + d).toFixed(2)} ${(cy - hh * 0.15).toFixed(2)} ${(x + d * 1.6).toFixed(2)} ${cy + 42}`} />; })}
      </g>
    );
  }
  return (
    <g className="retrato__mechas" data-mechas={estilo ?? 'luzes'}>
      <defs><mask id={id} maskUnits="userSpaceOnUse" x={0} y={0} width={100} height={110}>{forma}</mask></defs>
      <g mask={`url(#${id})`}>{tinta}</g>
    </g>
  );
}

/* ------------------------------------------------------- Contas da seção */

/** Os cortes que deixam a orelha à mostra (o resto cobre o alto da orelha, onde ficam os furos de cartilagem). */
const ORELHA_LIVRE = new Set(['raspado', 'curto', 'curto_lado', 'topete', 'pixie', 'crespo_curto', 'degrade', 'moicano', 'undercut', 'raspado_lado', 'mullet', 'rabo', 'coque', 'dois_coques', 'calvo']);
export const cabeloCobreOrelha = (cabelo: string) => !ORELHA_LIVRE.has(cabelo);

/** Há bigode por cima do lábio (o medusa some debaixo dele)? */
const SO_BIGODE = new Set(['bigode', 'bigodao', 'bigode_fino', 'bigode_guidao', 'ferradura', 'van_dyke']);
export function temBigode(v: Visual, genero: Genero, idade: number): boolean {
  if (genero === 'feminino' || idade < 16 || !v.barba || v.barba === 'por_fazer' || v.barba === 'mosca') return false;
  return SO_BIGODE.has(v.barba) || v.bigode !== false;
}

/** As zonas do rosto na figura de corpo inteiro (a cabeça é o retrato deslocado: x + 10, y − 8), na moldura 3 : 4. */
export type ZonaDoRosto = 'rosto' | 'orelha' | 'nariz' | 'sobrancelha' | 'boca';
export function focoDoRosto(zona: ZonaDoRosto, idade: number): { x: number; y: number; w: number; h: number } {
  // O olho do retrato: o adulto em y 43 (o adolescente e o idoso, meio ponto abaixo) → na figura, 35.
  const oy = (idade <= 17 || idade >= 65 ? 44.5 : 43) - 8;
  const caixa: Record<ZonaDoRosto, [number, number, number]> = {
    rosto: [60, oy + 2, 52], orelha: [77, oy + 2.6, 15], nariz: [60, oy + 5, 18], sobrancelha: [65, oy - 2.5, 18], boca: [60, oy + 11, 18]
  };
  const [cx, cy, w] = caixa[zona];
  const h = w / 0.75;
  return { x: +(cx - w / 2).toFixed(2), y: +(cy - h / 2).toFixed(2), w, h: +h.toFixed(2) };
}

/* ------------------------------------------------------------ De costas */

/** O comprimento de cada corte visto de trás (a nuca): curto, até o queixo, até o ombro, comprido; e o que fica preso. */
const COMPRIMENTO: Record<string, number> = {
  raspado: 0, calvo: 0, curto: 1, curto_lado: 1, topete: 1, pixie: 1, crespo_curto: 1, degrade: 1, moicano: 1, undercut: 1, ondulado: 2, cacheado: 2, black: 2,
  chanel: 2, bob_franja: 2, raspado_lado: 2, shag: 3, mullet: 3, longo_liso: 4, longo_ondulado: 4, cacheado_longo: 4, longo_franja: 4, meio_preso: 4, trancas: 4, locs: 4
};
/**
 * A cabeça de costas na figura de corpo inteiro: a nuca e o cabelo com o comprimento e o volume do corte (o black é
 * redondo; tranças e locs em cordões; rabo, coque, os dois coques e a maria-chiquinha presos). Antes, só "curto" ou
 * "longo".
 */
export function CabeloDeCostas({ cabelo, cor, mechas }: { cabelo: string; cor: string; mechas?: string }): ReactElement | null {
  if (cabelo === 'raspado' || cabelo === 'calvo') return <path d="M 44 38 Q 44 20.5 60 20 Q 76 20.5 76 38 Q 70 44 60 44 Q 50 44 44 38 Z" fill={cor} opacity={0.55} />;
  const escuro = misturar(cor, '#000000', 0.22);
  const n = COMPRIMENTO[cabelo] ?? 1;
  const fim = [52, 54, 60, 68, 76][n];
  const larg = cabelo === 'black' ? 23 : cabelo === 'cacheado' || cabelo === 'cacheado_longo' || cabelo === 'shag' ? 19.5 : 17.5;
  const base = n === 0 || n === 1
    ? `M 43.5 40 Q 43 20 60 19.5 Q 77 20 76.5 40 Q 76 ${fim} 60 ${fim + 2} Q 44 ${fim} 43.5 40 Z`
    : `M ${60 - larg} 40 Q ${60 - larg + 0.5} 17 60 ${cabelo === 'black' ? 14 : 18.5} Q ${60 + larg - 0.5} 17 ${60 + larg} 40 Q ${60 + larg + 0.5} ${fim - 6} ${60 + larg - 3} ${fim} Q 60 ${fim + 3} ${60 - larg + 3} ${fim} Q ${60 - larg - 0.5} ${fim - 6} ${60 - larg} 40 Z`;
  const presos: ReactNode[] = [];
  if (cabelo === 'rabo') presos.push(<path key="r" d="M 57.5 42 Q 56 58 60 66 Q 64 58 62.5 42 Z" fill={escuro} />);
  if (cabelo === 'coque' || cabelo === 'meio_preso') presos.push(<circle key="c" cx={60} cy={cabelo === 'coque' ? 33 : 26} r={cabelo === 'coque' ? 6 : 4.4} fill={escuro} />);
  if (cabelo === 'dois_coques') presos.push(<circle key="a" cx={51} cy={24} r={5} fill={escuro} />, <circle key="b" cx={69} cy={24} r={5} fill={escuro} />);
  if (cabelo === 'maria_chiquinha') presos.push(<path key="e" d="M 46 40 Q 40 52 44 62 Q 48 52 49 42 Z" fill={escuro} />, <path key="d" d="M 74 40 Q 80 52 76 62 Q 72 52 71 42 Z" fill={escuro} />);
  if (cabelo === 'moicano') presos.push(<path key="m" d="M 56.5 19.5 L 58 13 L 60 16 L 62 13 L 63.5 19.5 L 63 44 L 57 44 Z" fill={cor} />);
  const cordoes = cabelo === 'trancas' || cabelo === 'locs';
  const solto = !['rabo', 'coque', 'dois_coques', 'maria_chiquinha', 'moicano', 'undercut', 'degrade'].includes(cabelo);
  return (
    <g data-costas={cabelo}>
      <path d={solto ? base : 'M 44 39 Q 43.5 20 60 19.5 Q 76.5 20 76 39 Q 70 44 60 44 Q 50 44 44 39 Z'} fill={cor} opacity={cabelo === 'moicano' || cabelo === 'undercut' || cabelo === 'degrade' ? 0.5 : 1} />
      {cordoes && <g stroke={escuro} strokeWidth={0.8} opacity={0.7}>{[-12, -7, -2.5, 2.5, 7, 12].map(dx => <path key={dx} d={`M ${60 + dx * 0.8} 26 L ${60 + dx} ${fim - 1}`} />)}</g>}
      {cabelo === 'mullet' && <path d={`M 49 44 Q 48 56 52 ${fim} L 68 ${fim} Q 72 56 71 44 Z`} fill={escuro} />}
      {mechas && solto && <g stroke={mechas} strokeWidth={1} opacity={0.75} fill="none">{[-8, -3, 3, 8].map(dx => <path key={dx} d={`M ${60 + dx * 0.6} 24 Q ${60 + dx} 40 ${60 + dx * 1.1} ${fim - 2}`} />)}</g>}
      {presos}
    </g>
  );
}
