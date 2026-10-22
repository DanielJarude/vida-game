// @vitest-environment jsdom
/**
 * REWORK 10.5 — Coerência, interfaces, fama e consequências (a interface).
 *
 *   EDU-05  o histórico acadêmico na faculdade (disciplinas, notas, créditos) e o histórico escolar que fica
 *   SAU-02  o atendimento médico sempre visível no prontuário — a criança pede aos responsáveis
 *   UX-14   a categoria da ficha não promete o que não mostra (Romance "1" e vazia)
 *   UX-15   "O que faz sentido agora" não cresce a cada interação
 *   UX-20   a busca de "onde fica" leva ao médico, não aos atributos
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { precarregar } from '../App';
import { criarRng } from '../../motor/rng';
import { transacao } from '../../motor/nucleo';
import { adulto, comParceiro, pessoaNova } from '../../motor/__tests__/cenarios';
import { nova, viver, viverAte } from '../../motor/__tests__/ajuda';
import { vincular } from '../../motor/pessoas';
import { executar, type Acao } from '../../motor/acoes';
import { efetivarMatricula } from '../../motor/sistemas/escola';
import type { Vida } from '../../motor/tipos';
import { Pessoas } from '../jogo/Pessoas';
import { Voce } from '../jogo/Voce';
import { Estudos } from '../jogo/Estudos';
import { DesenvolvimentoReal } from '../jogo/Progresso';
import { prioridadesDaFicha, rotuloInteracao } from '../../motor/sistemas/interacoes';
import { buscarIntencoes, resolverDestino, rotuloDoLugar } from '../navegacao';

beforeAll(async () => { await precarregar(); });
beforeEach(() => {
  localStorage.clear(); window.scrollTo = () => {};
  const r = criarRng(20261022); vi.spyOn(Math, 'random').mockImplementation(() => r.next());
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const nada = (_a: Acao) => true;
const em = (v: Vida, f: (x: Vida) => void): Vida => transacao(v, x => { f(x); }).vida;

describe('EDU-05 · o histórico acadêmico na tela', () => {
  it('na faculdade, a parte Boletim mostra o histórico acadêmico com as disciplinas do curso e os créditos', () => {
    let v = em(adulto(18, { semente: 9 }), x => { x.educacao.matricula = undefined; x.trabalho.atual = undefined; efetivarMatricula(x, { tipo: 'curso', cursoId: 'direito', via: 'sisu', modalidade: 'presencial', rede: 'publica', mensalidade: 0, municipioId: x.moradia.municipioId, instituicao: 'a universidade federal' }); });
    v = viver(v, 2);
    render(<main><DesenvolvimentoReal vida={v} lado="estudos" /></main>);
    const doc = document.querySelector('[data-historico="curso"]')!;
    expect(doc).toBeTruthy();
    expect(doc.textContent).toContain('Histórico acadêmico');
    expect(doc.textContent).toMatch(/Direito Constitucional|Introdução ao Direito|Teoria do Estado/);
    expect(doc.querySelector('[data-creditos]')).toBeTruthy();
  });

  it('depois do médio, Estudos · Histórico continua mostrando os anos da escola', () => {
    const v = viverAte(nova({ semente: 5 }), 19);
    render(<main><Estudos vida={v} agir={nada} irPara={() => {}} abrirPessoa={() => {}} parte="historico" /></main>);
    const lista = document.querySelector('[data-historico="todos"]')!;
    expect(lista).toBeTruthy();
    expect(lista.querySelectorAll('[data-registro]').length).toBeGreaterThanOrEqual(9);
  });
});

describe('SAU-02 · o atendimento médico no prontuário', () => {
  it('a criança com sinais vê o caminho — pedir aos responsáveis — com o botão ativo', () => {
    const v = em(viverAte(nova({ semente: 4 }), 8), x => { x.corpo.condicoes.push({ id: 'cancer', nome: 'câncer', tInicio: x.t - 6, cronica: true, gravidade: 3, tratando: false, diagnosticada: false }); });
    render(<main><Voce vida={v} agir={nada} irPara={() => {}} abrirPessoa={() => {}} parte="saude" /></main>);
    const sec = document.querySelector('[data-atendimento]')!;
    expect(sec).toBeTruthy();
    const botao = within(sec as HTMLElement).getByRole('button', { name: /pedir para ir ao médico/i }) as HTMLButtonElement;
    expect(botao.disabled).toBe(false);
    expect(sec.textContent).toMatch(/adultos da casa/);
  });

  it('o adulto sem sinal nenhum também encontra o médico (check-up)', () => {
    render(<main><Voce vida={adulto(40, { semente: 3 })} agir={nada} irPara={() => {}} abrirPessoa={() => {}} parte="saude" /></main>);
    expect(within(document.querySelector('[data-atendimento]') as HTMLElement).getByRole('button', { name: /check-up|atendimento médico/i })).toBeTruthy();
  });
});

describe('UX-14 / UX-15 · a ficha da pessoa', () => {
  /** Cada categoria: o número no título é o número de botões que dá para apertar dentro dela. */
  function conferirCategorias(): void {
    for (const cat of [...document.querySelectorAll('.ficha__categoria')]) {
      const conta = cat.querySelector('.ficha__categoria-conta')!.textContent!;
      const ativos = [...cat.querySelectorAll('.grupo-acoes button')].filter(b => !(b as HTMLButtonElement).disabled).length;
      expect(conta === '—' ? 0 : Number(conta), cat.querySelector('summary')!.textContent!).toBe(ativos);
      // Nenhuma categoria abre vazia: ou tem botão, ou diz por quê.
      expect(cat.querySelectorAll('.grupo-acoes > *').length + cat.querySelectorAll('.ficha__categoria-vazia, .ficha__categoria-feitas').length).toBeGreaterThan(0);
    }
  }

  it('casado, diante de alguém que não se interessa: Romance não promete um convite que não aparece', () => {
    let id = '';
    const v = em(adulto(30, { semente: 41, genero: 'masculino' }), x => {
      comParceiro(x, { genero: 'feminino' });
      const p = pessoaNova(x, 29, 'masculino', { atracao: 'mulheres' });
      vincular(x, p, { origem: 'trabalho', proximidade: 50, estagio: 'amigo' });
      id = p.id;
    });
    render(<Pessoas vida={v} agir={nada} aberta={id} abrir={() => {}} />);
    conferirCategorias();
  });

  it('interagir não faz as listas crescerem: o feito fica como feito, e o "agora" não se reabastece', () => {
    let id = '';
    let v = em(adulto(30, { semente: 42 }), x => { const p = pessoaNova(x, 31, 'feminino'); vincular(x, p, { origem: 'trabalho', proximidade: 55, estagio: 'amigo' }); id = p.id; });
    const contar = () => ({ agora: document.querySelectorAll('.ficha__agora button').length, botoes: document.querySelectorAll('.ficha__categoria .grupo-acoes button').length });
    const { rerender } = render(<Pessoas vida={v} agir={nada} aberta={id} abrir={() => {}} />);
    const antes = contar();
    conferirCategorias();
    for (let k = 0; k < 3; k++) {
      // Faz, pelo motor, uma das ações sugeridas que ainda não foi feita (a ficha só lê a vida).
      const qual = prioridadesDaFicha(v, id).ids.find(x => !v.anoAtual.acoes.includes(`pessoa:${x}:${id}`));
      if (!qual) break;
      v = executar(v, { tipo: 'pessoa', pessoaId: id, interacao: qual }).vida;
      rerender(<Pessoas vida={v} agir={nada} aberta={id} abrir={() => {}} />);
      const depois = contar();
      expect(depois.agora).toBe(antes.agora);
      // O feito não volta como botão nas categorias (antes, cada interação somava um botão cinza "já fez").
      const feitos = v.anoAtual.acoes.filter(a => a.startsWith('pessoa:') && a.endsWith(`:${id}`)).map(a => rotuloInteracao(v, id, a.split(':')[1]));
      const nasCategorias = [...document.querySelectorAll('.ficha__categoria .grupo-acoes button')].map(b => b.textContent!.trim());
      for (const f of feitos) expect(nasCategorias.some(t => t.startsWith(f)), f).toBe(false);
      // O que surge é só o que o estado novo abriu (a confiança que cresceu): no máximo um por interação.
      expect(depois.botoes).toBeLessThanOrEqual(antes.botoes + 1);
      conferirCategorias();
    }
  });
});

describe('UX-20 · a busca de "onde fica"', () => {
  it('"saúde", "médico" e "cuidar" levam ao prontuário (Você · Saúde) — antes, "saúde" trazia primeiro o custo de vida', () => {
    for (const termo of ['saúde', 'médico', 'cuidar', 'sintoma', 'consulta']) {
      const r = buscarIntencoes(termo);
      expect(r.length, termo).toBeGreaterThan(0);
      expect(r[0].lugar, termo).toEqual({ area: 'voce', voce: 'saude' });
    }
    expect(rotuloDoLugar({ area: 'voce', voce: 'saude' })).toBe('Você · Saúde');
    expect(resolverDestino('prontuario')).toEqual({ area: 'voce', voce: 'saude' });
  });
});

import { PaginaCaminhos } from '../jogo/CaminhosDaVida';
import { Trabalho } from '../jogo/Trabalho';
import { VidaConcreta } from '../jogo/VidaConcreta';
import { contratar } from '../../motor/sistemas/trabalho';
import { ocupacao } from '../../motor/dados/ocupacoes';
import { novaProposta } from '../../motor/sistemas/audiovisual';
import { marcar } from '../../motor/sistemas/marcas';
import { conquistasDoAno } from '../../motor/sistemas/fechamento';

describe('CRI-02 · Caminhos → Submundo', () => {
  it('o adulto vê a divisão Submundo, com a situação, a porta e o que pesa — sem ensinar nada', () => {
    const v = adulto(25, { semente: 3 });
    render(<main><PaginaCaminhos vida={v} agir={nada} irPara={() => {}} divisao="submundo" parte="agora" irParte={() => {}} /></main>);
    expect(document.querySelector('.divisoes-caminhos')!.textContent).toContain('Submundo');
    const painel = document.querySelector('[data-divisao="submundo"]')!;
    expect(painel.textContent).toMatch(/Nenhum envolvimento/);
    expect(within(painel as HTMLElement).getByRole('button', { name: /Procurar um contato/ })).toBeTruthy();
  });
  it('a criança não vê a divisão', () => {
    const v = viverAte(nova({ semente: 8 }), 9);
    render(<main><PaginaCaminhos vida={v} agir={nada} irPara={() => {}} divisao="inicio" parte="agora" irParte={() => {}} /></main>);
    expect(document.querySelector('.divisoes-caminhos')!.textContent).not.toContain('Submundo');
  });
});

describe('UX-19 / CAR-06 · a carreira de atuação, sempre no mesmo painel, e a ficha do papel', () => {
  for (const oc of ['ator', 'ator_reconhecido'] as const) {
    it(`${oc}: resumo, produção, propostas (com a ficha) e dinheiro — sem "freguesia" nem escada de cargos`, () => {
      const v = em(adulto(34, { semente: 21 }), x => {
        x.educacao.matricula = undefined; x.trabalho.atual = undefined;
        contratar(x, criarRng(2), ocupacao(oc), 'convite');
        x.caminhos.frentes.teatro = { interesse: 90, meses: 200, habilidade: 78, tInicio: x.t - 200, tUltimo: x.t, retomadas: 0, auge: 78 };
        novaProposta(x, { tipo: 'filme', porte: 2, papel: 'protagonista', casa: 'uma produtora de cinema', titulo: 'A Ilha Calada' });
      });
      render(<main><Trabalho vida={v} agir={nada} irPara={() => {}} parte="agora" divisao /></main>);
      const painel = screen.getByRole('region', { name: 'A carreira de atuação' });
      for (const t of ['A carreira', 'Em produção', 'Propostas', 'O dinheiro']) expect(painel.textContent).toContain(t);
      const ficha = painel.querySelector('[data-proposta]')!;
      expect(ficha.textContent).toMatch(/Sinopse/);
      expect(ficha.textContent).toMatch(/Na carreira/);
      expect(document.body.textContent).not.toMatch(/Freguesia|Almoçar com a chefia|curso da empresa/);
    });
  }
});

describe('FAM-01 · o nome em partes', () => {
  it('Você · No mundo: reconhecimento, prestígio, alcance e redes — coisas diferentes', () => {
    const v = em(adulto(40, { semente: 31 }), x => { x.notoriedade = { valor: 62, pico: 62, t: x.t, fonte: 'arte' }; });
    render(<main><Voce vida={v} agir={nada} irPara={() => {}} abrirPessoa={() => {}} parte="mundo" /></main>);
    const sec = document.querySelector('.fama-ficha')!;
    for (const t of ['Reconhecimento público', 'Prestígio profissional', 'Alcance']) expect(sec.textContent).toContain(t);
  });
});

describe('ECO-04 · o dinheiro da criança', () => {
  it('aos 9: o cofrinho, pedir aos responsáveis, tarefas pagas, brigadeiros — e comprar o que é da idade com o que guardou', () => {
    const v = em(viverAte(nova({ semente: 12 }), 9), x => { x.financas.conta = 2000; });
    render(<main><VidaConcreta vida={v} agir={nada} secao="dinheiro" irSecao={() => {}} irPara={() => {}} abrirPessoa={() => {}} /></main>);
    expect(screen.getByRole('button', { name: /Pedir dinheiro aos responsáveis/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /brigadeiros/ })).toBeTruthy();
    cleanup();
    render(<main><VidaConcreta vida={v} agir={nada} secao="compras" irSecao={() => {}} irPara={() => {}} abrirPessoa={() => {}} /></main>);
    expect(screen.getByText('Com o seu dinheiro')).toBeTruthy();
  });
});

describe('EVT-06 · a conquista do ano', () => {
  it('a conquista registrada no ano entra no fechamento (e a tela a mostra no alto do ano que passou)', () => {
    const v = em(adulto(28, { semente: 41 }), x => { marcar(x, 'conquista', 'Venceu o Festival Internacional do Atlântico.', 3); });
    expect(conquistasDoAno(v)[0]).toMatch(/Atlântico/);
  });
});
