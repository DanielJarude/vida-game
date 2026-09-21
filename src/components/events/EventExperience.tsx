import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Briefcase,
  Heart,
  Wallet,
  HeartPulse,
  Users,
  Sparkles,
  Circle,
  Palette,
  Trophy,
  Landmark,
  Smartphone
} from 'lucide-react';
import type {
  Character,
  EconomyState,
  GameEvent,
  PersonalityState
} from '../../types';
import {
  avaliarRequisitoOpcao,
  type ResultadoRequisito
} from '../../systems/events/optionRequirements';
import { descreverEfeitosPublicos } from '../../presentation/outcomePresentation';
import {
  iconeCategoriaEvento,
  rotuloCategoriaEvento,
  type NomeIconeCategoria
} from '../../presentation/eventCategoryPresentation';
import { useModalBehavior } from '../common/useModalBehavior';
import { EventChoice } from './EventChoice';
import { EventResult } from './EventResult';

interface EventExperienceProps {
  evento: GameEvent;
  personagem: Character;
  economia: EconomyState;
  personalidade?: PersonalityState | null;
  /**
   * Aplica a escolha no motor. Retorna `true` quando a escolha foi aceita;
   * `false` quando o motor recusou (requisito não cumprido), caso em que o
   * evento continua aberto e nenhum resultado é mostrado.
   */
  onEscolherOpcao: (opcaoId: string) => boolean;
  /** Fecha o evento depois que o jogador leu o resultado. */
  onContinuar: () => void;
}

// B4-FIX3 — rótulo e nome do ícone vêm de `eventCategoryPresentation`
// (dado puro, reutilizável); aqui só resolvemos o componente React do ícone.
const COMPONENTES_ICONE: Record<NomeIconeCategoria, React.ReactNode> = {
  sparkles: <Sparkles size={14} />,
  'book-open': <BookOpen size={14} />,
  users: <Users size={14} />,
  heart: <Heart size={14} />,
  briefcase: <Briefcase size={14} />,
  wallet: <Wallet size={14} />,
  'heart-pulse': <HeartPulse size={14} />,
  circle: <Circle size={14} />,
  palette: <Palette size={14} />,
  trophy: <Trophy size={14} />,
  landmark: <Landmark size={14} />,
  smartphone: <Smartphone size={14} />
};

/**
 * Um momento da vida: SITUAÇÃO → ESCOLHA → RESULTADO → CONTINUAR.
 *
 * Tudo acontece na mesma superfície. A escolha feita permanece visível ao
 * lado do resultado para o jogador lembrar o que decidiu.
 */
export const EventExperience: React.FC<EventExperienceProps> = ({
  evento,
  personagem,
  economia,
  personalidade,
  onEscolherOpcao,
  onContinuar
}) => {
  // Enquanto o evento estiver aberto ele é obrigatório: sem Escape.
  const containerRef = useModalBehavior<HTMLDivElement>();

  const [opcaoEscolhida, setOpcaoEscolhida] = useState<string | null>(null);

  // Avaliado apenas antes de decidir: o resultado não recalcula requisitos.
  const requisitos = useMemo(() => {
    const mapa = new Map<string, ResultadoRequisito>();
    evento.opcoes.forEach(opcao => {
      mapa.set(
        opcao.id,
        avaliarRequisitoOpcao(opcao, personagem, economia, personalidade ?? undefined)
      );
    });
    return mapa;
    // Congela a avaliação ao abrir o evento para evitar que os efeitos já
    // aplicados mudem a leitura das opções depois da decisão.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evento.id]);

  const opcaoResolvida = opcaoEscolhida
    ? evento.opcoes.find(o => o.id === opcaoEscolhida)
    : undefined;

  const efeitos = useMemo(
    () => (opcaoResolvida ? descreverEfeitosPublicos(opcaoResolvida.consequencias) : []),
    [opcaoResolvida]
  );

  const escolher = (opcaoId: string) => {
    if (opcaoEscolhida) return;
    const aceito = onEscolherOpcao(opcaoId);
    if (aceito) {
      setOpcaoEscolhida(opcaoId);
    }
  };

  const tituloId = `evento-titulo-${evento.id}`;

  return (
    <div className="modal-overlay">
      <div
        className="modal-surface event-scene"
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        ref={containerRef}
        tabIndex={-1}
      >
        <p className="event-scene__context">
          <span aria-hidden="true">{COMPONENTES_ICONE[iconeCategoriaEvento(evento.categoria)]}</span>
          <span className="event-scene__category">
            {rotuloCategoriaEvento(evento.categoria)}
          </span>
        </p>

        <h2 className="event-scene__title" id={tituloId}>
          {evento.titulo}
        </h2>

        <p className="event-scene__narrative">{evento.descricao}</p>

        <div className="event-scene__divider" role="presentation" />

        {!opcaoEscolhida && (
          <p className="event-scene__prompt">O que você faz?</p>
        )}

        <div className="event-choices">
          {evento.opcoes
            // Depois de decidir, só a escolha feita permanece em tela.
            .filter(opcao => !opcaoEscolhida || opcao.id === opcaoEscolhida)
            // Opção recusada em definitivo (a idade já passou) não é
            // mostrada nem cinza: ela não informa nada que o jogador possa
            // usar. Uma recusa reversível — dinheiro, atributo, histórico —
            // continua visível COM o motivo, porque aí o bloqueio ensina.
            .filter(opcao => !requisitos.get(opcao.id)?.permanente)
            .map(opcao => {
              const requisito = requisitos.get(opcao.id);
              return (
                <EventChoice
                  key={opcao.id}
                  opcao={opcao}
                  disponivel={requisito?.aprovado ?? true}
                  motivo={requisito?.motivo}
                  selecionada={opcaoEscolhida === opcao.id}
                  resolvido={!!opcaoEscolhida}
                  onEscolher={escolher}
                />
              );
            })}
        </div>

        {opcaoResolvida && (
          <EventResult
            narrativa={opcaoResolvida.descricaoResultado}
            efeitos={efeitos}
            onContinuar={onContinuar}
          />
        )}
      </div>
    </div>
  );
};
