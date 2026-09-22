/**
 * events/optionRequirements — o requisito de UMA opção (B4-FIX4).
 *
 * Extraído de `eventSystem.ts` pelo mesmo motivo que `eligibility` e
 * `selection` já tinham sido: é uma regra própria, testável isoladamente, e
 * agora precisa ser consultada também por `events/happenings` — que não
 * pode importar `eventSystem` sem criar ciclo.
 *
 * `eventSystem` continua reexportando `avaliarRequisitoOpcao` por
 * compatibilidade: quem já importava de lá não precisa mudar.
 *
 * Puro: sem React, sem dados de evento, sem estado.
 */

import type {
  CondicaoComportamental,
  Character,
  EconomyState,
  EventOption,
  HiddenStats,
  PersonalityState,
  VisibleStats
} from '../../types';
import { formatarDinheiro, getRotuloAtributo } from '../../utils/formatters';
import { atendeCondicaoComportamental, getNomeTraco } from '../personalitySystem';
import { MASTER_EVENTS_LIST } from '../../data/events/allEvents';

/**
 * Índice flag → eventos que podem concedê-la, derivado do catálogo uma vez.
 *
 * Derivado, e não escrito à mão, por uma razão prática: uma lista paralela
 * se desatualiza no primeiro evento novo, e o defeito reapareceria em
 * silêncio. Aqui, adicionar um evento que concede a flag já conta.
 */
let indiceConcessores: Map<string, string[]> | null = null;

function eventosQueConcedem(flag: string): readonly string[] {
  if (!indiceConcessores) {
    indiceConcessores = new Map();
    for (const evento of MASTER_EVENTS_LIST) {
      for (const opcao of evento.opcoes) {
        const concedida = opcao.consequencias.adicionarFlag;
        if (!concedida) continue;
        const atual = indiceConcessores.get(concedida) ?? [];
        if (!atual.includes(evento.id)) atual.push(evento.id);
        indiceConcessores.set(concedida, atual);
      }
    }
  }
  return indiceConcessores.get(flag) ?? [];
}

/** Motivo em pt-BR quando uma exigência comportamental não é cumprida (qualitativo, sem números). */
function motivoCondicaoComportamental(cond: CondicaoComportamental): string {
  if (cond.traco && (cond.intensidadeMinima !== undefined || cond.intensidadeMaxima !== undefined)) {
    return `Você ainda não tem histórico suficiente de ${getNomeTraco(cond.traco)}.`;
  }
  return 'Esta escolha depende de uma vivência que você ainda não teve.';
}

/**
 * Avalia o requisito de uma opção de evento (atributo, dinheiro, flag ou
 * padrão comportamental acumulado). Usado pela interface (mostrar
 * indisponibilidade e motivo), pelo motor (recusar antes de aplicar
 * consequências) e pela resolução automática de acontecimentos (um desfecho
 * cujo requisito não é cumprido simplesmente não pode ser sorteado).
 */
export interface ResultadoRequisito {
  aprovado: boolean;
  motivo?: string;
  /**
   * A recusa é DEFINITIVA para este personagem — nada que ele faça daqui
   * para frente a reverteria.
   *
   * Hoje só acontece quando a idade já passou do limite da opção. A
   * distinção importa para a interface: uma opção bloqueada por dinheiro
   * ou por atributo ensina alguma coisa ao ficar visível ("dá para chegar
   * lá"); uma opção bloqueada porque a pessoa envelheceu é só ruído, e o
   * playtest de navegador mostrou um evento de saúde exibindo duas de
   * quatro opções cinzentas repetindo "não é mais compatível com sua
   * idade". O motor continua recusando as duas de qualquer forma — isto
   * só diz à apresentação o que vale a pena mostrar.
   */
  permanente?: boolean;
  /**
   * F6-FIX §5 — POR QUE esta opção está fechada.
   *
   * O playtest recebeu "Você não cumpre os requisitos para esta escolha."
   * numa opção que dizia "o colega que você defendeu na infância se oferece
   * pra estudar com você" — sem nunca ter recebido a chance de defender
   * colega nenhum. Medido nas 105 vidas: 39 opções bloqueadas por flag, e
   * em 39 delas o evento antecedente JAMAIS foi apresentado.
   *
   * - 'trajetoria': o jogo ofereceu a oportunidade e a vida seguiu outro
   *   caminho. É consequência, e é desejável que doa.
   * - 'nunca_oferecido': o antecedente nunca apareceu. Não é escolha do
   *   jogador; apresentar como se fosse é mentira sobre a própria história.
   * - 'estado': depende de algo do presente (dinheiro, idade, atributo) e
   *   não conta história nenhuma sobre o passado.
   */
  origemDoBloqueio?: 'trajetoria' | 'nunca_oferecido' | 'estado';
}

/**
 * F6-FIX — a recusa por flag, classificada.
 *
 * A pergunta é: o jogo chegou a OFERECER a cena que concede esta flag?
 * `eventosQueConcedem` é derivado do próprio catálogo (nenhuma lista
 * paralela para manter à mão, nenhum `if (eventId === ...)`), e o histórico
 * de eventos disparados já existe no save.
 */
function recusaPorFlag(
  flag: string,
  historicoEventos?: readonly string[]
): ResultadoRequisito {
  if (!historicoEventos) {
    return {
      aprovado: false,
      motivo: 'Você não cumpre os requisitos para esta escolha.',
      origemDoBloqueio: 'trajetoria'
    };
  }

  const fontes = eventosQueConcedem(flag);
  const teveOportunidade = fontes.some(id => historicoEventos.includes(id));

  if (teveOportunidade) {
    // O jogador esteve nessa cena e decidiu outra coisa. Isso é história.
    return {
      aprovado: false,
      motivo: 'Sua história seguiu por outro caminho.',
      origemDoBloqueio: 'trajetoria'
    };
  }

  // Nunca apareceu. A opção não deve ser exibida como se fosse culpa de
  // alguma escolha — quem decide o que fazer com isso é a apresentação.
  return {
    aprovado: false,
    motivo: 'Isso dependia de algo que não aconteceu na sua vida.',
    origemDoBloqueio: 'nunca_oferecido'
  };
}

export function avaliarRequisitoOpcao(
  opcao: EventOption,
  personagem: Character,
  economia: EconomyState,
  personalidade?: PersonalityState,
  /**
   * F6-FIX — ids de tudo que o jogo já apresentou a esta pessoa
   * (`historicoEventosDisparados`, que já existe no save desde sempre).
   * Sem isto não dá para saber se um requisito não cumprido é trajetória ou
   * azar. Opcional: quem não passa continua recebendo a avaliação antiga.
   */
  historicoEventos?: readonly string[]
): ResultadoRequisito {
  const requisito = opcao.requisito;
  if (!requisito) return { aprovado: true };

  // B4-FIX3 item 7 — o evento pode ser elegível numa idade (janela ampla,
  // ex.: 8-90 para um problema de saúde), mas uma opção específica dentro
  // dele pode continuar incompatível (ex.: "tentar trabalhar mesmo doente"
  // não faz sentido para uma criança de 8 anos). O motor recusa aqui —
  // nunca confia que a UI já filtrou a opção antes de chamar.
  if (requisito.idadeMinima !== undefined && personagem.idade < requisito.idadeMinima) {
    return { aprovado: false, motivo: 'Você ainda não tem idade para essa escolha.' };
  }
  if (requisito.idadeMaxima !== undefined && personagem.idade > requisito.idadeMaxima) {
    return {
      aprovado: false,
      motivo: 'Essa escolha não é mais compatível com sua idade.',
      permanente: true
    };
  }

  if (requisito.dinheiroMinimo !== undefined && economia.dinheiro < requisito.dinheiroMinimo) {
    return { aprovado: false, motivo: `Você precisa de ${formatarDinheiro(requisito.dinheiroMinimo)} disponíveis.` };
  }

  if (requisito.atributo && requisito.valorMinimo !== undefined) {
    const valorAtual =
      (personagem.stats as unknown as Record<string, number | undefined>)[requisito.atributo] ??
      (personagem.hiddenStats as unknown as Record<string, number | undefined>)[requisito.atributo];
    if (valorAtual === undefined || valorAtual < requisito.valorMinimo) {
      return {
        aprovado: false,
        motivo: `Você precisa de ${getRotuloAtributo(
          requisito.atributo as keyof VisibleStats | keyof HiddenStats
        )} ${requisito.valorMinimo} ou mais.`
      };
    }
  }

  if (requisito.flagNecessaria && !personagem.flags[requisito.flagNecessaria]) {
    return recusaPorFlag(requisito.flagNecessaria, historicoEventos);
  }

  // B2 — padrão de comportamento acumulado (recusa segura sem estado de personalidade)
  if (requisito.condicaoComportamental) {
    if (!atendeCondicaoComportamental(personalidade, requisito.condicaoComportamental)) {
      return { aprovado: false, motivo: motivoCondicaoComportamental(requisito.condicaoComportamental) };
    }
  }

  return { aprovado: true };
}
