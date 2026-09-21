/**
 * B4-FIX3 item 3 — mundo da primeira infância (0-2 anos).
 *
 * Antes deste PR, a faixa 0-2 tinha exatamente 1 evento em todo o
 * catálogo (`inf_primeiros_passos`, em `childhoodEvents.ts`). O playtest
 * apontou que a infância inicial parecia vazia e, quando havia conteúdo,
 * era quase sempre dentro de casa.
 *
 * Um bebê de 0-2 anos NÃO tem autonomia verbal, financeira ou física:
 * as opções aqui descrevem REAÇÕES (chorar, sorrir, esconder o rosto,
 * esticar os braços) e escolhas de cuidadores próximas o suficiente para
 * o bebê "participar" sem fingir uma capacidade que ele não tem. Nenhuma
 * opção envolve fala fluente, compras, presentes dados pelo bebê ou
 * trabalho — a regra explícita do PR.
 *
 * Cada evento tem 2+ opções genuinamente diferentes e ao menos um efeito
 * estruturado (impactosComportamentais, relacionamentoDelta, flag ou
 * stats) — nunca um "modal com uma resposta só".
 */

import { GameEvent } from '../../../types';

export const BABY_EVENTS: GameEvent[] = [
  {
    id: 'bb_estranhamento_visita',
    titulo: 'Visita de Parente Desconhecido',
    descricao: 'Uma tia que você nunca viu de perto se aproxima sorrindo e estica os braços para te pegar no colo.',
    idadeMinima: 0,
    idadeMaxima: 1,
    categoria: 'familia',
    peso: 70,
    taxonomia: 'acontecimento_puro',
    natureza: 'acontecimento',
    repeticao: { tipo: 'cooldown', cooldownAnos: 1 },
    opcoes: [
      {
        id: 'opt_chorar_estranho',
        texto: '',
        descricaoResultado: 'Você chorou e se agarrou em quem já conhecia. Depois de um tempo, curioso, voltou a olhar para a visita de longe.',
        consequencias: {
          stats: { felicidade: -3 },
          hiddenStats: { sociabilidade: -3 },
        }
      },
      {
        id: 'opt_sorrir_visita',
        texto: '',
        descricaoResultado: 'Você foi no colo sem estranhar nem um pouco, para a alegria de toda a família reunida.',
        consequencias: {
          stats: { felicidade: 8 },
          hiddenStats: { sociabilidade: 6 },
          relacionamentoDelta: { delta: 8 },
        }
      }
    ]
  },
  {
    id: 'bb_descoberta_espelho',
    titulo: 'O Bebê no Espelho',
    descricao: 'Sentado no chão da sala, você encontra seu próprio reflexo no espelho grande do corredor.',
    idadeMinima: 0,
    idadeMaxima: 2,
    categoria: 'infancia',
    peso: 65,
    taxonomia: 'acontecimento_puro',
    natureza: 'acontecimento',
    repeticao: { tipo: 'cooldown', cooldownAnos: 1 },
    opcoes: [
      {
        id: 'opt_rir_espelho',
        texto: '',
        descricaoResultado: 'Você riu tanto do "outro bebê" que toda a casa veio ver a cena.',
        consequencias: {
          stats: { felicidade: 10, inteligencia: 3 },
          hiddenStats: { sociabilidade: 3 }
        }
      },
      {
        id: 'opt_ignorar_espelho',
        texto: '',
        descricaoResultado: 'O espelho não te prendeu por muito tempo: um brinquedo no chão chamou mais sua atenção.',
        consequencias: {
          stats: { felicidade: 3, inteligencia: 1 },
        }
      }
    ]
  },
  {
    id: 'bb_febre_noite',
    titulo: 'Febre no Meio da Noite',
    descricao: 'Você acorda chorando de madrugada, quente e incomodado, e seus pais correm para o seu quarto.',
    idadeMinima: 0,
    idadeMaxima: 2,
    categoria: 'saude',
    peso: 60,
    taxonomia: 'acontecimento_puro',
    natureza: 'acontecimento',
    repeticao: { tipo: 'cooldown', cooldownAnos: 1 },
    opcoes: [
      {
        id: 'opt_colo_acalma',
        texto: '',
        descricaoResultado: 'No colo, entre cochilos, você foi se acalmando até a febre ceder já de manhã.',
        consequencias: {
          stats: { saude: 6, felicidade: 4 },
          relacionamentoDelta: { delta: 6 },
          hiddenStats: { empatia: 4 }
        }
      },
      {
        id: 'opt_chorar_muito',
        texto: '',
        descricaoResultado: 'Foi uma noite difícil para todo mundo, mas pela manhã a febre já tinha passado.',
        consequencias: {
          stats: { saude: 4, felicidade: -4 },
          hiddenStats: { estresse: 5 }
        }
      }
    ]
  },
  {
    id: 'bb_cachorro_familia',
    titulo: 'O Cachorro da Família se Aproxima',
    descricao: 'O cachorro da casa se aproxima devagar, farejando curioso o bebê sentado no tapete.',
    idadeMinima: 0,
    idadeMaxima: 2,
    categoria: 'infancia',
    peso: 40,
    taxonomia: 'acontecimento_puro',
    natureza: 'acontecimento',
    // Sem exigir a flag `tem_animal_estimacao` (que só é concedida por um
    // evento de infância tardia): aqui assume-se que a família já pode
    // ter um animal antes do jogo começar — situação comum e plausível,
    // sem inventar um sistema de "pet desde o nascimento".
    repeticao: { tipo: 'cooldown', cooldownAnos: 1 },
    opcoes: [
      {
        id: 'opt_estender_mao_cachorro',
        texto: '',
        descricaoResultado: 'Vocês dois se entenderam bem: o cachorro deitou do seu lado, protetor.',
        consequencias: {
          stats: { felicidade: 8 },
          hiddenStats: { empatia: 5 },
        }
      },
      {
        id: 'opt_assustar_cachorro',
        texto: '',
        descricaoResultado: 'Você chorou, o cachorro recuou na hora, e seus pais vieram acalmar os dois.',
        consequencias: {
          stats: { felicidade: -3 },
          hiddenStats: { sociabilidade: -2 }
        }
      }
    ]
  },
  {
    id: 'bb_parquinho_bebes',
    titulo: 'Tarde no Parquinho para Bebês',
    descricao: 'No gramado do parque, um grupo de bebês da mesma idade está sentado em um cercadinho de brinquedos macios.',
    idadeMinima: 1,
    idadeMaxima: 2,
    categoria: 'amizade',
    peso: 60,
    taxonomia: 'acontecimento_puro',
    natureza: 'acontecimento',
    repeticao: { tipo: 'cooldown', cooldownAnos: 1 },
    opcoes: [
      {
        id: 'opt_brincar_outros_bebes',
        texto: '',
        descricaoResultado: 'Teve choro e disputa pelo brinquedo, mas também muita risada — sua primeira lembrança de "outras crianças".',
        consequencias: {
          stats: { felicidade: 8 },
          hiddenStats: { sociabilidade: 6 },
        }
      },
      {
        id: 'opt_observar_de_longe',
        texto: '',
        descricaoResultado: 'Você passou a tarde agarrado à perna de quem cuida de você, observando os outros bebês de longe antes de se aproximar.',
        consequencias: {
          stats: { felicidade: 4 },
          hiddenStats: { sociabilidade: 1 },
        }
      }
    ]
  },
  {
    id: 'bb_musica_dança',
    titulo: 'Música Alta na Cozinha',
    descricao: 'Alguém liga o rádio na cozinha e uma música animada toca enquanto prepara o almoço.',
    idadeMinima: 1,
    idadeMaxima: 2,
    categoria: 'cotidiano',
    peso: 55,
    taxonomia: 'acontecimento_puro',
    natureza: 'acontecimento',
    repeticao: { tipo: 'recorrente', cooldownAnos: 2 },
    opcoes: [
      {
        id: 'opt_dancar_musica',
        texto: '',
        descricaoResultado: 'Sua dancinha desengonçada arrancou risada de todo mundo em casa.',
        consequencias: {
          stats: { felicidade: 10, saude: 2 },
          hiddenStats: { sociabilidade: 4, condicionamentoFisico: 3 }
        }
      },
      {
        id: 'opt_bater_palma_musica',
        texto: '',
        descricaoResultado: 'Você marcou o ritmo com as mãozinhas, satisfeito só de participar do jeito seguro.',
        consequencias: {
          stats: { felicidade: 6 },
          hiddenStats: { disciplina: 2 }
        }
      }
    ]
  },
  {
    id: 'bb_primeira_palavra',
    titulo: 'A Primeira Palavra',
    descricao: 'Depois de meses balbuciando sons, uma palavra clara sai da sua boca pela primeira vez.',
    idadeMinima: 1,
    idadeMaxima: 2,
    categoria: 'infancia',
    peso: 85,
    taxonomia: 'escolha_biografica',
    natureza: 'acontecimento',
    unico: true,
    repeticao: { tipo: 'marco' },
    opcoes: [
      {
        id: 'opt_palavra_mae_pai',
        texto: 'Dizer o nome de quem cuida de você todos os dias',
        descricaoResultado: 'A palavra saiu meio embolada, mas todo mundo entendeu — e ninguém mais esqueceu aquele dia.',
        consequencias: {
          stats: { felicidade: 15, inteligencia: 5 },
          relacionamentoDelta: { delta: 12 },
        }
      },
      {
        id: 'opt_palavra_objeto',
        texto: 'Apontar e nomear um objeto que você queria muito',
        descricaoResultado: 'Sua primeira palavra foi bem prática: o nome exato da coisa que você queria naquele momento.',
        consequencias: {
          stats: { felicidade: 12, inteligencia: 6 },
        }
      }
    ]
  },
  {
    id: 'bb_queda_leve',
    titulo: 'Tombo Aprendendo a Andar',
    descricao: 'Tentando dar mais um passo sozinho, você perde o equilíbrio e cai sentado no tapete.',
    idadeMinima: 1,
    idadeMaxima: 2,
    categoria: 'infancia',
    peso: 60,
    taxonomia: 'acontecimento_puro',
    natureza: 'acontecimento',
    repeticao: { tipo: 'recorrente', cooldownAnos: 1 },
    opcoes: [
      {
        id: 'opt_levantar_tentar_de_novo',
        texto: '',
        descricaoResultado: 'Você se levantou na mesma hora e tentou outra vez, para o orgulho de quem estava assistindo.',
        consequencias: {
          stats: { felicidade: 6, saude: -1 },
          hiddenStats: { condicionamentoFisico: 4 },
        }
      },
      {
        id: 'opt_chorar_colo_tombo',
        texto: '',
        descricaoResultado: 'Você chorou um pouco, recebeu um colo de conforto, e só depois voltou a tentar andar.',
        consequencias: {
          stats: { felicidade: 2 },
          relacionamentoDelta: { delta: 4 },
          hiddenStats: { empatia: 2 }
        }
      }
    ]
  }
];
