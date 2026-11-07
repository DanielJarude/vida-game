// @vitest-environment jsdom
/**
 * VIDA 12.9 · Economia e Negócios — as telas: o raio-x financeiro do resumo, o painel de gestão (números, causas,
 * alavancas com a atual marcada, projetos, diretoria) e o fundar/comprar das empresas grandes.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { criarRng } from '../../motor/rng';
import { adulto } from '../../motor/__tests__/cenarios';
import { executar, type Acao } from '../../motor/acoes';
import { transacao } from '../../motor/nucleo';
import { processarEmpresas } from '../../motor/sistemas/empresas';
import type { Vida } from '../../motor/tipos';
import { FundarOuAdquirir129, PainelDaEmpresa129, RaioX129 } from '../jogo/Empresas129';

beforeEach(() => {
  localStorage.clear();
  window.scrollTo = () => {};
  const r = criarRng(20261106);
  vi.spyOn(Math, 'random').mockImplementation(() => r.next());
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function rica(conta: number): Vida {
  const v = adulto(40, { municipioId: 'sao-paulo-sp', semente: 41 });
  v.financas.conta = conta;
  v.financas.dividas = [];
  v.financas.negativado = false;
  v.momento = null;
  delete v.fila;
  return v;
}
const fazer = (v: Vida, a: Acao) => executar(v, a).vida;

describe('12.9 · telas da economia', () => {
  it('o raio-x separa dinheiro, liquidez, bruto, dívidas, líquido e renda', () => {
    render(<RaioX129 vida={rica(3_000_000)} />);
    expect(screen.getByText('Mobilizável em semanas')).toBeTruthy();
    expect(screen.getByText('Patrimônio líquido')).toBeTruthy();
    expect(screen.getByText(/Raio-x · milionária/)).toBeTruthy();
  });

  it('o painel de uma empresa grande mostra números, causas, alavancas e diretoria; escolher uma alavanca chama a ação', () => {
    let v = fazer(rica(10e9), { tipo: 'fundar129', setor: 'industria', item: 'alimentos', comSocio: false });
    for (let k = 0; k < 3; k++) { v.t += 12; v.anoAtual = { acoes: [] }; v = transacao(v, (x, r) => processarEmpresas(x, r)).vida; }
    const e = (v.financas.empresas ?? []).find(x => !!x.corp)!;
    const agir = vi.fn(() => true);
    render(<PainelDaEmpresa129 vida={v} agir={agir} e={e} />);
    expect(screen.getAllByText('Faturamento').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Produtividade|Reputação/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Presidente \(CEO\)/).length).toBeGreaterThan(0);
    // VIDA 13: as alavancas moram na aba "Mercado e operação" das decisões (a primeira aba é a de lançar produto).
    fireEvent.click(screen.getByRole('tab', { name: /Mercado e operação/ }));
    const forte = screen.getByRole('radio', { name: /Campanha forte/ });
    expect(forte.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(forte);
    expect(agir).toHaveBeenCalledWith({ tipo: 'empresa129', empresaId: e.id, oque: 'alavanca', alvo: 'marketing:forte' });
  });

  it('fundar e comprar: só o que cabe aparece; o resto é dito com o mínimo', () => {
    render(<FundarOuAdquirir129 vida={rica(80_000_000)} agir={() => true} />);
    expect(screen.getByText(/Fora do alcance por enquanto/)).toBeTruthy();
    expect(screen.getByText('Capital para fundar')).toBeTruthy();
  });
});
