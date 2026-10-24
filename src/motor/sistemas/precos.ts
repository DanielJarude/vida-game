/**
 * REWORK 12 — OS PREÇOS DO PATRIMÔNIO: de onde vem o preço de um imóvel, de um carro, de um relógio.
 *
 * IMÓVEL. O aluguel é a âncora (é o que a vida inteira já paga: `economiaLocal`). O preço sai dele pelo
 * RENDIMENTO do mercado — o aluguel de um ano dividido pelo preço. Antes, preço e aluguel vinham de bases
 * independentes (o preço pelo custo de vida ^1,7; o aluguel pela moradia do país): o rendimento ia de 3% a 15%
 * conforme o lugar, sem razão nenhuma. Agora:
 *   - metrópole rende menos (o imóvel é disputado: paga-se pelo endereço), cidade pequena também (pouca
 *     liquidez); capital e cidade média, um pouco mais;
 *   - país de moradia cara comprime o rendimento (Londres, Zurique: 3–4%), país de moradia barata o abre;
 *   - o tipo pesa: o padrão alto rende menos que o simples (o luxo é caro de comprar e não se aluga por tanto);
 *   - o bairro pesa mais no topo (o alto padrão, a cobertura, a mansão) do que no apartamento comum: a mansão
 *     no bairro nobre vale uma fortuna; a afastada, fora da mancha urbana, vale bem menos que o apartamento de
 *     luxo bem localizado (o tamanho longe vale pouco).
 *
 * BEM IMPORTÁVEL (carro, moto, relógio, joia): o motor conta em poder de compra brasileiro, e a paridade
 * serve ao pão e ao aluguel — não ao carro, que tem um preço mundial. Nos catálogos, o preço é o do Brasil
 * (com os impostos daqui); em outro país, sai o imposto daqui, entra o de lá, e o nível de preços converte.
 * Um Corolla de R$ 180 mil vira uns US$ 23 mil nos Estados Unidos (não US$ 72 mil, como a paridade dava).
 */

import { municipio } from '../dados/lugares';
import { PAIS_PADRAO, paisDoCatalogo, perfilDoPais, temPerfil } from '../mundo/registro';
import type { RegiaoMundial } from '../mundo/tipos';

/* ----------------------------------------------------------------- Imóveis */

/** Rendimento bruto do aluguel por porte de cidade (o Brasil; os outros países ajustam). */
export const RENDIMENTO_POR_PORTE: Record<string, number> = { metropole: 0.045, capital: 0.05, metropolitana: 0.052, polo: 0.048, pequena: 0.042 };

/**
 * No Brasil, o rendimento muda com a região (FipeZap): as capitais do Nordeste e do Norte rendem mais (o imóvel é
 * barato para o aluguel que se paga — Recife, Fortaleza, Belém passam de 6%); o Sul, um pouco menos.
 */
const RENDIMENTO_POR_REGIAO: Record<string, number> = { Nordeste: 0.009, Norte: 0.007, 'Centro-Oeste': 0.002, Sudeste: 0, Sul: -0.003 };

/** O rendimento bruto do aluguel de referência (dois quartos, bairro comum) numa cidade. */
export function rendimentoDoMercado(municipioId: string): number {
  const m = municipio(municipioId);
  const base = RENDIMENTO_POR_PORTE[m.perfil] ?? 0.05;
  if (m.pais === PAIS_PADRAO) return base + (RENDIMENTO_POR_REGIAO[m.regiao ?? ''] ?? 0);
  if (!temPerfil(m.pais)) return base;
  const e = perfilDoPais(m.pais).economia;
  if (e.rendimentoAluguel !== undefined) return e.rendimentoAluguel * base / RENDIMENTO_POR_PORTE.capital;
  return base * Math.pow(e.moradia, -0.4);
}

/** O quanto o endereço pesa no preço de cada tipo (1 = como um apartamento comum). */
export function sensibilidadeAoBairro(modeloId: string): number {
  switch (modeloId) {
    case 'alto_padrao': return 1.3;
    case 'cobertura': return 1.35;
    case 'mansao': return 1.5;
    case 'casa_grande': return 1.15;
    case 'casa_simples': case 'kitnet': case 'republica': return 0.9;
    default: return 1;
  }
}

/** O índice do bairro aplicado a um tipo: no preço, inteiro; no aluguel, um pouco menos (o aluguel é menos especulativo). */
export const fatorDoBairro = (indice: number, modeloId: string, no: 'preco' | 'aluguel') =>
  Math.pow(indice, sensibilidadeAoBairro(modeloId) * (no === 'preco' ? 1 : 0.8));

/* ------------------------------------------------------ Bens importáveis */

const TRIBUTO_POR_REGIAO: Record<RegiaoMundial, number> = {
  america_sul: 1.4, america_norte: 1.0, america_central_caribe: 1.3, europa: 1.2, africa: 1.38, asia: 1.25, oceania: 1.12
};
/** Os que fogem da média da região (impostos de importação, tributo de registro, cotas). */
const TRIBUTO_POR_PAIS: Record<string, number> = {
  BR: 1.35, US: 0.95, CA: 1.05, MX: 1.15, AR: 1.6, CL: 1.12, UY: 1.45, CO: 1.4, PE: 1.25,
  JP: 1.0, KR: 1.1, CN: 1.22, IN: 1.45, SG: 2.4, HK: 1.05, AE: 1.0, IL: 1.6, TR: 1.7,
  DK: 1.75, NO: 1.35, NL: 1.3, DE: 1.15, CH: 1.05, GB: 1.15, FR: 1.2, IT: 1.2, ES: 1.2, PT: 1.35, AU: 1.15, NZ: 1.1
};

/** O quanto o país carrega no preço de um bem do mercado mundial (1 = o preço mundial; o Brasil, 1,35). */
export function tributoDeImportados(pais: string): number {
  if (temPerfil(pais)) { const t = perfilDoPais(pais).economia.tributoImportados; if (t !== undefined) return t; }
  return TRIBUTO_POR_PAIS[pais] ?? TRIBUTO_POR_REGIAO[paisDoCatalogo(pais).regiao] ?? 1.25;
}

/**
 * Fator sobre o preço de catálogo (brasileiro) de um bem importável, num país: troca o imposto daqui pelo de
 * lá e converte pelo nível de preços. No Brasil, 1. `peso` dilui o imposto (a peça de leilão, que se compra no
 * mercado mundial, paga menos do que o carro novo na concessionária).
 */
export function fatorDeImportado(pais: string, peso = 1): number {
  if (pais === PAIS_PADRAO) return 1;
  const t = (p: string) => 1 + (tributoDeImportados(p) - 1) * peso;
  const precos = Math.max(0.2, paisDoCatalogo(pais).economia?.precos ?? 1);
  return t(pais) / t(PAIS_PADRAO) / precos;
}

/** O país deixa entrar carro usado importado? (`'colecao'`: só o de coleção, com 30 anos ou mais.) */
export function importaUsados(pais: string): boolean | 'colecao' {
  if (temPerfil(pais)) { const x = perfilDoPais(pais).economia.importaUsados; if (x !== undefined) return x; }
  return pais === 'BR' ? 'colecao' : true;
}
