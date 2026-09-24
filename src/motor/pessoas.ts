/**
 * Criação de pessoas e vínculos.
 *
 * Toda pessoa que aparece na vida do jogador passa por aqui: tem nome coerente
 * com a geração, temperamento, lugar onde mora e — quando entra na vida — um
 * vínculo com origem. Ninguém surge "pronto": um vínculo novo começa com a
 * proximidade de quem acabou de se conhecer, salvo família.
 */

import type { Rng } from './rng';
import type { Convivio, Genero, Parentesco, Pessoa, Vida, Vinculo, Visual } from './tipos';
import { novoId, temperamentoAleatorio } from './nucleo';
import { sortearNome, sortearSobrenome } from './dados/nomes';
import { anoDe } from './tempo';

export const PELES = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
export const CORES_CABELO = ['preto', 'castanho_escuro', 'castanho', 'castanho_claro', 'loiro', 'ruivo'];
export const CORES_OLHOS = ['castanho_escuro', 'castanho', 'mel', 'verde', 'azul'];
export const CABELOS_M = ['raspado', 'curto', 'curto_lado', 'ondulado', 'crespo_curto', 'cacheado'];
export const CABELOS_F = ['longo_liso', 'longo_ondulado', 'cacheado_longo', 'black', 'chanel', 'coque', 'trancas', 'rabo'];
export const CABELOS_N = ['curto', 'ondulado', 'chanel', 'cacheado', 'black', 'rabo'];

export function visualAleatorio(r: Rng, genero: Genero): Visual {
  const pele = r.weighted(PELES, p => ({ p1: 2, p2: 3, p3: 3, p4: 3, p5: 2, p6: 1.5 } as Record<string, number>)[p]) ?? 'p3';
  const escura = ['p4', 'p5', 'p6'].includes(pele);
  const corCabelo = escura
    ? r.weighted(CORES_CABELO, c => ({ preto: 6, castanho_escuro: 3, castanho: 1, castanho_claro: 0.2, loiro: 0.1, ruivo: 0.05 } as Record<string, number>)[c])!
    : r.weighted(CORES_CABELO, c => ({ preto: 2, castanho_escuro: 3, castanho: 3, castanho_claro: 2, loiro: 1.2, ruivo: 0.4 } as Record<string, number>)[c])!;
  const olhos = escura
    ? r.weighted(CORES_OLHOS, c => ({ castanho_escuro: 6, castanho: 3, mel: 1, verde: 0.1, azul: 0.05 } as Record<string, number>)[c])!
    : r.weighted(CORES_OLHOS, c => ({ castanho_escuro: 2, castanho: 4, mel: 2, verde: 1, azul: 0.8 } as Record<string, number>)[c])!;
  const cabelos = genero === 'masculino' ? CABELOS_M : genero === 'feminino' ? CABELOS_F : CABELOS_N;
  let cabelo = r.pick(cabelos);
  if (escura && r.chance(0.45)) cabelo = genero === 'masculino' ? 'crespo_curto' : r.pick(['black', 'trancas', 'cacheado_longo']);
  const barba = genero === 'masculino' && r.chance(0.35) ? r.pick(['bigode', 'cavanhaque', 'curta', 'cheia']) : undefined;
  return { pele, cabelo, corCabelo, olhos, barba };
}

/** Filho puxa pai ou mãe em cada traço, com alguma mistura na pele. */
export function visualHerdado(r: Rng, genero: Genero, a?: Visual, b?: Visual): Visual {
  const base = visualAleatorio(r, genero);
  if (!a && !b) return base;
  const x = a ?? b!;
  const y = b ?? a!;
  const i1 = PELES.indexOf(x.pele);
  const i2 = PELES.indexOf(y.pele);
  const peleIdx = Math.round((i1 + i2) / 2 + (r.next() - 0.5));
  return {
    pele: PELES[Math.max(0, Math.min(PELES.length - 1, peleIdx))],
    corCabelo: r.chance(0.5) ? x.corCabelo : y.corCabelo,
    olhos: r.chance(0.5) ? x.olhos : y.olhos,
    cabelo: base.cabelo,
    barba: base.barba
  };
}

export interface NovaPessoa {
  genero?: Genero;
  idade: number;
  sobrenome?: string;
  municipioId: string;
  ocupacao?: string;
  renda?: number;
  especie?: 'cachorro' | 'gato';
  nome?: string;
  visual?: Visual;
}

export function criarPessoa(v: Vida, r: Rng, n: NovaPessoa): Pessoa {
  const genero = n.genero ?? (r.chance(0.5) ? 'masculino' : 'feminino');
  const tNasc = v.t - n.idade * 12 - r.int(0, 11);
  // Duas pessoas importantes com o mesmo nome confundem a história: um
  // nome novo nunca repete o de alguém vivo e relevante na vida.
  const ocupados = new Set([v.eu.nome, ...Object.values(v.vinculos)
    .filter(x => v.pessoas[x.pessoaId]?.vivo && (x.parentesco || x.romance || x.estagio === 'amigo' || x.estagio === 'amigo_proximo' || x.convivio.length > 0 || x.proximidade >= 25))
    .map(x => v.pessoas[x.pessoaId].nome)]);
  let nome = n.nome ?? sortearNome(r, genero, anoDe(tNasc));
  for (let k = 0; k < 14 && !n.nome && ocupados.has(nome); k++) nome = sortearNome(r, genero, anoDe(tNasc));
  const p: Pessoa = {
    id: novoId(v, 'p'),
    nome,
    sobrenome: n.sobrenome ?? sortearSobrenome(r),
    genero,
    tNasc,
    vivo: true,
    temperamento: temperamentoAleatorio(r),
    ocupacao: n.ocupacao,
    renda: n.renda ?? 0,
    municipioId: n.municipioId,
    saude: Math.max(20, Math.min(100, Math.round(95 - Math.max(0, n.idade - 40) * 0.8 + r.normal() * 8))),
    especie: n.especie,
    visual: n.especie ? undefined : n.visual ?? visualAleatorio(r, genero)
  };
  if (!n.especie && n.idade >= 14) {
    // Orientação dos NPCs: maioria heterossexual, minoria real e presente.
    const x = r.next();
    const oposto = genero === 'masculino' ? 'mulheres' : genero === 'feminino' ? 'homens' : 'ambos';
    const mesmo = genero === 'masculino' ? 'homens' : genero === 'feminino' ? 'mulheres' : 'ambos';
    p.atracao = x < 0.86 ? oposto : x < 0.93 ? mesmo : 'ambos';
    p.querFilhos = r.weighted(['sim', 'talvez', 'nao'] as const, q => ({ sim: 5, talvez: 3, nao: 2 })[q]);
  }
  v.pessoas[p.id] = p;
  return p;
}

export interface NovoVinculo {
  parentesco?: Parentesco;
  origem: Vinculo['origem'];
  proximidade: number;
  /** Confiança inicial. Ausente: família começa confiando; quem acabou de chegar, não. */
  confianca?: number;
  convivio?: Convivio[];
  estagio?: Vinculo['estagio'];
}

export function vincular(v: Vida, p: Pessoa, n: NovoVinculo): Vinculo {
  const vin: Vinculo = {
    pessoaId: p.id,
    parentesco: n.parentesco,
    origem: n.origem,
    tInicio: v.t,
    proximidade: n.proximidade,
    confianca: n.confianca ?? (n.parentesco ? Math.round(45 + n.proximidade * 0.4) : Math.round(20 + n.proximidade * 0.3)),
    tensao: 0,
    estagio: n.parentesco ? undefined : n.estagio ?? 'conhecido',
    convivio: n.convivio ?? [],
    tUltimoContato: v.t,
    historia: []
  };
  v.vinculos[p.id] = vin;
  return vin;
}

export const ehHumano = (p: Pessoa) => !p.especie;
