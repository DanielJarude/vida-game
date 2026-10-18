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

/* =============================================================== FASE C — as experiências das áreas */

import { Pessoas } from '../jogo/Pessoas';
import { LinhaDaVida } from '../jogo/LinhaDaVida';
import { amostraDaFachada, PORTA_DA_FACHADA, LUGARES_DA_CIDADE } from '../ilustracao/lugares';
import { aviao } from '../ilustracao/aguaEAr';
import { Voce } from '../jogo/Voce';

describe('Fase C · o celular compacto (UX-02)', () => {
  it('dentro do app, quatro telas curtas; os números ficam ao lado; o aviso comum aparece uma vez', () => {
    let v: Vida = adulto(24, { semente: 51 });
    v = transacao(v, x => { x.financas.conta = 1e6; }).vida;
    v = executar(v, rede('criar')).vida;
    for (let k = 0; k < 4; k++) v = executar(v, rede('publicar', { tema: 'cotidiano' })).vida;
    render(<main><RedesSociais vida={v} agir={() => true} /></main>);
    fireEvent.click(screen.getAllByRole('tab', { name: /Instagram/ })[0]);
    for (const t of ['Perfil', 'Publicar', 'Feed', 'Conta']) expect(screen.getByRole('tab', { name: new RegExp(`^${t}`) })).toBeTruthy();
    expect(screen.getByRole('complementary', { name: 'Os números das redes' })).toBeTruthy();
    const publicar = document.querySelector('.app-tela--publicar')!;
    const avisos = [...publicar.querySelectorAll('.acao__aviso')].map(x => x.textContent);
    expect(new Set(avisos).size).toBe(avisos.length);
  });
});

describe('Fase C · Pessoas: o círculo, a vida deles, a nossa história — só o que aconteceu', () => {
  it('A vida deles mostra as trajetórias registradas; Nossa história, as memórias guardadas (e o filtro filtra)', () => {
    const v = vidaAos(30, x => {
      const vin = Object.values(x.vinculos).find(w => w.parentesco === 'mae') ?? Object.values(x.vinculos)[0];
      const p = x.pessoas[vin.pessoaId];
      (p.vida ??= { aptidao: 0, escolaridade: 'medio', experiencia: 0, trajetoria: [] }).trajetoria.push({ t: x.t - 12, texto: 'Arrumou trabalho de novo, como costureira.', tipo: 'trabalho' });
      vin.historia.push({ t: x.t - 24, texto: 'Ficou do seu lado quando a vida pesou.', tipo: 'apoio', peso: 2, de: 'ela' });
    });
    render(<main><Pessoas vida={v} agir={() => true} aberta={null} abrir={() => {}} /></main>);
    fireEvent.click(screen.getByRole('tab', { name: 'A vida deles' }));
    expect(screen.getByRole('region', { name: 'A vida deles' }).textContent).toMatch(/costureira/);
    fireEvent.click(screen.getByRole('tab', { name: 'Nossa história' }));
    const nossa = screen.getByRole('region', { name: 'Nossa história' });
    const total = Object.values(v.vinculos).filter(w => v.pessoas[w.pessoaId] && !v.pessoas[w.pessoaId].especie).reduce((s, w) => s + w.historia.length, 0);
    expect(nossa.querySelectorAll('.nossa-historia__item').length).toBe(Math.min(40, total));
    expect(nossa.textContent).toMatch(/Ficou do seu lado/);
    const apoio = within(nossa).queryByRole('button', { name: 'Apoio' });
    if (apoio) { fireEvent.click(apoio); expect([...nossa.querySelectorAll('.nossa-historia__item')].every(li => /apoio/i.test(li.textContent ?? ''))).toBe(true); }
  });
});

describe('Fase C · História: ver por um fio, e as conquistas', () => {
  it('o fio "Estudos" mostra só o que o motor marcou como estudo; "Conquistas" mostra os marcos registrados', () => {
    const v = vidaAos(19);
    render(<main><LinhaDaVida vida={v} marca={0} /></main>);
    fireEvent.click(screen.getByRole('button', { name: 'Estudos' }));
    const temas = [...document.querySelectorAll('.anos .entrada')].map(li => [...li.classList].find(c => c.startsWith('entrada--tema-'))!.slice(14));
    expect(temas.length).toBeGreaterThan(0);
    for (const t of temas) expect(['escola', 'estudo']).toContain(t);
    fireEvent.click(screen.getByRole('button', { name: 'Conquistas' }));
    expect(document.querySelector('.anos--oculto')).toBeTruthy();
  });
});

describe('Fase C · o polimento das ilustrações (REWORK 8)', () => {
  it('a tabela de portas confere com o desenho de cada loja (a porta está do lado dito)', () => {
    for (const lugar of LUGARES_DA_CIDADE) {
      const lado = PORTA_DA_FACHADA[lugar];
      if (!lado) continue;
      const achar = (ps: unknown[]): { d: string } | undefined => { for (const p of ps as { marca?: string; d?: string; pecas?: unknown[] }[]) { if (p.marca === 'porta' && p.d) return p as { d: string }; const f = p.pecas && achar(p.pecas); if (f) return f; } return undefined; };
      const porta = achar(amostraDaFachada(lugar).pecas);
      expect(porta, lugar).toBeTruthy();
      const x = Number(/M\s*(-?[\d.]+)/.exec(porta!.d)![1]);
      expect(lado === 'esq' ? x < 240 : x > 240, `${lugar}: porta em x=${x}`).toBe(true);
    }
  });

  it('dois aviões do mesmo tipo, dois desenhos (o Excel de asa baixa, o P1 de asa alta; o Phenom e o Citation com janelas diferentes)', () => {
    const asa = (id: string) => JSON.stringify(aviao('ultraleve', '#c33', id).pecas.find(p => (p as { marca?: string }).marca === 'asa'));
    expect(asa('inpaer_excel')).not.toBe(asa('paradise_p1'));
    const janelas = (id: string) => aviao('jato', '#333', id).pecas.filter(p => (p as { marca?: string }).marca === 'janela').length;
    expect(janelas('embraer_phenom100')).not.toBe(janelas('cessna_citation_m2'));
  });
});

describe('Fase C · Você: o retrato em partes', () => {
  it('o índice leva a partes que existem na página', () => {
    const v = vidaAos(25);
    render(<main><Voce vida={v} agir={() => true} irPara={() => {}} abrirPessoa={() => {}} /></main>);
    const indice = screen.getByRole('navigation', { name: 'Partes do retrato' });
    for (const a of indice.querySelectorAll('a')) expect(document.querySelector(a.getAttribute('href')!), a.textContent!).toBeTruthy();
  });
});
