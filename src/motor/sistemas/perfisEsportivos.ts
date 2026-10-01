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
import { formatarMarca, melhorMarca, naProva, NOME_FUNCAO_VOLEI, numeroDaFuncao, podiosDe, producaoVolei, type FuncaoVolei } from './provas';

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
/**
 * As palavras do mercado de cada modalidade (FIX final da generalização): as
 * decisões de contrato, proposta e treinador consultam aqui, em vez de falar
 * a língua do futebol para todos. O futebol tem clube, estádio, banco e
 * escalação; basquete e vôlei têm equipe e ginásio; natação, atletismo e luta
 * têm equipe, a prova principal e o lugar onde se treina.
 */
export function mercadoEsportivo(d: Dominio) {
  const fut = d === 'futebol';
  const individual = perfilDe(d).estrutura !== 'clube';
  const casa = fut ? 'estádio' : d === 'natacao' ? 'parque aquático' : d === 'atletismo' ? 'pista' : d === 'lutas' ? 'centro de treinamento' : 'ginásio';
  return {
    o: fut ? 'o clube' : 'a equipe', O: fut ? 'O clube' : 'A equipe', um: fut ? 'um clube' : 'uma equipe', outro: fut ? 'outro clube' : 'outra equipe',
    nenhum: fut ? 'Nenhum clube' : 'Nenhuma equipe', maior: fut ? 'um clube maior' : 'uma equipe maior', menor: fut ? 'um clube menor' : 'uma equipe menor',
    mesmo: fut ? 'Um clube do mesmo tamanho' : 'Uma equipe do mesmo nível', pequeno: fut ? 'clube pequeno' : 'equipe pequena', no: fut ? 'no clube' : 'na equipe', do: fut ? 'do clube' : 'da equipe',
    time: fut ? 'no time' : 'na equipe', casa,
    amador: ({ futebol: 'o futebol amador', basquete: 'o basquete amador', volei: 'o vôlei amador' } as Partial<Record<Dominio, string>>)[d] ?? 'as competições amadoras',
    /** Ficar de fora: o banco no coletivo; nas individuais, ficar fora da prova principal. */
    banco: individual ? 'fora da prova principal' : 'no banco',
    assinatura: individual ? 'Mais uma assinatura com a equipe.' : 'Mais uma assinatura, mais uma foto com a camisa.',
    descer: fut ? 'Estádio menor, gramado pior — e o seu nome na escalação.' : individual ? 'Equipe menor, calendário mais curto — e você nas provas principais.' : 'Ginásio menor, viagem de ônibus — e o seu nome entre os titulares.',
    apresentacao: `Apresentação ${fut ? 'no estádio novo, camisa nova' : individual ? 'na equipe nova, uniforme novo' : 'no ginásio novo, camisa nova'}`,
    reserva: individual ? 'Nos treinos seguintes, você ficou no grupo de trás.' : 'Nos treinos seguintes, você ficou no time reserva.',
    entraTitular: individual ? 'Na competição seguinte, seu nome estava na prova principal.' : 'No jogo seguinte, seu nome estava entre os titulares.'
  };
}

/**
 * A porta tardia de cada modalidade (a rota amadora), nas palavras dela: o
 * campeonato amador no futebol, a liga amadora no basquete e no vôlei, a
 * prova aberta da federação no atletismo, o torneio aberto na luta.
 */
export function portaAmadora(d: Dominio): { onde: string; quem: string; elenco: string } {
  if (d === 'futebol') return { onde: 'o campeonato amador', quem: 'Num jogo do campeonato amador da cidade, um auxiliar', elenco: 'o elenco adulto' };
  if (d === 'atletismo') return { onde: 'as provas abertas da federação', quem: 'Numa prova aberta da federação, o técnico', elenco: 'a equipe adulta' };
  if (d === 'lutas') return { onde: 'os torneios abertos', quem: 'Num torneio aberto, o técnico', elenco: 'a equipe adulta' };
  return { onde: 'a liga amadora', quem: 'Num jogo da liga amadora, o técnico', elenco: 'o elenco adulto' };
}
const DA_PORTA: Record<string, string> = { 'o campeonato amador': 'do campeonato amador', 'as provas abertas da federação': 'das provas abertas da federação', 'os torneios abertos': 'dos torneios abertos', 'a liga amadora': 'da liga amadora' };
const PELA_PORTA: Record<string, string> = { 'o campeonato amador': 'pelo campeonato amador', 'as provas abertas da federação': 'pelas provas abertas da federação', 'os torneios abertos': 'pelos torneios abertos', 'a liga amadora': 'pela liga amadora' };
export const daPorta = (d: Dominio) => DA_PORTA[portaAmadora(d).onde];
export const pelaPorta = (d: Dominio) => PELA_PORTA[portaAmadora(d).onde];

/** "sem clube" só onde há clube: o nadador fica sem equipe; o tenista, sem quem banque o circuito. */
export const semVinculo = (d: Dominio) => (perfilDe(d).estrutura === 'clube' ? 'sem clube' : perfilDe(d).estrutura === 'equipe' ? 'sem equipe' : 'sem quem banque o circuito');

const um = (n: number, [s, p]: [string, string]) => `${n} ${n === 1 ? s : p}`;

/** "do estadual", "da Série A", "do NBB", "do circuito nacional", "das competições regionais" — o artigo certo de cada competição. */
export const daCompeticao = (c: string) => (c === 'campeonato estadual' ? 'do estadual' : /^(divisões|competições)/.test(c) ? `das ${c}` : /^(NBB|circuito|campeonato|torneio)/.test(c) ? `do ${c}` : `da ${c}`);
/** "a Série A", "o NBB", "as divisões de acesso", "o estadual". */
export const aCompeticao = (c: string) => daCompeticao(c).replace(/^do /, 'o ').replace(/^da /, 'a ').replace(/^das /, 'as ').replace(/^dos /, 'os ');
const virgula = (x: number, casas = 1) => String(Math.round(x * 10 ** casas) / 10 ** casas).replace('.', ',');

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
    producao = clamp(podiosDe(t) / Math.max(1, t.partidas * 0.35), 0, 2);
    coletivo = t.colocacao === 1 ? 6 : t.colocacao <= 3 ? 3 : 0;
  } else if (e.modalidade === 'volei' && t.volei) producao = producaoVolei(t);
  else producao = clamp(t.nota / 6.5, 0, 2);
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
  if (p.estrutura === 'equipe' && e.modalidade === 'lutas') {
    // A luta: o cartel ano a ano (temporadas antigas, sem cartel, mostram só os pódios).
    return {
      agrupado: 'ano', colunas: ['Ano', 'Nível', 'Categoria', 'Eventos', 'V–D', 'Antes do tempo', 'Títulos', 'Pódios'],
      linhas: ts.map(t => [String(t.ano), NIVEL_INDIVIDUAL[t.nivel] ?? '', t.luta?.categoria ?? '—', String(t.partidas), t.luta ? `${t.luta.vitorias}–${t.luta.derrotas}` : '—', t.luta ? String(t.luta.antesDoTempo) : '—', t.luta ? String(t.luta.titulos) : '—', String(podiosDe(t))])
    };
  }
  if (p.estrutura === 'equipe') {
    // Natação e atletismo: a prova e a marca do ano (o recorde pessoal marcado), as finais e os pódios.
    return {
      agrupado: 'ano', colunas: ['Ano', 'Nível', 'Prova', 'Marca do ano', 'Competições', 'Finais', 'Pódios', 'Vitórias'],
      linhas: ts.map(t => [String(t.ano), NIVEL_INDIVIDUAL[t.nivel] ?? '', t.prova?.nome ?? '—', t.prova ? `${formatarMarca(t.prova.unidade, t.prova.marca)}${t.prova.recorde ? ' (RP)' : ''}` : '—', String(t.partidas), t.prova ? String(t.prova.finais) : '—', String(podiosDe(t)), t.prova ? String(t.prova.vitorias) : t.colocacao === 1 ? '1' : '—'])
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
  if (e.modalidade === 'volei') {
    // O vôlei: por equipe, os sets e o que a função produz por set (a função da última temporada da passagem).
    return {
      agrupado: 'clube', colunas: ['Equipe', 'Anos', 'Jogos', 'Titular', 'Função', 'Sets', 'Pontos/set', 'Bloqueios/set', 'Aces', 'Defesas/set'],
      linhas: grupos.map(g => {
        const vs = g.ts.filter(t => t.volei);
        const sets = soma(vs, t => t.volei!.sets) || 1;
        const ps = (f: (t: Temporada) => number, casas = 1) => (vs.length ? virgula(soma(vs, f) / sets, casas) : '—');
        const fn = vs[vs.length - 1]?.funcao as FuncaoVolei | undefined;
        return [nome(g), anos(g), String(soma(g.ts, t => t.partidas)), String(soma(g.ts, t => t.titular)), fn ? NOME_FUNCAO_VOLEI[fn] ?? fn : '—', vs.length ? String(soma(vs, t => t.volei!.sets)) : '—', ps(t => t.volei!.pontos), ps(t => t.volei!.bloqueios, 2), vs.length ? String(soma(vs, t => t.volei!.aces)) : '—', ps(t => t.volei!.defesas)];
      })
    };
  }
  return { agrupado: 'clube', colunas: ['Equipe', 'Anos', 'Jogos', 'Titular'], linhas: grupos.map(g => [nome(g), anos(g), String(soma(g.ts, t => t.partidas)), String(soma(g.ts, t => t.titular))]) };
}

const CIRCUITO_CURTO = ['', 'nacional', 'entrada internacional', 'challengers', 'principal'];
const NIVEL_INDIVIDUAL = ['', 'regional', 'nacional de acesso', 'nacional', 'elite nacional'];

/** Os números do vôlei somados (a recepção, a média das temporadas). */
function somaVolei(vs: Temporada[]): Partial<NonNullable<Temporada['volei']>> {
  const k = (f: (x: NonNullable<Temporada['volei']>) => number) => vs.reduce((a, t) => a + f(t.volei!), 0);
  const rec = vs.filter(t => t.volei!.recepcao !== undefined);
  return { pontos: k(x => x.pontos), bloqueios: k(x => x.bloqueios), aces: k(x => x.aces), levantamentos: k(x => x.levantamentos), defesas: k(x => x.defesas), ...(rec.length ? { recepcao: Math.round(rec.reduce((a, t) => a + t.volei!.recepcao!, 0) / rec.length) } : {}) };
}

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
  if (p.estrutura === 'equipe') {
    const podios = um(soma(podiosDe), ['pódio', 'pódios']);
    const lutas = ts.filter(t => t.luta);
    if (lutas.length) {
      const l = (f: (x: NonNullable<Temporada['luta']>) => number) => lutas.reduce((a, t) => a + f(t.luta!), 0);
      const titulos = l(x => x.titulos);
      return `${anos}, ${um(soma(t => t.partidas), ['evento', 'eventos'])}, cartel de ${l(x => x.vitorias)} vitórias (${l(x => x.antesDoTempo)} antes do tempo) e ${l(x => x.derrotas)} derrotas${titulos ? `, ${um(titulos, ['título', 'títulos'])}` : ''}, ${podios}; ${lutas[lutas.length - 1].luta!.categoria}`;
    }
    const provas = ts.filter(t => t.prova);
    if (provas.length) {
      // O recorde pessoal: a melhor marca da carreira na prova principal (a mais disputada).
      const nomes = provas.map(t => t.prova!.nome);
      const principal = nomes.sort((a, b) => nomes.filter(x => x === b).length - nomes.filter(x => x === a).length)[0];
      const daProva = provas.filter(t => t.prova!.nome === principal);
      const rp = daProva.reduce((a, t) => (melhorMarca(t.prova!, a.prova!.marca, t.prova!.marca) === t.prova!.marca && t.prova!.marca !== a.prova!.marca ? t : a));
      const finais = provas.reduce((a, t) => a + t.prova!.finais, 0);
      return `${anos} ${p.modalidade === 'natacao' ? `nadando os ${principal}` : `competindo ${naProva(principal)}`}, recorde pessoal de ${formatarMarca(rp.prova!.unidade, rp.prova!.marca)} (${rp.ano}), ${um(soma(t => t.partidas), p.disputas)}, ${um(finais, ['final', 'finais'])}, ${podios}`;
    }
    return `${anos}, ${um(soma(t => t.partidas), p.disputas)}, ${podios}`;
  }
  const jogos = soma(t => t.partidas);
  const casa = um(equipes, e.modalidade === 'futebol' ? ['clube', 'clubes'] : ['equipe', 'equipes']);
  if (e.modalidade === 'futebol') return `${anos}, ${casa}, ${um(jogos, p.disputas)}, ${um(soma(t => t.gols), ['gol', 'gols'])}`;
  if (e.modalidade === 'basquete') return `${anos}, ${casa}, ${um(jogos, p.disputas)}, ${virgula(soma(t => (t.pontos ?? 0) * t.partidas) / (jogos || 1))} pontos por jogo`;
  const vs = ts.filter(t => t.volei);
  if (e.modalidade === 'volei' && vs.length) {
    const fn = vs[vs.length - 1].funcao as FuncaoVolei;
    const sets = vs.reduce((a, t) => a + t.volei!.sets, 0);
    return `${anos}, ${casa}, ${um(jogos, p.disputas)}, ${sets} sets como ${NOME_FUNCAO_VOLEI[fn] ?? fn}: ${numeroDaFuncao({ ...vs[0], funcao: fn, volei: { sets, pontos: 0, bloqueios: 0, aces: 0, levantamentos: 0, defesas: 0, ...somaVolei(vs) } })}`;
  }
  return `${anos}, ${casa}, ${um(jogos, p.disputas)}`;
}
