/**
 * HOTFIX 11.5.1 — as compras (os segmentos, o índice, a busca e os filtros) e as tatuagens (o que cabe, quanto custa,
 * tirar no laser, o save).
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { transacao } from '../nucleo';
import { executar, disponibilidade } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { interpretar } from '../save';
import { ESTABELECIMENTOS, marca } from '../dados/lojas';
import { DESENHOS, LOCAIS } from '../dados/tatuagens';
import { buscarLojas, buscarNasLojas, indiceDeCompras, lojasDaVida, normalizarBusca, ofertasDaLoja, SEGMENTOS, segmentoDaCategoria, segmentosDaLoja } from '../sistemas/lojas';
import { ocupado, precoDaRemocao, precoDaTatuagem, tatuagensDe, tatuagensNaFigura } from '../sistemas/tatuagens';
import { sincronizarVisual } from '../sistemas/estilo';
import type { Vida } from '../tipos';

const rica = (i = 30): Vida => transacao(adulto(i, { semente: 1151, municipioId: 'sao-paulo-sp' }), x => { x.financas.conta = 2_000_000; x.momento = null; }).vida;

describe('HOTFIX 11.5.1 · compras: segmentos, índice e busca', () => {
  it('toda categoria tem um segmento; toda loja da cidade aparece em pelo menos um segmento de lojas', () => {
    for (const e of ESTABELECIMENTOS) for (const c of e.categorias) expect(SEGMENTOS.some(s => s.categorias.includes(c))).toBe(true);
    for (const e of ESTABELECIMENTOS) expect(segmentosDaLoja(e).length).toBeGreaterThan(0);
    expect(segmentosDaLoja(ESTABELECIMENTOS.find(e => e.id === 'grifes')!)).toContain('luxo');
    expect(segmentoDaCategoria('otica')).toBe('moda');
    expect(segmentoDaCategoria('eletrodomesticos')).toBe('casa');
  });

  it('o índice junta as ofertas de todas as lojas da vida: nenhuma oferta some, e cada produto vem do mais barato ao mais caro', () => {
    const v = rica();
    const ind = indiceDeCompras(v);
    const total = lojasDaVida(v).reduce((s, e) => s + ofertasDaLoja(v, e.id).length, 0);
    expect(ind.reduce((s, x) => s + x.ofertas.length, 0)).toBe(total);
    for (const x of ind) { expect(x.ofertas.map(o => o.preco)).toEqual([...x.ofertas.map(o => o.preco)].sort((a, b) => a - b)); expect(x.min).toBe(x.ofertas[0].preco); }
  });

  it('a busca acha pelo nome sem acento, pela marca e pela loja; filtra por categoria, marca e preço; ordena', () => {
    const v = rica();
    const ind = indiceDeCompras(v);
    expect(normalizarBusca('Óculos ESCUROS')).toBe('oculos escuros');
    const oculos = buscarNasLojas(ind, { texto: 'oculos' });
    expect(oculos.length).toBeGreaterThan(3);
    expect(oculos.every(r => r.categoria === 'otica')).toBe(true);
    const nike = buscarNasLojas(ind, { texto: 'nike' });
    expect(nike.length).toBeGreaterThan(0);
    expect(nike.every(r => r.melhor.marca === 'nike')).toBe(true);
    const soNike = buscarNasLojas(ind, { marca: 'nike', categoria: 'calcados' });
    expect(soNike.every(r => r.categoria === 'calcados' && r.melhor.marca === 'nike')).toBe(true);
    const baratos = buscarNasLojas(ind, { categoria: 'eletronicos', precoMax: 1000 });
    expect(baratos.every(r => r.melhor.preco <= 1000)).toBe(true);
    const menor = buscarNasLojas(ind, { segmento: 'tecnologia', ordem: 'menor' }).map(r => r.melhor.preco);
    expect(menor).toEqual([...menor].sort((a, b) => a - b));
    const maior = buscarNasLojas(ind, { segmento: 'tecnologia', ordem: 'maior' }).map(r => r.melhor.preco);
    expect(maior).toEqual([...maior].sort((a, b) => b - a));
    // Relevância: o nome que começa com o texto vem antes.
    const tenis = buscarNasLojas(ind, { texto: 'tênis' });
    expect(normalizarBusca(tenis[0].nome).startsWith('tenis')).toBe(true);
    expect(buscarNasLojas(ind, { texto: 'xyzzyx' })).toEqual([]);
    expect(buscarLojas(v, 'ótica').map(e => e.id)).toContain('otica');
    expect(marca('nike')?.nome).toBe('Nike');
  });

  it('comprar pela oferta de uma loja e marca registra as duas e desconta o preço daquela oferta', () => {
    const v = rica();
    const r = buscarNasLojas(indiceDeCompras(v), { texto: 'violão' })[0];
    const o = r.ofertas[r.ofertas.length - 1];
    const antes = v.financas.conta;
    const n = executar(v, { tipo: 'comprar_coisa', coisaId: r.produto.id, loja: o.loja, ...(o.marca ? { marca: o.marca } : {}) }).vida;
    const c = n.financas.coisas!.find(x => x.coisaId === r.produto.id)!;
    expect(c.loja).toBe(o.loja);
    expect(c.marca).toBe(o.marca);
    expect(antes - n.financas.conta).toBe(o.preco);
  });
});

describe('HOTFIX 11.5.1 · tatuagens', () => {
  it('menor de idade não tatua; o desenho tem que caber na parte (e no lado)', () => {
    expect(disponibilidade(rica(17), { tipo: 'tatuar', desenho: 'andorinha', local: 'antebraco', lado: 'd' }).grau).toBe('impossivel');
    const v = rica();
    expect(podeTentar(disponibilidade(v, { tipo: 'tatuar', desenho: 'andorinha', local: 'antebraco', lado: 'd' }))).toBe(true);
    expect(disponibilidade(v, { tipo: 'tatuar', desenho: 'andorinha', local: 'antebraco' }).grau).toBe('impossivel'); // sem lado
    expect(disponibilidade(v, { tipo: 'tatuar', desenho: 'pantera', local: 'mao', lado: 'd' }).grau).toBe('impossivel'); // não é lugar dela
    expect(disponibilidade(v, { tipo: 'tatuar', desenho: 'dragao_costas', local: 'braco', lado: 'd' }).grau).toBe('impossivel');
    for (const d of DESENHOS) for (const l of d.locais) expect(LOCAIS[l]).toBeDefined();
  });

  it('várias tatuagens até a parte encher; o fechamento pede o braço livre; tirar no laser clareia em um ano e libera o espaço', () => {
    let v = rica();
    const t = (desenho: string, local: 'antebraco' | 'braco' | 'costas', lado?: 'e' | 'd') => { v = executar(v, { tipo: 'tatuar', desenho, local, ...(lado ? { lado } : {}) }).vida; };
    const antes = v.financas.conta;
    t('ramo_fino', 'antebraco', 'e'); t('nome_cursivo', 'antebraco', 'e'); t('coracaozinho', 'antebraco', 'e');
    expect(tatuagensDe(v)).toHaveLength(3);
    expect(antes - v.financas.conta).toBe(['ramo_fino', 'nome_cursivo', 'coracaozinho'].reduce((s, d) => s + precoDaTatuagem(v, d), 0));
    expect(ocupado(v, 'antebraco', 'e')).toBe(3);
    // O antebraço esquerdo está cheio; o direito, livre.
    expect(disponibilidade(v, { tipo: 'tatuar', desenho: 'lua_estrelas', local: 'antebraco', lado: 'e' }).grau).toBe('incompativel');
    expect(podeTentar(disponibilidade(v, { tipo: 'tatuar', desenho: 'lua_estrelas', local: 'antebraco', lado: 'd' }))).toBe(true);
    // O fechamento do braço esquerdo não cabe (o antebraço já tem tatuagem); o direito, sim — e ele ocupa o braço inteiro.
    expect(disponibilidade(v, { tipo: 'tatuar', desenho: 'fechamento', local: 'braco', lado: 'e' }).grau).toBe('incompativel');
    t('fechamento', 'braco', 'd');
    expect(ocupado(v, 'antebraco', 'd')).toBe(LOCAIS.antebraco.capacidade);
    t('dragao_costas', 'costas');
    expect(tatuagensDe(v)).toHaveLength(5);
    // O laser: cobra mais que tatuar; a tinta clareia durante um ano; depois some e o espaço volta.
    const alvo = tatuagensDe(v).find(x => x.desenho === 'nome_cursivo')!;
    const c0 = v.financas.conta;
    v = executar(v, { tipo: 'remover_tatuagem', id: alvo.id }).vida;
    expect(c0 - v.financas.conta).toBe(precoDaRemocao(v, alvo));
    expect(precoDaRemocao(v, alvo)).toBeGreaterThan(precoDaTatuagem(v, 'nome_cursivo'));
    expect(ocupado(v, 'antebraco', 'e')).toBe(2);
    v = transacao(v, x => { x.t += 6; }).vida;
    expect(tatuagensNaFigura(v).find(x => x.id === alvo.id)!.clareou).toBeCloseTo(0.5, 1);
    v = transacao(v, x => { x.t += 7; }).vida;
    expect(tatuagensDe(v).some(x => x.id === alvo.id)).toBe(false);
    // A idade de cada tatuagem anda com a vida (a figura a desbota).
    expect(tatuagensNaFigura(v)[0].anos).toBeGreaterThan(1);
    // O save guarda tudo.
    const lido = interpretar(JSON.stringify(v));
    expect(lido.tipo === 'ok' && lido.vida.eu.tatuagens).toEqual(v.eu.tatuagens);
    // A biografia lembra a primeira.
    expect(v.biografia.some(e => /primeira tatuagem/i.test(e.texto))).toBe(true);
  });

  it('o save antigo (sem tatuagens, sem modelo de óculos) carrega; o modelo em uso aparece sozinho na carga', () => {
    let v = rica();
    v = executar(v, { tipo: 'comprar_item', itemId: 'oculos_juliet' }).vida;
    if (!v.eu.estilo!.itens.find(x => x.itemId === 'oculos_juliet')!.usando) v = executar(v, { tipo: 'usar_item', itemId: 'oculos_juliet', usar: true }).vida;
    expect(v.eu.visual.modeloOculos).toBe('oculos_juliet');
    // Como era antes do hotfix: o tipo sem o modelo.
    delete v.eu.visual.modeloOculos;
    delete v.eu.tatuagens;
    const lido = interpretar(JSON.stringify(v));
    expect(lido.tipo).toBe('ok');
    if (lido.tipo === 'ok') { expect(lido.vida.eu.visual.modeloOculos).toBe('oculos_juliet'); expect(lido.vida.eu.tatuagens).toBeUndefined(); }
    sincronizarVisual(v);
    expect(v.eu.visual.modeloOculos).toBe('oculos_juliet');
  });
});
