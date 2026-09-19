import React, { useMemo } from 'react';
import { LifeLogEntry } from '../../types';
import { getRotuloCategoria } from '../../utils/formatters';
import { Plus } from 'lucide-react';

interface TimelineTabProps {
  timeline: LifeLogEntry[];
  onEnvelhecer: () => void;
  bloqueado: boolean;
}

interface GrupoAno {
  idade: number;
  ano: number;
  entradas: LifeLogEntry[];
}

export const TimelineTab: React.FC<TimelineTabProps> = ({
  timeline,
  onEnvelhecer,
  bloqueado
}) => {
  // Agrupa por idade preservando a ordem cronológica de inserção;
  // os grupos são exibidos do mais recente para o mais antigo.
  const grupos = useMemo<GrupoAno[]>(() => {
    const lista: GrupoAno[] = [];
    for (const entry of timeline) {
      const ultimo = lista[lista.length - 1];
      if (ultimo && ultimo.idade === entry.idade) {
        ultimo.entradas.push(entry);
      } else {
        lista.push({ idade: entry.idade, ano: entry.ano, entradas: [entry] });
      }
    }
    return lista;
  }, [timeline]);

  const gruposOrdenados = [...grupos].reverse();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
      <div className="timeline-container" aria-label="Linha da Vida">
        {gruposOrdenados.map(grupo => (
          <section key={`${grupo.idade}-${grupo.ano}`} className="year-group">
            <h3 className="year-group-header">
              {grupo.idade} {grupo.idade === 1 ? 'ano' : 'anos'} · {grupo.ano}
            </h3>
            {grupo.entradas.map((entry) => {
              let entryClass = 'timeline-entry';
              if (entry.tipo === 'importante') entryClass += ' entry-importante';
              else if (entry.tipo === 'negativo') entryClass += ' entry-negativo';
              else if (entry.tipo === 'positivo') entryClass += ' entry-positivo';

              return (
                <div key={entry.id} className={entryClass}>
                  <div className="timeline-badge-row">
                    <span className="timeline-categoria">{getRotuloCategoria(entry.categoria)}</span>
                  </div>
                  <p className="timeline-text">{entry.texto}</p>
                </div>
              );
            })}
          </section>
        ))}
      </div>

      {/* Botão Principal: + 1 ANO */}
      <div className="age-action-container">
        <button
          className="btn-age-up"
          onClick={onEnvelhecer}
          disabled={bloqueado}
          aria-label="Avançar um ano"
        >
          <Plus size={24} strokeWidth={3} />
          <span>+ 1 ANO</span>
        </button>
      </div>
    </div>
  );
};
