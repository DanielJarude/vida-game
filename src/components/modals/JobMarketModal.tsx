import React from 'react';
import { Character, EducationState } from '../../types';
import { obterVagasDisponiveis } from '../../systems/careerSystem';
import { formatarDinheiro, getEducationLabel } from '../../utils/formatters';
import { X } from 'lucide-react';

interface JobMarketModalProps {
  personagem: Character;
  educacao: EducationState;
  onClose: () => void;
  onCandidatar: (jobId: string) => void;
}

export const JobMarketModal: React.FC<JobMarketModalProps> = ({
  personagem,
  educacao,
  onClose,
  onCandidatar
}) => {
  const vagas = obterVagasDisponiveis(educacao.nivelAtual, personagem.stats.inteligencia);

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '640px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="modal-title">Mercado de Trabalho</h2>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Vagas compatíveis com sua escolaridade ({getEducationLabel(educacao.nivelAtual)})
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '60vh', overflowY: 'auto' }}>
          {vagas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
              Nenhuma vaga encontrada no momento. Aumente seus estudos e inteligência!
            </div>
          ) : (
            vagas.map(job => (
              <div
                key={job.id}
                style={{
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-card)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                    {job.titulo}
                  </div>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <span>Setor: {job.setor}</span>
                    <span>• {job.horasSemanais}h/sem</span>
                    <span>• Estresse: {job.estresseNivel}/5</span>
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
                    {formatarDinheiro(job.salarioMensal)} /mês (CLT)
                  </div>
                </div>

                <button
                  onClick={() => {
                    onCandidatar(job.id);
                    onClose();
                  }}
                  style={{
                    background: 'var(--primary)',
                    color: '#022c22',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 700,
                    fontSize: '0.85rem'
                  }}
                >
                  Candidatar
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
