import React, { useState } from 'react';
import {
  DatingCandidate,
  gerarCandidatosNamoro
} from '../../systems/relationshipSystem';
import { Character } from '../../types';
import { useModalBehavior } from '../common/useModalBehavior';
import { X } from 'lucide-react';

interface DatingModalProps {
  personagem: Character;
  onClose: () => void;
  onIniciarNamoro: (candidato: DatingCandidate) => void;
}

export const DatingModal: React.FC<DatingModalProps> = ({
  personagem,
  onClose,
  onIniciarNamoro
}) => {
  const containerRef = useModalBehavior<HTMLDivElement>({ onClose });

  const [candidatos, setCandidatos] = useState<DatingCandidate[]>(() =>
    gerarCandidatosNamoro('todos', personagem.idade)
  );

  const atualizarCandidatos = () => {
    setCandidatos(gerarCandidatosNamoro('todos', personagem.idade));
  };

  const tituloId = 'encontros-titulo';

  return (
    <div className="modal-overlay">
      <div
        className="modal-surface"
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        ref={containerRef}
        tabIndex={-1}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 'var(--space-4)'
          }}
        >
          <div>
            <h2 className="event-scene__title" id={tituloId} style={{ marginBottom: 'var(--space-1)' }}>
              Conhecer pessoas
            </h2>
            <p className="action-row__detail">
              Pessoas da sua região abertas a um relacionamento.
            </p>
          </div>
          <button onClick={onClose} className="icon-button" aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <div className="event-scene__divider" role="presentation" />

        <div className="action-list">
          {candidatos.map((cand, idx) => (
            <div key={idx} className="action-row">
              <div className="action-row__body">
                <p className="action-row__title">
                  {cand.nome} {cand.sobrenome}
                </p>
                <p className="action-row__detail">
                  {cand.idade} anos · {cand.profissao}
                </p>
                <p className="action-row__detail">{cand.personalidade}</p>
              </div>
              <div className="action-row__action">
                <button
                  className="btn btn--primary"
                  onClick={() => {
                    onIniciarNamoro(cand);
                    onClose();
                  }}
                >
                  Se aproximar
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 'var(--space-5)' }}>
          <button onClick={atualizarCandidatos} className="btn btn--ghost btn--block">
            Ver outras pessoas
          </button>
        </div>
      </div>
    </div>
  );
};
