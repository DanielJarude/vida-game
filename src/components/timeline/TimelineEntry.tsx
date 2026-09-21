import React from 'react';
import {
  Baby,
  Heart,
  GraduationCap,
  Briefcase,
  Wallet,
  Users,
  HeartPulse,
  Sparkles,
  Star,
  Flower2,
  Circle
} from 'lucide-react';
import type { LifeLogCategory } from '../../types';
import type { EntradaApresentada } from '../../presentation/timelinePresentation';

interface TimelineEntryProps {
  item: EntradaApresentada;
}

/**
 * Ícone por categoria de acontecimento.
 *
 * O tipo é comunicado por ÍCONE + rótulo textual, nunca só por cor — assim a
 * diferenciação sobrevive a daltonismo e a modo de alto contraste.
 */
const ICONES: Record<LifeLogCategory, React.ReactNode> = {
  geral: <Circle size={13} />,
  familia: <Users size={13} />,
  escola: <GraduationCap size={13} />,
  carreira: <Briefcase size={13} />,
  amor: <Heart size={13} />,
  saude: <HeartPulse size={13} />,
  financas: <Wallet size={13} />,
  evento: <Sparkles size={13} />,
  morte: <Flower2 size={13} />,
  cotidiano: <Circle size={13} />
};

export const TimelineEntry: React.FC<TimelineEntryProps> = ({ item }) => {
  const { entrada, enfase, rotuloCategoria, titulo, resumo } = item;

  const icone =
    enfase === 'nascimento' ? <Baby size={13} /> :
    enfase === 'marco' ? <Star size={13} /> :
    ICONES[entrada.categoria];

  return (
    <article
      className={`timeline-entry timeline-entry--${enfase}`}
      data-categoria={entrada.categoria}
    >
      <span className="timeline-entry__marker" aria-hidden="true" />

      <div className="timeline-entry__head">
        <span className="timeline-entry__icon" aria-hidden="true">
          {icone}
        </span>
        <h4 className="timeline-entry__title">{titulo}</h4>
      </div>

      {resumo && <p className="timeline-entry__summary">{resumo}</p>}

      {/* Rótulo textual do tipo: redundante com o ícone de propósito. */}
      <span className="timeline-entry__category">{rotuloCategoria}</span>
    </article>
  );
};
