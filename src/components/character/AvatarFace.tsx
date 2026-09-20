import React from 'react';
import type { AparenciaAvatar } from '../../data/avatar/avatarData';
import { construirEspecificacaoAvatar } from '../../presentation/avatarRenderer';

interface AvatarFaceProps {
  idade: number;
  aparencia: AparenciaAvatar;
  /** Tamanho do avatar em pixels (largura = altura). */
  tamanho?: number;
}

/**
 * Rosto vetorial (SVG) desenhado a partir da aparência escolhida na criação
 * da vida — tom de pele, estilo/cor de cabelo, cor dos olhos.
 *
 * Puramente decorativo: `aria-hidden`, pois o rótulo acessível já vem do
 * contêiner (`PersonAvatar`). Sem foto, sem asset externo, sem IA — só
 * formas geométricas simples que se adaptam à idade (rosto mais redondo em
 * bebês, cabelo grisalho a partir dos 65) mantendo a mesma "pessoa".
 */
export const AvatarFace: React.FC<AvatarFaceProps> = ({
  idade,
  aparencia,
  tamanho = 84
}) => {
  const spec = construirEspecificacaoAvatar(idade, aparencia);

  return (
    <svg
      className="avatar-face"
      width={tamanho}
      height={tamanho}
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
    >
      {spec.cabelo.atras && (
        <path d={spec.cabelo.atras} fill={spec.corCabelo} />
      )}

      {/* Rosto */}
      <ellipse
        cx="50"
        cy={spec.simplificado ? 54 : 52}
        rx={26 * spec.escalaRosto}
        ry={28 * spec.escalaRosto}
        fill={spec.corPele}
      />

      {/* Orelhas */}
      <circle cx={50 - 26 * spec.escalaRosto} cy="52" r="4.5" fill={spec.corPele} />
      <circle cx={50 + 26 * spec.escalaRosto} cy="52" r="4.5" fill={spec.corPele} />

      {/* Olhos */}
      <circle cx="40" cy="50" r="3.4" fill={spec.corOlhos} />
      <circle cx="60" cy="50" r="3.4" fill={spec.corOlhos} />

      {/* Sobrancelhas discretas */}
      <path
        d="M 35 44 Q 40 41 45 44"
        stroke={spec.corCabelo}
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 55 44 Q 60 41 65 44"
        stroke={spec.corCabelo}
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />

      {/* Boca simples */}
      <path
        d="M 42 64 Q 50 69 58 64"
        stroke="rgba(0,0,0,0.35)"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />

      {/* Rugas discretas (idoso): dois traços curtos perto dos olhos. */}
      {spec.mostrarRugas && (
        <>
          <path
            d="M 30 52 Q 33 53 35 55"
            stroke="rgba(0,0,0,0.18)"
            strokeWidth="1"
            fill="none"
          />
          <path
            d="M 70 52 Q 67 53 65 55"
            stroke="rgba(0,0,0,0.18)"
            strokeWidth="1"
            fill="none"
          />
        </>
      )}

      {spec.cabelo.frente && (
        <path d={spec.cabelo.frente} fill={spec.corCabelo} />
      )}
    </svg>
  );
};
