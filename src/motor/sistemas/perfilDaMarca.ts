/**
 * VIDA 12.8 — a leitura de uma marca: o posicionamento (econômico a ultraluxo) e as notas do perfil, com o padrão do
 * posicionamento onde o perfil não diz nada. Módulo de base (só catálogos): as coisas, a casa e as lojas o leem.
 */
import { marca } from '../dados/lojas';
import { NOME_SEGMENTO_DE_MARCA, NOTAS_DO_SEGMENTO, PERFIS_DE_MARCA, type EstiloDeMarca, type QualidadeDeMarca, type SegmentoDeMarca } from '../dados/perfisDeMarca';

/** O posicionamento da marca: o do perfil, ou o da faixa (popular → econômico, média → intermediário, premium, luxo). */
export function segmentoDaMarca(id: string | undefined): SegmentoDeMarca | undefined {
  if (!id) return undefined;
  const m = marca(id);
  if (!m) return undefined;
  return PERFIS_DE_MARCA[id]?.seg ?? (m.faixa as SegmentoDeMarca);
}
export const nomeDoSegmentoDaMarca = (id: string | undefined) => { const s = segmentoDaMarca(id); return s ? NOME_SEGMENTO_DE_MARCA[s] : undefined; };

/** Uma nota (1..5) do perfil da marca; sem marca (o que foi dado, o sem nome), 2. */
export function notaDaMarca(id: string | undefined, q: QualidadeDeMarca): number {
  const s = segmentoDaMarca(id);
  if (!s) return 2;
  return PERFIS_DE_MARCA[id!]?.notas?.[q] ?? NOTAS_DO_SEGMENTO[s][q];
}

/** O estilo do desenho (o pé, o metal, o brilho): o do perfil, ou o do posicionamento. */
export function estiloDaMarca(id: string | undefined): EstiloDeMarca {
  const s = segmentoDaMarca(id);
  if (!s) return 'funcional';
  return PERFIS_DE_MARCA[id!]?.estilo ?? (s === 1 ? 'basico' : s === 2 ? 'funcional' : s === 3 ? 'contemporaneo' : s === 4 ? 'classico' : 'iconico');
}

/** O que a marca é, em palavras: o posicionamento, a frase, aquilo pelo que é conhecida. */
export function leituraDaMarca(id: string | undefined): { segmento: string; frase?: string; fama?: QualidadeDeMarca; notas: Record<QualidadeDeMarca, number> } | undefined {
  const s = segmentoDaMarca(id);
  if (!s) return undefined;
  const p = PERFIS_DE_MARCA[id!];
  const notas = { ...NOTAS_DO_SEGMENTO[s], ...(p?.notas ?? {}) } as Record<QualidadeDeMarca, number>;
  return { segmento: NOME_SEGMENTO_DE_MARCA[s], frase: p?.frase, fama: p?.fama, notas };
}

/**
 * O desgaste por ano, relativo (1 = o da vida útil do produto): a durabilidade 5 gasta 30% menos; a 1, 35% mais. Sem
 * marca (o dado, o de saves antigos), 1 — nada muda para quem já tinha.
 */
export const fatorDeDesgaste = (id: string | undefined) => (id ? [1.35, 1.15, 1, 0.85, 0.7][Math.max(1, Math.min(5, notaDaMarca(id, 'durabilidade'))) - 1] : 1);
/** O que o mercado de usados paga sobre o que sobrou da coisa (sem marca: a metade, como sempre). */
export const fatorDeRevenda = (id: string | undefined) => (id ? [0.35, 0.45, 0.5, 0.6, 0.78][Math.max(1, Math.min(5, notaDaMarca(id, 'revenda'))) - 1] : 0.5);
