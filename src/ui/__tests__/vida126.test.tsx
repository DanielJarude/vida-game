// @vitest-environment jsdom
/**
 * VIDA 12.6 — a tela: o estúdio (o mapa do corpo, o catálogo, os ajustes, os projetos, as suas), a casa no dia a dia,
 * os atalhos e os últimos avisos, a foto da memória.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { adulto } from '../../motor/__tests__/cenarios';
import { transacao } from '../../motor/nucleo';
import { executar, type Acao } from '../../motor/acoes';
import { EstudioDeTatuagem } from '../jogo/Tatuagens';
import { Figura } from '../avatar/Figura';
import { FotoDaMemoria } from '../jogo/FotoDaMemoria';
import { memoriasDaVida } from '../../motor/sistemas/albumDaVida';
import { alternarAtalho, atalhosDe, avisosDe, guardarAviso } from '../atalhos';
import { SeusAtalhos } from '../jogo/Atalhos';
import { tatuagensNaFigura } from '../../motor/sistemas/tatuagens';
import type { Vida } from '../../motor/tipos';

afterEach(() => { cleanup(); try { localStorage.clear(); } catch { /* */ } });
const rica = (): Vida => transacao(adulto(30, { semente: 1264, municipioId: 'sao-paulo-sp' }), x => { x.financas.conta = 900_000; x.momento = null; }).vida;

describe('VIDA 12.6 · o estúdio de tatuagem', () => {
  it('o mapa do corpo: no corpo inteiro, tocar numa região escolhe o lugar (e o lado)', () => {
    const { container } = render(<EstudioDeTatuagem vida={rica()} agir={() => true} />);
    fireEvent.click(screen.getByRole('button', { name: 'Corpo inteiro' }));
    const regiao = container.querySelector('rect.figura__regiao[data-regiao="coxa"][data-lado="e"]')!;
    expect(regiao).toBeTruthy();
    fireEvent.click(regiao);
    expect(container.querySelector('figure.estudio-tatuagem__lupa')!.getAttribute('data-regiao')).toBe('coxa');
    expect((screen.getByLabelText('Região') as HTMLSelectElement).value).toBe('coxa');
  });

  it('o catálogo em miniaturas filtra pelo estilo e pelo que cabe; ajustar e tatuar leva a posição, a cor e o texto', () => {
    let v = rica();
    const agir = (a: Acao) => { v = executar(v, a).vida; rerender(<EstudioDeTatuagem vida={v} agir={agir} />); return true; };
    const { container, rerender } = render(<EstudioDeTatuagem vida={v} agir={agir} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Lettering' }));
    const nome = container.querySelector('[data-desenho="nome_cursivo"]')!;
    fireEvent.click(nome);
    fireEvent.change(screen.getByLabelText('O nome'), { target: { value: 'Helena' } });
    fireEvent.click(screen.getByLabelText(/O tatuador escolhe/));
    fireEvent.change(screen.getByLabelText(/Rotação/), { target: { value: '15' } });
    fireEvent.click(screen.getByRole('button', { name: /^Tatuar/ }));
    const t = v.eu.tatuagens![v.eu.tatuagens!.length - 1];
    expect(t.desenho).toBe('nome_cursivo');
    expect(t.texto).toBe('Helena');
    expect(t.ajuste?.rot).toBe(15);
    fireEvent.click(screen.getByRole('tab', { name: /As suas/ }));
    expect(screen.getByText(/Helena/)).toBeTruthy();
  });

  it('projetos: a prévia mostra a manga com o fundo; fazer cria as peças independentes', () => {
    let v = rica();
    const agir = (a: Acao) => { v = executar(v, a).vida; rerender(<EstudioDeTatuagem vida={v} agir={agir} />); return true; };
    const { container, rerender } = render(<EstudioDeTatuagem vida={v} agir={agir} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Projetos' }));
    expect(container.querySelector('[data-fundo="ondas"]')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Fazer o projeto/ }));
    expect((v.eu.tatuagens ?? []).length).toBeGreaterThanOrEqual(4);
    expect(v.eu.composicoes).toHaveLength(1);
  });

  it('a figura: a tatuagem do tríceps só aparece de costas; a do pé, só descalço', () => {
    let v = rica();
    v = executar(v, { tipo: 'tatuar', desenho: 'corvo', regiao: 'triceps', lado: 'd' }).vida;
    v = executar(v, { tipo: 'tatuar', desenho: 'constelacao', regiao: 'pe', lado: 'e' }).vida;
    const ts = tatuagensNaFigura(v);
    const vis = { pele: 'p3', cabelo: 'curto', corCabelo: 'preto', olhos: 'castanho' };
    const { container } = render(<>
      <Figura visual={vis} genero="masculino" idade={30} corpo="mediano" pecas={[]} tatuagens={ts} semCima descalco />
      <Figura visual={vis} genero="masculino" idade={30} corpo="mediano" pecas={[]} tatuagens={ts} semCima descalco vista="costas" />
      <Figura visual={vis} genero="masculino" idade={30} corpo="mediano" pecas={[]} tatuagens={ts} />
    </>);
    const [f, c, vestida] = container.querySelectorAll('svg.figura');
    expect(f.querySelector('[data-regiao="triceps"]')).toBeNull();
    expect(c.querySelector('[data-regiao="triceps"]')).toBeTruthy();
    expect(f.querySelector('[data-regiao="pe"]')).toBeTruthy();
    expect(vestida.querySelector('[data-regiao="pe"]')).toBeNull();
  });
});

describe('VIDA 12.6 · atalhos, avisos e a foto da memória', () => {
  it('a estrela guarda a ação; os atalhos aparecem e somem; os avisos guardam o que aconteceu', () => {
    const v = rica();
    const acao: Acao = { tipo: 'em_casa', oque: 'faxina' };
    alternarAtalho(v.id, acao, 'Fazer uma faxina geral');
    expect(atalhosDe(v.id)).toHaveLength(1);
    render(<SeusAtalhos vida={v} agir={() => true} />);
    expect(screen.getByRole('button', { name: /faxina geral/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Tirar dos atalhos/ }));
    expect(atalhosDe(v.id)).toHaveLength(0);
    guardarAviso(v.id, { texto: 'Faxina feita.', ano: 2030, idade: 30 });
    guardarAviso(v.id, { texto: 'Faxina feita.', ano: 2030, idade: 30 });
    expect(avisosDe(v.id)).toHaveLength(1);
  });

  it('a foto da memória: retrato de quem viveu, ou o desenho da tatuagem', () => {
    let v = rica();
    v = executar(v, { tipo: 'tatuar', desenho: 'andorinha', regiao: 'biceps', lado: 'd' }).vida;
    const m = memoriasDaVida(v).find(x => x.tipo === 'tatuagem')!;
    const { container } = render(<FotoDaMemoria vida={v} m={m} />);
    expect(container.querySelector('svg.retro-foto__cena')).toBeTruthy();
    const nasc = memoriasDaVida(v)[0];
    const r2 = render(<FotoDaMemoria vida={v} m={nasc} />);
    expect(r2.container.querySelectorAll('svg').length).toBeGreaterThan(1);
  });
});
