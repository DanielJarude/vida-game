// @vitest-environment jsdom
/**
 * Fechamento do ATT Mundo — o que o playtest humano viu NA TELA:
 *   - "Fazer o ENEM" na tela, SAT no motor (a tela agora lê a mesma fonte);
 *   - SESC no Tempo livre de quem mora nos EUA;
 *   - "muito próximo" como identidade de uma pessoa (agora: tipo + estado).
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { precarregar } from '../App';
import { criarRng } from '../../motor/rng';
import { criarVida } from '../../motor/criacao';
import { avancarAno } from '../../motor/ano';
import type { Vida } from '../../motor/tipos';
import { transacao } from '../../motor/nucleo';
import { entrarNaVida } from '../../motor/mundo/vida';
import { vincular, criarPessoa } from '../../motor/pessoas';
import { romper } from '../../motor/sistemas/lacos';
import { Estudos } from '../jogo/Estudos';
import { Tempo } from '../jogo/Tempo';
import { Pessoas } from '../jogo/Pessoas';

beforeAll(async () => { await precarregar(); });

function vidaEm(municipioId: string, idade: number, ajuste: (v: Vida) => void = () => {}): Vida {
  let v = criarVida({ nome: 'Ana', sobrenome: 'Lima', genero: 'feminino', municipioId, semente: 31 });
  for (let i = 0; i < idade; i++) { v = avancarAno(v).vida; v.momento = null; }
  v.caminhos.pendente = undefined;
  const w = transacao(v, x => { x.momento = null; ajuste(x); }).vida;
  entrarNaVida(w);
  return w;
}

beforeEach(() => {
  localStorage.clear();
  window.scrollTo = () => {};
  const r = criarRng(20261003);
  vi.spyOn(Math, 'random').mockImplementation(() => r.next());
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const BRASIL = /\bENEM\b|\bSISU\b|ProUni|\bFIES\b|\bSESC\b|\bSUS\b|supletivo|instituto federal|\bCNH\b|\bINSS\b/;

describe('a tela fala do lugar onde a pessoa mora', () => {
  it('Formação nos EUA: o botão é "Fazer o SAT deste ano" — nenhuma instituição brasileira na tela', () => {
    const v = vidaEm('us:chicago', 17, x => { x.educacao.basica = { etapa: 'medio', serie: 3, rede: 'publica', desempenho: 62, reprovacoes: 0 }; });
    const { container } = render(<Estudos vida={v} agir={() => true} />);
    expect(screen.getByRole('button', { name: 'Fazer o SAT deste ano' })).toBeTruthy();
    expect(container.textContent ?? '').not.toMatch(BRASIL);
  });

  it('Formação no Brasil continua dizendo ENEM', () => {
    const v = vidaEm('recife-pe', 17, x => { x.educacao.basica = { etapa: 'medio', serie: 3, rede: 'publica', desempenho: 62, reprovacoes: 0 }; });
    render(<Estudos vida={v} agir={() => true} />);
    expect(screen.getByRole('button', { name: 'Fazer o ENEM deste ano' })).toBeTruthy();
  });

  it('Tempo livre nos EUA: a natação não oferece o SESC', () => {
    const v = vidaEm('us:chicago', 12);
    const { container } = render(<Tempo vida={v} agir={() => true} />);
    expect(container.textContent ?? '').not.toMatch(/SESC/);
  });
});

describe('Pessoas: quem a pessoa é na sua vida — não "muito próximo"', () => {
  it('a lista diz o tipo e o estado; a ficha de uma ex-amiga explica por que se afastaram', () => {
    let amigaId = '';
    const v = vidaEm('recife-pe', 30, x => {
      const p = criarPessoa(x, criarRng(5), { idade: 30, genero: 'feminino', municipioId: x.moradia.municipioId });
      p.nome = 'Marina';
      const vin = vincular(x, p, { origem: 'faculdade', proximidade: 85, convivio: [] });
      vin.estagio = 'amigo'; vin.confianca = 80; vin.tInicio = x.t - 120;
      romper(x, p, vin, 'A amizade acabou numa briga por causa de um dinheiro emprestado.', 'ambos');
      amigaId = p.id;
    });
    const { container, rerender } = render(<Pessoas vida={v} agir={() => true} aberta={null} abrir={() => {}} />);
    expect(container.textContent ?? '').not.toMatch(/muito próxim/);
    rerender(<Pessoas vida={v} agir={() => true} aberta={amigaId} abrir={() => {}} />);
    expect(screen.getAllByText(/ex-amiga/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/dinheiro emprestado/).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /fazer as pazes com Marina/i })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /fazer as pazes com Marina/i }));
  });
});
