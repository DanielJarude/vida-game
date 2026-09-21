import React, { useMemo } from 'react';
import type { LifeLogEntry } from '../../types';
import {
  agruparTimeline,
  rotuloIdade
} from '../../presentation/timelinePresentation';
import { obterPerfilDeFase } from '../../presentation/lifeStagePresentation';
import { TimelineEntry } from './TimelineEntry';

interface LifeTimelineProps {
  timeline: LifeLogEntry[];
  idadeAtual: number;
}

/**
 * A Linha da Vida — principal expressão visual do jogo.
 *
 * Eixo vertical contínuo, agrupado por ano, do mais recente para o mais
 * antigo. Não é uma lista de logs: cada entrada comunica idade, ano, tipo,
 * título e resumo, com ênfase proporcional à importância do acontecimento.
 */
export const LifeTimeline: React.FC<LifeTimelineProps> = ({
  timeline,
  idadeAtual
}) => {
  const grupos = useMemo(() => agruparTimeline(timeline), [timeline]);
  const perfil = obterPerfilDeFase(idadeAtual);

  // Mais recente primeiro: o presente é o que o jogador acabou de viver.
  const gruposOrdenados = useMemo(() => [...grupos].reverse(), [grupos]);

  return (
    <section className="life-timeline" aria-label="Linha da Vida">
      <header className="life-timeline__header">
        <div>
          <h2 className="section__title">Linha da Vida</h2>
          <p className="life-timeline__intro">{perfil.introTimeline}</p>
        </div>
      </header>

      {gruposOrdenados.length === 0 ? (
        <p className="timeline-empty">
          Sua história ainda não começou a ser escrita. Avance um ano para
          registrar o primeiro acontecimento.
        </p>
      ) : (
        <div className="timeline">
          {gruposOrdenados.map(grupo => (
            <section
              key={`${grupo.idade}-${grupo.ano}`}
              className="timeline-year"
              aria-label={`${rotuloIdade(grupo.idade)}, ${grupo.ano}`}
            >
              <header className="timeline-year__header">
                <h3 className="timeline-year__age">{rotuloIdade(grupo.idade)}</h3>
                <span className="timeline-year__year">{grupo.ano}</span>
              </header>

              {grupo.entradas.map(item => (
                <TimelineEntry key={item.entrada.id} item={item} />
              ))}
            </section>
          ))}
        </div>
      )}
    </section>
  );
};
