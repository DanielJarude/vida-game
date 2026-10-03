// @vitest-environment jsdom
/**
 * As lojas das coisas da vida: em Compras e na aba Cidade; cada loja mostra o
 * preço daqui, o que a coisa muda (a atividade que rende mais) e o botão de
 * comprar; o que é seu aparece em Casa, com o estado e a venda.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { precarregar } from '../App';
import { criarRng } from '../../motor/rng';
import { criarVida } from '../../motor/criacao';
import { avancarAno } from '../../motor/ano';
import type { Vida } from '../../motor/tipos';
import { transacao } from '../../motor/nucleo';
import { Lugar } from '../jogo/material/Lugares';
import { Cidade } from '../jogo/Cidade';
import { Pertences } from '../jogo/Pertences';

beforeAll(async () => { await precarregar(); });
beforeEach(() => {
  localStorage.clear();
  window.scrollTo = () => {};
  const r = criarRng(20261004);
  vi.spyOn(Math, 'random').mockImplementation(() => r.next());
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function adulta(): Vida {
  let v = criarVida({ nome: 'Lia', sobrenome: 'Prado', genero: 'feminino', municipioId: 'sao-paulo-sp', semente: 9 });
  for (let i = 0; i < 28; i++) { v = avancarAno(v).vida; v.momento = null; }
  return transacao(v, x => {
    x.financas.conta = 100000;
    x.moradia = { tipo: 'aluguel', municipioId: x.moradia.municipioId, modeloId: 'apto_2q', aluguel: 1500, padrao: 3, tInicio: x.t };
  }).vida;
}

describe('as lojas das coisas da vida', () => {
  it('a loja de instrumentos mostra preço, o que rende e o botão de comprar', () => {
    const v = adulta();
    render(<Lugar vida={v} agir={() => true} qual="instrumentos" aoFechar={() => {}} trocar={() => {}} />);
    expect(screen.getByText(/^Violão ·/)).toBeTruthy();
    expect(screen.getAllByText(/Rende mais: tocar um instrumento/i).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: 'Comprar' }).length).toBeGreaterThan(3);
  });

  it('a aba Cidade lista as lojas e abre a escolhida', () => {
    const v = adulta();
    const abrir = vi.fn();
    render(<Cidade vida={v} agir={() => true} abrir={abrir} />);
    fireEvent.click(screen.getByRole('button', { name: /^Lojas da cidade/ }));
    fireEvent.click(screen.getByRole('button', { name: /Livraria e papelaria/ }));
    expect(abrir).toHaveBeenCalledWith('livraria');
  });

  it('REWORK 4: o que é seu aparece em Pertences — primeiro o que dá para fazer, a venda por último', () => {
    const v = transacao(adulta(), x => { x.financas.coisas = [{ id: 'cs1', coisaId: 'violao', t: x.t, preco: 900, estado: 90 }]; }).vida;
    render(<Pertences vida={v} agir={() => true} abrir={() => {}} />);
    expect(screen.getByText('Violão')).toBeTruthy();
    expect(screen.getByText(/nova/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Tocar' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Vender \(/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Vender ou se desfazer/ }));
    expect(screen.getByRole('button', { name: /^Vender \(/ })).toBeTruthy();
  });
});
