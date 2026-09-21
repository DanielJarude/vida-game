/**
 * REQUISITOS PROFISSIONAIS — dados declarativos, uma entrada por profissão.
 *
 * Mora fora de `careersData.ts` de propósito. Aquele arquivo descreve a
 * profissão como OFERTA (título, setor, salário, carga horária); este descreve
 * a profissão como PORTA (o que é preciso para atravessá-la). São eixos com
 * ritmos de mudança diferentes: um ajuste de balanceamento salarial não deve
 * obrigar a reler regras de habilitação, e vice-versa.
 *
 * Toda entrada aqui é OPCIONAL. Uma profissão sem entrada mantém exatamente o
 * comportamento anterior: vale idade, escolaridade e experiência declaradas em
 * `Job`. Isso é deliberado — significa que este arquivo restringe apenas onde
 * há uma regra real do mundo, e nunca inventa barreira para "fazer o teste
 * passar".
 *
 * Regra de ouro: NADA aqui é hardcode por caso reproduzido na auditoria. Cada
 * linha descreve uma regra brasileira verificável.
 */

import type { AreaFormacao, LicencaProfissional, NivelCurso } from './areasFormacao';

export interface RequisitoProfissional {
  /**
   * Áreas de formação que habilitam a vaga. O personagem precisa ter concluído
   * um curso de UMA delas (não de todas).
   *
   * Ausente = a vaga não exige formação específica. É o caso honesto da maior
   * parte do mercado: Auxiliar Administrativo, Atendente, Garçom, Gerente de
   * Loja — cargos que se aprendem trabalhando.
   */
  areasHabilitantes?: readonly AreaFormacao[];
  /**
   * Profundidade mínima da formação na área. Sem isto, um Técnico em
   * Enfermagem (área `enfermagem`) habilitaria a vaga de Enfermeiro
   * Hospitalar, que no Brasil exige bacharelado e COREN.
   */
  nivelFormacaoMinimo?: NivelCurso;
  /**
   * Licença/registro em conselho. Exercer sem isto não é falta de requisito:
   * é exercício ilegal de profissão regulamentada. Por isso produz veredito
   * `irregular` e não `requisito`.
   */
  licenca?: LicencaProfissional;
  /**
   * Justificativa da regra, em pt-BR. Aparece no relatório de auditoria e
   * serve de documentação viva: se ninguém consegue escrever a justificativa,
   * a regra provavelmente não deveria existir.
   */
  fundamento: string;
}

export const REQUISITOS_PROFISSIONAIS: Readonly<Record<string, RequisitoProfissional>> = {
  // ----------------------------------------------------------------- Saúde
  medico_geral: {
    areasHabilitantes: ['medicina'],
    nivelFormacaoMinimo: 'superior',
    licenca: 'crm',
    fundamento:
      'Medicina é profissão regulamentada (Lei 12.842/2013): exige graduação em Medicina e registro no CRM.'
  },
  medico_especialista: {
    areasHabilitantes: ['medicina'],
    nivelFormacaoMinimo: 'pos',
    licenca: 'crm',
    fundamento:
      'Cirurgia especializada exige, além do CRM, título de especialista obtido em residência médica.'
  },
  enfermeiro_chefe: {
    areasHabilitantes: ['enfermagem'],
    nivelFormacaoMinimo: 'superior',
    licenca: 'coren',
    fundamento:
      'Enfermeiro é privativo de bacharel em Enfermagem com registro no COREN (Lei 7.498/1986). O técnico em enfermagem é outra categoria profissional.'
  },
  tec_enfermagem_job: {
    areasHabilitantes: ['enfermagem'],
    nivelFormacaoMinimo: 'tecnico',
    fundamento:
      'Técnico em Enfermagem exige formação técnica específica na área (Lei 7.498/1986).'
  },
  psicologo_clinico: {
    areasHabilitantes: ['psicologia'],
    nivelFormacaoMinimo: 'superior',
    licenca: 'crp',
    fundamento:
      'Psicólogo é profissão regulamentada (Lei 4.119/1962): exige graduação em Psicologia e registro no CRP.'
  },

  // --------------------------------------------------------------- Jurídico
  advogado_jr: {
    areasHabilitantes: ['direito'],
    nivelFormacaoMinimo: 'superior',
    licenca: 'oab',
    fundamento:
      'Advocacia é privativa de bacharel em Direito inscrito na OAB (Lei 8.906/1994).'
  },
  advogado_senior: {
    areasHabilitantes: ['direito'],
    nivelFormacaoMinimo: 'superior',
    licenca: 'oab',
    fundamento: 'Sociedade de advogados exige inscrição ativa na OAB.'
  },

  // -------------------------------------------------------------- Engenharia
  eng_civil_jr: {
    areasHabilitantes: ['engenharia_civil'],
    nivelFormacaoMinimo: 'superior',
    licenca: 'crea',
    fundamento:
      'Engenharia é profissão regulamentada (Lei 5.194/1966): exige graduação e registro no CREA para assinar projeto.'
  },
  eng_civil_pleno: {
    areasHabilitantes: ['engenharia_civil'],
    nivelFormacaoMinimo: 'superior',
    licenca: 'crea',
    fundamento: 'Mesma regulamentação do trainee, com responsabilidade técnica maior.'
  },
  gerente_obras: {
    areasHabilitantes: ['engenharia_civil'],
    nivelFormacaoMinimo: 'superior',
    licenca: 'crea',
    fundamento:
      'Responsabilidade técnica por grandes obras exige engenheiro registrado no CREA.'
  },

  // -------------------------------------------------------------- Educação
  professor_fundamental: {
    areasHabilitantes: ['educacao'],
    nivelFormacaoMinimo: 'superior',
    fundamento:
      'A LDB (Lei 9.394/1996) exige licenciatura plena para a docência na educação básica.'
  },
  professor_medio: {
    areasHabilitantes: ['educacao'],
    nivelFormacaoMinimo: 'superior',
    fundamento: 'Docência no ensino médio exige licenciatura (LDB, art. 62).'
  },
  professor_universitario: {
    // Não restringe a área: o ensino superior é ministrado por especialistas de
    // qualquer campo. O que a LDB exige é a TITULAÇÃO — já coberta por
    // `escolaridadeMinima: 'pos_graduacao'` em careersData.
    fundamento:
      'Docência no ensino superior exige pós-graduação (LDB, art. 66), mas não uma área única.'
  },

  // -------------------------------------------------------------- Tecnologia
  dev_junior: {
    areasHabilitantes: ['tecnologia_informacao'],
    nivelFormacaoMinimo: 'tecnico',
    fundamento:
      'Desenvolvimento não é profissão regulamentada, mas o mercado formal de vaga júnior exige formação técnica ou superior em TI.'
  },
  dev_pleno: {
    areasHabilitantes: ['tecnologia_informacao'],
    nivelFormacaoMinimo: 'tecnico',
    fundamento: 'Mesma via de formação do júnior, com experiência adicional.'
  },
  dev_senior: {
    areasHabilitantes: ['tecnologia_informacao'],
    nivelFormacaoMinimo: 'tecnico',
    fundamento: 'Mesma via de formação, com senioridade adquirida na carreira.'
  },
  tech_lead: {
    areasHabilitantes: ['tecnologia_informacao'],
    nivelFormacaoMinimo: 'tecnico',
    fundamento: 'Liderança técnica pressupõe a mesma base formativa da carreira de TI.'
  },
  tec_suporte_ti: {
    areasHabilitantes: ['tecnologia_informacao'],
    nivelFormacaoMinimo: 'tecnico',
    fundamento: 'Vaga técnica de TI exige o curso técnico correspondente.'
  },

  // ------------------------------------------------------- Técnico / Operacional
  eletricista: {
    areasHabilitantes: ['eletrotecnica'],
    nivelFormacaoMinimo: 'tecnico',
    fundamento:
      'Instalação elétrica profissional exige formação técnica (NR-10 exige qualificação comprovada).'
  },

  // ---------------------------------------------------------------- Saúde/Esporte
  // (Educação Física é regulamentada pelo CREF, mas o catálogo atual não tem
  //  vaga correspondente. Lacuna documentada no relatório da fase.)

  // ------------------------------------------------------------------ NOTAS
  //
  // Deliberadamente SEM requisito de formação (o mercado real não exige):
  //   jovem_aprendiz, estagiario, atendente, garcom, vendedor,
  //   gerente_comercial, aux_eletrica, aux_adm, analista_jr, analista_pleno,
  //   gerente_corporativo, diretor_operacoes, mecanico, mestre_obras,
  //   concurso_tecnico, concurso_analista, concurso_auditor
  //
  // `mestre_obras` é o caso que a auditoria reproduziu, e é instrutivo: ele
  // NÃO ganha requisito de formação, porque mestre de obras de fato se forma
  // na prática, com ensino fundamental. O que tornava o caso absurdo era a
  // ausência de checagem dos 4 anos de EXPERIÊNCIA que o próprio dado já
  // declarava — e isso agora é verificado para todas as vagas, sem regra
  // especial para esta.
  //
  // Os cargos `concurso_*` exigiriam aprovação em concurso público. Essa é
  // uma conquista, não um requisito de entrada, e pertence à camada de
  // Desafios de Vida (ver relatório da fase). Fora do escopo desta fase.
};

export function obterRequisitoProfissional(jobId: string): RequisitoProfissional | undefined {
  return REQUISITOS_PROFISSIONAIS[jobId];
}
