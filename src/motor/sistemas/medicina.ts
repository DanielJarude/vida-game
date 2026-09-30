/**
 * Medicina: da graduação ao especialista, com a especialidade como coisa da
 * PESSOA (`dados/especialidades`).
 *
 *   graduação + CRM → médico (plantão, UBS, o que houver) → prova de
 *   residência (a especialidade escolhida: duração e concorrência dela; um
 *   ano de estudo para a prova é o fator que se controla) → residência →
 *   título → vagas que pedem aquele título, faixa de renda da área, os
 *   convites que a área atrai e os casos do dia a dia com a cara dela.
 *
 * A chance da seleção, o que a tela diz e a causa de uma rejeição saem da
 * MESMA conta (`avaliacaoDaResidencia`).
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { Vida } from '../tipos';
import { escrever, idade } from '../nucleo';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';
import { modeloEspecialidade, LISTA_ESPECIALIDADES, type EspecialidadeMedica, type ModeloEspecialidade } from '../dados/especialidades';
import { ocupacao, ocupacaoOuNula, type Ocupacao } from '../dados/ocupacoes';

/* ----------------------------------------------------------------- Quem */

const residencias = (v: Vida) => v.educacao.concluidos.filter(x => x.nivel === 'residencia').sort((a, b) => b.tFim - a.tFim);

/** A especialidade da pessoa: a da residência mais recente (saves de antes da escolha: clínica médica). */
export function especialidadeMedica(v: Vida): EspecialidadeMedica | undefined {
  const r = residencias(v)[0];
  return r ? r.especialidade ?? 'clinica' : undefined;
}

/** Todas as especialidades tituladas (quem fez duas residências tem as duas). */
export function especialidadesMedicas(v: Vida): EspecialidadeMedica[] {
  return [...new Set(residencias(v).map(r => r.especialidade ?? 'clinica'))];
}

export const formadoEmMedicina = (v: Vida) => v.educacao.concluidos.some(x => x.nivel === 'superior' && x.area === 'medicina');

/** O fator de renda de uma vaga médica para esta pessoa (a especialidade muda a faixa, não o nome do cargo). */
export function fatorRendaMedica(v: Vida, oc: Ocupacao): number {
  if (oc.trilha !== 'medicina' || oc.nivelCurso !== 'residencia') return 1;
  const e = especialidadeMedica(v);
  if (!e) return 1;
  // A vaga que pede um título (a equipe cirúrgica, a saúde da família) já tem a faixa no cargo.
  if (oc.especialidades) return 1;
  return modeloEspecialidade(e).fatorRenda;
}

/** A vaga pede um título que a pessoa não tem? (o motivo, em palavras) */
export function faltaTituloPara(v: Vida, oc: Ocupacao): string | undefined {
  if (!oc.especialidades?.length) return undefined;
  const tem = especialidadesMedicas(v);
  if (oc.especialidades.some(e => tem.includes(e))) return undefined;
  return `Exige título de especialista: ${oc.especialidades.map(e => modeloEspecialidade(e).residencia.replace(/^Residência em /, '')).join(' ou ')} (residência).`;
}

/* ------------------------------------------------ A prova de residência */

/** Anos de estudo para a prova de residência (esfria depois de três anos sem estudar). */
export function preparoDaResidencia(v: Vida): number {
  const t = v.fatos['res_preparo_t'];
  if (t === undefined || v.t - t > 36) return 0;
  return Math.min(3, v.fatos['res_preparo'] ?? 0);
}

export type FatorResidencia = 'preparo' | 'historico' | 'concorrencia';

/**
 * A seleção de uma residência: o histórico da faculdade (não muda mais), o
 * estudo para a prova (o que se controla) e a disputa da especialidade.
 */
export function avaliacaoDaResidencia(v: Vida, esp: ModeloEspecialidade, desempenho: number): { chance: number; obstaculo: FatorResidencia; leitura: string } {
  const preparo = preparoDaResidencia(v);
  const hist = (desempenho - 60) / 100;
  const prep = preparo * 0.08;
  const chance = clamp(0.3 + hist + prep - esp.concorrencia, 0.06, 0.88);
  // O que mais falta, entre o que pesa: o preparo ainda pode render; o histórico não; a disputa é da área.
  const obstaculo: FatorResidencia = preparo < 2 ? 'preparo' : desempenho < 62 ? 'historico' : 'concorrencia';
  const disputa = esp.concorrencia >= 0.12 ? 'seleção muito disputada' : esp.concorrencia >= 0.07 ? 'seleção disputada' : 'sobram vagas em muitos programas';
  const leitura = `${disputa[0].toUpperCase()}${disputa.slice(1)}; ${preparo === 0 ? 'sem estudo dirigido para a prova ainda' : preparo === 1 ? 'um ano de estudo para a prova' : 'estudo firme para a prova'}.`;
  return { chance, obstaculo, leitura };
}

export const MOTIVO_RESIDENCIA: Record<FatorResidencia, string> = {
  preparo: 'a prova pediu mais do que um estudo de véspera — um ano de questões e simulados muda a nota',
  historico: 'o histórico da faculdade pesou na análise de currículo',
  concorrencia: 'a nota foi boa, mas eram poucas vagas para muita gente nessa especialidade'
};

export function disponibilidadePrepararResidencia(v: Vida): Veredito {
  if (!formadoEmMedicina(v)) return bloqueio('requisito', 'A prova de residência é para quem se formou em Medicina.');
  if (especialidadesMedicas(v).length >= LISTA_ESPECIALIDADES.length) return bloqueio('incompativel', 'Não há outra residência a fazer.');
  const m = v.educacao.matricula;
  if (m && !m.trancado && m.cursoId === 'residencia') return bloqueio('incompativel', 'Você já está na residência.');
  if (preparoDaResidencia(v) >= 3) return bloqueio('incompativel', 'O estudo está no ponto: agora, é a prova.');
  const t = v.fatos['res_preparo_t'];
  if (t !== undefined && v.t - t < 12) return bloqueio('incompativel', 'O estudo deste ano já está em andamento.');
  return PERMITIDO;
}

/** Um ano de estudo para a prova de residência: o fator controlável que a própria avaliação aponta. Pede semana e cabeça. */
export function prepararResidencia(v: Vida, r: Rng): { texto: string; tom: 'neutro' } {
  v.fatos['res_preparo'] = preparoDaResidencia(v) + 1;
  v.fatos['res_preparo_t'] = v.t;
  v.mente.estresse = clamp(v.mente.estresse + 4);
  v.mente.cognicao = clamp(v.mente.cognicao + (r.chance(0.5) ? 1 : 0));
  const n = v.fatos['res_preparo'];
  const texto = n === 1 ? 'Um ano de questões de prova de residência entre um plantão e outro: as áreas fracas apareceram logo.'
    : n === 2 ? 'Mais um ano de estudo para a residência: simulados toda semana, a nota subindo devagar.'
      : 'O estudo para a residência chegou no ponto: nos simulados, você já passa.';
  escrever(v, { texto, relevancia: 'cotidiano', tema: 'estudo', escolha: true });
  return { texto, tom: 'neutro' };
}

/* ------------------------------------------------------- Os convites */

/** O convite que a especialidade atrai (para quem é especialista e não está já numa vaga daquele tipo). */
export function conviteDaEspecialidade(v: Vida): { oc: Ocupacao; titulo: string; texto: string } | undefined {
  const e = especialidadeMedica(v);
  if (!e || idade(v) > 65) return undefined;
  const m = modeloEspecialidade(e);
  const oc = ocupacaoOuNula(m.convite.ocupacaoId);
  if (!oc || v.trabalho.atual?.ocupacaoId === oc.id || v.trabalho.paralela?.ocupacaoId === oc.id) return undefined;
  return { oc, titulo: m.convite.titulo, texto: m.convite.texto };
}

/** O nome da área para o emprego médico (vai para `Emprego.especialidade`, que a tela e os casos leem). */
export function areaMedica(v: Vida, oc: Ocupacao): string | undefined {
  if (oc.trilha !== 'medicina') return undefined;
  const e = oc.especialidades?.[0] ?? especialidadeMedica(v);
  return e ? modeloEspecialidade(e).area : undefined;
}

export { ocupacao };
