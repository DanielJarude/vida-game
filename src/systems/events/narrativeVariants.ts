/**
 * events/consequences (variação narrativa) — B4-FIX2 item 6.
 *
 * O playtest apontou que "Você dedicou o ano aos estudos: suas notas
 * subiram e a disciplina ficou mais firme." repetia com a MESMA frase em
 * anos próximos — um comportamento recorrente legítimo (o jogador estuda
 * todo ano), mas a repetição textual idêntica parecia bug.
 *
 * Este módulo dá variação de texto a acontecimentos que o motor já sabe
 * que são recorrentes (postura escolar), sem inventar variação artificial
 * em eventos que já são resolvidos como sorteio único (esses usam
 * `repetitionPolicy`, não isto). Puro: sem React, sem estado.
 */

import { randomChoice } from '../../utils/random';
import type { PosturaEscolar } from '../../types';

const TEXTOS_ESTUDAR = [
  'Você dedicou o ano aos estudos: suas notas subiram e a disciplina ficou mais firme.',
  'Este ano você levou os estudos a sério — as notas melhoraram e a rotina ficou mais disciplinada.',
  'Você manteve o foco nos livros o ano inteiro: o boletim agradeceu e você criou mais disciplina.',
  'Entre provas e trabalhos, você não afrouxou — o esforço nos estudos se refletiu nas notas.'
];

const TEXTOS_MATAR_AULA = [
  'Você matou aula com frequência este ano. Foi divertido, mas as notas caíram.',
  'Este ano teve mais aula matada do que deveria — divertido na hora, mas o boletim sentiu.',
  'Você preferiu pular aula sempre que dava — a diversão valeu, só que as notas pagaram o preço.',
  'Entre faltas e desculpas, você matou bastante aula neste ano; a disciplina relaxou de vez.'
];

const TEXTOS_SOCIALIZAR = [
  'Você aproveitou o ano para fortalecer as amizades da escola.',
  'Este ano foi de amizades: você investiu tempo nos colegas e a turma ficou mais próxima.',
  'Você priorizou a convivência com os amigos da escola ao longo do ano.',
  'Entre conversas e encontros, você fortaleceu os laços com a turma neste ano.'
];

const TABELA: Record<PosturaEscolar, string[]> = {
  estudar: TEXTOS_ESTUDAR,
  matar_aula: TEXTOS_MATAR_AULA,
  socializar: TEXTOS_SOCIALIZAR
};

/** Sorteia uma variação de texto para a postura escolar resolvida no ano. */
export function narrarPosturaEscolar(postura: PosturaEscolar): string {
  return randomChoice(TABELA[postura]);
}
