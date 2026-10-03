// @vitest-environment jsdom
/**
 * Carreira de técnico 2.0, do lado da tela: Trabalho mostra a carreira de
 * técnico (a linha "N clubes · J jogos · V vitórias…", o clube de agora em
 * palavras, a tabela por passagem) AO LADO da carreira de jogador, que
 * continua com a tabela dela.
 */
import { beforeAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { precarregar } from '../App';
import { criarRng } from '../../motor/rng';
import { criarVida } from '../../motor/criacao';
import { avancarAno } from '../../motor/ano';
import type { Vida } from '../../motor/tipos';
import { Trabalho } from '../jogo/Trabalho';
import { transacao } from '../../motor/nucleo';
import { garantirFrente } from '../../motor/sistemas/frentes';
import { encerrarCarreira, entrarNaBase, fecharTemporada, profissionalizar } from '../../motor/sistemas/esporte';
import { registrarTemporada } from '../../motor/sistemas/palmares';
import { contratar } from '../../motor/sistemas/trabalho';
import { ocupacao } from '../../motor/dados/ocupacoes';
import { aceitarPropostaDeTecnico, demitirDoComando, passagemAtual, processarTecnico, propostaDeCrise, resumoDaPassagem } from '../../motor/sistemas/tecnico';

beforeAll(async () => { await precarregar(); });

function exJogadorTecnico(): Vida {
  let v = criarVida({ nome: 'Caio', sobrenome: 'Moraes', genero: 'masculino', municipioId: 'sao-paulo-sp', semente: 19 });
  for (let i = 0; i < 24; i++) { v = avancarAno(v).vida; v.momento = null; }
  v.caminhos.pendente = undefined;
  return transacao(v, x => {
    garantirFrente(x, 'futebol'); Object.assign(x.caminhos.frentes.futebol!, { habilidade: 88, interesse: 90, meses: 160, auge: 88 });
    x.trabalho.atual = undefined; x.caminhos.esporte = undefined; x.caminhos.oportunidades = []; x.educacao.matricula = undefined;
    entrarNaBase(x, 'futebol', 'sao-paulo-sp', 'São Paulo');
    profissionalizar(x, criarRng(1), 3);
    const e = x.caminhos.esporte!;
    for (let k = 0; k < 6; k++) { x.t += 12; const r = criarRng(40 + k); const t = fecharTemporada(x, r, e); registrarTemporada(x, r, e, t); }
    encerrarCarreira(x, e, 'idade');
    x.t += 24;
    x.trabalho.experiencia['treino'] = 48;
    contratar(x, criarRng(3), ocupacao('tecnico_futebol'), 'oportunidade');
    for (let k = 0; k < 4; k++) { const r = criarRng(60 + k); processarTecnico(x, r); if (passagemAtual(x)?.decisao) passagemAtual(x)!.decisao = undefined; x.t += 12; }
    if (!passagemAtual(x)) { contratar(x, criarRng(9), ocupacao('tecnico_futebol'), 'oportunidade'); processarTecnico(x, criarRng(10)); }
    x.momento = null;
  }).vida;
}

beforeEach(() => {
  localStorage.clear();
  window.scrollTo = () => {};
  window.confirm = () => true;
  const r = criarRng(20261002);
  vi.spyOn(Math, 'random').mockImplementation(() => r.next());
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('Trabalho · "Carreira como técnico"', () => {
  it('a carreira no banco aparece com a linha da carreira, o clube de agora e a tabela por passagem — e a de jogador continua ao lado', () => {
    const v = exJogadorTecnico();
    const p = passagemAtual(v)!;
    render(<Trabalho vida={v} agir={() => true} irPara={() => {}} />);
    const sec = screen.getByRole('region', { name: 'Carreira como técnico' });
    expect(within(sec).getByText(/\d+ clubes? · \d+ jogos · \d+ vitórias · \d+ empates · \d+ derrotas · \d+ títulos?/)).toBeTruthy();
    expect(within(sec).getByText('No comando')).toBeTruthy();
    expect(within(sec).getAllByText(new RegExp(p.clube)).length).toBeGreaterThan(0);
    // A pressão e o vestiário em palavras, nunca em número.
    expect(within(sec).getByText('Diretoria')).toBeTruthy();
    expect(within(sec).getByText(/^(tranquila|a de sempre|cobrança forte|o cargo está ameaçado)$/)).toBeTruthy();
    expect(within(sec).getByText(/^(fechado com você|sem problemas|dividido)$/)).toBeTruthy();
    for (const col of ['Clube', 'Período', 'J', 'V', 'E', 'D', 'Aprov.', 'Títulos', 'Saída']) expect(within(sec).getByRole('columnheader', { name: col })).toBeTruthy();
    const r = resumoDaPassagem(p);
    expect(within(sec).getAllByRole('cell', { name: String(r.jogos) }).length).toBeGreaterThan(0);
    // A carreira de jogador não foi apagada nem fundida: a seção dela continua, com a tabela por clube.
    fireEvent.click(screen.getByRole('button', { name: /A carreira no esporte/ }));
    expect(screen.getAllByText(/\d+ temporadas, 1 clube/).length).toBeGreaterThan(0);
  });

  it('a passagem que começou no meio da temporada diz de onde pegou o time, e conta só os jogos dirigidos', () => {
    const v = transacao(exJogadorTecnico(), x => {
      demitirDoComando(x);
      const c = x.caminhos.tecnico!;
      for (let s = 1; s < 400 && !c.proposta; s++) propostaDeCrise(x, criarRng(s), c);
      aceitarPropostaDeTecnico(x, criarRng(2), c.proposta!.id);
      x.t += 12;
      processarTecnico(x, criarRng(77));
      x.momento = null;
    }).vida;
    const p = v.caminhos.tecnico!.passagens.find(q => q.meioDeTemporada)!;
    render(<Trabalho vida={v} agir={() => true} irPara={() => {}} />);
    const sec = screen.getByRole('region', { name: 'Carreira como técnico' });
    expect(within(sec).getByText(`· assumiu na ${p.meioDeTemporada!.rodada + 1}ª rodada, em ${p.meioDeTemporada!.posicao}º`, { exact: false })).toBeTruthy();
    expect(p.temporadas[0].jogos).toBeLessThanOrEqual(p.meioDeTemporada!.rodadas - p.meioDeTemporada!.rodada);
  });
});
