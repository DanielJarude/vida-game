/**
 * VIDA 17 · O CATÁLOGO DAS MENSAGENS — situações (não frases trocadas de nome): cada uma tem o seu motivo na vida da
 * pessoa ou na sua, e é escrita em quatro jeitos de falar (o temperamento de quem manda decide o jeito):
 *
 *   expansivo   extrovertido: exclamação, risada, emoji, áudio de três minutos;
 *   contido     reservado: frase curta, direta, sem rodeio;
 *   carinhoso   afável: cuida, pergunta de você, "meu bem";
 *   ironico     aberto e pouco afável: humor seco, provocação.
 *
 * Marcas: {nome} quem manda · {eu} o seu nome · {o} a flexão de gênero do jogador · {marco} uma lembrança REAL dos dois
 * (lida da história do vínculo) · {feito} um acontecimento REAL da sua vida (lido da biografia) · {cargo} o trabalho da
 * pessoa · {idade} a sua idade · {programa} o que ficou combinado · {assunto} o motivo da briga (lido do vínculo).
 */

export type Tom17 = 'expansivo' | 'contido' | 'carinhoso' | 'ironico';
export type Falas17 = Record<Tom17, string[]>;

export const FALAS17: Record<string, Falas17> = {
  /* ---------------- Desabafo: a pessoa está passando por algo e escolheu VOCÊ para contar. */
  desabafo_trabalho: {
    expansivo: ['"Preciso desabafar senão eu explodo: meu chefe me fez refazer TUDO de novo. Três semanas jogadas fora!!"', '"Você tem cinco minutos? Hoje no trabalho foi o caos, e eu só consigo pensar em largar tudo e vender coco na praia 😩"', '"Áudio de 4 minutos chegando. Resumo: o trabalho tá me engolindo."'],
    contido: ['"Dia ruim no trabalho. Só queria contar pra alguém."', '"Tô pensando em pedir demissão. Ainda não falei pra ninguém."', '"O trabalho anda pesado. Você tem um tempo pra conversar?"'],
    carinhoso: ['"Desculpa vir com isso, mas você é quem eu sei que escuta: o trabalho tá me tirando o sono."', '"Oi, meu bem. Posso te contar uma coisa que tá me pesando? É o trabalho de novo."'],
    ironico: ['"Atualização da minha carreira brilhante: hoje fui culpad{po} por um erro do estagiário. Do estagiário de OUTRO setor."', '"Dica de vida: nunca diga \\"pode deixar comigo\\" numa reunião. Tô pagando até hoje."']
  },
  desabafo_amor: {
    expansivo: ['"Amig{o}, senta que lá vem: brigamos DE NOVO. Eu não sei mais o que fazer!!"', '"Preciso da sua opinião sincera sobre o meu relacionamento. Sincera mesmo, hein!"'],
    contido: ['"As coisas em casa não estão boas. Não sei se vai durar."', '"Terminei. Ainda tô processando."'],
    carinhoso: ['"Você me conhece há tanto tempo... acha que eu tô errad{po} de querer mais do que tenho?"', '"Tô com o coração apertado. Posso te ligar mais tarde?"'],
    ironico: ['"Pergunta hipotética: quanto tempo é normal alguém demorar pra responder \\"te amo\\"? Pergunto por um amigo. O amigo sou eu."', '"Meu relacionamento virou série ruim: todo episódio a mesma briga."']
  },
  desabafo_separacao: {
    expansivo: ['"Acabou, {eu}. Depois de tudo, acabou. Me liga, por favor."', '"Tô de mala na mão sem saber pra onde ir. Que fase!"'],
    contido: ['"A gente se separou. Queria que você soubesse por mim."', '"Separação assinada. Tô bem. Mais ou menos."'],
    carinhoso: ['"Não queria que você soubesse por outra pessoa: nos separamos. Tô precisando dos amigos perto."'],
    ironico: ['"Novidade: voltei a ser solteir{po}. Aceito convites, conselhos e pizza."']
  },
  desabafo_dinheiro: {
    expansivo: ['"As contas chegaram todas no mesmo dia, parece combinado! Tô desesperad{po}!!"'],
    contido: ['"Mês apertado. Muito apertado."', '"Tô devendo mais do que consigo pagar. Não sei por onde começar."'],
    carinhoso: ['"Fico com vergonha de falar disso, mas tô passando um aperto com dinheiro. Só precisava contar pra alguém de confiança."'],
    ironico: ['"Meu extrato bancário é um filme de terror e eu sou o personagem que desce no porão."']
  },
  desabafo_saude: {
    expansivo: ['"Fui no médico e agora vou ter que fazer um monte de exame. Tô morrendo de medo, fala comigo!"'],
    contido: ['"Exames amanhã. Tô tens{po}."', '"O médico pediu mais exames. Ainda não sei de nada."'],
    carinhoso: ['"Não conta pra ninguém ainda, mas tô fazendo uns exames. Queria que você soubesse."'],
    ironico: ['"Fui no médico por causa de uma dor nas costas e saí com seis pedidos de exame. Maravilha de sistema."']
  },
  desabafo_cansaco: {
    expansivo: ['"Tô exaust{po}! Faz semanas que não durmo direito. Me fala que vai melhorar!"', '"Hoje chorei no ônibus do nada. Tá tudo bem. Acho."'],
    contido: ['"Ando cansad{po} de tudo. Sem motivo específico."', '"Fase estranha. Sem vontade de nada."'],
    carinhoso: ['"Tô numa fase meio cinza. Não precisa resolver nada, só queria conversar com alguém que gosta de mim."'],
    ironico: ['"Meu nível de energia é o de um celular com 3% de bateria que alguém tá usando pra ver vídeo."']
  },
  desabafo_familia: {
    expansivo: ['"Almoço de família virou guerra de novo! Por que é tão difícil todo mundo se dar bem?!"'],
    contido: ['"Discussão feia em casa. Saí pra respirar."', '"As coisas com a minha família estão complicadas."'],
    carinhoso: ['"Posso desabafar? Briguei com a minha mãe e tô me sentindo péssim{po}."'],
    ironico: ['"Grupo da família hoje: três brigas políticas, duas correntes e uma tia saindo. Dia normal."']
  },

  /* ---------------- Brincadeira: a amizade que não precisa de motivo. */
  brincadeira_meme: {
    expansivo: ['"OLHA ESSE VÍDEO E ME DIZ QUE NÃO É VOCÊ 😂😂😂"', '"Achei a sua foto de perfil ideal: um gato caindo do sofá. Igualzinho."', '"Mandei esse meme pra você e pra mais ninguém, porque só você vai entender."'],
    contido: ['"Isso aqui é a sua cara."', '"Vi isso e lembrei de você. 😄"'],
    carinhoso: ['"Vi uma coisa hoje que me fez rir e pensei: preciso mandar pra {eu}!"'],
    ironico: ['"Encontrei a prova definitiva de que você estava errad{o} naquela discussão de 2 anos atrás. Segue anexo."', '"Teste de amizade: se você não rir disso, a gente termina."']
  },
  brincadeira_lembranca: {
    expansivo: ['"Acabei de lembrar daquele dia: {marco} — tô rindo sozinh{po} no meio da rua!"', '"Você lembra?! {marco} Que saudade da gente assim!"'],
    contido: ['"Lembrei hoje: {marco} Bons tempos."'],
    carinhoso: ['"Achei uma lembrança nossa guardada: {marco} Que sorte a minha de ter você."'],
    ironico: ['"Fato histórico: {marco} E você ainda nega até hoje."']
  },
  brincadeira_aposta: {
    expansivo: ['"Aposta valendo uma pizza: o seu time não ganha esse fim de semana! Aceita?"', '"Desafio: quem perder o jogo de domingo paga o açaí!"'],
    contido: ['"Aposto um café que eu acerto o placar de domingo."'],
    carinhoso: ['"Bora fazer aquela aposta boba de sempre? Quem perder paga o almoço."'],
    ironico: ['"Aposta: eu acerto o placar e você me deve respeito eterno. Ou um café."']
  },
  brincadeira_crianca: {
    expansivo: ['"Minha mãe deixou eu mandar mensagem!! Você viu o desenho novo? É MUITO legal!"', '"Adivinha: perdi um dente!! 🦷"'],
    contido: ['"Oi. Amanhã tem educação física?"'],
    carinhoso: ['"Fiz um desenho pra você. Amanhã eu levo."'],
    ironico: ['"Você esqueceu o estojo na minha mochila de novo."']
  },

  /* ---------------- Paquera: alguém está interessad{po}. A resposta é sua. */
  paquera: {
    expansivo: ['"Não sei se isso é estranho, mas não paro de pensar naquela nossa conversa. Bora repetir? Só nós dois? 😊"', '"Você ficou lind{o} naquela foto, sabia? Precisava falar."', '"Topa um drink sexta? Prometo ser uma ótima companhia 😉"'],
    contido: ['"Queria te chamar pra sair. Sem pressão."', '"Gosto da sua companhia. Um café, só nós dois?"'],
    carinhoso: ['"Já faz um tempo que quero te dizer: eu gosto de estar perto de você. Será que a gente podia se ver mais?"'],
    ironico: ['"Estatisticamente, sair comigo é a melhor decisão que você vai tomar esse mês. Topa testar a hipótese?"']
  },
  paquera_adolescente: {
    expansivo: ['"Você vai na festa de sábado?? Fala que vai!! 🙈"', '"Posso te perguntar uma coisa? ... Não, esquece. Ou não. Você gosta de alguém?"'],
    contido: ['"Quer sentar comigo no intervalo amanhã?"'],
    carinhoso: ['"Gostei muito de conversar com você hoje. Boa noite 🙂"'],
    ironico: ['"Minha amiga quer saber se você tá ficando com alguém. Minha amiga, tá?"']
  },
  paquera_segue: {
    expansivo: ['"Então... aquele encontro ainda tá de pé? Já escolhi até a roupa 😅"'],
    contido: ['"Ainda quer sair? Sábado tô livre."'],
    carinhoso: ['"Fiquei feliz com a sua resposta aquele dia. Quando a gente se vê?"'],
    ironico: ['"Lembrete amigável: você me deve um encontro. Tô cobrando juros."']
  },

  /* ---------------- Favor: um pedido pequeno, do dia a dia. */
  favor_mudanca: {
    expansivo: ['"SOCORRO! Mudança no sábado e preciso de braços fortes. Pago a pizza e a cerveja!!"'],
    contido: ['"Vou me mudar no sábado. Consegue ajudar umas horas?"'],
    carinhoso: ['"Odeio pedir, mas você me ajudaria na mudança sábado? Faço aquele almoço que você gosta."'],
    ironico: ['"Oportunidade única: carregar uma geladeira três andares sem elevador. Vagas limitadas. Você foi selecionad{o}."']
  },
  favor_carona: {
    expansivo: ['"Meu voo é às 6 da manhã e o aplicativo tá um absurdo! Será que você me leva? Te devo uma ENORME!"'],
    contido: ['"Consegue me dar uma carona até o aeroporto na quinta cedo?"'],
    carinhoso: ['"Desculpa o horário, mas você conseguiria me levar ao aeroporto quinta? Se não der, tudo bem mesmo."'],
    ironico: ['"Quinta, 5h da manhã, aeroporto. Sei que você ama acordar cedo. Topa?"']
  },
  favor_pet: {
    expansivo: ['"Vou viajar uma semana e meu bichinho vai ficar sozinho! Você cuida? Ele te ama!!"'],
    contido: ['"Pode alimentar meu gato enquanto eu viajo? Uma semana."'],
    carinhoso: ['"Você é a única pessoa em quem eu confio pra cuidar do meu bichinho. Uma semana só, pode ser?"'],
    ironico: ['"Proposta: uma semana de convivência com um animal que me odeia. Ele vai gostar mais de você."']
  },
  favor_curriculo: {
    expansivo: ['"Tô me candidatando numa vaga dos sonhos!! Você dá uma olhada no meu currículo? Você entende disso!"'],
    contido: ['"Revisaria meu currículo? Entrevista semana que vem."'],
    carinhoso: ['"Confio muito na sua opinião: lê o meu currículo antes de eu mandar?"'],
    ironico: ['"Meu currículo tá parecendo um bilhete de resgate. Me ajuda a deixar menos assustador?"']
  },
  favor_escola: {
    expansivo: ['"Me ajuda no trabalho de ciências?? É pra amanhã e eu não fiz NADA 😭"'],
    contido: ['"Você entendeu a matéria de matemática? Me explica?"'],
    carinhoso: ['"Você pode me ajudar a estudar pra prova? Você explica melhor que o professor."'],
    ironico: ['"Proposta de negócio: você me explica equação e eu paro de falar do seu corte de cabelo."']
  },

  /* ---------------- Cobrança: a combinação que ficou para depois (continuidade). */
  cobranca_promessa: {
    expansivo: ['"Eiii! E aquele {programa} que você prometeu?? Tô esperando até hoje 😅"', '"Você me deve {programa}, lembra? Não pensa que eu esqueci!"'],
    contido: ['"E {programa}? Ficou só na promessa?"'],
    carinhoso: ['"Ainda tô com vontade de {programa} com você. Quando der, tá?"'],
    ironico: ['"Aniversário de um ano da sua promessa de {programa}. Vou fazer um bolo."']
  },
  cobranca_resposta: {
    expansivo: ['"Você leu e não respondeu, hein?! Vi os dois risquinhos azuis!"'],
    contido: ['"Você não respondeu a minha mensagem."'],
    carinhoso: ['"Fiquei esperando você responder aquele dia. Tá tudo bem entre a gente?"'],
    ironico: ['"Minha mensagem ainda tá lá, esperando. Ela mandou lembranças."']
  },

  /* ---------------- Conflito: alguém está chateado com você (o motivo está no vínculo). */
  conflito_magoa: {
    expansivo: ['"Olha, eu preciso falar: ainda tô muito chatead{po} com {assunto}. Não dá pra fingir que nada aconteceu!"'],
    contido: ['"Sobre {assunto}: não gostei. Queria que você soubesse."', '"Ainda tô chatead{po}. Por {assunto}."'],
    carinhoso: ['"Não queria brigar, mas {assunto} me magoou de verdade. Podemos conversar?"'],
    ironico: ['"Parabéns pelo episódio de {assunto}. Ainda tô aplaudindo."']
  },
  conflito_ciume: {
    expansivo: ['"Quem é essa pessoa que fica comentando nas suas fotos?! Preciso saber!"'],
    contido: ['"Você anda diferente. Tem alguma coisa que eu deveria saber?"'],
    carinhoso: ['"Tô me sentindo meio de lado ultimamente. É impressão minha?"'],
    ironico: ['"Interessante como você tem tempo pra todo mundo, menos pra mim."']
  },
  conflito_reconexao: {
    expansivo: ['"Faz tanto tempo que a gente brigou... pensei muito. Queria muito conversar, de verdade."'],
    contido: ['"Pensei sobre o que aconteceu entre a gente. Se quiser conversar, tô aqui."'],
    carinhoso: ['"Sinto falta da nossa amizade. Será que dá pra começar de novo?"'],
    ironico: ['"Tá, eu admito: talvez eu tenha exagerado. Um pouco. Café?"']
  },

  /* ---------------- Comemoração: alguém viu o que aconteceu na SUA vida. */
  comemoracao_feito: {
    expansivo: ['"FIQUEI SABENDO!!! {feito} PARABÉNS!!! Tô muito orgulhos{po}! 🎉🎉"', '"Para tudo: {feito} Você merece demais!!"'],
    contido: ['"Soube da novidade: {feito} Parabéns."'],
    carinhoso: ['"Meu coração ficou quentinho quando soube: {feito} Você merece cada pedacinho disso."'],
    ironico: ['"Então quer dizer que {feito} Vou ter que começar a te tratar com respeito agora?"']
  },
  aniversario: {
    expansivo: ['"PARABÉNS!!! {idade} anos!! Que seja o melhor ano da sua vida! 🎂🎈"', '"Feliz aniversário, {eu}!! Hoje é dia de bolo e não aceito desculpas!"'],
    contido: ['"Feliz aniversário. Tudo de bom."', '"Parabéns pelos {idade}."'],
    carinhoso: ['"Feliz aniversário, meu bem. Que a vida te dê tudo o que você dá pras pessoas que ama."', '"Parabéns! {idade} anos de você no mundo — que sorte a nossa."'],
    ironico: ['"{idade} anos? Já tá na idade de reclamar do joelho. Parabéns, vel{o}."']
  },

  /* ---------------- Fama: as pessoas da sua vida veem você na tela. */
  fama_amigo: {
    expansivo: ['"TE VI NA TV!!! Mostrei pra todo mundo do trabalho que eu te conheço!!"', '"Minha tia não acredita que eu sou amig{po} de você. Manda um áudio pra ela, por favor 😂"'],
    contido: ['"Te vi numa matéria. Tá fazendo sucesso, hein."'],
    carinhoso: ['"Tô tão orgulhos{po} de ver você crescendo assim. Só não esquece da gente, tá?"'],
    ironico: ['"Agora que você é famos{o}, precisa marcar horário pra falar contigo?"']
  },
  fama_pedido: {
    expansivo: ['"Amig{o}, minha prima é sua fã número um! Você grava um vídeo pro aniversário dela? Por favorzinho!"'],
    contido: ['"Um conhecido quer te convidar pra um evento da empresa. Posso passar o seu contato?"'],
    carinhoso: ['"Desculpa pedir, mas o filho de uma amiga ama você. Um autógrafo faria o ano dele."'],
    ironico: ['"Usando nossa amizade para fins pessoais: autografa um boné pro meu chefe?"']
  },

  /* ---------------- Trabalho: o colega de agora. */
  trabalho_bastidor: {
    expansivo: ['"Você viu o e-mail?! Vão mudar TUDO no setor! Ninguém tá entendendo nada!"', '"Fofoca quentíssima do escritório, mas só conto pessoalmente 👀"'],
    contido: ['"Reunião amanhã às 8. Mudaram o horário."', '"Ouvi falar que vão cortar gente. Fica de olho."'],
    carinhoso: ['"Ei, notei que você tava pra baixo hoje no trabalho. Tá tudo bem?"'],
    ironico: ['"Mais uma reunião que podia ter sido um e-mail. Sobrevivemos?"']
  },
  trabalho_parceria: {
    expansivo: ['"Tive uma ideia pra um projeto e você é a pessoa certa! Bora apresentar juntos?"'],
    contido: ['"Quer dividir aquele projeto novo comigo? Acho que a gente funciona."'],
    carinhoso: ['"Adoro trabalhar com você. Topa pegar o projeto novo comigo?"'],
    ironico: ['"Proposta: a gente pega o projeto difícil, faz bonito e esfrega na cara do chefe."']
  },
  trabalho_credito: {
    expansivo: ['"Você viu?! Apresentaram a NOSSA ideia como se fosse só deles! Tô revoltad{po}!"'],
    contido: ['"Levaram o crédito pelo nosso trabalho. Vai deixar passar?"'],
    carinhoso: ['"Achei injusto o que fizeram com você na reunião. Quer conversar?"'],
    ironico: ['"Reunião de hoje: nossa ideia, a cara de outra pessoa. Que bonito."']
  },

  /* ---------------- Família. */
  familia_reuniao: {
    expansivo: ['"Almoço de família no domingo! Vai todo mundo, inclusive você, nem adianta inventar desculpa!"', '"Vamos fazer uma festa surpresa pro aniversário da vó! Você entra na vaquinha?"'],
    contido: ['"Domingo tem almoço aqui. Vem?"'],
    carinhoso: ['"Tô fazendo aquele prato que você ama no domingo. A família toda vai estar aqui. Vem, meu bem?"'],
    ironico: ['"Domingo: almoço de família. Sobrevivência opcional, presença obrigatória."']
  },
  familia_conselho: {
    expansivo: ['"Filh{o}, preciso te dar um conselho e você vai ouvir! Tá se cuidando direito?"'],
    contido: ['"Tá comendo direito? Dormindo bem?"', '"Pensei em você hoje. Se cuida."'],
    carinhoso: ['"Só passando pra dizer que tenho muito orgulho de você. Não precisa responder."'],
    ironico: ['"Lembrete materno-paterno: casaco, que vai esfriar. Eu sei que você não vai pegar."']
  },
  filho_pedido: {
    expansivo: ['"Oi! Então... sabe como é, tô num aperto esse mês. Dá pra me ajudar? Prometo devolver!!"'],
    contido: ['"Preciso de uma ajuda com dinheiro. Não é muito."'],
    carinhoso: ['"Odeio pedir, você sabe. Mas esse mês tá difícil. Você me ajudaria?"'],
    ironico: ['"Banco da família aberto? Pergunta de alguém que você criou."']
  },
  filho_carinho: {
    expansivo: ['"Lembrei de você hoje do nada e quis mandar mensagem! Saudade da comida aí de casa!!"'],
    contido: ['"Tudo bem por aí? Domingo eu passo."'],
    carinhoso: ['"Lembrei de você hoje e de tudo o que você fez por mim. Obrigad{po}."'],
    ironico: ['"Notícia: virei adulto funcional. Pode se orgulhar."']
  },

  /* ---------------- Continuidade (respostas que voltam). */
  retomada_agradecimento: {
    expansivo: ['"Lembra quando eu tava mal e você me ouviu? Passou! E eu nunca vou esquecer que você tava lá ❤️"'],
    contido: ['"Aquela conversa ajudou. Obrigad{po}."'],
    carinhoso: ['"Só queria dizer: aquele dia que você me ouviu fez toda a diferença. Tô bem melhor."'],
    ironico: ['"Atualização: sobrevivi. Em parte graças a você. Não se acostuma."']
  },
  retomada_retribuicao: {
    expansivo: ['"Lembra da ajuda que você me deu? Comprei um presentinho pra você! Passo aí amanhã!"'],
    contido: ['"Te devo uma pela ajuda. Almoço por minha conta."'],
    carinhoso: ['"Não esqueci da sua ajuda. Separei uma coisa pra você."'],
    ironico: ['"Pagamento da dívida de gratidão: um almoço. Não reclama do restaurante."']
  },
  retomada_magoado: {
    expansivo: ['"Fiquei pensando naquilo que você disse... doeu, viu?"'],
    contido: ['"Ainda penso no que você me respondeu aquele dia."'],
    carinhoso: ['"Talvez eu tenha entendido errado, mas aquela sua resposta me deixou triste."'],
    ironico: ['"Sua resposta daquele dia continua ganhando prêmio de mais simpática do ano."']
  },
  retomada_reconciliacao: {
    expansivo: ['"Tá, já passou. Fiquei chatead{po}, mas você é importante demais pra eu ficar brav{po} pra sempre!"'],
    contido: ['"Pensei melhor. Tá tudo certo entre a gente."'],
    carinhoso: ['"Desculpa também pela minha parte. Sinto falta de conversar com você."'],
    ironico: ['"Decidi te perdoar. Por enquanto."']
  }
};

/** As respostas faladas (o seu texto no balão). Cada uma pertence a um tom de resposta. */
export const RESPOSTAS17: Record<string, string[]> = {
  apoio: ['"Tô aqui. Me liga quando quiser, a hora que for."', '"Não tá sozinh{po}. Vamos conversar com calma hoje?"', '"Que pesado. Quer que eu vá até aí?"'],
  conselho: ['"Já pensou em conversar direto com a pessoa? Às vezes resolve."', '"Respira. Amanhã você decide com a cabeça fria."'],
  evasiva: ['"Nossa, que fase. Depois a gente conversa, tá?"', '"Puxa... força aí."', '"Hmm, complicado. Tô meio corrido agora."'],
  engracada: ['"Tô rindo até agora 😂"', '"Você não presta. Amei."', '"Isso foi um ataque pessoal e eu aceito."'],
  carinhosa: ['"Você é demais. Sabia?"', '"Que saudade de você ❤️"', '"Obrigad{o} por lembrar de mim."'],
  firme: ['"Preciso ser sincer{o}: não concordo com isso."', '"Vamos falar sério? Isso não foi legal."', '"Não vou fingir que tá tudo bem."'],
  desculpas: ['"Você tem razão. Desculpa, de verdade."', '"Errei. Não devia ter feito aquilo."'],
  agradecimento: ['"Obrigad{o}! Isso significou muito pra mim."', '"Você não imagina o quanto isso me ajudou. Obrigad{o}."'],
  recusa: ['"Dessa vez não vou conseguir. Desculpa mesmo."', '"Não dá, sinto muito."'],
  interesse: ['"Eu também queria muito. Bora?"', '"Achei que você nunca ia perguntar 😊"'],
  desinteresse: ['"Gosto muito de você, mas como amig{po}."', '"Agradeço, mas não estou procurando nada agora."'],
  topar: ['"Fechado! Pode contar comigo."', '"Bora! Que horas?"'],
  provocar: ['"Aceito. E prepara o bolso."', '"Vai perder e ainda vai pagar sorrindo."']
};
