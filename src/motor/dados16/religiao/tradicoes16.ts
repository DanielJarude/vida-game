/**
 * VIDA 16 · CARREIRAS RELIGIOSAS — o catálogo puro (só dados). Cada tradição tem o SEU caminho: não há uma hierarquia
 * universal. A estrutura segue o que as próprias tradições descrevem (simplificada para o jogo; respeitando a formação,
 * a elegibilidade e a forma de sucessão de cada uma):
 *
 *   IGREJA CATÓLICA (rito latino)  seminário (propedêutico, filosofia, teologia: ~7 anos) → diácono (transitório) → padre
 *        (vigário, depois pároco) → bispo (nomeado pelo papa; cânon 378: 35+ anos, 5+ de padre) → arcebispo → cardeal
 *        (criado pelo papa) → papa (eleito em conclave pelos cardeais com menos de 80 anos). Ordenação reservada a homens,
 *        com celibato. Para homens casados: o diaconato permanente (35+). Para mulheres: a vida consagrada (postulante,
 *        noviça, votos temporários e perpétuos, superiora, superiora-geral).
 *   EVANGÉLICA   o chamado reconhecido pela igreja local: obreiro/diácono, líder de ministério, presbítero, pastor auxiliar,
 *        pastor titular, pastor presidente — ou fundar a própria igreja. Muitas denominações ordenam mulheres (varia).
 *   PROTESTANTE HISTÓRICA  presbítero/diácono eleito, seminário teológico, licenciatura pelo presbitério, ordenação
 *        (reverendo), presidência do presbitério/sínodo por eleição.
 *   CANDOMBLÉ    abiã → iniciação (iaô) com as obrigações de 1, 3 e 7 anos → ebômi → com o direito de abrir casa (decá),
 *        ialorixá/babalorixá — abrindo o próprio terreiro ou na sucessão de uma casa (a escolha passa pelo jogo de búzios
 *        e pela comunidade, não por nomeação). Quem não entra em transe segue outro caminho de honra: ogã (homens) e
 *        equede (mulheres), confirmados pela casa, com cargos próprios. Não são degraus "abaixo" de nada.
 *   UMBANDA      assistência → cambone → médium em desenvolvimento → médium de trabalho nas giras → pai/mãe pequena
 *        (o braço direito do terreiro) → dirigente (pai/mãe de santo), abrindo casa ou assumindo uma.
 *   ESPIRITISMO  sem clero e sem pagamento: trabalhador voluntário (passe, evangelização), expositor, dirigente de estudos,
 *        presidente do centro (eleito), dirigente federativo.
 *   JUDAÍSMO     estudo (yeshivá/seminário rabínico) → semichá → rabino assistente → rabino da congregação → grão-rabino
 *        (eleito por uma comunidade). Correntes reformista e conservadora ordenam mulheres; a ortodoxa, não.
 *   ISLÃ         sem clero ordenado: o estudo das ciências islâmicas; imã (quem conduz a oração da comunidade; em
 *        congregações mistas, um homem); xeique/estudioso reconhecido. O ensino religioso (ustadha, alima) é aberto a
 *        mulheres e homens.
 *   BUDISMO      praticante leigo → noviço(a) → monge/monja (ordenação plena) → professor(a) do darma → abade/abadessa.
 */
import type { Crenca14 } from '../../dados14/crencas/crencas';

export type Tradicao16 =
  | 'catolica' | 'catolica_diaconato' | 'catolica_consagrada'
  | 'evangelica' | 'protestante'
  | 'candomble' | 'candomble_cargo' | 'umbanda'
  | 'espirita' | 'judaismo' | 'islamismo' | 'islamismo_ensino' | 'budismo';

/** Como se chega à etapa: o tempo e a formação; uma nomeação; uma eleição; a iniciação (a obrigação); abrir ou herdar a casa. */
export type ComoSeChega16 = 'tempo' | 'nomeacao' | 'eleicao' | 'obrigacao' | 'casa' | 'conclave';

export interface Etapa16 {
  id: string;
  nome: [string, string];
  /** Anos mínimos na etapa anterior. */
  anos: number;
  como: ComoSeChega16;
  idadeMin?: number;
  /** A formação acumulada exigida (0..100). */
  formacao?: number;
  /** O reconhecimento exigido (0..100). */
  prestigio?: number;
  /** Côngrua, prebenda, salário da igreja — por ano, na cidade de custo 1,0 (0: não há; vive-se de outro trabalho). */
  sustento: number;
  /** O tamanho da comunidade sob a sua responsabilidade (de quantas pessoas, ao chegar). */
  comunidade: number;
  /** A etapa guia (lidera uma comunidade/instituição). */
  lidera?: boolean;
  /** O que a etapa É, em uma frase. */
  texto: string;
}

export interface Tradicao16Info {
  nome: string;
  crencas: Crenca14[];
  genero?: 'masculino' | 'feminino';
  /** Exige não ter parceria (celibato, vida monástica). */
  celibato?: boolean;
  /** Exige casamento/união (o diaconato permanente é para casados). */
  casado?: boolean;
  idadeMin: number;
  /** O lugar da comunidade (com artigo). */
  lugar: string;
  /** Quem a comunidade é (plural). */
  fieis: string;
  etapas: Etapa16[];
  /** Os gestos do ano, nas palavras da tradição. */
  verbos: { formar: string; servir: string; acolher: string };
  /** Os projetos comunitários possíveis. */
  projetos: { id: string; nome: string; custo: number; texto: string }[];
  /** A nota de respeito/elegibilidade mostrada na tela. */
  nota?: string;
}

const P_CATOLICOS = [
  { id: 'sopao', nome: 'O sopão da paróquia', custo: 6000, texto: 'Refeições três noites por semana para quem dorme na rua.' },
  { id: 'reforma', nome: 'A reforma da igreja', custo: 40000, texto: 'O telhado da matriz, que chove dentro desde a última enchente.' },
  { id: 'festa', nome: 'A festa do padroeiro', custo: 12000, texto: 'Quermesse, procissão, a cidade inteira na praça.' },
  { id: 'creche', nome: 'A creche comunitária', custo: 30000, texto: 'Cuidar das crianças das mães que trabalham.' }
];
const P_EVANGELICOS = [
  { id: 'cesta', nome: 'As cestas básicas', custo: 8000, texto: 'A campanha do mês para as famílias do bairro.' },
  { id: 'templo', nome: 'O templo novo', custo: 80000, texto: 'O galpão alugado ficou pequeno: um templo próprio.' },
  { id: 'recuperacao', nome: 'A casa de recuperação', custo: 35000, texto: 'Acolher quem quer sair da dependência.' },
  { id: 'louvor', nome: 'O congresso de louvor', custo: 10000, texto: 'Três dias de música e pregação, com igrejas da região.' }
];
const P_AFRO = [
  { id: 'festa_orixa', nome: 'A festa do orixá da casa', custo: 9000, texto: 'O xirê, as comidas, a comunidade reunida — e as portas abertas para quem chega.' },
  { id: 'barracao', nome: 'A reforma do barracão', custo: 25000, texto: 'O chão de terra batida, o telhado, o quarto de santo.' },
  { id: 'tombamento', nome: 'O registro da casa como patrimônio', custo: 6000, texto: 'Documentar a história do terreiro para pedir o reconhecimento como patrimônio cultural.' },
  { id: 'alimentos', nome: 'A cozinha solidária', custo: 7000, texto: 'Comida para as famílias do entorno, todo sábado.' }
];
const P_ESPIRITAS = [
  { id: 'evangelizacao', nome: 'A evangelização infantil', custo: 3000, texto: 'As aulas de domingo para as crianças da comunidade.' },
  { id: 'enxoval', nome: 'O enxoval de bebê', custo: 5000, texto: 'Costurar e doar enxovais para gestantes sem recursos.' },
  { id: 'sede', nome: 'A sede própria', custo: 50000, texto: 'Sair da sala emprestada para um centro próprio.' }
];
const P_GERAIS = [
  { id: 'escola', nome: 'A escola da comunidade', custo: 20000, texto: 'Aulas para as crianças e para quem quer aprender a tradição.' },
  { id: 'acolhida', nome: 'A acolhida de refugiados', custo: 15000, texto: 'Moradia e documentos para quem chegou sem nada.' },
  { id: 'reforma_g', nome: 'A reforma do espaço', custo: 35000, texto: 'O espaço da comunidade precisa de obras.' }
];

export const TRADICOES16: Record<Tradicao16, Tradicao16Info> = {
  catolica: {
    nome: 'Sacerdócio católico', crencas: ['catolica'], genero: 'masculino', celibato: true, idadeMin: 17, lugar: 'a paróquia', fieis: 'paroquianos',
    nota: 'No rito latino, a ordenação é reservada a homens e pede o celibato. Bispos e cardeais são escolhidos pelo papa; o papa, pelo conclave.',
    verbos: { formar: 'Estudar filosofia e teologia', servir: 'Celebrar e pregar', acolher: 'Atender confissões e visitar doentes' },
    projetos: P_CATOLICOS,
    etapas: [
      { id: 'vocacional', nome: ['Vocacionado', 'Vocacionada'], anos: 0, como: 'tempo', sustento: 0, comunidade: 0, texto: 'O discernimento: o acompanhamento vocacional antes de entrar no seminário.' },
      { id: 'seminarista', nome: ['Seminarista', 'Seminarista'], anos: 1, como: 'tempo', idadeMin: 18, sustento: 0, comunidade: 0, texto: 'O seminário: propedêutico, filosofia e teologia, a vida em comunidade e a pastoral nos fins de semana.' },
      { id: 'diacono', nome: ['Diácono', 'Diácono'], anos: 6, como: 'tempo', formacao: 70, idadeMin: 23, sustento: 12000, comunidade: 0, texto: 'O diaconato transitório: batizar, pregar, assistir casamentos — o último passo antes do sacerdócio.' },
      { id: 'padre', nome: ['Padre', 'Padre'], anos: 1, como: 'tempo', formacao: 85, idadeMin: 25, sustento: 36000, comunidade: 1500, lidera: true, texto: 'O presbítero: primeiro vigário, depois pároco — a paróquia inteira.' },
      { id: 'bispo', nome: ['Bispo', 'Bispo'], anos: 5, como: 'nomeacao', idadeMin: 35, prestigio: 65, sustento: 60000, comunidade: 300000, lidera: true, texto: 'Nomeado pelo papa para uma diocese: os padres, as paróquias, as decisões da Igreja local.' },
      { id: 'arcebispo', nome: ['Arcebispo', 'Arcebispo'], anos: 4, como: 'nomeacao', prestigio: 75, sustento: 72000, comunidade: 1500000, lidera: true, texto: 'À frente de uma arquidiocese e de uma província eclesiástica.' },
      { id: 'cardeal', nome: ['Cardeal', 'Cardeal'], anos: 3, como: 'nomeacao', prestigio: 85, sustento: 90000, comunidade: 3000000, lidera: true, texto: 'Criado pelo papa: conselheiro, e eleitor no conclave até os 80 anos.' },
      { id: 'papa', nome: ['Papa', 'Papa'], anos: 0, como: 'conclave', sustento: 0, comunidade: 1300000000, lidera: true, texto: 'Bispo de Roma, eleito pelo conclave: a Igreja inteira.' }
    ]
  },
  catolica_diaconato: {
    nome: 'Diaconato permanente', crencas: ['catolica'], genero: 'masculino', casado: true, idadeMin: 35, lugar: 'a paróquia', fieis: 'paroquianos',
    nota: 'O diaconato permanente é aberto a homens casados a partir dos 35 anos, com o consentimento da esposa.',
    verbos: { formar: 'Estudar na escola diaconal', servir: 'Batizar, pregar, celebrar casamentos', acolher: 'Visitar famílias e doentes' },
    projetos: P_CATOLICOS,
    etapas: [
      { id: 'candidato', nome: ['Candidato ao diaconato', 'Candidata'], anos: 0, como: 'tempo', sustento: 0, comunidade: 0, texto: 'A escola diaconal: quatro anos de formação, sem largar o trabalho nem a família.' },
      { id: 'diacono_p', nome: ['Diácono permanente', 'Diácono permanente'], anos: 4, como: 'tempo', formacao: 65, sustento: 0, comunidade: 400, lidera: true, texto: 'Ordenado para servir: a família continua, o trabalho também.' }
    ]
  },
  catolica_consagrada: {
    nome: 'Vida consagrada', crencas: ['catolica'], genero: 'feminino', celibato: true, idadeMin: 17, lugar: 'o convento', fieis: 'irmãs e pessoas atendidas',
    nota: 'A vida religiosa feminina: votos de pobreza, castidade e obediência numa congregação — escolas, hospitais, missões, clausura.',
    verbos: { formar: 'Estudar e rezar com a formadora', servir: 'Trabalhar na obra da congregação', acolher: 'Acompanhar quem procura a casa' },
    projetos: P_CATOLICOS,
    etapas: [
      { id: 'aspirante', nome: ['Aspirante', 'Aspirante'], anos: 0, como: 'tempo', sustento: 0, comunidade: 0, texto: 'Conhecer a congregação por dentro, antes de entrar.' },
      { id: 'postulante', nome: ['Postulante', 'Postulante'], anos: 1, como: 'tempo', idadeMin: 18, sustento: 0, comunidade: 0, texto: 'Morar na comunidade e descobrir se é ali.' },
      { id: 'novica', nome: ['Noviço', 'Noviça'], anos: 1, como: 'tempo', formacao: 25, sustento: 0, comunidade: 0, texto: 'O noviciado: o hábito, a oração, a regra da congregação.' },
      { id: 'votos_t', nome: ['Irmão de votos temporários', 'Irmã de votos temporários'], anos: 2, como: 'tempo', formacao: 45, sustento: 0, comunidade: 60, texto: 'Os primeiros votos, renovados ano a ano, já trabalhando na obra.' },
      { id: 'votos_p', nome: ['Irmão de votos perpétuos', 'Irmã de votos perpétuos'], anos: 5, como: 'tempo', formacao: 65, sustento: 0, comunidade: 150, texto: 'Os votos para a vida inteira.' },
      { id: 'superiora', nome: ['Superior da comunidade', 'Superiora da comunidade'], anos: 5, como: 'eleicao', prestigio: 60, sustento: 0, comunidade: 400, lidera: true, texto: 'Escolhida pelas irmãs para conduzir a casa e a obra.' },
      { id: 'superiora_geral', nome: ['Superior-geral', 'Superiora-geral'], anos: 6, como: 'eleicao', prestigio: 80, sustento: 0, comunidade: 5000, lidera: true, texto: 'Eleita no capítulo geral: a congregação inteira, em vários países.' }
    ]
  },
  evangelica: {
    nome: 'Ministério evangélico', crencas: ['evangelica', 'outra_crista'], idadeMin: 16, lugar: 'a igreja', fieis: 'membros',
    nota: 'O chamado é reconhecido pela igreja local. A ordenação de mulheres varia entre as denominações; muitas ordenam pastoras.',
    verbos: { formar: 'Estudar teologia e a Bíblia', servir: 'Pregar e conduzir o culto', acolher: 'Aconselhar e visitar as famílias' },
    projetos: P_EVANGELICOS,
    etapas: [
      { id: 'membro', nome: ['Membro atuante', 'Membro atuante'], anos: 0, como: 'tempo', sustento: 0, comunidade: 0, texto: 'Os cultos, a escola bíblica, servir onde precisarem.' },
      { id: 'obreiro', nome: ['Obreiro', 'Obreira'], anos: 1, como: 'tempo', idadeMin: 17, prestigio: 20, sustento: 0, comunidade: 0, texto: 'A porta, a oferta, a oração com quem chega: o primeiro serviço reconhecido.' },
      { id: 'lider', nome: ['Líder de ministério', 'Líder de ministério'], anos: 2, como: 'nomeacao', prestigio: 35, sustento: 0, comunidade: 40, lidera: true, texto: 'O ministério de jovens, de louvor ou de casais: um grupo para conduzir.' },
      { id: 'presbitero', nome: ['Presbítero', 'Presbítera'], anos: 2, como: 'nomeacao', formacao: 30, prestigio: 45, sustento: 0, comunidade: 80, texto: 'Consagrado para cuidar e governar junto com o pastor.' },
      { id: 'pastor_aux', nome: ['Pastor auxiliar', 'Pastora auxiliar'], anos: 2, como: 'nomeacao', formacao: 50, prestigio: 55, idadeMin: 23, sustento: 30000, comunidade: 300, lidera: true, texto: 'Ordenado ao ministério, ao lado do pastor titular.' },
      { id: 'pastor', nome: ['Pastor titular', 'Pastora titular'], anos: 3, como: 'nomeacao', formacao: 60, prestigio: 65, sustento: 55000, comunidade: 700, lidera: true, texto: 'A igreja local é sua: o púlpito, o caixa, as pessoas.' },
      { id: 'presidente', nome: ['Pastor presidente', 'Pastora presidente'], anos: 6, como: 'eleicao', prestigio: 82, sustento: 110000, comunidade: 15000, lidera: true, texto: 'À frente do ministério inteiro: dezenas de congregações, a convenção, a voz pública.' }
    ]
  },
  protestante: {
    nome: 'Ministério protestante', crencas: ['protestante'], idadeMin: 18, lugar: 'a igreja', fieis: 'membros',
    nota: 'Nas igrejas históricas (presbiteriana, metodista, luterana, batista), o pastor estuda no seminário e é ordenado pelo concílio. Várias ordenam mulheres.',
    verbos: { formar: 'Estudar no seminário teológico', servir: 'Pregar e ministrar os sacramentos', acolher: 'Fazer o cuidado pastoral' },
    projetos: P_EVANGELICOS,
    etapas: [
      { id: 'membro', nome: ['Membro comungante', 'Membro comungante'], anos: 0, como: 'tempo', sustento: 0, comunidade: 0, texto: 'A vida da igreja, o estudo bíblico, a escola dominical.' },
      { id: 'diacono_pr', nome: ['Diácono', 'Diaconisa'], anos: 1, como: 'eleicao', prestigio: 25, sustento: 0, comunidade: 0, texto: 'Eleito pela assembleia para o serviço e a assistência.' },
      { id: 'seminarista', nome: ['Seminarista', 'Seminarista'], anos: 1, como: 'tempo', idadeMin: 19, sustento: 0, comunidade: 0, texto: 'O seminário teológico: quatro a cinco anos de grego, hebraico, história, pastoral.' },
      { id: 'licenciado', nome: ['Licenciado', 'Licenciada'], anos: 4, como: 'tempo', formacao: 70, sustento: 18000, comunidade: 120, texto: 'Licenciado pelo presbitério para pregar, em período de experiência.' },
      { id: 'reverendo', nome: ['Reverendo', 'Reverenda'], anos: 1, como: 'tempo', formacao: 80, sustento: 50000, comunidade: 400, lidera: true, texto: 'Ordenado pastor efetivo de uma igreja.' },
      { id: 'moderador', nome: ['Presidente do presbitério', 'Presidente do presbitério'], anos: 6, como: 'eleicao', prestigio: 75, sustento: 60000, comunidade: 6000, lidera: true, texto: 'Eleito pelo concílio para presidir as igrejas da região.' }
    ]
  },
  candomble: {
    nome: 'Sacerdócio no candomblé', crencas: ['candomble'], idadeMin: 14, lugar: 'o terreiro', fieis: 'filhos e filhas de santo',
    nota: 'No candomblé, o tempo de santo é contado pelas obrigações (1, 3 e 7 anos). A liderança de uma casa não é nomeação: abre-se casa com o direito recebido, ou a sucessão é decidida pelo jogo e pela comunidade.',
    verbos: { formar: 'Aprender os fundamentos com a mãe/o pai de santo', servir: 'Servir nas festas e nas obrigações', acolher: 'Cuidar de quem chega ao terreiro' },
    projetos: P_AFRO,
    etapas: [
      { id: 'abia', nome: ['Abiã', 'Abiã'], anos: 0, como: 'tempo', sustento: 0, comunidade: 0, texto: 'Ainda não iniciado: frequenta a casa, aprende o respeito e os primeiros fundamentos.' },
      { id: 'iao', nome: ['Iaô', 'Iaô'], anos: 1, como: 'obrigacao', prestigio: 15, sustento: 0, comunidade: 0, texto: 'Feito no santo: a iniciação, o recolhimento, o orixá assentado. As obrigações de 1 e 3 anos.' },
      { id: 'ebomi', nome: ['Ebômi', 'Ebômi'], anos: 7, como: 'obrigacao', formacao: 60, sustento: 0, comunidade: 0, texto: 'Depois da obrigação de 7 anos: um mais velho da casa, com voz e responsabilidade.' },
      { id: 'zelador', nome: ['Babalorixá', 'Ialorixá'], anos: 0, como: 'casa', formacao: 75, prestigio: 55, sustento: 0, comunidade: 25, lidera: true, texto: 'Pai ou mãe de santo: a casa, os filhos de santo, o jogo de búzios, as obrigações dos outros.' }
    ]
  },
  candomble_cargo: {
    nome: 'Ogã e equede no candomblé', crencas: ['candomble'], idadeMin: 14, lugar: 'o terreiro', fieis: 'a comunidade da casa',
    nota: 'Ogãs (homens) e equedes (mulheres) não entram em transe: são escolhidos pelo orixá e confirmados pela casa. Cuidam dos atabaques, dos rituais, dos iniciados — são tratados como mais velhos desde a confirmação.',
    verbos: { formar: 'Aprender os toques, as cantigas e os fundamentos', servir: 'Tocar e cuidar das festas', acolher: 'Amparar os iniciados e quem está em transe' },
    projetos: P_AFRO,
    etapas: [
      { id: 'suspenso', nome: ['Ogã suspenso', 'Equede suspensa'], anos: 0, como: 'tempo', sustento: 0, comunidade: 0, texto: 'Apontado pelo orixá numa festa: o período de preparação antes da confirmação.' },
      { id: 'confirmado', nome: ['Ogã confirmado', 'Equede confirmada'], anos: 1, como: 'obrigacao', formacao: 35, sustento: 0, comunidade: 0, texto: 'Confirmado pela casa: um mais velho, com lugar de honra.' },
      { id: 'cargo', nome: ['Ogã de cargo (axogum, alabê)', 'Equede de cargo'], anos: 5, como: 'nomeacao', formacao: 60, prestigio: 55, sustento: 0, comunidade: 30, lidera: true, texto: 'Um cargo de confiança da casa: os sacrifícios, os toques, o cuidado do quarto de santo.' }
    ]
  },
  umbanda: {
    nome: 'Sacerdócio na umbanda', crencas: ['umbanda'], idadeMin: 14, lugar: 'o terreiro', fieis: 'médiuns e consulentes',
    nota: 'Cada terreiro de umbanda tem os seus fundamentos. O caminho passa pelo desenvolvimento mediúnico; a direção da casa é de quem a abre ou a recebe do dirigente anterior.',
    verbos: { formar: 'Desenvolver a mediunidade nas giras', servir: 'Trabalhar nas giras de atendimento', acolher: 'Atender os consulentes' },
    projetos: P_AFRO,
    etapas: [
      { id: 'assistencia', nome: ['Na assistência', 'Na assistência'], anos: 0, como: 'tempo', sustento: 0, comunidade: 0, texto: 'Frequentar as giras como consulente.' },
      { id: 'cambone', nome: ['Cambone', 'Cambone'], anos: 1, como: 'tempo', sustento: 0, comunidade: 0, texto: 'Auxiliar os médiuns incorporados: anotar, buscar, amparar.' },
      { id: 'desenvolvimento', nome: ['Médium em desenvolvimento', 'Médium em desenvolvimento'], anos: 1, como: 'tempo', formacao: 20, sustento: 0, comunidade: 0, texto: 'As giras de desenvolvimento: aprender a dar passagem às entidades.' },
      { id: 'medium', nome: ['Médium de trabalho', 'Médium de trabalho'], anos: 3, como: 'obrigacao', formacao: 45, sustento: 0, comunidade: 0, texto: 'Atende nas giras: caboclos, pretos-velhos, as linhas da casa.' },
      { id: 'pai_pequeno', nome: ['Pai pequeno', 'Mãe pequena'], anos: 4, como: 'nomeacao', formacao: 60, prestigio: 50, sustento: 0, comunidade: 20, texto: 'O braço direito do dirigente: conduz a gira quando ele não pode.' },
      { id: 'dirigente', nome: ['Pai de santo, dirigente', 'Mãe de santo, dirigente'], anos: 3, como: 'casa', formacao: 70, prestigio: 60, sustento: 0, comunidade: 60, lidera: true, texto: 'O terreiro é seu: os médiuns, as giras, os fundamentos da casa.' }
    ]
  },
  espirita: {
    nome: 'Trabalho espírita', crencas: ['espirita'], idadeMin: 16, lugar: 'o centro espírita', fieis: 'frequentadores',
    nota: 'O espiritismo não tem clero nem pagamento: todo trabalho no centro é voluntário.',
    verbos: { formar: 'Estudar as obras básicas', servir: 'Dar passes e fazer palestras', acolher: 'Fazer o atendimento fraterno' },
    projetos: P_ESPIRITAS,
    etapas: [
      { id: 'frequentador', nome: ['Frequentador', 'Frequentadora'], anos: 0, como: 'tempo', sustento: 0, comunidade: 0, texto: 'As palestras públicas, o passe, o estudo sistematizado.' },
      { id: 'trabalhador', nome: ['Trabalhador', 'Trabalhadora'], anos: 2, como: 'tempo', formacao: 25, sustento: 0, comunidade: 0, texto: 'Voluntário no passe, na evangelização infantil, na assistência social.' },
      { id: 'expositor', nome: ['Expositor', 'Expositora'], anos: 3, como: 'tempo', formacao: 50, prestigio: 35, sustento: 0, comunidade: 80, texto: 'As palestras públicas, para quem chega pela primeira vez.' },
      { id: 'dirigente_e', nome: ['Dirigente de estudos', 'Dirigente de estudos'], anos: 2, como: 'nomeacao', formacao: 60, sustento: 0, comunidade: 120, lidera: true, texto: 'Coordena os grupos de estudo e de mediunidade.' },
      { id: 'presidente_e', nome: ['Presidente do centro', 'Presidenta do centro'], anos: 3, como: 'eleicao', prestigio: 60, sustento: 0, comunidade: 400, lidera: true, texto: 'Eleito pela assembleia: a casa inteira, as contas, as obras sociais.' },
      { id: 'federativo', nome: ['Dirigente federativo', 'Dirigente federativa'], anos: 6, como: 'eleicao', prestigio: 80, sustento: 0, comunidade: 20000, lidera: true, texto: 'Na federação: os centros de uma região inteira.' }
    ]
  },
  judaismo: {
    nome: 'Rabinato', crencas: ['judaismo'], idadeMin: 18, lugar: 'a sinagoga', fieis: 'membros da congregação',
    nota: 'A semichá (ordenação rabínica) vem depois de anos de estudo. Correntes reformista e conservadora ordenam mulheres; a ortodoxa, não.',
    verbos: { formar: 'Estudar Torá e Talmud', servir: 'Conduzir o serviço e ensinar', acolher: 'Acompanhar a congregação nos ciclos da vida' },
    projetos: P_GERAIS,
    etapas: [
      { id: 'estudante_r', nome: ['Estudante rabínico', 'Estudante rabínica'], anos: 0, como: 'tempo', sustento: 0, comunidade: 0, texto: 'A yeshivá ou o seminário rabínico: texto, comentário, debate.' },
      { id: 'rabino_aux', nome: ['Rabino assistente', 'Rabina assistente'], anos: 5, como: 'tempo', formacao: 75, sustento: 45000, comunidade: 150, texto: 'Com a semichá: o bar-mitzvá dos meninos, as aulas, o segundo púlpito.' },
      { id: 'rabino', nome: ['Rabino da congregação', 'Rabina da congregação'], anos: 3, como: 'nomeacao', prestigio: 55, sustento: 85000, comunidade: 500, lidera: true, texto: 'Escolhido pela congregação: o púlpito, as decisões da lei, a comunidade.' },
      { id: 'grao_rabino', nome: ['Grão-rabino', 'Grã-rabina'], anos: 8, como: 'eleicao', prestigio: 82, sustento: 110000, comunidade: 40000, lidera: true, texto: 'A autoridade rabínica de uma comunidade nacional ou de uma cidade grande.' }
    ]
  },
  islamismo: {
    nome: 'Liderança da mesquita', crencas: ['islamismo'], genero: 'masculino', idadeMin: 16, lugar: 'a mesquita', fieis: 'fiéis da mesquita',
    nota: 'O islã não tem clero ordenado. O imã conduz a oração; em congregações mistas, é um homem. O estudo e o ensino são abertos a todos.',
    verbos: { formar: 'Estudar o Alcorão, a língua árabe e a jurisprudência', servir: 'Conduzir a oração e o sermão de sexta', acolher: 'Orientar as famílias' },
    projetos: P_GERAIS,
    etapas: [
      { id: 'estudante_i', nome: ['Estudante de ciências islâmicas', 'Estudante de ciências islâmicas'], anos: 0, como: 'tempo', sustento: 0, comunidade: 0, texto: 'Memorizar o Alcorão, o árabe, o fiqh.' },
      { id: 'imam_aux', nome: ['Imã auxiliar', 'Imã auxiliar'], anos: 4, como: 'nomeacao', formacao: 55, sustento: 24000, comunidade: 100, texto: 'Conduz a oração quando o imã não está.' },
      { id: 'imam', nome: ['Imã da mesquita', 'Imã da mesquita'], anos: 3, como: 'nomeacao', formacao: 70, prestigio: 55, sustento: 45000, comunidade: 600, lidera: true, texto: 'A oração, o sermão de sexta, os casamentos, a orientação da comunidade.' },
      { id: 'xeique', nome: ['Xeique, estudioso reconhecido', 'Estudiosa reconhecida'], anos: 8, como: 'tempo', formacao: 90, prestigio: 80, sustento: 70000, comunidade: 20000, lidera: true, texto: 'Consultado por outras mesquitas: os pareceres, as aulas, a voz pública.' }
    ]
  },
  islamismo_ensino: {
    nome: 'Ensino islâmico', crencas: ['islamismo'], idadeMin: 16, lugar: 'a mesquita', fieis: 'alunos e famílias',
    nota: 'O ensino religioso islâmico — de crianças a adultos — é aberto a mulheres e homens.',
    verbos: { formar: 'Estudar o Alcorão e a jurisprudência', servir: 'Dar aulas na mesquita', acolher: 'Orientar as famílias e as jovens' },
    projetos: P_GERAIS,
    etapas: [
      { id: 'estudante_ie', nome: ['Estudante', 'Estudante'], anos: 0, como: 'tempo', sustento: 0, comunidade: 0, texto: 'O estudo do Alcorão e da língua.' },
      { id: 'professora', nome: ['Professor (ustadh)', 'Professora (ustadha)'], anos: 3, como: 'tempo', formacao: 50, sustento: 18000, comunidade: 60, lidera: true, texto: 'As aulas de Alcorão e de árabe na mesquita.' },
      { id: 'alima', nome: ['Estudioso (alim)', 'Estudiosa (alima)'], anos: 7, como: 'tempo', formacao: 85, prestigio: 70, sustento: 40000, comunidade: 3000, lidera: true, texto: 'Reconhecida pelo conhecimento: aulas, pareceres para a comunidade.' }
    ]
  },
  budismo: {
    nome: 'Vida monástica budista', crencas: ['budismo'], celibato: true, idadeMin: 16, lugar: 'o templo', fieis: 'praticantes',
    nota: 'Monges e monjas fazem votos (entre eles, o celibato). Professores leigos do darma também existem, mas este caminho é o monástico.',
    verbos: { formar: 'Estudar os sutras e meditar', servir: 'Conduzir as práticas do templo', acolher: 'Orientar os praticantes' },
    projetos: P_GERAIS,
    etapas: [
      { id: 'leigo', nome: ['Praticante leigo', 'Praticante leiga'], anos: 0, como: 'tempo', sustento: 0, comunidade: 0, texto: 'A prática no templo, os retiros.' },
      { id: 'novico_b', nome: ['Noviço', 'Noviça'], anos: 1, como: 'obrigacao', idadeMin: 18, sustento: 0, comunidade: 0, texto: 'A cabeça raspada, o manto, os primeiros preceitos.' },
      { id: 'monge', nome: ['Monge', 'Monja'], anos: 2, como: 'obrigacao', formacao: 50, idadeMin: 20, sustento: 0, comunidade: 0, texto: 'A ordenação plena: os votos para a vida.' },
      { id: 'professor_d', nome: ['Professor do darma', 'Professora do darma'], anos: 6, como: 'nomeacao', formacao: 75, prestigio: 55, sustento: 0, comunidade: 200, lidera: true, texto: 'Ensina: os retiros, as palestras, os alunos que voltam.' },
      { id: 'abade', nome: ['Abade', 'Abadessa'], anos: 8, como: 'eleicao', prestigio: 80, sustento: 0, comunidade: 1500, lidera: true, texto: 'À frente do mosteiro e da comunidade monástica.' }
    ]
  }
};

/** Os caminhos que fazem sentido para uma crença (a tela oferece só esses). */
export function caminhosDaCrenca16(c: Crenca14): Tradicao16[] {
  return (Object.keys(TRADICOES16) as Tradicao16[]).filter(t => TRADICOES16[t].crencas.includes(c));
}
