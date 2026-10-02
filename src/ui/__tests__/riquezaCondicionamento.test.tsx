// @vitest-environment jsdom
/**
 * Pós-playtest (tela): Trabalho, Dinheiro e Você dizem a MESMA coisa sobre
 * quem vive do patrimônio; e o condicionamento chega como frase, sem
 * "+ o futebol;" solto.
 */
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { precarregar } from '../App';
import { adulto } from '../../motor/__tests__/cenarios';
import { nova, viverAte } from '../../motor/__tests__/ajuda';
import { encerrarEmprego } from '../../motor/sistemas/trabalho';
import { depositar } from '../../motor/sistemas/investimentos';
import { entrarNaBase } from '../../motor/sistemas/esporte';
import { cuidarDaLesao, lesaoAtiva, lesionar } from '../../motor/sistemas/lesoes';
import { criarRng } from '../../motor/rng';
import type { Vida } from '../../motor/tipos';
import { Trabalho } from '../jogo/Trabalho';
import { ODinheiro } from '../jogo/Dinheiro';
import { Voce } from '../jogo/Voce';

beforeAll(async () => { await precarregar(); });
afterEach(() => cleanup());

function rico(): Vida {
  const v = adulto(45, { semente: 11 });
  if (v.trabalho.atual) encerrarEmprego(v, 'pediu demissão');
  v.trabalho.desempregadoDesde = v.t - 60;
  v.trabalho.aposentadoria = undefined;
  v.trabalho.pausa = undefined;
  v.caminhos.negocio = undefined;
  v.educacao.matricula = undefined;
  v.financas.dividas = [];
  v.financas.negativado = false;
  v.trabalho.intencao = undefined;
  v.caminhos.politica = undefined;
  v.financas.conta = 6_000_000;
  depositar(v, 'pos_fixado', 83_000_000);
  v.momento = null;
  return v;
}

describe('Riqueza e propósito — as três telas', () => {
  it('Trabalho, Dinheiro e Você: vivendo do que juntou, sem "procurar trabalho há tanto tempo"', () => {
    const v = rico();
    render(<main><Trabalho vida={v} agir={() => true} irPara={() => {}} /></main>);
    expect(document.querySelector('h1')?.textContent).toBe('Vivendo do que juntou');
    expect(screen.getAllByRole('button', { name: /Voltar a procurar trabalho/ }).length).toBeGreaterThan(0);
    cleanup();
    render(<main><ODinheiro vida={v} agir={() => true} /></main>);
    expect(screen.getByText(/Sem procurar trabalho, por escolha/)).toBeTruthy();
    cleanup();
    const { container } = render(<main><Voce vida={v} agir={() => true} irPara={() => {}} abrirPessoa={() => {}} /></main>);
    expect(container.textContent).not.toMatch(/procurar trabalho há tanto tempo/);
  });
});

describe('Condicionamento — a frase', () => {
  it('atleta da base machucado: frase inteira, sem sinais soltos', () => {
    const v = viverAte(nova({ municipioId: 'uberaba-mg', genero: 'masculino', semente: 7 }), 13);
    v.momento = null;
    entrarNaBase(v, 'futebol', 'uberaba-mg', 'Uberaba');
    lesionar(v, criarRng(5), 2, 'pratica');
    lesaoAtiva(v)!.tInicio = v.t - 6;
    cuidarDaLesao(v, 'fisio', false);
    lesaoAtiva(v)!.lesao.tFim = v.t + 3;
    v.corpo.forma = 70;
    v.mente.historico = [{ t: v.t - 24, humor: 60, cabeca: 30, saude: 80, forma: 78, cognicao: 50, aparencia: 55 }];
    const { container } = render(<main><Voce vida={v} agir={() => true} irPara={() => {}} abrirPessoa={() => {}} /></main>);
    const causas = [...container.querySelectorAll('.pessoal__causas')].map(x => x.textContent ?? '');
    const cond = causas.find(c => /treino de base/.test(c));
    expect(cond).toBeDefined();
    expect(cond).toMatch(/^O que pesa: .+\. O que segura: o treino de base de futebol/);
    for (const c of causas) expect(c).not.toMatch(/[;+−]/);
    expect(container.querySelector('.pessoal__sinal')).toBeNull();
    expect(container.textContent).toMatch(/vem piorando/);
  });
});
