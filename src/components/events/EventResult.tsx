import React from 'react';
import { Check, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { EfeitoPublico } from '../../presentation/outcomePresentation';

interface EventResultProps {
  /** Texto narrativo do que aconteceu (vem da opção escolhida). */
  narrativa?: string;
  /** Efeitos mecânicos públicos — jamais traços ou atributos internos. */
  efeitos: EfeitoPublico[];
  onContinuar: () => void;
}

const ICONE_TOM = {
  positivo: <TrendingUp size={14} aria-hidden="true" />,
  negativo: <TrendingDown size={14} aria-hidden="true" />,
  neutro: <Minus size={14} aria-hidden="true" />
};

/**
 * O resultado da escolha, no MESMO contexto visual do evento.
 *
 * Não abre um segundo modal. Mantém a separação obrigatória:
 *   narrativa (o que aconteceu)  ≠  efeitos públicos  ≠  Linha da Vida.
 */
export const EventResult: React.FC<EventResultProps> = ({
  narrativa,
  efeitos,
  onContinuar
}) => {
  return (
    <div className="event-result" role="status" aria-live="polite">
      <p className="event-result__label">
        <Check size={13} aria-hidden="true" />
        Resultado
      </p>

      {narrativa && <p className="event-result__narrative">{narrativa}</p>}

      {efeitos.length > 0 && (
        <ul className="annual-summary__list" style={{ marginTop: 'var(--space-4)' }}>
          {efeitos.map(efeito => (
            <li
              key={efeito.id}
              className={`annual-summary__item annual-summary__item--${efeito.tom}`}
            >
              {ICONE_TOM[efeito.tom]}
              <span>{efeito.texto}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="event-result__continue">
        <button className="btn btn--primary btn--block" onClick={onContinuar}>
          Continuar
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
