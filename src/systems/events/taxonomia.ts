/**
 * events/taxonomia — que tipo de conteúdo é este? (F3)
 *
 * Irmão de `events/nature`, e pela mesma razão que ele existe: a pergunta é
 * feita pelo sorteio, pela passagem de ano, pelo calendário e pela auditoria
 * permanente do catálogo. Ter um lugar só impede que cada um resolva o
 * `?? padrão` à sua maneira.
 *
 * A diferença entre os dois módulos é o grão da pergunta:
 *
 *   nature      → o jogador escolhe? (decisao | acontecimento)
 *   taxonomia   → o que essa escolha SIGNIFICA?
 *
 * A segunda pergunta é nova na Fase 3 e existe por causa de uma suposição
 * que teria sido cômoda e é falsa: a de que "houve escolha" implica "isso
 * revela caráter". Escolher que a primeira palavra foi "mamãe" em vez de
 * "bola" é participar da própria biografia — não é demonstrar empatia,
 * coragem nem disciplina. Ver `TaxonomiaConteudo` nos tipos.
 *
 * Módulo PURO: sem estado, sem React, sem import de dados de evento.
 */

import type { GameEvent, TaxonomiaConteudo } from '../../types';
import { naturezaDoEvento } from './nature';

/**
 * Classificação efetiva de um evento.
 *
 * Quando o catálogo não declara `taxonomia`, deriva de `natureza` para o
 * comportamento pré-F3: acontecimento resolve sozinho e não move
 * personalidade; decisão pergunta e move. Nenhum evento muda de sentido por
 * omissão — a mudança só acontece quando alguém o classifica de propósito.
 */
export function classificacaoDoEvento(evento: GameEvent): TaxonomiaConteudo {
  if (evento.taxonomia) return evento.taxonomia;
  return naturezaDoEvento(evento) === 'acontecimento'
    ? 'acontecimento_puro'
    : 'decisao_comportamental';
}

/**
 * Esta classificação é conduzida pelo CALENDÁRIO em vez do sorteio?
 *
 * `natureza` responde a uma pergunta de sorteio: em qual pool este evento
 * entra quando o ritmo decide que o ano terá uma decisão ou um
 * acontecimento. Marcos não entram em pool nenhum — o calendário os dispara
 * por janela e condição, sem passar pelo dado (ver `systems/calendario`).
 *
 * A distinção não é cosmética; ela resolve uma tensão real do modelo.
 * `bb_primeira_palavra` tem janela 1-2 e agora permite escolha. A regra de
 * autonomia por idade do VIDA diz, com razão, que nenhum evento cuja janela
 * inteira caia em 0-2 pode ser uma DECISÃO — um bebê reage, não delibera.
 * As duas coisas convivem porque quem escolhe a primeira palavra não é o
 * bebê: é o jogador, participando da biografia de um marco que vai acontecer
 * de qualquer jeito. O bebê continua sem deliberar nada.
 *
 * Por isso a `natureza` declarada num conteúdo de calendário descreve o pool
 * de fallback, não a forma de apresentação — e não é contradição.
 */
export function ehConduzidoPeloCalendario(taxonomia: TaxonomiaConteudo): boolean {
  return taxonomia === 'escolha_biografica' || taxonomia === 'marco_testemunhado';
}

/**
 * A natureza que esta classificação implica, para os conteúdos que passam
 * pelo sorteio.
 *
 * Mantém os dois campos coerentes sem exigir que o catálogo repita a mesma
 * informação, e permite à auditoria detectar contradição real. Devolve
 * `undefined` para as classificações conduzidas pelo calendário, onde
 * `natureza` não governa a apresentação.
 */
export function naturezaImplicada(
  taxonomia: TaxonomiaConteudo
): GameEvent['natureza'] | undefined {
  switch (taxonomia) {
    case 'decisao_comportamental':
      return 'decisao';
    case 'acontecimento_puro':
      return 'acontecimento';
    case 'escolha_biografica':
    case 'marco_testemunhado':
      return undefined;
  }
}
