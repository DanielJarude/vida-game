// @vitest-environment jsdom
/**
 * VIDA 29 — os brincos e os acessórios na Aparência.
 *
 * O defeito que voltou depois da VIDA 28: a LUPA da orelha ("A orelha de perto", em Piercings) só conhecia os brincos
 * antigos e os da VIDA 13; os 77 do catálogo de joias (VIDA 20) caíam no mesmo aro genérico — e o cabelo solto da lupa
 * cobria o lóbulo. E os acessórios: espalhados entre Roupas e Piercings, e a parte sem peça sumia da tela.
 */
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { createElement, useState, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { adulto } from '../../motor/__tests__/cenarios';
import { executar, type Acao } from '../../motor/acoes';
import type { Vida } from '../../motor/tipos';
import { ITENS_ESTILO } from '../../motor/dados/estilo';
import { OrelhaDePerto } from '../avatar/piercings';
import { Retrato } from '../avatar/Retrato';
import { AparenciaEEstilo } from '../jogo/Aparencia';
import { FiguraSobDemanda } from '../avatar/figuraSobDemanda';

afterEach(cleanup);
beforeAll(async () => { await FiguraSobDemanda.precarregar(); });

const BRINCOS = (ITENS_ESTILO as unknown as { id: string; lugar?: string }[]).filter(x => x.lugar === 'orelha').map(x => x.id);
const lupa = (brinco: string, cabelo?: string) => renderToStaticMarkup(createElement(OrelhaDePerto, { brinco, pele: '#d9a37a', sombra: '#c48c62', cabelo }));
const semMarcas = (s: string) => s.replace(/ data-[a-z-]+="[^"]*"/g, '');

function Ligado({ v0, tela }: { v0: Vida; tela: (v: Vida, agir: (a: Acao) => boolean) => ReactElement }) {
  const [v, setV] = useState(v0);
  return tela(v, a => { const r = executar(v, a); setV(r.vida); return !r.aviso || r.aviso.tom !== 'ruim'; });
}

describe('VIDA 29 · a lupa da orelha mostra o brinco que está na orelha', () => {
  it('cada brinco do catálogo tem desenho próprio na lupa — nenhum cai no aro genérico', () => {
    expect(BRINCOS.length).toBeGreaterThan(80);
    const desenhos = new Set<string>();
    for (const id of BRINCOS) {
      const html = lupa(id);
      if (id !== 'brincos') expect(html, id).not.toMatch(/data-brinco="simples"/);
      desenhos.add(semMarcas(html));
    }
    expect(desenhos.size).toBe(BRINCOS.length);
  });
  it('com o cabelo solto, o brinco vem depois do cabelo (visível); e a lupa desenha o mesmo modelo que o retrato', () => {
    for (const id of ['j20_argola_grossa_folheado', 'j20_brinco_ponto_titanio_zirconia', 'brincos_alargador', 'brincos_ouro']) {
      const html = lupa(id, '#2b1d16');
      expect(html.indexOf('data-brinco'), id).toBeGreaterThan(html.indexOf('data-cabelo-cobre'));
      const naLupa = /data-brinco="([^"]+)"/.exec(html)![1];
      const noRetrato = /data-brinco="([^"]+)"/.exec(renderToStaticMarkup(createElement(Retrato, { visual: { pele: 'p3', cabelo: 'longo_liso', corCabelo: 'preto', olhos: 'castanho', brincos: true, modeloBrincos: id }, genero: 'feminino', idade: 26, tamanho: 120 })))![1];
      expect(naLupa, id).toBe(noRetrato);
    }
  });
});

describe('VIDA 29 · Acessórios e joias: uma categoria, todas as partes', () => {
  it('as partes de acessório aparecem mesmo sem peça; comprar, trocar e tirar o brinco muda a figura', () => {
    let v = adulto(26, { semente: 2911, genero: 'feminino' });
    v.financas.conta = 1e6; v.eu.visual.cabelo = 'longo_liso';
    for (const id of ['j20_argola_grossa_folheado', 'j20_brinco_ponto_titanio_zirconia', 'relogio']) { v = executar(v, { tipo: 'comprar_item', itemId: id }).vida; v.anoAtual = { acoes: [] }; }
    render(<Ligado v0={v} tela={(vv, agir) => <AparenciaEEstilo vida={vv} agir={agir} irPara={() => {}} />} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Acessórios e joias' }));
    const partes = [...document.querySelectorAll('[data-parte]')].map(x => x.getAttribute('data-parte'));
    expect(partes).toEqual(expect.arrayContaining(['cabeca', 'rosto', 'bolsa', 'pulso', 'pulseira', 'anel', 'joia', 'orelha', 'tornozelo']));
    const cabeca = document.querySelector('[data-parte="cabeca"]') as HTMLElement;
    expect(within(cabeca).getByText(/nenhum seu ainda/)).toBeTruthy();
    const figura = () => [...new Set([...document.querySelectorAll('svg.figura [data-brinco]')].map(x => x.getAttribute('data-brinco')))];
    expect(figura()).toEqual(['brinco_ponto']);
    const orelha = () => document.querySelector('[data-parte="orelha"]') as HTMLElement;
    fireEvent.click(within(orelha()).getByRole('button', { name: /^Usar argola grossa/ }));
    expect(figura()).toEqual(['argola_grossa']);
    fireEvent.click(within(orelha()).getByRole('button', { name: 'Tirar' }));
    expect(figura()).toEqual([]);
  });
});
