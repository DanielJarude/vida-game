/**
 * Partidos políticos registrados no TSE (situação em 2026). Fonte: lista
 * de partidos com registro no TSE e notícias oficiais do tribunal (registro
 * do Missão em 4/11/2025; PMB renomeado Democrata em 2/12/2025). Ver o
 * relatório do FIX #3.
 *
 * NEUTRALIDADE — o jogo usa só o nome e a sigla. Nenhuma ideologia, nenhum
 * programa, nenhum bônus: o tamanho do diretório que convida a pessoa é LOCAL
 * e sorteado por cidade (num lugar o diretório de um partido é grande; em
 * outro, pequeno), nunca derivado do tamanho nacional do partido. Eleições,
 * mandatos, crises e escândalos do jogo são simulação do universo do
 * personagem — nada disso é atribuído a partido real.
 */

export interface Partido {
  sigla: string;
  nome: string;
  /** Como o partido costuma ser chamado ("o PT", "a Rede", "o Novo"). */
  chamado: string;
  artigo: 'o' | 'a';
}

export const PARTIDOS_REAIS: readonly Partido[] = [
  { sigla: 'AGIR', nome: 'Agir', chamado: 'Agir', artigo: 'o' },
  { sigla: 'AVANTE', nome: 'Avante', chamado: 'Avante', artigo: 'o' },
  { sigla: 'CIDADANIA', nome: 'Cidadania', chamado: 'Cidadania', artigo: 'o' },
  { sigla: 'DC', nome: 'Democracia Cristã', chamado: 'DC', artigo: 'a' },
  { sigla: 'DEMOCRATA', nome: 'Democrata', chamado: 'Democrata', artigo: 'o' },
  { sigla: 'MDB', nome: 'Movimento Democrático Brasileiro', chamado: 'MDB', artigo: 'o' },
  { sigla: 'MISSÃO', nome: 'Partido Missão', chamado: 'Missão', artigo: 'o' },
  { sigla: 'MOBILIZA', nome: 'Mobilização Nacional', chamado: 'Mobiliza', artigo: 'o' },
  { sigla: 'NOVO', nome: 'Partido Novo', chamado: 'Novo', artigo: 'o' },
  { sigla: 'PCB', nome: 'Partido Comunista Brasileiro', chamado: 'PCB', artigo: 'o' },
  { sigla: 'PCdoB', nome: 'Partido Comunista do Brasil', chamado: 'PCdoB', artigo: 'o' },
  { sigla: 'PCO', nome: 'Partido da Causa Operária', chamado: 'PCO', artigo: 'o' },
  { sigla: 'PDT', nome: 'Partido Democrático Trabalhista', chamado: 'PDT', artigo: 'o' },
  { sigla: 'PL', nome: 'Partido Liberal', chamado: 'PL', artigo: 'o' },
  { sigla: 'PODE', nome: 'Podemos', chamado: 'Podemos', artigo: 'o' },
  { sigla: 'PP', nome: 'Progressistas', chamado: 'PP', artigo: 'o' },
  { sigla: 'PRD', nome: 'Partido Renovação Democrática', chamado: 'PRD', artigo: 'o' },
  { sigla: 'PRTB', nome: 'Partido Renovador Trabalhista Brasileiro', chamado: 'PRTB', artigo: 'o' },
  { sigla: 'PSB', nome: 'Partido Socialista Brasileiro', chamado: 'PSB', artigo: 'o' },
  { sigla: 'PSD', nome: 'Partido Social Democrático', chamado: 'PSD', artigo: 'o' },
  { sigla: 'PSDB', nome: 'Partido da Social Democracia Brasileira', chamado: 'PSDB', artigo: 'o' },
  { sigla: 'PSOL', nome: 'Partido Socialismo e Liberdade', chamado: 'PSOL', artigo: 'o' },
  { sigla: 'PSTU', nome: 'Partido Socialista dos Trabalhadores Unificado', chamado: 'PSTU', artigo: 'o' },
  { sigla: 'PT', nome: 'Partido dos Trabalhadores', chamado: 'PT', artigo: 'o' },
  { sigla: 'PV', nome: 'Partido Verde', chamado: 'PV', artigo: 'o' },
  { sigla: 'REDE', nome: 'Rede Sustentabilidade', chamado: 'Rede', artigo: 'a' },
  { sigla: 'REPUBLICANOS', nome: 'Republicanos', chamado: 'Republicanos', artigo: 'o' },
  { sigla: 'SOLIDARIEDADE', nome: 'Solidariedade', chamado: 'Solidariedade', artigo: 'o' },
  { sigla: 'UNIÃO', nome: 'União Brasil', chamado: 'União Brasil', artigo: 'o' },
  { sigla: 'UP', nome: 'Unidade Popular', chamado: 'UP', artigo: 'a' }
];

/** O partido pelo que está guardado na vida (sigla; saves antigos guardam o nome fictício, que continua valendo como está). */
export const partidoDe = (x: string | undefined): Partido | undefined => (x ? PARTIDOS_REAIS.find(p => p.sigla === x) ?? { sigla: x, nome: x, chamado: x, artigo: 'o' } : undefined);

/** "o PT", "a Rede". */
export const oPartido = (x: string | undefined) => { const p = partidoDe(x); return p ? `${p.artigo} ${p.chamado}` : 'o partido'; };
/** "ao PT", "à Rede". */
export const aoPartido = (x: string | undefined) => { const p = partidoDe(x); return p ? `${p.artigo === 'a' ? 'à' : 'ao'} ${p.chamado}` : 'ao partido'; };
/** "pelo PT", "pela Rede". */
export const peloPartido = (x: string | undefined) => { const p = partidoDe(x); return p ? `${p.artigo === 'a' ? 'pela' : 'pelo'} ${p.chamado}` : 'pelo partido'; };
/** "PT (Partido dos Trabalhadores)" — para a ficha. */
export const nomeCompletoPartido = (x: string | undefined) => { const p = partidoDe(x); return p ? (p.chamado === p.nome ? p.nome : `${p.chamado} (${p.nome})`) : ''; };
