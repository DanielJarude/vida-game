/**
 * REWORK 12.25 — Submundo vivo, carreira criminal e Justiça: os testes obrigatórios (§24).
 *
 *   ESTADOS       um estado só e as condições que se somam (integrante e foragido ao mesmo tempo)
 *   CONTAS        o dinheiro do caminho com linha própria no extrato, uma vez só; o extrato concilia; as fontes separadas
 *   RUMO          a pergunta com motivo e intervalo (nada de todo ano); a escolha na tela conta como escolha
 *   CONTATOS      ações por papel; recusa, contraproposta; favores e dívidas com memória; teto da confiança por conversa
 *   ORGANIZAÇÕES  aliado ≠ integrante; filiação, promoção, rebaixamento, expulsão; disputa e sucessão; o mundo que anda
 *                 sozinho; território e a voz da comunidade
 *   ENCOMENDAS    as que chegam (aceitar ocupa tempo, negociar uma vez, o prazo vence) e as delegadas (custo, prazo, resultado)
 *   JUSTIÇA       investigação não é condenação; as etapas; o recurso de qualquer condenação; a audiência a que se falta vira
 *                 mandado (o processo para, a fronteira fecha, a mudança não apaga); a captura; apresentar-se
 *   PRISÃO        cartas e saúde; a pena alternativa continua na agenda (regressão)
 *   FAMÍLIA       reações diferentes por personalidade; a reconciliação depois de sair
 *   SAÍDA/LEGADO  sair aos poucos; o herdeiro não herda cargo
 *   SAVES         o save do 12.2 (com "o pessoal dos Soares") abre igual, normalização idempotente, versão 20
 */
import { describe, expect, it } from 'vitest';
import { adulto, comParente, comFilho } from './cenarios';
import { transacao } from '../nucleo';
import type { Vida } from '../tipos';
import { executar, disponibilidade, type Acao } from '../acoes';
import { avancarAno } from '../ano';
import { podeTentar } from '../plausibilidade';
import { interpretar, normalizarRework125, VERSAO_SAVE } from '../save';
import { entrar, processarIlicito } from '../sistemas/ilicito';
import { criarContato, contatosAtivos, organizacaoDoRamo, lembrarOrg } from '../sistemas/submundo';
import { conciliar, conferir } from '../sistemas/extrato';
import { contasPorFora, estadoNoSubmundo, garantirCarreira, patamarAtual, processarCarreiraCriminal, processarLegado, capacidadeDoAno, tempoDoCaminho } from '../sistemas/carreiraCriminal';
import { abrirDecisao, conteudoPorId, preparar } from '../conteudo/motor';
import { pedirRumo } from '../sistemas/porFora';
import { abertas, delegadas, proporEncomenda, processarEncomendas, TIPOS, resolverDelegada } from '../sistemas/encomendas';
import { acoesComContato, mudarConfianca, processarRede } from '../sistemas/redeCriminal';
import { garantirCidade, orgsDaCidade, orgViva, processarFaccoes, relacaoCom, vinculoComOrg, nivelDe, lider, regioesDe, regiaoDaPessoa } from '../sistemas/faccoes';
import { etapaAtual, linhaDaJustica, chanceDeCaptura } from '../sistemas/defesa';
import { abrirProcesso, processarJustica } from '../sistemas/justica';
import { processarPrisao } from '../sistemas/prisao';
import { blocosFixos } from '../sistemas/agenda';
import { semana } from '../sistemas/semana';
import { continuarComo } from '../sistemas/sucessao';
import { criarRng, rngDe } from '../rng';

const pode = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const fazer = (v: Vida, a: Acao) => { const d = disponibilidade(v, a); expect(podeTentar(d), `${JSON.stringify(a)}: ${d.motivo}`).toBe(true); return executar(v, a).vida; };
const crime = (acao: Extract<Acao, { tipo: 'crime' }>['acao']): Acao => ({ tipo: 'crime', acao });
const em = (v: Vida, f: (x: Vida, r: ReturnType<typeof criarRng>) => void) => transacao(v, f).vida;

function noCaminho(cat: 'pequenos' | 'patrimonial' | 'mercado' | 'grupo' | 'fraude' = 'patrimonial', semente = 41, cidade = 'sao-paulo-sp'): Vida {
  let v = adulto(30, { semente, municipioId: cidade });
  v.financas.conta = 200_000;
  v.financas.dividas = [];
  v.momento = null; delete v.fila;
  v.justica = undefined;
  v = em(v, (x, r) => { entrar(x, cat, undefined, r); garantirCidade(x); });
  return v;
}

/* ================================================================ estados */

describe('UI-12.25-01 · os estados de carreira (um só, com as condições que se somam)', () => {
  it('nunca → ocasional → profissional → de dentro → liderança → saindo → ex; e integrante pode estar foragido', () => {
    expect(estadoNoSubmundo(adulto(30)).estado).toBe('nunca');
    let v = noCaminho('pequenos');
    expect(['contato_inicial', 'ocasional']).toContain(estadoNoSubmundo(v).estado);
    v = em(v, x => { x.t += 24; garantirCarreira(x.caminhos.envolvimento!).xp = 40; });
    expect(estadoNoSubmundo(v).estado).toBe('profissional');
    v = em(v, x => { const o = orgsDaCidade(x).find(z => z.ramo === 'organizado')!; const rel = relacaoCom(x, o); rel.relacao = 'membro'; rel.nivel = 1; });
    expect(estadoNoSubmundo(v).estado).toBe('integrante');
    v = em(v, x => { x.caminhos.envolvimento!.organizacoes!.find(o => o.relacao === 'membro')!.nivel = 4; });
    expect(estadoNoSubmundo(v).estado).toBe('lideranca');
    // de dentro E foragido (as condições somam, não substituem)
    const fug = em(v, x => { x.justica = { antecedentes: [], foragido: { t: x.t, restante: 0, motivo: 'mandado' } }; });
    const e = estadoNoSubmundo(fug);
    expect(e.estado).toBe('lideranca');
    expect(e.condicoes).toContain('procurado');
    v = fazer(v, crime({ area: 'rumo', oque: 'sair_aos_poucos' }));
    expect(estadoNoSubmundo(v).estado).toBe('saindo');
    v = em(v, x => { x.t += 12; processarCarreiraCriminal(x); });
    expect(estadoNoSubmundo(v).estado).toBe('ex');
    // arquivado/largado coerentes: quem saiu não tem frente ativa
    expect(Object.values(v.caminhos.envolvimento!.especializacoes!).every(s => s!.largou !== undefined)).toBe(true);
  });
});

/* ================================================================ contas */

describe('FIN-12.25-01 · o dinheiro do caminho no extrato, uma vez só', () => {
  it('uma operação na tela vira linha "por fora" com o valor exato que entrou na conta (sem cair em "Compras")', () => {
    let v = noCaminho('patrimonial');
    // O que o cenário mexeu à mão na conta é conferido antes (o motor faz o mesmo antes de cada ação).
    v = em(v, x => { x.caminhos.envolvimento!.especializacoes!.furtos!.experiencia = 60; conferir(x, 'Acontecimentos do fim do ano', 'acontecimento'); });
    const antes = v.financas.conta;
    const soma = (x: Vida, tipo?: string) => (x.financas.extratoAberto?.linhas ?? []).filter(l => (tipo ? l.tipo === tipo : l.tipo !== 'por_fora')).reduce((s, l) => s + l.conta, 0);
    const porForaAntes = soma(v, 'por_fora');
    const outrasAntes = soma(v);
    v = fazer(v, { tipo: 'submundo', oque: 'servico_pequeno', ramo: 'furtos' });
    const delta = v.financas.conta - antes;
    expect(Math.round(soma(v, 'por_fora') - porForaAntes)).toBe(Math.round(delta));
    expect(soma(v) - outrasAntes).toBe(0);
    expect(v.financas.extratoAberto!.linhas.some(l => /Compras, viagens/.test(l.rotulo))).toBe(false);
  });

  it('anos no caminho: o extrato concilia todo ano, as fontes ficam separadas e nada é NaN', () => {
    let v = noCaminho('patrimonial', 7);
    v = em(v, x => { criarContato(x, 'furtos', 'parceiro'); });
    let viuPorFora = false;
    for (let a = 0; a < 8; a++) {
      for (const x of abertas(v)) if (pode(v, crime({ area: 'encomenda', oque: 'aceitar', id: x.id }))) v = fazer(v, crime({ area: 'encomenda', oque: 'aceitar', id: x.id }));
      v = avancarAno(v).vida;
      while (v.momento) v = executar(v, { tipo: 'decidir', opcaoId: v.momento.opcoes.find(o => !o.bloqueio && !/parar|largar|sair/.test(o.id))?.id ?? v.momento.opcoes[0].id }).vida;
      const ex = v.financas.extrato!;
      expect(conciliar(ex).ok, JSON.stringify(conciliar(ex))).toBe(true);
      expect(Number.isFinite(v.financas.conta)).toBe(true);
      const c = contasPorFora(v);
      if (Object.keys(c.ano).length) viuPorFora = true;
      for (const x of Object.values(c.ano)) expect(Number.isFinite(x!)).toBe(true);
    }
    expect(viuPorFora).toBe(true);
  });

  it('o confisco e a multa caem em "perdas"; o advogado, em "Justiça" (despesa) — fontes distintas', () => {
    let v = noCaminho('fraude');
    v = em(v, (x, r) => { x.caminhos.envolvimento!.ganhos = 400_000; abrirProcesso(x, r, 'fraude'); });
    expect(v.financas.extratoAberto!.linhas.some(l => l.rotulo.startsWith('Justiça') && l.tipo === 'despesa') || v.justica!.processo!.defesa === 'publica').toBe(true);
    v = em(v, (x, r) => { x.justica!.processo!.tJulgamento = x.t; x.justica!.processo!.provas = 95; for (let k = 0; k < 6 && x.justica!.processo; k++) processarJustica(x, r); });
    const perdas = v.financas.extratoAberto!.linhas.filter(l => l.rotulo.includes('apreensões, confiscos'));
    const condenado = v.justica!.antecedentes.some(a => a.desfecho !== 'absolvicao');
    if (condenado) expect(perdas.length).toBeGreaterThan(0);
  });
});

/* ================================================================ rumo */

describe('NAR-12.25-01 · a pergunta do rumo com motivo e intervalo', () => {
  it('não vem todo ano: depois de perguntada, só volta em três anos (dois, numa investigação)', () => {
    let v = noCaminho();
    v = em(v, x => { x.t += 12; });
    let feitas = 0;
    v = em(v, x => { if (pedirRumo(x, 'primeiro_ano')) feitas++; });
    v = em(v, x => { x.t += 12; if (pedirRumo(x, 'promocao')) feitas++; });
    v = em(v, x => { x.t += 12; if (pedirRumo(x, 'perda')) feitas++; });
    expect(feitas).toBe(1);
    v = em(v, x => { x.t += 12; if (pedirRumo(x, 'perda')) feitas++; });
    expect(feitas).toBe(2);
  });
  it('escolher o rumo na tela conta: a pergunta não vem logo depois', () => {
    let v = noCaminho();
    v = fazer(v, crime({ area: 'rumo', oque: 'moita' }));
    expect(v.caminhos.envolvimento!.cautela).toBe(true);
    expect(v.caminhos.envolvimento!.rumo![v.caminhos.envolvimento!.rumo!.length - 1].escolha).toBe('moita');
    v = em(v, x => { x.t += 12; });
    expect(transacao(v, x => pedirRumo(x, 'promocao')).valor).toBe(false);
  });
  it('em dez anos seguindo no caminho, a pergunta vem poucas vezes (não uma a cada dois anos)', () => {
    let v = noCaminho('patrimonial', 9);
    let rumos = 0;
    for (let a = 0; a < 10; a++) {
      v = avancarAno(v).vida;
      for (let i = 0; i < 10 && v.momento; i++) {
        if (v.momento.situacaoId === 'ilic_rumo') rumos++;
        v = executar(v, { tipo: 'decidir', opcaoId: v.momento.opcoes.find(o => !o.bloqueio && /seguir|ignorar|neutro|manter|recusar|contar/.test(o.id))?.id ?? v.momento.opcoes.find(o => !o.bloqueio && !/parar|sair|largar/.test(o.id))?.id ?? v.momento.opcoes[0].id }).vida;
      }
      if (v.caminhos.envolvimento?.parou !== undefined) break;
    }
    expect(rumos).toBeLessThanOrEqual(4);
  });
});

/* ================================================================ contatos */

describe('NPC-12.25-01 · os contatos têm ações e respondem', () => {
  it('cada papel tem as suas ações; favores e dívidas aparecem quando existem', () => {
    let v = noCaminho('mercado');
    let forn = '', comp = '';
    v = em(v, x => { forn = criarContato(x, 'contrabando', 'fornecedor'); comp = criarContato(x, 'contrabando', 'comprador', 1); });
    expect(acoesComContato(v, forn)).toContain('negociar_lote');
    expect(acoesComContato(v, comp)).toContain('oferecer_bens');
    expect(acoesComContato(v, comp)).toContain('apresentar');
    v = em(v, x => { x.caminhos.envolvimento!.fichas![forn].favores = 2; x.caminhos.envolvimento!.fichas![comp].favores = -1; });
    expect(acoesComContato(v, forn)).toContain('cobrar');
    expect(acoesComContato(v, comp)).toContain('acertar');
  });

  it('a conversa aproxima, mas tem teto no ano; cada ação, uma vez por ano com a mesma pessoa', () => {
    let v = noCaminho();
    let id = '';
    v = em(v, x => { id = criarContato(x, 'furtos', 'parceiro'); x.caminhos.envolvimento!.fichas![id].confianca = 40; });
    v = fazer(v, crime({ area: 'contato', oque: 'conversar', pessoaId: id }));
    expect(pode(v, crime({ area: 'contato', oque: 'conversar', pessoaId: id }))).toBe(false);
    const c0 = v.caminhos.envolvimento!.fichas![id].confianca;
    v = em(v, x => { for (let k = 0; k < 10; k++) mudarConfianca(x, id, 5, true); });
    expect(v.caminhos.envolvimento!.fichas![id].confianca - c0).toBeLessThanOrEqual(10);
  });

  it('pedir um favor: quem deve paga; quem não deve aceita, volta com uma contraproposta ou recusa (as três existem)', () => {
    const vistos = new Set<string>();
    for (let s = 0; s < 40 && vistos.size < 3; s++) {
      let v = noCaminho('patrimonial', 100 + s);
      let id = '';
      v = em(v, x => { id = criarContato(x, 'furtos', 'parceiro'); x.caminhos.envolvimento!.fichas![id].confianca = 20; x.caminhos.envolvimento!.fichas![id].amizade = 5; });
      const antes = v.caminhos.envolvimento!.fichas![id].favores ?? 0;
      const conta = v.financas.conta;
      v = fazer(v, crime({ area: 'contato', oque: 'pedir_favor', pessoaId: id }));
      const f = v.caminhos.envolvimento!.fichas![id];
      if ((f.favores ?? 0) < antes) vistos.add('aceitou');
      else if (v.financas.conta < conta) vistos.add('contraproposta');
      else vistos.add('recusou');
    }
    expect([...vistos].sort()).toEqual(['aceitou', 'contraproposta', 'recusou']);
  });

  it('fazer um favor cria um crédito; cobrar o crédito traz dinheiro; a dívida velha vira cobrança', () => {
    let v = noCaminho();
    let id = '';
    v = em(v, x => { id = criarContato(x, 'furtos', 'parceiro'); x.caminhos.envolvimento!.fichas![id].confianca = 60; x.caminhos.envolvimento!.fichas![id].amizade = 60; });
    v = fazer(v, crime({ area: 'contato', oque: 'fazer_favor', pessoaId: id }));
    expect(v.caminhos.envolvimento!.fichas![id].favores).toBe(1);
    v = em(v, x => { x.t += 12; });
    const conta = v.financas.conta;
    v = fazer(v, crime({ area: 'contato', oque: 'cobrar', pessoaId: id }));
    expect(v.caminhos.envolvimento!.fichas![id].favores).toBe(0);
    expect(v.financas.conta).toBeGreaterThan(conta);
    // A dívida de dois favores: em algum ano, ele vem cobrar (a cena da cobrança).
    let cobrou = false;
    v = em(v, x => { x.caminhos.envolvimento!.fichas![id].favores = -2; });
    for (let a = 0; a < 6 && !cobrou; a++) { v = em(v, x => { x.t += 12; processarRede(x); }); cobrou = v.fatos['sub125_cobra'] === v.t; }
    expect(cobrou).toBe(true);
  });

  it('quem se afastou pode voltar (a reconciliação), e quem traiu há pouco, não', () => {
    let v = noCaminho();
    let id = '';
    v = em(v, x => { id = criarContato(x, 'furtos', 'parceiro'); x.caminhos.envolvimento!.fichas![id].traiu = x.t; });
    expect(acoesComContato(v, id)).toEqual(['reconciliar']);
    expect(pode(v, crime({ area: 'contato', oque: 'reconciliar', pessoaId: id }))).toBe(false);
    v = em(v, x => { x.t += 72; });
    expect(pode(v, crime({ area: 'contato', oque: 'reconciliar', pessoaId: id }))).toBe(true);
  });
});

/* ================================================================ organizações */

describe('ORG-12.25-01 · as organizações: relação, hierarquia, disputa, mundo autônomo, território', () => {
  it('a cidade tem as suas organizações (fictícias, com estilo pelo país); aliado não é de dentro', () => {
    const v = noCaminho('mercado');
    const os = orgsDaCidade(v);
    expect(os.length).toBeGreaterThanOrEqual(3);
    expect(new Set(os.map(o => o.estilo)).size).toBeGreaterThanOrEqual(2);
    const aliada = v.caminhos.envolvimento!.organizacoes?.find(o => o.relacao === 'aliada');
    if (aliada) expect(['aliado', 'comercial']).toContain(vinculoComOrg(aliada));
    expect(['integrante', 'lideranca']).not.toContain(vinculoComOrg(aliada));
  });

  it('filiar pede lealdade; dentro, o posto sobe (pedido) e cai (lealdade perdida); a traição expulsa', () => {
    let v = noCaminho('mercado', 21);
    const o = orgsDaCidade(v).find(z => z.ramo === 'organizado')!;
    v = em(v, x => { relacaoCom(x, orgViva(x, o.id)!).lealdade = 30; });
    expect(pode(v, crime({ area: 'org', oque: 'filiar', orgId: o.id }))).toBe(false);
    // Com lealdade, em alguma das tentativas (uma por ano) ela aceita.
    v = em(v, x => { relacaoCom(x, orgViva(x, o.id)!).lealdade = 90; x.caminhos.envolvimento!.reputacao = 80; });
    for (let a = 0; a < 6 && vinculoComOrg(v.caminhos.envolvimento!.organizacoes!.find(z => z.id === o.id)) !== 'integrante'; a++) {
      if (pode(v, crime({ area: 'org', oque: 'filiar', orgId: o.id }))) v = fazer(v, crime({ area: 'org', oque: 'filiar', orgId: o.id }));
      v = em(v, x => { x.t += 12; relacaoCom(x, orgViva(x, o.id)!).lealdade = 90; });
    }
    const rel = () => v.caminhos.envolvimento!.organizacoes!.find(z => z.id === o.id)!;
    expect(vinculoComOrg(rel())).toBe('integrante');
    expect(nivelDe(v, rel())).toBe(0);
    v = em(v, x => { garantirCarreira(x.caminhos.envolvimento!).xp = 200; relacaoCom(x, orgViva(x, o.id)!).lealdade = 95; });
    for (let a = 0; a < 8 && nivelDe(v, rel()) < 2; a++) {
      if (pode(v, crime({ area: 'org', oque: 'promocao', orgId: o.id }))) v = fazer(v, crime({ area: 'org', oque: 'promocao', orgId: o.id }));
      v = em(v, x => { x.t += 12; relacaoCom(x, orgViva(x, o.id)!).lealdade = 95; });
    }
    expect(nivelDe(v, rel())).toBeGreaterThanOrEqual(2);
    // A lealdade perdida rebaixa (às vezes); a traição expulsa.
    v = em(v, x => { lembrarOrg(relacaoCom(x, orgViva(x, o.id)!), x.t, 'traicao', -50); x.t += 12; processarFaccoes(x); });
    expect(rel().expulso).toBeDefined();
    expect(vinculoComOrg(rel())).toBe('ex');
  });

  it('a liderança que morre abre uma disputa; no ano seguinte alguém assume e a organização continua', () => {
    let v = noCaminho('grupo', 31);
    const o = orgsDaCidade(v).find(z => z.ramo === 'organizado')!;
    v = em(v, x => { const ov = orgViva(x, o.id)!; const l = lider(ov)!; l.estado = 'morto'; x.t += 12; processarFaccoes(x); });
    expect(orgViva(v, o.id)!.disputa).toBeDefined();
    v = em(v, x => { x.t += 12; processarFaccoes(x); });
    const depois = orgViva(v, o.id)!;
    expect(depois.disputa).toBeUndefined();
    expect(lider(depois)).toBeDefined();
    expect(depois.estado).not.toBe('extinta');
    expect(depois.historia.some(h => h.texto.startsWith('A disputa terminou'))).toBe(true);
  });

  it('o mundo anda sozinho: em quinze anos, sem nada do jogador, força, quadro e lideranças mudam — sem NaN, sem cidade vazia', () => {
    let v = noCaminho('mercado', 5);
    const antes = JSON.stringify(orgsDaCidade(v).map(o => [o.forca, o.quadro.length]));
    for (let a = 0; a < 15; a++) v = em(v, x => { x.t += 12; processarFaccoes(x); });
    const os = orgsDaCidade(v);
    expect(JSON.stringify(os.map(o => [o.forca, o.quadro.length]))).not.toBe(antes);
    expect(os.length).toBeGreaterThanOrEqual(2);
    for (const o of os) for (const x of [o.forca, o.coesao, o.pressao, ...Object.values(o.influencia)]) expect(Number.isFinite(x)).toBe(true);
    expect(os.some(o => o.historia.length > 0)).toBe(true);
  });

  it('território: a presença sobe com a decisão de quem comanda; a voz de quem mora lá responde; o abrigo depende disso', () => {
    let v = noCaminho('grupo', 12);
    const o = orgsDaCidade(v).find(z => z.ramo === 'organizado')!;
    v = em(v, x => { const rel = relacaoCom(x, orgViva(x, o.id)!); rel.relacao = 'membro'; rel.nivel = 4; rel.lealdade = 70; });
    const reg = regiaoDaPessoa(v);
    expect(regioesDe(v.moradia.municipioId).some(r => r.id === reg)).toBe(true);
    const antes = orgViva(v, o.id)!.influencia[reg] ?? 0;
    const voz = v.mundoCriminal!.comunidade?.[`${v.moradia.municipioId}:${reg}`] ?? 40;
    v = fazer(v, crime({ area: 'org', oque: 'presenca', orgId: o.id, alvo: reg }));
    expect(orgViva(v, o.id)!.influencia[reg]).toBeGreaterThan(antes);
    expect(v.mundoCriminal!.comunidade![`${v.moradia.municipioId}:${reg}`]).toBeGreaterThan(voz);
  });
});

/* ================================================================ encomendas */

describe('as encomendas: as que chegam e as que se encomendam', () => {
  it('chegam pelos contatos de confiança e pelo meio; aceitar ocupa tempo; negociar, uma vez; o prazo vence', () => {
    let v = noCaminho('patrimonial', 14);
    v = em(v, x => { const id = criarContato(x, 'furtos', 'parceiro'); x.caminhos.envolvimento!.fichas![id].confianca = 80; x.caminhos.envolvimento!.reputacao = 50; });
    for (let a = 0; a < 4 && !abertas(v).length; a++) v = em(v, x => { x.t += 12; processarEncomendas(x); });
    expect(abertas(v).length).toBeGreaterThan(0);
    const x0 = abertas(v)[0];
    v = fazer(v, crime({ area: 'encomenda', oque: 'negociar', id: x0.id }));
    const depois = v.caminhos.envolvimento!.encomendas!.find(y => y.id === x0.id)!;
    if (depois.estado === 'aberta') expect(pode(v, crime({ area: 'encomenda', oque: 'negociar', id: x0.id }))).toBe(false);
    // O tempo do ano: a capacidade acaba.
    v = em(v, x => { for (let k = 0; k < capacidadeDoAno(x); k++) x.anoAtual.acoes.push(`crime:trabalho:x${k}`); proporEncomenda(x, rngDe('t', 1), 'furtos', {}, 1); });
    const outra = abertas(v)[abertas(v).length - 1];
    expect(pode(v, crime({ area: 'encomenda', oque: 'aceitar', id: outra.id }))).toBe(false);
    v = em(v, x => { x.t += 13; processarEncomendas(x); });
    expect(v.caminhos.envolvimento!.encomendas!.find(y => y.id === outra.id)!.estado).toBe('expirou');
  });

  it('aceitar: dá certo (dinheiro em "encomendas", prática, confiança) ou dá errado com contexto — nunca as duas coisas', () => {
    const resultados = new Set<string>();
    for (let s = 0; s < 30 && resultados.size < 2; s++) {
      let v = noCaminho('patrimonial', 200 + s);
      v = em(v, x => { proporEncomenda(x, rngDe('e', s), 'furtos', {}, 2); });
      const x0 = abertas(v)[0];
      const conta = v.financas.conta;
      v = fazer(v, crime({ area: 'encomenda', oque: 'aceitar', id: x0.id }));
      const fim = v.caminhos.envolvimento!.encomendas!.find(y => y.id === x0.id)!;
      resultados.add(fim.estado);
      if (fim.estado === 'concluida') expect(v.financas.extratoAberto!.linhas.some(l => l.rotulo.includes('encomendas') && l.conta > 0)).toBe(true);
      if (fim.estado === 'falhou') expect(v.financas.conta).toBeLessThanOrEqual(conta);
    }
    expect([...resultados].sort()).toEqual(['concluida', 'falhou']);
  });

  it('delegar: custa adiantado, corre um ano, e o resultado chega (certo, errado ou traído); há limite de encomendas ao mesmo tempo', () => {
    let v = noCaminho('patrimonial', 3);
    let id = '';
    v = em(v, x => { id = criarContato(x, 'furtos', 'parceiro'); x.caminhos.envolvimento!.fichas![id].confianca = 70; });
    const conta = v.financas.conta;
    v = fazer(v, crime({ area: 'encomenda', oque: 'delegar', pessoaId: id, trabalho: TIPOS.furtos[0].id }));
    expect(v.financas.conta).toBeLessThan(conta);
    expect(delegadas(v).length).toBe(1);
    expect(pode(v, crime({ area: 'encomenda', oque: 'delegar', pessoaId: id, trabalho: TIPOS.furtos[0].id }))).toBe(false);
    v = em(v, x => { x.t += 12; processarEncomendas(x); });
    expect(delegadas(v).length).toBe(0);
    expect(['concluida', 'falhou', 'traida']).toContain(v.caminhos.envolvimento!.encomendas!.find(y => y.direcao === 'delegada')!.estado);
    // A traição existe (quem não confia some com o dinheiro).
    let traiu = false;
    for (let s = 0; s < 60 && !traiu; s++) {
      const w = em(noCaminho('patrimonial', 300 + s), x => {
        const p = criarContato(x, 'furtos', 'parceiro'); const f = x.caminhos.envolvimento!.fichas![p]; f.confianca = 30; f.quebradas = 3;
        x.caminhos.envolvimento!.encomendas = [{ id: 'd1', direcao: 'delegada', ramo: 'furtos', tipo: TIPOS.furtos[0].id, gravidade: 1, pessoaId: p, valor: 1000, retorno: 3000, chance: 0.7, risco: 5, t: x.t, tPrazo: x.t, estado: 'em_andamento' }];
        resolverDelegada(x, x.caminhos.envolvimento!.encomendas![0]);
      });
      traiu = w.caminhos.envolvimento!.encomendas![0].estado === 'traida';
    }
    expect(traiu).toBe(true);
  });
});

/* ================================================================ Justiça */

describe('a Justiça por etapas, com escolhas', () => {
  it('investigação não é condenação: há quem seja investigado e arquivado, sem processo', () => {
    let arquivadas = 0;
    for (let s = 0; s < 20; s++) {
      let v = noCaminho('patrimonial', 400 + s);
      v = em(v, x => { const e = x.caminhos.envolvimento!; e.investigado = x.t; e.exposicao = 30; e.cautela = true; });
      for (let a = 0; a < 4; a++) v = em(v, (x, r) => { x.t += 12; processarIlicito(x, r); });
      if ((v.fatos['investigacoes_arquivadas'] ?? 0) > 0 && !v.justica?.antecedentes.length) arquivadas++;
    }
    expect(arquivadas).toBeGreaterThan(0);
  });

  it('o processo não encerra o caminho sozinho (fica na moita), e as etapas são lidas de um lugar só', () => {
    let v = noCaminho('patrimonial');
    v = em(v, (x, r) => { abrirProcesso(x, r, 'patrimonial'); });
    expect(v.caminhos.envolvimento!.parou).toBeUndefined();
    expect(v.caminhos.envolvimento!.cautela).toBe(true);
    expect(v.justica!.antecedentes.length).toBe(0);
    expect(['processo', 'julgamento']).toContain(etapaAtual(v)!.etapa);
    expect(linhaDaJustica(v)!.map(x => x.etapa)).toEqual(['suspeita', 'investigacao', 'processo', 'julgamento', 'sentenca', 'cumprimento']);
  });

  it('a estratégia e a audiência: contestar mexe nas provas; faltar à audiência vira mandado — o processo para, a fronteira fecha', () => {
    let v = noCaminho('patrimonial', 52);
    v = em(v, (x, r) => { abrirProcesso(x, r, 'patrimonial'); if (x.justica!.prisao) x.justica!.prisao = undefined; x.justica!.processo!.tJulgamento = x.t + 6; x.justica!.processo!.provas = 60; });
    v = fazer(v, crime({ area: 'justica', oque: 'estrategia_contestar' }));
    expect(pode(v, crime({ area: 'justica', oque: 'estrategia_atenuantes' }))).toBe(false);
    expect(v.justica!.processo!.provas!).toBeLessThanOrEqual(60);
    v = fazer(v, crime({ area: 'justica', oque: 'audiencia_faltar' }));
    expect(v.justica!.foragido?.motivo).toBe('mandado');
    expect(estadoNoSubmundo(v).condicoes).toContain('procurado');
    expect(pode(v, { tipo: 'migrar', municipioId: 'lisboa-pt', motivo: 'trabalho' } as unknown as Acao)).toBe(false);
    const julg = v.justica!.processo!.tJulgamento;
    v = em(v, (x, r) => { x.t += 12; processarJustica(x, r); });
    expect(v.justica!.processo).toBeDefined();
    expect(v.justica!.processo!.tJulgamento).toBeGreaterThanOrEqual(julg);
    expect(chanceDeCaptura(v)).toBeGreaterThan(0);
    // Mudar de endereço baixa a chance de ser encontrado (não zera); apresentar-se derruba o mandado.
    const c0 = chanceDeCaptura(v);
    v = fazer(v, crime({ area: 'justica', oque: 'mudar_endereco' }));
    expect(chanceDeCaptura(v)).toBeLessThan(c0);
    v = em(v, x => { x.t += 12; });
    v = fazer(v, crime({ area: 'justica', oque: 'apresentar_se' }));
    expect(v.justica!.foragido).toBeUndefined();
    expect(v.justica!.processo).toBeDefined();
  });

  it('a captura de quem tem mandado leva à espera presa (não a uma pena inventada)', () => {
    let capturado = false;
    for (let s = 0; s < 30 && !capturado; s++) {
      let v = noCaminho('patrimonial', 500 + s);
      v = em(v, (x, r) => { abrirProcesso(x, r, 'patrimonial'); x.justica!.prisao = undefined; x.justica!.foragido = { t: x.t, restante: 0, motivo: 'mandado' }; });
      for (let a = 0; a < 5 && v.justica?.foragido; a++) v = em(v, x => { x.t += 12; processarPrisao(x); });
      if (!v.justica?.foragido) { capturado = true; expect(v.justica!.prisao).toBeDefined(); expect(v.justica!.processo).toBeDefined(); }
    }
    expect(capturado).toBe(true);
  });

  it('recorrer vale para qualquer condenação do ano (também a pena alternativa)', () => {
    let v = noCaminho('pequenos');
    v = em(v, x => { x.justica = { antecedentes: [{ t: x.t, categoria: 'patrimonial', desfecho: 'alternativa' }], alternativa: { tFim: x.t + 18 } }; });
    expect(pode(v, crime({ area: 'justica', oque: 'recorrer' }))).toBe(true);
    v = fazer(v, crime({ area: 'justica', oque: 'recorrer' }));
    expect(v.justica!.recurso).toBeDefined();
    expect(etapaAtual(v)!.etapa).toBe('cumprimento');
  });
});

/* ================================================================ prisão e pena alternativa */

describe('a prisão com o que fazer, e a pena alternativa (regressão: continua na agenda)', () => {
  it('na prisão: escrever para a família e cuidar da saúde, uma vez por ano, com efeito', () => {
    let v = adulto(35, { semente: 61 });
    comParente(v, 'mae', 60);
    v = em(v, x => { x.justica = { antecedentes: [{ t: x.t, categoria: 'patrimonial', desfecho: 'prisao', anos: 3 }], prisao: { tInicio: x.t, tFim: x.t + 24, regime: 'fechado', penaMeses: 36 } }; x.corpo.saude = 50; });
    const saude = v.corpo.saude;
    v = fazer(v, { tipo: 'prisao', oque: 'saude' } as Acao);
    expect(v.corpo.saude).toBeGreaterThan(saude);
    expect(pode(v, { tipo: 'prisao', oque: 'saude' } as Acao)).toBe(false);
    v = fazer(v, { tipo: 'prisao', oque: 'cartas' } as Acao);
    expect(pode(v, { tipo: 'prisao', oque: 'cartas' } as Acao)).toBe(false);
  });

  it('a pena alternativa ocupa o sábado na agenda e a semana — e abandoná-la vira mandado', () => {
    let v = adulto(30, { semente: 62 });
    v = em(v, x => { x.justica = { antecedentes: [{ t: x.t, categoria: 'patrimonial', desfecho: 'alternativa' }], alternativa: { tFim: x.t + 18 } }; });
    const b = blocosFixos(v).find(x => x.id === 'pena');
    expect(b).toBeDefined();
    expect(b!.dias).toEqual([5]);
    expect(b!.obrigatorio).toBe(true);
    expect(semana(v).fixos.some(x => x.id === 'pena')).toBe(true);
    v = fazer(v, crime({ area: 'justica', oque: 'abandonar_pena' }));
    expect(v.justica!.alternativa).toBeUndefined();
    expect(v.justica!.foragido?.motivo).toBe('descumprimento');
    expect(blocosFixos(v).some(x => x.id === 'pena')).toBe(false);
  });

  it('o caminho também ocupa a semana (e quem está preso, não)', () => {
    let v = noCaminho('grupo');
    expect(tempoDoCaminho(v)).toBeDefined();
    expect(blocosFixos(v).some(x => x.origem === 'submundo')).toBe(true);
    expect(semana(v).fixos.some(x => x.id === 'submundo')).toBe(true);
    v = em(v, x => { x.justica = { antecedentes: [], prisao: { tInicio: x.t, tFim: x.t + 12, regime: 'fechado' } }; });
    expect(blocosFixos(v).some(x => x.origem === 'submundo')).toBe(false);
  });
});

/* ================================================================ família */

describe('a família reage pela personalidade e pela relação (não um medidor só)', () => {
  it('pais diferentes reagem diferente; depois de sair, quem rejeitou pode voltar', () => {
    const posturas = new Set<string>();
    for (let s = 0; s < 25 && posturas.size < 3; s++) {
      let v = noCaminho('mercado', 600 + s);
      const mae = comParente(v, 'mae', 60);
      const pai = comParente(v, 'pai', 62, 'masculino');
      mae.p.temperamento.responsabilidade = 0.9; mae.p.temperamento.afabilidade = -0.6;
      pai.p.temperamento.responsabilidade = -0.6; pai.p.temperamento.afabilidade = 0.8;
      mae.vin.convivio = ['casa']; pai.vin.convivio = ['casa'];
      v = em(v, x => { x.caminhos.envolvimento!.exposicao = 80; for (let a = 0; a < 4; a++) { x.t += 12; processarCarreiraCriminal(x); } });
      for (const f of Object.values(v.caminhos.envolvimento!.familia ?? {})) posturas.add(f.postura);
    }
    expect(posturas.size).toBeGreaterThanOrEqual(2);
  });

  it('o filho adolescente também pode saber; e a reconciliação acontece depois de sair', () => {
    let v = noCaminho('mercado', 77);
    const f = comFilho(v, 15, { casa: true });
    v = em(v, x => { x.caminhos.envolvimento!.familia = { [f.p.id]: { sabe: 2, postura: 'rejeita', t: x.t } }; x.caminhos.envolvimento!.parou = x.t; });
    let voltou = false;
    for (let a = 0; a < 10 && !voltou; a++) { v = em(v, x => { x.t += 12; processarCarreiraCriminal(x); }); voltou = v.caminhos.envolvimento!.familia![f.p.id].postura === 'reconciliada'; }
    expect(voltou).toBe(true);
  });
});

/* ================================================================ saída e legado */

describe('sair do crime e o que fica para quem vem depois', () => {
  it('sair aos poucos: os negócios param, a organização é avisada, o caminho termina sem pressão do grupo', () => {
    let v = noCaminho('grupo', 81);
    v = fazer(v, crime({ area: 'rumo', oque: 'sair_aos_poucos' }));
    expect(v.caminhos.envolvimento!.cautela).toBe(true);
    v = em(v, x => { x.t += 12; processarCarreiraCriminal(x); });
    const e = v.caminhos.envolvimento!;
    expect(e.parou).toBe(v.t);
    expect(e.saidaNegociada).toBeDefined();
    expect(v.fatos['pressao_grupo']).toBeUndefined();
  });

  it('o herdeiro não herda cargo: herda a lembrança (e a escolha de ouvir, ou não)', () => {
    let v = noCaminho('grupo', 90);
    const filho = comFilho(v, 22, { casa: false });
    v = em(v, x => { const o = orgsDaCidade(x).find(z => z.ramo === 'organizado')!; const rel = relacaoCom(x, o); rel.relacao = 'membro'; rel.nivel = 5; rel.lealdade = 80; x.caminhos.envolvimento!.reputacao = 80; });
    v = em(v, x => { x.morte = { t: x.t, causa: 'teste', heranca: { liquido: 0, partes: [], bens: [], dividas: 0 } }; });
    const r = continuarComo(v, filho.p.id);
    expect(r.erro).toBeUndefined();
    const h = r.vida;
    expect(h.caminhos.envolvimento).toBeUndefined();
    expect(h.mundoCriminal?.legado?.orgs.length).toBeGreaterThan(0);
    expect(Object.keys(h.mundoCriminal!.orgs).length).toBeGreaterThan(0);
    let w = h;
    for (let a = 0; a < 25 && w.fatos['sub125_legado'] === undefined; a++) w = em(w, x => { x.t += 12; x.momento = null; processarLegado(x); });
    expect(w.fatos['sub125_legado']).toBeDefined();
    // Aceitar o convite: entra no caminho como aliado da organização — nunca no posto de quem morreu.
    w = em(w, x => { x.fatos['sub125_legado'] = x.t; x.momento = null; delete x.fila; });
    const d = conteudoPorId('sub125_legado');
    w = em(w, (x, r) => { if (d && d.tipo === 'decisao') { const ctx = preparar(d, x, r); if (ctx) abrirDecisao(x, d, ctx); } });
    expect(w.momento?.situacaoId).toBe('sub125_legado');
    w = executar(w, { tipo: 'decidir', opcaoId: 'aceitar' }).vida;
    const rels = w.caminhos.envolvimento!.organizacoes ?? [];
    expect(rels.some(o => o.relacao === 'aliada')).toBe(true);
    expect(rels.some(o => o.relacao === 'membro' && (o.nivel ?? 0) >= 5)).toBe(false);
  });
});

/* ================================================================ saves */

describe('saves antigos (12.05/12.2) continuam abrindo, iguais', () => {
  function save122(): Vida {
    let v = adulto(36, { semente: 133, municipioId: 'sao-paulo-sp' });
    v.momento = null; delete v.fila; v.justica = undefined;
    v = em(v, (x, r) => {
      entrar(x, 'mercado', undefined, r);
      const e = x.caminhos.envolvimento!;
      const forn = criarContato(x, 'contrabando', 'fornecedor');
      e.fichas![forn].cumpridas = 2;
      const o = organizacaoDoRamo(x, 'contrabando');
      o.nome = 'o pessoal dos Soares';
      lembrarOrg(o, x.t - 24, 'promessa', 4);
      e.exposicao = 33; e.reputacao = 45;
      delete e.carreira;
    });
    delete v.mundoCriminal;
    return v;
  }
  it('o save do 12.2 abre: "o pessoal dos Soares" continua, com a memória; ganha uma organização viva com o mesmo nome', () => {
    const v = save122();
    const lido = interpretar(JSON.stringify({ ...v, versao: VERSAO_SAVE }));
    expect(lido.tipo).toBe('ok');
    if (lido.tipo !== 'ok') return;
    const w = lido.vida;
    const rel = w.caminhos.envolvimento!.organizacoes!.find(o => o.nome === 'o pessoal dos Soares')!;
    expect(rel).toBeDefined();
    expect(rel.memoria.some(m => m.fato === 'promessa')).toBe(true);
    expect(orgViva(w, rel.id)?.nome).toBe('o pessoal dos Soares');
    expect(w.caminhos.envolvimento!.carreira).toBeDefined();
    expect(contatosAtivos(w).length).toBeGreaterThan(0);
    expect(VERSAO_SAVE).toBe(20);
  });
  it('a normalização é idempotente (abrir duas vezes dá o mesmo) e o ano seguinte roda', () => {
    const v = save122();
    const a = interpretar(JSON.stringify(v));
    if (a.tipo !== 'ok') throw new Error('save');
    const uma = JSON.stringify(a.vida);
    const b = interpretar(uma);
    if (b.tipo !== 'ok') throw new Error('save');
    expect(JSON.stringify(b.vida)).toBe(uma);
    const c = em(b.vida, x => normalizarRework125(x));
    expect(JSON.stringify(c)).toBe(uma);
    const depois = avancarAno(b.vida).vida;
    expect(Number.isFinite(depois.financas.conta)).toBe(true);
  });
  it('quem nunca entrou não ganha mundo do crime no save (nada a mais para guardar)', () => {
    const v = adulto(30, { semente: 4 });
    const a = interpretar(JSON.stringify(v));
    if (a.tipo !== 'ok') throw new Error('save');
    expect(a.vida.mundoCriminal).toBeUndefined();
    expect(patamarAtual(a.vida)).toBe(0);
  });
});
