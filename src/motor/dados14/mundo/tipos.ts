/**
 * VIDA 14 · Eventos mundiais e evolução histórica — os tipos guardados no save (`Vida.mundo14`, opcional).
 *
 * O mundo da vida guarda o que JÁ aconteceu (nunca é sorteado de novo: o passado não se contradiz) e, de cada
 * acontecimento, o efeito que ele tem nos sistemas antigos (`mods`) e até quando (`ate`). A cada ano, a soma dos efeitos
 * ativos vira `efeitos` — o campo que os sistemas antigos leem (sem importar nada da VIDA 14).
 */

export type TipoEventoMundial =
  | 'economia' | 'tecnologia' | 'ciencia' | 'desastre' | 'pandemia' | 'cultura' | 'esporte' | 'internacional' | 'trabalho' | 'produtos';

/** Onde aconteceu, visto da vida: no mundo todo, no país onde se mora, na região (estado/província) de casa, ou longe. */
export type EscopoEventoMundial = 'mundo' | 'pais' | 'regiao' | 'exterior';

/** O que um acontecimento muda nos sistemas existentes, enquanto dura. Multiplicadores: 1 = nada; somas: 0 = nada. */
export interface EfeitosMundo14 {
  /** Multiplica o risco de demissão (carteira assinada). */
  demissao?: number;
  /** Soma na chance de uma contratação. */
  contratacao?: number;
  /** Soma no ganho real do reajuste anual do salário. */
  reajuste?: number;
  /** Soma no movimento de quem trabalha por conta (clientela). */
  clientela?: number;
  /** Por setor de ocupação (`dados/ocupacoes.Setor`): multiplica as vagas; abaixo de 1 também aumenta o risco de corte. */
  setores?: Partial<Record<string, number>>;
  /** Por ramo de empresa (tipo da pequena ou setor da grande): multiplica a procura/as vendas. */
  ramos?: Partial<Record<string, number>>;
}

export interface EventoMundial14 {
  /** Único: `${ano}:${chave}`. */
  id: string;
  ano: number;
  tipo: TipoEventoMundial;
  escopo: EscopoEventoMundial;
  /** Onde (legível): "Japão", "Pernambuco", "o mundo todo". */
  lugar?: string;
  titulo: string;
  /** O que aconteceu (frase do jogo). */
  texto: string;
  /** A consequência, dita (o que muda na vida — só o que o motor aplica). */
  efeito?: string;
  /** O que ele muda nos sistemas, de `ano` até `ate` (inclusive). */
  mods?: EfeitosMundo14;
  ate?: number;
  /** Fato histórico real (anos antes de 2026). */
  real?: boolean;
  /** Marco da evolução (profissão, automação, tecnologia): fica na linha do tempo do mundo. */
  marco?: boolean;
}

export interface Mundo14 {
  /** O que o mundo viveu durante esta vida (e as anteriores da família), em ordem. Os mais antigos saem acima de 120. */
  eventos: EventoMundial14[];
  /** A soma dos efeitos ativos no ano corrente (recalculada todo ano). */
  efeitos?: EfeitosMundo14;
  /** Instante (mês absoluto) até quando viajar para fora do país está bloqueado (fronteiras fechadas). */
  exteriorAte?: number;
  /** Último ano processado (o mesmo ano nunca é sorteado duas vezes). */
  ultimo?: number;
}
