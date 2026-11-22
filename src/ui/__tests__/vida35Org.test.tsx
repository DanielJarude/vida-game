// @vitest-environment jsdom
/** VIDA 35 · as telas novas da org: equipamento (pacote → compra), line academy, cômodos da casa, comprar line, eventos. */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { adulto } from '../../motor/__tests__/cenarios';
import { executar, disponibilidade, type Acao } from '../../motor/acoes';
import { podeTentar } from '../../motor/plausibilidade';
import type { Vida } from '../../motor/tipos';
import OrgEsports31 from '../v31/esports/OrgEsports31';

afterEach(() => cleanup());
const tenta = (v: Vida, a: Acao) => (podeTentar(disponibilidade(v, a)) ? executar(v, a).vida : v);
function comOrg() {
  const v = adulto(35, { semente: 36, municipioId: 'campinas-sp' }); v.financas.conta = 2e9;
  const w = tenta(v, { tipo: 'org31', oque: { op: 'fundar', nome: 'Quero-Quero Esports', jogo: 'lol', regiao: 'br', modo: 'elite' } } as Acao);
  w.orgEsports31!.caixa = 3e8;
  return w;
}
function Palco({ inicial }: { inicial: Vida }) {
  const [v, setV] = useState(inicial);
  const o = v.orgEsports31!;
  return <main><OrgEsports31 vida={v} agir={a => { setV(executar(v, a).vida); return true; }} /><output data-testid="o">{JSON.stringify({ pc: o.linhas[0].setup35?.pc ?? 0, academy: !!o.linhas[0].academy35, casa: o.casa35 ?? [] })}</output></main>;
}
const estado = () => JSON.parse(screen.getByTestId('o').textContent!);

describe('VIDA 35 · telas da org', () => {
  it('equipamento, academy e cômodos', () => {
    render(<Palco inicial={comOrg()} />);
    fireEvent.click(screen.getAllByRole('tab').find(t => /^LoL ·/.test(t.textContent ?? ''))!);
    fireEvent.click(screen.getByRole('tab', { name: 'Equipamento' }));
    expect(screen.getByRole('img', { name: 'A estação de um jogador' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Topo de linha' }));
    fireEvent.click(screen.getByRole('button', { name: /^Comprar o equipamento/ }));
    expect(estado().pc).toBe(3);
    fireEvent.click(screen.getByRole('tab', { name: /^Academy/ }));
    fireEvent.click(screen.getByRole('button', { name: /^Montar a line academy/ }));
    expect(estado().academy).toBe(true);
    fireEvent.click(screen.getByRole('tab', { name: 'Gaming house' }));
    fireEvent.click(screen.getAllByRole('button', { name: /^Construir/ })[0]);
    expect(estado().casa.length).toBe(1);
    expect(screen.getByRole('button', { name: /Sala de análise/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Sala de análise/ }));
    fireEvent.click(screen.getByRole('button', { name: 'tapete de sala' }));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar a casa' }));
    expect(screen.getByRole('button', { name: 'Casa salva' })).toBeTruthy();
    fireEvent.click(screen.getAllByRole('tab').find(t => /^LoL ·/.test(t.textContent ?? ''))!);
    fireEvent.click(screen.getByRole('tab', { name: 'Treino' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Adotar' })[0]);
    expect(screen.getAllByText('Em vigor').length).toBeGreaterThan(0);
  });
});
