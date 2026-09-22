import { GameEvent } from '../../types';

export const ADOLESCENCE_EVENTS: GameEvent[] = [
  {
    id: 'ado_cola_prova',
    titulo: 'Gabarito da Prova de Matemática',
    descricao: 'Antes da prova bimestral mais difícil do ano, um colega da turma oferece passar um bilhetinho com todas as respostas.',
    idadeMinima: 12,
    idadeMaxima: 16,
    categoria: 'escola',
    peso: 85,
    taxonomia: 'decisao_comportamental',
    opcoes: [
      {
        id: 'opt_aceitar_cola',
        texto: 'Aceitar a cola e tirar nota 10',
        descricaoResultado: 'Você tirou 10 sem esforço, mas quase foi pego pelo professor e não aprendeu nada da matéria.',
        consequencias: {
          stats: { felicidade: 8, inteligencia: -4 },
          hiddenStats: { disciplina: -15, reputacao: -5 },
          impactosComportamentais: { disciplina: -2 },
          adicionarFlag: 'colou_na_escola'
        }
      },
      {
        id: 'opt_recusar_estudar',
        texto: 'Recusar e confiar no seu próprio estudo',
        descricaoResultado: 'Você tirou uma nota 8 honesta pelo seu próprio esforço e sentiu orgulho de si mesmo.',
        consequencias: {
          stats: { inteligencia: 10, felicidade: 10 },
          hiddenStats: { disciplina: 15, reputacao: 10 },
          impactosComportamentais: { disciplina: 2 }
        }
      },
      {
        id: 'opt_dedurar',
        texto: 'Denunciar o esquema para a coordenação',
        descricaoResultado: 'A coordenação cancelou a prova, mas a turma inteira descobriu e você virou o x9 da sala.',
        consequencias: {
          stats: { felicidade: -15 },
          hiddenStats: { disciplina: 10, reputacao: -20, sociabilidade: -15 },
          impactosComportamentais: { disciplina: 1 }
        }
      },
      {
        // B4-FIX2 item 11 — segunda consequência futura leve: quem
        // defendeu um colega do bullying na infância (`defendeu_amigo`)
        // já tem esse vínculo de confiança quando a tentação da cola
        // aparece de novo, anos depois. Ligado por FLAG, não por texto.
        id: 'opt_colega_retribui',
        texto: 'Recusar a cola — o colega que você defendeu na infância se oferece pra estudar com você',
        descricaoResultado: 'Você recusou a cola. Sem nem precisar pedir, aquele colega que você defendeu anos atrás apareceu com o material organizado: "Depois de tudo que você fez por mim, é o mínimo." Vocês dois tiraram notas honestas.',
        requisito: {
          flagNecessaria: 'defendeu_amigo'
        },
        consequencias: {
          stats: { inteligencia: 12, felicidade: 14 },
          hiddenStats: { disciplina: 12, reputacao: 8, sociabilidade: 8 },
          impactosComportamentais: { disciplina: 2, empatia: 1 },
          relacionamentoDelta: { delta: 10 }
        }
      },
      {
        // B2 — opção que só existe para quem construiu histórico de disciplina
        // na infância (padrão acumulado, não bônus automático)
        id: 'opt_estudar_juntos',
        texto: 'Recusar e chamar o colega para estudar junto antes da prova',
        descricaoResultado: 'Vocês dois estudaram juntos na véspera e tiraram notas honestas. O colega agradece até hoje.',
        consequencias: {
          stats: { inteligencia: 8, felicidade: 12 },
          hiddenStats: { disciplina: 10, sociabilidade: 10, reputacao: 10 },
          impactosComportamentais: { disciplina: 2, generosidade: 2 },
          relacionamentoDelta: { delta: 5 }
        },
        requisito: {
          condicaoComportamental: { traco: 'disciplina', intensidadeMinima: 5 }
        }
      }
    ]
  },
  {
    // B4-FIX3 item 13/14 — quando o jogador já teve o evento
    // `ado_paixao_secreta` (NPC persistente `tipo: 'paixao'`), este é o
    // MOMENTO daquela pessoa: a opção `opt_beijar_paixao_real` conecta por
    // `relationType`, nunca por texto, e transforma a relação de
    // "paixão" para "namorado(a)" só se o jogador topar avançar (mantém a
    // liberdade — dá pra aproximar sem virar namoro). Sem essa história
    // prévia, o evento continua existindo com a pessoa anônima original
    // (nenhum jogador fica sem o evento por não ter cumprido um requisito).
    id: 'ado_primeiro_beijo',
    titulo: 'Festa de Aniversário e Primeiro Beijo',
    descricao: 'Em uma festa com música tocando e luzes apagadas, a pessoa por quem você tem uma paixão secreta se aproxima e puxa conversa.',
    idadeMinima: 13,
    idadeMaxima: 16,
    categoria: 'romance',
    peso: 90,
    taxonomia: 'decisao_comportamental',
    unico: true,
    opcoes: [
      {
        id: 'opt_beijar_paixao_real',
        texto: 'Tomar a iniciativa e beijar a pessoa por quem você é apaixonado há tempos',
        descricaoResultado: 'Foi ela mesma, a pessoa que você secretamente admirava. O beijo foi inesquecível, e agora tudo entre vocês dois é diferente.',
        requisito: { flagNecessaria: 'tem_paixao_secreta' },
        consequencias: {
          impactosComportamentais: { coragem: 2, sociabilidade: 1 },
          stats: { felicidade: 28, aparencia: 5 },
          hiddenStats: { sociabilidade: 15, reputacao: 10 },
          adicionarFlag: 'primeiro_beijo_inesquecivel',
          transformarRelacao: { relationType: 'paixao', novoTipo: 'namorado' }
        }
      },
      {
        id: 'opt_beijar',
        texto: 'Tomar a iniciativa e dar um beijo apaixonado',
        descricaoResultado: 'Foi incrível! Seu coração disparou e o momento foi inesquecível.',
        consequencias: {
          impactosComportamentais: { coragem: 1, impulsividade: 1 },
          stats: { felicidade: 25, aparencia: 5 },
          hiddenStats: { sociabilidade: 15, reputacao: 10 },
          adicionarFlag: 'primeiro_beijo_inesquecivel'
        }
      },
      {
        id: 'opt_timidez',
        texto: 'Ficar muito envergonhado e disfarçar comendo salgadinho',
        descricaoResultado: 'O clima esfriou um pouco, mas vocês continuaram grandes amigos.',
        consequencias: {
          impactosComportamentais: { sociabilidade: -1 },
          stats: { felicidade: 2 },
          hiddenStats: { sociabilidade: 2 }
        }
      }
    ]
  },
  {
    id: 'ado_smartphone',
    titulo: 'O Primeiro Celular Próprio',
    descricao: 'Seus pais disseram que se você mantiver as notas altas e ajudar nas tarefas de casa, vão te dar seu primeiro smartphone.',
    idadeMinima: 12,
    idadeMaxima: 15,
    categoria: 'familia',
    peso: 80,
    taxonomia: 'acontecimento_puro',
    natureza: 'acontecimento',
    // B4-FIX2 — o playtest encontrou "seus pais cumpriram a promessa e
    // compraram o celular" reaparecendo em outro ano, como se a promessa
    // nunca tivesse existido. Ganhar o primeiro celular é um marco
    // narrativamente irreversível: não faz sentido "primeiro celular" de
    // novo, seja qual for a escolha.
    unico: true,
    opcoes: [
      {
        id: 'opt_esforco_total',
        texto: '',
        descricaoResultado: 'Seus pais cumpriram a promessa e compraram o celular! Você agora passa horas nas redes sociais.',
        consequencias: {
          stats: { felicidade: 20, inteligencia: 6 },
          hiddenStats: { disciplina: 15, sociabilidade: 10 },
          relacionamentoDelta: { delta: 12 },
          adicionarFlag: 'tem_smartphone'
        }
      },
      {
        id: 'opt_pedir_insistente',
        texto: '',
        descricaoResultado: 'Seus pais acharam você mimado e adiaram o presente.',
        consequencias: {
          stats: { felicidade: -10 },
          hiddenStats: { disciplina: -5, empatia: -8 },
          relacionamentoDelta: { delta: -10 }
        }
      }
    ]
  },
  {
    id: 'ado_preparacao_enem',
    titulo: 'Ano do ENEM e Vestibular',
    descricao: 'Você está no 3º ano do Ensino Médio. A pressão para escolher a futura carreira e passar no ENEM começou com força total.',
    idadeMinima: 16,
    idadeMaxima: 17,
    categoria: 'escola',
    peso: 95,
    taxonomia: 'decisao_comportamental',
    unico: true,
    opcoes: [
      {
        id: 'opt_estudo_foco',
        texto: 'Fazer simulados todo fim de semana e focar na redação nota 1000',
        descricaoResultado: 'Seu empenho foi gigantesco! Você dominou o modelo de redação e os conteúdos do ENEM.',
        consequencias: {
          impactosComportamentais: { disciplina: 2 },
          stats: { inteligencia: 20, felicidade: -5 },
          hiddenStats: { disciplina: 25, ambicao: 20, estresse: 15 },
          adicionarFlag: 'focou_enem'
        }
      },
      {
        id: 'opt_equilibrar',
        texto: 'Estudar moderadamente sem abrir mão dos amigos e do lazer',
        descricaoResultado: 'Você manteve a saúde mental equilibrada e conseguiu aprender o essencial.',
        consequencias: {
          impactosComportamentais: { sociabilidade: 1 },
          stats: { inteligencia: 10, felicidade: 10 },
          hiddenStats: { disciplina: 10, sociabilidade: 10 }
        }
      },
      {
        id: 'opt_deixar_levar',
        texto: 'Deixar para estudar só na última semana antes da prova',
        descricaoResultado: 'O resultado foi desanimador e você sentiu que desperdiçou o ano letivo.',
        consequencias: {
          impactosComportamentais: { disciplina: -2, impulsividade: 1 },
          stats: { inteligencia: -5, felicidade: -12 },
          hiddenStats: { disciplina: -20, estresse: 20 }
        }
      }
    ]
  },
  {
    // B4-FIX3 item 7 — auditoria de coerência etária encontrou este
    // evento com idadeMinima 17, mas a CNH exige 18 anos pela política
    // já estabelecida do projeto (mesma regra usada em availabilitySystem
    // para carro/emprego adulto). Corrigido para não permitir a ação real
    // (não é só uma prévia) um ano antes da idade correta.
    id: 'ado_tirar_cnh',
    titulo: 'Fazer 18 Anos e Tirar a CNH',
    descricao: 'Você completou a idade permitida para dar entrada na Autoescola e tirar sua Carteira Nacional de Habilitação (CNH).',
    idadeMinima: 18,
    idadeMaxima: 20,
    categoria: 'cotidiano',
    peso: 85,
    taxonomia: 'decisao_comportamental',
    unico: true,
    opcoes: [
      {
        id: 'opt_autoescola_firme',
        texto: 'Pagar as aulas e passar de primeira no exame prático de baliza',
        descricaoResultado: 'Parabéns! Você passou na baliza sem encostar no cone e recebeu sua Permissão para Dirigir!',
        consequencias: {
          impactosComportamentais: { independencia: 2, disciplina: 1 },
          stats: { felicidade: 20 },
          dinheiro: -1800,
          hiddenStats: { disciplina: 10, reputacao: 10 },
          adicionarFlag: 'tem_cnh'
        }
      },
      {
        id: 'opt_deixar_depois',
        texto: 'Deixar para tirar a CNH mais para frente quando tiver mais dinheiro',
        descricaoResultado: 'Você economizou dinheiro e continuou usando transporte público e bicicleta.',
        consequencias: {
          impactosComportamentais: { independencia: -1 },
          stats: { felicidade: 0 }
        }
      }
    ]
  },
  {
    id: 'ado_trote_festa',
    titulo: 'A Grande Festa de Formatura do Colégio',
    descricao: 'Chegou o baile de formatura do Ensino Médio com smoking, vestidos de gala e a presença de todos os formandos.',
    idadeMinima: 17,
    idadeMaxima: 17,
    categoria: 'escola',
    peso: 90,
    taxonomia: 'acontecimento_puro',
    natureza: 'acontecimento',
    unico: true,
    // F4 — SEM requisito `emEscola`, e a razão é cronológica.
    //
    // O baile de formatura acontece no ano em que o Ensino Médio TERMINA, e
    // nesse exato ano `emCurso` já é false: `processarAnoEducacao` conclui o
    // curso antes de o evento ser sorteado. Medido: aos 17 anos, 0 de 105
    // vidas estão matriculadas — exigir matrícula zerava o evento.
    //
    // O pressuposto verdadeiro não é "está na escola" e sim "chegou ao fim do
    // Ensino Médio", que é escolaridade alcançada, não matrícula ativa. O
    // vocabulário de elegibilidade não tem um predicado de nível de
    // escolaridade, e criar um é mudança maior do que a F4 comporta. Fica
    // registrado como item para a F5/F8.
    opcoes: [
      {
        id: 'opt_dancar_noite_toda',
        texto: '',
        descricaoResultado: 'Foi uma noite mágica que encerrou com chave de ouro a sua jornada na escola!',
        consequencias: {
          stats: { felicidade: 25, aparencia: 5 },
          hiddenStats: { sociabilidade: 20, reputacao: 15 }
        }
      },
      {
        // B4-FIX2 item 11 — terceira consequência futura leve: quem
        // aprendeu violão na infância (`sabe_tocar_violao`) tem essa
        // habilidade disponível anos depois, num momento em que ela
        // realmente importa. Ligado por FLAG, nunca por texto.
        id: 'opt_tocar_violao_festa',
        texto: '',
        descricaoResultado: 'Você pegou o violão que praticamente ninguém sabia que sabia tocar e puxou um coro com a turma inteira. Virou a lembrança mais contada da formatura.',
        requisito: {
          flagNecessaria: 'sabe_tocar_violao'
        },
        consequencias: {
          stats: { felicidade: 28, aparencia: 3 },
          hiddenStats: { sociabilidade: 22, reputacao: 20 },
        }
      },
      {
        id: 'opt_economizar_festa',
        texto: '',
        descricaoResultado: 'Você poupou uma grana boa, mas ficou vendo os stories dos colegas no dia seguinte.',
        consequencias: {
          stats: { felicidade: -5 },
          dinheiro: 800,
          hiddenStats: { ambicao: 10, disciplina: 10 }
        }
      }
    ]
  }
];
