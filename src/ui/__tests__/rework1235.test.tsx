// @vitest-environment jsdom
/**
 * REWORK 12.35 — as telas: o preço, a chance e o risco antes de pedir; o intermediário que não é parente e diz por que
 * conhece; as oportunidades com o que pagam antes de aceitar; quem responde a você; o comando sem botões inúteis; o que se
 * viveu no histórico.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { criarRng } from '../../motor/rng';
import { adulto, pessoaNova } from '../../motor/__tests__/cenarios';
import { transacao } from '../../motor/nucleo';
import { entrar } from '../../motor/sistemas/ilicito';
import { garantirCidade, orgsDaCidade, relacaoCom, definirNivel } from '../../motor/sistemas/faccoes';
import { vincular } from '../../motor/pessoas';
import type { Vida } from '../../motor/tipos';
import { SubmundoVivo } from '../jogo/SubmundoVivo';

beforeEach(() => {
  localStorage.clear();
  window.scrollTo = () => {};
  const r = criarRng(20261031);
  vi.spyOn(Math, 'random').mockImplementation(() => r.next());
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const nada = () => true;
const aba = (nome: string) => fireEvent.click(screen.getByRole('tab', { name: new RegExp(`^${nome}`) }));

function chefe(nivel: number): Vida {
  const v = adulto(34, { semente: 7, municipioId: 'sao-paulo-sp' });
  v.financas.conta = 400_000; v.momento = null; delete v.fila; v.justica = undefined;
  return transacao(v, (x, r) => {
    entrar(x, 'grupo', undefined, r); garantirCidade(x);
    const o = orgsDaCidade(x)[0];
    const rel = relacaoCom(x, o); rel.relacao = 'membro'; rel.lealdade = 60; definirNivel(x, rel, nivel);
    for (const m of o.quadro) if (m.nivel >= nivel) m.nivel = Math.max(0, nivel - 1);
    (x.mundoCriminal!.oportunidades ??= []).push({ id: 'opo1', tipo: 'demanda', municipioId: x.moradia.municipioId, ramo: 'organizado', t: x.t, tFim: x.t + 12, valor: 54000, chance: 0.66, risco: 12, estado: 'aberta' });
    (x.caminhos.envolvimento!.casos ??= []).push({ id: 'caso_x', t: x.t - 12, tipo: 'confronto', situacao: 'territorio', escolha: 'ir', resultado: ['A família levou a melhor no pedaço.'], tom: 'bom' });
  }).vida;
}

describe('REWORK 12.35 · telas', () => {
  it('pedidos por fora: o intermediário diz quem é; o preço, a chance e o risco vêm antes de pedir', () => {
    const v = adulto(30, { semente: 3, municipioId: 'sao-paulo-sp' });
    v.financas.conta = 50_000; v.momento = null; delete v.fila;
    const amigo = pessoaNova(v, 33, 'feminino');
    vincular(v, amigo, { origem: 'trabalho', proximidade: 50 });
    amigo.temperamento.responsabilidade = -0.8; v.vinculos[amigo.id].confianca = 60;
    render(<main><SubmundoVivo vida={v} agir={nada} /></main>);
    expect(screen.getByText(/uma conhecida do trabalho/)).toBeTruthy();
    expect(screen.getAllByText('Custa (adiantado)').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Vir à tona').length).toBeGreaterThan(0);
  });

  it('atividades: a oportunidade mostra o que paga, a chance e o risco antes de aceitar', () => {
    render(<main><SubmundoVivo vida={chefe(4)} agir={nada} /></main>);
    aba('Atividades');
    expect(screen.getByText(/A procura está em alta/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Aceitar' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Deixar passar' })).toBeTruthy();
  });

  it('organizações: o jeito dela, quem responde a você, e nenhum botão de comando bloqueado em série', () => {
    render(<main><SubmundoVivo vida={chefe(3)} agir={nada} /></main>);
    aba('Organizações');
    expect(screen.getAllByText(/Jeito:/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Quem responde a você/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Propor aliança/ })).toBeNull();
    expect(screen.getByText(/No próximo posto/)).toBeTruthy();
  });

  it('histórico: o que se viveu, com o resultado', () => {
    render(<main><SubmundoVivo vida={chefe(2)} agir={nada} /></main>);
    aba('Histórico');
    expect(screen.getByText('O que você viveu')).toBeTruthy();
    expect(screen.getByText(/levou a melhor no pedaço/)).toBeTruthy();
  });
});
