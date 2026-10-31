/**
 * REWORK 11.5 · Fase C — o Submundo com especializações.
 *
 *   SUB-11  ramos distintos (furtos, contrabando, organizado, digital, fraudes): prática própria, herdada em parte
 *   SUB-12  contatos com ficha: papel, confiança, promessas; afastam-se e traem por causa
 *   SUB-13  organizações com memória (promessa, aliança, conflito, traição, saída, reconciliação)
 *   SUB-14  consequências: anos sem ganho, perdas, apreensão, investigação, saída
 *   SUB-15  ações próprias de cada ramo, com custo, pré-requisito e risco
 *   SUB-16  cenas por ramo e encadeadas; persistência e save antigo
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { transacao } from '../nucleo';
import { criarRng } from '../rng';
import type { Vida } from '../tipos';
import { executar, disponibilidade } from '../acoes';
import { avancarAno } from '../ano';
import { podeTentar } from '../plausibilidade';
import { entrar } from '../sistemas/ilicito';
import { experienciaHerdada, fatorDosRamos, garantirRamos, ramoPrincipal, ramosAtivos } from '../sistemas/ramos';
import { contatosAtivos, criarContato, leituraDoSubmundo, organizacaoDoRamo, processarSubmundo, promessa } from '../sistemas/submundo';
import { conteudoPorId, preparar } from '../conteudo/motor';
import { interpretar } from '../save';
import { IDS_DO_SUBMUNDO } from '../conteudo/submundo';
import { contratar } from '../sistemas/trabalho';
import { ocupacao } from '../dados/ocupacoes';
import { garantirOrgViva } from '../sistemas/faccoes';

const envolvido = (cat: Parameters<typeof entrar>[1] = 'patrimonial', semente = 3): Vida => transacao(adulto(28, { semente }), (x, r) => {
  x.momento = null; delete x.fila;
  entrar(x, cat, undefined, r);
  x.financas.conta = 200_000;
}).vida;

const fazer = (v: Vida, a: Parameters<typeof executar>[1]) => { const d = disponibilidade(v, a); expect(podeTentar(d), d.motivo).toBe(true); return executar(v, a).vida; };

describe('REWORK 11.5 · Submundo', () => {
  it('o save de antes ganha o ramo da categoria, com a prática dos anos e as fichas dos contatos (idempotente)', () => {
    const v = transacao(adulto(35, { semente: 5 }), (x, r) => {
      entrar(x, 'mercado', undefined, r);
      const e = x.caminhos.envolvimento!;
      e.tInicio = x.t - 72; e.nivel = 2; e.reputacao = 40; e.trabalhos = 2;
      delete e.especializacoes;
    }).vida;
    const bruto = JSON.parse(JSON.stringify(v));
    delete bruto.caminhos.envolvimento.especializacoes;
    delete bruto.caminhos.envolvimento.fichas;
    const lido = interpretar(JSON.stringify(bruto));
    expect(lido.tipo).toBe('ok');
    if (lido.tipo !== 'ok') return;
    const e = lido.vida.caminhos.envolvimento!;
    expect(Object.keys(e.especializacoes!)).toEqual(['contrabando']);
    expect(e.especializacoes!.contrabando!.experiencia).toBeGreaterThan(40);
    const de2 = interpretar(JSON.stringify(lido.vida));
    expect(de2.tipo === 'ok' && JSON.stringify(de2.vida.caminhos.envolvimento)).toBe(JSON.stringify(e));
  });

  it('uma segunda frente herda só PARTE da prática (nunca a torna equivalente) e aumenta a exposição do ano', () => {
    let v = envolvido('patrimonial');
    v = transacao(v, x => { const e = x.caminhos.envolvimento!; e.especializacoes!.furtos!.experiencia = 80; e.reputacao = 40; }).vida;
    const herdada = experienciaHerdada(v.caminhos.envolvimento!, 'organizado');
    expect(herdada).toBeGreaterThan(0);
    expect(herdada).toBeLessThan(40);
    const expo = v.caminhos.envolvimento!.exposicao;
    v = fazer(v, { tipo: 'submundo', oque: 'entrar_ramo', ramo: 'organizado' });
    const e = v.caminhos.envolvimento!;
    expect(ramosAtivos(e)).toEqual(['furtos', 'organizado']);
    expect(e.especializacoes!.organizado!.experiencia).toBe(Math.max(4, herdada));
    expect(e.exposicao).toBeGreaterThan(expo);
    expect(ramoPrincipal(e)).toBe('furtos');
    // Um novo contato, com ficha e organização (no crime organizado).
    expect(contatosAtivos(v, 'organizado').length).toBe(1);
    expect(contatosAtivos(v, 'organizado')[0].f.organizacao).toBeDefined();
    // Pré-requisitos: a fraude pede acesso (cargo, assinatura, negócio).
    const sem = transacao(v, x => { x.trabalho.atual = undefined; delete x.caminhos.negocio; }).vida;
    expect(disponibilidade(sem, { tipo: 'submundo', oque: 'entrar_ramo', ramo: 'fraudes' }).grau).toBe('requisito');
  });

  it('cada ramo tem a sua conta: o lote debita e guarda; a venda devolve conforme o mercado; o serviço mexe na exposição', () => {
    let v = envolvido('mercado');
    v = transacao(v, x => { criarContato(x, 'contrabando', 'fornecedor'); criarContato(x, 'contrabando', 'comprador', 1); }).vida;
    const conta = v.financas.conta;
    v = fazer(v, { tipo: 'submundo', oque: 'comprar_lote', ramo: 'contrabando' });
    const estoque = v.caminhos.envolvimento!.especializacoes!.contrabando!.estoque!;
    expect(estoque).toBeGreaterThan(0);
    expect(v.financas.conta).toBe(conta - estoque);
    // Uma vez por ano: o lote já está guardado.
    expect(podeTentar(disponibilidade(v, { tipo: 'submundo', oque: 'comprar_lote', ramo: 'contrabando' }))).toBe(false);
    v = fazer(v, { tipo: 'submundo', oque: 'vender_estoque', ramo: 'contrabando' });
    expect(v.caminhos.envolvimento!.especializacoes!.contrabando!.estoque).toBe(0);
    expect(v.financas.conta).toBeGreaterThan(conta - estoque);
    // Furtos: o serviço pequeno muda a exposição (dando certo ou não); o grande pede prática e parceiro.
    let f = envolvido('patrimonial');
    expect(disponibilidade(f, { tipo: 'submundo', oque: 'servico_maior', ramo: 'furtos' }).grau).toBe('requisito');
    const ex = f.caminhos.envolvimento!.exposicao;
    f = fazer(f, { tipo: 'submundo', oque: 'servico_pequeno', ramo: 'furtos' });
    expect(f.caminhos.envolvimento!.exposicao).toBeGreaterThan(ex);
    expect(f.caminhos.envolvimento!.especializacoes!.furtos!.operacoes).toBe(1);
  });

  it('o crime organizado tem hierarquia e lealdade; sair pode ser aceito ou não — e a organização lembra', () => {
    let aceita = 0, recusa = 0;
    for (let s = 1; s <= 30; s++) {
      let v = envolvido('grupo', s);
      v = transacao(v, x => { const o = organizacaoDoRamo(x, 'organizado'); o.lealdade = 60; x.caminhos.envolvimento!.especializacoes!.organizado!.experiencia = 50; }).vida;
      v = fazer(v, { tipo: 'submundo', oque: 'tarefa_do_grupo', ramo: 'organizado' });
      const org = v.caminhos.envolvimento!.organizacoes!.find(o => o.relacao === 'membro')!;
      expect(org.memoria.some(m => m.fato === 'favor' || m.fato === 'conflito')).toBe(true);
      // REWORK 12.35 · D6: sair do grupo é com a organização (um posto, uma regra); sair do grupo não encerra o caminho inteiro.
      expect(podeTentar(disponibilidade(v, { tipo: 'submundo', oque: 'tentar_sair', ramo: 'organizado' }))).toBe(false);
      v = transacao(v, x => { garantirOrgViva(x, x.caminhos.envolvimento!.organizacoes!.find(o => o.id === org.id)!); }).vida;
      v = fazer(v, { tipo: 'crime', acao: { area: 'org', oque: 'sair', orgId: org.id } });
      const o2 = v.caminhos.envolvimento!.organizacoes!.find(o => o.id === org.id)!;
      expect(o2.saiu).toBe(v.t);
      if (o2.memoria.some(m => m.fato === 'traicao')) { recusa++; expect(v.fatos['pressao_grupo']).toBe(v.t); } else aceita++;
    }
    expect(aceita).toBeGreaterThan(0);
    expect(recusa).toBeGreaterThan(0);
  });

  it('as promessas contam: quebrar baixa a confiança, a organização lembra, e quem perde a confiança se afasta', () => {
    let v = envolvido('grupo');
    let id = '';
    v = transacao(v, x => { id = criarContato(x, 'organizado', 'chefe'); }).vida;
    v = transacao(v, x => { promessa(x, id, false); promessa(x, id, false); }).vida;
    const f = v.caminhos.envolvimento!.fichas![id];
    expect(f.quebradas).toBe(2);
    const org = v.caminhos.envolvimento!.organizacoes!.find(o => o.id === f.organizacao)!;
    expect(org.memoria.filter(m => m.fato === 'promessa_quebrada').length).toBe(2);
    // O ano: quem confia menos de 15 se afasta (e deixa de contar nos contatos vivos).
    v = transacao(v, x => { x.caminhos.envolvimento!.fichas![id].confianca = 10; processarSubmundo(x); }).vida;
    expect(v.caminhos.envolvimento!.fichas![id].afastado).toBe(v.t);
    expect(contatosAtivos(v).some(c => c.id === id)).toBe(false);
  });

  it('a promessa quebrada volta como cena (encadeada), com a pessoa certa, e a cena abre', () => {
    let achou = false;
    for (let s = 0; s < 40 && !achou; s++) {
      let v = envolvido('grupo', 20 + s);
      let id = '';
      v = transacao(v, x => { id = criarContato(x, 'organizado', 'parceiro'); x.caminhos.envolvimento!.fichas![id].confianca = 60; promessa(x, id, false); processarSubmundo(x); }).vida;
      if (v.fatos['sub_cobranca'] !== v.t) continue;
      achou = true;
      expect(v.caminhos.envolvimento!.cenas?.sub_cobranca).toBe(id);
      const d = conteudoPorId('sub_cobranca')!;
      const ctx = transacao(v, (x, r) => preparar(d, x, r)).valor;
      expect(ctx?.p.contato.id).toBe(id);
    }
    expect(achou).toBe(true);
  });

  it('todas as cenas do Submundo têm famílias por ramo (a fila do ano deixa viver mais de uma) e opções com efeito', () => {
    const fams = new Set(IDS_DO_SUBMUNDO.map(id => id.split('_')[0]));
    expect([...fams].sort()).toEqual(['sub', 'subc', 'subd', 'subf', 'subo', 'subx']);
    for (const id of IDS_DO_SUBMUNDO) {
      const d = conteudoPorId(id)!;
      expect(d.tipo).toBe('decisao');
      if (d.tipo === 'decisao') expect(d.opcoes.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('o mercado do contrabando muda a renda; atuar em várias frentes rende diferente de uma só', () => {
    const v = envolvido('mercado');
    const e = v.caminhos.envolvimento!;
    garantirRamos(v, e);
    const base = fatorDosRamos(e);
    e.especializacoes!.contrabando!.mercado = 2;
    expect(fatorDosRamos(e)).toBeGreaterThan(base);
    e.especializacoes!.contrabando!.mercado = -2;
    expect(fatorDosRamos(e)).toBeLessThan(base);
  });

  it('a fraude de quem tem cargo: o acerto exige acesso; denunciar sai do ramo, e quem estava junto lembra', () => {
    let v = envolvido('fraude');
    v = transacao(v, (x, r) => { contratar(x, r, ocupacao('contador')); criarContato(x, 'fraudes', 'intermediario'); }).vida;
    expect(podeTentar(disponibilidade(v, { tipo: 'submundo', oque: 'esquema_de_influencia', ramo: 'fraudes' }))).toBe(true);
    v = fazer(v, { tipo: 'submundo', oque: 'denunciar', ramo: 'fraudes' });
    const e = v.caminhos.envolvimento!;
    expect(e.especializacoes!.fraudes!.largou).toBe(v.t);
    expect(e.parou).toBe(v.t);
    expect(contatosAtivos(v, 'fraudes').length).toBe(0);
    expect(v.fatos['denunciou_esquema']).toBe(v.t);
  });

  it('trajetórias longas: ganhos, anos secos, perdas e investigações aparecem; o caminho persiste no save e na tela', () => {
    let anosSecos = 0, investigados = 0, comDiario = 0, comDuasFrentes = 0;
    for (let s = 0; s < 6; s++) {
      let v = envolvido(s % 2 ? 'mercado' : 'patrimonial', 60 + s);
      const r = criarRng(s);
      for (let ano = 0; ano < 10 && !v.morte; ano++) {
        const outra = s % 2 ? 'furtos' : 'contrabando';
        if (ano === 2 && podeTentar(disponibilidade(v, { tipo: 'submundo', oque: 'entrar_ramo', ramo: outra }))) v = executar(v, { tipo: 'submundo', oque: 'entrar_ramo', ramo: outra }).vida;
        v = avancarAno(v).vida;
        for (let k = 0; k < 10 && v.momento; k++) { const op = v.momento.opcoes.filter(o => !o.bloqueio); v = executar(v, { tipo: 'decidir', opcaoId: op[r.int(0, op.length - 1)].id }).vida; }
      }
      const e = v.caminhos.envolvimento!;
      anosSecos += e.anosSecos ?? 0;
      investigados += (v.fatos['investigacoes'] ?? 0) > 0 || !!v.justica ? 1 : 0;
      if ((e.diario?.length ?? 0) > 0) comDiario++;
      if (Object.keys(e.especializacoes ?? {}).length >= 2) comDuasFrentes++;
      const lido = interpretar(JSON.stringify(v));
      expect(lido.tipo).toBe('ok');
      if (lido.tipo === 'ok') expect(JSON.stringify(lido.vida.caminhos.envolvimento)).toBe(JSON.stringify(e));
      expect(leituraDoSubmundo(v)!.ramos.length).toBeGreaterThanOrEqual(1);
    }
    expect(anosSecos).toBeGreaterThan(0);
    expect(investigados).toBeGreaterThan(0);
    expect(comDiario).toBeGreaterThan(0);
    expect(comDuasFrentes).toBeGreaterThan(0);
  }, 400000);
});
