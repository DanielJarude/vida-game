import React, { useState } from 'react';
import {
  DatingCandidate,
  gerarCandidatosNamoro
} from '../../systems/relationshipSystem';
import { Character, FamilyMember } from '../../types';
import { useModalBehavior } from '../common/useModalBehavior';
import { ROTULO_AMBIENTE, type AmbienteSocial } from '../../systems/social/contextoSocial';
import { X } from 'lucide-react';

interface DatingModalProps {
  personagem: Character;
  /** F6 — quem já faz parte da vida tem prioridade sobre desconhecidos. */
  familia: FamilyMember[];
  onClose: () => void;
  onIniciarNamoro: (candidato: DatingCandidate) => void;
}

export const DatingModal: React.FC<DatingModalProps> = ({
  personagem,
  familia,
  onClose,
  onIniciarNamoro
}) => {
  const containerRef = useModalBehavior<HTMLDivElement>({ onClose });

  // F6 §16 — pessoas que já fazem parte da vida aparecem primeiro; só o que
  // faltar é completado com gente nova.
  const [candidatos, setCandidatos] = useState<DatingCandidate[]>(() =>
    gerarCandidatosNamoro('todos', personagem.idade, familia)
  );

  const atualizarCandidatos = () => {
    setCandidatos(gerarCandidatosNamoro('todos', personagem.idade, familia));
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
              Gente que você já conhece, e algumas pessoas novas.
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
                  {/* F6 — quem já faz parte da vida diz de onde veio; a
                      relação deixa de parecer um perfil de aplicativo. */}
                  {cand.conhecidoDe ? ` · da sua ${ROTULO_AMBIENTE[cand.conhecidoDe as AmbienteSocial] ?? 'convivência'}` : ''}
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
