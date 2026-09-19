import { Job } from '../types';

export const TODAS_PROFISSOES: Job[] = [
  // Início de Carreira / Entrada
  {
    id: 'jovem_aprendiz',
    titulo: 'Jovem Aprendiz',
    setor: 'Administrativo',
    salarioMensal: 950,
    escolaridadeMinima: 'fundamental_completo',
    inteligenciaMinima: 10,
    experienciaNecessaria: 0,
    horasSemanais: 20,
    estresseNivel: 1,
    progressaoPara: 'aux_adm'
  },
  {
    id: 'estagiario',
    titulo: 'Estagiário Universitário',
    setor: 'Corporativo',
    salarioMensal: 1400,
    escolaridadeMinima: 'superior_incompleto',
    inteligenciaMinima: 30,
    experienciaNecessaria: 0,
    horasSemanais: 30,
    estresseNivel: 2,
    progressaoPara: 'analista_jr'
  },

  // Comércio e Serviços
  {
    id: 'atendente',
    titulo: 'Atendente de Comércio',
    setor: 'Comércio & Serviços',
    salarioMensal: 1650,
    escolaridadeMinima: 'fundamental_completo',
    inteligenciaMinima: 15,
    experienciaNecessaria: 0,
    horasSemanais: 44,
    estresseNivel: 2,
    progressaoPara: 'vendedor'
  },
  {
    id: 'garcom',
    titulo: 'Garçom / Atendente de Restaurante',
    setor: 'Comércio & Serviços',
    salarioMensal: 1850,
    escolaridadeMinima: 'fundamental_completo',
    inteligenciaMinima: 15,
    experienciaNecessaria: 0,
    horasSemanais: 44,
    estresseNivel: 3,
    progressaoPara: 'gerente_comercial'
  },
  {
    id: 'vendedor',
    titulo: 'Vendedor Especialista',
    setor: 'Comércio & Serviços',
    salarioMensal: 2800,
    escolaridadeMinima: 'medio_completo',
    inteligenciaMinima: 30,
    experienciaNecessaria: 1,
    horasSemanais: 44,
    estresseNivel: 3,
    progressaoPara: 'gerente_comercial'
  },
  {
    id: 'gerente_comercial',
    titulo: 'Gerente Comercial de Loja',
    setor: 'Comércio & Serviços',
    salarioMensal: 5200,
    escolaridadeMinima: 'medio_completo',
    inteligenciaMinima: 45,
    experienciaNecessaria: 3,
    horasSemanais: 44,
    estresseNivel: 4,
    progressaoPara: 'diretor_operacoes'
  },

  // Setor Operacional e Técnico
  {
    id: 'aux_eletrica',
    titulo: 'Ajudante Geral',
    setor: 'Operacional',
    salarioMensal: 1700,
    escolaridadeMinima: 'fundamental_completo',
    inteligenciaMinima: 15,
    experienciaNecessaria: 0,
    horasSemanais: 44,
    estresseNivel: 2,
    progressaoPara: 'eletricista'
  },
  {
    id: 'eletricista',
    titulo: 'Eletricista Instalador',
    setor: 'Técnico',
    salarioMensal: 3600,
    escolaridadeMinima: 'tecnico',
    inteligenciaMinima: 35,
    experienciaNecessaria: 1,
    horasSemanais: 40,
    estresseNivel: 2,
    progressaoPara: 'mestre_obras'
  },
  {
    id: 'mecanico',
    titulo: 'Mecânico Automotivo',
    setor: 'Técnico',
    salarioMensal: 3800,
    escolaridadeMinima: 'tecnico',
    inteligenciaMinima: 35,
    experienciaNecessaria: 1,
    horasSemanais: 44,
    estresseNivel: 3
  },
  {
    id: 'tec_suporte_ti',
    titulo: 'Técnico em Suporte de TI',
    setor: 'Tecnologia',
    salarioMensal: 2900,
    escolaridadeMinima: 'tecnico',
    inteligenciaMinima: 40,
    experienciaNecessaria: 0,
    horasSemanais: 40,
    estresseNivel: 2,
    progressaoPara: 'dev_junior'
  },

  // Setor Administrativo e Corporativo
  {
    id: 'aux_adm',
    titulo: 'Auxiliar Administrativo',
    setor: 'Administrativo',
    salarioMensal: 2400,
    escolaridadeMinima: 'medio_completo',
    inteligenciaMinima: 25,
    experienciaNecessaria: 0,
    horasSemanais: 40,
    estresseNivel: 2,
    progressaoPara: 'analista_jr'
  },
  {
    id: 'analista_jr',
    titulo: 'Analista de Negócios Júnior',
    setor: 'Corporativo',
    salarioMensal: 4200,
    escolaridadeMinima: 'superior_completo',
    inteligenciaMinima: 50,
    experienciaNecessaria: 1,
    horasSemanais: 40,
    estresseNivel: 3,
    progressaoPara: 'analista_pleno'
  },
  {
    id: 'analista_pleno',
    titulo: 'Analista de Negócios Pleno',
    setor: 'Corporativo',
    salarioMensal: 6800,
    escolaridadeMinima: 'superior_completo',
    inteligenciaMinima: 60,
    experienciaNecessaria: 3,
    horasSemanais: 40,
    estresseNivel: 3,
    progressaoPara: 'gerente_corporativo'
  },
  {
    id: 'gerente_corporativo',
    titulo: 'Gerente Corporativo',
    setor: 'Corporativo',
    salarioMensal: 13500,
    escolaridadeMinima: 'superior_completo',
    inteligenciaMinima: 65,
    experienciaNecessaria: 5,
    horasSemanais: 44,
    estresseNivel: 4,
    progressaoPara: 'diretor_operacoes'
  },
  {
    id: 'diretor_operacoes',
    titulo: 'Diretor de Operações (COO / C-Level)',
    setor: 'Corporativo',
    salarioMensal: 28000,
    escolaridadeMinima: 'superior_completo',
    inteligenciaMinima: 75,
    experienciaNecessaria: 8,
    horasSemanais: 50,
    estresseNivel: 5
  },

  // Tecnologia da Informação
  {
    id: 'dev_junior',
    titulo: 'Desenvolvedor(a) de Software Júnior',
    setor: 'Tecnologia',
    salarioMensal: 4500,
    escolaridadeMinima: 'superior_incompleto',
    inteligenciaMinima: 55,
    experienciaNecessaria: 0,
    horasSemanais: 40,
    estresseNivel: 3,
    progressaoPara: 'dev_pleno'
  },
  {
    id: 'dev_pleno',
    titulo: 'Desenvolvedor(a) de Software Pleno',
    setor: 'Tecnologia',
    salarioMensal: 8500,
    escolaridadeMinima: 'superior_completo',
    inteligenciaMinima: 65,
    experienciaNecessaria: 2,
    horasSemanais: 40,
    estresseNivel: 3,
    progressaoPara: 'dev_senior'
  },
  {
    id: 'dev_senior',
    titulo: 'Desenvolvedor(a) de Software Sênior',
    setor: 'Tecnologia',
    salarioMensal: 15000,
    escolaridadeMinima: 'superior_completo',
    inteligenciaMinima: 75,
    experienciaNecessaria: 5,
    horasSemanais: 40,
    estresseNivel: 4,
    progressaoPara: 'tech_lead'
  },
  {
    id: 'tech_lead',
    titulo: 'Líder Técnico / Arquiteto de Software',
    setor: 'Tecnologia',
    salarioMensal: 24000,
    escolaridadeMinima: 'superior_completo',
    inteligenciaMinima: 80,
    experienciaNecessaria: 7,
    horasSemanais: 40,
    estresseNivel: 4
  },

  // Saúde
  {
    id: 'tec_enfermagem_job',
    titulo: 'Técnico(a) em Enfermagem',
    setor: 'Saúde',
    salarioMensal: 3300,
    escolaridadeMinima: 'tecnico',
    inteligenciaMinima: 40,
    experienciaNecessaria: 0,
    horasSemanais: 36,
    estresseNivel: 3,
    progressaoPara: 'enfermeiro_chefe'
  },
  {
    id: 'enfermeiro_chefe',
    titulo: 'Enfermeiro(a) Hospitalar',
    setor: 'Saúde',
    salarioMensal: 5800,
    escolaridadeMinima: 'superior_completo',
    inteligenciaMinima: 55,
    experienciaNecessaria: 1,
    horasSemanais: 36,
    estresseNivel: 4
  },
  {
    id: 'psicologo_clinico',
    titulo: 'Psicólogo(a) Clínico(a)',
    setor: 'Saúde',
    salarioMensal: 5200,
    escolaridadeMinima: 'superior_completo',
    inteligenciaMinima: 60,
    experienciaNecessaria: 1,
    horasSemanais: 30,
    estresseNivel: 3
  },
  {
    id: 'medico_geral',
    titulo: 'Médico(a) Clínico Geral',
    setor: 'Saúde',
    salarioMensal: 19500,
    escolaridadeMinima: 'superior_completo',
    inteligenciaMinima: 75,
    experienciaNecessaria: 0,
    horasSemanais: 40,
    estresseNivel: 4,
    progressaoPara: 'medico_especialista'
  },
  {
    id: 'medico_especialista',
    titulo: 'Médico(a) Cirurgião Especialista',
    setor: 'Saúde',
    salarioMensal: 35000,
    escolaridadeMinima: 'pos_graduacao',
    inteligenciaMinima: 85,
    experienciaNecessaria: 4,
    horasSemanais: 44,
    estresseNivel: 5
  },

  // Engenharia
  {
    id: 'eng_civil_jr',
    titulo: 'Engenheiro(a) Civil Trainee',
    setor: 'Engenharia',
    salarioMensal: 6200,
    escolaridadeMinima: 'superior_completo',
    inteligenciaMinima: 60,
    experienciaNecessaria: 0,
    horasSemanais: 40,
    estresseNivel: 3,
    progressaoPara: 'eng_civil_pleno'
  },
  {
    id: 'eng_civil_pleno',
    titulo: 'Engenheiro(a) Civil Pleno',
    setor: 'Engenharia',
    salarioMensal: 11000,
    escolaridadeMinima: 'superior_completo',
    inteligenciaMinima: 70,
    experienciaNecessaria: 3,
    horasSemanais: 44,
    estresseNivel: 4,
    progressaoPara: 'gerente_obras'
  },
  {
    id: 'gerente_obras',
    titulo: 'Gerente Geral de Grandes Obras',
    setor: 'Engenharia',
    salarioMensal: 21000,
    escolaridadeMinima: 'superior_completo',
    inteligenciaMinima: 75,
    experienciaNecessaria: 6,
    horasSemanais: 45,
    estresseNivel: 5
  },

  // Direito e Concursos Públicos
  {
    id: 'advogado_jr',
    titulo: 'Advogado(a) Associado(a)',
    setor: 'Direito & Jurídico',
    salarioMensal: 4800,
    escolaridadeMinima: 'superior_completo',
    inteligenciaMinima: 60,
    experienciaNecessaria: 0,
    horasSemanais: 40,
    estresseNivel: 3,
    progressaoPara: 'advogado_senior'
  },
  {
    id: 'advogado_senior',
    titulo: 'Sócio(a) de Escritório de Advocacia',
    setor: 'Direito & Jurídico',
    salarioMensal: 16000,
    escolaridadeMinima: 'superior_completo',
    inteligenciaMinima: 70,
    experienciaNecessaria: 5,
    horasSemanais: 45,
    estresseNivel: 4
  },
  {
    id: 'concurso_tecnico',
    titulo: 'Técnico Judiciário Concursado',
    setor: 'Serviço Público',
    salarioMensal: 7500,
    escolaridadeMinima: 'medio_completo',
    inteligenciaMinima: 60,
    experienciaNecessaria: 0,
    horasSemanais: 35,
    estresseNivel: 2,
    progressaoPara: 'concurso_analista'
  },
  {
    id: 'concurso_analista',
    titulo: 'Analista da Receita Federal',
    setor: 'Serviço Público',
    salarioMensal: 16500,
    escolaridadeMinima: 'superior_completo',
    inteligenciaMinima: 75,
    experienciaNecessaria: 1,
    horasSemanais: 40,
    estresseNivel: 3,
    progressaoPara: 'concurso_auditor'
  },
  {
    id: 'concurso_auditor',
    titulo: 'Auditor Fiscal / Juiz Substituto',
    setor: 'Serviço Público',
    salarioMensal: 33000,
    escolaridadeMinima: 'superior_completo',
    inteligenciaMinima: 85,
    experienciaNecessaria: 3,
    horasSemanais: 40,
    estresseNivel: 4
  },

  // Educação
  {
    id: 'professor_fundamental',
    titulo: 'Professor(a) do Ensino Fundamental',
    setor: 'Educação',
    salarioMensal: 3800,
    escolaridadeMinima: 'superior_completo',
    inteligenciaMinima: 45,
    experienciaNecessaria: 0,
    horasSemanais: 30,
    estresseNivel: 3,
    progressaoPara: 'professor_medio'
  },
  {
    id: 'professor_medio',
    titulo: 'Professor(a) do Ensino Médio',
    setor: 'Educação',
    salarioMensal: 4900,
    escolaridadeMinima: 'superior_completo',
    inteligenciaMinima: 55,
    experienciaNecessaria: 1,
    horasSemanais: 32,
    estresseNivel: 3,
    progressaoPara: 'professor_universitario'
  },
  {
    id: 'professor_universitario',
    titulo: 'Professor(a) Universitário Doutor',
    setor: 'Educação',
    salarioMensal: 12500,
    escolaridadeMinima: 'pos_graduacao',
    inteligenciaMinima: 75,
    experienciaNecessaria: 3,
    horasSemanais: 40,
    estresseNivel: 3
  },

  // Mestre de Obras
  {
    id: 'mestre_obras',
    titulo: 'Mestre de Obras e Empreiteiro',
    setor: 'Construção Civil',
    salarioMensal: 7500,
    escolaridadeMinima: 'fundamental_completo',
    inteligenciaMinima: 45,
    experienciaNecessaria: 4,
    horasSemanais: 44,
    estresseNivel: 3
  }
];

export interface FreelanceOption {
  id: string;
  nome: string;
  ganhoEstimadoAnual: number;
  energiaGasto: number; // por execucao
  estresseGasto: number;
  requisito?: string;
  descricao: string;
}

export const BICOS_DISPONIVEIS: FreelanceOption[] = [
  {
    id: 'bico_entregas',
    nome: 'Fazer Entregas de Moto/Bicicleta nos Fins de Semana',
    ganhoEstimadoAnual: 7200,
    energiaGasto: 15,
    estresseGasto: 10,
    descricao: 'Trabalhar com entregas de aplicativo nas horas vagas.'
  },
  {
    id: 'bico_aulas',
    nome: 'Dar Aulas Particulares / Monitoria',
    ganhoEstimadoAnual: 9600,
    energiaGasto: 10,
    estresseGasto: 5,
    requisito: 'medio_completo',
    descricao: 'Ensinar reforço escolar para crianças e jovens.'
  },
  {
    id: 'bico_freela_design_ti',
    nome: 'Fazer Freelance de Design ou Programação',
    ganhoEstimadoAnual: 16000,
    energiaGasto: 12,
    estresseGasto: 8,
    requisito: 'tecnico',
    descricao: 'Criar sites, identidades visuais e aplicativos sob demanda.'
  },
  {
    id: 'bico_uber',
    nome: 'Rodar como Motorista de Aplicativo (Uber/99)',
    ganhoEstimadoAnual: 18000,
    energiaGasto: 18,
    estresseGasto: 14,
    requisito: 'veiculo',
    descricao: 'Transportar passageiros pela cidade no horário noturno.'
  }
];
