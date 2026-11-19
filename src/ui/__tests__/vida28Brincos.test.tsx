/**
 * VIDA 28 — o brinco colocado aparece com a forma dele também com cabelo comprido. Antes, o cabelo da frente era
 * desenhado por cima da orelha: na vitrine (cabelo preso) cada brinco tinha a sua forma; no corpo, todos sumiam iguais.
 */
import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Retrato } from '../avatar/Retrato';
import type { Visual } from '../../motor/tipos';

const retrato = (cabelo: string, modeloBrincos: string) => renderToStaticMarkup(createElement(Retrato, { visual: { pele: 'p3', cabelo, corCabelo: 'castanho_escuro', olhos: 'castanho', brincos: true, modeloBrincos } as Visual, genero: 'feminino', idade: 25, tamanho: 120 }));

describe('VIDA 28 · brincos com cabelo comprido', () => {
  it('com cabelo que cobre a orelha, o brinco vem depois do cabelo da frente (fica visível, com a forma dele)', () => {
    for (const cabelo of ['longo_liso', 'cacheado_longo', 'longo_ondulado']) {
      const html = retrato(cabelo, 'j20_argola_g_ouro_amarelo');
      const frente = html.indexOf('retrato__cabelo--frente');
      const brinco = html.indexOf('data-brinco="argola_g"');
      expect(frente, cabelo).toBeGreaterThan(-1);
      expect(brinco, cabelo).toBeGreaterThan(frente);
    }
  });
  it('cada modelo continua com a sua forma; com a orelha à mostra, o brinco fica no lugar de antes (antes do cabelo)', () => {
    const formas = ['brincos', 'brincos_alargador', 'j20_argola_g_ouro_amarelo', 'brincos_gota'].map(m => /data-brinco="([^"]+)"/.exec(retrato('longo_liso', m))![1]);
    expect(new Set(formas).size).toBe(4);
    const curto = retrato('pixie', 'brincos_gota');
    expect(curto.indexOf('data-brinco="gota"')).toBeLessThan(curto.indexOf('retrato__cabelo--frente') === -1 ? Infinity : curto.indexOf('retrato__cabelo--frente'));
  });
});
