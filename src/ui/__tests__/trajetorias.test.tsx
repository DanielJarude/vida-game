// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { App } from '../App';
import { criarRng } from '../../motor/rng';
import { criarVida } from '../../motor/criacao';
import { avancarAno } from '../../motor/ano';
import { salvar } from '../../motor/save';
import { contratar } from '../../motor/sistemas/trabalho';
import { ocupacao } from '../../motor/dados/ocupacoes';
import { iniciarPausa } from '../../motor/sistemas/pausa';
import type { Vida } from '../../motor/tipos';

function vidaSalva(idade: number, ajuste: (v: Vida) => void): void {
  let v = criarVida({ nome: 'Rita', sobrenome: 'Lopes', genero: 'feminino', municipioId: 'recife-pe', semente: 5 });
  for (let i = 0; i < idade; i++) { v = avancarAno(v).vida; v.momento = null; }
  v.caminhos.oportunidades = [];
  v.caminhos.processo = undefined;
  v.trabalho.atual = undefined;
  ajuste(v);
  salvar(v);
}

function abrirTrabalho(): void {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /Continuar/ }));
  fireEvent.click(screen.getAllByRole('button', { name: 'Trabalho' })[0]);
}

beforeEach(() => { localStorage.clear(); window.scrollTo = () => {}; window.confirm = () => true; });
afterEach(() => cleanup());

describe('interface dos caminhos de vida', () => {
  it('na prisão em regime fechado, a tela mostra a pena — sem "procurar trabalho"', () => {
    vidaSalva(30, v => { v.justica = { antecedentes: [{ t: v.t, categoria: 'mercado', desfecho: 'prisao', anos: 5 }], prisao: { tInicio: v.t, tFim: v.t + 36, regime: 'fechado' } }; });
    abrirTrabalho();
    expect(screen.getByRole('heading', { name: 'Cumprindo pena' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Procurar trabalho' })).toBeNull();
  });

  it('na pausa para cuidar, aparecem voltar ao mercado e o INSS facultativo', () => {
    vidaSalva(34, v => { contratar(v, criarRng(1), ocupacao('aux_adm')); iniciarPausa(v, 'casa', 'total'); });
    abrirTrabalho();
    expect(screen.getByRole('heading', { name: 'Cuidando' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Voltar ao mercado/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /INSS como facultativo/ })).toBeTruthy();
  });

  it('reduzir a jornada fica recolhido (não polui a tela) e MEI não aparece para quem tem carteira', () => {
    vidaSalva(34, v => { contratar(v, criarRng(1), ocupacao('aux_adm')); });
    abrirTrabalho();
    expect(screen.queryByRole('button', { name: /Reduzir a jornada/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Outras possibilidades/ }));
    expect(screen.getByRole('button', { name: /Reduzir a jornada/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Formalizar como MEI/ })).toBeNull();
  });

  it('a tela de Trabalho muda com o caminho: agora tem de 1 a 5 ações, sem botões bloqueados', () => {
    vidaSalva(34, v => { contratar(v, criarRng(1), ocupacao('vendedor')); });
    abrirTrabalho();
    const agora = screen.getByRole('list', { name: 'O que dá para fazer agora' });
    const botoes = agora.querySelectorAll('button');
    expect(botoes.length).toBeGreaterThanOrEqual(1);
    expect(botoes.length).toBeLessThanOrEqual(5);
    for (const b of botoes) expect((b as HTMLButtonElement).disabled).toBe(false);
    expect(screen.getByText(/No bolso/)).toBeTruthy();
  });
});
