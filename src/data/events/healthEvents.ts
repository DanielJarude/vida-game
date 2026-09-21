import { GameEvent } from '../../types';

export const HEALTH_EVENTS: GameEvent[] = [
  {
    // B4-FIX3 item 7-9 — bug real do playtest: aos 8 anos apareceu a
    // opção "tentar trabalhar mesmo passando mal com febre", incompatível
    // com a idade, e a narrativa prescrevia tratamento médico específico
    // ("soro na veia") como se fosse regra universal. Corrigido na causa:
    // as opções agora variam por fase (infantil vs. adulta), com
    // `requisito.idadeMinima` revalidado pelo motor, e a linguagem passou
    // a descrever ATITUDES (avisar, procurar atendimento, descansar), não
    // procedimentos médicos.
    id: 'sau_dengue_sazonal',
    titulo: 'Surto de Dengue no Bairro',
    descricao: 'Após semanas de chuva e calor no verão, você acorda com febre alta, dores fortes no corpo e manchas avermelhadas.',
    idadeMinima: 6,
    idadeMaxima: 90,
    categoria: 'saude',
    peso: 70,
    taxonomia: 'decisao_comportamental',
    opcoes: [
      {
        id: 'opt_avisar_responsavel',
        texto: 'Avisar imediatamente um adulto responsável e aceitar ficar de repouso',
        descricaoResultado: 'Você avisou logo que passou mal. Levaram você para ser atendido e, com repouso e cuidado, você se recuperou.',
        consequencias: {
          impactosComportamentais: { familia: 1, disciplina: 1 },
          stats: { saude: -10, felicidade: -5 },
          hiddenStats: { disciplina: 10 }
        },
        requisito: { idadeMaxima: 12 }
      },
      {
        id: 'opt_esconder_mal_estar',
        texto: 'Tentar esconder que está passando mal para não perder a brincadeira',
        descricaoResultado: 'Você escondeu por um tempo, mas a febre piorou e acabou precisando de mais dias de repouso do que se tivesse avisado logo.',
        consequencias: {
          impactosComportamentais: { impulsividade: 2, disciplina: -1 },
          stats: { saude: -20, felicidade: -10 },
          hiddenStats: { estresse: 10 }
        },
        requisito: { idadeMaxima: 12 }
      },
      {
        id: 'opt_procurar_atendimento',
        texto: 'Procurar atendimento médico e seguir a orientação recebida',
        descricaoResultado: 'Com atendimento e repouso, você se recuperou completamente em duas semanas.',
        consequencias: {
          impactosComportamentais: { disciplina: 2 },
          stats: { saude: -10, felicidade: -5 },
          hiddenStats: { disciplina: 10 }
        },
        requisito: { idadeMinima: 13 }
      },
      {
        // Continuar trabalhando só é uma opção coerente para quem já pode
        // ter emprego (18+, mesma política do resto do jogo) — nunca para
        // um adolescente, e muito menos para uma criança.
        id: 'opt_teimosia_trabalhar',
        texto: 'Ignorar os sintomas e continuar trabalhando mesmo com febre',
        descricaoResultado: 'Seu quadro se agravou e você precisou de vários dias de atestado médico.',
        consequencias: {
          impactosComportamentais: { impulsividade: 2, disciplina: -1 },
          stats: { saude: -25, felicidade: -15 },
          hiddenStats: { estresse: 20 }
        },
        requisito: { idadeMinima: 18 }
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
    taxonomia: 'decisao_comportamental',
    opcoes: [
      {
        id: 'opt_pilates_alongamento',
        texto: 'Comprar uma cadeira ergonômica e começar aulas de pilates/alongamento',
        descricaoResultado: 'Suas dores sumiram e sua postura corporal ficou ereta e elegante!',
        consequencias: {
          impactosComportamentais: { disciplina: 2 },
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
          impactosComportamentais: { disciplina: -1 },
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
    taxonomia: 'acontecimento_puro',
    natureza: 'acontecimento',
    opcoes: [
      {
        id: 'opt_correr_5k',
        texto: '',
        descricaoResultado: 'A endorfina tomou conta do seu corpo e você se sentiu com disposição infinita!',
        consequencias: {
          stats: { saude: 12, felicidade: 18 },
          dinheiro: -15,
          hiddenStats: { condicionamentoFisico: 15, estresse: -20 }
        }
      },
      {
        id: 'opt_pastel_feira',
        texto: '',
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
