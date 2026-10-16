/**
 * Varredura de coerência: estados que a vida não pode ter.
 *
 * Cada regra aqui nasceu de um defeito real (playtest humano ou varredura
 * automática): negócio "de todo dia" sem o dono trabalhando nele, pergunta
 * pendente que nunca abriu, bandeira política sem valor, gato morrendo "de
 * velhice" aos quatro anos, faculdade presencial numa cidade onde a pessoa
 * não mora mais, texto com "undefined" na Linha da Vida. Os testes e os
 * simuladores rodam esta varredura a cada ano; o jogo não depende dela.
 */

import type { Vida } from '../tipos';
import { idade, idadePessoa, vinculosVivos } from '../nucleo';
import { anosDePratica } from './frentes';
import { tipoNegocio } from '../dados/negocios';
import { NOME_PRIORIDADE } from './politica';
import { infoPet } from './pets';
import { ocupacaoOuNula } from '../dados/ocupacoes';

const TEXTO_QUEBRADO = /undefined|NaN|\[object |null\b/;

/** Devolve as incoerências encontradas (vazio = coerente). `desde`: só olha a Linha da Vida a partir deste índice. */
export function verificarCoerencia(v: Vida, desde = 0): string[] {
  const out: string[] = [];
  const n = v.caminhos.negocio;
  if (n && n.estado !== 'fechado') {
    if ((n.dedicacao ?? 'integral') === 'integral' && !n.passivo && v.trabalho.atual?.ocupacaoId !== n.ocupacaoId)
      out.push(`${n.nome} é "o trabalho de todo dia", mas o trabalho atual é ${v.trabalho.atual?.ocupacaoId ?? 'nenhum'}.`);
    const t = tipoNegocio(n.tipo);
    if (t && n.estrategia && !t.estrategias.includes(n.estrategia)) out.push(`${n.nome} vende "${n.estrategia}", que não existe para ${t.nome}.`);
    if (n.socioId && !v.pessoas[n.socioId]) out.push(`${n.nome} tem um sócio que não existe.`);
  }
  const p = v.caminhos.pendente;
  if (p && !v.momento && p.perguntado) out.push('Uma escolha de trajetória ficou pendente depois de perguntada, sem pergunta aberta.');
  if (p && v.t - p.t >= 24) out.push('Uma escolha de trajetória está pendente há mais de dois anos.');
  const pol = v.caminhos.politica;
  if (pol?.prioridade !== undefined && !(pol.prioridade in NOME_PRIORIDADE)) out.push(`Bandeira política inválida: ${String(pol.prioridade)}.`);
  for (const { p: pet } of vinculosVivos(v).filter(x => x.p.especie)) {
    const info = infoPet(v, pet);
    if (idadePessoa(v, pet) > info.vidaMax + 3) out.push(`${pet.nome} (${pet.especie}) tem ${idadePessoa(v, pet)} anos, além do que a espécie vive.`);
  }
  const m = v.educacao.matricula;
  if (m && !m.trancado && m.modalidade === 'presencial' && m.municipioId !== v.moradia.municipioId && !v.caminhos.processo)
    out.push(`Matrícula presencial ativa em ${m.municipioId}, morando em ${v.moradia.municipioId}.`);
  const es = v.caminhos.esporte;
  if (es?.fase === 'profissional') {
    const oc = v.trabalho.atual && ocupacaoOuNula(v.trabalho.atual.ocupacaoId);
    if (!oc || oc.trilha !== 'atleta') out.push(`Atleta profissional ${es.clube ? `do ${es.clube} ` : ''}sem contrato de atleta.`);
  }
  if (!Number.isFinite(v.financas.conta)) out.push('Conta bancária não é um número.');
  out.push(...coerenciaTemporal(v));
  for (const e of v.biografia.slice(desde)) if (TEXTO_QUEBRADO.test(e.texto)) out.push(`Texto quebrado na Linha da Vida: "${e.texto}"`);
  return out;
}

/**
 * REWORK 5 — INVARIANTES DE TEMPO (o playtest viu 25 anos de futebol aos 17 e 3,7 bilhões de visualizações num post):
 * nenhuma duração cabe além da vida; nenhuma temporada se repete; nenhuma pena termina antes de começar; o preso não
 * tem emprego de carteira no regime fechado; a rede não passa do tamanho do mundo.
 */
export function coerenciaTemporal(v: Vida): string[] {
  const out: string[] = [];
  const i = idade(v);
  for (const [d, f] of Object.entries(v.caminhos.frentes)) {
    if (!f) continue;
    if (f.tInicio < v.eu.tNasc) out.push(`A prática de ${d} começou antes do nascimento.`);
    if (anosDePratica(v, f) > i) out.push(`${anosDePratica(v, f)} anos de prática de ${d} aos ${i}.`);
  }
  for (const [t, m] of Object.entries(v.trabalho.experiencia)) if (m > Math.max(0, i - 9) * 12 + 12) out.push(`${Math.floor(m / 12)} anos de experiência em ${t} aos ${i}.`);
  const es = v.caminhos.esporte;
  for (const c of [es, ...(v.caminhos.carreirasEsportivas ?? [])]) {
    if (!c) continue;
    if (c.tInicio < v.eu.tNasc + 48) out.push(`Carreira de ${c.modalidade} começou antes dos 4 anos.`);
    const anos = (c.temporadas ?? []).map(x => x.ano);
    if (new Set(anos).size !== anos.length) out.push(`Temporada repetida na carreira de ${c.modalidade}.`);
    const duracao = Math.floor(((c.tFim ?? v.t) - c.tInicio) / 12) + 1;
    if (anos.length > duracao + 1) out.push(`${anos.length} temporadas em ${duracao} anos de carreira de ${c.modalidade}.`);
  }
  const pr = v.justica?.prisao;
  if (pr) {
    if (pr.tFim < pr.tInicio) out.push('A pena termina antes de começar.');
    if (pr.regime === 'fechado' && v.trabalho.atual && v.trabalho.atual.contrato !== 'informal') out.push('Preso em regime fechado com emprego de carteira.');
  }
  if (v.justica?.prisao && v.justica.foragido) out.push('Preso e foragido ao mesmo tempo.');
  for (const c of Object.values(v.redes?.contas ?? {})) {
    if (!c) continue;
    if (c.seguidores > 1_000_000_000) out.push(`Conta com ${c.seguidores} seguidores.`);
    for (const p of c.publicacoes) if (p.alcance > 300_000_000) out.push(`Publicação com ${p.alcance} visualizações.`);
  }
  return out;
}
