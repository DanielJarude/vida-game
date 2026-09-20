import React, { useState, useEffect } from 'react';
import { GlobalStats } from '../../types';
import { carregarEstatisticasGlobais } from '../../systems/saveSystem';
import { formatarDinheiro } from '../../utils/formatters';
import { ArrowLeft } from 'lucide-react';

interface StatsScreenProps {
  onVoltar: () => void;
}

export const StatsScreen: React.FC<StatsScreenProps> = ({ onVoltar }) => {
  const [stats, setStats] = useState<GlobalStats>(() =>
    carregarEstatisticasGlobais()
  );

  useEffect(() => {
    setStats(carregarEstatisticasGlobais());
  }, []);

  return (
    <div className="screen screen--wide screen--scroll">
      <div className="screen__inner">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            marginBottom: 'var(--space-7)'
          }}
        >
          <button onClick={onVoltar} className="icon-button" aria-label="Voltar">
            <ArrowLeft size={20} />
          </button>
          <h1 className="section__title">Vidas anteriores</h1>
        </div>

        <div className="obituary__stats" style={{ marginTop: 0, borderTop: 0, paddingTop: 0 }}>
          <div>
            <p className="obituary__stat-label">Vidas jogadas</p>
            <p className="obituary__stat-value">{stats.vidasJogadas}</p>
          </div>
          <div>
            <p className="obituary__stat-label">Anos vividos</p>
            <p className="obituary__stat-value">{stats.totalAnosVividos}</p>
          </div>
          <div>
            <p className="obituary__stat-label">Maior idade</p>
            <p className="obituary__stat-value">
              {stats.maiorIdade > 0 ? `${stats.maiorIdade}` : '—'}
            </p>
          </div>
          <div>
            <p className="obituary__stat-label">Maior patrimônio</p>
            <p className="obituary__stat-value">
              {stats.maiorPatrimonio > 0
                ? formatarDinheiro(stats.maiorPatrimonio)
                : '—'}
            </p>
          </div>
        </div>

        <section className="section" style={{ marginTop: 'var(--space-8)' }}>
          <div>
            <h2 className="subsection__title">Histórico</h2>

            {stats.historicoVidas.length === 0 ? (
              <p className="empty-state">
                Nenhuma vida concluída ainda. Toda história precisa de um fim
                para ser contada.
              </p>
            ) : (
              <div className="action-list">
                {stats.historicoVidas.map((record, indice) => (
                  <div key={record.id} className="record-row">
                    <span className="record-row__rank">{indice + 1}</span>
                    <span>
                      <span className="record-row__name">{record.nome}</span>
                      <span className="record-row__meta">
                        {record.cidade}, {record.estado} · {record.profissao} ·
                        faleceu aos {record.idadeMorte} anos
                      </span>
                    </span>
                    <span className="record-row__score">
                      {record.pontuacao.toLocaleString('pt-BR')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
