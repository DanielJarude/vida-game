// @vitest-environment jsdom
/**
 * REWORK 12.4 — as telas da vida personalizada: ver primeiro, mexer só quando se pede.
 *   - a casa por dentro mostra o conforto e os cômodos; o painel do cômodo abre um de cada vez; os acabamentos só
 *     aparecem depois de "Personalizar"; ampliar fica recolhido;
 *   - Objetos tem dois modos (Usar | Organizar), nunca as duas listas juntas; o inventário busca, filtra e pagina;
 *   - a garagem personaliza um veículo de cada vez, com o estético separado do mecânico;
 *   - o guarda-roupa e a música ficam recolhidos/compactos.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { criarRng } from '../../motor/rng';
import { adulto } from '../../motor/__tests__/cenarios';
import { receberCoisa } from '../../motor/sistemas/coisas';
import type { Imovel, Veiculo, Vida } from '../../motor/tipos';
import { CasaPorDentro, GuardaRoupa, MusicaEArte, OrganizarObjetos, PersonalizarVeiculos } from '../jogo/Personalizar';
import { Patrimonio } from '../jogo/Patrimonio';

beforeEach(() => {
  localStorage.clear();
  window.scrollTo = () => {};
  const r = criarRng(20261031);
  vi.spyOn(Math, 'random').mockImplementation(() => r.next());
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function dona(modeloId = 'casa_3q'): Vida {
  const v = adulto(40, { semente: 7 });
  for (const vin of Object.values(v.vinculos)) vin.convivio = vin.convivio.filter(c => c !== 'casa');
  v.financas.conta = 3_000_000; v.financas.dividas = []; v.financas.coisas = []; v.financas.colecao = [];
  const casa: Imovel = { id: 'icasa', tipo: 'imovel', modeloId, nome: 'casa', valor: 900000, tCompra: v.t - 60, municipioId: v.moradia.municipioId, estado: 80 };
  v.financas.bens = [casa];
  v.moradia = { tipo: 'propria', municipioId: v.moradia.municipioId, imovelId: 'icasa', modeloId, aluguel: 0, padrao: 4, tInicio: v.t - 60 };
  v.momento = null; delete v.fila;
  return v;
}

describe('a casa por dentro', () => {
  it('mostra o conforto e os cômodos; o painel abre um cômodo por vez e a edição só depois do pedido', () => {
    const v = dona();
    receberCoisa(v, 'sofa', 3500);
    render(<CasaPorDentro vida={v} agir={() => true} />);
    expect(screen.getByRole('heading', { name: 'A casa por dentro' })).toBeTruthy();
    expect(screen.getByText(/conforto \d+ de 100/)).toBeTruthy();
    expect(screen.queryByText(/Piso · hoje/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /^Sala/ }));
    expect(screen.getByRole('region', { name: /Sala/ })).toBeTruthy();
    expect(screen.getByText('Sofá novo')).toBeTruthy();
    expect(screen.queryByText(/Piso · hoje/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Personalizar sala/ }));
    expect(screen.getByText(/Piso · hoje/)).toBeTruthy();
    // Outro cômodo fecha o primeiro.
    fireEvent.click(screen.getByRole('button', { name: /^Cozinha/ }));
    expect(screen.queryByRole('region', { name: /Sala/ })).toBeNull();
  });

  it('na kitnet há um cômodo só e nada de ampliar; na casa da família, nada aparece', () => {
    render(<CasaPorDentro vida={dona('kitnet')} agir={() => true} />);
    expect(within(screen.getByRole('list', { name: 'Os cômodos' })).getAllByRole('listitem').length).toBe(2);
    expect(screen.queryByText(/Ampliar a casa/)).toBeNull();
    cleanup();
    const crianca = adulto(40, { semente: 7 });
    crianca.moradia = { ...crianca.moradia, tipo: 'pais' };
    const { container } = render(<CasaPorDentro vida={crianca} agir={() => true} />);
    expect(container.textContent).toBe('');
  });
});

describe('os objetos', () => {
  it('Objetos tem dois modos e mostra um de cada vez', async () => {
    const v = dona();
    receberCoisa(v, 'violao', 900);
    receberCoisa(v, 'tv', 3500);
    render(<Patrimonio vida={v} agir={() => true} abrir={() => {}} parte="objetos" />);
    const organizar = screen.getByRole('radio', { name: /Organizar \(2\)/ });
    fireEvent.click(organizar);
    expect(await screen.findByRole('search')).toBeTruthy();
    expect(screen.queryByText('Para usar')).toBeNull();
  });

  it('o inventário busca, filtra, pagina de 12 em 12 e abre a ficha de um objeto por vez', () => {
    const v = dona();
    const ids = ['violao', 'tv', 'sofa', 'colchao', 'notebook', 'camera', 'livros', 'teclado', 'guitarra', 'bateria', 'videogame', 'tablet', 'piano', 'esteira', 'kit_academia'];
    for (const id of ids) receberCoisa(v, id, 1000);
    v.financas.coisas![0].local = `dep:${v.moradia.municipioId}`;
    render(<OrganizarObjetos vida={v} agir={() => true} />);
    expect(screen.getAllByRole('listitem').length).toBe(12);
    fireEvent.click(screen.getByRole('button', { name: /Mostrar mais \(3\)/ }));
    expect(screen.getAllByRole('listitem').length).toBe(15);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'viol' } });
    expect(screen.getAllByRole('listitem').length).toBe(1);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Onde'), { target: { value: 'guardado' } });
    expect(screen.getAllByRole('listitem').length).toBe(1);
    fireEvent.click(screen.getByRole('button', { name: /Violão/ }));
    expect(screen.getByText('De onde veio')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Guardar ou levar' })).toBeTruthy();
  });
});

describe('a garagem, a roupa e os gostos', () => {
  it('um veículo de cada vez; aparência separada da mecânica', () => {
    const v = dona();
    v.financas.bens.push({ id: 'vc', tipo: 'veiculo', modeloId: 'carro_sedan', nome: 'sedã', valor: 140000, tCompra: v.t, estado: 100 } as Veiculo);
    render(<PersonalizarVeiculos vida={v} agir={() => true} />);
    expect(screen.queryByText(/Pneus/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /sedã/i }));
    expect(screen.getByText(/Pintura · hoje/)).toBeTruthy();
    expect(screen.queryByText(/Pneus · hoje/)).toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: 'Mecânica' }));
    expect(screen.getByText(/Pneus · hoje/)).toBeTruthy();
    expect(screen.queryByText(/Pintura · hoje/)).toBeNull();
  });

  it('o guarda-roupa fica recolhido; a música mostra os preferidos e esconde o resto', () => {
    const v = dona();
    v.eu.estilo = { itens: [{ id: 'e1', itemId: 'moletom_oversized', t: v.t, preco: 260, usando: true }, { id: 'e2', itemId: 'calca_cargo', t: v.t, preco: 210, usando: true }] };
    const { container } = render(<GuardaRoupa vida={v} agir={() => true} />);
    expect(container.querySelector('details')!.hasAttribute('open')).toBe(false);
    expect(container.querySelector('summary')!.textContent).toMatch(/streetwear/i);
    cleanup();
    render(<MusicaEArte vida={v} agir={() => true} />);
    expect(screen.getByRole('heading', { name: 'Música e arte' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /playlist do ano/ })).toBeTruthy();
    expect(screen.getByText('Produzir uma obra').closest('details')!.hasAttribute('open')).toBe(false);
  });
});
