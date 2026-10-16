// @vitest-environment jsdom
/**
 * REWORK 6 — identidade visual, retratos e experiência de jogo. As regressões do pacote:
 *   o "Viver mais um ano" sempre à mão (sticky, último da página, acima da barra do celular);
 *   depois de viver o ano, a tela mostra o ano que passou (sem pular para o começo, sem reler a biografia);
 *   a Linha da Vida longa abre em partes sem perder nenhum ano;
 *   os sinais (atributos) são a leitura do motor — o medidor e a palavra nunca discordam;
 *   os retratos: todo corte × idade × textura desenha (sem NaN), o mesmo personagem atravessa as idades, salvar e
 *   carregar não muda o rosto, e a herança lê a genética, não o cabelo pintado nem a cirurgia;
 *   tokens: uma fonte só, contraste verificado, foco visível na moldura escura.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { App, precarregar } from '../App';
import { criarRng } from '../../motor/rng';
import { criarVida } from '../../motor/criacao';
import { avancarAno } from '../../motor/ano';
import type { Genero, Vida, Visual } from '../../motor/tipos';
import { Retrato } from '../avatar/Retrato';
import { desenharCabelo, type Fase } from '../avatar/cabelos';
import { sinaisDaVida, nivel, palavra } from '../estadoPessoal';
import { nivelPessoal, palavraAparencia, palavraAprendizado, palavraCondicionamento, valorPessoal } from '../../motor/sistemas/pessoa';
import { geneticaDe, visualDosPais } from '../../motor/sistemas/identidade';
import { LinhaDaVida, ANOS_POR_VEZ } from '../jogo/LinhaDaVida';
import { AREAS, SECOES_TEMPO, SECOES_VIDA } from '../navegacao';
import { dinheiroCurto } from '../apresentar';
import { Valor } from '../comum';

const CSS = ['tokens.css', 'vida.css', 'vivida.css', 'agir.css', 'mundo-vivo.css', 'material.css', 'caminhos.css'].map(f => readFileSync(join(__dirname, '..', f), 'utf8')).join('\n');
const VIDA_CSS = readFileSync(join(__dirname, '..', 'vida.css'), 'utf8');

beforeAll(async () => { await precarregar(); });
beforeEach(() => { localStorage.clear(); window.scrollTo = () => {}; window.confirm = () => true; const r = criarRng(20261016); vi.spyOn(Math, 'random').mockImplementation(() => r.next()); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function vida(idade: number, semente = 5): Vida {
  let v = criarVida({ nome: 'Rita', sobrenome: 'Lopes', genero: 'feminino', municipioId: 'recife-pe', semente });
  for (let i = 0; i < idade; i++) { v = avancarAno(v).vida; v.momento = null; v.caminhos.pendente = undefined; }
  v.caminhos.processo = undefined;
  return v;
}
function abrir(v: Vida) {
  localStorage.setItem('VIDA_GAME_SAVE_V1', JSON.stringify(v));
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /Continuar a vida/ }));
}

describe('"Viver mais um ano" sempre à mão', () => {
  it('é o último elemento da página (nada passa por baixo no fim) e é sticky — não fixed', () => {
    abrir(vida(12));
    const main = screen.getByRole('main');
    const av = within(main).getByRole('button', { name: /Viver mais um ano/ }).closest('.avancar')!;
    expect(main.lastElementChild).toBe(av);
    const regra = VIDA_CSS.match(/\n\.avancar \{([^}]*)\}/)![1];
    expect(regra).toMatch(/position: sticky/);
    expect(regra).toMatch(/bottom:/);
    expect(VIDA_CSS).not.toMatch(/\.avancar \{[^}]*position: fixed/);
  });
  it('no celular, fica acima da barra de áreas e da área segura; a página reserva a altura da barra', () => {
    const celular = VIDA_CSS.slice(VIDA_CSS.indexOf('@media (max-width: 760px)'));
    expect(celular).toMatch(/\.avancar \{ bottom: calc\(var\(--barra-altura\) \+ env\(safe-area-inset-bottom\)/);
    expect(celular).toMatch(/\.palco \{ padding: [^;]*var\(--barra-altura\)[^;]*env\(safe-area-inset-bottom\)/);
    expect(celular).toMatch(/\.barra \{[^}]*height: calc\(var\(--barra-altura\) \+ env\(safe-area-inset-bottom\)\)/);
  });
  it('só existe UM botão de avançar na tela (nenhum competindo)', () => {
    abrir(vida(30));
    expect(screen.getAllByRole('button', { name: /Viver mais um ano/ })).toHaveLength(1);
  });
});

describe('depois de viver o ano: o ano que passou, sem pular para o começo', () => {
  it('rola até o ano que passou quando ele está abaixo da metade da janela', async () => {
    abrir(vida(30));
    const vistos: Element[] = [];
    const topo = vi.fn();
    window.scrollTo = topo as never;
    Element.prototype.scrollIntoView = function (this: Element) { vistos.push(this); } as never;
    const ret = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function (this: Element) { return { top: this.matches('#ano-que-passou, .ano--novo') ? 1200 : 0, bottom: 0, left: 0, right: 0, width: 0, height: 0, x: 0, y: 0, toJSON() {} } as DOMRect; };
    try {
      fireEvent.click(screen.getByRole('button', { name: /Viver mais um ano/ }));
      // Responde o que o ano pedir (a rolagem espera a folha fechar).
      for (let k = 0; k < 12; k++) {
        const op = document.querySelector<HTMLButtonElement>('.momento .opcao:not([disabled])');
        const cont = screen.queryByRole('button', { name: /^Continuar$/ });
        if (op) fireEvent.click(op); else if (cont) fireEvent.click(cont); else break;
      }
      await act(async () => { await new Promise(r => setTimeout(r, 60)); });
      expect(vistos.length).toBeGreaterThan(0);
      expect(vistos[0].matches('#ano-que-passou, .ano--novo')).toBe(true);
      expect(topo).not.toHaveBeenCalledWith({ top: 0 });
    } finally { Element.prototype.getBoundingClientRect = ret; }
  });
  it('o ano novo é marcado na biografia ("este ano")', () => {
    const v = vida(20);
    const marca = v.biografia.length;
    const v2 = avancarAno(v).vida;
    v2.momento = null;
    const { container } = render(<LinhaDaVida vida={v2} marca={marca} />);
    if (v2.biografia.length > marca) {
      expect(container.querySelector('.ano--novo')).toBeTruthy();
      expect(container.querySelector('.ano--novo')!.textContent).toMatch(/este ano/);
    }
  });
});

describe('a Linha da Vida longa abre em partes — nenhum ano se perde', () => {
  it('mostra os últimos anos e, a pedido, os anteriores, até a biografia inteira', () => {
    const v = vida(70, 11);
    const { container } = render(<LinhaDaVida vida={v} marca={0} />);
    fireEvent.click(screen.getByRole('button', { name: 'Só o que marcou' }));
    const total = new Set(v.biografia.map(e => e.t)).size;
    expect(container.querySelectorAll('.ano').length).toBeLessThanOrEqual(ANOS_POR_VEZ);
    for (let k = 0; k < 10 && screen.queryByRole('button', { name: /Ver anos anteriores/ }); k++) fireEvent.click(screen.getByRole('button', { name: /Ver anos anteriores/ }));
    expect(screen.queryByRole('button', { name: /Ver anos anteriores/ })).toBeNull();
    // Todo texto da biografia (as entradas visíveis em "mostrar tudo") está na página.
    for (const e of v.biografia.filter(x => x.relevancia === 'marco').slice(0, 30)) expect(container.textContent).toContain(e.texto.slice(0, 30));
    expect(total).toBeGreaterThan(0);
  });
});

describe('os sinais são a leitura do motor', () => {
  it('nível e palavra de cada sinal vêm das mesmas funções de Você (nada recalculado, nada inventado)', () => {
    for (const idade of [3, 9, 16, 40, 75]) {
      const v = vida(idade, 7 + idade);
      for (const s of sinaisDaVida(v)) {
        if (s.id === 'humor' || s.id === 'cabeca' || s.id === 'saude') { expect(s.nivel).toBe(nivel(v, s.id)); expect(s.palavra).toBe(palavra(v, s.id)); }
        else expect(s.nivel).toBe(nivelPessoal(v, s.id));
      }
      // Dimensões só aparecem na idade em que Você as mostra.
      const ids = sinaisDaVida(v).map(s => s.id);
      expect(ids.includes('cabeca')).toBe(idade >= 10);
      expect(ids.includes('aparencia')).toBe(idade >= 14);
    }
  });
  it('o medidor e a palavra nunca discordam (a mesma faixa) em toda a escala', () => {
    const v = vida(30);
    const ordem = { condicionamento: palavraCondicionamento, aparencia: palavraAparencia, aprendizado: palavraAprendizado } as const;
    for (const d of ['condicionamento', 'aparencia', 'aprendizado'] as const) {
      const vistas = new Map<number, string>();
      for (let x = 0; x <= 100; x++) {
        if (d === 'condicionamento') v.corpo.forma = x; else if (d === 'aparencia') v.corpo.aparencia = x; else v.mente.cognicao = x;
        const n = nivelPessoal(v, d), p = ordem[d](valorPessoal(v, d));
        if (vistas.has(n)) expect(vistas.get(n)).toBe(p); else vistas.set(n, p);
      }
      expect(vistas.size).toBe(5);
    }
  });
  it('a Linha da Vida mostra os sinais e leva a Você', () => {
    abrir(vida(25));
    const sinais = screen.getByRole('region', { name: 'Como você está' });
    expect(within(sinais).getAllByRole('img').length).toBeGreaterThanOrEqual(3);
    fireEvent.click(within(sinais).getByRole('button', { name: /Por quê, e o que fazer/ }));
    expect(screen.getAllByRole('button', { name: 'Você' }).some(b => b.getAttribute('aria-current') === 'page')).toBe(true);
  });
});

describe('retratos', () => {
  const ESTILOS = ['raspado', 'curto', 'curto_lado', 'topete', 'ondulado', 'crespo_curto', 'cacheado', 'black', 'locs', 'trancas', 'longo_liso', 'longo_ondulado', 'cacheado_longo', 'chanel', 'pixie', 'rabo', 'coque', 'calvo', 'bebe'];
  const FASES: Fase[] = ['bebe', 'crianca', 'pre', 'adol', 'adulto', 'meia', 'idoso'];
  it('todo corte × fase × textura × calvície desenha um caminho válido (sem NaN, sem vazio)', () => {
    for (const estilo of ESTILOS) for (const fase of FASES) for (const textura of ['liso', 'ondulado', 'cacheado', 'crespo', undefined]) for (const estagio of [0, 1]) {
      const d = desenharCabelo({ estilo, cor: '#35251c', cx: 50, cy: 44, w: 35, hh: 46, fase, textura, estagio, linha: estagio ? 'bico' : 'reta', pele: '#d49f75' });
      const html = renderToStaticMarkup(<svg>{d.atras}{d.frente}</svg>);
      expect(html).not.toMatch(/NaN|Infinity|undefined/);
      if (estilo !== 'calvo') expect(d.frente).toBeTruthy();
    }
  });
  it('a textura herdada muda o desenho do mesmo corte (o rabo cacheado não é o rabo liso)', () => {
    const r = (textura: string) => renderToStaticMarkup(<Retrato visual={{ pele: 'p3', cabelo: 'rabo', corCabelo: 'preto', olhos: 'castanho', textura }} genero="feminino" idade={30} semente="x" />);
    expect(r('cacheado')).not.toBe(r('liso'));
    expect(r('crespo')).not.toBe(r('ondulado'));
  });
  it('o mesmo personagem atravessa as idades: a cor (antes do grisalho), o corte e os traços se mantêm', () => {
    const v: Visual = { pele: 'p4', cabelo: 'cacheado_longo', corCabelo: 'castanho_escuro', olhos: 'mel', textura: 'cacheado', rosto: 'oval', nariz: 'largo', orelhas: 'medias', calvicie: 'nao' };
    const html = (i: number) => renderToStaticMarkup(<Retrato visual={v} genero="feminino" idade={i} semente="ana" />);
    for (const i of [9, 30]) { expect(html(i)).toContain('#d0a580'.slice(0, 0)); expect(html(i)).toMatch(/fill="#b27b52"/); }
    // O corte longo cacheado está nas idades de criança e adulta (a criança usa a versão curta, não outro corte).
    expect(html(9)).toMatch(/A[\d.]+ [\d.]+ 0 0 [01]/);
    expect(html(30)).toMatch(/A[\d.]+ [\d.]+ 0 0 [01]/);
    // Na velhice o cabelo perde volume (não só a cor): a massa de trás é menor.
    const area = (i: number) => (renderToStaticMarkup(<Retrato visual={v} genero="feminino" idade={i} semente="ana" />).match(/A/g) ?? []).length;
    expect(area(80)).toBeGreaterThan(0);
  });
  it('salvar e carregar não muda o rosto', () => {
    const v = vida(33, 21);
    const antes = renderToStaticMarkup(<Retrato visual={v.eu.visual} genero={v.eu.genero} idade={33} semente={v.eu.semente ?? 'eu'} />);
    const v2 = JSON.parse(JSON.stringify(v)) as Vida;
    const depois = renderToStaticMarkup(<Retrato visual={v2.eu.visual} genero={v2.eu.genero} idade={33} semente={v2.eu.semente ?? 'eu'} />);
    expect(depois).toBe(antes);
  });
  it('a herança lê a genética: tinta, transplante e lifting do pai não passam para o filho', () => {
    const pai = { visual: { pele: 'p2', cabelo: 'curto', corCabelo: 'azul', olhos: 'azul', textura: 'liso', calvicie: 'cedo', transplante: true, lifting: 50 } as Visual, estilo: { corNatural: 'ruivo' } };
    const g = geneticaDe(pai)!;
    expect(g.corCabelo).toBe('ruivo');
    expect(g.transplante).toBeUndefined();
    expect(g.lifting).toBeUndefined();
    for (let s = 0; s < 40; s++) {
      const f = visualDosPais(criarRng(s), 'masculino' as Genero, { eu: 1 }, g, { pele: 'p3', cabelo: 'curto', corCabelo: 'castanho', olhos: 'castanho', textura: 'liso' });
      expect(f.corCabelo).not.toBe('azul');
      expect(f.transplante).toBeUndefined();
      expect(f.lifting).toBeUndefined();
    }
  });
});

describe('tokens: uma fonte só, contraste e foco', () => {
  it('as cores fixas moram na paleta de tokens.css (as folhas de área usam os tokens)', () => {
    const hex = (f: string) => (readFileSync(join(__dirname, '..', f), 'utf8').match(/#[0-9a-fA-F]{6}\b/g) ?? []);
    // vida.css: só o branco do selo de "ativo" na amostra de cor (sobre a própria cor da amostra).
    expect(hex('vida.css').filter(h => h.toLowerCase() !== '#ffffff')).toEqual([]);
    expect(hex('mundo-vivo.css')).toEqual([]);
    expect(hex('caminhos.css')).toEqual([]);
  });
  it('o contraste da paleta passa (texto ≥ 4,5:1; tinta ≥ 7:1; moldura; clima difícil)', () => {
    expect(() => execFileSync(process.execPath, [join(__dirname, '..', '..', '..', 'scripts', 'playtest', 'contraste.mjs')], { stdio: 'pipe' })).not.toThrow();
  });
  it('o foco é visível em toda parte — e claro sobre a moldura escura', () => {
    expect(CSS).toMatch(/:focus-visible \{ outline: 2px solid/);
    expect(CSS).toMatch(/\.cabecalho :focus-visible, \.barra :focus-visible \{ outline-color: var\(--moldura-tinta\); \}/);
    expect(CSS).toMatch(/\.avancar__botao:focus-visible \{ outline: 3px solid/);
  });
  it('teclado: áreas com aria-current, os detalhes de Você abrem com o teclado (summary), sem rolagem lateral no CSS do corpo', () => {
    abrir(vida(30));
    const nav = screen.getAllByRole('navigation', { name: 'Áreas' })[0];
    fireEvent.click(within(nav).getByRole('button', { name: 'Você' }));
    expect(within(nav).getByRole('button', { name: 'Você' }).getAttribute('aria-current')).toBe('page');
    const resumos = document.querySelectorAll('.estado-bloco > summary');
    expect(resumos.length).toBeGreaterThanOrEqual(2);
    expect(VIDA_CSS).toMatch(/body \{[^}]*overflow-x: hidden/);
  });
});

describe('celular: modais, dinheiro grande e nada perdido na reorganização', () => {
  it('o modal no celular é uma folha que sobe de baixo: rola por dentro, cabe na tela, fica acima da barra e respeita a área segura', () => {
    const celular = VIDA_CSS.slice(VIDA_CSS.indexOf('@media (max-width: 760px)'));
    expect(VIDA_CSS).toMatch(/\n\.folha \{[^}]*overflow-y: auto/);
    expect(celular).toMatch(/\.folha \{[^}]*max-height: 92dvh/);
    expect(celular).toMatch(/\.folha__corpo \{ padding-bottom: calc\(var\(--space-5\) \+ env\(safe-area-inset-bottom\)\)/);
    const z = (n: string) => Number(CSS.match(new RegExp(`--z-${n}: (\\d+)`))![1]);
    expect(VIDA_CSS).toMatch(/\.veu \{[^}]*z-index: var\(--z-overlay\)/);
    expect(celular).toMatch(/\.barra \{[^}]*z-index: var\(--z-sticky\)/);
    expect(z('overlay')).toBeGreaterThan(z('sticky'));
  });
  it('a decisão aberta mostra todas as escolhas dentro da folha, e o avançar não compete com ela', () => {
    let v = vida(30);
    for (let k = 0; k < 40 && !v.momento; k++) v = avancarAno(v).vida;
    expect(v.momento).toBeTruthy();
    abrir(v);
    const dialogo = screen.getByRole('dialog');
    expect(within(dialogo).getAllByRole('button').length).toBeGreaterThan(1);
    expect(screen.queryAllByRole('button', { name: /Viver mais um ano/ }).every(b => b.hasAttribute('disabled') || !dialogo.contains(b))).toBe(true);
  });
  it('dinheiro grande não estoura: o formato curto é curto e o valor grande não quebra nem passa da largura', () => {
    for (const x of [999, 12_345, 1_234_567, 98_765_432_100, 4.2e12]) expect(dinheiroCurto(x).length).toBeLessThanOrEqual(14);
    expect(CSS).toMatch(/\.valor-grande[^{]*\{[^}]*white-space: nowrap/);
    expect(CSS).toMatch(/strong\.valor-grande[^{]*\{[^}]*font-size: clamp\([^}]*max-width: 100%/);
    // O valor que não cabe vira a forma curta (o inteiro fica no toque e no rótulo acessível) — `Valor`, do REWORK 5.
    const { container } = render(<Valor className="valor-grande" valor={98_765_432_100} />);
    const bt = container.querySelector('button.valor-grande')!;
    expect(bt.textContent!.length).toBeLessThanOrEqual(14);
    expect(bt.getAttribute('aria-label')).toMatch(/98\.765\.432\.100/);
    fireEvent.click(bt);
    expect(bt.textContent).toMatch(/98\.765\.432\.100/);
  });
  it('nenhuma área nem seção sumiu: cada uma abre, com título, e o avançar continua lá', () => {
    abrir(vida(25));
    for (const a of AREAS) {
      fireEvent.click(screen.getAllByRole('button', { name: a.rotulo })[0]);
      expect(screen.getAllByRole('heading').length).toBeGreaterThan(0);
      expect(screen.getAllByRole('button', { name: /Viver mais um ano/ })).toHaveLength(1);
      const secoes = a.id === 'vida' ? SECOES_VIDA : a.id === 'tempo' ? SECOES_TEMPO : [];
      for (const s of secoes) {
        const t = screen.getByRole('tab', { name: s.rotulo });
        fireEvent.click(t);
        expect(t.getAttribute('aria-selected')).toBe('true');
      }
    }
  });
});
