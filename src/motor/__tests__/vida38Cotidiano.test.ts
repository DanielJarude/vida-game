/** VIDA 38 · bloco 3 — o dia a dia: passeios (uma vez por ano), cartas e presentes, torcida e bico. */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { disponibilidade, executar, type Acao } from '../acoes';
import { podeTentar } from '../plausibilidade';
import type { Vida } from '../tipos';

const pode = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const p = (op: Extract<Acao, { tipo: 'personalizar' }>['op']): Acao => ({ tipo: 'personalizar', op });
const alguem = (v: Vida) => Object.keys(v.vinculos).find(id => v.pessoas[id])!;

describe('o dia a dia (VIDA 38 · bloco 3)', () => {
  it('a praia tira estresse e vale uma vez por ano', () => {
    let v = adulto(30, { semente: 3 });
    v.mente.estresse = 60;
    v = executar(v, p({ o: 'passear', local: 'praia' })).vida;
    expect(v.mente.estresse).toBeLessThan(60);
    expect(pode(v, p({ o: 'passear', local: 'praia' }))).toBe(false);
    expect(pode(v, p({ o: 'passear', local: 'parque' }))).toBe(true);
  });

  it('a caminhada dá forma', () => {
    let v = adulto(30, { semente: 3 });
    const f0 = v.corpo.forma;
    v = executar(v, p({ o: 'passear', local: 'caminhada' })).vida;
    expect(v.corpo.forma).toBeGreaterThan(f0);
  });

  it('escrever aproxima quem está longe, uma vez por ano', () => {
    let v = adulto(30, { semente: 3 });
    const id = alguem(v);
    const prox0 = v.vinculos[id].proximidade;
    v = executar(v, p({ o: 'carta', pessoaId: id })).vida;
    expect(v.vinculos[id].proximidade).toBeGreaterThan(prox0);
    expect(pode(v, p({ o: 'carta', pessoaId: id }))).toBe(false);
  });

  it('o presente custa e aproxima mais que a carta', () => {
    let v = adulto(30, { semente: 3 });
    const id = alguem(v);
    const conta0 = v.financas.conta;
    v = executar(v, p({ o: 'presente', pessoaId: id })).vida;
    expect(v.financas.conta).toBeLessThan(conta0);
  });

  it('entrar na torcida é escolha de quem tem 14 anos ou mais; sair desfaz', () => {
    let crianca = adulto(10, { semente: 3 });
    expect(pode(crianca, p({ o: 'torcida', acao: 'entrar' }))).toBe(false);
    let v = adulto(20, { semente: 3 });
    v = executar(v, p({ o: 'torcida', acao: 'entrar' })).vida;
    expect(v.fatos['torcida:ativa']).toBeDefined();
    v = executar(v, p({ o: 'torcida', acao: 'sair' })).vida;
    expect(v.fatos['torcida:ativa']).toBeUndefined();
  });

  it('o jogo com a torcida exige estar na torcida e cobra o ingresso', () => {
    let v = adulto(20, { semente: 3 });
    expect(pode(v, p({ o: 'torcida', acao: 'jogo' }))).toBe(false);
    v = executar(v, p({ o: 'torcida', acao: 'entrar' })).vida;
    const conta0 = v.financas.conta;
    v = executar(v, p({ o: 'torcida', acao: 'jogo' })).vida;
    expect(v.financas.conta).toBeLessThan(conta0);
  });

  it('o bico paga e tem limite por ano', () => {
    let v = adulto(16, { semente: 3 });
    const conta0 = v.financas.conta;
    v = executar(v, p({ o: 'bico' })).vida;
    expect(v.financas.conta).toBeGreaterThan(conta0);
    for (let k = 0; k < 5; k++) v = executar(v, p({ o: 'bico' })).vida;
    expect(pode(v, p({ o: 'bico' }))).toBe(false);
  });
});
