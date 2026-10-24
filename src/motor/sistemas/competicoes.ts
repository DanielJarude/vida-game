/**
 * REWORK 11 · ESP-11.3/11.4 — AS COMPETIÇÕES do futebol, com id estável.
 *
 * Antes, o jogador só disputava a liga (o nome dela, lido do país de HOJE), e o resto era genérico: "o torneio
 * mundial de seleções", "copa nacional" (sem fases), nenhuma copa continental. Agora:
 *
 *   CompeticaoId       o id que fica gravado (temporada, palmarés): `liga:BR:4`, `copa:ES`, `cont:CONMEBOL`,
 *                      `sel:mundial`, `sel:UEFA`. O NOME é apresentação (`nomeDaCompeticao`): renomear um torneio não
 *                      mexe em nada guardado.
 *   liga nacional      os nomes reais das divisões do perfil do país (já existiam).
 *   copa nacional      mata-mata com todos os clubes do país (o catálogo e os de fora dele), da primeira fase à final.
 *   continental        a copa de clubes da confederação (Libertadores, Champions League — só onde o nome é
 *                      inequívoco; senão, dita pelo que é). A vaga sai da colocação na elite do ano ANTERIOR
 *                      (`ligas.vagasContinentais`).
 *   seleções           a Copa do Mundo e o torneio continental (Copa América, Eurocopa...), com a força do país.
 *
 * As campanhas são JOGADAS fase a fase: cada adversário tem força (a mesma régua da liga, `ligas.forcaNaLiga`, + a
 * força da liga do país dele nas copas continentais), e cada jogo sai da diferença de forças (`partida`). O acaso das
 * copas da vida vem de `rngDe` (o gerador principal não muda por causa delas). Nenhuma marca ou emblema é usado.
 */

import { clamp, rngDe, type Rng } from '../rng';
import type { Dominio, FaseDeCopa, Vida } from '../tipos';
import { clubesDoPais, divisaoDoNivel } from '../dados/clubes';
import { paisDoCatalogo, temPerfil, perfilDoPais } from '../mundo/registro';
import { forcaNaLiga, ligaDe } from './ligas';

export type CompeticaoId = string;
export type Confederacao = 'CONMEBOL' | 'UEFA' | 'CONCACAF' | 'CAF' | 'AFC' | 'OFC';

export const idDaLiga = (pais: string, nivel: number): CompeticaoId => `liga:${pais}:${nivel}`;
export const idDaCopa = (pais: string): CompeticaoId => `copa:${pais}`;
export const idContinental = (c: Confederacao): CompeticaoId => `cont:${c}`;
export const idDaSelecao = (tipo: 'mundial' | Confederacao): CompeticaoId => `sel:${tipo}`;

/** A confederação do país (pela região do catálogo; a Austrália joga na Ásia). */
export function confederacaoDe(pais: string): Confederacao {
  if (pais === 'AU') return 'AFC';
  const reg = paisDoCatalogo(pais)?.regiao;
  return reg === 'america_sul' ? 'CONMEBOL' : reg === 'europa' ? 'UEFA' : reg === 'america_norte' || reg === 'america_central_caribe' ? 'CONCACAF' : reg === 'africa' ? 'CAF' : reg === 'asia' ? 'AFC' : 'OFC';
}

/** Os nomes das copas nacionais onde o nome é inequívoco (o resto: "a copa nacional"). */
const COPAS: Record<string, string> = { BR: 'Copa do Brasil', ES: 'Copa del Rey', IT: 'Coppa Italia', GB: 'FA Cup', DE: 'DFB-Pokal', FR: 'Coupe de France', PT: 'Taça de Portugal', AR: 'Copa Argentina', US: 'U.S. Open Cup', JP: 'Copa do Imperador' };
const CONTINENTAIS: Partial<Record<Confederacao, string>> = { CONMEBOL: 'Copa Libertadores', UEFA: 'Champions League' };
const SELECOES: Record<'mundial' | Confederacao, string> = { mundial: 'Copa do Mundo', CONMEBOL: 'Copa América', UEFA: 'Eurocopa', CONCACAF: 'Copa Ouro', CAF: 'Copa Africana de Nações', AFC: 'Copa da Ásia', OFC: 'torneio continental de seleções da Oceania' };

/** O nome de uma competição (sem artigo): a apresentação do id. */
export function nomeDaCompeticao(id: CompeticaoId): string {
  const [tipo, a, b] = id.split(':');
  if (tipo === 'liga') return divisaoDoNivel(Number(b), a) || 'liga nacional';
  if (tipo === 'copa') return COPAS[a] ?? 'copa nacional';
  if (tipo === 'cont') return CONTINENTAIS[a as Confederacao] ?? `copa continental de clubes da ${a}`;
  if (tipo === 'sel') return SELECOES[a as 'mundial' | Confederacao] ?? 'torneio de seleções';
  return id;
}
/** Com artigo ("a Copa do Brasil", "o torneio continental..."). Todas as copas nomeadas são femininas. */
export const aCompeticaoId = (id: CompeticaoId) => { const n = nomeDaCompeticao(id); return /^(torneio|campeonato)/.test(n) ? `o ${n}` : `a ${n}`; };
export const daCompeticaoId = (id: CompeticaoId) => aCompeticaoId(id).replace(/^o /, 'do ').replace(/^a /, 'da ');
export const naCompeticaoId = (id: CompeticaoId) => aCompeticaoId(id).replace(/^o /, 'no ').replace(/^a /, 'na ');

/** O torneio de seleções de futebol do ano (no calendário de sempre: o mundial nos anos pares não múltiplos de 4; o continental nos múltiplos de 4). */
export function torneioDeSelecoes(pais: string, ano: number): CompeticaoId | undefined {
  return ano % 4 === 2 ? idDaSelecao('mundial') : ano % 4 === 0 ? idDaSelecao(confederacaoDe(pais)) : undefined;
}

/* ------------------------------------------------------------ O jogo */

/**
 * Uma partida pela diferença de forças (na escala da tabela: 1 = uma divisão inteira de diferença). A mesma curva do
 * banco do técnico (`tecnico.partida`: 3 pontos de "força de jogo" por divisão), com o empate mais provável entre iguais.
 */
export function partidaDeCopa(r: Rng, dif: number): 'v' | 'e' | 'd' {
  const x = dif * 3;
  const pE = 0.28 - 0.1 * Math.min(1, Math.abs(x) / 8);
  const pV = (1 - pE) / (1 + Math.exp(-x / 3.5));
  const u = r.next();
  return u < pV ? 'v' : u < pV + pE ? 'e' : 'd';
}
/** No mata-mata, o empate vai aos pênaltis (um pouco a favor de quem é melhor). */
const passaNosPenaltis = (r: Rng, dif: number) => r.chance(clamp(0.5 + dif * 0.05, 0.35, 0.65));

/** A força de um clube numa copa: a régua da liga (o porte), e — nas continentais — a força da liga do país dele. */
const FORCA_DA_LIGA: Record<string, number> = { GB: 0.6, ES: 0.6, DE: 0.5, IT: 0.5, FR: 0.3, PT: 0.15, BR: 0.3, AR: 0.2, MX: 0, US: -0.1, CO: -0.1, UY: -0.15, CL: -0.2, PE: -0.35, JP: -0.1, KR: -0.15, CN: -0.3, MA: -0.2 };
export const forcaDaLigaDoPais = (pais: string) => FORCA_DA_LIGA[pais] ?? -0.5;

export interface Campanha { id: CompeticaoId; fase: FaseDeCopa; jogos: number; v: number; e: number; d: number; final?: { adversario: string; placar: string }; adversarios: string[] }

const FASES: FaseDeCopa[] = ['primeira fase', 'oitavas', 'quartas', 'semifinal', 'vice', 'campeão'];

/** Um adversário da fase `k` (0 = primeira fase): no começo, quem estiver no caminho; perto da final, os mais fortes. */
export function sortearAdversarioDeCopa(r: Rng, lista: { nome: string; forca: number }[], k: number, ja: Set<string>, anonimo: () => { nome: string; forca: number }): { nome: string; forca: number } {
  return adversario(r, lista, k, ja, anonimo);
}
function adversario(r: Rng, lista: { nome: string; forca: number }[], k: number, ja: Set<string>, anonimo: () => { nome: string; forca: number }): { nome: string; forca: number } {
  const livres = lista.filter(x => !ja.has(x.nome));
  if (!livres.length || r.chance(Math.max(0, 0.55 - k * 0.18))) return anonimo();
  const pesos = livres.map(x => Math.exp(x.forca * k * 0.7));
  let u = r.next() * pesos.reduce((s, p) => s + p, 0);
  for (let i = 0; i < livres.length; i++) { u -= pesos[i]; if (u <= 0) return livres[i]; }
  return livres[livres.length - 1];
}

/** O placar de um jogo já decidido (coerente com v/e/d), para o texto não afirmar o que não houve. */
export function placarDe(r: Rng, res: 'v' | 'e' | 'd'): [number, number] {
  const a = r.int(0, 2), b = r.int(0, 2);
  if (res === 'e') return [a, a];
  const lo = Math.min(a, b), hi = Math.max(a, b) + (a === b ? 1 : 0);
  return res === 'v' ? [hi, lo] : [lo, hi];
}

/**
 * Uma campanha de mata-mata (jogo único por fase; a fase de grupos, nas continentais, são três jogos e passa quem
 * soma quatro pontos — ou três, com sorte no saldo). `forca`: a do clube da vida naquele ano.
 */
function jogarCampanha(r: Rng, id: CompeticaoId, forca: number, lista: { nome: string; forca: number }[], comGrupos: boolean, anonimo: () => { nome: string; forca: number }): Campanha {
  const c: Campanha = { id, fase: 'primeira fase', jogos: 0, v: 0, e: 0, d: 0, adversarios: [] };
  const ja = new Set<string>();
  const conta = (x: 'v' | 'e' | 'd') => { c.jogos++; c[x]++; };
  if (comGrupos) {
    let pts = 0;
    for (let k = 0; k < 3; k++) { const a = adversario(r, lista, 0, ja, anonimo); ja.add(a.nome); const x = partidaDeCopa(r, forca - a.forca); conta(x); pts += x === 'v' ? 3 : x === 'e' ? 1 : 0; }
    if (!(pts >= 4 || (pts === 3 && r.chance(0.4)))) return c;
  }
  for (let k = comGrupos ? 1 : 0; k <= 4; k++) {
    const a = adversario(r, lista, k, ja, anonimo);
    ja.add(a.nome);
    c.adversarios.push(a.nome);
    const x = partidaDeCopa(r, forca - a.forca);
    conta(x);
    const passou = x === 'v' || (x === 'e' && passaNosPenaltis(r, forca - a.forca));
    if (k === 4) {
      const [p, q] = placarDe(r, x);
      c.final = { adversario: a.nome, placar: `${p} a ${q}${x === 'e' ? `, ${passou ? 'vitória' : 'derrota'} nos pênaltis` : ''}` };
      c.fase = passou ? 'campeão' : 'vice';
      return c;
    }
    if (!passou) { c.fase = FASES[k]; return c; }
    c.fase = FASES[k + 1];
  }
  return c;
}

/** Os clubes do país com a força de cada um na copa nacional (os da elite, os de acesso, os regionais). */
function clubesNaCopa(v: Vida, pais: string, excluir: string): { nome: string; forca: number }[] {
  const liga = ligaDe(v, pais);
  return clubesDoPais(pais).filter(c => c.nome !== excluir).map(c => ({ nome: c.nome, forca: forcaNaLiga(c.nome, pais, liga.div[c.nome] ?? 2) }));
}

/**
 * A copa nacional do clube da vida no ano (quem joga as divisões nacionais: nível ≥ 2). `ajuste`: a contribuição de
 * quem joga (a mesma da liga). Devolve a campanha (ou nada, se o país não tem futebol de clubes no jogo).
 */
export function copaNacional(v: Vida, pais: string, ano: number, clube: string, nivel: number, ajuste: number): Campanha | undefined {
  if (nivel < 2 || !clubesDoPais(pais).length) return undefined;
  const r = rngDe(v.id, 'copa', pais, ano, clube);
  const forca = forcaNaLiga(clube, pais, nivel) + ajuste + r.normal() * 0.35;
  return jogarCampanha(r, idDaCopa(pais), forca, clubesNaCopa(v, pais, clube), false, () => ({ nome: 'um time das divisões de baixo', forca: 1 + r.next() }));
}

/** O clube foi à copa continental deste ano? (Terminou nas vagas da elite na temporada anterior.) */
export function classificadoParaContinental(v: Vida, pais: string, ano: number, clube: string): boolean {
  const u = ligaDe(v, pais).ultima;
  return !!u && u.ano === ano - 1 && (u.classificados ?? []).includes(clube);
}

/** Os adversários continentais: os clubes fortes dos outros países da mesma confederação (o catálogo carregado). */
function clubesDoContinente(conf: Confederacao, paisDoClube: string): { nome: string; forca: number }[] {
  const out: { nome: string; forca: number }[] = [];
  for (const p of ['BR', 'AR', 'UY', 'CL', 'CO', 'PE', 'ES', 'IT', 'GB', 'DE', 'FR', 'PT', 'MX', 'US', 'CA', 'CR', 'DO', 'MA', 'ZA', 'NG', 'AO', 'KE', 'JP', 'KR', 'CN', 'IN', 'AU', 'NZ']) {
    if (p === paisDoClube || !temPerfil(p) || confederacaoDe(p) !== conf) continue;
    for (const c of clubesDoPais(p).filter(x => x.porte !== 'regional')) out.push({ nome: c.nome, forca: forcaNaLiga(c.nome, p) + forcaDaLigaDoPais(p) });
  }
  // Os do próprio país também jogam (as outras vagas da liga).
  for (const c of clubesDoPais(paisDoClube).filter(x => x.porte === 'grande')) out.push({ nome: c.nome, forca: forcaNaLiga(c.nome, paisDoClube) + forcaDaLigaDoPais(paisDoClube) });
  return out;
}

/** A copa continental de clubes do ano (só quem se classificou na temporada anterior). */
export function copaContinental(v: Vida, pais: string, ano: number, clube: string, ajuste: number): Campanha | undefined {
  if (!classificadoParaContinental(v, pais, ano, clube)) return undefined;
  const conf = confederacaoDe(pais);
  const r = rngDe(v.id, 'continental', pais, ano, clube);
  const forca = forcaNaLiga(clube, pais, 4) + forcaDaLigaDoPais(pais) + ajuste + r.normal() * 0.35;
  const lista = clubesDoContinente(conf, pais).filter(x => x.nome !== clube);
  return jogarCampanha(r, idContinental(conf), forca, lista, true, () => ({ nome: 'um campeão de uma liga menor do continente', forca: 3 + forcaDaLigaDoPais('') + r.next() }));
}

/* ------------------------------------------------------------ Seleções */

/**
 * A força de uma seleção no futebol (na escala da tabela): onde o esporte é forte e popular, mais gente boa — a régua
 * de `selecao.concorrenciaNoPais` (popularidade × tamanho), de ~1 (um país pequeno sem tradição) a ~4,8.
 */
export function forcaDaSelecao(pais: string, d: Dominio = 'futebol'): number {
  const pop = temPerfil(pais) ? perfilDoPais(pais).esporte.popularidade[d] ?? 1 : 0.7;
  const tamanho = Math.log10(Math.max(1, paisDoCatalogo(pais)?.populacao ?? 30) / 1000);
  return Math.round(clamp(1.2 + (pop - 0.6) * 3.2 + tamanho * 0.45, 0.8, 4.8) * 100) / 100;
}

/**
 * A campanha de uma seleção num torneio (três jogos de grupo e o mata-mata), pela força do país contra a do campo do
 * torneio — o Brasil e San Marino não têm a mesma chance. `extra`: o quanto quem joga acrescenta (ninguém ganha sozinho).
 */
export function campanhaDaSelecao(r: Rng, id: CompeticaoId, pais: string, extra: number, d: Dominio = 'futebol'): Campanha {
  const mundial = id === idDaSelecao('mundial') || id.endsWith(':mundial');
  const forca = forcaDaSelecao(pais, d) + extra + r.normal() * 0.3;
  // O campo do torneio: no mundial, o mundo inteiro (a média sobe a cada fase); no continental, o continente.
  const media = mundial ? 3.1 : confederacaoDe(pais) === 'UEFA' || confederacaoDe(pais) === 'CONMEBOL' ? 3.2 : 2.6;
  const campo = (k: number) => ({ nome: 'uma seleção', forca: media - 0.6 + k * 0.35 + r.normal() * 0.5 });
  const c: Campanha = { id, fase: 'primeira fase', jogos: 0, v: 0, e: 0, d: 0, adversarios: [] };
  const conta = (x: 'v' | 'e' | 'd') => { c.jogos++; c[x]++; };
  let pts = 0;
  for (let k = 0; k < 3; k++) { const x = partidaDeCopa(r, forca - campo(0).forca); conta(x); pts += x === 'v' ? 3 : x === 'e' ? 1 : 0; }
  if (!(pts >= 4 || (pts === 3 && r.chance(0.5)))) return c;
  for (let k = 1; k <= 4; k++) {
    const a = campo(k);
    const x = partidaDeCopa(r, forca - a.forca);
    conta(x);
    const passou = x === 'v' || (x === 'e' && passaNosPenaltis(r, forca - a.forca));
    if (k === 4) { c.fase = passou ? 'campeão' : 'vice'; return c; }
    if (!passou) { c.fase = FASES[k]; return c; }
    c.fase = FASES[k + 1];
  }
  return c;
}

/** A fase em palavras ("caiu nas quartas", "foi campeã") — o texto da campanha de uma seleção. */
export const faseDaSelecaoEmPalavras = (f: FaseDeCopa) => ({ 'primeira fase': 'caiu na fase de grupos', oitavas: 'caiu nas oitavas', quartas: 'caiu nas quartas', semifinal: 'caiu na semifinal', vice: 'perdeu a final', campeão: 'foi campeã' } as Record<FaseDeCopa, string>)[f];
/** A fase em palavras para um clube ("parou nas quartas", "vice", "campeão"). */
export const faseDoClubeEmPalavras = (f: FaseDeCopa) => ({ 'primeira fase': 'caiu na primeira fase', oitavas: 'parou nas oitavas', quartas: 'parou nas quartas', semifinal: 'parou na semifinal', vice: 'chegou à final e perdeu', campeão: 'foi campeão' } as Record<FaseDeCopa, string>)[f];

/** Um id estável de troféu (a galeria do REWORK 11.5 lê por ele): a competição, o ano e o clube. */
export const trofeuIdDe = (competicaoId: CompeticaoId, ano: number, clube?: string) => `${competicaoId}:${ano}${clube ? `:${clube.replace(/[^A-Za-z0-9]+/g, '-').toLowerCase()}` : ''}`;

/** Um nome de competição antigo (string) → o id, quando dá para saber (o palmarés dos saves de antes). */
export function idPeloNome(pais: string, nome: string): CompeticaoId | undefined {
  for (let n = 4; n >= 1; n--) if (divisaoDoNivel(n, pais) === nome) return idDaLiga(pais, n);
  return undefined;
}

