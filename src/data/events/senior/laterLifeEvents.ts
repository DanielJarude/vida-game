/**
 * A vida depois dos 58.
 *
 * A mesma medição que motivou `adult/adultWorldEvents` mostrou a faixa 60+
 * com 15 acontecimentos elegíveis e pouquíssima variedade real: 40 vidas
 * simuladas viram apenas 23 identificadores distintos na década dos 60 e
 * 19 na dos 70.
 *
 * PRINCÍPIO DESTE ARQUIVO, e é o mais importante: idade avançada NÃO é uma
 * coleção de penalidades. O que muda com o tempo é o CONTEXTO — o que ocupa
 * o dia, quem está por perto, o que o corpo pede, o que passou a ter
 * importância. Perdas existem porque a vida tem perdas, não porque a
 * mecânica precisa punir quem envelheceu. Aqui há tanto o amigo que morre
 * quanto a manhã que virou a melhor parte do dia.
 *
 * Nada de diagnóstico nem de linguagem prescritiva: a saúde aparece como
 * experiência vivida ("o joelho avisa na escada"), nunca como consulta
 * médica narrada pelo jogo.
 *
 * Acontecimentos nunca declaram `impactosComportamentais` — a regra do
 * B4-FIX4 vale para o catálogo inteiro.
 */

import { GameEvent } from '../../../types';

export const LATER_LIFE_EVENTS: GameEvent[] = [
  {
    id: 'lat_caminhada_da_manha',
    titulo: 'A Caminhada das Sete',
    descricao: 'Sempre no mesmo horário, sempre o mesmo trajeto, quase sempre as mesmas pessoas. Ninguém combinou nada; foi acontecendo.',
    idadeMinima: 57,
    idadeMaxima: 92,
    categoria: 'saude',
    peso: 55,
    natureza: 'acontecimento',
    repeticao: { tipo: 'cooldown', cooldownAnos: 4 },
    opcoes: [
      {
        id: 'opt_caminhada_virou_turma',
        texto: '',
        peso: 3,
        descricaoResultado: 'O que era exercício virou encontro. Agora a caminhada termina num café que às vezes dura mais que a caminhada.',
        consequencias: {
          stats: { saude: 7, felicidade: 9 },
          hiddenStats: { condicionamentoFisico: 7, sociabilidade: 6, estresse: -6 }
        }
      },
      {
        id: 'opt_caminhada_sozinho',
        texto: '',
        peso: 2,
        descricaoResultado: 'Você preferiu ir sozinho, com o rádio no ouvido. Uma hora por dia em que ninguém precisa de nada de você.',
        consequencias: {
          stats: { saude: 6, felicidade: 6 },
          hiddenStats: { condicionamentoFisico: 6, estresse: -8 }
        }
      }
    ]
  },
  {
    id: 'lat_crianca_na_casa',
    titulo: 'Criança na Casa de Novo',
    descricao: 'Depois de anos de silêncio, a casa passou a receber uma criança nos fins de semana. Brinquedo no chão, barulho na cozinha, horário virado.',
    idadeMinima: 58,
    idadeMaxima: 92,
    categoria: 'familia',
    peso: 50,
    natureza: 'acontecimento',
    repeticao: { tipo: 'cooldown', cooldownAnos: 5 },
    opcoes: [
      {
        id: 'opt_crianca_renovou',
        texto: '',
        peso: 3,
        descricaoResultado: 'Você redescobriu paciência que nem sabia que ainda tinha. As segundas-feiras ficaram mais vazias, mas os domingos valiam por elas.',
        consequencias: {
          stats: { felicidade: 13 },
          hiddenStats: { empatia: 6, estresse: -5 },
          relacionamentoDelta: { delta: 8 }
        }
      },
      {
        id: 'opt_crianca_cansou',
        texto: '',
        peso: 2,
        descricaoResultado: 'Você amou cada minuto e ficou exausto em todos eles. No domingo à noite, a casa em silêncio era um alívio de que você tinha vergonha de gostar.',
        consequencias: {
          stats: { felicidade: 7, saude: -3 },
          hiddenStats: { estresse: 7 },
          relacionamentoDelta: { delta: 6 }
        }
      }
    ]
  },
  {
    id: 'lat_perda_da_geracao',
    titulo: 'Alguém da Sua Geração Partiu',
    descricao: 'A notícia chega por telefone, no meio da tarde. Não era da família, era de antes dela: alguém que atravessou a vida inteira junto com você.',
    idadeMinima: 60,
    idadeMaxima: 98,
    categoria: 'amizade',
    peso: 48,
    natureza: 'acontecimento',
    repeticao: { tipo: 'cooldown', cooldownAnos: 6 },
    opcoes: [
      {
        id: 'opt_perda_reuniu',
        texto: '',
        peso: 2,
        descricaoResultado: 'O velório reuniu gente que não se via há décadas. Foi triste e foi bom, e as duas coisas couberam no mesmo dia sem se atrapalharem.',
        consequencias: {
          stats: { felicidade: -6 },
          hiddenStats: { empatia: 6, sociabilidade: 4, estresse: 6 }
        }
      },
      {
        id: 'opt_perda_calou',
        texto: '',
        peso: 3,
        descricaoResultado: 'Você ficou dias sem conseguir explicar direito o que sentia. Não era só a pessoa: era mais um pedaço do mundo que só existia na memória de vocês dois.',
        consequencias: {
          stats: { felicidade: -10, saude: -3 },
          hiddenStats: { estresse: 10 }
        }
      }
    ]
  },
  {
    id: 'lat_joelho_na_escada',
    titulo: 'A Escada Ficou Mais Comprida',
    descricao: 'Não dói, exatamente. Só que agora você conta os degraus, e antes não contava.',
    idadeMinima: 58,
    idadeMaxima: 95,
    categoria: 'saude',
    peso: 50,
    natureza: 'acontecimento',
    repeticao: { tipo: 'cooldown', cooldownAnos: 5 },
    opcoes: [
      {
        id: 'opt_escada_adaptou',
        texto: '',
        peso: 3,
        descricaoResultado: 'Você instalou um corrimão, passou a subir devagar e parou de brigar com o próprio ritmo. A escada voltou a ser só uma escada.',
        consequencias: {
          dinheiro: -260,
          stats: { saude: 4, felicidade: 3 },
          hiddenStats: { estresse: -4 }
        }
      },
      {
        id: 'opt_escada_evitou',
        texto: '',
        peso: 2,
        descricaoResultado: 'Você foi desistindo de subir. Primeiro o segundo andar, depois a laje, depois a casa dos outros — sem nunca decidir isso em voz alta.',
        consequencias: {
          stats: { saude: -5, felicidade: -5 },
          hiddenStats: { condicionamentoFisico: -7 }
        }
      }
    ]
  },
  {
    id: 'lat_tecnologia_nova',
    titulo: 'Mudaram o Aplicativo de Novo',
    descricao: 'O banco atualizou o aplicativo e trocou tudo de lugar. O que você fazia em dois toques agora tem menu novo, nome novo e um botão escondido.',
    idadeMinima: 58,
    idadeMaxima: 95,
    categoria: 'tecnologia',
    peso: 45,
    natureza: 'acontecimento',
    repeticao: { tipo: 'cooldown', cooldownAnos: 4 },
    opcoes: [
      {
        id: 'opt_tecnologia_dominou',
        texto: '',
        peso: 2,
        descricaoResultado: 'Você sentou com calma, anotou o passo a passo num papel e aprendeu. Depois ensinou duas pessoas do prédio que estavam no mesmo aperto.',
        consequencias: {
          stats: { inteligencia: 4, felicidade: 6 },
          hiddenStats: { reputacao: 5, sociabilidade: 4 }
        }
      },
      {
        id: 'opt_tecnologia_pediu_ajuda',
        texto: '',
        peso: 3,
        descricaoResultado: 'Você acabou ligando para alguém mais novo da família. Resolveu em cinco minutos, mas ficou com a sensação incômoda de estar ficando para trás.',
        consequencias: {
          relacionamentoDelta: { delta: 4 },
          stats: { felicidade: -3 },
          hiddenStats: { estresse: 5 }
        }
      }
    ]
  },
  {
    id: 'lat_casa_grande_demais',
    titulo: 'A Casa Ficou Grande Demais',
    descricao: 'Tem quarto que você não entra há meses. A conta de água é a mesma de quando eram quatro pessoas.',
    idadeMinima: 60,
    idadeMaxima: 92,
    categoria: 'cotidiano',
    peso: 42,
    natureza: 'acontecimento',
    unico: true,
    opcoes: [
      {
        id: 'opt_casa_reaproveitou',
        texto: '',
        peso: 2,
        descricaoResultado: 'Você transformou o quarto vazio no que sempre quis ter e nunca teve espaço: ateliê, oficina, biblioteca. A casa voltou a ser do tamanho certo.',
        consequencias: {
          dinheiro: -600,
          stats: { felicidade: 10 },
          hiddenStats: { estresse: -6 }
        }
      },
      {
        id: 'opt_casa_fechou_portas',
        texto: '',
        peso: 3,
        descricaoResultado: 'Você foi fechando as portas dos cômodos que não usava. A casa encolheu por dentro sem mudar por fora.',
        consequencias: {
          stats: { felicidade: -5 },
          hiddenStats: { estresse: 4 }
        }
      }
    ]
  },
  {
    id: 'lat_tempo_que_sobra',
    titulo: 'A Semana Ficou Sem Formato',
    descricao: 'Sem horário para acordar, sem dia que precise ser diferente do outro. A terça é igual ao sábado, e isso é mais estranho do que parecia que seria.',
    idadeMinima: 60,
    idadeMaxima: 90,
    categoria: 'cotidiano',
    peso: 48,
    natureza: 'acontecimento',
    condicoes: { empregado: false },
    repeticao: { tipo: 'cooldown', cooldownAnos: 8 },
    opcoes: [
      {
        id: 'opt_tempo_deu_forma',
        texto: '',
        peso: 3,
        descricaoResultado: 'Você foi criando marcos próprios: a feira na quarta, a ligação de domingo, a manhã de leitura. A semana voltou a ter desenho, e dessa vez foi você quem desenhou.',
        consequencias: {
          stats: { felicidade: 9 },
          hiddenStats: { disciplina: 5, estresse: -7 }
        }
      },
      {
        id: 'opt_tempo_dissolveu',
        texto: '',
        peso: 2,
        descricaoResultado: 'Os dias foram se dissolvendo uns nos outros. Você percebeu num fim de tarde que não sabia dizer o que tinha feito na semana inteira.',
        consequencias: {
          stats: { felicidade: -7 },
          hiddenStats: { estresse: 5, disciplina: -4 }
        }
      }
    ]
  },
  {
    id: 'lat_convite_para_ensinar',
    titulo: 'Querem Aprender o que Você Sabe',
    descricao: 'Alguém do bairro descobriu que você domina aquilo que fez a vida inteira e perguntou se você toparia ensinar. Seriam algumas tardes por mês.',
    idadeMinima: 58,
    idadeMaxima: 90,
    categoria: 'comunidade',
    peso: 42,
    repeticao: { tipo: 'cooldown', cooldownAnos: 8 },
    opcoes: [
      {
        id: 'opt_ensinar_aceitar',
        texto: 'Aceitar e montar as aulas do seu jeito',
        descricaoResultado: 'A primeira tarde foi constrangedora e a segunda já não. Ver alguém conseguir fazer o que você ensinou mexeu com você mais do que qualquer elogio de trabalho mexeu.',
        consequencias: {
          stats: { felicidade: 14 },
          hiddenStats: { reputacao: 9, sociabilidade: 6, empatia: 5 },
          impactosComportamentais: { generosidade: 2, sociabilidade: 1 }
        }
      },
      {
        id: 'opt_ensinar_recusar',
        texto: 'Agradecer e recusar: já trabalhou o suficiente',
        descricaoResultado: 'Você agradeceu de verdade e disse não. Depois de tantos anos, ter o direito de recusar sem justificar também é uma conquista.',
        consequencias: {
          hiddenStats: { estresse: -4 },
          stats: { felicidade: 3 },
          impactosComportamentais: { independencia: 2 }
        }
      }
    ]
  },
  {
    id: 'lat_arrumar_as_fotos',
    titulo: 'A Caixa de Fotos',
    descricao: 'Fotos soltas, algumas sem data, várias com gente que você levaria um tempo para nomear. Estão numa caixa de sapato há décadas.',
    idadeMinima: 62,
    idadeMaxima: 95,
    categoria: 'familia',
    peso: 40,
    natureza: 'acontecimento',
    repeticao: { tipo: 'cooldown', cooldownAnos: 10 },
    opcoes: [
      {
        id: 'opt_fotos_organizou',
        texto: '',
        peso: 3,
        descricaoResultado: 'Você passou semanas escrevendo nomes e anos atrás de cada foto. Quem vier depois vai saber quem era cada um — o que, você percebeu, é uma forma de cuidado.',
        consequencias: {
          stats: { felicidade: 9 },
          relacionamentoDelta: { delta: 5 },
          hiddenStats: { estresse: -5 }
        }
      },
      {
        id: 'opt_fotos_emocionou',
        texto: '',
        peso: 2,
        descricaoResultado: 'Você não conseguiu passar da terceira foto. Guardou a caixa de volta e ficou o resto do dia quieto, num lugar que não era bem tristeza.',
        consequencias: {
          stats: { felicidade: -3 },
          hiddenStats: { empatia: 5 }
        }
      }
    ]
  },
  {
    id: 'lat_fila_do_banco',
    titulo: 'Manhã Inteira Resolvendo uma Coisa Só',
    descricao: 'Um documento, uma assinatura, um carimbo. Entre a fila, a senha e o "o senhor precisa voltar amanhã", foi-se a manhã.',
    idadeMinima: 60,
    idadeMaxima: 95,
    categoria: 'cotidiano',
    peso: 40,
    natureza: 'acontecimento',
    repeticao: { tipo: 'cooldown', cooldownAnos: 5 },
    opcoes: [
      {
        id: 'opt_fila_conversa',
        texto: '',
        peso: 2,
        descricaoResultado: 'A fila não andava, mas a conversa com a pessoa da frente andou muito. Vocês saíram de lá rindo de uma burocracia que continuava sem resolver.',
        consequencias: {
          stats: { felicidade: 4 },
          hiddenStats: { sociabilidade: 4, estresse: 3 }
        }
      },
      {
        id: 'opt_fila_desgastou',
        texto: '',
        peso: 3,
        descricaoResultado: 'Você voltou para casa sem ter resolvido e com a sensação de ter sido tratado como um número. Levou dois dias para criar ânimo de tentar de novo.',
        consequencias: {
          stats: { felicidade: -6 },
          hiddenStats: { estresse: 9 }
        }
      }
    ]
  }
];
