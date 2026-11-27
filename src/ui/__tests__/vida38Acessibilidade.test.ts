// @vitest-environment jsdom
/** VIDA 38 · acessibilidade: as preferências viram classes na raiz, guardadas por navegador, e um valor corrompido não quebra. */
import { describe, expect, it, beforeEach } from 'vitest';
import { aplicarPreferencias, guardarPreferencias, lerPreferencias } from '../v38/acessibilidade';

describe('preferências de acessibilidade (VIDA 38)', () => {
  beforeEach(() => { window.localStorage.clear(); document.documentElement.className = ''; });

  it('o padrão é tudo desligado', () => {
    expect(lerPreferencias()).toEqual({ textoMaior: false, altoContraste: false, semAnimacao: false });
  });

  it('guardar aplica a classe na raiz e lê de volta', () => {
    guardarPreferencias({ textoMaior: true, altoContraste: false, semAnimacao: true });
    expect(document.documentElement.classList.contains('acess--texto-maior')).toBe(true);
    expect(document.documentElement.classList.contains('acess--alto-contraste')).toBe(false);
    expect(document.documentElement.classList.contains('acess--sem-animacao')).toBe(true);
    expect(lerPreferencias().semAnimacao).toBe(true);
  });

  it('um valor corrompido no armazenamento volta ao padrão, sem erro', () => {
    window.localStorage.setItem('vida.acessibilidade.v1', '{não é json');
    expect(lerPreferencias().textoMaior).toBe(false);
  });

  it('aplicar de novo desliga o que estava ligado', () => {
    aplicarPreferencias({ textoMaior: true, altoContraste: true, semAnimacao: true });
    aplicarPreferencias({ textoMaior: false, altoContraste: false, semAnimacao: false });
    expect(document.documentElement.className).toBe('');
  });
});
