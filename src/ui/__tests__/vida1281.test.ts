/**
 * 12.8.1 — a loja da casa por categoria, os cômodos sem móvel escondido, as plantas que não se repetem, a importadora de
 * vinhos com fachada própria e a carta organizada.
 */
import { describe, expect, it } from 'vitest';
import { produtosDaCategoria } from '../../motor/sistemas/lojas';
import { categoriaDaCasa, CATEGORIAS_DA_CASA, temCategoriaDaCasa } from '../../motor/dados/categoriasDaCasa';
import { disporComodo, type Posto } from '../ilustracao/disposicao';
import { amostraDoObjeto } from '../ilustracao/objetos';
import { VARIANTES_DE_DESENHO } from '../ilustracao/objetosDaCasa';
import { amostraDaFachada, LUGARES_DA_CIDADE } from '../ilustracao/lugares';
import { VINHOS } from '../../motor/dados/colecao128';

const dispor = (tipo: string, area: number, ids: string[], luz?: string) => disporComodo(tipo, area, ids.map((c, i) => ({ coisaId: c, id: `${c}#${i}` })), luz);

describe('12.8.1 · a loja da casa por categoria', () => {
  it('todo móvel do catálogo tem a sua categoria marcada; todo eletrodoméstico fica em Eletrodomésticos', () => {
    const semLugar = produtosDaCategoria('moveis').filter(p => !temCategoriaDaCasa(p.id)).map(p => p.id);
    expect(semLugar).toEqual([]);
    for (const p of produtosDaCategoria('eletrodomesticos')) expect(categoriaDaCasa(p.id, true)).toBe('eletro');
  });
  it('nenhuma categoria de móvel fica vazia', () => {
    const usadas = new Set([...produtosDaCategoria('moveis').map(p => categoriaDaCasa(p.id, false)), 'eletro']);
    expect(CATEGORIAS_DA_CASA.filter(c => !usadas.has(c.id)).map(c => c.id)).toEqual([]);
  });
});

describe('12.8.1 · a disposição dos cômodos', () => {
  const tapa = (d: { postos: Posto[] }) => {
    const chao = d.postos.filter(p => p.montagem === 'chao');
    const out: string[] = [];
    for (const a of chao) for (const b of chao) {
      if (a === b || b.z0 < a.z1 || b.z0 - a.z1 > 1.6) continue; // b na frente de a
      const sobre = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
      if (sobre > 0.25 * Math.min(a.x1 - a.x0, b.x1 - b.x0) && (a.h > 1.3 || b.h >= a.h * 0.6)) out.push(`${b.coisaId} na frente de ${a.coisaId}`);
    }
    return out;
  };
  it('a sala e a suíte da mansão: nada encostado tapa outro (a vitrine, o closet, a mesa de cabeceira à vista)', () => {
    const sala = dispor('sala', 64, ['sofa_designer', 'mesa_centro_marmore', 'tapete_persa', 'tv_oled', 'poltrona_designer', 'mesa_lateral', 'quadros', 'plantas', 'aparador', 'objetos_decor', 'vitrine_colecao'], 'quente');
    const quarto = dispor('quarto', 38, ['cama_king', 'criado_mudo', 'closet', 'penteadeira', 'tapete', 'ar_condicionado', 'espelho_chao'], 'quente');
    for (const d of [sala, quarto]) { expect(d.fora).toEqual([]); expect(tapa(d)).toEqual([]); }
    expect(quarto.postos.filter(p => p.coisaId === 'criado_mudo')).toHaveLength(2);
  });
  it('a luz "abajur" é uma luminária de pé no chão do cômodo (na perspectiva), não no banheiro', () => {
    const d = dispor('sala', 20, ['sofa', 'mesa_centro'], 'quente');
    const l = d.postos.find(p => p.coisaId === '_abajur')!;
    expect(l.montagem).toBe('chao');
    expect(l.fixo).toBe(true);
    expect(dispor('sala', 20, ['sofa'], 'simples').postos.some(p => p.coisaId === '_abajur')).toBe(false);
    expect(dispor('banheiro', 6, ['gabinete'], 'quente').postos.some(p => p.coisaId === '_abajur')).toBe(false);
  });
  it('a TV na parede lateral não sai da cena', () => {
    const d = dispor('sala', 64, ['sofa_designer', 'tv_oled', 'poltrona_designer', 'mesa_lateral', 'aparador', 'vitrine_colecao']);
    const tv = d.postos.find(p => p.coisaId === 'tv_oled');
    if (tv?.parede === 'dir') expect(tv.z1).toBeLessThan(d.g.Dv * 0.6 + 0.01);
  });
});

describe('12.8.1 · as plantas não se repetem', () => {
  const especies = (id: string) => amostraDoObjeto(id, '#b5704a').pecas.map(p => ('marca' in p ? p.marca : undefined) ?? (p.tipo === 'grupo' ? 'grupo' : '')).join(',');
  it('os conjuntos de plantas e os vasos grandes têm várias combinações', () => {
    for (const id of ['plantas', 'vasos_grandes']) {
      const n = VARIANTES_DE_DESENHO[id];
      const desenhos = new Set(Array.from({ length: n }, (_, v) => JSON.stringify(amostraDoObjeto(`${id}#${v}`, '#b5704a').pecas)));
      expect(desenhos.size).toBe(n);
    }
    expect(especies('plantas#0')).not.toBe(especies('plantas#1'));
  });
  it('o par de vasos grandes nunca repete a mesma árvore', () => {
    for (let v = 0; v < VARIANTES_DE_DESENHO.vasos_grandes; v++) {
      const marcas = amostraDoObjeto(`vasos_grandes#${v}`, '#b5704a').pecas.map(p => ('marca' in p ? p.marca : undefined)).filter(Boolean);
      // duas copas iguais seriam duas 'copa' (a oliveira) ou duas 'hastes' (a palmeira)
      expect(marcas.filter(m => m === 'copa').length).toBeLessThan(2);
      expect(marcas.filter(m => m === 'hastes').length).toBeLessThan(2);
    }
  });
});

describe('12.8.1 · a importadora de vinhos', () => {
  it('tem fachada própria (não é mais a do antiquário)', () => {
    expect(LUGARES_DA_CIDADE).toContain('vinhos');
    const f = JSON.stringify(amostraDaFachada('vinhos'));
    expect(f).toContain('VINHOS');
    expect(f).not.toContain('ANTIQUÁRIO');
  });
  it('a carta tem tintos, brancos, rosés, espumantes e fortificados; todo vinho declara o estilo', () => {
    const daLoja = VINHOS.filter(v => v.loja === 'vinhos');
    expect(daLoja.length).toBeGreaterThanOrEqual(20);
    expect(new Set(daLoja.map(v => v.estilo))).toEqual(new Set(['tinto', 'branco', 'rose', 'espumante', 'fortificado']));
    expect(new Set(VINHOS.map(v => v.id)).size).toBe(VINHOS.length);
  });
});
