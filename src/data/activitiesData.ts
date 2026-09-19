export interface ActivityOption {
  id: string;
  categoria: 'saude' | 'lazer' | 'social' | 'desenvolvimento';
  nome: string;
  custo: number;
  idadeMinima: number;
  descricao: string;
  efeitoResumo: string;
}

export const ATIVIDADES_DISPONIVEIS: ActivityOption[] = [
  // Saúde & Bem-estar
  {
    id: 'act_consulta_sus',
    categoria: 'saude',
    nome: 'Fazer Check-up no Posto de Saúde (SUS)',
    custo: 0,
    idadeMinima: 0,
    descricao: 'Consultar médico e realizar exames preventivos pelo Sistema Único de Saúde.',
    efeitoResumo: '+ Saúde, cura pequenas enfermidades'
  },
  {
    id: 'act_consulta_particular',
    categoria: 'saude',
    nome: 'Consulta com Médico Especialista Particular',
    custo: 450,
    idadeMinima: 0,
    descricao: 'Atendimento rápido e detalhado em clínica médica particular conceituada.',
    efeitoResumo: '++ Saúde, diagnóstico preciso e alívio do estresse'
  },
  {
    id: 'act_terapia',
    categoria: 'saude',
    nome: 'Sessão de Terapia Psicológica',
    custo: 220,
    idadeMinima: 12,
    descricao: 'Conversar com psicólogo para cuidar da mente, ansiedade e autoconhecimento.',
    efeitoResumo: '++ Felicidade, - Estresse, + Empatia'
  },
  {
    id: 'act_academia',
    categoria: 'saude',
    nome: 'Treinar na Academia / Praticar Esportes',
    custo: 120,
    idadeMinima: 12,
    descricao: 'Musculação, corrida e treinos funcionais para fortalecer o corpo.',
    efeitoResumo: '+ Saúde, + Aparência, + Condicionamento, - Estresse'
  },
  {
    id: 'act_estetica',
    categoria: 'saude',
    nome: 'Dia no Salão de Beleza / Barbearia e Estética',
    custo: 180,
    idadeMinima: 14,
    descricao: 'Corte de cabelo, skincare e cuidados pessoais para renovar a autoestima.',
    efeitoResumo: '++ Aparência, + Felicidade'
  },

  // Lazer & Cultura
  {
    id: 'act_ferias_praia',
    categoria: 'lazer',
    nome: 'Viagem de Férias para o Litoral Brasileiro',
    custo: 2800,
    idadeMinima: 18,
    descricao: 'Passar uma semana relaxando em praias paradisíacas do Nordeste ou litoral paulista/carioca.',
    efeitoResumo: '+++ Felicidade, -- Estresse'
  },
  {
    id: 'act_viagem_exterior',
    categoria: 'lazer',
    nome: 'Viagem Internacional dos Sonhos',
    custo: 14000,
    idadeMinima: 18,
    descricao: 'Conhecer novas culturas na Europa, América do Norte ou Ásia.',
    efeitoResumo: '++++ Felicidade, + Inteligência, -- Estresse'
  },
  {
    id: 'act_balada_barzinho',
    categoria: 'lazer',
    nome: 'Sair para um Barzinho / Balada com Amigos',
    custo: 150,
    idadeMinima: 16,
    descricao: 'Música ao vivo, risadas e uma cerveja gelada para relaxar no fim de semana.',
    efeitoResumo: '++ Felicidade, + Sociabilidade, - Energia'
  },

  // Social & Relacionamentos
  {
    id: 'act_churrasco',
    categoria: 'social',
    nome: 'Organizar um Churrasco em Família no Domingo',
    custo: 350,
    idadeMinima: 16,
    descricao: 'Carne na brasa, pagode e reunir parentes e amigos para confraternizar.',
    efeitoResumo: '++ Relacionamento com todos os familiares, + Felicidade'
  },
  {
    id: 'act_voluntariado',
    categoria: 'social',
    nome: 'Fazer Trabalho Voluntário em ONG',
    custo: 0,
    idadeMinima: 14,
    descricao: 'Ajudar em abrigos de animais ou distribuição de alimentos para pessoas necessitadas.',
    efeitoResumo: '++ Empatia, + Reputação, + Felicidade'
  },

  // Desenvolvimento Pessoal
  {
    id: 'act_leitura',
    categoria: 'desenvolvimento',
    nome: 'Ler Livros e Cursos Online',
    custo: 60,
    idadeMinima: 10,
    descricao: 'Dedicar horas de leitura e aprimoramento intelectual.',
    efeitoResumo: '++ Inteligência, + Disciplina'
  },
  {
    id: 'act_meditacao',
    categoria: 'desenvolvimento',
    nome: 'Praticar Meditação e Mindfulness',
    custo: 0,
    idadeMinima: 10,
    descricao: 'Exercícios de respiração e foco no momento presente.',
    efeitoResumo: '- Estresse, + Felicidade, + Disciplina'
  }
];
