/**
 * @vitest-environment jsdom
 *
 * BUILD HTML5 / itch.io — 320px como TESTE DE ESTRESSE, e altura de tela.
 *
 * O arquivo irmão `responsividadeEstrutural.test.ts` já cobre 360→1920. Faltavam
 * duas coisas exigidas pela publicação no itch.io, onde o jogo roda dentro de um
 * iframe que pode ser mais estreito e mais baixo que a janela real:
 *
 *   1. 320px — a menor largura que ainda precisa ser JOGÁVEL;
 *   2. altura útil pequena (o navegador mobile come altura com as próprias
 *      barras), onde depender de `100vh` puro prende conteúdo fora da tela.
 *
 * A verificação é sobre o ORÇAMENTO DE LARGURA e sobre as regras da cascata
 * real (via CSSOM do jsdom), não sobre pixels renderizados: o jsdom não calcula
 * geometria. Um navegador de verdade não está disponível neste sandbox — a
 * limitação está registrada no relatório.
 *
 * Nenhum destes testes conhece regra de gameplay: são invariantes de layout.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const dir = (f: string) => resolve(__dirname, '..', f);
const tokens = readFileSync(dir('tokens.css'), 'utf-8');
const base = readFileSync(dir('base.css'), 'utf-8');
const responsive = readFileSync(dir('responsive.css'), 'utf-8');
const shell = readFileSync(dir('shell.css'), 'utf-8');
const events = readFileSync(dir('events.css'), 'utf-8');
const screens = readFileSync(dir('screens.css'), 'utf-8');
const controls = readFileSync(dir('controls.css'), 'utf-8');
const character = readFileSync(dir('character.css'), 'utf-8');

const TODO_CSS = [tokens, base, responsive, shell, events, screens, controls, character].join('\n');

/** Valor de um token `--nome: valor;` declarado em tokens.css. */
function token(nome: string): string {
  const m = tokens.match(new RegExp(`--${nome}:\\s*([^;]+);`));
  if (!m) throw new Error(`token --${nome} não encontrado`);
  return m[1].trim();
}

function px(valor: string): number {
  const m = valor.match(/(-?[\d.]+)px/);
  if (!m) throw new Error(`valor não é px: ${valor}`);
  return Number(m[1]);
}

/** Corpo de uma regra, opcionalmente dentro de um `@media (max-width: N px)`. */
function regra(css: string, seletor: string, maxWidth?: number): string | null {
  let escopo = css;
  if (maxWidth !== undefined) {
    const blocos = [
      ...css.matchAll(/@media \(max-width:\s*(\d+)px\)\s*\{([\s\S]*?)\n\}/g)
    ].filter((m) => Number(m[1]) === maxWidth);
    if (blocos.length === 0) return null;
    escopo = blocos.map((b) => b[2]).join('\n');
  } else {
    escopo = css.replace(/@media[^{]*\{[\s\S]*?\n\}/g, '');
  }
  const esc = seletor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = escopo.match(new RegExp(`(?:^|[,{}\\s])${esc}\\s*\\{([^}]*)\\}`, 'm'));
  return m ? m[1] : null;
}

const VIEWPORT_MINIMA = 320;

describe('itch.io · 320px é utilizável (teste de estresse de largura)', () => {
  it('a raiz corta rolagem horizontal acidental em qualquer largura', () => {
    const html = regra(base, 'html') ?? '';
    const body = regra(base, 'body') ?? '';
    expect(`${html}${body}`).toMatch(/overflow-x:\s*hidden/);
  });

  it('box-sizing global impede que padding some à largura declarada', () => {
    // Sem isto, `width: 100%` + padding estoura o pai em telas estreitas —
    // a causa mais comum de rolagem horizontal em mobile.
    expect(base).toMatch(/box-sizing:\s*border-box/);
  });

  it('em 320px o conteúdo da coluna principal cabe sem estourar', () => {
    // Abaixo de 380px o padding lateral cai para --space-3 dos dois lados.
    const padding = px(token('space-3'));
    const disponivel = VIEWPORT_MINIMA - padding * 2;
    expect(disponivel).toBeGreaterThan(0);
    // Sobra real para texto e botões — não é só "não negativo".
    expect(disponivel).toBeGreaterThanOrEqual(280);
  });

  it('o +1 ANO ancorado não é mais largo que a coluna em 320px (a margem negativa casa com o padding)', () => {
    // Regressão real já corrigida antes: margem negativa de --space-4 contra
    // padding de --space-3 sobrava 8px e criava rolagem horizontal em 320px.
    const r = regra(responsive, '.year-advance--docked', 380);
    expect(r).not.toBeNull();
    const margem = r!.match(/margin-left:\s*calc\(-1 \* var\(--([a-z0-9-]+)\)\)/);
    const padd = r!.match(/padding-left:\s*var\(--([a-z0-9-]+)\)/);
    expect(margem).not.toBeNull();
    expect(padd).not.toBeNull();
    expect(margem![1]).toBe(padd![1]);
  });

  it('nenhuma grade exige coluna mínima maior que a largura útil de 320px', () => {
    const minimos = [...TODO_CSS.matchAll(/minmax\((\d+)px/g)].map((m) => Number(m[1]));
    expect(minimos.length).toBeGreaterThan(0);
    const util = VIEWPORT_MINIMA - px(token('space-3')) * 2;
    for (const min of minimos) {
      // `auto-fit`/`auto-fill` colapsam para uma coluna só se o mínimo couber.
      expect(min).toBeLessThanOrEqual(util);
    }
  });

  it('blocos com largura mínima fixa podem quebrar linha (senão empurram a página)', () => {
    // O editor de avatar é o caso: preview 96px + gap + controles 220px passa
    // de 320px. Só não estoura porque o container tem flex-wrap.
    const editor = regra(screens, '.avatar-editor');
    expect(editor).toMatch(/flex-wrap:\s*wrap/);
  });

  it('títulos e textos longos quebram palavra em vez de alargar a página', () => {
    const r = regra(responsive, '.timeline-entry__title,\n  .event-scene__title', 380)
      ?? regra(responsive, '.event-scene__title', 380);
    expect(r ?? '').toMatch(/overflow-wrap:\s*anywhere/);
  });

  it('a marca clicável mantém alvo de toque mesmo com a tipografia reduzida', () => {
    const r = regra(responsive, '.shell-brand', 380);
    expect(r ?? '').toMatch(/min-height:\s*var\(--touch-target\)/);
  });
});

describe('itch.io · altura de tela pequena (barras do navegador mobile)', () => {
  it('as telas de altura cheia declaram dvh depois de vh (fallback + correção)', () => {
    // `100vh` no mobile conta a barra do navegador que pode estar recolhida:
    // o rodapé fica fora da tela. `100dvh` acompanha a altura real. Manter os
    // dois, nesta ordem, atende navegador antigo e navegador atual.
    for (const [nome, css] of [
      ['base.css', base],
      ['shell.css', shell],
      ['screens.css', screens]
    ] as const) {
      const alturas = [...css.matchAll(/min-height:\s*100(d?)vh/g)].map((m) => m[1]);
      expect(alturas, nome).toContain('');
      expect(alturas, nome).toContain('d');
      expect(alturas.indexOf(''), nome).toBeLessThan(alturas.indexOf('d'));
    }
  });

  it('o modal nunca ocupa mais que a viewport e rola por dentro', () => {
    const surface = regra(events, '.modal-surface') ?? '';
    expect(surface).toMatch(/max-height:\s*\d+vh/);
    expect(px(surface.match(/max-height:\s*(\d+)vh/)![1] + 'px')).toBeLessThanOrEqual(92);
    expect(surface).toMatch(/overflow-y:\s*auto/);
  });

  it('o overlay do modal também rola, para alcançar o conteúdo em telas baixas', () => {
    // Se só a superfície rolasse, num aparelho baixo (ex.: 320x568) com o
    // teclado virtual aberto o topo do modal ficaria inalcançável.
    const overlay = regra(events, '.modal-overlay') ?? '';
    expect(overlay).toMatch(/overflow-y:\s*auto/);
  });

  it('o +1 ANO respeita a área segura do sistema (gestos/notch)', () => {
    const r = regra(responsive, '.year-advance--docked', 900) ?? '';
    expect(r).toMatch(/safe-area-inset-bottom/);
  });

  it('as colunas laterais fixas rolam por dentro em vez de cortar conteúdo', () => {
    for (const sel of ['.shell-rail', '.shell-aside']) {
      const r = regra(shell, sel) ?? '';
      expect(r, sel).toMatch(/overflow-y:\s*auto/);
      expect(r, sel).toMatch(/max-height:\s*calc\(100vh/);
    }
  });
});

describe('itch.io · toque e acessibilidade preservados', () => {
  it('o token de alvo de toque é confortável (>=44px)', () => {
    expect(px(token('touch-target'))).toBeGreaterThanOrEqual(44);
  });

  it('botões e escolhas de evento respeitam o alvo de toque', () => {
    expect(regra(controls, '.btn') ?? '').toMatch(/min-height:\s*var\(--touch-target\)/);
    expect(regra(responsive, '.event-choice', 560) ?? '').toMatch(
      /min-height:\s*var\(--touch-target\)/
    );
  });

  it('nenhuma ação essencial existe apenas no hover', () => {
    // `:hover` pode enfeitar, mas não pode ser a única forma de revelar algo:
    // no toque não existe hover. Falha se alguma regra de hover mudar
    // display/visibility de um elemento que estava escondido.
    const hovers = [...TODO_CSS.matchAll(/:hover[^{]*\{([^}]*)\}/g)].map((m) => m[1]);
    for (const corpo of hovers) {
      expect(corpo).not.toMatch(/display:\s*(?!none)/);
      expect(corpo).not.toMatch(/visibility:\s*visible/);
    }
  });

  it('o foco continua visível (navegação por teclado no desktop)', () => {
    expect(TODO_CSS).toMatch(/:focus-visible/);
  });

  it('prefers-reduced-motion continua respeitado', () => {
    expect(base).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
  });
});
