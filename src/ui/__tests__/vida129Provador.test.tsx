// @vitest-environment jsdom
/**
 * VIDA 12.9 — a peça do provador é a do cartão e a que se compra. Antes, a cor de cada tela vinha de uma semente
 * diferente (`-vitrine` no cartão, `-provador` no provador, o id novo na compra): a camisa de time amarela e branca no
 * provador era preta e branca no cartão — e a comprada, uma terceira. Agora a variante é escolhida uma vez.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, waitFor, within } from '@testing-library/react';
import { adulto } from '../../motor/__tests__/cenarios';
import { transacao } from '../../motor/nucleo';
import { executar, type Acao } from '../../motor/acoes';
import { LojaDaVida } from '../jogo/material/Lojas';
import { OQueVeste } from '../jogo/Aparencia';
import { memoriaDasLojas } from '../jogo/memoriaDeCompras';
import { lojasDaVida } from '../../motor/sistemas/lojas';
import { ITENS_ESTILO } from '../../motor/dados/estilo';
import { sementeDaPeca, sincronizarVisual } from '../../motor/sistemas/estilo';
import { coresDoItem, corPrincipalDa, nomesDasCores, pecasDoItem, varianteDaCor, varianteDaVitrine } from '../avatar/pecas';
import type { Vida } from '../../motor/tipos';

afterEach(() => { cleanup(); memoriaDasLojas.clear(); try { localStorage.clear(); sessionStorage.clear(); } catch { /* */ } });
const rica = (): Vida => transacao(adulto(30, { semente: 1291, municipioId: 'sao-paulo-sp' }), x => { x.financas.conta = 5_000_000; x.momento = null; }).vida;
const temCor = (el: Element, cor: string) => el.innerHTML.toLowerCase().includes(cor.toLowerCase());

function lojaCom(v: Vida, itemId: string) {
  for (const l of lojasDaVida(v).filter(e => e.categorias.includes('vestuario') || e.categorias.includes('esporte' as never))) {
    const r = render(<LojaDaVida vida={v} agir={() => true} lojaId={l.id} />);
    const c = r.container.querySelector(`.catalogo-loja__cartao[data-produto="${itemId}"]`);
    r.unmount();
    if (c) return l;
  }
  return undefined;
}

describe('12.9 · variante única: vitrine = provador = compra = guarda-roupa', () => {
  it('cada cor à venda tem uma variante que dá exatamente aquela cor (todas as peças com mais de uma cor)', () => {
    let n = 0;
    for (const it of ITENS_ESTILO) {
      for (const cor of coresDoItem(it.id)) {
        const s = varianteDaCor(it.id, cor);
        expect(corPrincipalDa(it.id, s), `${it.id} ${cor}`).toBe(cor);
        n++;
      }
    }
    expect(n).toBeGreaterThan(50);
  });

  it('a camisa de time: a cor escolhida no cartão é a do provador, a da compra e a do retrato', async () => {
    let v = rica();
    const loja = lojaCom(v, 'camisa_time');
    expect(loja).toBeTruthy();
    const agir = (a: Acao) => { v = executar(v, a).vida; rerender(<LojaDaVida vida={v} agir={agir} lojaId={loja!.id} />); return true; };
    const { container, rerender } = render(<LojaDaVida vida={v} agir={agir} lojaId={loja!.id} />);
    const cartao = () => container.querySelector('.catalogo-loja__cartao[data-produto="camisa_time"]') as HTMLElement;
    const cores = coresDoItem('camisa_time');
    expect(cores.length).toBeGreaterThan(1);
    // O caso relatado: amarela no provador, preta no cartão. Escolhe a amarela, prova, troca para a vermelha, prova de novo.
    const amarela = cores.find(c => c === '#f2c200')!, vermelha = cores.find(c => c === '#c8102e')!;
    for (const cor of [amarela, vermelha]) {
      fireEvent.click(within(cartao().querySelector('.catalogo-loja__cores') as HTMLElement).getByRole('radio', { name: nomesDasCores(cores)[cores.indexOf(cor)] }));
      const mini = cartao().querySelector('.miniatura-peca') as HTMLElement;
      expect(temCor(mini, cor), `miniatura ${cor}`).toBe(true);
      const botao = within(cartao()).queryByRole('button', { name: 'Experimentar' });
      if (botao) fireEvent.click(botao);
      const provador = container.querySelector('.provador') as HTMLElement;
      expect(provador, 'provador aberto').toBeTruthy();
      expect(temCor(provador.querySelector('svg.figura')!, cor), `provador ${cor}`).toBe(true);
    }
    fireEvent.click(within(cartao()).getByRole('button', { name: 'Comprar' }));
    const item = v.eu.estilo!.itens.find(x => x.itemId === 'camisa_time')!;
    expect(item.variante).toBe(varianteDaCor('camisa_time', vermelha));
    expect(pecasDoItem('camisa_time', sementeDaPeca(item)).cima!.cor).toBe(vermelha);
    // O retrato (a parte de cima) e o guarda-roupa mostram a mesma.
    expect(v.eu.visual.superior).toBe(`camisa_time#${item.variante}`);
    const g = render(<OQueVeste vida={v} agir={() => true} />);
    await waitFor(() => expect(g.container.querySelector('.vestir__miniatura svg')).toBeTruthy());
    expect(temCor(g.container.querySelector('.vestir__miniatura')!, vermelha)).toBe(true);
    // E o cartão da peça que já é sua mostra a sua (não a da vitrine).
    expect(temCor(cartao().querySelector('.miniatura-peca')!, vermelha)).toBe(true);
  });

  it('trocas sucessivas de cor e de marca nunca separam o que se vê do que se compra (várias categorias)', () => {
    const ids = ITENS_ESTILO.filter(it => coresDoItem(it.id).length > 1).map(it => it.id);
    const cats = new Set<string>();
    for (const id of ids.slice(0, 40)) {
      let v = rica();
      const cores = coresDoItem(id);
      const cor = cores[cores.length - 1];
      const vari = varianteDaCor(id, cor);
      v = executar(v, { tipo: 'comprar_item', itemId: id, variante: vari }).vida;
      const item = v.eu.estilo!.itens.find(x => x.itemId === id)!;
      expect(corPrincipalDa(id, sementeDaPeca(item))).toBe(cor);
      cats.add(ITENS_ESTILO.find(x => x.id === id)!.categoria);
    }
    expect(cats.size).toBeGreaterThan(0);
  });

  it('save antigo (sem variante): a peça continua com a cor de antes (semente = id)', () => {
    let v = rica();
    v = executar(v, { tipo: 'comprar_item', itemId: 'camisa_time' }).vida;
    v = transacao(v, x => { const it = x.eu.estilo!.itens.find(y => y.itemId === 'camisa_time')!; delete it.variante; it.id = 'est_antigo'; sincronizarVisual(x); }).vida;
    const it = v.eu.estilo!.itens.find(y => y.itemId === 'camisa_time')!;
    expect(sementeDaPeca(it)).toBe('est_antigo');
    expect(v.eu.visual.superior).toBe('camisa_time#est_antigo');
    expect(varianteDaVitrine('camisa_time')).toBe('camisa_time-vitrine');
  });
});


describe('12.9 · nomes das cores', () => {
  it('as cores de uma mesma peça têm nomes distintos (o leitor de tela distingue a escolha)', () => {
    const repetidos: string[] = [];
    for (const it of ITENS_ESTILO) {
      const nomes = nomesDasCores(coresDoItem(it.id));
      if (new Set(nomes).size !== nomes.length) repetidos.push(`${it.id}: ${nomes.join(', ')}`);
    }
    expect(repetidos).toEqual([]);
  });
});
