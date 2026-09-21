/**
 * B4-FIX3 item 3 — mundo escolar/social dos 6-11 anos.
 *
 * `childhoodEvents.ts` (B4/B4-FIX) já cobria escola/amizade/futebol/
 * ciências/bullying; este módulo soma contextos que ainda não existiam
 * nessa faixa: esporte competitivo, hobby fora da escola, comunidade/
 * vizinhança, tecnologia apropriada à idade e honestidade — todos fora
 * do núcleo familiar direto.
 */

import { GameEvent } from '../../../types';

export const SCHOOL_WORLD_EVENTS: GameEvent[] = [
  {
    id: 'esp_selecao_natacao',
    titulo: 'Seleção para o Time de Natação da Escola',
    descricao: 'A professora de educação física está escolhendo os alunos para representar a escola em um torneio de natação.',
    idadeMinima: 7,
    idadeMaxima: 11,
    categoria: 'esporte',
    peso: 70,
    taxonomia: 'decisao_comportamental',
    repeticao: { tipo: 'cooldown', cooldownAnos: 2 },
    opcoes: [
      {
        id: 'opt_treinar_forte_natacao',
        texto: 'Treinar todo dia depois da aula para tentar entrar no time',
        descricaoResultado: 'Você entrou no time titular e vai representar a escola no torneio regional!',
        consequencias: {
          stats: { saude: 10, felicidade: 12 },
          hiddenStats: { condicionamentoFisico: 15, disciplina: 8, reputacao: 10 },
          impactosComportamentais: { disciplina: 1, coragem: 1 }
        }
      },
      {
        id: 'opt_torcer_de_fora',
        texto: 'Preferir ficar na torcida em vez de competir',
        descricaoResultado: 'Você não entrou no time, mas foi o torcedor mais animado de todo o torneio.',
        consequencias: {
          stats: { felicidade: 8 },
          hiddenStats: { sociabilidade: 6 },
          impactosComportamentais: { sociabilidade: 1 }
        }
      }
    ]
  },
  {
    id: 'hob_aula_desenho',
    titulo: 'Curso Livre de Desenho no Centro Comunitário',
    descricao: 'O centro comunitário do bairro abriu vagas gratuitas para um curso de desenho aos sábados de manhã.',
    idadeMinima: 7,
    idadeMaxima: 12,
    categoria: 'hobby',
    peso: 65,
    taxonomia: 'decisao_comportamental',
    repeticao: { tipo: 'cooldown', cooldownAnos: 3 },
    opcoes: [
      {
        id: 'opt_entrar_curso_desenho',
        texto: 'Se inscrever e ir todo sábado sem faltar',
        descricaoResultado: 'Você descobriu um talento real para desenho e voltava toda semana orgulhoso dos rabiscos.',
        consequencias: {
          stats: { felicidade: 12, inteligencia: 4 },
          hiddenStats: { disciplina: 8 },
          adicionarFlag: 'faz_curso_desenho',
          impactosComportamentais: { disciplina: 1 }
        }
      },
      {
        id: 'opt_preferir_folga_sabado',
        texto: 'Preferir aproveitar o sábado de manhã dormindo até mais tarde',
        descricaoResultado: 'Você trocou o curso pelo sono extra do fim de semana, sem arrependimento.',
        consequencias: {
          stats: { felicidade: 6 }
        }
      }
    ]
  },
  {
    id: 'com_mutirao_bairro',
    titulo: 'Mutirão de Limpeza da Praça do Bairro',
    descricao: 'Os vizinhos organizaram um mutirão de sábado para limpar e pintar a praça perto da sua casa.',
    idadeMinima: 8,
    idadeMaxima: 14,
    categoria: 'comunidade',
    peso: 60,
    taxonomia: 'decisao_comportamental',
    repeticao: { tipo: 'cooldown', cooldownAnos: 3 },
    opcoes: [
      {
        id: 'opt_ajudar_mutirao',
        texto: 'Ajudar a pintar o banco da praça com as outras crianças da rua',
        descricaoResultado: 'A praça ficou linda e você fez amizade com crianças de outras ruas que nunca tinha visto de perto.',
        consequencias: {
          stats: { felicidade: 12 },
          hiddenStats: { sociabilidade: 10, empatia: 8 },
          impactosComportamentais: { generosidade: 1, sociabilidade: 1 }
        }
      },
      {
        id: 'opt_brincar_longe_mutirao',
        texto: 'Ir brincar em outro lugar enquanto os adultos trabalham',
        descricaoResultado: 'Você preferiu brincar sozinho, mas viu de longe a praça ficando mais bonita.',
        consequencias: {
          stats: { felicidade: 6 }
        }
      }
    ]
  },
  {
    id: 'tec_primeiro_jogo_tablet',
    titulo: 'Jogo Novo no Tablet da Família',
    descricao: 'Seus pais baixaram um joguinho educativo no tablet da casa e deixaram você experimentar sozinho pela primeira vez.',
    idadeMinima: 6,
    idadeMaxima: 10,
    categoria: 'tecnologia',
    peso: 65,
    taxonomia: 'acontecimento_puro',
    natureza: 'acontecimento',
    repeticao: { tipo: 'cooldown', cooldownAnos: 2 },
    opcoes: [
      {
        id: 'opt_seguir_regras_tempo_tela',
        texto: '',
        descricaoResultado: 'Você jogou uma fase animada e devolveu o tablet na hora combinada, ganhando confiança para usar de novo.',
        consequencias: {
          stats: { felicidade: 8, inteligencia: 3 },
          hiddenStats: { disciplina: 6 },
        }
      },
      {
        id: 'opt_pedir_mais_tempo_tela',
        texto: '',
        descricaoResultado: 'Você conseguiu alguns minutos extras, mas na próxima vez o tempo de tela ficou mais curto.',
        consequencias: {
          stats: { felicidade: 6 },
          hiddenStats: { disciplina: -4 },
        }
      }
    ]
  },
  {
    id: 'esc_achado_perdido_dinheiro',
    titulo: 'Dinheiro Encontrado no Pátio da Escola',
    descricao: 'No recreio, você encontra uma nota de dinheiro caída perto do bebedouro da escola.',
    idadeMinima: 7,
    idadeMaxima: 11,
    categoria: 'escola',
    peso: 55,
    taxonomia: 'decisao_comportamental',
    repeticao: { tipo: 'cooldown', cooldownAnos: 3 },
    opcoes: [
      {
        id: 'opt_entregar_dinheiro_achado',
        texto: 'Entregar o dinheiro para a coordenação avisar quem perdeu',
        descricaoResultado: 'No dia seguinte, um colega do 4º ano recuperou o dinheiro e agradeceu pessoalmente por sua honestidade.',
        consequencias: {
          stats: { felicidade: 10 },
          hiddenStats: { reputacao: 15, empatia: 8 },
          // B4-FIX3 item 12 — consequência futura leve: essa reputação de
          // honestidade reaparece anos depois em `ado_grupo_amigos_turma`
          // (ver socialWorldEvents.ts), ligada só por esta flag, nunca
          // por texto.
          adicionarFlag: 'reputacao_honestidade_infancia',
          impactosComportamentais: { empatia: 1 }
        }
      },
      {
        id: 'opt_guardar_dinheiro_achado',
        texto: 'Guardar o dinheiro no bolso sem contar para ninguém',
        descricaoResultado: 'Você comprou uns doces na cantina, mas ficou com uma pontinha de culpa o resto do dia.',
        consequencias: {
          stats: { felicidade: 5 },
          dinheiro: 15,
          hiddenStats: { reputacao: -3 },
          impactosComportamentais: { impulsividade: 1 }
        }
      }
    ]
  },
  {
    id: 'ami_novo_colega_transferido',
    titulo: 'Aluno Novo na Turma',
    descricao: 'Um colega recém-transferido de outra cidade chega à sua sala no meio do ano, sentando sozinho no fundo.',
    idadeMinima: 6,
    idadeMaxima: 11,
    categoria: 'amizade',
    peso: 75,
    taxonomia: 'decisao_comportamental',
    repeticao: { tipo: 'cooldown', cooldownAnos: 2 },
    opcoes: [
      {
        id: 'opt_chamar_colega_novo',
        texto: 'Ir se sentar do lado dele e puxar assunto',
        descricaoResultado: 'Vocês dois viraram inseparáveis: ele te apresentou jogos e histórias de onde morava antes.',
        consequencias: {
          stats: { felicidade: 12 },
          hiddenStats: { sociabilidade: 10, empatia: 6 },
          adicionarFamiliar: {
            tipo: 'amigo',
            idade: 9,
            relacionamento: 70,
            situacaoAtual: 'Colega de turma'
          },
          impactosComportamentais: { sociabilidade: 1, generosidade: 1 }
        }
      },
      {
        id: 'opt_ignorar_colega_novo',
        texto: 'Continuar com o seu grupo de amigos de sempre',
        descricaoResultado: 'Vocês nunca chegaram a se conhecer direito; ele fez amizade com outra turma da escola.',
        consequencias: {
          stats: { felicidade: 2 }
        }
      }
    ]
  },
  {
    id: 'esp_torneio_bairro_futebol',
    titulo: 'Torneio de Futebol entre Ruas',
    descricao: 'A associação de moradores organizou um torneio de futebol entre as ruas do bairro, com times de crianças.',
    idadeMinima: 8,
    idadeMaxima: 13,
    categoria: 'esporte',
    peso: 70,
    taxonomia: 'acontecimento_puro',
    natureza: 'acontecimento',
    repeticao: { tipo: 'cooldown', cooldownAnos: 3 },
    opcoes: [
      {
        id: 'opt_capitao_time_rua',
        texto: '',
        descricaoResultado: 'Seu time perdeu na final, mas você foi eleito o capitão mais dedicado do torneio pelos próprios adversários.',
        consequencias: {
          stats: { felicidade: 14, saude: 4 },
          hiddenStats: { sociabilidade: 10, reputacao: 10, condicionamentoFisico: 8 },
        }
      },
      {
        id: 'opt_jogar_qualquer_posicao',
        texto: '',
        descricaoResultado: 'Você jogou tranquilo em qualquer posição que precisassem, e o time se divertiu do início ao fim.',
        consequencias: {
          stats: { felicidade: 10, saude: 3 },
          hiddenStats: { empatia: 5, condicionamentoFisico: 5 },
        }
      }
    ]
  },
  {
    id: 'hob_colecao_figurinhas',
    titulo: 'Álbum de Figurinhas da Copa',
    descricao: 'Todo mundo na escola está trocando figurinhas para completar o álbum da Copa do Mundo.',
    idadeMinima: 7,
    idadeMaxima: 12,
    categoria: 'hobby',
    peso: 70,
    taxonomia: 'acontecimento_puro',
    natureza: 'acontecimento',
    repeticao: { tipo: 'cooldown', cooldownAnos: 3 },
    opcoes: [
      {
        id: 'opt_trocar_figurinhas_justo',
        texto: '',
        descricaoResultado: 'Você completou o álbum inteiro fazendo amizades novas em cada troca.',
        consequencias: {
          stats: { felicidade: 14 },
          hiddenStats: { sociabilidade: 10 },
          dinheiro: -40,
        }
      },
      {
        id: 'opt_nao_colecionar_figurinhas',
        texto: '',
        descricaoResultado: 'Você não ligou muito para a febre das figurinhas e usou o tempo com outras coisas.',
        consequencias: {
          stats: { felicidade: 4 },
        }
      }
    ]
  },
  {
    id: 'com_biblioteca_bairro',
    titulo: 'Biblioteca Comunitária do Bairro',
    descricao: 'Um vizinho abriu uma pequena biblioteca comunitária na garagem de casa, com livros para emprestar de graça.',
    idadeMinima: 7,
    idadeMaxima: 13,
    categoria: 'comunidade',
    peso: 55,
    taxonomia: 'decisao_comportamental',
    repeticao: { tipo: 'cooldown', cooldownAnos: 3 },
    opcoes: [
      {
        id: 'opt_virar_frequentador_biblioteca',
        texto: 'Virar frequentador assíduo, pegando um livro novo toda semana',
        descricaoResultado: 'Você descobriu histórias que mudaram sua forma de ver o mundo, uma semana de cada vez.',
        consequencias: {
          stats: { inteligencia: 10, felicidade: 8 },
          hiddenStats: { disciplina: 5 },
          impactosComportamentais: { disciplina: 1 }
        }
      },
      {
        id: 'opt_visitar_uma_vez_biblioteca',
        texto: 'Visitar uma vez só por curiosidade e não voltar',
        descricaoResultado: 'Você pegou um livro, leu um pedaço e a rotina da escola acabou tomando o lugar da leitura.',
        consequencias: {
          stats: { felicidade: 3 }
        }
      }
    ]
  }
];
