/**
 * Personalidade emergente.
 *
 * Só escolhas COMPORTAMENTAIS movem traços: uma decisão que expressa valor ou
 * atitude, ou uma rotina mantida por anos. Escolhas biográficas (a primeira
 * palavra, o nome do filho) e acontecimentos nunca movem nada.
 */

import type { Traco, Vida } from './tipos';

export const TRACOS: readonly Traco[] = ['empatia', 'generosidade', 'disciplina', 'impulsividade', 'coragem', 'sociabilidade', 'independencia', 'familia'];

export function aplicarPersonalidade(v: Vida, origem: string, impactos: Partial<Record<Traco, number>>): void {
  const limpos: Partial<Record<Traco, number>> = {};
  for (const [k, val] of Object.entries(impactos) as [Traco, number][]) {
    const x = Math.max(-5, Math.min(5, Math.round(val)));
    if (!x) continue;
    limpos[k] = x;
    v.personalidade.tracos[k] = Math.max(-100, Math.min(100, v.personalidade.tracos[k] + x * 3));
  }
  if (Object.keys(limpos).length === 0) return;
  v.personalidade.evidencias.push({ t: v.t, origem, impactos: limpos });
  if (v.personalidade.evidencias.length > 80) v.personalidade.evidencias.splice(0, v.personalidade.evidencias.length - 80);
}

const ROTULOS: Record<Traco, [string, string, string, string]> = {
  // [positivo masc, positivo fem, negativo masc, negativo fem]
  empatia: ['atento aos outros', 'atenta aos outros', 'pouco dado a se colocar no lugar dos outros', 'pouco dada a se colocar no lugar dos outros'],
  generosidade: ['generoso', 'generosa', 'agarrado ao que é seu', 'agarrada ao que é seu'],
  disciplina: ['disciplinado', 'disciplinada', 'avesso a rotina', 'avessa a rotina'],
  impulsividade: ['impulsivo', 'impulsiva', 'cauteloso', 'cautelosa'],
  coragem: ['corajoso', 'corajosa', 'avesso a riscos', 'avessa a riscos'],
  sociabilidade: ['sociável', 'sociável', 'reservado', 'reservada'],
  independencia: ['independente', 'independente', 'apegado ao grupo', 'apegada ao grupo'],
  familia: ['muito ligado à família', 'muito ligada à família', 'distante da família', 'distante da família']
};

/** Até três traços marcantes, em palavras. Nunca números. */
export function tracosMarcantes(v: Vida): string[] {
  const fem = v.eu.genero === 'feminino';
  return (Object.entries(v.personalidade.tracos) as [Traco, number][])
    .filter(([, val]) => Math.abs(val) >= 15)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 3)
    .map(([t, val]) => {
      const r = ROTULOS[t];
      return val > 0 ? (fem ? r[1] : r[0]) : fem ? r[3] : r[2];
    });
}
