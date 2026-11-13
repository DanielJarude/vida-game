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
import { BOLOES18, LOTERIAS18, PREMIO_BRUTO, TARIFA_BOLAO, type LoteriaId } from '../../dados18/apostas/loterias18';
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
  return Math.round(L.preco * comb(n, L.min) * 100) / 100;
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
  let j = L.inicial * (0.6 + rngDe(v.id, 'acum18', l, n - 24).next() * 0.8);
  const topo = new Set(v.apostas18?.topo[l] ?? []);
  for (let k = n - 24; k < n; k++) {
    const nac = nacionalSem(v, l, k, j);
    const topoPct = L.faixas.find(f => f.acertos === L.acumula && (f.sorteio ?? 1) === 1)?.pct ?? 0;
    const saiu = (nac.ganhadores[chaveDaFaixa(L.acumula, L.duasVezes ? 1 : undefined)] ?? 0) > 0 || topo.has(k);
    j = saiu ? L.inicial * (0.8 + rngDe(v.id, 'acum18', l, k).next() * 0.4) : j + nac.arrecadacao * PREMIO_BRUTO * topoPct;
  }
  return Math.round(j / 1000) * 1000;
}

/** A arrecadação e os ganhadores do país num concurso (dado o acumulado que ele leva). */
function nacionalSem(v: Vida, l: LoteriaId, n: number, acum: number): Nacional {
  const L = LOTERIAS18[l];
  const r = rngDe(v.id, 'nacional18', l, n);
  const arrecadacao = Math.round(L.arrecadacao * (0.85 + r.next() * 0.3) * (1 + Math.min(4, acum / (L.arrecadacao * 2.5))));
  const apostas = arrecadacao / L.preco;
  const ganhadores: Record<string, number> = {};
  for (const f of L.faixas) {
    let p: number;
    if (l === 'loteca') p = f.acertos === 14 ? 1 / 1_300_000 : 1 / 22_000;
    else p = chanceDaFaixa(L.universo, L.sorteia, L.min, f.acertos);
    ganhadores[chaveDaFaixa(f.acertos, f.sorteio)] = poisson(r, apostas * p * (l === 'loteca' ? 0.55 + r.next() * 0.9 : 1));
  }
  return { arrecadacao, acumulado: acum, ganhadores };
}
export function nacional(v: Vida, l: LoteriaId, n: number): Nacional { return nacionalSem(v, l, n, acumulado(v, l, n)); }

/** A estimativa de prêmio da faixa principal do concurso (o que o cartaz da lotérica anuncia). */
export function premioEstimado(v: Vida, l: LoteriaId, n: number): number {
  const L = LOTERIAS18[l];
  const nac = nacional(v, l, n);
  const pct = L.faixas.find(f => f.acertos === L.acumula && (f.sorteio ?? 1) === 1)?.pct ?? 0;
  return Math.round((nac.acumulado + nac.arrecadacao * PREMIO_BRUTO * pct * (l === 'lotofacil' ? 0.35 : 1)) / 1000) * 1000;
}

/* ================================================================== O sorteio */

function embaralhar(r: Rng, n: number, doZero: boolean): number[] {
  const b = Array.from({ length: n }, (_, k) => k + (doZero ? 0 : 1));
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r.next() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}
/** O sorteio do concurso (as dezenas em ordem crescente; a Dupla Sena tem o segundo). Estável neste mundo. */
export function sorteioDoConcurso(v: Vida, l: LoteriaId, n: number): { a: number[]; b?: number[]; resultados?: ('1' | 'X' | '2')[] } {
  const L = LOTERIAS18[l];
  if (l === 'loteca') return { a: [], resultados: rodadaDoConcurso(v, n).jogos.map((_, k) => resultadoDoJogo(v, n, k).res) };
  const r = rngDe(v.id, 'sorteio18', l, n);
  const a = embaralhar(r, L.universo, !!L.doZero).slice(0, L.sorteia).sort((x, y) => x - y);
  const b = L.duasVezes ? embaralhar(r, L.universo, false).slice(0, L.sorteia).sort((x, y) => x - y) : undefined;
  return { a, ...(b ? { b } : {}) };
}

/** Quantas combinações premiadas um bilhete tem em cada faixa (antes do rateio). */
export function conferir(b: Pick<Bilhete18, 'loteria' | 'jogos' | 'palpites'>, s: { a: number[]; b?: number[]; resultados?: ('1' | 'X' | '2')[] }): Record<string, number> {
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
  for (const jogo of b.jogos) {
    for (const f of L.faixas) {
      const sorteio = f.sorteio === 2 ? s.b! : s.a;
      const a = jogo.filter(x => sorteio.includes(x)).length;
      const c = b.loteria === 'lotomania' ? (a === f.acertos ? 1 : 0) : combinacoesCom(jogo.length, a, L.min, f.acertos);
      if (c > 0) out[chaveDaFaixa(f.acertos, f.sorteio)] = (out[chaveDaFaixa(f.acertos, f.sorteio)] ?? 0) + c;
    }
  }
  return out;
}

/** O rateio do concurso: o valor de UMA combinação premiada em cada faixa, com as da vida somadas às do país. */
export function rateio(v: Vida, l: LoteriaId, n: number, daVida: Record<string, number>): Record<string, number> {
  const L = LOTERIAS18[l];
  const nac = nacional(v, l, n);
  const bruto = nac.arrecadacao * PREMIO_BRUTO;
  const out: Record<string, number> = {};
  // As faixas de valor fixo (Lotofácil 11–13) saem primeiro; o resto do prêmio bruto vai para as de rateio.
  let fixos = 0;
  for (const f of L.faixas) if (f.fixo) { out[chaveDaFaixa(f.acertos)] = f.fixo; fixos += f.fixo * ((nac.ganhadores[chaveDaFaixa(f.acertos)] ?? 0) + (daVida[chaveDaFaixa(f.acertos)] ?? 0)); }
  const sobra = l === 'lotofacil' ? Math.max(0, bruto - fixos) : bruto;
  for (const f of L.faixas) {
    if (f.fixo) continue;
    const k = chaveDaFaixa(f.acertos, f.sorteio);
    const ganh = (nac.ganhadores[k] ?? 0) + (daVida[k] ?? 0);
    const principal = f.acertos === L.acumula && (f.sorteio ?? 1) === 1;
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
    const faixas = L.faixas.map(f => { const k = chaveDaFaixa(f.acertos, f.sorteio); const c = x[k] ?? 0; return { nome: f.nome, combinacoes: c, valor: Math.round(c * (valor[k] ?? 0) * 100) / 100 }; }).filter(f => f.combinacoes > 0);
    let total = faixas.reduce((s2, f) => s2 + f.valor, 0);
    if (b.bolao) total = Math.round(total * b.bolao.minhas / b.bolao.cotas * 100) / 100;
    const res: ResultadoDoBilhete = { sorteio: s.a, ...(s.b ? { sorteio2: s.b } : {}), ...(s.resultados ? { resultados: s.resultados } : {}), premio: total, faixas };
    b.resultado = res;
    premio += total;
    if (faixas.some(f => f.nome === L.faixas[0].nome)) (e.topo[l] ??= []).push(n);
  });
  return { bilhetes: pendentes, sorteio: s, premio: Math.round(premio * 100) / 100 };
}

/* ================================================================== Validação e surpresinha */

export function validarJogo(l: LoteriaId, jogo: number[]): string | undefined {
  const L = LOTERIAS18[l];
  if (l === 'loteca') return undefined;
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
  return embaralhar(r, L.universo, !!L.doZero).slice(0, n).sort((a, b) => a - b);
}

/* ================================================================== O bolão */

export interface Bolao18 { loteria: LoteriaId; concurso: number; jogos: number[][]; palpites?: ('1' | 'X' | '2')[][]; cotas: number; valorCota: number; total: number }

/** O bolão da lotérica para o próximo concurso (os jogos são fixos para o concurso: o mesmo bolão para quem olhar). */
export function bolaoDaLoterica(v: Vida, l: LoteriaId): Bolao18 {
  const n = proximoConcurso(v, l);
  const cfg = BOLOES18[l];
  const r = rngDe(v.id, 'bolao18', l, n);
  if (l === 'loteca') {
    const palpites = Array.from({ length: 14 }, (_, k) => (k < 3 ? ['1', 'X', '2'] : k < 7 ? ['1', 'X'] : [r.pick(['1', 'X', '2'] as const)]) as ('1' | 'X' | '2')[]);
    const total = precoDaLoteca(palpites);
    return { loteria: l, concurso: n, jogos: [[]], palpites, cotas: cfg.cotas, total, valorCota: Math.round(total / cfg.cotas * (1 + TARIFA_BOLAO) * 100) / 100 };
  }
  const jogos = Array.from({ length: cfg.jogos }, () => surpresinha(r, l, cfg.dezenas));
  const total = jogos.reduce((s, j) => s + precoDaAposta(l, j.length), 0);
  return { loteria: l, concurso: n, jogos, cotas: cfg.cotas, total, valorCota: Math.round(total / cfg.cotas * (1 + TARIFA_BOLAO) * 100) / 100 };
}

export const textoDoPremio = (valor: number) => (valor > 0 ? `Prêmio: ${fmt(valor)}.` : 'Nenhuma faixa premiada.');
