/**
 * B4-FIX2 item 17 — dados do avatar personalizável (camada pura).
 */

import { describe, it, expect } from 'vitest';
import {
  APARENCIA_PADRAO,
  CORES_CABELO,
  CORES_OLHOS,
  ESTILOS_CABELO,
  TONS_PELE,
  corHexCabelo,
  corHexOlhos,
  corHexTomPele,
  normalizarAparencia
} from '../avatarData';

describe('B4-FIX2 · dados do avatar personalizável', () => {
  it('oferece mais de uma opção real em cada categoria (não é decoração falsa)', () => {
    expect(TONS_PELE.length).toBeGreaterThanOrEqual(4);
    expect(ESTILOS_CABELO.length).toBeGreaterThanOrEqual(4);
    expect(CORES_CABELO.length).toBeGreaterThanOrEqual(4);
    expect(CORES_OLHOS.length).toBeGreaterThanOrEqual(4);
  });

  it('cada opção tem um id único dentro da sua categoria', () => {
    const idsUnicos = (lista: { id: string }[]) => new Set(lista.map(i => i.id)).size === lista.length;
    expect(idsUnicos(TONS_PELE)).toBe(true);
    expect(idsUnicos(ESTILOS_CABELO)).toBe(true);
    expect(idsUnicos(CORES_CABELO)).toBe(true);
    expect(idsUnicos(CORES_OLHOS)).toBe(true);
  });

  it('a aparência padrão é sempre uma combinação válida do catálogo', () => {
    expect(TONS_PELE.some(t => t.id === APARENCIA_PADRAO.tomPele)).toBe(true);
    expect(ESTILOS_CABELO.some(e => e.id === APARENCIA_PADRAO.estiloCabelo)).toBe(true);
    expect(CORES_CABELO.some(c => c.id === APARENCIA_PADRAO.corCabelo)).toBe(true);
    expect(CORES_OLHOS.some(c => c.id === APARENCIA_PADRAO.corOlhos)).toBe(true);
  });

  it('funções de cor nunca lançam e sempre devolvem um hex válido', () => {
    for (const t of TONS_PELE) {
      expect(corHexTomPele(t.id)).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
    for (const c of CORES_CABELO) {
      expect(corHexCabelo(c.id)).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
    // Cabelo grisalho não está no catálogo de criação, mas é usado no
    // envelhecimento visual (>= 65 anos) — precisa resolver mesmo assim.
    expect(corHexCabelo('grisalho')).toMatch(/^#[0-9a-fA-F]{6}$/);
    for (const c of CORES_OLHOS) {
      expect(corHexOlhos(c.id)).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  describe('normalizarAparencia — nunca deixa o dado inválido', () => {
    it('undefined/null caem na aparência padrão', () => {
      expect(normalizarAparencia(undefined)).toEqual(APARENCIA_PADRAO);
      expect(normalizarAparencia(null)).toEqual(APARENCIA_PADRAO);
    });

    it('objeto vazio (save antigo sem o campo) cai na aparência padrão', () => {
      expect(normalizarAparencia({})).toEqual(APARENCIA_PADRAO);
    });

    it('valores desconhecidos/corrompidos em cada campo caem no padrão daquele campo', () => {
      const resultado = normalizarAparencia({
        tomPele: 'roxo-neon',
        estiloCabelo: 123,
        corCabelo: null,
        corOlhos: 'ultravioleta'
      });
      expect(resultado).toEqual(APARENCIA_PADRAO);
    });

    it('uma aparência já válida é preservada exatamente', () => {
      const valida = {
        tomPele: 'negra' as const,
        estiloCabelo: 'cacheado' as const,
        corCabelo: 'ruivo' as const,
        corOlhos: 'verde' as const
      };
      // Avatar 2.0 — `barba` é campo novo e OPCIONAL. Uma aparência
      // anterior a ele continua válida e nada dela é alterado; o campo é
      // apenas completado com 'nenhuma', que é exatamente a aparência que
      // a pessoa já tinha.
      expect(normalizarAparencia(valida)).toEqual({ ...valida, barba: 'nenhuma' });
    });

    it('barba é preservada quando declarada, e vira "nenhuma" quando inválida ou ausente', () => {
      expect(normalizarAparencia({ ...APARENCIA_PADRAO, barba: 'cheia' }).barba).toBe('cheia');
      expect(normalizarAparencia({ ...APARENCIA_PADRAO, barba: 'costeleta_gigante' }).barba).toBe('nenhuma');
      expect(normalizarAparencia({}).barba).toBe('nenhuma');
    });

    it('aceita "grisalho" para corCabelo mesmo fora do catálogo de criação', () => {
      const resultado = normalizarAparencia({
        tomPele: 'clara',
        estiloCabelo: 'longo',
        corCabelo: 'grisalho',
        corOlhos: 'mel'
      });
      expect(resultado.corCabelo).toBe('grisalho');
    });
  });
});
