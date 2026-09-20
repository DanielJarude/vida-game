import { GameEvent } from '../../types';

/**
 * Primeira infância — 0 a 5 anos.
 *
 * Criado no B4-FIX.1 porque esta faixa estava praticamente vazia: a
 * auditoria mediu **0 eventos elegíveis aos 0 e aos 3 anos**, 1 aos 1–2 e
 * 4 aos 5. Com um pool desse tamanho, qualquer evento de peso alto voltava
 * ano após ano — foi o que produziu "Tarde na Casa dos Avós" três vezes.
 *
 * Regras que estes eventos respeitam, e que valem para qualquer coisa
 * acrescentada aqui depois:
 *
 * - Nenhuma opção pressupõe leitura, escrita, dinheiro próprio, celular,
 *   internet ou negociação verbal complexa.
 * - O que a criança faz é agir com o corpo, observar, imitar, testar
 *   limites e reagir — não deliberar como adulto.
 * - Toda opção revela comportamento: nada de "foi legal".
 * - Impactos comportamentais são pequenos (1 a 2). Uma escolha não define
 *   um traço; um padrão define.
 */
export const EARLY_CHILDHOOD_EVENTS: GameEvent[] = [
  // ----------------------------------------------------------- 0 a 1 ano
  {
    id: 'pi_estranha_visita',
    titulo: 'Uma Pessoa Nova na Sala',
    descricao:
      'Chega uma visita na casa, sorri bem de perto e estica os braços para te pegar no colo. Você nunca viu esse rosto antes.',
    idadeMinima: 0,
    idadeMaxima: 1,
    categoria: 'infancia',
    peso: 70,
    repeticao: { modo: 'cooldown', anosCooldown: 3 },
    opcoes: [
      {
        id: 'opt_ir_no_colo',
        texto: 'Ir no colo e puxar o cabelo da visita',
        descricaoResultado:
          'Você foi sem hesitar e agarrou o cabelo da visita com as duas mãos. Todo mundo riu, menos a visita.',
        consequencias: {
          stats: { felicidade: 6 },
          hiddenStats: { sociabilidade: 6 },
          impactosComportamentais: { sociabilidade: 2, coragem: 1 }
        }
      },
      {
        id: 'opt_chorar_estranho',
        texto: 'Chorar e se agarrar em quem você conhece',
        descricaoResultado:
          'Você chorou e se agarrou com força em quem cuida de você. Levou um tempo até aceitar sequer olhar para a visita.',
        consequencias: {
          stats: { felicidade: -3 },
          hiddenStats: { sociabilidade: -3, estresse: 5 },
          impactosComportamentais: { sociabilidade: -1, familia: 1 },
          relacionamentoDelta: { delta: 5 }
        }
      },
      {
        id: 'opt_observar_estranho',
        texto: 'Ficar quieto(a) observando de longe',
        descricaoResultado:
          'Você não chorou nem foi. Ficou observando a visita do outro lado da sala, sério(a), até decidir sozinho(a) que estava tudo bem.',
        consequencias: {
          stats: { felicidade: 2 },
          hiddenStats: { disciplina: 3 },
          impactosComportamentais: { independencia: 1 }
        }
      }
    ]
  },

  {
    id: 'pi_noite_sem_dormir',
    titulo: 'A Noite Que Ninguém Dormiu',
    descricao:
      'São três da manhã e você está acordado(a) chorando pela quarta vez. Alguém se levanta de novo, no escuro, para te pegar no colo.',
    idadeMinima: 0,
    idadeMaxima: 1,
    categoria: 'familia',
    peso: 60,
    unico: true,
    opcoes: [
      {
        id: 'opt_acalmar_colo',
        texto: 'Só sossegar quando sentir o cheiro conhecido',
        descricaoResultado:
          'Você só parou quando reconheceu o cheiro e o jeito de segurar. Dormiu ali mesmo, no ombro, e essa pessoa não te colocou de volta no berço por mais uma hora.',
        consequencias: {
          stats: { felicidade: 8, saude: 3 },
          hiddenStats: { estresse: -8 },
          impactosComportamentais: { familia: 2 },
          relacionamentoDelta: { delta: 12 }
        }
      },
      {
        id: 'opt_chorar_madrugada',
        texto: 'Continuar chorando até cansar sozinho(a)',
        descricaoResultado:
          'Nada funcionou. Você chorou até cansar e dormiu de exaustão. De manhã ninguém na casa estava inteiro, mas todo mundo levantou mesmo assim.',
        consequencias: {
          stats: { felicidade: -2, saude: -2 },
          hiddenStats: { estresse: 6 },
          impactosComportamentais: { independencia: 1 }
        }
      }
    ]
  },

  // ---------------------------------------------------------- 1 a 2 anos
  {
    id: 'pi_gaveta_proibida',
    titulo: 'A Gaveta Que Você Não Pode Abrir',
    descricao:
      'Tem uma gaveta baixa que sempre te mandam deixar quieta. Hoje não tem ninguém olhando e ela está bem ali, na altura da sua mão.',
    idadeMinima: 1,
    idadeMaxima: 3,
    categoria: 'infancia',
    peso: 70,
    repeticao: { modo: 'cooldown', anosCooldown: 4 },
    opcoes: [
      {
        id: 'opt_abrir_gaveta',
        texto: 'Abrir e espalhar tudo no chão',
        descricaoResultado:
          'Você abriu e tirou tudo, peça por peça, com uma concentração impressionante. Foi encontrado(a) sentado(a) no meio da bagunça, muito satisfeito(a).',
        consequencias: {
          stats: { felicidade: 8 },
          hiddenStats: { disciplina: -5 },
          impactosComportamentais: { impulsividade: 2, coragem: 1 }
        }
      },
      {
        id: 'opt_olhar_e_desistir',
        texto: 'Encostar a mão, olhar para trás e desistir',
        descricaoResultado:
          'Você encostou a mão, olhou para trás procurando alguém e tirou a mão sozinho(a). Ninguém viu, mas você entendeu a regra.',
        consequencias: {
          stats: { felicidade: 2 },
          hiddenStats: { disciplina: 8 },
          impactosComportamentais: { disciplina: 2 }
        }
      },
      {
        id: 'opt_chamar_adulto',
        texto: 'Chamar alguém apontando para a gaveta',
        descricaoResultado:
          'Você apontou para a gaveta e resmungou até alguém vir. Abriram com você, mostraram o que tinha dentro e guardaram tudo juntos.',
        consequencias: {
          stats: { felicidade: 5, inteligencia: 2 },
          hiddenStats: { sociabilidade: 4 },
          impactosComportamentais: { familia: 1, sociabilidade: 1 },
          relacionamentoDelta: { delta: 6 }
        }
      }
    ]
  },

  {
    id: 'pi_primeira_palavra',
    titulo: 'A Primeira Palavra de Verdade',
    descricao:
      'Faz semanas que a casa inteira repete palavras para você, esperando. Hoje alguma coisa se encaixou e você sabe que consegue falar.',
    // Marco simplificado de jogo, não regra médica: por volta dos 2 anos.
    idadeMinima: 2,
    idadeMaxima: 3,
    categoria: 'infancia',
    peso: 85,
    unico: true,
    opcoes: [
      {
        id: 'opt_chamar_cuidador',
        texto: 'Chamar quem passa o dia com você',
        descricaoResultado:
          'Você chamou pelo nome de quem passa o dia inteiro com você. A pessoa parou no meio da cozinha e precisou de um minuto antes de responder.',
        consequencias: {
          stats: { felicidade: 12, inteligencia: 4 },
          hiddenStats: { sociabilidade: 6 },
          impactosComportamentais: { familia: 2 },
          relacionamentoDelta: { delta: 15 }
        }
      },
      {
        id: 'opt_nomear_objeto',
        texto: 'Nomear o objeto que você mais quer',
        descricaoResultado:
          'Sua primeira palavra não foi o nome de ninguém: foi a coisa que você mais queria. Riram, mas trouxeram na mesma hora.',
        consequencias: {
          stats: { felicidade: 8, inteligencia: 6 },
          impactosComportamentais: { independencia: 2 }
        }
      },
      {
        id: 'opt_palavrao',
        texto: 'Repetir a palavra que ouviu alguém falar sem querer',
        descricaoResultado:
          'Você repetiu, alto e claro, exatamente o que alguém deixou escapar no trânsito. A casa ficou em silêncio, depois desabou de rir.',
        consequencias: {
          stats: { felicidade: 10 },
          hiddenStats: { reputacao: -3, sociabilidade: 4 },
          impactosComportamentais: { impulsividade: 2, sociabilidade: 1 }
        }
      }
    ]
  },

  // ---------------------------------------------------------- 3 a 5 anos
  {
    id: 'pi_medo_do_escuro',
    titulo: 'O Barulho no Corredor',
    descricao:
      'A luz apagou, a porta ficou entreaberta e tem um barulho no corredor que você não reconhece. Todo mundo já está dormindo.',
    idadeMinima: 3,
    idadeMaxima: 7,
    categoria: 'infancia',
    peso: 65,
    repeticao: { modo: 'cooldown', anosCooldown: 5 },
    opcoes: [
      {
        id: 'opt_chamar_de_noite',
        texto: 'Chamar até alguém vir',
        descricaoResultado:
          'Você chamou até alguém aparecer na porta, sonolento(a). A pessoa acendeu a luz do corredor, mostrou que não tinha nada e deixou a porta do jeito que você pediu.',
        consequencias: {
          stats: { felicidade: 5 },
          hiddenStats: { estresse: -6 },
          impactosComportamentais: { familia: 2 },
          relacionamentoDelta: { delta: 8 }
        }
      },
      {
        id: 'opt_cobrir_cabeca',
        texto: 'Se cobrir inteiro(a) e esperar passar',
        descricaoResultado:
          'Você se enfiou embaixo do cobertor e ficou lá, quieto(a), até o sono vencer o medo. Não contou para ninguém no dia seguinte.',
        consequencias: {
          stats: { felicidade: -2 },
          hiddenStats: { estresse: 6, disciplina: 4 },
          impactosComportamentais: { independencia: 2 }
        }
      },
      {
        id: 'opt_investigar_barulho',
        texto: 'Levantar e ir ver o que é',
        descricaoResultado:
          'Você levantou e foi até o corredor no escuro. Era a geladeira. Voltou para a cama orgulhoso(a) de uma coragem que ninguém viu.',
        consequencias: {
          stats: { felicidade: 6 },
          hiddenStats: { estresse: -3 },
          impactosComportamentais: { coragem: 2, independencia: 1 }
        }
      }
    ]
  },

  {
    id: 'pi_quebrou_escondeu',
    titulo: 'A Coisa Que Quebrou',
    descricao:
      'Você derrubou alguma coisa que não era para ser mexida e ela quebrou. Ninguém viu. Os pedaços estão no chão e dá para ouvir passos vindo.',
    idadeMinima: 3,
    idadeMaxima: 8,
    categoria: 'familia',
    peso: 70,
    repeticao: { modo: 'cooldown', anosCooldown: 6 },
    opcoes: [
      {
        id: 'opt_contar_na_hora',
        texto: 'Contar antes de perguntarem',
        descricaoResultado:
          'Você contou antes de alguém perguntar, com a voz tremendo. Levou bronca pelo estrago, mas ouviu também que contar foi a parte certa.',
        consequencias: {
          stats: { felicidade: -2 },
          hiddenStats: { reputacao: 8, disciplina: 5 },
          impactosComportamentais: { disciplina: 2, familia: 1 },
          relacionamentoDelta: { delta: 5 }
        }
      },
      {
        id: 'opt_esconder_pedacos',
        texto: 'Empurrar os pedaços para debaixo do móvel',
        descricaoResultado:
          'Você escondeu os pedaços embaixo do móvel e ficou o resto do dia com o estômago apertado, esperando alguém descobrir.',
        consequencias: {
          stats: { felicidade: -5 },
          hiddenStats: { estresse: 10, reputacao: -5 },
          impactosComportamentais: { impulsividade: 1, disciplina: -1 }
        }
      },
      {
        id: 'opt_culpar_outro',
        texto: 'Dizer que foi o bicho ou outra pessoa',
        descricaoResultado:
          'Você jurou que não foi você. Acreditaram na hora, e foi justamente isso que ficou incomodando por dias.',
        consequencias: {
          stats: { felicidade: -3 },
          hiddenStats: { reputacao: -8, estresse: 8 },
          impactosComportamentais: { impulsividade: 2, empatia: -1 }
        }
      }
    ]
  },

  {
    id: 'pi_dividir_lanche',
    titulo: 'O Último Pedaço',
    descricao:
      'Sobrou um pedaço do que você mais gosta. Uma criança do seu tamanho está olhando para ele com a mesma cara que você.',
    idadeMinima: 3,
    idadeMaxima: 9,
    categoria: 'amizade',
    peso: 70,
    repeticao: { modo: 'cooldown', anosCooldown: 5 },
    opcoes: [
      {
        id: 'opt_dividir_meio',
        texto: 'Partir no meio, mesmo saindo torto',
        descricaoResultado:
          'Você partiu no meio. Saiu torto, um pedaço claramente maior, e você ficou com o menor sem fazer drama.',
        consequencias: {
          stats: { felicidade: 5 },
          hiddenStats: { empatia: 8, sociabilidade: 5 },
          impactosComportamentais: { generosidade: 2, empatia: 1 }
        }
      },
      {
        id: 'opt_comer_rapido',
        texto: 'Enfiar tudo na boca de uma vez',
        descricaoResultado:
          'Você resolveu o problema enfiando tudo na boca de uma vez. A outra criança ficou olhando. Você mastigou olhando para o outro lado.',
        consequencias: {
          stats: { felicidade: 6 },
          hiddenStats: { empatia: -5, reputacao: -3 },
          impactosComportamentais: { impulsividade: 2, generosidade: -1 }
        }
      },
      {
        id: 'opt_dar_tudo',
        texto: 'Entregar inteiro e ficar sem',
        descricaoResultado:
          'Você entregou o pedaço inteiro e ficou sem. Depois ficou com vontade, mas não pediu de volta.',
        consequencias: {
          stats: { felicidade: -2 },
          hiddenStats: { empatia: 10, reputacao: 5 },
          impactosComportamentais: { generosidade: 2, empatia: 2 }
        }
      }
    ]
  },

  {
    id: 'pi_bicho_do_quintal',
    titulo: 'O Bicho no Quintal',
    descricao:
      'Tem um bicho pequeno andando devagar perto do muro. Você nunca viu um de perto e ele não parece com pressa de fugir.',
    idadeMinima: 3,
    idadeMaxima: 8,
    categoria: 'infancia',
    peso: 65,
    repeticao: { modo: 'cooldown', anosCooldown: 4 },
    opcoes: [
      {
        id: 'opt_observar_bicho',
        texto: 'Sentar no chão e ficar olhando',
        descricaoResultado:
          'Você sentou no chão e acompanhou o bicho até ele sumir no muro. Depois passou o jantar inteiro descrevendo o trajeto dele em detalhes.',
        consequencias: {
          stats: { felicidade: 6, inteligencia: 5 },
          hiddenStats: { disciplina: 4 },
          impactosComportamentais: { disciplina: 1, empatia: 1 }
        }
      },
      {
        id: 'opt_pegar_bicho',
        texto: 'Pegar com a mão para ver de perto',
        descricaoResultado:
          'Você pegou com a mão antes de pensar. Correu para mostrar para alguém, que gritou mais alto do que você esperava.',
        consequencias: {
          stats: { felicidade: 5, saude: -2 },
          impactosComportamentais: { coragem: 2, impulsividade: 1 }
        }
      },
      {
        id: 'opt_pisar_bicho',
        texto: 'Pisar antes que ele chegue perto',
        descricaoResultado:
          'Você pisou. Ficou olhando a mancha no chão por um tempo, com uma sensação estranha que não soube explicar.',
        consequencias: {
          stats: { felicidade: -3 },
          hiddenStats: { empatia: -8 },
          impactosComportamentais: { empatia: -2, impulsividade: 1 }
        }
      }
    ]
  },

  {
    id: 'pi_primeiro_dia_creche',
    titulo: 'A Porta da Creche',
    descricao:
      'É o primeiro dia. Tem barulho de outras crianças lá dentro e a mão que te trouxe está começando a soltar a sua.',
    idadeMinima: 3,
    idadeMaxima: 5,
    categoria: 'infancia',
    peso: 80,
    unico: true,
    opcoes: [
      {
        id: 'opt_entrar_correndo',
        texto: 'Soltar a mão e entrar correndo',
        descricaoResultado:
          'Você soltou a mão e entrou sem olhar para trás. Quem te levou ficou um tempo parado(a) na porta, sem saber se aquilo era bom ou ruim.',
        consequencias: {
          stats: { felicidade: 8 },
          hiddenStats: { sociabilidade: 10 },
          impactosComportamentais: { independencia: 2, sociabilidade: 2 }
        }
      },
      {
        id: 'opt_agarrar_perna',
        texto: 'Se agarrar na perna e não largar',
        descricaoResultado:
          'Você se agarrou na perna e chorou até quase todo mundo já ter entrado. Só soltou quando prometeram que voltariam na hora do lanche.',
        consequencias: {
          stats: { felicidade: -5 },
          hiddenStats: { estresse: 10, sociabilidade: -4 },
          impactosComportamentais: { familia: 2, sociabilidade: -1 },
          relacionamentoDelta: { delta: 5 }
        }
      },
      {
        id: 'opt_entrar_calado',
        texto: 'Entrar devagar e ficar num canto',
        descricaoResultado:
          'Você entrou sem chorar e passou a manhã inteira num canto, observando tudo antes de encostar em qualquer coisa. No fim do dia já sabia o nome de duas crianças.',
        consequencias: {
          stats: { felicidade: 3, inteligencia: 3 },
          hiddenStats: { sociabilidade: 3, estresse: 3 },
          impactosComportamentais: { independencia: 1, disciplina: 1 }
        }
      }
    ]
  },

  {
    id: 'pi_ajudar_tarefa',
    titulo: 'Deixa Que Eu Faço',
    descricao:
      'Alguém está guardando compras e você decide, por conta própria, que essa tarefa agora é sua também.',
    idadeMinima: 2,
    idadeMaxima: 6,
    categoria: 'familia',
    peso: 60,
    repeticao: { modo: 'cooldown', anosCooldown: 4 },
    opcoes: [
      {
        id: 'opt_ajudar_ate_fim',
        texto: 'Carregar tudo que couber na sua mão',
        descricaoResultado:
          'Você carregou uma coisa de cada vez, devagar, até o fim. Demorou o triplo do tempo e ninguém reclamou.',
        consequencias: {
          stats: { felicidade: 7 },
          hiddenStats: { disciplina: 6, empatia: 4 },
          impactosComportamentais: { disciplina: 2, familia: 1 },
          relacionamentoDelta: { delta: 8 }
        }
      },
      {
        id: 'opt_cansar_no_meio',
        texto: 'Desistir no meio e ir brincar',
        descricaoResultado:
          'Você largou tudo na metade e foi brincar. Alguém terminou por você, sem falar nada.',
        consequencias: {
          stats: { felicidade: 4 },
          hiddenStats: { disciplina: -4 },
          impactosComportamentais: { disciplina: -1, impulsividade: 1 }
        }
      }
    ]
  },

  {
    id: 'pi_comida_nova',
    titulo: 'A Colher Que Chega Perto',
    descricao:
      'Uma colher com alguma coisa que você nunca viu está parada no ar, na frente da sua boca, e o adulto segurando faz um barulho de avião.',
    idadeMinima: 0,
    idadeMaxima: 2,
    categoria: 'cotidiano',
    peso: 65,
    repeticao: { modo: 'cooldown', anosCooldown: 3 },
    opcoes: [
      {
        id: 'opt_aceitar_comida',
        texto: 'Abrir a boca e aceitar',
        descricaoResultado:
          'Você abriu a boca, fez uma careta enorme e abriu de novo pedindo mais. A careta continuou em todas as colheradas seguintes.',
        consequencias: {
          stats: { felicidade: 5, saude: 6 },
          impactosComportamentais: { coragem: 1 }
        }
      },
      {
        id: 'opt_cuspir_comida',
        texto: 'Cuspir tudo e virar a cara',
        descricaoResultado:
          'Você cuspiu tudo de volta, com precisão, e virou a cara para o lado. A comida terminou mais na roupa de quem alimentava do que em você.',
        consequencias: {
          stats: { felicidade: 3, saude: -2 },
          hiddenStats: { estresse: 4 },
          impactosComportamentais: { impulsividade: 2 }
        }
      },
      {
        id: 'opt_pegar_colher',
        texto: 'Tomar a colher da mão e tentar sozinho(a)',
        descricaoResultado:
          'Você arrancou a colher da mão e tentou fazer sozinho(a). Quase nada chegou à boca, mas ninguém conseguiu a colher de volta.',
        consequencias: {
          stats: { felicidade: 7, saude: 2 },
          hiddenStats: { disciplina: 4 },
          impactosComportamentais: { independencia: 2 }
        }
      }
    ]
  },

  {
    id: 'pi_espelho',
    titulo: 'O Bebê do Espelho',
    descricao:
      'Tem um bebê do outro lado do espelho fazendo exatamente tudo o que você faz, na mesma hora. Você ainda não decidiu o que achar disso.',
    idadeMinima: 0,
    idadeMaxima: 2,
    categoria: 'infancia',
    peso: 55,
    unico: true,
    opcoes: [
      {
        id: 'opt_rir_espelho',
        texto: 'Rir e encostar a testa no vidro',
        descricaoResultado:
          'Você riu, encostou a testa no vidro e ficou ali um tempo enorme fazendo caretas para um bebê que fazia as mesmas caretas de volta.',
        consequencias: {
          stats: { felicidade: 9, inteligencia: 4 },
          hiddenStats: { sociabilidade: 6 },
          impactosComportamentais: { sociabilidade: 2 }
        }
      },
      {
        id: 'opt_procurar_atras',
        texto: 'Engatinhar até atrás do espelho procurar o bebê',
        descricaoResultado:
          'Você deu a volta para ver onde o outro bebê tinha ido. Não achou ninguém, voltou para a frente e ele estava lá de novo. Testou três vezes.',
        consequencias: {
          stats: { felicidade: 6, inteligencia: 8 },
          impactosComportamentais: { independencia: 1, disciplina: 1 }
        }
      },
      {
        id: 'opt_assustar_espelho',
        texto: 'Se assustar e sair engatinhando',
        descricaoResultado:
          'Você não gostou nada daquilo e saiu engatinhando de costas, sem tirar o olho do espelho até virar o corredor.',
        consequencias: {
          stats: { felicidade: -2 },
          hiddenStats: { estresse: 5 },
          impactosComportamentais: { coragem: -1 }
        }
      }
    ]
  },

  {
    id: 'pi_objeto_favorito',
    titulo: 'A Coisa Que Não Pode Sumir',
    descricao:
      'Tem um objeto — um paninho, um bicho de pano, uma tampa qualquer — que precisa estar com você. Hoje ele não está onde deveria.',
    idadeMinima: 1,
    idadeMaxima: 5,
    categoria: 'infancia',
    peso: 65,
    repeticao: { modo: 'cooldown', anosCooldown: 4 },
    opcoes: [
      {
        id: 'opt_procurar_sozinho',
        texto: 'Revirar a casa inteira até achar',
        descricaoResultado:
          'Você virou a casa de cabeça para baixo sozinho(a) e achou atrás do sofá. Não largou mais pelo resto do dia.',
        consequencias: {
          stats: { felicidade: 8 },
          hiddenStats: { disciplina: 6, estresse: -4 },
          impactosComportamentais: { independencia: 2, disciplina: 1 }
        }
      },
      {
        id: 'opt_chorar_objeto',
        texto: 'Chorar até alguém encontrar para você',
        descricaoResultado:
          'Você chorou como se o mundo tivesse acabado até alguém largar tudo e achar. Era exatamente onde você já tinha olhado duas vezes.',
        consequencias: {
          stats: { felicidade: 3 },
          hiddenStats: { estresse: 8 },
          impactosComportamentais: { impulsividade: 2, familia: 1 },
          relacionamentoDelta: { delta: 4 }
        }
      },
      {
        id: 'opt_adotar_outro',
        texto: 'Escolher outra coisa para ser a nova favorita',
        descricaoResultado:
          'Você deu de ombros e elegeu outra coisa qualquer como a nova favorita. Ninguém entendeu o critério, mas foi definitivo.',
        consequencias: {
          stats: { felicidade: 5 },
          hiddenStats: { estresse: -6 },
          impactosComportamentais: { independencia: 2 }
        }
      }
    ]
  }
];
