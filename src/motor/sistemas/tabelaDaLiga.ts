/**
 * HOTFIX 11.5.1 — A TABELA DE CLASSIFICAÇÃO de cada divisão nacional (2 a 4), com os números de uma liga de verdade:
 * jogos, vitórias, empates, derrotas, gols marcados e sofridos, saldo e pontos.
 *
 * Antes, a temporada guardava só a ORDEM de chegada (`ligas.sortearPosicoes`: a força de cada clube + o acaso do ano),
 * e o atleta via só "terminou em 7º". A ordem continua sendo a verdade (é ela que decide acesso, queda e vaga
 * continental, e nada que já funcionava muda); a tabela é jogada DEPOIS, em turno e returno de 20 clubes (380 jogos,
 * gols por Poisson pela diferença de força, o mando de campo), e as linhas resultantes — já ordenadas pelos critérios
 * de desempate — são entregues aos clubes na ordem de chegada. Assim cada linha é coerente por dentro (J = V + E + D,
 * Pts = 3V + E, SG = GP − GC), o campeonato fecha (soma de vitórias = soma de derrotas, gols marcados = sofridos) e a
 * tabela respeita os critérios: pontos, vitórias, saldo, gols marcados.
 *
 * `marca`: o que a vida sabe do próprio clube (os gols que o atleta fez na liga, os que o goleiro sofreu) — a linha do
 * clube nunca fica abaixo disso. O ajuste vai para um clube de baixo da tabela, sem mudar nenhum ponto nem a ordem.
 */
import type { Rng } from '../rng';

/** Uma linha: [clube, J, V, E, D, GP, GC]. Os pontos e o saldo são derivados. */
export type LinhaDaTabela = [string, number, number, number, number, number, number];

export const pontosDaLinha = (l: LinhaDaTabela) => l[2] * 3 + l[3];
export const saldoDaLinha = (l: LinhaDaTabela) => l[5] - l[6];

/** Os critérios de desempate, na ordem em que valem. */
export const CRITERIOS_DE_DESEMPATE = ['pontos', 'vitórias', 'saldo de gols', 'gols marcados'] as const;

/** Negativo: `a` fica acima de `b`. Zero: empate em todos os critérios. */
export const compararLinhas = (a: LinhaDaTabela, b: LinhaDaTabela) =>
  pontosDaLinha(b) - pontosDaLinha(a) || b[2] - a[2] || saldoDaLinha(b) - saldoDaLinha(a) || b[5] - a[5];

/** Um sorteio de Poisson por inversão (um número do gerador por placar). */
function poisson(lambda: number, u: number): number {
  let k = 0, p = Math.exp(-lambda), s = p;
  while (u > s && k < 10) { k++; p *= lambda / k; s += p; }
  return k;
}

/**
 * Joga a tabela de uma divisão. `nomes` é a ordem de chegada (o 1º é o campeão); o gerador é o do país, da divisão e
 * do ano (sempre o mesmo para a mesma temporada). A força de cada clube nos jogos sai da ordem de chegada.
 */
export function jogarTabela(r: Rng, nomes: string[], marca?: { clube: string; gp?: number; gc?: number }): LinhaDaTabela[] {
  const n = nomes.length;
  // A força pela ordem de chegada (o campeão é o melhor do ano) e um pouco de acaso de cada um.
  const f = nomes.map((_, k) => 1.1 * (1 - (2 * k) / Math.max(1, n - 1)) + r.normal() * 0.18);
  const est = nomes.map(() => ({ v: 0, e: 0, d: 0, gp: 0, gc: 0 }));
  for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) {
    if (a === b) continue;
    // `a` em casa: o mando vale um pouco; a diferença de força, bastante (média de ~2,5 gols por jogo).
    const ga = poisson(1.32 * Math.exp(0.45 * (f[a] - f[b])) + 0.12, r.next());
    const gb = poisson(1.08 * Math.exp(0.45 * (f[b] - f[a])), r.next());
    est[a].gp += ga; est[a].gc += gb; est[b].gp += gb; est[b].gc += ga;
    if (ga > gb) { est[a].v++; est[b].d++; } else if (ga < gb) { est[b].v++; est[a].d++; } else { est[a].e++; est[b].e++; }
  }
  const jogos = 2 * (n - 1);
  const linhas = est.map((x, k) => ({ l: ['', jogos, x.v, x.e, x.d, x.gp, x.gc] as LinhaDaTabela, k }))
    // A ordem dos critérios; o empate absoluto fica com quem era mais forte.
    .sort((a, b) => compararLinhas(a.l, b.l) || a.k - b.k)
    .map(({ l }, k) => { l[0] = nomes[k]; return l; });
  if (marca) ajustar(linhas, marca);
  return linhas;
}

/**
 * Garante o mínimo de gols da linha do clube da vida (os gols do atleta, os sofridos pelo goleiro). O excedente sai de
 * um clube de baixo (gols sofridos por ele, ou marcados pelo lanterna) — o campeonato continua fechando — e só vale se
 * a ordem pelos critérios continuar a mesma.
 */
function ajustar(linhas: LinhaDaTabela[], m: { clube: string; gp?: number; gc?: number }): void {
  const i = linhas.findIndex(l => l[0] === m.clube);
  if (i < 0) return;
  const outro = i === linhas.length - 1 ? linhas.length - 2 : linhas.length - 1;
  if (outro < 0) return;
  const antes = linhas.map(l => [...l] as LinhaDaTabela);
  const dgp = Math.max(0, (m.gp ?? 0) - linhas[i][5]);
  if (dgp) { linhas[i][5] += dgp; linhas[outro][6] += dgp; }
  const dgc = Math.max(0, (m.gc ?? 0) - linhas[i][6]);
  if (dgc) { linhas[i][6] += dgc; linhas[outro][5] += dgc; }
  if (!tabelaEmOrdem(linhas)) for (let k = 0; k < linhas.length; k++) linhas[k] = antes[k];
}

/** A tabela está ordenada pelos critérios (ninguém abaixo de quem tem menos)? */
export const tabelaEmOrdem = (linhas: LinhaDaTabela[]) => linhas.every((l, k) => k === 0 || compararLinhas(linhas[k - 1], l) <= 0);

/** Os invariantes de uma tabela fechada (os testes e a auditoria leem). */
export function invariantesDaTabela(linhas: LinhaDaTabela[]): string[] {
  const erros: string[] = [];
  const j0 = linhas[0]?.[1];
  for (const l of linhas) {
    if (l[1] !== l[2] + l[3] + l[4]) erros.push(`${l[0]}: J ≠ V + E + D`);
    if (l[1] !== j0) erros.push(`${l[0]}: número de jogos diferente`);
  }
  const soma = (i: 2 | 3 | 4 | 5 | 6) => linhas.reduce((s, l) => s + l[i], 0);
  if (soma(2) !== soma(4)) erros.push('vitórias ≠ derrotas');
  if (soma(3) % 2) erros.push('empates ímpares');
  if (soma(5) !== soma(6)) erros.push('gols marcados ≠ sofridos');
  if (!tabelaEmOrdem(linhas)) erros.push('fora da ordem dos critérios');
  return erros;
}

/* ------------------------------------------------------------ Os clubes sem nome no catálogo */

const PADROES: Record<string, string[]> = {
  pt: ['Esporte Clube {c}', 'Atlético {c}', '{c} Futebol Clube', 'União {c}', 'Sociedade Esportiva {c}', 'Grêmio {c}'],
  es: ['Club Atlético {c}', 'Deportivo {c}', 'Real {c}', 'Unión {c}', 'Sporting {c}', 'Racing {c}'],
  en: ['{c} Town', '{c} United', '{c} City', '{c} Rovers', '{c} Athletic', '{c} Wanderers'],
  it: ['{c} Calcio', 'AC {c}', 'US {c}', 'Virtus {c}', 'SS {c}'],
  de: ['SV {c}', 'FC {c}', 'VfB {c}', 'SC {c}', 'TSV {c}'],
  fr: ['FC {c}', 'AS {c}', 'Olympique {c}', 'Stade {c}', 'US {c}'],
  xx: ['{c} FC', 'Atlético {c}', '{c} Sporting', 'Estrela {c}', 'Real {c}']
};
const LINGUA: Record<string, keyof typeof PADROES> = { BR: 'pt', PT: 'pt', AO: 'pt', MZ: 'pt', ES: 'es', AR: 'es', MX: 'es', CO: 'es', CL: 'es', UY: 'es', PE: 'es', PY: 'es', BO: 'es', EC: 'es', VE: 'es', CR: 'es', GB: 'en', US: 'en', CA: 'en', AU: 'en', NZ: 'en', IE: 'en', ZA: 'en', NG: 'en', KE: 'en', IT: 'it', DE: 'de', AT: 'de', FR: 'fr', BE: 'fr', MA: 'fr' };

/**
 * O nome de um clube fora do catálogo (as vagas que o catálogo não ocupa): um nome de clube do idioma do país, com uma
 * cidade do país — estável pela vaga (`k`) e pela divisão. A tela os marca como "fora do catálogo".
 */
export function nomeSemCatalogo(pais: string, cidades: readonly string[], nivel: number, k: number, ocupados: Set<string>): string {
  const pad = PADROES[LINGUA[pais] ?? 'xx'];
  let h = 2166136261;
  for (const ch of `${pais}:${nivel}:${k}`) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  h >>>= 0;
  // A cidade de um clube que já existe não empresta o nome (nada de um "Atlético Madri" ao lado do Atlético de Madrid).
  const sem = (c: string) => { const n = c.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().slice(0, 5); return ![...ocupados].some(o => !o.startsWith(SEM_CATALOGO) && o.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(n)); };
  const livres = cidades.filter(sem);
  const lista = livres.length ? livres : cidades.length ? cidades : ['Vila Nova', 'Porto Alto', 'Santa Rita', 'São Jorge'];
  for (let t = 0; t < 12; t++) {
    const nome = pad[(h + t * 7) % pad.length].replace('{c}', lista[(h + t * 13) % lista.length]);
    if (!ocupados.has(nome)) { ocupados.add(nome); return nome; }
  }
  const nome = `${pad[0].replace('{c}', lista[h % lista.length])} ${k + 2}`;
  ocupados.add(nome);
  return nome;
}

/** O nome guardado de um clube fora do catálogo leva este sinal na frente (a tela tira e marca). */
export const SEM_CATALOGO = '~';
