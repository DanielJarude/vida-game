/**
 * B4-FIX.1 — informação essencial não pode ser cortada.
 *
 * O playtest humano reportou textos truncados em campos que carregam
 * sentido: "Criança pequena — vive co...". A causa era
 * `text-overflow: ellipsis` + `white-space: nowrap` em `.identity__fact-value`
 * e `.relationship__name`.
 *
 * Este teste lê o CSS real e falha se o corte voltar. Não substitui olhar
 * a tela, mas impede a regressão silenciosa.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const DIR = resolve(__dirname, '..');

function lerCss(arquivo: string): string {
  return readFileSync(resolve(DIR, arquivo), 'utf-8');
}

function arquivosCss(): string[] {
  return readdirSync(DIR).filter(f => f.endsWith('.css'));
}

/** Extrai o corpo de uma regra CSS pelo seletor exato. */
function corpoDaRegra(css: string, seletor: string): string | null {
  const escapado = seletor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(^|\\n)\\s*${escapado}\\s*\\{([^}]*)\\}`);
  const m = css.match(re);
  return m ? m[2] : null;
}

/**
 * Seletores que carregam informação essencial.
 *
 * Fase da vida, situação, cidade, ocupação, escolaridade e nome de uma
 * pessoa. Nenhum deles pode depender de hover para ser lido.
 */
const ESSENCIAIS = ['.identity__fact-value', '.relationship__name'];

describe('B4-FIX.1 · texto essencial não é truncado', () => {
  const character = lerCss('character.css');

  for (const seletor of ESSENCIAIS) {
    it(`${seletor} existe no CSS`, () => {
      expect(corpoDaRegra(character, seletor)).not.toBeNull();
    });

    it(`${seletor} não usa ellipsis`, () => {
      expect(corpoDaRegra(character, seletor)).not.toMatch(/text-overflow\s*:\s*ellipsis/);
    });

    it(`${seletor} não força uma linha só`, () => {
      expect(corpoDaRegra(character, seletor)).not.toMatch(/white-space\s*:\s*nowrap/);
    });
  }

  it('o rótulo dos botões pode quebrar em telas estreitas', () => {
    const corpo = corpoDaRegra(lerCss('controls.css'), '.btn');
    expect(corpo).not.toBeNull();
    expect(corpo).not.toMatch(/white-space\s*:\s*nowrap/);
  });

  it('containers de texto flexível declaram min-width: 0', () => {
    // Sem isto um filho de flex/grid se recusa a encolher e vaza o layout.
    expect(corpoDaRegra(character, '.identity__fact')).toMatch(/min-width\s*:\s*0/);
    expect(corpoDaRegra(character, '.relationship__identity')).toMatch(/min-width\s*:\s*0/);
  });

  it('os nowrap remanescentes são justificáveis, não espalhados', () => {
    // Utilitário de leitor de tela, nav rolável e rótulos curtos e fixos.
    let total = 0;
    for (const arquivo of arquivosCss()) {
      total += (lerCss(arquivo).match(/white-space\s*:\s*nowrap/g) ?? []).length;
    }
    expect(total).toBeLessThanOrEqual(4);
  });
});

describe('B4-FIX.1 · +1 ANO no layout', () => {
  const character = lerCss('character.css');
  const responsive = lerCss('responsive.css');

  it('o CTA gruda no topo em vez de flutuar sobre a timeline', () => {
    const corpo = corpoDaRegra(character, '.year-advance');
    expect(corpo).toMatch(/position\s*:\s*sticky/);
    // `fixed` no desktop tiraria o elemento do fluxo e cobriria conteúdo.
    expect(corpo).not.toMatch(/position\s*:\s*fixed/);
  });

  it('no celular o CTA é ancorado e o conteúdo reserva espaço', () => {
    expect(corpoDaRegra(responsive, '.year-advance--docked')).toMatch(/position\s*:\s*fixed/);
    // O padding inferior do conteúdo impede que o dock cubra a timeline.
    expect(responsive).toMatch(/\.shell-main\s*\{[^}]*padding[^}]*\}/);
  });

  it('o CTA respeita reduced-motion', () => {
    expect(character).toMatch(/prefers-reduced-motion[\s\S]*year-advance__button/);
  });

  it('o estado desabilitado não depende só de opacidade', () => {
    const corpo = corpoDaRegra(character, '.year-advance__button:disabled');
    expect(corpo).toMatch(/background|color/);
  });
});

describe('B4-FIX.1 · avatar no layout', () => {
  const avatar = lerCss('avatar.css');

  it('o CSS do avatar é um módulo próprio e está importado', () => {
    expect(avatar.length).toBeGreaterThan(0);
    expect(lerCss('index.css')).toMatch(/@import\s+'\.\/avatar\.css'/);
  });

  it('a coluna de controles pode encolher sem vazar', () => {
    expect(corpoDaRegra(avatar, '.avatar-picker__controls')).toMatch(/min-width\s*:\s*0/);
  });

  it('as amostras de cor têm alvo de toque razoável', () => {
    const corpo = corpoDaRegra(avatar, '.avatar-swatch') ?? '';
    const largura = corpo.match(/width\s*:\s*(\d+)px/);
    expect(Number(largura?.[1])).toBeGreaterThanOrEqual(32);
  });

  it('os nomes de estilo de cabelo podem quebrar', () => {
    expect(corpoDaRegra(avatar, '.avatar-style')).toMatch(/white-space\s*:\s*normal/);
  });

  it('o seletor de avatar respeita reduced-motion', () => {
    expect(avatar).toMatch(/prefers-reduced-motion/);
  });

  it('nenhuma cor de pele ou cabelo é fixada no CSS', () => {
    // As cores vivem nos dados; o CSS só enquadra.
    expect(avatar).not.toMatch(/#f2d3bb|#4d2a17/);
  });
});
