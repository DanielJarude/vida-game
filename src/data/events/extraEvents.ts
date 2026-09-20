import { GameEvent } from '../../types';

export const EXTRA_EVENTS: GameEvent[] = [
  // Infância & Escola
  {
    id: 'ext_vender_brigadeiro',
    titulo: 'Empreendedor Mirim: Venda de Brigadeiros',
    descricao: 'Você e um amigo decidem enrolar brigadeiros gourmet com granulado e vender para os colegas e vizinhos.',
    idadeMinima: 9,
    idadeMaxima: 15,
    categoria: 'dinheiro',
    peso: 75,
    opcoes: [
      {
        id: 'opt_vender_tudo',
        texto: 'Caprichar na apresentação e vender na hora do recreio',
        descricaoResultado: 'Sucesso total! A bandeja esgotou em 10 minutos e você lucrou R$ 80!',
        consequencias: {
          stats: { felicidade: 18 },
          dinheiro: 80,
          hiddenStats: { ambicao: 15, sociabilidade: 12, disciplina: 10 },
          impactosComportamentais: { disciplina: 1, sociabilidade: 1 }
        }
      },
      {
        id: 'opt_comer_metade',
        texto: 'Não resistir e comer metade dos brigadeiros antes de vender',
        descricaoResultado: 'Você teve uma deliciosa indigestão de chocolate e lucrou bem menos.',
        consequencias: {
          stats: { felicidade: 10, saude: -3 },
          dinheiro: 20,
          impactosComportamentais: { impulsividade: 2 }
        }
      }
    ]
  },
  {
    id: 'ext_gincana_escolar',
    titulo: 'Gincana Cultural e Esportiva da Escola',
    descricao: 'Sua turma foi dividida em equipes para disputar a tradicional gincana anual com provas esportivas e arrecadação de agasalhos.',
    idadeMinima: 11,
    idadeMaxima: 16,
    categoria: 'escola',
    peso: 80,
    opcoes: [
      {
        id: 'opt_liderar_gincana',
        texto: 'Liderar a equipe e organizar o grito de guerra',
        descricaoResultado: 'Sua equipe venceu o troféu da gincana e a turma comemorou cantando no pátio!',
        consequencias: {
          stats: { felicidade: 22 },
          hiddenStats: { sociabilidade: 20, reputacao: 20, ambicao: 15 }
        }
      },
      {
        id: 'opt_provas_conhecimento',
        texto: 'Focar na prova de conhecimentos gerais de história e geografia',
        descricaoResultado: 'Você acertou todas as perguntas e garantiu pontos preciosos para sua equipe.',
        consequencias: {
          stats: { inteligencia: 12, felicidade: 12 },
          hiddenStats: { disciplina: 10 }
        }
      }
    ]
  },
  {
    id: 'ext_festa_junina',
    titulo: 'Festa Junina do Colégio',
    descricao: 'Bandeirinhas coloridas, fogueira, milho cozido, quentão e correio elegante no ar.',
    idadeMinima: 8,
    idadeMaxima: 17,
    categoria: 'cotidiano',
    peso: 85,
    opcoes: [
      {
        id: 'opt_dancar_quadrilha',
        texto: 'Vestir camisa xadrez, chapéu de palha e dançar na quadrilha principal',
        descricaoResultado: 'Você dançou a quadrilha com muita alegria e recebeu um bilhetinho carinhoso no correio elegante!',
        consequencias: {
          stats: { felicidade: 20, aparencia: 5 },
          hiddenStats: { sociabilidade: 15, reputacao: 10 }
        }
      },
      {
        id: 'opt_pescaria_comidas',
        texto: 'Focar nas barraquinhas de pescaria, pastel e canjica doce',
        descricaoResultado: 'Você ganhou um brinde na pescaria e se empanturrou de comidas típicas deliciosas.',
        consequencias: {
          stats: { felicidade: 15 },
          dinheiro: -30
        }
      }
    ]
  },

  // Trabalho & Carreira
  {
    id: 'ext_decimo_terceiro',
    titulo: 'O Abençoado 13º Salário',
    descricao: 'Chegou o mês de dezembro e a primeira parcela do seu 13º salário caiu na conta bancária.',
    idadeMinima: 18,
    idadeMaxima: 68,
    categoria: 'dinheiro',
    peso: 80,
    condicoes: {
      empregado: true
    },
    opcoes: [
      {
        id: 'opt_investir_decimo',
        texto: 'Guardar e investir 80% na reserva financeira',
        descricaoResultado: 'Sua disciplina financeira garantiu paz de espírito para o ano seguinte!',
        consequencias: {
          stats: { felicidade: 15 },
          dinheiro: 2500,
          hiddenStats: { disciplina: 20, ambicao: 10 }
        }
      },
      {
        id: 'opt_comprar_presentes',
        texto: 'Comprar presentes de Natal para toda a família e fazer uma ceia farta',
        descricaoResultado: 'O sorriso no rosto da sua família ao abrir os presentes não tem preço!',
        consequencias: {
          stats: { felicidade: 25 },
          dinheiro: 500,
          relacionamentoDelta: { delta: 20 },
          hiddenStats: { empatia: 20 }
        }
      }
    ]
  },
  {
    id: 'ext_amigo_secreto_firma',
    titulo: 'Amigo Secreto da Empresa',
    descricao: 'Na festa de fim de ano da firma, você tirou o colega mais exigente da equipe no sorteio do amigo secreto.',
    idadeMinima: 18,
    idadeMaxima: 65,
    categoria: 'trabalho',
    peso: 75,
    condicoes: {
      empregado: true
    },
    opcoes: [
      {
        id: 'opt_presente_criativo',
        texto: 'Pesquisar o gosto dele e dar um presente elegante e personalizado',
        descricaoResultado: 'Ele adorou o presente e a convivência diária na equipe melhorou 100%!',
        consequencias: {
          stats: { felicidade: 15 },
          dinheiro: -120,
          hiddenStats: { sociabilidade: 15, reputacao: 15 }
        }
      },
      {
        id: 'opt_par_de_meias',
        texto: 'Dar um par de meias genérico comprado de última hora',
        descricaoResultado: 'Ele abriu o pacote com uma risada amarela e todos riram da situação.',
        consequencias: {
          stats: { felicidade: 5 },
          dinheiro: -25
        }
      }
    ]
  },
  {
    // B4-FIX3 item 6 — única opção, resultado já garantido (nota 10 com
    // louvor certo). Agora existe uma escolha real de como se preparar.
    id: 'ext_banca_tcc',
    titulo: 'Defesa do Trabalho de Conclusão de Curso (TCC)',
    descricao: 'Você está diante dos professores doutores da banca examinadora para defender seu TCC após meses de pesquisa intensa.',
    idadeMinima: 21,
    idadeMaxima: 35,
    categoria: 'escola',
    peso: 85,
    condicoes: {
      emFaculdade: true
    },
    unico: true,
    opcoes: [
      {
        id: 'opt_apresentacao_brilhante',
        texto: 'Apresentar com oratória impecável e responder todas as arguições',
        descricaoResultado: 'NOTA 10 COM LOUVOR! A banca aplaudiu de pé e recomendou seu artigo para publicação científica!',
        consequencias: {
          stats: { felicidade: 35, inteligencia: 15 },
          hiddenStats: { reputacao: 30, disciplina: 25, ambicao: 20 },
          adicionarFlag: 'tcc_nota_dez'
        }
      },
      {
        id: 'opt_apresentacao_nervosa',
        texto: 'Ler o slide nervosamente e torcer para ninguém fazer perguntas difíceis',
        descricaoResultado: 'Você tropeçou em algumas respostas, mas passou com nota suficiente. O diploma valeu, mesmo sem aplausos de pé.',
        consequencias: {
          stats: { felicidade: 15 },
          hiddenStats: { estresse: 10 }
        }
      }
    ]
  },

  // Cotidiano & Sociedade Brasileira
  {
    id: 'ext_chuva_verao_alagamento',
    titulo: 'Temporal de Verão na Cidade',
    descricao: 'Um temporal torrencial cai no final da tarde, alagando avenidas principais e parando o trânsito.',
    idadeMinima: 16,
    idadeMaxima: 85,
    categoria: 'cotidiano',
    peso: 70,
    opcoes: [
      {
        id: 'opt_esperar_chuva_passar',
        texto: 'Parar em uma lanchonete, pedir um café com pão de queijo e esperar a água baixar',
        descricaoResultado: 'Você evitou engarrafamento, comeu bem e voltou tranquilo para casa.',
        consequencias: {
          stats: { felicidade: 10, saude: 5 },
          dinheiro: -20,
          hiddenStats: { disciplina: 10, estresse: -10 }
        }
      },
      {
        id: 'opt_enfrentar_agua',
        texto: 'Tentar atravessar a enxurrada na pressa',
        descricaoResultado: 'Você chegou encharcado até os ossos e pegou um resfriado forte.',
        consequencias: {
          stats: { saude: -15, felicidade: -12 },
          hiddenStats: { estresse: 15 }
        }
      }
    ]
  },
  {
    id: 'ext_feira_livre_sabado',
    titulo: 'Feira Livre de Sábado',
    descricao: 'Gritos dos feirantes: "Olha a banana ouro, freguesa! É três por dez!", barracas cheias de frutas frescas, verduras e aquele pastel crocante com caldo de cana.',
    idadeMinima: 12,
    idadeMaxima: 90,
    categoria: 'cotidiano',
    peso: 75,
    opcoes: [
      {
        id: 'opt_fazer_feira_completa',
        texto: 'Comprar frutas frescas da estação e comer um pastel de queijo na hora',
        descricaoResultado: 'Sua despensa ficou cheia de alimentos saudáveis e o passeio foi uma delícia cultural!',
        consequencias: {
          stats: { saude: 10, felicidade: 15 },
          dinheiro: -85,
          hiddenStats: { estresse: -15 }
        }
      },
      {
        id: 'opt_pedir_desconto_xepa',
        texto: 'Ir no horário da xepa para negociar os melhores preços',
        descricaoResultado: 'Você conseguiu caixas inteiras de frutas por uma pechincha inacreditável!',
        consequencias: {
          stats: { felicidade: 12 },
          dinheiro: -35,
          hiddenStats: { disciplina: 10 }
        }
      }
    ]
  },
  {
    // B4-FIX3 item 5 — o playtest apontou que este evento era apresentado
    // como decisão ("O que você faz?") com exatamente UMA opção, o que é
    // pior do que simplesmente narrar o acontecimento. Corrigido com uma
    // segunda opção genuinamente diferente (não uma variação cosmética da
    // mesma escolha): também reduz o domínio de "família" no cooldown,
    // já que agora existe um caminho que não reforça relação/empatia.
    id: 'ext_macarronada_domingo',
    titulo: 'A Tradicional Macarronada de Domingo',
    descricao: 'A casa está cheia de tios, primos e avós para o almoço dominical com macarronada caseira ao molho de tomate rústico.',
    idadeMinima: 5,
    idadeMaxima: 95,
    categoria: 'familia',
    peso: 80,
    repeticao: { tipo: 'cooldown', cooldownAnos: 3 },
    opcoes: [
      {
        id: 'opt_ajudar_cozinha_comer',
        texto: 'Ajudar a ralar o queijo, servir as mesas e repetir o prato duas vezes',
        descricaoResultado: 'O sabor estava divino e os laços afetivos com a família ficaram mais fortes do que nunca!',
        consequencias: {
          stats: { felicidade: 25, saude: 5 },
          relacionamentoDelta: { delta: 20 },
          hiddenStats: { empatia: 15, estresse: -20 },
          impactosComportamentais: { familia: 1 }
        }
      },
      {
        id: 'opt_comer_rapido_sair',
        texto: 'Comer rápido e pedir para sair mais cedo para encontrar os amigos',
        descricaoResultado: 'Você comeu correndo, ouviu um "sempre com pressa" da vovó, mas ainda deu tempo de aproveitar a tarde livre com a turma.',
        consequencias: {
          stats: { felicidade: 12 },
          relacionamentoDelta: { delta: -5 },
          hiddenStats: { sociabilidade: 8 },
          impactosComportamentais: { independencia: 1, sociabilidade: 1 }
        }
      }
    ]
  },
  {
    id: 'ext_resgate_cachorro',
    titulo: 'O Cãozinho Perdido na Chuva',
    descricao: 'Um cão vira-lata caramelo simpático e encharcado senta na sua calçada olhando para você com olhos pidões.',
    idadeMinima: 10,
    idadeMaxima: 80,
    categoria: 'familia',
    peso: 65,
    opcoes: [
      {
        id: 'opt_acolher_caramelo',
        texto: 'Dar banho quentinho, comida e adotá-lo como fiel escudeiro',
        descricaoResultado: 'O caramelo se tornou o cão mais leal e amoroso do mundo, sempre te esperando no portão!',
        consequencias: {
          stats: { felicidade: 25 },
          hiddenStats: { empatia: 25, sociabilidade: 10 },
          adicionarFamiliar: {
            nome: 'Caramelo',
            sobrenome: '',
            genero: 'masculino',
            tipo: 'pet',
            idade: 2,
            relacionamento: 100,
            vivo: true,
            situacaoAtual: 'Abanando o rabo feliz da vida'
          }
        }
      },
      {
        id: 'opt_procurar_adocao',
        texto: 'Tirar fotos e postar em grupos de adoção responsável',
        descricaoResultado: 'Uma família amorosa adotou o cãozinho graças à sua postagem!',
        consequencias: {
          stats: { felicidade: 15 },
          hiddenStats: { empatia: 15, reputacao: 10 }
        }
      }
    ]
  },
  {
    id: 'ext_viagem_serra',
    titulo: 'Fim de Semana na Serra',
    descricao: 'O inverno chegou e você viaja para as montanhas (Campos do Jordão, Gramado ou Petrópolis) para curtir o clima frio, fondue e lareira.',
    idadeMinima: 20,
    idadeMaxima: 85,
    categoria: 'cotidiano',
    peso: 70,
    opcoes: [
      {
        id: 'opt_curtir_serra',
        texto: 'Tomar chocolate quente, comer fondue e curtir o friozinho',
        descricaoResultado: 'Passeio espetacular! As fotos ficaram lindas e você relaxou profundamente.',
        consequencias: {
          stats: { felicidade: 25, aparencia: 5 },
          dinheiro: -1400,
          hiddenStats: { estresse: -30 }
        }
      },
      {
        id: 'opt_ficar_em_casa_coberta',
        texto: 'Fazer pipoca e assistir filmes debaixo das cobertas em casa',
        descricaoResultado: 'Um fim de semana super aconchegante sem gastar quase nada.',
        consequencias: {
          stats: { felicidade: 15 },
          hiddenStats: { estresse: -15 }
        }
      }
    ]
  },
  {
    // B4-FIX3 item 6 — única opção, sem decisão real. A surpresa em si é
    // automática; a escolha genuína é como o personagem reage a ser o
    // centro das atenções (nem todo mundo gosta de festa surpresa).
    id: 'ext_festa_surpresa',
    titulo: 'Festa Surpresa de Aniversário',
    descricao: 'Ao abrir a porta de casa no dia do seu aniversário, as luzes se acendem e todos gritam: "SURPRESA!"',
    idadeMinima: 15,
    idadeMaxima: 90,
    categoria: 'amizade',
    peso: 75,
    opcoes: [
      {
        id: 'opt_emocionar_festa',
        texto: 'Abraçar todo mundo com lágrimas de felicidade nos olhos e apagar as velinhas',
        descricaoResultado: 'Foi uma celebração inesquecível de amor, amizade e gratidão pela sua vida!',
        consequencias: {
          stats: { felicidade: 35 },
          relacionamentoDelta: { delta: 25 },
          hiddenStats: { sociabilidade: 20, empatia: 20, estresse: -25 },
          impactosComportamentais: { sociabilidade: 1 }
        }
      },
      {
        id: 'opt_constrangido_festa',
        texto: 'Ficar sem graça com tanta atenção, mas agradecer baixinho a cada um',
        descricaoResultado: 'Você não é fã de ser o centro das atenções, mas ficou visivelmente emocionado ao ver quem se lembrou de você.',
        consequencias: {
          stats: { felicidade: 20 },
          relacionamentoDelta: { delta: 15 },
          hiddenStats: { empatia: 10 },
          impactosComportamentais: { independencia: 1 }
        }
      }
    ]
  }
];
