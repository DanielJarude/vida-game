/**
 * @vitest-environment jsdom
 *
 * B4-FIX2 item 16-18 — apresentação da localização por região.
 *
 * O playtest aprovou as 27 UFs, mas pediu apresentação por região (Norte,
 * Nordeste, Centro-Oeste, Sudeste, Sul) com nome completo do estado como
 * informação principal e a sigla como secundária, além de mais municípios
 * por estado.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';

import { CharacterCreationScreen } from '../screens/CharacterCreationScreen';
import { ORDEM_REGIOES } from '../../data/locations/estados';

afterEach(cleanup);

describe('B4-FIX2 · criação de personagem agrupa estados por região', () => {
  it('o campo Estado usa grupos (optgroup) nomeados pela região', () => {
    render(<CharacterCreationScreen onCriarVida={() => {}} onVoltar={() => {}} />);

    const select = screen.getByLabelText('Estado') as HTMLSelectElement;
    const grupos = Array.from(select.querySelectorAll('optgroup'));

    expect(grupos.length).toBeGreaterThan(0);
    const rotulos = grupos.map(g => g.getAttribute('label'));
    for (const rotulo of rotulos) {
      expect(ORDEM_REGIOES).toContain(rotulo);
    }
  });

  it('os grupos aparecem na ordem editorial Norte -> Sul', () => {
    render(<CharacterCreationScreen onCriarVida={() => {}} onVoltar={() => {}} />);
    const select = screen.getByLabelText('Estado') as HTMLSelectElement;
    const rotulos = Array.from(select.querySelectorAll('optgroup')).map(g => g.getAttribute('label'));

    let ultimoIndice = -1;
    for (const rotulo of rotulos) {
      const indice = ORDEM_REGIOES.indexOf(rotulo as (typeof ORDEM_REGIOES)[number]);
      expect(indice).toBeGreaterThan(ultimoIndice);
      ultimoIndice = indice;
    }
  });

  it('cada opção de estado mostra o nome completo como texto principal e a sigla entre parênteses', () => {
    render(<CharacterCreationScreen onCriarVida={() => {}} onVoltar={() => {}} />);
    const select = screen.getByLabelText('Estado') as HTMLSelectElement;

    const opcaoAcre = within(select).getByRole('option', { name: /Acre \(AC\)/ });
    expect(opcaoAcre).toBeTruthy();
    expect((opcaoAcre as HTMLOptionElement).value).toBe('AC');
  });

  it('São Paulo tem mais de uma cidade disponível no campo Cidade', () => {
    render(<CharacterCreationScreen onCriarVida={() => {}} onVoltar={() => {}} />);
    const selectEstado = screen.getByLabelText('Estado') as HTMLSelectElement;

    // Muda para SP.
    selectEstado.value = 'SP';
    selectEstado.dispatchEvent(new Event('change', { bubbles: true }));

    const selectCidade = screen.getByLabelText('Cidade') as HTMLSelectElement;
    expect(selectCidade.options.length).toBeGreaterThan(1);
  });
});
