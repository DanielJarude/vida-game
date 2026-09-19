import React from 'react';
import { ContextoAcao, listarVagasCompativeis } from '../../systems/availabilitySystem';
import { formatarDinheiro, getEducationLabel } from '../../utils/formatters';
import { X } from 'lucide-react';

interface JobMarketModalProps {
  ctx: ContextoAcao;
  onClose: () => void;
  onCandidatar: (jobId: string) => void;
}

export const JobMarketModal: React.FC<JobMarketModalProps> = ({
  ctx,
  onClose,
  onCandidatar
}) => {
  // A lista vem da política central (escolaridade, inteligência e idade)
  const vagas = listarVagasCompativeis(ctx);
  const idade = ctx.personagem.idade;
  const notaJuvenil = idade < 18
    ? 'Nesta fase, apenas vagas juvenis aparecem. As demais vagas abrem aos 18 anos.'
    : null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Mercado de Trabalho">
      <div className="modal-card" style={{ maxWidth: '640px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="modal-title">Mercado de Trabalho</h2>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Vagas compatíveis com sua escolaridade ({getEducationLabel(ctx.educacao.nivelAtual)})
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        {notaJuvenil && (
          <div className="acao-bloqueada-motivo" role="status">{notaJuvenil}</div>
        )}

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
                  <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
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
                  className="btn-acao-primaria"
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
