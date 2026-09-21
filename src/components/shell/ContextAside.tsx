import React from 'react';
import type {
  Character,
  EconomyState,
  FamilyMember,
  PersonalityState,
  VisibleStats
} from '../../types';
import { AttributeSummary } from '../stats/AttributeSummary';
import { PersonalitySummary } from '../stats/PersonalitySummary';
import { RelationshipSummary } from '../relationships/RelationshipSummary';
import { FinanceSummary } from '../finance/FinanceSummary';
import {
  deveMostrarFinancasNaVisaoGeral,
  obterPerfilDeFase
} from '../../presentation/lifeStagePresentation';

interface ContextAsideProps {
  personagem: Character;
  familia: FamilyMember[];
  economia: EconomyState;
  personalidade: PersonalityState;
  variacaoAtributos?: Partial<VisibleStats>;
  /** Abre a seção correspondente quando o jogador quer o detalhe. */
  onVerRelacionamentos?: () => void;
  onVerFinancas?: () => void;
}

/**
 * Informação secundária — acompanha a vida, não domina a tela.
 *
 * Quais blocos aparecem depende da fase: um bebê não recebe um painel
 * financeiro. A regra de apresentação vive em `lifeStagePresentation`; a
 * elegibilidade de AÇÕES continua na política central de disponibilidade.
 */
export const ContextAside: React.FC<ContextAsideProps> = ({
  personagem,
  familia,
  economia,
  personalidade,
  variacaoAtributos,
  onVerRelacionamentos,
  onVerFinancas
}) => {
  const perfil = obterPerfilDeFase(personagem.idade);

  const temPatrimonio =
    economia.propriedades.length > 0 || economia.investimentos.length > 0;
  const mostrarFinancas = deveMostrarFinancasNaVisaoGeral(
    personagem.idade,
    temPatrimonio
  );

  return (
    <aside className="shell-aside" aria-label="Informações secundárias">
      {perfil.mostrarAtributos && (
        <section className="aside-block">
          <header className="aside-block__header">
            <h2 className="t-meta">Atributos</h2>
          </header>
          <AttributeSummary
            stats={personagem.stats}
            variacao={variacaoAtributos}
          />
        </section>
      )}

      {perfil.mostrarPersonalidade && (
        <section className="aside-block">
          <header className="aside-block__header">
            <h2 className="t-meta">Traços percebidos</h2>
          </header>
          <PersonalitySummary
            personalidade={personalidade}
            genero={personagem.genero}
          />
        </section>
      )}

      {perfil.mostrarRelacionamentos && (
        <section className="aside-block">
          <header className="aside-block__header">
            <h2 className="t-meta">Pessoas</h2>
            {onVerRelacionamentos && (
              <button className="btn btn--ghost" onClick={onVerRelacionamentos}>
                Ver todas
              </button>
            )}
          </header>
          <RelationshipSummary familia={familia} />
        </section>
      )}

      {mostrarFinancas && (
        <section className="aside-block">
          <header className="aside-block__header">
            <h2 className="t-meta">Finanças</h2>
            {onVerFinancas && (
              <button className="btn btn--ghost" onClick={onVerFinancas}>
                Detalhes
              </button>
            )}
          </header>
          <FinanceSummary economia={economia} />
        </section>
      )}
    </aside>
  );
};
