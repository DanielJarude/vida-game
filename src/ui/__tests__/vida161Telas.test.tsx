// @vitest-environment jsdom
/** VIDA 16.1 · as capas das áreas (só dados reais) e a pasta das cinco profissões na tela, com interação. */
import { describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { adulto } from '../../motor/__tests__/cenarios';
import { executar, type Acao } from '../../motor/acoes';
import { Carteirinha161, Identidade161, Passaporte161 } from '../v16/areas/Capas161';
import Oficio16 from '../v16/oficios/Oficio16';

describe('VIDA 16.1 · capas das áreas', () => {
  it('o passaporte carimba só os países visitados de verdade (sem viagem, sem carimbo)', () => {
    const v = structuredClone(adulto(30, { semente: 2 }));
    const { unmount } = render(<Passaporte161 vida={v} />);
    expect(screen.getByText(/Nenhum carimbo ainda/)).toBeTruthy();
    unmount();
    v.viagens14 = { paises: { PT: v.t - 12, AR: v.t - 6 }, n: 2 };
    render(<Passaporte161 vida={v} />);
    const carimbos = screen.getByRole('list', { name: 'Países visitados' });
    expect(carimbos.querySelectorAll('li').length).toBe(2);
    expect(screen.getByText(/viagens registradas/).textContent).toMatch(/2/);
  });

  it('a carteirinha e a ficha do perfil leem a vida (nada inventado)', () => {
    const v = structuredClone(adulto(30, { semente: 3 }));
    render(<><Carteirinha161 vida={v} formacao={{ rotulo: 'Engenharia civil', detalhe: 'Universidade X' }} /><Identidade161 vida={v} /></>);
    expect(screen.getByText(/Engenharia civil/)).toBeTruthy();
    expect(screen.getByText('Diplomas').nextSibling?.textContent).toBe(String(v.educacao.concluidos.length));
    expect(screen.getByText('Cidade')).toBeTruthy();
  });

  it('a pasta da psicóloga: escolher a agenda, decidir sobre um paciente', async () => {
    const v0 = structuredClone(adulto(34, { semente: 5 }));
    v0.trabalho.atual = { ocupacaoId: 'psicologo_clinico', empregador: 'consultório', contrato: 'autonomo', salario: 6000, tInicio: v0.t - 48, desempenho: 60, municipioId: v0.moradia.municipioId, carga: 'integral' };
    function Palco() { const [v, setV] = useState(v0); const agir = (a: Acao) => { const r = executar(v, a); setV(r.vida); return r.vida !== v; }; return <Oficio16 vida={v} agir={agir} />; }
    render(<Palco />);
    expect(screen.getByText(/O consultório/)).toBeTruthy();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Agenda regular/ })); });
    expect(screen.getByText(/Agenda do ano: agenda regular/)).toBeTruthy();
    await act(async () => { fireEvent.click(screen.getAllByRole('button', { name: 'Continuar o acompanhamento' })[0]); });
    expect(screen.getAllByText(/O acompanhamento segue/).length).toBeGreaterThan(0);
  });
});
