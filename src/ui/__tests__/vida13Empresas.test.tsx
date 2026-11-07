// @vitest-environment jsdom
/**
 * VIDA 13 · Empresas — a tela: hierarquia (títulos de verdade, não um <summary> com cara de título), abas de decisão,
 * o catálogo de produtos do ramo com a ficha completa, as decisões de cada linha, a opção indisponível que diz o motivo
 * e o quadro "o que você decidiu" (custo, de onde saiu, o que mudou, o que se espera).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { criarRng } from '../../motor/rng';
import { adulto } from '../../motor/__tests__/cenarios';
import { executar, type Acao } from '../../motor/acoes';
import { transacao } from '../../motor/nucleo';
import { processarEmpresas } from '../../motor/sistemas/empresas';
import type { Vida } from '../../motor/tipos';
import { PainelDaEmpresa129 } from '../jogo/Empresas129';

beforeEach(() => {
  localStorage.clear();
  window.scrollTo = () => {};
  const r = criarRng(20261107);
  vi.spyOn(Math, 'random').mockImplementation(() => r.next());
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function industria(): Vida {
  let v = adulto(40, { municipioId: 'sao-paulo-sp', semente: 41 });
  v.financas.conta = 10e9; v.financas.dividas = []; v.financas.negativado = false; v.momento = null; delete v.fila;
  v = executar(v, { tipo: 'fundar129', setor: 'industria', item: 'biscoitos', comSocio: false }).vida;
  for (let k = 0; k < 2; k++) { v.t += 12; v.anoAtual = { acoes: [] }; v = transacao(v, (x, r) => processarEmpresas(x, r)).vida; }
  const e = v.financas.empresas!.find(x => !!x.corp)!;
  e.estrategia!.delegar = false;
  e.caixa = 300e6;
  return v;
}
const corp = (v: Vida) => v.financas.empresas!.find(x => !!x.corp)!;

describe('13 · a tela da empresa', () => {
  it('títulos de verdade, abas de decisão e o catálogo de produtos com a ficha completa', () => {
    const v = industria();
    const e = corp(v);
    const agir = vi.fn((_a: Acao) => true);
    const { container } = render(<PainelDaEmpresa129 vida={v} agir={agir} e={e} />);
    // "Decisões de X" é um título (h4), não o <summary> de um <details>.
    expect(screen.getByRole('heading', { level: 4, name: `Decisões de ${e.nome}` })).toBeTruthy();
    expect(container.querySelector('summary.objeto__fazer-titulo')).toBeNull();
    const abas = screen.getAllByRole('tab');
    expect(abas.map(t => t.textContent)).toEqual(['Lançar produto', 'Mercado e operação', 'Crescer e financiar', 'Lucro e capital']);
    expect(abas[0].getAttribute('aria-selected')).toBe('true');
    // Os produtos do ramo, por família; escolher um mostra a ficha.
    const sal = screen.getByRole('button', { name: /Cereais matinais/ });
    expect(sal.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(sal);
    expect(sal.getAttribute('aria-pressed')).toBe('true');
    const ficha = container.querySelector('.e13-escolhido') as HTMLElement;
    for (const r of ['Investimento', 'Prazo até vender', 'Capacidade que ocupa', 'Faturamento maduro', 'Custos (maduro)', 'Margem', 'Público', 'Posicionamento', 'Preço', 'Concorrência', 'Mercado', 'Risco']) expect(within(ficha).getByText(r)).toBeTruthy();
    fireEvent.click(within(ficha).getByRole('button', { name: /Nova linha de produção para este produto/ }));
    expect(agir).toHaveBeenCalledWith({ tipo: 'empresa129', empresaId: e.id, oque: 'linha', alvo: 'cereais' });
  });

  it('a linha à venda tem as decisões dela; a opção indisponível fica marcada e diz por quê', () => {
    let v = industria();
    const e = corp(v);
    const pid = e.corp!.projetos.find(p => p.estado === 'ativo')!.id;
    v = executar(v, { tipo: 'empresa129', empresaId: e.id, oque: 'preco', alvo: `${pid}:+` }).vida;
    const agir = vi.fn(() => true);
    render(<PainelDaEmpresa129 vida={v} agir={agir} e={corp(v)} />);
    expect(screen.getByRole('button', { name: /Lançar versão nova/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Investir em qualidade/ })).toBeTruthy();
    const premium = screen.getByRole('radio', { name: /Premium/ });
    // Do popular ao premium de uma vez, não: indisponível com o motivo.
    expect(premium.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(premium);
    expect(agir).not.toHaveBeenCalled();
    expect(screen.getAllByText(/Um degrau de cada vez/).length).toBeGreaterThan(0);
    // O preço já mudou este ano: as duas opções dizem o motivo.
    expect(screen.getByRole('button', { name: /Subir 10%/ }).getAttribute('aria-disabled')).toBe('true');
    // O quadro do que foi decidido: o título, o esperado e o aviso de que o efeito vem no fechamento.
    const quadro = screen.getByRole('region', { name: 'Decisões recentes' });
    expect(within(quadro).getByText(/preço para cima/)).toBeTruthy();
    expect(within(quadro).getByText(/aparece no fechamento do ano/)).toBeTruthy();
  });
});
