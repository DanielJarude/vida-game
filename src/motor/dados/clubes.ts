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
import { aoRegistrar, idDaCidade, PAIS_PADRAO, perfilDoPais, temPerfil } from '../mundo/registro';
import { paisCorrente } from '../mundo/moeda';

export interface Clube { nome: string; artigo: 'o' | 'a' | 'os' | 'as'; porte: 'grande' | 'tradicional' | 'regional'; cidade: string }

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

/*
 * MUNDO: os clubes brasileiros moram aqui (os nomes e as cidades deles estão
 * nos saves); os de outros países vêm dos perfis (`mundo/paises`, campo
 * `esporte.clubes`), com a cidade dada pelo nome. Um clube pertence a um país
 * pela cidade; a liga é a do país (`divisaoDoNivel`).
 */
const POR_PAIS = new Map<string, Clube[]>([[PAIS_PADRAO, [...CLUBES]]]);
// Um nome pode existir em mais de um país (o Nacional de Manaus e o de Montevidéu; o Liverpool inglês e o uruguaio; o
// River Plate argentino e o uruguaio): o índice guarda todos, e quem pergunta diz de que país está falando.
const POR_NOME = new Map<string, Clube[]>(CLUBES.map(c => [c.nome, [c]]));
const paisDoClube = (c: Clube) => (c.cidade.includes(':') ? c.cidade.slice(0, c.cidade.indexOf(':')).toUpperCase() : PAIS_PADRAO);
aoRegistrar(p => {
  if (POR_PAIS.has(p.id)) return;
  const lista = p.esporte.clubes.map(c => ({ nome: c.nome, artigo: c.artigo, porte: c.porte, cidade: idDaCidade(p.id, c.cidade) }));
  POR_PAIS.set(p.id, lista);
  for (const c of lista) POR_NOME.set(c.nome, [...(POR_NOME.get(c.nome) ?? []), c]);
});

/** Os clubes de futebol de um país (vazio se o pacote não chegou). */
export const clubesDoPais = (pais = paisCorrente()): readonly Clube[] => POR_PAIS.get(pais) ?? [];
/** Um clube pelo nome: o do país dito (por padrão, o da vida em processamento); sem ele, o primeiro com esse nome. */
export const clubePorNome = (nome: string, pais = paisCorrente()): Clube | undefined => {
  const xs = POR_NOME.get(nome);
  return xs?.find(c => paisDoClube(c) === pais) ?? xs?.[0];
};

export const clubesDaCidade = (municipioId: string) => [...POR_PAIS.values()].flat().filter(c => c.cidade === municipioId);

/** O artigo de um nome de clube (os da lista; e os genéricos: "a equipe da prefeitura", "o Clube..."). */
export function artigoDoClube(nome: string): 'o' | 'a' {
  const c = POR_NOME.get(nome)?.[0];
  if (c) return c.artigo === 'os' ? 'o' : c.artigo === 'as' ? 'a' : c.artigo;
  for (const lista of Object.values(POLIESPORTIVOS)) { const p = lista.find(x => x[0] === nome); if (p) return p[1]; }
  return /^(equipe|Associação|Sociedade|Seleção|academia)/i.test(nome) ? 'a' : 'o';
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
  // A equipe da prefeitura é o caminho brasileiro; fora, o clube esportivo da cidade (sem nome real inventado).
  if (municipioId.includes(':')) return `clube esportivo de ${nomeCidade}`;
  return `equipe da prefeitura de ${nomeCidade}`;
}

/** Um clube para a simulação da carreira: pelo nível que se alcançou (4 elite · 3 série B · 2 acesso · 1 estadual). */
/** Os clubes que a simulação põe numa divisão (pelo porte). */
export function clubesDoNivel(nivel: number, excluir?: string, pais = paisCorrente()): Clube[] {
  const porte: Clube['porte'][] = nivel >= 4 ? ['grande', 'tradicional'] : nivel === 3 ? ['tradicional'] : nivel === 2 ? ['tradicional', 'regional'] : ['regional'];
  const lista = clubesDoPais(pais).filter(c => porte.includes(c.porte) && c.nome !== excluir);
  // Um país de poucos clubes no catálogo: o nível vizinho completa (nunca uma lista vazia).
  return lista.length ? lista : clubesDoPais(pais).filter(c => c.nome !== excluir);
}
export function clubeDoNivel(nivel: number, h: number, excluir?: string, pais = paisCorrente()): Clube {
  const lista = clubesDoNivel(nivel, excluir, pais);
  return lista[Math.floor(h * lista.length) % lista.length];
}

/** Em que divisão o clube joga, no universo do jogo (nunca uma afirmação sobre o clube real). */
export const DIVISAO_DO_NIVEL = ['', 'campeonato estadual', 'divisões de acesso', 'Série B', 'Série A'];
/** A divisão do nível na liga do país ("Série A", "LaLiga", "J1 League"). */
export const divisaoDoNivel = (nivel: number, pais = paisCorrente()): string =>
  (nivel < 1 ? '' : perfilDoPais(temPerfil(pais) ? pais : PAIS_PADRAO).esporte.divisoes[Math.min(4, nivel) - 1] ?? '');
/** O nível (1..4) de uma competição pelo nome, em qualquer liga carregada (para pesar um título): "LaLiga" → 4. */
export function nivelDaCompeticao(texto: string): number | undefined {
  for (const pais of POR_PAIS.keys()) {
    const d = perfilDoPais(pais).esporte.divisoes;
    for (let n = 4; n >= 1; n--) if (d[n - 1] && texto.includes(d[n - 1])) return n;
  }
  return undefined;
}

/** O nome da seleção de um país como "clube" de um técnico ("Seleção Brasileira", "Seleção Argentina"). */
export const nomeDaSelecao = (pais: string) => { const a = temPerfil(pais) ? perfilDoPais(pais).gentilico[1] : pais; return `Seleção ${a.charAt(0).toUpperCase()}${a.slice(1)}`; };
/** "a seleção brasileira" a partir do nome guardado ("Seleção Brasileira"). */
export const aSelecao = (nome: string) => `a seleção ${nome.replace(/^Seleção /, '').toLowerCase()}`;

/** A liga de elite do país (para o texto: "a elite do futebol espanhol"). */
export const eliteDoPais = (pais: string) => divisaoDoNivel(4, pais);
