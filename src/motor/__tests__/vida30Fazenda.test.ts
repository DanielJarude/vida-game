/**
 * VIDA 30 · §6 — a Fazenda desafiadora sem ser injusta: custo de quem cuida proporcional ao tamanho, o ano ruim vira
 * crédito de custeio (não cartão), o excesso de gado se corrige, a horta não é monocultura, os problemas aparecem com
 * saídas que funcionam, e uma propriedade em dificuldade se recupera.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { carregarMundo } from '../mundo/carregar';
import { nova, viverAte } from './ajuda';
import { criarRng } from '../rng';
import { executar } from '../acoes';
import { contratar } from '../sistemas/trabalho';
import { ocupacao } from '../dados/ocupacoes';
import { capacidadeUA, custeioDoPrejuizo30, custoDeGestao, fatorDoSolo30, novaPropriedade, povoar, salarioDoCaseiro30, salarioDoGerente30, todasAsPropriedades, uaOcupadas, viverAnoDaPropriedade, type PropriedadeRural18 } from '../v18/rural/fazenda18';
import { fatoresDaProducao30, problemasDaPropriedade30 } from '../v18/rural/problemas30';
import type { Imovel, Vida } from '../tipos';

beforeAll(async () => { await carregarMundo(); });

function comTerra(tipo: PropriedadeRural18['tipo'], ha: number, s = 1, produtor = true): { v: Vida; p: PropriedadeRural18; im: Imovel } {
  let v = viverAte(nova({ semente: 3300 + s, genero: 'feminino', municipioId: 'uberlandia-mg' } as never), 34);
  let k = 0;
  while (v.morte) v = viverAte(nova({ semente: 3900 + s + ++k, genero: 'feminino', municipioId: 'uberlandia-mg' } as never), 34);
  v.momento = null;
  v.financas.dividas = [];
  if (produtor) contratar(v, criarRng(s), ocupacao('produtor_rural')); else v.trabalho.atual = undefined;
  const r = criarRng(500 + s);
  const p = novaPropriedade(v, r, tipo, ha, 'uberlandia-mg', 'compra' as never);
  povoar(p, r, Math.floor(v.t / 12) + 1, 0.6);
  const im = { id: `im${v.seq++}`, tipo: 'imovel', modeloId: 'sitio', nome: p.nome, valor: 0, precoPago: 0, tCompra: v.t, municipioId: p.municipioId, estado: 70, bairro: 'na zona rural', historia: [], dono: 'eu', tManutencao: v.t, rural: p } as unknown as Imovel;
  v.financas.bens.push(im);
  return { v, p, im };
}

describe('VIDA 30 · §6 o custo cresce com o tamanho', () => {
  it('o caseiro da chácara é de meio período; o gerente cresce com a área até o teto de antes', () => {
    expect(salarioDoCaseiro30(4)).toBeLessThan(20000);
    expect(salarioDoCaseiro30(25)).toBe(32000);
    expect(salarioDoGerente30(100)).toBeLessThan(salarioDoGerente30(299));
    expect(salarioDoGerente30(301) - salarioDoGerente30(299)).toBeLessThan(5000); // sem o salto de 78 → 140 mil
    expect(salarioDoGerente30(5000)).toBe(140000);
    const { v, p } = comTerra('chacara', 4, 2, false);
    expect(custoDeGestao(v, p)).toBeLessThan(25000);
  });

  it('o solo pesa menos nas pontas, com a mesma referência (60 = 1)', () => {
    expect(fatorDoSolo30(60)).toBeCloseTo(1, 5);
    expect(fatorDoSolo30(30)).toBeGreaterThan(0.6 + 30 / 150);
  });
});

describe('VIDA 30 · §6 o ano ruim', () => {
  it('o prejuízo que a conta não cobre vira crédito de custeio (Pronaf no pequeno), não cartão', () => {
    const { v, p } = comTerra('sitio', 25, 3);
    v.financas.conta = -12000;
    const valor = custeioDoPrejuizo30(v, p, -30000);
    expect(valor).toBe(12000);
    expect(v.financas.conta).toBe(0);
    const d = v.financas.dividas.find(x => /custeio/i.test(x.descricao))!;
    expect(d.tipo).toBe('emprestimo');
    expect(d.jurosMes).toBeLessThan(0.01);
    expect(d.parcela).toBeGreaterThan(0);
    expect(v.financas.dividas.some(x => x.tipo === 'cartao')).toBe(false);
  });

  it('com gado bem acima do pasto, quem cuida vende o excesso e o chão não afunda mais de 2,5 por ano', () => {
    const { v, p, im } = comTerra('pecuaria', 300, 4);
    const rb = p.rebanhos.find(x => x.especie === 'corte') ?? (p.rebanhos.push({ especie: 'corte', cabecas: 100, genetica: 45, sanidade: 60, alimentacao: 'pasto', estrategia: 'manter', sanitario: 'basico' }), p.rebanhos[p.rebanhos.length - 1]);
    rb.cabecas = Math.round(capacidadeUA(p) * 2);
    const antes = rb.cabecas;
    const solo = p.solo;
    viverAnoDaPropriedade(v, p, im, p.ultimoAno + 1);
    expect(p.rebanhos[0].cabecas).toBeLessThan(antes * 0.8);
    expect(solo - p.solo).toBeLessThanOrEqual(2.5 + 1e-9);
    expect(p.historico[p.historico.length - 1].linhas.some(l => /vendeu o excesso/.test(l.nota ?? ''))).toBe(true);
  });

  it('a horta roda canteiros: não acumula monocultura', () => {
    const { v, p, im } = comTerra('chacara', 4, 5);
    p.talhoes = [{ id: 'h', cultura: 'horta', ha: 1.5, ano: p.ultimoAno }];
    for (let k = 0; k < 5; k++) viverAnoDaPropriedade(v, p, im, p.ultimoAno + 1);
    expect(p.talhoes[0].repete ?? 1).toBe(1);
  });
});

describe('VIDA 30 · §6 os problemas e as saídas', () => {
  it('pasto lotado: o cartão diz a urgência, o que acontece se não fizer nada e três saídas com custo; vender resolve', () => {
    let { v, p } = comTerra('pecuaria', 300, 6);
    v.financas.conta = 5e6;
    const rb = p.rebanhos[0] ?? (p.rebanhos.push({ especie: 'corte', cabecas: 100, genetica: 45, sanidade: 60, alimentacao: 'pasto', estrategia: 'manter', sanitario: 'basico' }), p.rebanhos[0]);
    rb.cabecas = Math.round(capacidadeUA(p) * 1.6);
    const pr = problemasDaPropriedade30(v, p).find(x => x.id === 'pasto')!;
    expect(pr.urgencia).toBe('agora');
    expect(pr.seNada.length).toBeGreaterThan(20);
    expect(pr.opcoes.length).toBe(3);
    expect(pr.opcoes[0].custo).toBeLessThan(0); // vender: entra dinheiro
    expect(pr.opcoes[1].porAno).toBe(true);
    v = executar(v, pr.opcoes[0].acao!).vida;
    p = todasAsPropriedades(v).find(x => x.p.id === p.id)!.p;
    expect(uaOcupadas(p)).toBeLessThanOrEqual(capacidadeUA(p) * 1.06);
    expect(problemasDaPropriedade30(v, p).some(x => x.id === 'pasto')).toBe(false);
  });

  it('produção abaixo do esperado: os fatores reais com o peso, e corrigir o solo tira o fator', () => {
    let { v, p } = comTerra('agricola', 200, 7);
    v.financas.conta = 5e6;
    p.solo = 30;
    const f = fatoresDaProducao30(v, p);
    expect(f[0].id).toBe('solo');
    const pr = problemasDaPropriedade30(v, p).find(x => x.id === 'producao')!;
    expect(pr.fatores![0].texto).toMatch(/solo/);
    const corrigir = pr.opcoes.find(o => /solo/.test(o.rotulo))!;
    expect(corrigir.custo).toBeGreaterThan(0);
    v = executar(v, corrigir.acao!).vida;
    p = todasAsPropriedades(v).find(x => x.p.id === p.id)!.p;
    expect(p.solo).toBe(46);
  });

  it('a recuperação: um sítio de solo cansado, com a correção e a assistência, volta a fechar no azul', () => {
    let { v, p } = comTerra('agricola', 120, 8);
    p.solo = 28;
    v.financas.conta = 3e6;
    const im = v.financas.bens.find(b => (b as Imovel).rural === p) as Imovel;
    const res: number[] = [];
    for (let a = 0; a < 3; a++) res.push(viverAnoDaPropriedade(v, p, im, p.ultimoAno + 1)!.resultado);
    v = executar(v, { tipo: 'rural18', oque: { op: 'solo', id: p.id } } as never).vida;
    p = todasAsPropriedades(v).find(x => x.p.id === p.id)!.p;
    const im2 = todasAsPropriedades(v).find(x => x.p.id === p.id)!.imovel!;
    const depois: number[] = [];
    for (let a = 0; a < 6; a++) depois.push(viverAnoDaPropriedade(v, p, im2, p.ultimoAno + 1)!.resultado);
    const media = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
    expect(media(depois.slice(-3))).toBeGreaterThan(media(res));
    expect(media(depois.slice(-3))).toBeGreaterThan(0);
  });
});
