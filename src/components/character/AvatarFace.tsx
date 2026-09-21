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
 * Retrato vetorial — Avatar 2.0.
 *
 * Este componente não decide NADA sobre o desenho: toda a geometria e toda
 * a cor vêm de `presentation/avatarRenderer` (puro e testável). Aqui só
 * existe a ORDEM DE PINTURA, que é o que faz as camadas se sobreporem como
 * num retrato de verdade:
 *
 *   volume do cabelo (atrás) → ombros → pescoço → sombra sob o queixo →
 *   orelhas → cabeça → sombra lateral → olhos → sobrancelhas → nariz →
 *   boca → barba → marcas de idade → cabelo da frente → textura de cachos
 *
 * As orelhas vêm ANTES da cabeça de propósito: a cabeça cobre a parte
 * interna delas, que é como a orelha se encaixa no crânio. E o cabelo da
 * frente vem por último porque é ele que define a linha de implantação
 * sobre a testa já pintada.
 *
 * Decorativo: `aria-hidden`, pois o rótulo acessível vem do contêiner
 * (`PersonAvatar`). Sem foto, sem asset externo, sem IA.
 */
export const AvatarFace: React.FC<AvatarFaceProps> = ({
  idade,
  aparencia,
  tamanho = 84
}) => {
  const spec = construirEspecificacaoAvatar(idade, aparencia);
  const { paleta: c, proporcoes: p } = spec;

  return (
    <svg
      className="avatar-face"
      width={tamanho}
      height={tamanho}
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
      data-categoria={spec.categoria}
    >
      {/* ---------------------------------------------- cabelo (volume atrás) */}
      {spec.cabelo.atrasTodos.map((d, i) => (
        <path key={`cabelo-atras-${i}`} d={d} fill={c.cabeloSombra} />
      ))}

      {/* -------------------------------------------------------- busto */}
      {/* O pescoço fica em sombra própria: recebe menos luz que o rosto e
          é isso que o faz recuar para trás do queixo. */}
      <path d={spec.pescoco} fill={c.peleSombra} />
      <path d={spec.pescoco} fill={c.traco} opacity="0.14" />
      <path d={spec.ombros} fill={c.roupa} />
      <path d={spec.sombraPescoco} fill={c.traco} opacity="0.22" />

      {/* ------------------------------------------------------- orelhas */}
      {/* Cor quase igual à do rosto: a orelha é parte da cabeça, não um
          apêndice. Só a concha, desenhada depois, dá o relevo. */}
      {spec.orelhas.map((orelha, i) => (
        <path key={`orelha-${i}`} d={orelha.forma} fill={c.pele} />
      ))}
      {spec.orelhas.map((orelha, i) => (
        <path key={`orelha-sombra-${i}`} d={orelha.forma} fill={c.traco} opacity="0.07" />
      ))}

      {/* -------------------------------------------------------- cabeça */}
      <path d={spec.cabeca} fill={c.pele} />
      <path d={spec.sombraLateral} fill={c.peleSombra} opacity="0.8" />

      {spec.orelhas.map((orelha, i) => (
        <path
          key={`concha-${i}`}
          d={orelha.concha}
          fill="none"
          stroke={c.tracoSuave}
          strokeWidth={spec.tracoFino * 0.7}
          strokeLinecap="round"
          opacity="0.5"
        />
      ))}

      {/* --------------------------------------------------------- olhos */}
      {spec.olhos.map((olho, i) => (
        <g key={`olho-${i}`}>
          <path d={olho.abertura} fill={c.esclera} />
          <circle cx={olho.centroIris.x} cy={olho.centroIris.y} r={olho.raioIris} fill={c.olhos} />
          <circle
            cx={olho.centroIris.x}
            cy={olho.centroIris.y}
            r={olho.raioPupila}
            fill="#14100e"
          />
          {/* Brilho: um ponto só, deslocado — é o que dá vida ao olhar. */}
          <circle
            cx={olho.centroIris.x + olho.raioIris * 0.38}
            cy={olho.centroIris.y - olho.raioIris * 0.42}
            r={olho.raioIris * 0.24}
            fill="#ffffff"
            opacity="0.85"
          />
          {/* A abertura recorta a íris: sem isso o olho vira uma bola. */}
          <path d={olho.abertura} fill="none" stroke={c.pele} strokeWidth={spec.tracoFino * 2.4} />
          <path d={olho.abertura} fill="none" stroke={c.traco} strokeWidth={spec.tracoFino * 0.5} opacity="0.55" />
          <path
            d={olho.palpebraSuperior}
            fill="none"
            stroke={c.traco}
            strokeWidth={spec.tracoFino * 1.15}
            strokeLinecap="round"
          />
          {!spec.simplificado && (
            <path
              d={olho.vinco}
              fill="none"
              stroke={c.tracoSuave}
              strokeWidth={spec.tracoFino * 0.45}
              strokeLinecap="round"
              opacity="0.45"
            />
          )}
        </g>
      ))}

      {/* -------------------------------------------------- sobrancelhas */}
      {spec.sobrancelhas.map((d, i) => (
        <path key={`sobrancelha-${i}`} d={d} fill={c.cabeloSombra} opacity={spec.simplificado ? 0.28 : 0.9} />
      ))}

      {/* --------------------------------------------------------- nariz */}
      {!spec.simplificado && (
        <path
          d={spec.nariz}
          fill="none"
          stroke={c.tracoSuave}
          strokeWidth={spec.tracoFino * 0.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.62"
        />
      )}

      {/* ---------------------------------------------------------- boca */}
      {!spec.simplificado && (
        <path
          d={spec.boca.filtro}
          fill="none"
          stroke={c.tracoSuave}
          strokeWidth={spec.tracoFino * 0.4}
          strokeLinecap="round"
          opacity="0.3"
        />
      )}
      <path d={spec.boca.labioInferior} fill={c.labios} opacity={spec.simplificado ? 0.35 : 0.5} />
      <path
        d={spec.boca.linha}
        fill="none"
        stroke={c.traco}
        strokeWidth={spec.tracoFino * 0.95}
        strokeLinecap="round"
      />

      {/* --------------------------------------------------------- barba */}
      {spec.barba.map((d, i) => (
        <path key={`barba-${i}`} d={d} fill={c.cabelo} opacity="0.94" />
      ))}

      {/* ----------------------------------------------- marcas de idade */}
      <g fill="none" stroke={c.tracoSuave} strokeLinecap="round" opacity="0.4">
        {spec.marcas.nasogenianos.map((d, i) => (
          <path key={`nasogeniano-${i}`} d={d} strokeWidth={spec.tracoFino * 0.55} />
        ))}
        {spec.marcas.pesDeGalinha.map((d, i) => (
          <path key={`pe-galinha-${i}`} d={d} strokeWidth={spec.tracoFino * 0.4} />
        ))}
        {spec.marcas.testa.map((d, i) => (
          <path key={`testa-${i}`} d={d} strokeWidth={spec.tracoFino * 0.45} />
        ))}
        {spec.marcas.olheiras.map((d, i) => (
          <path key={`olheira-${i}`} d={d} strokeWidth={spec.tracoFino * 0.4} opacity="0.7" />
        ))}
      </g>

      {/* ------------------------------------------- cabelo (frente/topo) */}
      {spec.cabelo.frenteTodos.map((d, i) => (
        <path key={`cabelo-frente-${i}`} d={d} fill={c.cabelo} />
      ))}

      {/* Textura de cachos: traços sobre a massa, nunca formas fechadas. */}
      {spec.cabelo.textura.map((d, i) => (
        <path
          key={`cacho-${i}`}
          d={d}
          fill="none"
          stroke={c.cabeloSombra}
          strokeWidth={0.9}
          strokeLinecap="round"
          opacity="0.75"
        />
      ))}

      {/* Luz no alto do cabelo: uma única faixa discreta, sem gradiente. */}
      {spec.cabelo.frenteTodos.length > 0 && (
        <path
          d={`M ${50 - p.wCranio * 0.5} ${p.yTopo + 3.2} C ${50 - p.wCranio * 0.18} ${p.yTopo + 1.1}, ${50 + p.wCranio * 0.18} ${p.yTopo + 1.4}, ${50 + p.wCranio * 0.46} ${p.yTopo + 4}`}
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.14"
        />
      )}
    </svg>
  );
};
