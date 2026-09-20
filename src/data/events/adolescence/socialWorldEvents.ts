/**
 * B4-FIX3 item 3/13/14 — mundo social dos 12-17 anos: grupos, amizade,
 * identidade, rivalidade, internet e a semente da "paixão secreta" que o
 * evento `ado_primeiro_beijo` (adolescenceEvents.ts) já sabe consumir por
 * `relationType: 'paixao'` (nunca por texto).
 *
 * `adolescenceEvents.ts` (B4/B4-FIX) já cobria cola na prova, primeiro
 * beijo, smartphone, ENEM, CNH e formatura — tudo bem coberto, mas quase
 * todo evento existente ali era escola/família. Este módulo soma grupos
 * sociais, hobby, esporte, comunidade e o NPC de paixão secreta.
 */

import { GameEvent } from '../../../types';

export const ADOLESCENCE_SOCIAL_EVENTS: GameEvent[] = [
  {
    id: 'ado_paixao_secreta',
    titulo: 'Aquela Pessoa da Sala ao Lado',
    descricao: 'Tem uma pessoa da sua turma que você não consegue tirar da cabeça, mas nunca teve coragem de puxar assunto.',
    idadeMinima: 12,
    idadeMaxima: 15,
    categoria: 'romance',
    peso: 80,
    unico: true,
    opcoes: [
      {
        id: 'opt_admirar_de_longe',
        texto: 'Admirar de longe por enquanto, sem se arriscar a falar',
        descricaoResultado: 'Você guardou esse sentimento só para você — por enquanto. Talvez o momento certo apareça.',
        consequencias: {
          stats: { felicidade: 6 },
          hiddenStats: { sociabilidade: 2 },
          adicionarFlag: 'tem_paixao_secreta',
          adicionarFamiliar: {
            tipo: 'paixao',
            idade: 14,
            relacionamento: 55,
            situacaoAtual: 'Colega de turma que você secretamente admira'
          }
        }
      },
      {
        id: 'opt_puxar_assunto_paixao',
        texto: 'Juntar coragem e puxar assunto de qualquer jeito',
        descricaoResultado: 'A conversa saiu mais desajeitada do que você planejou, mas vocês dois riram bastante e ficou tudo bem mais leve.',
        consequencias: {
          stats: { felicidade: 10 },
          hiddenStats: { sociabilidade: 6 },
          impactosComportamentais: { coragem: 1 },
          adicionarFlag: 'tem_paixao_secreta',
          adicionarFamiliar: {
            tipo: 'paixao',
            idade: 14,
            relacionamento: 65,
            situacaoAtual: 'Colega de turma que você secretamente admira'
          }
        }
      }
    ]
  },
  {
    id: 'ado_grupo_amigos_turma',
    titulo: 'A Turma da Escola se Forma',
    descricao: 'No segundo semestre, um grupo de colegas passa a te chamar sempre para sentar junto no intervalo.',
    idadeMinima: 12,
    idadeMaxima: 14,
    categoria: 'amizade',
    peso: 80,
    repeticao: { tipo: 'cooldown', cooldownAnos: 3 },
    opcoes: [
      {
        // B4-FIX3 item 12 — consequência futura de `esc_achado_perdido_dinheiro`
        // (ver schoolWorldEvents.ts): quem já construiu fama de honesto na
        // infância é convidado a cuidar do "caixinha" do grupo, ligado só
        // pela flag `reputacao_honestidade_infancia`, nunca por texto.
        id: 'opt_entrar_grupo_confianca',
        texto: 'Aceitar entrar no grupo e ficar responsável pela vaquinha do lanche',
        descricaoResultado: 'Ninguém nem discutiu quem ficaria com o dinheiro da vaquinha — todo mundo lembrava de você como "aquele que devolveu o dinheiro achado" anos atrás.',
        requisito: { flagNecessaria: 'reputacao_honestidade_infancia' },
        consequencias: {
          stats: { felicidade: 16 },
          hiddenStats: { sociabilidade: 12, reputacao: 10 },
          adicionarFamiliar: {
            tipo: 'amigo',
            idade: 13,
            relacionamento: 80,
            situacaoAtual: 'Amigo do grupo da escola'
          },
          impactosComportamentais: { sociabilidade: 1, disciplina: 1 }
        }
      },
      {
        id: 'opt_entrar_grupo_turma',
        texto: 'Aceitar de vez fazer parte do grupo',
        descricaoResultado: 'Vocês viraram um grupo fechado, com piadas internas e planos para o fim de semana.',
        consequencias: {
          stats: { felicidade: 14 },
          hiddenStats: { sociabilidade: 12 },
          adicionarFamiliar: {
            tipo: 'amigo',
            idade: 13,
            relacionamento: 75,
            situacaoAtual: 'Amigo do grupo da escola'
          },
          impactosComportamentais: { sociabilidade: 1 }
        }
      },
      {
        id: 'opt_manter_distancia_grupo',
        texto: 'Manter uma certa distância e continuar com poucos amigos próximos',
        descricaoResultado: 'Você preferiu ter menos amigos, mas mais próximos, e não se arrependeu.',
        consequencias: {
          stats: { felicidade: 8 },
          hiddenStats: { sociabilidade: -2 },
          impactosComportamentais: { independencia: 1 }
        }
      }
    ]
  },
  {
    id: 'ado_rivalidade_escolar',
    titulo: 'Competição Direta com um Colega',
    descricao: 'Um colega da turma vive comparando notas, roupas e conquistas com você, sempre tentando se sair melhor.',
    idadeMinima: 12,
    idadeMaxima: 17,
    categoria: 'amizade',
    peso: 65,
    repeticao: { tipo: 'cooldown', cooldownAnos: 3 },
    opcoes: [
      {
        id: 'opt_ignorar_rivalidade',
        texto: 'Ignorar as comparações e seguir seu próprio ritmo',
        descricaoResultado: 'Você não entrou no jogo de comparação, e isso incomodou ainda mais o colega competitivo.',
        consequencias: {
          stats: { felicidade: 8 },
          hiddenStats: { disciplina: 5 },
          adicionarFamiliar: {
            tipo: 'rival',
            idade: 14,
            relacionamento: 30,
            situacaoAtual: 'Colega sempre competindo com você'
          },
          impactosComportamentais: { independencia: 1 }
        }
      },
      {
        id: 'opt_entrar_competicao',
        texto: 'Entrar de cabeça na competição para provar que é melhor',
        descricaoResultado: 'Vocês dois se esforçaram mais que o normal — suas notas melhoraram, mas o clima entre vocês ficou tenso.',
        consequencias: {
          stats: { inteligencia: 6, felicidade: -3 },
          hiddenStats: { ambicao: 8, estresse: 8 },
          adicionarFamiliar: {
            tipo: 'rival',
            idade: 14,
            relacionamento: 20,
            situacaoAtual: 'Colega sempre competindo com você'
          },
          impactosComportamentais: { impulsividade: 1 }
        }
      }
    ]
  },
  {
    id: 'tec_rede_social_primeira',
    titulo: 'Primeira Conta em Rede Social',
    descricao: 'Com o celular novo, chegou a hora de decidir se você vai criar uma conta em uma rede social como os colegas.',
    idadeMinima: 13,
    idadeMaxima: 15,
    categoria: 'tecnologia',
    peso: 75,
    unico: true,
    opcoes: [
      {
        id: 'opt_criar_conta_moderada',
        texto: 'Criar a conta, mas combinar horários de uso com a família',
        descricaoResultado: 'Você entrou nas redes sem que isso engolisse seu tempo — e ainda aprendeu a reconhecer perfis falsos.',
        consequencias: {
          stats: { felicidade: 10 },
          hiddenStats: { sociabilidade: 8, disciplina: 5 },
          adicionarFlag: 'tem_rede_social',
          impactosComportamentais: { disciplina: 1 }
        }
      },
      {
        id: 'opt_esperar_rede_social',
        texto: 'Preferir esperar mais um tempo antes de criar a conta',
        descricaoResultado: 'Você não teve pressa. Quando decidiu entrar, já sabia bem quais cuidados tomar.',
        consequencias: {
          stats: { felicidade: 4 },
          hiddenStats: { disciplina: 4 },
          impactosComportamentais: { independencia: 1 }
        }
      }
    ]
  },
  {
    id: 'esp_time_voleibol_escola',
    titulo: 'Time de Vôlei da Escola nas Interclasses',
    descricao: 'A escola organizou o campeonato interclasses de vôlei e sua turma precisa formar um time.',
    idadeMinima: 12,
    idadeMaxima: 17,
    categoria: 'esporte',
    peso: 70,
    repeticao: { tipo: 'cooldown', cooldownAnos: 3 },
    opcoes: [
      {
        id: 'opt_jogar_titular_volei',
        texto: 'Treinar na hora do intervalo para jogar como titular',
        descricaoResultado: 'Seu time chegou à final do campeonato, e você virou referência de dedicação para a turma.',
        consequencias: {
          stats: { saude: 8, felicidade: 12 },
          hiddenStats: { condicionamentoFisico: 12, sociabilidade: 8, reputacao: 8 },
          impactosComportamentais: { disciplina: 1, sociabilidade: 1 }
        }
      },
      {
        id: 'opt_ajudar_organizacao_volei',
        texto: 'Ajudar organizando os horários dos jogos em vez de jogar',
        descricaoResultado: 'Você não pegou na bola, mas o campeonato só rolou direito por causa da sua organização.',
        consequencias: {
          stats: { felicidade: 8 },
          hiddenStats: { disciplina: 8, reputacao: 5 },
          impactosComportamentais: { disciplina: 1 }
        }
      }
    ]
  },
  {
    id: 'com_voluntariado_ong_bairro',
    titulo: 'Voluntariado numa ONG do Bairro',
    descricao: 'Uma ONG local que cuida de animais abandonados está pedindo voluntários adolescentes para ajudar nos fins de semana.',
    idadeMinima: 14,
    idadeMaxima: 17,
    categoria: 'comunidade',
    peso: 60,
    repeticao: { tipo: 'cooldown', cooldownAnos: 3 },
    opcoes: [
      {
        id: 'opt_virar_voluntario_ong',
        texto: 'Se voluntariar todo sábado de manhã',
        descricaoResultado: 'Você passou a dedicar as manhãs de sábado à ONG e descobriu uma vontade real de ajudar os outros.',
        consequencias: {
          stats: { felicidade: 14 },
          hiddenStats: { empatia: 15, reputacao: 8 },
          adicionarFlag: 'voluntario_ong',
          impactosComportamentais: { generosidade: 1, empatia: 1 }
        }
      },
      {
        id: 'opt_nao_ter_tempo_ong',
        texto: 'Não ter tempo disponível com a rotina de estudos',
        descricaoResultado: 'Você não conseguiu se comprometer no momento, mas guardou a ideia para outra hora.',
        consequencias: {
          stats: { felicidade: 2 }
        }
      }
    ]
  },
  {
    id: 'ado_pressao_grupo_festa',
    titulo: 'Pressão para Ir a uma Festa Não Autorizada',
    descricao: 'O grupo de amigos combinou ir a uma festa numa casa sem supervisão de adultos, e todo mundo espera que você vá também.',
    idadeMinima: 15,
    idadeMaxima: 17,
    categoria: 'amizade',
    peso: 65,
    repeticao: { tipo: 'cooldown', cooldownAnos: 2 },
    opcoes: [
      {
        id: 'opt_ir_festa_avisando',
        texto: 'Ir à festa, mas avisar a família onde você vai estar',
        descricaoResultado: 'Você aproveitou a festa com os amigos e voltou no horário combinado, sem drama nenhum.',
        consequencias: {
          stats: { felicidade: 14 },
          hiddenStats: { sociabilidade: 8 },
          relacionamentoDelta: { delta: 4 },
          impactosComportamentais: { sociabilidade: 1 }
        }
      },
      {
        id: 'opt_recusar_festa',
        texto: 'Recusar o convite mesmo sabendo que o grupo vai comentar',
        descricaoResultado: 'Alguns colegas comentaram na segunda-feira, mas você não se abalou com isso.',
        consequencias: {
          stats: { felicidade: 4 },
          hiddenStats: { disciplina: 6 },
          impactosComportamentais: { independencia: 1, disciplina: 1 }
        }
      },
      {
        id: 'opt_ir_festa_escondido',
        texto: 'Ir escondido, dizendo que ia dormir na casa de um amigo',
        descricaoResultado: 'Deu tudo certo na festa, mas a mentira pesou na consciência — e um comentário desatento quase te entregou.',
        consequencias: {
          stats: { felicidade: 10 },
          hiddenStats: { estresse: 8 },
          relacionamentoDelta: { delta: -6 },
          impactosComportamentais: { impulsividade: 1 }
        }
      }
    ]
  },
  {
    id: 'ado_escolha_futuro_profissional',
    titulo: 'Feira de Profissões da Escola',
    descricao: 'A escola organizou uma feira de profissões com estandes de diferentes áreas para ajudar os alunos do último ano a decidir o futuro.',
    idadeMinima: 16,
    idadeMaxima: 17,
    categoria: 'escola',
    peso: 70,
    unico: true,
    opcoes: [
      {
        id: 'opt_explorar_varios_estandes',
        texto: 'Visitar vários estandes diferentes antes de decidir qualquer coisa',
        descricaoResultado: 'Você saiu da feira com mais dúvidas do que entrou, mas também com ideias novas que nunca tinha considerado.',
        consequencias: {
          stats: { inteligencia: 6, felicidade: 8 },
          hiddenStats: { ambicao: 6 }
        }
      },
      {
        id: 'opt_confirmar_area_ja_escolhida',
        texto: 'Ir direto ao estande da área que você já tinha decidido seguir',
        descricaoResultado: 'A conversa confirmou sua escolha e você saiu ainda mais motivado para os próximos passos.',
        consequencias: {
          stats: { felicidade: 10 },
          hiddenStats: { disciplina: 8, ambicao: 8 },
          impactosComportamentais: { disciplina: 1 }
        }
      }
    ]
  },
  {
    id: 'hob_banda_garagem',
    titulo: 'Formar uma Banda com os Amigos',
    descricao: 'Um grupo de amigos que também toca instrumento propõe formar uma banda para tocar na garagem de alguém.',
    idadeMinima: 13,
    idadeMaxima: 17,
    categoria: 'hobby',
    peso: 60,
    condicoes: { flagsNecessarias: ['sabe_tocar_violao'] },
    repeticao: { tipo: 'cooldown', cooldownAnos: 3 },
    opcoes: [
      {
        id: 'opt_entrar_banda',
        texto: 'Topar entrar na banda e ensaiar toda semana',
        descricaoResultado: 'A banda ficou longe de ser profissional, mas os ensaios viraram o melhor momento da sua semana.',
        consequencias: {
          stats: { felicidade: 16 },
          hiddenStats: { sociabilidade: 10, disciplina: 5 },
          adicionarFlag: 'toca_em_banda',
          impactosComportamentais: { sociabilidade: 1 }
        }
      },
      {
        id: 'opt_recusar_banda',
        texto: 'Preferir tocar sozinho, sem compromisso de banda',
        descricaoResultado: 'Você continuou tocando por conta própria, no seu tempo, sem cobrança de ensaio.',
        consequencias: {
          stats: { felicidade: 6 },
          impactosComportamentais: { independencia: 1 }
        }
      }
    ]
  }
];
