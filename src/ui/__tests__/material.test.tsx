// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { App } from '../App';
import { criarRng } from '../../motor/rng';
import { criarVida } from '../../motor/criacao';
import { avancarAno } from '../../motor/ano';
import { salvar } from '../../motor/save';
import { contratar } from '../../motor/sistemas/trabalho';
import { ocupacao } from '../../motor/dados/ocupacoes';
import { balanco } from '../../motor/sistemas/dinheiro';
import { adotarPet } from '../../motor/sistemas/pets';
import { aplicar } from '../../motor/sistemas/investimentos';
import type { Vida } from '../../motor/tipos';
import { dinheiroCheio, leituraDoMes } from '../leituraMaterial';
import { MAX_PRIMARIAS_MATERIAL } from '../../motor/sistemas/relevancia';

function vidaSalva(idade: number, ajuste: (v: Vida) => void): Vida {
  let v = criarVida({ nome: 'Rita', sobrenome: 'Lopes', genero: 'feminino', municipioId: 'recife-pe', semente: 5 });
  for (let i = 0; i < idade; i++) { v = avancarAno(v).vida; v.momento = null; }
  ajuste(v);
  salvar(v);
  return v;
}

function adultaDeAluguel(v: Vida): void {
  for (const vin of Object.values(v.vinculos)) { vin.convivio = vin.convivio.filter(c => c !== 'casa'); if (vin.romance) vin.romance = undefined; }
  v.moradia = { tipo: 'aluguel', municipioId: v.moradia.municipioId, modeloId: 'apto_1q', aluguel: 1300, padrao: 3, tInicio: v.t, aceitaPet: true, bairro: 'no centro' };
  v.trabalho.atual = undefined;
  contratar(v, criarRng(2), ocupacao('assistente_adm'));
  v.financas.conta = 30000;
  v.financas.dividas = [];
  v.financas.negativado = false;
  v.caminhos.processo = undefined;
}

beforeEach(() => {
  localStorage.clear();
  window.scrollTo = () => {};
  window.confirm = () => true;
  const r = criarRng(20260924);
  vi.spyOn(Math, 'random').mockImplementation(() => r.next());
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function abrirCasa() {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /Continuar/ }));
  fireEvent.click(screen.getAllByRole('button', { name: 'Casa e dinheiro' })[0]);
}

describe('Casa e dinheiro', () => {
  it('de relance: onde mora, de quem é, quanto entra, quanto sai, o que sobra — com os números do motor', () => {
    const v = vidaSalva(27, adultaDeAluguel);
    abrirCasa();
    expect(screen.getByText(/Mora de aluguel/)).toBeTruthy();
    expect(screen.getByText(/Alugado ·/)).toBeTruthy();
    const m = leituraDoMes(v);
    expect(screen.getByRole('group', { name: /Quanto entra e quanto sai/ })).toBeTruthy();
    expect(screen.getAllByText(new RegExp(m.sobra >= 0 ? 'Sobra' : 'Falta')).length).toBeGreaterThan(0);
    expect(screen.getByText(dinheiroCheio(Math.abs(m.sobra)))).toBeTruthy();
    // O desenho da casa tem descrição.
    expect(screen.getByRole('img', { name: /Desenho:/ })).toBeTruthy();
  });

  it('o balanço usa o patrimônio líquido do motor (tem − deve)', () => {
    let esperado = 0;
    vidaSalva(30, v => {
      adultaDeAluguel(v);
      v.financas.bens.push({ id: 'car', tipo: 'veiculo', modeloId: 'carro_compacto', nome: 'carro compacto', valor: 40000, tCompra: v.t, estado: 70, anoFabricacao: 2045, usado: true, historia: [] });
      v.financas.dividas.push({ id: 'd', tipo: 'financiamento_veiculo', saldo: 15000, jurosMes: 0.015, parcela: 500, bemId: 'car', descricao: 'Financiamento: carro compacto', tInicio: v.t, prazo: 36 });
      esperado = balanco(v).liquido;
    });
    abrirCasa();
    const linha = screen.getByText(/Descontado o que deve/);
    expect(linha.textContent).toContain(dinheiroCheio(esperado));
    // Financiamento aparece como obrigação presa ao bem, não como "dívida" vermelha genérica.
    expect(screen.getByText(/Financiamentos \(presos a um bem\)/)).toBeTruthy();
    expect(screen.getByText('Já é seu')).toBeTruthy();
  });

  it('um carro que precisa de oficina tem ação: consertar (e não só vender)', () => {
    vidaSalva(30, v => {
      adultaDeAluguel(v);
      v.financas.bens.push({ id: 'car', tipo: 'veiculo', modeloId: 'carro_suv', nome: 'SUV compacto', valor: 60000, tCompra: v.t, estado: 30, anoFabricacao: 2040, usado: true, historia: [], problema: { id: 'p', texto: 'a suspensão batendo', custo: 3200, desde: v.t, gravidade: 2, adiado: 0 } });
    });
    abrirCasa();
    expect(screen.getAllByText(/Precisa de conserto/).length).toBeGreaterThan(0);
    const consertar = screen.getAllByRole('button', { name: 'Consertar' })[0] as HTMLButtonElement;
    expect(consertar.disabled).toBe(false);
    expect(screen.getAllByRole('button', { name: 'Adiar' }).length).toBeGreaterThan(0);
  });

  it('a imobiliária mostra poucas ofertas primeiro, com motivo, e deixa ver o resto', () => {
    vidaSalva(27, adultaDeAluguel);
    abrirCasa();
    fireEvent.click(screen.getByRole('button', { name: /Procurar outro lugar/ }));
    const folha = screen.getByRole('dialog', { name: 'Imobiliária' });
    const primarias = within(folha).getAllByRole('button').filter(b => b.classList.contains('oferta'));
    expect(primarias.length).toBeLessThanOrEqual(MAX_PRIMARIAS_MATERIAL.imoveis);
    expect(primarias.length).toBeGreaterThan(0);
    const ver = within(folha).getByRole('button', { name: /Ver as outras/ });
    fireEvent.click(ver);
    expect(within(folha).getAllByRole('button').filter(b => b.classList.contains('oferta')).length).toBeGreaterThan(primarias.length);
    // Abrir uma oferta mostra a condição e pede confirmação.
    fireEvent.click(primarias[0]);
    expect(within(folha).getByText(/Para entrar/)).toBeTruthy();
    expect(within(folha).getByRole('button', { name: /Alugar e mudar/ })).toBeTruthy();
  });

  it('comprar tem um percurso curto: financiar ou à vista, entrada, prazo, parcela e quanto pesa', () => {
    vidaSalva(32, v => { adultaDeAluguel(v); v.trabalho.atual!.salario = 9000; v.financas.conta = 150000; });
    abrirCasa();
    fireEvent.click(screen.getByRole('button', { name: /Procurar outro lugar/ }));
    const folha = screen.getByRole('dialog', { name: 'Imobiliária' });
    fireEvent.click(within(folha).getByRole('radio', { name: 'Comprar' }));
    const oferta = within(folha).getAllByRole('button').find(b => b.classList.contains('oferta'))!;
    fireEvent.click(oferta);
    expect(within(folha).getByRole('radiogroup', { name: 'Entrada' })).toBeTruthy();
    expect(within(folha).getByText('Pesa na renda')).toBeTruthy();
    expect(within(folha).getByRole('button', { name: /Financiar e comprar/ })).toBeTruthy();
  });

  it('as aplicações se explicam: quanto pôs, quanto vale, ganho ou perda em palavras, risco e liquidez', () => {
    vidaSalva(35, v => {
      adultaDeAluguel(v);
      v.financas.conta = 60000;
      const a = aplicar(v, 'acoes', 40000);
      a.valor = 31000; a.historico = [40000, 36000, 31000]; a.retornoAno = -0.14;
    });
    abrirCasa();
    expect(screen.getByText('Ações de muitas empresas')).toBeTruthy();
    expect(screen.getByText('Perdeu')).toBeTruthy();
    expect(screen.getByText(/caiu 14/)).toBeTruthy();
    expect(screen.getAllByText(/risco alto/).length).toBeGreaterThan(0);
    expect(screen.getByText(/pelo preço do dia/)).toBeTruthy();
  });

  it('criança: o dinheiro dela e o da casa aparecem separados', () => {
    vidaSalva(11, () => {});
    abrirCasa();
    expect(screen.getByText('O que é seu')).toBeTruthy();
    expect(screen.queryByText(/A casa \(não é seu\)/)).toBeTruthy();
    expect(screen.queryByRole('group', { name: /Quanto entra e quanto sai/ })).toBeNull();
  });

  it('o bicho doente tem veterinário na ficha', () => {
    let petId = '';
    vidaSalva(30, v => {
      adultaDeAluguel(v);
      const pet = adotarPet(v, criarRng(1), { especie: 'cachorro', nome: 'Faísca', genero: 'masculino', idade: 9, porte: 'medio', jeito: 'calmo', historia: '' }, 'abrigo');
      pet.pet!.doenca = { nome: 'uma infecção urinária', desde: v.t, gravidade: 2, tratando: false, tratavel: true };
      petId = pet.id;
    });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Continuar/ }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Pessoas' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: /Faísca/ })[0]);
    const ficha = screen.getByRole('dialog', { name: 'Faísca' });
    expect(within(ficha).getByText(/doente: uma infecção urinária/i)).toBeTruthy();
    expect(within(ficha).getByRole('button', { name: /^Tratar/ })).toBeTruthy();
    void petId;
  });
});
