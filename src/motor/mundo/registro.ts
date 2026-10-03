/**
 * O REGISTRO DO MUNDO: o catálogo (todo país) e os perfis (os países que
 * podem ser vividos).
 *
 * O Brasil vem registrado de saída (é o perfil do jogo desde o começo, e um
 * save antigo precisa dele sem esperar nada). Os outros perfis chegam em
 * pacotes por região (`carregar.ts`), carregados sob demanda — o mundo não
 * vira um pacote só, e um país novo não engorda o motor.
 */

import { CATALOGO } from './catalogo';
import type { LinhaDeCidade, PaisDoCatalogo, PerfilDePais, RegiaoMundial } from './tipos';
import { BRASIL } from './paises/br';

const PAISES = new Map<string, PaisDoCatalogo>(CATALOGO.map(([id, nome, artigo, regiao, sub, moeda, economia, populacao]) =>
  [id, { id, nome, artigo, regiao, sub, moeda, economia, populacao }]));

export const PAIS_PADRAO = 'BR';

export const ROTULO_REGIAO: Record<RegiaoMundial, string> = {
  america_sul: 'América do Sul', america_norte: 'América do Norte', america_central_caribe: 'América Central e Caribe',
  europa: 'Europa', africa: 'África', asia: 'Ásia', oceania: 'Oceania'
};
export const ORDEM_REGIOES: RegiaoMundial[] = ['america_sul', 'america_norte', 'america_central_caribe', 'europa', 'africa', 'asia', 'oceania'];

export const todosOsPaises = (): PaisDoCatalogo[] => [...PAISES.values()];
/** A posição do país no catálogo (estável: a lista da ONU, em ordem) — para guardar um país como número. */
export const indiceNoCatalogo = (id: string) => CATALOGO.findIndex(l => l[0] === id);
export const paisPeloIndice = (i: number): string | undefined => CATALOGO[i]?.[0];

/** Um país do catálogo (todo país da ONU). */
export function paisDoCatalogo(id: string): PaisDoCatalogo {
  const p = PAISES.get(id);
  if (!p) throw new Error(`País desconhecido: ${id}`);
  return p;
}
export const existePais = (id: string) => PAISES.has(id);

/* -------------------------------------------------------------- Perfis */

const PERFIS = new Map<string, PerfilDePais>([[BRASIL.id, BRASIL]]);
const ouvintes: ((p: PerfilDePais) => void)[] = [];

/** Registra perfis (um pacote de região que chegou). Idempotente. */
export function registrarPerfis(lista: PerfilDePais[]): void {
  for (const p of lista) {
    if (PERFIS.has(p.id)) continue;
    if (!PAISES.get(p.id)?.economia) throw new Error(`O perfil ${p.id} precisa de um país do catálogo com economia.`);
    PERFIS.set(p.id, p);
    for (const f of ouvintes) f(p);
  }
}
/** Quem precisa saber quando um país passa a existir (os lugares indexam as cidades dele). */
export const aoRegistrar = (f: (p: PerfilDePais) => void) => { ouvintes.push(f); for (const p of PERFIS.values()) f(p); };

/** O perfil de um país que pode ser vivido. */
export function perfilDoPais(id: string): PerfilDePais {
  const p = PERFIS.get(id);
  if (!p) throw new Error(`O país ${id} não pode ser vivido (perfil não carregado).`);
  return p;
}
export const temPerfil = (id: string) => PERFIS.has(id);
/** Os países que podem ser vividos agora (os pacotes carregados). */
export const paisesVivenciaveis = (): PaisDoCatalogo[] => [...PERFIS.keys()].map(paisDoCatalogo);

/* --------------------------------------------------------------- Texto */

const ART = { '': ['em ', 'de ', 'para ', ''], o: ['no ', 'do ', 'para o ', 'o '], a: ['na ', 'da ', 'para a ', 'a '], os: ['nos ', 'dos ', 'para os ', 'os '], as: ['nas ', 'das ', 'para as ', 'as '] } as const;
/** "no Brasil", "na Argentina", "em Portugal", "nos Estados Unidos". */
export const noPais = (id: string) => { const p = paisDoCatalogo(id); return ART[p.artigo][0] + p.nome; };
/** "do Brasil", "da Argentina", "de Portugal". */
export const doPais = (id: string) => { const p = paisDoCatalogo(id); return ART[p.artigo][1] + p.nome; };
/** "para o Brasil", "para a Argentina", "para Portugal". */
export const paraPais = (id: string) => { const p = paisDoCatalogo(id); return ART[p.artigo][2] + p.nome; };
/** "ao Brasil", "à Argentina", "a Portugal", "aos Estados Unidos" (voltar, ir). */
export const aoPais = (id: string) => { const p = paisDoCatalogo(id); return ({ '': 'a ', o: 'ao ', a: 'à ', os: 'aos ', as: 'às ' } as const)[p.artigo] + p.nome; };
/** "o Brasil", "a Argentina", "Portugal". */
export const oPais = (id: string) => { const p = paisDoCatalogo(id); return ART[p.artigo][3] + p.nome; };
export const nomeDoPais = (id: string) => paisDoCatalogo(id).nome;

/** "brasileiro"/"brasileira" (sem perfil: "de <país>"). */
export function gentilico(id: string, feminino = false): string {
  const p = PERFIS.get(id);
  return p ? p.gentilico[feminino ? 1 : 0] : doPais(id);
}

/** O país de um id de cidade estrangeira (`ar:cordoba`); as brasileiras não têm prefixo. */
export const paisDoId = (municipioId: string): string => {
  const i = municipioId.indexOf(':');
  return i > 0 ? municipioId.slice(0, i).toUpperCase() : PAIS_PADRAO;
};

export const slugCidade = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const idDaCidade = (pais: string, l: LinhaDeCidade | string) => `${pais.toLowerCase()}:${slugCidade(typeof l === 'string' ? l : l[0])}`;
