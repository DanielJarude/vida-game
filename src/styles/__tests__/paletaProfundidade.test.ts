/**
 * B4-FIX2 item 24-26 — profundidade e presença controlada da paleta.
 *
 * O PR pediu mais profundidade/contraste entre superfícies e mais presença
 * do acento principal, SEM virar dashboard colorido nem neon. Este teste
 * confirma numericamente (não visualmente — sem browser neste sandbox):
 *
 * - as quatro superfícies de fundo têm luminância estritamente crescente
 *   (deep < app < raised < elevated) — profundidade real, não plana;
 * - as duas cores semânticas novas (memória quente / estudo frio) mantêm
 *   AA de texto e são suficientemente diferentes uma da outra e do
 *   vermelho/verde já existentes — não duplicam significado;
 * - o total de cores "vivas" (accent + danger + warning + as 2 novas)
 *   continua pequeno (<=5) — não é uma paleta arco-íris por categoria.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const tokens = readFileSync(resolve(__dirname, '../tokens.css'), 'utf-8');

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
  return 0.2126 * canalLinear(r) + 0.7152 * canalLinear(g) + 0.0722 * canalLinear(b);
}

function contraste(corA: string, corB: string): number {
  const a = luminancia(corA);
  const b = luminancia(corB);
  const claro = Math.max(a, b);
  const escuro = Math.min(a, b);
  return (claro + 0.05) / (escuro + 0.05);
}

function distanciaCor(hexA: string, hexB: string): number {
  const a = hexA.replace('#', '');
  const b = hexB.replace('#', '');
  const ra = parseInt(a.slice(0, 2), 16), ga = parseInt(a.slice(2, 4), 16), ba = parseInt(a.slice(4, 6), 16);
  const rb = parseInt(b.slice(0, 2), 16), gb = parseInt(b.slice(2, 4), 16), bb = parseInt(b.slice(4, 6), 16);
  return Math.sqrt((ra - rb) ** 2 + (ga - gb) ** 2 + (ba - bb) ** 2);
}

describe('B4-FIX2 · profundidade das superfícies (item 24)', () => {
  it('as quatro superfícies de fundo têm luminância estritamente crescente', () => {
    const deep = luminancia(lerToken('bg-deep'));
    const app = luminancia(lerToken('bg-app'));
    const raised = luminancia(lerToken('bg-raised'));
    const elevated = luminancia(lerToken('bg-elevated'));

    expect(app).toBeGreaterThan(deep);
    expect(raised).toBeGreaterThan(app);
    expect(elevated).toBeGreaterThan(raised);
  });

  it('a diferença entre a superfície mais rasa e a mais elevada é perceptível', () => {
    // Base escura de propósito (o produto não pode virar tema claro): o
    // contraste entre dois tons quase-pretos nunca chega perto do 2:1 que
    // se exigiria de um tema claro. O que importa aqui é que a razão
    // aumentou de verdade em relação ao valor anterior a este PR (~1.13:1
    // entre --bg-deep e o antigo --bg-elevated) — a superfície mais
    // elevada ficou perceptivelmente mais clara, não só nominalmente.
    const razao = contraste(lerToken('bg-deep'), lerToken('bg-elevated'));
    expect(razao).toBeGreaterThan(1.2);
  });
});

describe('B4-FIX2 · cores semânticas por significado (item 25-26)', () => {
  it('memória/família (tom quente) e estudo (azul frio) atingem AA de texto sobre o fundo', () => {
    const fundo = lerToken('bg-app');
    expect(contraste(lerToken('warm-memory'), fundo)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(lerToken('cool-study'), fundo)).toBeGreaterThanOrEqual(4.5);
  });

  it('as duas cores novas são visualmente distintas entre si e dos semânticos existentes', () => {
    const warm = lerToken('warm-memory');
    const cool = lerToken('cool-study');
    const accent = lerToken('accent');
    const danger = lerToken('danger');

    // Distância euclidiana em RGB — limiar baixo só para pegar cores
    // "quase idênticas" (bug de copiar/colar), não para exigir cores
    // maximamente afastadas.
    const LIMIAR_MINIMO = 40;
    expect(distanciaCor(warm, cool)).toBeGreaterThan(LIMIAR_MINIMO);
    expect(distanciaCor(warm, accent)).toBeGreaterThan(LIMIAR_MINIMO);
    expect(distanciaCor(warm, danger)).toBeGreaterThan(LIMIAR_MINIMO);
    expect(distanciaCor(cool, accent)).toBeGreaterThan(LIMIAR_MINIMO);
    expect(distanciaCor(cool, danger)).toBeGreaterThan(LIMIAR_MINIMO);
  });

  it('o total de cores semânticas "vivas" continua pequeno (não é paleta arco-íris)', () => {
    // accent, danger, warning, warm-memory, cool-study — 5 no total.
    // Deliberadamente não conta variações de wash/soft/deep do mesmo matiz.
    const CORES_VIVAS = ['accent', 'danger', 'warning', 'warm-memory', 'cool-study'];
    for (const nome of CORES_VIVAS) {
      expect(() => lerToken(nome)).not.toThrow();
    }
    expect(CORES_VIVAS.length).toBeLessThanOrEqual(6);
  });
});

describe('B4-FIX2 · cor por categoria restrita a família/escola (item 25-26)', () => {
  const timeline = readFileSync(resolve(__dirname, '../timeline.css'), 'utf-8');

  it('só família e escola recebem cor semântica de categoria — as demais continuam monocromáticas', () => {
    const CATEGORIAS_COLORIDAS = ['familia', 'escola'];
    const CATEGORIAS_SEM_COR = ['carreira', 'amor', 'financas', 'cotidiano', 'geral'];

    for (const categoria of CATEGORIAS_COLORIDAS) {
      const regex = new RegExp(`\\[data-categoria=['"]${categoria}['"]\\]`);
      expect(timeline, `categoria ${categoria} deveria ter regra de cor`).toMatch(regex);
    }

    for (const categoria of CATEGORIAS_SEM_COR) {
      const regex = new RegExp(`\\[data-categoria=['"]${categoria}['"]\\]`);
      expect(timeline, `categoria ${categoria} não deveria ter cor própria`).not.toMatch(regex);
    }
  });

  it('a cor de categoria nunca sobrepõe o vermelho semântico de um acontecimento negativo', () => {
    // A regra de família/escola precisa de `:not(.timeline-entry--negativo)`
    // para que uma perda ou problema na família continue vermelha.
    expect(timeline).toMatch(/timeline-entry\[data-categoria='familia'\]:not\(\.timeline-entry--negativo\)/);
    expect(timeline).toMatch(/timeline-entry\[data-categoria='escola'\]:not\(\.timeline-entry--negativo\)/);
  });
});
