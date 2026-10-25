/**
 * REWORK 12.2 — vidas longas por perfil (10, 20 e 30 anos), sempre pelo que o jogador pode fazer (`disponibilidade`
 * → `executar`) e pelo ano do motor. Perfis: baixa renda, classe média, empresário iniciante (toca um restaurante),
 * empresário experiente (academia própria + loja delegada), milionário (coleção + aplicações), bilionário (peças
 * únicas, museu delegado), colecionador (compra, autentica, aceita propostas), dono de zoológico, dono de museu,
 * envolvido no Submundo (negócio por fora, tira o caixa), quem abandona o crime (fecha e para no ano 5) e o
 * "honesto do mesmo capital" (o mesmo dinheiro de partida do Submundo, aplicado).
 * Mede: líquido p10/p50/p90 nos marcos, falências, processos, prisões, negócios desmantelados e invariantes (NaN,
 * patrimônio que explode, peça única em dobro, despesa positiva).
 *   npx esbuild scripts/sim/vidas122.ts --bundle --platform=node --format=esm --outfile=<scratch>/v.mjs && N=12 node <scratch>/v.mjs
 */
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { adulto } from '../../src/motor/__tests__/cenarios';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { podeTentar } from '../../src/motor/plausibilidade';
import { balanco, orcamento } from '../../src/motor/sistemas/dinheiro';
import { ofertasDeImoveis } from '../../src/motor/sistemas/mercado';
import { colecao, ofertasDeColecao, propostasDeColecionadores } from '../../src/motor/sistemas/colecao';
import { empresasAtivas } from '../../src/motor/sistemas/empresas';
import { negocios } from '../../src/motor/sistemas/clandestinos';
import { contratar } from '../../src/motor/sistemas/trabalho';
import { entrar, parar } from '../../src/motor/sistemas/ilicito';
import { criarContato } from '../../src/motor/sistemas/submundo';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import { criarRng } from '../../src/motor/rng';
import { transacao } from '../../src/motor/nucleo';
import type { Vida } from '../../src/motor/tipos';

await carregarMundo();
const N = Number(process.env.N ?? 12);
const MARCOS = [10, 20, 30];
const pct = (xs: number[], p: number) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : NaN; };
const k = (x: number) => (Math.abs(x) >= 1e9 ? `${(x / 1e9).toFixed(2)}bi` : Math.abs(x) >= 1e6 ? `${(x / 1e6).toFixed(1)}mi` : `${Math.round(x / 1000)}k`);
const tenta = (v: Vida, a: Acao): Vida => (podeTentar(disponibilidade(v, a)) ? executar(v, a).vida : v);

function responder(v: Vida, noCrime = false): Vida {
  for (let i = 0; i < 12 && v.momento && !v.morte; i++) {
    const m = v.momento!;
    const pref = ['recusar', 'negociar', 'aportar', 'manter', 'esperar'];
    // Quem está no crime segue nele (não larga a cada pergunta); quem não está, recusa.
    const op = (noCrime ? m.opcoes.find(o => !o.bloqueio && !/parar|largar|sair|recusar|denunciar|ajuda|moita|mudar|sumir|cortar|cooperar|entregar/.test(o.id)) : undefined) ?? pref.map(p => m.opcoes.find(o => o.id === p && !o.bloqueio)).find(Boolean) ?? m.opcoes.find(o => !o.bloqueio) ?? m.opcoes[0];
    v = executar(v, { tipo: 'decidir', opcaoId: op.id }).vida;
  }
  return v;
}

type Perfil = 'baixa' | 'media' | 'iniciante' | 'experiente' | 'milionario' | 'bilionario' | 'colecionador' | 'zoologico' | 'museu' | 'submundo' | 'abandona' | 'honesto';
const PERFIS = (process.env.PERFIS?.split(',') as Perfil[]) ?? ['baixa', 'media', 'iniciante', 'experiente', 'milionario', 'bilionario', 'colecionador', 'zoologico', 'museu', 'submundo', 'abandona', 'honesto'];

function comecar(p: Perfil, s: number): Vida {
  const cidade = p === 'baixa' ? 'recife-pe' : 'sao-paulo-sp';
  let v = adulto(30, { semente: 900 + s * 17, municipioId: cidade });
  v.trabalho.atual = undefined;
  const oc = { baixa: 'aux_limpeza', media: 'assistente_adm', iniciante: 'assistente_adm', experiente: 'assistente_adm', milionario: 'engenheiro_infra', bilionario: 'engenheiro_infra', colecionador: 'engenheiro_infra', zoologico: 'engenheiro_infra', museu: 'engenheiro_infra', submundo: 'assistente_adm', abandona: 'assistente_adm', honesto: 'assistente_adm' }[p];
  try { contratar(v, criarRng(s), ocupacao(oc)); } catch { contratar(v, criarRng(s), ocupacao('assistente_adm')); }
  v.financas.dividas = []; v.financas.negativado = false; v.momento = null; delete v.fila;
  v.financas.conta = { baixa: 3000, media: 30000, iniciante: 900_000, experiente: 2_500_000, milionario: 10_000_000, bilionario: 2_000_000_000, colecionador: 30_000_000, zoologico: 60_000_000, museu: 30_000_000, submundo: 300_000, abandona: 300_000, honesto: 300_000 }[p];
  if (p === 'submundo' || p === 'abandona') v = transacao(v, (x, r) => { delete x.fatos['proposta_ilicita']; entrar(x, 'mercado', undefined, r); for (const e of Object.values(x.caminhos.envolvimento!.especializacoes ?? {})) if (e) e.experiencia = 35; criarContato(x, 'contrabando', 'fornecedor'); criarContato(x, 'contrabando', 'parceiro'); }).vida;
  return v;
}

function politica(p: Perfil, v: Vida, ano: number): Vida {
  const investir = (reserva: number) => { if (v.financas.conta > reserva * 2) v = tenta(v, { tipo: 'investir', destino: 'pos_fixado', valor: Math.round(v.financas.conta - reserva) }); };
  const e0 = empresasAtivas(v)[0];
  switch (p) {
    case 'media': {
      if (!v.financas.bens.some(b => b.tipo === 'imovel')) for (const o of ofertasDeImoveis(v, 'venda').sort((a, b) => a.preco - b.preco)) { const w = tenta(v, { tipo: 'comprar_imovel', ofertaId: o.id, financiar: true, morar: true, prazo: 30 }); if (w !== v) { v = w; break; } }
      break;
    }
    case 'iniciante': {
      if (ano === 0) { v = tenta(v, { tipo: 'empresa_abrir', empresa: 'restaurante', comSocio: false }); const e = empresasAtivas(v)[0]; if (e) { v = tenta(v, { tipo: 'empresa', empresaId: e.id, decisao: 'assumir' }); v = tenta(v, { tipo: 'setor', empresaId: e.id, decisao: 'fornecedor', alvo: 'local' }); } }
      if (e0?.estado === 'em_crise') v = tenta(v, { tipo: 'empresa', empresaId: e0.id, decisao: 'aportar' });
      if (e0 && ano % 4 === 3) v = tenta(v, { tipo: 'setor', empresaId: e0.id, decisao: 'salao' });
      if (e0 && (e0.anosNoVermelho ?? 0) >= 2) v = tenta(v, { tipo: 'empresa', empresaId: e0.id, decisao: 'encerrar' });
      investir(80000);
      break;
    }
    case 'experiente': {
      if (ano === 0) { v = tenta(v, { tipo: 'empresa_abrir', empresa: 'academia', comSocio: false }); const e = empresasAtivas(v)[0]; if (e) { v = tenta(v, { tipo: 'empresa', empresaId: e.id, decisao: 'assumir' }); v = tenta(v, { tipo: 'setor', empresaId: e.id, decisao: 'retencao', alvo: 'aplicativo' }); } }
      if (ano === 3) v = tenta(v, { tipo: 'empresa_abrir', empresa: 'loja', comSocio: false });
      for (const e of empresasAtivas(v)) { if (e.estado === 'em_crise') v = tenta(v, { tipo: 'empresa', empresaId: e.id, decisao: 'aportar' }); if (e.setor?.academia && e.setor.academia.equipamentos < 45) v = tenta(v, { tipo: 'setor', empresaId: e.id, decisao: 'equipamentos' }); }
      investir(150000);
      break;
    }
    case 'milionario': {
      if (ano % 4 === 0) for (const l of ['relojoaria', 'galeria'] as const) { const o = ofertasDeColecao(v, l).filter(x => x.preco < v.financas.conta * 0.05).pop(); if (o) v = tenta(v, { tipo: 'colecao_comprar', ofertaId: o.id }); }
      investir(400000);
      break;
    }
    case 'bilionario': {
      if (ano === 0) { v = tenta(v, { tipo: 'empresa_abrir', empresa: 'museu', comSocio: false }); }
      for (const o of ofertasDeColecao(v, 'leilao').filter(x => x.canal === 'especial')) v = tenta(v, { tipo: 'colecao_comprar', ofertaId: o.id });
      if (ano % 3 === 0) for (const l of ['relojoaria', 'joalheria', 'galeria'] as const) { const o = ofertasDeColecao(v, l).find(x => x.canal === 'privada'); if (o) v = tenta(v, { tipo: 'colecao_comprar', ofertaId: o.id }); }
      const m = empresasAtivas(v).find(x => x.tipo === 'museu');
      if (m?.estado === 'em_crise') v = tenta(v, { tipo: 'empresa', empresaId: m.id, decisao: 'aportar' });
      if (m) for (const c of colecao(v).filter(c => c.valor > 1_000_000 && !c.emprestadaA)) v = tenta(v, { tipo: 'colecao_ceder', pecaId: c.id, empresaId: m.id });
      investir(20_000_000);
      break;
    }
    case 'colecionador': {
      for (const l of ['galeria', 'antiquario', 'leilao'] as const) { const o = ofertasDeColecao(v, l).filter(x => x.preco < v.financas.conta * 0.08 && x.canal !== 'especial')[0]; if (o && ano % 2 === 0) v = tenta(v, { tipo: 'colecao_comprar', ofertaId: o.id }); }
      for (const c of colecao(v)) { if (c.autenticidade !== 'verificada') v = tenta(v, { tipo: 'colecao_servico', pecaId: c.id, servico: 'autenticar' }); if (c.estado < 70) v = tenta(v, { tipo: 'colecao_servico', pecaId: c.id, servico: 'restaurar' }); }
      for (const pr of propostasDeColecionadores(v)) { const c = colecao(v).find(x => x.id === pr.pecaId); if (c && pr.valor > c.precoPago * 1.2) v = tenta(v, { tipo: 'colecao_proposta', propostaId: pr.id, aceitar: true }); }
      investir(1_000_000);
      break;
    }
    case 'zoologico': {
      if (ano === 0) v = tenta(v, { tipo: 'empresa_abrir', empresa: 'zoologico', comSocio: false });
      const z = empresasAtivas(v).find(x => x.tipo === 'zoologico');
      if (z && ano === 2) { v = tenta(v, { tipo: 'empresa', empresaId: z.id, decisao: 'conservacao' }); v = tenta(v, { tipo: 'setor', empresaId: z.id, decisao: 'educacao' }); }
      if (z?.estado === 'em_crise') v = tenta(v, { tipo: 'empresa', empresaId: z.id, decisao: 'aportar' });
      if (z && ano % 5 === 4) v = tenta(v, { tipo: 'setor', empresaId: z.id, decisao: 'reformar_recintos' });
      investir(2_000_000);
      break;
    }
    case 'museu': {
      if (ano === 0) v = tenta(v, { tipo: 'empresa_abrir', empresa: 'museu', comSocio: false });
      const m = empresasAtivas(v).find(x => x.tipo === 'museu');
      if (m && ano === 1) v = tenta(v, { tipo: 'setor', empresaId: m.id, decisao: 'curador' });
      if (m && ano % 3 === 2) v = tenta(v, { tipo: 'setor', empresaId: m.id, decisao: 'patrocinio' });
      if (m?.estado === 'em_crise') v = tenta(v, { tipo: 'empresa', empresaId: m.id, decisao: 'aportar' });
      investir(1_000_000);
      break;
    }
    case 'submundo': case 'abandona': {
      if (ano === 0) v = tenta(v, { tipo: 'clandestino', oque: 'abrir', alvo: 'mercadorias' });
      const n = negocios(v).find(x => x.estado === 'ativo');
      if (n && n.caixa > 20000) v = tenta(v, { tipo: 'clandestino', oque: 'retirar', negocioId: n.id });
      if (p === 'abandona' && ano === 5) { if (n) v = tenta(v, { tipo: 'clandestino', oque: 'encerrar', negocioId: n.id }); v = transacao(v, x => { if (x.caminhos.envolvimento && x.caminhos.envolvimento.parou === undefined) parar(x, 'decidiu sair'); }).vida; }
      investir(60000);
      break;
    }
    case 'honesto': investir(60000); break;
  }
  return v;
}

for (const p of PERFIS) {
  const marcos: Record<number, number[]> = { 10: [], 20: [], 30: [] };
  let falencias = 0, processos = 0, prisoes = 0, desmantelados = 0, anomalias = 0, mortes = 0, unicasDuplas = 0;
  const anosAtivos: number[] = []; const ganhos: number[] = []; const estados: Record<string, number> = {}; let exposMax = 0; let investigacoes = 0;
  for (let s = 0; s < N; s++) {
    let v = comecar(p, s);
    for (let a = 0; a < 30 && !v.morte; a++) {
      v = politica(p, v, a);
      v = responder(avancarAno(v).vida, (p === 'submundo' || (p === 'abandona' && a < 5)) && v.caminhos.envolvimento?.parou === undefined);
      const b = balanco(v);
      if (!Number.isFinite(b.liquido) || b.liquido > 1e13) anomalias++;
      if (orcamento(v).saidas.some(l => l.valor > 0.5)) anomalias++;
      const unicas = colecao(v).filter(c => c.unica).map(c => c.unica);
      if (new Set(unicas).size !== unicas.length) unicasDuplas++;
      if (MARCOS.includes(a + 1)) marcos[a + 1].push(b.liquido);
      exposMax = Math.max(exposMax, v.caminhos.envolvimento?.exposicao ?? 0);
      if (v.caminhos.envolvimento?.investigado === v.t) investigacoes++;
    }
    if (v.morte) mortes++;
    for (const e of v.financas.empresas ?? []) if ((e.historia ?? []).some(h => h.texto === 'Faliu.')) falencias++;
    if ((v.justica?.antecedentes.length ?? 0) > 0 || v.justica?.processo) processos++;
    if ((v.justica?.antecedentes ?? []).some(a => a.desfecho === 'prisao') || v.justica?.prisao) prisoes++;
    desmantelados += negocios(v).filter(n => n.estado === 'desmantelado').length;
    for (const n of negocios(v)) { anosAtivos.push(((n.tFim ?? v.t) - n.tInicio) / 12); estados[n.estado] = (estados[n.estado] ?? 0) + 1; }
    if (v.caminhos.envolvimento) ganhos.push(v.caminhos.envolvimento.ganhos);
  }
  const m = (a: number) => `${a}a p10 ${k(pct(marcos[a], 0.1))} p50 ${k(pct(marcos[a], 0.5))} p90 ${k(pct(marcos[a], 0.9))}`;
  console.log(`${p.padEnd(12)} ${MARCOS.map(m).join(' | ')} | falências ${falencias} | processos ${processos} prisões ${prisoes} desmantelados ${desmantelados} | mortes ${mortes} | anomalias ${anomalias} únicas em dobro ${unicasDuplas}${anosAtivos.length ? ` | negócio por fora: anos ativos p50 ${pct(anosAtivos, 0.5).toFixed(1)}, fim ${JSON.stringify(estados)}, ganhos p50 ${k(pct(ganhos, 0.5))}, exposição máx ${Math.round(exposMax)}, investigações ${investigacoes}` : ''}`);
}
