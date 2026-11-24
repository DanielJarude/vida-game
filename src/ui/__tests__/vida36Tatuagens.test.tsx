// @vitest-environment jsdom
/** VIDA 36 · tatuagens: "Ver no corpo" leva a lupa à região da tatuagem e numera as que estão ali. */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import { adulto } from '../../motor/__tests__/cenarios';
import { transacao } from '../../motor/nucleo';
import { executar } from '../../motor/acoes';
import type { Vida } from '../../motor/tipos';
import { tatuagensDe, regiaoDe } from '../../motor/sistemas/tatuagens';
import { EstudioDeTatuagem } from '../jogo/Tatuagens';

afterEach(() => cleanup());

describe('VIDA 36 · ver no corpo', () => {
  it('abre a região da tatuagem e lista as outras que estão nela, numeradas', () => {
    let v: Vida = transacao(adulto(30, { semente: 3636, municipioId: 'sao-paulo-sp' }), x => { x.financas.conta = 900_000; x.momento = null; }).vida;
    // Duas no mesmo antebraço: tenta desenhos até conseguir (o que cabe e o que a pele aceita).
    const cabem = ['andorinha', 'corvo', 'constelacao', 'rosa', 'estrela'];
    for (const desenho of cabem) {
      if (tatuagensDe(v).length >= 2) break;
      const x = executar(v, { tipo: 'tatuar', desenho, regiao: 'antebraco', lado: 'd' });
      if (x.vida !== v) v = x.vida;
    }
    expect(tatuagensDe(v).filter(t => regiaoDe(t) === 'antebraco').length).toBe(2);
    const { container, getByRole, getAllByText, findAllByRole } = render(<EstudioDeTatuagem vida={v} agir={() => true} />);
    fireEvent.click(getByRole('tab', { name: /As suas/ }));
    const botoes = Array.from(container.querySelectorAll('button')).filter(b => b.textContent === 'Ver no corpo');
    expect(botoes.length).toBe(2);
    fireEvent.click(botoes[0]);
    const banner = container.querySelector('.estudio-tatuagem__vendo') as HTMLElement;
    expect(banner).not.toBeNull();
    expect(banner.textContent).toMatch(/Nesta região há 2/);
    expect(container.querySelector('figure.estudio-tatuagem__lupa')!.getAttribute('data-regiao')).toBe('antebraco');
    const numeradas = within(banner).getAllByRole('button').filter(b => /desde/.test(b.textContent ?? ''));
    expect(numeradas.length).toBe(2);
    expect(numeradas.map(b => b.getAttribute('aria-pressed'))).toContain('true');
    void getAllByText; void findAllByRole;
  });
});
