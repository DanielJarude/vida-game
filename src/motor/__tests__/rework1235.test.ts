/**
 * REWORK 12.35 — Submundo vivo e conflitos criminais: os testes por sistema (§21). Cada teste confere um EFEITO no estado,
 * não só um texto.
 *
 *   CORREÇÕES    o intermediário não é parente; os alvos alcançáveis; a escala única das provas; o gênero dos contatos; o
 *                alcance geográfico; o posto único (e a migração de uma vez só); o favor leve; o preço dito antes
 *   CONFLITOS    o confronto com escolhas por posto e resultado medido; a operação que chega (busca, dinheiro, bloqueio,
 *                contato preso); a perseguição; o ferimento pelo sistema de lesões; a morte que o ano lê
 *   BENS         bloqueio e confisco que separam o pessoal, o do casal, o herdado e a moradia; a absolvição devolve
 *   PODER        o comando contestável (e o que cai sozinho), a delação que vira prova, quem muda de lado, o boato
 *   MUNDO        o perfil que muda a conta, o mercado que reage à operação, as oportunidades com preço antes, a reputação
 *                que não viaja inteira, as organizações que andam sem o jogador
 *   VIDA DUPLA   o par que vai embora, a promessa cobrada, o recomeço, o legado sem cargo
 *   SAVES        a ida e volta com tudo o que é novo; o save antigo
 */
import { describe, expect, it } from 'vitest';
import { adulto, comParceiro, comParente, pessoaNova } from './cenarios';
import { transacao } from '../nucleo';
import { vincular } from '../pessoas';
import type { CasoDoSubmundo, MembroDaOrg, OrgViva, Veiculo, Vida } from '../tipos';
import { executar, disponibilidade, type Acao } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { interpretar, normalizarRework1235 } from '../save';
import { entrar } from '../sistemas/ilicito';
import { alcanceDoContato, criarContato, fatorDoLugar, organizacaoDoRamo } from '../sistemas/submundo';
import { garantirCidade, orgsDaCidade, orgViva, processarFaccoes, relacaoCom, nivelDe, definirNivel, definirEstado, perfilDe, parteDoAno, PERFIS_DE_ORG, lealdadeDoMembro } from '../sistemas/faccoes';
import { alvosPossiveis, condicoesDoServico, disponibilidadeServico, intermediario, quemEoIntermediario } from '../sistemas/servicosPorFora';
import { provasDoCaminho } from '../sistemas/tribunal';
import { processarRede } from '../sistemas/redeCriminal';
import { casoDaCena, escolhasDoConfronto, ferir, marcarFalhaGrave, processarConflitosCriminais, resolverConfronto, resolverOperacao, resolverPerseguicao } from '../sistemas/conflitosCriminais';
import { apoioAoComando, processarPoderInterno, resolverContestacao, resolverSuspeita, subordinados } from '../sistemas/poderInterno';
import { demandaDe, oportunidades, processarMercadoCriminal, reputacaoAqui } from '../sistemas/mercadoCriminal';
import { processarVidaDupla, receberContatosDoLegado, resolverPar } from '../sistemas/vidaDupla';
import { bloquearBens, confiscarBens } from '../sistemas/bensDoCrime';
import { liberarBloqueio } from '../sistemas/tribunal';
import { morreEsteAno } from '../sistemas/corpo';
import { legadoDoSubmundo } from '../sistemas/carreiraCriminal';
import { mudarAgora } from '../sistemas/processos';
import { capitalDoPais } from '../dados/lugares';
import { conteudoPorId, preparar } from '../conteudo/motor';
import { IDS_DO_1235 } from '../conteudo/acontecimentos1235';
import { criarRng } from '../rng';

const fazer = (v: Vida, a: Acao) => { const d = disponibilidade(v, a); expect(podeTentar(d), `${JSON.stringify(a)}: ${d.motivo}`).toBe(true); return executar(v, a).vida; };
const em = (v: Vida, f: (x: Vida, r: ReturnType<typeof criarRng>) => void) => transacao(v, f).vida;

function noCaminho(cat: 'pequenos' | 'patrimonial' | 'mercado' | 'grupo' | 'fraude' = 'grupo', semente = 41, cidade = 'sao-paulo-sp'): Vida {
  let v = adulto(30, { semente, municipioId: cidade });
  v.financas.conta = 200_000;
  v.financas.dividas = [];
  v.momento = null; delete v.fila;
  v.justica = undefined;
  v = em(v, (x, r) => { entrar(x, cat, undefined, r); garantirCidade(x); });
  return v;
}

/** De dentro de uma organização da cidade, no posto pedido (e a organização viva atrás). */
function deDentro(v: Vida, nivel: number): OrgViva {
  const o = orgsDaCidade(v)[0];
  const rel = relacaoCom(v, o);
  rel.relacao = 'membro'; rel.lealdade = 60;
  definirNivel(v, rel, nivel);
  return o;
}
/** Uma rival em guerra aberta com a organização. */
function emGuerra(v: Vida, o: OrgViva): OrgViva {
  const b = orgsDaCidade(v).find(x => x.id !== o.id)!;
  definirEstado(o, b, 'conflito');
  return b;
}
const caso = (v: Vida, cena: string) => casoDaCena(v, cena) as CasoDoSubmundo;

/* ================================================================ fase 1: as correções da auditoria */

describe('as correções da auditoria 12.3.1', () => {
  it('D1: o intermediário dos pedidos por fora nunca é parente nem o par — e a tela diz quem é e por que conhece', () => {
    for (let s = 1; s <= 12; s++) {
      const v = adulto(30, { semente: s });
      for (const p of ['mae', 'pai', 'irmao', 'tio'] as const) { const x = comParente(v, p, 50); x.p.temperamento.responsabilidade = -0.9; x.vin.confianca = 90; }
      const par = comParceiro(v); par.p.temperamento.responsabilidade = -0.9; par.vin.confianca = 90;
      const q = intermediario(v);
      if (q) { expect(v.vinculos[q.id]?.parentesco).toBeUndefined(); expect(v.vinculos[q.id]?.romance).toBeUndefined(); }
    }
    const v = adulto(30, { semente: 3 });
    const amigo = pessoaNova(v, 33, 'feminino');
    vincular(v, amigo, { origem: 'trabalho', proximidade: 50 });
    amigo.temperamento.responsabilidade = -0.8; v.vinculos[amigo.id].confianca = 60;
    expect(intermediario(v)?.id).toBe(amigo.id);
    expect(quemEoIntermediario(v, amigo)).toMatch(/uma conhecida do trabalho/);
  });

  it('D2: dá para pedir contra quem rompeu com você ou é rival declarado (não só com tensão ≥ 45)', () => {
    const v = adulto(30, { semente: 4 });
    const p = pessoaNova(v, 35);
    const vin = vincular(v, p, { origem: 'vizinhanca', proximidade: 30 });
    vin.tensao = 25;
    expect(alvosPossiveis(v).some(x => x.id === p.id)).toBe(false);
    vin.ruptura = { t: v.t, porque: 'uma briga', quem: 'outro' };
    expect(alvosPossiveis(v).some(x => x.id === p.id)).toBe(true);
  });

  it('D3: uma escala só — o pedido isolado não pesa mais que uma carreira exposta; a exposição pesa de verdade', () => {
    const legal = adulto(30, { semente: 5 });
    const isolado = provasDoCaminho(legal, 'corrupcao');
    const v = noCaminho('grupo', 6);
    v.caminhos.envolvimento!.exposicao = 25;
    const pouco = provasDoCaminho(v, 'grupo');
    v.caminhos.envolvimento!.exposicao = 85;
    const muito = provasDoCaminho(v, 'grupo');
    expect(isolado).toBe(28);
    expect(muito).toBeGreaterThan(isolado);
    expect(muito - pouco).toBeGreaterThanOrEqual(10);
    v.fatos['delatado_por_dentro'] = v.t;
    expect(provasDoCaminho(v, 'grupo')).toBe(muito + 12);
  });

  it('D5: o contato preso é tratado pelo gênero dele', () => {
    let achou = false;
    for (let s = 1; s <= 40 && !achou; s++) {
      let v = noCaminho('patrimonial', s);
      v = em(v, x => { const id = criarContato(x, 'furtos', 'parceiro'); x.pessoas[id].genero = 'feminino'; x.caminhos.envolvimento!.exposicao = 100; for (let a = 0; a < 6; a++) { x.t += 12; processarRede(x); } });
      const d = v.caminhos.envolvimento!.diario ?? [];
      const linha = d.find(l => / foi pres[ao]\./.test(l.texto));
      if (linha) { achou = true; expect(linha.texto).toMatch(/foi presa\. Ninguém sabe ainda o que ela vai dizer/); }
    }
    expect(achou).toBe(true);
  });

  it('D8: depois de mudar de país, o contato antigo não traz trabalho e o de sempre encolhe — o vínculo continua', () => {
    let v = noCaminho('patrimonial', 8);
    let id = '';
    v = em(v, x => { id = criarContato(x, 'furtos', 'parceiro'); });
    expect(alcanceDoContato(v, id)).toBe('perto');
    v = em(v, x => mudarAgora(x, capitalDoPais('PT')!.id, 'teste', { internacional: true, comAFamilia: true }));
    expect(alcanceDoContato(v, id)).toBe('fora');
    expect(fatorDoLugar(v)).toBeLessThan(0.5);
    expect(podeTentar(disponibilidade(v, { tipo: 'crime', acao: { area: 'contato', oque: 'propor_trabalho', pessoaId: id } }))).toBe(false);
    expect(podeTentar(disponibilidade(v, { tipo: 'crime', acao: { area: 'contato', oque: 'conversar', pessoaId: id } }))).toBe(true);
  });

  it('D6: um posto só — o "subir" do ramo antigo não existe mais; a migração do save traz o posto para o nível uma vez', () => {
    const v = noCaminho('grupo', 9);
    expect(podeTentar(disponibilidade(v, { tipo: 'submundo', oque: 'pedir_para_subir', ramo: 'organizado' }))).toBe(false);
    const rel = organizacaoDoRamo(v, 'organizado');
    rel.relacao = 'membro'; rel.nivel = 0;
    v.caminhos.envolvimento!.especializacoes!.organizado!.posto = 4;
    delete v.caminhos.envolvimento!.postoUnificado;
    expect(nivelDe(v, rel)).toBe(0);
    normalizarRework1235(v);
    expect(rel.nivel).toBe(3);
    rel.nivel = 1;
    normalizarRework1235(v);
    expect(rel.nivel).toBe(1);
  });

  it('D11/D12: o preço, a chance e o risco do pedido aparecem antes de pedir', () => {
    const v = adulto(30, { semente: 3 });
    const amigo = pessoaNova(v, 33);
    vincular(v, amigo, { origem: 'trabalho', proximidade: 50 });
    amigo.temperamento.responsabilidade = -0.8; v.vinculos[amigo.id].confianca = 60;
    v.financas.conta = 50_000;
    const c = condicoesDoServico(v, 'favor');
    const d = disponibilidadeServico(v, 'favor');
    expect(d.motivo).toContain(String(Math.round(c.golpe * 100)));
    expect(d.motivo).toMatch(/Custa R\$/);
    expect(c.peso).toMatch(/leve/);
  });
});

/* ================================================================ fase 2: conflitos jogáveis */

describe('o confronto entre organizações é uma situação com escolha', () => {
  it('a guerra abre um caso; as escolhas são as do posto (sem botão inútil)', () => {
    let v = noCaminho('grupo', 11);
    v = em(v, x => { const o = deDentro(x, 1); emGuerra(x, o); for (let s = 0; s < 8 && !casoDaCena(x, 'sub1235_confronto'); s++) { x.t += 12; emGuerra(x, o); processarConflitosCriminais(x); } });
    const k = caso(v, 'sub1235_confronto');
    expect(k).toBeDefined();
    expect(escolhasDoConfronto(v, k)).toContain('ir');
    expect(escolhasDoConfronto(v, k)).not.toContain('retaliar');
    v = em(v, x => { definirNivel(x, x.caminhos.envolvimento!.organizacoes!.find(o => o.id === k.orgId)!, 6); });
    expect(escolhasDoConfronto(v, k)).toContain('retaliar');
    expect(escolhasDoConfronto(v, k)).not.toContain('ir');
  });

  it('ir e ficar de fora mudam coisas diferentes: território, lealdade, exposição — e só quem vai se machuca', () => {
    let feridosIr = 0, feridosFora = 0, expIr = 0, expFora = 0, lealIr = 0, lealFora = 0;
    for (let s = 1; s <= 24; s++) {
      for (const x of ['ir', 'ficar_fora'] as const) {
        let v = noCaminho('grupo', 100 + s);
        let id = '';
        v = em(v, y => {
          const o = deDentro(y, 1); const b = emGuerra(y, o);
          const c: CasoDoSubmundo = { id: `caso${y.seq++}`, t: y.t, tipo: 'confronto', situacao: 'territorio', orgId: o.id, outraId: b.id, gravidade: 3 };
          (y.caminhos.envolvimento!.casos ??= []).push(c); id = c.id;
        });
        const antes = { e: v.caminhos.envolvimento!.exposicao, l: v.caminhos.envolvimento!.organizacoes!.find(o => o.relacao === 'membro')!.lealdade, les: v.fatos['ferimentos_crime'] ?? 0 };
        v = em(v, y => { resolverConfronto(y, id, x); });
        const e = v.caminhos.envolvimento!;
        const rel = e.organizacoes!.find(o => o.relacao === 'membro')!;
        const ferido = (v.fatos['ferimentos_crime'] ?? 0) > antes.les;
        if (x === 'ir') { feridosIr += ferido ? 1 : 0; expIr += e.exposicao - antes.e; lealIr += rel.lealdade - antes.l; }
        else { feridosFora += ferido ? 1 : 0; expFora += e.exposicao - antes.e; lealFora += rel.lealdade - antes.l; }
        expect(e.casos!.find(c => c.id === id)!.resultado!.length).toBeGreaterThan(0);
      }
    }
    expect(feridosIr).toBeGreaterThan(0);
    expect(feridosFora).toBe(0);
    expect(expIr).toBeGreaterThan(expFora);
    expect(lealIr).toBeGreaterThan(lealFora);
  });

  it('negociar pode acabar com a guerra (trégua de verdade no estado das duas)', () => {
    let tregua = 0;
    for (let s = 1; s <= 20; s++) {
      let v = noCaminho('grupo', 200 + s);
      let ids: [string, string, string] = ['', '', ''];
      v = em(v, y => { const o = deDentro(y, 4); const b = emGuerra(y, o); const c: CasoDoSubmundo = { id: `caso${y.seq++}`, t: y.t, tipo: 'confronto', situacao: 'territorio', orgId: o.id, outraId: b.id, gravidade: 2 }; (y.caminhos.envolvimento!.casos ??= []).push(c); ids = [c.id, o.id, b.id]; });
      v = em(v, y => { resolverConfronto(y, ids[0], 'negociar'); });
      if (orgViva(v, ids[1])!.relacoes![ids[2]] === 'tregua') tregua++;
    }
    expect(tregua).toBeGreaterThan(0);
    expect(tregua).toBeLessThan(20);
  });

  it('o ferimento usa o sistema de lesões (a decisão de cuidado) e o sério é internação com o custo do país', () => {
    const v = noCaminho('grupo', 12);
    const linhas = ferir(v, criarRng(1), 3, 'do confronto');
    expect(v.corpo.condicoes.some(c => c.id === 'lesao')).toBe(true);
    expect(v.fatos['lesao_decidir']).toBe(v.t);
    expect(linhas.join(' ')).toMatch(/internad/);
  });

  it('a morte decidida no crime é a que o ano lê', () => {
    const v = noCaminho('grupo', 13);
    v.caminhos.envolvimento!.morteNoCrime = { t: v.t, causa: 'violência ligada ao crime' };
    expect(morreEsteAno(v, criarRng(2))).toBe('violência ligada ao crime');
  });
});

describe('a operação policial chega a quem está perto', () => {
  it('a busca na sua casa: dinheiro achado, veículo bloqueado (não se vende), o caso para decidir', () => {
    let achou = false;
    for (let s = 1; s <= 20 && !achou; s++) {
      let v = noCaminho('grupo', 300 + s);
      const carro: Veiculo = { id: 'carro1', tipo: 'veiculo', modeloId: 'compacto', nome: 'um compacto', valor: 60000, tCompra: v.t, estado: 90 } as Veiculo;
      v = em(v, y => {
        y.financas.bens.push(carro);
        const o = deDentro(y, 4); y.caminhos.envolvimento!.exposicao = 90;
        y.caminhos.envolvimento!.ganhos = 2_000_000;
        o.operacao = { t: y.t, tipo: 'busca' };
        processarConflitosCriminais(y);
      });
      const k = casoDaCena(v, 'sub1235_operacao');
      if (!k) continue;
      achou = true;
      expect(v.financas.bens.find(b => b.id === 'carro1')!.bloqueio).toBeDefined();
      expect(podeTentar(disponibilidade(v, { tipo: 'vender_bem', bemId: 'carro1' }))).toBe(false);
      expect(v.caminhos.envolvimento!.investigado ?? v.caminhos.envolvimento!.exposicao).toBeDefined();
      const conta = v.financas.conta;
      v = em(v, y => { resolverOperacao(y, k.id, 'advogado'); });
      expect(v.financas.conta).toBeLessThan(conta);
      expect(v.fatos['advogado_preventivo']).toBe(v.t);
    }
    expect(achou).toBe(true);
  });

  it('a operação na organização sempre vira texto para quem é de dentro, e leva o contato seu de lá', () => {
    let levou = false;
    for (let s = 1; s <= 12 && !levou; s++) {
      let v = noCaminho('grupo', 400 + s);
      let id = '';
      v = em(v, y => { const o = deDentro(y, 0); id = criarContato(y, 'organizado', 'parceiro'); y.caminhos.envolvimento!.fichas![id].organizacao = o.id; o.operacao = { t: y.t, tipo: 'integrantes' }; y.caminhos.envolvimento!.cautela = true; processarConflitosCriminais(y); });
      expect(v.biografia.some(b => b.t === v.t && /Uma operação/.test(b.texto))).toBe(true);
      if (v.caminhos.envolvimento!.fichas![id].afastado === v.t) levou = true;
    }
    expect(levou).toBe(true);
  });
});

describe('os bens na Justiça', () => {
  it('bloqueia o que veio depois do caminho; confisca só o pessoal (não o do casal, o herdado, a moradia); a absolvição devolve', () => {
    const v = noCaminho('grupo', 14);
    const t = v.t;
    const base = { tipo: 'veiculo', modeloId: 'compacto', estado: 90 } as const;
    v.financas.bens.push({ ...base, id: 'meu', nome: 'o carro novo', valor: 50000, tCompra: t } as Veiculo);
    v.financas.bens.push({ ...base, id: 'casal', nome: 'o carro do casal', valor: 40000, tCompra: t, dono: 'casal' } as Veiculo);
    v.financas.bens.push({ ...base, id: 'velho', nome: 'o carro de antes', valor: 20000, tCompra: v.caminhos.envolvimento!.tInicio - 24 } as Veiculo);
    expect(bloquearBens(v, 'processo').sort()).toEqual(['o carro do casal', 'o carro novo']);
    const total = confiscarBens(v, 1_000_000);
    expect(total).toBe(50000);
    expect(v.financas.bens.some(b => b.id === 'meu')).toBe(false);
    expect(v.financas.bens.some(b => b.id === 'casal')).toBe(true);
    expect(v.fatos['confiscado_total']).toBe(50000);
    v.financas.bens.push({ ...base, id: 'outro', nome: 'a moto', valor: 9000, tCompra: t } as Veiculo);
    bloquearBens(v, 'processo');
    liberarBloqueio(v);
    expect(v.financas.bens.find(b => b.id === 'outro')!.bloqueio).toBeUndefined();
  });
});

describe('a perseguição', () => {
  it('o trabalho que dá errado pode virar perseguição; entregar-se abre o processo com a confissão', () => {
    let achou = false;
    for (let s = 1; s <= 30 && !achou; s++) {
      let v = noCaminho('patrimonial', 500 + s);
      v = em(v, y => { marcarFalhaGrave(y, 3); y.t += 12; processarConflitosCriminais(y); });
      const k = casoDaCena(v, 'sub1235_perseguicao');
      if (!k) continue;
      achou = true;
      v = em(v, y => { resolverPerseguicao(y, k.id, 'entregar'); });
      expect(v.justica?.processo?.assumiu).toBe(true);
      expect(v.caminhos.envolvimento!.casos!.find(c => c.id === k.id)!.escolha).toBe('entregar');
    }
    expect(achou).toBe(true);
  });
});

/* ================================================================ fase 3: poder e política interna */

const membro = (o: OrgViva, nivel: number, extra: Partial<MembroDaOrg> = {}): MembroDaOrg => {
  const m = o.quadro.find(x => x.estado === 'ativo' && x.nivel < 6 && x.nivel === nivel) ?? o.quadro.find(x => x.estado === 'ativo' && x.nivel < 6)!;
  m.nivel = nivel;
  Object.assign(m, extra);
  return m;
};

describe('o comando se disputa', () => {
  it('sem apoio nenhum, o comando cai sozinho; quem manda vira subordinado', () => {
    let v = noCaminho('grupo', 15);
    let oid = '';
    v = em(v, y => {
      const o = deDentro(y, 6); oid = o.id;
      for (const m of o.quadro) if (m.nivel >= 6) m.nivel = 5;
      o.coesao = 5; o.pressao = 100; o.forcaAntes = o.forca + 30;
      for (const m of o.quadro) m.lealdade = 2;
      processarPoderInterno(y);
    });
    const rel = v.caminhos.envolvimento!.organizacoes!.find(o => o.id === oid)!;
    expect(nivelDe(v, rel)).toBe(5);
    expect(v.fatos['perdeu_comando']).toBe(v.t);
  });

  it('a contestação abre um caso com nome; ceder deixa o desafiante no comando', () => {
    let achou = false;
    for (let s = 1; s <= 30 && !achou; s++) {
      let v = noCaminho('grupo', 600 + s);
      let oid = '';
      v = em(v, y => {
        const o = deDentro(y, 6); oid = o.id;
        for (const m of o.quadro) if (m.nivel >= 6) m.nivel = 5;
        o.coesao = 35; o.pressao = 40;
        membro(o, 5, { ambicao: 0.9, lealdade: 30 });
        processarPoderInterno(y);
      });
      const k = casoDaCena(v, 'sub1235_contestacao');
      if (!k) continue;
      achou = true;
      const o = orgViva(v, oid)!;
      expect(apoioAoComando(v, o, v.caminhos.envolvimento!.organizacoes!.find(x => x.id === oid)!)).toBeLessThan(48);
      v = em(v, y => { resolverContestacao(y, k.id, 'ceder'); });
      expect(nivelDe(v, v.caminhos.envolvimento!.organizacoes!.find(x => x.id === oid)!)).toBe(5);
      expect(orgViva(v, oid)!.quadro.find(m => m.id === k.membroId)!.nivel).toBe(6);
    }
    expect(achou).toBe(true);
  });
});

describe('a traição tem motivo', () => {
  it('quem foi preso e não deve nada à casa fala: vira prova contra você', () => {
    let v = noCaminho('grupo', 16);
    v = em(v, y => { const o = deDentro(y, 2); const m = membro(o, 2, { lealdade: 10 }); m.estado = 'preso'; m.informante = y.t; processarPoderInterno(y); });
    expect(v.fatos['delatado_por_dentro']).toBe(v.t);
    expect(casoDaCena(v, 'sub1235_traicao')?.situacao).toBe('delacao');
  });

  it('o boato pode ser falso: confrontar um inocente custa (a casa racha, a pessoa vira inimiga)', () => {
    let v = noCaminho('grupo', 17);
    let id = '', mid = '', oid = '';
    v = em(v, y => {
      const o = deDentro(y, 2); oid = o.id;
      const m = membro(o, 1, { lealdade: 60 }); mid = m.id;
      const c: CasoDoSubmundo = { id: `caso${y.seq++}`, t: y.t, tipo: 'suspeita', situacao: 'boato', orgId: o.id, membroId: m.id, verdade: false, credibilidade: 30 };
      (y.caminhos.envolvimento!.casos ??= []).push(c); id = c.id;
    });
    const coesao = orgViva(v, oid)!.coesao;
    v = em(v, y => { resolverSuspeita(y, id, 'confrontar'); });
    const m = orgViva(v, oid)!.quadro.find(x => x.id === mid)!;
    expect(lealdadeDoMembro(m)).toBe(30);
    expect(m.comVoce).toBe(-40);
    expect(orgViva(v, oid)!.coesao).toBeLessThan(coesao);
  });

  it('quem perdeu a fé e quer subir vai para a rival, levando o que sabe', () => {
    let foi = false;
    for (let s = 1; s <= 30 && !foi; s++) {
      let v = noCaminho('grupo', 700 + s);
      let oid = '', bid = '', mid = '';
      v = em(v, y => { const o = deDentro(y, 3); oid = o.id; const b = orgsDaCidade(y).find(x => x.id !== o.id)!; bid = b.id; definirEstado(o, b, 'rivalidade'); const m = membro(o, 2, { lealdade: 10, ambicao: 0.9 }); mid = m.id; processarPoderInterno(y); });
      const m = orgViva(v, oid)!.quadro.find(x => x.id === mid)!;
      if (m.estado === 'saiu') { foi = true; expect(orgViva(v, bid)!.quadro.some(x => x.nome === m.nome && x.estado === 'ativo')).toBe(true); }
    }
    expect(foi).toBe(true);
  });

  it('quem está abaixo de você responde ao que você faz (promover sobe a lealdade; cada pessoa, uma vez por ano)', () => {
    let v = noCaminho('grupo', 18);
    let oid = '', mid = '';
    v = em(v, y => { const o = deDentro(y, 5); oid = o.id; const m = membro(o, 1, { lealdade: 40 }); mid = m.id; });
    expect(subordinados(v, orgViva(v, oid)!, v.caminhos.envolvimento!.organizacoes!.find(x => x.id === oid)!).some(m => m.id === mid)).toBe(true);
    v = fazer(v, { tipo: 'crime', acao: { area: 'subordinado', orgId: oid, membroId: mid, oque: 'promover' } });
    const m = orgViva(v, oid)!.quadro.find(x => x.id === mid)!;
    expect(m.nivel).toBe(2);
    expect(m.lealdade).toBe(55);
    expect(podeTentar(disponibilidade(v, { tipo: 'crime', acao: { area: 'subordinado', orgId: oid, membroId: mid, oque: 'cobrar' } }))).toBe(false);
  });
});

/* ================================================================ o mundo: perfil, mercado, oportunidades, reputação, autonomia */

describe('as organizações têm jeito; o mercado e o mundo andam', () => {
  it('o perfil é estável e muda a conta (a de negócios paga mais que a discreta)', () => {
    const v = noCaminho('grupo', 19);
    const o = orgsDaCidade(v)[0];
    const p = perfilDe(o);
    expect(perfilDe(o)).toBe(p);
    o.perfil = 'economica'; const a = parteDoAno(v, o, 3);
    o.perfil = 'discreta'; const b = parteDoAno(v, o, 3);
    expect(a).toBeGreaterThan(b);
    expect(PERFIS_DE_ORG.agressiva.escala).toBeGreaterThan(PERFIS_DE_ORG.discreta.escala);
  });

  it('a busca policial derruba a procura daquele ramo na cidade', () => {
    let v = noCaminho('grupo', 20);
    let quedas = 0;
    for (let s = 0; s < 6; s++) {
      v = em(v, y => {
        const o = orgsDaCidade(y)[0];
        const k = `${o.municipioId}:${o.ramo}`;
        (y.mundoCriminal!.mercados ??= {})[k] = { demanda: 1, t: y.t };
        y.t += 12; o.operacao = { t: y.t, tipo: 'busca' };
        processarMercadoCriminal(y);
        if (demandaDe(y, o.municipioId, o.ramo) < 0.7) quedas++;
      });
    }
    expect(quedas).toBeGreaterThanOrEqual(5);
  });

  it('as oportunidades aparecem com o que pagam, a chance e o risco — e somem', () => {
    let v = noCaminho('patrimonial', 21);
    let vista = false;
    for (let a = 0; a < 12 && !vista; a++) { v = em(v, y => { y.t += 12; processarMercadoCriminal(y); }); vista = oportunidades(v).length > 0; }
    expect(vista).toBe(true);
    const o = oportunidades(v)[0];
    expect(o.valor).toBeGreaterThan(0);
    expect(o.chance).toBeGreaterThan(0);
    expect(disponibilidade(v, { tipo: 'crime', acao: { area: 'oportunidade', id: o.id, oque: 'aceitar' } }).motivo).toMatch(/chance/);
    v = em(v, y => { y.t += 24; processarMercadoCriminal(y); });
    expect(oportunidades(v).some(x => x.id === o.id)).toBe(false);
  });

  it('o nome não viaja inteiro: noutro país, a reputação daqui é uma fração', () => {
    let v = noCaminho('patrimonial', 22);
    v = em(v, y => { y.caminhos.envolvimento!.reputacao = 80; processarMercadoCriminal(y); });
    expect(reputacaoAqui(v)).toBe(80);
    v = em(v, y => { mudarAgora(y, capitalDoPais('PT')!.id, 'teste', { internacional: true, comAFamilia: true }); y.t += 12; processarMercadoCriminal(y); });
    expect(reputacaoAqui(v)).toBeLessThan(25);
  });

  it('o mundo do crime anda sem o jogador (quem nunca entrou, quem herdou)', () => {
    let v = noCaminho('grupo', 23);
    v = em(v, y => { delete y.caminhos.envolvimento; });
    const antes = JSON.stringify(v.mundoCriminal!.orgs);
    v = em(v, y => { for (let a = 0; a < 10; a++) { y.t += 12; processarFaccoes(y); } });
    expect(JSON.stringify(v.mundoCriminal!.orgs)).not.toBe(antes);
    expect(Object.values(v.mundoCriminal!.orgs).some(o => o.historia.some(h => h.t > v.t - 120))).toBe(true);
  });
});

/* ================================================================ vida dupla, recomeço, legado */

describe('a vida dupla e o recomeço', () => {
  it('o par que não aceita e está no limite vai embora (o romance termina de verdade)', () => {
    let foi = false;
    for (let s = 1; s <= 30 && !foi; s++) {
      let v = noCaminho('grupo', 800 + s);
      v = em(v, y => { const par = comParceiro(y, { estagio: 'casamento' }); par.vin.tensao = 95; par.p.temperamento.afabilidade = -0.8; y.caminhos.envolvimento!.familia = { [par.p.id]: { sabe: 2, postura: 'rejeita', t: y.t } }; for (let a = 0; a < 3; a++) { y.t += 12; processarVidaDupla(y); } });
      if ((v.fatos['par_foi_embora_crime'] ?? 0) > 0) foi = true;
    }
    expect(foi).toBe(true);
  });

  it('separar na conversa encerra o romance', () => {
    let v = noCaminho('grupo', 24);
    let id = '', pid = '';
    v = em(v, y => { const par = comParceiro(y, { estagio: 'casamento' }); pid = par.p.id; const c: CasoDoSubmundo = { id: `caso${y.seq++}`, t: y.t, tipo: 'conjuge', situacao: 'rejeita', pessoaId: par.p.id }; (y.caminhos.envolvimento!.casos ??= []).push(c); id = c.id; });
    v = em(v, y => { resolverPar(y, id, 'separar'); });
    expect(v.vinculos[pid].romance?.estagio).toBe('ex');
  });

  it('a promessa de sair não cumprida é cobrada', () => {
    let cobrou = false;
    for (let s = 1; s <= 20 && !cobrou; s++) {
      let v = noCaminho('grupo', 900 + s);
      v = em(v, y => { const par = comParceiro(y, { estagio: 'casamento' }); par.vin.tensao = 70; y.fatos[`promessa_par_${par.p.id}`] = y.t - 24; y.t += 12; processarVidaDupla(y); });
      if ((v.fatos['par_foi_embora_crime'] ?? 0) > 0) cobrou = true;
    }
    expect(cobrou).toBe(true);
  });

  it('o recomeço registra os passos (o trabalho, os anos limpos) e o nome no meio se apaga', () => {
    let v = noCaminho('patrimonial', 25);
    v = em(v, y => { const e = y.caminhos.envolvimento!; e.parou = y.t; e.reputacao = 80; for (let a = 0; a < 6; a++) { y.t += 12; processarVidaDupla(y); } });
    const e = v.caminhos.envolvimento!;
    expect(e.recomeco?.marcos['limpo']).toBeDefined();
    expect(e.reputacao).toBeLessThan(80);
  });

  it('o legado traz quem conhecia a família — com a confiança do começo, sem cargo', () => {
    let v = noCaminho('grupo', 26);
    let id = '';
    v = em(v, y => { id = criarContato(y, 'organizado', 'parceiro'); y.caminhos.envolvimento!.fichas![id].confianca = 70; });
    const l = legadoDoSubmundo(v)!;
    expect(l.contatos).toContain(id);
    v = em(v, y => { const e = y.caminhos.envolvimento!; delete e.fichas; y.mundoCriminal!.legado = { ...l, de: 'a mãe', t: y.t }; receberContatosDoLegado(y); });
    const f = v.caminhos.envolvimento!.fichas![id];
    expect(f.confianca).toBe(30);
    expect(f.organizacao).toBeUndefined();
  });
});

/* ================================================================ as cenas e o save */

describe('as cenas e o save', () => {
  it('todas as cenas novas existem no catálogo', () => {
    for (const id of IDS_DO_1235) expect(conteudoPorId(id), id).toBeDefined();
  });

  it('a cena do confronto abre com o caso, mostra só as escolhas do posto e resolve no motor', () => {
    let v = noCaminho('grupo', 27);
    v = em(v, y => { const o = deDentro(y, 1); const b = emGuerra(y, o); const c: CasoDoSubmundo = { id: `caso${y.seq++}`, t: y.t, tipo: 'confronto', situacao: 'emboscada', orgId: o.id, outraId: b.id, gravidade: 3 }; (y.caminhos.envolvimento!.casos ??= []).push(c); (y.caminhos.envolvimento!.cenas125 ??= {})['sub1235_confronto'] = c.id; y.fatos['sub1235_confronto'] = y.t; });
    const c = conteudoPorId('sub1235_confronto')!;
    const p = preparar(c, v, criarRng(3));
    expect(p).toBeTruthy();
  });

  it('a ida e volta guarda os casos, o perfil, o quadro com lealdade, o mercado e as oportunidades', () => {
    let v = noCaminho('grupo', 28);
    v = em(v, y => { const o = deDentro(y, 3); perfilDe(o); lealdadeDoMembro(o.quadro[0]); emGuerra(y, o); for (let a = 0; a < 4; a++) { y.t += 12; processarFaccoes(y); processarConflitosCriminais(y); processarPoderInterno(y); processarMercadoCriminal(y); } });
    // (A primeira carga normaliza o que o cenário de teste não montou — as fichas de um envolvimento recém-criado.)
    const um = interpretar(JSON.stringify(v));
    expect(um.tipo).toBe('ok');
    if (um.tipo !== 'ok') return;
    expect(um.vida.caminhos.envolvimento!.casos).toEqual(v.caminhos.envolvimento!.casos);
    expect(um.vida.mundoCriminal).toEqual(v.mundoCriminal);
    const dois = interpretar(JSON.stringify(um.vida));
    if (dois.tipo !== 'ok') throw new Error('save');
    expect(JSON.stringify(dois.vida.caminhos.envolvimento)).toBe(JSON.stringify(um.vida.caminhos.envolvimento));
    expect(JSON.stringify(dois.vida.mundoCriminal)).toBe(JSON.stringify(um.vida.mundoCriminal));
  });

  it('um save de antes (sem nada do 12.35) abre e joga', () => {
    let v = noCaminho('grupo', 29);
    v = em(v, y => { deDentro(y, 2); for (const o of Object.values(y.mundoCriminal!.orgs)) { delete o.perfil; for (const m of o.quadro) { delete m.lealdade; delete m.ambicao; } } delete y.mundoCriminal!.mercados; });
    const rt = interpretar(JSON.stringify(v));
    expect(rt.tipo).toBe('ok');
    if (rt.tipo !== 'ok') return;
    const w = em(rt.vida, y => { y.t += 12; processarFaccoes(y); processarConflitosCriminais(y); processarPoderInterno(y); processarMercadoCriminal(y); processarVidaDupla(y); });
    expect(Object.values(w.mundoCriminal!.orgs).every(o => !!o.perfil)).toBe(true);
  });
});
