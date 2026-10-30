// @vitest-environment jsdom
/**
 * REWORK 12.3 — as telas: a Justiça separa a defesa (legal) do "por fora dos autos" (ilegal, com selo); o processo diz quem
 * defende, quem paga e quem julga; os pedidos por fora mostram a saída legal; as organizações mostram as relações entre
 * elas e o que o posto permite.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { criarRng, rngDe } from '../../motor/rng';
import { adulto, pessoaNova } from '../../motor/__tests__/cenarios';
import { transacao } from '../../motor/nucleo';
import { entrar } from '../../motor/sistemas/ilicito';
import { criarContato } from '../../motor/sistemas/submundo';
import { garantirCidade, orgsDaCidade, relacaoCom } from '../../motor/sistemas/faccoes';
import { abrirProcesso } from '../../motor/sistemas/justica';
import { vincular } from '../../motor/pessoas';
import type { Vida } from '../../motor/tipos';
import { SubmundoVivo } from '../jogo/SubmundoVivo';

beforeEach(() => {
  localStorage.clear();
  window.scrollTo = () => {};
  const r = criarRng(20261030);
  vi.spyOn(Math, 'random').mockImplementation(() => r.next());
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const nada = () => true;
const aba = (nome: string) => fireEvent.click(screen.getByRole('tab', { name: new RegExp(`^${nome}`) }));

function processado(): Vida {
  const v = adulto(34, { semente: 5, municipioId: 'sao-paulo-sp' });
  v.financas.conta = 400_000; v.momento = null; delete v.fila; v.justica = undefined;
  return transacao(v, (x, r) => {
    entrar(x, 'fraude', undefined, r); garantirCidade(x);
    const id = criarContato(x, 'fraudes', 'intermediario', 70); x.caminhos.envolvimento!.fichas![id].confianca = 70;
    abrirProcesso(x, rngDe('p', 1), 'fraude'); x.justica!.prisao = undefined; x.momento = null; delete x.fila;
  }).vida;
}

describe('REWORK 12.3 · telas', () => {
  it('Justiça: a ficha diz quem defende e quem julga; o "por fora dos autos" é separado e marcado como ilegal', () => {
    render(<main><SubmundoVivo vida={processado()} agir={nada} /></main>);
    aba('Justiça');
    expect(screen.getByText(/Quem julga:/)).toBeTruthy();
    expect(screen.getByText(/A defesa é de/)).toBeTruthy();
    const bloco = screen.getByRole('group', { name: /Por fora dos autos/ });
    expect(bloco.textContent).toMatch(/ilegal/i);
    expect(bloco.textContent).toMatch(/Contratar advogado é outra coisa/);
    expect(screen.getByRole('button', { name: /Contratar um advogado particular/ })).toBeTruthy();
  });
  it('quem nunca entrou vê a porta e os pedidos por fora, com a saída legal ao lado', () => {
    const v = adulto(35, { semente: 9 });
    const amigo = pessoaNova(v, 36); amigo.temperamento.responsabilidade = -0.7;
    vincular(v, amigo, { origem: 'vizinhanca', proximidade: 50, confianca: 60, convivio: ['vizinhanca'] }).confianca = 60;
    render(<main><SubmundoVivo vida={v} agir={nada} /></main>);
    expect(screen.getByRole('heading', { name: 'A porta' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Pedidos por fora' })).toBeTruthy();
    expect(screen.getAllByText(/Saída legal:/).length).toBeGreaterThan(0);
  });
  it('Organizações: as relações entre elas e o que o posto permite', () => {
    const v = transacao(processado(), x => { const o = orgsDaCidade(x)[0]; const rel = relacaoCom(x, o); rel.relacao = 'membro'; rel.nivel = 2; rel.lealdade = 60; }).vida;
    render(<main><SubmundoVivo vida={v} agir={nada} /></main>);
    aba('Organizações');
    expect(screen.getAllByText(/O seu posto permite:/).length).toBeGreaterThan(0);
    expect(document.querySelectorAll('.svivo-relacoes__item').length).toBeGreaterThan(0);
  });
});
