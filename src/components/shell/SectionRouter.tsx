import React from 'react';
import type { TabId, ContextoAcao } from '../../systems/availabilitySystem';
import type {
  CareerState,
  Character,
  EconomyState,
  EducationState,
  FamilyMember,
  FamilyInteractionType,
  Gender,
  LifeLogEntry
} from '../../types';
import type { ActivityOption } from '../../data/activitiesData';
import { TimelineSection } from '../timeline/TimelineSection';
import { FamilyTab } from '../tabs/FamilyTab';
import { CareerTab } from '../tabs/CareerTab';
import { EconomyTab } from '../tabs/EconomyTab';
import { ActivitiesTab } from '../tabs/ActivitiesTab';

export interface SectionRouterProps {
  aba: TabId;
  ctx: ContextoAcao;

  personagem: Character;
  familia: FamilyMember[];
  educacao: EducationState;
  carreira: CareerState;
  economia: EconomyState;
  timeline: LifeLogEntry[];
  eventoAberto: boolean;

  onEnvelhecer: () => void;
  onInteragirFamilia: (
    membroId: string,
    tipoAcao: FamilyInteractionType,
    presenteTipo?: 'barato' | 'medio' | 'luxo'
  ) => void;
  onPedirCasamento: (parceiroId: string) => void;
  onTerFilho: (parceiroId?: string, nome?: string, genero?: Gender) => void;
  onTerminarRelacionamento: (parceiroId: string) => void;
  onAbrirEncontros: () => void;

  onAcaoEscola: (acao: 'estudar' | 'matar_aula' | 'socializar') => void;
  onMatricularCurso: (cursoId: string, tipoInst: 'publica' | 'privada') => void;
  onCandidatarVaga: (jobId: string) => void;
  onTrabalharMais: () => void;
  onPedirAumento: () => void;
  onPedirDemissao: () => void;
  onFazerBico: (bicoId: string) => void;

  onComprarBem: (itemId: string) => void;
  onVenderBem: (propId: string) => void;
  onInvestir: (
    tipoId: 'poupanca' | 'tesouro_selic' | 'fundo_imobiliario' | 'acoes_b3' | 'cripto',
    valor: number
  ) => void;
  onResgatarInvestimento: (tipoId: string, valor: number) => void;
  onJogarLoteria: () => void;

  onExecutarAtividade: (atividade: ActivityOption) => void;
}

/**
 * Seleciona a seção ativa.
 *
 * Existe para que `App.tsx` não acumule o markup de todas as seções. A aba
 * recebida já foi validada contra a política de disponibilidade por idade —
 * este componente não decide permissões.
 */
export const SectionRouter: React.FC<SectionRouterProps> = props => {
  const { aba } = props;

  switch (aba) {
    case 'timeline':
      return (
        <TimelineSection
          timeline={props.timeline}
          idadeAtual={props.personagem.idade}
          onEnvelhecer={props.onEnvelhecer}
          bloqueado={props.eventoAberto}
        />
      );

    case 'familia':
      return (
        <FamilyTab
          personagem={props.personagem}
          familia={props.familia}
          ctx={props.ctx}
          onInteragir={props.onInteragirFamilia}
          onPedirCasamento={props.onPedirCasamento}
          onTerFilho={props.onTerFilho}
          onTerminar={props.onTerminarRelacionamento}
          onOpenDatingModal={props.onAbrirEncontros}
        />
      );

    case 'carreira':
      return (
        <CareerTab
          personagem={props.personagem}
          educacao={props.educacao}
          carreira={props.carreira}
          ctx={props.ctx}
          onAcaoEscola={props.onAcaoEscola}
          onMatricularCurso={props.onMatricularCurso}
          onCandidatarVaga={props.onCandidatarVaga}
          onTrabalharMais={props.onTrabalharMais}
          onPedirAumento={props.onPedirAumento}
          onPedirDemissao={props.onPedirDemissao}
          onFazerBico={props.onFazerBico}
        />
      );

    case 'financas':
      return (
        <EconomyTab
          personagem={props.personagem}
          economia={props.economia}
          ctx={props.ctx}
          onComprarBem={props.onComprarBem}
          onVenderBem={props.onVenderBem}
          onInvestir={props.onInvestir}
          onResgatarInvestimento={props.onResgatarInvestimento}
          onJogarLoteria={props.onJogarLoteria}
        />
      );

    case 'atividades':
      return (
        <ActivitiesTab
          personagem={props.personagem}
          economia={props.economia}
          ctx={props.ctx}
          onExecutarAtividade={props.onExecutarAtividade}
        />
      );

    default:
      return null;
  }
};
