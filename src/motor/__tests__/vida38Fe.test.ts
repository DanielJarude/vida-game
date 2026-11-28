/** VIDA 38 · a fé e os valores com peso: tensão com a família, comunidade como apoio, valores derivados. */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { crencaDaPessoa, religiosa, tensaoDeFe, apoioDaComunidade, valoresDaVida } from '../v14/crencas/crencas';

/** Acha uma vida em que um dos pais (ou a mãe) segue uma religião: o cenário de tensão. */
function vidaComFamiliaReligiosa() {
  for (let s = 1; s <= 60; s++) {
    const v = adulto(30, { semente: s });
    const par = Object.entries(v.vinculos).find(([id, vin]) => ['pai', 'mae', 'avo'].includes(vin.parentesco ?? '') && v.pessoas[id]);
    if (!par) continue;
    const de = crencaDaPessoa(v, v.pessoas[par[0]]);
    if (religiosa(de)) return { v, de, id: par[0] };
  }
  throw new Error('nenhuma semente com família religiosa');
}

describe('a fé com peso (VIDA 38)', () => {
  it('deixar a fé da família afasta pais e avós', () => {
    const { v, de, id } = vidaComFamiliaReligiosa();
    const antes = v.vinculos[id].proximidade;
    const texto = tensaoDeFe(v, de, 'ateismo');
    expect(texto).toBeTruthy();
    expect(v.vinculos[id].proximidade).toBeLessThan(antes);
  });

  it('continuar na mesma fé não gera tensão', () => {
    const { v, de } = vidaComFamiliaReligiosa();
    expect(tensaoDeFe(v, de, de)).toBeUndefined();
  });

  it('a prática regular segura o estresse quando ele está alto', () => {
    const v = adulto(30, { semente: 5 });
    v.rotinas.push({ id: 'igreja', tInicio: v.t - 12, nivel: 1 });
    v.mente.estresse = 70;
    apoioDaComunidade(v);
    expect(v.mente.estresse).toBeLessThan(70);
  });

  it('sem prática regular, a comunidade não mexe em nada', () => {
    const v = adulto(30, { semente: 5 });
    v.mente.estresse = 70;
    apoioDaComunidade(v);
    expect(v.mente.estresse).toBe(70);
  });

  it('os valores saem do que a vida registrou: a fé sobe com a prática regular', () => {
    const v = adulto(30, { semente: 5 });
    const sem = valoresDaVida(v).fe;
    v.rotinas.push({ id: 'igreja', tInicio: v.t - 12, nivel: 1 });
    expect(valoresDaVida(v).fe).toBeGreaterThan(sem);
  });
});
