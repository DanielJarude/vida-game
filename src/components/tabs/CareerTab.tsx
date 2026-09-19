import React, { useState } from 'react';
import { CareerState, Character, EducationState } from '../../types';
import { CURSOS_DISPONIVEIS } from '../../data/coursesData';
import { BICOS_DISPONIVEIS } from '../../data/careersData';
import { JobMarketModal } from '../modals/JobMarketModal';
import { formatarDinheiro, getEducationLabel, getStatColor } from '../../utils/formatters';
import {
  GraduationCap,
  Briefcase
} from 'lucide-react';

interface CareerTabProps {
  personagem: Character;
  educacao: EducationState;
  carreira: CareerState;
  onAcaoEscola: (acao: 'estudar' | 'matar_aula' | 'socializar') => void;
  onMatricularCurso: (cursoId: string, tipoInst: 'publica' | 'privada') => void;
  onCandidatarVaga: (jobId: string) => void;
  onTrabalharMais: () => void;
  onPedirAumento: () => void;
  onPedirDemissao: () => void;
  onFazerBico: (bicoId: string) => void;
}

export const CareerTab: React.FC<CareerTabProps> = ({
  personagem,
  educacao,
  carreira,
  onAcaoEscola,
  onMatricularCurso,
  onCandidatarVaga,
  onTrabalharMais,
  onPedirAumento,
  onPedirDemissao,
  onFazerBico
}) => {
  const [showJobModal, setShowJobModal] = useState(false);
  const [selectedCursoId, setSelectedCursoId] = useState<string>('');

  const podeFaculdade = personagem.idade >= 17 && (
    educacao.nivelAtual === 'medio_completo' ||
    educacao.nivelAtual === 'tecnico' ||
    educacao.nivelAtual === 'superior_completo'
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Seção de Educação Atual */}
      <div className="card">
        <h3 className="card-title">
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GraduationCap size={20} color="var(--primary)" />
            Educação & Estudos
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {getEducationLabel(educacao.nivelAtual)}
          </span>
        </h3>

        {educacao.emCurso ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: 'var(--bg-card-subtle)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                {educacao.nomeCurso}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {educacao.instituicao} {educacao.isPublica ? '(Pública - Gratuita)' : `(Mensalidade: R$ ${educacao.mensalidade}/mês)`}
              </div>
              {educacao.semestreAtual && (
                <div style={{ fontSize: '0.8rem', color: 'var(--accent-blue)', marginTop: '4px' }}>
                  Semestre {educacao.semestreAtual} de {educacao.totalSemestres}
                </div>
              )}

              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                  <span>Desempenho Acadêmico / Notas</span>
                  <strong style={{ color: getStatColor(educacao.desempenho) }}>{educacao.desempenho}%</strong>
                </div>
                <div className="stat-bar-track">
                  <div
                    className="stat-bar-fill"
                    style={{ width: `${educacao.desempenho}%`, backgroundColor: getStatColor(educacao.desempenho) }}
                  />
                </div>
              </div>
            </div>

            {/* Ações Escolares */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
              <button
                className="option-btn"
                onClick={() => onAcaoEscola('estudar')}
                style={{ textAlign: 'center', padding: '10px' }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)' }}>📖 Estudar Firme</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>+ Notas e Inteligência</div>
              </button>
              <button
                className="option-btn"
                onClick={() => onAcaoEscola('socializar')}
                style={{ textAlign: 'center', padding: '10px' }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent-amber)' }}>🎉 Socializar</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>+ Amizades e Humor</div>
              </button>
              <button
                className="option-btn"
                onClick={() => onAcaoEscola('matar_aula')}
                style={{ textAlign: 'center', padding: '10px' }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent-rose)' }}>🏃 Matar Aula</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>- Notas, + Lazer</div>
              </button>
            </div>
          </div>
        ) : (
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {educacao.nivelAtual === 'nenhuma'
              ? 'Você ainda não tem idade escolar (inicia aos 6 anos).'
              : 'Você não está matriculado em nenhum curso atualmente.'}
          </div>
        )}

        {/* Cursos Concluídos */}
        {educacao.cursosConcluidos.length > 0 && (
          <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-card)', paddingTop: '10px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Diplomas Conquistados:
            </div>
            {educacao.cursosConcluidos.map((c, i) => (
              <div key={i} style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                🎓 {c.nome} ({c.anoConclusao})
              </div>
            ))}
          </div>
        )}

        {/* Inscrição em Faculdade / Curso Técnico (se não estiver estudando) */}
        {!educacao.emCurso && podeFaculdade && (
          <div style={{ marginTop: '16px', background: 'var(--bg-card-subtle)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '8px' }}>
              Vestibular & Faculdade
            </div>
            <select
              value={selectedCursoId}
              onChange={e => setSelectedCursoId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-card)',
                marginBottom: '10px',
                color: '#fff'
              }}
            >
              <option value="">Selecione uma Graduação / Curso Técnico...</option>
              {CURSOS_DISPONIVEIS.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nome} ({c.tipo.toUpperCase()} • {c.area})
                </option>
              ))}
            </select>

            {selectedCursoId && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => onMatricularCurso(selectedCursoId, 'publica')}
                  style={{
                    flex: 1,
                    background: 'var(--primary)',
                    color: '#022c22',
                    padding: '8px',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 700,
                    fontSize: '0.85rem'
                  }}
                >
                  Prestar ENEM / Federal (Grátis)
                </button>
                <button
                  onClick={() => onMatricularCurso(selectedCursoId, 'privada')}
                  style={{
                    flex: 1,
                    background: 'var(--bg-card-hover)',
                    border: '1px solid var(--primary)',
                    color: '#fff',
                    padding: '8px',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 700,
                    fontSize: '0.85rem'
                  }}
                >
                  Matricular na Particular
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Seção de Carreira e Trabalho */}
      <div className="card">
        <h3 className="card-title">
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Briefcase size={20} color="var(--accent-amber)" />
            Carreira Profissional
          </span>
          <button
            onClick={() => setShowJobModal(true)}
            style={{
              background: 'var(--primary)',
              color: '#022c22',
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 700,
              fontSize: '0.85rem'
            }}
          >
            🔍 Procurar Emprego
          </button>
        </h3>

        {carreira.empregado && carreira.cargoAtual ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: 'var(--bg-card-subtle)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                    {carreira.cargoAtual.titulo}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {carreira.cargoAtual.setor} • {carreira.anosNoCargo} {carreira.anosNoCargo === 1 ? 'ano' : 'anos'} na empresa
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--accent-amber)' }}>
                    {formatarDinheiro(carreira.cargoAtual.salarioMensal)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Salário Mensal (CLT)</div>
                </div>
              </div>

              <div style={{ marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                  <span>Desempenho no Trabalho</span>
                  <strong style={{ color: getStatColor(carreira.desempenhoTrabalho) }}>
                    {carreira.desempenhoTrabalho}%
                  </strong>
                </div>
                <div className="stat-bar-track">
                  <div
                    className="stat-bar-fill"
                    style={{
                      width: `${carreira.desempenhoTrabalho}%`,
                      backgroundColor: getStatColor(carreira.desempenhoTrabalho)
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Ações no Trabalho */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
              <button
                className="option-btn"
                onClick={onTrabalharMais}
                style={{ textAlign: 'center', padding: '10px' }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)' }}>⚡ Fazer Hora Extra</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>+ Desempenho e Promoção</div>
              </button>
              <button
                className="option-btn"
                onClick={onPedirAumento}
                style={{ textAlign: 'center', padding: '10px' }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent-amber)' }}>💰 Pedir Aumento</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Reajuste de Salário</div>
              </button>
              <button
                className="option-btn"
                onClick={onPedirDemissao}
                style={{ textAlign: 'center', padding: '10px', borderColor: 'rgba(244, 63, 94, 0.4)' }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent-rose)' }}>🚪 Pedir Demissão</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sair do Emprego</div>
              </button>
            </div>
          </div>
        ) : (
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {carreira.aposentado
              ? 'Você está aposentado(a) e desfrutando do seu benefício previdenciário.'
              : 'Você está desempregado(a) no momento. Clique no botão acima para ver as vagas disponíveis.'}
          </div>
        )}
      </div>

      {/* Seção de Bicos & Renda Extra */}
      {personagem.idade >= 16 && (
        <div className="card">
          <h3 className="card-title">
            <span>🛵 Bicos & Renda Extra</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {BICOS_DISPONIVEIS.map(bico => (
              <div
                key={bico.id}
                style={{
                  background: 'var(--bg-card-subtle)',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{bico.nome}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {bico.descricao}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--accent-amber)', fontWeight: 700 }}>
                    ~ {formatarDinheiro(bico.ganhoEstimadoAnual / 4)} por serviço
                  </div>
                </div>
                <button
                  onClick={() => onFazerBico(bico.id)}
                  style={{
                    background: 'var(--bg-card-hover)',
                    border: '1px solid var(--primary)',
                    color: 'var(--primary)',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 700,
                    fontSize: '0.85rem'
                  }}
                >
                  Trabalhar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal do Mercado de Trabalho */}
      {showJobModal && (
        <JobMarketModal
          personagem={personagem}
          educacao={educacao}
          onClose={() => setShowJobModal(false)}
          onCandidatar={onCandidatarVaga}
        />
      )}
    </div>
  );
};
