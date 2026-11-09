/**
 * VIDA 14 · OBJETIVOS PESSOAIS — o que a pessoa DECIDE perseguir (opcional). Não é o `sistemas/objetivos` (a memória das
 * tentativas, que nasce sozinha de cada devolutiva): aqui o jogador escolhe uma meta de vida — o milhão, a carreira, os
 * países, a fama, a empresa, a independência, a vida tranquila, a casa própria — e o jogo MEDE do estado real, todo ano.
 *
 *   criar      uma meta por tipo, com o alvo escolhido (um milhão ou dez; cinco países ou vinte)
 *   alterar    trocar o alvo no meio do caminho (sem perder a data em que começou)
 *   abandonar  deixar de lado, sem custo nem castigo (fica na lista, com o mais perto que chegou)
 *   concluir   o pass anual vê que a vida chegou lá: uma vez só, uma frase com o contexto (a idade, de onde veio o
 *              dinheiro, qual foi o país, por que o público conhece você) na Linha da Vida, e a retrospectiva lembra
 *
 * Quem não escolhe nada vive igual: nada aqui empurra a vida para um lado. A meta só pesa nas oportunidades do meio
 * (`reconhecimento.ts`: quem quer a carreira recebe um pouco mais de convites; quem quer o mundo, a feira de fora).
 */

import type { Vida } from '../../tipos';
import { clamp } from '../../rng';
import { escrever, idade } from '../../nucleo';
import { anoDe } from '../../tempo';
import { dinheiroCurto, flex } from '../../texto';
import { balanco, orcamento, patrimonio, seguranca } from '../../sistemas/dinheiro';
import { prestigioProfissional } from '../../sistemas/fama';
import { palavraDaNotoriedade } from '../../sistemas/notoriedade';
import { economiaLocal, municipio } from '../../dados/lugares';
import { paisDaVida, paisNatal } from '../../mundo/vida';
import { nomeDoPais } from '../../mundo/registro';
import { catalogoDeViagem } from '../../sistemas/experiencias';
import { marcar } from '../../sistemas/marcas';
import { nomeOcupacaoId } from '../../sistemas/trabalho';
import { bloqueio, PERMITIDO, type Veredito } from '../../plausibilidade';
import { OBJETIVOS14, type Conquistas14, type ModeloObjetivo14, type Objetivo14, type TipoObjetivo14 } from '../../dados14/conquistas/catalogo';

export const modeloObjetivo14 = (tipo: TipoObjetivo14): ModeloObjetivo14 => OBJETIVOS14.find(o => o.id === tipo)!;
export const nomeDoObjetivo14 = (v: Vida, tipo: TipoObjetivo14): string => { const n = modeloObjetivo14(tipo).nome; return flex(v.eu.tratamento ?? v.eu.genero, n[0], n[1], n[2]); };

export const estadoConquistas14 = (v: Vida): Conquistas14 => (v.conquistas14 ??= {});
export const objetivos14 = (v: Vida): Objetivo14[] => v.conquistas14?.objetivos ?? [];
export const objetivosAtivos14 = (v: Vida): Objetivo14[] => objetivos14(v).filter(o => o.estado === 'ativo');
export const temObjetivoAtivo14 = (v: Vida, tipo: TipoObjetivo14) => objetivosAtivos14(v).some(o => o.tipo === tipo);

/** O custo de vida da cidade (a mesma régua de `dinheiro.condicaoEconomica`: "milionário" é por onde se mora). */
const custoLocal = (v: Vida) => Math.max(0.5, economiaLocal(v.moradia.municipioId).custo);

/* ------------------------------------------------------------------ Países conhecidos */

/**
 * Leitura PRÓPRIA e tolerante dos países conhecidos (a frente de viagens expõe `v14/viagens.paisesVisitados`, mas um
 * sistema de outra frente não se importa daqui: lemos o estado que ela guarda, `viagens14.paises`, e completamos):
 * o país onde nasceu, os países onde morou (`mundo.migracoes`) e os destinos de viagem da Linha da Vida (`m_viagem`),
 * cada um resolvido para o país pelo próprio catálogo de viagens. Destino que não se resolve não conta (nunca inventa).
 */
const indicePorPais = new Map<string, Map<string, string>>();
function paisDoDestino(v: Vida, destino: string): string | undefined {
  const aqui = paisDaVida(v);
  let idx = indicePorPais.get(aqui);
  if (!idx) {
    idx = new Map();
    try { for (const g of catalogoDeViagem(v, 'viagem_exterior').grupos) for (const l of g.lugares) idx.set(l.nome, g.nome); } catch { /* catálogo indisponível: só o que se resolve */ }
    indicePorPais.set(aqui, idx);
  }
  return idx.get(destino);
}

export function paisesConhecidos14(v: Vida): string[] {
  const nomes = new Set<string>();
  const nome = (id: string) => { try { return nomeDoPais(id); } catch { return undefined; } };
  // `viagens14.paises` (ISO → primeira vez): o registro da frente de viagens da VIDA 14, lido do estado (sem importar o módulo).
  for (const id of [paisNatal(v), paisDaVida(v), ...(v.mundo?.migracoes ?? []).flatMap(m => [m.de, m.para]), ...Object.keys(v.viagens14?.paises ?? {})]) { const n = id && nome(id); if (n) nomes.add(n); }
  for (const e of v.biografia) {
    if (e.fato?.tipo !== 'm_viagem') continue;
    const d = e.fato.dados.destino;
    const p = typeof d === 'string' ? paisDoDestino(v, d) : undefined;
    if (p) nomes.add(p);
  }
  return [...nomes];
}

/* ------------------------------------------------------------------ A medida */

export interface Progresso14 {
  /** 0..1 (1 = chegou). */
  fracao: number;
  /** "R$ 420 mil de R$ 1,2 mi", "3 de 10 países". */
  texto: string;
  /** O que está pesando agora (uma frase curta), quando ajuda. */
  detalhe?: string;
}

/** O valor-alvo em dinheiro (milhões × o custo local). */
export const alvoEmDinheiro14 = (v: Vida, o: Pick<Objetivo14, 'alvo'>) => o.alvo * 1_000_000 * custoLocal(v);

function maiorEmpresa(v: Vida) {
  return (v.financas.empresas ?? []).filter(e => e.estado !== 'encerrada' && e.papel !== 'investidor').sort((a, b) => (b.avaliacao ?? 0) - (a.avaliacao ?? 0))[0];
}

/** A renda do patrimônio (aluguéis, dividendos, rendimentos) e o custo de vida do mês. */
export function rendaPassiva14(v: Vida): { passiva: number; custo: number } {
  const o = orcamento(v);
  return { passiva: Math.round(o.entradas.filter(l => l.de === 'patrimonio').reduce((s, l) => s + l.valor, 0)), custo: Math.max(1, Math.round(o.despesa)) };
}

/** Este ano está tranquilo? (a régua da "vida tranquila", dita na tela) */
export function anoTranquilo14(v: Vida): { ok: boolean; porque?: string } {
  if (v.justica?.prisao) return { ok: false, porque: 'a prisão' };
  if (v.mente.estresse > 40) return { ok: false, porque: 'o estresse alto' };
  if (v.corpo.saude < 55) return { ok: false, porque: 'a saúde abalada' };
  const n = seguranca(v).nivel;
  if (n === 'no_vermelho' || n === 'apertado') return { ok: false, porque: 'o aperto no dinheiro' };
  return { ok: true };
}

export function progresso14(v: Vida, o: Objetivo14): Progresso14 {
  switch (o.tipo) {
    case 'milionario': {
      const alvo = alvoEmDinheiro14(v, o);
      const pat = patrimonio(v);
      return { fracao: clamp(pat / alvo, 0, 1), texto: `${dinheiroCurto(Math.max(0, pat))} de ${dinheiroCurto(alvo)}` };
    }
    case 'carreira': {
      const p = prestigioProfissional(v);
      return { fracao: clamp(p.valor / o.alvo, 0, 1), texto: `prestígio ${p.valor} de ${o.alvo}`, ...(p.por ? { detalhe: `O seu maior prestígio hoje é ${p.por}.` } : { detalhe: 'Ainda sem nome no meio.' }) };
    }
    case 'paises': {
      const ps = paisesConhecidos14(v);
      return { fracao: clamp(ps.length / o.alvo, 0, 1), texto: `${ps.length} de ${o.alvo} países`, detalhe: ps.length ? `Até agora: ${ps.slice(0, 6).join(', ')}${ps.length > 6 ? '…' : ''}.` : undefined };
    }
    case 'famoso': {
      const n = Math.round(v.notoriedade?.valor ?? 0);
      return { fracao: clamp(n / o.alvo, 0, 1), texto: `${palavraDaNotoriedade(v)} (${n} de ${o.alvo})` };
    }
    case 'empresa': {
      const e = maiorEmpresa(v);
      const alvo = alvoEmDinheiro14(v, o);
      const val = e ? Math.max(0, e.avaliacao ?? 0) : 0;
      return { fracao: clamp(val / alvo, 0, 1), texto: e ? `${e.nome}: ${dinheiroCurto(val)} de ${dinheiroCurto(alvo)}` : `nenhuma empresa ainda (a meta: ${dinheiroCurto(alvo)})` };
    }
    case 'independencia': {
      const { passiva, custo } = rendaPassiva14(v);
      return { fracao: clamp(passiva / (custo * o.alvo), 0, 1), texto: `${dinheiroCurto(passiva)} por mês do patrimônio; a vida custa ${dinheiroCurto(custo)}` };
    }
    case 'tranquila': {
      const s = o.serie ?? 0;
      const agora = anoTranquilo14(v);
      return { fracao: clamp(s / o.alvo, 0, 1), texto: `${s} de ${o.alvo} anos seguidos`, detalhe: agora.ok ? 'Por agora, a vida está tranquila.' : `Por agora, pesa ${agora.porque}.` };
    }
    case 'casa_propria': {
      const ok = v.moradia.tipo === 'propria';
      return { fracao: ok ? 1 : 0, texto: ok ? 'mora no que é seu' : v.financas.bens.some(b => b.tipo === 'imovel') ? 'tem imóvel, mas não mora nele' : 'ainda não' };
    }
  }
}

/* ------------------------------------------------------------------ Criar, alterar, abandonar */

export type OqueObjetivo14 =
  | { op: 'criar'; tipo: TipoObjetivo14; alvo: number }
  | { op: 'alterar'; id: string; alvo: number }
  | { op: 'abandonar'; id: string };

export function disponibilidadeObjetivo14(v: Vida, a: OqueObjetivo14): Veredito {
  if (a.op === 'criar') {
    const m = OBJETIVOS14.find(o => o.id === a.tipo);
    if (!m) return bloqueio('impossivel', 'Esse objetivo não existe.');
    if (idade(v) < m.idade) return bloqueio('requisito', `A partir dos ${m.idade} anos.`);
    if (!m.alvos.some(x => x.valor === a.alvo)) return bloqueio('impossivel', 'Essa meta não existe.');
    if (temObjetivoAtivo14(v, a.tipo)) return bloqueio('incompativel', 'Esse objetivo já está na sua lista: dá para mudar a meta dele.');
    if (progresso14(v, { id: '', tipo: a.tipo, alvo: a.alvo, t: v.t, estado: 'ativo' }).fracao >= 1 && a.tipo !== 'tranquila') return bloqueio('incompativel', 'Isso já é verdade na sua vida. Que tal uma meta maior?');
    return PERMITIDO;
  }
  const o = objetivos14(v).find(x => x.id === a.id);
  if (!o || o.estado !== 'ativo') return bloqueio('incompativel', 'Esse objetivo não está ativo.');
  if (a.op === 'alterar') {
    if (a.alvo === o.alvo) return bloqueio('incompativel', 'Essa já é a meta.');
    if (!modeloObjetivo14(o.tipo).alvos.some(x => x.valor === a.alvo)) return bloqueio('impossivel', 'Essa meta não existe.');
  }
  return PERMITIDO;
}

export function executarObjetivo14(v: Vida, a: OqueObjetivo14): string {
  const st = estadoConquistas14(v);
  const lista = (st.objetivos ??= []);
  if (a.op === 'criar') {
    lista.push({ id: `${a.tipo}:${v.t}`, tipo: a.tipo, alvo: a.alvo, t: v.t, estado: 'ativo', ...(a.tipo === 'tranquila' ? { serie: 0 } : {}) });
    if (lista.length > 30) { const i = lista.findIndex(o => o.estado !== 'ativo'); if (i >= 0) lista.splice(i, 1); }
    const alvo = modeloObjetivo14(a.tipo).alvos.find(x => x.valor === a.alvo)!;
    return `${nomeDoObjetivo14(v, a.tipo)} (${rotuloDoAlvo14(v, a.tipo, alvo.valor)}): está na sua lista. O jogo acompanha pelo que acontece de verdade — e diz quando chegar.`;
  }
  const o = lista.find(x => x.id === a.id)!;
  if (a.op === 'alterar') {
    const antes = rotuloDoAlvo14(v, o.tipo, o.alvo);
    o.alvo = a.alvo;
    o.alteracoes = (o.alteracoes ?? 0) + 1;
    return `A meta mudou: de ${antes} para ${rotuloDoAlvo14(v, o.tipo, a.alvo)}.`;
  }
  o.melhor = Math.max(o.melhor ?? 0, progresso14(v, o).fracao);
  o.estado = 'abandonado';
  o.tFim = v.t;
  return `${nomeDoObjetivo14(v, o.tipo)} saiu da lista. Sem culpa: a vida muda de ideia.`;
}

/** O alvo em palavras (o dinheiro já na moeda e na régua de onde se mora). */
export function rotuloDoAlvo14(v: Vida, tipo: TipoObjetivo14, valor: number): string {
  if (tipo === 'milionario' || tipo === 'empresa') return dinheiroCurto(valor * 1_000_000 * custoLocal(v));
  return modeloObjetivo14(tipo).alvos.find(x => x.valor === valor)?.rotulo ?? String(valor);
}

/* ------------------------------------------------------------------ A conclusão (contextualizada) */

const ROTULO_PATRIMONIO: Record<string, string> = { imoveis: 'em imóveis', aplicacoes: 'em aplicações', empresas: 'em empresas', negocio: 'no negócio', colecao: 'na coleção', conta: 'na conta', veiculos: 'em veículos' };

function fraseDaConclusao(v: Vida, o: Objetivo14): { texto: string; rotulo: string } {
  const g = v.eu.tratamento ?? v.eu.genero;
  const i = idade(v);
  const anos = Math.round((v.t - o.t) / 12);
  const desde = anos >= 2 ? ` — ${anos} anos depois de pôr isso como meta` : '';
  const nome = nomeDoObjetivo14(v, o.tipo).toLowerCase();
  const rotulo = `${nome}, em ${anoDe(v.t)}`;
  switch (o.tipo) {
    case 'milionario': {
      const b = balanco(v);
      const partes = (['imoveis', 'aplicacoes', 'empresas', 'negocio', 'colecao', 'conta', 'veiculos'] as const).map(k => [k, b[k]] as const).sort((x, y) => y[1] - x[1]);
      return { texto: `Aos ${i} anos, o patrimônio passou de ${dinheiroCurto(alvoEmDinheiro14(v, o))}, a maior parte ${ROTULO_PATRIMONIO[partes[0][0]]}${desde}.`, rotulo };
    }
    case 'carreira': {
      const p = prestigioProfissional(v);
      const e = v.trabalho.atual;
      return { texto: `Aos ${i} anos, ${p.valor >= 75 ? 'referência' : flex(g, 'muito respeitado', 'muito respeitada', 'muito respeitade')} no meio${p.por ? ` (${p.por})` : ''}${e ? `, como ${nomeOcupacaoId(v, e.ocupacaoId)}` : ''}: a carreira que você queria${desde}.`, rotulo };
    }
    case 'paises': {
      const ps = paisesConhecidos14(v);
      return { texto: `${ps.length} países conhecidos — o último foi ${ps[ps.length - 1]}${desde}.`, rotulo };
    }
    case 'famoso':
      return { texto: `Aos ${i} anos, ${palavraDaNotoriedade(v)}: o público sabe quem você é${desde}.`, rotulo };
    case 'empresa': {
      const e = maiorEmpresa(v)!;
      return { texto: `${e.nome} passou a valer ${dinheiroCurto(e.avaliacao ?? 0)}, com ${e.equipe} ${e.equipe === 1 ? 'pessoa' : 'pessoas'} na equipe${desde}.`, rotulo };
    }
    case 'independencia': {
      const { passiva } = rendaPassiva14(v);
      return { texto: `Aos ${i} anos, a renda do patrimônio (${dinheiroCurto(passiva)} por mês) passou a pagar a vida. Trabalhar virou escolha${desde}.`, rotulo };
    }
    case 'tranquila':
      return { texto: `${o.serie} anos seguidos de vida tranquila: pouca pressão, saúde em dia, as contas pagas${desde}.`, rotulo };
    case 'casa_propria':
      return { texto: `Aos ${i} anos, a casa própria, em ${municipio(v.moradia.municipioId).nome}${desde}.`, rotulo: `ter a casa própria, em ${anoDe(v.t)}` };
  }
}

const TEMA: Record<TipoObjetivo14, 'dinheiro' | 'trabalho' | 'lugar' | 'casa' | 'escolha'> = {
  milionario: 'dinheiro', independencia: 'dinheiro', carreira: 'trabalho', famoso: 'trabalho', empresa: 'trabalho', paises: 'lugar', casa_propria: 'casa', tranquila: 'escolha'
};

/**
 * O pass anual (silencioso quando nada muda): conta a série da vida tranquila, guarda o mais perto que cada meta chegou e
 * conclui o que chegou lá — uma vez, com a frase do contexto na Linha da Vida.
 */
export function processarObjetivos14(v: Vida): void {
  if (v.morte) return;
  for (const o of objetivosAtivos14(v)) {
    if (o.tipo === 'tranquila') o.serie = anoTranquilo14(v).ok ? (o.serie ?? 0) + 1 : 0;
    const p = progresso14(v, o);
    o.melhor = Math.max(o.melhor ?? 0, Math.round(p.fracao * 100) / 100);
    if (p.fracao < 1) continue;
    const f = fraseDaConclusao(v, o);
    o.estado = 'concluido';
    o.tFim = v.t;
    o.rotulo = f.rotulo;
    v.mente.felicidade = clamp(v.mente.felicidade + 6);
    escrever(v, { texto: f.texto, relevancia: 'marco', tema: TEMA[o.tipo], tom: 'bom', fato: { tipo: 'c14_objetivo', dados: { objetivo: o.tipo, alvo: o.alvo } } });
    if (o.tipo === 'carreira' || o.tipo === 'empresa') marcar(v, 'conquista', f.texto, 3);
  }
}

/** A frase da retrospectiva (o que a pessoa se propôs e cumpriu) — também lida direto do estado pela `retrospectiva`. */
export function concluidos14(v: Vida): Objetivo14[] { return objetivos14(v).filter(o => o.estado === 'concluido'); }
