import React, { useState } from 'react';
import { Character, EducationState } from '../../types';
import { CURSOS_DISPONIVEIS } from '../../data/coursesData';
import {
  formatarDinheiro,
  getEducationLabel,
  getRotuloPosturaEscolar
} from '../../utils/formatters';
import {
  ContextoAcao,
  getActionAvailability,
  IDADE_MINIMA_ESCOLA,
  IDADE_MINIMA_FACULDADE
} from '../../systems/availabilitySystem';
import { Lock } from 'lucide-react';

interface EducationSectionProps {
  personagem: Character;
  educacao: EducationState;
  ctx: ContextoAcao;
  onAcaoEscola: (acao: 'estudar' | 'matar_aula' | 'socializar') => void;
  onMatricularCurso: (cursoId: string, tipoInst: 'publica' | 'privada') => void;
}

const POSTURAS: {
  id: 'estudar' | 'socializar' | 'matar_aula';
  titulo: string;
  detalhe: string;
}[] = [
  { id: 'estudar', titulo: 'Estudar firme', detalhe: 'Foco nas notas e no aprendizado' },
  { id: 'socializar', titulo: 'Socializar', detalhe: 'Prioriza amizades e convivência' },
  { id: 'matar_aula', titulo: 'Matar aula', detalhe: 'Mais tempo livre, menos escola' }
];

/**
 * Estudos: matrícula atual, postura do ano e ingresso em curso superior.
 *
 * Responsabilidade única — a carreira profissional vive em `CareerSection`.
 */
export const EducationSection: React.FC<EducationSectionProps> = ({
  personagem,
  educacao,
  ctx,
  onAcaoEscola,
  onMatricularCurso
}) => {
  const [selectedCursoId, setSelectedCursoId] = useState<string>('');

  const idade = personagem.idade;
  const mostrar =
    idade >= IDADE_MINIMA_ESCOLA ||
    educacao.emCurso ||
    educacao.cursosConcluidos.length > 0;

  if (!mostrar) return null;

  const dispVestibular = getActionAvailability(ctx, 'ingressar_curso', {
    cursoId: selectedCursoId || undefined
  });

  const mostrarVestibular =
    !educacao.emCurso &&
    (idade >= IDADE_MINIMA_FACULDADE - 1 ||
      educacao.nivelAtual === 'medio_completo' ||
      educacao.nivelAtual === 'tecnico');

  return (
    <section className="section">
      <div>
        <header className="section__header">
          <h3 className="section__title">Estudos</h3>
          <p className="section__subtitle">
            {getEducationLabel(educacao.nivelAtual)}
          </p>
        </header>

        {educacao.emCurso ? (
          <div>
            <p className="action-row__title">{educacao.nomeCurso}</p>
            <p className="action-row__detail">
              {educacao.instituicao}
              {educacao.isPublica
                ? ' · pública'
                : ` · ${formatarDinheiro(educacao.mensalidade || 0)}/mês`}
              {educacao.semestreAtual
                ? ` · semestre ${educacao.semestreAtual} de ${educacao.totalSemestres}`
                : ''}
            </p>

            <div className="data-row" style={{ marginTop: 'var(--space-3)' }}>
              <span className="data-row__label">Desempenho acadêmico</span>
              <span className="data-row__value">
                {Math.round(educacao.desempenho)}
              </span>
            </div>

            {/* Postura escolar: um compromisso por ano */}
            {educacao.posturaAno ? (
              <p className="action-row__detail" role="status" style={{ marginTop: 'var(--space-4)' }}>
                Postura deste ano:{' '}
                <strong>{getRotuloPosturaEscolar(educacao.posturaAno)}</strong>. Os
                efeitos aparecem na virada do ano.
              </p>
            ) : (
              <div style={{ marginTop: 'var(--space-4)' }}>
                <h4 className="subsection__title">Postura deste ano</h4>
                <div className="action-list">
                  {POSTURAS.map(p => (
                    <div key={p.id} className="action-row">
                      <div className="action-row__body">
                        <p className="action-row__title">{p.titulo}</p>
                        <p className="action-row__detail">{p.detalhe}</p>
                      </div>
                      <div className="action-row__action">
                        <button
                          className="btn btn--secondary"
                          onClick={() => onAcaoEscola(p.id)}
                        >
                          Escolher
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="empty-state">
            {educacao.nivelAtual === 'nenhuma'
              ? 'A vida escolar começa aos 6 anos.'
              : 'Você não está matriculado em nenhum curso.'}
          </p>
        )}

        {educacao.cursosConcluidos.length > 0 && (
          <div style={{ marginTop: 'var(--space-5)' }}>
            <h4 className="subsection__title">Formação concluída</h4>
            <ul className="action-list">
              {educacao.cursosConcluidos.map((c, i) => (
                <li key={i} className="action-row">
                  <span className="action-row__body">
                    <span className="action-row__title">{c.nome}</span>
                    <span className="action-row__detail">{c.anoConclusao}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {mostrarVestibular && (
          <div style={{ marginTop: 'var(--space-6)' }}>
            <h4 className="subsection__title">Ensino superior e técnico</h4>

            {dispVestibular.kind === 'bloqueado' ? (
              <p className="action-row__reason" role="status">
                <Lock size={12} aria-hidden="true" />
                {dispVestibular.motivo}
              </p>
            ) : (
              <>
                <div className="field">
                  <label className="field__label" htmlFor="curso-superior">
                    Curso
                  </label>
                  <select
                    id="curso-superior"
                    className="field__control"
                    value={selectedCursoId}
                    onChange={e => setSelectedCursoId(e.target.value)}
                  >
                    <option value="">Selecione um curso…</option>
                    {CURSOS_DISPONIVEIS.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nome} · {c.area}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCursoId && (
                  <div
                    style={{
                      display: 'flex',
                      gap: 'var(--space-2)',
                      marginTop: 'var(--space-3)',
                      flexWrap: 'wrap'
                    }}
                  >
                    <button
                      onClick={() => onMatricularCurso(selectedCursoId, 'publica')}
                      className="btn btn--primary"
                    >
                      Prestar vestibular em pública
                    </button>
                    <button
                      onClick={() => onMatricularCurso(selectedCursoId, 'privada')}
                      className="btn btn--secondary"
                    >
                      Matricular em particular
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
