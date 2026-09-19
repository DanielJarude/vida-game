import React from 'react';
import { ActivityOption } from '../../data/activitiesData';
import { Character, EconomyState } from '../../types';
import {
  AtividadeComDisponibilidade,
  getAtividadesVisiveis,
  ContextoAcao
} from '../../systems/availabilitySystem';
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
  ctx: ContextoAcao;
  onExecutarAtividade: (atividade: ActivityOption) => void;
}

const TITULOS_CATEGORIA: Record<ActivityOption['categoria'], { titulo: string; icon: React.ReactNode }> = {
  saude: { titulo: 'Saúde e Bem-estar', icon: <Activity size={20} color="var(--accent-rose)" /> },
  lazer: { titulo: 'Lazer e Viagens', icon: <Compass size={20} color="var(--accent-blue)" /> },
  social: { titulo: 'Social e Comunidade', icon: <Users size={20} color="var(--accent-amber)" /> },
  desenvolvimento: { titulo: 'Autoconhecimento e Mente', icon: <BookOpen size={20} color="var(--accent-purple)" /> }
};

export const ActivitiesTab: React.FC<ActivitiesTabProps> = ({
  personagem,
  economia,
  ctx,
  onExecutarAtividade
}) => {
  // A lista vem da política central: atividades incompatíveis com a fase ficam ocultas
  const grupos = getAtividadesVisiveis(ctx);

  const renderItem = (item: AtividadeComDisponibilidade) => {
    const { atividade, disponibilidade } = item;
    const pode = disponibilidade.kind === 'disponivel';
    const motivo = disponibilidade.kind === 'bloqueado' ? disponibilidade.motivo : undefined;
    const rotuloBotao = pode
      ? 'Realizar'
      : disponibilidade.kind === 'bloqueado' && disponibilidade.reasonCode === 'repeticao_anual'
      ? 'Já fez este ano'
      : disponibilidade.kind === 'bloqueado' && disponibilidade.reasonCode === 'saldo_insuficiente'
      ? 'Sem saldo'
      : motivo || 'Indisponível';

    return (
      <div
        key={atividade.id}
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
            {atividade.nome}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {atividade.descricao}
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px', fontSize: '0.75rem' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{atividade.efeitoResumo}</span>
          </div>
          <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--accent-amber)', marginTop: '2px' }}>
            {atividade.custo === 0 ? 'Gratuito' : `Custo: ${formatarDinheiro(atividade.custo)}`}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <button
            disabled={!pode}
            onClick={() => onExecutarAtividade(atividade)}
            className={pode ? 'btn-acao-primaria' : 'btn-acao-desabilitada'}
            title={motivo}
          >
            {rotuloBotao}
          </button>
          {!pode && motivo && motivo !== rotuloBotao && (
            <div className="acao-bloqueada-motivo" role="status">
              {motivo}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (grupos.length === 0) {
    return (
      <div className="card" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        Nenhuma atividade disponível para a sua fase da vida neste momento.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {grupos.map(grupo => (
        <div className="card" key={grupo.categoria}>
          <h3 className="card-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {TITULOS_CATEGORIA[grupo.categoria].icon}
              {TITULOS_CATEGORIA[grupo.categoria].titulo}
            </span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {grupo.itens.map(renderItem)}
          </div>
        </div>
      ))}
      {/* Saldo de referência para atividades pagas */}
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
        Saldo disponível: {formatarDinheiro(economia.dinheiro)} · {personagem.cidade}
      </div>
    </div>
  );
};
