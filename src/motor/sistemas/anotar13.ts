/**
 * VIDA 13 · Ações — o que um sistema quer acrescentar ao RESULTADO IMEDIATO da ação que está sendo executada (a folha
 * que aparece logo depois da escolha): o que esperar dela e o que mudou de concreto. Sem imports (mora na base: qualquer
 * sistema chama, sem ciclo entre pacotes). Quem executa a ação (`acoes.executar`) abre e fecha a anotação; fora de uma
 * ação, anotar não faz nada.
 *
 *   anotarDesfecho13({ esperado: 'O efeito aparece no fechamento do ano.' })
 *   anotarDesfecho13({ mudou: 'Fábrica: +1 linha de produção (pronta em 18 meses).' })
 */

interface Anotacao { esperado: string[]; mudou: string[] }
let aberta: Anotacao | null = null;

/** Acrescenta ao resultado da ação em curso (frases curtas; repetidas são ignoradas). */
export function anotarDesfecho13(x: { esperado?: string; mudou?: string }): void {
  if (!aberta) return;
  if (x.esperado && !aberta.esperado.includes(x.esperado)) aberta.esperado.push(x.esperado);
  if (x.mudou && !aberta.mudou.includes(x.mudou)) aberta.mudou.push(x.mudou);
}

/** Roda `fn` recolhendo o que for anotado nela (a anotação não vaza para a próxima ação, nem se `fn` falhar). */
export function recolherDesfecho13<T>(fn: () => T): { valor: T; esperado: string[]; mudou: string[] } {
  const antes = aberta;
  const nova: Anotacao = { esperado: [], mudou: [] };
  aberta = nova;
  try { return { valor: fn(), ...nova }; } finally { aberta = antes; }
}
