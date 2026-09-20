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
 * O +1 ANO vem ANTES da biografia, não depois.
 *
 * No B4-FIX ele era renderizado ao fim da timeline: com 20 anos de registros
 * o jogador precisava rolar a vida inteira para avançar o ano. Agora abre a
 * seção e gruda logo abaixo do cabeçalho enquanto se rola (`sticky`), então
 * permanece em fluxo — reserva o próprio espaço e não cobre conteúdo. No
 * celular o CSS continua ancorando no rodapé (`year-advance--docked`).
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
      <YearAdvance
        onAvancar={onEnvelhecer}
        bloqueado={bloqueado}
        rotulo={perfil.rotuloAvancar}
        docked
      />

      <LifeTimeline timeline={timeline} idadeAtual={idadeAtual} />
    </>
  );
};
