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
