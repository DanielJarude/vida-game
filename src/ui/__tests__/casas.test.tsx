// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { criarVida } from '../../motor/criacao';
import { avancarAno } from '../../motor/ano';
import { MORADIAS } from '../../motor/dados/bens';
import type { Imovel, Moradia, Vida } from '../../motor/tipos';
import { leituraDoBem, leituraDoLar, type LeituraLar } from '../leituraMaterial';
import { CenaDaCasa } from '../jogo/material/Desenhos';
import { Casa } from '../jogo/Casa';

const nova = () => criarVida({ nome: 'Rita', sobrenome: 'Lopes', genero: 'feminino', municipioId: 'recife-pe', semente: 11 });

function morando(v: Vida, m: Partial<Moradia> & Pick<Moradia, 'tipo'>): Vida {
  v.moradia = { municipioId: v.moradia.municipioId, aluguel: 900, padrao: 3, tInicio: v.t, ...m };
  return v;
}

function imovel(v: Vida, modeloId: string, extra: Partial<Imovel> = {}): Imovel {
  const b: Imovel = { id: `im-${modeloId}`, tipo: 'imovel', modeloId, nome: modeloId, valor: 300000, tCompra: v.t - 60, municipioId: v.moradia.municipioId, estado: 80, historia: [], ...extra };
  v.financas.bens.push(b);
  return b;
}

function propria(modeloId: string, extra: Partial<Imovel> = {}): { v: Vida; l: LeituraLar } {
  const v = nova();
  const b = imovel(v, modeloId, extra);
  morando(v, { tipo: 'propria', modeloId, imovelId: b.id, aluguel: 0, padrao: MORADIAS.find(m => m.id === modeloId)!.padrao });
  return { v, l: leituraDoLar(v) };
}

/** Todas as moradias: cada modelo alugado, mais a casa da família, de parentes, de favor e a funcional. */
function todas(): [string, LeituraLar][] {
  const out: [string, LeituraLar][] = MORADIAS.map(m => [m.id, leituraDoLar(morando(nova(), { tipo: m.id === 'republica' ? 'republica' : 'aluguel', modeloId: m.id, padrao: m.padrao }))]);
  out.push(['pais', leituraDoLar(morando(nova(), { tipo: 'pais', aluguel: 0 }))]);
  out.push(['parente', leituraDoLar(morando(nova(), { tipo: 'parente', aluguel: 0 }))]);
  out.push(['cedida', leituraDoLar(morando(nova(), { tipo: 'cedida', aluguel: 0, padrao: 1 }))]);
  out.push(['funcional', leituraDoLar(morando(nova(), { tipo: 'cedida', funcional: true, aluguel: 280, bairro: 'na vila militar' }))]);
  return out;
}

afterEach(cleanup);

describe('Casas com identidade visual', () => {
  it('cada modelo de moradia (e a casa da família, de parentes, de favor, funcional) tem a sua forma', () => {
    const t = todas();
    const formas = t.map(([, l]) => l.forma);
    expect(new Set(formas).size).toBe(t.length);
    for (const m of MORADIAS) expect(t.find(([id]) => id === m.id)![1].forma).toBe(m.id);
    expect(t.find(([id]) => id === 'pais')![1].forma).toBe('familia');
    expect(t.find(([id]) => id === 'parente')![1].forma).toBe('parente');
    expect(t.find(([id]) => id === 'cedida')![1].forma).toBe('favor');
    expect(t.find(([id]) => id === 'funcional')![1].forma).toBe('funcional');
    // O que o desenho precisa vem do motor.
    const sitio = t.find(([id]) => id === 'sitio')![1];
    expect(sitio.rural).toBe(true);
    expect(sitio.modeloId).toBe('sitio');
    expect(t.find(([id]) => id === 'casa_simples')![1].padrao).toBe(1);
  });

  it('os desenhos diferem entre si, e cada um tem nome acessível que diz o tipo de casa', () => {
    const t = todas();
    const desenhos = t.map(([, l]) => {
      const { container } = render(<CenaDaCasa l={l} />);
      const svg = container.querySelector('svg')!;
      const html = svg.innerHTML;
      const nome = svg.getAttribute('aria-label')!;
      expect(svg.getAttribute('role')).toBe('img');
      expect(nome).toMatch(/^Desenho: /);
      cleanup();
      return { html, nome };
    });
    expect(new Set(desenhos.map(d => d.html)).size).toBe(t.length);
    expect(new Set(desenhos.map(d => d.nome)).size).toBe(t.length);
    const nome = (id: string) => desenhos[t.findIndex(([k]) => k === id)].nome;
    expect(nome('alto_padrao')).toMatch(/torre.*portaria/);
    expect(nome('casa_simples')).toMatch(/casa simples de laje.*tijolo à vista/);
    expect(nome('pais')).toMatch(/casa da família/);
    expect(nome('sitio')).toMatch(/sítio/);
    expect(nome('kitnet')).toMatch(/kitnets/);
  });

  it('o estado aparece no traço: reparo pendente (andaime e rachadura), parede ruim, gasta e pintura nova', () => {
    const comProblema = propria('casa_2q', { estado: 55, problema: { id: 'p1', texto: 'uma infiltração no telhado', custo: 3000, desde: 0, gravidade: 2, adiado: 0 } });
    expect(comProblema.l.condicao.nivel).toBe('problema');
    let { container } = render(<CenaDaCasa l={comProblema.l} />);
    expect(container.querySelector('[data-condicao="andaime"]')).toBeTruthy();
    expect(container.querySelector('[data-condicao="rachadura"]')).toBeTruthy();
    expect(container.querySelector('svg')!.getAttribute('aria-label')).toMatch(/andaime e rachadura.*infiltração/);
    cleanup();

    const ruim = propria('apto_2q', { estado: 25 });
    ({ container } = render(<CenaDaCasa l={ruim.l} />));
    expect(container.querySelector('[data-condicao="rachadura"]')).toBeTruthy();
    expect(container.querySelector('[data-condicao="andaime"]')).toBeNull();
    expect(container.querySelector('svg')!.getAttribute('aria-label')).toMatch(/rachaduras na parede/);
    cleanup();

    const gasta = propria('casa_3q', { estado: 55 });
    ({ container } = render(<CenaDaCasa l={gasta.l} />));
    expect(container.querySelector('[data-condicao="mancha"]')).toBeTruthy();
    expect(container.querySelector('[data-condicao="rachadura"]')).toBeNull();
    cleanup();

    const boa = propria('casa_3q', { estado: 90 });
    ({ container } = render(<CenaDaCasa l={boa.l} />));
    expect(container.querySelector('[data-condicao]')).toBeNull();
    cleanup();

    const v0 = nova();
    const reformada = propria('casa_simples', { estado: 70, tManutencao: v0.t - 3 });
    expect(reformada.l.condicao.reformaRecente).toBe(true);
    ({ container } = render(<CenaDaCasa l={reformada.l} />));
    expect(container.querySelector('[data-detalhe="pintura-nova"]')).toBeTruthy();
    // Reboco novo: a casa simples reformada não mostra mais o tijolo.
    expect(container.querySelector('[data-detalhe="tijolo"]')).toBeNull();
    expect(container.querySelector('svg')!.getAttribute('aria-label')).toMatch(/pintura nova/);
    cleanup();

    const velha = propria('casa_simples', { estado: 70, tManutencao: v0.t - 60 });
    expect(velha.l.condicao.reformaRecente).toBe(false);
    ({ container } = render(<CenaDaCasa l={velha.l} />));
    expect(container.querySelector('[data-detalhe="tijolo"]')).toBeTruthy();
  });

  it('janelas acesas, veículo e bichos continuam no desenho de cada forma', () => {
    for (const [, l] of todas()) {
      const comTudo: LeituraLar = { ...l, janelasAcesas: 3, veiculo: 'carro', bichos: [{ id: 'b1', nome: 'Pipoca', especie: 'cachorro' }, { id: 'b2', nome: 'Mingau', especie: 'gato' }] };
      const { container } = render(<CenaDaCasa l={comTudo} />);
      expect(container.querySelectorAll('.cena__janela--acesa').length).toBeGreaterThanOrEqual(1);
      expect(container.querySelector('.cena__veiculo')).toBeTruthy();
      expect(container.querySelectorAll('.cena__bicho').length).toBe(2);
      expect(container.querySelector('svg')!.getAttribute('aria-label')).toMatch(/Pipoca e Mingau na frente, um carro na porta/);
      cleanup();
    }
  });
});

describe('Imóvel próprio no cartão: o ícone do próprio modelo', () => {
  let v: Vida;
  beforeAll(() => {
    v = nova();
    for (let i = 0; i < 26; i++) { v = avancarAno(v).vida; v.momento = null; }
  });

  it('leituraDoBem leva o modelo, e o cartão desenha a silhueta dele', () => {
    const ids = ['casa_3q', 'apto_1q', 'sitio', 'alto_padrao'];
    for (const id of ids) {
      const b = imovel(v, id);
      expect(leituraDoBem(v, b).icone).toBe(id);
      expect(leituraDoBem(v, b).modeloId).toBe(id);
    }
    const { container } = render(<Casa vida={v} agir={() => true} />);
    for (const id of ids) expect(container.querySelector(`.objeto--imovel .icone-moradia--${id}`)).toBeTruthy();
  });
});
