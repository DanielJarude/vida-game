import { GameEvent } from '../../types';

/**
 * Segunda infância — 6 a 11 anos.
 *
 * A faixa da escola, das primeiras amizades escolhidas (e não herdadas) e
 * da primeira noção de justiça. A auditoria do B4-FIX.1 encontrou 5
 * eventos elegíveis aos 6 anos e 9 aos 8 — pouco para uma fase de seis
 * anos de duração.
 *
 * Cada evento aqui prepara consequência: o que a criança faz diante de
 * injustiça, de vergonha pública ou de dinheiro achado é material que a
 * personalidade usa depois.
 */
export const MIDDLE_CHILDHOOD_EVENTS: GameEvent[] = [
  {
    id: 'inf2_colega_isolado',
    titulo: 'A Criança Que Senta Sozinha',
    descricao:
      'Tem uma criança na sala que passa todo recreio sozinha. Hoje ela está no mesmo canto de sempre e seu grupo está chamando você para jogar.',
    idadeMinima: 6,
    idadeMaxima: 12,
    categoria: 'amizade',
    peso: 70,
    repeticao: { modo: 'cooldown', anosCooldown: 5 },
    opcoes: [
      {
        id: 'opt_chamar_para_jogar',
        texto: 'Chamar essa criança para jogar com vocês',
        descricaoResultado:
          'Você chamou. Seu grupo reclamou no começo, mas no fim do recreio já eram todos no mesmo jogo. Essa criança nunca esqueceu quem chamou primeiro.',
        consequencias: {
          stats: { felicidade: 10 },
          hiddenStats: { empatia: 12, sociabilidade: 8, reputacao: 6 },
          impactosComportamentais: { empatia: 2, generosidade: 1, coragem: 1 }
        }
      },
      {
        id: 'opt_ir_com_grupo',
        texto: 'Ir com o seu grupo e não pensar mais nisso',
        descricaoResultado:
          'Você foi jogar. No meio da partida olhou uma vez para o canto e depois não olhou mais.',
        consequencias: {
          stats: { felicidade: 5 },
          hiddenStats: { sociabilidade: 5, empatia: -4 },
          impactosComportamentais: { sociabilidade: 1, empatia: -1 }
        }
      },
      {
        id: 'opt_sentar_junto',
        texto: 'Largar o jogo e sentar ali do lado',
        descricaoResultado:
          'Você largou o jogo e sentou ali, sem falar muita coisa. Passaram o recreio inteiro conversando sobre um assunto que ninguém mais entenderia.',
        consequencias: {
          stats: { felicidade: 8 },
          hiddenStats: { empatia: 15, sociabilidade: -2 },
          impactosComportamentais: { empatia: 2, independencia: 1 }
        }
      }
    ]
  },

  {
    id: 'inf2_prova_dificil',
    titulo: 'A Prova Que Você Não Estudou',
    descricao:
      'A prova está na sua frente e você não entendeu quase nada. O caderno do colega ao lado está aberto num ângulo que dá para ver.',
    idadeMinima: 7,
    idadeMaxima: 14,
    categoria: 'escola',
    peso: 75,
    repeticao: { modo: 'cooldown', anosCooldown: 5 },
    opcoes: [
      {
        id: 'opt_colar',
        texto: 'Olhar a resposta do colega',
        descricaoResultado:
          'Você copiou o que deu para ver. Tirou uma nota que não era sua e passou a semana com medo de alguém comentar.',
        consequencias: {
          stats: { felicidade: -3 },
          hiddenStats: { estresse: 10, reputacao: -6, disciplina: -5 },
          impactosComportamentais: { impulsividade: 2, disciplina: -2 }
        }
      },
      {
        id: 'opt_entregar_branco',
        texto: 'Entregar o que conseguiu e aceitar a nota',
        descricaoResultado:
          'Você entregou com metade em branco. A nota foi ruim, mas era sua, e você soube exatamente o que precisava estudar depois.',
        consequencias: {
          stats: { felicidade: -5, inteligencia: 4 },
          hiddenStats: { disciplina: 10, reputacao: 4 },
          impactosComportamentais: { disciplina: 2, coragem: 1 }
        }
      },
      {
        id: 'opt_pedir_ajuda_depois',
        texto: 'Entregar e procurar o professor depois da aula',
        descricaoResultado:
          'Você entregou e ficou depois da aula para perguntar o que não entendeu. O professor passou vinte minutos explicando de novo, só para você.',
        consequencias: {
          stats: { felicidade: 3, inteligencia: 8 },
          hiddenStats: { disciplina: 12, sociabilidade: 5 },
          impactosComportamentais: { disciplina: 2, coragem: 1 }
        }
      }
    ]
  },

  {
    id: 'inf2_dinheiro_achado',
    titulo: 'A Nota no Chão do Pátio',
    descricao:
      'Tem uma nota dobrada no chão do pátio, perto da fila da cantina. Dá para ver que caiu de alguém que ainda está por ali.',
    idadeMinima: 7,
    idadeMaxima: 13,
    categoria: 'dinheiro',
    peso: 65,
    repeticao: { modo: 'cooldown', anosCooldown: 6 },
    opcoes: [
      {
        id: 'opt_devolver_nota',
        texto: 'Perguntar de quem caiu',
        descricaoResultado:
          'Você perguntou em voz alta de quem era. Uma criança da fila reconheceu e agradeceu na frente de todo mundo.',
        consequencias: {
          stats: { felicidade: 8 },
          hiddenStats: { reputacao: 12, empatia: 8 },
          impactosComportamentais: { generosidade: 2, empatia: 1 }
        }
      },
      {
        id: 'opt_guardar_nota',
        texto: 'Guardar no bolso e ir embora',
        descricaoResultado:
          'Você guardou rápido e saiu dali. Comprou o que queria na cantina e o lanche não teve gosto de nada.',
        consequencias: {
          stats: { felicidade: 2 },
          hiddenStats: { reputacao: -6, estresse: 8 },
          impactosComportamentais: { impulsividade: 2, generosidade: -1 }
        }
      },
      {
        id: 'opt_entregar_direcao',
        texto: 'Levar para a secretaria da escola',
        descricaoResultado:
          'Você entregou na secretaria sem falar com ninguém. Nunca soube se chegou a quem perdeu, mas soube o que fez.',
        consequencias: {
          stats: { felicidade: 4 },
          hiddenStats: { reputacao: 8, disciplina: 6 },
          impactosComportamentais: { disciplina: 2, generosidade: 1 }
        }
      }
    ]
  },

  {
    id: 'inf2_apelido_escola',
    titulo: 'O Apelido Que Pegou',
    descricao:
      'Alguém inventou um apelido para você numa aula e a sala inteira achou graça. Hoje já tem gente de outra turma te chamando assim.',
    idadeMinima: 7,
    idadeMaxima: 14,
    categoria: 'escola',
    peso: 70,
    repeticao: { modo: 'cooldown', anosCooldown: 6 },
    opcoes: [
      {
        id: 'opt_rir_junto',
        texto: 'Rir junto e adotar o apelido',
        descricaoResultado:
          'Você riu junto e passou a se apresentar assim. Tirou o poder da piada assumindo ela — e pouca gente percebeu que doeu no começo.',
        consequencias: {
          stats: { felicidade: 5 },
          hiddenStats: { sociabilidade: 10, estresse: 4 },
          impactosComportamentais: { sociabilidade: 2, coragem: 1 }
        }
      },
      {
        id: 'opt_revidar',
        texto: 'Inventar um apelido pior para quem começou',
        descricaoResultado:
          'Você devolveu com algo pior e a sala riu de novo, agora do outro lado. Virou uma guerra que durou meses.',
        consequencias: {
          stats: { felicidade: 3 },
          hiddenStats: { reputacao: -5, estresse: 10, sociabilidade: 4 },
          impactosComportamentais: { impulsividade: 2, empatia: -1 }
        }
      },
      {
        id: 'opt_contar_adulto',
        texto: 'Contar em casa como você está se sentindo',
        descricaoResultado:
          'Você contou em casa. Não resolveu na escola no dia seguinte, mas alguém passou a perguntar como tinha sido o dia, todo dia.',
        consequencias: {
          stats: { felicidade: 6 },
          hiddenStats: { estresse: -10, empatia: 6 },
          impactosComportamentais: { familia: 2, coragem: 1 },
          relacionamentoDelta: { delta: 12 }
        }
      }
    ]
  },

  {
    id: 'inf2_promessa_quebrada',
    titulo: 'A Promessa Que Não Cumpriram',
    descricao:
      'Prometeram te levar em algum lugar neste fim de semana. Chegou o dia e surgiu um imprevisto de adulto que cancelou tudo.',
    idadeMinima: 6,
    idadeMaxima: 12,
    categoria: 'familia',
    peso: 65,
    repeticao: { modo: 'cooldown', anosCooldown: 6 },
    opcoes: [
      {
        id: 'opt_explodir',
        texto: 'Explodir e dizer que nunca cumprem nada',
        descricaoResultado:
          'Você gritou que nunca cumprem nada e bateu a porta. Ficou mal nos dois lados da porta pelo resto da tarde.',
        consequencias: {
          stats: { felicidade: -8 },
          hiddenStats: { estresse: 12 },
          impactosComportamentais: { impulsividade: 2, familia: -1 },
          relacionamentoDelta: { delta: -12 }
        }
      },
      {
        id: 'opt_engolir',
        texto: 'Dizer que tudo bem e guardar para você',
        descricaoResultado:
          'Você disse que tudo bem. Não estava, mas ninguém precisou saber. Foi a primeira vez que você fez isso conscientemente.',
        consequencias: {
          stats: { felicidade: -5 },
          hiddenStats: { estresse: 10, disciplina: 5 },
          impactosComportamentais: { independencia: 2, empatia: 1 }
        }
      },
      {
        id: 'opt_remarcar',
        texto: 'Perguntar quando dá para ser, e cobrar a data',
        descricaoResultado:
          'Você não brigou: perguntou qual dia dava. Marcaram, você lembrou todo dia, e dessa vez foram.',
        consequencias: {
          stats: { felicidade: 8 },
          hiddenStats: { disciplina: 8, sociabilidade: 5 },
          impactosComportamentais: { disciplina: 2, familia: 1 },
          relacionamentoDelta: { delta: 8 }
        }
      }
    ]
  },

  {
    id: 'inf2_talento_descoberto',
    titulo: 'A Coisa Que Você Faz Bem',
    descricao:
      'Numa atividade qualquer da escola você percebeu que fez melhor do que quase todo mundo, e sem esforço. Um professor notou também.',
    idadeMinima: 7,
    idadeMaxima: 13,
    categoria: 'escola',
    peso: 60,
    unico: true,
    opcoes: [
      {
        id: 'opt_levar_a_serio',
        texto: 'Levar a sério e praticar por conta própria',
        descricaoResultado:
          'Você começou a praticar sozinho(a), sem ninguém mandar. Virou a coisa que as pessoas passaram a associar a você.',
        consequencias: {
          stats: { felicidade: 12, inteligencia: 8 },
          hiddenStats: { disciplina: 12, reputacao: 8 },
          impactosComportamentais: { disciplina: 2, independencia: 1 }
        }
      },
      {
        id: 'opt_esconder_talento',
        texto: 'Disfarçar para não chamar atenção',
        descricaoResultado:
          'Você diminuiu o próprio desempenho para não ficar em evidência. Funcionou: pararam de olhar.',
        consequencias: {
          stats: { felicidade: -4 },
          hiddenStats: { sociabilidade: 4, reputacao: -3, estresse: 6 },
          impactosComportamentais: { coragem: -2 }
        }
      },
      {
        id: 'opt_exibir',
        texto: 'Fazer questão de mostrar para todo mundo',
        descricaoResultado:
          'Você não deixou ninguém esquecer. Impressionou muita gente e irritou algumas outras.',
        consequencias: {
          stats: { felicidade: 10 },
          hiddenStats: { reputacao: 5, sociabilidade: 8, empatia: -4 },
          impactosComportamentais: { sociabilidade: 2, impulsividade: 1 }
        }
      }
    ]
  },

  {
    id: 'inf2_briga_patio',
    titulo: 'O Empurrão no Pátio',
    descricao:
      'Uma criança maior empurrou alguém menor no pátio e está rindo. Tem gente olhando e ninguém fez nada até agora.',
    idadeMinima: 8,
    idadeMaxima: 14,
    categoria: 'escola',
    peso: 65,
    repeticao: { modo: 'cooldown', anosCooldown: 6 },
    opcoes: [
      {
        id: 'opt_intervir',
        texto: 'Entrar no meio e mandar parar',
        descricaoResultado:
          'Você entrou no meio. Levou um empurrão também, mas a coisa parou ali — e metade do pátio viu quem foi que parou.',
        consequencias: {
          stats: { felicidade: 5, saude: -4 },
          hiddenStats: { reputacao: 12, empatia: 10 },
          impactosComportamentais: { coragem: 2, empatia: 2 }
        }
      },
      {
        id: 'opt_chamar_inspetor',
        texto: 'Correr e chamar um adulto',
        descricaoResultado:
          'Você correu atrás de um adulto. Chamaram de dedo-duro, mas o menor levantou do chão.',
        consequencias: {
          stats: { felicidade: 2 },
          hiddenStats: { reputacao: -4, empatia: 10 },
          impactosComportamentais: { empatia: 2, disciplina: 1 }
        }
      },
      {
        id: 'opt_nao_se_meter',
        texto: 'Fingir que não viu',
        descricaoResultado:
          'Você desviou o olhar e seguiu andando. Ninguém soube que você viu, o que de certa forma era o pior da história.',
        consequencias: {
          stats: { felicidade: -4 },
          hiddenStats: { estresse: 8, empatia: -6 },
          impactosComportamentais: { coragem: -2, empatia: -1 }
        }
      }
    ]
  },

  {
    id: 'inf2_responsabilidade_casa',
    titulo: 'A Tarefa Que Agora É Sua',
    descricao:
      'Decidiram que você já tem idade para ser responsável por uma tarefa fixa da casa. Toda semana, sem ninguém mandar.',
    idadeMinima: 8,
    idadeMaxima: 14,
    categoria: 'familia',
    peso: 60,
    repeticao: { modo: 'cooldown', anosCooldown: 7 },
    opcoes: [
      {
        id: 'opt_assumir_tarefa',
        texto: 'Assumir e fazer sem precisarem lembrar',
        descricaoResultado:
          'Você fez toda semana, sem alguém precisar pedir. Em pouco tempo pararam até de conferir — e isso foi um tipo de elogio.',
        consequencias: {
          stats: { felicidade: 5 },
          hiddenStats: { disciplina: 15, reputacao: 8 },
          impactosComportamentais: { disciplina: 2, independencia: 1 },
          relacionamentoDelta: { delta: 10 }
        }
      },
      {
        id: 'opt_enrolar_tarefa',
        texto: 'Só fazer quando cobrarem',
        descricaoResultado:
          'Você só fazia depois da terceira cobrança. Virou assunto recorrente de discussão na casa.',
        consequencias: {
          stats: { felicidade: -2 },
          hiddenStats: { disciplina: -8, estresse: 5 },
          impactosComportamentais: { disciplina: -2 },
          relacionamentoDelta: { delta: -8 }
        }
      },
      {
        id: 'opt_negociar_tarefa',
        texto: 'Negociar para trocar por outra que você prefere',
        descricaoResultado:
          'Você argumentou que faria melhor outra coisa. Aceitaram a troca, e você cumpriu — o que deu peso à sua palavra na próxima negociação.',
        consequencias: {
          stats: { felicidade: 7, inteligencia: 4 },
          hiddenStats: { disciplina: 8, sociabilidade: 6 },
          impactosComportamentais: { independencia: 2, disciplina: 1 },
          relacionamentoDelta: { delta: 5 }
        }
      }
    ]
  }
];
