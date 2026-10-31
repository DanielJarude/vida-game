/**
 * REWORK 12.4 — A MEMÓRIA DOS OBJETOS: o que um objeto vale para quem o tem não é o que vale no mercado.
 *
 * Um violão de seiscentos reais pode ser o objeto mais importante da casa: foi o primeiro, foi presente da avó, tocou
 * em todos os aniversários. O valor afetivo nasce da ORIGEM (presente, herança, conquista, feito com as próprias mãos),
 * cresce com o TEMPO de convivência e com o USO junto de gente (`vinculo.habitos`, `usos_de:`) — e nunca do preço.
 * Ele não vira dinheiro: pesa na hora de vender (a vida registra), decide o que se guarda quando quebra (lembrança, não
 * lixo) e o que atravessa a sucessão como objeto de família.
 *
 * Módulo de base (só tipos): lido pelas coisas, pela coleção, pela sucessão e pelas telas.
 */

import type { CoisaTida, Colecionavel, EpisodioBem, ItemDeEstilo, MemoriaDoObjeto, Vida } from '../tipos';
import { clamp } from '../rng';

type ComMemoria = { memoria?: MemoriaDoObjeto; historia?: EpisodioBem[]; t?: number; tCompra?: number };

const BASE_DA_ORIGEM: Record<MemoriaDoObjeto['origem'], number> = { compra: 0, presente: 25, heranca: 45, feito: 30, conquista: 40 };

/** O valor afetivo (0..100): a origem, os anos juntos, o uso com gente. */
export function afetoDe(v: Vida, o: ComMemoria & { coisaId?: string; afeto?: string; procedencia?: string }): number {
  const m = o.memoria;
  let x = m?.afeto ?? (m ? BASE_DA_ORIGEM[m.origem] : 0);
  // A coleção antiga guardava o afeto em palavras (`Colecionavel.afeto`): a herdada, o presente, a da carreira.
  if (!m && o.afeto) x = Math.max(x, 40);
  if (!m && o.procedencia === 'herdada') x = Math.max(x, 45);
  if (!m && o.procedencia === 'presente') x = Math.max(x, 25);
  const desde = o.t ?? o.tCompra ?? v.t;
  x += Math.min(20, ((v.t - desde) / 12) * 1.2);
  if (o.coisaId) {
    // O uso com gente (tocar para alguém, jogar com o filho) é o que mais prende um objeto à vida.
    let comGente = 0;
    for (const vin of Object.values(v.vinculos)) comGente += vin.habitos?.[`coisa:${o.coisaId}`] ?? 0;
    x += Math.min(20, comGente * 2.5);
  }
  return Math.round(clamp(x, 0, 100));
}

export const palavraDoAfeto = (x: number): string | undefined =>
  x >= 70 ? 'de valor afetivo enorme' : x >= 45 ? 'muito estimado' : x >= 25 ? 'tem história' : undefined;

/** Uma linha na história do objeto (as últimas 30 bastam: o começo fica, o meio se resume). */
export function registrarNoObjeto(o: { historia?: EpisodioBem[] }, t: number, texto: string): void {
  const h = (o.historia ??= []);
  h.push({ t, texto });
  if (h.length > 30) h.splice(1, h.length - 30);
}

/** De onde veio, em palavras ("presente de Ana", "herdado de Seu João", "feito por você"). */
export function origemEmPalavras(m: MemoriaDoObjeto | undefined, feminino = false): string | undefined {
  if (!m) return undefined;
  const o = feminino ? 'a' : 'o';
  switch (m.origem) {
    case 'presente': return m.de ? `presente de ${m.de}` : 'presente';
    case 'heranca': return m.de ? `herdad${o} de ${m.de}` : `herdad${o}`;
    case 'feito': return `feit${o} por você`;
    case 'conquista': return m.motivo ?? 'conquista';
    default: return m.motivo;
  }
}

/** Os objetos que mais importam (para a lembrança, a sucessão e a tela "O que mais importa"). */
export function objetosDeAfeto(v: Vida, minimo = 45): { tipo: 'coisa' | 'colecao' | 'estilo'; obj: CoisaTida | Colecionavel | ItemDeEstilo; afeto: number }[] {
  const out: { tipo: 'coisa' | 'colecao' | 'estilo'; obj: CoisaTida | Colecionavel | ItemDeEstilo; afeto: number }[] = [];
  for (const c of v.financas.coisas ?? []) { const a = afetoDe(v, c); if (a >= minimo) out.push({ tipo: 'coisa', obj: c, afeto: a }); }
  for (const c of v.financas.colecao ?? []) { const a = afetoDe(v, c); if (a >= minimo) out.push({ tipo: 'colecao', obj: c, afeto: a }); }
  for (const c of v.eu.estilo?.itens ?? []) { const a = afetoDe(v, c); if (a >= minimo) out.push({ tipo: 'estilo', obj: c, afeto: a }); }
  return out.sort((a, b) => b.afeto - a.afeto);
}
