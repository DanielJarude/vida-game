import type { AreaFormacao } from './formacao/areasFormacao';

export interface CourseOption {
  id: string;
  nome: string;
  tipo: 'tecnico' | 'superior' | 'pos';
  /**
   * Agrupamento EDITORIAL, usado para organizar a tela de matrícula. Grosso
   * de propósito: junta Pedagogia, Direito e Psicologia em "Humanas & Sociais".
   * Nunca use este campo para decidir habilitação profissional — para isso
   * existe `areaFormacao`, que é fina o bastante para separar quem pode
   * advogar de quem pode dar aula.
   */
  area: 'Exatas & Tecnologia' | 'Saúde & Biológicas' | 'Humanas & Sociais' | 'Artes & Comunicação' | 'Negócios';
  /**
   * Área de formação para fins de habilitação profissional. É a ponte entre
   * este catálogo e `careersData` — ver `data/formacao/areasFormacao.ts`.
   */
  areaFormacao: AreaFormacao;
  duracaoSemestres: number;
  notaCorteEnem: number; // 0 a 1000
  mensalidadePrivada: number;
  inteligenciaMinima: number;
  descricao: string;
  /**
   * Formação anterior exigida NA MESMA ÁREA, além do nível de escolaridade.
   *
   * Existe porque "superior_completo" não é pré-requisito suficiente para uma
   * pós: a auditoria reproduziu uma pedagoga sendo aceita em Residência
   * Médica. Uma pós de área regulamentada exige a graduação daquela área.
   *
   * Ausente = qualquer graduação serve (é o caso legítimo do MBA, que no
   * Brasil real aceita formados de qualquer área).
   */
  preRequisitoAreas?: readonly AreaFormacao[];
}

export const CURSOS_DISPONIVEIS: CourseOption[] = [
  // Cursos Técnicos
  {
    id: 'tec_ti',
    nome: 'Técnico em Desenvolvimento de Sistemas',
    tipo: 'tecnico',
    area: 'Exatas & Tecnologia',
    areaFormacao: 'tecnologia_informacao',
    duracaoSemestres: 3,
    notaCorteEnem: 520,
    mensalidadePrivada: 380,
    inteligenciaMinima: 35,
    descricao: 'Aprenda programação, banco de dados e manutenção de softwares.'
  },
  {
    id: 'tec_eletrotecnica',
    nome: 'Técnico em Eletrotécnica',
    tipo: 'tecnico',
    area: 'Exatas & Tecnologia',
    areaFormacao: 'eletrotecnica',
    duracaoSemestres: 4,
    notaCorteEnem: 500,
    mensalidadePrivada: 420,
    inteligenciaMinima: 30,
    descricao: 'Projetos elétricos residenciais, prediais e industriais.'
  },
  {
    id: 'tec_enfermagem',
    nome: 'Técnico em Enfermagem',
    tipo: 'tecnico',
    area: 'Saúde & Biológicas',
    areaFormacao: 'enfermagem',
    duracaoSemestres: 4,
    notaCorteEnem: 540,
    mensalidadePrivada: 450,
    inteligenciaMinima: 35,
    descricao: 'Cuidados assistenciais e suporte em clínicas e hospitais.'
  },
  {
    id: 'tec_adm',
    nome: 'Técnico em Administração',
    tipo: 'tecnico',
    area: 'Negócios',
    areaFormacao: 'gestao_negocios',
    duracaoSemestres: 3,
    notaCorteEnem: 480,
    mensalidadePrivada: 320,
    inteligenciaMinima: 25,
    descricao: 'Rotinas administrativas, financeiras e gestão básica de negócios.'
  },

  // Ensino Superior
  {
    id: 'sup_medicina',
    nome: 'Medicina',
    tipo: 'superior',
    area: 'Saúde & Biológicas',
    areaFormacao: 'medicina',
    duracaoSemestres: 12,
    notaCorteEnem: 810,
    mensalidadePrivada: 9800,
    inteligenciaMinima: 75,
    descricao: 'Uma das formações mais tradicionais e concorridas do país.'
  },
  {
    id: 'sup_direito',
    nome: 'Direito',
    tipo: 'superior',
    area: 'Humanas & Sociais',
    areaFormacao: 'direito',
    duracaoSemestres: 10,
    notaCorteEnem: 680,
    mensalidadePrivada: 1200,
    inteligenciaMinima: 50,
    descricao: 'Estudo das leis, advocacia, judiciário e preparação para concursos jurídicos.'
  },
  {
    id: 'sup_eng_software',
    nome: 'Engenharia de Software / Ciência da Computação',
    tipo: 'superior',
    area: 'Exatas & Tecnologia',
    areaFormacao: 'tecnologia_informacao',
    duracaoSemestres: 8,
    notaCorteEnem: 710,
    mensalidadePrivada: 1450,
    inteligenciaMinima: 60,
    descricao: 'Arquitetura de software, inteligência artificial e grandes sistemas digitais.'
  },
  {
    id: 'sup_eng_civil',
    nome: 'Engenharia Civil',
    tipo: 'superior',
    area: 'Exatas & Tecnologia',
    areaFormacao: 'engenharia_civil',
    duracaoSemestres: 10,
    notaCorteEnem: 690,
    mensalidadePrivada: 1600,
    inteligenciaMinima: 55,
    descricao: 'Construção civil, cálculo estrutural e gestão de obras e infraestrutura.'
  },
  {
    id: 'sup_adm',
    nome: 'Administração de Empresas',
    tipo: 'superior',
    area: 'Negócios',
    areaFormacao: 'gestao_negocios',
    duracaoSemestres: 8,
    notaCorteEnem: 610,
    mensalidadePrivada: 890,
    inteligenciaMinima: 40,
    descricao: 'Gestão estratégica, finanças corporativas, marketing e liderança.'
  },
  {
    id: 'sup_enfermagem',
    nome: 'Enfermagem (Bacharelado)',
    tipo: 'superior',
    area: 'Saúde & Biológicas',
    areaFormacao: 'enfermagem',
    duracaoSemestres: 10,
    notaCorteEnem: 650,
    mensalidadePrivada: 1100,
    inteligenciaMinima: 45,
    descricao: 'Coordenação e gestão de equipes de saúde e atendimento hospitalar.'
  },
  {
    id: 'sup_psicologia',
    nome: 'Psicologia',
    tipo: 'superior',
    area: 'Humanas & Sociais',
    areaFormacao: 'psicologia',
    duracaoSemestres: 10,
    notaCorteEnem: 690,
    mensalidadePrivada: 1250,
    inteligenciaMinima: 50,
    descricao: 'Compreensão do comportamento humano, terapia clínica e organizacional.'
  },
  {
    id: 'sup_pedagogia',
    nome: 'Pedagogia / Licenciatura',
    tipo: 'superior',
    area: 'Humanas & Sociais',
    areaFormacao: 'educacao',
    duracaoSemestres: 8,
    notaCorteEnem: 570,
    mensalidadePrivada: 650,
    inteligenciaMinima: 35,
    descricao: 'Formação de professores e especialistas em processos pedagógicos.'
  },
  {
    id: 'sup_design',
    nome: 'Design Digital e Visual',
    tipo: 'superior',
    area: 'Artes & Comunicação',
    areaFormacao: 'design_comunicacao',
    duracaoSemestres: 8,
    notaCorteEnem: 630,
    mensalidadePrivada: 1050,
    inteligenciaMinima: 45,
    descricao: 'Identidade visual, interfaces digitais (UI/UX) e comunicação gráfica.'
  },
  {
    id: 'sup_ed_fisica',
    nome: 'Educação Física',
    tipo: 'superior',
    area: 'Saúde & Biológicas',
    areaFormacao: 'esporte_saude',
    duracaoSemestres: 8,
    notaCorteEnem: 590,
    mensalidadePrivada: 750,
    inteligenciaMinima: 30,
    descricao: 'Treinamento esportivo, academias, condicionamento e bem-estar.'
  },
  {
    id: 'sup_economia',
    nome: 'Ciências Econômicas',
    tipo: 'superior',
    area: 'Negócios',
    areaFormacao: 'gestao_negocios',
    duracaoSemestres: 8,
    notaCorteEnem: 700,
    mensalidadePrivada: 1350,
    inteligenciaMinima: 60,
    descricao: 'Mercado financeiro, macroeconomia, investimentos e políticas públicas.'
  },

  // Pós-Graduação
  {
    id: 'pos_mba_executivo',
    nome: 'MBA Executivo em Liderança e Gestão',
    tipo: 'pos',
    area: 'Negócios',
    areaFormacao: 'gestao_negocios',
    duracaoSemestres: 3,
    notaCorteEnem: 0,
    mensalidadePrivada: 1800,
    inteligenciaMinima: 55,
    descricao: 'Especialização de alto nível para cargos de diretoria e executivos.'
  },
  {
    id: 'pos_especializacao_medica',
    nome: 'Residência Médica / Especialização',
    tipo: 'pos',
    area: 'Saúde & Biológicas',
    areaFormacao: 'medicina',
    // Residência é para médicos formados. Sem isto, a auditoria reproduziu
    // uma pedagoga matriculada em Residência Médica (reprodução R8).
    preRequisitoAreas: ['medicina'],
    duracaoSemestres: 4,
    notaCorteEnem: 0,
    mensalidadePrivada: 2200,
    inteligenciaMinima: 80,
    descricao: 'Formação em cardiologia, cirurgia geral ou dermatologia.'
  }
];
