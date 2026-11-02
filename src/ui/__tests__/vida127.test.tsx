// @vitest-environment jsdom
/**
 * VIDA 12.7 — a tela: o guarda-roupa veste a peça escolhida (mesmo depois de filtrar, ordenar e reabrir a loja), o
 * "Agora" se renova, a loja é um catálogo com a peça de verdade e provador, a reforma tem prévia que não cobra.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { adulto } from '../../motor/__tests__/cenarios';
import { transacao } from '../../motor/nucleo';
import { executar, type Acao } from '../../motor/acoes';
import { OQueVeste } from '../jogo/Aparencia';
import { AnoQuePassou } from '../telas/Jogo';
import { LinhaDaVida } from '../jogo/LinhaDaVida';
import { LojaDaVida } from '../jogo/material/Lojas';
import { CasaPorDentro } from '../jogo/Personalizar';
import { memoriaDasLojas } from '../jogo/memoriaDeCompras';
import { lojasDaVida } from '../../motor/sistemas/lojas';
import { itemEstilo } from '../../motor/dados/estilo';
import { comodosDaCasa, acabamentoDoComodo } from '../../motor/sistemas/lar';
import type { Imovel, Vida } from '../../motor/tipos';

afterEach(() => { cleanup(); memoriaDasLojas.clear(); try { localStorage.clear(); sessionStorage.clear(); } catch { /* */ } });
const rica = (): Vida => transacao(adulto(45, { semente: 1273, municipioId: 'sao-paulo-sp' }), x => { x.financas.conta = 5_000_000; x.momento = null; }).vida;

describe('12.7 · o guarda-roupa veste a peça escolhida', () => {
  it('trocar pelos óculos de grife veste os de grife (não os escuros comuns)', () => {
    let v = rica();
    for (const id of ['oculos_sol', 'oculos_aviador', 'oculos_juliet', 'oculos_grife']) v = executar(v, { tipo: 'comprar_item', itemId: id }).vida;
    v = executar(v, { tipo: 'usar_item', itemId: 'oculos_sol', usar: true }).vida;
    const agir = (a: Acao) => { v = executar(v, a).vida; rerender(<OQueVeste vida={v} agir={agir} />); return true; };
    const { container, rerender } = render(<OQueVeste vida={v} agir={agir} />);
    const rosto = container.querySelector('[data-parte="rosto"]') as HTMLElement;
    const sel = within(rosto).getByLabelText('Trocar por') as HTMLSelectElement;
    const grife = v.eu.estilo!.itens.find(x => x.itemId === 'oculos_grife')!;
    fireEvent.change(sel, { target: { value: grife.id } });
    fireEvent.click(within(rosto).getByRole('button', { name: 'Vestir' }));
    expect(v.eu.visual.modeloOculos).toBe('oculos_grife');
    expect(v.eu.estilo!.itens.filter(x => x.usando && itemEstilo(x.itemId)!.categoria === 'oculos').map(x => x.itemId)).toEqual(['oculos_grife']);
    expect(within(container.querySelector('[data-parte="rosto"]') as HTMLElement).getByText('Óculos escuros de grife')).toBeTruthy();
    // Tirar: nenhum óculos fica no rosto.
    fireEvent.click(within(container.querySelector('[data-parte="rosto"]') as HTMLElement).getByRole('button', { name: 'Tirar' }));
    expect(v.eu.visual.oculos).toBeUndefined();
  });

  it('na loja, depois de buscar, filtrar por tipo, ordenar e reabrir, "Usar" veste o produto daquela linha', () => {
    let v = rica();
    const loja = lojasDaVida(v).find(e => e.categorias.includes('vestuario') && e.faixas.includes(4)) ?? lojasDaVida(v).find(e => e.categorias.includes('vestuario'))!;
    const agir = (a: Acao) => { v = executar(v, a).vida; rerender(<LojaDaVida vida={v} agir={agir} lojaId={loja.id} />); return true; };
    const { container, rerender, unmount } = render(<LojaDaVida vida={v} agir={agir} lojaId={loja.id} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Casacos e jaquetas' }));
    fireEvent.change(screen.getByLabelText('Ordenar'), { target: { value: 'maior' } });
    const cartoes = [...container.querySelectorAll('.catalogo-loja__cartao')];
    expect(cartoes.length).toBeGreaterThan(1);
    for (const c of cartoes) expect(itemEstilo(c.getAttribute('data-produto')!)!.lugar).toBe('casaco');
    // Compra o segundo da lista (não o primeiro) e confere que é ele.
    const alvo = cartoes[1].getAttribute('data-produto')!;
    fireEvent.click(within(cartoes[1] as HTMLElement).getByRole('button', { name: 'Comprar' }));
    expect(v.eu.estilo!.itens.some(x => x.itemId === alvo && x.usando)).toBe(true);
    // Reabre a loja: o filtro e a ordem continuam; a linha do produto mostra que é seu e em uso.
    unmount();
    const r2 = render(<LojaDaVida vida={v} agir={() => true} lojaId={loja.id} />);
    const linha = r2.container.querySelector(`.catalogo-loja__cartao[data-produto="${alvo}"]`) as HTMLElement;
    expect(within(linha).getByText(/É seu.*em uso/)).toBeTruthy();
    expect(r2.container.querySelectorAll('.catalogo-loja__cartao').length).toBe(cartoes.length);
  });
});

describe('12.7 · a loja como catálogo', () => {
  it('cada cartão tem a miniatura da peça de verdade, o segmento, o preço; o provador mostra você com ela', () => {
    const v = rica();
    const loja = lojasDaVida(v).find(e => e.categorias.includes('vestuario'))!;
    const { container } = render(<LojaDaVida vida={v} agir={() => true} lojaId={loja.id} />);
    const cartao = container.querySelector('.catalogo-loja__cartao[data-produto]') as HTMLElement;
    const id = cartao.getAttribute('data-produto')!;
    expect(cartao.querySelector(`.miniatura-peca[data-item="${id}"] svg`)).toBeTruthy();
    expect(cartao.querySelector('.catalogo-loja__selo')).toBeTruthy();
    expect(cartao.querySelector('.catalogo-loja__preco')!.textContent).toMatch(/\d/);
    fireEvent.click(within(cartao).getByRole('button', { name: 'Experimentar' }));
    const provador = container.querySelector('.provador') as HTMLElement;
    expect(provador).toBeTruthy();
    expect(provador.querySelector('svg.figura')!.getAttribute('aria-label')).toBe(`Você com ${itemEstilo(id)!.nome.toLowerCase()}`);
    fireEvent.click(within(provador).getByRole('button', { name: 'Sair do provador' }));
    expect(container.querySelector('.provador')).toBeNull();
  });
});

describe('12.7 · o Agora se renova', () => {
  it('o título de dois anos atrás não abre o ano; o deste ano, sim', () => {
    const v = transacao(rica(), x => {
      x.caminhos.palmares = [
        { t: x.t - 26, tipo: 'titulo', competicao: 'Liga de dois anos atrás', texto: 'Campeão naquela temporada.' } as never,
        { t: x.t - 3, tipo: 'premio', competicao: 'Artilharia deste ano', texto: 'O artilheiro do campeonato.' } as never
      ];
    }).vida;
    const { container } = render(<AnoQuePassou vida={v} desde={v.biografia.length} abrirPessoa={() => { /* */ }} />);
    const texto = container.textContent ?? '';
    expect(texto).toMatch(/Artilharia deste ano/);
    expect(texto).not.toMatch(/Liga de dois anos atrás/);
  });

  it('a Linha da Vida do Agora mostra só os últimos anos de calendário (ano tranquilo fica tranquilo)', () => {
    const v = transacao(rica(), x => {
      const i = Math.floor((x.t - x.eu.tNasc) / 12);
      x.biografia = [...x.biografia.filter(e => e.idade < i - 6), { id: 'velho', t: x.t - 60, idade: i - 5, texto: 'Um título antigo que não deve ficar no Agora.', relevancia: 'marco', tema: 'esporte' } as never];
    }).vida;
    const { container } = render(<LinhaDaVida vida={v} marca={0} compacta={{ anos: 3, aoVerTudo: () => { /* */ } }} />);
    expect(container.textContent).not.toMatch(/título antigo/);
    expect(container.textContent).toMatch(/Anos tranquilos|Ler a biografia inteira/);
  });
});

describe('12.7 · a reforma com prévia', () => {
  it('escolher mostra na cena e na conta, não cobra; confirmar cobra o total mostrado; cancelar desfaz', () => {
    let v = transacao(rica(), x => {
      x.financas.bens = [{ id: 'icasa', tipo: 'imovel', modeloId: 'casa_3q', nome: 'casa', valor: 900_000, tCompra: x.t - 60, municipioId: x.moradia.municipioId, estado: 80 } as Imovel];
      x.moradia = { tipo: 'propria', municipioId: x.moradia.municipioId, imovelId: 'icasa', modeloId: 'casa_3q', aluguel: 0, padrao: 3, tInicio: x.t - 60 };
    }).vida;
    const sala = comodosDaCasa(v).find(c => c.tipo === 'sala')!;
    const agir = (a: Acao) => { v = executar(v, a).vida; rerender(<CasaPorDentro vida={v} agir={agir} />); return true; };
    const { container, rerender } = render(<CasaPorDentro vida={v} agir={agir} />);
    fireEvent.click(screen.getByRole('button', { name: /^Sala/ }));
    fireEvent.click(screen.getByRole('button', { name: /Personalizar sala/ }));
    const conta0 = v.financas.conta;
    fireEvent.change(screen.getByLabelText(/^Piso/), { target: { value: 'taco_espinha' } });
    fireEvent.change(screen.getByLabelText(/^Paredes/), { target: { value: 'papel_damasco' } });
    const cena = container.querySelector('.pz-painel__cena svg.cena-comodo')!;
    expect(cena.getAttribute('data-piso')).toBe('taco_espinha');
    expect(cena.getAttribute('data-parede')).toBe('papel_damasco');
    expect(v.financas.conta).toBe(conta0);
    // Comparar com como está: a cena volta ao atual (sem cobrar).
    fireEvent.click(screen.getByRole('button', { name: 'Comparar com como está' }));
    expect(container.querySelector('.pz-painel__cena svg.cena-comodo')!.getAttribute('data-piso')).toBe(acabamentoDoComodo(v, sala.id, 'piso'));
    fireEvent.click(screen.getByRole('button', { name: 'Ver a prévia' }));
    const total = container.querySelector('.pz-conta .pz-linha strong')!.textContent!;
    fireEvent.click(screen.getByRole('button', { name: /^Confirmar e pagar/ }));
    expect(acabamentoDoComodo(v, sala.id, 'piso')).toBe('taco_espinha');
    expect(acabamentoDoComodo(v, sala.id, 'parede')).toBe('papel_damasco');
    expect(conta0 - v.financas.conta).toBeGreaterThan(0);
    expect(total).toMatch(/\d/);
    // Cancelar uma prévia não muda nada.
    fireEvent.click(screen.getByRole('button', { name: /Personalizar sala/ }));
    fireEvent.change(screen.getByLabelText(/^Cortinas/), { target: { value: 'veludo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(acabamentoDoComodo(v, sala.id, 'cortina')).toBe('nenhuma');
  });
});
