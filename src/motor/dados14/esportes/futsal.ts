/**
 * VIDA 14 · FUTSAL — o catálogo (puro: só tipos). O futsal é uma modalidade própria no MESMO motor da carreira
 * esportiva (`sistemas/esporte`: prática → seletiva → base → profissional → fim); aqui ficam os parâmetros dele:
 *
 *   posições      goleiro, fixo (o último homem, que sai jogando), ala esquerda e ala direita (os que fazem o
 *                 corredor e o um contra um) e pivô (de costas para o gol, segura e finaliza). O goleiro-linha é
 *                 uma TÁTICA (o quinto jogador de linha nos minutos finais), não uma posição.
 *   divisões      no Brasil, o estadual, a divisão de acesso nacional e a Liga Nacional de Futsal (LNF); na
 *                 Espanha, a liga mais forte do mundo (Primera División); nos outros países, ditas pelo que são.
 *   dinheiro      bem menor que o do futebol de campo: na elite brasileira, um titular de nome ganha o que um
 *                 titular de Série C ganha no campo; o estrelato de milhões não existe.
 *   competições   a copa nacional, a continental de clubes (Libertadores de futsal, a Champions de futsal), a Copa
 *                 do Mundo de Futsal (a cada quatro anos) e o continental de seleções.
 *
 * Os clubes de futsal seguem a convenção das modalidades de quadra (`dados/clubes.equipeDaCidade`): a equipe da
 * cidade (a prefeitura, o clube poliesportivo), nunca um nome real inventado.
 */
import type { ModeloFrente } from '../../dados/frentes';

export type FuncaoFutsal = 'goleiro' | 'fixo' | 'ala_esquerda' | 'ala_direita' | 'pivo';
export const FUNCOES_FUTSAL: FuncaoFutsal[] = ['goleiro', 'fixo', 'ala_esquerda', 'ala_direita', 'pivo'];

export const NOME_FUNCAO_FUTSAL: Record<FuncaoFutsal, [string, string]> = {
  goleiro: ['goleiro', 'goleira'], fixo: ['fixo', 'fixo'], ala_esquerda: ['ala esquerdo', 'ala esquerda'], ala_direita: ['ala direito', 'ala direita'], pivo: ['pivô', 'pivô']
};

export const SOBRE_FUNCAO_FUTSAL: Record<FuncaoFutsal, string> = {
  goleiro: 'Fecha o gol num espaço de três metros e começa as jogadas com as mãos e os pés.',
  fixo: 'O último da linha: marca o pivô deles, cobre os alas e sai jogando.',
  ala_esquerda: 'O corredor da esquerda: o um contra um, a diagonal, a volta para marcar.',
  ala_direita: 'O corredor da direita: o um contra um, a diagonal, a volta para marcar.',
  pivo: 'De costas para o gol: segura a bola, gira e finaliza. Apanha o jogo inteiro.'
};

/**
 * O que cada posição produz por jogo, em média, jogando o jogo inteiro na rotação (o futsal troca o tempo todo: o
 * "titular" é quem está no quinteto inicial e joga mais minutos). Gols e assistências por jogo; risco de lesão (o
 * pivô apanha; o goleiro se machuca menos); o auge (o goleiro dura mais).
 */
export const PRODUCAO_FUTSAL: Record<FuncaoFutsal, { gol: number; assist: number; risco: number; auge: number }> = {
  goleiro: { gol: 0.02, assist: 0.07, risco: 0.75, auge: 34 },
  fixo: { gol: 0.22, assist: 0.26, risco: 1, auge: 32 },
  ala_esquerda: { gol: 0.4, assist: 0.32, risco: 1.1, auge: 30 },
  ala_direita: { gol: 0.4, assist: 0.32, risco: 1.1, auge: 30 },
  pivo: { gol: 0.62, assist: 0.2, risco: 1.25, auge: 30 }
};

/** A posição que a quadra dá a quem chega sem uma (pela semente da pessoa, `u` em 0..1): poucos goleiros, o resto dividido. */
export const funcaoFutsalPorSorteio = (u: number): FuncaoFutsal => (u < 0.12 ? 'goleiro' : u < 0.34 ? 'fixo' : u < 0.56 ? 'ala_esquerda' : u < 0.78 ? 'ala_direita' : 'pivo');

/** O jogo do ano (as partidas da temporada por nível): o estadual curto, a liga nacional com turno, returno e playoffs. */
export const JOGOS_FUTSAL = [0, 14, 20, 26, 30];
/** O salário-base mensal (reais de hoje, Brasil; o nome, o papel e a fase multiplicam): bem abaixo do futebol de campo. */
export const BASE_FUTSAL = [0, 1300, 3000, 7000, 18000];
/** O contrato que sai da base (idade e técnica pedidas). */
export const CONTRATO_FUTSAL = { idade: [17, 21] as [number, number], tecnica: 81 };

/** As divisões (o nível 4 é a mesma liga do 3, entre os times de ponta: a tela e o palmarés tiram o " — ..."). */
const DIVISOES: Record<string, string[]> = {
  BR: ['', 'campeonato estadual', 'divisão de acesso nacional', 'Liga Nacional de Futsal', 'Liga Nacional de Futsal — entre os times de ponta'],
  ES: ['', 'liga regional de futsal', 'Segunda División de futsal', 'Primera División de futsal', 'Primera División de futsal — entre os times de ponta']
};
export function divisaoFutsal(nivel: number, pais: string): string {
  const d = DIVISOES[pais] ?? ['', 'campeonato regional de futsal', 'segunda divisão nacional de futsal', 'liga nacional de futsal', 'liga nacional de futsal — entre os times de ponta'];
  return d[nivel] ?? '';
}

/**
 * Os nomes das competições de futsal (pelo id: `copa:BR:futsal`, `cont:CONMEBOL:futsal`, `sel:futsal:mundial`). Só onde
 * o nome é inequívoco; no resto, ditas pelo que são.
 */
const COPAS: Record<string, string> = { BR: 'Copa do Brasil de Futsal', ES: 'Copa de España de futsal', PT: 'Taça de Portugal de futsal' };
const CONTINENTAIS: Record<string, string> = { CONMEBOL: 'Copa Libertadores de Futsal', UEFA: 'Champions League de futsal' };
const SELECOES: Record<string, string> = { mundial: 'Copa do Mundo de Futsal', CONMEBOL: 'Copa América de Futsal', UEFA: 'Eurocopa de futsal' };
export function nomeCompeticaoFutsal(tipo: string, a: string): string {
  if (tipo === 'copa') return COPAS[a] ?? 'copa nacional de futsal';
  if (tipo === 'cont') return CONTINENTAIS[a] ?? 'torneio continental de clubes de futsal';
  return SELECOES[a] ?? 'campeonato continental de futsal';
}

/**
 * O calendário das seleções de futsal: a Copa do Mundo nos anos múltiplos de 4 (2024, 2028...) e o continental dois
 * anos depois (a Eurocopa de futsal, a Copa América de Futsal). Fora disso, só amistosos.
 */
export const torneioFutsalDoAno = (ano: number): 'mundial' | 'continental' | undefined => (ano % 4 === 0 ? 'mundial' : ano % 4 === 2 ? 'continental' : undefined);

/**
 * Onde o futsal é forte (escala da popularidade dos perfis: ~0,6 sem tradição, ~1,3 o topo). Brasil e Espanha são as
 * potências; Portugal e Argentina, campeões do mundo recentes; Itália e Japão têm liga.
 */
export const POPULARIDADE_FUTSAL: Record<string, number> = { BR: 1.3, ES: 1.25, PT: 1.1, AR: 1.05, IT: 0.9, JP: 0.85, CO: 0.85, UY: 0.8, MX: 0.75, PE: 0.75, CL: 0.75, MA: 0.85, FR: 0.75 };

/** A frente (a habilidade): aprende-se cedo, na quadra da escola. */
export const FRENTE_FUTSAL: ModeloFrente = {
  id: 'futsal', nome: 'futsal', categoria: 'esporte', janela: [6, 17], esquece: 3, declinio: 31,
  estagios: ['ainda perde a bola no primeiro drible', 'já joga com a turma na quadra', 'joga bem', 'se destaca nos campeonatos de quadra', 'chama atenção de quem entende de futsal', 'joga como poucos'],
  facilidade: 'tem a bola colada no pé'
};
