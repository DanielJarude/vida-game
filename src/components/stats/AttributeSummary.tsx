import React from 'react';
import { Smile, HeartPulse, Brain, Sparkles } from 'lucide-react';
import type { VisibleStats } from '../../types';

interface AttributeSummaryProps {
  stats: VisibleStats;
  /** Variação desde o ano anterior, para manter as mudanças perceptíveis. */
  variacao?: Partial<VisibleStats>;
}

const DEFINICOES: {
  chave: keyof VisibleStats;
  rotulo: string;
  icone: React.ReactNode;
}[] = [
  { chave: 'felicidade', rotulo: 'Felicidade', icone: <Smile size={14} /> },
  { chave: 'saude', rotulo: 'Saúde', icone: <HeartPulse size={14} /> },
  { chave: 'inteligencia', rotulo: 'Inteligência', icone: <Brain size={14} /> },
  { chave: 'aparencia', rotulo: 'Aparência', icone: <Sparkles size={14} /> }
];

const LIMITE_BAIXO = 25;

/**
 * Atributos visíveis — secundários à vida, nunca um painel de analytics.
 *
 * Linhas finas com o valor em texto: a informação não depende da barra nem
 * da cor. A faixa crítica é marcada por cor E por palavra ("crítica"),
 * atendendo ao requisito de não depender só de cor.
 */
export const AttributeSummary: React.FC<AttributeSummaryProps> = ({
  stats,
  variacao
}) => {
  return (
    <div className="attributes">
      {DEFINICOES.map(({ chave, rotulo, icone }) => {
        const valor = Math.round(stats[chave]);
        const delta = variacao?.[chave] ? Math.round(variacao[chave] as number) : 0;
        const baixo = valor < LIMITE_BAIXO;

        return (
          <div
            key={chave}
            className={`attribute${baixo ? ' attribute--baixo' : ''}`}
          >
            <span className="attribute__label">
              <span aria-hidden="true">{icone}</span>
              {rotulo}
            </span>

            <span className="attribute__value">
              {valor}
              {baixo && <span className="visually-hidden"> — faixa crítica</span>}
              {delta !== 0 && (
                <span
                  className={`attribute__delta attribute__delta--${
                    delta > 0 ? 'sobe' : 'desce'
                  }`}
                >
                  {' '}
                  {delta > 0 ? '▲' : '▼'}
                  {Math.abs(delta)}
                </span>
              )}
            </span>

            <div
              className="attribute__track"
              role="meter"
              aria-valuenow={valor}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={rotulo}
            >
              <div className="attribute__fill" style={{ width: `${valor}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
