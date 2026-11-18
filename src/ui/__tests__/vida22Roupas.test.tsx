// @vitest-environment jsdom
/** VIDA 22 — as peças com construção própria, o acabamento da marca no desenho, o provador (combinação e comparação) e os looks por ocasião. */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { adulto } from '../../motor/__tests__/cenarios';
import { transacao } from '../../motor/nucleo';
import { executar } from '../../motor/acoes';
import type { Vida } from '../../motor/tipos';
import { ITENS_ESTILO } from '../../motor/dados/estilo';
import { ITENS_ESTILO_22 } from '../../motor/dados22/estilo/estilo22';
import { PECAS, construcaoDaPeca, materialDe } from '../avatar/pecas';
import { Figura } from '../avatar/Figura';
import { LojaDaVida } from '../jogo/material/Lojas';
import { limparCompras } from '../jogo/memoriaDeCompras';
import { ESTABELECIMENTOS } from '../../motor/dados/lojas';
import { ofertasDaLoja } from '../../motor/sistemas/lojas';
import { segmentoDaMarca } from '../../motor/sistemas/perfilDaMarca';

const base = (): Vida => transacao(adulto(28, { semente: 2202, municipioId: 'sao-paulo-sp' }), x => { x.financas.conta = 2_000_000; x.momento = null; }).vida;
const P = (op: object) => ({ tipo: 'personalizar', op } as never);
beforeEach(() => limparCompras());
afterEach(() => { cleanup(); limparCompras(); });

describe('VIDA 22 · cada peça com a sua construção', () => {
  it('nenhuma peça de vestir tem a mesma silhueta de outra (só a cor mudando)', () => {
    const sig = (p: object) => JSON.stringify(Object.fromEntries(Object.entries(p).filter(([k]) => !['cor', 'cor2'].includes(k)).sort()));
    const vistos = new Map<string, string>();
    const repetidas: string[] = [];
    for (const it of ITENS_ESTILO) {
      const p = PECAS[it.id] as Record<string, unknown> | undefined;
      if (!p || !('parte' in p) || !['cima', 'baixo', 'inteira', 'casaco'].includes(p.parte as string)) continue;
      const s = sig(p) + '|' + (materialDe(it.id) ?? '');
      if (vistos.has(s)) repetidas.push(`${vistos.get(s)} = ${it.id}`); else vistos.set(s, it.id);
    }
    expect(repetidas).toEqual([]);
  });
  it('as básicas novas têm desenho, entram no catálogo e se descrevem de jeitos diferentes', () => {
    const textos = new Set<string>();
    for (const it of ITENS_ESTILO_22) {
      expect(PECAS[it.id], it.id).toBeTruthy();
      expect(ITENS_ESTILO.some(x => x.id === it.id)).toBe(true);
      const t = construcaoDaPeca(it.id).join(' · ');
      expect(t.length, it.id).toBeGreaterThan(5);
      textos.add(t);
    }
    expect(textos.size).toBe(ITENS_ESTILO_22.length);
  });
  it('a marca premium/luxo aparece no desenho (pesponto e etiqueta); a econômica, não', () => {
    const fig = (marca?: string) => render(<Figura visual={{ pele: 'p3', cabelo: 'curto', corCabelo: 'preto', olhos: 'castanho' } as never} genero="masculino" idade={30} corpo="mediano" pecas={[{ itemId: 'camiseta_pima', id: 'a', marca }]} largura={160} />).container;
    expect(fig('gucci').querySelector('[data-acabamento]')).toBeTruthy();
    cleanup();
    expect(fig('hering').querySelector('[data-acabamento]')).toBeNull();
  });
});

describe('VIDA 22 · provador e looks', () => {
  it('duas camisetas no provador aparecem lado a lado; uma calça entra na combinação', () => {
    const { container } = render(<LojaDaVida vida={base()} agir={() => true} lojaId="renner" />);
    const cartao = (id: string) => container.querySelector(`[data-produto="${id}"]`) as HTMLElement | null;
    const experimentar = (id: string) => { const c = cartao(id); expect(c, id).toBeTruthy(); fireEvent.click(c!.querySelector('button[aria-pressed]')!); };
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'camiseta' } });
    const ids = [...container.querySelectorAll('.catalogo-loja__cartao')].map(x => x.getAttribute('data-produto')!).filter(id => PECAS[id] && (PECAS[id] as { parte?: string }).parte === 'cima').slice(0, 2);
    expect(ids.length).toBe(2);
    ids.forEach(experimentar);
    expect(container.querySelectorAll('[data-alternativa]').length).toBe(2);
  });
  it('guarda o look com a ocasião e muda a ocasião depois', () => {
    let v = base();
    // VIDA 27 · §13: sem encontro por acaso nesta sequência de compras (na loja, o encontro agora é uma cena presencial que interrompe).
    v.celular15 = { ...(v.celular15 ?? { ano: 0, msgs: [] }), encontrosNoAno: 99 };
    for (const id of ['camiseta_pima', 'jeans', 'tenis_casual']) v = executar(v, { tipo: 'comprar_item', itemId: id }).vida;
    v = executar(v, P({ o: 'look_salvar', nome: 'Dia a dia', ocasiao: 'casual' })).vida;
    const l = v.eu.estilo!.looksSalvos![0];
    expect(l.ocasiao).toBe('casual');
    v = executar(v, P({ o: 'look_ocasiao', id: l.id, ocasiao: 'trabalho' })).vida;
    expect(v.eu.estilo!.looksSalvos![0].ocasiao).toBe('trabalho');
  });
  it('a peça comprada guarda a marca e é desenhada com ela no corpo', () => {
    let v = base();
    // Uma oferta de marca premium em diante (de verdade, de uma loja da cidade).
    const of = ESTABELECIMENTOS.flatMap(e => ofertasDaLoja(v, e.id).map(o => ({ ...o, loja: e.id }))).find(o => o.produto.id === 'camiseta_pima' && o.marca && (segmentoDaMarca(o.marca) ?? 0) >= 4)!;
    expect(of, 'oferta premium da camiseta pima').toBeTruthy();
    v = executar(v, { tipo: 'comprar_item', itemId: 'camiseta_pima', marca: of.marca, loja: of.loja } as never).vida;
    const x = v.eu.estilo!.itens.find(i => i.itemId === 'camiseta_pima')!;
    expect(x.marca).toBe(of.marca);
    const c = render(<Figura visual={v.eu.visual} genero={v.eu.genero} idade={28} corpo="mediano" pecas={v.eu.estilo!.itens.filter(i => i.usando)} largura={160} />).container;
    expect(c.querySelector('[data-acabamento]')).toBeTruthy();
  });
});
