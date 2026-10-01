// @vitest-environment jsdom
/**
 * FIX final da generalização, do lado da tela: "A carreira no esporte" lê a
 * MESMA fonte do motor (a temporada e o histórico da modalidade) — o vôlei
 * com a função e os números por set, a natação com a prova e a marca, a luta
 * com a categoria e o cartel, o tênis com o ranking que os pontos deram.
 */
import { beforeAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { precarregar } from '../App';
import { criarRng } from '../../motor/rng';
import { criarVida } from '../../motor/criacao';
import { avancarAno } from '../../motor/ano';
import type { Dominio, Vida } from '../../motor/tipos';
import { Trabalho } from '../jogo/Trabalho';
import { transacao } from '../../motor/nucleo';
import { garantirFrente } from '../../motor/sistemas/frentes';
import { entrarNaBase, fecharTemporada, linhaDaTemporada, profissionalizar } from '../../motor/sistemas/esporte';
import { registrarTemporada } from '../../motor/sistemas/palmares';
import { funcaoVolei, NOME_FUNCAO_VOLEI, provaDe } from '../../motor/sistemas/provas';

beforeAll(async () => { await precarregar(); });

function atleta(d: Dominio, temporadas = 3): Vida {
  let v = criarVida({ nome: 'Lia', sobrenome: 'Moraes', genero: 'feminino', municipioId: 'sao-paulo-sp', semente: 9 });
  for (let i = 0; i < 22; i++) { v = avancarAno(v).vida; v.momento = null; }
  v.caminhos.pendente = undefined;
  return transacao(v, x => {
    garantirFrente(x, d); Object.assign(x.caminhos.frentes[d]!, { habilidade: 88, interesse: 90, meses: 140, auge: 88 });
    x.trabalho.atual = undefined; x.caminhos.esporte = undefined; x.caminhos.oportunidades = []; x.financas.conta += 500000; x.corpo.forma = 78;
    entrarNaBase(x, d, 'sao-paulo-sp', d === 'tenis' ? 'academia de tênis de São Paulo' : 'Pinheiros');
    profissionalizar(x, criarRng(1), 3);
    const e = x.caminhos.esporte!;
    for (let k = 0; k < temporadas; k++) { x.t += 12; const r = criarRng(40 + k); const t = fecharTemporada(x, r, e); registrarTemporada(x, r, e, t); }
    x.momento = null;
  }).vida;
}

beforeEach(() => {
  localStorage.clear();
  window.scrollTo = () => {};
  window.confirm = () => true;
  const r = criarRng(20261001);
  vi.spyOn(Math, 'random').mockImplementation(() => r.next());
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('Trabalho · cada modalidade com os números dela, da mesma fonte do motor', () => {
  it('vôlei: a função no placar, a linha da temporada do motor, e o histórico por set', () => {
    const v = atleta('volei');
    const t = v.caminhos.esporte!.temporadas!.slice(-1)[0];
    render(<Trabalho vida={v} agir={() => true} irPara={() => {}} />);
    expect(screen.getAllByText(new RegExp(NOME_FUNCAO_VOLEI[funcaoVolei(v)])).length).toBeGreaterThan(0);
    expect(screen.getByText(linhaDaTemporada(v, t))).toBeTruthy();
    expect(screen.getAllByRole('columnheader', { name: 'Sets' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('columnheader', { name: 'Pontos/set' }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('columnheader', { name: 'Gols' })).toBeNull();
  });

  it('natação: a prova no placar, a marca do ano no histórico — e nada de "banco"', () => {
    const v = atleta('natacao');
    const t = v.caminhos.esporte!.temporadas!.slice(-1)[0];
    render(<Trabalho vida={v} agir={() => true} irPara={() => {}} />);
    expect(screen.getAllByText(new RegExp(provaDe(v, 'natacao')!.nome)).length).toBeGreaterThan(0);
    expect(screen.getByText(linhaDaTemporada(v, t))).toBeTruthy();
    expect(screen.getAllByRole('columnheader', { name: 'Marca do ano' }).length).toBeGreaterThan(0);
    expect(screen.queryByText(/começa no banco/)).toBeNull();
  });

  it('luta: a categoria e o cartel (V–D, antes do tempo)', () => {
    const v = atleta('lutas');
    render(<Trabalho vida={v} agir={() => true} irPara={() => {}} />);
    expect(screen.getAllByText(/categoria até \d+ kg|categoria acima de \d+ kg/).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('columnheader', { name: 'Antes do tempo' }).length).toBeGreaterThan(0);
  });

  it('tênis: o ranking do placar é o que os pontos do ano deram', () => {
    const v = atleta('tenis');
    const t = v.caminhos.esporte!.temporadas!.slice(-1)[0];
    render(<Trabalho vida={v} agir={() => true} irPara={() => {}} />);
    expect(screen.getAllByText(new RegExp(`ranking ${t.ranking}º`)).length).toBeGreaterThan(0);
  });
});
