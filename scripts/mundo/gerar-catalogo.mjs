/**
 * Gera `src/motor/mundo/catalogo.ts` a partir de `scripts/mundo/fontes/paises.json`
 * (ONU, M49, ISO 4217 e Banco Mundial — as fontes estão no próprio JSON).
 *
 *   node scripts/mundo/gerar-catalogo.mjs
 *
 * O nome em português vem do ICU do Node (`Intl.DisplayNames('pt-BR')`), com
 * poucas correções de uso no Brasil; o artigo segue o uso da língua (o Brasil,
 * a Argentina, os Estados Unidos, Portugal).
 */
import { readFileSync, writeFileSync } from 'node:fs';

const { fontes, paises } = JSON.parse(readFileSync(new URL('./fontes/paises.json', import.meta.url), 'utf8'));
const nomes = new Intl.DisplayNames(['pt-BR'], { type: 'region' });

// Uso corrente no Brasil quando o ICU diverge.
const NOME = {
  CZ: 'Tchéquia', MK: 'Macedônia do Norte', SZ: 'Essuatíni', MM: 'Mianmar', CV: 'Cabo Verde', CI: 'Costa do Marfim',
  TL: 'Timor-Leste', FM: 'Micronésia', VC: 'São Vicente e Granadinas', KN: 'São Cristóvão e Névis', ST: 'São Tomé e Príncipe',
  BA: 'Bósnia e Herzegovina', CD: 'República Democrática do Congo', CG: 'República do Congo', PS: 'Palestina'
};
const SEM_ARTIGO = new Set(['PT', 'AO', 'MZ', 'CV', 'ST', 'TL', 'CU', 'IL', 'SG', 'AD', 'MC', 'MT', 'CY', 'LU', 'MG', 'MM', 'OM', 'DJ', 'GH', 'GD',
  'HN', 'BZ', 'BN', 'VU', 'TV', 'KI', 'NR', 'PW', 'WS', 'TO', 'FJ', 'LC', 'VC', 'KN', 'AG', 'TT', 'BB', 'SM', 'LI', 'ME', 'MU', 'BD', 'SZ',
  'BW', 'RW', 'UG', 'CM', 'SV', 'JM', 'DM', 'ST', 'TL', 'MV' /* corrigido abaixo */]);
const ARTIGO = {
  US: 'os', NL: 'os', AE: 'os', PH: 'as', BS: 'as', MV: 'as', MH: 'as', SB: 'as', KM: 'as', SC: 'as',
  CA: 'o', PA: 'o', BF: 'o', QA: 'o', BH: 'o', KW: 'o', MW: 'o', ML: 'o', HT: 'o', LS: 'o', LA: 'o', BT: 'o', NP: 'o', LK: 'o',
  KH: 'o', KE: 'o', GN: 'a', GW: 'a', GQ: 'a', PG: 'a', JM: 'a', DM: 'a', SV: '', BI: 'o', GY: 'a'
};
const REGIAO = r => {
  if (r.regiao === 'Africa') return 'africa';
  if (r.regiao === 'Europe') return 'europa';
  if (r.regiao === 'Asia') return 'asia';
  if (r.regiao === 'Oceania') return 'oceania';
  if (r.sub === 'Northern America' || r.iso2 === 'MX') return 'america_norte'; // o México, por convenção geográfica
  if (r.inter === 'South America') return 'america_sul';
  return 'america_central_caribe';
};
const SUB = {
  'Northern Africa': 'Norte da África', 'Sub-Saharan Africa': 'África Subsaariana', 'Latin America and the Caribbean': 'América Latina e Caribe',
  'Northern America': 'América do Norte', 'Central Asia': 'Ásia Central', 'Eastern Asia': 'Ásia Oriental', 'South-eastern Asia': 'Sudeste Asiático',
  'Southern Asia': 'Ásia Meridional', 'Western Asia': 'Ásia Ocidental', 'Eastern Europe': 'Europa Oriental', 'Northern Europe': 'Norte da Europa',
  'Southern Europe': 'Sul da Europa', 'Western Europe': 'Europa Ocidental', 'Australia and New Zealand': 'Austrália e Nova Zelândia',
  'Melanesia': 'Melanésia', 'Micronesia': 'Micronésia', 'Polynesia': 'Polinésia'
};
const INTER = { 'Caribbean': 'Caribe', 'Central America': 'América Central', 'South America': 'América do Sul', 'Eastern Africa': 'África Oriental',
  'Middle Africa': 'África Central', 'Southern Africa': 'África Austral', 'Western Africa': 'África Ocidental' };

const br = paises.find(p => p.iso2 === 'BR');
const ppcBR = br.ppc[1], fxBR = br.cambio[1], pibBR = br.pibPpc[1];
const r3 = x => Math.round(x * 1000) / 1000;
const sig = x => Number(x.toPrecision(4));

const linhas = paises.map(p => {
  const nome = NOME[p.iso2] ?? nomes.of(p.iso2);
  const primeira = nome.split(/[\s-]/)[0];
  const artigo = p.iso2 in ARTIGO ? ARTIGO[p.iso2] : SEM_ARTIGO.has(p.iso2) ? '' : /a$/.test(primeira) ? 'a' : 'o';
  const sub = p.iso2 === 'MX' ? 'América do Norte' : INTER[p.inter] ?? SUB[p.sub] ?? p.sub;
  const eco = p.pibPpc && p.ppc && p.cambio
    ? `{ renda: ${r3(p.pibPpc[1] / pibBR)}, precos: ${r3((p.ppc[1] / p.cambio[1]) / (ppcBR / fxBR))}, fator: ${sig(p.ppc[1] / ppcBR)}, ano: ${Math.min(p.pibPpc[0], p.ppc[0], p.cambio[0])} }`
    : 'undefined';
  return `  ['${p.iso2}', ${JSON.stringify(nome)}, '${artigo}', '${REGIAO(p)}', ${JSON.stringify(sub)}, '${p.moeda}', ${eco}, ${p.populacao ? Math.round(p.populacao[1] / 1000) : 0}]`;
});

const saida = `/**
 * O CATÁLOGO MUNDIAL — gerado por \`scripts/mundo/gerar-catalogo.mjs\`. Não editar à mão.
 *
 * Política de dados: o catálogo são os 193 Estados-membros das Nações Unidas
 * (a lista da própria ONU). Estados observadores, territórios e dependências
 * ficam fora nesta versão — não por juízo político, mas porque a fonte de
 * verdade escolhida é a lista de membros. A região é a do M49 (ONU), com uma
 * convenção: o México fica na América do Norte.
 *
 * Fontes:
${Object.entries(fontes).map(([k, v]) => ` *   ${k}: ${v}`).join('\n')}
 *
 * A economia é relativa ao Brasil (o motor conta em reais de poder de compra
 * brasileiro — \`mundo/moeda\`):
 *   renda   PIB per capita em PPC ÷ o do Brasil
 *   precos  nível de preços (PPC ÷ câmbio) ÷ o do Brasil
 *   fator   moeda local por unidade do motor (PPC do país ÷ PPC do Brasil)
 * Sem dado do Banco Mundial, \`undefined\`: o país não pode ser vivido.
 */

import type { LinhaDoCatalogo } from './tipos';

export const CATALOGO: readonly LinhaDoCatalogo[] = [
${linhas.join(',\n')}
];
`;
writeFileSync(new URL('../../src/motor/mundo/catalogo.ts', import.meta.url), saida);
console.log(`${linhas.length} países`);
