import React from 'react';
import { LifeLogEntry } from '../../types';
import { Calendar, Plus } from 'lucide-react';

interface TimelineTabProps {
  timeline: LifeLogEntry[];
  onEnvelhecer: () => void;
  bloqueado: boolean;
}

export const TimelineTab: React.FC<TimelineTabProps> = ({
  timeline,
  onEnvelhecer,
  bloqueado
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
      <div className="timeline-container">
        {timeline.map((entry) => {
          let entryClass = 'timeline-entry';
          if (entry.id.startsWith('ano_head')) entryClass += ' entry-head';
          else if (entry.tipo === 'importante') entryClass += ' entry-importante';
          else if (entry.tipo === 'negativo') entryClass += ' entry-negativo';
          else if (entry.tipo === 'positivo') entryClass += ' entry-positivo';

          return (
            <div key={entry.id} className={entryClass}>
              <div className="timeline-badge-row">
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={12} />
                  Idade {entry.idade} ({entry.ano})
                </span>
                <span style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                  {entry.categoria}
                </span>
              </div>
              <p className="timeline-text">{entry.texto}</p>
            </div>
          );
        })}
      </div>

      {/* Botão Principal: + 1 ANO */}
      <div className="age-action-container">
        <button
          className="btn-age-up"
          onClick={onEnvelhecer}
          disabled={bloqueado}
          style={{ opacity: bloqueado ? 0.6 : 1, cursor: bloqueado ? 'not-allowed' : 'pointer' }}
        >
          <Plus size={24} strokeWidth={3} />
          <span>+ 1 ANO</span>
        </button>
      </div>
    </div>
  );
};
