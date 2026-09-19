import React, { useState } from 'react';
import { FamilyInteractionType, FamilyMember } from '../../types';
import { getStatColor, getRotuloParentesco } from '../../utils/formatters';
import { Disponibilidade } from '../../systems/availabilitySystem';
import { X, MessageCircle, Clock, Gift, MessageSquareWarning, DollarSign, HelpCircle, HeartHandshake, Baby, UserMinus } from 'lucide-react';

interface FamilyModalProps {
  membro: FamilyMember;
  onClose: () => void;
  onInteragir: (tipo: FamilyInteractionType, presenteTipo?: 'barato' | 'medio' | 'luxo') => void;
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
  const [showPresenteMenu, setShowPresenteMenu] = useState(false);
  const isParceiro = ['namorado', 'namorada', 'noivo', 'noiva', 'esposo', 'esposa'].includes(membro.tipo);
  const isCasado = ['esposo', 'esposa'].includes(membro.tipo);

  const estadoBotao = (tipo: FamilyInteractionType): { desabilitado: boolean; motivo?: string } => {
    const disp = verificarInteracao(tipo);
    return {
      desabilitado: disp.kind !== 'disponivel',
      motivo: disp.kind === 'bloqueado' ? disp.motivo : undefined
    };
  };

  const AcaoFamiliar: React.FC<{
    tipo: FamilyInteractionType;
    icone: React.ReactNode;
    titulo: string;
    descricao: string;
    corTitulo?: string;
  }> = ({ tipo, icone, titulo, descricao, corTitulo }) => {
    const { desabilitado, motivo } = estadoBotao(tipo);
    return (
      <button
        className="option-btn"
        onClick={() => { if (!desabilitado) { onInteragir(tipo); onClose(); } }}
        disabled={desabilitado}
        aria-label={`${titulo}${motivo ? ` — ${motivo}` : ''}`}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {icone}
          <div>
            <strong style={corTitulo ? { color: corTitulo } : undefined}>{titulo}</strong>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {motivo || descricao}
            </div>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={membro.nome}>
      <div className="modal-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 className="modal-title">{membro.nome} {membro.sobrenome}</h2>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '2px' }}>
              {getRotuloParentesco(membro.tipo)} • {membro.idade} anos • {membro.profissao || membro.situacaoAtual || 'Em casa'}
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" aria-label="Fechar">
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

        {/* Menu de Ações (disponibilidade vem da política central) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <AcaoFamiliar
            tipo="conversar"
            icone={<MessageCircle size={18} color="var(--accent-blue)" />}
            titulo="Conversar"
            descricao="Bater um papo amigável sobre o dia"
          />

          <AcaoFamiliar
            tipo="passar_tempo"
            icone={<Clock size={18} color="var(--primary)" />}
            titulo="Passar Tempo Juntos"
            descricao="Fazer um passeio ou almoço especial"
          />

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
          {(membro.tipo === 'pai' || membro.tipo === 'mae') && idadeJogador >= 6 && (
            <AcaoFamiliar
              tipo="pedir_dinheiro"
              icone={<DollarSign size={18} color="var(--accent-amber)" />}
              titulo="Pedir Dinheiro"
              descricao="Pedir uma ajuda financeira para suas despesas"
            />
          )}

          {/* Pedir Conselho */}
          {idadeJogador >= 6 && (
            <AcaoFamiliar
              tipo="pedir_conselho"
              icone={<HelpCircle size={18} color="var(--accent-purple)" />}
              titulo="Pedir Conselho de Vida"
              descricao="Ouvir a sabedoria e experiência do familiar"
            />
          )}

          {/* Ações Especiais de Parceiro Romântico (adultos) */}
          {isParceiro && idadeJogador >= 18 && (
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

              {onTerFilho && (
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
          <AcaoFamiliar
            tipo="discutir"
            icone={<MessageSquareWarning size={18} color="var(--accent-rose)" />}
            titulo="Discutir"
            descricao="Iniciar uma discussão acalorada"
            corTitulo="var(--accent-rose)"
          />
        </div>
      </div>
    </div>
  );
};
