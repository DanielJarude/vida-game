// @vitest-environment jsdom
/**
 * REWORK 10 — Uma vida de possibilidades (a interface).
 *
 *   UX-13  cada área com a cabeça (onde · situação · há pouco · próximo passo) e as páginas longas em partes
 *          (História: Agora × Biografia; Você: cinco partes, todas na página, uma à vista)
 *   UX-14  Pessoas como álbum (filtros que atravessam os grupos) e a ficha em três partes, com as ações por situação
 *   CRI-01 a tela "À margem e a Justiça": a trajetória, o processo como ficha, a ficha de antecedentes
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { precarregar } from '../App';
import { criarRng } from '../../motor/rng';
import { transacao } from '../../motor/nucleo';
import { adulto, pessoaNova } from '../../motor/__tests__/cenarios';
import { vincular } from '../../motor/pessoas';
import { entrar } from '../../motor/sistemas/ilicito';
import { abrirProcesso } from '../../motor/sistemas/justica';
import type { Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { Pessoas } from '../jogo/Pessoas';
import { Voce } from '../jogo/Voce';
import { Historia } from '../jogo/Historia';
import { AMargem } from '../jogo/Margem';

beforeAll(async () => { await precarregar(); });
beforeEach(() => {
  localStorage.clear(); window.scrollTo = () => {};
  const r = criarRng(20261021); vi.spyOn(Math, 'random').mockImplementation(() => r.next());
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

let BASE: string | undefined;
const base = (): Vida => { BASE ??= JSON.stringify(adulto(30, { semente: 101 })); return JSON.parse(BASE) as Vida; };
const nada = (_a: Acao) => true;

describe('UX-13 · as áreas em partes, com a cabeça', () => {
  it('História: o "Agora" tem o retrato e os últimos anos; a "Biografia" tem a Linha da Vida inteira com os fios', () => {
    const v = base();
    const { rerender } = render(<main><Historia vida={v} marca={0} parte="agora" irParte={() => {}} irPara={() => {}} abrirPessoa={() => {}} /></main>);
    expect(screen.getByRole('tab', { name: 'Agora' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('region', { name: 'A vida agora' })).toBeTruthy();
    expect(screen.queryByRole('group', { name: 'Ver a história por um fio' })).toBeNull();
    rerender(<main><Historia vida={v} marca={0} parte="biografia" irParte={() => {}} irPara={() => {}} abrirPessoa={() => {}} /></main>);
    expect(screen.getByRole('group', { name: 'Ver a história por um fio' })).toBeTruthy();
  });

  it('Você: cinco partes, todas na página; só uma à vista (as outras com a classe de fora)', () => {
    render(<main><Voce vida={base()} agir={nada} irPara={() => {}} abrirPessoa={() => {}} /></main>);
    const abas = within(screen.getByRole('navigation', { name: 'Partes do retrato' })).getAllByRole('tab');
    expect(abas.map(a => a.textContent?.replace(/\d+$/, ''))).toEqual(['Resumo', 'Saúde', 'Habilidades', 'Aparência', 'No mundo']);
    expect(document.querySelectorAll('.voce__parte').length).toBe(5);
    expect(document.querySelectorAll('.voce__parte:not(.voce__parte--fora)').length).toBe(1);
    fireEvent.click(abas[3]);
    expect(document.querySelector('.voce__parte--aparencia')!.classList.contains('voce__parte--fora')).toBe(false);
  });
});

describe('UX-14 · Pessoas: o álbum e a ficha', () => {
  function comAmigoTenso(): { v: Vida; id: string } {
    let id = '';
    const v = transacao(base(), x => {
      const p = pessoaNova(x, 30, 'masculino');
      const vin = vincular(x, p, { origem: 'escola', proximidade: 50, estagio: 'amigo' });
      vin.tensao = 70; vin.conflito = { t: x.t - 2, assunto: 'dinheiro', gravidade: 2, quem: 'outro' };
      id = p.id;
    }).vida;
    return { v, id };
  }

  it('a cabeça diz quem está em conflito e o tempo para as pessoas; o filtro "Em conflito" mostra só quem está', () => {
    const { v, id } = comAmigoTenso();
    render(<Pessoas vida={v} agir={nada} aberta={null} abrir={() => {}} />);
    expect(screen.getByText('Em conflito', { selector: 'dt' })).toBeTruthy();
    expect(screen.getByText('Tempo para as pessoas', { selector: 'dt' })).toBeTruthy();
    fireEvent.click(within(screen.getByRole('group', { name: 'Mostrar no álbum' })).getByRole('button', { name: /Em conflito/ }));
    const album = screen.getByRole('region', { name: /Álbum: Em conflito/ });
    expect(album.textContent).toContain(v.pessoas[id].nome);
  });

  it('a ficha: três partes; o conflito pendente aparece; as ações negativas ficam em "Confrontar"', () => {
    const { v, id } = comAmigoTenso();
    render(<Pessoas vida={v} agir={nada} aberta={id} abrir={() => {}} />);
    const ficha = screen.getByRole('dialog');
    expect(within(ficha).getAllByRole('tab').map(t => t.textContent)).toEqual(['Agora', 'Vocês dois', `Quem é ${v.pessoas[id].nome}`]);
    expect(within(ficha).getByRole('note', { name: 'Conflito pendente' }).textContent).toMatch(/dinheiro/);
    const confrontar = [...ficha.querySelectorAll('details.ficha__categoria')].find(d => /^Confrontar/.test(d.querySelector('summary')!.textContent ?? ''))!;
    expect(within(confrontar as HTMLElement).getByRole('button', { name: /Ofender/ })).toBeTruthy();
    expect(within(confrontar as HTMLElement).getByRole('button', { name: /Partir para a briga/ })).toBeTruthy();
  });
});

describe('CRI-01 · À margem e a Justiça', () => {
  it('quem nunca teve nada com isso não vê a tela', () => {
    const { container } = render(<main><AMargem vida={base()} agir={nada} /></main>);
    expect(container.textContent).toBe('');
  });

  it('a trajetória e as saídas; o processo como ficha (provas, defesa) com as decisões do jogador', () => {
    const v = transacao(base(), (x, r) => { entrar(x, 'mercado', undefined, r); x.caminhos.envolvimento!.nivel = 2; }).vida;
    render(<main><AMargem vida={v} agir={nada} /></main>);
    expect(screen.getByRole('heading', { name: 'À margem e a Justiça' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Pedir ajuda para sair' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Negociar a saída com o grupo' })).toBeTruthy();
    cleanup();
    const w = transacao(v, (x, r) => { abrirProcesso(x, r, 'mercado'); }).vida;
    render(<main><AMargem vida={w} agir={nada} /></main>);
    const ficha = screen.getByLabelText('O processo');
    expect(ficha.textContent).toMatch(/As provas contra você são/);
    expect(ficha.textContent).toMatch(/Defensoria Pública|advogado particular/);
    expect(within(ficha).getByRole('button', { name: /Assumir o que fez/ })).toBeTruthy();
  });
});

import { Apostas } from '../jogo/Apostas';

describe('JOG-01 · as mesas', () => {
  it('a loteria: seis números marcados, a compra manda a ação com os números; as regras dizem as chances', () => {
    const v = transacao(base(), x => { x.financas.conta = 5000; }).vida;
    const agir = vi.fn(() => true);
    render(<main><Apostas vida={v} agir={agir} /></main>);
    const grade = screen.getByRole('group', { name: 'Escolha seis números' });
    for (const n of ['03', '08', '15', '22', '31', '40']) fireEvent.click(within(grade).getByRole('button', { name: n }));
    fireEvent.click(screen.getByRole('button', { name: /Comprar e conferir/ }));
    expect(agir).toHaveBeenCalledWith({ tipo: 'aposta', op: { jogo: 'loteria', numeros: [3, 8, 15, 22, 31, 40] } });
    expect(screen.getByText(/devolve 41,3%/)).toBeTruthy();
  });

  it('o blackjack: com a mão na mesa, só pedir, parar e dobrar (não há botão de divisão sem regra); a carta da banca fica virada', () => {
    const v = transacao(base(), x => { x.financas.conta = 5000; x.apostas = { ultimas: [], ano: { t: x.t, apostado: 100, recebido: 0 }, total: { apostado: 100, recebido: 0 }, mao: { aposta: 100, voce: [{ v: 5, n: 'copas' }, { v: 6, n: 'paus' }], banca: [{ v: 10, n: 'ouros' }, { v: 7, n: 'espadas' }], baralho: [{ v: 2, n: 'copas' }], t: x.t } }; }).vida;
    render(<main><Apostas vida={v} agir={() => true} /></main>);
    fireEvent.click(screen.getByRole('tab', { name: 'Blackjack' }));
    expect(screen.getByRole('button', { name: 'Pedir carta' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Parar' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Dobrar/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Dividir|Seguro/ })).toBeNull();
    expect(screen.getByLabelText('carta virada')).toBeTruthy();
  });

  it('menor de idade não vê mesa nenhuma', () => {
    const v = transacao(base(), x => { x.eu.tNasc = x.t - 15 * 12; }).vida;
    render(<main><Apostas vida={v} agir={() => true} /></main>);
    expect(screen.getByText(/maior de idade/)).toBeTruthy();
    expect(screen.queryByRole('tab')).toBeNull();
  });
});
