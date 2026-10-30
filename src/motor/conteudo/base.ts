/**
 * Conteúdo: acontecimentos e decisões.
 *
 * A REGRA DE AGÊNCIA É ESTRUTURAL:
 *
 *   ACONTECIMENTO — o mundo age. É uma função que narra o que aconteceu COM
 *   a pessoa e aplica apenas efeitos do mundo. Não tem opções, então não há
 *   "desfecho sorteado" que decida como o personagem se comportou. Se a
 *   reação do personagem importa, não é acontecimento: é decisão.
 *
 *   DECISÃO — o jogador escolhe. Opções com `comportamento` são evidência
 *   de personalidade; decisões `biografica` definem a história sem dizer
 *   nada sobre o caráter (qual foi a primeira palavra).
 *
 * Papéis ligam o conteúdo a PESSOAS REAIS da vida do jogador: um evento que
 * fala de "seu irmão" só existe se há um irmão, e usa o nome dele.
 */

import type { Escopo } from '../mundo/escopo';
import type { Rng } from '../rng';
import type { EventoSocial, Genero, Pessoa, Relevancia, Tema, TipoMarco, Traco, Vida } from '../tipos';
import { contrair, flex } from '../texto';
import { idade } from '../nucleo';

export interface Ctx {
  v: Vida;
  r: Rng;
  idade: number;
  /** Pessoas ligadas aos papéis do conteúdo. */
  p: Record<string, Pessoa>;
  /** Concordância com o gênero do jogador: `c.g('cansado', 'cansada')`. */
  g: (masc: string, fem: string, neutro?: string) => string;
  /** Quantas vezes este conteúdo já aconteceu nesta vida (0 = primeira). */
  vezes: number;
}

export type Papel = (v: Vida) => Pessoa[];

interface Base {
  id: string;
  idade: [number, number];
  tema: Tema;
  peso?: number | ((c: Ctx) => number);
  /** Intervalo mínimo em anos para repetir. Ausente = acontece uma vez na vida. */
  repetir?: number;
  papeis?: Record<string, Papel>;
  /**
   * ONDE o conteúdo vale (`mundo/escopo`): país, divisão ('BR-PE') ou cidade
   * da moradia atual. Ausente = universal — e por isso conteúdo de um país
   * declara o seu escopo (o São João do Nordeste não acontece em Tóquio).
   */
  escopo?: Escopo;
  quando?: (c: Ctx) => boolean;
  /**
   * Conteúdo prioritário: disparado por estado (um pedido de namoro, um
   * bebê que nasceu). Passa na frente do sorteio.
   */
  prioritario?: boolean;
  /** Entre prioritários, o maior vence (padrão 1). O nome do bebê não pode esperar. */
  prioridade?: number;
  /** Marco garantido: acontece na janela de idade se as condições valerem. */
  garantido?: boolean;
  /**
   * REWORK 12.3 · F1/F2: MARCO ÚNICO POR PESSOA. `chave` é o marco ("primeira_palavra"); `papel` é de quem é o marco (ausente:
   * de quem é jogado). O marco fica na pessoa (`Pessoa.marcos`/`Personagem.marcos`) e vale para TODOS os conteúdos com a
   * mesma chave — a primeira palavra da filha (`fil_palavra`) e a da própria pessoa (`bb_primeira_palavra`) são o mesmo
   * marco quando a filha passa a ser jogada. Não é intervalo: é "no máximo uma vez por pessoa", em qualquer geração.
   */
  marco?: { chave: string; papel?: string };
  /** Só abre por comando do jogador (ex.: entrevista de emprego). Nunca sorteado. */
  manual?: boolean;
  /**
   * REWORK 7.5: a entrada da Linha da Vida de que este conteúdo é consequência, quando o motor SABE (a crise em casa
   * segue a crise da cidade). Vira `Entrada.segue`. Ausente = sem origem conhecida (nada por semelhança).
   */
  origem?: (c: Ctx) => string | undefined;
}

export interface Narrativa {
  texto: string;
  relevancia?: Relevancia;
  tom?: 'bom' | 'ruim' | 'neutro';
  efeito?: (c: Ctx) => void;
  /** Guarda o fato na história compartilhada com uma das pessoas do papel. */
  lembrar?: [papel: string, texto: string, tipo?: TipoMarco];
  evento?: EventoSocial;
  /** REWORK 4: o fato estruturado que a frase narra (vai para a Linha da Vida junto com o texto). */
  fato?: { tipo: string; dados: Record<string, string | number> };
}

export interface Acontecimento extends Base {
  tipo: 'acontecimento';
  narrar: (c: Ctx) => Narrativa | null;
}

export interface Resultado {
  /** Mostrado ao jogador na hora (pode falar em "você"). */
  texto: string;
  /** Linha da biografia. Ausente = usa `texto`. `null` = não registra. */
  memoria?: string | null;
  relevancia?: Relevancia;
  tom?: 'bom' | 'ruim' | 'neutro';
  efeito?: (c: Ctx) => void;
  lembrar?: [papel: string, texto: string, tipo?: TipoMarco];
  evento?: EventoSocial;
  /** Reabre a mesma decisão (próxima etapa de um processo seletivo em andamento). */
  reabrir?: boolean;
  /** Abre OUTRA decisão em seguida (o resultado criou uma escolha nova: a vaga veio, mas não cabe com a faculdade). */
  abrir?: { id: string; papeis?: Record<string, string> };
}

export interface Opcao {
  id: string;
  texto: string | ((c: Ctx) => string);
  /**
   * `true` ou o motivo do bloqueio (mostrado desabilitado). `false` esconde.
   * `{ motivo, resgate }`: falta dinheiro na conta, mas as aplicações cobrem
   * — a opção aparece com "tirar das aplicações e escolher" (ver `custa`).
   */
  disponivel?: (c: Ctx) => true | string | false | { motivo: string; resgate: number };
  comportamento?: Partial<Record<Traco, number>>;
  /** O que a escolha muda, dito antes de escolher (aparece sob a opção). */
  consequencia?: (c: Ctx) => string | undefined;
  resolver: (c: Ctx) => Resultado;
}

export interface Decisao extends Base {
  tipo: 'decisao';
  titulo: string | ((c: Ctx) => string);
  texto: (c: Ctx) => string;
  opcoes: Opcao[];
  /** Escolha biográfica: nunca move personalidade. */
  biografica?: boolean;
}

export type Conteudo = Acontecimento | Decisao;

export function contexto(v: Vida, r: Rng, p: Record<string, Pessoa> = {}): Ctx {
  const genero: Genero = v.eu.tratamento ?? v.eu.genero;
  return { v, r, idade: idade(v), p, g: (m, f, n) => flex(genero, m, f, n), vezes: 0 };
}

export const txt = (x: string | ((c: Ctx) => string), c: Ctx) => (typeof x === 'string' ? x : x(c));

/**
 * REWORK 12.25: uma cena cujos textos levam nomes com artigo ("a família Vieira", "o centro") passa as frases pela
 * contração (`texto.contrair`: "de a" → "da", "em o" → "no") — o título, o texto, as opções, o resultado e a memória.
 */
export function comContracao<T extends Conteudo>(c: T): T {
  const k = (x: string | ((cx: Ctx) => string)) => (typeof x === 'string' ? contrair(x) : (cx: Ctx) => contrair(x(cx)));
  const res = (r: Resultado): Resultado => ({ ...r, texto: contrair(r.texto), ...(typeof r.memoria === 'string' ? { memoria: contrair(r.memoria) } : {}) });
  if (c.tipo === 'acontecimento') return { ...c, narrar: (cx: Ctx) => { const n = c.narrar(cx); return n ? { ...n, texto: contrair(n.texto) } : n; } };
  return { ...c, titulo: k(c.titulo), texto: (cx: Ctx) => contrair(c.texto(cx)), opcoes: c.opcoes.map(o => ({ ...o, texto: k(o.texto), resolver: (cx: Ctx) => res(o.resolver(cx)), ...(o.consequencia ? { consequencia: (cx: Ctx) => { const t = o.consequencia!(cx); return t && contrair(t); } } : {}) })) };
}
