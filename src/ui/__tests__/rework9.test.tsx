// @vitest-environment jsdom
/**
 * REWORK 9 — A vida organizada (a interface).
 *
 * Fase 0 · SOC-01: o celular mostra de onde veio o público — e o que mostra
 * é exatamente o balanço que o motor guardou (a conta fecha).
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { precarregar } from '../App';
import { criarRng } from '../../motor/rng';
import { avancarAno } from '../../motor/ano';
import { executar, type Acao } from '../../motor/acoes';
import { idade, transacao } from '../../motor/nucleo';
import { adulto } from '../../motor/__tests__/cenarios';
import { contaAtiva, fimDoBalanco, seguidoresEmPalavras } from '../../motor/sistemas/redesBase';
import type { Vida } from '../../motor/tipos';
import { RedesSociais } from '../jogo/Redes';

beforeAll(async () => { await precarregar(); });
beforeEach(() => {
  localStorage.clear(); window.scrollTo = () => {}; window.confirm = () => true;
  window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as never;
  const r = criarRng(20261017); vi.spyOn(Math, 'random').mockImplementation(() => r.next());
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const rede = (oque: string, extra: Record<string, unknown> = {}) => ({ tipo: 'rede', op: { oque, plataforma: 'instagram', ...extra } }) as Acao;

describe('SOC-01 · o balanço do público no celular', () => {
  it('as parcelas mostradas são as do motor, e a conta fecha', () => {
    let v: Vida = adulto(28, { semente: 31 });
    v = transacao(v, x => { x.financas.conta = 1e6; x.notoriedade = { valor: 55, pico: 55, t: x.t, fonte: 'arte', origens: { arte: 55 } }; }).vida;
    v = executar(v, rede('criar')).vida;
    v = executar(v, rede('publicar', { tema: 'cotidiano' })).vida;
    v = avancarAno(v).vida;
    v.momento = null;
    const c = contaAtiva(v, 'instagram')!;
    const b = c.anos![c.anos!.length - 1];
    expect(fimDoBalanco(b)).toBe(b.fim);
    render(<main><RedesSociais vida={v} agir={() => true} /></main>);
    const caixa = screen.getByRole('region', { name: 'De onde veio o público' });
    expect(within(caixa).getByText(seguidoresEmPalavras(b.fim!))).toBeTruthy();
    const valor = (id: string) => caixa.querySelector(`[data-parcela="${id}"] .balanco-publico__valor`)?.textContent;
    if (b.publicacoes) expect(valor('publicacoes')).toBe(`+${seguidoresEmPalavras(b.publicacoes)}`);
    if (b.exposicao) expect(valor('exposicao')).toBe(`+${seguidoresEmPalavras(b.exposicao)}`);
    if (b.perdas) expect(valor('perdas')).toBe(`−${seguidoresEmPalavras(b.perdas)}`);
    expect(b.exposicao).toBeGreaterThan(0);
    expect(within(caixa).getByText(/pelo nome, fora da rede/)).toBeTruthy();
  });
});

/* =============================================================== FASE A — a navegação nova, sem perder nada */

import { fireEvent } from '@testing-library/react';
import { criarVida } from '../../motor/criacao';
import { contratar } from '../../motor/sistemas/trabalho';
import { ocupacao } from '../../motor/dados/ocupacoes';
import { resolverDestino, MAPA_DE_INTENCOES, AREAS } from '../navegacao';
import { Estudos } from '../jogo/Estudos';
import { Trabalho } from '../jogo/Trabalho';
import { PaginaCaminhos, situacaoAtual, ordemDosLados } from '../jogo/CaminhosDaVida';

function vidaAos(idade: number, ajuste: (v: Vida) => void = () => {}, semente = 12): Vida {
  let v = criarVida({ nome: 'Ana', sobrenome: 'Reis', genero: 'feminino', municipioId: 'recife-pe', semente });
  for (let i = 0; i < idade; i++) { v = avancarAno(v).vida; v.momento = null; v.caminhos.pendente = undefined; }
  v.caminhos.processo = undefined;
  ajuste(v);
  return v;
}
const botoes = (raiz: ParentNode) => [...raiz.querySelectorAll('button')].map(b => (b.getAttribute('aria-label') ?? b.textContent ?? '').trim()).filter(Boolean);

describe('Fase A · Caminhos une Formação e Trabalho sem perder ação nenhuma', () => {
  const casos: [string, () => Vida][] = [
    ['criança de 9', () => vidaAos(9)],
    ['adolescente de 16', () => vidaAos(16)],
    ['adulta empregada que estuda', () => vidaAos(27, v => { v.trabalho.atual = undefined; contratar(v, criarRng(3), ocupacao('assistente_adm')); })],
    ['adulta sem trabalho', () => vidaAos(31, v => { v.trabalho.atual = undefined; v.financas.conta = 2000; })]
  ];
  for (const [nome, fazer] of casos) {
    it(`${nome}: todo botão das páginas antigas de Formação e Trabalho existe em Caminhos (numa das quatro abas)`, () => {
      const v = fazer();
      const antes = new Set<string>();
      const a = render(<main><Estudos vida={v} agir={() => true} irPara={() => {}} /></main>);
      botoes(a.container).forEach(b => antes.add(b));
      a.unmount();
      if (v.trabalho.atual || v.trabalho.historico.length || idadeDe(v) >= 14) {
        const b = render(<main><Trabalho vida={v} agir={() => true} irPara={() => {}} /></main>);
        // A procura, na página antiga, começava recolhida: abre-se para comparar tudo o que ela oferece.
        const procurar = b.container.querySelector<HTMLButtonElement>('#titulo-explorar');
        if (procurar?.getAttribute('aria-expanded') === 'false') fireEvent.click(procurar);
        botoes(b.container).forEach(x => antes.add(x));
        b.unmount();
      }
      const c = render(<main><PaginaCaminhos vida={v} agir={() => true} irPara={() => {}} parte="agora" irParte={() => {}} /></main>);
      const depois = new Set(botoes(c.container));
      // O que muda de nome por causa da navegação nova (o destino mudou, a ação é a mesma).
      const renomeados = /Formação|em Trabalho|Procurar outro caminho|Tempo livre/;
      const faltando = [...antes].filter(x => !depois.has(x) && !renomeados.test(x));
      expect(faltando, nome).toEqual([]);
    });
  }

  it('a situação atual diz tudo o que ocupa a vida ao mesmo tempo — e a ordem dos lados segue a fase da vida', () => {
    const crianca = vidaAos(9);
    expect(situacaoAtual(crianca).map(x => x.lado)).toContain('formacao');
    expect(ordemDosLados(crianca)).toEqual(['formacao', 'trabalho']);
    const ambos = vidaAos(20, v => { v.trabalho.atual = undefined; contratar(v, criarRng(4), ocupacao('assistente_adm')); v.educacao.matricula = { cursoId: 'administracao', instituicao: 'Faculdade da Cidade', rede: 'privada', modalidade: 'presencial', tInicio: v.t, mesesRestantes: 30, mensalidade: 800, desempenho: 60, trancado: false, municipioId: v.moradia.municipioId }; });
    const lados = situacaoAtual(ambos).map(x => x.id);
    expect(lados).toContain('trabalho');
    expect(lados).toContain('curso');
    expect(ordemDosLados(ambos)).toEqual(['trabalho', 'formacao']);
  });

  it('os destinos antigos continuam chegando ao lugar novo', () => {
    expect(resolverDestino('formacao')).toMatchObject({ area: 'caminhos', parte: 'agora', foco: 'formacao' });
    expect(resolverDestino('estudos')).toMatchObject({ area: 'caminhos', foco: 'formacao' });
    expect(resolverDestino('trabalho')).toMatchObject({ area: 'caminhos', parte: 'agora', foco: 'trabalho' });
    expect(resolverDestino('concursos')).toMatchObject({ area: 'caminhos', parte: 'oportunidades', explorar: 'concursos' });
    expect(resolverDestino('viagens')).toMatchObject({ area: 'vida', secao: 'viagens' });
    expect(AREAS.map(a => a.rotulo)).toEqual(['História', 'Você', 'Pessoas', 'Caminhos', 'Minha Semana', 'Vida']);
    // Toda intenção aponta para uma área que existe.
    for (const x of MAPA_DE_INTENCOES) expect(AREAS.some(a => a.id === x.lugar.area), x.id).toBe(true);
  });
});

const idadeDe = (v: Vida) => idade(v);

/* =============================================================== FASE B — a agenda e a progressão na tela */

import { DesenvolvimentoReal, Progressao } from '../jogo/Progresso';
import { evolucaoDaFrente } from '../../motor/sistemas/progressao';
import { MATERIAS } from '../../motor/dados/frentes';

describe('PROG-01 · a tela mostra o número do motor e a causa que ele registrou', () => {
  it('Caminhos · Desenvolvimento: a nota e as matérias, antes → agora, com as causas do ano', () => {
    const v = vidaAos(13);
    render(<main><DesenvolvimentoReal vida={v} /></main>);
    const nota = document.querySelector('[data-nota="escola"]')!;
    expect(Number(nota.getAttribute('data-agora'))).toBe(v.educacao.basica!.desempenho);
    for (const d of MATERIAS) {
      const linha = document.querySelector(`[data-frente="${d}"]`);
      const e = evolucaoDaFrente(v, d)!;
      expect(Number(linha!.querySelector('[data-agora]')!.getAttribute('data-agora'))).toBe(e.agora);
      for (const [fonte] of e.causas) expect(linha!.querySelector(`[data-fonte="${fonte}"]`)).toBeTruthy();
    }
    expect(document.querySelector('[data-fonte="escola"]')).toBeTruthy();
  });

  it('Você: uma atividade da semana aparece com a causa "a atividade" (o nome dela), não um número solto', () => {
    let v = vidaAos(11);
    v = executar(v, { tipo: 'rotina', id: 'xadrez', ativa: true, nivel: 2 }).vida;
    v = avancarAno(v).vida; v.momento = null; v.caminhos.pendente = undefined;
    v = avancarAno(v).vida; v.momento = null;
    render(<main><Progressao vida={v} dominios={['xadrez']} titulo="Teste" /></main>);
    const linha = document.querySelector('[data-frente="xadrez"]')!;
    expect(linha.querySelector('[data-fonte="rotina:xadrez"]')?.textContent).toMatch(/xadrez/i);
  });
});
