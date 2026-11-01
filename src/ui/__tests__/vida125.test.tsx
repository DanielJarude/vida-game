// @vitest-environment jsdom
/**
 * VIDA 12.5 — Polimento e Imersão: a lupa do estúdio de tatuagem, a retrospectiva da vida e os demais ajustes de tela.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { adulto } from '../../motor/__tests__/cenarios';
import { transacao } from '../../motor/nucleo';
import type { Vida } from '../../motor/tipos';
import { EstudioDeTatuagem } from '../jogo/Tatuagens';
import { focoDaParte } from '../avatar/Figura';
import { REGIAO_DA_PARTE, REGIOES, type LocalDeTatuagem } from '../../motor/dados/tatuagens';
import { Retrospectiva } from '../jogo/Retrospectiva';
import { Historia } from '../jogo/Historia';
import { memoriasDaVida } from '../../motor/sistemas/albumDaVida';

const rica = (): Vida => transacao(adulto(30, { semente: 12500, municipioId: 'sao-paulo-sp' }), x => { x.financas.conta = 900_000; x.momento = null; }).vida;
afterEach(() => cleanup());

describe('VIDA 12.5 · a lupa do estúdio de tatuagem', () => {
  it('abre na região escolhida, aproxima, afasta, volta ao corpo inteiro e troca frente/costas', () => {
    const { container } = render(<EstudioDeTatuagem vida={rica()} agir={() => true} />);
    const lupa = () => container.querySelector('figure.estudio-tatuagem__lupa')!;
    expect(lupa().getAttribute('data-nivel')).toBe('1');
    fireEvent.click(screen.getByRole('button', { name: 'Aproximar' }));
    expect(lupa().getAttribute('data-nivel')).toBe('2');
    fireEvent.click(screen.getByRole('button', { name: 'Aproximar' }));
    expect(lupa().getAttribute('data-nivel')).toBe('3');
    expect((screen.getByRole('button', { name: 'Aproximar' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Corpo inteiro' }));
    expect(lupa().getAttribute('data-nivel')).toBe('0');
    fireEvent.click(screen.getByRole('button', { name: 'Ver a região' }));
    expect(lupa().getAttribute('data-nivel')).toBe('1');
    fireEvent.click(screen.getByRole('button', { name: /^De costas/ }));
    expect(lupa().getAttribute('data-vista')).toBe('costas');
  });

  it('o foco de cada parte do corpo é finito, menor que o corpo inteiro e encolhe ao aproximar', () => {
    for (const local of Object.keys(REGIAO_DA_PARTE) as LocalDeTatuagem[]) {
      const r = REGIOES[REGIAO_DA_PARTE[local][0]];
      const vista = r.frente ? 'frente' : 'costas';
      const lado = r.lados ? 'e' : undefined;
      const inteiro = focoDaParte('masculino', 'mediano', 30, 'inteiro', undefined, vista);
      const regiao = focoDaParte('masculino', 'mediano', 30, local, lado, vista, 1);
      const perto = focoDaParte('masculino', 'mediano', 30, local, lado, vista, 2.6);
      expect(regiao.w).toBeLessThan(inteiro.w);
      expect(perto.w).toBeLessThan(regiao.w);
      for (const f of [regiao, perto]) expect([f.x, f.y, f.w, f.h].every(Number.isFinite)).toBe(true);
    }
  });
});

describe('VIDA 12.5 · a Retrospectiva da Vida na tela', () => {
  it('mostra os marcantes, a linha do tempo por fase e filtra por categoria (as vazias ficam desligadas)', () => {
    const v = adulto(40, { semente: 125125 });
    const ms = memoriasDaVida(v);
    const { container } = render(<Retrospectiva vida={v} />);
    expect(container.querySelectorAll('.retro-memoria')).toHaveLength(ms.length);
    expect(container.querySelectorAll('.retro-foto').length).toBe(Math.min(12, ms.filter(m => m.destaque === 2).length));
    expect(screen.getByText(/Ao nascer, em/, { selector: '.retro-memoria__quando' })).toBeTruthy();
    const educacao = ms.filter(m => m.categoria === 'educacao').length;
    fireEvent.click(screen.getByRole('button', { name: /^Educação/ }));
    expect(container.querySelectorAll('.retro-memoria')).toHaveLength(educacao);
    expect((screen.getByRole('button', { name: /^Esportes/ }) as HTMLButtonElement).disabled).toBe(ms.every(m => m.categoria !== 'esportes'));
    fireEvent.click(screen.getByRole('button', { name: /^Toda a vida/ }));
    fireEvent.click(screen.getByLabelText('Só os marcantes'));
    expect(container.querySelectorAll('.retro-memoria')).toHaveLength(ms.filter(m => m.destaque === 2).length);
  });

  it('a História tem a parte Retrospectiva (carregada sob demanda)', async () => {
    const v = adulto(20, { semente: 7 });
    render(<Historia vida={v} marca={0} parte="retrospectiva" irParte={() => {}} irPara={() => {}} abrirPessoa={() => {}} />);
    expect(screen.getByRole('tab', { name: /Retrospectiva/ })).toBeTruthy();
    expect(await screen.findByRole('region', { name: 'Retrospectiva da vida' })).toBeTruthy();
  });
});
