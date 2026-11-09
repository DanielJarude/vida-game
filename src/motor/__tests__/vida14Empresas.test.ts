/** VIDA 14 · o valor justo das empresas (uma conta só para comprar e vender) e o fim da revenda com lucro artificial. */
import { describe, expect, it } from 'vitest';
import { fatorDeHistorico14, precoDeVenda14, valorJusto14 } from '../dados14/empresas/valuation';

const base = { multiplo: 8, multReceita: 0.6, liquidacao: 10, caixa: 5, divida: 0 };
describe('VIDA 14 · valuation', () => {
  it('o lucro manda; a receita é âncora (não soma por inteiro) e a jovem tem desconto', () => {
    const x = valorJusto14({ ...base, lucros: [10, 10, 10], receitas: [100, 100, 100] });
    expect(x.operacao).toBeLessThanOrEqual(10 * 8 * 1.01 + 0.25 * 100 * 0.6);
    expect(x.operacao).toBeLessThan(10 * 8 + 100 * 0.6); // a conta antiga somava os dois
    const jovem = valorJusto14({ ...base, lucros: [10], receitas: [100] });
    expect(jovem.valor).toBeLessThan(x.valor);
    expect(fatorDeHistorico14(0)).toBeLessThan(fatorDeHistorico14(3));
  });
  it('resultado instável desconta; crescimento de verdade valoriza, com teto', () => {
    const estavel = valorJusto14({ ...base, lucros: [10, 10, 10], receitas: [100, 100, 100] });
    const instavel = valorJusto14({ ...base, lucros: [2, 18, 10], receitas: [100, 100, 100] });
    const cresce = valorJusto14({ ...base, lucros: [10, 10, 10], receitas: [50, 80, 100, 150] });
    expect(instavel.valor).toBeLessThan(estavel.valor);
    expect(cresce.valor).toBeGreaterThan(estavel.valor);
    expect(cresce.fatores.crescimento).toBeLessThanOrEqual(1.3);
  });
  it('a dívida sai do valor; mas a endividada que ainda dá lucro líquido não sai de graça', () => {
    const semDivida = valorJusto14({ ...base, lucros: [20, 20, 20], receitas: [200, 200, 200] });
    const endividada = valorJusto14({ ...base, lucros: [20, 20, 20], receitas: [200, 200, 200], divida: semDivida.valor - 1, lucrosLiquidos: [8, 8, 8] });
    expect(endividada.valor).toBeGreaterThanOrEqual(8 * 8 * 0.5 * 0.99);
  });
  it('vender custa: revender na hora nunca dá lucro', () => {
    const v = valorJusto14({ ...base, lucros: [10, 12, 14], receitas: [100, 110, 120] }).valor;
    expect(precoDeVenda14(v, 1)).toBeLessThan(v);
    expect(precoDeVenda14(v, 0.25)).toBeLessThan(v * 0.25 * 0.85);
  });
});
