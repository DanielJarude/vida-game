/**
 * A CARREIRA ESPORTIVA como camada comum — e o que cada modalidade é por si
 * (generalização de carreiras).
 *
 * O futebol foi a primeira carreira a ganhar profundidade, mas não é uma
 * exceção de arquitetura. O que é de TODA carreira esportiva mora aqui ou em
 * `esporte`/`palmares`/`selecao` (temporada, avaliação, títulos, prêmios,
 * representação do país, histórico, legado); o que é de UMA modalidade vem do
 * seu perfil:
 *
 *   estrutura      clube (futebol, basquete, vôlei) · circuito (tênis) ·
 *                  equipe (natação, atletismo, luta: a equipe é o vínculo; o
 *                  resultado é individual)
 *   avaliação      o que a temporada mede: o futebol pela posição; o basquete
 *                  pela função (o pivô pelo rebote, o armador pela assistência);
 *                  o tênis por vitórias, fases e títulos; as individuais pelos
 *                  pódios e pela colocação nas provas que importam
 *   líderes        os prêmios que são fato do placar (artilharia; cestinha,
 *                  rebotes, assistências) — cada modalidade os seus
 *   histórico      a tabela da carreira: por clube (com as colunas daquele
 *                  esporte) ou por ano de circuito (torneios, V–D, finais,
 *                  títulos, ranking, prêmios)
 *   resumo         a carreira inteira em uma frase, no idioma da modalidade
 *
 * Não há objeto universal com campos irrelevantes: a `Temporada` guarda o
 * que cada modalidade produz (os campos opcionais são de quem os usa), e o
 * perfil é quem sabe lê-los. Uma modalidade nova (vôlei com estatística,
 * automobilismo, natação com tempos) é um perfil novo — não outra carreira.
 */

import { clamp, type Rng } from '../rng';
import type { CarreiraEsportiva, Dominio, Temporada, Vida } from '../tipos';
import { flex, ge, dinheiro } from '../texto';
import type { FuncaoBasquete } from './modalidades';

export type Estrutura = 'clube' | 'circuito' | 'equipe';

export interface Avaliacao { indice: number; participacao: number; producao: number }
export interface Lider { texto: string; peso: 1 | 2 | 3; rep: number }
export interface HistoricoEsportivo {
  /** Por clube (a passagem) ou por ano (o circuito, a equipe individual). */
  agrupado: 'clube' | 'ano';
  colunas: string[];
  linhas: string[][];
}

export interface PerfilEsportivo {
  modalidade: Dominio;
  estrutura: Estrutura;
  coletivo: boolean;
  /** Como a modalidade chama o ano de competição. */
  unidade: string;
  /** Como chama o que se disputa no ano (jogos, torneios, provas, lutas). */
  disputas: [string, string];
}

/* ------------------------------------------------------------ Perfis */

export const PERFIS: Record<string, PerfilEsportivo> = {
  futebol: { modalidade: 'futebol', estrutura: 'clube', coletivo: true, unidade: 'temporada', disputas: ['jogo', 'jogos'] },
  basquete: { modalidade: 'basquete', estrutura: 'clube', coletivo: true, unidade: 'temporada', disputas: ['jogo', 'jogos'] },
  volei: { modalidade: 'volei', estrutura: 'clube', coletivo: true, unidade: 'temporada', disputas: ['jogo', 'jogos'] },
  tenis: { modalidade: 'tenis', estrutura: 'circuito', coletivo: false, unidade: 'ano de circuito', disputas: ['torneio', 'torneios'] },
  natacao: { modalidade: 'natacao', estrutura: 'equipe', coletivo: false, unidade: 'temporada', disputas: ['competição', 'competições'] },
  atletismo: { modalidade: 'atletismo', estrutura: 'equipe', coletivo: false, unidade: 'temporada', disputas: ['competição', 'competições'] },
  lutas: { modalidade: 'lutas', estrutura: 'equipe', coletivo: false, unidade: 'temporada', disputas: ['competição', 'competições'] }
};
export const perfilDe = (d: Dominio): PerfilEsportivo => PERFIS[d] ?? PERFIS.atletismo;
export const individualComEquipe = (d: Dominio) => perfilDe(d).estrutura === 'equipe';
/** "sem clube" só onde há clube: o nadador fica sem equipe; o tenista, sem quem banque o circuito. */
export const semVinculo = (d: Dominio) => (perfilDe(d).estrutura === 'clube' ? 'sem clube' : perfilDe(d).estrutura === 'equipe' ? 'sem equipe' : 'sem quem banque o circuito');

const um = (n: number, [s, p]: [string, string]) => `${n} ${n === 1 ? s : p}`;

/** "do estadual", "da Série A", "do NBB", "do circuito nacional", "das competições regionais" — o artigo certo de cada competição. */
export const daCompeticao = (c: string) => (c === 'campeonato estadual' ? 'do estadual' : /^(divisões|competições)/.test(c) ? `das ${c}` : /^(NBB|circuito|campeonato|torneio)/.test(c) ? `do ${c}` : `da ${c}`);
/** "a Série A", "o NBB", "as divisões de acesso", "o estadual". */
export const aCompeticao = (c: string) => daCompeticao(c).replace(/^do /, 'o ').replace(/^da /, 'a ').replace(/^das /, 'as ').replace(/^dos /, 'os ');
const virgula = (x: number) => String(Math.round(x * 10) / 10).replace('.', ',');

/* ------------------------------------------------------------ Basquete: a função */

/** O que cada função produz por jogo quando joga como titular numa temporada regular (a régua da avaliação). */
export const ESPERADO_BASQUETE: Record<FuncaoBasquete, { pontos: number; rebotes: number; assistencias: number }> = {
  armador: { pontos: 11, rebotes: 3, assistencias: 6.5 },
  ala: { pontos: 15, rebotes: 5, assistencias: 2.5 },
  pivo: { pontos: 12, rebotes: 9, assistencias: 1.5 }
};

/** A produção do jogador de basquete medida contra o que a FUNÇÃO costuma produzir (o pivô não é cobrado por assistência). */
export function producaoBasquete(t: Temporada): number {
  const fn = (t.funcao as FuncaoBasquete | undefined) ?? 'ala';
  const e = ESPERADO_BASQUETE[fn] ?? ESPERADO_BASQUETE.ala;
  const r = (x: number | undefined, y: number) => (x ?? 0) / y;
  const pts = r(t.pontos, e.pontos), reb = r(t.rebotes, e.rebotes), ast = r(t.assistencias, e.assistencias);
  return fn === 'armador' ? ast * 0.5 + pts * 0.35 + reb * 0.15 : fn === 'pivo' ? reb * 0.5 + pts * 0.4 + ast * 0.1 : pts * 0.6 + reb * 0.2 + ast * 0.2;
}

/* ------------------------------------------------------------ Avaliação (fora do futebol) */

/**
 * A temporada avaliada (0..100) pelo que a modalidade mede. O futebol tem a
 * sua (pela posição, em `palmares.avaliarTemporada`); aqui, as outras.
 */
export function avaliarPelaModalidade(e: CarreiraEsportiva, t: Temporada, max: number): Avaliacao {
  const participacao = clamp(t.titular / (max || 1), 0, 1);
  let producao: number;
  let coletivo = t.colocacao === 1 ? 6 : t.colocacao <= 4 ? 3 : t.colocacao >= 17 ? -3 : 0;
  if (e.modalidade === 'basquete' && t.pontos !== undefined) producao = producaoBasquete(t);
  else if (e.modalidade === 'tenis') {
    // O tênis não tem time: o que conta é o aproveitamento, as fases e os títulos.
    const jogos = (t.vitorias ?? 0) + (t.derrotas ?? 0);
    const aprov = jogos ? (t.vitorias ?? 0) / jogos : 0;
    producao = aprov / 0.5;
    coletivo = (t.titulos ?? 0) * 4 + Math.max(0, (t.finais ?? 0) - (t.titulos ?? 0)) * 2;
  } else if (individualComEquipe(e.modalidade)) {
    // Natação, atletismo, luta: pódios e a melhor colocação nas provas que importam.
    producao = clamp(t.gols / Math.max(1, t.partidas * 0.35), 0, 2);
    coletivo = t.colocacao === 1 ? 6 : t.colocacao <= 3 ? 3 : 0;
  } else producao = clamp(t.nota / 6.5, 0, 2);
  const indice = clamp(participacao * 30 + (t.nota - 4) * 10 + (producao - 1) * 25 + coletivo, 0, 100);
  return { indice: Math.round(indice), participacao, producao: Math.round(producao * 100) / 100 };
}

/* ------------------------------------------------------------ Líderes (fatos do placar) */

/** Os prêmios que o placar decide, por modalidade (o futebol tem a artilharia em `palmares`). */
export function lideresDaTemporada(v: Vida, e: CarreiraEsportiva, t: Temporada, comp: string, ruido: number, r?: Rng): Lider[] {
  const g = ge(v);
  const out: Lider[] = [];
  const da = daCompeticao(comp);
  // Um líder por estatística por temporada: quem passa da marca disputa com o resto da liga (nem todo ano é seu).
  const liga = (p: number) => !r || r.chance(p);
  if (e.modalidade === 'basquete' && t.pontos !== undefined && t.titular >= 10) {
    if (t.pontos >= [0, 0, 20, 21, 22][t.nivel] + ruido / 2 && liga(0.6)) out.push({ texto: `${flex(g, 'Cestinha', 'Cestinha', 'Cestinha')} ${da}, com ${virgula(t.pontos)} pontos por jogo`, peso: t.nivel >= 3 ? 3 : 2, rep: 2 });
    if ((t.rebotes ?? 0) >= 11 + ruido / 4 && liga(0.5)) out.push({ texto: `${flex(g, 'Líder', 'Líder', 'Líder')} em rebotes ${da} (${virgula(t.rebotes ?? 0)} por jogo)`, peso: 2, rep: 1 });
    if (t.assistencias >= 8.2 + ruido / 4 && liga(0.5)) out.push({ texto: `${flex(g, 'Líder', 'Líder', 'Líder')} em assistências ${da} (${virgula(t.assistencias)} por jogo)`, peso: 2, rep: 1 });
  }
  return out;
}

/* ------------------------------------------------------------ Histórico e resumo */

/** A carreira em tabela, no idioma da modalidade (a mesma fonte da tela e da biografia: as temporadas). */
export function historicoDaCarreira(e: CarreiraEsportiva): HistoricoEsportivo {
  const ts = e.temporadas ?? [];
  const p = perfilDe(e.modalidade);
  if (e.modalidade === 'tenis') {
    return {
      agrupado: 'ano', colunas: ['Ano', 'Circuito', 'Torneios', 'V–D', 'Finais', 'Títulos', 'Ranking', 'Prêmios'],
      linhas: ts.map(t => [String(t.ano), CIRCUITO_CURTO[t.nivel] ?? '', String(t.partidas), `${t.vitorias ?? 0}–${t.derrotas ?? 0}`, String(t.finais ?? t.titulos ?? 0), String(t.titulos ?? 0), t.ranking ? `${t.ranking}º` : '—', t.premio !== undefined ? dinheiro(t.premio) : '—'])
    };
  }
  if (p.estrutura === 'equipe') {
    return {
      agrupado: 'ano', colunas: ['Ano', 'Equipe', 'Nível', 'Competições', 'Pódios', 'Melhor colocação'],
      linhas: ts.map(t => [String(t.ano), t.clube, NIVEL_INDIVIDUAL[t.nivel] ?? '', String(t.partidas), String(t.gols), t.colocacao <= 8 ? `${t.colocacao}º` : '—'])
    };
  }
  // Por clube (a passagem): soma as temporadas seguidas no mesmo clube.
  const grupos: { clube: string; de: number; ate: number; ts: Temporada[]; emprestado?: string }[] = [];
  for (const t of ts) {
    const ult = grupos[grupos.length - 1];
    if (ult && ult.clube === t.clube && ult.emprestado === t.emprestado) { ult.ate = t.ano; ult.ts.push(t); }
    else grupos.push({ clube: t.clube, de: t.ano, ate: t.ano, ts: [t], emprestado: t.emprestado });
  }
  const anos = (g: { de: number; ate: number }) => (g.de === g.ate ? String(g.de) : `${g.de}–${g.ate}`);
  const nome = (g: { clube: string; emprestado?: string }) => `${g.clube}${g.emprestado ? ` (emprestado pelo ${g.emprestado})` : ''}`;
  const soma = (xs: Temporada[], f: (t: Temporada) => number) => xs.reduce((a, t) => a + f(t), 0);
  if (e.modalidade === 'basquete') {
    return {
      agrupado: 'clube', colunas: ['Equipe', 'Anos', 'Jogos', 'Titular', 'Pontos/j', 'Rebotes/j', 'Assist./j'],
      linhas: grupos.map(g => {
        const j = soma(g.ts, t => t.partidas) || 1;
        const pj = (f: (t: Temporada) => number) => virgula(soma(g.ts, t => f(t) * t.partidas) / j);
        return [nome(g), anos(g), String(soma(g.ts, t => t.partidas)), String(soma(g.ts, t => t.titular)), pj(t => t.pontos ?? 0), pj(t => t.rebotes ?? 0), pj(t => t.assistencias)];
      })
    };
  }
  if (e.modalidade === 'futebol') {
    const def = !!e.posicao && ['goleiro', 'zagueiro', 'volante', 'lateral'].includes(e.posicao);
    return {
      agrupado: 'clube', colunas: ['Clube', 'Anos', 'Jogos', 'Titular', 'Gols', 'Assist.', ...(def ? [e.posicao === 'goleiro' ? 'Sem sofrer gol' : 'Desarmes'] : [])],
      linhas: grupos.map(g => [nome(g), anos(g), String(soma(g.ts, t => t.partidas)), String(soma(g.ts, t => t.titular)), String(soma(g.ts, t => t.gols)), String(soma(g.ts, t => t.assistencias)), ...(def ? [String(soma(g.ts, t => t.defesa ?? 0))] : [])])
    };
  }
  return { agrupado: 'clube', colunas: ['Equipe', 'Anos', 'Jogos', 'Titular'], linhas: grupos.map(g => [nome(g), anos(g), String(soma(g.ts, t => t.partidas)), String(soma(g.ts, t => t.titular))]) };
}

const CIRCUITO_CURTO = ['', 'nacional', 'entrada internacional', 'challengers', 'principal'];
const NIVEL_INDIVIDUAL = ['', 'regional', 'nacional de acesso', 'nacional', 'elite nacional'];

/** A carreira inteira em uma frase (totais), no idioma da modalidade. */
export function resumoDaCarreira(e: CarreiraEsportiva): string {
  const ts = e.temporadas ?? [];
  if (!ts.length) return '';
  const p = perfilDe(e.modalidade);
  const anos = um(ts.length, e.modalidade === 'tenis' ? ['ano de circuito', 'anos de circuito'] : ['temporada', 'temporadas']);
  const soma = (f: (t: Temporada) => number) => ts.reduce((a, t) => a + f(t), 0);
  if (e.modalidade === 'tenis') {
    const melhor = Math.min(...ts.map(t => t.ranking ?? 9999));
    const premios = soma(t => t.premio ?? 0);
    const titulos = soma(t => t.titulos ?? 0);
    return `${anos}, ${soma(t => t.vitorias ?? 0)} vitórias e ${soma(t => t.derrotas ?? 0)} derrotas${titulos ? `, ${um(titulos, ['título', 'títulos'])}` : ''}${soma(t => t.finais ?? 0) > titulos ? `, ${soma(t => t.finais ?? 0)} finais` : ''}${melhor < 9999 ? `, melhor ranking ${melhor}º` : ''}${premios ? `, ${dinheiro(premios)} em prêmios` : ''}`;
  }
  const equipes = new Set(ts.map(t => t.clube)).size;
  if (p.estrutura === 'equipe') return `${anos}, ${um(soma(t => t.partidas), p.disputas)}, ${um(soma(t => t.gols), ['pódio', 'pódios'])}`;
  const jogos = soma(t => t.partidas);
  const casa = um(equipes, e.modalidade === 'futebol' ? ['clube', 'clubes'] : ['equipe', 'equipes']);
  if (e.modalidade === 'futebol') return `${anos}, ${casa}, ${um(jogos, p.disputas)}, ${um(soma(t => t.gols), ['gol', 'gols'])}`;
  if (e.modalidade === 'basquete') return `${anos}, ${casa}, ${um(jogos, p.disputas)}, ${virgula(soma(t => (t.pontos ?? 0) * t.partidas) / (jogos || 1))} pontos por jogo`;
  return `${anos}, ${casa}, ${um(jogos, p.disputas)}`;
}
