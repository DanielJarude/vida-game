// @vitest-environment jsdom
/** VIDA 38 · tutorial da primeira entrada: aparece uma vez, pode ser pulado em qualquer passo e não volta sozinho. */
import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { PrimeiraEntrada, PASSOS_DO_TUTORIAL } from '../v38/PrimeiraEntrada';

describe('tutorial da primeira entrada (VIDA 38)', () => {
  beforeEach(() => { cleanup(); window.localStorage.clear(); });

  it('aparece na primeira vez, com a opção de pular visível', () => {
    render(<PrimeiraEntrada />);
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Pular tutorial' })).toBeTruthy();
  });

  it('pular fecha na hora e guarda a preferência deste navegador', () => {
    const { unmount } = render(<PrimeiraEntrada />);
    fireEvent.click(screen.getByRole('button', { name: 'Pular tutorial' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(window.localStorage.getItem('vida.tutorial.primeiraEntrada.v1')).toBe('1');
    unmount();
    render(<PrimeiraEntrada />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('pular funciona no meio do tutorial, não só no começo', () => {
    render(<PrimeiraEntrada />);
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Pular tutorial' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('percorre todos os passos e termina em "Começar"', () => {
    render(<PrimeiraEntrada />);
    for (let k = 0; k < PASSOS_DO_TUTORIAL.length - 1; k++) fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));
    expect(screen.getByRole('button', { name: 'Começar' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Começar' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
