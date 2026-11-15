// @vitest-environment jsdom
/** VIDA 22 — a loja da casa por ambiente (e o tipo de móvel dentro dele), a ordem por qualidade e a prévia no cômodo. */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { adulto } from '../../motor/__tests__/cenarios';
import { transacao } from '../../motor/nucleo';
import type { Vida } from '../../motor/tipos';
import { LojaDaVida } from '../jogo/material/Lojas';
import { limparCompras } from '../jogo/memoriaDeCompras';
import { AMBIENTES22, ambientesDoProduto } from '../../motor/dados22/moveis/ambientes22';
import { produtosDaCategoria } from '../../motor/sistemas/lojas';

const rica = (): Vida => transacao(adulto(30, { semente: 2201, municipioId: 'sao-paulo-sp' }), x => { x.financas.conta = 900_000; x.momento = null; }).vida;
beforeEach(() => limparCompras());
afterEach(() => { cleanup(); limparCompras(); });

describe('VIDA 22 · ambientes da loja da casa', () => {
  it('todo produto de móveis e eletrodomésticos tem ambiente, e nenhum ambiente fica vazio', () => {
    const ids = [...produtosDaCategoria('moveis'), ...produtosDaCategoria('eletrodomesticos')].map(p => p.id);
    expect(ids.filter(id => !ambientesDoProduto(id).length)).toEqual([]);
    for (const a of AMBIENTES22) expect(ids.some(id => ambientesDoProduto(id).includes(a.id)), a.id).toBe(true);
  });
  it('escolher um ambiente mostra só os produtos dele (a mesma linha pode estar em dois)', () => {
    const { container } = render(<LojaDaVida vida={rica()} agir={() => true} lojaId="moveis" />);
    fireEvent.click(screen.getByRole('radio', { name: 'Banheiro' }));
    const prods = [...container.querySelectorAll('.catalogo-loja__cartao')].map(x => x.getAttribute('data-produto')!);
    expect(prods.length).toBeGreaterThan(0);
    expect(prods.every(p => ambientesDoProduto(p).includes('banheiro'))).toBe(true);
    fireEvent.click(screen.getByRole('radio', { name: 'Piscina e lazer' }));
    const piscina = [...container.querySelectorAll('.catalogo-loja__cartao')].map(x => x.getAttribute('data-produto')!);
    expect(piscina).toContain('espreguicadeira');
    fireEvent.click(screen.getByRole('radio', { name: 'Área externa e jardim' }));
    expect([...container.querySelectorAll('.catalogo-loja__cartao')].map(x => x.getAttribute('data-produto'))).toContain('espreguicadeira');
  });
  it('ordena pela qualidade (o segmento não sobe ao descer a lista)', () => {
    const { container } = render(<LojaDaVida vida={rica()} agir={() => true} lojaId="moveis" />);
    fireEvent.change(screen.getByLabelText('Ordenar'), { target: { value: 'qualidade' } });
    const niveis = [...container.querySelectorAll('.catalogo-loja__cartao')].map(x => Number(x.getAttribute('data-nivel')));
    expect(niveis.length).toBeGreaterThan(3);
    for (let k = 1; k < niveis.length; k++) expect(niveis[k]).toBeLessThanOrEqual(niveis[k - 1]);
  });
  it('a prévia mostra o cômodo de verdade com a peça escolhida', () => {
    const { container } = render(<LojaDaVida vida={rica()} agir={() => true} lojaId="moveis" />);
    fireEvent.click(screen.getByRole('radio', { name: 'Sala de estar' }));
    const botao = screen.getAllByRole('button', { name: 'Ver no cômodo' })[0];
    fireEvent.click(botao);
    expect(container.querySelector('.m14-previa22 svg')).toBeTruthy();
  });
});
