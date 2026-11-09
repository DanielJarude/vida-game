/**
 * VIDA 14 — PIERCINGS (rework): tudo em Você · Aparência · Piercings. O FURO passa a existir por si: feito (com quando
 * furou), livre ou ocupado — antes, só a joia existia e o furo era "ter uma joia daquele lugar". Comprar no painel é a
 * compra de sempre (`estilo.comprarItem`: a joia entra no inventário, já em uso, e a que estava no furo sai e fica
 * guardada); se o furo ainda não existe, o estúdio cobra o furo junto (a taxa do furo, pela economia da cidade). Usar e
 * tirar continuam a ação de sempre (`usar_item` com o id da peça). A loja antiga continua vendendo — e leva ao painel.
 *
 * Saves: `estilo.furos` (opcional) — o normalizador preenche com os furos das joias que a pessoa já tem (o lóbulo, com os
 * brincos): nenhuma joia some, nenhum furo some.
 */
import type { Vida } from '../../tipos';
import { idade } from '../../nucleo';
import { bloqueio, type Veredito } from '../../plausibilidade';
import { ITENS_ESTILO, itemEstilo, type ItemEstilo } from '../../dados/estilo';
import { IDADE_MINIMA_PIERCING } from '../../dados/piercings129';
import { NOME_DO_FURO, ZONAS_DE_PIERCING } from '../../dados/piercings13';
import { economiaLocal } from '../../dados/lugares';
import { comprarItem, disponibilidadeComprarItem, itensDaPessoa, precoDoItem } from '../../sistemas/estilo';
import { pagar, vereditoDePagar } from '../../sistemas/dinheiro';
import { dinheiro as fmt } from '../../texto';

/** Todos os furos (o lóbulo, `orelha`, é o dos brincos). */
export const FUROS_14: string[] = ZONAS_DE_PIERCING.flatMap(z => z.furos);
const FUROS = new Set(FUROS_14);

/** O preço do furo no estúdio (reais de referência; a cidade ajusta): a cartilagem e as barras duplas custam mais. */
const TAXA_DO_FURO: Record<string, number> = {
  orelha: 60, lobulo2: 70, helix: 120, tragus: 130, concha: 130, daith: 150, industrial: 180,
  nariz: 110, nariz2: 110, septo: 140, ponte: 170, sobrancelha: 110, labio: 120, labio2: 120, medusa: 130, umbigo: 140
};
/** Quanto tempo leva para cicatrizar (meses, o que os estúdios dizem): informação, não regra do jogo. */
export const CICATRIZACAO: Record<string, string> = {
  orelha: '6 a 8 semanas', lobulo2: '6 a 8 semanas', helix: '6 a 12 meses', tragus: '6 a 12 meses', concha: '6 a 12 meses', daith: '6 a 12 meses', industrial: '9 a 12 meses',
  nariz: '3 a 6 meses', nariz2: '3 a 6 meses', septo: '2 a 3 meses', ponte: '2 a 3 meses', sobrancelha: '2 a 3 meses', labio: '2 a 3 meses', labio2: '2 a 3 meses', medusa: '2 a 3 meses', umbigo: '6 a 12 meses'
};

export const taxaDoFuro = (v: Vida, lugar: string) => Math.round((TAXA_DO_FURO[lugar] ?? 120) * economiaLocal(v.moradia.municipioId).custo / 10) * 10;

/** As joias que cabem num furo: os piercings daquele lugar; no lóbulo, os brincos. */
export const joiasDoFuro = (lugar: string): ItemEstilo[] => ITENS_ESTILO.filter(it => (lugar === 'orelha' ? it.lugar === 'orelha' && !it.piercing : it.piercing?.regiao === lugar));
/** O furo de uma joia (o lugar), quando ela é joia de furo. */
export function furoDaJoia(itemId: string): string | undefined {
  const it = itemEstilo(itemId);
  if (!it) return undefined;
  if (it.piercing) return it.piercing.regiao;
  return it.lugar === 'orelha' ? 'orelha' : undefined;
}

export type EstadoDoFuro = 'sem_furo' | 'livre' | 'ocupado';
/** O furo existe? (Registrado, ou há uma joia sua daquele furo — os saves antigos não registravam.) */
export function furoFeito(v: Vida, lugar: string): boolean {
  if (v.eu.estilo?.furos?.[lugar] !== undefined) return true;
  return itensDaPessoa(v).some(x => furoDaJoia(x.itemId) === lugar);
}
export function estadoDoFuro(v: Vida, lugar: string): { estado: EstadoDoFuro; emUso?: string; desde?: number } {
  const emUso = itensDaPessoa(v).find(x => x.usando && !x.local && furoDaJoia(x.itemId) === lugar);
  const desde = v.eu.estilo?.furos?.[lugar];
  if (emUso) return { estado: 'ocupado', emUso: emUso.id, desde };
  return furoFeito(v, lugar) ? { estado: 'livre', desde } : { estado: 'sem_furo' };
}

/** O preço de levar uma joia pelo painel: a joia (preço de referência na cidade) + o furo, se ainda não existe. */
export function precoNoPainel(v: Vida, itemId: string): { joia: number; furo: number; total: number } {
  const lugar = furoDaJoia(itemId);
  const joia = precoDoItem(v, itemId);
  const furo = lugar && !furoFeito(v, lugar) ? taxaDoFuro(v, lugar) : 0;
  return { joia, furo, total: joia + furo };
}

export type OquePiercing14 = { op: 'comprar'; itemId: string };

export function disponibilidadePiercing14(v: Vida, o: OquePiercing14): Veredito {
  const lugar = furoDaJoia(o.itemId);
  if (!lugar || !FUROS.has(lugar)) return bloqueio('impossivel', 'Essa joia não é de furo.');
  const base = disponibilidadeComprarItem(v, o.itemId);
  // O que não é dinheiro (idade, prisão, já tem) decide antes; o dinheiro, pelo total (a joia e o furo).
  if (base.grau !== 'permitido' && !base.dinheiro) return base;
  const novo = !furoFeito(v, lugar);
  if (novo) {
    if (lugar !== 'orelha' && idade(v) < IDADE_MINIMA_PIERCING) return bloqueio('impossivel', 'O estúdio não fura quem tem menos de 16 anos.');
    if (v.corpo.saude < 40) return bloqueio('incompativel', 'Com a saúde assim, o estúdio pede para voltar depois.');
  }
  return vereditoDePagar(v, precoNoPainel(v, o.itemId).total);
}

export function executarPiercing14(v: Vida, o: OquePiercing14): string {
  const lugar = furoDaJoia(o.itemId)!;
  const novo = !furoFeito(v, lugar);
  const taxa = novo ? taxaDoFuro(v, lugar) : 0;
  const texto = comprarItem(v, o.itemId);
  v.eu.estilo ??= { itens: [] };
  if (novo) { pagar(v, taxa); (v.eu.estilo.furos ??= {})[lugar] = v.t; }
  const nome = (NOME_DO_FURO[lugar] ?? lugar).toLowerCase();
  return novo
    ? `Furou ${lugar === 'orelha' ? 'o lóbulo' : `o ${nome}`} (${fmt(taxa)}) e já saiu com a joia. ${texto} Cicatriza em ${CICATRIZACAO[lugar] ?? 'alguns meses'}.`
    : texto;
}

/** Saves: os furos das joias que a pessoa já tem entram no registro (o mais antigo); lixo sai. Idempotente. */
export function normalizarVida14AparenciaPiercings(v: Vida): void {
  const e = v.eu?.estilo;
  if (!e) return;
  const furos: Record<string, number> = {};
  for (const [k, t] of Object.entries(e.furos ?? {})) if (FUROS.has(k) && typeof t === 'number' && Number.isFinite(t)) furos[k] = t;
  for (const x of e.itens ?? []) {
    const l = furoDaJoia(x.itemId);
    if (l && (furos[l] === undefined || x.t < furos[l])) furos[l] = x.t;
  }
  if (Object.keys(furos).length) e.furos = furos; else delete e.furos;
}
