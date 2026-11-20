/**
 * VIDA 18 · AS LOTERIAS DA CAIXA — concursos numerados, sorteios reproduzíveis, conferência por faixa, rateio, acúmulo,
 * bolão.
 *
 *   O CONCURSO    tem número: o primeiro de cada ano é (ano − 2000) × concursos por ano + 1, e a vida acompanha do
 *                 próximo em diante (comprar e ver o sorteio anda um concurso). O sorteio do concurso N é sempre o mesmo
 *                 neste mundo (`rngDe(v.id, 'sorteio18', loteria, N)`): recarregar não muda nada, e o resultado vem
 *                 antes de conferir — nunca depois de olhar o bilhete.
 *   O PAÍS JOGA   a arrecadação do concurso (maior quando acumula) e quantos ganharam cada faixa no Brasil (Poisson pela
 *                 chance exata de cada faixa) saem do mesmo sorteio derivado. O rateio de uma faixa é a parte do prêmio
 *                 bruto dela dividida por todos os ganhadores — os do país e as combinações premiadas da vida.
 *   O ACÚMULO     a faixa principal sem ganhador soma o prêmio dela ao do concurso seguinte. `acumulado(N)` é uma função
 *                 do concurso (refaz os 24 anteriores a partir do valor inicial), e os acertos da vida entram por `topo`.
 *   A APOSTA      com mais dezenas que o mínimo vale por todas as combinações simples que contém: o preço é preço × C(n,k)
 *                 e o prêmio conta, faixa a faixa, quantas dessas combinações acertaram (C(a,j)·C(n−a,k−j)).
 */
import type { Vida } from '../../tipos';
import { rngDe, type Rng } from '../../rng';
import { anoDe } from '../../tempo';
import { dinheiro as fmt } from '../../texto';
import { BOLOES18, LOTERIAS18, PREMIO_BRUTO, TARIFA_BOLAO, VIRADA18, type FaixaLoteria, type LoteriaId } from '../../dados18/apostas/loterias18';
import { clubesDoPais } from '../../dados/clubes';
import { estadoApostas18, type Bilhete18, type ResultadoDoBilhete } from './estado18';
import { rodadaDoConcurso, resultadoDoJogo } from './esportivas18';

/* ================================================================== Combinatória */

export function comb(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  k = Math.min(k, n - k);
  let r = 1;
  for (let i = 1; i <= k; i++) r = r * (n - k + i) / i;
  return Math.round(r);
}
/** A chance de uma aposta simples acertar exatamente `j` (sorteio de `d` em `N`, marcando `k`). */
export const chanceDaFaixa = (N: number, d: number, k: number, j: number) => comb(d, j) * comb(N - d, k - j) / comb(N, k);
/** Quantas combinações simples (de `k`) uma aposta de `n` dezenas com `a` acertos tem com exatamente `j` acertos. */
export const combinacoesCom = (n: number, a: number, k: number, j: number) => comb(a, j) * comb(n - a, k - j);
/** O preço de uma aposta de `n` dezenas. */
export function precoDaAposta(l: LoteriaId, n: number): number {
  const L = LOTERIAS18[l];
  if (l === 'lotomania') return L.preco;
  // Super Sete: a surpresinha põe os números a mais um por coluna (cada coluna com dois dobra as apostas simples).
  if (l === 'supersete') return Math.round(L.preco * 2 ** Math.max(0, Math.min(7, n - 7)) * 3 ** Math.max(0, n - 14) / (n > 14 ? 2 ** (n - 14) : 1) * 100) / 100;
  return Math.round(L.preco * comb(n, L.min) * 100) / 100;
}
/** VIDA 29 · as apostas simples de UM jogo (com os extras): o Super Sete multiplica coluna a coluna; a +Milionária, dezenas × trevos. */
export function apostasSimples(l: LoteriaId, jogo: number[], extra?: number[]): number {
  const L = LOTERIAS18[l];
  if (l === 'lotomania') return 1;
  if (L.colunas) return Array.from({ length: L.colunas.n }, (_, c) => jogo.filter(x => Math.floor(x / 10) === c).length).reduce((a, b) => a * Math.max(1, b), 1);
  const base = comb(jogo.length, L.min);
  return L.extra?.tipo === 'trevo' ? base * comb(extra?.length ?? L.extra.min, L.extra.sorteia) : base;
}
/** O preço de um jogo marcado no volante (com os extras). */
export const precoDoJogo = (l: LoteriaId, jogo: number[], extra?: number[]) => Math.round(LOTERIAS18[l].preco * apostasSimples(l, jogo, extra) * 100) / 100;

/** VIDA 29 · a chave de uma faixa (os acertos e o sorteio; a +Milionária e o time do coração têm a sua). */
export const chaveDe = (f: FaixaLoteria) => f.chave ?? `${f.acertos}${f.sorteio ? `:${f.sorteio}` : ''}`;
/** A chance de uma aposta simples cair na faixa (a hipergeométrica das dezenas; as colunas; os trevos; o extra sozinho). */
export function chanceDaFaixaDe(l: LoteriaId, f: FaixaLoteria): number {
  const L = LOTERIAS18[l];
  if (l === 'loteca') return f.acertos === 14 ? 1 / 1_300_000 : 1 / 22_000;
  if (f.soExtra && L.extra) return L.extra.sorteia / L.extra.universo;
  if (L.colunas) return comb(L.colunas.n, f.acertos) * 0.1 ** f.acertos * 0.9 ** (L.colunas.n - f.acertos);
  const p = chanceDaFaixa(L.universo, L.sorteia, L.min, f.acertos);
  if (f.extras && L.extra) return p * f.extras.reduce((s, t) => s + chanceDaFaixa(L.extra!.universo, L.extra!.sorteia, L.extra!.sorteia, t), 0);
  return p;
}
/** O nome do extra sorteado (o time, o mês, o trevo). */
export function nomeDoExtra(l: LoteriaId, x: number): string {
  if (l === 'timemania') return timesDaTimemania()[x - 1] ?? `time ${x}`;
  if (l === 'diadesorte') return ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'][x - 1] ?? String(x);
  return `trevo ${x}`;
}
/** Os 80 clubes da Timemania (os do país no catálogo de clubes, em ordem estável; completados por número se faltarem). */
export function timesDaTimemania(): string[] {
  const xs = [...new Set(clubesDoPais('BR').map(c => c.nome.replace(/^~/, '')))].slice(0, 80);
  while (xs.length < 80) xs.push(`Clube ${xs.length + 1}`);
  return xs;
}
export function precoDaLoteca(palpites: ('1' | 'X' | '2')[][]): number { return Math.round(LOTERIAS18.loteca.preco * combinacoesLoteca(palpites) * 100) / 100; }
export const combinacoesLoteca = (palpites: ('1' | 'X' | '2')[][]) => palpites.reduce((s, p) => s * Math.max(1, p.length), 1);

function poisson(r: Rng, lambda: number): number {
  if (lambda <= 0) return 0;
  if (lambda > 60) return Math.max(0, Math.round(lambda + r.normal() * Math.sqrt(lambda)));
  let k = 0, p = Math.exp(-lambda), s = p;
  const u = r.next();
  while (u > s && k < 400) { k++; p *= lambda / k; s += p; }
  return k;
}

/* ================================================================== O calendário de concursos */

export const primeiroDoAno = (l: LoteriaId, ano: number) => (ano - 2000) * LOTERIAS18[l].porAno + 1;
/** VIDA 19: a Mega da Virada é o último concurso da Mega-Sena de cada ano. */
export const viradaDoAno = (ano: number) => primeiroDoAno('mega', ano + 1) - 1;
export const ehVirada = (l: LoteriaId, n: number) => l === 'mega' && (n - 1) % LOTERIAS18.mega.porAno === LOTERIAS18.mega.porAno - 1;
export const anoDoConcurso = (l: LoteriaId, n: number) => 2000 + Math.floor((n - 1) / LOTERIAS18[l].porAno);

const cacheReserva = new Map<string, number>();
/** A reserva da Virada do ano: 10% do prêmio bruto de cada concurso regular da Mega do ano (estável). */
export function reservaDaVirada(v: Vida, ano: number): number {
  const k = `${v.id}:${ano}`;
  const ja = cacheReserva.get(k);
  if (ja !== undefined) return ja;
  let soma = 0;
  const ini = primeiroDoAno('mega', ano);
  // A arrecadação dos concursos regulares (sem refazer o acúmulo de cada um: a arrecadação pesa pelo acúmulo médio).
  for (let n = ini; n < viradaDoAno(ano); n++) soma += LOTERIAS18.mega.arrecadacao * (0.85 + rngDe(v.id, 'nacional18', 'mega', n).next() * 0.3) * 1.6 * PREMIO_BRUTO * VIRADA18.reserva;
  const x = Math.round(soma / 1000) * 1000;
  if (cacheReserva.size > 200) cacheReserva.clear();
  cacheReserva.set(k, x);
  return x;
}
/** O próximo concurso para a vida: o que ela acompanha, mas nunca um de ano que já passou. */
export function proximoConcurso(v: Vida, l: LoteriaId): number {
  const e = v.apostas18;
  const base = primeiroDoAno(l, anoDe(v.t));
  return Math.max(base, e?.proximo[l] ?? base);
}
/** Os concursos deste ano acabaram? (A vida acompanhou todos os do calendário.) */
export const concursosDoAnoAcabaram = (v: Vida, l: LoteriaId) => proximoConcurso(v, l) >= primeiroDoAno(l, anoDe(v.t) + 1);

/* ================================================================== O que o país joga (estável por concurso) */

export interface Nacional { arrecadacao: number; acumulado: number; ganhadores: Record<string, number> }

const chaveDaFaixa = (acertos: number, sorteio?: 1 | 2) => `${acertos}${sorteio ? `:${sorteio}` : ''}`;

/** O acúmulo que o concurso N leva para a faixa principal (refeito a partir dos 24 anteriores). */
export function acumulado(v: Vida, l: LoteriaId, n: number): number {
  const L = LOTERIAS18[l];
  // A Virada não leva o acúmulo da Mega: leva a reserva do ano (e o seu prêmio não acumula para ninguém).
  if (ehVirada(l, n)) return reservaDaVirada(v, anoDoConcurso(l, n));
  let j = L.inicial * (0.6 + rngDe(v.id, 'acum18', l, n - 24).next() * 0.8);
  const topo = new Set(v.apostas18?.topo[l] ?? []);
  for (let k = n - 24; k < n; k++) {
    if (ehVirada(l, k)) continue;
    const nac = nacionalSem(v, l, k, j);
    // A faixa principal é a primeira de cada loteria (a sena, os 15, os 7, o 6+2...).
    const topoPct = L.faixas[0].pct ?? 0;
    const saiu = (nac.ganhadores[chaveDe(L.faixas[0])] ?? 0) > 0 || topo.has(k);
    j = saiu ? L.inicial * (0.8 + rngDe(v.id, 'acum18', l, k).next() * 0.4) : j + nac.arrecadacao * PREMIO_BRUTO * topoPct;
  }
  return Math.round(j / 1000) * 1000;
}

/** A arrecadação e os ganhadores do país num concurso (dado o acumulado que ele leva). */
function nacionalSem(v: Vida, l: LoteriaId, n: number, acum: number): Nacional {
  const L = LOTERIAS18[l];
  const r = rngDe(v.id, 'nacional18', l, n);
  const virada = ehVirada(l, n);
  const arrecadacao = Math.round(L.arrecadacao * (0.85 + r.next() * 0.3) * (virada ? VIRADA18.arrecadacao : 1 + Math.min(4, acum / (L.arrecadacao * 2.5))));
  const apostas = arrecadacao / L.preco;
  const ganhadores: Record<string, number> = {};
  for (const f of L.faixas) {
    const p = chanceDaFaixaDe(l, f);
    ganhadores[chaveDe(f)] = poisson(r, apostas * p * (l === 'loteca' ? 0.55 + r.next() * 0.9 : 1));
  }
  return { arrecadacao, acumulado: acum, ganhadores };
}
export function nacional(v: Vida, l: LoteriaId, n: number): Nacional { return nacionalSem(v, l, n, acumulado(v, l, n)); }

/** A estimativa de prêmio da faixa principal do concurso (o que o cartaz da lotérica anuncia). */
export function premioEstimado(v: Vida, l: LoteriaId, n: number): number {
  const L = LOTERIAS18[l];
  const nac = nacional(v, l, n);
  if (ehVirada(l, n)) return Math.round((nac.acumulado + nac.arrecadacao * PREMIO_BRUTO) * VIRADA18.sena / 1000) * 1000;
  const pct = L.faixas[0].pct ?? 0;
  return Math.round((nac.acumulado + nac.arrecadacao * PREMIO_BRUTO * pct * (l === 'lotofacil' ? 0.35 : 1)) / 1000) * 1000;
}

/* ================================================================== O sorteio */

function embaralhar(r: Rng, n: number, doZero: boolean): number[] {
  const b = Array.from({ length: n }, (_, k) => k + (doZero ? 0 : 1));
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r.next() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}
/** O sorteio do concurso (as dezenas em ordem crescente; a Dupla Sena tem o segundo). Estável neste mundo. */
export type Sorteio18 = { a: number[]; b?: number[]; extra?: number[]; resultados?: ('1' | 'X' | '2')[] };
export function sorteioDoConcurso(v: Vida, l: LoteriaId, n: number): Sorteio18 {
  const L = LOTERIAS18[l];
  if (l === 'loteca') return { a: [], resultados: rodadaDoConcurso(v, n).jogos.map((_, k) => resultadoDoJogo(v, n, k).res) };
  const r = rngDe(v.id, 'sorteio18', l, n);
  // Super Sete: um algarismo por coluna (codificado coluna × 10 + algarismo, como no volante).
  if (L.colunas) return { a: Array.from({ length: L.colunas.n }, (_, c) => c * 10 + Math.floor(r.next() * 10)) };
  const a = embaralhar(r, L.universo, !!L.doZero).slice(0, L.sorteia).sort((x, y) => x - y);
  const b = L.duasVezes ? embaralhar(r, L.universo, false).slice(0, L.sorteia).sort((x, y) => x - y) : undefined;
  const extra = L.extra ? embaralhar(r, L.extra.universo, false).slice(0, L.extra.sorteia).sort((x, y) => x - y) : undefined;
  return { a, ...(b ? { b } : {}), ...(extra ? { extra } : {}) };
}

/** Quantas combinações premiadas um bilhete tem em cada faixa (antes do rateio). */
export function conferir(b: Pick<Bilhete18, 'loteria' | 'jogos' | 'palpites' | 'extras'>, s: Sorteio18): Record<string, number> {
  const L = LOTERIAS18[b.loteria];
  const out: Record<string, number> = {};
  if (b.loteria === 'loteca') {
    // O polinômio dos acertos: em cada jogo, 1 jeito de acertar (se o palpite cobre o resultado) e o resto de errar.
    let poli = [1];
    b.palpites!.forEach((p, k) => {
      const acerta = p.includes(s.resultados![k]) ? 1 : 0;
      const erra = p.length - acerta;
      const novo = new Array(poli.length + 1).fill(0);
      poli.forEach((c, i) => { novo[i] += c * erra; novo[i + 1] += c * acerta; });
      poli = novo;
    });
    for (const f of L.faixas) out[chaveDaFaixa(f.acertos)] = poli[f.acertos] ?? 0;
    return out;
  }
  b.jogos.forEach((jogo, k) => {
    const extra = b.extras?.[k] ?? [];
    // Super Sete: o polinômio das colunas (em cada uma, os números marcados que acertam e os que erram).
    const poliColunas = L.colunas ? Array.from({ length: L.colunas.n }, (_, c) => c).reduce((poli, c) => {
      const marcados = jogo.filter(x => Math.floor(x / 10) === c);
      const acerta = marcados.filter(x => s.a.includes(x)).length, erra = Math.max(0, marcados.length - acerta);
      const novo = new Array(poli.length + 1).fill(0);
      poli.forEach((q, i) => { novo[i] += q * erra; novo[i + 1] += q * acerta; });
      return novo;
    }, [1] as number[]) : undefined;
    const tA = extra.filter(x => s.extra?.includes(x)).length;
    for (const f of L.faixas) {
      const sorteio = f.sorteio === 2 ? s.b! : s.a;
      const a = jogo.filter(x => sorteio.includes(x)).length;
      let c: number;
      if (poliColunas) c = poliColunas[f.acertos] ?? 0;
      else if (f.soExtra) c = tA > 0 ? comb(jogo.length, L.min) : 0;
      else if (f.extras && L.extra) c = combinacoesCom(jogo.length, a, L.min, f.acertos) * f.extras.reduce((x, t) => x + combinacoesCom(extra.length, tA, L.extra!.sorteia, t), 0);
      else c = b.loteria === 'lotomania' ? (a === f.acertos ? 1 : 0) : combinacoesCom(jogo.length, a, L.min, f.acertos);
      if (c > 0) out[chaveDe(f)] = (out[chaveDe(f)] ?? 0) + c;
    }
  });
  return out;
}

/** O rateio do concurso: o valor de UMA combinação premiada em cada faixa, com as da vida somadas às do país. */
export function rateio(v: Vida, l: LoteriaId, n: number, daVida: Record<string, number>): Record<string, number> {
  const L = LOTERIAS18[l];
  const nac = nacional(v, l, n);
  const bruto = nac.arrecadacao * PREMIO_BRUTO;
  const out: Record<string, number> = {};
  if (ehVirada(l, n)) {
    // A Virada: 90/5/5 sobre a reserva + o prêmio bruto do concurso; sem ganhador numa faixa, o valor desce para a seguinte.
    const total = nac.acumulado + bruto;
    let desce = 0;
    for (const [ac, pct] of [[6, VIRADA18.sena], [5, VIRADA18.quina], [4, VIRADA18.quadra]] as const) {
      const k = chaveDaFaixa(ac);
      const ganh = (nac.ganhadores[k] ?? 0) + (daVida[k] ?? 0);
      const pool = total * pct + desce;
      if (ganh > 0) { out[k] = Math.round(pool / ganh * 100) / 100; desce = 0; } else { out[k] = 0; desce = pool; }
    }
    return out;
  }
  // As faixas de valor fixo (Lotofácil 11–13) saem primeiro; o resto do prêmio bruto vai para as de rateio.
  let fixos = 0;
  for (const f of L.faixas) if (f.fixo) { out[chaveDe(f)] = f.fixo; fixos += f.fixo * ((nac.ganhadores[chaveDe(f)] ?? 0) + (daVida[chaveDe(f)] ?? 0)); }
  const sobra = L.faixas.some(f => f.fixo) ? Math.max(0, bruto - fixos) : bruto;
  for (const f of L.faixas) {
    if (f.fixo) continue;
    const k = chaveDe(f);
    const ganh = (nac.ganhadores[k] ?? 0) + (daVida[k] ?? 0);
    const principal = f === L.faixas[0];
    const pool = sobra * (f.pct ?? 0) + (principal ? nac.acumulado : 0);
    out[k] = ganh > 0 ? Math.round(pool / ganh * 100) / 100 : 0;
  }
  return out;
}

/** Sorteia o concurso (se ainda não) e confere os bilhetes da vida nele: credita os prêmios UMA vez. */
export function apurarConcurso(v: Vida, l: LoteriaId, n: number): { bilhetes: Bilhete18[]; sorteio: ReturnType<typeof sorteioDoConcurso>; premio: number } {
  const e = estadoApostas18(v);
  const seus = e.bilhetes.filter(b => b.loteria === l && b.concurso === n);
  const s = sorteioDoConcurso(v, l, n);
  const pendentes = seus.filter(b => !b.resultado);
  // As combinações premiadas de todos os bilhetes da vida no concurso (um bolão conta inteiro: as outras cotas são de outros apostadores, mas a aposta é uma só).
  const daVida: Record<string, number> = {};
  const porBilhete = seus.map(b => conferir(b, s));
  porBilhete.forEach(x => { for (const k of Object.keys(x)) daVida[k] = (daVida[k] ?? 0) + x[k]; });
  const valor = rateio(v, l, n, daVida);
  let premio = 0;
  const L = LOTERIAS18[l];
  pendentes.forEach(b => {
    const x = porBilhete[seus.indexOf(b)];
    const faixas = L.faixas.map(f => { const k = chaveDe(f); const c = x[k] ?? 0; return { nome: f.nome, combinacoes: c, valor: Math.round(c * (valor[k] ?? 0) * 100) / 100 }; }).filter(f => f.combinacoes > 0);
    let total = faixas.reduce((s2, f) => s2 + f.valor, 0);
    if (b.bolao) total = Math.round(total * b.bolao.minhas / b.bolao.cotas * 100) / 100;
    const res: ResultadoDoBilhete = { sorteio: s.a, ...(s.b ? { sorteio2: s.b } : {}), ...(s.extra ? { sorteioExtra: s.extra } : {}), ...(s.resultados ? { resultados: s.resultados } : {}), premio: total, faixas };
    b.resultado = res;
    premio += total;
    if (faixas.some(f => f.nome === L.faixas[0].nome)) (e.topo[l] ??= []).push(n);
  });
  return { bilhetes: pendentes, sorteio: s, premio: Math.round(premio * 100) / 100 };
}

/* ================================================================== Validação e surpresinha */

export function validarJogo(l: LoteriaId, jogo: number[], extra?: number[]): string | undefined {
  const L = LOTERIAS18[l];
  if (l === 'loteca') return undefined;
  if (new Set(jogo).size !== jogo.length) return 'Os números precisam ser diferentes.';
  if (L.colunas) {
    if (jogo.some(x => !Number.isInteger(x) || x < 0 || x >= L.colunas!.n * 10)) return 'Cada número é um algarismo (0 a 9) de uma das sete colunas.';
    for (let c = 0; c < L.colunas.n; c++) {
      const m = jogo.filter(x => Math.floor(x / 10) === c).length;
      if (m < 1) return `Marque ao menos um número em cada coluna (falta a ${c + 1}ª).`;
      if (m > L.colunas.porColuna) return `No máximo ${L.colunas.porColuna} números por coluna.`;
    }
    if (jogo.length > L.max) return `No máximo ${L.max} números.`;
    return undefined;
  }
  if (L.extra) {
    const e = extra ?? [];
    if (new Set(e).size !== e.length || e.some(x => !Number.isInteger(x) || x < 1 || x > L.extra!.universo)) return `Escolha ${L.extra.nome === 'trevos' ? 'os trevos (1 a 6)' : `o ${L.extra.nome}`}.`;
    if (e.length < L.extra.min || e.length > L.extra.max) return L.extra.min === L.extra.max ? `Escolha ${L.extra.min === 1 ? `um ${L.extra.nome}` : `${L.extra.min} ${L.extra.nome}`}.` : `Marque de ${L.extra.min} a ${L.extra.max} ${L.extra.nome}.`;
  }
  const lo = L.doZero ? 0 : 1, hi = L.doZero ? L.universo - 1 : L.universo;
  if (new Set(jogo).size !== jogo.length) return 'As dezenas precisam ser diferentes.';
  if (jogo.some(x => !Number.isInteger(x) || x < lo || x > hi)) return `As dezenas vão de ${String(lo).padStart(2, '0')} a ${hi}.`;
  if (jogo.length < L.min || jogo.length > L.max) return L.min === L.max ? `Marque exatamente ${L.min} dezenas.` : `Marque de ${L.min} a ${L.max} dezenas.`;
  return undefined;
}
export function validarLoteca(p: ('1' | 'X' | '2')[][]): string | undefined {
  if (p.length !== 14) return 'São 14 jogos.';
  if (p.some(x => !x.length)) return 'Marque ao menos um palpite em cada jogo.';
  if (combinacoesLoteca(p) < 2) return 'A aposta mínima da Loteca já traz um duplo: marque duas colunas em um jogo.';
  if (combinacoesLoteca(p) > 3 ** 6 * 2 ** 4) return 'Combinações demais para um volante.';
  return undefined;
}
/** A surpresinha: o sistema escolhe as dezenas (estável pelo bilhete). */
export function surpresinha(r: Rng, l: LoteriaId, n = LOTERIAS18[l].min): number[] {
  const L = LOTERIAS18[l];
  if (L.colunas) {
    // Um número por coluna; os a mais, cada um numa coluna diferente (até completar; depois o terceiro).
    const jogo = Array.from({ length: L.colunas.n }, (_, c) => c * 10 + Math.floor(r.next() * 10));
    const ordem = embaralhar(r, L.colunas.n, true);
    for (let k = 0; jogo.length < Math.min(n, L.max); k++) {
      const c = ordem[k % L.colunas.n];
      const livres = Array.from({ length: 10 }, (_, d) => c * 10 + d).filter(x => !jogo.includes(x));
      jogo.push(livres[Math.floor(r.next() * livres.length)]);
    }
    return jogo.sort((a, b) => a - b);
  }
  return embaralhar(r, L.universo, !!L.doZero).slice(0, n).sort((a, b) => a - b);
}
/** VIDA 29 · o extra da surpresinha (o time, o mês, os dois trevos). */
export function surpresinhaExtra(r: Rng, l: LoteriaId, n?: number): number[] | undefined {
  const X = LOTERIAS18[l].extra;
  if (!X) return undefined;
  return embaralhar(r, X.universo, false).slice(0, n ?? X.min).sort((a, b) => a - b);
}

/* ================================================================== O bolão */

export interface Bolao18 { loteria: LoteriaId; concurso: number; jogos: number[][]; extras?: number[][]; palpites?: ('1' | 'X' | '2')[][]; cotas: number; valorCota: number; total: number }

/** O bolão da lotérica para o próximo concurso (os jogos são fixos para o concurso: o mesmo bolão para quem olhar). */
export function bolaoDaLoterica(v: Vida, l: LoteriaId, virada = false): Bolao18 {
  const n = virada && l === 'mega' ? viradaDoAno(anoDe(v.t)) : proximoConcurso(v, l);
  const cfg = BOLOES18[l];
  const r = rngDe(v.id, 'bolao18', l, n);
  if (l === 'loteca') {
    const palpites = Array.from({ length: 14 }, (_, k) => (k < 3 ? ['1', 'X', '2'] : k < 7 ? ['1', 'X'] : [r.pick(['1', 'X', '2'] as const)]) as ('1' | 'X' | '2')[]);
    const total = precoDaLoteca(palpites);
    return { loteria: l, concurso: n, jogos: [[]], palpites, cotas: cfg.cotas, total, valorCota: Math.round(total / cfg.cotas * (1 + TARIFA_BOLAO) * 100) / 100 };
  }
  const jogos = Array.from({ length: cfg.jogos }, () => surpresinha(r, l, cfg.dezenas));
  const extras = LOTERIAS18[l].extra ? jogos.map(() => surpresinhaExtra(r, l)!) : undefined;
  const total = Math.round(jogos.reduce((s, j, k) => s + precoDoJogo(l, j, extras?.[k]), 0) * 100) / 100;
  return { loteria: l, concurso: n, jogos, ...(extras ? { extras } : {}), cotas: cfg.cotas, total, valorCota: Math.round(total / cfg.cotas * (1 + TARIFA_BOLAO) * 100) / 100 };
}

export const textoDoPremio = (valor: number) => (valor > 0 ? `Prêmio: ${fmt(valor)}.` : 'Nenhuma faixa premiada.');
