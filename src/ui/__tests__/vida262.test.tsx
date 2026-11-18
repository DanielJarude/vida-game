// @vitest-environment jsdom
/** VIDA 26.2 — o estilo de luta na tela: sem estilo, a escolha aberta; com estilo, a faixa e a troca com o custo dito antes. */
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import { nova } from '../../motor/__tests__/ajuda';
import { carregarMundo } from '../../motor/mundo/carregar';
import { executar, type Acao } from '../../motor/acoes';
import type { Vida } from '../../motor/tipos';
import { garantirFrente } from '../../motor/sistemas/frentes';
import { EstiloDeLuta26 } from '../v26/lutas/EstiloDeLuta26';

beforeAll(async () => { await carregarMundo(); });
afterEach(() => { cleanup(); });
function lutador(): Vida {
  const v = nova({ semente: 2626, genero: 'feminino' } as never); v.t = v.eu.tNasc + 22 * 12; v.momento = null;
  v.rotinas.push({ id: 'lutas', tInicio: v.t - 48, nivel: 1 }); const f = garantirFrente(v, 'lutas'); f.habilidade = 45; f.meses = 48;
  return v;
}

describe('VIDA 26.2 · o estilo de luta na tela', () => {
  it('sem estilo: a lista aberta; escolher pede confirmar e manda a ação', () => {
    let agiu: Acao | undefined;
    const r = render(<EstiloDeLuta26 vida={lutador()} agir={a => { agiu = a; return true; }} />);
    expect(r.container.textContent).toMatch(/Sem estilo definido/);
    expect(r.container.querySelectorAll('[data-opcao]').length).toBe(7);
    fireEvent.click(within(r.container.querySelector('[data-opcao="muay_thai"]') as HTMLElement).getByRole('radio'));
    fireEvent.click(within(r.container).getByRole('button', { name: 'Escolher Muay Thai' }));
    expect(agiu).toEqual({ tipo: 'luta26', estilo: 'muay_thai' });
  });
  it('com estilo: a faixa, a próxima, e a troca diz a técnica em que começaria', () => {
    const v = executar(lutador(), { tipo: 'luta26', estilo: 'jiu_jitsu' } as Acao).vida;
    const r = render(<EstiloDeLuta26 vida={v} agir={() => true} />);
    expect(r.container.querySelector('[data-faixa]')!.textContent).toMatch(/azul/);
    expect(r.container.textContent).toMatch(/Próxima faixa \(roxa\)/);
    fireEvent.click(within(r.container).getByRole('button', { name: 'Trocar de estilo' }));
    expect(r.container.querySelector('[data-opcao="boxe"]')!.textContent).toMatch(/começaria com técnica/);
    fireEvent.click(within(r.container.querySelector('[data-opcao="boxe"]') as HTMLElement).getByRole('radio'));
    expect(r.container.textContent).toMatch(/a do Jiu-jitsu \(45\) fica guardada/);
  });
});
