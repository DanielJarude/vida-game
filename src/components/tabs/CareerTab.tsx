import React from 'react';
import { CareerState, Character, EducationState } from '../../types';
import { ContextoAcao } from '../../systems/availabilitySystem';
import { EducationSection } from '../career/EducationSection';
import { CareerSection } from '../career/CareerSection';

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

/**
 * Seção "Estudos & Carreira" — apenas composição.
 *
 * Estudos e trabalho são responsabilidades distintas e vivem em componentes
 * próprios (`career/EducationSection` e `career/CareerSection`).
 */
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
  return (
    <div>
      <header className="section__header">
        <h2 className="section__title">Estudos & Carreira</h2>
      </header>

      <EducationSection
        personagem={personagem}
        educacao={educacao}
        ctx={ctx}
        onAcaoEscola={onAcaoEscola}
        onMatricularCurso={onMatricularCurso}
      />

      <CareerSection
        personagem={personagem}
        carreira={carreira}
        ctx={ctx}
        onCandidatarVaga={onCandidatarVaga}
        onTrabalharMais={onTrabalharMais}
        onPedirAumento={onPedirAumento}
        onPedirDemissao={onPedirDemissao}
        onFazerBico={onFazerBico}
      />
    </div>
  );
};
