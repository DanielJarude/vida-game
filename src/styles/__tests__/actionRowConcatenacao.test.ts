/**
 * B4-FIX3 item 21 — bug real do playtest: "Ensino Fundamental2040" sem
 * espaço, causado por `.action-row__title`/`.action-row__detail` serem
 * `<span>`/`<p>` inline sem `display` próprio quando o componente usa
 * `<span>` em vez de `<div>` (ex.: lista de "Formação concluída").
 *
 * Este teste lê o CSS real e falha se a correção for revertida — não
 * testa apenas "existe uma regra"; confirma que o layout força quebra de
 * linha entre título e detalhe, o que elimina a classe inteira de bug
 * (não só a ocorrência específica relatada).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const css = readFileSync(resolve(__dirname, '../controls.css'), 'utf-8');

function extrairRegra(seletor: string): string {
  const escaped = seletor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  if (!match) throw new Error(`Regra ${seletor} não encontrada em controls.css`);
  return match[1];
}

describe('B4-FIX3 · action-row não concatena título e detalhe sem espaço/quebra', () => {
  it('.action-row__body é um container flex em coluna (garante quebra entre título e detalhe)', () => {
    const regra = extrairRegra('.action-row__body');
    expect(regra).toMatch(/display:\s*flex/);
    expect(regra).toMatch(/flex-direction:\s*column/);
  });

  it('.action-row__title é display: block (nunca inline, mesmo dentro de <span>)', () => {
    const regra = extrairRegra('.action-row__title');
    expect(regra).toMatch(/display:\s*block/);
  });

  it('.action-row__detail é display: block (nunca inline, mesmo dentro de <span>)', () => {
    const regra = extrairRegra('.action-row__detail');
    expect(regra).toMatch(/display:\s*block/);
  });
});
