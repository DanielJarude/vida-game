/**
 * OS CABELOS do retrato (FIX pós-playtest humano — redesenho). Princípio: o corte é reconhecível ANTES de ler o nome.
 * Cada um tem uma silhueta própria (o que sai da cabeça: volume, comprimento, franja, linha do cabelo), não uma calota
 * com outra espessura:
 *
 *   raspado (rente, a pele aparece) · curto (topo texturizado, costeleta) · curto_lado (risca e franja varrida) ·
 *   topete (volume alto na frente, laterais baixas) · ondulado (até a orelha, ondas) · crespo_curto (alto e redondo,
 *   laterais rentes) · cacheado (cachos em volta da cabeça) · black (a coroa grande e redonda) · locs (cordões grossos
 *   até o ombro) · tranças (duas tranças trançadas, com o elástico) · longo_liso (risca no meio, painéis retos até o
 *   peito) · longo_ondulado (risca de lado, ondas) · cacheado_longo (cachos emoldurando o rosto) · chanel (franja reta,
 *   corte reto no queixo) · pixie (curtinho, franja longa de lado) · rabo (puxado para trás, o rabo aparecendo) ·
 *   coque (o coque alto).
 *
 * A linha do cabelo é herdada (`linhaCabelo`: reta, em bico, alta) e muda a testa de todos os cortes; a calvície
 * herdada desenha as entradas e, depois, a coroa (`Entradas`). Criança usa a versão curta dos cortes longos.
 */
import { misturar } from './cores';
export { estagioDaCalvicie } from '../../motor/sistemas/identidade';

export type Fase = 'bebe' | 'crianca' | 'pre' | 'adol' | 'adulto' | 'meia' | 'idoso';
export interface CabeloProps { estilo: string; cor: string; cx: number; cy: number; w: number; hh: number; fase: Fase; linha?: string }

/** A calota (o cabelo que cobre o crânio) com a linha da testa: `testa` sobe a linha, `franja` desce o meio. */
export function calota(cx: number, cy: number, w: number, hh: number, o: { volume?: number; testa?: number; franja?: number; lado?: number; temporas?: number; linha?: string }) {
  const vol = o.volume ?? 1.5;
  const extra = o.linha === 'alta' ? 0.05 : 0;
  const testaY = cy - hh * ((o.testa ?? 0.22) + extra);
  const tempY = cy + (o.temporas ?? -hh * 0.02);
  const L = cx - w / 2 - vol * 0.6;
  const R = cx + w / 2 + vol * 0.6;
  const topoY = cy - hh * 0.5 - vol;
  const lado = o.lado ?? 0;
  const franja = (o.franja ?? 3) + (o.linha === 'bico' ? 2.2 : 0);
  return `M ${L} ${tempY}
    C ${L - 0.5} ${topoY + hh * 0.08} ${cx - w * 0.3} ${topoY} ${cx} ${topoY}
    C ${cx + w * 0.3} ${topoY} ${R + 0.5} ${topoY + hh * 0.08} ${R} ${tempY}
    C ${R - 1.8} ${testaY + 2} ${cx + w * 0.25 + lado} ${testaY - 1} ${cx + lado * 2} ${testaY + franja}
    C ${cx - w * 0.25 + lado} ${testaY - 1} ${L + 1.8} ${testaY + 2} ${L} ${tempY} Z`;
}

const curtoNaInfancia = (f: Fase) => f === 'crianca' || f === 'pre';

/** Cachos: anéis de círculos (o contorno do cacheado). `cheio`: a coroa toda; `frente`: só a parte de cima. */
export function Cachos({ cx, cy, rx, ry, cor, n, r, cheio, frente }: { cx: number; cy: number; rx: number; ry: number; cor: string; n: number; r: number; cheio?: boolean; frente?: boolean }) {
  const pts = Array.from({ length: n }, (_, k) => {
    const ang = cheio ? (k / n) * Math.PI * 2 : Math.PI + (k / (n - 1)) * Math.PI;
    return [cx + Math.cos(ang) * rx, cy + Math.sin(ang) * ry * (cheio ? 1 : 1.05)];
  });
  return (
    <g fill={cor}>
      {cheio && <ellipse cx={cx} cy={cy} rx={rx} ry={ry} />}
      {!cheio && !frente && <path d={`M ${cx - rx} ${cy + ry * 0.6} Q ${cx - rx - 2} ${cy - ry} ${cx} ${cy - ry} Q ${cx + rx + 2} ${cy - ry} ${cx + rx} ${cy + ry * 0.6} Z`} />}
      {pts.filter(([, y]) => !frente || y < cy - ry * 0.35).map(([x, y], k) => <circle key={k} cx={x} cy={y} r={r * (0.85 + (k % 3) * 0.1)} />)}
    </g>
  );
}

/** Uma coluna de cachos (os que emolduram o rosto). */
function ColunaDeCachos({ x, y0, y1, r, cor, lado }: { x: number; y0: number; y1: number; r: number; cor: string; lado: number }) {
  const n = Math.max(2, Math.round((y1 - y0) / (r * 1.5)));
  return <g fill={cor}>{Array.from({ length: n }, (_, k) => <circle key={k} cx={x + lado * ((k % 2) * 1.6)} cy={y0 + (k * (y1 - y0)) / (n - 1)} r={r * (0.9 + (k % 3) * 0.08)} />)}</g>;
}

/** Uma trança (gomos alternados) de (x, y0) até y1, com o elástico na ponta. */
function Tranca({ x, y0, y1, cor, escuro, larg = 3.2 }: { x: number; y0: number; y1: number; cor: string; escuro: string; larg?: number }) {
  const n = Math.max(3, Math.round((y1 - y0) / 3.6));
  const passo = (y1 - y0) / n;
  return (
    <g>
      {Array.from({ length: n }, (_, k) => (
        <ellipse key={k} cx={x + (k % 2 ? 0.9 : -0.9)} cy={y0 + passo * (k + 0.5)} rx={larg} ry={passo * 0.75} fill={k % 2 ? cor : escuro} transform={`rotate(${k % 2 ? 18 : -18} ${x} ${y0 + passo * (k + 0.5)})`} />
      ))}
      <rect x={x - larg * 0.7} y={y1 - 0.4} width={larg * 1.4} height={1.6} rx={0.6} fill="#c04a5a" />
      <path d={`M ${x - larg * 0.6} ${y1 + 1.2} L ${x} ${y1 + 5} L ${x + larg * 0.6} ${y1 + 1.2} Z`} fill={cor} />
    </g>
  );
}

/** Um cordão (loc): grosso, com as marcas de textura. */
function Loc({ x, y0, y1, cor, escuro, curva = 0 }: { x: number; y0: number; y1: number; cor: string; escuro: string; curva?: number }) {
  return (
    <g>
      <path d={`M ${x} ${y0} Q ${x + curva} ${(y0 + y1) / 2} ${x + curva * 0.4} ${y1}`} stroke={cor} strokeWidth={3.4} strokeLinecap="round" fill="none" />
      {Array.from({ length: Math.max(2, Math.floor((y1 - y0) / 5)) }, (_, k) => {
        const t = (k + 1) / (Math.floor((y1 - y0) / 5) + 1);
        const yy = y0 + (y1 - y0) * t;
        const xx = x + curva * 2 * t * (1 - t) + curva * 0.4 * t * t;
        return <path key={k} d={`M ${xx - 1.5} ${yy} l 3 0.8`} stroke={escuro} strokeWidth={0.6} />;
      })}
    </g>
  );
}

/** O que fica ATRÁS da cabeça e do corpo (o comprimento, o volume de trás). */
export function CabeloAtras({ estilo, cor, cx, cy, w, hh, fase }: CabeloProps) {
  const escuro = misturar(cor, '#000000', 0.18);
  const topo = cy - hh / 2;
  const curto = curtoNaInfancia(fase);
  const L = cx - w / 2, R = cx + w / 2;
  const cortina = (baixo: number, ondas: boolean, aberta = 0) => {
    const b = Math.min(99, baixo);
    if (!ondas) return `M ${L - 3} ${cy - 4} C ${L - 4} ${topo - 2} ${R + 4} ${topo - 2} ${R + 3} ${cy - 4} L ${R + 4 + aberta} ${b} Q ${cx} ${b + 2} ${L - 4 - aberta} ${b} Z`;
    return `M ${L - 3} ${cy - 4} C ${L - 4} ${topo - 2} ${R + 4} ${topo - 2} ${R + 3} ${cy - 4}
      Q ${R + 8} ${cy + 8} ${R + 4} ${cy + 16} Q ${R + 9} ${cy + 26} ${R + 5} ${b}
      Q ${cx} ${b + 4} ${L - 5} ${b} Q ${L - 9} ${cy + 26} ${L - 4} ${cy + 16} Q ${L - 8} ${cy + 8} ${L - 3} ${cy - 4} Z`;
  };
  switch (estilo) {
    case 'longo_liso': return <path d={cortina(curto ? cy + 20 : cy + 42, false, 1)} fill={escuro} />;
    case 'longo_ondulado': return <path d={cortina(curto ? cy + 20 : cy + 40, true)} fill={escuro} />;
    case 'chanel':
      // O corte reto no queixo, levemente mais aberto embaixo (o "A" do chanel).
      return <path d={`M ${L - 3} ${cy - 4} C ${L - 4} ${topo - 3} ${R + 4} ${topo - 3} ${R + 3} ${cy - 4} L ${R + 5} ${cy + hh * 0.44} L ${L - 5} ${cy + hh * 0.44} Z`} fill={escuro} />;
    case 'ondulado':
      return <path d={`M ${L - 2} ${cy - 2} C ${L - 3} ${topo} ${R + 3} ${topo} ${R + 2} ${cy - 2} Q ${R + 5} ${cy + 4} ${R + 2} ${cy + 9} Q ${cx} ${cy + 12} ${L - 2} ${cy + 9} Q ${L - 5} ${cy + 4} ${L - 2} ${cy - 2} Z`} fill={escuro} />;
    case 'cacheado': return <Cachos cx={cx} cy={cy - 1} rx={w / 2 + 5} ry={hh / 2 + 4} cor={escuro} n={18} r={4.6} />;
    case 'cacheado_longo': return <Cachos cx={cx} cy={cy + (curto ? 4 : 10)} rx={w / 2 + 10} ry={hh / 2 + (curto ? 6 : 13)} cor={escuro} n={22} r={6.2} />;
    case 'black': return <Cachos cx={cx} cy={cy - 5} rx={w / 2 + 11} ry={hh / 2 + 9} cor={escuro} n={24} r={6.6} cheio />;
    case 'locs': {
      const fim = curto ? cy + 16 : cy + 34;
      return <g>{[-5, -3.5, -2, 2, 3.5, 5].map(k => <Loc key={k} x={cx + k * (w / 11)} y0={topo + 2} y1={fim - Math.abs(k) * 0.8} cor={escuro} escuro={misturar(escuro, '#000000', 0.25)} curva={k * 0.5} />)}</g>;
    }
    case 'rabo':
      // O rabo aparece atrás, do lado direito: sai do alto da nuca e cai até o ombro.
      return (
        <g>
          <path d={`M ${R - 3} ${topo + 4} C ${R + 9} ${topo + 4} ${R + 10} ${cy + 6} ${R + 6} ${cy + (curto ? 16 : 26)} C ${R + 3} ${cy + (curto ? 20 : 30)} ${R} ${cy + 18} ${R + 1} ${cy + 4} C ${R + 2} ${topo + 12} ${R - 2} ${topo + 8} ${R - 3} ${topo + 4} Z`} fill={escuro} />
          <rect x={R - 1} y={topo + 3} width={4} height={3.2} rx={1.2} fill="#7a3e5a" transform={`rotate(25 ${R + 1} ${topo + 4.6})`} />
        </g>
      );
    case 'coque':
      return (
        <g>
          <circle cx={cx} cy={topo - 5.5} r={8} fill={cor} />
          <path d={`M ${cx - 5.5} ${topo - 7} Q ${cx} ${topo - 12.5} ${cx + 5.5} ${topo - 7} M ${cx - 6} ${topo - 3.5} Q ${cx} ${topo - 9} ${cx + 6} ${topo - 3.5}`} stroke={escuro} strokeWidth={0.8} fill="none" />
        </g>
      );
    default: return null;
  }
}

/** O que fica NA FRENTE (a calota, a franja, as mechas laterais). */
export function CabeloFrente({ estilo, cor, cx, cy, w, hh, fase, linha }: CabeloProps) {
  const brilho = misturar(cor, '#ffffff', 0.14);
  const escuro = misturar(cor, '#000000', 0.22);
  const topo = cy - hh / 2;
  const L = cx - w / 2, R = cx + w / 2;
  const curto = curtoNaInfancia(fase);
  const testaY = cy - hh * (0.22 + (linha === 'alta' ? 0.05 : 0));
  const cal = (o: Parameters<typeof calota>[4]) => calota(cx, cy, w, hh, { linha, ...o });
  switch (estilo) {
    case 'bebe':
      return (
        <g fill="none" stroke={cor} strokeLinecap="round" opacity={0.85}>
          <path d={`M ${cx - 3} ${topo + 2} q 3 -5 6 -1`} strokeWidth={1.6} />
          <path d={`M ${cx + 1} ${topo + 1.5} q 3 -4 5 0`} strokeWidth={1.3} />
          <path d={calota(cx, cy, w * 0.92, hh, { volume: -0.5, testa: 0.36, franja: 0 })} fill={cor} stroke="none" opacity={0.18} />
        </g>
      );
    case 'raspado':
      // Rente: a forma do crânio, a pele aparecendo por baixo, a linha do cabelo marcada.
      return (
        <g>
          <path d={cal({ volume: 0.3, testa: 0.27, franja: 0.6, temporas: -hh * 0.07 })} fill={cor} opacity={0.6} stroke={escuro} strokeWidth={0.5} strokeOpacity={0.45} />
        </g>
      );
    case 'curto':
      // Topo com textura (as pontas), laterais curtas e a costeleta.
      return (
        <g fill={cor}>
          <path d={cal({ volume: 2.2, testa: 0.24, franja: 2 })} />
          <path d={`M ${cx - w * 0.36} ${topo - 0.8} l 2 -2.6 l 2 2.2 l 2.4 -3 l 2.2 2.6 l 2.6 -3.2 l 2.4 2.8 l 2.4 -2.6 l 2.2 2.4 l 2.2 -2 l 1.6 2.2 Z`} />
          <rect x={L - 0.6} y={cy - 4} width={2.2} height={6} rx={1} />
          <rect x={R - 1.6} y={cy - 4} width={2.2} height={6} rx={1} />
        </g>
      );
    case 'curto_lado':
      // A risca do lado esquerdo e a franja varrida para a direita.
      return (
        <g>
          <path d={cal({ volume: 2.8, testa: 0.24, franja: 1, lado: -5 })} fill={cor} />
          <path d={`M ${cx - 8} ${testaY - 1.5} Q ${cx + 4} ${testaY - 5} ${R + 0.5} ${testaY + 6} L ${R - 2.5} ${testaY + 2.5} Q ${cx + 2} ${testaY + 1.5} ${cx - 8} ${testaY + 2.2} Z`} fill={cor} />
          <path d={`M ${cx - 7.5} ${topo - 1.6} L ${cx - 9} ${testaY + 1}`} stroke={misturar(cor, '#000000', 0.45)} strokeWidth={0.9} />
          <path d={`M ${cx - 3} ${topo + 0.5} q 8 1 13 8`} stroke={brilho} strokeWidth={0.8} fill="none" opacity={0.6} />
        </g>
      );
    case 'topete':
      // Laterais baixas; o volume levantado na frente.
      return (
        <g fill={cor}>
          <path d={cal({ volume: 1.2, testa: 0.25, franja: 0.5, temporas: -hh * 0.05 })} />
          <path d={`M ${cx - w * 0.33} ${testaY + 1.5} C ${cx - w * 0.4} ${topo - 9} ${cx + w * 0.28} ${topo - 12} ${cx + w * 0.38} ${topo - 1}
            C ${cx + w * 0.22} ${testaY - 2} ${cx - w * 0.05} ${testaY - 2.5} ${cx - w * 0.33} ${testaY + 1.5} Z`} />
          <path d={`M ${cx - w * 0.22} ${topo - 3} Q ${cx} ${topo - 9.5} ${cx + w * 0.26} ${topo - 3}`} stroke={brilho} strokeWidth={0.9} fill="none" opacity={0.65} />
        </g>
      );
    case 'ondulado':
      // Até a orelha, com as ondas aparecendo nas mechas laterais e na franja.
      return (
        <g fill={cor}>
          <path d={cal({ volume: 3.2, testa: 0.2, franja: 4.5, lado: 3 })} />
          <path d={`M ${L - 1.8} ${cy - 5} q -3 5 0 9 q -2.5 3 0.5 6 q 2.6 -4 1.6 -8 q 2 -3 0.6 -7 Z M ${R + 1.8} ${cy - 5} q 3 5 0 9 q 2.5 3 -0.5 6 q -2.6 -4 -1.6 -8 q -2 -3 -0.6 -7 Z`} />
          <path d={`M ${cx - 6} ${testaY + 1} q 3 3 6 0 q 3 -3 6 0`} stroke={escuro} strokeWidth={0.7} fill="none" opacity={0.6} />
        </g>
      );
    case 'crespo_curto':
      // Alto e redondo em cima; laterais rentes (o degradê).
      return (
        <g fill={cor}>
          <path d={cal({ volume: 0.5, testa: 0.24, franja: 0.4, temporas: -hh * 0.1 })} opacity={0.6} />
          <path d={`M ${L + 2} ${testaY + 1} C ${L + 1} ${topo - 9} ${R - 1} ${topo - 9} ${R - 2} ${testaY + 1} Q ${cx} ${testaY - 1.5} ${L + 2} ${testaY + 1} Z`} />
          {/* A textura crespa no contorno do alto (os cachinhos sobre a borda, não soltos no ar). */}
          {Array.from({ length: 11 }, (_, k) => { const a = Math.PI * (1.08 + (k / 10) * 0.84); const ry = testaY - topo + 4.6; return <circle key={k} cx={cx + Math.cos(a) * (w / 2 - 2.2)} cy={testaY + 0.5 + Math.sin(a) * ry} r={2.1} />; })}
        </g>
      );
    case 'cacheado':
      return (
        <g>
          <Cachos cx={cx} cy={cy - 3} rx={w / 2 + 2.5} ry={hh / 2 + 2} cor={cor} n={14} r={4.2} frente />
          <path d={cal({ volume: 3.5, testa: 0.21, franja: 2.5 })} fill={cor} />
          <ColunaDeCachos x={L - 1} y0={cy - 6} y1={cy + 4} r={2.6} cor={cor} lado={-1} />
          <ColunaDeCachos x={R + 1} y0={cy - 6} y1={cy + 4} r={2.6} cor={cor} lado={1} />
        </g>
      );
    case 'black':
      return (
        <g fill={cor}>
          <path d={cal({ volume: 4, testa: 0.24, franja: 1 })} />
          {Array.from({ length: 7 }, (_, k) => <circle key={k} cx={cx - w * 0.33 + k * (w * 0.11)} cy={testaY - 0.5 + (k % 2) * 0.8} r={1.9} />)}
        </g>
      );
    case 'locs': {
      const fim = curto ? cy + 14 : cy + 30;
      return (
        <g>
          <path d={cal({ volume: 2, testa: 0.23, franja: 1 })} fill={cor} />
          {[-1, 1].map(l => (
            <g key={l}>
              <Loc x={cx + l * (w / 2 + 0.5)} y0={cy - 8} y1={fim} cor={cor} escuro={escuro} curva={l * 1.5} />
              <Loc x={cx + l * (w / 2 - 3)} y0={testaY + 1} y1={cy + 2} cor={cor} escuro={escuro} curva={l * 2.5} />
            </g>
          ))}
        </g>
      );
    }
    case 'trancas': {
      const fim = curto ? cy + 18 : cy + 32;
      return (
        <g>
          <path d={cal({ volume: 1.4, testa: 0.24, franja: 0.4 })} fill={cor} />
          <path d={`M ${cx} ${topo - 1} L ${cx} ${testaY + 0.5}`} stroke={misturar(cor, '#000000', 0.45)} strokeWidth={0.8} />
          <Tranca x={L - 0.5} y0={cy - 3} y1={fim} cor={cor} escuro={escuro} />
          <Tranca x={R + 0.5} y0={cy - 3} y1={fim} cor={cor} escuro={escuro} />
        </g>
      );
    }
    case 'longo_liso': {
      // Risca no meio e os dois painéis retos que caem na frente dos ombros.
      const fim = curto ? cy + 16 : cy + 30;
      return (
        <g fill={cor}>
          <path d={cal({ volume: 2.4, testa: 0.2, franja: 1.2 })} />
          <path d={`M ${L - 2.5} ${cy - 8} L ${L + 2.2} ${cy - 1} L ${L + 3} ${fim} L ${L - 3.2} ${fim} Z`} />
          <path d={`M ${R + 2.5} ${cy - 8} L ${R - 2.2} ${cy - 1} L ${R - 3} ${fim} L ${R + 3.2} ${fim} Z`} />
          <path d={`M ${cx} ${topo - 2} L ${cx} ${testaY + 1}`} stroke={misturar(cor, '#000000', 0.4)} strokeWidth={0.8} />
          <path d={`M ${L - 1} ${cy - 2} L ${L} ${fim - 2}`} stroke={brilho} strokeWidth={0.7} opacity={0.5} />
        </g>
      );
    }
    case 'longo_ondulado': {
      const fim = curto ? cy + 16 : cy + 28;
      const onda = (x: number, l: number) => `M ${x - l * 2.5} ${cy - 8} Q ${x + l * 2} ${cy} ${x - l * 1} ${cy + 6} Q ${x - l * 4} ${cy + 12} ${x} ${cy + 18} Q ${x + l * 2.5} ${fim - 4} ${x - l * 1} ${fim} L ${x - l * 5.5} ${fim} Q ${x - l * 3} ${fim - 6} ${x - l * 5} ${cy + 14} Q ${x - l * 7} ${cy + 6} ${x - l * 4.5} ${cy - 2} Z`;
      return (
        <g fill={cor}>
          <path d={cal({ volume: 2.8, testa: 0.2, franja: 3.5, lado: 4 })} />
          <path d={onda(L + 2.5, 1)} />
          <path d={onda(R - 2.5, -1)} />
        </g>
      );
    }
    case 'cacheado_longo': {
      const fim = curto ? cy + 10 : cy + 22;
      return (
        <g>
          <Cachos cx={cx} cy={cy - 3} rx={w / 2 + 3} ry={hh / 2 + 2} cor={cor} n={14} r={4.6} frente />
          <path d={cal({ volume: 3.5, testa: 0.22, franja: 3, lado: 4 })} fill={cor} />
          <ColunaDeCachos x={L - 2.5} y0={cy - 6} y1={fim} r={3.3} cor={cor} lado={-1} />
          <ColunaDeCachos x={R + 2.5} y0={cy - 6} y1={fim} r={3.3} cor={cor} lado={1} />
        </g>
      );
    }
    case 'chanel': {
      // A franja reta (horizontal) e as laterais retas até o queixo.
      const corte = cy + hh * 0.42;
      const franjaY = testaY + 6.5;
      return (
        <g fill={cor}>
          <path d={`M ${L - 2.8} ${cy - 2} C ${L - 3} ${topo - 4} ${R + 3} ${topo - 4} ${R + 2.8} ${cy - 2} L ${R + 3.4} ${corte} L ${R - 1.6} ${corte} L ${R - 1.8} ${cy - 2} L ${R - 2.5} ${franjaY} L ${L + 2.5} ${franjaY} L ${L + 1.8} ${cy - 2} L ${L + 1.6} ${corte} L ${L - 3.4} ${corte} Z`} />
          <path d={`M ${L + 3} ${franjaY - 0.4} L ${R - 3} ${franjaY - 0.4}`} stroke={escuro} strokeWidth={0.7} opacity={0.55} />
        </g>
      );
    }
    case 'pixie':
      // Curtinho, nuca e laterais rentes; a franja longa varrida de lado até a sobrancelha.
      return (
        <g fill={cor}>
          <path d={cal({ volume: 1.8, testa: 0.24, franja: 0.8, temporas: -hh * 0.05 })} />
          <path d={`M ${R - 1} ${testaY - 2} Q ${cx} ${testaY - 4} ${L + 1} ${cy - hh * 0.06} Q ${L + 4} ${testaY + 6} ${cx + 2} ${testaY + 4} Q ${cx + 8} ${testaY + 2.5} ${R - 1} ${testaY - 2} Z`} />
          <path d={`M ${L - 0.4} ${cy - 5} q -0.8 3 0.6 5`} stroke={cor} strokeWidth={1.4} fill="none" />
        </g>
      );
    case 'coque':
    case 'rabo':
      // Puxado para trás: a calota lisa com os fios penteados na direção do coque (ou do rabo).
      return (
        <g>
          <path d={cal({ volume: 1, testa: 0.25, franja: 0.4 })} fill={cor} />
          {(estilo === 'coque' ? [-0.3, 0, 0.3] : [-0.2, 0.15, 0.4]).map((t, k) => (
            <path key={k} d={`M ${cx + t * w * 1.2} ${testaY + 0.5} Q ${cx + t * w * 0.7} ${topo + 1} ${estilo === 'coque' ? cx : R - 2} ${topo - (estilo === 'coque' ? 0.5 : -3)}`} stroke={brilho} strokeWidth={0.6} fill="none" opacity={0.55} />
          ))}
        </g>
      );
    default:
      return <path d={cal({ volume: 2, testa: 0.24, franja: 2 })} fill={cor} />;
  }
}

/** As entradas: a pele por cima das têmporas (o desenho do cabelo continua; a testa avança nos cantos). */
export function Entradas({ cx, cy, w, hh, pele }: { cx: number; cy: number; w: number; hh: number; pele: string }) {
  const testaY = cy - hh * 0.22;
  return (
    <g fill={pele}>
      <path d={`M ${cx - w / 2 + 1.5} ${cy - hh * 0.02} C ${cx - w / 2 + 1} ${testaY - 4} ${cx - w * 0.22} ${testaY - 9} ${cx - w * 0.1} ${testaY - 7.5} C ${cx - w * 0.14} ${testaY - 2} ${cx - w * 0.3} ${testaY + 2} ${cx - w / 2 + 1.5} ${cy - hh * 0.02} Z`} />
      <path d={`M ${cx + w / 2 - 1.5} ${cy - hh * 0.02} C ${cx + w / 2 - 1} ${testaY - 4} ${cx + w * 0.22} ${testaY - 9} ${cx + w * 0.1} ${testaY - 7.5} C ${cx + w * 0.14} ${testaY - 2} ${cx + w * 0.3} ${testaY + 2} ${cx + w / 2 - 1.5} ${cy - hh * 0.02} Z`} />
    </g>
  );
}

/** Calvo: sobram as laterais e a nuca (e, às vezes, uma penugem no alto). */
export function Calvo({ cx, cy, w, hh, cor, semente }: { cx: number; cy: number; w: number; hh: number; cor: string; semente: number }) {
  const topo = cy - hh / 2;
  return (
    <g fill={cor}>
      <path d={`M ${cx - w / 2 - 0.5} ${cy + 2} C ${cx - w / 2 - 1} ${cy - hh * 0.2} ${cx - w / 2 + 3} ${cy - hh * 0.32} ${cx - w / 2 + 5} ${cy - hh * 0.28} L ${cx - w / 2 + 3} ${cy + 1} Z`} />
      <path d={`M ${cx + w / 2 + 0.5} ${cy + 2} C ${cx + w / 2 + 1} ${cy - hh * 0.2} ${cx + w / 2 - 3} ${cy - hh * 0.32} ${cx + w / 2 - 5} ${cy - hh * 0.28} L ${cx + w / 2 - 3} ${cy + 1} Z`} />
      {semente % 2 === 0 && <path d={`M ${cx - 9} ${topo + 2.5} q 9 -3.5 18 0`} fill="none" stroke={cor} strokeWidth={1.2} opacity={0.5} />}
    </g>
  );
}
