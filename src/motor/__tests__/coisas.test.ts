/**
 * As coisas da vida (`sistemas/coisas`): comprar numa loja da cidade, pelo
 * preço daqui; o que cada coisa muda (a prática que rende, o peso da casa, o
 * descanso); o desgaste e o fim; a venda usada pelo extrato; a mudança de
 * país; salvar e reabrir.
 */

import { describe, expect, it } from 'vitest';
import { disponibilidade, executar } from '../acoes';
import { transacao } from '../nucleo';
import { interpretar } from '../save';
import type { Vida } from '../tipos';
import { adulto } from './cenarios';
import { nova, viverAte } from './ajuda';
import { coisa } from '../dados/coisas';
import { bonusDaAtividade, coisasDaVida, fazCalor, precoDaCoisa, processarCoisas, temLojaNaCidade, valorDeRevenda } from '../sistemas/coisas';
import { cidadesDoPais, economiaLocal, nivelDeOferta } from '../dados/lugares';
import { conciliar } from '../sistemas/extrato';
import { migrar } from '../sistemas/migracao';
import { paisDaVida } from '../mundo/vida';
import { praticar } from '../sistemas/frentes';
import { criarRng } from '../rng';
import { habilidade } from '../sistemas/frentes';

const comprar = (v: Vida, coisaId: string) => executar(v, { tipo: 'comprar_coisa', coisaId });
const rico = (v: Vida) => transacao(v, x => { x.financas.conta = 200000; x.momento = null; x.anoAtual = { acoes: [] }; }).vida;

describe('comprar', () => {
  it('o preço é o da cidade; a compra sai da conta, entra no extrato e a coisa é sua', () => {
    let v = rico(adulto(30, { semente: 41, municipioId: 'sao-paulo-sp' }));
    const preco = precoDaCoisa(v, 'notebook');
    expect(preco).toBeGreaterThan(0);
    const antes = v.financas.conta;
    v = comprar(v, 'notebook').vida;
    expect(v.financas.conta).toBe(antes - preco);
    expect(coisasDaVida(v).map(c => c.coisaId)).toEqual(['notebook']);
    expect(conciliar(v.financas.extrato!).ok).toBe(true);
    expect(disponibilidade(v, { tipo: 'comprar_coisa', coisaId: 'notebook' }).grau).toBe('incompativel');
  });

  it('idade e casa: criança não compra; quem mora com a família não decide os eletrodomésticos — mas compra o violão com o próprio dinheiro', () => {
    let v = viverAte(nova({ semente: 42 }), 9);
    v = transacao(v, x => { x.financas.conta = 5000; x.momento = null; }).vida;
    expect(disponibilidade(v, { tipo: 'comprar_coisa', coisaId: 'violao' }).grau).toBe('impossivel');
    v = viverAte(v, 14);
    v = transacao(v, x => { x.financas.conta = 5000; x.momento = null; }).vida;
    expect(['pais', 'parente']).toContain(v.moradia.tipo);
    expect(disponibilidade(v, { tipo: 'comprar_coisa', coisaId: 'maquina_lavar' }).grau).toBe('impossivel');
    expect(disponibilidade(v, { tipo: 'comprar_coisa', coisaId: 'violao' }).grau).toBe('permitido');
  });

  it('sem loja na cidade, pela internet, com frete; prancha longe do mar, não', () => {
    const semLoja = cidadesDoPais('BR').find(m => nivelDeOferta(m.id) === 0)!;
    const v = rico(adulto(30, { semente: 43, municipioId: semLoja.id }));
    expect(temLojaNaCidade(v, 'instrumentos')).toBe(false);
    expect(precoDaCoisa(v, 'violao')).toBe(Math.round(900 * economiaLocal(semLoja.id).custo * 1.1 / 10) * 10);
    expect(temLojaNaCidade(v, 'eletronicos')).toBe(true);
    const longe = rico(adulto(30, { semente: 43, municipioId: 'cuiaba-mt' }));
    expect(disponibilidade(longe, { tipo: 'comprar_coisa', coisaId: 'prancha' }).grau).toBe('impossivel');
  });
});

describe('o que cada coisa muda', () => {
  it('o instrumento em casa faz a mesma prática render mais (a mesma vida, com e sem o violão)', () => {
    const base = rico(adulto(20, { semente: 44 }));
    const sem = structuredClone(base);
    const com = transacao(structuredClone(base), x => { x.financas.coisas = [{ id: 'cs1', coisaId: 'violao', t: x.t, preco: 900, estado: 100 }]; }).vida;
    expect(bonusDaAtividade(com, 'musica')).toBeCloseTo(0.25);
    expect(bonusDaAtividade(sem, 'musica')).toBe(0);
    for (const v of [sem, com]) { const r = criarRng(7); for (let k = 0; k < 6; k++) praticar(v, r, 'musica', 1, 1 + bonusDaAtividade(v, 'musica')); }
    expect(habilidade(com, 'musica')).toBeGreaterThan(habilidade(sem, 'musica'));
  });

  it('a máquina de lavar tira peso da cabeça de quem cuida da própria casa; o ar-condicionado só onde faz calor', () => {
    const v = adulto(30, { semente: 45, municipioId: 'recife-pe' });
    v.mente.estresse = 60;
    v.financas.coisas = [{ id: 'a', coisaId: 'maquina_lavar', t: v.t, preco: 2500, estado: 100 }, { id: 'b', coisaId: 'ar_condicionado', t: v.t, preco: 2800, estado: 100 }];
    processarCoisas(v);
    expect(v.mente.estresse).toBe(54);
    expect(fazCalor('recife-pe')).toBe(true);
    expect(fazCalor('curitiba-pr')).toBe(false);
    const sul = adulto(30, { semente: 45, municipioId: 'curitiba-pr' });
    sul.mente.estresse = 60;
    sul.financas.coisas = [{ id: 'b', coisaId: 'ar_condicionado', t: sul.t, preco: 2800, estado: 100 }];
    processarCoisas(sul);
    expect(sul.mente.estresse).toBe(60);
  });

  it('as coisas se gastam e chegam ao fim — e a vida conta', () => {
    const v = adulto(30, { semente: 46 });
    v.financas.coisas = [{ id: 'c', coisaId: 'celular_simples', t: v.t, preco: 900, estado: 100 }];
    for (let k = 0; k < 6 && coisasDaVida(v).length; k++) { v.t += 12; processarCoisas(v); }
    expect(coisasDaVida(v)).toEqual([]);
    expect(v.biografia.some(b => /celular simples chegou ao fim/.test(b.texto))).toBe(true);
  });
});

describe('vender, mudar de país, salvar', () => {
  it('vender usado: vale menos com o tempo e o estado; o dinheiro entra pelo extrato', () => {
    let v = rico(adulto(30, { semente: 47 }));
    v = comprar(v, 'teclado').vida;
    v = transacao(v, x => { x.t += 36; x.financas.coisas![0].estado = 60; x.anoAtual = { acoes: [] }; x.financas.extrato = undefined; }).vida;
    const t = coisasDaVida(v)[0];
    const vale = valorDeRevenda(v, t);
    expect(vale).toBeLessThan(t.preco * 0.5);
    const antes = v.financas.conta;
    v = executar(v, { tipo: 'vender_coisa', coisaTidaId: t.id }).vida;
    expect(v.financas.conta).toBe(antes + vale);
    expect(coisasDaVida(v)).toEqual([]);
  });

  it('mudança de país: a máquina de lavar fica (vendida), o notebook vai na mala', () => {
    const v = rico(adulto(30, { semente: 48 }));
    v.eu.nacionalidades = ['BR', 'PT'];
    v.financas.coisas = [{ id: 'm', coisaId: 'maquina_lavar', t: v.t, preco: 2500, estado: 100 }, { id: 'n', coisaId: 'notebook', t: v.t, preco: 3800, estado: 100 }];
    const w = transacao(v, (x, r) => { migrar(x, r, 'pt:lisboa', 'pessoal'); }).vida;
    expect(paisDaVida(w)).toBe('PT');
    expect(coisasDaVida(w).map(c => c.coisaId)).toEqual(['notebook']);
  });

  it('salvar e reabrir preserva as coisas; um save com coisa malformada é recusado', () => {
    let v = rico(adulto(30, { semente: 49 }));
    v = comprar(v, 'violao').vida;
    const lido = interpretar(JSON.stringify(v));
    expect(lido.tipo).toBe('ok');
    if (lido.tipo === 'ok') expect(coisasDaVida(lido.vida)).toEqual(coisasDaVida(v));
    const ruim = JSON.parse(JSON.stringify(v));
    ruim.financas.coisas = [{ id: 'x' }];
    expect(interpretar(JSON.stringify(ruim)).tipo).not.toBe('ok');
    expect(coisa('violao')?.loja).toBe('instrumentos');
  });
});
