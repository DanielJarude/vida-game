/**
 * Retrato procedural.
 *
 * Local, sem assets, modular. As proporções mudam com a idade — o bebê tem
 * cabeça grande, olhos baixos e quase nenhum cabelo; a criança, rosto
 * redondo; o adolescente alonga; o adulto define o queixo; o idoso ganha
 * rugas, cabelos brancos e, às vezes, entradas. Gênero muda mandíbula,
 * sobrancelha, cílios, lábios e o repertório de cabelo, sem caricatura.
 */

import { memo } from 'react';
import type { Genero, Visual } from '../../motor/tipos';

const PELE: Record<string, [string, string]> = {
  p1: ['#f3d7c2', '#e2b99f'], p2: ['#e9c09d', '#d4a27e'], p3: ['#d49f75', '#bd8559'],
  p4: ['#b27b52', '#98643f'], p5: ['#8b5b3a', '#74482c'], p6: ['#5f3c27', '#4b2e1d']
};
const CABELO: Record<string, string> = {
  preto: '#1c1917', castanho_escuro: '#35251c', castanho: '#563a28', castanho_claro: '#86603f', loiro: '#caa25e', ruivo: '#a24a27'
};
const OLHOS: Record<string, string> = {
  castanho_escuro: '#2f1d14', castanho: '#553620', mel: '#86662b', verde: '#56764a', azul: '#4b75a0'
};
const ROUPA = ['#4b5a6b', '#6b4f5a', '#4f6b5a', '#7a6248', '#5a5470', '#3f5f66', '#735a4a', '#556048'];

type Fase = 'bebe' | 'crianca' | 'pre' | 'adol' | 'adulto' | 'meia' | 'idoso';

function faseDe(i: number): Fase {
  if (i <= 2) return 'bebe';
  if (i <= 8) return 'crianca';
  if (i <= 12) return 'pre';
  if (i <= 17) return 'adol';
  if (i <= 44) return 'adulto';
  if (i <= 64) return 'meia';
  return 'idoso';
}

function misturar(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map(k => parseInt(a.slice(k, k + 2), 16));
  const pb = [1, 3, 5].map(k => parseInt(b.slice(k, k + 2), 16));
  return '#' + pa.map((x, k) => Math.round(x + (pb[k] - x) * t).toString(16).padStart(2, '0')).join('');
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

interface Props {
  visual?: Visual;
  genero: Genero;
  idade: number;
  /** Semente estável para detalhes (cor de roupa, pequenas assimetrias). */
  semente?: string;
  tamanho?: number;
  rotulo?: string;
  especie?: 'cachorro' | 'gato';
  falecido?: boolean;
  /**
   * Como a pessoa está (do estado real, não sorteado): muda boca,
   * sobrancelha, pálpebra e cor do rosto — o mesmo rosto, noutro dia.
   */
  expressao?: Expressao;
}

export type Expressao = 'bem' | 'neutro' | 'cansado' | 'abatido' | 'tenso' | 'doente';

export const Retrato = memo(function Retrato({ visual, genero, idade, semente = '', tamanho = 64, rotulo, especie, falecido, expressao = 'neutro' }: Props) {
  if (especie) return <RetratoPet especie={especie} tamanho={tamanho} rotulo={rotulo} semente={semente} />;
  const v: Visual = visual ?? { pele: 'p3', cabelo: 'curto', corCabelo: 'castanho', olhos: 'castanho' };
  const f = faseDe(idade);
  const fem = genero === 'feminino';
  const masc = genero === 'masculino';
  const h = hash(semente || v.pele + v.cabelo);
  const [peleBase, sombraBase] = PELE[v.pele] ?? PELE.p3;
  // Doença tira a cor do rosto; um pouco, sem virar caricatura.
  const pele = expressao === 'doente' ? misturar(peleBase, '#b7b3ab', 0.22) : peleBase;
  const sombra = expressao === 'doente' ? misturar(sombraBase, '#9d978e', 0.2) : sombraBase;
  const x = expressao;

  // Cabelo envelhece
  let cor = CABELO[v.corCabelo] ?? CABELO.castanho;
  if (f === 'meia') cor = misturar(cor, '#b8b2aa', idade >= 55 ? 0.45 : 0.22);
  if (f === 'idoso') cor = misturar(cor, '#ddd8d0', idade >= 78 ? 0.9 : 0.7);
  if (f === 'bebe' || f === 'crianca') cor = misturar(cor, '#caa25e', v.corCabelo === 'preto' || v.corCabelo === 'castanho_escuro' ? 0.05 : 0.2);

  // Geometria por fase
  const G = {
    bebe:    { w: 46, hh: 44, cy: 52, jaw: 0.34, olho: 3.9, olhoY: 3.5, esp: 9.5, corpo: 0.62 },
    crianca: { w: 42, hh: 46, cy: 48, jaw: 0.3, olho: 3.2, olhoY: 1.5, esp: 8.6, corpo: 0.75 },
    pre:     { w: 39, hh: 47, cy: 46, jaw: 0.26, olho: 2.8, olhoY: 0.5, esp: 8.2, corpo: 0.85 },
    adol:    { w: 36, hh: 47, cy: 45, jaw: 0.22, olho: 2.6, olhoY: -0.5, esp: 7.8, corpo: 0.95 },
    adulto:  { w: 35, hh: 46, cy: 44, jaw: 0.2, olho: 2.5, olhoY: -1, esp: 7.6, corpo: 1 },
    meia:    { w: 35.5, hh: 46, cy: 44, jaw: 0.21, olho: 2.4, olhoY: -1, esp: 7.6, corpo: 1 },
    idoso:   { w: 35.5, hh: 45.5, cy: 45, jaw: 0.22, olho: 2.3, olhoY: -0.5, esp: 7.6, corpo: 0.98 }
  }[f];
  const adultoOuAdol = f === 'adol' || f === 'adulto' || f === 'meia' || f === 'idoso';
  const w = G.w * (adultoOuAdol && masc ? 1.04 : adultoOuAdol && fem ? 0.97 : 1);
  const hh = G.hh;
  const cx = 50;
  const cy = G.cy;
  const topo = cy - hh / 2;
  const queixo = cy + hh / 2;
  const jaw = w * (adultoOuAdol ? (masc ? G.jaw + 0.07 : fem ? G.jaw - 0.02 : G.jaw + 0.02) : G.jaw);

  const rosto = `M ${cx - w / 2} ${cy}
    C ${cx - w / 2} ${cy - hh * 0.63} ${cx + w / 2} ${cy - hh * 0.63} ${cx + w / 2} ${cy}
    C ${cx + w / 2} ${cy + hh * 0.3} ${cx + jaw} ${queixo} ${cx} ${queixo}
    C ${cx - jaw} ${queixo} ${cx - w / 2} ${cy + hh * 0.3} ${cx - w / 2} ${cy} Z`;

  const roupa = f === 'bebe' ? ['#c9d6e3', '#e3cdd6', '#d7e0c8', '#e6dcc4'][h % 4] : ROUPA[h % ROUPA.length];
  const ombro = 30 * G.corpo * (adultoOuAdol && masc ? 1.12 : 1);
  const pescocoW = f === 'bebe' ? 0 : w * (masc && adultoOuAdol ? 0.36 : 0.3);
  const corpoTopo = queixo + (f === 'bebe' ? -2 : 4);

  const olhoY = cy + G.olhoY;
  const esp = G.esp;
  const iris = OLHOS[v.olhos] ?? OLHOS.castanho;
  const estilo = f === 'bebe' ? 'bebe' : v.cabelo;
  const calvo = f === 'idoso' && masc && (h % 3 !== 0) || (f === 'meia' && masc && h % 5 === 0);

  return (
    <svg
      className={`retrato retrato--${f}${falecido ? ' retrato--falecido' : ''} retrato--${expressao}`}
      viewBox="10 8 80 80" width={tamanho} height={tamanho}
      role="img" aria-label={rotulo ?? 'Retrato'}
    >
      {/* Cabelo de trás */}
      <CabeloAtras estilo={estilo} cor={cor} cx={cx} cy={cy} w={w} hh={hh} fase={f} />

      {/* Corpo */}
      <path d={`M ${cx - ombro} 101 C ${cx - ombro} ${corpoTopo + 10} ${cx - ombro * 0.55} ${corpoTopo + 3} ${cx} ${corpoTopo + 3}
               C ${cx + ombro * 0.55} ${corpoTopo + 3} ${cx + ombro} ${corpoTopo + 10} ${cx + ombro} 101 Z`} fill={roupa} />
      {pescocoW > 0 && (
        <path d={`M ${cx - pescocoW / 2} ${queixo - 6} L ${cx - pescocoW / 2} ${corpoTopo + 5} Q ${cx} ${corpoTopo + 9} ${cx + pescocoW / 2} ${corpoTopo + 5} L ${cx + pescocoW / 2} ${queixo - 6} Z`} fill={sombra} />
      )}
      {f !== 'bebe' && (
        <path d={fem ? `M ${cx - pescocoW * 0.9} ${corpoTopo + 4} Q ${cx} ${corpoTopo + 14} ${cx + pescocoW * 0.9} ${corpoTopo + 4}` : `M ${cx - pescocoW * 0.75} ${corpoTopo + 3.5} L ${cx} ${corpoTopo + 10} L ${cx + pescocoW * 0.75} ${corpoTopo + 3.5}`}
          fill="none" stroke={misturar(roupa, '#000000', 0.25)} strokeWidth={1.4} strokeLinejoin="round" />
      )}

      {/* Orelhas */}
      <ellipse cx={cx - w / 2 + 0.6} cy={olhoY + 3} rx={2.6} ry={4} fill={sombra} />
      <ellipse cx={cx + w / 2 - 0.6} cy={olhoY + 3} rx={2.6} ry={4} fill={sombra} />

      {/* Rosto */}
      <path d={rosto} fill={pele} />
      {(f === 'bebe' || f === 'crianca') && (
        <>
          <ellipse cx={cx - esp - 2} cy={olhoY + 7} rx={4} ry={2.6} fill="#e8889a" opacity={0.22} />
          <ellipse cx={cx + esp + 2} cy={olhoY + 7} rx={4} ry={2.6} fill="#e8889a" opacity={0.22} />
        </>
      )}

      {/* Sobrancelhas */}
      {f !== 'bebe' && (
        <g stroke={f === 'idoso' ? misturar(cor, '#8a8580', 0.3) : misturar(cor, '#000000', 0.15)} strokeLinecap="round" fill="none"
           strokeWidth={masc && adultoOuAdol ? 1.9 : 1.25}>
          {/* Sobrancelha: o canto de dentro sobe na tristeza, desce na tensão. */}
          <path d={`M ${cx - esp - 3.4} ${olhoY - 4.6 - (x === 'bem' ? 0.5 : 0)} Q ${cx - esp} ${olhoY - 6.2 - (x === 'bem' ? 0.6 : 0)} ${cx - esp + 3.2} ${olhoY - 4.8 + (x === 'tenso' ? 1.1 : x === 'abatido' || x === 'doente' ? -1.3 : 0)}`} />
          <path d={`M ${cx + esp - 3.2} ${olhoY - 4.8 + (x === 'tenso' ? 1.1 : x === 'abatido' || x === 'doente' ? -1.3 : 0)} Q ${cx + esp} ${olhoY - 6.2 - (x === 'bem' ? 0.6 : 0)} ${cx + esp + 3.4} ${olhoY - 4.6 - (x === 'bem' ? 0.5 : 0)}`} />
        </g>
      )}

      {/* Olhos */}
      {[-1, 1].map(lado => (
        <g key={lado}>
          <ellipse cx={cx + lado * esp} cy={olhoY} rx={G.olho * 1.15} ry={G.olho * (f === 'idoso' ? 0.8 : 0.95)} fill="#f7f2ea" />
          <circle cx={cx + lado * esp} cy={olhoY + 0.2} r={G.olho * 0.72} fill={iris} />
          <circle cx={cx + lado * esp} cy={olhoY + 0.2} r={G.olho * 0.36} fill="#141110" />
          <circle cx={cx + lado * esp + G.olho * 0.28} cy={olhoY - G.olho * 0.3} r={G.olho * 0.22} fill="#ffffff" opacity={0.85} />
          {fem && adultoOuAdol && (
            <path d={`M ${cx + lado * (esp + G.olho * 1.05)} ${olhoY - 0.6} l ${lado * 1.6} -1.4`} stroke="#1c1917" strokeWidth={0.9} strokeLinecap="round" />
          )}
        </g>
      ))}

      {/* Cansaço: pálpebra caída e olheira. */}
      {f !== 'bebe' && (x === 'cansado' || x === 'doente' || x === 'abatido') && [-1, 1].map(lado => (
        <g key={`p${lado}`}>
          <path d={`M ${cx + lado * esp - G.olho * 1.25} ${olhoY - G.olho * 0.2} Q ${cx + lado * esp} ${olhoY - G.olho * (x === 'abatido' ? 1.05 : 1.3)} ${cx + lado * esp + G.olho * 1.25} ${olhoY - G.olho * 0.2} L ${cx + lado * esp + G.olho * 1.25} ${olhoY - G.olho * 1.3} L ${cx + lado * esp - G.olho * 1.25} ${olhoY - G.olho * 1.3} Z`} fill={pele} />
          <path d={`M ${cx + lado * esp - G.olho * 1.05} ${olhoY + G.olho * 1.15} q ${G.olho * 1.05} ${G.olho * 0.7} ${G.olho * 2.1} 0`} fill="none" stroke={misturar(sombra, '#4a3a4a', 0.35)} strokeWidth={0.7} opacity={x === 'abatido' ? 0.35 : 0.6} strokeLinecap="round" />
        </g>
      ))}

      {/* Rugas e marcas do tempo */}
      {(f === 'meia' || f === 'idoso') && (
        <g stroke={misturar(sombra, '#000000', 0.2)} strokeWidth={0.6} fill="none" opacity={f === 'idoso' ? 0.75 : 0.45} strokeLinecap="round">
          <path d={`M ${cx - esp - 5.5} ${olhoY + 1.5} q -1.5 1.2 -1.4 2.8`} />
          <path d={`M ${cx + esp + 5.5} ${olhoY + 1.5} q 1.5 1.2 1.4 2.8`} />
          {f === 'idoso' && <path d={`M ${cx - 7} ${topo + hh * 0.2} q 7 -1.6 14 0`} />}
          <path d={`M ${cx - 6.5} ${olhoY + 9} q -1.2 3 0.2 5.5`} />
          <path d={`M ${cx + 6.5} ${olhoY + 9} q 1.2 3 -0.2 5.5`} />
        </g>
      )}

      {/* Nariz */}
      <path d={f === 'bebe' || f === 'crianca'
        ? `M ${cx - 1.6} ${olhoY + 6.2} q 1.6 1.4 3.2 0`
        : `M ${cx - 0.4} ${olhoY + 1.5} L ${cx - 1.6} ${olhoY + 7.6} Q ${cx} ${olhoY + 8.8} ${cx + 1.8} ${olhoY + 7.6}`}
        fill="none" stroke={misturar(sombra, '#000000', 0.12)} strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" />

      {/* Boca */}
      {f === 'bebe'
        ? <ellipse cx={cx} cy={olhoY + 11} rx={2.4} ry={1.4} fill="#c7707a" />
        : (() => {
            // A boca muda de curva: sorriso, reta de quem aperta os dentes, canto que cai.
            const larg = (fem ? 3.6 : 3.8) * (x === 'tenso' ? 0.85 : x === 'bem' ? 1.08 : 1);
            const curva = x === 'bem' ? (fem ? 3.4 : 2.8) : x === 'tenso' ? 0.3 : x === 'abatido' ? -1.6 : x === 'doente' ? -0.7 : x === 'cansado' ? 0.8 : fem ? 2.4 : 1.6;
            const cantos = olhoY + 12.2 + (x === 'abatido' ? 0.8 : 0);
            return <path d={`M ${cx - larg} ${cantos} Q ${cx} ${cantos + curva} ${cx + larg} ${cantos}`}
              fill={fem && adultoOuAdol && curva > 1 ? '#b9606b' : 'none'} stroke={fem && adultoOuAdol ? '#a85460' : misturar(sombra, '#6a2e2e', 0.45)} strokeWidth={fem && adultoOuAdol ? (curva > 1 ? 0.8 : 1.2) : 1.3} strokeLinecap="round" />;
          })()}

      {/* Barba e bigode (só homens adultos) */}
      {masc && (f === 'adulto' || f === 'meia' || f === 'idoso') && v.barba && (
        <Barba tipo={v.barba} cor={f === 'idoso' ? misturar(cor, '#e6e2dc', 0.3) : misturar(cor, '#000000', 0.05)} cx={cx} olhoY={olhoY} w={w} queixo={queixo} jaw={jaw} />
      )}

      {/* Óculos em parte dos idosos */}
      {f === 'idoso' && h % 2 === 0 && (
        <g fill="none" stroke="#2a2522" strokeWidth={0.9} opacity={0.9}>
          <rect x={cx - esp - 4.3} y={olhoY - 3.4} width={8.6} height={6.6} rx={2} />
          <rect x={cx + esp - 4.3} y={olhoY - 3.4} width={8.6} height={6.6} rx={2} />
          <path d={`M ${cx - esp + 4.3} ${olhoY - 0.6} Q ${cx} ${olhoY - 2} ${cx + esp - 4.3} ${olhoY - 0.6}`} />
        </g>
      )}

      {/* Cabelo da frente */}
      <CabeloFrente estilo={estilo} cor={cor} cx={cx} cy={cy} w={w} hh={hh} fase={f} calvo={calvo} semente={h} fem={fem} />
    </svg>
  );
});

/* ---------------------------------------------------------------- Cabelo */

interface CabeloProps { estilo: string; cor: string; cx: number; cy: number; w: number; hh: number; fase: Fase }

/** Calota de cabelo com linha de testa configurável. */
function calota(cx: number, cy: number, w: number, hh: number, o: { volume?: number; testa?: number; franja?: number; lado?: number; temporas?: number }) {
  const vol = o.volume ?? 1.5;
  const testaY = cy - hh * (o.testa ?? 0.22);
  const tempY = cy + (o.temporas ?? -hh * 0.02);
  const L = cx - w / 2 - vol * 0.6;
  const R = cx + w / 2 + vol * 0.6;
  const topoY = cy - hh * 0.5 - vol;
  const lado = o.lado ?? 0;
  const franja = o.franja ?? 3;
  return `M ${L} ${tempY}
    C ${L - 0.5} ${topoY + hh * 0.08} ${cx - w * 0.3} ${topoY} ${cx} ${topoY}
    C ${cx + w * 0.3} ${topoY} ${R + 0.5} ${topoY + hh * 0.08} ${R} ${tempY}
    C ${R - 1.8} ${testaY + 2} ${cx + w * 0.25 + lado} ${testaY - 1} ${cx + lado * 2} ${testaY + franja}
    C ${cx - w * 0.25 + lado} ${testaY - 1} ${L + 1.8} ${testaY + 2} ${L} ${tempY} Z`;
}

function CabeloAtras({ estilo, cor, cx, cy, w, hh, fase }: CabeloProps) {
  const escuro = misturar(cor, '#000000', 0.18);
  const topo = cy - hh / 2;
  const longo = (y: number, ondas: boolean) => {
    const L = cx - w / 2 - 3;
    const R = cx + w / 2 + 3;
    const baixo = Math.min(99, y);
    if (!ondas) return `M ${L} ${cy - 4} C ${L - 1} ${topo - 2} ${R + 1} ${topo - 2} ${R} ${cy - 4} L ${R + 2} ${baixo} Q ${cx} ${baixo + 3} ${L - 2} ${baixo} Z`;
    return `M ${L} ${cy - 4} C ${L - 1} ${topo - 2} ${R + 1} ${topo - 2} ${R} ${cy - 4}
      Q ${R + 5} ${cy + 10} ${R + 1} ${cy + 18} Q ${R + 6} ${cy + 28} ${R + 2} ${baixo}
      Q ${cx} ${baixo + 4} ${L - 2} ${baixo} Q ${L - 6} ${cy + 28} ${L - 1} ${cy + 18} Q ${L - 5} ${cy + 10} ${L} ${cy - 4} Z`;
  };
  const curto = fase === 'crianca' || fase === 'pre';
  switch (estilo) {
    case 'longo_liso': return <path d={longo(curto ? cy + 22 : cy + 40, false)} fill={escuro} />;
    case 'longo_ondulado': return <path d={longo(curto ? cy + 22 : cy + 40, true)} fill={escuro} />;
    case 'chanel': return <path d={longo(cy + 14, false)} fill={escuro} />;
    case 'cacheado_longo': return <Cachos cx={cx} cy={cy + 8} rx={w / 2 + 9} ry={hh / 2 + 10} cor={escuro} n={20} r={6.5} />;
    case 'black': return <Cachos cx={cx} cy={cy - 4} rx={w / 2 + 9} ry={hh / 2 + 7} cor={escuro} n={22} r={7} cheio />;
    case 'trancas':
      return (
        <g fill={escuro}>
          {[-1, 1].map(l => <path key={l} d={`M ${cx + l * (w / 2 - 1)} ${cy - 2} q ${l * 4} 20 ${l * 2} ${curto ? 26 : 42} l ${-l * 4} 0 q ${l * 1} -22 ${-l * 2} -40 Z`} />)}
        </g>
      );
    case 'rabo': return <path d={`M ${cx + w / 2 - 2} ${cy - hh * 0.3} q 9 6 6 ${curto ? 20 : 28} q -2 6 -5 2 q 1 -16 -5 -26 Z`} fill={escuro} />;
    case 'coque': return <circle cx={cx} cy={topo - 4} r={7.5} fill={cor} />;
    default: return null;
  }
}

function Cachos({ cx, cy, rx, ry, cor, n, r, cheio, frente }: { cx: number; cy: number; rx: number; ry: number; cor: string; n: number; r: number; cheio?: boolean; frente?: boolean }) {
  const pts = Array.from({ length: n }, (_, k) => {
    const a = Math.PI + (k / (n - 1)) * Math.PI * (cheio ? 1 : 1);
    const ang = cheio ? (k / n) * Math.PI * 2 : a;
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

function CabeloFrente({ estilo, cor, cx, cy, w, hh, fase, calvo, semente, fem }: CabeloProps & { calvo: boolean; semente: number; fem: boolean }) {
  const brilho = misturar(cor, '#ffffff', 0.12);
  const topo = cy - hh / 2;
  if (estilo === 'bebe') {
    // Poucos fios: uma mecha e uma penugem.
    return (
      <g fill="none" stroke={cor} strokeLinecap="round" opacity={0.85}>
        <path d={`M ${cx - 3} ${topo + 2} q 3 -5 6 -1`} strokeWidth={1.6} />
        <path d={`M ${cx + 1} ${topo + 1.5} q 3 -4 5 0`} strokeWidth={1.3} />
        <path d={calota(cx, cy, w * 0.92, hh, { volume: -0.5, testa: 0.36, franja: 0 })} fill={cor} stroke="none" opacity={0.18} />
      </g>
    );
  }
  if (calvo) {
    // Entradas ou calvície: sobra a coroa e as laterais.
    return (
      <g fill={cor}>
        <path d={`M ${cx - w / 2 - 0.5} ${cy + 2} C ${cx - w / 2 - 1} ${cy - hh * 0.2} ${cx - w / 2 + 3} ${cy - hh * 0.32} ${cx - w / 2 + 5} ${cy - hh * 0.28} L ${cx - w / 2 + 3} ${cy + 1} Z`} />
        <path d={`M ${cx + w / 2 + 0.5} ${cy + 2} C ${cx + w / 2 + 1} ${cy - hh * 0.2} ${cx + w / 2 - 3} ${cy - hh * 0.32} ${cx + w / 2 - 5} ${cy - hh * 0.28} L ${cx + w / 2 - 3} ${cy + 1} Z`} />
        {semente % 2 === 0 && <path d={`M ${cx - 9} ${topo + 2.5} q 9 -3.5 18 0`} fill="none" stroke={cor} strokeWidth={1.2} opacity={0.5} />}
      </g>
    );
  }
  const curto = fase === 'crianca' || fase === 'pre';
  switch (estilo) {
    case 'raspado':
      return <path d={calota(cx, cy, w, hh, { volume: 0.2, testa: 0.28, franja: 1, temporas: -hh * 0.08 })} fill={cor} opacity={0.82} />;
    case 'curto':
      return <path d={calota(cx, cy, w, hh, { volume: 2.2, testa: 0.24, franja: 2.5 })} fill={cor} />;
    case 'curto_lado':
      return (
        <g>
          <path d={calota(cx, cy, w, hh, { volume: 2.6, testa: 0.24, franja: 1, lado: -5 })} fill={cor} />
          <path d={`M ${cx - 6} ${topo + 1} q 7 2 14 7`} stroke={brilho} strokeWidth={0.8} fill="none" opacity={0.6} />
        </g>
      );
    case 'ondulado':
      return (
        <g fill={cor}>
          <path d={calota(cx, cy, w, hh, { volume: 3.2, testa: 0.2, franja: 4, lado: 3 })} />
          <path d={`M ${cx - w / 2 - 1.5} ${cy} q -2 5 0 9 q 3 -3 3 -9 Z M ${cx + w / 2 + 1.5} ${cy} q 2 5 0 9 q -3 -3 -3 -9 Z`} />
        </g>
      );
    case 'crespo_curto':
      return (
        <g fill={cor}>
          <path d={calota(cx, cy, w, hh, { volume: 3.2, testa: 0.25, franja: 0.5 })} />
          {Array.from({ length: 11 }, (_, k) => {
            const a = Math.PI * (1.05 + (k / 10) * 0.9);
            return <circle key={k} cx={cx + Math.cos(a) * (w / 2 + 1.5)} cy={cy - 2 + Math.sin(a) * (hh / 2 + 2)} r={2.4} />;
          })}
        </g>
      );
    case 'cacheado':
      return (
        <g>
          <Cachos cx={cx} cy={cy - 3} rx={w / 2 + 2.5} ry={hh / 2 + 1.5} cor={cor} n={13} r={4.2} frente />
          <path d={calota(cx, cy, w, hh, { volume: 3.5, testa: 0.22, franja: 2.5 })} fill={cor} />
        </g>
      );
    case 'black':
      return <path d={calota(cx, cy, w, hh, { volume: 4, testa: 0.24, franja: 1 })} fill={cor} />;
    case 'cacheado_longo':
      return (
        <g>
          <Cachos cx={cx} cy={cy - 3} rx={w / 2 + 3} ry={hh / 2 + 2} cor={cor} n={14} r={4.6} frente />
          <path d={calota(cx, cy, w, hh, { volume: 3.5, testa: 0.22, franja: 3, lado: 4 })} fill={cor} />
        </g>
      );
    case 'longo_liso':
    case 'longo_ondulado':
      return (
        <g fill={cor}>
          <path d={calota(cx, cy, w, hh, { volume: 2.5, testa: 0.2, franja: curto ? 5 : 3, lado: fem ? 4 : 2 })} />
          <path d={`M ${cx - w / 2 - 2} ${cy - 4} L ${cx - w / 2 + 2} ${cy + (curto ? 12 : 20)} L ${cx - w / 2 - 3} ${cy + (curto ? 14 : 24)} Z`} />
          <path d={`M ${cx + w / 2 + 2} ${cy - 4} L ${cx + w / 2 - 2} ${cy + (curto ? 12 : 20)} L ${cx + w / 2 + 3} ${cy + (curto ? 14 : 24)} Z`} />
        </g>
      );
    case 'chanel':
      return (
        <g fill={cor}>
          <path d={calota(cx, cy, w, hh, { volume: 2.6, testa: 0.18, franja: 6 })} />
          <path d={`M ${cx - w / 2 - 2.5} ${cy - 2} L ${cx - w / 2 + 1} ${cy + 12} L ${cx - w / 2 - 3} ${cy + 13} Z M ${cx + w / 2 + 2.5} ${cy - 2} L ${cx + w / 2 - 1} ${cy + 12} L ${cx + w / 2 + 3} ${cy + 13} Z`} />
        </g>
      );
    case 'coque':
    case 'rabo':
      return (
        <g>
          <path d={calota(cx, cy, w, hh, { volume: 1.2, testa: 0.25, franja: 0.5 })} fill={cor} />
          <path d={`M ${cx - w * 0.3} ${topo + 3} q ${w * 0.3} -4 ${w * 0.6} 0`} stroke={brilho} strokeWidth={0.7} fill="none" opacity={0.5} />
        </g>
      );
    case 'trancas':
      return (
        <g>
          <path d={calota(cx, cy, w, hh, { volume: 1.6, testa: 0.24, franja: 0.5 })} fill={cor} />
          {[-6, 0, 6].map(dx => <path key={dx} d={`M ${cx + dx} ${topo - 0.5} L ${cx + dx * 1.3} ${cy - hh * 0.2}`} stroke={misturar(cor, '#000000', 0.3)} strokeWidth={0.7} />)}
        </g>
      );
    default:
      return <path d={calota(cx, cy, w, hh, { volume: 2, testa: 0.24, franja: 2 })} fill={cor} />;
  }
}

function Barba({ tipo, cor, cx, olhoY, w, queixo, jaw }: { tipo: string; cor: string; cx: number; olhoY: number; w: number; queixo: number; jaw: number }) {
  const bigode = <path d={`M ${cx - 5} ${olhoY + 11} Q ${cx} ${olhoY + 8.6} ${cx + 5} ${olhoY + 11} Q ${cx} ${olhoY + 10.4} ${cx - 5} ${olhoY + 11} Z`} fill={cor} stroke={cor} strokeWidth={1.4} strokeLinejoin="round" />;
  if (tipo === 'bigode') return bigode;
  if (tipo === 'cavanhaque') {
    return (
      <g fill={cor}>
        {bigode}
        <path d={`M ${cx - 3.2} ${olhoY + 15.2} Q ${cx} ${olhoY + 14.4} ${cx + 3.2} ${olhoY + 15.2} L ${cx + 2.4} ${queixo + 0.5} Q ${cx} ${queixo + 2} ${cx - 2.4} ${queixo + 0.5} Z`} />
      </g>
    );
  }
  const cheia = tipo === 'cheia';
  return (
    <g>
      <path d={`M ${cx - w / 2 + 1} ${olhoY + 2} C ${cx - w / 2 + 1.5} ${olhoY + 14} ${cx - jaw - 1} ${queixo + (cheia ? 3 : 0.5)} ${cx} ${queixo + (cheia ? 3.5 : 0.8)}
               C ${cx + jaw + 1} ${queixo + (cheia ? 3 : 0.5)} ${cx + w / 2 - 1.5} ${olhoY + 14} ${cx + w / 2 - 1} ${olhoY + 2}
               L ${cx + w / 2 - 3.5} ${olhoY + 3} C ${cx + w / 2 - 4} ${olhoY + 12} ${cx + 5} ${olhoY + 16} ${cx} ${olhoY + 16}
               C ${cx - 5} ${olhoY + 16} ${cx - w / 2 + 4} ${olhoY + 12} ${cx - w / 2 + 3.5} ${olhoY + 3} Z`}
        fill={cor} opacity={cheia ? 0.95 : 0.45} />
      {bigode}
    </g>
  );
}

/* ------------------------------------------------------------------ Pets */

function RetratoPet({ especie, tamanho, rotulo, semente }: { especie: 'cachorro' | 'gato'; tamanho: number; rotulo?: string; semente: string }) {
  const cores = ['#8a6a4a', '#2b2622', '#d9c3a0', '#a8752f', '#6b6560', '#efe6d8'];
  const c = cores[hash(semente) % cores.length];
  const escuro = misturar(c, '#000000', 0.25);
  return (
    <svg className="retrato retrato--pet" viewBox="0 0 100 100" width={tamanho} height={tamanho} role="img" aria-label={rotulo ?? (especie === 'gato' ? 'Gato' : 'Cachorro')}>
      {especie === 'gato' ? (
        <g>
          <path d="M 28 40 L 30 18 L 44 32 Z M 72 40 L 70 18 L 56 32 Z" fill={escuro} />
          <ellipse cx="50" cy="52" rx="25" ry="22" fill={c} />
          <ellipse cx="41" cy="50" rx="3.4" ry="4.2" fill="#c9b23a" /><ellipse cx="59" cy="50" rx="3.4" ry="4.2" fill="#c9b23a" />
          <ellipse cx="41" cy="50" rx="1.2" ry="3.4" fill="#141110" /><ellipse cx="59" cy="50" rx="1.2" ry="3.4" fill="#141110" />
          <path d="M 47 59 L 53 59 L 50 62 Z" fill="#d88a8a" />
          <path d="M 36 61 L 24 59 M 36 63 L 25 65 M 64 61 L 76 59 M 64 63 L 75 65" stroke={escuro} strokeWidth="0.8" />
          <ellipse cx="50" cy="96" rx="22" ry="20" fill={c} />
        </g>
      ) : (
        <g>
          <ellipse cx="28" cy="46" rx="8" ry="16" fill={escuro} transform="rotate(18 28 46)" />
          <ellipse cx="72" cy="46" rx="8" ry="16" fill={escuro} transform="rotate(-18 72 46)" />
          <ellipse cx="50" cy="50" rx="23" ry="24" fill={c} />
          <ellipse cx="50" cy="62" rx="12" ry="9" fill={misturar(c, '#ffffff', 0.25)} />
          <circle cx="41" cy="48" r="3.2" fill="#141110" /><circle cx="59" cy="48" r="3.2" fill="#141110" />
          <ellipse cx="50" cy="58" rx="4.4" ry="3.2" fill="#141110" />
          <path d="M 46 65 Q 50 68 54 65" stroke="#141110" strokeWidth="1.2" fill="none" />
          <ellipse cx="50" cy="97" rx="22" ry="20" fill={c} />
        </g>
      )}
    </svg>
  );
}
