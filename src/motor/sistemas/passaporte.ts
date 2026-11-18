/**
 * VIDA 27 · §6 — o registro das viagens (o passaporte de verdade).
 *
 * Havia dois caminhos de viagem — Viagens (`v14/viagens`) e as Experiências (a viagem pelo país e para fora, a lua de
 * mel) — e só o primeiro registrava: o passaporte contava as viagens da VIDA 14 e guardava cada país uma vez só (a data
 * da primeira). Quem viajou para fora pelas Experiências via "1 viagem". Agora toda viagem concluída entra aqui, uma a
 * uma (data, destino, países, nacional ou internacional, por onde, dias): ir três vezes à Argentina são três viagens e
 * um país. Folha: só a base (quem viaja chama; o passaporte lê).
 */
import type { Vida } from '../tipos';
import { paisDaVida } from '../mundo/vida';

export interface ViagemRegistrada {
  t: number;
  destino: string;
  /** Os países (ISO) da viagem — o de casa também, se for nacional. */
  paises: string[];
  internacional: boolean;
  via: 'viagens' | 'experiencia' | 'lua_de_mel';
  dias?: number;
}

const MAX = 200;

/** Registra uma viagem concluída. Devolve os países de fora carimbados pela primeira vez. */
export function registrarViagem(v: Vida, x: Omit<ViagemRegistrada, 't' | 'internacional'>): string[] {
  const r = (v.viagens14 ??= { paises: {} });
  const casa = paisDaVida(v);
  const novos = x.paises.filter(p => p !== casa && r.paises[p] === undefined);
  for (const p of x.paises) if (p !== casa) r.paises[p] ??= v.t;
  r.n = (r.n ?? 0) + 1;
  const reg = (r.registro ??= []);
  reg.push({ t: v.t, destino: x.destino, paises: [...new Set(x.paises)], internacional: x.paises.some(p => p !== casa), via: x.via, ...(x.dias ? { dias: x.dias } : {}) });
  if (reg.length > MAX) reg.splice(0, reg.length - MAX);
  return novos;
}

/** O que o passaporte mostra: viagens (todas), internacionais, nacionais, os países de fora (com quantas vezes). */
export function leituraDoPassaporte(v: Vida): { viagens: number; internacionais: number; nacionais: number; paises: { iso: string; vezes: number; primeira: number }[]; ultimas: ViagemRegistrada[] } {
  const r = v.viagens14;
  const reg = r?.registro ?? [];
  const casa = paisDaVida(v);
  const vezes: Record<string, number> = {};
  for (const x of reg) for (const p of x.paises) if (p !== casa) vezes[p] = (vezes[p] ?? 0) + 1;
  const paises = Object.entries(r?.paises ?? {}).filter(([iso]) => iso !== casa)
    .map(([iso, t]) => ({ iso, vezes: Math.max(1, vezes[iso] ?? 0), primeira: t })).sort((a, b) => a.primeira - b.primeira);
  const internacionais = reg.filter(x => x.internacional).length;
  // Viagens de antes do registro (saves antigos sem biografia que as diga) continuam contadas por `n`.
  const viagens = Math.max(r?.n ?? 0, reg.length);
  return { viagens, internacionais, nacionais: viagens - internacionais, paises, ultimas: reg.slice(-8).reverse() };
}
