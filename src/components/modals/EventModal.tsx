import React from 'react';
import { GameEvent } from '../../types';
import { HelpCircle, Sparkles, BookOpen, Briefcase, Heart, DollarSign, Activity } from 'lucide-react';

interface EventModalProps {
  evento: GameEvent;
  onEscolherOpcao: (opcaoId: string) => void;
}

export const EventModal: React.FC<EventModalProps> = ({
  evento,
  onEscolherOpcao
}) => {
  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'escola': return <BookOpen size={22} />;
      case 'trabalho': return <Briefcase size={22} />;
      case 'romance': return <Heart size={22} />;
      case 'dinheiro': return <DollarSign size={22} />;
      case 'saude': return <Activity size={22} />;
      case 'infancia':
      case 'adolescencia': return <Sparkles size={22} />;
      default: return <HelpCircle size={22} />;
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-icon">
            {getCategoryIcon(evento.categoria)}
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--primary)', fontWeight: 700 }}>
              {evento.categoria}
            </div>
            <h2 className="modal-title">{evento.titulo}</h2>
          </div>
        </div>

        <p className="modal-desc">{evento.descricao}</p>

        <div className="modal-options-list">
          {evento.opcoes.map(opcao => (
            <button
              key={opcao.id}
              className="option-btn"
              onClick={() => onEscolherOpcao(opcao.id)}
            >
              <span className="option-title">{opcao.texto}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
