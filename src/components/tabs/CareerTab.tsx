import React, { useState } from 'react';
import { CareerState, Character, EducationState } from '../../types';
import { CURSOS_DISPONIVEIS } from '../../data/coursesData';
import { JobMarketModal } from '../modals/JobMarketModal';
import { formatarDinheiro, getEducationLabel, getRotuloPosturaEscolar, getStatColor } from '../../utils/formatters';
import {
  ContextoAcao,
  getActionAvailability,
  getBicosVisiveis,
  IDADE_MINIMA_BICOS,
  IDADE_MINIMA_ESCOLA,
  IDADE_MINIMA_FACULDADE
} from '../../systems/availabilitySystem';
import {
  GraduationCap,
  Briefcase,
  Search,
  BookOpen,
  Users,
  DoorOpen,
  Clock,
  Coins,
  LogOut
} from 'lucide-react';

interface CareerTabProps {
  personagem: Character;
  educacao: EducationState;
  carreira: CareerState;
  ctx: ContextoAcao;
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
  ctx,
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

  const idade = personagem.idade;
  const mostrarEducacao = idade >= IDADE_MINIMA_ESCOLA || educacao.emCurso || educacao.cursosConcluidos.length > 0;
  const mostrarCarreira = idade >= 16 || carreira.empregado || carreira.aposentado;
  const mostrarBicos = idade >= IDADE_MINIMA_BICOS;

  // Vestibular: prévia útil a partir dos 17 (bloqueado com motivo); aberto aos 18
  const disponibilidadeVestibular = getActionAvailability(ctx, 'ingressar_curso', { cursoId: selectedCursoId || undefined });
  const mostrarVestibular =
    !educacao.emCurso &&
    (idade >= IDADE_MINIMA_FACULDADE - 1 || educacao.nivelAtual === 'medio_completo' || educacao.nivelAtual === 'tecnico');

  const bicos = getBicosVisiveis(ctx);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Seção de Educação Atual */}
      {mostrarEducacao && (
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
                  {educacao.instituicao} {educacao.isPublica ? '(Pública - Gratuita)' : `(Mensalidade: ${formatarDinheiro(educacao.mensalidade || 0)}/mês)`}
                </div>
                {educacao.semestreAtual && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--accent-blue)', marginTop: '4px' }}>
                    Semestre {educacao.semestreAtual} de {educacao.totalSemestres}
                  </div>
                )}

                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                    <span>Desempenho Acadêmico / Notas</span>
                    <strong style={{ color: getStatColor(educacao.desempenho) }}>{Math.round(educacao.desempenho)}%</strong>
                  </div>
                  <div className="stat-bar-track">
                    <div
                      className="stat-bar-fill"
                      style={{ width: `${educacao.desempenho}%`, backgroundColor: getStatColor(educacao.desempenho) }}
                    />
                  </div>
                </div>
              </div>

              {/* Postura escolar: compromisso do ano (uma escolha por ano) */}
              {educacao.posturaAno ? (
                <div className="postura-definida" role="status">
                  <BookOpen size={16} />
                  <span>
                    Postura deste ano: <strong>{getRotuloPosturaEscolar(educacao.posturaAno)}</strong>. Os efeitos aparecem na virada do ano.
                  </span>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Escolha a postura deste ano (vale até a virada do ano):
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                    <button
                      className="option-btn acao-contextual"
                      onClick={() => onAcaoEscola('estudar')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)' }}>
                        <BookOpen size={16} /> Estudar Firme
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>+ Notas e Inteligência</div>
                    </button>
                    <button
                      className="option-btn acao-contextual"
                      onClick={() => onAcaoEscola('socializar')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent-amber)' }}>
                        <Users size={16} /> Socializar
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>+ Amizades e Humor</div>
                    </button>
                    <button
                      className="option-btn acao-contextual"
                      onClick={() => onAcaoEscola('matar_aula')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent-rose)' }}>
                        <DoorOpen size={16} /> Matar Aula
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>- Notas, + Lazer</div>
                    </button>
                  </div>
                </div>
              )}
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

          {/* Inscrição em Faculdade / Curso Técnico */}
          {mostrarVestibular && (
            <div style={{ marginTop: '16px', background: 'var(--bg-card-subtle)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '8px' }}>
                Vestibular & Faculdade
              </div>

              {disponibilidadeVestibular.kind === 'bloqueado' ? (
                <div className="acao-bloqueada-motivo" role="status">
                  {disponibilidadeVestibular.motivo}
                </div>
              ) : (
                <>
                  <select
                    value={selectedCursoId}
                    onChange={e => setSelectedCursoId(e.target.value)}
                    aria-label="Escolher graduação ou curso técnico"
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
                        className="btn-acao-primaria"
                        style={{ flex: 1 }}
                      >
                        Prestar ENEM / Federal (Grátis)
                      </button>
                      <button
                        onClick={() => onMatricularCurso(selectedCursoId, 'privada')}
                        className="btn-acao-secundaria"
                        style={{ flex: 1 }}
                      >
                        Matricular na Particular
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Seção de Carreira e Trabalho */}
      {mostrarCarreira && (
        <div className="card">
          <h3 className="card-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Briefcase size={20} color="var(--accent-amber)" />
              Carreira Profissional
            </span>
            {!carreira.aposentado && (
              <button
                onClick={() => setShowJobModal(true)}
                className="btn-acao-primaria"
                style={{ padding: '6px 14px' }}
              >
                <Search size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                Procurar Emprego
              </button>
            )}
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
                  className="option-btn acao-contextual"
                  onClick={onTrabalharMais}
                  disabled={carreira.horasExtras}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)' }}>
                    <Clock size={16} /> {carreira.horasExtras ? 'Horas Extras Ativas' : 'Fazer Hora Extra'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {carreira.horasExtras ? 'Efeito na virada do ano' : 'Compromisso do ano'}
                  </div>
                </button>
                <button
                  className="option-btn acao-contextual"
                  onClick={onPedirAumento}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent-amber)' }}>
                    <Coins size={16} /> Pedir Aumento
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Reajuste de Salário</div>
                </button>
                <button
                  className="option-btn acao-contextual"
                  onClick={onPedirDemissao}
                  style={{ borderColor: 'rgba(244, 63, 94, 0.4)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent-rose)' }}>
                    <LogOut size={16} /> Pedir Demissão
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sair do Emprego</div>
                </button>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {carreira.aposentado
                ? 'Você está aposentado(a) e desfrutando do seu benefício previdenciário.'
                : idade < 18
                ? 'Nesta fase, apenas vagas juvenis (como Jovem Aprendiz) estão disponíveis. As demais vagas abrem aos 18 anos.'
                : 'Você está desempregado(a) no momento. Clique no botão acima para ver as vagas disponíveis.'}
            </div>
          )}
        </div>
      )}

      {/* Seção de Bicos & Renda Extra (adultos) */}
      {mostrarBicos && (
        <div className="card">
          <h3 className="card-title">
            <span>Bicos & Renda Extra</span>
          </h3>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
            Escolha um bico para o ano; o pagamento entra na virada do ano.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {bicos.map(({ bico, disponibilidade }) => {
              const pode = disponibilidade.kind === 'disponivel';
              const motivo = disponibilidade.kind === 'bloqueado' ? disponibilidade.motivo : undefined;
              return (
                <div
                  key={bico.id}
                  style={{
                    background: 'var(--bg-card-subtle)',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{bico.nome}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {bico.descricao}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--accent-amber)', fontWeight: 700 }}>
                      {formatarDinheiro(bico.ganhoEstimadoAnual)} por ano
                    </div>
                    {motivo && (
                      <div className="acao-bloqueada-motivo">{motivo}</div>
                    )}
                  </div>
                  <button
                    onClick={() => onFazerBico(bico.id)}
                    disabled={!pode}
                    className={pode ? 'btn-acao-secundaria' : 'btn-acao-desabilitada'}
                  >
                    {pode ? 'Trabalhar' : carreira.bicoAtivoId ? 'Já escolhido' : 'Indisponível'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal do Mercado de Trabalho */}
      {showJobModal && (
        <JobMarketModal
          ctx={ctx}
          onClose={() => setShowJobModal(false)}
          onCandidatar={onCandidatarVaga}
        />
      )}
    </div>
  );
};
