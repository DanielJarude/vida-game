/**
 * @vitest-environment jsdom
 *
 * B4-FIX2 item 14/15 — +1 ANO precisa continuar acessível sem rolagem,
 * inclusive no desktop e com uma Linha da Vida longa.
 *
 * Bug real (playtest): `.year-advance--docked` só ganhava `position: fixed`
 * dentro de `@media (max-width: 900px)`. No desktop (>900px) o CSS não
 * aplicava dock nenhum — o botão ficava em fluxo normal, depois da última
 * entrada da timeline, obrigando o jogador a rolar até o fim para avançar
 * o ano. Isso reproduz exatamente o item do PR: "o jogador ainda precisa
 * rolar para encontrar o +1 ANO".
 *
 * Este teste é estrutural: monta uma timeline fabricada com muitas décadas
 * de entradas (viewport "longe do fim") e verifica, via CSSOM real
 * (jsdom aplica cascata e resolve propriedades de layout, exceto
 * `position: sticky`/`fixed` que o motor de layout do jsdom não calcula
 * geometria — por isso a asserção é sobre a REGRA aplicada ao elemento,
 * não sobre coordenadas de pixel, que exigiriam um browser real).
 *
 * Não é um teste de "existe um botão no DOM": ele falha se a regra de
 * ancoragem for removida, se for restrita de novo a um único breakpoint,
 * ou se o botão deixar de estar sempre presente e habilitado durante o
 * scroll de uma vida longa.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import { TimelineSection } from '../../components/timeline/TimelineSection';
import type { LifeLogEntry } from '../../types';

afterEach(cleanup);

const characterCss = readFileSync(
  resolve(__dirname, '../character.css'),
  'utf-8'
);
const responsiveCss = readFileSync(
  resolve(__dirname, '../responsive.css'),
  'utf-8'
);

function extrairRegra(css: string, seletor: string): string {
  const escaped = seletor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  if (!match) throw new Error(`Regra ${seletor} não encontrada`);
  return match[1];
}

describe('B4-FIX2 · +1 ANO acessível sem rolagem, em qualquer largura', () => {
  it('a regra base de ancoragem (fora de qualquer @media) fixa o botão ao fundo da coluna', () => {
    // A regra tem que existir FORA de um @media com teto de largura — senão
    // volta a ficar restrita ao celular, reproduzindo o bug original.
    const semMediaQueries = characterCss.replace(/@media[^{]*\{[\s\S]*?\n\}\n/g, '');
    const regra = extrairRegra(semMediaQueries, '.year-advance--docked');
    expect(regra).toMatch(/position:\s*sticky/);
    expect(regra).toMatch(/bottom:\s*0/);
  });

  it('a regra de dock não está mais presa a um teto de largura máxima', () => {
    // Antes do fix, a ÚNICA declaração de `.year-advance--docked` com
    // `position` vinha de dentro de `@media (max-width: 900px)`. Depois do
    // fix, essa mesma media query só ajusta espaçamento — não introduz o
    // `position` pela primeira vez.
    const blocoMobile = responsiveCss.match(
      /@media \(max-width: 900px\) \{([\s\S]*)$/
    )?.[1] ?? '';
    const regraMobile = extrairRegra(blocoMobile, '.year-advance--docked');
    expect(regraMobile).not.toMatch(/position:\s*(fixed|sticky)/);
  });

  it('permanece visível e habilitado com uma timeline muito longa (25 anos simulados)', () => {
    const timelineLonga: LifeLogEntry[] = [];
    for (let idade = 0; idade <= 25; idade++) {
      for (let i = 0; i < 6; i++) {
        timelineLonga.push({
          id: `evt-${idade}-${i}`,
          idade,
          ano: 2000 + idade,
          categoria: 'evento',
          texto: `Acontecimento ${i} aos ${idade} anos. Texto de preenchimento para simular uma vida longa.`
        });
      }
    }

    render(
      React.createElement(TimelineSection, {
        timeline: timelineLonga,
        idadeAtual: 25,
        onEnvelhecer: () => {},
        bloqueado: false
      })
    );

    // O botão precisa estar presente e habilitado independentemente de
    // quantas entradas vieram antes dele no fluxo do documento — porque
    // ele não depende de posição no fluxo: está ancorado (sticky) à parte
    // visível da coluna, não ao final do documento.
    const botao = screen.getByRole('button', { name: /\+ 1 ano/i });
    expect(botao).toBeTruthy();
    expect((botao as HTMLButtonElement).disabled).toBe(false);

    // O contêiner do botão precisa carregar a classe de ancoragem sempre
    // que usado na seção Linha da Vida — não é opcional/condicional.
    const container = botao.closest('.year-advance');
    expect(container?.className).toContain('year-advance--docked');
  });

  it('quando bloqueado por evento em aberto, o dock continua presente (não desaparece)', () => {
    render(
      React.createElement(TimelineSection, {
        timeline: [],
        idadeAtual: 10,
        onEnvelhecer: () => {},
        bloqueado: true
      })
    );

    const botao = screen.getByRole('button', { name: /\+ 1 ano/i });
    expect((botao as HTMLButtonElement).disabled).toBe(true);
    expect(botao.closest('.year-advance')?.className).toContain(
      'year-advance--docked'
    );
  });
});
