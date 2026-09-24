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
  /** Faculdade em curso (filhos do jogador): quem paga e quando termina. */
  estudo?: { curso: string; paga: 'publica' | 'familia' | 'fies' | 'bolsa' | 'propria'; tFim: number; nivel?: 'tecnico' | 'superior' };
  /** Formou-se em (nome do curso). */
  formacao?: string;
  /** Pet: animal, não gente. Nunca conversa, nunca namora. */
  especie?: 'cachorro' | 'gato';
  /** O que só um animal tem: de onde veio, de quem é, como está. */
  pet?: InfoPet;
  /** Pai e mãe (ids; `'eu'` é o jogador). Mantém a árvore da família coerente entre gerações. */
  genitores?: string[];
  /** Um momento difícil pelo qual a pessoa está passando (abre "estar junto" como ação). */
  aperto?: Aperto;
  /** Vida própria simplificada (descendentes e quem importa): formação, trabalho, marcos. */
  vida?: VidaNpc;
  /** Gestação de uma pessoa que não é o jogador (filha, nora, genro...). */
  gestacao?: { tParto: number; outroId?: string; anunciada: boolean };
}

/** Um animal da casa. Não é patrimônio: é alguém que mora junto e depende de cuidado. */
export interface InfoPet {
  porte: 'pequeno' | 'medio' | 'grande';
  /** Como chegou: abrigo, alguém que doou, ninhada, rua, criador, já era da família. */
  origem: 'abrigo' | 'doacao' | 'ninhada' | 'rua' | 'criador' | 'familia';
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
}

export interface Aperto {
  tipo: 'desemprego' | 'separacao' | 'doenca' | 'luto' | 'dinheiro' | 'fase';
  t: number;
  /** Quem foi perdido, no luto. */
  pessoaId?: string;
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

export type TipoTrajetoria = 'escola' | 'estudo' | 'trabalho' | 'promocao' | 'desemprego' | 'casa' | 'amor' | 'filho' | 'lugar' | 'saude';

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
  barba?: string;
}

export type Parentesco =
  | 'mae' | 'pai' | 'madrasta' | 'padrasto'
  | 'irmao' | 'meio_irmao'
  | 'avo' | 'tio' | 'primo'
  | 'filho' | 'enteado' | 'neto' | 'bisneto'
  /** Cônjuge de um filho (genro ou nora). */
  | 'genro'
  | 'sogro'
  | 'pet';

/** Onde duas pessoas convivem. É o que faz relações nascerem e se manterem. */
export type Convivio = 'casa' | 'escola' | 'faculdade' | 'trabalho' | 'vizinhanca' | 'rotina' | 'online';

export type EstagioSocial = 'conhecido' | 'colega' | 'amigo' | 'amigo_proximo' | 'afastado';

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
}

/** Um marco da história compartilhada. Só o que importa — nunca "um ano normal". */
export interface Marco {
  t: number;
  texto: string;
  tipo?: TipoMarco;
  /** 1 corriqueiro · 2 importante · 3 marcante. */
  peso?: number;
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
}

export interface Corpo {
  saude: number;       // 0..100
  forma: number;       // condicionamento físico 0..100
  aparencia: number;   // presença/cuidado 0..100
  condicoes: Condicao[];
  habitos: { fuma: boolean; bebe: 'nao' | 'social' | 'muito'; sedentario: boolean };
  /** Pode gestar (definido pelo corpo, não pelo gênero). */
  podeGestar: boolean;
}

export interface Mente {
  felicidade: number;  // 0..100
  estresse: number;    // 0..100
  cognicao: number;    // 0..100 — facilidade de aprender, raciocínio
  /** Acontecimentos que mexeram com a pessoa, com nome (o equilíbrio vai absorvendo). */
  abalos: { t: number; texto: string; humor: number; cabeca: number }[];
  /** Como estava a cada aniversário (para a tendência: melhorando, piorando). */
  historico: { t: number; humor: number; cabeca: number; saude: number }[];
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
  desempenho: number;  // 0..100
  reprovacoes: number;
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
  desempenho: number;
  trancado: boolean;
  /** Quando trancou (a instituição cancela depois de quatro anos). */
  tTrancou?: number;
  municipioId: string;
}

export interface Educacao {
  escolaridade: Escolaridade;
  basica?: EscolaBasica;
  /** Largou a escola básica sem concluir. */
  evadiu: boolean;
  matricula?: Matricula;
  concluidos: { cursoId: string; nome: string; nivel: NivelCurso; area: string; tFim: number; instituicao: string; rede?: 'publica' | 'privada'; modalidade?: 'presencial' | 'ead'; fies?: boolean }[];
  enem: { t: number; nota: number; areas?: Partial<Record<'exatas' | 'linguagens' | 'ciencias' | 'humanas', number>> }[];
  /** Postura do ano na escola/curso (escolha comportamental do jogador). */
  postura: 'dedicada' | 'normal' | 'relaxada';
  cursinho: boolean;
}

/** `livre`: qualificação profissional curta (SENAI, SENAC, cursos de ofício) — não muda a escolaridade. */
export type NivelCurso = 'livre' | 'tecnico' | 'superior' | 'pos' | 'mestrado' | 'doutorado' | 'residencia';

/* ---------------------------------------------------------------- Trabalho */

/**
 * Vínculo de trabalho. `temporario` é o contrato de safra ou de fim de ano;
 * `militar` é a carreira das Forças Armadas e das polícias e bombeiros
 * militares (regime próprio: reserva por tempo de serviço, não INSS).
 */
export type Contrato = 'aprendiz' | 'estagio' | 'clt' | 'servidor' | 'informal' | 'autonomo' | 'temporario' | 'militar';

export interface Emprego {
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
  /** Meses de experiência por trilha profissional. */
  experiencia: Record<string, number>;
  candidaturas: Candidatura[];
  /** Meses de contribuição ao INSS. */
  contribuicao: number;
  aposentadoria?: { t: number; beneficio: number };
  licencas: string[];
  /** Horas extras neste ano (escolha). */
  horasExtras: boolean;
  desempregadoDesde?: number;
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
  modeloId: string;
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

export interface Financas {
  /** Dinheiro SEU, disponível. Na casa dos pais, não é o dinheiro da casa. */
  conta: number;
  investimentos: Aplicacao[];
  dividas: Divida[];
  bens: Bem[];
  estilo: EstiloDeVida;
  planoDeSaude: boolean;
  /** Nome sujo: crédito negado. */
  negativado: boolean;
  /** Razão do último ano (para a interface). */
  razao: LinhaRazao[];
  historico: FotoFinanceira[];
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
  /** Com quantas pessoas divide o aluguel (república, dividir apartamento). */
  divide?: number;
  /** Aluguel atrasado (meses). */
  atraso?: number;
}

/** A casa de origem enquanto o jogador mora com a família. */
export interface Origem {
  classe: Classe;
  /** Estrutura do lar em que nasceu. */
  arranjo: 'pais_juntos' | 'mae_solo' | 'pai_solo' | 'avos';
}

/* ---------------------------------------------------------------- Processos */

export type Processo =
  | { tipo: 'gestacao'; id: string; tConcepcao: number; tParto: number; gestanteId: string; outroId?: string; descoberta: boolean; planejada: boolean }
  | { tipo: 'adocao'; id: string; tInicio: number; tFim: number; parceiroId?: string }
  | { tipo: 'mudanca'; id: string; tEfetiva: number; destinoId: string; motivo: string }
  | { tipo: 'tratamento'; id: string; condicaoId: string; tFim: number; rede: 'sus' | 'particular' }
  | { tipo: 'cnh'; id: string; tInicio: number; tFim: number; tentativas: number };

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
  peso: number;
  /** Como o jogador escolheu atravessar a despedida (quando escolheu). */
  como?: string;
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
  opcoes: { id: string; texto: string; bloqueio?: string }[];
}

/* ------------------------------------------------------------------- Rotina */

/** Algo que a pessoa faz regularmente, até decidir parar. */
export interface Rotina {
  id: string;
  tInicio: number;
  /** Intensidade: 1 leve (por diversão) · 2 regular (aulas, treino) · 3 a sério (base, banda, preparação pesada). */
  nivel?: 1 | 2 | 3;
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
  | 'futebol' | 'volei' | 'natacao' | 'atletismo' | 'lutas'
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
  | 'volta_estudos' | 'aposentadoria' | 'lideranca' | 'estagnacao' | 'mudanca_cidade';

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
  | 'clientela' | 'convite' | 'retomar' | 'bolsa' | 'selecao_tecnico' | 'proposta';

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
}

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
  motivoFim?: 'dispensa' | 'lesao' | 'idade' | 'escolha' | 'sem_contrato';
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

/** Preparação para concurso: meses de estudo acumulados (esfriam se parar). */
export interface PreparoConcurso {
  meses: number;
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
  /** Resultado do último ano além da sua retirada: lucro (+) ou o que saiu do seu bolso (−). */
  resultadoAno?: number;
  /** Soma dos resultados desde a abertura (sem contar a retirada mensal). */
  acumulado?: number;
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
  tipo: 'entrevista' | 'peneira' | 'concurso';
  titulo: string;
  texto: string;
  passou: boolean;
  /** Ficou perto: vale tentar de novo. */
  perto?: boolean;
  /** O que mais pesou contra (para o jogador saber o que trabalhar). */
  falta?: 'experiencia' | 'formacao' | 'entrevista' | 'tecnica' | 'fisico' | 'leitura' | 'nervos' | 'idade' | 'concorrencia' | 'preparo';
  ocupacaoId?: string;
  dominio?: Dominio;
}

export interface Caminhos {
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
  /** Última vez que cada gerador de oportunidade abriu algo (evita repetir). */
  ultimas: Record<string, number>;
}

/* ---------------------------------------------------------------------- Vida */

export interface Personagem {
  nome: string;
  sobrenome: string;
  genero: Genero;
  tNasc: number;
  municipioNatal: string;
  atracao?: Atracao;
  visual: Visual;
  /**
   * Como o texto se refere ao personagem (concordância). Escolha do jogador:
   * uma pessoa não binária pode preferir formas masculinas, femininas ou
   * neutras. Ausente = segue o gênero.
   */
  tratamento?: Genero;
}

export interface Ocorrencia {
  id: string;
  t: number;
  idade: number;
}

export interface Vida {
  versao: 10;
  id: string;
  rng: number;
  seq: number;
  t: number;
  eu: Personagem;
  corpo: Corpo;
  mente: Mente;
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
  ocorrencias: Ocorrencia[];
  /** O que já foi feito neste ano de vida (ações pontuais). */
  anoAtual: { acoes: string[] };
  /** Perdas recentes, ainda sendo atravessadas. */
  luto: Luto[];
  /** O que a pessoa pratica, conquista e tenta: frentes, marcas, portas abertas, carreiras especiais. */
  caminhos: Caminhos;
  morte?: { t: number; causa: string; heranca?: Heranca };
}

/** O que ficou para quem ficou (simplificado; não é inventário jurídico). */
export interface Heranca {
  /** Patrimônio líquido deixado. */
  liquido: number;
  partes: { pessoaId: string; valor: number; papel: 'conjuge' | 'filho' | 'neto' | 'outro'; meacao?: boolean }[];
  /** Os bens que existiam, em palavras. */
  bens: string[];
  /** Obrigações que o patrimônio pagou. */
  dividas: number;
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
}
