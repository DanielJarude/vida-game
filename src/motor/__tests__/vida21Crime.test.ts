/**
 * VIDA 21 · o que veio do roubo: o serviço que dá certo diz o que rendeu (dinheiro em espécie e bens concretos), os bens
 * ficam registrados e têm as saídas que fazem sentido (guardar, usar/vestir, vender, se livrar), a venda passa pelo
 * mercado paralelo (preço, risco, quem negocia com você), o dinheiro entra no saldo e no extrato, e o que está em uso
 * pode ser achado — abrindo a investigação, que segue o caminho de sempre. Persistência e sucessão incluídas.
 */
import { describe, expect, it } from 'vitest';
import { adulto, comFilho } from './cenarios';
import { continuarComo } from '../sistemas/sucessao';
import { transacao } from '../nucleo';
import type { Vida } from '../tipos';
import { executar, disponibilidade, type Acao } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { entrar } from '../sistemas/ilicito';
import { garantirCidade } from '../sistemas/faccoes';
import { exportarVida, importarVida } from '../save';
import { criarRng } from '../rng';
import { baseNoMercado21, bensIlicitos21, ofertas21, processarEspolio21, repartir21, saidas21 } from '../v21/crime/espolio21';
import { itemEstilo } from '../dados/estilo';

const pode = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const em = (v: Vida, f: (x: Vida, r: ReturnType<typeof criarRng>) => void) => transacao(v, f).vida;

function noCaminho(semente = 41): Vida {
  let v = adulto(30, { semente, municipioId: 'sao-paulo-sp' });
  v.financas.conta = 200_000; v.financas.dividas = []; v.momento = null; delete v.fila; v.justica = undefined;
  v = em(v, (x, r) => { entrar(x, 'patrimonial', undefined, r); garantirCidade(x); x.caminhos.envolvimento!.especializacoes!.furtos!.experiencia = 60; });
  return v;
}

/** Faz serviços até sair um com bens (o serviço pode dar errado, ou render só dinheiro). */
function comBens(v: Vida, oque: 'servico_pequeno' | 'servico_maior' = 'servico_pequeno'): { v: Vida; texto: string } {
  for (let k = 0; k < 40; k++) {
    const a: Acao = { tipo: 'submundo', oque, ramo: 'furtos' };
    if (!pode(v, a)) { v = em(v, x => { x.t += 12; x.anoAtual = { acoes: [] }; }); continue; }
    const antes = bensIlicitos21(v).length;
    const s = executar(v, a);
    v = s.vida;
    if (bensIlicitos21(v).length > antes) return { v, texto: s.resultado ?? '' };
    v = em(v, x => { x.t += 1; });
  }
  throw new Error('nenhum serviço rendeu bens');
}

describe('VIDA 21 · a parte de um serviço', () => {
  it('soma o mesmo que antes: o dinheiro em espécie + o que o mercado paralelo pagaria pelos bens ≈ a parte', () => {
    const v = noCaminho();
    let diferenca = 0, comBem = 0, soDinheiro = 0;
    const categorias = new Set<string>();
    for (let k = 0; k < 60; k++) {
      const w = em(v, x => { x.t += k; });
      const parte = 6000;
      const p = repartir21(w, parte, k % 2 ? 3 : 1, 'teste', 3);
      const soma = p.dinheiro + p.bens.reduce((s, b) => s + baseNoMercado21(b), 0);
      diferenca = Math.max(diferenca, Math.abs(soma - parte) / parte);
      if (p.bens.length) comBem++; else soDinheiro++;
      for (const b of p.bens) categorias.add(b.categoria);
    }
    expect(diferenca).toBeLessThan(0.35);
    expect(comBem).toBeGreaterThan(30);
    expect(soDinheiro).toBeGreaterThan(3);
    expect(categorias.size).toBeGreaterThanOrEqual(6);
  });

  it('o serviço que dá certo diz o que rendeu; o bem fica registrado; o dinheiro entra no saldo', () => {
    const v0 = noCaminho();
    const { v, texto } = comBens(v0);
    const b = bensIlicitos21(v)[0];
    expect(texto).toContain(b.nome.charAt(0).toLowerCase() + b.nome.slice(1));
    expect(texto).toMatch(/O que veio dos serviços/);
    expect(b.estado).toBe('escondido');
  });
});

describe('VIDA 21 · o destino dos bens', () => {
  it('cada bem só tem as saídas que fazem sentido (mercadoria não se usa; dinheiro não é bem)', () => {
    const v = noCaminho();
    const p = repartir21(em(v, x => { x.t += 3; }), 40000, 3, 'teste', 3);
    for (const b of p.bens) {
      const s = saidas21(b);
      expect(s).toContain('vender');
      expect(s).toContain('descartar');
      if (b.categoria === 'mercadoria') expect(s).not.toContain('usar');
    }
  });

  it('a joia/relógio/bolsa/roupa vai para a Aparência, é vestida, guarda de volta, e sobrevive a recarregar', () => {
    let v = noCaminho();
    v = em(v, x => { x.espolio21 = { bens: [{ id: 'b1', modelo: 'rel_luxo', categoria: 'relogio', nome: 'Relógio suíço de luxo', valor: 24000, t: x.t, origem: 'teste', rastreavel: true, calor: 50, estado: 'escondido', estiloId: 'relogio_luxo' }], reputacao: 0, historico: [] }; });
    const usar: Acao = { tipo: 'espolio21', oque: 'usar', bemId: 'b1' };
    expect(pode(v, usar)).toBe(true);
    v = executar(v, usar).vida;
    const peca = v.eu.estilo!.itens.find(x => x.itemId === 'relogio_luxo')!;
    expect(peca.usando).toBe(true);
    expect(bensIlicitos21(v)[0].estado).toBe('no_guarda_roupa');
    const l = importarVida(exportarVida(v));
    if (l.tipo !== 'ok') throw new Error(l.tipo);
    expect(bensIlicitos21(l.vida)[0].pecaId).toBe(peca.id);
    expect(l.vida.eu.estilo!.itens.find(x => x.id === peca.id)!.usando).toBe(true);
    v = executar(l.vida, { tipo: 'espolio21', oque: 'guardar', bemId: 'b1' }).vida;
    expect(v.eu.estilo!.itens.some(x => x.id === peca.id)).toBe(false);
    expect(bensIlicitos21(v)[0].estado).toBe('escondido');
    expect(itemEstilo('relogio_luxo')).toBeTruthy();
  });

  it('a venda: só os compradores que compram aquilo; o colecionador exige nome; o dinheiro entra (ou o bem é apreendido)', () => {
    let v = noCaminho();
    v = em(v, x => { x.espolio21 = { bens: [{ id: 'q', modelo: 'quadro', categoria: 'arte', nome: 'Quadro de um artista conhecido', valor: 180000, t: x.t, origem: 'teste', rastreavel: true, raro: true, calor: 20, estado: 'escondido' }], reputacao: 0, historico: [] }; });
    const b = bensIlicitos21(v)[0];
    const of = ofertas21(v, b);
    expect(of.map(o => o.comprador)).toEqual(['colecionador']);
    expect(of[0].liberado).toBe(false);
    expect(pode(v, { tipo: 'espolio21', oque: 'vender', bemId: 'q', comprador: 'colecionador' })).toBe(false);
    v = em(v, x => { x.espolio21!.reputacao = 60; });
    const conta = v.financas.conta;
    const preco = ofertas21(v, bensIlicitos21(v)[0]).find(o => o.comprador === 'colecionador')!.preco;
    const w = executar(v, { tipo: 'espolio21', oque: 'vender', bemId: 'q', comprador: 'colecionador' }).vida;
    expect(bensIlicitos21(w)).toHaveLength(0);
    const h = w.espolio21!.historico.slice(-1)[0];
    if (h.desfecho === 'vendido') { expect(Math.round(w.financas.conta - conta)).toBe(preco); expect((w.financas.extratoAberto?.linhas ?? []).some(l => l.tipo === 'por_fora')).toBe(true); }
    else { expect(h.desfecho).toBe('apreendido'); expect(w.financas.conta).toBe(conta); }
  });

  it('em muitas vendas: quase todas pagam, algumas dão errado (apreensão + exposição); a reputação sobe com as limpas', () => {
    let vendidos = 0, apreendidos = 0;
    for (let k = 0; k < 40; k++) {
      let v = noCaminho(100 + k);
      v = em(v, x => { x.espolio21 = { bens: [{ id: 'c', modelo: 'cel_top', categoria: 'celular', nome: 'Celular top de linha', valor: 7500, t: x.t, origem: 'teste', rastreavel: true, calor: 80, estado: 'escondido' }], reputacao: 0, historico: [] }; });
      const exp = v.caminhos.envolvimento!.exposicao;
      v = executar(v, { tipo: 'espolio21', oque: 'vender', bemId: 'c', comprador: 'usados' }).vida;
      const h = v.espolio21!.historico.slice(-1)[0];
      if (h.desfecho === 'vendido') { vendidos++; expect(v.espolio21!.reputacao).toBeGreaterThan(0); }
      else { apreendidos++; expect(v.caminhos.envolvimento!.exposicao).toBeGreaterThan(exp); }
    }
    expect(vendidos).toBeGreaterThan(25);
    expect(apreendidos).toBeGreaterThan(0);
  });
});

describe('VIDA 21 · o depois', () => {
  it('o carro sem documento em uso é parado numa blitz em poucos anos — e isso pode abrir a investigação', () => {
    let achou = 0, investigou = 0;
    for (let k = 0; k < 20; k++) {
      let v = noCaminho(300 + k);
      v = em(v, x => { x.espolio21 = { bens: [{ id: 'car', modelo: 'carro_popular', categoria: 'veiculo', nome: 'Carro popular', valor: 62000, t: x.t, origem: 'teste', rastreavel: true, calor: 80, estado: 'em_uso' }], reputacao: 0, historico: [] }; x.caminhos.envolvimento!.investigado = undefined; });
      for (let a = 0; a < 5 && bensIlicitos21(v).length; a++) v = em(v, x => { x.t += 12; processarEspolio21(x); });
      if (!bensIlicitos21(v).length) achou++;
      if (v.caminhos.envolvimento!.investigado !== undefined) investigou++;
    }
    expect(achou).toBeGreaterThan(12);
    expect(investigou).toBeGreaterThan(0);
  });

  it('com um processo aberto, a busca leva o que está escondido (uma vez por processo)', () => {
    let v = noCaminho();
    v = em(v, x => {
      x.espolio21 = { bens: Array.from({ length: 6 }, (_, k) => ({ id: `m${k}`, modelo: 'moedas', categoria: 'colecionavel' as const, nome: 'Coleção de moedas antigas', valor: 12000, t: x.t, origem: 'teste', rastreavel: false, calor: 40, estado: 'escondido' as const })), reputacao: 0, historico: [] };
      x.justica = { antecedentes: [], processo: { tInicio: x.t, tJulgamento: x.t + 12, categoria: 'patrimonial', defesa: 'publica' } } as Vida['justica'];
    });
    v = em(v, x => { processarEspolio21(x); });
    const depois = bensIlicitos21(v).length;
    expect(depois).toBeLessThan(6);
    expect(v.espolio21!.historico.every(h => h.desfecho === 'apreendido')).toBe(true);
    // A mesma busca não se repete no mesmo processo.
    v = em(v, x => { x.t += 1; processarEspolio21(x); });
    expect(v.espolio21!.historico.filter(h => h.desfecho === 'apreendido').length).toBe(6 - depois);
  });

  it('quem continua a história não herda o que estava escondido', () => {
    let v = em(noCaminho(), x => { repartir21(x, 30000, 3, 'teste', 3); });
    if (!bensIlicitos21(v).length) v = em(v, x => { x.espolio21!.bens.push({ id: 'z', modelo: 'moedas', categoria: 'colecionavel', nome: 'Coleção de moedas antigas', valor: 12000, t: x.t, origem: 'teste', rastreavel: false, calor: 40, estado: 'escondido' }); });
    const filho = comFilho(v, 22, { casa: false });
    v = em(v, x => { x.morte = { t: x.t, causa: 'teste', heranca: { liquido: 0, partes: [], bens: [], dividas: 0 } }; });
    const r = continuarComo(v, filho.p.id);
    expect(r.erro).toBeUndefined();
    expect(r.vida.espolio21).toBeUndefined();
  });
});
