// @vitest-environment jsdom
/**
 * VIDA 12.9 · Estudos (a interface): o cartão do curso (instituição, semestres, turno, custo, ações) e a entrada por
 * instituição (curso → onde → processo → candidatar), com o resultado das fases.
 */
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import { precarregar } from '../App';
import { transacao } from '../../motor/nucleo';
import { adulto } from '../../motor/__tests__/cenarios';
import type { Vida } from '../../motor/tipos';
import { Estudos } from '../jogo/Estudos';
import { registrarAnoLetivo } from '../../motor/sistemas/historicoAcademico';

beforeAll(async () => { await precarregar(); });
afterEach(() => cleanup());
const em = (v: Vida, f: (x: Vida) => void): Vida => transacao(v, x => { f(x); }).vida;

describe('O cartão do curso', () => {
  it('mostra a instituição real, os semestres, o turno, o custo e as ações (com a conta do FIES ao abandonar)', () => {
    const v = em(adulto(20, { semente: 23, municipioId: 'sao-paulo-sp' }), x => {
      x.educacao.basica = undefined; x.trabalho.atual = undefined;
      x.educacao.matricula = { cursoId: 'direito', instituicao: 'Pontifícia Universidade Católica de São Paulo (PUC-SP), campus Monte Alegre (Perdizes)', rede: 'privada', modalidade: 'presencial', tInicio: x.t - 12, mesesRestantes: 48, mensalidade: 5372, financiamento: 'fies', desempenho: 60, trancado: false, municipioId: 'sao-paulo-sp', inst129: { id: 'pucsp', campus: 'monte-alegre', processo: 'fies', turno: 'noite' } };
      registrarAnoLetivo(x, { nivel: 'superior', instituicao: 'PUC-SP', cursoId: 'direito', tInicioCurso: x.t - 12, rotulo: '1º ano', disciplinas: [{ nome: 'Introdução ao Direito', nota: 7, situacao: 'aprovada' }, { nome: 'Teoria do Estado', nota: 4, situacao: 'reprovada' }], situacao: 'reprovado' });
    });
    render(<main><Estudos vida={v} agir={() => true} irPara={() => {}} parte="agora" /></main>);
    const card = document.querySelector('[data-curso129="direito"]') as HTMLElement;
    expect(card).toBeTruthy();
    expect(card.querySelector('.fac129__selo')!.textContent).toBe('PUC-SP');
    expect(card.textContent).toMatch(/3º e 4º semestres/);
    expect(card.textContent).toMatch(/de 10/);
    expect(card.textContent).toMatch(/noite/);
    expect(card.textContent).toMatch(/FIES do que foi cursado vira dívida/);
    expect(within(card).getByRole('button', { name: /Trocar de curso/ })).toBeTruthy();
    expect(within(card).getByRole('button', { name: /Refazer nas férias/ })).toBeTruthy();
    fireEvent.click(within(card).getByRole('button', { name: /Trocar de curso/ }));
    expect(document.querySelector('[data-troca129]')!.textContent).toMatch(/transferência interna/);
  });
});

describe('Entrar na faculdade, por instituição', () => {
  it('curso → as instituições do catálogo com campus, processo e custo → candidatar', () => {
    const v = em(adulto(18, { semente: 23, municipioId: 'sao-paulo-sp' }), x => { x.educacao.basica = undefined; x.educacao.matricula = undefined; x.educacao.escolaridade = 'medio'; });
    const acoes: unknown[] = [];
    render(<main><Estudos vida={v} agir={a => { acoes.push(a); return true; }} irPara={() => {}} parte="oportunidades" explorar="faculdade" /></main>);
    const fluxo = document.querySelector('[data-fluxo="faculdade"]') as HTMLElement;
    fireEvent.click(fluxo.querySelector('[data-curso129="medicina"] .fac129-curso__cabeca')!);
    const usp = fluxo.querySelector('[data-inst129="usp"]') as HTMLElement;
    expect(usp.textContent).toMatch(/Fuvest/);
    expect(usp.textContent).toMatch(/sem mensalidade/);
    expect(fluxo.querySelector('[data-inst129="pucsp"]')?.textContent ?? fluxo.textContent).toMatch(/12\.749|Ver mais/);
    fireEvent.click(within(usp).getAllByRole('button', { name: /Candidatar-se/ })[0]);
    expect(acoes[0]).toMatchObject({ tipo: 'estudos129', oque: 'candidatar' });
  });
});
