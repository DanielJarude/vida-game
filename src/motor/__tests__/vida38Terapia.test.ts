/** VIDA 38 · bloco 3 — a terapia tem progressão: marcos em sessões acumuladas, com efeito na casa e na cabeça. */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { ROTINAS } from '../sistemas/rotinas';
import { criarRng } from '../rng';
import type { Vida } from '../tipos';

const terapia = ROTINAS.find(r => r.id === 'terapia')!;
const sessoes = (v: Vida, n: number) => { for (let k = 0; k < n; k++) terapia.efeito!(v, criarRng(k + 1), 1); };

describe('a terapia tem progressão (VIDA 38 · bloco 3)', () => {
  it('conta as sessões acumuladas', () => {
    const v = adulto(30, { semente: 4 });
    sessoes(v, 3);
    expect(v.fatos['terapia:sessoes']).toBe(3);
  });

  it('o marco de 12 sessões melhora a casa e tira estresse, e fica na biografia', () => {
    const v = adulto(30, { semente: 4 });
    v.biografia = [];
    v.mente.estresse = 60;
    sessoes(v, 12);
    expect(v.mente.estresse).toBeLessThan(60);
    expect(v.biografia.some(e => e.texto.includes('um ano de terapia'))).toBe(true);
  });

  it('o marco de 26 sessões pede uma escolha, que entra na memória de escolhas', () => {
    const v = adulto(30, { semente: 4 });
    v.biografia = [];
    sessoes(v, 26);
    expect(v.biografia.some(e => e.escolha && e.texto.includes('padrão'))).toBe(true);
  });
});
