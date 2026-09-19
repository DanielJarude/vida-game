import { GameEvent } from '../../types';

export const CAREER_EVENTS: GameEvent[] = [
  {
    id: 'car_feedback_anual',
    titulo: 'Avaliação de Desempenho Anual',
    descricao: 'A diretoria da empresa chamou você na sala de reuniões para avaliar seus resultados e métricas no último ano.',
    idadeMinima: 18,
    idadeMaxima: 65,
    categoria: 'trabalho',
    peso: 85,
    condicoes: {
      empregado: true
    },
    opcoes: [
      {
        id: 'opt_apresentar_metricas',
        texto: 'Apresentar gráficos detalhados e mostrar o valor gerado',
        descricaoResultado: 'A chefia ficou muito impressionada com sua postura profissional e prometeu priorizar sua promoção!',
        consequencias: {
          stats: { felicidade: 15 },
          hiddenStats: { ambicao: 15, reputacao: 20, disciplina: 10 }
        }
      },
      {
        id: 'opt_pedir_aumento_direto',
        texto: 'Cobrar diretamente um aumento salarial condizente com sua carga horária',
        descricaoResultado: 'Sua firmeza surtiu efeito! O gestor autorizou um bônus no seu próximo holerite.',
        consequencias: {
          stats: { felicidade: 12 },
          dinheiro: 3000,
          hiddenStats: { ambicao: 15 }
        }
      },
      {
        id: 'opt_ouvir_calado',
        texto: 'Apenas concordar e agradecer o feedback com humildade',
        descricaoResultado: 'Você manteve seu emprego com estabilidade e sem atritos.',
        consequencias: {
          stats: { felicidade: 5 },
          hiddenStats: { disciplina: 5 }
        }
      }
    ]
  },
  {
    id: 'car_hora_extra_urgente',
    titulo: 'Prazo Apertado e Horas Extras',
    descricao: 'Um grande cliente antecipou a entrega de um projeto crucial e o time precisa virar a noite trabalhando.',
    idadeMinima: 18,
    idadeMaxima: 65,
    categoria: 'trabalho',
    peso: 80,
    condicoes: {
      empregado: true
    },
    opcoes: [
      {
        id: 'opt_vestir_camisa',
        texto: 'Pedir pizza, tomar café e liderar a força-tarefa até de madrugada',
        descricaoResultado: 'A entrega foi um sucesso retumbante e a empresa bateu o recorde de faturamento!',
        consequencias: {
          stats: { felicidade: 10 },
          dinheiro: 1500,
          hiddenStats: { ambicao: 20, reputacao: 25, estresse: 20 }
        }
      },
      {
        id: 'opt_bater_ponto_horario',
        texto: 'Cumprir rigorosamente seu horário de contrato e ir para casa',
        descricaoResultado: 'Você preservou seu descanso, embora o chefe tenha olhado torto.',
        consequencias: {
          stats: { felicidade: 8, saude: 5 },
          hiddenStats: { estresse: -15, reputacao: -10 }
        }
      }
    ]
  },
  {
    id: 'car_fofoca_copa',
    titulo: 'Fofoca na Copa do Escritório',
    descricao: 'Enquanto você pegava um cafézinho, colegas de equipe começaram a falar mal do diretor do departamento.',
    idadeMinima: 18,
    idadeMaxima: 65,
    categoria: 'trabalho',
    peso: 75,
    condicoes: {
      empregado: true
    },
    opcoes: [
      {
        id: 'opt_mudar_assunto',
        texto: 'Mudar habilmente de assunto e focar no trabalho do dia',
        descricaoResultado: 'Você demonstrou maturidade corporativa e não se queimou com ninguém.',
        consequencias: {
          stats: { felicidade: 5 },
          hiddenStats: { empatia: 10, reputacao: 10, disciplina: 10 }
        }
      },
      {
        id: 'opt_participar_fofoca',
        texto: 'Entrar na fofoca e soltar um segredo que você sabia',
        descricaoResultado: 'A fofoca vazou e criou um climão desconfortável na reunião de equipe!',
        consequencias: {
          stats: { felicidade: -10 },
          hiddenStats: { reputacao: -18, estresse: 15 }
        }
      }
    ]
  },
  {
    id: 'car_proposta_concorrente',
    titulo: 'Headhunter e Proposta Concorrente',
    descricao: 'Um recrutador encontrou seu perfil no LinkedIn e ofereceu uma posição sênior em uma empresa multinacional concorrente.',
    idadeMinima: 22,
    idadeMaxima: 60,
    categoria: 'trabalho',
    peso: 70,
    condicoes: {
      empregado: true
    },
    opcoes: [
      {
        id: 'opt_aceitar_proposta_nova',
        texto: 'Aceitar a oportunidade para dar um salto de carreira',
        descricaoResultado: 'Você negociou um excelente pacote de benefícios e assumiu o novo desafio!',
        consequencias: {
          stats: { felicidade: 20 },
          dinheiro: 4000,
          hiddenStats: { ambicao: 20, reputacao: 15 }
        }
      },
      {
        id: 'opt_usar_contraproposta',
        texto: 'Levar a proposta ao seu chefe atual e pedir contraproposta',
        descricaoResultado: 'Seu chefe cobriu a oferta com um belo reajuste para não perder você da equipe.',
        consequencias: {
          stats: { felicidade: 18 },
          dinheiro: 3500,
          hiddenStats: { reputacao: 15 }
        }
      },
      {
        id: 'opt_recusar_lealdade',
        texto: 'Recusar por amor ao seu time atual',
        descricaoResultado: 'Você manteve seu ambiente de trabalho estável e familiar.',
        consequencias: {
          stats: { felicidade: 5 },
          hiddenStats: { empatia: 10 }
        }
      }
    ]
  }
];
