import React, { useState } from 'react';
import { CareerState, Character, EducationState, PersonalityState } from '../../types';
import { getEducationLabel, getSocialClassLabel, getStatColor } from '../../utils/formatters';
import { obterTracosPercebidos } from '../../systems/personalitySystem';
import { Heart, Smile, Brain, Sparkles, ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react';

interface StatsSidebarProps {
  personagem: Character;
  carreira: CareerState;
  educacao: EducationState;
  personalidade?: PersonalityState | null;
}

export const StatsSidebar: React.FC<StatsSidebarProps> = ({
  personagem,
  carreira,
  educacao,
  personalidade
}) => {
  const [showInternal, setShowInternal] = useState(false);
  const stats = personagem.stats;
  const hidden = personagem.hiddenStats;

  // Traços consolidados: rótulos qualitativos, nunca números crus
  const tracosPercebidos = personalidade
    ? obterTracosPercebidos(personalidade, personagem.genero)
    : [];

  const statItems: { label: string; value: number; icon: React.ReactNode }[] = [
    { label: 'Felicidade', value: stats.felicidade, icon: <Smile size={16} /> },
    { label: 'Saúde', value: stats.saude, icon: <Heart size={16} /> },
    { label: 'Inteligência', value: stats.inteligencia, icon: <Brain size={16} /> },
    { label: 'Aparência', value: stats.aparencia, icon: <Sparkles size={16} /> }
  ];

  return (
    <aside className="stats-sidebar">
      {/* Ficha do personagem (nome, idade e situação ficam no cabeçalho, sempre visíveis) */}
      <div className="card">
        <h3 className="card-title">
          <span>Ficha</span>
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
          <div>
            <strong style={{ color: 'var(--text-secondary)' }}>Origem: </strong>
            <span>{getSocialClassLabel(personagem.classeSocial)}</span>
          </div>
          <div>
            <strong style={{ color: 'var(--text-secondary)' }}>Escolaridade: </strong>
            <span>{getEducationLabel(educacao.nivelAtual)}</span>
          </div>
          {carreira.cargoAtual && (
            <div>
              <strong style={{ color: 'var(--text-secondary)' }}>Cargo: </strong>
              <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{carreira.cargoAtual.titulo}</span>
            </div>
          )}
          {personagem.doencas.length > 0 && (
            <div style={{ color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldAlert size={14} />
              <span>{personagem.doencas.join(', ')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Traços de personalidade percebidos (qualitativos; em formação enquanto não houver evidência suficiente) */}
      {personalidade && (
        <div className="card">
          <h3 className="card-title">
            <span>Traços Percebidos</span>
          </h3>
          {tracosPercebidos.length > 0 ? (
            <ul className="traits-list">
              {tracosPercebidos.map(t => (
                <li key={t.traco} className="trait-item">{t.rotulo}</li>
              ))}
            </ul>
          ) : (
            <p className="traits-formando">Personalidade ainda em formação.</p>
          )}
        </div>
      )}

      {/* Card de Atributos Principais */}
      <div className="card">
        <h3 className="card-title">
          <span>Atributos</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>0 a 100</span>
        </h3>

        <div className="stat-bar-group">
          {statItems.map(item => (
            <div key={item.label} className="stat-item">
              <div className="stat-label-row">
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {item.icon}
                  {item.label}
                </span>
                <span style={{ color: getStatColor(item.value) }}>{Math.round(item.value)}%</span>
              </div>
              <div className="stat-bar-track">
                <div
                  className="stat-bar-fill"
                  style={{
                    width: `${Math.max(4, item.value)}%`,
                    backgroundColor: getStatColor(item.value)
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Toggle para atributos internos */}
        <button
          onClick={() => setShowInternal(!showInternal)}
          className="btn-toggle-internal"
          aria-expanded={showInternal}
        >
          {showInternal ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {showInternal ? 'Ocultar Atributos Internos' : 'Ver Atributos Internos'}
        </button>

        {showInternal && (
          <div className="internal-stats">
            <div className="stat-label-row">
              <span>Disciplina</span>
              <strong style={{ color: getStatColor(hidden.disciplina) }}>{hidden.disciplina}%</strong>
            </div>
            <div className="stat-label-row">
              <span>Sociabilidade</span>
              <strong style={{ color: getStatColor(hidden.sociabilidade) }}>{hidden.sociabilidade}%</strong>
            </div>
            <div className="stat-label-row">
              <span>Empatia</span>
              <strong style={{ color: getStatColor(hidden.empatia) }}>{hidden.empatia}%</strong>
            </div>
            <div className="stat-label-row">
              <span>Ambição</span>
              <strong style={{ color: getStatColor(hidden.ambicao) }}>{hidden.ambicao}%</strong>
            </div>
            <div className="stat-label-row">
              <span>Estresse</span>
              <strong style={{ color: hidden.estresse > 60 ? 'var(--accent-rose)' : 'var(--primary)' }}>
                {hidden.estresse}%
              </strong>
            </div>
            <div className="stat-label-row">
              <span>Reputação</span>
              <strong style={{ color: getStatColor(hidden.reputacao) }}>{hidden.reputacao}%</strong>
            </div>
            <div className="stat-label-row">
              <span>Condicionamento Físico</span>
              <strong style={{ color: getStatColor(hidden.condicionamentoFisico) }}>{hidden.condicionamentoFisico}%</strong>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
