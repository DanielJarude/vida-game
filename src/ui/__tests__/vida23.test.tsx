// @vitest-environment jsdom
/**
 * VIDA 23 — o corpo na tela: a mesma escala no provador e na Aparência, o corpo de antes intacto, as proporções que se
 * veem, as marcas, as joias com forma e acabamento próprios, e o painel "Corpo e pele".
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { adulto } from '../../motor/__tests__/cenarios';
import { transacao } from '../../motor/nucleo';
import type { Acao } from '../../motor/acoes';
import { executar } from '../../motor/acoes';
import { Figura } from '../avatar/Figura';
import { Retrato } from '../avatar/Retrato';
import { LARGURA_DE_REFERENCIA } from '../avatar/referencia';
import { FORMAS23, gravarCorpo23 } from '../../motor/v23/corpo/corpo23';
import { JOIAS20 } from '../../motor/dados20/joias20';
import { LojaDaVida } from '../jogo/material/Lojas';
import { memoriaDasLojas } from '../jogo/memoriaDeCompras';
import { lojasDaVida } from '../../motor/sistemas/lojas';
import { PeleEMarcas } from '../v23/CorpoEPele';
import { disponibilidade } from '../../motor/acoes';
import type { Genero, Visual, Vida } from '../../motor/tipos';

afterEach(() => { cleanup(); memoriaDasLojas.clear(); try { localStorage.clear(); sessionStorage.clear(); } catch { /* */ } });
const base = (x: Partial<Visual> = {}): Visual => ({ pele: 'p3', cabelo: 'curto', corCabelo: 'castanho', olhos: 'castanho', ...x } as Visual);
const fig = (v: Visual, g: Genero = 'masculino', extra: Record<string, unknown> = {}) => renderToStaticMarkup(<Figura visual={v} genero={g} idade={30} semente="s" corpo={(extra.corpo as never) ?? 'mediano'} pecas={[{ itemId: 'camiseta', id: 'c' }, { itemId: 'jeans', id: 'j' }]} largura={LARGURA_DE_REFERENCIA} semCima={!!extra.semCima} />);
const semAtributos = (s: string) => s.replace(/ data-constituicao="[^"]*"/g, '');

describe('VIDA 23 · o corpo de antes não muda', () => {
  it('sem constituição = constituição na base (o desenho é o mesmo), nas cinco condições', () => {
    for (const t of ['magro', 'mediano', 'atletico', 'musculoso', 'acima_do_peso']) {
      expect(semAtributos(fig(base({ corpo23: '222222222222' }), 'masculino', { corpo: t }))).toBe(fig(base(), 'masculino', { corpo: t }));
    }
  });
});

describe('VIDA 23 · proporções que se veem', () => {
  it('cada forma de partida dá um desenho diferente (nos dois gêneros), e a estatura muda a altura da figura', () => {
    for (const g of ['feminino', 'masculino'] as Genero[]) {
      const desenhos = FORMAS23.map(f => semAtributos(fig(base({ corpo23: gravarCorpo23(f.c) ?? '222222222222' }), g, { semCima: true })));
      expect(new Set(desenhos).size).toBe(FORMAS23.length);
    }
    const alt = (z: number) => Number(/viewBox="0 0 120 (\d+)"/.exec(fig(base({ corpo23: '222222222222' }), 'masculino', { corpo: { tipo: 'mediano', estatura: z } }))![1]);
    expect(alt(2)).toBeGreaterThan(alt(0));
    expect(alt(-2)).toBeLessThan(alt(0));
  });

  it('as marcas aparecem no corpo e no rosto, recortadas pela parte do corpo', () => {
    const v = base({ corpo23: '222222222222', marcas23: [{ t: 'cicatriz', r: 'antebraco', l: 'e', x: 0, y: 0, s: 2, f: 'cirurgica', a: 30, i: 2 }, { t: 'pinta', r: 'bochecha', l: 'd', x: 0.2, y: 0, s: 2, f: 'plana' }] });
    const s = fig(v, 'feminino', { semCima: true });
    expect(s).toContain('data-marca="cicatriz"');
    expect(s).toMatch(/clip-path="url\(#[^)]*cb1\)"><g data-marca="cicatriz"/);
    expect(s).toContain('data-marca="pinta"');
    expect(renderToStaticMarkup(<Retrato visual={v} genero="feminino" idade={30} tamanho={132} />)).toContain('data-marca="pinta"');
    // Antes da idade em que apareceu, não se vê.
    expect(renderToStaticMarkup(<Figura visual={base({ marcas23: [{ t: 'estrias', r: 'coxa', l: 'e', x: 0, y: 0, s: 2, d: 16 }] })} genero="feminino" idade={10} corpo="mediano" pecas={[]} semCima />)).not.toContain('data-marca');
  });
});

describe('VIDA 23 · joias com identidade', () => {
  it('cada forma de brinco tem um desenho próprio no retrato; o mesmo modelo em dois metais tem acabamentos diferentes', () => {
    const porForma = new Map<string, string>();
    for (const j of JOIAS20.filter(x => x.lugar === 'orelha')) if (!porForma.has(j.forma)) {
      const s = renderToStaticMarkup(<Retrato visual={base({ cabelo: 'raspado', brincos: true, modeloBrincos: j.id })} genero="feminino" idade={30} tamanho={132} />);
      porForma.set(j.forma, (s.match(/<g class="retrato__joia"[\s\S]*?<\/g><\/g>|<g class="retrato__joia"[^>]*>[\s\S]*?<\/g>/g) ?? []).join('').replace(/-?\d+\.\d+/g, 'n'));
    }
    expect(porForma.size).toBeGreaterThanOrEqual(21);
    expect(new Set(porForma.values()).size).toBe(porForma.size);
    const acab = (id: string) => /data-acabamento="(\w+)"/.exec(renderToStaticMarkup(<Retrato visual={base({ cabelo: 'raspado', brincos: true, modeloBrincos: id })} genero="feminino" idade={30} tamanho={132} />))?.[1];
    expect(acab('j20_argola_fina_ouro_amarelo')).toBe('polido');
    expect(acab('j20_argola_fina_aco')).toBe('escovado');
    expect(acab('j20_argola_fina_prata')).toBe('espelhado');
  });

  it('colares, pulseiras e anéis novos no corpo, com a forma do catálogo', () => {
    for (const id of ['j20_cubana_ouro_amarelo', 'j20_perolas_prata_perola', 'j20_bracelete_largo_prata', 'j20_anel_duplo_ouro_rose']) {
      const s = renderToStaticMarkup(<Figura visual={base()} genero="feminino" idade={30} corpo="mediano" pecas={[{ itemId: 'regata', id: 'r' }, { itemId: id, id }]} largura={132} />);
      expect(s, id).toContain(`data-forma="${JOIAS20.find(j => j.id === id)!.forma}"`);
    }
  });
});

describe('VIDA 23 · o provador na mesma escala', () => {
  const rica = (): Vida => transacao(adulto(30, { semente: 2304, municipioId: 'sao-paulo-sp' }), x => { x.financas.conta = 5_000_000; x.momento = null; }).vida;
  it('"com a peça" e "como você está" têm a mesma largura (a de referência) — roupa e brinco', () => {
    const v = rica();
    for (const [cat, sel] of [['vestuario', '.catalogo-loja__cartao'], ['joias', '.catalogo-loja__cartao']] as const) {
      const loja = lojasDaVida(v).find(e => e.categorias.includes(cat as never))!;
      const { container, unmount } = render(<LojaDaVida vida={v} agir={() => true} lojaId={loja.id} />);
      const cartoes = [...container.querySelectorAll(sel)] as HTMLElement[];
      const alvo = cat === 'joias' ? cartoes.find(c => /brinco|argola/i.test(c.textContent ?? '')) ?? cartoes[0] : cartoes[0];
      const botao = within(alvo).queryByRole('button', { name: 'Experimentar' });
      if (!botao) { unmount(); continue; }
      fireEvent.click(botao);
      const figuras = [...container.querySelectorAll('.provador svg.figura')];
      expect(figuras.length, cat).toBeGreaterThanOrEqual(2);
      for (const f of figuras) expect(f.getAttribute('width'), cat).toBe(String(LARGURA_DE_REFERENCIA));
      // A mesma pessoa: com a peça e agora, a mesma altura (o mesmo viewBox) quando nenhuma é lupa.
      const inteiras = figuras.filter(f => !f.getAttribute('data-foco'));
      expect(new Set(inteiras.map(f => f.getAttribute('viewBox'))).size, cat).toBe(1);
      unmount();
    }
  });
});

describe('VIDA 23/24 · Pele e marcas (as proporções são de nascença)', () => {
  it('a ação de mudar as proporções ou os pelos naturais é recusada; as marcas continuam editáveis', () => {
    const v = transacao(adulto(25, { semente: 2305 }), x => { x.momento = null; }).vida;
    expect(disponibilidade(v, { tipo: 'corpo23', mudanca: { corpo23: '242222222222' } }).grau).toBe('impossivel');
    expect(disponibilidade(v, { tipo: 'corpo23', mudanca: { pelos23: 3 } }).grau).toBe('impossivel');
    const m = [{ t: 'pinta' as const, r: 'antebraco' as const, l: 'e' as const, x: 0, y: 0, s: 1 as const, f: 'plana' }];
    expect(disponibilidade(v, { tipo: 'corpo23', mudanca: { marcas23: m } }).grau).toBe('permitido');
  });

  it('acrescentar uma marca mostra antes e depois na mesma escala e a lupa da região; confirmar grava', () => {
    let v = transacao(adulto(25, { semente: 2306 }), x => { x.momento = null; delete x.eu.visual.marcas23; }).vida;
    const acoes: Acao[] = [];
    const agir = (a: Acao) => { acoes.push(a); v = executar(v, a).vida; return true; };
    const { container } = render(<PeleEMarcas vida={v} agir={agir} />);
    expect(container.querySelector('[data-eixo]')).toBeNull();
    fireEvent.change(container.querySelector('.c23__grupo select') as HTMLSelectElement, { target: { value: 'cicatriz' } });
    expect(container.querySelector('[data-c23="perto"] svg')).toBeTruthy();
    expect(container.querySelector('[data-c23="previa"]')!.innerHTML).toContain('data-marca="cicatriz"');
    const figs = [...container.querySelectorAll('.c23__fig svg.figura')];
    expect(new Set(figs.map(f => f.getAttribute('width')))).toEqual(new Set([String(LARGURA_DE_REFERENCIA)]));
    fireEvent.click(within(container).getByRole('button', { name: 'Confirmar' }));
    expect(acoes[0]?.tipo).toBe('corpo23');
    expect(v.eu.visual.marcas23?.[0]?.t).toBe('cicatriz');
  });
});
