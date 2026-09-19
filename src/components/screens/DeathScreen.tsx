import React from 'react';
import { PostMortemSummary } from '../../types';
import { formatarDinheiro } from '../../utils/formatters';
import { Award, RotateCcw } from 'lucide-react';

interface DeathScreenProps {
  resumo: PostMortemSummary;
  onJogarNovamente: () => void;
  onVerEstatisticas: () => void;
}

export const DeathScreen: React.FC<DeathScreenProps> = ({
  resumo,
  onJogarNovamente,
  onVerEstatisticas
}) => {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'radial-gradient(circle at top center, #1a162b 0%, #090d16 85%)'
      }}
    >
      <div style={{ maxWidth: '560px', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Card do Obituário */}
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '28px 24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'linear-gradient(180deg, #181c2e 0%, #111827 100%)'
          }}
        >
          <div style={{ fontSize: '2.8rem', marginBottom: '4px' }}>🕊️</div>
          <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-muted)', fontWeight: 700 }}>
            Em Memória de
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '2.2rem',
              fontWeight: 900,
              color: 'var(--text-primary)',
              margin: '4px 0 8px'
            }}
          >
            {resumo.nomeCompleto}
          </h1>

          <div style={{ fontSize: '0.95rem', color: 'var(--accent-amber)', fontWeight: 700, marginBottom: '14px' }}>
            {resumo.anoNascimento} — {resumo.anoMorte} ({resumo.idadeMorte} anos)
          </div>

          <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: '20px' }}>
            {resumo.epitafio}
          </p>

          {/* Grid de Estatísticas Finais */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              textAlign: 'left',
              background: 'var(--bg-card-subtle)',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px'
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Causa da Morte</div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent-rose)' }}>
                {resumo.causaMorte}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Patrimônio Final</div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--accent-amber)' }}>
                {formatarDinheiro(resumo.patrimonioFinal)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Última Profissão</div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)' }}>
                {resumo.profissaoFinal}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Legado Familiar</div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                {resumo.quantidadeFilhos} {resumo.quantidadeFilhos === 1 ? 'filho(a)' : 'filhos'}
              </div>
            </div>
          </div>

          {/* Biografia Resumida */}
          <div style={{ textAlign: 'left', marginBottom: '20px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Biografia da Vida:
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {resumo.biografiaResumo}
            </p>
          </div>

          {/* Pontuação */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '10px', background: 'var(--primary-glow)', borderRadius: 'var(--radius-sm)', color: 'var(--primary)', fontWeight: 800 }}>
            <Award size={20} />
            <span>PONTUAÇÃO DE VIDA: {resumo.pontuacaoVida.toLocaleString('pt-BR')} PTS</span>
          </div>
        </div>

        {/* Botões de Ação */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onJogarNovamente}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#022c22',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              fontWeight: 800,
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: 'var(--shadow-glow)'
            }}
          >
            <RotateCcw size={18} strokeWidth={2.5} />
            <span>VIVER NOVA VIDA</span>
          </button>

          <button
            onClick={onVerEstatisticas}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-card)',
              color: 'var(--text-primary)',
              padding: '16px 20px',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Award size={18} />
            <span>HALL DA FAMA</span>
          </button>
        </div>
      </div>
    </div>
  );
};
