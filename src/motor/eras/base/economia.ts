/**
 * ERAS HISTÓRICAS · A ECONOMIA DA ÉPOCA — quanto se ganhava e quanto as coisas custavam, em poder de compra de hoje.
 *
 * O motor conta em reais de hoje (deflacionados pelo IPCA geral: `moedas`). Por isso, numa vida histórica, "o mesmo preço"
 * já é automático para a cesta média de consumo — o que muda de uma época para outra são:
 *
 *   1. O NÍVEL DE RENDA: o rendimento médio real do trabalho era menor (61% do de 2025 em 1985; 82% em 1995; 67% em 2004).
 *      Série oficial encadeada (PNAD e PNAD Contínua; anos 1980 por aproximação: `economiaSeries`).
 *   2. A DISTRIBUIÇÃO DOS SALÁRIOS: o mínimo seguiu a sua própria série (bem abaixo da média nos anos 1990) e o salário de
 *      quem tinha diploma pesava mais. Uma ocupação ganha, na época, pela posição dela na escala de hoje:
 *        - até 1 mínimo de hoje: acompanha o mínimo real da época (série oficial);
 *        - na média (≈ 2,25 mínimos, PNAD Contínua 2025): acompanha a renda média da época;
 *        - de 10 mínimos para cima: a renda média × o PRÊMIO DE QUALIFICAÇÃO da época;
 *        - entre os pontos, a interpolação em escala logarítmica.
 *      APROXIMAÇÃO DOCUMENTADA (prêmio): 1,25 até 1995, caindo em linha reta até 1,0 em 2015 — a queda do diferencial de
 *      salário por escolaridade no Brasil entre meados dos anos 1990 e meados dos 2010 (PNAD; ver docs/eras/FONTES.md).
 *   3. OS PREÇOS RELATIVOS: roupa, móvel e eletrodoméstico custavam proporcionalmente mais; comida, menos (IPCA por grupo).
 *
 * Vida contemporânea, ou depois de dez/2025: todos os fatores são 1 (o jogo de sempre).
 */

import { RENDA_REAL, PRECO_RELATIVO, CESTA_SP } from './economiaSeries';
import { mesHistoricoCorrente, mesHistoricoNoBrasil, salarioMinimoReal, FIM_DA_SERIE, paisHistoricoCorrente, ladoHistoricoCorrente } from './moedas';
import { pacoteDaEra, naSerie } from './pacote';

const anoDe = (t: number) => Math.floor(t / 12);
const PRIMEIRO = 1900;
const ULTIMO = 2025;

/** O mínimo real de 2025 (o último da série) e a posição da renda média e do topo na escala de mínimos de hoje. */
const SM_2025 = 1518;
const SM_HOJE = 1621;
const MEDIA_EM_MINIMOS = 2.25;
const TOPO_EM_MINIMOS = 10;

/** O ano histórico da vida que o motor está processando agora (null: contemporânea ou depois da série). */
export function anoEconomicoCorrente(): number | null {
  // ERAS v3: as séries desta seção (PNAD, IPCA por grupo, mínimo, cesta do DIEESE) são do Brasil — só valem numa vida
  // histórica brasileira. Os outros países têm a renda deles (`rendaDaEpocaNoPais`) e os preços relativos de hoje.
  const t = mesHistoricoNoBrasil();
  if (t === null || t > FIM_DA_SERIE) return null;
  return anoDe(t);
}

function serie(s: Readonly<Record<number, number>>, ano: number): number {
  const a = Math.max(PRIMEIRO, Math.min(ULTIMO, ano));
  if (s[a] !== undefined) return s[a];
  // Ano faltando: o mais próximo para trás, depois para a frente.
  for (let d = 1; d < 50; d++) { if (s[a - d] !== undefined) return s[a - d]; if (s[a + d] !== undefined) return s[a + d]; }
  return 1;
}

/** O rendimento médio real do trabalho no ano ÷ o de 2025. */
export const rendaDaEpoca = (ano: number): number => (ano > ULTIMO ? 1 : serie(RENDA_REAL, ano));

/** O prêmio de qualificação do ano (APROXIMAÇÃO: ver o cabeçalho). */
export function premioDeQualificacao(ano: number): number {
  if (ano <= 1995) return 1.25;
  if (ano >= 2015) return 1;
  return 1.25 - 0.25 * (ano - 1995) / 20;
}

/** O mínimo real médio do ano ÷ o de 2025. */
export function minimoDaEpoca(ano: number): number {
  if (ano > ULTIMO) return 1;
  let soma = 0, n = 0;
  for (let m = 0; m < 12; m++) { const x = salarioMinimoReal(Math.max(PRIMEIRO, ano) * 12 + m); if (x !== undefined) { soma += x; n++; } }
  // ERAS v3: antes de julho de 1940 não havia salário mínimo (Decreto-Lei 2.162/1940): o piso acompanha a renda média.
  return n ? soma / n / SM_2025 : rendaDaEpoca(ano);
}

const memo = new Map<string, number>();
/**
 * O fator do salário de uma ocupação no ano: `salarioDeHoje` (unidades do motor, na escala de 2026) × fator = o salário
 * da mesma ocupação naquele ano, em poder de compra de hoje.
 */
export function fatorSalarial(ano: number, salarioDeHoje: number): number {
  if (ano > ULTIMO) return 1;
  const s = Math.max(0.1, salarioDeHoje / SM_HOJE);
  const k = `${ano}:${Math.round(Math.log(s) * 50)}`;
  const m = memo.get(k);
  if (m !== undefined) return m;
  const fSM = minimoDaEpoca(ano), fMed = rendaDaEpoca(ano), fTopo = fMed * premioDeQualificacao(ano);
  const ln = Math.log;
  let f: number;
  if (s <= 1) f = fSM;
  else if (s <= MEDIA_EM_MINIMOS) { const x = ln(s) / ln(MEDIA_EM_MINIMOS); f = Math.exp(ln(fSM) * (1 - x) + ln(fMed) * x); }
  else if (s <= TOPO_EM_MINIMOS) { const x = (ln(s) - ln(MEDIA_EM_MINIMOS)) / (ln(TOPO_EM_MINIMOS) - ln(MEDIA_EM_MINIMOS)); f = Math.exp(ln(fMed) * (1 - x) + ln(fTopo) * x); }
  else f = fTopo;
  memo.set(k, f);
  return f;
}

/* ------------------------------------------------------------------ Os preços relativos */

export type CategoriaDePreco = keyof typeof PRECO_RELATIVO;

/** O preço da categoria no ano ÷ o de hoje (em poder de compra). Fora da série: 1. */
export function precoRelativo(cat: CategoriaDePreco, ano: number): number {
  if (ano > ULTIMO) return 1;
  const s = PRECO_RELATIVO[cat];
  if (!s) return 1;
  return serie(s, Math.max(s._desde, ano));
}

/** Atalho para o motor: o fator da categoria na vida histórica em processamento (1 na contemporânea). */
export function precoDaEpoca(cat: CategoriaDePreco): number {
  const a = anoEconomicoCorrente();
  return a === null ? 1 : precoRelativo(cat, a);
}

/** Atalho para o motor: o nível de renda da vida histórica em processamento (1 na contemporânea). */
export function rendaDaEpocaCorrente(): number {
  const a = anoEconomicoCorrente();
  return a === null ? 1 : rendaDaEpoca(a);
}

/** Atalho para o motor: o fator da DISTRIBUIÇÃO (fatorSalarial ÷ renda média) para um salário de hoje. */
export function ajusteDaDistribuicao(salarioDeHoje: number): number {
  const a = anoEconomicoCorrente();
  if (a === null) return 1;
  return fatorSalarial(a, salarioDeHoje) / rendaDaEpoca(a);
}

/* ------------------------------------------------------------------ O poder de compra (para o painel e o texto) */

/** A cesta básica do DIEESE em São Paulo no ano (unidades do motor), ou undefined fora da série. */
export const cestaBasica = (ano: number): number | undefined => (ano >= PRIMEIRO && ano <= ULTIMO ? CESTA_SP[ano] : undefined);

export interface PoderDeCompra {
  ano: number;
  /** A cesta básica em % do salário mínimo do ano. */
  cestaNoMinimo?: number;
  /** A renda média da época ÷ a de hoje. */
  renda: number;
  /** Quanto o mínimo da época vale perto do de hoje. */
  minimo: number;
  /** Os preços relativos que mais mudaram (para o texto do painel). */
  destaques: { cat: CategoriaDePreco; nome: string; fator: number }[];
}

const NOMES: Partial<Record<CategoriaDePreco, string>> = {
  roupas: 'roupa e calçado', eletrodomesticos: 'eletrodomésticos', moveis: 'móveis', alimentacao: 'comida do mercado',
  aluguel: 'aluguel', plano_saude: 'plano de saúde', passagem_aerea: 'passagem de avião', onibus: 'ônibus', domestica: 'trabalho doméstico',
  comunicacao: 'telefone e comunicação', gasolina: 'gasolina'
};

export function poderDeCompra(ano: number): PoderDeCompra {
  const cesta = cestaBasica(ano);
  const min = minimoDaEpoca(ano) * SM_2025;
  const destaques = (Object.keys(NOMES) as CategoriaDePreco[])
    .map(cat => ({ cat, nome: NOMES[cat]!, fator: precoRelativo(cat, ano) }))
    .filter(d => Math.abs(Math.log(d.fator)) >= Math.log(1.2))
    .sort((a, b) => Math.abs(Math.log(b.fator)) - Math.abs(Math.log(a.fator)))
    .slice(0, 4);
  return { ano, ...(cesta !== undefined ? { cestaNoMinimo: Math.round(cesta / min * 100) } : {}), renda: rendaDaEpoca(ano), minimo: minimoDaEpoca(ano), destaques };
}

/** A categoria de produto das lojas (`dados/lojas`) → o grupo de preço do IPCA. As demais: o nível geral (1). */
const CATEGORIA_DA_LOJA: Readonly<Record<string, CategoriaDePreco>> = {
  vestuario: 'roupas', calcados: 'roupas', acessorios: 'roupas', joias: 'joias', relogios: 'joias',
  eletronicos: 'eletrodomesticos', eletrodomesticos: 'eletrodomesticos', moveis: 'moveis'
};
/** O fator da categoria de loja na vida histórica em processamento (1 na contemporânea ou sem categoria). */
export function precoDaCategoriaNaEpoca(cat: string | undefined): number {
  const c = cat ? CATEGORIA_DA_LOJA[cat] : undefined;
  return c ? precoDaEpoca(c) : 1;
}

/* ------------------------------------------------------------------ ERAS v3 · os outros países */

/**
 * O nível de renda do ano num país com pacote de época (PIB real per capita do ano ÷ o de 2025 — APROXIMAÇÃO, o mesmo
 * método que o Brasil usa antes de 1992). Do lado leste do país dividido, a fração da renda do oeste (`divisao.rendaLeste`).
 * Fora de uma vida histórica, ou num país sem pacote (ou o Brasil, que tem as suas séries): 1.
 */
export function rendaDaEpocaNoPais(pais: string): number {
  const t = mesHistoricoCorrente();
  if (t === null || pais === 'BR' || t > FIM_DA_SERIE) return 1;
  const p = pacoteDaEra(pais);
  if (!p) return 1;
  const r = naSerie(p.serie, p.serie.RENDA, Math.floor(t / 12)) ?? 1;
  return pais === paisHistoricoCorrente() && ladoHistoricoCorrente() === 'leste' && p.divisao ? r * p.divisao.rendaLeste : r;
}

/** O desemprego do ano no país (%), ou undefined sem dado. */
export function desempregoDoAno(pais: string, ano: number): number | undefined {
  const p = pacoteDaEra(pais);
  return p ? naSerie(p.serie, p.serie.DESEMPREGO, ano) ?? undefined : undefined;
}
