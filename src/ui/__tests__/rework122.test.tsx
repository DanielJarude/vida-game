// @vitest-environment jsdom
/**
 * REWORK 12.2 — as telas: Objetos mostra o que se comprou para usar (PAT-12.2-01) e o atalho "Ver no patrimônio";
 * o painel do ramo de cada empresa (indicadores próprios, escolhas com a atual marcada, a visão geral de várias);
 * a loja de peças com filtros e a venda sob consulta; a loja de exóticos com o que a lei proíbe; os mercados de
 * procedência incerta; o dossiê com o estágio e os negócios por fora; as fachadas próprias das casas de luxo.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { criarRng } from '../../motor/rng';
import { adulto } from '../../motor/__tests__/cenarios';
import { executar, type Acao } from '../../motor/acoes';
import { transacao } from '../../motor/nucleo';
import { ofertasDeColecao } from '../../motor/sistemas/colecao';
import { entrar } from '../../motor/sistemas/ilicito';
import { criarContato } from '../../motor/sistemas/submundo';
import type { Vida } from '../../motor/tipos';
import { Patrimonio } from '../jogo/Patrimonio';
import { Lugar } from '../jogo/material/Lugares';
import { Compras } from '../jogo/Compras';
import { PainelDoSubmundo } from '../jogo/Submundo';

beforeEach(() => {
  localStorage.clear();
  window.scrollTo = () => {};
  const r = criarRng(20261025);
  vi.spyOn(Math, 'random').mockImplementation(() => r.next());
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function rica(conta = 60_000_000): Vida {
  const v = adulto(40, { municipioId: 'sao-paulo-sp', semente: 41 });
  v.financas.conta = conta;
  v.financas.dividas = [];
  v.momento = null;
  delete v.fila;
  return v;
}
const fazer = (v: Vida, a: Acao) => executar(v, a).vida;

describe('PAT-12.2-01 · Objetos', () => {
  it('o relógio comprado para usar aparece em Objetos, com usar e guardar', () => {
    const v = fazer(rica(200_000), { tipo: 'comprar_item', itemId: 'relogio_luxo' });
    render(<Patrimonio vida={v} agir={() => true} abrir={() => {}} parte="objetos" />);
    expect(screen.getByText('Relógio de luxo')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Guardar|Usar/ })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /^Objetos/ }).textContent).toMatch(/1/);
  });

  it('sem nada, a tela diz onde mora cada tipo de bem (e aponta a coleção, quando há peças)', () => {
    let v = rica();
    v.financas.coisas = [];
    v.eu.estilo = { itens: [] };
    render(<Patrimonio vida={v} agir={() => true} abrir={() => {}} parte="objetos" />);
    expect(screen.getByText(/Onde fica cada coisa/)).toBeTruthy();
    cleanup();
    v = fazer(v, { tipo: 'colecao_comprar', ofertaId: ofertasDeColecao(v, 'relojoaria')[0].id });
    render(<Patrimonio vida={v} agir={() => true} abrir={() => {}} parte="objetos" />);
    expect(screen.getByRole('button', { name: /Coleção →/ })).toBeTruthy();
  });

  it('depois de comprar na ótica e relojoaria, "Ver no patrimônio" leva até Objetos', () => {
    const v = rica(200_000);
    const ver = vi.fn();
    render(<Lugar vida={v} agir={() => true} qual="estilo" aoFechar={() => {}} trocar={() => {}} verNoPatrimonio={ver} />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Comprar' }).find(b => !(b as HTMLButtonElement).disabled)!);
    fireEvent.click(screen.getByRole('button', { name: /Ver no patrimônio/ }));
    expect(ver).toHaveBeenCalledWith('objetos');
  });
});

describe('o painel do ramo', () => {
  it('o restaurante mostra a nota, o conceito e as escolhas com a atual marcada; o zoológico mostra os animais pelo nome', () => {
    let v = rica();
    v = fazer(v, { tipo: 'empresa_abrir', empresa: 'restaurante', comSocio: false });
    v = transacao(v, x => { x.anoAtual.acoes = []; }).vida;
    v = fazer(v, { tipo: 'empresa_abrir', empresa: 'zoologico', comSocio: false });
    render(<Patrimonio vida={v} agir={() => true} abrir={() => {}} parte="empresas" />);
    expect(screen.getAllByText('Nota do público').length).toBe(1);
    expect(screen.getAllByText('Bem-estar').length).toBe(1);
    expect(screen.getByRole('table', { name: /Visão geral: 2 empresas/ })).toBeTruthy();
    const conceito = screen.getByRole('radiogroup', { name: 'Conceito' });
    expect(within(conceito).getAllByRole('radio').filter(r => r.getAttribute('aria-checked') === 'true')).toHaveLength(1);
    const zoo = v.financas.empresas!.find(e => e.tipo === 'zoologico')!;
    // (o nome pode aparecer em mais de um lugar do painel — o animal e a sua história)
    expect(screen.getAllByText(new RegExp(`^${zoo.setor!.zoo!.animais[0].nome}`)).length).toBeGreaterThan(0);
  });
});

describe('lojas', () => {
  it('a relojoaria tem fachada própria em Compras (não é mais a ótica) e a loja filtra por preço, categoria e raridade', () => {
    const v = rica();
    const { container } = render(<Compras vida={v} agir={() => true} abrir={() => {}} />);
    expect(container.querySelector('[data-lugar="relojoaria"]')).toBeTruthy();
    expect(container.querySelector('[data-lugar="galeria"]')).toBeTruthy();
    expect(container.querySelector('[data-lugar="antiquario"]')).toBeTruthy();
    cleanup();
    render(<Lugar vida={v} agir={() => true} qual="relojoaria" aoFechar={() => {}} trocar={() => {}} />);
    const filtros = screen.getByRole('group', { name: 'Filtrar as peças' });
    expect(within(filtros).getByLabelText('Preço')).toBeTruthy();
    expect(within(filtros).getByLabelText('Raridade')).toBeTruthy();
  });

  it('para quem tem fortuna, a relojoaria oferece peças sob consulta (venda privada)', () => {
    let v = rica(400_000_000);
    for (let k = 0; k < 8 && !ofertasDeColecao(v, 'relojoaria').some(o => o.canal === 'privada'); k++) v = transacao(v, x => { x.t += 12; }).vida;
    render(<Lugar vida={v} agir={() => true} qual="relojoaria" aoFechar={() => {}} trocar={() => {}} />);
    expect(screen.getByText(/Sob consulta · venda privada/)).toBeTruthy();
  });

  it('a loja de exóticos diz o que a lei daqui não deixa vender, e as instalações', () => {
    render(<Lugar vida={rica()} agir={() => true} qual="exoticos" aoFechar={() => {}} trocar={() => {}} />);
    expect(screen.getByText('Não se vende aqui')).toBeTruthy();
    expect(screen.getAllByText(/ouriço-pigmeu/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/As instalações/)).toBeTruthy();
  });

  it('a feira mostra o que se vê de cada peça e deixa investigar, comprar e denunciar', () => {
    render(<Lugar vida={rica()} agir={() => true} qual="feira" aoFechar={() => {}} trocar={() => {}} />);
    expect(screen.getAllByText(/O que se vê:/).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /Investigar a procedência/ }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: 'Denunciar' }).length).toBeGreaterThan(0);
  });
});

describe('o dossiê do Submundo', () => {
  it('mostra o estágio e os negócios por fora (com o que abrir)', () => {
    const v = transacao(rica(5_000_000), (x, r) => { entrar(x, 'mercado', undefined, r); for (const s of Object.values(x.caminhos.envolvimento!.especializacoes ?? {})) if (s) s.experiencia = 40; criarContato(x, 'contrabando', 'fornecedor'); }).vida;
    render(<PainelDoSubmundo vida={v} agir={() => true} />);
    expect(screen.getByText(/Gente do ramo|De vez em quando|Primeiro contato/)).toBeTruthy();
    expect(screen.getByText('Negócios por fora')).toBeTruthy();
    expect(screen.getByText('Abrir um negócio por fora')).toBeTruthy();
  });
});
