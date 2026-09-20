/**
 * B4-FIX2 item 12 — bug visual do marcador sobre o título da timeline.
 *
 * O playtest reportou um "ponto" sobreposto ao primeiro caractere dos
 * títulos de ano ("Nascimento", "1 ano" etc.). Causa raiz: o marcador
 * (`.timeline-year__header::before`, `position: absolute`) usava como
 * contexto de posicionamento o ancestral mais próximo com
 * `position: relative` — que era `.timeline-year`, não
 * `.timeline-year__header`. Isso jogava o marcador para dentro da área de
 * conteúdo do cabeçalho (sobre o texto), em vez da calha do eixo à
 * esquerda.
 *
 * Este teste lê o CSS real e falha se a correção for revertida.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const css = readFileSync(resolve(__dirname, '../timeline.css'), 'utf-8');

function extrairRegra(seletor: string): string {
  const escaped = seletor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  if (!match) throw new Error(`Regra ${seletor} não encontrada em timeline.css`);
  return match[1];
}

describe('B4-FIX2 · marcador da timeline não sobrepõe o título', () => {
  it('.timeline-year__header declara position: relative (contexto do próprio marcador)', () => {
    const regra = extrairRegra('.timeline-year__header');
    expect(regra).toMatch(/position:\s*relative/);
  });

  it('.timeline-year__header::before continua absolute, ancorado ao header (não ao grupo do ano)', () => {
    const regra = extrairRegra('.timeline-year__header::before');
    expect(regra).toMatch(/position:\s*absolute/);
  });

  it('o marcador do ano fica à esquerda do texto (left pequeno, dentro da calha do eixo)', () => {
    const regra = extrairRegra('.timeline-year__header::before');
    const leftMatch = regra.match(/left:\s*(-?\d+)px/);
    expect(leftMatch).toBeTruthy();
    const left = Number(leftMatch![1]);
    // A calha do eixo é bem mais estreita que o espaço do título — qualquer
    // valor pequeno e não-negativo mantém o marcador fora da área de texto,
    // já que o padding-left do header (--space-7 = 32px) começa depois dele.
    expect(left).toBeGreaterThanOrEqual(0);
    expect(left).toBeLessThan(16);
  });
});
