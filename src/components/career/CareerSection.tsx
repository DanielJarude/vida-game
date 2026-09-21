import React, { useState } from 'react';
import { CareerState, Character } from '../../types';
import { JobMarketModal } from '../modals/JobMarketModal';
import { formatarDinheiro } from '../../utils/formatters';
import {
  ContextoAcao,
  getBicosVisiveis,
  IDADE_MINIMA_BICOS
} from '../../systems/availabilitySystem';
import { Lock } from 'lucide-react';

interface CareerSectionProps {
  personagem: Character;
  carreira: CareerState;
  ctx: ContextoAcao;
  onCandidatarVaga: (jobId: string) => void;
  onTrabalharMais: () => void;
  onPedirAumento: () => void;
  onPedirDemissao: () => void;
  onFazerBico: (bicoId: string) => void;
}

/**
 * Trabalho: vínculo atual, ações do ano e bicos.
 *
 * Toda a visibilidade continua derivada da política central; este componente
 * não decide idade mínima por conta própria.
 */
export const CareerSection: React.FC<CareerSectionProps> = ({
  personagem,
  carreira,
  ctx,
  onCandidatarVaga,
  onTrabalharMais,
  onPedirAumento,
  onPedirDemissao,
  onFazerBico
}) => {
  const [showJobModal, setShowJobModal] = useState(false);

  const idade = personagem.idade;
  const mostrarCarreira = idade >= 16 || carreira.empregado || carreira.aposentado;
  const mostrarBicos = idade >= IDADE_MINIMA_BICOS;

  if (!mostrarCarreira && !mostrarBicos) return null;

  const bicos = mostrarBicos ? getBicosVisiveis(ctx) : [];

  return (
    <>
      {mostrarCarreira && (
        <section className="section">
          <div>
            <header className="section__header">
              <h3 className="section__title">Trabalho</h3>
              {!carreira.aposentado && (
                <button
                  onClick={() => setShowJobModal(true)}
                  className="btn btn--primary"
                >
                  Procurar emprego
                </button>
              )}
            </header>

            {carreira.empregado && carreira.cargoAtual ? (
              <div>
                <p className="action-row__title">{carreira.cargoAtual.titulo}</p>
                <p className="action-row__detail">
                  {carreira.cargoAtual.setor} ·{' '}
                  {carreira.anosNoCargo === 1
                    ? '1 ano na empresa'
                    : `${carreira.anosNoCargo} anos na empresa`}
                </p>

                <div style={{ marginTop: 'var(--space-3)' }}>
                  <div className="data-row">
                    <span className="data-row__label">Salário mensal</span>
                    <span className="data-row__value">
                      {formatarDinheiro(carreira.cargoAtual.salarioMensal)}
                    </span>
                  </div>
                  <div className="data-row">
                    <span className="data-row__label">Desempenho</span>
                    <span className="data-row__value">
                      {Math.round(carreira.desempenhoTrabalho)}
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: 'var(--space-5)' }}>
                  <h4 className="subsection__title">Ações deste ano</h4>
                  <div className="action-list">
                    <div className="action-row">
                      <div className="action-row__body">
                        <p className="action-row__title">
                          {carreira.horasExtras
                            ? 'Horas extras já assumidas'
                            : 'Fazer hora extra'}
                        </p>
                        <p className="action-row__detail">
                          Compromisso do ano · efeito na virada
                        </p>
                      </div>
                      <div className="action-row__action">
                        <button
                          className="btn btn--secondary"
                          onClick={onTrabalharMais}
                          disabled={carreira.horasExtras}
                        >
                          {carreira.horasExtras ? 'Assumido' : 'Assumir'}
                        </button>
                      </div>
                    </div>

                    <div className="action-row">
                      <div className="action-row__body">
                        <p className="action-row__title">Pedir aumento</p>
                        <p className="action-row__detail">
                          Depende do seu desempenho e do tempo de casa
                        </p>
                      </div>
                      <div className="action-row__action">
                        <button className="btn btn--secondary" onClick={onPedirAumento}>
                          Pedir
                        </button>
                      </div>
                    </div>

                    <div className="action-row">
                      <div className="action-row__body">
                        <p className="action-row__title">Pedir demissão</p>
                        <p className="action-row__detail">
                          Você deixa o cargo e volta a procurar trabalho
                        </p>
                      </div>
                      <div className="action-row__action">
                        <button className="btn btn--danger" onClick={onPedirDemissao}>
                          Sair
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="empty-state">
                {carreira.aposentado
                  ? 'Você está aposentado(a).'
                  : idade < 18
                  ? 'Nesta fase existem apenas modalidades juvenis de trabalho. As demais vagas abrem aos 18 anos.'
                  : 'Você está sem trabalho no momento.'}
              </p>
            )}
          </div>
        </section>
      )}

      {mostrarBicos && bicos.length > 0 && (
        <section className="section">
          <div>
            <h3 className="subsection__title">Renda extra</h3>
            <p className="section__subtitle" style={{ marginBottom: 'var(--space-3)' }}>
              Um bico por ano; o pagamento entra na virada do ano.
            </p>
            <div className="action-list">
              {bicos.map(({ bico, disponibilidade }) => {
                const pode = disponibilidade.kind === 'disponivel';
                const motivo =
                  disponibilidade.kind === 'bloqueado'
                    ? disponibilidade.motivo
                    : undefined;
                return (
                  <div key={bico.id} className="action-row">
                    <div className="action-row__body">
                      <p className="action-row__title">{bico.nome}</p>
                      <p className="action-row__detail">
                        {bico.descricao} ·{' '}
                        {formatarDinheiro(bico.ganhoEstimadoAnual)} por ano
                      </p>
                      {motivo && (
                        <p className="action-row__reason">
                          <Lock size={12} aria-hidden="true" />
                          {motivo}
                        </p>
                      )}
                    </div>
                    <div className="action-row__action">
                      <button
                        onClick={() => onFazerBico(bico.id)}
                        disabled={!pode}
                        className={`btn ${pode ? 'btn--secondary' : 'btn--ghost'}`}
                      >
                        {pode
                          ? 'Aceitar'
                          : carreira.bicoAtivoId
                          ? 'Já escolhido'
                          : 'Indisponível'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {showJobModal && (
        <JobMarketModal
          ctx={ctx}
          onClose={() => setShowJobModal(false)}
          onCandidatar={onCandidatarVaga}
        />
      )}
    </>
  );
};
