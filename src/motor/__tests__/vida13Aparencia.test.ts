/**
 * VIDA 13 — Aparência (motor): os piercings novos (furos, zonas, variedade, vários na mesma zona, trocar/tirar, saves
 * antigos) e a identidade visual (cortes, barbas, tintas, mechas e maquiagem pelo mesmo fluxo do corte; autonomia por
 * idade; nada disso vai para os genes; o normalizador do save).
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { transacao } from '../nucleo';
import { disponibilidade, executar } from '../acoes';
import { BARBAS, CORES_TINTA, CORTES, ITENS_ESTILO, itemEstilo, lugaresDoItem } from '../dados/estilo';
import { COR_DO_METAL, PIERCINGS, REGIOES_DE_PIERCING } from '../dados/piercings129';
import { BRINCOS_13, PIERCINGS_13, REGIOES_13, ZONAS_DE_PIERCING, zonaDoFuro } from '../dados/piercings13';
import { BARBAS_13, CORTES_13, CORES_TINTA_13 } from '../dados/aparencia13';
import { categoriaDoItem } from '../sistemas/lojas';
import { geneticaDe, genesDe } from '../sistemas/identidade';
import { normalizarVida13Aparencia } from '../sistemas/aparencia13';
import { interpretar } from '../save';
import type { Vida } from '../tipos';

const base = (i = 25): Vida => transacao(adulto(i, { semente: 1313, municipioId: 'sao-paulo-sp' }), x => { x.financas.conta = 500_000; x.momento = null; }).vida;
const comprar = (v: Vida, ...ids: string[]) => ids.reduce((w, id) => { const r = executar(w, { tipo: 'comprar_item', itemId: id }); expect(r.vida.eu.estilo!.itens.some(x => x.itemId === id), id).toBe(true); return r.vida; }, v);

describe('13 · piercings: catálogo', () => {
  it('cada joia num furo de uma zona; ids únicos; todos os furos novos têm joias; brincos novos no lóbulo', () => {
    expect(new Set(ITENS_ESTILO.map(x => x.id)).size).toBe(ITENS_ESTILO.length);
    for (const p of PIERCINGS) {
      const it = itemEstilo(p.id)!;
      expect(it.piercing!.regiao).toBe(it.lugar);
      expect(lugaresDoItem(it)).toEqual([p.lugar]);
      expect(zonaDoFuro(p.lugar), p.id).toBeTruthy();
      expect(COR_DO_METAL[p.piercing.metal], p.id).toBeTruthy();
      expect(['joias', 'acessorios']).toContain(categoriaDoItem(it));
    }
    for (const r of REGIOES_13) expect(REGIOES_DE_PIERCING.has(r)).toBe(true);
    expect(new Set(PIERCINGS.map(p => p.lugar))).toEqual(REGIOES_DE_PIERCING);
    for (const b of BRINCOS_13) expect(lugaresDoItem(itemEstilo(b.id)!)).toEqual(['orelha']);
    // Os furos das zonas não se repetem entre zonas.
    const furos = ZONAS_DE_PIERCING.flatMap(z => z.furos);
    expect(new Set(furos).size).toBe(furos.length);
  });

  it('variedade de verdade: formas, metais, acabamentos, faixas de preço; vários furos na orelha, no nariz e na boca', () => {
    expect(PIERCINGS_13.length).toBeGreaterThanOrEqual(40);
    expect(new Set(PIERCINGS.map(p => p.piercing.forma)).size).toBeGreaterThanOrEqual(10);
    expect(new Set(PIERCINGS.map(p => p.piercing.metal))).toEqual(new Set(Object.keys(COR_DO_METAL)));
    expect(PIERCINGS.some(p => p.piercing.acabamento === 'fosco') && PIERCINGS.some(p => p.piercing.acabamento === 'martelado')).toBe(true);
    expect(PIERCINGS.some(p => p.preco < 150) && PIERCINGS.some(p => (p.nivel ?? 0) >= 5)).toBe(true);
    const zona = (z: string) => ZONAS_DE_PIERCING.find(x => x.id === z)!.furos.length;
    expect(zona('orelha')).toBeGreaterThanOrEqual(6);
    expect(zona('nariz')).toBeGreaterThanOrEqual(4);
    expect(zona('boca')).toBeGreaterThanOrEqual(3);
    // Nenhuma duplicata disfarçada: no mesmo furo, nenhuma joia repete forma + metal + pedra + símbolo.
    const chave = new Set(PIERCINGS.map(p => `${p.lugar}|${p.piercing.forma}|${p.piercing.metal}|${p.piercing.pedra ?? ''}|${p.piercing.simbolo ?? ''}`));
    expect(chave.size).toBe(PIERCINGS.length);
  });
});

describe('13 · piercings: usar, trocar, tirar', () => {
  it('a orelha com seis furos e o brinco ao mesmo tempo; trocar a joia de um furo só mexe nele', () => {
    let v = comprar(base(), 'pc_helix_argola', 'pc_industrial_barra_aco', 'pc_tragus_ponto', 'pc_concha_ponto_titanio', 'pc_daith_argola_aco', 'pc_lobulo2_ponto_aco', 'brincos_perola');
    expect(v.eu.visual.piercings).toEqual(['pc_concha_ponto_titanio', 'pc_daith_argola_aco', 'pc_helix_argola', 'pc_industrial_barra_aco', 'pc_lobulo2_ponto_aco', 'pc_tragus_ponto']);
    expect(v.eu.visual.brincos).toBe(true);
    expect(v.eu.visual.modeloBrincos).toBe('brincos_perola');
    v = comprar(v, 'pc_daith_coracao_ouro');
    expect(v.eu.visual.piercings).toContain('pc_daith_coracao_ouro');
    expect(v.eu.visual.piercings).not.toContain('pc_daith_argola_aco');
    expect(v.eu.visual.piercings!.length).toBe(6);
    // Voltar à joia guardada pelo id da peça (o que a seção de piercings manda).
    const guardada = v.eu.estilo!.itens.find(x => x.itemId === 'pc_daith_argola_aco')!;
    expect(guardada.usando).toBe(false);
    v = executar(v, { tipo: 'usar_item', itemId: guardada.itemId, id: guardada.id, usar: true }).vida;
    expect(v.eu.visual.piercings).toContain('pc_daith_argola_aco');
    expect(v.eu.visual.piercings).not.toContain('pc_daith_coracao_ouro');
    // Tirar: a joia fica guardada (continua sua).
    const em = v.eu.estilo!.itens.find(x => x.itemId === 'pc_helix_argola')!;
    v = executar(v, { tipo: 'usar_item', itemId: em.itemId, id: em.id, usar: false }).vida;
    expect(v.eu.visual.piercings).not.toContain('pc_helix_argola');
    expect(v.eu.estilo!.itens.some(x => x.itemId === 'pc_helix_argola')).toBe(true);
  });

  it('as duas narinas, o septo, a ponte, os dois cantos do lábio e o medusa convivem', () => {
    const v = comprar(base(), 'pc_nariz_ponto_aco', 'pc_nariz2_ponto_aco', 'pc_septo_ferradura', 'pc_ponte_barra_aco', 'pc_labio_argola', 'pc_labio2_argola_aco', 'pc_medusa_titanio');
    expect(v.eu.visual.piercings!.length).toBe(7);
  });

  it('menor de 16 não fura nos furos novos; o ouro branco é joalheria', () => {
    expect(disponibilidade(base(15), { tipo: 'comprar_item', itemId: 'pc_concha_ponto_titanio' }).grau).toBe('impossivel');
    expect(categoriaDoItem(itemEstilo('pc_lobulo2_diamante')!)).toBe('joias');
    expect(categoriaDoItem(itemEstilo('pc_industrial_barra_aco')!)).toBe('acessorios');
    expect(categoriaDoItem(itemEstilo('brincos_alargador')!)).toBe('acessorios');
  });

  it('save antigo (12.9) com piercings abre igual; com os furos novos, persiste', () => {
    let v = comprar(base(), 'pc_nariz_ponto_aco', 'pc_helix_trio');
    const r0 = interpretar(JSON.stringify(v));
    expect(r0.tipo === 'ok' && r0.vida.eu.visual.piercings).toEqual(['pc_helix_trio', 'pc_nariz_ponto_aco']);
    v = comprar(v, 'pc_concha_argola_prata', 'pc_medusa_ouro');
    const r = interpretar(JSON.stringify(v));
    expect(r.tipo === 'ok' && r.vida.eu.visual.piercings).toEqual(['pc_concha_argola_prata', 'pc_helix_trio', 'pc_medusa_ouro', 'pc_nariz_ponto_aco']);
  });
});

describe('13 · identidade visual', () => {
  it('os cortes, as barbas e as tintas novas existem no catálogo de sempre', () => {
    for (const c of CORTES_13) expect(CORTES.some(x => x.id === c.id)).toBe(true);
    for (const b of BARBAS_13) expect(BARBAS.some(x => x.id === b.id)).toBe(true);
    for (const c of CORES_TINTA_13) expect(CORES_TINTA).toContain(c);
    expect(CORTES.length).toBeGreaterThanOrEqual(28);
    expect(BARBAS.length).toBeGreaterThanOrEqual(17);
  });

  it('corte novo, barba nova, tinta nova, mechas e maquiagem pelo fluxo da aparência; "nenhum" tira', () => {
    let v = base(30);
    const m = { cabelo: 'undercut', corCabelo: 'roxo', mechas: 'loiro', mechasEstilo: 'ombre', delineado: 'gatinho', batom: 'vermelho', sombraOlhos: 'esfumado', blush: 'pessego' };
    expect(disponibilidade(v, { tipo: 'aparencia', mudanca: m }).grau).toBe('permitido');
    v = executar(v, { tipo: 'aparencia', mudanca: m }).vida;
    expect(v.eu.visual).toMatchObject(m);
    v = executar(v, { tipo: 'aparencia', mudanca: { batom: 'nenhum', mechas: 'nenhum' } }).vida;
    expect(v.eu.visual.batom).toBeUndefined();
    expect(v.eu.visual.mechas).toBeUndefined();
    expect(v.eu.visual.mechasEstilo).toBeUndefined();
    expect(v.eu.visual.delineado).toBe('gatinho');
    expect(disponibilidade(v, { tipo: 'aparencia', mudanca: { batom: 'azul_neon' } }).grau).toBe('impossivel');
    expect(disponibilidade(v, { tipo: 'aparencia', mudanca: { delineado: 'gatinho' } }).grau).toBe('incompativel');
    const h = transacao(adulto(30, { semente: 1313, genero: 'masculino' }), x => { x.momento = null; }).vida;
    expect(disponibilidade(h, { tipo: 'aparencia', mudanca: { barba: 'bigode_guidao' } }).grau).toBe('permitido');
  });

  it('antes dos 13: sem moicano, sem mechas, sem maquiagem; o degradê pode', () => {
    const c = base(11);
    expect(disponibilidade(c, { tipo: 'aparencia', mudanca: { cabelo: 'moicano' } }).grau).toBe('impossivel');
    expect(disponibilidade(c, { tipo: 'aparencia', mudanca: { mechas: 'loiro' } }).grau).toBe('impossivel');
    expect(disponibilidade(c, { tipo: 'aparencia', mudanca: { batom: 'rosa' } }).grau).toBe('impossivel');
    expect(disponibilidade(c, { tipo: 'aparencia', mudanca: { cabelo: 'degrade' } }).grau).toBe('permitido');
  });

  it('nada disso é genética: a tinta nova, as mechas e a maquiagem não vão para os genes', () => {
    let v = base(30);
    const natural = v.eu.visual.corCabelo;
    v = executar(v, { tipo: 'aparencia', mudanca: { corCabelo: 'verde', textura: v.eu.visual.textura === 'liso' ? 'ondulado' : 'liso', mechas: 'rosa', batom: 'vinho' } }).vida;
    const g = geneticaDe(v.eu)!;
    expect(g.corCabelo).toBe(natural);
    for (const k of ['mechas', 'mechasEstilo', 'batom', 'delineado', 'piercings'] as const) expect(g[k]).toBeUndefined();
    expect((genesDe(v.eu) as Record<string, unknown>).mechas).toBeUndefined();
  });

  it('save: o normalizador tira valor que não existe, completa o jeito das mechas, não mexe no resto; save antigo igual', () => {
    const v = base(30);
    const antes = JSON.stringify(v.eu.visual);
    normalizarVida13Aparencia(v);
    expect(JSON.stringify(v.eu.visual)).toBe(antes);
    Object.assign(v.eu.visual, { batom: 'inexistente', delineado: 'fino', mechas: 'loiro' });
    const r = interpretar(JSON.stringify(v));
    expect(r.tipo).toBe('ok');
    if (r.tipo === 'ok') {
      expect(r.vida.eu.visual.batom).toBeUndefined();
      expect(r.vida.eu.visual.delineado).toBe('fino');
      expect(r.vida.eu.visual.mechasEstilo).toBe('luzes');
    }
  });
});
