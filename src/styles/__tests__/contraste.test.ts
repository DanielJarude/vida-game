/**
 * B4-FIX — contraste dos tokens de texto.
 *
 * O playtest humano reportou "informações secundárias com contraste muito
 * baixo". A medição confirmou: --text-muted estava em 4.12:1 e
 * --text-faint em 2.57:1 contra o fundo do app, ambos reprovados no
 * WCAG AA.
 *
 * Este teste lê o CSS real e falha se algum token de texto voltar a cair
 * abaixo do mínimo — a correção não depende de ninguém lembrar dela.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const tokens = readFileSync(
  resolve(__dirname, '../tokens.css'),
  'utf-8'
);

/** Lê o valor hexadecimal de uma custom property. */
function lerToken(nome: string): string {
  const match = tokens.match(new RegExp(`--${nome}:\\s*(#[0-9a-fA-F]{6})`));
  if (!match) throw new Error(`Token --${nome} não encontrado em tokens.css`);
  return match[1];
}

function canalLinear(valor: number): number {
  const c = valor / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminancia(hex: string): number {
  const limpo = hex.replace('#', '');
  const r = parseInt(limpo.slice(0, 2), 16);
  const g = parseInt(limpo.slice(2, 4), 16);
  const b = parseInt(limpo.slice(4, 6), 16);
  return (
    0.2126 * canalLinear(r) +
    0.7152 * canalLinear(g) +
    0.0722 * canalLinear(b)
  );
}

function contraste(corA: string, corB: string): number {
  const a = luminancia(corA);
  const b = luminancia(corB);
  const claro = Math.max(a, b);
  const escuro = Math.min(a, b);
  return (claro + 0.05) / (escuro + 0.05);
}

describe('B4-FIX · contraste dos tokens de texto', () => {
  const fundo = lerToken('bg-app');

  // 4.5:1 é o mínimo do WCAG AA para texto normal.
  const MINIMO_AA = 4.5;

  it.each([
    ['text-primary'],
    ['text-secondary'],
    ['text-muted'],
    ['text-faint']
  ])('--%s atinge o mínimo AA sobre o fundo do app', nome => {
    const razao = contraste(lerToken(nome), fundo);
    expect(
      razao,
      `--${nome} (${lerToken(nome)}) tem ${razao.toFixed(2)}:1, abaixo de ${MINIMO_AA}:1`
    ).toBeGreaterThanOrEqual(MINIMO_AA);
  });

  it('o acento é legível como texto sobre o fundo', () => {
    expect(contraste(lerToken('accent'), fundo)).toBeGreaterThanOrEqual(MINIMO_AA);
  });

  it('as cores semânticas são legíveis sobre o fundo', () => {
    expect(contraste(lerToken('danger'), fundo)).toBeGreaterThanOrEqual(3);
    expect(contraste(lerToken('warning'), fundo)).toBeGreaterThanOrEqual(3);
  });

  it('a hierarquia de texto é monotônica (primary > secondary > muted > faint)', () => {
    const p = contraste(lerToken('text-primary'), fundo);
    const s = contraste(lerToken('text-secondary'), fundo);
    const m = contraste(lerToken('text-muted'), fundo);
    const f = contraste(lerToken('text-faint'), fundo);

    // Precisa continuar existindo hierarquia: legibilidade não pode ser
    // conquistada achatando tudo no mesmo tom.
    expect(p).toBeGreaterThan(s);
    expect(s).toBeGreaterThan(m);
    expect(m).toBeGreaterThan(f);
  });

  it('o texto sobre o acento sólido (CTA) é legível', () => {
    // O botão +1 ANO usa --bg-deep sobre --accent.
    expect(
      contraste(lerToken('bg-deep'), lerToken('accent'))
    ).toBeGreaterThanOrEqual(MINIMO_AA);
  });
});
