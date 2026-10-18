// @vitest-environment jsdom
/**
 * REWORK 9 — A vida organizada (a interface).
 *
 * Fase 0 · SOC-01: o celular mostra de onde veio o público — e o que mostra
 * é exatamente o balanço que o motor guardou (a conta fecha).
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { precarregar } from '../App';
import { criarRng } from '../../motor/rng';
import { avancarAno } from '../../motor/ano';
import { executar, type Acao } from '../../motor/acoes';
import { transacao } from '../../motor/nucleo';
import { adulto } from '../../motor/__tests__/cenarios';
import { contaAtiva, fimDoBalanco, seguidoresEmPalavras } from '../../motor/sistemas/redesBase';
import type { Vida } from '../../motor/tipos';
import { RedesSociais } from '../jogo/Redes';

beforeAll(async () => { await precarregar(); });
beforeEach(() => {
  localStorage.clear(); window.scrollTo = () => {}; window.confirm = () => true;
  window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as never;
  const r = criarRng(20261017); vi.spyOn(Math, 'random').mockImplementation(() => r.next());
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const rede = (oque: string, extra: Record<string, unknown> = {}) => ({ tipo: 'rede', op: { oque, plataforma: 'instagram', ...extra } }) as Acao;

describe('SOC-01 · o balanço do público no celular', () => {
  it('as parcelas mostradas são as do motor, e a conta fecha', () => {
    let v: Vida = adulto(28, { semente: 31 });
    v = transacao(v, x => { x.financas.conta = 1e6; x.notoriedade = { valor: 55, pico: 55, t: x.t, fonte: 'arte', origens: { arte: 55 } }; }).vida;
    v = executar(v, rede('criar')).vida;
    v = executar(v, rede('publicar', { tema: 'cotidiano' })).vida;
    v = avancarAno(v).vida;
    v.momento = null;
    const c = contaAtiva(v, 'instagram')!;
    const b = c.anos![c.anos!.length - 1];
    expect(fimDoBalanco(b)).toBe(b.fim);
    render(<main><RedesSociais vida={v} agir={() => true} /></main>);
    const caixa = screen.getByRole('region', { name: 'De onde veio o público' });
    expect(within(caixa).getByText(seguidoresEmPalavras(b.fim!))).toBeTruthy();
    const valor = (id: string) => caixa.querySelector(`[data-parcela="${id}"] .balanco-publico__valor`)?.textContent;
    if (b.publicacoes) expect(valor('publicacoes')).toBe(`+${seguidoresEmPalavras(b.publicacoes)}`);
    if (b.exposicao) expect(valor('exposicao')).toBe(`+${seguidoresEmPalavras(b.exposicao)}`);
    if (b.perdas) expect(valor('perdas')).toBe(`−${seguidoresEmPalavras(b.perdas)}`);
    expect(b.exposicao).toBeGreaterThan(0);
    expect(within(caixa).getByText(/pelo nome, fora da rede/)).toBeTruthy();
  });
});
