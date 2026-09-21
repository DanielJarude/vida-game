/**
 * events/nature — acontecimento ou decisão? (B4-FIX4)
 *
 * Um resolvedor minúsculo, isolado de propósito: a pergunta "este evento é
 * uma encruzilhada ou é a vida acontecendo?" é consultada pelo sorteio
 * (`eventSystem`), pela passagem de ano (`agingSystem`) e pela auditoria
 * permanente do catálogo. Ter um lugar só evita que cada um resolva o
 * `?? 'decisao'` à sua maneira.
 */

import type { GameEvent, NaturezaEvento } from '../../types';

/**
 * Idade até a qual não existe decisão consciente.
 *
 * Não é opinião de design solta: é a regra de autonomia por idade do VIDA.
 * Um bebê de 0-2 anos não delibera — ele reage. Qualquer evento cuja janela
 * inteira caia aqui precisa ser acontecimento, e a auditoria do catálogo
 * (`data/events/__tests__/coerenciaCatalogo`) quebra se não for.
 *
 * O motor não depende só disso para se proteger: a camada de ritmo dá
 * autonomia 0 e teto de decisões 0 à faixa `bebe`, de modo que nenhum ano
 * de 0 a 2 pode produzir pulso de decisão nem por sorte.
 */
export const IDADE_SEM_DECISAO_CONSCIENTE = 2;

/** Natureza declarada pelo catálogo. Ausente = decisão (comportamento pré-B4-FIX4). */
export function naturezaDoEvento(evento: GameEvent): NaturezaEvento {
  return evento.natureza ?? 'decisao';
}

/** Este evento é obrigado a ser acontecimento pela regra de autonomia por idade? */
export function exigeAcontecimentoPorIdade(evento: GameEvent): boolean {
  return evento.idadeMaxima <= IDADE_SEM_DECISAO_CONSCIENTE;
}
