/**
 * B4-FIX3 item 3 — mundo dos 3-5 anos além da família.
 *
 * A faixa 3-5 já tinha `inf_birra_brinquedo` e `inf_gatinho_rua`
 * (childhoodEvents.ts) — ambos dentro de casa/com a família. Este módulo
 * abre parquinho, creche/pré-escola, outras crianças e pequenos medos,
 * sem nenhuma competição de atributos: as opções descrevem reações
 * plausíveis para essa idade (compartilhar, disputar, ter medo, encarar).
 */

import { GameEvent } from '../../../types';

export const TODDLER_WORLD_EVENTS: GameEvent[] = [
  {
    id: 'crc_primeiro_dia_creche',
    titulo: 'Primeiro Dia na Creche',
    descricao: 'Você chega pela primeira vez à creche, com uma sala cheia de crianças desconhecidas e brinquedos coloridos.',
    idadeMinima: 3,
    idadeMaxima: 4,
    categoria: 'escola',
    peso: 90,
    natureza: 'acontecimento',
    unico: true,
    opcoes: [
      {
        id: 'opt_explorar_creche',
        texto: 'Largar a mão de quem te deixou lá e ir direto para os brinquedos',
        descricaoResultado: 'Você nem olhou para trás — foi direto brincar e voltou para casa contando tudo animado.',
        consequencias: {
          stats: { felicidade: 12 },
          hiddenStats: { sociabilidade: 10 },
        }
      },
      {
        id: 'opt_chorar_creche',
        texto: 'Chorar agarrado até a professora se aproximar com carinho',
        descricaoResultado: 'Você chorou bastante na despedida, mas a professora conseguiu te acalmar com uma brincadeira.',
        consequencias: {
          stats: { felicidade: -5 },
          hiddenStats: { empatia: 3 }
        }
      }
    ]
  },
  {
    id: 'prc_disputar_balanco',
    titulo: 'A Fila do Balanço no Parquinho',
    descricao: 'Só tem um balanço livre no parquinho e outra criança da sua idade chega correndo ao mesmo tempo que você.',
    idadeMinima: 3,
    idadeMaxima: 6,
    categoria: 'amizade',
    peso: 80,
    repeticao: { tipo: 'cooldown', cooldownAnos: 2 },
    opcoes: [
      {
        id: 'opt_propor_revezar_balanco',
        texto: 'Propor revezar contando até vinte para cada um',
        descricaoResultado: 'A outra criança topou na hora e vocês dois se divertiram revezando o balanço a tarde toda.',
        consequencias: {
          stats: { felicidade: 12 },
          hiddenStats: { sociabilidade: 8, empatia: 5 },
          impactosComportamentais: { sociabilidade: 1, generosidade: 1 }
        }
      },
      {
        id: 'opt_correr_pegar_balanco',
        texto: 'Correr mais rápido para pegar o balanço primeiro',
        descricaoResultado: 'Você chegou primeiro, mas a outra criança ficou emburrada o resto da tarde.',
        consequencias: {
          stats: { felicidade: 8 },
          hiddenStats: { sociabilidade: -3 },
          impactosComportamentais: { impulsividade: 1 }
        }
      },
      {
        id: 'opt_desistir_balanco',
        texto: 'Desistir e ir brincar em outro brinquedo',
        descricaoResultado: 'Você não quis briga: foi para o escorregador e nem lembrou mais do balanço.',
        consequencias: {
          stats: { felicidade: 6 },
          hiddenStats: { empatia: 2 },
          impactosComportamentais: { independencia: 1 }
        }
      }
    ]
  },
  {
    id: 'prc_medo_escuro',
    titulo: 'Medo do Escuro',
    descricao: 'Na hora de dormir, o quarto fica escuro demais e você tem certeza de que tem algo se mexendo no armário.',
    idadeMinima: 3,
    idadeMaxima: 5,
    categoria: 'cotidiano',
    peso: 75,
    natureza: 'acontecimento',
    repeticao: { tipo: 'recorrente', cooldownAnos: 2 },
    opcoes: [
      {
        id: 'opt_pedir_luz_acesa',
        texto: 'Pedir para deixar uma luzinha acesa e dormir tranquilo',
        descricaoResultado: 'Com a luzinha de plantão, você dormiu tranquilo a noite inteira.',
        consequencias: {
          stats: { felicidade: 6 },
          hiddenStats: { estresse: -5 }
        }
      },
      {
        id: 'opt_encarar_armario',
        texto: 'Levantar sozinho e abrir o armário para provar que não tem nada lá',
        descricaoResultado: 'Você encarou o "monstro" e descobriu que era só um casaco pendurado. Ficou orgulhoso de si mesmo.',
        consequencias: {
          stats: { felicidade: 10 },
          hiddenStats: { estresse: -3 },
        }
      }
    ]
  },
  {
    id: 'prc_dividir_brinquedo',
    titulo: 'Um Brinquedo Só para Dois',
    descricao: 'Você e outra criança da vizinhança querem o mesmo carrinho de brinquedo ao mesmo tempo.',
    idadeMinima: 3,
    idadeMaxima: 6,
    categoria: 'amizade',
    peso: 75,
    repeticao: { tipo: 'cooldown', cooldownAnos: 2 },
    opcoes: [
      {
        id: 'opt_dividir_carrinho',
        texto: 'Propor brincar junto, cada um empurrando de um lado',
        descricaoResultado: 'A brincadeira ficou ainda mais divertida com os dois inventando uma corrida.',
        consequencias: {
          stats: { felicidade: 12 },
          hiddenStats: { sociabilidade: 8, empatia: 6 },
          impactosComportamentais: { generosidade: 1, sociabilidade: 1 }
        }
      },
      {
        id: 'opt_nao_dividir_carrinho',
        texto: 'Segurar o carrinho com força e não deixar a outra criança pegar',
        descricaoResultado: 'A outra criança foi chorar longe, e você ficou brincando sozinho com o carrinho.',
        consequencias: {
          stats: { felicidade: 4 },
          hiddenStats: { sociabilidade: -5, empatia: -3 },
          impactosComportamentais: { impulsividade: 1 }
        }
      }
    ]
  },
  {
    id: 'prc_aniversario_amiguinho',
    titulo: 'Festa de Aniversário de um Coleguinha',
    descricao: 'Você foi convidado para o aniversário de um coleguinha da creche, com pula-pula e bolo de chocolate.',
    idadeMinima: 3,
    idadeMaxima: 5,
    categoria: 'amizade',
    peso: 70,
    natureza: 'acontecimento',
    repeticao: { tipo: 'cooldown', cooldownAnos: 2 },
    opcoes: [
      {
        id: 'opt_brincar_pulapula',
        texto: 'Passar a festa inteira pulando no pula-pula com as outras crianças',
        descricaoResultado: 'Você voltou para casa exausto e feliz, cheirando a bolo de chocolate.',
        consequencias: {
          stats: { felicidade: 15, saude: 2 },
          hiddenStats: { sociabilidade: 8, condicionamentoFisico: 3 }
        }
      },
      {
        id: 'opt_ficar_perto_pais',
        texto: 'Ficar perto de quem te levou, observando a festa de longe',
        descricaoResultado: 'Você levou um tempo para se soltar, mas no fim comeu um pedaço de bolo bem tranquilo.',
        consequencias: {
          stats: { felicidade: 6 },
          hiddenStats: { sociabilidade: 1 }
        }
      }
    ]
  },
  {
    id: 'prc_curiosidade_bicho',
    titulo: 'Um Inseto Estranho no Quintal',
    descricao: 'Explorando o quintal, você encontra um inseto grande e diferente andando devagar na terra.',
    idadeMinima: 3,
    idadeMaxima: 6,
    categoria: 'infancia',
    peso: 65,
    natureza: 'acontecimento',
    repeticao: { tipo: 'cooldown', cooldownAnos: 2 },
    opcoes: [
      {
        id: 'opt_observar_inseto',
        texto: 'Agachar bem de perto para observar cada detalhe',
        descricaoResultado: 'Você ficou minutos observando o inseto andar, fazendo perguntas sobre ele para quem estava por perto.',
        consequencias: {
          stats: { inteligencia: 5, felicidade: 6 },
          hiddenStats: { empatia: 2 },
        }
      },
      {
        id: 'opt_fugir_inseto',
        texto: 'Sair correndo e gritando por causa do bicho',
        descricaoResultado: 'Você saiu correndo e só voltou ao quintal depois que alguém prometeu que o inseto tinha ido embora.',
        consequencias: {
          stats: { felicidade: -2 },
          hiddenStats: { estresse: 3 }
        }
      }
    ]
  },
  {
    id: 'prc_primeira_regra_casa',
    titulo: 'Arrumar os Brinquedos Sozinho',
    descricao: 'Depois de espalhar brinquedos pela sala inteira, chegou a hora de guardar tudo antes do jantar.',
    idadeMinima: 4,
    idadeMaxima: 5,
    categoria: 'cotidiano',
    peso: 70,
    repeticao: { tipo: 'recorrente', cooldownAnos: 2 },
    opcoes: [
      {
        id: 'opt_guardar_brinquedos',
        texto: 'Guardar tudo caprichando na caixa de brinquedos',
        descricaoResultado: 'Você guardou tudo sozinho e ganhou um elogio por ser tão organizado para a idade.',
        consequencias: {
          stats: { felicidade: 6 },
          hiddenStats: { disciplina: 8 },
          impactosComportamentais: { disciplina: 1 }
        }
      },
      {
        id: 'opt_fingir_cansaco',
        texto: 'Fingir que está com muito sono para não precisar guardar nada',
        descricaoResultado: 'Ninguém acreditou muito no sono repentino, mas alguém acabou guardando os brinquedos por você.',
        consequencias: {
          stats: { felicidade: 4 },
          hiddenStats: { disciplina: -5 },
          impactosComportamentais: { disciplina: -1 }
        }
      }
    ]
  }
];
