// @vitest-environment jsdom
/**
 * REWORK 11 · Fase B — o estado profissional nas telas (jornadas de verdade: Caminhos → divisão → o que se lê).
 *
 *   B1  o atleta sem clube aparece em Trabalho como jogador sem clube (nunca "Procurando trabalho", nem "Em andamento"
 *       com link para um "Meu trabalho" que diz "Sem trabalho"); sem contrato, nenhum salário de contrato
 *   B2  o convite de uma atividade por conta própria não diz "entrevista"; a mudança de carreira é dita antes do sim
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { App, precarregar } from '../App';
import { criarRng } from '../../motor/rng';
import { criarVida } from '../../motor/criacao';
import { avancarAno } from '../../motor/ano';
import { salvar } from '../../motor/save';
import { contratar, encerrarEmprego } from '../../motor/sistemas/trabalho';
import { ocupacao } from '../../motor/dados/ocupacoes';
import { novaOportunidade } from '../../motor/sistemas/oportunidades';
import type { CarreiraEsportiva, Vida } from '../../motor/tipos';
import { ordemDasDivisoes, situacaoAtual } from '../jogo/CaminhosDaVida';
import { DetalheDaOportunidade } from '../jogo/Alcance';
import { ocupacaoAtual } from '../apresentar';

beforeAll(async () => { await precarregar(); });
beforeEach(() => {
  localStorage.clear();
  window.scrollTo = () => {};
  window.confirm = () => true;
  const r = criarRng(20261023);
  vi.spyOn(Math, 'random').mockImplementation(() => r.next());
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function vida(idade: number, ajuste: (v: Vida) => void = () => {}, semente = 5): Vida {
  let v = criarVida({ nome: 'Caio', sobrenome: 'Lopes', genero: 'masculino', municipioId: 'recife-pe', semente });
  for (let i = 0; i < idade; i++) { v = avancarAno(v).vida; v.momento = null; v.caminhos.pendente = undefined; }
  v.caminhos.processo = undefined;
  ajuste(v);
  return v;
}
function abrirJogo(v: Vida): void {
  salvar(v);
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /Continuar/ }));
}
const area = (rotulo: string) => fireEvent.click(screen.getAllByRole('button', { name: rotulo })[0]);
const divisao = (rotulo: string) => fireEvent.click(within(screen.getByRole('navigation', { name: 'Divisões de Caminhos' })).getByRole('button', { name: rotulo }));

/** Um futebolista do Sport cujo contrato acabou sem renovação (o estado que o motor do esporte deixa). */
function jogadorSemClube(): Vida {
  return vida(27, x => {
    x.trabalho.atual = undefined;
    x.educacao.matricula = undefined;
    contratar(x, criarRng(1), ocupacao('jogador_futebol'));
    x.caminhos.esporte = { modalidade: 'futebol', fase: 'profissional', clube: 'Sport', nivel: 4, tInicio: x.t - 120, tFase: x.t - 96, lesoes: 0, municipioId: x.moradia.municipioId, reputacao: 62, posicao: 'atacante', espaco: 'titular' } as CarreiraEsportiva;
    encerrarEmprego(x, 'fim do contrato');
    x.fatos['esp_sem_clube'] = x.t;
  });
}

describe('B1 · o atleta sem clube mora em Trabalho, como jogador sem clube', () => {
  it('a página inicial: a situação diz "sem clube" (em Trabalho), nunca "Procurando trabalho"; Trabalho vem primeiro', () => {
    const v = jogadorSemClube();
    const s = situacaoAtual(v);
    expect(s.find(x => x.id === 'trabalho')?.rotulo).toMatch(/sem clube/);
    expect(s.some(x => x.id === 'procura')).toBe(false);
    expect(ordemDasDivisoes(v)[0]).toBe('trabalho');
    expect(ocupacaoAtual(v)).toMatch(/jogador de futebol sem clube/);
  });

  it('Caminhos → Trabalho: o título é a carreira sem clube, o placar diz o ÚLTIMO clube, e não há salário de contrato', () => {
    abrirJogo(jogadorSemClube());
    area('Caminhos'); divisao('Trabalho');
    const main = document.querySelector('main')!;
    const titulo = main.querySelector('.folio--oficio .folio__titulo')!.textContent ?? '';
    expect(titulo).toMatch(/sem clube/);
    expect(titulo).not.toMatch(/Sem trabalho/);
    const texto = main.textContent ?? '';
    expect(texto).toMatch(/último clube: Sport/);
    expect(texto).not.toMatch(/Salário do contrato/);
    expect(texto).toMatch(/sem salário de clube/);
  });

  it('Outros caminhos → "Em andamento" diz a situação e leva a Trabalho — que mostra a carreira (nada de beco "Meu trabalho")', () => {
    abrirJogo(jogadorSemClube());
    area('Caminhos'); divisao('Outros caminhos');
    const sec = document.querySelector('[data-em-andamento]')!;
    expect(sec).toBeTruthy();
    expect(sec.textContent).toMatch(/sem clube/);
    expect(sec.textContent).not.toMatch(/Meu trabalho/);
    fireEvent.click(within(sec as HTMLElement).getByRole('button', { name: /Ir para Trabalho/ }));
    expect(document.querySelector('main .folio--oficio .folio__titulo')!.textContent).toMatch(/sem clube/);
  });
});

describe('B2 · o convite diz o que ele é', () => {
  it('indicação por conta própria: sem "Aceitar leva à entrevista"; a vaga de salão continua com entrevista', () => {
    const v = vida(30, x => { x.trabalho.atual = undefined; });
    const conta = novaOportunidade(v, { tipo: 'indicacao', ocupacaoId: 'manicure', meses: 12, chave: 'a', titulo: 'Indicação de Adele', texto: 'Adele pode passar serviço para você.' })!;
    const salao = novaOportunidade(v, { tipo: 'indicacao', ocupacaoId: 'manicure_salao', meses: 12, chave: 'b', titulo: 'Indicação de Bia', texto: 'Bia pode indicar você.' })!;
    render(<DetalheDaOportunidade vida={v} id={conta.id} agir={() => true} aoFechar={() => {}} />);
    expect(document.body.textContent).not.toMatch(/Aceitar leva à entrevista/);
    expect(document.body.textContent).toMatch(/sem entrevista/);
    cleanup();
    render(<DetalheDaOportunidade vida={v} id={salao.id} agir={() => true} aoFechar={() => {}} />);
    expect(document.body.textContent).toMatch(/Aceitar leva à entrevista/);
  });

  it('para o atleta sem clube, a indicação de manicure vem como mudança de carreira, com o que a vida vai perguntar', () => {
    const v = jogadorSemClube();
    const o = novaOportunidade(v, { tipo: 'indicacao', ocupacaoId: 'manicure', meses: 12, chave: 'a', titulo: 'Indicação de Adele', texto: 'Adele pode passar serviço para você.' })!;
    render(<DetalheDaOportunidade vida={v} id={o.id} agir={() => true} aoFechar={() => {}} />);
    const t = document.body.textContent ?? '';
    expect(t).toMatch(/Mudança de carreira/);
    expect(t).toMatch(/É outra carreira/);
    expect(t).toMatch(/encerrar a carreira de jogador/);
  });
});
