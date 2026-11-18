// @vitest-environment jsdom
/**
 * VIDA 27 · §8 — cada joia da vitrine tem o desenho dela: dois produtos diferentes (forma, metal ou pedra) nunca saem com
 * o mesmo desenho na miniatura da loja (a mesma que o provador e o corpo usam). Antes: as pérolas de ouro, prata e ouro
 * branco eram iguais; a pulseira de elos, a fina e a rígida eram o mesmo arco.
 */
import { expect, it } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { ITENS_ESTILO } from '../../motor/dados/estilo';
import { joia20 } from '../../motor/dados20/joias20';
import { MiniaturaDaPeca } from '../avatar/MiniaturaDaPeca';
import { adulto } from '../../motor/__tests__/cenarios';

it('produtos de joalheria diferentes têm desenhos diferentes na vitrine', () => {
  const v = adulto(30, { semente: 3, genero: 'feminino' });
  const lugares = new Set(['orelha', 'joia', 'anel', 'pulseira', 'tornozelo', 'alianca', 'relogio', 'pulso']);
  const itens = ITENS_ESTILO.filter(x => (x.lugar && lugares.has(x.lugar)) || x.piercing || x.categoria === 'acessorio');
  const grupos = new Map<string, { id: string; forma: string; lugar: string }[]>();
  const vazios: string[] = [];
  for (const it of itens) {
    const { container } = render(<MiniaturaDaPeca vida={v} itemId={it.id} largura={96} />);
    const svg = container.innerHTML.replace(/\d+\.\d+/g, n => String(Math.round(Number(n) * 10) / 10)).replace(/id="[^"]*"/g, '').replace(/url\(#[^)]*\)/g, '').replace(/ data-[a-z0-9-]+="[^"]*"/g, '').replace(/ aria-[a-z]+="[^"]*"/g, '').replace(/<title>[^<]*<\/title>/g, '').replace(/ class="[^"]*"/g, '');
    cleanup();
    const forma = joia20(it.id)?.forma ?? (it.piercing ? `piercing:${(it.piercing as { forma?: string }).forma ?? '?'}` : it.visual ? JSON.stringify(it.visual) : '(nenhuma)');
    const chave = `${it.lugar}|${svg}`;
    if (!svg.includes('<svg')) vazios.push(it.id);
    grupos.set(chave, [...(grupos.get(chave) ?? []), { id: it.id, forma, lugar: it.lugar ?? it.categoria }]);
  }
  const dup = [...grupos.values()].filter(l => l.length > 1);
  expect(vazios).toEqual([]);
  expect(dup.map(l => `${l[0].lugar}: ${l.map(x => `${x.id}[${x.forma}]`).join(', ')}`)).toEqual([]);
  expect(itens.length).toBeGreaterThan(200);
});
