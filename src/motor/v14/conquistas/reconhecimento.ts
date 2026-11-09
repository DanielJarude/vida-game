/**
 * VIDA 14 · RECONHECIMENTO PROFISSIONAL — o meio nota quem trabalha bem. A fama da VIDA 13 (`reconhecimento13`) é o
 * PÚBLICO reagindo ao nome; aqui é o PRÓPRIO MEIO: a associação da profissão, a rede de ensino, o conselho, a sociedade
 * científica, a associação comercial. Pela trajetória e pela área (o setor da ocupação; a academia; a empresa ou o
 * negócio de quem é dono), sem certificado inventado:
 *
 *   prêmio e homenagem · reconhecimento por uma descoberta/realização · convite para um evento importante · congresso
 *   (apresentar ou só assistir) · feira do setor (nacional ou internacional) · palestra · entrevista · projeto relevante
 *
 * Cada convite é uma DECISÃO (aceitar ou recusar, com o custo em tempo, estresse e dinheiro dito antes) e cada
 * consequência é real: prestígio no meio (`conquistas14.prestigio`, que `fama.prestigioProfissional` soma), salário
 * (o empregador valoriza), o desempenho, a freguesia do negócio, a reputação da empresa, gente nova na rede de contatos,
 * às vezes uma proposta de trabalho (`oportunidades.novaOportunidade`) ou um pouco de nome (`notoriedade.somarAoNome`).
 *
 * O esporte, a arte e a política ficam de fora: já têm os seus prêmios (palmarés, obras, mandatos). O sorteio é do pass
 * anual próprio, com gerador DERIVADO (`rngDe`), e os conteúdos são `manual` — as vidas que não os vivem seguem iguais.
 */

import type { Vida } from '../../tipos';
import { clamp, rngDe } from '../../rng';
import { idade } from '../../nucleo';
import { ocupacaoOuNula } from '../../dados/ocupacoes';
import { prestigioProfissional } from '../../sistemas/fama';
import { HONRAS14, type HonraDaArea14, type Reconhecimento14, type TipoReconhecimento14 } from '../../dados14/conquistas/catalogo';
import { estadoConquistas14, temObjetivoAtivo14 } from './objetivos';

/** Trilhas da arte e da exposição (já têm os seus prêmios): o meio delas não entra aqui. */
const TRILHAS_FORA = new Set(['cena', 'danca', 'musica', 'orquestra', 'literatura', 'conteudo', 'esporte', 'treino', 'politica']);

const AREA_DO_SETOR: Record<string, string> = {
  saude: 'saude', educacao: 'educacao', tecnologia: 'tecnologia', engenharia: 'engenharia', juridico: 'juridico', financas: 'financas',
  comunicacao: 'comunicacao', criativo: 'criativo', publico: 'publico', seguranca: 'publico', comercio: 'comercio', administrativo: 'comercio',
  industria: 'industria', logistica: 'industria', transporte: 'industria', agro: 'agro',
  alimentacao: 'oficio', beleza: 'oficio', cuidado: 'oficio', construcao: 'oficio', manutencao: 'oficio'
};

export interface PerfilDoMeio14 {
  area: string;
  honra: HonraDaArea14;
  /** O prestígio no meio, 0..100 (o mesmo de `fama.prestigioProfissional`). */
  prestigio: number;
  desempenho: number;
  /** Anos na ocupação de agora (ou no negócio). */
  anos: number;
  nivel: number;
  /** Quem é a pessoa no meio: emprego, dono (negócio/empresa) ou pesquisa. */
  como: 'emprego' | 'dono' | 'academia';
}

function maiorEmpresaAtiva(v: Vida) {
  return (v.financas.empresas ?? []).filter(e => (e.estado === 'operando' || e.estado === 'em_crise') && e.papel !== 'investidor').sort((a, b) => (b.avaliacao ?? 0) - (a.avaliacao ?? 0))[0];
}

/** O meio a que a pessoa pertence agora (ou nada: sem trabalho, preso, criança, esporte/arte/política). */
export function perfilDoMeio14(v: Vida): PerfilDoMeio14 | undefined {
  if (v.morte || v.justica?.prisao || idade(v) < 20 || v.caminhos.politica?.mandato) return undefined;
  const pres = prestigioProfissional(v).valor;
  const ac = v.caminhos.academia;
  if (ac && ac.publicacoes >= 2) return { area: 'academia', honra: HONRAS14.academia, prestigio: pres, desempenho: clamp(50 + ac.publicacoes * 4), anos: Math.max(1, ac.publicacoes), nivel: 3, como: 'academia' };
  const e = v.trabalho.atual;
  const oc = e ? ocupacaoOuNula(e.ocupacaoId) : undefined;
  if (e && oc && !TRILHAS_FORA.has(oc.trilha) && oc.setor !== 'esporte' && e.contrato !== 'eletivo') {
    const area = AREA_DO_SETOR[oc.setor] ?? 'oficio';
    return { area, honra: HONRAS14[area], prestigio: pres, desempenho: e.desempenho, anos: (v.t - e.tInicio) / 12, nivel: oc.nivel, como: 'emprego' };
  }
  const emp = maiorEmpresaAtiva(v);
  const n = v.caminhos.negocio && v.caminhos.negocio.estado !== 'fechado' ? v.caminhos.negocio : undefined;
  if (emp || n) {
    const anos = emp ? (v.t - (emp.tInicio ?? v.t)) / 12 : (v.t - n!.tInicio) / 12;
    const desempenho = emp ? clamp(emp.reputacao) : clamp(n!.clientela);
    return { area: 'negocios', honra: HONRAS14.negocios, prestigio: pres, desempenho, anos, nivel: emp ? 3 : 2, como: 'dono' };
  }
  return undefined;
}

/* ------------------------------------------------------------------ Consequências guardadas */

export const PRESTIGIO_MAXIMO14 = 30;

/** Soma (ou tira) pontos de prestígio no meio — `fama.prestigioProfissional` lê do estado. */
export function somarPrestigio14(v: Vida, n: number): void {
  const st = estadoConquistas14(v);
  st.prestigio = clamp((st.prestigio ?? 0) + n, 0, PRESTIGIO_MAXIMO14);
}

export function registrarReconhecimento14(v: Vida, tipo: TipoReconhecimento14, texto: string, peso: 1 | 2 = 1): void {
  const lista = (estadoConquistas14(v).reconhecimentos ??= []);
  lista.push({ t: v.t, tipo, texto, peso });
  if (lista.length > 40) lista.splice(0, lista.length - 40);
}

export const reconhecimentos14 = (v: Vida): Reconhecimento14[] => v.conquistas14?.reconhecimentos ?? [];

/** O empregador valoriza: o salário sobe (só no emprego; o dono sente na freguesia ou na reputação). */
export function valorizar14(v: Vida, fator: number): string | undefined {
  const e = v.trabalho.atual;
  if (e && perfilDoMeio14(v)?.como === 'emprego') { e.salario = Math.round(e.salario * (1 + fator)); e.desempenho = clamp(e.desempenho + 2); return 'o salário subiu'; }
  const emp = maiorEmpresaAtiva(v);
  if (emp) { emp.reputacao = clamp(emp.reputacao + Math.round(fator * 60)); return `a reputação da ${emp.nome} subiu`; }
  const n = v.caminhos.negocio;
  if (n && n.estado !== 'fechado') { n.clientela = clamp(n.clientela + Math.round(fator * 120)); return 'a freguesia aumentou'; }
  return undefined;
}

/* ------------------------------------------------------------------ O pass anual */

/** A chance de um convite do meio no ano: pelo prestígio e pelo desempenho (e um pouco mais para quem persegue a carreira). */
export function chanceDoMeio14(v: Vida, p: PerfilDoMeio14): number {
  const base = 0.05 + p.prestigio / 350 + Math.max(0, p.desempenho - 60) / 300 + (p.anos >= 5 ? 0.03 : 0);
  const quer = temObjetivoAtivo14(v, 'carreira') || temObjetivoAtivo14(v, 'famoso') || temObjetivoAtivo14(v, 'empresa') ? 1.25 : 1;
  return clamp(base * quer, 0.03, 0.32);
}

/** O peso de um convite pela meta escolhida (a meta só inclina: nunca cria o que a trajetória não sustenta). */
export function pesoPelaMeta14(v: Vida, id: string): number {
  if (/entrevista|palestra/.test(id) && temObjetivoAtivo14(v, 'famoso')) return 2;
  if (/premio|projeto|congresso/.test(id) && temObjetivoAtivo14(v, 'carreira')) return 1.6;
  if (/feira/.test(id) && (temObjetivoAtivo14(v, 'paises') || temObjetivoAtivo14(v, 'empresa'))) return 1.8;
  return 1;
}

/**
 * Silencioso: o prestígio do meio esfria devagar sem novidade (três anos sem nada: −1 por ano); depois, com o gerador
 * derivado, às vezes UM convite do meio (`c14p_*`). A decisão que não cabe agora entra na fila do ano. O catálogo e o
 * `preparar` chegam de cima (sem ciclo entre pacotes) — o mesmo desenho de `reconhecimento13.mundoReage13`.
 */
export function reconhecimentoDoMeio14<C extends { id: string; tipo: string; manual?: boolean; peso?: unknown }, X extends { p: Record<string, { id: string }> }>(
  v: Vida, catalogo: readonly C[], preparar: (c: C, v: Vida, r: ReturnType<typeof rngDe>) => X | null, abrir: (c: C, ctx: X) => boolean
): void {
  if (v.morte) return;
  const st = v.conquistas14;
  if (st?.prestigio && !reconhecimentos14(v).some(x => v.t - x.t < 36)) st.prestigio = Math.max(0, st.prestigio - 1);
  const p = perfilDoMeio14(v);
  if (!p) return;
  const r = rngDe(v.id, 'c14_meio', v.t);
  if (r.next() >= chanceDoMeio14(v, p)) return;
  const lista: { c: C; ctx: X }[] = [];
  for (const c of catalogo) {
    if (!c.manual || !c.id.startsWith('c14p_')) continue;
    const ctx = preparar(c, v, r);
    if (ctx) lista.push({ c, ctx });
  }
  const pick = r.weighted(lista, y => (typeof y.c.peso === 'number' ? y.c.peso : 1) * pesoPelaMeta14(v, y.c.id));
  if (!pick) return;
  if (pick.c.tipo === 'decisao' && v.momento) (v.fila ??= []).push({ id: pick.c.id, t: v.t, papeis: Object.fromEntries(Object.entries(pick.ctx.p).map(([k, x]) => [k, x.id])), prioridade: 1 });
  else abrir(pick.c, pick.ctx);
}
