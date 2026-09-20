import React from 'react';
import { FamilyMember, PetInteractionType } from '../../types';
import { Disponibilidade } from '../../systems/availabilitySystem';
import { INTERACOES_PET } from '../../systems/petInteractionSystem';
import { rotularInteracaoPet } from '../../presentation/petPresentation';
import { apresentarRelacionamento } from '../../presentation/relationshipPresentation';
import { useModalBehavior } from '../common/useModalBehavior';
import { X, Lock } from 'lucide-react';

interface PetModalProps {
  membro: FamilyMember;
  onClose: () => void;
  onInteragir: (tipo: PetInteractionType) => void;
  /** Idade do jogador — é ela que decide o rótulo, não a idade do animal. */
  idadeJogador: number;
  verificarInteracao: (tipo: PetInteractionType) => Disponibilidade;
}

/**
 * Interações com um animal de estimação.
 *
 * Modal separado do humano de propósito: a lista de ações vem de
 * `INTERACOES_PET`, não do conjunto humano, então não há como "conversar"
 * ou "pedir conselho" a um cachorro nem por engano. Assim como no fluxo
 * humano, este componente não decide nada — pergunta a disponibilidade e
 * exibe o motivo quando bloqueado.
 */
export const PetModal: React.FC<PetModalProps> = ({
  membro,
  onClose,
  onInteragir,
  idadeJogador,
  verificarInteracao
}) => {
  const containerRef = useModalBehavior<HTMLDivElement>({ onClose });
  const pessoa = apresentarRelacionamento(membro);
  const tituloId = 'pet-modal-titulo';

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
        <div className="person-head">
          <div className="person-head__main">
            <h2 className="person-head__name" id={tituloId}>
              {membro.nome}
            </h2>
            <p className="person-head__relation">{pessoa.relacao}</p>
            <p className="person-head__context">
              {membro.idade === 1 ? '1 ano' : `${membro.idade} anos`}
              {' · convivência '}
              {pessoa.rotuloProximidade.toLowerCase()}
            </p>
          </div>

          <button onClick={onClose} className="icon-button" aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <div className="event-scene__divider" role="presentation" />

        <div className="event-choices">
          {INTERACOES_PET.map(tipo => {
            const disp = verificarInteracao(tipo);
            if (disp.kind === 'oculto') return null;

            const desabilitado = disp.kind !== 'disponivel';
            const motivo = disp.kind === 'bloqueado' ? disp.motivo : undefined;
            const rotulo = rotularInteracaoPet(tipo, idadeJogador);

            return (
              <button
                key={tipo}
                className="event-choice"
                disabled={desabilitado}
                onClick={() => {
                  if (desabilitado) return;
                  onInteragir(tipo);
                  onClose();
                }}
              >
                <span className="event-choice__indicator" aria-hidden="true" />
                <span className="event-choice__body">
                  <span className="event-choice__title">{rotulo.titulo}</span>
                  <span className="event-choice__hint">{rotulo.descricao}</span>
                  {motivo && (
                    <span className="event-choice__reason">
                      <Lock size={12} aria-hidden="true" />
                      {motivo}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
