/**
 * VIDA 35.2 · A FACHADA DA GAMING HOUSE (por fora). Três casas, como as da vida real que servem de base: o loft (um
 * prédio de andares com varandas, como as gaming houses de bairro), o casarão (sobrado com telhado, jardim e piscina) e
 * a torre corporativa (o prédio de vidro de muitos andares, como a sede da Liquid em São Paulo, com o saguão no térreo).
 * Desenho chapado, na linguagem do VIDA: a cor do material, a cobertura, a porta, o jardim, as janelas acesas na cor da
 * luz, o letreiro em neon. Só desenha: o que se escolhe fica em `Instalacoes34` (ver `CasaDaOrg35`).
 */
import type { ReactElement } from 'react';
import { misturar } from '../../avatar/cores';
import type { Fachada34, Jardim35, Porta35, Telhado35 } from '../../../motor/v33/dono/instalacoes34';

export type EstiloDaCasa35 = 'loft' | 'casa' | 'escritorio';

export interface FachadaProps {
  estilo: EstiloDaCasa35;
  nome: string;
  fachada: Fachada34;
  telhado: Telhado35;
  porta: Porta35;
  jardim: Jardim35;
  varanda: boolean;
  plantas: boolean;
  neon: boolean;
  luz: string;
  /** A cor principal do time (para o material "nas cores do time"). */
  corTime: string;
  piscina: boolean;
  largura?: number;
}

const CHAO = 212;
const W = 320, H = 240;

const MATERIAL: Record<Exclude<Fachada34, 'time'>, string> = { concreto: '#b9b5ae', vidro: '#8fb8c9', tijolo: '#a8553a' };

export function FachadaDaOrg35({ estilo, nome, fachada, telhado, porta, jardim, varanda, plantas, neon, luz, corTime, piscina, largura = 320 }: FachadaProps) {
  const mat = fachada === 'time' ? corTime : MATERIAL[fachada];
  const sombra = misturar(mat, '#000000', 0.18);
  const verde = '#5c8a4e';
  const textoNeon = nome.trim().slice(0, 18).toUpperCase() || 'GAMING HOUSE';
  // A janela acesa (na cor da luz) em dois de cada três; a outra, de vidro escuro. Assim a casa tem ritmo, não é lisa.
  const janela = (x: number, y: number, w: number, h: number, k: number) => (
    <rect key={`j${x}-${y}`} x={x} y={y} width={w} height={h} rx={1.5} fill={k % 3 === 0 ? '#2b3640' : luz} opacity={k % 3 === 0 ? 0.85 : 0.92} stroke={sombra} strokeWidth={1} />
  );
  const portaDesenho = (x: number, y: number, w: number, h: number) => {
    const cor = porta === 'vidro' ? '#c9e6f2' : porta === 'metal' ? '#4a4f55' : '#6b4a2e';
    return (
      <g data-peca="porta" data-porta={porta}>
        <rect x={x} y={y} width={w} height={h} fill={cor} stroke={sombra} strokeWidth={1.2} />
        {porta === 'vidro' && <line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h} stroke={sombra} strokeWidth={1} />}
        {porta === 'madeira' && <rect x={x + 3} y={y + 4} width={w - 6} height={h / 2 - 6} fill="none" stroke="#8a6440" strokeWidth={1} />}
        <circle cx={x + w - 4} cy={y + h / 2} r={1.4} fill="#d8c48a" />
      </g>
    );
  };
  const coberturaFaixa = (x0: number, x1: number, y: number) => (
    telhado === 'verde' ? (
      <g data-peca="cobertura" data-telhado="verde">
        <rect x={x0 - 4} y={y - 7} width={x1 - x0 + 8} height={7} fill={verde} />
        {Array.from({ length: Math.floor((x1 - x0) / 14) }, (_, k) => <circle key={k} cx={x0 + 8 + k * 14} cy={y - 9} r={4.5} fill="#7fae62" />)}
      </g>
    ) : (
      <rect data-peca="cobertura" data-telhado="laje" x={x0 - 4} y={y - 6} width={x1 - x0 + 8} height={6} fill={sombra} />
    )
  );
  const sinal = (x: number, y: number) => neon && (
    <g data-peca="neon" aria-hidden>
      <rect x={x - 84} y={y - 11} width={168} height={22} rx={6} fill="#1c1c22" />
      <text x={x} y={y + 5} textAnchor="middle" fontSize={13} fontWeight={700} fill={luz} stroke={luz} strokeOpacity={0.35} strokeWidth={4} letterSpacing={1.5}>{textoNeon}</text>
    </g>
  );
  const plantasDesenho = (xs: number[], y: number) => plantas && (
    <g data-peca="plantas">
      {xs.map((x, k) => <g key={k}><rect x={x - 6} y={y} width={12} height={CHAO - y} fill="#8a5a3a" /><circle cx={x} cy={y - 6} r={9} fill="#4f8a4a" /><circle cx={x - 5} cy={y - 2} r={5} fill="#6aa35f" /></g>)}
    </g>
  );

  let predio: ReactElement;
  let sinalY = 24;
  if (estilo === 'casa') {
    const x0 = 70, x1 = 250, eave = 104;
    predio = (
      <g data-peca="casa">
        {telhado === 'telha'
          ? <polygon data-peca="cobertura" data-telhado="telha" points={`${x0 - 10},${eave} 160,40 ${x1 + 10},${eave}`} fill="#8a4b3c" stroke={sombra} strokeWidth={1} />
          : coberturaFaixa(x0, x1, eave)}
        <rect x={x0} y={eave} width={x1 - x0} height={CHAO - eave} fill={mat} />
        {[118, 160].map((y, r) => [92, 192].map((x, c) => janela(x, y, 36, 30, r * 2 + c)))}
        {varanda && [116, 158].map(y => <rect key={y} data-peca="varanda" x={x0 + 4} y={y + 32} width={x1 - x0 - 8} height={3} fill={sombra} />)}
        {portaDesenho(147, 172, 26, CHAO - 172)}
        {piscina && (
          <g data-peca="piscina">
            <rect x={254} y={CHAO - 14} width={58} height={14} rx={2} fill="#e7e1d4" />
            <ellipse cx={283} cy={CHAO - 7} rx={25} ry={4.5} fill="#5bc0eb" stroke="#3a93c0" strokeWidth={0.8} />
          </g>
        )}
        {plantasDesenho([52, 268], CHAO - 16)}
      </g>
    );
    sinalY = telhado === 'telha' ? 26 : 24;
  } else if (estilo === 'escritorio') {
    const x0 = 104, x1 = 216, top = 14;
    const andares = Array.from({ length: 13 }, (_, k) => top + 14 + k * 14.5).filter(y => y < 176);
    predio = (
      <g data-peca="torre">
        {coberturaFaixa(x0, x1, top)}
        <rect x={x0} y={top} width={x1 - x0} height={CHAO - top} fill={mat} />
        {andares.map((y, k) => <line key={k} x1={x0} y1={y} x2={x1} y2={y} stroke={sombra} strokeWidth={1} opacity={0.55} />)}
        {[0, 1, 2, 3].map(k => <line key={`c${k}`} x1={x0 + 14 + k * 24} y1={top + 2} x2={x0 + 14 + k * 24} y2={176} stroke={sombra} strokeWidth={0.8} opacity={0.4} />)}
        {andares.slice(0, 9).map((y, r) => [0, 1, 2].map(c => janela(x0 + 8 + c * 33, y + 3, 24, 8, r * 3 + c)))}
        <rect data-peca="saguao" x={x0 + 6} y={178} width={x1 - x0 - 12} height={CHAO - 178} fill="#d9e8ef" stroke={sombra} strokeWidth={1} />
        {portaDesenho(154, 184, 12, CHAO - 184)}
        {varanda && <rect data-peca="varanda" x={x0 - 6} y={176} width={x1 - x0 + 12} height={3} fill={sombra} />}
        {plantasDesenho([x0 - 8, x1 + 8], CHAO - 12)}
      </g>
    );
    sinalY = 160;
  } else {
    const x0 = 56, x1 = 264, top = 44;
    predio = (
      <g data-peca="loft">
        {telhado === 'telha'
          ? <polygon data-peca="cobertura" data-telhado="telha" points={`${x0 - 8},${top} 160,${top - 30} ${x1 + 8},${top}`} fill="#8a4b3c" stroke={sombra} strokeWidth={1} />
          : coberturaFaixa(x0, x1, top)}
        <rect x={x0} y={top} width={x1 - x0} height={CHAO - top} fill={mat} />
        {[0, 1, 2, 3].map(r => [0, 1, 2, 3].map(c => janela(x0 + 16 + c * 46, top + 14 + r * 40, 30, 26, r * 4 + c)))}
        {varanda && [0, 1, 2].map(r => <g key={r} data-peca="varanda"><rect x={x0 + 4} y={top + 42 + r * 40} width={x1 - x0 - 8} height={3} fill={sombra} />{plantas && [70, 160, 250].map(x => <circle key={x} cx={x} cy={top + 39 + r * 40} r={4} fill="#6aa35f" />)}</g>)}
        {portaDesenho(146, 176, 28, CHAO - 176)}
        {plantasDesenho([x0 - 10, x1 + 10], CHAO - 14)}
      </g>
    );
    sinalY = telhado === 'telha' ? top - 42 : top - 18;
  }

  const chao = jardim === 'grama' ? { y: CHAO, h: 18, fill: '#86a86f' } : jardim === 'deck' ? { y: CHAO, h: 10, fill: '#a57a4c' } : jardim === 'pedras' ? { y: CHAO, h: 10, fill: '#c9c2b5' } : undefined;

  return (
    <svg className="fachada35" viewBox={`0 0 ${W} ${H}`} width={largura} height={Math.round(largura * H / W)} role="img" aria-label={`Fachada da ${nome}`} data-estilo={estilo} data-material={fachada} data-jardim={jardim}>
      <rect width={W} height={H} fill="#dcecf3" />
      <circle cx={282} cy={34} r={12} fill="#f6d77a" opacity={0.9} />
      {chao && <rect data-peca="jardim" data-jardim={jardim} x={0} y={chao.y} width={W} height={chao.h} fill={chao.fill} />}
      {jardim === 'pedras' && Array.from({ length: 22 }, (_, k) => <circle key={k} cx={8 + k * 14.5} cy={CHAO + 4 + (k % 2) * 3} r={2.2} fill="#a79f90" />)}
      {jardim === 'deck' && Array.from({ length: 11 }, (_, k) => <line key={k} x1={k * 30} y1={CHAO} x2={k * 30} y2={CHAO + 10} stroke="#8a6440" strokeWidth={1} />)}
      {predio}
      {sinal(160, sinalY)}
      <line x1={0} y1={CHAO} x2={W} y2={CHAO} stroke={sombra} strokeWidth={1} />
    </svg>
  );
}
