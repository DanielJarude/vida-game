/**
 * VIDA 12.9 · PRESIDÊNCIA — o catálogo (puro: só tipos). As regras de quem pode disputar a chefia de Estado e de governo
 * eleita pelo voto direto, país por país; o calendário de cada cargo quando ele não segue o ciclo geral do país (a
 * Presidência dos EUA a cada quatro anos, não nas eleições de meio de mandato; o Senado dos EUA pela classe da cadeira
 * de cada estado); as crises próprias do governador e do presidente; as reformas, os eixos de governo e as políticas.
 *
 * FONTES (simplificadas, não inventadas): BR CF arts. 12 §3º I, 14 §§3º e 5º, 77, 82, 85-86, 51 I, 52 I e parág. único;
 * US Const. art. II §1, 22ª Emenda, art. I §§2-3 (impeachment), classes do Senado (art. I §3); MX Const. arts. 35 II,
 * 82, 83, 110-111; AR Const. arts. 45-59, 89-90, 94-98; CL Const. arts. 25, 26, 52-53; UY Const. arts. 77, 93, 102,
 * 151-152; CO Const. arts. 174-175, 190-191, 197 (A.L. 02/2015); PE Const. arts. 110-113, 111; NG Const. 1999 ss. 131,
 * 134-137, 143; KE Const. 2010 arts. 137-138, 142, 145; CR Const. arts. 121, 131-132, 138; DO Const. arts. 80, 83,
 * 123-124, 209.
 *
 * FORA (documentado): os países em que o chefe de governo sai do parlamento (Alemanha, Itália, Índia, Espanha, Reino
 * Unido, Japão, Canadá, Austrália, Nova Zelândia, Marrocos, África do Sul, China) e Angola (o Presidente é o cabeça
 * da lista mais votada às legislativas) não têm eleição direta para presidente: a Presidência não é oferecida. Portugal,
 * França e Coreia do Sul elegem o presidente diretamente, mas num calendário que não cai nas eleições gerais do jogo
 * (2026/2031, 2027/2032, 2030/2035): ficam para uma atualização com eleição presidencial avulsa.
 */
import type { CargoDoPais } from '../mundo/tipos';

export interface RegraPresidencial {
  /** O título do cargo [masc, fem] (como `CargoDoPais.titulo`). */
  titulo: [string, string];
  anos: number;
  /** Idade mínima (na posse, como os outros cargos majoritários do jogo). */
  idade: number;
  /** A eleição presidencial: ano de referência e intervalo (cai numa eleição geral do país). */
  ciclo: [number, number];
  /** Só nacional nato (de nascença) disputa. */
  nato: boolean;
  /** Candidatura sem partido existe (com assinaturas). */
  independente: boolean;
  /** Há segundo turno; `limiar` é o percentual dos votos válidos que elege já no primeiro (Argentina: 45, ou 40 com dez de vantagem). */
  segundoTurno: boolean;
  limiar: number;
  /**
   * O limite de mandatos: `seguidos` (no máximo tantos mandatos consecutivos), `total` (na vida inteira), `intervalo`
   * (anos entre o fim do último mandato e a posse do novo: 1 = sem reeleição imediata; Costa Rica, oito anos).
   */
  limite: { seguidos?: number; total?: number; intervalo?: number; texto: string };
  /** A sede do governo ("o Palácio do Planalto") — vira `CargoDoPais.casa`. */
  palacio: string;
  /** O Congresso e as casas (a segunda ausente: unicameral). */
  congresso: string;
  casas: [string, string?];
  /** Como o partido escolhe o nome: a convenção (com prévias, às vezes) ou as primárias abertas. */
  escolha: 'convencao' | 'primarias';
  /** O processo de afastamento: o nome, o quórum para acusar (na primeira casa) e para condenar (na segunda), em % das cadeiras. */
  impeachment: { nome: string; acusa: number; condena: number; inabilita?: number };
  /** Quórum (em % das cadeiras) de uma emenda constitucional e de uma lei comum que precisa passar (EUA: o filibuster do Senado). */
  quorum: { emenda: number; lei: number };
  /** Desemprego "normal" do país (%), o ponto de partida do mandato quando a economia está normal. */
  desemprego: number;
}

const BR_LIKE = { escolha: 'convencao' as const };

export const REGRAS_PRESIDENCIAIS: Record<string, RegraPresidencial> = {
  BR: { ...BR_LIKE, titulo: ['presidente da República', 'presidenta da República'], anos: 4, idade: 35, ciclo: [2030, 4], nato: true, independente: false, segundoTurno: true, limiar: 50,
    limite: { seguidos: 2, texto: 'Uma só reeleição seguida (CF, art. 14, §5º); depois de um mandato de intervalo, pode voltar.' },
    palacio: 'o Palácio do Planalto', congresso: 'o Congresso Nacional', casas: ['a Câmara dos Deputados', 'o Senado Federal'],
    impeachment: { nome: 'o impeachment', acusa: 67, condena: 67, inabilita: 8 }, quorum: { emenda: 60, lei: 50 }, desemprego: 7.5 },
  US: { titulo: ['presidente', 'presidente'], anos: 4, idade: 35, ciclo: [2028, 4], nato: true, independente: true, segundoTurno: false, limiar: 0,
    limite: { total: 2, texto: 'No máximo dois mandatos na vida (22ª Emenda).' },
    palacio: 'a Casa Branca', congresso: 'o Congresso', casas: ['a Câmara dos Representantes', 'o Senado'], escolha: 'primarias',
    impeachment: { nome: 'o impeachment', acusa: 50, condena: 67 }, quorum: { emenda: 67, lei: 60 }, desemprego: 4.2 },
  MX: { ...BR_LIKE, titulo: ['presidente da República', 'presidenta da República'], anos: 6, idade: 35, ciclo: [2030, 6], nato: true, independente: true, segundoTurno: false, limiar: 0,
    limite: { total: 1, texto: 'Um só mandato, sem reeleição nunca (art. 83).' },
    palacio: 'o Palácio Nacional', congresso: 'o Congresso da União', casas: ['a Câmara dos Deputados', 'o Senado da República'],
    impeachment: { nome: 'o processo no Congresso', acusa: 50, condena: 67 }, quorum: { emenda: 67, lei: 50 }, desemprego: 3 },
  AR: { ...BR_LIKE, titulo: ['presidente da Nação', 'presidenta da Nação'], anos: 4, idade: 30, ciclo: [2027, 4], nato: true, independente: false, segundoTurno: true, limiar: 45,
    limite: { seguidos: 2, texto: 'Uma reeleição seguida; depois, só com um mandato de intervalo (art. 90).' },
    palacio: 'a Casa Rosada', congresso: 'o Congresso da Nação', casas: ['a Câmara de Deputados', 'o Senado'],
    impeachment: { nome: 'o juízo político', acusa: 67, condena: 67 }, quorum: { emenda: 67, lei: 50 }, desemprego: 7 },
  CL: { ...BR_LIKE, titulo: ['presidente da República', 'presidenta da República'], anos: 4, idade: 35, ciclo: [2029, 4], nato: true, independente: true, segundoTurno: true, limiar: 50,
    limite: { intervalo: 1, texto: 'Sem reeleição para o período seguinte (art. 25): só depois de um mandato de intervalo.' },
    palacio: 'o Palácio de La Moneda', congresso: 'o Congresso Nacional', casas: ['a Câmara de Deputados', 'o Senado'],
    impeachment: { nome: 'a acusação constitucional', acusa: 50, condena: 67 }, quorum: { emenda: 57, lei: 50 }, desemprego: 8.5 },
  UY: { ...BR_LIKE, titulo: ['presidente da República', 'presidenta da República'], anos: 5, idade: 35, ciclo: [2029, 5], nato: true, independente: false, segundoTurno: true, limiar: 50,
    limite: { intervalo: 1, texto: 'Sem reeleição imediata: só depois de um mandato de intervalo (art. 152).' },
    palacio: 'a Torre Executiva', congresso: 'a Assembleia Geral', casas: ['a Câmara de Representantes', 'a Câmara de Senadores'],
    impeachment: { nome: 'o juízo político', acusa: 50, condena: 67 }, quorum: { emenda: 67, lei: 50 }, desemprego: 7.5 },
  CO: { ...BR_LIKE, titulo: ['presidente da República', 'presidenta da República'], anos: 4, idade: 30, ciclo: [2030, 4], nato: true, independente: true, segundoTurno: true, limiar: 50,
    limite: { total: 1, texto: 'Um só mandato, sem reeleição (art. 197, desde 2015).' },
    palacio: 'a Casa de Nariño', congresso: 'o Congresso da República', casas: ['a Câmara de Representantes', 'o Senado'],
    impeachment: { nome: 'o processo na Comissão de Acusação', acusa: 50, condena: 67 }, quorum: { emenda: 50, lei: 50 }, desemprego: 10 },
  PE: { ...BR_LIKE, titulo: ['presidente da República', 'presidenta da República'], anos: 5, idade: 35, ciclo: [2031, 5], nato: true, independente: false, segundoTurno: true, limiar: 50,
    limite: { intervalo: 1, texto: 'Sem reeleição imediata: só depois de um mandato de intervalo (art. 112).' },
    palacio: 'o Palácio do Governo', congresso: 'o Congresso da República', casas: ['a Câmara de Deputados', 'o Senado'],
    impeachment: { nome: 'a vacância por incapacidade moral', acusa: 67, condena: 67 }, quorum: { emenda: 67, lei: 50 }, desemprego: 6.5 },
  NG: { ...BR_LIKE, titulo: ['presidente', 'presidente'], anos: 4, idade: 35, ciclo: [2027, 4], nato: true, independente: false, segundoTurno: true, limiar: 40,
    limite: { total: 2, texto: 'No máximo dois mandatos (s. 137).' },
    palacio: 'Aso Rock, a sede da Presidência', congresso: 'a Assembleia Nacional', casas: ['a Câmara dos Representantes', 'o Senado'],
    impeachment: { nome: 'o impeachment', acusa: 67, condena: 67 }, quorum: { emenda: 67, lei: 50 }, desemprego: 5 },
  KE: { ...BR_LIKE, titulo: ['presidente', 'presidente'], anos: 5, idade: 35, ciclo: [2027, 5], nato: true, independente: true, segundoTurno: true, limiar: 50,
    limite: { total: 2, texto: 'No máximo dois mandatos (art. 142).' },
    palacio: 'a State House', congresso: 'o Parlamento', casas: ['a Assembleia Nacional', 'o Senado'],
    impeachment: { nome: 'o impeachment', acusa: 67, condena: 67 }, quorum: { emenda: 67, lei: 50 }, desemprego: 5.5 },
  CR: { ...BR_LIKE, titulo: ['presidente da República', 'presidenta da República'], anos: 4, idade: 30, ciclo: [2030, 4], nato: true, independente: false, segundoTurno: true, limiar: 40,
    limite: { intervalo: 8, texto: 'Só oito anos depois de deixar o cargo (art. 132).' },
    palacio: 'a Casa Presidencial', congresso: 'a Assembleia Legislativa', casas: ['a Assembleia Legislativa'],
    impeachment: { nome: 'a acusação na Assembleia', acusa: 67, condena: 67 }, quorum: { emenda: 67, lei: 50 }, desemprego: 9 },
  DO: { ...BR_LIKE, titulo: ['presidente da República', 'presidenta da República'], anos: 4, idade: 30, ciclo: [2028, 4], nato: true, independente: false, segundoTurno: true, limiar: 50,
    limite: { seguidos: 2, total: 2, texto: 'Dois mandatos seguidos no máximo, e nunca mais depois (art. 124).' },
    palacio: 'o Palácio Nacional', congresso: 'o Congresso Nacional', casas: ['a Câmara de Deputados', 'o Senado'],
    impeachment: { nome: 'o juízo político', acusa: 67, condena: 67 }, quorum: { emenda: 67, lei: 50 }, desemprego: 6 }
};

/** O porquê de não haver Presidência eleita num país do jogo (para a tela). */
export const SEM_PRESIDENCIA: Record<string, string> = {
  PT: 'Em Portugal, o Presidente é eleito em data própria (2026, 2031), fora das eleições gerais do jogo: ainda não dá para disputar.',
  FR: 'Na França, a eleição presidencial tem data própria (2027, 2032), fora das eleições gerais do jogo: ainda não dá para disputar.',
  KR: 'Na Coreia do Sul, a eleição presidencial tem data própria, fora das eleições gerais do jogo: ainda não dá para disputar.',
  AO: 'Em Angola, o Presidente é o cabeça da lista mais votada às legislativas: não há candidatura avulsa à Presidência.',
  ZA: 'Na África do Sul, o Presidente é eleito pela Assembleia Nacional, não pelo voto direto.'
};
export const semPresidenciaTexto = (pais: string) => SEM_PRESIDENCIA[pais] ?? 'Neste país, quem governa sai do parlamento (ou é escolhido por ele): não há eleição direta para presidente.';

/** O cargo de presidente no formato dos perfis de país (para a escada política). */
export function cargoPresidencial(pais: string): CargoDoPais | undefined {
  const r = REGRAS_PRESIDENCIAIS[pais];
  return r ? { titulo: r.titulo, anos: r.anos, idade: r.idade, casa: r.palacio } : undefined;
}

/*
 * O CALENDÁRIO DE CADA CARGO. O jogo tem dois ciclos por país (local e geral). Quase todo cargo cai no seu; alguns
 * não: a Presidência dos EUA (de quatro em quatro anos, nunca nas eleições de meio de mandato); o Senado dos EUA (cada
 * estado tem duas cadeiras, de classes diferentes, e só vota quando a classe de uma delas vence — duas eleições gerais
 * em cada três); o Distrito de Colúmbia (sem senadores e sem governador). Classe 1: 2024, 2030...; 2: 2026, 2032...;
 * 3: 2028, 2034... (as cadeiras dos estados do jogo, em 2026).
 */
const CLASSES_SENADO_US: Record<string, number[]> = {
  NY: [1, 3], CA: [1, 3], IL: [2, 3], TX: [1, 2], FL: [1, 3], GA: [2, 3], WA: [1, 3], OH: [1, 3], OR: [2, 3], KY: [2, 3], NJ: [1, 2], MT: [1, 2]
};
const BASE_DA_CLASSE: Record<number, number> = { 1: 2024, 2: 2026, 3: 2028 };

/**
 * Os ciclos [ano-base, intervalo] em que o cargo tem eleição neste lugar. `undefined`: segue o ciclo do país (local ou
 * geral); `[]`: nunca há eleição para ele aqui.
 */
export function ciclosDoCargo129(pais: string, cargo: string, uf: string): [number, number][] | undefined {
  if (cargo === 'presidente') { const r = REGRAS_PRESIDENCIAIS[pais]; return r ? [r.ciclo] : []; }
  if (pais === 'US' && (cargo === 'senador' || cargo === 'governador')) {
    if (uf === 'DC') return [];
    if (cargo === 'senador') return (CLASSES_SENADO_US[uf] ?? [1, 2, 3]).map(k => [BASE_DA_CLASSE[k], 6] as [number, number]);
  }
  return undefined;
}

/** O ano cai num dos ciclos? */
export const caiNoCiclo = (ano: number, ciclos: [number, number][]) => ciclos.some(([b, k]) => ano >= b - k * 50 && (((ano - b) % k) + k) % k === 0);

/* ======================================================= As crises de cada cargo */

/**
 * O governador governa um ESTADO: segurança pública (a polícia é estadual), rodovias e hospitais regionais, os
 * repasses federais, a chuva que isola o interior, o presídio — além da greve (dos professores da rede estadual) e do
 * aliado no noticiário, que valem para qualquer Executivo. O prefeito segue com os problemas do município.
 */
export const CRISES_GOVERNADOR = ['gov_seguranca', 'gov_rodovia', 'gov_hospital', 'gov_repasse', 'gov_chuva', 'gov_presidio', 'greve', 'aliado'] as const;
/** O presidente governa o PAÍS: a inflação, a greve nacional, a tragédia, o mundo, o ministério, o Supremo, o câmbio, o surto, a rua. */
export const CRISES_PRESIDENTE = ['pres_inflacao', 'pres_greve', 'pres_desastre', 'pres_diplomatica', 'pres_ministro', 'pres_supremo', 'pres_cambio', 'pres_surto', 'pres_protestos'] as const;
export const crisesDoCargo129 = (cargo: string): readonly string[] | undefined => (cargo === 'governador' ? CRISES_GOVERNADOR : cargo === 'presidente' ? CRISES_PRESIDENTE : undefined);
/** As crises que têm cena própria (não a do município). */
export const ehCrise129 = (tipo: string | undefined) => !!tipo && /^(gov|pres)_/.test(tipo);

/* ======================================================= O governo do país */

export type Eixo129 = 'economia' | 'social' | 'seguranca' | 'infraestrutura' | 'ambiente' | 'educacao_saude';
export const EIXOS_129: Record<Eixo129, string> = {
  economia: 'a economia e o emprego', social: 'o combate à pobreza', seguranca: 'a segurança pública', infraestrutura: 'estradas, energia e obras',
  ambiente: 'o clima e o meio ambiente', educacao_saude: 'a escola e o hospital público'
};

export type Reforma129 = 'tributaria' | 'previdencia' | 'administrativa' | 'politica' | 'educacao' | 'seguranca';
export interface ModeloReforma { nome: string; emenda: boolean; eixo: Eixo129; texto: string }
export const REFORMAS_129: Record<Reforma129, ModeloReforma> = {
  tributaria: { nome: 'a reforma tributária', emenda: true, eixo: 'economia', texto: 'simplificar os impostos e mudar quem paga quanto' },
  previdencia: { nome: 'a reforma da previdência', emenda: true, eixo: 'economia', texto: 'mexer na idade e no valor das aposentadorias para a conta fechar' },
  administrativa: { nome: 'a reforma administrativa', emenda: true, eixo: 'infraestrutura', texto: 'mudar as regras do serviço público' },
  politica: { nome: 'a reforma política', emenda: true, eixo: 'social', texto: 'mudar as regras das eleições e dos partidos' },
  educacao: { nome: 'o plano nacional de educação e saúde', emenda: false, eixo: 'educacao_saude', texto: 'carimbar dinheiro para escola e hospital por dez anos' },
  seguranca: { nome: 'o sistema nacional de segurança', emenda: false, eixo: 'seguranca', texto: 'integrar as polícias e mudar a lei penal' }
};

export type PoliticaEconomica129 = 'ajuste' | 'estimulo' | 'social' | 'investimento';
/** O que cada política econômica faz no ano (pontos percentuais sobre a tendência): PIB, inflação, desemprego, aprovação. */
export const POLITICAS_129: Record<PoliticaEconomica129, { nome: string; pib: number; inflacao: number; desemprego: number; aprovacao: number }> = {
  ajuste: { nome: 'o ajuste fiscal', pib: -0.7, inflacao: -1.2, desemprego: 0.5, aprovacao: -4 },
  estimulo: { nome: 'o estímulo ao crédito e ao consumo', pib: 0.9, inflacao: 1.1, desemprego: -0.6, aprovacao: 2 },
  social: { nome: 'a ampliação dos programas sociais', pib: 0.2, inflacao: 0.4, desemprego: -0.2, aprovacao: 4 },
  investimento: { nome: 'o investimento em obras e energia', pib: 0.5, inflacao: 0.3, desemprego: -0.4, aprovacao: 1 }
};

/** O PIB de um ano por fase da economia do mundo do jogo (% ao ano). */
export const PIB_DA_FASE: Record<string, number> = { expansao: 3.4, normal: 2.1, desaceleracao: 0.7, crise: -2.2, recuperacao: 2.6 };

/** Os perfis dos adversários: de onde vem cada um, e a força média (na mesma escala da força da candidatura). */
export const PERFIS_ADVERSARIO = [
  { id: 'governador', texto: (g: boolean) => (g ? 'governadora de um estado grande' : 'governador de um estado grande'), forca: 70 },
  { id: 'senador', texto: (g: boolean) => (g ? 'senadora com três mandatos' : 'senador com três mandatos'), forca: 64 },
  { id: 'ministro', texto: (g: boolean) => (g ? 'ex-ministra da Fazenda' : 'ex-ministro da Fazenda'), forca: 60 },
  { id: 'prefeito', texto: (g: boolean) => (g ? 'ex-prefeita da maior cidade do país' : 'ex-prefeito da maior cidade do país'), forca: 62 },
  { id: 'outsider', texto: (g: boolean) => (g ? 'empresária que nunca disputou eleição' : 'empresário que nunca disputou eleição'), forca: 55 },
  { id: 'apresentador', texto: (g: boolean) => (g ? 'apresentadora de televisão' : 'apresentador de televisão'), forca: 52 },
  { id: 'deputado', texto: (g: boolean) => (g ? 'deputada conhecida pelas redes' : 'deputado conhecido pelas redes'), forca: 46 },
  { id: 'militante', texto: (g: boolean) => (g ? 'líder de um movimento social' : 'líder de um movimento social'), forca: 36 }
] as const;

/* ======================================================= O estado guardado na vida (campos opcionais) */

export interface Adversario129 {
  nome: string;
  feminino: boolean;
  partido?: string;
  /** De onde vem (`PERFIS_ADVERSARIO`). */
  perfil: string;
  /** A força na mesma escala da força da candidatura; muda com a campanha (o debate, o escândalo). */
  forca: number;
}

/** A corrida presidencial em curso (da indicação ao fim da apuração). */
export interface CampanhaPresidencial129 {
  ano: number;
  /** 0 a indicação · 1 a chapa · 2 o eixo · 3 a estratégia · 4 o debate · 5 a reta final · 6 pronta para a urna. */
  etapa: number;
  /** Como virou candidato: a convenção (ou as prévias), as primárias, a reeleição, a candidatura independente. */
  via: 'convencao' | 'primarias' | 'reeleicao' | 'independente';
  adversarios: Adversario129[];
  /** O rival dentro do partido (na convenção ou nas primárias). */
  rival?: string;
  chapa?: 'partido' | 'coligacao' | 'tecnica';
  vice?: string;
  eixo?: Eixo129;
  estrategia?: 'rua' | 'tv' | 'aliancas';
  debate?: 'propostas' | 'ataque' | 'calma' | 'faltou';
  /** Como o debate saiu (para a tela e o histórico). */
  debateFoi?: 'bem' | 'mal' | 'empate';
  /** A reta final: o que aconteceu e a resposta. */
  reta?: string;
  resposta?: string;
  /** A sua intenção de voto depois de cada etapa (as pesquisas da campanha). */
  pesquisas: number[];
  /** O resultado do primeiro turno (por nome; `voce` marca o seu). */
  primeiro?: { nome: string; partido?: string; pct: number; voce?: boolean }[];
  /** O segundo turno: o adversário (índice) e a escolha da última semana. */
  segundo?: { adv: number; t: number; escolha?: string };
  /** A chance estimada antes da urna (fica para a explicação do resultado). */
  chance?: number;
}

export interface CandidaturaPresidencial129 {
  ano: number;
  partido?: string;
  via: CampanhaPresidencial129['via'];
  resultado: 'eleito' | 'derrotado' | 'preterido' | 'desistiu';
  /** Os números do primeiro turno (os quatro primeiros e o seu). */
  primeiro?: { nome: string; partido?: string; pct: number; voce?: boolean }[];
  /** O segundo turno: o seu percentual e o adversário. */
  segundo?: { voce: number; adversario: string };
  adversarios: string[];
  debate?: CampanhaPresidencial129['debateFoi'];
  eixo?: Eixo129;
  chapa?: CampanhaPresidencial129['chapa'];
  reeleicao?: boolean;
}

/** O governo em exercício: a economia do país, a base no Congresso, o mundo, as reformas, o que ficou. */
export interface Governo129 {
  tInicio: number;
  inflacao: number;
  pib: number;
  desemprego: number;
  /** As cadeiras com o governo (%). */
  base: number;
  /** As relações com o mundo, 0..100. */
  mundo: number;
  /** A tensão com os outros Poderes (o Supremo, o Congresso), 0..100. */
  conflito: number;
  eixos: Eixo129[];
  /** A política econômica escolhida no ano (e quando). */
  politica?: { id: PoliticaEconomica129; t: number };
  /** O efeito que fica das reformas aprovadas (pontos sobre a tendência). */
  ajuste: { pib: number; inflacao: number; desemprego: number };
  /** A reforma em tramitação: a etapa (1 a primeira casa, 2 a segunda) e desde quando. */
  reforma?: { id: Reforma129; etapa: 1 | 2; t: number };
  reformas: { id: Reforma129; t: number; aprovada: boolean }[];
  conquistas: string[];
  escandalos: number;
  /** O processo de afastamento em curso. */
  impeachment?: { t: number; etapa: 1 | 2 };
  /** Os números do começo (para o legado). */
  inicio: { inflacao: number; pib: number; desemprego: number };
  /** Ano a ano (no máximo os 12 últimos). */
  anos: { ano: number; aprovacao: number; inflacao: number; pib: number; desemprego: number; base: number }[];
}

/** Um mandato presidencial que acabou (o legado). */
export interface MandatoPresidencial129 {
  de: number;
  ate: number;
  como: 'concluiu' | 'renunciou' | 'afastado' | 'cassado';
  aprovacao: number;
  inflacao: number;
  pib: number;
  desemprego: number;
  reformas: string[];
  conquistas: string[];
  legado: string;
}

export interface Presidencia129 {
  campanha?: CampanhaPresidencial129;
  candidaturas: CandidaturaPresidencial129[];
  governo?: Governo129;
  mandatos: MandatoPresidencial129[];
}
