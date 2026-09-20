import React from 'react';
import { Volume2, VolumeX, Trophy, Home } from 'lucide-react';
import type { Character } from '../../types';

interface GameHeaderProps {
  personagem: Character;
  somLigado: boolean;
  onToggleSom: () => void;
  onGoHome: () => void;
  onOpenStats: () => void;
  children?: React.ReactNode;
}

/**
 * Cabeçalho do jogo: marca, navegação (via children) e o "relógio de vida".
 *
 * A idade fica ancorada no canto direito em toda a navegação — é a variável
 * estruturante do VIDA e não pode depender de rolagem para ser lida.
 */
export const GameHeader: React.FC<GameHeaderProps> = ({
  personagem,
  somLigado,
  onToggleSom,
  onGoHome,
  onOpenStats,
  children
}) => {
  const idadeTexto = personagem.idade === 1 ? '1 ano' : `${personagem.idade} anos`;

  return (
    <header className="shell-header">
      <button className="shell-brand" onClick={onGoHome} aria-label="Menu principal">
        <span className="shell-brand__word">VIDA</span>
        <span className="shell-brand__tagline" aria-hidden="true">
          pequenas escolhas
        </span>
      </button>

      {children}

      <div className="life-clock">
        <span className="life-clock__age">{idadeTexto}</span>
        <span className="life-clock__meta">
          {personagem.anoAtual} · {personagem.cidade}, {personagem.estado}
        </span>
      </div>

      <div className="shell-header__controls">
        <button
          className="icon-button"
          onClick={onToggleSom}
          aria-label={somLigado ? 'Desativar sons' : 'Ativar sons'}
          aria-pressed={somLigado}
        >
          {somLigado ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
        <button
          className="icon-button"
          onClick={onOpenStats}
          aria-label="Vidas anteriores"
        >
          <Trophy size={18} />
        </button>
        <button className="icon-button" onClick={onGoHome} aria-label="Menu principal">
          <Home size={18} />
        </button>
      </div>
    </header>
  );
};
