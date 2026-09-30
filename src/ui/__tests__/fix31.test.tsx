// @vitest-environment jsdom
/**
 * FIX 3.1, do lado da tela: o que o motor novo sabe aparece onde o jogador
 * age — as residências por especialidade na Formação, a proposta de novela
 * com a conta (bruto, comissão, líquido) e o agente no Trabalho, o painel da
 * tenista com circuito, ranking e prêmio − custos.
 */
import { beforeAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { precarregar } from '../App';
import { criarRng } from '../../motor/rng';
import { criarVida } from '../../motor/criacao';
import { avancarAno } from '../../motor/ano';
import { contratar } from '../../motor/sistemas/trabalho';
import { ocupacao } from '../../motor/dados/ocupacoes';
import type { Vida } from '../../motor/tipos';
import { Trabalho } from '../jogo/Trabalho';
import { Estudos } from '../jogo/Estudos';
import { transacao } from '../../motor/nucleo';
import { garantirFrente } from '../../motor/sistemas/frentes';
import { novaProposta } from '../../motor/sistemas/audiovisual';
import { entrarNaBase, processarEsporte, profissionalizar } from '../../motor/sistemas/esporte';

beforeAll(async () => { await precarregar(); });

function vidaAos(idade: number, ajuste: (v: Vida) => void = () => {}, genero: 'feminino' | 'masculino' = 'feminino'): Vida {
  let v = criarVida({ nome: 'Rita', sobrenome: 'Lopes', genero, municipioId: 'recife-pe', semente: 5 });
  for (let i = 0; i < idade; i++) { v = avancarAno(v).vida; v.momento = null; }
  v.caminhos.pendente = undefined;
  ajuste(v);
  return v;
}

beforeEach(() => {
  localStorage.clear();
  window.scrollTo = () => {};
  window.confirm = () => true;
  const r = criarRng(20260930);
  vi.spyOn(Math, 'random').mockImplementation(() => r.next());
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('Formação: a residência é uma escolha de especialidade', () => {
  it('a médica formada vê cada residência como um item próprio (com a duração dela)', () => {
    const v = vidaAos(26, x => {
      x.trabalho.atual = undefined; x.educacao.matricula = undefined; x.educacao.basica = undefined;
      x.educacao.concluidos.push({ cursoId: 'medicina', nome: 'Medicina', nivel: 'superior', area: 'medicina', tFim: x.t - 12, instituicao: 'a UFPE', desempenho: 74 });
      x.educacao.escolaridade = 'superior'; x.trabalho.licencas.push('crm');
    });
    render(<Estudos vida={v} agir={() => true} irPara={() => {}} abrirPessoa={() => {}} />);
    // Entre os próximos caminhos, a residência vem na frente (e não o curso técnico abaixo da graduação).
    const proximos = screen.getByRole('heading', { name: 'Próximos caminhos' }).closest('section')!;
    expect(within(proximos).getAllByText(/^Residência em /).length).toBeGreaterThan(0);
    expect(within(proximos).queryByText(/^Técnico em/)).toBeNull();
    // No catálogo, todas as especialidades, cada uma com a sua duração.
    fireEvent.click(screen.getByRole('button', { name: /Explorar formações/ }));
    fireEvent.change(screen.getByPlaceholderText(/enfermagem, direito/), { target: { value: 'Residência' } });
    for (const nome of ['Residência em Cirurgia Geral', 'Residência em Pediatria', 'Residência em Medicina de Família e Comunidade', 'Residência em Psiquiatria']) expect(screen.getAllByText(nome).length).toBeGreaterThan(0);
  });
});

describe('Trabalho: a proposta, a conta e o agente', () => {
  it('a atriz vê a proposta de novela com bruto, comissão e líquido, e pode aceitar, negociar, recusar, dispensar o agente', () => {
    const v = vidaAos(30, x => {
      x.trabalho.atual = undefined;
      garantirFrente(x, 'teatro'); x.caminhos.frentes.teatro!.habilidade = 76;
      x.rotinas = x.rotinas.filter(z => z.id !== 'teatro'); x.rotinas.push({ id: 'teatro', tInicio: x.t - 96, nivel: 2 });
      contratar(x, criarRng(2), ocupacao('ator'), 'convite');
    });
    const w = transacao(v, x => { x.caminhos.audiovisual = { contratos: [], agente: { nome: 'Regina Prado', rede: 2, comissao: 0.15, tInicio: x.t } }; novaProposta(x, { tipo: 'novela', porte: 2, papel: 'coadjuvante', casa: 'uma emissora de TV aberta', titulo: 'Sol de Inverno' }); }).vida;
    render(<Trabalho vida={w} agir={() => true} irPara={() => {}} />);
    expect(screen.getAllByRole('button', { name: /Aceitar: coadjuvante na novela "Sol de Inverno"/ }).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/bruto − R\$ .* do agente .* líquido/).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /Pedir mais pelo papel/ }).length).toBeGreaterThan(0);
    // Dispensar o agente é uma saída: fica em "Mais ações", com o custo e o efeito ditos.
    for (const b of screen.getAllByRole('button', { name: /^Mais ações/ })) fireEvent.click(b);
    expect(screen.getAllByRole('button', { name: /Dispensar Regina Prado/ }).length).toBeGreaterThan(0);
  });

  it('a tenista profissional vê circuito, ranking e prêmio − custos (e nenhum "contrato")', () => {
    const v = vidaAos(21, x => {
      garantirFrente(x, 'tenis'); const f = x.caminhos.frentes.tenis!; f.habilidade = 84; f.meses = 150;
      x.educacao.basica = undefined; x.trabalho.atual = undefined; x.financas.conta = 90000;
    });
    const w = transacao(v, (x, r) => { entrarNaBase(x, 'tenis', x.moradia.municipioId, 'academia de tênis de Recife'); profissionalizar(x, r, 2); x.t += 12; processarEsporte(x, r); }).vida;
    render(<Trabalho vida={w} agir={() => true} irPara={() => {}} />);
    expect(screen.getByText('No circuito')).toBeTruthy();
    expect(screen.getByText(/^ranking \d+º/)).toBeTruthy();
    expect(screen.getByText(/Bruto R\$ .* − custos do circuito/)).toBeTruthy();
    expect(screen.queryByText('Salário do contrato')).toBeNull();
  });
});
