/**
 * Leitura da TRAJETÓRIA educacional a partir de `EducationState`.
 *
 * `EducationState.cursosConcluidos` guarda `{ nome, tipo, anoConclusao }` —
 * texto livre, pensado para exibição. Para decidir habilitação profissional é
 * preciso voltar do nome do curso para a entrada do catálogo, e daí para a
 * área de formação.
 *
 * Este módulo é a única ponte entre as duas coisas, e é puro. Ele NÃO muda o
 * formato do save: casa por nome, exatamente como o motor já grava. Isso é o
 * que permite que saves antigos continuem válidos sem migração destrutiva —
 * um save de 2 anos atrás com "Medicina" em `cursosConcluidos` é lido aqui
 * como formação em `medicina`, sem precisar de nenhum campo novo.
 */

import type { EducationState } from '../../types';
import { CURSOS_DISPONIVEIS, type CourseOption } from '../../data/coursesData';
import {
  FORMACAO_QUE_HABILITA_LICENCA,
  nivelCursoAtingeMinimo,
  type AreaFormacao,
  type LicencaProfissional,
  type NivelCurso
} from '../../data/formacao/areasFormacao';

/** Uma formação que o personagem efetivamente concluiu. */
export interface FormacaoConcluida {
  cursoId: string;
  nome: string;
  area: AreaFormacao;
  nivel: NivelCurso;
  anoConclusao: number;
}

/** Índice nome → curso, construído uma vez. */
const CURSO_POR_NOME: ReadonlyMap<string, CourseOption> = new Map(
  CURSOS_DISPONIVEIS.map(c => [normalizar(c.nome), c])
);

function normalizar(nome: string): string {
  return nome
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Formações concluídas, resolvidas contra o catálogo.
 *
 * Entradas de educação básica ("Ensino Fundamental", "Ensino Médio") não
 * casam com nenhum curso e são simplesmente ignoradas — elas são escolaridade,
 * não formação, e já estão representadas em `nivelAtual`.
 *
 * Um curso que saia do catálogo também não casa. O efeito é conservador (a
 * formação deixa de habilitar), nunca destrutivo: o save continua carregando.
 */
export function listarFormacoesConcluidas(educacao: EducationState): FormacaoConcluida[] {
  const formacoes: FormacaoConcluida[] = [];
  for (const concluido of educacao.cursosConcluidos ?? []) {
    const curso = CURSO_POR_NOME.get(normalizar(concluido.nome));
    if (!curso) continue;
    formacoes.push({
      cursoId: curso.id,
      nome: curso.nome,
      area: curso.areaFormacao,
      nivel: curso.tipo,
      anoConclusao: concluido.anoConclusao
    });
  }
  return formacoes;
}

/** O personagem concluiu formação em alguma destas áreas, no nível mínimo? */
export function possuiFormacaoEm(
  educacao: EducationState,
  areas: readonly AreaFormacao[],
  nivelMinimo: NivelCurso = 'tecnico'
): boolean {
  return listarFormacoesConcluidas(educacao).some(
    f => areas.includes(f.area) && nivelCursoAtingeMinimo(f.nivel, nivelMinimo)
  );
}

/**
 * Licenças profissionais que o personagem detém.
 *
 * Derivadas da formação concluída — ver a nota sobre essa simplificação em
 * `data/formacao/areasFormacao.ts`. Quando o Exame da OAB e o registro em
 * conselho virarem Desafios de Vida, só esta função muda.
 */
export function licencasDoPersonagem(educacao: EducationState): Set<LicencaProfissional> {
  const licencas = new Set<LicencaProfissional>();
  for (const [licenca, regra] of Object.entries(FORMACAO_QUE_HABILITA_LICENCA)) {
    if (possuiFormacaoEm(educacao, regra.areas, regra.nivelMinimo)) {
      licencas.add(licenca as LicencaProfissional);
    }
  }
  return licencas;
}

export function possuiLicenca(
  educacao: EducationState,
  licenca: LicencaProfissional
): boolean {
  const regra = FORMACAO_QUE_HABILITA_LICENCA[licenca];
  return possuiFormacaoEm(educacao, regra.areas, regra.nivelMinimo);
}
