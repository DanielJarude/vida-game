/**
 * VIDA 21 · fachadas: o muro (com a grade, o portão, a cerca) é a última camada da cena — nada do jardim, das luzes do
 * caminho ou do varal (tudo atrás dele no lote) é pintado por cima; a mansão tem uma palmeira só e nenhuma na piscina.
 */
import { describe, expect, it } from 'vitest';
import { amostraDaCasa14 } from '../v14/fachadas/casas14';
import type { CenaEntrada } from '../ilustracao/casas';
import type { Peca } from '../ilustracao/nucleo';

const detalhes = (ps: Peca[], out: string[] = []): string[] => {
  for (const p of ps) {
    const d = (p as { attrs?: Record<string, string> }).attrs?.['data-detalhe'];
    if (d) out.push(d);
    const filhos = (p as { pecas?: Peca[] }).pecas;
    if (filhos) detalhes(filhos, out);
  }
  return out;
};
const FORMAS = ['casa_simples', 'casa_2q', 'familia', 'parente', 'favor', 'casa_3q', 'casa_grande', 'republica', 'kitnet', 'sitio', 'funcional', 'mansao', 'apto_1q', 'apto_2q', 'apto_3q', 'alto_padrao', 'cobertura'] as const;
const cena = (forma: string, paisagismo?: string, luz?: string) => amostraDaCasa14({ forma, acesas: 2, tijolo: false, nivel: 'boa', reforma: false, bichos: [], externo: { paisagismo, luz } } as unknown as CenaEntrada);

describe('VIDA 21 · fachadas', () => {
  it('em toda forma, com jardim tropical e luz de projeto, o muro vem depois de palmeiras, luzes e varal', () => {
    for (const f of FORMAS) {
      const ds = detalhes(cena(f, 'tropical', 'projeto').pecas);
      const muro = ds.indexOf('muro');
      if (muro < 0) continue;
      for (const k of ['palmeira', 'luz-externa', 'varal', 'piscina']) {
        const i = ds.lastIndexOf(k);
        if (i >= 0) expect(i, `${f}: ${k} depois do muro`).toBeLessThan(muro);
      }
    }
  });
  it('a mansão tropical tem uma palmeira (antes eram três: duas no mesmo lugar e uma dentro da piscina)', () => {
    expect(detalhes(cena('mansao', 'tropical').pecas).filter(d => d === 'palmeira')).toHaveLength(1);
    // Sem o paisagismo tropical, a palmeira própria da mansão continua.
    expect(detalhes(cena('mansao', 'gramado').pecas).filter(d => d === 'palmeira')).toHaveLength(1);
  });
  it('o sítio tropical continua com as duas palmeiras, a cerca é a última camada', () => {
    const ds = detalhes(cena('sitio', 'tropical').pecas);
    expect(ds.filter(d => d === 'palmeira')).toHaveLength(2);
    expect(ds.indexOf('cerca')).toBeGreaterThan(ds.lastIndexOf('palmeira'));
  });
});
