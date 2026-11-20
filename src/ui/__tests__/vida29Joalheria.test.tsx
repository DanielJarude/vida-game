// @vitest-environment jsdom
/** VIDA 29 · a joalheria por categorias (Brincos, Colares, Pulseiras, Anéis, Relógios, Piercings) e tipos; a busca dentro da categoria; a memória ao voltar. */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import { adulto } from '../../motor/__tests__/cenarios';
import type { Vida } from '../../motor/tipos';
import { LojaDaVida } from '../jogo/material/Lojas';
import { limparCompras } from '../jogo/memoriaDeCompras';
import { ofertasDaLoja } from '../../motor/sistemas/lojas';
import { ITENS_ESTILO } from '../../motor/dados/estilo';
import { categoriaDeJoia, subcategoriaDeJoia } from '../../motor/dados/categoriasDeJoia29';
import { joia20 } from '../../motor/dados20/joias20';

function base(): Vida { const v = adulto(30, { semente: 9, municipioId: 'sao-paulo-sp', genero: 'feminino' }); v.financas.conta = 1_000_000; v.momento = null; return v; }
/** As escolhas da loja (radiogroup de botões): a opção pelo texto. */
const grupo = (c: HTMLElement, rotulo: string) => within(c).getByRole('radiogroup', { name: rotulo });
const opcao = (c: HTMLElement, rotulo: string, texto: RegExp) => within(grupo(c, rotulo)).getByRole('radio', { name: texto });
const cartoes = (c: HTMLElement) => [...c.querySelectorAll<HTMLElement>('.catalogo-loja__cartao')];
const item = (id: string) => ITENS_ESTILO.find(x => x.id === id);

describe('VIDA 29 · joalheria por categorias', () => {
  beforeEach(() => limparCompras());
  afterEach(() => cleanup());

  it('todo produto de joia da loja cai numa categoria (nenhum fica de fora)', () => {
    const v = base();
    const semCat = ofertasDaLoja(v, 'joalheria').filter(o => o.produto.tipo === 'item' && item(o.produto.id) && ['orelha', 'joia', 'pulseira', 'anel', 'alianca', 'pulso', 'tornozelo'].includes(item(o.produto.id)!.lugar ?? '') && !categoriaDeJoia(item(o.produto.id)!));
    expect(semCat.map(o => o.produto.id)).toEqual([]);
  });

  it('escolher "Brincos" mostra só brincos, com a contagem; o tipo filtra dentro; a busca diz a categoria', () => {
    const { container } = render(<LojaDaVida vida={base()} agir={() => true} lojaId="joalheria" />);
    fireEvent.click(opcao(container, 'Categoria', /^Brincos \(\d+\)$/));
    expect(opcao(container, 'Categoria', /^Brincos/).getAttribute('aria-checked')).toBe('true');
    const cs = cartoes(container);
    expect(cs.length).toBeGreaterThan(0);
    for (const c of cs) expect(categoriaDeJoia(item(c.dataset.produto!)!)).toBe('brincos');
    expect(within(container).getByText(/Buscar em brincos/)).toBeTruthy();
    const argolas = within(grupo(container, 'Tipo')).queryByRole('radio', { name: /^Argolas/ });
    if (argolas) {
      fireEvent.click(argolas);
      for (const c of cartoes(container)) { const it = item(c.dataset.produto!)!; expect(subcategoriaDeJoia(it.id, it, joia20(it.id))).toBe('Argolas'); }
    }
  });

  it('a loja lembra a categoria ao voltar', () => {
    const v = base();
    const a = render(<LojaDaVida vida={v} agir={() => true} lojaId="joalheria" />);
    fireEvent.click(opcao(a.container, 'Categoria', /^Anéis/));
    a.unmount();
    const b = render(<LojaDaVida vida={v} agir={() => true} lojaId="joalheria" />);
    expect(opcao(b.container, 'Categoria', /^Anéis/).getAttribute('aria-checked')).toBe('true');
  });
});
