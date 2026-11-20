// @vitest-environment jsdom
/** VIDA 29.2 · o cartão do tipo de jogador. */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { Perfil28 } from '../v28/Perfil28';

afterEach(() => cleanup());
describe('VIDA 29.2 · tipo de jogador na ficha', () => {
  it('mostra o tipo, a firmeza, o que puxa, o efeito e as trocas', () => {
    render(<Perfil28 genero="feminino" perfil={{ principal: 'matador', secundarios: ['decisivo'], desde: 2030 * 12, forca: 3.4, historico: [{ ano: 2028, principal: 'garcom' }, { ano: 2030, principal: 'matador' }] }} />);
    const c = screen.getByRole('region', { name: 'Tipo de jogador' });
    expect(c.textContent).toMatch(/Matadora/);
    expect(c.textContent).toMatch(/marcante/);
    expect(c.textContent).toMatch(/finalização/);
    expect(c.textContent).toMatch(/finaliza mais/);
    expect(c.textContent).toMatch(/jogadora decisiva/);
    expect(c.textContent).toMatch(/2028 garçonete → 2030 matadora/);
  });
  it('sem tipo: em formação, e o que está mais perto', () => {
    render(<Perfil28 perfil={{ secundarios: [], desde: 0, perto: { id: 'trocador', falta: 0.4 } }} />);
    const c = screen.getByRole('region', { name: 'Tipo de jogador' });
    expect(c.textContent).toMatch(/Ainda em formação/);
    expect(c.textContent).toMatch(/trocador/);
    expect(c.textContent).toMatch(/golpes em pé/);
  });
});
