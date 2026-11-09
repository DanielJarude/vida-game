/**
 * VIDA 14 · POLÍTICA — o estado guardado na vida (campos opcionais em `VidaPolitica.v14`; saves antigos seguem sem ele).
 *
 *   GESTÃO   o mandato em números que ficam: as contas públicas (saldo e dívida), a economia, a população (o bem-estar,
 *            os serviços), as instituições, o apoio parlamentar e a oposição — e as MEDIDAS em vigor, cada uma com custo
 *            por ano, carência e duração (o efeito aparece anos depois e dura enquanto a medida vale).
 *   LEGADO   o que cada mandato deixou (as medidas aprovadas, os números de quando entrou e de quando saiu).
 *   FILIAÇÃO a relação com a direção do partido, as trocas de legenda (com ou sem justa causa) e a exceção aberta
 *            (expulsão, fusão do partido, perseguição interna).
 *   BELÉM    Portugal: o Presidente da República num regime semipresidencial — não governa; promulga ou veta, envia
 *            ao Tribunal Constitucional, ouve o Conselho de Estado, nomeia o Primeiro-Ministro, pode dissolver a AR.
 */
import type { CargoEletivo } from '../../tipos';

export type TipoMedida14 = 'lei' | 'reforma' | 'investimento' | 'tributo' | 'politica' | 'administrativa';
export type IndicadorGestao14 = 'economia' | 'populacao' | 'instituicoes';
export type Escopo14 = 'municipio' | 'estado' | 'pais';

/** Uma medida decidida no mandato. */
export interface Medida14 {
  id: string;
  t: number;
  estado: 'em_vigor' | 'rejeitada' | 'concluida' | 'revogada';
  /** Votos a favor (%) e o quórum exigido, quando passou (ou não) por votação. */
  votos?: number;
  quorum?: number;
  /** Anos de vigência que faltam e anos até o efeito aparecer. */
  anos: number;
  carencia: number;
}

export interface Gestao14 {
  cargo: CargoEletivo;
  tInicio: number;
  escopo: Escopo14;
  economia: number;
  populacao: number;
  instituicoes: number;
  /** Contas públicas em % da receita do ano: o saldo do último ano e a dívida acumulada. */
  saldo: number;
  divida: number;
  /** % da casa que vota com você (no presidente, a base do governo — `Governo129.base` — é a fonte). */
  apoioParlamentar: number;
  /** A oposição mobilizada contra você, 0..100. */
  oposicao: number;
  medidas: Medida14[];
  /** Anos seguidos com déficit grande (as contas rejeitadas no terceiro). */
  deficits?: number;
  inicio: { economia: number; populacao: number; instituicoes: number; divida: number; aprovacao: number };
  anos: { ano: number; economia: number; populacao: number; instituicoes: number; saldo: number; divida: number; apoio: number }[];
}

export interface Legado14 {
  cargo: CargoEletivo;
  de: number;
  ate: number;
  aprovadas: string[];
  rejeitadas: number;
  revogadas: number;
  delta: { economia: number; populacao: number; instituicoes: number; divida: number };
  veredito: string;
}

export type JustaCausa14 = 'expulsao' | 'fusao' | 'perseguicao';

export interface Filiacao14 {
  /** A relação com a direção do partido, 0..100 (50 = normal). */
  relacao: number;
  /** A exceção aberta (vale doze meses): a troca é livre e não custa o mandato. */
  excecao?: { tipo: JustaCausa14; t: number };
  /** As trocas de legenda (a justa causa anotada). */
  trocas: { t: number; justa?: JustaCausa14 | 'janela' }[];
}

export type PromessaBelem14 = 'estabilidade' | 'proximidade' | 'exigencia' | 'mundo';

/** Portugal · o mandato em Belém. */
export interface Belem14 {
  promessa?: PromessaBelem14;
  /** O Governo em funções (sai da Assembleia da República; o PR nomeia o Primeiro-Ministro). */
  governo?: { pm: string; fem: boolean; partido: string; maioria: 'absoluta' | 'relativa'; alinhado: boolean; tInicio: number; estabilidade: number };
  /** A relação com o Governo e a magistratura de influência, 0..100. */
  relacao: number;
  influencia: number;
  promulgados: number;
  vetos: number;
  confirmados: number;
  tc: number;
  inconstitucionais: number;
  dissolucoes: number;
  conselhos: number;
  /** A última eleição da AR (a dissolução não pode vir nos seis meses seguintes — CRP, art. 172.º). */
  tLegislativas?: number;
  /** Um Governo a formar (depois das legislativas) e a crise aberta (`pt_*`). */
  formar?: number;
  crise?: { tipo: string; t: number };
  /** O diploma do ano na secretária (índice do catálogo). */
  diploma?: { id: string; t: number };
  registro: string[];
  /** Os mandatos (para a regra do art. 123.º: dois seguidos; depois, cinco anos de intervalo). */
  mandatos: { de: number; ate?: number; seguidos: number }[];
}

export interface Politica14 {
  gestao?: Gestao14;
  legados?: Legado14[];
  partido?: Filiacao14;
  belem?: Belem14;
}
