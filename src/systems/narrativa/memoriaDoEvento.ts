/**
 * narrativa/memoriaDoEvento — a FONTE ÚNICA do texto que um evento deixa na
 * Linha da Vida (F5).
 *
 * O PROBLEMA MEDIDO no playtest: a Linha da Vida registrava apenas
 * `opcao.descricaoResultado`. Para um acontecimento automático, isso entrega
 * o DESFECHO sem a SITUAÇÃO, e o jogador lê uma frase que começa no meio:
 *
 *   "Você encarou o 'monstro' e descobriu que era só um casaco pendurado.
 *    Ficou orgulhoso de si mesmo."
 *
 * Que monstro? A informação existia — estava em `evento.descricao` — e era
 * descartada.
 *
 * A CORREÇÃO ERRADA, recusada explicitamente aqui: `descricao + ' ' +
 * descricaoResultado` aplicado aos 72 acontecimentos. A auditoria da F5 leu
 * os 72 e mostrou por que isso quebra:
 *
 *   1. TEMPO VERBAL. As situações são escritas no PRESENTE, porque são
 *      exibidas enquanto acontecem ("o quarto fica escuro demais"). Os
 *      resultados são PASSADO ("você encarou"). Concatenar produz "o quarto
 *      fica escuro demais e você tem certeza de que tem algo se mexendo no
 *      armário. Você encarou o monstro" — remendo visível.
 *
 *   2. TAMANHO. Várias situações têm duas ou três frases. A Linha da Vida é
 *      uma lista que se escaneia; parágrafos de quatro linhas por ano a
 *      transformam em relatório, exatamente o que o projeto recusa.
 *
 *   3. REDUNDÂNCIA. Em boa parte dos casos o resultado já reafirma a
 *      situação, e colar os dois gera repetição ("um temporal cai alagando
 *      avenidas. Você chegou encharcado").
 *
 * A REGRA QUE ESTE MÓDULO IMPLEMENTA, então, é de seleção e não de colagem:
 *
 *   descricaoMemoria  (se o conteúdo declarou uma)  →  usa
 *   senão                                           →  usa descricaoResultado
 *
 * A memória é AUTORADA, não derivada, porque "como isso fica na biografia" é
 * uma decisão de escrita — só quem escreveu a cena sabe o que dela merece
 * sobreviver. O motor não inventa texto; ele escolhe entre textos que já
 * existem. É por isso que este arquivo não tem nenhuma regra de string:
 * nenhum `replace`, nenhuma capitalização, nenhuma juntada.
 *
 * E é por isso que ele existe como módulo em vez de um `??` dentro do
 * `eventSystem`: a decisão "qual texto vira biografia" passa a ter UM lugar,
 * testável isoladamente, em vez de virar lógica textual espalhada pelo
 * agingSystem — que é o que a seção 4 do escopo pediu para evitar.
 */

import type { EventOption } from '../../types';

/**
 * O texto que este desfecho deixa na Linha da Vida.
 *
 * Devolve `null` quando não há nada a registrar — um desfecho sem
 * `descricaoResultado` e sem `descricaoMemoria` é silêncio legítimo, e o
 * silêncio continua permitido (seção 8 do escopo).
 */
export function memoriaDoDesfecho(opcao: EventOption): string | null {
  const memoria = opcao.descricaoMemoria?.trim();
  if (memoria) return memoria;

  const resultado = opcao.descricaoResultado?.trim();
  if (resultado) return resultado;

  return null;
}

/**
 * Este desfecho declarou uma memória própria, diferente do que foi exibido?
 *
 * Exposto para a auditoria de catálogo e para os testes: permite contar
 * quantos dos 72 precisaram de texto biográfico dedicado sem reimplementar
 * a regra em outro lugar.
 */
export function temMemoriaDedicada(opcao: EventOption): boolean {
  return Boolean(opcao.descricaoMemoria?.trim());
}
