import { GameEvent } from '../../types';

export const MORE_EVENTS: GameEvent[] = [
  // Infância & Escola
  {
    id: 'esc_olimpiada_matematica',
    titulo: 'Olimpíada Brasileira de Matemática (OBMEP)',
    descricao: 'Sua escola inscreveu os alunos na 1ª fase da OBMEP. Você está diante de uma prova cheia de enigmas lógicos desafiadores.',
    idadeMinima: 10,
    idadeMaxima: 17,
    categoria: 'escola',
    peso: 75,
    opcoes: [
      {
        id: 'opt_resolver_logica',
        texto: 'Dedicar cada minuto para resolver com raciocínio apurado',
        descricaoResultado: 'Você conquistou Medalha de Prata na OBMEP com direito a certificado e bolsa de estudos!',
        consequencias: {
          stats: { inteligencia: 18, felicidade: 15 },
          hiddenStats: { disciplina: 15, ambicao: 15, reputacao: 15 },
          adicionarFlag: 'medalha_obmep'
        }
      },
      {
        id: 'opt_chutar_rapido',
        texto: 'Chutar as questões difíceis e ir embora mais cedo',
        descricaoResultado: 'Você aproveitou a tarde livre, mas ficou sem pontuação.',
        consequencias: {
          stats: { felicidade: 5 },
          hiddenStats: { disciplina: -5 }
        }
      }
    ]
  },
  {
    id: 'fam_briga_controle_tv',
    titulo: 'Guerra pelo Controle da TV',
    descricao: 'Você e seu irmão estão disputando quem vai assistir à televisão na sala no sábado à tarde.',
    idadeMinima: 6,
    idadeMaxima: 14,
    categoria: 'familia',
    peso: 80,
    opcoes: [
      {
        id: 'opt_ceder_revezar',
        texto: 'Propor um revezamento justo de 30 minutos para cada um',
        descricaoResultado: 'A diplomacia venceu! Vocês dois assistiram e acabaram comendo pipoca juntos.',
        consequencias: {
          stats: { felicidade: 10 },
          relacionamentoDelta: { delta: 12 },
          hiddenStats: { empatia: 15, disciplina: 8 }
        }
      },
      {
        id: 'opt_gritar_mae',
        texto: 'Gritar chamando sua mãe para resolver',
        descricaoResultado: 'Sua mãe desligou a TV e mandou os dois limparem o quarto.',
        consequencias: {
          stats: { felicidade: -8 },
          relacionamentoDelta: { delta: -8 },
          hiddenStats: { disciplina: 5 }
        }
      }
    ]
  },
  {
    id: 'fam_pet_veterinario',
    titulo: 'Bichinho de Estimação Amuado',
    descricao: 'Seu pet de estimação está desanimado e não quis comer a ração pela manhã.',
    idadeMinima: 10,
    idadeMaxima: 80,
    categoria: 'familia',
    peso: 70,
    opcoes: [
      {
        id: 'opt_levar_veterinario',
        texto: 'Levar imediatamente à clínica veterinária para fazer exames',
        descricaoResultado: 'O veterinário medicou a tempo e o bichinho voltou a pular e abanar o rabo cheio de energia!',
        consequencias: {
          stats: { felicidade: 15 },
          dinheiro: -280,
          hiddenStats: { empatia: 20 }
        }
      },
      {
        id: 'opt_esperar_melhorar',
        texto: 'Esperar mais um dia para ver se passa sozinho',
        descricaoResultado: 'Ele melhorou devagar, mas você passou a noite preocupado.',
        consequencias: {
          stats: { felicidade: -5 },
          hiddenStats: { estresse: 10 }
        }
      }
    ]
  },

  // Faculdade & Início da Carreira
  {
    id: 'fac_trote_solidario',
    titulo: 'Semana de Calouros e Trote Solidário',
    descricao: 'No primeiro mês de faculdade, o Centro Acadêmico organiza uma grande campanha de arrecadação de alimentos e doação de sangue.',
    idadeMinima: 18,
    idadeMaxima: 25,
    categoria: 'escola',
    peso: 85,
    condicoes: {
      emFaculdade: true
    },
    opcoes: [
      {
        id: 'opt_participar_trote_sol',
        texto: 'Vestir a camisa, pedir doações nos semáforos e doar sangue',
        descricaoResultado: 'A campanha bateu recordes de arrecadação e você fez amizades que durarão por toda a graduação!',
        consequencias: {
          stats: { felicidade: 20, saude: 5 },
          hiddenStats: { empatia: 20, sociabilidade: 25, reputacao: 15 }
        }
      },
      {
        id: 'opt_nao_participar_calouro',
        texto: 'Ficar apenas nas aulas teóricas e não se envolver',
        descricaoResultado: 'Você manteve o foco estritamente acadêmico.',
        consequencias: {
          stats: { inteligencia: 5 },
          hiddenStats: { disciplina: 5 }
        }
      }
    ]
  },
  {
    id: 'car_concurso_publico_edital',
    titulo: 'Edital do Grande Concurso Público Aberto',
    descricao: 'Foi publicado o edital de um concurso público muito cobiçado com excelente estabilidade e plano de carreira.',
    idadeMinima: 19,
    idadeMaxima: 55,
    categoria: 'trabalho',
    peso: 70,
    opcoes: [
      {
        id: 'opt_inscrever_estudar_edital',
        texto: 'Comprar a apostila, resolver provas anteriores e focar na aprovação',
        descricaoResultado: 'Sua preparação intensiva aumentou absurdamente seu conhecimento em legislação e administração pública!',
        consequencias: {
          stats: { inteligencia: 15, energia: -15 },
          dinheiro: -250,
          hiddenStats: { disciplina: 20, ambicao: 20, estresse: 12 },
          adicionarFlag: 'estudou_concurso'
        }
      },
      {
        id: 'opt_continuar_privado',
        texto: 'Preferir a flexibilidade e dinamismo do setor privado',
        descricaoResultado: 'Você continuou trilhando seus passos no mercado corporativo.',
        consequencias: {
          stats: { felicidade: 5 }
        }
      }
    ]
  },
  {
    id: 'car_exame_ordem_conselho',
    titulo: 'Exame de Registro Profissional',
    descricao: 'Chegou o momento de prestar o exame oficial do Conselho Profissional (OAB, CREA, CRM, CFC, COREN) para exercer a profissão.',
    idadeMinima: 22,
    idadeMaxima: 35,
    categoria: 'trabalho',
    peso: 80,
    unico: true,
    opcoes: [
      {
        id: 'opt_prestar_exame_focado',
        texto: 'Fazer o exame com concentração máxima',
        descricaoResultado: 'APROVADO(A)! Seu registro profissional oficial foi emitido com honras!',
        consequencias: {
          stats: { felicidade: 30, inteligencia: 10 },
          hiddenStats: { reputacao: 25, ambicao: 20, disciplina: 15 },
          adicionarFlag: 'registro_profissional_aprovado'
        }
      }
    ]
  },

  // Vida Adulta & Família
  {
    id: 'fin_malha_fina_ir',
    titulo: 'Declaração do Imposto de Renda',
    descricao: 'Chegou o mês de abril e você precisa acertar as contas com o leão da Receita Federal.',
    idadeMinima: 24,
    idadeMaxima: 75,
    categoria: 'dinheiro',
    peso: 75,
    condicoes: {
      empregado: true
    },
    opcoes: [
      {
        id: 'opt_declarar_correto',
        texto: 'Juntar todos os comprovantes médicos e informes de rendimento com rigor',
        descricaoResultado: 'Declaração aprovada sem pendências e você ainda recebeu R$ 1.800 de restituição!',
        consequencias: {
          stats: { felicidade: 15 },
          dinheiro: 1800,
          hiddenStats: { disciplina: 15 }
        }
      },
      {
        id: 'opt_declarar_pressa',
        texto: 'Fazer correndo no último dia às 23:50',
        descricaoResultado: 'Você quase perdeu o prazo e teve que pagar uma pequena multa por atraso.',
        consequencias: {
          stats: { felicidade: -8 },
          dinheiro: -160,
          hiddenStats: { estresse: 15 }
        }
      }
    ]
  },
  {
    id: 'fam_padrinho_casamento',
    titulo: 'Convite para Ser Padrinho/Madrinha',
    descricao: 'Seu melhor amigo de infância vai se casar e te convida emocionado para ser testemunha e padrinho/madrinha no altar.',
    idadeMinima: 22,
    idadeMaxima: 60,
    categoria: 'amizade',
    peso: 70,
    opcoes: [
      {
        id: 'opt_aceitar_honrado',
        texto: 'Aceitar com orgulho, discursar no brinde e presentear os noivos',
        descricaoResultado: 'Foi uma cerimônia inesquecível! Seu discurso fez todo mundo chorar e sorrir.',
        consequencias: {
          stats: { felicidade: 25 },
          dinheiro: -600,
          hiddenStats: { sociabilidade: 20, empatia: 20, reputacao: 15 }
        }
      },
      {
        id: 'opt_apenas_convidado',
        texto: 'Agradecer, mas pedir para ir apenas como convidado comum',
        descricaoResultado: 'Você curtiu a festa sem a pressão do altar.',
        consequencias: {
          stats: { felicidade: 10 }
        }
      }
    ]
  },
  {
    id: 'fin_oportunidade_terreno',
    titulo: 'Oportunidade de Terreno em Loteamento',
    descricao: 'Um corretor de imóveis te apresenta um lote em condomínio fechado com condições especiais de lançamento.',
    idadeMinima: 26,
    idadeMaxima: 65,
    categoria: 'dinheiro',
    peso: 60,
    condicoes: {
      dinheiroMinimo: 15000
    },
    opcoes: [
      {
        id: 'opt_comprar_lote',
        texto: 'Dar a entrada de R$ 15.000 para investimento futuro',
        descricaoResultado: 'A região se desenvolveu rapidamente e o valor do terreno dobrou em poucos anos!',
        consequencias: {
          stats: { felicidade: 15 },
          dinheiro: 15000,
          hiddenStats: { ambicao: 15, reputacao: 10 }
        }
      },
      {
        id: 'opt_nao_comprar_lote',
        texto: 'Não comprar e manter o dinheiro em caixa',
        descricaoResultado: 'Você manteve sua liquidez financeira.',
        consequencias: {
          stats: { felicidade: 0 }
        }
      }
    ]
  },
  {
    id: 'cot_doacao_sangue',
    titulo: 'Campanha de Doação de Sangue no Hemocentro',
    descricao: 'Os estoques dos bancos de sangue da sua região estão em nível crítico e uma van do hemocentro está na praça.',
    idadeMinima: 16,
    idadeMaxima: 68,
    categoria: 'cotidiano',
    peso: 65,
    opcoes: [
      {
        id: 'opt_doar_sangue',
        texto: 'Sentar na cadeira, estender o braço e doar sangue com alegria',
        descricaoResultado: 'Sua doação pode salvar até 4 vidas! Você ganhou um lanche caprichado e uma sensação indescritível de dever cumprido.',
        consequencias: {
          stats: { felicidade: 20, saude: 2, energia: -10 },
          hiddenStats: { empatia: 25, reputacao: 15 }
        }
      },
      {
        id: 'opt_medo_agulha',
        texto: 'Ter medo de agulha e passar batido',
        descricaoResultado: 'Você seguiu seu caminho.',
        consequencias: {
          stats: { felicidade: 0 }
        }
      }
    ]
  },
  {
    id: 'fam_visita_avo',
    titulo: 'Tarde na Casa dos Avós',
    descricao: 'Um cheiro gostoso de bolo de cenoura com cobertura de chocolate e café passado na hora te recebe na porta da casa dos avós.',
    idadeMinima: 5,
    idadeMaxima: 45,
    categoria: 'familia',
    peso: 80,
    opcoes: [
      {
        id: 'opt_ouvir_historias',
        texto: 'Comer dois pedaços de bolo e ouvir com carinho as histórias de antigamente',
        descricaoResultado: 'Foi uma tarde de paz profunda e muito carinho que ficará gravada para sempre no seu coração.',
        consequencias: {
          stats: { felicidade: 25, saude: 5 },
          relacionamentoDelta: { delta: 25 },
          hiddenStats: { empatia: 20, estresse: -25 }
        }
      },
      {
        id: 'opt_ficar_no_celular',
        texto: 'Ficar no celular enquanto eles conversam',
        descricaoResultado: 'Você respondeu mensagens, mas perdeu a chance de estar verdadeiramente presente.',
        consequencias: {
          stats: { felicidade: 2 },
          relacionamentoDelta: { delta: -5 }
        }
      }
    ]
  },
  {
    id: 'sen_neto_vestibular',
    titulo: 'Conselho para o Neto no Vestibular',
    descricao: 'Seu neto(a) adolescente chega até você angustiado com a escolha da faculdade e as pressões do vestibular.',
    idadeMinima: 60,
    idadeMaxima: 95,
    categoria: 'familia',
    peso: 80,
    opcoes: [
      {
        id: 'opt_conselho_acolhedor',
        texto: 'Abraçar o jovem, passar sua sabedoria de vida e encorajá-lo a seguir a sua vocação',
        descricaoResultado: 'Suas palavras trouxeram uma serenidade enorme! Ele(a) se sentiu acolhido e confiante para vencer o desafio.',
        consequencias: {
          stats: { felicidade: 25 },
          relacionamentoDelta: { delta: 25 },
          hiddenStats: { empatia: 25, reputacao: 20 }
        }
      },
      {
        id: 'opt_mandar_estudar_mais',
        texto: 'Dizer que na sua época era muito mais difícil e mandar estudar mais',
        descricaoResultado: 'Ele ouviu calado e foi embora um pouco chateado.',
        consequencias: {
          stats: { felicidade: -5 },
          relacionamentoDelta: { delta: -10 }
        }
      }
    ]
  }
];
