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
import { idadePessoa, vinculosVivos } from '../nucleo';
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
  for (const e of v.biografia.slice(desde)) if (TEXTO_QUEBRADO.test(e.texto)) out.push(`Texto quebrado na Linha da Vida: "${e.texto}"`);
  return out;
}
