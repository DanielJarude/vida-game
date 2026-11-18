// @vitest-environment jsdom
/**
 * VIDA 27 · §9 — a joalheria com catálogo grande: filtrar por material e pedra, ordenar por nome e marca, ver só o que
 * já é seu, o material no cartão, e a loja lembra os filtros ao voltar.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import { adulto } from '../../motor/__tests__/cenarios';
import type { Vida } from '../../motor/tipos';
import { LojaDaVida } from '../jogo/material/Lojas';
import { limparCompras } from '../jogo/memoriaDeCompras';
import { ofertasDaLoja } from '../../motor/sistemas/lojas';
import { joia20 } from '../../motor/dados20/joias20';

function base(): Vida { const v = adulto(30, { semente: 9, municipioId: 'sao-paulo-sp' }); v.financas.conta = 1_000_000; v.momento = null; return v; }
const select = (c: HTMLElement, rotulo: string) => within(c).getByText(rotulo, { selector: '.campo__rotulo' }).parentElement!.querySelector('select')!;
const cartoes = (c: HTMLElement) => [...c.querySelectorAll<HTMLElement>('.catalogo-loja__cartao')];

describe('VIDA 27 · joalheria', () => {
  beforeEach(() => limparCompras());
  afterEach(() => cleanup());

  it('a joalheria tem centenas de produtos e filtros de material e pedra que funcionam', () => {
    const v = base();
    expect(new Set(ofertasDaLoja(v, 'joalheria').map(o => o.produto.id)).size).toBeGreaterThan(100);
    const { container } = render(<LojaDaVida vida={v} agir={() => true} lojaId="joalheria" />);
    fireEvent.change(select(container, 'Material'), { target: { value: 'prata' } });
    const cs = cartoes(container);
    expect(cs.length).toBeGreaterThan(0);
    for (const c of cs) expect(joia20(c.dataset.produto!)?.metal).toBe('prata');
    expect(cs.every(c => c.querySelector('[data-material="prata"]'))).toBe(true);
    fireEvent.change(select(container, 'Pedra'), { target: { value: 'sem' } });
    for (const c of cartoes(container)) expect(joia20(c.dataset.produto!)?.pedra).toBeUndefined();
  });

  it('ordenar por nome (A–Z)', () => {
    const { container } = render(<LojaDaVida vida={base()} agir={() => true} lojaId="joalheria" />);
    fireEvent.change(select(container, 'Ordenar'), { target: { value: 'nome' } });
    const nomes = cartoes(container).map(c => c.querySelector('.catalogo-loja__nome')!.textContent!);
    expect(nomes).toEqual([...nomes].sort((a, b) => a.localeCompare(b)));
  });

  it('só o que já é meu, com o estado no cartão', () => {
    const v = base();
    const id = ofertasDaLoja(v, 'joalheria').find(o => o.produto.tipo === 'item')!.produto.id;
    v.eu.estilo = { itens: [{ id: 'x1', itemId: id, t: v.t, preco: 1000, usando: false }] } as never;
    const { container } = render(<LojaDaVida vida={v} agir={() => true} lojaId="joalheria" />);
    fireEvent.click(within(container).getByLabelText(/Só o que já é meu/));
    const cs = cartoes(container);
    expect(cs.map(c => c.dataset.produto)).toEqual([id]);
    expect(cs[0].dataset.estado).toBe('seu');
  });

  it('a loja lembra os filtros ao fechar e abrir de novo', () => {
    const v = base();
    const r1 = render(<LojaDaVida vida={v} agir={() => true} lojaId="joalheria" />);
    fireEvent.change(select(r1.container, 'Material'), { target: { value: 'ouro_branco' } });
    r1.unmount();
    const { container } = render(<LojaDaVida vida={v} agir={() => true} lojaId="joalheria" />);
    expect(select(container, 'Material').value).toBe('ouro_branco');
    expect(cartoes(container).every(c => joia20(c.dataset.produto!)?.metal === 'ouro_branco')).toBe(true);
  });
});
