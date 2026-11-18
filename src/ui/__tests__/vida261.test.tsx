// @vitest-environment jsdom
/**
 * VIDA 26.1 — a central "Onde fica cada coisa" (áreas por finalidade, busca com sinônimos e variações, caminhos na busca)
 * e o explorador de caminhos de carreira (estado para a vida, formas de começar, profissões, o botão que leva à tela real).
 */
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import { nova } from '../../motor/__tests__/ajuda';
import { carregarMundo } from '../../motor/mundo/carregar';
import type { Vida } from '../../motor/tipos';
import { entrarNaBase, MODALIDADES } from '../../motor/sistemas/esporte';
import { garantirFrente } from '../../motor/sistemas/frentes';
import { contratar } from '../../motor/sistemas/trabalho';
import { ocupacao } from '../../motor/dados/ocupacoes';
import { criarRng } from '../../motor/rng';
import { trajetorias26 } from '../../motor/v26/carreira/trajetorias26';
import { LISTA_JOGOS25 } from '../../motor/v25/esports/jogos25';
import { buscarIntencoes, GRUPO_DA_INTENCAO, GRUPOS_DE_INTENCAO, grupoDaIntencao, MAPA_DE_INTENCOES, resolverDestino, type Aba, type Lugar } from '../navegacao';
import { buscarTrajetorias } from '../v26/central/buscaDeTrajetorias';
import { Central26 } from '../v26/central/Central26';
import { Explorador26 } from '../v26/guia/Guia26';

beforeAll(async () => { await carregarMundo(); });
afterEach(() => { cleanup(); });
function aos(idade: number, s = 2611): Vida { const v = nova({ semente: s, genero: 'feminino', municipioId: 'recife-pe' } as never); v.t = v.eu.tNasc + idade * 12; v.momento = null; return v; }
const ids = (q: string) => buscarIntencoes(q).map(x => x.id);

describe('VIDA 26.1 · as áreas da central', () => {
  it('toda intenção tem uma área (declarada), toda área tem intenções, nenhum id se repete', () => {
    for (const x of MAPA_DE_INTENCOES) expect(GRUPO_DA_INTENCAO[x.id], x.id).toBeTruthy();
    for (const g of GRUPOS_DE_INTENCAO) expect(MAPA_DE_INTENCOES.some(x => grupoDaIntencao(x) === g.id), g.id).toBe(true);
    expect(new Set(MAPA_DE_INTENCOES.map(x => x.id)).size).toBe(MAPA_DE_INTENCOES.length);
  });
});

describe('VIDA 26.1 · a busca', () => {
  it('termos relacionados, sinônimos, variações de escrita e um erro de digitação', () => {
    expect(ids('faculdade').slice(0, 3)).toContain('faculdade');
    expect(ids('faculdade')).toContain('cursos');
    expect(ids('futebol')).toEqual(expect.arrayContaining(['futebol', 'base_esporte']));
    expect(ids('namorar')[0]).toBe('namoro');
    expect(ids('dinheiro').slice(0, 3)).toContain('dinheiro');
    for (const q of ['Counter-Strike', 'counter strike', 'CS', 'valorant']) expect(ids(q)[0], q).toBe('esports');
    // VIDA 26.2: o estilo de luta tem ação própria; a peneira e a base continuam no resultado.
    expect(ids('muay thai')[0]).toBe('estilo_luta');
    expect(ids('muay thai')).toContain('base_esporte');
    expect(ids('faculdadde')).toContain('faculdade');
    expect(ids('treinador')).toContain('pos_carreira');
    for (const q of ['futebol', 'dinheiro', 'cs']) expect(new Set(ids(q)).size).toBe(ids(q).length);
  });
  it('a busca encontra trajetórias: Muay Thai → lutas; Counter-Strike → o caminho do CS; futebol → futebol', () => {
    const t = trajetorias26(aos(15));
    expect(buscarTrajetorias(t, 'muay thai')[0].id).toBe('lutas_muay_thai');
    expect(buscarTrajetorias(t, 'jiu-jitsu')[0].id).toBe('lutas_jiu_jitsu');
    expect(buscarTrajetorias(t, 'Counter-Strike')[0].id).toBe('esports_cs');
    expect(buscarTrajetorias(t, 'futebol')[0].id).toBe('futebol');
    expect(buscarTrajetorias(t, 'saúde').some(x => x.id === 'prof_saude')).toBe(true);
  });
});

describe('VIDA 26.1 · a central na tela', () => {
  it('áreas primeiro; a área mostra as suas ações; voltar; a ação abre o lugar real', () => {
    let foi: Lugar | undefined;
    const r = render(<Central26 vida={aos(30)} ir={l => { foi = l; }} />);
    expect(r.container.querySelectorAll('[data-grupo]').length).toBe(GRUPOS_DE_INTENCAO.length);
    fireEvent.click(r.container.querySelector('[data-grupo="esporte"]')!);
    expect(r.container.querySelector('[data-intencao="esports"]')).toBeTruthy();
    expect(r.container.querySelector('[data-intencao="namoro"]')).toBeNull();
    fireEvent.click(r.container.querySelector('[data-intencao="kart"]')!);
    expect(foi).toEqual({ area: 'caminhos', divisao: 'outros' });
    fireEvent.click(within(r.container).getByRole('button', { name: /Todas as áreas/ }));
    expect(r.container.querySelector('[data-entrada-caminhos]')).toBeTruthy();
  });
  it('a busca agrupa por área e traz os caminhos; o caminho abre o explorador nele', async () => {
    const r = render(<Central26 vida={aos(15)} ir={() => {}} />);
    fireEvent.change(within(r.container).getByRole('searchbox'), { target: { value: 'futebol' } });
    expect(r.container.querySelector('[data-intencao="futebol"]')).toBeTruthy();
    expect(within(r.container).getByRole('region', { name: 'Esportes e competição' })).toBeTruthy();
    fireEvent.click(r.container.querySelector('[data-trajeto-busca="futebol"]')!);
    expect(within(r.container).getByRole('tab', { name: 'Caminhos de carreira', selected: true })).toBeTruthy();
    const det = await r.findByText('Futebol', { selector: '.g26-trajeto__nome' });
    expect(det.closest('details')!.hasAttribute('open')).toBe(true);
  });
});

describe('VIDA 26.1 · o explorador', () => {
  it('cobre todas as modalidades, todos os jogos, as pistas e as profissões', () => {
    const t = trajetorias26(aos(15));
    // VIDA 26.2: a luta é um caminho por estilo (Muay Thai, boxe, jiu-jitsu, judô, karatê, taekwondo, MMA).
    expect(t.filter(x => x.grupo === 'esporte').length).toBe(MODALIDADES.length - 1 + 7);
    expect(t.filter(x => x.grupo === 'esports').length).toBe(LISTA_JOGOS25.length);
    expect(t.filter(x => x.grupo === 'pistas').length).toBe(1);
    expect(t.filter(x => x.grupo === 'profissao').length).toBeGreaterThanOrEqual(15);
    for (const x of t) {
      expect(x.entradas.length, x.id).toBeGreaterThanOrEqual(1);
      if (x.grupo !== 'profissao') expect(x.entradas.length, x.id).toBeGreaterThanOrEqual(2);
      if (x.ir) expect(resolverDestino(x.ir.destino as Aba).area, `${x.id} → ${x.ir.destino}`).toBeTruthy();
      expect(x.porque, x.id).toBeTruthy();
    }
  });
  it('o estado vem da vida: ao alcance, fora de alcance, em andamento, já percorrido', () => {
    const fut = (v: Vida) => trajetorias26(v).find(x => x.id === 'futebol')!;
    expect(fut(aos(13)).estado).toBe('disponivel');
    expect(fut(aos(45)).estado).toBe('fora');
    expect(fut(aos(3)).estado).toBe('futuro');
    const b = aos(14); garantirFrente(b, 'futebol').habilidade = 70; entrarNaBase(b, 'futebol', b.moradia.municipioId, 'Sport');
    expect(fut(b).estado).toBe('andamento');
    expect(trajetorias26(aos(10)).find(x => x.id === 'esports_cs')!.estado).toBe('futuro');
    expect(trajetorias26(aos(40)).find(x => x.id === 'automobilismo')!.estado).toBe('fora');
    const w = aos(30); contratar(w, criarRng(1), ocupacao('enfermeiro'));
    expect(trajetorias26(w).find(x => x.id === 'prof_saude')!.estado).toBe('andamento');
  });
  it('mostra as formas de começar e leva à tela real', () => {
    let foi: Aba | undefined;
    const r = render(<Explorador26 vida={aos(15)} agir={() => true} irPara={a => { foi = a; }} foco="lutas_muay_thai" semPos />);
    const lutas = r.container.querySelector('[data-trajeto="lutas_muay_thai"]')!;
    expect(lutas.hasAttribute('open')).toBe(true);
    expect(lutas.textContent).toMatch(/oito armas/);
    expect(lutas.textContent).toMatch(/Formas de começar/);
    fireEvent.click(within(lutas as HTMLElement).getByRole('button', { name: /praticar|Ver/ }));
    expect(foi).toBe('corpo');
    fireEvent.click(within(r.container).getByRole('button', { name: /Profissões/ }));
    expect(r.container.querySelector('[data-trajeto="prof_saude"]')).toBeTruthy();
  });
});
