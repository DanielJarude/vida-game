// @vitest-environment jsdom
/** VIDA 38 · glossário: os termos principais existem e cada um tem uma definição. */
import { describe, expect, it } from 'vitest';
import { GLOSSARIO } from '../v38/glossario';

describe('glossário do jogo (VIDA 38)', () => {
  it('cobre os nomes principais das áreas, sem repetir termos', () => {
    const termos = GLOSSARIO.map(g => g.termo);
    for (const t of ['Linha da Vida', 'Minha Semana', 'Caminhos', 'Patrimônio', 'Estresse']) expect(termos).toContain(t);
    expect(new Set(termos).size).toBe(termos.length);
  });

  it('nenhuma definição é vazia', () => {
    for (const g of GLOSSARIO) expect(g.definicao.trim().length, g.termo).toBeGreaterThan(20);
  });
});
