import React from 'react';
import { Character, EconomyState } from '../../types';
import { formatarDinheiro, formatarIdade } from '../../utils/formatters';
import { Volume2, VolumeX, Home, Award } from 'lucide-react';

interface HeaderProps {
  personagem: Character | null;
  economia: EconomyState | null;
  somLigado: boolean;
  onToggleSom: () => void;
  onGoHome: () => void;
  onOpenStats: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  personagem,
  economia,
  somLigado,
  onToggleSom,
  onGoHome,
  onOpenStats
}) => {
  return (
    <header className="main-header">
      <div className="header-brand" onClick={onGoHome} style={{ cursor: 'pointer' }}>
        <span>🌱</span>
        <span>VIDA</span>
      </div>

      {personagem && (
        <div className="header-char-info">
          <span className="char-name-badge">
            {personagem.nome} {personagem.sobrenome}
          </span>
          <span className="char-age-badge">
            {formatarIdade(personagem.idade)}
          </span>
          {economia && (
            <span className="char-money-badge">
              {formatarDinheiro(economia.dinheiro)}
            </span>
          )}
        </div>
      )}

      <div className="header-controls">
        <button
          className="btn-icon"
          onClick={onToggleSom}
          title={somLigado ? 'Desativar Sons' : 'Ativar Sons'}
        >
          {somLigado ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
        <button
          className="btn-icon"
          onClick={onOpenStats}
          title="Estatísticas & Hall da Fama"
        >
          <Award size={18} />
        </button>
        <button
          className="btn-icon"
          onClick={onGoHome}
          title="Menu Principal"
        >
          <Home size={18} />
        </button>
      </div>
    </header>
  );
};
