import { GameEvent } from '../../types';

export const CHILDHOOD_EVENTS: GameEvent[] = [
  {
    id: 'inf_primeiros_passos',
    titulo: 'Primeiros Passos',
    descricao: 'Você está no tapete da sala e seus pais incentivam você a se levantar e andar em direção a eles.',
    idadeMinima: 1,
    idadeMaxima: 2,
    categoria: 'infancia',
    peso: 90,
    taxonomia: 'marco_testemunhado',
    natureza: 'acontecimento',
    unico: true,
    // B4-FIX2 item 10 — marco de desenvolvimento, não sorteio aleatório
    // repetível: ligado a uma transição específica (aprender a andar).
    repeticao: { tipo: 'marco' },
    opcoes: [
      {
        id: 'opt_correr',
        texto: '',
        descricaoResultado: 'Você correu tropeçando para os braços dos seus pais e a sala inteira comemorou seus primeiros passos com lágrimas de alegria.',
        consequencias: {
          stats: { felicidade: 15, saude: 5 },
          hiddenStats: { sociabilidade: 10, condicionamentoFisico: 5 },
          relacionamentoDelta: { delta: 15 }
          // B4-FIX2 item 11 — a escolha já fica registrada na memória
          // interna (personalitySystem.registrarEscolha, por eventoId +
          // opcaoId, automático para todo evento resolvido). Um evento
          // futuro pode consultar `escolheuAnteriormente` por id — nunca
          // por texto — sem precisar de flag extra aqui. Ver
          // `inf_bullying_defesa` → `opt_defender_com_confianca`.
        }
      },
      {
        id: 'opt_engatinhar',
        texto: '',
        descricaoResultado: 'Os primeiros passos vieram no seu tempo: mais engatinhada, algumas quedas, e só depois a sala inteira viu você atravessar o cômodo de pé.',
        consequencias: {
          stats: { felicidade: 5 },
          hiddenStats: { disciplina: 5 },
        }
      }
    ]
  },
  {
    id: 'inf_birra_brinquedo',
    titulo: 'O Brinquedo na Loja',
    descricao: 'No supermercado, você vê um brinquedo colorido na prateleira e quer desesperadamente que sua mãe ou seu pai compre.',
    // A negociação verbal das opções exige maturidade de pré-escolar: mínima de 4 anos
    idadeMinima: 4,
    idadeMaxima: 5,
    categoria: 'infancia',
    peso: 80,
    taxonomia: 'decisao_comportamental',
    opcoes: [
      {
        id: 'opt_espernear',
        texto: 'Fazer um escândalo e chorar no chão da loja',
        descricaoResultado: 'Você fez o maior escândalo no chão da loja e acabou de castigo em casa, para a vergonha dos seus pais.',
        consequencias: {
          stats: { felicidade: -10 },
          hiddenStats: { disciplina: -10, reputacao: -5 },
          impactosComportamentais: { impulsividade: 2, disciplina: -1 },
          relacionamentoDelta: { delta: -10 }
        }
      },
      {
        id: 'opt_pedir_jeitinho',
        texto: 'Pedir com carinho e prometer comer todos os legumes',
        descricaoResultado: 'Você pediu com carinho, prometeu comer os legumes e ganhou o brinquedo.',
        consequencias: {
          stats: { felicidade: 12 },
          hiddenStats: { empatia: 8, sociabilidade: 8 },
          impactosComportamentais: { sociabilidade: 2 },
          relacionamentoDelta: { delta: 8 }
        }
      },
      {
        id: 'opt_aceitar',
        texto: 'Aceitar quando disseram "na volta a gente compra"',
        descricaoResultado: 'Você aceitou deixar o brinquedo para outra ocasião e aprendeu cedo a lidar com a frustração (e que na volta eles nunca compram).',
        consequencias: {
          stats: { felicidade: 0 },
          hiddenStats: { disciplina: 12, empatia: 5 },
          impactosComportamentais: { disciplina: 2 }
        }
      }
    ]
  },
  {
    id: 'inf_gatinho_rua',
    titulo: 'Gatinho na Calçada',
    descricao: 'Você e seus pais encontram um gatinho filhote miando embaixo do portão de casa em um dia de chuva.',
    idadeMinima: 4,
    idadeMaxima: 10,
    categoria: 'infancia',
    peso: 70,
    taxonomia: 'decisao_comportamental',
    unico: true,
    opcoes: [
      {
        id: 'opt_adotar',
        texto: 'Implorar para a família adotar o bichinho',
        descricaoResultado: 'Você implorou tanto que seus pais cederam: o gatinho agora é o mais novo membro da família.',
        consequencias: {
          stats: { felicidade: 20 },
          hiddenStats: { empatia: 15, sociabilidade: 10 },
          impactosComportamentais: { empatia: 2, familia: 1 },
          adicionarFlag: 'tem_animal_estimacao',
          adicionarFamiliar: {
            nome: 'Mingau',
            sobrenome: '',
            genero: 'masculino',
            tipo: 'pet',
            idade: 1,
            relacionamento: 95,
            vivo: true,
            situacaoAtual: 'Brincando e ronronando pela casa'
          }
        }
      },
      {
        id: 'opt_alimentar',
        texto: 'Colocar um potinho de leite e uma caixa de papelão na garagem',
        descricaoResultado: 'Você cuidou do gatinho com carinho até que um vizinho o adotou.',
        consequencias: {
          stats: { felicidade: 10 },
          hiddenStats: { empatia: 10 },
          impactosComportamentais: { empatia: 2, generosidade: 1 }
        }
      }
    ]
  },
  {
    id: 'inf_primeiro_dia_escola',
    titulo: 'Primeiro Dia no Ensino Fundamental',
    descricao: 'É o seu primeiro dia de aula oficial com mochila nova e caderno de desenho. Como você se comporta na sala?',
    idadeMinima: 6,
    idadeMaxima: 7,
    categoria: 'escola',
    peso: 100,
    taxonomia: 'marco_testemunhado',
    natureza: 'acontecimento',
    unico: true,
    opcoes: [
      {
        id: 'opt_fazer_amigos',
        texto: '',
        descricaoResultado: 'Você conversou com todo mundo, dividiu o lanche no recreio e virou a criança mais popular da turma.',
        consequencias: {
          stats: { felicidade: 15 },
          hiddenStats: { sociabilidade: 20, reputacao: 10 },
        }
      },
      {
        id: 'opt_estudar_atento',
        texto: '',
        descricaoResultado: 'A professora elogiou sua atenção e você aprendeu a ler suas primeiras frases com perfeição.',
        consequencias: {
          stats: { inteligencia: 10, felicidade: 8 },
          hiddenStats: { disciplina: 15 },
        }
      },
      {
        id: 'opt_chorar',
        texto: '',
        descricaoResultado: 'Você chorou de saudade de casa, mas o abraço caloroso da tia da escola ajudou você a se acostumar.',
        consequencias: {
          stats: { felicidade: -5 },
          hiddenStats: { empatia: 5 },
        }
      }
    ]
  },
  {
    id: 'inf_futebol_rua',
    titulo: 'Futebol no Meio da Rua',
    descricao: 'As crianças da vizinhança montaram dois chinelos como trave no asfalto e te chamaram para jogar bola.',
    idadeMinima: 7,
    idadeMaxima: 11,
    categoria: 'infancia',
    peso: 75,
    taxonomia: 'acontecimento_puro',
    natureza: 'acontecimento',
    opcoes: [
      {
        id: 'opt_jogar_raca',
        texto: '',
        descricaoResultado: 'Você jogou descalço com garra, deu caneta no zagueiro e marcou um golaço antológico ovacionado pelo quarteirão!',
        consequencias: {
          stats: { felicidade: 18, saude: 5 },
          hiddenStats: { condicionamentoFisico: 15, sociabilidade: 10, reputacao: 10 },
          adicionarFlag: 'jogou_futebol_infancia'
        }
      },
      {
        id: 'opt_goleiro',
        texto: '',
        descricaoResultado: 'Você ficou no gol para ajudar o time e fez defesas milagrosas, embora tenha ralado o joelho no chão.',
        consequencias: {
          stats: { felicidade: 10, saude: -2 },
          hiddenStats: { empatia: 10, disciplina: 8 },
        }
      },
      {
        id: 'opt_ficar_videogame',
        texto: '',
        descricaoResultado: 'Você zerou uma fase super difícil no jogo, mas perdeu a diversão com a galera lá fora.',
        consequencias: {
          stats: { felicidade: 10, inteligencia: 4 },
          hiddenStats: { sociabilidade: -8, condicionamentoFisico: -5 },
        }
      }
    ]
  },
  {
    id: 'inf_feira_ciencias',
    titulo: 'Feira de Ciências da Escola',
    descricao: 'Sua escola organizou uma grande feira de ciências aberta aos pais e professores.',
    idadeMinima: 8,
    idadeMaxima: 11,
    categoria: 'escola',
    peso: 70,
    taxonomia: 'decisao_comportamental',
    opcoes: [
      {
        id: 'opt_vulcao',
        texto: 'Construir um vulcão com vinagre, bicarbonato e luzes LED',
        descricaoResultado: 'Seu vulcão de vinagre e bicarbonato entrou em erupção espetacular e ganhou a medalha de 1º lugar na feira!',
        consequencias: {
          stats: { inteligencia: 12, felicidade: 12 },
          hiddenStats: { disciplina: 10, reputacao: 15 },
          impactosComportamentais: { disciplina: 2 },
          adicionarFlag: 'medalha_ciencias'
        }
      },
      {
        id: 'opt_cartolina',
        texto: 'Fazer uma cartolina simples com recorte de revistas de última hora',
        descricaoResultado: 'Você apresentou o trabalho de forma aceitável e tirou uma nota razoável.',
        consequencias: {
          stats: { inteligencia: 4, felicidade: 2 },
          hiddenStats: { disciplina: -5 },
          impactosComportamentais: { disciplina: -1 }
        }
      }
    ]
  },
  {
    id: 'inf_bullying_defesa',
    titulo: 'Confusão no Recreio',
    descricao: 'Um menino mais velho está empurrando e caçoando de um colega seu que usa óculos.',
    idadeMinima: 8,
    idadeMaxima: 11,
    categoria: 'escola',
    peso: 65,
    taxonomia: 'decisao_comportamental',
    opcoes: [
      {
        // B4-FIX2 item 11 — consequência futura leve: quem já demonstrou
        // coragem aos primeiros passos ("correu para os braços deles")
        // encara esta cena com mais confiança, sem intimidação nenhuma.
        // A ligação é por id de escolha (memória interna), nunca por
        // texto — ver `personalitySystem.atendeCondicaoComportamental`.
        id: 'opt_defender_com_confianca',
        texto: 'Encarar o agressor sem hesitar — você já sabe que consegue',
        descricaoResultado: 'Você não hesitou: encarou o agressor de igual para igual, sem gritar nem se abalar, e ele recuou sem entender por quê. O colega ficou impressionado.',
        requisito: {
          condicaoComportamental: {
            escolheuAnteriormente: { eventoId: 'inf_primeiros_passos', opcaoId: 'opt_correr' }
          }
        },
        consequencias: {
          stats: { felicidade: 12 },
          hiddenStats: { empatia: 15, reputacao: 20, sociabilidade: 10 },
          impactosComportamentais: { coragem: 3, empatia: 2 },
          adicionarFlag: 'defendeu_amigo'
        }
      },
      {
        id: 'opt_defender',
        texto: 'Intervir com coragem e mandar ele parar imediatamente',
        descricaoResultado: 'Você interveio e mandou ele parar: o agressor se intimidou e recuou, e o colega virou seu amigo leal para a vida toda!',
        consequencias: {
          stats: { felicidade: 10 },
          hiddenStats: { empatia: 15, reputacao: 15, sociabilidade: 10 },
          impactosComportamentais: { coragem: 2, empatia: 2 },
          adicionarFlag: 'defendeu_amigo'
        }
      },
      {
        id: 'opt_chamar_professora',
        texto: 'Correr e avisar a diretora ou a inspetora de alunos',
        descricaoResultado: 'Você correu para avisar a direção; ela interveio a tempo e advertiu os pais do agressor.',
        consequencias: {
          stats: { felicidade: 5 },
          hiddenStats: { disciplina: 10, empatia: 8 },
          impactosComportamentais: { empatia: 1, disciplina: 1 }
        }
      },
      {
        id: 'opt_ignorar',
        texto: 'Ficar quieto para não sobrar para você',
        descricaoResultado: 'Você evitou a confusão, mas ficou com uma pontada de culpa na consciência.',
        consequencias: {
          stats: { felicidade: -8 },
          hiddenStats: { empatia: -10, reputacao: -5 },
          impactosComportamentais: { empatia: -2 }
        }
      }
    ]
  },
  {
    id: 'inf_aula_musica',
    titulo: 'Instrumento Musical',
    descricao: 'A escola começou a oferecer aulas gratuitas de flauta doce e violão.',
    idadeMinima: 9,
    idadeMaxima: 11,
    categoria: 'infancia',
    peso: 60,
    taxonomia: 'decisao_comportamental',
    opcoes: [
      {
        id: 'opt_aprender_violao',
        texto: 'Dedicar-se a aprender violão',
        descricaoResultado: 'Você desenvolveu grande sensibilidade musical e aprendeu a tocar suas primeiras canções brasileiras!',
        consequencias: {
          stats: { inteligencia: 8, felicidade: 10 },
          hiddenStats: { disciplina: 8, sociabilidade: 8 },
          impactosComportamentais: { disciplina: 2 },
          adicionarFlag: 'sabe_tocar_violao'
        }
      },
      {
        id: 'opt_nao_querer',
        texto: 'Achar chato e preferir a aula de educação física',
        descricaoResultado: 'Você correu no pátio e melhorou sua resistência física.',
        consequencias: {
          stats: { saude: 5, felicidade: 5 },
          hiddenStats: { condicionamentoFisico: 8 }
        }
      }
    ]
  }
];
