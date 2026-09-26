/**
 * Clubes de futebol reais, pela cidade onde têm sede e categorias de base.
 *
 * O jogo usa só o NOME e a CIDADE: o que acontece com o personagem no clube
 * (peneira, contrato, banco, transferência, divisão em que o clube joga
 * naquele ano do jogo) é simulação do universo do personagem — não é fato,
 * nem previsão, nem comentário sobre o clube. Nenhuma conduta (doping,
 * corte, calote) é atribuída a clube real: o que acontece é da vida do
 * personagem.
 *
 * `porte` organiza a simulação (quem costuma disputar a elite, quem oscila,
 * quem é regional); não é juízo de valor.
 *
 * Outros esportes: nas cidades com clube poliesportivo conhecido, ele; nas
 * demais, a equipe da prefeitura (o caminho mais comum de quem compete no
 * vôlei, na natação, no atletismo e nas lutas no Brasil).
 */

import type { Dominio } from '../tipos';

export interface Clube { nome: string; artigo: 'o' | 'a'; porte: 'grande' | 'tradicional' | 'regional'; cidade: string }

const C = (cidade: string, lista: [string, 'o' | 'a', Clube['porte']][]) => lista.map(([nome, artigo, porte]) => ({ nome, artigo, porte, cidade }));

export const CLUBES: readonly Clube[] = [
  ...C('rio-branco-ac', [['Rio Branco', 'o', 'regional'], ['Atlético Acreano', 'o', 'regional']]),
  ...C('macapa-ap', [['Trem', 'o', 'regional']]),
  ...C('manaus-am', [['Amazonas', 'o', 'regional'], ['Manaus', 'o', 'regional'], ['Nacional', 'o', 'regional']]),
  ...C('belem-pa', [['Paysandu', 'o', 'tradicional'], ['Remo', 'o', 'tradicional']]),
  ...C('porto-velho-ro', [['Porto Velho', 'o', 'regional']]),
  ...C('boa-vista-rr', [['São Raimundo', 'o', 'regional']]),
  ...C('palmas-to', [['Palmas', 'o', 'regional']]),
  ...C('maceio-al', [['CRB', 'o', 'tradicional'], ['CSA', 'o', 'tradicional']]),
  ...C('salvador-ba', [['Bahia', 'o', 'grande'], ['Vitória', 'o', 'tradicional']]),
  ...C('feira-de-santana-ba', [['Fluminense de Feira', 'o', 'regional'], ['Bahia de Feira', 'o', 'regional']]),
  ...C('juazeiro-ba', [['Juazeirense', 'a', 'regional']]),
  ...C('fortaleza-ce', [['Fortaleza', 'o', 'grande'], ['Ceará', 'o', 'tradicional'], ['Ferroviário', 'o', 'regional']]),
  ...C('juazeiro-do-norte-ce', [['Icasa', 'o', 'regional']]),
  ...C('sao-luis-ma', [['Sampaio Corrêa', 'o', 'tradicional'], ['Moto Club', 'o', 'regional']]),
  ...C('joao-pessoa-pb', [['Botafogo-PB', 'o', 'regional']]),
  ...C('campina-grande-pb', [['Treze', 'o', 'regional'], ['Campinense', 'o', 'regional']]),
  ...C('recife-pe', [['Sport', 'o', 'tradicional'], ['Náutico', 'o', 'tradicional'], ['Santa Cruz', 'o', 'tradicional']]),
  ...C('caruaru-pe', [['Central', 'o', 'regional']]),
  ...C('teresina-pi', [['River', 'o', 'regional'], ['Flamengo-PI', 'o', 'regional']]),
  ...C('natal-rn', [['ABC', 'o', 'tradicional'], ['América-RN', 'o', 'regional']]),
  ...C('mossoro-rn', [['Potiguar de Mossoró', 'o', 'regional']]),
  ...C('aracaju-se', [['Confiança', 'o', 'regional'], ['Sergipe', 'o', 'regional']]),
  ...C('brasilia-df', [['Brasiliense', 'o', 'regional'], ['Gama', 'o', 'regional'], ['Capital', 'o', 'regional']]),
  ...C('goiania-go', [['Goiás', 'o', 'tradicional'], ['Vila Nova', 'o', 'tradicional'], ['Atlético Goianiense', 'o', 'tradicional']]),
  ...C('anapolis-go', [['Anápolis', 'o', 'regional'], ['Anapolina', 'a', 'regional']]),
  ...C('cuiaba-mt', [['Cuiabá', 'o', 'tradicional'], ['Mixto', 'o', 'regional']]),
  ...C('campo-grande-ms', [['Operário', 'o', 'regional'], ['Comercial', 'o', 'regional']]),
  ...C('vitoria-es', [['Rio Branco-ES', 'o', 'regional'], ['Vitória-ES', 'o', 'regional']]),
  ...C('belo-horizonte-mg', [['Atlético Mineiro', 'o', 'grande'], ['Cruzeiro', 'o', 'grande'], ['América Mineiro', 'o', 'tradicional']]),
  ...C('uberlandia-mg', [['Uberlândia', 'o', 'regional']]),
  ...C('juiz-de-fora-mg', [['Tupi', 'o', 'regional']]),
  ...C('uberaba-mg', [['Uberaba', 'o', 'regional']]),
  ...C('rio-de-janeiro-rj', [['Flamengo', 'o', 'grande'], ['Fluminense', 'o', 'grande'], ['Vasco', 'o', 'grande'], ['Botafogo', 'o', 'grande']]),
  ...C('volta-redonda-rj', [['Volta Redonda', 'o', 'regional']]),
  ...C('sao-paulo-sp', [['Corinthians', 'o', 'grande'], ['Palmeiras', 'o', 'grande'], ['São Paulo', 'o', 'grande'], ['Portuguesa', 'a', 'tradicional']]),
  ...C('santo-andre-sp', [['Santo André', 'o', 'regional']]),
  ...C('sao-bernardo-do-campo-sp', [['São Bernardo', 'o', 'regional']]),
  ...C('campinas-sp', [['Guarani', 'o', 'tradicional'], ['Ponte Preta', 'a', 'tradicional']]),
  ...C('santos-sp', [['Santos', 'o', 'grande']]),
  ...C('ribeirao-preto-sp', [['Botafogo-SP', 'o', 'tradicional'], ['Comercial-SP', 'o', 'regional']]),
  ...C('sorocaba-sp', [['São Bento', 'o', 'regional']]),
  ...C('bauru-sp', [['Noroeste', 'o', 'regional']]),
  ...C('marilia-sp', [['Marília', 'o', 'regional']]),
  ...C('piracicaba-sp', [['XV de Piracicaba', 'o', 'regional']]),
  ...C('curitiba-pr', [['Athletico Paranaense', 'o', 'grande'], ['Coritiba', 'o', 'tradicional'], ['Paraná Clube', 'o', 'tradicional']]),
  ...C('londrina-pr', [['Londrina', 'o', 'tradicional']]),
  ...C('maringa-pr', [['Maringá', 'o', 'regional']]),
  ...C('ponta-grossa-pr', [['Operário Ferroviário', 'o', 'tradicional']]),
  ...C('porto-alegre-rs', [['Grêmio', 'o', 'grande'], ['Internacional', 'o', 'grande']]),
  ...C('caxias-do-sul-rs', [['Juventude', 'o', 'tradicional'], ['Caxias', 'o', 'regional']]),
  ...C('pelotas-rs', [['Brasil de Pelotas', 'o', 'regional']]),
  ...C('florianopolis-sc', [['Avaí', 'o', 'tradicional'], ['Figueirense', 'o', 'tradicional']]),
  ...C('joinville-sc', [['Joinville', 'o', 'regional']]),
  ...C('chapeco-sc', [['Chapecoense', 'a', 'tradicional']]),
  ...C('criciuma-sc', [['Criciúma', 'o', 'tradicional']])
];

/** Clubes poliesportivos (natação, vôlei, atletismo, lutas) nas cidades onde são referência. */
const POLIESPORTIVOS: Record<string, [string, 'o' | 'a'][]> = {
  'sao-paulo-sp': [['Pinheiros', 'o'], ['Paulistano', 'o']],
  'belo-horizonte-mg': [['Minas Tênis Clube', 'o']],
  'rio-de-janeiro-rj': [['Flamengo', 'o'], ['Fluminense', 'o']],
  'porto-alegre-rs': [['Grêmio Náutico União', 'o'], ['Sogipa', 'a']]
};

export const clubesDaCidade = (municipioId: string) => CLUBES.filter(c => c.cidade === municipioId);

/** O artigo de um nome de clube (os da lista; e os genéricos: "a equipe da prefeitura", "o Clube..."). */
export function artigoDoClube(nome: string): 'o' | 'a' {
  const c = CLUBES.find(x => x.nome === nome);
  if (c) return c.artigo;
  for (const lista of Object.values(POLIESPORTIVOS)) { const p = lista.find(x => x[0] === nome); if (p) return p[1]; }
  return /^(equipe|Associação|Sociedade|Seleção)/i.test(nome) ? 'a' : 'o';
}
export const oClube = (nome: string) => `${artigoDoClube(nome)} ${nome}`;
export const doClube = (nome: string) => `${artigoDoClube(nome) === 'a' ? 'da' : 'do'} ${nome}`;
export const noClube = (nome: string) => `${artigoDoClube(nome) === 'a' ? 'na' : 'no'} ${nome}`;
export const aoClube = (nome: string) => `${artigoDoClube(nome) === 'a' ? 'à' : 'ao'} ${nome}`;
export const peloClube = (nome: string) => `${artigoDoClube(nome) === 'a' ? 'pela' : 'pelo'} ${nome}`;

/** Um clube poliesportivo da cidade — ou a equipe da prefeitura. */
export function equipeDaCidade(municipioId: string, nomeCidade: string, h: number, _d: Dominio): string {
  const p = POLIESPORTIVOS[municipioId];
  if (p?.length) return p[Math.floor(h * p.length) % p.length][0];
  return `equipe da prefeitura de ${nomeCidade}`;
}

/** Um clube para a simulação da carreira: pelo nível que se alcançou (4 elite · 3 série B · 2 acesso · 1 estadual). */
export function clubeDoNivel(nivel: number, h: number, excluir?: string): Clube {
  const porte: Clube['porte'][] = nivel >= 4 ? ['grande', 'tradicional'] : nivel === 3 ? ['tradicional'] : nivel === 2 ? ['tradicional', 'regional'] : ['regional'];
  const lista = CLUBES.filter(c => porte.includes(c.porte) && c.nome !== excluir);
  return lista[Math.floor(h * lista.length) % lista.length];
}

/** Em que divisão o clube joga, no universo do jogo (nunca uma afirmação sobre o clube real). */
export const DIVISAO_DO_NIVEL = ['', 'campeonato estadual', 'divisões de acesso', 'Série B', 'Série A'];
