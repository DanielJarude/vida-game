import { GameEvent } from '../../types';

export const ADULT_EVENTS: GameEvent[] = [
  {
    id: 'adu_reforma_casa',
    titulo: 'A Grande Reforma na Casa',
    descricao: 'As paredes estão descascando e a cozinha precisa de azulejos novos. Um pedreiro de confiança te passa o orçamento.',
    idadeMinima: 30,
    idadeMaxima: 55,
    categoria: 'dinheiro',
    peso: 70,
    opcoes: [
      {
        id: 'opt_reformar_completo',
        texto: 'Fazer a reforma completa com piso de porcelanato e pintura nova',
        descricaoResultado: 'Foram semanas de poeira e barulho de martelete, mas a casa ficou impecável e muito valorizada!',
        consequencias: {
          impactosComportamentais: { impulsividade: 1 },
          stats: { felicidade: 18, aparencia: 5 },
          dinheiro: -12000,
          hiddenStats: { reputacao: 10 }
        }
      },
      {
        id: 'opt_dar_um_tapa',
        texto: 'Apenas pintar a sala e trocar duas lâmpadas você mesmo',
        descricaoResultado: 'Você economizou uma boa quantia e o ambiente ficou renovado.',
        consequencias: {
          impactosComportamentais: { disciplina: 1 },
          stats: { felicidade: 8 },
          dinheiro: -800,
          hiddenStats: { disciplina: 5 }
        }
      }
    ]
  },
  {
    id: 'adu_crise_meia_idade',
    titulo: 'Reflexões da Meia-Idade',
    descricao: 'Ao olhar no espelho e notar os primeiros fios de cabelo branco, você para para refletir sobre tudo o que construiu e os sonhos que ainda não realizou.',
    idadeMinima: 40,
    idadeMaxima: 52,
    categoria: 'cotidiano',
    peso: 80,
    unico: true,
    opcoes: [
      {
        id: 'opt_novo_hobby_esporte',
        texto: 'Começar a correr meia-maratona e cuidar do corpo',
        descricaoResultado: 'Você encontrou uma vitalidade que nem sabia que tinha! Seu condicionamento físico melhorou absurdamente.',
        consequencias: {
          impactosComportamentais: { disciplina: 2 },
          stats: { saude: 15, felicidade: 15, aparencia: 10 },
          hiddenStats: { condicionamentoFisico: 20, disciplina: 15, estresse: -15 }
        }
      },
      {
        id: 'opt_comprar_carro',
        texto: 'Comprar um carro mais esportivo para curtir a vida',
        descricaoResultado: 'Você desfilou de vidros abertos sentindo o vento no rosto e um sorriso no rosto!',
        consequencias: {
          impactosComportamentais: { impulsividade: 2 },
          stats: { felicidade: 20, aparencia: 8 },
          dinheiro: -15000,
          hiddenStats: { reputacao: 10 }
        }
      },
      {
        id: 'opt_aceitar_maturidade',
        texto: 'Abraçar a maturidade com gratidão e serenidade',
        descricaoResultado: 'Você alcançou uma paz interior sólida e valorizou cada momento com quem ama.',
        consequencias: {
          impactosComportamentais: { empatia: 1 },
          stats: { felicidade: 18 },
          hiddenStats: { empatia: 15, estresse: -25 }
        }
      }
    ]
  },
  {
    id: 'adu_oportunidade_negocio',
    titulo: 'Sociedade em um Novo Negócio',
    descricao: 'Um colega experiente convida você para entrar como sócio investidor em uma franquia promissora na sua cidade.',
    idadeMinima: 32,
    idadeMaxima: 58,
    categoria: 'trabalho',
    peso: 65,
    condicoes: {
      dinheiroMinimo: 20000
    },
    opcoes: [
      {
        id: 'opt_entrar_socio',
        texto: 'Investir R$ 20.000 e tornar-se sócio do empreendimento',
        descricaoResultado: 'A franquia foi um sucesso retumbante no primeiro ano e gerou dividendos generosos!',
        consequencias: {
          impactosComportamentais: { coragem: 2, impulsividade: 1 },
          stats: { felicidade: 20 },
          dinheiro: 35000,
          hiddenStats: { ambicao: 25, reputacao: 15, estresse: 10 },
          adicionarFlag: 'socio_empresario'
        }
      },
      {
        id: 'opt_ficar_na_seguranca',
        texto: 'Agradecer o convite e manter seu dinheiro seguro em investimentos conservadores',
        descricaoResultado: 'Você preferiu não arriscar seu patrimônio e manteve a tranquilidade.',
        consequencias: {
          impactosComportamentais: { disciplina: 1, coragem: -1 },
          stats: { felicidade: 5 },
          hiddenStats: { disciplina: 10 }
        }
      }
    ]
  },
  {
    id: 'adu_churrasco_natal',
    titulo: 'O Tradicional Natal em Família',
    descricao: 'A família inteira se reuniu na sua casa para o Natal. Tem tio do pavê, crianças correndo e a famosa discussão política na hora da sobremesa.',
    idadeMinima: 30,
    idadeMaxima: 65,
    categoria: 'familia',
    peso: 75,
    natureza: 'acontecimento',
    opcoes: [
      {
        id: 'opt_apaziguar_festa',
        texto: 'Contar uma piada engraçada, servir mais pudim e tocar música para descontrair',
        descricaoResultado: 'Todo mundo caiu na gargalhada e a festa terminou com um abraço coletivo emocionado!',
        consequencias: {
          stats: { felicidade: 20 },
          relacionamentoDelta: { delta: 18 },
          hiddenStats: { sociabilidade: 15, empatia: 15 }
        }
      },
      {
        id: 'opt_entrar_no_debate',
        texto: 'Entrar na discussão com argumentos inflamados',
        descricaoResultado: 'A discussão rendeu até a madrugada e um tio saiu emburrado antes do amigo secreto.',
        consequencias: {
          stats: { felicidade: -8 },
          relacionamentoDelta: { delta: -8 },
          hiddenStats: { estresse: 15 }
        }
      }
    ]
  }
];
