import React, { useState } from 'react';
import { FamilyInteractionType, FamilyMember } from '../../types';
import { Disponibilidade } from '../../systems/availabilitySystem';
import { apresentarRelacionamento } from '../../presentation/relationshipPresentation';
import { useModalBehavior } from '../common/useModalBehavior';
import { X, Lock } from 'lucide-react';

interface FamilyModalProps {
  membro: FamilyMember;
  onClose: () => void;
  onInteragir: (
    tipo: FamilyInteractionType,
    presenteTipo?: 'barato' | 'medio' | 'luxo'
  ) => void;
  onPedirCasamento?: () => void;
  onTerFilho?: () => void;
  onTerminar?: () => void;
  idadeJogador: number;
  verificarInteracao: (tipo: FamilyInteractionType) => Disponibilidade;
}

export const FamilyModal: React.FC<FamilyModalProps> = ({
  membro,
  onClose,
  onInteragir,
  onPedirCasamento,
  onTerFilho,
  onTerminar,
  idadeJogador,
  verificarInteracao
}) => {
  const containerRef = useModalBehavior<HTMLDivElement>({ onClose });
  const [showPresenteMenu, setShowPresenteMenu] = useState(false);

  const isParceiro = [
    'namorado',
    'namorada',
    'noivo',
    'noiva',
    'esposo',
    'esposa'
  ].includes(membro.tipo);
  const isCasado = ['esposo', 'esposa'].includes(membro.tipo);

  const pessoa = apresentarRelacionamento(membro);
  const tituloId = 'familia-modal-titulo';

  /** Linha de interação; motivo de bloqueio sempre em texto. */
  const Acao: React.FC<{
    tipo: FamilyInteractionType;
    titulo: string;
    descricao: string;
  }> = ({ tipo, titulo, descricao }) => {
    const disp = verificarInteracao(tipo);
    if (disp.kind === 'oculto') return null;

    const desabilitado = disp.kind !== 'disponivel';
    const motivo = disp.kind === 'bloqueado' ? disp.motivo : undefined;

    return (
      <button
        className="event-choice"
        onClick={() => {
          if (!desabilitado) {
            onInteragir(tipo);
            onClose();
          }
        }}
        disabled={desabilitado}
      >
        <span className="event-choice__indicator" aria-hidden="true" />
        <span className="event-choice__body">
          <span className="event-choice__title">{titulo}</span>
          <span className="event-choice__hint">{descricao}</span>
          {motivo && (
            <span className="event-choice__reason">
              <Lock size={12} aria-hidden="true" />
              {motivo}
            </span>
          )}
        </span>
      </button>
    );
  };

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
              {membro.nome} {membro.sobrenome}
            </h2>
            <p className="action-row__detail">
              {pessoa.relacao} ·{' '}
              {membro.idade === 1 ? '1 ano' : `${membro.idade} anos`}
              {membro.profissao ? ` · ${membro.profissao}` : ''}
            </p>
            {/* Proximidade em palavras, não percentual. */}
            <p className="action-row__detail">
              Relação {pessoa.rotuloProximidade.toLowerCase()}
            </p>
          </div>

          <button onClick={onClose} className="icon-button" aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <div className="event-scene__divider" role="presentation" />

        <div className="event-choices">
          <Acao
            tipo="conversar"
            titulo="Conversar"
            descricao="Bater um papo sobre o dia"
          />
          <Acao
            tipo="passar_tempo"
            titulo="Passar tempo junto"
            descricao="Um passeio ou uma refeição sem pressa"
          />

          {!showPresenteMenu ? (
            <button className="event-choice" onClick={() => setShowPresenteMenu(true)}>
              <span className="event-choice__indicator" aria-hidden="true" />
              <span className="event-choice__body">
                <span className="event-choice__title">Dar um presente</span>
                <span className="event-choice__hint">Escolher uma lembrança</span>
              </span>
            </button>
          ) : (
            <>
              {[
                { tipo: 'barato' as const, titulo: 'Lembrança simples', valor: 'R$ 50' },
                { tipo: 'medio' as const, titulo: 'Presente especial', valor: 'R$ 250' },
                { tipo: 'luxo' as const, titulo: 'Presente de luxo', valor: 'R$ 1.200' }
              ].map(p => (
                <button
                  key={p.tipo}
                  className="event-choice"
                  onClick={() => {
                    onInteragir('dar_presente', p.tipo);
                    onClose();
                  }}
                >
                  <span className="event-choice__indicator" aria-hidden="true" />
                  <span className="event-choice__body">
                    <span className="event-choice__title">{p.titulo}</span>
                    <span className="event-choice__hint">{p.valor}</span>
                  </span>
                </button>
              ))}
            </>
          )}

          {(membro.tipo === 'pai' || membro.tipo === 'mae') && (
            <Acao
              tipo="pedir_dinheiro"
              titulo="Pedir dinheiro"
              descricao="Uma ajuda para suas despesas"
            />
          )}

          <Acao
            tipo="pedir_conselho"
            titulo="Pedir um conselho"
            descricao="Ouvir a experiência de quem já passou por isso"
          />

          {isParceiro && idadeJogador >= 18 && (
            <>
              {!isCasado && onPedirCasamento && (
                <button
                  className="event-choice"
                  onClick={() => {
                    onPedirCasamento();
                    onClose();
                  }}
                >
                  <span className="event-choice__indicator" aria-hidden="true" />
                  <span className="event-choice__body">
                    <span className="event-choice__title">Pedir em casamento</span>
                    <span className="event-choice__hint">Oficializar a relação</span>
                  </span>
                </button>
              )}

              {onTerFilho && (
                <button
                  className="event-choice"
                  onClick={() => {
                    onTerFilho();
                    onClose();
                  }}
                >
                  <span className="event-choice__indicator" aria-hidden="true" />
                  <span className="event-choice__body">
                    <span className="event-choice__title">Ter um filho</span>
                    <span className="event-choice__hint">Aumentar a família</span>
                  </span>
                </button>
              )}

              {onTerminar && (
                <button
                  className="event-choice"
                  onClick={() => {
                    onTerminar();
                    onClose();
                  }}
                >
                  <span className="event-choice__indicator" aria-hidden="true" />
                  <span className="event-choice__body">
                    <span className="event-choice__title">Terminar o relacionamento</span>
                    <span className="event-choice__hint">Encerrar a relação</span>
                  </span>
                </button>
              )}
            </>
          )}

          <Acao
            tipo="discutir"
            titulo="Discutir"
            descricao="Levantar a voz sobre algo mal resolvido"
          />
        </div>
      </div>
    </div>
  );
};
