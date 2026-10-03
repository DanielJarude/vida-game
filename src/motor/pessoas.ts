/**
 * Criação de pessoas e vínculos.
 *
 * Toda pessoa que aparece na vida do jogador passa por aqui: tem nome coerente
 * com a geração, temperamento, lugar onde mora e — quando entra na vida — um
 * vínculo com origem. Ninguém surge "pronto": um vínculo novo começa com a
 * proximidade de quem acabou de se conhecer, salvo família.
 */

import type { Rng } from './rng';
import type { Convivio, Especie, Genero, Parentesco, Pessoa, Vida, Vinculo, Visual } from './tipos';
import { novoId, temperamentoAleatorio } from './nucleo';
import { sortearNome, sortearSobrenome } from './dados/nomes';
import { anoDe } from './tempo';
import { cidadesDoPais, municipio } from './dados/lugares';
import { rngDe } from './rng';
import { ancestralidadeDe, chanceDoNomeDaTradicao, identidadeInicial, misturar, rngDosTracos, visualDaAncestralidade, visualDosPais, type Ancestralidade } from './sistemas/identidade';

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
  // REWORK 4: os traços modulares (textura, olhos, nariz, boca, rosto, sobrancelha), de um gerador semeado pelos
  // traços já sorteados — a sequência do gerador da vida fica a mesma.
  const base: Visual = { pele, cabelo, corCabelo, olhos, barba };
  return comTracos(base, genero);
}

/** Os traços modulares de quem não tem ancestralidade conhecida: coerentes com o tom de pele e o cabelo. */
function comTracos(base: Visual, genero: Genero): Visual {
  const anc = ancestralidadeDe({ visual: base });
  const t = visualDaAncestralidade(rngDosTracos(base, 'tracos'), genero, anc);
  const textura = /crespo|black|trancas/.test(base.cabelo) ? 'crespo' : /cacheado/.test(base.cabelo) ? 'cacheado' : /ondulado/.test(base.cabelo) ? 'ondulado' : t.textura;
  return { ...base, textura, olhosForma: t.olhosForma, nariz: t.nariz, boca: t.boca, rosto: t.rosto, sobrancelha: t.sobrancelha };
}

/**
 * Filho puxa pai ou mãe em cada traço (REWORK 4: todos os traços modulares, a textura que tende ao meio, a cor
 * NATURAL do cabelo — tinta não passa —, às vezes um traço de mais longe). Os sorteios do gerador da vida são os
 * mesmos de antes; a herança sai de um gerador semeado por eles.
 */
export function visualHerdado(r: Rng, genero: Genero, a?: Visual, b?: Visual, anc?: Ancestralidade, naturais: [string?, string?] = []): Visual {
  const base = visualAleatorio(r, genero);
  if (!a && !b) return base;
  const j = r.next(); const c1 = r.chance(0.5); const c2 = r.chance(0.5);
  const anc2 = anc ?? misturar(a ? ancestralidadeDe({ visual: a }) : undefined, b ? ancestralidadeDe({ visual: b }) : undefined)!;
  const v = visualDosPais(rngDosTracos(base, j, String(c1), String(c2), a?.pele, b?.pele, a?.olhos, b?.olhos), genero, anc2, a, b, naturais);
  if (genero === 'masculino') v.barba = base.barba;
  return v;
}

export interface NovaPessoa {
  genero?: Genero;
  idade: number;
  sobrenome?: string;
  municipioId: string;
  ocupacao?: string;
  renda?: number;
  especie?: Especie;
  nome?: string;
  visual?: Visual;
  /** De que país a pessoa é, quando não é o da cidade onde mora (o nome vem de lá). */
  paisDeOrigem?: string;
  /** REWORK 4: a família de onde a pessoa vem (a ancestralidade e a tradição de nomes), quando já se sabe. */
  familia?: { ancestralidade?: Ancestralidade; tradicao?: string };
}

export function criarPessoa(v: Vida, r: Rng, n: NovaPessoa): Pessoa {
  const genero = n.genero ?? (r.chance(0.5) ? 'masculino' : 'feminino');
  const tNasc = v.t - n.idade * 12 - r.int(0, 11);
  // Duas pessoas importantes com o mesmo nome confundem a história: um
  // nome novo nunca repete o de alguém vivo e relevante na vida.
  const ocupados = new Set([v.eu.nome, ...Object.values(v.vinculos)
    .filter(x => v.pessoas[x.pessoaId]?.vivo)
    .flatMap(x => {
      const p = v.pessoas[x.pessoaId];
      // O parceiro de alguém da família também está na história (futuro genro, nora).
      const par = p.parceiroId ? v.pessoas[p.parceiroId] : undefined;
      return par?.vivo ? [p.nome, par.nome] : [p.nome];
    })]);
  // O nome é do lugar de onde a pessoa vem (a cidade dela, ou o país de origem quando é de fora).
  const lugar = municipio(n.municipioId);
  const pais = n.paisDeOrigem ?? lugar.pais;
  const div = pais === lugar.pais ? lugar.uf : undefined;
  let nome = n.nome ?? sortearNome(r, genero, anoDe(tNasc), pais, div, n.sobrenome);
  for (let k = 0; k < 14 && !n.nome && ocupados.has(nome); k++) nome = sortearNome(r, genero, anoDe(tNasc), pais, div, n.sobrenome);
  const p: Pessoa = {
    id: novoId(v, 'p'),
    nome,
    sobrenome: n.sobrenome ?? sortearSobrenome(r, pais, div),
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
  // De outro país que o da cidade onde mora: a nacionalidade fica escrita (o resto, sem o campo, é a do lugar).
  if (n.paisDeOrigem && n.paisDeOrigem !== lugar.pais) p.nacionalidades = [n.paisDeOrigem];
  if (!n.especie) aplicarIdentidade(p, n, pais, anoDe(tNasc), ocupados);
  v.pessoas[p.id] = p;
  return p;
}

/**
 * REWORK 4: quem a pessoa é por FAMÍLIA. Sem família conhecida, o contexto do lugar dá uma origem (às vezes de
 * fora: a família japonesa de São Paulo, a mexicana de Los Angeles — com o sobrenome de lá e, às vezes, o prenome);
 * com família, ela vem dos pais. Tudo por sorteio derivado (o gerador da vida não muda).
 */
function aplicarIdentidade(p: Pessoa, n: NovaPessoa, pais: string, ano: number, ocupados: Set<string>): void {
  const r = rngDe(p.id, 'nome_da_familia');
  let primeiraGeracao = false;
  if (n.familia) {
    p.ancestralidade = n.familia.ancestralidade ?? (n.visual ? ancestralidadeDe({ visual: n.visual }) : undefined);
    p.tradicao = n.familia.tradicao;
    if (!n.visual && p.ancestralidade) p.visual = visualDaAncestralidade(rngDe(p.id, 'identidade'), p.genero, p.ancestralidade, p.visual);
  } else if (n.visual) {
    p.ancestralidade = ancestralidadeDe({ visual: n.visual });
  } else {
    const id = identidadeInicial(p.id, pais, p.genero, p.visual!);
    p.ancestralidade = id.ancestralidade;
    p.tradicao = id.tradicao && id.tradicao !== pais ? id.tradicao : undefined;
    p.visual = id.visual;
    // Parte de quem é de família de fora nasceu lá (a primeira geração): a cidade natal e a nacionalidade de lá.
    if (p.tradicao && !n.paisDeOrigem && r.chance(ano < 1990 ? 0.45 : 0.3) && cidadesDoPais(p.tradicao).length) {
      primeiraGeracao = true;
      p.municipioNatal = r.pick(cidadesDoPais(p.tradicao)).id;
      p.nacionalidades = r.chance(0.5) ? [p.tradicao, pais] : [p.tradicao];
    }
  }
  // O nome vem da família: o sobrenome de quem é de fora é o de lá; o prenome, às vezes (mais nos mais velhos).
  if (p.tradicao && p.tradicao !== pais) {
    if (!n.sobrenome) p.sobrenome = sortearSobrenome(r, p.tradicao);
    // (Nunca o nome de alguém vivo e relevante na vida: duas pessoas com o mesmo nome confundem a história.)
    if (!n.nome && r.chance(chanceDoNomeDaTradicao(ano, primeiraGeracao))) {
      const outro = sortearNome(r, p.genero, ano, p.tradicao, undefined, p.sobrenome);
      if (!ocupados.has(outro)) p.nome = outro;
    }
  }
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
