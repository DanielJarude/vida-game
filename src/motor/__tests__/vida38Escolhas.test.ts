/** VIDA 38 · memória de escolhas: só as entradas marcadas como escolha, em ordem de tempo. */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { escolhasDaVida } from '../../ui/v38/MemoriaDeEscolhas';

describe('memória de escolhas (VIDA 38)', () => {
  it('lista só o que foi escolha, em ordem de tempo', () => {
    const v = adulto(30, { semente: 5 });
    v.biografia = [
      { t: 24 * 12 + 3, texto: 'Você entrou na torcida.', escolha: true, relevancia: 'biografia', tema: 'escolha' } as never,
      { t: 20 * 12, texto: 'Você nasceu de novo na memória.', relevancia: 'biografia', tema: 'nascimento' } as never,
      { t: 22 * 12, texto: 'Você doou para uma vaquinha.', escolha: true, relevancia: 'biografia', tema: 'escolha' } as never,
    ];
    const lista = escolhasDaVida(v);
    expect(lista.map(e => e.texto)).toEqual(['Você doou para uma vaquinha.', 'Você entrou na torcida.']);
  });

  it('sem escolhas, a lista é vazia', () => {
    const v = adulto(10, { semente: 5 });
    v.biografia = [];
    expect(escolhasDaVida(v)).toEqual([]);
  });
});
