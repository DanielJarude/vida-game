/**
 * ÁREA DE FORMAÇÃO — a ponte que faltava entre o que se estuda e o que se
 * exerce.
 *
 * A auditoria mediu o buraco: `CourseOption` e `Job` nunca se conheceram. A
 * contratação olhava só o NÍVEL de escolaridade (`superior_completo`), nunca
 * QUAL curso a pessoa fez. Resultado medido: uma formada só em Pedagogia
 * recebia 34 vagas, entre elas Médico Clínico Geral — e era contratada.
 *
 * A tentação seria criar uma tabela de pares curso × profissão. Com 17 cursos
 * e 36 profissões isso já seriam 612 combinações para manter à mão, e o
 * catálogo só tende a crescer. A auditoria recomendou explicitamente o
 * contrário: relacionar por ÁREA.
 *
 * Assim, um curso declara UMA área e uma profissão declara QUAIS áreas
 * habilitam. Acrescentar um curso novo custa uma linha; acrescentar uma
 * profissão nova custa uma linha. Nenhuma regra nova.
 *
 * As áreas são mais finas que `CourseOption.area` (que é editorial, usada para
 * agrupar na tela de matrícula). "Humanas & Sociais" junta Pedagogia, Direito
 * e Psicologia — se a habilitação usasse esse agrupamento, um pedagogo poderia
 * advogar. Aqui elas são separadas, porque é disso que a coerência depende.
 */

export type AreaFormacao =
  | 'medicina'
  | 'enfermagem'
  | 'psicologia'
  | 'esporte_saude'
  | 'direito'
  | 'engenharia_civil'
  | 'eletrotecnica'
  | 'tecnologia_informacao'
  | 'educacao'
  | 'gestao_negocios'
  | 'design_comunicacao';

/** Rótulos em pt-BR — o jogador lê isto quando falta formação. */
export const ROTULO_AREA_FORMACAO: Record<AreaFormacao, string> = {
  medicina: 'Medicina',
  enfermagem: 'Enfermagem',
  psicologia: 'Psicologia',
  esporte_saude: 'Educação Física',
  direito: 'Direito',
  engenharia_civil: 'Engenharia Civil',
  eletrotecnica: 'Eletrotécnica',
  tecnologia_informacao: 'Tecnologia da Informação',
  educacao: 'Licenciatura / Pedagogia',
  gestao_negocios: 'Gestão e Negócios',
  design_comunicacao: 'Design e Comunicação'
};

export function rotularAreas(areas: readonly AreaFormacao[]): string {
  const nomes = areas.map(a => ROTULO_AREA_FORMACAO[a]);
  if (nomes.length === 0) return '';
  if (nomes.length === 1) return nomes[0];
  return `${nomes.slice(0, -1).join(', ')} ou ${nomes[nomes.length - 1]}`;
}

/**
 * Nível de um curso, ordenado. Usado quando a profissão exige não só a área
 * mas a profundidade da formação (um Técnico em Enfermagem não é um
 * Enfermeiro Hospitalar).
 */
export type NivelCurso = 'tecnico' | 'superior' | 'pos';

const ORDEM_NIVEL_CURSO: Record<NivelCurso, number> = {
  tecnico: 1,
  superior: 2,
  pos: 3
};

export function nivelCursoAtingeMinimo(nivel: NivelCurso, minimo: NivelCurso): boolean {
  return ORDEM_NIVEL_CURSO[nivel] >= ORDEM_NIVEL_CURSO[minimo];
}

export const ROTULO_NIVEL_CURSO: Record<NivelCurso, string> = {
  tecnico: 'curso técnico',
  superior: 'curso superior',
  pos: 'pós-graduação'
};

/**
 * LICENÇA PROFISSIONAL.
 *
 * No Brasil, algumas profissões não bastam ser estudadas: exigem registro em
 * conselho ou aprovação em exame. Exercê-las sem isso não é "falta de um
 * requisito" — é exercício ilegal de profissão. É por isso que a camada de
 * plausibilidade trata este caso com o grau `irregular`, e não `requisito`.
 *
 * Nesta fase a licença é DERIVADA da formação concluída: quem concluiu
 * Medicina tem CRM, quem concluiu Direito tem OAB. Isso é uma simplificação
 * consciente e documentada — a OAB real é um exame, e o exame é justamente um
 * dos "Desafios de Vida" previstos. Quando ele existir, basta trocar a função
 * que deriva a licença por uma que lê um registro conquistado; nenhuma regra
 * de elegibilidade muda.
 */
export type LicencaProfissional = 'crm' | 'oab' | 'crea' | 'coren' | 'crp';

export const ROTULO_LICENCA: Record<LicencaProfissional, string> = {
  crm: 'registro no CRM (Conselho Regional de Medicina)',
  oab: 'inscrição na OAB (Ordem dos Advogados do Brasil)',
  crea: 'registro no CREA (Conselho Regional de Engenharia e Agronomia)',
  coren: 'registro no COREN (Conselho Regional de Enfermagem)',
  crp: 'registro no CRP (Conselho Regional de Psicologia)'
};

/**
 * Que formação habilita cada licença. Fonte única — `elegibilidadeProfissional`
 * consulta daqui, ninguém reimplementa.
 */
export const FORMACAO_QUE_HABILITA_LICENCA: Record<
  LicencaProfissional,
  { areas: readonly AreaFormacao[]; nivelMinimo: NivelCurso }
> = {
  crm: { areas: ['medicina'], nivelMinimo: 'superior' },
  oab: { areas: ['direito'], nivelMinimo: 'superior' },
  crea: { areas: ['engenharia_civil'], nivelMinimo: 'superior' },
  coren: { areas: ['enfermagem'], nivelMinimo: 'superior' },
  crp: { areas: ['psicologia'], nivelMinimo: 'superior' }
};
