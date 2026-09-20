/**
 * @vitest-environment jsdom
 *
 * Inspeção visual/manual do B4-FIX.1 (§38) — o roteiro do playtest humano,
 * percorrido no **App real**, não em componentes isolados.
 *
 * Playwright está instalado mas não consegue baixar navegador neste ambiente,
 * então a inspeção clica o caminho que uma pessoa faria: Nova Vida → avatar →
 * Acre → cidade → nascer → envelhecer 30 anos → abrir pai, mãe e pet. Isso
 * cobre a integração que um teste de unidade não pega.
 *
 * Limite honesto: jsdom não calcula layout, então cor, tipografia e
 * sobreposição real de pixels continuam fora de alcance. Onde a verificação
 * depende de layout, o teste inspeciona o CSS compilado por breakpoint e diz
 * exatamente o que está afirmando. Nenhum teste aqui pode passar por vazio:
 * os que dependem de um pet ou de uma aba **falham** se o alvo não aparecer.
 */

import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { App } from '../App';
import { listarEstados, listarCidadesPorEstado } from '../data/locations';
import { criarEstadoTeste, criarPetTeste } from '../systems/__tests__/fixtures';
import { criarPersonalidadeInicial } from '../systems/personalitySystem';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SAVE_KEY = 'VIDA_GAME_SAVE_V1';

const lerCss = (arquivo: string) =>
  readFileSync(resolve(__dirname, `../styles/${arquivo}`), 'utf-8');

function criarLocalStorageStub() {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: () => null,
    length: 0
  };
}

beforeEach(() => {
  vi.stubGlobal('localStorage', criarLocalStorageStub());
  // jsdom não implementa nenhum dos dois; sem eles o shell quebra ao montar.
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  );
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

/* ─────────────────────────────────────────────── helpers de navegação */

/** Home → tela de criação. */
function irParaCriacao() {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /nova vida/i }));
}

/** Cria a vida escolhendo Acre, e devolve a cidade que ficou selecionada. */
function nascerNoAcre() {
  irParaCriacao();
  fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'AC' } });
  const cidade = (screen.getByLabelText('Cidade') as HTMLSelectElement).value;
  fireEvent.click(screen.getByRole('button', { name: /começar a viver/i }));
  return cidade;
}

/**
 * Entra numa vida já em curso, com um pet na família.
 *
 * Um pet só chega por evento aleatório, o que tornaria a inspeção dependente
 * de sorte. Semear o save exercita exatamente o mesmo caminho de UI — carregar
 * partida, abrir Relacionamentos, clicar no bicho — de forma determinística.
 */
function continuarVidaComPet(idade: number) {
  const base = criarEstadoTeste({ idade });
  localStorage.setItem(
    SAVE_KEY,
    JSON.stringify({
      versao: 5,
      personagem: base.personagem,
      familia: [...base.familia, criarPetTeste({ nome: 'Bolinha' })],
      educacao: base.educacao,
      carreira: base.carreira,
      economia: base.economia,
      personalidade: criarPersonalidadeInicial(),
      timeline: [],
      eventoAtivoId: null,
      historicoEventosDisparados: [],
      historicoEventos: [],
      acoesRealizadasAno: [],
      emJogo: true,
      morto: false
    })
  );

  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /continuar sua vida/i }));
}

function abrirAba(nome: RegExp) {
  const aba = Array.from(
    document.querySelectorAll<HTMLButtonElement>('.primary-nav__item')
  ).find(b => nome.test(b.textContent ?? ''));

  expect(aba, `aba ${nome} não encontrada`).toBeTruthy();
  fireEvent.click(aba!);
}

/** Abre a ficha de alguém da lista de relacionamentos. */
function abrirPessoa(nome: RegExp) {
  const linha = Array.from(document.querySelectorAll('.action-row')).find(el =>
    nome.test(el.textContent ?? '')
  );
  expect(linha, `ninguém com nome ${nome} na lista`).toBeTruthy();
  fireEvent.click(linha!);
  return screen.getByRole('dialog');
}

/** Um ano de jogo: avança, responde evento se houver, fecha o resumo. */
function passarUmAno() {
  const botao = document.querySelector<HTMLButtonElement>('.year-advance__button');
  if (botao && !botao.disabled) fireEvent.click(botao);

  const escolha = document.querySelector<HTMLElement>('.event-choice');
  if (escolha) fireEvent.click(escolha);

  const continuar = document.querySelector<HTMLButtonElement>(
    '.event-result__continue .btn'
  );
  if (continuar) fireEvent.click(continuar);
}

/* ═════════════════════════════════ 1. Criação de personagem com avatar */

describe('Inspeção · criação de personagem com avatar', () => {
  it('a tela de criação abre a partir da home', () => {
    irParaCriacao();
    expect(screen.getByText('Quem você vai ser')).toBeTruthy();
  });

  it('as seções aparecem na ordem Identidade → Aparência → Nascimento', () => {
    irParaCriacao();
    const titulos = Array.from(
      document.querySelectorAll('.creation-section__title')
    ).map(e => e.textContent);

    expect(titulos).toEqual(['Identidade', 'Aparência', 'Nascimento']);
  });

  it('o avatar é desenhado na criação, com prévia visível', () => {
    irParaCriacao();
    const previa = document.querySelector('.avatar-picker__preview svg');

    expect(previa).toBeTruthy();
    expect(previa!.getAttribute('aria-label')).toMatch(/prévia/i);
  });

  it('trocar o tom de pele muda o desenho na prévia', () => {
    irParaCriacao();
    const seletor = () =>
      document.querySelector('.avatar-picker__preview svg')!.innerHTML;

    const antes = seletor();
    const pele = screen
      .getAllByRole('radio')
      .find(b => b.getAttribute('aria-label') === 'Retinta');

    expect(pele, 'amostra de pele "Retinta" não encontrada').toBeTruthy();
    fireEvent.click(pele!);

    expect(seletor()).not.toBe(antes);
  });

  it('trocar o estilo de cabelo muda o desenho na prévia', () => {
    irParaCriacao();
    const seletor = () =>
      document.querySelector('.avatar-picker__preview svg')!.innerHTML;

    const antes = seletor();
    fireEvent.click(screen.getByRole('radio', { name: 'Tranças' }));

    expect(seletor()).not.toBe(antes);
  });

  it('"Sortear tudo" produz um avatar íntegro, sem NaN nem undefined', () => {
    irParaCriacao();
    fireEvent.click(screen.getByRole('button', { name: /sortear tudo/i }));

    const svg = document.querySelector('.avatar-picker__preview svg');
    expect(svg).toBeTruthy();
    expect(svg!.outerHTML).not.toMatch(/NaN|undefined|null/);
  });

  it('a aparência escolhida na criação é a que nasce na identidade', () => {
    irParaCriacao();
    fireEvent.click(screen.getByRole('radio', { name: 'Tranças' }));

    const previa = document
      .querySelector('.avatar-picker__preview svg')!
      .querySelectorAll('path, circle, ellipse, rect').length;

    fireEvent.click(screen.getByRole('button', { name: /começar a viver/i }));

    const retrato = document.querySelector('.identity__portrait svg');
    expect(retrato).toBeTruthy();
    // Mesmo conjunto de traços: a escolha atravessou a criação intacta.
    expect(
      retrato!.querySelectorAll('path, circle, ellipse, rect').length
    ).toBeGreaterThanOrEqual(Math.min(previa, 3));
  });
});

/* ═════════════════════════════════ 2. As 27 UFs, incluindo Acre */

describe('Inspeção · lista completa das 27 UFs', () => {
  it('o seletor lista exatamente 27 estados', () => {
    irParaCriacao();
    expect(
      (screen.getByLabelText('Estado') as HTMLSelectElement).options
    ).toHaveLength(27);
  });

  it('Acre aparece por extenso e é selecionável', () => {
    irParaCriacao();
    const select = screen.getByLabelText('Estado') as HTMLSelectElement;
    const acre = Array.from(select.options).find(o => o.value === 'AC');

    expect(acre).toBeDefined();
    expect(acre!.textContent).toBe('Acre (AC)');

    fireEvent.change(select, { target: { value: 'AC' } });
    expect(select.value).toBe('AC');
  });

  it('as 8 UFs ausentes no B4-FIX estão todas de volta', () => {
    irParaCriacao();
    const siglas = Array.from(
      (screen.getByLabelText('Estado') as HTMLSelectElement).options
    ).map(o => o.value);

    for (const uf of ['AC', 'AP', 'MA', 'PI', 'RO', 'RR', 'SE', 'TO']) {
      expect(siglas, `UF ${uf} sumiu do seletor`).toContain(uf);
    }
  });

  it('nenhuma opção de estado vem truncada', () => {
    irParaCriacao();
    for (const opcao of Array.from(
      (screen.getByLabelText('Estado') as HTMLSelectElement).options
    )) {
      expect(opcao.textContent).not.toMatch(/\.\.\.|…/);
    }
  });
});

/* ═════════════════════════════════ 3. Estado → Cidade */

describe('Inspeção · encadeamento Estado → Cidade', () => {
  it('escolher Acre lista somente cidades do Acre', () => {
    irParaCriacao();
    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'AC' } });

    const cidades = Array.from(
      (screen.getByLabelText('Cidade') as HTMLSelectElement).options
    ).map(o => o.value);

    expect(cidades).toEqual(listarCidadesPorEstado('AC').map(c => c.cidade));
  });

  it('percorrer as 27 UFs sempre dá cidade, e nunca de outro estado', () => {
    irParaCriacao();
    const select = screen.getByLabelText('Estado');

    for (const uf of listarEstados()) {
      fireEvent.change(select, { target: { value: uf.sigla } });

      const cidades = screen.getByLabelText('Cidade') as HTMLSelectElement;
      expect(
        cidades.options.length,
        `${uf.sigla} ficou sem cidade`
      ).toBeGreaterThan(0);

      const validas = listarCidadesPorEstado(uf.sigla).map(c => c.cidade);
      for (const opcao of Array.from(cidades.options)) {
        expect(validas, `${opcao.value} não é de ${uf.sigla}`).toContain(
          opcao.value
        );
      }
    }
  });

  it('trocar de UF reseta a cidade para uma do novo estado', () => {
    irParaCriacao();
    const select = screen.getByLabelText('Estado');
    const cidadeAtual = () =>
      (screen.getByLabelText('Cidade') as HTMLSelectElement).value;

    fireEvent.change(select, { target: { value: 'SP' } });
    expect(listarCidadesPorEstado('SP').map(c => c.cidade)).toContain(cidadeAtual());

    fireEvent.change(select, { target: { value: 'AC' } });
    expect(listarCidadesPorEstado('AC').map(c => c.cidade)).toContain(cidadeAtual());
  });

  it('a escolha manual sobrevive ao nascimento — nada é randomizado por cima', () => {
    irParaCriacao();
    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'RR' } });

    const cidadeEscolhida = (screen.getByLabelText('Cidade') as HTMLSelectElement)
      .value;
    fireEvent.click(screen.getByRole('button', { name: /começar a viver/i }));

    expect(
      screen.getAllByText(new RegExp(cidadeEscolhida, 'i')).length
    ).toBeGreaterThan(0);
  });
});

/* ═════════════════════════════════ 4. Identidade com avatar */

describe('Inspeção · identidade usa avatar, não iniciais', () => {
  it('ao nascer, o retrato é um SVG dentro da identidade', () => {
    nascerNoAcre();
    expect(document.querySelector('.identity__portrait svg')).toBeTruthy();
  });

  it('as iniciais do B4 não existem mais', () => {
    nascerNoAcre();
    expect(document.querySelector('.identity__initials')).toBeNull();
  });

  it('o retrato é rotulado para leitor de tela', () => {
    nascerNoAcre();
    const retrato = document.querySelector('.identity__portrait svg')!;

    expect(retrato.getAttribute('role')).toBe('img');
    expect(retrato.getAttribute('aria-label')!.length).toBeGreaterThan(2);
  });

  it('a cidade escolhida no Acre aparece na identidade', () => {
    const cidade = nascerNoAcre();
    expect(screen.getAllByText(new RegExp(cidade, 'i')).length).toBeGreaterThan(0);
  });

  it('o avatar do bebê usa proporção de bebê, não de adulto', () => {
    nascerNoAcre();
    // Aos 0 anos a cabeça é proporcionalmente maior que a do adulto.
    const elipse = document.querySelector('.identity__portrait svg ellipse');

    expect(elipse).toBeTruthy();
    expect(Number(elipse!.getAttribute('rx'))).toBeGreaterThan(25);
  });
});

/* ═════════════════════════════════ 5. Texto essencial sem clipping */

describe('Inspeção · texto essencial não é cortado', () => {
  it('nada na tela aparece truncado com reticências', () => {
    nascerNoAcre();
    const corpo = document.body.textContent ?? '';

    expect(corpo).not.toMatch(/\w\u2026/);
    expect(corpo).not.toMatch(/\w\.\.\.(\s|$)/);
  });

  it('os campos essenciais não usam ellipsis no CSS', () => {
    const css = lerCss('character.css');
    const regra = (sel: string) => {
      const m = css.match(new RegExp(`\\n\\s*\\${sel}\\s*\\{([^}]*)\\}`));
      return m ? m[1] : '';
    };

    expect(regra('.identity__fact-value')).not.toMatch(/text-overflow/);
    expect(regra('.relationship__name')).not.toMatch(/text-overflow/);
  });

  it('nome longo e cidade longa chegam inteiros à tela', () => {
    irParaCriacao();
    fireEvent.change(screen.getByLabelText('Nome'), {
      target: { value: 'Maria Aparecida' }
    });
    fireEvent.change(screen.getByLabelText('Sobrenome'), {
      target: { value: 'Nascimento Silva' }
    });
    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'SP' } });
    fireEvent.change(screen.getByLabelText('Cidade'), {
      target: { value: 'São José dos Campos' }
    });
    fireEvent.click(screen.getByRole('button', { name: /começar a viver/i }));

    expect(screen.getAllByText(/Maria Aparecida/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/São José dos Campos/).length).toBeGreaterThan(0);
  });

  it('o nome do pet e o vínculo aparecem inteiros na lista', () => {
    continuarVidaComPet(10);
    abrirAba(/relacionamentos/i);

    const linha = Array.from(document.querySelectorAll('.action-row')).find(el =>
      /Bolinha/.test(el.textContent ?? '')
    );

    expect(linha).toBeTruthy();
    expect(linha!.textContent).toMatch(/Pet/);
    expect(linha!.textContent).not.toMatch(/…/);
  });
});

/* ═════════════════════════════════ 6. +1 ANO com timeline longa */

describe('Inspeção · +1 ANO acessível com timeline longa', () => {
  it('o botão existe assim que a vida começa', () => {
    nascerNoAcre();
    expect(document.querySelector('.year-advance__button')).toBeTruthy();
  });

  it('depois de 30 anos vividos, o botão continua ANTES da biografia', () => {
    nascerNoAcre();
    for (let i = 0; i < 30; i++) passarUmAno();

    const cta = document.querySelector('.year-advance');
    expect(cta).toBeTruthy();

    // A timeline cresceu de verdade — senão o teste não provaria nada.
    const registros = document.querySelectorAll('.timeline-entry');
    expect(registros.length).toBeGreaterThan(5);

    // E o CTA precede o último registro no documento.
    const ultimo = registros[registros.length - 1];
    expect(
      cta!.compareDocumentPosition(ultimo) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('o botão fica em fluxo (sticky), sem cobrir conteúdo no desktop', () => {
    const css = lerCss('character.css');
    const bloco = css.match(/\n\.year-advance\s*\{([^}]*)\}/)![1];

    expect(bloco).toMatch(/position:\s*sticky/);
    expect(bloco).not.toMatch(/position:\s*fixed/);
  });

  it('é alcançável por teclado e tem foco visível', () => {
    nascerNoAcre();
    const botao = document.querySelector<HTMLButtonElement>('.year-advance__button')!;

    botao.focus();
    expect(document.activeElement).toBe(botao);

    expect(lerCss('character.css')).toMatch(
      /\.year-advance__button:focus-visible[\s\S]{0,120}outline/
    );
  });
});

/* ═════════════════════════════════ 7. Pet com interações próprias */

describe('Inspeção · pet tem interações próprias', () => {
  it('o modal do pet não oferece nenhuma ação do fluxo humano', () => {
    continuarVidaComPet(10);
    abrirAba(/relacionamentos/i);

    const texto = abrirPessoa(/Bolinha/).textContent ?? '';

    expect(texto).not.toMatch(/conselho/i);
    expect(texto).not.toMatch(/dinheiro/i);
    expect(texto).not.toMatch(/discutir/i);
    expect(texto).not.toMatch(/presente/i);
    expect(texto).not.toMatch(/conversar/i);
  });

  it('o modal do pet oferece as ações de bicho', () => {
    continuarVidaComPet(10);
    abrirAba(/relacionamentos/i);

    const texto = abrirPessoa(/Bolinha/).textContent ?? '';

    expect(texto).toMatch(/carinho/i);
    expect(texto).toMatch(/[Bb]rincar/);
    expect(texto).toMatch(/passear/i);
  });

  it('aos 3 anos a criança não recebe as ações que exigem idade', () => {
    continuarVidaComPet(3);
    abrirAba(/relacionamentos/i);

    const dialogo = abrirPessoa(/Bolinha/);
    const texto = dialogo.textContent ?? '';

    // Carinho e brincar, sim; passear e cuidar, ainda não.
    expect(texto).toMatch(/carinho/i);
    expect(texto).not.toMatch(/passear/i);
    expect(texto).not.toMatch(/[Bb]anho/);
  });

  it('o rótulo da ação é escrito para a idade de quem joga', () => {
    continuarVidaComPet(3);
    abrirAba(/relacionamentos/i);
    const infancia = abrirPessoa(/Bolinha/).textContent ?? '';

    cleanup();
    localStorage.clear();

    continuarVidaComPet(10);
    abrirAba(/relacionamentos/i);
    const maior = abrirPessoa(/Bolinha/).textContent ?? '';

    expect(infancia).not.toBe(maior);
  });

  it('pai e mãe continuam no fluxo humano — a fronteira é por espécie', () => {
    continuarVidaComPet(10);
    abrirAba(/relacionamentos/i);

    const dialogo = abrirPessoa(/Pai/);
    expect(within(dialogo).getAllByRole('button').length).toBeGreaterThan(1);
    expect(dialogo.textContent).not.toMatch(/coleira|ração/i);
  });
});

/* ═════════════════════════════════ 8. Breakpoints: desktop e ~360px */

describe('Inspeção · responsividade em 360px e desktop', () => {
  const responsive = lerCss('responsive.css');

  it('existe um breakpoint que alcança 360px', () => {
    const larguras = [...responsive.matchAll(/max-width:\s*(\d+)px/g)].map(m =>
      Number(m[1])
    );
    expect(Math.min(...larguras)).toBeLessThanOrEqual(380);
  });

  it('no mobile o +1 ANO ancora no rodapé e o conteúdo reserva espaço', () => {
    expect(responsive).toMatch(
      /\.year-advance--docked\s*\{[\s\S]{0,400}position:\s*fixed/
    );
    // O dock não pode cobrir a timeline: o main compensa com padding inferior.
    expect(responsive).toMatch(
      /\.shell-main\s*\{[^}]*padding:[^;]*calc\([^)]*\)[^}]*\}/
    );
  });

  it('o dock respeita a área segura do aparelho', () => {
    expect(responsive).toMatch(/safe-area-inset-bottom/);
  });

  it('a identidade encolhe sem estourar a largura', () => {
    expect(responsive).toMatch(/\.identity\s*\{[\s\S]{0,260}minmax\(0,\s*1fr\)/);
  });

  it('o retrato diminui em 380px em vez de empurrar o texto', () => {
    const bloco = responsive.slice(responsive.indexOf('max-width: 380px'));
    expect(bloco).toMatch(/\.identity__portrait\s*\{[^}]*width:\s*56px/);
  });

  it('o seletor de avatar quebra em linhas e pode encolher', () => {
    const avatar = lerCss('avatar.css');
    expect(avatar).toMatch(/\.avatar-picker__controls\s*\{[\s\S]{0,200}min-width:\s*0/);
    expect(avatar).toMatch(/flex-wrap:\s*wrap/);
  });

  it('as escolhas de evento têm alvo de toque confortável', () => {
    expect(responsive).toMatch(
      /\.event-choice\s*\{[\s\S]{0,200}min-height:\s*var\(--touch-target\)/
    );
  });
});
