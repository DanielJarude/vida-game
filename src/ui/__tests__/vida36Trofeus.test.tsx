/** VIDA 36 · troféus: cada jogo de e-sports tem a sua forma; cada obra tem a sua; a hierarquia aparece. */
import { describe, expect, it } from 'vitest';
import { nova } from '../../motor/__tests__/ajuda';
import { itensDaGaleria, formaDoTituloEsports, formaDoPremioDeObra, SELO_DO_ALCANCE } from '../jogo/Galeria';
import type { Vida } from '../../motor/tipos';

const comTitulos = (v: Vida): Vida => {
  const temp = (jogo: string, ano: number, tipo: 'liga' | 'torneio' | 'mundial', nome: string) => ({
    ano, jogo, nivel: 5, papel: 'titular', equipe: 'Equipe X', disputas: 0, vencidas: 0, competicoes: [{ nome, tipo, colocacao: 1, participantes: 16, vitorias: 3, derrotas: 0, premio: 0, titulo: true }],
  });
  return { ...v, esports25: { temporadas: [temp('lol', 2030, 'mundial', 'Mundial de LoL'), temp('cs', 2031, 'liga', 'Liga de CS'), temp('valorant', 2032, 'torneio', 'Torneio de Valorant')] } } as unknown as Vida;
};

describe('VIDA 36 · troféus de e-sports', () => {
  it('cada jogo tem a sua forma, e as seis formas são distintas', () => {
    const formas = ['lol', 'cs', 'valorant', 'fortnite', 'r6', 'rocket'].map(formaDoTituloEsports);
    expect(new Set(formas).size).toBe(6);
    expect(formaDoTituloEsports('lol')).toBe('cristal');
    expect(formaDoTituloEsports('cs')).toBe('escudo_tatico');
  });

  it('o título mundial de LoL sai na galeria com a sua forma e hierarquia histórica', () => {
    const v = comTitulos(nova({ semente: 36 }));
    const itens = itensDaGaleria(v).filter(i => i.tipo === 'esports');
    const lol = itens.find(i => i.nome === 'Mundial de LoL');
    expect(lol?.forma).toBe('cristal');
    expect(lol?.alcance).toBe('internacional');
    expect(SELO_DO_ALCANCE[lol!.alcance!]).toBe('histórico');
    expect(itens.find(i => i.nome === 'Liga de CS')?.forma).toBe('escudo_tatico');
    expect(itens.find(i => i.nome === 'Torneio de Valorant')?.alcance).toBe('local');
    expect(itens.map(i => i.forma)).not.toContain('estatueta');
  });
});

describe('VIDA 36 · prêmios de obra têm forma própria', () => {
  it('cinema, série, teatro e curta têm silhuetas diferentes', () => {
    const formas = ['filme', 'serie', 'teatro', 'curta'].map(formaDoPremioDeObra);
    expect(new Set(formas).size).toBe(4);
    expect(formaDoPremioDeObra('cinema')).toBe('rolo');
  });
});

import { renderToStaticMarkup } from 'react-dom/server';
import { Trofeu } from '../jogo/Galeria';

describe('VIDA 36 · cada forma nova desenha a sua silhueta', () => {
  it('todas as formas novas renderizam com desenho próprio', () => {
    const novas = ['cristal', 'escudo_tatico', 'agulha', 'caixa', 'hexagono', 'carro', 'controle', 'rolo', 'televisao', 'mascaras', 'claquete'] as const;
    const marcas = new Set<string>();
    for (const f of novas) {
      const html = renderToStaticMarkup(<Trofeu forma={f} rotulo={f} />);
      expect(html).toContain(`data-forma="${f}"`);
      expect(html).toMatch(/<(path|rect|circle|polygon|ellipse)/);
      marcas.add(html.replace(/data-forma="[^"]*"|aria-label="[^"]*"/g, ''));
    }
    expect(marcas.size).toBe(novas.length);
  });
});
