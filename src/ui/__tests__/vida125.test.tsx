// @vitest-environment jsdom
/**
 * VIDA 12.5 — Polimento e Imersão: a lupa do estúdio de tatuagem, a retrospectiva da vida e os demais ajustes de tela.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { adulto } from '../../motor/__tests__/cenarios';
import { transacao } from '../../motor/nucleo';
import type { Vida } from '../../motor/tipos';
import { EstudioDeTatuagem } from '../jogo/Tatuagens';
import { focoDaParte } from '../avatar/Figura';
import { LOCAIS, type LocalDeTatuagem } from '../../motor/dados/tatuagens';

const rica = (): Vida => transacao(adulto(30, { semente: 12500, municipioId: 'sao-paulo-sp' }), x => { x.financas.conta = 900_000; x.momento = null; }).vida;
afterEach(() => cleanup());

describe('VIDA 12.5 · a lupa do estúdio de tatuagem', () => {
  it('abre na região escolhida, aproxima, afasta, volta ao corpo inteiro e troca frente/costas', () => {
    const { container } = render(<EstudioDeTatuagem vida={rica()} agir={() => true} />);
    const lupa = () => container.querySelector('figure.estudio-tatuagem__lupa')!;
    expect(lupa().getAttribute('data-nivel')).toBe('1');
    fireEvent.click(screen.getByRole('button', { name: 'Aproximar' }));
    expect(lupa().getAttribute('data-nivel')).toBe('2');
    fireEvent.click(screen.getByRole('button', { name: 'Aproximar' }));
    expect(lupa().getAttribute('data-nivel')).toBe('3');
    expect((screen.getByRole('button', { name: 'Aproximar' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Corpo inteiro' }));
    expect(lupa().getAttribute('data-nivel')).toBe('0');
    fireEvent.click(screen.getByRole('button', { name: 'Ver a região' }));
    expect(lupa().getAttribute('data-nivel')).toBe('1');
    fireEvent.click(screen.getByRole('button', { name: /^De costas/ }));
    expect(lupa().getAttribute('data-vista')).toBe('costas');
  });

  it('o foco de cada parte do corpo é finito, menor que o corpo inteiro e encolhe ao aproximar', () => {
    for (const local of Object.keys(LOCAIS) as LocalDeTatuagem[]) {
      const vista = LOCAIS[local].frente ? 'frente' : 'costas';
      const lado = LOCAIS[local].lados ? 'e' : undefined;
      const inteiro = focoDaParte('masculino', 'mediano', 30, 'inteiro', undefined, vista);
      const regiao = focoDaParte('masculino', 'mediano', 30, local, lado, vista, 1);
      const perto = focoDaParte('masculino', 'mediano', 30, local, lado, vista, 2.6);
      expect(regiao.w).toBeLessThan(inteiro.w);
      expect(perto.w).toBeLessThan(regiao.w);
      for (const f of [regiao, perto]) expect([f.x, f.y, f.w, f.h].every(Number.isFinite)).toBe(true);
    }
  });
});
