/** VIDA 38 · legado da ajuda: só o que a vida registrou; sem registro, nada aparece. */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { fazerLegadoDaAjuda } from '../../ui/v38/legadoAjuda';

describe('legado da ajuda (VIDA 38)', () => {
  it('sem ajuda nem escolhas, não há linhas de legado', () => {
    const v = adulto(60, { semente: 9 });
    v.biografia = [];
    expect(fazerLegadoDaAjuda(v)).toEqual([]);
  });

  it('doações e voluntariado aparecem com o que foi registrado', () => {
    const v = adulto(60, { semente: 9 });
    v.fatos['ajudar:total'] = 600;
    v.fatos['ajudar:voluntario'] = 12;
    const linhas = fazerLegadoDaAjuda(v);
    expect(linhas.some(l => l.startsWith('Doou'))).toBe(true);
    expect(linhas.some(l => l.includes('voluntário'))).toBe(true);
  });
});
