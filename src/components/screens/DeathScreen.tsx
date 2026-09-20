import React from 'react';
import { PostMortemSummary } from '../../types';
import { formatarDinheiro } from '../../utils/formatters';

interface DeathScreenProps {
  resumo: PostMortemSummary;
  onJogarNovamente: () => void;
  onVerEstatisticas: () => void;
}

/**
 * Obituário — o fecho da biografia.
 *
 * Tom contemplativo e editorial: nome, datas, epitáfio e o resumo da
 * trajetória. Sem emoji, sem gamificação estridente.
 */
export const DeathScreen: React.FC<DeathScreenProps> = ({
  resumo,
  onJogarNovamente,
  onVerEstatisticas
}) => {
  return (
    <div className="screen screen--scroll">
      <div className="screen__inner" style={{ paddingTop: 'var(--space-8)' }}>
        <p className="title-tagline">Em memória de</p>
        <h1 className="obituary__name">{resumo.nomeCompleto}</h1>
        <p className="obituary__dates">
          {resumo.anoNascimento} — {resumo.anoMorte} · {resumo.idadeMorte} anos ·{' '}
          {resumo.cidade}, {resumo.estado}
        </p>

        {resumo.epitafio && (
          <p className="obituary__epitaph">{resumo.epitafio}</p>
        )}

        {resumo.biografiaResumo && (
          <p className="obituary__biography">{resumo.biografiaResumo}</p>
        )}

        <div className="obituary__stats">
          <div>
            <p className="obituary__stat-label">Causa</p>
            <p className="obituary__stat-value" style={{ fontSize: 'var(--type-body)' }}>
              {resumo.causaMorte}
            </p>
          </div>
          <div>
            <p className="obituary__stat-label">Ocupação</p>
            <p className="obituary__stat-value" style={{ fontSize: 'var(--type-body)' }}>
              {resumo.profissaoFinal}
            </p>
          </div>
          <div>
            <p className="obituary__stat-label">Escolaridade</p>
            <p className="obituary__stat-value" style={{ fontSize: 'var(--type-body)' }}>
              {resumo.nivelEducacao}
            </p>
          </div>
          <div>
            <p className="obituary__stat-label">Patrimônio final</p>
            <p className="obituary__stat-value">
              {formatarDinheiro(resumo.patrimonioFinal)}
            </p>
          </div>
          <div>
            <p className="obituary__stat-label">Filhos</p>
            <p className="obituary__stat-value">{resumo.quantidadeFilhos}</p>
          </div>
          <div>
            <p className="obituary__stat-label">Pontuação</p>
            <p className="obituary__stat-value">
              {resumo.pontuacaoVida.toLocaleString('pt-BR')}
            </p>
          </div>
        </div>

        {resumo.principaisConquistas.length > 0 && (
          <section className="section" style={{ marginTop: 'var(--space-8)' }}>
            <div>
              <h2 className="subsection__title">O que ficou</h2>
              <ul className="annual-summary__list">
                {resumo.principaisConquistas.map((c, i) => (
                  <li key={i} className="annual-summary__item">
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <div className="screen__actions">
          <button onClick={onJogarNovamente} className="btn btn--hero">
            Viver outra vida
          </button>
          <button onClick={onVerEstatisticas} className="btn btn--ghost">
            Ver vidas anteriores
          </button>
        </div>
      </div>
    </div>
  );
};
