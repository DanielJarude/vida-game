/**
 * Apresentação das interações familiares.
 *
 * A mesma intenção tem palavras diferentes conforme a fase da vida.
 * "Conversar / Bater um papo sobre o dia" descreve um adulto; para uma
 * criança de 3 anos a mesma intenção é "Falar do seu jeito / Contar o que
 * aconteceu hoje, do jeito que dá".
 *
 * Isto é texto, não regra: o que é permitido continua sendo decidido por
 * `interactionCapabilitySystem`. Aqui só escolhemos como chamar a coisa.
 */

import { FamilyInteractionType } from '../types';
import {
  FaseInteracao,
  obterFaseInteracao,
  SOCIAL_INTERACOES
} from '../systems/interactionCapabilitySystem';

export interface RotuloInteracao {
  titulo: string;
  descricao: string;
}

type TabelaPorFase = Partial<Record<FaseInteracao, RotuloInteracao>>;

/**
 * Tabela declarativa. `autonomo` é o padrão; as fases anteriores só
 * declaram o que precisa soar diferente.
 */
const ROTULOS: Record<FamilyInteractionType, TabelaPorFase & { autonomo: RotuloInteracao }> = {
  conversar: {
    // Bloqueada nesta fase, mas o rótulo descreve a comunicação que existe
    // de verdade — não uma conversa de adulto riscada.
    recem_nascido: {
      titulo: 'Tentar se comunicar',
      descricao: 'Chorar, balbuciar, procurar o olhar de quem cuida'
    },
    primeiros_passos: {
      titulo: 'Tentar se comunicar',
      descricao: 'Apontar, resmungar e esperar ser entendido'
    },
    primeiras_palavras: {
      titulo: 'Falar do seu jeito',
      descricao: 'Juntar as primeiras palavras para dizer alguma coisa'
    },
    infancia: {
      titulo: 'Contar uma novidade',
      descricao: 'Falar sem parar sobre o que aconteceu hoje'
    },
    escolar: {
      titulo: 'Conversar',
      descricao: 'Contar como foi o dia na escola'
    },
    autonomo: {
      titulo: 'Conversar',
      descricao: 'Bater um papo sobre o dia'
    }
  },

  passar_tempo: {
    recem_nascido: {
      titulo: 'Ficar no colo',
      descricao: 'Buscar o cheiro e o calor de quem cuida de você'
    },
    primeiros_passos: {
      titulo: 'Brincar junto',
      descricao: 'Engatinhar atrás, empilhar coisas, derrubar tudo de novo'
    },
    primeiras_palavras: {
      titulo: 'Brincar junto',
      descricao: 'Repetir a mesma brincadeira até cansar — menos você'
    },
    infancia: {
      titulo: 'Brincar junto',
      descricao: 'Inventar uma história e arrastar alguém para dentro dela'
    },
    escolar: {
      titulo: 'Passar tempo junto',
      descricao: 'Fazer alguma coisa lado a lado, sem pressa'
    },
    autonomo: {
      titulo: 'Passar tempo junto',
      descricao: 'Um passeio ou uma refeição sem pressa'
    }
  },

  discutir: {
    // Antes dos 3 anos a ação aparece bloqueada; ainda assim ela precisa de
    // um rótulo coerente com a fase, não "Discutir" de adulto.
    recem_nascido: {
      titulo: 'Se irritar',
      descricao: 'Chorar quando alguma coisa incomoda'
    },
    primeiros_passos: {
      titulo: 'Se irritar',
      descricao: 'Reclamar do único jeito que você conhece'
    },
    primeiras_palavras: {
      titulo: 'Se irritar',
      descricao: 'Dizer "não" para tudo, com muita convicção'
    },
    infancia: {
      titulo: 'Fazer birra',
      descricao: 'Bater o pé por algo que parece muito importante agora'
    },
    escolar: {
      titulo: 'Bater de frente',
      descricao: 'Reclamar de uma regra que você acha injusta'
    },
    autonomo: {
      titulo: 'Discutir',
      descricao: 'Levantar a voz sobre algo mal resolvido'
    }
  },

  dar_presente: {
    autonomo: {
      titulo: 'Dar um presente',
      descricao: 'Escolher uma lembrança'
    }
  },

  pedir_dinheiro: {
    escolar: {
      titulo: 'Pedir um dinheiro',
      descricao: 'Uma ajuda para alguma coisa que você quer muito'
    },
    autonomo: {
      titulo: 'Pedir dinheiro',
      descricao: 'Uma ajuda para suas despesas'
    }
  },

  pedir_conselho: {
    escolar: {
      titulo: 'Pedir ajuda',
      descricao: 'Perguntar o que fazer sobre algo que te incomoda'
    },
    autonomo: {
      titulo: 'Pedir um conselho',
      descricao: 'Ouvir a experiência de quem já passou por isso'
    }
  },

  // Exclusivas de pet (B4-FIX1): não mudam por fase do jogador, porque o
  // gesto com o animal é sempre o mesmo tipo de cena física e simples.
  fazer_carinho: {
    autonomo: {
      titulo: 'Fazer carinho',
      descricao: 'Um cafuné tranquilo, só para os dois'
    }
  },

  alimentar: {
    autonomo: {
      titulo: 'Alimentar',
      descricao: 'Encher o potinho de comida ou água'
    }
  },

  passear: {
    autonomo: {
      titulo: 'Passear',
      descricao: 'Dar uma volta juntos pela vizinhança'
    }
  }
};

/** Rótulo apropriado para a idade. */
export function rotularInteracao(
  interacao: FamilyInteractionType,
  idade: number
): RotuloInteracao {
  const fase = obterFaseInteracao(idade);
  const tabela = ROTULOS[interacao];
  return tabela[fase] ?? tabela.autonomo;
}

/**
 * Rótulo de uma interação com um PET (B4-FIX1).
 *
 * Diferente da versão humana, não varia pela fase do jogador: mesmo um
 * bebê de colo já "passa tempo" com o animal do mesmo jeito simples —
 * não faz sentido herdar o rótulo "Ficar no colo" (pensado para um adulto
 * segurando o bebê) para essa relação.
 */
export function rotularInteracaoPet(
  interacao: FamilyInteractionType
): RotuloInteracao {
  if (interacao === 'passar_tempo') {
    return {
      titulo: 'Passar tempo',
      descricao: 'Ficar perto, observar e fazer companhia'
    };
  }
  return ROTULOS[interacao].autonomo;
}

/**
 * Ordem em que as interações aparecem para a fase.
 *
 * Na primeira infância o afeto vem primeiro, porque é o que de fato
 * existe. Mais tarde a conversa assume a frente.
 */
export function ordenarInteracoesPorFase(
  idade: number
): FamilyInteractionType[] {
  if (idade < 3) {
    return ['passar_tempo', 'conversar', 'discutir'];
  }
  if (idade < 6) {
    return ['passar_tempo', 'conversar', 'discutir'];
  }
  return [
    'conversar',
    'passar_tempo',
    'dar_presente',
    'pedir_dinheiro',
    'pedir_conselho',
    'discutir'
  ];
}

/**
 * Ordem das interações com um PET (B4-FIX1).
 *
 * Não varia pela idade do jogador: as quatro ações fazem sentido desde
 * cedo (`passar_tempo`) e vão se somando à lista conforme a capacidade
 * permite — a ordem em si é fixa, quem decide o que aparece é
 * `deveOferecerInteracao`/`avaliarCapacidadeInteracao`.
 */
/**
 * F6-FIX — a ordem das ações com um vínculo social não familiar.
 *
 * Deriva de `SOCIAL_INTERACOES` (a regra mora no domínio); aqui só se decide
 * a ORDEM de apresentação, que é assunto de interface.
 */
export function ordenarInteracoesSociais(
  idade: number
): FamilyInteractionType[] {
  const base: FamilyInteractionType[] =
    idade <= 11
      ? ['passar_tempo', 'conversar', 'dar_presente']
      : ['conversar', 'passar_tempo', 'dar_presente'];
  return base.filter(i => SOCIAL_INTERACOES.includes(i));
}

export function ordenarInteracoesComPet(): FamilyInteractionType[] {
  return ['passar_tempo', 'fazer_carinho', 'alimentar', 'passear'];
}
