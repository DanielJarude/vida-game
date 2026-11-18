/**
 * VIDA 27 · §10–12 e o relato do playtest — o mercado paralelo e o que vem do roubo.
 *
 *   NOME NO MEIO   o posto numa organização conta para os compradores (o segundo no comando não é "sem nome").
 *   LUGAR          o que se acha depende do lugar (casa simples, joalheria, carga, desmonte); o dinheiro em espécie é o
 *                  que o lugar tinha, separado dos objetos.
 *   LOTE           vender vários de uma vez: o preço da prévia é o pago, nada é vendido duas vezes, o que não foi
 *                  selecionado fica, a venda que dá errado para o resto, e tudo persiste.
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { transacao } from '../nucleo';
import { executar, disponibilidade } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { interpretar } from '../save';
import { entrar } from '../sistemas/ilicito';
import { garantirCidade, orgsDaCidade, relacaoCom, definirNivel } from '../sistemas/faccoes';
import { bensIlicitos21, montarLote21, nomeNoMercado21, ofertas21, repartir21, espolio21, venderLote21 } from '../v21/crime/espolio21';
import { LOCAIS21, MODELOS_ESPOLIO21, type BemIlicito21, type LocalDoRoubo21 } from '../dados21/crime/espolio21';
import { economiaLocal } from '../dados/lugares';
import type { Vida } from '../tipos';

function noCrime(semente = 41): Vida {
  let v = adulto(30, { semente, municipioId: 'sao-paulo-sp' });
  v.financas.conta = 50_000; v.financas.dividas = []; v.momento = null; delete v.fila; v.justica = undefined;
  v = transacao(v, (x, r) => { entrar(x, 'grupo', undefined, r); garantirCidade(x); }).vida;
  return v;
}
const bem = (id: string, modelo: string, extra: Partial<BemIlicito21> = {}): BemIlicito21 => {
  const m = MODELOS_ESPOLIO21.find(x => x.id === modelo)!;
  return { id, modelo, categoria: m.categoria, nome: m.nome, valor: m.preco ?? 5000, t: 0, origem: 'teste', rastreavel: m.rastreavel, calor: 0, estado: 'escondido', ...extra };
};

describe('VIDA 27 · nome no mercado paralelo', () => {
  it('o segundo no comando de uma facção negocia com o desmanche (antes: "sem nome no meio")', () => {
    const v = noCrime();
    const o = orgsDaCidade(v)[0];
    const rel = relacaoCom(v, o);
    rel.relacao = 'membro'; rel.lealdade = 70;
    definirNivel(v, rel, 5);
    espolio21(v).reputacao = 0;
    espolio21(v).bens = [bem('car', 'carro_popular', { t: v.t })];
    const n = nomeNoMercado21(v);
    expect(n.valor).toBeGreaterThanOrEqual(25);
    expect(n.porque).toContain(o.nome);
    const des = ofertas21(v, espolio21(v).bens[0]).find(x => x.comprador === 'desmanche')!;
    expect(des.liberado).toBe(true);
    expect(podeTentar(disponibilidade(v, { tipo: 'espolio21', oque: 'vender', bemId: 'car', comprador: 'desmanche' }))).toBe(true);
  });

  it('quem foi expulso não leva o nome da organização', () => {
    const v = noCrime();
    const rel = relacaoCom(v, orgsDaCidade(v)[0]);
    rel.relacao = 'membro'; definirNivel(v, rel, 5); rel.expulso = v.t; rel.saiu = v.t;
    espolio21(v).reputacao = 0;
    v.caminhos.envolvimento!.reputacao = 0; v.caminhos.envolvimento!.reputacaoLocal = {};
    expect(nomeNoMercado21(v).valor).toBeLessThan(25);
  });
});

describe('VIDA 27 · o que se acha depende do lugar', () => {
  const casos: LocalDoRoubo21[] = ['pessoa_rua', 'casa_simples', 'casa_media', 'casa_alto_padrao', 'comercio_bairro', 'loja_eletronicos', 'joalheria', 'loja_grife', 'carga', 'patio_veiculos', 'desmonte'];
  for (const local of casos) it(`${local}: só objetos que um lugar assim tem, na faixa dele, e o dinheiro do lugar`, () => {
    const L = LOCAIS21[local];
    for (let k = 0; k < 25; k++) {
      const v = noCrime();
      v.t += k; // sorteios diferentes
      const f = economiaLocal(v.moradia.municipioId).custo;
      const p = repartir21(v, 400_000, L.escala, `teste${k}`, 3, local);
      expect(p.local).toBe(local);
      expect(p.dinheiro).toBeGreaterThanOrEqual(Math.floor(L.especie[0] * f / 50) * 50 - 50);
      expect(p.dinheiro).toBeLessThanOrEqual(Math.ceil(L.especie[1] * f / 50) * 50 + 50);
      expect(p.bens.length).toBeLessThanOrEqual(L.maxItens);
      for (const b of p.bens) {
        expect(L.categorias).toContain(b.categoria);
        if (L.so) expect(L.so).toContain(b.modelo);
        expect(b.valor).toBeLessThanOrEqual(L.teto * f + 10);
        if (!L.usado) expect(b.conservacao).toBeUndefined();
        expect(b.local).toBe(local);
      }
    }
  });

  it('uma casa simples nunca rende quadro, relógio suíço ou carro', () => {
    for (let k = 0; k < 40; k++) {
      const v = noCrime(); v.t += k;
      const p = repartir21(v, 50_000, 1, `s${k}`, 3, 'casa_simples');
      expect(p.bens.some(b => ['quadro', 'rel_luxo', 'rel_complicacao', 'carro_popular', 'suv_luxo', 'colar_diamantes'].includes(b.modelo))).toBe(false);
    }
  });

  it('o valor de revenda de um objeto usado é menor que o do novo', () => {
    const v = noCrime();
    espolio21(v).bens = [bem('novo', 'notebook', { valor: 4500 }), bem('usado', 'notebook', { valor: Math.round(4500 * 0.6), conservacao: 0.6 })];
    const [a, b] = espolio21(v).bens.map(x => ofertas21(v, x).find(o => o.comprador === 'bairro')!.preco);
    expect(b).toBeLessThan(a);
  });
});

describe('VIDA 27 · vender vários de uma vez', () => {
  function comEstoque(): Vida {
    const v = noCrime();
    espolio21(v).reputacao = 60;
    v.caminhos.envolvimento!.cautela = true;
    espolio21(v).bens = [
      ...Array.from({ length: 5 }, (_, k) => bem(`cel${k}`, 'cel_medio', { valor: 1800 })),
      bem('fone', 'fone', { valor: 1500 }), bem('rel', 'rel_mergulho', { valor: 3000 }), bem('car', 'carro_popular', { valor: 62000 })
    ];
    return v;
  }

  it('a prévia agrupa por comprador, mostra o total e ignora repetidos e o que não é seu', () => {
    const v = comEstoque();
    const l = montarLote21(v, ['cel0', 'cel1', 'cel1', 'nao_existe', 'fone'], 'melhor');
    expect(l.itens.map(x => x.bemId)).toEqual(['cel0', 'cel1', 'fone']);
    expect(l.total).toBe(l.itens.reduce((s, x) => s + x.preco, 0));
    expect(l.porComprador.reduce((s, g) => s + g.n, 0)).toBe(3);
  });

  it('o comprador escolhido que não mexe com aquilo deixa o item fora, com o motivo', () => {
    const v = comEstoque();
    const l = montarLote21(v, ['cel0', 'car'], 'usados');
    expect(l.itens.map(x => x.bemId)).toEqual(['cel0']);
    expect(l.fora[0].bemId).toBe('car');
    expect(l.fora[0].motivo).toMatch(/não mexe/);
  });

  it('a venda paga o que a prévia mostrou, item a item, uma vez; o resto fica; persiste', () => {
    let feitos = 0;
    for (let k = 0; k < 12; k++) {
      let v = comEstoque(); v.t += k;
      const ids = ['cel0', 'cel1', 'cel2', 'fone'];
      const previa = montarLote21(v, ids, 'melhor');
      const antes = v.financas.conta;
      const r = executar(v, { tipo: 'espolio21_lote', bemIds: ids, comprador: 'melhor' });
      v = r.vida;
      const es = v.espolio21!;
      const vendidos = es.historico.filter(h => h.desfecho === 'vendido');
      const apreendidos = es.historico.filter(h => h.desfecho === 'apreendido');
      // O dinheiro que entrou é exatamente a soma das vendas registradas, aos preços da prévia.
      const somaPrevia = previa.itens.slice(0, vendidos.length).reduce((s, x) => s + x.preco, 0);
      expect(vendidos.reduce((s, h) => s + (h.valor ?? 0), 0)).toBe(somaPrevia);
      expect(v.financas.conta - antes).toBe(somaPrevia);
      // No máximo uma deu errado (a venda para), e nada some sem registro.
      expect(apreendidos.length).toBeLessThanOrEqual(1);
      const restantes = bensIlicitos21(v).filter(b => ids.includes(b.id)).length;
      expect(vendidos.length + apreendidos.length + restantes).toBe(ids.length);
      // O que não foi selecionado continua lá.
      for (const id of ['cel3', 'cel4', 'rel', 'car']) expect(bensIlicitos21(v).some(b => b.id === id)).toBe(true);
      // Vender de novo o que já saiu: nada acontece.
      const conta = v.financas.conta;
      const vend = vendidos.length;
      if (vend) {
        const de = previa.itens[0].bemId;
        expect(podeTentar(disponibilidade(v, { tipo: 'espolio21_lote', bemIds: [de], comprador: 'melhor' }))).toBe(false);
        venderLote21(v, [de], 'melhor');
        expect(v.financas.conta).toBe(conta);
      }
      // Salvar e carregar: os mesmos bens, o mesmo saldo.
      const lido = interpretar(JSON.stringify(v));
      expect(lido.tipo).toBe('ok');
      if (lido.tipo === 'ok') { expect(lido.vida.financas.conta).toBe(v.financas.conta); expect(bensIlicitos21(lido.vida).map(b => b.id)).toEqual(bensIlicitos21(v).map(b => b.id)); }
      if (!apreendidos.length) feitos++;
    }
    expect(feitos).toBeGreaterThan(0);
  });

  it('vender tudo de um tipo de uma vez (grandes quantidades)', () => {
    let v = noCrime();
    espolio21(v).reputacao = 80;
    v.caminhos.envolvimento!.cautela = true;
    espolio21(v).bens = Array.from({ length: 40 }, (_, k) => bem(`m${k}`, 'moedas', { valor: 12000 }));
    const ids = bensIlicitos21(v).map(b => b.id);
    const l = montarLote21(v, ids, 'melhor');
    expect(l.itens.length).toBe(40);
    v = executar(v, { tipo: 'espolio21_lote', bemIds: ids, comprador: 'melhor' }).vida;
    const h = v.espolio21!.historico;
    expect(h.filter(x => x.desfecho === 'vendido').length + h.filter(x => x.desfecho === 'apreendido').length + bensIlicitos21(v).length).toBe(40);
  });
});

/* ================================================================ §10: os pedidos com contexto */
import { proporEncomenda, processarEncomendas, abertas, TIPOS } from '../sistemas/encomendas';
import { criarRng } from '../rng';

describe('VIDA 27 · pedidos com contexto e progressão', () => {
  it('cada pedido diz o quê, por quê e o que pesa se recusar', () => {
    const v = noCrime();
    const o = orgsDaCidade(v)[0];
    const rel = relacaoCom(v, o); rel.relacao = 'membro'; definirNivel(v, rel, 1);
    const x = proporEncomenda(v, criarRng(1), 'organizado', { orgId: o.id })!;
    expect(x.alvo).toBeTruthy();
    expect(x.porque).toBeTruthy();
    expect(x.seRecusar).toMatch(/recusa pesa/);
  });

  it('quem está começando não recebe o trabalho grande; o menor de 16, só o pequeno e nada de gente grande', () => {
    const v = noCrime();
    v.caminhos.envolvimento!.especializacoes = {};
    for (let k = 0; k < 40; k++) expect(proporEncomenda(v, criarRng(k), 'furtos', {})!.gravidade).toBeLessThan(3);
    const m = noCrime(); m.eu.tNasc = m.t - 15 * 12;
    for (let k = 0; k < 30; k++) { const x = proporEncomenda(m, criarRng(k), 'organizado', {})!; expect(x.gravidade).toBe(1); expect(['org_cobrar', 'org_acompanhar']).not.toContain(x.tipo); }
  });

  it('o segundo no comando não recebe "um recado da organização": recebe o que é do posto', () => {
    const v = noCrime();
    const o = orgsDaCidade(v)[0];
    const rel = relacaoCom(v, o); rel.relacao = 'membro'; rel.lealdade = 80; definirNivel(v, rel, 5);
    const tipos = new Set<string>();
    for (let k = 0; k < 40; k++) { const x = proporEncomenda(v, criarRng(k), 'organizado', { orgId: o.id })!; expect(x.gravidade).toBeGreaterThan(1); tipos.add(x.tipo); }
    expect([...tipos].some(t => TIPOS.organizado.find(y => y.id === t)?.nivel !== undefined)).toBe(true);
  });

  it('o mesmo pedido não se repete em dois anos quando há outro', () => {
    const v = noCrime();
    const a = proporEncomenda(v, criarRng(5), 'furtos', {}, 1)!;
    for (let k = 0; k < 10; k++) { const b = proporEncomenda(v, criarRng(100 + k), 'furtos', {}, 1)!; if (TIPOS.furtos.filter(t => t.g === 1).length > 1 && k === 0) expect(b.tipo).not.toBe(a.tipo); }
  });

  it('quem colaborou com a polícia não recebe pedido de ninguém do meio', () => {
    const v = noCrime();
    v.fatos['colaborou'] = v.t - 12;
    v.caminhos.envolvimento!.encomendas = [];
    for (let k = 0; k < 5; k++) { v.t += 12; processarEncomendas(v); }
    expect(abertas(v).length).toBe(0);
  });
});
