// @vitest-environment jsdom
/**
 * REWORK 12 — as telas do patrimônio: as partes (resumo, imóveis, garagem, coleção, empresas, objetos), o "ter não é
 * poder pagar", a confirmação antes do que não se desfaz, as lojas de peças e o "antes de decidir" das compras grandes.
 */
import { beforeAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { App, precarregar } from '../App';
import { criarRng } from '../../motor/rng';
import { criarVida } from '../../motor/criacao';
import { avancarAno } from '../../motor/ano';
import { salvar } from '../../motor/save';
import { contratar } from '../../motor/sistemas/trabalho';
import { ocupacao } from '../../motor/dados/ocupacoes';
import { executar } from '../../motor/acoes';
import { ofertasDeColecao } from '../../motor/sistemas/colecao';
import { ofertasDeImoveis, ofertasDeVeiculos } from '../../motor/sistemas/mercado';
import { Lugar } from '../jogo/material/Lugares';
import type { Vida } from '../../motor/tipos';

beforeAll(async () => { await precarregar(); });

function rica(idade = 40): Vida {
  let v = criarVida({ nome: 'Marta', sobrenome: 'Azevedo', genero: 'feminino', municipioId: 'sao-paulo-sp', semente: 12 });
  for (let i = 0; i < idade; i++) { v = avancarAno(v).vida; v.momento = null; }
  for (const vin of Object.values(v.vinculos)) { vin.convivio = vin.convivio.filter(c => c !== 'casa'); if (vin.romance) vin.romance = undefined; }
  v.moradia = { tipo: 'aluguel', municipioId: 'sao-paulo-sp', modeloId: 'apto_2q', aluguel: 2500, padrao: 3, tInicio: v.t, aceitaPet: true, bairro: 'no centro' };
  v.trabalho.atual = undefined;
  contratar(v, criarRng(2), ocupacao('assistente_adm'));
  v.trabalho.licencas.push('cnh');
  v.financas = { ...v.financas, conta: 25_000_000, dividas: [], negativado: false };
  v.caminhos.processo = undefined;
  return v;
}

function comTudo(): Vida {
  let v = rica();
  v = executar(v, { tipo: 'comprar_veiculo', ofertaId: ofertasDeVeiculos(v, 'concessionaria')[0].id, financiar: false }).vida;
  v = executar(v, { tipo: 'colecao_comprar', ofertaId: ofertasDeColecao(v, 'relojoaria')[0].id }).vida;
  v = executar(v, { tipo: 'empresa_abrir', empresa: 'restaurante', comSocio: false }).vida;
  v = executar(v, { tipo: 'comprar_imovel', ofertaId: ofertasDeImoveis(v, 'venda').find(o => o.modeloId === 'apto_1q')!.id, financiar: false, morar: false }).vida;
  v.momento = null;
  return v;
}

beforeEach(() => {
  localStorage.clear();
  window.scrollTo = () => {};
  const r = criarRng(20261024);
  vi.spyOn(Math, 'random').mockImplementation(() => r.next());
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function abrirPatrimonio(v: Vida) {
  salvar(v);
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /Continuar/ }));
  fireEvent.click(screen.getAllByRole('button', { name: 'Vida' })[0]);
  fireEvent.click(screen.getByRole('tab', { name: 'Patrimônio' }));
}

describe('Vida · Patrimônio em partes', () => {
  it('as seis partes são abas de verdade (tablist, teclado); o resumo separa o que tem, o que deve e o que dá para usar agora', () => {
    abrirPatrimonio(comTudo());
    const lista = screen.getByRole('navigation', { name: 'Partes do patrimônio' });
    for (const n of ['Resumo', 'Imóveis', 'Garagem', 'Coleção', 'Empresas', 'Objetos']) expect(within(lista).getByRole('tab', { name: new RegExp(`^${n}`) })).toBeTruthy();
    expect(screen.getByText('O patrimônio, por partes')).toBeTruthy();
    expect(screen.getByText('Ter não é poder pagar agora')).toBeTruthy();
    expect(screen.getAllByText('Patrimônio líquido').length).toBeGreaterThan(0);
    expect(screen.getByText(/O patrimônio custa/)).toBeTruthy();
    // Teclado: a seta leva à próxima parte.
    const resumo = within(lista).getByRole('tab', { name: /^Resumo/ });
    resumo.focus();
    fireEvent.keyDown(resumo, { key: 'ArrowRight' });
    expect(document.activeElement?.textContent).toMatch(/^Imóveis/);
  });

  it('garagem lado a lado; coleção com venda confirmada; empresa com os números e as decisões', () => {
    abrirPatrimonio(comTudo());
    fireEvent.click(screen.getByRole('tab', { name: /^Garagem/ }));
    expect(screen.getByRole('table', { name: /veículos, lado a lado/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: /^Coleção/ }));
    const vender = screen.getAllByRole('button', { name: 'Vender…' });
    fireEvent.click(vender[vender.length - 1]);
    expect(screen.getByRole('group', { name: 'Vender a peça' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Para um comerciante/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: /^Empresas/ }));
    expect(screen.getByText(/Caixa da empresa/)).toBeTruthy();
    expect(screen.getByText(/Decidir sobre/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Vender ou fechar…' }));
    expect(screen.getByRole('group', { name: 'Sair da empresa' })).toBeTruthy();
  });
});

describe('lojas e compras grandes', () => {
  it('a relojoaria mostra o preço e o que a peça vale depois de sair da loja; a garagem de colecionador abre', () => {
    const v = rica();
    render(<Lugar vida={v} agir={() => true} qual="relojoaria" aoFechar={() => {}} trocar={() => {}} />);
    expect(screen.getAllByRole('button', { name: 'Comprar' }).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/não é promessa/).length).toBeGreaterThan(0);
    cleanup();
    render(<Lugar vida={v} agir={() => true} qual="colecionador" aoFechar={() => {}} trocar={() => {}} />);
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('antes de comprar um imóvel para alugar: o custo do mês, o rendimento e os riscos (sem promessa)', () => {
    const v = rica();
    render(<Lugar vida={v} agir={() => true} qual="comprar" aoFechar={() => {}} trocar={() => {}} />);
    fireEvent.click(screen.getAllByRole('button').find(b => b.classList.contains('oferta--casa'))!);
    fireEvent.click(screen.getByRole('checkbox', { name: /Morar lá/ }));
    const g = screen.getByRole('group', { name: 'Antes de decidir' });
    expect(within(g).getByText('Todo mês')).toBeTruthy();
    expect(within(g).getByText('Alugado')).toBeTruthy();
    expect(within(g).getByText(/Nada disso é garantido/)).toBeTruthy();
  });
});
