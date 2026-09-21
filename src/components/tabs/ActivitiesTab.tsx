import React from 'react';
import { ActivityOption } from '../../data/activitiesData';
import { Character, EconomyState } from '../../types';
import {
  AtividadeComDisponibilidade,
  getAtividadesVisiveis,
  ContextoAcao
} from '../../systems/availabilitySystem';
import { formatarDinheiro } from '../../utils/formatters';
import { Lock } from 'lucide-react';

interface ActivitiesTabProps {
  personagem: Character;
  economia: EconomyState;
  ctx: ContextoAcao;
  onExecutarAtividade: (atividade: ActivityOption) => void;
}

const TITULOS_CATEGORIA: Record<ActivityOption['categoria'], string> = {
  saude: 'Saúde e bem-estar',
  lazer: 'Lazer',
  social: 'Convivência',
  desenvolvimento: 'Mente e aprendizado'
};

export const ActivitiesTab: React.FC<ActivitiesTabProps> = ({
  economia,
  ctx,
  onExecutarAtividade
}) => {
  // A lista vem da política central: atividades incompatíveis com a fase ficam ocultas
  const grupos = getAtividadesVisiveis(ctx);

  const renderItem = (item: AtividadeComDisponibilidade) => {
    const { atividade, disponibilidade } = item;
    const pode = disponibilidade.kind === 'disponivel';
    const motivo =
      disponibilidade.kind === 'bloqueado' ? disponibilidade.motivo : undefined;

    const rotuloBotao = pode
      ? 'Fazer'
      : disponibilidade.kind === 'bloqueado' &&
        disponibilidade.reasonCode === 'repeticao_anual'
      ? 'Já fez este ano'
      : disponibilidade.kind === 'bloqueado' &&
        disponibilidade.reasonCode === 'saldo_insuficiente'
      ? 'Sem saldo'
      : 'Indisponível';

    return (
      <div key={atividade.id} className="action-row">
        <div className="action-row__body">
          <p className="action-row__title">{atividade.nome}</p>
          <p className="action-row__detail">{atividade.descricao}</p>
          <p className="action-row__detail">
            {atividade.efeitoResumo}
            {' · '}
            {atividade.custo === 0
              ? 'Gratuito'
              : formatarDinheiro(atividade.custo)}
          </p>

          {/* Motivo sempre em texto: acessível no toque, sem depender de hover. */}
          {!pode && motivo && (
            <p className="action-row__reason">
              <Lock size={12} aria-hidden="true" />
              {motivo}
            </p>
          )}
        </div>

        <div className="action-row__action">
          <button
            className={`btn ${pode ? 'btn--primary' : 'btn--ghost'}`}
            disabled={!pode}
            onClick={() => onExecutarAtividade(atividade)}
          >
            {rotuloBotao}
          </button>
        </div>
      </div>
    );
  };

  if (grupos.length === 0) {
    return (
      <p className="empty-state">
        Nenhuma atividade disponível para a sua fase da vida neste momento.
      </p>
    );
  }

  return (
    <div>
      <header className="section__header">
        <h2 className="section__title">Atividades</h2>
        <p className="section__subtitle">
          Saldo disponível: {formatarDinheiro(economia.dinheiro)}
        </p>
      </header>

      {grupos.map(grupo => (
        <section className="section" key={grupo.categoria}>
          <div>
            <h3 className="subsection__title">
              {TITULOS_CATEGORIA[grupo.categoria]}
            </h3>
            <div className="action-list">{grupo.itens.map(renderItem)}</div>
          </div>
        </section>
      ))}
    </div>
  );
};
