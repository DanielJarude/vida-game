/**
 * VIDA 38 · bloco 2 — o desenho do jardim muda conforme o cuidado: florido, cuidado, comum e descuidado aparecem
 * como marcas diferentes na cena da casa.
 */
import { describe, expect, it } from 'vitest';
import { amostraDaCasa, type CenaEntrada, type LadoDeFora } from '../ilustracao/casas';

const base = (externo: LadoDeFora | undefined): CenaEntrada => ({
  forma: 'casa_3q' as CenaEntrada['forma'], acesas: 1, tijolo: false, nivel: 'boa', reforma: false, bichos: [], externo,
});
const marcas = (e: LadoDeFora | undefined) => JSON.stringify(amostraDaCasa(base(e)).pecas);

describe('o jardim aparece no desenho conforme o cuidado (VIDA 38 · bloco 2)', () => {
  it('florido põe flores rosas e amarelas na frente da casa', () => {
    const s = marcas({ paisagismo: 'tropical', estadoJardim: 'florido' });
    expect(s).toContain('flores-rosas');
    expect(s).toContain('flores-amarelas');
  });

  it('cuidado põe arbustos aparados, mas não flores', () => {
    const s = marcas({ estadoJardim: 'cuidado' });
    expect(s).not.toContain('flores-rosas');
    expect(s).toContain('"marca":"grama"');
  });

  it('descuidado põe mato e grama seca, sem flores', () => {
    const s = marcas({ estadoJardim: 'descuidado' });
    expect(s).toContain('"marca":"mato"');
    expect(s).toContain('grama-seca');
    expect(s).not.toContain('flores-rosas');
  });

  it('comum, sem estado, não acrescenta nada do jardim', () => {
    const s = marcas({ estadoJardim: 'comum' });
    expect(s).not.toContain('mato');
    expect(s).not.toContain('flores-rosas');
  });
});
