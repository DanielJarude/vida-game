// @vitest-environment jsdom
/**
 * REWORK 2 — as telas contam a mesma história que o motor.
 *
 * Você, Tempo livre, Estudos, Trabalho e Pessoas leem as MESMAS fontes:
 * o condicionamento que Você diz é o que a academia mostra em Tempo livre;
 * a distância até Medicina que Estudos diz é a que Trabalho diz; o chamado
 * que "Pede atenção" é o que a ficha deixa responder.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { criarVida } from '../../motor/criacao';
import { avancarAno } from '../../motor/ano';
import { executar, disponibilidade, type Acao } from '../../motor/acoes';
import { criarRng } from '../../motor/rng';
import { criarPessoa, vincular } from '../../motor/pessoas';
import { curso } from '../../motor/dados/cursos';
import { palavraCondicionamento } from '../../motor/sistemas/pessoa';
import { estimativaParaCurso } from '../../motor/sistemas/vestibular';
import { emConstrucao } from '../../motor/sistemas/caminhosDeVida';
import { rotulosDoChamado } from '../../motor/sistemas/iniciativas';
import { sinalPessoal } from '../estadoPessoal';
import type { Vida } from '../../motor/tipos';
import { Voce } from '../jogo/Voce';
import { Tempo } from '../jogo/Tempo';
import { Estudos } from '../jogo/Estudos';
import { Pessoas } from '../jogo/Pessoas';

afterEach(() => cleanup());

function viva(i: number, semente = 31): Vida {
  let v = criarVida({ nome: 'Rita', sobrenome: 'Lopes', genero: 'feminino', municipioId: 'belo-horizonte-mg', semente });
  for (let k = 0; k < i; k++) { v = avancarAno(v).vida; v.momento = null; v.caminhos.pendente = undefined; }
  v.rotinas = []; v.corpo.condicoes = []; v.anoAtual = { acoes: [] };
  for (const vin of Object.values(v.vinculos)) { vin.chamado = undefined; if (vin.romance && vin.romance.estagio !== 'ex') vin.romance = undefined; }
  return v;
}

const nada = () => {};

describe('Você ↔ Tempo livre: o condicionamento é um só', () => {
  it('a palavra do condicionamento em Você é a da academia em Tempo livre; e a academia diz o que não faz', () => {
    let v = viva(25);
    v = executar(v, { tipo: 'rotina', id: 'academia', ativa: true, nivel: 1 }).vida;
    for (let k = 0; k < 2; k++) { v = avancarAno(v).vida; v.momento = null; }
    const palavra = palavraCondicionamento(v.corpo.forma);
    render(<main><Voce vida={v} agir={() => true} irPara={nada} abrirPessoa={nada} /></main>);
    const bloco = screen.getByRole('region', { name: 'Corpo e aprendizado' });
    expect(within(bloco).getByText('Condicionamento')).toBeTruthy();
    expect(within(bloco).getByText(palavra)).toBeTruthy();
    expect(within(bloco).getByText(/a academia/)).toBeTruthy();
    expect(screen.getByText('Bem-estar')).toBeTruthy();
    cleanup();
    render(<main><Tempo vida={v} agir={() => true} irPara={nada} /></main>);
    expect(screen.getByText(new RegExp(`Condicionamento: ${palavra}\\.`))).toBeTruthy();
    expect(screen.getByText(/não ensina um esporte/)).toBeTruthy();
  });
});

describe('Você: sinais do corpo antes do diagnóstico', () => {
  it('o que não tem nome aparece como sinal, com o cuidado possível — e o painel diz o mesmo', () => {
    const v = viva(40);
    v.mente.felicidade = 70; v.mente.estresse = 20;
    v.corpo.condicoes.push({ id: 'diabetes', nome: 'diabetes', tInicio: v.t - 12, cronica: true, gravidade: 2, tratando: false, diagnosticada: false });
    render(<main><Voce vida={v} agir={() => true} irPara={nada} abrirPessoa={nada} /></main>);
    const sinais = screen.getByRole('region', { name: 'Sinais do corpo' });
    expect(within(sinais).getByText(/muita sede/i)).toBeTruthy();
    expect(within(sinais).getByRole('button', { name: /Ir ao médico ver o que é/ })).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Condições de saúde' })).toBeNull();
    expect(sinalPessoal(v)).toBe('O corpo tem dado sinais.');
  });
});

describe('Estudos ↔ Trabalho ↔ Tempo livre: o vestibular é um só', () => {
  it('com Medicina em vista, Estudos diz a distância pela mesma conta de Trabalho; o cursinho começa em Estudos, não em Tempo livre', () => {
    let v = viva(16, 32);
    v.educacao.basica = { etapa: 'medio', serie: 2, rede: 'publica', desempenho: 60, reprovacoes: 0 };
    v = executar(v, { tipo: 'objetivo_estudo', cursoId: 'medicina' }).vida;
    const est = estimativaParaCurso(v, curso('medicina'));
    const trabalho = emConstrucao(v, (x, a) => disponibilidade(x, a)).find(c => c.id === 'vestibular')!;
    expect(trabalho.onde).toBe(est.frase);
    render(<main><Estudos vida={v} agir={() => true} irPara={nada} /></main>);
    expect(screen.getByLabelText('Objetivo: Medicina')).toBeTruthy();
    expect(screen.getByText(est.frase)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Começar o cursinho/ })).toBeTruthy();
    cleanup();
    render(<main><Tempo vida={v} agir={() => true} irPara={nada} /></main>);
    const explorar = screen.queryByRole('button', { name: /Explorar outras atividades/ });
    if (explorar) fireEvent.click(explorar);
    expect(screen.queryByText('Cursinho pré-vestibular')).toBeNull();
  });
});

describe('Estudos ↔ Tempo livre ↔ Trabalho: o estudo para concurso é de Estudos', () => {
  it('começa, muda de ritmo e de área em Estudos; Tempo livre não o oferece; Trabalho manda para Estudos', () => {
    let v = viva(22, 35);
    v.trabalho.atual = undefined; v.educacao.matricula = undefined; v.educacao.basica = undefined;
    render(<main><Estudos vida={v} agir={() => true} irPara={nada} /></main>);
    expect(screen.getByRole('button', { name: 'Começar a estudar para concurso' })).toBeTruthy();
    cleanup();
    v = executar(v, { tipo: 'rotina', id: 'estudar_concurso', ativa: true, nivel: 1 }).vida;
    render(<main><Estudos vida={v} agir={() => true} irPara={nada} /></main>);
    expect(screen.getByRole('button', { name: 'Parar de estudar' })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Para que área você estuda' })).toBeTruthy();
    cleanup();
    render(<main><Tempo vida={v} agir={() => true} irPara={nada} /></main>);
    expect(screen.getByRole('button', { name: /ver em Estudos/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Mais a sério: estudo firme/ })).toBeNull();
  });
});

describe('Pessoas: quem tomou a iniciativa', () => {
  function comChamado(): { v: Vida; id: string; nome: string } {
    const v = viva(30, 33);
    const p = criarPessoa(v, criarRng(8), { idade: 30, genero: 'feminino', municipioId: v.moradia.municipioId });
    const vin = vincular(v, p, { origem: 'escola', proximidade: 75, estagio: 'amigo_proximo', convivio: [] });
    vin.chamado = { tipo: 'pedido_ajuda', t: v.t, texto: `${p.nome} perdeu o emprego e pediu ajuda.`, assunto: 'emprego' };
    p.aperto = { tipo: 'desemprego', t: v.t };
    return { v, id: p.id, nome: p.nome };
  }

  it('o chamado pede atenção, a ficha mostra as reações certas, e reagir não gasta o tempo do ano', () => {
    const { v, id, nome } = comChamado();
    let atual = v;
    const agir = (a: Acao) => { atual = executar(atual, a).vida; return true; };
    const { rerender } = render(<main><Pessoas vida={v} agir={agir} aberta={null} abrir={nada} /></main>);
    const atencao = screen.getByRole('region', { name: 'Pedem atenção' });
    expect(within(atencao).getByText(`${nome} perdeu o emprego e pediu ajuda.`)).toBeTruthy();
    // Não há contador de "momentos" no ano (sem moeda social).
    expect(screen.queryByText(/ainda há tempo para/)).toBeNull();
    rerender(<main><Pessoas vida={v} agir={agir} aberta={id} abrir={nada} /></main>);
    const r = rotulosDoChamado(v.pessoas[id], v.vinculos[id].chamado!);
    expect(screen.getByText('Como reagir')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: r.sim }));
    expect(screen.getByRole('button', { name: r.nao })).toBeTruthy();
    expect(atual.vinculos[id].chamado).toBeUndefined();
    rerender(<main><Pessoas vida={atual} agir={agir} aberta={null} abrir={nada} /></main>);
    expect(screen.queryByText(`${nome} perdeu o emprego e pediu ajuda.`)).toBeNull();
  });

  it('conhecer alguém: os contextos desta vida, uma vez por ano', () => {
    const v = viva(27, 34);
    v.eu.atracao = 'homens';
    render(<main><Pessoas vida={v} agir={() => true} aberta={null} abrir={nada} /></main>);
    expect(screen.getByRole('button', { name: 'Tentar um aplicativo de encontros' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Sair para conhecer gente' })).toBeTruthy();
  });
});
