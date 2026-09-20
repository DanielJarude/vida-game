import React from 'react';
import { Check, Lock } from 'lucide-react';
import type { EventOption } from '../../types';

interface EventChoiceProps {
  opcao: EventOption;
  disponivel: boolean;
  /** Motivo textual da indisponibilidade, quando houver. */
  motivo?: string;
  selecionada: boolean;
  /** Depois de decidir, as opções viram leitura (o resultado já aconteceu). */
  resolvido: boolean;
  onEscolher: (opcaoId: string) => void;
}

/**
 * Uma escolha — decisão, não botão de CRUD.
 *
 * Linha interativa de largura total com indicador, título e consequência
 * insinuada. Estados cobertos: normal, hover/focus, selecionada, indisponível
 * (com motivo em texto, acessível também no toque).
 */
export const EventChoice: React.FC<EventChoiceProps> = ({
  opcao,
  disponivel,
  motivo,
  selecionada,
  resolvido,
  onEscolher
}) => {
  const desabilitada = !disponivel || resolvido;

  const classes = [
    'event-choice',
    selecionada ? 'event-choice--selecionada' : ''
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={classes}
      onClick={() => onEscolher(opcao.id)}
      disabled={desabilitada}
      aria-pressed={resolvido ? selecionada : undefined}
    >
      <span className="event-choice__indicator" aria-hidden="true">
        {selecionada && <Check size={12} strokeWidth={3} />}
      </span>

      <span className="event-choice__body">
        <span className="event-choice__title">{opcao.texto}</span>

        {/*
          Consequência insinuada em linguagem humana — nunca "+5 INT".
          Só é exibida antes de decidir; depois, o resultado real assume.
        */}
        {!resolvido && opcao.descricaoResultado && (
          <span className="event-choice__hint">{opcao.descricaoResultado}</span>
        )}

        {!disponivel && motivo && (
          <span className="event-choice__reason">
            <Lock size={12} aria-hidden="true" />
            {motivo}
          </span>
        )}
      </span>
    </button>
  );
};
