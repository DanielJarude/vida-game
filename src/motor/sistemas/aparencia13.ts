/**
 * VIDA 13 — IDENTIDADE VISUAL: as regras das escolhas novas (mechas e maquiagem) e o normalizador dos saves. É o mesmo
 * fluxo do corte e da barba (`estilo.disponibilidadeAparencia` / `mudarAparencia`, ação `aparencia`): grátis, sem moral,
 * com a autonomia por idade. Nada disto vai para os genes (`identidade.geneticaDe`).
 */
import type { Vida, Visual } from '../tipos';
import { idade } from '../nucleo';
import { bloqueio, type Veredito } from '../plausibilidade';
import { AUTONOMIA } from './autonomia';
import { BLUSHES_13, CORES_DE_BATOM_13, CORES_DE_SOMBRA_13, DELINEADOS_13, MECHAS_13 } from '../dados/aparencia13';
import { CORES_NATURAIS, CORES_TINTA } from '../dados/estilo';

/** Os campos novos e os valores que cada um aceita. `nenhum` tira (volta ao sem). */
export const CAMPOS_13 = ['mechas', 'mechasEstilo', 'delineado', 'sombraOlhos', 'batom', 'blush'] as const;
export type Campo13 = (typeof CAMPOS_13)[number];
const valores = (k: Campo13): string[] => {
  switch (k) {
    case 'mechas': return [...CORES_NATURAIS, ...CORES_TINTA];
    case 'mechasEstilo': return MECHAS_13.map(x => x.id);
    case 'delineado': return DELINEADOS_13.map(x => x.id);
    case 'sombraOlhos': return Object.keys(CORES_DE_SOMBRA_13);
    case 'batom': return Object.keys(CORES_DE_BATOM_13);
    case 'blush': return Object.keys(BLUSHES_13);
  }
};
export const valorValido13 = (k: Campo13, x: unknown) => typeof x === 'string' && valores(k).includes(x);

/** O veredito de um campo novo (undefined: não é campo novo, ou está tudo certo). */
export function vereditoAparencia13(v: Vida, k: string, x: unknown): Veredito | undefined {
  if (!(CAMPOS_13 as readonly string[]).includes(k)) return undefined;
  const campo = k as Campo13;
  if (x === 'nenhum' || x === undefined) return v.eu.visual[campo] === undefined ? bloqueio('incompativel', 'Já está sem.') : undefined;
  if (!valorValido13(campo, x)) return bloqueio('impossivel', 'Essa opção não existe.');
  if (v.eu.visual[campo] === x) return bloqueio('incompativel', 'Já está assim.');
  // Mechas são tinta (a idade de pintar o cabelo); maquiagem de verdade, a de decidir o visual — antes, a família decide.
  if (idade(v) < AUTONOMIA.aparencia.idade) return bloqueio('impossivel', campo === 'mechas' || campo === 'mechasEstilo' ? 'Fazer mechas ainda passa pela família.' : 'Maquiagem de todo dia ainda passa pela família.');
  return undefined;
}

/** Uma mecha sem jeito vira luzes; um jeito sem cor não desenha nada (sai). */
export function ajustarMechas(vis: Visual): void {
  if (vis.mechas && !vis.mechasEstilo) vis.mechasEstilo = 'luzes';
  if (!vis.mechas) delete vis.mechasEstilo;
}

/**
 * Saves: os campos novos são opcionais (ausentes = sem). Um valor que não existe (save editado à mão, versão futura)
 * sai, em vez de quebrar o retrato. Idempotente; não mexe em nada que já existia.
 */
export function normalizarVida13Aparencia(v: Vida): void {
  const vis = v.eu?.visual;
  if (!vis) return;
  for (const k of CAMPOS_13) if (vis[k] !== undefined && !valorValido13(k, vis[k])) delete vis[k];
  ajustarMechas(vis);
}
