// @vitest-environment jsdom
/** VIDA 30 · a tela do dono de clube como painel: escudo, números, o time no campo, medidores, temporadas e cartões. */
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { Clube20 } from '../v20/clubes/Clube20';
import { adulto } from '../../motor/__tests__/cenarios';
import { executar, type Acao } from '../../motor/acoes';
import { carregarMundo } from '../../motor/mundo/carregar';
import type { Vida } from '../../motor/tipos';

beforeAll(async () => { await carregarMundo(); });
afterEach(() => cleanup());

function montar() {
  let v = structuredClone(adulto(40, { semente: 9, municipioId: 'recife-pe' }));
  v.financas.conta = 400_000_000;
  v.financas.negativado = false;
  v = executar(v, { tipo: 'clube20', oque: { op: 'comprar', nome: 'Náutico', pais: 'BR' } } as Acao).vida;
  expect(v.clube20).toBeTruthy();
  function Palco() { const [x, setX] = useState(v); return <Clube20 vida={x} agir={(a: Acao) => { const r = executar(x, a); setX(r.vida); return r.vida !== x; }} />; }
  render(<Palco />);
  return v;
}

describe('VIDA 30 · o clube como painel', () => {
  it('abre no painel: escudo, números, o time provável no campo e os medidores', () => {
    const v = montar();
    expect(screen.getByRole('img', { name: /Escudo do Náutico/ })).toBeTruthy();
    expect(screen.getByRole('img', { name: /time titular provável/ })).toBeTruthy();
    const jogadores = document.querySelectorAll('.clube30__jog');
    expect(jogadores.length).toBeGreaterThanOrEqual(Math.min(11, v.clube20!.elenco.length) - 1);
    expect(screen.getByRole('meter', { name: 'Torcida' })).toBeTruthy();
    expect(screen.getByLabelText(/Estádio: \d de 5/)).toBeTruthy();
  });
  it('elenco e mercado viram cartões com barra de força (o mercado compara com o titular da posição)', async () => {
    montar();
    await act(async () => { fireEvent.click(screen.getByRole('tab', { name: 'Elenco' })); });
    expect(document.querySelectorAll('.clube30__cartao').length).toBeGreaterThan(5);
    await act(async () => { fireEvent.click(screen.getByRole('tab', { name: 'Mercado' })); });
    const deltas = [...document.querySelectorAll('.clube30__delta')].map(x => x.textContent ?? '');
    expect(deltas.length).toBeGreaterThan(0);
    expect(deltas.every(d => /vs\. titular/.test(d))).toBe(true);
  });
});
