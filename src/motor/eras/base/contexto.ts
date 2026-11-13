/**
 * ERAS HISTÓRICAS · O CONTEXTO DO ANO — a pergunta única que os sistemas fazem à camada histórica.
 *
 * Fica embaixo de tudo (só importa tipos, tempo e dados puros): o Celular, as redes, as lojas, os veículos e as
 * profissões perguntam aqui, sem importar o motor da época (`eras/ano`). Para uma vida contemporânea (sem `v.era`),
 * toda pergunta devolve o comportamento de antes — os portões são transparentes.
 */

import type { Vida } from '../../tipos';
import { anoDe } from '../../tempo';
import { TECNOLOGIA_POR_ID, type MeioDeComunicacao } from './tecnologias';
import { salarioMinimoReal } from './moedas';

export const ehHistorica = (v: Vida): boolean => !!v.era;

const CLASSE_NIVEL = { vulneravel: 0, trabalhadora: 1, media_baixa: 2, media: 3, alta: 4 } as const;

function hashUnit(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 15; h = Math.imul(h, 2246822507); h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

/**
 * A faixa econômica de agora, 0 (pobre) a 4 (rica): enquanto mora com a família, a da família; depois, pelo salário
 * (em salários mínimos da época) e pelo dinheiro guardado.
 */
export function nivelEconomico(v: Vida): number {
  const daFamilia = CLASSE_NIVEL[v.origem.classe] ?? 2;
  if (v.moradia.tipo === 'pais' || v.moradia.tipo === 'parente') return daFamilia;
  const sm = salarioMinimoReal(v.t) ?? 1600;
  const renda = (v.trabalho.atual?.salario ?? 0) / sm;
  const guardado = (v.financas.conta ?? 0) / sm;
  const pelaRenda = renda >= 15 ? 4 : renda >= 6 ? 3 : renda >= 3 ? 2 : renda >= 1.2 ? 1 : 0;
  return Math.max(pelaRenda, guardado >= 600 ? 4 : guardado >= 150 ? 3 : 0, Math.min(daFamilia, 2));
}

export type Acesso = 'indisponivel' | 'rara' | 'comum';

/** Quando a tecnologia chega a ESTA vida (o deslocamento de até um ano é da semente da vida). */
function deslocamento(v: Vida, id: string): number {
  return Math.round((hashUnit(`${v.id}:era:${id}`) - 0.5) * 2);
}

/**
 * A situação da tecnologia no ano corrente para esta vida:
 *   - indisponivel: ainda não chegou (ou já saiu de uso), ou chegou só para quem tem mais renda;
 *   - rara: existe e a pessoa tem acesso, mas é novidade/luxo;
 *   - comum: parte da vida da pessoa.
 * Vida contemporânea: sempre 'comum' (o jogo de hoje).
 */
export function tecnologia(v: Vida, id: string, ano = anoDe(v.t)): Acesso {
  if (!v.era) return 'comum';
  const x = TECNOLOGIA_POR_ID.get(id);
  if (!x) return 'comum';
  if (x.fim !== undefined && ano >= x.fim) return 'indisponivel';
  if (ano < x.brasil) return 'indisponivel';
  const d = deslocamento(v, id);
  const nivel = nivelEconomico(v);
  if (ano >= x.massa + d) return 'comum';
  if (ano >= x.popular + d) return nivel >= 2 ? 'comum' : nivel >= 1 && ano >= x.popular + d + 2 ? 'rara' : 'indisponivel';
  return nivel >= 4 ? 'rara' : 'indisponivel';
}

/** A pessoa tem (ou pode ter) a tecnologia agora. */
export const temAcesso = (v: Vida, id: string, ano?: number) => tecnologia(v, id, ano) !== 'indisponivel';

/** Ainda não existe no Brasil (independe da renda) — para dizer "ainda não existe" em vez de "não dá". */
export function existeNoBrasil(v: Vida, id: string, ano = anoDe(v.t)): boolean {
  if (!v.era) return true;
  const x = TECNOLOGIA_POR_ID.get(id);
  return !x || (ano >= x.brasil && (x.fim === undefined || ano < x.fim));
}

/** O aparelho com que a pessoa se comunica no ano (a vida contemporânea: o smartphone de sempre). */
export function meioDeComunicacao(v: Vida): MeioDeComunicacao {
  if (!v.era) return 'smartphone';
  if (temAcesso(v, 'smartphone')) return 'smartphone';
  if (temAcesso(v, 'celular')) return 'celular';
  return 'fixo';
}

/** O ano de lançamento no Brasil (para a frase "só a partir de..."). */
export const anoNoBrasil = (id: string) => TECNOLOGIA_POR_ID.get(id)?.brasil;
export const nomeDaTecnologia = (id: string) => TECNOLOGIA_POR_ID.get(id)?.nome ?? id;

/**
 * Save: a época é opcional e nunca inventada. Uma `era` malformada (save editado à mão, versão futura) é descartada — a
 * vida volta a ser contemporânea, que é o comportamento de antes; a bem formada só ganha a lista de vistos. Idempotente.
 */
export function normalizarEra(v: Vida): void {
  const e = v.era as unknown as Record<string, unknown> | undefined;
  if (e === undefined) return;
  const ok = !!e && typeof e === 'object' && e.pais === 'BR' && typeof e.ano === 'number' && Number.isFinite(e.ano) && e.ano >= 1980 && e.ano <= 2025 && typeof e.decada === 'number';
  if (!ok) { delete v.era; return; }
  if (!Array.isArray(v.era!.vistos)) v.era!.vistos = [];
  else v.era!.vistos = v.era!.vistos.filter(x => typeof x === 'string');
  const r = v.era!.retido;
  if (r && !(typeof r.valor === 'number' && Number.isFinite(r.valor) && r.valor >= 0 && typeof r.tVolta === 'number' && typeof r.parcelas === 'number')) delete v.era!.retido;
}
