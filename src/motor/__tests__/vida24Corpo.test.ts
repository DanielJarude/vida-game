/**
 * VIDA 24 — o corpo que vive: a constituição escolhida antes de nascer (herdada, escolhida, ao acaso), distinta do
 * atributo Físico; a composição que anda um pouco por ano (sedentarismo, academia, esporte, alimentação, parar de
 * treinar, a predisposição, a idade); o objetivo que só pesa com a atividade que pede; os cuidados com os pelos; o save.
 */
import { describe, expect, it } from 'vitest';
import { nova, viverAte } from './ajuda';
import { adulto } from './cenarios';
import { transacao, idade } from '../nucleo';
import { disponibilidade, executar } from '../acoes';
import { interpretar } from '../save';
import { previaDoNascimento } from '../criacao';
import { estaturaAdulta } from '../sistemas/modalidades';
import { composicaoDe, corpoDaFigura, tipoDeCorpo, tipoDeCorpoBase } from '../sistemas/silhueta';
import { lerCorpo23, NEUTRA23 } from '../v23/corpo/corpo23';
import { ANCORAS24, alvo24, fatores24, pelosDaIdade24, projetar24, tipoDaComposicao, umAno24, type Composicao24, type Entrada24 } from '../v24/corpo/corpo24';
import type { Vida } from '../tipos';

const ent = (x: Partial<Entrada24> = {}): Entrada24 => ({ idade: 30, forca: 0, cardio: 0, sedentario: false, bebeMuito: false, forma: 50, c: { ...NEUTRA23 }, ...x });
const anos = (c0: Composicao24, e: Entrada24, n: number) => { const h = [c0]; let c = c0; for (let k = 1; k <= n; k++) { c = umAno24(c, { ...e, idade: e.idade + k - 1 }, c0.t + 12 * k); h.push(c); } return h; };
const zero: Composicao24 = { g: 0, m: 0, t: 0 };

describe('VIDA 24 · antes de nascer', () => {
  const base = { nome: 'A', sobrenome: 'B', genero: 'feminino' as const, municipioId: 'recife-pe', semente: 777 };
  it('escolher grava exatamente a constituição escolhida; herdar puxa os pais sem copiar; ao acaso ignora os pais', () => {
    const escolhida = nova({ ...base, corpo24: { modo: 'escolher', c: '403122224130', pelos: 2 } });
    expect(escolhida.eu.visual.corpo23).toBe('403122224130');
    expect(escolhida.eu.visual.pelos23).toBe(2);
    expect(escolhida.corpo.nasc24).toBe('escolher');
    const herdada = nova({ ...base, corpo24: { modo: 'heranca' } });
    expect(herdada.eu.visual.corpo23).toMatch(/^[0-4]{12}$/);
    const pais = previaDoNascimento({ ...base, corpo24: { modo: 'heranca' } });
    expect([pais.mae?.corpo23, pais.pai?.corpo23]).not.toContain(herdada.eu.visual.corpo23);
    const acasos = new Set(Array.from({ length: 12 }, (_, k) => nova({ ...base, semente: 900 + k, corpo24: { modo: 'acaso' } }).eu.visual.corpo23));
    expect(acasos.size).toBeGreaterThan(8);
  });

  it('escolher o corpo não muda a família nem o resto do nascimento; o atributo Físico continua separado', () => {
    const a = nova({ ...base, atributos: { saude: 80, fisico: 20, felicidade: 70, beleza: 50, inteligencia: 50 }, corpo24: { modo: 'escolher', c: '444444444444' } });
    const b = nova({ ...base, atributos: { saude: 80, fisico: 20, felicidade: 70, beleza: 50, inteligencia: 50 }, corpo24: { modo: 'escolher', c: '000000000000' } });
    expect(a.corpo.forma).toBe(20);
    expect(b.corpo.forma).toBe(20);
    expect(Object.keys(a.pessoas).length).toBe(Object.keys(b.pessoas).length);
    expect(a.moradia.municipioId).toBe(b.moradia.municipioId);
    expect(a.eu.visual.pele).toBe(b.eu.visual.pele);
  });

  it('a tendência de altura escolhida pesa na altura adulta; sem a escolha (vida de antes), a altura é a mesma de sempre', () => {
    const alta = nova({ ...base, corpo24: { modo: 'escolher', c: '422222222222' } });
    const baixa = nova({ ...base, corpo24: { modo: 'escolher', c: '022222222222' } });
    expect(estaturaAdulta(alta) - estaturaAdulta(baixa)).toBeGreaterThanOrEqual(15);
    const antes = nova(base), comHeranca = nova({ ...base });
    expect(estaturaAdulta(antes)).toBe(estaturaAdulta(comHeranca));
    expect(antes.corpo.nasc24).toBeUndefined();
  });

  it('o bebê não nasce com corpo adulto: nada de músculo nem de pelos antes da puberdade', () => {
    const e = ent({ idade: 6, forca: 1, c: { ...NEUTRA23, musculo: 2 } });
    expect(alvo24(e).m).toBeLessThan(0.5);
    expect(pelosDaIdade24(1)).toBe(0);
    expect(pelosDaIdade24(10)).toBe(0);
    expect(pelosDaIdade24(15)).toBeGreaterThan(0);
    expect(pelosDaIdade24(19)).toBe(1);
  });
});

describe('VIDA 24 · o corpo muda aos poucos', () => {
  it('sedentário: a gordura sobe devagar (nunca mais de 0,6 num ano) e chega a acima do peso só depois de anos', () => {
    const h = anos(zero, ent({ sedentario: true, forma: 22, idade: 35 }), 8);
    for (let k = 1; k < h.length; k++) { expect(h[k].g).toBeGreaterThanOrEqual(h[k - 1].g); expect(h[k].g - h[k - 1].g).toBeLessThanOrEqual(0.6001); }
    expect(tipoDaComposicao(h[1])).toBe('mediano');
    expect(tipoDaComposicao(h[8])).toBe('acima_do_peso');
  });

  it('musculação: o músculo sobe ano a ano; com o objetivo de massa vira musculoso em alguns anos, nunca no primeiro', () => {
    const e = ent({ forca: 1, idade: 22, plano: { objetivo: 'massa' } });
    const h = anos(zero, e, 8);
    for (let k = 1; k < h.length; k++) { expect(h[k].m).toBeGreaterThan(h[k - 1].m); expect(h[k].m - h[k - 1].m).toBeLessThanOrEqual(0.5001); }
    expect(tipoDaComposicao(h[1])).not.toBe('musculoso');
    expect(tipoDaComposicao(h[2])).toBe('atletico');
    expect(tipoDaComposicao(h[8])).toBe('musculoso');
  });

  it('esporte (aeróbico): a gordura desce e o corpo fica atlético; a força não vira fisiculturista', () => {
    const h = anos({ g: 0.6, m: 0, t: 0 }, ent({ cardio: 1.2, forca: 0.2, idade: 20 }), 6);
    expect(h[6].g).toBeLessThan(0);
    expect(h[6].m).toBeLessThan(1.6);
  });

  it('mudar a alimentação: comer menos tira gordura; comer mais põe — e com treino de força, parte vira músculo', () => {
    const menos = anos({ g: 1.8, m: 0, t: 0 }, ent({ plano: { alimentacao: 'deficit' } }), 4);
    expect(menos[4].g).toBeLessThan(0.6);
    const mais = anos(zero, ent({ plano: { alimentacao: 'superavit' } }), 4);
    expect(mais[4].g).toBeGreaterThan(0.4);
    const maisComTreino = anos(zero, ent({ forca: 1, plano: { alimentacao: 'superavit' } }), 4);
    expect(maisComTreino[4].m).toBeGreaterThan(anos(zero, ent({ forca: 1 }), 4)[4].m);
  });

  it('parar de treinar: o músculo vai embora mais rápido do que veio, mas aos poucos', () => {
    const treinado = anos(zero, ent({ forca: 1, plano: { objetivo: 'massa' } }), 8)[8];
    const parado = anos(treinado, ent({}), 4);
    expect(parado[1].m).toBeLessThan(treinado.m);
    expect(treinado.m - parado[1].m).toBeLessThanOrEqual(0.5001);
    expect(parado[4].m).toBeLessThan(0.6);
  });

  it('a predisposição muda a velocidade e o teto, não substitui o treino', () => {
    const facil = anos(zero, ent({ forca: 1, c: { ...NEUTRA23, musculo: 2 } }), 4)[4];
    const dificil = anos(zero, ent({ forca: 1, c: { ...NEUTRA23, musculo: -2 } }), 4)[4];
    const semTreino = anos(zero, ent({ c: { ...NEUTRA23, musculo: 2 } }), 4)[4];
    expect(facil.m).toBeGreaterThan(dificil.m + 0.3);
    expect(dificil.m).toBeGreaterThan(semTreino.m);
    // Quem tende a acumular, acumula mais com a mesma vida.
    const acumula = anos(zero, ent({ sedentario: true, c: { ...NEUTRA23, barriga: 2, cintura: 2 } }), 5)[5];
    const seco = anos(zero, ent({ sedentario: true, c: { ...NEUTRA23, barriga: -2, cintura: -2 } }), 5)[5];
    expect(acumula.g).toBeGreaterThan(seco.g + 0.5);
  });

  it('o objetivo só pesa com a atividade que ele pede; a região treinada cresce', () => {
    expect(alvo24(ent({ plano: { objetivo: 'massa' } })).m).toBe(alvo24(ent()).m);
    expect(alvo24(ent({ forca: 1, plano: { objetivo: 'massa' } })).m).toBeGreaterThan(alvo24(ent({ forca: 1 })).m);
    expect(fatores24(ent({ forca: 1, plano: { objetivo: 'massa' } })).some(f => /hipertrofia/.test(f.texto))).toBe(true);
    const r = anos(zero, ent({ forca: 1, plano: { objetivo: 'regiao', regiao: 'bracos' } }), 3)[3];
    expect(r.r?.bracos).toBeGreaterThan(0.6);
    expect(r.r?.pernas).toBeUndefined();
  });

  it('a projeção não muda nada e aponta para onde a rotina leva', () => {
    const c: Composicao24 = { g: 1, m: 0, t: 0 };
    const p = projetar24(c, ent({ cardio: 1, plano: { alimentacao: 'equilibrada' } }), 5);
    expect(c).toEqual({ g: 1, m: 0, t: 0 });
    expect(p.g).toBeLessThan(0);
  });
});

describe('VIDA 24 · na vida de verdade (o ano)', () => {
  it('um save de antes começa da condição em que estava (a figura não pula) e evolui com a academia', () => {
    let v: Vida = transacao(adulto(24, { semente: 2401 }), x => { delete x.corpo.composicao24; x.rotinas = [{ id: 'academia', tInicio: x.t, nivel: 1 }]; x.corpo.habitos.sedentario = false; x.momento = null; }).vida;
    const tipoAntes = tipoDeCorpo(v);
    expect(composicaoDe(v)).toMatchObject(ANCORAS24[tipoDeCorpoBase(v)]);
    // Abrir o save não cria nada.
    const r = interpretar(JSON.stringify(v));
    if (r.tipo !== 'ok') throw new Error('save');
    expect(r.vida.corpo.composicao24).toBeUndefined();
    expect(tipoDeCorpo(r.vida)).toBe(tipoAntes);
    v = viverAte(v, idade(v) + 3, x => (x.rotinas.some(y => y.id === 'academia') ? [] : [{ tipo: 'rotina', id: 'academia', ativa: true }]));
    const c = v.corpo.composicao24!;
    expect(c).toBeDefined();
    expect(c.h!.length).toBeGreaterThanOrEqual(3);
    expect(c.m).toBeGreaterThan(0.4);
    expect(corpoDaFigura(v).comp).toBeDefined();
  });

  it('o plano: a família decide antes dos 13; depois grava, persiste e não muda o corpo na hora', () => {
    const crianca = adulto(10, { semente: 2402 });
    expect(disponibilidade(crianca, { tipo: 'corpo24', op: { o: 'plano', objetivo: 'massa' } }).grau).not.toBe('permitido');
    let v = transacao(adulto(26, { semente: 2403 }), x => { x.momento = null; }).vida;
    const antes = JSON.stringify(v.corpo.composicao24);
    expect(disponibilidade(v, { tipo: 'corpo24', op: { o: 'plano', objetivo: 'regiao' } }).grau).toBe('impossivel');
    v = executar(v, { tipo: 'corpo24', op: { o: 'plano', objetivo: 'regiao', regiao: 'ombros', alimentacao: 'equilibrada' } }).vida;
    expect(v.corpo.plano24).toMatchObject({ objetivo: 'regiao', regiao: 'ombros', alimentacao: 'equilibrada' });
    expect(JSON.stringify(v.corpo.composicao24)).toBe(antes);
    expect(disponibilidade(v, { tipo: 'corpo24', op: { o: 'plano', objetivo: 'regiao', regiao: 'ombros', alimentacao: 'equilibrada' } }).grau).toBe('incompativel');
    const r = interpretar(JSON.stringify(v));
    if (r.tipo !== 'ok') throw new Error('save');
    expect(r.vida.corpo.plano24?.regiao).toBe('ombros');
  });

  it('os pelos: aparar é de graça; o laser cobra e, depois de um ano de sessões, fica para sempre', () => {
    let v = transacao(adulto(25, { semente: 2404 }), x => { x.momento = null; x.financas.conta = 100_000; x.eu.visual.pelos23 = 3; }).vida;
    const conta = v.financas.conta;
    v = executar(v, { tipo: 'corpo24', op: { o: 'pelos', metodo: 'aparar', regioes: ['bracos'] } }).vida;
    expect(v.financas.conta).toBe(conta);
    expect(v.eu.visual.pelos24?.metodo).toBe('aparar');
    v = executar(v, { tipo: 'corpo24', op: { o: 'pelos', metodo: 'laser', regioes: ['peito', 'costas'] } }).vida;
    expect(v.financas.conta).toBeLessThan(conta);
    expect(disponibilidade(v, { tipo: 'corpo24', op: { o: 'pelos', metodo: null } }).grau).toBe('permitido');
    v = viverAte(v, idade(v) + 1);
    expect(v.eu.visual.laser24).toEqual(expect.arrayContaining(['peito', 'costas']));
    expect(v.eu.visual.pelos24).toBeUndefined();
    const r = interpretar(JSON.stringify(v));
    if (r.tipo !== 'ok') throw new Error('save');
    expect(r.vida.eu.visual.laser24).toEqual(v.eu.visual.laser24);
  });

  it('o save estragado nos campos novos é limpo sem quebrar', () => {
    const v = transacao(adulto(20, { semente: 2405 }), x => { x.momento = null; }).vida;
    const j = JSON.parse(JSON.stringify(v));
    j.corpo.composicao24 = { g: 'x' }; j.corpo.plano24 = { objetivo: 'voar', alimentacao: 'deficit' }; j.eu.visual.pelos24 = { metodo: 'fogo', regioes: [] }; j.eu.visual.laser24 = ['asas'];
    const r = interpretar(JSON.stringify(j));
    if (r.tipo !== 'ok') throw new Error('save');
    expect(r.vida.corpo.composicao24).toBeUndefined();
    expect(r.vida.corpo.plano24).toEqual({ alimentacao: 'deficit' });
    expect(r.vida.eu.visual.pelos24).toBeUndefined();
    expect(r.vida.eu.visual.laser24).toBeUndefined();
    expect(lerCorpo23(r.vida.eu.visual.corpo23)).toBeDefined();
  });
});
