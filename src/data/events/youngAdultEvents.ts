import { GameEvent } from '../../types';

export const YOUNG_ADULT_EVENTS: GameEvent[] = [
  {
    id: 'jov_morar_sozinho',
    titulo: 'Saindo da Casa dos Pais',
    descricao: 'Você decide que é hora de ter seu próprio espaço e aluga sua primeira kitnet/república.',
    idadeMinima: 19,
    idadeMaxima: 26,
    categoria: 'cotidiano',
    peso: 80,
    taxonomia: 'decisao_comportamental',
    unico: true,
    opcoes: [
      {
        id: 'opt_independencia',
        texto: 'Mudar com as malas, cozinhar seu próprio rango e bancar as contas',
        descricaoResultado: 'A liberdade é maravilhosa, embora lavar louça e pagar boleto seja um choque de realidade!',
        consequencias: {
          impactosComportamentais: { independencia: 2 },
          stats: { felicidade: 15 },
          dinheiro: -1500,
          hiddenStats: { disciplina: 20, ambicao: 15 },
          adicionarFlag: 'mora_sozinho'
        }
      },
      {
        id: 'opt_ficar_pais',
        texto: 'Continuar morando com os pais para economizar dinheiro',
        descricaoResultado: 'Você aproveitou a comidinha caseira e juntou mais dinheiro na conta.',
        consequencias: {
          impactosComportamentais: { familia: 2, independencia: -1 },
          stats: { felicidade: 5 },
          dinheiro: 1000,
          relacionamentoDelta: { delta: 10 }
        }
      }
    ]
  },
  {
    id: 'jov_carnaval_rua',
    titulo: 'Carnaval de Rua e Bloquinho',
    descricao: 'Chegou o Carnaval brasileiro! Seus amigos compraram fantasias e te convidaram para passar quatro dias atrás dos trios e bloquinhos.',
    idadeMinima: 18,
    idadeMaxima: 30,
    categoria: 'cotidiano',
    peso: 75,
    taxonomia: 'acontecimento_puro',
    natureza: 'acontecimento',
    opcoes: [
      {
        id: 'opt_folia_total',
        texto: '',
        descricaoResultado: 'Você cantou marchinhas até perder a voz, beijou na boca e viveu a alma da cultura brasileira!',
        consequencias: {
          stats: { felicidade: 25 },
          dinheiro: -350,
          hiddenStats: { sociabilidade: 25, reputacao: 10 }
        }
      },
      {
        id: 'opt_feriado_descanso',
        texto: '',
        descricaoResultado: 'Você descansou plenamente, zerou suas séries favoritas e renovou as energias.',
        consequencias: {
          stats: { saude: 10, felicidade: 10 },
          hiddenStats: { estresse: -20 }
        }
      }
    ]
  },
  {
    id: 'jov_amigo_emprestimo',
    titulo: 'O Amigo que Pede Dinheiro Emprestado',
    descricao: 'Um grande amigo seu de infância liga aflito dizendo que o carro quebrou e precisa de R$ 800 emprestados para o mecânico.',
    idadeMinima: 20,
    idadeMaxima: 32,
    categoria: 'amizade',
    peso: 70,
    taxonomia: 'decisao_comportamental',
    condicoes: {
      dinheiroMinimo: 800
    },
    opcoes: [
      {
        id: 'opt_emprestar_confiante',
        texto: 'Emprestar o dinheiro por consideração à amizade',
        descricaoResultado: 'Ele ficou imensamente agradecido e te pagou de volta alguns meses depois com um chocolate.',
        descricaoMemoria: 'Emprestou dinheiro a um amigo e recebeu de volta meses depois, com um chocolate junto.',
        consequencias: {
          impactosComportamentais: { generosidade: 2 },
          stats: { felicidade: 10 },
          dinheiro: 0,
          hiddenStats: { empatia: 15, reputacao: 15 }
        }
      },
      {
        id: 'opt_dar_desculpa',
        texto: 'Dizer que está apertado e não pode ajudar no momento',
        descricaoResultado: 'Ele compreendeu, mas o clima entre vocês ficou um pouco mais distante.',
        descricaoMemoria: 'Não emprestou o dinheiro que um amigo pediu e a relação esfriou um pouco.',
        consequencias: {
          impactosComportamentais: { generosidade: -1 },
          stats: { felicidade: -2 },
          hiddenStats: { empatia: -5 }
        }
      }
    ]
  },
  {
    id: 'jov_proposta_outra_cidade',
    titulo: 'Proposta de Trabalho em Outra Cidade',
    descricao: 'Uma empresa conceituada de outra capital brasileira entra em contato oferecendo um cargo com 40% a mais de remuneração.',
    idadeMinima: 22,
    idadeMaxima: 35,
    categoria: 'trabalho',
    peso: 65,
    taxonomia: 'decisao_comportamental',
    condicoes: {
      empregado: true
    },
    opcoes: [
      {
        id: 'opt_mudar_cidade',
        texto: 'Aceitar o desafio e mudar de cidade para alavancar a carreira',
        descricaoResultado: 'A mudança foi intensa, mas seu novo cargo trouxe grande reconhecimento profissional!',
        consequencias: {
          impactosComportamentais: { independencia: 2, coragem: 1 },
          stats: { felicidade: 12 },
          dinheiro: 2500,
          hiddenStats: { ambicao: 20, disciplina: 10, estresse: 10 },
          adicionarFlag: 'mudou_de_cidade_carreira'
        }
      },
      {
        id: 'opt_recusar_proposta',
        texto: 'Recusar para ficar perto da família e dos amigos',
        descricaoResultado: 'Você valorizou suas raízes e continuou sua vida na sua cidade natal.',
        consequencias: {
          impactosComportamentais: { familia: 2 },
          stats: { felicidade: 8 },
          hiddenStats: { empatia: 10 }
        }
      }
    ]
  },
  {
    id: 'jov_reveillon_praia',
    titulo: 'Réveillon no Litoral com Amigos',
    descricao: 'A virada do ano chegou e o grupo de amigos alugou uma casa na praia para passar o Réveillon de roupa branca e pular as sete ondas.',
    idadeMinima: 19,
    idadeMaxima: 29,
    categoria: 'cotidiano',
    peso: 75,
    taxonomia: 'acontecimento_puro',
    natureza: 'acontecimento',
    opcoes: [
      {
        id: 'opt_pular_ondas',
        texto: '',
        descricaoResultado: 'Os fogos de artifício no mar foram deslumbrantes! Você fez seus desejos para o novo ano com muita energia positiva.',
        consequencias: {
          stats: { felicidade: 25 },
          dinheiro: -600,
          hiddenStats: { sociabilidade: 15, estresse: -25 }
        }
      },
      {
        id: 'opt_passar_em_familia',
        texto: '',
        descricaoResultado: 'Foi uma ceia acolhedora, com abraços apertados e muito afeto.',
        descricaoMemoria: 'Passou o Réveillon em casa, com a família, numa ceia tranquila.',
        consequencias: {
          stats: { felicidade: 15 },
          relacionamentoDelta: { delta: 15 },
          hiddenStats: { empatia: 10 }
        }
      }
    ]
  }
];
