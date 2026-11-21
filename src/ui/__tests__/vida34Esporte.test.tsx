// @vitest-environment jsdom
/**
 * VIDA 34 · a central do esporte (os times em cartões, uma tela por vez, a trilha de volta), as instalações
 * personalizadas (salvas no time pelo op 'dono' → 'instalacoes') e as cores reais dos escudos e das orgs.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { adulto } from '../../motor/__tests__/cenarios';
import { executar, disponibilidade, type Acao } from '../../motor/acoes';
import { podeTentar } from '../../motor/plausibilidade';
import type { Vida } from '../../motor/tipos';
import CentralEsporte34 from '../v34/esporte/CentralEsporte34';
import { desenhoDoClube30 } from '../v30/escudos/Escudo30';
import { coresDaOrg34 } from '../v31/esports/coresOrgs34';

afterEach(() => cleanup());
const tenta = (v: Vida, a: Acao) => (podeTentar(disponibilidade(v, a)) ? executar(v, a).vida : v);
const rico = () => { const v = adulto(35, { semente: 34, municipioId: 'campinas-sp' }); v.financas.conta = 2e9; return v; };

function Palco({ inicial }: { inicial: Vida }) {
  const [v, setV] = useState(inicial);
  return <main><CentralEsporte34 vida={v} agir={a => { setV(executar(v, a).vida); return true; }} /><output data-testid="inst">{JSON.stringify(v.equipes32?.[0]?.instalacoes34 ?? null)}</output></main>;
}

describe('VIDA 34 · central do esporte', () => {
  it('sem times mostra as portas; fundar abre o time novo; a trilha volta aos cartões', () => {
    render(<Palco inicial={rico()} />);
    expect(screen.getByRole('button', { name: /Comprar um clube de futebol/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Fundar um time/ }));
    fireEvent.click(screen.getByRole('button', { name: /Basquete/ }));
    fireEvent.change(screen.getByLabelText('Nome do time'), { target: { value: 'Aurora Basquete' } });
    fireEvent.click(screen.getByRole('button', { name: /^Fundar ·/ }));
    expect(screen.getByRole('tab', { name: 'Ginásio' })).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: 'Ginásio' }));
    expect(screen.getByRole('img', { name: /ginásio com/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Sintético azul' }));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar as escolhas' }));
    expect(JSON.parse(screen.getByTestId('inst').textContent!)).toMatchObject({ piso: 'azul' });
    fireEvent.click(screen.getByRole('button', { name: /Todos os times/ }));
    expect(screen.getByRole('button', { name: /Abrir o painel do Aurora Basquete/ })).toBeTruthy();
  });

  it('o clube guarda as instalações e o estádio aparece no tamanho do nível', () => {
    let v = tenta(rico(), { tipo: 'clube20', oque: { op: 'comprar', nome: 'Guarani', pais: 'BR' } } as Acao);
    expect(v.clube20).toBeTruthy();
    v = tenta(v, { tipo: 'clube20', oque: { op: 'dono', sub: { op: 'instalacoes', instalacoes: { nomeCasa: 'Brinco de Ouro', cadeiras: 'mosaico', gramado: 'xadrez', lixo: 1 } } } } as unknown as Acao);
    expect(v.clube20!.instalacoes34).toEqual({ nomeCasa: 'Brinco de Ouro', cadeiras: 'mosaico', gramado: 'xadrez' });
  });
});

describe('VIDA 34 · cores reais', () => {
  it('clubes de fora e orgs reais têm as cores da marca', () => {
    expect(desenhoDoClube30('FC Porto').slice(2, 4)).toEqual(['#0b3d91', '#ffffff']);
    expect(desenhoDoClube30('Kaizer Chiefs')[2]).toBe('#ffc20e');
    expect(desenhoDoClube30('Fluminense')[1]).toBe('listras');
    expect(coresDaOrg34('LOUD')[0]).toBe('#13ff00');
    expect(coresDaOrg34('Natus Vincere')[0]).toBe('#ffee00');
  });
});
