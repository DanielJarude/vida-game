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
 *
 * B4-FIX4 — este componente NÃO trata mais o ano silencioso. Ele existia
 * para dizer "Um ano sem grandes acontecimentos. A vida seguiu seu curso."
 * — ou seja, interrompia o jogador exatamente para avisar que nada merecia
 * interrompê-lo. Agora quem decide é a camada de comandos: um ano sem nada
 * a relatar simplesmente não abre resumo (ver `useGame.envelhecerAno`), e
 * o tempo continua passando. Por isso `resumo.itens` aqui nunca é vazio.
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
