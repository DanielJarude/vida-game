import React from 'react';
import { Character, EconomyState } from '../../types';
import { formatarDinheiro, formatarIdade } from '../../utils/formatters';
import { Volume2, VolumeX, Home, Award } from 'lucide-react';

interface HeaderProps {
  personagem: Character | null;
  economia: EconomyState | null;
  situacao: string;
  somLigado: boolean;
  onToggleSom: () => void;
  onGoHome: () => void;
  onOpenStats: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  personagem,
  economia,
  situacao,
  somLigado,
  onToggleSom,
  onGoHome,
  onOpenStats
}) => {
  return (
    <header className="main-header">
      <button
        className="header-brand"
        onClick={onGoHome}
        title="Menu Principal"
        style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
      >
        <span aria-hidden>🌱</span>
        <span>VIDA</span>
      </button>

      {personagem && (
        <div className="header-identity" aria-label="Identidade do personagem">
          <span className="identity-name">
            {personagem.nome} {personagem.sobrenome}
          </span>
          <span className="identity-meta">
            {formatarIdade(personagem.idade)} · {personagem.cidade}, {personagem.estado}
          </span>
          <span className="identity-situacao">{situacao}</span>
          {economia && (
            <span className="identity-money" title="Saldo em conta">
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
          aria-label={somLigado ? 'Desativar sons' : 'Ativar sons'}
        >
          {somLigado ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
        <button
          className="btn-icon"
          onClick={onOpenStats}
          title="Estatísticas & Hall da Fama"
          aria-label="Estatísticas e Hall da Fama"
        >
          <Award size={18} />
        </button>
        <button
          className="btn-icon"
          onClick={onGoHome}
          title="Menu Principal"
          aria-label="Menu principal"
        >
          <Home size={18} />
        </button>
      </div>
    </header>
  );
};
