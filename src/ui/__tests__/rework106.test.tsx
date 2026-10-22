// @vitest-environment jsdom
/**
 * REWORK 10.6 — Uma vida ao seu alcance (a interface), em JORNADAS: o jogador quer algo e chega lá sem conhecer os
 * menus. Cada teste começa da área principal e segue cliques de verdade (nada de chamar o componente do destino direto,
 * quando a jornada é a navegação); o motor é o mesmo do jogo.
 *
 *   K1  entrar na faculdade (achar, ver cursos, candidatar-se, confirmar a matrícula)
 *   K2  a criança diante do que não pode pagar (o preço, o cofrinho, o que falta, pedir)
 *   K3  o convite com prazo (abrir o próprio convite, responder, o painel atualiza)
 *   K4  a saúde (parar o tratamento com o risco dito antes)
 *   K5  o trabalho (as ações principais seguem a vida)
 *   K6  o goleiro (a carreira em andamento, o treino da posição)
 *   K8  as novidades da atualização (uma vez por versão, e o histórico no Menu)
 *   K9  a confiança (ainda se formando ≠ abalada)
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { App, precarregar } from '../App';
import { criarRng } from '../../motor/rng';
import { criarVida } from '../../motor/criacao';
import { avancarAno } from '../../motor/ano';
import { salvar } from '../../motor/save';
import { contratar } from '../../motor/sistemas/trabalho';
import { ocupacao } from '../../motor/dados/ocupacoes';
import { novaOportunidade } from '../../motor/sistemas/oportunidades';
import { responsaveis } from '../../motor/sistemas/origem';
import { criarPessoa, vincular } from '../../motor/pessoas';
import type { Vida, Vinculo } from '../../motor/tipos';
import { Lugar as LugarDaCidade } from '../jogo/material/Lugares';
import { confiancaEmPalavras } from '../jogo/Pessoas';
import { deveMostrarNovidades, NOTAS, VERSAO_ATUAL } from '../novidades';
import { executar, type Acao } from '../../motor/acoes';

beforeAll(async () => { await precarregar(); });
beforeEach(() => {
  localStorage.clear();
  window.scrollTo = () => {};
  window.confirm = () => true;
  const r = criarRng(20261022);
  vi.spyOn(Math, 'random').mockImplementation(() => r.next());
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function vida(idade: number, ajuste: (v: Vida) => void = () => {}, semente = 5): Vida {
  let v = criarVida({ nome: 'Rita', sobrenome: 'Lopes', genero: 'feminino', municipioId: 'recife-pe', semente });
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

describe('K1 · entrar na faculdade', () => {
  it('Caminhos → Estudos → "Entrar na faculdade": os passos, as graduações com o que pedem, candidatar-se', () => {
    abrirJogo(vida(18, v => { v.educacao.basica = undefined; v.educacao.matricula = undefined; v.educacao.escolaridade = 'medio'; v.trabalho.atual = undefined; v.financas.conta = 30000; }));
    area('Caminhos');
    divisao('Estudos');
    // A primeira visualização: a formação e as ações principais.
    const painel = document.querySelector('[data-painel="minha-formacao"]')!;
    expect(painel).toBeTruthy();
    expect(painel.textContent).toMatch(/Escolaridade/);
    const entrar = painel.querySelector('[data-acao-principal="faculdade"]') as HTMLButtonElement;
    expect(entrar.textContent).toMatch(/Entrar na faculdade/);
    fireEvent.click(entrar);
    const fluxo = document.querySelector('[data-fluxo="faculdade"]')!;
    expect(fluxo).toBeTruthy();
    expect(fluxo.textContent).toMatch(/Candidatar-se/);
    expect(fluxo.textContent).toMatch(/Confirmar a matrícula/);
    // As graduações aparecem (mesmo as que ainda não estão ao alcance, com o porquê).
    const itens = fluxo.querySelectorAll('.cat-item');
    expect(itens.length).toBeGreaterThan(3);
    fireEvent.click(itens[0].querySelector('.cat-item__cabeca')!);
    expect(fluxo.textContent).toMatch(/Candidatar-se|não dá agora|Exige|exige/);
    // Bolsas e auxílios, a um toque.
    fireEvent.click(within(fluxo as HTMLElement).getByRole('button', { name: /Bolsas e auxílios/ }));
    expect(document.querySelector('[data-fluxo="bolsas"]')).toBeTruthy();
  });

  it('com a vaga aprovada, Estudos mostra a matrícula como passo próprio — confirmar põe o curso na vida', () => {
    const v = vida(19, x => { x.educacao.basica = undefined; x.educacao.matricula = undefined; x.educacao.escolaridade = 'medio'; x.trabalho.atual = undefined;
      x.educacao.aprovacao = { novo: { tipo: 'curso', cursoId: 'direito', via: 'privada', modalidade: 'ead', rede: 'privada', mensalidade: 500, municipioId: x.moradia.municipioId, instituicao: 'uma faculdade particular' }, nome: 'Direito, uma faculdade particular', t: x.t, tAte: x.t + 12 }; x.financas.conta = 30000; });
    abrirJogo(v);
    area('Caminhos');
    divisao('Estudos');
    const vaga = document.querySelector('[data-vaga-aprovada]')!;
    expect(vaga.textContent).toMatch(/Candidatura.*Aprovação.*Matrícula/);
    fireEvent.click(within(vaga as HTMLElement).getByRole('button', { name: 'Confirmar a matrícula' }));
    expect(document.querySelector('[data-vaga-aprovada]')).toBeNull();
  });
});

describe('K2 · a criança e a chuteira', () => {
  const crianca = (): Vida => vida(10, x => { x.financas.conta = 193; for (const r of responsaveis(x)) { r.vin.proximidade = 90; r.vin.tensao = 0; } });

  it('na loja: o preço, o cofrinho, o que falta — e pedir aos responsáveis, com este produto', () => {
    const v = crianca();
    let atual = v;
    const agir = (a: Acao) => { atual = executar(atual, a).vida; return true; };
    render(<main><LugarDaCidade vida={v} agir={agir} qual="esportes" aoFechar={() => {}} trocar={() => {}} /></main>);
    const pedido = document.querySelector('[data-pedido="chuteira_bola"]')!;
    expect(pedido).toBeTruthy();
    expect(pedido.textContent).toMatch(/Preço/);
    expect(pedido.textContent).toMatch(/No cofrinho/);
    expect(pedido.textContent).toMatch(/Falta/);
    const pedir = within(pedido as HTMLElement).getByRole('button', { name: /^Pedir a .+ para comprar/ });
    fireEvent.click(pedir);
    // A resposta é do adulto (pode ser não): o pedido foi feito e ficou registrado no ano — e o produto era este.
    expect(atual.anoAtual.acoes).toContain('crianca:pedido:chuteira_bola');
    expect(atual.financas.conta === 193 || atual.financas.conta === 0).toBe(true);
  });
});

describe('K3 · o convite com prazo', () => {
  it('tocar no convite do painel abre ESTE convite (quem chamou, prazo, o que muda); responder atualiza o painel', () => {
    let quem = '';
    const v = vida(15, x => {
      const p = criarPessoa(x, criarRng(7), { idade: 45, genero: 'masculino', municipioId: x.moradia.municipioId });
      p.nome = 'Francisco';
      vincular(x, p, { origem: 'escola', proximidade: 60 });
      quem = p.id;
      novaOportunidade(x, { tipo: 'iniciacao', meses: 12, chave: 'k3', titulo: 'Francisco chamou para um projeto', texto: 'Um projeto de ciências depois da aula.', pessoaId: p.id, atividade: 'projeto_escola' });
    });
    abrirJogo(v);
    const porta = document.querySelector('.agora [data-porta]') as HTMLButtonElement;
    expect(porta.textContent).toMatch(/Francisco chamou para um projeto/);
    fireEvent.click(porta);
    const dialogo = screen.getByRole('dialog', { name: /Convite: Francisco chamou para um projeto/ });
    expect(dialogo.textContent).toMatch(/Francisco/);
    expect(dialogo.textContent).toMatch(/Prazo/);
    expect(dialogo.textContent).toMatch(/O que pede/);
    expect(within(dialogo).getByRole('button', { name: 'Decidir depois' })).toBeTruthy();
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Deixar passar' }));
    expect(screen.queryByRole('dialog', { name: /Convite/ })).toBeNull();
    expect(document.querySelector('.agora [data-porta]')).toBeNull();
    expect(quem).not.toBe('');
  });
});

describe('K4 · parar o tratamento', () => {
  it('Você → Saúde: "Parar o tratamento…" diz o risco antes; confirmado, a condição aparece como tratamento parado', () => {
    const v = vida(40, x => { x.corpo.condicoes = [{ id: 'hipertensao', nome: 'hipertensão', tInicio: x.t - 60, cronica: true, gravidade: 2, tratando: true, diagnosticada: true, tTratamento: x.t - 24 }]; });
    abrirJogo(v);
    area('Você');
    fireEvent.click(screen.getByRole('tab', { name: /Saúde/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Parar o tratamento…' }));
    expect(document.body.textContent).toMatch(/pressão volta a subir/);
    fireEvent.click(screen.getByRole('button', { name: 'Parar mesmo assim' }));
    expect(document.body.textContent).toMatch(/tratamento parado/);
    expect(screen.getByRole('button', { name: /Retomar o tratamento/ })).toBeTruthy();
  });
});

describe('K5 · o trabalho segue a vida', () => {
  it('quem nunca trabalhou lê "Procurar o primeiro trabalho"; quem trabalha, "Mudar de trabalho"', () => {
    abrirJogo(vida(18, x => { x.trabalho.atual = undefined; x.trabalho.historico = []; }));
    area('Caminhos'); divisao('Trabalho');
    expect(document.querySelector('[data-acao-principal="vagas"]')!.textContent).toMatch(/Procurar o primeiro trabalho/);
    cleanup();
    abrirJogo(vida(30, x => { x.trabalho.atual = undefined; contratar(x, criarRng(2), ocupacao('assistente_adm')); }));
    area('Caminhos'); divisao('Trabalho');
    expect(document.querySelector('[data-acao-principal="vagas"]')!.textContent).toMatch(/Mudar de trabalho/);
    fireEvent.click(document.querySelector('[data-acao-principal="carreira"]')!);
    expect(document.querySelector('[data-painel="minha-carreira"]')).toBeTruthy();
  });
});

describe('K6 · o goleiro profissional', () => {
  it('Outros caminhos destaca a carreira em andamento; o treino extra é de goleiro', () => {
    const v = vida(22, x => {
      x.trabalho.atual = undefined;
      contratar(x, criarRng(1), ocupacao('jogador_futebol'));
      x.caminhos.esporte = { modalidade: 'futebol', fase: 'profissional', clube: 'Clube', nivel: 3, tInicio: x.t - 60, tFase: x.t - 24, lesoes: 0, municipioId: x.moradia.municipioId, reputacao: 40, posicao: 'goleiro', espaco: 'titular' };
    });
    abrirJogo(v);
    area('Caminhos'); divisao('Outros caminhos');
    expect(document.querySelector('[data-em-andamento]')).toBeTruthy();
    divisao('Trabalho');
    const texto = document.querySelector('main')!.textContent ?? '';
    expect(texto).toMatch(/Treino extra de goleiro/);
    expect(texto).not.toMatch(/Treino extra: finalização/);
  });
});

describe('K8 · as novidades da atualização', () => {
  it('quem jogava a versão anterior vê as notas uma vez; fecha, joga — e encontra o histórico no Menu', async () => {
    localStorage.setItem('VIDA_NOVIDADES_VISTAS', '10.5');
    expect(deveMostrarNovidades()).toBe(true);
    abrirJogo(vida(20));
    const janela = await screen.findByRole('dialog', { name: 'Novidades da atualização' });
    expect(janela.textContent).toMatch(/Novidades/);
    expect(janela.textContent).toMatch(/Melhorias/);
    expect(janela.textContent).toMatch(/Correções/);
    expect(janela.textContent).toContain(`Versão ${VERSAO_ATUAL}`);
    fireEvent.click(within(janela).getByRole('button', { name: 'Continuar jogando' }));
    expect(screen.queryByRole('dialog', { name: 'Novidades da atualização' })).toBeNull();
    expect(localStorage.getItem('VIDA_NOVIDADES_VISTAS')).toBe(VERSAO_ATUAL);
    expect(deveMostrarNovidades()).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'Novidades da atualização' }));
    expect(await screen.findByRole('dialog', { name: 'Novidades da atualização' })).toBeTruthy();
  });

  it('as notas são cadastradas por versão (sem repetir) e nenhuma está vazia', () => {
    expect(new Set(NOTAS.map(n => n.versao)).size).toBe(NOTAS.length);
    for (const n of NOTAS) expect(n.novidades.length + n.melhorias.length + n.correcoes.length).toBeGreaterThan(0);
  });
});

describe('K9 · a confiança lida com a história', () => {
  const vin = (x: Partial<Vinculo>): Vinculo => ({ pessoaId: 'p', proximidade: 30, confianca: 26, tensao: 0, historia: [], convivio: [], tInicio: 100, ...x } as Vinculo);
  it('recém-conhecida: "ainda se formando" (neutro), nunca "abalada"', () => {
    expect(confiancaEmPalavras(vin({}), 110)).toEqual({ palavra: 'ainda se formando', tom: 'neutro' });
    expect(confiancaEmPalavras(vin({}), 400).palavra).toBe('pouca');
  });
  it('abalada só com o que abalou: a briga, a mágoa que você causou; com motivo, quando foi a pessoa; rompida, ressentida', () => {
    expect(confiancaEmPalavras(vin({ historia: [{ t: 105, texto: 'Brigaram.', tipo: 'conflito' }] }), 110).palavra).toBe('abalada');
    expect(confiancaEmPalavras(vin({ magoa: { t: 105, motivo: 'traiu', gravidade: 2, quem: 'outro', ressentimento: 20 } }), 110).palavra).toBe('com motivo para desconfiar');
    expect(confiancaEmPalavras(vin({ magoa: { t: 105, motivo: 'x', gravidade: 3, quem: 'eu', ressentimento: 70 } }), 110).palavra).toBe('ressentida');
    expect(confiancaEmPalavras(vin({ ruptura: { t: 105, porque: 'x', quem: 'eu' } as Vinculo['ruptura'] }), 110).palavra).toBe('rompida');
  });
});
