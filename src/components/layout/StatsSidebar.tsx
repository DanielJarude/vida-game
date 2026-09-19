import React, { useState } from 'react';
import { CareerState, Character, EducationState } from '../../types';
import { getEducationLabel, getSocialClassLabel, getStatColor } from '../../utils/formatters';
import { Heart, Smile, Brain, Sparkles, Zap, ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react';

interface StatsSidebarProps {
  personagem: Character;
  carreira: CareerState;
  educacao: EducationState;
}

export const StatsSidebar: React.FC<StatsSidebarProps> = ({
  personagem,
  carreira,
  educacao
}) => {
  const [showInternal, setShowInternal] = useState(false);
  const stats = personagem.stats;
  const hidden = personagem.hiddenStats;

  const statItems: { label: string; value: number; icon: React.ReactNode }[] = [
    { label: 'Felicidade', value: stats.felicidade, icon: <Smile size={16} /> },
    { label: 'Saúde', value: stats.saude, icon: <Heart size={16} /> },
    { label: 'Inteligência', value: stats.inteligencia, icon: <Brain size={16} /> },
    { label: 'Aparência', value: stats.aparencia, icon: <Sparkles size={16} /> },
    { label: 'Energia', value: stats.energia, icon: <Zap size={16} /> }
  ];

  const ocupacao = carreira.cargoAtual
    ? carreira.cargoAtual.titulo
    : educacao.emCurso
    ? `${educacao.nomeCurso || 'Estudante'} (${educacao.instituicao || 'Escola'})`
    : carreira.aposentado
    ? 'Aposentado(a)'
    : 'Sem ocupação formal';

  return (
    <aside className="stats-sidebar">
      {/* Card de Informações Gerais */}
      <div className="card">
        <h3 className="card-title">
          <span>{personagem.nome} {personagem.sobrenome}</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {personagem.cidade}, {personagem.estado}
          </span>
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
          <div>
            <strong style={{ color: 'var(--text-secondary)' }}>Origem: </strong>
            <span>{getSocialClassLabel(personagem.classeSocial)}</span>
          </div>
          <div>
            <strong style={{ color: 'var(--text-secondary)' }}>Ocupação: </strong>
            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{ocupacao}</span>
          </div>
          <div>
            <strong style={{ color: 'var(--text-secondary)' }}>Escolaridade: </strong>
            <span>{getEducationLabel(educacao.nivelAtual)}</span>
          </div>
          {personagem.doencas.length > 0 && (
            <div style={{ color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldAlert size={14} />
              <span>{personagem.doencas.join(', ')}</span>
            </div>
          )}
        </div>
      </div>

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
          style={{
            marginTop: '16px',
            width: '100%',
            padding: '8px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-card-subtle)',
            color: 'var(--text-secondary)',
            fontSize: '0.8rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          {showInternal ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {showInternal ? 'Ocultar Atributos Internos' : 'Ver Atributos Internos'}
        </button>

        {showInternal && (
          <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-card)', paddingTop: '12px' }}>
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
