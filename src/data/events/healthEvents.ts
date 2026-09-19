import { GameEvent } from '../../types';

export const HEALTH_EVENTS: GameEvent[] = [
  {
    id: 'sau_dengue_sazonal',
    titulo: 'Surto de Dengue no Bairro',
    descricao: 'Após semanas de chuva e calor no verão, você acorda com febre alta, dores fortes no corpo e manchas avermelhadas.',
    idadeMinima: 8,
    idadeMaxima: 90,
    categoria: 'saude',
    peso: 70,
    opcoes: [
      {
        id: 'opt_upa_hidratacao',
        texto: 'Ir direto ao posto/UPA, tomar soro na veia e repousar totalmente',
        descricaoResultado: 'Com muito repouso, água de coco e cuidados médicos, você se recuperou completamente em duas semanas!',
        consequencias: {
          stats: { saude: -10, felicidade: -5 },
          hiddenStats: { disciplina: 10 }
        }
      },
      {
        id: 'opt_teimosia_trabalhar',
        texto: 'Tentar trabalhar mesmo passando mal com febre',
        descricaoResultado: 'Seu quadro se agravou e você precisou de vários dias de atestado médico.',
        consequencias: {
          stats: { saude: -25, felicidade: -15 },
          hiddenStats: { estresse: 20 }
        }
      }
    ]
  },
  {
    id: 'sau_dor_lombar_homeoffice',
    titulo: 'Coluna e Ergonomia',
    descricao: 'Passar horas sentado em cadeira inadequada começou a cobrar o preço: suas costas estão travadas e doendo.',
    idadeMinima: 22,
    idadeMaxima: 80,
    categoria: 'saude',
    peso: 75,
    opcoes: [
      {
        id: 'opt_pilates_alongamento',
        texto: 'Comprar uma cadeira ergonômica e começar aulas de pilates/alongamento',
        descricaoResultado: 'Suas dores sumiram e sua postura corporal ficou ereta e elegante!',
        consequencias: {
          stats: { saude: 15, felicidade: 10, aparencia: 5 },
          dinheiro: -650,
          hiddenStats: { condicionamentoFisico: 12, estresse: -15 }
        }
      },
      {
        id: 'opt_remedio_apenas',
        texto: 'Apenas tomar analgésico e ignorar a postura',
        descricaoResultado: 'O remédio aliviou na hora, mas a dor volta sempre que você senta.',
        consequencias: {
          stats: { saude: -5, felicidade: -5 },
          dinheiro: -40
        }
      }
    ]
  },
  {
    id: 'sau_corrida_parque',
    titulo: 'Domingo no Parque da Cidade',
    descricao: 'Uma manhã ensolarada e fresca convida para uma caminhada ou corrida ao ar livre no parque.',
    idadeMinima: 14,
    idadeMaxima: 85,
    categoria: 'saude',
    peso: 75,
    opcoes: [
      {
        id: 'opt_correr_5k',
        texto: 'Calçar o tênis, correr 5 km e tomar água de coco gelada na saída',
        descricaoResultado: 'A endorfina tomou conta do seu corpo e você se sentiu com disposição infinita!',
        consequencias: {
          stats: { saude: 12, felicidade: 18 },
          dinheiro: -15,
          hiddenStats: { condicionamentoFisico: 15, estresse: -20 }
        }
      },
      {
        id: 'opt_pastel_feira',
        texto: 'Fazer uma caminhada leve e parar na feira para comer pastel com caldo de cana',
        descricaoResultado: 'Uma verdadeira iguaria da cultura brasileira! A alma ficou feliz da vida!',
        consequencias: {
          stats: { felicidade: 20, saude: 2 },
          dinheiro: -25,
          hiddenStats: { estresse: -15 }
        }
      }
    ]
  }
];
