/**
 * VIDA 32 · A SUA ORGANIZAÇÃO DE E-SPORTS — comprar uma organização que já existe (as do catálogo de cada jogo, nos anos
 * em que existiam, e outras fictícias por região) ou fundar uma do zero, e dirigi-la como dono: o elenco (titulares e
 * banco, com a função de cada um e os MESMOS arquétipos do jogador de e-sports da vida — Entry fragger, IGL, AWPer,
 * Suporte, Clutch…), o técnico, o IGL, o mercado (em faixas: reforços acima do elenco, do nível, apostas, a estrela), a
 * academia, o patrocínio, o bootcamp, o conteúdo e o streaming, e a mesa do dono (os assuntos do ano com a torcida, o
 * técnico e os jogadores).
 *
 * A temporada (uma por ano, na virada): a liga regional do degrau (os nomes reais de cada jogo e época — `jogos25`), a
 * colocação pela força do time contra o campo, acesso e queda; as do topo vão ao torneio mundial do jogo. Prêmios,
 * patrocínio, conteúdo, salários, a operação, os fãs e o nome da organização andam com o resultado. Os títulos vão para
 * a galeria de troféus.
 *
 * Abstrações de jogo: receitas, salários e valores (reais de 2026, ordem de grandeza do cenário brasileiro; fora do
 * Brasil, o mercado é maior). Os nomes reais de organizações vêm só do catálogo (`equipesReais29`), respeitando os anos;
 * nenhuma marca, nenhum logotipo, nenhum resultado real. Os jogadores são todos fictícios.
 *
 * Todo sorteio é derivado (`rngDe(v.id, …)`): nada aqui mexe na sequência do resto da vida.
 */
import { clamp, rngDe, type Rng } from '../../rng';
import type { Vida } from '../../tipos';
import { escrever, idade } from '../../nucleo';
import { anoDe } from '../../tempo';
import { dinheiro as fmt } from '../../texto';
import { bloqueio, PERMITIDO, type Veredito } from '../../plausibilidade';
import { pagar } from '../../sistemas/dinheiro';
import { lancar } from '../../sistemas/extrato';
import { registrarMotivoDoNome } from '../../sistemas/notoriedade';
import { sortearNome, sortearSobrenome } from '../../dados/nomes';
import { efeitosDoPerfil, lerPerfil, type LeituraDoPerfil, type PerfilEmergente } from '../../sistemas/arquetipos';
import { JOGOS25, LISTA_JOGOS25, type AtributoEsports, type JogoId } from '../../v25/esports/jogos25';
import { EQUIPES_REAIS29 } from '../../v25/esports/equipesReais29';

/* ------------------------------------------------------------------ o estado */

export type Regiao31 = 'BR' | 'INT';
/** O degrau da liga em que a organização joga: 2 cenário aberto · 3 segunda divisão · 4 liga principal (o topo vai ao mundial). */
export type Divisao31 = 2 | 3 | 4;

export interface JogadorOrg31 {
  id: string; nick: string; nome: string; feminino?: boolean;
  /** Mês absoluto do nascimento (a mesma régua de `v.t`). */
  tNasc: number;
  funcao: string; forca: number; potencial: number;
  /** Salário por ano. */
  salario: number;
  contratoAte: number;
  daAcademia?: boolean;
}
export interface TemporadaOrg31 {
  ano: number; divisao: Divisao31; liga: string; posicao: number; participantes: number;
  mundial?: { nome: string; colocacao: number; participantes: number };
  premio: number; receita: number; despesa: number; caixa: number; forca: number;
  titulo?: boolean; subiu?: boolean; caiu?: boolean; campeaoMundial?: boolean;
}
export interface Trofeu31 { ano: number; nome: string; tipo: 'liga' | 'mundial' }
export interface Tecnico31 { nome: string; nivel: number; salario: number; desde: number }
export interface SituacaoOrg31 {
  id: string; tipo: string; ano: number; titulo: string; texto: string;
  jogadorId?: string; alvoId?: string; valor?: number;
  opcoes: { id: string; texto: string; dica?: string }[];
}
export interface OrgEsports31 {
  nome: string; jogo: JogoId; regiao: Regiao31;
  /** `v.t` da compra ou da fundação. */
  desde: number; fundada?: boolean;
  divisao: Divisao31;
  preco: number; caixa: number; divida: number; valor: number;
  /** 0..100. */
  fas: number; reputacao: number;
  elenco: JogadorOrg31[];
  academia: JogadorOrg31[]; academiaNivel: 0 | 1 | 2;
  tecnico?: Tecnico31; humorTecnico?: number;
  igl?: string;
  patrocinio?: { nome: string; valor: number; ate: number; rep: number };
  /** Conteúdo e streaming: 0 nada · 1 lives semanais · 2 casa de criadores (mais receita e fãs, menos treino). */
  conteudo: 0 | 1 | 2;
  /** O ano (temporada) em que o bootcamp foi feito. */
  bootcamp?: number;
  /** O clima da equipe (−3..+3 na força). */
  moral?: number;
  historico: TemporadaOrg31[]; trofeus: Trofeu31[];
  seq: number; comprados: string[];
  vendas: { nome: string; para: string; valor: number; ano: number }[];
  mesa: SituacaoOrg31[];
  mesaHist: { ano: number; tipo: string; titulo: string; texto: string; opcao?: string; ignorado?: boolean }[];
}

/* ------------------------------------------------------------------ as réguas */

const MULT: Record<Regiao31, number> = { BR: 1, INT: 1.7 };
const RECEITA: Record<Divisao31, number> = { 2: 250e3, 3: 1.2e6, 4: 6e6 };
const OPERACAO: Record<Divisao31, number> = { 2: 60e3, 3: 250e3, 4: 900e3 };
const arred = (x: number, a = 1e4) => Math.round(x / a) * a;
const jogo = (id: JogoId) => JOGOS25[id];
export const titularesDoJogo31 = (id: JogoId, ano: number) => jogo(id).porEquipe(ano);
/** A força média do campo do degrau (a régua de `jogos25`); a liga principal internacional é mais forte. */
export const forcaDoCampo31 = (id: JogoId, div: number, regiao: Regiao31 = 'BR') => jogo(id).niveis[clamp(div, 1, 5) - 1].forca + (div === 4 && regiao === 'INT' ? 3 : 0);
export const nomeDaLiga31 = (o: Pick<OrgEsports31, 'jogo' | 'divisao' | 'regiao'>, ano: number) => jogo(o.jogo).niveis[o.divisao - 1].liga(ano, o.regiao === 'BR');
export const nomeDoMundial31 = (id: JogoId, ano: number) => jogo(id).niveis[4].liga(ano, true);
export const NOME_REGIAO31: Record<Regiao31, string> = { BR: 'Brasil', INT: 'Internacional' };
export const NOME_DIVISAO31: Record<Divisao31, string> = { 2: 'Cenário aberto', 3: 'Segunda divisão', 4: 'Liga principal' };

export const salarioDe31 = (forca: number, regiao: Regiao31) => arred(Math.pow(1.12, forca - 50) * 30000 * MULT[regiao], 1000);
export function valorDoJogador31(j: JogadorOrg31, ano: number, regiao: Regiao31, auge: number): number {
  const i = ano - anoDe(j.tNasc);
  const f = i <= auge - 3 ? 1.4 : i <= auge + 1 ? 1.2 : i <= auge + 4 ? 1 : i <= auge + 7 ? 0.6 : 0.3;
  const pot = Math.max(0, j.potencial - j.forca) * (i <= auge ? 0.05 : 0.01);
  return arred(Math.pow(1.14, j.forca - 50) * 15000 * f * (1 + pot) * MULT[regiao]);
}
export function receitaBase31(div: Divisao31, fas: number, reputacao: number, regiao: Regiao31): number {
  return arred(RECEITA[div] * (0.5 + fas / 80) * (0.85 + reputacao / 300) * MULT[regiao]);
}
const receitaConteudo = (o: OrgEsports31) => arred(RECEITA[o.divisao] * [0, 0.15, 0.35][o.conteudo] * MULT[o.regiao] + o.conteudo * 30000 * (0.5 + o.fas / 100));

/* ------------------------------------------------------------------ jogadores */

const NICKS = ['kyo', 'zeta', 'nox', 'drako', 'liz', 'tuca', 'raio', 'mito', 'vex', 'bruma', 'kai', 'sora', 'pira', 'tank', 'guri', 'lumi', 'brisa', 'axe', 'nina', 'cobra', 'faro', 'max', 'yumi', 'ruivo', 'kenji', 'saci', 'pulga', 'orca', 'neon', 'gelo', 'pixel', 'ziggy', 'bento', 'koda', 'shiny', 'tatu', 'jambo', 'quark', 'ravi', 'sapeca', 'mango', 'trama', 'vento', 'iris', 'caju', 'brasa', 'luar', 'kraken'];

function novoJogador(o: OrgEsports31, r: Rng, ano: number, funcao: string, forca: number, idadeJ: number): JogadorOrg31 {
  const feminino = r.chance(0.1);
  const pais = o.regiao === 'BR' ? 'BR' : r.pick(['US', 'DE', 'FR', 'ES', 'GB', 'KR', 'JP', 'SE', 'DK', 'PL', 'AR']);
  const f = clamp(Math.round(forca), 25, 96);
  const pot = clamp(Math.round(f + Math.max(0, jogo(o.jogo).auge + 1 - idadeJ) * (0.8 + r.next() * 1.4)), f, r.chance(0.05) ? 95 : 90);
  o.seq += 1;
  let nome: string;
  try { nome = `${sortearNome(r, feminino ? 'feminino' : 'masculino', ano - idadeJ, pais)} ${sortearSobrenome(r, pais)}`; } catch { nome = `${sortearNome(r, feminino ? 'feminino' : 'masculino', ano - idadeJ)} ${sortearSobrenome(r)}`; }
  return {
    id: `e${o.seq}`, nick: `${r.pick(NICKS)}${r.chance(0.3) ? r.int(1, 99) : ''}`, nome, ...(feminino ? { feminino } : {}),
    tNasc: (ano - idadeJ) * 12 + r.int(0, 11), funcao, forca: f, potencial: pot, salario: salarioDe31(f, o.regiao), contratoAte: ano + r.int(1, 2)
  };
}
const funcoesDoJogo = (id: JogoId) => jogo(id).funcoes.map(f => f.id);
export const nomeDaFuncao31 = (id: JogoId, f: string) => jogo(id).funcoes.find(x => x.id === f)?.nome ?? f;

/** Os titulares: o melhor de cada função primeiro (um time precisa das funções), depois os melhores que sobram. */
export function titulares31(o: OrgEsports31, ano: number): JogadorOrg31[] {
  const n = titularesDoJogo31(o.jogo, ano);
  const ordem = [...o.elenco].sort((a, b) => b.forca - a.forca || a.id.localeCompare(b.id));
  const out: JogadorOrg31[] = [];
  for (const f of funcoesDoJogo(o.jogo)) { if (out.length >= n) break; const j = ordem.find(x => x.funcao === f && !out.includes(x)); if (j) out.push(j); }
  for (const j of ordem) { if (out.length >= n) break; if (!out.includes(j)) out.push(j); }
  return out;
}
export function mediaDosTitulares31(o: OrgEsports31, ano: number): number {
  const t = titulares31(o, ano);
  if (!t.length) return 30;
  const n = titularesDoJogo31(o.jogo, ano);
  return t.reduce((s, j) => s + j.forca, 0) / t.length - Math.max(0, n - t.length) * 6;
}

/* ------------------------------------------------------------------ o perfil (os arquétipos do e-sports) */

const PAPEL_ARQ: Record<string, string> = { awper: 'awper', entry: 'entry', duelista: 'duelista', suporte: 'suporte', sentinela: 'sentinela' };
export interface PerfilOrg31 { perfil: PerfilEmergente; atributos: { id: AtributoEsports; valor: number }[] }

/** O jeito do jogador (estável pelo id e pelo nick): os desvios dos atributos do jogo, puxados pela função, e o temperamento. */
function jeito(j: JogadorOrg31, jid: JogoId) {
  const r = rngDe('org31-jeito', jid, j.id, j.nick, j.nome);
  const g = jogo(jid);
  const pesa = g.funcoes.find(f => f.id === j.funcao)?.pesa ?? {};
  const ids = g.atributos.map(([a]) => a);
  const fortes = ids.filter(a => (pesa[a] ?? 1) > 1.1);
  const ordem = [...fortes];
  for (let k = ordem.length - 1; k > 0; k--) { const x = Math.floor(r.next() * (k + 1)); [ordem[k], ordem[x]] = [ordem[x], ordem[k]]; }
  const destaques = ordem.slice(0, r.chance(0.5) ? 2 : 1);
  const desvio: Record<string, number> = {};
  for (const a of ids) desvio[a] = Math.round((r.normal() * (fortes.includes(a) ? 3 : 2) + ((pesa[a] ?? 1) - 1) * 4 + (destaques.includes(a) ? 5 + r.next() * 5 : 0)) * 10) / 10;
  // O IGL (e quem chama a rotação) vive da conversa; o "clutch" nasce da cabeça fria.
  if (j.funcao === 'igl') { desvio.comunicacao = (desvio.comunicacao ?? 0) + 4; desvio.estrategia = (desvio.estrategia ?? 0) + 3; }
  if (r.chance(0.18)) { desvio.mental = (desvio.mental ?? 0) + 6 + r.next() * 4; desvio.consistencia = (desvio.consistencia ?? 0) + 4; }
  const tracos: Record<string, number> = {};
  for (const t of ['disciplina', 'impulsividade', 'coragem', 'sociabilidade', 'empatia']) tracos[t] = Math.round(clamp(r.normal() * 22, -50, 50));
  return { desvio, tracos };
}

export function perfilDoJogadorOrg31(j: JogadorOrg31, jid: JogoId, ano: number, ctx: { mediaDoTime: number; igl?: string; reserva?: boolean; titulos?: number }): PerfilOrg31 {
  const { desvio, tracos } = jeito(j, jid);
  const papel = PAPEL_ARQ[j.funcao] ?? j.funcao;
  const leitura: LeituraDoPerfil = {
    modalidade: 'esports', papel, desvio, tracos, idade: ano - anoDe(j.tNasc), acimaDaDivisao: j.forca - ctx.mediaDoTime,
    anosNoClube: 1, capitao: ctx.igl === j.id, reserva: !!ctx.reserva, titulos: ctx.titulos ?? 0
  };
  const perfil = lerPerfil(leitura);
  const g = jogo(jid);
  const pesa = g.funcoes.find(f => f.id === j.funcao)?.pesa ?? {};
  const atributos = g.atributos.map(([a]) => a).sort((a, b) => (pesa[b] ?? 1) - (pesa[a] ?? 1) || (desvio[b] ?? 0) - (desvio[a] ?? 0)).slice(0, 4)
    .map(id => ({ id, valor: clamp(Math.round(j.forca + (desvio[id] ?? 0)), 15, 99) }));
  return { perfil, atributos };
}

export function perfisDoElenco31(o: OrgEsports31, ano: number): Map<string, PerfilOrg31> {
  const media = mediaDosTitulares31(o, ano);
  const tit = new Set(titulares31(o, ano).map(j => j.id));
  const titulos = o.trofeus.filter(t => ano - t.ano <= 3).length;
  const m = new Map<string, PerfilOrg31>();
  for (const j of o.elenco) m.set(j.id, perfilDoJogadorOrg31(j, o.jogo, ano, { mediaDoTime: media, igl: o.igl, reserva: !tit.has(j.id), titulos }));
  return m;
}

/** A química: o vestiário que os perfis dos titulares fazem; sem IGL escolhido, o time joga sem voz. De −2 a +2. */
export function quimica31(o: OrgEsports31, ano: number): number {
  const perfis = perfisDoElenco31(o, ano);
  const tit = titulares31(o, ano);
  const soma = tit.reduce((s, j) => s + efeitosDoPerfil(perfis.get(j.id)?.perfil).vestiario, 0);
  const iglOk = !!o.igl && tit.some(j => j.id === o.igl);
  return Math.round(clamp(soma * 0.35 + (iglOk ? 0.4 : -0.6), -2, 2) * 10) / 10;
}
export const bonusDoTecnico31 = (o: OrgEsports31) => (o.tecnico ? (o.tecnico.nivel - 2) * 1.2 + ((o.humorTecnico ?? 60) - 60) / 40 * 0.6 : 0);
/** A força do time na temporada: os titulares, a química, o técnico, o bootcamp, o clima e o tempo que o conteúdo come. */
export function forcaDoTime31(o: OrgEsports31, ano: number): number {
  return Math.round((mediaDosTitulares31(o, ano) + quimica31(o, ano) + bonusDoTecnico31(o) + (o.bootcamp === ano ? 2 : 0) + (o.moral ?? 0) - (o.conteudo === 2 ? 1 : 0)) * 10) / 10;
}

/* ------------------------------------------------------------------ à venda */

export interface OrgAVenda31 { nome: string; jogo: JogoId; regiao: Regiao31; divisao: Divisao31; real: boolean; forca: number; fas: number; reputacao: number; receita: number; divida: number; valor: number; preco: number }

const RAIZES = ['Vórtice', 'Nébula', 'Atalaia', 'Carcará', 'Mandacaru', 'Boitatá', 'Graúna', 'Jaguatirica', 'Guará', 'Pororoca', 'Basalto', 'Quasar', 'Órbita', 'Cobalto', 'Tucuxi', 'Ipê Roxo', 'Sertão', 'Maré Alta', 'Farol', 'Bússola', 'Granito', 'Vagalume', 'Siriema', 'Cerrado'];
const RAIZES_INT = ['Northwind', 'Kestrel', 'Obsidian', 'Halcyon', 'Tundra', 'Meridian', 'Crimson Lynx', 'Solstice', 'Ironclad', 'Nightjar', 'Vanta', 'Polaris', 'Ember', 'Glacier', 'Zenith', 'Lotus'];
const SUFIXOS = ['Gaming', 'Esports', 'Team', 'GG', 'Club'];
const ler = (x: string) => { const [nome, d, a] = x.split('|'); return { nome, desde: Number(d), ate: a ? Number(a) : undefined }; };

/** As organizações de um jogo à venda no ano: as do catálogo que existiam, e algumas fictícias da região. */
function catalogo(v: Vida, jid: JogoId, ano: number): { nome: string; regiao: Regiao31; divisao: Divisao31; base: number; real: boolean }[] {
  const t = EQUIPES_REAIS29[jid];
  const out: { nome: string; regiao: Regiao31; divisao: Divisao31; base: number; real: boolean }[] = [];
  const vistos = new Set<string>();
  const add = (lista: string[] | undefined, regiao: Regiao31, divisao: Divisao31, base: number) => {
    for (const e of (lista ?? []).map(ler)) {
      if (e.desde > ano || (e.ate !== undefined && e.ate < ano) || vistos.has(`${regiao}:${e.nome}`)) continue;
      vistos.add(`${regiao}:${e.nome}`);
      out.push({ nome: e.nome, regiao, divisao, base, real: true });
    }
  };
  add(t.br[4], 'BR', 4, forcaDoCampo31(jid, 4) + 2); add(t.br[3], 'BR', 3, forcaDoCampo31(jid, 3) + 1); add(t.br[2], 'BR', 2, forcaDoCampo31(jid, 2) + 1);
  add(t.int[5], 'INT', 4, forcaDoCampo31(jid, 5) - 3); add(t.int[4], 'INT', 4, forcaDoCampo31(jid, 4, 'INT')); add(t.int[3], 'INT', 3, forcaDoCampo31(jid, 3));
  const r = rngDe(v.id, 'org31_ficticias', jid);
  for (const regiao of ['BR', 'INT'] as Regiao31[]) for (let k = 0; k < 4; k++) {
    const raiz = regiao === 'BR' ? RAIZES[r.int(0, RAIZES.length - 1)] : RAIZES_INT[r.int(0, RAIZES_INT.length - 1)];
    const nome = `${raiz} ${SUFIXOS[r.int(0, SUFIXOS.length - 1)]}`;
    if (vistos.has(`${regiao}:${nome}`)) continue;
    vistos.add(`${regiao}:${nome}`);
    const divisao = (k < 2 ? 2 : 3) as Divisao31;
    out.push({ nome, regiao, divisao, base: forcaDoCampo31(jid, divisao, regiao) - 2, real: false });
  }
  return out;
}

function avaliar(v: Vida, jid: JogoId, x: { nome: string; regiao: Regiao31; divisao: Divisao31; base: number; real: boolean }): OrgAVenda31 {
  const r = rngDe(v.id, 'org31_avaliar', jid, x.regiao, x.nome);
  const forca = Math.round(x.base + r.normal() * 2.5);
  const alto = forca - forcaDoCampo31(jid, x.divisao, x.regiao);
  const fas = clamp(Math.round([0, 0, 12, 30, 58][x.divisao] + alto * 3 + (x.real ? 8 : 0) + r.normal() * 6), 2, 98);
  const reputacao = clamp(Math.round([0, 0, 15, 32, 55][x.divisao] + alto * 3 + (x.real ? 6 : 0) + r.normal() * 5), 2, 98);
  const receita = receitaBase31(x.divisao, fas, reputacao, x.regiao);
  const divida = arred(receita * (0.1 + r.next() * 0.6), 1e5);
  const elenco = titularesDoJogo31(jid, anoDe(v.t)) * Math.pow(1.14, forca - 50) * 15000 * MULT[x.regiao];
  const valor = arred(receita * 1.8 + elenco * 0.6, 1e5);
  const preco = Math.max(arred(valor * 0.3, 1e5), arred(valor - divida, 1e5));
  return { nome: x.nome, jogo: jid, regiao: x.regiao, divisao: x.divisao, real: x.real, forca, fas, reputacao, receita, divida, valor, preco };
}

export const jogosDisponiveis31 = (ano: number): JogoId[] => LISTA_JOGOS25.filter(j => JOGOS25[j].lancado <= ano);

/** Todas as organizações à venda agora (de cada jogo já lançado). */
export function orgsAVenda31(v: Vida, filtro?: { jogo?: JogoId; regiao?: Regiao31 }): OrgAVenda31[] {
  const ano = anoDe(v.t);
  const jogos = filtro?.jogo ? [filtro.jogo] : jogosDisponiveis31(ano);
  return jogos.filter(j => JOGOS25[j].lancado <= ano)
    .flatMap(j => catalogo(v, j, ano).filter(x => !filtro?.regiao || x.regiao === filtro.regiao).map(x => avaliar(v, j, x)));
}
export const avaliarOrg31 = (v: Vida, nome: string, jid: JogoId, regiao: Regiao31) => orgsAVenda31(v, { jogo: jid, regiao }).find(x => x.nome === nome);

/** O que custa fundar uma organização (registro, estrutura mínima, a primeira gaming house). */
export const custoDeFundar31 = (regiao: Regiao31) => (regiao === 'BR' ? 150000 : 400000);

/* ------------------------------------------------------------------ as ações */

export type OqueOrg31 =
  | { op: 'comprar'; nome: string; jogo: JogoId; regiao: Regiao31; financiar?: boolean }
  | { op: 'fundar'; nome: string; jogo: JogoId; regiao: Regiao31 }
  | { op: 'vender_org' }
  | { op: 'aportar'; valor: number }
  | { op: 'contratar'; id: string }
  | { op: 'dispensar'; id: string }
  | { op: 'renovar'; id: string }
  | { op: 'promover'; id: string }
  | { op: 'igl'; id: string }
  | { op: 'tecnico'; i: number }
  | { op: 'demitir_tecnico' }
  | { op: 'patrocinio'; i: number }
  | { op: 'bootcamp' }
  | { op: 'conteudo'; nivel: 0 | 1 | 2 }
  | { op: 'academia'; nivel: 0 | 1 | 2 }
  | { op: 'responder'; id: string; opcao: string };

const MAX_ELENCO = 10;
export const custoDoBootcamp31 = (o: OrgEsports31) => arred((o.divisao === 4 ? 250e3 : o.divisao === 3 ? 90e3 : 30e3) * MULT[o.regiao] * (1 + o.elenco.length / 10));
const nomeLimpo = (s: string) => s.replace(/\s+/g, ' ').trim();

function conflito(v: Vida, jid: JogoId, nome: string): string | undefined {
  const e = v.esports25;
  if (e && e.fase !== 'encerrada' && e.jogo === jid && e.equipe && e.equipe.nome !== nome && e.nivel >= 3)
    return `Você joga pela ${e.equipe.nome}: o regulamento do circuito proíbe ser dono de outra organização no mesmo jogo.`;
  return undefined;
}

export function disponibilidadeOrg31(v: Vida, o: OqueOrg31): Veredito {
  if (idade(v) < 18) return bloqueio('requisito', 'Só quem é maior de idade é dono de uma organização.');
  const org = v.orgEsports31;
  const ano = anoDe(v.t);
  if (o.op === 'comprar' || o.op === 'fundar') {
    if (org) return bloqueio('incompativel', `Você já é dono da ${org.nome}: venda antes de ter outra.`);
    if (JOGOS25[o.jogo]?.lancado === undefined || JOGOS25[o.jogo].lancado > ano) return bloqueio('impossivel', 'Esse jogo ainda não existe.');
    const conf = conflito(v, o.jogo, o.nome);
    if (conf) return bloqueio('incompativel', conf);
    if (o.op === 'fundar') {
      const nome = nomeLimpo(o.nome ?? '');
      if (nome.length < 2 || nome.length > 32) return bloqueio('requisito', 'Escolha um nome de 2 a 32 letras.');
      if (catalogo(v, o.jogo, ano).some(x => x.nome.toLowerCase() === nome.toLowerCase())) return bloqueio('incompativel', 'Já existe uma organização com esse nome no cenário.');
      const custo = custoDeFundar31(o.regiao);
      return v.financas.conta >= custo ? PERMITIDO : bloqueio('requisito', `Fundar custa ${fmt(custo)} em dinheiro (registro, estrutura e a primeira gaming house).`);
    }
    const x = avaliarOrg31(v, o.nome, o.jogo, o.regiao);
    if (!x) return bloqueio('impossivel', 'Essa organização não está à venda.');
    const entrada = o.financiar ? Math.round(x.preco * 0.4) : x.preco;
    if (v.financas.conta < entrada) return bloqueio('requisito', `${o.financiar ? 'A entrada' : 'A compra'} custa ${fmt(entrada)} em dinheiro (patrimônio não é liquidez).`);
    if (o.financiar && x.preco * 0.6 > Math.max(0, v.financas.conta) * 3 + 1) return bloqueio('requisito', 'O banco não financia uma compra tão maior do que o que você tem.');
    return PERMITIDO;
  }
  if (!org) return bloqueio('impossivel', 'Você não é dono de uma organização de e-sports.');
  switch (o.op) {
    case 'vender_org': return PERMITIDO;
    case 'aportar': return o.valor > 0 && v.financas.conta >= o.valor ? PERMITIDO : bloqueio('requisito', 'Não há esse dinheiro na conta.');
    case 'contratar': {
      const m = mercadoOrg31(v).find(j => j.id === o.id);
      if (!m) return bloqueio('impossivel', 'Esse jogador já não está no mercado.');
      if (org.elenco.length >= MAX_ELENCO) return bloqueio('incompativel', `O elenco está cheio (${MAX_ELENCO}): dispense alguém antes.`);
      return org.caixa >= m.preco ? PERMITIDO : bloqueio('requisito', `A multa rescisória é de ${fmt(m.preco)}; o caixa da organização não tem (aporte).`);
    }
    case 'dispensar': {
      const j = org.elenco.find(x => x.id === o.id);
      if (!j) return bloqueio('impossivel', '');
      if (org.elenco.length <= titularesDoJogo31(org.jogo, ano)) return bloqueio('incompativel', 'Sem ele não há time completo para jogar.');
      return PERMITIDO;
    }
    case 'renovar': { const j = org.elenco.find(x => x.id === o.id); return j ? (j.contratoAte > ano + 1 ? bloqueio('incompativel', `O contrato vai até ${j.contratoAte}.`) : PERMITIDO) : bloqueio('impossivel', ''); }
    case 'promover': return org.academia.some(j => j.id === o.id) ? (org.elenco.length >= MAX_ELENCO ? bloqueio('incompativel', 'O elenco principal está cheio.') : PERMITIDO) : bloqueio('impossivel', '');
    case 'igl': return org.elenco.some(j => j.id === o.id) ? (org.igl === o.id ? bloqueio('incompativel', 'Ele já é o IGL.') : PERMITIDO) : bloqueio('impossivel', '');
    case 'tecnico': {
      const t = tecnicosOrg31(v)[o.i];
      if (!t) return bloqueio('impossivel', 'Esse técnico já não está disponível.');
      if (org.tecnico?.nome === t.nome) return bloqueio('incompativel', 'Ele já é o técnico.');
      const custo = (org.tecnico ? Math.round(org.tecnico.salario * 0.5) : 0) + Math.round(t.salario * 0.25);
      return org.caixa >= custo ? PERMITIDO : bloqueio('requisito', `O caixa não cobre ${org.tecnico ? 'a multa do técnico atual e ' : ''}as luvas (${fmt(custo)}).`);
    }
    case 'demitir_tecnico': return org.tecnico ? (org.caixa >= Math.round(org.tecnico.salario * 0.5) ? PERMITIDO : bloqueio('requisito', `A multa é de ${fmt(Math.round(org.tecnico.salario * 0.5))}; o caixa não tem.`)) : bloqueio('impossivel', 'Não há técnico contratado.');
    case 'patrocinio':
      if (org.patrocinio && org.patrocinio.ate >= ano) return bloqueio('incompativel', `O contrato com ${org.patrocinio.nome.toLowerCase()} vai até ${org.patrocinio.ate}.`);
      return patrociniosOrg31(v)[o.i] ? PERMITIDO : bloqueio('impossivel', '');
    case 'bootcamp': {
      if (org.bootcamp === ano) return bloqueio('incompativel', 'O time já fez o bootcamp desta temporada.');
      const c = custoDoBootcamp31(org);
      return org.caixa >= c ? PERMITIDO : bloqueio('requisito', `O bootcamp custa ${fmt(c)}; o caixa da organização não tem.`);
    }
    case 'conteudo': return org.conteudo === o.nivel ? bloqueio('incompativel', 'Já é assim.') : PERMITIDO;
    case 'academia': return org.academiaNivel === o.nivel ? bloqueio('incompativel', 'Já é assim.') : PERMITIDO;
    case 'responder': return org.mesa.find(s => s.id === o.id)?.opcoes.some(x => x.id === o.opcao) ? PERMITIDO : bloqueio('impossivel', 'Esse assunto já foi resolvido.');
  }
}

export function executarOrg31(v: Vida, o: OqueOrg31): { texto: string; tom?: 'bom' | 'ruim' | 'neutro' } {
  const ano = anoDe(v.t);
  if (o.op === 'comprar') return comprar(v, o.nome, o.jogo, o.regiao, !!o.financiar);
  if (o.op === 'fundar') return fundar(v, nomeLimpo(o.nome), o.jogo, o.regiao);
  const org = v.orgEsports31!;
  const auge = jogo(org.jogo).auge;
  switch (o.op) {
    case 'vender_org': {
      const valor = Math.max(0, arred(org.valor + org.caixa - org.divida, 1e5));
      v.financas.conta += valor;
      lancar(v, `Venda da organização (${org.nome})`, 'renda', valor);
      escrever(v, { texto: `Vendeu a ${org.nome} depois de ${Math.max(1, ano - anoDe(org.desde))} ano(s) como dono: ${fmt(valor)}${org.trofeus.length ? `, com ${org.trofeus.length} título(s) na galeria` : ''}.`, relevancia: 'marco', tema: 'dinheiro', escolha: true });
      v.orgEsports31 = undefined;
      return { texto: `Organização vendida por ${fmt(valor)}.`, tom: 'neutro' };
    }
    case 'aportar':
      pagar(v, o.valor); lancar(v, `Aporte na organização (${org.nome})`, 'despesa', -o.valor);
      org.caixa += o.valor; if (org.divida > 0) { const a = Math.min(org.divida, org.caixa); org.divida -= a; org.caixa -= a; }
      return { texto: `Aportou ${fmt(o.valor)} na ${org.nome}.`, tom: 'neutro' };
    case 'contratar': {
      const m = mercadoOrg31(v).find(j => j.id === o.id)!;
      org.caixa -= m.preco; org.comprados.push(m.id); if (org.comprados.length > 200) org.comprados.splice(0, org.comprados.length - 200);
      const { preco: _p, de, ...j } = m; void _p;
      org.elenco.push(j);
      escrever(v, { texto: `A ${org.nome} contratou ${j.nick} (${j.nome}, ${nomeDaFuncao31(org.jogo, j.funcao)}), que estava na ${de}, por ${fmt(m.preco)}.`, relevancia: 'cotidiano', tema: 'trabalho', escolha: true });
      return { texto: `${j.nick} contratado.`, tom: 'bom' };
    }
    case 'dispensar': {
      const i = org.elenco.findIndex(j => j.id === o.id); const j = org.elenco.splice(i, 1)[0];
      const multa = arred(j.salario * Math.max(0, j.contratoAte - ano) * 0.5, 1000);
      org.caixa -= multa; if (org.igl === j.id) org.igl = undefined;
      return { texto: `${j.nick} foi dispensado${multa ? ` (rescisão de ${fmt(multa)})` : ''}.`, tom: 'neutro' };
    }
    case 'renovar': {
      const j = org.elenco.find(x => x.id === o.id)!;
      j.contratoAte = ano + (ano - anoDe(j.tNasc) >= auge + 6 ? 1 : 2); j.salario = salarioDe31(j.forca, org.regiao);
      return { texto: `${j.nick} renovou até ${j.contratoAte} (${fmt(j.salario)} por ano).`, tom: 'bom' };
    }
    case 'promover': {
      const i = org.academia.findIndex(j => j.id === o.id); const j = org.academia.splice(i, 1)[0];
      j.salario = Math.round(salarioDe31(j.forca, org.regiao) * 0.7); j.contratoAte = ano + 2;
      org.elenco.push(j);
      return { texto: `${j.nick} subiu da academia para o time principal.`, tom: 'bom' };
    }
    case 'igl': { const j = org.elenco.find(x => x.id === o.id)!; org.igl = j.id; return { texto: `${j.nick} é o novo IGL: as calls são dele.`, tom: 'bom' }; }
    case 'tecnico': {
      const t = tecnicosOrg31(v)[o.i];
      org.caixa -= (org.tecnico ? Math.round(org.tecnico.salario * 0.5) : 0) + Math.round(t.salario * 0.25);
      const antes = org.tecnico?.nome;
      org.tecnico = { ...t, desde: ano }; org.humorTecnico = 65;
      escrever(v, { texto: `A ${org.nome} tem técnico novo: ${t.nome}${antes ? `, no lugar de ${antes}` : ''}.`, relevancia: 'cotidiano', tema: 'trabalho', escolha: true });
      return { texto: `${t.nome} contratado como técnico.`, tom: 'bom' };
    }
    case 'demitir_tecnico': {
      const t = org.tecnico!; const multa = Math.round(t.salario * 0.5);
      org.caixa -= multa; org.tecnico = undefined; org.humorTecnico = undefined;
      return { texto: `${t.nome} demitido (multa de ${fmt(multa)}).`, tom: 'neutro' };
    }
    case 'patrocinio': {
      const p = patrociniosOrg31(v)[o.i];
      org.patrocinio = { nome: p.nome, valor: p.valor, ate: ano + p.anos - 1, rep: p.rep };
      escrever(v, { texto: `A ${org.nome} fechou patrocínio com ${p.nome.toLowerCase()}: ${fmt(p.valor)} por ano até ${ano + p.anos - 1}.`, relevancia: 'cotidiano', tema: 'dinheiro', escolha: true });
      return { texto: `Patrocínio fechado: ${fmt(p.valor)} por ano.`, tom: 'bom' };
    }
    case 'bootcamp': {
      const c = custoDoBootcamp31(org);
      org.caixa -= c; org.bootcamp = ano; org.moral = clamp(Math.round(((org.moral ?? 0) + 0.3) * 10) / 10, -3, 3);
      escrever(v, { texto: `A ${org.nome} levou o time para um bootcamp (${fmt(c)}): treinos contra equipes de fora, a semana inteira.`, relevancia: 'cotidiano', tema: 'trabalho', escolha: true });
      return { texto: `Bootcamp feito: +2 de força nesta temporada.`, tom: 'bom' };
    }
    case 'conteudo': org.conteudo = o.nivel; return { texto: ['Sem conteúdo: o time só treina.', 'Lives semanais: um pouco de receita e de fãs, sem tirar o foco.', 'Casa de criadores: mais receita e fãs — o treino perde horas (−1 de força).'][o.nivel], tom: 'neutro' };
    case 'academia': org.academiaNivel = o.nivel; if (o.nivel === 0) org.academia = []; return { texto: ['Academia fechada.', 'Academia básica: alguns jovens por ano.', 'Academia forte: mais jovens e mais talento.'][o.nivel], tom: 'neutro' };
    case 'responder': return responderMesa(v, org, o.id, o.opcao);
  }
}

function montarElenco(v: Vida, org: OrgEsports31, r: Rng, media: number): void {
  const ano = anoDe(v.t);
  const g = jogo(org.jogo);
  const n = titularesDoJogo31(org.jogo, ano) + 2;
  const fs = funcoesDoJogo(org.jogo);
  for (let k = 0; k < n; k++) org.elenco.push(novoJogador(org, r, ano, fs[k % fs.length], media + r.normal() * 3.5, g.auge - 4 + r.int(0, 8)));
}

function novaOrg(v: Vida, nome: string, jid: JogoId, regiao: Regiao31, divisao: Divisao31, fundada: boolean): OrgEsports31 {
  return { nome, jogo: jid, regiao, desde: v.t, ...(fundada ? { fundada } : {}), divisao, preco: 0, caixa: 0, divida: 0, valor: 0, fas: 3, reputacao: 5, elenco: [], academia: [], academiaNivel: 0, conteudo: 0, historico: [], trofeus: [], seq: 0, comprados: [], vendas: [], mesa: [], mesaHist: [] };
}

function comprar(v: Vida, nome: string, jid: JogoId, regiao: Regiao31, financiar: boolean): { texto: string; tom: 'bom' } {
  const x = avaliarOrg31(v, nome, jid, regiao)!;
  const entrada = financiar ? Math.round(x.preco * 0.4) : x.preco;
  pagar(v, entrada);
  lancar(v, `Compra da organização (${nome})`, 'despesa', -entrada);
  if (financiar) {
    const saldo = x.preco - entrada, prazo = 96, j = 0.012;
    const parcela = Math.round(saldo * j / (1 - Math.pow(1 + j, -prazo)));
    v.financas.dividas.push({ id: `org31_${v.t}`, tipo: 'emprestimo', saldo, jurosMes: j, parcela, descricao: `Financiamento da compra da ${nome}`, tInicio: v.t, prazo });
  }
  const org = novaOrg(v, nome, jid, regiao, x.divisao, false);
  Object.assign(org, { preco: x.preco, divida: x.divida, valor: x.valor, fas: x.fas, reputacao: x.reputacao, caixa: arred(x.receita * 0.08, 1e4) });
  montarElenco(v, org, rngDe(v.id, 'org31_compra', jid, regiao, nome), x.forca);
  org.igl = titulares31(org, anoDe(v.t)).find(j => j.funcao === 'igl')?.id;
  v.orgEsports31 = org;
  abrirMesa(v, org, 1);
  escrever(v, { texto: `Comprou a ${nome} (${JOGOS25[jid].nome(anoDe(v.t))}, ${NOME_DIVISAO31[x.divisao].toLowerCase()} ${regiao === 'BR' ? 'do Brasil' : 'internacional'}) por ${fmt(x.preco)}${financiar ? `, ${fmt(entrada)} de entrada e o resto financiado` : ''}. As dívidas da organização (${fmt(x.divida)}) vieram junto.`, relevancia: 'marco', tema: 'dinheiro', tom: 'bom', escolha: true });
  return { texto: `Agora você é dono da ${nome}.`, tom: 'bom' };
}

function fundar(v: Vida, nome: string, jid: JogoId, regiao: Regiao31): { texto: string; tom: 'bom' } {
  const custo = custoDeFundar31(regiao);
  pagar(v, custo);
  lancar(v, `Fundação da organização (${nome})`, 'despesa', -custo);
  const org = novaOrg(v, nome, jid, regiao, 2, true);
  org.caixa = arred(custo * 0.3);
  montarElenco(v, org, rngDe(v.id, 'org31_fundar', jid, regiao, nome), forcaDoCampo31(jid, 2) - 3);
  org.valor = arred(custo * 0.6, 1e4); org.preco = custo;
  v.orgEsports31 = org;
  abrirMesa(v, org, 1);
  escrever(v, { texto: `Fundou a ${nome}, uma organização de ${JOGOS25[jid].nome(anoDe(v.t))} ${regiao === 'BR' ? 'no Brasil' : 'no circuito internacional'}: ${fmt(custo)}, um time de garotos do cenário aberto e muita vontade.`, relevancia: 'marco', tema: 'trabalho', tom: 'bom', escolha: true });
  return { texto: `A ${nome} existe: começa no cenário aberto.`, tom: 'bom' };
}

/* ------------------------------------------------------------------ o mercado, os técnicos, os patrocínios (estáveis no ano) */

export type JogadorDoMercado31 = JogadorOrg31 & { preco: number; de: string; faixa: 'reforco' | 'nivel' | 'aposta' | 'estrela' };

/** O teto de quem aceita vir: o degrau, o nome da organização e a região. */
const tetoDeAtracao = (o: OrgEsports31) => forcaDoCampo31(o.jogo, o.divisao, o.regiao) + 4 + o.reputacao / 12 + (o.regiao === 'INT' ? 2 : 0);

/**
 * O mercado do ano, em faixas: reforços ACIMA dos titulares (um por função), jogadores do nível, apostas jovens e, às
 * vezes, a estrela de fora — cara, com salário de estrela. Quem foi contratado sai.
 */
export function mercadoOrg31(v: Vida): JogadorDoMercado31[] {
  const o = v.orgEsports31;
  if (!o) return [];
  const ano = anoDe(v.t);
  const g = jogo(o.jogo);
  const r = rngDe(v.id, 'org31_mercado', o.jogo, o.nome, ano);
  const media = mediaDosTitulares31(o, ano);
  const teto = tetoDeAtracao(o);
  const alvo = Math.max(media + 6, Math.min(teto + 6, media + 12));
  const fake: OrgEsports31 = { ...o, seq: 0, elenco: [], academia: [] };
  const origem = () => {
    const lista = catalogo(v, o.jogo, ano).filter(x => x.nome !== o.nome && x.regiao === o.regiao);
    return lista.length ? lista[r.int(0, lista.length - 1)].nome : 'uma equipe do cenário';
  };
  const fs = funcoesDoJogo(o.jogo);
  const faixas: { faixa: JogadorDoMercado31['faixa']; forca: () => number; idade: () => number; funcao?: string }[] = [
    ...fs.map(f => ({ faixa: 'reforco' as const, funcao: f, forca: () => alvo - r.next() * 5, idade: () => g.auge - 3 + r.int(0, 6) })),
    ...[0, 1, 2].map(() => ({ faixa: 'nivel' as const, forca: () => media + r.normal() * 2.5, idade: () => g.auge - 4 + r.int(0, 10) })),
    ...[0, 1, 2].map(() => ({ faixa: 'aposta' as const, forca: () => media - 8 + r.normal() * 3, idade: () => g.idadePro + r.int(0, 2) }))
  ];
  const lista: JogadorDoMercado31[] = [];
  for (const [k, fx] of faixas.entries()) {
    const i = fx.idade();
    const j = novoJogador(fake, r, ano, fx.funcao ?? r.pick(fs), fx.forca(), i);
    j.id = `m${ano}_${k}`; j.contratoAte = ano + 1 + r.int(0, 2);
    if (fx.faixa === 'aposta') j.potencial = clamp(Math.max(j.potencial, j.forca + 12 + r.int(0, 10)), j.forca, 93);
    const de = origem();
    if (o.comprados.includes(j.id)) continue;
    lista.push({ ...j, faixa: fx.faixa, de, preco: arred(valorDoJogador31(j, ano, o.regiao, g.auge) * 1.2) });
  }
  if (r.chance(0.55)) {
    const j = novoJogador(fake, r, ano, r.pick(fs), Math.max(teto + 6, media + 10) + r.next() * 4, g.auge + r.int(-1, 3));
    j.id = `m${ano}_estrela`; j.contratoAte = ano + 1; j.salario = arred(j.salario * 1.4, 1000);
    if (!o.comprados.includes(j.id)) lista.push({ ...j, faixa: 'estrela', de: o.regiao === 'BR' ? 'uma organização internacional' : 'uma organização de outra região', preco: arred(valorDoJogador31(j, ano, o.regiao, g.auge) * 1.5) });
  }
  return lista;
}

const NOMES_TECNICO = ['Gabriel', 'Lucas', 'Rafael', 'Bruno', 'Thiago', 'Danilo', 'Henrique', 'Caio', 'André', 'Vitor', 'Renan', 'Igor', 'Marcos', 'Felipe'];
export function tecnicosOrg31(v: Vida): Tecnico31[] {
  const o = v.orgEsports31;
  if (!o) return [];
  const ano = anoDe(v.t);
  const r = rngDe(v.id, 'org31_tecnicos', o.nome, ano);
  const teto = clamp(Math.round(o.divisao - 1 + o.reputacao / 40), 1, 5);
  return [0, 1, 2].map(k => {
    const nivel = clamp(teto - (k === 0 ? 0 : k === 1 ? r.int(0, 1) : r.int(1, 2)), 1, 5);
    return { nome: `${NOMES_TECNICO[r.int(0, NOMES_TECNICO.length - 1)]} ${sortearSobrenome(r, o.regiao === 'BR' ? 'BR' : undefined)}`, nivel, salario: arred([0, 40e3, 120e3, 350e3, 900e3, 2e6][nivel] * MULT[o.regiao]), desde: ano };
  });
}

export function patrociniosOrg31(v: Vida): { nome: string; valor: number; anos: number; rep: number; sobre: string }[] {
  const o = v.orgEsports31;
  if (!o) return [];
  const ano = anoDe(v.t);
  const r = rngDe(v.id, 'org31_patrocinio', o.nome, ano);
  const base = receitaBase31(o.divisao, o.fas, o.reputacao, o.regiao) * 0.25 * (0.9 + r.next() * 0.2);
  return [
    { nome: 'Uma fabricante de periféricos', valor: arred(base), anos: 3, rep: 1, sobre: 'contrato longo, o nome cresce junto' },
    { nome: 'Uma marca de energético', valor: arred(base * 1.2), anos: 2, rep: 0, sobre: 'paga um pouco mais, dois anos' },
    ano >= 2018 ? { nome: 'Uma casa de apostas', valor: arred(base * 1.6), anos: 1, rep: -3, sobre: 'paga muito, um ano — e parte da comunidade torce o nariz' } : { nome: 'Uma operadora de internet', valor: arred(base * 1.3), anos: 1, rep: 0, sobre: 'paga bem, um ano só' }
  ];
}

/* ------------------------------------------------------------------ a mesa do dono */

interface ModeloMesa {
  tipo: string; quem: 'Comunidade' | 'Técnico' | 'Elenco';
  cabe: (v: Vida, o: OrgEsports31) => boolean; peso: number;
  montar: (v: Vida, o: OrgEsports31, r: Rng) => Omit<SituacaoOrg31, 'id' | 'tipo' | 'ano'> | undefined;
  resolver: (v: Vida, o: OrgEsports31, s: SituacaoOrg31, op: string, r: Rng) => string;
  ignorar: (o: OrgEsports31) => string;
}
const mexer = (o: OrgEsports31, x: { fas?: number; rep?: number; moral?: number; humor?: number; caixa?: number }) => {
  if (x.fas) o.fas = clamp(Math.round(o.fas + x.fas));
  if (x.rep) o.reputacao = clamp(Math.round(o.reputacao + x.rep));
  if (x.moral) o.moral = clamp(Math.round(((o.moral ?? 0) + x.moral) * 10) / 10, -3, 3);
  if (x.humor && o.tecnico) o.humorTecnico = clamp(Math.round((o.humorTecnico ?? 60) + x.humor));
  if (x.caixa) o.caixa = Math.round(o.caixa + x.caixa);
};
const ult = (o: OrgEsports31) => o.historico[o.historico.length - 1];
const craque = (o: OrgEsports31) => [...o.elenco].sort((a, b) => b.forca - a.forca || a.id.localeCompare(b.id))[0];
export const QUEM_DA_MESA31: Record<string, string> = {};

const MESA: ModeloMesa[] = [
  {
    tipo: 'boas_vindas', quem: 'Comunidade', peso: 100, cabe: (v, o) => !o.historico.length && anoDe(o.desde) === anoDe(v.t),
    montar: (_v, o) => ({ titulo: 'A comunidade quer ouvir o dono', texto: `O chat, os criadores e os fãs da ${o.nome} esperam o seu primeiro anúncio. O que você promete define o humor da comunidade — e a cobrança no fim do ano.`,
      opcoes: [{ id: 'titulo', texto: 'Prometer título já', dica: 'Os fãs vibram; não cumprir pesa no nome.' }, { id: 'projeto', texto: 'Falar em projeto de longo prazo', dica: 'Menos festa, menos cobrança.' }, { id: 'conteudo', texto: 'Prometer conteúdo e proximidade', dica: 'Mais fãs; o time sente as câmeras.' }] }),
    resolver: (_v, o, _s, op) => {
      if (op === 'titulo') { mexer(o, { fas: 6, rep: -1 }); return 'O anúncio viralizou: "é título ou nada". A comunidade vai cobrar.'; }
      if (op === 'conteudo') { if (o.conteudo === 0) o.conteudo = 1; mexer(o, { fas: 4 }); return 'Lives semanais com o elenco: a comunidade adorou ver os bastidores.'; }
      mexer(o, { rep: 2, fas: 1 }); return 'Um anúncio sóbrio, de projeto: os analistas elogiaram.';
    },
    ignorar: o => { mexer(o, { fas: -2 }); return 'O dono novo não falou com ninguém: a comunidade estranhou o silêncio.'; }
  },
  {
    tipo: 'fas_cobram', quem: 'Comunidade', peso: 3, cabe: (_v, o) => { const h = ult(o); return !!h && (!!h.caiu || h.posicao > h.participantes / 2); },
    montar: (_v, o) => ({ titulo: 'A comunidade está revoltada', texto: `Depois de uma temporada ${ult(o)?.caiu ? 'que terminou em queda' : 'ruim'}, a hashtag pedindo mudanças na ${o.nome} ficou em alta.`,
      opcoes: [{ id: 'live', texto: 'Fazer uma live de desculpas', dica: 'Pode acalmar — ou virar meme.' }, { id: 'reformular', texto: 'Prometer reformular o elenco', dica: 'Os fãs aplaudem; o elenco sente o recado.' }, { id: 'nota', texto: 'Soltar uma nota oficial', dica: 'Seguro e frio.' }] }),
    resolver: (_v, o, _s, op, r) => {
      if (op === 'live') { if (r.chance(clamp(0.35 + o.reputacao / 200, 0.1, 0.9))) { mexer(o, { fas: 5, rep: 2 }); return 'A live foi honesta: a comunidade deu mais uma chance.'; } mexer(o, { fas: -3, rep: -2 }); return 'A live virou meme. Os cortes rodaram a semana inteira.'; }
      if (op === 'reformular') { mexer(o, { fas: 4, moral: -0.5 }); return 'Os fãs aplaudiram a promessa — e o elenco entendeu que ninguém está garantido.'; }
      mexer(o, { fas: -1 }); return 'A nota oficial saiu. A comunidade leu e continuou desconfiada.';
    },
    ignorar: o => { mexer(o, { fas: -3, rep: -1 }); return 'A revolta ficou sem resposta — e cresceu.'; }
  },
  {
    tipo: 'festa', quem: 'Comunidade', peso: 4, cabe: (_v, o) => { const h = ult(o); return !!h && (!!h.titulo || !!h.subiu || !!h.mundial); },
    montar: (_v, o) => ({ titulo: 'Os fãs querem comemorar', texto: `A ${o.nome} ${ult(o)?.titulo ? 'foi campeã' : ult(o)?.subiu ? 'subiu de divisão' : 'foi ao mundial'}, e a comunidade pede um evento, uma coleção comemorativa, uma homenagem.`,
      opcoes: [{ id: 'evento', texto: 'Bancar um fan fest', dica: 'Custa; os fãs e o elenco não esquecem.' }, { id: 'colecao', texto: 'Lançar uma coleção comemorativa', dica: 'Vende bem.' }, { id: 'discreto', texto: 'Comemorar só com o time', dica: 'Barato e íntimo.' }] }),
    resolver: (_v, o, _s, op) => {
      const rec = ult(o)?.receita ?? 0;
      if (op === 'evento') { const c = arred(rec * 0.03 + 20000); mexer(o, { fas: 7, moral: 0.6, caixa: -c }); return `O fan fest lotou (${fmt(c)} de festa). O time foi ovacionado.`; }
      if (op === 'colecao') { const g = arred(rec * 0.05 + 10000); mexer(o, { fas: 2, caixa: g }); return `A coleção esgotou: ${fmt(g)} no caixa.`; }
      mexer(o, { moral: 0.4 }); return 'Um jantar com o elenco e a comissão. O grupo gostou.';
    },
    ignorar: o => { mexer(o, { fas: -1 }); return 'A organização nem comentou a campanha. Os fãs festejaram sozinhos.'; }
  },
  {
    tipo: 'tecnico_pede', quem: 'Técnico', peso: 3, cabe: (v, o) => !!o.tecnico && !!sugestao(v, o),
    montar: (v, o) => {
      const a = sugestao(v, o)!;
      return { titulo: `${o.tecnico!.nome.split(' ')[0]} pede um reforço`, texto: `O técnico vê a função de ${nomeDaFuncao31(o.jogo, a.funcao)} como o ponto fraco e indica ${a.nick} (${a.forca} de força), da ${a.de}. A multa é de ${fmt(a.preco)}.`, alvoId: a.id, valor: a.preco,
        opcoes: [{ id: 'contratar', texto: `Contratar por ${fmt(a.preco)}`, dica: 'Sai do caixa.' }, { id: 'negociar', texto: 'Negociar um valor menor', dica: 'Pode sair mais barato — ou ele ir para outra equipe.' }, { id: 'recusar', texto: 'Recusar: o elenco é esse', dica: 'O técnico não vai gostar.' }] };
    },
    resolver: (v, o, s, op, r) => {
      const a = mercadoOrg31(v).find(j => j.id === s.alvoId);
      if (!a) return 'O jogador já tinha acertado com outra equipe.';
      const contratar = (preco: number) => {
        if (o.caixa < preco || o.elenco.length >= MAX_ELENCO) return false;
        o.caixa -= preco; o.comprados.push(a.id);
        const { preco: _p, de: _d, faixa: _f, ...j } = a; void _p; void _d; void _f;
        o.elenco.push(j); return true;
      };
      if (op === 'contratar') { if (contratar(a.preco)) { mexer(o, { humor: 12, moral: 0.2 }); return `${a.nick} chegou: o técnico ganhou a peça que pediu.`; } mexer(o, { humor: -4 }); return 'Não havia caixa (ou vaga) para a contratação.'; }
      if (op === 'negociar') {
        if (r.chance(clamp(0.4 + o.reputacao / 250, 0.1, 0.9))) { const p = arred(a.preco * 0.8); if (contratar(p)) { mexer(o, { humor: 10 }); return `Negociação boa: ${a.nick} veio por ${fmt(p)}.`; } }
        o.comprados.push(a.id); mexer(o, { humor: -3 }); return `Enquanto a organização negociava, ${a.nick} fechou com outra equipe.`;
      }
      o.comprados.push(a.id); mexer(o, { humor: -8 }); return 'O técnico engoliu a recusa — e comentou numa entrevista que "o elenco é curto".';
    },
    ignorar: o => { mexer(o, { humor: -5 }); return 'O pedido do técnico ficou sem resposta.'; }
  },
  {
    tipo: 'jogador_stream', quem: 'Elenco', peso: 2, cabe: (_v, o) => o.elenco.length > 0,
    montar: (_v, o) => { const j = craque(o); return { titulo: `${j.nick} quer fazer mais lives`, texto: `${j.nick}, o destaque do time, recebeu uma proposta para fazer streaming todos os dias. Ele quer topar — e dividir a receita com a organização.`, jogadorId: j.id,
      opcoes: [{ id: 'liberar', texto: 'Liberar as lives', dica: 'Fãs e receita; ele treina menos.' }, { id: 'proibir', texto: 'Proibir: o foco é o competitivo', dica: 'Ele pode ficar contrariado.' }, { id: 'meio', texto: 'Liberar só fora da temporada', dica: 'Um meio-termo.' }] }; },
    resolver: (_v, o, s, op, r) => {
      const j = o.elenco.find(x => x.id === s.jogadorId); if (!j) return 'O jogador já não estava no elenco.';
      if (op === 'liberar') { const g = arred(30000 + o.fas * 2000); j.forca = Math.max(25, j.forca - 1); mexer(o, { fas: 4, caixa: g }); return `As lives de ${j.nick} bombaram: ${fmt(g)} para a organização e muitos fãs novos — e um pouco menos de treino.`; }
      if (op === 'proibir') { if (r.chance(0.5)) return `${j.nick} entendeu e seguiu focado.`; j.forca = Math.max(25, j.forca - 2); mexer(o, { moral: -0.4 }); return `${j.nick} ficou contrariado e caiu de rendimento.`; }
      mexer(o, { fas: 2, moral: 0.1 }); return `${j.nick} topou: lives só nas férias.`;
    },
    ignorar: o => { mexer(o, { moral: -0.2 }); return 'O pedido das lives ficou sem resposta.'; }
  },
  {
    tipo: 'proposta', quem: 'Elenco', peso: 2.5, cabe: (_v, o) => { const j = craque(o); return !!j && j.forca >= tetoDeAtracao(o) - 2; },
    montar: (v, o, r) => { const j = craque(o); const valor = arred(valorDoJogador31(j, anoDe(v.t), o.regiao, jogo(o.jogo).auge) * (1.4 + r.next() * 0.3)); return { titulo: 'Proposta por um titular', texto: `Uma organização maior oferece ${fmt(valor)} pela multa de ${j.nick} (${j.forca} de força).`, jogadorId: j.id, valor,
      opcoes: [{ id: 'vender', texto: `Vender por ${fmt(valor)}`, dica: 'Caixa garantido; o time perde força.' }, { id: 'segurar', texto: 'Recusar e renovar com aumento', dica: 'Ele fica; a folha cresce.' }, { id: 'mais', texto: 'Pedir mais', dica: 'Pode render muito — ou esfriar.' }] }; },
    resolver: (v, o, s, op, r) => {
      const j = o.elenco.find(x => x.id === s.jogadorId); if (!j) return 'O jogador já não estava no elenco.';
      const vender = (valor: number) => { o.elenco.splice(o.elenco.indexOf(j), 1); o.caixa += valor; o.vendas.unshift({ nome: j.nick, para: 'uma organização maior', valor, ano: anoDe(v.t) }); if (o.vendas.length > 20) o.vendas.length = 20; if (o.igl === j.id) o.igl = undefined; };
      if (op === 'vender') { vender(s.valor!); mexer(o, { fas: -2 }); return `${j.nick} foi vendido por ${fmt(s.valor!)}.`; }
      if (op === 'segurar') { j.salario = arred(j.salario * 1.35, 1000); j.contratoAte = anoDe(v.t) + 2; mexer(o, { fas: 3, moral: 0.3 }); return `${j.nick} fica: renovou até ${j.contratoAte}.`; }
      if (r.chance(0.45)) { const mais = arred(s.valor! * 1.25); vender(mais); return `A proposta subiu para ${fmt(mais)}, e ${j.nick} foi vendido.`; }
      mexer(o, { moral: -0.2 }); return `O interesse esfriou: ${j.nick} fica — meio frustrado.`;
    },
    ignorar: o => { mexer(o, { moral: -0.2 }); return 'A proposta ficou sem resposta e caducou.'; }
  }
];
for (const m of MESA) QUEM_DA_MESA31[m.tipo] = m.quem;

/** O reforço que o técnico indicaria: o melhor do mercado na função mais fraca dos titulares, MELHOR do que quem joga lá. */
function sugestao(v: Vida, o: OrgEsports31): JogadorDoMercado31 | undefined {
  const tit = titulares31(o, anoDe(v.t));
  const fraco = [...tit].sort((a, b) => a.forca - b.forca)[0];
  if (!fraco) return undefined;
  return mercadoOrg31(v).filter(j => j.funcao === fraco.funcao && j.forca > fraco.forca).sort((a, b) => b.forca - a.forca)[0];
}

function abrirMesa(v: Vida, o: OrgEsports31, n: number): void {
  const ano = anoDe(v.t);
  for (const s of o.mesa) { const m = MESA.find(x => x.tipo === s.tipo); if (m) o.mesaHist.unshift({ ano: s.ano, tipo: s.tipo, titulo: s.titulo, texto: m.ignorar(o), ignorado: true }); }
  o.mesa = [];
  const r = rngDe(v.id, 'org31_mesa', o.nome, ano);
  const recentes = new Set(o.mesaHist.filter(h => ano - h.ano <= 1).map(h => h.tipo));
  const cand = MESA.filter(m => !recentes.has(m.tipo) && m.cabe(v, o));
  for (let k = 0; k < n && cand.length; k++) {
    const total = cand.reduce((s, m) => s + m.peso, 0);
    let u = r.next() * total, i = 0;
    for (; i < cand.length - 1; i++) { u -= cand[i].peso; if (u <= 0) break; }
    const m = cand.splice(i, 1)[0];
    const corpo = m.montar(v, o, r);
    if (corpo) o.mesa.push({ id: `${m.tipo}_${ano}_${k}`, tipo: m.tipo, ano, ...corpo });
  }
  if (o.mesaHist.length > 30) o.mesaHist.length = 30;
}

function responderMesa(v: Vida, o: OrgEsports31, id: string, op: string): { texto: string; tom: 'bom' | 'ruim' | 'neutro' } {
  const s = o.mesa.find(x => x.id === id)!;
  const m = MESA.find(x => x.tipo === s.tipo)!;
  const antes = o.fas + (o.moral ?? 0) * 5;
  const texto = m.resolver(v, o, s, op, rngDe(v.id, 'org31_resposta', s.id, op));
  o.mesa = o.mesa.filter(x => x.id !== id);
  o.mesaHist.unshift({ ano: s.ano, tipo: s.tipo, titulo: s.titulo, texto, opcao: s.opcoes.find(x => x.id === op)?.texto });
  if (o.mesaHist.length > 30) o.mesaHist.length = 30;
  escrever(v, { texto: `${o.nome} · ${s.titulo}: ${texto}`, relevancia: 'cotidiano', tema: 'trabalho', escolha: true });
  const saldo = o.fas + (o.moral ?? 0) * 5 - antes;
  return { texto, tom: saldo > 0 ? 'bom' : saldo < 0 ? 'ruim' : 'neutro' };
}

/* ------------------------------------------------------------------ a temporada */

const fatia = (col: number, n: number) => (col === 1 ? 0.32 : col === 2 ? 0.16 : col <= 4 ? 0.08 : col <= 8 ? 0.035 : col <= Math.max(8, n / 4) ? 0.01 : 0);
/** A colocação num campo de `n` equipes (o campo em volta de `campo`), pela força e um tanto de acaso. */
function colocacao(r: Rng, forca: number, campo: number, n: number): number {
  const minha = forca + r.normal() * 3;
  let acima = 0;
  for (let k = 0; k < n - 1; k++) if (campo + r.normal() * 5 + r.normal() * 3 > minha) acima++;
  return acima + 1;
}

/** A temporada que fechou (na virada do ano): a liga, o mundial, o dinheiro, os fãs, o elenco, a academia e a mesa. */
export function processarOrg31(v: Vida): void {
  const o = v.orgEsports31;
  if (!o || v.morte) return;
  const ano = anoDe(v.t - 6);
  if (o.historico.some(h => h.ano === ano) || anoDe(o.desde) > ano) return;
  const g = jogo(o.jogo);
  const br = o.regiao === 'BR';
  const r = rngDe(v.id, 'org31_ano', o.nome, ano);
  // 1. A liga do degrau.
  const forca = forcaDoTime31(o, ano);
  const nivel = g.niveis[o.divisao - 1];
  const n = clamp(nivel.equipes, 8, 16);
  const posicao = colocacao(r, forca, forcaDoCampo31(o.jogo, o.divisao, o.regiao), n);
  const liga = nomeDaLiga31(o, ano);
  const titulo = posicao === 1;
  const subiu = o.divisao < 4 && posicao <= (o.divisao === 2 ? 2 : 1);
  const caiu = o.divisao > 2 && posicao >= n - 1;
  // 2. O mundial: as do topo da liga principal.
  let mundial: TemporadaOrg31['mundial'];
  let premio = arred(nivel.premio * fatia(posicao, n) * (br ? 1 : 1.5));
  if (o.divisao === 4 && posicao <= (br ? 2 : 4)) {
    const nm = clamp(g.niveis[4].equipes, 12, 24);
    const col = colocacao(r, forca, forcaDoCampo31(o.jogo, 5) - 2, nm);
    mundial = { nome: nomeDoMundial31(o.jogo, ano), colocacao: col, participantes: nm };
    premio += arred(g.niveis[4].premio * fatia(col, nm));
  }
  // 3. O dinheiro.
  const patrocinio = o.patrocinio && o.patrocinio.ate >= ano ? o.patrocinio.valor : 0;
  const receita = arred(receitaBase31(o.divisao, o.fas, o.reputacao, o.regiao) + receitaConteudo(o) + patrocinio + premio);
  const folha = o.elenco.reduce((s, j) => s + j.salario, 0) + o.academia.reduce((s, j) => s + j.salario, 0);
  const despesa = arred(folha + (o.tecnico?.salario ?? 0) + OPERACAO[o.divisao] * MULT[o.regiao] + receita * 0.3 + [0, 60e3, 200e3][o.academiaNivel] * MULT[o.regiao] + o.divida * 0.12);
  o.caixa += receita - despesa;
  if (o.caixa < 0) { o.divida += -o.caixa; o.caixa = 0; }
  else if (o.divida > 0 && o.caixa > receita * 0.2) { const a = Math.min(o.divida, Math.round((o.caixa - receita * 0.2) * 0.5)); o.divida -= a; o.caixa -= a; }
  // 4. Os fãs e o nome.
  const campeaoMundial = mundial?.colocacao === 1;
  const alvoFas = [0, 0, 12, 30, 58][o.divisao] + (titulo ? 8 : 0) + (mundial ? 10 : 0) + o.conteudo * 4;
  o.fas = clamp(Math.round(o.fas * 0.8 + alvoFas * 0.2 + (subiu ? 4 : 0) - (caiu ? 5 : 0) + (campeaoMundial ? 10 : 0)));
  if (patrocinio && o.patrocinio!.rep) o.reputacao = clamp(o.reputacao + o.patrocinio!.rep);
  o.reputacao = clamp(Math.round(o.reputacao + (titulo ? 6 : 0) + (subiu ? 5 : 0) - (caiu ? 7 : 0) + (n / 2 - posicao) * 0.5 + (mundial ? (campeaoMundial ? 15 : 4) : 0)));
  // 5. A história e os troféus.
  o.historico.push({ ano, divisao: o.divisao, liga, posicao, participantes: n, ...(mundial ? { mundial } : {}), premio, receita, despesa, caixa: o.caixa, forca, ...(titulo ? { titulo } : {}), ...(subiu ? { subiu } : {}), ...(caiu ? { caiu } : {}), ...(campeaoMundial ? { campeaoMundial } : {}) });
  if (o.historico.length > 40) o.historico.splice(0, o.historico.length - 40);
  if (titulo) o.trofeus.push({ ano, nome: `${liga.charAt(0).toUpperCase()}${liga.slice(1)}`, tipo: 'liga' });
  if (campeaoMundial) o.trofeus.push({ ano, nome: mundial!.nome, tipo: 'mundial' });
  const frase = campeaoMundial ? `Campeã do mundo! A ${o.nome}, a sua organização, venceu ${mundial!.nome} de ${ano}.`
    : titulo ? `A ${o.nome} foi campeã de ${liga} em ${ano}${mundial ? ` e terminou em ${mundial.colocacao}º no ${mundial.nome}` : ''}.`
      : subiu ? `A ${o.nome} subiu de divisão em ${ano} (${posicao}º em ${liga}).`
        : caiu ? `A ${o.nome} caiu de divisão em ${ano}: ${posicao}º de ${n} em ${liga}.`
          : `A ${o.nome} terminou ${ano} em ${posicao}º de ${n} em ${liga}${mundial ? `, e em ${mundial.colocacao}º no ${mundial.nome}` : ''}. Receita de ${fmt(receita)}, despesa de ${fmt(despesa)}.`;
  escrever(v, { texto: frase, relevancia: titulo || subiu || caiu || mundial ? 'marco' : 'cotidiano', tema: 'trabalho', tom: titulo || subiu || campeaoMundial ? 'bom' : caiu ? 'ruim' : undefined });
  if (subiu) o.divisao = (o.divisao + 1) as Divisao31;
  if (caiu) o.divisao = (o.divisao - 1) as Divisao31;
  if (o.patrocinio && o.patrocinio.ate <= ano) o.patrocinio = undefined;
  // 6. O assédio de fora: quem passa muito do que a organização segura recebe proposta — e quase sempre vai.
  const segura = tetoDeAtracao(o) + 3;
  for (const j of [...o.elenco].filter(x => x.forca > segura).sort((a, b) => b.forca - a.forca).slice(0, 2)) {
    if (!r.chance(0.4) || o.elenco.length <= titularesDoJogo31(o.jogo, ano)) continue;
    const valor = arred(valorDoJogador31(j, ano, o.regiao, g.auge) * (1 + r.next() * 0.3));
    o.elenco.splice(o.elenco.indexOf(j), 1); o.caixa += valor; if (o.igl === j.id) o.igl = undefined;
    o.vendas.unshift({ nome: j.nick, para: 'uma organização maior', valor, ano }); if (o.vendas.length > 20) o.vendas.length = 20;
    escrever(v, { texto: `${j.nick} saiu da ${o.nome} para uma organização maior, que pagou a multa: ${fmt(valor)}.`, relevancia: 'cotidiano', tema: 'trabalho' });
  }
  // 7. Os jogadores: a mão chega ao auge cedo e cai depois; o técnico e o bootcamp ajudam os jovens.
  const novoAno = ano + 1;
  const evoluir = (j: JogadorOrg31) => {
    const i = novoAno - anoDe(j.tNasc);
    const ajuda = 0.15 + (o.tecnico?.nivel ?? 1) * 0.02 + (o.bootcamp === ano ? 0.04 : 0) - (o.conteudo === 2 ? 0.04 : 0);
    if (i <= g.auge) j.forca = clamp(Math.round(j.forca + Math.max(0, (j.potencial - j.forca) * ajuda) + r.normal() * 1.5), 20, j.potencial);
    else if (i <= g.auge + 4) j.forca = clamp(Math.round(j.forca + r.normal() * 1.2), 20, 97);
    else j.forca = clamp(Math.round(j.forca - (i - g.auge - 4) * 0.9 + r.normal()), 20, 97);
    if (j.forca > j.potencial) j.potencial = j.forca;
  };
  o.elenco.forEach(evoluir); o.academia.forEach(evoluir);
  // Os contratos que acabam: a comissão renova quem é útil; os outros saem.
  const media = mediaDosTitulares31(o, novoAno);
  for (const j of o.elenco) if (j.contratoAte <= ano && novoAno - anoDe(j.tNasc) <= g.auge + 6 && j.forca >= media - 4 && r.chance(0.7)) { j.contratoAte = novoAno + 1; j.salario = salarioDe31(j.forca, o.regiao); }
  const saem = o.elenco.filter(j => j.contratoAte <= ano || novoAno - anoDe(j.tNasc) >= g.auge + 12);
  if (saem.length) {
    o.elenco = o.elenco.filter(j => !saem.includes(j));
    if (o.igl && saem.some(j => j.id === o.igl)) o.igl = undefined;
    escrever(v, { texto: `Deixaram a ${o.nome} no fim do contrato: ${saem.map(j => j.nick).join(', ')}.`, relevancia: 'cotidiano', tema: 'trabalho' });
  }
  // O time nunca fica sem gente: os livres do cenário (um pouco abaixo do que saiu).
  const fs = funcoesDoJogo(o.jogo);
  while (o.elenco.length < titularesDoJogo31(o.jogo, novoAno) + 1) {
    const f = fs.find(x => !o.elenco.some(j => j.funcao === x)) ?? r.pick(fs);
    o.elenco.push(novoJogador(o, r, novoAno, f, Math.min(media - 3, forcaDoCampo31(o.jogo, o.divisao, o.regiao)) + r.normal() * 3, g.auge - 2 + r.int(0, 5)));
  }
  // 8. A academia revela.
  if (o.academiaNivel > 0) {
    for (let k = 0; k < o.academiaNivel + 1; k++) {
      const j = novoJogador(o, r, novoAno, r.pick(fs), media - 12 + r.normal() * 4, g.idadePro - 1 + r.int(0, 2));
      j.potencial = clamp(Math.round(j.forca + 12 + o.academiaNivel * 4 + Math.max(0, r.normal()) * 8), j.forca, r.chance(0.05) ? 95 : 90);
      j.daAcademia = true; j.salario = Math.round(j.salario * 0.25);
      o.academia.push(j);
    }
    o.academia = o.academia.filter(j => novoAno - anoDe(j.tNasc) <= g.auge).sort((a, b) => b.potencial - a.potencial).slice(0, 6);
  }
  // 9. O clima passa; o valor da organização; a mesa do ano.
  if (o.moral) o.moral = Math.round(o.moral * 5) / 10;
  atualizarValor(o, novoAno);
  abrirMesa(v, o, titulo || caiu || subiu ? 3 : 2);
}

function atualizarValor(o: OrgEsports31, ano: number): void {
  const g = jogo(o.jogo);
  const elenco = o.elenco.reduce((s, j) => s + valorDoJogador31(j, ano, o.regiao, g.auge), 0);
  o.valor = arred(receitaBase31(o.divisao, o.fas, o.reputacao, o.regiao) * 1.8 + elenco * 0.6 + (o.fas * o.reputacao / 100) * 60e3 * MULT[o.regiao] + o.trofeus.length * 200e3 * MULT[o.regiao], 1e5);
}

/* ------------------------------------------------------------------ fama e saves */

registrarMotivoDoNome(v => {
  const o = v.orgEsports31;
  if (!o) return undefined;
  return { valor: Math.min(60, o.fas / 4 + o.reputacao / 6 + o.trofeus.length * 4), fonte: 'negocio' };
});

/** Saves: o estado é opcional; o que vier quebrado sai, o que faltar ganha o padrão. */
export function normalizarVida32Org(v: Vida): void {
  const o = v.orgEsports31 as Partial<OrgEsports31> | undefined;
  if (o === undefined) return;
  if (!o || typeof o !== 'object' || typeof o.nome !== 'string' || !Array.isArray(o.elenco) || !o.jogo || !JOGOS25[o.jogo]) { delete v.orgEsports31; return; }
  o.academia ??= []; o.historico ??= []; o.trofeus ??= []; o.comprados ??= []; o.vendas ??= []; o.mesa ??= []; o.mesaHist ??= [];
  o.academiaNivel ??= 0; o.conteudo ??= 0; o.seq ??= o.elenco.length + 100;
  o.regiao = o.regiao === 'INT' ? 'INT' : 'BR';
  if (o.divisao !== 2 && o.divisao !== 3 && o.divisao !== 4) o.divisao = 2;
  for (const k of ['caixa', 'divida', 'valor', 'preco', 'fas', 'reputacao'] as const) if (typeof o[k] !== 'number' || !Number.isFinite(o[k])) o[k] = 0;
}
