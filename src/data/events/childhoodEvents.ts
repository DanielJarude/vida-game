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
    unico: true,
    opcoes: [
      {
        id: 'opt_correr',
        texto: 'Correr tropeçando para os braços deles',
        descricaoResultado: 'Você deu seus primeiros passos cambaleantes e todos na sala comemoraram com lágrimas de alegria!',
        consequencias: {
          stats: { felicidade: 15, saude: 5 },
          hiddenStats: { sociabilidade: 10, condicionamentoFisico: 5 },
          relacionamentoDelta: { delta: 15 }
        }
      },
      {
        id: 'opt_engatinhar',
        texto: 'Preferir continuar engatinhando no seu ritmo',
        descricaoResultado: 'Você preferiu não se arriscar e continuou explorando o chão no seu próprio tempo.',
        consequencias: {
          stats: { felicidade: 5 },
          hiddenStats: { disciplina: 5 }
        }
      }
    ]
  },
  {
    id: 'inf_birra_brinquedo',
    titulo: 'O Brinquedo na Loja',
    descricao: 'No supermercado, você vê um brinquedo colorido na prateleira e quer desesperadamente que sua mãe ou seu pai compre.',
    idadeMinima: 3,
    idadeMaxima: 5,
    categoria: 'infancia',
    peso: 80,
    opcoes: [
      {
        id: 'opt_espernear',
        texto: 'Fazer um escândalo e chorar no chão da loja',
        descricaoResultado: 'Seus pais ficaram extremamente envergonhados e colocaram você de castigo ao chegar em casa.',
        consequencias: {
          stats: { felicidade: -10 },
          hiddenStats: { disciplina: -10, reputacao: -5 },
          relacionamentoDelta: { delta: -10 }
        }
      },
      {
        id: 'opt_pedir_jeitinho',
        texto: 'Pedir com carinho e prometer comer todos os legumes',
        descricaoResultado: 'Seus pais acharam você uma gracinha e acabaram comprando o brinquedo.',
        consequencias: {
          stats: { felicidade: 12 },
          hiddenStats: { empatia: 8, sociabilidade: 8 },
          relacionamentoDelta: { delta: 8 }
        }
      },
      {
        id: 'opt_aceitar',
        texto: 'Aceitar quando disseram "na volta a gente compra"',
        descricaoResultado: 'Você aprendeu desde cedo a lidar com a frustração (e que na volta eles nunca compram).',
        consequencias: {
          stats: { felicidade: 0 },
          hiddenStats: { disciplina: 12, empatia: 5 }
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
    unico: true,
    opcoes: [
      {
        id: 'opt_adotar',
        texto: 'Implorar para a família adotar o bichinho',
        descricaoResultado: 'Seus pais cederam! O gatinho agora é o mais novo membro da família.',
        consequencias: {
          stats: { felicidade: 20 },
          hiddenStats: { empatia: 15, sociabilidade: 10 },
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
          hiddenStats: { empatia: 10 }
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
    unico: true,
    opcoes: [
      {
        id: 'opt_fazer_amigos',
        texto: 'Conversar com todo mundo e dividir o lanche no recreio',
        descricaoResultado: 'Você rapidamente virou a criança mais popular da turma e fez vários novos amiguinhos!',
        consequencias: {
          stats: { felicidade: 15 },
          hiddenStats: { sociabilidade: 20, reputacao: 10 }
        }
      },
      {
        id: 'opt_estudar_atento',
        texto: 'Sentar na primeira carteira e prestar atenção na professora',
        descricaoResultado: 'A professora elogiou sua atenção e você aprendeu a ler suas primeiras frases com perfeição.',
        consequencias: {
          stats: { inteligencia: 10, felicidade: 8 },
          hiddenStats: { disciplina: 15 }
        }
      },
      {
        id: 'opt_chorar',
        texto: 'Chorar com saudades de casa',
        descricaoResultado: 'A tia da escola te deu um abraço caloroso e aos poucos você foi se acostumando.',
        consequencias: {
          stats: { felicidade: -5 },
          hiddenStats: { empatia: 5 }
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
    opcoes: [
      {
        id: 'opt_jogar_raca',
        texto: 'Jogar descalço com muita garra e dar caneta no zagueiro',
        descricaoResultado: 'Você marcou um golaço antológico e saiu ovacionado por todo o quarteirão!',
        consequencias: {
          stats: { felicidade: 18, saude: 5 },
          hiddenStats: { condicionamentoFisico: 15, sociabilidade: 10, reputacao: 10 },
          adicionarFlag: 'jogou_futebol_infancia'
        }
      },
      {
        id: 'opt_goleiro',
        texto: 'Ficar no gol para ajudar o time',
        descricaoResultado: 'Você fez defesas milagrosas, embora tenha ralado o joelho no chão.',
        consequencias: {
          stats: { felicidade: 10, saude: -2 },
          hiddenStats: { empatia: 10, disciplina: 8 }
        }
      },
      {
        id: 'opt_ficar_videogame',
        texto: 'Preferir ficar em casa jogando videogame',
        descricaoResultado: 'Você zerou uma fase super difícil no jogo, mas perdeu a diversão com a galera lá fora.',
        consequencias: {
          stats: { felicidade: 10, inteligencia: 4 },
          hiddenStats: { sociabilidade: -8, condicionamentoFisico: -5 }
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
    opcoes: [
      {
        id: 'opt_vulcao',
        texto: 'Construir um vulcão com vinagre, bicarbonato e luzes LED',
        descricaoResultado: 'A erupção foi espetacular e ganhou medalha de 1º lugar na feira!',
        consequencias: {
          stats: { inteligencia: 12, felicidade: 12 },
          hiddenStats: { disciplina: 10, reputacao: 15 },
          adicionarFlag: 'medalha_ciencias'
        }
      },
      {
        id: 'opt_cartolina',
        texto: 'Fazer uma cartolina simples com recorte de revistas de última hora',
        descricaoResultado: 'Você apresentou o trabalho de forma aceitável e tirou uma nota razoável.',
        consequencias: {
          stats: { inteligencia: 4, felicidade: 2 },
          hiddenStats: { disciplina: -5 }
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
    opcoes: [
      {
        id: 'opt_defender',
        texto: 'Intervir com coragem e mandar ele parar imediatamente',
        descricaoResultado: 'O agressor se intimidou e recuou. O colega virou seu amigo leal para a vida toda!',
        consequencias: {
          stats: { felicidade: 10 },
          hiddenStats: { empatia: 15, reputacao: 15, sociabilidade: 10 },
          adicionarFlag: 'defendeu_amigo'
        }
      },
      {
        id: 'opt_chamar_professora',
        texto: 'Correr e avisar a diretora ou a inspetora de alunos',
        descricaoResultado: 'A direção interveio a tempo e advertiu os pais do agressor.',
        consequencias: {
          stats: { felicidade: 5 },
          hiddenStats: { disciplina: 10, empatia: 8 }
        }
      },
      {
        id: 'opt_ignorar',
        texto: 'Ficar quieto para não sobrar para você',
        descricaoResultado: 'Você evitou a confusão, mas ficou com uma pontada de culpa na consciência.',
        consequencias: {
          stats: { felicidade: -8 },
          hiddenStats: { empatia: -10, reputacao: -5 }
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
    opcoes: [
      {
        id: 'opt_aprender_violao',
        texto: 'Dedicar-se a aprender violão',
        descricaoResultado: 'Você desenvolveu grande sensibilidade musical e aprendeu a tocar suas primeiras canções brasileiras!',
        consequencias: {
          stats: { inteligencia: 8, felicidade: 10 },
          hiddenStats: { disciplina: 8, sociabilidade: 8 },
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
