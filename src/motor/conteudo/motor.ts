/**
 * Seleção e aplicação de conteúdo.
 */

import type { Rng } from '../rng';
import type { Momento, Pessoa, Vida } from '../tipos';
import { contexto, txt, type Acontecimento, type Conteudo, type Ctx, type Decisao } from './base';
import { escrever, idade, lembrarCom, novoId } from '../nucleo';
import { CATALOGO } from './catalogo';
import { aplicarPersonalidade } from '../personalidade';

const POR_ID = new Map<string, Conteudo>();
function indice(): Map<string, Conteudo> {
  if (POR_ID.size === 0) for (const c of CATALOGO) POR_ID.set(c.id, c);
  return POR_ID;
}
export const conteudoPorId = (id: string) => indice().get(id);

function ultimaOcorrencia(v: Vida, id: string): number | undefined {
  let ult: number | undefined;
  for (const o of v.ocorrencias) if (o.id === id) ult = o.t;
  return ult;
}

/** Resolve papéis e condições. Devolve o contexto se o conteúdo cabe agora. */
export function preparar(c: Conteudo, v: Vida, r: Rng): Ctx | null {
  const i = idade(v);
  if (i < c.idade[0] || i > c.idade[1]) return null;
  const ult = ultimaOcorrencia(v, c.id);
  if (ult !== undefined) {
    if (c.repetir === undefined) return null;
    if (v.t - ult < c.repetir * 12) return null;
  }
  const p: Record<string, Pessoa> = {};
  if (c.papeis) {
    for (const [nome, sel] of Object.entries(c.papeis)) {
      const usados = new Set(Object.values(p).map(x => x.id));
      const candidatos = sel(v).filter(x => !usados.has(x.id));
      if (candidatos.length === 0) return null;
      p[nome] = r.pick(candidatos);
    }
  }
  const ctx = contexto(v, r, p);
  ctx.vezes = v.ocorrencias.filter(o => o.id === c.id).length;
  if (c.quando && !c.quando(ctx)) return null;
  return ctx;
}

function peso(c: Conteudo, ctx: Ctx): number {
  if (c.peso === undefined) return 1;
  return typeof c.peso === 'number' ? c.peso : c.peso(ctx);
}

export function candidatos(v: Vida, r: Rng, filtro: (c: Conteudo) => boolean): { c: Conteudo; ctx: Ctx }[] {
  const out: { c: Conteudo; ctx: Ctx }[] = [];
  for (const c of CATALOGO) {
    if (c.manual || !filtro(c)) continue;
    const ctx = preparar(c, v, r);
    if (ctx) out.push({ c, ctx });
  }
  return out;
}

export function sortear(v: Vida, r: Rng, filtro: (c: Conteudo) => boolean): { c: Conteudo; ctx: Ctx } | undefined {
  const lista = candidatos(v, r, filtro);
  return r.weighted(lista, x => peso(x.c, x.ctx));
}

function registrarOcorrencia(v: Vida, id: string): void {
  v.ocorrencias.push({ id, t: v.t, idade: idade(v) });
}

/* ---------------------------------------------------------- Acontecimento */

export function aplicarAcontecimento(v: Vida, a: Acontecimento, ctx: Ctx): boolean {
  const n = a.narrar(ctx);
  registrarOcorrencia(v, a.id);
  if (!n) return false;
  n.efeito?.(ctx);
  // A segunda vez de algo comum já não é biografia: é textura.
  const relevancia = n.relevancia ?? (ctx.vezes > 0 ? 'cotidiano' : 'biografia');
  escrever(v, {
    texto: n.texto,
    relevancia,
    tema: a.tema,
    tom: n.tom,
    pessoas: Object.values(ctx.p).map(p => p.id),
    evento: n.evento
  });
  if (n.lembrar) {
    const pessoa = ctx.p[n.lembrar[0]];
    if (pessoa) lembrarCom(v, pessoa.id, n.lembrar[1], n.lembrar[2], 1);
  }
  return true;
}

/* --------------------------------------------------------------- Decisão */

export function abrirDecisao(v: Vida, d: Decisao, ctx: Ctx): Momento {
  registrarOcorrencia(v, d.id);
  const opcoes = d.opcoes
    .map(o => {
      const disp = o.disponivel ? o.disponivel(ctx) : true;
      if (disp === false) return null;
      const detalhe = o.consequencia?.(ctx);
      return { id: o.id, texto: txt(o.texto, ctx), bloqueio: disp === true ? undefined : disp, ...(detalhe ? { detalhe } : {}) };
    })
    .filter((o): o is NonNullable<typeof o> => o !== null);
  const m: Momento = {
    id: novoId(v, 'm'),
    situacaoId: d.id,
    t: v.t,
    titulo: txt(d.titulo, ctx),
    texto: d.texto(ctx),
    tema: d.tema,
    papeis: Object.fromEntries(Object.entries(ctx.p).map(([k, p]) => [k, p.id])),
    opcoes
  };
  v.momento = m;
  return m;
}

/** Resolve o momento aberto com a opção escolhida. */
export function resolverDecisao(v: Vida, r: Rng, opcaoId: string): { texto: string } | { erro: string } {
  const m = v.momento;
  if (!m) return { erro: 'Não há decisão aberta.' };
  const d = conteudoPorId(m.situacaoId);
  if (!d || d.tipo !== 'decisao') { v.momento = null; return { erro: 'Decisão desconhecida.' }; }
  const opcao = d.opcoes.find(o => o.id === opcaoId);
  const aberta = m.opcoes.find(o => o.id === opcaoId);
  if (!opcao || !aberta) return { erro: 'Opção inválida.' };
  if (aberta.bloqueio) return { erro: aberta.bloqueio };
  const p: Record<string, Pessoa> = {};
  for (const [papel, id] of Object.entries(m.papeis)) {
    const pessoa = v.pessoas[id];
    if (pessoa) p[papel] = pessoa;
  }
  const ctx = contexto(v, r, p);
  const res = opcao.resolver(ctx);
  res.efeito?.(ctx);
  if (opcao.comportamento && !d.biografica) aplicarPersonalidade(v, `${d.id}:${opcao.id}`, opcao.comportamento);
  if (res.memoria !== null) {
    escrever(v, {
      texto: res.memoria ?? res.texto,
      relevancia: res.relevancia ?? 'biografia',
      tema: d.tema,
      tom: res.tom,
      pessoas: Object.values(p).map(x => x.id).filter(id => v.pessoas[id]),
      escolha: true,
      evento: res.evento
    });
  }
  if (res.lembrar) {
    const pessoa = p[res.lembrar[0]];
    if (pessoa) lembrarCom(v, pessoa.id, res.lembrar[1], res.lembrar[2], 2);
  }
  v.momento = null;
  // Processo em etapas: a mesma decisão volta, com a próxima pergunta.
  if (res.reabrir) abrirDecisao(v, d, contexto(v, r, p));
  else if (res.abrir || (v.caminhos.pendente && !v.momento)) {
    const alvo = res.abrir ? conteudoPorId(res.abrir.id) : conteudoPorId('comp_conflito');
    if (alvo && alvo.tipo === 'decisao') {
      const q: Record<string, Pessoa> = {};
      for (const [papel, id] of Object.entries(res.abrir?.papeis ?? {})) if (v.pessoas[id]?.vivo) q[papel] = v.pessoas[id];
      abrirDecisao(v, alvo, contexto(v, r, q));
    }
  }
  return { texto: res.texto };
}
