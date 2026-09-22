/**
 * O mundo da vida adulta — 20 a 60 anos.
 *
 * POR QUE ESTE ARQUIVO EXISTE, com número:
 *
 * Depois que o B4-FIX4 separou acontecimento de decisão, a simulação de 40
 * vidas de 0 a 80 anos mediu, por década adulta, 3,0 DECISÕES contra 1,1
 * ACONTECIMENTOS. Ou seja: na vida adulta o VIDA perguntava quase três
 * vezes mais do que narrava — exatamente o inverso de "a vida acontece, às
 * vezes você decide".
 *
 * A camada de ritmo estava certa; faltava conteúdo. O acervo adulto tinha
 * 15 acontecimentos elegíveis contra 23 decisões, e boa parte daqueles 15
 * ficava em cooldown, de modo que muitos anos destinados a "acontecimento"
 * não encontravam nada e caíam em silêncio por falta de material, não por
 * desenho.
 *
 * Este arquivo é predominantemente de ACONTECIMENTOS: coisas que acontecem
 * com um adulto e que ele não escolhe — a chefia que muda, a conta que
 * vem alta, a obra do vizinho, o corpo que avisa, o bairro que muda em
 * volta, o amigo que reaparece. As poucas decisões aqui são encruzilhadas
 * de verdade.
 *
 * Brasil sem caricatura: boleto, assembleia de condomínio, feira de
 * domingo, grupo da família no celular, apagão, ônibus. Nada de estereótipo
 * nem de "tipo exportação" — é a textura da vida adulta de quem mora aqui.
 *
 * Regras que este conteúdo respeita (a auditoria de catálogo falha se não):
 * acontecimento nunca declara `impactosComportamentais` (quem não escolheu
 * não é caracterizado) e todo desfecho tem `descricaoResultado`, que é o
 * texto que vai para a Linha da Vida.
 */

import { GameEvent } from '../../../types';

export const ADULT_WORLD_EVENTS: GameEvent[] = [
  /* ====================================================================== */
  /*                      JOVEM ADULTO — 18 a 35                            */
  /* ====================================================================== */
  {
    id: 'adm_primeiro_salario_cai',
    titulo: 'O Primeiro Salário Cai na Conta',
    descricao: 'O aplicativo do banco avisa: caiu. É o primeiro dinheiro que é inteiramente seu, e ele já vem com uma lista de destinos.',
    idadeMinima: 18,
    idadeMaxima: 27,
    categoria: 'dinheiro',
    peso: 70,
    taxonomia: 'acontecimento_puro',
    natureza: 'acontecimento',
    unico: true,
    condicoes: { empregado: true },
    opcoes: [
      {
        id: 'opt_salario_sumiu',
        texto: '',
        peso: 3,
        descricaoResultado: 'O dinheiro durou menos do que você imaginava: conta, transporte, um agrado para casa e acabou. Mesmo assim, olhar o extrato e ver que veio do seu trabalho foi diferente de tudo.',
        descricaoMemoria: 'Recebeu o primeiro salário da vida e viu o dinheiro acabar em contas antes do fim do mês.',
        consequencias: { stats: { felicidade: 8 }, hiddenStats: { ambicao: 4 } }
      },
      {
        id: 'opt_salario_guardou',
        texto: '',
        peso: 2,
        descricaoResultado: 'Você separou uma parte antes de gastar qualquer coisa. Não foi muito, mas foi a primeira vez que sobrou dinheiro seu no fim do mês.',
        descricaoMemoria: 'Recebeu o primeiro salário da vida e conseguiu guardar uma parte antes de gastar o resto.',
        consequencias: { dinheiro: 400, stats: { felicidade: 6 }, hiddenStats: { disciplina: 4 } }
      }
    ]
  },
  {
    id: 'adm_republica_conta_dividida',
    titulo: 'A Conta Dividida da Casa',
    descricao: 'Morar com outras pessoas tem seu preço: alguém sempre esquece de passar a parte dele, e o boleto não espera.',
    idadeMinima: 19,
    idadeMaxima: 30,
    categoria: 'cotidiano',
    peso: 55,
    taxonomia: 'acontecimento_puro',
    natureza: 'acontecimento',
    repeticao: { tipo: 'cooldown', cooldownAnos: 3 },
    opcoes: [
      {
        id: 'opt_republica_acertou',
        texto: '',
        peso: 3,
        descricaoResultado: 'Depois de duas conversas meio secas na cozinha, vocês criaram uma planilha e o assunto morreu. A casa ficou mais leve.',
        consequencias: { stats: { felicidade: 4 }, hiddenStats: { sociabilidade: 3, estresse: -3 } }
      },
      {
        id: 'opt_republica_pagou_sozinho',
        texto: '',
        peso: 2,
        descricaoResultado: 'Você acabou cobrindo a diferença para não criar caso. Ninguém agradeceu, e você passou o mês fazendo as contas de cabeça.',
        consequencias: { dinheiro: -320, hiddenStats: { estresse: 6 } }
      }
    ]
  },
  {
    id: 'adm_amigos_se_espalham',
    titulo: 'A Turma se Espalha pelo Mapa',
    descricao: 'Um foi para outro estado atrás de emprego, outra casou e mudou de bairro, um terceiro simplesmente parou de responder. O grupo que se via toda semana virou um grupo de mensagens.',
    idadeMinima: 23,
    idadeMaxima: 36,
    categoria: 'amizade',
    peso: 60,
    taxonomia: 'acontecimento_puro',
    natureza: 'acontecimento',
    unico: true,
    opcoes: [
      {
        id: 'opt_espalha_mantem',
        texto: '',
        peso: 2,
        descricaoResultado: 'Vocês combinaram uma chamada por mês e, contra todas as probabilidades, cumpriram. A distância virou rotina em vez de fim.',
        consequencias: { stats: { felicidade: 5 }, hiddenStats: { sociabilidade: 4 } }
      },
      {
        id: 'opt_espalha_esvazia',
        texto: '',
        peso: 3,
        descricaoResultado: 'As mensagens foram rareando até virarem parabéns de aniversário. Não houve briga nenhuma — só a vida de cada um puxando para um lado.',
        consequencias: { stats: { felicidade: -6 }, hiddenStats: { sociabilidade: -4 } }
      }
    ]
  },
  {
    id: 'adm_mudanca_caminhao_emprestado',
    titulo: 'Mudança de Casa num Sábado',
    descricao: 'Caixas de papelão do mercado, um caminhão alugado por meio período e a ajuda de quem apareceu. A casa nova ainda cheira a tinta.',
    idadeMinima: 20,
    idadeMaxima: 60,
    categoria: 'cotidiano',
    peso: 45,
    taxonomia: 'acontecimento_puro',
    natureza: 'acontecimento',
    repeticao: { tipo: 'cooldown', cooldownAnos: 8 },
    opcoes: [
      {
        id: 'opt_mudanca_tranquila',
        texto: '',
        peso: 3,
        descricaoResultado: 'Deu tudo certo, terminou antes do escurecer e o jantar foi pizza no chão da sala vazia. Um dos melhores jantares em muito tempo.',
        consequencias: { dinheiro: -450, stats: { felicidade: 8 }, hiddenStats: { estresse: -4 } }
      },
      {
        id: 'opt_mudanca_estragou',
        texto: '',
        peso: 2,
        descricaoResultado: 'Choveu no meio da tarde, uma caixa de louça não sobreviveu e o caminhão atrasou duas horas. Você dormiu entre caixas, exausto.',
        descricaoMemoria: 'Mudou de casa num sábado de chuva: o caminhão atrasou, uma caixa de louça se perdeu e a primeira noite foi entre caixas.',
        consequencias: { dinheiro: -700, stats: { felicidade: -4 }, hiddenStats: { estresse: 8 } }
      }
    ]
  },

  /* ====================================================================== */
  /*                            TRABALHO ADULTO                             */
  /* ====================================================================== */
  {
    id: 'adm_chefia_nova',
    titulo: 'Chefia Nova na Área',
    descricao: 'Anunciaram a mudança numa reunião de quinze minutos. Ninguém sabe direito o que vai mudar, e todo mundo tem uma teoria.',
    idadeMinima: 22,
    idadeMaxima: 64,
    categoria: 'trabalho',
    peso: 60,
    taxonomia: 'acontecimento_puro',
    natureza: 'acontecimento',
    condicoes: { empregado: true },
    repeticao: { tipo: 'cooldown', cooldownAnos: 5 },
    opcoes: [
      {
        id: 'opt_chefia_melhor',
        texto: '',
        peso: 2,
        descricaoResultado: 'A pessoa nova ouviu antes de mexer em qualquer coisa. Em poucos meses o clima da equipe melhorou de um jeito que ninguém esperava.',
        consequencias: { stats: { felicidade: 7 }, hiddenStats: { estresse: -7, reputacao: 4 } }
      },
      {
        id: 'opt_chefia_pior',
        texto: '',
        peso: 2,
        descricaoResultado: 'Veio com metas novas, reuniões novas e pouca paciência. O trabalho continuou o mesmo; o desgaste, não.',
        consequencias: { stats: { felicidade: -6 }, hiddenStats: { estresse: 10 } }
      },
      {
        id: 'opt_chefia_indiferente',
        texto: '',
        peso: 3,
        descricaoResultado: 'Mudou o nome na porta da sala e quase nada mais. A rotina seguiu igual, o que, pensando bem, já era alguma coisa.',
        consequencias: { hiddenStats: { estresse: 2 } }
      }
    ]
  },
  {
    id: 'adm_colega_demitido',
    titulo: 'Uma Cadeira Vazia na Segunda-feira',
    descricao: 'Você chega e a mesa ao lado está limpa. O aviso interno usa a palavra "reestruturação" e ninguém comenta em voz alta.',
    idadeMinima: 22,
    idadeMaxima: 64,
    categoria: 'trabalho',
    peso: 55,
    taxonomia: 'acontecimento_puro',
    natureza: 'acontecimento',
    condicoes: { empregado: true },
    repeticao: { tipo: 'cooldown', cooldownAnos: 6 },
    opcoes: [
      {
        id: 'opt_demitido_medo',
        texto: '',
        peso: 3,
        descricaoResultado: 'Você passou semanas lendo entrelinhas em todo e-mail que chegava. O trabalho rendeu menos e o sono também.',
        consequencias: { hiddenStats: { estresse: 12 }, stats: { felicidade: -6 } }
      },
      {
        id: 'opt_demitido_ajudou',
        texto: '',
        peso: 2,
        descricaoResultado: 'Você indicou seu colega para uma vaga que conhecia. Deu certo, e vocês continuaram se falando muito depois disso.',
        consequencias: { hiddenStats: { reputacao: 6, empatia: 4 }, stats: { felicidade: 4 } }
      }
    ]
  },
  {
    id: 'adm_rotina_remota',
    titulo: 'A Rotina Mudou de Endereço',
    descricao: 'Parte da semana passou a ser de casa. Some o trânsito, some também a conversa de corredor — e a mesa da cozinha vira escritório.',
    idadeMinima: 24,
    idadeMaxima: 62,
    categoria: 'trabalho',
    peso: 50,
    taxonomia: 'acontecimento_puro',
    natureza: 'acontecimento',
    condicoes: { empregado: true },
    unico: true,
    opcoes: [
      {
        id: 'opt_remoto_ganhou',
        texto: '',
        peso: 3,
        descricaoResultado: 'As duas horas que você perdia no deslocamento viraram sono, almoço em casa e uma caminhada no fim da tarde. Foi um ano melhor do que os anteriores.',
        consequencias: {
          stats: { felicidade: 9, saude: 4 },
          hiddenStats: { estresse: -9, condicionamentoFisico: 3 }
        }
      },
      {
        id: 'opt_remoto_perdeu',
        texto: '',
        peso: 2,
        descricaoResultado: 'Sem a separação entre casa e trabalho, o expediente foi se esticando. Você percebeu que fazia meses que não conversava com ninguém sobre nada que não fosse prazo.',
        consequencias: {
          stats: { felicidade: -5 },
          hiddenStats: { estresse: 8, sociabilidade: -6 }
        }
      }
    ]
  },
  {
    id: 'adm_reconhecimento_reuniao',
    titulo: 'Seu Nome Citado na Reunião',
    descricao: 'No meio de uma apresentação qualquer, alguém cita um trabalho seu como exemplo. A sala inteira olha.',
    idadeMinima: 24,
    idadeMaxima: 64,
    categoria: 'trabalho',
    peso: 45,
    taxonomia: 'acontecimento_puro',
    natureza: 'acontecimento',
    condicoes: { empregado: true },
    repeticao: { tipo: 'cooldown', cooldownAnos: 7 },
    opcoes: [
      {
        id: 'opt_reconhecimento_abriu_porta',
        texto: '',
        peso: 2,
        descricaoResultado: 'Duas semanas depois te chamaram para um projeto maior. Não veio aumento junto, mas veio espaço — e espaço às vezes vale mais.',
        consequencias: { hiddenStats: { reputacao: 9, ambicao: 5 }, stats: { felicidade: 8 } }
      },
      {
        id: 'opt_reconhecimento_so_elogio',
        texto: '',
        peso: 3,
        descricaoResultado: 'O elogio foi sincero e ficou nisso. Ainda assim, você saiu da sala andando um pouco mais reto.',
        consequencias: { hiddenStats: { reputacao: 4 }, stats: { felicidade: 5 } }
      }
    ]
  },
  {
    id: 'adm_pedido_de_mentoria',
    titulo: 'Pediram para Você Orientar Alguém',
    descricao: 'Chegou gente nova na equipe e a chefia te perguntou se você toparia acompanhar essa pessoa nos primeiros meses. Não vem com aumento, vem com horas.',
    idadeMinima: 28,
    idadeMaxima: 62,
    categoria: 'trabalho',
    peso: 42,
    taxonomia: 'decisao_comportamental',
    condicoes: { empregado: true },
    repeticao: { tipo: 'cooldown', cooldownAnos: 8 },
    opcoes: [
      {
        id: 'opt_mentoria_aceitar',
        texto: 'Aceitar e reservar um tempo fixo por semana para a pessoa',
        descricaoResultado: 'Você bloqueou uma hora toda terça e cumpriu. Ensinar te obrigou a arrumar o que você mesmo fazia no automático.',
        consequencias: {
          hiddenStats: { reputacao: 7, empatia: 5, estresse: 4 },
          stats: { felicidade: 6, inteligencia: 3 },
          impactosComportamentais: { generosidade: 2, disciplina: 1 }
        }
      },
      {
        id: 'opt_mentoria_recusar',
        texto: 'Recusar: sua agenda já não cabe mais nada',
        descricaoResultado: 'Você foi honesto sobre não ter tempo. A pessoa nova se virou com quem pôde, e você entregou seu próprio trabalho em dia.',
        consequencias: {
          hiddenStats: { estresse: -3 },
          impactosComportamentais: { independencia: 1, generosidade: -1 }
        }
      }
    ]
  },

  /* ====================================================================== */
  /*                        CASA, CIDADE E DINHEIRO                         */
  /* ====================================================================== */
  {
    id: 'adm_conta_de_luz_alta',
    titulo: 'A Conta de Luz Veio Assustadora',
    descricao: 'Você olha o valor duas vezes, depois procura o mês anterior para comparar. Não é impressão: dobrou.',
    idadeMinima: 22,
    idadeMaxima: 85,
    categoria: 'dinheiro',
    peso: 55,
    taxonomia: 'acontecimento_puro',
    natureza: 'acontecimento',
    repeticao: { tipo: 'cooldown', cooldownAnos: 4 },
    opcoes: [
      {
        id: 'opt_luz_erro',
        texto: '',
        peso: 2,
        descricaoResultado: 'Era erro de leitura. Depois de duas ligações e um protocolo anotado num papel, o valor foi corrigido na fatura seguinte.',
        descricaoMemoria: 'Contestou uma conta de luz que veio dobrada, e depois de duas ligações conseguiu a correção.',
        consequencias: { dinheiro: -60, hiddenStats: { estresse: 5 } }
      },
      {
        id: 'opt_luz_real',
        texto: '',
        peso: 3,
        descricaoResultado: 'Era bandeira tarifária mesmo. Você pagou, apagou algumas luzes por hábito novo e seguiu a vida.',
        consequencias: { dinheiro: -340, hiddenStats: { estresse: 4 } }
      }
    ]
  },
  {
    id: 'adm_obra_do_vizinho',
    titulo: 'A Obra do Vizinho',
    descricao: 'Começou numa terça, às sete da manhã. Disseram que seriam duas semanas.',
    idadeMinima: 22,
    idadeMaxima: 88,
    categoria: 'cotidiano',
    peso: 50,
    taxonomia: 'acontecimento_puro',
    natureza: 'acontecimento',
    repeticao: { tipo: 'cooldown', cooldownAnos: 6 },
    opcoes: [
      {
        id: 'opt_obra_longa',
        texto: '',
        peso: 3,
        descricaoResultado: 'Foram cinco meses de furadeira. Você aprendeu a reconhecer o barulho de cada ferramenta e passou a sair de casa mais cedo.',
        consequencias: { hiddenStats: { estresse: 9 }, stats: { felicidade: -5 } }
      },
      {
        id: 'opt_obra_rendeu_amizade',
        texto: '',
        peso: 2,
        descricaoResultado: 'Numa das reclamações vocês acabaram conversando de verdade pela primeira vez em anos. A obra terminou e a conversa continuou.',
        consequencias: {
          hiddenStats: { estresse: 4, sociabilidade: 5 },
          // F6 — 'Seu vizinho' era um rótulo ocupando o campo NOME: a aba
          // Pessoas exibia literalmente "Seu vizinho, 44 anos". Sem `nome`,
          // o eventSystem agora sorteia um nome brasileiro coerente com o
          // gênero, e a vizinhança fica registrada como ORIGEM da relação.
          adicionarFamiliar: {
            tipo: 'amigo', relacionamento: 58, idade: 44,
            origemSocial: 'vizinhanca', situacaoAtual: 'Vizinho de porta'
          }
        }
      }
    ]
  },
  {
    id: 'adm_apagao_no_bairro',
    titulo: 'Apagão no Bairro',
    descricao: 'A energia cai no começo da noite e o bairro inteiro vai junto. Pelas janelas abertas dá para ouvir as pessoas conversando de sacada em sacada.',
    idadeMinima: 16,
    idadeMaxima: 92,
    categoria: 'comunidade',
    peso: 48,
    taxonomia: 'acontecimento_puro',
    natureza: 'acontecimento',
    repeticao: { tipo: 'cooldown', cooldownAnos: 5 },
    opcoes: [
      {
        id: 'opt_apagao_rua',
        texto: '',
        peso: 3,
        descricaoResultado: 'Com todo mundo sem nada para fazer, a calçada encheu. Foram três horas de conversa com gente que você via todo dia e nunca tinha ouvido falar.',
        consequencias: { stats: { felicidade: 7 }, hiddenStats: { sociabilidade: 6 } }
      },
      {
        id: 'opt_apagao_geladeira',
        texto: '',
        peso: 2,
        descricaoResultado: 'Voltou só de madrugada. Boa parte do que estava na geladeira teve que ir fora, e o susto do prejuízo demorou a passar.',
        consequencias: { dinheiro: -220, stats: { felicidade: -4 }, hiddenStats: { estresse: 5 } }
      }
    ]
  },
  {
    id: 'adm_assembleia_condominio',
    titulo: 'Assembleia do Prédio',
    descricao: 'Convocação colada no elevador: vão decidir uma obra na fachada e um aumento na taxa. Às vinte horas, na garagem.',
    idadeMinima: 26,
    idadeMaxima: 80,
    categoria: 'comunidade',
    peso: 40,
    taxonomia: 'decisao_comportamental',
    repeticao: { tipo: 'cooldown', cooldownAnos: 6 },
    // F4 — assembleia de condomínio pressupõe morar em imóvel próprio.
    condicoes: { temImovel: true },
    opcoes: [
      {
        id: 'opt_assembleia_ir_falar',
        texto: 'Ir, ouvir todo mundo e defender uma proposta de meio-termo',
        descricaoResultado: 'A discussão foi longa, mas a sua proposta acabou aprovada. Desde então as pessoas do prédio te cumprimentam pelo nome.',
        consequencias: {
          hiddenStats: { reputacao: 8, sociabilidade: 5, estresse: 3 },
          stats: { felicidade: 4 },
          impactosComportamentais: { coragem: 2, sociabilidade: 1 }
        }
      },
      {
        id: 'opt_assembleia_nao_ir',
        texto: 'Não ir — quem foi que decida',
        descricaoResultado: 'Aprovaram a versão mais cara da obra. Você recebeu o comunicado por baixo da porta, junto com o boleto novo.',
        consequencias: {
          dinheiro: -800,
          hiddenStats: { estresse: 4 },
          impactosComportamentais: { independencia: 1 }
        }
      }
    ]
  },
  {
    id: 'adm_reencontro_na_feira',
    titulo: 'Um Rosto Conhecido na Feira',
    descricao: 'Entre a banca de tomate e a de peixe, alguém te chama pelo nome. Leva uns segundos para a ficha cair.',
    idadeMinima: 25,
    idadeMaxima: 88,
    categoria: 'amizade',
    peso: 45,
    taxonomia: 'acontecimento_puro',
    natureza: 'acontecimento',
    repeticao: { tipo: 'cooldown', cooldownAnos: 7 },
    opcoes: [
      {
        id: 'opt_feira_conversa_boa',
        texto: '',
        peso: 3,
        descricaoResultado: 'Vocês conversaram encostados na banca até a feira começar a desmontar. Saiu dali com o número atualizado e uma vontade real de reencontrar.',
        consequencias: { stats: { felicidade: 8 }, hiddenStats: { sociabilidade: 5 } }
      },
      {
        id: 'opt_feira_conversa_morna',
        texto: '',
        peso: 2,
        descricaoResultado: 'Trocaram duas frases de gentileza e cada um seguiu com sua sacola. Você passou o resto da manhã tentando lembrar de onde conhecia aquela pessoa.',
        consequencias: { stats: { felicidade: 2 } }
      }
    ]
  },
  {
    id: 'adm_bairro_mudou',
    titulo: 'O Bairro Mudou de Cara',
    descricao: 'A padaria de sempre virou uma loja de celular. O terreno baldio onde você jogava bola agora tem prédio.',
    idadeMinima: 30,
    idadeMaxima: 88,
    categoria: 'comunidade',
    peso: 45,
    taxonomia: 'acontecimento_puro',
    natureza: 'acontecimento',
    repeticao: { tipo: 'cooldown', cooldownAnos: 10 },
    opcoes: [
      {
        id: 'opt_bairro_saudade',
        texto: '',
        peso: 3,
        descricaoResultado: 'Você passou a fazer caminhos mais longos só para evitar as esquinas que não reconhecia mais. O bairro ficou melhor para quem chegou e mais estranho para quem ficou.',
        consequencias: { stats: { felicidade: -5 }, hiddenStats: { estresse: 3 } }
      },
      {
        id: 'opt_bairro_gostou',
        texto: '',
        peso: 2,
        descricaoResultado: 'Abriu uma praça onde não tinha nada e a rua ganhou vida à noite. Você passou a sair de casa mais vezes do que nos dez anos anteriores.',
        consequencias: { stats: { felicidade: 7 }, hiddenStats: { sociabilidade: 4 } }
      }
    ]
  },

  /* ====================================================================== */
  /*                       FAMÍLIA E RELAÇÕES ADULTAS                       */
  /* ====================================================================== */
  {
    id: 'adm_grupo_da_familia',
    titulo: 'O Grupo da Família no Celular',
    descricao: 'Duzentas mensagens não lidas, sendo cento e oitenta bom-dia. E, no meio delas, uma notícia de verdade que quase passou batido.',
    idadeMinima: 25,
    idadeMaxima: 88,
    categoria: 'familia',
    peso: 48,
    taxonomia: 'acontecimento_puro',
    natureza: 'acontecimento',
    repeticao: { tipo: 'cooldown', cooldownAnos: 5 },
    opcoes: [
      {
        id: 'opt_grupo_viu_a_tempo',
        texto: '',
        peso: 3,
        descricaoResultado: 'Você rolou a conversa inteira e achou o recado importante. Ligou no mesmo dia, e a ligação valeu mais do que qualquer mensagem valeria.',
        consequencias: { relacionamentoDelta: { delta: 7 }, stats: { felicidade: 5 } }
      },
      {
        id: 'opt_grupo_perdeu',
        texto: '',
        peso: 2,
        descricaoResultado: 'Você só soube dias depois, por outra pessoa. Ninguém cobrou nada, o que de certa forma foi pior.',
        consequencias: { relacionamentoDelta: { delta: -5 }, stats: { felicidade: -4 } }
      }
    ]
  },
  {
    id: 'adm_pais_precisando',
    titulo: 'Seus Pais Começam a Precisar de Você',
    descricao: 'Antes era você quem ligava pedindo ajuda. Agora as ligações vêm no outro sentido: uma consulta para marcar, um aplicativo que não abre, uma dúvida sobre um documento.',
    idadeMinima: 33,
    idadeMaxima: 66,
    categoria: 'familia',
    peso: 55,
    taxonomia: 'acontecimento_puro',
    natureza: 'acontecimento',
    unico: true,
    opcoes: [
      {
        id: 'opt_pais_assumiu',
        texto: '',
        peso: 3,
        descricaoResultado: 'Você foi assumindo as coisas aos poucos, quase sem perceber. Cansa, e ao mesmo tempo vocês nunca conversaram tanto quanto neste ano.',
        consequencias: {
          relacionamentoDelta: { relationType: 'mae', delta: 10 },
          hiddenStats: { empatia: 7, estresse: 8 },
          stats: { felicidade: 3 }
        }
      },
      {
        id: 'opt_pais_dividiu',
        texto: '',
        peso: 2,
        descricaoResultado: 'Vocês combinaram um revezamento na família e cada um ficou com uma parte. Funcionou melhor do que qualquer um esperava.',
        consequencias: {
          relacionamentoDelta: { delta: 6 },
          hiddenStats: { empatia: 5, estresse: 3 },
          stats: { felicidade: 5 }
        }
      }
    ]
  },
  {
    id: 'adm_amigo_de_infancia_reaparece',
    titulo: 'Alguém da Infância Reaparece',
    descricao: 'Uma mensagem de um número desconhecido, com uma foto antiga anexada e a pergunta: "lembra disso?".',
    idadeMinima: 30,
    idadeMaxima: 75,
    categoria: 'amizade',
    peso: 42,
    taxonomia: 'acontecimento_puro',
    natureza: 'acontecimento',
    repeticao: { tipo: 'cooldown', cooldownAnos: 12 },
    opcoes: [
      {
        id: 'opt_reaparece_virou_amizade',
        texto: '',
        peso: 2,
        descricaoResultado: 'Vocês marcaram um café que durou quatro horas. Vinte anos depois, era como se nenhum deles tivesse passado.',
        consequencias: {
          stats: { felicidade: 12 },
          hiddenStats: { sociabilidade: 6 },
          // F6 — amizade de infância que reaparece: a origem é a escola.
          adicionarFamiliar: {
            tipo: 'amigo', relacionamento: 72, idade: 38, origemSocial: 'escola'
          }
        }
      },
      {
        id: 'opt_reaparece_ficou_no_passado',
        texto: '',
        peso: 3,
        descricaoResultado: 'A conversa foi boa enquanto durou, mas fora as lembranças vocês não tinham mais muito em comum. Ficou o carinho pelo que foi.',
        descricaoMemoria: 'Reencontrou alguém da infância e descobriu que só restavam as lembranças em comum.',
        consequencias: { stats: { felicidade: 5 } }
      }
    ]
  },
  {
    id: 'adm_casamento_de_amigo',
    titulo: 'Casamento de Alguém Próximo',
    descricao: 'Convite em mãos, data marcada, e a certeza de que vai encontrar meio mundo que você não vê há anos.',
    idadeMinima: 23,
    idadeMaxima: 58,
    categoria: 'amizade',
    peso: 45,
    taxonomia: 'acontecimento_puro',
    natureza: 'acontecimento',
    repeticao: { tipo: 'cooldown', cooldownAnos: 5 },
    opcoes: [
      {
        id: 'opt_casamento_noite_boa',
        texto: '',
        peso: 3,
        descricaoResultado: 'A festa varou. Você dançou mais do que dança em cinco anos e voltou para casa com os pés doendo e o rosto cansado de rir.',
        consequencias: { dinheiro: -400, stats: { felicidade: 12 }, hiddenStats: { sociabilidade: 6, estresse: -6 } }
      },
      {
        id: 'opt_casamento_deslocado',
        texto: '',
        peso: 2,
        descricaoResultado: 'Você passou boa parte da noite na mesa, olhando um grupo de gente que tinha seguido junto enquanto você seguia para outro lado. Saiu cedo.',
        consequencias: { dinheiro: -400, stats: { felicidade: -3 }, hiddenStats: { sociabilidade: -3 } }
      }
    ]
  },

  /* ====================================================================== */
  /*                      CORPO, TEMPO E MEIA-IDADE                         */
  /* ====================================================================== */
  {
    id: 'adm_sono_mudou',
    titulo: 'O Sono Não é Mais o Mesmo',
    descricao: 'Você acorda às quatro da manhã sem motivo nenhum e fica olhando o teto até o despertador tocar. Não é todo dia, mas virou frequente.',
    idadeMinima: 32,
    idadeMaxima: 85,
    categoria: 'saude',
    peso: 48,
    taxonomia: 'acontecimento_puro',
    natureza: 'acontecimento',
    repeticao: { tipo: 'cooldown', cooldownAnos: 6 },
    opcoes: [
      {
        id: 'opt_sono_ajustou',
        texto: '',
        peso: 2,
        descricaoResultado: 'Você mudou o horário do café, tirou a tela da cabeceira e voltou a dormir a noite inteira depois de alguns meses.',
        consequencias: { stats: { saude: 6, felicidade: 5 }, hiddenStats: { estresse: -7 } }
      },
      {
        id: 'opt_sono_arrastou',
        texto: '',
        peso: 3,
        descricaoResultado: 'O cansaço virou pano de fundo do ano. Você foi funcionando, mas as tardes ficaram longas de um jeito que antes não eram.',
        consequencias: { stats: { saude: -5, felicidade: -5 }, hiddenStats: { estresse: 8 } }
      }
    ]
  },
  {
    id: 'adm_letra_pequena',
    titulo: 'A Letra Miúda Ficou Difícil',
    descricao: 'Você afasta o rótulo do braço para conseguir ler o prazo de validade, e percebe que faz um tempo que vem fazendo isso.',
    idadeMinima: 40,
    idadeMaxima: 72,
    categoria: 'saude',
    peso: 50,
    taxonomia: 'acontecimento_puro',
    natureza: 'acontecimento',
    unico: true,
    opcoes: [
      {
        id: 'opt_letra_oculos',
        texto: '',
        peso: 3,
        descricaoResultado: 'Você foi à ótica, saiu com um óculos de leitura e leu a bula inteira no caminho de volta, só porque dava. Bobagem, mas foi bom.',
        consequencias: { dinheiro: -380, stats: { felicidade: 4 }, hiddenStats: { estresse: -3 } }
      },
      {
        id: 'opt_letra_empurrou',
        texto: '',
        peso: 2,
        descricaoResultado: 'Você foi empurrando com o braço esticado e a lanterna do celular. Deu para levar, com uma dor de cabeça a mais no fim do dia.',
        descricaoMemoria: 'Começou a ler tudo de braço esticado, adiando os óculos de leitura por mais um ano.',
        consequencias: { stats: { saude: -3 }, hiddenStats: { estresse: 4 } }
      }
    ]
  },
  {
    id: 'adm_exame_de_rotina',
    titulo: 'O Pedido de Exames Está na Gaveta',
    descricao: 'Aquele papel com os exames de rotina está ali há meses, embaixo de outros papéis. Não dói nada, não incomoda nada.',
    idadeMinima: 30,
    idadeMaxima: 82,
    categoria: 'saude',
    peso: 45,
    taxonomia: 'decisao_comportamental',
    repeticao: { tipo: 'cooldown', cooldownAnos: 7 },
    opcoes: [
      {
        id: 'opt_exame_fez',
        texto: 'Marcar e fazer, mesmo estando se sentindo bem',
        descricaoResultado: 'Você foi, esperou na fila, fez tudo. Estava quase tudo em ordem, e o "quase" foi pequeno o bastante para resolver cedo.',
        consequencias: {
          dinheiro: -180,
          stats: { saude: 8 },
          hiddenStats: { disciplina: 4, estresse: -4 },
          impactosComportamentais: { disciplina: 2 }
        }
      },
      {
        id: 'opt_exame_deixou',
        texto: 'Deixar para quando sobrar tempo',
        descricaoResultado: 'O papel continuou na gaveta e o ano passou. Você não sentiu falta nenhuma — que é exatamente o problema desse tipo de coisa.',
        consequencias: {
          stats: { saude: -5 },
          impactosComportamentais: { disciplina: -2 }
        }
      }
    ]
  },
  {
    id: 'adm_reencontro_de_turma',
    titulo: 'Reencontro de Turma',
    descricao: 'Vinte anos depois, o grupo do colégio marcou um jantar. Metade confirmou, um terço vai aparecer.',
    idadeMinima: 36,
    idadeMaxima: 62,
    categoria: 'amizade',
    peso: 42,
    taxonomia: 'acontecimento_puro',
    natureza: 'acontecimento',
    unico: true,
    opcoes: [
      {
        id: 'opt_turma_leve',
        texto: '',
        peso: 3,
        descricaoResultado: 'Ninguém estava medindo ninguém. Foram três horas de histórias antigas e uma conversa honesta sobre como todo mundo achava que já teria tudo resolvido a essa altura.',
        consequencias: { dinheiro: -180, stats: { felicidade: 10 }, hiddenStats: { sociabilidade: 5 } }
      },
      {
        id: 'opt_turma_comparacao',
        texto: '',
        peso: 2,
        descricaoResultado: 'Deu para sentir a conta sendo feita em silêncio: quem casou, quem ganhou quanto, quem sumiu. Você voltou para casa pensando demais.',
        consequencias: { dinheiro: -180, stats: { felicidade: -6 }, hiddenStats: { estresse: 7 } }
      }
    ]
  },
  {
    id: 'adm_rotina_de_anos_acaba',
    titulo: 'Uma Rotina de Anos Termina',
    descricao: 'O bar fechou, o time acabou, o grupo parou de se reunir — não importa qual: uma coisa que você fazia toda semana há anos simplesmente deixou de existir.',
    idadeMinima: 38,
    idadeMaxima: 78,
    categoria: 'cotidiano',
    peso: 42,
    taxonomia: 'acontecimento_puro',
    natureza: 'acontecimento',
    repeticao: { tipo: 'cooldown', cooldownAnos: 12 },
    opcoes: [
      {
        id: 'opt_rotina_vazio',
        texto: '',
        peso: 3,
        descricaoResultado: 'Nas primeiras semanas você continuou reservando aquele horário sem ter o que fazer nele. Demorou para o corpo entender que tinha acabado.',
        consequencias: { stats: { felicidade: -7 }, hiddenStats: { estresse: 5 } }
      },
      {
        id: 'opt_rotina_abriu_espaco',
        texto: '',
        peso: 2,
        descricaoResultado: 'O buraco na agenda acabou virando outra coisa. Levou uns meses, mas você encontrou o que fazer com aquele tempo.',
        consequencias: { stats: { felicidade: 5 }, hiddenStats: { sociabilidade: 3 } }
      }
    ]
  },
  {
    id: 'adm_voltar_a_um_hobby',
    titulo: 'A Caixa Guardada no Armário',
    descricao: 'Mexendo no armário você encontra a caixa com aquilo que você largou há vinte anos: o instrumento, as tintas, as ferramentas. Ainda funciona.',
    idadeMinima: 36,
    idadeMaxima: 78,
    categoria: 'hobby',
    peso: 40,
    taxonomia: 'decisao_comportamental',
    repeticao: { tipo: 'cooldown', cooldownAnos: 10 },
    opcoes: [
      {
        id: 'opt_hobby_retomar',
        texto: 'Separar um tempo na semana e retomar, mesmo enferrujado',
        descricaoResultado: 'Os primeiros meses foram humilhantes. Depois as mãos foram lembrando, e você reencontrou uma parte de si que tinha simplesmente parado de existir.',
        consequencias: {
          stats: { felicidade: 12 },
          hiddenStats: { disciplina: 5, estresse: -8 },
          impactosComportamentais: { disciplina: 2, independencia: 1 }
        }
      },
      {
        id: 'opt_hobby_guardar',
        texto: 'Guardar de volta — não é mais a sua fase',
        descricaoResultado: 'Você fechou a caixa e colocou no alto do armário. Não é tristeza; é só que a vida ficou com outras formas.',
        consequencias: {
          stats: { felicidade: -2 },
          impactosComportamentais: { disciplina: -1 }
        }
      }
    ]
  }
];
