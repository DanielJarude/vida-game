/**
 * REWORK 10.6 · UX-24 — AS NOTAS DE ATUALIZAÇÃO ("VIDA — Novidades da atualização").
 *
 * Cada versão entregue cadastra aqui o que mudou, em três partes (Novidades, Melhorias, Correções), SÓ com o que está
 * de fato no jogo e sem spoilers (nada de "agora dá para virar presidente"). A versão mais nova vem primeiro.
 *
 * Por que a versão é a do pacote carregado: as notas moram DENTRO do código que o navegador está rodando. Uma versão nova
 * baixada pelo service worker (PWA) fica esperando o jogador aceitar; enquanto isso, quem roda é a antiga — e as notas
 * dela. Só depois do recarregamento o código novo (com as notas novas) existe, e só então elas aparecem. Funciona offline
 * (está no pacote) e não toca no save (a lembrança de "já vi" é uma chave própria do navegador).
 *
 * Como cadastrar uma versão nova (faz parte da entrega — docs/notas/NOVIDADES.md):
 *   1. acrescente um item NO ALTO de `NOTAS`, com `versao` nova (a que o relatório da entrega usa) e a data;
 *   2. escreva só o que foi implementado e testado, em frases curtas, para quem joga;
 *   3. rode o teste `novidades` (a versão não pode repetir; as três partes não podem estar todas vazias).
 */

export interface NotaDeVersao {
  versao: string;
  data: string;
  titulo: string;
  novidades: string[];
  melhorias: string[];
  correcoes: string[];
}

export const NOTAS: NotaDeVersao[] = [
  {
    versao: '26.2',
    data: '2026-11-18',
    titulo: 'Estilos de luta',
    novidades: [
      'Escolha o estilo de luta — Muay Thai, boxe, jiu-jitsu, judô, karatê, taekwondo ou MMA (a partir dos 18) — na prática de luta (Minha Semana · Corpo e mente) ou em Outros caminhos, para quem compete.',
      'Cada estilo pesa atributos diferentes na luta (o boxeador vive de golpes, defesa e distância; o jiu-jiteiro, do chão, do equilíbrio e da força) e tem as suas competições.',
      'Faixas no jiu-jitsu, no judô, no karatê e no taekwondo, pela técnica, pelos anos de prática e pela idade — com o que falta para a próxima.'
    ],
    melhorias: [
      'Trocar de estilo aproveita parte da técnica (mais dentro da mesma família) e guarda a do estilo deixado: voltar devolve o que se tinha.',
      'O histórico da carreira mostra o estilo de cada temporada; os Caminhos de carreira têm um caminho por estilo, com o custo de trocar para ele.'
    ],
    correcoes: []
  },
  {
    versao: '26.1',
    data: '2026-11-18',
    titulo: 'A central "Onde fica cada coisa" e os caminhos de carreira',
    novidades: [
      'Caminhos de carreira (no Menu e em Caminhos): cada esporte, jogo de e-sports, as pistas e 23 famílias de profissões — como começa, as formas de começar, as etapas, o que faz evoluir, o depois e onde você está (em andamento, ao seu alcance, mais adiante, já percorrido ou fora de alcance), com o botão que leva ao lugar certo.'
    ],
    melhorias: [
      '"Onde fica cada coisa" organizada por áreas da vida (pessoas, estudos, trabalho, esportes, hobbies, rotina, corpo, dinheiro, casa, vida pública, história): escolha a área e veja as ações, cada uma com o que se faz lá.',
      'A busca entende sinônimos, variações de escrita e um erro de digitação ("namorar", "Counter-Strike", "muay thai", "faculdadde") e encontra também os caminhos de carreira.',
      'Novas entradas: peneira e base, formação de atleta, e-sports, kart, depois de competir, videogame, o corpo e as capacidades.',
      'O Menu ficou mais largo, com a central no alto e as opções do jogo abaixo.'
    ],
    correcoes: []
  },
  {
    versao: '26',
    data: '2026-11-17',
    titulo: 'Corpo e capacidades, atletas em formação e caminhos profissionais',
    novidades: [
      'Guia de carreiras (Caminhos): cada esporte, cada jogo de e-sports e o automobilismo, do hobby ao profissional — como começa, as etapas, o que faz evoluir, onde se compete e o que vem depois. A etapa em que você está aparece marcada.',
      'Depois de competir: toda carreira esportiva e de e-sports tem para onde ir — treinador, auxiliar técnico, analista de desempenho, comentarista, gerente esportivo, professor, caster, técnico de equipe de e-sports e outras, conforme a modalidade e a trajetória.',
      'Capacidades físicas (força, velocidade, aceleração, resistência, agilidade, impulsão, equilíbrio, alcance): saem do corpo herdado, do que a vida fez dele e da idade, e pesam nos atributos físicos do esporte.'
    ],
    melhorias: [
      'Atributos esportivos completos por posição e função — técnicos, táticos, físicos e mentais — com o peso de cada um, de onde vem o valor e as limitações sérias para a posição, que a nota da temporada cobra.',
      'Na formação, a comissão separa capacidade atual, potencial (estimativa) e prontidão para o profissional; subir de categoria antes da idade e treinar com o elenco profissional são etapas próprias, antes do contrato.',
      'E-sports: cada jogo ganhou atributos próprios (controle de spray, construção, controle aéreo, conhecimento de mapas, repertório de campeões...).',
      'Criação de personagem: o corpo de nascença dividido entre herdado, tendência e facilidade, escolhido por degraus com nome, com o efeito de cada escolha e o que o corpo favorece aos 25 anos, sem treino e treinando.',
      'Hobbies dizem para onde podem levar (sem obrigar): o próximo passo real e o que pesa. O dinheiro por fora aparece como trabalho por conta, não como hobby. Quem joga videogame há anos pode ser chamado por um time amador.'
    ],
    correcoes: [
      'Um jovem que se destaca na base não ouve mais que "já tem o nível do contrato profissional" só pela técnica: idade, físico, experiência e maturidade contam, e o contrato só vem a partir dos 16 (aos 16, só para o excepcional).'
    ]
  },
  {
    versao: '25',
    data: '2026-11-17',
    titulo: 'Esportes, e-sports e formação de atletas',
    novidades: [
      'Carreira de e-sports em seis jogos (Counter-Strike, VALORANT, League of Legends, Rainbow Six Siege, Fortnite e Rocket League): do ranqueado ao mundial, com peneiras, equipes, contratos, temporadas e títulos — em Caminhos · Outros caminhos.',
      'Cada jogo tem os seus atributos e funções na equipe, e os circuitos têm os nomes reais da época; as equipes são do universo do jogo.',
      'A formação do atleta, ano a ano: as categorias, os jogos, a titularidade, a nota, a colocação, os títulos de base e a chegada ao profissional.'
    ],
    melhorias: [
      'Ficha do atleta nova em todas as modalidades: atributos por grupo, o valor do ano anterior marcado na régua, a evolução, os pontos fortes e as limitações.',
      'Vôlei, futsal, tênis, natação, atletismo e luta ganharam atributos próprios, que pesam na temporada e mudam com o treino e a idade.',
      'Futebol mais disputado: subir para a elite pede regularidade, os grandes clubes e as grandes ligas europeias pedem nome firmado, e os prêmios mundiais comparam a temporada com o mundo. Mercados alternativos abrem outras carreiras lá fora.',
      'A carteira de motorista é lembrada na hora certa (a idade, o veículo sem carteira), uma vez por motivo.',
      'O corpo em quatro partes: condição atual, evolução, objetivo e constituição — cada medida explicada.'
    ],
    correcoes: [
      'Mulheres não recebem mais o alistamento militar antes de 2025 (o alistamento feminino voluntário começou em 2025).',
      'Depois de uma transferência, as cenas do clube anterior não aparecem mais como se fossem do clube novo.',
      'O aviso de veículo parado na oficina diz qual é o veículo e só vale para o que é seu e está com você.',
      'Nas épocas históricas, as eleições existem nos anos certos (1988, 1990, 1992...) e a candidatura volta a ser possível.'
    ]
  },
  {
    versao: 'Eras modernas',
    data: '2026-11-16',
    titulo: 'Revisão das épocas modernas (anos 1990 a 2020)',
    novidades: [],
    melhorias: [
      'Vidas dos anos 2010 e 2020: o mercado de carros e motos passa a ter os modelos que já se vendiam no Brasil (Polo, Virtus, Compass, Creta, Tracker, Corolla Cross, PCX, NMax e outros), cada um a partir do ano em que chegou — em vez de surgirem todos de uma vez em 2026.',
      'Depois de 2025, uma vida que começou numa década passada vive o mundo de hoje por inteiro: a tecnologia que ainda existe fica ao alcance de todos, como numa vida que começa agora.',
      'Na escolha da época, "o que a sua infância atravessa" nunca lista um fato de antes do nascimento; quem nasce no fim da década vê os acontecimentos dos anos seguintes.'
    ],
    correcoes: [
      'Antes de julho de 2023, numa vida histórica, a rede de frases curtas se chama Twitter (no celular, no feed e no aplicativo).',
      'Antes do smartphone, os recados de amigos no celular de teclas não falam mais de vídeo, meme e foto de perfil.',
      'O painel "A época" depois de 2025 deixa de dizer que os valores aparecem na moeda do mês: daí em diante, são reais de hoje.'
    ]
  },
  {
    versao: '24',
    data: '2026-11-15',
    titulo: 'Um corpo que nasce, cresce e muda com a vida',
    novidades: [
      'Nascer: escolha o corpo de nascença antes de nascer — puxar dos pais (com variação), escolher as tendências (estrutura, onde o corpo acumula, facilidade para ganhar músculo, altura, pelos) ou ao acaso —, com a prévia aos 6, aos 16 e aos 30 com e sem treino. Não é o atributo Físico.',
      'O corpo muda aos poucos, ano a ano: academia, esporte, sedentarismo, alimentação, bebida, idade e saúde mexem na gordura e no músculo; parar de treinar também. As proporções de nascença não se editam mais na Aparência.',
      'Objetivos físicos (ganhar massa, definição, força, condicionamento, resistência, reduzir gordura, ganhar peso, desenvolver uma região) e a alimentação (equilibrada, comer mais, comer menos): direcionam a rotina, com a projeção de cinco anos — nada muda de uma vez.',
      'Aparência organizada por categorias: Corpo, Pele e marcas, Pelos, Cabelo e rosto, Piercings e joias, Roupas e estilo, Tatuagens. A categoria escolhida fica lembrada.',
      'Pelos do corpo em fios de verdade, que aparecem na puberdade; e os cuidados: aparar, raspar, cera e laser, por região.'
    ],
    melhorias: [
      'A gordura no desenho tem volume arredondado (cintura, barriga, quadril, coxas, braços), sem a ponta triangular; quem acumula na barriga, no quadril ou nos braços tem silhueta diferente. Crianças têm corpo de criança.',
      'Relógios, correntes, pulseiras, anéis e piercings que eram o mesmo desenho em cores diferentes ganharam construção própria (caixa, pulseira, luneta, elos, gargantilha, guias, pérolas, cabochão, solitário em garras, calibre); os pingentes aparecem também no corpo.'
    ],
    correcoes: [
      'Corpos mais volumosos não têm mais a forma triangular nas laterais da cintura.',
      'Pelos do corpo deixam de ser pontinhos: são fios na direção em que crescem, visíveis no nível "muitos".'
    ]
  },
  {
    versao: '23',
    data: '2026-11-15',
    titulo: 'Corpos diferentes, marcas da pele e joias com forma própria',
    novidades: [
      'Corpo e pele (Você · Aparência): doze proporções — ombros, estrutura, peito, cintura, barriga, quadril, braços, coxas, panturrilhas, comprimento das pernas, músculo — e treze formas de partida para ajustar depois.',
      'A figura usa a sua altura de verdade (a mesma que o esporte mede), e quem aparece no mundo tem corpo, altura e proporções próprias; filhos puxam os pais.',
      'Marcas da pele: pintas, pintas espalhadas, sardas, marca de nascença, manchas, cicatrizes (reta, curva, de cirurgia, de queimadura, de acne), estrias e covinhas — com lugar, lado, tamanho, posição, ângulo e intensidade. Muita gente não tem nenhuma.',
      'Pelos do corpo (de quase nenhum a muitos), nos antebraços, nas pernas e no peito à mostra.',
      'Brincos novos: argola grande fina, argola grossa, argolinha cravejada, geométrico, corrente passante, pendente longo, candelabro, bolinha, flor, argola com pérola, par assimétrico, barra, meia-lua e ear climber.',
      'Colar cubano, de pérolas, em camadas, longo com barra e cordão de couro; bracelete largo, pulseira de pérolas e de corrente dupla; anel largo, duplo e de pérola; e piercings novos na sobrancelha, no lábio e na medusa.'
    ],
    melhorias: [
      'Cada metal tem o seu acabamento no desenho: ouro polido, folheado acetinado, ouro branco e prata espelhados, aço escovado, titânio fosco.',
      'Na vitrine, brincos e piercings aparecem de perto (a orelha, o nariz, a boca); no provador, a lupa da joia ao lado.'
    ],
    correcoes: [
      'O provador mostrava "com a peça" e "como você está" em tamanhos diferentes (e a Aparência num terceiro): agora todas as figuras usam a mesma escala.'
    ]
  },
  {
    versao: 'Eras 2',
    data: '2026-11-15',
    titulo: 'Eras históricas: a época no salário, na loja, no partido, na roupa e na cidade',
    novidades: [
      'Nascer nos anos 1970: cruzeiro novo e cruzeiro, o tri no México, a TV em cores, a Ponte Rio–Niterói, o metrô de São Paulo, a Lei do Divórcio, a anistia e o fim da Arena e do MDB.',
      'Salários da época: cada profissão ganha o que se ganhava no ano (rendimento real da PNAD); perto do mínimo, bem menos que hoje nos anos 1990; com diploma, perto de hoje.',
      'Preços da época: roupa, móvel e eletrodoméstico custavam proporcionalmente mais; a comida do mercado, o aluguel, o plano de saúde e a escola seguem o preço relativo do ano (IPCA).',
      'A época (Você · No mundo) mostra quanto rende o salário: a cesta básica no salário mínimo, a renda média e o que custava mais ou menos que hoje.',
      'Partidos da época: só se filia a partido que existe no mês; quem está filiado acompanha a mudança de nome ou a fusão (PFL → DEM → União Brasil, PMDB → MDB).',
      'Moda de cada década: a calça boca de sino, a camisa de golão, o blazer de ombreira, o jeans cenoura, o fuseau, o moletom geométrico, a camiseta fluorescente, o jeans baggy, a baby look e o jeans de cintura baixa — à venda só no tempo deles. As pessoas desenhadas vestem a roupa de todo dia da década.',
      'Veículos de cada época também entre os importados, as picapes e SUVs grandes, as motos grandes e as bicicletas; os modelos de hoje só depois de lançados.',
      'O metrô e o trem urbano de cada capital chegam na data em que abriram; antes, o transporte é o de ônibus.',
      'A casa da época: a TV de tubo, o microcomputador, o computador bege, o três-em-um, o console de cartucho e o celular de antena desenhados como eram. Na rua, o orelhão e a luz amarela dos postes.',
      'A época (Você · No mundo) mostra quanto custam agora a calça jeans, a geladeira, o carro mais barato e o aluguel, na moeda do mês.',
      'Procurar emprego como se procurava: nos classificados do jornal, no site de empregos ou na rede profissional.',
      'A saúde e o dinheiro de cada época: o SUS, os genéricos, o SAMU; o talão de cheques, o caixa 24 horas, o cartão de débito, a maquininha.'
    ],
    melhorias: [
      'As cenas de decisão também falam do jeito da época (antes, só a Linha da Vida e as mensagens).',
      'A casa da época: a geladeira de uma porta, e os móveis e aparelhos de hoje só depois de chegarem às lojas.',
      'Antes do FIES, o Crédito Educativo. O casamento, o divórcio, a maioridade e a reeleição seguem a lei de cada ano.',
      'As pessoas da época usam, muitas vezes, o corte de cabelo que marcou a década.'
    ],
    correcoes: [
      'Os pais e as pessoas do mundo não têm mais profissão que ainda não existia (loja on-line em 1989).',
      'Sem UPA antes de 2008, sem grupo da turma no aplicativo antes do aplicativo, sem meme, podcast ou entrega por aplicativo antes do tempo.'
    ]
  },
  {
    versao: '22',
    data: '2026-11-14',
    titulo: 'A casa no lugar dela, a fazenda organizada, a vida pública e roupas que não são iguais',
    novidades: [
      'Propriedades rurais: a sede fica num quintal próprio, gramado e cercado, com jardim e árvores de sombra — fora da lavoura. O terreiro reúne o que a propriedade tem (galpão com as máquinas, silos, curral, estábulo, cocheiras, granja, aviário, terreiro de café, viveiro, estufas, placas solares), o carreador sai da porteira e entra nas glebas, e cada uso aparece como é: o pivô em círculo, o café em curvas de nível, a horta em canteiros, a floresta plantada em fileiras, os tanques em quadras, a pista oval do haras, a reserva de mata no fundo.',
      'A casa no lugar dela: vizinhos dos lados, postes, fiação, árvores da calçada e carros parados, conforme o bairro e a cidade (a periferia, o bairro de casas, o centro com prédios, o bairro nobre, o condomínio, a cidade pequena, a zona rural). O que a casa tem do lado de fora aparece no desenho: a garagem, a piscina com deck, a área de lazer com churrasqueira e pergolado, a quadra, a varanda — e no quintal o gazebo, a fonte, o playground, a cama elástica, as espreguiçadeiras.',
      'Sobre o imóvel (Vida · Casa): tipo, onde fica, situação, área e terreno livre, quartos, banheiros e suítes, vagas, o que há do lado de fora, as melhorias feitas, quantos moram, conforto, conservação e custos fixos — e o valor estimado separado do dinheiro na conta e do patrimônio.',
      'Fama: a agenda pública. Os convites chegam pela sua trajetória — o programa de auditório, o talk show (depois de um auditório que deu certo), o podcast, a entrevista, o encontro com fãs, a sessão de autógrafos, a premiação (com uma conquista recente), a homenagem, a festa de gala, a campanha e o contrato de embaixador; e, pela origem do nome, a mesa-redonda e a coletiva do atleta, a apresentação especial e a rádio de quem canta, o festival de quem atua, o fórum e a inauguração do empresário, o debate e a cerimônia do político, a publi e o encontro com seguidores de quem vive das redes. Cada um diz quem convida, o que pede e o que pode trazer; o resultado é incerto e mexe no nome, na imagem, no cachê e na carreira. Em "Na imprensa e nas ruas", o que se disse do seu nome no ano.',
      'Guarda-roupa: as peças lisas deixaram de ser a mesma peça em outra cor — tecido leve, médio, encorpado, técnico ou canelado; comprimento cropped ou longline; gola de ribana larga ou estreita; manga raglan; recortes laterais; carcela de botões; bolso no peito; barra de costura dupla; alças finas ou nadador. Sete básicas novas (oversized, algodão pima, henley, com bolso, manga longa, raglan de beisebol, regata de alcinha). A marca aparece no desenho: o premium e o luxo têm pesponto de contraste e etiqueta, e caem mais justos.',
      'Provador: experimente várias peças — uma de cada parte monta a combinação; duas da mesma parte aparecem lado a lado, com a construção de cada uma em palavras. Os looks salvos ganham ocasião (casual, trabalho, formal, esporte, festa, noite, casa) e avisam quando uma peça não é mais sua.',
      'Loja de móveis e decoração por ambiente: sala de estar, quarto, cozinha e jantar, banheiro, iluminação, decoração, closet e organização, escritório, área externa e jardim, piscina e lazer, lavanderia e serviço, garagem e oficina — com o tipo de móvel dentro de cada um e a ordem por qualidade. "Ver no cômodo" mostra a peça (com a marca e a cor escolhidas) no cômodo de verdade, e diz quando ela não cabe.'
    ],
    melhorias: [
      'As peças que eram idênticas no desenho ficaram diferentes: o terno de vicunha é trespassado, com lapela de bico e lenço; a polo premium tem bordado e friso; a bomber tem ribana e bolso na manga; a jaqueta de corrida, as faixas; o jeans de denim japonês, a barra dobrada.'
    ],
    correcoes: [
      'Na propriedade rural, a casa-sede não aparece mais desenhada em cima da plantação.',
      'A casa de dois quartos mostra a garagem que já tinha na planta.'
    ]
  },
  {
    versao: '21',
    data: '2026-11-14',
    titulo: 'O que veio do roubo, a garagem completa e o reconhecimento de perto',
    novidades: [
      'Submundo: o serviço que dá certo diz o que rendeu — dinheiro em espécie (no saldo) e bens de verdade: celulares, notebooks, joias, relógios, bolsas e roupas de grife, obras de arte, colecionáveis, cargas e veículos. Em "O que veio dos serviços", cada bem tem o que faz sentido para ele: guardar, usar (joia, relógio, bolsa e roupa vão para a Aparência), vender ou se livrar.',
      'Mercado paralelo: o receptador do bairro, a loja de usados, o comprador de ouro, o desmanche e o colecionador que não pergunta — cada um compra coisas diferentes, paga diferente e arrisca diferente. O nome no meio abre os melhores. A venda pode dar errado; o celular ligado e o carro sem documento podem ser achados; o processo traz a busca — e a investigação segue o caminho de sempre.',
      'Garagem: utilitários e vans, jipes e off-road, picapes grandes e esportivas (RAM, Silverado, Raptor), hipercarros (Bugatti, Koenigsegg, Pagani, Rimac, Aston Martin Valkyrie) e carros de competição (rali, Stock Car, Porsche 911 GT3 R e um monoposto de Fórmula 1). Carro de corrida não vai para a rua: usa-se no dia de pista, com equipe, autódromo e o risco de uma rodada.',
      'Guarda-roupa: 45 peças novas com desenho próprio — camisas, blusas, calças, saias, shorts, vestidos, smoking, macacão de piloto, pijama cirúrgico, quimono, jaleco, jaquetas e casacos, tênis, botas, relógios e bolsas, do básico à alta-costura.',
      'Os números do seu ofício (Trabalho · Minha carreira): cada profissão conta o que é dela — pacientes e plantões, audiências, obras, pratos servidos, quilômetros, ocorrências, safras —, e os números redondos viram lembrança.',
      'Reconhecido de perto: a médica de vinte anos na cidade, o padeiro do bairro, a professora que deu aula para metade da cidade passam a ser conhecidos onde vivem — sem virar celebridade. A rádio comunitária, a escola, a câmara e o jornal da cidade reagem sozinhos. Em Você, as formas de reconhecimento lado a lado: fama, prestígio no ofício, reconhecimento local, influência e imagem.'
    ],
    melhorias: [
      'Mensagens: a sua resposta é a da conversa e da pessoa (a mãe é "mãe", a avó é "a senhora", a criança responde como criança); as notícias dizem o que aconteceu (mudar para um lugar menor não é "casa nova"); quem perdeu o emprego desabafa como quem perdeu o emprego; só comenta um feito seu quem tinha como saber dele; o aniversário da irmã de dez anos não tem fala de mãe.',
      'Pede atenção mostra situações, não mensagens: o convite fica no celular; a queixa de distância some quando vocês já voltaram a se falar; quem aparece para apoiar diz o motivo; o aperto do ano passado vira "continua sem emprego".'
    ],
    correcoes: [
      'Bolsas, mochilas, pochetes e clutches compradas aparecem na Aparência (dá para levar, trocar e guardar).',
      'Fachadas: o muro é desenhado na frente de tudo o que está atrás dele — palmeiras, luzes do caminho e arbustos não aparecem mais pintados por cima; a mansão tropical tem uma palmeira só, fora da piscina; no sítio, as palmeiras não atravessam a torre da caixa-d\'água.',
      'A resposta romântica ("gosto de você como amiga") não aparece mais em convite de irmão ou de amigo.'
    ]
  },
  {
    versao: '20',
    data: '2026-11-14',
    titulo: 'Das pistas aos clubes: automobilismo, clubes à venda e joias',
    novidades: [
      'Automobilismo: comece no kart (a partir dos 7) e suba pelas categorias — monopostos de entrada, Fórmula 4, Fórmula Regional, Fórmula 3, Fórmula 2 e Fórmula 1. Cada temporada é corrida a corrida contra um grid inteiro: pilotagem, consistência, adaptação aos circuitos, preparo físico, experiência, cabeça sob pressão e o carro da equipe. Pontos de Superlicença (40 em três anos) e 18 anos para a F1, como manda a FIA.',
      'O dinheiro das pistas: cada categoria custa uma temporada — a família, um patrocinador ou a academia de pilotos de uma equipe pagam; sem orçamento, não há temporada. Na F1, o contrato e o salário; resultado ruim perde a vaga. Acidentes, rivais, companheiros de equipe, fama e a temporada longe de casa.',
      'Clubes à venda: todo clube em que se pode jogar pode ser comprado (Patrimônio · Empresas). Preço pela divisão, pelo porte, pela forma e pelas dívidas; à vista ou financiado. Elenco, mercado de transferências, renovações, categorias de base, estádio, centro de treinamento, objetivo da temporada, aportes e dividendos — na mesma liga, com a mesma tabela de sempre.',
      'Celular: cada rede é um aplicativo próprio — Instagram, TikTok, YouTube, X e Facebook (e Twitch e OnlyFans para quem tem conta) —, com o feed de quem você conhece naquela rede, o botão de criar sempre no alto e a publicação em um toque. Perfil, notificações, Em alta (no X), o canal (no YouTube) e as configurações da conta ficam dentro de cada app.',
      'Joias de usar: 94 peças (correntes, gargantilhas, pingentes, colares de pedra, brincos e argolas, pulseiras e braceletes, anéis, alianças e tornozeleiras) em ouro amarelo, branco e rosé, prata, aço, platina, titânio, com diamante, rubi, esmeralda, safira, ametista, pérola e mais. A peça comprada aparece no corpo, no lugar certo.'
    ],
    melhorias: [
      'Cômodos: o vaso sanitário nas medidas reais, as mesas de cabeceira do tamanho certo ao lado da cama, e a geladeira, o guarda-roupa, a estante, o box, a pia, o fogão, o fliperama, a luminária de pé e outros com a altura de catálogo.',
      'Vícios: os efeitos chegam também aos estudos e às amizades.'
    ],
    correcoes: [
      'Nenhum vício começa nem se desenvolve antes dos 14 anos — e quem continua a vida de alguém que morreu não herda os vícios dele.'
    ]
  },
  {
    versao: '19',
    data: '2026-11-13',
    titulo: 'Pessoas com vida própria e a VIDA Conectada',
    novidades: [
      'As pessoas da sua vida vivem mesmo quando você não olha: amigos, irmãos, primos, ex e colegas trabalham, guardam ou se endividam, compram o carro e o apartamento, abrem (e fecham) negócios, namoram, casam, se separam, voltam, têm filhos, mudam de cidade — cada um pelo seu jeito e pelo momento da vida.',
      'Quem importa também se conhece entre si: amizades do mesmo grupo, brigas, pazes — e a ficha de cada um mostra.',
      'Celular · Rede: o feed com as publicações de quem está na sua vida (texto, foto, álbum, vídeo curto, story), na rede de cada um, com curtidas, comentários e quem comentou. Curtir, comentar no tom que você escolher, compartilhar, puxar conversa pela publicação (vai para Mensagens) e abrir o perfil da pessoa, com as conexões que ela mostra.',
      'Mega da Virada: o concurso especial do fim do ano, com o prêmio que não acumula (sem sena, vai para a quina).',
      'Haras: cobrir as éguas com garanhões da casa ou de fora; os potros nascem com a linhagem dos pais e o acaso deles.',
      'Campo: CAR, georreferenciamento, outorga de água e o crédito de custeio do Plano Safra (Pronaf, Pronamp, demais), com a fiscalização ambiental e as ações de divisa pela Justiça. Empresas do campo: agroindústria e laticínio, que compram da sua própria terra.'
    ],
    melhorias: [
      'O placar de cada jogo da rodada das apostas e da Loteca é o mesmo jogo da tabela do campeonato.',
      'Salão, cozinha, obra, elétrica, estrada e balcão ganharam áreas, desafios e a saída por conta própria.'
    ],
    correcoes: [
      'O amigo que se casava não tinha com quem: agora a parceria tem nome, e a história continua.'
    ]
  },
  {
    versao: 'Eras (protótipo)',
    data: '2026-11-13',
    titulo: 'Eras históricas: nascer no Brasil de outra década',
    novidades: [
      'Nascer · "Quando você nasce": hoje (o VIDA de sempre) ou um ano entre 1980 e 2025, no Brasil. A vida segue o calendário: quem nasce em 1984 é criança nos anos 80, adolescente nos 90, adulto nos 2000 — e continua até hoje e além.',
      'A moeda de cada mês: cruzeiro, cruzado, cruzado novo, cruzeiro, cruzeiro real e real, com os preços pela inflação oficial (IPCA). Trocar de moeda corta os zeros, não o seu dinheiro. O Plano Collor retém o que passa de NCz$ 50 mil.',
      'O aparelho da época: o telefone de casa (recados e cartas), o celular de teclas (torpedos) e, só quando chega, o smartphone. Rede social, aplicativo de namoro, Pix e e-mail só existem a partir do ano em que chegaram ao Brasil.',
      'Os acontecimentos reais do Brasil, com data e fonte — das Diretas Já à COP30 —, lembrados conforme a sua idade e o seu estado. As lojas, os carros, as profissões e os estudos de cada ano.',
      'Você · No mundo · "A época": a presidência, a moeda, o salário mínimo, a inflação e a tecnologia do ano. Na Biografia, a marca de cada década e o fio "A época".'
    ],
    melhorias: [
      'Os carros e as motos de cada época têm desenho próprio na garagem, pelas medidas de cada modelo.',
      'O texto da vida fala do jeito da época: telefone, carta, depósito, vestibular — antes de existirem o celular, o e-mail, o Pix e o Enem.'
    ],
    correcoes: [
      'A vida contemporânea não muda: as épocas só valem para quem escolhe nascer nelas.'
    ]
  },
  {
    versao: '18',
    data: '2026-11-13',
    titulo: 'Vida rural, apostas e loterias',
    novidades: [
      'Vida · Campo: sítio, chácara, fazenda agrícola, de gado ou de café, haras, floresta plantada e piscicultura — cada uma com área, reserva legal, solo, água e vocação. Comprar à vista ou com crédito rural, arrendar de alguém, arrendar a sua, expandir, reduzir, morar nela ou guardar como investimento.',
      'Lavoura em talhões com o calendário de plantio e colheita: soja (com a safrinha de milho), milho, arroz, feijão, algodão, cana, café, trigo, mandioca, pomar, hortaliças, cacau, açaí, uva, eucalipto e pínus. O clima da região, as pragas, a rotação, o orgânico certificado, a irrigação e a tecnologia mudam a safra.',
      'Rebanhos: gado de corte e de leite, cavalos, ovelhas, cabras, porcos, galinhas, frangos, tilápia e tambaqui — genética, sanidade, alimentação, crias, perdas, vendas. Galpão, silo, estufa, pivô, curral, ordenha, cocheiras, aviário, tanques, poço, represa, energia solar e máquinas.',
      'A terra da família: quem vem do campo tem um sítio (ou uma fazenda) na família, que passa adiante na herança; quem herda decide continuar, pôr um gerente, arrendar, vender ou guardar.',
      'Festas do campo: festa junina, exposição agropecuária, rodeio, cavalgada, vaquejada, provas crioulas, feira do produtor — e temporadas na propriedade.',
      'Loterias da Caixa com as regras de cada uma: Mega-Sena, Lotofácil, Quina, Lotomania, Dupla Sena e Loteca. Volante, surpresinha, apostas com mais dezenas, bolão da lotérica e bolão com os amigos; concursos numerados, rateio por faixa, acúmulo.',
      'Apostas esportivas na rodada do futebol simulado (vencedor, placar, gols) e na temporada (campeão, G4, rebaixamento, copa); turfe nos hipódromos, com os cavalos do seu haras correndo; bingo; histórico de tudo. Um prêmio grande muda a vida — e traz pedidos, convites e escolhas.'
    ],
    melhorias: [
      'O limite do ano, a autoexclusão e o acompanhamento do jogo que vira problema valem para todas as apostas.'
    ],
    correcoes: [
      'No Brasil, cassino e caça-níquel deixaram de aparecer como legais (são proibidos por lei); fora do país, onde a lei permite, a mesa abre.'
    ]
  },
  {
    versao: '17',
    data: '2026-11-12',
    titulo: 'Imersão, personalização, lojas e mundo vivo',
    novidades: [
      'Mapas mostra a sua cidade num mapa ilustrado: o porte, o mar ou o rio, a economia da cidade (o porto, o centro histórico, o distrito industrial, o campus), os tipos de bairro e onde você mora, o trabalho, o estudo e o comércio.',
      'Mensagens com vida: desabafos, brincadeiras, paqueras, favores, cobranças, mágoas, comemorações do que aconteceu com você, o seu aniversário, a fama vista pelos amigos, o trabalho em comum, a família e os filhos — cada pessoa no seu jeito de falar. As respostas têm tons diferentes e consequências diferentes, e algumas conversas voltam depois.',
      'Tatuagens no rosto (testa, têmporas, canto do olho, bochechas, nariz, queixo, sobrancelha) e um catálogo novo da rua, da periferia e da tradição de cadeia, com os significados ditos com cuidado.',
      'Cirurgias do corpo e mais: bariátrica (o corpo muda aos poucos, com suplementos para a vida toda), lipoaspiração, abdominoplastia, mamoplastia e prótese, bichectomia, mentoplastia, harmonização, botox, septoplastia e cirurgia refrativa — com recuperação, repouso, riscos e resultados que nem sempre agradam.',
      'Bonés e chapéus novos (trucker, dad hat, grife, viseira, bucket, fedora, boina, gorro com pompom, touca de cetim, aba larga), óculos, relógios, joias e bolsas (transversal, sacola, mochila, pochete, de mão).'
    ],
    melhorias: [
      'No máximo quatro mensagens por ano no celular, somando tudo: menos mensagens, mais significado.',
      'Móveis com função: o sofá da sala, a cama de cada quarto, a geladeira da cozinha. Comprar outro modelo oferece trocar (o antigo vai para o depósito); a segunda cama vai para o segundo quarto.',
      'O guarda-roupa virou uma grade de peças; Pessoas ganhou a constelação do seu círculo; Minha Semana, a semana em tiras; História, a fita da vida.',
      'As lojas falam a mesma língua: o estado de cada produto (é seu, em uso) no mesmo canto, a cor de cada loja na vitrine, e os tecidos com textura (o jeans, o tricô, o linho, o couro, a seda).',
      'A clínica separa rosto, corpo e procedimentos funcionais, com a prévia do corpo inteiro.'
    ],
    correcoes: [
      'O app Rede não mostra mais um segundo celular dentro do celular.',
      'Preso, o celular fica retido: nenhum aplicativo, só o telefone da unidade para a família e a parceria.',
      'Pai e mãe casados não arranjam mais namorado; quem se separou ou ficou viúvo espera um tempo antes de um romance novo.',
      'O boné não fica mais atravessado pelo coque.'
    ]
  },
  {
    versao: '16.1',
    data: '2026-11-11',
    titulo: 'Profissões por dentro e telas novas',
    novidades: [
      'Engenharia, enfermagem, contabilidade, jornalismo e psicologia por dentro: a obra do ano e o padrão de execução (com o risco que fica guardado), a escala de plantão e o cansaço que acumula, a carteira de clientes e os prazos fiscais, as pautas e a credibilidade, os pacientes que seguem de um ano para o outro até a alta.'
    ],
    melhorias: [
      'Você virou um perfil: o retrato, a ficha (dinheiro, o que é seu, a cidade) e os números da vida social numa peça só.',
      'A fama ganhou a sua capa de revista, com a manchete do momento.',
      'Compras mostra a fachada de cada segmento; a garagem virou showroom; a casa aparece sobre a planta.',
      'Viagens com passaporte e carimbos dos países visitados; Estudos com a carteirinha de estudante; o atleta com o placar da carreira também em Outros caminhos.',
      'Em Vida, as abas ganharam ícones e ficam à mão enquanto você rola (no computador).'
    ],
    correcoes: ['Em Vida, a cabeça da área (onde mora, o dinheiro, o que é seu) não se repete mais inteira em cada seção: dentro de Compras, Patrimônio, Viagens e as outras, vira uma faixa curta.']
  },
  {
    versao: '16',
    data: '2026-11-11',
    titulo: 'Aprofundamento e imersão',
    novidades: [
      'Advocacia, docência e tecnologia por dentro: os processos que chegam ao escritório (pegar o caso, buscar acordo ou ir a julgamento, preparar a fundo, recorrer), as turmas do ano e a sua forma de dar aula, o aluno que precisa de você, o projeto da escola, o projeto de software com o ritmo que você escolhe, a dívida técnica e os incidentes em produção.',
      'Vida religiosa: caminhos próprios de cada tradição — o sacerdócio católico (do seminário ao conclave), o diaconato permanente, a vida consagrada, o ministério evangélico e o protestante, o candomblé (com as obrigações, ogãs e equedes), a umbanda, o trabalho espírita, o rabinato, a liderança da mesquita e o ensino islâmico, a vida monástica budista.',
      'Na vida religiosa, a comunidade é sua responsabilidade: formação, reconhecimento, união, influência, o caixa da comunidade, projetos comunitários e as questões difíceis de cada ano.',
      'Mensagens: escreva para quem quiser (perguntar como está, dizer que sente falta, chamar para um café, pedir desculpas, oferecer apoio) — e o histórico das conversas fica guardado, com dia e hora.'
    ],
    melhorias: [
      'O aplicativo de namoro funciona mesmo para quem está num relacionamento. O que você faz nele pode — ou não — ser descoberto, e a reação depende de quem é a sua parceria e de como vocês estão.',
      'Pede atenção, em Pessoas, diz o que está acontecendo em cada relação e por quê, sem repetir as mensagens.',
      'Mais móveis com volume de verdade: camas, sofás, poltronas, a mesa de bilhar, as poltronas de cinema, a área gourmet.',
      'Os carros ganharam soleira, para-lamas com brilho, borracha nos vidros e tampa do combustível.'
    ],
    correcoes: [
      'As palmeiras das fachadas não atravessam mais o telhado nem a parede, e crescem na proporção certa.',
      'As luzes de fora da casa (arandelas, balizadores, espetos) acendem como luz, no lugar certo — não mais como triângulos amarelos na parede.'
    ]
  },
  {
    versao: '15',
    data: '2026-11-10',
    titulo: 'Imersão, mundo vivo e interfaces',
    novidades: [
      'O celular: um aparelho de verdade no topo da tela, com notificações e aplicativos — Mensagens, Namoro, Rede, Notícias, Agenda, Mapas, Banco, E-mail e, para quem é conhecido, Fama.',
      'O aplicativo de namoro: perfis com foto, idade, profissão, distância e interesses; curtir ou passar; o match só vem quando é recíproco; depois, conversa e encontro.',
      'As pessoas tomam a iniciativa: amigos convidam para programas, a família conta novidades, a parceria sugere um tempo a dois, colegas antigos e ex reaparecem, contatos oferecem trabalho.',
      'A vida acontece durante o ano: conforme você faz as coisas, chegam mensagens novas — e sair, viajar, comprar ou ir a um programa pode pôr alguém conhecido no seu caminho.',
      'A fama com consequências: fãs pedem foto, eventos e festas fechadas convidam, pessoas famosas puxam conversa (e podem virar amizade ou romance), a imprensa pergunta sobre o seu relacionamento.',
      'O jornal do ano: economia, política, esportes, mundo, gente conhecida — e você, quando o seu nome é notícia.',
      'Interromper uma gravidez segue a lei de onde se vive: legal a pedido em alguns países, só em casos previstos em outros, proibido em outros — e, nos Estados Unidos, depende do estado.',
      'Cenas novas na infância, na adolescência e na velhice, e cenas que voltam à sua história: a carta escrita aos onze anos, uma foto antiga, o colega de escola que ficou famoso, a volta à cidade onde você cresceu.'
    ],
    melhorias: [
      'Você ganhou um perfil: amigos, família, seguidores, estado civil, fama e objetivos, cada um levando à sua tela.',
      'Pessoas mostram quando foi a última conversa com cada um, e quem é famoso.',
      'Caminhos · Trabalho abre com o crachá da sua carreira: o clube, a posição e os números do atleta; a especialidade do médico; as empresas; o partido e o mandato; os trabalhos do artista.',
      'O Submundo organizado em grupos (você no meio, o que se faz, gente e poder, a lei), cada parte dizendo o que tem.',
      'Conhecidos podem ficar famosos — e isso aparece na vida deles, na rede e no jornal.',
      'Rodas com profundidade (flanco, aro, disco de freio) e faróis com lente nos desenhos dos veículos.'
    ],
    correcoes: [
      'Natação, atletismo, lutas e outras modalidades não falam mais de bola, chuteira ou gramado.',
      'A aba de redes em Minha Semana passou a se chamar Redes sociais (o celular agora é o aparelho).'
    ]
  },
  {
    versao: '14',
    data: '2026-11-09',
    titulo: 'Expansão e aprofundamento',
    novidades: [
      'Objetivos pessoais em Você: escolha metas de vida, acompanhe o progresso medido do que acontece de verdade, mude ou deixe de lado.',
      'Mandatos com medidas concretas: leis, reformas, investimentos, impostos e programas que pesam nas contas e mudam a vida da cidade por anos — e deixam legado.',
      'Viagens de negócios, culturais, a eventos internacionais, a lugares conhecidos e de luxo, com os países que você já conheceu.',
      'Reconhecimento profissional: prêmios, congressos, feiras, palestras e entrevistas conforme a sua área.',
      'Restaurantes especiais, cozinhas de outros países, degustações, festivais, galas, leilões, desfiles e premiações — do simples ao exclusivo.',
      'O mundo muda com as décadas: crises, avanços, desastres, pandemias e profissões que surgem e somem, com efeito no trabalho, nas empresas e nas viagens.',
      'Processos na Justiça fora do crime: trabalhistas, de contrato, de consumidor, indenizações e multas, com advogado, acordo e recurso.',
      'Crença e espiritualidade: ter ou não uma religião, praticar, celebrar as datas e mudar ao longo da vida.',
      'Dependências tratadas com cuidado: o uso que vira problema, os limites, o pedido de ajuda, o tratamento, a recuperação e as recaídas.',
      'Futsal como modalidade própria, com posições e goleiro-linha; e handebol, pedal, skate, surfe e tênis de mesa como prática.',
      'Riscos na sobrancelha, desenhos de sobrancelha, pintas e cílios em Você → Aparência.',
      'Imóveis vazios, semimobiliados, mobiliados e de luxo para alugar ou comprar; conjuntos de móveis por cômodo e estilo.',
      'Mais 67 municípios brasileiros, Igarassu (PE) entre eles, cada um com o que a cidade faz.'
    ],
    melhorias: [
      'A casa por fora agora é um conjunto em 2.5D: volume, sombra, garagem junto da casa, calçada, muro, jardim e estilos distintos.',
      'A loja de móveis agrupa por tipo de móvel, mostra o espaço que cada peça ocupa e se cabe no cômodo, com prévia — o que não cabe vai para o depósito.',
      'Piercings inteiramente no painel de Aparência: o furo, as joias que cabem, o preço, comprar, usar e tirar.',
      'Os números das empresas organizados por grupo, com a participação e a valorização em destaque.',
      'Trocar de partido tem permanência mínima e justa causa (expulsão, fusão, perseguição).'
    ],
    correcoes: [
      'A candidatura à Presidência de Portugal agora existe: eleição em data própria, candidatura de cidadãos, e o Presidente que não governa.',
      'Empresas compradas e revendidas não dão mais lucro artificial: o preço sai do lucro de verdade, com desconto por risco, juventude e participação minoritária.',
      'Morar numa cidade pequena não fecha portas de carreira: a vaga é mais rara, não proibida.'
    ]
  },
  {
    versao: '13',
    data: '2026-11-07',
    titulo: 'Fama que muda a vida, empresas que escolhem o que fazem, decisões com resultado na hora e um visual novo para casa, veículos e aparência',
    novidades: [
      'Fama: quem ficou conhecido ganha uma parte própria em Você, com o tamanho do nome, até onde ele chega, por que conhecem você (esporte, arte, música, negócios, política, internet, um feito ou uma polêmica), a imagem pública (admiração e rejeição) e o que a fama traz e cobra. O mundo reage na medida do nome: campanhas e patrocínios, convites, palestras, gente querendo conhecer você — e paparazzi, boatos e vaias. Para quem não é conhecido, nada disso aparece.',
      'O passado volta: um título que completa anos redondos, uma polêmica antiga, um negócio que fechou, um emprego que você deixou, um amigo ou rival de antes — só o que de fato aconteceu na sua vida, com as pessoas que você conheceu.',
      'Empresas escolhem o que produzir: cada ramo tem os seus produtos (salgadinhos, cereais e chocolates; SUVs, sedãs, esportivos e elétricos; smartphones e software; satélites e foguetes; pratos e cardápios...), cada um com investimento, prazo, público, concorrência, margem e risco. Dá para lançar, abrir uma linha nova para ele, melhorar, investir em qualidade, reposicionar, mudar o preço e descontinuar — e o resultado aparece no faturamento, no lucro, na reputação, na fatia de mercado e no valor da empresa.',
      'Piercings em Você → Aparência: veja cada furo de perto (orelha, nariz, sobrancelha, boca, umbigo), experimente as joias que você já tem antes de usar, troque ou tire. Furos novos (segundo lóbulo, concha, daith, industrial, ponte, medusa...) e muitas joias novas em ouro, prata, aço, titânio e pedras.',
      'Mais 11 cortes de cabelo, 8 barbas, mechas e ombré, novas cores e maquiagem (delineado, sombra, batom e blush), com prévia do rosto e do corpo inteiro, de frente e de costas, ao lado de como você está hoje.',
      'Mais 255 desenhos de tatuagem: cultura pop de videogames, livros, séries, filmes, animações, quadrinhos e lendas (106 obras) — agora com 81 personagens desenhados de verdade (Sherlock Holmes, Drácula, Nosferatu, Alice, Dorothy e o Homem de Lata, Peter Pan, Pinóquio, Emília e o Visconde, Saci, Curupira, Iara, Popeye de 1929, Dom Quixote, Medusa e muitos outros) —, e novos geométricos, minimalistas, fine line, blackwork, old school, oriental, tribal, criaturas, céu e espaço e bichos do Brasil. A busca entende várias palavras e o filtro de obra separa por tipo.'
    ],
    melhorias: [
      'Uma decisão de cada vez: depois de escolher, o resultado aparece na hora (o que você escolheu, a conta antes e depois, o que mudou e o que esperar), e só então vem a próxima — já levando em conta o que acabou de acontecer. Dá para deixar as que podem esperar para depois.',
      'As ações de Caminhos viraram botões de verdade, agrupadas pelo que fazem (na política: mandato, campanha, partido, relações, exposição, estratégia), com o motivo à vista quando algo não está ao alcance.',
      'A gestão da empresa ficou mais clara: as decisões estão em abas, a opção escolhida aparece marcada, o que não dá para fazer diz por quê, e cada decisão deixa registrado o que custou, o que mudou e, no fim do ano, o que aconteceu.',
      'Móveis com volume: tampo, laterais e profundidade — a penteadeira, cômodas, aparadores, escrivaninhas, armários e bancadas deixaram de parecer recortes de papel quando ficam de lado.',
      'Carros e motos redesenhados pelas medidas reais de cada modelo: um 911, um Huracán, um Fusca, um sedã, um SUV e uma picape têm formas próprias, com faróis, lanternas, rodas e para-choques de cada um. Suspensão, motor preparado, escape e baú aparecem no desenho; na garagem, os veículos ficam em escala e dá para ver cada um de perto.',
      'Nomes de empresas, marcas e concorrentes muito mais variados, sem repetir nem confundir no mesmo contexto.'
    ],
    correcoes: [
      'Ao decidir várias coisas no mesmo ano, só o último resultado aparecia — agora cada um aparece antes da próxima decisão.',
      'Uma empresa podia comprar uma concorrente com o mesmo nome dela; agora fica claro quem comprou quem.',
      'O veículo comprado às vezes aparecia diferente na garagem (e o presente pedido por um filho chegava como outro modelo).',
      'Móveis encostados na parede lateral apareciam espelhados; na cozinha estreita, a bancada ficava baixa e o micro-ondas flutuava; a escrivaninha mostrava duas cadeiras.',
      'As ações de governo de quem ocupa a Presidência apareciam em Trabalho.',
      'Os diamantes em ouro branco eram desenhados em ouro amarelo.'
    ]
  },
  {
    versao: '12.9.1',
    data: '2026-11-07',
    titulo: 'Colégio Eleitoral nos EUA, as cidades das universidades no mapa e motos clássicas',
    novidades: [
      'Motos clássicas: Triumph Bonneville, Norton Commando, Vincent Black Shadow, Ducati 750 SS, BMW R 90 S, Honda CB750, Kawasaki Z1, Harley-Davidson Knucklehead, Indian Chief e mais — na garagem do colecionador, sem depreciar pela idade, com raridade pela produção de verdade e uma coleção própria. Filete no tanque, banco de couro e rodas raiadas aparecem no desenho.',
      'As cidades dos campi que faltavam entraram no mapa (São Carlos, Limeira, Botucatu, Araraquara, Franca, Macaé, Toledo, Camaçari, Betim, Poços de Caldas e outras): dá para morar, trabalhar e estudar nelas, e todos os campi das universidades reais podem ser escolhidos.'
    ],
    melhorias: [
      'O painel político dos EUA explica as regras do Colégio Eleitoral, e o histórico de candidaturas mostra os delegados, os estados ganhos e o voto popular.',
      'As cidades novas aparecem na escolha de onde nascer e na mudança de cidade.'
    ],
    correcoes: [
      'O número de fabricados na raridade de um veículo de coleção aparece com o milhar certo (10.594, não 10,594).',
      'A eleição para presidente dos EUA agora se decide no Colégio Eleitoral: cada estado dá os seus delegados a quem vence nele (Maine e Nebraska dividem por distrito), e é preciso 270 de 538. Dá para ter mais votos no país e perder — e, sem maioria, a Câmara decide.'
    ]
  },
  {
    versao: '12.9',
    data: '2026-11-06',
    titulo: 'Uma vida maior: empresas que você comanda, fortunas que mudam de verdade, faculdades reais, política mais longe, identidade e vida social',
    novidades: [
      'Empresas de todos os portes: além dos negócios de sempre, dá para fundar ou comprar empresa de tecnologia, construtora, indústria, montadora, banco, companhia aérea, aeroespacial, semicondutores, energia e infraestrutura — cada uma com capital próprio, projetos que levam anos para dar retorno, riscos e alavancas diferentes. Só aparece o que você consegue bancar.',
      'Gestão de verdade: cada empresa tem um painel com faturamento, custos, lucro, caixa, reputação, valor e os motivos do ano (o que foi escolha sua e o que foi acaso). Você define preço, marketing, qualidade, produção, expansão e pesquisa; contrata ou troca a diretoria (conservadora, agressiva, inovadora...) e decide se toca a empresa ou delega.',
      'O dinheiro pesa conforme o tamanho da fortuna: o patrimônio separa o que está na conta, o que está em bens e empresas e o que se deve. Uma grande perda pode obrigar a vender bens às pressas ou virar dívida — e dá para quebrar e se reerguer. Quem é rico aposta alto e perde de verdade; cada faixa de vida tem seus próprios acontecimentos.',
      'Faculdades e universidades reais do Brasil (USP, Unicamp, Unesp, UFRJ, UFMG, UnB, UFRGS, PUCs, FGV, Mackenzie, Insper, ESPM e outras), com os cursos de cada campus e o processo seletivo de cada uma — Fuvest, Comvest, Vunesp, PAS, SISU, vestibular próprio — com as fases e a nota de cada uma.',
      'A vida acadêmica por semestre: notas, exame final, dependência nas férias, cancelamento por reprovações (com aviso antes), trancamento, troca de curso (transferência interna ou novo processo), o turno na sua agenda. Novos cursos técnicos ligados a vagas de verdade.',
      'A política vai mais longe: a disputa nacional tem convenção, vice, adversários, debate, pesquisa e segundo turno onde existe — e o mandato tem economia, Congresso, reformas, crises, relações internacionais e legado, com as regras de cada país. O governo do estado ganhou problemas próprios.',
      'Piercings: nariz, septo, sobrancelha, lábio, helix, tragus e umbigo, com joias de aço, titânio, prata, ouro e pedras — no provador antes de comprar, trocando a joia de cada furo.',
      'Mais 168 desenhos de tatuagem: cultura pop (inspirados em dezenas de animes, séries e filmes), bichos, natureza e estilos novos (aquarela, pontilhismo, sketch, neotradicional, surrealista...), com filtros por tema, obra e busca no estúdio.',
      'Looks com nome: guarde o que está usando (casual, trabalho, festa...) e vista de novo com um toque.',
      'Receber gente e sair junto: jantar, festa, churrasco, festa na piscina, cinema em casa, noite de jogos, bar, cinema — você escolhe quem vai e o jeito (do dia a dia, caprichado, com buffet). A casa decide o que dá e quantos cabem; quem estava de mal pode fazer as pazes (ou não).',
      'Presentes por ocasião (aniversário, Natal, bodas, Dia das Mães e dos Pais, Dia dos Namorados) e um calendário do ano com os aniversários de quem importa, os feriados, a eleição e o que já aconteceu.',
      'Instrumentos de verdade: escolha qual aprender, veja o progresso em cada um (sem perder o que aprendeu ao trocar). Foto, desenho, pintura, cozinha e plantas ganham marcos — e alguns rendem.',
      'Mais veículos (motos, clássicos, esportivos, luxo e edições limitadas) e uma garagem para ver a coleção. Pintura metálica, perolizada, acetinada ou fosca, rodas, teto e faixas aparecem no desenho.'
    ],
    melhorias: [
      'Os cômodos se arrumam melhor: penteadeira, closet, armários planejados e vitrines vão de lado, junto da parede — a cama, a ilha da cozinha e o sofá ficam à vista, e quase nada fica de fora da cena.',
      'A Retrospectiva ganhou a faixa da vida (cada memória na idade dela) e o álbum inteiro; a foto do primeiro carro e da primeira casa mostra o carro e a casa de verdade.',
      'A raridade dos carros de coleção vem dos dados do modelo (tiragem, produção), não do preço; o nome é o do modelo.'
    ],
    correcoes: [
      'A peça do provador era de uma cor e a do cartão de outra (a camisa de time amarela no provador, preta no cartão): agora você escolhe a cor, e o que se vê é o que se compra e o que fica no guarda-roupa.',
      'Uma cena de "jogar a final com dor" podia dar título mesmo com a equipe já eliminada. Nenhuma escolha dá mais título, final ou medalha que a simulação não deu, em nenhum esporte.',
      'Perdas de acontecimentos não somem mais só porque o dinheiro estava aplicado; o FIES não deixa de virar dívida ao abandonar o curso; reprovações demais cancelam a matrícula.'
    ]
  },
  {
    versao: '12.8',
    data: '2026-11-02',
    titulo: 'Casas de verdade: cômodos montados, banheiros na conta certa, o lado de fora, marcas com identidade, coleções e mais exóticos',
    novidades: [
      'Os cômodos agora são cenas montadas: cada coisa no tamanho dela e no lugar dela — a cama encostada na parede com as mesas de cabeceira dos dois lados, a mesa de centro na frente do sofá sobre o tapete, a TV na parede, o ar-condicionado no alto, os quadros acima do sofá, o celular e o notebook num tampo, as espreguiçadeiras no deck, as boias na água. O lavabo é estreito e a sala da mansão é larga: a cena tem o tamanho do cômodo.',
      'Banheiros proporcionais à casa: suítes com banheiro próprio, lavabo na área social e banheiro social — a kitnet tem um, a mansão tem as seis suítes, o social e o lavabo. Na casa própria dá para construir um banheiro a mais.',
      'O lado de fora: fachada (pintura, tijolinho, madeira, pedra, porcelanato, travertino, projeto de arquiteto), jardim (do gramado ao paisagismo assinado, conforme o terreno), caminho, iluminação externa e portão — com prévia no desenho da casa antes de pagar. Novas obras: quadra, varanda e adega.',
      'Os cômodos servem: sessão de cinema para a família, treino na academia de casa (sem mensalidade e sem trânsito), nado, festa e tarde na piscina, leitura e estudo na biblioteca, noite de jogos, dia de trabalho em casa no escritório (para quem trabalha com isso), ensaio e gravação no estúdio, a garrafa aberta na adega, o jogo na quadra.',
      'Marcas com identidade: cada uma tem posicionamento (econômico, intermediário, premium, luxo, ultraluxo) e aquilo pelo que é conhecida. A durabilidade muda o desgaste, o valor de revenda muda o usado, o conforto da cama e do sofá conta na casa — e o desenho muda com a marca. Chegaram Hermès, Patek Philippe, Minotti, Fendi Casa, Gaggenau e Fazioli.',
      'Coleções: suas coleções organizadas (relógios, arte, joias, antiguidades, vinhos, memorabilia, carros de coleção, peças numeradas, discos e troféus), com o valor estimado, o que está à vista e a raridade em seis graus — comum, incomum, rara, muito rara, edição limitada e peça única — tirada dos dados da peça, não do preço. Vinhos de guarda na importadora (sem adega, envelhecem mal) e móveis de expor: vitrine, expositor de relógios, estante de troféus, adega de parede.',
      'Mais exóticos, cada um com jeito, comida, tempo de vida e o que pede de casa: cacatua, tucano-toco, jiboia, raposa-do-deserto e, onde a lei permite com licença, o macaco-prego e o sagui. Onde não permite (no Brasil, os primatas), a loja diz por quê.'
    ],
    melhorias: [
      'A loja de móveis e eletrodomésticos se filtra pelo cômodo (sala, cozinha, quarto, banheiro, escritório, lazer, academia, piscina e área externa, garagem) e pelo segmento da marca; o cartão diz o que a marca muda de fato.',
      'A peça de coleção exposta aparece no cômodo: a tela na parede, a camisa no quadro, a peça na redoma; na vitrine, gasta menos.'
    ],
    correcoes: [
      'Comprar na feira o "filhote de macaco-prego" (ou o sagui) registrava um papagaio: o texto, o resumo do ano, a casa e o desenho agora falam do mesmo bicho.',
      'Os objetos não ficam mais enfileirados no chão nem flutuando: o que é de parede vai para a parede, e o que não cabe à vista não é espremido.'
    ]
  },
  {
    versao: '12.7',
    data: '2026-11-01',
    titulo: 'Imersão e personalização: a roupa escolhida é a vestida, a casa com prévia e catálogo inteiro, moda de luxo de verdade',
    novidades: [
      'A casa por dentro: reforme com prévia — escolha piso, paredes, luz, rodapé e cortina, veja o cômodo mudar na hora, compare com como está, volte ao que estava ou ao acabamento original do imóvel, e só pague ao confirmar (o custo de cada item e o total aparecem antes). A luz regulável tem temperatura (quente, neutra, fria) e intensidade.',
      'Muito mais acabamentos, do básico ao exclusivo: 20 pisos (taco em espinha de peixe, carvalho de tábua larga, ladrilho hidráulico, travertino, granito, carpete de lã, mármore Nero Marquina e Calacatta, parquet Versailles…), 35 paredes (tintas, papéis listrado, geométrico e damasco, azulejo metrô, ripado, lambri, pedra, cimento queimado, boiserie, tecido, folha de ouro), 14 luzes (pendentes, trilho, fita de LED, arandelas, lustre, lustre de cristal, projeto luminotécnico), rodapés e molduras, cortinas e persianas.',
      'Uma loja para cada cômodo: mais de 90 objetos novos — sala, cozinha (geladeiras, fogões, adega, cafeteira, ilha, armários), quartos e quarto de hóspedes, banheiro (banheiras, ducha, bancada de mármore, sauna), piscina (espreguiçadeiras, ombrelone, luz subaquática, aquecimento, cascata), jardim (churrasqueira, espaço gourmet, forno de pizza, pergolado, gazebo, fonte), lazer (bilhar, pebolim, fliperama, cinema), garagem (ferramentas, carregador de carro elétrico) e escritório — cada um com o seu desenho, do básico ao exclusivo.',
      'Lojas de roupa em catálogo: cada peça com o desenho dela em você, a marca, o preço, o segmento (básico, intermediário, premium, luxo, alto luxo, exclusivo), a coleção e a edição; experimente no provador antes de comprar. A roupa se procura pelo tipo de peça: casacos, blusas, vestidos, calças, saias, shorts, sociais, esportivas, calçados e acessórios.',
      'Moda de luxo de verdade: alta-costura sob medida, terno de vicunha, jaqueta e casaco de grife, sapato bespoke, tênis de série numerada, óculos de titânio e ouro, Panamá superfino, relógio de alta relojoaria e alta joalheria — de dezenas a centenas de milhares.',
      'Tatuagens: a história de cada uma (feita, cada retoque com a data, o laser, a cobertura) e o significado que muda com a vida — a tinta fica. No estúdio, um botão para voltar a posição, o tamanho e a rotação ao que o tatuador propôs.'
    ],
    melhorias: [
      '"O que você está usando" virou um guarda-roupa em cartões: a peça desenhada, a parte do corpo, a marca, trocar por outra sua e tirar.',
      'O "Agora" se renova: o destaque do ano é só do que aconteceu neste ano, e os últimos anos são anos de calendário — o título de dois anos atrás vai para a Biografia e a Retrospectiva.',
      'Os acontecimentos de dinheiro leem a sua situação de verdade: o milionário não recebe mais "o dinheiro do mês acabou"; quem tem patrimônio preso em bens tem um aperto próprio.',
      'O trabalho fala a língua de cada lugar: a conversa do aumento acontece no salão, no plantão, na escola, no canteiro, na garagem; o sim, o não e o "como vai o trabalho" mudam com a profissão.',
      'O caso escondido: terminar depende do que ele foi (rápido, de anos, combinado, com quem não aceita), a conversa sobre o futuro não repete a mesma frase e dá para mandar um carinho (que pode deixar rastro).'
    ],
    correcoes: [
      'Escolher uma peça (óculos, camisa, vestido, casaco…) às vezes vestia outra do mesmo tipo — e cortar o cabelo podia trocar a roupa. Agora a peça escolhida é a vestida, uma por lugar do corpo; saves antigos são corrigidos ao abrir.',
      'Brincos aparecem no retrato, cada modelo com a sua forma.'
    ]
  },
  {
    versao: '12.6',
    data: '2026-11-01',
    titulo: 'Profundidade, personalização e imersão: o estúdio de tatuagem inteiro, pessoas com jeito e memória, trabalho e casa com história',
    novidades: [
      'Estúdio de tatuagem novo (Você · Aparência): escolha o lugar tocando no próprio corpo — ombro, bíceps, tríceps, antebraço por dentro e por fora, pulso, mão, dedos, peitoral, centro do peito, costela, abdômen, as costas em três partes, coxa, joelho, canela, panturrilha, tornozelo, pé, pescoço, nuca —, de frente e de costas, lado esquerdo ou direito. Várias tatuagens no mesmo braço, cada uma no seu lugar.',
      'Mais de 80 desenhos em 13 estilos (realista, old school, blackwork, tribal, geométrico, oriental, minimalista, fine line, lettering com o seu texto, ornamental, floral, simbólico, abstrato) e peças inteiras. Ajuste o tamanho, a posição, a rotação, o espelhamento, a cor (só preto, preto e cinza ou colorida, com tons e paletas) e a intensidade, com a prévia na lupa antes de confirmar.',
      'Projetos: manga fechada, meia manga, peito, costas e perna fechados, com vários desenhos unidos por um fundo — o que você já tem na parte entra no conjunto. A tinta desbota devagar com os anos; dá para retocar, cobrir uma tatuagem antiga com outra e tirar no laser. Cada tatuagem guarda a data, o lugar e o significado (por quem, por quê).',
      'As pessoas têm jeito e memória: tímidas, carinhosas, ciumentas, de pavio curto, pacientes, rancorosas... — e isso muda o que dá certo com elas. Elas lembram da ajuda, do presente, da briga, da promessa e da traição; quem foi traído não aceita convite antes de uma conversa. Os gostos em comum aproximam.',
      'Conhecer a família de quem você namora depende de quem é a família (os pais vivos ou não, o jeito deles, a distância, o tempo de namoro). O caso escondido ganhou encontros, presentes, viagens com desculpa, a conversa sobre o futuro e o tempo — e tudo deixa rastro.',
      'Trabalho: profissões que só viviam cenas de escritório ganharam as suas (limpeza, cuidado, motorista, posto, costura, confeitaria, reciclagem, serviço público, fiscalização, veterinária, educação física, pesquisa, salão). O chefe tem um jeito (exigente, compreensivo, injusto, incentivador, autoritário, desorganizado), há disputa de vaga com um colega e uma reputação profissional que acompanha você de emprego em emprego.',
      'Hobbies novos com caminho: cuidar de plantas, pintar, artesanato (que pode virar uma banca na feira), colecionar e clube do livro. Em casa: faxina, organizar, descansar, maratonar uma série, cuidar das plantas, consertar o que quebrou, receber visita, cozinhar a comida da semana — e o hábito de arrumar a casa.',
      'A vida devolve: a reunião da família inteira, os 80 anos de um dos pais, ensinar um neto, o favor devolvido por quem você ajudou, o reencontro depois de anos, a tatuagem com o nome de um ex, a promessa cobrada — e acontecimentos raros que só chegam a quem tem o perfil. Viagens com história própria e o marco da primeira viagem sozinho.'
    ],
    melhorias: [
      'O álbum da Retrospectiva mostra quem estava em cada momento, com a idade que tinha naquele dia.',
      'No celular, o cabeçalho das áreas ocupa bem menos espaço antes do conteúdo.',
      'Atalhos: a estrela guarda as ações que você faz sempre (com as pessoas e em casa) no painel de agora. No Menu, os últimos avisos.',
      'O pequeno negócio que dá lucro não é mais empurrado para fechar só por ter pouca clientela; a freguesia fiel segura os anos ruins; concorrentes aparecem.',
      'O tênis profissional de quem está começando tem mais acontecimentos.'
    ],
    correcoes: [
      'A chefia nova passa a valer na equipe (antes, a antiga podia continuar aparecendo como chefe).',
      'Cenas de escritório (relatório, diretoria) não aparecem mais para quem não trabalha em escritório; o cliente furioso no balcão não aparece mais para quem trabalha nos bastidores.',
      'As tatuagens de antes continuam no corpo, cada uma numa região precisa, sem ficarem umas por cima das outras.'
    ]
  },
  {
    versao: '12.5',
    data: '2026-11-01',
    titulo: 'Polimento e imersão: a Retrospectiva da Vida, lojas com cara própria e carreiras mais vivas',
    novidades: [
      'Retrospectiva da Vida (História · Retrospectiva): a linha do tempo da vida inteira e um álbum de memórias — o nascimento, a escola, as formaturas, o primeiro emprego, os amores, o casamento, os filhos, as viagens, a casa própria, os títulos, as eleições e o que mais marcou —, cada uma com a idade e o ano. Os momentos marcantes ganham destaque; dá para filtrar por categoria. Tudo vem do que a vida registrou: nada é inventado. Também no fim da vida.',
      'O estúdio de tatuagem ganhou uma lupa: abre na parte do corpo escolhida (o peito com os ombros, o braço inteiro, as costas, a perna, o pescoço), aproxima e afasta, volta ao corpo inteiro e troca de frente para costas — com as outras tatuagens no lugar.',
      'As lojas têm prédio próprio: a moda com manequins e arara, a sapataria, a ótica com a parede de armações, a de acessórios, a de móveis com a sala montada, a rua das grifes — e cada grande loja com a sua arquitetura (El Corte Inglés, Galeries Lafayette, Rinascente, Coin, C&A, Renner, Macy\'s, Isetan e as outras).',
      'Carreiras com mais acontecimentos: cenas novas para tênis, vôlei, atletismo, basquete, medicina, vida acadêmica, música, negócio próprio, polícia, escritório e obra/elétrica.'
    ],
    melhorias: [
      'Indicações de trabalho fazem sentido para quem recebe: nada de vaga muito abaixo da sua carreira; colegas de profissão passam a indicar; quem está empregado também pode ser lembrado para a vaga de cima, ou para uma sociedade com alguém da área; as frases variam e a mesma pessoa não repete a oferta todo ano.',
      'A temporada do atleta não perde mais a sua cena por causa da renovação de contrato.',
      'A festa de quinze anos e a solidão na velhice voltaram a acontecer; quem desiste da carteira de motorista espera um ano antes de tentar de novo.'
    ],
    correcoes: [
      'Avós não têm mais 12 anos no nascimento dos tios; o irmão mais velho respeita a idade do pai.',
      'Não dá mais para vender ou dar a alguém o que está emprestado a outra pessoa.',
      'O carro vendido, roubado ou retomado deixa de ser o veículo do dia a dia; a venda "como está" não deixa a conta negativa.',
      'A convocação ao serviço militar entra na Linha da Vida, e o emprego guardado termina na data certa.',
      'Quem trabalha por conta própria, no clube ou no palco não recebe mais notícias de "reorganização com demissões em outros andares".',
      'Discos lançados no mesmo ano não saem mais com o mesmo título; a contagem de cidades no fim da vida inclui as mudanças para o exterior.'
    ]
  },
  {
    versao: '12.4.2',
    data: '2026-11-01',
    titulo: 'Futebol mais completo, tatuagens, cômodos com profundidade e uma aba Compras organizada',
    novidades: [
      'Futebol: a tabela de classificação de verdade — pontos, jogos, vitórias, empates, derrotas, gols marcados e sofridos, saldo — com os critérios de desempate, as vagas continentais e a zona de queda. A sua temporada mostra a linha do seu clube.',
      'Os campeões de cada ano: a liga, a copa nacional e a continental, temporada por temporada.',
      'Prêmios individuais do futebol: Bola de Ouro, The Best FIFA, Chuteira de Ouro e Golden Boy (Golden Girl no futebol feminino), disputados com jogadores do mundo do jogo que envelhecem, trocam de clube e se aposentam. O pódio e a sua colocação ficam registrados, ano a ano, e cada prêmio tem o seu troféu na galeria.',
      'Tatuagens: escolha o desenho (tradicional, fine line, geométrica, tribal, floral, escrita, desenho artístico ou composições grandes), a parte do corpo e o lado; veja como fica de frente e de costas; faça várias; tire no laser. Elas aparecem no corpo, sob a roupa, e envelhecem com você.',
      'Compras: uma busca por produto, marca ou loja em todas as lojas de uma vez, com filtros de categoria, marca e preço e a ordem por relevância, menor ou maior preço — comparando as ofertas antes de comprar. A aba agora começa pelos segmentos: moda, tecnologia, casa, cultura e lazer, veículos, luxo e coleção, onde morar, serviços.'
    ],
    melhorias: [
      'O corpo inteiro ficou mais legível: contorno na pele e nos membros, e um fundo que sempre contrasta com a pele (a pele clara não some mais no fundo claro).',
      'Cada modelo se reconhece: os óculos Juliet (lente espelhada que abraça o rosto), o aviador, o de grife, o escuro clássico e os de grau; o boné de aba reta, o chapéu de palha, o chapéu de couro e o turbante; a camisa de time com gola, escudo, patrocínio e as listras ou as mangas de contraste.',
      'Os cômodos ganharam profundidade: paredes laterais, teto e piso em perspectiva, rodapé, a luz da janela no chão, sombras — e os móveis grandes encostados na parede do fundo.',
      'Dentro de cada loja: busca, filtro de marca e de preço, e a ordem. A aba Compras e cada loja lembram onde você estava (o segmento, a busca, os filtros) ao comprar, fechar e voltar.',
      'A relojoaria e a joalheria de coleção agora se chamam "Relojoaria de coleção" e "Alta joalheria", para não se confundirem com as lojas do dia a dia.'
    ],
    correcoes: [
      'Os títulos pela seleção (Copa do Mundo, Copa América, Eurocopa…) agora aparecem na galeria de conquistas.'
    ]
  },
  {
    versao: '12.4.1',
    data: '2026-10-31',
    titulo: 'Expansão da vida personalizada: o corpo inteiro, as lojas, os cômodos e as fases da vida',
    novidades: [
      'Aparência de corpo inteiro: cabeça, tronco, braços, pernas e pés, com o tipo de corpo que vem do seu condicionamento, dos hábitos e do que você pratica (magro, mediano, atlético, musculoso, acima do peso) — e muda com a vida.',
      'Troque peça por peça: na cabeça, no rosto, a parte de cima, a de baixo, por cima, nos pés, o relógio, a pulseira, o anel, o pescoço e as orelhas. A peça que sai fica guardada. Corrente e brincos vão juntos.',
      'Roupas que se distinguem pela forma: camisa com colarinho e botões, polo, moletom com capuz, listrado, xadrez, camisa de time, vestidos, saias, short, legging, jaquetas, blazer, sobretudo, e calçados de cada tipo. Novas peças, pulseiras e anéis.',
      'As lojas foram refeitas: lojas especializadas (roupas, sapataria, ótica, acessórios, relojoaria, joalheria, grifes, eletrônicos, eletrodomésticos, móveis, instrumentos, esportes, livraria), as grandes lojas de departamento de cada país e o comércio online internacional. Marcas reais e fictícias, conforme o país: quem mora na Itália encontra o mercado italiano.',
      'Cada cômodo da casa tem a sua cena: a cor ou o tijolo da parede, o piso, a luz e os objetos que estão nele.',
      'Novos acontecimentos por fase: a feira de ciências na infância; o intercâmbio, a banda de garagem e a primeira viagem sem os adultos na adolescência; e um fluxo próprio da vida adulta (a casa que esvazia, os dez anos de casados, o filho que pede ajuda com o apartamento, a goteira, os anos no mesmo emprego, a vizinhança nova).',
      'Casamento ao ar livre: escolha o lugar (sítio, jardim ou praia) — o resumo diz só o que foi escolhido.'
    ],
    melhorias: [
      'Você: os gostos e a vida cultural saíram de Aparência e ganharam a parte "Gostos e cultura".',
      'Dinheiro: "Para gastar agora" aparece separado do patrimônio. Ao comprar um imóvel, o resultado diz quanto foi pago e quanto sobrou.',
      'Na casa, "Deixar a casa com a sua cara" saiu (a personalização é cômodo a cômodo); a reforma ficou, para consertar e renovar o imóvel.'
    ],
    correcoes: [
      'Comprar numa loja não faz mais a lista subir: a posição, a seção e os filtros continuam onde estavam.',
      'Natação e futebol: o adulto que pratica não desaprende (a idade cobrava a cada treino); a aula de natação conta o tempo que tem; a equipe não custa menos que a aula; a criança do projeto social não paga; a oferta de cada cidade muda de verdade de três em três anos.'
    ]
  },
  {
    versao: '12.4',
    data: '2026-10-31',
    titulo: 'Vida personalizada: a casa por dentro, os veículos, os objetos, a roupa e os gostos',
    novidades: [
      'A casa por dentro: cada tipo de moradia tem a sua planta (a kitnet é um cômodo só; a mansão tem piscina, jardim, escritório). Os cômodos mostram o que você de fato tem dentro deles.',
      'Personalize a casa: piso, cor das paredes e iluminação por cômodo; transforme um quarto que sobra em escritório, estúdio, academia, ateliê, biblioteca ou sala de cinema; construa no terreno (piscina, edícula, área de lazer). De aluguel, só o que não é obra.',
      'O conforto da casa sai do que ela é e do que tem dentro — nunca do saldo da conta — e diz de onde vem. O estúdio com instrumento, a academia com aparelho e a biblioteca com livros ajudam a prática.',
      'Cada objeto tem um lugar: em casa, noutra propriedade sua, num depósito ou no cofre do banco. Guardar, levar (com frete), emprestar, pedir de volta, dar de presente, dar um nome, repaginar o móvel, expor uma obra na parede.',
      'Os objetos guardam história: de onde vieram, quem deu, o que aconteceu com eles. O valor afetivo é outro, separado do de mercado; o que tem história vira lembrança quando para de funcionar.',
      'Veículos personalizáveis por categoria — aparência (pintura, rodas, interior) separada da mecânica (pneus, freios, suspensão, motor), com efeito no desgaste, no custo e na revenda. Barcos, aviões e motos têm peças próprias. Novos: iate e helicóptero.',
      'Guarda-roupa por peças e por estilo — do casual ao streetwear, do baile ao rock, do regional ao afro-brasileiro, sem amarrar estilo a bairro ou renda — e a roupa de cada ocasião, só se quiser.',
      'Música e arte: o gosto nasce da casa e muda com as pessoas, a idade e a prática. Monte a playlist do ano, vá a shows, rodas de samba, bailes, forrós, concertos e exposições (sozinho ou com alguém), e produza obras suas.',
      'Novos objetos: cavaquinho, pandeiro, sanfona, saxofone, controladora de DJ, home studio, toca-discos e discos de vinil, cavalete, torno de cerâmica, mesa de jantar, poltrona, projetor, mesa de sinuca e mais.'
    ],
    melhorias: [
      'Na herança, as peças de coleção marcadas como de família passam em espécie (com a história), em vez de irem a leilão; os objetos pessoais com história e os relógios e joias ficam com quem continua.',
      'Patrimônio · Objetos tem dois modos: Usar (como antes) e Organizar (busca, filtros por tipo e lugar, ordem por valor de mercado ou afetivo).',
      'A loja de roupas filtra por estilo; a revisão do veículo entra no histórico de manutenção.',
      'Na entrevista de empregos formais, a roupa adequada ajuda um pouco e a que destoa atrapalha um pouco; quem não liga para roupa não perde nada.'
    ],
    correcoes: [
      'O que está guardado fora de casa (ou emprestado) não ajuda mais a prática nem conta como conforto.',
      'Carros além das vagas da casa pagam vaga alugada.'
    ]
  },
  {
    versao: '12.35',
    data: '2026-10-31',
    titulo: 'Submundo vivo: conflitos, operações, poder e a vida em casa',
    novidades: [
      'A guerra entre organizações vira situação: a disputa por um pedaço, a retaliação, a emboscada, o recado, o aliado que pede ajuda. Quem está embaixo vai, fica de fora, protege os seus ou questiona a ordem; quem manda retalia, intimida, negocia ou recua — e o resultado muda território, gente do quadro, lealdade, o corpo e a família.',
      'A operação policial contra a sua organização chega a você: o contato que é levado (e pode falar), a investigação, a busca na sua casa — com dinheiro levado e bens bloqueados — e a decisão do que fazer.',
      'Perseguições depois de um trabalho que deu errado: fugir, pedir ajuda, entregar-se ou enfrentar, cada uma com chance e consequência. Ferimentos sérios são internação, pela rede de saúde do país; a morte é rara, e real.',
      'Quem manda pode deixar de mandar: o apoio ao comando é medido, alguém ambicioso pode contestar — e sem apoio nenhum o comando cai. Quem responde a você tem lealdade e ambição, e lembra do que você faz (promover, cobrar, pagar a defesa, afastar).',
      'Traições com motivo (o preso que fala, quem vai para a rival) e boatos que podem ser falsos: a fonte tem credibilidade, e agir sobre um boato errado também custa.',
      'Cada organização tem um jeito (territorial, de negócios, agressiva, discreta, hierárquica, fragmentada) que muda como briga, paga, negocia e atrai a polícia. E o mundo do crime segue sem você.',
      'Oportunidades que aparecem e somem (a rival fraca, a procura em alta, um espaço vazio, um cliente fixo), com o que pagam, a chance e o risco ditos antes; a procura de cada cidade muda com o mundo; o seu nome é de um lugar.',
      'Em casa: o par que não aceita mais pode ir embora; a promessa de sair é cobrada; os filhos lembram de quem não estava. Quem sai tem um recomeço com passos (o trabalho, a família, os contatos de antes).'
    ],
    melhorias: [
      'A Justiça bloqueia e confisca também veículos e imóveis comprados com o que entrou por fora — nunca o que é do casal, herdado ou a casa da família; a absolvição devolve.',
      'Mais tipos de trabalho em cada ramo, diferentes no que pagam, na chance e no rastro; os de posto só chegam a quem tem o posto. O resumo do ano por fora conta o que de fato marcou o ano.',
      'Os pedidos por fora mostram o preço, a chance de dar em nada e o risco antes de pedir; dá para cobrar quem sumiu com o dinheiro.',
      'O painel de comando mostra só o que o seu posto permite agora, e diz o que o próximo posto abre.'
    ],
    correcoes: [
      'O "intermediário" dos pedidos por fora não é mais um parente: é alguém de fora da família, e a tela diz quem é e por que conhece quem faz.',
      'As provas usam uma escala só: um pedido isolado não pesa mais que uma carreira exposta.',
      'Contatos tratados pelo gênero deles nos textos.',
      'Depois de mudar de cidade ou de país, os contatos antigos continuam — mas não trazem trabalho de onde não alcançam.',
      'Um posto só na organização (antes, o ramo e a organização tinham dois "pedir para subir").',
      'O "favor que fura a fila" virou infração leve; o golpe descoberto é narrado como tentativa; o texto não promete processo que não vem.'
    ]
  },
  {
    versao: '12.3',
    data: '2026-10-30',
    titulo: 'Submundo profundo, Justiça com rostos e carreiras com gente',
    novidades: [
      'As mensagens do Submundo contam o que aconteceu de verdade: quem propôs, o que já houve entre vocês, o seu lugar no trabalho (do mais novo a quem só manda os seus), como cada pessoa reage pelo jeito dela — e, embaixo, o que mudou em números (dinheiro, confiança, posto, exposição).',
      'Trabalhos que dão certo pela metade, ou melhor que o combinado; e, todo ano, uma linha com o que o caminho por fora rendeu, quantos trabalhos, com quem.',
      'Juízes, promotores, advogados e defensores com nome e história: na mesma cidade, o mesmo juiz pode voltar — e lembrar.',
      'É possível tentar influenciar um processo por fora (ilegal, e dito assim): quem julga pode recusar, denunciar, aceitar e entregar pouco, ou aceitar — sem garantia de absolvição — e tudo pode vir à tona anos depois.',
      'A Justiça não conhece todo o seu dinheiro: bloqueia e confisca pelo que as provas mostram. "Pôr o dinheiro em ordem" é possível — e não protege por inteiro.',
      'Ser de mais de uma organização (até em segredo), as relações entre elas que mudam sozinhas (aliança, concorrência, rivalidade, trégua, conflito, ruptura), tréguas e negócios negociados por quem comanda, rachas que fundam organizações novas, e vínculos que continuam à distância quando você muda de cidade ou de país.',
      'Pedidos por fora para quem leva vida legal (sem virar do meio), sempre com a saída legal ao lado; e o mercado por fora agora mora no Submundo.',
      'Cada emprego tem a sua gente: a chefia, os colegas, quem responde a você, às vezes um mentor e um rival — que mudam com os anos. Conflito no trabalho se resolve conversando, negociando, no RH, com transferência, sindicato ou pedindo demissão.',
      'Concursos com edital de verdade: vagas, inscritos, classificação, cadastro reserva e convocação pela fila — e os editais que não cabem no seu perfil aparecem com o requisito que falta.',
      'Novos acontecimentos na infância, na família, na escola, em casa, no dinheiro, na saúde e na cidade — alguns lembram o que aconteceu anos antes.'
    ],
    melhorias: [
      'As decisões do processo dizem quem defende, quem paga e quem julga.',
      'O que cada posto de uma organização permite fica dito na ficha dela.'
    ],
    correcoes: [
      '"A primeira palavra" (e os outros marcos de uma vez só) não se repete mais para a mesma criança — nem quando ela passa a ser jogada.',
      'O noivado não vira casamento sozinho: dá para adiar o casamento ou desfazer o noivado.',
      'Contratar advogado particular aparece sempre que a defesa é pública (com o preço e o motivo quando falta dinheiro); o jogo não paga advogado por você, e a defesa narrada é a escolhida.',
      'As provas de um processo do Submundo passaram a sair do quanto se sabia de você antes do processo (antes, começavam sempre fracas).'
    ]
  },
  {
    versao: '12.25',
    data: '2026-10-25',
    titulo: 'Submundo vivo, carreira criminal e Justiça',
    novidades: [
      'O Submundo virou uma carreira: patamares (do começo à grande escala), marcos, especializações que rendem cada uma do seu jeito — e a vida reconhece quando o crime vira a ocupação principal.',
      'Encomendas: contatos, organizações e o próprio meio trazem propostas, com o pagamento, a chance e o risco ditos antes — aceitar, negociar ou recusar. E dá para encomendar trabalho a alguém de confiança: paga-se adiantado, o resultado chega um ano depois.',
      'Cada contato agora é gente: conversar, pedir e fazer favores, cobrar e acertar dívidas, propor trabalho, pedir apresentações, chamar para a sua organização, encerrar a parceria — e eles respondem, recusam, voltam com outra proposta, cobram, mudam de lado e fazem as pazes.',
      'As organizações existem sem você: facções, famílias, redes, círculos e coletivos fictícios, com hierarquia própria, força, união, pressão da Justiça, lideranças que envelhecem, são presas ou perdem apoio — e disputas de comando em que dá para apoiar alguém, ficar de fora ou disputar.',
      'Território: a presença de cada organização nas regiões da cidade, e a voz de quem mora lá (moradores e comércio) pesando contra quem quer mandar.',
      'A Justiça em etapas (suspeita, investigação, processo, julgamento, sentença, recurso, cumprimento), com estratégia de defesa, audiência, recurso de qualquer condenação — e o mandado de quem falta: a vida de procurado, com mudança de endereço, abrigo e a opção de se apresentar.',
      'A família reage do seu jeito: quem desconfia, quem descobre, quem apoia, quem não aceita, quem pede que você saia — e quem volta depois que você sai.',
      'Sair aos poucos, sem porta batida; o passado que volta a ligar; e, para quem herda o nome da família, um convite — nunca um cargo.'
    ],
    melhorias: [
      'O Submundo também ocupa a semana (os encontros, a organização, os negócios), e o que se faz no ano tem limite de tempo.',
      'Na prisão, dá para escrever para a família e cuidar da saúde.',
      'Dar errado nem sempre é só prejuízo: às vezes ensina, rende um contato, uma dívida, um conflito ou uma nova chance.',
      'Responder a um processo não encerra mais o caminho sozinho: quem responde fica na moita e decide o resto.',
      'Quem comanda delega: a exposição pessoal de quem está no alto de uma organização é menor — e a organização protege e banca a defesa de quem é leal a ela.'
    ],
    correcoes: [
      'A tela do Submundo não mostra mais a introdução para iniciantes a quem já tem anos de história: é uma tela só, organizada em partes.',
      'O dinheiro do crime aparece no extrato do ano numa linha própria ("Por fora"), separado por origem — antes, ia para "Acontecimentos do ano" ou para "Compras".',
      'A pergunta "O que está virando isso" não aparece mais todo ano: só quando algo importante acontece, e o rumo também pode ser escolhido na tela.',
      'O patrimônio no Dinheiro compara com dois anos atrás, dizendo o período (a seta não contradiz mais o valor ao lado).',
      'Aceitar um trabalho grande não leva mais a exposição ao máximo de uma vez só.'
    ]
  },
  {
    versao: '12.2',
    data: '2026-10-25',
    titulo: 'Negócios vivos, luxo e mercados paralelos',
    novidades: [
      'Cada empresa é um negócio diferente por dentro: o restaurante tem conceito, cozinha, insumo, fornecedor, chef, pratos da casa e a nota que o público dá; o hotel tem estrelas, público, serviços, atendimento e estratégia de temporada; a clínica, especialidades e inspeção sanitária; a academia, modalidades e retenção; o estúdio, serviços, técnico de som e créditos; a loja, segmento, estoque e fornecedor.',
      'O museu tem obras com nome, laudo e conservação, exposições temáticas, curadoria, segurança, patrocínio e empréstimos; o zoológico tem cada animal com nome e idade, recintos por habitat com vagas, alimentação, veterinários, programa educativo — e só recebe a espécie que tem onde viver bem.',
      'Quem contrata um gestor pode deixar o dia a dia com ele (o bom acerta, o fraco descuida); quem tem várias empresas vê todas numa tabela, com o que pede atenção.',
      'Luxo de verdade para quem tem fortuna: relógios de grande complicação, alta joalheria, mestres modernistas, manuscritos — em venda privada, sob consulta — e o leilão especial das peças históricas e únicas (uma de cada no mundo, com a lista de donos).',
      'Colecionar ficou mais fundo: avaliar, autenticar, restaurar (com o risco de exagerar), emprestar a museus, receber propostas de colecionadores; filtros por preço, categoria e raridade.',
      'Animais exóticos numa loja especializada, conforme a lei de cada país (e estado): cada espécie pede a sua instalação, veterinário que a conheça e cuidado — ou alguém pago para cuidar.',
      'Mercados de procedência duvidosa: a feira, o antiquário dos papéis vagos, a negociação privada e, para quem tem gente no caminho, o mercado por fora — investigar, comprar, recusar ou denunciar.',
      'No Submundo: negócios por fora próprios (com sócios, rival, apreensão), empresa de fachada (e o que isso custa para ela e para a família), a própria organização (tenentes, alianças, traições que não se esquecem).'
    ],
    melhorias: [
      'As lojas de luxo e coleção ganharam fachadas próprias (a relojoaria não é mais a ótica; a galeria não é a livraria; o antiquário não é a loja de casa).',
      'A gestão própria de um negócio complexo (hotel, zoológico, clínica, museu) pede mais do que as horas vagas; restaurante bem tocado pode dar muito certo — ou não.'
    ],
    correcoes: [
      'Patrimônio · Objetos mostra o que você comprou para usar (roupas, óculos, relógios, joias) — antes ficava vazio; depois de uma compra, "Ver no patrimônio" leva até lá.'
    ]
  },
  {
    versao: '12',
    data: '2026-10-24',
    titulo: 'Patrimônio, consumo e negócios',
    novidades: [
      'Patrimônio em partes: o resumo separa o que está na conta, o investido, os imóveis, os veículos, a coleção e as empresas — e diz o que dá para usar agora (ter não é poder pagar), o que o patrimônio rende e custa por mês, e como ele andou ano a ano.',
      'Empresas sem largar a profissão: restaurante, clínica, academia, estúdio, hotel, loja, museu e zoológico — cada um com o seu jeito de ganhar e de quebrar. Dá para abrir sozinho ou com sócio, contratar quem toque (ou tocar nas noites e sábados), reformar, expandir, mudar o preço, distribuir o lucro, vender ou fechar; e comprar uma parte como investidor.',
      'O museu vive de acervo, conservação, exposições e patrocínio (e pode expor peças da sua coleção); o zoológico responde pelo bem-estar dos animais, tem fiscalização e programas de conservação.',
      'Coleção: relógios, joias, arte, antiguidades e memorabilia esportiva, com raridade e procedência. A loja fica com a margem; vender rápido rende menos que o leilão; o valor anda com o mercado — sem garantia. Quem foi peça central de um título guarda a camisa daquela final.',
      'A garagem de colecionador nas cidades grandes: superesportivos, carros de altíssimo luxo e clássicos (que podem valer mais com o tempo — ou não; restaurar é caro).',
      'Imóveis para investir: alugar com imobiliária (taxa, menos dor de cabeça) ou por conta própria (sem taxa, mais vacância e calote). O inquilino que para de pagar vira decisão.'
    ],
    melhorias: [
      'O preço de um imóvel agora conversa com o aluguel da cidade e do bairro: o rendimento muda com o mercado (capitais do Nordeste rendem mais; Londres e Zurique, menos), e a mansão afastada não vale mais que o apartamento de luxo no bairro nobre. Chegaram a cobertura e a mansão.',
      'Cada país tem o seu mercado de carros (a F-150 nos EUA, o Sandero na Europa, o Mobi no Brasil) e os preços de lá — um Corolla nos Estados Unidos custa o que custa lá.',
      'Antes de uma compra grande, a tela diz o custo por mês, o que muda já, os riscos e quanto o bem deve valer depois — sem prometer retorno.',
      'Imóvel vazio paga imposto e condomínio; aluguel recebido paga imposto; a coleção valiosa paga seguro.'
    ],
    correcoes: [
      'Mudar de país não vende mais os veículos: eles ficam guardados na cidade de antes — dá para vender de longe ou trazer (com frete e o imposto de lá, se o país deixar).',
      'O banco conta só parte do aluguel recebido como renda e não financia mais que dois imóveis ao mesmo tempo.',
      'Na herança, a coleção e as participações em empresas entram no inventário.'
    ]
  },
  {
    versao: '11.5',
    data: '2026-10-24',
    titulo: 'Carreiras, Submundo e vida em movimento',
    novidades: [
      'Um ano pode ter mais de uma decisão: as outras esperam a vez e aparecem uma depois da outra, sempre conferidas de novo — uma vida movimentada pede mais escolhas; uma vida mansa continua mansa.',
      'O Submundo tem frentes próprias (furtos e roubos, contrabando, crime organizado, crimes digitais, fraudes e corrupção), cada uma com prática, nome, ações, riscos e cenas — e gente com memória: contatos que confiam, cobram, se afastam e traem, e organizações que lembram.',
      'Cada carreira especial abre com o seu lugar: o campo (ou a quadra) do atleta, a prancheta do técnico, o set do ator, o palco do músico, o plenário do político e o dossiê do Submundo.',
      'A galeria de conquistas mostra cada título com o troféu da sua competição, os prêmios individuais, os títulos como técnico e os prêmios artísticos.',
      'Na política, alianças com gente de verdade (confiança e favores) e promessas com prazo, cobradas no fim — e lembradas na eleição.',
      'O técnico escolhe a estratégia do time (e ela muda os jogos); ex-goleiros podem virar treinadores de goleiros, da base à seleção.',
      'Basquete e vôlei têm as suas copas, no formato delas.',
      'Relações: o pedido de casamento é uma cena (onde, com que anel), um trio pode morar junto e dividir a casa, e dá para bloquear um ex.'
    ],
    melhorias: [
      'Os clubes têm fase: a boa temporada pesa na seguinte, e nenhum clube domina pelo nome.',
      'Os rivais do técnico são os clubes que estão na divisão, e o campeão do ano é o mesmo da tabela do país.',
      'Ator conhecido ficou mais raro; quem vive de música também ganha com aulas e gravações, e os anos bons e ruins continuam existindo.',
      'Uma gravidez de um caso: a parceria pode achar que é dela — e a dúvida só chega com causa.',
      'No celular, os botões, abas e links pequenos ganharam a área de toque de 44 px.'
    ],
    correcoes: [
      'Títulos, copas e prêmios ficam com o ano da temporada também na biografia.',
      'Quem tem dinheiro para acertar uma conta atrasada não aparece mais "no vermelho": o painel diz a pendência e que acertar resolve.'
    ]
  },
  {
    versao: '11',
    data: '2026-10-24',
    titulo: 'Carreiras vivas',
    novidades: [
      'No futebol, as copas nacionais e continentais e os torneios de seleções são jogados fase a fase, com o nome de cada competição conforme o país.',
      'Cada posição tem atributos próprios (o goleiro tem reflexos e saídas; o atacante, finalização e movimentação) que pesam na nota e na temporada.',
      'A comissão técnica tem clube de verdade e um ofício próprio: licenças de treinador, análise tática, elenco e diretoria.',
      'No mandato, cada cargo tem as suas ações (projeto de lei, fiscalização, orçamento, veto) com efeitos na aprovação e no desgaste.',
      'Dá para fazer amizades em qualquer estado civil, combinar uma relação aberta ou poliamor e falar com ex-parceiros (que podem não responder).',
      'O casamento tem noivado e planejamento: lugar, cerimônia, convidados, estilo, orçamento, a opinião da outra pessoa e a lua de mel.',
      'Publicar nas redes é feito em passos, e a moderação sempre diz o motivo: advertência, suspensão, banimento e recurso.'
    ],
    melhorias: [
      'O atleta, o técnico e o artista sem contrato continuam na própria carreira, em Trabalho — nunca mais com o antigo clube como se fosse o atual.',
      'Indicações de conhecidos levam em conta a sua carreira; uma vaga de outra área é dita como mudança de carreira, e a vida pergunta antes.',
      'A colocação do seu clube sai da mesma tabela do campeonato, e o que você joga conta; o goleiro fica sem sofrer gol quando o time não sofre.',
      'Ator e músico crescem aos poucos: testes mais disputados, crítica e público separados, direitos das obras lançadas e sucessos grandes raros.',
      'Os momentos da carreira aparecem agrupados por carreira e lembram o que já aconteceu (o ex-clube, o título, o atrito antigo).',
      'A agenda segue cada ofício (treino e jogo, ensaio e show, plantão), e o cuidado com bichos e filhos procura um horário livre.',
      'A felicidade conta as conquistas recentes, e mudanças de país seguidas não pesam como se fossem todas novas.'
    ],
    correcoes: [
      'Uma lembrança antiga não contradiz mais o que veio depois (o sonho que se realizou não é tratado como abandonado).',
      'Euro para euro não perde mais na conversão, e as luvas entram depois da mudança de país.',
      'O noivado não fica mais pendurado depois do casamento ou do término; quem tem dinheiro não recebe a festa parcelada.',
      'Cancelar o plano de saúde ou largar a terapia agora diz o que acontece com o tratamento; a criança pede a bicicleta a quem cuida dela.'
    ]
  },
  {
    versao: '10.6',
    data: '2026-10-22',
    titulo: 'Uma vida ao seu alcance',
    novidades: [
      'Caminhos · Estudos abre com "Minha formação" e as ações principais: entrar na faculdade, fazer cursos, bolsas e auxílios, histórico acadêmico.',
      'Entrar na faculdade tem passos próprios: escolher o curso (com o que pede, quanto custa e quanto dura), candidatar-se, ver o resultado e confirmar a matrícula.',
      'Os convites do painel "Portas abertas" abrem o próprio convite: quem chamou, o prazo, o que pede, o que muda — aceitar, deixar passar ou decidir depois.',
      'Crianças pedem aos responsáveis: para ir ao estádio ou ao cinema, e para comprar algo da loja (inteiro, ou completando o que há no cofrinho).',
      'Parar um tratamento médico agora tem risco dito antes e consequências conforme a condição; dá para retomar procurando atendimento.',
      'Esta janela de novidades — que também fica no Menu, com o histórico.'
    ],
    melhorias: [
      'Caminhos · Trabalho mostra logo no alto: procurar (ou mudar de) trabalho, candidaturas, minha carreira e outras possibilidades.',
      'Outros caminhos destaca a carreira já começada em "Em andamento"; Vida pública mostra as causas do desgaste e as respostas.',
      'O fim do ensino médio reconhece quem já tem carreira (atleta, trabalho de verdade) e oferece escolhas que cabem nela.',
      'Os treinos extras do atleta seguem a posição (o goleiro treina reflexos e saídas) e aparecem na temporada.',
      'A confiança de quem se acabou de conhecer aparece como "ainda se formando" — "abalada" só quando algo a abalou.'
    ],
    correcoes: [
      'A escola e o trabalho não ficam mais no mesmo horário: o conflito é impedido antes de aceitar e reconciliado nos saves antigos.',
      'A mesma carreira artística não aparece mais duas vezes (principal e paralela) nem rende em dobro.',
      'Convites que passaram do prazo saem das portas abertas e ficam registrados.'
    ]
  }
];

export const VERSAO_ATUAL = NOTAS[0].versao;
const CHAVE = 'VIDA_NOVIDADES_VISTAS';

/**
 * Quem já jogava antes desta funcionalidade existir: algum dado do VIDA no navegador ANTES desta sessão (lido quando o
 * módulo carrega — antes de o jogo gravar qualquer coisa). Quem chega pela primeira vez não recebe notas de uma versão
 * que nunca conheceu.
 */
const jaJogava = (() => {
  try {
    for (let k = 0; k < localStorage.length; k++) { const x = localStorage.key(k); if (x && x.startsWith('VIDA_') && x !== CHAVE) return true; }
  } catch { /* sem armazenamento */ }
  return false;
})();

/** As notas desta versão devem abrir sozinhas? (uma vez por versão; nunca para quem chega agora) */
export function deveMostrarNovidades(): boolean {
  try {
    const vista = localStorage.getItem(CHAVE);
    if (vista === VERSAO_ATUAL) return false;
    if (vista === null && !jaJogava) { localStorage.setItem(CHAVE, VERSAO_ATUAL); return false; }
    return true;
  } catch { return false; }
}

export function marcarNovidadesVistas(): void {
  try { localStorage.setItem(CHAVE, VERSAO_ATUAL); } catch { /* sem armazenamento: tudo bem, aparece de novo */ }
}
