// @vitest-environment jsdom
/**
 * Generalização de carreiras e legado, do lado da tela:
 *   - Você · "O que você construiu": as trajetórias (a carreira que acabou
 *     continua), com o histórico revelado aos poucos.
 *   - Trabalho · "A carreira no esporte": a tabela fala o idioma da
 *     modalidade (o tênis por ano de circuito; o basquete por equipe, com
 *     pontos, rebotes e assistências).
 */
import { beforeAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { precarregar } from '../App';
import { criarRng } from '../../motor/rng';
import { criarVida } from '../../motor/criacao';
import { avancarAno } from '../../motor/ano';
import type { Vida } from '../../motor/tipos';
import { Trabalho } from '../jogo/Trabalho';
import { Voce } from '../jogo/Voce';
import { transacao } from '../../motor/nucleo';
import { garantirFrente } from '../../motor/sistemas/frentes';
import { encerrarCarreira, entrarNaBase, fecharTemporada, profissionalizar } from '../../motor/sistemas/esporte';
import { registrarTemporada } from '../../motor/sistemas/palmares';
import { contratar } from '../../motor/sistemas/trabalho';
import { ocupacao } from '../../motor/dados/ocupacoes';

beforeAll(async () => { await precarregar(); });

function vidaAos(idade: number, ajuste: (v: Vida) => void = () => {}): Vida {
  let v = criarVida({ nome: 'Lia', sobrenome: 'Moraes', genero: 'feminino', municipioId: 'sao-paulo-sp', semente: 9 });
  for (let i = 0; i < idade; i++) { v = avancarAno(v).vida; v.momento = null; }
  v.caminhos.pendente = undefined;
  return transacao(v, x => ajuste(x)).vida;
}

function atleta(d: 'futebol' | 'tenis' | 'basquete', idade = 24, temporadas = 4): Vida {
  return vidaAos(idade, x => {
    garantirFrente(x, d); Object.assign(x.caminhos.frentes[d]!, { habilidade: 90, interesse: 90, meses: 140, auge: 90 });
    x.trabalho.atual = undefined; x.caminhos.esporte = undefined; x.caminhos.oportunidades = []; x.financas.conta += 500000;
    entrarNaBase(x, d, 'sao-paulo-sp', d === 'futebol' ? 'São Paulo' : d === 'tenis' ? 'academia de tênis de São Paulo' : 'Pinheiros');
    profissionalizar(x, criarRng(1), 3);
    const e = x.caminhos.esporte!;
    for (let k = 0; k < temporadas; k++) { x.t += 12; const r = criarRng(40 + k); const t = fecharTemporada(x, r, e); registrarTemporada(x, r, e, t); }
    x.momento = null;
  });
}

beforeEach(() => {
  localStorage.clear();
  window.scrollTo = () => {};
  window.confirm = () => true;
  const r = criarRng(20261001);
  vi.spyOn(Math, 'random').mockImplementation(() => r.next());
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('Você · "O que você construiu": a pessoa inteira, não só a profissão de agora', () => {
  it('a ex-atleta que virou contadora vê as duas trajetórias; o histórico do esporte só abre quando pedido', () => {
    const v = transacao(atleta('futebol', 26, 5), (x, r) => {
      encerrarCarreira(x, x.caminhos.esporte!, 'escolha');
      x.t += 24;
      const e = contratar(x, r, ocupacao('assistente_adm'), 'vaga'); e.tInicio = x.t - 36; e.empregador = 'a Construtora Litoral';
    }).vida;
    render(<Voce vida={v} agir={() => true} irPara={() => {}} abrirPessoa={() => {}} />);
    const sec = screen.getByRole('region', { name: 'O que você construiu' });
    expect(within(sec).getByText('Futebol profissional')).toBeTruthy();
    expect(within(sec).getByText(/temporadas, 1 clube/)).toBeTruthy();
    expect(within(sec).getByText('Escritório')).toBeTruthy();
    // O histórico é revelado aos poucos: a tabela só aparece depois de abrir.
    expect(within(sec).queryByRole('columnheader', { name: 'Gols' })).toBeNull();
    fireEvent.click(within(sec).getAllByRole('button', { name: 'Ver o histórico' })[0]);
    expect(within(sec).getAllByRole('columnheader', { name: 'Gols' }).length).toBeGreaterThan(0);
  });
});

describe('Trabalho · "A carreira no esporte" no idioma de cada modalidade', () => {
  it('tênis: por ano de circuito (V–D, finais, ranking, prêmios), sem coluna de clube', () => {
    const v = atleta('tenis');
    render(<Trabalho vida={v} agir={() => true} irPara={() => {}} />);
    expect(screen.getAllByRole('columnheader', { name: 'V–D' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('columnheader', { name: 'Ranking' }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('columnheader', { name: 'Clube' })).toBeNull();
    expect(screen.getAllByText(/anos de circuito/).length).toBeGreaterThan(0);
  });

  it('basquete: por equipe, com pontos, rebotes e assistências por jogo', () => {
    const v = atleta('basquete');
    render(<Trabalho vida={v} agir={() => true} irPara={() => {}} />);
    expect(screen.getAllByRole('columnheader', { name: 'Rebotes/j' }).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/pontos por jogo/).length).toBeGreaterThan(0);
  });
});
