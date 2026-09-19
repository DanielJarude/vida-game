import React from 'react';
import { Character, EconomyState, GameEvent, PersonalityState } from '../../types';
import { avaliarRequisitoOpcao } from '../../systems/eventSystem';
import { HelpCircle, Sparkles, BookOpen, Briefcase, Heart, DollarSign, Activity } from 'lucide-react';

interface EventModalProps {
  evento: GameEvent;
  personagem: Character;
  economia: EconomyState;
  personalidade?: PersonalityState | null;
  onEscolherOpcao: (opcaoId: string) => void;
}

export const EventModal: React.FC<EventModalProps> = ({
  evento,
  personagem,
  economia,
  personalidade,
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

  const getCategoriaLabel = (cat: string) => {
    const rotulos: Record<string, string> = {
      infancia: 'Infância',
      escola: 'Escola',
      adolescencia: 'Adolescência',
      familia: 'Família',
      amizade: 'Amizade',
      romance: 'Romance',
      trabalho: 'Trabalho',
      dinheiro: 'Dinheiro',
      saude: 'Saúde',
      cotidiano: 'Cotidiano'
    };
    return rotulos[cat] || cat;
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={evento.titulo}>
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-icon">
            {getCategoryIcon(evento.categoria)}
          </div>
          <div>
            <div className="modal-categoria">{getCategoriaLabel(evento.categoria)}</div>
            <h2 className="modal-title">{evento.titulo}</h2>
          </div>
        </div>

        <p className="modal-desc">{evento.descricao}</p>

        <div className="modal-options-list">
          {evento.opcoes.map(opcao => {
            const requisito = avaliarRequisitoOpcao(opcao, personagem, economia, personalidade ?? undefined);
            return (
              <button
                key={opcao.id}
                className="option-btn"
                onClick={() => onEscolherOpcao(opcao.id)}
                disabled={!requisito.aprovado}
              >
                <span className="option-title">{opcao.texto}</span>
                {!requisito.aprovado && requisito.motivo && (
                  <span className="option-motivo">{requisito.motivo}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
