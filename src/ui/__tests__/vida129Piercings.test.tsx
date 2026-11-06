// @vitest-environment jsdom
/** VIDA 12.9 — os piercings aparecem no retrato (rosto e orelha) e na figura (umbigo); criança não. */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { Retrato } from '../avatar/Retrato';
import { Figura } from '../avatar/Figura';
import type { Visual } from '../../motor/tipos';

afterEach(cleanup);
const vis = { pele: 'media', cabelo: 'curto', corCabelo: 'castanho', olhos: 'castanhos' } as Visual;

describe('12.9 · piercings no desenho', () => {
  it('cada furo no retrato, nos gêneros e idades adultas', () => {
    for (const [g, i] of [['masculino', 30], ['feminino', 22], ['nao_binario', 70]] as const) {
      const { container, unmount } = render(<Retrato visual={{ ...vis, piercings: ['pc_nariz_ponto_aco', 'pc_septo_ferradura', 'pc_sobrancelha_barra', 'pc_labio_labret', 'pc_helix_trio', 'pc_tragus_ponto'] }} genero={g} idade={i} semente="x" tamanho={120} rotulo="r" />);
      for (const r of ['nariz', 'septo', 'sobrancelha', 'labio', 'helix', 'tragus']) expect(container.querySelector(`[data-piercing="${r}"]`), `${g} ${r}`).toBeTruthy();
      unmount();
    }
  });
  it('criança não aparece com piercing (nem que o visual tenha)', () => {
    const { container } = render(<Retrato visual={{ ...vis, piercings: ['pc_nariz_ponto_aco'] }} genero="feminino" idade={6} semente="x" tamanho={120} rotulo="r" />);
    expect(container.querySelector('[data-piercing]')).toBeNull();
  });
  it('umbigo: com o tronco à mostra aparece; com camiseta, não', () => {
    const a = render(<Figura visual={{ ...vis, piercings: ['pc_umbigo_barra'] }} genero="feminino" idade={25} corpo="mediano" pecas={[]} semCima />);
    expect(a.container.querySelector('[data-piercing="umbigo"]')).toBeTruthy();
    a.unmount();
    const b = render(<Figura visual={{ ...vis, piercings: ['pc_umbigo_barra'] }} genero="feminino" idade={25} corpo="mediano" pecas={[]} />);
    expect(b.container.querySelector('[data-piercing="umbigo"]')).toBeNull();
  });
});
