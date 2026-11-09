/**
 * VIDA 14 · CONQUISTAS — a porta única da frente para a camada de cima (ações, ano, save): os objetivos pessoais
 * (`objetivos.ts`), o reconhecimento do meio (`reconhecimento.ts` + `acontecimentos.ts`) e os programas da cidade
 * (`programas.ts`).
 */

import type { Vida } from '../../tipos';
import type { Rng } from '../../rng';
import type { rngDe } from '../../rng';
import type { Veredito } from '../../plausibilidade';
import { OBJETIVOS14, PROGRAMAS14, type Conquistas14 } from '../../dados14/conquistas/catalogo';
import { disponibilidadeObjetivo14, executarObjetivo14, processarObjetivos14, type OqueObjetivo14 } from './objetivos';
import { disponibilidadePrograma14, modeloPrograma14, viverPrograma14, type OquePrograma14 } from './programas';
import { PRESTIGIO_MAXIMO14, reconhecimentoDoMeio14 } from './reconhecimento';

export type OqueConquistas14 = OqueObjetivo14 | OquePrograma14;
export type AcaoConquistas14 = { tipo: 'conquistas14'; oque: OqueConquistas14 };

export function disponibilidadeConquistas14(v: Vida, a: OqueConquistas14): Veredito {
  return a.op === 'programa' ? disponibilidadePrograma14(v, a) : disponibilidadeObjetivo14(v, a);
}

export function executarConquistas14(v: Vida, r: Rng, a: OqueConquistas14): { texto: string; titulo: string } {
  if (a.op === 'programa') return { texto: viverPrograma14(v, r, a), titulo: modeloPrograma14(a.id)?.nome ?? 'Um programa' };
  return { texto: executarObjetivo14(v, a), titulo: 'Objetivos' };
}

/** A linha do extrato (o que mexeu no dinheiro tem nome). */
export const linhaDoExtrato14 = (a: OqueConquistas14): string => (a.op === 'programa' ? (modeloPrograma14(a.id)?.grupo === 'meio' ? 'Eventos do meio profissional' : 'Programas: restaurantes e eventos') : 'Objetivos');

/** O ano: os objetivos (silencioso, salvo a conclusão) e o reconhecimento do meio (às vezes um convite). */
export function processarConquistas14<C extends { id: string; tipo: string; manual?: boolean; peso?: unknown }, X extends { p: Record<string, { id: string }> }>(
  v: Vida, catalogo: readonly C[], preparar: (c: C, v: Vida, r: ReturnType<typeof rngDe>) => X | null, abrir: (c: C, ctx: X) => boolean
): void {
  if (v.morte) return;
  processarObjetivos14(v);
  reconhecimentoDoMeio14(v, catalogo, preparar, abrir);
}

/* ------------------------------------------------------------------ Saves */

const TIPOS_OBJ = new Set<string>(OBJETIVOS14.map(o => o.id));
const ESTADOS = new Set(['ativo', 'concluido', 'abandonado']);
const PROGRAMAS = new Set(PROGRAMAS14.map(p => p.id));
const TIPOS_REC = new Set(['premio', 'descoberta', 'congresso', 'feira', 'palestra', 'entrevista', 'projeto', 'evento']);

/** Saves antigos não têm o campo (nada a fazer); o que vier torto sai — nada é recalculado para trás. */
export function normalizarVida14Conquistas(v: Vida): void {
  const c = v.conquistas14 as Conquistas14 | undefined;
  if (c === undefined) return;
  if (!c || typeof c !== 'object' || Array.isArray(c)) { delete v.conquistas14; return; }
  if (c.objetivos !== undefined) {
    if (!Array.isArray(c.objetivos)) delete c.objetivos;
    else c.objetivos = c.objetivos.filter(o => o && typeof o.id === 'string' && TIPOS_OBJ.has(o.tipo) && ESTADOS.has(o.estado) && typeof o.t === 'number' && Number.isFinite(o.alvo));
  }
  if (c.reconhecimentos !== undefined) {
    if (!Array.isArray(c.reconhecimentos)) delete c.reconhecimentos;
    else c.reconhecimentos = c.reconhecimentos.filter(x => x && typeof x.t === 'number' && TIPOS_REC.has(x.tipo) && typeof x.texto === 'string').map(x => ({ ...x, peso: x.peso === 2 ? 2 : 1 }));
  }
  if (c.prestigio !== undefined) c.prestigio = typeof c.prestigio === 'number' && Number.isFinite(c.prestigio) ? Math.max(0, Math.min(PRESTIGIO_MAXIMO14, c.prestigio)) : undefined;
  if (c.prestigio === undefined) delete c.prestigio;
  if (c.programas !== undefined) {
    if (!c.programas || typeof c.programas !== 'object' || Array.isArray(c.programas)) delete c.programas;
    else for (const [k, x] of Object.entries(c.programas)) if (!PROGRAMAS.has(k) || !x || typeof x.t !== 'number' || typeof x.vezes !== 'number') delete c.programas[k];
  }
}
