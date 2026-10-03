/**
 * Os pacotes do mundo, sob demanda: um por região, cada um um arquivo à
 * parte no build (o mundo não engorda o motor). `carregarMundo` traz todos —
 * a interface o chama junto com o motor (e o service worker os guarda para
 * jogar sem internet); um teste ou uma simulação chama antes de viver fora
 * do Brasil. O Brasil já vem registrado.
 */

import { registrarPerfis } from './registro';
import type { PerfilDePais, RegiaoMundial } from './tipos';

type Pacote = () => Promise<{ PAISES: PerfilDePais[] }>;

const PACOTES: Partial<Record<RegiaoMundial, Pacote>> = {
  america_sul: () => import('./paises/america-sul'),
  america_norte: () => import('./paises/america-norte'),
  america_central_caribe: () => import('./paises/america-central-caribe'),
  europa: () => import('./paises/europa'),
  africa: () => import('./paises/africa'),
  asia: () => import('./paises/asia'),
  oceania: () => import('./paises/oceania')
};

const carregadas = new Map<RegiaoMundial, Promise<void>>();

/** Carrega o pacote de uma região (uma vez). */
export function carregarRegiao(r: RegiaoMundial): Promise<void> {
  let p = carregadas.get(r);
  if (!p) {
    const f = PACOTES[r];
    p = f ? f().then(m => registrarPerfis(m.PAISES)) : Promise.resolve();
    // Uma falha (sem rede, sem cache) não fica gravada: a próxima tentativa tenta de novo.
    p = p.catch(e => { carregadas.delete(r); throw e; });
    carregadas.set(r, p);
  }
  return p;
}

/** Carrega o mundo inteiro. Falhas de uma região não impedem as outras; devolve as que faltaram. */
export async function carregarMundo(): Promise<RegiaoMundial[]> {
  const regioes = Object.keys(PACOTES) as RegiaoMundial[];
  const r = await Promise.allSettled(regioes.map(carregarRegiao));
  return regioes.filter((_, i) => r[i].status === 'rejected');
}
