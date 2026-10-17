// @vitest-environment jsdom
/**
 * REWORK 6.5 — sistema visual global, temas e consistência de interface.
 *
 *   1–3. Claro · Escuro · Automático: a troca, a persistência (fechar e reabrir), o Automático seguindo o sistema, a
 *        cor da barra do navegador; o script de index.html aplica o tema antes da primeira pintura, sem rede.
 *   4.   Um sistema só: o tema escuro redefine apenas a paleta (`--p-*`), com todas as cores do claro; nenhum
 *        componente pergunta qual é o tema; contraste nos dois temas (scripts/playtest/contraste.mjs).
 *   5.   Linha da Vida sem sobreposição: a margem em rem, o nascimento como "0 · ao nascer", o tipo do acontecimento
 *        numa linha própria, o tema que não repete a margem. (A geometria real — retângulos de texto que se cruzam,
 *        nos dois temas e em 1440/820/390/360 px e numa janela baixa — é medida no navegador por
 *        scripts/playtest/rework65.mjs; ver o relatório.)
 *   6.   Componentes: sinais sem casa vazia, seção recolhida compacta, uma ação principal por ficha, escolhas em chips.
 *   7.   Saves: a aparência não entra no save (v20 intacto); salvar e reabrir mantém a vida e o tema.
 *   8.   Acessibilidade: o seletor é um grupo de rádio com setas, foco visível, movimento reduzido respeitado.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { useState, type ReactNode } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { App, precarregar } from '../App';
import { criarRng } from '../../motor/rng';
import { criarVida } from '../../motor/criacao';
import { avancarAno } from '../../motor/ano';
import { executar, type Acao } from '../../motor/acoes';
import { contratar } from '../../motor/sistemas/trabalho';
import { ocupacao } from '../../motor/dados/ocupacoes';
import { criarPessoa, vincular } from '../../motor/pessoas';
import { VERSAO_SAVE } from '../../motor/save';
import type { Entrada, Vida } from '../../motor/tipos';
import { LinhaDaVida, temaDoMarco } from '../jogo/LinhaDaVida';
import { Pessoas } from '../jogo/Pessoas';
import { Secao } from '../comum';
import { SeletorTema } from '../SeletorTema';
import { aplicarTema, CHAVE_APARENCIA, COR_DA_MOLDURA, escolherAparencia, iniciarTema, lerAparencia, resolverTema } from '../tema';

const UI = join(__dirname, '..');
const ler = (f: string) => readFileSync(join(UI, f), 'utf8');
const TOKENS = ler('tokens.css');
const VIDA_CSS = ler('vida.css');
const SISTEMA = ler('sistema.css');
const INDEX = readFileSync(join(UI, '..', '..', 'index.html'), 'utf8');

/** O sistema (prefers-color-scheme) de mentira, com quem escuta a mudança. */
function sistema(escuro: boolean) {
  const ouvintes = new Set<(e: { matches: boolean }) => void>();
  const mq = { get matches() { return escuro; }, addEventListener: (_: string, f: (e: { matches: boolean }) => void) => ouvintes.add(f), removeEventListener: (_: string, f: (e: { matches: boolean }) => void) => ouvintes.delete(f) };
  window.matchMedia = ((q: string) => (q.includes('dark') ? mq : { matches: false, addEventListener() {}, removeEventListener() {} })) as never;
  return { mudar(e: boolean) { escuro = e; for (const f of ouvintes) f({ matches: e }); } };
}

beforeAll(async () => { await precarregar(); });
beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-tema');
  document.documentElement.removeAttribute('data-aparencia');
  document.head.querySelectorAll('meta[name="theme-color"]').forEach(m => m.remove());
  sistema(false);
  window.scrollTo = () => {}; window.confirm = () => true;
  const r = criarRng(20261016); vi.spyOn(Math, 'random').mockImplementation(() => r.next());
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function vida(idade: number, ajuste: (v: Vida) => void = () => {}, semente = 5): Vida {
  let v = criarVida({ nome: 'Rita', sobrenome: 'Lopes', genero: 'feminino', municipioId: 'recife-pe', semente });
  for (let i = 0; i < idade; i++) { v = avancarAno(v).vida; v.momento = null; v.caminhos.pendente = undefined; }
  v.caminhos.processo = undefined;
  ajuste(v);
  return v;
}
const tema = () => document.documentElement.dataset.tema;

describe('aparência: Claro, Escuro e Automático', () => {
  it('sem escolha, é Automático — e o Automático segue o sistema', () => {
    expect(lerAparencia()).toBe('auto');
    expect(resolverTema('auto', true)).toBe('escuro');
    expect(resolverTema('auto', false)).toBe('claro');
    expect(resolverTema('claro', true)).toBe('claro');
    expect(resolverTema('escuro', false)).toBe('escuro');
  });

  it('escolher troca o tema na hora, guarda a preferência e pinta a barra do navegador com a moldura do tema', () => {
    escolherAparencia('escuro');
    expect(tema()).toBe('escuro');
    expect(document.documentElement.dataset.aparencia).toBe('escuro');
    expect(localStorage.getItem(CHAVE_APARENCIA)).toBe('escuro');
    expect(document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')!.content).toBe(COR_DA_MOLDURA.escuro);
    escolherAparencia('claro');
    expect(tema()).toBe('claro');
    expect(document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')!.content).toBe(COR_DA_MOLDURA.claro);
  });

  it('a cor da barra é a mesma moldura da paleta de tokens.css, nos dois temas', () => {
    const claro = TOKENS.slice(0, TOKENS.indexOf(":root[data-tema='escuro']"));
    const escuro = TOKENS.slice(TOKENS.indexOf(":root[data-tema='escuro']"));
    expect(claro).toContain(`--p-moldura: ${COR_DA_MOLDURA.claro};`);
    expect(escuro).toContain(`--p-moldura: ${COR_DA_MOLDURA.escuro};`);
  });

  it('no Automático, o jogo aberto acompanha o sistema ao vivo; numa escolha fixa, não', () => {
    const s = sistema(false);
    const desligar = iniciarTema();
    expect(tema()).toBe('claro');
    s.mudar(true);
    expect(tema()).toBe('escuro');
    escolherAparencia('claro');
    s.mudar(true);
    expect(tema()).toBe('claro');
    desligar();
  });

  it('um valor estranho guardado vira Automático; sem localStorage, o jogo abre no tema do sistema', () => {
    localStorage.setItem(CHAVE_APARENCIA, 'roxo');
    expect(lerAparencia()).toBe('auto');
    expect(lerAparencia({ getItem() { throw new Error('bloqueado'); } })).toBe('auto');
    expect(lerAparencia(null)).toBe('auto');
  });

  it('persiste entre sessões: escolher no Menu, fechar o jogo e reabrir — o tema e a marca no seletor continuam', () => {
    localStorage.setItem('VIDA_GAME_SAVE_V1', JSON.stringify(vida(20)));
    const { unmount } = render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Continuar a vida/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    const menu = screen.getByRole('dialog', { name: 'Menu' });
    const grupo = within(menu).getByRole('radiogroup', { name: 'Aparência' });
    fireEvent.click(within(grupo).getByRole('radio', { name: /Escuro/ }));
    expect(tema()).toBe('escuro');
    unmount();
    // "Reabrir": a página nova começa sem atributo; o script de index.html (aqui, iniciarTema) o devolve.
    document.documentElement.removeAttribute('data-tema');
    iniciarTema();
    expect(tema()).toBe('escuro');
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Continuar a vida/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    expect(within(screen.getByRole('dialog', { name: 'Menu' })).getByRole('radio', { name: /Escuro/ }).getAttribute('aria-checked')).toBe('true');
  });

  it('a tela inicial também tem o seletor (antes de nascer já dá para escolher)', () => {
    render(<App />);
    expect(screen.getByRole('radiogroup', { name: 'Aparência' })).toBeTruthy();
  });
});

describe('sem flash e offline: o script de index.html', () => {
  const script = INDEX.match(/<script>([\s\S]*?)<\/script>/)![1];
  const rodar = (guardado: string | null, escuroNoSistema: boolean) => {
    document.documentElement.removeAttribute('data-tema');
    localStorage.clear();
    if (guardado) localStorage.setItem(CHAVE_APARENCIA, guardado);
    sistema(escuroNoSistema);
    new Function(script)();
    return tema();
  };

  it('vem antes de qualquer folha de estilo e de qualquer script do jogo', () => {
    const i = INDEX.indexOf('<script>');
    expect(i).toBeGreaterThan(0);
    expect(i).toBeLessThan(INDEX.indexOf('<script type="module"'));
    expect(INDEX.slice(0, i)).not.toMatch(/<link[^>]+stylesheet/);
  });
  it('não depende de rede (só lê o localStorage e o sistema)', () => {
    expect(script).not.toMatch(/fetch|XMLHttpRequest|import\(|https?:/);
  });
  it('dá o mesmo resultado que ui/tema.ts em todas as combinações', () => {
    for (const g of [null, 'claro', 'escuro', 'auto', 'xyz']) for (const s of [false, true]) {
      const esperado = resolverTema(g === 'claro' || g === 'escuro' ? g : 'auto', s);
      expect(rodar(g, s), `${g} / sistema ${s ? 'escuro' : 'claro'}`).toBe(esperado);
    }
  });
  it('sobrevive a um localStorage bloqueado (modo privado)', () => {
    const orig = Object.getOwnPropertyDescriptor(window, 'localStorage')!;
    Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new Error('bloqueado'); } });
    try {
      sistema(true);
      document.documentElement.removeAttribute('data-tema');
      expect(() => new Function(script)()).not.toThrow();
      expect(tema()).toBe('escuro');
    } finally { Object.defineProperty(window, 'localStorage', orig); }
  });
});

describe('um sistema de cor só, nos dois temas', () => {
  const escuro = TOKENS.slice(TOKENS.indexOf(":root[data-tema='escuro']"), TOKENS.indexOf('}', TOKENS.indexOf(":root[data-tema='escuro']")));
  const claro = TOKENS.slice(0, TOKENS.indexOf(":root[data-tema='escuro']"));
  const nomes = (css: string) => [...css.matchAll(/(--[\w-]+):/g)].map(m => m[1]);

  it('o tema escuro redefine SÓ a paleta (--p-*) — a semântica e os nomes antigos seguem sozinhos', () => {
    expect(nomes(escuro).length).toBeGreaterThan(20);
    expect(nomes(escuro).filter(n => !n.startsWith('--p-'))).toEqual([]);
  });
  it('… e redefine TODA a paleta de cor do claro (nada fica com a cor do papel no escuro)', () => {
    const doClaro = new Set(nomes(claro).filter(n => n.startsWith('--p-')));
    const doEscuro = new Set(nomes(escuro));
    expect([...doClaro].filter(n => !doEscuro.has(n))).toEqual([]);
  });
  it('nenhum componente pergunta qual é o tema (sem verificações espalhadas)', () => {
    const fontes = ['vida.css', 'vivida.css', 'agir.css', 'mundo-vivo.css', 'material.css', 'caminhos.css', 'sistema.css', 'experiencia.css'].map(ler).join('\n');
    expect(fontes).not.toMatch(/data-tema|prefers-color-scheme/);
    const tsx = ['telas/Jogo.tsx', 'jogo/LinhaDaVida.tsx', 'jogo/Pessoas.tsx', 'jogo/Voce.tsx', 'jogo/Trabalho.tsx', 'jogo/Tempo.tsx', 'jogo/VidaConcreta.tsx', 'jogo/Estudos.tsx', 'jogo/Pratica.tsx', 'jogo/Compras.tsx', 'jogo/Emblemas.tsx'].map(ler).join('\n');
    expect(tsx).not.toMatch(/dataset\.tema|data-tema|prefers-color-scheme/);
  });
  it('nenhuma cor "contra o tema" nas folhas: nada de branco/preto fixo como fundo de texto', () => {
    // Era o caso do rótulo da semana: fundo branco fixo com a tinta da paleta — no escuro, tinta clara em fundo branco.
    expect(VIDA_CSS).not.toMatch(/rgba\(255, 255, 255/);
    expect(VIDA_CSS).not.toMatch(/var\(--p-/);
  });
  it('as sombras não acendem no escuro (têm cor própria, não a da tinta)', () => {
    expect(TOKENS).toMatch(/--sombra-cor: color-mix\(in oklab, var\(--p-sombra\)/);
    expect(escuro).toMatch(/--p-sombra: #000000/);
  });
});

describe('Linha da Vida: nada se sobrepõe', () => {
  it('o nascimento é "0 · ao nascer" na margem — a palavra larga não mora mais na margem estreita', () => {
    const v = vida(0);
    const { container } = render(<LinhaDaVida vida={v} marca={0} />);
    const idade0 = [...container.querySelectorAll('.ano__idade')].map(x => x.textContent);
    expect(idade0).toContain('0 ao nascer');
    expect(container.querySelector('.ano__idade')!.textContent).not.toMatch(/Nascimento/);
  });
  it('o tema do marco não repete a margem (o nascimento no ano 0), e continua dizendo o tema nos outros anos', () => {
    const e = (tema: Entrada['tema'], relevancia: Entrada['relevancia'] = 'marco') => ({ id: 'x', t: 0, idade: 0, texto: '', tema, relevancia }) as Entrada;
    expect(temaDoMarco(e('nascimento'), 0)).toBeNull();
    expect(temaDoMarco(e('nascimento'), 31)).toBe('Nascimento');
    expect(temaDoMarco(e('amor'), 0)).toBe('Amor');
    expect(temaDoMarco(e('amor', 'biografia'), 20)).toBeNull();
  });
  it('a ordem de leitura: o tipo numa linha própria, ANTES da narrativa — nunca dentro dela', () => {
    const v = vida(40, () => {}, 11);
    const { container } = render(<LinhaDaVida vida={v} marca={0} />);
    const tipos = [...container.querySelectorAll('.entrada__tipo')];
    expect(tipos.length).toBeGreaterThan(0);
    for (const t of tipos) {
      expect(t.nextElementSibling?.classList.contains('entrada__texto')).toBe(true);
      expect(t.textContent!.trim().length).toBeGreaterThan(0);
    }
    for (const p of container.querySelectorAll('.entrada__texto')) expect(p.querySelector('.entrada__tema, .entrada__escolha')).toBeNull();
  });
  it('a margem é medida em rem (cresce com o texto aumentado) e o que mora nela não a atravessa', () => {
    expect(VIDA_CSS).toMatch(/\.ano__corpo \{[^}]*grid-template-columns: 5rem minmax\(0, 1fr\)/);
    expect(VIDA_CSS).toMatch(/\.ano__cabeca \{[^}]*min-width: 0;[^}]*overflow-wrap: anywhere/);
    expect(VIDA_CSS).not.toMatch(/grid-template-columns: 76px/);
  });
});

describe('componentes do sistema', () => {
  it('sinais: cada um é a sua ficha, e a grade só tem as colunas que existem (sem faixa cinza vazia)', () => {
    const regra = VIDA_CSS.match(/\n\.sinais__lista \{([^}]*)\}/)![1];
    expect(regra).toMatch(/auto-fit/);
    expect(regra).not.toMatch(/background/);
  });
  it('fichas de dados: a que sobra ocupa a linha (no celular, sem casa vazia ao lado)', () => {
    expect(VIDA_CSS).toMatch(/\.dados > \.dado:last-child:nth-child\(odd\) \{ grid-column: 1 \/ -1; \}/);
    expect(VIDA_CSS).toMatch(/\.dados \{ display: grid; grid-template-columns: repeat\(auto-fit/);
  });
  it('seção recolhida vira uma linha compacta; aberta, volta a ser capítulo', () => {
    const { container } = render(<Secao titulo="Lojas da cidade" recolhivel aberta={false}><p>dentro</p></Secao>);
    const s = container.querySelector('section')!;
    expect(s.className).toMatch(/secao--fechada/);
    fireEvent.click(screen.getByRole('button', { name: /Lojas da cidade/ }));
    expect(s.className).not.toMatch(/secao--fechada/);
    expect(screen.getByText('dentro')).toBeTruthy();
    expect(SISTEMA).toMatch(/\.secao--fechada \{ padding: var\(--space-2\) 0; \}/);
  });
  it('a ficha de uma pessoa tem UMA ação principal; as outras prioridades são secundárias', () => {
    function Ligado({ v0, tela }: { v0: Vida; tela: (v: Vida, agir: (a: Acao) => boolean) => ReactNode }) {
      const [v, setV] = useState(v0);
      return <main>{tela(v, a => { setV(executar(v, a).vida); return true; })}</main>;
    }
    const v = vida(29, x => {
      x.trabalho.atual = undefined; contratar(x, criarRng(2), ocupacao('assistente_adm')); x.financas.conta = 600000; x.financas.negativado = false;
      const p = criarPessoa(x, criarRng(31), { idade: 29, genero: 'masculino', municipioId: x.moradia.municipioId });
      p.atracao = 'mulheres'; p.parceiroId = undefined;
      vincular(x, p, { origem: 'escola', proximidade: 72, estagio: 'amigo_proximo' }).tInicio = x.t - 150;
    });
    const id = Object.values(v.vinculos).find(x => x.estagio === 'amigo_proximo' && v.pessoas[x.pessoaId].nome)!.pessoaId;
    render(<Ligado v0={v} tela={(vv, agir) => <Pessoas vida={vv} agir={agir} aberta={id} abrir={() => {}} />} />);
    const agora = within(screen.getByRole('dialog')).getByText('O que faz sentido agora').closest('.ficha__agora') as HTMLElement;
    const botoes = within(agora).getAllByRole('button');
    expect(agora.querySelectorAll('.botao--principal').length).toBe(1);
    expect(botoes[0].classList.contains('botao--principal')).toBe(true);
  });
  it('as seções de Vida e Tempo livre no celular: duas linhas de três, não três linhas quebradas', () => {
    const celular = VIDA_CSS.slice(VIDA_CSS.indexOf('No celular, as seções cabem em DUAS linhas'));
    expect(celular).toMatch(/\.subnav__lista \{ display: grid; grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  });
  it('o rodapé da tela inicial está no fluxo (não se deita sobre os botões numa janela baixa)', () => {
    expect(VIDA_CSS).not.toMatch(/\.inicio__rodape \{[^}]*position: absolute/);
  });
});

describe('saves: a aparência é do aparelho, não da vida', () => {
  it('escolher o tema não mexe no save (mesma versão, nenhum campo novo) e reabrir a vida dá a mesma vida', () => {
    const v = vida(25);
    localStorage.setItem('VIDA_GAME_SAVE_V1', JSON.stringify(v));
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Continuar a vida/ }));
    const antes = localStorage.getItem('VIDA_GAME_SAVE_V1')!;
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Menu' })).getByRole('radio', { name: /Escuro/ }));
    const salvo = localStorage.getItem('VIDA_GAME_SAVE_V1')!;
    expect(salvo).toBe(antes);
    expect(JSON.parse(salvo).versao).toBe(VERSAO_SAVE);
    expect(VERSAO_SAVE).toBe(20);
    cleanup();
    render(<App />);
    expect(screen.getByRole('button', { name: /Continuar a vida de Rita, 25 anos/ })).toBeTruthy();
    expect(tema()).toBe('escuro');
  });
});

describe('acessibilidade do seletor e do sistema', () => {
  it('é um grupo de rádio: um só marcado, setas trocam e levam o foco junto', () => {
    render(<SeletorTema />);
    const radios = screen.getAllByRole('radio');
    expect(radios.map(r => r.getAttribute('aria-checked'))).toEqual(['false', 'false', 'true']);
    expect(radios.filter(r => r.tabIndex === 0)).toHaveLength(1);
    radios[2].focus();
    fireEvent.keyDown(radios[2], { key: 'ArrowRight' });
    expect(tema()).toBe('claro');
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: /Claro/ }));
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowLeft' });
    expect(screen.getByRole('radio', { name: /Automático/ }).getAttribute('aria-checked')).toBe('true');
  });
  it('as seções (Vida, Tempo livre) andam pelo teclado: setas, Home e End, com uma só aba na ordem do Tab', () => {
    localStorage.setItem('VIDA_GAME_SAVE_V1', JSON.stringify(vida(30)));
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Continuar a vida/ }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Vida' })[0]);
    const lista = screen.getByRole('tablist');
    const abas = within(lista).getAllByRole('tab');
    expect(abas.filter(a => a.tabIndex === 0)).toHaveLength(1);
    const ativa = abas.find(a => a.getAttribute('aria-selected') === 'true')!;
    ativa.focus();
    fireEvent.keyDown(ativa, { key: 'ArrowRight' });
    const depois = within(screen.getByRole('tablist')).getAllByRole('tab');
    expect(depois[abas.indexOf(ativa) + 1].getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(depois[abas.indexOf(ativa) + 1]);
    fireEvent.keyDown(document.activeElement!, { key: 'End' });
    const fim = within(screen.getByRole('tablist')).getAllByRole('tab');
    expect(fim[fim.length - 1].getAttribute('aria-selected')).toBe('true');
  });
  it('o Menu (onde mora a aparência) é uma folha de verdade: o foco entra nela e Esc fecha', () => {
    localStorage.setItem('VIDA_GAME_SAVE_V1', JSON.stringify(vida(20)));
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Continuar a vida/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    const menu = screen.getByRole('dialog', { name: 'Menu' });
    expect(menu.contains(document.activeElement)).toBe(true);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Menu' })).toBeNull();
  });
  it('a escolha não depende só da cor: a opção marcada leva ✓ e o nome', () => {
    expect(SISTEMA).toMatch(/\.tema-seletor__opcao--ativa \.tema-seletor__nome::after \{ content: ' ✓'/);
  });
  it('a troca suave de tema respeita quem pede menos movimento', () => {
    expect(SISTEMA).toMatch(/@media \(prefers-reduced-motion: no-preference\) \{\s*:root\[data-trocando-tema\]/);
  });
  it('aplicarTema cria a meta theme-color se ela não existir (PWA aberto sem o index.html, como nos testes)', () => {
    aplicarTema('escuro', 'escuro');
    expect(document.head.querySelectorAll('meta[name="theme-color"]')).toHaveLength(1);
  });
});
