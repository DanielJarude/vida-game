/**
 * VIDA 14 · CONQUISTAS — os catálogos puros (só tipos e dados): os objetivos pessoais que se podem escolher, os
 * programas da cidade (mesa, festas, cultura, causas, o seu meio) e o estado guardado na vida (`Vida.conquistas14`).
 * A regra mora em `motor/v14/conquistas/`.
 */

/* ------------------------------------------------------------------ Estado guardado */

export type TipoObjetivo14 = 'milionario' | 'carreira' | 'paises' | 'famoso' | 'empresa' | 'independencia' | 'tranquila' | 'casa_propria';

export interface Objetivo14 {
  /** `${tipo}:${t}` — único na vida. */
  id: string;
  tipo: TipoObjetivo14;
  /** A meta, na unidade do objetivo (milhões, pontos, países, anos — ver `OBJETIVOS14`). */
  alvo: number;
  /** Quando foi escolhido. */
  t: number;
  estado: 'ativo' | 'concluido' | 'abandonado';
  /** Quando foi concluído ou deixado de lado. */
  tFim?: number;
  /** Quantas vezes a meta foi mudada. */
  alteracoes?: number;
  /** "Vida tranquila": quantos anos seguidos a vida esteve tranquila (o pass anual conta). */
  serie?: number;
  /** O mais perto que chegou (0..1), para a leitura de quem deixou de lado. */
  melhor?: number;
  /** Na conclusão: a frase curta que fica (a retrospectiva lê daqui: "tornar-se milionária, em 2051"). */
  rotulo?: string;
}

export type TipoReconhecimento14 = 'premio' | 'descoberta' | 'congresso' | 'feira' | 'palestra' | 'entrevista' | 'projeto' | 'evento';

export interface Reconhecimento14 {
  t: number;
  tipo: TipoReconhecimento14;
  /** A frase do que aconteceu ("Destaque do ano da associação de enfermagem"). */
  texto: string;
  /** Pesa na retrospectiva (prêmio e descoberta = 2). */
  peso: 1 | 2;
}

export interface Conquistas14 {
  objetivos?: Objetivo14[];
  /** O reconhecimento no meio (os últimos 40). */
  reconhecimentos?: Reconhecimento14[];
  /** Pontos de prestígio que o reconhecimento somou (0..30, cai devagar sem novidade): `fama.prestigioProfissional` lê. */
  prestigio?: number;
  /** Programas da cidade: o último instante de cada um (`id` → t) e quantas vezes ao todo. */
  programas?: Record<string, { t: number; vezes: number }>;
}

/* ------------------------------------------------------------------ Objetivos */

export interface AlvoDeObjetivo14 { valor: number; rotulo: string }

export interface ModeloObjetivo14 {
  id: TipoObjetivo14;
  /** [masculino, feminino, neutro] */
  nome: [string, string, string];
  descricao: string;
  /** Como o motor mede (dito na tela: nada escondido). */
  mede: string;
  alvos: AlvoDeObjetivo14[];
  idade: number;
}

export const OBJETIVOS14: readonly ModeloObjetivo14[] = [
  { id: 'milionario', nome: ['Tornar-se milionário', 'Tornar-se milionária', 'Tornar-se milionárie'], descricao: 'Juntar um patrimônio de milhão.', mede: 'O patrimônio líquido (o que é seu menos o que deve), na régua do custo de vida de onde você mora.', idade: 14,
    alvos: [{ valor: 1, rotulo: 'o primeiro milhão' }, { valor: 10, rotulo: 'dez milhões' }, { valor: 100, rotulo: 'cem milhões' }] },
  { id: 'carreira', nome: ['Construir uma carreira de sucesso', 'Construir uma carreira de sucesso', 'Construir uma carreira de sucesso'], descricao: 'Ser alguém respeitado no próprio meio.', mede: 'O prestígio profissional: prêmios, currículo, publicações, anos de ofício, o degrau da carreira.', idade: 14,
    alvos: [{ valor: 50, rotulo: 'muito respeitado no meio' }, { valor: 75, rotulo: 'referência no meio' }] },
  { id: 'paises', nome: ['Conhecer vários países', 'Conhecer vários países', 'Conhecer vários países'], descricao: 'Ver o mundo com os próprios olhos.', mede: 'Os países em que você já esteve: onde nasceu, onde morou, para onde viajou.', idade: 12,
    alvos: [{ valor: 5, rotulo: 'cinco países' }, { valor: 10, rotulo: 'dez países' }, { valor: 20, rotulo: 'vinte países' }, { valor: 40, rotulo: 'quarenta países' }] },
  { id: 'famoso', nome: ['Tornar-se famoso', 'Tornar-se famosa', 'Tornar-se famose'], descricao: 'Ter o nome conhecido pelo público.', mede: 'A notoriedade: quanto o público conhece você.', idade: 12,
    alvos: [{ valor: 30, rotulo: 'reconhecido' }, { valor: 55, rotulo: 'famoso' }, { valor: 78, rotulo: 'muito famoso' }] },
  { id: 'empresa', nome: ['Criar uma grande empresa', 'Criar uma grande empresa', 'Criar uma grande empresa'], descricao: 'Fundar ou comandar uma empresa de peso.', mede: 'O valor da maior empresa em que você é dono ou sócio (investidor não conta), na régua do custo de vida local.', idade: 16,
    alvos: [{ valor: 10, rotulo: 'dez milhões' }, { valor: 100, rotulo: 'cem milhões' }, { valor: 1000, rotulo: 'um bilhão' }] },
  { id: 'independencia', nome: ['Alcançar independência financeira', 'Alcançar independência financeira', 'Alcançar independência financeira'], descricao: 'Viver da renda do que se juntou; trabalhar por escolha.', mede: 'A renda do patrimônio (aluguéis, dividendos, rendimentos) contra o custo de vida do mês.', idade: 16,
    alvos: [{ valor: 1, rotulo: 'pagar a vida' }, { valor: 1.5, rotulo: 'pagar a vida com folga' }] },
  { id: 'tranquila', nome: ['Ter uma vida tranquila', 'Ter uma vida tranquila', 'Ter uma vida tranquila'], descricao: 'Pouca pressão, saúde em dia, contas pagas.', mede: 'Anos seguidos com a cabeça leve (estresse baixo), a saúde boa e o dinheiro sem aperto.', idade: 14,
    alvos: [{ valor: 3, rotulo: 'três anos seguidos' }, { valor: 5, rotulo: 'cinco anos seguidos' }, { valor: 10, rotulo: 'dez anos seguidos' }] },
  { id: 'casa_propria', nome: ['Ter a casa própria', 'Ter a casa própria', 'Ter a casa própria'], descricao: 'Morar no que é seu.', mede: 'Morar num imóvel próprio (financiado também conta).', idade: 14,
    alvos: [{ valor: 1, rotulo: 'a casa própria' }] }
];

/* ------------------------------------------------------------------ Programas da cidade */

export type NivelPrograma14 = 'simples' | 'medio' | 'exclusivo';
export type GrupoPrograma14 = 'mesa' | 'festas' | 'cultura' | 'causas' | 'meio';

export interface VersaoDoPrograma14 {
  nivel: NivelPrograma14;
  /** O que é, concretamente. */
  nome: string;
  /** Preço de referência por pessoa (reais de hoje, ajustados ao custo da cidade). */
  custo: number;
  /** Só com convite (o nome, o prestígio ou o patrimônio abrem a porta). */
  convite?: boolean;
  /** Só em cidade grande (metrópole ou capital). */
  cidadeGrande?: boolean;
}

export interface ModeloPrograma14 {
  id: string;
  nome: string;
  grupo: GrupoPrograma14;
  /** A frase do que fica (a memória), por nível. */
  memoria: string;
  versoes: VersaoDoPrograma14[];
  /** Meses até repetir o mesmo programa (qualquer nível). */
  intervalo: number;
  idade: number;
  /** Chance de conhecer alguém (multiplica a do nível). */
  gente: number;
  /** Uma prática que anda um pouco (a cozinha, na aula de cozinha). */
  pratica?: 'cozinha';
  /** Só para quem trabalha ou tem negócio/empresa (os programas do próprio meio). */
  doMeio?: boolean;
}

export const ROTULO_GRUPO14: Record<GrupoPrograma14, string> = {
  mesa: 'À mesa', festas: 'Festas e noites especiais', cultura: 'Moda, leilões e premiações', causas: 'Causas', meio: 'Do seu meio'
};

export const PROGRAMAS14: readonly ModeloPrograma14[] = [
  { id: 'restaurante', nome: 'Um restaurante especial', grupo: 'mesa', memoria: 'Um jantar para lembrar', intervalo: 3, idade: 14, gente: 0.3, versoes: [
    { nivel: 'simples', nome: 'O restaurante do bairro de que todo mundo fala', custo: 110 },
    { nivel: 'medio', nome: 'Um restaurante de chef, com reserva', custo: 420 },
    { nivel: 'exclusivo', nome: 'Menu-degustação num restaurante premiado', custo: 1600, cidadeGrande: true }] },
  { id: 'cozinha_de_fora', nome: 'A cozinha de outro país', grupo: 'mesa', memoria: 'Sabores de longe', intervalo: 3, idade: 12, gente: 0.5, versoes: [
    { nivel: 'simples', nome: 'Comida de rua de uma comunidade imigrante (feira, barraca, food truck)', custo: 60 },
    { nivel: 'medio', nome: 'Um restaurante típico de outra cozinha — japonesa, etíope, peruana, libanesa', custo: 280 },
    { nivel: 'exclusivo', nome: 'O jantar de um chef estrangeiro em temporada na cidade', custo: 1300, cidadeGrande: true }] },
  { id: 'degustacao', nome: 'Uma degustação', grupo: 'mesa', memoria: 'Uma degustação', intervalo: 4, idade: 18, gente: 0.8, versoes: [
    { nivel: 'simples', nome: 'Cervejas artesanais ou cafés especiais, com quem produz', custo: 90 },
    { nivel: 'medio', nome: 'Vinhos, com uma sommelière explicando cada taça', custo: 340 },
    { nivel: 'exclusivo', nome: 'Safras raras numa adega fechada para poucos', custo: 2600, convite: true }] },
  { id: 'aula_de_cozinha', nome: 'Uma experiência na cozinha', grupo: 'mesa', memoria: 'Cozinhou junto de quem sabe', intervalo: 4, idade: 12, gente: 0.7, pratica: 'cozinha', versoes: [
    { nivel: 'simples', nome: 'Oficina de uma tarde: pão, massa fresca ou doces', custo: 140 },
    { nivel: 'medio', nome: 'Aula com um chef, cozinhando lado a lado', custo: 480 },
    { nivel: 'exclusivo', nome: 'A mesa do chef: jantar dentro da cozinha do restaurante', custo: 1900, cidadeGrande: true }] },
  { id: 'festival', nome: 'Um festival', grupo: 'festas', memoria: 'Um festival', intervalo: 6, idade: 12, gente: 0.8, versoes: [
    { nivel: 'simples', nome: 'Festival gastronômico de rua, de barraca em barraca', custo: 60 },
    { nivel: 'medio', nome: 'Festival internacional de comida e cultura, com ingresso', custo: 260 },
    { nivel: 'exclusivo', nome: 'A área reservada de um grande festival, com os chefs convidados', custo: 1500 }] },
  { id: 'gala', nome: 'Uma festa de gala', grupo: 'festas', memoria: 'Uma noite de gala', intervalo: 12, idade: 16, gente: 1.2, versoes: [
    { nivel: 'simples', nome: 'O baile de gala do clube ou da associação do bairro', custo: 180 },
    { nivel: 'medio', nome: 'A gala anual de uma instituição da cidade', custo: 900 },
    { nivel: 'exclusivo', nome: 'Uma gala só para convidados, com nomes que saem no jornal', custo: 3500, convite: true }] },
  { id: 'moda', nome: 'Um evento de moda', grupo: 'cultura', memoria: 'Um evento de moda', intervalo: 6, idade: 14, gente: 0.9, versoes: [
    { nivel: 'simples', nome: 'Feira de moda autoral, com os criadores no estande', custo: 50 },
    { nivel: 'medio', nome: 'Um desfile da semana de moda, com ingresso', custo: 550, cidadeGrande: true },
    { nivel: 'exclusivo', nome: 'A primeira fila de um desfile, com a festa depois', custo: 2800, convite: true, cidadeGrande: true }] },
  { id: 'leilao', nome: 'Um leilão', grupo: 'cultura', memoria: 'Uma noite de leilão', intervalo: 6, idade: 18, gente: 1, versoes: [
    { nivel: 'simples', nome: 'O leilão beneficente da escola, da paróquia ou do clube', custo: 70 },
    { nivel: 'medio', nome: 'Um pregão de arte e antiguidades, para ver de perto', custo: 220, cidadeGrande: true },
    { nivel: 'exclusivo', nome: 'A noite de uma grande casa de leilões, com lances altos', custo: 1200, convite: true, cidadeGrande: true }] },
  { id: 'premiacao', nome: 'Uma premiação', grupo: 'cultura', memoria: 'Uma noite de premiação', intervalo: 12, idade: 12, gente: 0.8, versoes: [
    { nivel: 'simples', nome: 'A premiação cultural ou esportiva da cidade, na plateia', custo: 40 },
    { nivel: 'medio', nome: 'Uma cerimônia de premiação nacional, como convidado pagante', custo: 700, cidadeGrande: true },
    { nivel: 'exclusivo', nome: 'O tapete vermelho de uma grande premiação, como convidado', custo: 2400, convite: true, cidadeGrande: true }] },
  { id: 'beneficente', nome: 'Um evento beneficente', grupo: 'causas', memoria: 'Um evento por uma causa', intervalo: 6, idade: 12, gente: 1, versoes: [
    { nivel: 'simples', nome: 'Almoço ou bingo beneficente de uma entidade da cidade', custo: 50 },
    { nivel: 'medio', nome: 'Jantar beneficente com convite pago', custo: 500 },
    { nivel: 'exclusivo', nome: 'Jantar de gala beneficente, a mesa inteira por uma causa', custo: 5000 }] },
  { id: 'feira_do_setor', nome: 'Uma feira ou congresso da sua área', grupo: 'meio', memoria: 'Um evento do meio', intervalo: 12, idade: 18, gente: 1.4, doMeio: true, versoes: [
    { nivel: 'simples', nome: 'Visitar a feira profissional do setor, de estande em estande', custo: 150 },
    { nivel: 'medio', nome: 'Inscrever-se no congresso da área: palestras, oficinas, o café no intervalo', custo: 1400 },
    { nivel: 'exclusivo', nome: 'Uma feira internacional do setor, com expositores de vários países', custo: 4200, cidadeGrande: true }] }
];

/* ------------------------------------------------------------------ Reconhecimento: as áreas */

/** Como cada área chama as suas honras (o setor da ocupação → a instituição e o prêmio). */
export interface HonraDaArea14 { quem: string; premio: string; evento: string; feira: string; assunto: string; projeto: string; descoberta?: string }

export const HONRAS14: Record<string, HonraDaArea14> = {
  saude: { quem: 'a associação regional da sua profissão', premio: 'o destaque do ano na saúde', evento: 'a posse da nova diretoria do conselho', feira: 'a feira de equipamentos e tecnologia em saúde', assunto: 'o que mudou no atendimento', projeto: 'montar o novo protocolo de atendimento do serviço', descoberta: 'um caso clínico seu, publicado e citado, que mudou uma conduta' },
  educacao: { quem: 'a rede de ensino', premio: 'a homenagem de educador do ano', evento: 'a cerimônia de abertura do ano letivo da rede', feira: 'a feira de educação e material didático', assunto: 'o que funciona na sala de aula', projeto: 'coordenar um projeto pedagógico novo da escola', descoberta: 'um método seu de ensino, adotado por outras escolas' },
  tecnologia: { quem: 'a comunidade de tecnologia da região', premio: 'o prêmio de inovação do setor', evento: 'o lançamento de um polo de tecnologia', feira: 'a feira de tecnologia e inovação', assunto: 'o que a tecnologia está mudando', projeto: 'liderar o sistema novo que a empresa inteira vai usar', descoberta: 'uma solução sua, adotada fora da empresa' },
  engenharia: { quem: 'o conselho de engenharia', premio: 'o prêmio de engenharia do ano', evento: 'a inauguração de uma obra grande da cidade', feira: 'a feira da construção e da indústria', assunto: 'as obras e a cidade', projeto: 'tocar uma obra que vai mudar um bairro', descoberta: 'uma solução técnica sua, que virou referência em projeto' },
  juridico: { quem: 'a associação de advogados e juristas', premio: 'a homenagem da classe jurídica', evento: 'a posse da nova diretoria da seccional', feira: 'o congresso jurídico do estado', assunto: 'uma lei que está em discussão', projeto: 'cuidar de um caso que todo o escritório acompanha' },
  financas: { quem: 'a associação do mercado financeiro', premio: 'o prêmio de destaque do mercado', evento: 'o jantar anual do mercado', feira: 'a feira de investimentos e finanças', assunto: 'para onde vai a economia', projeto: 'estruturar uma operação grande da casa' },
  comunicacao: { quem: 'a associação de comunicação', premio: 'um prêmio de comunicação', evento: 'a noite de lançamento de um veículo novo', feira: 'a feira de comunicação e publicidade', assunto: 'como a notícia chega às pessoas', projeto: 'tocar uma campanha (ou uma série de reportagens) de peso' },
  criativo: { quem: 'a associação de criação e design', premio: 'um prêmio de design', evento: 'a abertura de uma bienal', feira: 'a feira de design e criação', assunto: 'de onde vêm as ideias', projeto: 'assinar a identidade de um projeto grande da cidade' },
  publico: { quem: 'o órgão onde você trabalha', premio: 'a menção de servidor destaque', evento: 'a cerimônia oficial do aniversário da cidade', feira: 'o congresso de gestão pública', assunto: 'o serviço público por dentro', projeto: 'coordenar um programa novo do órgão' },
  comercio: { quem: 'a associação comercial', premio: 'o destaque do comércio local', evento: 'o jantar da associação comercial', feira: 'a feira do varejo', assunto: 'o comércio da cidade', projeto: 'abrir uma frente nova de vendas' },
  industria: { quem: 'a federação da indústria', premio: 'o prêmio de qualidade da indústria', evento: 'a inauguração de uma fábrica nova', feira: 'a feira industrial', assunto: 'a produção e o emprego', projeto: 'colocar uma linha de produção nova de pé' },
  agro: { quem: 'a cooperativa e o sindicato rural', premio: 'o destaque da safra', evento: 'a abertura da exposição agropecuária', feira: 'a feira agropecuária', assunto: 'o campo e o clima', projeto: 'testar uma cultura nova na região' },
  negocios: { quem: 'a associação empresarial', premio: 'o prêmio de empreendedor do ano', evento: 'o jantar anual dos empresários da cidade', feira: 'a feira de negócios do setor', assunto: 'como se constrói uma empresa', projeto: 'uma parceria grande com outra empresa' },
  academia: { quem: 'a sociedade científica da sua área', premio: 'o prêmio da sociedade científica', evento: 'a sessão solene da academia de ciências', feira: 'o congresso internacional da área', assunto: 'a sua pesquisa', projeto: 'coordenar um projeto de pesquisa com outros centros', descoberta: 'um resultado da sua pesquisa, citado e reproduzido por outros grupos' },
  oficio: { quem: 'o sindicato e a associação do ofício', premio: 'a homenagem de profissional do ano do ofício', evento: 'a festa anual da categoria', feira: 'a feira do setor, com fornecedores e máquinas', assunto: 'o ofício e o que mudou nele', projeto: 'tocar o serviço maior que a casa já pegou' }
};
