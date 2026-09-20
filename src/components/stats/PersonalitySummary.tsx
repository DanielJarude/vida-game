import React from 'react';
import type { Gender, PersonalityState } from '../../types';
import { obterTracosPercebidos } from '../../systems/personalitySystem';

interface PersonalitySummaryProps {
  personalidade: PersonalityState;
  genero: Gender;
}

/**
 * Traços Percebidos — filosofia B2 preservada integralmente.
 *
 * Interpretação da pessoa, não estatística:
 *   - nenhum número;
 *   - nenhuma barra;
 *   - nenhum progresso para "desbloquear" traço;
 *   - "Personalidade ainda em formação" enquanto não houver evidência.
 */
export const PersonalitySummary: React.FC<PersonalitySummaryProps> = ({
  personalidade,
  genero
}) => {
  const tracos = obterTracosPercebidos(personalidade, genero);

  if (tracos.length === 0) {
    return (
      <p className="personality__forming">
        Personalidade ainda em formação.
        <span className="personality__forming-hint">
          Suas escolhas ao longo do tempo vão revelar quem você se torna.
        </span>
      </p>
    );
  }

  return (
    <ul className="personality__traits">
      {tracos.map(traco => (
        <li key={traco.traco} className="personality__trait">
          {traco.rotulo}
        </li>
      ))}
    </ul>
  );
};
