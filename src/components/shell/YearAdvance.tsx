import React from 'react';
import { ArrowRight } from 'lucide-react';

interface YearAdvanceProps {
  onAvancar: () => void;
  /** Bloqueado enquanto houver um evento aberto aguardando decisão. */
  bloqueado: boolean;
  rotulo: string;
  /** No celular a ação fica ancorada no rodapé, sempre ao alcance. */
  docked?: boolean;
}

/**
 * +1 ANO — a ação mais importante do VIDA.
 *
 * Posição previsível, peso visual inequívoco e o único preenchimento sólido
 * de acento em toda a interface. Nunca vive dentro de um menu.
 *
 * Quando bloqueado, o motivo é dado em TEXTO (não só cor nem só `disabled`),
 * para funcionar com leitor de tela e no toque.
 */
export const YearAdvance: React.FC<YearAdvanceProps> = ({
  onAvancar,
  bloqueado,
  rotulo,
  docked = false
}) => {
  const motivo = bloqueado
    ? 'Responda ao acontecimento em aberto para avançar.'
    : undefined;

  return (
    <div className={`year-advance${docked ? ' year-advance--docked' : ''}`}>
      <button
        className="year-advance__button"
        onClick={onAvancar}
        disabled={bloqueado}
        aria-describedby={motivo ? 'year-advance-hint' : undefined}
      >
        <span>{rotulo}</span>
        <ArrowRight size={20} aria-hidden="true" />
      </button>

      {motivo && (
        <p className="year-advance__hint" id="year-advance-hint" role="status">
          {motivo}
        </p>
      )}
    </div>
  );
};
