/**
 * ERAS v3 · os pacotes de época, sob demanda: um por país, cada um um arquivo à parte no build (`eras-<id>`), como os
 * perfis do mundo (`mundo/carregar`, que chama este junto). O Brasil não tem pacote (os módulos dele já vêm na base).
 */
import { registrarEra, type PacoteDeEra } from '../base/pacote';

type Carregador = () => Promise<{ PACOTE: PacoteDeEra }>;

const PACOTES: Record<string, Carregador> = {
  US: () => import('./us/pacote'),
  GB: () => import('./gb/pacote'),
  JP: () => import('./jp/pacote'),
  DE: () => import('./de/pacote'),
  AR: () => import('./ar/pacote')
};

const carregados = new Map<string, Promise<void>>();

export function carregarEra(pais: string): Promise<void> {
  let p = carregados.get(pais);
  if (!p) {
    const f = PACOTES[pais];
    p = f ? f().then(m => registrarEra(m.PACOTE)) : Promise.resolve();
    p = p.catch(e => { carregados.delete(pais); throw e; });
    carregados.set(pais, p);
  }
  return p;
}

/** Todos os países com época. Devolve os que faltaram. */
export async function carregarEras(): Promise<string[]> {
  const ids = Object.keys(PACOTES);
  const r = await Promise.allSettled(ids.map(carregarEra));
  return ids.filter((_, i) => r[i].status === 'rejected');
}
