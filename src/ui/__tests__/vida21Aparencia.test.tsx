// @vitest-environment jsdom
/**
 * VIDA 21 · bolsas, mochilas e acessórios na Aparência: o que se compra aparece na parte certa, é a peça comprada, dá
 * para levar e guardar, sobrevive a recarregar o jogo e sai de cena quando é doado.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import { adulto } from '../../motor/__tests__/cenarios';
import { transacao } from '../../motor/nucleo';
import { executar, type Acao } from '../../motor/acoes';
import { exportarVida, importarVida } from '../../motor/save';
import { OQueVeste } from '../jogo/Aparencia';
import { ITENS_ESTILO, itemEstilo, lugaresDoItem } from '../../motor/dados/estilo';
import { acessorioDoItem } from '../avatar/pecas';
import { vinculosVivos } from '../../motor/nucleo';
import type { Vida } from '../../motor/tipos';

afterEach(() => cleanup());
const rica = (): Vida => transacao(adulto(30, { semente: 2101, municipioId: 'sao-paulo-sp' }), x => { x.financas.conta = 500_000; x.momento = null; }).vida;
const BOLSAS = ITENS_ESTILO.filter(x => x.lugar === 'bolsa').map(x => x.id);

describe('VIDA 21 · bolsas e mochilas na Aparência', () => {
  it('toda peça equipável do catálogo tem uma parte na Aparência (nenhuma categoria some depois de comprada)', () => {
    let v = rica();
    // Uma de cada lugar (os piercings têm seção própria).
    const porLugar = new Map<string, string>();
    for (const it of ITENS_ESTILO) if (!it.piercing && it.preco < 30000) { const l = lugaresDoItem(it).join('+'); if (!porLugar.has(l)) porLugar.set(l, it.id); }
    for (const id of porLugar.values()) v = executar(v, { tipo: 'comprar_item', itemId: id }).vida;
    const { container } = render(<OQueVeste vida={v} agir={() => true} />);
    const partes = [...container.querySelectorAll('[data-parte]')].map(x => x.getAttribute('data-parte'));
    expect(partes).toContain('bolsa');
    // Só o que de fato virou seu (os óculos de grau, por exemplo, pedem receita).
    const meus = [...porLugar.values()].filter(id => v.eu.estilo!.itens.some(x => x.itemId === id));
    expect(meus.length).toBeGreaterThanOrEqual(12);
    for (const id of meus) {
      const it = itemEstilo(id)!;
      const n = it.nome.toLowerCase();
      const achou = [...container.querySelectorAll('[data-parte]')].some(p => (p.textContent ?? '').toLowerCase().includes(n));
      expect(achou, `${id} (${lugaresDoItem(it).join(',')}) não aparece`).toBe(true);
    }
  });

  it('cada bolsa comprada aparece com o próprio nome, dá para trocar, guardar, e o desenho é o do produto', () => {
    let v = rica();
    for (const id of BOLSAS) v = executar(v, { tipo: 'comprar_item', itemId: id }).vida;
    const agir = (a: Acao) => { v = executar(v, a).vida; rerender(<OQueVeste vida={v} agir={agir} />); return true; };
    const { container, rerender } = render(<OQueVeste vida={v} agir={agir} />);
    const parte = () => container.querySelector('[data-parte="bolsa"]') as HTMLElement;
    expect(parte()).toBeTruthy();
    // Uma de cada vez: a última comprada está em uso, as outras guardadas e escolhíveis.
    expect(v.eu.estilo!.itens.filter(x => x.usando && BOLSAS.includes(x.itemId))).toHaveLength(1);
    for (const alvo of ['mochila', 'clutch', 'bolsa_grife']) {
      const peca = v.eu.estilo!.itens.find(x => x.itemId === alvo)!;
      const sel = within(parte()).queryByLabelText('Trocar por') as HTMLSelectElement | null;
      if (sel) fireEvent.change(sel, { target: { value: peca.id } });
      const botao = within(parte()).getAllByRole('button').find(b => /^Levar/.test(b.textContent ?? ''));
      if (!v.eu.estilo!.itens.find(x => x.id === peca.id)!.usando) fireEvent.click(botao!);
      expect(v.eu.estilo!.itens.filter(x => x.usando && BOLSAS.includes(x.itemId)).map(x => x.itemId)).toEqual([alvo]);
      expect(within(parte()).getByText(itemEstilo(alvo)!.nome)).toBeTruthy();
      // O desenho em uso é o do produto (a mochila é mochila, a clutch é clutch).
      expect(acessorioDoItem(alvo)?.parte).toBe('bolsa');
    }
    fireEvent.click(within(parte()).getByRole('button', { name: 'Guardar' }));
    expect(v.eu.estilo!.itens.some(x => x.usando && BOLSAS.includes(x.itemId))).toBe(false);
    // Guardada continua sua.
    expect(v.eu.estilo!.itens.filter(x => BOLSAS.includes(x.itemId))).toHaveLength(BOLSAS.length);
  });

  it('a bolsa em uso sobrevive a salvar e recarregar; doada, sai do inventário e do corpo', () => {
    let v = rica();
    v = executar(v, { tipo: 'comprar_item', itemId: 'mochila' }).vida;
    v = executar(v, { tipo: 'comprar_item', itemId: 'oculos_sol' }).vida;
    v = executar(v, { tipo: 'usar_item', itemId: 'mochila', usar: true }).vida;
    v = executar(v, { tipo: 'usar_item', itemId: 'oculos_sol', usar: true }).vida;
    const l = importarVida(exportarVida(v));
    if (l.tipo !== 'ok') throw new Error(l.tipo);
    const w = l.vida;
    expect(w.eu.estilo!.itens.find(x => x.itemId === 'mochila')!.usando).toBe(true);
    const { container } = render(<OQueVeste vida={w} agir={() => true} />);
    expect(within(container.querySelector('[data-parte="bolsa"]') as HTMLElement).getByText('Mochila')).toBeTruthy();
    // Doar: em uso não dá (a regra de sempre); guardada, sai do inventário e a parte some da Aparência.
    const amigo = vinculosVivos(w).find(x => !x.p.especie)!;
    const mo = w.eu.estilo!.itens.find(x => x.itemId === 'mochila')!;
    const doar = { tipo: 'personalizar', op: { o: 'doar', ref: { tipo: 'estilo', id: mo.id }, pessoaId: amigo.p.id } } as Acao;
    expect(executar(w, doar).vida.eu.estilo!.itens.some(x => x.itemId === 'mochila')).toBe(true);
    const guardada = executar(w, { tipo: 'usar_item', itemId: 'mochila', id: mo.id, usar: false }).vida;
    const d = executar(guardada, doar).vida;
    expect(d.eu.estilo!.itens.some(x => x.itemId === 'mochila')).toBe(false);
    cleanup();
    const r2 = render(<OQueVeste vida={d} agir={() => true} />);
    expect(r2.container.querySelector('[data-parte="bolsa"]')).toBeNull();
  });
});
