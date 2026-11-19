import { mesHistoricoCorrente, salarioMinimoReal } from '../eras/base/moedas';
import { pacoteDaEra } from '../eras/base/pacote';
import { rendaDaEpocaNoPais } from '../eras/base/economia';
/**
 * A economia de cada país em unidades do motor (o real de poder de compra
 * brasileiro — `mundo/moeda`). O perfil escreve os números legais na moeda
 * local (o salário mínimo, o teto da previdência, a faixa isenta do imposto);
 * aqui eles viram a unidade com que o motor conta.
 */

import { PAIS_PADRAO, paisDoCatalogo, perfilDoPais, temPerfil } from './registro';
import { daMoedaLocal, daMoedaLocalDeHoje } from './moeda';

const perfil = (pais: string) => perfilDoPais(temPerfil(pais) ? pais : PAIS_PADRAO);

/** A renda do país em relação à do Brasil (PIB per capita em PPC). */
export const rendaRelativa = (pais: string): number => paisDoCatalogo(pais).economia?.renda ?? 1;

/**
 * O nível de SALÁRIO do país em relação ao Brasil, para a mesma ocupação.
 * Não é a razão do PIB per capita inteira: para o mesmo cargo, a diferença
 * de salário entre países é menor que a de PIB (o PIB inclui a renda do
 * capital, e o Brasil é muito desigual — o salário típico fica bem abaixo da
 * média). Calibração do jogo: renda ^ 0,75 — um enfermeiro nos EUA ganha, em
 * poder de compra, ~2,7× o do Brasil (e não 3,9×); na Nigéria, ~0,5×.
 */
export const nivelSalarial = (pais: string): number => Math.pow(rendaRelativa(pais), 0.75);

/** Um valor de renda "brasileiro" (uma aposentadoria típica, um bico) levado ao nível de renda do país. */
export const rendaNoPais = (pais: string, valorNoBrasil: number): number =>
  (pais === PAIS_PADRAO ? valorNoBrasil : Math.round(valorNoBrasil * nivelSalarial(pais) / 10) * 10);

/**
 * Um valor legal do perfil (moeda local por mês) na unidade do motor. ERAS v3: os perfis escrevem na moeda de HOJE —
 * numa vida histórica a conversão continua a de hoje (a moeda da época é só da tela).
 */
const local = (pais: string, valor: number) => (pais === PAIS_PADRAO ? valor : daMoedaLocalDeHoje(valor, pais));

/**
 * O salário mínimo do país, na unidade do motor. Sem mínimo nacional, o
 * piso de fato do mercado: metade da renda de um trabalhador comum do país.
 */
export function salarioMinimoDoPais(pais: string): number {
  // ERAS HISTÓRICAS: numa vida histórica no Brasil, o mínimo vigente no mês (série oficial, em poder de compra de hoje).
  const mh = pais === 'BR' ? mesHistoricoCorrente() : null;
  const real = mh !== null ? salarioMinimoReal(mh) : undefined;
  if (real !== undefined) return Math.round(real);
  // ERAS v3: num país com pacote de época, o mínimo legal vigente no mês (nominal → motor pela moeda do mês); sem lei de
  // mínimo naquele tempo, o piso de fato do mercado na renda da época.
  const pk = mh === null ? pacoteDaEra(pais) : undefined;
  const mhp = pk ? mesHistoricoCorrente() : null;
  if (pk && mhp !== null && mhp < 2026 * 12) {
    let nominal: number | undefined;
    for (const [desde, valor] of pk.salarioMinimo ?? []) if (desde <= mhp) nominal = valor;
    if (nominal !== undefined) return Math.round(daMoedaLocal(nominal, pais));
    return Math.round(rendaNoPais(pais, 1620) * 0.9 * rendaDaEpocaNoPais(pais));
  }
  const m = perfil(pais).economia.salarioMinimo;
  return Math.round(m !== undefined ? local(pais, m) : rendaNoPais(pais, 1620) * 0.9);
}

/** Teto da contribuição (unidade do motor; Infinity sem teto) e faixa isenta do imposto de renda. */
export function parametrosFiscais(pais: string) {
  const t = perfil(pais).trabalho;
  return {
    aliquota: t.contribuicao.aliquota,
    teto: t.contribuicao.teto !== undefined ? local(pais, t.contribuicao.teto) : Infinity,
    isencao: local(pais, t.impostoRenda.isencao),
    marginal: t.impostoRenda.aliquota
  };
}
