import React, { useState } from 'react';
import { DatingCandidate, gerarCandidatosNamoro } from '../../systems/relationshipSystem';
import { Character } from '../../types';
import { getStatColor } from '../../utils/formatters';
import { X, Heart, Briefcase, RefreshCw } from 'lucide-react';

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
  const [candidatos, setCandidatos] = useState<DatingCandidate[]>(() =>
    gerarCandidatosNamoro('todos', personagem.idade)
  );

  const atualizarCandidatos = () => {
    setCandidatos(gerarCandidatosNamoro('todos', personagem.idade));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '580px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="modal-title">Encontros & Relacionamentos</h2>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Pessoas interessantes da sua região procurando um relacionamento
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {candidatos.map((cand, idx) => (
            <div
              key={idx}
              style={{
                background: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-card)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                  {cand.nome} {cand.sobrenome}, {cand.idade} anos
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--accent-amber)' }}>
                  <Briefcase size={14} />
                  <span>{cand.profissao}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  "{cand.personalidade}"
                </div>
                <div style={{ display: 'flex', gap: '14px', marginTop: '4px', fontSize: '0.8rem' }}>
                  <span style={{ color: getStatColor(cand.aparencia) }}>
                    Aparência: {cand.aparencia}%
                  </span>
                  <span style={{ color: getStatColor(cand.inteligencia) }}>
                    Inteligência: {cand.inteligencia}%
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  onIniciarNamoro(cand);
                  onClose();
                }}
                style={{
                  background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
                  color: '#fff',
                  padding: '10px 18px',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(244, 63, 94, 0.3)'
                }}
              >
                <Heart size={16} fill="#fff" />
                <span>Namorar</span>
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={atualizarCandidatos}
          className="btn-acao-secundaria"
          style={{ justifyContent: 'center', padding: '10px' }}
        >
          <RefreshCw size={16} />
          <span>Ver Outros Perfis</span>
        </button>
      </div>
    </div>
  );
};
