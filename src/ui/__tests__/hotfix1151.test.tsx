// @vitest-environment jsdom
/**
 * HOTFIX 11.5.1 — a interface: Compras (segmentos, busca, filtros, ordem, comprar sem perder o lugar, a memória da
 * aba e da loja), o estúdio de tatuagem, a figura (contraste, tatuagens na pele, de costas), a tabela do campeonato.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { adulto } from '../../motor/__tests__/cenarios';
import { transacao } from '../../motor/nucleo';
import { executar, type Acao } from '../../motor/acoes';
import type { Vida } from '../../motor/tipos';
import { Compras, precarregarCompras } from '../jogo/Compras';
import { LojaDaVida } from '../jogo/material/Lojas';
import { BuscaDeCompras } from '../jogo/material/BuscaDeCompras';
import { EstudioDeTatuagem } from '../jogo/Tatuagens';
import { Figura } from '../avatar/Figura';
import { TabelaDoCampeonato, CampeoesDoPais } from '../jogo/Campeonato';
import { estadoDeCompras, guardarCompras, limparCompras, memoriaDasLojas } from '../jogo/memoriaDeCompras';

// HOTFIX 11.5.1: a busca e os segmentos de Compras chegam sob demanda.
beforeAll(async () => { await precarregarCompras(); });
import { ligaDe } from '../../motor/sistemas/ligas';

const rica = (): Vida => transacao(adulto(30, { semente: 11511, municipioId: 'sao-paulo-sp' }), x => { x.financas.conta = 900_000; x.momento = null; }).vida;
beforeEach(() => limparCompras());
afterEach(() => { cleanup(); limparCompras(); });

describe('HOTFIX 11.5.1 · Compras', () => {
  it('a busca acha em todas as lojas, filtra pela marca e pelo preço, e ordena', () => {
    const v = rica();
    const est = () => estadoDeCompras();
    const mudar = (x: Parameters<typeof guardarCompras>[0]) => { guardarCompras(x); rerender(<BuscaDeCompras vida={v} agir={() => true} abrir={() => {}} estado={est()} mudar={mudar} />); };
    const { rerender, container } = render(<BuscaDeCompras vida={v} agir={() => true} abrir={() => {}} estado={est()} mudar={mudar} />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'tenis' } });
    const nomes = () => [...container.querySelectorAll('.busca-compras__item strong')].map(x => x.textContent ?? '');
    expect(nomes().length).toBeGreaterThan(2);
    expect(nomes()[0]).toMatch(/^Tênis/);
    expect(screen.getByText(/produtos em \d+ lojas/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Marca'), { target: { value: 'nike' } });
    expect([...container.querySelectorAll('.busca-compras__onde')].every(x => /^Nike/.test(x.textContent ?? ''))).toBe(true);
    fireEvent.change(screen.getByLabelText('Ordenar'), { target: { value: 'maior' } });
    const precos = [...container.querySelectorAll('.busca-compras__item > .oferta__preco')].map(x => Number((x.textContent ?? '').replace(/\D/g, '')));
    expect(precos).toEqual([...precos].sort((a, b) => b - a));
    // Uma loja pelo nome vira atalho.
    fireEvent.change(screen.getByLabelText('Marca'), { target: { value: '' } });
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'ótica' } });
    expect(within(container.querySelector('.busca-compras__lojas') as HTMLElement).getByRole('button', { name: 'Ótica' })).toBeTruthy();
  });

  it('comprar pelo resultado manda a loja e a marca da oferta; depois da compra, a busca, os filtros e a ordem continuam', async () => {
    let v = rica();
    const acoes: Acao[] = [];
    const agir = (a: Acao) => { acoes.push(a); v = executar(v, a).vida; rerender(<Compras vida={v} agir={agir} abrir={() => {}} />); return true; };
    const { rerender, container } = render(<Compras vida={v} agir={agir} abrir={() => {}} />);
    // A busca vem sob demanda (o pacote do jogo não cresce).
    fireEvent.change(await screen.findByRole('searchbox', {}, { timeout: 8000 }), { target: { value: 'violão' } });
    fireEvent.change(screen.getByLabelText('Ordenar'), { target: { value: 'menor' } });
    const antes = [...container.querySelectorAll('.busca-compras__item')].map(x => x.getAttribute('data-produto'));
    const item = container.querySelector('.busca-compras__item[data-produto="violao"]') as HTMLElement;
    fireEvent.click(within(item).getByRole('button', { name: 'Comprar' }));
    expect(acoes[0]).toMatchObject({ tipo: 'comprar_coisa', coisaId: 'violao' });
    expect((acoes[0] as { loja?: string }).loja).toBeTruthy();
    expect(v.financas.coisas?.some(c => c.coisaId === 'violao')).toBe(true);
    // A mesma lista, na mesma ordem, com o comprado marcado.
    expect((screen.getByRole('searchbox') as HTMLInputElement).value).toBe('violão');
    expect((screen.getByLabelText('Ordenar') as HTMLSelectElement).value).toBe('menor');
    expect([...container.querySelectorAll('.busca-compras__item')].map(x => x.getAttribute('data-produto'))).toEqual(antes);
    expect(within(container.querySelector('.busca-compras__item[data-produto="violao"]') as HTMLElement).getByText('É seu.')).toBeTruthy();
  });

  it('o segmento escolhido sobrevive a sair da aba e voltar; outra vida começa do começo; o mapa abre o segmento pedido', () => {
    const v = rica();
    const { unmount } = render(<Compras vida={v} agir={() => true} abrir={() => {}} />);
    fireEvent.click(within(document.querySelector('.compras__segmentos') as HTMLElement).getByRole('button', { name: 'Tecnologia' }));
    expect(screen.getByRole('heading', { name: 'Tecnologia' })).toBeTruthy();
    unmount();
    render(<Compras vida={v} agir={() => true} abrir={() => {}} />);
    expect(screen.getByRole('heading', { name: 'Tecnologia' })).toBeTruthy();
    expect(within(document.querySelector('.compras__segmentos') as HTMLElement).getByRole('button', { name: 'Tecnologia' }).getAttribute('aria-current')).toBe('page');
    cleanup();
    const outra = transacao(adulto(30, { semente: 99 }), x => { x.id = 'outra-vida'; }).vida;
    render(<Compras vida={outra} agir={() => true} abrir={() => {}} />);
    expect(document.querySelector('.compras-inicio')).toBeTruthy();
    cleanup();
    guardarCompras({ segmento: 'veiculos', deFora: true });
    render(<Compras vida={v} agir={() => true} abrir={() => {}} />);
    expect(screen.getByRole('button', { name: /Concessionária/ })).toBeTruthy();
  });

  it('no segmento de moda, a categoria filtra as lojas (a ótica some quando se escolhe Calçados)', () => {
    const v = rica();
    render(<Compras vida={v} agir={() => true} abrir={() => {}} />);
    fireEvent.click(within(document.querySelector('.compras__segmentos') as HTMLElement).getByRole('button', { name: 'Moda e acessórios' }));
    expect(screen.getByRole('button', { name: /^Ótica/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('radio', { name: 'Calçados' }));
    expect(screen.queryByRole('button', { name: /^Ótica/ })).toBeNull();
    expect(screen.getByRole('button', { name: /Sapataria/ })).toBeTruthy();
  });

  it('dentro da loja: buscar, filtrar pela marca, ordenar — e a loja lembra ao fechar e abrir de novo', () => {
    const v = rica();
    const { container, unmount } = render(<LojaDaVida vida={v} agir={() => true} lojaId="sapataria" />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'tênis' } });
    const nomes = () => [...container.querySelectorAll('.loja-vida__produto strong')].map(x => x.textContent ?? '');
    expect(nomes().length).toBeGreaterThan(0);
    expect(nomes().every(n => /tênis/i.test(n))).toBe(true);
    fireEvent.change(screen.getByLabelText('Ordenar'), { target: { value: 'maior' } });
    unmount();
    expect(memoriaDasLojas.get('sapataria')?.texto).toBe('tênis');
    render(<LojaDaVida vida={v} agir={() => true} lojaId="sapataria" />);
    expect((screen.getByRole('searchbox') as HTMLInputElement).value).toBe('tênis');
    expect((screen.getByLabelText('Ordenar') as HTMLSelectElement).value).toBe('maior');
  });
});

describe('HOTFIX 11.5.1 · tatuagens e a figura', () => {
  it('o estúdio: a prévia mostra o desenho no lugar (de frente e de costas); tatuar e tirar são ações do motor', () => {
    let v = rica();
    const agir = (a: Acao) => { v = executar(v, a).vida; rerender(<EstudioDeTatuagem vida={v} agir={agir} />); return true; };
    const { rerender, container } = render(<EstudioDeTatuagem vida={v} agir={agir} />);
    const [frente, costas] = container.querySelectorAll('svg.figura');
    expect(frente.getAttribute('data-vista')).toBe('frente');
    expect(costas.getAttribute('data-vista')).toBe('costas');
    // A prévia (a primeira do catálogo: a andorinha, no braço) já aparece na pele.
    expect(frente.querySelector('[data-tatuagem="andorinha"]')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /^Tatuar/ }));
    expect(v.eu.tatuagens).toHaveLength(1);
    expect(screen.getByRole('button', { name: /Tirar no laser/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Tirar no laser/ }));
    expect(v.eu.tatuagens![0].removida).toBe(v.t);
    expect(screen.getByText(/saindo no laser/)).toBeTruthy();
  });

  it('a figura: cada tatuagem recortada pela própria parte do corpo; a das costas só aparece de costas; a pele tem contorno; sem fundo, o halo', () => {
    const vis = { pele: 'p1', cabelo: 'curto', corCabelo: 'loiro', olhos: 'azul' };
    const tat = [{ id: 'a', desenho: 'rosa_tradicional', local: 'antebraco' as const, lado: 'd' as const, anos: 2, clareou: 0 }, { id: 'b', desenho: 'dragao_costas', local: 'costas' as const, anos: 1, clareou: 0 }];
    const { container } = render(<><Figura visual={vis} genero="masculino" idade={30} corpo="mediano" pecas={[]} tatuagens={tat} semFundo /><Figura visual={vis} genero="masculino" idade={30} corpo="mediano" pecas={[]} tatuagens={tat} vista="costas" semCima /></>);
    const [f, c] = container.querySelectorAll('svg.figura');
    const rosa = f.querySelector('[data-tatuagem="rosa_tradicional"]')!;
    expect(rosa.getAttribute('clip-path')).toMatch(/^url\(#/);
    expect(f.querySelector(rosa.getAttribute('clip-path')!.slice(4, -1).replace(/^/, '')) ?? f.querySelector(`[id="${rosa.getAttribute('clip-path')!.slice(5, -1)}"]`)).toBeTruthy();
    expect(f.querySelector('[data-tatuagem="dragao_costas"]')).toBeNull();
    expect(c.querySelector('[data-tatuagem="dragao_costas"]')).toBeTruthy();
    // O contorno da pele clara (o braço não some no fundo claro) e o halo de quem vem sem fundo.
    expect([...f.querySelectorAll('path')].some(p => p.getAttribute('stroke') && p.getAttribute('fill') === '#f3d7c2')).toBe(true);
    expect(f.querySelector('ellipse[opacity="0.42"]')).toBeTruthy();
  });
});

describe('HOTFIX 11.5.1 · o campeonato', () => {
  it('a tabela mostra pontos, J, V, E, D, gols e saldo, com o clube em destaque e a legenda dos critérios; os campeões por ano', () => {
    let v = adulto(25, { semente: 3 });
    ligaDe(v, 'BR');
    for (let k = 0; k < 3; k++) v = transacao(v, x => { x.t += 12; }).vida;
    const linhas = ligaDe(v, 'BR').ultima!.tabelas![4]!;
    render(<><TabelaDoCampeonato vida={v} paisId="BR" nivel={4} destaque={linhas[2][0]} /><CampeoesDoPais vida={v} paisId="BR" /></>);
    const tabela = document.querySelector('.campeonato__tabela')!;
    expect([...tabela.querySelectorAll('th')].map(x => x.textContent)).toEqual(['#', 'Clube', 'P', 'J', 'V', 'E', 'D', 'GP', 'GC', 'SG']);
    expect(tabela.querySelectorAll('tbody tr')).toHaveLength(20);
    expect(tabela.querySelector('tr[aria-current="true"]')!.textContent).toContain(linhas[2][0]);
    expect(screen.getByText(/Desempate: pontos, vitórias, saldo de gols, gols marcados/)).toBeTruthy();
    expect(screen.getByRole('heading', { name: /Os campeões/ })).toBeTruthy();
  });
});
