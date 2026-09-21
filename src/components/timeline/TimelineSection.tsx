import React from 'react';
import type { LifeLogEntry } from '../../types';
import { LifeTimeline } from './LifeTimeline';
import { YearAdvance } from '../shell/YearAdvance';
import { obterPerfilDeFase } from '../../presentation/lifeStagePresentation';

interface TimelineSectionProps {
  timeline: LifeLogEntry[];
  idadeAtual: number;
  onEnvelhecer: () => void;
  bloqueado: boolean;
}

/**
 * Seção "Linha da Vida": a biografia mais a ação de avançar o tempo.
 *
 * O +1 ANO é sempre renderizado com `docked`: `year-advance--docked` usa
 * `position: sticky; bottom: 0` na coluna de conteúdo (`.shell-main`) em
 * TODAS as larguras — desktop e celular — para que o jogador nunca precise
 * rolar até o fim de uma Linha da Vida longa para encontrar a ação mais
 * importante do jogo (bug corrigido no B4-FIX2; ver
 * `src/styles/__tests__/yearAdvanceDock.test.ts`).
 */
export const TimelineSection: React.FC<TimelineSectionProps> = ({
  timeline,
  idadeAtual,
  onEnvelhecer,
  bloqueado
}) => {
  const perfil = obterPerfilDeFase(idadeAtual);

  return (
    <>
      <LifeTimeline timeline={timeline} idadeAtual={idadeAtual} />

      <YearAdvance
        onAvancar={onEnvelhecer}
        bloqueado={bloqueado}
        rotulo={perfil.rotuloAvancar}
        docked
      />
    </>
  );
};
