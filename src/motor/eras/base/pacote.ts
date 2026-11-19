/**
 * ERAS v3 · O PACOTE DE ÉPOCA DE UM PAÍS — a mesma pergunta central da v1/v2, agora para outros países.
 *
 * O Brasil continua com os módulos próprios (`moedas`, `series`, `economia`, `dados/acontecimentosBR`...): nada foi
 * movido. Um país novo é um PACOTE de dados (`eras/paises/<id>/`), carregado sob demanda como os perfis do mundo
 * (`eras/paises/carregar`), e registrado aqui. A base só lê pacotes: não há `switch (país)` no motor da época.
 *
 * O pacote responde às mesmas perguntas que o Brasil responde:
 *   - quanto valia o dinheiro (as séries de preços e de renda, a cadeia das moedas);
 *   - o que aconteceu (acontecimentos com data, lugar, idade mínima e efeito);
 *   - quando cada coisa chegou ao país (tecnologias: chegada, popularização, massa);
 *   - como era viver (lembranças por época, as regras sociais e de direitos, os governantes);
 *   - como apresentar a época na escolha (as décadas).
 *
 * Classes de dado (como na v1): [S] série oficial · [F] fato documentado · [A] aproximação de jogo. Cada acontecimento e
 * cada regra traz a fonte no próprio dado; as séries, no cabeçalho do arquivo gerado.
 */

import type { EfeitosMundo14 } from '../../dados14/mundo/tipos';

/** As séries anuais (geradas: `scripts/eras3/gerar_series.py`). */
export interface SerieDaEpoca {
  T0: number;
  /** Nível médio de preços do ano ÷ o de 2025, na moeda de hoje (a cadeia das moedas antigas fica nas moedas). */
  PRECOS: readonly number[];
  /** PIB real per capita do ano ÷ o de 2025. */
  RENDA: readonly number[];
  /** Variação real do PIB per capita (%). */
  PIB: readonly (number | null)[];
  /** Desemprego (%), null sem dado. */
  DESEMPREGO: readonly (number | null)[];
  /** Nível de preços mensal (sobrepõe a interpolação: hiperinflação). */
  MENSAL_T0: number;
  MENSAL: readonly number[];
}

/** Uma moeda que circulou. */
export interface MoedaDaEpoca {
  /** Chave interna única (aparece como "código" da moeda no motor: `mundo/moeda`). */
  id: string;
  nome: string;
  plural: string;
  simbolo: string;
  /** Primeiro mês em que o jogo usa esta moeda (t = ano*12 + mês 0..11). */
  desde: number;
  dataOficial: string;
  /** Unidades desta moeda por unidade da moeda de hoje (a cadeia oficial). */
  porAtual: number;
  /** A troca ("1 Rentenmark = 1 bilhão de marcos"). */
  troca?: string;
  /** Como escrever o valor: o padrão ("US$ 1.234"); a libra antes da decimalização ("£3 4s 6d"). */
  formato?: 'lsd';
  /** Só numa parte do país (a Alemanha Oriental: `lado: 'leste'`). */
  lado?: LadoDaDivisao;
  fonte: string;
}

/** O lado de um país dividido (a Alemanha de 1949 a 1990). */
export type LadoDaDivisao = 'oeste' | 'leste';

export type CategoriaDeAcontecimento = 'politica' | 'economia' | 'sociedade' | 'direitos' | 'esporte' | 'cultura' | 'desastre' | 'saude' | 'tecnologia' | 'guerra';

/** Efeito especial no motor (tratado em `eras/ano`, um por chave — os mesmos para todos os países). */
export type EspecialDaEpoca =
  /** Congelamento de depósitos (Japão, fev/1946; Argentina, dez/2001): parte do dinheiro fica presa e volta depois. */
  | { tipo: 'congelamento'; limite: number; voltaEm: number; parcelas: number; perda: number; texto: string }
  /** Reforma monetária que corta as economias (Alemanha Ocidental, 20/06/1948): sobra `fica` do que estava guardado. */
  | { tipo: 'corte_das_economias'; fica: number; protegido: number; texto: string }
  /** Hiperinflação que apaga o dinheiro guardado (Alemanha, 1923): sobra `fica`. */
  | { tipo: 'hiperinflacao'; fica: number; texto: string }
  /** Racionamento (guerra): o custo de vida pesa mais e a vida aperta. */
  | { tipo: 'racionamento'; texto: string }
  /** Uma pandemia (gripe de 1918): um risco de saúde no ano. */
  | { tipo: 'pandemia'; risco: number; texto: string }
  /** Uma catástrofe local (bombardeio, terremoto): o risco histórico de morrer de quem estava na cidade; os outros sobrevivem com o trauma. */
  | { tipo: 'catastrofe'; risco: number; texto: string; sobreviveu: string };

export interface AcontecimentoDaEpoca {
  id: string;
  /** [ano, mês 1..12]. */
  data: [number, number];
  titulo: string;
  fato: string;
  categoria: CategoriaDeAcontecimento;
  /** 'biografia' marca a vida; 'cotidiano' é lembrança. */
  peso?: 'biografia' | 'cotidiano';
  idadeMin?: number;
  /** Só nestas divisões (códigos do perfil do país). */
  divisoes?: string[];
  /** Só de um lado do país dividido. */
  lado?: LadoDaDivisao;
  /** Efeito na economia do mundo (`v14/mundo`). */
  mods?: EfeitosMundo14;
  dura?: number;
  efeito?: string;
  especial?: EspecialDaEpoca;
  /** Por que importa para a pessoa (a frase pessoal, por situação). */
  pessoal?: { trabalho?: string; semTrabalho?: string; crianca?: string; mulher?: string };
  fonte: string;
}

/** Quando uma tecnologia (ids de `tecnologias`) chegou ao país. */
export interface ChegadaNoPais {
  chega: number;
  popular: number;
  massa: number;
  fim?: number;
  fonte: string;
  /** No lado leste do país dividido, enquanto durou a divisão (a Alemanha Oriental): as datas de lá. */
  leste?: { chega: number; popular: number; massa: number };
}

export interface LembrancaDaEpoca {
  id: string;
  de: number;
  ate: number;
  idade: [number, number];
  tipo: 'musica' | 'tv' | 'radio' | 'cinema' | 'jogo' | 'brincadeira' | 'comida' | 'moda' | 'rua' | 'festa' | 'esporte' | 'casa' | 'escola' | 'trabalho' | 'religiao' | 'leitura';
  texto: string;
  /** Tecnologia que a lembrança exige (a TV, o rádio). */
  exige?: string;
  divisoes?: string[];
  lado?: LadoDaDivisao;
  /** Só em cidade grande / só fora dela. */
  meio?: 'urbano' | 'rural';
}

/** Uma regra social ou de direitos que vale num período (o que a lei e a sociedade permitiam ou impunham). */
export interface RegraSocial {
  id: string;
  /** O que a regra afeta no motor (lido por `eras/base/sociedade`). */
  tema: 'voto_feminino' | 'mulher_casada' | 'divorcio' | 'casamento_igualitario' | 'homossexualidade_crime' | 'segregacao' | 'servico_militar' | 'escola_obrigatoria' | 'trabalho_infantil' | 'maioridade' | 'previdencia' | 'saude_publica' | 'censura' | 'perseguicao' | 'sem_eleicoes';
  /** A quem a regra pesa (ausente: a todos). 'negro': ancestralidade africana de um quarto ou mais (a regra racial da época). */
  quem?: 'mulher' | 'homem' | 'negro' | 'pobre' | 'mesmo_genero';
  /** 'sem_eleicoes': só estes cargos (ausente: todos). */
  cargos?: string[];
  de: number;
  ate?: number;
  /** Detalhe numérico da regra (a idade do voto, a da maioridade, os anos de escola obrigatória). */
  valor?: number;
  divisoes?: string[];
  lado?: LadoDaDivisao;
  /** Como a regra aparece na vida (uma vez, na idade em que pesa). */
  texto: string;
  fonte: string;
}

/** Uma guerra com convocação: quem tinha a idade e o gênero era chamado (o risco é de `eras/base/guerra`). */
export interface GuerraDaEpoca {
  id: string;
  nome: string;
  de: [number, number];
  ate: [number, number];
  /** Idades convocadas (homens; `mulheres` quando houve convocação feminina). */
  idades: [number, number];
  mulheres?: boolean;
  /** Fração dos homens da idade que serviu (aproximação documentada). */
  alcance: number;
  /** Fração dos que serviram que morreram (histórica; o jogo usa uma fração dela: `guerra`). */
  letalidade: number;
  /** Onde a guerra chega em casa (bombardeios, ocupação): a frase da vida civil. */
  frente?: string;
  /** [ano, mês] a partir de quando a frase da frente vale (os bombardeios não começam com a guerra). */
  frenteDesde?: [number, number];
  lado?: LadoDaDivisao;
  fonte: string;
}

export interface GovernanteDaEpoca {
  nome: string;
  cargo: string;
  /** [ano, mês 1..12] */
  desde: [number, number];
  lado?: LadoDaDivisao;
  nota?: string;
}

/** A década na escolha da época (a apresentação curta: sem enciclopédia). */
export interface DecadaDaEpoca {
  decada: number;
  rotulo: string;
  contexto: string;
  sociedade: string;
  tecnologia: string;
  cultura: string;
  dinheiro: string;
  /** ids de acontecimentos que a infância atravessa. */
  marcos: string[];
}

export interface PacoteDeEra {
  pais: string;
  nome: string;
  /** O primeiro ano de nascimento jogável (o limite das séries e do conteúdo). */
  desde: number;
  serie: SerieDaEpoca;
  moedas: readonly MoedaDaEpoca[];
  /** Salário mínimo nacional, quando existia: [t, valor nominal na moeda do mês]. */
  salarioMinimo?: readonly (readonly [number, number])[];
  acontecimentos: readonly AcontecimentoDaEpoca[];
  tecnologias: Readonly<Record<string, ChegadaNoPais>>;
  lembrancas: readonly LembrancaDaEpoca[];
  regras: readonly RegraSocial[];
  guerras: readonly GuerraDaEpoca[];
  governantes: readonly GovernanteDaEpoca[];
  decadas: readonly DecadaDaEpoca[];
  /** O país dividido: as divisões do lado leste e o período (Alemanha: 1949–1990). */
  divisao?: { de: [number, number]; ate: [number, number]; leste: string[]; partilhada?: Record<string, number>; rendaLeste: number; nomes: Record<LadoDaDivisao, string> };
  /** O nome oficial do Estado por período (Império do Japão, Reich alemão...). */
  nomesOficiais?: readonly { ate: number; nome: string; lado?: LadoDaDivisao }[];
  /** O calendário da era imperial japonesa (nengō), quando o país o usa. */
  eras?: readonly { nome: string; desde: [number, number, number] }[];
  /** As profissões que chegam em outro ano neste país (sobrepõe `OCUPACOES_DESDE`, que tem as datas do Brasil). */
  ocupacoes?: Readonly<Record<string, number>>;
  /** Os cursos que chegam em outro ano neste país (sobrepõe `CURSOS_NO_TEMPO`). */
  cursos?: Readonly<Record<string, number>>;
  /** Os partidos (siglas do perfil contemporâneo do país) que ainda não existiam: sigla → ano de fundação. */
  partidosDesde?: Readonly<Record<string, number>>;
}

/* ------------------------------------------------------------------ O registro */

const PACOTES = new Map<string, PacoteDeEra>();
const ouvintes: ((p: PacoteDeEra) => void)[] = [];

export function registrarEra(p: PacoteDeEra): void {
  PACOTES.set(p.pais, p);
  for (const f of ouvintes) f(p);
}
/** Quem precisa saber de um pacote novo (a tabela de símbolos das moedas). */
export const aoRegistrarEra = (f: (p: PacoteDeEra) => void) => { ouvintes.push(f); for (const p of PACOTES.values()) f(p); };
export const pacoteDaEra = (pais: string): PacoteDeEra | undefined => PACOTES.get(pais);
export const temPacoteDeEra = (pais: string) => pais === 'BR' || PACOTES.has(pais);
export const pacotesDeEra = (): PacoteDeEra[] => [...PACOTES.values()];

/* ------------------------------------------------------------------ Leitura das séries */

/** O valor da série no ano (o mais próximo dentro dela). */
export function naSerie(s: SerieDaEpoca, arr: readonly (number | null)[], ano: number): number | null {
  const i = Math.max(0, Math.min(arr.length - 1, ano - s.T0));
  return arr[i];
}

/** O nível de preços do mês (÷ média de 2025): o mensal quando há; senão, geométrico entre os meios dos anos. */
export function nivelMensal(s: SerieDaEpoca, t: number): number {
  const im = t - s.MENSAL_T0;
  if (s.MENSAL.length && im >= 0 && im < s.MENSAL.length) return s.MENSAL[im];
  const ultimo = s.T0 + s.PRECOS.length - 1;
  if (t >= ultimo * 12 + 6) return s.PRECOS[s.PRECOS.length - 1];
  if (t <= s.T0 * 12 + 6) return s.PRECOS[0];
  const x = (t - 6) / 12;
  const a = Math.floor(x), f = x - a;
  const pa = s.PRECOS[a - s.T0], pb = s.PRECOS[a + 1 - s.T0];
  return Math.exp(Math.log(pa) * (1 - f) + Math.log(pb) * f);
}

/** A moeda que circulava no mês (no lado do país, quando dividido). */
export function moedaNoMes(p: PacoteDeEra, t: number, lado: LadoDaDivisao = 'oeste'): MoedaDaEpoca {
  let m = p.moedas[0];
  for (const x of p.moedas) if (t >= x.desde && (!x.lado || x.lado === lado)) m = x;
  return m;
}

/** O lado de quem mora na divisão no mês (fora do período da divisão: 'oeste', o país inteiro). */
export function ladoNoMes(p: PacoteDeEra, divisao: string | undefined, t: number, partilhaSemente = 0.5): LadoDaDivisao {
  const d = p.divisao;
  if (!d || !divisao) return 'oeste';
  const ini = d.de[0] * 12 + d.de[1] - 1, fim = d.ate[0] * 12 + d.ate[1] - 1;
  if (t < ini || t >= fim) return 'oeste';
  if (d.leste.includes(divisao)) return 'leste';
  const parte = d.partilhada?.[divisao];
  return parte !== undefined && partilhaSemente < parte ? 'leste' : 'oeste';
}
