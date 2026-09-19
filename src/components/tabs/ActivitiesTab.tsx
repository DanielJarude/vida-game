import React from 'react';
import { ATIVIDADES_DISPONIVEIS, ActivityOption } from '../../data/activitiesData';
import { Character, EconomyState } from '../../types';
import { formatarDinheiro } from '../../utils/formatters';
import {
  Activity,
  Compass,
  Users,
  BookOpen
} from 'lucide-react';

interface ActivitiesTabProps {
  personagem: Character;
  economia: EconomyState;
  onExecutarAtividade: (atividade: ActivityOption) => void;
}

export const ActivitiesTab: React.FC<ActivitiesTabProps> = ({
  personagem,
  economia,
  onExecutarAtividade
}) => {
  const saudeAtividades = ATIVIDADES_DISPONIVEIS.filter(a => a.categoria === 'saude');
  const lazerAtividades = ATIVIDADES_DISPONIVEIS.filter(a => a.categoria === 'lazer');
  const socialAtividades = ATIVIDADES_DISPONIVEIS.filter(a => a.categoria === 'social');
  const desenvAtividades = ATIVIDADES_DISPONIVEIS.filter(a => a.categoria === 'desenvolvimento');

  const renderItem = (act: ActivityOption) => {
    const idadeOk = personagem.idade >= act.idadeMinima;
    const saldoOk = act.custo === 0 || economia.dinheiro >= act.custo;
    const energiaOk = personagem.stats.energia >= act.energiaGasto;
    const pode = idadeOk && saldoOk && energiaOk;

    return (
      <div
        key={act.id}
        style={{
          background: 'var(--bg-card-subtle)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
            {act.nome}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {act.descricao}
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px', fontSize: '0.75rem' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{act.efeitoResumo}</span>
            <span style={{ color: 'var(--text-muted)' }}>• Gasta {act.energiaGasto}% energia</span>
          </div>
          <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--accent-amber)', marginTop: '2px' }}>
            {act.custo === 0 ? 'Gratuito' : `Custo: ${formatarDinheiro(act.custo)}`}
          </div>
        </div>

        <button
          disabled={!pode}
          onClick={() => onExecutarAtividade(act)}
          style={{
            background: pode ? 'var(--primary)' : 'var(--bg-card-hover)',
            color: pode ? '#022c22' : 'var(--text-muted)',
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: pode ? 'pointer' : 'not-allowed',
            whiteSpace: 'nowrap'
          }}
        >
          {pode ? 'Realizar' : !idadeOk ? `Idade ${act.idadeMinima}+` : !saldoOk ? 'Sem Saldo' : 'Sem Energia'}
        </button>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Saúde & Bem-estar */}
      <div className="card">
        <h3 className="card-title">
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={20} color="var(--accent-rose)" />
            Saúde, Medicina & Estética
          </span>
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {saudeAtividades.map(renderItem)}
        </div>
      </div>

      {/* Lazer & Viagens */}
      <div className="card">
        <h3 className="card-title">
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={20} color="var(--accent-blue)" />
            Lazer, Viagens & Diversão
          </span>
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {lazerAtividades.map(renderItem)}
        </div>
      </div>

      {/* Social & Confraternização */}
      <div className="card">
        <h3 className="card-title">
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={20} color="var(--accent-amber)" />
            Social, Família & Comunidade
          </span>
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {socialAtividades.map(renderItem)}
        </div>
      </div>

      {/* Desenvolvimento Pessoal */}
      <div className="card">
        <h3 className="card-title">
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={20} color="var(--accent-purple)" />
            Autoconhecimento & Mente
          </span>
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {desenvAtividades.map(renderItem)}
        </div>
      </div>
    </div>
  );
};
