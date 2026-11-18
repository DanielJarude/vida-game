/**
 * VIDA 25 · E-SPORTS — o catálogo (dados puros, sem importar o motor).
 *
 * SEIS JOGOS (o limite era sete; não se completou a lista por completar). Critério: circuito profissional oficial e
 * reconhecível, equipes/organizações, caminho do amador à elite, e uma experiência distinta das outras.
 *
 *   Counter-Strike     tático 5×5 (Valve; 1999 → CS:GO 2012 → CS2 2023). Majors patrocinados pela Valve desde 2013;
 *                      convites pelo ranking regional da Valve (VRS). No Brasil, o cenário semiprofissional e as
 *                      ligas abertas alimentam a segunda divisão sul-americana.
 *   Rainbow Six Siege  tático 5×5 de ataque e defesa (Ubisoft, dez/2015). Liga regional (América do Sul), dois Majors
 *                      por ano com a BLAST (2026: Salt Lake City e Japão) e o Six Invitational (2027 em São Paulo).
 *   Fortnite           battle royale (Epic, set/2017). FNCS em duplas em 2026, com cinco divisões alcançadas pelas
 *                      copas divisionais; Majors online; Global Championship em novembro.
 *   VALORANT           tático 5×5 com habilidades (Riot, jun/2020). VCT: Challengers Brazil (2026: duas etapas, 14
 *                      equipes, prêmio de R$ 810 mil); VCT Americas (liga de parceiros); Masters e Champions.
 *                      Idade mínima de 16 anos nos Challengers (confirmado na cobertura de 2026).
 *   League of Legends  MOBA 5×5 (Riot, 2009). CBLOL desde 2012; em 2025, a LTA Sul; em 2026, o CBLOL volta (Copa
 *                      CBLOL, Etapas 1 e 2; oito equipes). Mundial (Worlds) desde 2011. Idade mínima de 17 anos nas
 *                      ligas principais da Riot.
 *   Rocket League      futebol de carros 3×3 (Psyonix, jul/2015). RLCS: Opens online por região, dois Majors e o
 *                      Mundial; a América do Sul tem duas vagas por Major (2026).
 *
 * FICOU DE FORA: Free Fire (enorme no Brasil, mas não achei fonte confiável sobre o circuito oficial depois de 2025);
 * Apex Legends (circuito existe, mas pouco presente no Brasil — não acrescenta uma trajetória distinta das outras).
 *
 * FATO × ABSTRAÇÃO: os nomes das competições de topo e as datas em que passaram a existir são fatos (pesquisa de nov/
 * 2026; fontes no relatório da VIDA 25). As EQUIPES são todas fictícias (nenhuma organização real, nenhuma conduta
 * atribuída a ela), os adversários e os resultados são simulação, e os valores (salários, prêmios) são estimativas de
 * mercado em reais de 2026. Antes de cada circuito oficial existir, o jogo usa nomes genéricos ("grandes torneios
 * internacionais"); depois de 2026, supõe que os jogos e os circuitos continuam (abstração assumida).
 */

export type JogoId = 'cs' | 'r6' | 'fortnite' | 'valorant' | 'lol' | 'rocket';
export type GeneroJogo = 'tatico' | 'battle_royale' | 'moba' | 'carros';

/** Os atributos possíveis (cada jogo usa só os que fazem sentido nele). */
export type AtributoEsports =
  | 'mira' | 'reflexos' | 'mecanica' | 'posicionamento' | 'utilitarios' | 'estrategia'
  | 'conhecimento' | 'comunicacao' | 'decisao' | 'consistencia' | 'mental'
  // VIDA 26: os específicos de cada jogo (o spray do CS, a construção do Fortnite, o aéreo do Rocket, o repertório do LoL).
  | 'spray' | 'movimentacao' | 'construcao' | 'aereo' | 'mapas' | 'leitura' | 'repertorio' | 'equipe';

export const NOME_ATRIBUTO25: Record<AtributoEsports, string> = {
  mira: 'mira', reflexos: 'reflexos', mecanica: 'mecânica', posicionamento: 'posicionamento', utilitarios: 'utilitários',
  estrategia: 'estratégia', conhecimento: 'conhecimento do jogo', comunicacao: 'comunicação', decisao: 'tomada de decisão',
  consistencia: 'consistência', mental: 'controle emocional',
  spray: 'controle de spray', movimentacao: 'movimentação', construcao: 'construção e edição', aereo: 'controle aéreo', mapas: 'conhecimento de mapas',
  leitura: 'leitura do adversário', repertorio: 'repertório de campeões', equipe: 'trabalho em equipe'
};

/** O grupo de cada atributo na ficha. */
export const GRUPO25: Record<AtributoEsports, 'mecanico' | 'tatico' | 'equipe' | 'mental'> = {
  mira: 'mecanico', reflexos: 'mecanico', mecanica: 'mecanico', posicionamento: 'tatico', utilitarios: 'tatico',
  estrategia: 'tatico', conhecimento: 'tatico', decisao: 'tatico', comunicacao: 'equipe', consistencia: 'mental', mental: 'mental',
  spray: 'mecanico', movimentacao: 'mecanico', construcao: 'mecanico', aereo: 'mecanico', mapas: 'tatico', leitura: 'tatico', repertorio: 'tatico', equipe: 'equipe'
};
export const NOME_GRUPO25 = { mecanico: 'Mecânicos', tatico: 'Táticos', equipe: 'Equipe', mental: 'Mentais' } as const;

/** Os atributos que a IDADE cobra (reação, mão) e os que a EXPERIÊNCIA ensina (leitura, conversa). */
export const DA_MAO25 = new Set<AtributoEsports>(['mira', 'reflexos', 'mecanica', 'spray', 'movimentacao', 'construcao', 'aereo']);
export const DA_LEITURA25 = new Set<AtributoEsports>(['estrategia', 'conhecimento', 'decisao', 'comunicacao', 'posicionamento', 'mapas', 'leitura', 'repertorio', 'equipe']);

export interface Funcao25 { id: string; nome: string; sobre: string; /** Multiplica o peso de atributos (o AWPer vive da mira). */ pesa: Partial<Record<AtributoEsports, number>> }

export interface Nivel25 {
  /** O nome do degrau naquele ano (o circuito oficial existe desde quando). */
  nome: (ano: number, br: boolean) => string;
  /** A competição principal do degrau (liga, circuito, divisão) — e o torneio que fecha o ano. */
  liga: (ano: number, br: boolean) => string;
  torneios: (ano: number, br: boolean) => string[];
  /** Quantos disputam a liga/o circuito; quantos jogos (séries, rodadas) ela tem. */
  equipes: number;
  jogos: number;
  /** A força média do campo (0–100). */
  forca: number;
  /** Salário mensal típico em reais de 2026 (0: não há salário). */
  salario: [number, number];
  /** Prêmio total da liga e de cada torneio (reais de 2026). */
  premio: number;
}

export interface Jogo25 {
  id: JogoId;
  nome: (ano: number) => string;
  genero: GeneroJogo;
  /** Ano em que dá para jogar e competir. */
  lancado: number;
  /** Jogadores por equipe na disputa principal (1 = individual; Fortnite 2026 = dupla). */
  porEquipe: (ano: number) => number;
  /** A idade mínima do contrato profissional (o degrau 3 em diante). */
  idadePro: number;
  /** A régua de idade do auge da mão (reflexos, mecânica). */
  auge: number;
  atributos: [AtributoEsports, number][];
  funcoes: Funcao25[];
  /** As estatísticas que a temporada mostra (o nome da métrica individual). */
  metrica: { nome: string; media: number; sd: number; casas: number; sobre: string };
  /** O que se disputa: "mapas" (CS, R6, VALORANT), "partidas" (LoL), "séries", "quedas" (Fortnite). */
  disputa: [string, string];
  niveis: [Nivel25, Nivel25, Nivel25, Nivel25, Nivel25];
  sobre: string;
}

const desde = (ano: number, a: number, nome: string, antes: string) => (ano >= a ? nome : antes);

export const JOGOS25: Record<JogoId, Jogo25> = {
  cs: {
    id: 'cs', genero: 'tatico', lancado: 2000, idadePro: 16, auge: 23,
    nome: a => (a >= 2023 ? 'Counter-Strike 2' : a >= 2012 ? 'Counter-Strike: Global Offensive' : 'Counter-Strike 1.6'),
    porEquipe: () => 5,
    sobre: 'Tático, cinco contra cinco, terroristas contra contraterroristas. A mira decide o duelo; a granada certa e a chamada do capitão decidem o round.',
    atributos: [['mira', 0.15], ['spray', 0.09], ['reflexos', 0.08], ['movimentacao', 0.06], ['posicionamento', 0.11], ['utilitarios', 0.1], ['mapas', 0.08], ['comunicacao', 0.08], ['decisao', 0.06], ['leitura', 0.05], ['consistencia', 0.07], ['mental', 0.07]],
    funcoes: [
      { id: 'entry', nome: 'entry fragger', sobre: 'O primeiro a entrar no bomb: abre o round ou morre tentando.', pesa: { reflexos: 1.5, mental: 1.2, utilitarios: 0.7, movimentacao: 1.4 } },
      { id: 'awper', nome: 'AWPer', sobre: 'A arma mais cara do jogo: um tiro, uma morte. Vive da mira.', pesa: { mira: 1.6, reflexos: 1.2, comunicacao: 0.7, spray: 0.5 } },
      { id: 'suporte', nome: 'suporte', sobre: 'As granadas que abrem caminho para os outros brilharem.', pesa: { utilitarios: 1.7, comunicacao: 1.3, mira: 0.8, mapas: 1.2 } },
      { id: 'lurker', nome: 'lurker', sobre: 'Sozinho do outro lado do mapa, esperando o momento.', pesa: { posicionamento: 1.6, mental: 1.2, leitura: 1.3 } },
      { id: 'igl', nome: 'capitão (IGL)', sobre: 'Quem chama a estratégia de cada round — e paga com a própria mira.', pesa: { comunicacao: 2, posicionamento: 1.2, mira: 0.6, reflexos: 0.7, mapas: 1.4, leitura: 1.3, decisao: 1.3 } }
    ],
    metrica: { nome: 'rating', media: 1, sd: 0.12, casas: 2, sobre: 'o impacto por round (1,00 é a média de quem joga no mesmo nível)' },
    disputa: ['mapa', 'mapas'],
    niveis: [
      { nome: () => 'Ranqueadas e campeonatos online', liga: (_a, br) => (br ? 'ligas abertas e ranqueadas online' : 'ligas abertas online'), torneios: () => ['copas de fim de semana'], equipes: 64, jogos: 40, forca: 34, salario: [0, 0], premio: 4000 },
      { nome: () => 'Cenário aberto', liga: () => 'qualificatórias abertas e campeonatos de LAN', torneios: () => ['qualificatória aberta', 'campeonato de LAN regional'], equipes: 32, jogos: 46, forca: 47, salario: [0, 1500], premio: 30000 },
      { nome: (_a, br) => (br ? 'Segunda divisão sul-americana' : 'Segunda divisão regional'), liga: (_a, br) => (br ? 'circuito da segunda divisão sul-americana' : 'circuito regional da segunda divisão'), torneios: a => [desde(a, 2023, 'qualificatória regional para torneios internacionais', 'qualificatória regional')], equipes: 16, jogos: 54, forca: 59, salario: [2500, 7000], premio: 250000 },
      { nome: () => 'Elite internacional', liga: a => desde(a, 2016, 'ESL Pro League', 'circuito internacional de ligas'), torneios: a => [desde(a, 2006, 'Intel Extreme Masters', 'grande torneio internacional'), desde(a, 2017, 'torneios da BLAST', 'torneio internacional por convite')], equipes: 24, jogos: 62, forca: 71, salario: [12000, 45000], premio: 3500000 },
      { nome: a => desde(a, 2013, 'Major', 'Grandes torneios mundiais'), liga: a => desde(a, 2013, 'Major de Counter-Strike', 'grande torneio mundial'), torneios: a => [desde(a, 2016, 'ESL Pro League (fase final)', 'final do circuito internacional')], equipes: 24, jogos: 70, forca: 81, salario: [40000, 160000], premio: 6000000 }
    ]
  },
  r6: {
    id: 'r6', genero: 'tatico', lancado: 2016, idadePro: 16, auge: 24,
    nome: () => 'Rainbow Six Siege',
    porEquipe: () => 5,
    sobre: 'Tático, cinco contra cinco, ataque contra defesa num prédio que se destrói. Drones, paredes reforçadas, operadores com aparelhos próprios: quem conhece o mapa joga um round antes.',
    atributos: [['mira', 0.12], ['reflexos', 0.08], ['conhecimento', 0.12], ['mapas', 0.1], ['utilitarios', 0.14], ['comunicacao', 0.12], ['posicionamento', 0.1], ['decisao', 0.07], ['leitura', 0.05], ['mental', 0.1]],
    funcoes: [
      { id: 'entry', nome: 'entry', sobre: 'Abre o caminho no ataque: o primeiro a cruzar a porta.', pesa: { reflexos: 1.5, mira: 1.2 } },
      { id: 'suporte', nome: 'suporte', sobre: 'Drones, gadgets, a parede aberta na hora certa.', pesa: { utilitarios: 1.6, comunicacao: 1.3 } },
      { id: 'flex', nome: 'flex', sobre: 'Joga o operador que o mapa pedir.', pesa: { conhecimento: 1.4, mapas: 1.3 } },
      { id: 'ancora', nome: 'âncora', sobre: 'Segura o objetivo na defesa até o último segundo.', pesa: { posicionamento: 1.6, mental: 1.3 } },
      { id: 'igl', nome: 'capitão (IGL)', sobre: 'Chama a estratégia, escolhe os banimentos de operador.', pesa: { comunicacao: 2, conhecimento: 1.3, mira: 0.7 } }
    ],
    metrica: { nome: 'rating', media: 1, sd: 0.12, casas: 2, sobre: 'o impacto por round (1,00 é a média do nível)' },
    disputa: ['mapa', 'mapas'],
    niveis: [
      { nome: () => 'Ranqueadas e copas online', liga: () => 'ranqueadas e copas abertas', torneios: () => ['copa online de fim de semana'], equipes: 64, jogos: 36, forca: 34, salario: [0, 0], premio: 3000 },
      { nome: () => 'Cenário aberto', liga: () => 'campeonatos abertos e qualificatórias', torneios: () => ['qualificatória aberta da segunda divisão'], equipes: 32, jogos: 40, forca: 47, salario: [0, 1200], premio: 20000 },
      { nome: (_a, br) => (br ? 'Segunda divisão sul-americana' : 'Segunda divisão regional'), liga: (_a, br) => (br ? 'segunda divisão sul-americana' : 'segunda divisão regional'), torneios: () => ['torneio de acesso à liga regional'], equipes: 10, jogos: 32, forca: 59, salario: [2000, 6000], premio: 150000 },
      { nome: (_a, br) => (br ? 'Liga sul-americana' : 'Liga regional'), liga: (a, br) => desde(a, 2016, br ? 'liga sul-americana do circuito oficial' : 'liga regional do circuito oficial', 'liga regional'), torneios: a => [desde(a, 2019, 'Major de Rainbow Six', 'torneio internacional')], equipes: 10, jogos: 36, forca: 71, salario: [9000, 35000], premio: 2000000 },
      { nome: a => desde(a, 2017, 'Six Invitational', 'Torneio mundial'), liga: a => desde(a, 2017, 'Six Invitational', 'torneio mundial'), torneios: a => [desde(a, 2019, 'Major de Rainbow Six', 'torneio internacional'), desde(a, 2024, 'Esports World Cup', 'torneio internacional de meio de ano')], equipes: 20, jogos: 40, forca: 81, salario: [30000, 110000], premio: 9000000 }
    ]
  },
  fortnite: {
    id: 'fortnite', genero: 'battle_royale', lancado: 2018, idadePro: 13, auge: 20,
    nome: () => 'Fortnite',
    // O formato do circuito principal mudou várias vezes: duplas em 2018–19, trios em 2020–22, duplas em 2023–24, trios em
    // 2025 e de volta às duplas em 2026.
    porEquipe: a => (a >= 2026 ? 2 : a === 2025 ? 3 : a >= 2023 ? 2 : a >= 2020 ? 3 : 2),
    sobre: 'Battle royale: cem jogadores numa ilha que encolhe, construção e edição em fração de segundo. Ninguém ganha a queda sozinho: decide-se onde estar quando a zona fecha.',
    atributos: [['mecanica', 0.14], ['construcao', 0.14], ['mira', 0.14], ['decisao', 0.16], ['movimentacao', 0.08], ['consistencia', 0.1], ['mental', 0.12], ['comunicacao', 0.06], ['leitura', 0.06]],
    funcoes: [
      { id: 'fragger', nome: 'quem elimina', sobre: 'Busca as eliminações; os pontos do duo vêm com ele.', pesa: { mira: 1.4, mecanica: 1.2, construcao: 1.3 } },
      { id: 'igl', nome: 'quem chama a rotação', sobre: 'Lê a zona e decide para onde ir — e quando ficar quieto.', pesa: { decisao: 1.7, comunicacao: 1.4, leitura: 1.3 } }
    ],
    metrica: { nome: 'eliminações por queda', media: 2.2, sd: 0.7, casas: 1, sobre: 'quantas eliminações, em média, cada queda rende' },
    disputa: ['queda', 'quedas'],
    niveis: [
      { nome: () => 'Arena e copas abertas', liga: () => 'Arena e copas abertas', torneios: () => ['copa aberta da semana'], equipes: 100, jogos: 60, forca: 34, salario: [0, 0], premio: 2000 },
      { nome: a => desde(a, 2023, 'Divisões de base do FNCS', 'Copas competitivas'), liga: a => desde(a, 2023, 'divisões do FNCS (4 e 5)', 'copas competitivas'), torneios: () => ['copa divisional'], equipes: 100, jogos: 50, forca: 47, salario: [0, 0], premio: 15000 },
      { nome: a => desde(a, 2023, 'Divisões de cima do FNCS', 'Qualificatórias do FNCS'), liga: a => desde(a, 2023, 'divisões do FNCS (2 e 3)', 'qualificatórias do FNCS'), torneios: a => [desde(a, 2019, 'qualificatória do FNCS', 'qualificatória de torneio')], equipes: 100, jogos: 40, forca: 59, salario: [0, 4000], premio: 120000 },
      { nome: a => desde(a, 2019, 'FNCS · Divisão 1 e Majors', 'Grandes torneios'), liga: a => desde(a, 2019, 'FNCS (Divisão 1)', 'grandes torneios abertos'), torneios: a => [desde(a, 2019, 'final de Major do FNCS', 'final de grande torneio')], equipes: 100, jogos: 30, forca: 71, salario: [6000, 25000], premio: 1500000 },
      { nome: a => desde(a, 2023, 'Global Championship', desde(a, 2019, 'Copa do Mundo de Fortnite', 'Torneio mundial')), liga: a => desde(a, 2023, 'Global Championship', desde(a, 2019, 'Copa do Mundo de Fortnite', 'torneio mundial')), torneios: () => [], equipes: 50, jogos: 12, forca: 81, salario: [20000, 80000], premio: 8000000 }
    ]
  },
  valorant: {
    id: 'valorant', genero: 'tatico', lancado: 2020, idadePro: 16, auge: 23,
    nome: () => 'VALORANT',
    porEquipe: () => 5,
    sobre: 'Tático, cinco contra cinco, com agentes de habilidades próprias. A mira é a do Counter-Strike; a fumaça, o flash e o reconhecimento de cada agente decidem quem vê primeiro.',
    atributos: [['mira', 0.16], ['reflexos', 0.1], ['spray', 0.04], ['movimentacao', 0.07], ['utilitarios', 0.14], ['mapas', 0.07], ['comunicacao', 0.1], ['posicionamento', 0.1], ['decisao', 0.06], ['consistencia', 0.08], ['mental', 0.08]],
    funcoes: [
      { id: 'duelista', nome: 'duelista', sobre: 'Entra primeiro e busca o abate.', pesa: { mira: 1.4, reflexos: 1.5, movimentacao: 1.3 } },
      { id: 'iniciador', nome: 'iniciador', sobre: 'Revela e cega o adversário para o time entrar.', pesa: { utilitarios: 1.5, comunicacao: 1.2 } },
      { id: 'controlador', nome: 'controlador', sobre: 'As fumaças que cortam o mapa — muitas vezes, o capitão.', pesa: { utilitarios: 1.4, comunicacao: 1.5, posicionamento: 1.1 } },
      { id: 'sentinela', nome: 'sentinela', sobre: 'Segura o flanco e o bomb com armadilhas.', pesa: { posicionamento: 1.5, mental: 1.2 } }
    ],
    metrica: { nome: 'ACS', media: 200, sd: 28, casas: 0, sobre: 'a pontuação média de combate por round (200 é a média do nível)' },
    disputa: ['mapa', 'mapas'],
    niveis: [
      { nome: () => 'Ranqueadas e torneios online', liga: () => 'ranqueadas e torneios online', torneios: () => ['copa online'], equipes: 64, jogos: 36, forca: 34, salario: [0, 0], premio: 3000 },
      { nome: a => desde(a, 2023, 'Premier e cenário aberto', 'Cenário aberto'), liga: a => desde(a, 2023, 'Premier e campeonatos abertos', 'campeonatos abertos'), torneios: () => ['qualificatória aberta dos Challengers'], equipes: 32, jogos: 40, forca: 47, salario: [0, 1500], premio: 25000 },
      { nome: (a, br) => (br ? desde(a, 2023, 'Challengers Brazil', 'VCT Brasil (etapas abertas)') : 'Challengers regional'), liga: (a, br) => (br ? desde(a, 2023, 'Challengers Brazil', 'etapas abertas do VCT Brasil') : 'liga Challengers da região'), torneios: (a, br) => [desde(a, 2026, br ? 'playoffs da Etapa 2 (vaga na liga internacional)' : 'playoffs regionais', 'acesso à liga internacional')], equipes: 14, jogos: 30, forca: 59, salario: [2500, 8000], premio: 810000 },
      { nome: (a, br) => (br ? desde(a, 2023, 'VCT Americas', 'VCT Brasil') : desde(a, 2023, 'Liga internacional do VCT', 'VCT regional')), liga: (a, br) => (br ? desde(a, 2023, 'VCT Americas', 'VCT Brasil') : desde(a, 2023, 'liga internacional do VCT', 'VCT regional')), torneios: a => [desde(a, 2021, 'Masters', 'torneio internacional')], equipes: 12, jogos: 30, forca: 71, salario: [15000, 50000], premio: 2500000 },
      { nome: a => desde(a, 2021, 'Champions', 'Torneio mundial'), liga: a => desde(a, 2021, 'VALORANT Champions', 'torneio mundial'), torneios: a => [desde(a, 2021, 'Masters', 'torneio internacional')], equipes: 16, jogos: 24, forca: 81, salario: [40000, 140000], premio: 11000000 }
    ]
  },
  lol: {
    id: 'lol', genero: 'moba', lancado: 2010, idadePro: 17, auge: 22,
    nome: () => 'League of Legends',
    porEquipe: () => 5,
    sobre: 'MOBA, cinco contra cinco, duas bases e três rotas. A mecânica ganha a rota; o macro — os objetivos, o tempo do dragão, a visão — ganha o jogo.',
    atributos: [['mecanica', 0.16], ['repertorio', 0.08], ['estrategia', 0.15], ['conhecimento', 0.1], ['decisao', 0.12], ['comunicacao', 0.1], ['equipe', 0.07], ['leitura', 0.06], ['consistencia', 0.08], ['mental', 0.08]],
    funcoes: [
      { id: 'top', nome: 'top', sobre: 'A rota isolada: o duelo de um contra um.', pesa: { mecanica: 1.3, mental: 1.3 } },
      { id: 'jungle', nome: 'caçador', sobre: 'Anda o mapa inteiro: os objetivos e as emboscadas.', pesa: { estrategia: 1.6, decisao: 1.4, leitura: 1.3 } },
      { id: 'mid', nome: 'meio', sobre: 'O centro do mapa: o maior repertório de campeões.', pesa: { mecanica: 1.5, conhecimento: 1.2, repertorio: 1.4 } },
      { id: 'adc', nome: 'atirador', sobre: 'O dano de longe no fim do jogo — e quem mais precisa sobreviver.', pesa: { mecanica: 1.5, posicionamento: 1, consistencia: 1.3 } },
      { id: 'suporte', nome: 'suporte', sobre: 'A visão do mapa e a chamada da luta.', pesa: { comunicacao: 1.8, estrategia: 1.3, mecanica: 0.7, equipe: 1.4 } }
    ],
    metrica: { nome: 'KDA', media: 3.2, sd: 0.9, casas: 1, sobre: '(abates + assistências) por morte' },
    disputa: ['partida', 'partidas'],
    niveis: [
      { nome: () => 'Ranqueada solo', liga: () => 'fila ranqueada', torneios: () => ['torneio online amador'], equipes: 64, jogos: 30, forca: 34, salario: [0, 0], premio: 2000 },
      { nome: () => 'Torneios amadores e semiprofissionais', liga: () => 'torneios abertos e ligas semiprofissionais', torneios: () => ['qualificatória para a segunda divisão'], equipes: 32, jogos: 30, forca: 47, salario: [0, 1500], premio: 20000 },
      { nome: (a, br) => (br ? desde(a, 2017, 'Circuito Desafiante', 'Segunda divisão nacional') : 'Segunda divisão regional'), liga: (a, br) => (br ? (a >= 2017 && a <= 2024 ? 'Circuito Desafiante' : 'segunda divisão nacional') : 'liga regional de acesso'), torneios: () => ['série de acesso'], equipes: 8, jogos: 28, forca: 59, salario: [2500, 7000], premio: 200000 },
      { nome: (a, br) => (br ? (a === 2025 ? 'LTA Sul' : desde(a, 2012, 'CBLOL', 'Liga nacional')) : 'Liga principal da região'), liga: (a, br) => (br ? (a === 2025 ? 'LTA Sul' : desde(a, 2012, 'CBLOL', 'liga nacional')) : 'liga principal da região'), torneios: (a, br) => [br && a >= 2026 ? 'Copa CBLOL' : 'playoffs da liga'], equipes: 8, jogos: 36, forca: 71, salario: [10000, 40000], premio: 1500000 },
      { nome: a => desde(a, 2011, 'Mundial (Worlds)', 'Torneio mundial'), liga: a => desde(a, 2011, 'Mundial de League of Legends', 'torneio mundial'), torneios: a => [desde(a, 2017, 'Mid-Season Invitational', 'torneio internacional'), desde(a, 2025, 'First Stand', '')].filter(Boolean), equipes: 17, jogos: 20, forca: 81, salario: [35000, 150000], premio: 11000000 }
    ]
  },
  rocket: {
    id: 'rocket', genero: 'carros', lancado: 2015, idadePro: 15, auge: 21,
    nome: () => 'Rocket League',
    porEquipe: () => 3,
    sobre: 'Futebol de carros, três contra três: aéreos, ricochetes na parede, rotação constante entre ataque e defesa. Mecânica que impressiona ganha lance; rotação que ninguém vê ganha série.',
    atributos: [['mecanica', 0.18], ['aereo', 0.12], ['reflexos', 0.1], ['posicionamento', 0.16], ['decisao', 0.12], ['comunicacao', 0.08], ['equipe', 0.06], ['consistencia', 0.08], ['mental', 0.1]],
    funcoes: [
      { id: 'ataque', nome: 'primeiro no ataque', sobre: 'Pressiona e finaliza: os aéreos e o gol.', pesa: { mecanica: 1.4, reflexos: 1.2, aereo: 1.5 } },
      { id: 'rotacao', nome: 'meio da rotação', sobre: 'O elo: chega na sobra, mantém a pressão.', pesa: { posicionamento: 1.4, decisao: 1.3, equipe: 1.2 } },
      { id: 'defesa', nome: 'último homem', sobre: 'O que não pode errar: a defesa e a saída.', pesa: { posicionamento: 1.6, consistencia: 1.4, mental: 1.2 } }
    ],
    metrica: { nome: 'gols por série', media: 1.6, sd: 0.5, casas: 1, sobre: 'quantos gols, em média, cada série rende' },
    disputa: ['série', 'séries'],
    niveis: [
      { nome: () => 'Ranqueadas e copas online', liga: () => 'ranqueadas e copas abertas', torneios: () => ['copa online'], equipes: 64, jogos: 40, forca: 34, salario: [0, 0], premio: 2000 },
      { nome: () => 'Cenário aberto', liga: a => desde(a, 2016, 'Opens regionais do RLCS', 'torneios abertos'), torneios: () => ['qualificatória aberta'], equipes: 64, jogos: 36, forca: 47, salario: [0, 800], premio: 12000 },
      { nome: (_a, br) => (br ? 'Top 16 sul-americano' : 'Top 16 regional'), liga: (a, br) => desde(a, 2016, br ? 'fase final dos Opens sul-americanos do RLCS' : 'fase final dos Opens regionais do RLCS', 'fase final dos torneios regionais'), torneios: () => ['Last Chance Qualifier'], equipes: 16, jogos: 34, forca: 59, salario: [1500, 5000], premio: 120000 },
      { nome: a => desde(a, 2016, 'Major do RLCS', 'Grande torneio'), liga: a => desde(a, 2016, 'Major do RLCS', 'grande torneio internacional'), torneios: () => [], equipes: 16, jogos: 30, forca: 71, salario: [6000, 22000], premio: 2000000 },
      { nome: a => desde(a, 2016, 'Mundial do RLCS', 'Torneio mundial'), liga: a => desde(a, 2016, 'Mundial do RLCS', 'torneio mundial'), torneios: () => [], equipes: 20, jogos: 16, forca: 81, salario: [18000, 60000], premio: 4500000 }
    ]
  }
};

export const LISTA_JOGOS25: JogoId[] = ['cs', 'valorant', 'lol', 'r6', 'fortnite', 'rocket'];

/** O que cada atributo é, no jogo (a ficha explica). */
export const SOBRE_ATRIBUTO25: Record<AtributoEsports, string> = {
  mira: 'Acertar primeiro e acertar a cabeça: o duelo que se ganha no clique.',
  reflexos: 'O tempo de reação: ver, decidir e clicar antes do outro.',
  mecanica: 'A mão no controle: as combinações, a construção, o aéreo — o que só o treino diário mantém.',
  posicionamento: 'Estar no lugar certo, com cobertura, na hora em que a jogada chega.',
  utilitarios: 'Granadas, gadgets, habilidades: o recurso certo no segundo certo.',
  estrategia: 'O jogo grande: os objetivos, o tempo, o plano das próximas jogadas.',
  conhecimento: 'Os mapas, os personagens, a versão atual do jogo — e o que mudou nela.',
  comunicacao: 'Falar o que importa, curto, na hora: a informação e a chamada.',
  decisao: 'Escolher bem sob pressão: arriscar, recuar, rodar.',
  consistencia: 'Render igual na série inteira e na temporada inteira — sem a partida que some.',
  mental: 'O controle quando o placar aperta: a final, o round decisivo, a derrota que não vira duas.',
  spray: 'Segurar a rajada no alvo: o recuo da arma controlado pela mão.',
  movimentacao: 'Andar, parar e atirar no tempo certo; o pico e o reposicionamento.',
  construcao: 'Construir e editar em segundos: a parede que salva, a rampa que dá a altura.',
  aereo: 'O carro no ar: o toque aéreo, a recuperação, o drible de parede.',
  mapas: 'Cada canto de cada mapa: os ângulos, os tempos de rotação, os lugares de granada.',
  leitura: 'Adivinhar o que o outro time vai fazer — e chegar antes.',
  repertorio: 'Os campeões que se joga bem: quanto maior, mais difícil de banir.',
  equipe: 'Jogar para os outros: a troca, o sacrifício, o tempo do grupo.'
};
