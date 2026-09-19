import React from 'react';
import { Play, RotateCcw, Award, Sparkles } from 'lucide-react';

interface HomeScreenProps {
  hasSavedGame: boolean;
  onNovaVida: () => void;
  onContinuar: () => void;
  onEstatisticas: () => void;
  onGerarAleatorio: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  hasSavedGame,
  onNovaVida,
  onContinuar,
  onEstatisticas,
  onGerarAleatorio
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
        background: 'radial-gradient(circle at top center, #13273e 0%, #090d16 80%)',
        textAlign: 'center'
      }}
    >
      <div style={{ maxWidth: '460px', width: '100%', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* Logo & Título */}
        <div>
          <div style={{ fontSize: '3.5rem', marginBottom: '8px' }}>🌱</div>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '3.5rem',
              fontWeight: 900,
              letterSpacing: '-1.5px',
              background: 'linear-gradient(135deg, #10b981 0%, #38bdf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1
            }}
          >
            VIDA
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '8px' }}>
            Simulador de Vida Brasileiro
          </p>
        </div>

        {/* Menu Principal */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {hasSavedGame && (
            <button
              onClick={onContinuar}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#022c22',
                padding: '16px 24px',
                borderRadius: 'var(--radius-md)',
                fontWeight: 800,
                fontSize: '1.1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: 'var(--shadow-glow)'
              }}
            >
              <RotateCcw size={20} strokeWidth={2.5} />
              <span>CONTINUAR VIDA</span>
            </button>
          )}

          <button
            onClick={onNovaVida}
            style={{
              background: hasSavedGame ? 'var(--bg-card)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: hasSavedGame ? 'var(--text-primary)' : '#022c22',
              border: hasSavedGame ? '1px solid var(--border-card)' : 'none',
              padding: '16px 24px',
              borderRadius: 'var(--radius-md)',
              fontWeight: 800,
              fontSize: '1.1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: hasSavedGame ? 'var(--shadow-sm)' : 'var(--shadow-glow)'
            }}
          >
            <Play size={20} strokeWidth={2.5} />
            <span>NOVA VIDA</span>
          </button>

          <button
            onClick={onGerarAleatorio}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-card)',
              color: 'var(--accent-amber)',
              padding: '14px 20px',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            <Sparkles size={18} />
            <span>GERAR VIDA ALEATÓRIA</span>
          </button>

          <button
            onClick={onEstatisticas}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-card)',
              color: 'var(--text-secondary)',
              padding: '14px 20px',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            <Award size={18} />
            <span>HALL DA FAMA & ESTATÍSTICAS</span>
          </button>
        </div>

        {/* Rodapé informativo */}
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Viva escolhas autênticas em diversas cidades do Brasil.
        </div>
      </div>
    </div>
  );
};
