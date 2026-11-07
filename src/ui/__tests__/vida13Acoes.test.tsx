// @vitest-environment jsdom
/**
 * VIDA 13 · Ações — a interface do fluxo uma-de-cada-vez (o resultado antes da próxima decisão, recarregar no meio,
 * deixar o resto para depois), a lista de ações em contextos e os estados dos botões de ação.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { App, precarregar } from '../App';
import { criarRng } from '../../motor/rng';
import { adulto } from '../../motor/__tests__/cenarios';
import { transacao } from '../../motor/nucleo';
import type { Vida } from '../../motor/tipos';
import { CATALOGO } from '../../motor/conteudo/catalogo';
import { abrirProximaDaFila, familiaDe, preparar } from '../../motor/conteudo/motor';
import { AcoesVivas, BotaoAcao, type AcaoViva } from '../comum';
import { Resultado } from '../jogo/Momento';
import { grupoDaAcao13 } from '../gruposDeAcoes13';

beforeAll(async () => { await precarregar(); });
beforeEach(() => { localStorage.clear(); window.scrollTo = () => {}; const r = criarRng(1307); vi.spyOn(Math, 'random').mockImplementation(() => r.next()); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

/** Um ano com três decisões sem papéis: a primeira aberta, duas esperando a vez. */
function anoCom3(): { v: Vida; titulos: string[] } {
  const v0 = adulto(34, { semente: 7 });
  const ids: string[] = []; const fams = new Set<string>();
  for (const c of CATALOGO) {
    if (c.tipo !== 'decisao' || c.papeis || c.manual || fams.has(familiaDe(c.id)) || !preparar(c, v0, criarRng(1))) continue;
    ids.push(c.id); fams.add(familiaDe(c.id));
    if (ids.length === 3) break;
  }
  const v = transacao(v0, x => { x.momento = null; x.fila = ids.map((id, k) => ({ id, t: x.t, papeis: {}, prioridade: 3 - k })); abrirProximaDaFila(x); }).vida;
  return { v, titulos: [v.momento!.titulo] };
}
function abrir(v: Vida | null) {
  if (v) localStorage.setItem('VIDA_GAME_SAVE_V1', JSON.stringify(v));
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /Continuar a vida/ }));
}
const folha = () => document.querySelector('.folha') as HTMLElement;
const escolherPrimeira = () => fireEvent.click(folha().querySelector('.momento .opcao:not([disabled])')!);

describe('VIDA 13 · decisões do ano, uma de cada vez', () => {
  it('o resultado aparece antes da próxima; recarregar no meio mostra o mesmo resultado; a próxima vem depois', () => {
    const { v, titulos } = anoCom3();
    abrir(v);
    expect(within(folha()).getByRole('heading', { name: titulos[0] })).toBeTruthy();
    escolherPrimeira();
    // O resultado da primeira — não a segunda decisão por cima dele.
    expect(folha().querySelector('.momento .opcao')).toBeNull();
    expect(folha().textContent).toMatch(/Você escolheu/);
    expect(folha().textContent).toMatch(/Ainda há mais 2 decisões neste ano/);
    const texto = folha().querySelector('.momento__resultado')!.textContent;
    expect(screen.getByRole('button', { name: /Viver mais um ano/ })).toHaveProperty('disabled', true);
    // Recarregar a página: o mesmo resultado, nada refeito.
    const salvo = localStorage.getItem('VIDA_GAME_SAVE_V1')!;
    expect(JSON.parse(salvo).desfecho13.texto).toBe(texto);
    cleanup();
    abrir(null);
    expect(folha().querySelector('.momento__resultado')!.textContent).toBe(texto);
    fireEvent.click(within(folha()).getByRole('button', { name: 'Próxima decisão' }));
    expect(folha().querySelector('.momento .opcao')).not.toBeNull();
    expect(JSON.parse(localStorage.getItem('VIDA_GAME_SAVE_V1')!).desfecho13).toBeUndefined();
  });

  it('deixar o resto para depois: o ano fica livre para seguir', () => {
    const { v } = anoCom3();
    abrir(v);
    escolherPrimeira();
    fireEvent.click(within(folha()).getByRole('button', { name: 'Deixar o resto para depois' }));
    expect(document.querySelector('.folha .momento')).toBeNull();
    expect(screen.getByRole('button', { name: /Viver mais um ano/ })).toHaveProperty('disabled', false);
    expect(document.body.textContent).toMatch(/ficam para o ano que vem/);
  });

  it('o resultado diz o que saiu da conta, como ela ficou e o que esperar', () => {
    render(<Resultado titulo="A reforma" texto="Feito." aoFechar={() => {}} desfecho={{ t: 0, titulo: 'A reforma', texto: 'Feito.', escolha: 'Reformar a cozinha', conta: { antes: 50_000, depois: 38_000 }, dividas: { antes: 0, depois: 9_000 }, esperado: ['A casa vale mais no fechamento do ano.'] }} />);
    const f = folha();
    expect(f.textContent).toMatch(/Você escolheu\s*Reformar a cozinha/);
    expect(f.querySelector('.desfecho__delta--saiu')).not.toBeNull();
    expect(within(f).getByText('Sua conta')).toBeTruthy();
    expect(within(f).getByText('Suas dívidas').parentElement!.querySelector('.desfecho__delta--saiu')).not.toBeNull();
    expect(f.textContent).toMatch(/O que esperar/);
    expect(within(f).getByRole('button', { name: 'Continuar' })).toBeTruthy();
  });
});

describe('VIDA 13 · listas de ações em contextos', () => {
  const pol = (id: string, extra: Partial<AcaoViva> = {}): AcaoViva => ({ id, rotulo: id, acao: { tipo: 'avancar' } as never, ...extra });

  it('a vida pública vem por contexto (mandato, partido, exposição…), as saídas por último; poucas ações ficam numa lista só', () => {
    const acoes = [pol('pol_comunidade'), pol('pol_cargo_projeto_lei', { peso: 8 }), pol('pol_trocar_partido'), pol('pol_deixar', { saida: true }), pol('pol_candidatura'), pol('pol_negociar', { bloqueado: 'Falta dinheiro para a campanha.' })];
    render(<AcoesVivas acoes={acoes} agir={() => true} rotulo="O que dá para fazer na vida pública" />);
    const lista = screen.getByRole('list', { name: 'O que dá para fazer na vida pública' });
    const titulos = [...lista.querySelectorAll('.acoes13__titulo')].map(x => x.firstChild!.textContent);
    expect(titulos).toEqual(['Mandato e governo', 'Campanha e eleições', 'Partido', 'Relações políticas', 'Exposição pública', 'Saídas']);
    expect(screen.getByRole('list', { name: 'Partido' })).toBeTruthy();
    // Destaque para o que pesa; a indisponível não é clicável e diz por quê (ligado ao botão).
    expect(screen.getByRole('button', { name: /pol_cargo_projeto_lei/ }).className).toMatch(/acao13--destaque/);
    const bloq = screen.getByRole('button', { name: /pol_negociar/ });
    expect(bloq).toHaveProperty('disabled', true);
    expect(document.getElementById(bloq.getAttribute('aria-describedby')!)!.textContent).toBe('Falta dinheiro para a campanha.');
    cleanup();
    render(<AcoesVivas acoes={acoes.slice(0, 3)} agir={() => true} rotulo="Poucas" />);
    expect(document.querySelector('.acoes13--grupos')).toBeNull();
    expect(screen.getAllByRole('button').length).toBe(3);
  });

  it('cada ação conhecida tem um contexto coerente', () => {
    expect(grupoDaAcao13({ id: 'pres_economia' }).titulo).toBe('Mandato e governo');
    expect(grupoDaAcao13({ id: 'pol_recolher' }).titulo).toBe('Exposição pública');
    expect(grupoDaAcao13({ id: 'promocao' }).titulo).toBe('Crescer na carreira');
    expect(grupoDaAcao13({ id: 'ritmo_puxado' }).titulo).toBe('O dia a dia');
    expect(grupoDaAcao13({ id: 'sair', saida: true }).titulo).toBe('Saídas');
    expect(grupoDaAcao13({ id: 'algo_novo' }).titulo).toBe('Outras');
  });

  it('o botão de ação: o motivo da indisponibilidade ligado a ele; o "feito" depois do clique', () => {
    const v = transacao(adulto(30, { semente: 4 }), x => { x.momento = null; delete x.fila; x.financas.conta = 0; x.financas.investimentos = []; }).vida;
    render(<BotaoAcao vida={v} acao={{ tipo: 'investir', destino: 'reserva', valor: 1_000_000 }} agir={() => true}>Investir</BotaoAcao>);
    const b = screen.getByRole('button', { name: 'Investir' });
    expect(b).toHaveProperty('disabled', true);
    expect(document.getElementById(b.getAttribute('aria-describedby')!)!.className).toMatch(/acao__motivo/);
    cleanup();
    const w = transacao(v, x => { x.financas.conta = 50_000; }).vida;
    render(<BotaoAcao vida={w} acao={{ tipo: 'investir', destino: 'reserva', valor: 1_000 }} agir={() => true}>Investir</BotaoAcao>);
    fireEvent.click(screen.getByRole('button', { name: 'Investir' }));
    expect(screen.getByRole('status').textContent).toMatch(/Feito/);
  });
});
