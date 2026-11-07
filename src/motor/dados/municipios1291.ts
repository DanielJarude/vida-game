/**
 * VIDA 12.9.1 · Cidades dos campi — os municípios brasileiros que entraram no mapa porque uma instituição real do
 * catálogo (`instituicoes129`) tem campus neles. Catálogo puro (só tipos; pacote `motor-casa`, embaixo de `lugares`).
 *
 * Cada linha é como as de `lugares` ([nome oficial, UF, perfil, metrópole?]) + a população do Censo 2022 (IBGE,
 * arredondada ao milhar — usada só para escolher o perfil e documentar; o motor não modela população). O perfil segue
 * o critério da lista de sempre: cidade grande colada numa metrópole → 'metropolitana'; polo regional com mais de
 * ~130 mil habitantes → 'polo'; o resto → 'pequena'. O custo de vida, o aluguel, os salários e a oferta de cursos
 * saem do perfil × região, como em qualquer cidade do jogo (`lugares.economiaLocal`, `nivelDeOferta`).
 *
 * Elas vêm DEPOIS da lista de sempre (os códigos numéricos das cidades antigas não mudam) e NÃO entram nos sorteios
 * do mundo (onde se nasce, de onde vem um personagem, para onde um parente se muda): esses sorteios leem
 * `cidadesDoPais`, que continua a lista de sempre — as sementes de antes dão as mesmas vidas. Elas existem para
 * morar, estudar, trabalhar e mudar de cidade (a tela de mudança e a de nascer as listam: `cidadesNoMapa`).
 *
 * Regiões administrativas do DF (Ceilândia, Gama...) não são municípios: o campus aponta para `brasilia-df`, como o
 * jogo já trata o DF inteiro (o UnB Ceilândia já fazia assim; o UnB Gama está fora do catálogo por falta de curso
 * verificado).
 */

import type { PerfilUrbano } from '../mundo/tipos';

/** [nome oficial, UF, perfil, metrópole (para 'metropolitana'), população (Censo 2022, mil hab.)] */
export type LinhaMunicipio1291 = [string, string, PerfilUrbano, string | undefined, number];

export const MUNICIPIOS_1291: readonly LinhaMunicipio1291[] = [
  // São Paulo
  ['São Carlos', 'SP', 'polo', undefined, 255],          // USP São Carlos
  ['Pirassununga', 'SP', 'pequena', undefined, 74],      // USP (FZEA)
  ['Lorena', 'SP', 'pequena', undefined, 85],            // USP (EEL)
  ['Limeira', 'SP', 'polo', undefined, 292],             // Unicamp (FCA/FT)
  ['Botucatu', 'SP', 'polo', undefined, 145],            // Unesp
  ['Araraquara', 'SP', 'polo', undefined, 242],          // Unesp
  ['Franca', 'SP', 'polo', undefined, 353],              // Unesp
  ['Barueri', 'SP', 'metropolitana', 'São Paulo', 316],  // Mackenzie Alphaville (Tamboré, Barueri)
  // Rio de Janeiro
  ['Macaé', 'RJ', 'polo', undefined, 246],               // UFRJ Macaé
  // Minas Gerais
  ['Betim', 'MG', 'metropolitana', 'Belo Horizonte', 412], // PUC Minas Betim
  ['Poços de Caldas', 'MG', 'polo', undefined, 164],     // PUC Minas Poços de Caldas
  // Rio Grande do Sul
  ['Tramandaí', 'RS', 'pequena', undefined, 54],         // UFRGS Litoral Norte
  // Santa Catarina
  ['Araranguá', 'SC', 'pequena', undefined, 72],         // UFSC Araranguá
  ['Curitibanos', 'SC', 'pequena', undefined, 40],       // UFSC Curitibanos
  // Paraná
  ['Toledo', 'PR', 'polo', undefined, 150],              // UFPR Toledo, PUCPR Toledo
  ['Palotina', 'PR', 'pequena', undefined, 34],          // UFPR Palotina
  ['Jandaia do Sul', 'PR', 'pequena', undefined, 21],    // UFPR Jandaia do Sul
  // Pernambuco
  ['Vitória de Santo Antão', 'PE', 'polo', undefined, 134], // UFPE (CAV)
  // Bahia
  ['Camaçari', 'BA', 'metropolitana', 'Salvador', 300],  // UFBA Camaçari
  // Ceará
  ['Russas', 'CE', 'pequena', undefined, 80]             // UFC Russas
];
