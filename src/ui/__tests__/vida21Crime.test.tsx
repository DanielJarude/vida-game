// @vitest-environment jsdom
/**
 * VIDA 21 · a tela "O que veio dos serviços": cada bem com as saídas dele, as ofertas (preço, risco, quem não negocia),
 * vender atualiza o saldo e a lista, e o relógio usado aparece na Aparência.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { adulto } from '../../motor/__tests__/cenarios';
import { transacao } from '../../motor/nucleo';
import { executar, type Acao } from '../../motor/acoes';
import { entrar } from '../../motor/sistemas/ilicito';
import { BensDoCrime } from '../v21/crime/BensDoCrime';
import { OQueVeste } from '../jogo/Aparencia';
import type { Vida } from '../../motor/tipos';

afterEach(() => cleanup());
const base = (): Vida => transacao(adulto(30, { semente: 2121, municipioId: 'sao-paulo-sp' }), (x, r) => {
  x.momento = null; delete x.fila; x.justica = undefined; x.financas.conta = 10_000;
  entrar(x, 'patrimonial', undefined, r);
  x.espolio21 = { reputacao: 0, historico: [], bens: [
    { id: 'r', modelo: 'rel_mergulho', categoria: 'relogio', nome: 'Relógio de mergulho', valor: 1600, t: x.t, origem: 'um serviço pequeno', rastreavel: false, calor: 55, estado: 'escondido', estiloId: 'relogio_mergulho' },
    { id: 'p', modelo: 'pneus', categoria: 'mercadoria', nome: 'Lote de pneus', valor: 18000, t: x.t, origem: 'a carga desviada', rastreavel: false, calor: 55, estado: 'escondido' }
  ] };
}).vida;

describe('VIDA 21 · O que veio dos serviços', () => {
  it('mostra os bens, as saídas certas e as ofertas; usar o relógio leva para a Aparência', () => {
    let v = base();
    const agir = (a: Acao) => { v = executar(v, a).vida; rerender(<BensDoCrime vida={v} agir={agir} />); return true; };
    const { container, rerender } = render(<BensDoCrime vida={v} agir={agir} />);
    const pneus = container.querySelector('[data-bem="pneus"]') as HTMLElement;
    expect(within(pneus).queryByRole('button', { name: /^Usar/ })).toBeNull();
    fireEvent.click(within(pneus).getByRole('button', { name: 'Ver quem compra' }));
    // O desmanche exige nome no meio: aparece fechado, com o motivo; o receptador do bairro compra.
    expect(within(pneus).getByText(/Só negocia com quem já tem nome/)).toBeTruthy();
    expect(within(pneus).getByRole('button', { name: /Vender para receptador do bairro/ })).toBeTruthy();
    const relogio = container.querySelector('[data-bem="rel_mergulho"]') as HTMLElement;
    fireEvent.click(within(relogio).getByRole('button', { name: /Usar \(vai para a Aparência\)/ }));
    expect(v.eu.estilo!.itens.find(x => x.itemId === 'relogio_mergulho')?.usando).toBe(true);
    cleanup();
    const a = render(<OQueVeste vida={v} agir={() => true} />);
    expect(within(a.container.querySelector('[data-parte="pulso"]') as HTMLElement).getByText('Relógio de mergulho')).toBeTruthy();
  });

  it('vender tira o bem da lista e põe no histórico (vendido ou apreendido)', () => {
    let v = base();
    const agir = (a: Acao) => { v = executar(v, a).vida; rerender(<BensDoCrime vida={v} agir={agir} />); return true; };
    const { container, rerender } = render(<BensDoCrime vida={v} agir={agir} />);
    const pneus = container.querySelector('[data-bem="pneus"]') as HTMLElement;
    fireEvent.click(within(pneus).getByRole('button', { name: 'Ver quem compra' }));
    fireEvent.click(within(pneus).getByRole('button', { name: /Vender para receptador do bairro/ }));
    expect(container.querySelector('[data-bem="pneus"]')).toBeNull();
    expect(screen.getByText(/O que já saiu/)).toBeTruthy();
  });
});
