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
 * O +1 ANO aparece aqui em posição previsível no desktop; no celular o CSS
 * o ancora no rodapé (`year-advance--docked`) para continuar sempre acessível.
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
