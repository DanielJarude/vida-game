// @vitest-environment jsdom
/** VIDA 29 · as quatro loterias novas na tela: a aba (só da época), o volante do Super Sete, o time, o mês e os trevos. */
import { afterEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { Loterias18 } from '../v18/apostas/Apostas18';
import { adulto } from '../../motor/__tests__/cenarios';
import { executar, type Acao } from '../../motor/acoes';
import type { Vida } from '../../motor/tipos';

afterEach(() => cleanup());
function Palco({ v0 }: { v0: Vida }) { const [v, setV] = useState(v0); return <Loterias18 vida={v} agir={(a: Acao) => { const r = executar(v, a); setV(r.vida); ultima = r.vida; return r.vida !== v; }} />; }
let ultima: Vida | undefined;
const base = () => { const v = structuredClone(adulto(30, { semente: 4, municipioId: 'sao-paulo-sp' })); v.financas.conta = 100_000; v.momento = null; return v; };

describe('VIDA 29 · loterias novas na tela', () => {
  it('as quatro abas aparecem no ano de hoje (e não antes da hora)', () => {
    render(<Palco v0={base()} />);
    for (const n of ['Timemania', 'Dia de Sorte', 'Super Sete', '+Milionária']) expect(screen.getByRole('tab', { name: new RegExp(n.replace('+', '\\+')) })).toBeTruthy();
    cleanup();
    const antigo = base(); antigo.t = 2010 * 12; antigo.eu.tNasc = antigo.t - 30 * 12;
    render(<Palco v0={antigo} />);
    expect(screen.getByRole('tab', { name: /Timemania/ })).toBeTruthy();
    expect(screen.queryByRole('tab', { name: /Dia de Sorte/ })).toBeNull();
  });

  it('Super Sete: um número por coluna e o jogo registra', async () => {
    render(<Palco v0={base()} />);
    await act(async () => { fireEvent.click(screen.getByRole('tab', { name: /Super Sete/ })); });
    for (let c = 1; c <= 7; c++) fireEvent.click(screen.getByRole('button', { name: `Coluna ${c}, número ${c % 10}` }));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Registrar este jogo' })); });
    const b = ultima!.apostas18!.bilhetes.find(x => x.loteria === 'supersete')!;
    expect(b.jogos[0]).toEqual([1, 12, 23, 34, 45, 56, 67]);
  });

  it('+Milionária: seis dezenas e dois trevos; Dia de Sorte: o mês', async () => {
    render(<Palco v0={base()} />);
    await act(async () => { fireEvent.click(screen.getByRole('tab', { name: /\+Milionária/ })); });
    for (const d of ['01', '02', '03', '04', '05', '06']) fireEvent.click(screen.getByRole('button', { name: d }));
    const trevos = screen.getByRole('group', { name: 'Trevos' });
    fireEvent.click(within(trevos).getByRole('button', { name: '☘ 2' }));
    fireEvent.click(within(trevos).getByRole('button', { name: '☘ 5' }));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Registrar este jogo' })); });
    expect(ultima!.apostas18!.bilhetes.find(x => x.loteria === 'maismilionaria')!.extras).toEqual([[2, 5]]);
    await act(async () => { fireEvent.click(screen.getByRole('tab', { name: /Dia de Sorte/ })); });
    for (const d of ['01', '02', '03', '04', '05', '06', '07']) fireEvent.click(screen.getByRole('button', { name: d }));
    fireEvent.click(within(screen.getByRole('group', { name: 'Mês da sorte' })).getByRole('button', { name: 'mar' }));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Registrar este jogo' })); });
    expect(ultima!.apostas18!.bilhetes.find(x => x.loteria === 'diadesorte')!.extras).toEqual([[3]]);
  });
});
