/**
 * ERAS v4 · A SOCIEDADE QUE PESA NA VIDA — barreiras, privilégios, reformas, movimentos e a história alternativa.
 *
 * A v3 dizia o que a lei e a sociedade impunham (um texto, uma vez). A v4 faz isso pesar onde pesa: na vaga de emprego, na
 * faculdade, no crédito, na candidatura. Cada BARREIRA tem país, período, lugar (divisões), a quem pesa, a NATUREZA dela
 * — lei (proibido), instituição (a prática das escolas, dos bancos, dos patrões, do partido) ou costume (permitido, mas
 * discriminado) — o domínio da vida em que pesa, o efeito (fecha a porta ou diminui a chance), a alternativa que existia
 * e a fonte. Depois que a lei cai, o costume não some no mesmo dia: o resíduo volta a 1 aos poucos.
 *
 * O mundo pode mudar. Uma REFORMA (a lei que acabou com a barreira, na data real) pode vir antes — ou só num estado, numa
 * cidade — quando alguém com o cargo certo a aprova (`eras/v4/politica4`), ou quando um MOVIMENTO faz pressão bastante
 * perto da hora. A mudança fica gravada na vida (`v.era.historia`), passa aos herdeiros com a vida e é lida aqui: a
 * barreira cai na data da mudança, no alcance dela (o município, o estado, o país). Uma reforma muito à frente do tempo
 * pode ser derrubada depois (pelos tribunais, pela legislatura seguinte): aí a barreira volta, até a data real.
 *
 * Classes de dado: [F] fato documentado (a lei, a data, a fonte) · [A] aproximação de jogo (a força de um costume, o
 * tamanho de uma chance) — marcada no próprio dado. Nada aqui é verdade sobre as pessoas: o que se representa é a
 * estrutura (quem fechava a porta), nunca uma capacidade ou um comportamento de quem nasce de um jeito.
 *
 * Puro: só lê a vida e os pacotes; não importa nenhum pacote de cima. Vida contemporânea (sem época): nada pesa.
 */
import type { Vida } from '../../tipos';
import type { PartidoNoTempo } from './partidos';
import { mesHistoricoCorrente, paisHistoricoCorrente, ladoHistoricoCorrente } from './moedas';
import { pacoteDaEra, type LadoDaDivisao } from './pacote';
import { SOCIEDADE_BR } from './sociedadeBR';
import { REGRAS_BR } from './regrasBR';

/* ------------------------------------------------------------------ Os tipos */

/** A quem a barreira pesa (a estrutura da época — nunca uma qualidade da pessoa). */
export type QuemPesa =
  | 'mulher' | 'mulher_casada' | 'negro' | 'indigena' | 'pobre' | 'mesmo_genero' | 'religioso' | 'fichado'
  /** O privilégio é o espelho: quem vinha de família com dinheiro e nome. */
  | 'rico';
export type NaturezaDaBarreira = 'lei' | 'instituicao' | 'costume';
export type DominioDaBarreira = 'trabalho' | 'salario' | 'estudo' | 'credito' | 'politica';

export interface AlvoDaBarreira {
  setores?: string[];
  trilhas?: string[];
  ocupacoes?: string[];
  /** Só o serviço público por concurso. */
  concurso?: boolean;
  /** Só a partir deste nível da ocupação (0..5). */
  nivelMin?: number;
  /** Política: só estes cargos. */
  cargos?: string[];
}

export interface BarreiraDaEpoca {
  id: string;
  quem: QuemPesa;
  natureza: NaturezaDaBarreira;
  dominio: DominioDaBarreira;
  /** Anos de vigência [de, ate) — `ate` é a data real em que caiu (a lei, a decisão, o fim da prática). */
  de: number;
  ate?: number;
  divisoes?: string[];
  lado?: LadoDaDivisao;
  alvo?: AlvoDaBarreira;
  /** Fecha a porta (a lei proibia; a instituição não aceitava). */
  bloqueia?: boolean;
  /** Ou multiplica a chance (0..1: o costume, a prática). */
  fator?: number;
  /** Depois de cair, o costume fica: o fator que sobra e em quantos anos volta a 1. [A] */
  residuo?: { fator: number; anos: number };
  /** O que a pessoa encontra (o motivo, sem adjetivo). */
  texto: string;
  /** O que existia como saída na época (quando havia). */
  alternativa?: string;
  /** A reforma que a derruba (id). */
  reforma?: string;
  fonte: string;
  certeza?: 'documentado' | 'aproximado';
}

export type AlcanceDaReforma = 'nacional' | 'estadual' | 'municipal';

export interface ReformaDaEpoca {
  id: string;
  nome: string;
  /** O que a reforma faz, na frase da vida. */
  texto: string;
  /** Barreiras (ids da v4) e regras da v3 (`RegraSocial.id`) que ela derruba. */
  derruba: string[];
  /** Ou o que ela cria, com efeito no motor (lido pelos sistemas): mais escola, saúde pública. */
  institui?: 'escola' | 'saude';
  /** Quando aconteceu na história real ([ano, mês]); ausente: não aconteceu no período. */
  real?: [number, number];
  /** Desde quando faz sentido propor (antes disso, a pergunta nem se colocava). */
  desde: number;
  alcance: AlcanceDaReforma;
  /** Só nestas divisões (uma lei estadual do Sul dos EUA). */
  divisoes?: string[];
  lado?: LadoDaDivisao;
  /** A força da oposição na época (0..1) [A] e quem se opunha [F]. */
  resistencia: number;
  oposicao: string;
  /** Acontecimentos da linha do tempo real que ela antecipa (quando vier antes, a notícia real muda). */
  acontecimentos?: string[];
  fonte: string;
}

export interface MovimentoDaEpoca {
  id: string;
  nome: string;
  /** A causa, em uma frase. */
  causa: string;
  /** As reformas pelas quais o movimento lutava. */
  reformas: string[];
  de: number;
  ate: number;
  divisoes?: string[];
  lado?: LadoDaDivisao;
  /** A repressão por período: 0 livre · 1 hostilidade (demissão, polícia na porta) · 2 prisão · 3 regime que prende e mata. */
  risco: readonly (readonly [number, number, 0 | 1 | 2 | 3])[];
  /** Quem podia participar sem ser do grupo (os aliados). Ausente: qualquer um. */
  quem?: QuemPesa;
  fonte: string;
}

/** O pacote social de um país (o Brasil em `sociedadeBR`; os outros no pacote de época). */
export interface SociedadeDaEra {
  barreiras: readonly BarreiraDaEpoca[];
  reformas: readonly ReformaDaEpoca[];
  movimentos: readonly MovimentoDaEpoca[];
  /** Os partidos da época com a linha de cada um (fora do Brasil; o Brasil em `partidos`). */
  partidos?: readonly PartidoDaEpoca[];
}

/** Um partido de outro país, no tempo (o mesmo desenho dos partidos brasileiros) + a linha histórica dele. */
export interface PartidoDaEpoca extends PartidoNoTempo {
  /** A linha do partido na época, em palavras da época e sem juízo ("trabalhista, ligado aos sindicatos"). [F] */
  linha: string;
  /** Períodos em que foi proibido ([de, ate) em anos): não se filia, não concorre. */
  proscrito?: readonly (readonly [number, number])[];
  /** Partido único / sem eleições livres: a filiação existe, a disputa não. */
  unico?: readonly (readonly [number, number])[];
  divisoes?: string[];
  lado?: LadoDaDivisao;
}

/* ------------------------------------------------------------------ O que a vida guarda (o mundo que mudou) */

/** Uma mudança na história, feita nesta continuidade (por você, por quem veio antes, por um movimento). */
export interface AlteracaoDaHistoria {
  reforma: string;
  pais: string;
  /** O mês em que passou a valer. */
  t: number;
  alcance: AlcanceDaReforma;
  /** O estado (divisão) ou o município, quando não é nacional. */
  divisao?: string;
  municipioId?: string;
  /** Quem fez: a pessoa jogada (o nome dela, para a linha do tempo dos herdeiros) ou o movimento. */
  por: 'voce' | 'movimento';
  autor?: string;
  /** Quando nasceu quem fez (para a vida saber se foi ela ou quem veio antes, sem depender do nome). */
  autorNasc?: number;
  /** Quantos anos antes da data real (0 quando veio na hora ou depois; ausente: não aconteceu na história real). */
  antes?: number;
  /** Derrubada depois (tribunal, legislatura seguinte): o mês. */
  revogadaEm?: number;
  porQue?: string;
}

export interface HistoriaDaVida {
  alteracoes: AlteracaoDaHistoria[];
  /** A pressão acumulada de cada movimento (0..100) — de você e de quem você trouxe. */
  pressao: Record<string, number>;
  /** O seu lugar em cada movimento. */
  movimentos: Record<string, { desde: number; papel: 'apoio' | 'militante' | 'organizacao'; anos: number; ultimo?: number }>;
  /** As barreiras já encontradas (a vida conta uma vez). */
  encontros: string[];
  /** Detenções e perseguições sofridas (mês, movimento). */
  detencoes?: { t: number; movimento: string; meses: number }[];
}

let LUGAR: { municipioId?: string; divisao?: string; historia?: HistoriaDaVida } = {};

/** Foi esta pessoa (a jogada agora) quem fez a mudança? */
export const feitaPorEla = (v: Vida, a: AlteracaoDaHistoria) => a.por === 'voce' && (a.autorNasc !== undefined ? a.autorNasc === v.eu.tNasc : a.autor === v.eu.nome);

export function historiaDe(v: Vida): HistoriaDaVida | undefined {
  return v.era?.historia;
}
export function garantirHistoria(v: Vida): HistoriaDaVida {
  const e = v.era!;
  const h = (e.historia ??= { alteracoes: [], pressao: {}, movimentos: {}, encontros: [] });
  // A vida em processamento passa a enxergar a história nova na mesma hora (sem esperar a próxima entrada no motor).
  LUGAR.historia = h;
  return h;
}

/** Save: forma da história (idempotente; malformada vira vazia, saves antigos não ganham nada). */
export function normalizarHistoria(v: Vida): void {
  const h = v.era?.historia as unknown as Record<string, unknown> | undefined;
  if (h === undefined) return;
  if (!h || typeof h !== 'object') { delete v.era!.historia; return; }
  const x = v.era!.historia!;
  x.alteracoes = Array.isArray(x.alteracoes) ? x.alteracoes.filter(a => a && typeof a.reforma === 'string' && typeof a.pais === 'string' && typeof a.t === 'number' && (a.alcance === 'nacional' || a.alcance === 'estadual' || a.alcance === 'municipal')) : [];
  if (!x.pressao || typeof x.pressao !== 'object') x.pressao = {};
  for (const k of Object.keys(x.pressao)) if (typeof x.pressao[k] !== 'number' || !Number.isFinite(x.pressao[k])) delete x.pressao[k];
  if (!x.movimentos || typeof x.movimentos !== 'object') x.movimentos = {};
  for (const k of Object.keys(x.movimentos)) { const m = x.movimentos[k]; if (!m || typeof m.desde !== 'number' || typeof m.anos !== 'number') delete x.movimentos[k]; }
  x.encontros = Array.isArray(x.encontros) ? x.encontros.filter(s => typeof s === 'string') : [];
  if (x.detencoes !== undefined && !Array.isArray(x.detencoes)) delete x.detencoes;
}

/* ------------------------------------------------------------------ O lugar da vida em processamento */

/** Quem entra no motor diz onde a vida está e o que ela já mudou no mundo (`mundo/vida.entrarNaVida`). */
export function definirLugarDaHistoria(historia: HistoriaDaVida | undefined, municipioId?: string, divisao?: string): void {
  LUGAR = { historia, municipioId, divisao };
}
export const divisaoCorrente = () => LUGAR.divisao;

/* ------------------------------------------------------------------ Os pacotes */

export function sociedadeDoPais(pais: string): SociedadeDaEra | undefined {
  return pais === 'BR' ? SOCIEDADE_BR : pacoteDaEra(pais)?.sociedade;
}
export const reformaPorId = (pais: string, id: string) => sociedadeDoPais(pais)?.reformas.find(r => r.id === id);
export const movimentoPorId = (pais: string, id: string) => sociedadeDoPais(pais)?.movimentos.find(m => m.id === id);

/* ------------------------------------------------------------------ A história alternativa: o que vale onde */

/** A alteração alcança o lugar (o país inteiro, o estado, o município)? */
function alcanca(a: AlteracaoDaHistoria, pais: string, divisao?: string, municipioId?: string): boolean {
  if (a.pais !== pais) return false;
  if (a.alcance === 'nacional') return true;
  if (a.alcance === 'estadual') return !!divisao && a.divisao === divisao;
  return !!municipioId && a.municipioId === municipioId;
}

/**
 * A reforma feita NESTA continuidade (por você, por quem veio antes, por um movimento) que vale neste lugar no mês: o mês
 * da mais cedo das que estão de pé. A data real não entra aqui — ela já está na própria barreira (`ate`) e na regra.
 */
export function alteracaoQueVale(r: ReformaDaEpoca, pais: string, h = LUGAR.historia, divisao = LUGAR.divisao, municipioId = LUGAR.municipioId, noMes?: number): number | undefined {
  let t: number | undefined;
  for (const a of h?.alteracoes ?? []) {
    if (a.reforma !== r.id || !alcanca(a, pais, divisao, municipioId)) continue;
    if (a.revogadaEm !== undefined && (noMes === undefined || noMes >= a.revogadaEm)) continue;
    if (t === undefined || a.t < t) t = a.t;
  }
  return t;
}

/** O mês em que a reforma passou a valer aqui: a data real ou a da mudança desta continuidade (a mais cedo). */
export function quandoValeAReforma(r: ReformaDaEpoca, pais: string, h = LUGAR.historia, divisao = LUGAR.divisao, municipioId = LUGAR.municipioId, noMes?: number): number | undefined {
  const real = r.real && (!r.divisoes || (!!divisao && r.divisoes.includes(divisao))) ? r.real[0] * 12 + r.real[1] - 1 : undefined;
  const alt = alteracaoQueVale(r, pais, h, divisao, municipioId, noMes);
  return real === undefined ? alt : alt === undefined ? real : Math.min(real, alt);
}

/** A barreira cai em que mês, aqui: o fim real dela (`ate`) ou a reforma desta continuidade que a derrubou antes. */
export function fimDaBarreira(b: BarreiraDaEpoca, pais: string, h = LUGAR.historia, divisao = LUGAR.divisao, municipioId = LUGAR.municipioId, noMes?: number): number | undefined {
  let fim = b.ate !== undefined ? b.ate * 12 : undefined;
  for (const r of sociedadeDoPais(pais)?.reformas ?? []) {
    if (r.id !== b.reforma && !r.derruba.includes(b.id)) continue;
    const q = alteracaoQueVale(r, pais, h, divisao, municipioId, noMes);
    if (q !== undefined && (fim === undefined || q < fim)) fim = q;
  }
  return fim;
}

/** Uma regra da v3 (`RegraSocial`) derrubada antes por uma reforma desta continuidade (para `sociedade.regraValeEm`). */
export function regraDerrubadaAntes(regraId: string, t: number): boolean {
  const h = LUGAR.historia;
  if (!h?.alteracoes.length) return false;
  const pais = paisHistoricoCorrente();
  const s = sociedadeDoPais(pais);
  if (!s) return false;
  for (const r of s.reformas) {
    if (!r.derruba.includes(regraId)) continue;
    const q = alteracaoQueVale(r, pais, h, LUGAR.divisao, LUGAR.municipioId, t);
    if (q !== undefined && t >= q) return true;
  }
  return false;
}

/** A reforma que cria algo (escola, saúde) vale aqui neste mês? */
export function instituidoAqui(tema: 'escola' | 'saude', t: number): boolean {
  const h = LUGAR.historia;
  if (!h?.alteracoes.length || mesHistoricoCorrente() === null) return false;
  const pais = paisHistoricoCorrente();
  for (const r of sociedadeDoPais(pais)?.reformas ?? []) {
    if (r.institui !== tema) continue;
    const q = alteracaoQueVale(r, pais, h, LUGAR.divisao, LUGAR.municipioId, t);
    // Só o que veio ANTES da data real conta como mudança (depois dela, a série histórica já carrega o efeito).
    const real = r.real ? r.real[0] * 12 + r.real[1] - 1 : Infinity;
    if (q !== undefined && t >= q && t < real) return true;
  }
  return false;
}

/* ------------------------------------------------------------------ A quem pesa */

export const casadaNaEpoca = (v: Vida) => Object.entries(v.vinculos).some(([id, vin]) => vin.romance?.estagio === 'casamento' && !vin.romance.fim && v.pessoas[id]?.vivo !== false);
const CLASSE_NIVEL: Record<string, number> = { vulneravel: 0, trabalhadora: 1, media_baixa: 2, media: 3, alta: 4 };
/** A classe da casa de origem (0..4): o privilégio e a falta dele vêm de onde se nasceu. */
export const nivelDeOrigem = (v: Vida) => CLASSE_NIVEL[v.origem?.classe as string] ?? 2;

export function pesaEm(v: Vida, quem: QuemPesa): boolean {
  switch (quem) {
    case 'mulher': return v.eu.genero === 'feminino';
    case 'mulher_casada': return v.eu.genero === 'feminino' && casadaNaEpoca(v);
    case 'negro': return (v.eu.ancestralidade?.af ?? 0) >= 0.25;
    case 'indigena': return (v.eu.ancestralidade?.am ?? 0) >= 0.5;
    case 'pobre': return nivelDeOrigem(v) <= 1;
    case 'rico': return nivelDeOrigem(v) >= 4;
    case 'mesmo_genero': return Object.entries(v.vinculos).some(([id, vin]) => !!vin.romance && !vin.romance.fim && v.pessoas[id]?.genero === v.eu.genero && v.pessoas[id]?.vivo !== false);
    case 'religioso': { const c = v.crenca14?.atual; return !!c && !['sem_religiao', 'ateismo', 'agnosticismo'].includes(c) && v.crenca14?.pratica === 'regular'; }
    case 'fichado': return !!v.fatos?.['fichado_politico'];
  }
}

/* ------------------------------------------------------------------ O peso agora */

export interface PesoDaBarreira {
  barreira: BarreiraDaEpoca;
  /** Fecha a porta agora. */
  bloqueia: boolean;
  /** O fator na chance agora (1 = nada). */
  fator: number;
  /** A lei já caiu e o que sobra é o costume. */
  residual: boolean;
}

/** Onde a vida está: a divisão (estado) e o lado do país dividido. */
function lugarAgora(): { pais: string; lado: LadoDaDivisao; divisao?: string } {
  return { pais: paisHistoricoCorrente(), lado: ladoHistoricoCorrente(), divisao: LUGAR.divisao };
}

/** O peso de uma barreira no mês, para esta vida (a vigência, a reforma desta continuidade, o resíduo do costume). */
export function pesoDaBarreira(v: Vida, b: BarreiraDaEpoca, t = v.t): PesoDaBarreira | undefined {
  const ano = Math.floor(t / 12);
  const { pais, lado, divisao } = lugarAgora();
  if (ano < b.de || ano > 2025) return undefined;
  if (b.divisoes && (!divisao || !b.divisoes.includes(divisao))) return undefined;
  if (b.lado && b.lado !== lado) return undefined;
  if (!pesaEm(v, b.quem)) return undefined;
  const fim = fimDaBarreira(b, pais, LUGAR.historia, divisao, LUGAR.municipioId, t);
  if (fim === undefined || t < fim) return { barreira: b, bloqueia: !!b.bloqueia, fator: b.bloqueia ? 0 : (b.fator ?? 1), residual: false };
  // Caiu: a lei some no dia; o costume, aos poucos.
  if (!b.residuo) return undefined;
  const passados = (t - fim) / 12;
  if (passados >= b.residuo.anos) return undefined;
  const f = b.residuo.fator + (1 - b.residuo.fator) * (passados / b.residuo.anos);
  return f >= 0.99 ? undefined : { barreira: b, bloqueia: false, fator: f, residual: true };
}

/** As barreiras do domínio que pesam nesta vida agora (só numa vida histórica). */
export function barreirasQuePesam(v: Vida, dominio: DominioDaBarreira, t = v.t): PesoDaBarreira[] {
  if (!v.era || mesHistoricoCorrente() === null) return [];
  const s = sociedadeDoPais(paisHistoricoCorrente());
  if (!s) return [];
  const out: PesoDaBarreira[] = [];
  for (const b of s.barreiras) {
    if (b.dominio !== dominio) continue;
    const p = pesoDaBarreira(v, b, t);
    if (p) out.push(p);
  }
  return out;
}

/** A ocupação está no alvo da barreira? (setor, trilha, id, concurso, nível) */
export function noAlvo(a: AlvoDaBarreira | undefined, oc: { id: string; setor: string; trilha: string; nivel: number; concurso?: boolean }): boolean {
  if (!a) return true;
  if (a.ocupacoes && !a.ocupacoes.includes(oc.id)) return false;
  if (a.setores && !a.setores.includes(oc.setor)) return false;
  if (a.trilhas && !a.trilhas.includes(oc.trilha)) return false;
  if (a.concurso && !oc.concurso) return false;
  if (a.nivelMin !== undefined && oc.nivel < a.nivelMin) return false;
  return true;
}

/**
 * O TRABALHO: o que a época fazia com esta candidatura. `bloqueio` fecha a porta (a lei, a instituição), com o motivo e a
 * alternativa; `fator` multiplica a chance (o costume, a prática; e o privilégio, acima de 1). Vida contemporânea: nada.
 */
export function epocaNaVaga(v: Vida, oc: { id: string; setor: string; trilha: string; nivel: number; concurso?: boolean }): { bloqueio?: PesoDaBarreira; fator: number; pesos: PesoDaBarreira[] } {
  if (!v.era || mesHistoricoCorrente() === null) return { fator: 1, pesos: [] };
  const pesos = barreirasQuePesam(v, 'trabalho').filter(p => noAlvo(p.barreira.alvo, oc));
  const bloqueio = pesos.find(p => p.bloqueia);
  let fator = 1;
  for (const p of pesos) if (!p.bloqueia) fator *= p.fator;
  fator *= redeDeOrigem(v, oc.nivel);
  return { bloqueio, fator, pesos };
}

/** O salário de entrada (a diferença que a lei permitia antes das leis de salário igual). */
export function epocaNoSalario(v: Vida, oc: { id: string; setor: string; trilha: string; nivel: number; concurso?: boolean }): { fator: number; peso?: PesoDaBarreira } {
  const p = barreirasQuePesam(v, 'salario').find(x => noAlvo(x.barreira.alvo, oc));
  return p ? { fator: p.fator, peso: p } : { fator: 1 };
}

/** A FACULDADE: a porta (a lei, a instituição que não aceitava) e a chance (o costume; a classe, pela época). */
export function epocaNaFaculdade(v: Vida): { bloqueio?: PesoDaBarreira; fator: number; pesos: PesoDaBarreira[] } {
  if (!v.era || mesHistoricoCorrente() === null) return { fator: 1, pesos: [] };
  const pesos = barreirasQuePesam(v, 'estudo');
  const bloqueio = pesos.find(p => p.bloqueia);
  let fator = 1;
  for (const p of pesos) if (!p.bloqueia) fator *= p.fator;
  return { bloqueio, fator: fator * classeNaFaculdade(v), pesos };
}

/**
 * A CLASSE NA FACULDADE: quando poucos chegavam ao ensino superior, quase todos eram de famílias com dinheiro — a escola
 * secundária paga, o cursinho, o ano sem trabalhar. Para quem vem de casa pobre, a chance cai tanto mais quanto mais fechada
 * a universidade da época (a taxa de matrícula do país, `taxaDoSuperior`); a família média sente menos; a rica, nada. [A]
 */
export function classeNaFaculdade(v: Vida): number {
  const t = mesHistoricoCorrente();
  if (!v.era || t === null || Math.floor(t / 12) > 2025) return 1;
  const taxa = taxaDoSuperior(paisHistoricoCorrente(), Math.floor(t / 12) + (instituidoAqui('escola', t) ? 10 : 0)) ?? 40;
  const aberta = Math.min(1, taxa / 35);
  const n = nivelDeOrigem(v);
  return n <= 1 ? 0.35 + 0.65 * aberta : n === 2 ? 0.65 + 0.35 * aberta : 1;
}

/** O CRÉDITO: o banco e a lei (a mulher casada sem a assinatura do marido; o bairro marcado em vermelho). */
export function epocaNoCredito(v: Vida): { bloqueio?: PesoDaBarreira; fator: number } {
  const pesos = barreirasQuePesam(v, 'credito');
  const bloqueio = pesos.find(p => p.bloqueia);
  let fator = 1;
  for (const p of pesos) if (!p.bloqueia) fator *= p.fator;
  return { bloqueio, fator };
}

/** A POLÍTICA: quem a época deixava concorrer (o cargo), e o quanto o voto chegava a quem era candidato. */
export function epocaNaPolitica(v: Vida, cargo: string): { bloqueio?: PesoDaBarreira; fator: number } {
  const pesos = barreirasQuePesam(v, 'politica').filter(p => !p.barreira.alvo?.cargos || p.barreira.alvo.cargos.includes(cargo));
  const bloqueio = pesos.find(p => p.bloqueia);
  let fator = 1;
  for (const p of pesos) if (!p.bloqueia) fator *= p.fator;
  return { bloqueio, fator };
}

/**
 * O PRIVILÉGIO DE ORIGEM na vaga: o sobrenome e os contatos da família abriam portas nos postos altos — tanto mais quanto
 * menos gente estudava (a taxa de matrícula no superior da época, `taxaDoSuperior`). E a
 * falta deles fechava. Só numa vida histórica; nos postos de base (nível < 3), nada. [A]
 */
export function redeDeOrigem(v: Vida, nivel: number): number {
  if (!v.era || nivel < 3) return 1;
  const t = mesHistoricoCorrente();
  if (t === null) return 1;
  const ano = Math.floor(t / 12);
  if (ano > 2025) return 1;
  const taxa = taxaDoSuperior(paisHistoricoCorrente(), ano) ?? 30;
  // Quanto mais fechada a sociedade (menos gente no superior), mais pesa o nome: de ±0 (taxa 60%+) a ±35% (taxa 1%).
  const fechada = Math.max(0, Math.min(1, (60 - taxa) / 59));
  const n = nivelDeOrigem(v);
  return n >= 4 ? 1 + 0.35 * fechada : n === 3 ? 1 + 0.15 * fechada : n <= 1 ? 1 - 0.25 * fechada : 1;
}

/**
 * ERAS v3 · QUEM CHEGAVA À UNIVERSIDADE: a taxa bruta de matrícula no ensino superior (% da faixa de idade), por país e ano.
 * APROXIMAÇÃO [A] a partir de Barro & Lee (2013, "A new data set of educational attainment", com as séries longas de 1870 em
 * diante) e da UNESCO UIS (taxa bruta de matrícula no ensino superior, desde 1970); pontos de 10 em 10 anos, interpolados.
 */
const SUPERIOR: Readonly<Record<string, readonly [number, number][]>> = {
  BR: [[1900, 0.5], [1930, 1], [1950, 1.5], [1960, 2], [1970, 5], [1980, 11], [1990, 11], [2000, 16], [2010, 37], [2020, 55]],
  US: [[1900, 2], [1920, 5], [1940, 9], [1950, 15], [1960, 30], [1970, 48], [1980, 53], [1990, 72], [2000, 68], [2010, 90], [2020, 88]],
  GB: [[1900, 1], [1920, 2], [1940, 2.5], [1950, 3.5], [1960, 5], [1970, 14], [1980, 19], [1990, 30], [2000, 58], [2010, 59], [2020, 69]],
  JP: [[1900, 0.5], [1920, 2], [1940, 3], [1950, 5], [1960, 10], [1970, 17], [1980, 31], [1990, 29], [2000, 49], [2010, 58], [2020, 64]],
  DE: [[1900, 1], [1920, 2], [1940, 2], [1950, 4], [1960, 7], [1970, 14], [1980, 26], [1990, 34], [2000, 50], [2010, 57], [2020, 73]],
  AR: [[1945, 4], [1950, 5], [1960, 11], [1970, 14], [1980, 22], [1990, 38], [2000, 53], [2010, 75], [2020, 95]]
};
export function taxaDoSuperior(pais: string, ano: number): number | undefined {
  const s = SUPERIOR[pais];
  if (!s) return undefined;
  if (ano <= s[0][0]) return s[0][1];
  for (let i = 1; i < s.length; i++) if (ano <= s[i][0]) { const [a, x] = s[i - 1], [b, y] = s[i]; return x + (y - x) * (ano - a) / (b - a); }
  return s[s.length - 1][1];
}

/* ------------------------------------------------------------------ Os partidos da época (fora do Brasil) */

const tDe = (x: readonly [number, number]) => x[0] * 12 + x[1] - 1;
export const partidosDaEpocaDoPais = (pais: string): readonly PartidoDaEpoca[] => sociedadeDoPais(pais)?.partidos ?? [];

function noPeriodo(xs: readonly (readonly [number, number])[] | undefined, ano: number): boolean {
  return !!xs?.some(([a, b]) => ano >= a && ano < b);
}
/** O partido existe no mês, e é legal? */
export function partidoAtivoNoMes(p: PartidoDaEpoca, t: number, divisao?: string, lado?: LadoDaDivisao): boolean {
  if (t < tDe(p.de) || (p.ate && t >= tDe(p.ate))) return false;
  if (noPeriodo(p.proscrito, Math.floor(t / 12))) return false;
  if (p.divisoes && divisao && !p.divisoes.includes(divisao)) return false;
  if (p.lado && lado && p.lado !== lado) return false;
  return true;
}
/** Os partidos em que se podia filiar no mês, num país com pacote (fora do Brasil). Vazio: sem pacote, sem partido. */
export function partidosDoMesNoPais(pais: string, t: number, divisao = LUGAR.divisao, lado = ladoHistoricoCorrente()): string[] {
  return partidosDaEpocaDoPais(pais).filter(p => partidoAtivoNoMes(p, t, divisao, lado)).map(p => p.id);
}
/** O partido (de qualquer país com pacote, pelo id). */
export function partidoDaEpoca(id: string): PartidoDaEpoca | undefined {
  const pais = paisHistoricoCorrente();
  return partidosDaEpocaDoPais(pais).find(p => p.id === id) ?? SOCIEDADE_BR.partidos?.find(p => p.id === id);
}
/** Partido único no ano (sem disputa): o partido existe, a eleição livre não. */
export const partidoUnicoNoAno = (p: PartidoDaEpoca, ano: number) => noPeriodo(p.unico, ano);
/** O partido foi proibido neste ano? */
export const proscritoNoAno = (p: PartidoDaEpoca, ano: number) => noPeriodo(p.proscrito, ano);

/* ------------------------------------------------------------------ As reformas possíveis e os movimentos ativos */

/** As reformas que ainda não valem aqui (a pergunta se coloca desde `desde`), para quem tem o cargo de propor. */
export function reformasPendentes(pais: string, t: number, h = LUGAR.historia, divisao = LUGAR.divisao, municipioId = LUGAR.municipioId): ReformaDaEpoca[] {
  const ano = Math.floor(t / 12);
  if (ano > 2025) return [];
  return (sociedadeDoPais(pais)?.reformas ?? []).filter(r => {
    if (ano < r.desde) return false;
    if (r.divisoes && (!divisao || !r.divisoes.includes(divisao))) return false;
    if (r.lado && r.lado !== ladoHistoricoCorrente()) return false;
    const q = quandoValeAReforma(r, pais, h, divisao, municipioId, t);
    if (q !== undefined && t >= q) return false;
    // Uma reforma que só derruba (sem criar nada) perde o sentido quando nada do que ela derruba vale mais aqui.
    return !!r.institui || aindaValeAlgo(r, pais, t, h, divisao, municipioId);
  });
}

/** Alguma barreira ou regra que a reforma derruba ainda vale aqui, no mês? */
function aindaValeAlgo(r: ReformaDaEpoca, pais: string, t: number, h: HistoriaDaVida | undefined, divisao?: string, municipioId?: string): boolean {
  const s = sociedadeDoPais(pais);
  const ano = Math.floor(t / 12), lado = ladoHistoricoCorrente();
  const regras = pais === 'BR' ? REGRAS_BR : pacoteDaEra(pais)?.regras ?? [];
  return r.derruba.some(id => {
    const b = s?.barreiras.find(x => x.id === id);
    if (b) {
      if (ano < b.de || (b.divisoes && (!divisao || !b.divisoes.includes(divisao))) || (b.lado && b.lado !== lado)) return false;
      const fim = fimDaBarreira(b, pais, h, divisao, municipioId, t);
      return fim === undefined || t < fim;
    }
    const g = regras.find(x => x.id === id);
    if (!g) return false;
    if (ano < g.de || (g.ate !== undefined && ano >= g.ate) || (g.divisoes && (!divisao || !g.divisoes.includes(divisao))) || (g.lado && g.lado !== lado)) return false;
    return !regraDerrubadaAntes(id, t);
  });
}

/** Os movimentos em atividade no ano, no lugar. */
export function movimentosAtivos(pais: string, ano: number, divisao = LUGAR.divisao, lado: LadoDaDivisao = ladoHistoricoCorrente()): MovimentoDaEpoca[] {
  if (ano > 2025) return [];
  return (sociedadeDoPais(pais)?.movimentos ?? []).filter(m => ano >= m.de && ano < m.ate && (!m.divisoes || (!!divisao && m.divisoes.includes(divisao))) && (!m.lado || m.lado === lado));
}
/** O risco de participar, no ano (0 livre … 3 regime que prende e mata). */
export function riscoDoMovimento(m: MovimentoDaEpoca, ano: number): 0 | 1 | 2 | 3 {
  let r: 0 | 1 | 2 | 3 = 0;
  for (const [a, b, x] of m.risco) if (ano >= a && ano < b) r = x;
  return r;
}
