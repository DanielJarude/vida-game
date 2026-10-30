/**
 * Seleção e aplicação de conteúdo.
 */

import { lugarDe, noEscopo } from '../mundo/escopo';
import type { Rng } from '../rng';
import type { DecisaoNaFila, Momento, Pessoa, Vida } from '../tipos';
import { contexto, txt, type Acontecimento, type Conteudo, type Ctx, type Decisao } from './base';
import { entradaDaMorte, escrever, filhos, idade, idadePessoa, lembrarCom, novoId, parceiro, registrarMarco, temMarco } from '../nucleo';
import { CATALOGO } from './catalogo';
import { aplicarPersonalidade } from '../personalidade';
import { clamp, rngDe } from '../rng';
import { DECISOES_DE_CONTRATO, registrarDecisaoDeCarreira, trajetoriaDeSituacao } from '../sistemas/situacoes';

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
  if (!noEscopo(c.escopo, lugarDe(v.moradia.municipioId))) return null;
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
      // REWORK 10: um papel `fixo` (`papeis.fixo`) já vem na ordem certa — escolher o primeiro não gasta o gerador do ano.
      p[nome] = (sel as { fixo?: boolean }).fixo ? candidatos[0] : r.pick(candidatos);
    }
  }
  if (c.marco && temMarco(v, c.marco.papel ? p[c.marco.papel]?.id ?? '' : 'eu', c.marco.chave)) return null;
  const ctx = contexto(v, r, p);
  ctx.vezes = v.ocorrencias.filter(o => o.id === c.id).length;
  if (c.quando && !c.quando(ctx)) return null;
  // REWORK 10.5 · EVT-05: o marco garantido de parte das vidas ("a primeira palavra") que as duas vidas anteriores já
  // tiveram aparece em metade das vezes (sorteio derivado: a sequência da vida não muda).
  if (c.garantido && v.memoriaDeVidas?.includes(c.id) && !rngDe(v.id, 'memoria_vidas', c.id).chance(0.5)) return null;
  return ctx;
}

function peso(c: Conteudo, ctx: Ctx): number {
  const base = c.peso === undefined ? 1 : typeof c.peso === 'number' ? c.peso : c.peso(ctx);
  // REWORK 10.5 · EVT-05: o que as duas vidas anteriores viveram pesa menos (a variedade entre vidas consecutivas).
  // REWORK 11 · EVT-11.1: na infância (onde a repetição entre vidas mais se sente), o que as vidas anteriores viram pesa
  // ainda menos — a variedade nova da infância (`acontecimentosinfancia`) ganha a vez.
  return ctx.v.memoriaDeVidas?.includes(c.id) ? base * (c.idade[1] <= 12 ? 0.3 : 0.45) : base;
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

function registrarOcorrencia(v: Vida, id: string, ctx?: Ctx): void {
  v.ocorrencias.push({ id, t: v.t, idade: idade(v) });
  // REWORK 12.3 · F1: o marco de uma vez só fica na pessoa no instante em que aparece (a decisão aberta já é o marco).
  const m = conteudoPorId(id)?.marco;
  if (m && ctx) { const quem = m.papel ? ctx.p[m.papel]?.id : 'eu'; if (quem) registrarMarco(v, quem, m.chave); }
}

/* ---------------------------------------------------------- Acontecimento */

export function aplicarAcontecimento(v: Vida, a: Acontecimento, ctx: Ctx): boolean {
  const n = a.narrar(ctx);
  registrarOcorrencia(v, a.id, ctx);
  if (!n) return false;
  n.efeito?.(ctx);
  // A segunda vez de algo comum já não é biografia: é textura.
  const relevancia = n.relevancia ?? (ctx.vezes > 0 ? 'cotidiano' : 'biografia');
  const segue = a.origem?.(ctx) ?? origemDosPapeis(v, ctx);
  escrever(v, {
    ...(segue ? { segue } : {}),
    texto: n.texto,
    relevancia,
    tema: a.tema,
    tom: n.tom,
    pessoas: Object.values(ctx.p).map(p => p.id),
    evento: n.evento,
    ...(n.fato ? { fato: n.fato } : {})
  });
  if (n.lembrar) {
    const pessoa = ctx.p[n.lembrar[0]];
    if (pessoa) lembrarCom(v, pessoa.id, n.lembrar[1], n.lembrar[2], 1);
  }
  return true;
}

/* --------------------------------------------------------------- Decisão */

export function abrirDecisao(v: Vida, d: Decisao, ctx: Ctx): Momento {
  registrarOcorrencia(v, d.id, ctx);
  const opcoes = d.opcoes
    .map(o => {
      const disp = o.disponivel ? o.disponivel(ctx) : true;
      if (disp === false) return null;
      const detalhe = o.consequencia?.(ctx);
      const bloqueio = disp === true ? undefined : typeof disp === 'string' ? disp : disp.motivo;
      const resgate = typeof disp === 'object' ? disp.resgate : undefined;
      return { id: o.id, texto: txt(o.texto, ctx), bloqueio, ...(resgate ? { resgate } : {}), ...(detalhe ? { detalhe } : {}) };
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
    opcoes,
    ...((d.origem?.(ctx) ?? origemDosPapeis(v, ctx)) ? { segue: d.origem?.(ctx) ?? origemDosPapeis(v, ctx) } : {})
  };
  v.momento = m;
  if (d.id === 'comp_conflito' && v.caminhos.pendente) v.caminhos.pendente.perguntado = true;
  return m;
}

/**
 * Depois de tirar das aplicações o que faltava, a opção paga é reavaliada:
 * se agora cabe, deixa de estar bloqueada (a escolha segue normalmente).
 */
export function liberarOpcaoPaga(v: Vida, r: Rng, opcaoId: string): void {
  const m = v.momento;
  const d = m ? conteudoPorId(m.situacaoId) : undefined;
  const o = d && d.tipo === 'decisao' ? d.opcoes.find(x => x.id === opcaoId) : undefined;
  const aberta = m?.opcoes.find(x => x.id === opcaoId);
  if (!m || !o || !aberta) return;
  const p: Record<string, Pessoa> = {};
  for (const [papel, id] of Object.entries(m.papeis)) if (v.pessoas[id]) p[papel] = v.pessoas[id];
  if ((o.disponivel ? o.disponivel(contexto(v, r, p)) : true) === true) { aberta.bloqueio = undefined; aberta.resgate = undefined; }
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
  // REWORK 11 · CAR-11.9: a decisão de contrato (renovar, a proposta) entra nos momentos da carreira em que foi tomada.
  const trDoContrato = DECISOES_DE_CONTRATO.has(d.id) ? trajetoriaDeSituacao(v) : undefined;
  const res = opcao.resolver(ctx);
  res.efeito?.(ctx);
  if (trDoContrato) registrarDecisaoDeCarreira(v, trDoContrato, d.id, aberta.texto, res.memoria ?? res.texto, res.tom);
  if (opcao.comportamento && !d.biografica) aplicarPersonalidade(v, `${d.id}:${opcao.id}`, opcao.comportamento);
  let escrita: string | undefined;
  if (res.memoria !== null) {
    escrita = escrever(v, {
      ...(m.segue ? { segue: m.segue } : {}),
      texto: res.memoria ?? res.texto,
      relevancia: res.relevancia ?? 'biografia',
      tema: d.tema,
      tom: res.tom,
      pessoas: Object.values(p).map(x => x.id).filter(id => v.pessoas[id]),
      escolha: true,
      evento: res.evento
    }).id;
  }
  if (res.lembrar) {
    const pessoa = p[res.lembrar[0]];
    if (pessoa) lembrarCom(v, pessoa.id, res.lembrar[1], res.lembrar[2], 2);
  }
  v.momento = null;
  // REWORK 11.5 · EVT-04: o que esta escolha trouxe (a decisão aberta por ela) é consequência dela — e as outras decisões
  // do ano, que já esperavam, ganham o elo se forem do mesmo assunto (o contrato, o caminho).
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
  // A etapa seguinte de um processo (ou a decisão que este resultado abriu) é desdobramento desta escolha.
  const elo = escrita ?? m.segue;
  const seguinte = v.momento as Momento | null;
  if (seguinte && seguinte !== m && elo && (res.reabrir || res.abrir)) seguinte.segue = elo;
  if (escrita) for (const x of v.fila ?? []) if (!x.segue && familiaDe(x.id) === familiaDe(d.id)) x.segue = escrita;
  // REWORK 11.5 · EVT-01: a próxima decisão do ano (conferida de novo: o que esta escolha desfez não aparece).
  if (!v.momento) abrirProximaDaFila(v);
  return { texto: res.texto };
}

/* ------------------------------------------------------------ REWORK 11.5 · EVT-01: a fila do ano */

/*
 * Antes, a vida inteira tinha UMA decisão por ano: a primeira que aparecia ocupava o ano, e as outras (a renovação e a
 * cena da carreira, a proposta do caminho e o filho que largou a escola) se perdiam ou esperavam. Agora o ano tem uma
 * FILA. A frequência não é cota: sai do que a vida tem (`orcamentoDeDecisoes`), e a saturação é contida por regras:
 *
 *   - URGENTE (garantida, ou disparada pelo estado com prioridade ≥ 4: o luto, a gravidez, o processo) entra sempre;
 *   - as outras disputam o espaço do ano; o que não cabe ESPERA o ano seguinte, uma vez (e é conferido de novo);
 *   - uma decisão por FAMÍLIA por ano (a proposta e a renovação do mesmo contrato não se empilham);
 *   - cada uma é preparada de novo antes de abrir, com as mesmas pessoas: o que a escolha anterior desfez (o contrato
 *     assinado, a relação terminada, a pessoa que morreu) não abre — a ordem causal é a da fila;
 *   - TETO de quatro decisões no ano (as urgentes passam; as outras esperam).
 *
 * Sorteios derivados (`rngDe`): a sequência principal do ano não muda.
 */

/** No máximo isto de decisões no mesmo ano (as urgentes podem passar; as outras esperam). */
export const TETO_DO_ANO = 4;

/** A família de um conteúdo: uma decisão por família por ano. */
export function familiaDe(id: string): string {
  const f = id.split('_')[0].replace(/\d+$/, '');
  return f === 'jus' ? 'ilic' : f;
}

/**
 * Quantas decisões o ano comporta, pelo que a vida TEM (não um sorteio): a carreira especial, a família, o casal, o
 * caminho à margem, as atividades, os estudos. Uma vida mansa: 1. Uma vida cheia: até 3. (As urgentes não contam.)
 */
export function orcamentoDeDecisoes(v: Vida): number {
  const i = idade(v);
  if (i < 8) return 1;
  let frentes = 0;
  const tr = trajetoriaDeSituacao(v);
  if (tr && tr !== 'emprego' && tr !== 'autonomo') frentes += 1;
  else if (v.trabalho.atual) frentes += 0.5;
  if (parceiro(v)) frentes += 0.5;
  if (filhos(v).some(f => f.vivo && idadePessoa(v, f) < 18)) frentes += 0.5;
  const env = v.caminhos.envolvimento;
  if (env && env.parou === undefined) frentes += 0.5 + Math.min(0.5, Object.keys(env.especializacoes ?? {}).length * 0.25);
  if (v.rotinas.length >= 2) frentes += 0.5;
  if (v.educacao.matricula && !v.educacao.matricula.trancado) frentes += 0.5;
  if (v.caminhos.politica?.mandato) frentes += 0.5;
  return clamp(1 + Math.floor(frentes / 1.25), 1, 3);
}

/** Prepara um conteúdo com as MESMAS pessoas (a fila guarda quem; o resto é conferido de novo). */
export function prepararCom(c: Conteudo, v: Vida, r: Rng, papeis: Record<string, string>): Ctx | null {
  const i = idade(v);
  if (v.morte || i < c.idade[0] || i > c.idade[1]) return null;
  if (!noEscopo(c.escopo, lugarDe(v.moradia.municipioId))) return null;
  const ult = ultimaOcorrencia(v, c.id);
  if (ult !== undefined && (c.repetir === undefined || v.t - ult < c.repetir * 12)) return null;
  const p: Record<string, Pessoa> = {};
  for (const [nome, id] of Object.entries(papeis)) {
    const sel = c.papeis?.[nome];
    // A pessoa ainda cabe no papel (o parceiro ainda é parceiro; o falecido continua sendo quem morreu).
    if (!sel || !v.pessoas[id] || !sel(v).some(x => x.id === id)) return null;
    p[nome] = v.pessoas[id];
  }
  if (c.papeis && Object.keys(c.papeis).some(k => !p[k])) return null;
  if (c.marco && temMarco(v, c.marco.papel ? p[c.marco.papel]?.id ?? '' : 'eu', c.marco.chave)) return null;
  const ctx = contexto(v, r, p);
  ctx.vezes = v.ocorrencias.filter(o => o.id === c.id).length;
  if (c.quando && !c.quando(ctx)) return null;
  return ctx;
}

/** Quantas decisões já abriram neste ano (as etapas do mesmo processo contam uma vez). */
export function decisoesDoAno(v: Vida): number {
  const ids = new Set<string>();
  for (let k = v.ocorrencias.length - 1; k >= 0 && v.ocorrencias[k].t === v.t; k--) {
    const c = conteudoPorId(v.ocorrencias[k].id);
    if (c?.tipo === 'decisao') ids.add(c.id);
  }
  return ids.size;
}

/**
 * REWORK 12.3 · F4/F6: a vida comum do 12.3 (infância, família, escola, casa, dinheiro, saúde, cidade) com sorteio próprio:
 * no máximo um por ano, numa parte dos anos, depois do resto do ano — o acontecimento entra na Linha da Vida; a decisão
 * só entra num ano que ainda não teve decisão nenhuma (a vida comum não enche o ano).
 */
const DA_VIDA_COMUM = /^(inf|ado|fam|esc|fac|casa|din|sau|cid)123_/;
export function vidaComumDoAno(v: Vida): void {
  if (v.morte) return;
  const r = rngDe(v.id, 'vida_comum_123', v.t);
  if (!r.chance(0.3)) return;
  const cabeDecisao = !v.momento && !v.fila?.length && decisoesDoAno(v) === 0;
  const lista: { c: Conteudo; ctx: Ctx }[] = [];
  for (const c of CATALOGO) { if (!c.manual || !DA_VIDA_COMUM.test(c.id) || (c.tipo === 'decisao' && !cabeDecisao)) continue; const ctx = preparar(c, v, r); if (ctx) lista.push({ c, ctx }); }
  const x = r.weighted(lista, y => peso(y.c, y.ctx));
  if (!x) return;
  if (x.c.tipo === 'acontecimento') { aplicarAcontecimento(v, x.c, x.ctx); return; }
  // A decisão só abre num ano que ainda não teve nenhuma (nem aberta, nem esperando): a vida comum não enche o ano (F6).
  if (!v.momento && !v.fila?.length && decisoesDoAno(v) === 0) abrirDecisao(v, x.c, x.ctx);
}

/** Quantas decisões ainda esperam neste ano (para a tela: "mais uma decisão neste ano"). */
export const esperandoNoAno = (v: Vida) => (v.fila ?? []).filter(x => x.t === v.t).length;

/**
 * Monta a fila do ano depois da decisão que abriu (ou de nenhuma): as adiadas do ano passado, as outras disparadas pelo
 * estado, e — numa vida cheia — às vezes uma segunda sorteada, de outro assunto.
 */
export function montarFila(v: Vida): void {
  const i = idade(v);
  const rr = rngDe(v.id, 'fila_do_ano', v.t);
  const aberta = v.momento?.situacaoId;
  const ids = new Set<string>(aberta ? [aberta] : []);
  const familias = new Set<string>(aberta ? [familiaDe(aberta)] : []);
  const herdadas = (v.fila ?? []).filter(x => x.adiada && x.t === v.t);
  const out: DecisaoNaFila[] = [];
  const pode = (id: string) => !ids.has(id) && !familias.has(familiaDe(id));
  const incluir = (x: DecisaoNaFila) => { ids.add(x.id); familias.add(familiaDe(x.id)); out.push(x); };
  for (const x of herdadas) if (pode(x.id)) incluir(x);
  const disparadas = candidatos(v, rr, c => c.tipo === 'decisao' && (!!c.garantido || !!c.prioritario))
    .map(x => ({ ...x, pr: x.c.garantido ? 99 : x.c.prioridade ?? 1 }))
    .sort((a, b) => b.pr - a.pr);
  for (const x of disparadas) {
    if (!pode(x.c.id)) continue;
    incluir({ id: x.c.id, t: v.t, papeis: Object.fromEntries(Object.entries(x.ctx.p).map(([k, p]) => [k, p.id])), prioridade: x.pr, ...(x.pr >= 4 ? { urgente: true } : {}) });
  }
  const orcamento = orcamentoDeDecisoes(v);
  let espaco = orcamento - (aberta ? 1 : 0) - out.filter(x => !x.urgente).length;
  // A vida cheia, às vezes, tem uma segunda decisão sorteada no ano — de outro assunto que a primeira.
  if (espaco > 0 && orcamento >= 2) {
    const tema = aberta ? conteudoPorId(aberta)?.tema : undefined;
    const chance = (FAIXA_DA_SEGUNDA.find(([max]) => i <= max)?.[1] ?? 0) * (orcamento - 1);
    if (rr.chance(chance)) {
      const x = sortear(v, rr, c => c.tipo === 'decisao' && !c.prioritario && !c.garantido && pode(c.id) && c.tema !== tema);
      if (x) { incluir({ id: x.c.id, t: v.t, papeis: Object.fromEntries(Object.entries(x.ctx.p).map(([k, p]) => [k, p.id])), prioridade: 0 }); espaco--; }
    }
  }
  // O que não cabe neste ano espera o seguinte (uma vez); o urgente fica.
  const ordenada = out.sort((a, b) => Number(!!b.urgente) - Number(!!a.urgente) || b.prioridade - a.prioridade);
  const fica: DecisaoNaFila[] = [];
  let livres = orcamento - (aberta ? 1 : 0);
  for (const x of ordenada) {
    if (x.urgente) { fica.push(x); continue; }
    if (livres > 0) { fica.push(x); livres--; continue; }
    if (!x.adiada) fica.push({ ...x, t: v.t + 12, adiada: true });
  }
  if (fica.length) v.fila = fica; else delete v.fila;
}

/** A chance de uma segunda decisão sorteada, por idade (multiplicada pelo que a vida tem além do básico). */
const FAIXA_DA_SEGUNDA: [number, number][] = [[11, 0.06], [17, 0.14], [29, 0.2], [59, 0.18], [200, 0.12]];

/**
 * Abre a próxima decisão do ano (se nenhuma está aberta). Conferida de novo antes; acima do teto, só a urgente abre — as
 * outras esperam o ano seguinte (uma vez) ou ficam para trás. Devolve se abriu.
 */
export function abrirProximaDaFila(v: Vida): boolean {
  if (v.momento || v.morte || !v.fila?.length) { if (v.fila && !v.fila.length) delete v.fila; return !!v.momento; }
  const fila = v.fila;
  while (!v.momento) {
    const k = fila.findIndex(x => x.t <= v.t);
    if (k < 0) break;
    const x = fila.splice(k, 1)[0];
    const c = conteudoPorId(x.id);
    if (!c || c.tipo !== 'decisao') continue;
    if (!x.urgente && decisoesDoAno(v) >= TETO_DO_ANO) {
      if (!x.adiada) fila.push({ ...x, t: v.t + 12, adiada: true });
      continue;
    }
    const ctx = prepararCom(c, v, rngDe(v.id, 'fila', v.t, x.id), x.papeis);
    if (!ctx) continue;
    const m = abrirDecisao(v, c, ctx);
    if (x.segue && !m.segue) m.segue = x.segue;
  }
  // O que já passou do ano (uma adiada que não voltou a caber) sai da fila.
  v.fila = fila.filter(x => x.t >= v.t);
  if (!v.fila.length) delete v.fila;
  return !!v.momento;
}

/**
 * REWORK 7.5: a origem que o motor CONHECE de um conteúdo — hoje, a morte de quem está no papel `falecido` (a
 * despedida, a lembrança de um ano depois, o luto do casal). Sem papel assim, não há origem (nada por semelhança).
 */
function origemDosPapeis(v: Vida, ctx: Ctx): string | undefined {
  const f = ctx.p.falecido;
  return f && !f.vivo ? entradaDaMorte(v, f.id)?.id : undefined;
}
