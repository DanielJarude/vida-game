/**
 * Intenção profissional: três coisas que a vida real separa.
 *
 *   OCUPAÇÃO ATUAL       o que a pessoa faz hoje (`profissao.modoDoTrabalho`)
 *   SITUAÇÃO ECONÔMICA   se o dinheiro paga a vida (`dinheiro.seguranca`)
 *   INTENÇÃO             se ela QUER trabalhar (agora, aqui)
 *
 * "Sem emprego" não é "procurando emprego". Quem juntou o bastante pode
 * escolher não trabalhar: viver do patrimônio, cuidar da família, estudar,
 * fazer outra coisa da vida. E o patrimônio também não apaga a frustração:
 * quem quer voltar a trabalhar e não consegue sente — rico ou não.
 *
 * Fonte única: Trabalho (o título, as ações), Dinheiro (a frase do
 * patrimônio), Você (o que pesa na cabeça e no humor) e os acontecimentos
 * (o desemprego longo, o apoio de quem está perto) leem DAQUI.
 *
 *   Declarada   — o jogador diz (`trabalho.intencao`): voltar a procurar,
 *                 ou deixar de procurar (só com o guardado pagando a vida).
 *                 Mandar currículo também é dizer: a candidatura vira
 *                 intenção de procurar.
 *   Deduzida    — sem declaração: quem tem a vida paga pelo patrimônio (a
 *                 MESMA leitura da tela Dinheiro: "dinheiro deixou de ser a
 *                 preocupação") não está procurando; quem não tem, está —
 *                 a procura é necessidade.
 */

import type { Vida } from '../tipos';
import { idade } from '../nucleo';
import { seguranca } from './dinheiro';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';
import { anoDe } from '../tempo';

/** O patrimônio paga a vida: a mesma régua da tela Dinheiro (`seguranca` folgado). */
export const patrimonioPagaAVida = (v: Vida) => seguranca(v).nivel === 'folgado';

/** O guardado segura a vida por anos (folgado) ou por um bom tempo (seguro): dá para escolher não procurar agora. */
const guardadoSegura = (v: Vida) => { const n = seguranca(v).nivel; return n === 'folgado' || n === 'seguro'; };

/** Sem trabalho e sem nada que ocupe o lugar dele (negócio, pausa de cuidado, aposentadoria, prisão, base, estudo de menor). */
export function semTrabalhoNemOcupacao(v: Vida): boolean {
  if (idade(v) < 18 || v.trabalho.atual || v.justica?.prisao || v.trabalho.pausa || v.trabalho.aposentadoria) return false;
  if (v.caminhos.negocio && v.caminhos.negocio.estado !== 'fechado') return false;
  if (v.caminhos.esporte?.fase === 'base') return false;
  const pol = v.caminhos.politica;
  if (pol && (pol.fase === 'candidato' || pol.fase === 'eleito')) return false;
  return true;
}

/** A declaração vale para ESTE tempo sem trabalho (uma de antes do último emprego não conta). */
function declaracao(v: Vida): Vida['trabalho']['intencao'] {
  const d = v.trabalho.intencao;
  if (!d) return undefined;
  const desde = v.trabalho.desempregadoDesde;
  if (desde !== undefined && d.t < desde) return undefined;
  return d;
}

/** Quer trabalhar (agora)? Declarado, ou deduzido do patrimônio. */
export function querTrabalhar(v: Vida): boolean {
  const d = declaracao(v);
  if (d) return d.quer === 'procurar';
  return !patrimonioPagaAVida(v);
}

export type Intencao = 'procurando' | 'sem_procurar' | 'nao_se_aplica';

export interface LeituraDaIntencao {
  intencao: Intencao;
  /** Desde quando procura (a procura que pesa) — só para quem procura. */
  desde?: number;
  /** O patrimônio paga a vida (a régua da tela Dinheiro). */
  livre: boolean;
  /** O jogador disse (ou a candidatura disse), ou é o que a vida mostra. */
  declarada: boolean;
  /** Em palavras, para Trabalho e Dinheiro. */
  texto: string;
}

export function intencaoProfissional(v: Vida): LeituraDaIntencao {
  const livre = patrimonioPagaAVida(v);
  if (!semTrabalhoNemOcupacao(v)) return { intencao: 'nao_se_aplica', livre, declarada: false, texto: '' };
  const d = declaracao(v);
  if (querTrabalhar(v)) {
    const ini = v.trabalho.desempregadoDesde;
    const desde = d?.quer === 'procurar' ? Math.max(d.t, ini ?? d.t) : ini;
    const texto = livre
      ? 'O dinheiro não é a questão: você quer voltar a trabalhar.'
      : desde !== undefined && v.t - desde >= 24 ? `Procurando trabalho desde ${anoDe(desde)}.` : 'Procurando trabalho.';
    return { intencao: 'procurando', desde, livre, declarada: !!d, texto };
  }
  const texto = livre
    ? 'Sem procurar trabalho, por escolha: o que você juntou paga a vida.'
    : 'Sem procurar trabalho por agora, vivendo do que guardou — enquanto ele durar.';
  return { intencao: 'sem_procurar', livre, declarada: !!d, texto };
}

/** Está, de fato, procurando trabalho (a procura que pesa na cabeça, no humor, na relação). */
export const procurandoTrabalho = (v: Vida) => intencaoProfissional(v).intencao === 'procurando';

/** Meses de procura (para quem procura); 0 para quem não procura. */
export function mesesProcurando(v: Vida): number {
  const l = intencaoProfissional(v);
  return l.intencao === 'procurando' && l.desde !== undefined ? v.t - l.desde : 0;
}

/** Sem trabalho por escolha (o patrimônio, ou o guardado, paga) — há quanto tempo, em meses. */
export function mesesSemProcurar(v: Vida): number {
  const l = intencaoProfissional(v);
  if (l.intencao !== 'sem_procurar') return 0;
  const d = declaracao(v);
  // Quem nunca teve emprego conta desde os 18.
  return v.t - Math.max(d?.t ?? -Infinity, v.trabalho.desempregadoDesde ?? v.t - (idade(v) - 18) * 12);
}

/* ---------------------------------------------------------- Declarar */

export function podeDeclararIntencao(v: Vida, quer: 'procurar' | 'nao_procurar'): Veredito {
  if (!semTrabalhoNemOcupacao(v)) return bloqueio('incompativel', 'Só para quem está sem trabalho.');
  const l = intencaoProfissional(v);
  if (quer === 'procurar') return l.intencao === 'procurando' ? bloqueio('incompativel', 'Você já está procurando.') : PERMITIDO;
  if (l.intencao === 'sem_procurar') return bloqueio('incompativel', 'Você já não está procurando.');
  if (!guardadoSegura(v)) return bloqueio('requisito', 'Sem um guardado que pague a vida, parar de procurar não se sustenta.');
  return PERMITIDO;
}

export function declararIntencao(v: Vida, quer: 'procurar' | 'nao_procurar'): void {
  v.trabalho.intencao = { quer, t: v.t };
}

/** Mandar currículo (ou se inscrever num concurso) também é dizer que quer trabalhar. */
export function registrarProcura(v: Vida): void {
  if (semTrabalhoNemOcupacao(v) && !querTrabalhar(v)) declararIntencao(v, 'procurar');
}
