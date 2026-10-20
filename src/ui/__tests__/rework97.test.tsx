// @vitest-environment jsdom
/**
 * REWORK 9.7 — Auditoria geral (a interface).
 *
 * EDU-04: o boletim separa a NOTA (o desempenho do ano, à mão, na escala do país) do CONHECIMENTO (o domínio, impresso,
 * que cresce com a vida). Aos 16, a nota escrita continua de 0 a 10; o histórico mostra notas, não o domínio.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { precarregar } from '../App';
import { criarRng } from '../../motor/rng';
import { transacao } from '../../motor/nucleo';
import { avancarAno } from '../../motor/ano';
import { executar } from '../../motor/acoes';
import { nova } from '../../motor/__tests__/ajuda';
import type { Vida } from '../../motor/tipos';
import { Boletim } from '../jogo/Boletim';

beforeAll(async () => { await precarregar(); });
beforeEach(() => {
  localStorage.clear(); window.scrollTo = () => {};
  const r = criarRng(20261020); vi.spyOn(Math, 'random').mockImplementation(() => r.next());
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function aos(i: number, semente = 97): Vida {
  let v = nova({ semente });
  while (!v.morte && Math.floor((v.t - v.eu.tNasc) / 12) < i) {
    v = avancarAno(v).vida;
    for (let k = 0; k < 12 && v.momento; k++) v = executar(v, { tipo: 'decidir', opcaoId: (v.momento.opcoes.find(o => !o.bloqueio) ?? v.momento.opcoes[0]).id }).vida;
  }
  return transacao(v, x => { x.momento = null; }).vida;
}

describe('EDU-04 · o boletim: nota do ano × conhecimento', () => {
  it('aos 16, as notas escritas à mão ficam de 0 a 10 — e o conhecimento, impresso, é outro número', () => {
    const v = aos(16);
    if (!v.educacao.basica || v.educacao.evadiu) return;
    render(<main><Boletim vida={v} /></main>);
    const b = document.querySelector('.boletim')!;
    const notas = [...b.querySelectorAll('.boletim__nota-materia .manuscrito')].map(n => Number(n.textContent!.replace(',', '.')));
    expect(notas.length).toBeGreaterThan(0);
    for (const n of notas) { expect(n).toBeGreaterThanOrEqual(0); expect(n).toBeLessThanOrEqual(10); }
    const dominios = [...b.querySelectorAll('.boletim__conhecimento')].map(n => Number(n.getAttribute('data-agora')));
    // aos 16, o domínio das matérias já passou de 10: se ele fosse a "nota", a nota teria passado da escala
    expect(Math.max(...dominios)).toBeGreaterThan(10);
    expect(b.textContent).toMatch(/Nota/);
    expect(b.textContent).toMatch(/Conhecimento/);
    // a média do ano também na escala
    const media = Number(b.querySelector('[data-nota="escola"] .manuscrito')!.textContent!.replace(',', '.'));
    expect(media).toBeLessThanOrEqual(10);
  });

  it('o histórico ano a ano mostra notas (0 a 10), não o domínio', () => {
    const v = aos(14, 98);
    if (!v.educacao.basica || v.educacao.evadiu) return;
    render(<main><Boletim vida={v} /></main>);
    const celulas = [...document.querySelectorAll('.boletim__tabela--historico tbody td')].map(td => td.textContent!).filter(t => t !== '—');
    expect(celulas.length).toBeGreaterThan(0);
    for (const t of celulas) expect(Number(t.replace(',', '.'))).toBeLessThanOrEqual(10);
  });
});
