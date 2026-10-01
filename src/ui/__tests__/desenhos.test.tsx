// @vitest-environment jsdom
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { DesenhoVeiculo } from '../jogo/material/Desenhos';
import { Retrato } from '../avatar/Retrato';
import { ANIMAIS } from '../../motor/dados/animais';
import { formaDaVersao, NOME_FORMA, VERSOES_VEICULO, type FormaVeiculo } from '../../motor/dados/bens';

afterEach(cleanup);

/** A "assinatura" do desenho: todos os traços, na ordem. */
function traco(el: ReactElement): string {
  const { container } = render(el);
  const d = [...container.querySelectorAll('path, circle, ellipse, rect')].map(x => `${x.tagName}:${x.getAttribute('d') ?? ''}${x.getAttribute('cx') ?? ''},${x.getAttribute('cy') ?? ''},${x.getAttribute('r') ?? x.getAttribute('rx') ?? ''},${x.getAttribute('fill') ?? ''}`).join('|');
  cleanup();
  return d;
}

describe('veículos: famílias de desenho', () => {
  it('cada forma do catálogo tem um desenho próprio (sedã ≠ SUV ≠ hatch; scooter ≠ esportiva ≠ trilha ≠ bicicleta)', () => {
    const formas = Object.keys(NOME_FORMA) as FormaVeiculo[];
    const tracos = formas.map(f => traco(<DesenhoVeiculo forma={f} />));
    expect(tracos.every(t => t.length > 0)).toBe(true);
    expect(new Set(tracos).size).toBe(formas.length);
  });

  it('carros: a altura do teto separa o sedã do SUV, e o SUV de sete lugares tem mais janelas', () => {
    const vidros = (f: FormaVeiculo) => { const { container } = render(<DesenhoVeiculo forma={f} />); const n = [...container.querySelectorAll('path[fill-opacity="0.5"]')].length; cleanup(); return n; };
    expect(vidros('suv_grande')).toBeGreaterThan(vidros('seda'));
    expect(vidros('suv_medio')).toBeGreaterThan(vidros('suv'));
  });

  it('a semente (o modelo) varia as proporções: dois sedãs não saem idênticos, e a mesma semente repete', () => {
    expect(traco(<DesenhoVeiculo forma="seda" semente="honda_city" />)).not.toBe(traco(<DesenhoVeiculo forma="seda" semente="toyota_corolla" />));
    expect(traco(<DesenhoVeiculo forma="seda" semente="honda_city" />)).toBe(traco(<DesenhoVeiculo forma="seda" semente="honda_city" />));
  });

  it('o catálogo usa as famílias novas: motoneta, SUV médio, SUV de sete lugares', () => {
    const f = (id: string) => formaDaVersao(VERSOES_VEICULO.find(x => x.id === id));
    expect(f('honda_biz')).toBe('cub');
    expect(f('honda_pcx')).toBe('scooter');
    expect(f('jeep_compass')).toBe('suv_medio');
    expect(f('toyota_sw4')).toBe('suv_grande');
    expect(f('vw_nivus')).toBe('suv');
  });

  it('com rótulo, o desenho é uma imagem acessível', () => {
    const { getByRole } = render(<DesenhoVeiculo forma="trail" rotulo="moto de trilha" />);
    expect(getByRole('img', { name: 'moto de trilha' }).getAttribute('data-forma')).toBe('trail');
  });
});

describe('bichos: cada espécie com o seu retrato', () => {
  it('toda espécie do catálogo desenha, com o rótulo e a espécie', () => {
    for (const a of ANIMAIS) {
      const { container } = render(<Retrato genero="masculino" idade={2} especie={a.id} semente={`s-${a.id}`} rotulo={a.nome[0]} />);
      const svg = container.querySelector('svg.retrato--pet')!;
      expect(svg.getAttribute('aria-label')).toBe(a.nome[0]);
      expect(svg.getAttribute('data-especie')).toBe(a.id);
      expect(svg.querySelectorAll('path, circle, ellipse, rect').length).toBeGreaterThan(5);
      cleanup();
    }
  });

  it('espécies diferentes não dividem o desenho (hamster ≠ porquinho ≠ chinchila ≠ coelho)', () => {
    const tracos = ANIMAIS.map(a => traco(<Retrato genero="masculino" idade={2} especie={a.id} semente="mesma" />));
    expect(new Set(tracos).size).toBe(ANIMAIS.length);
    const pequenos = ['hamster', 'porquinho', 'chinchila', 'coelho'].map(e => traco(<Retrato genero="masculino" idade={2} especie={e as never} semente="x" />));
    expect(new Set(pequenos).size).toBe(4);
  });
});
