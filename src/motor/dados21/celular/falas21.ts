/**
 * VIDA 21 · AS FALAS DO CELULAR — o que VOCÊ escreve ao responder, e o que as pessoas escrevem, lido da situação.
 *
 * O problema que isto resolve (auditoria em vidas simuladas, docs/vida21/AUDITORIA.md): a sua fala no balão era sorteada
 * só pelo TOM da resposta (`RESPOSTAS17[tom]`), sem olhar o que tinha sido dito nem para quem. Daí o irmão que chama
 * para um churrasco receber "Gosto muito de você, mas como amiga", a mãe que chama para o almoço de domingo receber
 * "Isso foi um ataque pessoal e eu aceito", e o "Só se tiver pudim" do botão virar outra frase no balão. As notícias
 * tinham uma fala por tipo de trajetória: "Casa nova! Vem conhecer" para quem cortou gastos e foi para um lugar menor;
 * "Nasceu!" para quem ainda estava grávida; "Nada de pânico" para quem começou a tratar uma depressão.
 *
 * Aqui:
 *   RESPOSTAS21   a sua fala por SITUAÇÃO e OPÇÃO (`desabafo_saude:apoio`, `convite:desinteresse`…), com variantes por
 *                 relação (os pais, os avós, irmãos, filhos, o par, amigos, colegas) e para criança — nada de recusa
 *                 romântica fora de romance, nada de piada com quem está de luto.
 *   noticia21     a fala de quem conta a novidade, pelo que aconteceu de fato (o cartão é a trajetória da pessoa).
 *   saudade21 / convite21   o jeito de cada vínculo puxar conversa (a avó não escreve "e aí, sumida").
 *
 * Marcas: {nome} quem manda · {trat} como você chama a pessoa (mãe, vô, o nome) · {o} a flexão do seu gênero ·
 * {po} a flexão do gênero de quem manda · {eu} o seu nome · {v}/{n} o programa (verbo, nome) · {senhor} "o senhor"/"a
 * senhora" (quem manda) · {sr} "senhor"/"senhora" · {sv} "O vô"/"A vó" (quem manda, de si).
 */

export type Relacao21 = 'pais' | 'avos' | 'irmao' | 'filho' | 'par' | 'amigo' | 'colega' | 'distante';
export interface Falas21 { geral: string[]; crianca?: string[]; pais?: string[]; avos?: string[]; irmao?: string[]; filho?: string[]; par?: string[]; amigo?: string[]; colega?: string[]; distante?: string[] }

/* ======================================================================== As suas respostas */

export const RESPOSTAS21: Record<string, Falas21> = {
  /* ---- Desabafo: alguém escolheu você para contar o que está passando. */
  'desabafo:apoio': { geral: ['"Tô aqui. Me liga quando quiser, a hora que for."', '"Que pesado. Quer que eu vá até aí?"', '"Não precisa resolver nada agora. Me conta direito o que aconteceu."'], pais: ['"{trat}, tô aqui. Quer que eu passe aí hoje?"', '"Fica tranquil{po}, {trat}. Vou aí no fim de semana e a gente conversa."'], filho: ['"Filh{po}, conta comigo. Sempre."', '"Vem jantar aqui hoje. A gente conversa com calma."'], par: ['"Chego mais cedo hoje. A gente conversa com calma."'] },
  'desabafo_saude:apoio': { geral: ['"Não tá sozinh{po} nisso. Quando for a próxima consulta? Vou junto."', '"Que notícia difícil. Me fala do que você precisa — comida, carona, companhia."'], pais: ['"{trat}, vou com você no médico. Me passa o dia."'] },
  'desabafo_separacao:apoio': { geral: ['"Que fase. Se precisar de um canto pra ficar uns dias, aqui tem."', '"Termina hoje no sofá aqui de casa? Sem pressa de falar."'] },
  'desabafo_dinheiro:apoio': { geral: ['"Vamos sentar e olhar essas contas juntos? Às vezes assusta menos no papel."', '"Aperto passa. Me conta quanto é e o que vence primeiro."'] },
  'desabafo_trabalho:apoio': { geral: ['"Que raiva. Você não merece isso. Quer desabafar por áudio mesmo?"', '"Respira. Ninguém aguenta isso calado — me conta tudo."'] },
  'desabafo:conselho': { geral: ['"Já pensou em conversar direto com a pessoa? Às vezes resolve."', '"Respira. Amanhã você decide com a cabeça fria."', '"Anota o que te incomoda e o que você quer. Ajuda a enxergar."'] },
  'desabafo_saude:conselho': { geral: ['"Pede uma segunda opinião, tá? E não deixa de fazer os exames."', '"Segue o tratamento direitinho. E não some, me dá notícia."'] },
  'desabafo_dinheiro:conselho': { geral: ['"Corta o que der e negocia a dívida antes de virar bola de neve."', '"Liga pro banco e pede renegociação. Eles preferem receber menos do que nada."'] },
  'desabafo_trabalho:conselho': { geral: ['"Documenta tudo por escrito. Se piorar, você tem como mostrar."', '"Vale atualizar o currículo. Não pra sair amanhã — pra ter opção."'] },
  'desabafo_separacao:conselho': { geral: ['"Não decide nada grande agora. Dá um tempo pra poeira baixar."'] },
  'desabafo_amor:conselho': { geral: ['"Fala com a pessoa do jeito que falou comigo. Sem rodeio."', '"Você merece alguém que te responda sem você ter que adivinhar."'] },
  'desabafo:ajudar': { geral: ['"Deixa eu te ajudar com isso. Não é empréstimo de banco: devolve quando der."', '"Já te mandei um pix. Não discute."'] },
  'desabafo:engracada': { geral: ['"Pelo menos o seu cabelo tá ótimo nessa crise 😅"', '"Se servir de consolo, minha semana também tá um filme de terror."'], pais: ['"{trat}, nem novela tem tanta reviravolta assim 😅"'] },
  'desabafo:evasiva': { geral: ['"Nossa, que fase. Depois a gente conversa, tá?"', '"Puxa... força aí."', '"Hmm, complicado. Tô meio corrid{o} agora."'] },

  /* ---- Brincadeira e aposta. */
  'brincadeira_aposta:provocar': { geral: ['"Aceito. E prepara o bolso."', '"Vai perder e ainda vai pagar sorrindo."'], crianca: ['"Aposto! Quem perder dá o lanche."'] },
  'brincadeira_aposta:engracada': { geral: ['"Você nunca acertou um placar na vida 😂"', '"Aposta com você é dinheiro fácil."'] },
  'brincadeira_aposta:evasiva': { geral: ['👍'] },
  'brincadeira:engracada': { geral: ['"Tô rindo até agora 😂"', '"Não acredito que você lembrou disso 😂"', '"Para que eu tô no trabalho e não consigo parar de rir"'], crianca: ['"KKKKKKK"', '"Hahaha, muito bom!"'], pais: ['"Haha, {trat}! Só você mesm{po}."'], avos: ['"Ai, {trat}, {senhor} é demais 😂"'] },
  'brincadeira:carinhosa': { geral: ['"Que saudade de você ❤️"', '"Obrigad{o} por lembrar de mim."', '"Você é demais. Sabia?"'], crianca: ['"Você é meu melhor amig{po}! 😊"'], pais: ['"Te amo, {trat}. Saudade."'], avos: ['"Saudade, {trat}. Vou aí te ver logo."'], irmao: ['"Te amo, tá? Mesmo você sendo assim."'] },
  'brincadeira:evasiva': { geral: ['😂', '👍', '"kkk"'] },
  'brincadeira_lembranca:engracada': { geral: ['"Para, eu tinha esquecido disso 😂"', '"Não acredito que você guardou isso na memória 😂"'] },
  'brincadeira_lembranca:carinhosa': { geral: ['"Bons tempos mesmo. A gente tem que repetir."', '"Guardo esse dia com carinho. Obrigad{o} por lembrar."'] },

  /* ---- Paquera (romance, e só aqui a recusa romântica faz sentido). */
  'paquera:interesse': { geral: ['"Eu também queria muito. Bora?"', '"Achei que você nunca ia perguntar 😊"', '"Confesso que tava torcendo pra você escrever."'] },
  'paquera:devagar': { geral: ['"Gosto de conversar com você. Vamos com calma?"', '"Tô gostando. Sem pressa, tá?"'] },
  'paquera:engracada': { geral: ['"Isso é uma cantada? Porque funcionou um pouco 😏"', '"Cuidado que eu posso aceitar 😄"'] },
  'paquera:desinteresse': { geral: ['"Gosto muito de você, mas como amig{po}."', '"Fico feliz com o carinho, mas não sinto o mesmo."', '"Agradeço, mas não estou procurando nada agora."'] },
  'paquera_segue:marcar': { geral: ['"Sexta à noite? Escolhe o lugar."', '"Bora! Que dia é bom pra você?"'] },
  'paquera_segue:adiar': { geral: ['"Essa semana tá corrida… semana que vem?"'] },
  'paquera_segue:desinteresse': { geral: ['"Pensei melhor e acho que não é o momento pra mim. Desculpa."'] },

  /* ---- Favores. */
  'favor:topar': { geral: ['"Fechado! Pode contar comigo."', '"Conta comigo. Que horas?"'], pais: ['"Claro, {trat}. Passo aí."'], filho: ['"Pode deixar, filh{po}."'] },
  'favor_escola:topar': { geral: ['"Bora! Me manda o que você já tem."', '"Te ajudo sim. Chamada de vídeo depois do almoço?"'], crianca: ['"Te ajudo! Vem aqui em casa depois da aula?"'] },
  'favor_mudanca:topar': { geral: ['"Tô lá às oito. E quero esse almoço, hein."'] },
  'favor_pet:topar': { geral: ['"Pode trazer. Me passa os horários da ração."'] },
  'favor_carona:topar': { geral: ['"Te pego às quatro. Café por sua conta."'] },
  'favor_curriculo:topar': { geral: ['"Manda! Olho hoje à noite e te devolvo com comentários."'] },
  'favor:negociar': { geral: ['"Inteiro não consigo, mas dou uma força numa parte."', '"Só consigo de manhã. Serve?"'] },
  'favor_escola:negociar': { geral: ['"Te explico a matéria, mas o trabalho você faz, hein."'], crianca: ['"Te ajudo um pouco, mas tenho que fazer o meu também."'] },
  'favor_mudanca:negociar': { geral: ['"De manhã eu ajudo, à tarde tenho compromisso."'] },
  'favor:recusa': { geral: ['"Dessa vez não vou conseguir. Desculpa mesmo."', '"Não dá, sinto muito. Se mudar algo, te aviso."'], crianca: ['"Não posso, minha mãe não deixa 😕"'] },

  /* ---- Cobranças. */
  'cobranca_promessa:cumprir': { geral: ['"Você tem razão. Sábado? Agora é sério."', '"Marcado. Desta vez eu apareço."'] },
  'cobranca_promessa:desculpas': { geral: ['"Desculpa, de verdade. Eu fico prometendo e não cumpro."'] },
  'cobranca_promessa:engracada': { geral: ['"Prometo que dessa vez marco. Juro de dedinho 🤞"', '"Tá anotado na agenda. A agenda é que some."'] },
  'cobranca_promessa:firme': { geral: ['"Vou ser sincer{o}: não vai dar tão cedo. Prefiro dizer do que enrolar."'] },
  'cobranca_resposta:desculpas': { geral: ['"Desculpa o sumiço. Não foi por você."', '"Eu vi e não respondi. Foi mal, de verdade."'] },
  'cobranca_resposta:firme': { geral: ['"Precisava de um tempo pra mim. Não é nada com você."'] },
  'cobranca_resposta:evasiva': { geral: [] },

  /* ---- Conflitos. */
  'conflito:desculpas': { geral: ['"Você tem razão. Desculpa, de verdade."', '"Errei. Não devia ter feito aquilo."'], pais: ['"Desculpa, {trat}. Eu falei sem pensar."'], par: ['"Desculpa. Eu não quero que a gente fique assim."'] },
  'conflito:firme': { geral: ['"Entendo o que você sentiu, mas do meu lado foi diferente. Posso explicar?"', '"Não quero brigar. Mas também não fiz por mal."'] },
  'conflito:confrontar': { geral: ['"Engraçado você falar isso, depois do que você fez."', '"Você também errou, e nunca pediu desculpa."'] },
  'conflito:evasiva': { geral: [] },
  'conflito_ciume:carinhosa': { geral: ['"Não tem nada disso. É você que eu quero, tá?"', '"Ei. Tô aqui, com você. Pode confiar."'] },
  'conflito_ciume:firme': { geral: ['"Eu não te dei motivo. Preciso que você confie em mim."'] },
  'conflito_ciume:engracada': { geral: ['"Ciúme de mim? Que lisonja 😄 Relaxa."'] },
  'conflito_ciume:confrontar': { geral: ['"E você? Quer mesmo falar de confiança?"'] },
  'conflito_reconexao:aceitar': { geral: ['"Também pensei muito nisso. Vamos conversar."'] },
  'conflito_reconexao:devagar': { geral: ['"Fico feliz que você escreveu. Vamos com calma."'] },
  'conflito_reconexao:firme': { geral: ['"Desejo o melhor pra você. Mas prefiro deixar como está."'] },
  'retomada_magoado:desculpas': { geral: ['"Desculpa. Não quis te deixar mal."'] },
  'retomada_magoado:firme': { geral: ['"Não foi o que eu quis dizer. Deixa eu explicar direito?"'] },
  'retomada_magoado:evasiva': { geral: [] },

  /* ---- Comemorações e aniversário. */
  'comemoracao_feito:agradecimento': { geral: ['"Obrigad{o}! Isso significou muito pra mim."', '"Que bom ler isso. Obrigad{o} de verdade."'], pais: ['"Obrigad{o}, {trat}! Muito do que eu sou é de vocês."'], avos: ['"Obrigad{o}, {trat}! Queria que {senhor} estivesse lá."'], crianca: ['"Obrigad{o}!! 😁"'] },
  'comemoracao_feito:carinhosa': { geral: ['"Você é demais. Obrigad{o} por torcer por mim."', '"Ter você por perto faz diferença. Obrigad{o}."'], pais: ['"Te amo, {trat}. Obrigad{o} por tudo."'] },
  'comemoracao_feito:engracada': { geral: ['"Pode pedir autógrafo, tô cobrando barato 😎"', '"Agora é \'Vossa Excelência\', tá?"'] },
  'comemoracao_feito:curto': { geral: ['"Valeu!"', '"Valeu 🙏"'] },
  'aniversario:agradecimento': { geral: ['"Obrigad{o}! Isso significou muito pra mim."', '"Ah, que lindo. Obrigad{o}!"'], pais: ['"Obrigad{o}, {trat}! Passo aí pro bolo."'], avos: ['"Obrigad{o}, {trat}! Te amo."'], crianca: ['"Obrigad{o}!! Vai ter bolo de chocolate!"'] },
  'aniversario:carinhosa': { geral: ['"Você lembrou! Te adoro."', '"Melhor mensagem do dia ❤️"'], pais: ['"Te amo, {trat}. Obrigad{o} por me aguentar esse tempo todo."'], avos: ['"Te amo, {trat}. Vou aí te dar um abraço."'], par: ['"Te amo. Hoje à noite é nossa."'] },
  'aniversario:engracada': { geral: ['"Mais velh{o} e mais bonit{o}, né?"', '"Não me lembra a idade, por favor 😂"'], crianca: ['"Agora eu sou grande!"'] },
  'aniversario:curto': { geral: ['"Valeu!"', '"Obrigad{o} 🙏"'] },

  /* ---- Fama vista de perto. */
  'fama_amigo:carinhosa': { geral: ['"Sou a mesma pessoa de sempre, juro. Saudade de você."'] },
  'fama_amigo:engracada': { geral: ['"Pode me chamar de estrela agora 😎 Mentira, me chama pro bar."'] },
  'fama_amigo:firme': { geral: ['"Prefiro que a gente não misture as coisas, tá? Com você eu só quero ser eu."'] },
  'fama_pedido:topar': { geral: ['"Claro! Me manda o nome que eu gravo hoje."'] },
  'fama_pedido:cache': { geral: ['"Faço, mas é trabalho: tem cachê. Te passo o valor."'] },
  'fama_pedido:recusa': { geral: ['"Desculpa, não consigo atender esse tipo de pedido. Não é nada pessoal."'] },

  /* ---- Trabalho em comum. */
  'trabalho_parceria:topar': { geral: ['"Topo! A gente divide as partes amanhã cedo."'] },
  'trabalho_parceria:recusa': { geral: ['"Agora não consigo pegar mais nada. Fica pra próxima?"'] },
  'trabalho_credito:confrontar': { geral: ['"Vou falar com a chefia. Com os fatos na mão."'] },
  'trabalho_credito:apoio': { geral: ['"Eu vi quem fez. Se precisar, eu confirmo."'] },
  'trabalho_credito:evasiva': { geral: ['"Melhor deixar quieto, não vale a briga."'] },
  'trabalho_bastidor:carinhosa': { geral: ['"Obrigad{o} pelo aviso. Fico de olho."'] },
  'trabalho_bastidor:engracada': { geral: ['"Esse setor dava uma novela 😂"'] },
  'trabalho_bastidor:firme': { geral: ['"Prefiro não entrar nessa. Mas obrigad{o}."'] },

  /* ---- A família. */
  'familia_reuniao:ir': { geral: ['"Vou sim! Levo alguma coisa?"', '"Tô lá. Guarda um lugar pra mim."'], pais: ['"Vou, {trat}! Levo a sobremesa."'], avos: ['"Vou, {trat}! Não faz tudo sozinh{po}, tá?"'] },
  'familia_reuniao:engracada': { geral: ['"Só se tiver pudim."'] },
  'familia_reuniao:recusa': { geral: ['"Esse domingo não vou conseguir, desculpa. Manda foto!"'], pais: ['"Não vou conseguir, {trat}. Desculpa, de verdade. No próximo eu vou."'] },
  'familia_conselho:carinhosa': { geral: ['"Tô me cuidando, prometo. Obrigad{o} por se preocupar."'], pais: ['"Tô sim, {trat}. Te amo."'], avos: ['"Tô me cuidando, {trat}. E você também, hein."'] },
  'familia_conselho:engracada': { geral: ['"Sim, {sr}! Comendo verdura e tudo 🥦"'] },
  'familia_conselho:curto': { geral: ['"Tá bom."', '"Ok, pode deixar."'] },
  'filho_carinho:carinhosa': { geral: ['"Te amo, filh{po}. Muito."'] },
  'filho_carinho:engracada': { geral: ['"Quem é você e o que fez com meu filh{po}? 😂"'] },
  'filho_carinho:curto': { geral: ['"❤️"'] },
  'filho_pedido:dar': { geral: ['"Te mando agora. Se cuida, tá?"'] },
  'filho_pedido:parte': { geral: ['"Tudo não dá, mas mando uma parte. Depois conversamos de orçamento."'] },
  'filho_pedido:firme': { geral: ['"Dessa vez não. Vem aqui que a gente senta e organiza as contas juntos."'] },
  'filho_pedido:recusa': { geral: ['"Não dá."'] },

  /* ---- As mensagens da VIDA 15 (convite, saudade, notícia, ex). */
  'convite:aceitar': { geral: ['"Bora! Que horas?"', '"Topo! Me manda o endereço."', '"Simmm. Tava precisando."'], crianca: ['"Vou! Vou pedir pra minha mãe!"'], irmao: ['"Vou! Mas você que leva o gelo."'] },
  'convite:outro_dia': { geral: ['"Esse fim de semana não dá — mas a gente marca, prometo."', '"Não consigo agora. Semana que vem?"'] },
  'convite:recusar': { geral: ['"Obrigad{o} pelo convite, mas dessa vez não vou conseguir."', '"Não vou poder, mas aproveita por mim!"'] },
  'convite:engracada': { geral: ['"Só se tiver sobremesa."'] },
  'convite:desinteresse': { geral: ['"Esse programa não é muito a minha… mas valeu por lembrar de mim."', '"Acho que esse eu passo. Mas me chama pra outra coisa!"'], crianca: ['"Não gosto muito disso… outra coisa?"'] },
  'parceiro:aceitar': { geral: ['"Bora! Tô precisando disso também."', '"Fechado. É um encontro."'] },
  'parceiro:adiar': { geral: ['"Essa semana não dá… mas a gente faz, prometo."'] },
  'saudade:ligar': { geral: ['"Te ligo daqui a pouco. Saudade também!"'], pais: ['"Te ligo hoje à noite, {trat}."'], avos: ['"Vou te ligar já, {trat}."'] },
  'saudade:marcar': { geral: ['"Vamos nos ver! Sábado é bom pra você?"'], pais: ['"Vou almoçar aí no domingo, {trat}."'], avos: ['"Domingo eu passo aí, {trat}. Faz aquele café?"'] },
  'saudade:curto': { geral: ['"Tudo ótimo por aqui, e você?"', '"Tudo bem sim! E aí?"'], pais: ['"Tô bem, {trat}. Correria."'] },
  'saudade:carinhosa': { geral: ['"Saudade também. Muita."', '"Ai, que coisa boa de ler. Também sinto sua falta."'], pais: ['"Também tô com saudade, {trat}. Te amo."'], avos: ['"Saudade, {trat}. Vou aí te ver logo."'] },
  'saudade:evasiva': { geral: ['"Tudo certo por aqui. Correria."', '"Tô bem, e você?"'] },
  'noticia:ligar': { geral: ['"Te ligo agora pra você me contar tudo!"'] },
  'noticia_apoio:ligar': { geral: ['"Te ligo agora. Quero saber como você está de verdade."'] },
  'noticia:curto': { geral: ['❤️'] },
  'noticia_apoio:curto': { geral: ['"Tô aqui, viu? ❤️"'] },
  'noticia:engracada': { geral: ['"AAAAA que demais! Quero detalhes 🎉"', '"Finalmente uma notícia boa nesse grupo 😂🎉"'] },
  'noticia_apoio:evasiva': { geral: ['"Puxa... força aí."', '"Que fase. Depois a gente se fala."'] },
  'reencontro:marcar': { geral: ['"Claro que lembro! Bora tomar um café?"'] },
  'reencontro:conversar': { geral: ['"Lembro sim! Quanto tempo… me conta, como você tá?"'] },
  'ex:cordial': { geral: ['"Tô bem, sim. Espero que você também."'] },
  'ex:marcar': { geral: ['"Pode ser. Um café, sem drama."'] },
  'ex:firme': { geral: ['"Prefiro que você não me procure mais. Desejo o melhor, de verdade."'] },
  'proposta:aceitar': { geral: ['"Topo! Me passa os detalhes."'] },
  'proposta:recusar': { geral: ['"Obrigad{o} por lembrar de mim, mas agora não consigo."'] },
  'fa:atender': { geral: ['"Obrigad{o} pelo carinho! 🙏"'] },
  'evento:ir': { geral: ['"Confirmado, estarei lá."'] },
  'evento:recusar': { geral: ['"Agradeço o convite, mas não poderei comparecer."'] },
  'celebridade:aceitar': { geral: ['"Adorei a mensagem! Vamos marcar sim."'] },
  'celebridade:recusar': { geral: ['"Obrigad{o} pelo carinho! Admiro muito seu trabalho também."'] },
  'imprensa:confirmar': { geral: ['"Sim, estamos juntos. E estamos felizes."'] },
  'imprensa:sem_comentar': { geral: ['"Sem comentários."'] },
  'imprensa:negar': { geral: ['"Somos só amigos."'] },
  'encontro:conversar': { geral: ['"Não acredito! Quanto tempo!"'] }
};

/* ======================================================================== As notícias */

export interface Noticia21 { fala: string; /** O prefixo do assunto: 'aperto' (e desemprego, perda, saude) pedem apoio, não festa. */ chave: string }

/**
 * A fala de quem conta a novidade, pelo que aconteceu (o texto da trajetória da pessoa). `tipo` é o tipo do evento da
 * trajetória; `pai`/`mae`… vêm do texto ("Perdeu o pai, Fernando"). O cartão continua sendo o texto original.
 */
export function noticia21(tipo: string, texto: string, g: (m: string, f: string, n: string) => string): Noticia21 | undefined {
  const t = texto.toLowerCase();
  switch (tipo) {
    case 'casa':
      if (/menor|trocou de casa|mudou para|vend(eu|er) .*casa|devolv/.test(t)) return { chave: 'aperto', fala: '"Vou mudar pra um lugar menor. Tá apertado, mas vai dar. Depois te passo o endereço novo."' };
      if (/cort|gasto|apert|conta/.test(t)) return { chave: 'aperto', fala: '"Tô cortando gasto em tudo. As contas apertaram, mas a gente se vira."' };
      if (/compr|própria|chaves|financ/.test(t)) return { chave: 'casa', fala: '"Peguei as chaves! Casa própria, acredita? Vem conhecer."' };
      if (/reform/.test(t)) return { chave: 'casa', fala: '"A reforma acabou! Finalmente sem poeira. Vem ver como ficou."' };
      return { chave: 'casa', fala: '"Mudei! Ainda tem caixa pra todo lado, mas vem conhecer."' };
    case 'trabalho':
      if (/extra|bico|pagar as contas|complementar/.test(t)) return { chave: 'aperto', fala: '"Peguei um trabalho extra. As contas não estavam fechando… vai ser assim por um tempo."' };
      if (/primeiro emprego/.test(t)) return { chave: 'trabalho', fala: `"Arrumei meu primeiro emprego! Tô ${g('nervoso', 'nervosa', 'nervose')} e feliz ao mesmo tempo."` };
      if (/de novo|voltou a trabalhar|recoloc/.test(t)) return { chave: 'trabalho', fala: '"Voltei a trabalhar! Depois de um tempo parado, que alívio."' };
      if (/aposent/.test(t)) return { chave: 'trabalho', fala: `"Me aposentei! Agora quero ver você me chamar pra café no meio da semana."` };
      if (/abriu|negócio|própri/.test(t)) return { chave: 'trabalho', fala: '"Abri meu próprio negócio! Morrendo de medo e de vontade."' };
      return { chave: 'trabalho', fala: '"Tenho novidade no trabalho! Ainda tô me acostumando."' };
    case 'filho':
      if (/grávid|deve nascer|vai nascer|espera/.test(t)) return { chave: 'filho', fala: `"Vou ser ${g('pai', 'mãe', 'mãe')}! Ainda não caiu a ficha. Queria que você soubesse por mim."` };
      if (/adot/.test(t)) return { chave: 'filho', fala: '"A adoção saiu! Nossa família cresceu. Tô sem palavras."' };
      { const n = /nasceu ([A-ZÀ-Ú][\wà-ú]+)/i.exec(texto)?.[1]; return { chave: 'filho', fala: n ? `"${n} nasceu! Tô sem dormir e mais feliz do que nunca."` : '"Nasceu! Tô sem dormir e mais feliz do que nunca."' }; }
    case 'saude':
      if (/depress|ansiedade|pânico|burnout|bipolar|transtorno/.test(t)) return { chave: 'saude', fala: '"Comecei um tratamento pra cabeça. Não é fácil falar disso, mas queria que você soubesse por mim."' };
      if (/câncer|cancer|tumor|quimio/.test(t)) return { chave: 'saude', fala: '"Recebi um diagnóstico difícil. Vou começar o tratamento. Preferi te contar eu mesm{po}."' };
      if (/cirurgia|operou|operação/.test(t)) return { chave: 'saude', fala: '"Vou ter que operar. Os médicos estão confiantes, eu tô tentando ficar também."' };
      if (/curad|recebeu alta|teve alta|remiss/.test(t)) return { chave: 'casa_boa', fala: '"Recebi alta! Acabou. Queria comemorar com quem esteve perto."' };
      return { chave: 'saude', fala: '"Fui ao médico e vou ter que tratar uma coisa. Nada de pânico — agora é remédio e cuidado."' };
    case 'amor':
      if (/separ|termin|divorc/.test(t)) return { chave: 'perda', fala: '"A gente terminou. Tô bem, na medida do possível — só não queria que você soubesse por outra pessoa."' };
      if (/voltou com/.test(t)) return { chave: 'amor', fala: '"Voltamos. Eu sei, eu sei… mas dessa vez tá diferente."' };
      if (/casou|casaram|morar (junto|com)|foi morar/.test(t)) return { chave: 'amor', fala: '"Vamos juntar as escovas de dente! Queria que você soubesse por mim."' };
      if (/noiv/.test(t)) return { chave: 'amor', fala: '"Fiquei noiv{po}!! Já guarda a data."' };
      if (/novo relacionamento/.test(t)) return { chave: 'amor', fala: '"Tenho uma novidade meio sem jeito de contar: conheci alguém. Quero que você conheça."' };
      return { chave: 'amor', fala: '"Tô namorando! Quero que você conheça."' };
    case 'lugar':
      if (/custa menos|apert|volt(ou|ar) (a morar|para)/.test(t)) return { chave: 'aperto', fala: '"Mudei de cidade. Lá a vida custa menos — aqui tava pesado demais. Vem me visitar quando der."' };
      return { chave: 'lugar', fala: '"Vida nova, cidade nova. Vem me visitar!"' };
    case 'perda': {
      const m = /perdeu (o|a) (pai|mãe|avô|avó|irmão|irmã|filho|filha|marido|esposa|companheiro|companheira)/i.exec(texto);
      if (m) return { chave: 'perda', fala: `"${m[1] === 'o' ? 'Meu' : 'Minha'} ${m[2]} se foi. Tá difícil. Obrigad{po} por estar perto."` };
      return { chave: 'perda', fala: '"Foi um ano difícil por aqui. Obrigad{po} por estar perto."' };
    }
    case 'estudo':
      if (/formou|diploma|conclu/.test(t)) return { chave: 'estudo', fala: '"Me formei!! Acabou! Nem acredito."' };
      if (/passou|aprovad|entrou/.test(t)) return { chave: 'estudo', fala: '"Passei!! Começo no semestre que vem."' };
      return { chave: 'estudo', fala: '"Consegui! Finalmente."' };
  }
  return undefined;
}

/** As notícias que pedem apoio, não comemoração (pelo prefixo do assunto `${chave}:${t}`). */
export const noticiaDeApoio = (assunto: string | undefined): boolean => !!assunto && /^(desemprego|perda|saude|aperto)/.test(assunto);

/* ======================================================================== Quem puxa conversa */

/** "E aí, como você está?" — no jeito de cada vínculo. */
export const SAUDADE21: Record<Relacao21, string[]> = {
  pais: ['"Oi, meu bem. Tá tudo bem por aí? Liga quando puder."', '"Sonhei com você esta noite. Me dá notícia?"', '"Tô com saudade. Vem almoçar um domingo desses."', '"Faz tempo que você não aparece. Tá comendo direito?"'],
  avos: ['"Oi, meu amor. {sv} tá com saudade. Quando vem me ver?"', '"Pensei em você hoje. Me liga quando puder."', '"Fiz aquele bolo e lembrei de você. Aparece!"'],
  irmao: ['"Ô, sumid{o}! A gente precisa se falar mais, né?"', '"Vi uma foto nossa de criança e bateu saudade. Tudo bem aí?"', '"Bora marcar alguma coisa? Faz tempo que a gente não se vê."'],
  filho: ['"Oi! Tava pensando em você. Tudo bem por aí?"', '"Saudade. Quando você vem aqui?"'],
  par: ['"Saudade de você hoje."'],
  amigo: ['"E aí, sumid{o}! Como você tá?"', '"Lembrei de você hoje, do nada. Tudo bem por aí?"', '"Faz tanto tempo... me conta de você."', '"Vi uma foto antiga nossa e bateu saudade."'],
  colega: ['"Oi! Quanto tempo. Tudo certo com você?"'],
  distante: ['"Oi, tudo bem? Faz tempo que não tenho notícia sua."', '"Lembrei de você esses dias. Como vão as coisas?"']
};

/** Os convites: o amigo, o irmão e o colega não chamam do mesmo jeito. */
export const CONVITE21: Record<'amigo' | 'irmao' | 'colega' | 'crianca', string[]> = {
  amigo: ['"Bora {v}? Vai ser bom te ver."', '"Tô organizando {n}. Conto com você?"', '"Topa {v}? Faz tempo que a gente não sai."', '"Ei! Vai ter {n} — você vem, né?"'],
  irmao: ['"Bora {v}? Só nós dois, como antigamente."', '"Vai ter {n}. Vem, a gente quase não se vê."', '"Topa {v}? Faz tempo que a gente não faz nada junto."'],
  colega: ['"O pessoal vai {v}. Topa ir junto?"', '"Vai ter {n} com a turma. Bora?"'],
  crianca: ['"Quer {v}? Minha mãe deixou!"', '"Bora {v}?"', '"Você pode {v} amanhã?"']
};

/** O seu aniversário, no jeito de quem escreve (a irmã de 10 anos não escreve como a mãe). `crianca`: quem manda tem < 13. */
export const ANIVERSARIO21: Partial<Record<Relacao21 | 'crianca', string[]>> = {
  crianca: ['"PARABÉNS!!! 🎂🎉 Vai ter bolo?"', '"Feliz aniversário! Fiz um desenho pra você, te dou quando te ver."', '"Parabéns!!! Você tá ficando velh{o} kkkk"'],
  pais: ['"Parabéns, meu amor! {idade} anos de você no mundo — que sorte a nossa."', '"Feliz aniversário, filh{o}. Lembro do dia que você nasceu como se fosse ontem."', '"Parabéns! Passa aqui que tem bolo."'],
  avos: ['"Feliz aniversário, meu amor. {sv} te ama muito."', '"Parabéns! Que Deus te dê muita saúde. Vem me ver."', '"{idade} anos! Parece que foi ontem que eu te pegava no colo."'],
  irmao: ['"Parabéns! Mais um ano me aguentando 😂"', '"Feliz aniversário! Hoje eu deixo você escolher o restaurante."', '"Parabéns, {eu}. Te amo, mesmo você sendo assim."'],
  filho: ['"Feliz aniversário! Te amo muito ❤️"', '"Parabéns! Hoje é dia de você ser paparicad{o}."'],
  par: ['"Feliz aniversário, amor. Hoje à noite é tudo por minha conta ❤️"', '"Parabéns! Acordei pensando em você."'],
  amigo: ['"PARABÉNS!!! Hoje tem comemoração, não aceito desculpa!"', '"Feliz aniversário! Que esse ano seja leve com você."', '"Parabéns, {eu}! Cadê o bolo?"']
};
