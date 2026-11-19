/**
 * ERAS v3 · QUANTO SE VIVIA — o risco de morrer da época, para o protagonista e para as pessoas do mundo.
 *
 * Os números vêm de `mortalidadeSeries` (expectativa de vida e mortalidade infantil reais por país). Duas regras de jogo,
 * declaradas (APROXIMAÇÃO / ABSTRAÇÃO DE JOGO):
 *   1. A infância do PROTAGONISTA não recebe o risco extra da época: a vida jogada começa (não termina aos dois anos). Os
 *      irmãos, os filhos e as pessoas do mundo recebem o risco inteiro — perder um filho pequeno era parte da vida.
 *   2. No adulto, o protagonista recebe metade do excesso de risco da época (1 + (k − 1) ÷ 2); as pessoas do mundo, o
 *      excesso inteiro. A diferença de expectativa de vida entre épocas continua visível e pesa, sem transformar toda
 *      vida antiga numa vida curta por sorteio.
 * Vida contemporânea, ou depois de 2025: tudo 1/0 (o jogo de sempre).
 */
import { MORTALIDADE_DA_EPOCA, MORTALIDADE_T0 } from './mortalidadeSeries';
import { mesHistoricoCorrente, paisHistoricoCorrente } from './moedas';
import { instituidoAqui } from './sociedade4';

function ponto(arr: readonly number[], ano: number): number {
  const x = (Math.max(MORTALIDADE_T0, Math.min(2025, ano)) - MORTALIDADE_T0) / 5;
  const i = Math.floor(x), f = x - i;
  const a = arr[Math.min(arr.length - 1, i)], b = arr[Math.min(arr.length - 1, i + 1)];
  return a + (b - a) * f;
}

/** A mortalidade da época no país (ou undefined: vida contemporânea, depois da série ou país sem dado). */
export function mortalidadeNoAno(pais: string, ano: number): { adulto: number; crianca: number; e0: number } | undefined {
  const m = MORTALIDADE_DA_EPOCA[pais];
  if (!m || ano > 2025) return undefined;
  return { adulto: ponto(m.adulto, ano), crianca: ponto(m.crianca, ano), e0: ponto(m.e0, ano) };
}

/** Os fatores para a vida histórica em processamento. */
export function fatoresDeMortalidade(protagonista: boolean, idade: number): { adulto: number; crianca: number } {
  const t = mesHistoricoCorrente();
  if (t === null) return { adulto: 1, crianca: 0 };
  const m = mortalidadeNoAno(paisHistoricoCorrente(), Math.floor(t / 12));
  if (!m) return { adulto: 1, crianca: 0 };
  // ERAS v4: a água tratada, o esgoto e o posto de saúde que esta continuidade levou à cidade antes da hora (uma reforma,
  // `sociedade4.instituidoAqui`) cortam o excesso da época — mais na infância. APROXIMAÇÃO [A] a partir de Cutler & Miller
  // (2005): a água tratada explica cerca de metade da queda da mortalidade nas grandes cidades americanas de 1900–1936 e
  // três quartos da queda da mortalidade infantil.
  const saude = instituidoAqui('saude', t);
  const adulto = saude ? 1 + (m.adulto - 1) * 0.75 : m.adulto;
  const crianca = saude ? m.crianca * 0.4 : m.crianca;
  return {
    adulto: protagonista ? 1 + (adulto - 1) / 2 : adulto,
    crianca: protagonista || idade > 4 ? 0 : crianca
  };
}

/**
 * As causas de morte antes dos antibióticos e das vacinas (a penicilina se difunde depois de 1945; as vacinas infantis em
 * massa, nos anos 1950–1970): a tuberculose, a pneumonia, as infecções e as doenças da infância pesavam muito mais.
 * Devolve uma causa da época (ou undefined: fica a causa de sempre). `sorteio` é um número de 0 a 1.
 */
export function causaDaEpoca(idade: number, sorteio: number): string | undefined {
  const t = mesHistoricoCorrente();
  if (t === null) return undefined;
  const ano = Math.floor(t / 12);
  if (ano >= 1960) return undefined;
  const peso = ano < 1945 ? 0.6 : 0.35;
  if (sorteio > peso) return undefined;
  const x = sorteio / peso;
  if (idade <= 4) return x < 0.4 ? 'uma infecção intestinal' : x < 0.65 ? 'pneumonia' : x < 0.85 ? 'difteria' : 'sarampo';
  if (idade <= 14) return x < 0.4 ? 'uma infecção' : x < 0.7 ? 'febre tifoide' : 'pneumonia';
  if (idade <= 60) return x < 0.45 ? 'tuberculose' : x < 0.7 ? 'pneumonia' : x < 0.85 ? 'uma infecção sem remédio na época' : 'febre tifoide';
  return x < 0.5 ? 'pneumonia' : 'tuberculose';
}
