// @vitest-environment jsdom
/**
 * VIDA 33 · as telas do dono: fundar um time com escudo e investimento (o escudo escolhido aparece na prévia), a org de
 * e-sports com várias lines (uma aba por line, a liga da região) e o painel de patrocínios (buscar → propostas → assinar).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { adulto } from '../../motor/__tests__/cenarios';
import { executar, disponibilidade, type Acao } from '../../motor/acoes';
import { podeTentar } from '../../motor/plausibilidade';
import type { Vida } from '../../motor/tipos';
import { FundarTime32 } from '../v32/esporte/Esporte32';
import OrgEsports31 from '../v31/esports/OrgEsports31';

afterEach(() => cleanup());
const tenta = (v: Vida, a: Acao) => (podeTentar(disponibilidade(v, a)) ? executar(v, a).vida : v);
const rico = () => { const v = adulto(35, { semente: 33, municipioId: 'campinas-sp' }); v.financas.conta = 2e9; return v; };

function Palco({ inicial, filho }: { inicial: Vida; filho: (v: Vida, agir: (a: Acao) => boolean) => JSX.Element }) {
  const [v, setV] = useState(inicial);
  return <main>{filho(v, a => { setV(executar(v, a).vida); return true; })}<output data-testid="org">{v.orgEsports31 ? JSON.stringify({ linhas: v.orgEsports31.linhas.map(l => l.jogo), ofertas: v.orgEsports31.comercial33?.ofertas.length ?? 0, contratos: v.orgEsports31.comercial33?.contratos.length ?? 0 }) : ''}</output><output data-testid="clube">{v.clube20 ? JSON.stringify({ nome: v.clube20.nome, sigla: v.clube20.identidade33?.sigla, estadio: v.clube20.estadio }) : ''}</output></main>;
}

describe('VIDA 33 · fundar com identidade e investimento', () => {
  it('a sigla escolhida vai para o escudo e para o clube fundado; o investimento muda a prévia', () => {
    render(<Palco inicial={rico()} filho={(v, agir) => <FundarTime32 vida={v} agir={agir} />} />);
    fireEvent.change(screen.getByLabelText('Nome do time'), { target: { value: 'Esporte Clube Ipê' } });
    fireEvent.click(screen.getByText('Escudo, cores e identidade'));
    fireEvent.change(screen.getByLabelText('Sigla'), { target: { value: 'ECI' } });
    expect(screen.getAllByRole('img', { name: 'Escudo do Esporte Clube Ipê' }).length).toBeGreaterThan(0);
    const antes = screen.getByText(/Elenco de nível/).textContent;
    fireEvent.change(screen.getByLabelText('Investimento inicial'), { target: { value: '9' } });
    expect(screen.getByText(/Elenco de nível/).textContent).not.toBe(antes);
    fireEvent.click(screen.getByRole('button', { name: /^Fundar ·/ }));
    expect(JSON.parse(screen.getByTestId('clube').textContent!)).toMatchObject({ nome: 'Esporte Clube Ipê', sigla: 'ECI' });
  });
});

describe('VIDA 33 · a org com várias lines e os patrocínios', () => {
  it('uma aba por line, com a liga da região; buscar patrocínio traz propostas e assinar fecha o contrato', () => {
    let v = tenta(rico(), { tipo: 'org31', oque: { op: 'fundar', nome: 'Carcará Esports', jogo: 'lol', regiao: 'br', modo: 'elite' } } as Acao);
    v = tenta(v, { tipo: 'org31', oque: { op: 'entrar', jogo: 'cs', regiao: 'eu', modo: 'base' } } as Acao);
    v.orgEsports31!.caixa = 5e7; v.orgEsports31!.fas = 40; v.orgEsports31!.reputacao = 40;
    render(<Palco inicial={v} filho={(x, agir) => <OrgEsports31 vida={x} agir={agir} />} />);
    const abas = screen.getAllByRole('tab').map(t => t.textContent ?? '');
    expect(abas.some(t => /LoL · (CBLOL|LTA Sul)/.test(t))).toBe(true);
    expect(abas.some(t => /^CS · /.test(t))).toBe(true);
    fireEvent.click(screen.getAllByRole('tab').find(t => /^CS · /.test(t.textContent ?? ''))!);
    expect(screen.getByText(/Europa/, { selector: 'small' })).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: 'Patrocínios, camisa e loja' }));
    const master = screen.getByText('Patrocínio master').closest('li')!;
    fireEvent.click(within(master).getByRole('button', { name: /Buscar patrocinadores/ }));
    expect(JSON.parse(screen.getByTestId('org').textContent!).ofertas).toBeGreaterThan(0);
    fireEvent.click(within(screen.getByText('Patrocínio master').closest('li')!).getAllByRole('button', { name: 'Assinar' })[0]);
    expect(JSON.parse(screen.getByTestId('org').textContent!).contratos).toBe(1);
  });
});
