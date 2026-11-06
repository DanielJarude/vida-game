// @vitest-environment jsdom
/** VIDA 12.9 — a faixa da vida e o álbum inteiro na Retrospectiva; a foto do carro e da casa de verdade. */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { adulto } from '../../motor/__tests__/cenarios';
import { memoriasDaVida } from '../../motor/sistemas/albumDaVida';
import { Retrospectiva } from '../jogo/Retrospectiva';

afterEach(cleanup);

describe('12.9 · retrospectiva', () => {
  it('cada memória vira um ponto da faixa da vida', () => {
    const v = adulto(40, { semente: 1297, municipioId: 'sao-paulo-sp' });
    const n = memoriasDaVida(v).length;
    const { container } = render(<Retrospectiva vida={v} />);
    if (n > 1) expect(container.querySelectorAll('.retro-faixa__ponto').length).toBe(n);
  });
});
