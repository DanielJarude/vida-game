import React from 'react';
import { BookOpen, Users, GraduationCap, Wallet, Activity } from 'lucide-react';
import type { TabId } from '../../systems/availabilitySystem';

interface PrimaryNavigationProps {
  /**
   * Abas visíveis. Vem sempre de `getAbasDisponiveis(ctx)`: a navegação é
   * derivada da política central de idade, nunca de uma lista paralela.
   */
  abas: TabId[];
  abaAtiva: TabId;
  onSelecionar: (aba: TabId) => void;
}

const ROTULOS: Record<TabId, { titulo: string; icone: React.ReactNode }> = {
  timeline: { titulo: 'Linha da Vida', icone: <BookOpen size={15} /> },
  familia: { titulo: 'Relacionamentos', icone: <Users size={15} /> },
  carreira: { titulo: 'Estudos & Carreira', icone: <GraduationCap size={15} /> },
  financas: { titulo: 'Finanças', icone: <Wallet size={15} /> },
  atividades: { titulo: 'Atividades', icone: <Activity size={15} /> }
};

/**
 * Navegação principal como guias sublinhadas.
 *
 * Não há permissão hardcoded aqui: o componente apenas renderiza o que a
 * política de disponibilidade autorizou. Uma criança simplesmente não recebe
 * as abas adultas na prop `abas`.
 */
export const PrimaryNavigation: React.FC<PrimaryNavigationProps> = ({
  abas,
  abaAtiva,
  onSelecionar
}) => {
  return (
    <nav className="primary-nav" aria-label="Seções do jogo">
      {abas.map(aba => {
        const ativo = aba === abaAtiva;
        return (
          <button
            key={aba}
            className="primary-nav__item"
            aria-current={ativo ? 'page' : undefined}
            onClick={() => onSelecionar(aba)}
          >
            <span aria-hidden="true">{ROTULOS[aba].icone}</span>
            <span className="primary-nav__label">{ROTULOS[aba].titulo}</span>
          </button>
        );
      })}
    </nav>
  );
};
