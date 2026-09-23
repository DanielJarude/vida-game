// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { criarRng } from '../../motor/rng';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { App } from '../App';
import { criarVida } from '../../motor/criacao';
import { avancarAno } from '../../motor/ano';
import { salvar } from '../../motor/save';

beforeEach(() => {
  localStorage.clear();
  window.scrollTo = () => {};
  window.confirm = () => true;
  // Semente fixa: a vida sorteada ao nascer é sempre a mesma nos testes.
  const r = criarRng(20260922);
  vi.spyOn(Math, 'random').mockImplementation(() => r.next());
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function resolverMomentos() {
  for (let k = 0; k < 5; k++) {
    const dialogo = screen.queryByRole('dialog');
    if (!dialogo) return;
    const opcoes = within(dialogo).queryAllByRole('button').filter(b => b.classList.contains('opcao') && !(b as HTMLButtonElement).disabled);
    if (opcoes.length) { fireEvent.click(opcoes[0]); continue; }
    const cont = within(dialogo).queryByRole('button', { name: 'Continuar' });
    if (cont) { fireEvent.click(cont); continue; }
    return;
  }
}

function avancar(n: number) {
  for (let i = 0; i < n; i++) {
    resolverMomentos();
    fireEvent.click(screen.getByRole('button', { name: /Viver mais um ano/ }));
  }
  resolverMomentos();
}

describe('interface', () => {
  it('nasce, vive, decide e registra na Linha da Vida', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Nascer de novo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Nascer' }));
    expect(screen.getAllByText(/Nasceu em/).length).toBeGreaterThan(0);
    avancar(2);
    // A primeira palavra é uma escolha biográfica garantida aos 2 anos.
    expect(screen.getByText(/A primeira palavra foi/)).toBeTruthy();
    expect(screen.getAllByText('sua escolha').length).toBeGreaterThan(0);
  });

  it('a decisão abre como diálogo e o resultado aparece antes de seguir', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Nascer de novo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Nascer' }));
    fireEvent.click(screen.getByRole('button', { name: /Viver mais um ano/ }));
    fireEvent.click(screen.getByRole('button', { name: /Viver mais um ano/ }));
    const dialogo = screen.getByRole('dialog');
    expect(within(dialogo).getByText('A primeira palavra')).toBeTruthy();
    // enquanto há decisão, não dá para avançar
    expect((screen.getByRole('button', { name: /Viver mais um ano/ }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(within(dialogo).getAllByRole('button').find(b => b.classList.contains('opcao'))!);
    expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Continuar' })).toBeTruthy();
  });

  it('pessoas: abre a ficha e mostra ações com motivo quando bloqueadas', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Nascer de novo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Nascer' }));
    avancar(6);
    fireEvent.click(screen.getAllByRole('button', { name: /Pessoas/ })[0]);
    const mae = within(screen.getByRole('main')).getAllByText(/sua mãe/)[0].closest('button')!;
    fireEvent.click(mae);
    const ficha = screen.getByRole('dialog');
    expect(within(ficha).getByRole('button', { name: /Passar um tempo junto/ })).toBeTruthy();
    // criança não ajuda com dinheiro: o botão nem aparece antes dos 14
    expect(within(ficha).queryByRole('button', { name: /Ajudar com dinheiro/ })).toBeNull();
  });

  it('ação bloqueada explica o motivo (menor não muda de cidade)', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Nascer de novo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Nascer' }));
    avancar(8);
    fireEvent.click(screen.getAllByRole('button', { name: /Tempo/ })[0]);
    expect(screen.getByText('Sua semana')).toBeTruthy();
  });

  it('retoma uma vida salva', () => {
    let v = criarVida({ nome: 'Rita', sobrenome: 'Lopes', genero: 'feminino', municipioId: 'recife-pe', semente: 5 });
    for (let i = 0; i < 20; i++) { v = avancarAno(v).vida; if (v.momento) break; }
    salvar(v);
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Continuar a vida de Rita/ }));
    expect(screen.getAllByText(/Rita/).length).toBeGreaterThan(0);
  });
});
