/**
 * REWORK 10.5 · EDU-05 — O HISTÓRICO ACADÊMICO.
 *
 * O boletim da escola era a fotografia do ano corrente (`EscolaBasica.notas`) e a memória dele, as últimas oito
 * fotografias do ano (`evolucao`). Ao terminar o médio, `basica` sumia — e o boletim com ela (o último ano nem chegava a
 * ser fotografado: a escola fecha antes da fotografia). Na faculdade não havia disciplina, nota, crédito nem reprovação
 * contada: só um número de 0 a 100.
 *
 * Agora cada ano letivo FECHADO vira um registro permanente (`Educacao.historicoAcademico`): onde, qual série ou qual
 * ano do curso, as disciplinas com a nota (0..10; a tela converte para a escala do país), a média, os créditos (no
 * ensino superior e técnico) e a situação — aprovado, reprovado, concluído, trancado, abandonado. Fica depois da
 * formatura e do abandono, e sobrevive ao save.
 *
 * A nota NÃO é a inteligência nem o conhecimento: parte do desempenho do ano (`calcularDesempenho`) e se desloca pela
 * matéria em que a disciplina se apoia (a forte acima, a fraca abaixo). O acaso de cada disciplina vem de um gerador
 * derivado — a sequência da vida não muda.
 */

import { clamp, rngDe } from '../rng';
import type { RegistroAcademico, Vida } from '../tipos';

/** Até quantos anos letivos ficam guardados (a escola inteira, a graduação e uma pós cabem). */
export const LIMITE_DO_HISTORICO = 40;
/** Créditos de uma disciplina semestral típica (a tela diz "créditos"; a régua é a mesma em todo país). */
const CREDITOS = 4;

type MateriaBase = 'exatas' | 'linguagens' | 'ciencias' | 'humanas';

/**
 * As disciplinas de cada área, do começo ao fim do curso (a ordem importa: o primeiro ano cursa as primeiras). Cada uma
 * se apoia numa matéria da escola (a que pesa na nota). Nomes genéricos de grade curricular — nenhum é de uma
 * instituição real.
 */
const GRADE: Record<string, [string, MateriaBase][]> = {
  medicina: [['Anatomia', 'ciencias'], ['Bioquímica', 'ciencias'], ['Fisiologia', 'ciencias'], ['Histologia', 'ciencias'], ['Saúde coletiva', 'humanas'], ['Farmacologia', 'ciencias'], ['Patologia', 'ciencias'], ['Semiologia', 'linguagens'], ['Clínica médica', 'ciencias'], ['Cirurgia', 'ciencias'], ['Pediatria', 'ciencias'], ['Ginecologia e obstetrícia', 'ciencias'], ['Internato', 'ciencias']],
  enfermagem: [['Anatomia', 'ciencias'], ['Fisiologia', 'ciencias'], ['Fundamentos de enfermagem', 'ciencias'], ['Microbiologia', 'ciencias'], ['Saúde coletiva', 'humanas'], ['Farmacologia', 'ciencias'], ['Enfermagem clínica', 'ciencias'], ['Saúde da mulher', 'ciencias'], ['Gestão em saúde', 'humanas'], ['Estágio supervisionado', 'ciencias']],
  psicologia: [['Psicologia do desenvolvimento', 'humanas'], ['Neurociências', 'ciencias'], ['Estatística aplicada', 'exatas'], ['Teorias da personalidade', 'humanas'], ['Psicopatologia', 'ciencias'], ['Psicologia social', 'humanas'], ['Avaliação psicológica', 'exatas'], ['Psicoterapias', 'linguagens'], ['Estágio clínico', 'humanas']],
  direito: [['Teoria do Estado', 'humanas'], ['Introdução ao Direito', 'humanas'], ['Direito Constitucional', 'humanas'], ['Direito Civil', 'linguagens'], ['Direito Penal', 'humanas'], ['Processo Civil', 'linguagens'], ['Direito do Trabalho', 'humanas'], ['Direito Administrativo', 'humanas'], ['Direito Empresarial', 'exatas'], ['Processo Penal', 'linguagens'], ['Prática jurídica', 'linguagens'], ['Trabalho de conclusão', 'linguagens']],
  engenharia: [['Cálculo I', 'exatas'], ['Física I', 'exatas'], ['Álgebra linear', 'exatas'], ['Cálculo II', 'exatas'], ['Química geral', 'ciencias'], ['Física II', 'exatas'], ['Resistência dos materiais', 'exatas'], ['Estatística', 'exatas'], ['Fenômenos de transporte', 'exatas'], ['Gestão de projetos', 'humanas'], ['Projeto final', 'exatas']],
  engenharia_civil: [['Cálculo I', 'exatas'], ['Física I', 'exatas'], ['Desenho técnico', 'exatas'], ['Cálculo II', 'exatas'], ['Mecânica dos solos', 'ciencias'], ['Resistência dos materiais', 'exatas'], ['Hidráulica', 'exatas'], ['Estruturas de concreto', 'exatas'], ['Construção civil', 'exatas'], ['Projeto final', 'exatas']],
  arquitetura: [['Desenho arquitetônico', 'exatas'], ['História da arquitetura', 'humanas'], ['Plástica', 'linguagens'], ['Projeto I', 'exatas'], ['Estruturas', 'exatas'], ['Urbanismo', 'humanas'], ['Conforto ambiental', 'ciencias'], ['Projeto II', 'exatas'], ['Paisagismo', 'ciencias'], ['Trabalho final de graduação', 'linguagens']],
  computacao: [['Algoritmos', 'exatas'], ['Cálculo I', 'exatas'], ['Matemática discreta', 'exatas'], ['Estruturas de dados', 'exatas'], ['Arquitetura de computadores', 'exatas'], ['Banco de dados', 'exatas'], ['Engenharia de software', 'linguagens'], ['Redes de computadores', 'exatas'], ['Sistemas operacionais', 'exatas'], ['Projeto de conclusão', 'linguagens']],
  exatas: [['Cálculo I', 'exatas'], ['Geometria analítica', 'exatas'], ['Álgebra linear', 'exatas'], ['Probabilidade', 'exatas'], ['Análise real', 'exatas'], ['Inferência estatística', 'exatas'], ['Cálculo numérico', 'exatas'], ['Modelos lineares', 'exatas'], ['Monografia', 'linguagens']],
  administracao: [['Teoria geral da administração', 'humanas'], ['Matemática financeira', 'exatas'], ['Contabilidade geral', 'exatas'], ['Economia', 'exatas'], ['Marketing', 'linguagens'], ['Gestão de pessoas', 'humanas'], ['Finanças corporativas', 'exatas'], ['Logística', 'exatas'], ['Estratégia', 'humanas'], ['Trabalho de conclusão', 'linguagens']],
  contabilidade: [['Contabilidade introdutória', 'exatas'], ['Matemática financeira', 'exatas'], ['Direito tributário', 'humanas'], ['Contabilidade de custos', 'exatas'], ['Auditoria', 'exatas'], ['Análise de balanços', 'exatas'], ['Perícia contábil', 'linguagens'], ['Contabilidade pública', 'humanas'], ['Trabalho de conclusão', 'linguagens']],
  economia: [['Introdução à economia', 'humanas'], ['Cálculo I', 'exatas'], ['Microeconomia I', 'exatas'], ['Macroeconomia I', 'exatas'], ['Estatística econômica', 'exatas'], ['Econometria', 'exatas'], ['História econômica', 'humanas'], ['Economia internacional', 'humanas'], ['Monografia', 'linguagens']],
  educacao: [['Fundamentos da educação', 'humanas'], ['Psicologia da educação', 'humanas'], ['Didática', 'linguagens'], ['Alfabetização e letramento', 'linguagens'], ['Políticas educacionais', 'humanas'], ['Metodologia do ensino', 'linguagens'], ['Educação inclusiva', 'humanas'], ['Estágio supervisionado', 'linguagens'], ['Trabalho de conclusão', 'linguagens']],
  letras: [['Linguística I', 'linguagens'], ['Teoria literária', 'linguagens'], ['Língua portuguesa I', 'linguagens'], ['Literatura brasileira', 'linguagens'], ['Fonética e fonologia', 'linguagens'], ['Língua estrangeira', 'linguagens'], ['Literaturas de língua portuguesa', 'linguagens'], ['Tradução', 'linguagens'], ['Monografia', 'linguagens']],
  comunicacao: [['Teorias da comunicação', 'humanas'], ['Redação', 'linguagens'], ['Fotografia', 'linguagens'], ['Ética e legislação', 'humanas'], ['Produção audiovisual', 'linguagens'], ['Pesquisa de opinião', 'exatas'], ['Planejamento de comunicação', 'humanas'], ['Projeto experimental', 'linguagens']],
  design: [['Desenho de observação', 'linguagens'], ['História do design', 'humanas'], ['Tipografia', 'linguagens'], ['Ergonomia', 'ciencias'], ['Design de interfaces', 'exatas'], ['Projeto de produto', 'exatas'], ['Gestão do design', 'humanas'], ['Projeto final', 'linguagens']],
  musica_formacao: [['Percepção musical', 'linguagens'], ['Harmonia', 'exatas'], ['História da música', 'humanas'], ['Instrumento I', 'linguagens'], ['Contraponto', 'exatas'], ['Prática de conjunto', 'linguagens'], ['Instrumento II', 'linguagens'], ['Recital de formatura', 'linguagens']],
  artes_cenicas: [['Interpretação I', 'linguagens'], ['História do teatro', 'humanas'], ['Expressão corporal', 'ciencias'], ['Voz e dicção', 'linguagens'], ['Dramaturgia', 'linguagens'], ['Interpretação II', 'linguagens'], ['Encenação', 'linguagens'], ['Montagem de formatura', 'linguagens']],
  educacao_fisica: [['Anatomia', 'ciencias'], ['Fisiologia do exercício', 'ciencias'], ['Cinesiologia', 'ciencias'], ['Esportes coletivos', 'ciencias'], ['Biomecânica', 'exatas'], ['Treinamento esportivo', 'ciencias'], ['Educação física escolar', 'humanas'], ['Estágio supervisionado', 'humanas']],
  nutricao: [['Bioquímica', 'ciencias'], ['Anatomia', 'ciencias'], ['Nutrição humana', 'ciencias'], ['Técnica dietética', 'ciencias'], ['Avaliação nutricional', 'exatas'], ['Dietoterapia', 'ciencias'], ['Saúde pública', 'humanas'], ['Estágio supervisionado', 'ciencias']],
  agro: [['Botânica', 'ciencias'], ['Química agrícola', 'ciencias'], ['Solos', 'ciencias'], ['Fitotecnia', 'ciencias'], ['Zootecnia', 'ciencias'], ['Máquinas agrícolas', 'exatas'], ['Economia rural', 'humanas'], ['Estágio de campo', 'ciencias']]
};
for (const [area, mesma] of [['fisioterapia', 'enfermagem'], ['odontologia', 'medicina'], ['farmacia', 'nutricao'], ['veterinaria', 'medicina'], ['radiologia', 'enfermagem'], ['eletrotecnica', 'engenharia'], ['eletrica', 'engenharia'], ['mecanica', 'engenharia'], ['automacao', 'engenharia'], ['edificacoes', 'engenharia_civil'], ['logistica', 'administracao'], ['imoveis', 'administracao'], ['seguranca_trabalho', 'engenharia']] as const) GRADE[area] ??= GRADE[mesma];
/** As áreas sem grade própria (cursos livres, técnicos de ofício): disciplinas de formação geral. */
const GERAL: [string, MateriaBase][] = [['Fundamentos', 'linguagens'], ['Matemática aplicada', 'exatas'], ['Práticas profissionais', 'ciencias'], ['Comunicação', 'linguagens'], ['Ética e cidadania', 'humanas'], ['Projeto integrador', 'exatas'], ['Estágio', 'ciencias']];
/** A pós-graduação: o que se cursa e o que se escreve. */
const POS: [string, MateriaBase][] = [['Metodologia da pesquisa', 'linguagens'], ['Seminários avançados', 'humanas'], ['Tópicos especiais', 'exatas'], ['Estágio docente', 'linguagens'], ['Qualificação', 'linguagens'], ['Dissertação ou tese', 'linguagens']];

/** A grade de um curso pela área e pelo nível. */
export function gradeDoCurso(area: string | undefined, nivel: string): [string, MateriaBase][] {
  if (nivel === 'mestrado' || nivel === 'doutorado' || nivel === 'pos') return POS;
  return GRADE[area ?? ''] ?? GERAL;
}

/** O desempenho do ano (0..100) na escala 0..10 (a mesma régua do boletim da escola). */
const nota10 = (d: number) => clamp(Math.round(d + 10) / 10, 0, 10);

/**
 * As disciplinas do ano de curso `anoDoCurso` (1, 2, ...): uma janela da grade que anda com o curso. A nota de cada
 * uma parte do desempenho e se desloca pela matéria da escola em que se apoia. `reprovou` (o motor do curso decidiu que
 * o ano atrasa) garante pelo menos uma disciplina abaixo da aprovação — a nota não contradiz o que aconteceu.
 */
export function disciplinasDoAno(v: Vida, grade: [string, MateriaBase][], anoDoCurso: number, totalDeAnos: number, desempenho: number, reprovou: boolean): RegistroAcademico['disciplinas'] {
  const r = rngDe(v.id, 'disciplinas', v.t);
  const porAno = Math.max(3, Math.min(5, Math.ceil(grade.length / Math.max(1, totalDeAnos)) + 1));
  const inicio = Math.min(Math.max(0, grade.length - porAno), Math.round(((anoDoCurso - 1) / Math.max(1, totalDeAnos)) * grade.length));
  const doAno = grade.slice(inicio, inicio + porAno);
  const frente = (m: MateriaBase) => v.caminhos.frentes[m]?.habilidade;
  const presentes = doAno.map(([, m]) => frente(m)).filter((x): x is number => x !== undefined);
  const media = presentes.length ? presentes.reduce((a, b) => a + b, 0) / presentes.length : 0;
  const out = doAno.map(([nome, m]) => {
    const h = frente(m);
    const desvio = h !== undefined && media > 0 ? clamp((h / media - 1) * 25, -15, 15) : 0;
    return { nome, nota: nota10(desempenho + desvio + r.normal() * 6) };
  });
  // A nota acompanha o que o motor decidiu: quem reprova tem a disciplina reprovada; quem passou, não ficou abaixo.
  const piores = [...out].sort((a, b) => a.nota - b.nota);
  if (reprovou) {
    const quantas = desempenho < 25 ? 2 : 1;
    for (const d of piores.slice(0, quantas)) d.nota = Math.min(d.nota, 4 - (r.next() < 0.5 ? 0.5 : 0));
  } else {
    for (const d of out) d.nota = Math.max(d.nota, 5);
  }
  return out.map(d => ({ nome: d.nome, nota: Math.round(d.nota * 10) / 10, situacao: d.nota >= 5 ? 'aprovada' as const : 'reprovada' as const }));
}

/** Guarda um ano letivo fechado (o mais recente por último; os mais antigos saem quando passa do limite). */
export function registrarAnoLetivo(v: Vida, reg: Omit<RegistroAcademico, 't'> & { t?: number }): RegistroAcademico {
  const h = (v.educacao.historicoAcademico ??= []);
  const x: RegistroAcademico = { t: reg.t ?? v.t, ...reg } as RegistroAcademico;
  if (x.disciplinas.length) x.media = Math.round((x.disciplinas.reduce((a, d) => a + d.nota, 0) / x.disciplinas.length) * 10) / 10;
  h.push(x);
  if (h.length > LIMITE_DO_HISTORICO) h.splice(0, h.length - LIMITE_DO_HISTORICO);
  return x;
}

/** O histórico de um nível (a escola, ou os cursos), na ordem. */
export function historicoDe(v: Vida, qual: 'escola' | 'cursos'): RegistroAcademico[] {
  return (v.educacao.historicoAcademico ?? []).filter(x => (qual === 'escola' ? x.nivel === 'escola' : x.nivel !== 'escola'));
}

/** Os registros da matrícula de agora (ou de um curso já fechado, pela chave `tInicio`). */
export const registrosDoCurso = (v: Vida, cursoId: string, tInicio: number) => (v.educacao.historicoAcademico ?? []).filter(x => x.cursoId === cursoId && x.tInicioCurso === tInicio);

/** Os créditos acumulados de um curso: cursados e aprovados. */
export function creditosDoCurso(v: Vida, cursoId: string, tInicio: number): { cursados: number; aprovados: number; reprovadas: number } {
  let cursados = 0, aprovados = 0, reprovadas = 0;
  for (const x of registrosDoCurso(v, cursoId, tInicio)) for (const d of x.disciplinas) { cursados += CREDITOS; if (d.situacao === 'reprovada') reprovadas++; else aprovados += CREDITOS; }
  return { cursados, aprovados, reprovadas };
}

export const CREDITOS_POR_DISCIPLINA = CREDITOS;
