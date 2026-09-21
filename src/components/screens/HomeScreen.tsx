import React from 'react';

interface HomeScreenProps {
  hasSavedGame: boolean;
  onNovaVida: () => void;
  onContinuar: () => void;
  onEstatisticas: () => void;
  onGerarAleatorio: () => void;
}

/**
 * Tela inicial.
 *
 * A marca é tipográfica, não um emoji. A ação de maior peso é sempre a que
 * leva o jogador de volta à vida: continuar, se existir save; começar, se não.
 */
export const HomeScreen: React.FC<HomeScreenProps> = ({
  hasSavedGame,
  onNovaVida,
  onContinuar,
  onEstatisticas,
  onGerarAleatorio
}) => {
  return (
    <div className="screen">
      <div className="screen__inner">
        <h1 className="title-mark">VIDA</h1>
        <p className="title-tagline">Pequenas escolhas, grandes histórias</p>

        <div className="screen__actions">
          {hasSavedGame && (
            <button onClick={onContinuar} className="btn btn--hero">
              Continuar sua vida
            </button>
          )}

          <button
            onClick={onNovaVida}
            className={`btn ${hasSavedGame ? 'btn--secondary' : 'btn--hero'}`}
          >
            Começar uma nova vida
          </button>

          <button onClick={onGerarAleatorio} className="btn btn--ghost">
            Vida aleatória
          </button>

          <button onClick={onEstatisticas} className="btn btn--ghost">
            Vidas anteriores
          </button>
        </div>
      </div>
    </div>
  );
};
