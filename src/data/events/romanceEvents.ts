import { GameEvent } from '../../types';

export const ROMANCE_EVENTS: GameEvent[] = [
  {
    id: 'rom_surpresa_jantar',
    titulo: 'Jantar Romântico à Luz de Velas',
    descricao: 'Seu(Sua) parceiro(a) faz aniversário e você planeja uma surpresa especial para celebrar o amor de vocês.',
    idadeMinima: 18,
    idadeMaxima: 80,
    categoria: 'romance',
    peso: 80,
    taxonomia: 'acontecimento_puro',
    natureza: 'acontecimento',
    condicoes: {
      temParceiro: true
    },
    opcoes: [
      {
        id: 'opt_restaurante_especial',
        texto: '',
        descricaoResultado: 'A noite foi mágica e apaixonada! A cumplicidade entre vocês se fortaleceu ainda mais.',
        descricaoMemoria: 'Teve uma noite de jantar à luz de velas que aproximou vocês dois.',
        consequencias: {
          stats: { felicidade: 25 },
          dinheiro: -350,
          relacionamentoDelta: { delta: 25 },
          hiddenStats: { empatia: 15 }
        }
      },
      {
        id: 'opt_cozinhar_em_casa',
        texto: '',
        descricaoResultado: 'O jantar caseiro foi íntimo, delicioso e cheio de risadas carinhosas.',
        consequencias: {
          stats: { felicidade: 20 },
          dinheiro: -90,
          relacionamentoDelta: { delta: 20 },
          hiddenStats: { empatia: 12 }
        }
      }
    ]
  },
  {
    id: 'rom_discussao_toalha',
    titulo: 'Pequenos Atritos da Convivência',
    descricao: 'Uma toalha molhada em cima da cama desencadeia uma discussão sobre a divisão das tarefas da casa.',
    idadeMinima: 20,
    idadeMaxima: 80,
    categoria: 'romance',
    peso: 70,
    taxonomia: 'acontecimento_puro',
    natureza: 'acontecimento',
    condicoes: {
      temParceiro: true
    },
    opcoes: [
      {
        id: 'opt_conversar_calmo',
        texto: '',
        descricaoResultado: 'Vocês se entenderam, riram da situação e criaram uma rotina justa para os dois.',
        consequencias: {
          stats: { felicidade: 10 },
          relacionamentoDelta: { delta: 12 },
          hiddenStats: { empatia: 15, disciplina: 10 }
        }
      },
      {
        id: 'opt_bater_boca',
        texto: '',
        descricaoResultado: 'Ficaram sem se falar o fim de semana inteiro em um silêncio pesado.',
        consequencias: {
          stats: { felicidade: -15 },
          relacionamentoDelta: { delta: -20 },
          hiddenStats: { estresse: 15 }
        }
      }
    ]
  },
  {
    id: 'rom_pedido_casamento',
    titulo: 'O Grande Passo: Pedido de Casamento',
    descricao: 'Vocês já namoram há um bom tempo e você sente no coração que encontrou o amor da sua vida.',
    idadeMinima: 22,
    idadeMaxima: 70,
    categoria: 'romance',
    peso: 85,
    taxonomia: 'decisao_comportamental',
    condicoes: {
      temParceiro: true
    },
    unico: true,
    opcoes: [
      {
        id: 'opt_comprar_aliancas',
        texto: 'Comprar um par de alianças e fazer uma proposta emocionante de joelhos',
        descricaoResultado: 'Com lágrimas nos olhos, a resposta foi SIM! A família inteira comemorou a união!',
        consequencias: {
          impactosComportamentais: { familia: 2, coragem: 1 },
          stats: { felicidade: 35 },
          dinheiro: -2200,
          relacionamentoDelta: { delta: 30 },
          adicionarFlag: 'casado_oficialmente'
        }
      },
      {
        id: 'opt_manter_namoro',
        texto: 'Continuar como está sem pressa para oficializar papéis',
        descricaoResultado: 'Vocês continuaram curtindo o namoro com leveza.',
        consequencias: {
          impactosComportamentais: { independencia: 1 },
          stats: { felicidade: 5 }
        }
      }
    ]
  }
];
