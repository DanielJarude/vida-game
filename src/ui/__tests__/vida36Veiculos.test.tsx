// @vitest-environment jsdom
/** VIDA 36 · a vitrine de veículos: marca, faixa, ordem e comparação de até três, com o estado guardado. */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { useState } from 'react';
import { CatalogoVeiculos } from '../jogo/material/Lugares';
import { nova, viverAte } from '../../motor/__tests__/ajuda';
import { ofertasDeVeiculos } from '../../motor/sistemas/mercado';
import type { OfertaVeiculo } from '../../motor/sistemas/mercado';

const ofertas = (): OfertaVeiculo[] => ofertasDeVeiculos(viverAte(nova({ semente: 36, municipioId: 'recife-pe' }), 30), 'concessionaria');

const INICIAL = { categoria: 'todas', condicao: 'todos', ordem: 'barato', busca: '', marca: '', faixa: '', comparar: [], quantos: 20 } as const;

function Tela({ lista }: { lista: OfertaVeiculo[] }) {
  const [estado, setEstado] = useState<typeof INICIAL & { comparar: string[] }>({ ...INICIAL, comparar: [] });
  return <CatalogoVeiculos ofertas={lista} abrir={() => undefined} estado={estado as never} mudar={p => setEstado(x => ({ ...x, ...(p as object) }) as never)} />;
}

afterEach(() => cleanup());

describe('VIDA 36 · vitrine de veículos na tela', () => {
  it('a marca vira um filtro com as marcas da loja', () => {
    const lista = ofertas();
    const { container } = render(<Tela lista={lista} />);
    const marca = container.querySelector('select[id]') as HTMLSelectElement;
    expect(marca.options.length).toBeGreaterThan(2);
  });

  it('comparar até três mostra a tabela; o quarto fica bloqueado', () => {
    const lista = ofertas();
    const { container, getAllByRole, queryByLabelText } = render(<Tela lista={lista} />);
    const caixas = () => Array.from(container.querySelectorAll('input[type="checkbox"]')) as HTMLInputElement[];
    expect(queryByLabelText('Comparação de veículos')).toBeNull();
    fireEvent.click(caixas()[0]); fireEvent.click(caixas()[1]);
    expect(queryByLabelText('Comparação de veículos')).not.toBeNull();
    fireEvent.click(caixas()[2]);
    expect(caixas().filter(c => c.checked).length).toBe(3);
    expect(caixas()[3].disabled).toBe(true);
    expect(getAllByRole('table')[0].querySelectorAll('thead th').length).toBe(4);
  });
});
