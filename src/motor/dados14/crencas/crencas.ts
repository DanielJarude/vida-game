/**
 * VIDA 14 · CRENÇAS — o catálogo puro (só dados): as crenças e tradições, o que cada uma pratica e celebra, a peregrinação
 * ou o retiro de cada uma, e a distribuição APROXIMADA por país (censos e pesquisas recentes, arredondados) de onde a
 * família vem. A distribuição só serve para sortear a crença dos pais: nunca determina personalidade, moral ou escolhas.
 *
 * Também o catálogo das dependências (`DEPENDENCIAS14`): nomes, o custo mensal por estágio (na cidade de custo 1,0) e onde
 * se pede ajuda. A lógica mora em `motor/v14/crencas` e `motor/v14/dependencias`.
 */

export type Crenca14 =
  | 'ateismo' | 'agnosticismo' | 'sem_religiao' | 'espiritualidade'
  | 'catolica' | 'evangelica' | 'protestante' | 'ortodoxa' | 'espirita' | 'outra_crista'
  | 'islamismo' | 'judaismo' | 'hinduismo' | 'budismo' | 'sikhismo' | 'xintoismo' | 'tradicao_chinesa'
  | 'candomble' | 'umbanda' | 'indigena' | 'outra';

export type GrupoDeCrenca14 = 'sem' | 'crista' | 'outras';

export interface InfoCrenca14 {
  nome: string;
  grupo: GrupoDeCrenca14;
  /** A frase da conversão: "Converteu-se ao budismo" (com a preposição contraída). */
  ao: string;
  /** A prática regular, em palavras (sem prática comunitária: ausente). */
  pratica?: string;
  /** Onde a comunidade se encontra, com artigo. */
  lugar?: string;
  celebracoes: string[];
  /** A viagem ou o retiro que a tradição conhece (custo na cidade de custo 1,0). */
  jornada?: { texto: string; custo: number };
}

export const CRENCAS14: Record<Crenca14, InfoCrenca14> = {
  ateismo: { nome: 'Ateísmo', grupo: 'sem', ao: 'ao ateísmo', celebracoes: [] },
  agnosticismo: { nome: 'Agnosticismo', grupo: 'sem', ao: 'ao agnosticismo', celebracoes: [] },
  sem_religiao: { nome: 'Sem religião', grupo: 'sem', ao: 'a uma vida sem religião', celebracoes: [] },
  espiritualidade: { nome: 'Espiritualidade sem religião', grupo: 'sem', ao: 'a uma espiritualidade própria, sem igreja', celebracoes: [],
    jornada: { texto: 'um retiro de silêncio de uma semana, longe do celular', custo: 2500 } },
  catolica: { nome: 'Cristianismo católico', grupo: 'crista', ao: 'ao catolicismo', pratica: 'a missa de domingo e a vida da paróquia', lugar: 'a paróquia', celebracoes: ['natal', 'pascoa'],
    jornada: { texto: 'a peregrinação a um santuário, a pé no último trecho', custo: 3000 } },
  evangelica: { nome: 'Cristianismo evangélico', grupo: 'crista', ao: 'a uma igreja evangélica', pratica: 'os cultos, o grupo de oração e o louvor', lugar: 'a igreja', celebracoes: ['natal', 'pascoa'],
    jornada: { texto: 'um retiro da igreja de três dias, numa chácara', custo: 900 } },
  protestante: { nome: 'Cristianismo protestante histórico', grupo: 'crista', ao: 'a uma igreja protestante', pratica: 'o culto de domingo e o estudo bíblico', lugar: 'a igreja', celebracoes: ['natal', 'pascoa'],
    jornada: { texto: 'um retiro de fim de semana com a congregação', custo: 900 } },
  ortodoxa: { nome: 'Cristianismo ortodoxo', grupo: 'crista', ao: 'à Igreja Ortodoxa', pratica: 'a liturgia de domingo e os jejuns do calendário', lugar: 'a igreja ortodoxa', celebracoes: ['natal_ortodoxo', 'pascoa'],
    jornada: { texto: 'a visita a um mosteiro antigo, com a liturgia da madrugada', custo: 4000 } },
  espirita: { nome: 'Espiritismo kardecista', grupo: 'crista', ao: 'ao espiritismo', pratica: 'as reuniões de estudo, as palestras e o passe', lugar: 'o centro espírita', celebracoes: ['natal'],
    jornada: { texto: 'um congresso espírita, com palestras o dia inteiro', custo: 1200 } },
  outra_crista: { nome: 'Outra tradição cristã', grupo: 'crista', ao: 'a outra tradição cristã', pratica: 'os encontros de domingo da congregação', lugar: 'a congregação', celebracoes: ['natal', 'pascoa'] },
  islamismo: { nome: 'Islamismo', grupo: 'outras', ao: 'ao islã', pratica: 'as orações do dia e a oração de sexta na mesquita', lugar: 'a mesquita', celebracoes: ['ramada', 'eid_fitr', 'eid_adha'],
    jornada: { texto: 'a peregrinação a Meca (o Hajj), que se faz uma vez na vida, quando se pode', custo: 30000 } },
  judaismo: { nome: 'Judaísmo', grupo: 'outras', ao: 'ao judaísmo', pratica: 'o Shabat em casa e a sinagoga', lugar: 'a sinagoga', celebracoes: ['pessach', 'rosh_hashana', 'yom_kipur', 'hanuca'],
    jornada: { texto: 'uma viagem a Jerusalém, com o Muro das Lamentações', custo: 18000 } },
  hinduismo: { nome: 'Hinduísmo', grupo: 'outras', ao: 'ao hinduísmo', pratica: 'a puja em casa e as visitas ao templo', lugar: 'o templo', celebracoes: ['holi', 'diwali'],
    jornada: { texto: 'uma peregrinação a Varanasi, com o banho no Ganges ao amanhecer', custo: 12000 } },
  budismo: { nome: 'Budismo', grupo: 'outras', ao: 'ao budismo', pratica: 'a meditação e os ensinamentos no templo', lugar: 'o templo', celebracoes: ['vesak'],
    jornada: { texto: 'um retiro de meditação de dez dias num mosteiro', custo: 3000 } },
  sikhismo: { nome: 'Sikhismo', grupo: 'outras', ao: 'ao sikhismo', pratica: 'as orações e o langar, a refeição dividida no gurdwara', lugar: 'o gurdwara', celebracoes: ['vaisakhi', 'diwali', 'gurpurab'],
    jornada: { texto: 'a viagem ao Templo Dourado, em Amritsar', custo: 12000 } },
  xintoismo: { nome: 'Xintoísmo', grupo: 'outras', ao: 'ao xintoísmo', pratica: 'as visitas ao santuário e o pequeno altar de casa', lugar: 'o santuário', celebracoes: ['hatsumode', 'obon'],
    jornada: { texto: 'a visita ao Grande Santuário de Ise', custo: 6000 } },
  tradicao_chinesa: { nome: 'Tradições chinesas (taoísmo e religião popular)', grupo: 'outras', ao: 'às tradições chinesas', pratica: 'o incenso aos antepassados e as visitas ao templo', lugar: 'o templo', celebracoes: ['ano_novo_lunar', 'qingming'] },
  candomble: { nome: 'Candomblé', grupo: 'outras', ao: 'ao candomblé', pratica: 'as obrigações e as festas do terreiro', lugar: 'o terreiro', celebracoes: ['iemanja'],
    jornada: { texto: 'a festa grande do terreiro em que tudo começou, numa outra cidade', custo: 1500 } },
  umbanda: { nome: 'Umbanda', grupo: 'outras', ao: 'à umbanda', pratica: 'as giras e o atendimento no terreiro', lugar: 'o terreiro', celebracoes: ['iemanja', 'cosme_damiao'] },
  indigena: { nome: 'Tradição indígena', grupo: 'outras', ao: 'à espiritualidade da tradição indígena da família', pratica: 'as cerimônias e os encontros da comunidade', lugar: 'a comunidade', celebracoes: [] },
  outra: { nome: 'Outra religião', grupo: 'outras', ao: 'a outra religião', pratica: 'os encontros da comunidade', lugar: 'a comunidade', celebracoes: [] }
};

export const ORDEM_CRENCAS14 = Object.keys(CRENCAS14) as Crenca14[];

/** Celebrações. `mes`: 0..11 fixo (com `dia`) ou calculado (`calc`); `cena`: o que a vida conta, sem estereótipo. */
export interface Celebracao14 { nome: string; mes?: number; dia?: number; calc?: 'pascoa' | 'ramada' | 'eid_fitr' | 'eid_adha'; aprox?: boolean; cena: string }
export const CELEBRACOES14: Record<string, Celebracao14> = {
  natal: { nome: 'Natal', mes: 11, dia: 25, cena: 'A ceia de Natal na casa da família: comida demais, conversa até tarde.' },
  natal_ortodoxo: { nome: 'Natal ortodoxo', mes: 0, dia: 7, cena: 'O Natal ortodoxo, em janeiro: a liturgia longa e a mesa da família depois.' },
  pascoa: { nome: 'Páscoa', calc: 'pascoa', cena: 'A Páscoa: a celebração da madrugada e o almoço de domingo com a família.' },
  ramada: { nome: 'Começo do Ramadã', calc: 'ramada', aprox: true, cena: 'O Ramadã: o jejum do nascer ao pôr do sol e o iftar com a família e os vizinhos.' },
  eid_fitr: { nome: 'Eid al-Fitr', calc: 'eid_fitr', aprox: true, cena: 'O Eid al-Fitr, no fim do Ramadã: roupa nova, visitas e doce para as crianças.' },
  eid_adha: { nome: 'Eid al-Adha', calc: 'eid_adha', aprox: true, cena: 'O Eid al-Adha: a oração da manhã e a comida repartida com quem precisa.' },
  pessach: { nome: 'Pessach', mes: 3, aprox: true, cena: 'O Seder de Pessach: a história contada de novo à mesa, as perguntas das crianças.' },
  rosh_hashana: { nome: 'Rosh Hashaná', mes: 8, aprox: true, cena: 'Rosh Hashaná: maçã com mel para um ano doce.' },
  yom_kipur: { nome: 'Yom Kipur', mes: 8, aprox: true, cena: 'Yom Kipur: o dia de jejum e de pedir perdão a quem se magoou.' },
  hanuca: { nome: 'Hanucá', mes: 11, aprox: true, cena: 'Hanucá: uma vela a mais em cada uma das oito noites.' },
  holi: { nome: 'Holi', mes: 2, aprox: true, cena: 'O Holi: pó colorido na rua, ninguém volta para casa com a roupa limpa.' },
  diwali: { nome: 'Diwali', mes: 9, aprox: true, cena: 'O Diwali: as lamparinas na janela, os doces para os vizinhos.' },
  vesak: { nome: 'Vesak', mes: 4, aprox: true, cena: 'O Vesak: as lanternas no templo e a manhã de oferendas.' },
  vaisakhi: { nome: 'Vaisakhi', mes: 3, dia: 13, cena: 'O Vaisakhi: a procissão e o langar para quem chegar.' },
  gurpurab: { nome: 'Gurpurab de Guru Nanak', mes: 10, aprox: true, cena: 'O aniversário de Guru Nanak: a leitura contínua no gurdwara e a cozinha aberta.' },
  hatsumode: { nome: 'Hatsumōde', mes: 0, dia: 1, cena: 'A primeira visita do ano ao santuário: a fila, o sino, o papel da sorte.' },
  obon: { nome: 'Obon', mes: 7, aprox: true, cena: 'O Obon: as lanternas para os antepassados e a dança do bairro.' },
  ano_novo_lunar: { nome: 'Ano-novo lunar', mes: 1, aprox: true, cena: 'O ano-novo lunar: a casa limpa, o jantar da família, os envelopes vermelhos.' },
  qingming: { nome: 'Qingming', mes: 3, dia: 5, cena: 'O Qingming: limpar o túmulo dos avós e deixar flores.' },
  iemanja: { nome: 'Festa de Iemanjá', mes: 1, dia: 2, cena: 'O 2 de fevereiro: flores no mar para Iemanjá, de branco, com o terreiro.' },
  cosme_damiao: { nome: 'Cosme e Damião', mes: 8, dia: 27, cena: 'Cosme e Damião: os saquinhos de doce para as crianças da rua.' }
};

/**
 * A distribuição aproximada de onde as famílias vêm (pesos, não porcentagens exatas). País fora da lista: `outro`.
 * Fontes: censos nacionais e Pew Research (arredondados). Só sorteia a crença dos pais.
 */
type Dist = Partial<Record<Crenca14, number>>;
export const DISTRIBUICAO14: Record<string, Dist> = {
  BR: { catolica: 50, evangelica: 24, protestante: 3, espirita: 2, umbanda: 1, candomble: 0.5, sem_religiao: 9, ateismo: 1, agnosticismo: 1, espiritualidade: 4, outra_crista: 2, judaismo: 0.2, budismo: 0.2, indigena: 0.3, outra: 1 },
  PT: { catolica: 78, sem_religiao: 9, ateismo: 3, agnosticismo: 2, evangelica: 2, ortodoxa: 1, islamismo: 0.5, espiritualidade: 3, outra: 1.5 },
  ES: { catolica: 56, ateismo: 15, agnosticismo: 9, sem_religiao: 12, islamismo: 3, evangelica: 1, espiritualidade: 3, outra: 1 },
  FR: { catolica: 29, sem_religiao: 34, ateismo: 15, agnosticismo: 5, islamismo: 9, protestante: 2, judaismo: 1, budismo: 1, ortodoxa: 1, espiritualidade: 3 },
  DE: { catolica: 24, protestante: 22, sem_religiao: 30, ateismo: 9, agnosticismo: 3, islamismo: 6, ortodoxa: 2, espiritualidade: 3, outra: 1 },
  IT: { catolica: 70, sem_religiao: 12, ateismo: 7, agnosticismo: 3, islamismo: 3, ortodoxa: 2, espiritualidade: 2, outra: 1 },
  GB: { protestante: 30, catolica: 8, evangelica: 3, sem_religiao: 30, ateismo: 9, agnosticismo: 3, islamismo: 6.5, hinduismo: 1.7, sikhismo: 0.8, judaismo: 0.5, budismo: 0.5, espiritualidade: 4, outra: 2 },
  US: { evangelica: 24, protestante: 14, catolica: 20, outra_crista: 3, ortodoxa: 0.5, sem_religiao: 16, ateismo: 4, agnosticismo: 5, judaismo: 2, islamismo: 1, budismo: 1, hinduismo: 1, espiritualidade: 6, indigena: 0.3, outra: 1.5 },
  CA: { catolica: 29, protestante: 12, evangelica: 6, ortodoxa: 1.5, sem_religiao: 25, ateismo: 6, agnosticismo: 3, islamismo: 5, hinduismo: 2.3, sikhismo: 2, budismo: 1, judaismo: 1, indigena: 0.5, espiritualidade: 5 },
  MX: { catolica: 77, evangelica: 10, outra_crista: 1, sem_religiao: 8, ateismo: 1, espiritualidade: 2, indigena: 0.5, outra: 0.5 },
  AR: { catolica: 63, evangelica: 15, sem_religiao: 12, ateismo: 4, agnosticismo: 2, judaismo: 0.5, islamismo: 0.3, espiritualidade: 3, outra: 0.5 },
  CL: { catolica: 45, evangelica: 17, sem_religiao: 25, ateismo: 5, agnosticismo: 3, espiritualidade: 3, indigena: 1, outra: 1 },
  UY: { catolica: 35, evangelica: 10, sem_religiao: 30, ateismo: 10, agnosticismo: 4, espiritualidade: 6, umbanda: 1, judaismo: 0.5 },
  CO: { catolica: 70, evangelica: 17, sem_religiao: 7, ateismo: 2, espiritualidade: 3, indigena: 0.5, outra: 0.5 },
  PE: { catolica: 75, evangelica: 14, sem_religiao: 5, ateismo: 1, espiritualidade: 2, indigena: 1, outra_crista: 2 },
  CR: { catolica: 50, evangelica: 25, sem_religiao: 15, ateismo: 3, espiritualidade: 5, outra: 2 },
  DO: { catolica: 50, evangelica: 22, sem_religiao: 20, ateismo: 2, espiritualidade: 4, outra: 2 },
  ZA: { evangelica: 25, protestante: 25, catolica: 7, outra_crista: 15, sem_religiao: 12, ateismo: 2, islamismo: 2, hinduismo: 1, indigena: 5, judaismo: 0.2, espiritualidade: 2 },
  NG: { islamismo: 50, evangelica: 20, protestante: 10, catolica: 12, outra_crista: 3, indigena: 3, sem_religiao: 1 },
  AO: { catolica: 41, evangelica: 20, protestante: 18, outra_crista: 8, sem_religiao: 10, indigena: 2, islamismo: 0.5 },
  KE: { protestante: 33, evangelica: 20, catolica: 21, islamismo: 11, outra_crista: 7, sem_religiao: 2, indigena: 1 },
  MA: { islamismo: 98, judaismo: 0.2, sem_religiao: 1, catolica: 0.3 },
  JP: { xintoismo: 34, budismo: 34, sem_religiao: 22, ateismo: 2, espiritualidade: 3, protestante: 1, catolica: 0.5, outra: 3 },
  CN: { sem_religiao: 50, ateismo: 14, budismo: 16, tradicao_chinesa: 10, islamismo: 2, protestante: 3, catolica: 0.5, espiritualidade: 4 },
  IN: { hinduismo: 79, islamismo: 14, protestante: 1.3, catolica: 1, sikhismo: 1.7, budismo: 0.7, outra: 0.8, sem_religiao: 0.5 },
  KR: { sem_religiao: 48, protestante: 20, budismo: 16, catolica: 11, ateismo: 2, espiritualidade: 3 },
  AU: { catolica: 20, protestante: 15, evangelica: 5, ortodoxa: 2, sem_religiao: 39, ateismo: 3, islamismo: 3, budismo: 2.4, hinduismo: 2.7, sikhismo: 0.8, judaismo: 0.4, indigena: 0.5, espiritualidade: 4 },
  NZ: { sem_religiao: 48, catolica: 10, protestante: 14, evangelica: 4, outra_crista: 1, hinduismo: 2.9, islamismo: 1.3, budismo: 1, sikhismo: 1, indigena: 0.5, espiritualidade: 4, ateismo: 3 },
  outro: { catolica: 25, evangelica: 10, protestante: 10, islamismo: 20, sem_religiao: 15, hinduismo: 5, budismo: 5, ateismo: 3, espiritualidade: 3, outra: 4 }
};

/* ================================================================ Dependências */

export type TipoDep14 = 'alcool' | 'tabaco' | 'drogas' | 'apostas' | 'compras' | 'telas';
export type Estagio14 = 'uso' | 'risco' | 'dependencia' | 'grave' | 'recuperacao';
export type Substancia14 = 'cannabis' | 'estimulantes' | 'opioides' | 'sedativos';

export interface InfoDep14 {
  nome: string;
  /** "dependência de álcool" — a condição, nunca um rótulo para a pessoa. */
  condicao: string;
  /** A linha do orçamento do mês. */
  linha: string;
  /** Custo mensal por estágio [uso, risco, dependência, grave] na cidade de custo 1,0 (compras: fração da renda). */
  custo: [number, number, number, number];
  /** O grupo de ajuda mútua (gratuito). */
  grupo: string;
  /** Quanto o estágio sobe num ano comum (antes do estresse, do apoio e do acaso). */
  ritmo: number;
  /** A chance de recaída no primeiro ano sem uso (cai com o tempo). */
  recaida: number;
}

export const DEPENDENCIAS14: Record<TipoDep14, InfoDep14> = {
  alcool: { nome: 'Álcool', condicao: 'dependência de álcool', linha: 'Bebida', custo: [0, 150, 350, 600], grupo: 'um grupo de ajuda mútua (como os Alcoólicos Anônimos)', ritmo: 3, recaida: 0.35 },
  tabaco: { nome: 'Tabaco e nicotina', condicao: 'dependência de nicotina', linha: 'Cigarro', custo: [120, 220, 300, 420], grupo: 'um grupo para quem quer parar de fumar', ritmo: 3, recaida: 0.35 },
  drogas: { nome: 'Outras drogas', condicao: 'dependência química', linha: 'Drogas', custo: [100, 400, 1100, 2200], grupo: 'um grupo de ajuda mútua (como os Narcóticos Anônimos)', ritmo: 4, recaida: 0.4 },
  apostas: { nome: 'Jogos de azar', condicao: 'jogo compulsivo', linha: 'Apostas', custo: [0, 0, 0, 0], grupo: 'um grupo de ajuda mútua (como os Jogadores Anônimos)', ritmo: 3, recaida: 0.3 },
  compras: { nome: 'Compras compulsivas', condicao: 'compra compulsiva', linha: 'Compras por impulso', custo: [0, 0.06, 0.15, 0.28], grupo: 'um grupo de ajuda mútua para quem compra compulsivamente', ritmo: 3, recaida: 0.25 },
  telas: { nome: 'Telas e redes', condicao: 'uso compulsivo de telas e redes', linha: '', custo: [0, 0, 0, 0], grupo: 'um grupo de apoio sobre uso de telas', ritmo: 2, recaida: 0.2 }
};

export const NOME_SUBSTANCIA14: Record<Substancia14, string> = {
  cannabis: 'maconha', estimulantes: 'cocaína e estimulantes', opioides: 'analgésicos opioides', sedativos: 'calmantes (sedativos)'
};

export const NOME_ESTAGIO14: Record<Estagio14, string> = {
  uso: 'uso ocasional', risco: 'uso de risco', dependencia: 'dependência', grave: 'dependência grave', recuperacao: 'em recuperação'
};

/* ================================================================ O que o save guarda (campos opcionais da Vida) */

export type Pratica14 = 'nenhuma' | 'ocasional' | 'regular';
export interface MudancaDeCrenca14 { t: number; de: Crenca14; para: Crenca14; motivo: 'escolha' | 'conversao' | 'duvida' | 'retomada' }
export interface EstadoCrenca14 {
  /** De quem é (nome|nascimento): na sucessão, a crença é refeita para quem passa a ser jogado. */
  de: string;
  atual: Crenca14;
  /** A crença em que a família criou (o ponto de partida). */
  familia: Crenca14;
  /** A prática ("regular" = a comunidade na semana: a atividade `igreja` da rotina). */
  pratica: Pratica14;
  desde: number;
  historia: MudancaDeCrenca14[];
  /** As tradições que conheceu de perto (um convite aceito). */
  conheceu?: Crenca14[];
  /** O combinado com o par sobre a criação dos filhos. */
  filhos?: 'minha' | 'par' | 'ambas' | 'escolha';
  /** A última celebração contada e a última jornada feita (t). */
  cena?: number;
  jornada?: number;
}

export type ModoTratamento14 = 'grupo' | 'ambulatorial' | 'internacao';
export interface Dependencia14 {
  /** 0..100: a intensidade (o estágio sai dela). */
  nivel: number;
  desde: number;
  /** O pico (o que a dependência chegou a ser). */
  pico: number;
  substancia?: Substancia14;
  /** Sem uso desde (recuperação). Ausente: em uso. */
  limpoDesde?: number;
  recaidas: number;
  tentativas: number;
  tratamento?: { modo: ModoTratamento14; inicio: number; fim: number };
  /** Quem foi procurado para ajudar, e quando (apoio vale por dois anos). */
  apoio?: { pessoaId?: string; t: number };
  /** A prevenção (limites, bloqueios) vale até `protecao`. */
  protecao?: number;
  /** Já foi contado na Linha da Vida ao virar dependência. */
  contado?: boolean;
}
export interface EstadoDependencias14 {
  lista: Partial<Record<TipoDep14, Dependencia14>>;
  /** O que mudou, para a ficha (início, ajuda, tratamento, recuperação, recaída). */
  marcos: { t: number; tipo: TipoDep14; o: 'inicio' | 'dependencia' | 'ajuda' | 'tratamento' | 'recuperacao' | 'recaida' | 'superada' }[];
}
