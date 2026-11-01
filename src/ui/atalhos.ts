/**
 * VIDA 12.6 — OS ATALHOS (ações favoritas) e OS ÚLTIMOS AVISOS. Ficam neste navegador, por vida (o save não muda): os
 * atalhos são a ação inteira (o motor confere de novo, na hora, se ainda dá para fazer); os avisos, o texto do que
 * aconteceu ao agir, com o ano. Tudo protegido: sem armazenamento (aba privada, bloqueio), simplesmente não guarda.
 */
import type { Acao } from '../motor/acoes';

export interface Atalho { acao: Acao; rotulo: string }
export interface AvisoGuardado { texto: string; titulo?: string; ano: number; idade: number }

const LIMITE_ATALHOS = 8, LIMITE_AVISOS = 40;
const EVENTO = 'vida-atalhos';
const ler = <T,>(chave: string): T[] => { try { const x = localStorage.getItem(chave); return x ? (JSON.parse(x) as T[]) : []; } catch { return []; } };
const gravar = (chave: string, xs: unknown[]) => { try { localStorage.setItem(chave, JSON.stringify(xs)); } catch { /* sem armazenamento: não guarda */ } };
const chaveAtalhos = (vidaId: string) => `VIDA_ATALHOS:${vidaId}`;
const chaveAvisos = (vidaId: string) => `VIDA_AVISOS:${vidaId}`;
const igual = (a: Acao, b: Acao) => JSON.stringify(a) === JSON.stringify(b);

export const atalhosDe = (vidaId: string): Atalho[] => ler<Atalho>(chaveAtalhos(vidaId));
export const ehAtalho = (vidaId: string, acao: Acao) => atalhosDe(vidaId).some(x => igual(x.acao, acao));
export function alternarAtalho(vidaId: string, acao: Acao, rotulo: string): boolean {
  const xs = atalhosDe(vidaId);
  const tinha = xs.some(x => igual(x.acao, acao));
  const novos = tinha ? xs.filter(x => !igual(x.acao, acao)) : [...xs, { acao, rotulo }].slice(-LIMITE_ATALHOS);
  gravar(chaveAtalhos(vidaId), novos);
  try { window.dispatchEvent(new Event(EVENTO)); } catch { /* fora do navegador */ }
  return !tinha;
}
export const EVENTO_ATALHOS = EVENTO;

export const avisosDe = (vidaId: string): AvisoGuardado[] => ler<AvisoGuardado>(chaveAvisos(vidaId));
export function guardarAviso(vidaId: string, aviso: AvisoGuardado): void {
  if (!aviso.texto) return;
  const xs = avisosDe(vidaId);
  if (xs[0]?.texto === aviso.texto) return;
  gravar(chaveAvisos(vidaId), [aviso, ...xs].slice(0, LIMITE_AVISOS));
}
