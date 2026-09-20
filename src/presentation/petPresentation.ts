/**
 * Apresentação das interações com pets.
 *
 * Mesma ideia de `interactionPresentation`: a intenção é a mesma, as
 * palavras mudam conforme a fase de quem age. Um bebê não "leva para
 * passear"; ele encosta. Aqui só há texto — permissão é decidida em
 * `petInteractionSystem`.
 */

import { PetInteractionType } from '../types';
import {
  FaseInteracao,
  obterFaseInteracao
} from '../systems/interactionCapabilitySystem';

export interface RotuloInteracaoPet {
  titulo: string;
  descricao: string;
}

type TabelaPorFase = Partial<Record<FaseInteracao, RotuloInteracaoPet>>;

const ROTULOS: Record<
  PetInteractionType,
  TabelaPorFase & { autonomo: RotuloInteracaoPet }
> = {
  fazer_carinho: {
    recem_nascido: {
      titulo: 'Encostar',
      descricao: 'Esticar a mão e descobrir que ele(a) é quente e se mexe'
    },
    primeiros_passos: {
      titulo: 'Encostar',
      descricao: 'Agarrar o pelo com a mão inteira, ainda sem medir a força'
    },
    primeiras_palavras: {
      titulo: 'Fazer carinho',
      descricao: 'Passar a mão devagar, do jeito que ensinaram'
    },
    autonomo: {
      titulo: 'Fazer carinho',
      descricao: 'Ficar um tempo ali, sem pressa'
    }
  },

  brincar: {
    primeiras_palavras: {
      titulo: 'Brincar',
      descricao: 'Correr atrás e ser corrido de volta'
    },
    infancia: {
      titulo: 'Brincar',
      descricao: 'Inventar uma brincadeira que só vocês dois entendem'
    },
    autonomo: {
      titulo: 'Brincar',
      descricao: 'Jogar a bolinha até um dos dois desistir'
    }
  },

  dar_comida: {
    infancia: {
      titulo: 'Encher o pote',
      descricao: 'Levar a ração até o pote sem derramar (quase)'
    },
    autonomo: {
      titulo: 'Dar comida',
      descricao: 'Servir a refeição e conferir a água'
    }
  },

  ensinar_truque: {
    escolar: {
      titulo: 'Ensinar um truque',
      descricao: 'Repetir o mesmo comando até ele(a) entender'
    },
    autonomo: {
      titulo: 'Ensinar um truque',
      descricao: 'Treinar sentar, dar a pata, esperar'
    }
  },

  passear: {
    escolar: {
      titulo: 'Levar para passear',
      descricao: 'Dar uma volta no quarteirão com a coleira'
    },
    autonomo: {
      titulo: 'Levar para passear',
      descricao: 'Uma volta longa, no ritmo dele(a)'
    }
  },

  cuidar: {
    autonomo: {
      titulo: 'Cuidar',
      descricao: 'Banho, escovação, água limpa — a rotina inteira'
    }
  }
};

/**
 * Escolhe o rótulo mais específico disponível para a fase, caindo para as
 * fases seguintes até chegar em `autonomo`.
 */
export function rotularInteracaoPet(
  interacao: PetInteractionType,
  idade: number
): RotuloInteracaoPet {
  const tabela = ROTULOS[interacao];
  const fase = obterFaseInteracao(idade);

  const ordem: FaseInteracao[] = [
    'recem_nascido',
    'primeiros_passos',
    'primeiras_palavras',
    'infancia',
    'escolar',
    'autonomo'
  ];

  const inicio = ordem.indexOf(fase);
  for (let i = inicio; i < ordem.length; i++) {
    const rotulo = tabela[ordem[i]];
    if (rotulo) return rotulo;
  }

  return tabela.autonomo;
}
