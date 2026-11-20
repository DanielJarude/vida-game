/** VIDA 29 · Timemania, Dia de Sorte, Super Sete e +Milionária: regras, chances reais, conferência, rateio, ano de início, conta. */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { disponibilidade, executar } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { interpretar } from '../save';
import type { Vida } from '../tipos';
import { LOTERIAS18, type LoteriaId } from '../dados18/apostas/loterias18';
import { apostasSimples, chanceDaFaixaDe, comb, conferir, precoDaAposta, precoDoJogo, sorteioDoConcurso, timesDaTimemania, validarJogo, proximoConcurso } from '../v18/apostas/loterias18';
import { estadoApostas18 } from '../v18/apostas/estado18';

const NOVAS: LoteriaId[] = ['timemania', 'diadesorte', 'supersete', 'maismilionaria'];
const comDinheiro = (semente = 1) => { const v = structuredClone(adulto(30, { semente, municipioId: 'sao-paulo-sp' })); v.financas.conta = 1_000_000; v.momento = null; return v; };
const ap = (_v: Vida, oque: Record<string, unknown>) => ({ tipo: 'aposta18', oque } as Parameters<typeof executar>[1]);

describe('VIDA 29 · as quatro loterias novas', () => {
  it('as chances são as oficiais da Caixa (aposta simples)', () => {
    const f = (l: LoteriaId, i = 0) => chanceDaFaixaDe(l, LOTERIAS18[l].faixas[i]);
    expect(Math.round(1 / f('maismilionaria'))).toBe(238_360_500);
    expect(Math.round(1 / f('diadesorte'))).toBe(2_629_575);
    expect(Math.round(1 / f('supersete'))).toBe(10_000_000);
    expect(Math.round(1 / f('timemania'))).toBe(26_472_637);
    // O time do coração: 1 em 80; o mês da sorte: 1 em 12.
    expect(chanceDaFaixaDe('timemania', LOTERIAS18.timemania.faixas.find(x => x.soExtra)!)).toBeCloseTo(1 / 80, 10);
    expect(chanceDaFaixaDe('diadesorte', LOTERIAS18.diadesorte.faixas.find(x => x.soExtra)!)).toBeCloseTo(1 / 12, 10);
    // Super Sete: as probabilidades das colunas fecham em 1 com as faixas sem prêmio.
    let soma = 0; for (let j = 0; j <= 7; j++) soma += comb(7, j) * 0.1 ** j * 0.9 ** (7 - j);
    expect(soma).toBeCloseTo(1, 10);
  });

  it('o preço conta as apostas simples: colunas multiplicam, dezenas × trevos', () => {
    expect(precoDaAposta('timemania', 10)).toBe(3.5);
    expect(precoDaAposta('diadesorte', 8)).toBe(2.5 * 8);
    expect(apostasSimples('supersete', [0, 1, 10, 20, 30, 40, 50, 60])).toBe(2);
    expect(apostasSimples('supersete', [0, 1, 2, 10, 11, 20, 30, 40, 50, 60])).toBe(6);
    expect(precoDoJogo('maismilionaria', [1, 2, 3, 4, 5, 6, 7], [1, 2, 3])).toBe(6 * 7 * 3);
    // A surpresinha do Super Sete põe os números a mais em colunas diferentes: 9 números = 4 apostas.
    expect(precoDaAposta('supersete', 9)).toBe(12);
  });

  it('a conferência por faixa (combinações) — dezenas, extra, colunas e trevos', () => {
    // Timemania: 7 acertos e o time.
    const tm = conferir({ loteria: 'timemania', jogos: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]], extras: [[5]] }, { a: [1, 2, 3, 4, 5, 6, 7], extra: [5] });
    expect(tm['7']).toBe(1); expect(tm['T']).toBe(1); expect(tm['6']).toBeUndefined();
    // Dia de Sorte com 8 dezenas, 7 acertos: uma aposta de 7 e sete de 6; o mês errado não paga.
    const ds = conferir({ loteria: 'diadesorte', jogos: [[1, 2, 3, 4, 5, 6, 7, 8]], extras: [[3]] }, { a: [1, 2, 3, 4, 5, 6, 7], extra: [4] });
    expect(ds['7']).toBe(1); expect(ds['6']).toBe(7); expect(ds['M']).toBeUndefined();
    // Super Sete: dois números na 1ª coluna (um acerta), o resto acerta: uma de 7 colunas, uma de 6.
    const ss = conferir({ loteria: 'supersete', jogos: [[3, 4, 15, 22, 31, 40, 59, 68]] }, { a: [3, 15, 22, 31, 40, 59, 68] });
    expect(ss['7']).toBe(1); expect(ss['6']).toBe(1);
    // +Milionária: 6 acertos com 3 trevos marcados (2 acertam): uma 6+2 e duas 6+1.
    const mm = conferir({ loteria: 'maismilionaria', jogos: [[1, 2, 3, 4, 5, 6]], extras: [[1, 2, 3]] }, { a: [1, 2, 3, 4, 5, 6], extra: [1, 2] });
    expect(mm['6+2']).toBe(1); expect(mm['6+1']).toBe(2);
  });

  it('o volante recusa jogo fora da regra (coluna vazia, trevo de menos, time faltando, dezenas a mais)', () => {
    expect(validarJogo('supersete', [0, 10, 20, 30, 40, 50])).toMatch(/cada coluna/);
    expect(validarJogo('supersete', [0, 1, 2, 3, 10, 20, 30, 40, 50, 60])).toMatch(/por coluna/);
    expect(validarJogo('maismilionaria', [1, 2, 3, 4, 5, 6], [1])).toMatch(/trevos/);
    expect(validarJogo('timemania', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [])).toMatch(/time do coração/);
    expect(validarJogo('timemania', [1, 2, 3, 4, 5, 6, 7, 8, 9], [3])).toMatch(/10/);
    expect(validarJogo('diadesorte', [1, 2, 3, 4, 5, 6, 7], [12])).toBeUndefined();
    expect(timesDaTimemania()).toHaveLength(80);
    expect(new Set(timesDaTimemania()).size).toBe(80);
  });

  it('só existem a partir do ano em que começaram', () => {
    const v = comDinheiro();
    const em = (ano: number) => { const x = structuredClone(v); x.t = ano * 12 + 3; x.eu.tNasc = x.t - 30 * 12; return x; };
    const pode = (x: Vida, l: LoteriaId) => podeTentar(disponibilidade(x, ap(x, { jogo: 'loteria', oque: 'comprar', loteria: l, surpresinhas: 1 })));
    expect(pode(em(2007), 'timemania')).toBe(false);
    expect(pode(em(2010), 'timemania')).toBe(true);
    expect(pode(em(2017), 'diadesorte')).toBe(false);
    expect(pode(em(2021), 'maismilionaria')).toBe(false);
    expect(disponibilidade(em(2019), ap(v, { jogo: 'loteria', oque: 'comprar', loteria: 'supersete', surpresinhas: 1 })).motivo).toMatch(/só começou em 2020/);
  });

  it('comprar, sortear e conferir: o dinheiro sai e entra UMA vez, o resultado fica no save; o extra sai no texto', () => {
    for (const l of NOVAS) {
      let v = comDinheiro(7);
      const n = proximoConcurso(v, l);
      const c0 = v.financas.conta;
      v = executar(v, ap(v, { jogo: 'loteria', oque: 'comprar', loteria: l, surpresinhas: 3 })).vida;
      const b = estadoApostas18(v).bilhetes.find(x => x.loteria === l && x.concurso === n)!;
      expect(b.jogos).toHaveLength(3);
      if (LOTERIAS18[l].extra) expect(b.extras).toHaveLength(3);
      expect(v.financas.conta).toBeCloseTo(c0 - b.custo, 2);
      const r = executar(v, ap(v, { jogo: 'loteria', oque: 'sorteio', loteria: l }));
      v = r.vida;
      const bb = estadoApostas18(v).bilhetes.find(x => x.id === b.id)!;
      expect(bb.resultado).toBeDefined();
      expect(v.financas.conta).toBeCloseTo(c0 - b.custo + bb.resultado!.premio, 2);
      const s = sorteioDoConcurso(v, l, n);
      if (l === 'supersete') expect(s.a.map(x => Math.floor(x / 10))).toEqual([0, 1, 2, 3, 4, 5, 6]);
      else expect(s.extra?.length).toBe(LOTERIAS18[l].extra!.sorteia);
      // Sortear de novo o mesmo concurso não paga de novo; o save reabre com o resultado.
      const lido = interpretar(JSON.stringify(v));
      if (lido.tipo !== 'ok') throw new Error('save');
      expect(estadoApostas18(lido.vida).bilhetes.find(x => x.id === b.id)!.resultado!.premio).toBe(bb.resultado!.premio);
    }
  });

  it('jogar não enriquece: em centenas de concursos, devolve bem menos do que custou', () => {
    for (const l of NOVAS) {
      let v = comDinheiro(11);
      v.financas.conta = 50_000_000;
      let gasto = 0, ganho = 0;
      for (let k = 0; k < 120; k++) {
        const c = v.financas.conta;
        v = executar(v, ap(v, { jogo: 'loteria', oque: 'comprar', loteria: l, surpresinhas: 5 })).vida;
        gasto += c - v.financas.conta;
        const c2 = v.financas.conta;
        v = executar(v, ap(v, { jogo: 'loteria', oque: 'sorteio', loteria: l })).vida;
        ganho += v.financas.conta - c2;
        v.momento = null;
      }
      expect(gasto).toBeGreaterThan(0);
      expect(ganho / gasto).toBeLessThan(0.9);
    }
  });
});
