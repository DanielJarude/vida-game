/**
 * B4-FIX2 item 17 — renderer puro do avatar personalizável.
 *
 * Cobre: mesma "pessoa" reconhecível em todas as fases, envelhecimento
 * visual (cabelo grisalho a partir de 65) sem trocar tom de pele/olhos, e
 * ausência de qualquer efeito colateral em stats (é puramente decorativo —
 * a função nem recebe o personagem inteiro, só idade + aparência).
 */

import { describe, it, expect } from 'vitest';
import { construirEspecificacaoAvatar } from '../avatarRenderer';
import { APARENCIA_PADRAO, corHexCabelo } from '../../data/avatar/avatarData';

describe('B4-FIX2 · avatarRenderer (SVG puro)', () => {
  it('resolve uma especificação de desenho para qualquer idade sem lançar', () => {
    for (const idade of [0, 1, 5, 10, 15, 18, 30, 50, 65, 80, 100]) {
      expect(() => construirEspecificacaoAvatar(idade, APARENCIA_PADRAO)).not.toThrow();
    }
  });

  it('tom de pele e cor dos olhos permanecem os mesmos em todas as fases (é a mesma pessoa)', () => {
    const aparencia = { ...APARENCIA_PADRAO, tomPele: 'negra' as const, corOlhos: 'verde' as const };
    const especs = [0, 10, 30, 70].map(idade => construirEspecificacaoAvatar(idade, aparencia));

    const peles = new Set(especs.map(e => e.corPele));
    const olhos = new Set(especs.map(e => e.corOlhos));
    expect(peles.size).toBe(1);
    expect(olhos.size).toBe(1);
  });

  it('a partir de 65 anos o cabelo exibido vira grisalho, mesmo tendo escolhido outra cor', () => {
    const aparencia = { ...APARENCIA_PADRAO, corCabelo: 'ruivo' as const };
    const jovem = construirEspecificacaoAvatar(30, aparencia);
    const idoso = construirEspecificacaoAvatar(70, aparencia);

    expect(jovem.corCabelo).not.toBe(corHexCabelo('grisalho'));
    expect(idoso.corCabelo).toBe(corHexCabelo('grisalho'));
  });

  it('antes dos 65 o cabelo continua com a cor escolhida', () => {
    const aparencia = { ...APARENCIA_PADRAO, corCabelo: 'loiro' as const };
    const espec = construirEspecificacaoAvatar(64, aparencia);
    expect(espec.corCabelo).toBe(corHexCabelo('loiro'));
  });

  it('bebês têm escala de rosto maior que adultos (proporção reconhecível da fase)', () => {
    const bebe = construirEspecificacaoAvatar(0, APARENCIA_PADRAO);
    const adulto = construirEspecificacaoAvatar(30, APARENCIA_PADRAO);
    expect(bebe.escalaRosto).toBeGreaterThan(adulto.escalaRosto);
  });

  it('careca não tem nenhum path de cabelo desenhado', () => {
    const espec = construirEspecificacaoAvatar(30, { ...APARENCIA_PADRAO, estiloCabelo: 'careca' });
    expect(espec.cabelo.atras).toBeUndefined();
    expect(espec.cabelo.frente).toBeUndefined();
  });

  it('cada estilo de cabelo (exceto careca) desenha pelo menos um path', () => {
    const estilos = ['curto', 'medio', 'longo', 'cacheado', 'coque'] as const;
    for (const estiloCabelo of estilos) {
      const espec = construirEspecificacaoAvatar(30, { ...APARENCIA_PADRAO, estiloCabelo });
      expect(espec.cabelo.atras || espec.cabelo.frente).toBeTruthy();
    }
  });
});
