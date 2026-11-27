/** VIDA 38 · bloco 3 — dependências: usar custa e sobe o nível; nível alto pesa na saúde; parar diminui e pode dar abstinência. */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { disponibilidade, executar, type Acao } from '../acoes';
import { podeTentar } from '../plausibilidade';
import type { Vida } from '../tipos';

const pode = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const p = (op: Extract<Acao, { tipo: 'personalizar' }>['op']): Acao => ({ tipo: 'personalizar', op });

describe('dependências (VIDA 38 · bloco 3)', () => {
  it('usar custa dinheiro e sobe o nível', () => {
    let v = adulto(30, { semente: 2 });
    const conta0 = v.financas.conta;
    v = executar(v, p({ o: 'vicio', substancia: 'alcool', acao: 'usar' })).vida;
    expect(v.financas.conta).toBeLessThan(conta0);
    expect(v.fatos['vicio:alcool']).toBe(8);
  });

  it('com o nível alto, cada uso pesa na saúde', () => {
    let v = adulto(30, { semente: 2 });
    v.fatos['vicio:cigarro'] = 50;
    v.corpo.saude = 80;
    v = executar(v, p({ o: 'vicio', substancia: 'cigarro', acao: 'usar' })).vida;
    expect(v.corpo.saude).toBeLessThan(80);
  });

  it('parar diminui o nível e, com nível alto, dá estresse de abstinência', () => {
    let v = adulto(30, { semente: 2 });
    v.fatos['vicio:alcool'] = 60;
    const e0 = v.mente.estresse;
    v = executar(v, p({ o: 'vicio', substancia: 'alcool', acao: 'parar' })).vida;
    expect(v.fatos['vicio:alcool']).toBe(40);
    expect(v.mente.estresse).toBeGreaterThan(e0);
  });

  it('parar só faz sentido com o hábito', () => {
    const v = adulto(30, { semente: 2 });
    expect(pode(v, p({ o: 'vicio', substancia: 'alcool', acao: 'parar' }))).toBe(false);
  });
});
