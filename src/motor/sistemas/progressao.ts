/**
 * PROGRESSÃO VISÍVEL E CAUSAL (REWORK 9 · PROG-01).
 *
 * Ação → alteração real de estado → feedback → consequência → histórico.
 *
 * O motor já mudava as habilidades, as notas, o desempenho, o salário, a saúde.
 * O que faltava era dizer DE ONDE veio cada mudança — sem inventar. Aqui moram:
 *
 *   - a FONTE da prática: quem está fazendo a frente andar neste instante (a
 *     escola, uma atividade da semana, o trabalho, um curso, uma ação do
 *     jogador). Os sistemas não precisam saber: `praticandoPor` marca o trecho
 *     de código, e `frentes.praticar` atribui o que de fato mudou a essa fonte;
 *     o esquecimento (`esquecerFrentes`) e a idade também são fontes, negativas;
 *   - o BALANÇO DO PERÍODO: o quanto cada frente andou, por fonte, desde o
 *     último fechamento de ano (`caminhos.praticaDoPeriodo`);
 *   - a FOTOGRAFIA DO ANO (`v.evolucao`, os últimos oito anos): o valor de cada
 *     frente que mudou, as causas do ano, a nota da escola e do curso, o
 *     desempenho e o salário do trabalho, a reputação no esporte. Pequena: só o
 *     que mudou entra, e as causas, só as que pesam.
 *
 * A tela lê daqui o "antes → agora" e o "porquê", e os testes conferem que o
 * número mostrado é o número que o motor usa (é o mesmo campo).
 */

import type { Dominio, FotoDoAno, Vida } from '../tipos';

/* ------------------------------------------------------------ A fonte da prática */

let fonteAtual = 'outro';

/** Marca a fonte de toda prática que acontecer dentro de `fn` (a escola, `rotina:futebol`, o trabalho, `acao:oficio`…). */
export function praticandoPor<T>(fonte: string, fn: () => T): T {
  const antes = fonteAtual;
  fonteAtual = fonte;
  try { return fn(); } finally { fonteAtual = antes; }
}
export const fonteDaPratica = () => fonteAtual;

/** Soma ao balanço do período o que uma fonte fez com uma frente (positivo: ganhou; negativo: perdeu). */
export function registrarMudancaDeFrente(v: Vida, d: Dominio, fonte: string, delta: number): void {
  if (!delta || !Number.isFinite(delta)) return;
  const p = (v.caminhos.praticaDoPeriodo ??= {});
  const x = (p[d] ??= {});
  x[fonte] = Math.round(((x[fonte] ?? 0) + delta) * 100) / 100;
}

/* ------------------------------------------------------------ A fotografia do ano */

export const ANOS_DE_EVOLUCAO = 8;

/**
 * Fecha o período: fotografa o que se mede (só as frentes que mudaram, com as causas que pesam) e zera o balanço.
 * Chamado uma vez por ano, no fim do processamento (depois de tudo o que pratica e dá nota).
 */
export function fotografarEvolucao(v: Vida): void {
  const ev = (v.evolucao ??= []);
  const anterior = ev[ev.length - 1];
  const frentes: Partial<Record<Dominio, number>> = {};
  for (const [d, f] of Object.entries(v.caminhos.frentes) as [Dominio, NonNullable<Vida['caminhos']['frentes'][Dominio]>][]) {
    const h = Math.round(f.habilidade * 10) / 10;
    if (anterior?.frentes[d] === h) continue;
    frentes[d] = h;
  }
  const causas: FotoDoAno['causas'] = {};
  for (const [d, porFonte] of Object.entries(v.caminhos.praticaDoPeriodo ?? {}) as [Dominio, Record<string, number>][]) {
    const lista = Object.entries(porFonte).filter(([, x]) => Math.abs(x) >= 0.3).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 3);
    if (lista.length) causas[d] = lista.map(([f, x]) => [f, Math.round(x * 10) / 10]);
  }
  const e = v.trabalho.atual;
  const foto: FotoDoAno = {
    t: v.t, frentes,
    ...(Object.keys(causas).length ? { causas } : {}),
    ...(v.educacao.basica && !v.educacao.evadiu ? { escola: v.educacao.basica.desempenho, ...(v.educacao.basica.notas ? { notas: v.educacao.basica.notas } : {}) } : {}),
    ...(v.educacao.matricula && !v.educacao.matricula.trancado ? { curso: v.educacao.matricula.desempenho } : {}),
    ...(e ? { trabalho: { ocupacaoId: e.ocupacaoId, desempenho: Math.round(e.desempenho), salario: e.salario } } : {}),
    ...(v.caminhos.esporte?.fase === 'profissional' ? { esporte: { reputacao: v.caminhos.esporte.reputacao ?? 0, nivel: v.caminhos.esporte.nivel } } : {})
  };
  ev.push(foto);
  if (ev.length > ANOS_DE_EVOLUCAO) ev.splice(0, ev.length - ANOS_DE_EVOLUCAO);
  v.caminhos.praticaDoPeriodo = undefined;
}

/* ------------------------------------------------------------ Leitura */

/** O valor de uma frente numa fotografia (as fotos só guardam o que mudou: volta-se até a última que tem). */
function valorNaFoto(v: Vida, d: Dominio, k: number): number | undefined {
  const ev = v.evolucao ?? [];
  for (let i = k; i >= 0; i--) { const x = ev[i]?.frentes[d]; if (x !== undefined) return x; }
  return undefined;
}

export interface EvolucaoDaFrente {
  d: Dominio;
  /** O valor que o motor usa agora (`caminhos.frentes[d].habilidade`). */
  agora: number;
  /** No fim do ano anterior (a penúltima fotografia), se havia. */
  antes?: number;
  /** A mudança no último ano fechado. */
  delta?: number;
  /** As causas do último ano fechado: [fonte, quanto], da que mais pesou para a que menos pesou. */
  causas: [string, number][];
  /** A série dos anos fotografados (do mais antigo ao mais novo), para desenhar a trajetória. */
  serie: { t: number; valor: number }[];
}

/** Como uma frente andou: o valor de agora, o do ano anterior, a diferença, as causas do ano e a série. */
export function evolucaoDaFrente(v: Vida, d: Dominio): EvolucaoDaFrente | undefined {
  const f = v.caminhos.frentes[d];
  if (!f) return undefined;
  const ev = v.evolucao ?? [];
  const agora = Math.round(f.habilidade * 10) / 10;
  const ult = ev.length - 1;
  const antes = ult >= 1 ? valorNaFoto(v, d, ult - 1) : undefined;
  const fechado = ult >= 0 ? valorNaFoto(v, d, ult) : undefined;
  const serie = ev.map((x, k) => ({ t: x.t, valor: valorNaFoto(v, d, k) })).filter((x): x is { t: number; valor: number } => x.valor !== undefined);
  return {
    d, agora, antes,
    delta: fechado !== undefined && antes !== undefined ? Math.round((fechado - antes) * 10) / 10 : undefined,
    causas: (ev[ult]?.causas?.[d] ?? []) as [string, number][],
    serie
  };
}

/** A nota (desempenho) da escola ou do curso: agora, no ano anterior, a série. */
export function evolucaoDaNota(v: Vida, qual: 'escola' | 'curso'): { agora?: number; antes?: number; serie: { t: number; valor: number }[] } {
  const ev = v.evolucao ?? [];
  const serie = ev.filter(x => x[qual] !== undefined).map(x => ({ t: x.t, valor: x[qual]! }));
  const agora = qual === 'escola' ? v.educacao.basica?.desempenho : v.educacao.matricula?.desempenho;
  return { agora, antes: serie.length >= 2 ? serie[serie.length - 2].valor : undefined, serie };
}

/** O trabalho: desempenho e salário, agora e no ano anterior (no mesmo ofício). */
export function evolucaoDoTrabalho(v: Vida): { desempenho?: [number | undefined, number]; salario?: [number | undefined, number] } {
  const e = v.trabalho.atual;
  if (!e) return {};
  const ev = (v.evolucao ?? []).filter(x => x.trabalho?.ocupacaoId === e.ocupacaoId);
  const ant = ev.length >= 2 ? ev[ev.length - 2].trabalho : undefined;
  return { desempenho: [ant?.desempenho, Math.round(e.desempenho)], salario: [ant?.salario, e.salario] };
}
