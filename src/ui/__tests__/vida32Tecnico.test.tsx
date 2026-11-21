// @vitest-environment jsdom
/**
 * VIDA 32 · a prancheta mostra o dia a dia do técnico em grupos (Treino, Elenco, Imprensa, Diretoria, Carreira); o
 * clique executa a ação no motor, e o cartão passa a dizer o limite.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { adulto } from '../../motor/__tests__/cenarios';
import { transacao } from '../../motor/nucleo';
import { executar } from '../../motor/acoes';
import type { Vida } from '../../motor/tipos';
import { PranchetaDoTecnico } from '../jogo/CarreirasEspeciais';
import { contratar } from '../../motor/sistemas/trabalho';
import { ocupacao } from '../../motor/dados/ocupacoes';
import { aceitarPropostaDeTecnico, passagemAtual, processarTecnico } from '../../motor/sistemas/tecnico';
import { garantirFrente } from '../../motor/sistemas/frentes';

afterEach(() => cleanup());

function Palco({ inicial }: { inicial: Vida }) {
  const [v, setV] = useState(inicial);
  return <main><PranchetaDoTecnico vida={v} agir={a => { setV(executar(v, a).vida); return true; }} /><output data-testid="estado">{JSON.stringify(passagemAtual(v)?.v32 ?? {})}</output></main>;
}

describe('VIDA 32 · as ações do técnico na prancheta', () => {
  it('os cinco grupos aparecem; o treino tático vira o foco da pré-temporada e bloqueia outro foco', () => {
    const v = transacao(adulto(40, { semente: 77, genero: 'masculino', municipioId: 'recife-pe' }), (x, rr) => {
      x.trabalho.atual = undefined; x.educacao.matricula = undefined; x.caminhos.oportunidades = [];
      garantirFrente(x, 'futebol');
      x.trabalho.experiencia['treino'] = 48;
      contratar(x, rr, ocupacao('tecnico_futebol'), 'oportunidade');
      processarTecnico(x, rr);
      const pr = x.caminhos.tecnico?.proposta;
      if (!passagemAtual(x) && pr) aceitarPropostaDeTecnico(x, rr, pr.id);
      x.momento = null; delete x.fila;
    }).vida;
    render(<Palco inicial={v} />);
    const d = screen.getByRole('region', { name: 'O dia a dia do técnico' });
    for (const g of ['Treino', 'Elenco', 'Imprensa', 'Diretoria', 'Carreira']) expect(within(d).getByRole('group', { name: g })).toBeTruthy();
    fireEvent.click(within(d).getByRole('button', { name: 'Pré-temporada tática' }));
    expect(JSON.parse(screen.getByTestId('estado').textContent!).treino).toBe('tatico');
    const d2 = screen.getByRole('region', { name: 'O dia a dia do técnico' });
    expect((within(d2).getByRole('button', { name: 'Pré-temporada física' }) as HTMLButtonElement).disabled).toBe(true);
    expect(d2.textContent).toMatch(/O foco da pré-temporada já foi escolhido/);
    expect(d2.textContent).toMatch(/Foco da pré-temporada: pré-temporada tática/);
  });
});
