import React from 'react';
import type {
  CareerState,
  Character,
  EconomyState,
  EducationState,
  FamilyMember
} from '../../types';
import { CharacterIdentity } from '../character/CharacterIdentity';

interface CharacterRailProps {
  personagem: Character;
  educacao: EducationState;
  carreira: CareerState;
  familia: FamilyMember[];
  economia: EconomyState;
  situacao: string;
}

/**
 * Coluna de identidade e contexto pessoal.
 *
 * Existe para responder imediatamente "quem sou eu e em que ponto da vida
 * estou". Não acumula indicadores: atributos e demais informações
 * secundárias vivem na coluna oposta.
 */
export const CharacterRail: React.FC<CharacterRailProps> = ({
  personagem,
  educacao,
  carreira,
  familia,
  economia,
  situacao
}) => {
  return (
    <div className="shell-rail">
      <CharacterIdentity
        personagem={personagem}
        educacao={educacao}
        carreira={carreira}
        familia={familia}
        economia={economia}
        situacao={situacao}
      />
    </div>
  );
};
