// @vitest-environment jsdom
/**
 * REWORK 12.25 — as telas do Submundo vivo: uma tela só, sem a introdução para quem já tem história (UI-12.25-01); as
 * partes (visão geral, carreira, atividades, contatos, organizações, negócios, Justiça, histórico); as propostas com o
 * risco dito antes; as ações dos contatos (NPC-12.25-01) e das organizações (ORG-12.25-01); as etapas da Justiça e a
 * audiência; o dinheiro por fora no painel financeiro (FIN-12.25-01).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useState, type ReactNode } from 'react';
import { criarRng, rngDe } from '../../motor/rng';
import { adulto } from '../../motor/__tests__/cenarios';
import { executar, type Acao } from '../../motor/acoes';
import { transacao } from '../../motor/nucleo';
import { entrar } from '../../motor/sistemas/ilicito';
import { criarContato } from '../../motor/sistemas/submundo';
import { garantirCidade, orgsDaCidade, relacaoCom, orgViva } from '../../motor/sistemas/faccoes';
import { proporEncomenda } from '../../motor/sistemas/encomendas';
import { abrirProcesso } from '../../motor/sistemas/justica';
import { movimentoPorFora } from '../../motor/sistemas/porFora';
import { fecharExtrato } from '../../motor/sistemas/extrato';
import type { Vida } from '../../motor/tipos';
import { SubmundoVivo } from '../jogo/SubmundoVivo';
import { PaginaCaminhos } from '../jogo/CaminhosDaVida';
import { ODinheiro } from '../jogo/Dinheiro';

beforeEach(() => {
  localStorage.clear();
  window.scrollTo = () => {};
  const r = criarRng(20261025);
  vi.spyOn(Math, 'random').mockImplementation(() => r.next());
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const nada = () => true;
function Palco({ inicial, Tela }: { inicial: Vida; Tela: (p: { vida: Vida; agir: (a: Acao) => boolean }) => ReactNode }) {
  const [v, setV] = useState(inicial);
  return <main><Tela vida={v} agir={a => { setV(executar(v, a).vida); return true; }} /></main>;
}
function noCaminho(cat: 'patrimonial' | 'mercado' | 'grupo' = 'patrimonial', semente = 41): Vida {
  const v = adulto(30, { semente, municipioId: 'sao-paulo-sp' });
  v.financas.conta = 200_000; v.financas.dividas = []; v.momento = null; delete v.fila; v.justica = undefined;
  return transacao(v, (x, r) => { entrar(x, cat, undefined, r); garantirCidade(x); }).vida;
}
const aba = (nome: string) => fireEvent.click(screen.getByRole('tab', { name: new RegExp(`^${nome}`) }));

describe('UI-12.25-01 · uma tela só', () => {
  it('quem nunca entrou vê a situação e a porta — e só', () => {
    render(<main><SubmundoVivo vida={adulto(25, { semente: 3 })} agir={nada} /></main>);
    expect(screen.getByRole('heading', { name: 'A porta' })).toBeTruthy();
    expect(screen.queryByRole('tablist')).toBeNull();
  });

  it('quem tem anos de histórico e responde a processo NÃO vê a introdução: vê o estado, as partes e a Justiça', () => {
    const v = transacao(noCaminho('mercado'), (x, r) => { x.t += 48; abrirProcesso(x, r, 'mercado'); x.justica!.prisao = undefined; }).vida;
    render(<main><PaginaCaminhos vida={v} agir={nada} irPara={() => {}} divisao="submundo" parte="agora" irParte={() => {}} /></main>);
    const painel = document.querySelector('[data-divisao="submundo"]') as HTMLElement;
    expect(within(painel).queryByRole('heading', { name: 'A porta' })).toBeNull();
    expect(within(painel).queryByRole('heading', { name: 'À margem e a Justiça' })).toBeNull();
    // REWORK 12.3: as partes novas (o mercado por fora, quando há acesso; os pedidos por fora) entram antes da Justiça.
    expect(within(painel).getAllByRole('tab').map(t => t.textContent?.replace(/\d+$/, '')).filter(t => t !== 'Mercados paralelos')).toEqual(['Visão geral', 'Carreira', 'Atividades', 'Contatos', 'Organizações', 'Negócios', 'Pedidos por fora', 'Justiça', 'Histórico']);
    expect(painel.textContent).toMatch(/respondendo a processo/);
    fireEvent.click(within(painel).getByRole('tab', { name: /^Justiça/ }));
    expect(within(painel).getByRole('list', { name: 'As etapas da Justiça' }).textContent).toMatch(/Processo|Julgamento/);
    expect(within(painel).getByLabelText('O processo')).toBeTruthy();
  });

  it('o carimbo diz o estado de verdade (não "arquivado" para quem está preso)', () => {
    const v = transacao(noCaminho(), x => { x.justica = { antecedentes: [{ t: x.t, categoria: 'patrimonial', desfecho: 'prisao', anos: 3 }], prisao: { tInicio: x.t, tFim: x.t + 24, regime: 'fechado', penaMeses: 36 } }; x.caminhos.envolvimento!.parou = x.t; }).vida;
    render(<main><SubmundoVivo vida={v} agir={nada} /></main>);
    expect(screen.getAllByText('pena em curso').length).toBeGreaterThan(0);
    expect(screen.queryByText('arquivado')).toBeNull();
    expect(screen.getByRole('button', { name: /Escrever para a família/ })).toBeTruthy();
  });
});

describe('as partes: propostas, contatos, organizações, rumo', () => {
  it('a proposta mostra pagamento, chance e risco; aceitar manda a ação; o rumo se escolhe na visão geral', () => {
    const v = transacao(noCaminho(), x => { proporEncomenda(x, rngDe('ui', 1), 'furtos', {}, 1); }).vida;
    const agir = vi.fn(() => true);
    render(<main><SubmundoVivo vida={v} agir={agir} /></main>);
    expect(screen.getByRole('button', { name: /Sair aos poucos/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Ficar na moita/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Uma proposta espera resposta/ }));
    const cartao = screen.getByText(/Chance de dar certo/).closest('li')!;
    expect(cartao.textContent).toMatch(/Paga/);
    expect(cartao.textContent).toMatch(/Se der errado/);
    fireEvent.click(within(cartao as HTMLElement).getByRole('button', { name: 'Aceitar' }));
    expect(agir).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'crime', acao: expect.objectContaining({ area: 'encomenda', oque: 'aceitar' }) }));
  });

  it('os contatos: cada papel com as suas ações; conversar muda a pessoa (e não dá para repetir no ano)', () => {
    let forn = '';
    const v = transacao(noCaminho('mercado'), x => { forn = criarContato(x, 'contrabando', 'fornecedor'); x.caminhos.envolvimento!.fichas![forn].confianca = 50; }).vida;
    render(<Palco inicial={v} Tela={SubmundoVivo} />);
    aba('Contatos');
    const nome = v.pessoas[forn].nome;
    const cartao = screen.getAllByText(nome).map(x => x.closest('li')).find(Boolean) as HTMLElement;
    expect(within(cartao).getByRole('button', { name: /Negociar o preço do próximo lote/ })).toBeTruthy();
    fireEvent.click(within(cartao).getByRole('button', { name: `Conversar com ${nome}` }));
    expect(screen.queryByRole('button', { name: `Conversar com ${nome}` })?.hasAttribute('disabled') ?? true).toBe(true);
  });

  it('as organizações: o vínculo (aliado não é de dentro), o posto e a hierarquia, a disputa com as opções', () => {
    const v = transacao(noCaminho('grupo', 31), x => {
      const o = orgsDaCidade(x).find(z => z.ramo === 'organizado')!;
      const rel = relacaoCom(x, o); rel.relacao = 'membro'; rel.nivel = 4; rel.lealdade = 70;
      orgViva(x, o.id)!.disputa = { t: x.t, candidatos: [orgViva(x, o.id)!.quadro[1].id, orgViva(x, o.id)!.quadro[2].id], motivo: 'quem mandava morreu' };
    }).vida;
    render(<main><SubmundoVivo vida={v} agir={nada} /></main>);
    aba('Organizações');
    expect(screen.getAllByText(/na liderança|de dentro/).length).toBeGreaterThan(0);
    const disputa = screen.getByRole('group', { name: /^A disputa n[oa]s? / });
    expect(within(disputa).getAllByRole('button', { name: /^Apoiar/ }).length).toBe(2);
    expect(within(disputa).getByRole('button', { name: 'Ficar de fora' })).toBeTruthy();
    expect(screen.getAllByRole('table').length).toBeGreaterThan(0);
  });
});

describe('FIN-12.25-01 · o dinheiro por fora no painel financeiro', () => {
  it('o painel diz quanto entrou por fora no ano (não como salário), e o extrato tem um grupo próprio', () => {
    const v = transacao(noCaminho(), x => { movimentoPorFora(x, 'encomendas', 18_000); movimentoPorFora(x, 'custos', -2_000); fecharExtrato(x); }).vida;
    render(<main><ODinheiro vida={v} agir={nada} /></main>);
    expect(screen.getByText(/Por fora, no último ano: entraram/)).toBeTruthy();
    expect(screen.getByText(/Não é renda do mês/)).toBeTruthy();
    expect(document.body.textContent).toMatch(/Por fora \(o Submundo\)|Por fora: pagamentos por encomendas/);
  });
});
