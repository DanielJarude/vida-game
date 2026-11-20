/** VIDA 29 · o jogo na família: degraus proporcionais (notar, o dinheiro das contas, o ultimato), nunca castigo de quem joga pouco. */
import { describe, expect, it } from 'vitest';
import { adulto, comParceiro } from './cenarios';
import { processarApostas } from '../sistemas/apostas';
import { POSSIBILIDADES } from '../conteudo/possibilidades';
import { parceiro } from '../nucleo';
import type { Vida } from '../tipos';

/** Uma vida de 40 anos casada, morando junto. */
const com = (perdeu: number, f?: (v: Vida) => void) => {
  const v = structuredClone(adulto(40, { semente: 11 }));
  comParceiro(v, { estagio: 'casamento', anos: 8 });
  v.financas.conta = 50_000;
  v.financas.dividas = [];
  v.apostas = { ultimas: [], ano: { t: v.t, apostado: perdeu + 100, recebido: 100 }, total: { apostado: perdeu + 100, recebido: 100 } };
  f?.(v);
  return v;
};

describe('VIDA 29 · consequências proporcionais das apostas', () => {
  it('quem joga pouco não vira assunto nenhum', () => {
    const v = com(200);
    processarApostas(v);
    expect(v.fatos['apo_notou29']).toBeUndefined();
    expect(v.fatos['apo_contas29']).toBeUndefined();
    expect(v.fatos['apo_ultimato29']).toBeUndefined();
  });

  it('perder um pedaço que se nota: alguém de casa repara (uma vez)', () => {
    const v = com(1_000_000);
    processarApostas(v);
    expect(v.fatos['apo_notou29']).toBe(v.t);
  });

  it('o dinheiro das contas (conta no vermelho no ano de perda): a casa sente e o acontecimento abre', () => {
    const v = com(1_000_000, x => { x.financas.conta = -2000; });
    processarApostas(v);
    expect(v.fatos['apo_contas29']).toBe(v.t);
    expect(POSSIBILIDADES.find(p => p.id === 'apo_contas29')).toBeTruthy();
  });

  it('três anos pesados: o ultimato; os três acontecimentos têm escolhas que mudam coisas diferentes', () => {
    const v = com(1_000_000, x => { x.apostas!.anosPesados = 2; });
    processarApostas(v);
    expect(parceiro(v)).toBeTruthy();
    expect(v.fatos['apo_ultimato29']).toBe(v.t);
    for (const id of ['apo_notou29', 'apo_contas29', 'apo_ultimato29']) {
      const c = POSSIBILIDADES.find(p => p.id === id)!;
      expect((c as unknown as { opcoes: unknown[] }).opcoes.length).toBeGreaterThanOrEqual(2);
    }
  });
});
