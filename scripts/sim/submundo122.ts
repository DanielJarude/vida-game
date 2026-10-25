/**
 * REWORK 12.2 · ajuste final do Submundo — trajetórias comparativas (as mesmas sementes antes e depois do ajuste).
 * Perfis: honesto, ocasional, recorrente, um especialista por ramo (furtos, contrabando, organizado, digital, fraudes),
 * dono de negócio por fora, integrante de organização, líder de organização, quem abandona no 5º ano e o reincidente.
 * Cada perfil responde às perguntas do caminho de um jeito coerente (o ocasional fica na moita e recusa trabalho grande;
 * o recorrente segue; quem abandona para). Mede, aos 10/20/30 anos: patrimônio líquido p10/p50/p90; e, na vida inteira:
 * investigações, arquivamentos, processos, absolvições, condenações (sem prisão), prisões, negócios que fracassaram,
 * saídas bem-sucedidas e a distribuição dos desfechos.
 *   npx esbuild scripts/sim/submundo122.ts --bundle --platform=node --format=esm --outfile=<scratch>/s.mjs && N=24 node <scratch>/s.mjs
 */
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { adulto } from '../../src/motor/__tests__/cenarios';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { podeTentar } from '../../src/motor/plausibilidade';
import { balanco } from '../../src/motor/sistemas/dinheiro';
import { contratar } from '../../src/motor/sistemas/trabalho';
import { entrar, parar } from '../../src/motor/sistemas/ilicito';
import { criarContato } from '../../src/motor/sistemas/submundo';
import { negocios } from '../../src/motor/sistemas/clandestinos';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import { criarRng } from '../../src/motor/rng';
import { transacao } from '../../src/motor/nucleo';
import type { CategoriaIlicita, Ramo, Vida } from '../../src/motor/tipos';

await carregarMundo();
const N = Number(process.env.N ?? 24);
const ANOS = 30;
const pct = (xs: number[], p: number) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : NaN; };
const k = (x: number) => (Math.abs(x) >= 1e6 ? `${(x / 1e6).toFixed(1)}mi` : `${Math.round(x / 1000)}k`);
const tenta = (v: Vida, a: Acao): Vida => (podeTentar(disponibilidade(v, a)) ? executar(v, a).vida : v);

type Perfil = 'honesto' | 'honesto_fin' | 'honesto_rico' | 'ocasional' | 'recorrente' | 'furtos' | 'contrabando' | 'organizado' | 'digital' | 'fraudes' | 'dono' | 'integrante' | 'lider' | 'abandona' | 'reincidente';
const PERFIS = (process.env.PERFIS?.split(',') as Perfil[]) ?? ['honesto', 'honesto_fin', 'honesto_rico', 'ocasional', 'recorrente', 'furtos', 'contrabando', 'organizado', 'digital', 'fraudes', 'dono', 'integrante', 'lider', 'abandona', 'reincidente'];
const CATEGORIA: Record<Perfil, CategoriaIlicita | undefined> = { honesto: undefined, honesto_fin: undefined, honesto_rico: undefined, ocasional: 'pequenos', recorrente: 'patrimonial', furtos: 'patrimonial', contrabando: 'mercado', organizado: 'grupo', digital: 'fraude', fraudes: 'fraude', dono: 'mercado', integrante: 'grupo', lider: 'grupo', abandona: 'patrimonial', reincidente: 'patrimonial' };

/** As respostas do perfil às perguntas do ano (o caminho e o resto da vida). */
function responder(v: Vida, p: Perfil, ano: number): Vida {
  for (let i = 0; i < 14 && v.momento && !v.morte; i++) {
    const m = v.momento!;
    const livre = (id: string) => m.opcoes.find(o => o.id === id && !o.bloqueio);
    let op;
    const crime = !p.startsWith('honesto') && !(p === 'abandona' && ano >= 5);
    if (m.id === 'ilic_rumo') op = !crime ? livre('parar_esquema') : p === 'ocasional' ? livre('moita') : livre('seguir_esquema');
    else if (m.id === 'ilic_trabalho') op = p === 'ocasional' || !crime ? livre('recusar') : livre('participar');
    else if (m.id === 'ilic_atrito') op = livre('ceder');
    else if (m.id === 'ilic_cerco') op = livre('advogado');
    else if (m.id === 'ilic_proposta') op = livre('recusar') ?? m.opcoes.find(o => !o.bloqueio && !/aceit|entrar/.test(o.id));
    else if (crime) op = m.opcoes.find(o => !o.bloqueio && !/parar|largar|sair|recusar|denunciar|ajuda|mudar|sumir|cortar|cooperar|entregar/.test(o.id));
    op ??= ['recusar', 'negociar', 'aportar', 'manter', 'esperar'].map(id => livre(id)).find(Boolean) ?? m.opcoes.find(o => !o.bloqueio) ?? m.opcoes[0];
    v = executar(v, { tipo: 'decidir', opcaoId: op.id }).vida;
  }
  return v;
}

function comecar(p: Perfil, s: number): Vida {
  let v = adulto(28, { semente: 1000 + s * 17, municipioId: 'sao-paulo-sp' });
  v.trabalho.atual = undefined;
  contratar(v, criarRng(s), ocupacao(p === 'fraudes' || p === 'honesto_fin' ? 'analista_financeiro' : 'assistente_adm'));
  v.financas.dividas = []; v.financas.negativado = false; v.momento = null; delete v.fila;
  v.financas.conta = p === 'dono' || p === 'lider' || p === 'honesto_rico' ? 1_000_000 : 60_000;
  delete v.fatos['proposta_ilicita'];
  v.justica = undefined;
  v.caminhos.envolvimento = undefined;
  const cat = CATEGORIA[p];
  if (!cat) return v;
  return transacao(v, (x, r) => {
    if (p === 'reincidente') x.justica = { antecedentes: [{ t: x.t - 72, categoria: 'patrimonial', desfecho: 'prisao', anos: 2 }] };
    if (p === 'digital') x.mente.cognicao = Math.max(x.mente.cognicao, 70);
    entrar(x, cat, undefined, r);
    const e = x.caminhos.envolvimento!;
    if (p === 'lider') { for (const s2 of Object.values(e.especializacoes ?? {})) if (s2) { s2.experiencia = 60; s2.posto = 3; } e.reputacao = 65; }
    if (p === 'dono') for (const s2 of Object.values(e.especializacoes ?? {})) if (s2) s2.experiencia = 35;
    const ramo: Ramo = cat === 'mercado' ? 'contrabando' : cat === 'grupo' ? 'organizado' : cat === 'fraude' ? 'fraudes' : 'furtos';
    criarContato(x, ramo, ramo === 'contrabando' ? 'fornecedor' : ramo === 'organizado' ? 'chefe' : 'parceiro');
    if (p === 'lider') { const a = criarContato(x, ramo, 'parceiro'); const b = criarContato(x, ramo, 'protegido', 1); e.fichas![a].confianca = 70; e.fichas![b].confianca = 70; }
  }).vida;
}

/** O que o perfil faz no ano (as ações da tela, com as regras da tela). */
function politica(p: Perfil, v: Vida, ano: number): Vida {
  const investir = (reserva: number) => { if (v.financas.conta > reserva * 2) v = tenta(v, { tipo: 'investir', destino: 'pos_fixado', valor: Math.round(v.financas.conta - reserva) }); };
  const env = v.caminhos.envolvimento;
  const ativo = !!env && env.parou === undefined && !v.justica?.prisao;
  const sub = (oque: string, ramo?: Ramo) => { v = tenta(v, { tipo: 'submundo', oque: oque as never, ramo }); };
  if (ativo) switch (p) {
    case 'ocasional': if (ano % 3 === 0) sub('servico_pequeno', 'furtos'); break;
    case 'recorrente': case 'reincidente': case 'abandona': sub('servico_pequeno', 'furtos'); break;
    case 'furtos': sub('servico_pequeno', 'furtos'); sub('servico_maior', 'furtos'); break;
    case 'contrabando': if ((env!.especializacoes?.contrabando?.estoque ?? 0) > 0) sub('vender_estoque', 'contrabando'); else sub('comprar_lote', 'contrabando'); break;
    case 'organizado': sub('tarefa_do_grupo', 'organizado'); sub('pedir_para_subir', 'organizado'); break;
    case 'integrante': if (ano % 2 === 0) sub('tarefa_do_grupo', 'organizado'); break;
    case 'digital': if (ano === 0) { sub('entrar_ramo', 'digital'); sub('largar_ramo', 'fraudes'); } sub('encomenda', 'digital'); sub('aprender', 'digital'); break;
    case 'fraudes': sub('esquema_de_influencia', 'fraudes'); break;
    case 'dono': {
      if (ano === 0) v = tenta(v, { tipo: 'clandestino', oque: 'abrir', alvo: 'mercadorias' });
      const n = negocios(v).find(x => x.estado === 'ativo');
      if (n && n.caixa > 30000) v = tenta(v, { tipo: 'clandestino', oque: 'retirar', negocioId: n.id });
      break;
    }
    case 'lider': {
      if (ano === 0) v = tenta(v, { tipo: 'clandestino', oque: 'abrir', alvo: 'organizacao' });
      const n = negocios(v).find(x => x.estado === 'ativo');
      if (n && ano >= 2) v = tenta(v, { tipo: 'clandestino', oque: 'fundar_organizacao' });
      if (n && n.caixa > 60000) v = tenta(v, { tipo: 'clandestino', oque: 'retirar', negocioId: n.id });
      break;
    }
  }
  if (p === 'abandona' && ano === 5 && env && env.parou === undefined) {
    for (const n of negocios(v).filter(x => x.estado === 'ativo')) v = tenta(v, { tipo: 'clandestino', oque: 'encerrar', negocioId: n.id });
    v = transacao(v, x => parar(x, 'decidiu sair')).vida;
  }
  investir(40000);
  return v;
}

const marcosDe = () => ({ 10: [] as number[], 20: [] as number[], 30: [] as number[] });
for (const p of PERFIS) {
  const m = marcosDe();
  const c = { investigacoes: 0, arquivadas: 0, processos: 0, absolvicoes: 0, condenacoes: 0, prisoes: 0, negociosFracassados: 0, negocios: 0, saidas: 0, saidasLimpa: 0, vidas: 0, anomalias: 0 };
  const desfechos: Record<string, number> = {};
  for (let s = 0; s < N; s++) {
    let v = comecar(p, s);
    const antesDeComecar = (v.justica?.antecedentes.length ?? 0);
    let tParou: number | undefined;
    for (let a = 0; a < ANOS && !v.morte; a++) {
      v = politica(p, v, a);
      v = responder(avancarAno(v).vida, p, a);
      if (tParou === undefined && v.caminhos.envolvimento?.parou !== undefined) tParou = v.caminhos.envolvimento.parou;
      const b = balanco(v).liquido;
      if (!Number.isFinite(b) || b > 1e12) c.anomalias++;
      if ([10, 20, 30].includes(a + 1)) m[(a + 1) as 10 | 20 | 30].push(b);
    }
    c.vidas++;
    const ants = (v.justica?.antecedentes ?? []).slice(antesDeComecar);
    c.investigacoes += v.fatos['investigacoes'] ?? 0;
    c.arquivadas += v.fatos['investigacoes_arquivadas'] ?? 0;
    c.processos += ants.length + (v.justica?.processo ? 1 : 0);
    c.absolvicoes += ants.filter(x => x.desfecho === 'absolvicao').length;
    c.condenacoes += ants.filter(x => x.desfecho === 'alternativa' || x.desfecho === 'socioeducativa').length;
    c.prisoes += ants.filter(x => x.desfecho === 'prisao').length;
    for (const n of negocios(v)) { c.negocios++; if (n.estado === 'desmantelado' || (n.estado === 'encerrado' && n.capital <= 0)) c.negociosFracassados++; }
    if (tParou !== undefined && !p.startsWith('honesto')) { c.saidas++; if (!ants.some(x => x.t > tParou! + 12) && !v.justica?.prisao) c.saidasLimpa++; }
    const d = ants.some(x => x.desfecho === 'prisao') ? 'preso' : ants.some(x => x.desfecho === 'alternativa') ? 'condenado sem prisão' : ants.some(x => x.desfecho === 'absolvicao') ? 'processado e absolvido' : (v.fatos['investigacoes'] ?? 0) > 0 ? 'investigado, sem processo' : 'nunca investigado';
    desfechos[d] = (desfechos[d] ?? 0) + 1;
  }
  const mm = (a: 10 | 20 | 30) => `${a}a ${k(pct(m[a], 0.1))}/${k(pct(m[a], 0.5))}/${k(pct(m[a], 0.9))}`;
  console.log(`${p.padEnd(11)} ${mm(10)} | ${mm(20)} | ${mm(30)} | invest ${c.investigacoes} arq ${c.arquivadas} proc ${c.processos} absolv ${c.absolvicoes} cond ${c.condenacoes} pris ${c.prisoes} | negócios ${c.negocios} fracassos ${c.negociosFracassados} | saídas ${c.saidas} limpas ${c.saidasLimpa} | ${Object.entries(desfechos).map(([x, n]) => `${x}: ${n}`).join(', ')} | anomalias ${c.anomalias}`);
}
