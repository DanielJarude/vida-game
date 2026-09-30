// @vitest-environment jsdom
/**
 * REWORK Caminhos, Agência e UX — as telas respondem: onde estou, o que dá
 * para fazer, o que estou tentando, o que falta, se estou melhorando, qual é
 * o próximo passo. Ação parece ação; requisito parece requisito.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { criarVida } from '../../motor/criacao';
import { avancarAno } from '../../motor/ano';
import { contratar } from '../../motor/sistemas/trabalho';
import { ocupacao } from '../../motor/dados/ocupacoes';
import { curso } from '../../motor/dados/cursos';
import { criarRng } from '../../motor/rng';
import { areaDaPos, nomeDaFormacao } from '../../motor/sistemas/escola';
import { entrarNaPolitica } from '../../motor/sistemas/politica';
import type { Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { Trabalho } from '../jogo/Trabalho';
import { Estudos } from '../jogo/Estudos';

afterEach(() => cleanup());

function adulta(i: number, ajuste: (v: Vida) => void): Vida {
  let v = criarVida({ nome: 'Rita', sobrenome: 'Lopes', genero: 'feminino', municipioId: 'belo-horizonte-mg', semente: 9 });
  for (let k = 0; k < i; k++) { v = avancarAno(v).vida; v.momento = null; v.caminhos.pendente = undefined; }
  v.trabalho.atual = undefined; v.caminhos.oportunidades = []; v.caminhos.negocio = undefined; v.caminhos.politica = undefined; v.caminhos.esporte = undefined;
  ajuste(v);
  return v;
}

function formar(v: Vida, area: string, ...niveis: ('superior' | 'mestrado' | 'doutorado')[]) {
  let t = v.t - 12 * 9;
  for (const n of niveis) {
    const c = n === 'superior' ? curso(area) : curso(n);
    const a = n === 'superior' ? c.area : areaDaPos(v, c) ?? c.area;
    v.educacao.concluidos.push({ cursoId: c.id, nome: nomeDaFormacao(c, a), nivel: c.nivel, area: a, tFim: t, instituicao: 'Universidade Federal' });
    t += 36;
  }
  v.educacao.escolaridade = niveis[niveis.length - 1];
}

const tela = (v: Vida, agir: (a: Acao) => boolean = () => true) => render(<main><Trabalho vida={v} agir={agir} irPara={() => {}} /></main>);

describe('Trabalho', () => {
  it('cabo da PM: o próximo passo é uma lista de requisitos com o tipo certo (idade não é formação)', () => {
    const v = adulta(27, x => { const e = contratar(x, criarRng(1), ocupacao('cabo_pm')); e.tInicio = x.t - 96; e.tPosto = x.t - 24; x.trabalho.experiencia.pm = 96; });
    tela(v);
    const passo = screen.getByRole('region', { name: /Próximo passo: sargento da PM/i });
    expect(within(passo).getByText('Idade')).toBeTruthy();
    expect(within(passo).getByText('Tempo de corporação')).toBeTruthy();
    expect(within(passo).getByText('Tempo no posto')).toBeTruthy();
    expect(within(passo).queryByText('Formação')).toBeNull();
    expect(within(passo).getByText(/Pela antiguidade, a promoção a sargento da PM deve vir por volta de/)).toBeTruthy();
    // O estado de cada requisito também é texto (não só cor).
    expect(within(passo).getAllByText(/: (cumprido|falta|em \d{4}|depois)\./).length).toBeGreaterThan(2);
  });

  it('doutora em Nutrição procurando: a trajetória dela vem primeiro, e o modelo de trabalho é dito antes', () => {
    const v = adulta(36, x => { formar(x, 'nutricao', 'superior', 'mestrado', 'doutorado'); x.trabalho.desempregadoDesde = x.t - 6; });
    tela(v);
    const bloco = screen.getByText('Para você agora').closest('section')!;
    expect(within(bloco).queryAllByText(/nutricionista|professora de faculdade/i).length).toBeGreaterThan(0);
    expect(within(bloco).queryByText(/^diarista$/i)).toBeNull();
    expect(within(bloco).getAllByText(/vaga de emprego|por conta própria/).length).toBeGreaterThan(0);
    // Carreira acadêmica aparece como algo que ela está construindo, com um próximo passo.
    const construindo = screen.getByRole('region', { name: /O que você está construindo/ });
    expect(within(construindo).getByText('Carreira acadêmica')).toBeTruthy();
    expect(within(construindo).getByText(/Doutorado em Nutrição concluído/)).toBeTruthy();
  });

  it('adolescente que treina vôlei a sério: a técnica em palavras e o botão de pedir teste', () => {
    const v = adulta(14, x => {
      x.rotinas = x.rotinas.filter(r => r.id !== 'volei');
      x.rotinas.push({ id: 'volei', tInicio: x.t - 36, nivel: 2 });
      x.caminhos.frentes.volei = { interesse: 80, meses: 50, habilidade: 64, tInicio: x.t - 36, tUltimo: x.t, retomadas: 0, auge: 64 };
    });
    const pedidos: Acao[] = [];
    tela(v, a => { pedidos.push(a); return true; });
    const construindo = screen.getByRole('region', { name: /O que você está construindo/ });
    expect(within(construindo).getByText(/Chegar a uma equipe de vôlei/)).toBeTruthy();
    expect(within(construindo).getByText(/A técnica está "ainda longe do nível de uma base"/)).toBeTruthy();
    fireEvent.click(within(construindo).getByRole('button', { name: /Pedir um teste num clube/ }));
    expect(pedidos.some(a => (a as { tipo: string; oque?: string }).tipo === 'perseguir' && (a as { oque?: string }).oque === 'pedir_teste')).toBe(true);
  });

  it('"Outros caminhos": como começa cada vida, e a política é uma entre as outras', () => {
    const v = adulta(20, () => {});
    tela(v);
    const abrir = screen.getByRole('button', { name: /Procurar outro caminho/ });
    if (abrir.getAttribute('aria-expanded') !== 'true') fireEvent.click(abrir);
    fireEvent.click(screen.getByRole('radio', { name: 'Outros caminhos' }));
    for (const t of ['Esporte', 'Arte', 'Universidade e pesquisa', 'Forças Armadas', 'Polícia e bombeiros', 'Serviço público', 'O próprio negócio', 'Trabalhar por conta própria', 'Vida política']) expect(screen.getByRole('heading', { name: t })).toBeTruthy();
  });

  it('militar na vida política: o requisito da candidatura vem com a ação que o cumpre', () => {
    const v = adulta(34, x => { const e = contratar(x, criarRng(1), ocupacao('cabo_pm')); e.tInicio = x.t - 144; x.trabalho.experiencia.pm = 144; entrarNaPolitica(x, 'servidor'); });
    tela(v);
    expect(screen.getAllByText(/Militar da ativa não se filia/).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /Conversar com partidos sobre uma indicação/ }).length).toBeGreaterThan(0);
  });
});

describe('Estudos', () => {
  it('formação formal separada, com a área de cada pós', () => {
    const v = adulta(36, x => formar(x, 'nutricao', 'superior', 'mestrado', 'doutorado'));
    render(<main><Estudos vida={v} agir={() => true} irPara={() => {}} /></main>);
    const sec = screen.getByRole('heading', { name: 'Sua formação' }).closest('section')!;
    expect(within(sec).getByText('Doutorado em Nutrição')).toBeTruthy();
    expect(within(sec).getByText('Mestrado em Nutrição')).toBeTruthy();
  });

  it('preparação para o vestibular: a nota diante dos cursos, com o corte', () => {
    const v = adulta(18, x => { x.educacao.basica = undefined; x.educacao.escolaridade = 'medio'; x.educacao.matricula = undefined; x.educacao.enem.push({ t: x.t - 2, nota: 640 }); });
    render(<main><Estudos vida={v} agir={() => true} irPara={() => {}} /></main>);
    const lista = screen.getByRole('list', { name: /A sua nota diante dos cursos/ });
    expect(within(lista).getAllByText(/corte ~\d+/).length).toBeGreaterThan(0);
  });
});
