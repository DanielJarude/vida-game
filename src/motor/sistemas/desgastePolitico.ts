/**
 * REWORK 10.5 · POL-04 — O DESGASTE TEM CAUSA, E TEM VOLTA.
 *
 * Antes, o desgaste político era um número só (0..100) que subia por quinze motivos diferentes e só descia fora do
 * cargo e fora da campanha (−3 ao ano). Quem fazia trabalho de base acumulava "desgaste: bastante" pelos posts e pelas
 * alianças, sem saber de onde vinha nem o que fazer. Agora o número continua sendo um (é ele que pesa na eleição e na
 * aprovação), mas cada aumento diz a CAUSA, e a causa decide como ele passa:
 *
 *   exposicao   fadiga de exposição (a opinião nas redes, a visibilidade mal usada) — passa rápido longe dos holofotes
 *   campanha    as alianças, os ataques, as barganhas de campanha — passam depois da eleição
 *   mandato     os anos de cargo (sobretudo executivo) — passam devagar, mais depressa com entrega e com as bases
 *   promessas   o que se prometeu e não veio, a cobrança enrolada — passa com proposta renovada e entrega
 *   derrota     o peso de perder — passa com o tempo
 *   escandalo   o caso, o processo, a prisão — passa muito devagar; a resposta pública conta
 *   partido     a troca de legenda, a briga interna — passa resolvendo o conflito
 *
 * Só importa tipos e o `clamp`: é da camada de base (a política, a exposição, as redes e a visibilidade o chamam).
 */

import { clamp } from '../rng';
import type { VidaPolitica } from '../tipos';

export type CausaDesgaste = 'exposicao' | 'campanha' | 'mandato' | 'promessas' | 'derrota' | 'escandalo' | 'partido';

export const NOME_DA_CAUSA: Record<CausaDesgaste, string> = {
  exposicao: 'a exposição demais (posts, falas, aparições)', campanha: 'as alianças e os ataques da campanha', mandato: 'os anos de cargo',
  promessas: 'promessas que não saíram do papel', derrota: 'o peso de uma derrota', escandalo: 'o escândalo que veio a público', partido: 'as brigas e trocas de partido'
};

/** O quanto cada causa passa sozinha num ano (fração do que ela pesa). */
const ESFRIA: Record<CausaDesgaste, number> = { exposicao: 0.35, campanha: 0.3, mandato: 0.08, promessas: 0.1, derrota: 0.25, escandalo: 0.06, partido: 0.12 };

/** As causas guardadas nunca somam mais que o desgaste (saves antigos: o que existe sem causa é "o que já vinha"). */
function ajustar(p: VidaPolitica): void {
  const c = p.causasDesgaste;
  if (!c) return;
  const soma = Object.values(c).reduce((a, x) => a + (x ?? 0), 0);
  if (soma > p.desgaste && soma > 0) for (const k of Object.keys(c) as CausaDesgaste[]) c[k] = Math.round((c[k] ?? 0) * p.desgaste / soma * 10) / 10;
  for (const k of Object.keys(c) as CausaDesgaste[]) if ((c[k] ?? 0) < 0.5) delete c[k];
}

/** A ÚNICA porta por onde o desgaste sobe — com a causa. */
export function desgastar(p: VidaPolitica, quanto: number, causa: CausaDesgaste): void {
  if (!quanto) return;
  if (quanto < 0) { aliviar(p, -quanto, [causa]); return; }
  p.desgaste = clamp(p.desgaste + quanto);
  const c = (p.causasDesgaste ??= {});
  c[causa] = (c[causa] ?? 0) + quanto;
  ajustar(p);
}

/**
 * Alivia o desgaste das causas indicadas (sem causa indicada, de qualquer uma). O que não tem causa registrada (saves
 * de antes do REWORK 10.5) também cede. Devolve o quanto de fato saiu.
 */
export function aliviar(p: VidaPolitica, quanto: number, causas?: CausaDesgaste[]): number {
  const c = p.causasDesgaste ?? {};
  const semCausa = Math.max(0, p.desgaste - Object.values(c).reduce((a, x) => a + (x ?? 0), 0));
  const alvo = causas ?? (Object.keys(c) as CausaDesgaste[]);
  const disponivel = alvo.reduce((a, k) => a + (c[k] ?? 0), 0) + semCausa;
  const tirar = Math.min(quanto, disponivel, p.desgaste);
  let resta = tirar;
  for (const k of alvo) { const x = Math.min(resta, c[k] ?? 0); if (x > 0) { c[k] = (c[k] ?? 0) - x; resta -= x; } }
  p.desgaste = clamp(p.desgaste - tirar);
  if (Object.keys(c).length) { p.causasDesgaste = c; ajustar(p); }
  return tirar;
}

/**
 * O ano do desgaste: cada causa esfria no ritmo dela — a exposição passa logo longe dos holofotes; o mandato, devagar
 * (e mais depressa quando há o que mostrar); a campanha, depois da eleição. Quem está em campanha esfria a metade.
 */
export function esfriarNoAno(p: VidaPolitica, o: { emMandato: boolean; entregou: boolean; emCampanha: boolean; nasBases: boolean }): void {
  const c = p.causasDesgaste ?? {};
  const semCausa = Math.max(0, p.desgaste - Object.values(c).reduce((a, x) => a + (x ?? 0), 0));
  let total = 0;
  for (const k of Object.keys(c) as CausaDesgaste[]) {
    let f = ESFRIA[k];
    if (k === 'mandato' && o.entregou) f += 0.08;
    if ((k === 'mandato' || k === 'promessas') && o.nasBases) f += 0.05;
    if (k === 'campanha' && o.emCampanha) f = 0.05;
    if (o.emCampanha) f *= 0.5;
    const x = (c[k] ?? 0) * f;
    c[k] = (c[k] ?? 0) - x;
    total += x;
  }
  // O que já vinha sem causa (saves antigos) esfria como antes: um pouco por ano fora do cargo, quase nada nele.
  total += Math.min(semCausa, o.emMandato || o.emCampanha ? 0.5 : 3);
  p.desgaste = clamp(p.desgaste - total);
  if (Object.keys(c).length) { p.causasDesgaste = c; ajustar(p); }
}

/** As causas que mais pesam agora (a tela diz de onde vem), com o que costuma ajudar. */
export function causasDoDesgaste(p: VidaPolitica): { causa: CausaDesgaste; texto: string; ajuda: string }[] {
  const AJUDA: Record<CausaDesgaste, string> = {
    exposicao: 'reduzir a exposição por um tempo', campanha: 'o tempo depois da eleição — e voltar às bases', mandato: 'entregar o que se prometeu e voltar às bases',
    promessas: 'renovar as propostas (e cumprir)', derrota: 'o tempo, e o trabalho comunitário', escandalo: 'responder às críticas com franqueza; o tempo, devagar', partido: 'resolver o conflito no partido'
  };
  return (Object.entries(p.causasDesgaste ?? {}) as [CausaDesgaste, number][]).filter(([, x]) => x >= 3).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => ({ causa: k, texto: NOME_DA_CAUSA[k], ajuda: AJUDA[k] }));
}
