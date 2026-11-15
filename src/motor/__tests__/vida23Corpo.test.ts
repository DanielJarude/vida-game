/**
 * VIDA 23 — o corpo de cada um: a constituição (12 eixos), as marcas naturais, os pelos; a herança, a migração dos saves
 * e a ação de definir o corpo.
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { transacao } from '../nucleo';
import { disponibilidade, executar } from '../acoes';
import { interpretar } from '../save';
import { geneticaDe, visualDaAncestralidade, visualDosPais } from '../sistemas/identidade';
import { criarRng } from '../rng';
import {
  EIXOS_DO_CORPO, FORMAS23, gravarCorpo23, lerCorpo23, marcaValida, marcasValidas, MARCAS23, sortearCorpo23, sortearMarcas23, sortearPelos23, TIPOS_DE_MARCA
} from '../v23/corpo/corpo23';
import { corpoDaFigura } from '../sistemas/silhueta';
import type { Visual } from '../tipos';

describe('VIDA 23 · constituição', () => {
  it('ida e volta; a base não grava nada; estragado vira a base', () => {
    const c = lerCorpo23('012342102243');
    expect(gravarCorpo23(c)).toBe('012342102243');
    expect(gravarCorpo23({})).toBeUndefined();
    expect(Object.values(lerCorpo23('xx'))).toEqual(EIXOS_DO_CORPO.map(() => 0));
    expect(Object.values(lerCorpo23(undefined)).every(x => x === 0)).toBe(true);
  });

  it('as formas de partida são todas diferentes entre si', () => {
    const s = new Set(FORMAS23.map(f => gravarCorpo23(f.c) ?? 'base'));
    expect(s.size).toBe(FORMAS23.length);
    expect(FORMAS23.length).toBeGreaterThanOrEqual(12);
  });

  it('o sorteio é variado de verdade: cada eixo usa as cinco leituras, quase ninguém sai na base, e não repete', () => {
    const lidos = Array.from({ length: 3000 }, (_, k) => sortearCorpo23(`p${k}`));
    expect(lidos.filter(x => !x).length / 3000).toBeLessThan(0.02);
    expect(new Set(lidos).size).toBeGreaterThan(2900);
    for (const [k] of EIXOS_DO_CORPO.entries()) expect(new Set(lidos.map(s => (s ?? '222222222222')[k])).size).toBe(5);
    // Determinístico.
    expect(sortearCorpo23('fulano')).toBe(sortearCorpo23('fulano'));
  });

  it('filho puxa a média dos pais (correlação positiva em cada eixo), sem ser cópia', () => {
    let soma = 0, iguais = 0;
    for (let k = 0; k < 600; k++) {
      const pai = sortearCorpo23(`a${k}`) ?? '222222222222', mae = sortearCorpo23(`b${k}`) ?? '222222222222';
      const f = lerCorpo23(sortearCorpo23(`f${k}`, [pai, mae])), p = lerCorpo23(pai), m = lerCorpo23(mae);
      for (const e of EIXOS_DO_CORPO) soma += Math.sign(f[e]) * Math.sign(p[e] + m[e]);
      if (sortearCorpo23(`f${k}`, [pai, mae]) === pai) iguais++;
    }
    expect(soma).toBeGreaterThan(600);
    expect(iguais).toBeLessThan(10);
  });
});

describe('VIDA 23 · marcas naturais', () => {
  it('perto de metade sem marca; todas válidas; tipos variados; nada em lugares idênticos para todos', () => {
    const ls = Array.from({ length: 2000 }, (_, k) => sortearMarcas23(`m${k}`, ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'][k % 6]));
    const sem = ls.filter(x => !x).length / ls.length;
    expect(sem).toBeGreaterThan(0.3); expect(sem).toBeLessThan(0.65);
    const todas = ls.flat().filter(Boolean) as NonNullable<typeof ls[number]>;
    for (const m of todas) expect(marcaValida(m)).toEqual(m);
    expect(new Set(todas.map(m => m.t)).size).toBe(TIPOS_DE_MARCA.length);
    const lugares = new Set(todas.map(m => `${m.t}:${m.r}:${m.x}:${m.y}`));
    expect(lugares.size).toBeGreaterThan(todas.length * 0.9);
  });

  it('as sardas acompanham a pele clara (não a condição social: nada além da pele e das sardas do rosto entra)', () => {
    const conta = (pele: string) => Array.from({ length: 1500 }, (_, k) => sortearMarcas23(`s${k}`, pele)).filter(x => x?.some(m => m.t === 'sardas')).length;
    expect(conta('p1')).toBeGreaterThan(conta('p5') * 3);
  });

  it('o saneamento: tipo inexistente, região que não serve ao tipo e campos fora da faixa', () => {
    expect(marcaValida({ t: 'tatuagem', r: 'biceps', x: 0, y: 0, s: 1 })).toBeUndefined();
    expect(marcaValida({ t: 'covinhas', r: 'coxa', x: 0, y: 0, s: 1 })).toBeUndefined();
    const m = marcaValida({ t: 'cicatriz', r: 'biceps', x: 9, y: -9, s: 7, a: 400, i: 9, f: 'invalida' })!;
    expect(m).toMatchObject({ x: 1, y: -1, s: 3, a: 179, i: 3, f: MARCAS23.cicatriz.formas![0].id });
    expect(marcasValidas(Array.from({ length: 30 }, () => ({ t: 'pinta', r: 'biceps', x: 0, y: 0, s: 1 })))!.length).toBe(14);
  });

  it('pelos: mais comuns em homens, ninguém obrigado', () => {
    const h = Array.from({ length: 1000 }, (_, k) => sortearPelos23(`h${k}`, 'masculino') ?? 0);
    const m = Array.from({ length: 1000 }, (_, k) => sortearPelos23(`h${k}`, 'feminino') ?? 0);
    expect(h.filter(x => x === 0).length).toBeGreaterThan(80);
    expect(h.reduce((a, b) => a + b, 0)).toBeGreaterThan(m.reduce((a, b) => a + b, 0) * 3);
  });
});

describe('VIDA 23 · gente do mundo, herança e saves', () => {
  it('quem aparece no mundo ganha constituição (e às vezes marcas) — e o acaso do jogo segue o mesmo', () => {
    const r1 = criarRng(42), r2 = criarRng(42);
    const v = visualDaAncestralidade(r1, 'feminino', { eu: 0.5, af: 0.5 });
    expect(v.corpo23).toMatch(/^[0-4]{12}$/);
    // O mesmo número de sorteios do gerador principal (a constituição vem de um gerador próprio).
    visualDaAncestralidade(r2, 'feminino', { eu: 0.5, af: 0.5 });
    expect(r1.next()).toBe(r2.next());
  });

  it('as marcas não passam aos filhos; a constituição puxa a dos pais', () => {
    const pai: Visual = { pele: 'p3', cabelo: 'curto', corCabelo: 'preto', olhos: 'castanho', corpo23: '444444444444', marcas23: [{ t: 'cicatriz', r: 'biceps', x: 0, y: 0, s: 3 }] };
    const mae: Visual = { ...pai, corpo23: '444444444444' };
    expect(geneticaDe({ visual: pai })!.marcas23).toBeUndefined();
    let alto = 0;
    for (let k = 0; k < 50; k++) { const f = visualDosPais(criarRng(k), 'masculino', { eu: 1 }, geneticaDe({ visual: pai }), geneticaDe({ visual: mae })); if (Object.values(lerCorpo23(f.corpo23)).filter(x => x > 0).length >= 8) alto++; expect(f.marcas23?.some(m => m.t === 'cicatriz' && m.s === 3 && m.r === 'biceps' && m.x === 0) ?? false).toBe(false); }
    expect(alto).toBeGreaterThan(35);
  });

  it('save antigo (sem os campos): nada aparece, nada muda; campos estragados somem ao abrir', () => {
    const v = transacao(adulto(30, { semente: 2301 }), x => { delete x.eu.visual.corpo23; delete x.eu.visual.marcas23; delete x.eu.visual.pelos23; }).vida;
    const r = interpretar(JSON.stringify(v));
    expect(r.tipo).toBe('ok');
    if (r.tipo !== 'ok') return;
    expect(r.vida.eu.visual.corpo23).toBeUndefined();
    expect(r.vida.eu.visual.marcas23).toBeUndefined();
    expect(corpoDaFigura(r.vida).estatura).toBeUndefined();
    const ruim = transacao(v, x => { x.eu.visual.corpo23 = 'abc'; x.eu.visual.marcas23 = [{ t: 'nada' } as never, { t: 'pinta', r: 'bochecha', l: 'e', x: 0, y: 0, s: 1 }]; x.eu.visual.pelos23 = 9; }).vida;
    const r2 = interpretar(JSON.stringify(ruim));
    if (r2.tipo !== 'ok') throw new Error('save');
    expect(r2.vida.eu.visual.corpo23).toBeUndefined();
    expect(r2.vida.eu.visual.marcas23).toEqual([{ t: 'pinta', r: 'bochecha', l: 'e', x: 0, y: 0, s: 1, f: 'plana' }]);
    expect(r2.vida.eu.visual.pelos23).toBeUndefined();
  });

  it('a ação de definir o corpo: a família decide antes dos 13; depois, grava, persiste e a altura de verdade entra na figura', () => {
    const crianca = adulto(10, { semente: 2302 });
    expect(disponibilidade(crianca, { tipo: 'corpo23', mudanca: { corpo23: '402222222222' } }).grau).not.toBe('permitido');
    let v = transacao(adulto(28, { semente: 2303 }), x => { delete x.eu.visual.corpo23; x.momento = null; }).vida;
    const marcas = [{ t: 'sardas' as const, r: 'ombro' as const, l: 'd' as const, x: 0.2, y: -0.1, s: 1 as const, n: 20, i: 2 as const, k: 5 }];
    expect(disponibilidade(v, { tipo: 'corpo23', mudanca: { corpo23: '402222222222', marcas23: marcas, pelos23: 2 } }).grau).toBe('permitido');
    v = executar(v, { tipo: 'corpo23', mudanca: { corpo23: '402222222222', marcas23: marcas, pelos23: 2 } }).vida;
    expect(v.eu.visual.corpo23).toBe('402222222222');
    expect(v.eu.visual.marcas23).toEqual(marcas);
    expect(v.eu.visual.pelos23).toBe(2);
    expect(typeof corpoDaFigura(v).estatura).toBe('number');
    const r = interpretar(JSON.stringify(v));
    if (r.tipo !== 'ok') throw new Error('save');
    expect(r.vida.eu.visual.corpo23).toBe('402222222222');
    expect(r.vida.eu.visual.marcas23).toEqual(marcas);
    // A base escolhida fica gravada (marca o corpo da VIDA 23), e "já está assim" bloqueia a repetição.
    v = executar(v, { tipo: 'corpo23', mudanca: { corpo23: '222222222222', marcas23: null, pelos23: null } }).vida;
    expect(v.eu.visual.corpo23).toBe('222222222222');
    expect(v.eu.visual.marcas23).toBeUndefined();
    expect(disponibilidade(v, { tipo: 'corpo23', mudanca: { corpo23: '222222222222' } }).grau).not.toBe('permitido');
  });
});
