// @vitest-environment jsdom
/**
 * 12.4.1 — telas: a loja não perde o lugar depois da compra (a folha não refaz o foco; só a linha comprada muda; os
 * filtros ficam); a aparência de corpo inteiro com a troca peça a peça; os gostos fora de Aparência; a cena do cômodo.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useState, type ReactElement } from 'react';
import { adulto } from '../../motor/__tests__/cenarios';
import { executar, type Acao } from '../../motor/acoes';
import type { Imovel, Vida } from '../../motor/tipos';
import { Lugar, LojaDaVida } from '../jogo/material/Lugares';
import { FiguraSobDemanda } from '../avatar/figuraSobDemanda';
import { beforeAll } from 'vitest';
import { AparenciaEEstilo } from '../jogo/Aparencia';
import { CasaPorDentro } from '../jogo/Personalizar';
import { receberCoisa } from '../../motor/sistemas/coisas';
import { USOS_CASA } from '../../motor/sistemas/usos';

afterEach(cleanup);
beforeAll(async () => { await LojaDaVida.precarregar(); await FiguraSobDemanda.precarregar(); });

function Ligado({ v0, tela }: { v0: Vida; tela: (v: Vida, agir: (a: Acao) => boolean) => ReactElement }) {
  const [v, setV] = useState(v0);
  // Como no jogo: quem abre a folha passa uma função nova de fechar a cada render.
  return tela(v, a => { const r = executar(v, a); setV(r.vida); return !r.aviso || r.aviso.tom !== 'ruim'; });
}

describe('a loja depois da compra', () => {
  it('a folha não volta o foco ao topo; só a linha comprada vira "É seu"; a seção escolhida continua', () => {
    const v = adulto(30, { municipioId: 'sao-paulo-sp' });
    v.financas.conta = 100000;
    render(<Ligado v0={v} tela={(vv, agir) => <Lugar vida={vv} agir={agir} qual="loja:renner" aoFechar={() => {}} trocar={() => {}} />} />);
    const folha = screen.getByRole('dialog');
    fireEvent.click(within(folha).getByRole('radio', { name: 'Calçados' }));
    const linhas = () => [...folha.querySelectorAll('[data-produto]')].map(x => x.getAttribute('data-produto'));
    const antes = linhas();
    expect(antes.length).toBeGreaterThan(3);
    const alvo = folha.querySelector(`[data-produto="${antes[2]}"]`)!;
    const botao = within(alvo as HTMLElement).getByRole('button', { name: 'Comprar' });
    botao.focus();
    fireEvent.click(botao);
    // A lista é a mesma, na mesma ordem; a seção continua "Calçados"; o foco não foi para o primeiro botão da folha.
    expect(linhas()).toEqual(antes);
    expect(within(folha).getByRole('radio', { name: 'Calçados' }).getAttribute('aria-checked')).toBe('true');
    expect(within(folha.querySelector(`[data-produto="${antes[2]}"]`) as HTMLElement).getByText(/É seu/)).toBeTruthy();
    expect(within(folha.querySelector(`[data-produto="${antes[0]}"]`) as HTMLElement).getByRole('button', { name: 'Comprar' })).toBeTruthy();
    expect(document.activeElement).not.toBe(folha.querySelector('button:not([disabled])'));
  });
});

describe('a aparência', () => {
  it('corpo inteiro com as peças em uso; a troca é por parte do corpo e a peça que sai fica guardada', () => {
    const v = adulto(28, { semente: 3 });
    v.financas.conta = 50000;
    let x = executar(v, { tipo: 'comprar_item', itemId: 'jeans' }).vida;
    x = executar(x, { tipo: 'comprar_item', itemId: 'bermuda_sarja' }).vida;
    x = executar(x, { tipo: 'comprar_item', itemId: 'relogio' }).vida;
    render(<Ligado v0={x} tela={(vv, agir) => <AparenciaEEstilo vida={vv} agir={agir} irPara={() => {}} />} />);
    const fig = document.querySelector('svg.figura')!;
    expect(fig.getAttribute('data-pecas')).toMatch(/bermuda/);
    expect(fig.querySelector('[data-acessorio="pulso"]')).toBeTruthy();
    const baixo = document.querySelector('[data-parte="pernas"]') as HTMLElement;
    expect(within(baixo).getByText('Bermuda de sarja')).toBeTruthy();
    // VIDA 12.7: a troca é pelo cartão da parte (com uma peça só para trocar, o botão diz qual).
    fireEvent.click(within(baixo).getByRole('button', { name: 'Vestir calça jeans' }));
    expect(document.querySelector('svg.figura')!.getAttribute('data-pecas')).toMatch(/calca/);
    expect(within(document.querySelector('[data-parte="pernas"]') as HTMLElement).getByRole('button', { name: 'Vestir bermuda de sarja' })).toBeTruthy();
  });
});

describe('a casa', () => {
  it('cada cômodo tem a sua cena, com os acabamentos e os objetos que estão nele', () => {
    const v = adulto(40, { semente: 7 });
    for (const vin of Object.values(v.vinculos)) vin.convivio = vin.convivio.filter(c => c !== 'casa');
    v.financas.conta = 100000; v.financas.coisas = [];
    const casa: Imovel = { id: 'icasa', tipo: 'imovel', modeloId: 'casa_3q', nome: 'casa', valor: 400000, tCompra: v.t - 60, municipioId: v.moradia.municipioId, estado: 80 };
    v.financas.bens = [casa];
    v.moradia = { tipo: 'propria', municipioId: v.moradia.municipioId, imovelId: 'icasa', modeloId: 'casa_3q', aluguel: 0, padrao: 3, tInicio: v.t - 60 };
    receberCoisa(v, 'sofa', 3500);
    render(<CasaPorDentro vida={v} agir={() => true} />);
    const cenas = document.querySelectorAll('svg.cena-comodo');
    expect(cenas.length).toBeGreaterThan(2);
    expect(document.querySelector('svg.cena-comodo [data-coisa="sofa"]')).toBeTruthy();
    expect(USOS_CASA).not.toContain('decorar');
  });
});
