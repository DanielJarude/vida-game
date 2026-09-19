import React, { useState } from 'react';
import { FamilyMember } from '../../types';
import { FamilyInteractionType } from '../../systems/familySystem';
import { getStatColor } from '../../utils/formatters';
import { X, MessageCircle, Clock, Gift, MessageSquareWarning, DollarSign, HelpCircle, HeartHandshake, Baby, UserMinus } from 'lucide-react';

interface FamilyModalProps {
  membro: FamilyMember;
  onClose: () => void;
  onInteragir: (tipo: FamilyInteractionType, presenteTipo?: 'barato' | 'medio' | 'luxo') => void;
  onPedirCasamento?: () => void;
  onTerFilho?: () => void;
  onTerminar?: () => void;
  idadeJogador: number;
}

export const FamilyModal: React.FC<FamilyModalProps> = ({
  membro,
  onClose,
  onInteragir,
  onPedirCasamento,
  onTerFilho,
  onTerminar,
  idadeJogador
}) => {
  const [showPresenteMenu, setShowPresenteMenu] = useState(false);
  const isParceiro = ['namorado', 'namorada', 'noivo', 'noiva', 'esposo', 'esposa'].includes(membro.tipo);
  const isCasado = ['esposo', 'esposa'].includes(membro.tipo);

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 className="modal-title">{membro.nome} {membro.sobrenome}</h2>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '2px' }}>
              {membro.tipo.toUpperCase()} • {membro.idade} anos • {membro.profissao || membro.situacaoAtual || 'Em casa'}
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        {/* Nível de Relacionamento */}
        <div style={{ background: 'var(--bg-card-subtle)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
            <span>Nível de Relacionamento</span>
            <strong style={{ color: getStatColor(membro.relacionamento) }}>{membro.relacionamento}%</strong>
          </div>
          <div className="stat-bar-track">
            <div
              className="stat-bar-fill"
              style={{ width: `${membro.relacionamento}%`, backgroundColor: getStatColor(membro.relacionamento) }}
            />
          </div>
        </div>

        {/* Menu de Ações */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            className="option-btn"
            onClick={() => { onInteragir('conversar'); onClose(); }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MessageCircle size={18} color="var(--accent-blue)" />
              <div>
                <strong>Conversar</strong>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Bater um papo amigável sobre o dia</div>
              </div>
            </div>
          </button>

          <button
            className="option-btn"
            onClick={() => { onInteragir('passar_tempo'); onClose(); }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={18} color="var(--primary)" />
              <div>
                <strong>Passar Tempo Juntos</strong>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Fazer um passeio ou almoço especial</div>
              </div>
            </div>
          </button>

          {/* Dar Presente */}
          {!showPresenteMenu ? (
            <button
              className="option-btn"
              onClick={() => setShowPresenteMenu(true)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Gift size={18} color="var(--accent-amber)" />
                <div>
                  <strong>Dar um Presente</strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Escolher uma lembrança carinhosa</div>
                </div>
              </div>
            </button>
          ) : (
            <div style={{ background: 'var(--bg-card-subtle)', padding: '10px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Escolha o Presente:</div>
              <button
                className="option-btn"
                onClick={() => { onInteragir('dar_presente', 'barato'); onClose(); }}
              >
                <span>Lembrancinha Simples (R$ 50)</span>
              </button>
              <button
                className="option-btn"
                onClick={() => { onInteragir('dar_presente', 'medio'); onClose(); }}
              >
                <span>Presente Especial (R$ 250)</span>
              </button>
              <button
                className="option-btn"
                onClick={() => { onInteragir('dar_presente', 'luxo'); onClose(); }}
              >
                <span>Presente de Luxo (R$ 1.200)</span>
              </button>
            </div>
          )}

          {/* Pedir Dinheiro (Pais) */}
          {(membro.tipo === 'pai' || membro.tipo === 'mae') && (
            <button
              className="option-btn"
              onClick={() => { onInteragir('pedir_dinheiro'); onClose(); }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <DollarSign size={18} color="var(--accent-amber)" />
                <div>
                  <strong>Pedir Dinheiro</strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Pedir uma ajuda financeira para suas despesas</div>
                </div>
              </div>
            </button>
          )}

          {/* Pedir Conselho */}
          <button
            className="option-btn"
            onClick={() => { onInteragir('pedir_conselho'); onClose(); }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <HelpCircle size={18} color="var(--accent-purple)" />
              <div>
                <strong>Pedir Conselho de Vida</strong>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Ouvir a sabedoria e experiência do familiar</div>
              </div>
            </div>
          </button>

          {/* Ações Especiais de Parceiro Romântico */}
          {isParceiro && (
            <>
              {!isCasado && onPedirCasamento && (
                <button
                  className="option-btn"
                  onClick={() => { onPedirCasamento(); onClose(); }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <HeartHandshake size={18} color="var(--accent-rose)" />
                    <div>
                      <strong>Pedir em Casamento</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Oficializar o matrimônio</div>
                    </div>
                  </div>
                </button>
              )}

              {onTerFilho && idadeJogador >= 18 && (
                <button
                  className="option-btn"
                  onClick={() => { onTerFilho(); onClose(); }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Baby size={18} color="var(--primary)" />
                    <div>
                      <strong>Ter um Bebê</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Aumentar a família com um filho</div>
                    </div>
                  </div>
                </button>
              )}

              {onTerminar && (
                <button
                  className="option-btn"
                  onClick={() => { onTerminar(); onClose(); }}
                  style={{ borderColor: 'rgba(244, 63, 94, 0.4)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <UserMinus size={18} color="var(--accent-rose)" />
                    <div>
                      <strong style={{ color: 'var(--accent-rose)' }}>Terminar Relacionamento</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Colocar um ponto final na relação</div>
                    </div>
                  </div>
                </button>
              )}
            </>
          )}

          {/* Discutir */}
          <button
            className="option-btn"
            onClick={() => { onInteragir('discutir'); onClose(); }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MessageSquareWarning size={18} color="var(--accent-rose)" />
              <div>
                <strong>Discutir</strong>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Iniciar uma discussão acalorada</div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
