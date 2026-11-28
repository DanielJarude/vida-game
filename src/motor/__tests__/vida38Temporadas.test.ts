/** VIDA 38 · temporadas por rodada (outras modalidades e e-sports): turno e returno, tabela coerente, determinismo. */
import { describe, expect, it } from 'vitest';
import { jogarTemporada38 } from '../sistemas/temporadas38';

const nomes = ['Alfa', 'Beta', 'Gama', 'Delta', 'Épsilon', 'Zeta'];
const forca = (c: string) => 50 + nomes.indexOf(c) * 3;

describe('temporadas por rodada (VIDA 38)', () => {
  it('turno e returno: cada par joga duas vezes, e a tabela soma todas as partidas', () => {
    const { tabela, partidas } = jogarTemporada38('v1', 'br', 2030, 'pontos_corridos', nomes, forca);
    expect(partidas.length).toBe(nomes.length * (nomes.length - 1));
    expect(tabela.every(l => l.j === 2 * (nomes.length - 1))).toBe(true);
    expect(tabela.reduce((s, l) => s + l.v, 0)).toBe(tabela.reduce((s, l) => s + l.d, 0));
    expect(tabela.reduce((s, l) => s + l.saldo, 0)).toBe(0);
  });

  it('a tabela está ordenada por pontos', () => {
    const { tabela } = jogarTemporada38('v1', 'br', 2030, 'pontos_corridos', nomes, forca);
    for (let k = 1; k < tabela.length; k++) expect(tabela[k - 1].pts).toBeGreaterThanOrEqual(tabela[k].pts);
  });

  it('os e-sports jogam séries melhor de três: placar 2 a 0 ou 2 a 1', () => {
    const { partidas } = jogarTemporada38('v1', 'br', 2030, 'serie', nomes, forca);
    for (const p of partidas) {
      const max = Math.max(...p.placar), min = Math.min(...p.placar);
      expect(max).toBe(2);
      expect(min === 0 || min === 1).toBe(true);
    }
  });

  it('a mesma temporada relida dá o mesmo resultado', () => {
    const a = jogarTemporada38('v1', 'br', 2030, 'pontos_corridos', nomes, forca);
    const b = jogarTemporada38('v1', 'br', 2030, 'pontos_corridos', nomes, forca);
    expect(b.tabela).toEqual(a.tabela);
  });

  it('um time mais forte tende a ficar em cima (em muitas temporadas)', () => {
    let acima = 0;
    for (let s = 1; s <= 40; s++) {
      const { tabela } = jogarTemporada38('v' + s, 'br', 2030, 'pontos_corridos', nomes, forca);
      const pos = tabela.findIndex(l => l.clube === 'Zeta');
      if (pos < nomes.length / 2) acima++;
    }
    expect(acima).toBeGreaterThan(20);
  });
});
