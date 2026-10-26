/**
 * REWORK 12.25 — o Submundo vivo em vidas longas: dez perfis pedidos (ocasional, profissional, integrante de facção, líder
 * de organização, dono de negócio clandestino, milionário, foragido, preso, ex-criminoso, quem nunca entrou) e um
 * especialista por ramo. Cada perfil joga com as ações da tela (as encomendas, os contatos, as organizações, a Justiça, o
 * rumo) e responde às perguntas do caminho de um jeito coerente.
 *
 * Mede aos 10/20/30 anos o patrimônio (p10/p50/p90) e, na vida inteira, o que a diversão pede:
 *   - anos até a primeira progressão (o primeiro patamar) e até a liderança (posto ≥ 4 ou organização própria)
 *   - oportunidades diferentes vistas (tipos de encomenda + cenas do Submundo)
 *   - repetição: a pergunta do rumo por ano ativo; a mesma cena em menos de 3 anos
 *   - anos sem nenhuma escolha interessante (nem decisão do caminho, nem proposta, nem ação nova possível)
 *   - a maior sequência de fracassos seguidos
 *   - saídas (e se ficaram limpas), desfechos na Justiça, mandados, prisões
 *   - contas: linhas de ajuste no extrato (tem de ser zero), NaN, o dinheiro por fora no extrato
 *
 *   npx esbuild scripts/sim/submundo125.ts --bundle --platform=node --format=esm --outfile=<scratch>/s.mjs && N=20 ANOS=30 node <scratch>/s.mjs
 */
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { adulto } from '../../src/motor/__tests__/cenarios';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { podeTentar } from '../../src/motor/plausibilidade';
import { balanco } from '../../src/motor/sistemas/dinheiro';
import { contratar } from '../../src/motor/sistemas/trabalho';
import { entrar } from '../../src/motor/sistemas/ilicito';
import { criarContato, contatosAtivos } from '../../src/motor/sistemas/submundo';
import { negocios } from '../../src/motor/sistemas/clandestinos';
import { abertas, delegadas, limiteDeDelegadas, TIPOS } from '../../src/motor/sistemas/encomendas';
import { acoesComContato } from '../../src/motor/sistemas/redeCriminal';
import { orgsDaCidade, relacaoCom, garantirCidade, nivelDe, orgViva } from '../../src/motor/sistemas/faccoes';
import { estadoNoSubmundo, garantirCarreira } from '../../src/motor/sistemas/carreiraCriminal';
import { abrirProcesso, prender } from '../../src/motor/sistemas/justica';
import { conciliar } from '../../src/motor/sistemas/extrato';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import { criarRng } from '../../src/motor/rng';
import { transacao } from '../../src/motor/nucleo';
import type { CategoriaIlicita, Ramo, Vida } from '../../src/motor/tipos';

await carregarMundo();
const N = Number(process.env.N ?? 20);
const ANOS = Number(process.env.ANOS ?? 30);
const pct = (xs: number[], p: number) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : NaN; };
const k = (x: number) => (!Number.isFinite(x) ? '—' : Math.abs(x) >= 1e6 ? `${(x / 1e6).toFixed(1)}mi` : `${Math.round(x / 1000)}k`);
const tenta = (v: Vida, a: Acao): Vida => (podeTentar(disponibilidade(v, a)) ? executar(v, a).vida : v);

type Perfil = 'nunca' | 'ocasional' | 'profissional' | 'integrante' | 'lider' | 'lider_cauteloso' | 'dono' | 'milionario' | 'foragido' | 'preso' | 'ex' | 'furtos' | 'contrabando' | 'digital' | 'fraudes';
const PERFIS = (process.env.PERFIS?.split(',') as Perfil[]) ?? ['nunca', 'ocasional', 'profissional', 'integrante', 'lider', 'lider_cauteloso', 'dono', 'milionario', 'foragido', 'preso', 'ex', 'furtos', 'contrabando', 'digital', 'fraudes'];
const CATEGORIA: Record<Perfil, CategoriaIlicita | undefined> = { nunca: undefined, ocasional: 'pequenos', profissional: 'patrimonial', integrante: 'grupo', lider: 'grupo', lider_cauteloso: 'grupo', dono: 'mercado', milionario: 'fraude', foragido: 'patrimonial', preso: 'patrimonial', ex: 'patrimonial', furtos: 'patrimonial', contrabando: 'mercado', digital: 'fraude', fraudes: 'fraude' };
const crimeContinua = (p: Perfil, ano: number) => p !== 'nunca' && !(p === 'ex' && ano >= 4);

interface Medidas { cenas: Map<string, number[]>; rumos: number; anosAtivos: number; anosSemEscolha: number; tiposVistos: Set<string> }

function responder(v: Vida, p: Perfil, ano: number, m: Medidas): Vida {
  for (let i = 0; i < 16 && v.momento && !v.morte; i++) {
    const mo = { ...v.momento!, id: v.momento!.situacaoId };
    if (/^(ilic_|sub|jus_|pri_)/.test(mo.id)) { const xs = m.cenas.get(mo.id) ?? []; xs.push(v.t); m.cenas.set(mo.id, xs); m.tiposVistos.add(mo.id); }
    if (mo.id === 'ilic_rumo') m.rumos++;
    const livre = (id: string) => mo.opcoes.find(o => o.id === id && !o.bloqueio);
    const crime = crimeContinua(p, ano);
    let op;
    if (mo.id === 'ilic_rumo') op = !crime ? livre('sair_aos_poucos') ?? livre('parar_esquema') : p === 'ocasional' ? livre('moita') : livre('seguir_esquema');
    else if (mo.id === 'ilic_proposta') op = livre('recusar_proposta');
    else if (mo.id === 'jus_defesa') op = livre('particular') ?? livre('publica');
    else if (mo.id === 'jus_recurso') op = livre('recorrer');
    else if (mo.id === 'sub125_familia') op = p === 'ex' || p === 'ocasional' ? livre('prometer') ?? livre('contar') : livre('contar');
    else if (mo.id === 'sub125_disputa') op = (p === 'lider' || p === 'lider_cauteloso') ? livre('disputar') ?? livre('apoiar_1') : livre('apoiar_1') ?? livre('neutro');
    else if (mo.id === 'sub125_retorno' || mo.id === 'sub125_legado') op = livre('recusar');
    else if (mo.id === 'sub125_abrigo') op = livre('aceitar') ?? livre('mudar') ?? livre('seguir');
    else if (mo.id === 'pri_rotina') op = livre('os_dois') ?? livre('estudar');
    else if (mo.id === 'pri_saida') op = p === 'preso' ? livre('programa') : undefined;
    else if (crime) op = mo.opcoes.find(o => !o.bloqueio && !/parar|largar|sair|recusar|denunciar|ajuda|mudar|sumir|cortar|cooperar|entregar|negar/.test(o.id));
    op ??= ['recusar', 'negociar', 'aportar', 'manter', 'esperar', 'neutro', 'seguir'].map(id => livre(id)).find(Boolean) ?? mo.opcoes.find(o => !o.bloqueio) ?? mo.opcoes[0];
    v = executar(v, { tipo: 'decidir', opcaoId: op.id }).vida;
  }
  return v;
}

function comecar(p: Perfil, s: number): Vida {
  let v = adulto(26, { semente: 3000 + s * 31, municipioId: s % 3 === 0 ? 'rio-de-janeiro-rj' : 'sao-paulo-sp' });
  v.trabalho.atual = undefined;
  contratar(v, criarRng(s), ocupacao(p === 'fraudes' || p === 'milionario' ? 'analista_financeiro' : 'assistente_adm'));
  v.financas.dividas = []; v.financas.negativado = false; v.momento = null; delete v.fila;
  v.financas.conta = p === 'milionario' ? 20_000_000 : p === 'dono' || p === 'lider' || p === 'lider_cauteloso' ? 600_000 : 40_000;
  delete v.fatos['proposta_ilicita'];
  v.justica = undefined;
  v.caminhos.envolvimento = undefined;
  const cat = CATEGORIA[p];
  if (!cat) return v;
  return transacao(v, (x, r) => {
    if (p === 'digital') x.mente.cognicao = Math.max(x.mente.cognicao, 70);
    entrar(x, cat, undefined, r);
    const e = x.caminhos.envolvimento!;
    const ramo: Ramo = cat === 'mercado' ? 'contrabando' : cat === 'grupo' ? 'organizado' : cat === 'fraude' ? 'fraudes' : 'furtos';
    criarContato(x, ramo, ramo === 'contrabando' ? 'fornecedor' : ramo === 'organizado' ? 'chefe' : 'parceiro');
    garantirCidade(x);
    if ((p === 'lider' || p === 'lider_cauteloso')) {
      for (const s2 of Object.values(e.especializacoes ?? {})) if (s2) { s2.experiencia = 60; s2.posto = 4; }
      e.reputacao = 65;
      const o = orgsDaCidade(x).find(z => z.ramo === 'organizado')!;
      const rel = relacaoCom(x, o); rel.relacao = 'membro'; rel.nivel = 4; rel.lealdade = 65;
    }
    if (p === 'integrante') { const o = orgsDaCidade(x).find(z => z.ramo === 'organizado')!; const rel = relacaoCom(x, o); rel.relacao = 'aliada'; rel.lealdade = 50; }
    if (p === 'foragido') { abrirProcesso(x, r, 'patrimonial'); if (x.justica?.prisao) { x.justica.prisao = undefined; } if (x.justica?.processo) x.justica.processo.tJulgamento = x.t + 6; }
    if (p === 'preso') { x.justica = { antecedentes: [{ t: x.t, categoria: 'patrimonial', desfecho: 'prisao', anos: 4 }] }; prender(x, x.t + 30, 'fechado', 'pena'); x.justica.prisao!.penaMeses = 48; e.parou = x.t; }
  }).vida;
}

/** O ano do perfil, com as ações da tela. */
function politica(p: Perfil, v: Vida, ano: number, m: Medidas): Vida {
  const env = v.caminhos.envolvimento;
  const ativo = !!env && env.parou === undefined && !v.justica?.prisao;
  const crime = (a: Acao['tipo'] extends never ? never : Parameters<typeof tenta>[1]) => { v = tenta(v, a); };
  let escolhas = 0;
  const conta = (a: Acao) => { if (podeTentar(disponibilidade(v, a))) escolhas++; };
  if (ativo && crimeContinua(p, ano)) {
    // As propostas: o ocasional pega só as pequenas e seguras; os outros, as que cabem.
    for (const x of abertas(v)) {
      m.tiposVistos.add(x.tipo);
      conta({ tipo: 'crime', acao: { area: 'encomenda', oque: 'aceitar', id: x.id } });
      if ((p === 'ocasional' && (x.gravidade > 1 || x.chance < 0.7)) || (p === 'lider_cauteloso' && x.gravidade === 3)) { crime({ tipo: 'crime', acao: { area: 'encomenda', oque: 'recusar', id: x.id } }); continue; }
      if (!x.negociada && x.gravidade >= 2) crime({ tipo: 'crime', acao: { area: 'encomenda', oque: 'negociar', id: x.id } });
      crime({ tipo: 'crime', acao: { area: 'encomenda', oque: 'aceitar', id: x.id } });
    }
    // Os contatos: conversar com o de mais confiança; fazer um favor de vez em quando; acertar o que deve.
    const cs = contatosAtivos(v);
    for (const c of cs.slice(0, 2)) {
      const acs = acoesComContato(v, c.id);
      escolhas += acs.length ? 1 : 0;
      if (acs.includes('acertar')) crime({ tipo: 'crime', acao: { area: 'contato', oque: 'acertar', pessoaId: c.id } });
      crime({ tipo: 'crime', acao: { area: 'contato', oque: 'conversar', pessoaId: c.id } });
      if (p !== 'ocasional' && ano % 2 === 0) crime({ tipo: 'crime', acao: { area: 'contato', oque: 'propor_trabalho', pessoaId: c.id } });
    }
    // Encomendar a alguém (quem já tem patamar).
    if (p !== 'ocasional' && delegadas(v).length < limiteDeDelegadas(v)) {
      const c = cs.find(x => x.f.confianca >= 40 && !delegadas(v).some(d => d.pessoaId === x.id));
      if (c) crime({ tipo: 'crime', acao: { area: 'encomenda', oque: 'delegar', pessoaId: c.id, trabalho: TIPOS[c.f.especialidade][ano % 3 === 2 ? 1 : 0].id } });
    }
    // As organizações: filiar, pedir tarefa, pedir promoção, disputar, administrar.
    if (p === 'integrante' || (p === 'lider' || p === 'lider_cauteloso') || p === 'profissional') {
      for (const o of orgsDaCidade(v).filter(z => v.caminhos.envolvimento?.organizacoes?.some(r => r.id === z.id))) {
        crime({ tipo: 'crime', acao: { area: 'org', oque: 'filiar', orgId: o.id } });
        crime({ tipo: 'crime', acao: { area: 'org', oque: 'tarefa', orgId: o.id } });
        crime({ tipo: 'crime', acao: { area: 'org', oque: 'promocao', orgId: o.id } });
        if ((p === 'lider' || p === 'lider_cauteloso')) {
          crime({ tipo: 'crime', acao: { area: 'org', oque: 'disputar', orgId: o.id } });
          if (o.coesao < 50) crime({ tipo: 'crime', acao: { area: 'org', oque: 'mediar', orgId: o.id } });
          if (o.pressao >= (p === 'lider_cauteloso' ? 35 : 50)) crime({ tipo: 'crime', acao: { area: 'org', oque: 'recolher', orgId: o.id } });
          else crime({ tipo: 'crime', acao: { area: 'org', oque: ano % 2 ? 'prioridade_negocios' : 'prioridade_consolidar', orgId: o.id } });
        }
      }
    }
    // As frentes de cada especialista (as ações de antes, que continuam).
    const sub = (oque: string, ramo?: Ramo) => { v = tenta(v, { tipo: 'submundo', oque: oque as never, ramo }); };
    if (p === 'furtos' || p === 'profissional' || p === 'foragido') { sub('servico_pequeno', 'furtos'); sub('servico_maior', 'furtos'); }
    if (p === 'contrabando' || p === 'dono') { if ((v.caminhos.envolvimento?.especializacoes?.contrabando?.estoque ?? 0) > 0) sub('vender_estoque', 'contrabando'); else sub('comprar_lote', 'contrabando'); }
    if (p === 'digital') { if (ano === 0) { sub('entrar_ramo', 'digital'); sub('largar_ramo', 'fraudes'); } sub('encomenda', 'digital'); sub('aprender', 'digital'); }
    if (p === 'fraudes' || p === 'milionario') sub('esquema_de_influencia', 'fraudes');
    if (p === 'dono') {
      if (ano === 0) v = tenta(v, { tipo: 'clandestino', oque: 'abrir', alvo: 'mercadorias' });
      const n = negocios(v).find(x => x.estado === 'ativo');
      if (n && n.caixa > 30000) v = tenta(v, { tipo: 'clandestino', oque: 'retirar', negocioId: n.id });
    }
    if (p === 'ex' && ano === 3) crime({ tipo: 'crime', acao: { area: 'rumo', oque: 'sair_aos_poucos' } });
  }
  // A Justiça: a estratégia, a audiência (o foragido falta), o recurso; o procurado se vira.
  if (v.justica?.processo && !v.justica.foragido) {
    crime({ tipo: 'crime', acao: { area: 'justica', oque: 'estrategia_delegar' } });
    crime({ tipo: 'crime', acao: { area: 'justica', oque: 'estrategia_contestar' } });
    crime({ tipo: 'crime', acao: { area: 'justica', oque: p === 'foragido' && ano < 2 ? 'audiencia_faltar' : 'audiencia_preparar' } });
    crime({ tipo: 'crime', acao: { area: 'justica', oque: 'audiencia_comparecer' } });
  }
  crime({ tipo: 'crime', acao: { area: 'justica', oque: 'recorrer' } });
  if (v.justica?.foragido) { crime({ tipo: 'crime', acao: { area: 'justica', oque: 'abrigo' } }); crime({ tipo: 'crime', acao: { area: 'justica', oque: 'mudar_endereco' } }); if (ano >= 8) crime({ tipo: 'crime', acao: { area: 'justica', oque: 'apresentar_se' } }); }
  // Preso: a rotina de dentro.
  if (v.justica?.prisao) for (const oque of ['estudar', 'trabalhar', 'cartas', 'saude', 'visitas', 'preparar_saida'] as const) { conta({ tipo: 'prisao', oque }); v = tenta(v, { tipo: 'prisao', oque }); }
  if (v.financas.conta > 120_000) v = tenta(v, { tipo: 'investir', destino: 'pos_fixado', valor: Math.round(v.financas.conta - 60_000) });
  if (escolhas === 0 && !v.momento && ativo) m.anosSemEscolha++;
  return v;
}

for (const p of PERFIS) {
  const pat = { 10: [] as number[], 20: [] as number[], 30: [] as number[] };
  const c = { vidas: 0, primeiraProgressao: [] as number[], lideranca: [] as number[], tipos: [] as number[], rumoPorAno: [] as number[], repetidas: 0, semEscolha: [] as number[], seqFalhas: [] as number[], saidas: 0, saidasLimpas: 0, mandados: 0, prisoes: 0, absolv: 0, alternativas: 0, processos: 0, investigacoes: 0, ajustes: 0, anomalias: 0, porForaAno: [] as number[], estados: {} as Record<string, number>, encomendas: 0, delegadasOk: 0, delegadasTraidas: 0, orgsExtintas: 0, sucessoes: 0, quaisRepetem: {} as Record<string, number>, vidasPresas: 0, vidasCondenadas: 0, anosPresos: 0, diag: [] as string[] };
  for (let s = 0; s < N; s++) {
    let v = comecar(p, s);
    const m: Medidas = { cenas: new Map(), rumos: 0, anosAtivos: 0, anosSemEscolha: 0, tiposVistos: new Set() };
    let prog: number | undefined, lid: number | undefined, maxFalhas = 0, foiProcurado = false, presoAnos = 0, ultProc: number | undefined;
    for (let a = 0; a < ANOS && !v.morte; a++) {
      v = politica(p, v, a, m);
      const r = avancarAno(v);
      v = responder(r.vida, p, a, m);
      const e = v.caminhos.envolvimento;
      if (e && e.parou === undefined && !v.justica?.prisao) m.anosAtivos++;
      if (e) {
        const car = garantirCarreira(e);
        if (prog === undefined && car.patamar >= 1) prog = a + 1;
        if (lid === undefined && (e.organizacoes ?? []).some(o => (o.relacao === 'membro' && o.saiu === undefined && nivelDe(v, o) >= 4) || o.propria)) lid = a + 1;
        maxFalhas = Math.max(maxFalhas, car.falhasSeguidas ?? 0);
      }
      if (v.justica?.foragido) foiProcurado = true;
      if (v.justica?.prisao) presoAnos++;
      const pr = v.justica?.processo;
      if (pr && pr.tInicio !== ultProc) { ultProc = pr.tInicio; const rl = (e?.organizacoes ?? []).find(o => o.relacao === 'membro' && o.saiu === undefined); c.diag.push(`${pr.categoria}/n${rl ? nivelDe(v, rl) : '-'}/prov${pr.provas}`); }
      const ex = v.financas.extrato;
      if (ex && ex.tFim === v.t) { const cc = conciliar(ex); if (!cc.ok) c.ajustes++; c.porForaAno.push(ex.linhas.filter(l => l.tipo === 'por_fora').reduce((s2, l) => s2 + l.conta, 0)); }
      const b = balanco(v).liquido;
      if (!Number.isFinite(b) || !Number.isFinite(v.financas.conta) || (e && !Number.isFinite(e.exposicao))) c.anomalias++;
      if ([10, 20, 30].includes(a + 1)) pat[(a + 1) as 10 | 20 | 30].push(b);
    }
    c.vidas++;
    if (prog !== undefined) c.primeiraProgressao.push(prog);
    if (lid !== undefined) c.lideranca.push(lid);
    c.tipos.push(m.tiposVistos.size);
    c.rumoPorAno.push(m.anosAtivos ? m.rumos / m.anosAtivos : 0);
    for (const [id, ts] of m.cenas) for (let i = 1; i < ts.length; i++) if (ts[i] - ts[i - 1] < 36) { c.repetidas++; c.quaisRepetem[id] = (c.quaisRepetem[id] ?? 0) + 1; }
    c.semEscolha.push(m.anosSemEscolha);
    c.seqFalhas.push(maxFalhas);
    const e = v.caminhos.envolvimento;
    if (e?.parou !== undefined && p !== 'preso') { c.saidas++; if (!v.justica?.prisao && !v.justica?.processo) c.saidasLimpas++; }
    if (foiProcurado) c.mandados++;
    const ants = v.justica?.antecedentes ?? [];
    c.prisoes += ants.filter(x => x.desfecho === 'prisao').length;
    if (presoAnos > 0) c.vidasPresas++;
    if (ants.some(x => x.desfecho === 'prisao')) c.vidasCondenadas++;
    c.anosPresos += presoAnos;
    c.absolv += ants.filter(x => x.desfecho === 'absolvicao').length;
    c.alternativas += ants.filter(x => x.desfecho === 'alternativa' || x.desfecho === 'acordo').length;
    c.processos += ants.length;
    c.investigacoes += v.fatos['investigacoes'] ?? 0;
    c.encomendas += (e?.encomendas ?? []).filter(x => x.direcao === 'recebida' && x.estado === 'concluida').length;
    c.delegadasOk += (e?.encomendas ?? []).filter(x => x.direcao === 'delegada' && x.estado === 'concluida').length;
    c.delegadasTraidas += (e?.encomendas ?? []).filter(x => x.direcao === 'delegada' && x.estado === 'traida').length;
    const est = estadoNoSubmundo(v).estado;
    c.estados[est] = (c.estados[est] ?? 0) + 1;
    c.orgsExtintas += Object.values(v.mundoCriminal?.orgs ?? {}).filter(o => o.estado === 'extinta').length;
    c.sucessoes += Object.values(v.mundoCriminal?.orgs ?? {}).reduce((s2, o) => s2 + o.historia.filter(h => h.texto.startsWith('A disputa terminou')).length, 0);
    void orgViva;
  }
  const med = (xs: number[]) => (xs.length ? pct(xs, 0.5) : NaN);
  const mm = (a: 10 | 20 | 30) => `${a}a ${k(pct(pat[a], 0.1))}/${k(pct(pat[a], 0.5))}/${k(pct(pat[a], 0.9))}`;
  console.log(`\n${p.toUpperCase()} (${c.vidas} vidas)  patrimônio ${mm(10)} | ${mm(20)} | ${mm(30)}`);
  console.log(`  1ª progressão: ${c.primeiraProgressao.length}/${c.vidas} vidas, mediana ${med(c.primeiraProgressao)} anos · liderança: ${c.lideranca.length}/${c.vidas}, mediana ${med(c.lideranca)} anos`);
  console.log(`  oportunidades diferentes (mediana) ${med(c.tipos)} · rumo por ano ativo ${(c.rumoPorAno.reduce((a, b) => a + b, 0) / Math.max(1, c.rumoPorAno.length)).toFixed(2)} · cenas repetidas <3 anos: ${c.repetidas} ${JSON.stringify(c.quaisRepetem)} · anos sem escolha (mediana) ${med(c.semEscolha)} · maior sequência de fracassos (p90) ${pct(c.seqFalhas, 0.9)}`);
  console.log(`  encomendas cumpridas ${c.encomendas} · delegadas ok ${c.delegadasOk} traídas ${c.delegadasTraidas} · invest ${c.investigacoes} · processos ${c.processos} (absolv ${c.absolv}, sem prisão ${c.alternativas}, prisão ${c.prisoes}) · com mandado ${c.mandados} · saídas ${c.saidas} (limpas ${c.saidasLimpas})`);
  console.log(`  condenadas à prisão: ${c.vidasCondenadas}/${c.vidas} (${Math.round(c.vidasCondenadas / c.vidas * 100)}%) · passaram por custódia (inclui preventiva): ${c.vidasPresas}/${c.vidas} (${Math.round(c.vidasPresas / c.vidas * 100)}%) · anos presos por vida ${(c.anosPresos / c.vidas).toFixed(1)} · processos abertos (categoria/posto/provas): ${c.diag.slice(0, 14).join(' ')}`);
  console.log(`  por fora/ano (p50 dos anos) ${k(pct(c.porForaAno, 0.5))} p90 ${k(pct(c.porForaAno, 0.9))} · estados finais ${JSON.stringify(c.estados)} · sucessões nas orgs ${c.sucessoes} · orgs extintas ${c.orgsExtintas} · ajustes no extrato ${c.ajustes} · anomalias ${c.anomalias}`);
}
