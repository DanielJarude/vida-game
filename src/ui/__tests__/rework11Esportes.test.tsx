// @vitest-environment jsdom
/**
 * REWORK 11 · Fase C, do lado da tela: o atleta sem clube continua atleta (sem clube atual falso, com as ações dele) e
 * a comissão técnica mostra o clube concreto e a licença — sem "Almoçar com a chefia" nem "curso da empresa".
 */
import { beforeAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { precarregar } from '../App';
import { criarRng } from '../../motor/rng';
import { criarVida } from '../../motor/criacao';
import { avancarAno } from '../../motor/ano';
import type { Vida } from '../../motor/tipos';
import { Trabalho } from '../jogo/Trabalho';
import { transacao } from '../../motor/nucleo';
import { ficarSemClube } from '../../motor/sistemas/esporte';
import { contratar } from '../../motor/sistemas/trabalho';
import { ocupacao } from '../../motor/dados/ocupacoes';

beforeAll(async () => { await precarregar(); });

let base: Vida | undefined;
function adulto(): Vida {
  if (!base) {
    let v = criarVida({ nome: 'Caio', sobrenome: 'Moraes', genero: 'masculino', municipioId: 'belo-horizonte-mg', semente: 23 });
    for (let i = 0; i < 27; i++) { v = avancarAno(v).vida; v.momento = null; }
    v.caminhos.pendente = undefined;
    base = v;
  }
  return structuredClone(base);
}

function atletaSemClube(): Vida {
  return transacao(adulto(), x => {
    x.educacao.matricula = undefined;
    x.caminhos.frentes.futebol = { habilidade: 84, interesse: 80, meses: 200, auge: 86, tInicio: x.t - 200 } as never;
    x.caminhos.esporte = { modalidade: 'futebol', fase: 'profissional', clube: 'Cruzeiro', nivel: 4, tInicio: x.t - 72, tFase: x.t - 60, lesoes: 0, municipioId: 'belo-horizonte-mg', reputacao: 40, espaco: 'titular', contratoAte: x.t - 1, posicao: 'goleiro', temporadas: [] };
    x.trabalho.atual = { ocupacaoId: 'jogador_futebol', empregador: 'o Cruzeiro', contrato: 'clt', salario: 30000, tInicio: x.t - 60, desempenho: 70, municipioId: 'belo-horizonte-mg', carga: 'integral' };
    ficarSemClube(x, x.caminhos.esporte!);
    x.momento = null;
  }).vida;
}

beforeEach(() => {
  localStorage.clear();
  window.scrollTo = () => {};
  window.confirm = () => true;
  const r = criarRng(20261024);
  vi.spyOn(Math, 'random').mockImplementation(() => r.next());
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('Trabalho · o atleta sem clube', () => {
  it('continua jogador profissional: o placar diz "sem clube" e o último clube; as ações são as do atleta', () => {
    const v = atletaSemClube();
    render(<Trabalho vida={v} agir={() => true} irPara={() => {}} />);
    expect(screen.getAllByText(/(profissional|de futebol) sem clube/).length).toBeGreaterThan(0);
    const painel = screen.getByRole('region', { name: 'A carreira no esporte' });
    expect(within(painel).getByText(/sem clube · último: Cruzeiro/)).toBeTruthy();
    expect(within(painel).queryByText(/^Titular$/)).toBeNull();
    expect(screen.getByRole('button', { name: /procurar um clube/ })).toBeTruthy();
    expect(screen.queryByText(/Fazer bicos|Ver os concursos/)).toBeNull();
  });
});

describe('Trabalho · a comissão técnica', () => {
  it('o auxiliar técnico: o clube concreto, a licença — e nenhuma ação de empresa', () => {
    const v = transacao(adulto(), (x, r) => { x.educacao.matricula = undefined; x.trabalho.experiencia['treino'] = 24; contratar(x, r, ocupacao('auxiliar_tecnico'), 'oportunidade'); x.momento = null; }).vida;
    render(<Trabalho vida={v} agir={() => true} irPara={() => {}} />);
    const painel = screen.getByRole('region', { name: 'A comissão técnica' });
    expect(within(painel).getByText('Licença de treinador')).toBeTruthy();
    expect(within(painel).getByText(/Atlético Mineiro|Cruzeiro|América Mineiro/)).toBeTruthy();
    expect(screen.queryByText(/Almoçar com a chefia|curso da empresa|Fazer horas extras|Pedir aumento/)).toBeNull();
    expect(screen.getAllByText(/licença .* de treinador/i).length).toBeGreaterThan(0);
  });
});
