import React, { useState, useEffect } from 'react';
import { GlobalStats } from '../../types';
import { carregarEstatisticasGlobais } from '../../systems/saveSystem';
import { formatarDinheiro } from '../../utils/formatters';
import { ArrowLeft, Award, Users, DollarSign, Calendar } from 'lucide-react';

interface StatsScreenProps {
  onVoltar: () => void;
}

export const StatsScreen: React.FC<StatsScreenProps> = ({ onVoltar }) => {
  const [stats, setStats] = useState<GlobalStats>(() => carregarEstatisticasGlobais());

  useEffect(() => {
    setStats(carregarEstatisticasGlobais());
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '24px 16px',
        maxWidth: '800px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}
    >
      {/* Topo */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={onVoltar} className="btn-icon">
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800 }}>
          Hall da Fama & Estatísticas
        </h1>
        <div style={{ width: '36px' }} />
      </div>

      {/* Grid de Estatísticas Globais */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
        <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
          <div style={{ color: 'var(--primary)', marginBottom: '4px' }}>
            <Users size={22} style={{ margin: '0 auto' }} />
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Vidas Jogadas</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{stats.vidasJogadas}</div>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
          <div style={{ color: 'var(--accent-blue)', marginBottom: '4px' }}>
            <Calendar size={22} style={{ margin: '0 auto' }} />
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Anos Vividos</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{stats.totalAnosVividos}</div>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
          <div style={{ color: 'var(--accent-amber)', marginBottom: '4px' }}>
            <Award size={22} style={{ margin: '0 auto' }} />
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Maior Idade</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>
            {stats.maiorIdade > 0 ? `${stats.maiorIdade} anos` : '—'}
          </div>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
          <div style={{ color: 'var(--accent-rose)', marginBottom: '4px' }}>
            <DollarSign size={22} style={{ margin: '0 auto' }} />
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Maior Fortuna</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>
            {stats.maiorPatrimonio > 0 ? formatarDinheiro(stats.maiorPatrimonio) : '—'}
          </div>
        </div>
      </div>

      {/* Lista de Vidas Anteriores */}
      <div className="card">
        <h3 className="card-title">
          <span>📜 Registros de Vidas Concluídas</span>
        </h3>

        {stats.historicoVidas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
            Nenhuma vida concluída até o momento. Jogue uma nova vida para registrar seu legado aqui!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {stats.historicoVidas.map((record) => (
              <div
                key={record.id}
                style={{
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-card)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                    {record.nome}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {record.cidade}, {record.estado} • {record.profissao}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-rose)', marginTop: '2px' }}>
                    Faleceu aos {record.idadeMorte} anos ({record.causaMorte})
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--accent-amber)' }}>
                    {formatarDinheiro(record.patrimonio)}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700 }}>
                    {record.pontuacao.toLocaleString('pt-BR')} pts
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
