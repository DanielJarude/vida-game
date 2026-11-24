/** VIDA 36 · troféus: cada jogo de e-sports tem a sua forma; cada obra tem a sua; a hierarquia aparece. */
import { describe, expect, it } from 'vitest';
import { nova } from '../../motor/__tests__/ajuda';
import { itensDaGaleria, formaDoTituloEsports, formaDoPremioDeObra, formaDoPremioDeArea, formaDoTrofeu, SELO_DO_ALCANCE } from '../jogo/Galeria';
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
    const novas = ['cristal', 'escudo_tatico', 'agulha', 'caixa', 'hexagono', 'carro', 'controle', 'rolo', 'televisao', 'mascaras', 'claquete', 'cesta', 'rede', 'raquete', 'tocha', 'onda', 'cinturao', 'cruz', 'livro', 'atomo', 'obelisco', 'balanca', 'seta', 'pena', 'paleta', 'laurea'] as const;
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

describe('VIDA 36 · esportes tradicionais e honras de outras carreiras', () => {
  it('cada modalidade tradicional tem a sua forma, e o futebol segue com liga', () => {
    const f = (m: string) => formaDoTrofeu({ tipo: 'titulo', competicao: 'x', competicaoId: 'liga:BR:4', modalidade: m });
    const formas = ['basquete', 'volei', 'tenis', 'atletismo', 'natacao', 'lutas'].map(f);
    expect(new Set(formas).size).toBe(6);
    expect(f('basquete')).toBe('cesta');
    expect(f('futebol')).toBe('liga');
  });

  it('cada área tem a sua forma de honra', () => {
    const formas = ['saude', 'educacao', 'tecnologia', 'engenharia', 'juridico', 'financas', 'comunicacao', 'criativo'].map(formaDoPremioDeArea);
    expect(new Set(formas).size).toBe(8);
    expect(formaDoPremioDeArea('saude')).toBe('cruz');
    expect(formaDoPremioDeArea(undefined)).toBe('medalha');
  });

  it('as honras (área registrada) e o prêmio acadêmico aparecem na galeria, no grupo da carreira', () => {
    const v = nova({ semente: 37 });
    const com = { ...v,
      conquistas14: { reconhecimentos: [{ t: v.t, tipo: 'premio', texto: 'Destaque do ano da associação de enfermagem', peso: 2, area: 'saude' }] },
      caminhos: { ...v.caminhos, academia: { ...(v.caminhos.academia ?? { projetos: 0, orientacoes: 0, orientandos: [], publicacoes: 0, colaboracoes: 0, financiamentos: 0, ultimas: {} }), producao: [{ t: v.t, tipo: 'premio', titulo: 'Prêmio de pesquisa da sociedade científica', detalhe: 'lab', impacto: 3 }] } },
    } as unknown as Vida;
    const itens = itensDaGaleria(com).filter(i => i.tipo === 'carreira');
    expect(itens.find(i => i.nome.startsWith('Destaque'))?.forma).toBe('cruz');
    expect(itens.find(i => i.nome.startsWith('Prêmio de pesquisa'))?.forma).toBe('laurea');
  });
});

import { siglaDe } from '../jogo/Galeria';

describe('VIDA 36 · identidade por competição', () => {
  it('a sigla vem das palavras que importam ("Mundial de LoL" → ML)', () => {
    expect(siglaDe('Mundial de LoL')).toBe('ML');
    expect(siglaDe('Liga de CS')).toBe('LC');
    expect(siglaDe('Torneio do Atlântico')).toBe('TA');
  });

  it('cada jogo tem a sua cor, e o mesmo título sai sempre com a mesma marca', () => {
    const v = comTitulos(nova({ semente: 38 }));
    const a = itensDaGaleria(v).filter(i => i.tipo === 'esports');
    const cores = new Set(a.map(i => i.marca?.cor));
    expect(cores.size).toBe(3);
    const de = (n: string) => a.find(i => i.nome === n)?.marca;
    expect(de('Mundial de LoL')).toEqual(itensDaGaleria(comTitulos(nova({ semente: 38 }))).find(i => i.nome === 'Mundial de LoL')?.marca);
    expect(de('Mundial de LoL')?.sigla).toBe('ML');
  });

  it('a marca aparece no desenho do troféu (faixa da cor e a sigla gravada)', () => {
    const html = renderToStaticMarkup(<Trofeu forma="cristal" rotulo="x" marca={{ cor: '#b8862b', sigla: 'ML' }} />);
    expect(html).toContain('data-cor="#b8862b"');
    expect(html).toContain('>ML<');
  });
});
