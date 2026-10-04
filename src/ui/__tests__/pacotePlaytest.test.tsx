// @vitest-environment jsdom
/**
 * Pacote pós-playtest, do lado da tela: o que o motor novo sabe aparece onde
 * o jogador age — e as telas não se contradizem.
 *   - Trabalho: a proposta mostra o clube que será executado; o palmarés e o
 *     histórico por clube; nenhuma porta de emprego comum para o jogador.
 *   - Você × Política: o mesmo nome público (fama) dos dois lados; a presença
 *     política à parte.
 *   - Você: usar a visibilidade.
 *   - Tempo livre: a viagem é uma porta (destinos com preço).
 *   - Pessoas: o match do aplicativo leva a "conversar"; a trajetória aparece.
 */
import { beforeAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { precarregar } from '../App';
import { criarRng } from '../../motor/rng';
import { criarVida } from '../../motor/criacao';
import { avancarAno } from '../../motor/ano';
import type { Vida } from '../../motor/tipos';
import { Trabalho } from '../jogo/Trabalho';
import { Voce } from '../jogo/Voce';
import { Tempo } from '../jogo/Tempo';
import { Pessoas } from '../jogo/Pessoas';
import { transacao } from '../../motor/nucleo';
import { garantirFrente } from '../../motor/sistemas/frentes';
import { criarProposta, entrarNaBase, profissionalizar, propostaNaMesa } from '../../motor/sistemas/esporte';
import { registrarTemporada } from '../../motor/sistemas/palmares';
import { entrarNaPolitica } from '../../motor/sistemas/politica';
import { abrirDecisao, conteudoPorId } from '../../motor/conteudo/motor';
import { contexto } from '../../motor/conteudo/base';
import { criarPessoa, vincular } from '../../motor/pessoas';

beforeAll(async () => { await precarregar(); });

function vidaAos(idade: number, ajuste: (v: Vida) => void = () => {}, genero: 'feminino' | 'masculino' = 'masculino', municipioId = 'sao-paulo-sp'): Vida {
  let v = criarVida({ nome: 'Caio', sobrenome: 'Prado', genero, municipioId, semente: 7 });
  for (let i = 0; i < idade; i++) { v = avancarAno(v).vida; v.momento = null; }
  v.caminhos.pendente = undefined;
  return transacao(v, x => ajuste(x)).vida;
}

function jogador(idade = 27): Vida {
  return vidaAos(idade, x => {
    garantirFrente(x, 'futebol'); Object.assign(x.caminhos.frentes.futebol!, { habilidade: 90, interesse: 90, meses: 140, auge: 90 });
    x.trabalho.atual = undefined; x.caminhos.esporte = undefined; x.caminhos.oportunidades = [];
    entrarNaBase(x, 'futebol', 'sao-paulo-sp', 'São Paulo'); profissionalizar(x, criarRng(1), 4); x.caminhos.esporte!.posicao = 'volante';
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

describe('Trabalho: a carreira no esporte tem memória e não recebe portas de emprego', () => {
  it('título no palmarés, histórico por clube, e nenhuma "proposta de concorrente" na tela', () => {
    const v = transacao(jogador(), (x, r) => {
      const e = x.caminhos.esporte!;
      const t = { ano: 2045, clube: e.clube, nivel: 4 as const, posicao: 'volante' as const, partidas: 32, titular: 28, gols: 2, assistencias: 3, defesa: 68, nota: 7.8, colocacao: 1, mesesFora: 0 };
      (e.temporadas ??= []).push(t); registrarTemporada(x, r, e, t);
      x.caminhos.oportunidades.push({ id: 'velha', tipo: 'proposta', titulo: 'Uma proposta', texto: 'Uma concorrente quer você para a mesma função, com salário melhor.', tInicio: x.t, tFim: x.t + 12, ocupacaoId: 'jogador_futebol', bonus: 0.18 });
    }).vida;
    render(<Trabalho vida={v} agir={() => true} irPara={() => {}} />);
    expect(screen.getByRole('button', { name: /^A carreira no esporte/ }).getAttribute('aria-expanded')).toBe('true');
    expect(screen.getAllByText(/Campeão da Série A com o São Paulo \(titular\)/).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('columnheader', { name: 'Desarmes' }).length).toBeGreaterThan(0);
    expect(screen.queryByText(/concorrente quer você/)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Ir à entrevista' })).toBeNull();
  });

  it('a decisão da proposta mostra o clube e a cidade que serão executados', () => {
    const v = transacao(jogador(), (x, r) => { criarProposta(x, x.caminhos.esporte!, 4, 'mercado'); x.fatos['esp_proposta_hoje'] = x.t; const d = conteudoPorId('esp_proposta'); if (d?.tipo === 'decisao') abrirDecisao(x, d, contexto(x, r)); }).vida;
    const p = propostaNaMesa(v)!;
    expect(v.momento?.texto).toContain(p.clube);
  });
});

describe('Você × Política: o mesmo nome dos dois lados', () => {
  it('o ex-jogador famoso é "famoso pelo futebol" em Você e na Política; como político, estreante', () => {
    const v = transacao(jogador(36), x => {
      x.notoriedade = { valor: 66, pico: 80, fonte: 'esporte', t: x.t, origens: { esporte: 80 } };
      x.caminhos.esporte!.fase = 'encerrada';
      x.trabalho.atual = undefined;
      entrarNaPolitica(x, 'notoriedade');
    }).vida;
    const { unmount } = render(<Voce vida={v} agir={() => true} irPara={() => {}} abrirPessoa={() => {}} />);
    expect(screen.getAllByText(/Para o público: famoso pelo futebol/).length).toBeGreaterThan(0);
    // Usar a visibilidade é uma ação (com o resultado em aberto).
    expect(screen.getByRole('heading', { name: 'O seu nome' })).toBeTruthy();
    expect(screen.getAllByText('Levar o nome para a política').length).toBeGreaterThan(0);
    unmount();
    render(<Trabalho vida={v} agir={() => true} irPara={() => {}} />);
    expect(screen.getAllByText(/famoso pelo futebol/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/pouco conhecid/)).toBeNull();
    expect(screen.getAllByText(/estreante na política/).length).toBeGreaterThan(0);
  });
});

describe('Tempo livre: a viagem é uma porta', () => {
  it('abrir "Uma viagem pelo Brasil" leva à região, ao destino e às durações, cada uma com o seu preço (em passos: ver viagens.test.tsx)', () => {
    const v = vidaAos(35, x => { x.financas.conta = 300000; x.trabalho.atual = undefined; }, 'feminino', 'recife-pe');
    render(<Tempo vida={v} agir={() => true} aba="viagens" />); // (FIX pós-REWORK 4: as viagens moram na aba "Viagens".)
    expect(screen.getByText('Uma viagem pelo Brasil')).toBeTruthy();
    fireEvent.click(screen.getAllByRole('button', { name: 'Ver destinos' })[0]);
    fireEvent.click(screen.getByRole('button', { name: /^Sudeste/ }));
    fireEvent.click(screen.getByRole('button', { name: /^Ouro Preto/ }));
    expect(screen.getAllByRole('button', { name: /^Uma semana.*R\$/ }).length).toBe(1);
    expect(screen.getAllByRole('button', { name: /dias.*R\$/ }).length).toBe(3);
  });
});

describe('Pessoas: o match do aplicativo tem caminho próprio', () => {
  it('depois do match, o próximo passo é conversar no aplicativo (e não o convite genérico); a trajetória aparece', () => {
    let id = '';
    const v = vidaAos(28, x => {
      x.eu.atracao = 'mulheres';
      const p = criarPessoa(x, criarRng(3), { idade: 27, genero: 'feminino', municipioId: x.moradia.municipioId });
      p.nome = 'Aurora'; p.atracao = 'homens'; id = p.id;
      const vin = vincular(x, p, { origem: 'online', proximidade: 26, estagio: 'conhecido' });
      vin.contexto = { via: 'app', abertura: 0.78, busca: 'relacionamento', etapa: 'match' };
      vin.fases = [{ fase: 'conhecido', t: x.t }, { fase: 'match', t: x.t }];
      vin.romance = { estagio: 'interesse', tEstagio: x.t, envolvimento: 55 };
    });
    render(<Pessoas vida={v} agir={() => true} aberta={id} abrir={() => {}} />);
    expect(screen.getAllByRole('button', { name: /Puxar conversa com Aurora no aplicativo/ }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: /Chamar Aurora para sair/ })).toBeNull();
    expect(screen.getByLabelText('A trajetória de vocês').textContent).toMatch(/aplicativo.*match/);
  });
});
