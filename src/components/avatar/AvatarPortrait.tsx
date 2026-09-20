import React from 'react';
import type { AvatarAppearance } from '../../types';
import {
  TONS_DE_PELE,
  CORES_DE_CABELO,
  CORES_DE_OLHOS,
  corDaOpcao,
  formaDoCabelo,
  type FormaCabelo
} from '../../data/avatar/avatarOptions';
import { obterFaseAvatar, type FaseAvatar } from '../../systems/avatarSystem';

interface AvatarPortraitProps {
  avatar: AvatarAppearance;
  /** Idade do retratado — muda a proporção, não as cores. */
  idade: number;
  /** Tamanho em pixels do lado do quadrado. */
  tamanho?: number;
  /** Texto alternativo; sem ele o SVG é decorativo. */
  rotulo?: string;
}

/**
 * Proporções por fase.
 *
 * Bebê: cabeça grande, cabelo mínimo, olhos baixos e grandes.
 * Criança: intermediário. Adulto: rosto mais alongado.
 * Acrescentar uma fase é adicionar uma entrada aqui.
 */
const PROPORCOES: Record<
  FaseAvatar,
  { raioCabeca: number; centroY: number; olhoY: number; raioOlho: number; escalaCabelo: number }
> = {
  bebe: { raioCabeca: 30, centroY: 56, olhoY: 60, raioOlho: 4.2, escalaCabelo: 0.55 },
  crianca: { raioCabeca: 27, centroY: 54, olhoY: 55, raioOlho: 3.6, escalaCabelo: 0.85 },
  adulto: { raioCabeca: 25, centroY: 52, olhoY: 51, raioOlho: 3.2, escalaCabelo: 1 }
};

/**
 * Desenho do cabelo por silhueta.
 *
 * Cada forma é um caminho simples e reconhecível. Mantido como função pura
 * para que o conjunto cresça sem inchar o componente.
 */
function desenharCabelo(
  forma: FormaCabelo,
  cor: string,
  cx: number,
  cy: number,
  r: number,
  escala: number
): React.ReactNode {
  const R = r * escala;

  switch (forma) {
    case 'raspado':
      return (
        <path
          d={`M ${cx - r} ${cy - r * 0.15} a ${r} ${r} 0 0 1 ${r * 2} 0 z`}
          fill={cor}
          opacity={0.9}
        />
      );

    case 'curto':
      return (
        <path
          d={`M ${cx - r - 1} ${cy - r * 0.1} a ${r + 1} ${r * 1.05} 0 0 1 ${(r + 1) * 2} 0
              q ${-r * 0.3} ${-r * 0.35} ${-r * 0.9} ${-r * 0.2}
              q ${-r * 0.7} ${r * 0.25} ${-r * 1.4} 0
              q ${-r * 0.6} ${-r * 0.15} ${-r * 0.9} ${r * 0.2} z`}
          fill={cor}
        />
      );

    case 'ondulado':
      return (
        <path
          d={`M ${cx - r - 2} ${cy + r * 0.25}
              q ${-1} ${-r * 1.3} ${r + 2} ${-r * 1.35}
              q ${r + 2} ${r * 0.05} ${r + 2} ${r * 1.35}
              q ${-r * 0.35} ${-r * 0.5} ${-r * 0.75} ${-r * 0.15}
              q ${-r * 0.5} ${r * 0.35} ${-r * 1.1} ${-r * 0.1}
              q ${-r * 0.55} ${-r * 0.3} ${-r * 1.05} ${0.15 * r}
              q ${-r * 0.4} ${-r * 0.3} ${-r * 0.65} ${r * 0.1} z`}
          fill={cor}
        />
      );

    case 'cacheado':
      return (
        <g fill={cor}>
          <circle cx={cx} cy={cy - R * 0.85} r={R * 0.52} />
          <circle cx={cx - R * 0.62} cy={cy - R * 0.62} r={R * 0.46} />
          <circle cx={cx + R * 0.62} cy={cy - R * 0.62} r={R * 0.46} />
          <circle cx={cx - R * 0.92} cy={cy - R * 0.12} r={R * 0.38} />
          <circle cx={cx + R * 0.92} cy={cy - R * 0.12} r={R * 0.38} />
        </g>
      );

    case 'crespo':
      return (
        <ellipse
          cx={cx}
          cy={cy - R * 0.5}
          rx={R * 1.28}
          ry={R * 1.05}
          fill={cor}
        />
      );

    case 'longo':
      return (
        <g fill={cor}>
          <path
            d={`M ${cx - r - 3} ${cy + r * 1.9}
                q ${-r * 0.1} ${-r * 2.6} ${r * 0.55} ${-r * 2.05}
                a ${r + 1} ${r + 1} 0 0 1 ${(r + 1) * 1.75} 0
                q ${r * 0.68} ${-r * 0.55} ${r * 0.55} ${r * 2.05} z`}
          />
        </g>
      );

    case 'preso':
      return (
        <g fill={cor}>
          <path
            d={`M ${cx - r - 1} ${cy - r * 0.05} a ${r + 1} ${r * 1.05} 0 0 1 ${(r + 1) * 2} 0
                q ${-r * 0.4} ${-r * 0.45} ${-r} ${-r * 0.3}
                q ${-r * 0.6} ${r * 0.15} ${-r} ${r * 0.3} z`}
          />
          <circle cx={cx + r * 1.05} cy={cy - r * 0.35} r={R * 0.42} />
        </g>
      );

    case 'trancas':
      return (
        <g fill={cor}>
          <path
            d={`M ${cx - r - 1} ${cy - r * 0.05} a ${r + 1} ${r * 1.05} 0 0 1 ${(r + 1) * 2} 0 z`}
          />
          <rect x={cx - r * 1.12} y={cy - r * 0.1} width={R * 0.34} height={R * 1.6} rx={R * 0.17} />
          <rect x={cx + r * 0.78} y={cy - r * 0.1} width={R * 0.34} height={R * 1.6} rx={R * 0.17} />
        </g>
      );
  }
}

/**
 * Retrato 2D do personagem.
 *
 * Desenhado em SVG inline a partir dos IDs de aparência — sem imagem
 * externa, sem IA, sem requisição de rede. Puramente apresentacional: não
 * lê nem escreve estado de jogo.
 */
export const AvatarPortrait: React.FC<AvatarPortraitProps> = ({
  avatar,
  idade,
  tamanho = 96,
  rotulo
}) => {
  const fase = obterFaseAvatar(idade);
  const p = PROPORCOES[fase];

  const pele = corDaOpcao(TONS_DE_PELE, avatar.tomDePele);
  const cabelo = corDaOpcao(CORES_DE_CABELO, avatar.corCabelo);
  const olhos = corDaOpcao(CORES_DE_OLHOS, avatar.corOlhos);
  const forma = formaDoCabelo(avatar.estiloCabelo);

  const cx = 50;
  const cy = p.centroY;
  const r = p.raioCabeca;

  return (
    <svg
      className="avatar-portrait"
      viewBox="0 0 100 100"
      width={tamanho}
      height={tamanho}
      role={rotulo ? 'img' : 'presentation'}
      aria-label={rotulo}
      aria-hidden={rotulo ? undefined : true}
    >
      {/* Ombros — ancoram o retrato sem virar corpo inteiro */}
      <path
        d={`M ${cx - r * 1.7} 100 q ${r * 0.35} ${-r * 1.15} ${r * 1.7} ${-r * 1.15}
            q ${r * 1.35} 0 ${r * 1.7} ${r * 1.15} z`}
        fill={pele}
        opacity={0.35}
      />

      {/* Pescoço */}
      <rect
        x={cx - r * 0.28}
        y={cy + r * 0.55}
        width={r * 0.56}
        height={r * 0.7}
        fill={pele}
        opacity={0.85}
      />

      {/* Cabeça */}
      <ellipse cx={cx} cy={cy} rx={r} ry={r * 1.08} fill={pele} />

      {/* Cabelo por trás não é necessário: as silhuetas já cobrem o topo */}
      {desenharCabelo(forma, cabelo, cx, cy, r, p.escalaCabelo)}

      {/* Olhos */}
      <circle cx={cx - r * 0.38} cy={p.olhoY} r={p.raioOlho} fill={olhos} />
      <circle cx={cx + r * 0.38} cy={p.olhoY} r={p.raioOlho} fill={olhos} />

      {/* Boca — traço discreto, expressão neutra */}
      <path
        d={`M ${cx - r * 0.24} ${cy + r * 0.48} q ${r * 0.24} ${r * 0.18} ${r * 0.48} 0`}
        stroke="rgba(0,0,0,0.38)"
        strokeWidth={1.4}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
};
