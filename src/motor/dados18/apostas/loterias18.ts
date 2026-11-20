/**
 * VIDA 18 · AS LOTERIAS DA CAIXA, O TURFE E O BINGO — dados puros.
 *
 * Regras conferidas nas fontes públicas (Loterias Caixa, manual de produtos; guias e resultados publicados em 2025–2026).
 * Preços e percentuais mudam por portaria: os daqui são os de referência (2026), arredondados, e ficam num lugar só.
 *
 *   MEGA-SENA    6 a 20 dezenas de 01 a 60 (aqui até 15); sorteio de 6. Faixas: sena, quina, quadra. A sena acumula.
 *   LOTOFÁCIL    15 a 20 dezenas de 01 a 25; sorteio de 15. 11, 12 e 13 acertos pagam valor fixo; 14 e 15, rateio.
 *   QUINA        5 a 15 dezenas de 01 a 80; sorteio de 5. Faixas: quina, quadra, terno, duque.
 *   LOTOMANIA    exatamente 50 dezenas de 00 a 99; sorteio de 20. Faixas: 20, 19, 18, 17, 16, 15 — e 0 acertos.
 *   DUPLA SENA   6 a 15 dezenas de 01 a 50; DOIS sorteios de 6 no mesmo concurso, cada um com sena, quina, quadra e terno.
 *   LOTECA       14 jogos de futebol: 1 (mandante), X (empate) ou 2 (visitante), no tempo regulamentar; duplos e triplos
 *                multiplicam as combinações (R$ 2 cada; a mínima já traz um duplo). Faixas: 14 e 13 acertos.
 *
 *   TIMEMANIA    (desde 2008) exatamente 10 dezenas de 01 a 80 e um TIME DO CORAÇÃO entre 80 clubes; sorteio de 7 dezenas
 *                e de um time. Faixas: 7, 6 e 5 acertos (rateio; a de 7 acumula), 4 e 3 acertos e o time do coração
 *                (valor fixo).
 *   DIA DE SORTE (desde 2018) 7 a 15 dezenas de 01 a 31 e um MÊS DA SORTE; sorteio de 7 dezenas e de um mês. Faixas: 7, 6 e
 *                5 acertos (rateio), 4 acertos e o mês (valor fixo).
 *   SUPER SETE   (desde 2020) sete COLUNAS com os algarismos de 0 a 9: marca-se ao menos um número em cada coluna (até três
 *                por coluna, 21 no total); sorteia-se um algarismo por coluna. Faixas por colunas acertadas: 7, 6, 5 e 4
 *                (rateio), 3 (valor fixo). Mais números numa coluna multiplicam as apostas simples.
 *   +MILIONÁRIA  (desde 2022) 6 a 12 dezenas de 01 a 50 e 2 a 6 TREVOS de 1 a 6; sorteio de 6 dezenas e 2 trevos. Dez
 *                faixas pela combinação de dezenas e trevos: 6+2 (a que acumula), 6+1 ou 6+0, 5+2, 5+1 ou 5+0, 4+2, 4+1 ou
 *                4+0 (rateio); 3+2, 3+1 ou 3+0, 2+2 e 2+1 (valor fixo).
 *
 * Cada aposta com mais dezenas que o mínimo vale por todas as combinações simples que contém (é assim que o preço e o
 * prêmio são calculados de verdade). Cada loteria tem o ano em que começou: antes dele, ela não existe no jogo.
 */

export type LoteriaId = 'mega' | 'lotofacil' | 'quina' | 'lotomania' | 'duplasena' | 'loteca' | 'timemania' | 'diadesorte' | 'supersete' | 'maismilionaria';

export interface FaixaLoteria {
  acertos: number; nome: string; pct?: number; fixo?: number; sorteio?: 1 | 2;
  /** VIDA 29: a chave da faixa quando os acertos sozinhos não bastam (+Milionária: "5+2"; o time do coração: "T"). */
  chave?: string;
  /** VIDA 29 · +Milionária: quantos trevos a faixa aceita (5+1 ou 5+0 → [1, 0]). */
  extras?: number[];
  /** VIDA 29 · a faixa só do extra (o time do coração, o mês da sorte): paga pelo acerto dele, qualquer que seja o resto. */
  soExtra?: boolean;
}

export interface Loteria18 {
  id: LoteriaId;
  nome: string;
  universo: number;
  /** As dezenas começam em 00 (Lotomania) ou em 01. */
  doZero?: boolean;
  sorteia: number;
  min: number;
  max: number;
  /** O preço da aposta simples (R$). */
  preco: number;
  faixas: FaixaLoteria[];
  /** Concursos por ano (para a numeração) e arrecadação média de um concurso sem acúmulo (R$). */
  porAno: number;
  arrecadacao: number;
  /** O prêmio estimado da faixa principal depois que sai (R$). */
  inicial: number;
  /** A faixa que acumula (a principal; na Dupla Sena, a do primeiro sorteio). */
  acumula: number;
  duasVezes?: boolean;
  dias: string;
  /** VIDA 29: o ano do primeiro concurso (antes dele, a loteria não existe). */
  desde: number;
  /** VIDA 29: o que se escolhe além das dezenas — o time do coração, o mês da sorte, os trevos. */
  extra?: { tipo: 'time' | 'mes' | 'trevo'; nome: string; universo: number; sorteia: number; min: number; max: number };
  /** VIDA 29 · Super Sete: colunas de algarismos (0–9) em vez de um universo de dezenas; até `porColuna` números por coluna. */
  colunas?: { n: number; porColuna: number };
}

/** A parte da arrecadação que vira prêmio bruto (o resto: repasses sociais, custeio, tributos). */
export const PREMIO_BRUTO = 0.4335;

export const LOTERIAS18: Record<LoteriaId, Loteria18> = {
  mega: { id: 'mega', nome: 'Mega-Sena', universo: 60, sorteia: 6, min: 6, max: 15, preco: 6, porAno: 156, arrecadacao: 60_000_000, inicial: 3_500_000, acumula: 6, desde: 1996, dias: 'terças, quintas e sábados',
    faixas: [{ acertos: 6, nome: 'sena', pct: 0.40 }, { acertos: 5, nome: 'quina', pct: 0.13 }, { acertos: 4, nome: 'quadra', pct: 0.15 }] },
  lotofacil: { id: 'lotofacil', nome: 'Lotofácil', universo: 25, sorteia: 15, min: 15, max: 20, preco: 3.5, porAno: 312, arrecadacao: 28_000_000, inicial: 1_800_000, acumula: 15, desde: 2003, dias: 'de segunda a sábado',
    faixas: [{ acertos: 15, nome: '15 acertos', pct: 0.62 }, { acertos: 14, nome: '14 acertos', pct: 0.13 }, { acertos: 13, nome: '13 acertos', fixo: 35 }, { acertos: 12, nome: '12 acertos', fixo: 14 }, { acertos: 11, nome: '11 acertos', fixo: 7 }] },
  quina: { id: 'quina', nome: 'Quina', universo: 80, sorteia: 5, min: 5, max: 15, preco: 3, porAno: 312, arrecadacao: 15_000_000, inicial: 700_000, acumula: 5, desde: 1994, dias: 'de segunda a sábado',
    faixas: [{ acertos: 5, nome: 'quina', pct: 0.35 }, { acertos: 4, nome: 'quadra', pct: 0.15 }, { acertos: 3, nome: 'terno', pct: 0.10 }, { acertos: 2, nome: 'duque', pct: 0.10 }] },
  lotomania: { id: 'lotomania', nome: 'Lotomania', universo: 100, doZero: true, sorteia: 20, min: 50, max: 50, preco: 3, porAno: 156, arrecadacao: 6_000_000, inicial: 500_000, acumula: 20, desde: 1999, dias: 'segundas, quartas e sextas',
    faixas: [{ acertos: 20, nome: '20 acertos', pct: 0.45 }, { acertos: 19, nome: '19 acertos', pct: 0.12 }, { acertos: 18, nome: '18 acertos', pct: 0.07 }, { acertos: 17, nome: '17 acertos', pct: 0.07 }, { acertos: 16, nome: '16 acertos', pct: 0.07 }, { acertos: 15, nome: '15 acertos', pct: 0.07 }, { acertos: 0, nome: 'nenhum acerto', pct: 0.08 }] },
  duplasena: { id: 'duplasena', nome: 'Dupla Sena', universo: 50, sorteia: 6, min: 6, max: 15, preco: 3, porAno: 156, arrecadacao: 4_000_000, inicial: 300_000, acumula: 6, duasVezes: true, desde: 2001, dias: 'segundas, quartas e sextas',
    faixas: [
      { acertos: 6, nome: 'sena (1º sorteio)', pct: 0.30, sorteio: 1 }, { acertos: 5, nome: 'quina (1º sorteio)', pct: 0.09, sorteio: 1 }, { acertos: 4, nome: 'quadra (1º sorteio)', pct: 0.09, sorteio: 1 }, { acertos: 3, nome: 'terno (1º sorteio)', pct: 0.07, sorteio: 1 },
      { acertos: 6, nome: 'sena (2º sorteio)', pct: 0.11, sorteio: 2 }, { acertos: 5, nome: 'quina (2º sorteio)', pct: 0.09, sorteio: 2 }, { acertos: 4, nome: 'quadra (2º sorteio)', pct: 0.09, sorteio: 2 }, { acertos: 3, nome: 'terno (2º sorteio)', pct: 0.07, sorteio: 2 }
    ] },
  loteca: { id: 'loteca', nome: 'Loteca', universo: 14, sorteia: 14, min: 14, max: 14, preco: 2, porAno: 52, arrecadacao: 2_000_000, inicial: 400_000, acumula: 14, desde: 1970, dias: 'semanal (a rodada do fim de semana)',
    faixas: [{ acertos: 14, nome: '14 acertos', pct: 0.70 }, { acertos: 13, nome: '13 acertos', pct: 0.10 }] },
  timemania: { id: 'timemania', nome: 'Timemania', universo: 80, sorteia: 7, min: 10, max: 10, preco: 3.5, porAno: 156, arrecadacao: 7_000_000, inicial: 2_000_000, acumula: 7, desde: 2008, dias: 'terças, quintas e sábados',
    extra: { tipo: 'time', nome: 'time do coração', universo: 80, sorteia: 1, min: 1, max: 1 },
    faixas: [{ acertos: 7, nome: '7 acertos', pct: 0.40 }, { acertos: 6, nome: '6 acertos', pct: 0.20 }, { acertos: 5, nome: '5 acertos', pct: 0.20 }, { acertos: 4, nome: '4 acertos', fixo: 9 }, { acertos: 3, nome: '3 acertos', fixo: 3 }, { acertos: 0, chave: 'T', soExtra: true, nome: 'time do coração', fixo: 7.5 }] },
  diadesorte: { id: 'diadesorte', nome: 'Dia de Sorte', universo: 31, sorteia: 7, min: 7, max: 15, preco: 2.5, porAno: 156, arrecadacao: 6_000_000, inicial: 1_000_000, acumula: 7, desde: 2018, dias: 'terças, quintas e sábados',
    extra: { tipo: 'mes', nome: 'mês da sorte', universo: 12, sorteia: 1, min: 1, max: 1 },
    faixas: [{ acertos: 7, nome: '7 acertos', pct: 0.40 }, { acertos: 6, nome: '6 acertos', pct: 0.20 }, { acertos: 5, nome: '5 acertos', pct: 0.20 }, { acertos: 4, nome: '4 acertos', fixo: 5 }, { acertos: 0, chave: 'M', soExtra: true, nome: 'mês da sorte', fixo: 2.5 }] },
  supersete: { id: 'supersete', nome: 'Super Sete', universo: 70, sorteia: 7, min: 7, max: 21, preco: 3, porAno: 156, arrecadacao: 3_000_000, inicial: 1_000_000, acumula: 7, desde: 2020, dias: 'segundas, quartas e sextas',
    colunas: { n: 7, porColuna: 3 },
    faixas: [{ acertos: 7, nome: '7 colunas', pct: 0.40 }, { acertos: 6, nome: '6 colunas', pct: 0.15 }, { acertos: 5, nome: '5 colunas', pct: 0.15 }, { acertos: 4, nome: '4 colunas', pct: 0.15 }, { acertos: 3, nome: '3 colunas', fixo: 6 }] },
  maismilionaria: { id: 'maismilionaria', nome: '+Milionária', universo: 50, sorteia: 6, min: 6, max: 12, preco: 6, porAno: 104, arrecadacao: 15_000_000, inicial: 10_000_000, acumula: 6, desde: 2022, dias: 'quartas e sábados',
    extra: { tipo: 'trevo', nome: 'trevos', universo: 6, sorteia: 2, min: 2, max: 6 },
    faixas: [
      { acertos: 6, chave: '6+2', extras: [2], nome: '6 acertos + 2 trevos', pct: 0.35 }, { acertos: 6, chave: '6+1', extras: [1, 0], nome: '6 acertos + 1 ou nenhum trevo', pct: 0.10 },
      { acertos: 5, chave: '5+2', extras: [2], nome: '5 acertos + 2 trevos', pct: 0.06 }, { acertos: 5, chave: '5+1', extras: [1, 0], nome: '5 acertos + 1 ou nenhum trevo', pct: 0.06 },
      { acertos: 4, chave: '4+2', extras: [2], nome: '4 acertos + 2 trevos', pct: 0.06 }, { acertos: 4, chave: '4+1', extras: [1, 0], nome: '4 acertos + 1 ou nenhum trevo', pct: 0.06 },
      { acertos: 3, chave: '3+2', extras: [2], nome: '3 acertos + 2 trevos', fixo: 50 }, { acertos: 3, chave: '3+1', extras: [1, 0], nome: '3 acertos + 1 ou nenhum trevo', fixo: 24 },
      { acertos: 2, chave: '2+2', extras: [2], nome: '2 acertos + 2 trevos', fixo: 12 }, { acertos: 2, chave: '2+1', extras: [1], nome: '2 acertos + 1 trevo', fixo: 6 }
    ] }
};

/** VIDA 29: os meses do Dia de Sorte (o número do mês é o índice + 1). */
export const MESES_DA_SORTE = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

/**
 * VIDA 19 · A MEGA DA VIRADA — o concurso especial do fim do ano é o último concurso da Mega-Sena do ano (a mesma
 * numeração, as mesmas dezenas e regras de aposta). O que muda (regras da Caixa a partir de 2025, conferidas em
 * sbtnews.sbt.com.br "Mega da Virada 2025: novidades no rateio" e dci.com.br "Como funciona a Mega da Virada"):
 *   - cada concurso regular do ano separa 10% do prêmio para a reserva da Virada (era 5% até 2024) — aqui, tirado da
 *     parte do prêmio bruto que já não ia para as faixas do concurso regular (os prêmios regulares não mudam);
 *   - o prêmio da Virada NÃO acumula: sem ganhador da sena, o valor vai para a quina; sem quina, para a quadra;
 *   - divisão: 90% sena, 5% quina, 5% quadra;
 *   - a arrecadação do concurso especial é dezenas de vezes a de um concurso comum (R$ 1 bilhão estimado em 2025).
 */
export const VIRADA18 = { sena: 0.90, quina: 0.05, quadra: 0.05, reserva: 0.10, arrecadacao: 40 } as const;

/** O bolão da lotérica: quantos jogos, de quantas dezenas, divididos em quantas cotas (a tarifa de serviço é de até 35%). */
export const BOLOES18: Record<LoteriaId, { jogos: number; dezenas: number; cotas: number }> = {
  mega: { jogos: 10, dezenas: 8, cotas: 25 },
  lotofacil: { jogos: 10, dezenas: 17, cotas: 20 },
  quina: { jogos: 10, dezenas: 8, cotas: 20 },
  duplasena: { jogos: 8, dezenas: 8, cotas: 20 },
  lotomania: { jogos: 20, dezenas: 50, cotas: 10 },
  loteca: { jogos: 1, dezenas: 4, cotas: 12 },
  timemania: { jogos: 10, dezenas: 10, cotas: 10 },
  diadesorte: { jogos: 10, dezenas: 8, cotas: 15 },
  supersete: { jogos: 10, dezenas: 8, cotas: 10 },
  maismilionaria: { jogos: 6, dezenas: 7, cotas: 15 }
};
export const TARIFA_BOLAO = 0.35;

/* ------------------------------------------------------------------ Turfe */

export interface Hipodromo18 { id: string; nome: string; cidade: string; pais: string; pista: 'grama' | 'areia'; dias: string }

/** Os hipódromos do Brasil com corridas regulares (Lei 7.291/1984: a aposta é do próprio Jockey Club, em sistema de bolsa). */
export const HIPODROMOS18: Hipodromo18[] = [
  { id: 'gavea', nome: 'Hipódromo da Gávea', cidade: 'Rio de Janeiro', pais: 'BR', pista: 'grama', dias: 'sextas, sábados, domingos e segundas' },
  { id: 'cidade_jardim', nome: 'Hipódromo de Cidade Jardim', cidade: 'São Paulo', pais: 'BR', pista: 'areia', dias: 'sábados, domingos e segundas' },
  { id: 'cristal', nome: 'Hipódromo do Cristal', cidade: 'Porto Alegre', pais: 'BR', pista: 'areia', dias: 'sextas' },
  { id: 'taruma', nome: 'Hipódromo do Tarumã', cidade: 'Curitiba', pais: 'BR', pista: 'areia', dias: 'sábados' },
  { id: 'local', nome: 'o hipódromo da região', cidade: '', pais: '*', pista: 'grama', dias: 'fins de semana' }
];

/** O desconto da bolsa (a parte que fica com o hipódromo e os prêmios dos proprietários), sobre cada aposta. */
export const DESCONTO_TURFE = 0.3;
/** O prêmio de uma corrida comum aos proprietários (R$): 1º a 5º (o "Grande Prêmio" paga dez vezes isso). */
export const PREMIOS_TURFE = [24000, 7600, 4000, 2400, 1200];
export const INSCRICAO_TURFE = 900;

export const CAVALOS18 = [
  'Bom Presságio', 'Rei do Prado', 'Vento Norte', 'Dama da Noite', 'Ouro Velho', 'Pé de Vento', 'Sabiá', 'Céu Aberto', 'Fogo Cruzado', 'Rio Grande',
  'Senhor do Tempo', 'Pampa Azul', 'Flor de Lis', 'Capitão', 'Bandoleiro', 'Marajá', 'Luz do Sol', 'Corisco', 'Zé do Brejo', 'Princesa Isabel',
  'Jaguar', 'Gavião', 'Andaluz', 'Boêmio', 'Galope Real', 'Tucano', 'Serenata', 'Mascate', 'Pirata', 'Rosa dos Ventos', 'Malandro', 'Imperador',
  'Juriti', 'Quero-Quero', 'Barão', 'Graúna', 'Sertão', 'Aracati', 'Minuano', 'Vaqueiro'
];
export const JOQUEIS18 = ['A. Silva', 'J. Ricardo', 'M. Gonçalves', 'L. Henrique', 'V. Leal', 'C. Lavor', 'F. Pereira', 'H. Fernandes', 'E. Duarte', 'R. Freire', 'T. Monteiro', 'B. Queiroz'];
export const DISTANCIAS18 = [1000, 1200, 1300, 1400, 1600, 1800, 2000, 2400];

/* ------------------------------------------------------------------ Bingo */

/** Bingo de 75 bolas (cartela 5×5 com a casa livre no centro): B 1–15, I 16–30, N 31–45, G 46–60, O 61–75. */
export const BINGO_BOLAS = 75;
/** A parte da venda de cartelas que vira prêmio: a primeira linha completa (a "quina") e a cartela cheia. */
export const BINGO_PREMIO = { linha: 0.2, cheia: 0.45 };
