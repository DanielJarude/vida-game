// @vitest-environment jsdom
/**
 * VIDA 26 — as telas: o Guia de carreiras (todas as modalidades, os jogos, as pistas; a etapa marcada), o painel Depois
 * de competir (a porta, a chance, o motivo, a ação), a leitura da comissão na formação, a ficha com os mentais e a
 * limitação séria, o corpo de nascença (natureza, degraus, capacidades) e o hobby que diz para onde pode levar.
 */
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import { nova } from '../../motor/__tests__/ajuda';
import { carregarMundo } from '../../motor/mundo/carregar';
import type { Acao } from '../../motor/acoes';
import type { CarreiraEsportiva, Visual, Vida } from '../../motor/tipos';
import { entrarNaBase, MODALIDADES } from '../../motor/sistemas/esporte';
import { garantirFrente } from '../../motor/sistemas/frentes';
import Guia26, { PosCarreira26 } from '../v26/guia/Guia26';
import { Formacao25 } from '../v25/formacao/Formacao25';
import { HobbyPorta26 } from '../v26/hobby/HobbyPorta26';
import { CorpoDeNascenca, type EscolhaDoCorpo } from '../telas/CorpoDeNascenca';
import { DIVISOES_CAMINHOS, resolverDestino } from '../navegacao';

beforeAll(async () => { await carregarMundo(); });
afterEach(() => { cleanup(); });
function aos(idade: number, s = 2601): Vida { const v = nova({ semente: s, genero: 'feminino', municipioId: 'recife-pe' } as never); v.t = v.eu.tNasc + idade * 12; v.momento = null; return v; }

describe('VIDA 26 · Guia de carreiras', () => {
  it('é uma divisão de Caminhos com destino próprio', () => {
    expect(DIVISOES_CAMINHOS.map(d => d.id)).toContain('guia');
    expect(resolverDestino('guia_carreiras')).toMatchObject({ area: 'caminhos', divisao: 'guia' });
  });
  it('mostra os esportes, depois os e-sports e o automobilismo; marca a etapa da vida', () => {
    const v = aos(14);
    garantirFrente(v, 'futebol').habilidade = 70;
    entrarNaBase(v, 'futebol', v.moradia.municipioId, 'Sport');
    const r = render(<Guia26 vida={v} agir={() => true} />);
    expect(r.container.querySelectorAll('[data-trajeto]').length).toBe(MODALIDADES.length);
    const fut = r.container.querySelector('[data-trajeto="futebol"]')!;
    expect(fut.hasAttribute('open')).toBe(true);
    expect(fut.querySelector('[aria-current="step"]')?.textContent).toMatch(/A formação/);
    fireEvent.click(within(r.container).getByRole('button', { name: /E-sports/ }));
    expect(r.container.querySelectorAll('[data-trajeto^="esports_"]').length).toBe(6);
    expect(r.container.textContent).not.toMatch(/undefined|NaN/);
  });
});

describe('VIDA 26 · Depois de competir', () => {
  it('a porta aberta tem botão; a fechada diz o motivo', () => {
    const v = aos(34);
    v.caminhos.esporte = { modalidade: 'basquete', fase: 'encerrada', clube: 'x', nivel: 3, tInicio: v.t - 12 * 12, tFase: v.t - 10 * 12, tFim: v.t - 6, lesoes: 0, municipioId: 'recife-pe', reputacao: 30,
      temporadas: Array.from({ length: 8 }, (_, k) => ({ ano: 2016 + k, clube: 'x', nivel: 3, partidas: 30, titular: 20, gols: 0, assistencias: 0, nota: 6.5, colocacao: 8, mesesFora: 0 })) as never } as CarreiraEsportiva;
    let agiu: Acao | undefined;
    const r = render(<PosCarreira26 vida={v} agir={a => { agiu = a; return true; }} />);
    const aux = r.container.querySelector('[data-porta="auxiliar_tecnico_basquete"]')!;
    fireEvent.click(within(aux as HTMLElement).getByRole('button', { name: 'Procurar' }));
    expect(agiu).toEqual({ tipo: 'pos26', ocupacaoId: 'auxiliar_tecnico_basquete' });
    const gerente = r.container.querySelector('[data-porta="gerente_esportivo"]')!;
    expect(gerente.querySelector('button')).toBeNull();
    expect(gerente.textContent).toMatch(/carreira longa/);
  });
  it('quem nunca competiu não vê o painel', () => {
    const r = render(<PosCarreira26 vida={aos(30)} agir={() => true} />);
    expect(r.container.querySelector('[data-pos-carreira]')).toBeNull();
  });
});

describe('VIDA 26 · formação: a leitura da comissão', () => {
  it('capacidade atual, potencial (estimativa) e prontidão aparecem separados, com as etapas', () => {
    const v = aos(15);
    const e = { modalidade: 'futebol', fase: 'base', clube: 'Sport', nivel: 1, tInicio: v.t - 24, tFase: v.t - 24, lesoes: 0, municipioId: 'recife-pe', formacao: [
      { ano: 2040, idade: 14, categoria: 'sub-15', clube: 'Sport', competicao: 'campeonato estadual sub-15', jogos: 16, titular: 14, gols: 6, assistencias: 3, nota: 8.1, tecnica: 81, colocacao: 1, participantes: 16, titulo: true, avaliacao: 'É um dos destaques da categoria.', capacidade: 74, prontidao: 41, potencial: [82, 93], acima: 'sub-17' }
    ] } as CarreiraEsportiva;
    const r = render(<Formacao25 vida={v} e={e} />);
    const l = (k: string) => r.container.querySelector(`[data-leitura="${k}"]`)!.textContent!;
    expect(l('capacidade')).toMatch(/74/);
    expect(l('potencial')).toMatch(/82–93/);
    expect(l('potencial')).toMatch(/Não é habilidade/);
    expect(l('prontidao')).toMatch(/41/);
    expect(r.container.textContent).toMatch(/subiu ao sub-17/);
    expect(r.container.textContent).toMatch(/a partir dos 16 anos/);
  });
});

describe('VIDA 26 · corpo de nascença', () => {
  const base = (o: Partial<Visual>): Visual => ({ ...nova({ semente: 5 } as never).eu.visual, ...o });
  it('diz o que é herdado, o que muda com a vida e o que é capacidade; os eixos são degraus com nome e efeito', () => {
    let e: EscolhaDoCorpo = { modo: 'escolher', c: '222222222222' };
    const r = render(<CorpoDeNascenca escolha={e} aoMudar={x => { e = x; }} genero="masculino" visual={base({ corpo23: '222222222222' })} />);
    expect(r.container.textContent).toMatch(/Herdado/);
    expect(r.container.textContent).toMatch(/Muda com a vida/);
    expect(r.container.querySelectorAll('[data-capacidade]').length).toBe(8);
    const pernas = r.container.querySelector('[data-eixo="pernas"]') as HTMLElement;
    expect(within(pernas).getAllByRole('radio')).toHaveLength(5);
    expect(pernas.textContent).toMatch(/velocidade/);
    fireEvent.click(within(pernas).getByRole('radio', { name: 'bem longas' }));
    expect(e.c?.charAt(9)).toBe('4');
  });
});

describe('VIDA 26 · o hobby e o caminho', () => {
  it('o videogame diz para onde pode levar; o bico diz que é dinheiro por fora', () => {
    const v = aos(16);
    v.rotinas.push({ id: 'videogame', tInicio: v.t - 36, nivel: 1 });
    const r = render(<HobbyPorta26 vida={v} id="videogame" categoria="lazer" />);
    expect(r.container.textContent).toMatch(/Videogame por diversão → Competitivo amador → E-sports profissional/);
    cleanup();
    const r2 = render(<HobbyPorta26 vida={v} id="bico" categoria="renda" />);
    expect(r2.container.textContent).toMatch(/dinheiro por fora/);
    cleanup();
    const r3 = render(<HobbyPorta26 vida={v} id="leitura" categoria="estudo" />);
    expect(r3.container.textContent).toBe('');
  });
});
