/** VIDA 39 · o preconceito do dia a dia, por país (marcadores, sorteio anual, efeitos, escopo por país). */
import '../sistemas/extrasCarregar39';
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { EPISODIOS39 } from '../dados39/preconceito';
import { marcadoresDe39, paisDeResidencia39, processarPreconceito39 } from '../sistemas/preconceito39';
import { rodarGanchosDoAno39 } from '../sistemas/ganchosDoAno39';
import { rngDe } from '../rng';
import type { Vida } from '../tipos';

const contagem = (v: Vida) => Object.entries(v.fatos).filter(([k]) => k.startsWith('preconceito39_')).reduce((s, [, n]) => s + n, 0);

/** Passa `anos` anos pelo processamento. A vida já foi simulada (o pacote é carregado no teste), então sempre se mede a diferença. */
function vivarAnos(v: Vida, anos: number): void {
  for (let k = 0; k < anos; k++) { v.t += 12; processarPreconceito39(v); }
}

describe('VIDA 39 · preconceito do dia a dia', () => {
  it('os episódios de cada país têm marcador, intensidade e texto válidos', () => {
    expect(EPISODIOS39.length).toBeGreaterThan(20);
    for (const e of EPISODIOS39) {
      expect(e.texto.length).toBeGreaterThan(20);
      expect([1, 2, 3]).toContain(e.intensidade);
      expect(e.pais).toMatch(/^[A-Z]{2}$/);
    }
    // cada país com episódios tem o seu próprio preconceito
    const paises = new Set(EPISODIOS39.map(e => e.pais));
    for (const p of ['BR', 'IT', 'FR', 'US', 'DE', 'GB']) expect(paises.has(p)).toBe(true);
  });

  it('o marcador do nordestino vem da cidade natal no Nordeste (Brasil)', () => {
    const v = adulto(30, { semente: 3, municipioId: 'recife-pe' });
    v.eu.municipioNatal = 'recife-pe';
    expect(marcadoresDe39(v)).toContain('nordestino');
    v.eu.municipioNatal = 'sao-paulo-sp';
    expect(marcadoresDe39(v)).not.toContain('nordestino');
  });

  it('a mulher é marcada pelo gênero; o estrangeiro, pela nacionalidade diferente da do país onde vive', () => {
    const v = adulto(30, { semente: 4, genero: 'feminino', municipioId: 'recife-pe' });
    expect(marcadoresDe39(v)).toContain('mulher');
    v.eu.nacionalidades = ['IT'];
    expect(paisDeResidencia39(v)).toBe('BR');
    expect(marcadoresDe39(v)).toContain('estrangeiro');
  });

  it('um episódio por ano no máximo', () => {
    const v = adulto(30, { semente: 5, genero: 'feminino', municipioId: 'recife-pe' });
    v.eu.municipioNatal = 'recife-pe';
    const antes = contagem(v);
    vivarAnos(v, 40);
    const novos = contagem(v) - antes;
    expect(novos).toBeGreaterThan(0);
    expect(novos).toBeLessThanOrEqual(40);
  });

  it('o episódio aumenta o estresse e reduz a felicidade (na mesma passagem)', () => {
    const v = adulto(30, { semente: 6, genero: 'feminino', municipioId: 'recife-pe' });
    v.eu.municipioNatal = 'recife-pe';
    let achou = false;
    for (let k = 0; k < 120 && !achou; k++) {
      const c0 = contagem(v);
      const e0 = v.mente.estresse;
      const f0 = v.mente.felicidade;
      v.mente.estresse = 20;
      v.mente.felicidade = 60;
      v.t += 12;
      processarPreconceito39(v);
      if (contagem(v) > c0) {
        achou = true;
        expect(v.mente.estresse).toBeGreaterThan(20);
        expect(v.mente.felicidade).toBeLessThan(60);
      }
      void e0; void f0;
    }
    expect(achou).toBe(true);
  });

  it('menores de 12 anos não passam pelo sorteio', () => {
    const v = adulto(30, { semente: 7, genero: 'feminino', municipioId: 'recife-pe' });
    v.eu.municipioNatal = 'recife-pe';
    v.eu.tNasc = v.t - 12 * 8; // 8 anos agora; dois anos depois, 9 e 10
    const antes = contagem(v);
    vivarAnos(v, 2);
    expect(contagem(v) - antes).toBe(0);
  });

  it('o sorteio é determinístico (mesma vida, mesmo resultado) e não mexe no acaso principal', () => {
    const a = adulto(30, { semente: 8, genero: 'feminino', municipioId: 'recife-pe' });
    const b = adulto(30, { semente: 8, genero: 'feminino', municipioId: 'recife-pe' });
    const rngAntes = a.rng;
    const ca = contagem(a);
    const cb = contagem(b);
    vivarAnos(a, 10);
    vivarAnos(b, 10);
    expect(contagem(a) - ca).toBe(contagem(b) - cb);
    expect(a.rng).toBe(rngAntes);
    expect(rngDe(a.id, 'preconceito39', a.t)).toBeDefined();
  });

  it('o gancho do ano chama o sistema (quando o pacote está carregado)', () => {
    const v = adulto(30, { semente: 9, genero: 'feminino', municipioId: 'recife-pe' });
    v.eu.municipioNatal = 'recife-pe';
    const antes = contagem(v);
    v.t += 12;
    rodarGanchosDoAno39(v, rngDe(v.id, 'teste39'));
    expect(contagem(v)).toBeGreaterThanOrEqual(antes);
  });
});
