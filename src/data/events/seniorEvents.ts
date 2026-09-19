import { GameEvent } from '../../types';

export const SENIOR_EVENTS: GameEvent[] = [
  {
    id: 'sen_aposentadoria_inss',
    titulo: 'A Concessão da Aposentadoria',
    descricao: 'Após décadas de trabalho duro e contribuição ao INSS, sua carta de concessão de aposentadoria foi finalmente aprovada!',
    idadeMinima: 60,
    idadeMaxima: 72,
    categoria: 'trabalho',
    peso: 90,
    unico: true,
    opcoes: [
      {
        id: 'opt_comemorar_descanso',
        texto: 'Pendurar as chuteiras e aproveitar o merecido descanso',
        descricaoResultado: 'Você reuniu a família para um almoço comemorativo e agora tem todo o tempo do mundo para seus hobbies!',
        consequencias: {
          stats: { felicidade: 25, energia: 15 },
          hiddenStats: { estresse: -40, empatia: 10 },
          adicionarFlag: 'aposentado_inss'
        }
      },
      {
        id: 'opt_continuar_consultoria',
        texto: 'Continuar prestando consultorias ocasionais para se manter ativo',
        descricaoResultado: 'Você manteve a mente afiada e uma renda extra agradável todos os meses.',
        consequencias: {
          stats: { felicidade: 15, inteligencia: 8 },
          dinheiro: 2000,
          hiddenStats: { disciplina: 10, ambicao: 10 }
        }
      }
    ]
  },
  {
    id: 'sen_baile_terceira_idade',
    titulo: 'Baile dos Anos Dourados',
    descricao: 'O centro comunitário da cidade está promovendo um baile de forró e seresta para a terceira idade.',
    idadeMinima: 60,
    idadeMaxima: 88,
    categoria: 'cotidiano',
    peso: 75,
    opcoes: [
      {
        id: 'opt_dancar_forro',
        texto: 'Tirar o sapato de dança do armário e forrozear a noite toda',
        descricaoResultado: 'Você foi a sensação da pista! Seus passos de dança arrancaram aplausos de todos os presentes.',
        consequencias: {
          stats: { felicidade: 22, saude: 5, aparencia: 5 },
          hiddenStats: { sociabilidade: 20, condicionamentoFisico: 10, estresse: -20 }
        }
      },
      {
        id: 'opt_jogar_dominio',
        texto: 'Ficar na mesa jogando dominó e contando histórias de antigamente',
        descricaoResultado: 'Você deu muitas risadas relembrando causos da juventude.',
        consequencias: {
          stats: { felicidade: 15 },
          hiddenStats: { sociabilidade: 12 }
        }
      }
    ]
  },
  {
    id: 'sen_viagem_excursao',
    titulo: 'Excursão para Águas Termais',
    descricao: 'Seus amigos te convidam para uma viagem de ônibus de uma semana para relaxar nas piscinas de águas quentes em Caldas Novas ou Serra Gaúcha.',
    idadeMinima: 62,
    idadeMaxima: 85,
    categoria: 'cotidiano',
    peso: 70,
    opcoes: [
      {
        id: 'opt_viajar_excursao',
        texto: 'Embarcar na excursão e aproveitar a hidromassagem',
        descricaoResultado: 'As águas minerais fizeram maravilhas para suas articulações e sua alma voltou renovada!',
        consequencias: {
          stats: { saude: 12, felicidade: 20 },
          dinheiro: -1800,
          hiddenStats: { estresse: -30 }
        }
      },
      {
        id: 'opt_ficar_plantinhas',
        texto: 'Preferir ficar em casa cuidando da horta e das plantas',
        descricaoResultado: 'Suas orquídeas floresceram de forma deslumbrante no jardim.',
        consequencias: {
          stats: { felicidade: 10 },
          hiddenStats: { disciplina: 5 }
        }
      }
    ]
  },
  {
    id: 'sen_testamento_sabedoria',
    titulo: 'Organizando o Legado e Memórias',
    descricao: 'Você decide sentar para organizar seu álbum de memórias fotográficas e redigir uma carta de amor e conselhos para as próximas gerações.',
    idadeMinima: 68,
    idadeMaxima: 95,
    categoria: 'familia',
    peso: 80,
    unico: true,
    opcoes: [
      {
        id: 'opt_escrever_livro_vida',
        texto: 'Escrever as memórias e conselhos com todo o carinho',
        descricaoResultado: 'Seus familiares se emocionaram profundamente com suas palavras e seu exemplo de vida.',
        consequencias: {
          stats: { felicidade: 25 },
          relacionamentoDelta: { delta: 25 },
          hiddenStats: { empatia: 20, reputacao: 20 },
          adicionarFlag: 'deixou_livro_memorias'
        }
      },
      {
        id: 'opt_viver_presente',
        texto: 'Focar apenas em viver intensamente cada dia no presente',
        descricaoResultado: 'Você aproveitou a brisa da tarde tomando um cafezinho fresco com bolo de fubá.',
        consequencias: {
          stats: { felicidade: 15 },
          hiddenStats: { estresse: -15 }
        }
      }
    ]
  }
];
