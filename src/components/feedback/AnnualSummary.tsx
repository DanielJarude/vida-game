import React from 'react';
import { ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ResumoAnual } from '../../presentation/outcomePresentation';
import { useModalBehavior } from '../common/useModalBehavior';

interface AnnualSummaryProps {
  resumo: ResumoAnual;
  onFechar: () => void;
}

const ICONE_TOM = {
  positivo: <TrendingUp size={14} aria-hidden="true" />,
  negativo: <TrendingDown size={14} aria-hidden="true" />,
  neutro: <Minus size={14} aria-hidden="true" />
};

/**
 * Resumo anual — "O que este ano fez com a minha vida?"
 *
 * Acontecimentos e mudanças em linguagem humana, não extrato técnico.
 * Quando o ano foi silencioso, o resumo diz isso com honestidade em vez de
 * inventar drama.
 */
export const AnnualSummary: React.FC<AnnualSummaryProps> = ({
  resumo,
  onFechar
}) => {
  const containerRef = useModalBehavior<HTMLDivElement>({ onClose: onFechar });
  const tituloId = 'resumo-anual-titulo';

  const idadeTexto = resumo.idade === 1 ? '1 ano' : `${resumo.idade} anos`;

  return (
    <div className="modal-overlay">
      <div
        className="modal-surface annual-summary"
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        ref={containerRef}
        tabIndex={-1}
      >
        <p className="annual-summary__year">{resumo.ano}</p>
        <h2 className="annual-summary__title" id={tituloId}>
          Você agora tem {idadeTexto}
        </h2>

        {resumo.silencioso ? (
          <p className="annual-summary__quiet">
            Um ano sem grandes acontecimentos. A vida seguiu seu curso.
          </p>
        ) : (
          <ul className="annual-summary__list">
            {resumo.itens.map(item => (
              <li
                key={item.id}
                className={`annual-summary__item annual-summary__item--${item.tom}`}
              >
                {ICONE_TOM[item.tom]}
                <span>{item.texto}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="event-result__continue">
          <button className="btn btn--primary btn--block" onClick={onFechar}>
            Continuar
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};
