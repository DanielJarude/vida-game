/**
 * events/happenings — ACONTECIMENTOS: a vida que acontece sozinha (B4-FIX4).
 *
 * Um acontecimento não pergunta nada. O motor escolhe o desfecho, aplica as
 * consequências e narra. O jogador lê a própria vida em vez de responder a
 * um formulário sobre ela.
 *
 * DUAS REGRAS DURAS, e elas são o coração deste módulo:
 *
 * 1. Um acontecimento NUNCA move a personalidade.
 *    `impactosComportamentais` é removido do desfecho antes de qualquer
 *    aplicação. A personalidade do VIDA é emergente a partir de ESCOLHAS —
 *    se o jogo atribuísse "coragem" a quem não escolheu ser corajoso,
 *    o traço deixaria de significar alguma coisa. Um bebê que caiu
 *    aprendendo a andar não ficou mais corajoso: ele caiu.
 *
 * 2. Um acontecimento nunca é uma pergunta disfarçada.
 *    O desfecho é sorteado entre `evento.opcoes` pelo `peso` de cada uma.
 *    As opções deixam de ser botões e passam a ser o leque de desfechos
 *    possíveis daquela situação — o que dá variação real sem exigir
 *    reescrever o catálogo inteiro num formato novo.
 *
 * Puro: sem React, sem estado, sem `eventSystem` (evita ciclo de import).
 */

import type {
  Character,
  EconomyState,
  EventConsequence,
  EventOption,
  GameEvent,
  LifeLogCategory,
  PersonalityState
} from '../../types';
import { valorAleatorio } from '../../utils/random';
import { avaliarRequisitoOpcao } from './optionRequirements';

/** Peso de um desfecho quando a opção não declara nenhum. */
export const PESO_DESFECHO_PADRAO = 1;

/**
 * Sorteia o desfecho de um acontecimento entre as opções cujo requisito o
 * personagem realmente cumpre. Se nenhuma opção for viável, devolve `null`
 * — o motor trata isso como "este acontecimento não se aplica agora" e
 * segue sem narrar nada (nunca aplica um desfecho impossível).
 */
export function sortearDesfecho(
  evento: GameEvent,
  personagem: Character,
  economia: EconomyState,
  personalidade?: PersonalityState,
  aleatorio: () => number = valorAleatorio
): EventOption | null {
  const viaveis = evento.opcoes.filter(
    opcao => avaliarRequisitoOpcao(opcao, personagem, economia, personalidade).aprovado
  );
  if (viaveis.length === 0) return null;

  const pesoTotal = viaveis.reduce((soma, o) => soma + (o.peso ?? PESO_DESFECHO_PADRAO), 0);
  let rolagem = aleatorio() * pesoTotal;

  for (const opcao of viaveis) {
    const peso = opcao.peso ?? PESO_DESFECHO_PADRAO;
    if (rolagem < peso) return opcao;
    rolagem -= peso;
  }

  return viaveis[viaveis.length - 1];
}

/**
 * Remove de um desfecho tudo que só faz sentido quando houve escolha.
 *
 * Hoje isso é exatamente `impactosComportamentais`. A função existe como
 * ponto único e nomeado dessa regra para que ela sobreviva a refatorações:
 * quem adicionar no futuro outro campo "consequência de ter escolhido"
 * tem um lugar óbvio para removê-lo, e o teste que protege a regra tem um
 * alvo estável.
 */
export function desfechoSemMarcaDeEscolha(opcao: EventOption): EventOption {
  const { impactosComportamentais: _ignorado, ...consequencias } = opcao.consequencias;
  return { ...opcao, consequencias: consequencias as EventConsequence };
}

/* ========================================================================== */
/*                     ONDE O ACONTECIMENTO ENTRA NA VIDA                     */
/* ========================================================================== */

/**
 * Traduz a categoria do EVENTO para a categoria da LINHA DA VIDA.
 *
 * Até o B4-FIX3 todo resultado de evento entrava como `categoria: 'evento'`,
 * que a apresentação rotula "Escolha". Para um acontecimento isso é
 * duplamente errado: não foi escolha, e o assunto real (escola, saúde,
 * amizade, dinheiro) ficava escondido atrás de um rótulo genérico.
 *
 * Nenhum acontecimento é mapeado para 'cotidiano': se o motor decidiu que
 * ele merecia acontecer, ele merece aparecer no resumo do ano. 'cotidiano'
 * fica reservado para textura de fundo de verdade.
 */
const CATEGORIA_DO_EVENTO: Record<GameEvent['categoria'], LifeLogCategory> = {
  infancia: 'geral',
  escola: 'escola',
  adolescencia: 'geral',
  familia: 'familia',
  amizade: 'amizade',
  romance: 'amor',
  trabalho: 'carreira',
  dinheiro: 'financas',
  saude: 'saude',
  cotidiano: 'geral',
  hobby: 'lazer',
  esporte: 'lazer',
  comunidade: 'amizade',
  tecnologia: 'lazer'
};

export function categoriaDeLogDoEvento(evento: GameEvent): LifeLogCategory {
  return CATEGORIA_DO_EVENTO[evento.categoria] ?? 'geral';
}

/**
 * Tom da entrada na Linha da Vida, derivado das consequências REAIS.
 *
 * Bug corrigido aqui: `aplicarConsequenciasEscolha` gravava todo resultado
 * de evento como `tipo: 'positivo'`, inclusive um desfecho em que a pessoa
 * se machucou, perdeu dinheiro ou foi demitida — e a Linha da Vida pintava
 * isso com a ênfase de uma boa notícia.
 */
export function tomDoDesfecho(
  consequencias: EventConsequence
): 'positivo' | 'negativo' | 'info' {
  if (consequencias.morte || consequencias.demissao || consequencias.adicionarDoenca) {
    return 'negativo';
  }

  let saldo = 0;
  if (consequencias.stats) {
    for (const valor of Object.values(consequencias.stats)) {
      saldo += valor ?? 0;
    }
  }
  if (typeof consequencias.saudeDelta === 'number') saldo += consequencias.saudeDelta;
  if (typeof consequencias.dinheiro === 'number') {
    saldo += consequencias.dinheiro > 0 ? 3 : consequencias.dinheiro < 0 ? -3 : 0;
  }
  if (consequencias.relacionamentoDelta) {
    saldo += consequencias.relacionamentoDelta.delta > 0 ? 2 : -2;
  }
  if (consequencias.curarDoenca || consequencias.adicionarFamiliar) saldo += 3;

  if (saldo > 1) return 'positivo';
  if (saldo < -1) return 'negativo';
  return 'info';
}
