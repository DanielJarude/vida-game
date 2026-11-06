// @vitest-environment jsdom
/** VIDA 12.9 — o calendário do ano: datas que o jogo já tem, nada inventado. */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, within } from '@testing-library/react';
import { adulto } from '../../motor/__tests__/cenarios';
import { transacao } from '../../motor/nucleo';
import { anoDe, mesDe } from '../../motor/tempo';
import { Calendario, datasDoAno } from '../jogo/Calendario';
import { Encontros } from '../jogo/Encontros';

afterEach(cleanup);

describe('12.9 · calendário', () => {
  it('o meu aniversário, os das pessoas próximas e os feriados do Brasil, no mês certo', () => {
    const v = adulto(30, { semente: 1295, municipioId: 'sao-paulo-sp' });
    const d = datasDoAno(v);
    expect(d.find(x => x.tipo === 'meu')!.mes).toBe(mesDe(v.eu.tNasc));
    const mae = Object.values(v.vinculos).find(x => x.parentesco === 'mae' && v.pessoas[x.pessoaId]?.vivo);
    if (mae) expect(d.some(x => x.pessoaId === mae.pessoaId && x.tipo === 'aniversario' && x.mes === mesDe(v.pessoas[mae.pessoaId].tNasc))).toBe(true);
    expect(d.filter(x => x.tipo === 'feriado').map(x => x.texto)).toEqual(expect.arrayContaining(['Natal', 'Tiradentes', 'Carnaval']));
    // o que "aconteceu" vem só da biografia deste ano
    for (const x of d.filter(y => y.tipo === 'aconteceu')) expect(v.biografia.some(e => e.texto === x.texto && anoDe(e.t) === anoDe(v.t))).toBe(true);
  });
  it('a tela mostra os 12 meses e destaca o atual', () => {
    const v = adulto(30, { semente: 1295, municipioId: 'sao-paulo-sp' });
    const { container } = render(<Calendario vida={v} />);
    expect(container.querySelectorAll('.calendario__mes').length).toBe(12);
    expect(container.querySelector(`.calendario__mes--agora[data-mes="${mesDe(v.t)}"]`)).toBeTruthy();
  });
  it('a tela dos encontros lista os tipos e explica o que não dá', () => {
    const v = transacao(adulto(30, { semente: 1295, municipioId: 'sao-paulo-sp' }), x => { x.financas.conta = 100000; }).vida;
    const { container } = render(<Encontros vida={v} agir={() => true} />);
    expect(container.querySelector('[data-encontro="jantar"]')).toBeTruthy();
    const piscina = container.querySelector('[data-encontro="piscina"]') as HTMLElement;
    expect(within(piscina).getByText(/não tem onde/)).toBeTruthy();
  });
});
