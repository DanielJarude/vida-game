import React from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import type {
  CareerState,
  Character,
  EconomyState,
  EducationState,
  FamilyMember,
  PersonalityState,
  VisibleStats
} from '../../types';
import type { TabId } from '../../systems/availabilitySystem';
import { GameHeader } from './GameHeader';
import { PrimaryNavigation } from './PrimaryNavigation';
import { CharacterRail } from './CharacterRail';
import { ContextAside } from './ContextAside';

export interface FeedbackMensagem {
  tipo: 'sucesso' | 'info' | 'erro';
  texto: string;
}

interface GameShellProps {
  personagem: Character;
  educacao: EducationState;
  carreira: CareerState;
  economia: EconomyState;
  familia: FamilyMember[];
  personalidade: PersonalityState;
  situacao: string;
  variacaoAtributos?: Partial<VisibleStats>;

  abas: TabId[];
  abaAtiva: TabId;
  onSelecionarAba: (aba: TabId) => void;

  somLigado: boolean;
  onToggleSom: () => void;
  onGoHome: () => void;
  onOpenStats: () => void;

  feedback: FeedbackMensagem | null;

  /** Conteúdo da seção ativa. */
  children: React.ReactNode;
  /** Modais e sobreposições (evento, resumo anual, etc.). */
  overlays?: React.ReactNode;
}

const ICONES_FEEDBACK = {
  sucesso: <CheckCircle2 size={15} aria-hidden="true" />,
  erro: <AlertCircle size={15} aria-hidden="true" />,
  info: <Info size={15} aria-hidden="true" />
};

/**
 * Composição de alto nível do jogo ativo.
 *
 * Responsabilidade única: montar as regiões (cabeçalho, navegação, coluna de
 * identidade, conteúdo, coluna de contexto) e posicionar sobreposições.
 *
 * Não contém lógica de jogo, regra de idade nem implementação de seção — só
 * layout e ligação entre componentes de domínio.
 */
export const GameShell: React.FC<GameShellProps> = ({
  personagem,
  educacao,
  carreira,
  economia,
  familia,
  personalidade,
  situacao,
  variacaoAtributos,
  abas,
  abaAtiva,
  onSelecionarAba,
  somLigado,
  onToggleSom,
  onGoHome,
  onOpenStats,
  feedback,
  children,
  overlays
}) => {
  const podeVerRelacionamentos = abas.includes('familia');
  const podeVerFinancas = abas.includes('financas');

  return (
    <div className="game-shell">
      {feedback && (
        <div
          className={`feedback-toast feedback-toast--${feedback.tipo}`}
          role="status"
          aria-live="polite"
        >
          <span className="feedback-toast__icon">
            {ICONES_FEEDBACK[feedback.tipo]}
          </span>
          <span>{feedback.texto}</span>
        </div>
      )}

      <GameHeader
        personagem={personagem}
        somLigado={somLigado}
        onToggleSom={onToggleSom}
        onGoHome={onGoHome}
        onOpenStats={onOpenStats}
      >
        <PrimaryNavigation
          abas={abas}
          abaAtiva={abaAtiva}
          onSelecionar={onSelecionarAba}
        />
      </GameHeader>

      <div className="shell-body">
        <CharacterRail
          personagem={personagem}
          educacao={educacao}
          carreira={carreira}
          familia={familia}
          economia={economia}
          situacao={situacao}
        />

        <main className="shell-main">{children}</main>

        <ContextAside
          personagem={personagem}
          familia={familia}
          economia={economia}
          personalidade={personalidade}
          variacaoAtributos={variacaoAtributos}
          onVerRelacionamentos={
            podeVerRelacionamentos ? () => onSelecionarAba('familia') : undefined
          }
          onVerFinancas={
            podeVerFinancas ? () => onSelecionarAba('financas') : undefined
          }
        />
      </div>

      {overlays}
    </div>
  );
};
