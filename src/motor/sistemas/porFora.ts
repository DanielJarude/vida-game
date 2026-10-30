/**
 * REWORK 12.25 — o dinheiro do caminho e a pergunta do rumo, num módulo pequeno, embaixo de tudo o que é do Submundo:
 * `ilicito`, `submundo`, `clandestinos`, `tribunal` e os conteúdos lançam aqui (sem ciclo entre pacotes).
 *
 *   CONTAS   todo dinheiro do caminho entra e sai por aqui, com linha própria no extrato ('por_fora'): o recorrente, o
 *            pontual, os negócios, as encomendas, a parte da organização, os custos e as perdas — uma vez só, sem virar
 *            salário (FIN-12.25-01: antes, ia para "Acontecimentos do ano" ou, pior, para "Compras, viagens e outras escolhas")
 *   RUMO     a pergunta "o que está virando isso" só volta com motivo e com intervalo (NAR-12.25-01)
 */
import type { Envolvimento, Vida } from '../tipos';
import { lancar, medir } from './extrato';
import { pagar } from './dinheiro';

const env = (v: Vida) => v.caminhos.envolvimento;
const ativo = (v: Vida) => { const e = v.caminhos.envolvimento; return !!e && e.parou === undefined; };
const preso = (v: Vida) => !!v.justica?.prisao;

/* ================================================================ contas */

/** De onde vem (ou para onde vai) cada real do caminho — cada um com a sua linha no extrato. */
export type FonteDoCrime = 'recorrente' | 'ocasional' | 'negocios' | 'encomendas' | 'organizacao' | 'investimento' | 'custos' | 'perdas' | 'corrupcao';

export const ROTULO_POR_FORA: Record<FonteDoCrime, string> = {
  recorrente: 'Por fora: o que o caminho rendeu no ano',
  ocasional: 'Por fora: operações e serviços pontuais',
  negocios: 'Por fora: retiradas e vendas dos negócios clandestinos',
  encomendas: 'Por fora: pagamentos por encomendas',
  organizacao: 'Por fora: a parte que veio da organização',
  investimento: 'Por fora: dinheiro posto nos negócios clandestinos',
  custos: 'Por fora: custos do caminho (acertos, mercadoria, gente, dívidas)',
  perdas: 'Por fora: apreensões, confiscos, multas e perdas',
  corrupcao: 'Por fora: dinheiro posto para influenciar a Justiça'
};
const FONTE_DO_ROTULO = Object.fromEntries(Object.entries(ROTULO_POR_FORA).map(([k, x]) => [x, k])) as Record<string, FonteDoCrime>;

/** Entra (positivo) ou sai (negativo) dinheiro do caminho: a conta muda e a linha fica — uma vez só. */
export function movimentoPorFora(v: Vida, fonte: FonteDoCrime, valor: number): void {
  const x = Math.round(valor);
  if (!x) return;
  v.financas.conta += x;
  lancar(v, ROTULO_POR_FORA[fonte], 'por_fora', x);
}

/** Um custo do caminho que pode precisar das aplicações (o `pagar` de sempre), medido e lançado na linha certa. */
export function pagarPorFora(v: Vida, fonte: FonteDoCrime, valor: number): void {
  if (valor <= 0) return;
  medir(v, ROTULO_POR_FORA[fonte], 'por_fora', () => pagar(v, valor));
}

/** O que a Justiça custa (o advogado, a fiança, as custas): despesa, com linha própria — não é "por fora". */
export const ROTULO_JUSTICA = 'Justiça: advogados, fianças e custas';
export function pagarJustica(v: Vida, valor: number): void {
  if (valor <= 0) return;
  medir(v, ROTULO_JUSTICA, 'despesa', () => pagar(v, valor));
}

/** O que entrou e saiu por fora no último ano fechado (e no que está aberto), por fonte — a leitura do painel financeiro. */
export function contasPorFora(v: Vida): { ano: Partial<Record<FonteDoCrime, number>>; aberto: Partial<Record<FonteDoCrime, number>>; totalAno: number } {
  const somar = (linhas: { rotulo: string; tipo: string; conta: number; aplicado: number }[] | undefined) => {
    const out: Partial<Record<FonteDoCrime, number>> = {};
    for (const l of linhas ?? []) {
      if (l.tipo !== 'por_fora') continue;
      const f = FONTE_DO_ROTULO[l.rotulo] ?? (l.conta >= 0 ? 'ocasional' : 'custos');
      out[f] = Math.round((out[f] ?? 0) + l.conta + l.aplicado);
    }
    return out;
  };
  const ano = somar(v.financas.extrato?.linhas);
  return { ano, aberto: somar(v.financas.extratoAberto?.linhas), totalAno: Object.values(ano).reduce((s, x) => s + (x ?? 0), 0) };
}

/* ================================================================ rumo (NAR-12.25-01) */

export type MotivoDoRumo = 'primeiro_ano' | 'investigacao' | 'promocao' | 'perda' | 'familia' | 'proposta_maior' | 'volta';

/** Quando se escolheu o rumo pela última vez (pela pergunta ou pela tela). */
export const ultimoRumo = (e: Envolvimento) => e.rumo?.length ? e.rumo[e.rumo.length - 1].t : undefined;

/**
 * A pergunta do rumo, com motivo. Não volta todo ano: só com um acontecimento que pede pensar, e com intervalo (três
 * anos; dois quando é uma investigação) desde a última escolha — inclusive a feita na tela.
 */
export function pedirRumo(v: Vida, motivo: MotivoDoRumo): boolean {
  const e = env(v);
  if (!e || !ativo(v) || preso(v)) return false;
  const ult = ultimoRumo(e);
  const intervalo = motivo === 'investigacao' ? 24 : 36;
  if (ult !== undefined && v.t - ult < intervalo) return false;
  const perguntado = v.fatos['ilic_rumo_perguntado'];
  if (perguntado !== undefined && v.t - perguntado < intervalo) return false;
  if (motivo === 'primeiro_ano' && v.fatos['ilic_rumo_primeiro'] !== undefined) return false;
  v.fatos['ilic_rumo'] = v.t;
  v.fatos['ilic_rumo_perguntado'] = v.t;
  v.fatos['ilic_rumo_motivo'] = ['primeiro_ano', 'investigacao', 'promocao', 'perda', 'familia', 'proposta_maior', 'volta'].indexOf(motivo);
  if (motivo === 'primeiro_ano') v.fatos['ilic_rumo_primeiro'] = v.t;
  return true;
}
export const MOTIVO_DO_RUMO: MotivoDoRumo[] = ['primeiro_ano', 'investigacao', 'promocao', 'perda', 'familia', 'proposta_maior', 'volta'];

/** Registra a escolha do rumo (a pergunta e a tela gravam aqui). */
export function registrarRumo(v: Vida, escolha: NonNullable<Envolvimento['rumo']>[number]['escolha'], motivo?: string): void {
  const e = env(v);
  if (!e) return;
  (e.rumo ??= []).push({ t: v.t, escolha, ...(motivo ? { motivo } : {}) });
  if (e.rumo.length > 20) e.rumo.splice(0, e.rumo.length - 20);
}

