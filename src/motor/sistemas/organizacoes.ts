/**
 * Organizações (REWORK 4): o mercado de trabalho existe sem o jogador.
 *
 * Cada cidade tem, em cada setor, algumas organizações (de 3 a 6, pelo porte
 * da cidade) — sempre as mesmas para aquele lugar: o nome sai do lugar e do
 * setor, não da vida. As vagas são DELAS (`vagaDaOrganizacao`); quem é
 * contratado trabalha NELA (`Emprego.orgId`), e a história lembra: "empresa A
 * → empresa B → volta à empresa A anos depois" é currículo, não acaso.
 * Não é simulador corporativo: nome, setor, cidade e porte.
 */

import type { Organizacao, Vida } from '../tipos';
import { rngDe } from '../rng';
import { municipio, nivelDeOferta, paisDaCidade } from '../dados/lugares';
import { sortearSobrenome } from '../dados/nomes';
import { FORMATOS, RAIZES } from '../dados/organizacoes';

const NAO_TEM = new Set(['publico']);

/** As organizações de um setor numa cidade (estáveis para o lugar). */
export function organizacoesDe(municipioId: string, setor: string): Organizacao[] {
  const formatos = FORMATOS[setor];
  if (!formatos || NAO_TEM.has(setor)) return [];
  const n = 3 + nivelDeOferta(municipioId);
  const pais = paisDaCidade(municipioId);
  const cidade = municipio(municipioId).nome;
  const out: Organizacao[] = [];
  const usados = new Set<string>();
  for (let k = 0; k < n + 3 && out.length < n; k++) {
    const r = rngDe('org', municipioId, setor, k);
    const nome = r.pick(formatos).replace('{R}', r.pick(RAIZES)).replace('{S2}', sortearSobrenome(r, pais).split(' ')[0]).replace('{S}', sortearSobrenome(r, pais).split(' ')[0]).replace('{C}', cidade);
    if (usados.has(nome)) continue;
    usados.add(nome);
    out.push({ id: `${municipioId}|${setor}|${k}`, nome, setor, municipioId, porte: r.weighted(['pequena', 'media', 'grande'] as const, p => (p === 'grande' ? 0.5 + nivelDeOferta(municipioId) * 0.5 : p === 'media' ? 2 : 2.5)) ?? 'media' });
  }
  return out;
}

/** A organização que oferece esta vaga, neste ano (o mercado muda de ano para ano). */
export function vagaDaOrganizacao(municipioId: string, setor: string, ocupacaoId: string, ano: number): Organizacao | undefined {
  const orgs = organizacoesDe(municipioId, setor);
  if (!orgs.length) return undefined;
  return orgs[Math.floor(rngDe('vaga', municipioId, ocupacaoId, ano).next() * orgs.length)];
}

/** Lembra a organização na vida (o nome fica, mesmo que um dia o gerador mude). */
export function guardarOrganizacao(v: Vida, o: Organizacao): void {
  (v.organizacoes ??= {})[o.id] = o;
}

export const organizacao = (v: Vida, id?: string): Organizacao | undefined => (id ? v.organizacoes?.[id] : undefined);

const MASCULINOS = /^(Colégio|Escritório|Hospital|Centro|Instituto|Mercado|Restaurante|Bistrô|Jornal|Estúdio|Ateliê|Espaço|Studio|Lar|Clube|Banco)\b/;
/** "a Nexa Sistemas", "o Colégio Âmbar" — o empregador vai para as frases com artigo (como "uma empresa de software"). */
export const comArtigo = (nome: string) => `${MASCULINOS.test(nome) ? 'o' : 'a'} ${nome}`;
/** "na Nexa Sistemas", "no Colégio Âmbar". */
export const naOrganizacao = (nome: string) => `${MASCULINOS.test(nome) ? 'no' : 'na'} ${nome}`;
