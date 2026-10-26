import type { EspecialidadeMedica } from './dados/especialidades';
/**
 * O modelo de uma vida.
 *
 * Um único objeto `Vida` guarda tudo o que existe na partida. O motor recebe
 * uma vida e devolve outra; a interface só lê. Não há estado paralelo.
 *
 * TEMPO: `t` é um instante em meses absolutos (`ano * 12 + mês`, mês 0..11).
 * O jogador avança de aniversário em aniversário (12 meses), mas processos
 * — gestação, curso, candidatura, mudança — têm início e fim em meses e se
 * resolvem em ordem dentro do ano.
 */

export type Genero = 'masculino' | 'feminino' | 'nao_binario';
export type Classe = 'vulneravel' | 'trabalhadora' | 'media_baixa' | 'media' | 'alta';
export type Regiao = 'Norte' | 'Nordeste' | 'Centro-Oeste' | 'Sudeste' | 'Sul';

/* ------------------------------------------------------------------ Pessoas */

/**
 * Temperamento de um NPC, em eixos -1..1. Serve para compatibilidade e para
 * o texto descrever a pessoa de forma consistente ao longo dos anos.
 */
export interface Temperamento {
  extroversao: number;
  afabilidade: number;
  responsabilidade: number;
  abertura: number;
  estabilidade: number;
}

export interface Pessoa {
  id: string;
  nome: string;
  sobrenome: string;
  genero: Genero;
  tNasc: number;
  vivo: boolean;
  tMorte?: number;
  causaMorte?: string;
  temperamento: Temperamento;
  /** Rótulo do que a pessoa faz hoje ("professora", "estudante", "aposentado"). */
  ocupacao?: string;
  /** Ocupação de referência (catálogo), quando a pessoa tem uma — dá continuidade à carreira dela. */
  ocupacaoId?: string;
  /** Renda mensal líquida (0 quando não tem). Entra no domicílio se morar junto. */
  renda: number;
  /** Onde a pessoa mora. Distância pesa em toda relação. */
  municipioId: string;
  /** Gosto da pessoa por ter filhos — só importa para parceiros. */
  querFilhos?: 'sim' | 'nao' | 'talvez';
  /** Por quem a pessoa se interessa romanticamente. */
  atracao?: Atracao;
  /** Parceria atual da pessoa com alguém que NÃO é o jogador (ex.: os pais entre si). */
  parceiroId?: string;
  saude: number;
  visual?: Visual;
  /** Os traços de nascença, quando o visual mudou (cirurgia): é daqui que os filhos herdam (`identidade.geneticaDe`). */
  genes?: Genes;
  /** Faculdade em curso (filhos do jogador): quem paga e quando termina. */
  estudo?: { curso: string; paga: 'publica' | 'familia' | 'fies' | 'bolsa' | 'propria'; tFim: number; nivel?: 'tecnico' | 'superior' };
  /** Formou-se em (nome do curso). */
  formacao?: string;
  /** Pet: animal, não gente. Nunca conversa, nunca namora. As espécies e o que as distingue moram em `dados/animais`. */
  especie?: Especie;
  /** O que só um animal tem: de onde veio, de quem é, como está. */
  pet?: InfoPet;
  /** Pai e mãe (ids; `'eu'` é o jogador). Mantém a árvore da família coerente entre gerações. */
  genitores?: string[];
  /**
   * REWORK 11.5 · REL-21: quem RECONHECE a criança como filha (a parceria que acha que é o outro genitor), quando não é
   * quem está em `genitores` (a verdade biológica, que a herança lê). `origemSabida`: quem sabe a verdade.
   */
  reconhecidoPor?: string;
  origemSabida?: string[];
  /** Um momento difícil pelo qual a pessoa está passando (abre "estar junto" como ação). */
  aperto?: Aperto;
  /** REWORK 5 (mundo vivo): quantos filhos a pessoa teve fora da família do jogador (o amigo que virou pai). */
  nFilhos?: number;
  /** Vida própria simplificada (descendentes e quem importa): formação, trabalho, marcos. */
  vida?: VidaNpc;
  /** Gestação de uma pessoa que não é o jogador (filha, nora, genro...). */
  gestacao?: { tParto: number; outroId?: string; anunciada: boolean };
  /** Onde nasceu (descendentes nascidos depois da sucessão; os anteriores herdam a cidade da casa em que nasceram). */
  municipioNatal?: string;
  /** Nacionalidades (ausente: a do país onde nasceu — ou o Brasil, nas vidas anteriores ao mundo). */
  nacionalidades?: string[];
  /**
   * O que é DESTA pessoa (sucessão): o que guardou do próprio trabalho e o que
   * recebeu de herança. Não é dinheiro do protagonista — mas entra na conta
   * da família: o que sai de uma vida chega inteiro a outra (`sucessao`).
   */
  posses?: Posses;
  /**
   * Condições de saúde persistentes (crônicas) — do MESMO catálogo do
   * protagonista (`corpo.modeloCondicao`), só com o estado. Nascem, ganham
   * nome, são tratadas ou não, pesam na saúde e no risco de morte enquanto a
   * pessoa vive (`corpo.anoDeSaudeDaPessoa`); e viram `Condicao` 1:1 se ela
   * passar a ser jogada (`sucessao.continuarComo`). Ausente = ainda não
   * acompanhada (saves anteriores): a primeira leitura reconstrói pela idade.
   */
  condicoes?: CondicaoNpc[];
  /** REWORK 4: o que a pessoa ganhou de você (do catálogo das lojas, com a cor que veio): `sistemas/presentes`. */
  ganhou?: { coisaId: string; t: number; cor?: string; acabamento?: string }[];
  /**
   * REWORK 4: a ancestralidade (de onde vem a família, em proporções que somam 1) — `sistemas/identidade`. Nasce
   * do contexto populacional na primeira geração; depois, só dos pais. Migrar não muda; adotar não herda.
   */
  ancestralidade?: Record<string, number>;
  /** REWORK 4: a tradição de nomes da família, quando veio de outro lugar (um país com lista de nomes). */
  tradicao?: string;
}

/** Uma condição de saúde de quem não é o protagonista: o id do catálogo e o estado (sem textos, sem lesões). */
export interface CondicaoNpc {
  id: string;
  tInicio: number;
  /** Gravidade 1..3 (a do catálogo). */
  gravidade: number;
  /** Já tem nome no consultório? Sem nome, age sobre o corpo — e ninguém da família sabe. */
  diagnosticada: boolean;
  tDiagnostico?: number;
  /** Descoberta tarde (depois de anos de sinais): o tratamento rende menos. */
  tarde?: boolean;
  tratando: boolean;
}

/** O patrimônio de alguém que não é o protagonista (simplificado: dinheiro, bens, um negócio). */
export interface Posses {
  dinheiro: number;
  bens: Bem[];
  /** O negócio da família que passou a ser desta pessoa (o mesmo negócio, com a sua história). */
  negocio?: Negocio;
  /** De onde veio (herança de quem, as economias), em poucas linhas. */
  historia: { t: number; texto: string; valor: number }[];
}

/**
 * Espécies que podem morar com alguém no Brasil sem crime: as domésticas
 * (Portaria IBAMA 93/1998) e as silvestres só de criadouro autorizado, com
 * nota e marcação. A lista, a vida típica e o cuidado de cada uma moram em
 * `dados/animais`.
 */
export type Especie =
  | 'cachorro' | 'gato'
  | 'calopsita' | 'periquito' | 'canario' | 'papagaio'
  | 'hamster' | 'porquinho' | 'coelho' | 'chinchila'
  | 'peixe' | 'betta'
  | 'jabuti' | 'iguana'
  /** REWORK 12.2: os exóticos (a loja especializada, conforme a lei de cada país). */
  | 'arara' | 'furao' | 'ourico' | 'gecko' | 'dragao_barbudo' | 'piton_bola' | 'acara_disco' | 'peixe_palhaco';

/** Um animal da casa. Não é patrimônio: é alguém que mora junto e depende de cuidado. */
export interface InfoPet {
  porte: 'pequeno' | 'medio' | 'grande';
  /** Como chegou: abrigo, alguém que doou, ninhada, rua, criador (ou loja autorizada), já era da família. */
  origem: 'abrigo' | 'doacao' | 'ninhada' | 'rua' | 'criador' | 'familia' | 'loja' | 'ilegal';
  /** Silvestre de criadouro autorizado: veio com nota fiscal e marcação (anilha ou microchip). */
  documentado?: boolean;
  tChegada: number;
  /** Quem cuida: o jogador ou a família de origem (o cachorro da casa dos pais). */
  tutor: 'eu' | 'familia';
  /** Jeito, em poucas palavras ("tímida, gosta de colo"). */
  jeito: string;
  /** Doença em curso (sempre com ação possível: veterinário). */
  doenca?: { nome: string; desde: number; gravidade: 1 | 2 | 3; tratando: boolean; tratavel: boolean };
  /** Última ida ao veterinário. */
  tVeterinario?: number;
  /** Idade máxima que o corpo aguenta (derivada ao chegar, não aparece). */
  vidaMax: number;
  /** A semente do desenho (o id que tinha no abrigo): o bicho adotado é o mesmo que se viu na lista, não outro. */
  semente?: string;
  /** REWORK 12.2: alguém contratado cuida no dia a dia (viagem, trabalho puxado): custa por mês, tira o bicho da semana. */
  cuidador?: boolean;
  /** REWORK 12.2: a instalação em que vive (id em `financas.instalacoes`). */
  instalacao?: string;
  /** REWORK 12.2: fugiu (quando) — continua na história, não na casa. */
  fugiu?: number;
  /** REWORK 12.2: entregue a uma instituição (o seu zoológico, um criadouro autorizado): quem cuida agora. */
  instituicao?: string;
}

export interface Aperto {
  tipo: 'desemprego' | 'separacao' | 'doenca' | 'luto' | 'dinheiro' | 'fase';
  t: number;
  /** Quem foi perdido, no luto. */
  pessoaId?: string;
  /** O peso do laço com quem se foi (um filho pesa mais que um sogro): um luto mais leve não apaga um mais pesado. */
  peso?: number;
  /**
   * Quando o aperto se resolveu (arrumou emprego). Ele não some na hora: a
   * relação ainda lembra, um ano depois, se você esteve por perto (`iniciativas.lembrarApertos`).
   */
  resolvido?: number;
}

/**
 * A vida própria de um NPC que importa (filhos, netos): não é uma segunda
 * simulação completa, é uma trajetória coerente — formação, entrada no
 * trabalho, progressão ou tropeço — com os marcos guardados para o jogador ver.
 */
export interface VidaNpc {
  /** Facilidade estável da pessoa (−1..1), sorte que não se escolhe. */
  aptidao: number;
  escolaridade: 'fundamental' | 'medio' | 'tecnico' | 'superior';
  /** Desde quando está no cargo atual. */
  tCargo?: number;
  /** Meses de experiência na trilha atual. */
  experiencia: number;
  /** Largou os estudos (não volta a ser 'estudante' sem motivo). */
  parouDeEstudar?: boolean;
  trajetoria: { t: number; texto: string; tipo: TipoTrajetoria }[];
}

export type TipoTrajetoria = 'escola' | 'estudo' | 'trabalho' | 'promocao' | 'desemprego' | 'casa' | 'amor' | 'filho' | 'lugar' | 'saude' | 'perda';

export type Atracao = 'homens' | 'mulheres' | 'ambos';

/**
 * Aparência (puramente visual). Filhos herdam traços dos pais, então o
 * visual existe também para NPCs.
 */
export interface Visual {
  pele: string;
  cabelo: string;
  corCabelo: string;
  olhos: string;
  /** Barba (`dados/estilo.BARBAS`): 'por_fazer', 'curta', 'cheia', 'longa', 'cavanhaque', 'costeletas' — ou só 'bigode', 'bigodao'. */
  barba?: string;
  /**
   * Com a barba (`dados/estilo.BARBAS_COM_BIGODE`), o bigode vai junto — a não ser
   * que a pessoa escolha tirar (`false`). Ausente = junto (saves antigos).
   */
  bigode?: boolean;
  /** Óculos: de grau (o corpo pediu) ou escolhidos (armação redonda, de sol). */
  oculos?: 'grau' | 'redondo' | 'sol';
  /** O que vai na cabeça, quando vai. */
  chapeu?: 'bone' | 'chapeu' | 'gorro' | 'lenco';
  /** O jeito de vestir (a cor e o corte da roupa no retrato). */
  roupa?: EstiloRoupa;
  /** A joia em uso, quando aparece no retrato (a corrente no pescoço, os brincos). O relógio não aparece: fica no pulso, fora do quadro. */
  joia?: 'corrente' | 'corrente_ouro' | 'brincos';
  /**
   * REWORK 4 — traços modulares herdáveis (`sistemas/identidade`): a textura do cabelo (o penteado é escolha; a
   * textura é da família), a forma dos olhos, o nariz, a boca, o rosto, a sobrancelha. Ausentes em saves antigos (o
   * retrato usa o desenho de sempre).
   */
  textura?: string;
  olhosForma?: string;
  nariz?: string;
  boca?: string;
  rosto?: string;
  sobrancelha?: string;
  /**
   * FIX pós-playtest humano — APARÊNCIA 2.0: mais traços herdáveis, todos VISÍVEIS no retrato (nada que o desenho não
   * mostre). O tamanho e a distância dos olhos, a forma da sobrancelha, a largura da boca, o queixo, as orelhas, a
   * linha do cabelo, as sardas e a calvície (que antes era sorteio do retrato — agora passa de pai para filho).
   */
  olhosTam?: string;
  olhosDist?: string;
  sobrancelhaForma?: string;
  bocaLarg?: string;
  queixo?: string;
  orelhas?: string;
  linhaCabelo?: string;
  sardas?: string;
  calvicie?: string;
  /** O que foi feito no corpo e se vê (`sistemas/estetica`): o transplante capilar (a calvície herdada não aparece) e
   *  o ano do lifting (as rugas voltam devagar). NUNCA vai para os filhos: a herança lê `genes`, não o visual. */
  transplante?: boolean;
  lifting?: number;
}

/**
 * GENÉTICA ≠ APARÊNCIA ATUAL (FIX pós-playtest humano). `genes` guarda os traços com que a pessoa nasceu; o `visual`
 * é como ela está agora (o corte, a tinta, a barba, a cirurgia). Quem nunca mudou nada não precisa de `genes` (o
 * visual É a genética, a não ser a tinta — `estilo.corNatural`). A herança lê `identidade.geneticaDe`, nunca o visual:
 * o filho de quem fez rinoplastia herda o nariz de antes.
 */
export type Genes = Omit<Visual, 'cabelo' | 'barba' | 'bigode' | 'oculos' | 'chapeu' | 'roupa' | 'joia' | 'transplante' | 'lifting'> & { cabelo?: string };

export type EstiloRoupa = 'basica' | 'social' | 'esportiva' | 'alternativa' | 'elegante';

/**
 * Estilo: como a pessoa ESCOLHE se apresentar (≠ aparência, que é atributo;
 * ≠ notoriedade, que é quanto a conhecem). Guarda o que foi comprado e está
 * em uso — um chapéu não dá fama a ninguém (`sistemas/estilo`).
 */
export interface EstiloPessoal {
  itens: ItemDeEstilo[];
  /** A última mudança de visual que a pessoa decidiu (corte, barba, óculos). */
  tMudanca?: number;
  /** A cor natural do cabelo (guardada na primeira tinta: é para ela que se volta). */
  corNatural?: string;
}

export interface ItemDeEstilo {
  id: string;
  /** O item do catálogo (`dados/estilo`). */
  itemId: string;
  t: number;
  preco: number;
  usando: boolean;
}

export type Parentesco =
  | 'mae' | 'pai' | 'madrasta' | 'padrasto'
  | 'irmao' | 'meio_irmao'
  | 'avo' | 'tio' | 'primo'
  | 'filho' | 'enteado' | 'neto' | 'bisneto'
  /** Cônjuge de um filho (genro ou nora). */
  | 'genro'
  | 'sogro'
  /**
   * Sucessão (geração seguinte): a família vista por quem herdou a câmera. O
   * filho de um irmão é sobrinho; o cônjuge de um irmão, cunhado. Nascem só
   * da reconciliação de parentescos (`sucessao`), nunca de sorteio.
   */
  | 'sobrinho'
  | 'cunhado'
  | 'pet';

/** Onde duas pessoas convivem. É o que faz relações nascerem e se manterem. */
export type Convivio = 'casa' | 'escola' | 'faculdade' | 'trabalho' | 'vizinhanca' | 'rotina' | 'online';

/**
 * O TIPO do vínculo social (quem essa pessoa é na sua vida) — não a
 * proximidade. 'afastado' é o amigo de antes de quem a vida afastou, sem
 * briga; 'ex_amigo', o amigo com quem houve RUPTURA; 'rival', o atrito que
 * virou identidade (na escola, no trabalho, no esporte).
 */
export type EstagioSocial = 'conhecido' | 'colega' | 'amigo' | 'amigo_proximo' | 'afastado' | 'ex_amigo' | 'rival';

export type EstagioRomance =
  | 'interesse'   // alguém chamou atenção; ainda não aconteceu nada
  | 'saindo'      // encontros, conhecendo-se
  | 'namoro'
  | 'morando_junto'
  | 'casamento'
  | 'ex';

export interface Romance {
  estagio: EstagioRomance;
  tEstagio: number;
  /** Quando começou (a primeira saída). */
  tInicio?: number;
  /** O quanto a outra pessoa está envolvida (0..100). Não é visível como número. */
  envolvimento: number;
  /** Planejamento de filhos do casal — pertence à relação, não ao jogador. */
  planoFilhos?: 'evitando' | 'tentando' | 'sem_planejar';
  /** Como terminou (quando `ex`). A morte não faz de ninguém um "ex". */
  fim?: 'termino' | 'divorcio' | 'morte';
  /** Um caso escondido, paralelo à relação principal. */
  secreto?: boolean;
  /** Na relação principal: o que a outra pessoa não sabe (o caso, e desde quando). */
  segredo?: { pessoaId: string; t: number };
  /** Quem ouviu a declaração pediu um tempo para pensar (desde quando). A resposta é dela. */
  pediuTempo?: number;
  /**
   * REWORK 10.5 · REL-06: o acordo do casal. Ausente = exclusivo (o padrão: sair com outra pessoa é traição). 'aberto' =
   * os dois combinaram que podem (consentido — não é infidelidade; e o combinado pode ser desfeito).
   */
  acordo?: 'aberto' | 'poliamor';
  /** REWORK 10.5 · REL-06: a parceria (NPC) teve alguém fora do combinado: quando começou e quando você soube. */
  infiel?: { t: number; descoberto?: number; respondido?: number };
  /**
   * REWORK 11 · REL-11.4: um vínculo romântico CONSENTIDO fora da parceria principal (dentro de um acordo aberto ou de
   * poliamor). Não é segredo (≠ `secreto`) e nunca é a parceria principal (`parceiro()`): sem casa, finanças ou guarda.
   */
  paralelo?: true;
  /** REWORK 11 · REL-11.3: como terminou (quando `ex`): quem terminou e se houve traição. */
  porque?: { quem: 'jogador' | 'ela'; motivo?: 'traicao' };
  /** REWORK 11 · REL-16: o noivado como estado (desde quando) e o casamento planejado (quando houver). */
  /** REWORK 11.5 · REL-20: `anel` e `lugar` — como foi o pedido (a cena escolhida; a biografia e o casamento lembram). */
  noivado?: { t: number; plano?: PlanoDeCasamento; anel?: 'simples' | 'classico' | 'caro' | 'nenhum'; lugar?: 'casa' | 'jantar' | 'publico' };
}

/** REWORK 11 · REL-16: o casamento planejado (`sistemas/casamento`). Os custos saem dos preços locais na hora. */
export interface PlanoDeCasamento {
  local: 'cartorio' | 'casa' | 'salao' | 'religioso' | 'ar_livre' | 'destino';
  cerimonia: 'civil' | 'religiosa' | 'simbolica';
  convidados: number;
  estilo: 'simples' | 'classico' | 'luxo';
  luaDeMel: boolean;
  /** Quando foi combinado, e se a outra pessoa preferia outra coisa (e disse). */
  t: number;
  discorda?: boolean;
}

/** Um marco da história compartilhada. Só o que importa — nunca "um ano normal". */
export interface Marco {
  t: number;
  texto: string;
  tipo?: TipoMarco;
  /** 1 corriqueiro · 2 importante · 3 marcante. */
  peso?: number;
  /**
   * REWORK 7.5: num marco de apoio, QUEM ajudou quem — 'ela' (a pessoa ajudou o jogador: o conselho, o fim de semana
   * com as crianças, o lado dela quando a vida pesou), 'eu' (o jogador ajudou), 'juntos'. É a evidência que o
   * agradecimento consulta: ninguém agradece por uma ajuda que não aconteceu.
   */
  de?: 'eu' | 'ela' | 'juntos';
}

export type TipoMarco =
  | 'inicio' | 'amizade' | 'romance' | 'casamento' | 'filho' | 'casa' | 'escola' | 'trabalho'
  | 'conflito' | 'reconciliacao' | 'apoio' | 'ritual' | 'distancia' | 'traicao' | 'perda' | 'antigo'
  /** Algo que o jogador descobriu sobre a pessoa, convivendo. */
  | 'descoberta';

export interface Vinculo {
  pessoaId: string;
  parentesco?: Parentesco;
  /** De onde a pessoa veio para a vida do jogador. */
  origem: Convivio | 'familia' | 'apresentado' | 'romance';
  tInicio: number;
  /** Vínculo afetivo, 0..100. */
  proximidade: number;
  /** Confiança, 0..100. Sobe devagar com o tempo e o apoio; cai de uma vez com traição e abandono. */
  confianca: number;
  /** Atrito acumulado, 0..100. Decai com o tempo; cresce com conflitos. */
  tensao: number;
  /** Só para vínculos não familiares. */
  estagio?: EstagioSocial;
  romance?: Romance;
  /**
   * O lugar específico onde se conheceram ("escola:municipal-2", "trabalho:...").
   * Enquanto o jogador frequenta esse lugar, os dois convivem.
   */
  ambiente?: string;
  /** Contextos em que convivem AGORA (recalculado a cada ano). */
  convivio: Convivio[];
  tUltimoContato: number;
  /** Presença (0..100): tempo dedicado ao longo dos anos. É daqui que nasce o jeito de uma relação de pai/mãe e filho. */
  presenca?: number;
  /** Quantas vezes cada interação já foi feita — o que se repete vira costume ("ler antes de dormir"). */
  habitos?: Record<string, number>;
  /** História compartilhada — só fatos que aconteceram. */
  historia: Marco[];
  /**
   * A última vez em que houve um gesto de aproximação CORRESPONDIDO (você
   * chamou e a pessoa veio; ela chamou e você foi). Conviver cria a chance de
   * uma amizade; é o gesto que a faz acontecer (`sistemas/social`).
   */
  aproximacao?: number;
  /** Você decidiu tomar distância (ou pôr limites) desde então: a convivência deixa de aproximar. */
  distancia?: number;
  /**
   * A pessoa tomou uma iniciativa e espera uma reação (pediu ajuda,
   * convidou, cobrou a distância, demonstrou interesse). Responder é escolha
   * do jogador; não responder também tem consequência (`sistemas/iniciativas`).
   */
  chamado?: Chamado;
  /**
   * Alguém da formação: o professor que reparou, a orientadora, o colega de
   * turma. Não é amizade automática: é o papel que a pessoa teve ali — e que
   * pode voltar anos depois (uma indicação, uma carta) (`sistemas/formacao`).
   */
  formacao?: { papel: 'professor' | 'orientador' | 'colega'; instituicao: string; area?: string; tFim?: number };
  /** O contexto em que a relação nasceu (pacote pós-playtest, `relacoes`): define a abertura inicial, não o resultado. */
  contexto?: ContextoDaRelacao;
  /** A TRAJETÓRIA da relação: as fases por que passou, com a data (colega → amigo → afastado → reconciliação; match → encontro → namoro...). */
  fases?: { fase: string; t: number }[];
  /**
   * Relações 2.0 — o ESTADO da relação, separado do tipo e da proximidade.
   * Um conflito aberto (a discussão que ficou sem fim: o assunto, o peso,
   * quem começou); a ruptura (a amizade encerrada, o rompimento na família:
   * quando, por quê, de quem foi o passo); a reconciliação (quando); e a
   * proximidade do começo do ano (para dizer se a relação se aproxima ou
   * esfria). Tudo opcional: saves antigos não têm, e o estado sai "estável".
   */
  conflito?: { t: number; assunto: string; gravidade: 1 | 2 | 3; quem: 'eu' | 'outro' };
  ruptura?: { t: number; porque: string; quem: 'eu' | 'outro' | 'ambos' };
  reconciliacao?: number;
  proxAno?: number;
  /**
   * REWORK 4: o que o protagonista SABE desta pessoa — o fato, não a frase (`sistemas/conhecimento`). A verdade é da
   * pessoa; isto é o que se descobriu, quando, e com o valor daquele momento. Opcional (saves antigos: vazio).
   */
  sabe?: Saber[];
  /**
   * REWORK 4: o contato digital (`sistemas/redes`): a última mensagem trocada e a última interação superficial
   * (curtir, reagir). Mensagem segura parte da relação à distância; curtida mantém o contato sem intimidade.
   */
  digital?: { mensagem?: number; reacao?: number; segue?: boolean; seguidor?: boolean; bloqueado?: number };
  /** FIX pós-playtest humano: os TIPOS das últimas 4 microcenas com esta pessoa (antirrepetição — ids curtos, nunca texto). */
  cenas?: string[];
  /**
   * REWORK 10.5 · REL-07: a MÁGOA que fica depois do conflito (`sistemas/magoas`) — o motivo, a gravidade, quem causou,
   * o ressentimento (0..100, que esfria DEVAGAR: a tensão do dia a dia esfria rápido, a mágoa não) e as tentativas de
   * reparação (de quem, quando, como terminou). Não substitui afeto e confiança: dá para se amar e estar magoado.
   */
  magoa?: Magoa;
  /**
   * REWORK 10.5 · REL-09: dimensões que o afeto sozinho não diz. INTIMIDADE (0..100): o quanto vocês se contam — sobe
   * conversando de verdade (desabafar, um segredo, o futuro), quase nada com cinema e jantar; esfria sem contato.
   * COMPROMISSO (0..100): o quanto a vida de vocês está amarrada — os planos, o dinheiro junto, o namoro, a casa, o
   * casamento. Ausentes em saves antigos (a tela os omite até a primeira vez que mudam).
   */
  intimidade?: number;
  compromisso?: number;
}

/** REWORK 10.5 · REL-07: o que ficou de um conflito (ver `Vinculo.magoa`). */
export interface Magoa {
  t: number;
  motivo: string;
  gravidade: 1 | 2 | 3;
  /** Quem causou: 'eu' = o protagonista (a pessoa está magoada com você); 'outro' = a pessoa (ela deve um pedido de desculpas). */
  quem: 'eu' | 'outro';
  ressentimento: number;
  tentativas?: { t: number; quem: 'eu' | 'outro'; resultado: 'aceita' | 'recusada' | 'sem_resposta' }[];
}

/** Um fato que o protagonista sabe sobre alguém: a chave, quando soube, o valor de então. */
export interface Saber { k: string; t: number; v: string }

/** De onde a relação veio — e o que isso abre (a origem define o contexto e a intenção inicial; não determina o resultado). */
export interface ContextoDaRelacao {
  via: 'app' | 'trabalho' | 'escola' | 'faculdade' | 'esporte' | 'atividade' | 'amigos' | 'noite' | 'vizinhanca' | 'infancia' | 'evento' | 'viagem' | 'familia' | 'outro';
  /** A abertura romântica inicial, 0..1 (no app, alta; no trabalho, baixa; entre amigos de infância, há história). */
  abertura: number;
  /** O que a outra pessoa procura — no app, aparece no perfil; nos outros lugares, só se descobre. */
  busca?: 'relacionamento' | 'casual' | 'incerto';
  /** No app: match → conversa → encontro (depois, a relação segue o caminho de qualquer outra). */
  etapa?: 'match' | 'conversa' | 'encontro' | 'encerrado';
  /** A química do primeiro encontro (oculta: nunca é mostrada como número). */
  quimica?: number;
}

export type TipoChamado = 'pedido_ajuda' | 'convite' | 'reclamacao' | 'apoio' | 'interesse' | 'conversa_casal' | 'aproximacao' | 'distancia_casal'
  /** Relações 2.0: a pessoa pede desculpas; cobra algo que ficou (a briga que ela traz); ou reaparece anos depois de uma ruptura. */
  | 'desculpas' | 'cobranca' | 'reaparecer';

export interface Chamado {
  tipo: TipoChamado;
  t: number;
  /** O que a pessoa fez, em palavras (gravado: recarregar mostra o mesmo). */
  texto: string;
  /** O assunto (a mudança, as consultas, a viagem) — para a resposta falar dele. */
  assunto?: string;
}

/* ------------------------------------------------------------------- Corpo */

export interface Condicao {
  id: string;
  nome: string;
  tInicio: number;
  cronica: boolean;
  /** Gravidade 1..3. */
  gravidade: number;
  tratando: boolean;
  /**
   * Já tem nome no consultório? Antes do diagnóstico, a condição existe e
   * age sobre o corpo, mas a pessoa só percebe os SINAIS (`sistemas/saude`).
   * Ausente = diagnosticada (saves anteriores à v16).
   */
  diagnosticada?: boolean;
  /** Quando ganhou nome. */
  tDiagnostico?: number;
  /** Descoberta tarde (depois de anos de sinais): o tratamento rende menos. */
  tarde?: boolean;
  /**
   * REWORK 10.5 · SAU-02: a primeira vez que a pessoa procurou atendimento por este sinal (e os exames ainda não
   * fecharam). O "tarde" conta até aqui: quem procurou cedo não é culpado da demora do diagnóstico.
   */
  procurou?: number;
  /**
   * REWORK 10.6 · P4: o tratamento que a pessoa parou — quando, depois de quantos meses tratando (a adesão anterior), quantas
   * vezes já parou e a última vez que o corpo cobrou por isso. Volta a valer o tratamento: o registro fica (a história).
   */
  abandono?: { t: number; meses: number; vezes: number; cobrou?: number };
  /** REWORK 10.6 · P4: quando o tratamento de agora começou (para medir a adesão de quem parar). */
  tTratamento?: number;
  /**
   * Uma lesão (do esporte, do trabalho, de um tombo): aguda, com prazo de
   * recuperação que depende do CUIDADO escolhido. Enquanto dura, pesa na
   * saúde, no condicionamento, no treino e na disponibilidade (`sistemas/lesoes`).
   */
  lesao?: Lesao;
}

/** O cuidado escolhido para uma lesão: parar, reabilitar, operar — ou seguir no sacrifício. */
export type CuidadoLesao = 'repouso' | 'fisio' | 'cirurgia' | 'sacrificio';

export interface Lesao {
  /** Onde (o joelho, a coxa, o tornozelo). */
  parte: string;
  /** 1 leve (semanas) · 2 séria (meses) · 3 grave (cirurgia, quase um ano). */
  gravidade: 1 | 2 | 3;
  /** Previsão de volta (muda com o cuidado). */
  tFim: number;
  /** O que a pessoa decidiu fazer (ausente: ainda não decidiu). */
  cuidado?: CuidadoLesao;
  /** Onde aconteceu: em jogo/treino de atleta, na prática amadora, no trabalho — ou numa briga (REWORK 9.6). */
  origem: 'profissional' | 'pratica' | 'trabalho' | 'briga';
  /** Quantas vezes piorou por jogar/treinar em cima. */
  recaidas?: number;
}

export interface Corpo {
  saude: number;       // 0..100
  forma: number;       // condicionamento físico 0..100
  aparencia: number;   // presença/cuidado 0..100
  /** A aparência de nascença (traços, jeito): o ponto para onde ela volta sem os fatores do momento. */
  aparenciaBase: number;
  condicoes: Condicao[];
  habitos: { fuma: boolean; bebe: 'nao' | 'social' | 'muito'; sedentario: boolean };
  /** Pode gestar (definido pelo corpo, não pelo gênero). */
  podeGestar: boolean;
  /** REWORK 10 · SAVE-01: a estatura adulta (cm), guardada quando fica estabelecida (`modalidades.fixarEstatura`). Opcional. */
  estaturaAdulta?: number;
}

export interface Mente {
  felicidade: number;  // 0..100
  estresse: number;    // 0..100
  cognicao: number;    // 0..100 — facilidade de aprender, raciocínio
  /** Acontecimentos que mexeram com a pessoa, com nome (o equilíbrio vai absorvendo). */
  abalos: { t: number; texto: string; humor: number; cabeca: number }[];
  /** Como estava a cada aniversário (para a tendência: melhorando, piorando). */
  historico: { t: number; humor: number; cabeca: number; saude: number; forma?: number; cognicao?: number; aparencia?: number }[];
  /**
   * Sobrecarga acumulada: anos seguidos com a vida maior do que a semana
   * (`sistemas/sobrecarga`). Não é energia para gastar: é o que a semana
   * concreta vem cobrando — e o que o descanso devolve. Ausente = 0.
   */
  sobrecarga?: { anos: number; t: number };
  /**
   * REWORK 4: anos seguidos com a cabeça no limite (estresse alto ao fim do ano). Não é morte automática: só pesa no
   * corpo junto com o resto (`corpo.fatorDoEstresseProlongado`: condição, idade, saúde). Ausente = 0.
   */
  estresseAlto?: { anos: number; t: number };
}

/**
 * Predisposições: a facilidade de nascença em três eixos largos (−1..1),
 * derivadas da semente e guardadas na criação. São influência, não
 * destino: mudam a VELOCIDADE com que a prática rende e o teto plausível,
 * nunca substituem a prática. Não aparecem como número.
 *
 * Diferente da aptidão por frente (`sistemas/frentes.aptidao`): a física
 * diz como o CORPO responde ao treino (condicionamento, explosão); a aptidão
 * no futebol diz o jeito com a bola. Nenhuma das duas é técnica.
 */
export interface Predisposicoes {
  cognitiva: number;
  fisica: number;
  artistica: number;
  /**
   * REWORK 9.6 · ATR-01: a CONSTITUIÇÃO (−1..1) — o quanto o corpo tende a se manter saudável e a se recuperar: desloca
   * a saúde de referência de cada idade e, um pouco, o risco das doenças. Ausente (saves anteriores) = 0, neutra.
   */
  saude?: number;
  /** REWORK 9.6 · ATR-01: o TEMPERAMENTO (−1..1) — o ponto de equilíbrio da felicidade, sem os fatores da vida. Ausente = 0. */
  animo?: number;
}

/* -------------------------------------------------------------- Personalidade */

export type Traco =
  | 'empatia' | 'generosidade' | 'disciplina' | 'impulsividade'
  | 'coragem' | 'sociabilidade' | 'independencia' | 'familia';

export interface Personalidade {
  /** Eixos assinados −100..100, construídos só por escolhas comportamentais. */
  tracos: Record<Traco, number>;
  /** Evidências: qual escolha moveu o quê (limitado). */
  evidencias: { t: number; origem: string; impactos: Partial<Record<Traco, number>> }[];
}

/* ---------------------------------------------------------------- Educação */

export type Escolaridade =
  | 'nenhuma' | 'fundamental_incompleto' | 'fundamental' | 'medio_incompleto' | 'medio'
  | 'tecnico' | 'superior_incompleto' | 'superior' | 'pos' | 'mestrado' | 'doutorado';

export type EtapaBasica = 'creche' | 'pre' | 'fundamental1' | 'fundamental2' | 'medio';

export interface EscolaBasica {
  etapa: EtapaBasica;
  /** Ano dentro do ensino fundamental (1..9) ou médio (1..3); 0 na educação infantil. */
  serie: number;
  rede: 'publica' | 'privada';
  /** Médio integrado ao técnico (instituto federal, escola técnica): o curso técnico que vem junto. */
  integrado?: string;
  /** FIX pós-playtest humano: a escola técnica onde o integrado acontece (`ensinoTecnico`, chave estável da cidade). */
  integradoInst?: string;
  desempenho: number;  // 0..100
  /**
   * REWORK 9.7 · EDU-04: a nota de cada matéria no boletim do ano, de 0 a 10 (a tela converte para a escala do país).
   * É o desempenho DAQUELE ano na matéria — não o que se sabe dela (o domínio, `caminhos.frentes`, outra escala que
   * cresce com a vida). Sobe e cai de um ano para o outro. Saves antigos não têm: ganham no próximo ano letivo.
   */
  notas?: Partial<Record<'exatas' | 'linguagens' | 'ciencias' | 'humanas', number>>;
  reprovacoes: number;
  /** Na EJA (Educação de Jovens e Adultos): quem passou da idade da série estuda por etapas, à noite. */
  eja?: boolean;
}

export interface Matricula {
  cursoId: string;
  instituicao: string;
  rede: 'publica' | 'privada';
  modalidade: 'presencial' | 'ead';
  tInicio: number;
  /** Meses de curso que faltam (pausa quando trancado). */
  mesesRestantes: number;
  mensalidade: number;
  financiamento?: 'fies' | 'prouni';
  /**
   * REWORK 10 · ROT-05: a bolsa de atleta da instituição (particular): parte da mensalidade (`fracao`, 0..1) em troca de
   * representar a faculdade nas competições. Mantém-se treinando a modalidade e sem ir mal no curso; um ano fora das
   * condições é aviso (`aviso`), dois, a bolsa acaba (`naFormacao.processarBolsaDeAtleta`). Ausente: não tem.
   */
  bolsaAtleta?: { modalidade: Dominio; fracao: number; tInicio: number; aviso?: number };
  desempenho: number;
  /** REWORK 10.5 · EDU-05: disciplinas reprovadas no curso (cada uma atrasa; muitas, o curso pode ser cancelado). */
  reprovacoes?: number;
  trancado: boolean;
  /** Quando trancou (a instituição cancela depois de quatro anos). */
  tTrancou?: number;
  municipioId: string;
  /**
   * A área de uma pós, mestrado ou doutorado (que no catálogo servem a
   * qualquer área): herdada da formação em que se apoia. É o que faz um
   * doutorado ser "Doutorado em Nutrição", e não só "Doutorado".
   */
  area?: string;
  /** A especialidade escolhida na residência médica (define duração, título e o que vem depois). */
  especialidade?: EspecialidadeMedica;
}

/**
 * REWORK 10.5 · EDU-05: um ano letivo FECHADO (`sistemas/historicoAcademico`): a série da escola ou o ano do curso, as
 * disciplinas com a nota (0..10; a tela converte para a escala do país), a média e a situação. Permanente (até 40).
 */
export interface RegistroAcademico {
  /** Quando o ano letivo fechou. */
  t: number;
  nivel: 'escola' | NivelCurso;
  instituicao: string;
  /** "5º ano do fundamental", "2º ano de Direito". */
  rotulo: string;
  cursoId?: string;
  /** A matrícula a que o registro pertence (o `tInicio` dela): separa duas passagens pelo mesmo curso. */
  tInicioCurso?: number;
  disciplinas: { nome: string; nota: number; situacao?: 'aprovada' | 'reprovada' }[];
  media?: number;
  situacao: 'aprovado' | 'reprovado' | 'concluido' | 'trancado' | 'abandonado' | 'cancelado' | 'cursando';
  /** O país onde se estudou (a escala de notas é a de lá). */
  pais?: string;
}

/** REWORK 4: um momento da história da formação (`sistemas/vidaEstudantil`): o que se consulta anos depois. */
export interface MarcoDeFormacao { t: number; idade: number; instituicao: string; tipo: string; texto: string }

export interface Educacao {
  /** REWORK 4: a história de dentro da formação — momentos de cada escola e curso, na ordem (até 60). Opcional. */
  trajetoria?: MarcoDeFormacao[];
  /** REWORK 10.5 · EDU-05: os anos letivos fechados, da escola à pós (permanente; ausente em saves antigos). */
  historicoAcademico?: RegistroAcademico[];
  escolaridade: Escolaridade;
  basica?: EscolaBasica;
  /** Largou a escola básica sem concluir. */
  evadiu: boolean;
  matricula?: Matricula;
  /**
   * REWORK 10.6 · C2: a vaga conquistada que ainda espera a confirmação da matrícula (candidatar-se não é se matricular).
   * Vale até `tAte`; sem confirmação, passa — e fica dito.
   */
  aprovacao?: { novo: Extract<NovoCompromisso, { tipo: 'curso' }>; nome: string; t: number; tAte: number };
  concluidos: { cursoId: string; nome: string; nivel: NivelCurso; area: string; tFim: number; instituicao: string; rede?: 'publica' | 'privada'; modalidade?: 'presencial' | 'ead'; fies?: boolean; /** O desempenho ao se formar (0..100): o histórico que a seleção da pós lê. */ desempenho?: number; /** A especialidade da residência médica (da pessoa: vai para todo emprego). */ especialidade?: EspecialidadeMedica }[];
  /**
   * As notas do exame de ingresso (o nome do campo é histórico: é o exame do
   * país onde a pessoa morava — o ENEM, o SAT, a PAU). `pais`/`exame` dizem
   * onde e qual (ausentes nas notas antigas: valem onde a pessoa mora). A
   * nota de um país não abre a universidade de outro; fica na história.
   */
  /**
   * O HISTÓRICO ESCOLAR por país (separado do sistema ATUAL, que é sempre o
   * do país onde a pessoa mora): onde estudou e até que etapa, a cada troca
   * de país. A escola de agora segue a série; o que veio antes fica aqui.
   */
  historicoEscolar?: { pais: string; desde: number; ate: number; etapa?: EtapaBasica; serie?: number; escolaridade: Escolaridade }[];
  enem: { t: number; nota: number; areas?: Partial<Record<'exatas' | 'linguagens' | 'ciencias' | 'humanas', number>>; pais?: string; exame?: string }[];
  /** Postura do ano na escola/curso (escolha comportamental do jogador). */
  postura: 'dedicada' | 'normal' | 'relaxada';
  /**
   * Obsoleto (até a v15): espelho da rotina de cursinho. A fonte única é a
   * rotina (`sistemas/vestibular.fazCursinho`); o campo só existe em saves antigos.
   */
  cursinho?: boolean;
  /** O curso que a pessoa quer (Medicina, Direito...): a preparação passa a ser dirigida a ele. */
  objetivo?: { cursoId: string; t: number };
  /** A matéria em que o estudo está dirigido (a que a estimativa aponta como fraca): o cursinho e o estudo por conta puxam para ela. */
  focoMateria?: 'exatas' | 'linguagens' | 'ciencias' | 'humanas';
  /**
   * Preparação para o vestibular: meses de cursinho acumulados (esfriam
   * quando para). É o que o cursinho acrescenta à nota — dito em Estudos
   * pela mesma conta que a prova usa.
   */
  preparo?: { meses: number; tUltimo?: number };
  /**
   * O que a pessoa VIVEU na formação além das aulas: a olimpíada, o grêmio,
   * o time da escola, o projeto do laboratório, a iniciação científica, a
   * monitoria. Fica depois que a formação acaba — e pesa em portas futuras
   * (`sistemas/formacao`).
   */
  vivencias?: Vivencia[];
}

export type TipoVivencia =
  | 'olimpiada' | 'projeto' | 'gremio' | 'time' | 'reforco' | 'ciencias'
  | 'projeto_tecnico' | 'iniciacao' | 'monitoria' | 'extensao' | 'centro_academico' | 'atletica' | 'empresa_junior' | 'grupo_estudos'
  | 'xadrez';

export interface Vivencia {
  tipo: TipoVivencia;
  /** Quando começou. */
  t: number;
  /** Anos de dedicação (cresce enquanto dura). */
  anos: number;
  /** A instituição (chave do ambiente) onde aconteceu. */
  instituicao: string;
  /** A área (do curso ou da matéria), quando há. */
  area?: string;
  /** O que deu certo: a medalha, o artigo, o título, a eleição. */
  feito?: string;
  /** Quem orientou (professor), quando houve. */
  pessoaId?: string;
  /** Terminou (a formação acabou ou a pessoa largou). */
  tFim?: number;
  /**
   * A HISTÓRIA INTERNA da atividade (pacote pós-playtest, `arcos`): a etapa
   * em que está (treinos → titular → destaque; preparação → fase regional →
   * estadual...), o papel (reserva, titular, capitão, responsável) e os marcos.
   */
  etapa?: string;
  papel?: string;
  marcos?: { t: number; texto: string }[];
}

/** `livre`: qualificação profissional curta (SENAI, SENAC, cursos de ofício) — não muda a escolaridade. */
export type NivelCurso = 'livre' | 'tecnico' | 'superior' | 'pos' | 'mestrado' | 'doutorado' | 'residencia';

/* ---------------------------------------------------------------- Trabalho */

/**
 * Vínculo de trabalho. `temporario` é o contrato de safra ou de fim de ano;
 * `militar` é a carreira das Forças Armadas e das polícias e bombeiros
 * militares (regime próprio: reserva por tempo de serviço, não INSS).
 */
/** `eletivo`: mandato conquistado em eleição (subsídio, prazo, sem chefe — responde ao eleitor). */
export type Contrato = 'aprendiz' | 'estagio' | 'clt' | 'servidor' | 'informal' | 'autonomo' | 'temporario' | 'militar' | 'eletivo';

export interface Emprego {
  /** REWORK 4: a organização (`Vida.organizacoes`) onde se trabalha, quando tem nome. */
  orgId?: string;
  /** REWORK 11 · ESP-11.7: o clube concreto de quem trabalha numa comissão técnica (o nome, como no catálogo). */
  clube?: string;
  ocupacaoId: string;
  empregador: string;
  contrato: Contrato;
  /** Salário bruto mensal. */
  salario: number;
  tInicio: number;
  /** 0..100 — como o trabalho está indo. */
  desempenho: number;
  municipioId: string;
  /** Carga: integral ou parcial (afeta tempo livre). */
  carga: 'integral' | 'parcial';
  /** Curso de formação pago (escola de sargentos, academia de polícia): termina em `destino`. */
  formacaoAte?: number;
  /** Trabalho depois de aposentado: não entra na escada de promoções. */
  posAposentadoria?: boolean;
  /** Como chegou aqui (indicação, estágio, concurso...) — dado para a Linha da Vida. */
  via?: string;
  /** Autônomos: clientela, 0..100 (o que faz a renda de quem trabalha por conta). */
  clientela?: number;
  /** Desde quando está neste posto (promoção reinicia; `tInicio` guarda a entrada no emprego). */
  tPosto?: number;
  /** Jornada reduzida por escolha (para cuidar de alguém): menos renda, mais semana. */
  reduzida?: boolean;
  /** Formalizado como MEI (quem trabalhava na informalidade passa a contribuir). */
  mei?: boolean;
  /** Última atualização profissional (curso que acompanhou uma mudança do ofício). */
  tAtualizacao?: number;
  /**
   * O clima no trabalho, 0..100 (50 = nada a dizer): a relação com a chefia,
   * a equipe ou os clientes. Sobe com reconhecimento e boa conversa; cai com
   * conflito, recusa, blefe. Nunca aparece como número.
   */
  clima?: number;
  /**
   * O ritmo escolhido (quem controla a própria carga: turmas, plantões,
   * agenda, balcão). `puxado` rende mais e cobra da cabeça, do corpo e de
   * casa; `leve` rende menos e devolve tempo. Ausente = o ritmo de sempre.
   */
  ritmo?: 'leve' | 'puxado';
  /** Anos seguidos no ritmo puxado (o corpo cobra com o tempo). */
  anosPuxado?: number;
  /** Quem trabalha por conta: o que já investiu no próprio trabalho (0 nada · 1 equipamento · 2 um ponto/estrutura). */
  estrutura?: number;
  /** Quem trabalha por conta: quanto cobra, em relação ao que se cobra por aí. */
  preco?: 'baixo' | 'alto';
  /** A área dentro da profissão (direito de família, ortodontia, alfabetização): escolhida, leva junto para o próximo emprego. */
  especialidade?: string;
  /** Fator da faixa salarial deste emprego (a especialidade médica), fixado na entrada: teto e reajuste o respeitam. */
  faixa?: number;
  /** Casos, turmas, projetos marcantes neste trabalho (o que a carreira foi construindo). */
  feitos?: number;
  /**
   * Os postos ANTERIORES dentro deste mesmo vínculo (generalização de carreiras):
   * a promoção troca `ocupacaoId` no lugar, e é aqui que o cargo de antes fica
   * (`trabalho.registrarPosto`). Saves antigos não têm: o histórico começa daqui.
   */
  postos?: { ocupacaoId: string; t: number }[];
}

export interface Candidatura {
  id: string;
  ocupacaoId: string;
  tInicio: number;
  /** Quando sai o resultado. */
  tResultado: number;
  /** Chance final já calculada no momento da candidatura (desempenho na seleção). */
  chance: number;
  /** Concursos têm prova; o resultado também depende do estudo até lá. */
  concurso: boolean;
}

export interface Trabalho {
  atual?: Emprego;
  historico: (Emprego & { tFim: number; motivo: string })[];
  /** Meses de experiência por trilha profissional. Só se soma por `somarExperiencia` (no máximo 12 por ano de calendário). */
  experiencia: Record<string, number>;
  /** REWORK 5: quanto cada trilha já ganhou no ano corrente (`ano` = ano de calendário) — o teto de 12 meses por ano. */
  expAno?: { ano: number; m: Record<string, number> };
  candidaturas: Candidatura[];
  /** Meses de contribuição ao INSS. */
  contribuicao: number;
  aposentadoria?: { t: number; beneficio: number };
  licencas: string[];
  /** Horas extras neste ano (escolha). */
  horasExtras: boolean;
  desempregadoDesde?: number;
  /**
   * REWORK 10 · ECO-03: o seguro-desemprego em parcelas mensais (antes, vinha inteiro no dia da demissão). `tProxima` é o
   * mês da próxima parcela; um emprego formal novo encerra as que faltam (`sistemas/seguroDesemprego`). Opcional.
   */
  seguroDesemprego?: { parcela: number; restantes: number; total: number; tProxima: number };
  /**
   * A INTENÇÃO profissional declarada de quem está sem trabalho — que não é a
   * ocupação (sem emprego) nem a situação econômica (o patrimônio): voltar a
   * procurar, ou não procurar (viver do que juntou, por escolha). Sem
   * declaração, vale o que a vida mostra (`sistemas/intencao`). Opcional:
   * saves antigos não têm, e a leitura deduz.
   */
  intencao?: { quer: 'procurar' | 'nao_procurar'; t: number };
  /**
   * Uma pausa (ou redução) do trabalho pago para cuidar de alguém ou da casa.
   * Não é profissão: é uma trajetória de vida, com custo e sentido.
   */
  pausa?: PausaDeCuidado;
  /**
   * Uma segunda trajetória ATIVA, ao lado do trabalho principal (a professora
   * que atua; o ator que segue fazendo alguns trabalhos durante a bolsa).
   * Rende menos, pede parte da semana, conta experiência — e tem ações
   * próprias (`sistemas/paralelas`). Nunca entra sem o jogador escolher.
   */
  paralela?: Emprego;
  /**
   * Trajetórias PAUSADAS: a carreira que ficou em espera (não encerrada) por
   * outra. O currículo, a freguesia, os contatos e o nome continuam; voltar é
   * retorno, não começo do zero (`sistemas/paralelas`).
   */
  pausadas?: TrajetoriaPausada[];
  /**
   * REWORK 4: as ÁREAS de aprofundamento do ofício, da PESSOA (não do emprego): escolher Segurança é uma decisão da
   * carreira, que atravessa trocas de emprego, promoções, demissões, mudança de país. Uma fase por área, na ordem
   * (generalista → Segurança → anos depois, Dados): a mudança fecha a fase anterior, não a apaga
   * (`sistemas/areasDoOficio`). Opcional: saves antigos deduzem a área do emprego.
   */
  areas?: FaseDeArea[];
}

export interface FaseDeArea {
  /** O ofício (a chave da tabela `OFICIOS`: 'ti' vale para ti e dados). */
  oficio: string;
  area: string;
  tInicio: number;
  tFim?: number;
}

export interface TrajetoriaPausada {
  emprego: Emprego;
  /** Desde quando está pausada. */
  t: number;
  /** Por quê (dito na Linha da Vida): "para aceitar a bolsa de pesquisa". */
  motivo: string;
  /** Servidor: licença sem remuneração (o cargo espera até `tAte`). */
  licenca?: { tAte: number };
}

export interface PausaDeCuidado {
  motivo: 'filhos' | 'pais' | 'parceiro' | 'familiar' | 'casa';
  /** Quem recebe o cuidado (quando é uma pessoa). */
  pessoaId?: string;
  tInicio: number;
  /** Parou de vez ou reduziu a jornada. */
  intensidade: 'parcial' | 'total';
  /** Paga o INSS como contribuinte facultativo durante a pausa. */
  facultativo?: boolean;
}

/* ---------------------------------------------------------------- Dinheiro */

/**
 * Obrigações não são uma coisa só. Um financiamento é uma obrigação presa a
 * um bem (a casa, o carro); um empréstimo é dinheiro adiantado com parcela
 * fixa; o cartão rotativo é a dívida cara; o acordo é a dívida renegociada.
 * O que torna uma obrigação PROBLEMÁTICA é o atraso, não o tipo.
 */
export type TipoDivida = 'cartao' | 'emprestimo' | 'financiamento_imovel' | 'financiamento_veiculo' | 'fies' | 'acordo';

export interface Divida {
  id: string;
  tipo: TipoDivida;
  saldo: number;
  /** Juros ao mês (0.02 = 2% a.m.), em termos reais. */
  jurosMes: number;
  /** Parcela mensal (0 = rotativo, paga o que der). */
  parcela: number;
  bemId?: string;
  descricao: string;
  /** Quando foi contratada. */
  tInicio?: number;
  /** Prazo contratado, em meses. */
  prazo?: number;
  /** Meses de parcela sem pagar (0 = em dia). É o que faz uma obrigação virar problema. */
  atraso?: number;
  /** Desde quando está atrasada (as consequências pedem tempo: ninguém perde a casa no primeiro mês). */
  atrasoDesde?: number;
  /**
   * Rotativo (cartão e cheque especial): o que foi de fato tomado, sem os
   * encargos. A Lei 14.690/2023 (art. 28) limita juros e encargos do rotativo
   * a 100% do valor original — o saldo nunca passa do dobro disto. Ausente =
   * o saldo de quando o teto passou a ser acompanhado (saves anteriores).
   */
  principal?: number;
}

/** Um episódio na vida de um bem (a compra, o conserto, a mudança). Só o que importa. */
export interface EpisodioBem { t: number; texto: string }

/** Um problema material que tem solução (conserto, reparo). Nunca fica sem ação. */
export interface ProblemaBem {
  id: string;
  texto: string;
  custo: number;
  desde: number;
  /** 1 incomoda · 2 atrapalha o uso · 3 parou. */
  gravidade: 1 | 2 | 3;
  /** Quantas vezes já foi adiado (o custo e o risco crescem). */
  adiado: number;
}

export interface Veiculo {
  id: string;
  tipo: 'veiculo';
  /** A classe (compacto, SUV, moto pequena...: `VEICULOS`). */
  modeloId: string;
  /** A versão concreta (marca e modelo: `VERSOES_VEICULO`); saves antigos não têm. */
  versaoId?: string;
  nome: string;
  valor: number;
  tCompra: number;
  /** 0..100 — estado de conservação. */
  estado: number;
  /** Ano de fabricação (um usado chega com anos de estrada). */
  anoFabricacao?: number;
  /** Comprado usado. */
  usado?: boolean;
  /** Quanto custou. */
  precoPago?: number;
  /** Um conserto pendente. */
  problema?: ProblemaBem;
  /** Deixou de usar (parado na garagem): sem custo de uso, sem mobilidade. */
  parado?: boolean;
  /** Última revisão preventiva. */
  tRevisao?: number;
  historia?: EpisodioBem[];
  /** De quem é: só seu ou do casal (comprado durante o casamento). */
  dono?: 'eu' | 'casal';
  /** REWORK 4: a cor deste veículo (da compra para sempre). Saves antigos: derivada do id. */
  cor?: string;
  corNome?: string;
  /**
   * REWORK 12: onde o veículo está, quando não está com a pessoa (o município). Ausente = com a pessoa, na cidade
   * onde ela mora. Numa mudança de país, o carro fica guardado na cidade de antes — não some, não é vendido à força.
   */
  local?: string;
}

export interface Imovel {
  id: string;
  tipo: 'imovel';
  modeloId: string;
  nome: string;
  valor: number;
  tCompra: number;
  municipioId: string;
  /** Alugado para terceiros (renda mensal) ou usado como moradia. */
  alugadoPor?: number;
  estado: number;
  precoPago?: number;
  /** Onde fica, em palavras ("perto do centro", "num bairro novo"). */
  bairro?: string;
  problema?: ProblemaBem;
  /** Última reforma ou manutenção grande (as grandes são espaçadas). */
  tManutencao?: number;
  historia?: EpisodioBem[];
  dono?: 'eu' | 'casal';
  /** Herdado (não comprado). */
  herdado?: boolean;
  /**
   * REWORK 12: quem cuida do aluguel. `imobiliaria` (o padrão de sempre: cobra a taxa, acha inquilino, segura
   * o calote) ou `propria` (sem taxa — e a vacância, o inquilino que atrasa e a dor de cabeça são seus).
   */
  administracao?: 'imobiliaria' | 'propria';
  /** REWORK 12: o inquilino parou de pagar (meses sem receber). Ausente = em dia. */
  calote?: number;
  /** REWORK 12: o quanto o bairro é disputado (o índice da oferta: 1 = um bairro comum). Ausente nos saves antigos. */
  indiceBairro?: number;
}

export type Bem = Veiculo | Imovel;

export type EstiloDeVida = 'apertado' | 'modesto' | 'confortavel' | 'folgado';

export type GrupoRazao = 'renda' | 'moradia' | 'casa' | 'filhos' | 'transporte' | 'saude' | 'educacao' | 'dividas' | 'lazer' | 'animais' | 'outros';

export interface LinhaRazao {
  rotulo: string;
  valor: number; // positivo = entrada, negativo = saída (mensal em `saldoMensal`, anual em `razao`)
  grupo: GrupoRazao;
  /** De quem é a entrada: sua, da parceria, da família, do patrimônio. */
  de?: 'eu' | 'parceria' | 'familia' | 'patrimonio' | 'governo';
}

/** Produtos de investimento (catálogo em `dados/investimentos`). */
export type Produto = 'reserva' | 'pos_fixado' | 'inflacao' | 'multimercado' | 'acoes' | 'imobiliario' | 'acao_unica';

/**
 * Uma aplicação. Guarda o que foi posto (aportado) e o que vale hoje: a
 * diferença é ganho ou perda. Renda (juros pagos, dividendos, aluguéis do
 * fundo) só existe para os produtos que pagam — e vai para a conta.
 */
export interface Aplicacao {
  id: string;
  produto: Produto;
  /** Total posto, descontado o que foi resgatado (base de custo). */
  aportado: number;
  valor: number;
  tInicio: number;
  /** Valor em cada aniversário (os últimos anos), para ver a evolução. */
  historico: number[];
  /** O que pagou em dinheiro no último ano (dividendos, rendimentos distribuídos). */
  rendaAno?: number;
  /** Para títulos atrelados à inflação: a taxa real travada na compra. */
  taxa?: number;
  /** Maior valor já alcançado (para "já valeu mais"). */
  pico?: number;
  /** Quanto o preço variou no último ano (sem contar aportes e resgates). */
  retornoAno?: number;
  /** Herança de menor: fica aplicada em nome da pessoa e só pode ser movida a partir de `tutelaAte` (a maioridade). */
  tutelaAte?: number;
}

/** Como estava o dinheiro a cada aniversário (para a evolução e as métricas). */
export interface FotoFinanceira {
  t: number;
  /** Ativos: conta + aplicações + bens. */
  ativos: number;
  /** Obrigações: todas as dívidas. */
  obrigacoes: number;
  /** Renda e despesa mensais. */
  renda: number;
  despesa: number;
}

/** Uma coisa que a pessoa tem (`dados/coisas`): quando comprou, por quanto, e o estado (100 nova, 0 acabou). */
export interface CoisaTida {
  id: string; coisaId: string; t: number; preco: number; estado: number;
  /** REWORK 4: a variante desta coisa (a cor e o acabamento), da compra para sempre. Saves antigos: derivada do id. */
  cor?: string;
  acabamento?: string;
}

export interface Financas {
  /** Dinheiro SEU, disponível. Na casa dos pais, não é o dinheiro da casa. */
  conta: number;
  investimentos: Aplicacao[];
  dividas: Divida[];
  bens: Bem[];
  /** As coisas da vida (eletrônicos, casa, instrumentos, esporte, livros): `sistemas/coisas`. Ausente nos saves antigos. */
  coisas?: CoisaTida[];
  estilo: EstiloDeVida;
  planoDeSaude: boolean;
  /** Nome sujo: crédito negado. */
  negativado: boolean;
  /** Razão do último ano (para a interface). */
  razao: LinhaRazao[];
  historico: FotoFinanceira[];
  /** O extrato do último ano fechado: de onde veio e para onde foi cada real da conta e das aplicações (`sistemas/extrato`). */
  extrato?: ExtratoDoAno;
  /** O extrato em aberto, desde o último fechamento (escolhas, acontecimentos e o fechamento do ano que vem). */
  extratoAberto?: ExtratoDoAno;
  /** REWORK 12: os objetos de coleção (arte, relógios, joias, antiguidades, memorabilia) — `sistemas/colecao`. */
  colecao?: Colecionavel[];
  /** REWORK 12: as empresas de que a pessoa é dona, sócia ou investidora (além do trabalho) — `sistemas/empresas`. */
  empresas?: Empresa[];
  /** REWORK 12: o veículo principal (o do dia a dia, quando há mais de um). Ausente = o sistema escolhe. */
  veiculoPrincipal?: string;
  /** REWORK 12.2: o que os animais exóticos pedem (terrário, viveiro, aquário marinho) — `sistemas/exoticos`. */
  instalacoes?: InstalacaoAnimal[];
}

/** REWORK 12.2: uma instalação para animal exótico (sem ela, a loja não vende a espécie que precisa dela). */
export interface InstalacaoAnimal {
  id: string;
  tipo: string;
  t: number;
  preco: number;
  /** A cidade onde está montada (na mudança, vai junto se o animal vai). */
  municipioId: string;
}

/* ---------------------------------------------------- REWORK 12 · coleção */

export type CategoriaColecao = 'arte' | 'relogio' | 'joia' | 'antiguidade' | 'memorabilia';
export type RaridadeColecao = 'comum' | 'incomum' | 'rara' | 'unica';
/**
 * De onde a peça veio — é a procedência que sustenta o valor. Peça sem procedência vale como peça sem
 * procedência (uma camisa "da final" comprada na calçada vale o que vale uma réplica), não como a lenda.
 */
export type ProcedenciaColecao = 'loja' | 'galeria' | 'leilao' | 'antiquario' | 'herdada' | 'propria' | 'presente' | 'sem_procedencia' | 'privada' | 'paralelo';

/** Uma peça de coleção. Valor ESTIMADO: só a venda diz o que ela vale de fato. */
export interface Colecionavel {
  id: string;
  /** A peça do catálogo (`dados/colecionaveis`) — ou um id gerado para a peça única (a camisa da sua própria final). */
  pecaId: string;
  nome: string;
  categoria: CategoriaColecao;
  raridade: RaridadeColecao;
  procedencia: ProcedenciaColecao;
  /** Com certificado (laudo, nota da galeria, lote do leilão, carta do clube). Sem ele, a peça vale bem menos. */
  certificado: boolean;
  /** 0..100. */
  estado: number;
  valor: number;
  precoPago: number;
  tCompra: number;
  /** De onde vem a história da peça ("a camisa do Flamengo na final de 2031", "o relógio do avô"). */
  detalhe?: string;
  /** Importa por quem foi (herdada, presente, a da sua carreira): não se vende por qualquer preço. */
  afeto?: string;
  historia?: EpisodioBem[];
  /** Cedida ao museu de que a pessoa é dona (em exposição, segue sendo dela). */
  emprestadaA?: string;
  /**
   * REWORK 12.2 — o que se sabe da autenticidade: verificada (laudo), presumida (a palavra de quem vendeu) ou
   * duvidosa (sem papel, origem incerta). A verdade (`falsa`, `roubada`) não aparece na tela até alguém verificar.
   */
  autenticidade?: 'verificada' | 'presumida' | 'duvidosa';
  falsa?: boolean;
  roubada?: boolean;
  /** Avaliada por um perito (quando): o valor da tela passa a ser o do laudo. */
  avaliada?: number;
  /** Emprestada a um museu de fora (até quando). */
  emprestadaFora?: { instituicao: string; ate: number };
  /** A chave da peça histórica única (uma só no mundo de cada continuidade). */
  unica?: string;
}

/** REWORK 12.2 — por onde andou cada peça única desta continuidade (nunca duas iguais). */
export interface RegistroDePecaUnica {
  /** Quem tem: você (a peça está na coleção), o mercado (vendida; pode voltar a leilão anos depois) ou um museu. */
  com: 'voce' | 'mercado' | 'museu';
  t: number;
  /** Os donos que a vida conheceu (nomes), na ordem. */
  donos: string[];
}

/* ---------------------------------------------------- REWORK 12 · empresas */

export type TipoEmpresa = 'restaurante' | 'clinica' | 'academia' | 'estudio' | 'hotel' | 'loja' | 'museu' | 'zoologico';
/** O que a pessoa É na empresa: dona (toda), sócia (uma parte, com voz) ou investidora (parte pequena, sem gestão). */
export type PapelNaEmpresa = 'dono' | 'socio' | 'investidor';
export type PrecoEmpresa = 'popular' | 'medio' | 'alto';

/** Quem toca o dia a dia: a pessoa (horas da semana) ou alguém contratado (salário, e um resultado que varia). */
export interface GestaoEmpresa {
  quem: 'propria' | 'contratada';
  /** Gestor contratado: nome e competência (0..100, que só aparece com o tempo). */
  nome?: string;
  competencia?: number;
  salario?: number;
  tInicio: number;
}

/**
 * Uma empresa da pessoa, separada da conta dela: o caixa é da empresa; o lucro só vira dinheiro seu quando é
 * distribuído (e só na parte que é sua). O valor da participação entra no patrimônio uma vez — não somado de novo
 * aos ativos da empresa.
 */
export interface Empresa {
  id: string;
  tipo: TipoEmpresa;
  nome: string;
  municipioId: string;
  tInicio: number;
  papel: PapelNaEmpresa;
  /** A parte que é sua (0..1). */
  parte: number;
  /** O que a pessoa pôs (abertura, compra, aportes) — a base de custo. */
  investido: number;
  /** O caixa da empresa (não é o seu dinheiro). Negativo = a empresa deve (cheque especial da empresa). */
  caixa: number;
  /** O que foi feito em instalações (o valor dos ativos da empresa, que se desgasta). */
  ativos: number;
  /** Porte: capacidade relativa (1 = a unidade de partida; uma unidade nova soma). */
  unidades: number;
  /** 0..100: instalações, cuidado, o que se entrega. */
  qualidade: number;
  /** 0..100: o que se fala. */
  reputacao: number;
  /** Quantas pessoas trabalham (sem contar a gestão). */
  equipe: number;
  preco: PrecoEmpresa;
  gestao: GestaoEmpresa;
  /** Reinvestir tudo ou distribuir o que passa de uma reserva. */
  distribuir: boolean;
  /** O último ano, para a tela e para quem quiser comprar. */
  ultimo?: AnoDeEmpresa;
  /**
   * O valor da empresa INTEIRA hoje (o que um comprador pagaria; nunca abaixo de zero: a responsabilidade é
   * limitada). É ele — vezes a parte — que entra no patrimônio, e ele já contém o caixa e as instalações.
   */
  avaliacao?: number;
  /** Os lucros retidos (o que a empresa ganhou e ainda não distribuiu): só deles sai distribuição. */
  retido?: number;
  /** Academia: os alunos matriculados (a carteira que se renova com a evasão). */
  carteira?: number;
  /** O sócio (o nome; a parte dele é 1 − parte). */
  socio?: string;
  /** Resultado (lucro ou prejuízo) dos últimos anos. */
  historico?: number[];
  /** Anos seguidos com o caixa no vermelho (a falência pede tempo, não um ano ruim). */
  anosNoVermelho: number;
  estado: 'abrindo' | 'operando' | 'em_crise' | 'interditada' | 'encerrada';
  tFim?: number;
  /** Museu: o acervo (valor estimado), o estado de conservação (0..100) e a exposição em cartaz. */
  acervo?: { valor: number; conservacao: number; pecas: number; exposicao?: string; tExposicao?: number };
  /** Zoológico: o bem-estar dos animais (0..100), os recintos, a licença e a última fiscalização. */
  zoo?: { bemEstar: number; recintos: number; especies: number; licenca: boolean; tFiscalizacao?: number; conservacao: boolean };
  historia?: EpisodioBem[];
  /** REWORK 12.2: o que é próprio do ramo (o cardápio, os quartos, os recintos, o acervo) — `sistemas/negocios`. */
  setor?: SetorDaEmpresa;
  /** REWORK 12.2: a empresa serve de fachada a um negócio por fora (o risco é dela também) — `sistemas/clandestinos`. */
  fachada?: { negocioId: string; tInicio: number; suspeita: number; tFim?: number; descoberta?: number };
}

/* ------------------------------------------------- REWORK 12.2 · negócios vivos */

export type ConceitoRestaurante = 'popular' | 'familiar' | 'especializado' | 'alta_gastronomia' | 'luxo';
export type Nivel3 = 1 | 2 | 3;

/** Alguém com nome à frente de uma área (o chef, o curador, o técnico de som): o talento só se vê com o tempo. */
export interface ProfissionalChave { nome: string; talento: number; salario: number; t: number }

/** Um animal do zoológico: um indivíduo, com nome, idade, saúde e história — não um número de estoque. */
export interface AnimalDoZoo {
  id: string;
  especie: string;
  nome: string;
  genero: 'masculino' | 'feminino';
  /** Mês (t da vida) em que nasceu. */
  nasceu: number;
  /** 0..100. */
  saude: number;
  origem: 'acervo' | 'transferencia' | 'nascido' | 'resgate' | 'conservacao' | 'doacao';
  recinto: string;
  chegou: number;
  /** De onde veio, em palavras ("transferido do zoológico de Curitiba"; "era de Fulano, entregue à instituição"). */
  historia?: string[];
  /** O animal que era seu (pet) e foi para o zoológico: o id da pessoa-animal de antes. */
  deQuem?: string;
}

export interface RecintoDoZoo { id: string; habitat: string; vagas: number; qualidade: number; t: number }

/** Uma obra do museu (os destaques; a reserva técnica é `acervo.pecas`). */
export interface ObraDoMuseu {
  id: string;
  nome: string;
  tema: string;
  periodo: string;
  valor: number;
  conservacao: number;
  exposta: boolean;
  /** O que se sabe (laudo) — e a verdade, escondida até alguém verificar. */
  autenticidade: 'verificada' | 'presumida';
  falsa?: boolean;
  origem: 'acervo' | 'compra' | 'doacao' | 'emprestimo';
  /** Empréstimo recebido: de quem e até quando (depois, volta). */
  de?: string;
  ate?: number;
  /** Emprestada a outro museu: a quem e até quando. */
  fora?: { instituicao: string; ate: number };
}

export interface SetorDaEmpresa {
  /** O gestor contratado decide o dia a dia do ramo (o dono decide só o grande). */
  delegar?: boolean;
  /** 0..100: o quanto a cidade lembra da casa (a divulgação; cai sozinha). */
  divulgacao?: number;
  /** Um ano ruim de verdade (a falta de insumo, o surto, o escândalo) já aconteceu neste ano? */
  tCrise?: number;
  /** O mercado do negócio (o bairro que muda, a moda que passa): −0,35..+0,3 sobre a procura, anda devagar. */
  mercado?: number;
  restaurante?: {
    conceito: ConceitoRestaurante;
    culinaria: string;
    ingredientes: Nivel3;
    fornecedor: 'atacado' | 'local' | 'importador';
    chef?: ProfissionalChave;
    pratos: string[];
    ambiente: number;
    atendimento: number;
    prestigio: number;
    nota?: number;
    avaliacoes?: { t: number; nota: number; texto: string }[];
  };
  hotel?: {
    estrelas: 2 | 3 | 4 | 5;
    publico: 'negocios' | 'lazer' | 'familias' | 'luxo' | 'eventos';
    quartos: number;
    servicos: string[];
    atendimento: 'enxuto' | 'padrao' | 'personalizado';
    temporada: 'fixa' | 'dinamica' | 'pacotes';
    ocupacao?: number;
    diaria?: number;
  };
  clinica?: {
    especialidades: string[];
    atendimento: 'convenios' | 'misto' | 'particular';
    equipamento: number;
    conformidade: number;
    tInspecao?: number;
  };
  academia?: { modalidades: string[]; equipamentos: number; instrutores: number; retencao: string[]; evasao?: number };
  estudio?: { servicos: string[]; equipamento: number; tecnico?: ProfissionalChave; creditos: { t: number; texto: string }[]; proposta?: { t: number; artista: string; desconto: number } };
  loja?: { segmento: string; estoque: Nivel3; fornecedor: 'nacional' | 'importador' | 'direto'; variedade: number; online: boolean; encalhe: number };
  museu?: {
    linha: 'cultural' | 'equilibrada' | 'comercial';
    obras: ObraDoMuseu[];
    exposicao?: { tema: string; t: number; ate: number; qualidade: number; nome: string };
    curador?: ProfissionalChave;
    seguranca: number;
    patrocinio?: { nome: string; anual: number; ate: number };
  };
  zoo?: {
    recintos: RecintoDoZoo[];
    animais: AnimalDoZoo[];
    alimentacao: Nivel3;
    veterinarios: number;
    educacao: boolean;
    /** Os que já passaram (morreram, foram transferidos): a memória do zoológico. */
    memoria?: { t: number; texto: string }[];
  };
}

/* ------------------------------------------- REWORK 12.2 · negócios por fora */

export type TipoClandestino = 'mercadorias' | 'intermediacao' | 'rede_contrabando' | 'fraudes' | 'colecionaveis' | 'organizacao';

/** Um negócio por fora da lei, da pessoa. Abstrato: gente, dinheiro, risco e o que sobra — nunca como se faz. */
export interface NegocioClandestino {
  id: string;
  nome: string;
  tipo: TipoClandestino;
  ramo: Ramo;
  tInicio: number;
  /** O que se pôs (e o que está empatado nele). */
  capital: number;
  caixa: number;
  /** 0..100: o nome no meio (quem compra, quem fornece). */
  reputacao: number;
  /** 0..100: o quanto chama atenção (soma à exposição da pessoa). */
  exposicao: number;
  /** 0..2: tocado com cautela (0), no ritmo (1) ou acelerado (2). */
  ritmo: 0 | 1 | 2;
  socios: { pessoaId: string; parte: number }[];
  /** A organização rival que disputa o mesmo espaço (id em `organizacoes`). */
  rival?: string;
  /** A empresa legal que serve de fachada (id em `financas.empresas`). */
  fachadaId?: string;
  estado: 'ativo' | 'encerrado' | 'desmantelado' | 'tomado';
  tFim?: number;
  ultimo?: { t: number; receita: number; despesa: number; retirado: number; nota?: string };
  historia: { t: number; texto: string; tom?: 'bom' | 'ruim' }[];
}

/** Um ano de uma empresa, em números (o que se mostra; o caixa já mudou). */
export interface AnoDeEmpresa {
  t: number;
  /** Clientes, visitantes, hóspedes, pacientes, alunos (no ano). */
  publico: number;
  receita: number;
  custos: number;
  /** Patrocínio, convênios, incentivo (museu, zoológico). */
  apoio?: number;
  imposto: number;
  resultado: number;
  /** O que foi distribuído aos donos (o total; a sua parte é × parte). */
  distribuido: number;
  /** Uma linha do que marcou o ano. */
  nota?: string;
}

/** O que move dinheiro, para o extrato: renda e despesa do mês a mês, o que se põe e se tira das aplicações, e o resto. */
export type TipoMovimento = 'renda' | 'despesa' | 'rendimento' | 'aporte' | 'resgate' | 'divida' | 'familia' | 'acontecimento' | 'escolha' | 'ajuste' | 'por_fora';

/** Uma linha do extrato: quanto mexeu na conta e quanto mexeu nas aplicações (um aporte é −conta, +aplicado). */
export interface LinhaExtrato {
  rotulo: string;
  tipo: TipoMovimento;
  conta: number;
  aplicado: number;
}

/**
 * A conta de um período (em geral, um ano): saldo inicial + linhas = saldo
 * final, na conta e nas aplicações. Nenhum real some sem linha.
 */
export interface ExtratoDoAno {
  /** Quando o período começou (o fechamento anterior). */
  tInicio: number;
  /** Quando fechou (ausente enquanto aberto). */
  tFim?: number;
  contaInicial: number;
  aplicadoInicial: number;
  contaFinal?: number;
  aplicadoFinal?: number;
  linhas: LinhaExtrato[];
}

/**
 * A economia do país, em termos abstratos. Muda devagar, em fases, e é a
 * mesma para quem joga de novo com a mesma semente (não depende do que o
 * jogador faz). Ninguém lê um indicador: a pessoa sente pelo emprego, pelo
 * preço do aluguel, pelo rendimento do que guardou.
 *
 * Unidade de conta: REAIS DE HOJE. Todo valor do motor está corrigido pela
 * inflação (um salário de R$ 3.000 compra a mesma coisa em 2030 e em 2090).
 * A inflação existe e pesa — corrói o dinheiro parado, muda o rendimento
 * real da renda fixa —, mas não infla os números da tela.
 */
export type FaseEconomica = 'expansao' | 'normal' | 'desaceleracao' | 'crise' | 'recuperacao';

export interface Economia {
  /** Semente própria: o caminho da economia não depende das escolhas. */
  semente: number;
  fase: FaseEconomica;
  tFase: number;
  /** Inflação do último ano (0.045 = 4,5%). */
  inflacao: number;
  /** Juro básico real ao ano. */
  juroReal: number;
  /** Índice real de preço dos imóveis (1 = 2026). */
  imoveis: number;
  /** Índice real da bolsa (1 = 2026). */
  bolsa: number;
  /** Nível de preços acumulado desde 2026 (só para contar a inflação). */
  precos: number;
  /** Ano a ano (o último século cabe: ~100 linhas pequenas). */
  historico: { ano: number; fase: FaseEconomica; inflacao: number; bolsa: number; imoveis: number; juroReal: number }[];
}

/* ----------------------------------------------------------------- Moradia */

export interface Moradia {
  /** Com quem/onde mora. */
  tipo: 'pais' | 'aluguel' | 'propria' | 'republica' | 'parente' | 'cedida';
  municipioId: string;
  imovelId?: string;
  /** Tipo de moradia (`dados/bens`). Ausente enquanto mora com a família. */
  modeloId?: string;
  /** Aluguel mensal (quando aplicável). */
  aluguel: number;
  /** 1 (precária) .. 5 (muito boa). */
  padrao: number;
  tInicio: number;
  /** Onde fica, em palavras. */
  bairro?: string;
  /** O contrato de aluguel aceita animais. */
  aceitaPet?: boolean;
  /** Imóvel funcional (vila militar): cedido enquanto durar o vínculo. */
  funcional?: boolean;
  /** Com quantas pessoas divide o aluguel (república, dividir apartamento). */
  divide?: number;
  /** Morando de favor na casa de um parente: de quem é a casa (é ela que não "sai de casa"). */
  anfitriaoId?: string;
  /**
   * REWORK 12.05: menor de idade sob a guarda decidida pela Justiça (acolhimento: família acolhedora ou casa de
   * acolhimento), quando não há adulto da família que possa assumir. Só com `tipo: 'parente'` e sem `anfitriaoId`;
   * acaba na maioridade (`obrigacoes.casaSemFamilia`).
   */
  acolhimento?: true;
  /** Aluguel atrasado (meses). */
  atraso?: number;
  atrasoDesde?: number;
}

/**
 * A casa de origem. A `classe` é o ponto de partida (o que a família tinha
 * quando a pessoa nasceu), não o destino: o que a família PODE hoje vem da
 * renda real de quem a sustenta e da reserva que ela guardou — e isso muda
 * com os anos (`sistemas/origem`).
 */
export interface Origem {
  classe: Classe;
  /** Estrutura do lar em que nasceu. */
  arranjo: 'pais_juntos' | 'mae_solo' | 'pai_solo' | 'avos';
  /**
   * O que a casa de origem tem guardado (reais de hoje): a margem para uma
   * emergência, um curso, uma mudança. Cresce nos anos folgados, encolhe nos
   * apertados — e cada ajuda sai daqui. Não é infinita.
   */
  reserva?: number;
  /** As ajudas que passaram entre a pessoa e a família (as últimas). */
  apoios?: ApoioFamiliar[];
  /**
   * Adulto morando com a família: quanto põe nas contas de casa (escolha).
   * `combinado` = o que a casa precisa de quem tem renda; `nada`; `mais`.
   */
  contribuicao?: 'nada' | 'combinado' | 'mais';
  /** O bairro onde cresceu, em palavras (dado da origem, estável). */
  bairro?: string;
  /**
   * Sucessão: de quem é a reserva (a pessoa da casa de origem que ficou com o
   * dinheiro da família). Quando ela morre, a herança dela sai DESTA reserva
   * — a mesma que ajudou em vida —, e não de um sorteio pela classe.
   */
  reservaDe?: string;
  /** Quem assumiu a guarda (a menor órfã que vai morar com a irmã mais velha, com o avô, com a tia). */
  responsavelId?: string;
}

export interface ApoioFamiliar {
  t: number;
  valor: number;
  /** Para quê: estudo, mudança, emergência, dívida, casa. */
  motivo: 'estudo' | 'mudanca' | 'emergencia' | 'divida' | 'casa' | 'recomeco';
  /** Quem deu (família → você) ou para quem foi (você → família). */
  sentido: 'recebeu' | 'deu' | 'negado';
  pessoaId?: string;
}

/* ---------------------------------------------------------------- Processos */

export type Processo =
  | { tipo: 'gestacao'; id: string; tConcepcao: number; tParto: number; gestanteId: string; outroId?: string; descoberta: boolean; planejada: boolean; /** REWORK 11.5 · REL-21: a parceria que acha que é o outro genitor (a gravidez de um caso que ela não sabe). */ reconhecidoId?: string }
  | { tipo: 'adocao'; id: string; tInicio: number; tFim: number; parceiroId?: string }
  | { tipo: 'mudanca'; id: string; tEfetiva: number; destinoId: string; motivo: string }
  | { tipo: 'tratamento'; id: string; condicaoId: string; tFim: number; rede: 'sus' | 'particular' }
  | {
    tipo: 'cnh'; id: string; tInicio: number; tFim: number; tentativas: number;
    /** Aulas (esperando a data da prova) ou a prova teórica marcada (`sistemas/autoescola`). */
    fase?: 'aulas' | 'prova';
    /** Apostila estudada (0..3) e aulas extras (0..3): o que o personagem traz para a prova. */
    preparo?: number;
    pratica?: number;
    /** A teórica já passou (falta a prática). */
    teoricaOk?: boolean;
    tentativasPratica?: number;
    /** A prova teórica em andamento: as perguntas sorteadas, a da vez, os acertos. */
    prova?: { perguntas: string[]; atual: number; acertos: number };
  };

/* --------------------------------------------------------------- Biografia */

/**
 * Relevância de uma linha da Linha da Vida.
 *  - marco: muda a trajetória (nascimento, formatura, casamento, morte).
 *  - biografia: merece ser lembrado.
 *  - cotidiano: textura; aparece discreto.
 *  - tecnico: registro (dinheiro, rotina) — fica fora da biografia.
 */
export type Relevancia = 'marco' | 'biografia' | 'cotidiano' | 'tecnico';

export type Tema =
  | 'nascimento' | 'infancia' | 'familia' | 'amizade' | 'amor' | 'escola' | 'estudo'
  | 'trabalho' | 'dinheiro' | 'casa' | 'saude' | 'lugar' | 'lazer' | 'perda' | 'filhos' | 'morte' | 'escolha';

export interface Entrada {
  id: string;
  t: number;
  idade: number;
  texto: string;
  relevancia: Relevancia;
  tema: Tema;
  tom?: 'bom' | 'ruim' | 'neutro';
  pessoas?: string[];
  /** Foi uma escolha do jogador (e não algo que aconteceu). */
  escolha?: boolean;
  /** O acontecimento social, estruturado (para continuidade e para a Linha da Vida). */
  evento?: EventoSocial;
  /**
   * REWORK 4: o FATO por trás da frase (`conteudo/narracao`): o que aconteceu, com quem, onde, quanto durou, no que deu.
   * A frase é uma narração dele; anos depois, a vida pode lembrar do fato (não da frase). Opcional.
   */
  fato?: { tipo: string; dados: Record<string, string | number> };
  /**
   * REWORK 7.5: o acontecimento é CONSEQUÊNCIA de outro, já escrito (o id da entrada de origem): a despedida segue a
   * morte, a homenagem segue a perda, a etapa seguinte de um processo segue a escolha que o abriu. Só se escreve
   * quando o motor SABE a origem (nunca por semelhança); a Linha da Vida usa para agrupar e dizer "por causa de".
   */
  segue?: string;
}

export type TipoEvento =
  | 'amizade' | 'amizade_fim' | 'reencontro' | 'namoro' | 'termino' | 'reconciliacao' | 'uniao' | 'casamento' | 'divorcio'
  | 'traicao' | 'traicao_descoberta' | 'gravidez' | 'filho_nasceu' | 'filho_saiu' | 'filho_voltou' | 'filho_marco'
  | 'neto_nasceu' | 'virou_avo' | 'virou_bisavo' | 'morte' | 'viuvez' | 'despedida' | 'ruptura';

export interface EventoSocial {
  tipo: TipoEvento;
  pessoaId?: string;
  /** Peso narrativo 0..100 (a morte do cônjuge pesa mais que a de um primo distante). */
  peso?: number;
}

/** Uma perda sendo atravessada. O peso diminui com os anos; a rede de apoio ajuda. */
export interface Luto {
  pessoaId: string;
  t: number;
  /** O impacto de AGORA (cai com os anos; some abaixo de 6 — a perda continua na biografia e na história de vocês). */
  peso: number;
  /** Como o jogador escolheu atravessar a despedida (quando escolheu). */
  como?: string;
  /** REWORK 7.5: o tamanho da perda quando aconteceu (não muda; sem ele, saves de antes usam o peso de agora). */
  inicial?: number;
  /** REWORK 7.5: quando o luto foi reavivado (outra perda grande, o primeiro ano sem a pessoa numa data que importa). */
  reativado?: number;
}

/* ---------------------------------------------------------------- Momentos */

/**
 * Uma decisão aguardando o jogador. Os textos ficam gravados (não são
 * regenerados) para que recarregar o save mostre exatamente o mesmo momento.
 */
export interface Momento {
  id: string;
  situacaoId: string;
  t: number;
  titulo: string;
  texto: string;
  tema: Tema;
  /** Pessoas envolvidas, por papel. */
  papeis: Record<string, string>;
  /** `detalhe`: o que a escolha muda, dito ANTES de escolher ("a faculdade fica trancada"). */
  /** `resgate`: a opção custa mais do que há na conta, e as aplicações cobrem esse valor (tirar é escolha do jogador). */
  opcoes: { id: string; texto: string; bloqueio?: string; detalhe?: string; resgate?: number }[];
  /** REWORK 7.5: a entrada de que esta decisão é desdobramento (a etapa anterior do processo; a morte, na despedida). */
  segue?: string;
}

/** REWORK 11.5 · EVT-01: uma decisão do ano esperando a vez (o conteúdo e as pessoas — o texto é feito ao abrir). */
export interface DecisaoNaFila {
  id: string;
  /** O ano (instante) para o qual ela vale. Uma adiada vale para o ano seguinte, uma vez. */
  t: number;
  papeis: Record<string, string>;
  prioridade: number;
  /** Disparada pelo estado e de peso (não espera: é deste ano). */
  urgente?: boolean;
  /** Já foi adiada uma vez (de um ano cheio para o seguinte). */
  adiada?: boolean;
  /** A entrada da biografia de que ela é consequência (a escolha que a trouxe). */
  segue?: string;
}

/* ------------------------------------------------------------------- Rotina */

/** Algo que a pessoa faz regularmente, até decidir parar. */
export interface Rotina {
  id: string;
  tInicio: number;
  /** Intensidade: 1 leve (por diversão) · 2 regular (aulas, treino) · 3 a sério (base, banda, preparação pesada). */
  nivel?: 1 | 2 | 3;
  /** Atividade de uma instituição (o time DA escola, o grêmio DA faculdade): a chave dela. Trocar de instituição encerra a atividade. */
  instituicao?: string;
}

/* ---------------------------------------------------------------- Caminhos */

/**
 * Frentes: aquilo em que uma pessoa pode ficar boa — um esporte, uma arte,
 * uma matéria, um ofício. Cada frente separa quatro coisas que a vida real
 * separa: a FACILIDADE (aptidão, sorte de nascença, derivada da semente e
 * nunca guardada), o INTERESSE (vontade de continuar), a EXPERIÊNCIA (meses
 * de prática de verdade) e a HABILIDADE (o resultado). Nada disso aparece
 * como número: a interface fala em frases.
 */
export type Dominio =
  // esporte
  | 'futebol' | 'volei' | 'natacao' | 'atletismo' | 'lutas' | 'basquete' | 'tenis'
  // arte
  | 'musica' | 'teatro' | 'danca' | 'desenho' | 'escrita' | 'fotografia'
  // escola e estudo
  | 'exatas' | 'linguagens' | 'ciencias' | 'humanas' | 'xadrez' | 'programacao' | 'idiomas'
  // social
  | 'lideranca' | 'comunidade'
  // ofício
  | 'cozinha' | 'manual' | 'beleza' | 'vendas' | 'campo';

export interface Frente {
  /** Vontade de continuar, 0..100. Cresce com a prática que dá certo; esfria quando para. */
  interesse: number;
  /** Meses de prática, ponderados pela intensidade. */
  meses: number;
  /** O que foi desenvolvido, 0..100. */
  habilidade: number;
  tInicio: number;
  /** Última vez que praticou (ano de vida). */
  tUltimo: number;
  /** Quantas vezes parou e voltou. */
  retomadas: number;
  /** Maior habilidade já alcançada (para "já tocou bem, um dia"). */
  auge: number;
}

export type TipoMarcaCaminho =
  | 'comecou' | 'destaque' | 'conquista' | 'fracasso' | 'oportunidade' | 'estreia' | 'abandono' | 'retomada'
  | 'primeiro_emprego' | 'formacao' | 'ingresso' | 'promocao' | 'demissao' | 'mudanca_carreira'
  | 'aprovacao' | 'reprovacao' | 'profissional' | 'fim_carreira' | 'negocio_aberto' | 'negocio_fechado'
  | 'volta_estudos' | 'aposentadoria' | 'lideranca' | 'estagnacao' | 'mudanca_cidade'
  | 'transferencia' | 'reserva' | 'pausa' | 'retorno' | 'prisao' | 'saida_prisao' | 'recomeco' | 'desvio'
  | 'politica' | 'candidatura' | 'eleicao' | 'derrota' | 'fim_politica'
  | 'vivencia' | 'independencia';

/** Um marco do caminho profissional/educacional, estruturado (dado para a Linha da Vida). */
export interface MarcaCaminho {
  t: number;
  tipo: TipoMarcaCaminho;
  texto: string;
  /** 1 corriqueiro · 2 importante · 3 muda a vida. */
  peso: 1 | 2 | 3;
  dominio?: Dominio;
  trilha?: string;
  ocupacaoId?: string;
  pessoaId?: string;
}

export type TipoOportunidade =
  | 'vaga' | 'indicacao' | 'aprendiz' | 'estagio' | 'temporario' | 'peneira' | 'seletiva' | 'banda' | 'grupo'
  | 'clientela' | 'convite' | 'retomar' | 'bolsa' | 'selecao_tecnico' | 'proposta'
  | 'edital_cultura' | 'reinsercao' | 'atualizacao' | 'funcao'
  /** Um professor chamou para a iniciação científica, a monitoria, um projeto (REWORK 3). */
  | 'iniciacao';

/**
 * Uma porta que a vida abriu AGORA, por um motivo (a escola divulgou, um
 * amigo indicou, o treinador viu jogar). Expira. Aceitar é escolha.
 */
export interface Oportunidade {
  id: string;
  tipo: TipoOportunidade;
  titulo: string;
  texto: string;
  tInicio: number;
  tFim: number;
  ocupacaoId?: string;
  dominio?: Dominio;
  pessoaId?: string;
  municipioId?: string;
  /** Bônus de chance que a porta dá (indicação pesa). */
  bonus?: number;
  /** O convite é para uma atividade (a rotina que começa ao aceitar): a olimpíada, a iniciação científica. */
  atividade?: string;
  /**
   * REWORK 11 · Fase B: o que a porta É para a carreira de agora (`indicacoes.naturezaDaOportunidade`): uma vaga de
   * emprego, uma mudança de carreira, uma atividade por conta, um trabalho ocasional. Opcional: sem o campo (saves
   * antigos), a natureza é deduzida do tipo e da ocupação.
   */
  natureza?: NaturezaDaOportunidade;
}

/** REWORK 11 · Fase B — a natureza de uma oportunidade de trabalho (o rótulo e as consequências que a tela diz antes). */
export type NaturezaDaOportunidade = 'emprego' | 'mudanca_carreira' | 'por_conta' | 'ocasional' | 'sociedade' | 'investimento' | 'propria';

/** Carreira esportiva: base, profissional, encerrada. */
export interface CarreiraEsportiva {
  modalidade: Dominio;
  fase: 'base' | 'profissional' | 'encerrada';
  clube: string;
  /** 1 amador/regional · 2 divisões de acesso · 3 segunda divisão nacional · 4 elite. */
  nivel: 1 | 2 | 3 | 4;
  tInicio: number;
  tFase: number;
  lesoes: number;
  /** Onde o clube fica (a base pode ser longe de casa). */
  municipioId: string;
  tFim?: number;
  motivoFim?: 'dispensa' | 'lesao' | 'idade' | 'escolha' | 'sem_contrato' | 'suspensao';
  /** No profissional: joga como titular ou espera no banco. */
  espaco?: 'titular' | 'reserva';
  /** Até quando vai o contrato atual (a renovação é uma decisão). */
  contratoAte?: number;
  /** O jeito de treinar: forçar (evolui mais, machuca mais) ou preservar o corpo. */
  foco?: 'forcar' | 'preservar';
  /** Suspenso pelo controle antidoping até (sem jogar, sem contrato). */
  suspensoAte?: number;
  /** Aceitou uma substância proibida (o risco de o exame pegar fica). Nunca descreve o quê. */
  doping?: number;
  /** Onde joga (futebol). Não é enfeite: decide o que a temporada mede e como o corpo envelhece em campo. */
  posicao?: Posicao;
  /**
   * O nome no mercado, 0..100: o que as temporadas construíram. É o que os
   * clubes olham para oferecer, renovar, pagar — e o que faz o público
   * conhecer (`notoriedade`).
   */
  reputacao?: number;
  /** As últimas temporadas, em poucos números (as mais antigas saem). */
  temporadas?: Temporada[];
  /** REWORK 5: os números da carreira INTEIRA (as temporadas guardam só as 30 últimas) e as transferências com taxa. */
  totais?: { temporadas: number; partidas: number; gols: number; assistencias: number; minutos: number };
  /** A taxa é na moeda (no poder de compra) do país do clube comprador — `pais` (REWORK 11 · ESP-11.5; ausente: saves antigos). */
  transferencias?: { t: number; de: string; para: string; taxa: number; pais?: string }[];
  /** O salário do contrato atual (fonte única: `esporte.salarioDoContrato`). */
  salarioContrato?: number;
  /**
   * A proposta de clube na mesa (pacote pós-REWORK 3): criada UMA vez, com
   * clube, cidade, divisão, prazo e salário fixados; a decisão mostra ESTA
   * proposta e, se aceita, ESTA proposta é executada (`esporte.transferirPara`).
   * Nada é sorteado de novo depois do sim.
   */
  proposta?: PropostaDeClube;
  /** A cláusula do contrato assinado: o salário que passa a valer se ganhar a posição (dito na proposta, cumprido aqui). */
  clausulaTitular?: number;
  /** A representação nacional (a seleção, a equipe do país, o índice): o radar, as convocações, os jogos — o mundo observa a carreira (`selecao`). */
  selecao?: TrajetoriaNaSelecao;
  /** Por onde se chegou ao profissional: a base (o caminho comum) ou o campeonato amador (a rota tardia). */
  origem?: 'base' | 'amador';
  /**
   * Empréstimo em curso: o clube DETENTOR (dono do contrato) cedeu o atleta
   * por um período a outro clube (`clube`, o atual). Termina em `ate`: volta
   * ao detentor — ou o clube atual compra, se houver proposta aceita.
   */
  emprestimo?: { clube: string; municipioId: string; nivel: 1 | 2 | 3 | 4; desde: number; ate: number };
  /**
   * REWORK 11 · ESP-11.2: o que a carreira fez de cada atributo da posição/função (o desvio em relação à técnica, ±14;
   * `atributosEsportivos`). Ausente (saves antigos): o atributo é a técnica ± o traço de nascença.
   */
  atributos?: Partial<Record<string, number>>;
  /**
   * REWORK 11 · ESP-11.6: os lances que os momentos do ano somaram (o gol da virada, a defesa no fim) — entram na
   * temporada EM CURSO, antes do palmarés e dos prêmios dela (`fecharTemporada`), nunca na que já fechou.
   */
  lances?: { gols?: number; assistencias?: number; semSofrerGol?: number; podios?: number; ouro?: number };
  /**
   * REWORK 11 · sem clube: a marca EXPLÍCITA de "sem clube" (o contrato acabou e ninguém renovou) e o último clube.
   * Presente = sem clube agora: `clube`/`municipioId`/`nivel` continuam guardando o último vínculo (de onde o mercado
   * parte), mas nenhuma tela os mostra como atuais (`esporte.clubeAtual`). Sai ao assinar com alguém.
   */
  ultimoClube?: { clube: string; municipioId: string; nivel: 1 | 2 | 3 | 4; ate: number };
  /** REWORK 11 · ESP-11.6: capitão do clube (o clube e desde quando; sai ao trocar de clube). */
  capitao?: { clube: string; desde: number };
}

/** Uma proposta concreta de clube (ou de empréstimo): o que se viu é o que se assina. */
export interface PropostaDeClube {
  id: string;
  clube: string;
  /** A cidade do clube (a mudança, se houver, é para cá). */
  municipioId: string;
  nivel: 1 | 2 | 3 | 4;
  /** Prazo do contrato, em meses. */
  meses: number;
  /** Salário mensal bruto para começar (como reserva, se o clube é maior) — e se ganhar a posição. */
  salario: number;
  salarioTitular: number;
  /** Começa como titular (clube menor que quer o seu jogo) ou briga por posição. */
  espaco: 'titular' | 'reserva';
  t: number;
  /** Até quando vale a resposta. */
  validaAte: number;
  /**
   * REWORK 5 — o dinheiro da transferência, separado do seu: `taxa` é o que o clube que compra PAGA ao clube que vende
   * (não entra na sua conta); `luvas` é o que VOCÊ recebe na assinatura. Ausentes: sem taxa (livre, empréstimo, liberação).
   */
  taxa?: number;
  luvas?: number;
  /** De onde veio (ATT Mundo: 'exterior' é o clube de outro país que buscou quem brilha na elite): o mercado reagiu à temporada, o empresário buscou (maior, menor), o clube quis liberar, a volta de quem estava sem clube. */
  origem: 'mercado' | 'maior' | 'menor' | 'liberacao' | 'sem_clube' | 'emprestimo' | 'compra' | 'exterior';
}

/** A trajetória na seleção nacional: só existe depois que o radar ligou. */
export interface TrajetoriaNaSelecao {
  /** Quando o nome entrou na lista de observados. */
  radar: number;
  convocacoes: number;
  jogos: number;
  gols: number;
  tPrimeira?: number;
  tEstreia?: number;
  /** A última convocação (o corte é ficar de fora). */
  tUltima?: number;
  /** Titular nas últimas convocações. */
  titular?: boolean;
  capitao?: boolean;
  /** Os torneios de seleções disputados (ano, nome, campanha). */
  torneios: { ano: number; nome: string; campanha: string; jogos: number }[];
  /** Nas modalidades individuais: medalhas em competições internacionais pelo país. */
  medalhas?: number;
  /** O país da seleção (a nacionalidade escolhida; ausente: o Brasil, nas vidas anteriores ao mundo). */
  pais?: string;
}

/** Uma situação de carreira aberta (`situacoes`): o modelo e o contexto sorteado (o minuto, o placar, o caso). */
export interface SituacaoAberta { id: string; t: number; dados: Record<string, string | number> }

/** Uma situação vivida: a intenção, o desfecho (do ótimo ao péssimo) e a frase do que aconteceu. */
export interface RegistroDeSituacao {
  id: string;
  t: number;
  /** A trajetória em que aconteceu ("futebol", "medicina", "emprego"...). */
  trajetoria: string;
  intencao: string;
  desfecho: 'otimo' | 'bom' | 'ruim' | 'pessimo';
  texto: string;
}

/**
 * A carreira de técnico (Carreira de técnico 2.0). Não é "um emprego com
 * outro nome": cada passagem tem clube real, divisão, temporadas jogadas
 * partida a partida (V/E/D saem da simulação: a força do elenco, o trabalho
 * do técnico, o vestiário, o acaso), títulos, acessos, rebaixamentos, a
 * pressão da diretoria e o jeito como acabou. A carreira de jogador fica onde
 * estava (`caminhos.esporte`/`carreirasEsportivas`): as duas convivem.
 */
export interface CarreiraDeTecnico {
  tInicio: number;
  /** Como chegou ao banco (a biografia, não um menu). */
  origem: 'auxiliar' | 'ex_atleta' | 'convite';
  /** O nome no mercado de técnicos, 0..100: o que os clubes olham para chamar, renovar, pagar. Não decide jogo. */
  reputacao: number;
  /** O jeito de jogar (escolha tática que muda o desenho dos jogos: mais vitórias e derrotas, ou mais empates). */
  estilo?: 'ofensivo' | 'equilibrado' | 'defensivo';
  /** As passagens, em ordem (a última pode estar aberta: sem `ate`). */
  passagens: PassagemDeTecnico[];
  /** A proposta na mesa (criada UMA vez; a decisão mostra esta e, se aceita, executa esta). */
  proposta?: PropostaDeTecnico;
  /** Sem clube desde (entre uma passagem e outra). */
  semClubeDesde?: number;
  /** Quantos convites chegaram (aceitos ou não). */
  convites?: number;
  /** A carreira acabou (outra profissão, aposentadoria, anos sem clube). */
  tFim?: number;
  motivoFim?: string;
}

export interface PassagemDeTecnico {
  clube: string;
  municipioId: string;
  /** A divisão do clube agora (muda com acesso e rebaixamento). */
  nivel: 1 | 2 | 3 | 4;
  /** Seleção nacional (a passagem não é de clube). */
  selecao?: boolean;
  desde: number;
  ate?: number;
  contratoAte: number;
  salario: number;
  temporadas: TemporadaDeTecnico[];
  saida?: 'demissao' | 'proposta' | 'fim_de_contrato' | 'saiu' | 'encerrou' | 'selecao';
  /** Quando o emprego acabou por fora (a mudança, a aposentadoria): o motivo, como o histórico de trabalho o guardou. */
  motivo?: string;
  renovacoes?: number;
  /** A pressão da diretoria, 0..100 (o cargo cai perto do alto). Nunca aparece como número. */
  pressao: number;
  /** O vestiário, 0..100 (50 = nada a dizer). Pesa nos jogos. */
  vestiario: number;
  /** Ajuste de força do elenco para a próxima temporada (reforços, preparação, titulares poupados). */
  ajuste?: number;
  /** A decisão (a final do estadual) que ficou para o momento — ou para o sorteio neutro, se o ano não a mostrar. */
  /** `unica` (REWORK 11 · ESP-11.8): final em jogo único (a copa nacional de fora do Brasil); sem ela, ida e volta. */
  decisao?: { competicao: string; adversario: string; forca: number; ano: number; t: number; unica?: boolean };
  /** Quando renovou pela última vez (o momento da renovação lê isto). */
  tRenovacao?: number;
  /** A passagem começou no meio da temporada (o clube em crise demitiu o técnico e chamou você): de onde se pegou o time. */
  meioDeTemporada?: { rodada: number; rodadas: number; posicao: number };
  /** A tabela do dia em que se assumiu (só até a primeira temporada ser jogada: dela em diante, os jogos são seus). */
  retomada?: TabelaEmCurso;
}

/**
 * A liga no dia em que o clube em crise demitiu o técnico: as rodadas já
 * jogadas SEM você, a pontuação dos 20 e a força de cada um (índice 0: o
 * clube, só o elenco — o técnico novo entra por cima). A proposta mostra
 * ISTO, e a temporada parcial continua DAQUI.
 */
export interface TabelaEmCurso {
  rodada: number;
  rodadas: number;
  posicao: number;
  /** O que a diretoria esperava daquele elenco (a posição pela força). */
  esperada: number;
  pontos: number[];
  forcas: number[];
}

export interface TemporadaDeTecnico {
  ano: number;
  nivel: 1 | 2 | 3 | 4;
  /** Jogos dirigidos (estadual + liga, ou só os da seleção): J = V + E + D. */
  jogos: number;
  v: number;
  e: number;
  d: number;
  /** Na liga: a colocação ao fim (ou no dia da saída, se saiu no meio). */
  colocacao?: number;
  /** O estadual: até onde foi. */
  estadual?: 'campeão' | 'vice' | 'semifinal' | 'primeira fase';
  /** REWORK 11 · ESP-11.8: fora do Brasil, a copa nacional (id estável de `competicoes`) e até onde foi. */
  copa?: { id: string; fase: FaseDeCopa };
  titulos?: string[];
  acesso?: boolean;
  rebaixamento?: boolean;
  /** Saiu no meio da temporada (demissão, proposta): os números são até ali. */
  parcial?: boolean;
  /** Chegou no meio da temporada: dirigiu da rodada seguinte a esta em diante (os números são só desses jogos). */
  desdeRodada?: number;
  /** Seleção: os torneios disputados no ano e a campanha. */
  torneio?: string;
  /** REWORK 11.5 · ESP-03: os rivais mais fortes da divisão naquele ano (clubes do catálogo) e o campeão, se não foi o seu. */
  rivais?: string[];
  campeao?: string;
}

export interface PropostaDeTecnico {
  id: string;
  clube: string;
  municipioId: string;
  nivel: 1 | 2 | 3 | 4;
  meses: number;
  salario: number;
  t: number;
  validaAte: number;
  origem: 'mercado' | 'sem_clube' | 'selecao' | 'crise';
  selecao?: boolean;
  /** Contratação no meio da temporada (`origem: 'crise'`): a tabela do dia — a mesma que a temporada parcial continua. */
  meioDeTemporada?: TabelaEmCurso;
}

/**
 * Uma conquista esportiva PERMANENTE (o palmarés): título, acesso,
 * rebaixamento, prêmio individual, marco. Fica depois que a carreira acaba
 * (`caminhos.palmares`), e a tela de carreira a lê; a Linha da Vida recebe
 * só os marcos biográficos.
 */
export interface ConquistaEsportiva {
  /** `final`: a final perdida (no tênis, a final de torneio é parte da história). */
  tipo: 'titulo' | 'acesso' | 'rebaixamento' | 'premio' | 'marco' | 'selecao' | 'final';
  modalidade: Dominio;
  ano: number;
  t: number;
  /** "Série A", "campeonato estadual", "torneio mundial de seleções", "seleção do campeonato". */
  competicao: string;
  clube?: string;
  /** No título: foi peça central (titular na maior parte) ou parte do elenco. */
  papel?: 'protagonista' | 'elenco';
  /** O texto curto, como a carreira mostra. */
  texto: string;
  /** REWORK 11 · ESP-11.3: a competição pelo id estável (`competicoes.CompeticaoId`); o nome é apresentação. */
  competicaoId?: string;
  /** REWORK 11 · ESP-11.6: um id estável por conquista (a galeria de troféus lê por ele). Só nos títulos. */
  trofeuId?: string;
}

export type Posicao = 'goleiro' | 'lateral' | 'zagueiro' | 'volante' | 'meia' | 'ponta' | 'atacante';

/** A fase alcançada numa copa (mata-mata): até onde se foi. */
export type FaseDeCopa = 'primeira fase' | 'oitavas' | 'quartas' | 'semifinal' | 'vice' | 'campeão';

/** Uma temporada fechada: poucos números, com consequência. */
export interface Temporada {
  ano: number;
  clube: string;
  nivel: 1 | 2 | 3 | 4;
  posicao?: Posicao;
  partidas: number;
  titular: number;
  gols: number;
  assistencias: number;
  /**
   * Defensor: desarmes/cortes decisivos (abstrato). Goleiro, nos saves antigos: jogos sem sofrer gol — desde o
   * REWORK 11 (ESP-11.1) o goleiro usa `semSofrerGol`/`golsSofridos` (leitura: `esporte.semSofrerGolDe`).
   */
  defesa?: number;
  /** REWORK 11 · ESP-11.1 — goleiro: jogos sem sofrer gol e gols sofridos nos jogos dele (do placar do time). */
  semSofrerGol?: number;
  golsSofridos?: number;
  /** REWORK 11 · ESP-11.5: o país do clube naquela temporada (a liga e a moeda daquele ano) e a liga pelo id estável. */
  pais?: string;
  competicaoId?: string;
  /** REWORK 11 · ESP-11.3: as copas do ano (copa nacional, continental de clubes): o id e a fase alcançada. */
  copas?: { id: string; fase: FaseDeCopa; jogos: number; final?: string }[];
  /** REWORK 11 · ESP-11.6: foi capitão do clube nesta temporada. */
  capitao?: boolean;
  /** A nota da temporada, 0..10 (o que o clube e o mercado leram). */
  nota: number;
  /** Onde o time terminou (1 = campeão). */
  colocacao: number;
  /** Meses fora por lesão. */
  mesesFora: number;
  /** REWORK 5 (futebol): os minutos em campo na temporada (titular joga quase o jogo todo; quem entra, o fim). */
  minutos?: number;
  /** Basquete: pontos, rebotes e assistências POR JOGO (a função em quadra decide o perfil). */
  pontos?: number;
  rebotes?: number;
  /** Tênis: vitórias e derrotas no ano, títulos, o ranking ao fim, e o dinheiro (bruto e custos do circuito). */
  vitorias?: number;
  derrotas?: number;
  titulos?: number;
  ranking?: number;
  premio?: number;
  custos?: number;
  /** Tênis: finais disputadas (vencidas e perdidas), a melhor fase do ano e os torneios que marcaram (nomes do universo do jogo). */
  finais?: number;
  /** Tênis: os pontos do ranking que o ano somou (a rodada alcançada em cada torneio × o peso dele); o ranking sai daqui. */
  pontosRanking?: number;
  melhorFase?: string;
  torneios?: { nome: string; fase: string }[];
  /** A temporada foi de empréstimo: o clube detentor do contrato. */
  emprestado?: string;
  /** Basquete e vôlei: a função em quadra naquela temporada. */
  funcao?: string;
  /** Vôlei: os sets jogados e o que a função produziu neles (totais da temporada; a recepção, em %, de quem passa). */
  volei?: { sets: number; pontos: number; bloqueios: number; aces: number; levantamentos: number; defesas: number; recepcao?: number };
  /** Natação e atletismo: a prova, a melhor marca do ano (segundos ou metros), se foi recorde pessoal, e o ano de competições. */
  prova?: { nome: string; unidade: 's' | 'm'; marca: number; recorde?: boolean; finais: number; podios: number; vitorias: number };
  /** Luta: a categoria de peso e o cartel do ano (sem empate: a chave decide), os títulos e pódios, a maior sequência de vitórias. */
  luta?: { categoria: string; lutas: number; vitorias: number; derrotas: number; antesDoTempo: number; titulos: number; podios: number; sequencia: number };
}

/** Um projeto artístico coletivo (banda, grupo de teatro, companhia). */
export interface ProjetoArtistico {
  linguagem: Dominio;
  nome: string;
  tipo: 'banda' | 'grupo' | 'companhia' | 'canal';
  tInicio: number;
  /** Quanta gente conhece o trabalho, 0..100. */
  publico: number;
  membros: string[];
  ativo: boolean;
  tFim?: number;
}

/** O último ano no palco (música, teatro, dança): valor contratado, custos e o que ficou (`sistemas/palco`). */
export interface Palco {
  ano: number;
  linguagem: Dominio;
  apresentacoes: number;
  /** Valor contratado médio de uma apresentação (bruto). */
  cacheMedio: number;
  /** Tudo o que os contratantes pagaram no ano. */
  bruto: number;
  /** Equipe, produção, transporte, agência, impostos. */
  custos: number;
  /** O que ficou para o artista no ano (antes do imposto pessoal). */
  artista: number;
  /** REWORK 11.5 · ART-02: os freelas do ano de quem vive de música (aulas, gravações para outros, estúdio), no ano. */
  freelas?: number;
}

/** Um trabalho artístico que saiu para o mundo (disco, peça, exposição, livro, série de fotos). */
export interface Obra {
  t: number;
  titulo: string;
  linguagem: Dominio;
  /** Como foi recebido: 0 passou em branco · 1 teve público · 2 repercutiu · 3 marcou. */
  recepcao: 0 | 1 | 2 | 3;
  /** O que rendeu (reais, no ano). */
  renda: number;
  /** Indicação ou prêmio (fictício, do universo desta vida) que a obra recebeu. */
  premio?: { nome: string; venceu: boolean };
  /**
   * REWORK 11 · ATR-06: a recepção do PÚBLICO (vendas, plays, bilheteria), separada da crítica (`recepcao`, que segue
   * sendo a nota da crítica e é o que os prêmios leem). Saves de antes: ausente = igual à `recepcao`.
   */
  comercial?: 0 | 1 | 2 | 3;
}

/** Um trabalho no currículo artístico (projetos são fictícios, do universo desta vida). */
/**
 * Quem representa a pessoa no audiovisual (FIX 3.1): não é bônus mágico. A
 * rede (1 pequena · 2 média · 3 grande) decide a que testes se chega e quanto
 * se negocia; a comissão sai de todo cachê.
 */
export interface AgenteArtistico { nome: string; pessoaId?: string; rede: 1 | 2 | 3; comissao: number; tInicio: number }

/** Um trabalho no audiovisual (ou no teatro contratado): da proposta ao que foi feito. */
export interface ContratoAV {
  id: string;
  tipo: ItemCurriculo['tipo'];
  /** Título FICTÍCIO da produção (do universo desta vida). */
  titulo: string;
  /** A casa (genérica: "uma emissora de TV aberta"). */
  casa: string;
  papel: string;
  /** O tamanho da produção (0 pequena … 3 grande). */
  porte: 0 | 1 | 2 | 3;
  /** Quanto dura a produção (meses). */
  meses: number;
  /** Pede dedicação integral no período (não cabe com outro trabalho de dia inteiro). */
  integral: boolean;
  /** Bruto → comissão do agente → despesas → líquido. */
  bruto: number;
  comissao: number;
  despesas: number;
  status: 'proposta' | 'em_producao' | 'concluido' | 'rompido' | 'recusado' | 'expirou';
  tProposta: number;
  tInicio?: number;
  tFim?: number;
  pessoaId?: string;
  negociado?: boolean;
  /** REWORK 10.5 · CAR-06: a ficha da produção (fictícia): gênero, sinopse, a personagem — e se veio de convite direto. */
  genero?: string;
  sinopse?: string;
  personagem?: string;
  convite?: boolean;
  /** REWORK 10.5 · CAR-11: a continuação de uma produção que a carreira fez (a temporada, a sequência, a remontagem). */
  continuacaoDe?: string;
}

export interface ItemCurriculo {
  t: number;
  /** Onde/como: teatro, festival, publicidade, curta, série, novela, filme, show, espetáculo. */
  tipo: 'teatro' | 'festival' | 'publicidade' | 'curta' | 'serie' | 'novela' | 'filme' | 'show' | 'espetaculo' | 'edital';
  titulo: string;
  /** O papel ou a função ("protagonista", "elenco", "figuração", "direção"). */
  papel: string;
  /** A casa, a produtora, o grupo (fictícios ou genéricos). */
  onde?: string;
  /** 0 passou em branco · 1 teve público · 2 repercutiu · 3 marcou. (REWORK 11: a nota da CRÍTICA — o prestígio e os prêmios.) */
  repercussao: 0 | 1 | 2 | 3;
  /** REWORK 11 · ATR-06: a recepção do PÚBLICO (audiência, bilheteria) — o nome e a demanda. Ausente = igual à `repercussao`. */
  publico?: 0 | 1 | 2 | 3;
  /** Cachê (reais). */
  cache?: number;
  /** Alguém que se conheceu ali (diretora, colega de elenco). */
  pessoaId?: string;
  /**
   * Indicação ou prêmio (fictício, do universo desta vida) pelo trabalho. REWORK 10.5 · CAR-09: com a categoria (a da
   * obra e do papel), a edição (o ano), a obra e o alcance da premiação.
   */
  premio?: { nome: string; venceu: boolean; categoria?: string; edicao?: number; obra?: string; alcance?: 'local' | 'nacional' | 'internacional' };
  /** REWORK 10.5 · CAR-11: a identidade estável da produção (o id do contrato) e de qual ela é continuação. */
  producaoId?: string;
  continuacaoDe?: string;
  /** REWORK 10.5 · CAR-06: o porte, o gênero e a personagem (a ficha do papel). */
  porte?: 0 | 1 | 2 | 3;
  genero?: string;
  personagem?: string;
}

/** A carreira acadêmica como vida: não é só o cargo — é o que se pesquisa, quem se orienta, o que se publica. */
export interface VidaAcademica {
  /** A linha de pesquisa (a área, em palavras). */
  linha?: string;
  /** Projetos iniciados e concluídos. */
  projetos: number;
  /** Projeto em andamento (termina em `tFim`). */
  projeto?: { titulo: string; tInicio: number; tFim: number; financiado?: boolean };
  /** Orientações feitas (alunos que concluíram com você). */
  orientacoes: number;
  /** Alunos que você orienta agora (ids de pessoas). */
  orientandos: string[];
  /** Artigos e trabalhos publicados. */
  publicacoes: number;
  /** Colaborações com outros grupos. */
  colaboracoes: number;
  /** Financiamentos conquistados (editais de pesquisa). */
  financiamentos: number;
  /** Quando fez cada coisa pela última vez (o ritmo de cada ação). */
  ultimas: Record<string, number>;
  /**
   * A obra acadêmica, item por item (generalização de carreiras): o artigo, o
   * livro, o congresso, a orientação, o financiamento, o prêmio. Os contadores
   * acima continuam sendo a conta; aqui fica o que foi feito.
   */
  producao?: ItemAcademico[];
}

/** Um item da trajetória acadêmica (títulos fictícios, do universo desta vida). */
export interface ItemAcademico {
  t: number;
  tipo: 'artigo' | 'livro' | 'congresso' | 'orientacao' | 'financiamento' | 'projeto' | 'premio' | 'colaboracao';
  titulo: string;
  /** Onde, com quem, a revista (genérica). */
  detalhe?: string;
  /** 0 passou · 1 lido na área · 2 citado · 3 referência. */
  impacto?: 0 | 1 | 2 | 3;
}

/** Uma intenção persistente: o que se tenta, quantas vezes, o que pesou por último. */
export interface Objetivo {
  /** Chave estável: "curso:mestrado", "peneira:futebol", "concurso:professor_univ". */
  id: string;
  titulo: string;
  tentativas: number;
  tPrimeira: number;
  tUltima: number;
  /** O último resultado. */
  resultado?: 'passou' | 'nao_passou';
  /** O que mais pesou contra, em palavras (da mesma conta do motor). */
  obstaculo?: string;
  /** O que dá para fazer (quando é controlável). */
  caminho?: string;
  /** Alcançado em. */
  tAlcancado?: number;
}

/** Preparação para concurso: meses de estudo acumulados (esfriam se parar). */
/** Para onde o estudo de concurso está dirigido (o edital de polícia não cobra o mesmo que o de tribunal). */
export type FocoConcurso = 'policial' | 'administrativo' | 'fiscal' | 'bancario' | 'educacao' | 'saude' | 'academico';

export interface PreparoConcurso {
  meses: number;
  /** A direção do estudo (sem foco: estudo geral, que serve a tudo um pouco). */
  foco?: FocoConcurso;
  /** Meses estudados desde que o foco atual foi escolhido (o que mais conta para os editais dessa área). */
  mesesFoco?: number;
  tentativas: number;
  aprovacoes: number;
  ultimaTentativa?: number;
  /** Aprovado fora das vagas: pode ser chamado até `tAte`. */
  reserva?: { ocupacaoId: string; tAte: number };
}

/** Um pequeno negócio ou trabalho por conta com clientela. */
export interface Negocio {
  tipo: string;
  nome: string;
  ocupacaoId: string;
  tInicio: number;
  /** Dinheiro posto no começo. */
  capital: number;
  /** Clientela / movimento, 0..100. */
  clientela: number;
  estado: 'comecando' | 'firme' | 'apertado' | 'fechado';
  anosNoVermelho: number;
  socioId?: string;
  tFim?: number;
  /** Resultado do último ano além da sua retirada: o que ficou no caixa (+) ou o que faltou (−). */
  resultadoAno?: number;
  /** O que entrou no último ano (vendas, serviços). */
  faturamentoAno?: number;
  /** O lucro do último ano, antes do dono (o negócio inteiro). */
  lucroAno?: number;
  /** O que o dono tirou para viver no último ano (pró-labore). */
  retiradaAno?: number;
  /** O que saiu da sua conta no último ano para cobrir o prejuízo do negócio. */
  devolvidoAno?: number;
  /** Soma dos resultados desde a abertura (sem contar a retirada mensal). */
  acumulado?: number;
  /**
   * O caixa do negócio: o que sobra fica aqui, o que falta sai daqui (e,
   * quando acaba, do seu bolso). Não é o seu dinheiro — retirar é decisão.
   */
  caixa?: number;
  /** Tamanho: 1 pequeno · 2 médio (ampliado) · 3 grande. Mais porte, mais freguesia possível — e mais custo. */
  porte?: 1 | 2 | 3;
  /** Quantos pontos (unidades) o negócio tem. */
  unidades?: number;
  /** Quem trabalha para você: gente de verdade, com nome (vira gente da sua vida). */
  equipe?: Funcionario[];
  /** Reputação, 0..100: o que se fala do negócio. Cresce com o tempo bem feito; cai com crise e demissão. */
  reputacao?: number;
  /**
   * O jeito de vender (mudar é decisão; cada um cobra e rende de um jeito).
   * Nem todo jeito existe para todo negócio: loja on-line não tem freguesia
   * de bairro; consultório não vende em plataforma (`dados/negocios`).
   */
  estrategia?: EstrategiaNegocio;
  /**
   * Quanto da vida o negócio ocupa. `integral`: é o trabalho (o emprego de
   * dono). `paralela`: tocado nas horas vagas, ao lado de outro trabalho ou
   * do estudo — cresce mais devagar, não paga retirada fixa, pede parte da
   * semana. Ausente = integral (saves antigos).
   */
  dedicacao?: 'integral' | 'paralela';
  /** O que já foi feito no negócio e continua valendo (equipamento, especialidade, canal novo). */
  melhorias?: string[];
  /** Quanto do negócio é do sócio (0..1). Ausente com sócio = metade. */
  parteSocio?: number;
  /** Abriu sem conhecer o ramo (o começo é mais duro, e o fracasso ensina). */
  semEstrada?: boolean;
  /** Empréstimo que financiou a abertura (fica, mesmo se o negócio fechar). */
  dividaId?: string;
  /** Começou pequeno, em casa (pouco custo, pouca freguesia possível). */
  emCasa?: boolean;
  /** Resultado de cada um dos últimos anos (o que se sabe do negócio quando alguém quer comprar). */
  historico?: number[];
  /** Nas mãos da equipe (ou do sócio): o dono se afastou (um mandato, por exemplo) e só recebe o que sobra. */
  passivo?: boolean;
  /** Ficou numa cidade de onde o dono se mudou: de longe, só dá para receber o que sobra (tocar de novo, só voltando para lá). */
  ficouEm?: string;
}

export type EstrategiaNegocio = 'bairro' | 'qualidade' | 'preco' | 'online' | 'escala' | 'marca';

/** Alguém que trabalha no seu negócio. */
export interface Funcionario {
  pessoaId: string;
  tInicio: number;
  /** O que faz ("atendente", "ajudante de cozinha"). */
  funcao: string;
  salario: number;
}

/** Uma etapa de um processo seletivo em andamento (uma pergunta, um momento do teste). */
export interface EtapaProcesso {
  id: string;
  /** Qual abordagem o jogador escolheu. */
  resposta?: string;
  /** Como a abordagem caiu naquele contexto (−1..1). Nunca aparece como número. */
  nota?: number;
}

/**
 * Um processo seletivo em andamento: a entrevista de emprego, a peneira.
 * Tentar é uma pequena experiência em etapas, não um sorteio num clique.
 */
export interface ProcessoSeletivo {
  tipo: 'entrevista' | 'peneira';
  ocupacaoId?: string;
  dominio?: Dominio;
  municipioId?: string;
  /** Peso da porta (indicação, estágio, convite do treinador). */
  bonus: number;
  via: string;
  etapas: EtapaProcesso[];
  atual: number;
  /** Nome do lugar (empresa, clube) — fixo durante o processo. */
  lugar?: string;
}

/** O que ficou de uma tentativa: o retorno que a pessoa recebeu. */
export interface Devolutiva {
  t: number;
  tipo: 'entrevista' | 'peneira' | 'concurso' | 'arte' | 'vestibular' | 'selecao';
  titulo: string;
  texto: string;
  passou: boolean;
  /** Ficou perto: vale tentar de novo. */
  perto?: boolean;
  /** O que mais pesou contra (para o jogador saber o que trabalhar). */
  falta?: 'experiencia' | 'formacao' | 'entrevista' | 'tecnica' | 'fisico' | 'leitura' | 'nervos' | 'idade' | 'concorrencia' | 'preparo' | 'publico' | 'pesquisa' | 'projeto' | 'historico' | 'area' | 'materia';
  ocupacaoId?: string;
  /** Seleção de curso (mestrado, doutorado): qual. */
  cursoId?: string;
  dominio?: Dominio;
  /**
   * Em que ponto a pessoa estava nessa tentativa (0 começo … 4 muito
   * competitivo), na régua do próprio processo: o preparo do concurso, a
   * técnica na peneira, o currículo na vaga. É o que deixa a próxima
   * devolutiva dizer "desde a última vez, melhorou".
   */
  nivel?: number;
  /**
   * Vestibular: a área que mais tirou pontos na PROVA e a que a PREPARAÇÃO
   * apontava antes dela (a mesma conta, `vestibular.areaQueMaisPesa`). Quando
   * diferem, foi o dia — e a devolutiva diz isso.
   */
  fraca?: string;
  fracaPrevista?: string;
}

/** REWORK 9 · FUT-01: a tabela de um país no universo da vida — em que divisão cada clube está (`sistemas/ligas`). */
export interface LigaDoPais {
  /** A última temporada já jogada (a divisão guardada vale para a seguinte). */
  ano: number;
  div: Record<string, 1 | 2 | 3 | 4>;
  /** `classificados` (REWORK 11 · ESP-11.3): os clubes da elite que terminaram nas vagas da copa continental do ano seguinte. */
  ultima?: { ano: number; campeoes: Partial<Record<1 | 2 | 3 | 4, string>>; subiram: string[]; cairam: string[]; classificados?: string[] };
  /**
   * REWORK 11.5 · ESP-01: a FORMA de cada clube (−0,8..0,8, em degraus de força): o que as últimas temporadas deixaram
   * (a boa fase que se sustenta um tempo, a má que pesa). Nasce dos resultados, nunca do nome. Ausente: 0.
   */
  forma?: Record<string, number>;
}

export interface Caminhos {
  /**
   * REWORK 11 · ESP-11.7: a licença de treinador (C=1, B=2, A=3, Pro=4) — da pessoa, não do emprego (vale de um clube
   * para o outro); `emCurso`: o nível que está sendo cursado e quando termina (`oficioDoTecnico`).
   */
  licencaDeTreinador?: { nivel: number; t: number; emCurso?: { nivel: 1 | 2 | 3 | 4; ate: number } };
  /** REWORK 9: as ligas de futebol dos países onde a vida jogou ou dirigiu (opcional; nasce quando se precisa). */
  ligas?: Record<string, LigaDoPais>;
  /** REWORK 9 · PROG-01: o que cada frente andou, por fonte, desde o último fechamento de ano (zera na fotografia). */
  praticaDoPeriodo?: Partial<Record<Dominio, Record<string, number>>>;
  /** Processo seletivo em andamento (a decisão aberta é uma etapa dele). */
  processo?: ProcessoSeletivo;
  /** Perguntas de entrevista usadas recentemente (para não repetir) e quantas entrevistas já fez. */
  entrevistas: { recentes: string[]; feitas: number };
  /** Os retornos das últimas tentativas. */
  devolutivas: Devolutiva[];
  frentes: Partial<Record<Dominio, Frente>>;
  marcas: MarcaCaminho[];
  oportunidades: Oportunidade[];
  concurso: PreparoConcurso;
  esporte?: CarreiraEsportiva;
  arte?: ProjetoArtistico;
  negocio?: Negocio;
  /** Carreira nas Forças Armadas (força, quadro, especialidade, guarnição). */
  militar?: CarreiraMilitar;
  /** Produção rural: de onde vem a terra, o que se produz, como foi a safra. */
  rural?: VidaRural;
  /** Envolvimento com atividade ilegal (abstrato: risco e consequência, nunca procedimento). */
  envolvimento?: Envolvimento;
  /** A vida política: da reunião de bairro ao mandato — e à volta para casa. */
  politica?: VidaPolitica;
  /** A obra: projetos lançados e como foram recebidos (carreira artística viva). */
  obras?: Obra[];
  /** O último ano de apresentações (quem vive do palco, ou a banda que toca por fora). */
  palco?: Palco;
  /**
   * O currículo artístico: os TRABALHOS feitos (a peça em que atuou, o
   * festival, a publicidade, a série) — diferente das obras próprias. Fica
   * depois que a carreira pausa ou acaba (`sistemas/cena`).
   */
  curriculo?: ItemCurriculo[];
  /** Audiovisual (FIX 3.1): o agente e os contratos (propostas, produções, o que foi feito). */
  audiovisual?: { agente?: AgenteArtistico; contratos: ContratoAV[] };
  /**
   * Objetivos perseguidos: o que a pessoa tenta e retenta (o mestrado, a
   * peneira, o concurso). Memória de intenção, não lista de tarefas
   * (`sistemas/objetivos`): nasce das devolutivas, com a mesma causa.
   */
  objetivos?: Objetivo[];
  /** A vida acadêmica (docência e pesquisa): linha, projetos, orientações, produção (`sistemas/academia`). */
  academia?: VidaAcademica;
  /** O palmarés esportivo: títulos, acessos, prêmios, marcos — permanente (pacote pós-REWORK 3). */
  palmares?: ConquistaEsportiva[];
  /**
   * Carreiras esportivas ANTERIORES (encerradas) que uma carreira nova
   * substituiu em `esporte`: a trajetória passada continua sendo da pessoa.
   */
  carreirasEsportivas?: CarreiraEsportiva[];
  /** Os anos de palco (o histórico de `palco`, que guarda só o último). */
  palcos?: { ano: number; linguagem: Dominio; apresentacoes: number; bruto: number }[];
  /**
   * REWORK 11 · MUS-02: o papel na música, quando escolhido (carreira solo, integrante de banda, instrumentista contratado
   * por outros artistas, compositor). Ausente: deduzido do estado (`musica.papelNaMusica`).
   */
  papelMusica?: 'solo' | 'banda' | 'contratado' | 'compositor';
  /** A situação de carreira deste ano, esperando a escolha (o contexto fica guardado: o texto não muda no reload). */
  situacao?: SituacaoAberta;
  /** As situações de carreira vividas: a intenção escolhida e o que aconteceu (memória da vida profissional). */
  situacoes?: RegistroDeSituacao[];
  /**
   * A carreira de técnico de futebol (Carreira de técnico 2.0): clubes,
   * passagens, jogos, títulos, demissões — a gramática do banco, separada da
   * carreira de jogador (`esporte`), que continua consultável.
   */
  tecnico?: CarreiraDeTecnico;
  /**
   * REWORK 11.5 · ESP-04: a trajetória de treinador de goleiros (na comissão de um clube): o degrau (1 a base, 2 o
   * profissional, 3 a seleção), o nome no meio, os goleiros que passaram pelas suas mãos e os técnicos com quem trabalhou.
   */
  treinadorDeGoleiros?: { tInicio: number; clube: string; degrau: 1 | 2 | 3; reputacao: number; revelados: number; tecnicos: number; historico: { ano: number; texto: string }[] };
  /** Última vez que cada gerador de oportunidade abriu algo (evita repetir). */
  ultimas: Record<string, number>;
  /**
   * Uma trajetória nova que não cabe junto com o que já existe (a base e a
   * faculdade, o negócio e o emprego): esperando o jogador decidir. O jogo
   * nunca resolve isso sozinho (`sistemas/compromissos`).
   */
  pendente?: CompromissoPendente;
}

/** Algo que entraria na vida — e com o que conflita. */
export type NovoCompromisso =
  | { tipo: 'base'; dominio: Dominio; municipioId: string; clube: string }
  | { tipo: 'contrato_esporte'; nivel: number }
  | { tipo: 'emprego'; ocupacaoId: string; via: string; texto?: string; bonus?: number; extra?: 'rural_familia' | 'rural_arrendada' | 'arte'; pessoaId?: string; /** Retomar uma trajetória pausada (índice em `trabalho.pausadas`). */ retoma?: number;
    /** REWORK 11 · Fase B: a troca do trabalho de agora já foi decidida (o acontecimento que contrata disse): não se pergunta de novo. Opcional. */
    substitui?: boolean;
    /** REWORK 11 · Fase B: o que a contratação ajusta no emprego novo (guardado com a pergunta). Opcional. */
    ajuste?: AjusteDeEmprego }
  | { tipo: 'negocio'; negocioId: string; modo: 'guardado' | 'pequeno' | 'emprestimo' | 'socio'; socioId?: string }
  | { tipo: 'dedicar_negocio' }
  | { tipo: 'servico_militar' }
  /** Aprovado num curso (ou voltando a um trancado): a matrícula só entra depois de caber no resto da vida. */
  | { tipo: 'curso'; cursoId: string; via: string; modalidade: 'presencial' | 'ead'; rede: 'publica' | 'privada'; mensalidade: number; municipioId: string; instituicao: string; destrancar?: boolean; /** A especialidade de uma residência médica. */ especialidade?: EspecialidadeMedica };

/** REWORK 11 · Fase B — o ajuste de uma contratação fora da vaga comum (`compromissos.contratarComAnalise`). */
export interface AjusteDeEmprego {
  posAposentadoria?: boolean;
  especialidade?: string;
  /** Freguesia que já vem junto (os clientes antigos de quem passa a trabalhar por conta). */
  clientelaMais?: number;
  /** O salário mínimo combinado (a proposta que trouxe a mudança). */
  salarioMinimo?: number;
}

/** Um plano possível diante do conflito: o que se larga, o que se tenta conciliar. */
export interface PlanoDeConflito {
  texto: string;
  /** O que acontece se escolher (dito antes). */
  consequencias: string[];
  /** Ids do que é deixado (`curso`, `emprego`, `base`, `negocio_fechar`, `negocio_paralelo`, `emprego_guardado`...). */
  larga: string[];
  /** Aceita tudo e segura a semana acima do que cabe. */
  conciliar?: boolean;
  /** Plano que não aceita o novo (quando recusar é possível, ele vem por último). */
  recusa?: boolean;
}

export interface CompromissoPendente {
  novo: NovoCompromisso;
  t: number;
  /** O que a vida está oferecendo, em palavras ("a base do Bahia"). */
  oferta: string;
  /** Com o que conflita, em palavras. */
  conflitos: string[];
  planos: PlanoDeConflito[];
  /** A pergunta já foi aberta (um momento não se descarta: sem ele, a oferta passou). */
  perguntado?: boolean;
}

export type Forca = 'exercito' | 'marinha' | 'aeronautica';

/**
 * Carreira militar: a mesma arquitetura para as três Forças (formação,
 * antiguidade, cursos, transferências, reserva), com nomes e lugares próprios.
 */
export interface CarreiraMilitar {
  forca: Forca;
  /** Temporário (serviço inicial, engajamento), praça de carreira ou oficial. */
  quadro: 'temporario' | 'praca' | 'oficial';
  tIngresso: number;
  /** Especialidade escolhida na formação (o que se leva para a vida civil). */
  especialidade?: Especialidade;
  /** Onde serve agora e desde quando (transferências vêm de tempos em tempos). */
  guarnicao: string;
  tGuarnicao: number;
  /** Cursos de carreira feitos (aperfeiçoamento, altos estudos). */
  cursos: string[];
  transferencias: number;
  /** Último teste físico em que não passou (atrasa promoção). */
  tafFalhou?: number;
  /** As guarnições por onde passou (a primeira e cada transferência), em ordem. */
  guarnicoes?: { municipioId: string; t: number }[];
  /** Emprego civil que ficou guardado durante o serviço inicial (Lei 4.375/1964, art. 60). */
  empregoGuardado?: Emprego;
}

export type Especialidade = 'combatente' | 'saude' | 'manutencao' | 'comunicacoes' | 'administracao' | 'musica';

export interface VidaRural {
  terra: 'familia' | 'arrendada' | 'propria';
  cultura: 'lavoura' | 'leite' | 'horta' | 'misto';
  cooperativa: boolean;
  tInicio: number;
  ultimaSafra?: 'boa' | 'normal' | 'ruim';
  /** Anos seguidos de safra ruim (o que leva a vender, arrendar ou largar). */
  anosRuins: number;
  /** As safras, ano a ano (a história da terra): o resultado da região e o que a pessoa fez dele. */
  safras?: { ano: number; resultado: 'boa' | 'normal' | 'ruim'; coop?: boolean }[];
}

/**
 * Envolvimento com atividade ilegal. O jogo trabalha com oportunidade →
 * decisão → risco → consequência; nada aqui descreve como fazer.
 */
/** REWORK 10 · CRI-01: `corrupcao` — o desvio de quem tem cargo (a propina, a obra superfaturada), outra porta, outra gente. */
export type CategoriaIlicita = 'pequenos' | 'patrimonial' | 'fraude' | 'mercado' | 'grupo' | 'corrupcao';
/** REWORK 10: o que pode virar processo — o envolvimento com o ilícito e o que se faz a alguém (a agressão, a ameaça). */
export type CategoriaDoProcesso = CategoriaIlicita | 'violencia';

export interface Envolvimento {
  categoria: CategoriaIlicita;
  /** 1 de vez em quando · 2 frequente · 3 preso a um grupo. */
  nivel: 1 | 2 | 3;
  tInicio: number;
  /** Quanto o que se faz está à vista (0..100). Cresce com o tempo e a escalada. */
  exposicao: number;
  /** Quem trouxe (a pessoa da vida que abriu a porta). */
  contatoId?: string;
  /** Dinheiro que entrou por esse caminho (para a biografia e as métricas). */
  ganhos: number;
  /** Parou (e desde quando). O passado não some: a exposição ainda pode chegar. */
  parou?: number;
  /** Na moita: menos dinheiro, menos exposição (escolha do jogador na pergunta do rumo). */
  cautela?: boolean;
  /**
   * Desde quando há uma investigação (alguém começou a fazer perguntas). Não
   * é processo ainda: pode virar processo — ou ser arquivada, se o que existe
   * contra a pessoa esfria (parar, a moita).
   */
  investigado?: number;
  /**
   * REWORK 10 · CRI-01 — a trajetória (não uma barra): a confiança que o meio deposita em você (0..100: os trabalhos
   * maiores só chegam a quem tem), os contatos (as pessoas do caminho, além de quem abriu a porta), os trabalhos maiores
   * já feitos, os atritos com o grupo, e a saída negociada (o que se pagou para sair sem pressão). Todos opcionais.
   */
  reputacao?: number;
  contatos?: string[];
  trabalhos?: number;
  atritos?: number;
  saidaNegociada?: number;
  /** Quem procurou ajuda para sair (a família, um programa) — e quando. */
  ajuda?: number;
  /** REWORK 11 · SUB-02: quantos anos ativos não renderam nada (o crime não é salário). */
  anosSecos?: number;
  /** REWORK 11 · SUB-03: contatos que traíram (falaram o seu nome para quem não devia). */
  traicoes?: number;
  /** REWORK 11.5 · SUB-11: as especializações (cada uma com a sua prática, o seu nome e o seu risco). */
  especializacoes?: Partial<Record<Ramo, Especializacao>>;
  /** REWORK 11.5 · SUB-12: o que cada contato do caminho é, quer e lembra (por id de pessoa). */
  fichas?: Record<string, FichaDeContato>;
  /** REWORK 11.5 · SUB-13: as organizações do caminho com que se tem relação (e o que elas lembram). */
  organizacoes?: RelacaoComOrganizacao[];
  /** REWORK 11.5 · SUB-14: o que aconteceu no caminho, ano a ano (decisões, perdas, apreensões, saídas). */
  diario?: { t: number; texto: string; tom?: 'bom' | 'ruim' }[];
  /** REWORK 11.5: dívida com o caminho (o que se deve a quem adiantou mercadoria ou cobriu um prejuízo). */
  divida?: number;
  /** REWORK 11.5: quem está em cada cena do caminho deste ano (id da decisão → id da pessoa). */
  cenas?: Record<string, string>;
  /** REWORK 11.5: a organização de cada cena deste ano (id da decisão → id da organização). */
  cenasOrg?: Record<string, string>;
  /** REWORK 12.2: os negócios por fora que a pessoa abriu, comprou ou de que é sócia (os encerrados ficam, com a história). */
  negocios?: NegocioClandestino[];
  /** REWORK 12.2: o que se comprou num mercado paralelo sabendo (ou devendo saber) a origem — pesa se vier à tona. */
  receptacao?: number;
  /** REWORK 12.25: a carreira (a prática geral, o patamar alcançado, os marcos, se o crime virou a ocupação principal). */
  carreira?: CarreiraCriminal;
  /** REWORK 12.25: as encomendas — as que chegam (propostas de contatos e organizações) e as que se encomendam a alguém. */
  encomendas?: EncomendaCriminal[];
  /** REWORK 12.25 · NAR-12.25-01: as decisões sobre o rumo (com o motivo): a pergunta não volta sem razão. */
  rumo?: { t: number; escolha: 'parar' | 'mudar' | 'moita' | 'seguir' | 'fundo' | 'sair_aos_poucos'; motivo?: string }[];
  /** REWORK 12.25: tentando sair aos poucos (desde quando): o que se tem vai sendo desfeito, e o caminho termina no prazo. */
  saindo?: number;
  /** REWORK 12.25: o que a família sabe e como reage (por id de pessoa). */
  familia?: Record<string, ReacaoDaFamilia>;
  /** REWORK 12.25: as cenas novas deste ano (id da decisão → id da pessoa ou da organização). */
  cenas125?: Record<string, string>;
}

/** REWORK 12.25 — a carreira no Submundo como profissão: a prática geral, os patamares, os marcos. */
export interface CarreiraCriminal {
  /** A prática geral do caminho (cresce com o que se faz, dá certo ou não). */
  xp: number;
  /** O maior patamar já alcançado: 0 começo · 1 experiente · 2 influente · 3 liderança · 4 grande escala. */
  patamar: 0 | 1 | 2 | 3 | 4;
  /** Os marcos da carreira (a primeira encomenda, o primeiro posto, quando virou a ocupação principal...). */
  marcos: { t: number; texto: string }[];
  /** O crime virou a ocupação principal (desde quando) — reconhecido pela vida, não declarado. */
  principal?: number;
  /** Quantas operações seguidas deram errado (o jogo evita a sequência infinita de fracassos). */
  falhasSeguidas?: number;
}

/** REWORK 12.25 — uma encomenda: abstrata (o tipo, a gravidade, o valor, o risco, o prazo) — nunca como se faz. */
export interface EncomendaCriminal {
  id: string;
  /** Recebida (alguém propõe a você) ou delegada (você encomenda a alguém). */
  direcao: 'recebida' | 'delegada';
  ramo: Ramo;
  /** A chave do tipo de trabalho (`encomendas.TIPOS`). */
  tipo: string;
  gravidade: 1 | 2 | 3;
  /** Quem propõe (recebida) ou quem executa (delegada). */
  pessoaId?: string;
  orgId?: string;
  /** Recebida: o pagamento combinado. Delegada: o custo adiantado. */
  valor: number;
  /** Delegada: o retorno esperado se der certo. */
  retorno?: number;
  /** A chance de dar certo (0..1) e a exposição se der errado. */
  chance: number;
  risco: number;
  t: number;
  /** Recebida: até quando a proposta vale. Delegada: quando o resultado chega. */
  tPrazo: number;
  estado: 'aberta' | 'em_andamento' | 'concluida' | 'falhou' | 'recusada' | 'expirou' | 'traida';
  /** Já se negociou (uma vez só). */
  negociada?: boolean;
  resultado?: string;
  tFim?: number;
}

/** REWORK 12.25 — o que um familiar sabe do caminho e como reage (a personalidade, a relação, a gravidade). */
export interface ReacaoDaFamilia {
  /** 1 desconfia · 2 sabe. */
  sabe: 1 | 2;
  postura: 'apoia' | 'preocupada' | 'rejeita' | 'pede_para_sair' | 'reconciliada';
  t: number;
  /** A última conversa sobre isso (para não repetir a cena todo ano). */
  tConversa?: number;
}

/**
 * REWORK 12.25 — uma organização do mundo do crime (fictícia), que existe sem o jogador: o tipo (pelo país e pelo ramo),
 * a força, a coesão, a hierarquia com os nomes dela, o quadro de gente com nome, a liderança e a sucessão, as alianças e
 * rivalidades, a influência por região da cidade e a história. A relação do jogador com ela fica em `RelacaoComOrganizacao`
 * (mesmo id).
 */
export interface OrgViva {
  id: string;
  nome: string;
  /** O estilo (dá os nomes da hierarquia e o jeito de falar dela). */
  estilo: 'faccao' | 'familia' | 'rede' | 'circulo' | 'coletivo' | 'turma' | 'sindicato';
  ramo: Ramo;
  municipioId: string;
  /** 0..100: o tamanho e o alcance. */
  forca: number;
  /** 0..100: o quanto está unida (baixa: disputa interna). */
  coesao: number;
  /** A pressão da Justiça e da sociedade sobre ela (0..100). */
  pressao: number;
  /** A gente com nome: liderança, quem sobe, quem cai (sem virar pessoa da vida até o jogador conhecer). */
  quadro: MembroDaOrg[];
  aliadas: string[];
  rivais: string[];
  /** A influência em cada região da cidade (0..100). */
  influencia: Record<string, number>;
  /** A sucessão aberta (a liderança vaga): os candidatos e o apoio do jogador. */
  disputa?: { t: number; candidatos: string[]; apoio?: string; motivo: string };
  /** A prioridade que a liderança escolheu (o jogador, quando lidera). */
  prioridade?: 'expandir' | 'consolidar' | 'discricao' | 'negocios';
  estado: 'ativa' | 'enfraquecida' | 'extinta';
  historia: { t: number; texto: string }[];
  desde: number;
}

/** Um nome do quadro de uma organização (vira `Pessoa` só quando o jogador o conhece: `pessoaId`). */
export interface MembroDaOrg {
  id: string;
  nome: string;
  genero: Genero;
  tNasc: number;
  /** 0..6: a posição na hierarquia (6 = quem manda). */
  nivel: number;
  desde: number;
  estado: 'ativo' | 'preso' | 'morto' | 'saiu';
  pessoaId?: string;
}

/** REWORK 12.25: o mundo do crime que a vida conhece (as organizações das cidades por onde o caminho passou). */
export interface MundoCriminal {
  orgs: Record<string, OrgViva>;
  /** A região da cidade onde a pessoa mora (o nome da região; muda com a mudança). */
  regiao?: { municipioId: string; id: string };
  /** A voz dos moradores e do comércio de cada região (0..100): a comunidade também age. */
  comunidade?: Record<string, number>;
  tAtualizado: number;
  /** O que ficou de quem veio antes (sucessão): as organizações que lembram o nome da família, e de quem. Não é cargo. */
  legado?: { orgs: string[]; nome: number; de: string; t: number };
}

/**
 * REWORK 11.5 · SUB-11 — as especializações do Submundo. Ficção abstrata: o que muda é a gente, o risco e a conta; nada
 * descreve como se faz.
 */
export type Ramo = 'furtos' | 'contrabando' | 'organizado' | 'digital' | 'fraudes';

export interface Especializacao {
  /** Desde quando atua nela. */
  tInicio: number;
  /** A prática acumulada (0..100): cresce com os anos e as operações; parte dela vale para as vizinhas. */
  experiencia: number;
  /** O nome que se tem NESTA especialidade (0..100) — diferente da confiança geral do meio. */
  nome: number;
  /** Operações feitas · que deram errado · ganho bruto acumulado. */
  operacoes: number;
  falhas: number;
  ganhos: number;
  /** Deixou esta especialidade (e desde quando). */
  largou?: number;
  /** A última operação (para a recarga). */
  ultima?: number;
  /** Na hierarquia (só `organizado`): 1 de fora · 2 de dentro · 3 de confiança · 4 liderança. */
  posto?: 1 | 2 | 3 | 4;
  /** O mercado (só `contrabando`): o quanto a procura está alta (−2..2), muda ano a ano. */
  mercado?: number;
  /** Mercadoria/estoque adiantado e ainda não vendido (só `contrabando`), em dinheiro. */
  estoque?: number;
}

/** O papel de um contato do caminho (quem ele é para você). */
export type PapelDoContato = 'parceiro' | 'fornecedor' | 'comprador' | 'chefe' | 'protegido' | 'intermediario' | 'tecnico' | 'informante';

/** REWORK 11.5 · SUB-12: a ficha de um contato — não um multiplicador. */
export interface FichaDeContato {
  papel: PapelDoContato;
  especialidade: Ramo;
  /** A confiança de um no outro, no caminho (0..100) — diferente da amizade. */
  confianca: number;
  /** O que ele espera de você (a parte combinada, a lealdade, discrição). */
  espera: 'parte' | 'lealdade' | 'discricao' | 'volume';
  /** O que ficou entre vocês: promessas cumpridas e quebradas, favores. */
  cumpridas: number;
  quebradas: number;
  /** De que organização ele é (id da organização do caminho). */
  organizacao?: string;
  /** Afastou-se (e quando): não traz mais trabalho. */
  afastado?: number;
  /** Traiu (e quando). */
  traiu?: number;
  desde: number;
  /**
   * REWORK 12.25 — favores e dívidas entre vocês: positivo, ele deve a você; negativo, você deve a ele (cada favor é um).
   * Com memória (`historia`) e consequência: a dívida esquecida é cobrada; o favor devido abre portas.
   */
  favores?: number;
  /** REWORK 12.25: a amizade (0..100), diferente da confiança no caminho: quem é amigo perdoa um atraso, quem não é cobra. */
  amizade?: number;
  /** REWORK 12.25: o que ele quer da vida agora (muda com o tempo — e muda o que ele aceita). */
  interesse?: 'dinheiro' | 'subir' | 'sair' | 'familia' | 'vinganca' | 'seguranca';
  /** REWORK 12.25: a última vez de cada ação com ele (tipo → quando) e o quanto a confiança já subiu neste ano por conversa. */
  tAcoes?: Record<string, number>;
  ganhoNoAno?: { t: number; x: number };
  /** REWORK 12.25: o que aconteceu entre vocês (no máximo 10 linhas). */
  historia?: { t: number; texto: string; tom?: 'bom' | 'ruim' }[];
  /** REWORK 12.25: reconciliou-se (e quando) depois de se afastar. */
  reconciliado?: number;
}

/** REWORK 11.5 · SUB-13: uma organização fictícia do caminho e a relação com ela (com memória). */
export interface RelacaoComOrganizacao {
  id: string;
  nome: string;
  especialidade: Ramo;
  /** Membro (com posto em `organizado`), aliado, rival ou de fora. */
  relacao: 'membro' | 'aliada' | 'rival' | 'neutra';
  /** A lealdade que ela lê em você (0..100). */
  lealdade: number;
  /** O que ela lembra: promessas, alianças, conflitos, saídas (o ano e o fato). */
  memoria: { t: number; fato: 'promessa' | 'promessa_quebrada' | 'alianca' | 'conflito' | 'traicao' | 'saida' | 'favor' | 'reconciliacao' }[];
  desde: number;
  /** Saiu (e quando): a organização lembra de quem saiu. */
  saiu?: number;
  /** REWORK 12.2: a organização é da pessoa (ela fundou e comanda): o negócio-base e quem divide o comando. */
  propria?: { negocioId?: string; tenentes: string[]; coesao: number };
  /** REWORK 12.25: a posição na hierarquia (0 associado … 6 quem manda), para quem é de dentro. */
  nivel?: number;
  /** REWORK 12.25: o último pedido feito à organização (por tipo → quando), para não virar máquina de apertar botão. */
  pedidos?: Record<string, number>;
  /** REWORK 12.25: expulso (e quando). */
  expulso?: number;
}

/* ------------------------------------------------------------- Vida política */

/** Cargos eletivos que a vida pode alcançar (presidência fica fora do jogo). */
export type CargoEletivo = 'vereador' | 'prefeito' | 'deputado_estadual' | 'deputado_federal' | 'senador' | 'governador';

/** Prioridades de mandato ou de bandeira: metas de gestão, nunca ideologia. */
export type Prioridade = 'saude' | 'educacao' | 'mobilidade' | 'emprego' | 'seguranca' | 'ambiente' | 'contas' | 'cultura';

/**
 * A vida política como trajetória: não é emprego, não é concurso. As fases
 * são estados de VIDA diferentes: estar envolvido (reunião, causa, bairro),
 * filiado, candidato (campanha como processo), com mandato, entre mandatos
 * (derrotado ou fora do cargo, mas ainda no meio) e fora (encerrada).
 */
export interface VidaPolitica {
  fase: 'envolvido' | 'filiado' | 'candidato' | 'eleito' | 'mandato' | 'entre_mandatos' | 'encerrada';
  tInicio: number;
  /** Por onde a pessoa entrou (a biografia, não uma escolha de menu). */
  origem: 'comunidade' | 'estudantil' | 'sindicato' | 'causa' | 'notoriedade' | 'empresario' | 'servidor' | 'convite' | 'decisao';
  /** Partido (fictício) e desde quando. */
  partido?: string;
  tFiliacao?: number;
  /**
   * Militar da ativa não se filia (CF, art. 142, §3º, V; art. 42, §1º), mas
   * é elegível: basta ser escolhido em convenção e ter o registro pedido pelo
   * partido (TSE, Res. 21.608/2004, art. 14, §1º). `partido` é então o que o
   * indicou, sem filiação. Fora da ativa, a filiação volta a ser exigida.
   */
  indicacaoMilitar?: boolean;
  /** Quanto a pessoa é conhecida, 0..100. */
  reputacao: number;
  /** Base de apoio: quem votaria, quem ajudaria, 0..100. */
  apoio: number;
  /** Desgaste acumulado (crises, promessas, anos de cargo executivo), 0..100. */
  desgaste: number;
  /** REWORK 10.5 · POL-04: de onde vem o desgaste (a soma nunca passa dele; o que sobra é de antes do registro). */
  causasDesgaste?: Partial<Record<'exposicao' | 'campanha' | 'mandato' | 'promessas' | 'derrota' | 'escandalo' | 'partido', number>>;
  /** A bandeira (fora do cargo) ou a prioridade do mandato. */
  prioridade?: Prioridade;
  /** A campanha em curso (registrada; resultado na apuração). */
  campanha?: { cargo: CargoEletivo; tEleicao: number; financiamento?: 'pequenas' | 'proprio' | 'empresario'; rua?: 'porta' | 'redes' | 'aliancas'; tom?: 'propostas' | 'ataques' | 'cautela'; gasto: number; nota: number; etapa: number };
  /** Eleito, esperando a posse. */
  posse?: { cargo: CargoEletivo; t: number };
  /** O mandato em exercício. */
  mandato?: { cargo: CargoEletivo; tInicio: number; tFim: number; aprovacao: number; feito: number; crise?: { t: number; tipo: string }; /** O que aconteceu durante o exercício (as crises, os momentos, o que foi entregue). */ marcos?: string[] };
  /** Mandatos seguidos no mesmo cargo executivo (para a regra de uma só reeleição). */
  consecutivos: number;
  historico: {
    t: number; cargo: CargoEletivo; resultado: 'eleito' | 'derrotado' | 'renunciou' | 'concluiu' | 'cassado';
    /** Na apuração: os fatores que o motor usou (com o peso de cada um) e a chance que havia — é daqui que sai a explicação. */
    fatores?: { id: string; valor: number }[];
    chance?: number;
    /** Por qual partido disputou. */
    partido?: string;
    /** No fim de um mandato: a aprovação, o que foi entregue, a prioridade e os marcos do exercício. */
    aprovacao?: number;
    feitos?: number;
    prioridade?: Prioridade;
    marcos?: string[];
  }[];
  /** Os partidos por onde passou (a troca fica na história). */
  partidos?: { sigla: string; tInicio: number; tFim?: number; como?: 'janela' | 'fora_da_janela' | 'majoritario' | 'sem_mandato' }[];
  /** Um escândalo que veio a público (o caso, o processo): pesa na próxima eleição, conforme a resposta. */
  escandalo?: { t: number; tipo: 'caso' | 'processo' | 'prisao' | 'ilicito'; resposta?: 'desculpas' | 'negou' | 'silencio' };
  /** O trabalho que ficou para trás (para voltar depois). */
  anterior?: { emprego: Emprego; garantido: boolean; negocio?: boolean };
  /** Inelegível até (Ficha Limpa, abstrato). */
  inelegivelAte?: number;
  tFim?: number;
  /** REWORK 11.5 · POL-05: as alianças (com gente e com memória) e as promessas, cobradas no prazo (`sistemas/aliancas`). */
  aliancas?: AliancaPolitica[];
  promessas?: PromessaPolitica[];
  /** REWORK 11.5 · POL-05: o pedido de um aliado neste ano (a decisão `pol_alianca_pedido` lê). */
  pedido?: { aliancaId: string; t: number };
}

/** REWORK 11.5 · POL-05: uma aliança política — uma pessoa de um grupo, a confiança, os favores e o rompimento. */
export interface AliancaPolitica {
  id: string;
  pessoaId: string;
  /** O grupo que a pessoa representa ("a bancada do comércio", "as lideranças dos bairros"). */
  grupo: string;
  confianca: number;
  desde: number;
  /** Favores: positivo, o aliado deve a você; negativo, você deve a ele. */
  favores: number;
  rompida?: number;
  /** Quem rompeu. */
  porQuem?: 'voce' | 'aliado';
}

/** REWORK 11.5 · POL-05: uma promessa — de campanha (ao eleitor) ou a um aliado — com prazo. */
export interface PromessaPolitica {
  id: string;
  t: number;
  texto: string;
  origem: 'campanha' | 'alianca';
  aliancaId?: string;
  /** Até quando (instante). */
  prazo: number;
  /** As entregas do mandato no dia da promessa (a de campanha é cumprida com entregas a mais). */
  feitoAntes?: number;
  cumprida?: number;
  quebrada?: number;
}

/* ---------------------------------------------------------------------- Vida */

export interface Personagem {
  nome: string;
  sobrenome: string;
  genero: Genero;
  tNasc: number;
  municipioNatal: string;
  /**
   * Nacionalidades (ISO 3166-1), na ordem em que vieram — a primeira é a de
   * nascença. NASCER, TER NACIONALIDADE E MORAR SÃO COISAS DIFERENTES: o país
   * de nascimento é o da cidade natal; o de residência, o da moradia; a
   * nacionalidade só muda por naturalização (`mundo/cidadania`).
   */
  nacionalidades: string[];
  atracao?: Atracao;
  visual: Visual;
  /** Os traços de nascença (só depois que o visual mudou por cirurgia): a herança lê daqui. */
  genes?: Genes;
  /** Os procedimentos estéticos feitos (`sistemas/estetica`, no máximo os 12 últimos): o resultado e a escolha. */
  procedimentos?: { id: string; t: number; resultado: string; alvo?: string; clinica?: string; revisado?: boolean }[];
  /** O estilo escolhido e o que foi comprado para ele (ausente: nada além do básico). */
  estilo?: EstiloPessoal;
  /**
   * Como o texto se refere ao personagem (concordância). Escolha do jogador:
   * uma pessoa não binária pode preferir formas masculinas, femininas ou
   * neutras. Ausente = segue o gênero.
   */
  tratamento?: Genero;
  /** REWORK 4: a ancestralidade e a tradição de nomes da família (`sistemas/identidade`). Opcionais. */
  ancestralidade?: Record<string, number>;
  tradicao?: string;
  /** REWORK 4: a semente do retrato (quem continua na sucessão mantém a própria). Ausente = 'eu'. */
  semente?: string;
}

export interface Ocorrencia {
  id: string;
  t: number;
  idade: number;
}

/**
 * Notoriedade: quanto o público conhece a pessoa, 0..100, vinda de um
 * motivo (o esporte, a obra, a política, o negócio). Sobe e cai; tem
 * consumidores (convites, patrocínio, exposição, pressão). Quase todo mundo
 * vive a vida inteira em 0 (`sistemas/notoriedade`).
 */
export interface Notoriedade {
  /** NOTORIEDADE PÚBLICA: quantas pessoas sabem quem você é, 0..100. Não é reputação na área, nem imagem, nem apoio político. */
  valor: number;
  pico: number;
  /** De onde vem, agora (o que alimenta o nome este ano). */
  fonte?: FonteDoNome;
  t: number;
  /**
   * A ORIGEM do nome (pacote pós-playtest): o pico que cada motivo já deu.
   * Sobrevive à troca de carreira — o ex-jogador que vira político continua
   * conhecido "pelo futebol" (`notoriedade.origemDoNome`).
   */
  origens?: Partial<Record<FonteDoNome, number>>;
}
export type FonteDoNome = 'esporte' | 'arte' | 'politica' | 'negocio' | 'rede';

export interface Vida {
  versao: 20;
  id: string;
  rng: number;
  seq: number;
  t: number;
  /** REWORK 12.2: as peças únicas desta continuidade (quem tem cada uma): nunca duas iguais, nem depois da sucessão. */
  pecasUnicas?: Record<string, RegistroDePecaUnica>;
  eu: Personagem;
  corpo: Corpo;
  mente: Mente;
  /** Facilidades de nascença (estáveis, da semente). */
  predisposicoes: Predisposicoes;
  personalidade: Personalidade;
  pessoas: Record<string, Pessoa>;
  vinculos: Record<string, Vinculo>;
  origem: Origem;
  moradia: Moradia;
  educacao: Educacao;
  trabalho: Trabalho;
  financas: Financas;
  /** A economia do país ao longo da vida. */
  economia: Economia;
  processos: Processo[];
  rotinas: Rotina[];
  /** Fatos biográficos consultáveis por conteúdo ("fato" → instante). */
  fatos: Record<string, number>;
  biografia: Entrada[];
  momento: Momento | null;
  /**
   * REWORK 11.5 · EVT-01: as outras decisões do ano, na ordem em que vão aparecer (a vida movimentada tem mais de uma
   * por ano). Cada uma é conferida de novo antes de abrir — o que a escolha anterior desfez não aparece. Ausente: vazia.
   */
  fila?: DecisaoNaFila[];
  /**
   * REWORK 11.5 · REL-22: uma relação entre TRÊS adultos (a parceria principal e o namoro paralelo do poliamor, que
   * também se relacionam): a harmonia entre os dois, os ciúmes, a casa, o dinheiro. Ausente: não há trio.
   */
  trisal?: { a: string; b: string; desde: number; harmonia: number; ciumes: number; moram: boolean; financas: 'separadas' | 'conjuntas'; conversa?: number; crise?: number };
  ocorrencias: Ocorrencia[];
  /**
   * REWORK 10.5 · EVT-05: os acontecimentos e as cenas de carreira que apareceram nas DUAS VIDAS ANTERIORES deste
   * aparelho (ids, no máximo 200): pesam menos no sorteio desta. Ausente: a vida não lembra de outras (saves antigos,
   * a primeira vida, os testes).
   */
  memoriaDeVidas?: string[];
  /** O que já foi feito neste ano de vida (ações pontuais). */
  anoAtual: { acoes: string[] };
  /** Perdas recentes, ainda sendo atravessadas. */
  luto: Luto[];
  /** O que a pessoa pratica, conquista e tenta: frentes, marcas, portas abertas, carreiras especiais. */
  caminhos: Caminhos;
  /** Antecedentes, processo em andamento, pena. Ausente = nunca teve problema com a Justiça. */
  justica?: Justica;
  /** REWORK 12.25: o mundo do crime que esta vida conhece (só existe para quem passou pelo Submundo). */
  mundoCriminal?: MundoCriminal;
  /**
   * O que é privado e quem sabe: um caso, um processo, o que se fez por fora.
   * Só vira assunto público quando alguém fala (e a vida pública da pessoa
   * torna isso notícia) — `sistemas/exposicao`.
   */
  segredos?: Segredo[];
  /** Quanto o público conhece você (ausente = anônimo). */
  notoriedade?: Notoriedade;
  /** REWORK 4: as redes sociais do jogo (simulação interna, sem internet): `sistemas/redes`. Opcional. */
  redes?: { contas: Record<string, ContaSocial> };
  /** REWORK 4: as organizações onde a vida trabalhou (nome, setor, cidade) — `sistemas/organizacoes`. Opcional. */
  organizacoes?: Record<string, Organizacao>;
  /** Como prefere ir ao trabalho e ao estudo. Ausente = o jeito mais rápido que tem (`sistemas/transporte`). */
  deslocamento?: { modo: 'a_pe' | 'bicicleta' | 'publico' | 'moto' | 'carro'; t: number };
  morte?: {
    t: number; causa: string; heranca?: Heranca;
    /** O que o jogador decidiu sobre o patrimônio na tela do legado (guardado: recarregar mostra as mesmas escolhas). */
    decisoes?: DecisoesDeHeranca;
    /** A história foi encerrada aqui (a partilha já foi feita e registrada em `heranca`). */
    encerrada?: boolean;
  };
  /**
   * As vidas da família jogadas ANTES desta (sucessão): quem foram, o que
   * deixaram, quem continuou. Ausente = a primeira geração. A biografia de
   * cada uma fica aqui — nunca misturada com a Linha da Vida de quem continua.
   */
  linhagem?: Linhagem;
  /** A vida no mundo: as mudanças de país, a adaptação ao lugar, as línguas (ausente: nunca saiu do país onde nasceu). */
  mundo?: MundoDaVida;
  /** REWORK 9: o que o jogador decidiu na agenda da semana (turnos e lugares das atividades). Ausente: tudo no padrão. */
  agenda?: AgendaGuardada;
  /** REWORK 9 · PROG-01: a fotografia de cada ano (os últimos oito): o que andou e por quê (`sistemas/progressao`). */
  evolucao?: FotoDoAno[];
  /** REWORK 10 · JOG-01: as apostas (loteria, blackjack, roleta, caça-níquel), só com o dinheiro do jogo. Ausente: nunca apostou. */
  apostas?: EstadoDasApostas;
  /** REWORK 10 · EVT-02: o que uma escolha deixou para depois (`sistemas/ecos`). Ausente: nada pendente. */
  ecos?: { tipo: 'favor' | 'mentor' | 'recusou' | 'fiador' | 'investiu' | 'denunciou' | 'mudou_de_curso' | 'cuidou'; t: number; volta: number; ate: number; pessoaId?: string; valor?: number; voltou?: number; texto?: string;
    /** REWORK 11 · EVT-11.7: onde a premissa do eco foi vivida — o empregador da recusa, o curso largado (`premissas`). */
    empregador?: string; cursoId?: string }[];
}

/** Um ano fotografado: só as frentes que mudaram, as causas que pesaram, as notas, o trabalho, o esporte. */
export interface FotoDoAno {
  t: number;
  frentes: Partial<Record<Dominio, number>>;
  /** Por frente: [fonte, quanto] (a escola, `rotina:futebol`, o trabalho, `acao:oficio`, `sem_pratica`, a idade). */
  causas?: Partial<Record<Dominio, [string, number][]>>;
  escola?: number;
  /** REWORK 9.7 · EDU-04: as notas do boletim daquele ano (0..10), quando havia. */
  notas?: EscolaBasica['notas'];
  curso?: number;
  trabalho?: { ocupacaoId: string; desempenho: number; salario: number };
  esporte?: { reputacao: number; nivel: number };
  /** REWORK 9.5 · ROT-01/03: a rotina do ano que fechou — a exigência (a faixa), a cabeça (o estresse), os conflitos de
   *  horário, a dedicação aos estudos e quanto do estudo em casa aconteceu (0..1). O que de fato foi, não o previsto. */
  rotina?: { faixa: string; estresse: number; conflitos: number; postura?: 'dedicada' | 'normal' | 'relaxada'; estudo?: number };
}


/* ------------------------------------------------------------------- Apostas (REWORK 10 · JOG-01, `sistemas/apostas`) */

export type TipoDeApostaNaRoleta = 'vermelho' | 'preto' | 'par' | 'impar' | 'baixo' | 'alto' | 'duzia1' | 'duzia2' | 'duzia3' | 'numero';
export interface ApostaNaRoleta { tipo: TipoDeApostaNaRoleta; valor: number; numero?: number }
export type Simbolo = 'folha' | 'sino' | 'estrela' | 'moeda' | 'raposa';
export type Naipe = 'copas' | 'ouros' | 'espadas' | 'paus';
export interface Carta { v: number; n: Naipe }
export interface MaoDeBlackjack { aposta: number; voce: Carta[]; banca: Carta[]; baralho: Carta[]; dobrou?: boolean; t: number }
export type JogoDeAzar = 'loteria' | 'blackjack' | 'roleta' | 'niquel';
export interface ResultadoDeAposta {
  jogo: JogoDeAzar; t: number; apostado: number; recebido: number; texto: string;
  /** O que a tela mostra: os números sorteados, a casa da roleta, os símbolos dos rolos, as mãos do blackjack. */
  sorteio?: number[]; acertos?: number; casa?: number; rolos?: Simbolo[]; voce?: Carta[]; banca?: Carta[];
}
export interface EstadoDasApostas {
  /** A mão de blackjack em andamento (sobrevive a sair da tela e a recarregar). */
  mao?: MaoDeBlackjack;
  /** As últimas rodadas (a tela mostra; as dez mais recentes). */
  ultimas: ResultadoDeAposta[];
  /** O ano corrente: quanto se apostou e quanto voltou. */
  ano: { t: number; apostado: number; recebido: number };
  /** O balanço da vida inteira. */
  total: { apostado: number; recebido: number };
  /** Anos seguidos perdendo muito (para o assunto da vida, não para uma "dependência"). */
  anosPesados?: number;
  /** A autoexclusão pedida (sem apostar até `ate`) e o limite do ano que a pessoa se deu. */
  autoexclusao?: number;
  limiteAnual?: number;
}

/* ------------------------------------------------------------------- Agenda (REWORK 9) */

/** Dia da semana: 0 segunda … 6 domingo. */
export type Dia = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type Turno = 'manha' | 'tarde' | 'noite' | 'integral';
/** O lugar escolhido para uma atividade: os dias e a hora de começar (minutos desde a meia-noite). */
export interface LugarNaAgenda { dias: Dia[]; inicio: number }
/**
 * A agenda guarda SÓ as escolhas (`sistemas/agenda`): o turno do que tem turno e o lugar das atividades que o
 * jogador marcou. Os blocos em si são derivados do estado a cada leitura — nunca uma cópia que envelhece.
 */
export interface AgendaGuardada {
  turnos?: Partial<Record<'escola' | 'curso' | 'trabalho', Turno>>;
  lugares?: Record<string, LugarNaAgenda>;
  /** Conflitos que já viraram nota na Linha da Vida (para não repetir todo ano). */
  avisados?: string[];
}

/* ------------------------------------------------------------------- Mundo */

export type MotivoMigracao = 'trabalho' | 'estudo' | 'familia' | 'relacionamento' | 'esporte' | 'oportunidade' | 'pessoal' | 'retorno';

/** Uma mudança de país (mudar de cidade dentro do país não é migração). */
export interface Migracao {
  t: number;
  de: string;
  para: string;
  motivo: MotivoMigracao;
  /** Por onde a porta abriu: livre circulação (bloco), trabalho, estudo, família, nacionalidade (voltar para casa), residência. */
  via: 'livre' | 'trabalho' | 'estudo' | 'familia' | 'cidadania' | 'residencia';
  /** O que o dinheiro valia na saída e na chegada (o mesmo valor de mercado, em outra moeda). */
  cambio?: { antes: number; depois: number };
}

export interface MundoDaVida {
  migracoes: Migracao[];
  /**
   * O quanto a pessoa já está em casa no país onde mora, 0..100: a língua,
   * o jeito das coisas, a rede. Começa baixa para quem chega de fora e sobe
   * com os anos (mais rápido quem fala a língua). Pesa no trabalho e na cabeça.
   */
  adaptacao: number;
  /** As línguas que a pessoa fala (em português: "espanhol"), além da de casa. */
  idiomas: string[];
  /** Pedido de naturalização em curso (ano em que sai a resposta). */
  naturalizacao?: { pais: string; t: number };
}

/* ----------------------------------------------------------------- Sucessão */

/**
 * O que o jogador decide sobre o destino do patrimônio (dentro do que a regra
 * do país permite: `dados/sucessao`). Ausente = a sucessão legal, sem
 * testamento.
 */
export interface DecisoesDeHeranca {
  /** Como a PARTE DISPONÍVEL (a que a lei deixa decidir) se divide: frações por pessoa (o resto, a sucessão legal). */
  disponivel?: { pessoaId: string; fracao: number }[];
  /** Parte da disponível doada (0..1 da disponível) e para quê. */
  doacao?: { fracao: number; destino: string };
  /** Bens específicos para alguém (o bem entra no quinhão da pessoa): id do bem → id da pessoa. `negocio` é o negócio. */
  bens?: Record<string, string>;
}

/** Uma vida jogada antes desta. */
export interface Geracao {
  /** A pessoa (falecida) no mundo desta vida: é por ela que os parentescos a enxergam. */
  pessoaId: string;
  nome: string;
  sobrenome: string;
  genero: Genero;
  tratamento?: Genero;
  visual: Visual;
  tNasc: number;
  tMorte: number;
  causa: string;
  municipioNatal: string;
  municipioMorte: string;
  /** Nacionalidades e mudanças de país de quem viveu (ausente: a vida inteira no Brasil). */
  nacionalidades?: string[];
  migracoes?: Migracao[];
  /** O que marcou a vida (a retrospectiva) e o que construiu (as trajetórias), como ficaram no fim. */
  resumo: string[];
  trajetorias: { titulo: string; periodo: string; resumo: string }[];
  /** A Linha da Vida dela: só o que é marco ou biografia (o cotidiano fica com quem viveu). */
  biografia: { t: number; idade: number; texto: string; marco: boolean }[];
  /** A partilha como foi feita. */
  heranca: Heranca;
  /** Quem continuou a história: o nome e o laço com quem morreu ("filha"). */
  sucessor?: { nome: string; laco: string; idade: number };
  /** Notoriedade no fim (o filho de alguém conhecido é conhecido por associação, nunca por mérito herdado). */
  notoriedade?: { pico: number; fonte?: FonteDoNome };
}

export interface Linhagem {
  geracoes: Geracao[];
}

/**
 * Justiça, na medida mínima: processo, pena, antecedentes, saída. Não é um
 * simulador jurídico; é o que muda a vida de quem passa por isso.
 */
export interface Justica {
  /**
   * REWORK 10: `acordo` — o processo terminou num acordo que não vira condenação (o acordo de não persecução brasileiro,
   * a conformidade com pena leve): a ficha registra, mas não pesa como condenação. `multa`: a multa penal paga.
   * `reabilitado`: a reabilitação criminal (o registro sai de circulação, depois dos anos que a lei do país pede).
   */
  antecedentes: { t: number; categoria: CategoriaDoProcesso; desfecho: 'socioeducativa' | 'alternativa' | 'prisao' | 'absolvicao' | 'acordo'; anos?: number; multa?: number; reabilitado?: number }[];
  /**
   * Processo em andamento (a sentença sai em `tJulgamento`). REWORK 10 · CRI-01: a força das provas (0..100), a defesa
   * escolhida pelo jogador, o acordo oferecido (e a resposta), a fiança arbitrada, quem assumiu e quem cooperou.
   */
  processo?: {
    tInicio: number; tJulgamento: number; categoria: CategoriaDoProcesso; defesa: 'publica' | 'particular';
    provas?: number; defesaEscolhida?: boolean; acordo?: { t: number; aceito?: boolean; recusado?: boolean }; fianca?: number; assumiu?: boolean; cooperou?: boolean;
  };
  /** REWORK 10: o recurso contra a condenação, com a resposta em `tFim`. */
  recurso?: { t: number; tFim: number };
  /**
   * Pena de prisão em cumprimento. REWORK 5 (a prisão como camada jogável, `sistemas/prisao`): a pena da sentença em meses,
   * a disciplina (0..100), o que já foi remido, a facção (aceita ou recusada), a situação do pavilhão à espera de resposta,
   * o último pedido à defensoria e a saída preparada. Todos opcionais (saves antigos seguem válidos).
   */
  prisao?: {
    tInicio: number; tFim: number; regime: 'fechado' | 'semiaberto';
    penaMeses?: number; disciplina?: number; remidos?: number; faccao?: 'dentro' | 'recusou';
    pendente?: 'faccao' | 'briga' | 'motim'; tPendente?: number; assistencia?: number; preparouSaida?: number;
  };
  /** REWORK 5: fugiu (ou não voltou do semiaberto): o resto da pena espera; a recaptura pode vir a qualquer ano. */
  foragido?: { t: number; restante: number; motivo?: 'fuga' | 'mandado' | 'descumprimento'; abrigo?: number; mudouEndereco?: number };
  /** REWORK 12.25: as escolhas do processo (a estratégia, a audiência) e o que se recorreu de uma condenação sem prisão. */
  defesa?: { estrategia?: 'negar' | 'contestar' | 'atenuantes' | 'delegar'; tEstrategia?: number; audiencia?: { t: number; foi?: 'compareceu' | 'preparou' | 'faltou' } ; contestou?: boolean };
  /** Pena alternativa em cumprimento (prestação de serviços). */
  alternativa?: { tFim: number };
  /** Saiu da prisão em (a volta tem suas próprias portas e barreiras). */
  tSaida?: number;
}

/** Um acontecimento privado e quem sabe dele. */
export interface Segredo {
  id: string;
  tipo: 'caso' | 'processo' | 'prisao' | 'ilicito';
  t: number;
  /** Quem sabe (ids de pessoas). */
  quemSabe: string[];
  /** Quando virou público (ausente: ainda não). */
  publico?: number;
  /** A outra pessoa do caso, quando há. */
  pessoaId?: string;
}

/** O que ficou para quem ficou (simplificado; não é inventário jurídico). */
export interface Heranca {
  /** Patrimônio líquido deixado. */
  liquido: number;
  partes: {
    pessoaId: string; valor: number; papel: 'conjuge' | 'filho' | 'neto' | 'outro'; meacao?: boolean;
    /** Sucessão: o que a parte foi, em dinheiro e em bens (com o nome de cada bem). */
    dinheiro?: number;
    bens?: string[];
  }[];
  /** Os bens que existiam, em palavras. */
  bens: string[];
  /** Obrigações que o patrimônio pagou. */
  dividas: number;
  /**
   * Sucessão (a partilha completa, quando feita pelo legado): o inventário
   * bruto, os custos da transmissão, a doação, o que as dívidas deixaram sem
   * cobertura e a regra (país) usada. A conta fecha: bruto = dívidas pagas +
   * meação + partes + doação + custos + vacante.
   */
  bruto?: number;
  custos?: number;
  doacao?: { valor: number; destino: string };
  /** Sem herdeiro nenhum: o que foi para o poder público. */
  vacante?: number;
  /** Dívida que o patrimônio não cobriu (e se extinguiu com ele: ninguém herda dívida). */
  naoCoberto?: number;
  regra?: string;
  /** Vendido no inventário para virar dinheiro (bens que ninguém recebeu). */
  vendidos?: string[];
}

/** Resultado de um comando do jogador. */
export interface Retorno {
  vida: Vida;
  /** Texto curto para mostrar ao jogador agora. */
  aviso?: { texto: string; tom: 'bom' | 'ruim' | 'neutro' };
  /** Resultado de uma decisão (mostrado no mesmo contexto do momento). */
  resultado?: string;
  /** O resultado de uma ação merece uma folha (com este título), não um aviso passageiro. */
  titulo?: string;
  /** Quem aparece na folha do resultado. */
  pessoaId?: string;
  /**
   * O que a ação mudou na vida, como ficou escrito na Linha da Vida (as
   * consequências, não só a escolha): "Trancou a faculdade", "Deixou o
   * emprego de vendedor". Nada biográfico muda escondido no estado.
   */
  mudancas?: string[];
}

/* ================================================================ REWORK 4 */

/** As plataformas do jogo (`dados/redes`): cada uma funciona de um jeito. Saves do REWORK 4 tinham o "mural" (vira Instagram). */
export type PlataformaId = 'instagram' | 'youtube' | 'tiktok' | 'twitch' | 'x' | 'facebook' | 'onlyfans';

/** Uma conta numa rede social do jogo. */
export interface ContaSocial {
  plataforma: string;
  arroba: string;
  tCriada: number;
  /** O público (seguidores, inscritos, assinantes), comprados incluídos até alguém descobrir. */
  seguidores: number;
  /** 0..100: o quanto quem segue acredita no que vê (seguidores comprados, polêmicas e sumiços derrubam). */
  credibilidade: number;
  /** As últimas publicações (no máximo 8: o resto vira número em `totais`). */
  publicacoes: Publicacao[];
  /** Desde quando ganha dinheiro com a conta. */
  monetizada?: number;
  /** Quantos seguidores foram comprados (ainda contados em `seguidores`, até alguém descobrir). */
  comprados?: number;
  /** A conta foi apagada (quando). */
  apagada?: number;
  /** FIX pós-REWORK 4: 0..100, o quanto quem segue interage (comprado não interage; sumir esfria). */
  engajamento?: number;
  /** Verificada desde (o selo); `selo: 'pago'` é o selo comprado (X): verifica a conta, não a pessoa. */
  verificada?: number;
  selo?: 'pago';
  /** O pedido de verificação em análise (sai na virada do ano) e a última recusa. */
  pedidoVerificacao?: number;
  recusaVerificacao?: number;
  /** Suspensa até (a rede puniu); advertências acumuladas (denúncias, briga, compra descoberta). */
  suspensaAte?: number;
  advertencias?: number;
  /** 0..100: a fama de briguento nessa rede (trollar, rebater, xingar). */
  toxicidade?: number;
  /**
   * REWORK 11 · SOC-11: a moderação — quantas suspensões a conta já teve, o motivo da última punição (dito ao jogador),
   * o banimento permanente (quando; a conta fica `apagada` e a renda zera sozinha) e o recurso já usado (quando).
   */
  suspensoes?: number;
  motivoPunicao?: string;
  banida?: number;
  recurso?: number;
  /** O que a conta já viveu, em números (as publicações antigas saem; a história fica). */
  totais?: { publicacoes: number; virais: number; receita: number; polemicas: number; maior: number };
  /** FIX pós-playtest humano: os tipos dos últimos ecos de publicação (antirrepetição; ids curtos, no máximo 3). */
  ecos?: string[];
  /** Celebridades que já interagiram (nomes): a curtida, a resposta, o compartilhamento. */
  celebridades?: string[];
  /** OnlyFans: quem da vida descobriu (pessoaIds), e se o trabalho soube. */
  descobriram?: string[];
  /** REWORK 9 · SOC-01: o balanço do público no ano em curso — cada seguidor ganho ou perdido, com a causa. */
  balanco?: BalancoDoPublico;
  /** Os balanços dos anos já fechados (os últimos 10), na ordem. */
  anos?: BalancoDoPublico[];
}

/**
 * De onde veio (e para onde foi) o público num ano. A conta fecha:
 * inicio + organico + publicacoes + exposicao + comprados − perdas = fim.
 * Nada aqui é escrito depois: cada parcela é somada no instante em que o
 * seguidor chega ou vai embora (`redesBase.mudarPublico`).
 */
export interface BalancoDoPublico {
  desde: number;
  ate?: number;
  inicio: number;
  /** Quem chegou sem uma publicação específica: conhecidos, a constância, o catálogo que continua sendo visto. */
  organico: number;
  /** O que as publicações, as colaborações, as campanhas e a rotina de criar conteúdo trouxeram. */
  publicacoes: number;
  /** O nome fora da rede: a notoriedade, uma celebridade que compartilhou, o que aconteceu na vida pública. */
  exposicao: number;
  /** Seguidores comprados (contados até alguém descobrir). */
  comprados: number;
  /** Quem foi embora: a rede esquece, quem deixou de seguir, a compra descoberta. */
  perdas: number;
  fim?: number;
  /** A notoriedade no começo e no fim do período (o motor sabe; a tela mostra). */
  famaInicio?: number;
  famaFim?: number;
  /** As causas conhecidas da exposição (textos curtos de acontecimentos que existem no estado). */
  motivos?: string[];
}

export type TemaPublicacao =
  | 'cotidiano' | 'viagem' | 'trabalho' | 'conquista' | 'arte' | 'pet' | 'familia' | 'opiniao'
  | 'humor' | 'esporte' | 'musica' | 'jogo' | 'tutorial' | 'bastidores' | 'politica' | 'exclusivo'
  | 'desculpas' | 'rebater' | 'divulgar' | 'conversa' | 'receita' | 'estilo' | 'estudo' | 'comunidade';

export interface Publicacao {
  id: string;
  t: number;
  tema: TemaPublicacao;
  texto: string;
  alcance: number;
  /** Seguidores que chegaram com ela. */
  novos: number;
  /** Quem reagiu (pessoas da sua vida). */
  pessoas?: string[];
  promovida?: boolean;
  polemica?: boolean;
  viral?: boolean;
  apagada?: boolean;
  /** A reação em uma palavra (o que a rede achou): "elogiada", "ignorada", "criticada"... */
  reacao?: string;
}

/** Uma organização onde se trabalha (simulada, plausível para o lugar): o nome, o setor, a cidade, o porte. */
export interface Organizacao {
  id: string;
  nome: string;
  setor: string;
  municipioId: string;
  porte: 'pequena' | 'media' | 'grande';
}
