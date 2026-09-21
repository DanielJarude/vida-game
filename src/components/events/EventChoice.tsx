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
          BUG CORRIGIDO no rework visual (encontrado em playtest real de
          navegador): aqui era exibido `opcao.descricaoResultado` como
          "consequência insinuada". Só que `descricaoResultado` não é uma
          insinuação — é a NARRAÇÃO DO DESFECHO, escrita no passado. O
          jogador lia "O dono, um senhor aposentado, chorou de emoção e te
          agradeceu pela sua honestidade!" ANTES de escolher se devolveria
          a carteira.
          Isso não enfraquecia a decisão: eliminava a decisão. Escolher
          conhecendo o resultado das duas opções é preencher formulário,
          não decidir. O desfecho agora só aparece depois, em `EventResult`.
        */}

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
