// @vitest-environment jsdom
/** VIDA 29 · o Campo para gente comum: a Visão geral primeiro, cada quadro explicado, o modo simples e o detalhado, a dica de primeira vez, a administração. */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { Campo18 } from '../v18/campo/Campo18';
import { adulto } from '../../motor/__tests__/cenarios';
import { executar, type Acao } from '../../motor/acoes';
import { ofertasRurais } from '../../motor/v18/rural/acoes18';
import { todasAsPropriedades } from '../../motor/v18/rural/fazenda18';
import type { Vida } from '../../motor/tipos';

function usePalco(inicial: Vida) {
  const [v, setV] = useState(inicial);
  const agir = (a: Acao) => { const r = executar(v, a); setV(r.vida); return r.vida !== v; };
  return { v, agir };
}
let ultima: Vida | undefined;
function montar(tipo: string) {
  let v = structuredClone(adulto(35, { semente: 7 }));
  v.financas.conta = 30_000_000;
  v.financas.negativado = false;
  const o = ofertasRurais(v).find(x => x.p.tipo === tipo)!;
  v = executar(v, { tipo: 'rural18', oque: { op: 'comprar', oferta: o.id } }).vida;
  const p = todasAsPropriedades(v)[0].p;
  if (p.uso !== 'producao') v = executar(v, { tipo: 'rural18', oque: { op: 'uso', id: p.id, uso: 'producao' } }).vida;
  function Palco() { const { v: x, agir } = usePalco(v); ultima = x; return <Campo18 vida={x} agir={agir} />; }
  render(<Palco />);
}
beforeEach(() => { localStorage.clear(); ultima = undefined; });
afterEach(() => cleanup());

describe('VIDA 29 · Campo: a Visão geral', () => {
  it('abre na Visão geral com a situação, os números do ano e os quadros explicados', async () => {
    montar('pecuaria');
    expect(screen.getByRole('tab', { name: /Visão geral/ }).getAttribute('aria-selected')).toBe('true');
    for (const n of ['Plantação', 'Animais', 'Construções e equipamentos', 'Administração', 'Finanças']) expect(screen.getByRole('tab', { name: new RegExp(n) })).toBeTruthy();
    expect(document.querySelector('.campo29__situacao')).toBeTruthy();
    expect(screen.getByText('Num ano normal')).toBeTruthy();
    const quadros = screen.getByRole('list', { name: 'Como está cada parte' });
    const solo = quadros.querySelector('[data-indicador="solo"]')!;
    expect(within(solo as HTMLElement).getByText('O que significa')).toBeTruthy();
    expect(within(solo as HTMLElement).getByText('Se piorar')).toBeTruthy();
    // Sem jargão no modo simples: nenhum número em "UA" (a sigla só aparece explicada) nem "pede correção".
    const painel = document.getElementById('campo18-painel')!;
    expect(painel.textContent).not.toMatch(/\d UA\b/);
    expect(painel.textContent).not.toMatch(/pede correção/);
    const pasto = quadros.querySelector('[data-indicador="pasto"]');
    if (pasto) expect(pasto.textContent).toMatch(/sustenta cerca de/);
  });

  it('a dica de primeira vez some com "Entendi" e não volta; o modo detalhado mostra os números técnicos', async () => {
    montar('pecuaria');
    expect(screen.getByText(/Primeira vez aqui\?/)).toBeTruthy();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Entendi' })); });
    expect(screen.queryByText(/Primeira vez aqui\?/)).toBeNull();
    expect(localStorage.getItem('VIDA_campo29_dica_visao')).toBe('1');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Modo simples/ })); });
    expect(screen.getByRole('button', { name: /Modo detalhado/ }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getAllByText('Nos números').length).toBeGreaterThan(0);
    expect(document.getElementById('campo18-painel')!.textContent).toMatch(/\d UA\b/);
  });

  it('Administração: escolher a administradora muda quem cuida e o custo do ano (o mesmo motor)', async () => {
    montar('agricola');
    await act(async () => { fireEvent.click(screen.getByRole('tab', { name: /Administração/ })); });
    const item = screen.getByText('Administradora rural').closest('li')!;
    await act(async () => { fireEvent.click(within(item as HTMLElement).getByRole('button', { name: 'Escolher' })); });
    expect(todasAsPropriedades(ultima!)[0].p.admin29).toBe('empresa');
    expect(screen.getAllByText(/uma administradora rural/).length).toBeGreaterThan(0);
    await act(async () => { fireEvent.click(screen.getByRole('tab', { name: /Finanças/ })); });
    expect(screen.getAllByText('Administradora rural').length).toBeGreaterThan(0);
  });
});
