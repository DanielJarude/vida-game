import React, { useState } from 'react';
import { Character, FamilyMember, Gender } from '../../types';
import { FamilyInteractionType } from '../../types';
import { FamilyModal } from '../modals/FamilyModal';
import { getStatColor, getRotuloParentesco } from '../../utils/formatters';
import { ContextoAcao, getActionAvailability, IDADE_MINIMA_RELACIONAMENTO_ADULTO } from '../../systems/availabilitySystem';
import { Heart } from 'lucide-react';

interface FamilyTabProps {
  personagem: Character;
  familia: FamilyMember[];
  ctx: ContextoAcao;
  onInteragir: (membroId: string, tipoAcao: FamilyInteractionType, presenteTipo?: 'barato' | 'medio' | 'luxo') => void;
  onPedirCasamento: (parceiroId: string) => void;
  onTerFilho: (parceiroId?: string, nome?: string, genero?: Gender) => void;
  onTerminar: (parceiroId: string) => void;
  onOpenDatingModal: () => void;
}

export const FamilyTab: React.FC<FamilyTabProps> = ({
  personagem,
  familia,
  ctx,
  onInteragir,
  onPedirCasamento,
  onTerFilho,
  onTerminar,
  onOpenDatingModal
}) => {
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);

  const vivos = familia.filter(f => f.vivo);
  const falecidos = familia.filter(f => !f.vivo);

  const parceiros = vivos.filter(f => ['namorado', 'namorada', 'noivo', 'noiva', 'esposo', 'esposa'].includes(f.tipo));
  const filhos = vivos.filter(f => f.tipo === 'filho' || f.tipo === 'filha');
  const paisEirmaos = vivos.filter(f => ['pai', 'mae', 'irmao', 'irma'].includes(f.tipo));
  const pets = vivos.filter(f => f.tipo === 'pet');

  const abrirModal = (membro: FamilyMember) => {
    // Revalida ao abrir: se a tela deixou de ser válida, não abre
    setSelectedMember(membro);
  };

  const verificarInteracao = (tipo: FamilyInteractionType) => {
    if (!selectedMember) return { kind: 'oculto', reasonCode: 'sem_membro' } as const;
    return getActionAvailability(ctx, 'interagir_familia', { membroId: selectedMember.id, tipoInteracao: tipo });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Encontros: sistema adulto (18+) */}
      {personagem.idade >= IDADE_MINIMA_RELACIONAMENTO_ADULTO && (
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="option-btn"
            onClick={onOpenDatingModal}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)',
              borderColor: 'rgba(244, 63, 94, 0.4)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Heart size={20} color="var(--accent-rose)" />
              <div>
                <strong>Conhecer Novas Pessoas</strong>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Aplicativo de relacionamentos e encontros
                </div>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Seção de Parceiros Românticos */}
      {parceiros.length > 0 && (
        <div className="card">
          <h3 className="card-title">
            <span>❤️ Amor & Casamento</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {parceiros.map(membro => (
              <div
                key={membro.id}
                className="option-btn"
                onClick={() => abrirModal(membro)}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div>
                      <strong>{membro.nome} {membro.sobrenome}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {getRotuloParentesco(membro.tipo)} • {membro.idade} anos • {membro.profissao || 'Companheiro(a)'}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: getStatColor(membro.relacionamento), fontWeight: 700, fontSize: '0.9rem' }}>
                      {membro.relacionamento}%
                    </span>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Afeto</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Seção de Filhos */}
      {filhos.length > 0 && (
        <div className="card">
          <h3 className="card-title">
            <span>👶 Filhos</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filhos.map(membro => (
              <div
                key={membro.id}
                className="option-btn"
                onClick={() => abrirModal(membro)}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div>
                      <strong>{membro.nome} {membro.sobrenome}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {getRotuloParentesco(membro.tipo)} • {membro.idade} {membro.idade === 1 ? 'ano' : 'anos'}
                      </div>
                    </div>
                  </div>
                  <span style={{ color: getStatColor(membro.relacionamento), fontWeight: 700 }}>
                    {membro.relacionamento}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Seção de Família de Origem (Pais e Irmãos) */}
      <div className="card">
        <h3 className="card-title">
          <span>👨‍👩‍👧‍👦 Família de Origem</span>
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {paisEirmaos.map(membro => (
            <div
              key={membro.id}
              className="option-btn"
              onClick={() => abrirModal(membro)}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div>
                    <strong>{membro.nome} {membro.sobrenome}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {getRotuloParentesco(membro.tipo)} • {membro.idade} anos • {membro.profissao || 'Família'}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: getStatColor(membro.relacionamento), fontWeight: 700 }}>
                    {membro.relacionamento}%
                  </span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Relação</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Seção de Pets */}
      {pets.length > 0 && (
        <div className="card">
          <h3 className="card-title">
            <span>🐾 Animais de Estimação</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pets.map(membro => (
              <div
                key={membro.id}
                className="option-btn"
                onClick={() => abrirModal(membro)}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div>
                      <strong>{membro.nome}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Pet • {membro.idade} {membro.idade === 1 ? 'ano' : 'anos'} • {membro.situacaoAtual}
                      </div>
                    </div>
                  </div>
                  <span style={{ color: getStatColor(membro.relacionamento), fontWeight: 700 }}>
                    {membro.relacionamento}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Falecidos */}
      {falecidos.length > 0 && (
        <div className="card" style={{ opacity: 0.7 }}>
          <h3 className="card-title">
            <span>🕊️ Memória dos Falecidos</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {falecidos.map(m => (
              <div key={m.id} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', padding: '6px 0' }}>
                • <strong>{m.nome} {m.sobrenome}</strong> ({getRotuloParentesco(m.tipo)}) — Faleceu aos {m.idade} anos em {m.anoMorte} ({m.causaMorte}).
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Interativo do Familiar Selecionado */}
      {selectedMember && (
        <FamilyModal
          membro={selectedMember}
          onClose={() => setSelectedMember(null)}
          onInteragir={(tipo, pres) => onInteragir(selectedMember.id, tipo, pres)}
          onPedirCasamento={() => onPedirCasamento(selectedMember.id)}
          onTerFilho={() => onTerFilho(selectedMember.id)}
          onTerminar={() => onTerminar(selectedMember.id)}
          idadeJogador={personagem.idade}
          verificarInteracao={verificarInteracao}
        />
      )}
    </div>
  );
};
