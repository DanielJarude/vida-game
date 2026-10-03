// @vitest-environment jsdom
/**
 * A tela do legado (sucessão): a morte mostra o que ficou, a partilha e a
 * escolha — encerrar ou continuar a família com quem o JOGADOR escolher.
 * A tela lê o mesmo motor: a partilha mostrada é a que será feita.
 */
import { beforeAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { App, precarregar } from '../App';
import { ler, salvar } from '../../motor/save';
import { adulto, comFilho, comParceiro } from '../../motor/__tests__/cenarios';
import { calcularHeranca } from '../../motor/sistemas/partilha';
import { partilhar } from '../../motor/sistemas/sucessao';
import { dinheiro } from '../../motor/texto';
import type { Vida } from '../../motor/tipos';

beforeAll(async () => { await precarregar(); });
beforeEach(() => { localStorage.clear(); window.scrollTo = () => {}; window.confirm = () => true; });
afterEach(() => cleanup());

function morta(): { v: Vida; a: string; b: string } {
  const v = adulto(66, { semente: 11, genero: 'masculino' });
  const { p: mae } = comParceiro(v, { idade: 63, estagio: 'casamento', anos: 35, genero: 'feminino' });
  const { p: a } = comFilho(v, 33, { outroId: mae.id, casa: false, genero: 'masculino' });
  const { p: b } = comFilho(v, 28, { outroId: mae.id, casa: false, genero: 'feminino' });
  a.renda = 3900; b.renda = 5200; a.ocupacao = 'professor'; b.ocupacao = 'arquiteta';
  v.financas.conta = 120000;
  v.morte = { t: v.t, causa: 'infarto', heranca: calcularHeranca(v) };
  return { v, a: a.nome, b: b.nome };
}

function abrir(): void {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /Voltar ao legado de/ }));
}

describe('tela do legado', () => {
  it('mostra o que ficou, a partilha do motor e os dois filhos — sem escolher por ninguém', () => {
    const { v, a, b } = morta();
    salvar(v);
    abrir();
    expect(screen.getByRole('heading', { name: 'O que ficou' })).toBeTruthy();
    const p = partilhar(v);
    expect(screen.getAllByText(dinheiro(p.heranca)).length).toBeGreaterThan(0);
    const lista = screen.getByRole('list', { name: 'Quem recebe' });
    expect(within(lista).getByText(a)).toBeTruthy();
    expect(screen.getByRole('button', { name: new RegExp(`${a}, `) })).toBeTruthy();
    expect(screen.getByRole('button', { name: new RegExp(`${b}, `) })).toBeTruthy();
    // Nada está escolhido até o jogador escolher.
    expect(screen.queryByRole('button', { name: /^Continuar como/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'Encerrar esta história' })).toBeTruthy();
  });

  it('a vida morta fica salva: a decisão da partilha persiste no reload', () => {
    const { v, b } = morta();
    salvar(v);
    abrir();
    fireEvent.click(screen.getByText('Decidir o destino do patrimônio'));
    const grupo = screen.getByRole('group', { name: `Parte disponível para ${b}` });
    fireEvent.click(within(grupo).getByRole('button', { name: '100%' }));
    const r = ler();
    expect(r.tipo).toBe('ok');
    expect((r as { vida: Vida }).vida.morte!.decisoes!.disponivel![0].fracao).toBe(1);
  });

  it('continuar como a filha: o jogo segue com ela, e "Você" mostra quem veio antes', () => {
    const { v, b } = morta();
    salvar(v);
    abrir();
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`${b}, `) }));
    fireEvent.click(screen.getByRole('button', { name: `Continuar como ${b}` }));
    const r = ler();
    expect(r.tipo).toBe('ok');
    const nova = (r as { vida: Vida }).vida;
    expect(nova.eu.nome).toBe(b);
    expect(nova.morte).toBeUndefined();
    fireEvent.click(screen.getAllByRole('button', { name: 'Você' })[0]);
    expect(screen.getByRole('heading', { name: 'Quem veio antes' })).toBeTruthy();
  });

  it('a saúde dela aparece na escolha (só o que tem nome) e vai junto: "Você" mostra os sinais do que não tem nome', () => {
    const { v, b } = morta();
    const filha = Object.values(v.pessoas).find(p => p.nome === b)!;
    filha.condicoes = [
      { id: 'hipertensao', tInicio: v.t - 60, gravidade: 1, diagnosticada: true, tDiagnostico: v.t - 48, tratando: true },
      { id: 'diabetes', tInicio: v.t - 6, gravidade: 2, diagnosticada: false, tratando: false }
    ];
    salvar(v);
    abrir();
    const botao = screen.getByRole('button', { name: new RegExp(`${b}, `) });
    expect(within(botao).getByText('Saúde: pressão alta (em tratamento).')).toBeTruthy();
    expect(within(botao).queryByText(/diabetes/)).toBeNull();
    fireEvent.click(botao);
    fireEvent.click(screen.getByRole('button', { name: `Continuar como ${b}` }));
    const nova = (ler() as { vida: Vida }).vida;
    expect(nova.corpo.condicoes.map(c => c.id).sort()).toEqual(['diabetes', 'hipertensao']);
    // O diabetes que ninguém nomeou continua sem nome: na tela "Você", são os sinais do corpo dela.
    fireEvent.click(screen.getAllByRole('button', { name: 'Você' })[0]);
    expect(within(screen.getByRole('region', { name: 'Sinais do corpo' })).getByText(/muita sede/i)).toBeTruthy();
  });

  it('encerrar a história registra a partilha e oferece outra vida', () => {
    const { v } = morta();
    salvar(v);
    abrir();
    fireEvent.click(screen.getByRole('button', { name: 'Encerrar esta história' }));
    expect(screen.getByRole('button', { name: 'Viver outra vida' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Continuar a família' })).toBeNull();
  });
});
