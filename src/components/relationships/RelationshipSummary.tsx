import React from 'react';
import type { FamilyMember } from '../../types';
import { selecionarRelacionamentosDestaque } from '../../presentation/relationshipPresentation';
import { PersonAvatar } from '../character/PersonAvatar';

interface RelationshipSummaryProps {
  familia: FamilyMember[];
  limite?: number;
}

/**
 * Relacionamentos como PESSOAS, não registros de banco.
 *
 * Nome em destaque, parentesco como metadado e proximidade em PALAVRAS.
 * O motor guarda 0–100 internamente; a interface não é obrigada a exibir
 * isso e aqui não exibe — sem barra percentual dominante.
 */
export const RelationshipSummary: React.FC<RelationshipSummaryProps> = ({
  familia,
  limite = 4
}) => {
  const pessoas = selecionarRelacionamentosDestaque(familia, limite);

  if (pessoas.length === 0) {
    return <p className="empty-state">Ninguém por perto neste momento.</p>;
  }

  return (
    <ul className="relationships">
      {pessoas.map(pessoa => {
        const modificador =
          pessoa.proximidade === 'muito_proxima' || pessoa.proximidade === 'proxima'
            ? ' relationship__closeness--proxima'
            : pessoa.proximidade === 'conflituosa'
            ? ' relationship__closeness--dificil'
            : '';

        return (
          <li key={pessoa.membro.id} className="relationship">
            <span className="relationship__avatar">
              <PersonAvatar
                nome={pessoa.nome}
                idade={pessoa.membro.idade}
                tipo={pessoa.membro.tipo}
                tamanho={34}
              />
            </span>

            <span className="relationship__identity">
              <span className="relationship__name">{pessoa.nome}</span>
              <span className="relationship__relation">{pessoa.relacao}</span>
            </span>

            {/* Proximidade é texto: legível por leitor de tela e sem cor obrigatória. */}
            <span className={`relationship__closeness${modificador}`}>
              {pessoa.rotuloProximidade}
            </span>
          </li>
        );
      })}
    </ul>
  );
};
