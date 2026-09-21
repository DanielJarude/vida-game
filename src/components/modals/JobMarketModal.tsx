import React from 'react';
import {
  ContextoAcao,
  listarVagasCompativeis
} from '../../systems/availabilitySystem';
import { formatarDinheiro, getEducationLabel } from '../../utils/formatters';
import { useModalBehavior } from '../common/useModalBehavior';
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
  const containerRef = useModalBehavior<HTMLDivElement>({ onClose });

  // A lista vem da política central (escolaridade, inteligência e idade)
  const vagas = listarVagasCompativeis(ctx);
  const idade = ctx.personagem.idade;
  const notaJuvenil =
    idade < 18
      ? 'Nesta fase aparecem apenas vagas juvenis. As demais abrem aos 18 anos.'
      : null;

  const tituloId = 'vagas-titulo';

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
              Vagas de trabalho
            </h2>
            <p className="action-row__detail">
              Compatíveis com {getEducationLabel(ctx.educacao.nivelAtual)}
            </p>
          </div>
          <button onClick={onClose} className="icon-button" aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        {notaJuvenil && (
          <p className="action-row__reason" role="status">
            {notaJuvenil}
          </p>
        )}

        <div className="event-scene__divider" role="presentation" />

        {vagas.length === 0 ? (
          <p className="empty-state">
            Nenhuma vaga compatível no momento. Estudar e ganhar experiência abre
            novas portas.
          </p>
        ) : (
          <div className="action-list">
            {vagas.map(job => (
              <div key={job.id} className="action-row">
                <div className="action-row__body">
                  <p className="action-row__title">{job.titulo}</p>
                  <p className="action-row__detail">
                    {job.setor} · {job.horasSemanais}h por semana
                  </p>
                  <p className="action-row__detail">
                    {formatarDinheiro(job.salarioMensal)} por mês
                  </p>
                </div>
                <div className="action-row__action">
                  <button
                    onClick={() => {
                      onCandidatar(job.id);
                      onClose();
                    }}
                    className="btn btn--primary"
                  >
                    Candidatar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
