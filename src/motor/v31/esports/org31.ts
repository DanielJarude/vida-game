/**
 * VIDA 32 · A SUA ORGANIZAÇÃO DE E-SPORTS — e VIDA 33 · UMA ORGANIZAÇÃO, VÁRIOS JOGOS.
 *
 * A organização (o nome, a identidade, o caixa, os fãs, o nome no cenário, os patrocínios, a loja, o conteúdo e a mesa do
 * dono) tem uma LINE por jogo. Cada line disputa a liga da sua REGIÃO no circuito real do jogo (`circuitos33`: CBLOL, LCS,
 * LEC, LCK, VCT Americas, Challengers Brazil, South America League, FNCS, RLCS...), sobe e cai pelas regras daquela liga
 * (as ligas fechadas não têm queda; a Ascension do VALORANT promovia de 2023 a 2025), e as que terminam nas vagas vão aos
 * torneios internacionais do jogo (Mundial, MSI, Masters, Champions, Majors, Six Invitational, Global Championship).
 *
 * A line é como no cenário: os titulares do jogo (5 no tático e no MOBA, 3 no Rocket, a dupla ou o trio do Fortnite) e no
 * máximo UM reserva; o técnico fica fora da line. A academia é à parte.
 *
 * Entrar num jogo: montar do zero no cenário aberto, comprar a vaga de uma equipe da segunda divisão, ou comprar a vaga na
 * liga principal (a franquia, nas ligas fechadas) — e o investimento inicial decide o elenco com que a line nasce.
 *
 * Abstrações de jogo: receitas, salários e valores (reais de 2026, pelo mercado de cada região). Os nomes reais de
 * organizações vêm só do catálogo (`equipesReais29`), respeitando os anos; nenhum logotipo, nenhum resultado real; os
 * jogadores são fictícios. Todo sorteio é derivado (`rngDe(v.id, …)`): nada aqui mexe na sequência do resto da vida.
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
import {
  ajusteDaRegiao33, equipesDaLigaPrincipal33, internacionais33, ligaDoCircuito33, ligaFechada33, multDaRegiao33, nomeDaRegiao33, regiaoBrasil33,
  regiaoDaOrgReal33, regiaoDoJogo33, regiaoVigente33, regioesDoJogo33, regrasDaDivisao33
} from './circuitos33';
import { normalizarIdentidade33, type Identidade33 } from '../../v33/dono/identidade33';
import { contratoAntigo33, normalizarComercial33, novoComercial33, type Comercial33, type Contexto33 } from '../../v33/dono/patrocinio33';
import { normalizarLoja33, type Loja33 } from '../../v33/dono/loja33';
import {
  bonusDaCasa35, bonusDoSetup35, climaDoSetup35, comodo35, criadoresDoAno35, CUSTO_PENEIRA35, CUSTO_RETIRO35, custoDoSetup35, EVENTOS35, foco35, manutencaoDaCasa35, normalizarSetup35,
  REFORMULACAO35, SCRIMS35, STAFF35, TORNEIOS35, type Criador35, type Foco35, type Torneio35,
  type Comodo35, type Evento35, type Gabinete35, type NivelReformulacao35, type Peca35, type Setup35
} from './org35';
import { executarDono33, fecharAnoDono33, problemaDono33, type OpDono33 } from '../../v33/dono/dono33';

/* ------------------------------------------------------------------ o estado */

/** O id da região no circuito do jogo (`circuitos33`): 'br', 'na', 'eu', 'kr', 'sa'... */
export type Regiao31 = string;
/** O degrau: 2 cenário aberto · 3 segunda divisão · 4 liga principal (a que dá vaga nos internacionais). */
export type Divisao31 = 2 | 3 | 4;
export type Entrada33 = 'base' | 'acesso' | 'elite';

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
export interface Internacional31 { nome: string; colocacao: number; participantes: number; titulo?: boolean; viaQualificatoria?: boolean }
export interface TemporadaOrg31 {
  ano: number; divisao: Divisao31; liga: string; posicao: number; participantes: number;
  /** VIDA 33: os torneios internacionais do ano. */
  internacionais?: Internacional31[];
  /** Saves da VIDA 32 (um mundial só). */
  mundial?: { nome: string; colocacao: number; participantes: number };
  /** O torneio de acesso de uma liga fechada (a Ascension) e se a line subiu por ele. */
  acesso?: { nome: string; venceu: boolean };
  premio: number; receita: number; despesa: number; caixa?: number; forca: number;
  titulo?: boolean; subiu?: boolean; caiu?: boolean; campeaoMundial?: boolean;
}
export interface Trofeu31 { ano: number; nome: string; tipo: 'liga' | 'mundial' | 'internacional' }
export interface Tecnico31 { nome: string; nivel: number; salario: number; desde: number }
export interface SituacaoOrg31 {
  id: string; tipo: string; ano: number; titulo: string; texto: string;
  /** VIDA 33: a line do assunto. */
  jogo?: JogoId;
  jogadorId?: string; alvoId?: string; valor?: number;
  opcoes: { id: string; texto: string; dica?: string }[];
}
/** VIDA 33 · a line de um jogo. */
export interface LinhaOrg33 {
  jogo: JogoId; regiao: Regiao31; divisao: Divisao31;
  /** `v.t` em que a line entrou. */
  desde: number;
  entrada?: Entrada33 | 'compra';
  elenco: JogadorOrg31[];
  academia: JogadorOrg31[]; academiaNivel: 0 | 1 | 2;
  tecnico?: Tecnico31; humorTecnico?: number;
  igl?: string;
  /** O ano (temporada) em que o bootcamp foi feito. */
  bootcamp?: number;
  /** O clima da line (−3..+3 na força). */
  moral?: number;
  historico: TemporadaOrg31[]; trofeus: Trofeu31[];
  comprados: string[];
  vendas: { nome: string; para: string; valor: number; ano: number }[];
  /** VIDA 35 · o equipamento da line, a line academy (um segundo time que compete) e os emprestados. */
  setup35?: Setup35;
  academy35?: Academy35;
  emprestados35?: { jogador: JogadorOrg31; para: string; ate: number }[];
  /** VIDA 35.1 · o dia a dia: o foco do treino, os scrims da temporada, a comissão, o retiro, o corte, a peneira aberta, os torneios extras. */
  foco35?: Foco35;
  scrims35?: { ano: number; nivel: 1 | 2 };
  staff35?: 0 | 1 | 2;
  retiro35?: number;
  corte35?: number;
  peneira35?: number;
  torneios35?: { ano: number; tipo: Torneio35; nome: string; colocacao: number; participantes: number; premio: number }[];
}
/** VIDA 35 · a line academy: o time B, que disputa uma divisão abaixo da principal e forma jogadores jogando. */
export interface Academy35 {
  desde: number; divisao: Divisao31;
  elenco: JogadorOrg31[];
  historico: { ano: number; liga: string; divisao: Divisao31; posicao: number; participantes: number; subiu?: boolean; caiu?: boolean }[];
}
export interface OrgEsports31 {
  nome: string;
  /** `v.t` da compra ou da fundação. */
  desde: number; fundada?: boolean;
  preco: number; caixa: number; divida: number; valor: number;
  /** 0..100. */
  fas: number; reputacao: number;
  /** Conteúdo e streaming: 0 nada · 1 lives semanais · 2 casa de criadores (mais receita e fãs, menos treino). */
  conteudo: 0 | 1 | 2;
  linhas: LinhaOrg33[];
  seq: number;
  mesa: SituacaoOrg31[];
  mesaHist: { ano: number; tipo: string; titulo: string; texto: string; opcao?: string; ignorado?: boolean }[];
  /** VIDA 33 · o que todo dono tem: a identidade, os patrocínios e a loja. */
  identidade33?: Identidade33;
  instalacoes34?: import('../../v33/dono/instalacoes34').Instalacoes34;
  comercial33?: Comercial33;
  loja33?: Loja33;
  /** VIDA 35 · os cômodos da gaming house, os eventos feitos (ano e tipo) e as orgs cujas lines foram compradas. */
  casa35?: Comodo35[];
  eventos35?: { ano: number; tipo: Evento35 }[];
  absorvidas35?: string[];
  /** VIDA 35.1 · os criadores de conteúdo contratados, o bônus por meta e a collab com o jogo (ano). */
  criadores35?: Criador35[];
  bicho35?: boolean;
  collab35?: number;
}

/* ------------------------------------------------------------------ as réguas */

const RECEITA: Record<Divisao31, number> = { 2: 250e3, 3: 1.2e6, 4: 6e6 };
const OPERACAO: Record<Divisao31, number> = { 2: 60e3, 3: 250e3, 4: 900e3 };
const arred = (x: number, a = 1e4) => Math.round(x / a) * a;
const hashNum = (s: string) => { let h = 2166136261; for (let k = 0; k < s.length; k++) { h ^= s.charCodeAt(k); h = Math.imul(h, 16777619); } return h >>> 0; };
/** VIDA 35.1 · os criadores que aceitam assinar com a organização neste ano. */
export const criadoresDisponiveis35 = (v: Vida) => (v.orgEsports31 ? criadoresDoAno35(hashNum(v.id), anoDe(v.t), multMedio(v.orgEsports31)).filter(c => !(v.orgEsports31!.criadores35 ?? []).some(x => x.id === c.id)) : []);
const jogo = (id: JogoId) => JOGOS25[id];
const multDe = (L: Pick<LinhaOrg33, 'jogo' | 'regiao'>) => multDaRegiao33(L.jogo, L.regiao);
export const titularesDoJogo31 = (id: JogoId, ano: number) => jogo(id).porEquipe(ano);
/** A line: os titulares e no máximo um reserva. */
export const maxElenco31 = (id: JogoId, ano: number) => titularesDoJogo31(id, ano) + 1;
/** A força média do campo do degrau na região (a régua de `jogos25` com o peso de cada região). */
export const forcaDoCampo31 = (id: JogoId, div: number, regiao: Regiao31) => jogo(id).niveis[clamp(div, 1, 5) - 1].forca + ajusteDaRegiao33(id, regiao, div);
export const forcaDoInternacional31 = (id: JogoId) => jogo(id).niveis[4].forca - 1;
export const nomeDaLiga31 = (L: Pick<LinhaOrg33, 'jogo' | 'divisao' | 'regiao'>, ano: number) => ligaDoCircuito33(L.jogo, L.regiao, L.divisao, ano);
export const NOME_DIVISAO31: Record<Divisao31, string> = { 2: 'Cenário aberto', 3: 'Segunda divisão', 4: 'Liga principal' };
export const NOME_ENTRADA33: Record<Entrada33, string> = { base: 'Montar do zero', acesso: 'Comprar uma vaga na segunda divisão', elite: 'Comprar uma vaga na liga principal' };
const DIV_DA_ENTRADA: Record<Entrada33, Divisao31> = { base: 2, acesso: 3, elite: 4 };
export const linhaDe31 = (o: OrgEsports31, jid?: JogoId) => (jid ? o.linhas.find(l => l.jogo === jid) : o.linhas[0]);

export const salarioDe31 = (forca: number, mult: number) => arred(Math.pow(1.12, forca - 50) * 30000 * mult, 1000);
export function valorDoJogador31(j: JogadorOrg31, ano: number, mult: number, auge: number): number {
  const i = ano - anoDe(j.tNasc);
  const f = i <= auge - 3 ? 1.4 : i <= auge + 1 ? 1.2 : i <= auge + 4 ? 1 : i <= auge + 7 ? 0.6 : 0.3;
  const pot = Math.max(0, j.potencial - j.forca) * (i <= auge ? 0.05 : 0.01);
  return arred(Math.pow(1.14, j.forca - 50) * 15000 * f * (1 + pot) * mult);
}
export function receitaBase31(div: Divisao31, fas: number, reputacao: number, mult: number): number {
  return arred(RECEITA[div] * (0.5 + fas / 80) * (0.85 + reputacao / 300) * mult);
}
const melhorDivisao = (o: OrgEsports31): Divisao31 => o.linhas.reduce<number>((m, l) => Math.max(m, l.divisao), 2) as Divisao31;
const multMedio = (o: OrgEsports31) => (o.linhas.length ? o.linhas.reduce((s, l) => s + multDe(l), 0) / o.linhas.length : 1);
const receitaConteudo = (o: OrgEsports31) => arred(RECEITA[melhorDivisao(o)] * [0, 0.15, 0.35][o.conteudo] * multMedio(o) + o.conteudo * 30000 * (0.5 + o.fas / 100));

/* ------------------------------------------------------------------ jogadores */

const NICKS = ['kyo', 'zeta', 'nox', 'drako', 'liz', 'tuca', 'raio', 'mito', 'vex', 'bruma', 'kai', 'sora', 'pira', 'tank', 'guri', 'lumi', 'brisa', 'axe', 'nina', 'cobra', 'faro', 'max', 'yumi', 'ruivo', 'kenji', 'saci', 'pulga', 'orca', 'neon', 'gelo', 'pixel', 'ziggy', 'bento', 'koda', 'shiny', 'tatu', 'jambo', 'quark', 'ravi', 'sapeca', 'mango', 'trama', 'vento', 'iris', 'caju', 'brasa', 'luar', 'kraken'];

function novoJogador(o: Pick<OrgEsports31, 'seq'>, L: Pick<LinhaOrg33, 'jogo' | 'regiao'>, r: Rng, ano: number, funcao: string, forca: number, idadeJ: number): JogadorOrg31 {
  const feminino = r.chance(0.1);
  const pais = regiaoDoJogo33(L.jogo, L.regiao)?.pais ?? 'BR';
  const f = clamp(Math.round(forca), 25, 96);
  const pot = clamp(Math.round(f + Math.max(0, jogo(L.jogo).auge + 1 - idadeJ) * (0.8 + r.next() * 1.4)), f, r.chance(0.05) ? 95 : 90);
  o.seq += 1;
  let nome: string;
  try { nome = `${sortearNome(r, feminino ? 'feminino' : 'masculino', ano - idadeJ, pais)} ${sortearSobrenome(r, pais)}`; } catch { nome = `${sortearNome(r, feminino ? 'feminino' : 'masculino', ano - idadeJ)} ${sortearSobrenome(r)}`; }
  return {
    id: `e${o.seq}`, nick: `${r.pick(NICKS)}${r.chance(0.3) ? r.int(1, 99) : ''}`, nome, ...(feminino ? { feminino } : {}),
    tNasc: (ano - idadeJ) * 12 + r.int(0, 11), funcao, forca: f, potencial: pot, salario: salarioDe31(f, multDe(L)), contratoAte: ano + r.int(1, 2)
  };
}
const funcoesDoJogo = (id: JogoId) => jogo(id).funcoes.map(f => f.id);
export const nomeDaFuncao31 = (id: JogoId, f: string) => jogo(id).funcoes.find(x => x.id === f)?.nome ?? f;

/** Os titulares: o melhor de cada função primeiro (um time precisa das funções), depois os melhores que sobram. */
export function titulares31(L: Pick<LinhaOrg33, 'jogo' | 'elenco'>, ano: number): JogadorOrg31[] {
  const n = titularesDoJogo31(L.jogo, ano);
  const ordem = [...L.elenco].sort((a, b) => b.forca - a.forca || a.id.localeCompare(b.id));
  const out: JogadorOrg31[] = [];
  for (const f of funcoesDoJogo(L.jogo)) { if (out.length >= n) break; const j = ordem.find(x => x.funcao === f && !out.includes(x)); if (j) out.push(j); }
  for (const j of ordem) { if (out.length >= n) break; if (!out.includes(j)) out.push(j); }
  return out;
}
export function mediaDosTitulares31(L: Pick<LinhaOrg33, 'jogo' | 'elenco'>, ano: number): number {
  const t = titulares31(L, ano);
  if (!t.length) return 30;
  const n = titularesDoJogo31(L.jogo, ano);
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

export function perfisDoElenco31(L: LinhaOrg33, ano: number): Map<string, PerfilOrg31> {
  const media = mediaDosTitulares31(L, ano);
  const tit = new Set(titulares31(L, ano).map(j => j.id));
  const titulos = L.trofeus.filter(t => ano - t.ano <= 3).length;
  const m = new Map<string, PerfilOrg31>();
  for (const j of L.elenco) m.set(j.id, perfilDoJogadorOrg31(j, L.jogo, ano, { mediaDoTime: media, igl: L.igl, reserva: !tit.has(j.id), titulos }));
  return m;
}

/** A química: o vestiário que os perfis dos titulares fazem; sem IGL escolhido, o time joga sem voz. De −2 a +2. */
export function quimica31(L: LinhaOrg33, ano: number): number {
  const perfis = perfisDoElenco31(L, ano);
  const tit = titulares31(L, ano);
  const soma = tit.reduce((s, j) => s + efeitosDoPerfil(perfis.get(j.id)?.perfil).vestiario, 0);
  const iglOk = !!L.igl && tit.some(j => j.id === L.igl);
  return Math.round(clamp(soma * 0.35 + (iglOk ? 0.4 : -0.6), -2, 2) * 10) / 10;
}
export const bonusDoTecnico31 = (L: Pick<LinhaOrg33, 'tecnico' | 'humorTecnico'>) => (L.tecnico ? (L.tecnico.nivel - 2) * 1.2 + ((L.humorTecnico ?? 60) - 60) / 40 * 0.6 : 0);
/** A força da line na temporada: os titulares, a química, o técnico, o bootcamp, o clima e o tempo que o conteúdo come. */
export function forcaDoTime31(o: Pick<OrgEsports31, 'conteudo'> & Partial<Pick<OrgEsports31, 'casa35'>>, L: LinhaOrg33, ano: number): number {
  return Math.round((mediaDosTitulares31(L, ano) + quimica31(L, ano) + bonusDoTecnico31(L) + (L.bootcamp === ano ? 2 : 0) + (L.moral ?? 0) - (o.conteudo === 2 ? 1 : 0)
    + bonusDoSetup35(L.setup35, ano) + bonusDaCasa35(o.casa35, !!L.tecnico) + extrasDaLinha35(L, ano)) * 10) / 10;
}
/** VIDA 35.1 · o foco do treino, os scrims da temporada e a comissão técnica na força. */
export function extrasDaLinha35(L: LinhaOrg33, ano: number): number {
  return Math.round((foco35(L.foco35).forca + (L.scrims35?.ano === ano ? SCRIMS35[L.scrims35.nivel - 1].forca : 0) + STAFF35[L.staff35 ?? 0].forca) * 10) / 10;
}
/** VIDA 35 · a força da line academy (os titulares dela). */
export function forcaDaAcademy35(L: LinhaOrg33, ano: number): number {
  const a = L.academy35;
  if (!a?.elenco.length) return 0;
  const n = titularesDoJogo31(L.jogo, ano);
  const top = [...a.elenco].sort((x, y) => y.forca - x.forca).slice(0, n);
  return Math.round((top.reduce((s, j) => s + j.forca, 0) / n + bonusDoSetup35(L.setup35, ano) * 0.5) * 10) / 10;
}

/* ------------------------------------------------------------------ à venda */

export interface OrgAVenda31 { nome: string; jogo: JogoId; regiao: Regiao31; divisao: Divisao31; real: boolean; forca: number; fas: number; reputacao: number; receita: number; divida: number; valor: number; preco: number }

const RAIZES = ['Vórtice', 'Nébula', 'Atalaia', 'Carcará', 'Mandacaru', 'Boitatá', 'Graúna', 'Jaguatirica', 'Guará', 'Pororoca', 'Basalto', 'Quasar', 'Órbita', 'Cobalto', 'Tucuxi', 'Ipê Roxo', 'Sertão', 'Maré Alta', 'Farol', 'Bússola', 'Granito', 'Vagalume', 'Siriema', 'Cerrado'];
const RAIZES_INT = ['Northwind', 'Kestrel', 'Obsidian', 'Halcyon', 'Tundra', 'Meridian', 'Crimson Lynx', 'Solstice', 'Ironclad', 'Nightjar', 'Vanta', 'Polaris', 'Ember', 'Glacier', 'Zenith', 'Lotus'];
const SUFIXOS = ['Gaming', 'Esports', 'Team', 'GG', 'Club'];
const ler = (x: string) => { const [nome, d, a] = x.split('|'); return { nome, desde: Number(d), ate: a ? Number(a) : undefined }; };

interface Catalogado { nome: string; regiao: Regiao31; divisao: Divisao31; base: number; real: boolean }
/** As organizações de um jogo à venda no ano: as do catálogo que existiam (cada uma na sua região) e fictícias por região. */
function catalogo(v: Vida, jid: JogoId, ano: number): Catalogado[] {
  const t = EQUIPES_REAIS29[jid];
  const out: Catalogado[] = [];
  const vistos = new Set<string>();
  const regs = new Set(regioesDoJogo33(jid, ano).map(r => r.id));
  const add = (lista: string[] | undefined, regiao: (nome: string) => string, divisao: Divisao31, extra: number) => {
    for (const e of (lista ?? []).map(ler)) {
      if (e.desde > ano || (e.ate !== undefined && e.ate < ano) || vistos.has(e.nome)) continue;
      const rg = regiaoVigente33(jid, regiao(e.nome), ano);
      if (!regs.has(rg)) continue;
      vistos.add(e.nome);
      out.push({ nome: e.nome, regiao: rg, divisao, base: forcaDoCampo31(jid, divisao, rg) + extra, real: true });
    }
  };
  const br = () => regiaoBrasil33(jid);
  add(t.br[4], br, 4, 2); add(t.br[3], br, 3, 1); add(t.br[2], br, 2, 1);
  const fora = (n: string) => regiaoDaOrgReal33(jid, n);
  add(t.int[5], fora, 4, 4); add(t.int[4], fora, 4, 0); add(t.int[3], fora, 3, 0);
  const r = rngDe(v.id, 'org31_ficticias', jid);
  for (const rg of regioesDoJogo33(jid, ano)) for (let k = 0; k < 2; k++) {
    const raiz = rg.pais === 'BR' ? RAIZES[r.int(0, RAIZES.length - 1)] : RAIZES_INT[r.int(0, RAIZES_INT.length - 1)];
    const nome = `${raiz} ${SUFIXOS[r.int(0, SUFIXOS.length - 1)]}`;
    if (vistos.has(nome)) continue;
    vistos.add(nome);
    const divisao = (k === 0 ? 2 : 3) as Divisao31;
    out.push({ nome, regiao: rg.id, divisao, base: forcaDoCampo31(jid, divisao, rg.id) - 2, real: false });
  }
  return out;
}

function avaliar(v: Vida, jid: JogoId, x: Catalogado): OrgAVenda31 {
  const r = rngDe(v.id, 'org31_avaliar', jid, x.regiao, x.nome);
  const mult = multDaRegiao33(jid, x.regiao);
  const forca = Math.round(x.base + r.normal() * 2.5);
  const alto = forca - forcaDoCampo31(jid, x.divisao, x.regiao);
  const fas = clamp(Math.round([0, 0, 12, 30, 58][x.divisao] + alto * 3 + (x.real ? 8 : 0) + r.normal() * 6), 2, 98);
  const reputacao = clamp(Math.round([0, 0, 15, 32, 55][x.divisao] + alto * 3 + (x.real ? 6 : 0) + r.normal() * 5), 2, 98);
  const receita = receitaBase31(x.divisao, fas, reputacao, mult);
  const divida = arred(receita * (0.1 + r.next() * 0.6), 1e5);
  const elenco = titularesDoJogo31(jid, anoDe(v.t)) * Math.pow(1.14, forca - 50) * 15000 * mult;
  const vaga = x.divisao === 4 && ligaFechada33(jid, x.regiao, anoDe(v.t)) ? RECEITA[4] * 2 * mult : 0;
  const valor = arred(receita * 1.8 + elenco * 0.6 + vaga, 1e5);
  const preco = Math.max(arred(valor * 0.3, 1e5), arred(valor - divida, 1e5));
  return { nome: x.nome, jogo: jid, regiao: x.regiao, divisao: x.divisao, real: x.real, forca, fas, reputacao, receita, divida, valor, preco };
}

export const jogosDisponiveis31 = (ano: number): JogoId[] => LISTA_JOGOS25.filter(j => JOGOS25[j].lancado <= ano && regioesDoJogo33(j, ano).length > 0);

/** Todas as organizações à venda agora (de cada jogo já lançado). */
export function orgsAVenda31(v: Vida, filtro?: { jogo?: JogoId; regiao?: Regiao31 }): OrgAVenda31[] {
  const ano = anoDe(v.t);
  const jogos = filtro?.jogo ? [filtro.jogo] : jogosDisponiveis31(ano);
  return jogos.filter(j => JOGOS25[j].lancado <= ano)
    .flatMap(j => catalogo(v, j, ano).filter(x => (!filtro?.regiao || x.regiao === filtro.regiao) && !v.orgEsports31?.absorvidas35?.includes(`${j}:${x.nome}`) && x.nome !== v.orgEsports31?.nome).map(x => avaliar(v, j, x)));
}
export const avaliarOrg31 = (v: Vida, nome: string, jid: JogoId, regiao: Regiao31) => orgsAVenda31(v, { jogo: jid, regiao }).find(x => x.nome === nome);

/* ------------------------------------------------------------------ fundar, entrar num jogo: o custo e a prévia */

/** O registro da organização (CNPJ, contador, a primeira gaming house), no mercado da região da primeira line. */
export const custoDeFundar31 = (mult = 1) => arred(150000 * mult, 1e4);
/** A vaga: montar do zero é só a estrutura; a segunda divisão e a liga principal se compram de quem sai (a franquia, nas fechadas). */
export function custoDaVaga33(jid: JogoId, regiao: Regiao31, modo: Entrada33, ano: number): number {
  const m = multDaRegiao33(jid, regiao);
  if (modo === 'base') return arred(60e3 * m);
  if (modo === 'acesso') return arred(RECEITA[3] * 0.9 * m, 1e5);
  return arred(RECEITA[4] * (ligaFechada33(jid, regiao, ano) ? 2.5 : 1.4) * m, 1e5);
}
/** A unidade do investimento: um ano de salários de uma line no nível do campo. */
const unidadeDeInvestimento = (jid: JogoId, regiao: Regiao31, div: Divisao31, ano: number) => salarioDe31(forcaDoCampo31(jid, div, regiao), multDaRegiao33(jid, regiao)) * titularesDoJogo31(jid, ano);
export interface PreviaEntrada33 { divisao: Divisao31; liga: string; vaga: number; investimento: number; total: number; forca: number; campo: number; tecnico: number; reserva: boolean; folha: number; caixa: number; fechada: boolean }
/** O que o investimento compra: três quartos em contratações e comissão (o elenco nasce mais forte), um quarto no caixa. */
export function previaDaEntrada33(jid: JogoId, regiao: Regiao31, modo: Entrada33, investimento: number, ano: number): PreviaEntrada33 {
  const divisao = DIV_DA_ENTRADA[modo];
  const campo = forcaDoCampo31(jid, divisao, regiao);
  const inv = Math.max(0, Math.round(investimento));
  const un = unidadeDeInvestimento(jid, regiao, divisao, ano);
  const passos = Math.log2(1 + inv * 0.75 / un);
  const forca = Math.round((campo - 3 + Math.min(16, 5 * passos)) * 10) / 10;
  const tecnico = inv > 0 ? clamp(1 + Math.floor(passos), 1, 4) : 0;
  const reserva = inv >= un;
  const mult = multDaRegiao33(jid, regiao);
  const folha = salarioDe31(forca, mult) * (titularesDoJogo31(jid, ano) + (reserva ? 1 : 0)) + (tecnico ? [0, 40e3, 120e3, 350e3, 900e3][tecnico] * mult : 0);
  const vaga = custoDaVaga33(jid, regiao, modo, ano);
  return { divisao, liga: ligaDoCircuito33(jid, regiao, divisao, ano), vaga, investimento: inv, total: vaga + inv, forca, campo, tecnico, reserva, folha: arred(folha), caixa: arred(inv * 0.25), fechada: ligaFechada33(jid, regiao, ano) };
}

/* ------------------------------------------------------------------ as ações */

export type OqueOrg31 =
  | { op: 'comprar'; nome: string; jogo: JogoId; regiao: Regiao31; financiar?: boolean }
  | { op: 'fundar'; nome: string; jogo: JogoId; regiao: Regiao31; modo?: Entrada33; investimento?: number; identidade?: Identidade33 }
  | { op: 'entrar'; jogo: JogoId; regiao: Regiao31; modo: Entrada33; investimento?: number }
  | { op: 'sair'; jogo: JogoId }
  | { op: 'vender_org' }
  | { op: 'aportar'; valor: number }
  | { op: 'contratar'; id: string; jogo?: JogoId }
  | { op: 'dispensar'; id: string; jogo?: JogoId }
  | { op: 'renovar'; id: string; jogo?: JogoId }
  | { op: 'promover'; id: string; jogo?: JogoId; academy?: boolean }
  | { op: 'igl'; id: string; jogo?: JogoId }
  | { op: 'tecnico'; i: number; jogo?: JogoId }
  | { op: 'demitir_tecnico'; jogo?: JogoId }
  | { op: 'bootcamp'; jogo?: JogoId }
  | { op: 'academia'; nivel: 0 | 1 | 2; jogo?: JogoId }
  | { op: 'conteudo'; nivel: 0 | 1 | 2 }
  | { op: 'dono'; sub: OpDono33 }
  | { op: 'responder'; id: string; opcao: string }
  // VIDA 35
  | { op: 'setup'; jogo?: JogoId; setup: Pick<Setup35, Peca35> & { gabinete?: Gabinete35; rgb?: string }; renovar?: Peca35[] }
  | { op: 'comodo'; id: Comodo35; construir: boolean }
  | { op: 'evento'; tipo: Evento35 }
  | { op: 'comprar_linha'; nome: string; jogo: JogoId; regiao: Regiao31 }
  | { op: 'reformular'; jogo?: JogoId; manter: string[]; nivel: NivelReformulacao35 }
  | { op: 'academy'; jogo?: JogoId; ativar: boolean }
  | { op: 'subir'; jogo?: JogoId; id: string }
  | { op: 'descer'; jogo?: JogoId; id: string }
  | { op: 'emprestar'; jogo?: JogoId; id: string }
  | { op: 'vender_jogador'; jogo?: JogoId; id: string }
  // VIDA 35.1
  | { op: 'foco'; jogo?: JogoId; foco: Foco35 }
  | { op: 'scrims'; jogo?: JogoId; nivel: 1 | 2 }
  | { op: 'staff'; jogo?: JogoId; nivel: 0 | 1 | 2 }
  | { op: 'retiro'; jogo?: JogoId }
  | { op: 'corte'; jogo?: JogoId }
  | { op: 'peneira_aberta'; jogo?: JogoId }
  | { op: 'torneio'; jogo?: JogoId; tipo: Torneio35 }
  | { op: 'criador'; id: string }
  | { op: 'dispensar_criador'; id: string }
  | { op: 'bicho'; ligar: boolean }
  | { op: 'collab' };

export const custoDoBootcamp31 = (L: LinhaOrg33) => arred((L.divisao === 4 ? 250e3 : L.divisao === 3 ? 90e3 : 30e3) * multDe(L) * (1 + L.elenco.length / 10));
const nomeLimpo = (s: string) => (s ?? '').replace(/\s+/g, ' ').trim();

function conflito(v: Vida, jid: JogoId, nome: string): string | undefined {
  const e = v.esports25;
  if (e && e.fase !== 'encerrada' && e.jogo === jid && e.equipe && e.equipe.nome !== nome && e.nivel >= 3)
    return `Você joga pela ${e.equipe.nome}: o regulamento do circuito proíbe ser dono de outra organização no mesmo jogo.`;
  return undefined;
}
function regiaoValida(jid: JogoId, regiao: Regiao31, ano: number): string | undefined {
  if (JOGOS25[jid]?.lancado === undefined || JOGOS25[jid].lancado > ano) return 'Esse jogo ainda não existe.';
  if (!regioesDoJogo33(jid, ano).some(r => r.id === regiao)) return 'Essa região não tem circuito desse jogo neste ano.';
  return undefined;
}

/** O contexto do dono (patrocínios, loja): a receita de todas as lines. */
export function contextoOrg33(v: Vida, ano = anoDe(v.t)): Contexto33 {
  const o = v.orgEsports31!;
  return {
    tipo: 'esports', ano, receitaBase: Math.max(100e3, o.linhas.reduce((s, l) => s + receitaBase31(l.divisao, o.fas, o.reputacao, multDe(l)), 0)),
    fama: o.fas, reputacao: o.reputacao, noTopo: o.linhas.length > 0 && o.linhas.every(l => l.divisao === 4), temCasa: true, internacional: o.linhas.some(l => l.divisao >= 3)
  };
}

export function disponibilidadeOrg31(v: Vida, o: OqueOrg31): Veredito {
  if (idade(v) < 18) return bloqueio('requisito', 'Só quem é maior de idade é dono de uma organização.');
  const org = v.orgEsports31;
  const ano = anoDe(v.t);
  if (o.op === 'comprar' || o.op === 'fundar') {
    if (org) return bloqueio('incompativel', `Você já é dono da ${org.nome}: para outro jogo, entre com uma line nova na sua organização.`);
    const reg = regiaoValida(o.jogo, o.regiao, ano);
    if (reg) return bloqueio('impossivel', reg);
    const conf = conflito(v, o.jogo, o.nome);
    if (conf) return bloqueio('incompativel', conf);
    if (o.op === 'fundar') {
      const nome = nomeLimpo(o.nome);
      if (nome.length < 2 || nome.length > 32) return bloqueio('requisito', 'Escolha um nome de 2 a 32 letras.');
      if (jogosDisponiveis31(ano).some(j => catalogo(v, j, ano).some(x => x.nome.toLowerCase() === nome.toLowerCase()))) return bloqueio('incompativel', 'Já existe uma organização com esse nome no cenário.');
      const p = previaDaEntrada33(o.jogo, o.regiao, o.modo ?? 'base', o.investimento ?? 0, ano);
      const custo = custoDeFundar31(multDaRegiao33(o.jogo, o.regiao)) + p.total;
      return v.financas.conta >= custo ? PERMITIDO : bloqueio('requisito', `Fundar assim custa ${fmt(custo)} em dinheiro (o registro, ${o.modo && o.modo !== 'base' ? 'a vaga' : 'a estrutura'}${p.investimento ? ' e o investimento' : ''}).`);
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
    case 'entrar': {
      if (org.linhas.some(l => l.jogo === o.jogo)) return bloqueio('incompativel', `A ${org.nome} já tem uma line de ${JOGOS25[o.jogo].nome(ano)} (o regulamento não deixa duas da mesma organização na mesma liga).`);
      const reg = regiaoValida(o.jogo, o.regiao, ano);
      if (reg) return bloqueio('impossivel', reg);
      const conf = conflito(v, o.jogo, org.nome);
      if (conf) return bloqueio('incompativel', conf);
      const p = previaDaEntrada33(o.jogo, o.regiao, o.modo, o.investimento ?? 0, ano);
      return v.financas.conta >= p.total ? PERMITIDO : bloqueio('requisito', `Entrar assim custa ${fmt(p.total)} em dinheiro.`);
    }
    case 'sair': {
      if (!org.linhas.some(l => l.jogo === o.jogo)) return bloqueio('impossivel', 'Não há line desse jogo.');
      return org.linhas.length > 1 ? PERMITIDO : bloqueio('incompativel', 'É a única line da organização: para sair, venda a organização.');
    }
    case 'vender_org': return PERMITIDO;
    case 'aportar': return o.valor > 0 && v.financas.conta >= o.valor ? PERMITIDO : bloqueio('requisito', 'Não há esse dinheiro na conta.');
    case 'conteudo': return org.conteudo === o.nivel ? bloqueio('incompativel', 'Já é assim.') : PERMITIDO;
    case 'dono': { const p = problemaDono33(contextoOrg33(v), org, o.sub, org.caixa, anoDe(org.desde)); return p ? bloqueio('requisito', p) : PERMITIDO; }
    case 'responder': return org.mesa.find(s => s.id === o.id)?.opcoes.some(x => x.id === o.opcao) ? PERMITIDO : bloqueio('impossivel', 'Esse assunto já foi resolvido.');
    case 'comodo': {
      const tem = (org.casa35 ?? []).includes(o.id);
      if (o.construir === tem) return bloqueio('incompativel', tem ? 'A casa já tem.' : 'A casa não tem.');
      if (!o.construir) return PERMITIDO;
      const c = arred(comodo35(o.id).obra * multMedio(org));
      return org.caixa >= c ? PERMITIDO : bloqueio('requisito', `A obra custa ${fmt(c)}; o caixa da organização não tem (aporte).`);
    }
    case 'evento': {
      if ((org.eventos35 ?? []).some(e => e.ano === ano && e.tipo === o.tipo)) return bloqueio('incompativel', 'Já foi feito neste ano.');
      const ev = EVENTOS35.find(e => e.id === o.tipo); if (!ev) return bloqueio('impossivel', '');
      const c = arred(ev.custo * multMedio(org));
      return org.caixa >= c ? PERMITIDO : bloqueio('requisito', `Custa ${fmt(c)}; o caixa da organização não tem.`);
    }
    case 'criador': {
      if ((org.criadores35 ?? []).some(c => c.id === o.id)) return bloqueio('incompativel', 'Já assinou.');
      if ((org.criadores35?.length ?? 0) >= 3) return bloqueio('incompativel', 'A casa já tem três criadores: dispense um antes.');
      const c = criadoresDoAno35(hashNum(v.id), ano, multMedio(org)).find(x => x.id === o.id);
      if (!c) return bloqueio('impossivel', 'Esse criador já fechou com outra organização.');
      return org.caixa >= c.salario * 0.5 ? PERMITIDO : bloqueio('requisito', `As luvas são de ${fmt(c.salario * 0.5)}; o caixa não tem.`);
    }
    case 'dispensar_criador': return (org.criadores35 ?? []).some(c => c.id === o.id) ? PERMITIDO : bloqueio('impossivel', '');
    case 'bicho': return !!org.bicho35 === o.ligar ? bloqueio('incompativel', 'Já é assim.') : PERMITIDO;
    case 'collab': {
      if (org.collab35 === ano) return bloqueio('incompativel', 'A collab deste ano já saiu.');
      return org.linhas.some(l => l.divisao === 4) ? PERMITIDO : bloqueio('requisito', 'A desenvolvedora só faz collab com quem está numa liga principal.');
    }
    case 'comprar_linha': {
      const x = avaliarOrg31(v, o.nome, o.jogo, o.regiao);
      if (!x) return bloqueio('impossivel', 'Essa organização não está vendendo a line.');
      const conf = conflito(v, o.jogo, org.nome);
      if (conf) return bloqueio('incompativel', conf);
      const atual = linhaDe31(org, o.jogo);
      const credito = atual ? valorDaLinha33(org, atual, ano) : 0;
      const custo = Math.max(0, x.preco - credito);
      return v.financas.conta >= custo ? PERMITIDO : bloqueio('requisito', `Comprar a line custa ${fmt(custo)} em dinheiro${atual ? ' (já descontada a venda da sua line atual)' : ''}.`);
    }
  }
  const L = linhaDe31(org, o.jogo);
  if (!L) return bloqueio('impossivel', 'Não há line desse jogo.');
  const max = maxElenco31(L.jogo, ano);
  const titN = titularesDoJogo31(L.jogo, ano);
  switch (o.op) {
    case 'setup': {
      const c = custoDoSetup35(L.setup35, o.setup, o.renovar ?? [], L.elenco.length + (L.tecnico ? 1 : 0), multDe(L));
      if (c === 0 && JSON.stringify({ g: o.setup.gabinete, r: o.setup.rgb }) === JSON.stringify({ g: L.setup35?.gabinete, r: L.setup35?.rgb }) && !(['pc', 'monitor', 'perifericos', 'cadeira'] as Peca35[]).some(p => (L.setup35?.[p] ?? 0) !== o.setup[p])) return bloqueio('incompativel', 'Nada mudou.');
      return org.caixa >= c ? PERMITIDO : bloqueio('requisito', `O equipamento custa ${fmt(c)}; o caixa da organização não tem (aporte).`);
    }
    case 'reformular': {
      const plano = planoDaReformulacao35(v, org, L, o.manter, o.nivel);
      if (o.manter.length >= titN) return bloqueio('incompativel', 'Mantendo todos, não é reformulação: deixe sair ao menos um.');
      return org.caixa >= plano.custo ? PERMITIDO : bloqueio('requisito', `A reformulação custa ${fmt(plano.custo)} (multas e contratações); o caixa da organização não tem.`);
    }
    case 'academy': {
      if (o.ativar === !!L.academy35) return bloqueio('incompativel', o.ativar ? 'A line academy já existe.' : 'Não há line academy.');
      if (!o.ativar) return PERMITIDO;
      if (L.divisao < 3) return bloqueio('requisito', 'Uma line academy disputa uma divisão abaixo da principal: só dá com a line principal na segunda divisão ou na liga principal.');
      const c = custoDaAcademy35(L, ano);
      return org.caixa >= c ? PERMITIDO : bloqueio('requisito', `Montar a academy custa ${fmt(c)}; o caixa da organização não tem.`);
    }
    case 'subir': {
      if (!L.academy35?.elenco.some(j => j.id === o.id)) return bloqueio('impossivel', '');
      return L.elenco.length >= max ? bloqueio('incompativel', 'A line principal está completa: desça ou dispense alguém antes.') : PERMITIDO;
    }
    case 'descer': {
      if (!L.academy35) return bloqueio('requisito', 'Não há line academy para onde descer.');
      if (!L.elenco.some(j => j.id === o.id)) return bloqueio('impossivel', '');
      if (L.elenco.length <= titN) return bloqueio('incompativel', 'Sem ele a line principal não tem time completo.');
      return L.academy35.elenco.length >= max + 1 ? bloqueio('incompativel', 'A academy está cheia.') : PERMITIDO;
    }
    case 'foco': return (L.foco35 ?? 'equilibrado') === o.foco ? bloqueio('incompativel', 'Já é o foco.') : PERMITIDO;
    case 'scrims': {
      if (L.scrims35?.ano === ano) return bloqueio('incompativel', 'Os scrims da temporada já estão marcados.');
      const c = arred(SCRIMS35[o.nivel - 1].custo * multDe(L));
      if (o.nivel === 2 && L.divisao < 3) return bloqueio('requisito', 'As equipes de fora só treinam com quem está na segunda divisão ou acima.');
      return org.caixa >= c ? PERMITIDO : bloqueio('requisito', `Custa ${fmt(c)}; o caixa não tem.`);
    }
    case 'staff': return (L.staff35 ?? 0) === o.nivel ? bloqueio('incompativel', 'Já é assim.') : PERMITIDO;
    case 'retiro': {
      if (L.retiro35 === ano) return bloqueio('incompativel', 'A line já fez o retiro desta temporada.');
      const c = arred(CUSTO_RETIRO35 * multDe(L));
      return org.caixa >= c ? PERMITIDO : bloqueio('requisito', `Custa ${fmt(c)}; o caixa não tem.`);
    }
    case 'corte': return L.corte35 === ano ? bloqueio('incompativel', 'Os salários já foram cortados nesta temporada.') : PERMITIDO;
    case 'peneira_aberta': {
      if (L.peneira35 === ano) return bloqueio('incompativel', 'A peneira aberta deste ano já foi feita.');
      const c = arred(CUSTO_PENEIRA35 * multDe(L));
      return org.caixa >= c ? PERMITIDO : bloqueio('requisito', `Custa ${fmt(c)}; o caixa não tem.`);
    }
    case 'torneio': {
      const t = TORNEIOS35[o.tipo];
      if ((L.torneios35 ?? []).some(x => x.ano === ano && x.tipo === o.tipo)) return bloqueio('incompativel', 'A line já jogou esse torneio neste ano.');
      if (L.divisao < t.minDiv) return bloqueio('requisito', 'Só convidam quem está na segunda divisão ou acima.');
      const c = arred(t.inscricao * multDe(L));
      return org.caixa >= c ? PERMITIDO : bloqueio('requisito', `A inscrição e a viagem custam ${fmt(c)}; o caixa não tem.`);
    }
    case 'emprestar': case 'vender_jogador': {
      if (!L.elenco.some(j => j.id === o.id)) return bloqueio('impossivel', '');
      if (L.elenco.length <= titN) return bloqueio('incompativel', 'Sem ele não há time completo para jogar: contrate antes.');
      return PERMITIDO;
    }
  }
  switch (o.op) {
    case 'contratar': {
      const m = mercadoOrg31(v, L.jogo).find(j => j.id === o.id);
      if (!m) return bloqueio('impossivel', 'Esse jogador já não está no mercado.');
      if (L.elenco.length >= max) return bloqueio('incompativel', `A line está completa (${titularesDoJogo31(L.jogo, ano)} titulares e 1 reserva): dispense alguém antes.`);
      return org.caixa >= m.preco ? PERMITIDO : bloqueio('requisito', `A multa rescisória é de ${fmt(m.preco)}; o caixa da organização não tem (aporte).`);
    }
    case 'dispensar': {
      const j = L.elenco.find(x => x.id === o.id);
      if (!j) return bloqueio('impossivel', '');
      if (L.elenco.length <= titularesDoJogo31(L.jogo, ano)) return bloqueio('incompativel', 'Sem ele não há time completo para jogar.');
      return PERMITIDO;
    }
    case 'renovar': { const j = L.elenco.find(x => x.id === o.id); return j ? (j.contratoAte > ano + 1 ? bloqueio('incompativel', `O contrato vai até ${j.contratoAte}.`) : PERMITIDO) : bloqueio('impossivel', ''); }
    case 'promover': return L.academia.some(j => j.id === o.id) ? (o.academy ? (!L.academy35 ? bloqueio('requisito', 'Não há line academy.') : L.academy35.elenco.length >= max + 1 ? bloqueio('incompativel', 'A academy está cheia.') : PERMITIDO) : L.elenco.length >= max ? bloqueio('incompativel', 'A line está completa: dispense alguém antes.') : PERMITIDO) : bloqueio('impossivel', '');
    case 'igl': return L.elenco.some(j => j.id === o.id) ? (L.igl === o.id ? bloqueio('incompativel', 'Ele já é o IGL.') : PERMITIDO) : bloqueio('impossivel', '');
    case 'tecnico': {
      const t = tecnicosOrg31(v, L.jogo)[o.i];
      if (!t) return bloqueio('impossivel', 'Esse técnico já não está disponível.');
      if (L.tecnico?.nome === t.nome) return bloqueio('incompativel', 'Ele já é o técnico.');
      const custo = (L.tecnico ? Math.round(L.tecnico.salario * 0.5) : 0) + Math.round(t.salario * 0.25);
      return org.caixa >= custo ? PERMITIDO : bloqueio('requisito', `O caixa não cobre ${L.tecnico ? 'a multa do técnico atual e ' : ''}as luvas (${fmt(custo)}).`);
    }
    case 'demitir_tecnico': return L.tecnico ? (org.caixa >= Math.round(L.tecnico.salario * 0.5) ? PERMITIDO : bloqueio('requisito', `A multa é de ${fmt(Math.round(L.tecnico.salario * 0.5))}; o caixa não tem.`)) : bloqueio('impossivel', 'Não há técnico contratado.');
    case 'bootcamp': {
      if (L.bootcamp === ano) return bloqueio('incompativel', 'A line já fez o bootcamp desta temporada.');
      const c = custoDoBootcamp31(L);
      return org.caixa >= c ? PERMITIDO : bloqueio('requisito', `O bootcamp custa ${fmt(c)}; o caixa da organização não tem.`);
    }
    case 'academia': return L.academiaNivel === o.nivel ? bloqueio('incompativel', 'Já é assim.') : PERMITIDO;
  }
  return bloqueio('impossivel', '');
}

export function executarOrg31(v: Vida, o: OqueOrg31): { texto: string; tom?: 'bom' | 'ruim' | 'neutro' } {
  const ano = anoDe(v.t);
  if (o.op === 'comprar') return comprar(v, o.nome, o.jogo, o.regiao, !!o.financiar);
  if (o.op === 'fundar') return fundar(v, nomeLimpo(o.nome), o.jogo, o.regiao, o.modo ?? 'base', o.investimento ?? 0, o.identidade);
  const org = v.orgEsports31!;
  switch (o.op) {
    case 'entrar': return entrar(v, org, o.jogo, o.regiao, o.modo, o.investimento ?? 0);
    case 'sair': {
      const L = linhaDe31(org, o.jogo)!;
      const valor = valorDaLinha33(org, L, ano);
      org.caixa += valor; org.linhas = org.linhas.filter(l => l !== L);
      org.mesa = org.mesa.filter(s => s.jogo !== L.jogo);
      escrever(v, { texto: `A ${org.nome} saiu de ${JOGOS25[L.jogo].nome(ano)}: a vaga e os contratos da line foram vendidos por ${fmt(valor)}.`, relevancia: 'cotidiano', tema: 'dinheiro', escolha: true });
      atualizarValor(org, ano);
      return { texto: `Line vendida: ${fmt(valor)} no caixa.`, tom: 'neutro' };
    }
    case 'vender_org': {
      const valor = Math.max(0, arred(org.valor + org.caixa - org.divida, 1e5));
      v.financas.conta += valor;
      lancar(v, `Venda da organização (${org.nome})`, 'renda', valor);
      const titulos = org.linhas.reduce((s, l) => s + l.trofeus.length, 0);
      escrever(v, { texto: `Vendeu a ${org.nome} depois de ${Math.max(1, ano - anoDe(org.desde))} ano(s) como dono: ${fmt(valor)}${titulos ? `, com ${titulos} título(s) na galeria` : ''}.`, relevancia: 'marco', tema: 'dinheiro', escolha: true });
      v.orgEsports31 = undefined;
      return { texto: `Organização vendida por ${fmt(valor)}.`, tom: 'neutro' };
    }
    case 'aportar':
      pagar(v, o.valor); lancar(v, `Aporte na organização (${org.nome})`, 'despesa', -o.valor);
      org.caixa += o.valor; if (org.divida > 0) { const a = Math.min(org.divida, org.caixa); org.divida -= a; org.caixa -= a; }
      return { texto: `Aportou ${fmt(o.valor)} na ${org.nome}.`, tom: 'neutro' };
    case 'conteudo': org.conteudo = o.nivel; return { texto: ['Sem conteúdo: os times só treinam.', 'Lives semanais: um pouco de receita e de fãs, sem tirar o foco.', 'Casa de criadores: mais receita e fãs — o treino perde horas (−1 de força em todas as lines).'][o.nivel], tom: 'neutro' };
    case 'dono': {
      const x = executarDono33(contextoOrg33(v), org, o.sub, rngDe(v.id, 'org33_dono', org.nome, ano, JSON.stringify(o.sub).length, org.comercial33?.seq ?? 0), anoDe(org.desde));
      org.caixa -= x.custo;
      if (x.fama) org.fas = clamp(org.fas + x.fama);
      return { texto: x.texto, tom: x.tom };
    }
    case 'responder': return responderMesa(v, org, o.id, o.opcao);
    case 'comodo': {
      const d = comodo35(o.id);
      if (!o.construir) { org.casa35 = (org.casa35 ?? []).filter(c => c !== o.id); return { texto: `${d.nome}: fechado (sem custo por ano).`, tom: 'neutro' }; }
      const c = arred(d.obra * multMedio(org));
      org.caixa -= c; org.casa35 = [...(org.casa35 ?? []), o.id];
      escrever(v, { texto: `A gaming house da ${org.nome} ganhou: ${d.nome.toLowerCase()} (${fmt(c)}).`, relevancia: 'cotidiano', tema: 'dinheiro', escolha: true });
      return { texto: `${d.nome} pronto.`, tom: 'bom' };
    }
    case 'evento': {
      const ev = EVENTOS35.find(e => e.id === o.tipo)!;
      const m = multMedio(org);
      const c = arred(ev.custo * m);
      const receita = arred(ev.receita * m * (0.5 + org.fas / 60));
      org.caixa += receita - c;
      org.fas = clamp(org.fas + ev.fas); org.reputacao = clamp(org.reputacao + ev.rep);
      org.eventos35 = [...(org.eventos35 ?? []).filter(e => e.ano >= ano - 3), { ano, tipo: o.tipo }];
      escrever(v, { texto: `A ${org.nome} fez: ${ev.nome.toLowerCase()}. Custou ${fmt(c)}${receita ? ` e trouxe ${fmt(receita)}` : ''}; a comunidade cresceu.`, relevancia: 'cotidiano', tema: 'trabalho', escolha: true });
      return { texto: `${ev.nome}: feito.`, tom: 'bom' };
    }
    case 'comprar_linha': return comprarLinha35(v, org, o.nome, o.jogo, o.regiao);
    case 'criador': {
      const c = criadoresDoAno35(hashNum(v.id), ano, multMedio(org)).find(x => x.id === o.id)!;
      org.caixa -= Math.round(c.salario * 0.5); org.criadores35 = [...(org.criadores35 ?? []), c];
      org.fas = clamp(org.fas + Math.round(c.fas / 6));
      escrever(v, { texto: `${c.nome} agora faz conteúdo pela ${org.nome}: a comunidade dele vem junto.`, relevancia: 'cotidiano', tema: 'trabalho', escolha: true });
      return { texto: `${c.nome} assinou (${fmt(c.salario)} por ano).`, tom: 'bom' };
    }
    case 'dispensar_criador': { const c = org.criadores35!.find(x => x.id === o.id)!; org.criadores35 = org.criadores35!.filter(x => x.id !== o.id); if (!org.criadores35.length) delete org.criadores35; return { texto: `${c.nome} saiu da organização.`, tom: 'neutro' }; }
    case 'bicho': org.bicho35 = o.ligar || undefined; return { texto: o.ligar ? 'Bônus por meta prometido: título vale prêmio para a line inteira. O clima sobe.' : 'Sem bônus por meta.', tom: 'neutro' };
    case 'collab': {
      const m = multMedio(org);
      const receita = arred(150e3 * m * (0.5 + org.fas / 50));
      org.caixa += receita; org.fas = clamp(org.fas + 2); org.collab35 = ano;
      escrever(v, { texto: `Saiu a collab da ${org.nome} com a desenvolvedora: itens com o escudo dentro do jogo. Rendeu ${fmt(receita)}.`, relevancia: 'cotidiano', tema: 'dinheiro', tom: 'bom', escolha: true });
      return { texto: `Collab lançada: ${fmt(receita)}.`, tom: 'bom' };
    }
  }
  const L = linhaDe31(org, o.jogo)!;
  const auge = jogo(L.jogo).auge;
  const mult = multDe(L);
  switch (o.op) {
    case 'setup': {
      const c = custoDoSetup35(L.setup35, o.setup, o.renovar ?? [], L.elenco.length + (L.tecnico ? 1 : 0), mult);
      const s = L.setup35 ?? { pc: 0, monitor: 0, perifericos: 0, cadeira: 0, anos: {} };
      const anos = { ...s.anos };
      for (const p of ['pc', 'monitor', 'perifericos', 'cadeira'] as Peca35[]) if (o.setup[p] !== s[p] || o.renovar?.includes(p)) anos[p] = ano;
      L.setup35 = normalizarSetup35({ ...o.setup, anos })!;
      org.caixa -= c;
      if (c) escrever(v, { texto: `A line de ${JOGOS25[L.jogo].nome(ano)} da ${org.nome} ganhou equipamento novo (${fmt(c)}).`, relevancia: 'cotidiano', tema: 'dinheiro', escolha: true });
      return { texto: c ? `Equipamento montado: ${fmt(c)}.` : 'Visual dos PCs atualizado.', tom: 'bom' };
    }
    case 'reformular': {
      const plano = planoDaReformulacao35(v, org, L, o.manter, o.nivel);
      const saem = L.elenco.filter(j => !o.manter.includes(j.id));
      L.elenco = L.elenco.filter(j => o.manter.includes(j.id));
      for (const j of saem) L.vendas.unshift({ nome: j.nick, para: 'livre (reformulação)', valor: 0, ano });
      if (L.vendas.length > 20) L.vendas.length = 20;
      L.elenco.push(...plano.novos);
      org.seq = Math.max(org.seq, plano.seq);
      org.caixa -= plano.custo;
      if (L.igl && !L.elenco.some(j => j.id === L.igl)) L.igl = undefined;
      L.igl ??= titulares31(L, ano).find(j => j.funcao === 'igl')?.id ?? titulares31(L, ano)[0]?.id;
      L.moral = clamp((L.moral ?? 0) * 0.3 - 0.3, -3, 3);
      escrever(v, { texto: `A ${org.nome} reformulou a line de ${JOGOS25[L.jogo].nome(ano)}: saíram ${saem.map(j => j.nick).join(', ')}; chegaram ${plano.novos.map(j => j.nick).join(', ')} (${fmt(plano.custo)}).`, relevancia: 'marco', tema: 'trabalho', escolha: true });
      return { texto: `Line reformulada: ${plano.novos.length} chegadas.`, tom: 'neutro' };
    }
    case 'academy': {
      if (!o.ativar) { const n = L.academy35!.elenco.length; L.academy35 = undefined; return { texto: `A line academy foi fechada (${n} contratos encerrados).`, tom: 'neutro' }; }
      const c = custoDaAcademy35(L, ano);
      org.caixa -= c;
      const r = rngDe(v.id, 'org35_academy', org.nome, L.jogo, ano);
      const a: Academy35 = { desde: v.t, divisao: 2, elenco: [], historico: [] };
      const fs = funcoesDoJogo(L.jogo);
      const media = mediaDosTitulares31(L, ano);
      for (let k = 0; k < titularesDoJogo31(L.jogo, ano); k++) {
        const j = novoJogador(org, L, r, ano, fs[k % fs.length], media - 9 + r.normal() * 3, jogo(L.jogo).idadePro + r.int(0, 2));
        j.potencial = clamp(Math.max(j.potencial, j.forca + 10 + r.int(0, 8)), j.forca, 92); j.salario = Math.round(j.salario * 0.4); j.daAcademia = true;
        a.elenco.push(j);
      }
      L.academy35 = a;
      escrever(v, { texto: `A ${org.nome} montou uma line academy de ${JOGOS25[L.jogo].nome(ano)}: ${a.elenco.map(j => j.nick).join(', ')}, no ${nomeDaLiga31({ jogo: L.jogo, divisao: 2, regiao: L.regiao }, ano)}.`, relevancia: 'cotidiano', tema: 'trabalho', escolha: true });
      return { texto: 'Line academy montada.', tom: 'bom' };
    }
    case 'subir': {
      const a = L.academy35!; const i = a.elenco.findIndex(j => j.id === o.id); const j = a.elenco.splice(i, 1)[0];
      j.salario = Math.max(j.salario, Math.round(salarioDe31(j.forca, mult) * 0.7)); j.contratoAte = Math.max(j.contratoAte, ano + 2);
      L.elenco.push(j);
      return { texto: `${j.nick} subiu da academy para a line principal.`, tom: 'bom' };
    }
    case 'descer': {
      const i = L.elenco.findIndex(j => j.id === o.id); const j = L.elenco.splice(i, 1)[0];
      L.academy35!.elenco.push(j); if (L.igl === j.id) L.igl = undefined;
      L.moral = clamp((L.moral ?? 0) - 0.1, -3, 3);
      return { texto: `${j.nick} desceu para a academy: vai jogar e recuperar a forma lá.`, tom: 'neutro' };
    }
    case 'foco': L.foco35 = o.foco === 'equilibrado' ? undefined : o.foco; return { texto: `Foco do treino: ${foco35(o.foco).nome.toLowerCase()}.`, tom: 'neutro' };
    case 'scrims': {
      const sc = SCRIMS35[o.nivel - 1]; const c = arred(sc.custo * mult);
      org.caixa -= c; L.scrims35 = { ano, nivel: o.nivel };
      return { texto: `${sc.nome}: +${sc.forca} de força nesta temporada (${fmt(c)}).`, tom: 'bom' };
    }
    case 'staff': { L.staff35 = o.nivel || undefined; return { texto: `${STAFF35[o.nivel].nome}${o.nivel ? ` (${fmt(arred(STAFF35[o.nivel].salario * mult))} por ano)` : ''}.`, tom: 'neutro' }; }
    case 'retiro': {
      const c = arred(CUSTO_RETIRO35 * mult);
      org.caixa -= c; L.retiro35 = ano; L.moral = clamp(Math.round(((L.moral ?? 0) + 0.8) * 10) / 10, -3, 3);
      escrever(v, { texto: `A line de ${JOGOS25[L.jogo].nome(ano)} da ${org.nome} passou uns dias fora, sem computador: conversa, trilha, churrasco.`, relevancia: 'cotidiano', tema: 'trabalho', escolha: true });
      return { texto: 'Retiro feito: o clima melhorou.', tom: 'bom' };
    }
    case 'corte': {
      const antes = L.elenco.reduce((s2, j) => s2 + j.salario, 0);
      for (const j of L.elenco) j.salario = arred(j.salario * 0.85, 1000);
      L.corte35 = ano; L.moral = clamp(Math.round(((L.moral ?? 0) - 1) * 10) / 10, -3, 3);
      return { texto: `Salários cortados em 15%: ${fmt(antes - L.elenco.reduce((s2, j) => s2 + j.salario, 0))} a menos por ano. O vestiário não gostou.`, tom: 'ruim' };
    }
    case 'peneira_aberta': {
      const c = arred(CUSTO_PENEIRA35 * mult);
      org.caixa -= c; L.peneira35 = ano;
      const r = rngDe(v.id, 'org35_peneira', org.nome, L.jogo, ano);
      const fs = funcoesDoJogo(L.jogo);
      const media = mediaDosTitulares31(L, ano);
      const novos: JogadorOrg31[] = [];
      for (let k = 0; k < 2; k++) {
        const j = novoJogador(org, L, r, ano, r.pick(fs), media - 13 + r.normal() * 4, jogo(L.jogo).idadePro - 1 + r.int(0, 2));
        j.potencial = clamp(Math.round(j.forca + 10 + Math.max(0, r.normal()) * 10), j.forca, r.chance(0.08) ? 94 : 88); j.daAcademia = true; j.salario = Math.round(j.salario * 0.25);
        novos.push(j);
      }
      L.academia = [...L.academia, ...novos].sort((a, b) => b.potencial - a.potencial).slice(0, 6);
      return { texto: `Peneira aberta: ${novos.map(j => `${j.nick} (potencial ${j.potencial})`).join(' e ')} entraram na peneira de talentos.`, tom: 'bom' };
    }
    case 'torneio': {
      const t = TORNEIOS35[o.tipo];
      const c = arred(t.inscricao * mult);
      const r = rngDe(v.id, 'org35_torneio', org.nome, L.jogo, ano, o.tipo);
      const col = colocacao(r, forcaDoTime31(org, L, ano), forcaDoCampo31(L.jogo, L.divisao, L.regiao) + t.campo, t.equipes);
      const premio = arred(t.premio * mult * fatia(col, t.equipes));
      const nome = `${t.nome} ${JOGOS25[L.jogo].nome(ano)} ${ano}`;
      org.caixa += premio - c;
      L.torneios35 = [...(L.torneios35 ?? []), { ano, tipo: o.tipo, nome, colocacao: col, participantes: t.equipes, premio }].slice(-20);
      if (col === 1) { L.trofeus.push({ ano, nome, tipo: 'liga' }); org.fas = clamp(org.fas + (o.tipo === 'convite' ? 4 : 2)); org.reputacao = clamp(org.reputacao + (o.tipo === 'convite' ? 3 : 1)); }
      else if (col <= 4) org.fas = clamp(org.fas + 1);
      escrever(v, { texto: `A line de ${JOGOS25[L.jogo].nome(ano)} da ${org.nome} jogou ${t.artigo} ${nome}: ${col === 1 ? 'campeã!' : `${col}º de ${t.equipes}`}${premio ? ` (${fmt(premio)} em prêmio)` : ''}.`, relevancia: col === 1 ? 'marco' : 'cotidiano', tema: 'trabalho', tom: col === 1 ? 'bom' : undefined, escolha: true });
      return { texto: col === 1 ? `Campeã ${t.artigo === 'a' ? 'da' : 'do'} ${t.nome}!` : `${col}º lugar ${t.artigo === 'a' ? 'na' : 'no'} ${t.nome}.`, tom: col <= 3 ? 'bom' : 'neutro' };
    }
    case 'emprestar': {
      const i = L.elenco.findIndex(j => j.id === o.id); const j = L.elenco.splice(i, 1)[0];
      if (L.igl === j.id) L.igl = undefined;
      const r = rngDe(v.id, 'org35_emprestimo', j.id, ano);
      const lista = catalogo(v, L.jogo, ano).filter(x => x.nome !== org.nome && x.regiao === L.regiao && x.divisao <= L.divisao);
      const para = lista.length ? lista[r.int(0, lista.length - 1)].nome : 'uma equipe do cenário';
      L.emprestados35 = [...(L.emprestados35 ?? []), { jogador: j, para, ate: ano }];
      return { texto: `${j.nick} foi emprestado à ${para} até o fim da temporada: ela paga o salário, ele ganha minutos.`, tom: 'neutro' };
    }
    case 'vender_jogador': {
      const i = L.elenco.findIndex(j => j.id === o.id); const j = L.elenco.splice(i, 1)[0];
      if (L.igl === j.id) L.igl = undefined;
      const r = rngDe(v.id, 'org35_venda', j.id, ano);
      const lista = catalogo(v, L.jogo, ano).filter(x => x.nome !== org.nome);
      const para = lista.length ? lista[r.int(0, lista.length - 1)].nome : 'uma equipe do cenário';
      const valor = arred(valorDoJogador31(j, ano, mult, auge) * (0.8 + r.next() * 0.3), 1000);
      org.caixa += valor;
      L.vendas.unshift({ nome: j.nick, para, valor, ano }); if (L.vendas.length > 20) L.vendas.length = 20;
      escrever(v, { texto: `A ${org.nome} vendeu ${j.nick} para a ${para} por ${fmt(valor)}.`, relevancia: 'cotidiano', tema: 'dinheiro', escolha: true });
      return { texto: `${j.nick} vendido por ${fmt(valor)}.`, tom: 'neutro' };
    }
    case 'contratar': {
      const m = mercadoOrg31(v, L.jogo).find(j => j.id === o.id)!;
      org.caixa -= m.preco; L.comprados.push(m.id); if (L.comprados.length > 200) L.comprados.splice(0, L.comprados.length - 200);
      const { preco: _p, de, faixa: _f, ...j } = m; void _p; void _f;
      L.elenco.push(j);
      escrever(v, { texto: `A ${org.nome} contratou ${j.nick} (${j.nome}, ${nomeDaFuncao31(L.jogo, j.funcao)}) para a line de ${JOGOS25[L.jogo].nome(ano)}, que estava na ${de}, por ${fmt(m.preco)}.`, relevancia: 'cotidiano', tema: 'trabalho', escolha: true });
      return { texto: `${j.nick} contratado.`, tom: 'bom' };
    }
    case 'dispensar': {
      const i = L.elenco.findIndex(j => j.id === o.id); const j = L.elenco.splice(i, 1)[0];
      const multa = arred(j.salario * Math.max(0, j.contratoAte - ano) * 0.5, 1000);
      org.caixa -= multa; if (L.igl === j.id) L.igl = undefined;
      return { texto: `${j.nick} foi dispensado${multa ? ` (rescisão de ${fmt(multa)})` : ''}.`, tom: 'neutro' };
    }
    case 'renovar': {
      const j = L.elenco.find(x => x.id === o.id)!;
      j.contratoAte = ano + (ano - anoDe(j.tNasc) >= auge + 6 ? 1 : 2); j.salario = salarioDe31(j.forca, mult);
      return { texto: `${j.nick} renovou até ${j.contratoAte} (${fmt(j.salario)} por ano).`, tom: 'bom' };
    }
    case 'promover': {
      const i = L.academia.findIndex(j => j.id === o.id); const j = L.academia.splice(i, 1)[0];
      if (o.academy) { j.contratoAte = ano + 2; L.academy35!.elenco.push(j); return { texto: `${j.nick} foi para a line academy.`, tom: 'bom' }; }
      j.salario = Math.round(salarioDe31(j.forca, mult) * 0.7); j.contratoAte = ano + 2;
      L.elenco.push(j);
      return { texto: `${j.nick} subiu da academia para a line principal.`, tom: 'bom' };
    }
    case 'igl': { const j = L.elenco.find(x => x.id === o.id)!; L.igl = j.id; return { texto: `${j.nick} é o novo IGL: as calls são dele.`, tom: 'bom' }; }
    case 'tecnico': {
      const t = tecnicosOrg31(v, L.jogo)[o.i];
      org.caixa -= (L.tecnico ? Math.round(L.tecnico.salario * 0.5) : 0) + Math.round(t.salario * 0.25);
      const antes = L.tecnico?.nome;
      L.tecnico = { ...t, desde: ano }; L.humorTecnico = 65;
      escrever(v, { texto: `A line de ${JOGOS25[L.jogo].nome(ano)} da ${org.nome} tem técnico novo: ${t.nome}${antes ? `, no lugar de ${antes}` : ''}.`, relevancia: 'cotidiano', tema: 'trabalho', escolha: true });
      return { texto: `${t.nome} contratado como técnico.`, tom: 'bom' };
    }
    case 'demitir_tecnico': {
      const t = L.tecnico!; const multa = Math.round(t.salario * 0.5);
      org.caixa -= multa; L.tecnico = undefined; L.humorTecnico = undefined;
      return { texto: `${t.nome} demitido (multa de ${fmt(multa)}).`, tom: 'neutro' };
    }
    case 'bootcamp': {
      const c = custoDoBootcamp31(L);
      org.caixa -= c; L.bootcamp = ano; L.moral = clamp(Math.round(((L.moral ?? 0) + 0.3) * 10) / 10, -3, 3);
      escrever(v, { texto: `A ${org.nome} levou a line de ${JOGOS25[L.jogo].nome(ano)} para um bootcamp (${fmt(c)}): treinos contra equipes de fora, a semana inteira.`, relevancia: 'cotidiano', tema: 'trabalho', escolha: true });
      return { texto: `Bootcamp feito: +2 de força nesta temporada.`, tom: 'bom' };
    }
    case 'academia': L.academiaNivel = o.nivel; if (o.nivel === 0) L.academia = []; return { texto: ['Academia fechada.', 'Academia básica: alguns jovens por ano.', 'Academia forte: mais jovens e mais talento.'][o.nivel], tom: 'neutro' };
  }
  return { texto: '' };
}

function montarElenco(org: OrgEsports31, L: LinhaOrg33, r: Rng, ano: number, media: number, reserva: boolean): void {
  const g = jogo(L.jogo);
  const n = titularesDoJogo31(L.jogo, ano) + (reserva ? 1 : 0);
  const fs = funcoesDoJogo(L.jogo);
  for (let k = 0; k < n; k++) L.elenco.push(novoJogador(org, L, r, ano, fs[k % fs.length], media + r.normal() * 3.5, g.auge - 4 + r.int(0, 8)));
}

function novaLinha(v: Vida, jid: JogoId, regiao: Regiao31, divisao: Divisao31, entrada: LinhaOrg33['entrada']): LinhaOrg33 {
  return { jogo: jid, regiao, divisao, desde: v.t, entrada, elenco: [], academia: [], academiaNivel: 0, historico: [], trofeus: [], comprados: [], vendas: [] };
}
function novaOrg(v: Vida, nome: string, fundada: boolean): OrgEsports31 {
  return { nome, desde: v.t, ...(fundada ? { fundada } : {}), preco: 0, caixa: 0, divida: 0, valor: 0, fas: 3, reputacao: 5, conteudo: 0, linhas: [], seq: 0, mesa: [], mesaHist: [], comercial33: novoComercial33() };
}

/** Monta a line nova pela prévia (o elenco, o técnico, o IGL). */
function equiparLinha(v: Vida, org: OrgEsports31, L: LinhaOrg33, p: PreviaEntrada33, chave: string): void {
  const ano = anoDe(v.t);
  const r = rngDe(v.id, 'org33_linha', chave, L.jogo, L.regiao);
  montarElenco(org, L, r, ano, p.forca, p.reserva);
  if (p.tecnico) {
    const mult = multDe(L);
    L.tecnico = { nome: `${NOMES_TECNICO[r.int(0, NOMES_TECNICO.length - 1)]} ${sortearSobrenome(r, regiaoDoJogo33(L.jogo, L.regiao)?.pais === 'BR' ? 'BR' : undefined)}`, nivel: p.tecnico, salario: arred([0, 40e3, 120e3, 350e3, 900e3, 2e6][p.tecnico] * mult), desde: ano };
    L.humorTecnico = 65;
  }
  L.igl = titulares31(L, ano).find(j => j.funcao === 'igl')?.id ?? titulares31(L, ano).find(j => j.funcao === 'controlador' || j.funcao === 'suporte')?.id;
  if (L.divisao >= 3) { org.fas = clamp(Math.max(org.fas, L.divisao === 4 ? 25 : 10)); org.reputacao = clamp(Math.max(org.reputacao, L.divisao === 4 ? 25 : 12)); }
}

function comprar(v: Vida, nome: string, jid: JogoId, regiao: Regiao31, financiar: boolean): { texto: string; tom: 'bom' } {
  const x = avaliarOrg31(v, nome, jid, regiao)!;
  const ano = anoDe(v.t);
  const entrada = financiar ? Math.round(x.preco * 0.4) : x.preco;
  pagar(v, entrada);
  lancar(v, `Compra da organização (${nome})`, 'despesa', -entrada);
  if (financiar) {
    const saldo = x.preco - entrada, prazo = 96, j = 0.012;
    const parcela = Math.round(saldo * j / (1 - Math.pow(1 + j, -prazo)));
    v.financas.dividas.push({ id: `org31_${v.t}`, tipo: 'emprestimo', saldo, jurosMes: j, parcela, descricao: `Financiamento da compra da ${nome}`, tInicio: v.t, prazo });
  }
  const org = novaOrg(v, nome, false);
  Object.assign(org, { preco: x.preco, divida: x.divida, valor: x.valor, fas: x.fas, reputacao: x.reputacao, caixa: arred(x.receita * 0.08, 1e4) });
  const L = novaLinha(v, jid, regiao, x.divisao, 'compra');
  montarElenco(org, L, rngDe(v.id, 'org31_compra', jid, regiao, nome), ano, x.forca, true);
  L.igl = titulares31(L, ano).find(j => j.funcao === 'igl')?.id;
  org.linhas.push(L);
  v.orgEsports31 = org;
  abrirMesa(v, org, 1);
  escrever(v, { texto: `Comprou a ${nome} (${JOGOS25[jid].nome(ano)}, ${nomeDaLiga31(L, ano)}, ${nomeDaRegiao33(jid, regiao)}) por ${fmt(x.preco)}${financiar ? `, ${fmt(entrada)} de entrada e o resto financiado` : ''}. As dívidas da organização (${fmt(x.divida)}) vieram junto.`, relevancia: 'marco', tema: 'dinheiro', tom: 'bom', escolha: true });
  return { texto: `Agora você é dono da ${nome}.`, tom: 'bom' };
}

function fundar(v: Vida, nome: string, jid: JogoId, regiao: Regiao31, modo: Entrada33, investimento: number, identidade?: Identidade33): { texto: string; tom: 'bom' } {
  const ano = anoDe(v.t);
  const p = previaDaEntrada33(jid, regiao, modo, investimento, ano);
  const registro = custoDeFundar31(multDaRegiao33(jid, regiao));
  pagar(v, registro + p.total);
  lancar(v, `Fundação da organização (${nome})`, 'despesa', -(registro + p.total));
  const org = novaOrg(v, nome, true);
  const id = normalizarIdentidade33(identidade);
  if (id) org.identidade33 = id;
  org.caixa = arred(registro * 0.3) + p.caixa;
  const L = novaLinha(v, jid, regiao, p.divisao, modo);
  org.linhas.push(L);
  equiparLinha(v, org, L, p, `fundar:${nome}`);
  org.preco = registro + p.total;
  v.orgEsports31 = org;
  atualizarValor(org, ano);
  abrirMesa(v, org, 1);
  const como = modo === 'base' ? 'começa no cenário aberto, com jogadores livres e muita vontade' : modo === 'acesso' ? `comprou a vaga de uma equipe na ${p.liga}` : `comprou a vaga na ${p.liga}${p.fechada ? ' (a franquia de uma organização que saiu)' : ''}`;
  escrever(v, { texto: `Fundou a ${nome}, uma organização de ${JOGOS25[jid].nome(ano)} em ${nomeDaRegiao33(jid, regiao)}: ${como}. Investimento total de ${fmt(registro + p.total)}.`, relevancia: 'marco', tema: 'trabalho', tom: 'bom', escolha: true });
  return { texto: `A ${nome} existe: ${p.liga}.`, tom: 'bom' };
}

function entrar(v: Vida, org: OrgEsports31, jid: JogoId, regiao: Regiao31, modo: Entrada33, investimento: number): { texto: string; tom: 'bom' } {
  const ano = anoDe(v.t);
  const p = previaDaEntrada33(jid, regiao, modo, investimento, ano);
  pagar(v, p.total);
  lancar(v, `Line nova na organização (${org.nome}, ${JOGOS25[jid].nome(ano)})`, 'despesa', -p.total);
  org.caixa += p.caixa;
  const L = novaLinha(v, jid, regiao, p.divisao, modo);
  org.linhas.push(L);
  equiparLinha(v, org, L, p, `entrar:${org.nome}:${ano}`);
  atualizarValor(org, ano);
  escrever(v, { texto: `A ${org.nome} entrou em ${JOGOS25[jid].nome(ano)}: ${modo === 'base' ? 'uma line montada do zero no cenário aberto' : `a vaga na ${p.liga}`} (${nomeDaRegiao33(jid, regiao)}), ${fmt(p.total)} no total.`, relevancia: 'marco', tema: 'trabalho', tom: 'bom', escolha: true });
  return { texto: `Line de ${JOGOS25[jid].nome(ano)} montada: ${p.liga}.`, tom: 'bom' };
}

/* ------------------------------------------------------------------ VIDA 35 · comprar a line de outra org, reformular, a academy */

/** Comprar a line (a vaga e o elenco) de outra organização. Se a sua já joga esse jogo, a sua line é vendida e a comprada entra no lugar. */
function comprarLinha35(v: Vida, org: OrgEsports31, nome: string, jid: JogoId, regiao: Regiao31): { texto: string; tom: 'bom' } {
  const ano = anoDe(v.t);
  const x = avaliarOrg31(v, nome, jid, regiao)!;
  const atual = linhaDe31(org, jid);
  const credito = atual ? valorDaLinha33(org, atual, ano) : 0;
  const custo = Math.max(0, x.preco - credito);
  pagar(v, custo);
  lancar(v, `Compra da line de ${JOGOS25[jid].nome(ano)} da ${nome} (${org.nome})`, 'despesa', -custo);
  org.caixa += Math.max(0, credito - x.preco);
  org.divida += arred(x.divida * 0.5, 1e4);
  const L = novaLinha(v, jid, regiao, x.divisao, 'compra');
  if (atual) { L.academia = atual.academia; L.academiaNivel = atual.academiaNivel; L.trofeus = atual.trofeus; L.historico = atual.historico; L.setup35 = atual.setup35; L.academy35 = atual.academy35; }
  montarElenco(org, L, rngDe(v.id, 'org35_compra_linha', jid, regiao, nome), ano, x.forca, true);
  L.igl = titulares31(L, ano).find(j => j.funcao === 'igl')?.id ?? titulares31(L, ano)[0]?.id;
  org.linhas = atual ? org.linhas.map(l => (l === atual ? L : l)) : [...org.linhas, L];
  org.absorvidas35 = [...(org.absorvidas35 ?? []), `${jid}:${nome}`];
  org.fas = clamp(Math.round(org.fas + x.fas * 0.15)); org.reputacao = clamp(Math.max(org.reputacao, Math.round(x.reputacao * 0.6)));
  atualizarValor(org, ano);
  escrever(v, { texto: `A ${org.nome} comprou a line de ${JOGOS25[jid].nome(ano)} da ${nome} (${nomeDaLiga31(L, ano)}, ${nomeDaRegiao33(jid, regiao)}): a vaga e os jogadores${atual ? ', no lugar da line antiga, vendida' : ''}. ${fmt(custo)}.`, relevancia: 'marco', tema: 'trabalho', tom: 'bom', escolha: true });
  return { texto: `A line da ${nome} agora joga pela ${org.nome}.`, tom: 'bom' };
}

/** O plano da reformulação (o mesmo na prévia e na execução): quem chega, as multas de quem sai e o custo total. */
export function planoDaReformulacao35(v: Vida, org: OrgEsports31, L: LinhaOrg33, manter: string[], nivel: NivelReformulacao35): { novos: JogadorOrg31[]; multas: number; contratacoes: number; custo: number; seq: number } {
  const ano = anoDe(v.t);
  const g = jogo(L.jogo);
  const mult = multDe(L);
  const cfg = REFORMULACAO35[nivel];
  const ficam = L.elenco.filter(j => manter.includes(j.id));
  const saem = L.elenco.filter(j => !manter.includes(j.id));
  const multas = saem.reduce((s, j) => s + arred(j.salario * Math.max(0, j.contratoAte - ano) * 0.5, 1000), 0);
  const media = mediaDosTitulares31(L, ano);
  const r = rngDe(v.id, 'org35_reformular', org.nome, L.jogo, ano, nivel, [...manter].sort().join(','));
  const tmp = { seq: org.seq };
  const fs = funcoesDoJogo(L.jogo);
  const faltam = fs.filter(f => !ficam.some(j => j.funcao === f));
  const n = titularesDoJogo31(L.jogo, ano) + 1 - ficam.length;
  const novos: JogadorOrg31[] = [];
  for (let k = 0; k < n; k++) {
    const funcao = faltam[k] ?? fs[k % fs.length];
    const j = novoJogador(tmp, L, r, ano, funcao, media + cfg.delta + r.normal() * 2, cfg.jovem ? g.idadePro + r.int(0, 2) : g.auge - 3 + r.int(0, 6));
    if (cfg.jovem) j.potencial = clamp(Math.max(j.potencial, j.forca + 10 + r.int(0, 8)), j.forca, 92);
    j.contratoAte = ano + 2;
    novos.push(j);
  }
  const contratacoes = novos.reduce((s, j) => s + valorDoJogador31(j, ano, mult, g.auge) * (nivel === 'ambiciosa' ? 1.15 : 0.9), 0);
  return { novos, multas, contratacoes: arred(contratacoes), custo: arred(multas + contratacoes), seq: tmp.seq };
}

/** Montar a academy: a estrutura (gaming house B, inscrição) e um ano de salários adiantado. */
export const custoDaAcademy35 = (L: LinhaOrg33, ano: number) => arred((OPERACAO[2] * 1.5 + salarioDe31(Math.max(30, mediaDosTitulares31(L, ano) - 9), 1) * 0.4 * titularesDoJogo31(L.jogo, ano)) * multDe(L));

/* ------------------------------------------------------------------ o mercado, os técnicos (estáveis no ano) */

export type JogadorDoMercado31 = JogadorOrg31 & { preco: number; de: string; faixa: 'reforco' | 'nivel' | 'aposta' | 'estrela' };

/** O teto de quem aceita vir: o degrau, o nome da organização e o mercado da região. */
const tetoDeAtracao = (o: OrgEsports31, L: LinhaOrg33) => forcaDoCampo31(L.jogo, L.divisao, L.regiao) + 4 + o.reputacao / 12 + (multDe(L) >= 1.5 ? 2 : 0);

/**
 * O mercado do ano da line, em faixas: reforços ACIMA dos titulares (um por função), jogadores do nível, apostas jovens e,
 * às vezes, a estrela de fora — cara, com salário de estrela. Quem foi contratado sai.
 */
export function mercadoOrg31(v: Vida, jid?: JogoId): JogadorDoMercado31[] {
  const o = v.orgEsports31;
  const L = o && linhaDe31(o, jid);
  if (!o || !L) return [];
  const ano = anoDe(v.t);
  const g = jogo(L.jogo);
  const mult = multDe(L);
  const r = rngDe(v.id, 'org31_mercado', L.jogo, o.nome, ano);
  const media = mediaDosTitulares31(L, ano);
  const teto = tetoDeAtracao(o, L);
  const alvo = Math.max(media + 6, Math.min(teto + 6, media + 12));
  const fake = { seq: 0 };
  const origem = () => {
    const lista = catalogo(v, L.jogo, ano).filter(x => x.nome !== o.nome && x.regiao === L.regiao);
    return lista.length ? lista[r.int(0, lista.length - 1)].nome : 'uma equipe do cenário';
  };
  const fs = funcoesDoJogo(L.jogo);
  const faixas: { faixa: JogadorDoMercado31['faixa']; forca: () => number; idade: () => number; funcao?: string }[] = [
    ...fs.map(f => ({ faixa: 'reforco' as const, funcao: f, forca: () => alvo - r.next() * 5, idade: () => g.auge - 3 + r.int(0, 6) })),
    ...[0, 1, 2].map(() => ({ faixa: 'nivel' as const, forca: () => media + r.normal() * 2.5, idade: () => g.auge - 4 + r.int(0, 10) })),
    ...[0, 1, 2].map(() => ({ faixa: 'aposta' as const, forca: () => media - 8 + r.normal() * 3, idade: () => g.idadePro + r.int(0, 2) }))
  ];
  const lista: JogadorDoMercado31[] = [];
  for (const [k, fx] of faixas.entries()) {
    const i = fx.idade();
    const j = novoJogador(fake, L, r, ano, fx.funcao ?? r.pick(fs), fx.forca(), i);
    j.id = `m${L.jogo}${ano}_${k}`; j.contratoAte = ano + 1 + r.int(0, 2);
    if (fx.faixa === 'aposta') j.potencial = clamp(Math.max(j.potencial, j.forca + 12 + r.int(0, 10)), j.forca, 93);
    const de = origem();
    if (L.comprados.includes(j.id)) continue;
    lista.push({ ...j, faixa: fx.faixa, de, preco: arred(valorDoJogador31(j, ano, mult, g.auge) * 1.2) });
  }
  if (r.chance(0.55)) {
    const j = novoJogador(fake, L, r, ano, r.pick(fs), Math.max(teto + 6, media + 10) + r.next() * 4, g.auge + r.int(-1, 3));
    j.id = `m${L.jogo}${ano}_estrela`; j.contratoAte = ano + 1; j.salario = arred(j.salario * 1.4, 1000);
    if (!L.comprados.includes(j.id)) lista.push({ ...j, faixa: 'estrela', de: 'uma organização de outra região', preco: arred(valorDoJogador31(j, ano, mult, g.auge) * 1.5) });
  }
  return lista;
}

const NOMES_TECNICO = ['Gabriel', 'Lucas', 'Rafael', 'Bruno', 'Thiago', 'Danilo', 'Henrique', 'Caio', 'André', 'Vitor', 'Renan', 'Igor', 'Marcos', 'Felipe'];
export function tecnicosOrg31(v: Vida, jid?: JogoId): Tecnico31[] {
  const o = v.orgEsports31;
  const L = o && linhaDe31(o, jid);
  if (!o || !L) return [];
  const ano = anoDe(v.t);
  const r = rngDe(v.id, 'org31_tecnicos', o.nome, L.jogo, ano);
  const teto = clamp(Math.round(L.divisao - 1 + o.reputacao / 40), 1, 5);
  const br = regiaoDoJogo33(L.jogo, L.regiao)?.pais === 'BR';
  return [0, 1, 2].map(k => {
    const nivel = clamp(teto - (k === 0 ? 0 : k === 1 ? r.int(0, 1) : r.int(1, 2)), 1, 5);
    return { nome: `${NOMES_TECNICO[r.int(0, NOMES_TECNICO.length - 1)]} ${sortearSobrenome(r, br ? 'BR' : undefined)}`, nivel, salario: arred([0, 40e3, 120e3, 350e3, 900e3, 2e6][nivel] * multDe(L)), desde: ano };
  });
}

/* ------------------------------------------------------------------ a mesa do dono */

interface ModeloMesa {
  tipo: string; quem: 'Comunidade' | 'Técnico' | 'Elenco' | 'Comercial';
  /** A line do assunto (os da comunidade e do comercial são da organização: ignoram). */
  cabe: (v: Vida, o: OrgEsports31, L: LinhaOrg33) => boolean; peso: number;
  montar: (v: Vida, o: OrgEsports31, L: LinhaOrg33, r: Rng) => Omit<SituacaoOrg31, 'id' | 'tipo' | 'ano'> | undefined;
  resolver: (v: Vida, o: OrgEsports31, L: LinhaOrg33 | undefined, s: SituacaoOrg31, op: string, r: Rng) => string;
  ignorar: (o: OrgEsports31, L: LinhaOrg33 | undefined) => string;
}
const mexer = (o: OrgEsports31, L: LinhaOrg33 | undefined, x: { fas?: number; rep?: number; moral?: number; humor?: number; caixa?: number }) => {
  if (x.fas) o.fas = clamp(Math.round(o.fas + x.fas));
  if (x.rep) o.reputacao = clamp(Math.round(o.reputacao + x.rep));
  if (x.moral && L) L.moral = clamp(Math.round(((L.moral ?? 0) + x.moral) * 10) / 10, -3, 3);
  if (x.humor && L?.tecnico) L.humorTecnico = clamp(Math.round((L.humorTecnico ?? 60) + x.humor));
  if (x.caixa) o.caixa = Math.round(o.caixa + x.caixa);
};
const ult = (L: LinhaOrg33) => L.historico[L.historico.length - 1];
const craque = (L: LinhaOrg33) => [...L.elenco].sort((a, b) => b.forca - a.forca || a.id.localeCompare(b.id))[0];
const nj = (L: LinhaOrg33, v: Vida) => JOGOS25[L.jogo].nome(anoDe(v.t));
export const QUEM_DA_MESA31: Record<string, string> = {};

const MESA: ModeloMesa[] = [
  {
    tipo: 'boas_vindas', quem: 'Comunidade', peso: 100, cabe: (v, o) => o.linhas.every(l => !l.historico.length) && anoDe(o.desde) === anoDe(v.t),
    montar: (_v, o) => ({ titulo: 'A comunidade quer ouvir o dono', texto: `O chat, os criadores e os fãs da ${o.nome} esperam o seu primeiro anúncio. O que você promete define o humor da comunidade — e a cobrança no fim do ano.`,
      opcoes: [{ id: 'titulo', texto: 'Prometer título já', dica: 'Os fãs vibram; não cumprir pesa no nome.' }, { id: 'projeto', texto: 'Falar em projeto de longo prazo', dica: 'Menos festa, menos cobrança.' }, { id: 'conteudo', texto: 'Prometer conteúdo e proximidade', dica: 'Mais fãs; o time sente as câmeras.' }] }),
    resolver: (_v, o, L, _s, op) => {
      if (op === 'titulo') { mexer(o, L, { fas: 6, rep: -1 }); return 'O anúncio viralizou: "é título ou nada". A comunidade vai cobrar.'; }
      if (op === 'conteudo') { if (o.conteudo === 0) o.conteudo = 1; mexer(o, L, { fas: 4 }); return 'Lives semanais com o elenco: a comunidade adorou ver os bastidores.'; }
      mexer(o, L, { rep: 2, fas: 1 }); return 'Um anúncio sóbrio, de projeto: os analistas elogiaram.';
    },
    ignorar: (o, L) => { mexer(o, L, { fas: -2 }); return 'O dono novo não falou com ninguém: a comunidade estranhou o silêncio.'; }
  },
  {
    tipo: 'fas_cobram', quem: 'Comunidade', peso: 3, cabe: (_v, _o, L) => { const h = ult(L); return !!h && (!!h.caiu || h.posicao > h.participantes / 2); },
    montar: (v, o, L) => ({ titulo: 'A comunidade está revoltada', texto: `Depois de uma temporada ${ult(L)?.caiu ? 'que terminou em queda' : 'ruim'} da line de ${nj(L, v)}, a hashtag pedindo mudanças na ${o.nome} ficou em alta.`,
      opcoes: [{ id: 'live', texto: 'Fazer uma live de desculpas', dica: 'Pode acalmar — ou virar meme.' }, { id: 'reformular', texto: 'Prometer reformular o elenco', dica: 'Os fãs aplaudem; o elenco sente o recado.' }, { id: 'nota', texto: 'Soltar uma nota oficial', dica: 'Seguro e frio.' }] }),
    resolver: (_v, o, L, _s, op, r) => {
      if (op === 'live') { if (r.chance(clamp(0.35 + o.reputacao / 200, 0.1, 0.9))) { mexer(o, L, { fas: 5, rep: 2 }); return 'A live foi honesta: a comunidade deu mais uma chance.'; } mexer(o, L, { fas: -3, rep: -2 }); return 'A live virou meme. Os cortes rodaram a semana inteira.'; }
      if (op === 'reformular') { mexer(o, L, { fas: 4, moral: -0.5 }); return 'Os fãs aplaudiram a promessa — e o elenco entendeu que ninguém está garantido.'; }
      mexer(o, L, { fas: -1 }); return 'A nota oficial saiu. A comunidade leu e continuou desconfiada.';
    },
    ignorar: (o, L) => { mexer(o, L, { fas: -3, rep: -1 }); return 'A revolta ficou sem resposta — e cresceu.'; }
  },
  {
    tipo: 'festa', quem: 'Comunidade', peso: 4, cabe: (_v, _o, L) => { const h = ult(L); return !!h && (!!h.titulo || !!h.subiu || !!h.internacionais?.length); },
    montar: (v, o, L) => ({ titulo: 'Os fãs querem comemorar', texto: `A line de ${nj(L, v)} da ${o.nome} ${ult(L)?.titulo ? 'foi campeã' : ult(L)?.subiu ? 'subiu de divisão' : 'foi a um torneio internacional'}, e a comunidade pede um evento, uma coleção comemorativa, uma homenagem.`,
      opcoes: [{ id: 'evento', texto: 'Bancar um fan fest', dica: 'Custa; os fãs e o elenco não esquecem.' }, { id: 'colecao', texto: 'Lançar uma coleção comemorativa', dica: 'Vende bem.' }, { id: 'discreto', texto: 'Comemorar só com o time', dica: 'Barato e íntimo.' }] }),
    resolver: (_v, o, L, _s, op) => {
      const rec = L ? ult(L)?.receita ?? 0 : 0;
      if (op === 'evento') { const c = arred(rec * 0.03 + 20000); mexer(o, L, { fas: 7, moral: 0.6, caixa: -c }); return `O fan fest lotou (${fmt(c)} de festa). O time foi ovacionado.`; }
      if (op === 'colecao') { const g = arred(rec * 0.05 + 10000); mexer(o, L, { fas: 2, caixa: g }); return `A coleção esgotou: ${fmt(g)} no caixa.`; }
      mexer(o, L, { moral: 0.4 }); return 'Um jantar com o elenco e a comissão. O grupo gostou.';
    },
    ignorar: (o, L) => { mexer(o, L, { fas: -1 }); return 'A organização nem comentou a campanha. Os fãs festejaram sozinhos.'; }
  },
  {
    tipo: 'sem_master', quem: 'Comercial', peso: 3, cabe: (v, o) => o.fas >= 8 && !o.comercial33?.contratos.some(c => c.cota === 'master' && c.ate >= anoDe(v.t)),
    montar: (_v, o) => ({ titulo: 'A camisa está sem patrocinador', texto: `Uma agência de marketing esportivo procurou a ${o.nome}: a camisa sem master é dinheiro parado. Ela oferece fazer a ponte com marcas — por uma comissão.`,
      opcoes: [{ id: 'agencia', texto: 'Contratar a agência por um ano', dica: 'O departamento comercial vira uma agência (custa por ano).' }, { id: 'eu', texto: 'Buscar eu mesmo', dica: 'Use a aba Patrocínios.' }] }),
    resolver: (_v, o, L, _s, op) => { if (op === 'agencia') { (o.comercial33 ??= novoComercial33()).departamento = 3; return 'A agência assumiu o comercial: as propostas vão melhorar.'; } mexer(o, L, { rep: 1 }); return 'O dono vai cuidar pessoalmente das conversas com as marcas.'; },
    ignorar: () => 'A agência não teve resposta e procurou outra organização.'
  },
  {
    tipo: 'tecnico_pede', quem: 'Técnico', peso: 3, cabe: (v, o, L) => !!L.tecnico && !!sugestao(v, o, L),
    montar: (v, o, L) => {
      const a = sugestao(v, o, L)!;
      return { titulo: `${L.tecnico!.nome.split(' ')[0]} pede um reforço`, texto: `O técnico da line de ${nj(L, v)} vê a função de ${nomeDaFuncao31(L.jogo, a.funcao)} como o ponto fraco e indica ${a.nick} (${a.forca} de força), da ${a.de}. A multa é de ${fmt(a.preco)}.`, alvoId: a.id, valor: a.preco,
        opcoes: [{ id: 'contratar', texto: `Contratar por ${fmt(a.preco)}`, dica: 'Sai do caixa; se a line estiver completa, o pior titular vai para o banco ou sai.' }, { id: 'negociar', texto: 'Negociar um valor menor', dica: 'Pode sair mais barato — ou ele ir para outra equipe.' }, { id: 'recusar', texto: 'Recusar: o elenco é esse', dica: 'O técnico não vai gostar.' }] };
    },
    resolver: (v, o, L, s, op, r) => {
      if (!L) return 'A line já não existe.';
      const a = mercadoOrg31(v, L.jogo).find(j => j.id === s.alvoId);
      if (!a) return 'O jogador já tinha acertado com outra equipe.';
      const contratar = (preco: number) => {
        if (o.caixa < preco) return false;
        // A line tem 1 reserva no máximo: quem chega empurra o mais fraco para fora.
        if (L.elenco.length >= maxElenco31(L.jogo, anoDe(v.t))) { const fraco = [...L.elenco].sort((x, y) => x.forca - y.forca)[0]; L.elenco = L.elenco.filter(j => j !== fraco); if (L.igl === fraco.id) L.igl = undefined; }
        o.caixa -= preco; L.comprados.push(a.id);
        const { preco: _p, de: _d, faixa: _f, ...j } = a; void _p; void _d; void _f;
        L.elenco.push(j); return true;
      };
      if (op === 'contratar') { if (contratar(a.preco)) { mexer(o, L, { humor: 12, moral: 0.2 }); return `${a.nick} chegou: o técnico ganhou a peça que pediu.`; } mexer(o, L, { humor: -4 }); return 'Não havia caixa para a contratação.'; }
      if (op === 'negociar') {
        if (r.chance(clamp(0.4 + o.reputacao / 250, 0.1, 0.9))) { const p = arred(a.preco * 0.8); if (contratar(p)) { mexer(o, L, { humor: 10 }); return `Negociação boa: ${a.nick} veio por ${fmt(p)}.`; } }
        L.comprados.push(a.id); mexer(o, L, { humor: -3 }); return `Enquanto a organização negociava, ${a.nick} fechou com outra equipe.`;
      }
      L.comprados.push(a.id); mexer(o, L, { humor: -8 }); return 'O técnico engoliu a recusa — e comentou numa entrevista que "o elenco é curto".';
    },
    ignorar: (o, L) => { mexer(o, L, { humor: -5 }); return 'O pedido do técnico ficou sem resposta.'; }
  },
  {
    tipo: 'jogador_stream', quem: 'Elenco', peso: 2, cabe: (_v, _o, L) => L.elenco.length > 0,
    montar: (_v, _o, L) => { const j = craque(L); return { titulo: `${j.nick} quer fazer mais lives`, texto: `${j.nick}, o destaque da line, recebeu uma proposta para fazer streaming todos os dias. Ele quer topar — e dividir a receita com a organização.`, jogadorId: j.id,
      opcoes: [{ id: 'liberar', texto: 'Liberar as lives', dica: 'Fãs e receita; ele treina menos.' }, { id: 'proibir', texto: 'Proibir: o foco é o competitivo', dica: 'Ele pode ficar contrariado.' }, { id: 'meio', texto: 'Liberar só fora da temporada', dica: 'Um meio-termo.' }] }; },
    resolver: (_v, o, L, s, op, r) => {
      const j = L?.elenco.find(x => x.id === s.jogadorId); if (!j) return 'O jogador já não estava no elenco.';
      if (op === 'liberar') { const g = arred(30000 + o.fas * 2000); j.forca = Math.max(25, j.forca - 1); mexer(o, L, { fas: 4, caixa: g }); return `As lives de ${j.nick} bombaram: ${fmt(g)} para a organização e muitos fãs novos — e um pouco menos de treino.`; }
      if (op === 'proibir') { if (r.chance(0.5)) return `${j.nick} entendeu e seguiu focado.`; j.forca = Math.max(25, j.forca - 2); mexer(o, L, { moral: -0.4 }); return `${j.nick} ficou contrariado e caiu de rendimento.`; }
      mexer(o, L, { fas: 2, moral: 0.1 }); return `${j.nick} topou: lives só nas férias.`;
    },
    ignorar: (o, L) => { mexer(o, L, { moral: -0.2 }); return 'O pedido das lives ficou sem resposta.'; }
  },
  {
    tipo: 'proposta', quem: 'Elenco', peso: 2.5, cabe: (_v, o, L) => { const j = craque(L); return !!j && j.forca >= tetoDeAtracao(o, L) - 2; },
    montar: (v, _o, L, r) => { const j = craque(L); const valor = arred(valorDoJogador31(j, anoDe(v.t), multDe(L), jogo(L.jogo).auge) * (1.4 + r.next() * 0.3)); return { titulo: 'Proposta por um titular', texto: `Uma organização maior oferece ${fmt(valor)} pela multa de ${j.nick} (${j.forca} de força, line de ${nj(L, v)}).`, jogadorId: j.id, valor,
      opcoes: [{ id: 'vender', texto: `Vender por ${fmt(valor)}`, dica: 'Caixa garantido; o time perde força.' }, { id: 'segurar', texto: 'Recusar e renovar com aumento', dica: 'Ele fica; a folha cresce.' }, { id: 'mais', texto: 'Pedir mais', dica: 'Pode render muito — ou esfriar.' }] }; },
    resolver: (v, o, L, s, op, r) => {
      const j = L?.elenco.find(x => x.id === s.jogadorId); if (!L || !j) return 'O jogador já não estava no elenco.';
      const vender = (valor: number) => { L.elenco.splice(L.elenco.indexOf(j), 1); o.caixa += valor; L.vendas.unshift({ nome: j.nick, para: 'uma organização maior', valor, ano: anoDe(v.t) }); if (L.vendas.length > 20) L.vendas.length = 20; if (L.igl === j.id) L.igl = undefined; repor(o, L, rngDe(v.id, 'org33_repor', s.id), anoDe(v.t)); };
      if (op === 'vender') { vender(s.valor!); mexer(o, L, { fas: -2 }); return `${j.nick} foi vendido por ${fmt(s.valor!)}. Um jogador livre do cenário completou a line.`; }
      if (op === 'segurar') { j.salario = arred(j.salario * 1.35, 1000); j.contratoAte = anoDe(v.t) + 2; mexer(o, L, { fas: 3, moral: 0.3 }); return `${j.nick} fica: renovou até ${j.contratoAte}.`; }
      if (r.chance(0.45)) { const mais = arred(s.valor! * 1.25); vender(mais); return `A proposta subiu para ${fmt(mais)}, e ${j.nick} foi vendido.`; }
      mexer(o, L, { moral: -0.2 }); return `O interesse esfriou: ${j.nick} fica — meio frustrado.`;
    },
    ignorar: (o, L) => { mexer(o, L, { moral: -0.2 }); return 'A proposta ficou sem resposta e caducou.'; }
  }
];
for (const m of MESA) QUEM_DA_MESA31[m.tipo] = m.quem;

/** O reforço que o técnico indicaria: o melhor do mercado na função mais fraca dos titulares, MELHOR do que quem joga lá. */
function sugestao(v: Vida, _o: OrgEsports31, L: LinhaOrg33): JogadorDoMercado31 | undefined {
  const tit = titulares31(L, anoDe(v.t));
  const fraco = [...tit].sort((a, b) => a.forca - b.forca)[0];
  if (!fraco) return undefined;
  return mercadoOrg31(v, L.jogo).filter(j => j.funcao === fraco.funcao && j.forca > fraco.forca).sort((a, b) => b.forca - a.forca)[0];
}

/** Completa os titulares com jogadores livres do cenário (um pouco abaixo do time). */
function repor(o: OrgEsports31, L: LinhaOrg33, r: Rng, ano: number): void {
  const g = jogo(L.jogo);
  const fs = funcoesDoJogo(L.jogo);
  const media = mediaDosTitulares31(L, ano);
  while (L.elenco.length < titularesDoJogo31(L.jogo, ano)) {
    const f = fs.find(x => !L.elenco.some(j => j.funcao === x)) ?? r.pick(fs);
    L.elenco.push(novoJogador(o, L, r, ano, f, Math.min(media - 3, forcaDoCampo31(L.jogo, L.divisao, L.regiao)) + r.normal() * 3, g.auge - 2 + r.int(0, 5)));
  }
}

function abrirMesa(v: Vida, o: OrgEsports31, n: number): void {
  const ano = anoDe(v.t);
  for (const s of o.mesa) { const m = MESA.find(x => x.tipo === s.tipo); if (m) o.mesaHist.unshift({ ano: s.ano, tipo: s.tipo, titulo: s.titulo, texto: m.ignorar(o, s.jogo ? linhaDe31(o, s.jogo) : undefined), ignorado: true }); }
  o.mesa = [];
  if (!o.linhas.length) return;
  const r = rngDe(v.id, 'org31_mesa', o.nome, ano);
  const recentes = new Set(o.mesaHist.filter(h => ano - h.ano <= 1).map(h => h.tipo));
  const usados = new Set<string>();
  for (let k = 0; k < n; k++) {
    const L = o.linhas[r.int(0, o.linhas.length - 1)];
    const cand = MESA.filter(m => !recentes.has(m.tipo) && !usados.has(m.tipo) && m.cabe(v, o, L));
    if (!cand.length) continue;
    const total = cand.reduce((s, m) => s + m.peso, 0);
    let u = r.next() * total, i = 0;
    for (; i < cand.length - 1; i++) { u -= cand[i].peso; if (u <= 0) break; }
    const m = cand[i];
    usados.add(m.tipo);
    const corpo = m.montar(v, o, L, r);
    const daLinha = m.quem === 'Técnico' || m.quem === 'Elenco' || m.tipo === 'fas_cobram' || m.tipo === 'festa';
    if (corpo) o.mesa.push({ id: `${m.tipo}_${ano}_${k}`, tipo: m.tipo, ano, ...(daLinha ? { jogo: L.jogo } : {}), ...corpo });
  }
  if (o.mesaHist.length > 30) o.mesaHist.length = 30;
}

function responderMesa(v: Vida, o: OrgEsports31, id: string, op: string): { texto: string; tom: 'bom' | 'ruim' | 'neutro' } {
  const s = o.mesa.find(x => x.id === id)!;
  const m = MESA.find(x => x.tipo === s.tipo)!;
  const L = s.jogo ? linhaDe31(o, s.jogo) : undefined;
  const antes = o.fas + (L?.moral ?? 0) * 5;
  const texto = m.resolver(v, o, L, s, op, rngDe(v.id, 'org31_resposta', s.id, op));
  o.mesa = o.mesa.filter(x => x.id !== id);
  o.mesaHist.unshift({ ano: s.ano, tipo: s.tipo, titulo: s.titulo, texto, opcao: s.opcoes.find(x => x.id === op)?.texto });
  if (o.mesaHist.length > 30) o.mesaHist.length = 30;
  escrever(v, { texto: `${o.nome} · ${s.titulo}: ${texto}`, relevancia: 'cotidiano', tema: 'trabalho', escolha: true });
  const saldo = o.fas + (L?.moral ?? 0) * 5 - antes;
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
const maiusc = (s: string) => `${s.charAt(0).toUpperCase()}${s.slice(1)}`;

interface ResultadoDaLinha { receita: number; despesa: number; titulo: boolean; subiu: boolean; caiu: boolean; topo: boolean; internacional: boolean; campeaoMundial: boolean }

/** VIDA 35 · a temporada da line academy: a liga uma divisão abaixo da principal; sobe ou cai; nunca na mesma liga da principal. */
function temporadaDaAcademy35(v: Vida, o: OrgEsports31, L: LinhaOrg33, ano: number): void {
  const a = L.academy35;
  if (!a || anoDe(a.desde) > ano || a.historico.some(h => h.ano === ano)) return;
  const g = jogo(L.jogo);
  const r = rngDe(v.id, 'org35_academy_ano', o.nome, L.jogo, ano);
  const teto = Math.max(2, Math.min(3, L.divisao - 1)) as Divisao31;
  if (a.divisao > teto) a.divisao = teto;
  const n = clamp(g.niveis[a.divisao - 1].equipes, 8, 16);
  const posicao = colocacao(r, forcaDaAcademy35(L, ano), forcaDoCampo31(L.jogo, a.divisao, L.regiao), n);
  const liga = nomeDaLiga31({ jogo: L.jogo, divisao: a.divisao, regiao: L.regiao }, ano);
  const subiu = a.divisao < teto && posicao <= 2;
  const caiu = a.divisao === 3 && posicao > n - 2;
  a.historico.push({ ano, liga, divisao: a.divisao, posicao, participantes: n, ...(subiu ? { subiu } : {}), ...(caiu ? { caiu } : {}) });
  if (a.historico.length > 20) a.historico.splice(0, a.historico.length - 20);
  if (subiu) a.divisao = (a.divisao + 1) as Divisao31;
  if (caiu) a.divisao = (a.divisao - 1) as Divisao31;
  escrever(v, { texto: `A academy de ${JOGOS25[L.jogo].nome(ano)} da ${o.nome} terminou ${ano} em ${posicao}º de ${n} na ${liga}${subiu ? ' e subiu' : caiu ? ' e caiu' : ''}.`, relevancia: 'cotidiano', tema: 'trabalho' });
  // Contratos: os jovens ficam; quem passou do auge sai.
  a.elenco = a.elenco.filter(j => ano + 1 - anoDe(j.tNasc) <= g.auge + 3);
  const fs = funcoesDoJogo(L.jogo);
  while (a.elenco.length < titularesDoJogo31(L.jogo, ano + 1)) {
    const j = novoJogador(o, L, r, ano + 1, fs[a.elenco.length % fs.length], mediaDosTitulares31(L, ano) - 10 + r.normal() * 3, g.idadePro + r.int(0, 1));
    j.salario = Math.round(j.salario * 0.4); j.daAcademia = true; a.elenco.push(j);
  }
}

/** A temporada de uma line: a liga da região, o acesso, os internacionais, o dinheiro da line, a evolução e a academia. */
function temporadaDaLinha(v: Vida, o: OrgEsports31, L: LinhaOrg33, ano: number): ResultadoDaLinha | undefined {
  if (L.historico.some(h => h.ano === ano) || anoDe(L.desde) > ano) return undefined;
  const g = jogo(L.jogo);
  const r = rngDe(v.id, 'org31_ano', o.nome, L.jogo, ano);
  const mult = multDe(L);
  L.regiao = regiaoVigente33(L.jogo, L.regiao, ano);
  // 1. A liga da região.
  const forca = forcaDoTime31(o, L, ano);
  const n = L.divisao === 4 ? equipesDaLigaPrincipal33(L.jogo, L.regiao, ano) : clamp(g.niveis[L.divisao - 1].equipes, 8, 16);
  const posicao = colocacao(r, forca, forcaDoCampo31(L.jogo, L.divisao, L.regiao), n);
  const liga = nomeDaLiga31(L, ano);
  const regras = regrasDaDivisao33(L.jogo, L.regiao, L.divisao, ano);
  const titulo = posicao === 1;
  let subiu = regras.sobem > 0 && posicao <= regras.sobem;
  let acesso: TemporadaOrg31['acesso'];
  if (regras.acesso && posicao === 1) {
    // A Ascension: os campeões das segundas divisões da liga internacional disputam uma vaga.
    const venceu = colocacao(r, forca, forcaDoCampo31(L.jogo, 3, L.regiao) + 3, 6) === 1;
    acesso = { nome: regras.acesso, venceu }; subiu = venceu;
  }
  const caiu = regras.caem > 0 && posicao > n - regras.caem;
  // 2. Os internacionais: as vagas da liga principal da região; o campeão da segunda divisão, onde houver, pela classificatória.
  const internacionais: Internacional31[] = [];
  let premio = arred(g.niveis[L.divisao - 1].premio * fatia(posicao, n) * mult);
  for (const ev of internacionais33(L.jogo, ano)) {
    const vagas = L.divisao === 4 ? ev.vagas[L.regiao] ?? 0 : 0;
    let vai = posicao <= vagas, via = false;
    if (!vai && L.divisao === 3 && (ev.div3?.[L.regiao] ?? 0) >= posicao) { vai = colocacao(r, forca, forcaDoCampo31(L.jogo, 4, L.regiao) + 1, 4) === 1; via = vai; }
    if (!vai) continue;
    for (let k = 0; k < ev.vezes; k++) {
      const col = colocacao(r, forca, forcaDoInternacional31(L.jogo), ev.equipes);
      const nome = ev.vezes > 1 ? `${ev.nome} (${k + 1}ª etapa)` : ev.nome;
      internacionais.push({ nome, colocacao: col, participantes: ev.equipes, ...(col === 1 ? { titulo: true } : {}), ...(via ? { viaQualificatoria: true } : {}) });
      premio += arred(g.niveis[4].premio * ev.peso * fatia(col, ev.equipes));
      if (col === 1) L.trofeus.push({ ano, nome: ev.vezes > 1 ? `${ev.nome} ${ano} (${k + 1}ª etapa)` : `${ev.nome} ${ano}`, tipo: ev.peso >= 1 ? 'mundial' : 'internacional' });
    }
  }
  const principal = internacionais33(L.jogo, ano).find(e => e.peso >= 1)?.nome;
  const campeaoMundial = internacionais.some(i => i.titulo && i.nome === principal);
  // 3. O dinheiro da line (o da organização — patrocínios, loja, conteúdo, dívida — fecha junto, em `processarOrg31`).
  const receita = arred(receitaBase31(L.divisao, o.fas, o.reputacao, mult) + premio);
  const folha = L.elenco.reduce((s, j) => s + j.salario, 0) + L.academia.reduce((s, j) => s + j.salario, 0) + (L.academy35?.elenco.reduce((s, j) => s + j.salario, 0) ?? 0);
  const bicho = o.bicho35 && posicao === 1 ? arred(L.elenco.reduce((s2, j) => s2 + j.salario, 0) * 0.15) : 0;
  const despesa = arred(folha + (L.tecnico?.salario ?? 0) + OPERACAO[L.divisao] * mult + receita * 0.3 + [0, 60e3, 200e3][L.academiaNivel] * mult + (L.academy35 ? OPERACAO[2] * 0.5 * mult : 0)
    + STAFF35[L.staff35 ?? 0].salario * mult + bicho);
  // VIDA 35: a temporada da academy (uma divisão abaixo da principal, no máximo a segunda).
  temporadaDaAcademy35(v, o, L, ano);
  // 4. A história e os troféus.
  const div = L.divisao;
  L.historico.push({ ano, divisao: div, liga, posicao, participantes: n, ...(internacionais.length ? { internacionais } : {}), ...(acesso ? { acesso } : {}), premio, receita, despesa, forca, ...(titulo ? { titulo } : {}), ...(subiu ? { subiu } : {}), ...(caiu ? { caiu } : {}), ...(campeaoMundial ? { campeaoMundial } : {}) });
  if (L.historico.length > 40) L.historico.splice(0, L.historico.length - 40);
  if (titulo) L.trofeus.push({ ano, nome: `${maiusc(liga)} ${ano}`, tipo: 'liga' });
  const nomeJogo = JOGOS25[L.jogo].nome(ano);
  const melhorInt = [...internacionais].sort((a, b) => a.colocacao - b.colocacao)[0];
  const frase = campeaoMundial ? `Campeã do mundo! A line de ${nomeJogo} da ${o.nome} venceu o ${principal} de ${ano}.`
    : titulo ? `A ${o.nome} foi campeã da ${liga} (${nomeJogo}) em ${ano}${melhorInt ? ` e foi ao ${melhorInt.nome}: ${melhorInt.colocacao}º lugar` : ''}.`
      : subiu ? `A line de ${nomeJogo} da ${o.nome} subiu de divisão em ${ano}${acesso ? ` vencendo a ${acesso.nome}` : ` (${posicao}º na ${liga})`}.`
        : caiu ? `A line de ${nomeJogo} da ${o.nome} caiu em ${ano}: ${posicao}º de ${n} na ${liga}.`
          : `A line de ${nomeJogo} da ${o.nome} terminou ${ano} em ${posicao}º de ${n} na ${liga}${melhorInt ? `, e em ${melhorInt.colocacao}º no ${melhorInt.nome}` : ''}${acesso && !acesso.venceu ? `; perdeu a ${acesso.nome}` : ''}.`;
  escrever(v, { texto: frase, relevancia: titulo || subiu || caiu || internacionais.length ? 'marco' : 'cotidiano', tema: 'trabalho', tom: titulo || subiu || campeaoMundial ? 'bom' : caiu ? 'ruim' : undefined });
  if (subiu) L.divisao = (L.divisao + 1) as Divisao31;
  if (caiu) L.divisao = (L.divisao - 1) as Divisao31;
  // 5. O assédio de fora: quem passa muito do que a organização segura recebe proposta — e quase sempre vai.
  const segura = tetoDeAtracao(o, L) + 3;
  for (const j of [...L.elenco].filter(x => x.forca > segura).sort((a, b) => b.forca - a.forca).slice(0, 1)) {
    if (!r.chance(0.4)) continue;
    const valor = arred(valorDoJogador31(j, ano, mult, g.auge) * (1 + r.next() * 0.3));
    L.elenco.splice(L.elenco.indexOf(j), 1); o.caixa += valor; if (L.igl === j.id) L.igl = undefined;
    L.vendas.unshift({ nome: j.nick, para: 'uma organização maior', valor, ano }); if (L.vendas.length > 20) L.vendas.length = 20;
    escrever(v, { texto: `${j.nick} saiu da ${o.nome} para uma organização maior, que pagou a multa: ${fmt(valor)}.`, relevancia: 'cotidiano', tema: 'trabalho' });
  }
  // 6. Os jogadores: a mão chega ao auge cedo e cai depois; o técnico e o bootcamp ajudam os jovens.
  const novoAno = ano + 1;
  const evoluir = (j: JogadorOrg31) => {
    const i = novoAno - anoDe(j.tNasc);
    const ajuda = 0.15 + (L.tecnico?.nivel ?? 1) * 0.02 + (L.bootcamp === ano ? 0.04 : 0) - (o.conteudo === 2 ? 0.04 : 0) + foco35(L.foco35).evolucao;
    if (i <= g.auge) j.forca = clamp(Math.round(j.forca + Math.max(0, (j.potencial - j.forca) * (ajuda + extra)) + r.normal() * 1.5), 20, j.potencial);
    else if (i <= g.auge + 4) j.forca = clamp(Math.round(j.forca + r.normal() * 1.2), 20, 97);
    else j.forca = clamp(Math.round(j.forca - (i - g.auge - 4) * 0.9 * (o.casa35?.includes('fisio') ? 0.7 : 1) * (L.foco35 === 'leve' ? 0.8 : 1) + r.normal()), 20, 97);
    if (j.forca > j.potencial) j.potencial = j.forca;
  };
  let extra = 0;
  L.elenco.forEach(evoluir); L.academia.forEach(evoluir);
  // VIDA 35: quem joga partidas oficiais (na academy ou emprestado) evolui mais.
  extra = 0.06;
  L.academy35?.elenco.forEach(evoluir); L.emprestados35?.forEach(e => evoluir(e.jogador));
  extra = 0;
  for (const e of (L.emprestados35 ?? []).filter(x => x.ate <= ano)) (L.academy35 && L.elenco.length >= maxElenco31(L.jogo, novoAno) ? L.academy35.elenco : L.elenco).push(e.jogador);
  if (L.emprestados35) { L.emprestados35 = L.emprestados35.filter(x => x.ate > ano); if (!L.emprestados35.length) delete L.emprestados35; }
  // Os contratos que acabam: a comissão renova quem é útil; os outros saem.
  const media = mediaDosTitulares31(L, novoAno);
  for (const j of L.elenco) if (j.contratoAte <= ano && novoAno - anoDe(j.tNasc) <= g.auge + 6 && j.forca >= media - 4 && r.chance(0.7)) { j.contratoAte = novoAno + 1; j.salario = salarioDe31(j.forca, mult); }
  const saem = L.elenco.filter(j => j.contratoAte <= ano || novoAno - anoDe(j.tNasc) >= g.auge + 12);
  if (saem.length) {
    L.elenco = L.elenco.filter(j => !saem.includes(j));
    if (L.igl && saem.some(j => j.id === L.igl)) L.igl = undefined;
    escrever(v, { texto: `Deixaram a line de ${nomeJogo} da ${o.nome} no fim do contrato: ${saem.map(j => j.nick).join(', ')}.`, relevancia: 'cotidiano', tema: 'trabalho' });
  }
  // A line nunca fica sem os titulares: os livres do cenário.
  repor(o, L, r, novoAno);
  if (L.elenco.length > maxElenco31(L.jogo, novoAno)) L.elenco = [...L.elenco].sort((a, b) => b.forca - a.forca).slice(0, maxElenco31(L.jogo, novoAno));
  // 7. A academia revela.
  if (L.academiaNivel > 0) {
    const fs = funcoesDoJogo(L.jogo);
    for (let k = 0; k < L.academiaNivel + 1; k++) {
      const j = novoJogador(o, L, r, novoAno, r.pick(fs), media - 12 + r.normal() * 4, g.idadePro - 1 + r.int(0, 2));
      j.potencial = clamp(Math.round(j.forca + 12 + L.academiaNivel * 4 + Math.max(0, r.normal()) * 8), j.forca, r.chance(0.05) ? 95 : 90);
      j.daAcademia = true; j.salario = Math.round(j.salario * 0.25);
      L.academia.push(j);
    }
    L.academia = L.academia.filter(j => novoAno - anoDe(j.tNasc) <= g.auge).sort((a, b) => b.potencial - a.potencial).slice(0, 5);
  }
  if (L.moral) L.moral = Math.round(L.moral * 5) / 10;
  // VIDA 35: o equipamento e a casa no clima da line; o psicólogo segura o clima ruim.
  const clima = climaDoSetup35(L.setup35, novoAno) + (o.casa35?.includes('academia') ? 0.1 : 0) + (o.casa35?.includes('quartos') ? 0.1 : 0) + foco35(L.foco35).clima + (o.bicho35 ? 0.3 : 0);
  if (clima) L.moral = clamp(Math.round(((L.moral ?? 0) + clima) * 10) / 10, -3, 3);
  if (o.casa35?.includes('psicologo') && (L.moral ?? 0) < 0) L.moral = Math.round((L.moral ?? 0) * 5) / 10;
  return { receita, despesa, titulo, subiu, caiu, topo: posicao <= 3, internacional: internacionais.length > 0, campeaoMundial };
}

/** A temporada que fechou (na virada do ano): cada line, e a organização (patrocínios, loja, conteúdo, dívida, fãs, nome, mesa). */
export function processarOrg31(v: Vida): void {
  const o = v.orgEsports31;
  if (!o || v.morte) return;
  const ano = anoDe(v.t - 6);
  if (anoDe(o.desde) > ano) return;
  const ctxAno = contextoOrg33(v, ano);
  const res = o.linhas.map(L => temporadaDaLinha(v, o, L, ano)).filter((x): x is ResultadoDaLinha => !!x);
  if (!res.length) return;
  const r = rngDe(v.id, 'org33_fechar', o.nome, ano);
  const resumo = { titulo: res.some(x => x.titulo), subiu: res.some(x => x.subiu), caiu: res.some(x => x.caiu), topo: res.some(x => x.topo), internacional: res.some(x => x.internacional) };
  const dono = fecharAnoDono33(ctxAno, contextoOrg33(v, ano + 1), o, resumo, r);
  const estudio = o.casa35?.includes('estudio') ? arred(80e3 * multMedio(o) * (0.5 + o.fas / 100)) : 0;
  // VIDA 35.1: os criadores de conteúdo — salário de um lado, audiência e receita do outro.
  const criadores = o.criadores35 ?? [];
  const recCriadores = arred(criadores.reduce((s2, c) => s2 + c.salario * 1.25 * (0.5 + o.fas / 100), 0));
  const salCriadores = criadores.reduce((s2, c) => s2 + c.salario, 0);
  const receita = res.reduce((s, x) => s + x.receita, 0) + receitaConteudo(o) + dono.receita + estudio + recCriadores;
  const despesa = res.reduce((s, x) => s + x.despesa, 0) + dono.despesa + o.divida * 0.12 + manutencaoDaCasa35(o.casa35, multMedio(o)) + salCriadores;
  o.caixa += receita - despesa;
  if (o.caixa < 0) { o.divida += -o.caixa; o.caixa = 0; }
  else if (o.divida > 0 && o.caixa > receita * 0.2) { const a = Math.min(o.divida, Math.round((o.caixa - receita * 0.2) * 0.5)); o.divida -= a; o.caixa -= a; }
  for (const t of dono.textos) escrever(v, { texto: `${o.nome}: ${t}`, relevancia: 'cotidiano', tema: 'dinheiro' });
  // Os fãs e o nome: a melhor line puxa; cada jogo a mais soma um pouco de público.
  const alvoFas = Math.max(...o.linhas.map(l => [0, 0, 12, 30, 58][l.divisao])) + (resumo.titulo ? 8 : 0) + (resumo.internacional ? 10 : 0) + o.conteudo * 4 + (o.linhas.length - 1) * 3;
  o.fas = clamp(Math.round(o.fas * 0.8 + alvoFas * 0.2 + (estudio ? 2 : 0) + criadores.reduce((s2, c) => s2 + c.fas / 15, 0) + (resumo.subiu ? 4 : 0) - (resumo.caiu ? 5 : 0) + (res.some(x => x.campeaoMundial) ? 10 : 0)));
  const delta = res.reduce((s, x) => s + (x.titulo ? 6 : 0) + (x.subiu ? 5 : 0) - (x.caiu ? 7 : 0) + (x.internacional ? (x.campeaoMundial ? 15 : 4) : 0) + (x.topo ? 1 : -0.5), 0);
  o.reputacao = clamp(Math.round(o.reputacao + dono.rep + delta / Math.sqrt(res.length)));
  atualizarValor(o, ano + 1);
  abrirMesa(v, o, resumo.titulo || resumo.caiu || resumo.subiu ? 3 : 2);
}

/** O que uma line vale numa venda: a vaga (a franquia, nas ligas fechadas), o elenco e a receita que ela traz. */
export function valorDaLinha33(o: OrgEsports31, L: LinhaOrg33, ano: number): number {
  const g = jogo(L.jogo);
  const mult = multDe(L);
  const elenco = L.elenco.reduce((s, j) => s + valorDoJogador31(j, ano, mult, g.auge), 0);
  const vaga = L.divisao === 2 ? 0 : custoDaVaga33(L.jogo, L.regiao, L.divisao === 3 ? 'acesso' : 'elite', ano) * 0.85;
  return arred(receitaBase31(L.divisao, o.fas, o.reputacao, mult) * 0.8 + elenco * 0.6 + vaga, 1e4);
}

function atualizarValor(o: OrgEsports31, ano: number): void {
  const marca = (o.fas * o.reputacao / 100) * 60e3 * multMedio(o) + o.linhas.reduce((s, l) => s + l.trofeus.length, 0) * 200e3 * multMedio(o);
  o.valor = arred(o.linhas.reduce((s, l) => s + valorDaLinha33(o, l, ano), 0) + marca, 1e5);
}

/* ------------------------------------------------------------------ fama e saves */

registrarMotivoDoNome(v => {
  const o = v.orgEsports31;
  if (!o) return undefined;
  const titulos = (o.linhas ?? []).reduce((s, l) => s + l.trofeus.length, 0);
  return { valor: Math.min(60, o.fas / 4 + o.reputacao / 6 + titulos * 4), fonte: 'negocio' };
});

type Legado = Partial<OrgEsports31> & Partial<Omit<LinhaOrg33, 'desde' | 'regiao'>> & { regiao?: string; patrocinio?: { nome: string; valor: number; ate: number; rep: number } };

/** Saves: o estado é opcional; o que vier quebrado sai, o que faltar ganha o padrão. A VIDA 32 (um jogo só) vira uma line. */
export function normalizarVida32Org(v: Vida): void {
  const o = v.orgEsports31 as Legado | undefined;
  if (o === undefined) return;
  if (!o || typeof o !== 'object' || typeof o.nome !== 'string') { delete v.orgEsports31; return; }
  const ano = anoDe(v.t);
  if (!Array.isArray(o.linhas)) {
    if (!Array.isArray(o.elenco) || !o.jogo || !JOGOS25[o.jogo]) { delete v.orgEsports31; return; }
    const jid = o.jogo;
    const regiao = o.regiao === 'INT' ? regiaoDaOrgReal33(jid, o.nome) : regiaoBrasil33(jid);
    const div = o.divisao === 3 || o.divisao === 4 ? o.divisao : 2;
    o.linhas = [{
      jogo: jid, regiao: regiaoVigente33(jid, regiao, ano), divisao: div, desde: typeof o.desde === 'number' ? o.desde : v.t, entrada: o.fundada ? 'base' : 'compra',
      elenco: o.elenco, academia: o.academia ?? [], academiaNivel: o.academiaNivel ?? 0, ...(o.tecnico ? { tecnico: o.tecnico, humorTecnico: o.humorTecnico } : {}),
      ...(o.igl ? { igl: o.igl } : {}), ...(o.bootcamp ? { bootcamp: o.bootcamp } : {}), ...(o.moral ? { moral: o.moral } : {}),
      historico: o.historico ?? [], trofeus: o.trofeus ?? [], comprados: o.comprados ?? [], vendas: o.vendas ?? []
    }];
    const antigo = contratoAntigo33(o.patrocinio, ano);
    o.comercial33 = normalizarComercial33(o.comercial33) ?? novoComercial33();
    if (antigo) o.comercial33.contratos.push(antigo);
    for (const k of ['jogo', 'regiao', 'divisao', 'elenco', 'academia', 'academiaNivel', 'tecnico', 'humorTecnico', 'igl', 'bootcamp', 'moral', 'historico', 'trofeus', 'comprados', 'vendas', 'patrocinio'] as const) delete (o as Record<string, unknown>)[k];
  }
  o.linhas = (o.linhas ?? []).filter(l => l && JOGOS25[l.jogo] && Array.isArray(l.elenco));
  for (const l of o.linhas) {
    l.academia ??= []; l.historico ??= []; l.trofeus ??= []; l.comprados ??= []; l.vendas ??= []; l.academiaNivel ??= 0;
    if (l.divisao !== 2 && l.divisao !== 3 && l.divisao !== 4) l.divisao = 2;
    if (typeof l.regiao !== 'string' || !regiaoDoJogo33(l.jogo, l.regiao)) l.regiao = regiaoBrasil33(l.jogo);
    if (typeof l.desde !== 'number') l.desde = o.desde ?? v.t;
    const st = normalizarSetup35(l.setup35); if (st) l.setup35 = st; else delete l.setup35;
    if (l.academy35 && (!Array.isArray(l.academy35.elenco) || !Array.isArray(l.academy35.historico))) delete l.academy35;
    if (l.emprestados35 && !Array.isArray(l.emprestados35)) delete l.emprestados35;
  }
  if (o.casa35) o.casa35 = Array.isArray(o.casa35) ? o.casa35.filter(c => ['academia', 'chef', 'psicologo', 'analise', 'fisio', 'estudio', 'quartos'].includes(c)) as Comodo35[] : undefined;
  if (!o.casa35?.length) delete o.casa35;
  o.mesa ??= []; o.mesaHist ??= []; o.conteudo ??= 0; o.seq ??= 1000;
  for (const k of ['caixa', 'divida', 'valor', 'preco', 'fas', 'reputacao'] as const) if (typeof o[k] !== 'number' || !Number.isFinite(o[k])) o[k] = 0;
  if (typeof o.desde !== 'number') o.desde = v.t;
  const id = normalizarIdentidade33(o.identidade33); if (id) o.identidade33 = id; else delete o.identidade33;
  o.comercial33 = normalizarComercial33(o.comercial33) ?? novoComercial33();
  const loja = normalizarLoja33(o.loja33, ano); if (loja) o.loja33 = loja; else delete o.loja33;
}
