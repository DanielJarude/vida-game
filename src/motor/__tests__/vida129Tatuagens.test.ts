/**
 * VIDA 12.9 — o catálogo de tatuagens cresce: os desenhos novos (cultura pop, autorais, bichos e natureza) têm id único,
 * arte própria, regiões e tamanhos que cabem no corpo, e o filtro do estúdio os encontra. Os saves antigos não mudam.
 */
import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { adulto } from './cenarios';
import { transacao } from '../nucleo';
import { disponibilidade, executar } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { interpretar } from '../save';
import { DESENHOS, NOME_ESTILO, REGIOES, regioesDoDesenho, desenhoDeTatuagem, corPadraoDe } from '../dados/tatuagens';
import { DESENHOS_129, REFERENCIAS_129, TEMA_DOS_ANTIGOS, temaDoDesenho } from '../dados/tatuagens129';
import { DESENHOS_13 } from '../dados/tatuagens13';
import { normalizarTatuagens, tatuagensDe, tatuagensNaFigura } from '../sistemas/tatuagens';
import { desenho129 } from '../../ui/avatar/tatuagens129';
import { DesenhoDaTatuagem, caixaNativa } from '../../ui/avatar/tatuagens';
import { desenhosDoFiltro } from '../../ui/jogo/Tatuagens';
import type { Acao } from '../acoes';
import type { Vida } from '../tipos';

const rica = (i = 30): Vida => transacao(adulto(i, { semente: 1291, municipioId: 'sao-paulo-sp' }), x => { x.financas.conta = 5_000_000; x.momento = null; }).vida;
const fazer = (v: Vida, a: Acao) => { const d = disponibilidade(v, a); expect(podeTentar(d), d.motivo).toBe(true); return executar(v, a).vida; };
/** O catálogo de antes da 12.9 (83 desenhos soltos e 5 peças inteiras). */
const DESENHOS_ANTES = 88;
const NOVOS = new Set(DESENHOS_129.map(d => d.id));
// VIDA 13: os desenhos da 13 (`dados/tatuagens13`) também não são "de antes da 12.9".
const DA_13 = new Set(DESENHOS_13.map(d => d.id));
const ANTIGOS = DESENHOS.filter(d => !NOVOS.has(d.id) && !DA_13.has(d.id));
const arte = (id: string) => { const d = desenhoDeTatuagem(id)!; const [W, H] = caixaNativa(d); return renderToStaticMarkup(createElement('svg', { viewBox: `0 0 ${W} ${H}` }, createElement(DesenhoDaTatuagem, { id, tinta: '#111', cor: (c: string) => c }))); };
const FALLBACK = renderToStaticMarkup(createElement('svg', { viewBox: '0 0 20 20' }, createElement(DesenhoDaTatuagem, { id: 'nao_existe', tinta: '#111', cor: (c: string) => c })));

describe('VIDA 12.9 · catálogo de tatuagens', () => {
  it('mais de 120 desenhos novos, ids únicos no catálogo inteiro, nomes sem repetir', () => {
    expect(DESENHOS_129.length).toBeGreaterThanOrEqual(120);
    expect(ANTIGOS.length).toBe(DESENHOS_ANTES);
    const ids = DESENHOS.map(d => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    const nomes = DESENHOS.map(d => d.nome.toLowerCase());
    expect(new Set(nomes).size).toBe(nomes.length);
    for (const d of DESENHOS_129) expect(desenhoDeTatuagem(d.id)).toBe(d);
  });

  it('todo desenho novo tem arte própria (não o círculo de reserva), e todos os antigos continuam com a sua', () => {
    for (const d of DESENHOS_129) {
      const [W, H] = caixaNativa(d);
      expect(desenho129(d.id, { tinta: '#111', cor: c => c, traco: 1, W, H }), d.id).toBeDefined();
      expect(arte(d.id), d.id).not.toBe(FALLBACK.replace('0 0 20 20', `0 0 ${W} ${H}`));
    }
    expect(desenho129('nao_existe', { tinta: '#111', cor: c => c, traco: 1, W: 20, H: 20 })).toBeUndefined();
    for (const d of ANTIGOS) { const [W, H] = caixaNativa(d); expect(arte(d.id), d.id).not.toBe(FALLBACK.replace('0 0 20 20', `0 0 ${W} ${H}`)); }
    // Artes diferentes de verdade: nenhum par de desenhos novos sai com o mesmo SVG.
    const svgs = DESENHOS_129.map(d => arte(d.id));
    expect(new Set(svgs).size).toBe(svgs.length);
  });

  it('estilos, tamanhos e regiões válidos: cada tamanho oferecido cabe em algum lugar do corpo', () => {
    for (const d of DESENHOS_129) {
      expect(NOME_ESTILO[d.estilo], d.id).toBeTruthy();
      expect(d.tamanhos.length, d.id).toBeGreaterThan(0);
      expect(d.tamanhos, d.id).toContain(d.tamanho);
      expect(d.tamanhos.includes(4), d.id).toBe(false);
      for (const t of d.tamanhos) {
        const rs = regioesDoDesenho(d, t);
        expect(rs.length, `${d.id} ${t}`).toBeGreaterThan(0);
        for (const r of rs) expect(REGIOES[r]).toBeDefined();
      }
      expect(d.descricao.length, d.id).toBeGreaterThan(10);
      if (d.estilo === 'cultura_pop') expect(d.referencia, d.id).toBeTruthy();
      else expect(d.referencia, d.id).toBeUndefined();
    }
    // As categorias: cultura pop (com a obra), bichos, natureza e os autorais.
    const pop = DESENHOS_129.filter(d => d.estilo === 'cultura_pop');
    expect(pop.length).toBeGreaterThanOrEqual(60);
    expect(REFERENCIAS_129.length).toBeGreaterThanOrEqual(25);
    for (const obra of ['Pokémon', 'Naruto', 'Dragon Ball', 'One Piece', 'Studio Ghibli', 'Breaking Bad', 'Game of Thrones', 'Stranger Things', 'The Walking Dead', 'Peaky Blinders', 'Star Wars', 'Harry Potter', 'O Senhor dos Anéis', 'Matrix', 'Jurassic Park', 'Marvel', 'DC', 'Jogos Vorazes', 'Piratas do Caribe', 'The Office'])
      expect(REFERENCIAS_129, obra).toContain(obra);
    expect(DESENHOS_129.filter(d => d.tema === 'animais').length).toBeGreaterThanOrEqual(30);
    expect(DESENHOS_129.filter(d => d.tema === 'natureza').length).toBeGreaterThanOrEqual(10);
    expect(DESENHOS_129.filter(d => !d.tema && d.estilo !== 'cultura_pop').length).toBeGreaterThanOrEqual(35);
    for (const id of Object.keys(TEMA_DOS_ANTIGOS)) expect(desenhoDeTatuagem(id), id).toBeDefined();
  });

  it('o filtro do estúdio encontra os novos: estilo, tema, obra e busca sem acento', () => {
    const pop = desenhosDoFiltro({ estilo: 'cultura_pop' });
    // VIDA 13: o catálogo de cultura pop cresceu (`dados/tatuagens13`); o filtro encontra todos, os da 12.9 inclusive.
    expect(pop.length).toBe(DESENHOS.filter(d => d.estilo === 'cultura_pop').length);
    for (const d of DESENHOS_129.filter(x => x.estilo === 'cultura_pop')) expect(pop).toContain(d);
    expect(desenhosDoFiltro({ estilo: 'cultura_pop', referencia: 'Harry Potter' }).map(d => d.id)).toContain('raio_e_oculos');
    expect(desenhosDoFiltro({ busca: 'senhor dos aneis' }).map(d => d.id)).toContain('anel_com_inscricao');
    expect(desenhosDoFiltro({ busca: 'TORDO' }).map(d => d.id)).toEqual(['tordo_e_flecha']);
    const bichos = desenhosDoFiltro({ tema: 'animais' }).map(d => d.id);
    expect(bichos).toContain('polvo');
    expect(bichos).toContain('andorinha'); // os antigos também têm tema
    expect(desenhosDoFiltro({ tema: 'natureza' }).every(d => temaDoDesenho(d) === 'natureza')).toBe(true);
    for (const e of ['neotradicional', 'surrealista', 'conceitual', 'pontilhismo', 'sketch', 'aquarela'] as const) expect(desenhosDoFiltro({ estilo: e }).length, e).toBeGreaterThan(0);
    // As peças inteiras continuam fora do catálogo de desenhos soltos.
    expect(desenhosDoFiltro({}).some(d => d.tamanho === 4)).toBe(false);
    expect(desenhosDoFiltro({ busca: 'xyzw' })).toHaveLength(0);
  });

  it('tatuar um desenho novo funciona como os antigos: posição, rotação, escala, cor, e vai para o save', () => {
    let v = rica();
    v = fazer(v, { tipo: 'tatuar', desenho: 'chapeu_de_palha', regiao: 'antebraco', lado: 'd', tamanho: 2, ajuste: { x: 0, y: -0.6, escala: 1, rot: 10, espelhar: true }, cor: 'colorida' });
    v = fazer(v, { tipo: 'tatuar', desenho: 'polvo', regiao: 'coxa', lado: 'e', tamanho: 3 });
    v = fazer(v, { tipo: 'tatuar', desenho: 'cubos_isometricos', regiao: 'pulso', lado: 'e', tamanho: 1, cor: 'preta', tom: 'azul' });
    const xs = tatuagensDe(v);
    expect(xs.map(x => x.desenho).sort()).toEqual(['chapeu_de_palha', 'cubos_isometricos', 'polvo']);
    expect(tatuagensNaFigura(v)).toHaveLength(3);
    // Grande demais para o pulso, como os de sempre.
    expect(disponibilidade(v, { tipo: 'tatuar', desenho: 'polvo', regiao: 'pulso', lado: 'd', tamanho: 3 }).grau).toBe('impossivel');
    const lido = interpretar(JSON.stringify(v));
    expect(lido.tipo).toBe('ok');
    if (lido.tipo === 'ok') expect(lido.vida.eu.tatuagens).toEqual(v.eu.tatuagens);
    // A cor padrão dos novos segue a regra de sempre.
    expect(corPadraoDe(desenhoDeTatuagem('chuva_de_codigo')!)).toBe('colorida');
    expect(corPadraoDe(desenhoDeTatuagem('kunai')!)).toBe('preta');
  });

  it('cobrir uma tatuagem antiga com um desenho neotradicional é aceito; com fine line, não', () => {
    let v = rica();
    v = fazer(v, { tipo: 'tatuar', desenho: 'coracaozinho', regiao: 'biceps', lado: 'd', tamanho: 1 });
    const velha = tatuagensDe(v)[0];
    const fraca = disponibilidade(v, { tipo: 'tatuar', desenho: 'libelula', regiao: 'biceps', lado: 'd', tamanho: 2, cobre: velha.id });
    expect(fraca.grau).toBe('incompativel');
    v = fazer(v, { tipo: 'tatuar', desenho: 'coruja_neo', regiao: 'biceps', lado: 'd', tamanho: 3, cobre: velha.id });
    expect(tatuagensDe(v).some(x => x.desenho === 'coruja_neo')).toBe(true);
  });

  it('save antigo com tatuagens antigas continua igual (e o id desconhecido não quebra)', () => {
    let v = rica(40);
    v = fazer(v, { tipo: 'tatuar', desenho: 'andorinha', regiao: 'antebraco', lado: 'e' });
    v = fazer(v, { tipo: 'tatuar', desenho: 'leao_realista', regiao: 'biceps', lado: 'd' });
    v = fazer(v, { tipo: 'tatuar', desenho: 'nome_cursivo', regiao: 'antebraco', lado: 'd', texto: 'Helena' });
    const antes = JSON.stringify(v.eu.tatuagens);
    const lido = interpretar(JSON.stringify(v));
    expect(lido.tipo).toBe('ok');
    if (lido.tipo !== 'ok') return;
    expect(JSON.stringify(lido.vida.eu.tatuagens)).toBe(antes);
    normalizarTatuagens(lido.vida);
    expect(JSON.stringify(lido.vida.eu.tatuagens)).toBe(antes);
    // Um id que não existe (de uma versão futura) não derruba a leitura.
    const w = structuredClone(v);
    (w.eu.tatuagens as { desenho: string }[])[0].desenho = 'desenho_do_futuro';
    expect(interpretar(JSON.stringify(w)).tipo).toBe('ok');
  });
});
