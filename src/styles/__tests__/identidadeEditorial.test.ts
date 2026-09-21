/**
 * REWORK VISUAL — as decisões de identidade, viradas regra.
 *
 * Identidade visual é a coisa mais fácil de perder por erosão: ninguém
 * decide voltar a ser um dashboard, mas basta uma sequência de escolhas
 * pequenas e razoáveis — "só um verdinho aqui", "um rótulo em caixa alta
 * ali", "esse texto em sans fica mais limpo" — para o produto virar
 * qualquer outro produto de novo.
 *
 * Este arquivo transforma as decisões do rework em asserções sobre o CSS
 * real. Não testa aparência (isso é olho humano e captura de tela); testa
 * as REGRAS das quais a aparência depende.
 */

import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const DIR = resolve(__dirname, '..');
const arquivos = readdirSync(DIR).filter(f => f.endsWith('.css'));

function ler(nome: string): string {
  return readFileSync(resolve(DIR, nome), 'utf-8');
}

const tokens = ler('tokens.css');
const todoCss = arquivos.map(ler).join('\n');
/** Todo o CSS exceto tokens.css — onde os valores literais são legítimos. */
const cssDeComponentes = arquivos
  .filter(f => f !== 'tokens.css')
  .map(ler)
  .join('\n');

describe('Rework visual · a voz narrativa é serifa', () => {
  it('existe uma família serifa declarada, com fallback local real', () => {
    const match = tokens.match(/--font-serif:\s*([^;]+);/s);
    expect(match, '--font-serif não existe em tokens.css').toBeTruthy();
    const pilha = match![1];
    // A fonte remota é reforço, não requisito: se o Google Fonts cair, o
    // produto não pode desabar para Times do navegador.
    expect(/Georgia|Charter|Palatino|Iowan/i.test(pilha)).toBe(true);
    expect(/serif\s*$/.test(pilha.trim())).toBe(true);
  });

  it('os elementos de CONTEÚDO da vida usam a serifa, não o sans', () => {
    // Se qualquer um destes voltar para o sans, o produto volta a parecer
    // um painel — é literalmente a diferença que o rework introduziu.
    const CONTEUDO = [
      '.timeline-entry__title',
      '.timeline-entry__summary',
      '.timeline-year__age',
      '.event-scene__title',
      '.event-scene__narrative',
      '.event-result__narrative',
      '.event-choice__title'
    ];
    for (const seletor of CONTEUDO) {
      const bloco = todoCss.match(
        new RegExp(`\\${seletor}\\s*\\{[^}]*\\}`, 's')
      );
      expect(bloco, `${seletor} não encontrado no CSS`).toBeTruthy();
      expect(
        /font-family:\s*var\(--font-serif\)/.test(bloco![0]),
        `${seletor} deveria usar --font-serif (voz narrativa)`
      ).toBe(true);
    }
  });

  it('a MOBÍLIA usa o sans — a serifa não invade os controles', () => {
    const MOBILIA = ['.year-advance__button', '.btn--hero', '.t-meta'];
    for (const seletor of MOBILIA) {
      const bloco = todoCss.match(new RegExp(`\\${seletor}\\s*\\{[^}]*\\}`, 's'));
      expect(bloco, `${seletor} não encontrado`).toBeTruthy();
      expect(
        /font-family:\s*var\(--font-sans\)/.test(bloco![0]),
        `${seletor} deveria usar --font-sans (mobília de interface)`
      ).toBe(true);
    }
  });

  it('o texto narrativo tem medida de leitura limitada', () => {
    expect(tokens).toMatch(/--measure-prosa:/);
    for (const seletor of ['.timeline-entry', '.event-scene__narrative']) {
      const bloco = todoCss.match(new RegExp(`\\${seletor}\\s*\\{[^}]*\\}`, 's'));
      expect(
        /max-width:\s*var\(--measure-prosa\)/.test(bloco![0]),
        `${seletor} deveria limitar a medida de leitura`
      ).toBe(true);
    }
  });
});

describe('Rework visual · o acento é memória, e é escasso', () => {
  it('nenhum componente traz cor literal cravada — tudo passa pelos tokens', () => {
    // A cor antiga (#3ddc97 / rgba(61,220,151,…)) aparecia cravada em cinco
    // lugares fora de tokens.css, o que tornava a troca de paleta uma caça
    // a valores mágicos. Nenhum hexadecimal ou rgb() de componente agora.
    const hexes = cssDeComponentes.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    expect(hexes, 'cores hexadecimais fora de tokens.css').toEqual([]);

    // rgba() puramente neutro (preto/branco de sombra e véu) continua
    // aceitável; rgba colorido, não.
    const rgbas = cssDeComponentes.match(/rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+[^)]*\)/g) ?? [];
    const coloridos = rgbas.filter(v => {
      const [r, g, b] = v.match(/\d+/g)!.slice(0, 3).map(Number);
      const amplitude = Math.max(r, g, b) - Math.min(r, g, b);
      return amplitude > 24;
    });
    expect(coloridos, 'rgba() colorido cravado fora de tokens.css').toEqual([]);
  });

  it('o acento não é mais verde — a marca saiu da faixa de matiz do esmeralda', () => {
    const accent = tokens.match(/--accent:\s*(#[0-9a-fA-F]{6})/)![1];
    const [r, g, b] = [1, 3, 5].map(i => parseInt(accent.slice(i, i + 2), 16));
    // Verde de marca = componente verde dominando os outros dois.
    const verdeDominante = g > r + 20 && g > b + 20;
    expect(verdeDominante, `--accent (${accent}) voltou a ser verde de marca`).toBe(false);
    // E é quente: vermelho acima do azul.
    expect(r, `--accent (${accent}) deveria ser quente`).toBeGreaterThan(b);
  });

  it('o verde sobrevive apenas como sinal semântico de "melhorou"', () => {
    expect(tokens).toMatch(/--success:\s*#[0-9a-fA-F]{6}/);
    const success = tokens.match(/--success:\s*(#[0-9a-fA-F]{6})/)![1];
    const [r, g, b] = [1, 3, 5].map(i => parseInt(success.slice(i, i + 2), 16));
    expect(g).toBeGreaterThan(r);
    expect(g).toBeGreaterThan(b);
  });

  it('a base é quente: o fundo do app tem mais vermelho que azul', () => {
    // Um fundo azulado empurra para ficção científica; o marrom-tinta
    // empurra para arquivo e lembrança, que é a direção do VIDA.
    for (const nome of ['bg-deep', 'bg-app', 'bg-raised', 'bg-elevated']) {
      const hex = tokens.match(new RegExp(`--${nome}:\\s*(#[0-9a-fA-F]{6})`))![1];
      const r = parseInt(hex.slice(1, 3), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      expect(r, `--${nome} (${hex}) está mais azul que quente`).toBeGreaterThanOrEqual(b);
    }
  });
});

describe('Rework visual · nada de dashboard', () => {
  it('a Linha da Vida não repete o rótulo de categoria em cada entrada', () => {
    // O rótulo continua no HTML (leitor de tela, daltonismo), mas fora da
    // composição. Se voltar a ser visível, volta o ruído em caixa alta em
    // toda linha da biografia.
    const bloco = ler('timeline.css').match(/\.timeline-entry__category\s*\{[^}]*\}/s)![0];
    const escondido =
      /clip:\s*rect\(0,\s*0,\s*0,\s*0\)/.test(bloco) || /position:\s*absolute/.test(bloco);
    expect(escondido, 'o rótulo de categoria voltou a ser visível em toda entrada').toBe(true);
  });

  it('o medidor de atributo é um filete, não uma barra de progresso', () => {
    const bloco = ler('character.css').match(/\.attribute__track\s*\{[^}]*\}/s)![0];
    const altura = Number(bloco.match(/height:\s*(\d+)px/)?.[1] ?? 99);
    expect(altura, 'a barra de atributo voltou a engordar').toBeLessThanOrEqual(3);

    const fill = ler('character.css').match(/\.attribute__fill\s*\{[^}]*\}/s)![0];
    expect(
      /background:\s*var\(--accent\)/.test(fill),
      'o medidor de atributo voltou a ser preenchido com a cor da marca'
    ).toBe(false);
  });

  it('a caixa alta é restrita a metadados pequenos — nunca a conteúdo', () => {
    // Todo bloco com text-transform: uppercase precisa estar num tamanho
    // de metadado. Caixa alta em corpo de texto é a assinatura visual de
    // painel de controle.
    const blocos = todoCss.match(/\{[^}]*text-transform:\s*uppercase[^}]*\}/gs) ?? [];
    expect(blocos.length, 'nenhuma regra em caixa alta encontrada').toBeGreaterThan(0);
    for (const bloco of blocos) {
      const temTamanhoDeMeta =
        /font-size:\s*var\(--type-meta\)/.test(bloco) ||
        /font-size:\s*var\(--type-caption\)/.test(bloco) ||
        !/font-size:/.test(bloco);
      expect(temTamanhoDeMeta, `caixa alta em corpo grande: ${bloco.slice(0, 90)}`).toBe(true);
    }
  });

  it('a ação mais importante do jogo continua sendo a única superfície sólida de acento', () => {
    const solidos = (cssDeComponentes.match(/background:\s*var\(--accent\)\s*;/g) ?? []).length;
    // +1 ANO, o botão principal de tela, o filtro ativo da timeline e o
    // chip selecionado. Acima disso o acento deixou de ser escasso.
    expect(solidos).toBeLessThanOrEqual(5);
  });
});

describe('Rework visual · acessibilidade preservada', () => {
  it('o foco continua visível e nunca é removido', () => {
    expect(ler('base.css')).toMatch(/:focus-visible\s*\{[^}]*outline:\s*2px solid/s);
    expect(todoCss).not.toMatch(/:focus-visible\s*\{[^}]*outline:\s*none/s);
  });

  it('reduced-motion continua neutralizando o movimento', () => {
    expect(ler('base.css')).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
  });

  it('o alvo de toque mínimo continua definido e usado', () => {
    expect(tokens).toMatch(/--touch-target:\s*44px/);
    expect(todoCss).toMatch(/min-height:\s*var\(--touch-target\)/);
  });
});
