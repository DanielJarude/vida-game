/**
 * VIDA 13 — o catálogo de tatuagens cresce de novo: cultura pop (as obras que faltavam), os estilos independentes e os
 * temas novos (criaturas e mitos, céu e espaço). Ids únicos, arte própria e distinta (também em preto: mesma forma com
 * outra cor não conta), tamanhos que cabem no corpo, filtros e busca do estúdio, e os saves antigos iguais.
 */
import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { adulto } from './cenarios';
import { transacao } from '../nucleo';
import { disponibilidade, executar } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { interpretar } from '../save';
import { DESENHOS, NOME_ESTILO, regioesDoDesenho, desenhoDeTatuagem, REGIOES_SIMPLES } from '../dados/tatuagens';
import { DESENHOS_129, NOME_TEMA, temaDoDesenho } from '../dados/tatuagens129';
import { DESENHOS_13, MIDIA_DA_OBRA, NOME_MIDIA } from '../dados/tatuagens13';
import { normalizarTatuagens, tatuagensDe, tatuagensNaFigura } from '../sistemas/tatuagens';
import { desenho13 } from '../../ui/avatar/tatuagens13';
import { DesenhoDaTatuagem, caixaNativa } from '../../ui/avatar/tatuagens';
import { desenhosDoFiltro, OBRAS_POR_MIDIA } from '../../ui/jogo/Tatuagens';
import type { Acao } from '../acoes';
import type { Vida } from '../tipos';

const rica = (i = 30): Vida => transacao(adulto(i, { semente: 1300, municipioId: 'sao-paulo-sp' }), x => { x.financas.conta = 5_000_000; x.momento = null; }).vida;
const fazer = (v: Vida, a: Acao) => { const d = disponibilidade(v, a); expect(podeTentar(d), d.motivo).toBe(true); return executar(v, a).vida; };
/** O catálogo da 12.9.1 (publicada): 251 desenhos soltos e 5 peças inteiras. */
const CATALOGO_ANTES = 256;
const NOVOS = new Set(DESENHOS_13.map(d => d.id));
const arte = (id: string, cor: (c: string) => string = c => c) => {
  const d = desenhoDeTatuagem(id)!; const [W, H] = caixaNativa(d);
  return renderToStaticMarkup(createElement('svg', { viewBox: `0 0 ${W} ${H}` }, createElement(DesenhoDaTatuagem, { id, tinta: '#111', cor })));
};
const FALLBACK = (W: number, H: number) => renderToStaticMarkup(createElement('svg', { viewBox: `0 0 ${W} ${H}` }, createElement('circle', { cx: W / 2, cy: H / 2, r: Math.min(W, H) * 0.2, fill: 'none', stroke: '#111', strokeWidth: 0.8 })));

describe('VIDA 13 · catálogo de tatuagens', () => {
  it('mais de 150 desenhos novos; ids e nomes únicos no catálogo inteiro; o de antes continua todo lá', () => {
    expect(DESENHOS_13.length).toBeGreaterThanOrEqual(150);
    expect(DESENHOS.length).toBe(CATALOGO_ANTES + DESENHOS_13.length);
    expect(DESENHOS.filter(d => !NOVOS.has(d.id))).toHaveLength(CATALOGO_ANTES);
    const ids = DESENHOS.map(d => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    const nomes = DESENHOS.map(d => d.nome.toLowerCase());
    expect(new Set(nomes).size).toBe(nomes.length);
    for (const d of DESENHOS_13) expect(desenhoDeTatuagem(d.id)).toBe(d);
    // A ordem de sempre não muda (o catálogo novo vem no fim).
    expect(DESENHOS.slice(CATALOGO_ANTES - DESENHOS_129.length, CATALOGO_ANTES)).toEqual(DESENHOS_129);
  });

  it('todo desenho novo tem arte própria, e distinta de todos os outros — também só em preto (cor trocada não conta)', () => {
    for (const d of DESENHOS_13) {
      const [W, H] = caixaNativa(d);
      expect(desenho13(d.id, { tinta: '#111', cor: c => c, traco: 1, W, H }), d.id).toBeDefined();
      const svg = arte(d.id);
      expect(svg, d.id).not.toBe(FALLBACK(W, H));
      expect(svg.length, d.id).toBeGreaterThan(200);
      // Caminho SVG sem lixo (o navegador recusa `d` com chave, NaN ou undefined e o traço some).
      for (const m of svg.matchAll(/ d="([^"]*)"/g)) expect(m[1], d.id).toMatch(/^[MmLlHhVvCcSsQqTtAaZz0-9.,\s-]+$/);
      expect(svg, d.id).not.toMatch(/NaN|undefined|Infinity/);
    }
    expect(desenho13('nao_existe', { tinta: '#111', cor: c => c, traco: 1, W: 20, H: 20 })).toBeUndefined();
    const todos = DESENHOS.filter(d => d.tamanho !== 4).map(d => d.id);
    const colorido = todos.map(id => arte(id));
    expect(new Set(colorido).size).toBe(colorido.length);
    const preto = todos.map(id => arte(id, () => '#111'));
    expect(new Set(preto).size).toBe(preto.length);
  });

  it('cada tamanho oferecido cabe em algum lugar do corpo; o pequeno cabe em regiões pequenas', () => {
    for (const d of DESENHOS_13) {
      expect(NOME_ESTILO[d.estilo], d.id).toBeTruthy();
      expect(d.tamanhos, d.id).toContain(d.tamanho);
      expect(d.tamanhos.includes(4), d.id).toBe(false);
      for (const t of d.tamanhos) expect(regioesDoDesenho(d, t).length, `${d.id} ${t}`).toBeGreaterThan(0);
      if (d.tamanhos.includes(1)) expect(regioesDoDesenho(d, 1).some(r => ['pulso', 'mao', 'tornozelo', 'pescoco', 'nuca', 'pe', 'dedos', 'ombro', 'joelho'].includes(r)), d.id).toBe(true);
      expect(d.descricao.length, d.id).toBeGreaterThan(15);
      if (d.estilo === 'cultura_pop') { expect(d.referencia, d.id).toBeTruthy(); expect(MIDIA_DA_OBRA[d.referencia!], d.referencia).toBeTruthy(); }
      else expect(d.referencia, d.id).toBeUndefined();
    }
    for (const r of REGIOES_SIMPLES) expect(DESENHOS_13.some(d => d.tamanhos.some(t => regioesDoDesenho(d, t).includes(r))), r).toBe(true);
  });

  it('cobre as obras pedidas (videogames, livros, séries, filmes, animações) e as categorias independentes', () => {
    const obras = new Set(DESENHOS.map(d => d.referencia).filter(Boolean));
    for (const o of ['GTA', 'The Last of Us', 'God of War', 'Red Dead Redemption', 'Dark Souls', 'Elden Ring', 'Bloodborne', 'Minecraft', 'Pokémon', 'Resident Evil',
      "Assassin's Creed", 'The Witcher', 'Cyberpunk 2077', 'Super Mario', 'The Legend of Zelda', 'Sonic', 'Harry Potter', 'Percy Jackson', 'Duna', 'O Senhor dos Anéis',
      'Jogos Vorazes', 'Sherlock Holmes', 'Breaking Bad', 'Game of Thrones', 'The Walking Dead', 'Stranger Things', 'Peaky Blinders', 'The Office', 'Vikings', 'Friends',
      'Star Wars', 'Matrix', 'Jurassic Park', 'Piratas do Caribe', 'Marvel', 'DC', 'De Volta para o Futuro', 'Naruto', 'Dragon Ball', 'One Piece', 'Attack on Titan',
      'Death Note', 'Studio Ghibli', 'Os Simpsons', 'Rick and Morty', 'Avatar: A Lenda de Aang']) expect(obras.has(o), o).toBe(true);
    // Toda obra do catálogo tem tipo (o seletor agrupa por ele).
    for (const o of obras) expect(MIDIA_DA_OBRA[o!], o).toBeTruthy();
    const n = (f: (d: (typeof DESENHOS_13)[number]) => boolean) => DESENHOS_13.filter(f).length;
    expect(n(d => d.estilo === 'cultura_pop')).toBeGreaterThanOrEqual(80);
    for (const e of ['geometrica', 'abstrata', 'minimalista', 'ornamental', 'surrealista', 'conceitual', 'blackwork', 'tradicional', 'oriental', 'fine_line', 'tribal', 'realista'] as const)
      expect(n(d => d.estilo === e && !d.tema), e).toBeGreaterThanOrEqual(4);
    expect(n(d => d.tema === 'animais')).toBeGreaterThanOrEqual(10);
    expect(n(d => d.tema === 'natureza')).toBeGreaterThanOrEqual(8);
    expect(n(d => d.tema === 'criaturas')).toBeGreaterThanOrEqual(6);
    expect(n(d => d.tema === 'cosmos')).toBeGreaterThanOrEqual(5);
  });

  it('o filtro e a busca do estúdio: estilo, tema, obra (agrupada por tipo, com contagem) e várias palavras sem acento', () => {
    expect(desenhosDoFiltro({ estilo: 'cultura_pop' }).length).toBe(DESENHOS.filter(d => d.estilo === 'cultura_pop').length);
    expect(desenhosDoFiltro({ referencia: 'Duna' }).map(d => d.id).sort()).toEqual(['duas_luas_no_deserto', 'verme_da_areia']);
    expect(desenhosDoFiltro({ busca: 'witcher' }).map(d => d.id).sort()).toEqual(['duas_espadas', 'medalhao_de_lobo']);
    // Pela obra, pelo tipo de obra, pelo tema e pela palavra — e todas as palavras precisam bater.
    const games = desenhosDoFiltro({ busca: 'videogames' });
    expect(games.length).toBeGreaterThan(30);
    expect(games.every(d => MIDIA_DA_OBRA[d.referencia ?? ''] === 'games')).toBe(true);
    expect(desenhosDoFiltro({ busca: 'videogames espada' }).map(d => d.id)).toContain('espada_no_pedestal');
    expect(desenhosDoFiltro({ busca: 'CRIATURAS dragao' }).map(d => d.id)).toContain('olho_de_dragao');
    expect(desenhosDoFiltro({ busca: 'lobo guara' }).map(d => d.id)).toContain('lobo_guara');
    expect(desenhosDoFiltro({ busca: 'xyzw' })).toHaveLength(0);
    for (const t of Object.keys(NOME_TEMA) as (keyof typeof NOME_TEMA)[]) {
      const xs = desenhosDoFiltro({ tema: t });
      expect(xs.length, t).toBeGreaterThan(4);
      expect(xs.every(d => temaDoDesenho(d) === t)).toBe(true);
    }
    // O seletor de obra: todas as obras, agrupadas, com a contagem certa.
    expect(OBRAS_POR_MIDIA.map(g => g.midia)).toEqual(Object.keys(NOME_MIDIA));
    const somadas = OBRAS_POR_MIDIA.flatMap(g => g.obras);
    expect(somadas.reduce((a, o) => a + o.n, 0)).toBe(DESENHOS.filter(d => d.referencia).length);
    expect(somadas.find(o => o.obra === 'GTA')!.n).toBe(3);
    expect(desenhosDoFiltro({}).some(d => d.tamanho === 4)).toBe(false);
  });

  it('tatuar desenhos novos (pequeno e grande, várias regiões) funciona e vai para o save', () => {
    let v = rica();
    v = fazer(v, { tipo: 'tatuar', desenho: 'vegvisir', regiao: 'pulso', lado: 'e', tamanho: 1 });
    v = fazer(v, { tipo: 'tatuar', desenho: 'verme_da_areia', regiao: 'costas_alta', tamanho: 3 });
    v = fazer(v, { tipo: 'tatuar', desenho: 'capivara', regiao: 'panturrilha', lado: 'd', tamanho: 3, cor: 'colorida' });
    v = fazer(v, { tipo: 'tatuar', desenho: 'faixa_de_triangulos', regiao: 'antebraco', lado: 'd', tamanho: 2 });
    v = fazer(v, { tipo: 'tatuar', desenho: 'lamina_oculta', regiao: 'antebraco', lado: 'e', tamanho: 2, ajuste: { x: 0, y: 0, escala: 1, rot: 90 } });
    expect(tatuagensDe(v)).toHaveLength(5);
    expect(tatuagensNaFigura(v)).toHaveLength(5);
    expect(disponibilidade(v, { tipo: 'tatuar', desenho: 'verme_da_areia', regiao: 'dedos', lado: 'd', tamanho: 3 }).grau).toBe('impossivel');
    const lido = interpretar(JSON.stringify(v));
    expect(lido.tipo).toBe('ok');
    if (lido.tipo === 'ok') expect(lido.vida.eu.tatuagens).toEqual(v.eu.tatuagens);
  });

  it('save antigo com tatuagens antigas (de sempre e da 12.9) continua idêntico', () => {
    let v = rica(40);
    v = fazer(v, { tipo: 'tatuar', desenho: 'andorinha', regiao: 'antebraco', lado: 'e' });
    v = fazer(v, { tipo: 'tatuar', desenho: 'chapeu_de_palha', regiao: 'biceps', lado: 'd', tamanho: 2 });
    v = fazer(v, { tipo: 'tatuar', desenho: 'polvo', regiao: 'coxa', lado: 'e', tamanho: 3 });
    const antes = JSON.stringify(v.eu.tatuagens);
    const lido = interpretar(JSON.stringify(v));
    expect(lido.tipo).toBe('ok');
    if (lido.tipo !== 'ok') return;
    expect(JSON.stringify(lido.vida.eu.tatuagens)).toBe(antes);
    normalizarTatuagens(lido.vida);
    expect(JSON.stringify(lido.vida.eu.tatuagens)).toBe(antes);
    // E a arte das antigas é a mesma de antes (os desenhos novos só entram no fim do `desenho()`).
    for (const id of ['andorinha', 'chapeu_de_palha', 'polvo']) expect(desenho13(id, { tinta: '#111', cor: c => c, traco: 1, W: 20, H: 20 }), id).toBeUndefined();
  });
});
