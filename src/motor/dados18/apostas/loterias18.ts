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
 * Cada aposta com mais dezenas que o mínimo vale por todas as combinações simples que contém (é assim que o preço e o
 * prêmio são calculados de verdade).
 */

export type LoteriaId = 'mega' | 'lotofacil' | 'quina' | 'lotomania' | 'duplasena' | 'loteca';

export interface FaixaLoteria { acertos: number; nome: string; pct?: number; fixo?: number; sorteio?: 1 | 2 }

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
}

/** A parte da arrecadação que vira prêmio bruto (o resto: repasses sociais, custeio, tributos). */
export const PREMIO_BRUTO = 0.4335;

export const LOTERIAS18: Record<LoteriaId, Loteria18> = {
  mega: { id: 'mega', nome: 'Mega-Sena', universo: 60, sorteia: 6, min: 6, max: 15, preco: 6, porAno: 156, arrecadacao: 60_000_000, inicial: 3_500_000, acumula: 6, dias: 'terças, quintas e sábados',
    faixas: [{ acertos: 6, nome: 'sena', pct: 0.40 }, { acertos: 5, nome: 'quina', pct: 0.13 }, { acertos: 4, nome: 'quadra', pct: 0.15 }] },
  lotofacil: { id: 'lotofacil', nome: 'Lotofácil', universo: 25, sorteia: 15, min: 15, max: 20, preco: 3.5, porAno: 312, arrecadacao: 28_000_000, inicial: 1_800_000, acumula: 15, dias: 'de segunda a sábado',
    faixas: [{ acertos: 15, nome: '15 acertos', pct: 0.62 }, { acertos: 14, nome: '14 acertos', pct: 0.13 }, { acertos: 13, nome: '13 acertos', fixo: 35 }, { acertos: 12, nome: '12 acertos', fixo: 14 }, { acertos: 11, nome: '11 acertos', fixo: 7 }] },
  quina: { id: 'quina', nome: 'Quina', universo: 80, sorteia: 5, min: 5, max: 15, preco: 3, porAno: 312, arrecadacao: 15_000_000, inicial: 700_000, acumula: 5, dias: 'de segunda a sábado',
    faixas: [{ acertos: 5, nome: 'quina', pct: 0.35 }, { acertos: 4, nome: 'quadra', pct: 0.15 }, { acertos: 3, nome: 'terno', pct: 0.10 }, { acertos: 2, nome: 'duque', pct: 0.10 }] },
  lotomania: { id: 'lotomania', nome: 'Lotomania', universo: 100, doZero: true, sorteia: 20, min: 50, max: 50, preco: 3, porAno: 156, arrecadacao: 6_000_000, inicial: 500_000, acumula: 20, dias: 'segundas, quartas e sextas',
    faixas: [{ acertos: 20, nome: '20 acertos', pct: 0.45 }, { acertos: 19, nome: '19 acertos', pct: 0.12 }, { acertos: 18, nome: '18 acertos', pct: 0.07 }, { acertos: 17, nome: '17 acertos', pct: 0.07 }, { acertos: 16, nome: '16 acertos', pct: 0.07 }, { acertos: 15, nome: '15 acertos', pct: 0.07 }, { acertos: 0, nome: 'nenhum acerto', pct: 0.08 }] },
  duplasena: { id: 'duplasena', nome: 'Dupla Sena', universo: 50, sorteia: 6, min: 6, max: 15, preco: 3, porAno: 156, arrecadacao: 4_000_000, inicial: 300_000, acumula: 6, duasVezes: true, dias: 'segundas, quartas e sextas',
    faixas: [
      { acertos: 6, nome: 'sena (1º sorteio)', pct: 0.30, sorteio: 1 }, { acertos: 5, nome: 'quina (1º sorteio)', pct: 0.09, sorteio: 1 }, { acertos: 4, nome: 'quadra (1º sorteio)', pct: 0.09, sorteio: 1 }, { acertos: 3, nome: 'terno (1º sorteio)', pct: 0.07, sorteio: 1 },
      { acertos: 6, nome: 'sena (2º sorteio)', pct: 0.11, sorteio: 2 }, { acertos: 5, nome: 'quina (2º sorteio)', pct: 0.09, sorteio: 2 }, { acertos: 4, nome: 'quadra (2º sorteio)', pct: 0.09, sorteio: 2 }, { acertos: 3, nome: 'terno (2º sorteio)', pct: 0.07, sorteio: 2 }
    ] },
  loteca: { id: 'loteca', nome: 'Loteca', universo: 14, sorteia: 14, min: 14, max: 14, preco: 2, porAno: 52, arrecadacao: 2_000_000, inicial: 400_000, acumula: 14, dias: 'semanal (a rodada do fim de semana)',
    faixas: [{ acertos: 14, nome: '14 acertos', pct: 0.70 }, { acertos: 13, nome: '13 acertos', pct: 0.10 }] }
};

/** O bolão da lotérica: quantos jogos, de quantas dezenas, divididos em quantas cotas (a tarifa de serviço é de até 35%). */
export const BOLOES18: Record<LoteriaId, { jogos: number; dezenas: number; cotas: number }> = {
  mega: { jogos: 10, dezenas: 8, cotas: 25 },
  lotofacil: { jogos: 10, dezenas: 17, cotas: 20 },
  quina: { jogos: 10, dezenas: 8, cotas: 20 },
  duplasena: { jogos: 8, dezenas: 8, cotas: 20 },
  lotomania: { jogos: 20, dezenas: 50, cotas: 10 },
  loteca: { jogos: 1, dezenas: 4, cotas: 12 }
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
